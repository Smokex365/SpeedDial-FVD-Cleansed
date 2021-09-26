(function() {
  fvdSpeedDial.ThumbMaker = {
    getImageDataPath: function(params, cb) {
      chrome.runtime.sendMessage({
        action: "thumbmaker:getimagedatapath",
        params: params
      }, function(res) {
        cb(res.imgUrl, res.size);
      });
    },
    screenTab: function(params) {
      chrome.runtime.sendMessage({
        action: "thumbmaker:screentab",
        params: params
      });
    }
  };
})();