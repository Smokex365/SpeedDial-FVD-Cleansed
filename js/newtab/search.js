import { EventType } from '../types.js';
import { Utils } from '../utils.js';

const Search = function (fvdSpeedDial) {
	const that = this;
	this.fvdSpeedDial = fvdSpeedDial;
	fvdSpeedDial.addEventListener(EventType.LOAD, function () {
		that.init();
	});
};

Search.prototype = {
	_defaultProvider: 'google',
	_ui: {},
	_menuState: false,
	_searchProviders: {
		// removed all of the original search redirects
		// searches changed to either standard search parameters or removed entirely
		google: {
			name: 'Google',
			url: 'https://www.google.com/search?q={q}',
		  },
		bing: {
			name: 'Bing',
			url: 'https://www.bing.com/search?q={q}',
			ip: [
				'au',
				'at',
				'be',
				'br',
				'ca',
				'dk',
				'fi',
				'fr',
				'fx',
				'de',
				'in',
				'it',
				'ie',
				'jp',
				'lu',
				'nl',
				'nz',
				'no',
				'es',
				'se',
				'ch',
				'gb',
				'us',
				'um',
				'uk',
			],
		},
		yahoo: {
			name: 'Yahoo',
			url: 'https://search.yahoo.com/search?p={q}',
			ip: [
				'ar',
				'at',
				'br',
				'ca',
				'ch',
				'cl',
				'co',
				'de',
				'dk',
				'es',
				'fi',
				'fr',
				'hk',
				'in',
				'id',
				'it',
				'mx',
				'nz',
				'no',
				'pe',
				'ph',
				'sg',
				'se',
				'tw',
				'th',
				'gb',
				'uk',
				'us',
				'ie',
				've',
				'my',
			],
		},
		duckduckgo: {
			name : 'DuckDuckGo',
			url: 'https://duckduckgo.com/?q={q}',
		},
		youtube: {
			name: 'Youtube',
			url: 'https://www.youtube.com/results?search_query={q}',
		},
		reddit: {
			name: 'Reddit',
			url: 'https://old.reddit.com/search?q={q}',
		},
	},
	_locale: {
		ip: null,
		locales: [],
		timeout: 7 * 24 * 60 * 60 * 100,
	},
	_installVersion: 1000,
	init: function () {
		this.getUI();
		this.listeners();
		this.fill();
		this.getLocationByIP();
		this.getLocationByBrowser();
		this.getInstallVersion();
	},
	getUI: function () {
		this.ui = {
			$container: $('#searchFormContainer'),
			$logo: $('#searchLogo'),
			$menu: $('#searchMenu'),
			$list: $('#searchList'),
		};
	},
	listeners: function () {
		this.ui.$logo.on('click', function (event) {
			return;
			//that.menu('show')
		});
		this.ui.$list.on('click', 'li', event => {
			this.clickProvider($(event.currentTarget));
		});
		document.body.addEventListener('click', this.onBodyClick.bind(this), false);
	},
	fill: function () {
		const { fvdSpeedDial } = this;

		const provider = this.getProvider();
		const installVersion = Utils.getInstallVersion(fvdSpeedDial);

		this.ui.$list.html('');
		for (const key in this._searchProviders) {
			const item = this._searchProviders[key];

			if (item.hasOwnProperty('versionLess')) {
				if (installVersion > item['versionLess']) {
					continue;
				}
			}

			const $option = $('<li>')
				.attr('provider', key)
				.addClass('provider-' + key)
				.append($('<span>').addClass('provider-name').text(item.name));

			if (key === provider) {
				$option.addClass('active');
			}

			this.ui.$list.append($option);
		}

		const current = this.ui.$logo.attr('provider');

		if (!current || current === provider) {
			this.ui.$logo.attr('provider', provider);
		} else {
			this.ui.$logo.addClass('fade');
			setTimeout(() => {
				this.ui.$logo.attr('provider', provider);
				this.ui.$logo.removeClass('fade');
			}, 75);
		}
	},
	onBodyClick: function (event) {
		try {
			if (this._menuState) {
				this.menu('close');
			}
		} catch (ex) {
			console.warn(ex);
		}
	},
	menu: function (mode) {
		this.fill();

		if (mode === 'close') {
			this._menuState = false;
			this.ui.$menu.fadeOut(75);
			this.highlight(true);
		} else {
			this.ui.$menu.fadeIn(75);
			this.highlight(false);
			setTimeout(() => {
				this._menuState = true;
			}, 1);
		}
	},
	clickProvider: function ($option) {
		const provider = $option.attr('provider');

		this.setProvider(provider);
		this.menu('close');
	},
	highlight: function (unhighlight) {
		this.ui.$container.addClass('highlight');
		clearTimeout(this._highlightTimeout);

		if (unhighlight) {
			this._highlightTimeout = setTimeout(() => {
				this.ui.$container.removeClass('highlight');
			}, 3e3);
		}
	},
	setProvider: function (provider) {
		const {
			fvdSpeedDial: { Prefs },
		} = this;

		if (this._searchProviders[provider]) {
			Prefs.set('sd.search_provider', provider);
		}

		return this.getProvider();
	},
	getProvider: function () {
		const {
			fvdSpeedDial: { Prefs },
		} = this;

		let provider = Prefs.get('sd.search_provider');

		if (!provider || !this._searchProviders[provider]) {
			provider = this._defaultProvider;
		}

		return provider;
	},
	doSearch: function (query) {
		const { fvdSpeedDial } = this;

		const {
			fvdSpeedDial: { Prefs },
		} = this;

		let url;

		if (!query) {
			const q = document.getElementById('q');

			if (q.hasAttribute('clickUrl')) {
				query = {
					click_url: q.getAttribute('clickUrl'),
				};
			} else {
				query = q.value;
			}
		}

		if (typeof query === 'object' && query.click_url) {
			url = query.click_url;
		} else {
			let provider = this.getProvider();

			if (provider === 'fvd') {
				provider = this.detectProvider();
			}

			const providerData = this._searchProviders[provider];

			if (String(query).trim().length === 0) {
				return false;
			}

			url = String(providerData.url);
			url = url
				.replace('{q}', encodeURIComponent(query))
				.replace('{time}', Prefs.get('sd.install_time'))
				.replace('{type}', Utils.getInstallVersion(fvdSpeedDial) < 6930 ? '0' : '1')
				.replace('{version}', Utils.getCurrentVersion());

			if (typeof providerData.replace === 'function') {
				url = providerData.replace(url);
			}
		}

		console.info(url);

		document.location = url;
	},
	detectProvider: function () {
		const { fvdSpeedDial } = this;

		let provider = null;
		const installVersion = Utils.getInstallVersion(fvdSpeedDial);

		for (const key in this._searchProviders) {
			if (key !== 'fvd') {
				const providerItem = this._searchProviders[key];

				if (providerItem.hasOwnProperty('versionLess')) {
					if (installVersion > providerItem['versionLess']) {
						continue;
					}
				}

				if (providerItem.locale) {
					for (const loc of providerItem.locale) {
						const index = this._locale.locales.indexOf(loc);

						if (index !== -1 && index < 3) {
							provider = key;
							break;
						}
					}
				}

				if (!provider && this._locale.ip && providerItem.ip) {
					if (providerItem.ip.indexOf(this._locale.ip) !== -1) {
						provider = key;
					}
				}

				if (provider) {
					break;
				}
			}
		}

		if (!provider) {
			if (
				!this._searchProviders['yahoo']['versionLess']
				|| installVersion < this._searchProviders['yahoo']['versionLess']
			) {
				provider = 'yahoo';
			} else {
				provider = 'bing';
			}
		}

		console.info('Provider detected', provider);
		return provider;
	},
	getLocationByBrowser: function () {
		const {
			fvdSpeedDial: { Prefs },
		} = this;
		const locales = Prefs.get('definedLocationsList');
		const localesTimeout = parseInt(Prefs.get('definedLocationsListTimeout')) || 0;

		if (localesTimeout > Date.now()) {
			if (typeof locales === 'string') {
				this._locale.locales = locales.split(',');
			} else if (typeof locales === 'object') {
				this._locale.locales = Object.assign([], locales);
			}
		} else {
			chrome.i18n.getAcceptLanguages(locations => {
				const locales = [];

				for (const location of locations) {
					locales.push(location.split('-').shift().toLowerCase());
				}
				Prefs.set('definedLocationsList', locales);
				Prefs.set('definedLocationsListTimeout', Date.now() + this._locale.timeout);
				this._locale.locales = locales;
			});
		}
	},
	getLocationByIP: function () {
		const {
			fvdSpeedDial: { Prefs },
		} = this;
		const location = Prefs.get('serviceLocation');
		const localesTimeout = parseInt(Prefs.get('serviceLocationListTimeout')) || 0;

		if (location && localesTimeout > Date.now()) {
			this._locale.ip = location;
		} else {
			Utils.getUserCountry(country => {
				if (country) {
					country = String(country).toLowerCase();
					Prefs.set('serviceLocation', country);
					Prefs.set('serviceLocationListTimeout', Date.now() + this._locale.timeout);
					this._locale.ip = country;
				}
			});
		}
	},
	getLocationSync: function () {
		const {
			fvdSpeedDial: { Prefs },
		} = this;
		let location = Prefs.get('serviceLocation');

		if (!location) {
			location = chrome.i18n.getUILanguage();
		}

		location = String(location || '').toLowerCase();
		return location;
	},
	getInstallVersion: function () {
		const {
			fvdSpeedDial: { Prefs },
		} = this;
		this._installVersion
			= parseInt(String(Prefs.get('installVersion')).split('.').join('')) || 1000;
	},
	reset: function (reload) {
		const {
			fvdSpeedDial: { Prefs },
		} = this;

		Prefs.remove('serviceLocation');
		Prefs.remove('definedLocation');
		Prefs.remove('definedLocationsList');

		if (reload) {
			document.location.reload();
		}
	},
};
export default Search;