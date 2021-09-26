(function() {
  fvdSpeedDial.Storage.onDataChanged.addListener(function() {
        fvdSpeedDial.DatabaseBackup.scheduleBackup();
  });
  Broadcaster.onMessage.addListener(function(message) {
    if(message.action === "miscDataSet" && message.name === "sd.background") {
      fvdSpeedDial.DatabaseBackup.doBackgroundBackup();
    }
  });
  var checkWindowInterval;
  function stopCheckWindowInterval() {
    try {
      clearInterval(checkWindowInterval);
    }
    catch(ex) {
    }
    finally {
      checkWindowInterval = null;
    }
  }
  function startCheckBackupWindowInterval() {
    stopCheckWindowInterval();
    debug.log("DatabaseBackup: wait for a backup window");
    // use polling state because onStateChanged event already used in poweroff with its detection interval
    checkWindowInterval = setInterval(function() {
      if(fvdSpeedDial.DatabaseBackup.isRestoring) {
        return;
      }
      chrome.idle.queryState(fvdSpeedDial.Config.IDLE_TIME_FOR_DATABASE_BACKUP, function(state) {
        if(state === "idle") {
          debug.log("DatabaseBackup: idle state found");
          // it's time for backup!
          stopCheckWindowInterval();
          fvdSpeedDial.DatabaseBackup.doBackup();
        }
      });
    }, 10000);
  }

  function BackupRestore() {
    this.data = null;
  };

  BackupRestore.prototype.restore = function(tx, cb) {
    if(typeof tx === "function") {
      cb = tx;
      tx = null;
    }
    debug.log("Start restoring database backup, restore data is", this.data);
    fvdSpeedDial.DatabaseBackup.isRestoring = true;
    Broadcaster.sendMessage({
      action: "startDBRestore"
    });
    function end() {
      fvdSpeedDial.DatabaseBackup.isRestoring = false;
      Broadcaster.sendMessage({
        action: "finishDBRestore"
      });
    }
    var restoreTimeout = setTimeout(function() {
      end();
      fvdSpeedDial.AppLog.info("Backup restoring has been timed out");
      cb(new Error("backup restore timed out"));
    }, 5 * 60 * 1000);
    var startTime = new Date().getTime();
    fvdSpeedDial.Storage.restoreTablesDataInOneTransaction(this.data, function() {
      debug.log("Database backup has been restored");
      var endTime = new Date().getTime();
      fvdSpeedDial.AppLog.info("Restore duration: " + (endTime - startTime)/1000);
      // backup has been successfully restored
      clearTimeout(restoreTimeout);
      end();
      cb(null);
    }, null, tx);
  };

  fvdSpeedDial.DatabaseBackup = {
    isRestoring: false,
    isBackupScheduled: function() {
      var v = false;
      try {
        v = JSON.parse(localStorage.databasebackup_scheduled);
      }
      catch(ex) {
      }
      return v;
    },
    setBackupScheduled: function(set) {
      localStorage.databasebackup_scheduled = JSON.stringify(set);
    },
    scheduleBackup: function() {
      if(this.isBackupScheduled()) {
        return;
      }
      this.setBackupScheduled(true);
      startCheckBackupWindowInterval();
    },
    getBackup: function(cb) {
      chrome.storage.local.get(["database_backup"], function(data) {
        if(!data.database_backup) {
          return cb(new Error("backup is not available"));
        }
        var backup = new BackupRestore();
        backup.data = data.database_backup;
        cb(null, backup);
      });
    },
    doBackgroundBackup: function(cb) {
      var self = this;
      debug.log("DatabaseBackup: do background backup");
      cb = cb || function() {};
      fvdSpeedDial.Storage.getMisc("sd.background", function(fileUrl) {
        if(!fileUrl) {
          return cb(null);
        }
        fvdSpeedDial.Storage.FileSystem.readAsDataURLbyURL(fileUrl, function(err, data) {
          if(err) {
            cb(err);
          }
          if(data) {
            chrome.storage.local.set({
              background_backup: data
            }, cb);
          }
          else {
            cb(null);
          }
        });
      });
    },
    doBackup: function(cb) {
      var self = this;
      debug.log("DatabaseBackup: do database backup");
      cb = cb || function() {};
      var data = [];
      fvdSpeedDial.Utils.Async.chain([
        function(next) {
          fvdSpeedDial.Storage.fullDump(function(err, _data) {
            if(err) {
              return cb(err);
            }
            debug.log("DatabaseBackup: full dump received");
            data = _data;
            next();
          });
        },
        function(next) {
          if(Object.keys(data).length === 0) {
            console.error("Trying to backup an empty tables set, ignore backuping");
            return next();
          }
          chrome.storage.local.set({
            database_backup: data
          }, next);
        },
        function() {
          self.setBackupScheduled(false);
          debug.log("DatabaseBackup: backup finished");
          cb(null);
        }
      ]);
    },
    restoreBackgroundBackup: function(cb) {
      chrome.storage.local.get(["background_backup"], function(data) {
        if(data.background_backup) {
          fvdSpeedDial.Storage.setMisc("sd.background", data.background_backup, function() {
            cb(null, true);
          });
        }
        else {
          cb(null, false);
        }
      });
    },
    restore: function(cb) {
      this.getBackup(function(err, backup) {
        if(err) {
          return cb(err);
        }
        fvdSpeedDial.Storage.transaction(function(tx) {
          backup.restore(tx, cb);
        });
      });
    }
  };

  if(fvdSpeedDial.DatabaseBackup.isBackupScheduled()) {
    // backup can be shceduled by previous starts of chrome addon
    // and it has not been done yet, try to schedule it again
    startCheckBackupWindowInterval();
  }

  Broadcaster.onMessage.addListener(function(msg, sender, sendResponse) {
    if(msg && msg.action === "databaseBackup:getState") {
      sendResponse(fvdSpeedDial.DatabaseBackup.isRestoring ? "restoring" : "normal");
    }
  });
})();