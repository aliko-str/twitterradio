var express = require('express');
var http = require("http");

var _mainServerParams = {
  ip : "127.0.0.1",
  port : 8087
};

var SampleApp = function() {
  var self = this;

  self.setupVariables = function() {
    self.ipaddress = "127.0.0.1";
    self.port = 8088;
  };
  self.terminator = function(sig) {
    if ( typeof sig === "string") {
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
    self.postRoutes = {};
    self.postRoutes["/load?"] = function(req, res) {
      res.setHeader('Content-Type', 'text/html');
      res.status(200).end("Hashtag Noted");
      console.log("TEST CONTROLLER: Received signal LOAD, value: %j", req.body);
    };
    self.postRoutes["/start?"] = function(req, res) {
      res.setHeader('Content-Type', 'text/html');
      res.status(200).end("Start Noted");
      console.log("TEST CONTROLLER: Received signal START.");
      sendCurrPosition();
    };
    self.postRoutes["/error?"] = function(req, res) {
      res.setHeader('Content-Type', 'text/html');
      res.status(200).end("Stop Noted");
      console.log("TEST CONTROLLER: Received signal ERROR.");
    };
  };

  self.initializeServer = function() {
    self.createRoutes();
    self.app = express();
    self.app.use(express.urlencoded());
    self.app.use(express.json());
    for (var r in self.postRoutes) {
      self.app.post(r, self.postRoutes[r]);
    }
    self.app.use(self.app.router);
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

var _position = 35;
function sendCurrPosition() {
  var options = {
    hostname : _mainServerParams.ip,
    port : _mainServerParams.port,
    path : '/position',
    method : 'PUT',
    headers : {
      "content-type" : "application/json"
    }
  };
  var req = http.request(options);
  req.on('error', function(e) {
    console.log('TEST CONTROLLER: Problem with request to main server: ' + e.message);
  });
  req.write(JSON.stringify({
    "position" : _position
  }));
  req.end();
}

var zapp = new SampleApp();
zapp.initialize();
zapp.start();

var stdin = process.stdin;
stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');

stdin.on('data', function(key) {
  console.log('The key: ' + key + '\n');
  if (key === "[D") {
    _position -= Math.floor(Math.random() * (15)) + 1;
    if (_position < 0) {
      _position = 0;
    }
    console.log("Position: %d", _position);
    sendCurrPosition();
  }
  if (key === "[C") {
    _position += Math.floor(Math.random() * (15)) + 1;
    if (_position > 1024) {
      _position = 1024;
    }
    console.log("Position: %d", _position);
    sendCurrPosition();
  }
  if (key.length === 1 && key.charCodeAt(0) === 3)
    zapp.terminator('SIGINT');
});
