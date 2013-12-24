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

app.post('/bundles', function(req, res){
	var data = req.body || {};

	if (req.get('content-type') !== 'application/json'){
		res.json(403, {error: 'Invalid content type, only accepting application/json'});
		return;
	}

	try {
		var bundle = new Bundle(data);
		bundle.write(function(err, doc){
			if (err){
				res.json(403, {error: err.message});
			} else {
				delete doc._id;
				res.set('Location', 'https://api.tinker.io/bundles/' + doc.meta.hash);
				res.json(201, doc);
			}
		});
	} catch(err){
		res.json(403, {error: err.message});
	}
});

var port = parseInt(argv.p, 10) || config.port || 3002;
app.listen(port, function(){
	console.log('Listening on port %d', port);
});

