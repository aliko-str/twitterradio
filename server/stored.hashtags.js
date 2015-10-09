const Hashtag = require("./Hashtag.js").Hashtag;
const initialHashtags = ["london", "syria", "fun", "loss", "FIFA"];
const hashtagStore = [];
const Q = require("q");
const _ = require("underscore");
const minMax = {
	min : {
		mood : Number.MAX_VALUE,
		freq : Number.MAX_VALUE,
		retw : Number.MAX_VALUE,
		repl : Number.MAX_VALUE
	},
	max : {
		mood : 0,
		freq : 0,
		retw : 0,
		repl : 0
	},
	reset : function() {
		const self = this;
		hashtagStore.forEach(function(aTag) {
			_.each(self.min, function(val, key) {
				if(aTag.stats && aTag.stats[key]) {
					self.min[key] = Math.min(self.min[key], aTag.stats[key]);
					self.max[key] = Math.max(self.max[key], aTag.stats[key]);
				}
			});
		});
	}
};

var _minPos = 0;
var _maxPos = 1024;
var _denominator = (_maxPos - _minPos) / initialHashtags.length;
var _fullNoiseThrs = [_denominator * 0.15, _denominator * (1 - 0.15)];
var _fullSignalThrs = [_denominator * 0.4, _denominator * (1 - 0.4)];
var _partialNoiseThrs1 = [_fullNoiseThrs[0], _fullSignalThrs[0]];
var _partialNoiseThrs2 = [_fullSignalThrs[1], _fullNoiseThrs[1]];
var _position = 0;

function _isFullNoise(localPos) {
	if(localPos <= _fullNoiseThrs[0] || localPos >= _fullNoiseThrs[1]) {
		return true;
	}
	return false;
}
function _isFullSignal(localPos) {
	if(localPos >= _fullSignalThrs[0] && localPos <= _fullSignalThrs[1]) {
		return true;
	}
	return false;
}
function _getNoisePortion(localPos) {
	if(localPos > _partialNoiseThrs1[0] && localPos < _partialNoiseThrs1[1]) {
		var relNoisePos = localPos - _partialNoiseThrs1[0];
		return (1 - relNoisePos / (_partialNoiseThrs1[1] - _partialNoiseThrs1[0]));
	} else if(localPos > _partialNoiseThrs2[0] && localPos < _partialNoiseThrs2[1]) {
		var relNoisePos = localPos - _partialNoiseThrs2[0];
		return (relNoisePos / (_partialNoiseThrs2[1] - _partialNoiseThrs2[0]));
	}
	console.error("_getNoisePortion ERROR: given local position doesn't belong to either of 'partially noisy' regions - return full noise");
	return 1;
}

hashtagStore._getCurrHashtag = function(intPos) {
	intPos = intPos || _position;
	console.log("INDICATOR POSITION: " + intPos);
	var ind = Math.floor(intPos / _denominator);
	console.log("Index: %d, hashtag: %s", ind, "" + this[ind].hashtag);
	return this[ind];
};

hashtagStore.getStatsFullNoise = function() {
	return [0, 0, 0, 1];
};

hashtagStore.getHashtags = function() {
	return this.map(function(el) {
		return el;
	});
};

hashtagStore.getStatsToPlay = function(position) {
	var stats = this._getStatsToPlay(position);
	_.each(stats, function(val, key) {
		if(minMax.min[key] !== undefined) {
			stats[key] = (stats[key] - minMax.min[key]) / (minMax.max[key] - minMax.min[key]);
		}
	});
	return [stats.mood, stats.freq, stats.retw, stats.noiseLevel];
};

hashtagStore._getStatsToPlay = function(position) {
	position = position || _position;
	position = Math.min(position, _maxPos-1);
	_position = position;
	var aTag = this._getCurrHashtag(position);
	var noiseLevel = 1.0;
	if(aTag.stats) {
		// var localPos = (position - _denominator * 0.5) % _denominator;
		var localPos = position % _denominator;
		if(_isFullNoise(localPos)) {
			noiseLevel = 1.0;
		} else if(_isFullSignal(localPos)) {
			noiseLevel = 0.0;
		} else {
			noiseLevel = _getNoisePortion(localPos);
		}
	}
	_stats = _.extendOwn({
		mood : 0.5,
		freq : 0.5,
		retw : 0.5
	}, aTag.stats);
	_stats["noiseLevel"] = noiseLevel;
	console.log("Stats: %j", _stats);
	return _stats;
};

hashtagStore.updateHashtag = function(id, tagText) {
	const aTag = this.getById(id);
	aTag.update(tagText);
	return aTag;
};

hashtagStore.resetHashtag = function(id) {
	const aTag = this.getById(id);
	aTag.reset();
	return aTag;
};

hashtagStore.getById = function(id) {
	if(!_.isNumber(id)) {
		var err = new Error("The passed ID is not a number");
		if(process.__debug) {
			throw err;
		}
		console.error(err);
	} else {
		for(var i = 0, ilen = this.length; i < ilen; i++) {
			if(this[i].id == id) {
				return this[i];
			}
		}
		var err = new Error("Hashtag with the ID " + id + " not found");
		if(process.__debug) {
			throw err;
		}
		console.error(err);
	}
	return this._getCurrHashtag(_position);
};

const initDefer = Q.defer();
var semaphore = initialHashtags.length;
function onHashtagLoad(err) {
	semaphore--;
	if(!semaphore) {
		hashtagStore.forEach(function(el) {
			el.removeListener("statsChanged", onHashtagLoad);
		});
		initDefer.resolve();
	}
}
for(var i = 0; i < initialHashtags.length; i++) {
	hashtagStore[i] = new Hashtag(i, initialHashtags[i]);
	hashtagStore[i].on("statsChanged", onHashtagLoad);
	hashtagStore[i].on("statsChanged", function() {
		minMax.reset();
	});
}
hashtagStore.initPromise = initDefer.promise;

module.exports = hashtagStore;

