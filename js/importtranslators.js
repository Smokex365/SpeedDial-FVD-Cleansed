/**
 * import from another speed dials for chrome
 * simple translate import objects to fvd speed dial format
 */

(function() {
  var translators = {};
  translators["speeddial2"] = function(data) {
    var homeGroupId = 9999999;
    if(!data.settings || !data.dials || !data.groups) {
      return null;
    }
    if(typeof data.dials["0"].idgroup == "undefined") {
      return null;
    }
    // ok, it's speeddial2 data
    var res = {
      db: {
        dials: [],
        groups: [],
        deny: []
      },
      prefs: {}
    };
    // restore prefs
    // now can restore only backound
    if(data.settings["options.background"] && /https?:\/\//i.test(data.settings["options.background"])) {
      res.prefs["sd.background_url_type"] = "fill";
      res.prefs["sd.background_url"] = data.settings["options.background"];
      res.prefs["sd.background_source"] = "url";
    }
    var k;
    res.db.groups.push({
      id: homeGroupId,
      name: "Home",
      position: 1,
    });
    // groups
    for(k in data.groups) {
      var group = data.groups[k];
      res.db.groups.push({
        id: group.id,
        name: group.title,
        position: group.position,
      });
    }
    for(k in data.dials) {
      var dial = data.dials[k];
      var thSourceType = "url";
      if(!dial.thumbnail) {
        thSourceType = "screen";
      }
      res.db.dials.push({
        title: dial.title,
        auto_title: null,
        url: dial.url,
        thumb_url: dial.thumbnail,
        thumb_source_type: thSourceType,
        get_screen_method: "custom",
        clicks: dial.visits,
        position: dial.position,
        group_id: parseInt(dial.idgroup, 10) === 0 ? homeGroupId : dial.idgroup
      });
    }
    return res;
  };

  fvdSpeedDial.importTranslate = {
    translate: function(data) {
      var res = null;
      for(var k in translators) {
        try {
          res = translators[k](data);
          if(res) {
            return res;
          }
        }
        catch(ex) {
          console.error(ex);
        }
      }
      return res;
    }
  };
})();
