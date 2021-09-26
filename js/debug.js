(function(){
	var Debug = function(){

	};
  window.Debug = Debug;

	Debug.prototype = {
	};

  ["log", "info", "warn", "error"].forEach(function(method) {
    Debug.prototype[method] = function() {
      if(!fvdSpeedDial.Config || !fvdSpeedDial.Config.DEBUG) {
        return;
      }
      var args = Array.prototype.slice.call(arguments);
        
      //console[method].apply(console, args); // #Debug
    };
  });

	this.Debug = new Debug();
  window.debug = this.Debug;
}).apply( fvdSpeedDial );
