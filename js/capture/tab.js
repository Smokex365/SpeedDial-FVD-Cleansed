// tab script for hidden capture, sends and receive data from background tab

(function() {
  fvdSpeedDial.HiddenCaptureQueue = {
    capture: function(params, callback) {
      chrome.runtime.sendMessage({
        action: "hiddencapture:queue",
        wantResponse: callback ? true : false
      }, function(res) {
        if(callback) {
          callback(res);
        }
      });
    },
    empty: function () { // Task 1391.7
        chrome.runtime.sendMessage({
            action: "hiddencapture:empty"
        , }, function () {});
    }
  };
})();