const Roller = function () {
};

const _Roller = function (elem, elemWidth) {
	this._elem = elem;
	this.elemWidth = elemWidth;
};

_Roller.prototype = {
	_elem: null,

	rollTo: function (itemNumber) { /* from zero */
		const that = this;

		const firstNode = this._elem.querySelector("div:first-child");
		const width = this.elemWidth || firstNode.offsetWidth;

		const offset = -itemNumber*width;

		firstNode.style.marginLeft = offset + "px";
	},
};

Roller.prototype = {
	create: function (elem, elemWidth) {
		return new _Roller(elem, elemWidth);
	},
};

export default new Roller();
