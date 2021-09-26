(function() {
  // collects various analytic metrics

  function sendEvent(action) {
    var statsUrl = "https://fvdspeeddial.com/a/?a="
      + encodeURIComponent(action) + "&from=chrome_addon";
    fvdSpeedDial.Utils.getUrlContent(statsUrl, function() {
    });
  }

  Broadcaster.onMessage.addListener(function(message) {
    if(message.action === "first-install") {
      sendEvent("install");
    }
  })

  Broadcaster.onMessage.addListener(function(message) {
    if(message.action === "sdtab:open") {
      // delay a bit, to not overhelm chrome with many jobs, because newtab opening is a quite
      // resource consuming task
      setTimeout(() => {
        fvdSpeedDial.AppAnalyticsClient.pageview('/newtab')
      }, 3000)
    }
  })
})();