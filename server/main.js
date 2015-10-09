var path = require("path");
process.env._logDir = path.join(__dirname, "logs");
process.__debug = true;
var hashtagStore = require("./stored.hashtags.js");
var httpServer = require("./http.server.js");
var oscServer = require("./osc.server.js");
var twitter = require("./tw.main.js");
var hasStarted = false;
var scrollLogger = new require("./loggers/scroll.logger.js").Logger();
var tagLogger = require("./loggers/tag.logger.js");

var callbacks = {
	callbackPosition : function(position) {
		if(hasStarted) {
			var robinData = hashtagStore.getStatsToPlay(position);
			oscServer.sendMusicParamsToRobin(robinData);
			httpServer.sendPositionToClient(position);
			httpServer.sendSignalStrengthToController(robinData[3]);
			var _currHashT = hashtagStore._getCurrHashtag();
			scrollLogger.log(position, robinData[0], robinData[1], robinData[2], robinData[3], _currHashT.hashtag);
		}
	},
	callbackHashtag : function(tagId, tagText) {
		if(hasStarted) {
			httpServer.sendLoadSignalToController(true);
			var theTag = hashtagStore.updateHashtag(tagId, tagText);
			var robinData = hashtagStore.getStatsToPlay();
			oscServer.sendMusicParamsToRobin(robinData);
			theTag.once("statsChanged", function onChanged(ifOk) {
				httpServer.sendLoadSignalToController(false);
				if(ifOk){
					httpServer.sendCustomizableHashtagToClient(tagId, tagText);
					var robinData = hashtagStore.getStatsToPlay();
					oscServer.sendMusicParamsToRobin(robinData);
				}else{
					httpServer.sendErrorSignalToController();
					httpServer.sendCustomizableHashtagToClient(tagId);
				}
			});
		}
	},
	callbackRun : function() {
		hasStarted = true;
		httpServer.sendLoadSignalToController(false);
		httpServer.sendStartSignalToController();
		tagLogger.on();
	},
	callbackStop : function() {
		var robinData = hashtagStore.getStatsFullNoise();
		oscServer.sendMusicParamsToRobin(robinData);
		httpServer.sendLoadSignalToController(true);
		hasStarted = false;
		tagLogger.off();
	},
	callbackSwitchToNeutralHashtag : function(tagId) {
		throw new Error("NOT IMPLEMENTED");
		// const origTag = hashtagStore.resetHashtag(tagId);
		// console.log("SOCKET CLIENT SEND DETAILS: " + tagId + " -- " + origTag.hashtag.toString());
		// httpServer.sendResetHashtagToClient(tagId, origTag.hashtag.toString());
		// console.log("THE ORIG TAG: %j", origTag);
		// const robinData = hashtagStore.getStatsToPlay();
		// oscServer.sendMusicParamsToRobin(robinData);
	}
};

(function runAll() {
	httpServer = httpServer.init(callbacks, hashtagStore.getHashtags());
	httpServer.run();
	httpServer.sendLoadSignalToController(true);
	function cb(err) {
		console.log("FINISHED INIT\n");
		httpServer.sendReadySignalToBackend();
	}
	hashtagStore.initPromise.then(cb, cb);
})();
