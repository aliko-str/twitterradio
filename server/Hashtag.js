var twitter = require("./tw.main.js");
var EventEmitter = require('events');

function Hashtag(id, hashtag) {
	EventEmitter.call(this);
	var self = this;
	var __default = {
		id : id,
		hashtag : hashtag,
		stats : stats
	};
	this.hashtag = hashtag;
	this.id = id;
	this.stats = null;
	this.setStats = function(stats) {
		this.stats = stats;
		if(!__default.stats) {
			__default.stats = stats;
		}
		this.emit("statsChanged");
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
		twitter.getHashtagData(self.hashtag, function(result) {
			if(result.code == 200) {
				self.setStats(result.data);
			} else {
				self.setStats(null);
				console.error("#B1VlO " + result.message);
			}
		});
		return;
	}
}

module.exports = {
	Hashtag : Hashtag
};

