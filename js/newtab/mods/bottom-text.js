const BottomTextModule = function (fvdSpeedDial) {
	const that = this;
	this.fvdSpeedDial = fvdSpeedDial;
	this.showTimeout = null;
	const {
		fvdSpeedDial: { SpeedDial },
	} = this;

	SpeedDial.onBuildStart.addListener(that.resetBottomText);
	SpeedDial.onGroupChange.addListener(() => {
		// need to hide bottom text completely
		const bottomTextContainer = document.getElementById('bottomTextContainer');

		if (bottomTextContainer) {
			bottomTextContainer.setAttribute('hide', 1);
		}
	});
	SpeedDial.onBuildCompleted.addListener(() => {
		that.stopTimeout();
		that.showTimeout = setTimeout(function () {
			const bottomTextContainer = document.getElementById('bottomTextContainer');
			const speedDialContent = document.getElementById('speedDialContent');
			const windowHeight = window.innerHeight;
			const speedDialContentBoundingRect = speedDialContent.getBoundingClientRect();

			that.clearClasses();

			if (speedDialContentBoundingRect.bottom > windowHeight) {
				bottomTextContainer.classList.add('static-position');
			} else {
				bottomTextContainer.classList.add('force-bottom');
			}

			if (bottomTextContainer.hasAttribute('visible')) {
				return;
			}

			bottomTextContainer.removeAttribute('hide');
			bottomTextContainer.setAttribute('visible', 1);
		}, 0);
	});

	window.addEventListener('resize', that.resetBottomText, false);
	document.addEventListener(
		'DOMContentLoaded',
		function () {
			setTimeout(function () {
				const bottomTextContainer = document.getElementById('bottomTextContainer');
				bottomTextContainer.setAttribute('muted', 1);
			}, 3e3);
		},
		false
	);
};
BottomTextModule.prototype = {
	stopTimeout: () => {
		try {
			const { BottomText } = fvdSpeedDial;
			clearTimeout(BottomText.showTimeout);
		} catch (ex) {
			console.warn(ex);
		}
	},
	clearClasses: () => {
		const bottomTextContainer = document.getElementById('bottomTextContainer');

		bottomTextContainer.classList.remove('force-bottom');
		bottomTextContainer.classList.remove('static-position');
	},
	resetBottomText: () => {
		try {
			const { BottomText } = fvdSpeedDial;
			BottomText.stopTimeout();
			const bottomTextContainer = document.getElementById('bottomTextContainer');

			bottomTextContainer.removeAttribute('visible');
			BottomText.clearClasses();
		} catch (ex) {
			console.warn(ex);
		}
	},
};

export default BottomTextModule;
