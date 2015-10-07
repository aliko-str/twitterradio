var util = require("./util/protection.from.stupid.errors.js");
require("./util/date.js");
this.settings = null;

var locSettings = {
  minimumTweetAmount : 50 //
};

function cleanTweet(textToClean, entities, hashtag) {
  var result = textToClean;
  var maxi = entities.user_mentions.length;
  for (var i = 0; i < maxi; i++) {
    result = result.replace("@" + entities.user_mentions[i].screen_name, "");
  }
  maxi = entities.urls.length;
  for (var i = 0; i < maxi; i++) {
    result = result.replace(entities.urls[i].url, "");
  }
  result = result.replace(hashtag, "");
  result = result.replace("#", "");
  return result.toLowerCase();
}

//check english
var nonAsciiSymbRegex = /[^\u0000-\u0080]+/g;
function checkEnglishSymb(textToCheck) {
  return nonAsciiSymbRegex.test(textToCheck);
}
//end check english


function processTweet(hashtag, tweet) {
  if (tweet.text) {
    if (tweet.lang == "en") {
      return cleanTweet(tweet.text, tweet.entities, hashtag);

    }
    else {
      console.log("Not in English. Tw text:" + tweet.text);
    }
  }
  else {
    console.log("Empty tweet.");
  }
  return null;
}

function checkArrayDirection(tweets) {
  var first = (new Date(tweets[0].created_at)).getTime();
  var last = (new Date(tweets[tweets.length - 1].created_at)).getTime();
  if (first - last < 0) {
    if (this.settings.debug) {
      console.log("Tweet array was reversed.");
    }
    return tweets.reverse();
  }
  return tweets;
}

function processTextAllTweets(hashtag, tweets) {
  if(tweets.length < locSettings.minimumTweetAmount){
    return util.createCallbackObj(400, "Tweets are too few. Please choose a more popular hashtag.", {});
  }
  checkArrayDirection(tweets);
  var timeStart = (new Date(tweets[tweets.length - 1].created_at)).getTime();
  var timeEnd = (new Date(tweets[1].created_at)).getTime();
  if (this.settings.debug) {
    console.log("timeStart: " + (new Date(timeStart)).toString());
    console.log("Amount:" + tweets.length);
  }
  var results = [];
  var i = 0, len = tweets.length;
  for (; i < len; i++) {
    var processedTweet = processTweet(hashtag, tweets[i]);
    if (processedTweet) {
      if (this.settings.debug && this.settings.fullInfo) {
        console.log("i - " + i + " tweet: " + tweets[i].created_at);
      }
      var isReply = (tweets[i].in_reply_to_status_id || tweets[i].in_reply_to_user_id) ? true : false;
      var isRetweet = tweets[i].retweeted_status ? true : false;
      results.push(new util.LeanTweet(processedTweet, isRetweet, isReply));
    }
  }
  var preHashtag = new util.PreHashtag(hashtag, results, (tweets.length / (timeEnd - timeStart)) * 60000);
  return util.createCallbackObj(200, "", preHashtag);
}

function init(settings) {
  this.settings = settings;
}

//exports
module.exports = {
  processTextAllTweets : processTextAllTweets,
  init : init
};
//end exports