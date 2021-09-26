(function() {
  window.MemoryCache = {
    _data: {},
    set: function(key, value, timeoutValue) {
      timeoutValue = timeoutValue || 300000;
      var self = this;
      var obj = {};
      if(this._data[key]) {
        try {
          clearTimeout(this._data[key].timeout);
        }
        catch(ex) {
        }
        obj = this._data[key];
      }
      else {
        this._data[key] = obj;
      }
      obj.timeout = setTimeout(function() {
        self._data[key] = null;
      }, timeoutValue);
      obj.value = value;
    },
    del: function(key) {
      if(!this._data[key]) {
        return;
      }
      try {
        clearTimeout(this._data[key].timeout);
      }
      catch(ex) {
      }
      delete this._data[key];
    },
    get: function(key) {
      if(!this._data[key]) {
        return null;
      }
      return this._data[key].value;
    }
  };
})();