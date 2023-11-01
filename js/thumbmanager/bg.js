import Broadcaster from '../_external/broadcaster.js';
import { onHiddenCaptureFinishedTab } from './tab.js';

const ThumbManagerBgModule = function (fvdSpeedDial) {
	// lister to capture finished
	function onHiddenCaptureFinished(params, resultData) {
		onHiddenCaptureFinishedTab(fvdSpeedDial, params, resultData);

		// update info in db
		if (resultData && params.id && params.type) {
			const dataUrl = resultData.dataUrl;
			const title = resultData.title;
			const thumbSize = resultData.thumbSize;

			switch (params.type) {
				case 'speeddial':
					fvdSpeedDial.StorageSD.getDial(params.id, function (oldDial) {
						if (!oldDial) {
							return;
						}

						const resultData = {
							auto_title: title,
						};

						if (title) resultData.title = title;

						if (oldDial) {
							if (!oldDial.title && oldDial.auto_title != title) {
								// need to sync dials where changed auto title
								fvdSpeedDial.Sync.addDataToSync({
									category: 'dials',
									data: params.id,
									translate: 'dial',
								});
							}
						}

						if (params.saveImage && oldDial.thumb_source_type === 'screen') {
							resultData.thumb = dataUrl;
							resultData.screen_maked = 1;
							resultData.thumb_width = thumbSize.width;
							resultData.thumb_height = thumbSize.height;
							resultData.last_preview_update = new Date().getTime();
						}

						fvdSpeedDial.StorageSD.updateDial(params.id, resultData, function () {
						});
					});

					break;

				case 'mostvisited':
					resultData = {
						auto_title: title,
					};

					if (params.saveImage) {
						resultData.thumb_source_type = 'screen';
						resultData.thumb = dataUrl;
						resultData.screen_maked = 1;
						resultData.thumb_width = thumbSize.width;
						resultData.thumb_height = thumbSize.height;
						resultData.get_screen_method = 'auto';
					}

					fvdSpeedDial.MostVisited.updateData(params.id, resultData, function () {});

					break;
			}
		}
	}

	function isQueued(params) {
		const queue = fvdSpeedDial.HiddenCaptureQueue.getQueue();
		const currentItem = fvdSpeedDial.HiddenCaptureQueue.getCurrentItem();

		if (currentItem) {
			if (currentItem.params.type == params.type && currentItem.params.id == params.id) {
				return true;
			}
		}

		for (let i = 0; i != queue.length; i++) {
			const item = queue[i];

			if (item.params.type == params.type && item.params.id == params.id) {
				return true;
			}
		}

		return false;
	}

	this.hiddenCaptureThumb = function (aParams, callback) {
		if (typeof aParams.saveImage === 'undefined') {
			aParams.saveImage = true;
		}

		if (typeof aParams.resetScreenMaked === 'undefined') {
			aParams.resetScreenMaked = true;
		}

		fvdSpeedDial.Utils.Async.chain([
			function (chainCallback) {
				if (aParams.resetScreenMaked) {
					if (aParams.type == 'speeddial') {
						fvdSpeedDial.StorageSD.updateDial(
							aParams.data.id,
							{
								screen_maked: 0,
							},
							function () {
								chainCallback();
							}
						);
					} else if (aParams.type == 'mostvisited') {
						fvdSpeedDial.MostVisited.updateData(
							aParams.data.id,
							{
								screen_maked: 0,
							},
							function () {
								chainCallback();
							}
						);
					}
				} else {
					chainCallback();
				}
			},

			function (chainCallback) {
				if (aParams.data.url) {
					chainCallback();
				} else {
					if (aParams.type == 'speeddial') {
						fvdSpeedDial.StorageSD.getDial(aParams.data.id, function (dial) {
							aParams.data.url = dial.url;
							aParams.elemId = 'dialCell_' + aParams.data.id;

							chainCallback();
						});
					} else if (aParams.type == 'mostvisited') {
						fvdSpeedDial.MostVisited.getById(
							aParams.data.id,
							aParams.interval,
							'host',
							function (row) {
								aParams.data.url = row.url;
								aParams.elemId = 'dialCell_' + aParams.data.id;

								chainCallback();
							}
						);
					}
				}
			},
			function () {
				const data = aParams.data;
				const elem = aParams.elem;

				if (elem) {
					if (aParams.saveImage) {
						elem.setAttribute('loadscreen', 1);

						const screen = elem.querySelector('.body .preview-image');

						if (screen) {
							fvdSpeedDial.Utils.removeScreenPreview(screen);
						}
					}
				}

				const params = {
					url: data.url,
					id: data.id,
					elemId: aParams.elemId,
					type: aParams.type,
					saveImage: aParams.saveImage,
					interval: aParams.interval,
				};

				if (!isQueued(params)) {
					fvdSpeedDial.HiddenCaptureQueue.capture(params, callback);
				} else {
				}
			},
		]);
	};

	Broadcaster.onMessage.addListener(function (msg, sender, sendResponse) {
		if (msg.action == 'hiddencapture:done') {
			onHiddenCaptureFinished(msg.params, msg.result);
		} else if (msg.action == 'thumbmanager:hiddenCaptureThumb') {
			const cb = function () {};
			fvdSpeedDial.SpeedDial.ThumbManager.hiddenCaptureThumb(msg.params, function (res) {
				if (msg.wantResponse) {
					sendResponse(res);
				}
			});

			if (msg.waitResponse) {
				return true;
			}
		}
	});
};

// fvdSpeedDial.SpeedDial.ThumbManager = new ThumbManager();

export default ThumbManagerBgModule;
