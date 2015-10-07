// TODO log only if position changed <-- somewhere in the logic above

const Logger = require("./generic.logger.js").Logger;

module.exports = {
	Logger: function(){
		const _logObj = new Logger("scrolling.log", "scroll"); 
		for(var i in _logObj){
			this[i] = _logObj[i];
		}
		const _origLogF = this.log;
		this.log = function(pos, valence, freq, retw, noiseLevel, hashtag){
			return _origLogF.call(this, [pos, valence, freq, retw, noiseLevel, hashtag].join("\t"));
		};
		return this;
	}
};