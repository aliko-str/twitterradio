//!/bin/env node
var _ioPort = 8086;
var _isReadyToBeRun = false;

const bodyParser = require('body-parser');
const compression = require("compression");
var express = require('express');
var fs = require('fs');
var path = require('path');
var http = require("http");
var httpProxy = require("./http.proxy.server.js");
var io = require('socket.io').listen(_ioPort);
var client = io.of('/client');
var backend = io.of('/backend');

var _controllerParams = {
	ip : "127.0.0.1",
	port : 8088
};

var callbacks = {
	callbackPosition : null,
	callbackHashtag : null,
	callbackRun : null,
	callbackStop : null,
	callbackSwitchToNeutralHashtag : null
};
var allHashtags = [];

var init = function(_callbacks, defaultHashtags) {
	for(var i in _callbacks) {
		callbacks[i] = _callbacks[i];
	}
	allHashtags = defaultHashtags;
	return this;
};

var SampleApp = function() {
	var self = this;

	self.setupVariables = function() {
		self.ipaddress = "127.0.0.1";
		// self.ipaddress = "10.196.193.42";
		self.port = 8087;
	};
	self.terminator = function(sig) {
		if( typeof sig === "string") {
			console.log('%s: Received %s - terminating sample app ...', Date(Date.now()), sig);
			process.exit(1);
		}
		console.log('%s: Node server stopped.', Date(Date.now()));
	};
	self.setupTerminationHandlers = function() {
		//  Process on exit and signals.
		process.on('exit', function() {
			self.terminator();
		});

		// Removed 'SIGPIPE' from the list - bugz 852598.
		['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'].forEach(function(element, index, array) {
			process.on(element, function() {
				self.terminator(element);
			});
		});
	};

	self.createRoutes = function() {
		self.getRoutes = { };
		self.postRoutes = {};
		self.getRoutes['/'] = function(req, res) {
			res.setHeader('Content-Type', 'text/html');
			res.send("Hello World!");
		};
		self.getRoutes["/404?"] = function(req, res) {
			res.status(404).send("There is no such page here...");
		};
		self.getRoutes["/client?"] = function(req, res) {
			res.status(200).render("client", {
				_allHashtags : JSON.stringify(allHashtags),
				_ioPort : _ioPort.toString(),
				allHashtags: allHashtags,
				_ioJSUrl: "http://" + self.ipaddress + ":" + _ioPort
			});
		};
		self.getRoutes["/admin?"] = function(req, res) {
			res.status(200).render("admin", {
				_isReadyToBeRun : _isReadyToBeRun,
				_ioPort : _ioPort.toString(),
				_allHashtags : JSON.stringify(allHashtags),
				allHashtags: allHashtags,
				_ioJSUrl: "http://" + self.ipaddress + ":" + _ioPort 
			});
		};
		// TODO disable later
		self.app.put(["/position?"], function(req, res) {
			res.setHeader('Content-Type', 'text/html');
			res.status(200).send("Position Noted");
			console.log("#nKoQi Received position: %j", req.body.position);
			callbacks.callbackPosition(req.body.position);
		});

		self.postRoutes["/hashtag?"] = function(req, res) {
			res.setHeader('Content-Type', "application/json");
			try {
				var tagId = parseInt(req.body.tagId);
			} catch (e) {
				var msg = "Bad tag id, it should be a number; it was " + req.body.tagId;
				console.error(msg);
				return res.status(400).send({
					msg : msg
				});
			}
			res.status(200).send({
				msg : "Neutral Hashtag Signal Noted"
			});
			console.log("#INQ7z Received hashtag: %j", req.body);
			callbacks.callbackHashtag(tagId, req.body.hashtag);
		};
		self.postRoutes["/start?"] = function(req, res) {
			res.set('Content-Type', "application/json");
			res.status(200).send({msg: "Start Noted"});
			console.log("#ALvsO Received signal START");
			callbacks.callbackRun();
		};
		self.postRoutes["/stop?"] = function(req, res) {
			res.set('Content-Type', "application/json");
			res.status(200).send({msg: "Stop Noted"});
			console.log("#ALvsO Received signal STOP");
			callbacks.callbackStop();
		};
		self.postRoutes["/neutralhashtag?"] = function(req, res) {
			res.set('Content-Type', "application/json");
			try {
				var tagId = parseInt(req.body.tagId);
			} catch (e) {
				return res.status(400).send({
					msg : "Bad tag id, it should be a number; it was " + req.body.tagId
				});
			}
			res.status(200).send({
				msg : "Neutral Hashtag Signal Noted"
			});
			console.log("#ALvsO Received signal NEUTRAL HASHTAG");
			callbacks.callbackSwitchToNeutralHashtag(tagId);
		};
	};

	self.initializeServer = function() {
		const clientPath = path.join(__dirname, "..", "frontend", "client");
		const adminPath = path.join(__dirname, "..", "frontend", "admin");

		self.app = express();
		self.app.use(compression());
		self.app.use(bodyParser.json({
			extended : true
		}));
		self.app.use(bodyParser.urlencoded({
			extended : true
		}));
		self.app.set("views", [clientPath, adminPath]);
		self.app.set("view cache", !process.__debugMode);
		self.app.set("view engine", "ejs");

		self.app.use("/frontend/client/static", express.static(clientPath));
		self.app.use("/frontend/admin/static", express.static(adminPath));
		self.app.use("/frontend/sharedstuff/static", express.static(path.resolve(__dirname, '../frontend/sharedstuff')));
		self.createRoutes();
		for(var r in self.getRoutes) {
			self.app.get(r, self.getRoutes[r]);
		}
		for(var r in self.postRoutes) {
			self.app.post(r, self.postRoutes[r]);
		}
	};

	self.initialize = function() {
		self.setupVariables();
		self.setupTerminationHandlers();
		self.initializeServer();
	};

	self.start = function() {
		//  Start the app on the specific interface (and port).
		self.app.listen(self.port, self.ipaddress, function() {
			console.log('%s: Node server started on %s:%d ...', Date(Date.now()), self.ipaddress, self.port);
		});
	};
};

