var API_ROOT = 'http://localhost:5000';
var oauth = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXX';

Pebble.addEventListener('ready', function() {
  getPackages();
  doTimeline();
});

var getPackages = function() {
  var request = new XMLHttpRequest();
  request.open('GET',
               'https://api.slice.com/api/v1/shipments',
               true);
  request.setRequestHeader('Authorization', oauth);
  request.onload = sendPackages;
  request.send();
};

var sendPackages = function() {
  var response = JSON.parse(this.responseText);
  var pkgs = getCurrentPackages(response.result);
  var hash = pkgArrayToPebbleHash(pkgs);
  Pebble.sendAppMessage(hash);
};

var getCurrentPackages = function(pkgs, json) {
  current = [];
  var oneWeekAgo = (new Date).getTime() - 604800000;
  pkgs.forEach(function(pkg) {
    if(pkg.updateTime > oneWeekAgo) {
      current.push(pkg.description.slice(0, 30) + '|' + pkg.shippingEstimate.minDate);
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
    sendToken(token, oauth);
	}, function (error) {
		console.log('Error getting timeline token: ' + error);
	});
};

var sendToken = function(token, oauth) {
  var request = new XMLHttpRequest();
  request.open('GET', API_ROOT + '/senduserpin/' + token + '/' + oauth, true);
	request.onload = function() {
		console.log('senduserpin server response: ' + request.responseText);
	};
	request.send();
}
