fvdSpeedDial.Controls.Scroll = new function(){

  var ScrollInstance = function( elem, params ){

    var self = this;

    params.margins = params.margins || {
      horiz: 6
    };

    params.wheelScrollSpeed = params.wheelScrollSpeed || 9;

    // styling elem
    elem.style.overflow = "hidden";
    elem.style.position = "relative";

    var scrollElem = null;
    var thumbWidth = null;
    var nowIsScrolling = false;


    this.AutoScroll = new function(){

      var interval = null;
      var speed = 1; // max 100
      var axis = "x";
      var direction = 1;
      var pause = false;

      this.setSpeed = function( _speed ){
        speed = _speed;
      //  restartInterval();
      };

      this.start = function(){
        restartInterval();
      };

      this.stop = function(){
        stopInterval();
      };

      this.setPause = function( _pause ){
        pause = _pause;
      };

      function doScroll(){

        if( pause || nowIsScrolling ){
          return;
        }

        if( axis == "x" ){
          var maxScrollLeft = elem.scrollWidth - elem.offsetWidth;

          var delta = speed;

          if( direction > 0 ){
            if( elem.scrollLeft >= maxScrollLeft ){
              direction = -1;
            }
            else{
              elem.scrollLeft += delta;
              refreshScrollBarAfterScroll();
            }
          }
          else{
            if( elem.scrollLeft <= 0 ){
              direction = 1;
            }
            else{
              elem.scrollLeft -= delta;
              refreshScrollBarAfterScroll();
            }
          }
        }

      }

      function stopInterval(){
        if( interval ){
          try{
            clearInterval( interval );
          }
          catch( ex ){

          }
        }
      }

      function restartInterval(){

        var time = 50;

        //console.log( "ISS",time,speed );

        stopInterval();

        interval = setInterval( doScroll, time );

      }


    }();


    this.refresh = function(){
      refreshScrollBarVisibility();
    };

    this.refreshScrollManyTimes = function( count ){

      count = count || 5;
      var maked = 0;

      function _r(){
        self.refresh();
        maked++;

        if( maked < count ){
          setTimeout( function(){

            _r();

          }, 100 );
        }
      }

      _r();

    };

    function l_windowResize(){
      self.refreshScrollManyTimes();
    }

    function l_sdBuildCompleted(){
      self.refreshScrollManyTimes();
    }

    function _getScrollWidth(){
      return elem.offsetWidth - 2 * params.margins.horiz;
    }

    function _getMaxScrollDistance(){
      if (params.type == "horizontal") {
        return elem.scrollWidth - elem.offsetWidth;
      }
    }

    function prepareScrollValue( v ){
      if( v < 0 ){
        return 0;
      }
      var maxScrollDistance = _getMaxScrollDistance();
      if( v > maxScrollDistance ){
        return maxScrollDistance;
      }

      return v;
    }

    function refreshThumbSize(){

      var thumb = scrollElem.querySelector( ".scrollThumb" );

      if( params.type == "horizontal" ){
        var maxScrollDistance = _getMaxScrollDistance();

        var size = _getScrollWidth() - maxScrollDistance;
        thumbWidth = size;
        thumb.style.width = size + "px";
      }

    }

    function refreshThumbPosition(){
      var thumb = scrollElem.querySelector( ".scrollThumb" );
      var zone = scrollElem.querySelector( ".scrollZone" );
      if( params.type == "horizontal" ){
        var left = elem.scrollLeft;
        var maxLeft = zone.offsetWidth - thumb.offsetWidth;
        if(left > maxLeft) {
          console.log("MAX!", left, maxLeft);
          left = maxLeft;
        }
        thumb.style.marginLeft = left + "px";
      }
    }

    function refreshScrollZone(){
      var zone = scrollElem.querySelector(".scrollZone");
      if( params.type == "horizontal" ){
        var width = _getScrollWidth();
        scrollElem.style.width = width + "px";
        //scrollElem.style.left = params.margins.horiz + elem.scrollLeft + "px";
      }
    }

    function refreshScrollBarVisibility(){
      if( elem.offsetWidth >= elem.scrollWidth ){
        scrollElem.style.display = "none";
      }
      else{
        // hide scroll, because it should not affect scrollWidth of element
        scrollElem.style.display = "none";
        refreshScrollZone();
        refreshThumbPosition();
        refreshThumbSize();
        scrollElem.style.display = "block";
        // refresh thumb again
        refreshThumbPosition();
        refreshThumbSize();
      }
    }

    function refreshScrollBarAfterScroll(){
      refreshScrollZone();
      refreshThumbPosition();
    }

    function setThumbEventListeners( thumb ){

      var _helperOverlay = null;
      var _downPos = {
        left: 0,
        top: 0
      };
      var _storedScrollLeft = 0;

      function _docMouseMoveListener( event ){

        if( params.type == "horizontal" ){

          var delta = event.clientX - _downPos.left;

          elem.scrollLeft = _storedScrollLeft + delta;

          refreshScrollBarAfterScroll();

        }

      }

      function _docMouseUpListener(){

        thumb.removeAttribute( "down" );

        document.removeEventListener( "mousemove", _docMouseMoveListener );
        document.removeEventListener( "mouseup", _docMouseUpListener );

        _helperOverlay.parentNode.removeChild( _helperOverlay );

        nowIsScrolling = false;

      }

      thumb.addEventListener( "mousedown", function( event ){

        _storedScrollLeft = elem.scrollLeft;

        _downPos.left = event.clientX;
        _downPos.top = event.clientY;

        thumb.setAttribute("down", 1);

        document.addEventListener( "mousemove", _docMouseMoveListener, false );
        document.addEventListener( "mouseup", _docMouseUpListener, false );

        // create helper overlay

        _helperOverlay = document.createElement( "div" );
        _helperOverlay.className = "controlScrollHelperOverlay";
        document.body.appendChild( _helperOverlay );

        nowIsScrolling = true;

      }, false );

    }

    function buildScroll(){
      var parentEl = elem.parentNode;
      var oldScroll = parentEl.querySelector(".controlScroll");
      if( oldScroll ){
        parentEl.removeChild( oldScroll );
      }

      scrollElem = fvdSpeedDial.Templates.clone("prototype_controlScroll");
      scrollElem.removeAttribute("id");

      scrollElem.className += " scrollType_" + params.type + " scrollPosition_" + params.position;

      var thumb = scrollElem.querySelector( ".scrollThumb" );

      // events
      setThumbEventListeners( thumb );

      document.addEventListener( "mousewheel", function( event ){
        if( fvdSpeedDial.Utils.isChildOf( event.target, elem ) ){

          if( params.type == "horizontal" ){
            var v = event.wheelDelta > 0 ? -1 : 1;
            v *= params.wheelScrollSpeed;

            elem.scrollLeft = prepareScrollValue( elem.scrollLeft + v );
            refreshScrollBarAfterScroll();
          }

          event.stopPropagation();
          event.preventDefault();
        }

      }, false );


      parentEl.appendChild( scrollElem );

      refreshScrollBarVisibility();

      window.addEventListener( "resize", l_windowResize, false );

      fvdSpeedDial.SpeedDial.onBuildCompleted.addListener( l_sdBuildCompleted );
      /*
      var oldScroll = elem.querySelector(".controlScroll");
      if( oldScroll ){
        elem.removeChild( oldScroll );
      }

      scrollElem = fvdSpeedDial.Templates.clone("prototype_controlScroll");
      scrollElem.removeAttribute("id");

      scrollElem.className += " scrollType_" + params.type + " scrollPosition_" + params.position;

      var thumb = scrollElem.querySelector( ".scrollThumb" );

      // events
      setThumbEventListeners( thumb );

      document.addEventListener( "mousewheel", function( event ){
        if( fvdSpeedDial.Utils.isChildOf( event.target, elem ) ){

          if( params.type == "horizontal" ){
            var v = event.wheelDelta > 0 ? -1 : 1;
            v *= params.wheelScrollSpeed;

            elem.scrollLeft = prepareScrollValue( elem.scrollLeft + v );
            refreshScrollBarAfterScroll();
          }

          event.stopPropagation();
          event.preventDefault();
        }

      }, false );


      elem.appendChild( scrollElem );

      refreshScrollBarVisibility();

      window.addEventListener( "resize", l_windowResize, false );

      fvdSpeedDial.SpeedDial.onBuildCompleted.addListener( l_sdBuildCompleted );
      */
    }

    buildScroll();


  };

  var instances = [];

  this.setToElem = function( elem, params ) {
    var inst = new ScrollInstance( elem, params );
    instances.push( inst );
    return inst;
  };

}();