function sendLoadSignalToController(isStart) {
	var options = {
		hostname : _controllerParams.ip,
		port : _controllerParams.port,
		path : '/load',
		method : 'POST',
		headers : {
			"Content-Type" : "application/json"
		}
	};
	var req = http.request(options);
	req.on('error', function(e) {
		console.log('#SiihV problem with request to Controller: ' + e.message);
	});
	req.write(JSON.stringify({
		"isStart" : isStart
	}));
	req.end();
}
function sendSignalStrengthToController(signalStrength) {
	var options = {
		hostname : _controllerParams.ip,
		port : _controllerParams.port,
		path : '/signal',
		method : 'POST',
		headers : {
			"Content-Type" : "application/json"
		}
	};
	var req = http.request(options);
	req.on('error', function(e) {
		console.log('#ZGlW1 problem with request to Controller: ' + e.message);
	});
	req.write(JSON.stringify({
		"signal" : (1 - signalStrength)
	}));
	req.end();
}
function sendStartSignalToController() {
	var options = {
		hostname : _controllerParams.ip,
		port : _controllerParams.port,
		path : '/start',
		method : 'POST',
		headers : {
			"Content-Type" : "application/json"
		}
	};
	var req = http.request(options);
	req.on('error', function(e) {
		console.log('#zyrvk problem with request to Controller: ' + e.message);
	});
	req.write(JSON.stringify({
		"start" : "Rock it baby!!!"
	}));
	req.end();
}
function sendErrorSignalToController() {
	var options = {
		hostname : _controllerParams.ip,
		port : _controllerParams.port,
		path : '/error',
		method : 'POST',
		headers : {
			"Content-Type" : "application/json"
		}
	};
	var req = http.request(options);
	req.on('error', function(e) {
		console.log('#VDV9k problem with request to Controller: ' + e.message);
	});
	req.write(JSON.stringify({
		"error" : "Make blink-blink-blink..."
	}));
	req.end();
}
function sendPositionToClient(position) {
	client.emit("position", position);
}
//input: hashtag text or undefined if not loaded for some reasons.
function sendCustomizableHashtagToClient(tagId, hashtagText) {
	client.emit("newHashtag", tagId, hashtagText);
}
function sendReadySignalToBackend() {
	_isReadyToBeRun = true;
	backend.emit("ready", "just ready :)");
}

module.exports = {
	init : init,
	run : function() {
		httpProxy.run(callbacks.callbackPosition);
		var zapp = new SampleApp();
		zapp.initialize();
		zapp.start();
		return zapp;
	},
	sendLoadSignalToController : sendLoadSignalToController,
	sendSignalStrengthToController : sendSignalStrengthToController,
	sendPositionToClient : sendPositionToClient,
	sendCustomizableHashtagToClient : sendCustomizableHashtagToClient,
	sendReadySignalToBackend : sendReadySignalToBackend,
	sendStartSignalToController : sendStartSignalToController,
	sendErrorSignalToController : sendErrorSignalToController
};

