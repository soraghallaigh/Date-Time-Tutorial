var util = require('util');
var request = require('request');
var jsdom = require("jsdom");

exports.getCurrentTime = function(params, cb) {

  request({uri : 'http://www.timeanddate.com/worldclock/city.html?n=78'}, function(err, res, body){
    // Run some jQuery on a html fragment
    jsdom.env(
    body,
    ["http://code.jquery.com/jquery.js"],
    function(errors, window) {
      var ct = window.$('#ct').text();
      console.log("contents of the current time div:", ct);
      return cb(errors, { response : ct });
    }
    );
  });
};
