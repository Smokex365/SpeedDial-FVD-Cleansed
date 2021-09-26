(function() {

  var DISPLAY_POPUP_TIMEOUT = 700;
  var SUPPORTED_ZONES = [
    /\.com$/i,
    /\.es$/i,
    /\.it$/i,
    /\.ca$/i,
    /\.fr$/i,
    /\.de$/i,
    /\.co\.uk$/i
  ];

  function AmazonInfoPopup() {
    this.defaultFrameWidth = 400;
    this.defaultFrameHeight = 200;
    this.padding = 10;
    this.width = 0;
    this.height = 0;
    this.asin = null;
    this.url = null;
    this.elem = null;
    this.frame = null;
    this.urlTemplate = "https://fvdspeeddial.com/fst/amazon-product.php?asin=%asin%&url=%url%";
    this.attachedTo = null;
    this.visibilityTransitionTimeout = -1;
    this.tryHideTimeout = -1;
    this.arrowWidth = 10;

    this.build();
    this.resizeFrame();
  }

  AmazonInfoPopup.prototype.setProductId = function(asin, url) {
    this.asin = asin;
    this.url = url;
    this.loadFrame();
  };

  AmazonInfoPopup.prototype._onFrameLoad = function() {
    this.elem.setAttribute("loading", 0);
  };

  AmazonInfoPopup.prototype._onMouseOver = function() {
    this.elem.setAttribute("mouseover", 1);
    try {
      clearTimeout(this.tryHideTimeout);
    }
    catch(ex) {}
  };

  AmazonInfoPopup.prototype._onMouseOut = function() {
    this.elem.removeAttribute("mouseover");
    this.tryHide();
  };

  AmazonInfoPopup.prototype.getFrameURL = function() {
    return this.urlTemplate
      .replace("%asin%", encodeURIComponent(this.asin))
      .replace("%url%", encodeURIComponent(this.url));
  };

  AmazonInfoPopup.prototype.loadFrame = function() {
    var url = this.getFrameURL();
    if(url === this.frame.getAttribute("src")) {
      return;
    }
    this.elem.setAttribute("loading", 1);
    this.frame.setAttribute("src", url);
  };

  AmazonInfoPopup.prototype.build = function() {
    if(this.elem) {
      return;
    }
    var self = this;
    var oldPopup = document.getElementById("amazon-info-popup");
    if(oldPopup) {
      oldPopup.parentNode.removeChild(oldPopup);
    }
    var elem = document.createElement("div");
    elem.setAttribute("id", "amazon-info-popup");
    elem.addEventListener("mouseover", this._onMouseOver.bind(this), false);
    elem.addEventListener("mouseout", this._onMouseOut.bind(this), false);

    var content = document.createElement("div");
    content.className = "amazon-info-popup-content";

    var disableWidgetLink = document.createElement("a");
    disableWidgetLink.className = "amazon-info-popup-disable";
    disableWidgetLink.textContent = _("newtab_disable_page_mod");
    disableWidgetLink.addEventListener("click", function() {
      fvdSpeedDial.Dialogs.confirm(
        _("dlg_confirm_disable_quick_preview_title"),
        _("dlg_confirm_disable_quick_preview_text"),
        function(confirmed) {
          if(confirmed) {
            fvdSpeedDial.Prefs.set("quick-preview.enabled", false);
          }
        }
      );
      self.hide();
    }, false);
    content.appendChild(disableWidgetLink);
    elem.appendChild(content);

    var frame = document.createElement("iframe");
    content.appendChild(frame);
    document.body.appendChild(elem);

    frame.addEventListener("load", this._onFrameLoad.bind(this), false);

    this.elem = elem;
    this.frame = frame;
  };

  AmazonInfoPopup.prototype.attach = function(elem) {
    var rect = fvdSpeedDial.Utils.getBoundingClientRect(elem);
    var position = "right";
    if(rect.right + this.width > window.innerWidth) {
      position = "left";
    }
    if(position === "right") {
      this.elem.setAttribute("arrow", "left");
      this.elem.style.left = (rect.right - this.arrowWidth) + "px";
      this.elem.style.top = (rect.top + rect.height/2 - this.height/2) + "px";
    }
    else if(position === "left") {
      this.elem.setAttribute("arrow", "right");
      this.elem.style.left = (rect.left - this.width - this.arrowWidth) + "px";
      this.elem.style.top = (rect.top + rect.height/2 - this.height/2) + "px";
    }
    this.attachedTo = elem;
  };

  AmazonInfoPopup.prototype.dettach = function() {
    this.attachedTo = null;
  };

  AmazonInfoPopup.prototype.resizeFrame = function(width, height) {
    width = width || this.defaultFrameWidth;
    height = height || this.defaultFrameHeight;
    this.width = width + this.padding * 2;
    this.height = height + this.padding * 2;
    this.frame.style.width = width + "px";
    this.frame.style.height = height + "px";
  };

  AmazonInfoPopup.prototype.show = function(elem) {
    try {
      clearTimeout(this.visibilityTransitionTimeout);
    }
    catch(ex) {}
    try {
      clearTimeout(this.tryHideTimeout);
    }
    catch(ex) {}
    var needAnimation = true;
    if(this.attachedTo === elem) {
      needAnimation = false;
    }
    this.attach(elem);
    this.elem.setAttribute("visible", 1);
    if(this.elem.style.animationName === "amazon-info-popup-disappear") {
      this.elem.style.animationName = ""
    }
    //;
    if(needAnimation) {
      this.elem.style.animationName = "amazon-info-popup-appear-arrow-" + this.elem.getAttribute("arrow");
    }
  };

  AmazonInfoPopup.prototype.tryHide = function() {
    var self = this;
    this.tryHideTimeout = setTimeout(function() {
      self.hide();
    }, 100);
  };

  AmazonInfoPopup.prototype.hide = function() {
    var self = this;
    this.elem.style.animationName = "amazon-info-popup-disappear";
    this.visibilityTransitionTimeout = setTimeout(function() {
      self.elem.setAttribute("visible", 0);
      self.dettach();
      self.resizeFrame();
      self.frame.setAttribute("src", "");
    }, 250);
  };

  var amazonInfoPopupInstance = null;
  var urlAsinCache = {};

  function getDialElem(elem) {
    if(elem.matches(".newtabCell")) {
      return elem;
    }
    if(!elem.parentNode || !elem.parentNode.matches) {
      return null;
    }
    return getDialElem(elem.parentNode);
  }
  function getAsinByUrl(url) {
    if(!urlAsinCache.hasOwnProperty(url)) {
      var asin = null;
      try {
        if(!/amazon\./i.test(url)) {
          throw new Error("not amazon url");
        }
        var parsedUrl = fvdSpeedDial.Utils.parseUrl(url);
        if(!parsedUrl || !parsedUrl.host) {
          throw new Error("Can't parse url");
        }
        var isZoneSupported = false;
        for(var i = 0; i != SUPPORTED_ZONES.length; i++) {
          if(SUPPORTED_ZONES[i].test(parsedUrl.host)) {
            isZoneSupported = true;
            break;
          }
        }
        if(!isZoneSupported) {
          throw new Error("zone is not supported");
        }
        var preparedUrl = url.replace(/^https?:\/\//, "");
        preparedUrl = preparedUrl.replace(/^[^\/]+/, "");
        var regexps = [
          /^\/[^\/]+?\/[a-z]{2}\/(B[a-z0-9]{9})(?:\/|\?|$)/i,
          /^\/[a-z]{2}\/(B[a-z0-9]{9})(?:\/|\?|$)/i,
          /^\/[a-z]{2}\/product\/(B[a-z0-9]{9})(?:\/|\?|$)/i
        ];
        for(var i = 0; i != regexps.length; i++) {
          var m = preparedUrl.match(regexps[i]);
          if(m) {
            asin = m[1]
            break;
          }
        }
      }
      catch(ex) {
      }
      urlAsinCache[url] = asin;
    }

    return urlAsinCache[url];
  }
  function getAmazonInfoPopup() {
    if(!amazonInfoPopupInstance) {
      amazonInfoPopupInstance = new AmazonInfoPopup();
    }
    return amazonInfoPopupInstance;
  }
  var mouseOutTimeout;

  function isModEnabled() {
    return _b(fvdSpeedDial.Prefs.get("quick-preview.enabled"));
  }

  function turnOffTitle(dial) {
    if(dial.hasAttribute("title")) {
      dial.setAttribute("quick-view-replaced-title", dial.getAttribute("title"));
      dial.removeAttribute("title");
    }
  }

  function restoreTitle(dial) {
    if(!dial.hasAttribute("title") && dial.hasAttribute("quick-view-replaced-title")) {
      dial.setAttribute("title", dial.getAttribute("quick-view-replaced-title"));
      dial.removeAttribute("quick-view-replaced-title")
    }
  }

  var displayTimeout;

  function onMouseOver(event) {
    var dial = getDialElem(event.target);
    if(dial) {
      if(dial.hasAttribute("indrag")) {
        return;
      }
      var dialUrl = dial.getAttribute("data-url");
      var asin = getAsinByUrl(dialUrl);
      if(!asin) {
        return;
      }
      if(!isModEnabled()) {
        restoreTitle(dial);
        return;
      }
      turnOffTitle(dial);
      var popup = getAmazonInfoPopup();
      var show = function() {
        popup.setProductId(asin, dialUrl);
        popup.show(dial);
        dial.setAttribute("amazon-info-popup-active", 1);
      };
      if(displayTimeout) {
        try {
          clearTimeout(displayTimeout);
        }
        catch(ex) {
        }
      }
      if(popup.attachedTo && popup.attachedTo === dial) {
        show();
      }
      else {
        displayTimeout = setTimeout(show, DISPLAY_POPUP_TIMEOUT);
      }
    }
  }
  function onMouseOut(event) {
    if(!isModEnabled()) {
      return;
    }
    var dial = getDialElem(event.target);
    if(!dial) {
      return;
    }
    if(displayTimeout) {
      try {
        clearTimeout(displayTimeout);
      }
      catch(ex) {
      }
    }
    if(dial.hasAttribute("amazon-info-popup-active")) {
      getAmazonInfoPopup().tryHide();
    }
  }
  function onStartDrag(event) {
    if(!isModEnabled()) {
      return;
    }
    var dial = getDialElem(event.target);
    if(!dial) {
      return;
    }
    if(dial.hasAttribute("amazon-info-popup-active")) {
      getAmazonInfoPopup().hide();
    }
  }
  function processFrameRequest(action, payload, cb) {
    if(action === "readUrl") {
      fvdSpeedDial.Utils.getUrlContent(payload, function(data) {
        if(data === null) {
          cb(new Error("Fail to read url"));
        }
        else {
          cb(null, data);
        }
      });
    }
  }
  window.addEventListener("message", function(event) {
    if(!/^https?:\/\/fvdspeeddial\.com$/i.test(event.origin)) {
      return console.log("Unallowed origin access denied");
    }
    var data = event.data;
    if(data.action === "amazon-info-size" && amazonInfoPopupInstance) {
      // add extra 10 pixels to really fit the page
      amazonInfoPopupInstance.resizeFrame(
        data.size.width,
        Math.max(data.size.height + 10, amazonInfoPopupInstance.defaultFrameHeight)
      );
    }
    else if(data.action && data.action.indexOf("amazon-info.") === 0 && amazonInfoPopupInstance) {
      var action = data.action.replace("amazon-info.", "");
      processFrameRequest(action, data.payload, function(err, responsePayload) {
        amazonInfoPopupInstance.frame.contentWindow.postMessage({
          action: "response",
          id: data.id,
          payload: responsePayload,
          error: err
        }, "*");
      });
    }
  }, false);
  document.addEventListener("DOMContentLoaded", function() {
    /* disabled for now
    var speedDialContent = document.querySelector("#speedDialContent");
    speedDialContent.addEventListener("mouseover", onMouseOver, false);
    speedDialContent.addEventListener("mouseout", onMouseOut, false);
    speedDialContent.addEventListener("fvdsd.startdrag", onStartDrag, false);
    */
  }, false);
})();