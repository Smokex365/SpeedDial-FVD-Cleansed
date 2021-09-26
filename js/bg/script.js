(function() {
  // force refresh tabs with speed dial
  function refreshNewTabPages() {
    var refreshUrls = [
      "dragon://newtab/", // Comodo dragon
      fvdSpeedDial.Config.NEWTAB_URL
    ];

    refreshUrls.forEach( function( url ){
      chrome.tabs.query( {
        url: url
      }, function( tabs ){
        if(!tabs) {
          console.log("Fail get tab", url, chrome.runtime.lastError);
          return;
        }
        for( var i = 0; i != tabs.length; i++ ) {
          if(tabs[i].status == "loading") {
            // ignore loading new tabs, maybe is it speed dial loading?
            continue;
          }
          chrome.tabs.update(tabs[i].id, {
            url: chrome.extension.getURL( "newtab.html" )
          });
        }
      } );
    } );
  }
  
  // set map function for server dials to receive format compatible with speed dial database
  ServerDials.setMapClass(function() {
    var serverGroupsIds = {};
    this.init = function(serverDials, cb) {
      debug.log("init serverdials mapper");
      var serverGroupsMap = {};
      serverDials.forEach(function(serverDial) {
        serverGroupsMap[serverDial.group.globalId] = serverDial.group;
      });
      var serverGroupsGlobalIds = Object.keys(serverGroupsMap);
      debug.log("found server groups", serverGroupsGlobalIds);
      fvdSpeedDial.Utils.Async.each(serverGroupsGlobalIds, function(serverGroupGlobalId, next) {
        var serverGroup = serverGroupsMap[serverGroupGlobalId];
        var id = 0;
        fvdSpeedDial.Utils.Async.chain([
          function(next2) {
            fvdSpeedDial.Storage.groupIdByGlobalId(serverGroup.globalId, function(_id) {
              if(!_id) {
                debug.log("need to create group", serverGroup);
                fvdSpeedDial.Storage.groupAdd({
                  global_id: serverGroup.globalId,
                  name: serverGroup.name
                }, function(res) {
                  if(!res.id) {
                    throw new Exception("Fail to create group " + serverGroup.globalId);
                  }
                  debug.log("group created, id:", res.id);
                  id = res.id;
                  next2();
                });
              }
              else {
                debug.log("group", serverGroup, "already in db with id", _id);
                id = _id;
                next2();
              }
            });
          },
          function() {
            serverGroupsIds[serverGroup.globalId] = id;
            next();
          }
        ]);
      }, function() {
        debug.log("Init complete");
        cb();
      });
    };
    this.map = function(serverDial) {
      var dial = {
        url: serverDial.url,
        display_url: serverDial.displayUrl,
        global_id: serverDial.globalId,
        title: serverDial.title,
        thumb_url: serverDial.previewUrl,
        group_id: serverGroupsIds[serverDial.group.globalId]
      };
      if(serverDial.previewUrl) {
        dial.thumb_url = serverDial.previewUrl;
        dial.thumb_source_type = "url";
      }
      else {
        dial.thumb_source_type = "screen";
      }
      return dial;
    };
  });

  ServerDials.onDialsUpdate.addListener(function(dials) {
    var defaultGroupId;
    fvdSpeedDial.Utils.Async.chain([
      function(next) {
        fvdSpeedDial.Storage.syncGetGroupId("default", function(id) {
          defaultGroupId = id;
          next();
        });
      },
      function() {
        if(!defaultGroupId) {
          console.info("Can't create a dial from the server, default group isn't exist")
          return;
        }
        fvdSpeedDial.Utils.Async.arrayProcess(dials, function(dialData, next) {
          dialData.group_id = defaultGroupId;
          fvdSpeedDial.Storage.addDial(dialData, function(res) {
            if(!res) {
              return next();
            }
            dialData.id = res.id;
            fvdSpeedDial.ThumbMaker.getImageDataPath({
              imgUrl: dialData.thumb_url,
              screenWidth: fvdSpeedDial.SpeedDial.getMaxCellWidth()
            }, function(dataUrl, thumbSize) {
              fvdSpeedDial.Storage.updateDial(res.id, {
                thumb: dataUrl,
                thumb_width: Math.round(thumbSize.width),
                thumb_height: Math.round(thumbSize.height)
              }, next);
            });
          });
        }, function() {
          chrome.runtime.sendMessage({
            action: "forceRebuild"
          });
        });
      }
    ]);
  });

  // setup serverdials
  ServerDials.setConfig("disableUpdates", true);

  Broadcaster.onMessage.addListener(function(message) {
    if(
      message.action === "storage:fs:updatestate" && message.state === "normal" ||
      message.action === "finishLocalStorageRestore"
    ) {
      debug.log("Check background existance...");
      // integrity check has completed, need to check existance of the background image
      fvdSpeedDial.Utils.Async.chain([
        function(next) {
          fvdSpeedDial.Storage.getMisc("sd.background", function(fileUrl) {
            if(!fileUrl) {
              console.info("background file isn't set")
              // background isn't set, skip
              return;
            }
            fvdSpeedDial.Storage.FileSystem.existsByURL(fileUrl, function(err, exists) {
              if(exists) {
                console.info("background exists")
                // background exists, skip
                return;
              }
              // try to restore from backup
              fvdSpeedDial.DatabaseBackup.restoreBackgroundBackup(function(err, restored) {
                console.info("Background backup is restored?", err, restored);
              });
            });
          });
        }
      ]);
    }
  });

  window.addEventListener("unload", function() {
    fvdSpeedDial.AppLog.info("Chrome/Extension turned off");
    fvdSpeedDial.AppLog.write();
  }, false);

  window.addEventListener("load", function() {
    try {
      fvdSpeedDial.AppLog.info("Speed Dial " + chrome.runtime.getManifest().version + " Start Up, installed at",
          new Date(parseInt(fvdSpeedDial.Prefs.get("sd.install_time"))).toUTCString());
      fvdSpeedDial.AppLog.info("Chrome version", fvdSpeedDial.Utils.getChromeVersion());
      chrome.runtime.getPlatformInfo(function(platformInfo) {
        fvdSpeedDial.AppLog.info("Platform", platformInfo);
      });
    }
    catch(ex) {}
    // try to restore localstorage if it is empty
    // can be emptied by third party software
    fvdSpeedDial.DatabaseBackup.LocalStorage.restoreBackupIfStorageEmpty(function(err, restored) {
      // set install time if need
      // initialize the extensions
      if(fvdSpeedDial.Prefs.get("sd.install_time") == null) {
        Broadcaster.sendMessage({
          action: "first-install"
        });
        fvdSpeedDial.isFirstRunSession = true;
        fvdSpeedDial.Prefs.set("sd.install_time", new Date().getTime());

        fvdSpeedDial.Prefs.set( "widgets.opened", false ); // hide widget tab for new users
        fvdSpeedDial.Prefs.set( "sd.display_superfish", true );

        chrome.management.get("idgeoanibcknhniccgaoaiolihidecjn", function( app ) {
          if(chrome.runtime.lastError) {
            console.log("Fail to get SD app", chrome.runtime.lastError);
          }
          if( app ) {
            // speed dial installed by app(maybe)
            return;
          }
          // open home window
          if(!fvdSpeedDial.Config.MUTE_WELCOME) {
          }
        });

        setTimeout(function() {
          chrome.tabs.query({
            url: fvdSpeedDial.Config.NEWTAB_URL
          }, function(tabs) {
            if(tabs.length === 0) {
              // there are no opened newtab pages, need to open it
              chrome.tabs.create({
                url: fvdSpeedDial.Config.NEWTAB_URL,
                active: true
              });
            }
            else {
              // there are some opened newtab pages, need to activate the first one
              chrome.tabs.update(tabs[0].id, {
                active: true
              });
            }
          });
        }, 500);

        fvdSpeedDial.Prefs.set( "display_themes_message", false );
        setTimeout( function(){
          fvdSpeedDial.Prefs.set( "display_themes_message", true );
        }, 2 * 60 * 1000 );
      }
    });

    fvdSpeedDial.Localizer.localizeCurrentPage();
    fvdSpeedDial.Storage.MostVisited.init();

    fvdSpeedDial.Storage.connect( function(){
      // rebuild context menu
      fvdSpeedDial.ContextMenu.rebuild();
    } );

    fvdSpeedDial.Storage.addGroupsCallback( function(){
      // rebuild contextmenu for any db change
      fvdSpeedDial.ContextMenu.sheduleRebuild();
    } );

    fvdSpeedDial.Storage.addDialsCallback( function( message ){
      // rebuild contextmenu for any db change
      if( message.action == "remove" ){
        try{
          fvdSpeedDial.HiddenCaptureQueue.removeFromQueueById( message.data.id );
        }
        catch( ex ){

        }
      }
    } );

    // add groups change callback

    fvdSpeedDial.Storage.addGroupsCallback(function( data ){

      if( data.action == "remove" ){

        // check if groups is default group
        if( data.groupId == fvdSpeedDial.Prefs.get( "sd.default_group" ) ){
          fvdSpeedDial.Storage.groupsList(function( groups ){
            var group = groups[0];
            var newId = group.id;

            fvdSpeedDial.Prefs.set( "sd.default_group", newId )
          });
        }
        else{
          // rebuild active speeddial tab
          chrome.runtime.sendMessage( {
            action: "forceRebuild",
            resetActiveGroup: true,
            needDisplayType: "speeddial"
          } );
        }

      }

    });

    // prefs change callback
    function _prefChangeCallback( name, value ){
      if( ["sd.enable_top_sites", "sd.enable_most_visited", "sd.enable_recently_closed"].indexOf(name) != -1 ){

        var enableSpeedDial = _b(fvdSpeedDial.Prefs.get( "sd.enable_top_sites" ));
        var enableMostVisited = _b(fvdSpeedDial.Prefs.get( "sd.enable_most_visited" ));
        var enableRecentlyClosed = _b(fvdSpeedDial.Prefs.get( "sd.enable_recently_closed" ));

        var disabledItems = [];
        if( !enableSpeedDial ){
          disabledItems.push( "speeddial" );
        }
        if( !enableMostVisited ){
          disabledItems.push( "mostvisited" );
        }
        if( !enableRecentlyClosed ){
          disabledItems.push( "recentlyclosed" );
        }

        try{
          var type =  fvdSpeedDial.Utils.arrayDiff(["speeddial", "mostvisited", "recentlyclosed"], disabledItems);
          type = type[0];

          if( disabledItems.indexOf( fvdSpeedDial.Prefs.get("sd.display_type") ) != -1 ){
            // default display type is disabled
            fvdSpeedDial.Prefs.set("sd.display_type", type);
          }
          if( disabledItems.indexOf( fvdSpeedDial.Prefs.get("sd.last_selected_display_type") ) != -1 ){
            // last selected display type is disabled
            fvdSpeedDial.Prefs.set("sd.last_selected_display_type", type);
          }

        }
        catch( ex ){

        }

        // rebuild active newtab
        chrome.runtime.sendMessage( {
          action: "forceRebuild",
          needActiveTab: true
        } );

      }
      else if( name == "sd.scrolling" ){

        fvdSpeedDial.Prefs.set( "sd.recentlyclosed_columns", "auto" );
        fvdSpeedDial.Prefs.set( "sd.top_sites_columns", "auto" );

      }
      else if( name == "sd.display_popular_group" ){

        fvdSpeedDial.Utils.Async.chain([

          function( chainCallback ){
            if( 0 == fvdSpeedDial.Prefs.get( "sd.default_group" ) ){
              fvdSpeedDial.Storage.groupsList(function( groups ){
                var group = groups[0];
                var newId = group.id;

                fvdSpeedDial.Prefs.set( "sd.default_group", newId )

                chainCallback();
              });
            }
            else{
              chainCallback();
            }
          },

          function(){

            // rebuild active speeddial tab
            chrome.runtime.sendMessage( {
              action: "forceRebuild",
              resetActiveGroup: true,
              needDisplayType: "speeddial"
            } );

          }

        ]);

      }
    }

    refreshNewTabPages();
    // init browser action
    fvdSpeedDial.Utils.browserAction();

    // adaptations
    if(["custom", "list"].indexOf(fvdSpeedDial.Prefs.get("sd.thumbs_type")) == -1) {
      fvdSpeedDial.Prefs.set("sd.custom_dial_size", fvdSpeedDial.SpeedDial._cellsSizes[fvdSpeedDial.Prefs.get("sd.thumbs_type")]);
      fvdSpeedDial.Prefs.set("sd.thumbs_type", "custom");
    }

    if( ["custom", "list"].indexOf( fvdSpeedDial.Prefs.get("sd.thumbs_type_most_visited") ) == -1 ){
      fvdSpeedDial.Prefs.set( "sd.thumbs_type_most_visited", "custom" );
    }



    // surfcanyon listener
    Broadcaster.onMessage.addListener(function( message, sender, callback ){
      if( message && message.action == "isSurfCanyonEnabled" ){
        callback( _b( fvdSpeedDial.Prefs.get("surfcanyon.enabled") ) );
        return true;
      }
      else if(message.action == "deny:changed") {
        fvdSpeedDial.Storage.RecentlyClosed.checkDenyAll(function(){
          fvdSpeedDial.Storage.refreshDenyDials( function(){
            fvdSpeedDial.Storage.MostVisited.invalidateCache();
            chrome.runtime.sendMessage( {
              action: "forceRebuild",
              needActiveTab: true
            } );
          });
        });
      }
      else if(message.action == "pref:changed") {
        _prefChangeCallback(message.name, message.value);
      }
      else if(message.action == "sync:activitystatechanged") {
        _refreshSyncActivityState();
      }
    });

    // check sync activity state

    function _refreshSyncActivityState(){
      var active = fvdSpeedDial.Sync.isActive();

      fvdSpeedDial.Storage._markRemove = active;
    }

    _refreshSyncActivityState();

    if(chrome.runtime.setUninstallURL) {
      let uninstallURL = fvdSpeedDial.Config.UNINSTALL_URL
        + "?client=sd_chrome"
        + "&version=" + chrome.runtime.getManifest().version
        + "&version_install=" + localStorage.getItem('installVersion')
        + "&start=" + localStorage.getItem("prefs.sd.install_time")
        + "&end=" + Date.now()
        + "&provider=" + encodeURIComponent(fvdSpeedDial.Prefs.get("sd.search_provider") || 'fvd')
      ;
      chrome.runtime.setUninstallURL(uninstallURL);
    }
    else {
      console.info("set uninstall url is not available");
    }

    // setup server dials
    ServerDials
      .setInstallTime(
        Math.round(parseInt(fvdSpeedDial.Prefs.get("sd.install_time"))/1000)
      )
      .setClientSoftware("chrome_addon");
  }, true );
    
    
})();