document.addEventListener("DOMContentLoaded", function() {

  function callback_prefListener( key, value ){
    if(key == "poweroff.idle.interval") {
      refreshIdleInterval();
    }
  }


  function callback_onIdleStatechanged(state) {
    if(state == "idle" && parseInt(fvdSpeedDial.Prefs.get("poweroff.idle.interval"), 10) &&
       fvdSpeedDial.PowerOff.isEnabled()) {
      Broadcaster.sendMessage({
        action: "poweroff:hide"
      });
    }
  }

  function refreshIdleInterval() {
    var interval = parseInt(fvdSpeedDial.Prefs.get("poweroff.idle.interval"), 10);
    try {
      chrome.idle.onStateChanged.removeListener(callback_onIdleStatechanged);
    }
    catch(ex) {

    }
    if(interval) {
      console.log("Set idle callback for", interval);
      chrome.idle.onStateChanged.addListener(callback_onIdleStatechanged);
      chrome.idle.setDetectionInterval(interval);
    }
  }

  Broadcaster.onMessage.addListener(function(msg) {
    if(msg.action == "pref:changed") {
      callback_prefListener(msg.name, msg.value);
    }
  });

  refreshIdleInterval();
}, false);