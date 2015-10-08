
function _setReadyToBeRun(){
  $("#message").find("b").text("HAS");
  $("#message").css("background-color", "#90EE90");  
}

if(App._isReadyToBeRun){
  _setReadyToBeRun();
}else{
  var ioAdmin = io.connect(App.ioUrl);
  ioAdmin.on("ready", function() {
    _setReadyToBeRun();
    ioAdmin.disconnect();
  }); 
}

$("#startButton").click(function(ev){
  $.ajax("/start", {
    type : "POST",
    data : JSON.stringify({"data":"bla-bla"}),
    dataType : "JSON",
    contentType: "application/json",
    complete : function(jqXHR, textStatus) {
      console.log("Start button clicking has resulted in the response: " + textStatus);
    }
  });
});

$("#stopButton").click(function(ev){
  $.ajax("/stop", {
    type : "POST",
    data : {},
    contentType: "application/json",
    dataType : "JSON",
    complete : function(jqXHR, textStatus) {
      console.log("Stop button clicking has resulted in the response: " + textStatus);
    }
  });
});

$("[role=toDefault] input").click(function(ev){
	const tagId = $(this).attr("dataId");
  $.ajax("/neutralhashtag/", {
    type : "POST",
    data : {tagId: tagId},
    contentType: "application/json",
    dataType : "JSON",
    complete : function(jqXHR, textStatus) {
      console.log("Switch button clicking has resulted in the response: " + textStatus);
    }
  });
});