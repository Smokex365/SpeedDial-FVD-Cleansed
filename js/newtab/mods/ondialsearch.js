import { _ } from '../../localizer.js';
import { _b } from '../../utils.js';

function BlinkingPlaceholder(elem, text) {
	this.elem = elem;
	this.text = text;
	this.interval = null;
	this.intervalMs = 500;
	this.withCaret = false;
}

BlinkingPlaceholder.prototype.changePlaceholder = function () {
	let text = this.text;

	if (this.withCaret) {
		text += ' |';
	}

	this.withCaret = !this.withCaret;
	this.elem.setAttribute('placeholder', text);
};

BlinkingPlaceholder.prototype.start = function () {
	this.stop();
	this.withCaret = false;
	this.changePlaceholder();
	this.interval = setInterval(this.changePlaceholder.bind(this), this.intervalMs);
};

BlinkingPlaceholder.prototype.stop = function () {
	try {
		this.elem.setAttribute('placeholder', '');
		clearInterval(this.interval);
	} catch (ex) {
		console.warn(ex);
	}
};
const INPUT_HEIGHT_RATIO = 0.15;
const sitesSearchUrlPromises = {};

function getSiteSearchUrl(site, cb) {
	cb = cb || function () {};

	if (!sitesSearchUrlPromises[site]) {
		sitesSearchUrlPromises[site] = new Promise(function (resolve, reject) {
			OnDialSearch.getSearchURL(site, function (err, url, directUrl) {
				if (err) {
					return reject(err);
				}

				resolve({ url, directUrl });
			});
		});
	}

	sitesSearchUrlPromises[site].then(function (result) {
		cb(null, result);
	});
}

function OnDialSearchModule(fvdspeeddial) {
	const { SpeedDial, SpeedDialMisc, Prefs } = fvdspeeddial;

	SpeedDial.onBuildCompleted.addListener(function () {
		if (!_b(Prefs.get('sd.enable_ondial_search'))) {
			return;
		}

		let dials = document.querySelectorAll('#cellsContainer .newtabCell');

		dials = [].slice.call(dials);
		dials.forEach(function (dialElem) {
			let url = dialElem.getAttribute('data-url');
			const displayUrl = dialElem.getAttribute('data-display-url');

			if (displayUrl) {
				url = displayUrl;
			}

			if (!url) {
				return;
			}

			const search = window.OnDialSearch.getSearchForUrl(url);

			if (search && search.site === 'booking') {
				// disable search on booking in favor of booking popup widget
				//search = null;
			}

			if (search) {
				function empty() {
					form.classList.remove('has-input');
					input.value = '';
				}
				const dialElemBody = dialElem.querySelector('.body');

				if (!dialElemBody.querySelector('.on-dial-search-form')) {
					const form = document.createElement('div');

					form.className = 'on-dial-search-form';
					const input = document.createElement('input');

					input.setAttribute('type', 'text');
					input.className = 'on-dial-search-input';
					form.appendChild(input);
					dialElemBody.appendChild(form);
					const blinkingPlaceholder = new BlinkingPlaceholder(
						input,
						_('newtab_ondialsearch_placeholder')
					);

					input.addEventListener(
						'mousedown',
						function (event) {
							event.stopPropagation();
						},
						false
					);
					input.addEventListener(
						'mouseup',
						function (event) {
							event.stopPropagation();
						},
						false
					);
					input.addEventListener(
						'click',
						function (event) {
							event.stopPropagation();
						},
						false
					);
					input.addEventListener(
						'focus',
						function (event) {
							blinkingPlaceholder.stop();
							const formsWithText = document.querySelectorAll('.on-dial-search-form.has-input');

							for (let i = 0; i !== formsWithText.length; i++) {
								const formWithText = formsWithText[i];

								if (formWithText === form) {
									continue;
								}

								formWithText.classList.remove('has-input');
								formWithText.querySelector('input').value = '';
							}
							form.classList.add('has-input');
						},
						false
					);
					input.addEventListener('blur', function () {
						if (!input.value.trim()) {
							form.classList.remove('has-input');
						}
					});
					dialElem.addEventListener(
						'mouseover',
						function () {
							if (document.activeElement !== input) {
								blinkingPlaceholder.start();
							}

							if (!sitesSearchUrlPromises[search.site]) {
								getSiteSearchUrl(search.site);
							}
						},
						false
					);
					dialElem.addEventListener(
						'mouseout',
						function () {
							blinkingPlaceholder.stop();
						},
						false
					);
					const adMarketplace = SpeedDialMisc.getRList();

					input.addEventListener(
						'keydown',
						function (event) {
							if (event.keyCode === 13) {
								getSiteSearchUrl(search.site, function (err, result) {
									if (err) {
										return console.error('Fail to get site search url', err);
									}

									const value = input.value.trim();

									if (!value) {
										return;
									}

									let url;

									if (
										search.site === 'aliexpress' &&
										adMarketplace.urlReplaces &&
										adMarketplace.urlReplaces['aliexpress']
									) {
										url = adMarketplace.urlReplaces['aliexpress'].to;
									} else if (
										adMarketplace.deepLinks[search.site] &&
										SpeedDial.isAdMarketplaceAllowed()
									) {
										let searchUrl;

										if (
											SpeedDialMisc.searchUrls[search.site] &&
											SpeedDialMisc.searchUrls[search.site].searchUrl
										) {
											searchUrl = SpeedDialMisc.searchUrls[search.site].searchUrl;
										} else {
											searchUrl = result.directUrl || result.url;
										}

										url = String(searchUrl).replace(/{query}/g, encodeURIComponent(value));
										url = SpeedDial.checkAdMarketplace(url, { ignoreVersion: true });
									} else {
										url = String(result.url).replace(/{query}/g, encodeURIComponent(value));
									}

									console.info(url);
									document.location = url;
								});
							} else if (event.keyCode === 27) {
								input.value = '';
								form.classList.remove('has-input');
							}
						},
						false
					);
					input.addEventListener(
						'input',
						function () {
							if (input.value.length) {
								form.classList.add('has-input');
							} else {
								form.classList.remove('has-input');
							}
						},
						false
					);
					const inputHeight = Math.round(dialElem.getAttribute('height') * INPUT_HEIGHT_RATIO);
					const fontSize = inputHeight - 6;

					input.style.height = inputHeight + 'px';
					input.style.fontSize = fontSize + 'px';
				}
			} else {
			}
		});
	});
}

export default OnDialSearchModule;
