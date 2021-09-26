// signletone, original saved in background page

// note:
// to get favicon use URL : chrome://favicon/http://www.google.com
//

(function() {
  function checkLocalFile(url, thumb_source_type, thumb_url, cb) {
    var res = {};
    if(thumb_source_type && thumb_source_type != "screen") {
      return cb(null);
    }
    if( url.indexOf( "file://" ) === 0 ) {
      if(thumb_source_type) {
        res.thumb_source_type = thumb_source_type;
      }
      if(thumb_url) {
        res.thumb_url = thumb_url;
      }
      // process add local file to speed dial
      try {
        res.title = url.match(/[\/\\]([^\/\\?]+)[^\/\\]*$/i)[1];
      }
      catch(ex) {
        res.title = url;
      }
      if(/(\.jpe?g|\.gif|\.png)$/i.test(url)) {
        res.thumb_url = url;
        res.thumb_source_type = "url";
        fvdSpeedDial.Utils.imageUrlToDataUrl(res.thumb_url, function(th, size) {
          if(!th || !size) {
            console.error("Fail to read image", res.thumb_url);
            return cb(null);
          }
          res.thumb = th;
          res.thumb_width = size.width;
          res.thumb_height = size.height;
          cb(res);
        });
      }
      else if(/(\.html?|\.pdf)$/i.test(url)) {
        cb(res);
      }
      else {
        // not allowed for auto screen use standard image for local file
        res.screen_maked = 1; // use force url
        res.thumb_url = "https://s3.amazonaws.com/fvd-data/sdpreview/local_file.png";
        fvdSpeedDial.Utils.imageUrlToDataUrl(res.thumb_url, function(th, size) {
          res.thumb = th;
          res.thumb_width = size.width;
          res.thumb_height = size.height;
          cb(res);
        });
        res.thumb_source_type = "url";
      }
    }
    else {
      cb(null);
    }
  };

  var Storage = function() {
        this.onDataChanged = {
            listeners: [],
            addListener: function (listener) {
                if(this.listeners.indexOf(listener) < 0) {
                    this.listeners.push(listener)
                }
            },
            dispatch: function () {
                for(let listener of this.listeners) {
                    try {
                        listener();
                    }
                    catch(err) {
                        console.error('Fail to call listener Storage.onDataChanged: ', err);
                    }
                }
            }
        }
  };

  Storage.prototype = {

    _connection: null,
    _dbName: "fvdSpeedDialDataBase",
    _estimatedSize: 500 * 1024 * 1024,
    // state of establishing connection and doing the inital actions
    connecting: false,
    connectionPromise: Promise.resolve(null),

    // callbacks
    _groupsChangeCallbacks: [],
    _dialsChangeCallbacks: [],
    _standardThumbDirUrl: "/images/newtab/dials_standard",

    _dialFieldsToFetch: "rowid as `id`, `url`, `display_url`, `title`, `auto_title`, `update_interval`, " +
      "`thumb_source_type`, `thumb_url`, `position`, `group_id`, `clicks`, `deny`, `screen_maked`, " +
      "`thumb`, `thumb_version`, `screen_delay`, `thumb_width`, `thumb_height`, `get_screen_method`, " +
      "`global_id`",

    // force use transaction
    _transaction: null,

    _backupRegexp: /_backup_(.+?)_(.+)$/i,

    _requiredTables: ["deny", "dials", "groups", "misc", "mostvisited_extended"],

    _defaultDials: [
      {
        group: {
          name: _("bg_default_group_name"),
          global_id: "default",
          sync: 1
        },
        dials: "server"
      }

    ],

    createForOneTransaction: function(callback) {
      var transactionStorage = new Storage();
      transactionStorage._connection = this._connection;

      transactionStorage._connection.transaction( function( tx ){

        transactionStorage._transaction = tx;

        callback(transactionStorage);

      } );
    },



    // backup

    backupTables: function( tables, postfix, callback ){
      fvdSpeedDial.AppLog.info("Create backup of tables", tables, postfix);

      console.log( "Backup tables with postfix ", postfix );
      var that = this;
      fvdSpeedDial.Utils.Async.arrayProcess( tables, function( table, arrayProcessCallback ){
        that.transaction(function(tx) {
          tx.executeSql(
            "CREATE TABLE IF NOT EXISTS _backup_" + postfix + "_" + table + " AS SELECT * FROM " + table,
            [], function() {
            arrayProcessCallback();
          });
        } );
      }, callback );
    },

    removeBackup: function( postfix, callback ){
      fvdSpeedDial.AppLog.info("Remove backup with postfix", postfix);
      var regexp = this._backupRegexp;

      var that = this;

      this._getTables( function( tables ){

        fvdSpeedDial.Utils.Async.arrayProcess( tables, function( table, arrayProcessCallback ){

          var matches = table.match( regexp );

          if( matches && (matches[1] == postfix || !postfix ) ){

            that.transaction( function( tx ) {
              fvdSpeedDial.AppLog.info("remove backup - drop table", table);
              tx.executeSql( "DROP TABLE " + table, [], arrayProcessCallback );
            } );

          }
          else{
            arrayProcessCallback();
          }

        }, callback);

      });

    },

    restoreBackupInitial: function( callback ){

      var that = this;

      var regexp = this._backupRegexp;

      this._getTables( function( tables ){

        var backupPostfixes = [];

        fvdSpeedDial.Utils.Async.arrayProcess( tables, function( table, arrayProcessCallback ){

          var matches = table.match( regexp );

          if( matches && backupPostfixes.indexOf( matches[1] ) == -1 ){
            backupPostfixes.push(matches[1]);
          }

          arrayProcessCallback();


        }, function(){

          if( !backupPostfixes.length ){
            callback();
          }
          else{

            var restorePostfix = backupPostfixes.shift();
            fvdSpeedDial.AppLog.info("restore initial backup with postfix", restorePostfix);
            that.restoreBackup( restorePostfix, function(){

              fvdSpeedDial.Utils.Async.arrayProcess(backupPostfixes, function( postfix, arrayProcessCallback ){
                that.removeBackup( postfix, arrayProcessCallback );
              }, callback);

            } );

          }


        });

      });

    },

    restoreBackup: function( postfix, callback ){

      console.log( "RESTORE Backup tables with postfix ", postfix );
      fvdSpeedDial.AppLog.info("restore backup with postfix", postfix);

      var that = this;

      var regexp = this._backupRegexp;

      this._getTables( function( tables ){

        fvdSpeedDial.Utils.Async.arrayProcess( tables, function( table, arrayProcessCallback ){

          var matches = table.match( regexp );

          if( matches && matches[1] == postfix ){

            var tableOrig = matches[2];

            that.transaction( function( tx ){

              fvdSpeedDial.Utils.Async.chain( [
                function( chainCallback ){
                  fvdSpeedDial.AppLog.info("backup - cleanup original table", tableOrig);
                  tx.executeSql( "DELETE FROM " + tableOrig, [], chainCallback );

                },
                function( chainCallback ){
                  fvdSpeedDial.AppLog.info("backup - insert from", table, "to", tableOrig);
                  tx.executeSql( "INSERT INTO " + tableOrig + " SELECT * FROM " + table, [], chainCallback );
                },

                function( chainCallback ){
                  fvdSpeedDial.AppLog.info("backup - drop table", table);
                  tx.executeSql( "DROP TABLE " + table , [], chainCallback );
                },

                function(){
                  arrayProcessCallback();
                }
              ] );



            } );

          }
          else{
            arrayProcessCallback();
          }

        }, function() {
          that._getTables( function( tables ) {
            fvdSpeedDial.AppLog.info("tables after backup restore", tables);
            callback();
          });
        } );



      } );

    },

    connect: function(callback) {
      var that = this;
      if(this.connecting) {
        return this.connectionPromise.then(callback);
      }
      console.info("Connection to database...");
      that.connecting = true;
      this.connectionPromise = new Promise(function(resolve, reject) {
        console.info('openDatabase', that._dbName);

        if(that._dbName !== "fvdSpeedDialDataBase"){
          console.warn("that._dbName is not 'fvdSpeedDialDataBase'", that._dbName);
        }

        that._connection = openDatabase(that._dbName, '1.0', '', that._estimatedSize);

        that._createTables(function(result) {
          that.restoreBackupInitial(function() {
            console.info("Connected");
            that.connecting = false;
            resolve();
            if(callback) {
              callback();
            }
            Broadcaster.sendMessage({
              action: "storage:connected"
            });
          });
        });
      });
    },

    createOrReuseTransaction: function(tx, callback) {
      if(tx) {
        return callback(tx);
      }
      else {
        return this.transaction(callback);
      }
    },

    transaction: function(callback, repeat) {
      var self = this;

      repeat = repeat || 0;

      if(this._transaction) {
        callback(this._transaction);
      }
      else {
          if(self._connection === null && repeat < 5){
              setTimeout(()=>{
                  self.transaction(callback, ++repeat);
              }, 250);
          }else{
            self._connection.transaction(callback, function(err) {
              // ugly way of comparement(messages) but code is always 0 for SQLError
              if(err.message !== "database has been closed") {
                return console.error("Fail to get a transaction(not recoverable)", err);
              }
              self.connect(function() {
                self._connection.transaction(callback, function(err) {
                  console.error("Can't get a transaction even after reconnect", err);
                });
              });
            });
          }

      }

    },

    resetAllDialsClicks: function(cb) {
      var self = this;
      this.transaction(function(tx) {
        tx.executeSql("UPDATE `dials` SET `clicks` = 0", [], function() {
          self.onDataChanged.dispatch();
          cb();
        });
      });
    },

    restoreTableRow: function(tx, table, row, cb) {
      var fields = [];
      var questions = [];
      var values = [];
      var self = this;

      for( var k in row ){
        fields.push( "`"+k+"`" );
        questions.push( "?" );
        values.push( row[k] );
      }

      var transactionCreated = !tx;
      self.createOrReuseTransaction(tx, function(tx) {
        var query = "INSERT INTO `"+table+"`("+fields.join(",")+") VALUES("+questions.join(",")+")";
        fvdSpeedDial.Utils.Async.chain([
          function(next) {
            tx.executeSql(query, values, function(tx, res) {
              if(table != "dials") {
                return next();
              }
              if(!row.thumb) {
                // thumb not found, probably kind of a bug, but now just ignore this preview
                return next();
              }
              if(row.thumb.indexOf("data:") !== 0) {
                if(row.thumb_source_type === "url" && row.thumb_url) {
                  // need to fetch thumb from url
                  fvdSpeedDial.Utils.imageUrlToDataUrl(row.thumb_url, function(th, size) {
                    if(!th || !size) {
                      console.error("Fail to fetch thumb from", row.thumb_url);
                      transactionCreated && next();
                      return;
                    }
                    fvdSpeedDial.Storage.updateDial(res.insertId, {
                      thumb: th,
                      thumb_width: size.width,
                      thumb_height: size.height
                    }, function() {
                      transactionCreated && next();
                    });
                  });
                }
                else {
                  fvdSpeedDial.Storage.updateDial(res.insertId, {
                    screen_maked: 0
                  }, function() {
                    transactionCreated && next();
                  });
                }
              }
              else {
                // save data uri to file, by update dial thumb
                fvdSpeedDial.Storage.updateDial(res.insertId, {
                  thumb: row.thumb
                }, function() {
                  transactionCreated && next();
                });
              }
              if(!transactionCreated) {
                // prevent staling transaction by async requests
                next();
              }
            }, function() {
              console.log( "FAIL", arguments );
            });
          },
          function() {
            cb();
          }
        ]);
      });
    },

    restoreTableData: function(tx, table, tableData, cb, rowDoneCb) {
      var self = this;
      rowDoneCb = rowDoneCb || function() {};
      var transactionCreated = !tx;
      fvdSpeedDial.Utils.Async.chain([
        function(next) {
          if(tx) {
            return next();
          }
          self.transaction(function(_tx) {
            tx = _tx;
            next();
          });
        },
        function() {
          tx.executeSql("DELETE FROM `"+table+"`", [], function() {
            if(table == "dials") {
              Broadcaster.sendMessage({
                action: "storage:dialsCleared"
              });
            }
            var rowIndex = 0;
            fvdSpeedDial.Utils.Async.eachSeries(tableData, function(row, apc2) {
              console.log("Restoring row", rowIndex, "of", table);
              self.restoreTableRow(transactionCreated ? null : tx, table, row, function() {
                console.log("Restored row", rowIndex, "of", table);
                rowIndex++;
                rowDoneCb();
                apc2();
              });
            }, function() {
              console.log("Done table", table);
              cb();
            });
          });
        }
      ]);
    },

    // restore tables data
    restoreTablesDataInOneTransaction: function(data, callback, progressCallback, tx) {
      var tables = [];
      var totalRows = 0;
      var count = 0;

      for(var table in data) {
        tables.push(table);
        totalRows += data[table].length;
      }

      var that = this;
      console.log("Start restoring db data in one transaction");
      that.createOrReuseTransaction(tx, function(tx) {
        fvdSpeedDial.Utils.Async.eachSeries(tables, function(table, apc1) {
          console.log("Restoring table", table);
          that.restoreTableData(tx, table, data[table], function() {
            console.log("Restored data for", table);
            apc1();
          }, function() {
            count++;
            if(progressCallback) {
              progressCallback( count, totalRows );
            }
          });
        }, function() {
          console.log("Restore in one transaction finished");
          callback();
        });
      });
    },

    restoreTablesData: function(data, callback, progressCallback) {
      var tables = [];
      var totalRows = 0;
      var count = 0;

      for(var table in data) {
        tables.push(table);
        totalRows += data[table].length;
      }

      var that = this;

      fvdSpeedDial.Utils.Async.eachSeries(tables, function(table, apc1) {
        that.restoreTableData(null, table, data[table], apc1, function() {
          count++;
          if(progressCallback) {
            progressCallback( count, totalRows );
          }
        });
      }, function() {
        callback();
      });
    },

    fullDump: function(cb) {
      var self = this;
      var tables = [
        "deny",
        "dials",
        "groups",
        "misc"
      ];
      var data = {};
      fvdSpeedDial.Utils.Async.arrayProcess(tables, function(table, next) {
        self.transaction(function(tx) {
          tx.executeSql( "SELECT rowid, * FROM `" + table + "`", [], function( tx, results ) {
            data[table] = self._resultsToArray( results );
            next();
          } );
        });
      }, function() {
        cb(null, data);
      });
    },

    // dump functions
    dump: function( dumpToJsonCallback ){

      var that = this;

      fvdSpeedDial.Utils.Async.chain([

        function( callback, dataObject ){

          // get dials
          that.transaction(function( tx ){
            tx.executeSql( "SELECT `url`, `title`, `auto_title`, `thumb_source_type`, `get_screen_method`," +
                           " `thumb_url`, `position`, `update_interval`, " +
                           "`group_id`, `clicks`, `deny`, `screen_delay`, `thumb_width`, `thumb_height`," +
                           "`global_id` FROM `dials`", [], function( tx, results ) {
              dataObject.dials = that._resultsToArray( results );
              callback();
            } );
          });

        },

        function ( callback, dataObject ){
          // get groups
          that.transaction(function( tx ){
            tx.executeSql( "SELECT `id`, `name`, `position`, `global_id` FROM `groups`", [], function( tx, results ){
              dataObject.groups = that._resultsToArray( results );
              callback();
            } );
          });
        },

        function ( callback, dataObject ){
          // get groups
          that.transaction(function( tx ){
            tx.executeSql( "SELECT * FROM `deny`", [], function( tx, results ){
              dataObject.deny = that._resultsToArray( results );
              callback();
            } );
          });
        },

        function( callback, dataObject ){
          dumpToJsonCallback( dataObject );
        }

      ]);

    },

    resetAutoDialsForGroup: function( params, callback ){
      var where = [];
      var limit = "";
      var self = this;

      var attrs = [];

      if( params.groupId ){
        where.push( "`group_id` = ?" );
        attrs.push( params.groupId );
      }

      where.push( "`get_screen_method` = 'auto'" );
      where.push( "`thumb_source_type` = 'screen'" );

      if( params.limit ){
        limit = "LIMIT 0, " + params.limit;
      }

      if( params.ids ){
        where.push( "`rowid` IN ("+params.ids.join(",")+")" );
      }

      if( where.length > 0 ){
        where = " WHERE " + where.join(" AND ");
      }
      else{
        where = "";
      }

      var query = "UPDATE `dials` SET `thumb` = '', `screen_maked` = 0 " +
        where + " " + limit;

      this.transaction(function( tx ){
        tx.executeSql( query, attrs, function(tx, results) {
          self.onDataChanged.dispatch();
          callback();
        });
      });
    },

    setAutoUpdateGlobally: function(params, cb) {
      var self = this;
      this.transaction(function( tx ){
        tx.executeSql( "SELECT global_id FROM `dials` WHERE `thumb_source_type` = 'screen' AND get_screen_method = 'auto'", [], function( tx, results ){
          var globalIds = [];
          for( var i = 0; results.rows.length != i; i++ ){
            globalIds.push( results.rows.item(i).global_id );
          }
          tx.executeSql( "UPDATE `dials` SET `update_interval` = ?"+
                  " WHERE `thumb_source_type` = 'screen' AND get_screen_method = 'auto'", [
            params.interval
          ], function(tx, results) {
            for(var i = 0; i != globalIds.length; i++) {
              fvdSpeedDial.Sync.addDataToSync({
                category: ["dials"],
                data: globalIds[i]
              });
            }
            self.onDataChanged.dispatch();
            Broadcaster.sendMessage( {action:"changeAutoUpdateMsg"} );
            cb(globalIds);
          });
        } );
      });
    },

    turnOffAutoUpdateGlobally: function(cb) {
      var self = this;
      this.transaction(function( tx ){
        tx.executeSql( "SELECT global_id FROM `dials` WHERE `thumb_source_type` = 'screen' " +
                       " AND get_screen_method = 'auto' AND `update_interval` != ''", [], function( tx, results ){

          var globalIds = [];
          for(var i = 0; results.rows.length != i; i++) {
            globalIds.push(results.rows.item(i).global_id);
          }

          tx.executeSql( "UPDATE `dials` SET `update_interval` = ''" +
            " WHERE `thumb_source_type` = 'screen' AND get_screen_method = 'auto' AND `update_interval` != ''", [
          ], function(tx, results) {
            for(var i = 0; i != globalIds.length; i++) {
              fvdSpeedDial.Sync.addDataToSync({
                category: ["dials"],
                data: globalIds[i]
              });
            }
            self.onDataChanged.dispatch();
            Broadcaster.sendMessage( {action:"turnOffAutoUpdateMsg"} );
            cb(globalIds);
          });
        } );
      });
    },

    setAutoPreviewGlobally: function( params, callback ) {
      var self = this;
      this.transaction(function( tx ){
        tx.executeSql( "SELECT global_id FROM `dials` WHERE `thumb_source_type` = 'screen' AND get_screen_method = 'manual'", [], function( tx, results ){
          var globalIds = [];
          for( var i = 0; results.rows.length != i; i++ ){
            globalIds.push( results.rows.item(i).global_id );
          }
          tx.executeSql(
            "UPDATE `dials` SET `get_screen_method` = 'auto', `thumb_source_type` = 'screen', `thumb` = '', `screen_maked` = 0 "+
            " WHERE `thumb_source_type` = 'screen' AND get_screen_method = 'manual'", [],
            function(tx, results) {
            for(var i = 0; i != globalIds.length; i++) {
              fvdSpeedDial.Sync.addDataToSync({
                category: ["dials"],
                data: globalIds[i]
              });
            }
            self.onDataChanged.dispatch();
            Broadcaster.sendMessage( {action:"changeAutoUpdateMsg"} );
            callback(globalIds);
          });
        });
      });

    },

    // dial functions
    dialGlobalId: function(id, callback) {
      this.transaction(function(tx) {
        tx.executeSql( "SELECT global_id FROM `dials` WHERE rowid = ?", [id], function( tx, results ){
          var globalId = null;
          if( results.rows.length == 1 ){
            globalId = results.rows.item(0).global_id;
          }
          callback( globalId );
        } );
      });
    },

    listDialsIdsByGroup: function( groupId, callback ){

      this.transaction(function( tx ){
        tx.executeSql( "SELECT rowid, global_id FROM `dials` WHERE group_id = ?", [ groupId ], function( tx, results ){

          var data = [];
          for( var i = 0; i != results.rows.length; i++ ){
            var dial = results.rows.item(i);
            data.push( {
              id: dial.rowid,
              global_id: dial.global_id
            } );
          }

          callback( data );

        } );
      });

    },

    setDialPreviewUpdateTime: function(id, time) {
      this.transaction(function(tx) {
        tx.executeSql("UPDATE `dials` SET last_preview_update = ? WHERE `rowid` = ?", [
          time,
          id
        ]);
      });
    },

    getDialsToPreviewUpdate: function(cb) {
      this.transaction(function(tx) {
        tx.executeSql("SELECT rowid, update_interval, last_preview_update, url " +
          " FROM `dials` WHERE update_interval != '' AND `thumb_source_type` = 'screen'", [], function(tx, results) {
          var data = [],
            now = new Date().getTime();
          for(var i = 0; i != results.rows.length; i++) {
            var dial = results.rows.item(i);
            data.push({
              id: dial.rowid,
              update_interval: dial.update_interval,
              last_preview_update: dial.last_preview_update,
              url: dial.url
            });
          }
          cb(data);
        });
      });
    },

    searchDials: function(query, params, cb) {
      if(typeof params === "function") {
        cb = params;
        params = {};
      }
      params.limit = params.limit || 20;
      var queryArgs = [];
      var that = this;
      var whereStr = "";
      var limitClause = "";
      var orderBy = "`clicks` DESC";
      var where = [];
      //var queryForLike = "%" + query + "%"; // #2113
      var queryForLike = "%" + String(query).toLowerCase() + "%";
      where.push("(`title` like ? or `auto_title` like ? or `url` like ?)");
      where.push( "`deny` = 0" );
      queryArgs.push(queryForLike, queryForLike, queryForLike);

      whereStr = " WHERE " + where.join(" AND ");

      this.transaction(function(tx) {
        var query = "SELECT " + that._dialFieldsToFetch + " FROM `dials` " +
                    whereStr + " ORDER BY " + orderBy + " " + limitClause;
        tx.executeSql(query, queryArgs, function(tx, results) {
          var data = [];
          for( var i = 0; i != results.rows.length; i++ ){
            var dial = results.rows.item(i);
            that._prepareDialData(dial);
            data.push(dial);
          }
          cb(null, data);
        }, function(err) {
          console.error("FAIL", arguments);
          cb(err);
        });
      });
    },

    listDials: function(orderBy, groupId, limit, callback) {
      if(typeof orderBy == "function") {
        callback = orderBy;
        orderBy = null;
      }
      if( !orderBy ){
        orderBy = "`position` ASC";
      }
      var whereArr = [];
      var where = "";
      if( groupId && groupId > 0 ){
        whereArr.push("group_id = " + groupId);
      }

      whereArr.push( "`deny` = 0" );

      if( whereArr.length > 0 ){
        where = "WHERE " + whereArr.join( " AND " );
      }

      var limitClause = "";
      if( limit ){
        limitClause = "LIMIT " + limit;
      }

      var that = this;

      var groupByClause = "";

      if(groupId == 0) {
        groupByClause = " GROUP BY `url` ";
      }

      this.transaction(function(tx) {

        var query = "SELECT " + that._dialFieldsToFetch + " FROM `dials` " +
                    where+ " "+groupByClause+" ORDER BY " + orderBy + " " + limitClause;
        tx.executeSql( query, [], function( tx, results ){

          var data = [];
          for( var i = 0; i != results.rows.length; i++ ){
            var dial = results.rows.item(i);
            that._prepareDialData( dial );
            data.push( dial );
          }

          callback( data );

        }, function(err) {
          console.error("FAIL", arguments);
        } );
      });
    },

    dialsRawList: function(params, callback) {
      var self = this;
      params = params || {};
      if(typeof params.fetchThumb === "undefined") {
        params.fetchThumb = true;
      }
      var whereStr = "";
      if( params.where ) {
        whereStr = "WHERE " + params.where.join(" AND ");
      }

      var query = "SELECT dials.rowid, dials.*, groups.global_id as group_global_id " +
                  "FROM `dials` JOIN groups ON dials.group_id = groups.id " + whereStr + " " +
                  "ORDER BY dials.rowid ASC";
      if(params.limit) {
        query += " LIMIT " + params.limit;
      }
      this._rawList(query, function(list) {
        // preparations
        list.forEach(function(dial) {
          // fix bug when update_interval set to undefined(maybe with sync)
          if(dial.update_interval == "undefined") {
            dial.update_interval = "";
          }
        });
        if(params.fetchThumb) {
          // need to replace filesystem urls by data uris
          // because rawList request is used for sync
          fvdSpeedDial.Utils.Async.arrayProcess(list, function(dial, next) {
            if(params.fetchOnlyCustomThumb) {
              if(
                dial.thumb_source_type === "local_file" ||
                (dial.thumb_source_type === "screen" && dial.get_screen_method === "manual")
              ) {
                // fetch allowed
              }
              else {
                return setTimeout(next, 0);
              }
            }
            self._resolveDialThumb(dial, function() {
              next();
            });
          }, function() {
            callback(list);
          });
        }
        else {
          return callback(list);;
        }
      } );

    },

    _resolveDialThumb: function(dial, cb) {
      if(typeof dial.thumb != "string" || dial.thumb.indexOf("filesystem:") !== 0) {
        return cb(dial.thumb);
      }
      fvdSpeedDial.Utils.imageUrlToDataUrl(dial.thumb, function(dataUrl) {
        dial.thumb = dataUrl;
        cb(dataUrl);
      });
    },

    getDialThumb: function(globalId, cb) {
      var self = this;

      this.transaction(function( tx ){
        tx.executeSql(
          "SELECT `thumb` FROM `dials` WHERE `global_id` = ?", [globalId], function(tx, result) {
          if(result.rows.length == 1) {
            var dial = result.rows.item(0);
            self._resolveDialThumb(dial, function(thumb) {
              cb(thumb);
            });
          }
          else {
            cb(null);
          }
        } );
      });
    },

    getDial: function( id, callback ){
      var that = this;

      this.transaction(function( tx ){
        tx.executeSql(
          "SELECT rowid as `id`, `url`, `display_url`, `title`, `auto_title`, `thumb_source_type`," +
          " `thumb_url`, " +
          "`position`, `group_id`, `clicks`, `deny`, `screen_maked`, `thumb`, `screen_delay`, `thumb_width`, "+
          "`thumb_height`, `get_screen_method`, `update_interval`, `global_id` " +
          " FROM `dials` WHERE `rowid` = ?", [id], function(tx, result) {
          if(result.rows.length == 1) {
            var dial = result.rows.item(0);

            that._prepareDialData(dial);
            callback(dial);
          }
          else {
            callback(null);
          }
        } );
      });

    },


    getDialDataList: function( dialId, dataList, callback ){
      var dataString = "`"+dataList.join("`,`")+"`";

      var query = "SELECT "+dataString+" FROM `dials` WHERE `rowid` = ?";

      this.transaction( function( tx ){
        tx.executeSql( query, [dialId], function( ts, results ){

          if( results.rows.length == 1 ){
            callback( results.rows.item(0) );
          }

        } );
      } );

    },

    addDial: function( addData, callback, hints ){

      hints = hints || [];

      var that = this,
          storeThumb = null;

      addData.thumb = addData.thumb || "";
      addData.screen_delay = addData.screen_delay || fvdSpeedDial.Prefs.get("sd.preview_creation_delay_default");

      var screen_maked = 0,
          localFileData = null,
          res = null;

      var fields = ['url','display_url','title','auto_title','thumb_source_type','thumb_url','position','group_id','deny','clicks','screen_maked', 'thumb','thumb_version','screen_delay','thumb_width','thumb_height','global_id','get_screen_method','update_interval' ,'last_preview_update','need_sync_screen','id'];
      for(var key in addData) if(fields.indexOf(key) === -1) delete addData[key]; // Task #1526

      fvdSpeedDial.Utils.Async.chain([
        function(next) {
          checkLocalFile(addData.url, addData.thumb_source_type, addData.thumb_url, function(lf) {
            localFileData = lf;
            next();
          });
        },
        function(next) {
          if(localFileData){
            for(var k in localFileData) {
              addData[k] = localFileData[k];
            }
            next();
          }
          else {
            if( addData.thumb_source_type == "screen" ){
              if( addData.thumb ){
                addData.screen_maked = 1; // thum specified for screen type
              }
              else{

              }
            }
            next();
          }
        },
        function(next) {
          if(addData.thumb) {
            // store thumb separately
            storeThumb = addData.thumb;
            delete addData.thumb;
          }
          that.isDenyUrl( addData.url, function(deny){

            if( deny && hints.indexOf( "ignore_deny" ) == -1 ){
              if( callback ){
                callback({
                  result: false,
                  error: "url_deny"
                });
              }
            }
            else{

              that.nextDialPosition( addData.group_id, function( position ){
                if( !addData.position ){
                  addData.position = position;
                }

                addData.clicks = addData.clicks || 0;
                addData.deny = addData.deny || 0;
                addData.screen_maked = addData.screen_maked || 0;

                if( !addData.global_id ){
                  addData.global_id = that._generateGUID();
                }

                var insertData = that._getInsertData( addData );

                that.transaction(function( tx ){
                  tx.executeSql( "INSERT INTO `dials`("+insertData.keys+") VALUES("+insertData.values+")", insertData.dataArray, function( tx, results ){

                    that._callDialsChangeCallbacks( {
                      action: "add",
                      data: {
                        id: results.insertId,
                        data: addData
                      }
                    });
                    res = {
                      result: results.rowsAffected == 1,
                      id: results.insertId
                    };
                    next();
                  }, function(){
                    console.log( "Error add dials", arguments );
                  } );
                });
              } );

            }

          } );
        },
        function(next) {
          if(!storeThumb) {
            return next();
          }
          // store thumb
          fvdSpeedDial.Storage.updateDial(res.id, {
            thumb: storeThumb
          }, next);
        },
        function() {
          if(callback) {
            callback(res);
          }
        }
      ]);
    },


    syncFixDialsPositions: function( groupId, callback ) {
      var that = this;
      this._rawList( "SELECT `rowid` FROM `dials` WHERE `group_id` = "+groupId+" ORDER BY `position`", function( dials ){
        var position = 1;
         fvdSpeedDial.Utils.Async.arrayProcess( dials, function( dial, arrayProcessCallback ){
          that.transaction( function( tx ) {
            tx.executeSql( "UPDATE `dials` SET `position` = ? WHERE `rowid` = ?", [ position, dial.rowid ], function(){
              position++;
              arrayProcessCallback();
            }, function(err) {
              console.error("Query failed", err, arguments);
              arrayProcessCallback();
            } );
          } );
        }, function(){
          that.onDataChanged.dispatch();
          callback();
        } );
      } );
    },


    syncDialData: function( globalId, fields, callback ){

      fields = fields || ["rowid", "*"];

      var query = "SELECT " + fields.join(",") + " FROM `dials` WHERE `global_id` = ?";

      this.transaction( function( tx ){

        tx.executeSql( query, [globalId], function( tx, results ){

          if( results.rows.length >= 1 ){
            callback( results.rows.item(0) );
          }
          else{
            callback( null );
          }

        }, function(){ console.log( "Fail get syncDialData", arguments ); } );

      } );

    },

    syncRemoveDials: function( notRemoveDials, callback ){

      var that = this;

      var removeInfo = {
        count: 0,
        removedFromGroups: []
      }; // describes remove process info

      var where = "WHERE 1=1 ";

      if( notRemoveDials.length > 0 ){
        where += "AND `global_id` NOT IN('"+notRemoveDials.join("','")+"')";
      }

      where += " AND (SELECT `sync` FROM `groups` WHERE `id` = `dials`.`group_id`) = 1";

      this._rawList( "SELECT `global_id`, `rowid`, `group_id` FROM `dials` " + where, function( dials )  {

        fvdSpeedDial.Utils.Async.arrayProcess( dials, function( dial, arrayProcessCallback ){

          removeInfo.count++;
          removeInfo.removedFromGroups.push( dial.group_id );

          that.transaction( function( tx ){
            tx.executeSql( "DELETE FROM dials WHERE rowid = ?", [dial.rowid], function(){

              that._callDialsChangeCallbacks( {
                action: "remove",
                data:{
                  id: dial.rowid
                }
              });

              arrayProcessCallback();

            } );
          } );


        }, function() {
          fvdSpeedDial.AppLog.info("sync remove dials not in list, removed", removeInfo.count);
          callback( removeInfo );
        } );

      } );


    },

    syncUpdateMass: function( globalIds, data, callback ){
      var self = this;
      var tmp = this._getUpdateData( data );

      var dataArray = tmp.dataArray;
      var strings = tmp.strings;

      var query = "UPDATE `dials` SET " + strings.join(",") + " WHERE `global_id` IN ( '"+globalIds.join("','")+"' )";

      this.transaction(function( tx ){
        tx.executeSql( query, dataArray, function( tx, results ){
          self.onDataChanged.dispatch();
          if(callback) {
            callback({
              result: results.rowsAffected > 1
            });
          }
        } );
      });

    },

    syncSaveDial: function(dial, callback) {
      var that = this;
      var oldData = null;
      var nullThumbSrc = false;
      var saveInfo = {}; // describes dial info with it saves
      this.dialExistsByGlobalId( dial.global_id, function( exists ){
        that.syncGetGroupId( dial.group_global_id, function( groupId ){
          if( groupId == 0 ){
            callback(saveInfo); // cannot add dial, group not found
          }
          else{
            dial.group_id = groupId;

            saveInfo.group_id = groupId;

            var deny = 0;

            fvdSpeedDial.Utils.Async.chain( [
              function( chainCallback ){
                that.isDenyUrl( dial.url, function( aDeny ){
                  deny = aDeny ? 1 : 0;
                  chainCallback();
                } );
              },
              function( chainCallback ){
                if(exists) {
                  that.syncDialData( dial.global_id, [
                    "rowid", "thumb_source_type", "thumb_url", "url", "group_id", "screen_maked", "get_screen_method"
                  ], function( result ){
                    if( result ) {

                      oldData = result;

                      // check if dials moved

                      if( oldData.group_id != dial.group_id ){
                        saveInfo.move = {
                          from: oldData.group_id,
                          to: dial.group_id
                        };
                      }

                      if( oldData.thumb_source_type != dial.thumb_source_type ){
                        nullThumbSrc = true;
                      }
                      else {

                        if( dial.thumb_source_type == "screen" ){
                          if( dial.url != oldData.url ){
                            nullThumbSrc = true;
                          }
                          else if( dial.get_screen_method != oldData.get_screen_method ){
                            nullThumbSrc = true;
                          }
                        }
                        else if( dial.thumb_source_type == "url" ) {
                          if( dial.thumb_url != oldData.thumb_url ) {
                            nullThumbSrc = true;
                          }
                        }
                        else if( dial.thumb_source_type == "local_file" ){
                          /*
                           *
                           * process local file here
                           *
                          if( dial._previewContent ){
                            var newContentMd5 = fvd_speed_dial_Misc.md5( dial._previewContent );

                            var tmp = oldData.thumb_url.split( /[\/\\]/ );
                            var fileName = tmp[tmp.length - 1];

                            if( fileName.indexOf( newContentMd5 ) == -1 ){
                              nullThumbSrc = true;
                            }
                          }
                          */

                        }


                      }

                      if( nullThumbSrc ){
                        dial.screen_maked = 0;
                      }
                      else{
                        dial.screen_maked = oldData.screen_maked;
                      }

                      chainCallback();

                    }
                    else{

                      nullThumbSrc = true;

                      chainCallback();
                    }

                  } );

                }
                else{

                  nullThumbSrc = true;

                  chainCallback();
                }

              },

              function( chainCallback ){
                if(nullThumbSrc && dial.thumb_source_type == "url" ||
                  dial._previewUrl && dial.thumb_source_type == "local_file" ||
                  dial._previewUrl && dial.thumb_source_type === "screen"
                ) {
                  // need to grab thumb from url

                  var loadContentUrl = dial.thumb_url;
                  if(
                    dial._previewUrl && dial.thumb_source_type == "local_file" ||
                    dial._previewUrl && dial.thumb_source_type === "screen"
                  ) {
                    loadContentUrl = dial._previewUrl;
                  }
                  fvdSpeedDial.ThumbMaker.getImageDataPath({
                    imgUrl: loadContentUrl,
                    screenWidth: fvdSpeedDial.SpeedDial.getMaxCellWidth()
                  }, function(dataUrl, thumbSize){
                    delete dial._previewUrl;
                    dial.thumb = dataUrl;
                    chainCallback();
                  });

                }
                else{
                  chainCallback();
                }

              },

              function( chainCallback ){

                var toDb = {
                  url: dial.url,
                  title: dial.title,
                  auto_title: dial.auto_title,
                  thumb_url: dial.thumb_url,
                  thumb_source_type: dial.thumb_source_type,
                  thumb_width: dial.thumb_width,
                  thumb_height: dial.thumb_height,
                  group_id: dial.group_id,
                  deny: deny,
                  position: dial.position ,
                  global_id: dial.global_id,
                  screen_maked: dial.screen_maked,
                  update_interval: dial.update_interval || ""
                };

                if( dial.get_screen_method ){
                    toDb.get_screen_method = dial.get_screen_method;
                }

                if( dial.thumb ){
                  toDb.thumb = dial.thumb;
                }


                if( exists ){

                  that.updateDial( oldData.rowid, toDb, function(){
                    chainCallback();
                  } );

                }
                else{

                  //dump( "ADD dial " + dial.global_id + "\n" );

                  //self.asyncNextPosition( dial.group_id, function( nextPosition ){

                  that.addDial( toDb,
                  function(){

                    chainCallback();

                  }, ["ignore_deny"] );


                }
              },

              function(chainCallback) {
                if (dial.thumb_source_type == "local_file") {
                  chainCallback();
                }
                else{
                  chainCallback();
                }
              },
              function() {
                callback( saveInfo );
              }
            ] );
          }

        } );
      } );
    },



    deleteDial: function( dialId, callback ){
      var that = this;

      fvdSpeedDial.Utils.Async.chain([
        function(next) {
          fvdSpeedDial.Storage.getDial(dialId, function(d) {
            if(!d || !d.thumb || typeof d.thumb != "string" || d.thumb.indexOf("filesystem:") !== 0) {
              return next();
            }
            fvdSpeedDial.Storage.FileSystem.removeByURL(d.thumb, function() {
              next();
            });
          });
        },
        function() {
          that.transaction( function( tx ) {
            tx.executeSql( "DELETE FROM `dials` WHERE `rowid` = ?", [ dialId ], function( tx, results ){
              if( callback ){
                that._callDialsChangeCallbacks( {
                  action: "remove",
                  data:{
                    id: dialId
                  }
                });

                callback({
                  result: results.rowsAffected == 1
                });
              }
            } );
          } );
        }
      ]);
    },

    clearDials: function( callback, where ){

      var that = this;

      where = where || "";

      if( where ){
        where = "WHERE " + where;
      }

      this.transaction( function( tx ){

        tx.executeSql( "SELECT rowid, thumb FROM `dials` " + where, [], function(tx, results){
          var r = [];
          for(var i = 0; i != results.rows.length; i++) {
            r.push(results.rows.item(i));
          }
          fvdSpeedDial.Utils.Async.arrayProcess(r, function(row, next) {
            that._callDialsChangeCallbacks( {
              action: "remove",
              data:{
                id: row.rowid
              }
            });
            if(!row.thumb || typeof row.thumb != "string" || row.thumb.indexOf("filesystem:") !== 0) {
              return next();
            }
            fvdSpeedDial.Storage.FileSystem.removeByURL(row.thumb, function() {
              next();
            });
          }, function() {
            that.transaction(function(tx) {
              tx.executeSql( "DELETE FROM `dials` " + where, [], function(){
                if( callback ){
                  Broadcaster.sendMessage({
                    action: "storage:dialsCleared"
                  });
                  callback();
                }
              } );
            });
          });
        } );

      } );

    },

    updateDial: function(dialId, data, callback) {
      callback = callback || function() {};
      var that = this;
      var global_id;

      try{// Task #1486
          if(data.thumb_source_type == "screen" && data.screen_maked === 0){
              fvdSpeedDial.HiddenCaptureQueue.removeFromQueueById(dialId);
          }
      }catch(ex){
          console.info(ex);
      }

      fvdSpeedDial.Utils.Async.chain([
        function(next) {
          that.dialGlobalId(dialId, function(_guid) {
            if(_guid) {
              global_id = _guid;
            }
            next();
          });
        },
        function(next) {
          if(!data.thumb || typeof data.thumb != "string") {
            return next();
          }
          if(data.thumb.indexOf("data:") !== 0) {
            return next();
          }
          var fname = global_id || dialId;
          // store thumb
          var thumb = fvdSpeedDial.Utils.dataURIToBlob(data.thumb),
              ext = fvdSpeedDial.Utils.typeToExt(thumb.type);
          fvdSpeedDial.Storage.FileSystem.write("/" + fvdSpeedDial.Config.FS_DIALS_PREVIEW_DIR + "/" + fname + "." + ext, thumb, function(err, url) {
            if(err) {
              console.warn(err);
              url = '';
            }
            data.thumb = url;
            next();
          });
        },
        function() {
          var tmp = that._getUpdateData( data );
          var dataArray = tmp.dataArray;
          var strings = tmp.strings;
          dataArray.push( dialId );
          if(data.thumb) {
            strings.push("`thumb_version` = `thumb_version` + 1");
          }
          var query = "UPDATE `dials` SET " + strings.join(",") + " WHERE `rowid` = ?";
          that.transaction(function( tx ){
            tx.executeSql( query, dataArray, function( tx, results ){
              that._callDialsChangeCallbacks( {
                action: "update",
                data:{
                  id: dialId,
                  data: data
                }
              });
              if(callback) {
                callback({
                  result: results.rowsAffected == 1
                });
              }
            } );
          });
        }
      ]);
    },

    moveDial: function( dialId, groupId, callback ){

      var that = this;

      this.nextDialPosition( groupId, function( newPosition ){

        that.updateDial( dialId, {
          group_id: groupId,
          position: newPosition
        }, function( result ){
          callback( result );
        } );

      } );

    },

    dialCanSync: function( globalId, callback ){

      this.transaction( function( tx ){

        tx.executeSql( "SELECT sync FROM `groups` WHERE `id` = (SELECT `group_id` FROM `dials` WHERE `dials`.`global_id` = ?)", [globalId], function( tx, results ){

          try{
            callback(results.rows.item(0).sync == 1);
          }
          catch( ex ){
            callback( true );
          }

        } );
      } );

    },


    insertDialUpdateStorage: function( dialId, sign, interval, newDialPosition, callback ){

      var that = this;

      this.getDialDataList( dialId, ["group_id"], function( dial ){

        that.transaction(function( tx ){

          var changedGlobalIds = [];

          fvdSpeedDial.Utils.Async.chain([

            function( chainCallback ){

              tx.executeSql( "SELECT global_id FROM dials WHERE `group_id` = ? AND `position` >= ? AND `position` <= ?", [
                dial.group_id, interval.start, interval.end
              ], function( tx, results ){

                for ( var i = 0; i != results.rows.length; i++ ){
                  changedGlobalIds.push( results.rows.item(i).global_id );
                }

                chainCallback();

              } );

            },

            function( chainCallback ){

              tx.executeSql("UPDATE `dials` SET `position` = `position` " + sign + "1 WHERE `group_id` = ? AND `position` >= ? AND `position` <= ?",
                      [dial.group_id, interval.start, interval.end], function(){

                that.updateDial( dialId, {
                  position: newDialPosition
                }, function(){
                  chainCallback();
                } );

              });

            },

            function(){
              callback( changedGlobalIds );
            }

          ]);

        });

      } );
    },

    /**
     * params is url, excludeIds, finalCheck
     */
    dialExists: function( params, callback ){
      var that = this;
      params = params || {};

      var additionalWhere = "";
      if( params.excludeIds ){
        additionalWhere = " AND `rowid` NOT IN( "+ params.excludeIds.join(",") +" )";
      }

      this.transaction( function( tx ){
        tx.executeSql( "SELECT EXISTS(SELECT * FROM `dials` WHERE `url` = ? "+additionalWhere+") as ex", [
          params.url
        ], function( tx, results ){
          var exists = !!results.rows.item(0).ex;

          if( exists ){
            return callback( exists );
          }

            return callback(exists); // Task #1143

            ///### Depricated ###///

          var parsedUrl = fvdSpeedDial.Utils.parseUrl( params.url );
          if(!parsedUrl || !parsedUrl.host) {
            // url without host or not well formed url
            // it's maybe a file:/// url
            return callback(false);
          }
          var host = parsedUrl.host.toLowerCase();

          if( host.indexOf( "www." ) === 0 ){
            host = host.substr( 4 );
          }
          else{
            host = "www." + host;
          }

          parsedUrl.host = host;

          var url = fvdSpeedDial.Utils.buildUrlFromParsed( parsedUrl );

          tx.executeSql( "SELECT EXISTS(SELECT * FROM `dials` WHERE `url` = ? "+additionalWhere+") as ex", [ url ], function( tx, results ){
            var exists = !!results.rows.item(0).ex;

            if( !exists && !params.finalCheck ){
              if( parsedUrl.scheme == "http" ){
                parsedUrl.scheme = "https";
              }
              else{
                parsedUrl.scheme = "http";
              }

              url = fvdSpeedDial.Utils.buildUrlFromParsed( parsedUrl );

              that.dialExists( {
                url: url,
                excludeIds: params.excludeIds,
                finalCheck: true
              }, callback);
            }
            else{
              callback( exists );
            }
          });

        } );
      } );
    },

    dialExistsByGlobalId: function( globalId, callback ){

      this.transaction( function( tx ){
        tx.executeSql( "SELECT EXISTS(SELECT * FROM `dials` WHERE `global_id` = ?) as ex", [ globalId ], function( tx, results ){
          callback( results.rows.item(0).ex );
        } );
      } );
    },


    nextDialPosition: function( group_id, callback ){
      this.transaction( function( tx ){
        tx.executeSql( "SELECT MAX(position)  as cnt FROM `dials` WHERE `group_id` = ?", [group_id], function( tx, results ){
          callback( results.rows.item(0).cnt + 1 );
        } );
      } );
    },

    countDials: function( params, callback ){
      if(typeof params == "function") {
        callback = params;
        params = {};
      }
      params = params || {};

      var clause = "*";

      if( params.uniqueUrl ){
        clause = " DISTINCT `url` ";
      }

      this.transaction( function( tx ){
        tx.executeSql( "SELECT COUNT("+clause+") as cnt FROM `dials` WHERE `deny` = ? ", [0], function( tx, results ){
          callback( results.rows.item(0).cnt );
        } );
      } );
    },

    refreshDenyDials: function( callback ){

      var that = this;

      // go away all dials and refresh its deny field
      this.transaction(function(tx){
        tx.executeSql( "SELECT `rowid`, `url`, `deny` FROM `dials`", [], function( tx,results ){

          for( var i = 0; i != results.rows.length; i++ ){
            var dial = results.rows.item( i );
            (function( i, dial ){
              that.isDenyUrl( dial.url, function( deny ){

                var newDeny = deny ? 1 : 0;
                if( newDeny != dial.deny ){
                  that.updateDial(dial.rowid, {
                    deny: newDeny
                  }, function(){

                    if( i == results.rows.length - 1 ){
                      if( callback ){
                        callback();
                      }
                    }

                  });
                }
                else{
                  if( i == results.rows.length - 1 ){
                    if( callback ){
                      callback();
                    }
                  }
                }

              } );
            })( i, dial );
          }

          if( results.rows.length === 0 ){
            if( callback ){
              callback(  );
            }
          }

        } );
      });


    },

    // deny functions

    deny: function( type, sign, callback ){

      if( !sign ){
        throw "deny_empty_sign";
      }

      var firstSign = sign;

      if( type == "host" ){
        if( fvdSpeedDial.Utils.isValidUrl( sign ) ){
          sign = fvdSpeedDial.Utils.parseUrl( sign, "host" );
        }
      }
      else if( type == "url" ){

        if( !fvdSpeedDial.Utils.isValidUrl( sign ) ){
          throw "deny_invalid_url";
        }

        sign = fvdSpeedDial.Utils.urlToCompareForm(sign);
      }
      else{
        throw "deny_wrong_type";
      }

      var that = this;
      this._denySignExists( type, sign, function( exists ){
        if( !exists ){
          that.transaction(function( tx ){
            tx.executeSql( "INSERT INTO deny ( `sign`, `effective_sign`, `type` ) VALUES( ?, ?, ? )", [firstSign, sign, type], function( tx, results ){
              if( callback ){
                callback({
                  result: results.rowsAffected == 1,
                  id: results.insertId
                });
              }

              that._callDenyChangeCallbacks( {
                action: "add",
                type: type,
                sign: sign
              } );
            } );
          });
        }
        else{
          callback({
            result: false,
            error: "deny_already_exists"
          });
        }
      } );



    },

    editDeny: function( id, data, callback ){

      var that = this;

      data.effective_sign = fvdSpeedDial.Utils.urlToCompareForm( data.sign );
      this._denySignExists( data.type, data.effective_sign, function( exists ){

        if( exists ){
          if( callback ){
            callback({
              result: false,
              error: "deny_already_exists"
            });
          }
        }
        else{
          var updateData = that._getUpdateData( data );

          updateData.dataArray.push(id);


          var query = "UPDATE `deny` SET " + updateData.strings.join(",") + " WHERE `rowid` = ?";

          that.transaction( function( tx ){
            tx.executeSql( query, updateData.dataArray, function( tx, results ){
              if( callback ){
                callback({
                  result: results.rowsAffected == 1
                });
              }
              that._callDenyChangeCallbacks( {
                action: "edit"
              } );
            } );
          } );
        }

      }, id );

    },

    denyList: function( callback ){

      this.transaction( function( tx ){

        tx.executeSql( "SELECT rowid as id, effective_sign, sign, type FROM deny", [], function( tx, results ){
          var result = [];
          for( var i = 0; i != results.rows.length; i++ ){
            result.push( results.rows.item( i ) );
          }

          callback( result );
        } );

      } );

    },

    removeDeny: function( id, callback ){
      var that = this;

      this.transaction(function( tx ){
        tx.executeSql( "DELETE FROM `deny` WHERE `rowid` = ?", [id], function( tx, results ){
          if( callback ){
            callback();
          }

          that._callDenyChangeCallbacks( {
            action: "remove"
          } );
        } );
      });
    },

    clearDeny: function( callback ){
      this.transaction( function( tx ){
        tx.executeSql( "DELETE FROM `deny`", [], function(){
          if( callback ){
            callback();
          }
        } );
      } );
    },

    isDenyUrl: function( url, callback ){

      var that = this;
      this.transaction(function( tx ){
        tx.executeSql( "SELECT effective_sign, type FROM deny", [], function( tx, results ){
          var result = false;
          var denyDetails = null;

          for (var i = 0, len = results.rows.length; i < len; i++) {

            var item = results.rows.item( i );
            switch( item.type ){
              case "url":
                result = fvdSpeedDial.Utils.isIdenticalUrls( item.effective_sign, url );
              break;
              case "host":
                var host = fvdSpeedDial.Utils.parseUrl( url, "host" );
                result = fvdSpeedDial.Utils.isIdenticalHosts( item.effective_sign, host, {
                  ignoreSubDomains: true
                } );
              break;
            }

            if( result ){
              denyDetails = {
                deny: item
              };
              break;
            }

          }

          callback(result, denyDetails);
        });
      } );

    },

    /* Groups */

    resetDefaultGroupId: function(){

      this.groupsList(function( groups ){
        var group = groups[0];
        var newId = group.id;

        fvdSpeedDial.Prefs.set( "sd.default_group", newId );
      });

    },

    groupIdByGlobalId: function(globalId, callback) {
      this.transaction(function( tx ){
        tx.executeSql( "SELECT `id` FROM `groups` WHERE global_id = ?", [globalId], function( tx, results ){

          var id = null;
          if( results.rows.length == 1 ){
            id = results.rows.item(0).id;
          }
          callback( id );

        } );
      });
    },

    groupGlobalId: function( id, callback ){

      this.transaction(function( tx ){
        tx.executeSql( "SELECT global_id FROM `groups` WHERE id = ?", [id], function( tx, results ){

          var globalId = null;
          if( results.rows.length == 1 ){
            globalId = results.rows.item(0).global_id;
          }
          callback( globalId );

        } );
      });

    },

    addDialsCallback: function( callback ){
      if( this._dialsChangeCallbacks.indexOf( callback ) != -1 ){
        return;
      }

      this._dialsChangeCallbacks.push( callback );
    },

    removeDialsCallback: function( callback ){
      var index = this._dialsChangeCallbacks.indexOf( callback );

      if( index == -1 ){
        return;
      }

      this._dialsChangeCallbacks.splice(index, 1);
    },

    addGroupsCallback: function( callback ){
      if( this._groupsChangeCallbacks.indexOf( callback ) != -1 ){
        return;
      }

      this._groupsChangeCallbacks.push( callback );
    },

    removeGroupsCallback: function( callback ){
      var index = this._groupsChangeCallbacks.indexOf( callback );

      if( index == -1 ){
        return;
      }

      this._groupsChangeCallbacks.splice(index, 1);
    },


    groupAdd: function(params, callback, forcePosition) {
      var that = this;
      var position;
      if(typeof params.sync === "undefined") {
        params.sync = 1;
      }
      if(params.hasOwnProperty('forcePosition')) {
        forcePosition = params.forcePosition;
        delete params.forcePosition;

      }
      fvdSpeedDial.Utils.Async.chain([
        function(next) {
          that.groupExists( {
            name: params.name
          }, function(exists) {
            if(exists) {
              throw "group_exists";
            }
            next();
          });
        },
        function(next) {
          that.nextGroupPosition(function(nextPosition) {
            position = nextPosition;
            next();
          });
        },
        function(next) {
          if(forcePosition === "top") {
            position = 1;
            that.transaction(function(tx) {
              // increase other groups positions
              tx.executeSql('UPDATE `groups` SET `position` = `position` + 1', [], function() {
                next();
              });
            });
          }
          else {
            if(!isNaN(forcePosition)) {
              position = forcePosition;
            }
            next();
          }
        },
        function() {
          if(typeof params.position != "undefined") {
            position = params.position;
          }
          if(!params.global_id) {
            params.global_id = that._generateGUID();
          }

          that.transaction(function(tx) {
            tx.executeSql( "INSERT INTO `groups` (`position`, `name`, `global_id`, `sync`) VALUES(?, ?, ?, ?)",
              [ position, params.name, params.global_id, params.sync ], function(tx, results) {
              if(callback) {
                callback({
                  result: results.rowsAffected == 1,
                  id: results.insertId
                });
              }

              that._callGroupsChangeCallbacks({
                action: "add"
              });
            } );
          });
        }
      ]);
    },

    syncFixGroupsPositions: function( callback ){

      var that = this;

      var query = "SELECT `id` FROM `groups` ORDER BY `position`";

      this._rawList( query, function( list ){

        var position = 1;

        fvdSpeedDial.Utils.Async.arrayProcess( list, function( group, arrayProcessCallback ){

          that.transaction( function(tx){

            tx.executeSql("UPDATE groups SET position = ? WHERE id = ?", [position, group.id], function() {
              position++;
              arrayProcessCallback();
            }, function(_tx, error) {
              console.error("Got and sql error", error);
              arrayProcessCallback();
            });

          } );

        }, function(){
          that.onDataChanged.dispatch();
          callback();
        } );

      } );

    },

    // save group for sync
    syncSaveGroup: function(group, callback) {
      callback = callback || function() {};
      var that = this;

      this.groupExistsByGlobalId( group.global_id, function( exists ){

        if(exists) {
          that.transaction( function( tx ){

            tx.executeSql( "UPDATE `groups` SET `name` = ?, `position` = ? WHERE `global_id` = ?", [
              group.name, group.position, group.global_id
            ], function() {
              that.onDataChanged.dispatch();
              callback();
            } ) ;

          } );
        }
        else{
          that.transaction( function( tx ){

            tx.executeSql( "INSERT INTO `groups`(`name`, `position`, `global_id`) VALUES(?, ?, ?)", [
              group.name, group.position, group.global_id
            ], function() {
              that.onDataChanged.dispatch();
              callback();
            });

          } );
        }
      } );

    },

    // get group id by global id
    syncGetGroupId: function(globalId, callback) {

      this.transaction(function(tx) {
        tx.executeSql("SELECT id FROM `groups` WHERE `groups`.`global_id` = ?", [globalId], function( tx, results ){

          var groupId = 0;
          if( results.rows.length == 1 ){
            groupId = results.rows.item(0).id;
          }

          callback( groupId );

        } );
      } );

    },

    // remove groups that not in list
    syncRemoveGroups: function( notRemoveIds, callback ){

      var that = this;

      var where = "WHERE 1=1";

      if( notRemoveIds.length > 0 ){
        where += " AND global_id NOT IN ('"+notRemoveIds.join("','")+"')";
      }

      where += " AND `sync` = 1";

      this._rawList( "SELECT id FROM groups " + where, function( groups ){

        fvdSpeedDial.Utils.Async.arrayProcess( groups, function( group, arrayProcessCallback ){

          var groupId = group.id;

          that.transaction( function( tx ){
            tx.executeSql( "DELETE FROM dials WHERE group_id = ?", [groupId], function(){

              tx.executeSql( "DELETE FROM groups WHERE id = ?", [ groupId ], function(){
                arrayProcessCallback();
              } );

            } );
          } );



        }, function() {
          fvdSpeedDial.AppLog.info("sync remove groups not in list, removed", groups.length);
          that.onDataChanged.dispatch();
          callback(groups.length);
        });

      } );



    },

    getGroup: function( id, callback ){
      this.transaction( function( tx ){
        tx.executeSql( "SELECT `groups`.`id`, `groups`.`name`, `groups`.`sync`, `groups`.`global_id`, (SELECT COUNT(*) FROM `dials` WHERE `group_id` = `groups`.`id`) as count_dials FROM `groups` WHERE `groups`.`id` = ?", [id], function( tx, results ){

          var group = null;
          if( results.rows.length == 1 ){
            group = results.rows.item(0);
          }

          callback( group );

        } );
      } );
    },

    groupsCount: function( callback ){
      this.transaction( function( tx ){
        tx.executeSql( "SELECT COUNT(*) as cnt FROM `groups`", [], function( tx, results ){
          callback( results.rows.item(0).cnt );
        } );
      } );
    },

    groupsList: function( callback ){
      this.transaction( function( tx ) {
        tx.executeSql(
          "SELECT `groups`.`id`, `groups`.`name`, `groups`.`sync`, `global_id`, " +
          "(SELECT COUNT(*) FROM `dials` WHERE `group_id` = `groups`.`id` AND `deny` = 0) as count_dials " +
          "FROM `groups` ORDER BY `groups`.`position`", [], function(tx, results) {
          var data = [];
          for( var i = 0; i != results.rows.length; i++ ){
            data.push(  results.rows.item( i ));
          }
          fvdSpeedDial.AppLog.info("Groups list queried successully, count:", data.length);
          callback( data );
        }, function(tx, err) {
          fvdSpeedDial.AppLog.err("Fail query groups list:", err.message);
        } );
      } );
    },

    groupsRawList: function( params, callback ){

      params = params || {};

      var whereStr = "";
      if( params.where ){
        whereStr = "WHERE " + params.where.join(" AND ");
      }

      var query = "SELECT * FROM `groups` " + whereStr;

      this._rawList( query, callback );

    },


    groupUpdate: function( groupId, data, callback ){
      var that = this;

      var tmp = this._getUpdateData( data );

      var dataArray = tmp.dataArray;
      var strings = tmp.strings;

      dataArray.push( groupId );

      var syncChanged = false;

      fvdSpeedDial.Utils.Async.chain( [
        function( chainCallback ){

          if( typeof data.sync != "undefined" ){

            that.getGroup( groupId, function( group ){
              if( group.sync != data.sync ){
                syncChanged = true;
              }

              chainCallback();
            } );

          }
          else{
            chainCallback();
          }

        },

        function(){

          var query = "UPDATE `groups` SET " + strings.join(",") + " WHERE `id` = ?";

          that.transaction(function( tx ){
            tx.executeSql( query, dataArray, function( tx, results ){

              if( syncChanged ){
                fvdSpeedDial.Sync.groupSyncChanged( groupId, function(){

                  if( callback ){
                    callback({
                      result: results.rowsAffected == 1
                    });
                  }

                } );
              }
              else{
                if( callback ){
                  callback({
                    result: results.rowsAffected == 1
                  });
                }
              }

              that._callGroupsChangeCallbacks({
                action: "update"
              });
            } );
          });

        }
      ] );


    },

    groupDelete: function( groupId, callback ){
      var that = this;
      this.transaction( function( tx ){
        tx.executeSql( "DELETE FROM `groups` WHERE `id` = ?",  [groupId], function( tx, results ){
          try{
            callback({
              result: results.rowsAffected == 1
            });

            that._callGroupsChangeCallbacks({
              action: "remove",
              groupId: groupId
            });
          }
          catch( ex ){

          }
        } );
      } );
    },

    clearGroups: function( callback, where ){
      var self = this;
      where = where || "";

      if( where ){
        where = "WHERE " + where;
      }

      this.transaction( function( tx ){
        tx.executeSql( "DELETE FROM `groups` " + where, [], function(){
          self.onDataChanged.dispatch();
          if(callback) {
            callback();
          }
        } );
      } );

    },


    nextGroupPosition: function(callback) {
      this.transaction(function(tx) {
        tx.executeSql("SELECT MAX(`position`) as maxpos FROM `groups`", [], function(tx, results) {
          try {
            callback(results.rows.item(0).maxpos + 1);
          }
          catch(ex) {
          }
        });
      });
    },

    groupCanSyncById: function( id, callback ){

      this.transaction( function( tx ){

        tx.executeSql( "SELECT sync FROM `groups` WHERE `id` = ?", [id], function( tx, results ){

          try{
            callback(results.rows.item(0).sync == 1);
          }
          catch( ex ){
            callback( true );
          }

        } );
      } );

    },

    groupCanSync: function( globalId, callback ){

      this.transaction( function( tx ){

        tx.executeSql( "SELECT sync FROM `groups` WHERE `global_id` = ?", [globalId], function( tx, results ){

          try{
            callback(results.rows.item(0).sync == 1);
          }
          catch( ex ){
            callback( true );
          }

        } );
      } );

    },

    /**
     * check group exists
     * @param {String} name
     * @param {Array} [excludeIds=null]
     * @return {Boolean}
     */
    groupExists: function( params, callback ){
      params.excludeIds = params.excludeIds || null;
      this.transaction( function( tx ){
        var additionalWhere = "";
        if( params.excludeIds ){
          additionalWhere = " AND `id` NOT IN (" + params.excludeIds.join(",") + ")";
        }

        tx.executeSql( "SELECT EXISTS( SELECT * FROM `groups` WHERE `name` = ? " + additionalWhere + " ) as ex", [
          params.name
        ], function( tx, results ){

          try{
            callback(results.rows.item(0).ex == 1);
          }
          catch( ex ){

          }

        } );
      } );
    },

    groupExistsById: function( id, callback ){

      this.transaction( function( tx ){

        tx.executeSql( "SELECT EXISTS( SELECT * FROM `groups` WHERE `id` = ? ) as ex", [id], function( tx, results ){

          try{
            callback(results.rows.item(0).ex == 1);
          }
          catch( ex ){

          }

        } );

      } );

    },

    groupExistsByGlobalId: function( globalId, callback ){

      this.transaction( function( tx ){

        tx.executeSql( "SELECT EXISTS( SELECT * FROM `groups` WHERE `global_id` = ? ) as ex", [globalId], function( tx, results ){

          try{
            callback(results.rows.item(0).ex == 1);
          }
          catch( ex ){

          }

        } );
      } );

    },

    getMisc: function( name, callback ){
      this.transaction( function( tx ){
        tx.executeSql( "SELECT `value` FROM `misc` WHERE `name` = ?", [name], function( tx, results ){
          var v = null;
          if( results.rows.length == 1 ){
            v = results.rows.item(0).value;
          }
          callback( v );
        } );
      } );
    },

    setMisc: function( name, value, callback ){
      var that = this;
      fvdSpeedDial.Utils.Async.chain([
        function(next) {
          if(name != "sd.background") {
            return next();
          }
          if(typeof value == "string" && value.indexOf("data:") === 0) {
            // save to file
            var img = fvdSpeedDial.Utils.dataURIToBlob(value),
                ext = fvdSpeedDial.Utils.typeToExt(img.type);
            fvdSpeedDial.Storage.FileSystem.write("/" + fvdSpeedDial.Config.FS_MISC_DIR +
                                          "/background." + ext, img, function(err, url) {
              if(err) {
                throw err;
              }
              value = url;
              next();
            });
          }
          else {
            next();
          }
        },
        function() {
          that.transaction( function(tx) {
            tx.executeSql( "INSERT INTO `misc` (`name`, `value`) VALUES(?,?)", [name, value], function(){
              Broadcaster.sendMessage({
                action: "miscDataSet",
                name: name
              });
              if(callback) {
                callback();
              }
            });
          });
        }
      ]);
    },

    _rawList: function( query, callback ){
      this.transaction( function( tx ){
        tx.executeSql( query, [], function( tx, results ){
          var data = [];
          for( var i = 0; i != results.rows.length; i++ ){
            data.push(fvdSpeedDial.Utils.clone(results.rows.item( i )));
          }
          callback( data );
        }, function(){ console.log( "Request error ("+query+")", arguments ) } );
      } );
    },

    _prepareDialData: function( dial ){
      dial.displayTitle = dial.title ? dial.title : dial.auto_title;
    },

    _callDialsChangeCallbacks: function( data ){
      var toRemoveCallbacks = [], i;
      for( i = 0; i != this._dialsChangeCallbacks.length; i++ ){
        try{
          this._dialsChangeCallbacks[i]( data );
        }
        catch( ex ){
          toRemoveCallbacks.push( this._dialsChangeCallbacks[i] );
        }
      }

      for( i = 0; i != toRemoveCallbacks.length; i++ ){
        this.removeDialsCallback( toRemoveCallbacks[i] );
      }
      this.onDataChanged.dispatch();
    },

    _callGroupsChangeCallbacks: function( data ){
      var toRemoveCallbacks = [], i;
      for( i = 0; i != this._groupsChangeCallbacks.length; i++ ){
        try{
          this._groupsChangeCallbacks[i]( data );
        }
        catch( ex ){
          toRemoveCallbacks.push( this._groupsChangeCallbacks[i] );
        }
      }

      for( i = 0; i != toRemoveCallbacks.length; i++ ){
        this.removeGroupsCallback( toRemoveCallbacks[i] );
      }
      this.onDataChanged.dispatch();
    },

    _callDenyChangeCallbacks: function( data ){
      Broadcaster.sendMessage({
        action: "deny:changed",
        data: data
      });
    },

    _denySignExists: function( type, effective_sign, callback, except ){

      var additionalWhere = "";
      if( except ){
        additionalWhere = " AND `rowid` != " + except;
      }

      this.transaction(function( tx ){
        tx.executeSql( "SELECT EXISTS( SELECT * FROM `deny` WHERE `effective_sign` = ? AND `type` = ? "+additionalWhere+" ) as found", [effective_sign, type], function( tx, results ){

          callback( results.rows.item(0).found == 1 );

        } );
      });

    },

    _getInsertData: function( data ){
      var dataArray = [];
      var stringKeys = [];
      var stringValues = [];

      for( var k in data ){
        stringKeys.push( "`" + k + "`" );
        stringValues.push( "?" );
        dataArray.push( data[k] );
      }

      return {
        keys: stringKeys.join(","),
        values: stringValues.join(","),
        dataArray: dataArray
      };
    },

    _getUpdateData: function( data ){
      var dataArray = [];
      var strings = [];
      for( var k in data ){
        strings.push( "`" + k + "` = ?" );
        dataArray.push( data[k] );
      }

      return{
        dataArray: dataArray,
        strings: strings
      };
    },

    _resultsToArray: function( results ){
      var data = [];
      for( var i = 0; i != results.rows.length; i++ ){
        data.push( results.rows.item(i) );
      }
      return data;
    },

    _getTables: function( tx, callback ){
      if(typeof tx === "function") {
        callback = tx;
        tx = null;
      }
      var self = this;
      var data = [];
      fvdSpeedDial.Utils.Async.chain([
        function(next) {
          if(tx) {
            return next();
          }
          self.transaction(function( _tx ) {
            tx = _tx;
            next();
          });
        },
        function() {
          tx.executeSql( "SELECT `name`, `type` FROM sqlite_master", [], function( tx, results ){
            for( var i = 0; i != results.rows.length; i++ ){
              var item = results.rows.item( i );

              if( item.type == "table" ){
                data.push( item.name );
              }
            }

            callback( data );
          } );
        }
      ]);
    },

    _getIndexes: function( callback, _tx ){

      var tx = null;

      if( _tx ){
        tx = _tx;
      }

      function _execute(){
        var data = [];

        tx.executeSql( "SELECT `name`, `type` FROM sqlite_master", [], function( tx, results ){
          for( var i = 0; i != results.rows.length; i++ ){
            var item = results.rows.item( i );

            if( item.type == "index" ){
              data.push( item.name );
            }
          }

          callback( data );
        } );
      }

      if( tx ){
        _execute();
      }
      else{
        this.transaction(function( _tx ){

          tx = _tx;
          _execute();

        });
      }



    },

    _tableFields: function( table, callback, _tx ) {

      var tx = null;

      if( _tx ){
        tx = _tx;
      }

      function _execute(){

        var data = [];

        tx.executeSql( "SELECT * FROM "+table+" LIMIT 1", [], function( tx, results ){
          try{
            data = Object.keys( results.rows.item(0) );
          }
          catch( ex ){

          }
          if(!data.length) {
            // try to get from sqlite_master
            tx.executeSql(
              "SELECT `sql` FROM `sqlite_master` WHERE `name` = '" + table + "' AND " +
              "`type` = 'table'", [], function(tx, results) {
                if(results.rows.length) {
                  var sql = results.rows.item(0).sql;
                  var match = sql.match(/\((.+?)\)/i);
                  if(match) {
                    var tmp = match[1].split(/\s*,\s*/);
                    for(var i = 0; i != tmp.length; i++) {
                      var t = tmp[i].split(" ")[0];
                      t = t.replace(/`|\s/g, "");
                      data.push(t);
                    }
                  }
                }
                callback(data);
              }, function(err) {
                console.error(err);
                callback(data);
              });
          }
          else {
            callback( data );
          }
        } );

      }

      if( !tx ){
        this.transaction(function( _tx ){

          tx = _tx;
          _execute();

        });
      }
      else{
        _execute();
      }


    },

    _generateGUID: function() {

      var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
      var string_length = 32;
      var randomstring = '';

      for (var i=0; i<string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum,rnum+1);
      }

      return randomstring;

    },

    _createTables: function(callback) {
      var self = this;
      var databaseBackup;
      fvdSpeedDial.Utils.Async.chain([
        function(next) {
          fvdSpeedDial.DatabaseBackup.getBackup(function(err, _databaseBackup) {
            databaseBackup = _databaseBackup;
            next();
          });
        },
        function() {
          self._connection.transaction(function(tx) {
            fvdSpeedDial.Storage.initStorage(
              tx, databaseBackup, callback
            );
          }, function(err) {
            console.error("Fail to get transaction for table creation", err);
          });
        }
      ]);
    }
  };

  fvdSpeedDial.Storage = new Storage();
})();


