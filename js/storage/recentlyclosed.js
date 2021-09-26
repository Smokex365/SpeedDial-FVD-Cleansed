// singletone

(function(){


  var RecentlyClosed = function(){

    var that = this;

    chrome.tabs.onUpdated.addListener(function( tabId ){
      chrome.tabs.get( tabId, function( tab ){
        that._tabsData[ tabId ] = tab;
      } );
    });

    chrome.tabs.onRemoved.addListener(function( tabId ){
      try{
        if( that._tabsData[tabId] ){
          var tab = that._tabsData[tabId];
          if( !that.hasUrl( tab.url ) ){

            // check for deny

            fvdSpeedDial.Storage.isDenyUrl( tab.url, function( deny ){

              tab.displayTitle = tab.title;
              tab.deny = deny;
              that._tabs.unshift( tab );
              that._tabs.slice( 0, fvdSpeedDial.Prefs.get( "sd.max_recently_closed_records" ) );
              // send message that found new closed tab
              Broadcaster.sendMessage( {
                action: "foundRecentlyClosed",
                needActiveTab: true
              } );

            } );


          }
          delete that._tabsData[tabId];
        }
      }
      catch(ex){

      }

    });


  }

  RecentlyClosed.prototype = {
    _tabs: [],
    _tabsData: {},

    getAvailableCount: function( callback ){
      callback( this._tabs.length );
    },

    checkDenyAll: function( callback ){
      var that = this;
      var tabsToRemove = [];
      var tabsLength = this._tabs.length;
      for( var i = 0; i != tabsLength; i++ ){

        (function( i ){
          fvdSpeedDial.Storage.isDenyUrl( that._tabs[i].url, function( deny ){
            if( deny ){
            //  tabsToRemove.push( that._tabs[i] );
              that._tabs[i].deny = true;
            }
            else{
              that._tabs[i].deny = false;
            }

            if( i == tabsLength - 1 ){
              for( var j = 0; j != tabsToRemove.length; j++ ){
                var index = that._tabs.indexOf( tabsToRemove[j] );
                if( index != -1 ){
                  that._tabs.splice( index, 1 );
                }
              }

              if( callback ){
                callback();
              }
            }

          } );
        })( i );

      }

      if( tabsLength == 0 ){
        if( callback ){
          callback();
        }
      }
    },

    hasUrl: function( url ){
      for( var i = 0; i != this._tabs.length; i++ ){
        if( this._tabs[i].url == url ){
          return true;
        }
      }

      return false;
    },

    remove: function( id, callback ){
      for( var i = 0; i != this._tabs.length; i++ ){
        if( this._tabs[i].id == id ){
          this._tabs.splice( i, 1 );
          break;
        }
      }

      if( callback ){
        callback();
      }
    },

    removeAll: function( callback ){
      this._tabs = [];
      if( callback ){
        callback();
      }
    },

    getData: function( params, callback ){
      var count = params.count;
      var result = [];

      for( var i = 0; i != this._tabs.length && result.length < count; i++ ){
         if( this._tabs[i].deny ){
          continue;
         }

         result.push( this._tabs[i] );
      }

      callback( result );
    },

    get: function( id, callback ){
      for( var i = 0; i != this._tabs.length; i++ ){
        if( this._tabs[i].id == id ){
          callback( this._tabs[i] );
          break;
        }
      }
    }
  }

  this.Storage.RecentlyClosed = new RecentlyClosed();
}).apply(fvdSpeedDial);