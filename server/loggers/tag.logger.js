
const Logger = require("./generic.logger.js").Logger;
const sentObjStub = {
  mood: "-",
  freq: "-",
  retw: "-",
  repl: "-"
};
var glovalSwitch = false;

module.exports = {
	Logger: function(){
		Logger.call(this, "hashtags.log", "tags");
		const _origLogF = this.log;
		this.log = function(hashtag, tweetNum, sentObj){
			sentObj = sentObj || sentObjStub;
			if(glovalSwitch){
				return _origLogF.call(this, [hashtag, tweetNum, sentObj.mood, sentObj.freq, sentObj.repl, sentObj.retw].join("\t"));
			}
			return null;
		};
		return this;
	},
	on: function(){
		glovalSwitch = true;
	},
	off: function(){
		glovalSwitch = false;
	}
};