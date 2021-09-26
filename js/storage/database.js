(function() {
  var dialsByGuid = {};
  var onConnectDone, onConnectFailed;
  var initialPromise = new Promise(function(resolve, reject) {
    onConnectDone = resolve;
    onConnectFailed = reject;
  });
  var data = {
    groups: [
      {
        global_id: "xxx",
        name: "blabla",
        index: "blabla",
        dials: [
          {
            global_id: ""
          }
        ]
      }
    ]
  };
  function getGroupById(id) {
    var result = null;
    for(var i = 0; i != data.groups.length; i++) {
      var group = data.groups[id];
      if(group.id === id) {
        result = group;
        break;
      }
    }
    return result;
  }
  function applyOrder(source, order) {
    var field = order[0];
    var direction = order[1];
    // make clone of array
    var arr = source.slice();
    arr.sort(function(a, b) {
      var res = 0;
      if(a[field] > b[field]) {
        res = 1;
      }
      else if(a[field] < b[field]) {
        res = -1;
      }
      if(direction === "desc") {
        res = -res;
      }
      return res;
    });
    return arr;
  }
  // we don't want to allow Database API user to change data stored internally
  function sclone(data) {
    return JSON.parse(JSON.stringify(data));
  }
  var Database = {
    getDialsByGroup: function(groupId, order, limit) {
      order = order || ["position", "asc"];
      var self = this;
      return initialPromise.then(function() {
        var result = [];
        var group = getGroupById(groupId);
        if(group) {
          var result = group.dials;
          if(order[0] !== "position") {
            result = applyOrder(result, order);
          }
          if(limit) {
            result = result.slice(0, limit);
          }
        }
        return clone(result);
      });
    }
  };
  fvdSpeedDial.Database = Database;
})();