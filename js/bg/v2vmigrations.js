(function() {
  var isFirstInstall = false;

  function runMigrations(lastV, currentV) {
    console.log("Run migrations. lastver:", lastV, "currentver:", currentV);

    var migrations = [];
    var migrationsCompleted = {};
    var countRunned = 0;
    
    migrations.push(function() {        
      if(parseInt(String(lastV).split('.').join('')) < 6721){
        if(fvdSpeedDial.Prefs.get("sd.background_url_type") == 'parallax'){
          fvdSpeedDial.Prefs.set("sd.background_url_type", "fill");
        }
      }
    });

    migrations.push(function() {
      console.log("Migrations process completed, runned", countRunned, "migrations");
      // force refresh speeddial
      chrome.runtime.sendMessage({
        action: "forceRebuild"
      });
    });

    fvdSpeedDial.Utils.Async.chain(migrations);
  }

  chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === "install") {
      // addon now installed, do not run migrations, it already have newest version
      isFirstInstall = true;
      localStorage["installVersion"] = chrome.runtime.getManifest().version;
    } else if(details.reason === "update") {
      fvdSpeedDial.Utils.releaseNotes(true)
    }
  });

  Broadcaster.onMessage.addListener(function(msg) {
    if(msg.action == "storage:connected") {
      var currentV = chrome.runtime.getManifest().version,
        lastV = localStorage["__v2vmigrations_last_ver"];
        
      if(lastV != currentV) {
        localStorage["__v2vmigrations_last_ver"] = chrome.runtime.getManifest().version;
        
        if(isFirstInstall) {
          // do not run migrations if addon has been just installed
          return;
        }
        
        runMigrations(lastV, currentV);
      }
    }
  });
})();