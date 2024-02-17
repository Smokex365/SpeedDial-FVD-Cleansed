import Broadcaster from '../_external/broadcaster.js';
import { Utils, _b } from '../utils.js';

export function onHiddenCaptureFinishedTab(fvdSpeedDial, params, resultData) {
	if (!params.elemId) {
		return;
	}

	// update info in speeddial
	const elem = document.getElementById(params.elemId);
	let dialData;

	if (!elem) {
		return;
	}

	Utils.Async.chain([
		function (chainCallback) {
			if (params.type == 'speeddial') {
				fvdSpeedDial.StorageSD.getDial(params.id, function (dial) {
					dialData = dial;

					if (dial.title) {
						//delete resultData.title;
					}

					chainCallback();
				});
			} else if (params.type == 'mostvisited') {
				fvdSpeedDial.MostVisited.getById(params.id, params.interval, 'host', function (row) {
					fvdSpeedDial.MostVisited.extendData(row, function (mvData) {
						if (mvData.title) {
							delete resultData.title;
						}

						dialData = mvData;

						chainCallback();
					});
				});
			}
		},
		function () {
			elem.removeAttribute('loadscreen');

			if (!resultData) {
				// failed here
				return;
			}

			if (resultData.title) {
				let titleContainer = elem.querySelector('.head span');

				if (!titleContainer) {
					// try to get titlecontainer for list element
					titleContainer = elem.querySelector('.leftData .text');
				}

				if (titleContainer) {
					titleContainer.textContent = resultData.title;
					elem.removeAttribute('notitle');
				}

				elem.setAttribute(
					'title',
					fvdSpeedDial.SpeedDial.Builder.cellTitle({
						title: resultData.title,
						url: dialData.url,
					})
				);
			}

			const screen = elem.querySelector('.body .preview-image');

			if (
				screen
				&& params.saveImage
				&& resultData.dataUrl
				&& dialData.thumb_source_type == 'screen'
			) {
				Utils.setScreenPreview(screen, resultData.dataUrl, true, false, resultData);
			} else {
			}
		},
	]);
}

export const ThumbManagerModule = function (fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;

	this.setThumbToElement = function (params) {
		const data = params.data;
		const elem = params.elem;

		// const screen = elem.querySelector(".body .screen");
		const screen = elem.querySelector('.body .preview-image');
		elem.setAttribute('thumb-source-type', data.thumb_source_type);

		if (data.thumb_source_type == 'screen') {
			if (data.screen_maked != 1) {
				if (data.get_screen_method == 'manual') {
					elem.setAttribute('noscreen', 1);
				} else {
					this.hiddenCaptureThumb({
						data: data,
						type: elem.getAttribute('type'),
						saveImage: true,
						resetScreenMaked: false,
						interval: params.interval,
						elemId: elem.getAttribute('id'),
						elem: elem,
					});
				}
			} else {
				// setup screen
				if (screen) {
					Utils.setScreenPreview(screen, data.thumb, params.nocache, false, data);
				}
			}
		} else {
			if (screen) {
				if (data.thumb_source_type == 'url' || data.thumb_source_type == 'local_file') {
					Utils.setUrlPreview(
						{
							elem: screen,
							size: params.cellSize,
						},
						{
							url: data.thumb,
							size: {
								width: data.thumb_width,
								height: data.thumb_height,
							},
						},
						params.nocache
					);
				}

				if (data.thumb_source_type === 'custom_preview' && data.previewTitle) {
					Utils.setCustomPreview(screen, data.preview_style, data.previewTitle);
					// const adElem = elem.querySelector('.body .screenParent .add');

					// if (adElem) {
					// 	adElem.style.color = data.preview_style.color;
					// 	adElem.style.border = `1px solid ${data.preview_style.color}`;
					// }
				}

				/*
				if (!data.displayTitle) {
					this.hiddenCaptureThumb({
						data: data,
						type: elem.getAttribute('type'),
						saveImage: false,
						resetScreenMaked: false,
						interval: params.interval,
						elemId: elem.getAttribute('id'),
					});
				}
				*/
			}
		}
	};
	this.hiddenCaptureThumb = function (params, callback) {
		const {
			SpeedDial: { ThumbManagerBg },
		} = fvdSpeedDial;

		if (!params.elem && params.elemId) {
			params.elem = document.getElementById(params.elemId);
		}

		if (params.elem) {
			params.elem.setAttribute('loadscreen', 1);
			Utils.removeScreenPreview(params.elem.querySelector('.preview-image'));
		}

		if (params.elem) {
			delete params.elem;
		}

		ThumbManagerBg.hiddenCaptureThumb(params, res => {
			if (callback) {
				callback(res);
			}
		});

		/*
		Broadcaster.sendMessage({
			action: 'thumbmanager:hiddenCaptureThumb',
			params,
			result: function (res) {
				if (callback) {
					callback(res);
				}
			},
		});
		*/
		/*
		chrome.runtime.sendMessage(
			{
				action: 'thumbmanager:hiddenCaptureThumb',
				params: params,
				wantResponse: callback ? true : false,
			},
			function (res) {
				if (callback) {
					callback(res);
				}
			}
		);
		*/
	};
};
