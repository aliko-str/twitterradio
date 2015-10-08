var twitter = require("./tw.main.js");
var Q = require("q");

function Hashtag(id, hashtag) {
	var loadDefer;
	var self = this;
	var __default = {
		id : id,
		hashtag : hashtag,
		stats : stats
	};
	this.hashtag = hashtag;
	this.id = id;
	this.stats = null;
	this.onLoad = function(cb, cbErr){
		if(!loadDefer){
			console.error("Defer isn't initialized yet!");
			return cb();
		}
		loadDefer.then(cb, cbErr);
	};
	this.setStats = function(stats) {
		this.stats = stats;
		if(!__default.stats) {
			__default.stats = stats;
		}
	};
	this.update = function(hashtag) {
		this.hashtag = hashtag;
		this.setStats(null);
		return _getStats();
	};
	this.reset = function() {
		this.hashtag = __default.hashtag;
		this.setStats(__default.stats);
	};
	function _getStats() {
		loadDefer = Q.defer();
		twitter.getHashtagData(self.hashtag, function(result) {
			if(result.code == 200) {
				self.setStats(result.data);
				loadDefer.resolve();
			} else {
				self.setStats(null);
				loadDefer.reject(result.message);
				console.error("#B1VlO " + result.message);
			}
		});
		return loadDefer;
	}
}

module.exports = {
	Hashtag : Hashtag
};

