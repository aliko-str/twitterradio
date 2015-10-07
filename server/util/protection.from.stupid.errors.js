var emitter;

function createCallbackObj(code, message, data){
  var obj = {code: code, message: message, data: data} ;
  return obj;
}


function Statistic(mood, freq, retwAmount, replAmount){
  this.mood = mood;
  this.freq = freq;
  this.retw = retwAmount;
  this.repl = replAmount;
}

function getCurrTwitterTime(){
  var date = new Date();
  //return timestampNow = date.getTime() + date.getTimezoneOffset() * 60000 - 1;
  return timestampNow = date.getTime() - 1;
}

function GlobalEvent(hashtag, error, data){
  this.hashtag = hashtag;
  this.error = error;
  this.data = data;
}

function PreHashtag(hashtag, tweets, freq){
  this.hashtag = hashtag;
  this.tweets = tweets;
  this.freq = freq;
}

function Hashtag(id, hashtag, stats){
  this.hashtag = hashtag;
  this.id = id;
  this.stats = stats;
}

function LeanTweet(text, isRetweet, isReply){
  this.text = text;
  this.isRetweet = isRetweet;
  this.isReply = isReply;
}

module.exports = {
  createCallbackObj: createCallbackObj,
  Statistic: Statistic,
  getCurrTwitterTime: getCurrTwitterTime,
  GlobalEvent: GlobalEvent,
  Hashtag: Hashtag,
  PreHashtag:PreHashtag,
  LeanTweet: LeanTweet,
  emitter: emitter // for testing only
};

if(!module.exports.emitter){
  var EventEmitter = require("events").EventEmitter;
  module.exports.emitter = new EventEmitter();
}
