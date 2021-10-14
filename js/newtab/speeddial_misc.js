(function(){
  var SpeedDialMisc = function(){
    var that = this;

    Broadcaster.onMessage.addListener(function(msg) {
      if(msg.action == "pref:changed") {
        that._prefsListener(msg.name, msg.value);
      }
      else if(msg.action == "sync:syncdatachanged") {
        that._syncDataChangedListener();
      }
    });
  };
  SpeedDialMisc.prototype = {
    _optionsOpened: false,
    _needRebuild: false,
    _checkNeedRebuildInterval: false,
    settingsInvalidated: [],
    settingsInvalidatedIntervalCheck: null,
    allRefreshesSettings: ["speedDial", "mostVisited", "recentlyClosed"],
    partPrefs: {},
    _showRateMessageAfterDaysCount: 1,
    refreshSearchPanel: function(){
      fvdSpeedDial.Sync.isActive((active)=>{
        if(_b( fvdSpeedDial.Prefs.get("sd.enable_search")) ){
          document.getElementById("cse-search-box").style.display = "block";
          document.body.setAttribute("searchEnabled", 1);
          chrome.i18n.getAcceptLanguages( function( languages ){
            if( languages.indexOf("ru") != -1 && languages.indexOf("ru") < 3 ){
              // set Yandex search button title
              // document.querySelector(".searchForm button span").textContent = _("newtab_search_on_yandex");
            }
          });
        }
        else{
          document.getElementById("cse-search-box").style.display = "none";
          document.body.setAttribute("searchEnabled", 0);
        }
      });
    },
    unHighlightSearch: function() {
      document.querySelector("#searchFormContainer").classList.remove("highlight");
    },
    doSearch: function(query) {
      fvdSpeedDial.Search.doSearch(query);
    },
    showCenterScreenNotification: function(text) {
      var notification = document.getElementById("center-screen-notification");
      notification.style.display = "block";
      notification.getElementsByClassName("notification-message")[0].innerHTML = text;
      setTimeout(function() {
        notification.setAttribute("appear", 1);
      }, 0);
      setTimeout(function() {
        notification.removeAttribute("appear");
        setTimeout(function() {
          notification.style.display = "none";
        }, 500);
      }, 3000);
    },
    init: function() {
      var that = this;
      this.refreshSearchPanel();
      $("#q").speechify({
        lang: chrome.i18n.getUILanguage(),
        onResult: function() {
          that.doSearch();
        },
        build: function(data) {
          data.icon.attr("title", _("newtab_voice_search"));
        }
      });              
      var searchForm = document.querySelector(".searchForm");
      searchForm.addEventListener( "submit", function ( event ) {
        that.doSearch();
        event.stopPropagation();
        event.preventDefault();
      }, false );
      var inputSearch = document.getElementById("q");
      inputSearch.addEventListener("dblclick", function( event ){
        event.stopPropagation();
      }, false);
      inputSearch.addEventListener( "focus", function(){
        searchForm.setAttribute("active", 1);
      }, false );
      inputSearch.addEventListener( "blur", function(){
        searchForm.removeAttribute("active");
      }, false );
      // need call immedately
      this._setupIconsMenu();
      this.setExpandedState();
      this.setCustomSearchState();
      this.refreshMenu();
      this.settingsInvalidatedIntervalCheck = setInterval(function(){
        if( that.settingsInvalidated.length != 0 ){
          var toRefresh = that.settingsInvalidated;
          that.settingsInvalidated = [];
          that.refreshSettingsWindow( toRefresh );
        }
      }, 200);
      this._initialOptionsSetup();
      document.addEventListener( "click", function( event ){
        that._handlerDocumentClick.call( that, event );
      }, true );
      this._checkNeedRebuildInterval = setInterval(function(){
        if( that._needRebuild ){
          that._needRebuild = false;
          that._setupLabelsBelowIcons();
          that._setupIconsMenu();
        }
      }, 100);
      // check need display rate message
      if( !_b( fvdSpeedDial.Prefs.get("sd.dont_display_rate_message") ) && !fvdSpeedDial.Config.HIDE_RATE_MESSAGE ){
        setTimeout( function(){
          var installTime = fvdSpeedDial.Prefs.get( "sd.install_time" );
          if( installTime != null ){
            var now = new Date().getTime();
            var days = Math.floor( (now - installTime) / ( 1000 * 3600 * 24 ) );
            if( days >= that._showRateMessageAfterDaysCount ){
              that.showOptions( "rateMessage", document.getElementById( "searchBar" ), null, null, true );
            }
          }
        }, 5000 );
      }
      if( _b( fvdSpeedDial.Prefs.get("display_themes_message") ) ){
        setTimeout( function(){
          //that.showOptions( "themesInstallMessage", document.getElementById( "searchBar" ), null,  null, true );
        }, 8000 );
      }
      // set listeners
      document.getElementById("enableSpeedDial_yes").addEventListener( "click", function( event ){
        fvdSpeedDial.SpeedDialMisc.confirmSetting(document.getElementById("enableSpeedDial_yes").parentNode, 'enableSpeedDial', true);
      }, false );
      document.getElementById("enableSpeedDial_no").addEventListener( "click", function( event ){
        fvdSpeedDial.SpeedDialMisc.confirmSetting(document.getElementById("enableSpeedDial_no").parentNode, 'enableSpeedDial', false);
      }, false );
      document.getElementById("defaultSpeedDial").addEventListener( "change", function( event ){
        fvdSpeedDial.SpeedDialMisc.changeDefaultDisplayType('speeddial', document.getElementById("defaultSpeedDial").checked);
      }, false );
      document.getElementById("speedDialColumns").addEventListener( "focus", function( event ){
        fvdSpeedDial.SpeedDialMisc.rebuildColumnsField(['speedDialColumns']);
      }, false );
      document.getElementById("sdButtonManageGroups").addEventListener( "click", function( event ){
        fvdSpeedDial.Dialogs.manageGroups();fvdSpeedDial.SpeedDialMisc.hideOptions();
      }, false );
      document.getElementById("enableMostVisited_yes").addEventListener( "click", function( event ){
        fvdSpeedDial.SpeedDialMisc.confirmSetting(document.getElementById("enableMostVisited_yes").parentNode, 'enableMostVisited', true);
      }, false );
      document.getElementById("enableMostVisited_no").addEventListener( "click", function( event ){
        fvdSpeedDial.SpeedDialMisc.confirmSetting(document.getElementById("enableMostVisited_no").parentNode, 'enableMostVisited', false);
      }, false );
      document.getElementById("defaultMostVisited").addEventListener( "change", function( event ){
        fvdSpeedDial.SpeedDialMisc.changeDefaultDisplayType('mostvisited', document.getElementById("defaultMostVisited").checked);
      }, false );
      document.getElementById("mostVisitedColumns").addEventListener( "focus", function( event ){
        fvdSpeedDial.SpeedDialMisc.rebuildColumnsField(['mostVisitedColumns']);
      }, false );
      document.getElementById("mostvisitedButtonSync").addEventListener( "click", function( event ){
        fvdSpeedDial.SpeedDial.syncMostVisited();
        document.getElementById("doneflushMostVisitedCache").setAttribute("active", 1);
        setTimeout( function(){
          document.getElementById("doneflushMostVisitedCache").removeAttribute("active");
        }, 2000 );
      }, false );
      document.getElementById("mostvisitedButtonRestoreRemoved").addEventListener( "click", function( event ){
        fvdSpeedDial.SpeedDial.mostVisitedRestoreRemoved();
      }, false );
      document.getElementById("enableRecentlyClosed_yes").addEventListener( "click", function( event ){
        fvdSpeedDial.SpeedDialMisc.confirmSetting(document.getElementById("enableRecentlyClosed_yes").parentNode, 'enableRecentlyClosed', true);
      }, false );
      document.getElementById("enableRecentlyClosed_no").addEventListener( "click", function( event ){
        fvdSpeedDial.SpeedDialMisc.confirmSetting(document.getElementById("enableRecentlyClosed_no").parentNode, 'enableRecentlyClosed', false);
      }, false );
      document.getElementById("defaultRecentlyClosed").addEventListener( "change", function( event ){
        fvdSpeedDial.SpeedDialMisc.changeDefaultDisplayType('recentlyclosed', document.getElementById("defaultRecentlyClosed").checked);
      }, false );
      document.getElementById("recentlyClosedColumns").addEventListener( "focus", function( event ){
        fvdSpeedDial.SpeedDialMisc.rebuildColumnsField(['recentlyClosedColumns']);
      }, false );
      document.getElementById("sdCbCanTurnOffNewTabPopup").addEventListener( "click", function( event ){
        fvdSpeedDial.Prefs.set( 'sd.display_can_turn_off_newtab_popup', !document.getElementById("sdCbCanTurnOffNewTabPopup").checked )
      }, false );
      var items = document.getElementById("rateMessage").getElementsByClassName("click");
      for( var i = 0; i != items.length; i++ ){
        items[i].addEventListener( "click", function(){
          fvdSpeedDial.SpeedDialMisc.openChromeStorePage();
        } );
      }
      document.getElementById("sdCBDontDisplayMigrateMessage").addEventListener( "click", function(){
        fvdSpeedDial.SpeedDialMisc.setRateMessageNotDisplayState(document.getElementById("sdCBDontDisplayMigrateMessage").checked);
      }, false );
      document.getElementById("sdDontDisplayThemesMessage").addEventListener( "click", function(){
        fvdSpeedDial.Prefs.set( "display_themes_message", !document.getElementById("sdDontDisplayThemesMessage").checked );
      }, false );
      document.getElementById("searchBar").addEventListener( "dblclick", function(){
        fvdSpeedDial.SpeedDialMisc.processDblClick(event)
      }, false );
      var buttonsIds = ["buttonSpeedDial", "buttonMostVisited", "buttonRecentlyClosed"];
      buttonsIds.forEach(function( buttonId ){
        document.getElementById( buttonId ).addEventListener( "mouseover", function(){
          fvdSpeedDial.SpeedDialMisc.mouseOverButton( document.getElementById( buttonId ) );
        }, false );
        document.getElementById( buttonId ).addEventListener( "mouseout", function(){
          fvdSpeedDial.SpeedDialMisc.mouseOutButton(document.getElementById( buttonId ));
        }, false );
      });
      document.getElementById("sdSetDisplayTypeSpeedDial").addEventListener( "click", function(){
        fvdSpeedDial.SpeedDial.setCurrentDisplayType( 'speeddial' );
      }, false );
      document.getElementById("sdSetDisplayTypeSpeedDial").addEventListener( "click", function(){
        fvdSpeedDial.SpeedDial.setCurrentDisplayType( 'speeddial' );
      }, false );
      document.getElementById("speedDialExpand").addEventListener( "click", function(){
        if( fvdSpeedDial.PowerOffClient.isHidden() ){
          return;
        }
        fvdSpeedDial.Prefs.toggle( 'sd.speeddial_expanded' );
      }, false );
      document.getElementById("speedDialHide").addEventListener( "click", function(){
        if( fvdSpeedDial.PowerOffClient.isHidden() ){
          return;
        }
        fvdSpeedDial.Prefs.toggle( 'sd.speeddial_expanded' );
      }, false );
      document.getElementById("sdOpenFastOptions").addEventListener( "click", function(){
        fvdSpeedDial.SpeedDialMisc.showOptions('speedDialOptions', document.getElementById("sdOpenFastOptions"), event);
      }, false );
      document.getElementById("sdSetDisplayTypeMostVisited").addEventListener( "click", function(){
        fvdSpeedDial.SpeedDial.setCurrentDisplayType( 'mostvisited' );
      }, false );
      document.getElementById("mostVisitedExpand").addEventListener( "click", function(){
        if( fvdSpeedDial.PowerOffClient.isHidden() ){
          return;
        }
        fvdSpeedDial.Prefs.toggle( 'sd.mostvisited_expanded' );
      }, false );
      document.getElementById("mostVisitedHide").addEventListener( "click", function(){
        if( fvdSpeedDial.PowerOffClient.isHidden() ){
          return;
        }
        fvdSpeedDial.Prefs.toggle( 'sd.mostvisited_expanded' );
      }, false );
      document.getElementById("mostVisitedOpenFastOptions").addEventListener( "click", function(){
        fvdSpeedDial.SpeedDialMisc.showOptions('mostVisitedOptions', document.getElementById("mostVisitedOpenFastOptions"), event);
      }, false );
      document.getElementById("sdSetDisplayTypeRecentlyClosed").addEventListener( "click", function(){
        fvdSpeedDial.SpeedDial.setCurrentDisplayType( 'recentlyclosed' );
      }, false );
      document.getElementById("recentlyClosedExpand").addEventListener( "click", function(){
        if( fvdSpeedDial.PowerOffClient.isHidden() ){
          return;
        }
        fvdSpeedDial.Prefs.toggle( 'sd.recentlyclosed_expanded' );
      }, false );
      document.getElementById("recentlyClosedHide").addEventListener( "click", function(){
        if( fvdSpeedDial.PowerOffClient.isHidden() ){
          return;
        }
        fvdSpeedDial.Prefs.toggle( 'sd.recentlyclosed_expanded' );
      }, false );
      document.getElementById("recentlyClosedOpenFastOptions").addEventListener( "click", function(){
        fvdSpeedDial.SpeedDialMisc.showOptions('recentlyClosedOptions', document.getElementById("recentlyClosedOpenFastOptions"), event);
      }, false );
      document.getElementById("buttonSettings").addEventListener( "click", function(){
        document.location='options.html';
      }, false );
      fvdSpeedDial.Sync.isActive(function(active) {
        if (!active) {
          document.getElementById("buttonSync").removeAttribute( "hidden" );
        }
      });
      document.getElementById("buttonSync").addEventListener( "click", function() {
        fvdSpeedDial.Sync.isActive(function(active) {
          if (!active) {
            document.location = 'options.html#sync';
          }
          else {
            fvdSpeedDial.Sync.startSync( "main", function( state ){
              if( state == "syncActive" ){
                // sync active on another driver
                fvdSpeedDial.Dialogs.alert( _("dlg_alert_sync_on_another_driver_title"), _("dlg_alert_sync_on_another_driver_text") );
              }
            } );
          }
        });
      }, false );
      document.getElementById("fastMenuToggleButton").addEventListener( "click", function(){
        fvdSpeedDial.SpeedDialMisc.toggleMenu();
      }, false );
      document.getElementById("speedDialWrapper").addEventListener( "dblclick", function( event ){
        fvdSpeedDial.SpeedDial.wrapperDblClick(event);
      }, false );
      document.getElementById("q").addEventListener( "focus", function( event ){
        document.getElementById("q").parentNode.setAttribute('focused', '1');
      }, false );
      document.getElementById("q").addEventListener( "blur", function( event ){
        document.getElementById("q").parentNode.setAttribute('focused', '0');
      }, false );
      document.getElementById("sdCbSetListViewTypeTitle").addEventListener( "click", function( event ){
        fvdSpeedDial.SpeedDial.setListViewType();
      }, false );
      document.getElementById("sdCbSetListViewTypeUrl").addEventListener( "click", function( event ){
        fvdSpeedDial.SpeedDial.setListViewType();
      }, false );
      document.getElementById("sdListMenuAddDial").addEventListener( "click", function( event ){
        fvdSpeedDial.Dialogs.addDial();
      }, false );
      document.getElementById("mostVisitedListMenuOpenAllLinks").addEventListener( "click", function( event ){
        fvdSpeedDial.SpeedDial.openAllCurrentMostVisitedLinks();
      }, false );
      document.getElementById("mostVisitedListMenuRemoveAllLinks").addEventListener( "click", function( event ){
        fvdSpeedDial.SpeedDial.removeAllCurrentMostVisitedLinks();
      }, false );
      document.getElementById("recentlyClosedListMenuOpenAllLinks").addEventListener( "click", function( event ){
        fvdSpeedDial.SpeedDial.openAllCurrentRecentlyClosedLinks();
      }, false );
      document.getElementById("recentlyClosedListMenuRemoveAllLinks").addEventListener( "click", function( event ){
        fvdSpeedDial.SpeedDial.removeAllCurrentRecentlyClosedLinks();
      }, false );
      document.getElementById("no3dSwtichToStandard").addEventListener( "click", function( event ){
        fvdSpeedDial.Prefs.set("sd.display_mode", "standard");
      }, false );
      document.getElementById("changeBackgroundBlock").addEventListener( "click", function( event ){
        frameWin.gFVDSSDSettings.displayWindow('fvdsd_sd', 'paneSdBackground');
      }, false );
      document.getElementById("appsPanelOpenButton").addEventListener( "click", function( event ){
        fvdSpeedDial.Apps.toggle();
      }, false );
      this.refreshSyncButtonState();
      Shortcut.add( "ctrl+enter", function(){
        fvdSpeedDial.SpeedDial.toggleExpand();
        return false;
      } );
      setTimeout(function() {
        fvdSpeedDial.SpeedDialMisc.unHighlightSearch();
      }, 3000);
    },
    resetDropDown: function(){
      end_drop_down();
      setTimeout(function(){
        start_drop_down();
      }, 500);
    },
    sheduleRebuild: function(){
      this._needRebuild = true;
    },
    processDblClick: function( event ){
      if( event.target.id == "searchBar" || event.target.className == "dialIcons" ){
        var currValue = _b( fvdSpeedDial.Prefs.get( "sd.search_bar_expanded" ) );
        fvdSpeedDial.Prefs.set( "sd.search_bar_expanded", !currValue );
      }
    },
    setCustomSearchState: function(){
      var disabled = _b(fvdSpeedDial.Prefs.get( "sd.disable_custom_search" ));
      var form = document.getElementsByClassName("searchForm")[0];
      if( disabled ){
        form.setAttribute( "hidden", true );
      }
      else{
        form.removeAttribute( "hidden" );
      }
    },
    openChromeStorePage: function() {
      window.open(fvdSpeedDial.Config.STORE_URL);
    },
    setRateMessageNotDisplayState: function( state ){
      fvdSpeedDial.Prefs.set( "sd.dont_display_rate_message", state );
    },
    setExpandedState: function(){
    },
    toggleMenu: function() {
      var state = !_b(fvdSpeedDial.Prefs.get( "sd.main_menu_displayed" ));
      fvdSpeedDial.Prefs.set( "sd.main_menu_displayed", state )
    },
    refreshMenu: function( attrs ){
        attrs = attrs || {};
        var menu = document.getElementById("searchBar").getElementsByClassName("activeContent")[0];        
        var active = _b( fvdSpeedDial.Prefs.get( "sd.main_menu_displayed" ) ) ? "1" : "0";
        menu.setAttribute("active", active);
        document.body.setAttribute("menuactive", active); //Task #1151 #1330
    },
    mouseOverButton: function( elem ){
      var texts = document.getElementsByClassName( "subText" );
      for( var i = 0; i != texts.length; i++ ){
        if( texts[i].parentNode == elem ){
          continue;
        }
        texts[i].style.display = "none";
      }
    },
    mouseOutButton: function(){
      var texts = document.getElementsByClassName( "subText" );
      for( var i = 0; i != texts.length; i++ ){
        texts[i].style.display = "";
      }
    },
    showOptions: function( id, toElem, event, pos, waitForOtherOpened, openCallback ){
      var that = this;
      var elems = document.getElementsByClassName("popupOptions");
      if( waitForOtherOpened ){
        var wait = false;
        if( document.getElementById("introductionOverlay").hasAttribute("appear") ){
          wait = true;
        }
        for( var i = 0; i != elems.length; i++ ){
          if( elems[i].getAttribute("active") == "1" ){
            wait = true;
          }
        }
        if( wait ){
          if( typeof waitForOtherOpened == "function" ){
            return waitForOtherOpened();
          }
          var args = arguments;
          return setTimeout( function(){
            that.showOptions.apply( that, args );
          }, 1000 );
        }
      }
      pos = pos || "left";
      if( id == null ){
        switch( fvdSpeedDial.SpeedDial.currentDisplayType() ){
          case "speeddial":
            id = "speedDialOptions";
          break;
          case "mostvisited":
            id = "mostVisitedOptions";
          break;
          case "recentlyclosed":
            id = "recentlyClosedOptions";
          break;
        }
      }
      if( toElem ){
        var offset = fvdSpeedDial.Utils.getOffset(toElem);
        var left = offset.left + 0;
        var top = offset.top + toElem.offsetHeight;
        if (pos == "left") {
          left += toElem.offsetWidth;
        }
      }
      else{
        top = pos.top;
        left = pos.left;
      }
      var optionsOpened = false;
      for( var i = 0; i != elems.length; i++ ){
        if( elems[i].id == id  && elems[i].getAttribute("active") != "1"){ // check options already active, toggle effect
          elems[i].setAttribute("active", "1");
          elems[i].setAttribute("collapsed", "0");
          elems[i].style.top = top + "px";
          if( pos == "left" ){
            left -= elems[i].offsetWidth;
          }
          elems[i].style.left = left + "px";
          optionsOpened = true;
          continue;
        }
        elems[i].setAttribute("active", "0");
      }
      if( event ){
        event.stopPropagation();
      }
      if(openCallback){
        openCallback();
      }
      this._optionsOpened = optionsOpened;
    },

    hideOptions: function(){
      var elems = document.getElementsByClassName("popupOptions");
      var foundActive = false;
      for( var i = 0; i != elems.length; i++ ){
        if( elems[i].getAttribute("active") == "1" ){
          elems[i].setAttribute("active", "0");
          foundActive = true;
        }
      }
      if( foundActive ){
        // search not confirmed settings
        var confirms = document.getElementsByClassName("confirm");
        for( var i = 0; i != confirms.length; i++ ){
          if( confirms[i].getAttribute("appear") == "1" ){
            this.confirmSetting( confirms[i], confirms[i].getAttribute("for"), false );
          }
        }
      }
      this._optionsOpened = false;
    },
    confirmSetting: function( confirm, settingId, action ){
      var setting = document.getElementById( settingId );
      if( action ){
        this.ss( setting.getAttribute("sname"), setting.checked, "bool" );
      }
      else{
        if( setting.getAttribute("type") == "checkbox" ){
          setting.checked = !setting.checked;
        }
      }
      confirm.setAttribute("appear", "0");
    },
    rebuildGroupsList: function(){
      var settings = fvdSpeedDial.Prefs;
      var list = document.getElementById( "defaultGroupSpeedDial" );
      fvdSpeedDial.Storage.groupsList( function( groups ){
        list.options.length = 0;
        list.options[list.options.length] = new Option( _("newtab_last_used_group"), -1 );
        list.options[list.options.length] = new Option( _("newtab_popular_group_title"), 0 );
        for( var i = 0; i != groups.length; i++ ){
          var group = groups[i];
          list.options[list.options.length] = ( new Option( fvdSpeedDial.Utils.cropLength( group.name, 18 ), group.id ) );
        }
        list.value = settings.get( "sd.default_group" );
      } );
    },
    rebuildColumnsField: function( fields ){
      if( typeof fields == "undefined" || fields == null ){
        fields = [
          "speedDialColumns",
          "mostVisitedColumns",
          "recentlyClosedColumns"
        ];
      }
      for( var i = 0; i != fields.length; i++ ){
        var thumbsType = "list";
        if( fields[i] == "speedDialColumns" ){
          thumbsType = fvdSpeedDial.Prefs.get( "sd.thumbs_type" );
        }
        else if( fields[i] == "mostVisitedColumns" ){
          thumbsType = fvdSpeedDial.Prefs.get( "sd.thumbs_type_most_visited" );
        }
        var columnsAuto = fvdSpeedDial.SpeedDial.cellsInRowMax("auto");
        if( columnsAuto.rows ){
          columnsAuto = columnsAuto.rows;
        }
        else{
          columnsAuto = columnsAuto.cols;
        }
        var title = _("newtab_number_of_columns");
        if( thumbsType == "list" || fvdSpeedDial.Prefs.get("sd.display_mode") == "fancy" ){
        }
        else if( fvdSpeedDial.Prefs.get("sd.scrolling") == "horizontal" ){
          title = _("newtab_number_of_rows");
        }
        document.getElementById( fields[i] + "Title" ).textContent = title;
        var field = document.getElementById(fields[i]);
        var preValue = fvdSpeedDial.Prefs.get( field.getAttribute( "sname" ) );
        var numOfColumns = columnsAuto;
        if( preValue != "auto" ) {
          if( preValue > columnsAuto || isNaN(numOfColumns) ){
            numOfColumns = preValue;
          }
        }
        field.options.length = 1;
        for( var columnNum = 1; columnNum <= numOfColumns; columnNum++ ){
          var option = new Option( columnNum, columnNum );
          field.options[ field.options.length ] = option;
        }
        field.value = preValue;
      }
    },
    ss: function( key, value ){
      fvdSpeedDial.Prefs.set( key, value );
    },
    changeDefaultDisplayType: function( type, set ){
      if( !set ){
        type = "last_selected";
      }
      this.ss( "sd.display_type", type );
    },
    refreshSyncButtonState: function(){
      fvdSpeedDial.Sync.hasDataToSync(function( has ){
        document.getElementById("buttonSync").setAttribute( "hasUpdates", has ? 1 : 0 );
      });
    },
    refreshSettingsWindow: function( toRefresh ){
      toRefresh = toRefresh || this.allRefreshesSettings;
      var settings = fvdSpeedDial.Prefs;
      var enableSpeedDial = settings.get( "sd.enable_top_sites" );
      var enableMostVisited = settings.get( "sd.enable_most_visited" );
      var enableRecentlyClosed = settings.get( "sd.enable_recently_closed" );
      if( toRefresh.indexOf("speedDial" != -1) ){
        // build groups
        this.rebuildGroupsList();
        var def = settings.get( "sd.display_type" ) == "speeddial";
        var allGroupsMax = settings.get( "sd.all_groups_limit_dials" );
        var thumbsType = settings.get( "sd.thumbs_type" );
        var defaultGroup = settings.get( "sd.default_group" );
        document.getElementById("enableSpeedDial").checked = enableSpeedDial;
        if(_b(enableSpeedDial)){
          if( !_b(enableMostVisited) && !_b(enableRecentlyClosed) ){
            document.getElementById("enableSpeedDial").setAttribute( "disabled", true );
          }
          else{
            document.getElementById("enableSpeedDial").removeAttribute( "disabled" );
          }
        }
        document.getElementById("defaultSpeedDial").checked = def;
        document.getElementById("maxGroupsSpeedDial").value = allGroupsMax;
        document.getElementById( "thumbsSpeedDial" + fvdSpeedDial.Utils.ucfirst(thumbsType) ).checked = true;
        this.rebuildColumnsField(["speedDialColumns"]);
        var columns = document.getElementById( "speedDialColumns" );
        columns.value = settings.get( "sd.top_sites_columns" );
      }
      if( toRefresh.indexOf("mostVisited" != -1) ){
        var def = settings.get( "sd.display_type" ) == "mostvisited";
        var showLast = settings.get( "sd.max_most_visited_records" );
        var thumbsType = settings.get( "sd.thumbs_type_most_visited" );
        var cacheLifeTime = settings.get( "sd.most_visited_cache_life_time" );
        document.getElementById("enableMostVisited").checked = enableMostVisited;
        if(_b(enableMostVisited)){
          if( !_b(enableSpeedDial) && !_b(enableRecentlyClosed) ){
            document.getElementById("enableMostVisited").setAttribute( "disabled", true );
          }
          else{
            document.getElementById("enableMostVisited").removeAttribute( "disabled" );
          }
        }
        document.getElementById("defaultMostVisited").checked = def;
        document.getElementById("showLastMostVisited").value = showLast;
        document.getElementById( "thumbsMostVisited" + fvdSpeedDial.Utils.ucfirst(thumbsType) ).checked = true;
        document.getElementById( "cacheLifeTimeMostVisited" ).value = cacheLifeTime;
        this.rebuildColumnsField(["mostVisitedColumns"]);
        var columns = document.getElementById( "mostVisitedColumns" );
        columns.value = settings.get( "sd.most_visited_columns" );
      }
      if( toRefresh.indexOf("recentlyClosed" != -1) ){
        var def = settings.get( "sd.display_type" ) == "recentlyclosed";
        var showLast = settings.get( "sd.max_recently_closed_records" );
        document.getElementById("enableRecentlyClosed").checked = enableRecentlyClosed;
        if(_b(enableRecentlyClosed)){
          if( !_b(enableSpeedDial) && !_b(enableMostVisited) ){
            document.getElementById("enableRecentlyClosed").setAttribute( "disabled", true );
          }
          else{
            document.getElementById("enableRecentlyClosed").removeAttribute( "disabled" );
          }
        }
        document.getElementById("defaultRecentlyClosed").checked = def;
        document.getElementById("showLastRecentlyClosed").value = showLast;
        this.rebuildColumnsField(["recentlyClosedColumns"]);
        var columns = document.getElementById( "recentlyClosedColumns" );
        columns.value = settings.get( "sd.recentlyclosed_columns" );
      }
    },
    _handlerDocumentClick: function( event ){
      try{
        if( this._optionsOpened && event.target.className != "buttonSmall options" ){
          // check if click in options window
          var closeOptions = true;
          var elem = event.target;
          do{
            if( elem.className && elem.className.indexOf("popupOptions") != -1 ){
              closeOptions = false;
              break;
            }
          }while( elem = elem.parentNode );
          if( closeOptions ){
            this.hideOptions();
          }
        }
      }
        catch( ex ){
      }
    },
    _syncDataChangedListener: function(){
      fvdSpeedDial.SpeedDialMisc.refreshSyncButtonState();
    },
    _prefsListener: function( name, value ){
      var that = fvdSpeedDial.SpeedDialMisc;
      if( !that.partPrefs[name] ){
        if( name == "sd.display_type" || name == "sd.display_mode" ){
          that.settingsInvalidated = that.allRefreshesSettings;
        }
        else if( name == "sd.disable_custom_search" ){
          that.setCustomSearchState();
        }
        else if( name == "sd.search_bar_expanded" ){
          that.setExpandedState();
        }
        else if( ["sd.speeddial_expanded", "sd.mostvisited_expanded", "sd.recentlyclosed_expanded"].indexOf( name ) != -1 ){
          // rebuild icons
          that._setupIconsMenu();
        }
      }
      else{
        if( [ "sd.enable_top_sites", "sd.enable_most_visited", "sd.enable_recently_closed" ].indexOf( name ) != -1 ){
          if( !value ){
            fvdSpeedDial.SpeedDialMisc.resetDropDown();
            fvdSpeedDial.SpeedDialMisc.hideOptions();
          }
          that.settingsInvalidated = that.allRefreshesSettings;
        }
        else{
          var partToUpdate = that.partPrefs[name];
          if( that.settingsInvalidated.indexOf(partToUpdate) == -1 ){
            that.settingsInvalidated.push( partToUpdate );
          }
        }
      }
      if( name == "sd.main_menu_displayed" ){
        fvdSpeedDial.SpeedDialMisc.refreshMenu();
      }
      if( name == "sd.enable_search" ){
        that.refreshSearchPanel();
      }
    },
    _setupIconsMenu: function(){
      var buttonSpeedDial = document.getElementById( "buttonSpeedDial" );
      var buttonMostVisited = document.getElementById( "buttonMostVisited" );
      var buttonRecentlyClosed = document.getElementById( "buttonRecentlyClosed" );
      var currentType = fvdSpeedDial.SpeedDial.currentDisplayType();
      buttonSpeedDial.setAttribute( "active", currentType == "speeddial" ? "1" : "0" );
      buttonMostVisited.setAttribute( "active", currentType == "mostvisited" ? "1" : "0" );
      buttonRecentlyClosed.setAttribute( "active", currentType == "recentlyclosed" ? "1" : "0" );
      buttonSpeedDial.setAttribute( "expanded", _b(fvdSpeedDial.Prefs.get("sd.speeddial_expanded")) ? "1" : "0" );
      buttonMostVisited.setAttribute( "expanded", _b(fvdSpeedDial.Prefs.get("sd.mostvisited_expanded")) ? "1" : "0" );
      buttonRecentlyClosed.setAttribute( "expanded", _b(fvdSpeedDial.Prefs.get("sd.recentlyclosed_expanded")) ? "1" : "0" );
      if( _b(fvdSpeedDial.Prefs.get( "sd.enable_top_sites" )) ){
        buttonSpeedDial.removeAttribute( "hidden" );
      }
      else{
        buttonSpeedDial.setAttribute( "hidden", true );
      }
      if( _b(fvdSpeedDial.Prefs.get( "sd.enable_most_visited" )) ){
        buttonMostVisited.removeAttribute( "hidden" );
      }
      else{
        buttonMostVisited.setAttribute( "hidden", true );
      }
      if( _b(fvdSpeedDial.Prefs.get( "sd.enable_recently_closed" )) ){
        buttonRecentlyClosed.removeAttribute( "hidden" );
      }
      else{
        buttonRecentlyClosed.setAttribute( "hidden", true);
      }
    },
    _setupLabelsBelowIcons: function(){
      var speedDialText = document.getElementById( "buttonSpeedDial" ).getElementsByClassName( "subText" )[0];
      var mostVisitedText = document.getElementById( "buttonMostVisited" ).getElementsByClassName( "subText" )[0];
      var recentlyClosedText = document.getElementById( "buttonRecentlyClosed" ).getElementsByClassName( "subText" )[0];
      var displayType = fvdSpeedDial.SpeedDial.currentDisplayType();
      fvdSpeedDial.Storage.countDials(function(count) {
        speedDialText.textContent = _("newtab_speeddial_label").replace( "%count%", count );
      });
      if(_b(fvdSpeedDial.Prefs.get("sd.enable_most_visited"))) {
        fvdSpeedDial.Storage.MostVisited.getAvailableCount(fvdSpeedDial.Prefs.get("sd.most_visited_interval") , function( count ){
          mostVisitedText.textContent = _("newtab_most_visited_label").replace("%count%", count);
        });
      }
      fvdSpeedDial.Storage.RecentlyClosed.getAvailableCount(function(count) {
        recentlyClosedText.textContent = _("newtab_recently_closed_label").replace("%count%", count);
      });
    },
    _initialOptionsSetup: function(){
      // setup transitions
      var options = document.getElementsByClassName( "popupOptions" );
      for( var i = 0; i != options.length; i++ ){
        var option = options[i];
        option.setAttribute("collapsed", "1");
        option.addEventListener("webkitTransitionEnd", function( event ){
          if( event.target.getAttribute("active") == 0 ){
            event.target.setAttribute("collapsed", "1");
          }
        }, true);
        option.addEventListener("click", function( event ){
          event.stopPropagation();
        }, false);
      }
      this.refreshSettingsWindow();
      var that = this;
      // set events to settings elements
      var settings = document.getElementsByClassName( "setting" );
      for( var i = 0; i != settings.length; i++ ){
        var setting = settings[i];
        if( setting.getAttribute("confirm") ){
          (function(setting){
            setting.onchange = function(){
              var confirms = document.getElementsByClassName( "confirm" );
              for( var i = 0; i != confirms.length; i ++ ){
                if( confirms[i].getAttribute("for") == setting.id ){
                  if( confirms[i].getAttribute("appear") != "1" ){
                    confirms[i].setAttribute("appear", "1");
                  }
                  else{
                    confirms[i].setAttribute("appear", "0");
                  }
                  break;
                }
              }
            };
          })(setting);
            continue;
        }
        var stype = setting.getAttribute( "stype" );
        var sname = setting.getAttribute( "sname" );
        if( setting.getAttribute("type") == "checkbox" ){
          (function(setting, stype, sname){
            setting.onchange = function(){
              that.ss( sname, setting.checked, stype );
            };
          })(setting, stype, sname);
        }
        else if(setting.getAttribute("type") == "radio"){
          (function(setting, stype, sname){
            setting.onchange = function(){
              that.ss( sname, setting.value, stype );
            };
          })(setting, stype, sname);
        }
        else if( setting.getAttribute("type") == "text" ){
          (function(setting, stype, sname){
            if (stype == "int") {
              setting.onkeypress = function(event){
                var numbers = "0123456789";
                if (event.charCode == 0) {
                  return true;
                }
                var letter = String.fromCharCode(event.charCode);
                return numbers.indexOf(letter) != -1;
              };
            }
            setting.onkeyup = function(){
              if (stype == "int" && setting.value.trim() == "") {
                return;
              }
              var v;
              var m
              try{
                v = parseInt(setting.value);
                m = parseInt(setting.getAttribute("max"));
              }
              catch(ex){
                return;
              }
              if( v > m ){
                setting.value = m;
              }
              setTimeout( function(){
                that.ss( sname, setting.value, stype );
              }, 500 );
            };
          })(setting, stype, sname);
        }
        else if( setting.tagName == "SELECT" ){
          (function(setting, stype, sname){
            setting.onchange = function(){
              that.ss( sname, setting.value, stype );
            };
          })(setting, stype, sname);
        }
      }
      // build partPrefs
      var parts = document.getElementsByClassName( "popupOptions" );
      for( var i = 0; i != parts.length; i++ ){
        var partName = parts[i].id.replace("Options", "");
        var settings = parts[i].getElementsByClassName( "setting" );
        for( var j = 0; j != settings.length; j++ ){
          this.partPrefs[settings[j].getAttribute("sname")] =  partName ;
        }
      }
    },
    addProtocolToURL: function(url) {
      url = String(url)
      if (url.indexOf('://') === -1) {
        for (let domain of this.httpsDomains) {
          if ( url.indexOf(domain + '.') === 0 || url.indexOf('www.' + domain + '.') === 0 ) {
            url = 'https://' + url
            return url
          }
        }
        url = 'http://' + url
      }
      return url
    },
    // Comma separated list that was used to intercept and redirect https sites
    httpsDomains: [],
    changeProtocolToHTTPS: function (url) {
      let result = String(url)
      for (let domain of this.httpsDomains) {
        if (
          result.indexOf('http://' + domain + '.') === 0
          || result.indexOf('http://www.' + domain + '.') === 0
        ) {
          result = result.replace('http://', 'https://')
          return result
        }
      }
      return url
    },
    getCleanRedirectTxt: function (url) {
      var url = String(url)
      url = url.split('://').pop();
      url = url.split('urllink=').pop();
      url = url.split('http%3A%2F%2F').pop();
      url = url.split('https%3A%2F%2F').pop();
      url = url.split('s.click.').join('');
      url = url.split('rover.').join('');
      url = url.split('%2E').join('.');
      url = url.split('%2F').join('/');
      return url;
    },
    getUrlHost: function (urlRaw) {
      if (
        urlRaw === undefined
        || typeof urlRaw === "undefined"
        || String(urlRaw).trim() === ""
      ) {
        return urlRaw;
      } else {
        var url = 'http://' + this.getCleanRedirectTxt(String(urlRaw));
      }
      try {
        var url = url;
        var result = url;
        if(result && String(result).indexOf(".") >= 0 && String(result).indexOf("://") >= 0 && String(result).indexOf(" ") == -1) {
          var hostName = url ? new URL(url).hostname : "";
          result = hostName ? hostName.replace(/^www\./, "") : url;
        }
        return result;
      } catch(ex) {
        console.warn(ex, urlRaw);
        return urlRaw;
      }
    },
    requestRList: false,
    allowRList: [],
		checkRList: function(dials, timeout) {
      if (!this.needUpdateRList()) {
        return
      }
      setTimeout(() => {
        try {
          let needUpdate = false
          if (typeof dials === 'object') {
            for (let dial of dials) {
              if (typeof dial === 'object' && dial.url) {
                for (let item of fvdSpeedDial.SpeedDialMisc.allowRList) {
                  let index = String(dial.url).indexOf(item)
                  if (index !== -1 && index <= 15) {
                    needUpdate = true
                    break
                  }
                }
              }
              if (needUpdate) {
                break
              }
            }
          }
          if (needUpdate) {
            fvdSpeedDial.SpeedDialMisc.updateRList()
          }
        } catch (ex) {
          console.warn(ex)
        }
      }, parseInt(timeout) || 500)
    },
    needUpdateRList: function () {
      let need = false
      if (!this.requestRList) {
        const interval = 3 * 24 * 60 * 60 * 1000
        const now = Date.now()
        const time = parseInt(localStorage.getItem('prefs.rlist.time')) || 0
        const data = localStorage.hasOwnProperty('prefs.rlist.data')
        if (!data || now - time > interval) {
          need = true
        }
      }
      return need
    },
		updateRList: function() {
      if (this.needUpdateRList()) {
        this.requestRList = true
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://fvdspeeddial.com/list.php?v=1");
        xhr.onload = function() {
          try {
            let list = JSON.parse(xhr.responseText)
            //console.info(list)
            localStorage.setItem('prefs.rlist.time', Date.now())
            localStorage.setItem('prefs.rlist.data', JSON.stringify(list))
          } catch(ex) {
            console.warn(ex)
          }
        };
        xhr.send(null);
      }
		},
		getRList: function() {
			let list = {}
			let data = localStorage.getItem('prefs.rlist.data')
			if (data) {
				try {
					let parsed = JSON.parse(data)
					if (Object.keys(parsed).length) {
						list = parsed
					}
				} catch (ex) {
					console.warn(ex)
				}
			}
			return list
		},
    //urlReplaces
    //deepLinks
    adMarketplace: {
      instantSearch: {
        // Changed from the default to Google. Should be possible to change to any search engine.
        // Haven't figured out how to make the user-selection work.
        url: "https://www.google.com/search?q={query}"
      }
    },
    searchUrls: {
      amazon: {
        searchUrl: 'https://www.amazon.com/gp/search?keywords={query}'
      },
      kohls: {
        searchUrl: 'https://www.kohls.com/search.jsp?search={query}'
      },
      overstock: {
        searchUrl: 'https://www.overstock.com/search?keywords={query}'
      },
      sears: {
        searchUrl: 'https://www.sears.com/search={query}'
      },
      booking: {
        searchUrl: 'https://www.booking.com/search.html?aid=957110&ss={query}'
      },
      walmart: {
        searchUrl: 'https://www.walmart.com/search/?query={query}'
      }
    }
  };
  this.SpeedDialMisc = new SpeedDialMisc();
}).apply( fvdSpeedDial );
