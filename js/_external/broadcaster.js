(function() {
  var Broadcaster = {
    _chromeVersion: null,
    _isBackgroundPage: null,
    _onlyOnce: function(fn) {
      var onceFn = function() {
        if (onceFn._broadcasterCalled) {
          return;
        }
        onceFn._broadcasterCalled = true;
        fn.apply(window, arguments);
      };
      onceFn._broadcasterCalled = false;
      return onceFn;
    },
    chromeVersion: function() {
      if(this._chromeVersion) {
        return this._chromeVersion;
      }
      var match = navigator.userAgent.match(/Chrome\/([0-9]+)/i);
      if(!match) {
        console.error("Fail to parse chrome version", navigator.userAgent, "assume that is 55");
        return 55;
      }
      return parseInt(match[1]);
    },
    isBackgroundPage: function(cb) {
      if(this._isBackgroundPage === null) {
        return chrome.runtime.getBackgroundPage(function(bg) {
          if(!bg) {
            console.log("Fail to get BG page:", chrome.runtime.lastError);
          }
          Broadcaster._isBackgroundPage = bg == window;
          cb(null, Broadcaster._isBackgroundPage);
        });
      }
      cb(null, this._isBackgroundPage);
    },
    onMessage: {
      _listeners: [],
      _call: function(msg, cb) {
        var result = false;
        cb = cb || function() {};
        var sender = {
          url: document.location.href,
          id: chrome.runtime.id
        };
        var args = [msg, sender];
        if(cb) {
          args.push(cb);
        }
        for(var i = 0; i != this._listeners.length; i++) {
          var callres = this._listeners[i].apply(window, args);
          if(callres === true || cb._broadcasterCalled) {
            // return true, when response should be obtained from current page listeners
            result = true;
          }
        }
        return result;
      },
      addListener: function(listener) {
        if(this._listeners.indexOf(listener) !== -1) {
          return;
        }
        this._listeners.push(listener);
        chrome.runtime.onMessage.addListener(listener);
      },
      removeListener: function(listener) {
        var index = this._listeners.indexOf(listener);
        if(index !== -1) {
          return;
        }
        this._listeners.splice(index, 0);
        chrome.runtime.onMessage.removeListener(listener);
      }
    },
    sendMessage: function(msg, cb) {
      if(cb) {
        cb = this._onlyOnce(cb);
      }
      // In Chrome >= 57 sendMessage deliver messages to all frames execept the sender's frame
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1286124#c10
      // In earlier Chrome versions message is delivered to sender's frame only
      // if other extension's frames are opened, so  chrome.extension.getViews().length is more than 1
      if(this.chromeVersion() >= 57 || chrome.extension.getViews().length === 1) {
        // message will not be delivered to current frame, call local listeners
        var currentPageCallRes = this.onMessage._call(msg, cb);
        if(currentPageCallRes && cb) {
          // not need to call remote listeners, message has been acknowledged by curent frame's listener
          return;
        }
      }
      var args = [msg];
      if(cb) {
        args.push(cb);
      }
      chrome.runtime.sendMessage.apply(chrome.runtime, args);
    }
  };

  window.Broadcaster = Broadcaster;

  // precache background page state
  Broadcaster.isBackgroundPage(function() {});
})();