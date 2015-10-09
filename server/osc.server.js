var net = require("net");
var osc = require("osc-min");
var dgram = require("dgram");

var settings = {
  clientPort : 11000,
  // hostIp: "10.196.214.228"
  hostIp: "localhost"
};

var client;
var udp = dgram.createSocket("udp4");
udp.on("error", function(err){
       console.error("UDP socket error: %j", err);
});

function close(){
  if(client){
    client.end();
    client.destroy();
  }
    if(udp){
        udp.close();
    }
}

function sendUDP(address, data) {
  var args = [];
  for (var i = 0; i < data.length; i++) {
    args.push({
      type : "float",
      value : data[i]
    });
  }
  var buf = osc.toBuffer({
    address : "/" + address,
    args : args
  });
  // console.log("An Array: Buffer to send: %s", buf.toString());
  return udp.send(buf, 0, buf.length, settings.clientPort, settings.hostIp);
}


function send(address, data) {
  _writeDataToSocket = function(socket, address, data){
    console.log('OSC socket connected');
    console.log("Details: %j", socket.address());
    console.log("Data: %j", data);
    var buf = osc.toBuffer({
      address : "/" + address,
      args : [data]
    });
    var tmpBuf = new Buffer(buf.length + 4);
    buf.copy(tmpBuf, 4, 0);
    tmpBuf.writeUInt32BE(buf.length, 0);
    console.log("Buffer to send: %s", tmpBuf.toString());
    console.log("Buffer length: %d", tmpBuf.length);
    socket.write(tmpBuf);
  };
  
  if(!client){
    client = net.connect(settings.clientPort, settings.hostIp, function() {//'connect' listener
      _writeDataToSocket(client, address, data);
    });
    client.on("error", function(err){
      console.log("Couldn't send data to the OSC server: " + err);
    });
    client.on("close", function(){
      client = null;
    });
    client.on("end", function(){
      client.destroy();
    });
  }else{
    _writeDataToSocket(client, address, data);
  }
}

module.exports = {
  sendMusicParamsToRobin: function(data){
  	console.log("qoqwo4 DATA to send to OSC" + data + "\n");
  	sendUDP("valence", [data[0]]);
  	sendUDP("arousal", [data[1]]);
  	sendUDP("repetition", [data[2]]);
    return sendUDP("noise", [data[3]]);
  },
  close: close
};
