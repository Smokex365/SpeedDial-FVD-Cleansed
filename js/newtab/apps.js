(function(){

  var Apps = function(){

    this.init();

  }

  Apps.prototype = {
    _appsPanel: null,
    _rebuildInterval: null,
    _needRebuild: false,

    _imgContainerHeight: 80,
    _appHeight: 112,
    _appMargin: 10,
    // active drag and drop instance if in scrolling now
    _activeDD: null,
    _scrollOfContentAmount: 50,

    _containerMarginTop: 0,

    _prefListener: null,

    init: function(){
      var that = this;

      window.addEventListener( "load", function(){

        if(fvdSpeedDial.Config.HIDE_APPS_PANEL) {
          document.getElementById("appsPanel").style.display = "none";
          return;
        }

        var rebuildListener = function(){
          setTimeout(function(){
            that.sheduleRebuild();
          }, 0);
        };

        chrome.management.onDisabled.addListener( rebuildListener );
        chrome.management.onEnabled.addListener( rebuildListener );
        chrome.management.onInstalled.addListener( rebuildListener );
        chrome.management.onUninstalled.addListener( rebuildListener );

        that._prefListener = function( key, value ){
          if( key == "sd.search_bar_expanded" ){
            setTimeout( function(){
              that.adjustMarginTop();
            }, 0 );
          }
        };

        Broadcaster.onMessage.addListener(function(msg) {
          if(msg.action == "pref:changed") {
            that._prefListener(msg.name, msg.value);
          }
        });

        document.addEventListener( "scroll", function(){
          that.adjustMarginTop();
        }, false );
        window.addEventListener( "resize", function(){
          that.adjustMarginTop();
        }, false );

        var preAppsContainer = document.getElementsByClassName("preAppsContainer")[0];

        var canScrollOffContent = true;

        document.body.addEventListener("mousewheel", function( event ){

          if( fvdSpeedDial.Utils.isChildOf( event.target, preAppsContainer ) ){

            event.stopPropagation();
            var prevMarginTop = 0;
            if( event.wheelDeltaY > 0 ){
              if( that.canScrollTop() ){
                that.doScroll( true );
              }
              else if( canScrollOffContent ){
                canScrollOffContent = false;

                prevMarginTop = that._containerMarginTop;

                that._containerMarginTop += that._scrollOfContentAmount;
                that.adjustMarginTop();
                setTimeout( function(){
                  that._containerMarginTop = prevMarginTop;
                  that.adjustMarginTop();
                  canScrollOffContent = true;
                }, 200 );
              }
            }
            else{
              if( that.canScrollDown() ){
                that.doScroll( false );
              }
              else if( canScrollOffContent ){
                canScrollOffContent = false;

                prevMarginTop = that._containerMarginTop;

                that._containerMarginTop -= that._scrollOfContentAmount;

                var buttonScrollTop = that.appsPanel().querySelector(".scrollButton.top");

                var params = {};
                if( buttonScrollTop.hasAttribute("hidden") ){
                  params.dontShowScrollTop = true;
                }

                that.adjustMarginTop( params );
                setTimeout( function(){
                  that._containerMarginTop = prevMarginTop;
                  that.adjustMarginTop();
                  canScrollOffContent = true;
                }, 200 );
              }
            }

            event.stopPropagation();
            event.preventDefault();
          }

        }, false);

        that.sheduleRebuild();

        that._rebuildInterval = setInterval( function(){
          if( that._needRebuild ){
            that._needRebuild = false;
            that.rebuild();
          }
        }, 100 );

        var buttonScrollDown = that.appsPanel().querySelector(".scrollButton.bottom");
        buttonScrollDown.addEventListener( "click", function( event ){
          if( event.button === 0 ){
            that.doScroll( false );
          }
        }, false );

        var buttonScrollTop = that.appsPanel().querySelector(".scrollButton.top");
        buttonScrollTop.addEventListener( "click", function( event ){
          if( event.button === 0 ){
            that.doScroll( true );
          }
        }, false );

        that.adjustMarginTop();

        if( _b( fvdSpeedDial.Prefs.get("apps.opened") ) ){
          //that.display();
        }

        Shortcut.add( "ctrl+space", function(){

          that.toggle();

          return false;

        } );

      }, false );

    },

    canScrollTop: function(){

      if( this._containerMarginTop < 0 ){
        return true;
      }
      else{
        return false;
      }

    },

    canScrollDown: function(){

      var container = this.appsPanel().getElementsByClassName("appsContainer")[0];
      var remainHeight = container.offsetHeight + this._containerMarginTop;
      if( remainHeight > this._effectiveHeight() ){
        return true;
      }
      else{
        return false;
      }

    },

    doScroll: function( top, scrollCount ){
      var that = this,
          scrollTop = 0,
          marginTopBefore = that._containerMarginTop;

      if( top ){
        if( !scrollCount ){
          scrollCount = that.maxAppsInContainer() - 2;
          if( scrollCount <= 0 ){
            scrollCount = 1;
          }
        }

        scrollTop = that._appMargin * (scrollCount) +  that._appHeight * scrollCount;

        that._containerMarginTop += scrollTop;

        if( that._containerMarginTop > 0 ){
          that._containerMarginTop = 0;
        }

        that.adjustMarginTop();
      }
      else{
        if( !scrollCount ){
          scrollCount = that.maxAppsInContainer() - 2;
          if( scrollCount <= 0 ){
            scrollCount = 1;
          }
        }

        scrollTop = that._appMargin * (scrollCount) +  that._appHeight * scrollCount;

        that._containerMarginTop -= scrollTop;

        if( that._containerMarginTop > 0 ){
          that._containerMarginTop = 0;
        }

        that.adjustMarginTop();
      }
      if(that.appsPanel().getAttribute("state") == "scrolling") {
        var correctTop = 0;
        if(that._activeDD._elem.hasAttribute("dd-correct-top")) {
          correctTop = parseInt(that._activeDD._elem.getAttribute("dd-correct-top"));
        }
        correctTop += that._containerMarginTop - marginTopBefore;
        that._activeDD._elem.setAttribute("dd-correct-top", correctTop);
        setTimeout(function() {
          that._activeDD._mouseMove();
        }, 100);
      }
      return scrollTop;
    },

    sheduleRebuild: function(){
      this._needRebuild = true;
    },

    adjustMarginTop: function( params ){
      params = params || {};

      var realMarginTop = this._containerMarginTop + this._listTopMarginConst();
      var container = this.appsPanel().getElementsByClassName("appsContainer")[0];
      container.style.marginTop = realMarginTop + "px";

      var buttonScrollDown = this.appsPanel().querySelector(".scrollButton.bottom");
      var buttonScrollTop = this.appsPanel().querySelector(".scrollButton.top");

      var remainHeight = container.offsetHeight + this._containerMarginTop;
      if( remainHeight > this._effectiveHeight() && !params.dontShowScrollDown ){
        buttonScrollDown.removeAttribute( "hidden" );
      }
      else{
        buttonScrollDown.setAttribute( "hidden", true );
      }

      if( this._containerMarginTop < 0 && !params.dontShowScrollTop ){
        buttonScrollTop.removeAttribute( "hidden" );
        buttonScrollTop.style.top = this._listTopMarginConst() - 40 + "px";
      }
      else{
        buttonScrollTop.setAttribute( "hidden", true );
      }
    },

    maxAppsInContainer: function(){

      var height = this._effectiveHeight();
      var count = Math.ceil( height/(this._appHeight + this._appMargin) );

      return count;

    },

    rebuild: function(){
      var that = this;

      fvdSpeedDial.Storage.Apps.get( function( apps ){

        var container = that.appsPanel().getElementsByClassName( "appsContainer" )[0];
        var tmpContainer = container.cloneNode( false );

        var num = 0;

        for( var i = 0; i != apps.length; i++ ){
          var app = apps[i];
          try{
            var appDiv = that._appDiv( app, num );
            tmpContainer.appendChild( appDiv );
            num++;
          }
          catch( ex ){
            console.log("Fail to place APP", ex);
          }
        }

        tmpContainer.style.height = num * (that._appHeight + that._appMargin) + "px";

        container.parentNode.replaceChild( tmpContainer, container );

        setTimeout( function(){
          that.adjustMarginTop();
        } );

      } );
    },

    adjustOpenButton: function(){

      var button = this.appsPanel().getElementsByClassName("openButton")[0];

      if( this.appsPanel().getAttribute("active") == 1 ){
        button.textContent = "‹";
      }
      else{
        button.textContent = "›";
      }

    },

    toggle: function(){

      if( this.appsPanel().getAttribute("active") == 1 ){
        this.hide();
      }
      else{
        this.display();
      }

    },

    isDisplayed: function(){
      return this.appsPanel().getAttribute("active") == 1;
    },

    display: function() {
      chrome.tabs.getCurrent(function(tab) {
        chrome.tabs.update(tab.id, {
          url: "chrome://apps/"
        });
      });
      /*
      this.adjustMarginTop();
      if( this.appsPanel().hasAttribute("active") && this.appsPanel().getAttribute("active") == 1 ){
        return;
      }
      this.appsPanel().setAttribute( "active", "1" );
      this.adjustOpenButton();
      fvdSpeedDial.Prefs.set( "apps.opened", true );
      */
    },

    hide: function(){
      if( !this.appsPanel().hasAttribute("active") || this.appsPanel().getAttribute("active") === 0 ){
        return;
      }

      this.appsPanel().setAttribute( "active", "0" );

      this.adjustOpenButton();

      fvdSpeedDial.Prefs.set( "apps.opened", false );
    },

    appsPanel: function(){
      if( !this._appsPanel ){
        this._appsPanel = document.getElementById("appsPanel");
      }
      return this._appsPanel;
    },

    _effectiveHeight: function(){
      return  this.appsPanel().offsetHeight - this._listTopMarginConst();
    },

    _listTopMarginConst: function(){
      var constMargin = 5;

      return constMargin;
    },

    _setPos: function( appDiv, num ){
      var topPos = num * (this._appHeight + this._appMargin);
      this._setPosVal( appDiv, topPos );
      appDiv.setAttribute("index", num);
    },
    _setPosVal: function( appDiv, topPos ){
      appDiv.style.top = topPos + "px";
      appDiv.setAttribute( "_top", topPos );
    },

    _appDiv: function( app, num ){
      var that = this;

      var appDiv = document.createElement( "div" );

      appDiv.addEventListener( "click", function( event ){
        if( appDiv.hasAttribute("_swallowClick") ){
          appDiv.removeAttribute( "_swallowClick" );
          return;
        }
        if(app.type == "packaged_app"){
          return chrome.management.launchApp( app.id );
        }
        if( event.button === 0 ){
          fvdSpeedDial.Utils.Opener.asClicked( app.appLaunchUrl, "current", event );
        }
        else if( event.button == 1 ){
          chrome.tabs.create({
            url: app.appLaunchUrl,
            active: true
          });
        }
      }, false );

      appDiv.setAttribute( "dd_class", "app" );
      appDiv.setAttribute( "_app", app.id );
      appDiv.setAttribute( "id", "app_"+app.id );

      this._setPos( appDiv, num );

      appDiv.className = "app";
      var img = document.createElement("img");
      var icon = this._getIcon(app);
      img.setAttribute("src", icon.src);

      img.addEventListener( "mousedown", function( event ){
        event.preventDefault();
      }, false );

      if( icon.size < this._imgContainerHeight ){
        img.style.marginTop = (this._imgContainerHeight - icon.size)/2 + "px";
      }

      var imgContainer = document.createElement("div");
      imgContainer.className = "imgContainer";

      imgContainer.appendChild( img );

      var titleContainer = document.createElement( "div" );
      titleContainer.textContent = app.name;
      titleContainer.className = "titleContainer";

      titleContainer.addEventListener( "mousedown", function( event ){
        event.preventDefault();
      }, false );

      appDiv.appendChild( imgContainer );
      appDiv.appendChild( titleContainer );

      var ddPlaceHolderPos = null;
      var allowScrollAuto = true;
      /*
      // describes elem position while dragging inside a container
      // it can be top when element in top container position
      // normal if element is elsewhere in container but no in top or bottom
      // bottom if element is in bottom container position
      var dragInsidePosition = "normal";
      // when user moves app to the bottom or top of container and waits 2s
      // container will be scrolled to top or bottom depending on app position
      var _dragScrollTimeout = null;
      function activateDragScrollTimeout() {
        if(_dragScrollTimeout) {
          return;
        }
        _dragScrollTimeout = setTimeout(function() {
          switch(dragInsidePosition) {
            case "top":
              that.doScroll(true);
            break;
            case "bottom":
              that.doScroll(false);
            break;
          }
          _dragScrollTimeout = null;
        }, 2000);
      }
      function deActivateDragScrollTimeout() {
        if(_dragScrollTimeout) {
          clearTimeout(_dragScrollTimeout);
          _dragScrollTimeout = null;
        }
      }
      */
      var dd = fvdSpeedDial.Utils.DD.create( {
        elem: appDiv,
        targets: "app",
        scrollingNotMean: true,

        changePos: function( left, top, dd ){
          var lessThanNeed = false;
          var moreThanNeed = false;

          var startTop = parseInt( appDiv.getAttribute( "_top" ) );
          var correctTop = 0;
          if(appDiv.hasAttribute("dd-correct-top")) {
            correctTop = parseInt(appDiv.getAttribute("dd-correct-top"));
          }
          top -= correctTop;
          var y = startTop + top;
          //y -= correctTop;
          var yGlobal = y + that._containerMarginTop;
          var scrollTop = yGlobal < -10 && y > 0;

          //console.log(top, correctTop);
          if( y < 0 || scrollTop ){
            top = false;
          }
          
          if( yGlobal <= 0 ){
            lessThanNeed = true;
          }
          else if( yGlobal + appDiv.offsetHeight + that._listTopMarginConst() >= window.innerHeight ){
            moreThanNeed = true;
          }

          if( lessThanNeed ){
            top = -that._containerMarginTop - startTop;
            top = false;
            //dragInsidePosition = "top";
            //activateDragScrollTimeout();
          }
          else if( moreThanNeed ){
            top = window.innerHeight - appDiv.offsetHeight - startTop - that._containerMarginTop - that._listTopMarginConst();
            //dragInsidePosition = "bottom";
            //activateDragScrollTimeout();
          }
          else {
            //dragInsidePosition = "normal";
            //deActivateDragScrollTimeout();
          }
          return {
            left: false,
            top: top
          };

        },

        callbackMouseDown: function(){
          appDiv.removeAttribute("dd-correct-top");
          ddPlaceHolderPos = appDiv.getAttribute("_top");
        },

        callbackStart: function(){
          appDiv.removeAttribute("dd-correct-top");
          appDiv.setAttribute("_swallowClick", 1);
          appDiv.setAttribute( "dragging", 1 );
          that.appsPanel().setAttribute( "state", "scrolling" );
          that._activeDD = dd;
        },

        callbackEnd: function( params ){
          if( ddPlaceHolderPos !== null ){
            that._setPos(appDiv, parseInt(appDiv.getAttribute("index"), 10));
          }

          appDiv.removeAttribute( "dragging" );
          that.appsPanel().setAttribute( "state", "normal" );

          var _elems = that.appsPanel().getElementsByClassName("app");
          var elems = [];
          var i = 0;
          for( i = 0; i != _elems.length; i++ ){

            elems.push( _elems[i] );

          }
          elems.sort(function( a, b ){
            return parseInt( a.getAttribute("_top") ) - parseInt( b.getAttribute("_top") );
          });

          var positions = {};
          for( i = 0; i != elems.length; i++ ){
            positions[ elems[i].getAttribute("_app") ] = i + 1;
          }


          fvdSpeedDial.Storage.Apps.storePositions( positions );
        },

        callbackDragon: function( dragOnElem ){
          /*
          var dragOnTop = dragOnElem.getAttribute("_top");
          that._setPosVal( dragOnElem, ddPlaceHolderPos );
          ddPlaceHolderPos = dragOnTop;
          */
          var oldIndex = appDiv.getAttribute("index");
          var newIndex = dragOnElem.getAttribute("index");
          appDiv.setAttribute("index", newIndex);
          // reassign elements indexes
          var _elems = that.appsPanel().getElementsByClassName("app");
          // remove element from position
          var i = 0, e, index;
          for(i = 0; i != _elems.length; i++) {
            e = _elems[i];
            if(e == appDiv) {
              continue;
            }
            index = parseInt(e.getAttribute("index"), 10);
            if(index > oldIndex) {
              e.setAttribute("index", index - 1);
            }
          }
          // insert element to new position
          for(i = 0; i != _elems.length; i++) {
            e = _elems[i];
            if(e == appDiv) {
              continue;
            }
            index = parseInt(e.getAttribute("index"), 10);
            if(index >= newIndex) {
              e.setAttribute("index", index + 1);
            }
          }
          // refresh style top by new indexes
          for(i = 0; i != _elems.length; i++) {
            e = _elems[i];
            if(e == appDiv) {
              continue;
            }
            index = parseInt(e.getAttribute("index"), 10);
            that._setPos(e, index);
          }
        },

        callbackDragleave: function( dragLeaveElem ){

        },
      } );

      fvdSpeedDial.ContextMenus.assignToElem( appDiv, "app" );

      return appDiv;
    },

    _getIcon: function( app ){
      var maxSize = 0;
      var maxIcon = "";

      for( var i = 0; i != app.icons.length; i++ ){
        if( app.icons[i].size > maxSize ){
          maxIcon = app.icons[i].url;
          maxSize = app.icons[i].size;
        }
      }
      return {
        size: maxSize,
        src: maxIcon
      };
    }
  };

  this.Apps = new Apps();

}).apply(fvdSpeedDial);
