(function() {
  fvdSpeedDial.Donate = {
    canShow: function() {
      if(localStorage["paypal-donate-state"]) {
        return false;
      }
      return true;
    }
  };
})();