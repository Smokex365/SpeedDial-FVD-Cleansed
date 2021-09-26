// proxy access to storage object to background page

(function() {
  var proxyMethods = [
    "resetAllDialsClicks",
    "groupsList",
    "groupsRawList",
    "setMisc",
    "getMisc",
    "dump",
    // Deny
    "clearDeny",
    "editDeny",
    "isDenyUrl",
    "deny",
    "denyList",
    "removeDeny",
    // Apps
    "Apps.get",
    "Apps.storePositions",
    // Dials
    "countDials",
    "searchDials",
    "listDials",
    "insertDialUpdateStorage",
    "dialExists",
    "addDial",
    "deleteDial",
    "getDial",
    "updateDial",
    "moveDial",
    "clearDials",
    "dialGlobalId",
    "resetAutoDialsForGroup",
    "setAutoPreviewGlobally",
    "turnOffAutoUpdateGlobally",
    "setAutoUpdateGlobally",
    // groups
    "groupExists",
    "groupUpdate",
    "groupAdd",
    "getGroup",
    "groupCanSyncById",
    "clearGroups",
    "groupsCount",
    "groupDelete",
    // Most Visited
    "MostVisited.getAvailableCount",
    "MostVisited.getData",
    "MostVisited.getDataByHost",
    "MostVisited.extendData",
    "MostVisited.getById",
    "MostVisited.updateData",
    "MostVisited.deleteId",
    "MostVisited.invalidateCache",
    "MostVisited.restoreRemoved",
    // Recently Closed
    "RecentlyClosed.getAvailableCount",
    "RecentlyClosed.getData",
    "RecentlyClosed.get",
    "RecentlyClosed.remove",
    "RecentlyClosed.removeAll"
  ];

  var StorageProxy = function() {
  };
  var p = new StorageProxy();

  proxyMethods.forEach(function(methodName) {
    function _processMethod() {
      var args = Array.prototype.slice.call(arguments),
          lastIndex = args.length - 1,
          cb = null;
      if(typeof args[lastIndex] == "function") {
        cb = args[lastIndex];
        args.splice(lastIndex, 1);
      }
      var request = {
        action: "proxy:storage",
        method: methodName,
        args: args,
        wantResponse: cb !== null,
      };
      var startTime = new Date().getTime();
      chrome.runtime.sendMessage(request, function(data) {
        //if("duration" in data) {
        if(typeof data == "object" && "duration" in data) {//Task #1636
          var now = new Date().getTime();
          var toBgDuration = (data.receiveTime - startTime)/1000;
          var fromBgDuration = (now - startTime)/1000 - toBgDuration - data.duration;
          debug.info(
            "Request", methodName, "took:\n",
            "->", toBgDuration + "s\n",
            "DB", data.duration + "s\n",
            "<-", fromBgDuration + "s"
          );
        }
        if(cb) {
          cb.apply(window, typeof data == "object" ? data.args : null);//Task #1636
        }
      });
    }

    var parts = methodName.split(".");
    var m = parts.pop(),
        obj = p;
    parts.forEach(function(part) {
      if(typeof obj[part] == "undefined") {
        obj[part] = {};
      }
      obj = obj[part];
    });
    obj[m] = _processMethod;
  });
  fvdSpeedDial.Storage = p;
})();


