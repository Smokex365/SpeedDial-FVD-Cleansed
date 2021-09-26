(function() {
  var showTimeout;
  function stopTimeout() {
    try {
      clearTimeout(showTimeout);
    }
    catch(ex) {
    }
  }
  function clearClasses() {
    var bottomTextContainer = document.getElementById("bottomTextContainer");
    bottomTextContainer.classList.remove("force-bottom");
    bottomTextContainer.classList.remove("static-position");
  }
  function resetBottomText() {
    stopTimeout();
    var bottomTextContainer = document.getElementById("bottomTextContainer");
    bottomTextContainer.removeAttribute("visible");
    clearClasses();
  }
  fvdSpeedDial.SpeedDial.onBuildStart.addListener(resetBottomText);
  fvdSpeedDial.SpeedDial.onGroupChange.addListener(function() {
    // need to hide bottom text completely
    var bottomTextContainer = document.getElementById("bottomTextContainer");
    bottomTextContainer.setAttribute("hide", 1);
  });
  window.addEventListener("resize", resetBottomText, false);
  fvdSpeedDial.SpeedDial.onBuildCompleted.addListener(function() {
    stopTimeout();
    showTimeout = setTimeout(function() {
      var bottomTextContainer = document.getElementById("bottomTextContainer");
      var speedDialContent = document.getElementById("speedDialContent");
      var windowHeight = window.innerHeight;
      var speedDialContentBoundingRect = speedDialContent.getBoundingClientRect();
      clearClasses();
      if(speedDialContentBoundingRect.bottom > windowHeight) {
        bottomTextContainer.classList.add("static-position");
      }
      else {
        bottomTextContainer.classList.add("force-bottom");
      }
      if(bottomTextContainer.hasAttribute("visible")) {
        return;
      }
      bottomTextContainer.removeAttribute("hide");
      bottomTextContainer.setAttribute("visible", 1);
    }, 0);
  });
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(function() {
      var bottomTextContainer = document.getElementById("bottomTextContainer");
      bottomTextContainer.setAttribute("muted", 1);
    }, 3000);
  }, false);
})();