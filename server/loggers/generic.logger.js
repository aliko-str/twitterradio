const util = require("util");
const winston = require("winston");
const fs = require("fs");
const _ = require("underscore");
const path = require("path");

function Logger(_logFileName, _loggerName) {
	this.logger = new (winston.Logger)({
		'transports' : [new (winston.transports.File)({
			filename : path.join(process.env._logDir, _logFileName),
			json : false,
			maxsize : 102400,
			maxFiles : 15,
			'timestamp' : false
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
	strToLog = (new Number(Date.now())) + "\t" + strToLog;
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
