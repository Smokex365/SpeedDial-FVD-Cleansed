(function() {
  var ThumbManager = function(){

    // lister to capture finished
    function onHiddenCaptureFinished(params, resultData){
      // update info in db
      if( resultData && params.id && params.type ){

        var dataUrl = resultData.dataUrl;
        var title = resultData.title;
        var thumbSize = resultData.thumbSize;

        switch( params.type ){

          case "speeddial":

            fvdSpeedDial.Storage.getDial( params.id, function( oldDial ){
              if( !oldDial ){
                return;
              }

              var resultData = {
                "auto_title": title
              };
                
              if(title) resultData.title = title;// Task #1773

              if( oldDial ){

                if( !oldDial.title && oldDial.auto_title != title ){
                  // need to sync dials where changed auto title
                  fvdSpeedDial.Sync.addDataToSync( {
                    category: "dials",
                    data: params.id,
                    translate: "dial"
                  } );
                }

              }

              if (
                  params.saveImage 
                  && oldDial.thumb_source_type == "screen" // Task #1406
              ) {
                resultData.thumb = dataUrl;
                resultData.screen_maked = 1;
                resultData.thumb_width = thumbSize.width;
                resultData.thumb_height = thumbSize.height;
                resultData.last_preview_update = new Date().getTime();
              }

              fvdSpeedDial.Storage.updateDial(params.id, resultData, function(){

              });

            } );

          break;

          case "mostvisited":

            resultData = {
              "auto_title": title
            };

            if (params.saveImage) {
              resultData.thumb_source_type = "screen";
              resultData.thumb = dataUrl;
              resultData.screen_maked = 1;
              resultData.thumb_width = thumbSize.width;
              resultData.thumb_height = thumbSize.height;
              resultData.get_screen_method = "auto";
            }

            fvdSpeedDial.Storage.MostVisited.updateData(params.id, resultData, function(){



            });

          break;

        }

      }

    }

    function isQueued( params ){

      var queue = fvdSpeedDial.HiddenCaptureQueue.getQueue();
      var currentItem = fvdSpeedDial.HiddenCaptureQueue.getCurrentItem();

      if( currentItem ){
        if( currentItem.params.type == params.type && currentItem.params.id == params.id ){
          return true;
        }
      }

      for( var i = 0; i != queue.length; i++ ){
        var item = queue[i];
        if( item.params.type == params.type && item.params.id == params.id ){
          return true;
        }
      }

      return false;

    }

    this.hiddenCaptureThumb = function( aParams, callback ) {

      if( typeof aParams.saveImage == "undefined" ){
        aParams.saveImage = true;
      }

      if( typeof aParams.resetScreenMaked == "undefined" ){
        aParams.resetScreenMaked = true;
      }

      fvdSpeedDial.Utils.Async.chain([

        function( chainCallback ){
          if( aParams.resetScreenMaked ){

            if( aParams.type == "speeddial" ){
              fvdSpeedDial.Storage.updateDial( aParams.data.id, {
                screen_maked: 0
              }, function(){
                chainCallback();
              } );
            }
            else if( aParams.type == "mostvisited" ){
              fvdSpeedDial.Storage.MostVisited.updateData( aParams.data.id, {
                screen_maked: 0
              }, function(){
                chainCallback();
              } );
            }

          }
          else{
            chainCallback();
          }

        },

        function( chainCallback ){
          if( aParams.data.url ){
            chainCallback();
          }
          else{

            if( aParams.type == "speeddial" ){

              fvdSpeedDial.Storage.getDial( aParams.data.id, function( dial ){

                aParams.data.url = dial.url;
                aParams.elemId = "dialCell_" +aParams.data.id;

                chainCallback();

              });

            }
            else if( aParams.type == "mostvisited" ){

              fvdSpeedDial.Storage.MostVisited.getById( aParams.data.id, aParams.interval, "host", function( row ){

                aParams.data.url = row.url;
                aParams.elemId = "dialCell_" +aParams.data.id;

                chainCallback();

              });

            }

          }

        },
        function(){
          var data = aParams.data;
          var elem = aParams.elem;

          if( elem ){
            if( aParams.saveImage ){
              elem.setAttribute("loadscreen", 1);

              var screen = elem.querySelector(".body .preview-image");
              if( screen ){
                fvdSpeedDial.Utils.removeScreenPreview(screen);
              }
            }
          }

          var params = {
            url: data.url,
            id: data.id,
            elemId: aParams.elemId,
            type: aParams.type,
            saveImage: aParams.saveImage,
            interval: aParams.interval
          };

          if( !isQueued( params ) ){
            fvdSpeedDial.HiddenCaptureQueue.capture( params, callback );
          }
          else{
          }

        }

      ]);

    };

    Broadcaster.onMessage.addListener(function(msg, sender, sendResponse) {
      if(msg.action == "hiddencapture:done") {
        onHiddenCaptureFinished(msg.params, msg.result);
      }
      else if(msg.action == "thumbmanager:hiddenCaptureThumb") {
        var cb = function() {};
        fvdSpeedDial.SpeedDial.ThumbManager.hiddenCaptureThumb(msg.params, function(res) {
          if(msg.wantResponse) {
            sendResponse(res);
          }
        });
        if(msg.waitResponse) {
          return true;
        }
      }
    });



  };

  fvdSpeedDial.SpeedDial.ThumbManager = new ThumbManager();
})();