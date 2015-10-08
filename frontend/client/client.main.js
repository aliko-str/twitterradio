$(document).ready(function(){
	var ioClient = io.connect(App.ioUrl);
	var isIndicatorShown = false;
	const minVirtPos = 0;
	const maxVirtPos = 1024;
	const aTagWidth = (maxVirtPos - minVirtPos) / App.allHashtags.length;
	const realPosMultiplier = ($("#indicator").parent().width() - $("#indicator").width()) / (maxVirtPos - minVirtPos);
	const jqIndicator = $("#indicator");
	var _lastIndicatorPos = 0;
	var _syncHashtagSubmitted = false;
	
	function getCurrTagNum(virtPosition){
		const tagNum = Math.floor(virtPosition / aTagWidth) + 1;
		const withinTagPosition = virtPosition % aTagWidth;
		if(withinTagPosition > aTagWidth * (1/4) && withinTagPosition < aTagWidth * (3/4)){
			return tagNum;
		}
		return null;
	}
	
	// SPEED-UP setups
	const jqAllChannels = $(".channels input");
	const channelArr = [];
	for(var i = 0, ilen = App.allHashtags.length; i < ilen; i++){
		channelArr[i+1] = $(".channels input[id=channel" + (i+1) + "]");
	}
	// SPEED-UP setups
	function _highlightATag(tagNum){
		jqAllChannels.blur();
		if(tagNum !== null){
			channelArr[i+1].focus();
		}
	}
	
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
			_highlightATag(getCurrTagNum(virtPosition));
	
			// if(!_syncHashtagSubmitted) {
				// if(isIndicatorOverLastHashtag(virtPosition)) {
					// if(!isIndicatorOverLastHashtag(_lastIndicatorPos)) {
						// window.setTimeout(function() {
							// jqCustomizableHashtag.focus();
						// }, 1);
					// }
				// } else {
					// if(isIndicatorOverLastHashtag(_lastIndicatorPos)) {
						// window.setTimeout(function() {
							// jqCustomizableHashtag.blur();
						// }, 1);
					// }
				// }
			// }
			_lastIndicatorPos = virtPosition;
		}
	});
	
	ioClient.on("newHashtag", function(tagId, approvedHashtag) {
		_syncHashtagSubmitted = false;
		const jqChannel = $(".channels input[dataTagId=" + tagId + "]");
		if(!jqChannel.length){
			return console.error("DOM error: Channel with dataTagId " + tagId + " not found");
		}
		jqChannel.prop("disabled", "false");
		if(approvedHashtag) {
			jqChannel.css("opacity", 1);
		}else{
			jqChannel.prop("placeholder", "No Signal: " + jqChannel.prop("placeholder", ""));
		}
		_lastIndicatorPos = 0;
		// so the person sees new hashtag approved and if s/he moves indicator again -
		// it re-does "focus"
	});
	
	function sendCustomizableHashtagCandidate(tagId, _proposedHashtag) {
		$.ajax("/hashtag/", {
			type : "POST",
			data : JSON.stringify({
				hashtag : _proposedHashtag,
				tagId: tagId
			}),
			contentType : "application/json",
			dataType : "JSON",
			complete : function(jqXHR, textStatus) {
				console.log("Hashtag '" + _proposedHashtag + "' resulted in the response: " + textStatus);
			}
		});
	}
	
	(function runClient() {
		$(document).on("ontouchmove", function(event){
	      event.preventDefault();
	 	});
		if(!App.allHashtags.length) {
			console.error("No hashtags sent from the server: " + App.allHashtags.length);
		}
		var jqChannels = $(".channels input").keypress(function(ev) {
			var code = ev.keyCode || ev.which;
			const jqInp = $(this);
			if(code == 13) {
				var _proposedHashtag = jqInp.val();
				if(_proposedHashtag) {
					jqInp.css("opacity", 0.5);
					jqInp.prop("placeholder", _proposedHashtag);
					jqInp.prop("disabled", "disabled");
					var tagId = jqInp.attr("dataTagId");
					sendCustomizableHashtagCandidate(tagId, _proposedHashtag);
					_syncHashtagSubmitted = true;
					window.setTimeout(function() {
						jqInp.blur();
					}, 1);
				}
			}
		}).blur(function(ev) {
			const jqInp = $(this);
			if(jqInp.val()) {
				jqInp.val("");
			}
		});
	})();

});