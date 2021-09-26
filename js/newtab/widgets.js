fvdSpeedDial.Widgets = new function() {

  if(fvdSpeedDial.Config.WIDGETS_DISABLED) {
    return
  }

  var self = this;
  var _scroll = null;

  var needRebuildWidgetsList = false;
  setInterval(function() {
    if(needRebuildWidgetsList) {
      needRebuildWidgetsList = false;
      fvdSpeedDial.Widgets.Builder.rebuildAll();
    }
  }, 1000);

  function scheduleRebuildWidgets() {
    needRebuildWidgetsList = true;
  }

  function l_addWidget( widgetId ){
    scheduleRebuildWidgets();
  }

  function l_updateWidget(widgetId) {
    scheduleRebuildWidgets();
  }

  function l_removeWidget( widgetId ){
    fvdSpeedDial.Widgets.Builder.removeWidget(widgetId);
    setTimeout(function() {
      // additionaly refresh scroll
      _scroll.refresh();
    }, 1000);
    /*
    var el = document.getElementById("widget_" + widgetId);
    if( el ){
      el.parentNode.removeChild( el );
    }
    */
    self.Builder.syncPositionsWithDb();
    /*
    var preContainer = document.querySelector("#widgetsPanel .preWidgetsContainer");
    var scrollLeftOld = preContainer.scrollLeft;

    var totalWidth = self.Builder.getWidgetsTotalWidth();
    var maxScrollLeft = totalWidth - preContainer.offsetWidth;

    if( scrollLeftOld > maxScrollLeft ){
      preContainer.scrollLeft = maxScrollLeft;
    }*/

    //refreshScrollManyTimes();
  }

  function l_prefListener( key, value ){

    if( key == "widgets.locked" ){
      refreshWidgetsLockState();
    }
    else if( key == "widgets.bgcolor" ){
      refreshBackground();
    }
    else if( key == "widgets.opacity" ){
      refreshOpacity();
    }
    else if( key == "widgets.autoscroll" || key == "widgets.autoscroll.speed" ){
      refreshAutoScroll();
    }
    else if( key == "widgets.enabled" ){
      refreshVisibility();
    }

  }

  function  refreshSpeedDialWrapperPadding(){
    // padding for speedDialWrapper elem is used to
    // view all dials on page if widgets panel is active
    var panelHeight = self.Builder.getWidgetsPanelHeight();
    var speedDialWrapper = document.getElementById("speedDialWrapper");

    if( _b( fvdSpeedDial.Prefs.get( "widgets.opened" ) ) ){
      speedDialWrapper.style.paddingBottom = panelHeight + "px";
      speedDialWrapper.setAttribute("extraheight", panelHeight);
    }
    else{
      speedDialWrapper.style.paddingBottom = "";
      speedDialWrapper.removeAttribute( "extraheight" );
    }

  }

  // view
  function refreshScrollManyTimes( count ){
    _scroll.refreshScrollManyTimes();
  }


  function refreshView(){
    refreshBackground();
    refreshOpacity();
    refreshAutoScroll();
  }
  function refreshBackground(){

    var preContainer = document.querySelector("#widgetsPanel .preWidgetsContainer");
    preContainer.style.backgroundColor = "#" + fvdSpeedDial.Prefs.get( "widgets.bgcolor" );

  }
  function refreshOpacity(){
    var preContainer = document.querySelector("#widgetsPanel");
    preContainer.style.opacity = parseInt( fvdSpeedDial.Prefs.get("widgets.opacity") )/100;
  }
  function refreshAutoScroll(){

    if( _b( fvdSpeedDial.Prefs.get("widgets.autoscroll") ) ){
      _scroll.AutoScroll.start();
      _scroll.AutoScroll.setSpeed( parseInt( fvdSpeedDial.Prefs.get( "widgets.autoscroll.speed" ) ) );
    }
    else{
      _scroll.AutoScroll.stop();
    }

  }


  function refreshWidgetsLockState(){

    var locked = self.getCurrentLockState();

    var widgetsPanel = document.getElementById( "widgetsPanel" );
    var lockButton = document.querySelector( "#widgetsPanel .actionButtons .lock" );

    widgetsPanel.setAttribute( "locked", locked ? 1 : 0 );
    lockButton.setAttribute( "locked", locked ? 1 : 0 );

  }

  this.getCurrentLockState = function(){
    return _b( fvdSpeedDial.Prefs.get("widgets.locked") );
  };

  this.toggleLockedState = function(){
    fvdSpeedDial.Prefs.set( "widgets.locked", !this.getCurrentLockState() );
  };

  this.openTab = function(){

    var overlay = document.getElementById( "widgetPanelBgOverlay" ) ;
    //overlay.setAttribute( "active", 1 );

    document.querySelector( "#widgetsPanel" ).setAttribute( "active", 1 );

    fvdSpeedDial.Prefs.set( "widgets.opened", true );

    _scroll.AutoScroll.setPause(false);

    refreshSpeedDialWrapperPadding();

    if( fvdSpeedDial.SpeedDial.Scrolling.activeScrollingType() == "horizontal" ){
      // need to rebuild for horizontal scroll type, because number of rows may change
      fvdSpeedDial.SpeedDial.sheduleRebuild();
    }

  };

  this.closeTab = function(){

    var overlay = document.getElementById( "widgetPanelBgOverlay" ) ;
    overlay.setAttribute( "active", 0 );

    document.querySelector( "#widgetsPanel" ).setAttribute( "active", 0 );

    fvdSpeedDial.Prefs.set( "widgets.opened", false );

    _scroll.AutoScroll.setPause(true);

    refreshSpeedDialWrapperPadding();

    if( fvdSpeedDial.SpeedDial.Scrolling.activeScrollingType() == "horizontal" ){
      // need to rebuild for horizontal scroll type, because number of rows may change
      fvdSpeedDial.SpeedDial.sheduleRebuild();
    }

  };

  this.toggleTab = function(){

    var panel = document.querySelector( "#widgetsPanel" );

    if( panel.getAttribute("active") == 1 ){
      this.closeTab();
    }
    else{
      this.openTab();
    }

  };

  this.setAllWidgetPositions = function(positions) {
    chrome.runtime.sendMessage({
      action: "widgets:setallpositions",
      positions: positions
    });
  };

  this.getPosition = function(id, cb) {
    chrome.runtime.sendMessage({
      action: "widgets:getposition",
      id: id
    }, cb);
  };

  this.remove = function(id) {
    chrome.runtime.sendMessage({
      action: "widgets:remove",
      id: id
    });
  };

  this.getAll = function(cb) {
    chrome.runtime.sendMessage({
      action: "widgets:getall"
    }, cb);
  };

  function refreshVisibility(){

    var panel = document.querySelector( "#widgetsPanel" );

    if( _b(fvdSpeedDial.Prefs.get( "widgets.enabled" )) ){
      panel.removeAttribute( "disabled" );
    }
    else{
      panel.setAttribute( "disabled", 1 );
    }

  }

  function init(){

    if(fvdSpeedDial.Config.HIDE_WIDGETS_PANEL) {
      document.getElementById("widgetsPanel").style.display = "none";
      return;
    }

    refreshVisibility();
      /*
    document.querySelector( "#widgetsPanelOpenButton" ).addEventListener("click", function(){

      self.toggleTab();

    }, false);
      
      */

    fvdSpeedDial.Widgets.Builder.rebuildAll();
    fvdSpeedDial.Widgets.Builder.onReorderComplete.addListener(function() {
      // timeout fixes scroll appear if not need(maybe problem with packery lib)
      setTimeout(function() {
        _scroll.refresh();
      }, 0);
    });
    
    _scroll = fvdSpeedDial.Controls.Scroll.setToElem( document.querySelector("#widgetsPanel .preWidgetsContainer"), {
      type: "horizontal",
      position: "top"
    } );

    document.getElementById( "widgetsPanel" ).addEventListener( "mouseover", function(){

      if( _b(fvdSpeedDial.Prefs.get("widgets.opened")) ){
        _scroll.AutoScroll.setPause( true );
      }

    }, false );

    document.getElementById( "widgetsPanel" ).addEventListener( "mouseout", function(){

      if (_b(fvdSpeedDial.Prefs.get("widgets.opened"))) {
        _scroll.AutoScroll.setPause(false);
      }

    }, false );

    document.querySelector( "#widgetsPanel .actionButtons .lock" ).addEventListener( "click", function(){
      self.toggleLockedState();
    }, false );

    document.querySelector( "#widgetsPanel .actionButtons .settings" ).addEventListener( "click", function(){
      document.location = "options.html#widgets";
    }, false );

    refreshWidgetsLockState();

    if( _b(fvdSpeedDial.Prefs.get("widgets.opened")) ){
      self.openTab();
    }
    else{
      _scroll.AutoScroll.setPause(true);
    }

    refreshView();

    Shortcut.add( "space", function(){
      self.toggleTab();
      return false;
    }, {
      disable_in_input: true
    } );
  }

  Broadcaster.onMessage.addListener(function(msg) {
    if(msg.action == "pref:changed") {
      l_prefListener(msg.name, msg.value);
    }
    else if(msg.action == "widgets:added") {
      l_addWidget(msg.id);
    }
    else if(msg.action == "widgets:updated") {
      l_updateWidget(msg.id);
    }
    else if(msg.action == "widgets:removed") {
      l_removeWidget(msg.id);
    }
  });

  document.addEventListener( "DOMContentLoaded", function() {
    //console.log(fvdSpeedDial.Widgets.Builder);// #Debug
    init();
  }, false );

}();