// background script

(function() {
  var MAX_SIMULTANEUSELY_CAPTURES = 1;

  fvdSpeedDial.HiddenCaptureQueue = new function() {

    var queue = [];
    var currentItem = null;
    var nowCapturesInProgressCount = 0;
    var self = this;

    var ignoreIdsAfterComplete = [];

    function checkNeedIgnoreIdAndRemove( id ){
      var removeIndex = ignoreIdsAfterComplete.indexOf( id );
      if( removeIndex != -1 ){
        ignoreIdsAfterComplete.splice( removeIndex, 1 );

        return true;
      }

      return false;
    }

    function captureNext(){

      if( nowCapturesInProgressCount >= MAX_SIMULTANEUSELY_CAPTURES ){
        return;
      }

      if( queue.length === 0 ){
        return;
      }

      var item = queue.shift();
      currentItem = item;
      nowCapturesInProgressCount++;

      fvdSpeedDial.HiddenCapture.capture( item.params, function( resultData ){
        if( !checkNeedIgnoreIdAndRemove( currentItem.id ) ){
          console.info("Capture done");
          Broadcaster.sendMessage({
            action: "hiddencapture:done",
            params: item.params,
            result: resultData
          });
          if( item.callback ){
            item.callback( resultData );
          }
        }
        currentItem = null;
        nowCapturesInProgressCount--;
        captureNext();
      } );

    }

    this.removeFromQueueById = function( id ){
      if( currentItem && currentItem.id == id ){// Task #1486
        ignoreIdsAfterComplete.push( id );
        return;
      }

      var index = -1;

      for( var i = 0; i != queue.length; i++ ){

        if( queue[i].id == id ){
          index = i;
          break;
        }

      }

      if( index != -1 ){
        queue.splice( index, 1 );
      }

    };

    this.getQueue = function(){
      return queue;
    };

    this.getCurrentItem = function(){
      return currentItem;
    };

    this.isEnqueued = function(id) {
      if(currentItem && currentItem.id == id) {
        return true;
      }
      for(var i = 0; i != queue.length; i++) {
        if(queue[i].id == id) {
          return true;
        }
      }
      return false;
    };

    this.capture = function( params, callback ){

      checkNeedIgnoreIdAndRemove( params.id );

      queue.push({
        id: params.id,
        params: params,
        callback: callback
      });

      captureNext();

    };

    this.empty = function() {
      queue = [];
    };

  }();

  Broadcaster.onMessage.addListener(function(msg, sender, sendResponse) {
    if(msg.action == "hiddencapture:queue") {
      var params = msg.params,
          cb = null;
      if(params.wantResponse) {
        cb = function(res) {
          sendResponse(res);
        };
      }
      fvdSpeedDial.HiddenCaptureQueue.capture(params, cb);
      if(cb) {
        return true;
      }
    }else
    if(msg.action == "hiddencapture:empty") {
        fvdSpeedDial.HiddenCaptureQueue.empty();
    }
    else
    if(msg.action == "storage:dialsCleared") {
      // all dials removed, empty queue
      fvdSpeedDial.HiddenCaptureQueue.empty();
    }
  });
})();

