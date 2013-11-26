'use strict';

var typeOf = require('prime/type');

var BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generate a hash
 * @param {Number} length
 */
var generate = function(length){
	var hash = '';
	length = length || 5;
	while (length){
		hash += BASE62.charAt(Math.floor(Math.random() * BASE62.length));
		length--;
	}
	return hash;
};

/**
 * Generate a unique hash not found in given collection
 * @param {Collection} coll
 * @param {Number} length
 * @param {Function} cb
 */
var unique = function(coll, length, cb){
	if (typeOf(length) == 'function'){
		cb = length;
		length = null;
	}
	var hash = generate(length);
	coll.findOne({meta: {hash: hash}}, function(err, doc){
		if (!doc){
			cb(null, hash);
		} else {
			unique(coll, length, cb);
		}
	});
};

module.exports = {
	generate: generate,
	unique: unique
};

