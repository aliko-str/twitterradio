var classes = require("./util/protection.from.stupid.errors.js");
var initialHashtags = ["london", "syria", "fun", "loss", "FIFA"];
var hashtagStore = [];
var Q = require("q");
var _ = require("underscore");

var _customizableHashtagIndex = 4;
var _minPos = 0;
var _maxPos = 1024;
var _denominator = (_maxPos - _minPos) / (initialHashtags.length + 2);
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
	var ind = Math.floor((intPos - _denominator * 0.5) / _denominator);
	console.log("Index: %d, hashtag: %s", ind, "" + initialHashtags[ind]);
	return this[ind];
};

hashtagStore.getStatsFullNoise = function() {
	return [0, 0, 0, 1];
};

hashtagStore.getDefaultHashtags = function() {
	return initialHashtags;
};

hashtagStore.getStatsToPlay = function(position) {
	position = position || _position;
	_position = position;
	var noiseLevel = 0.0;
	var _stats = this._getCurrHashtag(position);
	if(!_stats) {
		_stats = {
			mood : 0.5,
			freq : 0.5,
			retw : 0.5
		};
		noiseLevel = 1.0;
	} else {
		_stats = _stats.stats;
		var localPos = (position - _denominator * 0.5) % _denominator;
		if(_isFullNoise(localPos)) {
			noiseLevel = 1.0;
		} else if(_isFullSignal(localPos)) {
			noiseLevel = 0.0;
		} else {
			noiseLevel = _getNoisePortion(localPos);
		}
	}
	console.log("Stats: %j", _stats);
	return [_stats.mood, _stats.freq, _stats.retw, noiseLevel];
};

// hashtagStore.setCustomizableHashtag = function(hashtag, stats) {
	// this[_customizableHashtagIndex] = new classes.Hashtag(_customizableHashtagIndex, hashtag, stats);
	// return this[_customizableHashtagIndex];
// };

hashtagStore.updateHashtag = function(id, tagText){
	const aTag = this.getById(id);
	return aTag.update(tagText);
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

// hashtagStore.setCustomizableHashtagToNeutral = function() {
	// this.resetHashtag(_customizableHashtagIndex);
	// return this[_customizableHashtagIndex];
// };

// hashtagStore.nullifyCustomizableHashtag = function() {
	// this[_customizableHashtagIndex] = null;
	// return this[_customizableHashtagIndex];
// };

// hashtagStore.clearHashtag = function(tagId) {
	// const aTag = this.getById(tagId);
	// aTag.setStats(null);
	// return aTag;
// };

(function _init() {
	hashtagStore.initDefer = Q.defer();
	var semaphore = initialHashtags.length;
	function onHashtagLoad(err) {
		semaphore--;
		if(!semaphore) {
			hashtagStore.initDefer.resolve();
		}
	}
	for(var i = 0; i < initialHashtags.length; i++) {
		hashtagStore[i] = new classes.Hashtag(i, initialHashtags[i]);
		hashtagStore[i].onLoad(onHashtagLoad, onHashtagLoad);
	}
})();

hashtagStore.onLoad = function(cb) {
	this.initDefer.then(cb, cb);
};

module.exports = hashtagStore;

