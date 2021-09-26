// redirect all requests from proxy to Storage object

(function() {
  Broadcaster.onMessage.addListener(function(msg, sender, sendResponse) {
    if(msg.action == "proxy:storage") {
      var startTime = new Date().getTime();
      if(msg.wantResponse) {
        msg.args.push(function() {
          var duration = (new Date().getTime() - startTime)/1000;
          sendResponse({
            args: Array.prototype.slice.call(arguments),
            receiveTime: startTime,
            duration: duration
          });
        });
      }
      var accessObj = fvdSpeedDial.Storage,
          parts = msg.method.split("."),
          m = parts.pop();
      parts.forEach(function(part) {
        accessObj = accessObj[part];
      });
      //console.log("ARGS", m, msg.args);
      accessObj[m].apply(accessObj, msg.args);
      if(msg.wantResponse) {
        // we call waitResponse after processing
        return true;
      }
    }
  });
})();