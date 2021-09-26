// singletone
(function(){

  var TempStore = {
    _key: function(id) {
      return "_tmp_store_" + id;
    },
    pop: function(id) {
      var value = MemoryCache.get(this._key(id));
      if(!value) {
        return null;
      }
      MemoryCache.del(this._key(id));
      return value.join("");
    },
    append: function(id, value) {
      var currentValue = MemoryCache.get(this._key(id));
      if(!currentValue) {
        currentValue = [];
      }
      currentValue.push(value);
      // save temp data for 10 minutes
      MemoryCache.set(this._key(id), currentValue, 600000);
    }
  };

  var Sync = function(){

    var fvdSynchronizerName = "EverSync";
    var fvdSynchronizerIds = [
      // Chrome Webstore EverSync ID
      "iohcojnlgnfbmjfjfkbhahhmppcggdog",
      // Opera addons EverSync ID
      "ffhogmjbkahkkpjpjmeppoegnjhpopmc"
    ];

    var self = this;

    var active = false;
    var port = null;

    var lastTransactionId = 0;

    var lastRequestId = 0;
    var pendingRequests = [];
    var PENDING_REQUESTS_TIMEOUT = 1000 * 5 * 60; // max life time of pending requests


    function setActivity( newActivity ){
      active = newActivity;

      Broadcaster.sendMessage({
        action: "sync:activitystatechanged"
      });
    }

    function clearExpiredRequests(){

      var now = new Date().getTime();

      var ids = [];

      pendingRequests.forEach(function( request ){

        if( now - request.time >= PENDING_REQUESTS_TIMEOUT ){
          ids.push( request.id );
        }

      });

      ids.forEach( function( id ){

        removePendingRequest( id );

      } );

    }

    function removePendingRequest( id ){

      var index = -1;

      for( var i = 0; i != pendingRequests.length; i++ ){
        if( pendingRequests[i].id == id ){
          index = i;
          break;
        }
      }

      if( index != -1 ){
        pendingRequests.splice( index, 1 );
      }

    }

    function requestWithCallback( data, callback ){

        if( !port ){
        return callback( null );
      }

      lastRequestId++;
      data.requestId = lastRequestId;

      pendingRequests.push({
        id: lastRequestId,
        callback: callback,
        time: new Date().getTime()
      });

      try{
        port.postMessage( data );
      }
      catch( ex ){

      }

    }

    function callRequestResponse( requestId, data ){

      pendingRequests.forEach( function( request ){

        if( request.id == requestId ){
          request.callback( data );
        }

      } );

      removePendingRequest( requestId );

    }

    this.isActive = function(){

      return active;

    };

    this.hasDataToSync = function( callback ){
      requestWithCallback( {
        action: "hasToSyncData"
      }, function( response ){

        callback( response && response.has );

      } );
    };

    this.groupSyncChanged = function( groupId, callback ){

      // need sync group as new and all it dials.

      fvdSpeedDial.Storage.getGroup( groupId, function( group ){

        if( group.sync == 1 ){

          fvdSpeedDial.Utils.Async.chain([
            function( chainCallback ){

              // remove data from sync
              fvdSpeedDial.Sync.removeSyncData( {
                category: ["deleteGroups"],
                data: group.global_id
              }, function(){
                chainCallback();
              } );

            },

            function( chainCallback ){

              fvdSpeedDial.Storage.listDialsIdsByGroup( groupId, function( dials ){

                fvdSpeedDial.Utils.Async.arrayProcess( dials, function( dial, arrayProcessCallback ){

                  fvdSpeedDial.Sync.removeSyncData( {
                    category: ["deleteDials"],
                    data: dial.global_id
                  }, arrayProcessCallback );

                }, function(){
                  chainCallback();
                } );

              } );

            },

            function( chainCallback ){

              // add data to sync

              // need to sync all groups

              fvdSpeedDial.Storage.groupsRawList( {}, function( groups ){

                fvdSpeedDial.Utils.Async.arrayProcess( groups, function( group, arrayProcessCallback ){

                  if( group.sync == 1 ){
                    fvdSpeedDial.Sync.addDataToSync( {
                      category: ["groups", "newGroups"],
                      data: group.global_id,
                      syncAnyWay: true
                    }, arrayProcessCallback );
                  }
                  else{
                    arrayProcessCallback();
                  }

                }, function(){
                  chainCallback();
                } );

              } );

            },

            function( chainCallback ){
              fvdSpeedDial.Sync.addDataToSync( {
                category: ["specialActions"],
                data: "merge_group:" + groupId + ":" + group.global_id
              }, chainCallback );
            },

            function(){

              if( callback ){
                callback();
              }
            }
          ]);
        }
        else if( group.sync == 0 ){

          fvdSpeedDial.Utils.Async.chain( [

            function( chainCallback ){
              // remove data from sync
              fvdSpeedDial.Sync.removeSyncData( {
                category: ["groups", "newGroups"],
                data: group.global_id
              }, chainCallback );
            },

            function( chainCallback ){
              fvdSpeedDial.Sync.removeSyncData( {
                category: ["specialActions"],
                data: "merge_group:" + groupId + ":" + group.global_id
              }, chainCallback );
            },

            function( chainCallback ){
              // add data to sync
              fvdSpeedDial.Sync.addDataToSync( {
                category: ["deleteGroups"],
                data: group.global_id,
                syncAnyWay: true
              }, chainCallback );
            },

            function( chainCallback ){

              fvdSpeedDial.Storage.listDialsIdsByGroup( groupId, function( dials ){

                fvdSpeedDial.Utils.Async.arrayProcess( dials, function( dial, arrayProcessCallback ){

                  fvdSpeedDial.Sync.addDataToSync( {
                    category: ["deleteDials"],
                    data: dial.global_id,
                    syncAnyWay: true
                  }, arrayProcessCallback );

                }, chainCallback );

              } );

            },

            function(){

              chrome.extension.sendRequest({
                message: "displayNoSyncGroupAlert",
                needActiveTab: true
              });

              if( callback ){
                callback();
              }

            }

          ] );


        }

      } );


    };

    this.syncAddonOptionsUrl = function( callback ){
      getSynchronizerId( function( id ){
        var url = null;
        if( id ){
          url = "chrome-extension://"+id+"/options.html";
        }
        callback( url );
      } );
    };

    this.syncAddonExists = function( callback ){
      getSynchronizerId( function( id ){
        var exists = false;
        if( id ){
          exists = true;
        }
        callback( exists );
      } );
    };

    this.removeSyncData = function( params, callback ){
      var category = params.category;
      var _data = params.data;
      var data = _data;

      params = params || {};

      if( !active ){
        if( callback ){
          callback();
        }
        return;
      }

      if( typeof category == "string" ){
        category = [category];
      }

      requestWithCallback( {
        action: "removeSyncData",
        data: data,
        category: category
      }, function(){

        if( callback ){
          callback();
        }

      } );

    };

    this.importFinished = function(){

      port.postMessage( {
        action: "importFinished"
      } );

    };

    this.addDataToSync = function( params, callback ){
      var category = params.category;
      var _data = params.data;

      if( !active ){
        if( callback ){
          callback();
        }
        return;
      }


      var data = null;

      if( typeof category == "string" ){
        category = [category];
      }

      fvdSpeedDial.Utils.Async.chain( [
        function( chainCallback ){
          if( params.translate ){

            if( params.translate == "group" ){
              fvdSpeedDial.Storage.groupGlobalId( _data, function( globalId ){
                data = globalId;

                chainCallback();
              } );
            }
            else if( params.translate == "dial" ){
              fvdSpeedDial.Storage.dialGlobalId( _data, function( globalId ){
                data = globalId;

                chainCallback();
              } );
            }
            else{
              console.log( "Undefined translate", params.translate );
            }

          }
          else{
            data = _data;
            chainCallback();
          }
        },

        function( chainCallback ){

          if( params.syncAnyWay ){
            chainCallback();
            return;
          }

          chainCallback();

        },

        function(){

          requestWithCallback( {
            action: "addDataToSync",
            data: data,
            category: category
          }, function(){

            if( callback ){
              callback();
            }

          } );



        }
      ] );



    };

    this.startSync = function( type, callback ){
      type = type || "main";
      requestWithCallback( {
        action: "startSync",
        type: type
      }, function( result ){
        if( callback ){
          callback( result.state );
        }
      } );
    };


    function clearGroupsAndDials( callback ){

      fvdSpeedDial.Utils.Async.chain( [
        function( chainCallback ){
          fvdSpeedDial.Storage.clearDials( function(){
            chainCallback();
          }, "(SELECT `groups`.`sync` FROM `groups` WHERE `groups`.`id` = `dials`.`group_id`) = 1" );
        },
        function( chainCallback ){
          fvdSpeedDial.Storage.clearGroups( function(){
            chainCallback();
          }, "`sync` = 1" );

        },
        function(){
          callback();
        }
      ] );



    }

    function getStorage( message, callback ){

      callback( fvdSpeedDial.Storage );

    }

    // transactions

    function createTransaction( callback ){

      lastTransactionId++;
      var id = lastTransactionId;

      fvdSpeedDial.Storage.backupTables( ["dials", "groups"], id, function(){
        callback( id );
      } );

    }

    function commitTransaction( id, callback ){

      fvdSpeedDial.Storage.removeBackup( id, callback );

    }

    function rollbackTransaction( id, callback ){

      fvdSpeedDial.Storage.restoreBackup( id, callback );

    }

    function processPortMessage( message ){

      switch( message.action ){
        case "saveTempData":
          var id = message.data.id;
          var value = message.data.value;
          TempStore.append(id, value);
          console.log("Got a chunk", id)
          sendResponse( message.requestId, {
            id: id
          } );
        break;

        // transactions
        case "startTransaction":

          createTransaction(function( id ){
            sendResponse( message.requestId, {
              transId:id
            } );
          });

        break;

        case "rollbackTransaction":

          rollbackTransaction( message.transId, function(){
            sendResponse( message.requestId, {} );
          });

        break;

        case "commitTransaction":

          commitTransaction( message.transId, function(){
            sendResponse( message.requestId, {} );
          });

        break;

        case "syncStartNotification":
          fvdSpeedDial.AppLog.info("sync starts");
          Broadcaster.sendMessage( {action:"syncStartNotification"} );
        break;

        case "syncEndNotification":
          fvdSpeedDial.AppLog.info("sync ends");
          Broadcaster.sendMessage( {action:"syncEndNotification"} );
        break;

        case "clearGroupsAndDials":
          fvdSpeedDial.AppLog.info("sync clear groups and dials");
          clearGroupsAndDials( function(){
            sendResponse( message.requestId, {} );
          } );
        break;

        case "toSyncDataChanged":

          Broadcaster.sendMessage({
            action: "sync:syncdatachanged"
          });

        break;

        case "restoreBackup":
          fvdSpeedDial.AppLog.info("restore backup");
          getStorage( message, function( s ) {
            if(typeof message.data === "string") {
              // got a temp data id
              message.data = JSON.parse(TempStore.pop(message.data));
            }
            s.restoreTablesData( message.data, function(){
              sendResponse( message.requestId, {

              } );
            }, function(current, max) {
              port.postMessage( {
                action: "restoreBackupProgress",
                current: current,
                max: max
              } );
            } );
          } );
        break;

        case "queryGroups":

          getStorage( message, function( s ){

            if( !message.ignoreNoSync ){
              var whereSync = "`groups`.`sync` = 1";

              if( message.where ){
                message.where.push( whereSync );
              }
              else{
                message.where = [whereSync];
              }
            }

            s.groupsRawList( message, function( list ){

              sendResponse( message.requestId, {
                list: list
              } );

            } );
          } );


        break;

        case "queryDialThumb":
          getStorage(message, function(s) {
            s.getDialThumb(message.global_id, function(thumb) {
              sendResponse(message.requestId, {
                thumb: thumb
              });
            });
          });
        break;

        case "queryDials":

          getStorage(message, function(s) {
            if(!message.ignoreNoSync) {
              var whereSync = "(SELECT `sync` FROM `groups` WHERE `groups`.`id` = `dials`.`group_id`) = 1";
              if(message.where) {
                message.where.push(whereSync);
              }
              else{
                message.where = [whereSync];
              }
            }

            s.dialsRawList(message, function(list) {
              sendResponse(message.requestId, {
                list: list
              });
            });
          });

        break;

        case "mergeUpdateCollisedGroup":

          getStorage( message, function( s ){

            s.groupUpdate( message.clientGroup.id, {
              global_id: message.serverGroup.global_id
            }, function(){
              sendResponse( message.requestId );
            } );

          } );


        break;

        case "mergeUpdateCollisedDial":

          getStorage( message, function( s ){

            s.updateDial( message.clientDial.rowid, {
              global_id: message.serverDial.global_id
            }, function(){

              fvdSpeedDial.Storage.dialCanSync( message.serverDial.global_id, function( can ){

                if( can ){
                  s.syncSaveDial( message.serverDial, function( saveInfo ){
                    sendResponse( message.requestId, {
                      saveInfo: saveInfo
                    } );
                  } );
                }
                else{
                  sendResponse( message.requestId, {
                    saveInfo: null
                  } );
                }

              } );

            } );

          });

        break;

        case "saveGroup":

          getStorage( message, function( s ){

            fvdSpeedDial.Storage.groupCanSync( message.group.global_id, function( can ){

              if( can ){
                s.syncSaveGroup( message.group, function(){
                  sendResponse( message.requestId );
                } );
              }
              else{
                sendResponse( message.requestId );
              }

            } );

          });


        break;

        case "moveDial":

          getStorage( message, function( s ){

            s.moveDial( message.id, message.groupId, function(){
              sendResponse( message.requestId );
            } );

          });


        break;

        case "saveDial":

          getStorage( message, function( s ){

            s.syncSaveDial( message.dial, function( saveInfo ){
              sendResponse( message.requestId, {
                saveInfo: saveInfo
              } );
            } );


          });

        break;

        case "updateMass":

          getStorage( message, function( s ){

            console.log("OBtained message", message);

            s.syncUpdateMass( message.globalIds, message.data, function(){
              if( message.requestId ){
                sendResponse( message.requestId, {

                } );
              }
            } );

          });

        break;

        case "removeGroupsNotInList":

          var notRemoveGroups = message.groupsIds;

          getStorage( message, function( s ){

            s.syncRemoveGroups( notRemoveGroups, function( removed ){
              sendResponse(message.requestId, {
                removed: removed
              });
            } );

          });

        break;

        case "removeDialsNotInList":

          var notRemoveDials = message.dialsIds;

          getStorage( message, function( s ){

            s.syncRemoveDials( notRemoveDials, function( removeInfo ){
              sendResponse(message.requestId, {
                removeInfo: removeInfo
              });
            } );

          });



        break;

        case "fixGroupsPositions":

          getStorage( message, function( s ){
            s.syncFixGroupsPositions( function(){

              sendResponse(message.requestId);

            } );
          });


        break;

        case "fixDialsPositions":

          getStorage( message, function( s ){
            s.syncFixDialsPositions( message.groupId, function(){
              sendResponse(message.requestId);
            } );
          });

        break;

        case "rebuild":
          chrome.runtime.sendMessage( {
            action: "forceRebuild"
          } );
          // need to refresh default group id
          var activeGroupId = fvdSpeedDial.Prefs.get( "sd.default_group" );
          if( activeGroupId && activeGroupId > 0 ){
            fvdSpeedDial.Storage.groupExistsById( activeGroupId, function( exists ){
              if( !exists ){
                fvdSpeedDial.Storage.resetDefaultGroupId();
              }
            } );
          }
          fvdSpeedDial.ContextMenu.rebuild();
        break;

        case "syncAllGroupContents":

          fvdSpeedDial.Storage.syncGetGroupId( message.groupGlobalId, function( id ){

            if( id ){
              fvdSpeedDial.Sync.groupSyncChanged( id, function(){

                sendResponse(message.requestId);

              } );
            }
            else{
              sendResponse(message.requestId);
            }

          } );

        break;

        case "addGroupDialsToSync":

          fvdSpeedDial.Utils.Async.chain( [
            function( chainCallback ){

              fvdSpeedDial.Sync.addDataToSync( {
                category: ["groups"],
                data: message.groupGlobalId
              }, chainCallback );

            },

            function(){

              fvdSpeedDial.Storage.syncGetGroupId( message.groupGlobalId, function( groupId ){

                fvdSpeedDial.Storage.listDialsIdsByGroup( groupId, function( dials ){

                  fvdSpeedDial.Utils.Async.arrayProcess( dials, function( dial, arrayProcessCallback ){

                    fvdSpeedDial.Sync.addDataToSync( {
                      category: ["dials", "newDials"],
                      data: dial.global_id
                    }, arrayProcessCallback );

                  }, function(){

                    sendResponse(message.requestId);

                  } );

                } );

              } );

            }
          ] );


        break;

        case "setGroupSync":

          fvdSpeedDial.Storage.syncGetGroupId( message.global_id, function( groupId ){

            if( !groupId ){
              sendResponse(message.requestId);
            }
            else{
              fvdSpeedDial.Storage.groupUpdate( groupId, {
                sync: message.value
              }, function(){

                sendResponse(message.requestId);

              } );
            }


          } );



        break;

        case "dialCanSync":

          fvdSpeedDial.Storage.dialCanSync( message.global_id, function( can ){

            sendResponse(message.requestId, {can: can});

          } );

        break;

        case "countItems":

          var result = {};

          fvdSpeedDial.Utils.Async.chain([

            function( chainCallback ){

              fvdSpeedDial.Storage.countDials( function( countDials ){
                result.dials = countDials;
                chainCallback();
              } );

            },
            function( chainCallback ){
              fvdSpeedDial.Storage.groupsCount( function( countGroups ){
                result.groups = countGroups;
                chainCallback();
              } );
            },
            function(  ){
              sendResponse(message.requestId, result);
            }

          ]);
            
        break;

        case "Deny.dump": // Task #2084
          fvdSpeedDial.Storage.denyList(function (result) {
            sendResponse(message.requestId, {result:result});
          });
        break;
        
        case "Deny.set": // Task #2084
          fvdSpeedDial.Storage.clearDeny(function () {
            fvdSpeedDial.Utils.Async.arrayProcess( message.data, function( deny, next ){
              fvdSpeedDial.Storage.deny(deny.type, deny.sign, function () {
                //console.info('Deny wrote', deny);
                next();
              });

            }, function(){
              //console.info('Deny finished');
            } );

          });
        break;
              
        case "Prefs.dump": // Task #2009
              fvdSpeedDial.Prefs.dump((dump)=>{
                  sendResponse(message.requestId, {result:dump});// Task #2083
              });
        break;

        case "Prefs.set": // Task #2009
              fvdSpeedDial.Prefs.set(message.data.key, message.data.val);
        break;

        case "reloadAllPages": // Task #2009
              fvdSpeedDial.Utils.reloadAllPages(message.timeout || 0);
        break;

        case "miscItemGet": // Task #2083
          fvdSpeedDial.Storage.getMisc(message.data.key, function (result) {
            if(String(result).indexOf('filesystem') === 0){
              fvdSpeedDial.Storage.FileSystem.readAsDataURLbyURL(result, function(err, data) {
                  //var blob = fvdSpeedDial.Utils.dataURIToBlob(data);                  
                  //console.info('miscItemGet', data);                  
                  sendResponse(message.requestId, {result:data});
              });
            }else{
                sendResponse(message.requestId, {result:result});
            } 
          });
        break;

        case "miscItemSet": // Task #2083
          console.info('miscItemSet', message.data);

          if(message.data.key == 'sd.background' && String(message.data.val).indexOf('https:') === 0){
            console.info('Get BG', message.data.val);

            fvdSpeedDial.Utils.imageUrlToDataUrl( message.data.val, function( dataUrl ){
              //console.info('Got dataUrl', dataUrl);
              fvdSpeedDial.Prefs.set( "sd.background_url", message.data.val );
              fvdSpeedDial.Storage.setMisc("sd.background", dataUrl, function(){

              });
            });

          }else{
              if(String(message.data.val).indexOf('/images/newtab/firefox') !== -1){
                  message.data.val = '/images/newtab/fancy_bg.jpg';
              }
              
            fvdSpeedDial.Storage.setMisc(message.data.key, message.data.val, function(){
              
            });

          }
        break;

        case "_response":

          callRequestResponse( message.requestId, message );

        break;


      }

    }
      
   function sendResponse( requestId, message ){

      message = message || {};

      message.action = "_response";
      message.requestId = requestId;

      port.postMessage( message );

    }

    function getSynchronizerId(callback) {
      chrome.management.getAll(function(results) {
        var id = null;
        results.forEach(function(extension) {
          if(
            extension.enabled &&
            (extension.name == fvdSynchronizerName || fvdSynchronizerIds.indexOf(extension.id) >= 0)
          ) {
            id = extension.id;
          }
        });
        callback( id );
      });
    }

    chrome.extension.onMessageExternal.addListener(function( message, sender, callback ){

      switch( message.action ){

        // say hello used to check from another extensions(like as fvd synchronizer) active fvdSpeedDial or not. If it active it says hello in response
        // this action used in fvdSynchronizer to wait fvdSpeedDial to be actived after Enabling or Installing by user and establish connection with it.
        case "sayHello":

          callback( "hello" );

        break;

      }

    });

    chrome.extension.onConnectExternal.addListener(function( _p, sender ) {

      if( !_p.sender ){
        console.log( "Sender not specified" );
        return;
      }

      port = _p;

      port.onMessage.addListener( processPortMessage );
      port.onDisconnect.addListener( function(){
        setActivity(false);
      } );

      if (fvdSpeedDial.PowerOff.isHidden()) {
        // do not send activate message to synchronizer if speed dial is locked
        return;
      }

      port.postMessage( {
        "action": "activate",
        "apiv": 2
      } );

      if( !_b( fvdSpeedDial.Prefs.get("sd.synced_after_install") ) ){
        fvdSpeedDial.Prefs.set("sd.synced_after_install", true);
        port.postMessage( {
          "action": "needInitialSync"
        } );
      }

      setActivity(true);

    });

    setInterval( function(){
      clearExpiredRequests();
    }, 1000 * 60 * 5 );

    Broadcaster.onMessage.addListener(function(msg, sender, sendResponse) {
      if(msg.action == "poweroff:hiddenchange") {
        if( port ){
          try{
            if(msg.isHidden) {
              port.postMessage( {
                "action": "deactivate"
              } );
            }
            else{
              port.postMessage( {
                "action": "activate"
              } );
            }
          }
          catch( ex ){

          }
        }
      }
      else if(msg.action == "sync:adddatatosync") {
        fvdSpeedDial.Sync.addDataToSync(msg.params, function() {
          if(msg.wantResponse) {
            sendResponse();
          }
        });
        if(msg.wantResponse) {
          return true;
        }
      }
      else if(msg.action == "sync:removesyncdata") {
        fvdSpeedDial.Sync.removeSyncData(msg.params, function() {
          sendResponse();
        });
        return true;
      }
      else if(msg.action == "sync:isactive") {
        sendResponse(fvdSpeedDial.Sync.isActive());
        return true;
      }
      else if(msg.action == "sync:hasdatatosync") {
        fvdSpeedDial.Sync.hasDataToSync(function(has) {
          sendResponse(has);
        });
        return true;
      }
      else if(msg.action == "sync:start") {
        fvdSpeedDial.Sync.startSync(msg.type, function(state) {
          sendResponse(state);
        });
        return true;
      }
      else if(msg.action == "sync:addonoptionsurl") {
        fvdSpeedDial.Sync.syncAddonOptionsUrl(sendResponse);
        return true;
      }
      else if(msg.action == "sync:importfinish") {
        fvdSpeedDial.Sync.importFinished();
      }
      else if(msg.action == "sync:syncaddonexists") {
        fvdSpeedDial.Sync.syncAddonExists(sendResponse);
        return true;
      }
    });
  };

  this.Sync = new Sync();

}).apply( fvdSpeedDial );