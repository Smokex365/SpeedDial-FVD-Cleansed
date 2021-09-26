(function(){


  var Background = function(){
    var self = this;
    this.currentParallaxScene = null;

    window.addEventListener("resize", function() {
      self.adoptParallaxLayer();
    }, false);
  };

  Background.prototype = {
    CURRENT_CHROME_THEME_BACKGROUND_URL: "chrome://theme/IDR_THEME_NTP_BACKGROUND",

    /**
     *
     * bgData = {
     *  color,
     *  useColor,
     *  imageUrl,
     *  imageType,
     *  adaptiveSize,
     *  callback
     * }
     *
     */

    setToElem: function(bgData, elem) {
      var that = this;
      function _set() {
        that._setToElem(bgData, elem);
      }
      if( bgData.imageUrl && bgData.imageType != "noimage" ){
        var img = new Image();
        img.onload = function(){
          bgData.imgInst = img;
          _set();
        };
        img.onerror = function(){
          _set();
        };
        img.src = bgData.imageUrl;
      }
      else{
        _set();
      }

    },

    /*
     * bgData some like setToElem but if have image added param imgInst
     */
    _setToElem: function(bgData, elem) {
      bgData.parallaxDepth = bgData.parallaxDepth || fvdSpeedDial.Prefs.get("sd.background_parallax_depth");
      var self = this;
      elem.style.background = "none";

      var parallaxScene = elem.querySelector(".parallax-bg-scene");
      if(parallaxScene) {
        parallaxScene.parentNode.removeChild(parallaxScene);
      }
      if(this.currentParallaxScene) {
        this.currentParallaxScene.disable();
        this.currentParallaxScene = null;
      }

      if( bgData.imgInst ) {

        if(bgData.imageType === "parallax") {
          parallaxScene = document.createElement("div");
          parallaxScene.classList.add("parallax-bg-scene");
          var layer = document.createElement("div");
          layer.classList.add("layer");
          layer.style.backgroundImage = "url(" + bgData.imageUrl.replace( "(", "\\(" ).replace( ")", "\\)" ) + ")";
          layer.style.backgroundSize = "cover";
          layer.setAttribute("data-depth", bgData.parallaxDepth/100);
          parallaxScene.appendChild(layer);
          var appendTo = elem == document.documentElement ? document.body : elem;
          appendTo.appendChild(parallaxScene);
          this.currentParallaxScene = new Parallax(parallaxScene);
          self.adoptParallaxLayer();
        }
        else {
          var elemWidth, elemHeight;

          if( elem.clientWidth ){
            elemWidth = elem.clientWidth;
            elemHeight = elem.clientHeight;
          }
          else{
            elemWidth = elem.offsetWidth;
            elemHeight = elem.offsetHeight;
          }

          elem.style.backgroundImage = "url("+ bgData.imageUrl.replace( "(", "\\(" ).replace( ")", "\\)" ) +")";

          if( bgData.adaptiveSize ){
            var ratio = elemWidth / bgData.adaptiveSize.width;
            var bgWidth = Math.round(ratio * bgData.imgInst.width);
            var bgHeight = Math.round(ratio * bgData.imgInst.height);

            elem.style.backgroundSize = bgWidth+"px "+bgHeight+"px";
          }

          switch( bgData.imageType ){
            case "fill":
              elem.style.backgroundPosition = "center center";
              elem.style.backgroundSize = "cover";
              elem.style.backgroundRepeat = "no-repeat";
            break;
            case "fit":
              elem.style.backgroundPosition = "center center";
              elem.style.backgroundSize = "contain";
              elem.style.backgroundRepeat = "no-repeat";
            break;
            case "stretch":
              elem.style.backgroundSize = "100% 100%";
              elem.style.backgroundRepeat = "no-repeat";
            break;
            case "tile":
            break;
            case "center":
              elem.style.backgroundPosition = "center center";
              elem.style.backgroundRepeat = "no-repeat";
            break;
          }

          if (!bgData.adaptiveSize) {
            // if not specified adaptive size - this is not preview, than set attachment
            elem.style.backgroundAttachment = "fixed";
          }

          if( bgData.useColor ){
            elem.style.backgroundColor = "#"+bgData.color;
          }
        }
      }
      else{
        if( bgData.useColor ){
          elem.style.backgroundColor = "#"+bgData.color;
        }
        else{

        }
      }

      if( bgData.callback ){
        bgData.callback( bgData );
      }
    },

    adoptParallaxLayer: function() {
      var scene = document.querySelector(".parallax-bg-scene");
        
        if(scene){
          var layer = scene.querySelector(".layer");
          if(!scene || !this.currentParallaxScene) {
            return;
          }
          var depth = this.currentParallaxScene.depths[0];
          var xMotion = scene.offsetWidth * (10/100) * depth;
          var yMotion = scene.offsetHeight * (10/100) * depth;

          layer.style.left = -xMotion + "px";
          layer.style.top = -yMotion + "px";
          layer.style.width = scene.offsetWidth + (xMotion * 2) + "px";
          layer.style.height = scene.offsetHeight + (yMotion * 2) + "px";
        }
    }
  };

  this.Background = new Background();

}).apply(fvdSpeedDial);
