'use strict';

var isObject = require('mout/lang/isObject'),
	isString = require('mout/lang/isString'),
	forOwn = require('mout/object/forOwn'),
	indexOf = require('mout/array/indexOf'),
	hash = require('./hash'),
	db = require('./db');

// valid modes per type
var types = {
	markup: ['html', 'jade'],
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

	this.data = {meta: {}};

	if (isObject(raw.meta)){
		if (isString(raw.meta.hash)){
			raw.meta.hash = raw.meta.hash.replace(/^\s+|\s+$/, '');
			if (raw.meta.hash.length == 5){
				this.data.meta.hash = raw.meta.hash;
			}
		}
		if (parseInt(raw.meta.revision)){
			this.data.meta.revision = raw.meta.revision;
		}
	}

	var type, mode, body;
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

		if (this.data.meta.hash){
			coll.find({'meta.hash': this.data.meta.hash}).sort({'meta.revision': -1}).toArray(function(err, docs){
				if (err){
					return cb(err);
				}

				this.data.meta.revision = docs[0].meta.revision + 1;
				coll.insert(this.data, function(err, docs){
					if (err){
						return cb(err);
					}

					cb(null, docs[0]);
				}.bind(this));
			}.bind(this));

			return;
		}

		hash.unique(coll, function(err, hash){
			this.data.meta.hash = hash;
			this.data.meta.revision = 1;
			coll.insert(this.data, function(err, docs){
				db.close();
				if (err){
					return cb(err);
				}

				cb(null, docs[0]);
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

/**
 * @param {String} hash
 * @param {Number} revision
 */
Bundle.find = function(hash, revision, cb){
	if (revision && !cb){
		cb = revision;
		revision = 0;
	}

	db.getConnection(function(err, db){
		var coll = db.collection('bundle'),
			query = {'meta.hash': hash};

		if (revision > 0){
			query['meta.revision'] = revision;
			coll.findOne(query, function(err, doc){
				db.close();
				if (err || !doc){
					cb('Not found');
				} else {
					cb(null, new Bundle(doc));
				}
			});
		} else {
			coll.find(query)
			.sort({'meta.revision': -1})
			.toArray(function(err, docs){
				if (err || !docs || !docs.length){
					cb('Not found');
				} else {
					cb(null, new Bundle(docs[0]));
				}
			});
		}
	});
};

module.exports = Bundle;
