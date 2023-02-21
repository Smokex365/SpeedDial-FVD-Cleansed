if (
	typeof __fvdSpeedDial_inserted === 'undefined'
	&& !document.getElementById('fvdSpeedDialCropper_delay')
) {
	__fvdSpeedDial_inserted = true;

	(function () {
		function viewPortSize() {
			const res = {};

			if (document.compatMode === 'BackCompat') {
				res.height = document.body.clientHeight;
				res.width = document.body.clientWidth;
			} else {
				res.height = document.documentElement.clientHeight;
				res.width = document.documentElement.clientWidth;
			}

			return res;
		}

		function _(msg) {
			return chrome.i18n.getMessage(msg);
		}

		function fixFlash() {
			const objects = document.getElementsByTagName('object');
			const _singleEmbeds = document.getElementsByTagName('embed');
			const singleEmbeds = [];

			for (var i = 0; i != _singleEmbeds.length; i++) {
				singleEmbeds.push(_singleEmbeds[i]);
			}

			for (var i = 0; i != objects.length; i++) {
				let needReplace = false;

				const _embed = objects[i].getElementsByTagName('embed')[0];

				if (_embed) {
					var index;

					if ((index = singleEmbeds.indexOf(_embed)) != -1) {
						singleEmbeds.splice(index, 1);
					}
				}

				const object = objects[i].cloneNode(true);
				var embed = object.getElementsByTagName('embed')[0];

				if (embed) {
					if (embed.getAttribute('wmode') != 'transparent') {
						needReplace = true;
					}

					embed.setAttribute('wmode', 'transparent');
				}

				//<param name="background" value="transparent" />
				//<param name="windowless" value="true" />

				let objectType = null;

				const params = object.getElementsByTagName('param');

				for (var j = 0; j != params.length; j++) {
					if (params[j].getAttribute('name').toLowerCase() == 'movie') {
						objectType = 'flash';
						break;
					}

					if (params[j].getAttribute('name').toLowerCase() == 'source') {
						objectType = 'silverlight';
						break;
					}
				}

				if (objectType == 'flash') {
					var paramElem = null;

					for (var j = 0; j != params.length; j++) {
						if (params[j].getAttribute('name').toLowerCase() == 'wmode') {
							paramElem = params[j];
							break;
						}
					}

					if (!paramElem) {
						paramElem = document.createElement('param');
						object.appendChild(paramElem);
					}

					if (paramElem.getAttribute('wmode') != 'transparent') {
						needReplace = true;
					}

					paramElem.setAttribute('name', 'wmode');
					paramElem.setAttribute('value', 'transparent');
				} else if (objectType == 'silverlight') {
					var paramElem = null;

					for (var j = 0; j != params.length; j++) {
						if (params[j].getAttribute('name').toLowerCase() == 'windowless') {
							paramElem = params[j];
							break;
						}
					}

					if (!paramElem) {
						paramElem = document.createElement('param');
						object.appendChild(paramElem);
					}

					if (paramElem.getAttribute('value') != 'true') {
						needReplace = true;
					}

					paramElem.setAttribute('name', 'windowless');
					paramElem.setAttribute('value', 'true');
				}

				if (needReplace) {
					objects[i].parentNode.replaceChild(object, objects[i]);
				}
			}

			for (var i = 0; i != singleEmbeds.length; i++) {
				var embed = singleEmbeds[i];

				if (embed.getAttribute('wmode') == 'transparent') {
					continue;
				}

				const newEmbed = embed.cloneNode(true);

				newEmbed.setAttribute('wmode', 'transparent');
				embed.parentNode.replaceChild(newEmbed, embed);
			}
		}

		let overlay = null;
		let initData = null;
		const interval = null;
		let delayBox = null;
		let button = null;
		let cancelButton = null;
		let buttonStartCrop = null;
		let img = null;
		let keyListener = null;
		let pleaseWaitDiv = null;
		let delayBoxResizeWindowListener = null;

		const listener = function (port) {
			// immedately remove listener, accept only one connection
			chrome.runtime.onConnect.removeListener(listener);

			if (document.getElementsByTagName('frame').length !== 0) {
				// if has frame set do not screen by marquee, screen full page
				let framesCounter = 0;

				function getFrames(doc) {
					const frames = doc.getElementsByTagName('frame');

					for (let i = 0; i !== frames.length; i++) {
						const frame = frames[i];

						framesCounter++;

						(function (frame) {
							frame.addEventListener(
								'load',
								function () {
									framesCounter--;

									if (getFrames(frame.contentDocument) === 0 && framesCounter === 0) {
										port.postMessage({ message: 'make_fullscreen_snapshoot' });
									}
								},
								false
							);
						})(frame);
					}

					return frames.length;
				}

				getFrames(document);

				return;
			}

			setTimeout(function () {
				port.postMessage({ message: 'ready_to_init' });
			}, 100);

			fixFlash();

			keyListener = function (event) {
				if (event.keyCode === 27) {
					port.postMessage({
						message: 'click_cancel',
					});
				}
			};

			port.onMessage.addListener(function (message) {
				switch (message.message) {
					case 'destroy':
						try {
							delayBox.setAttribute('hidden', true);

							try {
								document.removeEventListener('keydown', keyListener);
							} catch (ex) {
								console.warn(ex);
							}

							try {
								window.removeEventListener('resize', delayBoxResizeWindowListener);
							} catch (ex) {
								console.warn(ex);
							}

							try {
								const ias = $(img).imgAreaSelect({
									instance: true,
								});

								ias.cancelSelection();
							} catch (ex) {
								console.warn(ex);
							}

							button.setAttribute('hidden', true);
							cancelButton.setAttribute('hidden', true);
							overlay.setAttribute('hidden', true);

							try {
								const ttHolder = document.getElementById('tiptip_holder');

								ttHolder.parentNode.removeChild(ttHolder);
							} catch (ex) {
								console.warn(ex);
							}
						} catch (ex) {
							console.warn(ex);
						}

						break;

					case 'captured':
						pleaseWaitDiv = document.createElement('div');
						pleaseWaitDiv.textContent = _('cropper_message_wait');
						pleaseWaitDiv.setAttribute('id', 'fvdSpeedDialCropper_PleaseWait');

						overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';

						overlay.appendChild(pleaseWaitDiv);

						break;

					case 'url_setted':
						port.postMessage({
							message: 'return_to_speeddial',
						});

						break;

					case 'created':
						var toSpeedDial = true;

						try {
							if (message.data.urlChanged) {
								toSpeedDial = false;

								pleaseWaitDiv.textContent = '';

								const selectUrlContainer = document.createElement('div');

								selectUrlContainer.className = 'fvdSpeedDial_questionContainer';

								const divUrlOld = document.createElement('div');
								const divUrlnew = document.createElement('div');

								divUrlOld.className = 'fvdSpeedDial_urlPickRow';
								divUrlnew.className = 'fvdSpeedDial_urlPickRow';

								const spanOldUrl = document.createElement('span');
								const spanNewUrl = document.createElement('span');

								spanOldUrl.className = 'fvdSpeedDial_urlContent';
								spanNewUrl.className = 'fvdSpeedDial_urlContent';

								spanOldUrl.setAttribute('title', message.data.startUrl);
								spanNewUrl.setAttribute('title', message.data.currentUrl);

								const urlPickLinkOld = document.createElement('span');
								const urlPickLinkNew = document.createElement('span');

								urlPickLinkOld.textContent = _('cropper_pick_this');
								urlPickLinkNew.textContent = _('cropper_pick_this');
								urlPickLinkNew.className = 'fvdSpeedDial_urlPickLink';
								urlPickLinkOld.className = 'fvdSpeedDial_urlPickLink';

								urlPickLinkNew.addEventListener(
									'click',
									function (event) {
										if (event.button == 0) {
											port.postMessage({
												message: 'set_url',
												data: {
													url: message.data.currentUrl,
												},
											});
										}
									},
									false
								);

								urlPickLinkOld.addEventListener(
									'click',
									function (event) {
										if (event.button == 0) {
											port.postMessage({
												message: 'set_url',
												data: {
													url: message.data.startUrl,
												},
											});
										}
									},
									false
								);

								spanOldUrl.textContent = _('cropper_your_url') + ': ' + message.data.startUrl;
								spanNewUrl.textContent
									= _('cropper_last_page_url') + ': ' + message.data.currentUrl;

								divUrlOld.appendChild(spanOldUrl);
								divUrlnew.appendChild(spanNewUrl);
								divUrlOld.appendChild(urlPickLinkOld);
								divUrlnew.appendChild(urlPickLinkNew);

								selectUrlContainer.appendChild(divUrlOld);
								selectUrlContainer.appendChild(divUrlnew);

								pleaseWaitDiv.appendChild(selectUrlContainer);
							}
						} catch (ex) {
							console.warn(ex);
						}

						if (toSpeedDial) {
							port.postMessage({
								message: 'return_to_speeddial',
							});
						}

						break;

					case 'init':
						initData = message.data;

						document.addEventListener('keydown', keyListener, false);

						var elapsed = 0;

						function adjustDelayBoxPosition() {
							let left = delayBox.style.left.replace('px', '');
							let top = delayBox.style.top.replace('px', '');

							const maxLeft = document.documentElement.clientWidth - delayBox.offsetWidth;
							const maxTop = window.innerHeight - delayBox.offsetHeight - 40;

							if (left > maxLeft) {
								left = maxLeft;
							}

							if (top > maxTop) {
								top = maxTop;
							}

							delayBox.style.left = left + 'px';
							delayBox.style.top = top + 'px';
						}

						delayBoxResizeWindowListener = function () {
							adjustDelayBoxPosition();
						};

						window.addEventListener('resize', delayBoxResizeWindowListener, false);

						delayBox = document.createElement('div');

						delayBox.style.left = initData.photoPosition.left + 'px';
						delayBox.style.top = initData.photoPosition.top + 'px';

						delayBox.setAttribute('id', 'fvdSpeedDialCropper_delay');

						buttonStartCrop = document.createElement('div');
						buttonStartCrop.className = 'fvdSpeedDialCropper_SnapImage';
						buttonStartCrop.setAttribute('id', 'fvdSpeedDialCropper_StartCrop');

						buttonStartCrop.setAttribute('title', _('cropper_click_to_make_preview'));
						$(buttonStartCrop).tipTip({ activeOnStart: true, defaultPosition: 'right' });

						buttonStartCrop.addEventListener(
							'click',
							function () {
								try {
									document.getElementById('tiptip_holder').style.display = 'none';
								} catch (ex) {
									console.warn(ex);
								}
								port.postMessage({
									message: 'click_start_crop',
								});
							},
							false
						);

						var buttonCancelCrop = document.createElement('div');

						buttonCancelCrop.className = 'fvdSpeedDialCropper_cancel';
						buttonCancelCrop.setAttribute('id', 'fvdSpeedDialCropper_DelayCancelCrop');

						buttonCancelCrop.addEventListener(
							'click',
							function () {
								port.postMessage({
									message: 'click_cancel',
								});
							},
							false
						);

						var moveButton = document.createElement('div');

						moveButton.className = 'fvdSpeedDialCropper_move';
						moveButton.setAttribute('id', 'fvdSpeedDialCropper_DelayMove');

						moveButton.addEventListener(
							'mousedown',
							function (event) {
								const tmpOverlay = document.createElement('div');

								tmpOverlay.style.position = 'fixed';
								tmpOverlay.style.left = '0px';
								tmpOverlay.style.top = '0px';
								tmpOverlay.style.width = '100%';
								tmpOverlay.style.height = '100%';
								tmpOverlay.style.zIndex = 99999999;
								document.body.appendChild(tmpOverlay);

								let posLeft = delayBox.style.left.replace('px', '');
								let posTop = delayBox.style.top.replace('px', '');

								try {
									posLeft = parseFloat(posLeft);
									posTop = parseFloat(posTop);

									if (isNaN(posLeft)) {
										posLeft = 0;
									}

									if (isNaN(posTop)) {
										posTop = 0;
									}
								} catch (ex) {
									console.warn(ex);
								}

								const startX = event.screenX;
								const startY = event.screenY;

								const moveEvent = function (event) {
									//
									const newLeft = posLeft + event.screenX - startX;
									const newTop = posTop + event.screenY - startY;

									let allowLeft = true;
									let allowTop = true;

									if (newLeft < 0) {
										allowLeft = false;
									} else if (
										newLeft + delayBox.offsetWidth
										> document.documentElement.clientWidth
									) {
										allowLeft = false;
									}

									if (newTop < 0) {
										allowTop = false;
									} else if (newTop + delayBox.offsetHeight + 40 > window.innerHeight) {
										allowTop = false;
									}

									if (allowLeft) {
										delayBox.style.left = newLeft + 'px';
									}

									if (allowTop) {
										delayBox.style.top = newTop + 'px';
									}

									event.preventDefault();
									event.stopPropagation();
								};

								var mouseUpEvent = function () {
									document.removeEventListener('mousemove', moveEvent);
									document.removeEventListener('mouseup', mouseUpEvent);

									try {
										tmpOverlay.parentNode.removeChild(tmpOverlay);
									} catch (ex) {
										console.warn(ex);
									}

									port.postMessage({
										message: 'change_photo_position',
										data: {
											left: delayBox.style.left.replace('px', ''),
											top: delayBox.style.top.replace('px', ''),
										},
									});
								};

								document.addEventListener('mousemove', moveEvent, false);
								document.addEventListener('mouseup', mouseUpEvent, false);

								event.preventDefault();
								event.stopPropagation();
							},
							false
						);

						delayBox.appendChild(buttonStartCrop);
						delayBox.appendChild(buttonCancelCrop);
						delayBox.appendChild(moveButton);

						document.body.appendChild(delayBox);

						setTimeout(function () {
							adjustDelayBoxPosition();
						}, 100);

						break;

					case 'show_crop_area':
						delayBox.setAttribute('hidden', true);
						buttonStartCrop.setAttribute('hidden', true);

						overlay = document.createElement('div');
						overlay.setAttribute('id', 'fvdSpeedDialCropper_Overlay');

						img = document.createElement('img');
						img.src = chrome.runtime.getURL('images/cropper/img.png');

						overlay.appendChild(img);

						document.body.appendChild(overlay);

						button = document.createElement('div');
						button.setAttribute('id', 'fvdSpeedDialCropper_Snap');
						button.setAttribute('hidden', true);
						button.setAttribute('title', _('cropper_click_to_make_preview'));
						button.className = 'fvdSpeedDialCropper_SnapImage';

						button.addEventListener(
							'click',
							function (event) {
								const ias = $(img).imgAreaSelect({
									instance: true,
								});
								const selection = ias.getSelection();

								ias.cancelSelection();
								button.setAttribute('hidden', true);
								cancelButton.setAttribute('hidden', true);

								try {
									const ttHolder = document.getElementById('tiptip_holder');

									ttHolder.parentNode.removeChild(ttHolder);
								} catch (ex) {
									console.warn(ex);
								}
								selection.x1 *= window.devicePixelRatio;
								selection.y1 *= window.devicePixelRatio;
								selection.width *= window.devicePixelRatio;
								selection.height *= window.devicePixelRatio;

								setTimeout(function () {
									port.postMessage({
										message: 'snapshoot',
										data: selection,
									});
								}, 100);
							},
							false
						);

						document.body.appendChild(button);

						try {
							$(button).tipTip({
								activeOnStart: true,
							});
						} catch (ex) {
							console.warn(ex);
						}

						cancelButton = document.createElement('div');
						cancelButton.className = 'fvdSpeedDialCropper_cancel';
						cancelButton.setAttribute('hidden', true);

						cancelButton.addEventListener(
							'click',
							function () {
								port.postMessage({
									message: 'click_cancel',
								});
							},
							false
						);

						document.body.appendChild(cancelButton);

						const positionButton = function (params) {
							button.style.left = params.x1 + 3 + 'px';
							button.style.top = params.y2 - button.offsetHeight - 3 + 'px';

							let posTop = params.y1 - cancelButton.offsetHeight;

							if (posTop < 0) {
								posTop = 0;
							}

							cancelButton.style.left = params.x2 + 3 + 'px';
							cancelButton.style.top = posTop + 'px';
						};

						const whRatio = initData.init.width / initData.init.height;
						const windowSize = viewPortSize();
						const winWidth = windowSize.width;
						const winHeight = windowSize.height;

						if (winWidth < initData.init.width) {
							initData.init.width = winWidth;
							initData.init.height = initData.init.width / whRatio;
						}

						if (winHeight < initData.init.height) {
							initData.init.height = winHeight;
							initData.init.width = initData.init.height * whRatio;
						}

						const x1 = Math.round((winWidth - initData.init.width) / 2);
						const y1 = Math.round((winHeight - initData.init.height) / 2);
						const x2 = x1 + initData.init.width;
						const y2 = y1 + initData.init.height;

						$(img).imgAreaSelect({
							parent: overlay,
							handles: true,
							persistent: true,
							x1: x1,
							y1: y1,
							x2: x2,
							y2: y2,
							aspectRatio: initData.aspectRatio + ':1',
							minWidth: initData.minWidth,
							onSelectChange: function (img, params) {
								positionButton(params);
								return true;
							},
							onInit: function (img, params) {
								button.removeAttribute('hidden');
								cancelButton.removeAttribute('hidden');
								positionButton(params);
								return true;
							},
						});

						break;
				}
			});
		};

		chrome.runtime.onConnect.addListener(listener);
	})();
}
