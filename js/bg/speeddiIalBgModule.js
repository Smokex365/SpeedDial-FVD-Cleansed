const SpeedDialBgModule = function (fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;
	fvdSpeedDial.ContextMenu = this;
};

SpeedDialBgModule.prototype = {
	_cellsSizeRatio: 1.6,
	_cellsSizes: {
		big: 364,
		medium: 210,
		small: 150,
	},
	getMaxCellWidth: function () {
		let max = 0;

		for (const k in this._cellsSizes) {
			const size = this._cellsSizes[k];

			if (size > max) {
				max = size;
			}
		}

		return max;
	},
};

export default SpeedDialBgModule;
