
// singletone

(function(){

	const PAGE_SCREEN_PARAMS = {
		format: "image/jpeg",
		quality: 80
	};

  var ThumbMaker = function() {
    this.init();
  };

  ThumbMaker.prototype = {
    _listenData: [],

    removeListener: function(listener) {
      var index = this._listenData.indexOf(listener);
      if (index != -1) {
        this._listenData.splice(index, 1);
      }
    },

    resize: function(img, sx, callback, params) {

      params = params || {};
      params.format = params.format || "image/png";
      params.quality = params.quality || 100;

      var srcLower = img.getAttribute("src").toLowerCase();
      fvdSpeedDial.Utils.Async.chain([
        function(next) {
          if (srcLower.indexOf(".svg") == srcLower.length - 4) {
            // draw svg on canvas
            var cc = document.createElement("canvas");
            cc.width = img.width;
            cc.height = img.height;
            var xhr = new XMLHttpRequest();
            xhr.open("GET", img.getAttribute("src"));
            xhr.onload = function() {
              canvg(cc, xhr.responseText, {
                ignoreMouse: true,
                ignoreAnimation: true,
                ignoreDimensions: true,
                ignoreClear: true,
                offsetX: 0,
                offsetY: 0
              });
              img = cc;
              next();
            };
            xhr.onerror = function(err) {
              console.error(err);
              callback(null);
            };
            xhr.send(null);
          }
          else {
            next();
          }
        },
        function() {
          // simple resize
          var canvas = document.createElement("canvas");
          var sy = sx * img.height / img.width;
          canvas.width = sx;
          canvas.height = sy;
          var ctx = canvas.getContext('2d');

          ctx.drawImage(img, 0, 0, sx, sy);

          var canvasURL = null;

          try{ // Task #1980
            canvasURL = canvas.toDataURL(params.format, params.quality);
          }catch(ex){
            console.info(ex);
            canvasURL = null;
          }

          callback(canvasURL, {width: sx, height: sy});
        }
      ]);

    },


    getImageDataPath: function(params, callback) {
      var imgUrl = params.imgUrl;
      var screenWidth = params.screenWidth;
      var img = document.createElement('img');
      var that = this;
      img.onerror = function() {
        callback(null);
      };
      img.onload = function() {
        try {
          if (img.width < screenWidth) {
            screenWidth = img.width;
          }
          that.resize(img, screenWidth, function(imgUrl, size) {
            callback(imgUrl, size);
          }, params.format);
        } catch (ex) {
          console.log(ex);
          //callback( null );
        }
      };
      img.setAttribute("src", imgUrl);
    },

    // type = (speeddial, mostvisited)
    screenTab: function(params) {
      var tabId, type, dialId, width, url, delay, saveImage;
      tabId = params.tabId;
      type = params.type;
      dialId = params.dialId;
      width = params.width;
      url = params.url;
      delay = params.delay;
      saveImage = params.saveImage;
      // first search listener with this tabId

      var listener = {
        "tabId": tabId,
        "type": type,
        "dialId": dialId,
        "width": width,
        "url": url,
        screenDelay: delay,
        saveImage: saveImage,
        port: null
      };

      for (var i = 0; i != this._listenData.length; i++) {
        if (this._listenData[i].tabId == tabId) {
          // replace listener
          this._listenData[i] = listener;
          return;
        }
      }

      this._listenData.push(listener);

      return;
    },

    listenerForTab: function(tabId) {
      for (var i = 0; i != this._listenData.length; i++) {
        if (this._listenData[i].tabId == tabId) {
          return this._listenData[i];
        }
      }
      return null;
    },

    init: function() {
      var that = this;

      chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {

        if (info.status) {

          var listener = that.listenerForTab(tabId);

          if (!listener) {
            return;
          }

          function returnToSpeedDial() {

            if (listener.type == "speeddial") {

              fvdSpeedDial.Storage.getDial(listener.dialId, function(
                oldDial) {

                chrome.tabs.create({
                  active: true,
                  url: chrome.extension.getURL(
                    "newtab.html#force-display&dial_preview_maked=" +
                    listener.dialId + "&show_group_id=" +
                    oldDial.group_id)
                }, function() {
                  chrome.tabs.remove(tabId);
                });

              });

            } else {

              chrome.tabs.create({
                active: true,
                url: chrome.extension.getURL(
                  "newtab.html#force-display")
              }, function() {
                chrome.tabs.remove(tabId);
              });

            }

          }

          function saveToDB(result, thumbSize, callback) {
            // get last tab info
            chrome.tabs.get(tabId, function(tab) {

              switch (listener.type) {
                case "speeddial":

                  fvdSpeedDial.Storage.getDial(listener.dialId,
                    function(oldDial) {

                      var resultData = {
                        "auto_title": tab.title
                      };

                      if (oldDial) {

                        //if( !oldDial.title && oldDial.auto_title != tab.title ){
                        // need to sync dials
                        fvdSpeedDial.Sync.addDataToSync({
                          category: "dials",
                          data: listener.dialId,
                          translate: "dial"
                        });
                        //}

                      }

                      if (listener.saveImage) {
                        resultData.thumb = result;
                        resultData.screen_maked = 1;
                        resultData.thumb_width = thumbSize.width;
                        resultData.thumb_height = thumbSize.height;
                        resultData.need_sync_screen = 1;
                      }

                      fvdSpeedDial.Storage.updateDial(listener.dialId,
                        resultData,
                        function() {

                          try {
                            port.postMessage({
                              "message": "created",
                              data: {
                                urlChanged: !fvdSpeedDial
                                  .Utils.isIdenticalUrls(
                                    listener.url, tab.url
                                  ),
                                startUrl: listener.url,
                                currentUrl: tab.url
                              }

                            });
                          } catch (ex) {

                          }


                          if (callback) {
                            callback();
                          }
                        });

                    });


                  break;

                case "mostvisited":

                  var resultData = {
                    "auto_title": tab.title
                  };

                  if (listener.saveImage) {
                    resultData.thumb_source_type = "screen";
                    resultData.thumb = result;
                    resultData.screen_maked = 1;
                    resultData.thumb_width = thumbSize.width;
                    resultData.thumb_height = thumbSize.height;
                  }

                  fvdSpeedDial.Storage.MostVisited.updateData(
                    listener.dialId, resultData,
                    function() {
                      try {
                        port.postMessage({
                          "message": "created"
                        });
                      } catch (ex) {

                      }

                      if (callback) {
                        callback();
                      }
                    });

                  break;
              }

            });

          }


          if (!listener.saveImage) {
            // without image, grab only title
            if (tab.title) {
              that.removeListener(listener);
              saveToDB(null, null, function() {
                returnToSpeedDial();
              });
            }
            return;
          }

          var port = listener.port;

          function fullScreen() {

            setTimeout(function() {
              chrome.tabs.get(tabId, function(tab) {

                if (tab.status == "complete") {

                  // remove listener
                  that.removeListener(listener);

                  chrome.tabs.captureVisibleTab(null, {
                    format: "png"
                  }, function(dataurl) {

                    that.getImageDataPath({
                      imgUrl: dataurl,
                      screenWidth: listener.width,
                      format: PAGE_SCREEN_PARAMS
                    }, function(result, thumbSize) {
                      saveToDB(result, thumbSize,
                        function() {
                          returnToSpeedDial();
                        });
                    });

                  });

                }
              });
            }, 500);


          }

          fvdSpeedDial.Utils.Async.chain([

            function(callbackChain) {

              chrome.tabs.executeScript(tabId, {
                file: "content-scripts/cropper/cropper.js"
              }, function() {

                // wait one second for response
                setTimeout(function() {

                  if (!listener.canBeScripted) {
                    // make screen of tab

                    // wait while tab will be completed

                    function _waitForTabCompletion() {

                      // if tab already completed
                      chrome.tabs.get(tabId, function(tab) {

                        if (!tab) {
                          // tab removed
                          return;
                        }

                        if (tab.status == "complete") {
                          fullScreen();
                        } else {
                          setTimeout(function() {
                            _waitForTabCompletion
                              ();
                          }, 1000);
                        }

                      });


                    }

                    _waitForTabCompletion();


                  }

                }, 1000);

                // connect to tab

                port = chrome.tabs.connect(tabId, {
                  name: "thumbmaker_cropper"
                });

                listener.port = port;
                port.onMessage.addListener(function(message) {
                  switch (message.message) {
                    case "change_photo_position":

                      fvdSpeedDial.Prefs.set(
                        "cropper_photo_position_left",
                        message.data.left);
                      fvdSpeedDial.Prefs.set(
                        "cropper_photo_position_top",
                        message.data.top);

                      break;

                    case "set_url":
                      if (listener.type == "speeddial") {
                        fvdSpeedDial.Storage.updateDial(
                          listener.dialId, {
                            url: message.data.url
                          },
                          function() {
                            port.postMessage({
                              message: "url_setted"
                            })
                          });
                      }
                      break;

                    case "ready_to_init":
                      listener.canBeScripted = true;
                      // next include all other scripts and init cropper
                      callbackChain();

                      break;

                    case "return_to_speeddial":

                      returnToSpeedDial();

                      break;

                    case "click_start_crop":

                      port.postMessage({
                        "message": "show_crop_area"
                      });

                      break;

                    case "click_cancel":
                      // remove listener
                      try {
                        that.removeListener(listener);
                        port.postMessage({
                          "message": "destroy"
                        });
                      } catch (ex) {

                      }
                      break;

                    case "make_fullscreen_snapshoot":

                      fullScreen();

                      break;

                    case "snapshoot":
                      var data = message.data;

                      chrome.tabs.captureVisibleTab(null, {
                        format: "png"
                      }, function(dataurl) {

                        port.postMessage({
                          "message": "captured"
                        });
                        // remove listener
                        try {
                          that.removeListener(listener);
                        } catch (ex) {

                        }


                        var img = document.createElement(
                          "img");
                        img.onload = function() {
                          var canvas = document.createElement(
                            "canvas");
                          canvas.width = data.width;
                          canvas.height = data.height;
                          var ctx = canvas.getContext(
                            "2d");
                          ctx.drawImage(img, data.x1,
                            data.y1, data.width,
                            data.height, 0, 0, data
                            .width, data.height);

                          that.getImageDataPath({
                            imgUrl: canvas.toDataURL("image/png"),
                            screenWidth: listener.width,
                            format: PAGE_SCREEN_PARAMS
                          }, function(result,
                            thumbSize) {
                            saveToDB(result,
                              thumbSize);
                          });

                        };
                        img.src = dataurl;
                      });

                      break;
                  }
                });


              });

            },

            function(callbackChain) {
              chrome.tabs.executeScript(tabId, {
                file: "extras/jquery.js"
              }, function() {
                callbackChain();
              });
            },
            function(callbackChain) {
              chrome.tabs.executeScript(tabId, {
                file: "content-scripts/cropper/imgareaselect.js"
              }, function() {
                callbackChain();
              });
            },
            function(callbackChain) {
              chrome.tabs.insertCSS(tabId, {
                file: "content-scripts/cropper/imgareaselect.css"
              }, function() {
                callbackChain();
              });
            },
            function(callbackChain) {
              chrome.tabs.executeScript(tabId, {
                file: "content-scripts/cropper/tiptip.js"
              }, function() {
                callbackChain();
              });
            },
            function(callbackChain) {
              chrome.tabs.insertCSS(tabId, {
                file: "content-scripts/cropper/tiptip.css"
              }, function() {
                callbackChain();
              });
            },
            function(callbackChain) {
              chrome.tabs.insertCSS(tabId, {
                file: "content-scripts/cropper/style.css"
              }, function() {
                callbackChain();
              });
            },
            function() {

              port.postMessage({
                "message": "init",
                data: {
                  aspectRatio: fvdSpeedDial.SpeedDial._cellsSizeRatio,
                  init: {
                    width: 1024,
                    height: 1024 / fvdSpeedDial.SpeedDial._cellsSizeRatio
                  },
                  minWidth: fvdSpeedDial.SpeedDial.getMaxCellWidth(),
                  delay: listener.screenDelay,
                  photoPosition: {
                    left: fvdSpeedDial.Prefs.get(
                      "cropper_photo_position_left", 0),
                    top: fvdSpeedDial.Prefs.get(
                      "cropper_photo_position_top", 0)
                  }
                }
              });

            }

          ]);
        }
      });
    }
  };

  Broadcaster.onMessage.addListener(function(msg, sender, sendResponse) {
    if(msg.action == "thumbmaker:getimagedatapath") {
      fvdSpeedDial.ThumbMaker.getImageDataPath(msg.params, function(imgUrl, size) {
        sendResponse({
          imgUrl: imgUrl,
          size: size
        });
      });
      return true;
    }
    else if(msg.action == "thumbmaker:screentab") {
      fvdSpeedDial.ThumbMaker.screenTab(msg.params);
    }
  });


  fvdSpeedDial.ThumbMaker = new ThumbMaker();

})();