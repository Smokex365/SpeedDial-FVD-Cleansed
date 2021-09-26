(function(){
  var ContextMenu = function(){

    function prefListener( key, value ){
      if( key == "sd.show_in_context_menu" ){
        fvdSpeedDial.ContextMenu.rebuild();
      }
    }

    Broadcaster.onMessage.addListener(function(msg) {
      if(msg.action == "pref:changed") {
        prefListener(msg.name, msg.vaue);
      }
    });
  }

  ContextMenu.prototype = {
    _mainId: null,

    needRebuild: false,

    init: function(){

      var that = this;

      setInterval( function(){

        if( that.needRebuild ){
          that.rebuild();
          that.needRebuild = false;
        }

      }, 200 );

    },

    sheduleRebuild: function(){
      this.needRebuild = true;
    },

    rebuild: function(){

      if( this._mainId ){
        chrome.contextMenus.remove( this._mainId );
        this._mainId = null;
      }

      if( !_b( fvdSpeedDial.Prefs.get( "sd.show_in_context_menu" ) ) ){
        // dont build
        return;
      }

      this._mainId = chrome.contextMenus.create({
        type: "normal",
        title: _("cm_main_title"),
        contexts: ["page", "link"]
      });

      var that = this;

      // add groups list
      fvdSpeedDial.Storage.groupsList(function( groups ){

        for( var i = 0; i != groups.length; i++ ){
          (function(i){

            var groupTitle = groups[i].name;

            if( i == 0 ){
              groupTitle = _("cm_add_to") + groupTitle;
            }

            chrome.contextMenus.create({
              type: "normal",
              title: groupTitle,
              contexts: ["page", "link"],
              parentId: that._mainId,
              onclick: function( clickData, tab ){
                if( clickData.linkUrl ){
                  that.addLinkToSpeedDial( clickData, groups[i].id, tab );
                }
                else{
                  that.addTabToSpeedDial( tab, groups[i].id );
                }
              }
            });
          })(i);
        }

      });

    },

    checkDialExists: function( data, callback ){

      var that = this;

      fvdSpeedDial.Storage.dialExists( {
        url: data.url
      }, function( exists ){

        if( exists ){
          that.showAlreadyExistsMessage( data.tabId, callback );
        }
        else{
          callback( true );
        }

      } );

    },

    addLinkToSpeedDial: function( clickData, groupId, tab ){

      var that = this;

      this.checkDialExists( {
        tabId: tab.id,
        url: clickData.linkUrl
      }, function( canAdd ){

        if( !canAdd ){
          return;
        }

        fvdSpeedDial.Storage.addDial( {
          url: clickData.linkUrl,
          title: "",
          thumb_source_type: "screen",
          group_id: groupId,
          get_screen_method: "auto"
        }, function(result){

          if (result.result) {
            fvdSpeedDial.Sync.addDataToSync( {
              category: ["dials", "newDials"],
              data: result.id,
              translate: "dial"
            } );
          }

        } );

        that.showSuccessAdded( tab.id );

      } );

    },

    addTabToSpeedDial: function(tab, groupId) {

      var that = this;

      this.checkDialExists( {
        tabId: tab.id,
        url: tab.url
      }, function( canAdd ){

        if( !canAdd ){
          return;
        }

        fvdSpeedDial.Storage.addDial( {
          url: tab.url,
          title: tab.title,
          thumb_source_type: "screen",
          group_id: groupId,
          get_screen_method: "auto"
        }, function(result){

          if (result.result) {
            fvdSpeedDial.Sync.addDataToSync( {
              category: ["dials", "newDials"],
              data: result.id,
              translate: "dial"
            } );
          }

        } );

        that.showSuccessAdded( tab.id );

      });

    },

    showSuccessAdded: function( tabId ){

      this.injectScripts( tabId, function(){

        chrome.tabs.sendMessage( tabId, {
          action: "dialAdded",
          text: _( "cs_dial_added" )
        } );

      } );

    },

    showAlreadyExistsMessage: function( tabId, callback ){

      if( _b( fvdSpeedDial.Prefs.get("sd.display_dial_already_exists_dialog") ) ){

        this.injectScripts( tabId, function(){

          chrome.tabs.sendMessage( tabId, {
            action: "alreadyExists",
            text: _("dlg_confirm_dial_exists_text"),
            checkText: _("newtab_do_not_display_migrate"),
            addDialText: _("dlg_button_add_dial"),
            cancelText: _("dlg_button_cancel")
          }, callback );

        } );

      }
      else{
        callback( true );
      }

    },

    injectScripts: function( tabId, callback ){

      chrome.tabs.executeScript( tabId, {
        file:  "/content-scripts/fvdsdadd/cs.js"
      }, function(){

        chrome.tabs.insertCSS(tabId, {
          file: "/content-scripts/fvdsdadd/cs.css"
        }, function(){

          callback();

        });

      } );

    }

  }

  this.ContextMenu = new ContextMenu();

  window.addEventListener( "load", function(){

    fvdSpeedDial.ContextMenu.init();

  }, false );

}).apply(fvdSpeedDial);
