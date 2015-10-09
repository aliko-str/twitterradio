var express = require('express');
const bodyParser = require('body-parser');
var compression = require("compression");

var SampleApp = function(callbackPosition) {
	var self = this;

	self.setupVariables = function() {
		self.ipaddress = "127.0.0.1";
		self.port = 8089;
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

	self.initializeServer = function() {
		self.app = express();
		self.app.use(compression());
		self.app.use(bodyParser.json({
			extended : true
		}));
		self.app.use(bodyParser.urlencoded({
			extended : true
		}));
		self.app.put("/position?", function(req, res) {
			res.setHeader('Content-Type', 'text/html');
			res.status(200).end("Position Noted");
			console.log("#nKoQi Received position: %j", req.body.position);
			callbackPosition(req.body.position);
		});
		// self.app.use(self.app.router);
	};

	self.initialize = function() {
		self.setupVariables();
		self.setupTerminationHandlers();
		self.initializeServer();
	};

	self.start = function() {
		//  Start the app on the specific interface (and port).
		self.app.listen(self.port, self.ipaddress, function() {
			console.log('%s: Node proxy server started on %s:%d ...', Date(Date.now()), self.ipaddress, self.port);
		});
	};
};
module.exports = {
	run : function(callbackPosition) {
		var zapp = new SampleApp(callbackPosition);
		zapp.initialize();
		zapp.start();
		return zapp;
	}
};

