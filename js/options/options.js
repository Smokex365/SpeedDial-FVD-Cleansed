(function(){

  const CUSTOM_BG_URL = "<customFile>";
  const ROLLER_ELEM_WIDTH = 615;

  var Options = function() {

  };

  Options.prototype = {

    _roller: null,

    _settingsTypesIndexes:{
      "global": 0,
      "speeddial": 1,
      "mostvisited": 2,
      "recentlyclosed": 3,
      "bg": 4,
      "fonts": 5,
      "sync": 6,
      "poweroff": 7,
      "widgets": 8
    },

    _typesButtons:{
      "global": "settings",
      "speeddial": "speedDial",
      "mostvisited": "mostVisited",
      "recentlyclosed": "recentlyClosed",
      "bg": "sdBackground",
      "fonts": "sdFontColors",
      "sync": "sdSync",
      "poweroff": "sdPowerOff",
      "widgets": "sdWidgets"
    },

    turnOffAutoUpdateGlobally: function() {
      fvdSpeedDial.Dialogs.confirm( _("dlg_confirm_turn_off_autoupdate_globally_title"),
                                    _("dlg_confirm_turn_off_autoupdate_globally_text"), function( allow ){
        if( allow ){
          fvdSpeedDial.Storage.turnOffAutoUpdateGlobally( function(){
            fvdSpeedDial.Dialogs.alert( _( "dlg_alert_dials_autoupdate_updated_title" ),
                                        _( "dlg_alert_dials_autoupdate_updated_text" ) );
          } );
        }
      } );
    },

    setAutoUpdateGlobally: function() {
      fvdSpeedDial.Dialogs.setAutoUpdateBatch();
    },

    setAutoPreviewGlobally: function(){

      fvdSpeedDial.Dialogs.confirm( _("dlg_confirm_set_auto_preview_global_title"), _("dlg_confirm_set_auto_preview_global_text"), function( allow ){

        if( allow ){
          fvdSpeedDial.Storage.setAutoPreviewGlobally( {}, function(){

            fvdSpeedDial.Dialogs.alert( _( "dlg_alert_set_auto_preview_global_title" ), _( "dlg_alert_set_auto_preview_global_text" ) );

          } );
        }

      } );

    },

    refreshThemeSpecials: function(){

      var notActiveOptionsForFancyStyle = [
        "show_urls_under_dials",
        "show_icons_and_titles_above_dials",
        //"display_quick_menu_and_clicks",
        "scrollSelect",
        //"display_clicks",
          
        //"display_plus_cells"
      ];

      var notActiveForStandardStyle = [
        //"display_mirror"
      ];

      if( document.getElementById("themeSelect").value == "fancy" ){

            notActiveOptionsForFancyStyle.forEach(function(option){
              document.getElementById(option).setAttribute("disabled", 1);
            });

            notActiveForStandardStyle.forEach(function(option){
              document.getElementById(option).removeAttribute("disabled");
            });
          
          $(".activeInStandard").fadeOut();
      }
      else{

        notActiveOptionsForFancyStyle.forEach(function(option){
          document.getElementById(option).removeAttribute("disabled");
        });

        notActiveForStandardStyle.forEach(function(option){
          document.getElementById(option).setAttribute("disabled", 1);
        });

          $(".activeInStandard").fadeIn();
      }

    },

    refreshImportingButtons: function(){

      var buttonImport = document.getElementById("importExport_import");
      var buttonExport = document.getElementById("importExport_export");

      if( fvdSpeedDial.RuntimeStore.get("importing_in_process") ) {
        buttonImport.setAttribute("disabled", true);
        buttonExport.setAttribute("disabled", true);
      }
      else {
        buttonImport.removeAttribute("disabled");
        buttonExport.removeAttribute("disabled");
      }

    },

    runtimeStoreChangeCallback: function( key ){
      if( key == "importing_in_process" ){
        fvdSpeedDial.Options.refreshImportingButtons();
      }
    },

    destroy: function(){

    },

    init: function() {
      this.refreshImportingButtons();

      var that = this;

      this._roller = fvdSpeedDial.Roller.create(document.getElementById("rollerContent"), ROLLER_ELEM_WIDTH);

      this._listenOptions();
      this.refreshOptionValues();

      // refresh options when tab activated
      chrome.tabs.onActiveChanged.addListener(function( tabId ){

        chrome.tabs.getCurrent( function( tab ){
          if(tab.id == tabId) {
            that.refreshOptionValues();
            that.refreshThemeSpecials();
            that.displayActualSizeSetupRange();
            changeCDSize();
          }
        } );

      });

      Broadcaster.onMessage.addListener(function(msg) {
        if(msg.action == "runtimestore:itemchanged") {
          that.runtimeStoreChangeCallback(msg.name);
        }
      });

      // init tabs
      this.Tabs.init();

      // custom dials size

      function changeCDSize(){
        var cdRange = document.getElementById("cdSizeRange_" + document.getElementById("themeSelect").value);

        var width = cdRange.value;
        var height = Math.round(width / fvdSpeedDial.SpeedDial._cellsSizeRatio);
        document.getElementById( "customDialSizePreview" ).textContent = width + "x" + height;
      }
      changeCDSize();

      var options = document.getElementById("themeSelect").options;

      for (var i = 0; i != options.length; i++) {
        document.getElementById("cdSizeRange_" + options[i].value).addEventListener( "input", changeCDSize, false );// Task #1188, Task #1345
        document.getElementById("cdSizeRange_" + options[i].value).addEventListener( "change", ()=>{
            changeCDSize();
            that._rowsOrColumns( "safe" ); // Task #1345
        }, false );
      }

      function refreshParallaxStrengthPreviewValue() {
        document.querySelector("#bg_parallaxDepthContainer .value").textContent =
          document.querySelector("#bg_parallaxDepth").value + "%";
      }
      document.querySelector("#bg_parallaxDepth").addEventListener("change", function() {
        refreshParallaxStrengthPreviewValue();
        that.refreshBg();
      }, false);

      refreshParallaxStrengthPreviewValue();

      function refreshWidgets(){

        var enabled = document.querySelector("[sname=\"widgets.enabled\"]").checked;

        var els = document.querySelectorAll( "#widgetsSettings input" );

        for( var i = 0; i != els.length; i++ ){

          if( els[i].getAttribute("sname") == "widgets.enabled" ){
            continue;
          }

          if( enabled ){
            els[i].removeAttribute("disabled");
          }
          else{
            els[i].setAttribute("disabled", true);
          }
        }

        if( !enabled ){

          return;

        }

        try{
          var input = document.getElementById("widgetsAutoScrollSpeed");

          if( document.getElementById("enableWidgetsAutoscroll").checked ){
            input.removeAttribute("disabled");
          }
          else{
            input.setAttribute("disabled", true);
          }
        }
        catch( ex ){

        }

      }
      refreshWidgets();

      try{
        document.getElementById("enableWidgetsAutoscroll").addEventListener( "click", function(){
          refreshWidgets();
        }, false );

        document.querySelector("[sname=\"widgets.enabled\"]").addEventListener( "click", function(){
          refreshWidgets();
        }, false );
      }
      catch( ex ){

      }

      this.refreshBgSource();

      var hash = document.location.hash;
      var setType;
      if(hash) {
        if( hash == "#setup-custom-size" ){
          this.Tabs.tabs[0].setActiveTab( 1 );
          setTimeout(function() {
            document.getElementById("customDialSizeWrapper").setAttribute( "highlight", 1 );
          }, 0);
        }
        else if( hash == "#display-in-new-tab"){
          this.Tabs.tabs[0].setActiveTab( 1 );
          document.getElementById("displayInNewTabLabel").className += " highlight";
        }
        else if( hash == "#sync" ){
          setType = "sync";
        }
        else if( hash == "#poweroff" ){
          setType = "poweroff";
        }
        else if( hash == "#widgets" ){
          setType = "widgets";
        }

      }
      else{
        var lastType = fvdSpeedDial.Prefs.get( "sd.last_opened_settings" );

        if( lastType == "sync" ){
          this.syncOptionsOpen( true );
        }
        else{
          setType = lastType;
        }
      }
      if(setType) {
        that.setType(setType);
      }

      this.displayActualSizeSetupRange();

      document.getElementById("themeSelect").addEventListener( "change", function(){

        that.refreshThemeSpecials();
        that.displayActualSizeSetupRange();
        changeCDSize();
          
          that._rowsOrColumns();
          that._autoDialsColor();
          that._showClicks();
      }, false );


      document.getElementById("scrollSelect").addEventListener( "change", function(){
          that._rowsOrColumns( "auto" );
      }, false );
        
        
      document.getElementById("display_quick_menu_and_clicks").addEventListener( "change", function(){
          that._showClicks();
      }, false );
        
      this.refreshThemeSpecials();
        
        this._rowsOrColumns();
        this._showClicks();
        
        this._containerHeight();
        
    window.addEventListener('resize', function() {
         that._containerHeight();
    }, true);

      var els = document.querySelectorAll( "[enteron]" );

      for( var i = 0; i != els.length; i++ ){
        (function( el ){

          el.addEventListener( "keypress", function( event ){

            if( event.keyCode == 13 ){
              document.getElementById( el.getAttribute( "enteron" ) ).click();
            }

          }, false );

        })( els[i] );
      }

      document.getElementById("bg_imageURL").addEventListener( "input", function(){

        that.bgDeactivateColor();

      }, false );

      fvdSpeedDial.PremiumForShare.canDisplay({
        ignoreDisplayed: true
      }, function(can) {
        if(!can) {
          return;
        }
        var btnContainer = document.getElementById("premiumForShareButton");
        btnContainer.style.display = "block";
        setTimeout(function(){
          btnContainer.style.opacity = 1;
        }, 100);
        btnContainer.querySelector("button").addEventListener("click", function(){
          chrome.tabs.create({
            url: chrome.runtime.getURL("newtab.html") + "#premiumforshare",
            active: true
          });
        }, false);
      });

      this._changeOption(document.querySelector("[sname=\"sd.display_dial_background\"]"), {
        showApply: false
      });
    },

    bgDeactivateColor: function(){

      document.getElementById("bg_useColor").checked = false;

    },

    bgRestoreDefault: function(){
      var value;
      var currentTheme = document.getElementById("themeSelect").value;

      if( currentTheme == "fancy" ){

        document.getElementById("bg_color").value = fvdSpeedDial.Prefs._themeDefaults["fancy"]["sd.background_color"];
        document.getElementById("bg_useColor").checked = fvdSpeedDial.Prefs._themeDefaults["fancy"]["sd.background_color_enabled"];

        document.getElementById("bg_imageURL").value = fvdSpeedDial.CSS.getFancyBackgroundUrl();
        document.getElementById("bg_imageType").value = fvdSpeedDial.Prefs._themeDefaults["fancy"]["sd.background_url_type"];

      }
      else if( currentTheme == "standard" ){

        document.getElementById("bg_color").value = fvdSpeedDial.Prefs._themeDefaults["standard"]["sd.background_color"];
        document.getElementById("bg_useColor").checked = value = fvdSpeedDial.Prefs._themeDefaults["standard"]["sd.background_color_enabled"];

        document.getElementById("bg_imageType").value = fvdSpeedDial.Prefs._themeDefaults["standard"]["sd.background_url_type"];

      }

      this.refreshBgViewType();
      this.bgLoadAndPreview();

      this._changeOption( document.getElementById("bg_color") );

    },

    selectLocalBackground: function(){

      var that = this;

      try{
        var file = document.getElementsByClassName( "uploadButton" )[0].getElementsByTagName("input")[0].files[0];

        if( file.type.indexOf("image/") !== 0 ){

        }
        else{

          var reader = new FileReader();
          reader.onload = function(){

            var urlField = document.getElementById("bg_imageURL");

            urlField.setAttribute( "localFileContents", reader.result );
            urlField.value = CUSTOM_BG_URL;

            that._changeOption( urlField );

            that.refreshBg();
            that.bgDeactivateColor();

          }
          reader.readAsDataURL( file );

        }     }
      catch( ex ){

      }

    },

    displayActualSizeSetupRange: function(){

      var options = document.getElementById("themeSelect").options;
      var selected = document.getElementById("themeSelect").value;

      for( var i = 0; i != options.length; i++ ){
        if( options[i].value == selected ){
          document.getElementById("cdSizeRange_" + options[i].value).style.display = "";
        }
        else{
          document.getElementById("cdSizeRange_" + options[i].value).style.display = "none";
        }
      }

    },

    currentBgSource: function(){
      return "url"; // chrome doesnt support any other types now

      var currentSource = document.querySelector("input[name=backgroundSource]:checked").value;
      return currentSource;
    },

    refreshBgSource: function(){

      var currentSource = this.currentBgSource();

      var backgroundUrlContainer = document.getElementById("bg_imageURL");

      if( currentSource == "url" ){
        backgroundUrlContainer.removeAttribute( "disabled" );
      }
      else{
        backgroundUrlContainer.setAttribute( "disabled", true );
      }

    },

    Tabs: {

      tabs: [],
      tabsA: {},

      _createInstance: function( tabsBox ){

        var TabBox = function( tabsBox ){

          function tabsContent(){
            return tabsBox.getElementsByClassName( "tabContent" );
          }

          function tabsHeads(){
            return tabsBox.getElementsByClassName( "tabHead" );
          }

          function setActiveTab( tabNum ){

            var heads = tabsHeads();
            var contents = tabsContent();

            for( var i = 0; i != heads.length; i++ ){
              if( i == tabNum ){
                heads[i].setAttribute( "active", 1 );
              }
              else{
                heads[i].removeAttribute( "active", 1 );
              }
            }

            for( var i = 0; i != contents.length; i++ ){
              if( i == tabNum ){
                contents[i].style.display = "block";
              }
              else{
                contents[i].style.display = "none";
              }
            }

          }

          this.setActiveTab = function( tabNum ){

            setActiveTab( tabNum );

          }

          var heads = tabsHeads();

          for( var i = 0; i != heads.length; i++ ){

            (function(i){

              heads[i].addEventListener( "click", function( event ){

                if( event.button != 0 ){
                  return;
                }

                setActiveTab( i );

              }, false );

            })(i);

          }

          setActiveTab(0);

        }

        return new TabBox( tabsBox );

      },


      init: function() {
        var tabs = document.getElementsByClassName( "tabs" );
        for( var i = 0; i != tabs.length; i++ ){
          var inst = this._createInstance( tabs[i] );
          this.tabs.push( inst );
          if( tabs[i].hasAttribute("id") ){
            this.tabsA[ tabs[i].getAttribute("id") ] = inst;
          }
        }
      }
    },

    openGetSatisfactionSuggestions: function(){

      var button = document.getElementsByClassName( "buttonBig sdGetSatisfaction" )[0];
      var offset = fvdSpeedDial.Utils.getOffset( button );
      var menu = document.getElementById("getSatisfactionSuggestSelect");

      menu.setAttribute( "active", 1 );
      menu.style.left = offset.left - button.offsetWidth + "px";
      menu.style.top = offset.top + "px";

      function close(){
        menu.removeAttribute( "active" );
        menu.style.left = "";
        menu.style.top = "";
        document.removeEventListener( "click", close, false );
      }

      setTimeout( function(){
        document.addEventListener( "click", close, false );
      }, 0 );


    },

    rebuildGroupsList: function( callback ){
      // get groups list
      fvdSpeedDial.Storage.groupsList(function( groups ){

        var container = document.getElementById( "speeddial_defaultGroup" );
        container.options.length = 0;

        var optionLastUsedGroup = new Option( _("newtab_last_used_group"), -1 );
        optionLastUsedGroup.className = "lastUsedGroup";
        container.options[container.options.length] = optionLastUsedGroup;

        container.options[container.options.length] = new Option( _("newtab_popular_group_title"), 0 );

        for( var i = 0; i != groups.length; i++ ){
          container.options[container.options.length] = new Option( fvdSpeedDial.Utils.cropLength( groups[i].name, 20 ), groups[i].id );
        }
        container.value = fvdSpeedDial.Prefs.get( "sd.default_group" );

        if( callback ){
          callback();
        }

      });
    },

    close: function(){
      document.location = 'newtab.html';
    },

    setType: function( type ) {
      var page = document.getElementById(type + "Settings");
      var bottomButtons = document.querySelector(".bottomButtons");
      bottomButtons.removeAttribute("hidden");
      if(page) {
        if(page.getAttribute("data-no-buttons") === "1") {
          // hide all buttons
          bottomButtons.setAttribute("hidden", 1);
        }
      }
      //document.getElementById( "closeButton" ).setAttribute( "active", 0 );
      fvdSpeedDial.Prefs.set("sd.last_opened_settings", type);

      var index = this._settingsTypesIndexes[ type ];
      this._roller.rollTo( index );
      var buttons = document.getElementsByClassName( "buttonBig" );
      for( var i = 0; i != buttons.length; i++ ){
        buttons[i].setAttribute( "active", 0 );
      }
      var button = document.getElementsByClassName( this._typesButtons[type] )[0];
      button.setAttribute( "active", 1 );
    },

    applyChanges: function( applyChangesCallback ){

      var settedOptions = [];
      var options = document.querySelectorAll( "[sname]" );

      for( var i = 0; i != options.length; i++ ){
        var name = options[i].getAttribute( "sname" );
        if( settedOptions.indexOf(name) != -1 ){
          continue;
        }
        settedOptions.push( name );
          
            if(true){// Task #964, Task #1345
                if(
                name == 'sd.custom_dial_size' && this._getOptionValue( options[i] ) > fvdSpeedDial.Prefs.get( 'sd.custom_dial_size' )
                ||
                name == 'sd.custom_dial_size_fancy' && this._getOptionValue( options[i] ) > fvdSpeedDial.Prefs.get( 'sd.custom_dial_size_fancy' )
                ){
                    fvdSpeedDial.Prefs.set("sd.top_sites_columns", "auto");
                }
            }

        fvdSpeedDial.Prefs.set( name, this._getOptionValue( options[i] ) );
      }

      // check if need update background image in database
      var imageUrl = document.getElementById("bg_imageURL").value;
      var imageType = document.getElementById("bg_imageType").value;

      var applyChangesButton = document.getElementById( "applyChangesButton" );
      applyChangesButton.setAttribute( "loading", 1 );

      var doneCallback = function(){
        document.getElementById( "mainContainer" ).setAttribute( "havechanges", 0 );
        applyChangesButton.setAttribute( "loading", 0 );
        document.getElementById( "closeButton" ).setAttribute( "active", 1 );

        if( applyChangesCallback ){
          applyChangesCallback();
        }
      };

      if( imageUrl && imageType != "noimage" ){

        var dataUrl = "";

        fvdSpeedDial.Utils.Async.chain([

          function( chainCallback ){

            if( imageUrl == CUSTOM_BG_URL ){
              dataUrl = document.getElementById("bg_imageURL").getAttribute( "localFileContents" );
              chainCallback();
            }
            else{
              fvdSpeedDial.Utils.imageUrlToDataUrl( imageUrl, function( du ){

                if( !du ){
                  du = "";
                }

                dataUrl = du;

                chainCallback();

              } );
            }

          },

          function(){
            fvdSpeedDial.Storage.setMisc( "sd.background", dataUrl, function(){
              doneCallback();
            } );
          }

        ]);




      }
      else{
        doneCallback();
      }

    },

    refreshBgViewType: function(){
      var parallaxDepthContainer = document.getElementById("bg_parallaxDepthContainer");
      parallaxDepthContainer.style.display = "none";
      var imageType = document.getElementById( "bg_imageType" ).value;
      document.getElementById( "bg_UrlContainer" ).style.display = imageType == "noimage" ? "none" : "block";
      if(imageType === "parallax") {
        parallaxDepthContainer.style.display = "block";
      }
      this.refreshBg();
    },

    bgLoadAndPreview: function(){
      var btn = document.getElementById("btnLoadAndPreview");

      btn.setAttribute( "loading", 1 );

      var that = this;

      that.refreshBg(function(){
        btn.setAttribute( "loading", 0 );
      });
    },

    refreshBg: function( callback ){
      var elem = document.getElementById( "backgroundPreview" );

      var url = null;

      switch( this.currentBgSource() ){

        case "url":

          var urlField = document.getElementById("bg_imageURL");

          url = urlField.value;

          if( url == CUSTOM_BG_URL ){
            url = urlField.getAttribute( "localFileContents" );
          }

        break;

        case "theme":
          url = fvdSpeedDial.Background.CURRENT_CHROME_THEME_BACKGROUND_URL;
        break;

        case "local_file":
        break;

      }


      var bgData = {
        color: document.getElementById("bg_color").value,
        useColor: document.getElementById("bg_useColor").checked,
        imageUrl: url,
        imageType: document.getElementById("bg_imageType").value,
        adaptiveSize:{
          width: window.screen.width,
          height: window.screen.height
        },
        callback: callback,
        parallaxDepth: document.getElementById("bg_parallaxDepth").value
      };

      fvdSpeedDial.Background.setToElem(bgData, elem);
    },

    refreshOptionValues: function( callback ){
      var that = this;

      var options = document.querySelectorAll( "[sname]" );
      for (var i = 0; i != options.length; i++) {
        var option = options[i];
        this._setOptionVal( option, fvdSpeedDial.Prefs.get( option.getAttribute( "sname" ) ) );
      }

      fvdSpeedDial.Utils.Async.chain([
        function( chainCallback ){

          var bgUrlField = document.getElementById("bg_imageURL");
          if( bgUrlField.value == CUSTOM_BG_URL ){

            fvdSpeedDial.Storage.getMisc( "sd.background", function( data ){
              bgUrlField.setAttribute( "localFileContents", data );
              chainCallback();
            } );

          }
          else{
            chainCallback();
          }

        },

        function(){

          that.refreshBgViewType();
          that._refreshEnableTypes();
          that.rebuildGroupsList( callback );

        }
      ]);

      this.refreshThemeSpecials();

    },

    fontsRestoreDefaults: function() {

      var defaultValues = {
        "fancy":{
          "sd.text.cell_title.color": "FFFFFF",
          "sd.text.list_elem.color": "FFFFFF",
          "sd.text.list_link.color": "EEEEEE",
          "sd.text.cell_url.color": "888888",
          "sd.text.list_show_url_title.color": "FFFFFF",
          //"sd.text.other.color": "FFFFFF",
            "sd.text.group_active_bg.color": "75AD66",
            "sd.text.group_bg.color": "6E6E6E",
            "sd.text.group_active_font.color": "FFFFFF",
            "sd.text.group_font.color": "FFFFFF",
        }
      };

      var themeName = document.getElementById("themeSelect").value;

      var elems = document.querySelectorAll( "#fontsSettings [sname]" );
      for( var i = 0; i != elems.length; i++ ){
        var elem = elems[i];
        var settingName = elem.getAttribute( "sname" );

        var setV = null;

        try{
          setV = defaultValues[ themeName ][ settingName ];
        }
        catch( ex ){

        }

        if( setV === null || typeof setV == "undefined" ){
          setV = fvdSpeedDial.Prefs.defaultValue( settingName );
        }

        this._setOptionVal( elem, setV );
      }

      document.getElementById( "mainContainer" ).setAttribute( "havechanges", 1 );
      document.getElementById( "closeButton" ).setAttribute( "active", 0 );
    },

    syncOptionsOpen: function( dontOpenSynchronizerOptions, hash ){
      var that = this;
      fvdSpeedDial.Sync.syncAddonOptionsUrl( function( url ){

        if(hash) url += "#" + hash;

        if( url ){
          if( !dontOpenSynchronizerOptions ){
            chrome.tabs.create({
              url: url,
              active: true
            });
          }
        }
        else{
          try{
            that.setType('sync');
          }
          catch( ex ){

          }

        }

      } );
    },

    dontAllowIfLocked: function(){

      if( fvdSpeedDial.PowerOff.isHidden() ){
        fvdSpeedDial.Dialogs.alert( _("dlg_alert_sd_locked_action_title"), _("dlg_alert_sd_locked_action_text") );
        return false;
      }
      else{
        return true;
      }

    },

    _refreshEnableTypes: function(){
      var types = fvdSpeedDial.SpeedDial._displayModesList;

      var sdEnabledElem = document.getElementById("enableSpeedDial");
      var mvEnabledElem = document.getElementById("enableMostVisited");
      var rcEnabledElem = document.getElementById("enableRecentlyClosed");

      var elems = [sdEnabledElem, mvEnabledElem, rcEnabledElem];
      for( var i = 0; i != elems.length; i++ ){
        elems[i].removeAttribute( "disabled" );
      }

      var disabledTypes = [];

      var sdEnabled = sdEnabledElem.checked;
      if( !sdEnabled ){
        disabledTypes.push( "speeddial" );
      }
      var mvEnabled = mvEnabledElem.checked;
      if( !mvEnabled ){
        disabledTypes.push( "mostvisited" );
      }
      var rcEnabled = rcEnabledElem.checked;
      if( !rcEnabled ){
        disabledTypes.push( "recentlyclosed" );
      }

      var enabledTypes = fvdSpeedDial.Utils.arrayDiff( types, disabledTypes );
      if( enabledTypes.length <= 1 ){
        // disable enabled
        for( var i = 0; i != elems.length; i++ ){
          if( elems[i].checked ){
            elems[i].setAttribute( "disabled", true );
          }
        }
      }

      var currentValue = null;
      var radioElems = document.getElementsByName( "global_defaultDial" );
      for( var i = 0; i != radioElems.length; i++ ){
        radioElems[i].removeAttribute( "disabled" );
        if( radioElems[i].checked ){
          currentValue = radioElems[i].value;
        }
      }

      if( disabledTypes.indexOf( currentValue ) != -1 ){
        // set new value
        var newValue = enabledTypes[0];
        for( var i = 0; i != radioElems.length; i++ ){
          if( radioElems[i].value == newValue ){
            radioElems[i].checked = true;
          }
        }
      }

      // disable disabled default elements
      for( var i = 0; i != disabledTypes.length; i++ ){
        for( var j = 0; j != radioElems.length; j++ ){
          if( radioElems[j].value == disabledTypes[i] ){
            radioElems[j].setAttribute( "disabled", true );
          }
        }
      }

    },

    _changeOption: function( option, params ){
      params = params || {};
      if(typeof params.showApply == "undefined") {
        params.showApply = true;
      }
      var settingName = option.getAttribute( "sname" );
      var newValue = this._getOptionValue( option );
      if(params.showApply) {
        document.getElementById( "mainContainer" ).setAttribute( "havechanges", 1 );
        document.getElementById( "closeButton" ).setAttribute( "active", 0 );
      }

      if( ["sd.enable_top_sites", "sd.enable_most_visited", "sd.enable_recently_closed"].indexOf(settingName) != -1 ){
        this._refreshEnableTypes();
      }
        
      if(settingName == "sd.display_dial_background") {
        if(newValue) {
            document.getElementById("display_dial_borders_container").style.display = "none";
            document.getElementById("display_dial_background_color").style.display = "";
        }
        else {
            document.getElementById("display_dial_borders_container").style.display = "";
            document.getElementById("display_dial_background_color").style.display = "none";
        }
      }else
      if(
          settingName == "sd.text.group_active_bg.color"
          ||
          settingName == "sd.text.group_bg.color"
      ) {// Task #1292          
          var fontColor = document.getElementById(settingName == "sd.text.group_active_bg.color" ? "groupActiveFontColor" : "groupFontColor");
          
          if(fontColor.value == "FFFFFF" || fontColor.value == "000000"){
              var newColor = this.darkOrLight(newValue);
              
              fontColor.value = newColor;
              fontColor.style.backgroundColor = '#' + String(newColor);
              fontColor.style.color = newColor == 'FFFFFF' ? '#000000' : '#FFFFFF';
              
              this._changeOption( fontColor );
          }
      }
    },
      
    darkOrLight: function(hex){// Task #1292
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        var red =  parseInt(result[1], 16);
        var green = parseInt(result[2], 16);
        var blue = parseInt(result[3], 16);


        var brightness;
        brightness = (red * 299) + (green * 587) + (blue * 114);
        brightness = brightness / 255000;

        // values range from 0 to 1
        // anything greater than 0.5 should be bright enough for dark text
        
        if (brightness >= 0.5) {
            return "000000";
        } else {
            return "FFFFFF";
        }
    },

    _listenOptions: function(){
      var options = document.querySelectorAll( "[sname]" );
      var that = this;
      for( var i = 0; i != options.length; i++ ){
        var option = options[i];
        (function( option ){

          option.addEventListener( "change", function( event ){

            that._changeOption( option );

          }, false );

        })( option );
      }
    },

    _setOptionVal: function( option, value ){
      try{
        if( option.tagName == "INPUT" ){
          if( option.className.indexOf("color") !== -1 ){ // Task #1288             
            if( option.color ){
              option.color.fromString(value);
            }
            else{
              option.value = value;
            }
            return;
          }
          else if( option.type == "checkbox" ){
            option.checked = _b(value);
            return;
          }
          else if( option.type == "radio" ){
            var name = option.name;
            document.querySelector( "[name="+name+"][value="+value+"]" ).checked = true;
            return;
          }
        }

        option.value = value;
      }
      catch( ex ){

      }

    },

    _getOptionValue: function( option ){

      if( option.tagName == "INPUT" ){
        if( option.type == "checkbox" ){
          return option.checked;
        }
        else if( option.type == "radio" ){
          var name = option.name;
          return document.querySelector( "[name="+name+"]:checked" ).value;
        }
      }

      return option.value;

    },

    _rowsOrColumns: function( mode ){
        var scroll = document.getElementById('scrollSelect').value;
        var theme = document.getElementById('themeSelect').value;
        var cols = document.getElementById('columnsSelect');
        var rows = document.getElementById('rowsSelect');
        var maxDials = 0, $select;
        
        if(scroll == "vertical" || theme == "fancy"){
            document.getElementById('numberOfColumns').removeAttribute("hidden");
            cols.removeAttribute("hidden")
            cols.setAttribute('sname', 'sd.top_sites_columns');
            
            document.getElementById('numberOfRows').setAttribute("hidden", "true");
            rows.setAttribute("hidden", "true")
            rows.removeAttribute('sname');
            
            maxDials  = this._maxDialsInRow("width");
            
            $select = $("#columnsSelect");
        }else{
            document.getElementById('numberOfColumns').setAttribute("hidden", "true");
            cols.setAttribute("hidden", "true")
            cols.removeAttribute('sname');
            
            document.getElementById('numberOfRows').removeAttribute("hidden");
            rows.removeAttribute("hidden")
            rows.setAttribute('sname', 'sd.top_sites_columns');
            
            maxDials  = this._maxDialsInRow("height");
            
            $select = $("#rowsSelect");
        }
        
        var cur = $select.val();
        
        $select.find("option:gt(0)").remove();
        
        for(var i = 0; i < maxDials; i++){
            $select.append(
                $("<option>").attr("value", i + 1).text(i + 1)
            );
        }
        
        if(mode != "safe") cur = fvdSpeedDial.Prefs.get( "sd.top_sites_columns" ); // Task #1345
        
        if(mode == "auto" || (cur != "auto" && cur > maxDials)) cur = "auto";
        
        $select.val(cur);
    },
      
    _maxDialsInRow: function(dir) {
        var theme = document.getElementById('themeSelect').value;
      
        var width = parseInt(document.getElementById('cdSizeRange_' + theme).value);
        
        if(dir == "width"){
            width += 20;
            var count = (window.innerWidth - 20) / (theme == "fancy" ? (width * (1 + (width/(width < 300 ? 1680 : 1530)))) : width); // Task #1396
            //console.info(theme, width, count);
        }else{
            var count = (window.innerHeight - 135) / (0.625 * width + 85);
        }
      
        return Math.max(1, Math.floor(count));
    },
      
    _showClicks: function(){
        var menu = $("#display_quick_menu_and_clicks").prop("checked");
        var theme = document.getElementById('themeSelect').value;
        
        $("#display_clicks").attr("disabled", menu/* && theme == "standard"*/ ? false : "disabled"); // Task #1413
    },
      
    _autoDialsColor: function(){
        var theme = document.getElementById('themeSelect').value;
        
        if(theme == "fancy"){
            document.getElementsByName('global_display_dial_background_color')[1].checked = true;
        }else{
            document.getElementsByName('global_display_dial_background_color')[0].checked = true;
        }
        
    },
      
    _containerHeight: function(){ // Task #1562
      var winHeight = window.innerHeight;//document.body.offsetHeight;
      
      var container = document.getElementById( "mainContainer" );
      var settingsContent = document.getElementById( "settingsContent" );
            
      if(winHeight < 715){
          container.style.height = String(winHeight - 5) + "px";
          settingsContent.style.overflowY = "auto";
          settingsContent.style.overflowX = "hidden";
      }else{
          container.style.height = "710px";
          settingsContent.style.overflowY = "hidden";
          settingsContent.style.overflowX = "hidden";
      }
      
    }
  };
  
  this.Options = new Options();
}).apply(fvdSpeedDial);
