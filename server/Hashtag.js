const twitter = require("./tw.main.js");
const EventEmitter = require('events').EventEmitter;

function Hashtag(id, hashtag) {
	EventEmitter.call(this);
	var self = this;
	var __default = {
		id : id,
		hashtag : hashtag,
		stats : null
	};
	this.hashtag = hashtag;
	this.id = id;
	this.stats = null;
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
		this.emit("statsChanged", false);
	};
	function _getStats() {
		twitter.getHashtagData(self.hashtag, function(result) {
			if(result.code == 200) {
				self.setStats(result.data);
				self.emit("statsChanged", true);
			} else {
				self.setStats(null);
				self.emit("statsChanged", false);
				console.error("#B1VlO " + result.message);
			}
		});
		return;
	}
	_getStats();
}

Hashtag.prototype.__proto__ = EventEmitter.prototype;

module.exports = {
	Hashtag : Hashtag
};

