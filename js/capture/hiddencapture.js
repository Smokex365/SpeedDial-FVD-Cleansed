(function() {
  var CAPTURE_WIDTH = 1024;
  var CAPTURE_HEIGHT = 768;
  var CAPTURE_TIMEOUT = 60000 * 2; // 2 minutes
  var CHECK_COMPLETE_INTERVAL = 1000;
  var CHECK_COMPLETE_INTERVAL_FINAL = 3000;
  var DISPLAY_HIDDEN_WINDOW_MONITOR = 5;
  var START_TIME = Date.now();

  var CANNOT_CAPTURE_REGEXPS = [/^chrome:\/\//i, /^chrome-extension:\/\//i, /^moz-extension:\/\//i];
  var FAILED_IMAGE = {
    src: "data:image/png;base64,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",
    size: {
      width: 30,
      height: 30
    }
  };

  function RemoveWindowListener( captureWindowId ){
    var self = this;
    function _removeWindowListener( removedWindowId ){
      if( removedWindowId == captureWindowId ){
        return self.stop();
      }
      chrome.windows.getAll( function( windows ){
        if( windows.length == 1 && windows[0].id == captureWindowId ){
          chrome.windows.remove( captureWindowId );
        }
      });
    }
    chrome.windows.onRemoved.addListener( _removeWindowListener );
    this.stop = function(){
      chrome.windows.onRemoved.removeListener( _removeWindowListener );
    };
  }

  fvdSpeedDial.HiddenCapture = new function(){

    var isLinux = navigator.platform.toLowerCase().indexOf( "linux" ) !== -1;
    var isMac = navigator.platform.toLowerCase().indexOf( "mac" ) === 0;
    var isWin = navigator.platform.toLowerCase().indexOf( "win" ) === 0;

    this.capture = function(params, callback) {
      function returnFailedImage() {
          setTimeout(function () {
              callback({
                  dataUrl: FAILED_IMAGE.src
                  , title: _('error_getting_title')
                  , thumbSize: {
                      width: FAILED_IMAGE.size.width
                      , height: FAILED_IMAGE.size.height
                  }
              });
          }, 0);
      }

      for (var i = 0; i != CANNOT_CAPTURE_REGEXPS.length; i++) {
        if (CANNOT_CAPTURE_REGEXPS[i].test(params.url)) {
          return returnFailedImage();
        }
      }

      if(!params.saveImage) {
        // special case, capture only title, do not create separate tab due to #1298
        // only make xmlhttprequest to parse a title
        fvdSpeedDial.Utils.getTitleForUrl(params.url, function(title) {
          callback({
            title: title || ""
          });
        });
        return;
      }

      if( typeof params == "string" ){
        params = {
          url: params
        };
      }

      params.width = params.width || fvdSpeedDial.SpeedDial.getMaxCellWidth() * 2;

      let createUrl = params.url;//fvdSpeedDial.SpeedDialMisc.changeProtocolToHTTPS(params.url)
      console.info(params.url, createUrl)
      var winCreateParams = {
        url: createUrl,
        focused: false,
        left: 100000,
        top: 100000,
        width: isWin ? 100 : 1,
        height: isWin ? 100 : 1,
        type: 'popup'
      };

      function onWindowCreate(w) {
        //var removeListener = new RemoveWindowListener( w.id );

        if(!w.tabs || !w.tabs.length){
          // close window
          chrome.windows.remove( w.id );
          return;
        }

        var ctimeout = null;
        var timeout = setTimeout(function(){
          try{
            clearTimeout( ctimeout );
          }
          catch( ex ){
          }
          chrome.windows.remove( w.id );
          callback( null );
        }, CAPTURE_TIMEOUT);

        fvdSpeedDial.Utils.Async.chain([
          function(next) {
            // can't hide window on Mac OS, by setting large positions
            if(isMac) {
              return next();
            }

            var monitor = 0;
            fvdSpeedDial.Utils.Async.cc(function( ccCallback ){
              const minusw = localStorage.getItem('minusw') || 1
              const minush = localStorage.getItem('minush') || 1
              chrome.windows.update(w.id, {
                top: (screen.availHeight || screen.height) - minush,
                left: (screen.availWidth || screen.width) - minusw
              }, function(){
                monitor++;
                if( monitor == DISPLAY_HIDDEN_WINDOW_MONITOR ){
                  // restore size
                  chrome.windows.update( w.id, {
                    width: CAPTURE_WIDTH,
                    height: CAPTURE_HEIGHT
                  }, function() {
                    next();
                  } );
                  return;
                }
                ccCallback();

              });
            });
          },
          function() {
            if( isLinux || isMac ){
              chrome.windows.update(w.id, {
                state: "minimized"
              });
            }
          }
        ]);

        var tab = w.tabs[0];
        if(String(tab.url).indexOf('chrome-error://') !== -1) {
          return returnFailedImage();
        }
        // mute tab
        chrome.tabs.update(tab.id, {
          muted: true
        });

        chrome.tabs.executeScript( tab.id, {
          file: "/content-scripts/hiddencapture.js",
          runAt: "document_start"
        });

        var isFinalTimeout = false;
        function checkTimeout( interval ) {
          ctimeout = setTimeout(function(){
            chrome.tabs.get( tab.id, function( tabInfo ){
              if( !tabInfo ){
                // tab closed
                clearTimeout( timeout );
                return callback( null );
              }
              if(String(tabInfo.url).indexOf('chrome-error://') !== -1) {
                return returnFailedImage();
              }
              if( !params.saveImage && tabInfo.title ){
                // capture only title
                chrome.windows.remove( w.id );
                return callback({
                  title: tabInfo.title
                });
              }
              if( tabInfo.status == "complete" ){
                if( isFinalTimeout ){
                  capture( tabInfo );
                }
                else{
                  isFinalTimeout = true;
                  checkTimeout( CHECK_COMPLETE_INTERVAL_FINAL );
                }
              }
              else{
                isFinalTimeout = false;
                checkTimeout();
              }
            });
          }, interval || CHECK_COMPLETE_INTERVAL);

        }

        function normailzeWithCheck( callback, attemptNum ){
          if( attemptNum == 10 ){
          //  alert(_("dlg_alert_release_left_button"));
          }

          if( attemptNum > 30 ){
            return callback();
          }

          attemptNum = attemptNum || 0;
          var updateData =  {
            state: "normal",
            focused: false
          };
          if(isLinux) {
            updateData.left = 10000;
            updateData.top = 10000;
          }
          chrome.windows.update(w.id, updateData, function(win){
            console.log("Normalize attempt", attemptNum, w.id, updateData, win);
            chrome.windows.get( w.id, function( wInfo ) {
              if( wInfo.state != "normal" ){
                normailzeWithCheck( callback, attemptNum + 1 );
              }
              else{
                callback();
              }
            } );

          });

        }

        function capture( tab ){
          fvdSpeedDial.Utils.Async.chain([

            function(chainCallback) {
              // replace alerts before capture, because onbeforeunload alert can block page closing
              chrome.tabs.executeScript( tab.id, {
                code: 'window.postMessage({action:"fvdsd:hiddenCapture:__replaceAlerts"}, "*")'
              }, function() {
                chainCallback();
              });
            },

            function( chainCallback ){
              chrome.windows.get( w.id, function( wInfo ){
                if( wInfo.state != "normal" ){
                  normailzeWithCheck( chainCallback );
                }
                else{
                  chainCallback();
                }
              });
            },

            function(){

              chrome.windows.update( w.id, {
                width: CAPTURE_WIDTH,
                height: CAPTURE_HEIGHT,
              }, function(){
                console.info('CAPTURE', 3)
                setTimeout(function(){
                  chrome.tabs.captureVisibleTab( w.id, function( dataUrl ){
                    clearTimeout( timeout );
                    chrome.windows.remove( w.id );
                    if(!dataUrl) {
                      console.error("Fail to capture tab ", params.url, chrome.runtime.lastError);
                      return returnFailedImage();
                    }
                    fvdSpeedDial.ThumbMaker.getImageDataPath( {
                      imgUrl: dataUrl,
                      screenWidth: params.width
                    }, function( thumbUrl, thumbSize ){
                      callback( {
                        dataUrl: thumbUrl,
                        title: tab.title,
                        thumbSize: thumbSize
                      });
                    });
                  });
                }, 500);
              });
            }
          ]);
        }
        checkTimeout();
      }
      //chrome.windows.create(winCreateParams, function( w ){});
        var delay = 0, wait = 15000, shift = Date.now() - START_TIME;
        if(shift < wait) {
          delay = wait - delay;
        }
        setTimeout(()=>{
            try {
              chrome.windows.create(winCreateParams, onWindowCreate);
            }
            catch(err) {
                console.log('something went wrong during hidden capture:', err, 'skip')
                returnFailedImage();
            }
        }, delay);
    };
  };
})();