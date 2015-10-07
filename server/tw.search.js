var tweetCleaner = require("./tw.text.processing.js");
var util = require("./util/protection.from.stupid.errors.js");
var twitter = require('ntwitter');
require("./util/date.js");
var tagLogger = new require("./loggers/tag.logger.js").Logger();

//twitter listening
var t = new twitter({
  consumer_key : '2ekO1Mj8pTHpe1ZzEeGF2Q',
  consumer_secret : '2sTtoZZfqdUCdBF19jIV1dM3RvW1UTUF2Dvh5hKyk',
  access_token_key : '787084526-97gcODbEUEV24DvykWZRUgeuA4bkKJIqrUWnFgwH',
  access_token_secret : 'pGBWwzC5Lb3X9R1pSMyRX8DNCektLyOY2Qh7l98Nw'
});

var settingsLoc = null;
var tweetStorage = {
  "#testtest" : []
};

function noTweetsFount(callback, hashtag){
	tagLogger.log(hashtag, 0, null);
  return callback(util.createCallbackObj(500, "No tweets associated with the hashtag :" + hashtag, null));
}

function getGlobalTrendTweets(hashtagStr, callback) {
  var q = "#" + hashtagStr;
  var params = {
    lang : "en",
    result_type : "recent",
    count : 100,
    include_entities : true
  };
  var startLookingFromTimestamp = util.getCurrTwitterTime() - this.settings.selectionDepth * 60000;
  searchTweets(q, params, callback, startLookingFromTimestamp, 1);
}

function errorFromTwitter(err, callback, q, page, params){
    console.error("#Tfbpu" + (err.code || 500).toString() + (err.message || "From searchTweets - no message provided"));
    var resultsOfProcessing = tweetCleaner.processTextAllTweets(q, tweetStorage[q]);
    tweetStorage[q].length = 0;
    return callback(resultsOfProcessing);
}

function searchTweets(q, params, callback, startLookingFromTimestamp, page, secondTry) {
  if (settingsLoc.debug) {
    console.log("New search query: " + q + " Page: " + page);
  }
  if (page === 1) {
    tweetStorage[q] = [];
  }
  t.search(q, params, function(err, data) {
    if (settingsLoc.debug) {
      console.log("Response received for: " + q + " Page: " + page);
    }
    if (err) {
      if (err.code != "ECONNRESET") {
        return errorFromTwitter(err, callback, q, page, params);
        //return callback(util.createCallbackObj(err.code || 500, err.message || "From searchTweets - no message provided"));
      }
      else{
        if (!secondTry) {
          return searchTweets(q, params, callback, startLookingFromTimestamp, page, true);
        }else{
          return errorFromTwitter(err, callback, q, page, params);
        }
      }
    }
    if (data && data.statuses) {
      if (data.statuses.length) {
        var tmpTimestamp = (new Date(data.statuses[data.statuses.length - 1].created_at)).getTime();
        if (tmpTimestamp > startLookingFromTimestamp) {
          tweetStorage[q] = tweetStorage[q].concat(data.statuses);
          if (tweetStorage[q].length < settingsLoc.minTweetFeedLength) {//if(page
            // < 10){//10 pages only
            params.max_id = data.statuses[data.statuses.length - 1].id - 1;
            searchTweets(q, params, callback, startLookingFromTimestamp, page + 1);
          }
          else {
            var resultsOfProcessing = tweetCleaner.processTextAllTweets(q, tweetStorage[q]);
            //array of text arrays
            callback(resultsOfProcessing);
            tweetStorage[q].length = 0;
            //garbage collection
          }
        }//TODO add logic for not counting affective words starting from Upper
        // case - they are names (or first words)
        else {
          var i = data.statuses.length - 1;
          tmpTimestamp = (new Date(data.statuses[i].created_at)).getTime();
          while (i > 0 && (tmpTimestamp < startLookingFromTimestamp)) {
            tmpTimestamp = (new Date(data.statuses[i].created_at)).getTime();
            i--;
          }
          data.statuses.length = i;
          if(data.statuses.length > 0){
            tweetStorage[q] = tweetStorage[q].concat(data.statuses);
            var resultsOfProcessing = tweetCleaner.processTextAllTweets(q, tweetStorage[q]);
            //array of text arrays
            callback(resultsOfProcessing);            
          }
          else{
            noTweetsFount(callback, q);
          }
          tweetStorage[q].length = 0;
          //garbage collection
        }

      }
      else {
        if (page === 1) {
          noTweetsFount(callback, q);
          //callback(util.createCallbackObj(500, "No tweets associated with the hashtag :" + q));
        }
        else {
          var resultsOfProcessing = tweetCleaner.processTextAllTweets(q, tweetStorage[q]);
          //array of text arrays
          callback(resultsOfProcessing);
          tweetStorage[q].length = 0;
          //garbage collection
        }
      }
    }
    else {
      if (tweetStorage[q] && tweetStorage[q].length) {// in case smth happened
        // but we still have got some data
        var resultsOfProcessing = tweetCleaner.processTextAllTweets(q, tweetStorage[q]);
        //array of text arrays
        callback(resultsOfProcessing);
        tweetStorage[q].length = 0;
        //garbage collection
      }
      else {
        callback(util.createCallbackObj(500, "data is empty (no tweets received)"));
      }
    }
  });
}

function init(settings) {
  this.settings = settings;
  settingsLoc = settings;
  tweetCleaner.init(settings);
}

module.exports = {
  getGlobalTrendTweets : getGlobalTrendTweets,
  init : init
};
