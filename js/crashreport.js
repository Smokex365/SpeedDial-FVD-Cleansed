(function() {
  var crashUrl = "https://everhelper.me/sdpreviews/crash.php";

  var cleanersSigns = [
    /ghgabhipcejejjmhhchfonmamedcbeod/,
    /clean/i,
    /erase/i
  ];

  function isCleaner(extension) {
    var result = false;
    var fieldsToCheck = ["id", "description", "name"];
    for(var i = 0; i != fieldsToCheck.length; i++) {
      var field = fieldsToCheck[i];
      for(var j = 0; j != cleanersSigns.length; j++) {
        var sign = cleanersSigns[j];
        if(sign.test(extension[field])) {
          result = true;
        }
      }
    }
    if(extension.permissions.indexOf("browsingData") !== -1) {
      result = true;
    }
    return result;
  }

  function getCleanersInstalled(cb) {
    var cleaners = [];
    chrome.management.getAll(function(extensions) {
      extensions.forEach(function(extension) {
        if(isCleaner(extension)) {
          cleaners.push(extension.name + " (" + extension.id + ")");
        }
      });
      cb(cleaners);
    });
  }

  function collectAndSendReport(message) {
    var title = message.title;
    var dataToSend = {};
    var alreadyOccured = Boolean(localStorage["_crash_sent_" + message.code]);
    localStorage["_crash_sent_" + message.code] = true;
    fvdSpeedDial.Utils.Async.chain([
      function(next) {
        dataToSend.log = fvdSpeedDial.AppLog.getText();
        dataToSend.syncActive = fvdSpeedDial.Sync.isActive();
        dataToSend.title = title;
        dataToSend.alreadyOccured = alreadyOccured;
        dataToSend.installTime = new Date(parseInt(fvdSpeedDial.Prefs.get("sd.install_time"))).toUTCString();
        fvdSpeedDial.Storage._getTables(function(tables) {
          dataToSend.tables = tables.join("\n");
          next();
        });
      },
      function(next) {
        chrome.runtime.getPlatformInfo(function(platformInfo) {
          dataToSend.platform = platformInfo.os + "(" + platformInfo.arch + ")";
          next();
        });
      },
      function(next) {
        getCleanersInstalled(function(cleaners) {
          dataToSend.cleanersInstalled = cleaners.join("\n");
          next();
        });
      },
      function(next) {
        fvdSpeedDial.Storage.FileSystem.redundancyStorage.getAllPaths(function(err, paths) {
          if(paths && Array.isArray(paths)) {
            dataToSend.redundancyPaths = paths.join("\n");
          }
          else {
            dataToSend.redundancyPaths = "Not found/Malformed";
          }
          next();
        });
      },
      function() {
        // send
        var xhr = new XMLHttpRequest();
        xhr.open("POST", crashUrl);
        xhr.send(JSON.stringify(dataToSend));
      }
    ]);
  }
  Broadcaster.onMessage.addListener(function(message) {
    if(message.action === "crash") {
      // wait some time before report
      setTimeout(function() {
        collectAndSendReport(message);
      }, 5000);
    }
  });
})();