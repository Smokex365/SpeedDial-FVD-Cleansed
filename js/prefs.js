// singletone
(function(){
  var Prefs = function(){

  };

  Prefs.prototype = {
    _prefsPrefix: "prefs.",
    _changeListeners: [],

    _themeDefaults: {

      "fancy":{
        "sd.background_url": "/images/newtab/fancy_bg.jpg",
        "sd.background_color": "000000",
        "sd.background_color_enabled": true,
        "sd.background_url_type": "fill",//"parallax", // Task #1814

        "sd.text.cell_title.color": "FFFFFF",
        "sd.text.list_elem.color": "FFFFFF",
        "sd.text.list_show_url_title.color": "FFFFFF",
        "sd.text.list_link.color": "EEEEEE",
        "sd.text.other.color": "FFFFFF",
        "sd.text.cell_url.color": "FFFFFF"
      },

      "standard":{
        "sd.background_url": "",
        "sd.background_color": "FFFFFF",
        "sd.background_color_enabled": true,
        "sd.background_url_type": "noimage",

        "sd.text.cell_title.color": "000000",
        "sd.text.list_elem.color": "000000",
        "sd.text.list_show_url_title.color": "000000",
        "sd.text.list_link.color": "0551AF",
        "sd.text.other.color": "000000",
        "sd.text.cell_url.color": "000000"
      }

    },

    // default values
    _defaults: {

      "surfcanyon.enabled": true,

      // apps
      "apps.opened": true,

      // dial mods
      "quick-preview.enabled": true,

      // widgets
      "widgets.enabled": true,
      "widgets.locked": true,
      "widgets.opened": true,
      "widgets.opacity": 100,
      "widgets.bgcolor": "000000",
      "widgets.autoscroll": false,
      "widgets.autoscroll.speed": 1,

      // Power off
      "poweroff.enabled": false,
      "poweroff.hidden": false,
      "poweroff.password": "",
      "poweroff.restore_email": "",
      "poweroff.idle.interval": 0,

      "collapsed_message.with_poweroff.display": true,
      "collapsed_message.without_poweroff.display": true,

      "display_themes_message": true,

      "sd.no3d_first": true, // displaying message about no 3d first time

      "sd.global_ids_setuped": false,
      "sd.first_dial_page_open": true,
      "sd.tables_created": false,
      "sd.install_time": null, // miliseconds
      "sd.dont_display_rate_message": false,
      "sd.custom_dial_size": 200,
      "sd.custom_dial_size_fancy": 200,
      "sd.custom_dial_size_setuped": false,

      "sd.enable_dials_search": true,
      "sd.enable_search": true,
      "sd.enable_ondial_search": true,
      "sd.enable_search_preview": true,
        
      "sd.enable_dials_counter": true,

      "sd.synced_after_install": false,

      "sd.display_move_to_nosync_group_dialog": true,
      "sd.display_nosync_group_dialog": true,
      "sd.display_can_turn_off_newtab_popup": true,
      "sd.display_dial_already_exists_dialog": true,
      "sd.display_dial_borders": true,
      "sd.last_opened_settings": "global",

      "sd.display_in_new_tab": true,
        
      "sd.display_dial_remove_dialog": true, // Task #1350

      "sd.display_superfish": false,

      /* styling */

      "sd.display_mirror": true,

      "sd.fancy_init_min_columns": 6,
      "sd.fancy_size_adjusted": false,

      "sd.display_mode": "fancy", // fancy, standard
      "sd.rotate_angle_max": 10,

      "sd.display_quick_menu_and_clicks": true,
      "sd.display_clicks": true,
      "sd.dials_opacity": 100,
      "sd.background_color": "FFFFFF",
      "sd.background_color_enabled": false,
      "sd.background_url": "",
      "sd.background_source": "url",  /* url, theme, local_file */
      "sd.background_url_type": "noimage",
      "sd.background_parallax_depth": 30,

      "sd.text.cell_title.color": "000000",
      "sd.text.cell_title.bolder": false,
      "sd.text.cell_title.size": "12",

      "sd.text.cell_url.color": "888888",
      "sd.text.cell_url.bolder": false,
      "sd.text.cell_url.size": "10",

      "sd.text.list_elem.color": "000000",
      "sd.text.list_elem.bolder": false,
      "sd.text.list_elem.size": "12",

      "sd.text.list_show_url_title.color": "000000",
      "sd.text.list_show_url_title.bolder": false,
      "sd.text.list_show_url_title.size": "12",

      "sd.text.list_link.color": "0551AF",
      "sd.text.list_link.bolder": false,
      "sd.text.list_link.size": "12",

      "sd.text.other.color": "000000",
      "sd.text.other.bolder": false,
      "sd.text.other.size": "12",

      "sd.display_dial_background": true,
      "sd.display_dial_background_color": "dark",

      // Task #1188
      "sd.text.group_bg.color": "6E6E6E",
      "sd.text.group_active_bg.color": "75AD66",
      "sd.text.group_font.color": "FFFFFF",
      "sd.text.group_active_font.color": "FFFFFF",
      "sd.text.group_font.bolder": false,
      "sd.text.group_font.size": "12",
        
      /* sd related */

      "sd.show_urls_under_dials": true,
      "sd.show_icons_and_titles_above_dials": true,
      "sd.display_plus_cells": true,
      "sd.display_popular_group": true,

      /* recentlyclosed related */
      "sd.recentlyclosed_columns": "auto",

      /* Misc */

      "sd.scrolling": "vertical",

      "sd.show_in_context_menu": true,
      "sd.disable_custom_search": false,

        
        
      /* In new tab */
      "sd.preview_creation_delay_default": 1200,

      "sd.main_menu_displayed": true,

      "sd.all_groups_limit_dials": 20,
      "sd.enable_top_sites": true,
      "sd.thumbs_type": "medium",
      "sd.top_sites_columns": "auto",
      "sd.default_group": -1, /* 0 - popular, -1 - last group */
      "sd.last_opened_group": 1,
      "sd.list_view_type": "title",
      "sd.enable_most_visited": true,
      "sd.max_most_visited_records": 30,
      "sd.thumbs_type_most_visited": "list",
      "sd.most_visited_columns": "auto",
      "sd.most_visited_cache_life_time": 3600000,
      "sd.most_visited.group_view_type": "title",
      "sd.enable_recently_closed": true,
      "sd.max_recently_closed_records": 20,
      "sd.most_visited_interval": "month",
      "sd.display_type": "last_selected", // (last_selected, speeddial, mostvisited, recentlyclosed)
      "sd.last_selected_display_type": "speeddial",
      "sd.default_open_in": "current",
      "sd.search_bar_expanded": true,
      "sd.speeddial_expanded": true,
      "sd.mostvisited_expanded": true,
      "sd.recentlyclosed_expanded": true,
      "sd.need_to_offer_parallax": true,
      "sd.light_collapsed_message_show": true,
      "sd.add_group_position_default": "bottom",
      "sd.main_button_action": "sd_in_new_tab",
      "sd.preload_search_items": true,
      "sd.restore_previous_session": true,  
    },

    dump: function( callback ){

      var result = {};
      for( var k in this._defaults ){
        result[k] = this.get(k);
      }

      callback(result);

    },

    toggle: function( name ){
      var newVal = !_b( this.get( name ) );
      this.set( name, newVal );
    },

    defaultValue: function( settingName ){
      if (typeof this._defaults[settingName] != "undefined") {
        return this._defaults[settingName];
      }
      else {
        return null;
      }
    },

    restore: function( settingName ){
      if (typeof this._defaults[settingName] != "undefined") {
        this.set( settingName, this._defaults[settingName] );
      }
      else {

      }
    },

    get: function(name, defaultValue){

      if (typeof defaultValue == "undefined") {
        if (typeof this._defaults[name] != "undefined") {
          defaultValue = this._defaults[name];
        }
        else {
          defaultValue = null;
        }
      }

      var name = this._name(name);
      if (typeof localStorage[name] == "undefined") {
        return defaultValue;
      }

      return localStorage[name];
    },

    sSet: function( name, value ){
      localStorage[this._name(name)] = value;
    },

    set: function(name, value){

      var oldValue = this.get(name);

      var badListeners = [];

      if ( _r(oldValue) != _r(value) ) {
        localStorage[this._name(name)] = value;
        // call change listeners
        Broadcaster.sendMessage({
          action: "pref:changed",
          name: name,
          value: value
        });
      }
    },

    _name: function(name){
      return this._prefsPrefix + name;
    }
  };

  this.Prefs = new Prefs();
}).apply(fvdSpeedDial);

