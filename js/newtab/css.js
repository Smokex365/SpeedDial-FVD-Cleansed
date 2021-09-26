(function(){

	const FANCY_BACKGROUND_URL = fvdSpeedDial.Prefs._themeDefaults["fancy"]["sd.background_url"];

	var CSS = function(){};

	CSS.prototype = {
		stylesheets: [],

		getFancyBackgroundUrl: function(){

			return FANCY_BACKGROUND_URL;

		},

		setTheme: function( name ){

			document.getElementById( "themeCSS" ).setAttribute("href", "/themes/" + name + ".css");

		},

		refreshTheme: function(){
			try{
				this.setTheme( fvdSpeedDial.Prefs.get( "sd.display_mode" ) );
			}
			catch( ex ){

			}
		},

		refresh: function(){


			// get colors from settings
			var classesColors = {
				".newtabCell .head": {
					"color": this._color( fvdSpeedDial.Prefs.get("sd.text.cell_title.color") ),
					"font-size": this._size( fvdSpeedDial.Prefs.get("sd.text.cell_title.size") ),
					"font-weight": this._fontWeight(fvdSpeedDial.Prefs.get("sd.text.cell_title.bolder")),
					"display": _b( fvdSpeedDial.Prefs.get("sd.show_icons_and_titles_above_dials") ) ? "block" : "none"
				},
				".newtabCell .footer": {
					"color": this._color( fvdSpeedDial.Prefs.get("sd.text.cell_url.color") ),
					"font-size": this._size( fvdSpeedDial.Prefs.get("sd.text.cell_url.size") ),
					"font-weight": this._fontWeight(fvdSpeedDial.Prefs.get("sd.text.cell_url.bolder")),
					"display": _b( fvdSpeedDial.Prefs.get("sd.show_urls_under_dials") ) ? "block" : "none"
				},
				".newtabListElem .text": {
					"color": this._color( fvdSpeedDial.Prefs.get("sd.text.list_elem.color") ),
					"font-size": this._size( fvdSpeedDial.Prefs.get("sd.text.list_elem.size") ),
					"font-weight": this._fontWeight(fvdSpeedDial.Prefs.get("sd.text.list_elem.bolder"))
				},

				"#listViewTypeSelector": {
					"color": this._color( fvdSpeedDial.Prefs.get("sd.text.list_show_url_title.color") ),
					"font-size": this._size( fvdSpeedDial.Prefs.get("sd.text.list_show_url_title.size") ),
					"font-weight": this._fontWeight(fvdSpeedDial.Prefs.get("sd.text.list_show_url_title.bolder"))
				},

				".link":{
					"color": this._color( fvdSpeedDial.Prefs.get("sd.text.list_link.color") ),
					"font-size": this._size( fvdSpeedDial.Prefs.get("sd.text.list_link.size") ),
					"font-weight": this._fontWeight(fvdSpeedDial.Prefs.get("sd.text.list_link.bolder"))
				},

				/*
				".textother": { // Task #1000
						"color": this._color(fvdSpeedDial.Prefs.get("sd.text.other.color")),
						"font-size": this._size(fvdSpeedDial.Prefs.get("sd.text.other.size")),
						"font-weight": this._fontWeight(fvdSpeedDial.Prefs.get("sd.text.other.bolder"))
				},
				*/
				".textother": { // Task #1000
						"color": this._color(fvdSpeedDial.Prefs.get("sd.text.cell_title.color")),
						"font-size": this._size(fvdSpeedDial.Prefs.get("sd.text.cell_title.size")),
						"font-weight": this._fontWeight(fvdSpeedDial.Prefs.get("sd.text.cell_title.bolder")),
				},

				".newtabCell": {
					"opacity": fvdSpeedDial.Prefs.get("sd.dials_opacity")/100
				},
				".newtabListElem":{
					"opacity": fvdSpeedDial.Prefs.get("sd.dials_opacity")/100
				},
				"#groupsBox > div":{
					"opacity": fvdSpeedDial.Prefs.get("sd.dials_opacity")/100
				}
			};



			if( !_b( fvdSpeedDial.Prefs.get("sd.display_dial_background") ) ){
				classesColors[".newtabCell .body .screenParent"] = {
					"box-shadow": "none !important"
					//"background": "none !important",
				};
				if(!_b( fvdSpeedDial.Prefs.get("sd.display_dial_borders") )) {
					classesColors[".newtabCell .body .screenParent"]["border"] = "none !important";
				}
				else {
					classesColors[".newtabCell .body .screenParent"]["border-width"] = "1px !important";
				}
				classesColors[".newtabCell[type=\"plus\"] .body .preview-image"] = {
					"background": "none !important",
					//"background": "none !important",
				};
				classesColors["#speedDialContent .newtabCell .body"] = {
					"background": "none !important",
				};
				classesColors[".newtabCell .menuOverlay .text"] = {
					"margin-right": "5px",
					"margin-left": "5px",
					"margin-bottom": "5px",
				};
				classesColors[".newtabCell .speedDialIcons"] = {
					"margin-right": "5px !important"
				};

				classesColors[".newtabCell .imgShadow"] = {
					"display": "none"
				};

				classesColors[".newtabCell .menuOverlay"] = {
					"background-color": "rgba( 62, 125, 179, 0.6 ) !important"
				};
				/*
				classesColors[".newtabCell .mostVisitedMenu"] = {
					"background-color": "rgba( 62, 125, 179, 0.6 )",
					"position": "absolute",
					"top": "19px",
					"padding-top": "3px"
				};
				*/
				classesColors["#speedDialContent[style=\"standard\"] .newtabCell[type=\"mostvisited\"] .menuOverlay"] = {
					"left": "-3px",
					"right": "-3px !important",
					"width": "auto",
					"bottom": "7px",
				};
				classesColors[".newtabCell .mostVisitedMenu > .views"] = {
					"margin-left": "3px"
				};
				classesColors[".newtabCell .mostVisitedMenu > .ingroup"] = {
					"margin-right": "3px"
				};

			}else
				if(localStorage.getItem('prefs.sd.display_dial_background_color') != null){// Task #1387, #1052
						var style = fvdSpeedDial.Prefs.get( "sd.display_mode" );
						var theme = fvdSpeedDial.Prefs.get("sd.display_dial_background_color");

						if( style == "fancy" && theme == "white" ){
								classesColors["#speedDialContent .newtabCell .body"] = {
										"background-color": "rgba(255,255,255,1)!important",
								};

								/*
								classesColors["#speedDialContent .newtabCell .body .menuOverlay"] = {
										"border-radius": "0 0 6px 6px",
								};
								*/
						}else
						if( style == "standard" && theme == "dark" ){
								classesColors["#speedDialContent .newtabCell .body"] = {
										"background-color": "rgba(50, 50, 50, 0.3)!important",
								};
								classesColors["#speedDialContent .newtabCell[type='plus'] .body .preview-image"] = {
										"background": "none!important"
								};
						}
				}

			if( !_b( fvdSpeedDial.Prefs.get("sd.display_quick_menu_and_clicks" ) ) ){
				classesColors[".newtabCell .speedDialIcons"] = {
					"display": "none"
				};
				classesColors[".newtabCell .text"] = {
					"display": "none"
				};
				classesColors[".newtabCell .menuOverlay"] = {// Task #1676
					"display": "none"
				};
				classesColors[".newtabCell .body"] = {// Task #1676
					"padding-bottom": "0!important"
				};
			}

				classesColors["#groupsBox .group"] = { // Task #1232, #1099
						"color": this._color(fvdSpeedDial.Prefs.get("sd.text.group_font.color")) + "!important",
						"font-size": this._size(fvdSpeedDial.Prefs.get("sd.text.group_font.size")) + "!important",
						"font-weight": this._fontWeight(fvdSpeedDial.Prefs.get("sd.text.group_font.bolder"))
				};

				classesColors[".additionalGroupsList .group .groupName"] = { // Task #1373
						"font-size": this._size(fvdSpeedDial.Prefs.get("sd.text.group_font.size")) + "!important",
						//"font-weight": this._fontWeight(fvdSpeedDial.Prefs.get("sd.text.group_font.bolder"))
				};

				classesColors["#groupsBox .group[current='1']"] = { // Task #1288
						color: this._color(fvdSpeedDial.Prefs.get("sd.text.group_active_font.color")) + "!important",
						background : "-webkit-linear-gradient(top, rgba(86,132,73,0.6), rgba(117,173,102,0.7))!important"
				};

				classesColors["#groupsBox .group[current='1'] *"] = { // Task #1288
						color: this._color(fvdSpeedDial.Prefs.get("sd.text.group_active_font.color")) + "!important"
				};

				classesColors["#groupsBox .additionalGroupsButton"] = {};

				try{
						var group_bg = fvdSpeedDial.Prefs.get("sd.text.group_bg.color");
						var group_active_bg = fvdSpeedDial.Prefs.get("sd.text.group_active_bg.color");

						if(
								fvdSpeedDial.Prefs.get("sd.text.group_font.color") == "FFFFFF"
								//&& fvdSpeedDial.Prefs.get("sd.background_url_type") == "noimage" // Task 1412
						){
								//classesColors["#groupsBox .group"].color = this._color("606060") + "!important"; // #Task 1224
								classesColors["#groupsBox .group"].color = this._color("FFFFFF") + "!important"; // #Task 1412

								if(group_bg == "6E6E6E"){
										//var bgColor = "-webkit-linear-gradient(top, rgba(225,225,225,0.8), rgba(238,238,238,0.7))!important";
										var bgColor = "-webkit-linear-gradient(top , rgba(110, 110, 110, 0.5), rgba(100, 100, 100, 0.5))!important";// #Task 1412

										classesColors["#groupsBox .group"].background = bgColor;
										classesColors["#groupsBox .additionalGroupsButton"].background = bgColor;
								}
						}

						if(group_bg != "6E6E6E"){
								var bgColor = "-webkit-linear-gradient(top, " + fvdSpeedDial.Utils.hexToRGBA(group_bg, 0.5) + ", " + fvdSpeedDial.Utils.hexToRGBA(group_bg, 0.5) + ")!important";

								classesColors["#groupsBox .group"].background = bgColor;
								classesColors["#groupsBox .additionalGroupsButton"].background = bgColor;
						}


						if(group_active_bg != "75AD66"){
								var bgActiveColor = "-webkit-linear-gradient(top, " + fvdSpeedDial.Utils.hexToRGBA(group_active_bg, 0.85) + ", " + fvdSpeedDial.Utils.hexToRGBA(group_active_bg, 0.95) + ")!important";

								classesColors["#groupsBox .group[current='1']"].background = bgActiveColor;
						}

						//classesColors["#groupsBox .group[current='1']"].color = bgActiveColor;

						classesColors["#groupsBox .group .image"] = {
								"background": this._color(fvdSpeedDial.Prefs.get("sd.text.group_font.color")) + "!important"
						};
						classesColors["#groupsBox .additionalGroupsButton .img"] = {
								"background": this._color(fvdSpeedDial.Prefs.get("sd.text.group_font.color")) + "!important"
						};
				}catch(ex){console.warn(ex)}

				if(
						fvdSpeedDial.Prefs.get("sd.background_url_type") == "noimage"
						&&
						fvdSpeedDial.Prefs.get("sd.text.cell_title.color") == "FFFFFF"
						&&
						(
								fvdSpeedDial.Prefs.get("sd.background_color") == "FFFFFF"
								||
								!_b( fvdSpeedDial.Prefs.get( "sd.background_color_enabled" ) )
						)
				){
						classesColors[".newtabCell .head"].color = this._color("000000");
				}

				if (!_b(fvdSpeedDial.Prefs.get("sd.display_quick_menu_and_clicks"))) {

				} else if(!_b(fvdSpeedDial.Prefs.get("sd.display_clicks"))) {
						classesColors[".newtabCell .text"] = {
								"display": "none"
						};
						classesColors[".newtabCell .mostVisitedMenu"] = {
							"display": "none"
						};
						classesColors[".newtabCell[type='mostvisited'] .menuOverlay"] = {
								"padding-bottom": "0!important"
						};
				}

			for( var si = 0; si != this.stylesheets.length; si++ ){
				try {
					var stylesheet = this.stylesheets[si];
					//console.info(stylesheet);
					while ( stylesheet.cssRules.length > 0 ) {
						stylesheet.deleteRule(0);
					}
					for( var selector in classesColors ) {
						stylesheet.addRule( selector, "", 0 );
						var rule = stylesheet.cssRules[0];
						var properties = classesColors[selector];
						for( var properyName in properties ){
							var value = properties[properyName];
							var important = null;
							try{
								if( value.indexOf("!important") != -1 ){
									important = "important";
									value = value.replace( "!important", "" );
								}
							}
							catch( ex ) {
							}
							rule.style.setProperty( properyName, value, important );
						}
					}
				} catch (ex) {
					//console.warn(ex)
				}
			}

			if (_b(fvdSpeedDial.Prefs.get("sd.enable_dials_counter"))) {
					document.body.removeAttribute('hidegroupcounter');
			}else{
					document.body.setAttribute('hidegroupcounter', '1');
			}

			if (_b(fvdSpeedDial.Prefs.get("sd.show_gray_line"))) {
					document.body.removeAttribute('hidegrayline');
			}else{
					document.body.setAttribute('hidegrayline', '1');
			}

			this.refreshTheme();

		},

		_color: function( c ){
			return "#"+c;
		},

		_size: function( s ){
			return s+"px";
		},

		_fontWeight: function( bolder ){
			if( _b(bolder) ){
				return "bold";
			}
			return "normal";
		},

		_updateThemeActions: function(value, cb) {
			cb = cb || function() {};

			var fancyDefaults = fvdSpeedDial.Prefs._themeDefaults["fancy"];
			var standardDefaults = fvdSpeedDial.Prefs._themeDefaults["standard"];

			var prefsToRestore = [
				"sd.text.cell_title.color",
				"sd.text.list_elem.color",
				"sd.text.list_show_url_title.color",
				"sd.text.list_link.color",
				"sd.text.other.color"
			];

			fvdSpeedDial.Utils.Async.chain([
				function(next) {
					if(value == "standard") {
						if(fvdSpeedDial.Prefs.get("sd.background_color") == "000000" &&
							_b( fvdSpeedDial.Prefs.get( "sd.background_color_enabled" ) ) ||
							fvdSpeedDial.Prefs.get("sd.background_url") == FANCY_BACKGROUND_URL &&
							fvdSpeedDial.Prefs.get("sd.background_url_type") != "noimage"
						) {

							if( fvdSpeedDial.Prefs.get("sd.background_url") == FANCY_BACKGROUND_URL ){
								fvdSpeedDial.Prefs.sSet("sd.background_url_type", "noimage");
							}

							fvdSpeedDial.Prefs.sSet("sd.background_color_enabled", true);
							fvdSpeedDial.Prefs.sSet("sd.background_color", "FFFFFF");

							prefsToRestore.forEach(function( pref ){

								if( fvdSpeedDial.Prefs.get(pref) == fancyDefaults[pref] ){
									fvdSpeedDial.Prefs.set( pref, standardDefaults[pref] );
								}

							});

						}
						if( !_b( fvdSpeedDial.Prefs.get("sd.display_quick_menu_and_clicks") ) ) {
							//fvdSpeedDial.Prefs.sSet( "sd.display_quick_menu_and_clicks", true ); // Task #1413
						}

						if( !_b( fvdSpeedDial.Prefs.get("sd.show_urls_under_dials") ) ){
							fvdSpeedDial.Prefs.sSet( "sd.show_urls_under_dials", true );
						}

						if( !_b( fvdSpeedDial.Prefs.get("sd.show_icons_and_titles_above_dials") ) ){
							fvdSpeedDial.Prefs.sSet( "sd.show_icons_and_titles_above_dials", true );
						}
						setTimeout(next, 0);
					}
					else if(value == "fancy") {

						fvdSpeedDial.Prefs.sSet( "sd.top_sites_columns", "auto" );
						//fvdSpeedDial.Prefs.set( "sd.thumbs_type", "medium" );
						fvdSpeedDial.Prefs.sSet( "sd.most_visited_columns", "auto" );

						// set fonts

						prefsToRestore.forEach(function( pref ){

							if( fvdSpeedDial.Prefs.get(pref) == standardDefaults[pref] ){
								fvdSpeedDial.Prefs.set( pref, fancyDefaults[pref] );
							}

						});

						// in fancy mode plus cells always display
						if( !_b( fvdSpeedDial.Prefs.get("sd.display_plus_cells") ) ){
							fvdSpeedDial.Prefs.sSet( "sd.display_plus_cells", true );
						}

						if( _b( fvdSpeedDial.Prefs.get("sd.display_quick_menu_and_clicks") ) ) {
							//fvdSpeedDial.Prefs.sSet( "sd.display_quick_menu_and_clicks", false ); // Task #1413
						}

						if( _b( fvdSpeedDial.Prefs.get("sd.show_urls_under_dials") ) ){
							fvdSpeedDial.Prefs.sSet( "sd.show_urls_under_dials", false );
						}

						if( _b( fvdSpeedDial.Prefs.get("sd.show_icons_and_titles_above_dials") ) ){
							fvdSpeedDial.Prefs.sSet( "sd.show_icons_and_titles_above_dials", false );
						}

						if(fvdSpeedDial.Prefs.get("sd.background_url_type") == "noimage") {
							var bgUrl = FANCY_BACKGROUND_URL;
							fvdSpeedDial.Utils.imageUrlToDataUrl( bgUrl, function( dataUrl ){
								if( !dataUrl ){
									dataUrl = "";
								}
								fvdSpeedDial.Prefs.set( "sd.background_url", bgUrl );
								fvdSpeedDial.Storage.setMisc("sd.background", dataUrl, function(){
									fvdSpeedDial.Prefs.set("sd.background_url_type", fancyDefaults["sd.background_url_type"]);
									fvdSpeedDial.SpeedDial.refreshBackground();
									next();
								});
							});
						}
						else {
							setTimeout(next, 0);
						}
					}
					//fvdSpeedDial.ChromeThemeClient.setPrefsForCurrentAppliedTheme();
				},
				function() {
					cb();
				}
			]);
		}
	};

	this.CSS = new CSS();

	function prefListener( name, value ){
		if( name == "sd.display_mode" ){

			setTimeout( function(){
				fvdSpeedDial.Prefs.set( "sd.top_sites_columns", "auto" );
				fvdSpeedDial.Prefs.set( "sd.most_visited_columns", "auto" );

				fvdSpeedDial.CSS._updateThemeActions( value );
				fvdSpeedDial.CSS.refresh();
				fvdSpeedDial.CSS.refreshTheme();
				fvdSpeedDial.SpeedDial.sheduleRebuild();
				fvdSpeedDial.SpeedDial.refreshBackground();

			}, 0 );
		}
	}

	Broadcaster.onMessage.addListener(function(msg) {
		if(msg.action == "pref:changed") {
			prefListener(msg.name, msg.value);
		}
	});

}).apply(fvdSpeedDial);
