var ioClient = io.connect(App.ioUrl);
var isIndicatorShown = false;
var _obligatoryHashtagsNum = 5;
var minVirtPos = 0;
var maxVirtPos = 1024;
var realPosMultiplier = ($("#indicator").parent().width() - $("#indicator").width()) / (maxVirtPos - minVirtPos);
var minVirtPosLastHashtag = ((maxVirtPos - minVirtPos) / _obligatoryHashtagsNum) * (_obligatoryHashtagsNum - 1);
var maxVirtPosLastHashtag = (maxVirtPos - minVirtPos);
var jqIndicator = $("#indicator");
var jqCustomizableHashtag = $(".channels input").first();
var _lastIndicatorPos = 0;
var _syncHashtagSubmitted = false;

ioClient.on("position", function(virtPosition) {
	if(virtPosition === null || virtPosition === undefined) {
		return console.error("Can't set the position because it's: " + virtPosition.toString());
	}
	if(_lastIndicatorPos !== virtPosition) {
		if(!isIndicatorShown) {
			jqIndicator.show();
			isIndicatorShown = true;
		}
		var realCoordPosition = virtPosition * realPosMultiplier;
		jqIndicator.css("left", realCoordPosition.toString() + "px");
		if(!_syncHashtagSubmitted) {
			if(isIndicatorOverLastHashtag(virtPosition)) {
				if(!isIndicatorOverLastHashtag(_lastIndicatorPos)) {
					window.setTimeout(function() {
						jqCustomizableHashtag.focus();
					}, 1);
				}
			} else {
				if(isIndicatorOverLastHashtag(_lastIndicatorPos)) {
					window.setTimeout(function() {
						jqCustomizableHashtag.blur();
					}, 1);
				}
			}
		}
		_lastIndicatorPos = virtPosition;
	}
});

ioClient.on("customizableHashtag", function(approvedHashtag) {
	_syncHashtagSubmitted = false;
	jqCustomizableHashtag.css("opacity", 1);
	if(approvedHashtag) {
		jqCustomizableHashtag.prop("placeholder", approvedHashtag);
	}else{
		jqCustomizableHashtag.prop("placeholder", "__changeMe");
	}
	_lastIndicatorPos = 0;
	// so the person sees new hashtag approved and if s/he moves indicator again -
	// it re-does "focus"
});

function sendCustomizableHashtagCandidate(_proposedHashtag) {
	$.ajax("/hashtag/", {
		type : "POST",
		data : JSON.stringify({
			hashtag : _proposedHashtag
		}),
		contentType : "application/json",
		dataType : "JSON",
		complete : function(jqXHR, textStatus) {
			console.log("Hashtag '" + _proposedHashtag + "' resulted in the response: " + textStatus);
		}
	});
}

function isIndicatorOverLastHashtag(virtPosition) {
	if(virtPosition > minVirtPosLastHashtag && virtPosition < maxVirtPosLastHashtag) {
		return true;
	}
	return false;
}

(function runClient() {
	$(document).on("ontouchmove", function(event){
      event.preventDefault();
 	});
	if((_obligatoryHashtagsNum - 1) !== App.defaultHashtags.length) {
		console.error("The number of expected hashtags is: " + (_obligatoryHashtagsNum - 1).toString() + " but the actual number is: " + App.defaultHashtags.length);
	}
	var jqChannels = $(".channels");
	for(var i = 1; i <= _obligatoryHashtagsNum - 1; i++) {
		var jqChannel = jqChannels.find("#channel" + i.toString());
		jqChannel.text(App.defaultHashtags[i - 1]);
	}
	jqCustomizableHashtag.prop("placeholder", "__changeMe");
	jqCustomizableHashtag.keypress(function(ev) {
		var code = ev.keyCode || ev.which;
		if(code == 13) {
			var _proposedHashtag = jqCustomizableHashtag.val();
			if(_proposedHashtag) {
				jqCustomizableHashtag.css("opacity", 0.5);
				jqCustomizableHashtag.prop("placeholder", _proposedHashtag);
				sendCustomizableHashtagCandidate(_proposedHashtag);
				_syncHashtagSubmitted = true;
				window.setTimeout(function() {
					jqCustomizableHashtag.blur();
				}, 1);
			}
		}
	});
	jqCustomizableHashtag.blur(function(ev) {
		if(jqCustomizableHashtag.val()) {
			jqCustomizableHashtag.val("");
		}
	});
})();
