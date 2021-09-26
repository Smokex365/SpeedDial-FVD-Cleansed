// extends fvdSpeedDial.Storage
// singletone
(function(){
  var MostVisited = function(){

  };
  window.MostVisited = MostVisited;
  MostVisited.prototype = {

    _cache: {},
    _shortCache: {},
    _maxRetrieveResultSet: 5000,

    init: function(){
      var that = this;
    },

    getAvailableCount: function(interval, callback) {
      this.getData( {
        interval: interval,
        type: "host",
        count: this._maxRetrieveResultSet
      }, function( data ){
        callback( data.length );
      } );
    },

    isRemoved: function( id, callback ){

      fvdSpeedDial.Storage._connection.transaction( function( tx ){
        tx.executeSql( "SELECT EXISTS(SELECT * FROM `mostvisited_extended` WHERE `id` = ? AND `removed` = ?) as ex", [ id, 1 ], function( tx, results ){

          callback( results.rows.item(0).ex == 1 );

        } );
      });

    },

    deleteId: function( id, callback ){

      var that = this;

      this.updateData( id, {
        removed: 1
      }, function( result ){
        that.invalidateCache(  );
        callback( result );
      } );

    },

    restoreRemoved: function( callback ){

      var that = this;

      fvdSpeedDial.Storage._connection.transaction( function( tx ){
        tx.executeSql( "UPDATE `mostvisited_extended` SET `removed` = 0 WHERE `removed` = 1", [], function( tx, results ){
          // invalidate short cache
          that.invalidateCache();
          if( callback ){
            callback();
          }
        } );
      } );

    },

    updateData: function( id, data, callback ){
      var query = "INSERT INTO `mostvisited_extended`( `id` ) VALUES (?)";
      fvdSpeedDial.Utils.Async.chain([
        function(next) {
          if(!data.thumb || typeof data.thumb != "string" || data.thumb.indexOf("data:") !== 0) {
            return next();
          }
          // store thumb to fs
          var thumb = fvdSpeedDial.Utils.dataURIToBlob(data.thumb),
              ext = fvdSpeedDial.Utils.typeToExt(thumb.type);
          fvdSpeedDial.Storage.FileSystem.write("/" + fvdSpeedDial.Config.FS_MOSTVISITED_PREVIEW_DIR +
                                        "/" + id + "." + ext, thumb, function(err, url) {
            if(err) {
              throw err;
            }
            data.thumb = url;
            next();
          });
        },
        function() {
          fvdSpeedDial.Storage._connection.transaction( function( tx ){
            tx.executeSql( query, [id], function( tx, results ){
              var updateData = fvdSpeedDial.Storage._getUpdateData( data );
              updateData.dataArray.push( id );
              if(data.thumb) {
                updateData.strings.push("`thumb_version` = `thumb_version` + 1");
              }
              tx.executeSql( "UPDATE `mostvisited_extended` SET " + updateData.strings.join(", ") + " WHERE `id` = ?", updateData.dataArray, function( tx, results ){
                if( callback ){
                  callback( {
                    result: results.rowsAffected == 1
                  } );
                }
              } );
            } );
          } );
        }
      ]);
    },

    getExtendedData: function(cb) {
      fvdSpeedDial.Storage._connection.transaction(function( tx ){
        tx.executeSql( "SELECT * FROM `mostvisited_extended`", [], function( tx, results ){
          var r = [];
          for(var i = 0; i != results.rows.length; i++) {
            r.push(results.rows.item(i));
          }
          cb(r);
        });
      });
    },

    extendData: function( oldData, callback ){
      var data = {};
      // clone object
      for( var k in oldData ){
        data[k] = oldData[ k ];
      }
      fvdSpeedDial.Storage._connection.transaction(function( tx ){
        tx.executeSql( "SELECT `title`, `auto_title`, `thumb_source_type`, `thumb_url`, `screen_maked`, `thumb`," +
                        " `screen_delay`, `thumb_version`," +
                        "`thumb_width`, `thumb_height`, `get_screen_method` FROM `mostvisited_extended` WHERE `id` = ?",
                        [data.id], function( tx, results ) {

          if( results.rows.length == 1 ){

            var dbData = results.rows.item(0);

            data.title = dbData.title;
            data.thumb_source_type = dbData.thumb_source_type;
            data.thumb_url  = dbData.thumb_url;
            data.screen_maked = dbData.screen_maked;
            data.thumb = dbData.thumb;
            data.screen_delay = dbData.screen_delay;
            data.auto_title = dbData.auto_title;
            data.thumb_width = dbData.thumb_width;
            data.thumb_height = dbData.thumb_height;
            data.get_screen_method = dbData.get_screen_method;
            data.thumb_version = dbData.thumb_version;
          }

          if( !data.thumb_source_type ){
            data.thumb_source_type = "screen";
          }
          if( !data.thumb_url ){
            data.thumb_url  = "";
          }
          if( !data.screen_maked ){
            data.screen_maked = 0;
          }
          if( !data.thumb ){
            data.thumb = "";
          }
          if( typeof data.screen_delay == "undefined" ){
            data.screen_delay = fvdSpeedDial.Prefs.get( "sd.preview_creation_delay_default" );
          }

          data.displayTitle = data.title ? data.title : (data.auto_title ? data.auto_title : "");
          callback( data );

        }, function() {
          console.log(arguments);
        } );
      });
    },


    invalidateCache: function( full ){

      // short cache invalidated completely
      this._shortCache = {};

      if( full ){
        this._cache = {};
      }

    },

    getById: function( id, interval, type, callback ){
      this.getData( {
        interval: interval,
        type: type,
        count: 1,
        cond: {id:id}
      }, function( data ) {
        for( var i = 0; i != data.length; i++ ) {
          callback( data[i] );
          return;
        }
        callback( null );
      });
    },

    getDataByHost: function( interval, host, callback ){

      var data = this.getData( {
        interval: interval,
        type: "url",
        count: this._maxRetrieveResultSet,
        cond: {host: host}
      }, function( data ){
        callback( data );
      });

    },

    // params: interval, type, count, cond
    getData: function(params, callback) {
      var interval = params.interval,
          type = params.type,
          count = params.count,
          cond = params.cond;

      type = type || "host";
      // check short cache
      var shortCacheResult = this._getFromShortCache([interval, type, count, cond]);
      if( shortCacheResult ){
        // found in short cache
        callback(shortCacheResult);
        return;
      }

      var needReloadCache = false;
      if(
        typeof this._cache[interval] == "undefined" ||
        typeof this._cache[interval][type] == "undefined"
      ) {
        needReloadCache = true;
      }
      else if(
        (new Date()).getTime() - this._cache[interval].time > fvdSpeedDial.Prefs.get("sd.most_visited_cache_life_time")
      ) {
        needReloadCache = true;
      }

      var that = this;
      var callbackCalled = false;

      var afterGetData = function(preData) {
        var result = [];
        if(cond) {
          var tmp = [];
          for(var i = 0; i != preData.length; i++) {
            var d = preData[i];
            if(cond.host && cond.host != d.host) {
              continue;
            }
            if(cond.id && cond.id != d.id) {
              continue;
            }
            tmp.push(d);
          }
          preData = tmp;
        }
        if(preData.length == 0) {
          callback([]);
          return;
        }

        function __checkEnd() {
          that._setToShortCache([interval, type, count, cond], result);
          callback(result);
        }

        fvdSpeedDial.Utils.Async.arrayProcess(preData, function(d, apCallback) {
          if(d.url.indexOf( "chrome-extension://" ) === 0) {
            return apCallback();
          }

          if(result.length == count) {
            return __checkEnd();
          }

          try {
            fvdSpeedDial.Storage.isDenyUrl(d.url, function(deny) {
              if(!callbackCalled) {
                if(!deny) {
                  that.isRemoved( d.id, function( removed ){
                    if(!removed) {
                      result.push(d);
                    }
                    apCallback();
                  });
                }
                else{
                  apCallback();
                }
              }
            });
          }
          catch(ex) {
            apCallback();
          }
        }, function() {
          __checkEnd();
        });
      };

      if(needReloadCache) {
        var that = this;

        this.reloadCacheForInterval(interval, function() {
          afterGetData(that._cache[ interval ][ type ].slice( 0, that._cache[ interval ][ type ].length));
        });
      }
      else {
        afterGetData(this._cache[interval][type].slice(0, this._cache[ interval ][ type ].length));
      }
    },

    reloadCacheForInterval: function(interval, reloadCacheForInterval_callback) {
      var period = this._intervalToDatePeriod( interval );
      var that = this;

      chrome.history.search({
        text: "",
        startTime: period.start,
        endTime: period.end,
        maxResults: this._maxRetrieveResultSet
      }, function(items) {
        that._orderHistoryResults( items );
        var resultByHost = {};
        var resultByUrl = [];

        var workFinishCallback = function() {
          var resultByHostArray = [];
          for(var host in resultByHost) {
            resultByHostArray.push( resultByHost[host] );
          }

          that._cache[ interval ] = {
            url: resultByUrl,
            host: resultByHostArray,
            time: (new Date()).getTime()
          };

          if(reloadCacheForInterval_callback) {
            reloadCacheForInterval_callback();
          }
        };

        for(var i = 0; i != items.length; i++) {
          var item = items[i];
          if(item.url.toLowerCase().indexOf("http") !== 0) {
            item.invalid = true;
          }
          try{
            item.host = fvdSpeedDial.Utils.parseUrlHost(item.url).toLowerCase().replace("www.", "");
          }
          catch(ex) {
            continue;
          }
          if(typeof resultByHost[item.host] == "undefined") {
            // add to hosts results
            resultByHost[item.host] = item;
            resultByHost[item.host].inGroup = 1;
            resultByHost[item.host].totalVisits = item.visitCount;
          }
          else{
            resultByHost[item.host].inGroup++;
            resultByHost[item.host].totalVisits += item.visitCount;
          }
          resultByUrl.push( item );
        }

        workFinishCallback();
      });

    },

    _getFromShortCache: function( args ){

      var key = JSON.stringify( args );

      if( typeof this._shortCache[key] == "undefined" ){
        return null;
      }

      var record = this._shortCache[key];

      // check timeouting
      if( (new Date()).getTime() - record.time > fvdSpeedDial.Prefs.get( "sd.most_visited_cache_life_time" ) ){
        // timeouted
        delete this._shortCache[key];
        return null;
      }

      return this._shortCache[key].data;

    },

    _setToShortCache: function( args, data ){
      var key = JSON.stringify( args );

      this._shortCache[key] = {
        time: (new Date()).getTime(),
        data: data
      };
    },

    _orderHistoryResults: function( items ){
      // order by visits count desc
      for( var i = 0; i < items.length - 1; i++ ){
        for( var j = i; j != items.length; j++ ){
          if( items[i].visitCount < items[j].visitCount ){
            var tmp = items[j];
            items[j] = items[i];
            items[i] = tmp;
          }
        }
      }
    },

    _intervalToDatePeriod: function( interval ){
      switch( interval ){
        case "all_time":
          return {
            start: 1,
            end: (new Date()).getTime()
          };
        break;

        case "month":
          return {
            start: (new Date()).getTime() - 30 * 24 * 60 * 60 * 1000,
            end: (new Date()).getTime()
          };
        break;

        case "week":
          return {
            start: (new Date()).getTime() - 7 * 24 * 60 * 60 * 1000,
            end: (new Date()).getTime()
          };
        break;
      }
    }

  }

  this.Storage.MostVisited = new MostVisited();
}).apply( fvdSpeedDial );