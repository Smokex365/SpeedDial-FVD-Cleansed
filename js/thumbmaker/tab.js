import { Utils } from '../utils.js';

const ThumbMakerModule = function (fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;
};

ThumbMakerModule.prototype = {
	getImageDataPath: function (params, cb) {
		chrome.runtime.sendMessage(
			{
				action: 'thumbmaker:getimagedatapath',
				params: params,
			},
			function (res) {
				if (typeof res === 'undefined') {
					console.warn('res is', typeof res);
					cb(null, null);
				} else {
					cb(res.imgUrl, res.size);
				}
			}
		);
	},
	screenTab: function (params) {
		chrome.runtime.sendMessage({
			action: 'thumbmaker:screentab',
			params: params,
		});
	},
	resize: function (img, sx, callback, params) {
		params = params || {};
		params.format = params.format || 'image/png';
		params.quality = params.quality || 100;

		const srcLower = img.getAttribute('src').toLowerCase();

		Utils.Async.chain([
			function (next) {
				if (srcLower.indexOf('.svg') === srcLower.length - 4) {
					// draw svg on canvas
					const cc = document.createElement('canvas');

					cc.width = img.width;
					cc.height = img.height;
					const xhr = new XMLHttpRequest();

					xhr.open('GET', img.getAttribute('src'));
					xhr.onload = function () {
						canvg(cc, xhr.responseText, {
							ignoreMouse: true,
							ignoreAnimation: true,
							ignoreDimensions: true,
							ignoreClear: true,
							offsetX: 0,
							offsetY: 0,
						});
						img = cc;
						next();
					};
					xhr.onerror = function (err) {
						console.error(err);
						callback(null);
					};
					xhr.send(null);
				} else {
					next();
				}
			},
			function () {
				// simple resize
				const canvas = document.createElement('canvas');
				const sy = (sx * img.height) / img.width;

				canvas.width = sx;
				canvas.height = sy;
				const ctx = canvas.getContext('2d');

				ctx.drawImage(img, 0, 0, sx, sy);

				let canvasURL = null;

				try {
					canvasURL = canvas.toDataURL(params.format, params.quality);
				} catch (ex) {
					console.warn(ex);
					canvasURL = null;
				}

				callback(canvasURL, { width: sx, height: sy });
			},
		]);
	},
};

export default ThumbMakerModule;
