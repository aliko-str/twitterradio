var path = require("path");
process.env._logDir = path.join(__dirname, "logs");
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
	callbackHashtag : function(hashtagObj) {
		hashtagText = hashtagObj.hashtag;
		if(hasStarted) {
			httpServer.sendLoadSignalToController(true);
			hashtagStore.nullifyCustomizableHashtag();
			var robinData = hashtagStore.getStatsToPlay();
			oscServer.sendMusicParamsToRobin(robinData);
			return twitter.getHashtagData(hashtagText, function(respObj) {
				httpServer.sendLoadSignalToController(false);
				if(respObj.code !== 200) {
					httpServer.sendErrorSignalToController();
					httpServer.sendCustomizableHashtagToClient();
				} else {
					hashtagStore.setCustomizableHashtag(hashtagText, respObj.data);
					httpServer.sendCustomizableHashtagToClient(hashtagText);
					var robinData = hashtagStore.getStatsToPlay();
					oscServer.sendMusicParamsToRobin(robinData);
				}
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
	callbackSwitchToNeutralHashtag : function() {
		var _neutralHashtag = hashtagStore.setCustomizableHashtagToNeutral();
		var robinData = hashtagStore.getStatsToPlay();
		oscServer.sendMusicParamsToRobin(robinData);
		httpServer.sendCustomizableHashtagToClient(_neutralHashtag.hashtag);
	}
};

(function runAll() {
	httpServer = httpServer.init(callbacks, hashtagStore.getDefaultHashtags());
	httpServer.run();
	httpServer.sendLoadSignalToController(true);

	var defaultHashtagCounter = hashtagStore.length;
	var i = 0, len = hashtagStore.length;
	for(; i < len; i++) {
		twitter.getHashtagData(hashtagStore[i].hashtag, (function(i) {
			return function(result) {
				defaultHashtagCounter--;
				if(result.code == 200) {
					hashtagStore[i].stats = result.data;
				} else {
					hashtagStore[i] = null;
					console.error("#B1VlO " + result.message);
				}
				if(!defaultHashtagCounter) {
					httpServer.sendReadySignalToBackend();
				}
			};
		})(i));
	}
})();
