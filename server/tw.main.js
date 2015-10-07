var settings = {
  selectionDepth : 600, //minutes
  minTweetFeedLength : 1300, //tweets
  debug : true,
  fullInfo : false
};

var twSearch = require("./tw.search.js");
var util = require("./util/protection.from.stupid.errors.js");
var stats = require("./tw.stats.getting.js");

twSearch.init(settings);

function getHashtagData(hashtag, callback) {
	var __tweetNum;
  function callbackWrapper(respObj) {
    respObj._testField = hashtag;
    if (respObj.code === 200) {
    	tagLogger.log(hashtag, __tweetNum, respObj.data);
      console.log("______Global Event: " + hashtag);
      if (settings.debug) {
        console.log("#n6kYc %j", respObj.data);
      }
    }
    callback(respObj);
  };

  return (function(hashtag, callback) {
    twSearch.getGlobalTrendTweets(hashtag, function(resp) {
      if (resp.code === 200) {
      	__tweetNum = resp.data.length;
        stats.getStats(resp, callbackWrapper);
      }
      else {
        callback(resp);
      }
    });
  })(hashtag, callbackWrapper);
};

module.exports = {
  getHashtagData : getHashtagData
};
