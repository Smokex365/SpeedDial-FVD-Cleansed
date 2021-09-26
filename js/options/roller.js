(function(){

	var Roller = function() {
	};

	var _Roller = function(elem, elemWidth) {
		this._elem = elem;
    this.elemWidth = elemWidth;
	};

	_Roller.prototype = {
		_elem: null,

		rollTo: function(itemNumber) { /* from zero */
			var that = this;

			var firstNode = this._elem.querySelector("div:first-child");
			var width = this.elemWidth || firstNode.offsetWidth;

			var offset = -itemNumber*width;

			firstNode.style.marginLeft = offset + "px";
		}
	};

	Roller.prototype = {
		create: function(elem, elemWidth){
			return new _Roller(elem, elemWidth);
    }
	};

	this.Roller = new Roller();

}).apply( fvdSpeedDial );
