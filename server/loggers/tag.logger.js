
const Logger = require("./generic.logger.js").Logger;
const sentObjStub = {
  mood: "-",
  freq: "-",
  retw: "-",
  repl: "-"
};

module.exports = {
	Logger: function(){
		const _logObj = new Logger("scrolling.log", "scroll"); 
		for(var i in _logObj){
			this[i] = _logObj[i];
		}
		const _origLogF = this.log;
		this.log = function(hashtag, tweetNum, sentObj){
			sentObj = sentObj || sentObjStub;
			return _origLogF.call(this, [hashtag, tweetNum, sentObj.mood, sentObj.freq, sentObj.repl, sentObj.retw].join("\t"));
		};
		return this;
	}
};