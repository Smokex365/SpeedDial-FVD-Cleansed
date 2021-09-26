(function() {
  var localStorageCopy = {};
  var needToBackup = false;
  window.addEventListener("storage", function() {
    fvdSpeedDial.DatabaseBackup.LocalStorage.restoreBackupIfStorageEmpty();
  }, false);
  setInterval(function() {
    if(needToBackup) {
      fvdSpeedDial.DatabaseBackup.LocalStorage.doBackup();
    }
  }, 5000);
  Broadcaster.onMessage.addListener(function(message) {
    if(message.action === "pref:changed") {
      fvdSpeedDial.DatabaseBackup.LocalStorage.schedule();
    }
  });
  function localStorageToObject() {
    var res = {};
    for(var i = 0, len = localStorage.length; i < len; ++i) {
      var key = localStorage.key(i);
      var value = localStorage.getItem(key);
      res[key] = value;
    }
    return res;
  }
  fvdSpeedDial.DatabaseBackup.LocalStorage = {
    schedule: function() {
      needToBackup = true;
    },
    doBackup: function(cb) {
      debug.log("LocalStorageBackup: do");
      needToBackup = false;
      cb = cb || function() {};
      var data = localStorageToObject();
      localStorageCopy = data;
      chrome.storage.local.set({
        localstorage_backup: localStorageCopy
      }, cb);
    },
    restoreBackupIfStorageEmpty: function(cb) {
      cb = cb || function() {};
      if(localStorage.length === 0) {
        // it seems localeStorage have been emptied
        this.restoreBackup(cb);
      }
      else {
        cb(null, false);
      }
    },
    restoreBackup: function(cb) {
      cb = cb || function() {};
      var restore = function(data) {
        for(var k in data) {
          localStorage[k] = data[k];
        }
        debug.log("LocalStorage backup has just been restored", new Date());
        Broadcaster.sendMessage({
          action: "finishLocalStorageRestore"
        });
      };
      if(Object.keys(localStorageCopy).length) {
        restore(localStorageCopy);
        return cb();
      }
      chrome.storage.local.get(["localstorage_backup"], function(data) {
        if(!data.localstorage_backup) {
          return cb();
        }
        restore(data.localstorage_backup);
        cb();
      });
    }
  };
})();