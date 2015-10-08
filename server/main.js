var path = require("path");
process.env._logDir = path.join(__dirname, "logs");
process.__debug = true;
var hashtagStore = require("./stored.hashtags.js");
var httpServer = require("./http.server.js");
var oscServer = require("./osc.server.js");
var twitter = require("./tw.main.js");
var hasStarted = false;
var scrollLogger = new require("./loggers/scroll.logger.js").Logger();

var callbacks = {
	callbackPosition : function(position) {
		if(hasStarted) {
			var robinData = hashtagStore.getStatsToPlay(position);
			oscServer.sendMusicParamsToRobin(robinData);
			httpServer.sendPositionToClient(position);
			httpServer.sendSignalStrengthToController(robinData[3]);
			var _currHashT = hashtagStore._getCurrHashtag();
			scrollLogger.log(position, robinData.mood, robinData.freq, robinData.retw, robinData.noiseLevel, _currHashT);
		}
	},
	// TODO change of API upstream: add id
	callbackHashtag : function(hashtagObj) {
		const tagText = hashtagObj.hashtag;
		const tagId = hashtagObj.id;
		if(hasStarted) {
			httpServer.sendLoadSignalToController(true);
			var defer = hastagStore.updateHashtag(tagId, tagText);
			var robinData = hashtagStore.getStatsToPlay();
			oscServer.sendMusicParamsToRobin(robinData);
			defer.then(function resolve() {
				httpServer.sendLoadSignalToController(false);
				httpServer.sendCustomizableHashtagToClient(tagText);
				var robinData = hashtagStore.getStatsToPlay();
				oscServer.sendMusicParamsToRobin(robinData);
			}, function reject(err) {
				httpServer.sendLoadSignalToController(false);
				httpServer.sendErrorSignalToController();
				httpServer.sendCustomizableHashtagToClient();
			});
		}
	},
	callbackRun : function() {
		hasStarted = true;
		httpServer.sendLoadSignalToController(false);
		httpServer.sendStartSignalToController();
	},
	callbackStop : function() {
		var robinData = hashtagStore.getStatsFullNoise();
		oscServer.sendMusicParamsToRobin(robinData);
		httpServer.sendLoadSignalToController(true);
		hasStarted = false;
	},
	// TODO update upstream <-- send the id of hashtag to neutralize
	callbackSwitchToNeutralHashtag : function(tagId) {
		const origTag = hashtagStore.resetHashtag(tagId);
		const robinData = hashtagStore.getStatsToPlay();
		oscServer.sendMusicParamsToRobin(robinData);
		httpServer.sendCustomizableHashtagToClient(origTag.hashtag);
	}
};

(function runAll() {
	httpServer = httpServer.init(callbacks, hashtagStore.getDefaultHashtags());
	httpServer.run();
	httpServer.sendLoadSignalToController(true);
	function cb(err) {
		httpServer.sendReadySignalToBackend();
	}
	hashtagStore.initDefer.then(cb, cb);
})();
