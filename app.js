'use strict';

var express = require('express'),
	Bundle = require('./lib/bundle'),
	config = require('./lib/config'),
	argv = require('optimist').argv;

if (!config.load(__dirname + '/config.json')){
	console.log('Failed to load config file');
	process.exit(1);
}

var app = express()
	.use(express.bodyParser())
	.use(function(req, res, next){
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Headers', 'content-type,x-requested-with');
		res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
		next();
	});

app.post(/^\/bundles(?:\/([A-Za-z0-9]{5}))?/, function(req, res){
	var hash = req.params[0],
		data = req.body || {};

	if (req.get('content-type') !== 'application/json'){
		res.json(403, {error: 'Invalid content type, only accepting application/json'});
		return;
	}

	if (hash){
		data.meta = data.meta || {};
		data.meta.hash = hash;
	}

	try {
		var bundle = new Bundle(data);
		bundle.write(function(err, doc){
			if (err){
				res.json(403, {error: err.message});
			} else {
				delete doc._id;
				res.set('Location', 'https://api.tinker.io/bundles/' + doc.meta.hash + '/' + doc.meta.revision);
				res.json(201, doc);
			}
		});
	} catch(err){
		res.json(403, {error: err.message});
	}
});

app.get(/^\/bundles\/([A-Za-z0-9]{5})(?:\/([0-9]+))?$/, function(req, res){
	var hash = req.params[0],
		revision = parseInt(req.params[1], 10) || 0;
	Bundle.find(hash, revision, function(err, bundle){
		if (err){
			res.json(404, {});
		}
		res.json(bundle);
	});
});

var port = parseInt(argv.p, 10) || config.port || 3002;
app.listen(port, function(){
	console.log('Listening on port %d', port);
});
