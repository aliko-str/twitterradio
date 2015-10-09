const Logger = require("./generic.logger.js").Logger;

module.exports = {
	Logger: function(){
		Logger.call(this, "scrolling.log", "scroll");
		// const _logObj = new Logger("scrolling.log", "scroll"); 
		// for(var i in _logObj){
			// this[i] = _logObj[i];
		// }
		const _origLogF = this.log;
		this.log = function(pos, valence, freq, retw, noiseLevel, hashtag){
			return _origLogF.call(this, [pos, valence, freq, retw, noiseLevel, hashtag].join("\t"));
		};
		return this;
	}
};