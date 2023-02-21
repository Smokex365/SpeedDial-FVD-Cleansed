import '../_external/parallax.js';

const BackgroundModule = function (fvdSpeedDial) {
	const self = this;
	this.fvdSpeedDial = fvdSpeedDial;

	this.currentParallaxScene = null;

	window.addEventListener(
		'resize',
		function () {
			self.adoptParallaxLayer();
		},
		false
	);
};

BackgroundModule.prototype = {
	CURRENT_CHROME_THEME_BACKGROUND_URL: 'chrome://theme/IDR_THEME_NTP_BACKGROUND',
	/**
	 *
	 * bgData = {
	 *  color,
	 *  useColor,
	 *  imageUrl,
	 *  imageType,
	 *  adaptiveSize,
	 *  callback
	 * }
	 *
	 */
	setToElem: function (bgData, elem) {
		const that = this;

		function _set() {
			that._setToElem(bgData, elem);
		}

		if (bgData.imageUrl && bgData.imageType !== 'noimage') {
			const img = new Image();

			img.onload = function () {
				bgData.imgInst = img;
				_set();
			};
			img.onerror = function () {
				console.log('image load error');
				_set();
			};
			img.src = bgData.imageUrl;
		} else {
			_set();
		}
	},
	/*
	 * bgData some like setToElem but if have image added param imgInst
	 */
	_setToElem: function (bgData, elem) {
		const { fvdSpeedDial: { Prefs } } = this;

		bgData.parallaxDepth = bgData.parallaxDepth || Prefs.get('sd.background_parallax_depth');
		const self = this;

		elem.style.background = 'none';

		let parallaxScene = elem.querySelector('.parallax-bg-scene');

		if (parallaxScene) {
			parallaxScene.parentNode.removeChild(parallaxScene);
		}

		if (this.currentParallaxScene) {
			this.currentParallaxScene.disable();
			this.currentParallaxScene = null;
		}

		if (bgData.imgInst) {

			if (bgData.imageType === 'parallax') {
				parallaxScene = document.createElement('div');
				parallaxScene.classList.add('parallax-bg-scene');
				const layer = document.createElement('div');

				layer.classList.add('layer');
				layer.style.backgroundImage = 'url(' + bgData.imageUrl.replace('(', '\\(').replace(')', '\\)') + ')';
				layer.style.backgroundSize = 'cover';
				layer.setAttribute('data-depth', bgData.parallaxDepth / 100);
				parallaxScene.appendChild(layer);
				const appendTo = elem === document.documentElement ? document.body : elem;

				appendTo.appendChild(parallaxScene);
				this.currentParallaxScene = new Parallax(parallaxScene);
				self.adoptParallaxLayer();
			} else {
				let elemWidth;
				let elemHeight;

				if (elem.clientWidth) {
					elemWidth = elem.clientWidth;
					elemHeight = elem.clientHeight;
				} else {
					elemWidth = elem.offsetWidth;
					elemHeight = elem.offsetHeight;
				}

				elem.style.backgroundImage = 'url(' + bgData.imageUrl.replace('(', '\\(').replace(')', '\\)') + ')';

				if (bgData.adaptiveSize) {
					const ratio = elemWidth / bgData.adaptiveSize.width;
					const bgWidth = Math.round(ratio * bgData.imgInst.width);
					const bgHeight = Math.round(ratio * bgData.imgInst.height);

					elem.style.backgroundSize = bgWidth + 'px ' + bgHeight + 'px';
				}

				switch (bgData.imageType) {
					case 'fill':
						elem.style.backgroundPosition = 'center center';
						elem.style.backgroundSize = 'cover';
						elem.style.backgroundRepeat = 'no-repeat';
						break;
					case 'fit':
						elem.style.backgroundPosition = 'center center';
						elem.style.backgroundSize = 'contain';
						elem.style.backgroundRepeat = 'no-repeat';
						break;
					case 'stretch':
						elem.style.backgroundSize = '100% 100%';
						elem.style.backgroundRepeat = 'no-repeat';
						break;
					case 'tile':
						break;
					case 'center':
						elem.style.backgroundPosition = 'center center';
						elem.style.backgroundRepeat = 'no-repeat';
						break;
				}

				if (!bgData.adaptiveSize) {
					// if not specified adaptive size - this is not preview, than set attachment
					elem.style.backgroundAttachment = 'fixed';
				}

				if (bgData.useColor) {
					elem.style.backgroundColor = '#' + bgData.color;
				}
			}
		} else {
			if (bgData.useColor) {
				elem.style.backgroundColor = '#' + bgData.color;
			}
		}

		if (bgData.callback) {
			bgData.callback(bgData);
		}
	},

	adoptParallaxLayer: function () {
		const scene = document.querySelector('.parallax-bg-scene');

		if (scene) {
			const layer = scene.querySelector('.layer');

			if (!scene || !this.currentParallaxScene) {
				return;
			}

			const depth = this.currentParallaxScene.depths[0];
			const xMotion = scene.offsetWidth * (10 / 100) * depth;
			const yMotion = scene.offsetHeight * (10 / 100) * depth;

			layer.style.left = -xMotion + 'px';
			layer.style.top = -yMotion + 'px';
			layer.style.width = scene.offsetWidth + xMotion * 2 + 'px';
			layer.style.height = scene.offsetHeight + yMotion * 2 + 'px';
		}
	},
};

export default BackgroundModule;
