var express = require('express');
var bodyParser = require('body-parser')

var Timeline = require('./pebble-api-node/index');

var app = express();
app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
})); 

var timeline = new Timeline({
  apiRoot: 'https://timeline.getpebble.com'
});

app.post('/senduserpin/:userToken', function(req, res) {
  var userToken = req.params.userToken;
  var packages  = req.body.packages;
  
  packages.forEach(function(pkg) {
    var id = parseInt(Math.random() * (999999 - 100000) + 100000).toString();

    var pin = new Timeline.Pin({
      id: id,
      time: new Date(Date.parse(pkg.date) + 43200000), // will always be noon the day of delivery
      layout: new Timeline.Pin.Layout({
        type: Timeline.Pin.LayoutType.genericPin,
        tinyIcon: 'system://images/TIMELINE_MAIL_TINY',
        title: pkg.name
      })
    });

    timeline.sendUserPin(userToken, pin, function (err, body, resp) {
      if(err) {
        return console.error(err);
      }
      console.log(body);
    });
  });

  res.send('Success');
});

// start the webserver
var server = app.listen(app.get('port'), function () {
  console.log('Package Tracker server listening on port %s', app.get('port'));
});
