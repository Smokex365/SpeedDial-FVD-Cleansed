(function() {
  var createTablesRequests = {
    dials: "CREATE TABLE IF NOT EXISTS dials " +
      "(url TEXT, display_url TEXT, title TEXT, `auto_title` TEXT,"+
      "thumb_source_type TEXT, thumb_url TEXT," +
      "position INT, group_id INT, deny INT, clicks INT, `screen_maked` INT," +
      "`thumb` TEXT, `thumb_version` INT DEFAULT 0," +
      "`screen_delay` INT, `thumb_width` INT, `thumb_height` INT, `global_id` TEXT," +
      "`get_screen_method`  VARCHAR DEFAULT 'manual', `update_interval` TEXT, " +
      "`last_preview_update` INT, `need_sync_screen` INT)",
    mostvisited_extended: "CREATE TABLE IF NOT EXISTS mostvisited_extended " +
      "(id INT UNIQUE ON CONFLICT IGNORE, `title` TEXT," +
      "`auto_title` TEXT, thumb_source_type TEXT, thumb_url TEXT, `screen_maked` INT," +
      "`thumb` TEXT, `thumb_version` INT DEFAULT 0, `removed` INT, `screen_delay` INT," +
      "`thumb_width` INT, `thumb_height` INT," +
      "`get_screen_method`  VARCHAR DEFAULT 'manual')",
    deny: "CREATE TABLE IF NOT EXISTS deny(sign TEXT, effective_sign TEXT, type TEXT)",
    misc: "CREATE TABLE IF NOT EXISTS misc( `name` TEXT  UNIQUE ON CONFLICT REPLACE, `value` TEXT )",
    groups: "CREATE TABLE IF NOT EXISTS groups " +
      "(id INTEGER PRIMARY KEY, name TEXT, position INT, global_id TEXT, sync INT DEFAULT 1)"
  };

  var requiredIndexes = [
    {
      name: "dials_global_id",
      sql: "CREATE INDEX dials_global_id ON dials(global_id)"
    },
    {
      name: "groups_global_id",
      sql: "CREATE INDEX groups_global_id ON groups(global_id)"
    },
    {
      name: "dials_group_id",
      sql: "CREATE INDEX dials_group_id ON dials(group_id, deny)"
    }
  ];

  var requiredFields = [
    {
      table: "dials",
      fields: [ {
        name: "global_id",
        sql: "ALTER TABLE `dials` ADD COLUMN `global_id` TEXT"
      },
      {
        name: "get_screen_method",
        sql: "ALTER TABLE `dials` ADD COLUMN `get_screen_method` VARCHAR DEFAULT 'manual'"
      },
      {
        name: "need_sync_screen",
        sql: [
          "ALTER TABLE `dials` ADD COLUMN `need_sync_screen` INT",
          "UPDATE `dials` SET `need_sync_screen` = 1 WHERE `thumb_source_type` = 'local_file' "+
            "OR ( `thumb_source_type` = 'screen' AND `get_screen_method` = 'manual' )"
        ]
      },
      {
        name: "thumb_version",
        sql: "ALTER TABLE `dials` ADD COLUMN `thumb_version` INT DEFAULT 0"
      },
      {
        name: "update_interval",
        sql: "ALTER TABLE `dials` ADD COLUMN `update_interval` TEXT"
      },
      {
        name: "last_preview_update",
        sql: "ALTER TABLE `dials` ADD COLUMN `last_preview_update` INT"
      },
      {
        name: "display_url",
        sql: "ALTER TABLE `dials` ADD COLUMN `display_url` TEXT"
      }
      ]
    },
    {
      table: "groups",
      fields:[
        {
          name: "global_id",
          sql: "ALTER TABLE `groups` ADD COLUMN `global_id` TEXT"
        },
        {
          name: "sync",
          sql: "ALTER TABLE `groups` ADD COLUMN `sync` INT DEFAULT 1"
        },
      ]
    },
    {
      table: "mostvisited_extended",
      fields: [ {
        name: "get_screen_method",
        sql: "ALTER TABLE `mostvisited_extended` ADD COLUMN `get_screen_method`  VARCHAR DEFAULT 'manual'"
      },
      {
        name: "thumb_version",
        sql: "ALTER TABLE `mostvisited_extended` ADD COLUMN `thumb_version` INT DEFAULT 0"
      }, ]
    },
  ];

  fvdSpeedDial.Storage.initStorage = function(tx, databaseBackup, callback) {
    var that = fvdSpeedDial.Storage;
    var failCreateTable = function(table, trx, err) {
      fvdSpeedDial.AppLog.err("Fail to create table", table, err.message);
    };

    var currentTables;
    var tablesCreated = [];
    var backupRestored = false;
    fvdSpeedDial.Utils.Async.chain([
      function(callback2) {
        // get list of current tables
        that._getTables(tx, function(tables) {
          currentTables = tables;
          callback2();
        });
      },
      function(callback2) {
        // create tables which don't exist
        fvdSpeedDial.Utils.Async.arrayProcess(Object.keys(createTablesRequests), function(table, next) {
          if(currentTables.indexOf(table) !== -1) {
            return next();
          }
          tx.executeSql(createTablesRequests[table], [], function() {
            fvdSpeedDial.AppLog.info("Create " + table + " table: OK");
            tablesCreated.push(table);
            next();
          }, failCreateTable.bind(null, table));
        }, callback2);
      },

      function(chainCallback) {
        // check fields
        fvdSpeedDial.Utils.Async.arrayProcess(requiredFields,
          function(tableData, arrayProcessCallbackTable) {
          that._tableFields(tableData.table, function(fields) {
            fvdSpeedDial.Utils.Async.arrayProcess(tableData.fields,
              function(field, arrayProcessCallbackField) {
              if(fields.indexOf( field.name ) == -1 && fields.length > 0) {
                fvdSpeedDial.AppLog.info(
                  "Not found field", field.name, "in", tableData.table, "try create"
                );
                var sqls = field.sql;
                if(!( sqls instanceof Array)) {
                  sqls = [ sqls ];
                }
                fvdSpeedDial.Utils.Async.arrayProcess( sqls, function( sql, apCallbackSqls ){
                  tx.executeSql( sql, [], function() {
                    if( field.after ){
                      field.after( tx, function(){
                        apCallbackSqls();
                      } );
                    }
                    else{
                      apCallbackSqls();
                    }
                  }, function(error) {
                    console.log("Can't alter table", error);
                  } );

                }, function(){
                  arrayProcessCallbackField();
                }, true );
              }
              else{
                arrayProcessCallbackField();
              }

            }, function() {
              arrayProcessCallbackTable();
            }, true );

          }, tx );
        }, function(){
          chainCallback();
        }, true );
      },

      function(chainCallback) {
        // check indexes
        that._getIndexes(function(indexes) {
          fvdSpeedDial.Utils.Async.arrayProcess(requiredIndexes, function(index, arrayProcessCallback) {
            if(indexes.indexOf( index.name ) == -1) {
              fvdSpeedDial.AppLog.info("Not found index", index.name, "create it");
              tx.executeSql(index.sql, [], function() {
                arrayProcessCallback();
              });
            }
            else{
              arrayProcessCallback();
            }
          }, function() {
            chainCallback();
          }, true);
        }, tx);
      },

      function(callback2) {
        if(tablesCreated.indexOf("groups") !== -1 && tablesCreated.indexOf("dials") !== -1 && databaseBackup) {
          // significant tables has created, it is first dial instal or something has dropped tables before
          // try to restore backup
          databaseBackup.restore(tx, function(err) {
            if(err) {
              fvdSpeedDial.AppLog.info("! Backup hasn't been restored", err.message);
              console.info("Backup hasn't been restored(probably everything is ok)", err.message);
            }
            else {
              fvdSpeedDial.AppLog.info("Important! SpeedDial database has been restored.");
              backupRestored = true;
            }
            callback2();
          });
        }
        else {
          callback2();
        }
      },

      function(callback2) {
        // create default dials
        if(backupRestored) {
          // do not create default dials because database has just been restore
          return callback2();
        }
        if(tablesCreated.indexOf("groups") === -1 || tablesCreated.indexOf("dials") === -1) {
          return callback2();
        }
        var dialsCreated = [];

        // add default group
        var groupDials;
        fvdSpeedDial.Utils.Async.chain([
          function(next) {
            // need to fetch dials from server
            ServerDials.fetch({
              userType: "new"
            }, function(err, dials) {
              console.log("FETCHED", dials);
              if(err) {
                groupDials = [];
                fvdSpeedDial.AppLog.err("Fail to fetch dials from the server", err);
                console.error("Fail to fetch dials from the server", err);
              }
              else {
                fvdSpeedDial.AppLog.info("Fetched", dials.length, " dials from the server");
                groupDials = dials;
              }
              next();
            });
          },
          function(next) {
            var processDial = function(dialData, done) {
              dialData.get_screen_method = dialData.thumb_source_type != "url" ? "auto" : "custom";
              that.addDial(dialData, function(res) {
                if(res) {
                  dialData.id = res.id;
                  dialsCreated.push(dialData);
                }
                if(dialData.thumb_source_type == "url") {
                  fvdSpeedDial.ThumbMaker.getImageDataPath({
                    imgUrl: dialData.thumb_url,
                    screenWidth: fvdSpeedDial.SpeedDial.getMaxCellWidth()
                  }, function(dataUrl, thumbSize) {
                    fvdSpeedDial.Storage.updateDial(res.id, {
                      thumb: dataUrl,
                      thumb_width: Math.round(thumbSize.width),
                      thumb_height: Math.round(thumbSize.height)
                    }, function() {
                      chrome.runtime.sendMessage( {
                        action: "forceRebuild"
                      } );
                    } );
                  });
                }
                done();
              });
            };
            fvdSpeedDial.Utils.Async.arrayProcess(groupDials, processDial, next);
          },
          function() {
            fvdSpeedDial.AppLog.info("Created", dialsCreated.length, " default dials");
            Broadcaster.sendMessage({
              action: "defaultDialsCreated",
              dials: dialsCreated
            });
            callback2();
          }
        ]);

      },
      function() {
        if(tablesCreated.length) {
          fvdSpeedDial.AppLog.info("Tables created: " + tablesCreated.join(", "));
        }
        fvdSpeedDial.AppLog.info("Initialization complete");
        callback( true );
      }
    ]);
  };
})();