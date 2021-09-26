(function() {
  fvdSpeedDial.Sync = {
    addDataToSync: function(params, cb) {
      var req = {
        action: "sync:adddatatosync",
        params: params
      };
      if(cb) {
        req.wantResponse = true;
      }
      chrome.runtime.sendMessage(req, function() {
        if(cb) {
          cb();
        }
      });
    },
    removeSyncData: function(params, cb) {
      cb = cb || function(){};
      chrome.runtime.sendMessage({
        action: "sync:removesyncdata",
        params: params
      }, function() {
        cb();
      });
    },
    isActive: function(cb) {
      chrome.runtime.sendMessage({
        action: "sync:isactive"
      }, function(active) {
        cb(active);
      });
    },
    hasDataToSync: function(cb) {
      chrome.runtime.sendMessage({
        action: "sync:hasdatatosync"
      }, function(has) {
        cb(has);
      });
    },
    startSync: function(type, cb) {
      cb = cb || function() {};
      chrome.runtime.sendMessage({
        action: "sync:start",
        type: type
      }, cb);
    },
    syncAddonOptionsUrl: function(cb) {
      chrome.runtime.sendMessage({
        action: "sync:addonoptionsurl",
      }, cb);
    },
    importFinished: function() {
      chrome.runtime.sendMessage({
        action: "sync:importfinish",
      });
    },
    syncAddonExists: function(cb) {
      chrome.runtime.sendMessage({
        action: "sync:syncaddonexists",
      }, cb);
    }
  };
})();