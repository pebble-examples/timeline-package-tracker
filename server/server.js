var express = require('express');
var request = require('request');

var Timeline = require('pebble-api');

var app = express();
app.set('port', (process.env.PORT || 5000));

var timeline = new Timeline();

var users = {};

app.get('/senduserpin/:userToken/:oauth', function(req, res) {
  var userToken = req.params.userToken;
  var oauth     = req.params.oauth;

  users[userToken] = {};
  users[userToken]['oauth'] = oauth; // store user
  users[userToken]['packages'] = [];

  res.send('Success');
});

setInterval(function() {
  Object.keys(users).forEach(function(user) {
    var userToken = user;
    var oauth     = users[user]['oauth'];
    getPackages(oauth, userToken);
  });
}, 6000);

var getPackages = function(oauth, userToken) {
  var options = {
      url: 'https://api.slice.com/api/v1/shipments',
      headers: { 'Authorization': oauth }
  };
  
  request(options, function(error, response, body) {
    var response = JSON.parse(body);
    var pkgs = getCurrentPackages(response.result);
    pkgs.forEach(function(pkg) {
      var found = false;
      users[userToken]['packages'].forEach(function(oldPkg) {
        if(oldPkg.id === pkg.id) {
          found = true;
        }
      });
      if(!found) {
        users[userToken]['packages'].push(pkg) // we have a new package, sove it
        sendPin(pkg, userToken); // and send it as a pin
      }
    });
  });
};

var getCurrentPackages = function(pkgs) {
  current = [];
  var oneWeekAgo = (new Date).getTime() - 604800000;
  pkgs.forEach(function(pkg) {
    if(pkg.updateTime > oneWeekAgo) {
      current.push({'name': pkg.description, 'date': pkg.shippingEstimate.minDate, 'id': pkg.trackingNumber});
    }
  });
  return current.slice(0, 3);
};

var sendPin = function(pkg, userToken) {
  var pin = new Timeline.Pin({
    id: pkg.id,
    time: new Date(Date.parse(pkg.date) + 43200000), // will always be noon the day of delivery
    layout: new Timeline.Pin.Layout({
      type: Timeline.Pin.LayoutType.GENERIC_PIN,
      tinyIcon: Timeline.Pin.Icon.MAIL,
      title: pkg.name
    })
  });

  timeline.sendUserPin(userToken, pin, function (err, body, resp) {
    if(err) {
      return console.error(err);
    }
    console.log(body);
  });
};

// start the webserver
var server = app.listen(app.get('port'), function () {
  console.log('Package Tracker server listening on port %s', app.get('port'));
});
