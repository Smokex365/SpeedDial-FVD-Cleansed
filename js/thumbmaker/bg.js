import { Utils } from '../utils.js';

const PAGE_SCREEN_PARAMS = {
	format: 'image/jpeg',
	quality: 80,
};

const ThumbMakerModule = function (fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;
	this.init();
};

ThumbMakerModule.prototype = {
	_listenData: [],

	removeListener: function (listener) {
		const index = this._listenData.indexOf(listener);

		if (index !== -1) {
			this._listenData.splice(index, 1);
		}
	},

	resize: function (img, sx, callback, params) {
		params = params || {};
		params.format = params.format || 'image/png';
		params.quality = params.quality || 100;

		const srcLower = img.getAttribute('src').toLowerCase();

		Utils.Async.chain([
			function (next) {
				if (srcLower.indexOf('.svg') === srcLower.length - 4) {
					/*
					url = "https://...";
					fetch(new Request(url))
					.then(response => {
						console.info('response', response);
						return response.blob();
					})
					.then(result => {
						console.info('result', result);
					})
					.catch(function (ex) {
						console.info('Request failed', ex);
					});
					*/

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
	getImageDataPath: function (params, callback) {
		const imgUrl = params.imgUrl;
		let screenWidth = params.screenWidth;

		if (typeof document === 'undefined') {
			Utils.imageUrlToDataUrl(imgUrl, (dataUrl, size) => {
				callback(dataUrl, size);
			});
		} else {
			const img = document.createElement('img');
			const that = this;

			img.onerror = function () {
				callback(null);
			};
			img.onload = function () {
				try {
					if (img.width < screenWidth) {
						screenWidth = img.width;
					}

					that.resize(
						img,
						screenWidth,
						function (imgUrl, size) {
							callback(imgUrl, size);
						},
						params.format
					);
				} catch (ex) {
					console.warn(ex);
					callback(imgUrl, size);
				}
			};
			img.setAttribute('src', imgUrl);
		}
	},

	screenTab: function (params) {
		const listener = {
			tabId: params.tabId,
			type: params.type,
			dialId: params.dialId,
			width: params.width,
			url: params.url,
			screenDelay: params.delay,
			saveImage: params.saveImage,
			port: null,
		};

		for (let i = 0; i !== this._listenData.length; i++) {
			if (this._listenData[i].tabId === params.tabId) {
				// replace listener
				this._listenData[i] = listener;
				return;
			}
		}

		this._listenData.push(listener);
	},

	listenerForTab: function (tabId) {
		for (let i = 0; i !== this._listenData.length; i++) {
			if (this._listenData[i].tabId === tabId) {
				return this._listenData[i];
			}
		}
		return null;
	},

	init: function () {
		const that = this;
		const { fvdSpeedDial } = this;
		const { Prefs, Sync, SpeedDial, MostVisited, StorageSD } = fvdSpeedDial;

		chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
			if (info.status) {
				let port;
				const listener = that.listenerForTab(tabId);

				if (!listener) {
					return;
				}

				function returnToSpeedDial() {
					if (listener.type === 'speeddial') {
						StorageSD.getDial(listener.dialId, function (oldDial) {
							chrome.tabs.create(
								{
									active: true,
									url: chrome.runtime.getURL(
										`newtab.html#force-display&dial_preview_maked=${listener.dialId}&show_group_id=${oldDial.group_id}`
									),
								},
								function () {
									chrome.tabs.remove(tabId);
								}
							);
						});
					} else {
						chrome.tabs.create(
							{ active: true, url: chrome.runtime.getURL('newtab.html#force-display') },
							function () {
								chrome.tabs.remove(tabId);
							}
						);
					}
				}

				function saveToDB(result, thumbSize, callback) {
					// get last tab info
					chrome.tabs.get(tabId, function (tab) {
						switch (listener.type) {
							case 'speeddial':
								StorageSD.getDial(listener.dialId, function (oldDial) {
									const resultData = {
										auto_title: tab.title,
									};

									if (oldDial) {
										if (typeof Sync !== 'object') {
											console.info('Sync is', typeof Sync);
										} else {
											Sync.addDataToSync({
												category: 'dials',
												data: listener.dialId,
												translate: 'dial',
											});
										}
									}

									if (listener.saveImage) {
										resultData.thumb = result;
										resultData.screen_maked = 1;
										resultData.thumb_width = thumbSize.width;
										resultData.thumb_height = thumbSize.height;
										resultData.need_sync_screen = 1;
									}

									StorageSD.updateDial(listener.dialId, resultData, function () {
										try {
											port.postMessage({
												message: 'created',
												data: {
													urlChanged: !Utils.isIdenticalUrls(listener.url, tab.url),
													startUrl: listener.url,
													currentUrl: tab.url,
												},
											});
										} catch (ex) {
											console.warn(ex);
										}

										if (callback) {
											callback();
										}
									});
								});
								break;

							case 'mostvisited':
								const resultData = {
									auto_title: tab.title,
								};

								if (listener.saveImage) {
									resultData.thumb_source_type = 'screen';
									resultData.thumb = result;
									resultData.screen_maked = 1;
									resultData.thumb_width = thumbSize.width;
									resultData.thumb_height = thumbSize.height;
								}

								MostVisited.updateData(listener.dialId, resultData, function () {
									try {
										port.postMessage({
											message: 'created',
										});
									} catch (ex) {
										console.warn(ex);
									}

									if (callback) {
										callback();
									}
								});
								break;
						}
					});
				}

				if (!listener.saveImage) {
					// without image, grab only title
					if (tab.title) {
						that.removeListener(listener);
						saveToDB(null, null, function () {
							returnToSpeedDial();
						});
					}

					return;
				}

				port = listener.port;

				function fullScreen() {
					setTimeout(function () {
						chrome.tabs.get(tabId, function (tab) {
							if (tab.status === 'complete') {
								// remove listener
								that.removeListener(listener);

								chrome.tabs.captureVisibleTab(
									null,
									{
										format: 'png',
									},
									function (dataurl) {
										that.getImageDataPath(
											{
												imgUrl: dataurl,
												screenWidth: listener.width,
												format: PAGE_SCREEN_PARAMS,
											},
											function (result, thumbSize) {
												saveToDB(result, thumbSize, function () {
													returnToSpeedDial();
												});
											}
										);
									}
								);
							}
						});
					}, 500);
				}

				fvdSpeedDial.Utils.Async.chain([
					function (callbackChain) {
						chrome.scripting.executeScript(
							{
								target: { tabId },

								files: ['content-scripts/cropper/cropper.js'],
							},
							() => {
								// wait one second for response
								setTimeout(function () {
									if (!listener.canBeScripted) {
										// make screen of tab

										// wait while tab will be completed
										function _waitForTabCompletion() {
											// if tab already completed
											chrome.tabs.get(tabId, function (tab) {
												if (!tab) {
													// tab removed
													return;
												}

												if (tab.status === 'complete') {
													fullScreen();
												} else {
													setTimeout(function () {
														_waitForTabCompletion();
													}, 1000);
												}
											});
										}

										_waitForTabCompletion();
									}
								}, 1000);

								// connect to tab

								port = chrome.tabs.connect(tabId, {
									name: 'thumbmaker_cropper',
								});

								listener.port = port;
								port.onMessage.addListener(function (message) {
									switch (message.message) {
										case 'change_photo_position':
											Prefs.set('cropper_photo_position_left', message.data.left);
											Prefs.set('cropper_photo_position_top', message.data.top);

											break;

										case 'set_url':
											if (listener.type === 'speeddial') {
												StorageSD.updateDial(
													listener.dialId,
													{
														url: message.data.url,
													},
													function () {
														port.postMessage({
															message: 'url_setted',
														});
													}
												);
											}

											break;

										case 'ready_to_init':
											listener.canBeScripted = true;
											// next include all other scripts and init cropper
											callbackChain();

											break;

										case 'return_to_speeddial':
											returnToSpeedDial();
											break;

										case 'click_start_crop':
											port.postMessage({ message: 'show_crop_area' });
											break;

										case 'click_cancel':
											// remove listener
											try {
												that.removeListener(listener);
												port.postMessage({
													message: 'destroy',
												});
											} catch (ex) {
												console.warn(ex);
											}
											break;

										case 'make_fullscreen_snapshoot':
											fullScreen();
											break;

										case 'snapshoot':
											const data = message.data;

											chrome.tabs.captureVisibleTab(
												null,
												{
													format: 'png',
												},
												function (dataurl) {
													port.postMessage({ message: 'captured' });
													// remove listener
													try {
														that.removeListener(listener);
													} catch (ex) {
														console.warn(ex);
													}

													if (typeof document === 'object') {
														const img = document.createElement('img');
														img.onload = function () {
															const canvas = document.createElement('canvas');

															canvas.width = data.width;
															canvas.height = data.height;
															const ctx = canvas.getContext('2d');

															ctx.drawImage(
																img,
																data.x1,
																data.y1,
																data.width,
																data.height,
																0,
																0,
																data.width,
																data.height
															);

															that.getImageDataPath(
																{
																	imgUrl: canvas.toDataURL('image/png'),
																	screenWidth: listener.width,
																	format: PAGE_SCREEN_PARAMS,
																},
																function (result, thumbSize) {
																	saveToDB(result, thumbSize);
																}
															);
														};
														img.src = dataurl;
													} else {
														saveToDB(dataurl, {
															width: data.width,
															height: data.height,
														});
													}
												}
											);
											break;
									}
								});
							}
						);
					},
					function (callbackChain) {
						chrome.scripting.executeScript(
							{
								target: { tabId },
								files: ['extras/jquery.js'],
							},
							() => {
								callbackChain();
							}
						);
					},
					function (callbackChain) {
						chrome.scripting.executeScript(
							{
								target: { tabId },
								files: ['content-scripts/cropper/imgareaselect.js'],
							},
							() => {
								callbackChain();
							}
						);
					},
					function (callbackChain) {
						chrome.scripting.insertCSS(
							{
								target: { tabId },
								files: ['content-scripts/cropper/imgareaselect.css'],
							},
							() => {
								callbackChain();
							}
						);
					},
					function (callbackChain) {
						chrome.scripting.executeScript(
							{
								target: { tabId },
								files: ['content-scripts/cropper/tiptip.js'],
							},
							() => {
								callbackChain();
							}
						);
					},
					function (callbackChain) {
						chrome.scripting.insertCSS(
							{
								target: { tabId },
								files: ['content-scripts/cropper/tiptip.css'],
							},
							() => {
								callbackChain();
							}
						);
					},
					function (callbackChain) {
						chrome.scripting.insertCSS(
							{
								target: { tabId },
								files: ['content-scripts/cropper/style.css'],
							},
							() => {
								callbackChain();
							}
						);
					},
					function () {
						port.postMessage({
							message: 'init',
							data: {
								aspectRatio: SpeedDial._cellsSizeRatio,
								init: {
									width: 1024,
									height: 1024 / SpeedDial._cellsSizeRatio,
								},
								minWidth: SpeedDial.getMaxCellWidth(),
								delay: listener.screenDelay,
								photoPosition: {
									left: Prefs.get('cropper_photo_position_left', 0),
									top: Prefs.get('cropper_photo_position_top', 0),
								},
							},
						});
					},
				]);
			}
		});
	},
};

export default ThumbMakerModule;
