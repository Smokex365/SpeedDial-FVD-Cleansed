(function() {
  function _setNoNeedToOffer() {
    fvdSpeedDial.Prefs.set("sd.need_to_offer_parallax", false);
  }
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(function() {
        return; // Task #1804
        
      if(!_b(fvdSpeedDial.Prefs.get("sd.need_to_offer_parallax"))) {
        return;
      }
      if(fvdSpeedDial.Prefs.get("sd.background_url_type") === "parallax") {
        return _setNoNeedToOffer();
      }
      if(fvdSpeedDial.Prefs.get("sd.background_url_type") === "noimage") {
        return;
      }
      fvdSpeedDial.Templates.get("parallax-offer", {fragment: true}, function(err, el) {
        if(err) {
          return console.error(err);
        }
        if(document.querySelector(".bigInfoDialogOverlay[appear=\"1\"]")) {
          // another biginfo dialog is displaying
          return;
        }
        function _close() {
          _setNoNeedToOffer();
          parallaxOverlay.removeAttribute("appear");
          setTimeout(function() {
            parallaxOverlay.parentNode.removeChild(parallaxOverlay);
          }, 300);
        }
        fvdSpeedDial.Localizer.localizeElem(el);
        document.body.appendChild(el);
        var parallaxOverlay = document.querySelector("#parallaxOfferOverlay");
        parallaxOverlay.querySelector(".close").addEventListener("click", _close, false);
        parallaxOverlay.querySelector(".btnClose").addEventListener("click", _close, false);
        parallaxOverlay.querySelector(".btnParallax").addEventListener("click", function() {
          fvdSpeedDial.Prefs.set("sd.background_url_type", "parallax");
          _close();
        }, false);
        setTimeout(function() {
          parallaxOverlay.setAttribute("appear", 1);
        }, 0);
      });
    }, 1000);
  }, false);
})();