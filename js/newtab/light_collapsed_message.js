(function() {
  var timeout = null;
  function elem() {
    return document.querySelector("#lightCollapsedMessage");
  }
  function reposition() {
    var msg = elem();
    if(msg.hasAttribute("top")) {
      // message in top, do not center it
      return;
    }
    var windowWidth = document.documentElement.clientWidth;
    var windowHeight = document.documentElement.clientHeight;
    var elemWidth = msg.offsetWidth;
    var elemHeight = msg.offsetHeight;
    var pos = {
      left: windowWidth/2 - elemWidth/2,
      top: windowHeight/2 - elemHeight/2
    };
    msg.style.left = pos.left + "px";
    msg.style.top = pos.top + "px";
  }

  fvdSpeedDial.lightCollapsedMessage = {
    show: function() {
      if(!_b(fvdSpeedDial.Prefs.get("sd.light_collapsed_message_show"))) {
        return;
      }
      var self = this;
      var msg = elem();
      msg.style.display = "block";
      reposition();
      setTimeout(function() {
        msg.setAttribute("appear", 1);
        try {
          clearTimeout(timeout);
        }
        catch(ex) {
        }
        timeout = setTimeout(function() {
          self.hideAnimate();
        }, 3000);
      }, 100);
    },
    hide: function() {
      var msg = elem();
      if(msg.style.display === "none") {
        return;
      }
      msg.style.display = "none";
      msg.removeAttribute("appear");
      msg.removeAttribute("top");
    },
    hideAnimate: function() {
      var self = this;
      elem().removeAttribute("appear");
      setTimeout(function() {
        self.hide();
      }, 300);
    },
    doNotShowMore: function() {
      fvdSpeedDial.Prefs.set("sd.light_collapsed_message_show", false);
    }
  };

  window.addEventListener("resize", function() {
    if(elem().style.display === "block") {
      reposition();
    }
  }, false);
  document.addEventListener("DOMContentLoaded", function() {
    var closeButton = elem().querySelector(".close-button");
    closeButton.addEventListener("click", function() {
      fvdSpeedDial.lightCollapsedMessage.doNotShowMore();
      fvdSpeedDial.lightCollapsedMessage.hideAnimate();
    }, false);
  }, false);
})();