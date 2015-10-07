var util = require("./util/protection.from.stupid.errors.js");
var externAnalyzer = require("sentimental");

//private functionality
function calculateMood(textToProcess) {
  mood = externAnalyzer.analyze(textToProcess).score;
  if (mood < 0) {
    return -1;
  }
  else
  if (mood > 0) {
    return 1;
  }
  return 0;
}
//end private functionality

//public functionality
function getStats(resultOfPreprocessing, callback) {
  if(resultOfPreprocessing.code !== 200){
    return callback(resultOfPreprocessing);
  }
  var preHashtag = resultOfPreprocessing.data;
  var cumulativeMood = 0;
  var retwAmount = 0;
  var replAmount = 0;
  var i = 0, len = preHashtag.tweets.length;
  for (; i < len; i++) {
    preHashtag.tweets[i].isRetweet && (retwAmount++);
    preHashtag.tweets[i].isReply && (replAmount++);
    cumulativeMood += calculateMood(preHashtag.tweets[i].text);
  }
  var twAmount = preHashtag.tweets.length || 1;
  var stats = (new util.Statistic(cumulativeMood / twAmount, preHashtag.freq, retwAmount / twAmount, replAmount / twAmount));
  return callback(util.createCallbackObj(200, "", stats));
}
//end public functionality

//exports
module.exports = {
  getStats : getStats
};
//end exports
