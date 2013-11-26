'use strict';

var MongoClient = require('mongodb').MongoClient;

/**
 *
 */
var getConnection = function(cb){
	MongoClient.connect('mongodb://127.0.0.1:27017/tinker', cb);
};

module.exports = {
	getConnection: getConnection
};

