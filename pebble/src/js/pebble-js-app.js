var API_ROOT = 'http://localhost:5000';
var userToken = null;

Pebble.addEventListener('ready', function() {
  getPackages();
  doTimeline();
});

var getPackages = function(callback) {
  var request = new XMLHttpRequest();
  request.open('GET',
               'https://api.slice.com/api/v1/shipments',
               true);
  request.setRequestHeader('Authorization', 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
  request.onload = callback;
  request.send();
};

var sendPackages = function() {
  var response = JSON.parse(this.responseText);
  var pkgs = getCurrentPackages(response.result, false);
  var hash = pkgArrayToPebbleHash(pkgs);
  Pebble.sendAppMessage(hash);
};

var getCurrentPackages = function(pkgs, json) {
  current = [];
  var oneWeekAgo = (new Date).getTime() - 604800000;
  pkgs.forEach(function(pkg) {
    if(pkg.updateTime > oneWeekAgo) {
      if(json) {
        current.push({'name': pkg.description, 'date': pkg.shippingEstimate.minDate});
      } else {
        current.push(pkg.description.slice(0, 30) + '|' + pkg.shippingEstimate.minDate);
      }
    }
  });
  return current.slice(0, 3);
};

var pkgArrayToPebbleHash = function(array) {
  hash = {};
  for(var i = 0; i < array.length; i++) {
      var key = 'pkg_' + (i+1);
      hash[key] = array[i];
  }
  hash['pkg_count'] = array.length;
  return hash;
};

var doTimeline = function(packages) {
	Pebble.getTimelineToken(function (token) {
    userToken = token;
    getPackages(sendToken);
	}, function (error) {
		console.log('Error getting timeline token: ' + error);
	});
};

var sendToken = function() {
  var response = JSON.parse(this.responseText);
  var pkgs = getCurrentPackages(response.result, true);
  var request = new XMLHttpRequest();
	request.open('POST', API_ROOT + '/senduserpin/' + userToken, true);
  request.setRequestHeader('Content-Type', 'application/json');
	request.onload = function() {
		console.log('senduserpin server response: ' + request.responseText);
	};
	request.send(JSON.stringify({'packages': pkgs}));
}

