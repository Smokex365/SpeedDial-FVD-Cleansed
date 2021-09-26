chrome.runtime.onConnect.addListener(function(port) {
  console.log("Obtained connection", port);
});

chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){//Task #1189
    if(typeof message == "object") {
        if(message.action == "previousSession:button") {
            fvdSpeedDial.SpeedDial.sessionRestore = message.sessionId;
            fvdSpeedDial.SpeedDial.sheduleRebuildGroupsList();
        }
    }
});

document.addEventListener( "DOMContentLoaded", function() {
  fvdSpeedDial.Localizer.localizeCurrentPage();

  fvdSpeedDial.AutoComplete = new fvdSpeedDial.AutoCompletePlus({
    input: "#q",
    form: "#cse-search-box"
  });
  fvdSpeedDial.AutoComplete.onClickSuggestion.addListener(function(value) {
    fvdSpeedDial.SpeedDialMisc.doSearch(value);
  });

  start_drop_down();

  fvdSpeedDial.SpeedDialMisc.init();
  fvdSpeedDial.Search.init();
  fvdSpeedDial.SpeedDial.init();

  fvdSpeedDial.SpeedDial._cellsRebuildCallback = function(){
    document.body.setAttribute("loaded", 1);

    //fvdSpeedDial.SpeedDial._cellsRebuildCallback = null;
  };

  fvdSpeedDial.SpeedDial.sheduleFullRebuild();

  fvdSpeedDial.ContextMenus.init();

  function showCorruptedFilesRestore() {
    var overlay = document.getElementById("restoreCorruptedFilesOverlay");
    overlay.removeAttribute("hidden");
    setTimeout(function() {
      overlay.setAttribute("appear", 1);
    }, 0);
  }

  function hideCorruptedFilesRestore() {
    var overlay = document.getElementById("restoreCorruptedFilesOverlay");
    overlay.removeAttribute("appear");
    overlay.setAttribute("hidden", 1);
  }

  Broadcaster.onMessage.addListener(function(msg) {
    if(msg.action == "storage:fs:updatestate") {
      if(msg.state == "restoring") {
        showCorruptedFilesRestore();
      }
      else if(msg.state == "normal") {
        var overlay = document.getElementById("restoreCorruptedFilesOverlay");
        if(overlay.hasAttribute("appear")) {
          document.location.reload();
        }
      }
    }
    else if(msg.action === "startDBRestore") {
      showCorruptedFilesRestore();
    }
    else if(msg.action === "finishDBRestore") {
      // refresh page
      document.location.reload();
    }
  });

  chrome.runtime.sendMessage({
    action: "storage:fs:getState"
  }, function(state) {
    if(state == "restoring") {
      showCorruptedFilesRestore();
    }
  });

  chrome.runtime.sendMessage({
    action: "databaseBackup:getState"
  }, function(state) {
    if(state == "restoring") {
      showCorruptedFilesRestore();
    }
  });

  Broadcaster.sendMessage({
    action: 'sdtab:open'
  })

  if(fvdSpeedDial.Config.FOCUS_NEWTAB_SEARCH) {
    setTimeout(function() {
      var searchInput = document.getElementById("q");
      if(searchInput) {
        searchInput.focus();
      }
    }, 0);
  }
    /*
    chrome.runtime.sendMessage({// Task #1189
        action: "previousSession:premission"
    }, function(state) {
        console.info("previousSession:premission", state);
    });
    */
    
    function previousSessionPremission(callback){// Task #1189
        chrome.tabs.getAllInWindow(function(tabs){
            var notPinnedTabsAmmount = 0;

            //test for opened tabs
            for(var k in tabs){
                if(!tabs[k].pinned) notPinnedTabsAmmount++;
            }

            if(notPinnedTabsAmmount > 1) localStorage.setItem("just-opened", 0);

            //send response
            if(callback) callback(
                localStorage.getItem("just-opened")
            );
        });
    }
    
    if(
        _b(fvdSpeedDial.Prefs.get("sd.restore_previous_session"))
        &&
        parseInt(localStorage.getItem("just-opened"))
    ){// Task #1189
        previousSessionPremission((prm)=>{
            localStorage.setItem("just-opened", 0); // DEV OFF!!!
            
            if(parseInt(prm)){
                chrome.runtime.sendMessage({
                    action: "previousSession:get"
                });
            }
        });
    }
    
    if(/\bCrOS\b/.test(navigator.userAgent)){// Task #1556
        document.getElementById("appsPanelOpenButton").style.display = "none";
    }
}, false );

















