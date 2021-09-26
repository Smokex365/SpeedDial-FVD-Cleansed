(function() {
  var MAX_LOG_RECORDS = 300;
  var MAX_LOG_SIZE = 1024 * 1024;
  var STORAGE_KEY = "_app_log";

  window.addEventListener("load", function() {
    fvdSpeedDial.AppLog.startWriteCheckInterval();
  }, false);

  fvdSpeedDial.AppLog = {
    _logUpdated: false,
    _log: [],
    _writeCheckInterval: null,
    _read: function() {
      this._log = [];
      if(localStorage[STORAGE_KEY]) {
        try {
          this._log = JSON.parse(localStorage[STORAGE_KEY]);
        }
        catch(ex) {}
      }
    },
    getText: function() {
      return this._log.join("\n");
    },
    startWriteCheckInterval: function() {
      var self = this;
      this._writeCheckInterval = setInterval(function() {
        if(self._logUpdated) {
          self._logUpdated = false;
          self.write();
        }
      }, 1000);
    },
    write: function() {
      if(this._log.length > MAX_LOG_RECORDS) {
        this._log.splice(0, this._log.length - MAX_LOG_RECORDS);
      }
      var logJSON = JSON.stringify(this._log);
      while(logJSON.length > MAX_LOG_SIZE) {
        // preserve log size not greater than MAX_LOG_SIZE
        this._log.shift();
        logJSON = JSON.stringify(this._log);
      }
      localStorage[STORAGE_KEY] = logJSON;
    },
    info: function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift("info");
      this.log.apply(this, args);
    },
    err: function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift("err");
      this.log.apply(this, args);
    },
    warn: function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift("warn");
      this.log.apply(this, args);
    },
    log: function() {
      var args = Array.prototype.slice.call(arguments);
      var level = args.shift();
      var logLine = [];
      logLine.push(new Date().toUTCString());
      logLine.push("_" + level + "_");
      for(var i = 0; i != args.length; i++) {
        var elem = args[i];
        if(typeof elem === "object") {
          elem = JSON.stringify(elem);
        }
        logLine.push(elem);
      }
      logLine = logLine.join(" ");
      this._logUpdated = true;
      this._log.push(logLine);
    }
  };

  fvdSpeedDial.AppLog._read();
})();