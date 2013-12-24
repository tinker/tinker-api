'use strict';

var isObject = require('mout/lang/isObject'),
	isString = require('mout/lang/isString'),
	forOwn = require('mout/object/forOwn'),
	indexOf = require('mout/array/indexOf'),
	hash = require('./hash'),
	db = require('./db');

// valid modes per type
var types = {
	markup: ['html'],
	style: ['css', 'scss'],
	behavior: ['js']
};

/**
 * Create a new bundle
 * @param {Object} raw
 */
var Bundle = function(raw){
	if (!(this instanceof Bundle)){
		return new Bundle(raw);
	}

	if (!isObject(raw)){
		throw new Error('No raw data provided');
	}
	if (!raw.code || !isObject(raw.code)){
		throw new Error('No code found');
	}

	var type, mode, body;
	this.data = {};
	forOwn(types, function(modes, t){
		if (!isObject(raw.code[t])) return;

		type = raw.code[t];
		mode = isString(type.mode) && indexOf(modes, type.mode) > -1;
		body = isString(type.body) && type.body !== '';
		if (mode && body){
			if (!this.data.code) this.data.code = {};

			this.data.code[t] = {
				mode: type.mode,
				body: type.body
			};
		}
	}.bind(this));

	if (!this.data.code){
		throw new Error('No code found');
	}
};

/**
 * Write the bundle to the database
 */
Bundle.prototype.write = function(cb){
	db.getConnection(function(err, db){
		var coll = db.collection('bundle');
		hash.unique(coll, function(err, hash){
			if (!this.data.meta){
				this.data.meta = {};
			}
			this.data.meta.hash = hash;
			coll.insert(this.data, function(err, docs){
				db.close();
				if (err){
					cb(err);
				} else {
					cb(null, docs[0]);
				}
			});
		}.bind(this));
	}.bind(this));
};

/**
 *
 */
Bundle.prototype.toJSON = function(){
	return this.data;
};

module.exports = Bundle;

