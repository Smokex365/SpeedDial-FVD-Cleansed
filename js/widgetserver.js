/* Manage widgets listing */
(function() {
  if(fvdSpeedDial.Config.WIDGETS_DISABLED) {
    return
  }

  fvdSpeedDial.WidgetServer = new function() {

    var widgets = {};
    var self = this;

    /* external interface */
    this.getAll = function(){

      var result = [];

      for( var id in widgets ){
        var widget = self.getById( id );
        result.push( widget );
      }

      return result;
    };

    this.getById = function( id ){
      if( !widgets[id] ){
        return null;
      }

      var widget =  fvdSpeedDial.Utils.clone( widgets[id] );
      widget.id = id;

      return widget;
    };

    this.remove = function( id ){
      //_removeWidgetFromList( id );
      //chrome.management.uninstall( id );

      chrome.management.setEnabled( id, false );
    };

    function _setupListeners(){

      chrome.extension.onMessageExternal.addListener( function( message, sender ){

        if( message && message.action ){

          switch( message.action ){

            case "fvdSpeedDial:Widgets:Widget:setWidgetInfo":

              if( !widgets[ sender.id ] ){
                _addWidgetToList(sender.id, message.body);
              }
              else {
                _updateWidgetInList(sender.id, message.body);
              }

            break;

          }

        }

      } );

      chrome.management.onUninstalled.addListener( function( addonId ){
        if( widgets[ addonId ] ){
          _removeWidgetFromList( addonId );
        }
      } );
      chrome.management.onDisabled.addListener( function( addon ){
        if( widgets[ addon.id ] ){
          _removeWidgetFromList( addon.id );
        }
      } );

      Broadcaster.onMessage.addListener(function(msg, sender, sendResponse) {
        switch(msg.action) {
          case "widgets:setallpositions":
            fvdSpeedDial.WidgetServer.WidgetPositions.setAllWidgetPositions( msg.positions );
          break;
          case "widgets:getposition":
            var pos = fvdSpeedDial.WidgetServer.WidgetPositions.getWidgetPosition(msg.id);
            sendResponse(pos);
            return true;
          break;
          case "widgets:remove":
            fvdSpeedDial.WidgetServer.remove(msg.id);
          break;
          case "widgets:getall":
            var widgets = fvdSpeedDial.WidgetServer.getAll();
            widgets.forEach(function(w) {
              w.position = fvdSpeedDial.WidgetServer.WidgetPositions.getWidgetPosition( w.id );
            });
            sendResponse(widgets);
            return true;
          break;
        }
      });

    }

    function _addWidgetToList( id, info ){
      if(info.apiv != 2) {
        // only version 2 widgets supported
        return;
      }
      widgets[ id ] = info;
      fvdSpeedDial.WidgetServer.WidgetPositions.setWidgetPosition( id, 0 );
      fvdSpeedDial.WidgetServer.WidgetPositions.fixPositions( id );
      Broadcaster.sendMessage({
        action: "widgets:added",
        id: id
      });
    }

    function _updateWidgetInList( id, info ){
      if(info.apiv != 2) {
        // only version 2 widgets supported
        return;
      }
      widgets[ id ] = info;
      Broadcaster.sendMessage({
        action: "widgets:updated",
        id: id
      });
    }

    function _removeWidgetFromList( id ){
      if( widgets[ id ] ){
        delete widgets[ id ];
        fvdSpeedDial.WidgetServer.WidgetPositions.removePosition( id );
        Broadcaster.sendMessage({
          action: "widgets:removed",
          id: id
        });
      }
    }

    function _sendIsWidgetRequest( addonId ){
      chrome.runtime.sendMessage( addonId, {
        action: "fvdSpeedDial:Widgets:Server:isWidget"
      } );

    }

    function _scanAllAddons(){

      chrome.management.getAll( function( addons ){

        addons.forEach( function( addon ){
          _sendIsWidgetRequest( addon.id );
        } );

      } );

    }

    function init(){

      _setupListeners();
      _scanAllAddons();

    }

    window.addEventListener( "load", function(){

      init();

    }, false );

  }();

  fvdSpeedDial.WidgetServer.WidgetPositions = new function() {

    function _getWidgetPositionsList(){

      var list = {};

      try{
        list = JSON.parse( localStorage[ "widget_positions" ] );
      }
      catch( ex ){

      }

      return list;

    }

    function _setWidgetPositionsList( list ){
      localStorage[ "widget_positions" ] = JSON.stringify( list );
    }

    function _removeWidgetsPosition( widgetId ){

      var list = _getWidgetPositionsList();
      delete list[ widgetId ];

      _setWidgetPositionsList( list );

      _fixWidgetPositionsList();

    }

    function _fixWidgetPositionsList(){

      var list = _getWidgetPositionsList();
      var items = [];
      for( var id in list ){
        items.push({
          id: id,
          position: list[id]
        });
      }

      items.sort( function( a, b ){
        return a.position - b.position;
      } );

      var newList = {};

      for( var i = 0; i != items.length; i++ ){
        newList[ items[i].id ] = i + 1;
      }

      _setWidgetPositionsList( newList );

    }

    function _nextWidgetPosition(){

      var max = 0;
      var list = _getWidgetPositionsList();

      for( var k in list ){
        if( list[k] > max ){
          max = list[k];
        }
      }

      return max + 1;

    }

    this.getWidgetPosition = function( widgetId ){

      var list = _getWidgetPositionsList();

      if( !list[widgetId] ){
        list[widgetId] = _nextWidgetPosition();
        _setWidgetPositionsList( list );
      }

      return list[widgetId];

    }

    this.setWidgetPosition = function( widgetId, position ){
      var list = _getWidgetPositionsList();
      list[ widgetId ] = position;
      _setWidgetPositionsList( list );
    };

    this.setAllWidgetPositions = function( data ){
      _setWidgetPositionsList( data );
      _fixWidgetPositionsList();
    };

    this.fixPositions = function(){
      _fixWidgetPositionsList();
    };

    this.resetPositionList = function(){
      _setWidgetPositionsList( {} );
    };

    this.removePosition = function( widgetId ){
      _removeWidgetsPosition( widgetId );
    };

  }();

})();
