(function(){

  var Dialogs = function(){

  };

  Dialogs.prototype = {

    _erroredFields: [],

    // default dialogs

    alert: function( title, text, callback, param ){
        if(typeof param != "object") param = {param:param||false};

        var btns = {};

        if(param.btns){
            for(var i in param.btns) btns[i] = function(){
                 param.btns[i](dlg);
            }
        }

      btns[param.ok ? param.ok : _("dlg_alert_ok")] = function(){
            dlg.close();

            if( callback ){
                callback();
            }
      };

      var dlg = new Dialog({
        width: 400,
        title: title,
        content: text,
        buttons: btns
      });

    },

    alertCheck: function( title, text, cbText, cbInitState, callback, params ){

      params = params || {};

      params.width = params.width || 400;

      if( document.getElementById("dialogAlertCheck_text") ){
        return;
      }

      var btns = {};
      btns[_("dlg_alert_ok")] = function(){
        dlg.close();
        if( callback ){
          callback( document.getElementById( "dialogAlertCheck_checkbox" ).checked );
        }
      };


      var dlg = new Dialog({
        className: "alertDialog",
        width: params.width,
        title: title,
        content: fvdSpeedDial.Templates.getHTML("prototype_dialogAlertCheck"),
        buttons: btns,
        onShow: function(){
          document.getElementById( "dialogAlertCheck_text" ).innerHTML = text;
          document.getElementById( "dialogAlertCheck_checkBoxLabel" ).innerHTML = cbText;
          document.getElementById( "dialogAlertCheck_checkbox" ).checked = cbInitState;
        }
      });

    },

    confirmCheck: function( title, text, cbText, cbInitState, callback ){

      if( document.getElementById("dialogAlertCheck_text") ){
        return;
      }

      var btns = {};
      btns[_("dlg_confirm_ok")] = function(){
        dlg.close();
        if( callback ){
          callback( true, document.getElementById( "dialogAlertCheck_checkbox" ).checked );
        }
      };

      btns[_("dlg_confirm_cancel")] = function(){
        dlg.close();
        if( callback ){
          callback( false, document.getElementById( "dialogAlertCheck_checkbox" ).checked );
        }
      };

      var dlg = new Dialog({
        className: "alertDialog",
        width: 400,
        title: title,
        content: fvdSpeedDial.Templates.getHTML("prototype_dialogAlertCheck"),
        buttons: btns,
        onShow: function(){
          document.getElementById( "dialogAlertCheck_text" ).innerHTML = text;
          document.getElementById( "dialogAlertCheck_checkBoxLabel" ).innerHTML = cbText;
          document.getElementById( "dialogAlertCheck_checkbox" ).checked = cbInitState;
        }
      });

    },

    confirm: function( title, text, callback ){

      var btns = {};
      btns[_("dlg_confirm_ok")] = function(){
        dlg.close();
        callback( true );
      };

      btns[_("dlg_confirm_cancel")] = function(){
        dlg.close();
        callback( false );
      };

      var dlg = new Dialog({
        width: 400,
        enterOnButton: _("dlg_confirm_ok"),
        title: title,
        content: text,
        buttons: btns
      });

    },

    initPrototypes: function(){
    },

    errorToField: function( field, prnt, errorMessage ){
      var dialogErrorBox = document.getElementById( "dialogErrorBox" );
      if(!dialogErrorBox){
        dialogErrorBox = document.createElement( "div" );
        dialogErrorBox.className = "dialog-errorBox";
        dialogErrorBox.setAttribute( "id", "dialogErrorBox" );
        var span = document.createElement( "div" );
        dialogErrorBox.appendChild( span );
        prnt.appendChild( dialogErrorBox );
      }
      field.setAttribute( "error", "1" );
      this._erroredFields.push( field );

      var span = dialogErrorBox.getElementsByTagName( "div" )[0];

      span.textContent = errorMessage;
      var pos = fvdSpeedDial.Utils.getOffset( field );
      dialogErrorBox.style.left = pos.left + "px";
      dialogErrorBox.style.top = pos.top - 1 + field.offsetHeight + "px";
      dialogErrorBox.style.width = field.offsetWidth - 2 + "px";
      dialogErrorBox.setAttribute( "active", 1 );
    },

    hideErrorBox: function(){
      try{
        var dialogErrorBox = document.getElementById( "dialogErrorBox" );

        if(dialogErrorBox){
          dialogErrorBox.setAttribute( "active", 0 );
        }
        for( var i = 0; i != this._erroredFields.length; i++ ){
          this._erroredFields[i].setAttribute( "error", 0 );
        }
      }
      catch( ex ){

      }
    },

    PicsUserPics: {

      SDPREVIEW_URL_PREFIX: "https://everhelper.me/sdpreviews",

      currentXHR: [],

      buildElem: function( preview, callbacks, dlg ){

        var resultCallback = callbacks.resultCallback;
        var _report = callbacks._report;

        var previewElem = document.createElement( "div" );
        previewElem.className = "item";

        var img = document.createElement("div");
        img.className = "preview";
  //            img.setAttribute("src", preview.url);

        var tmpImg = new Image();
        tmpImg.onload = function(){

          try{

            img.style.background = "url(\""+preview.url+"\") no-repeat center center ";
            if( tmpImg.width > img.offsetWidth || tmpImg.height > img.offsetHeight ){
              img.style.backgroundSize = "contain";
            }

          }
          catch( ex ){

          }

        };
        tmpImg.src = preview.url;

        var report = document.createElement("div");
        report.className = "report";
        report.setAttribute("title", _("dialog_pick_user_pics_report"));

        if( _report ){
          previewElem.appendChild( report );
        }

        var reportContainer = document.createElement("div");
        reportContainer.className = "reportContainer";
        var buttonInappropriate = document.createElement("button");
        var buttonDuplicate = document.createElement("button");

        buttonInappropriate.className = "fvdButton inappropriate";
        buttonDuplicate.className = "fvdButton duplicate";
        buttonInappropriate.textContent = _("dialog_pick_user_pics_report_innop");
        buttonDuplicate.textContent = _("dialog_pick_user_pics_report_duplicate");

        var closeReport = document.createElement("div");
        closeReport.className = "close";

        reportContainer.appendChild( buttonInappropriate );
        //reportContainer.appendChild( buttonDuplicate );
        reportContainer.appendChild( closeReport );

        var thankYouReport = document.createElement("div");
        thankYouReport.textContent = _("dialog_pick_user_pics_report_thanks");
        thankYouReport.className = "thanks";

        reportContainer.appendChild( thankYouReport );

        previewElem.appendChild( img );
        previewElem.appendChild( reportContainer );


        closeReport.addEventListener( "click", function( event ){
          previewElem.removeAttribute("report");

          event.stopPropagation();
        } );
        report.addEventListener( "click", function(){
          previewElem.setAttribute("report", 1);

          event.stopPropagation();
        } );

        previewElem.addEventListener( "click", function(){

          resultCallback( preview );
          resultCallback = null;

          if( dlg ){
            dlg.close();
          }

        }, false );

        function _okReport(){
          setTimeout(function(){

            previewElem.removeAttribute("report");

            setTimeout(function(){
              reportContainer.removeAttribute( "thanks" );
            }, 500);

          }, 1000);
        }

        reportContainer.addEventListener( "click", function( event ){

          event.stopPropagation();

        }, false );
        buttonInappropriate.addEventListener( "click", function(){

          _report( preview.id, "inappropriate", function(){
            reportContainer.setAttribute( "thanks", 1 );
            _okReport();
          } );

        } );
        buttonDuplicate.addEventListener( "click", function(){
          _report( preview.id, "duplicate", function(){
            reportContainer.setAttribute( "thanks", 1 );
            _okReport();
          } );
        } );

        setTimeout(function(){

          previewElem.setAttribute("appear", 1);

        }, 0);

        return previewElem;

      },

      rate: function( sdPreviewId, callback ){

        callback = callback || function(){};

        this.request( "rating.php", {
          sdpreview_id: sdPreviewId
        }, callback );

      },

      cancelCurrentRequests: function(){

        this.currentXHR.forEach(function( xhr ){
          xhr.abort();
        });

        this.currentXHR = [];

      },

      request: function( file, params, callback ){

        var url = this.SDPREVIEW_URL_PREFIX + "/" + file;
        var that = this;

        var queryStr = [];

        for( var k in params ){
          queryStr.push( k + "=" + encodeURIComponent( params[k] ) );
        }

        url += "?" + queryStr.join("&");

        var xhr = new XMLHttpRequest();

        that.currentXHR.push( xhr );

          //console.info(url);

        xhr.open( "GET", url );

        xhr.onload = function(){

          var index = that.currentXHR.indexOf( xhr );
          if( index != -1 ){
            that.currentXHR.splice( index, 1 );
          }

          try{
            var response = JSON.parse( xhr.responseText );
            if( response.errorCode ){
              return callback( new Error( "Server returns error " + response.errorCode ) );
            }
          }
          catch( ex ){
            return callback( new Error( "Fail parse server response" ) );
          }

          callback( null, response.body );

        };

        xhr.onerror = function(){

          var index = that.currentXHR.indexOf( xhr );
          if( index != -1 ){
            that.currentXHR.splice( index, 1 );
          }

          callback( new Error( "Fail make request" ) );

        };

        xhr.send( null );

      }

    },


    pickUserPics: function( params, resultCallback ){

      var btns = {};
      btns[ _("dlg_button_cancel") ] = function(){
        dlg.close();
      };

      const ADDITIONAL_SEARCH = [
        {
          title: "Google Images",
          url: "https://www.google.com/search?hl=en&site=imghp&tbm=isch&source=hp&q={simplehost}"
        },
        {
          title: "Icon Finder",
          url: " https://www.iconfinder.com/search/?q={simplehost}+icon"
        },
        {
          title: "Find Icons",
          url: "https://findicons.com/search/{simplehost}"
        },
        {
          title: "Icons Pedia",
          url: "https://www.iconspedia.com/search/{simplehost}/"
        }
      ];

      var currentOrder = "best";
      var currentPage = 0;
      var currentTotalPages = 0;
      var that = this;

      function _request( file, params, callback ){

        that.PicsUserPics.request( file, params, callback );

      }

      function _listImages( pageNum, order, callback ){

        _request( "listing.php", {
          p: pageNum,
          order: order,
          host: params.host
        }, callback );

      }

      function _report( sdPreviewId, type, callback ){

        _request( "report.php", {
          sdpreview_id: sdPreviewId,
          type: type
        }, callback );

      }

      function _setOrder( order ){
        if( fvdSpeedDial.Dialogs.PicsUserPics.currentXHR.length > 0 ){
          fvdSpeedDial.Dialogs.PicsUserPics.currentXHR.forEach(function( xhr ){
            xhr.abort();
          });

          fvdSpeedDial.Dialogs.PicsUserPics.currentXHR = [];
        }

        currentOrder = order;
        currentPage = 0;

        var container = document.querySelector("#dialogPicUserPics .picsContainer");
        var elems = document.querySelectorAll( "#dialogPicUserPics .head .order" );

        while( container.firstChild ){
          container.removeChild( container.firstChild );
        }

        for( var i = 0; i != elems.length; i++ ){
          var el = elems[i];
          el.removeAttribute("active");
        }

        document.querySelector( "#dialogPicUserPics .head .order." + order ).setAttribute("active", 1);

        _buildList();
      }

      function _showAdditionalSearch( found ){
        var container = document.querySelector("#dialogPicUserPics .picsContainer");

        if( !found ){

          var notFoundElem = document.createElement("div");

          notFoundElem.className = "notFound";
          notFoundElem.textContent = _("dialog_pick_user_pics_not_found");
          container.appendChild( notFoundElem );

        }

        var additionalSearch = document.createElement("div");
        additionalSearch.className = "additionalSearch";

        var title = document.createElement("div");
        title.textContent = _("dialog_pick_user_pics_not_found_title").replace("{host}", params.host);
        title.className = "title";

        additionalSearch.appendChild( title );

        var tmp = params.host.split(".");

        var hostSimple = params.host;

        if( tmp.length >= 2 ){
          hostSimple = tmp[ tmp.length - 2 ];
          if( hostSimple == "co" && tmp.length > 2 ){
            hostSimple = tmp[ tmp.length - 3 ];
          }
        }

        ADDITIONAL_SEARCH.forEach(function( item ){

          var elem = document.createElement("div");

          var a = document.createElement("a");
          a.textContent = item.title;
          a.setAttribute("href", item.url.replace("{host}", params.host).replace("{simplehost}", hostSimple));
          a.setAttribute("target", "_blank");

          elem.appendChild( a );

          additionalSearch.appendChild( elem );

        });

        container.appendChild( additionalSearch );

        var additionalHelpMessage = document.createElement("div");
        additionalHelpMessage.className = "additionalHelpMessage";
        var text = document.createElement( "span" );
        text.textContent = _("dialog_pick_user_pics_not_found_enter_in");

        additionalHelpMessage.appendChild( text );
        var img = document.createElement("div");
        img.className = "img";

        additionalHelpMessage.appendChild( img );

        container.appendChild( additionalHelpMessage );

      }

      function _buildList(){

        var container = document.querySelector("#dialogPicUserPics .picsContainer");

        if( container.querySelector("div.loading") ){
          return;
        }

        var loading = document.createElement("div");
        loading.className = "loading";

        container.appendChild( loading );

        _listImages( currentPage, currentOrder, function( error, data ){

          currentTotalPages = data.totalPages;

          container.removeChild( loading );

          if( error ){
            fvdSpeedDial.Dialogs.alert( _("dlg_alert_fail_obtain_user_pics_title"), _("dlg_alert_fail_obtain_user_pics_text") );
            return;
          }

          if( data.previews.length == 0 ){
            _showAdditionalSearch( false );
          }

          data.previews.forEach(function( preview ){
            var previewElem = that.PicsUserPics.buildElem( preview, {
              resultCallback: resultCallback,
              _report: _report
            }, dlg );

            container.appendChild( previewElem );

          });

          if( currentPage == currentTotalPages - 1 ){
            _showAdditionalSearch( true );
          }



        } );

      }


      var dlg = new Dialog({
        width: 735,
        title: this._title("pick_user_images"),
        content: fvdSpeedDial.Templates.getHTML("prototype_dialogPickUserPics"),
        buttons: btns,

        closeCallback: function(){
          if( resultCallback ){
            resultCallback( null );
          }
        },

        onShow: function( dlg ){

          [ "best", "new" ].forEach( function( order ){

            var elem = document.querySelector( "#dialogPicUserPics .head .order." + order );
            elem.addEventListener( "click", function(){
              _setOrder( order );
            } );

          } );

          _setOrder( currentOrder );

          var container = document.querySelector("#dialogPicUserPics .picsContainer");

          container.addEventListener( "scroll", function(){

            var remainScroll = container.scrollHeight - container.scrollTop - container.offsetHeight;

            if( remainScroll < 50 && currentPage < currentTotalPages - 1 ){
              if( container.querySelector("div.loading") ){
                return;
              }

              currentPage++;
              _buildList();
            }

          } );

          var bottomActions = dlg.container.querySelector(".dialog-actions");
          var reportBottomDesc = document.createElement("div");
          reportBottomDesc.setAttribute("id", "dialogPicUserPics_reportBottomDesc");

          var span1 = document.createElement("span");
          span1.textContent = _("dialog_pick_user_pics_bottom_desc_1");
          var span2 = document.createElement("span");
          span2.textContent = _("dialog_pick_user_pics_bottom_desc_2");
          var alertImg = document.createElement("img")          ;
          alertImg.setAttribute("src", "/images/screamer.png");

          reportBottomDesc.appendChild( span1 );
          reportBottomDesc.appendChild( alertImg );
          reportBottomDesc.appendChild( span2 );

          bottomActions.insertBefore( reportBottomDesc, bottomActions.firstChild );

        }
      });

    },

    setAutoUpdateBatch: function() {
      var btns = {};
      btns[_("dlg_button_save")] = function() {
        var interval = document.getElementById("dialogSetAutoUpdate_autoupdate_preview_interval").value + "|" +
                       document.getElementById("dialogSetAutoUpdate_autoupdate_preview_interval_type").value;
        fvdSpeedDial.Storage.setAutoUpdateGlobally({
          interval: interval
        }, function() {
          dlg.close();
          fvdSpeedDial.Dialogs.alert( _( "dlg_alert_dials_autoupdate_updated_title" ),
                                      _( "dlg_alert_dials_autoupdate_updated_text" ) );
        });
      };
      btns[_("dlg_button_cancel")] = function() {
        dlg.close();
      };
      var dlg = new Dialog({
        width: 300,
        title: this._title("set_autoupdate_batch"),
        content: fvdSpeedDial.Templates.getHTML("prototype_dialogSetAutoUpdate"),
        buttons: btns
      });

    },

    manageDeny: function(){
      var that = this;

      var btns = {};

      btns[_("dlg_button_add_deny_rule")] = function(){
        that.deny();
      }

      btns[_("dlg_button_close")] = function(){
        dlg.close();
      }

      var dlg = new Dialog({
        width: 600,
        title: that._title("manage_deny"),
        content: fvdSpeedDial.Templates.getHTML("prototype_dialogManageDeny"),
        buttons: btns,
        onShow: function(){
          that.ManageDeny.refresh();
        }
      });
    },

    ManageDeny: {
      refresh: function(){
        var oldContainer = document.getElementById( "denyUrlsContainer" );
        if(!oldContainer) {
          return;
        }
        var container = oldContainer.cloneNode(true);

        while( container.firstChild ){
          container.removeChild( container.firstChild );
        }

        fvdSpeedDial.Storage.denyList( function( data ){

          for( var i = 0; i != data.length; i++ ){
            var d = data[i];
            var tr = document.createElement( "tr" );
            var tdSign = document.createElement( "td" );
            var divSign = document.createElement( "div" );

            var tdType = document.createElement( "td" );
            var divType = document.createElement( "div" );

            var tdActions = document.createElement( "td" );
            var divActions = document.createElement( "div" );

            divSign.textContent = d.sign;
            tdType.textContent = d.type == "host" ? "domain" : d.type;
            var iconEdit = document.createElement( "div" );
            var iconRemove = document.createElement( "div" );
            iconEdit.className = "icon edit";
            iconRemove.className = "icon remove";
            divActions.className = "speedDialIcons";
            divActions.appendChild( iconEdit );
            divActions.appendChild( iconRemove );

            tdSign.appendChild( divSign );
            tdType.appendChild( divType );
            tdActions.appendChild( divActions );

            tr.appendChild(tdSign);
            tr.appendChild(tdType);
            tr.appendChild(tdActions);

            (function(d){
              // events
              iconRemove.addEventListener( "click", function(){
                fvdSpeedDial.Storage.removeDeny( d.id );
              }, false );

              iconEdit.addEventListener( "click", function(){
                fvdSpeedDial.Dialogs.deny( d );
              }, false );
            })(d);

            container.appendChild( tr );
          }

           oldContainer.parentNode.replaceChild( container, oldContainer );

        } );
      }
    },

    importExport: function( params ){

      var that = this;

      if( params.type == "export" ) {

        var btns = {};

        btns[_("dlg_button_copy_to_clipboard")] = function(){

          fvdSpeedDial.Utils.copyToClipboard(document.getElementById("importExportTextArea").value);

          dlg.showActionMessage( _("sah_copied") );

        };

        btns[_("dlg_button_close")] = function(){
          dlg.close();
        };

        var dlg = new Dialog({
          width: 400,
          title: that._title("export"),
          content: fvdSpeedDial.Templates.getHTML("prototype_dialogExport"),
          buttons: btns,
          onShow: function(){

            document.getElementById("dialogImportExportContainer").setAttribute( "type", "export" );

            fvdSpeedDial.Utils.Async.chain([
              function( callback, dataObject ){

                fvdSpeedDial.Storage.dump(function( data ){
                  dataObject.db = data;
                  callback();
                });

              },

              function( callback, dataObject ){

                fvdSpeedDial.Prefs.dump( function( data ){
                  dataObject.prefs = data;
                  callback();
                } );

              },

              function( callback, dataObject ){
                document.getElementById("importExportTextArea").value = JSON.stringify(dataObject);
              }
            ]);


          }
        });

      }
      else if( params.type == "import" ){
        var btns = {};
        var importInProcess = false;

        btns[_("dlg_button_import")] = function(){

          that.confirm( _("dlg_confirm_import_title"), _("dlg_confirm_import_text"), function( r ){

            if( r ){

              var importExportTextArea = document.getElementById( "importExportTextArea" );
              var text = importExportTextArea.value.trim();
              if( text == "" ){
                that.errorToField( importExportTextArea, document.body, _("error_must_be_filled") );
                return;
              }

              var importData = null;
              try{
                importData = JSON.parse(text);
                importData.db.dials;
                importData.db.groups;
                importData.db.deny;
                if( !importData.prefs ){
                  throw "";
                }
              }
              catch( ex ){
                try {
                  // try to translate import file
                  importData = fvdSpeedDial.importTranslate.translate(JSON.parse(text));
                  if(!importData) {
                    throw "";
                  }
                }
                catch(ex) {
                  that.errorToField( importExportTextArea, document.body, _("error_wrong_import_data") );
                  return;
                }
              }


              var importContainer = document.getElementById( "dialogImportExportContainer" );
              importContainer.setAttribute( "type", "importing" );

              // activate import chain

              var statusTextContainer = document.getElementById( "importingProcessState" );
              var groupsRelations = {}; // relations between groups ids in dump and imported groups IDS

              var countGroupsImported = 0;
              var countDialsImported = 0;

              fvdSpeedDial.RuntimeStore.set( "importing_in_process", true );

              fvdSpeedDial.Utils.Async.chain( [

                // step 1. Clear old data
                function( callback ){

                  importInProcess = true;

                  statusTextContainer.textContent =  _("dlg_importing_step1");

                  fvdSpeedDial.Utils.Async.chain([

                    function( callback2 ){
                      fvdSpeedDial.Storage.clearDials(callback2);
                    },
                    function( callback2 ){
                      fvdSpeedDial.Storage.clearDeny(callback2);
                    },
                    function(callback2){
                      fvdSpeedDial.Storage.clearGroups(callback2);
                    },
                    function(){
                      callback();
                    }

                  ]);

                },

                // step 2. Import prefs
                function( callback ){

                  statusTextContainer.textContent = _("dlg_importing_step2");

                  for( var k in importData.prefs ){
                    fvdSpeedDial.Prefs.set( k, importData.prefs[k] );
                  }

                  fvdSpeedDial.Options.refreshOptionValues(function(){
                    fvdSpeedDial.Options.applyChanges( function(){
                      callback();
                    } );
                  });


                },

                // step 3. Import deny
                function( callback ){
                  statusTextContainer.textContent = _("dlg_importing_step3");

                  if( importData.db.deny.length == 0 ){
                    callback();
                    return;
                  }

                  fvdSpeedDial.Utils.Async.arrayProcess( importData.db.deny, function( denyData, callback2 ){
                    try{
                      fvdSpeedDial.Storage.deny( denyData.type, denyData.sign, function(){
                        callback2();
                      } );
                    }
                    catch( ex ){
                      callback2();
                    }

                  }, function(){
                    callback();
                  } );

                },

                // step 4. Import groups

                function( callback ){
                  statusTextContainer.textContent = _("dlg_importing_step4");

                  fvdSpeedDial.Utils.Async.arrayProcess( importData.db.groups, function( group, callback2 ){
                    try{
                      fvdSpeedDial.Storage.groupExists( {
                        name: group.name
                      }, function( exists ){
                        if( exists ){
                          callback2();
                        }
                        else{
                          if( group.name && group.position ){
                            fvdSpeedDial.Storage.groupAdd( {
                              name: group.name,
                              position: group.position,
                              sync: 1,
                              global_id: group.global_id
                            }, function( result ){
                              if( result.result ){
                                countGroupsImported++;
                                groupsRelations[ group.id ] = result.id;
                              }

                              callback2();

                            } );
                          }
                          else{
                            callback2();
                          }
                        }
                      } );

                    }
                    catch( ex ){
                      callback2();
                    }

                  }, function(){
                    callback();
                  } );
                },

                // step 5. Import dials

                function( callback ){
                  statusTextContainer.textContent = _("dlg_importing_step5");

                  fvdSpeedDial.Utils.Async.arrayProcess( importData.db.dials, function( dial, callback2 ){

                      if(dial.id) delete dial.id; // Task #1314

                    if( dial.url && dial.thumb_source_type && dial.group_id && dial.position && groupsRelations[dial.group_id] ){

                      try{
                        var dialData = {

                        };

                        dial.group_id = groupsRelations[dial.group_id];

                        if( dial.screen_maked == 1 ){
                          dial.screen_maked = 0; // screen not transfered and need to remake
                        }

                        fvdSpeedDial.Storage.addDial(
                          dial,
                          function( result ){

                            if( result.result ){
                              countDialsImported++;

                              if( dial.thumb_source_type == "url" && dial.thumb_url ){

                                fvdSpeedDial.ThumbMaker.getImageDataPath({
                                  imgUrl: dial.thumb_url,
                                  screenWidth: fvdSpeedDial.SpeedDial.getMaxCellWidth()
                                }, function(dataUrl){

                                  fvdSpeedDial.Storage.updateDial( result.id, {
                                    thumb: dataUrl
                                  }, function(){
                                    callback2();
                                  } );

                                });

                              }
                              else{
                                callback2();
                              }
                            }
                            else{
                              callback2();
                            }



                          }
                        );
                      }
                      catch( ex ){
                        callback2();
                      }

                    }
                    else{
                      callback2();
                    }


                  }, function(){
                    callback()
                  } );
                },

                // finish step

                function(){

                  statusTextContainer.textContent = _("dlg_importing_finished")
                                    .replace( "%groups%", countGroupsImported )
                                    .replace( "%dials%", countDialsImported );

                  importContainer.setAttribute("type", "success");

                  importInProcess = false;
                  fvdSpeedDial.RuntimeStore.set( "importing_in_process", false );

                  fvdSpeedDial.Sync.importFinished();

                    fvdSpeedDial.SpeedDial.refreshAllDialsInGroup(); // Task #1314

                }

              ] );

            }

          } );

        };

        btns[_("dlg_button_close")] = function(){
          if( !importInProcess ){
            dlg.close();
          }
          else{
            fvdSpeedDial.Dialogs.alert( _("dlg_alert_wait_importing_title"), _("dlg_alert_wait_importing_text") );
          }
        };

        var dlg = new Dialog({
          width: 400,
          title: that._title("import"),
          content: fvdSpeedDial.Templates.getHTML("prototype_dialogExport"),
          buttons: btns,
          onShow: function(){
            document.getElementById("dialogImportExportContainer").setAttribute( "type", "import" );
          },
          clickCallback: function(){
            that.hideErrorBox();
          },
          closeCallback: function(){
            that.hideErrorBox();
          }
        });
      }

    },

    viewGroup: function( host ){
      var that = this;

      that.ViewGroup.currentHost = host;

      var btns = {};
      btns[_("dlg_button_close")] = function(){
        dlg.close();
      }

      var dlg = new Dialog({
        width: 400,
        title: that._title("view_group"),
        content: fvdSpeedDial.Templates.getHTML("prototype_dialogViewGroup"),
        buttons: btns,
        onShow: function(){

          that.ViewGroup.rebuild();

          // set events

          document.getElementById("dialogViewGroup_typeTitle").addEventListener( "click", function(){
            fvdSpeedDial.Dialogs.ViewGroup.changeType();
          }, false );
          document.getElementById("dialogViewGroup_typeUrl").addEventListener( "click", function(){
            fvdSpeedDial.Dialogs.ViewGroup.changeType();
          }, false );

        }
      });

      that.ViewGroup.currentDlg = dlg;
    },

    ViewGroup: {
      currentHost: null,
      currentDlg: null,

      rebuild: function(){

        var that = this;

        fvdSpeedDial.Storage.MostVisited.getDataByHost( fvdSpeedDial.SpeedDial.currentGroupId(), this.currentHost, function( data ){

          var container = document.getElementById( "dialogViewGroup_urlContainer" );

          while( container.firstChild ){
            container.removeChild( container.firstChild );
          }

          for( var i = 0; i != data.length; i++ ){
            var url = document.createElement( "a" );
            url.setAttribute( "class", "url" );
            url.setAttribute( "_url", data[i].url );
            url.setAttribute( "href", data[i].url );
            url.setAttribute( "_title", data[i].title );
            url.setAttribute( "id", "mostvisitedInGroupUrl_" + data[i].id );

            var favicon = document.createElement( "img" );
            favicon.setAttribute( "src", "chrome://favicon/"+data[i].url );
            favicon.setAttribute( "width", 16 );


            var divText = document.createElement( "div" );
            divText.className = "text";
            divText.textContent = data[i].title

            var divHits = document.createElement( "div" );
            divHits.className = "hits";
            divHits.textContent = data[i].visitCount;

            url.appendChild( favicon );
            url.appendChild( divText );
            url.appendChild( divHits );

            /*
            (function(i){
              url.addEventListener( "click", function( event ){
                fvdSpeedDial.Utils.Opener.asClicked( data[i].url, fvdSpeedDial.Prefs.get( "sd.default_open_in" ), event );
              }, false );
            })(i);
            */

            fvdSpeedDial.ContextMenus.assignToElem( url, "mostvisitedGroupUrl" );

            container.appendChild( url );
          }

          document.querySelector( "[name=dialogViewGroup_viewType][value=" + fvdSpeedDial.Prefs.get("sd.most_visited.group_view_type") + "]" ).checked = true;

          that.changeType();

        } );



      },

      changeType: function(){

        var container = document.getElementById( "dialogViewGroup_urlContainer" );

        var type = document.querySelector( "[name=dialogViewGroup_viewType]:checked" ).value;
        var altType = type == "url" ? "title" : "url";

        fvdSpeedDial.Prefs.set("sd.most_visited.group_view_type", type);

        var elems = container.getElementsByClassName( "url" );

        for( var i = 0; i != elems.length; i++ ){

          var textItem = elems[i].getElementsByClassName("text")[0];
          var item = elems[i];

          textItem.textContent = item.getAttribute( "_" + type );
          item.setAttribute( "title", item.getAttribute( "_" + altType ) );

        }

      }
    },

    deny: function( settings ){
      settings = settings || {
        "type": "host",
        "sign": ""
      };

      var that = this;

      var btns = {};

      btns[_("dlg_button_deny")] = function(){

        var type = that.Deny.currentType();
        var signBox = document.getElementById( "dialogDeny_sign" );
        var sign = signBox.value;

        if( !sign ){
          that.errorToField( signBox, document.body, _("error_must_be_filled") );
          return false;
        }

        if( type == "url" ){
          if( !fvdSpeedDial.Utils.isValidUrl( sign ) ){
            sign = fvdSpeedDial.SpeedDialMisc.addProtocolToURL(sign);
          }
        }

        if( settings.id ){
          // edit deny
          fvdSpeedDial.Storage.editDeny(settings.id, {
            sign: sign,
            type: type
          }, function( result ){
            if( result.result ){
              dlg.close();
            }
            else{
              if( result.error == "deny_already_exists" ){
                that.errorToField( signBox, document.body, _("error_already_exists") );
              }
            }
          });
        }
        else{
          fvdSpeedDial.Storage.deny( type, sign, function( result ){
            if( result.result ){
              dlg.close();
            }
            else{
              if( result.error == "deny_already_exists" ){
                that.errorToField( signBox, document.body, _("error_already_exists") );
              }
            }
          } );
        }


      };

      btns[_("dlg_button_cancel")] = function(){
        dlg.close()
      };

      var historyComplete = null;

      var dlg = new Dialog({
        width: 400,
        title: settings.id ? that._title("edit_deny") : that._title("deny"),
        content: fvdSpeedDial.Templates.getHTML("prototype_dialogDeny"),
        buttons: btns,

        enterOnButton: _("dlg_button_deny"),

        clickCallback: function(){
          that.hideErrorBox();
        },
        closeCallback: function(){
          historyComplete.destroy();
          that.hideErrorBox();
        },
        onShow: function(){
          var denyHostRadio = document.getElementById( "dialogDeny_denyHost" );
          var denyURLRadio = document.getElementById( "dialogDeny_denyURL" );
          var signBox = document.getElementById( "dialogDeny_sign" );

          historyComplete = fvdSpeedDial.HistoryComplete.create( signBox );

          if( settings.type == "host" ){
            denyHostRadio.setAttribute( "checked", true );
          }
          else if( settings.type == "url" ){
            denyURLRadio.setAttribute( "checked", true );
          }

          signBox.setAttribute( "value", settings.sign );

          that.Deny.changeType();

          // set events
          document.getElementById("dialogDeny_denyHost").addEventListener( "click", function(){
            fvdSpeedDial.Dialogs.Deny.changeType();
          }, false );

          document.getElementById("dialogDeny_denyURL").addEventListener( "click", function(){
            fvdSpeedDial.Dialogs.Deny.changeType();
          }, false );

          document.getElementById("dialogDeny_sign").focus();

        }
      });

    },

    Deny: {
      currentType: function(){
        var denyHostRadio = document.getElementById( "dialogDeny_denyHost" );
        var denyURLRadio = document.getElementById( "dialogDeny_denyURL" );

        var currentType = null;

        if( denyHostRadio.checked ){
          currentType = "host";
        }
        else if( denyURLRadio.checked ){
          currentType = "url";
        }

        return currentType;
      },

      changeType: function(){
        var currentType = this.currentType();

        var signBox = document.getElementById( "dialogDeny_sign" );

        var currUrl = signBox.value;

        if( currentType == "url" ){
          if( signBox.hasAttribute( "urlValue" ) && signBox.getAttribute( "urlValue" ) ){
            currUrl = signBox.getAttribute( "urlValue" );
          }
          signBox.value = currUrl;
        }
        else if( currentType == "host" ){
          signBox.setAttribute( "urlValue", currUrl );

          var host = fvdSpeedDial.Utils.parseUrl( currUrl, "host" );
          if( !host ){
            host = signBox.value;
          }
          signBox.value = host;
        }

      },

    },

    manageGroups: function( dialogParams ){
      dialogParams = dialogParams || {};

      var that = this;

      var btns = {};

      btns[_("dlg_button_save")] = function(){
        dlg.getMainButton().setAttribute( "loading", 1 );

        var groups = fvdSpeedDial.Dialogs.ManageGroups.currentGroupsList();
        var groupIds = [], groupsProcessed = [];
        for( var i = 0; i != groups.length; i++ ){
            if(groupIds.indexOf())
          groupIds.push( parseInt(groups[i].id) );
        }
        fvdSpeedDial.Storage.groupsList(function( currentGroups ){
          var positionsFunction = function(){
            fvdSpeedDial.Utils.Async.arrayProcess( JSON.parse(JSON.stringify(groups)), function( group, arrayProcessCallback ){
            //fvdSpeedDial.Utils.Async.eachSeries(groups, function(group, arrayProcessCallback) {
              if( group.id.toString().indexOf( "new_" ) === 0 ) {
                if(groupsProcessed.indexOf(group.id) === -1) groupsProcessed.push(group.id); // Task #1306
                else{
                    console.warn('duplicate group', group);
                    return;
                }
                fvdSpeedDial.Storage.groupAdd( {
                  name: group.name,
                  sync: group.sync,
                  position: group.position
                }, function( result ){
                  console.log("added group", group);

                  if( result.result ){
                    fvdSpeedDial.Sync.addDataToSync( {
                      category: ["groups", "newGroups"],
                      data: result.id,
                      translate: "group"
                    } );
                  }

                  arrayProcessCallback();

                } );
              }
              else{
                fvdSpeedDial.Storage.groupUpdate( group.id, {
                  position: group.position,
                  name: group.name,
                  sync: group.sync
                }, function(){

                  fvdSpeedDial.Sync.addDataToSync( {
                    category: "groups",
                    data: group.id,
                    translate: "group"
                  } );
                  arrayProcessCallback();

                } );
              }

            }, function(){
              fvdSpeedDial.SpeedDial.sheduleRebuildGroupsList();
              if( dialogParams.callback ){
                dialogParams.callback( true );
              }

              dlg.getMainButton().setAttribute( "loading", 0 );

              dlg.close();
            } );

          }

          var groupsIdsToRemove = [];

          for( var i = 0; i != currentGroups.length; i++ ){
            var currentGroup = currentGroups[i];

            if (groupIds.indexOf(currentGroup.id) == -1) {
              groupsIdsToRemove.push( currentGroup.id );
            }
          }

          if( groupsIdsToRemove.length > 0 ){
            for( var i = 0; i != groupsIdsToRemove.length; i++ ){
              (function(i){
                // remove group
                fvdSpeedDial.SpeedDial.removeGroup( groupsIdsToRemove[i], function(){

                  if( i == groupsIdsToRemove.length - 1 ){
                    positionsFunction();
                  }

                }, {
                  noConfirmIfHaveDials: true
                } );
              })(i);
            }
          }
          else{
            positionsFunction();
          }




        });

          $(dlg.body).find('button').attr("disabled","disabled"); // Task #1306
          $(dlg.body).find('.icons').remove(); // Task #1306
      }

      btns[ _("dlg_button_cancel") ] = function(){
        if( dialogParams.callback ){
          dialogParams.callback( false );
        }
        dlg.close();
      }

      var leftBtns = {};

      leftBtns[ _("dlg_manage_groups_add_group") ] = function(){

        fvdSpeedDial.Dialogs.ManageGroups.addGroup();

      }



      var dlg = new Dialog({
        width: 400,
        title: that._title("manage_groups"),
        content: fvdSpeedDial.Templates.getHTML("prototype_dialogManageGroups"),
        buttons: btns,
        leftButtons: leftBtns,
        clickCallback: function(){
          that.hideErrorBox();
        },
        closeCallback: function(){
          that.hideErrorBox();
            if(typeof fvdSpeedDial.SpeedDial.Scrolling == "object"){
                fvdSpeedDial.SpeedDial.Scrolling.manageGroupsDialogOpen = false;
            }
        },
        onShow: function(){
          fvdSpeedDial.Storage.groupsList( function( groups ){

            var container = document.getElementById( "dialogManageGroups_groupsList" );

            for( var i = 0; i != groups.length; i++ ){

              var dbGroup = groups[i];

              var group = fvdSpeedDial.Dialogs.ManageGroups.buildGroupItem( dbGroup );

              container.appendChild( group );

            }

            setTimeout(function(){
              fvdSpeedDial.Dialogs.ManageGroups.refreshGroupsListDrag();
            }, 0);

          } );

            if(typeof fvdSpeedDial.SpeedDial.Scrolling == "object"){
                fvdSpeedDial.SpeedDial.Scrolling.manageGroupsDialogOpen = true;
            }
        }
      });


    },

    ManageGroups: {
      newIdNum: 0,

      buildGroupItem: function( dbGroup ){

        var group = document.createElement( "div" );

        var textDiv = document.createElement( "div" );

        var spanName = document.createElement( "span" );
        spanName.className = "groupName";
        spanName.textContent = dbGroup.name;

        var spanCount = document.createElement( "span" );
        spanCount.className = "groupDialsCount";
        spanCount.textContent = " ("+dbGroup.count_dials+")";

        textDiv.appendChild( spanName );
        textDiv.appendChild( spanCount );

        textDiv.className = "text";
        group.appendChild( textDiv );

        var divIcons = document.createElement( "div" );
        divIcons.className = "icons";

        var iconRemove = document.createElement( "div" );
        iconRemove.className = "iconRemove";

        var iconEdit = document.createElement( "div" );
        iconEdit.className = "iconEdit";

        divIcons.appendChild(iconRemove);
        divIcons.appendChild(iconEdit);

        group.appendChild( divIcons );
        (function( group, dbGroup ){
          iconRemove.addEventListener( "mousedown", function( event ){
            fvdSpeedDial.Dialogs.ManageGroups.removeFromList( group );

            event.stopPropagation();
          }, false );

          iconEdit.addEventListener( "mousedown", function( event ){

            fvdSpeedDial.Dialogs.ManageGroups.editGroupById( dbGroup.id );

            event.stopPropagation();

          }, false );

        })( group, dbGroup );



        group.id = "group_" + dbGroup.id;
        group.setAttribute( "sync", dbGroup.sync );
        group.className = "group";

        fvdSpeedDial.ContextMenus.assignToElem( group, "speeddialManageGroups" );

        return group;

      },

      addGroup: function(){

        var currentGroups = fvdSpeedDial.Dialogs.ManageGroups.currentGroupsList();
        var groupsNames = [];

        for( var i = 0; i != currentGroups.length; i++ ){
          groupsNames.push( currentGroups[i].name );
        }

        fvdSpeedDial.Dialogs.addGroup(null, {
          commitToCallback: function( dialogResult ){
            if(dialogResult.result) {
              fvdSpeedDial.Dialogs.ManageGroups.addGroupToList( dialogResult.data );
            }
          },
          existsGroupsNames: groupsNames
        });

      },

      addGroupToList: function( dbGroup ){

        this.newIdNum++;

        dbGroup.count_dials = 0;
        dbGroup.id = "new_" + this.newIdNum;
        var group = this.buildGroupItem( dbGroup );

        var container = document.getElementById( "dialogManageGroups_groupsList" );
        if(dbGroup.addPosition === "top" && container.firstChild) {
          container.insertBefore(group, container.firstChild);
        }
        else {
          container.appendChild(group);
        }

        this.refreshGroupsListDrag();

      },

      refreshGroupsListDrag: function(){

        var container = document.getElementById( "dialogManageGroups_groupsList" );

        var items = [];

        var els = document.querySelectorAll( "#dialogManageGroups_groupsList .group" );

        for( var i = 0; i != els.length; i++ ){
          var el = els[i];

          items.push( el );
        }


        fvdSpeedDial.DragLists.startDragFor( container, items, null, "group" );

      },

      editGroupById: function( groupId ){

        var currentGroups = fvdSpeedDial.Dialogs.ManageGroups.currentGroupsList();
        var groupsNames = [];
        var initData = {};
        for( var i = 0; i != currentGroups.length; i++ ){
          if( currentGroups[i].id != groupId ){
            groupsNames.push( currentGroups[i].name );
          }
          else{
            initData = currentGroups[i];
          }
        }

        fvdSpeedDial.Dialogs.addGroup(groupId, {
          commitToCallback: function( dialogResult ){
            if( dialogResult.result ){

              fvdSpeedDial.Dialogs.ManageGroups.setGroup( groupId, dialogResult.data );

            }
          },
          existsGroupsNames: groupsNames,
          initData: initData
        });

      },

      setGroup: function( groupId, group ){
        var groupElem = document.getElementById( "group_"+groupId );
        var spanName = groupElem.getElementsByClassName( "groupName" )[0];
        spanName.textContent = group.name;
        groupElem.setAttribute( "sync", group.sync );
      },

      removeFromList: function( group ){
        var groups = group.parentNode.getElementsByClassName( "group" );
        if( groups.length == 1 ){
          fvdSpeedDial.Dialogs.alert(_("dlg_alert_cannot_remove_group_title"), _("dlg_alert_cannot_remove_group_text"));

          return false;
        }

        function hide(){

          group.style.webkitTransitionDuration = "200ms";
          group.style.webkitTransitionProperty = "opacity";
          group.style.opacity = 0;

          group.addEventListener( "webkitTransitionEnd", function( event ){
            group.parentNode.removeChild( group );

          }, false );

        }

        var groupId = group.getAttribute("id").replace("group_", "");

        fvdSpeedDial.Storage.getGroup(groupId, function(group){
          if (group != null) {

            if ( group.count_dials == 0 ) {
              hide();
            }
            else {
              fvdSpeedDial.Dialogs.confirm(_("dlg_confirm_remove_group_title"), _("dlg_confirm_remove_group_text").replace("%count%", group.count_dials), function(result){

                if (result) {
                  hide();
                }

              });
            }

          }
          else{
            hide();
          }
        });

      },

      currentGroupsList: function(){
        var groups = [], groupsIds = [];

        // first get list of groups
        var elems = document.getElementById("dialogManageGroups_groupsList").getElementsByClassName( "group" );

        for( var i = 0; i != elems.length; i++ ){
            var id = elems[i].getAttribute("id").replace("group_", "");

            if(groupsIds.indexOf(String(id)) !== -1) continue; // Task #1306
            else groupsIds.push(String(id))

            var name = elems[i].getElementsByClassName("groupName")[0].textContent;
            var position = i + 1;

            groups.push( {
                id: id,
                name: name,
                position: position,
                sync: elems[i].getAttribute( "sync" )
            } );
        }

        return groups;
      }


    },

    setGroupNoSyncDialog: function( callback ){

      if( _b( fvdSpeedDial.Prefs.get( "sd.display_nosync_group_dialog" ) ) ){

        fvdSpeedDial.Dialogs.confirmCheck( _("dlg_nosync_group_title"), _("dlg_nosync_group_text"), _("dlg_dont_show_it_again"), false, function(r, state){

          if( r ){
            if( state ){
              fvdSpeedDial.Prefs.set( "sd.display_nosync_group_dialog", false );
            }
          }

          callback(r);

        } );

      }
      else{
        callback( true );
      }

    },

    moveDialToNoSyncGroupDialog: function( callback ){

      fvdSpeedDial.Utils.Async.chain( [
        function( chainCallback ){

          fvdSpeedDial.Sync.syncAddonExists( function( exists ){

            if( exists ){
              chainCallback();
            }
            else{
              callback( true );
            }

          });

        },

        function(){

          // display dialog if need
          if( _b( fvdSpeedDial.Prefs.get( "sd.display_move_to_nosync_group_dialog" ) ) ){

            fvdSpeedDial.Dialogs.confirmCheck( _("dlg_move_to_nosync_group_title"), _("dlg_move_to_nosync_group_text"), _("dlg_dont_show_it_again"), false, function(r, state){

              if( r ){
                if( state ){
                  fvdSpeedDial.Prefs.set( "sd.display_move_to_nosync_group_dialog", false );
                }
              }

              callback( r );

            } );

          }
          else{
            callback( true );
          }

        }
      ] );



    },

    addGroup: function(groupId, dialogParams) {

      var btns = {};

      var initData = {};

      var bounce = false; // Task #1877

      var buttonAddModifyText = _("dlg_button_add_group");
      if( groupId ){
        var buttonAddModifyText = _("dlg_button_modify_group");
      }

      btns[buttonAddModifyText] = function() {
        if( bounce ){ // Task #1877
          console.info('Bounce', bounce);
          return;
        }else{
          bounce = true;
          setTimeout(()=>{
            bounce = false;
          }, 750);
        }

        var nameElem = document.getElementById( "addGroup_name" );
        var name = nameElem.value.trim();

        if(!name) {
          that.errorToField( nameElem, document.body, _("error_must_be_filled") );
          return false;
        }

        var addPosition;
        if(document.getElementById('addGroup_addToTop').checked) {
          addPosition = "top";
        }
        else {
          addPosition = "bottom";
        }
        if(!groupId) {
          fvdSpeedDial.Prefs.set('sd.add_group_position_default', addPosition);
        }

        var sync = document.getElementById("addGroup_sync").checked ? 1 : 0;

        if(dialogParams && dialogParams.commitToCallback) {
          if( dialogParams.existsGroupsNames ){
            var nameLC = name.toLowerCase();
            for( var i = 0; i != dialogParams.existsGroupsNames.length; i++ ){
              if( dialogParams.existsGroupsNames[i].toLowerCase() == nameLC ){
                that.errorToField( nameElem, document.body, _("error_already_exists") );
                return false;
              }
            }
          }

          dialogParams.commitToCallback({
            result: true,
            data: {
              addPosition: addPosition,
              name: name,
              sync: sync
            }
          });

          dlg.close();
        }
        else {
          fvdSpeedDial.Storage.groupExists( {
            name: name,
            excludeIds: groupId ? [groupId] : null
          }, function(exists) {
            if(exists) {
              that.errorToField( nameElem, document.body, _("error_already_exists") );
              return false;
            }
            else{
              if(groupId) {
                fvdSpeedDial.Utils.Async.chain( [
                  function(chainCallback) {
                    if(sync == 1 || initData.sync == 0) {
                      chainCallback();
                      return;
                    }
                    fvdSpeedDial.Dialogs.setGroupNoSyncDialog(function(set) {
                      if(set) {
                        chainCallback();
                      }
                    });
                  },
                  function() {
                    fvdSpeedDial.Storage.groupUpdate(groupId, {
                      name: name,
                      sync: sync
                    }, function(){
                      fvdSpeedDial.SpeedDial.sheduleRebuildGroupsList();
                      dlg.close();
                    } );

                    fvdSpeedDial.Sync.addDataToSync( {
                      category: "groups",
                      data: groupId,
                      translate: "group"
                    } );
                  }
                ] );
              }
              else {
                fvdSpeedDial.Storage.groupAdd({
                  name: name,
                  sync: sync,
                  forcePosition: addPosition
                }, function(result) {
                  if(result.result) {
                    fvdSpeedDial.Sync.addDataToSync({
                      category: ["groups", "newGroups"],
                      data: result.id,
                      translate: "group"
                    });
                    if(addPosition === "top") {
                      // need to add all groups to sync
                      fvdSpeedDial.Storage.groupsRawList({}, function(groups) {
                        groups.forEach(function(group) {
                          if(group.id === result.id) {
                            return;
                          }
                          fvdSpeedDial.Sync.addDataToSync({
                            category: ["groups"],
                            data: group.global_id,
                          });
                        });
                      });
                    }
                    fvdSpeedDial.SpeedDial.setCurrentGroupId(result.id);
                    dlg.close();
                  }
                });
              }
            }
          });
        }
      };

      btns[_("dlg_button_cancel")] = function() {
        if(dialogParams && dialogParams.commitToCallback){
          dialogParams.commitToCallback({
            result: false
          });
        }
        dlg.close();
      };

      var that = this;

      var dlg = new Dialog({
        width: 400,
        title: groupId ? this._title("modify_group") : this._title("add_group"),
        content: fvdSpeedDial.Templates.getHTML("prototype_dialogAddGroup"),
        buttons: btns,
        clickCallback: function(){
          that.hideErrorBox();
        },
        closeCallback: function(){
          that.hideErrorBox();
        },
        onShow: function() {
          var positionFieldContainer = document.getElementById('addGroup_addPositionContainer');
          if(groupId) {
            fvdSpeedDial.Utils.Async.chain([

              function( chainCallback ){
                if( dialogParams && dialogParams.initData ){
                  initData = dialogParams.initData;
                  chainCallback();
                }
                else{
                  fvdSpeedDial.Storage.getGroup( groupId, function( group ){

                    initData = group;
                    chainCallback();

                  } );
                }
              },

              function() {
                document.getElementById( "addGroup_name" ).value = initData.name;
                if( initData.sync == 1 ){
                  document.getElementById( "addGroup_sync" ).checked = true;
                }
              }
            ]);
            positionFieldContainer.setAttribute('hidden', 1);
          }
          else {
            positionFieldContainer.removeAttribute('hidden');
          }
          if(fvdSpeedDial.Prefs.get('sd.add_group_position_default') === 'top') {
            document.getElementById('addGroup_addToTop').checked = true;
          }
          else {
            document.getElementById('addGroup_addToBottom').checked = true;
          }
          document.getElementById("addGroup_name").focus();
        },
        enterOnButton: buttonAddModifyText
      });

    },

    AddGroup: {

      clickSync: function(){

        fvdSpeedDial.Sync.syncAddonExists( function( exists ){

          if( !exists ){
            var cb = document.getElementById("addGroup_sync");
            cb.checked = !cb.checked;
            fvdSpeedDial.Dialogs.installFVDSync();
          }

        } );

      }

    },

    installFVDSync: function(){

      var btns = {};

      btns[_("dlg_button_close")] = function(){
        dlg.close();
      };

      var dlg = new Dialog({
        width: 400,
        title: this._title("install_fvd_sync"),
        content: fvdSpeedDial.Templates.getHTML("prototype_dialogInstallSync"),
        buttons: btns,
        enterOnButton: _("dlg_button_close")
      });

    },


    // if dialId is specified is modifying

    addDial: function( dialData, type, forceAdd, _callback ){
      var dialId = null;

      type = type || "speeddial";

      if( type == "speeddial" && !forceAdd && dialData ){
        dialId = dialData.id;
      }
      if( type == "mostvisited" && !forceAdd ){
        dialId = dialData.id;
      }

      var btns = {};
      var that = this;

      var buttonAddModifyText = _("dlg_button_add_dial");
      if( dialId ){
        var buttonAddModifyText = _("dlg_button_modify_dial");
      }

      function setupPickFrom(){

        function buildUrlsListing( urls ){

          var listingContianer = document.createElement("div");
          listingContianer.className = "toolTipUrlsList";

          urls.forEach(function( item ){

            var u = document.createElement("div");
            u.className = "elem";
            var uUrl = document.createElement("div");
            uUrl.className = "url";
            var uTitle = document.createElement("div");
            uTitle.className = "title";

            uTitle.textContent = item.title;
            uUrl.textContent = item.url;

            u.appendChild( uTitle );
            u.appendChild( uUrl );

            u.addEventListener("click", function(){

              document.getElementById("addDialog_url").value = item.url;
              document.getElementById("addDialog_title").value = item.title;
              document.getElementById("addDialog_title").removeAttribute("autotext");

              fvdSpeedDial.ToolTip.close();

            });

            listingContianer.appendChild( u );

          });

          return listingContianer;

        }

        var pickFromTabs = document.getElementById("addDialog_pickFromOpenedTabs");
        var pickFromMostvisited = document.getElementById("addDialog_pickFromMostVisited");
        var pickFromMostPopular = document.getElementById("addDialog_pickFromMostPopular");

        pickFromMostPopular.addEventListener( "click", function( event ){
          that.PicsUserPics.request( "country_top.php", {

          }, function( error, data ){

            if( error ){
              return;
            }

            var items = [];

            data.domains.forEach(function( domain ){

              items.push({
                url: fvdSpeedDial.SpeedDialMisc.addProtocolToURL(domain),
                title: domain
              });

            });

            fvdSpeedDial.ToolTip.display( pickFromMostPopular, buildUrlsListing(items), event );

          } );

        });

        pickFromTabs.addEventListener( "click", function( event ){

          chrome.tabs.query( {}, function(_tabs){

            var tabs = [];

            _tabs.forEach(function( tab ){

              if( tab.url.indexOf( "http" ) !== 0 ){
                return;
              }

              if( !tab.title ){
                tab.title = "...";
              }

              tabs.push( tab );

            });

            if( tabs.length > 0 ){
              fvdSpeedDial.ToolTip.display( pickFromTabs, buildUrlsListing(tabs), event );
            }

          } );

        } );

        pickFromMostvisited.addEventListener( "click", function( event ){

          fvdSpeedDial.Storage.MostVisited.getData( {
            interval: "month",
            type: "host",
            count: 25
          }, function( _tabs ){

            var tabs = [];

            _tabs.forEach(function( tab ){

              if( !tab.title ){
                return;
              }

              tabs.push( tab );

            });

            if( tabs.length > 0 ){
              fvdSpeedDial.ToolTip.display( pickFromMostvisited, buildUrlsListing(tabs), event );
            }

          }); // max count


        } );

      }

      btns[ buttonAddModifyText ] = function(){

        // check if need grab img
        var backgroundUrl = "";
        if( !document.getElementById( "addDialog_image_url" ).hasAttribute("autoText") ){
          backgroundUrl = document.getElementById( "addDialog_image_url" ).value;
        }

        // check fields
        var url = document.getElementById( "addDialog_url" ).value.trim();
        var title = document.getElementById( "addDialog_title" ).value.trim();
        var groupValue = document.getElementById("addDialog_group").value;
        var groupNameNode = document.getElementById("addDialog_groupName");
        var groupName = groupNameNode.value.trim();
        var customPreviewCheckbox = document.getElementById( "addDialog_useCustomPreview" );
        var manualPreviewRadio = document.getElementById("addDialog_useManualPreview");
        var autoPreviewRadio = document.getElementById("addDialog_useAutoPreview");
        var autoPreviewUpdateEnabled = document.getElementById("addDialog_autoupdate_preview_enable").checked;
        var autoPreviewUpdateInterval = parseInt(document.getElementById("addDialog_autoupdate_preview_interval").value, 10);
        var autoPreviewUpdateIntervalType = document.getElementById("addDialog_autoupdate_preview_interval_type").value;
        var updateInterval = "";
        if(!autoPreviewRadio.checked || isNaN(autoPreviewUpdateInterval)) {
          autoPreviewUpdateEnabled = false;
        }
        if(autoPreviewUpdateEnabled) {
          updateInterval = autoPreviewUpdateInterval + "|" + autoPreviewUpdateIntervalType;
        }
        var screenDelay = 0;//not used now /*document.getElementById("addDialog_screenDelay").value;*/
        if( !url ){
          that.errorToField( document.getElementById( "addDialog_url" ), document.body, _("error_must_be_filled") );
          return false;
        }
        if( !fvdSpeedDial.Utils.isValidUrl( url ) ){
          //that.errorToField( document.getElementById( "addDialog_url" ), document.body, _("error_invalid_url") );
          //return false;
          url = fvdSpeedDial.SpeedDialMisc.addProtocolToURL(url);
          if( !fvdSpeedDial.Utils.isValidUrl( url ) ){
            that.errorToField( document.getElementById( "addDialog_url" ), document.body, _("error_invalid_url") );
            return false;
          }
        } else {
          url = fvdSpeedDial.SpeedDialMisc.changeProtocolToHTTPS(url);
        }
        var getScreenMethod = "auto";
        if( customPreviewCheckbox.checked ){
          getScreenMethod = "custom";
        }
        else if( manualPreviewRadio.checked ){
          getScreenMethod = "manual";
        }
        function sdUserPicsPreviewsAfterAdd(){
          if( getScreenMethod == "custom" && fvdSpeedDial.Dialogs.AddDial.pickedUserPreview ){
            if( fvdSpeedDial.Dialogs.AddDial.pickedUserPreview.url == backgroundUrl ){
              fvdSpeedDial.Dialogs.PicsUserPics.rate( fvdSpeedDial.Dialogs.AddDial.pickedUserPreview.id );
            }
          }
        }
        var afterTitle = function(){
          if (type == "speeddial") {

            if (groupValue == 0 && !groupName) {
              that.errorToField(groupNameNode, document.body, _("error_must_be_filled"));
              return false;
            }

            var getGroupValue = function(callback){
              if (groupValue == 0) {
                // check if group exists
                fvdSpeedDial.Storage.groupExists({
                  name: groupName
                }, function(exists) {
                  if (exists) {
                    that.errorToField(groupNameNode, document.body, _("error_already_exists"));
                  }
                  else {
                    // add group
                    fvdSpeedDial.Storage.groupAdd({
                      name: groupName,
                      sync: 1
                    }, function(result){
                      if (result.result) {
                        fvdSpeedDial.Sync.addDataToSync( {
                          category: ["groups", "newGroups"],
                          data: result.id,
                          translate: "group"
                        } );
                        callback(result.id);
                      }
                    });
                  }
                });
              }
              else {
                callback(groupValue);
              }
            };

            // check deny
            fvdSpeedDial.Storage.isDenyUrl(url, function(deny, denyDetails){
              if (deny) {

                that.errorToField(document.getElementById("addDialog_url"), document.body, _("error_url_deny_"+denyDetails.deny.type));

              }
              else {
                // check existing
                fvdSpeedDial.Storage.dialExists({
                  url: url,
                  excludeIds: dialId ? [dialId] : null
                }, function(exists) {
                  function afterCheck(){

                    var thumb_source_type = "screen";


                    var addDial = function(dataUrl, thumbSize, need_sync_screen){
                      need_sync_screen = need_sync_screen ? 1 : 0;

                      dataUrl = dataUrl || "";

                      if (dialId) {

                        fvdSpeedDial.Storage.getDial(dialId, function(dialDataOld){

                          getGroupValue(function(groupValue){

                            var updateData = {
                              title: title,
                              url: url,
                              thumb_source_type: thumb_source_type,
                              thumb_url: backgroundUrl,
                              group_id: groupValue,
                              screen_delay: screenDelay,
                              get_screen_method: getScreenMethod,
                              need_sync_screen: need_sync_screen,
                              update_interval: updateInterval
                            };

                            if( thumbSize ){
                              updateData.thumb_width = thumbSize.width;
                              updateData.thumb_height = thumbSize.height;
                            }
                            if(dialDataOld.url != url) {
                              updateData.auto_title = "";
                            }
                            if (dialDataOld.thumb_source_type == "url") {
                              if( thumb_source_type == "screen" ){
                                dataUrl = "";
                                updateData.screen_maked = 0;
                              }
                            }
                            else if(thumb_source_type == "screen") {
                              // if url no have changes save old screen thumb
                              if( dialDataOld.url != url ){
                                // reset screen maked flag
                                updateData.screen_maked = 0;
                              }
                              else if( getScreenMethod != dialDataOld.get_screen_method ){
                                dataUrl = "";
                                updateData.screen_maked = 0;
                              }
                              /*
                              else if( dialDataOld.screen_delay != screenDelay ){
                                updateData.screen_maked = 0;
                              }
                              */
                              else{
                                dataUrl = dialDataOld.thumb;
                              }
                            }
                            else if( thumb_source_type == "local_file" ){
                              //dataUrl = dialDataOld.thumb;
                            }

                            updateData.thumb = dataUrl;
                            fvdSpeedDial.Storage.updateDial(dialId, updateData, function(){
                              fvdSpeedDial.Sync.addDataToSync( {
                                category: "dials",
                                data: dialId,
                                translate: "dial"
                              } );


                              //fvdSpeedDial.SpeedDial.sheduleFullRebuild(); // Task #1405

                              var queryInput = document.getElementById("dial-search-query");

                              if(queryInput && queryInput.value){
                                fvdSpeedDial.DialSearch.doSearch(queryInput.value);
                              }else{
                                fvdSpeedDial.SpeedDial.sheduleFullRebuild();
                              }

                              sdUserPicsPreviewsAfterAdd();

                              if( _callback ){
                                _callback();
                              }

                              dlg.close();
                            });

                          });

                        });




                      }
                      else {

                        getGroupValue(function(groupValue){
                          if (!dataUrl) {
                            var screen = document.getElementById("addDialog_previewCell");
                            if (screen.hasAttribute("screen")) {
                              dataUrl = screen.getAttribute("screen");
                            }
                          }

                          var addData = {
                            url: url,
                            title: title,
                            thumb_source_type: thumb_source_type,
                            thumb_url: backgroundUrl,
                            group_id: groupValue,
                            thumb: dataUrl,
                            screen_delay: screenDelay,
                            get_screen_method: getScreenMethod,
                            need_sync_screen: need_sync_screen,
                            update_interval: updateInterval
                          };

                          if( thumbSize ){
                            addData.thumb_width = thumbSize.width;
                            addData.thumb_height = thumbSize.height;
                          }

                          fvdSpeedDial.Storage.addDial(addData, function(result){
                            if (result.result) {

                              fvdSpeedDial.Sync.addDataToSync( {
                                category: ["dials", "newDials"],
                                data: result.id,
                                translate: "dial"
                              } );

                              fvdSpeedDial.SpeedDial.justAddedId = result.id;

                              setTimeout(function(){
                                // need to send user in group where dial created
                                if( fvdSpeedDial.SpeedDial.currentDisplayType() != "speeddial" ){
                                  fvdSpeedDial.SpeedDial.setCurrentDisplayType( "speeddial" );
                                }
                                if( fvdSpeedDial.SpeedDial.currentGroupId() != groupValue ){
                                  fvdSpeedDial.SpeedDial.setCurrentGroupId( groupValue );
                                }


                                  fvdSpeedDial.SpeedDial.sheduleFullRebuild();



                              }, 200);

                            }

                            sdUserPicsPreviewsAfterAdd();

                            dlg.close();

                            if( _callback ){
                              _callback();
                            }
                          });
                        });




                      }
                    };

                    if (backgroundUrl && customPreviewCheckbox.checked) {
                      thumb_source_type = "url";

                      if( backgroundUrl != fvdSpeedDial.Const.LOCAL_FILE_URL ){
                        fvdSpeedDial.ThumbMaker.getImageDataPath({
                          imgUrl: backgroundUrl,
                          screenWidth: fvdSpeedDial.SpeedDial.getMaxCellWidth()
                        }, function(dataUrl, thumbSize){
                          addDial(dataUrl, thumbSize);
                        });
                      }
                      else{
                        thumb_source_type = "local_file";

                        var previewCell = document.getElementById( "addDialog_previewCell" );
                        var dataUrl = previewCell.getAttribute( "syncScreen" );
                        var thumbSize = {
                          width: previewCell.getAttribute( "syncScreenWidth" ),
                          height: previewCell.getAttribute( "syncScreenHeight" )
                        };


                        addDial(dataUrl, thumbSize, fvdSpeedDial.Dialogs.AddDial.localFileChanged());
                      }

                    }
                    else {
                      addDial();
                    }

                  }


                  if (exists && !dialId) {

                    if( _b( fvdSpeedDial.Prefs.get("sd.display_dial_already_exists_dialog") ) ){

                      that.confirmCheck( _("dlg_confirm_dial_exists_title"), _("dlg_confirm_dial_exists_text"), _("newtab_do_not_display_migrate"), false, function( result, cbResult ){

                        if( cbResult ){
                          fvdSpeedDial.Prefs.set("sd.display_dial_already_exists_dialog", false);
                        }

                        if( result ){
                          afterCheck();
                        }
                      } );

                    }
                    else{
                      afterCheck();
                    }


                  }
                  else {
                    afterCheck();
                  }
                });
              }

            });

          }
          else
            if (type == "mostvisited") {

              if (dialId) {

                var thumb_source_type = "screen";
                var screen = document.getElementById("addDialog_previewCell");

                var modifyMostVisited = function(dataUrl, thumbSize){
                  if (typeof dataUrl == "undefined") {
                    if (screen.hasAttribute("screen")) {
                      dataUrl = screen.getAttribute("screen");
                    }
                  }
                  dataUrl = dataUrl || "";
                  var updateData = {
                    thumb: dataUrl,
                    title: title,
                    thumb_source_type: thumb_source_type,
                    thumb_url: backgroundUrl,
                    screen_delay: screenDelay,
                    get_screen_method: getScreenMethod
                  };

                  if( thumbSize ){
                    updateData.thumb_width = thumbSize.width;
                    updateData.thumb_height = thumbSize.height;
                  }

                  if (thumb_source_type == "screen" && !dataUrl) {
                    updateData.screen_maked = 0;
                  }

                  fvdSpeedDial.Storage.MostVisited.updateData(dialId, updateData, function() {
                    fvdSpeedDial.SpeedDial.sheduleFullRebuild();
                    sdUserPicsPreviewsAfterAdd();
                    dlg.close();
                  });

                };
                if (backgroundUrl && customPreviewCheckbox.checked) {
                  thumb_source_type = "url";

                  if(backgroundUrl == fvdSpeedDial.Const.LOCAL_FILE_URL &&
                          screen.hasAttribute("syncscreen")) {
                    thumb_source_type = "local_file";
                    backgroundUrl = screen.getAttribute("syncscreen");
                  }


                  fvdSpeedDial.ThumbMaker.getImageDataPath({
                    imgUrl: backgroundUrl,
                    screenWidth: fvdSpeedDial.SpeedDial.getMaxCellWidth()
                  }, function(dataUrl, thumbSize){
                    modifyMostVisited(dataUrl, thumbSize);
                  });
                }
                else {
                  modifyMostVisited();
                }

              }

            }

        };

        if( document.getElementById( "addDialog_title" ).hasAttribute( "autoText" ) ){
          // get auto title
          title = "";
          afterTitle();
        }
        else{
          if( !title ){
            that.errorToField( document.getElementById( "addDialog_title" ), document.body, _("error_must_be_filled") );
            return false;
          }
          afterTitle();
        }



      };
      btns[_("dlg_button_cancel")] = function(){
        dlg.close();
      };

      var historyComplete = null;
      fvdSpeedDial.Dialogs.AddDial.pickedUserPreview = null;

      var _testInputUrlValue = {
        oldValue: "",
        interval: null,
        listener: null,
        start: function(){
          var that = this;

          this.interval = setInterval(function(){

            var value = document.getElementById("addDialog_url").value;

            if( value != that.oldValue ){
              that.oldValue = value;
              if( that.listener ){
                that.listener();
              }
            }

          }, 100);

        },
        end: function(){
          clearInterval( this.interval );
        }
      };

      var dlg = new Dialog({
        width: 414,
        title: dialId ? this._title("modify_dial") : this._title("add_dial"),
        content: fvdSpeedDial.Templates.getHTML("prototype_dialogAddDial"),
        buttons: btns,
        enterOnButton: buttonAddModifyText,
        clickCallback: function(){
          that.hideErrorBox();
        },
        closeCallback: function(){
          _testInputUrlValue.end();

          if( historyComplete ){
            historyComplete.destroy();
          }

          that.hideErrorBox();
        },
        onShow: function() {
          var pickLocalFile = document.querySelector("#addDialog_PickLocalFileContainer a");

          pickLocalFile.addEventListener("click", function(event) {
            var text = _("bg_dialog_adddial_pick_local_file_desc");
            if(navigator.userAgent.toLowerCase().indexOf("windows") != -1) {
              text = text.replace("{examples}", _("bg_dialog_adddial_pick_local_file_desc_win"));
            }
            else {
              text = text.replace("{examples}", _("bg_dialog_adddial_pick_local_file_desc_linux"));
            }
            fvdSpeedDial.ToolTip.display(
              pickLocalFile,
              text,
              event,
              true
            );
            event.preventDefault();
            var url = document.getElementById("addDialog_url");
            if(url && !url.value) url.value = 'file:///';
          }, false);

          _testInputUrlValue.listener = function(){

            setTimeout(function(){
              fvdSpeedDial.Dialogs.AddDial.showFastUserPics();
            }, 0);

            setTimeout(function(){
                fvdSpeedDial.Dialogs.AddDial.getTitle();
            }, 500);

          };

          _testInputUrlValue.start();

          setTimeout(function(){

            dlg._wrapper.setAttribute("id", "addDialog_wrapper");

          }, 0);

          setupPickFrom();

          document.querySelector("#addDialogPickImages .showMoreContainer button").addEventListener("click", function(){

            document.getElementById("addDialog_pickUserPic").click();

          }, false);

          document.getElementById("addDialog_pickUserPic").addEventListener( "click", function(){

            var url = document.getElementById("addDialog_url").value.toLowerCase();

            if( url.indexOf( "http" ) !== 0 ){
              url = fvdSpeedDial.SpeedDialMisc.addProtocolToURL(url);
            }

            var host = fvdSpeedDial.Utils.parseUrl( url, "host" );

            dlg.container.style.display = "none";

            fvdSpeedDial.Dialogs.pickUserPics( {
              host: host
            }, function(  result ){

              dlg.container.style.display = "";

              if( result ){

                fvdSpeedDial.Dialogs.AddDial.setPickedUserPreview(result);

              }

            } );

          }, false );

          document.getElementById("addDialog_autoupdate_preview_enable").addEventListener("change", function() {
            fvdSpeedDial.Dialogs.AddDial.applyAutoPreviewEnabled();
          });

          if( !dialData && type == "speeddial" ){
            document.getElementById("addDialog_PickFromContainer").removeAttribute("hidden");
          }

          var afterAll = function(){
            fvdSpeedDial.Utils.setAutoTextForTextField( document.getElementById("addDialog_title"), _("dialog_add_dial_dynamic_title") );
            fvdSpeedDial.Utils.setAutoTextForTextField( document.getElementById("addDialog_image_url"), _("dialog_add_dial_enter_image_url") );
          };

          if( type == "speeddial" ){
            historyComplete = fvdSpeedDial.HistoryComplete.create( document.getElementById("addDialog_url") );

            var fillGroups = function( selectGroup ){
              // fill groups
              fvdSpeedDial.Storage.groupsList( function( groups ){
                var selectGroups = document.getElementById( "addDialog_group" );
                selectGroups.options.length = 0;

                  for( var i = 0; i != groups.length; i++ ){
                  var option = document.createElement( "option" );

                  if(String(groups[i].name).length < 53) option.textContent = groups[i].name; // Task #1349
                  else{
                      option.textContent = String(groups[i].name).substr(0,53) + "...";
                      option.setAttribute("title", groups[i].name);
                  }

                  option.value = groups[i].id;
                  selectGroups.appendChild( option );
                }

                // add create group
                var option = document.createElement( "option" );
                option.textContent = _("dlg_adddial_create_group");
                option.value = 0;
                option.className = "createNewGroup";

                selectGroups.appendChild( option );

                if( selectGroup ){
                  selectGroups.value = selectGroup;
                }
                else{
                  selectGroups.selectedIndex = 0;
                }



                that.AddDial.changeGroup();
              } );
            };

            document.getElementById( "addDialog_url" ).focus();
          }

          document.getElementById("addDialog_url").removeAttribute("display-url");
          if(dialData) {
            document.getElementById("addDialog_url").value = dialData.url;
            if(dialData.title) document.getElementById("addDialog_title").value = dialData.title;
            if(dialData.display_url) {
              document.getElementById("addDialog_url").setAttribute("display-url", dialData.display_url);
            }

            var customPreviewCheckbox = document.getElementById( "addDialog_useCustomPreview" );

            if( dialData.thumb_source_type == "url" ){
              // check if default url is selected

              var isDefaultPreview = false;

              var select = document.getElementById( "addDialog_default_image" );
              for( var i = 0; i != select.options.length; i++ ){
                var option = select.options[ i ];
                if( option.value.indexOf( dialData.thumb_url ) != -1 ){
                  isDefaultPreview = true;

                  select.value = option.value;
                  that.AddDial.selectDefaultPreview( select );
                  if( select.value.indexOf( "|" ) != -1 ){
                    var extSelect = document.getElementById( "addDialog_default_image_ext" );
                    extSelect.value = dialData.thumb_url;
                    that.AddDial.selectDefaultPreview( extSelect );
                  }
                  break;
                }
              }

              if( !isDefaultPreview ){
                document.getElementById("addDialog_image_url").value = dialData.thumb_url;
                that.AddDial.refreshPreview();
              }

              customPreviewCheckbox.checked = true;
            }
            else if( dialData.thumb_source_type == "local_file" ){
              document.getElementById("addDialog_image_url").value = fvdSpeedDial.Const.LOCAL_FILE_URL;
              customPreviewCheckbox.checked = true;

              document.getElementById("addDialog_previewCell").setAttribute( "syncScreen", dialData.thumb );
              document.getElementById("addDialog_previewCell").setAttribute( "syncScreenWidth", dialData.thumb_width );
              document.getElementById("addDialog_previewCell").setAttribute( "syncScreenHeight", dialData.thumb_height );

              that.AddDial.refreshPreview();
            }
            else if( dialData.thumb_source_type == "screen" ){
              if( dialData.screen_maked == 1 ){
                //fvdSpeedDial.Utils.setScreenPreview( document.getElementById("addDialog_previewCell").getElementsByClassName("screen")[0], dialData.thumb );
                document.getElementById("addDialog_previewCell").setAttribute( "screen", dialData.thumb );
                that.AddDial.refreshPreview();
              }
              customPreviewCheckbox.checked = false;

              if( dialData.get_screen_method == "manual" ){
                document.getElementById("addDialog_useManualPreview").checked = true;
              }
              else{
                document.getElementById("addDialog_useAutoPreview").checked = true;
              }
            }
            if( type == "speeddial" ){
              fillGroups( dialData.group_id );
              if(dialData.update_interval) {
                var tmp = dialData.update_interval.split("|");
                if(tmp.length == 2) {
                  document.getElementById("addDialog_autoupdate_preview_enable").checked = true;
                  document.getElementById("addDialog_autoupdate_preview_interval").value = tmp[0];
                  document.getElementById("addDialog_autoupdate_preview_interval_type").value = tmp[1];
                }
              }
            }
            else if( type == "mostvisited" ){
              var selectGroups = document.getElementById( "addDialog_group" );
              selectGroups.parentNode.parentNode.setAttribute( "hidden", true );

              // disable url field
              document.getElementById( "addDialog_url" ).setAttribute( "disabled", true );
            }

            afterAll();
          }
          else{
            var groupId = fvdSpeedDial.SpeedDial.currentGroupId();

            if( groupId == 0 ){
              groupId = fvdSpeedDial.Prefs.get("sd.default_group");
              if( groupId == 0 || groupId == -1 ){
                fvdSpeedDial.Storage.groupsList( function( groups ){
                  if( groups.length > 0 ){
                    groupId = groups[0].id;
                  }
                  fillGroups( groupId );
                  afterAll();
                } );
              }
              else{
                fillGroups( groupId );
                afterAll();
              }
            }
            else{
              fillGroups( groupId );
              afterAll();
            }


          }

          fvdSpeedDial.Dialogs.AddDial.refreshCustomPreviewState();

          // set events

          document.getElementById("addDialog_title").addEventListener( "focus", function(){
            fvdSpeedDial.Dialogs.AddDial.focusTitle();
          }, false );


          document.getElementById("addDialog_group").addEventListener( "change", function(){
            fvdSpeedDial.Dialogs.AddDial.changeGroup();
          }, false );

          var radioButtonsPreviewType = document.querySelectorAll( ".addDialog_selectPreviewTypeBlock input" );
          for( var i = 0; i != radioButtonsPreviewType.length; i++ ){
            radioButtonsPreviewType[i].addEventListener( "click", function(){
              fvdSpeedDial.Dialogs.AddDial.refreshCustomPreviewState();
            }, false );
          }

          document.getElementById("addDialog_uploadFile").addEventListener( "change", function(){
            fvdSpeedDial.Dialogs.AddDial.selectLocalFile();
          }, false );

          document.getElementById("addDialog_default_image").addEventListener( "change", function(){
            fvdSpeedDial.Dialogs.AddDial.selectDefaultPreview( document.getElementById("addDialog_default_image") );
          }, false );

          document.getElementById("addDialog_default_image_ext").addEventListener( "change", function(){
            fvdSpeedDial.Dialogs.AddDial.selectDefaultPreview( document.getElementById("addDialog_default_image_ext") );
          }, false );

          document.getElementById("addDialog_uploadFileContainer").addEventListener( "click", function(){
            document.getElementById("addDialog_uploadFileContainer").getElementsByTagName('input')[0].click();
          }, false );

          document.getElementById("addDialog_refreshPreview").addEventListener( "click", function(){
            fvdSpeedDial.Dialogs.AddDial.refreshPreview();
          }, false );
          that.AddDial.applyAutoPreviewEnabled();
        }
      });
    },

    AddDial:{
      pickedUserPreview: null,
      setPickedUserPreview: function( pickedUserPreview ){

        var cb = document.getElementById("addDialog_useCustomPreview");

        if( !cb.checked ){
          cb.click();
        }

        this.pickedUserPreview = pickedUserPreview;
        document.getElementById("addDialog_image_url").value = pickedUserPreview.url;
        document.getElementById("addDialog_image_url").removeAttribute("autotext");
        this.refreshPreview();

      },

      applyAutoPreviewEnabled: function() {
        var enabled = document.getElementById("addDialog_autoupdate_preview_enable").checked;
        var interval = document.getElementById("addDialog_autoupdate_preview_interval");
        var intervalType = document.getElementById("addDialog_autoupdate_preview_interval_type");
        if(enabled) {
          interval.removeAttribute("disabled");
          intervalType.removeAttribute("disabled");
        }
        else {
          interval.setAttribute("disabled", 1);
          intervalType.setAttribute("disabled", 1);
        }
      },

      showFastUserPics: function(){
        var wrapper = document.getElementById("addDialog_wrapper");
        if(!wrapper) {
          return;
        }
        wrapper.removeAttribute("withPreview");
        var that = fvdSpeedDial.Dialogs;
        var dialUrlElem = document.getElementById("addDialog_url")
        var url = dialUrlElem.getAttribute("display-url") || dialUrlElem.value;
        var urlLower = url.toLowerCase();

        if( urlLower.indexOf( "http://" ) == -1 && urlLower.indexOf( "https://" ) == -1 ){
          url = fvdSpeedDial.SpeedDialMisc.addProtocolToURL(url);
        } else {
          url = fvdSpeedDial.SpeedDialMisc.changeProtocolToHTTPS(url);
        }

        var parsed = fvdSpeedDial.Utils.parseUrl( url );

        if( !parsed || !parsed.host ){
          return;
        }

        var tmp = parsed.host.split(".");

        if( tmp.length < 2 ){
          return;
        }

        var zone = tmp[ tmp.length - 1 ];

        if( zone.length < 2 ){
          return;
        }

        that.PicsUserPics.cancelCurrentRequests();

        that.PicsUserPics.request( "listing.php", {
          p: 0,
          order: "rating",
          host: parsed.host,
          on_page: 10
        }, function( error, data ){

          if( error ){
            console.log( "Fail get preview pics", error );
            return;
          }

          if( data.previews.length > 0 ){
            wrapper.setAttribute("withPreview", 1);
            document.getElementById("addDialogPickImages").scrollTop = 0;

            var container = document.querySelector("#addDialogPickImages .picsContainer");

            while( container.firstChild ){
              container.removeChild( container.firstChild );
            }

            data.previews.forEach(function( preview ){

              var previewElem = that.PicsUserPics.buildElem( preview, {
                resultCallback: function( preview ){

                  fvdSpeedDial.Dialogs.AddDial.setPickedUserPreview(preview);

                }
              }, {
                close: function(){
                  wrapper.removeAttribute("withPreview");
                }
              } );

              container.appendChild( previewElem );

            });

          }
          else{
            console.log("Not found previews");
          }

        } );

      },

      refreshCustomPreviewState: function() {
        var useCustomPreview = document.getElementById( "addDialog_useCustomPreview" ).checked;
        var useAutoPreview = document.getElementById("addDialog_useAutoPreview").checked;
        var customPreviewBlock = document.getElementById( "addDialog_customPreviewBlock" );
        var autoPreviewBlock = document.getElementById( "addDialog_autoPreviewBlock" );
        if( useCustomPreview ){
          customPreviewBlock.removeAttribute( "hidden" );
        }
        else{
          customPreviewBlock.setAttribute( "hidden", true );
        }
        if( useAutoPreview && fvdSpeedDial.Config.AUTOUPDATE_PREVIEW_ENABLED &&
            fvdSpeedDial.SpeedDial.currentDisplayType() == "speeddial" ){
          autoPreviewBlock.removeAttribute( "hidden" );
        }
        else{
          autoPreviewBlock.setAttribute( "hidden", true );
        }
      },

      getTitle: function( callback ){
        var addDialogURL = document.getElementById("addDialog_url")
        if (addDialogURL) {
          var url = addDialogURL.value;
          if( !fvdSpeedDial.Utils.isValidUrl( url ) ){
            url = fvdSpeedDial.SpeedDialMisc.addProtocolToURL(url);
          }
          var parsed = fvdSpeedDial.Utils.parseUrl( url );
          if( !parsed || !parsed.host || String(parsed.host).split('.').pop().length < 2) return;
          var titleElement = document.getElementById( "addDialog_title" )
          var currentTitle = titleElement ? String(titleElement.value) : '';
          if(!currentTitle || currentTitle == _("dialog_add_dial_dynamic_title")) {
            fvdSpeedDial.Utils.getTitleForUrl( url, function( title ){
              if( title ){
                document.getElementById( "addDialog_title" ).value = title;
                document.getElementById( "addDialog_title" ).removeAttribute("autoText");
              }
              if( callback ){
                callback(title);
              }
            }, true );
          }
        } else {
          if( callback ){
            callback('');
          }
        }
      },

      changeGroup: function(){
        var groupValue = document.getElementById("addDialog_group").value;
        var groupName = document.getElementById("addDialog_groupName").parentNode.parentNode;

        if( groupValue == 0 ){
          groupName.removeAttribute( "hidden" );
          document.getElementById("addDialog_groupName").focus();
        }
        else{
          groupName.setAttribute( "hidden", true );
        }
      },

      focusTitle: function(){
        try{
          var title = document.getElementById( "addDialog_title" ).value;
          if( !title ){
            var url = document.getElementById( "addDialog_url" ).value;
            var host = fvdSpeedDial.Utils.parseUrl( url, "host" );
            if( host ){
              host = host.charAt(0).toUpperCase() + host.slice(1);
              document.getElementById( "addDialog_title" ).value = host;
            }
          }
        }
        catch( ex ){

        }

      },

      localFileChanged: function(){
        return document.querySelector("#addDialog_uploadFileContainer input").getAttribute( "fvdsd-changed" );
      },

      selectLocalFile: function(){
        var that = this;
        try{
          var file = document.querySelector("#addDialog_uploadFileContainer input").files[0];
          if( file.type.indexOf("image/") !== 0 ){
            fvdSpeedDial.Dialogs.errorToField( document.getElementById( "addDialog_image_url" ), document.body, _("error_not_image") );
          }
          else{
            document.querySelector("#addDialog_uploadFileContainer input").setAttribute( "fvdsd-changed", 1 );
            var reader = new FileReader();
            reader.onload = function(){
              fvdSpeedDial.ThumbMaker.getImageDataPath({
                imgUrl: reader.result,
                screenWidth: fvdSpeedDial.SpeedDial.getMaxCellWidth()
              }, function(dataUrl, thumbSize){
                var img = new Image();
                img.onload = function(){
                  var previewCell = document.getElementById( "addDialog_previewCell" );
                  previewCell.setAttribute( "syncScreen", dataUrl );
                  previewCell.setAttribute( "syncScreenWidth", img.width );
                  previewCell.setAttribute( "syncScreenHeight", img.height );
                  that.refreshPreview();
                };
                img.src = dataUrl;

                document.getElementById("addDialog_image_url").removeAttribute("autoText");
                document.getElementById("addDialog_image_url").value = fvdSpeedDial.Const.LOCAL_FILE_URL;
              });
            };
            reader.readAsDataURL( file );
          }
        }
        catch( ex ){

        }
      },

      refreshPreview: function(){
        var previewCell = document.getElementById( "addDialog_previewCell" );
        var screen = previewCell.getElementsByClassName( "preview-image" )[0];

        var backgroundUrl = document.getElementById( "addDialog_image_url" ).value;

        if( backgroundUrl == fvdSpeedDial.Const.LOCAL_FILE_URL ){
          var screen = previewCell.getElementsByClassName("preview-image")[0];
          previewCell.setAttribute("filled", 1);

          fvdSpeedDial.Utils.setUrlPreview( {
            elem: screen,
            size: {
              width: screen.offsetWidth,
              height: screen.offsetHeight
            }
          }, {
            url: previewCell.getAttribute("syncScreen")
          } );
        }
        else if( backgroundUrl ){
          previewCell.setAttribute("filled", 1);
          var screen = previewCell.getElementsByClassName("preview-image")[0];

          fvdSpeedDial.Utils.setUrlPreview( {
            elem: screen,
            size: {
              width: screen.offsetWidth,
              height: screen.offsetHeight
            }
          }, {
            url: backgroundUrl
          } );

        }
        else{
          if( previewCell.hasAttribute("screen") ){
            fvdSpeedDial.Utils.setScreenPreview( document.getElementById("addDialog_previewCell").getElementsByClassName("preview-image")[0], previewCell.getAttribute("screen") );
            previewCell.setAttribute("filled", 1);
          }
          else{
            previewCell.setAttribute("filled", 0);
            screen.style.background = "";
          }
        }
      },

      selectDefaultPreview: function( fromSelect ){
        var url = fromSelect.value;

        var extSelectContainer = document.getElementById( "addDialog_default_image_extContainer" );
        var extSelect = document.getElementById( "addDialog_default_image_ext" );
        var select = document.getElementById( "addDialog_default_image" );

        if( url.indexOf( "|" ) == -1 ){
          document.getElementById( "addDialog_image_url" ).removeAttribute("autoText");
          document.getElementById( "addDialog_image_url" ).value = url;
          if( fromSelect != extSelect ){
            extSelectContainer.setAttribute( "hidden", true );
          }


          this.refreshPreview();
        }
        else{
          var selectedText = select.options[select.selectedIndex].text;
          var urls = url.split( "|" );

          extSelect.options.length = 0;
          for( var i = 0; i != urls.length; i++ ){
            extSelect.options[extSelect.options.length] = new Option( selectedText + " #" + (i + 1), urls[i] );
          }

          extSelectContainer.removeAttribute( "hidden" );

          this.selectDefaultPreview( extSelect );
        }

      }
    },

    _title: function( code ){
      return _( "dialog_title_"+code );
    }



  };

  fvdSpeedDial.Dialogs = new Dialogs();

  Broadcaster.onMessage.addListener(function(msg) {
    if(msg.action == "deny:changed") {
      fvdSpeedDial.Dialogs.ManageDeny.refresh(msg.data);
    }
  });

})();
