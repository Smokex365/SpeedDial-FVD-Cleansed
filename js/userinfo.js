(function() {
  fvdSpeedDial.UserInfo = {
    _isGettingUserCountry: false,
    _userCountryCallbacks: [],
    getCountry: function(cb) {
      var self = this;
      var key = "user_info.country";
      if(localStorage[key]) {
        return cb(null, localStorage[key]);
      }
      this._userCountryCallbacks.push(cb);
      if(this._isGettingUserCountry) {
        return;
      }
      this._isGettingUserCountry = true;
      fvdSpeedDial.Utils.getUserCountry(function(country) {
        if(!country) {
          country = "-";
        }
        localStorage[key] = country;
        self._userCountryCallbacks.forEach(function(cb) {
          try {
            cb(null, country);
          }
          catch(ex) {
            console.error(ex);
          }
        });
        self._userCountryCallbacks = [];
      });
    }
  };
})();