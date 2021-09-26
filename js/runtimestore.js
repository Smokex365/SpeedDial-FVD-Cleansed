// cleaned after addon/browser restart
fvdSpeedDial.RuntimeStore = new function(){
	var PREFIX = "__runtime_storage:";
	// clean
	for(var k in localStorage) {
		if(k.indexOf(PREFIX) === 0) {
			delete localStorage[k];
		}
	}
	function _key(k) {
		return PREFIX + k;
	}

	this.set = function( k, v ){
		localStorage[_key(k)] = JSON.stringify({
      value: v,
      type: typeof v
    });
		Broadcaster.sendMessage({
			action: "runtimestore:itemchanged",
			name: k,
			value: v
		});
	};
	
	this.get = function( k ) {
		var t = localStorage[_key(k)];
    if(!t) {
      return;
    }
    t = JSON.parse(t);
    var v = t.value;
    switch(t) {
      case "boolean":
        v = v === "true";
      break;
      case "number":
        v = parseInt(v, 10);
      break;
    }
    return v;
	};
}();