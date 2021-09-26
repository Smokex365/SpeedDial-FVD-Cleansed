(function() {
  function onHiddenCaptureFinished(params, resultData){
    if( !params.elemId ){
      return;
    }
    // update info in speeddial
    var elem = document.getElementById( params.elemId );
    var dialData;
    if( !elem ){
      return;
    }
    fvdSpeedDial.Utils.Async.chain([
      function( chainCallback ){
        if( params.type == "speeddial" ){
          fvdSpeedDial.Storage.getDial( params.id, function( dial ) {
            dialData = dial;
            if( dial.title ){
              //delete resultData.title;// Task #1773
            }
            chainCallback();
          });
        }
        else if( params.type == "mostvisited" ){
          fvdSpeedDial.Storage.MostVisited.getById( params.id, params.interval, "host", function( row ){
            fvdSpeedDial.Storage.MostVisited.extendData( row, function( mvData ){
              if( mvData.title ) {
                delete resultData.title;
              }
              chainCallback();
            });
          });
        }
      },
      function(){
        elem.removeAttribute("loadscreen");
        if( !resultData ){
          // failed here
          return;
        }
        if( resultData.title ){
          var titleContainer = elem.querySelector(".head span");
          if( !titleContainer ){
            // try to get titlecontainer for list element
            titleContainer = elem.querySelector(".leftData .text");
          }
          if( titleContainer ){
            titleContainer.textContent = resultData.title;
            elem.removeAttribute("notitle");
          }
          elem.setAttribute("title", fvdSpeedDial.SpeedDial.Builder.cellTitle({
            title: resultData.title,
            url: dialData.url
          }));
        }
        var screen = elem.querySelector(".body .preview-image");
        if(
            screen && params.saveImage && resultData.dataUrl
            && dialData.thumb_source_type == "screen"
        ){
          fvdSpeedDial.Utils.setScreenPreview(screen, resultData.dataUrl, true, false, resultData);
        }
        else{
        }
      }
    ]);
  }

  Broadcaster.onMessage.addListener(function(msg) {
    if(msg.action == "hiddencapture:done") {
      onHiddenCaptureFinished(msg.params, msg.result);
    }
  });

  fvdSpeedDial.SpeedDial.ThumbManager = {
    setThumbToElement: function(params) {
      var data = params.data;
      var elem = params.elem;
      //var screen = elem.querySelector(".body .screen");
      var screen = elem.querySelector(".body .preview-image");
      elem.setAttribute("thumb-source-type", data.thumb_source_type);
      if (data.thumb_source_type == "screen") {
        if (data.screen_maked != 1) {
          if( data.get_screen_method == "manual" ){
            elem.setAttribute("noscreen", 1);
          } else {
            this.hiddenCaptureThumb( {
              data: data,
              type: elem.getAttribute("type"),
              saveImage: true,
              resetScreenMaked: false,
              interval: params.interval,
              elemId: elem.getAttribute("id"),
              elem: elem
            });
          }
        } else {
          // setup screen
          if( screen ){
            fvdSpeedDial.Utils.setScreenPreview(screen, data.thumb, params.nocache, false, data); // Task #1346
          }
        }
      } else {
        if( screen ) {
          if (data.thumb_source_type == "url" || data.thumb_source_type == "local_file") {
            fvdSpeedDial.Utils.setUrlPreview({
              elem: screen,
              size: params.cellSize
            }, {
              url: data.thumb,
              size: {
                width: data.thumb_width,
                height: data.thumb_height
              }
            }, params.nocache);
          }
          if( !data.displayTitle ){
            this.hiddenCaptureThumb( {
              data: data,
              type: elem.getAttribute("type"),
              saveImage: false,
              resetScreenMaked: false,
              interval: params.interval,
              elemId: elem.getAttribute("id")
            });
          }
        }
      }
    },
    hiddenCaptureThumb: function(params, callback) {
      if(!params.elem && params.elemId) {
        params.elem = document.getElementById(params.elemId);
      }
      if(params.elem) {
        params.elem.setAttribute("loadscreen", 1);
        fvdSpeedDial.Utils.removeScreenPreview(params.elem.querySelector(".preview-image"));
      }
      if(params.elem) {
        delete params.elem;
      }
      // proxy to bg
      chrome.runtime.sendMessage({
        action: "thumbmanager:hiddenCaptureThumb",
        params: params,
        wantResponse: callback ? true : false
      }, function(res) {
        if(callback) {
          callback(res);
        }
      });
    }
  };
})();