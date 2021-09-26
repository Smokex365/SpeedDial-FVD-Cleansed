(function() {
  window.addEventListener("load", function() {
    fvdSpeedDial.Utils.Opener.addModificator(function(url) {
      try {
        var parsedUrl = fvdSpeedDial.Utils.parseUrl(url);
        if(parsedUrl && parsedUrl.host) {
          var host = parsedUrl.host.toLowerCase();
          host = host.replace(/^www\./, "");
          if(host === "gearbest.com") {
            return "https://fvdspeeddial.com/load.php?url=" + encodeURIComponent(url)
          }
        }
      }
      catch(ex) {
      }
    });
  }, false);
})();