fvdSpeedDial.PremiumForShare = new function(){
  function isAuthorizedOnServer(cb) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://everhelper.me/shareforpremium/can.php");
    xhr.onload = function() {
      var resp = JSON.parse(xhr.responseText);
      if(!resp.can){
        cb(false);
      }
      else{
        cb(true);
      }
    };
    xhr.send(JSON.stringify({
      action: "user:authstate"
    }));
  }

  this.canDisplay = function(params, cb) {
    if(typeof params == "function"){
      cb = params;
      params = {};
    }
    if(document.location.hash == "#premiumforshare"){
      return cb(true);
    }
    if(!params.ignoreDisplayed && fvdSpeedDial.Prefs.get("premiumforshare.displayed")){
      return;
    }
    var installTime = parseInt(fvdSpeedDial.Prefs.get("sd.install_time"));
    if(new Date().getTime() - installTime < 3600 * 24 * 7 * 1000){
      return cb(false);
    };
    fvdSpeedDial.Sync.syncAddonExists(function(exists){
      if(!exists){
        return cb(false);
      }
      isAuthorizedOnServer(function(authorized) {
        if(!authorized){
          return cb(false);
        }
        var introductionOverlay = document.getElementById("introductionOverlay");
        if(introductionOverlay && introductionOverlay.hasAttribute("appear")){
          return cb(false);
        }
        cb(true);
      });
    });
  };
};
