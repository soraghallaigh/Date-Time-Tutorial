var util = require('util');
var request = require('request');

exports.getCurrentTime = function(params, cb) {

  request({uri : 'http://www.timeanddate.com/worldclock/city.html?n=78'}, function(err, res, body){
    return cb(err, { response : body });
  });
};
