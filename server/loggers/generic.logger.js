var util = require("util");
var winston = require("winston");
var fs = require("fs");
var _ = require("underscore");

function Logger(_logFileName, _loggerName) {
	this.logger = new (winston.Logger)({
		'transports' : [new (winston.transports.File)({
			filename : process.env._logDir + _logFileName,
			json : false,
			maxsize : 102400,
			maxFiles : 15,
			'timestamp' : true
		})]
	});
	this.logger._logFileName = _logFileName;
	this.logger._loggerName = _loggerName;
	this.logger.on("error", function(err) {
		return console.error("%s Logging '%s' errors: %s", _loggerName, _logFileName, err.toString());
	});
	this.log = log;
	this.getLogs = getLogs;
	this.deleteLogs = deleteLogs;
	return this;
}
function log(strToLog) {
	var logger = this.logger;
	strToLog = Date.now() + "\t" + strToLog + "\n";
	logger.info(strToLog);
	return strToLog;
}
function getLogs(callback) {
	var logger = this.logger;
	var logFilePath = process.env._dataDir + logger._logFileName;
	return fs.readFile(logFilePath, callback);
}
function deleteLogs(callback) {
	var logger = this.logger;
	var logFilePath = process.env._dataDir + logger_logFileName;
	return fs.truncate(logFilePath, 0, callback);
}

module.exports = {
	Logger : Logger
};
