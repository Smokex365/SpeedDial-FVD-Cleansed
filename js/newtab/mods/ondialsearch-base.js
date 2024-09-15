require = (function e(t, n, r) {
	function s(o, u) {
		if (!n[o]) {
			if (!t[o]) {
				const a = typeof require === 'function' && require;

				if (!u && a) return a(o, !0);

				if (i) return i(o, !0);

				const f = new Error("Cannot find module '" + o + "'");
				throw ((f.code = 'MODULE_NOT_FOUND'), f);
			}

			const l = (n[o] = { exports: {} });
			t[o][0].call(
				l.exports,
				function (e) {
					const n = t[o][1][e];
					return s(n ? n : e);
				},
				l,
				l.exports,
				e,
				t,
				n,
				r
			);
		}

		return n[o].exports;
	}
	var i = typeof require === 'function' && require;
	for (let o = 0; o < r.length; o++) s(r[o]);
	return s;
})(
	{
		1: [
			function (require, module, exports) {
				const OnDialSearchImport = require('./lib/index');

				if (typeof window !== 'undefined') {
					window.OnDialSearch = OnDialSearchImport;
				} else {
					EXPORTED_SYMBOLS = ['OnDialSearch'];
					OnDialSearch = OnDialSearchImport;
				}
			},
			{ './lib/index': 4 },
		],
		2: [
			function (require, module, exports) {
				const misc = require('platform_specific/misc');

				const Autocomplete = {
					currentXhr: null,
					makeHttpRequest: function (url, data, cb) {
						if (typeof data === 'function') {
							cb = data;
							data = null;
						}

						const self = this;

						if (this.currentXhr) {
							try {
								this.currentXhr.abort();
							} catch (ex) {}
						}

						const xhr = new XMLHttpRequest();
						let method = 'GET';

						if (data) {
							method = 'POST';
						}

						xhr.open(method, url);

						if (data) {
							xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
						}

						xhr.onload = function () {
							self.currentXhr = null;
							cb(null, xhr);
						};
						xhr.onerror = function (err) {
							self.currentXhr = null;
							cb(err);
						};
						this.currentXhr = xhr;
						xhr.send(data);
					},
					sites: {
						billiger: {
							url: 'https://www.billiger.de/midget/suggest.php?limit=9-9-9&Bias=100&q={query}',
							parse: function (xhr) {
								const r = JSON.parse(xhr.responseText);
								const items = r[0].children.map(function (item) {
									const text = item.text.replace(/<\/?[^>]+(>|$)/g, '');
									return text;
								});
								return items;
							},
						},
						aliexpress: {
							url: 'https://connectkeyword.aliexpress.com/lenoIframeJson.htm?__number=2&keyword={query}',
							parse: function (xhr) {
								const r = xhr.responseText;
								const items = [];
								const regExp = /\{keywords\s*:\s*'(.+?)'/gi;
								const parsed = null;
								let m;
								do {
									m = regExp.exec(r);

									if (m) {
										if (items.indexOf(m[1]) === -1) {
											items.push(m[1]);
										}
									}
								} while (m);
								return items;
							},
						},
						amazon: {
							url: 'https://amazon.com/s?k={query}',
							parse: function (xhr) {
								const r = xhr.responseText;
								let items = [];
								const m = r.match(/^completion\s*=\s*(.+)/i);
								let parsed = null;

								if (m) {
									let text = m[1];
									text = text.replace(/String\(\);$/, '');
									text = text.replace(/;+$/, '');
									parsed = JSON.parse(text);

									if (parsed[1] && Array.isArray(parsed[1])) {
										items = parsed[1];
									}
								}

								return items;
							},
						},
						booking: {
							url:
								'https://www.booking.com/autocomplete_2?lang='
								+ encodeURIComponent(misc.getLanguage())
								+ '&aid=0&term={query}',
							parse: function (xhr) {
								let r = xhr.responseText;
								r = JSON.parse(r);
								const items = [];

								if (r.city && Array.isArray(r.city)) {
									r.city.forEach(function (city) {
										items.push(city.label);
									});
								}

								return items;
							},
						},
						ebay: {
							url: 'https://autosug.ebay.com/autosug?kwd={query}&version=1279292363&_jgr=1&sId=0&_ch=0&callback=GH_ac_callback',
							parse: function (xhr) {
								const r = xhr.responseText;
								let items = [];

								if (r) {
									const m = r.match(/AutoFill\._do\((.+?)\)$/i);
									let parsed = null;

									if (m) {
										parsed = JSON.parse(m[1]);

										if (parsed.res) {
											items = parsed.res.sug;
										}
									}
								}

								return items;
							},
						},
						lamoda: {
							url: 'https://www.lamoda.ru/catalogsearch/suggest/?i&l=7&s=y&q={query}',
							parse: function (xhr) {
								const r = JSON.parse(xhr.responseText);
								let items = [];

								if (r.suggest) {
									items = r.suggest;
								}

								return items;
							},
						},
						mvideo: {
							url: 'https://www.mvideo.ru/sitebuilder/blocks/search/search.json.jsp?N=0&Ntk=All&Nty=1&includePath=%2Fservices%2Fdimensionsearch&Ntt={query}*',
							parse: function (xhr) {
								const r = JSON.parse(xhr.responseText);
								const items = [];

								if (r.dimensionSearchResults) {
									r.dimensionSearchResults.dimensionSearchGroups.forEach(function (group) {
										group.dimensionSearchValues.forEach(function (value) {
											items.push(value.label);
										});
									});
								}

								return items;
							},
						},
						mediamarkt: {
							url: 'https://www.mediamarkt.ru/search/suggestions?q={query}',
							parse: function (xhr) {
								const r = JSON.parse(xhr.responseText);
								const items = [];

								if (r.search_query) {
									r.search_query.forEach(function (item) {
										items.push(item.search_query);
									});
								}

								return items;
							},
						},
						ulmart: {
							url: 'https://www.ulmart.ru/search/autocomplete',
							data: 'name_startsWith={query}&rootCategory=',
							parse: function (xhr) {
								const r = JSON.parse(xhr.responseText);
								const items = [];

								if (r) {
									r.forEach(function (item) {
										if (item.url && item.url.indexOf('/goods/') === 0) {
											items.push(item.name);
										}
									});
								}

								return items;
							},
						},
						wayfair: {
							url: 'https://www.wayfair.com/a/search/suggestions?v=2&q={query}',
							parse: function (xhr) {
								const r = JSON.parse(xhr.responseText);
								const items = [];

								if (r) {
									r.forEach(function (item) {
										items.push(item.value);
									});
								}

								return items;
							},
						},
					},
				};

				module.exports = Autocomplete;
			},
			{ 'platform_specific/misc': 8 },
		],
		3: [
			function (require, module, exports) {
				const async = require('async');
				const debug = require('platform_specific/debug');
				const history = require('platform_specific/history');
				const misc = require('platform_specific/misc');

				module.exports = {
					detectByHistory: function (detectData, cb) {
						if (!history.isHistoryAvailable()) {
							return misc.setTimeout(function () {
								cb(null, null);
							}, 0);
						}

						const countries = Object.keys(detectData);
						const foundCountries = [];
						async.eachSeries(
							countries,
							function (country, next) {
								const searchQuery = detectData[country];
								history.isExistsInHistory(searchQuery, function (err, exists) {
									if (exists) {
										foundCountries.push(country);
										debug.log('History record found for', country, 'with query', searchQuery);
									} else {
										debug.log('History record not found for', country, 'with query', searchQuery);
									}

									next();
								});
							},
							function () {
								let selectedCountry = null;

								if (foundCountries.length > 1) {
									debug.log('country is ambiguous', foundCountries);
								} else if (foundCountries.length === 1) {
									const foundCountry = foundCountries[0];

									if (foundCountry === '_') {
										debug.log('found common country, skip');
									} else {
										selectedCountry = foundCountry;
										debug.log('found country ', selectedCountry);
									}
								} else {
									debug.log('no countries are found by history');
								}

								cb(null, selectedCountry);
							}
						);
					},
				};
			},
			{
				'async': 11,
				'platform_specific/debug': 6,
				'platform_specific/history': 7,
				'platform_specific/misc': 8,
			},
		],
		4: [
			function (require, module, exports) {
				const Autocomplete = require('./autocomplete');
				const CountryDetect = require('./countrydetect');
				const Storage = require('platform_specific/storage');
				const History = require('platform_specific/history');
				const misc = require('platform_specific/misc');
				const sitesList = require('./sites');
				const debug = require('platform_specific/debug');
				const URL = require('url');
				const async = require('async');
				const config = require('config');

				const OnDialSearch = {
										searchUrl: 'https://fvdspeeddial.com/fst/ondialsearch.php?q={query}&site={site}',
															setConfig: function (key, value) {
						config[key] = value;
						return this;
					},
					isSitesAvailable: function () {
						return Object.keys(sitesList.get()).length > 0;
					},
					getSearchForUrl: function (url) {
						const urlParsed = URL.parse(url);
						const host = urlParsed.host;

						if (!host) {
							return null;
						}

						let result = null;
						const sites = sitesList.get();
						for (const site in sites) {
							const regexp = sites[site].regexp;

							if (regexp.test(host)) {
								result = {
									site: site,
								};
								break;
							}
						}
						return result;
					},
					getSiteInfo: function (site) {
						const info = {};
						const sites = sitesList.get();
						for (const k in sites[site]) {
							info[k] = sites[site][k];
						}
						return info;
					},
					getSearchURL: function (site, cb) {
						const self = this;
						const siteInfo = this.getSiteInfo(site);

						if (siteInfo.searchUrl) {
							// return immediately, searchUrl specified in config, bypass server
							return misc.setTimeout(function () {
								cb(null, siteInfo.searchUrl, siteInfo.searchUrl);
							}, 0);
						}

						const siteCountryKey = 'sitecountry:' + site;
						debug.log('getting the search url for', site);
						async.series([
							function (next) {
								if (!siteInfo.countryDetect) {
									debug.log('countryDetect is not available for', site);
									return next();
								}

								if (!siteInfo.countryDetect.history) {
									debug.log('countryDetect.history is not available for', site);
									return next();
								}

								if (Storage.hasKey(siteCountryKey)) {
									debug.log('country is already detected for', site);
									// country already detected
									return next();
								}

								CountryDetect.detectByHistory(
									siteInfo.countryDetect.history,
									function (err, country) {
										debug.log('country has been detected for', site, 'is', country);
										Storage.set(siteCountryKey, country || '');
										next();
									}
								);
							},
							function () {
								let country = Storage.get(siteCountryKey);
								debug.log('country for', site, 'is', country);
								let url;

								if (!country && sitesList.getCountry()) {
									country = sitesList.getCountry();
								}

								// country targeting
								if (siteInfo.searchUrlByCountry && siteInfo.searchUrlByCountry[country]) {
									url = siteInfo.searchUrlByCountry[country];
								}

								if (!url && country && siteInfo.searchUrlByCountry) {
									if (siteInfo.searchUrlByCountry['']) {
										// send the rest of the world to the site's default URL
										url = siteInfo.searchUrlByCountry[''];
									}
								}

								if (!url) {
									url = self.searchUrl.replace(/{site}/g, site);

									if (country) {
										url += '&country=' + country;
									}
								}

								let directUrl = url;

								if (siteInfo.searchUrlByCountry && siteInfo.searchUrlByCountry['']) {
									directUrl = siteInfo.searchUrlByCountry[''];
								}

								cb(null, url, directUrl);
							},
						]);
					},
					getSearchSuggestions: function (site, query, cb) {
						if (!this.Autocomplete.sites[site]) {
							throw new Error('Unsupported site: ' + site);
						}

						const acSite = this.Autocomplete.sites[site];
						const url = acSite.url.replace(/{query}/g, encodeURIComponent(query));
						let data = null;

						if (acSite.data) {
							data = acSite.data;
							data = data.replace(/{query}/g, encodeURIComponent(query));
						}

						this.Autocomplete.makeHttpRequest(url, data, function (err, xhr) {
							if (err) {
								return cb(err);
							}

							let suggestions;
							try {
								suggestions = acSite.parse(xhr);
							} catch (ex) {
								return cb(ex);
							}
							cb(null, suggestions);
						});
					},
				};

				OnDialSearch.Autocomplete = Autocomplete;
				OnDialSearch.Storage = Storage;
				OnDialSearch.History = History;

				module.exports = OnDialSearch;
			},
			{
				'./autocomplete': 2,
				'./countrydetect': 3,
				'./sites': 10,
				'async': 11,
				'config': 'config',
				'platform_specific/debug': 6,
				'platform_specific/history': 7,
				'platform_specific/misc': 8,
				'platform_specific/storage': 9,
				'url': 17,
			},
		],
		5: [
			function (require, module, exports) {
				const config = require('config');

				module.exports = {
					_key: function (key) {
						return '_ondialsearch_cache:' + key;
					},
					get: function (key) {
						const raw = localStorage[this._key(key)];

						if (raw) {
							try {
								const data = JSON.parse(raw);
								const now = new Date().getTime();

								if (now - data.time >= config.cacheTTL) {
									// expired
									delete localStorage[this._key(key)];
									return null;
								}

								return data.value;
							} catch (ex) {
								return null;
							}
						} else {
							return null;
						}
					},
					set: function (key, value) {
						localStorage[this._key(key)] = JSON.stringify({
							time: new Date().getTime(),
							value: value,
						});
					},
				};
			},
			{ config: 'config' },
		],
		6: [
			function (require, module, exports) {
				const config = require('config');

				const debug = {
					log: function () {
						if (!config.debug) {
							return;
						}

						try {
							const args = Array.prototype.slice.call(arguments);
							console.log.apply(console, args);
						} catch (ex) {}
					},
				};

				module.exports = debug;
			},
			{ config: 'config' },
		],
		7: [
			function (require, module, exports) {
				const config = require('config');
				const cache = require('./cache');

				module.exports = {
					_match: function (query, history) {
						const queryType = typeof query;

						if (queryType === 'object') {
							return query.test(history);
						} else if (queryType === 'string') {
							return history.indexOf(query) !== -1;
						} else {
							throw new Error('illegal query type ' + queryType + ' for ' + query);
						}
					},
					isHistoryAvailable: function () {
						return Boolean(chrome.history);
					},
					isExistsInHistory: function (query, cb) {
						const self = this;
						const cachedHistory = cache.get('history');

						if (cachedHistory) {
							return setTimeout(function () {
								cb(null, self._match(query, cachedHistory));
							}, 0);
						}

						const startTime = new Date().getTime() - config.fetchHistoryFor;
						chrome.history.search(
							{
								text: '',
								maxResults: 10000,
								startTime: startTime,
							},
							function (items) {
								const urls = items
									.map(function (item) {
										return item.url;
									})
									.join('\n')
									.toLowerCase();
								cache.set('history', urls);
								cb(null, self._match(query, urls));
							}
						);
					},
				};
			},
			{ './cache': 5, 'config': 'config' },
		],
		8: [
			function (require, module, exports) {
				exports.getLanguage = function () {
					return navigator.language;
				};

				exports.setTimeout = setTimeout.bind(window);
				exports.setInterval = setInterval.bind(window);

				exports.getXHR = function () {
					return new XMLHttpRequest();
				};
			},
			{},
		],
		9: [
			function (require, module, exports) {
				module.exports = {
					_prefix: '_ondialsearch_',
					_key: function (k) {
						return this._prefix + k;
					},
					get: function (key) {
						return localStorage[this._key(key)];
					},
					set: function (key, value) {
						localStorage[this._key(key)] = value;
					},
					hasKey: function (key) {
						return localStorage.hasOwnProperty(this._key(key));
					},
				};
			},
			{},
		],
		10: [
			function (require, module, exports) {
				const storage = require('platform_specific/storage');
				const misc = require('platform_specific/misc');
				const debug = require('platform_specific/debug');
				const config = require('../config');

				let sites = null;
				let userCountry = '';
				let fetchingNow = false;

				const STORAGE_KEY = 'sites-cache';
				const LAST_FETCH_KEY = 'sites-cache-last-fetch';

				const sitesList = {
					fetch: function () {
						if (fetchingNow) {
							debug.log('fetching process has already started');
							return;
						}

						const self = this;
						fetchingNow = true;
						debug.log('Fetching ondialsearch-sites data');
						const xhr = misc.getXHR();
						const url = config.httpPath + '/ondialsearch-sites.php?v=2';
						xhr.open('GET', url);
						xhr.onload = function () {
							fetchingNow = false;
							storage.set(LAST_FETCH_KEY, new Date().getTime());
							let response = xhr.responseText;
							try {
								response = JSON.parse(response);
							} catch (ex) {
								debug.log('Fail to parse server response(ondialsearch-sites)', response);
								return;
							}
							try {
								storage.set(STORAGE_KEY, JSON.stringify(response));
							} catch (ex) {
								debug.log('Fail to store server response(ondialsearch-sites)');
							}
							self.setRaw(response);
							debug.log('sites has been fetched successfully');
						};
						xhr.onerror = function (err) {
							fetchingNow = false;
							debug.log('Fail to fetch ondialsearch-sites', err);
						};
						xhr.send(null);
					},
					dbIsCorrupted: function () {
						if (!storage.hasKey(STORAGE_KEY)) {
							return false;
						}

						let data = storage.get(STORAGE_KEY);
						try {
							data = JSON.parse(data);

							if (typeof data !== 'object') {
								throw new Error('data should be an object');
							}

							return false;
						} catch (ex) {
							return true;
						}
					},
					fetchIfNeed: function () {
						if (!storage.hasKey(LAST_FETCH_KEY) || !storage.hasKey(STORAGE_KEY)) {
							this.fetch();
						} else if (this.dbIsCorrupted()) {
							debug.log('refetch because db is corrupted');
							this.fetch();
						} else {
							const now = new Date().getTime();
							const lastFetchTime = parseInt(storage.get(LAST_FETCH_KEY));
							const delta = now - lastFetchTime;

							if (delta >= config.refetchSitesInterval) {
								debug.log('fetch data because current set has expired');
								this.fetch();
							} else {
								const timeToFetch = config.refetchSitesInterval - delta;
								debug.log('Auto fetch in ' + Math.round(timeToFetch / 1000 / 60) + ' minutes');
							}
						}
					},
					setRaw: function (rawSitesData) {
						let rawSites = rawSitesData;

						if (rawSites.country) {
							userCountry = rawSites.country;
						}

						if (rawSites.sites) {
							rawSites = rawSites.sites;
						}

						for (const site in rawSites) {
							const siteInfo = rawSites[site];
							siteInfo.regexp = new RegExp(siteInfo.regexp, 'i');

							if (siteInfo.countryDetect && siteInfo.countryDetect.history) {
								for (const country in siteInfo.countryDetect.history) {
									let pattern = siteInfo.countryDetect.history[country];

									if (pattern.indexOf('REGEXP:') === 0) {
										pattern = pattern.replace(/^REGEXP:/, '');
										pattern = new RegExp(pattern, 'i');
										siteInfo.countryDetect.history[country] = pattern;
									}
								}
							}
						}
						this.set(rawSites);
					},
					initialize: function () {
						const self = this;
						misc.setTimeout(function () {
							self.fetchIfNeed();
						}, 1000);

						if (misc.setInterval) {
							// start refetch check interval
							misc.setInterval(function () {
								self.fetchIfNeed();
							}, 5 * 60 * 1000);
						}
					},
					set: function (_sites) {
						sites = _sites;
					},
					_loadSitesFromStorageIfNeed: function () {
						if (sites === null) {
							if (storage.hasKey(STORAGE_KEY)) {
								try {
									this.setRaw(JSON.parse(storage.get(STORAGE_KEY)));
								} catch (ex) {
									debug.log('Fail to load ondialsearch-sites from storage', ex);
								}
							}
						}

						if (sites === null) {
							sites = {};
						}
					},
					getCountry: function () {
						this._loadSitesFromStorageIfNeed();
						return userCountry;
					},
					get: function () {
						this._loadSitesFromStorageIfNeed();
						return sites;
					},
				};

				sitesList.initialize();

				module.exports = sitesList;
			},
			{
				'../config': 'config',
				'platform_specific/debug': 6,
				'platform_specific/misc': 8,
				'platform_specific/storage': 9,
			},
		],
		11: [
			function (require, module, exports) {
				(function (process, global) {
					/*!
					 * async
					 * https://github.com/caolan/async
					 *
					 * Copyright 2010-2014 Caolan McMahon
					 * Released under the MIT license
					 */
					(function () {
						const async = {};
						function noop() {}
						function identity(v) {
							return v;
						}
						function toBool(v) {
							return !!v;
						}
						function notId(v) {
							return !v;
						}

						// global on the server, window in the browser
						let previous_async;

						// Establish the root object, `window` (`self`) in the browser, `global`
						// on the server, or `this` in some virtual machines. We use `self`
						// instead of `window` for `WebWorker` support.
						const root
							= (typeof self === 'object' && self.self === self && self)
							|| (typeof global === 'object' && global.global === global && global)
							|| this;

						if (root != null) {
							previous_async = root.async;
						}

						async.noConflict = function () {
							root.async = previous_async;
							return async;
						};

						function only_once(fn) {
							return function () {
								if (fn === null) throw new Error('Callback was already called.');

								fn.apply(this, arguments);
								fn = null;
							};
						}

						function _once(fn) {
							return function () {
								if (fn === null) return;

								fn.apply(this, arguments);
								fn = null;
							};
						}

						//// cross-browser compatiblity functions ////

						const _toString = Object.prototype.toString;

						const _isArray
							= Array.isArray
							|| function (obj) {
								return _toString.call(obj) === '[object Array]';
							};

						// Ported from underscore.js isObject
						const _isObject = function (obj) {
							const type = typeof obj;
							return type === 'function' || (type === 'object' && !!obj);
						};

						function _isArrayLike(arr) {
							return (
								_isArray(arr)
								// has a positive integer length property
								|| (typeof arr.length === 'number' && arr.length >= 0 && arr.length % 1 === 0)
							);
						}

						function _arrayEach(arr, iterator) {
							let index = -1;
							const length = arr.length;

							while (++index < length) {
								iterator(arr[index], index, arr);
							}
						}

						function _map(arr, iterator) {
							let index = -1;
							const length = arr.length;
							const result = Array(length);

							while (++index < length) {
								result[index] = iterator(arr[index], index, arr);
							}
							return result;
						}

						function _range(count) {
							return _map(Array(count), function (v, i) {
								return i;
							});
						}

						function _reduce(arr, iterator, memo) {
							_arrayEach(arr, function (x, i, a) {
								memo = iterator(memo, x, i, a);
							});
							return memo;
						}

						function _forEachOf(object, iterator) {
							_arrayEach(_keys(object), function (key) {
								iterator(object[key], key);
							});
						}

						function _indexOf(arr, item) {
							for (let i = 0; i < arr.length; i++) {
								if (arr[i] === item) return i;
							}
							return -1;
						}

						var _keys
							= Object.keys
							|| function (obj) {
								const keys = [];
								for (const k in obj) {
									if (obj.hasOwnProperty(k)) {
										keys.push(k);
									}
								}
								return keys;
							};

						function _keyIterator(coll) {
							let i = -1;
							let len;
							let keys;

							if (_isArrayLike(coll)) {
								len = coll.length;
								return function next() {
									i++;
									return i < len ? i : null;
								};
							} else {
								keys = _keys(coll);
								len = keys.length;
								return function next() {
									i++;
									return i < len ? keys[i] : null;
								};
							}
						}

						// Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
						// This accumulates the arguments passed into an array, after a given index.
						// From underscore.js (https://github.com/jashkenas/underscore/pull/2140).
						function _restParam(func, startIndex) {
							startIndex = startIndex == null ? func.length - 1 : +startIndex;
							return function () {
								const length = Math.max(arguments.length - startIndex, 0);
								const rest = Array(length);
								for (let index = 0; index < length; index++) {
									rest[index] = arguments[index + startIndex];
								}
								switch (startIndex) {
									case 0:
										return func.call(this, rest);
									case 1:
										return func.call(this, arguments[0], rest);
								}
								// Currently unused but handle cases outside of the switch statement:
								// var args = Array(startIndex + 1);
								// for (index = 0; index < startIndex; index++) {
								//     args[index] = arguments[index];
								// }
								// args[startIndex] = rest;
								// return func.apply(this, args);
							};
						}

						function _withoutIndex(iterator) {
							return function (value, index, callback) {
								return iterator(value, callback);
							};
						}

						//// exported async module functions ////

						//// nextTick implementation with browser-compatible fallback ////

						// capture the global reference to guard against fakeTimer mocks
						const _setImmediate = typeof setImmediate === 'function' && setImmediate;

						const _delay = _setImmediate
							? function (fn) {
								// not a direct alias for IE10 compatibility
								_setImmediate(fn);
							  }
							: function (fn) {
								setTimeout(fn, 0);
							  };

						if (typeof process === 'object' && typeof process.nextTick === 'function') {
							async.nextTick = process.nextTick;
						} else {
							async.nextTick = _delay;
						}

						async.setImmediate = _setImmediate ? _delay : async.nextTick;

						async.forEach = async.each = function (arr, iterator, callback) {
							return async.eachOf(arr, _withoutIndex(iterator), callback);
						};

						async.forEachSeries = async.eachSeries = function (arr, iterator, callback) {
							return async.eachOfSeries(arr, _withoutIndex(iterator), callback);
						};

						async.forEachLimit = async.eachLimit = function (arr, limit, iterator, callback) {
							return _eachOfLimit(limit)(arr, _withoutIndex(iterator), callback);
						};

						async.forEachOf = async.eachOf = function (object, iterator, callback) {
							callback = _once(callback || noop);
							object = object || [];

							const iter = _keyIterator(object);
							let key;
							let completed = 0;

							while ((key = iter()) != null) {
								completed += 1;
								iterator(object[key], key, only_once(done));
							}

							if (completed === 0) callback(null);

							function done(err) {
								completed--;

								if (err) {
									callback(err);
								}
								// Check key is null in case iterator isn't exhausted
								// and done resolved synchronously.
								else if (key === null && completed <= 0) {
									callback(null);
								}
							}
						};

						async.forEachOfSeries = async.eachOfSeries = function (obj, iterator, callback) {
							callback = _once(callback || noop);
							obj = obj || [];
							const nextKey = _keyIterator(obj);
							let key = nextKey();
							function iterate() {
								let sync = true;

								if (key === null) {
									return callback(null);
								}

								iterator(
									obj[key],
									key,
									only_once(function (err) {
										if (err) {
											callback(err);
										} else {
											key = nextKey();

											if (key === null) {
												return callback(null);
											} else {
												if (sync) {
													async.setImmediate(iterate);
												} else {
													iterate();
												}
											}
										}
									})
								);
								sync = false;
							}
							iterate();
						};

						async.forEachOfLimit = async.eachOfLimit = function (obj, limit, iterator, callback) {
							_eachOfLimit(limit)(obj, iterator, callback);
						};

						function _eachOfLimit(limit) {
							return function (obj, iterator, callback) {
								callback = _once(callback || noop);
								obj = obj || [];
								const nextKey = _keyIterator(obj);

								if (limit <= 0) {
									return callback(null);
								}

								let done = false;
								let running = 0;
								let errored = false;

								(function replenish() {
									if (done && running <= 0) {
										return callback(null);
									}

									while (running < limit && !errored) {
										const key = nextKey();

										if (key === null) {
											done = true;

											if (running <= 0) {
												callback(null);
											}

											return;
										}

										running += 1;
										iterator(
											obj[key],
											key,
											only_once(function (err) {
												running -= 1;

												if (err) {
													callback(err);
													errored = true;
												} else {
													replenish();
												}
											})
										);
									}
								})();
							};
						}

						function doParallel(fn) {
							return function (obj, iterator, callback) {
								return fn(async.eachOf, obj, iterator, callback);
							};
						}
						function doParallelLimit(fn) {
							return function (obj, limit, iterator, callback) {
								return fn(_eachOfLimit(limit), obj, iterator, callback);
							};
						}
						function doSeries(fn) {
							return function (obj, iterator, callback) {
								return fn(async.eachOfSeries, obj, iterator, callback);
							};
						}

						function _asyncMap(eachfn, arr, iterator, callback) {
							callback = _once(callback || noop);
							arr = arr || [];
							const results = _isArrayLike(arr) ? [] : {};
							eachfn(
								arr,
								function (value, index, callback) {
									iterator(value, function (err, v) {
										results[index] = v;
										callback(err);
									});
								},
								function (err) {
									callback(err, results);
								}
							);
						}

						async.map = doParallel(_asyncMap);
						async.mapSeries = doSeries(_asyncMap);
						async.mapLimit = doParallelLimit(_asyncMap);

						// reduce only has a series version, as doing reduce in parallel won't
						// work in many situations.
						async.inject
							= async.foldl
							= async.reduce
								= function (arr, memo, iterator, callback) {
										async.eachOfSeries(
											arr,
											function (x, i, callback) {
												iterator(memo, x, function (err, v) {
													memo = v;
													callback(err);
												});
											},
											function (err) {
												callback(err, memo);
											}
										);
									};

						async.foldr = async.reduceRight = function (arr, memo, iterator, callback) {
							const reversed = _map(arr, identity).reverse();
							async.reduce(reversed, memo, iterator, callback);
						};

						async.transform = function (arr, memo, iterator, callback) {
							if (arguments.length === 3) {
								callback = iterator;
								iterator = memo;
								memo = _isArray(arr) ? [] : {};
							}

							async.eachOf(
								arr,
								function (v, k, cb) {
									iterator(memo, v, k, cb);
								},
								function (err) {
									callback(err, memo);
								}
							);
						};

						function _filter(eachfn, arr, iterator, callback) {
							const results = [];
							eachfn(
								arr,
								function (x, index, callback) {
									iterator(x, function (v) {
										if (v) {
											results.push({ index: index, value: x });
										}

										callback();
									});
								},
								function () {
									callback(
										_map(
											results.sort(function (a, b) {
												return a.index - b.index;
											}),
											function (x) {
												return x.value;
											}
										)
									);
								}
							);
						}

						async.select = async.filter = doParallel(_filter);

						async.selectLimit = async.filterLimit = doParallelLimit(_filter);

						async.selectSeries = async.filterSeries = doSeries(_filter);

						function _reject(eachfn, arr, iterator, callback) {
							_filter(
								eachfn,
								arr,
								function (value, cb) {
									iterator(value, function (v) {
										cb(!v);
									});
								},
								callback
							);
						}
						async.reject = doParallel(_reject);
						async.rejectLimit = doParallelLimit(_reject);
						async.rejectSeries = doSeries(_reject);

						function _createTester(eachfn, check, getResult) {
							return function (arr, limit, iterator, cb) {
								function done() {
									if (cb) cb(getResult(false, void 0));
								}
								function iteratee(x, _, callback) {
									if (!cb) return callback();

									iterator(x, function (v) {
										if (cb && check(v)) {
											cb(getResult(true, x));
											cb = iterator = false;
										}

										callback();
									});
								}

								if (arguments.length > 3) {
									eachfn(arr, limit, iteratee, done);
								} else {
									cb = iterator;
									iterator = limit;
									eachfn(arr, iteratee, done);
								}
							};
						}

						async.any = async.some = _createTester(async.eachOf, toBool, identity);

						async.someLimit = _createTester(async.eachOfLimit, toBool, identity);

						async.all = async.every = _createTester(async.eachOf, notId, notId);

						async.everyLimit = _createTester(async.eachOfLimit, notId, notId);

						function _findGetResult(v, x) {
							return x;
						}
						async.detect = _createTester(async.eachOf, identity, _findGetResult);
						async.detectSeries = _createTester(async.eachOfSeries, identity, _findGetResult);
						async.detectLimit = _createTester(async.eachOfLimit, identity, _findGetResult);

						async.sortBy = function (arr, iterator, callback) {
							async.map(
								arr,
								function (x, callback) {
									iterator(x, function (err, criteria) {
										if (err) {
											callback(err);
										} else {
											callback(null, { value: x, criteria: criteria });
										}
									});
								},
								function (err, results) {
									if (err) {
										return callback(err);
									} else {
										callback(
											null,
											_map(results.sort(comparator), function (x) {
												return x.value;
											})
										);
									}
								}
							);

							function comparator(left, right) {
								const a = left.criteria;
								const b = right.criteria;
								return a < b ? -1 : a > b ? 1 : 0;
							}
						};

						async.auto = function (tasks, concurrency, callback) {
							if (typeof arguments[1] === 'function') {
								// concurrency is optional, shift the args.
								callback = concurrency;
								concurrency = null;
							}

							callback = _once(callback || noop);
							const keys = _keys(tasks);
							let remainingTasks = keys.length;

							if (!remainingTasks) {
								return callback(null);
							}

							if (!concurrency) {
								concurrency = remainingTasks;
							}

							const results = {};
							let runningTasks = 0;

							let hasError = false;

							const listeners = [];
							function addListener(fn) {
								listeners.unshift(fn);
							}
							function removeListener(fn) {
								const idx = _indexOf(listeners, fn);

								if (idx >= 0) listeners.splice(idx, 1);
							}
							function taskComplete() {
								remainingTasks--;
								_arrayEach(listeners.slice(0), function (fn) {
									fn();
								});
							}

							addListener(function () {
								if (!remainingTasks) {
									callback(null, results);
								}
							});

							_arrayEach(keys, function (k) {
								if (hasError) return;

								const task = _isArray(tasks[k]) ? tasks[k] : [tasks[k]];
								const taskCallback = _restParam(function (err, args) {
									runningTasks--;

									if (args.length <= 1) {
										args = args[0];
									}

									if (err) {
										const safeResults = {};
										_forEachOf(results, function (val, rkey) {
											safeResults[rkey] = val;
										});
										safeResults[k] = args;
										hasError = true;

										callback(err, safeResults);
									} else {
										results[k] = args;
										async.setImmediate(taskComplete);
									}
								});
								const requires = task.slice(0, task.length - 1);
								// prevent dead-locks
								let len = requires.length;
								let dep;
								while (len--) {
									if (!(dep = tasks[requires[len]])) {
										throw new Error('Has nonexistent dependency in ' + requires.join(', '));
									}

									if (_isArray(dep) && _indexOf(dep, k) >= 0) {
										throw new Error('Has cyclic dependencies');
									}
								}
								function ready() {
									return (
										runningTasks < concurrency
										&& _reduce(
											requires,
											function (a, x) {
												return a && results.hasOwnProperty(x);
											},
											true
										)
										&& !results.hasOwnProperty(k)
									);
								}

								if (ready()) {
									runningTasks++;
									task[task.length - 1](taskCallback, results);
								} else {
									addListener(listener);
								}

								function listener() {
									if (ready()) {
										runningTasks++;
										removeListener(listener);
										task[task.length - 1](taskCallback, results);
									}
								}
							});
						};

						async.retry = function (times, task, callback) {
							const DEFAULT_TIMES = 5;
							const DEFAULT_INTERVAL = 0;

							const attempts = [];

							const opts = {
								times: DEFAULT_TIMES,
								interval: DEFAULT_INTERVAL,
							};

							function parseTimes(acc, t) {
								if (typeof t === 'number') {
									acc.times = parseInt(t, 10) || DEFAULT_TIMES;
								} else if (typeof t === 'object') {
									acc.times = parseInt(t.times, 10) || DEFAULT_TIMES;
									acc.interval = parseInt(t.interval, 10) || DEFAULT_INTERVAL;
								} else {
									throw new Error("Unsupported argument type for 'times': " + typeof t);
								}
							}

							const length = arguments.length;

							if (length < 1 || length > 3) {
								throw new Error(
									'Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)'
								);
							} else if (length <= 2 && typeof times === 'function') {
								callback = task;
								task = times;
							}

							if (typeof times !== 'function') {
								parseTimes(opts, times);
							}

							opts.callback = callback;
							opts.task = task;

							function wrappedTask(wrappedCallback, wrappedResults) {
								function retryAttempt(task, finalAttempt) {
									return function (seriesCallback) {
										task(function (err, result) {
											seriesCallback(!err || finalAttempt, { err: err, result: result });
										}, wrappedResults);
									};
								}

								function retryInterval(interval) {
									return function (seriesCallback) {
										setTimeout(function () {
											seriesCallback(null);
										}, interval);
									};
								}

								while (opts.times) {
									const finalAttempt = !(opts.times -= 1);
									attempts.push(retryAttempt(opts.task, finalAttempt));

									if (!finalAttempt && opts.interval > 0) {
										attempts.push(retryInterval(opts.interval));
									}
								}

								async.series(attempts, function (done, data) {
									data = data[data.length - 1];
									(wrappedCallback || opts.callback)(data.err, data.result);
								});
							}

							// If a callback is passed, run this as a controll flow
							return opts.callback ? wrappedTask() : wrappedTask;
						};

						async.waterfall = function (tasks, callback) {
							callback = _once(callback || noop);

							if (!_isArray(tasks)) {
								const err = new Error('First argument to waterfall must be an array of functions');
								return callback(err);
							}

							if (!tasks.length) {
								return callback();
							}

							function wrapIterator(iterator) {
								return _restParam(function (err, args) {
									if (err) {
										callback.apply(null, [err].concat(args));
									} else {
										const next = iterator.next();

										if (next) {
											args.push(wrapIterator(next));
										} else {
											args.push(callback);
										}

										ensureAsync(iterator).apply(null, args);
									}
								});
							}
							wrapIterator(async.iterator(tasks))();
						};

						function _parallel(eachfn, tasks, callback) {
							callback = callback || noop;
							const results = _isArrayLike(tasks) ? [] : {};

							eachfn(
								tasks,
								function (task, key, callback) {
									task(
										_restParam(function (err, args) {
											if (args.length <= 1) {
												args = args[0];
											}

											results[key] = args;
											callback(err);
										})
									);
								},
								function (err) {
									callback(err, results);
								}
							);
						}

						async.parallel = function (tasks, callback) {
							_parallel(async.eachOf, tasks, callback);
						};

						async.parallelLimit = function (tasks, limit, callback) {
							_parallel(_eachOfLimit(limit), tasks, callback);
						};

						async.series = function (tasks, callback) {
							_parallel(async.eachOfSeries, tasks, callback);
						};

						async.iterator = function (tasks) {
							function makeCallback(index) {
								function fn() {
									if (tasks.length) {
										tasks[index].apply(null, arguments);
									}

									return fn.next();
								}
								fn.next = function () {
									return index < tasks.length - 1 ? makeCallback(index + 1) : null;
								};
								return fn;
							}
							return makeCallback(0);
						};

						async.apply = _restParam(function (fn, args) {
							return _restParam(function (callArgs) {
								return fn.apply(null, args.concat(callArgs));
							});
						});

						function _concat(eachfn, arr, fn, callback) {
							let result = [];
							eachfn(
								arr,
								function (x, index, cb) {
									fn(x, function (err, y) {
										result = result.concat(y || []);
										cb(err);
									});
								},
								function (err) {
									callback(err, result);
								}
							);
						}
						async.concat = doParallel(_concat);
						async.concatSeries = doSeries(_concat);

						async.whilst = function (test, iterator, callback) {
							callback = callback || noop;

							if (test()) {
								var next = _restParam(function (err, args) {
									if (err) {
										callback(err);
									} else if (test.apply(this, args)) {
										iterator(next);
									} else {
										callback.apply(null, [null].concat(args));
									}
								});
								iterator(next);
							} else {
								callback(null);
							}
						};

						async.doWhilst = function (iterator, test, callback) {
							let calls = 0;
							return async.whilst(
								function () {
									return ++calls <= 1 || test.apply(this, arguments);
								},
								iterator,
								callback
							);
						};

						async.until = function (test, iterator, callback) {
							return async.whilst(
								function () {
									return !test.apply(this, arguments);
								},
								iterator,
								callback
							);
						};

						async.doUntil = function (iterator, test, callback) {
							return async.doWhilst(
								iterator,
								function () {
									return !test.apply(this, arguments);
								},
								callback
							);
						};

						async.during = function (test, iterator, callback) {
							callback = callback || noop;

							const next = _restParam(function (err, args) {
								if (err) {
									callback(err);
								} else {
									args.push(check);
									test.apply(this, args);
								}
							});

							var check = function (err, truth) {
								if (err) {
									callback(err);
								} else if (truth) {
									iterator(next);
								} else {
									callback(null);
								}
							};

							test(check);
						};

						async.doDuring = function (iterator, test, callback) {
							let calls = 0;
							async.during(
								function (next) {
									if (calls++ < 1) {
										next(null, true);
									} else {
										test.apply(this, arguments);
									}
								},
								iterator,
								callback
							);
						};

						function _queue(worker, concurrency, payload) {
							if (concurrency == null) {
								concurrency = 1;
							} else if (concurrency === 0) {
								throw new Error('Concurrency must not be zero');
							}

							function _insert(q, data, pos, callback) {
								if (callback != null && typeof callback !== 'function') {
									throw new Error('task callback must be a function');
								}

								q.started = true;

								if (!_isArray(data)) {
									data = [data];
								}

								if (data.length === 0 && q.idle()) {
									// call drain immediately if there are no tasks
									return async.setImmediate(function () {
										q.drain();
									});
								}

								_arrayEach(data, function (task) {
									const item = {
										data: task,
										callback: callback || noop,
									};

									if (pos) {
										q.tasks.unshift(item);
									} else {
										q.tasks.push(item);
									}

									if (q.tasks.length === q.concurrency) {
										q.saturated();
									}
								});
								async.setImmediate(q.process);
							}
							function _next(q, tasks) {
								return function () {
									workers -= 1;

									let removed = false;
									const args = arguments;
									_arrayEach(tasks, function (task) {
										_arrayEach(workersList, function (worker, index) {
											if (worker === task && !removed) {
												workersList.splice(index, 1);
												removed = true;
											}
										});

										task.callback.apply(task, args);
									});

									if (q.tasks.length + workers === 0) {
										q.drain();
									}

									q.process();
								};
							}

							var workers = 0;
							var workersList = [];
							var q = {
								tasks: [],
								concurrency: concurrency,
								payload: payload,
								saturated: noop,
								empty: noop,
								drain: noop,
								started: false,
								paused: false,
								push: function (data, callback) {
									_insert(q, data, false, callback);
								},
								kill: function () {
									q.drain = noop;
									q.tasks = [];
								},
								unshift: function (data, callback) {
									_insert(q, data, true, callback);
								},
								process: function () {
									while (!q.paused && workers < q.concurrency && q.tasks.length) {
										const tasks = q.payload
											? q.tasks.splice(0, q.payload)
											: q.tasks.splice(0, q.tasks.length);

										const data = _map(tasks, function (task) {
											return task.data;
										});

										if (q.tasks.length === 0) {
											q.empty();
										}

										workers += 1;
										workersList.push(tasks[0]);
										const cb = only_once(_next(q, tasks));
										worker(data, cb);
									}
								},
								length: function () {
									return q.tasks.length;
								},
								running: function () {
									return workers;
								},
								workersList: function () {
									return workersList;
								},
								idle: function () {
									return q.tasks.length + workers === 0;
								},
								pause: function () {
									q.paused = true;
								},
								resume: function () {
									if (q.paused === false) {
										return;
									}

									q.paused = false;
									const resumeCount = Math.min(q.concurrency, q.tasks.length);
									// Need to call q.process once per concurrent
									// worker to preserve full concurrency after pause
									for (let w = 1; w <= resumeCount; w++) {
										async.setImmediate(q.process);
									}
								},
							};
							return q;
						}

						async.queue = function (worker, concurrency) {
							const q = _queue(
								function (items, cb) {
									worker(items[0], cb);
								},
								concurrency,
								1
							);

							return q;
						};

						async.priorityQueue = function (worker, concurrency) {
							function _compareTasks(a, b) {
								return a.priority - b.priority;
							}

							function _binarySearch(sequence, item, compare) {
								let beg = -1;
								let end = sequence.length - 1;
								while (beg < end) {
									const mid = beg + ((end - beg + 1) >>> 1);

									if (compare(item, sequence[mid]) >= 0) {
										beg = mid;
									} else {
										end = mid - 1;
									}
								}
								return beg;
							}

							function _insert(q, data, priority, callback) {
								if (callback != null && typeof callback !== 'function') {
									throw new Error('task callback must be a function');
								}

								q.started = true;

								if (!_isArray(data)) {
									data = [data];
								}

								if (data.length === 0) {
									// call drain immediately if there are no tasks
									return async.setImmediate(function () {
										q.drain();
									});
								}

								_arrayEach(data, function (task) {
									const item = {
										data: task,
										priority: priority,
										callback: typeof callback === 'function' ? callback : noop,
									};

									q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

									if (q.tasks.length === q.concurrency) {
										q.saturated();
									}

									async.setImmediate(q.process);
								});
							}

							// Start with a normal queue
							const q = async.queue(worker, concurrency);

							// Override push to accept second parameter representing priority
							q.push = function (data, priority, callback) {
								_insert(q, data, priority, callback);
							};

							// Remove unshift function
							delete q.unshift;

							return q;
						};

						async.cargo = function (worker, payload) {
							return _queue(worker, 1, payload);
						};

						function _console_fn(name) {
							return _restParam(function (fn, args) {
								fn.apply(
									null,
									args.concat([
										_restParam(function (err, args) {
											if (typeof console === 'object') {
												if (err) {
													if (console.error) {
														console.error(err);
													}
												} else if (console[name]) {
													_arrayEach(args, function (x) {
														console[name](x);
													});
												}
											}
										}),
									])
								);
							});
						}
						async.log = _console_fn('log');
						async.dir = _console_fn('dir');
						/*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

						async.memoize = function (fn, hasher) {
							const memo = {};
							const queues = {};
							const has = Object.prototype.hasOwnProperty;
							hasher = hasher || identity;
							const memoized = _restParam(function memoized(args) {
								const callback = args.pop();
								const key = hasher.apply(null, args);

								if (has.call(memo, key)) {
									async.setImmediate(function () {
										callback.apply(null, memo[key]);
									});
								} else if (has.call(queues, key)) {
									queues[key].push(callback);
								} else {
									queues[key] = [callback];
									fn.apply(
										null,
										args.concat([
											_restParam(function (args) {
												memo[key] = args;
												const q = queues[key];
												delete queues[key];
												for (let i = 0, l = q.length; i < l; i++) {
													q[i].apply(null, args);
												}
											}),
										])
									);
								}
							});
							memoized.memo = memo;
							memoized.unmemoized = fn;
							return memoized;
						};

						async.unmemoize = function (fn) {
							return function () {
								return (fn.unmemoized || fn).apply(null, arguments);
							};
						};

						function _times(mapper) {
							return function (count, iterator, callback) {
								mapper(_range(count), iterator, callback);
							};
						}

						async.times = _times(async.map);
						async.timesSeries = _times(async.mapSeries);
						async.timesLimit = function (count, limit, iterator, callback) {
							return async.mapLimit(_range(count), limit, iterator, callback);
						};

						async.seq = function (/* functions... */) {
							const fns = arguments;
							return _restParam(function (args) {
								const that = this;

								let callback = args[args.length - 1];

								if (typeof callback === 'function') {
									args.pop();
								} else {
									callback = noop;
								}

								async.reduce(
									fns,
									args,
									function (newargs, fn, cb) {
										fn.apply(
											that,
											newargs.concat([
												_restParam(function (err, nextargs) {
													cb(err, nextargs);
												}),
											])
										);
									},
									function (err, results) {
										callback.apply(that, [err].concat(results));
									}
								);
							});
						};

						async.compose = function (/* functions... */) {
							return async.seq.apply(null, Array.prototype.reverse.call(arguments));
						};

						function _applyEach(eachfn) {
							return _restParam(function (fns, args) {
								const go = _restParam(function (args) {
									const that = this;
									const callback = args.pop();
									return eachfn(
										fns,
										function (fn, _, cb) {
											fn.apply(that, args.concat([cb]));
										},
										callback
									);
								});

								if (args.length) {
									return go.apply(this, args);
								} else {
									return go;
								}
							});
						}

						async.applyEach = _applyEach(async.eachOf);
						async.applyEachSeries = _applyEach(async.eachOfSeries);

						async.forever = function (fn, callback) {
							const done = only_once(callback || noop);
							const task = ensureAsync(fn);
							function next(err) {
								if (err) {
									return done(err);
								}

								task(next);
							}
							next();
						};

						function ensureAsync(fn) {
							return _restParam(function (args) {
								const callback = args.pop();
								args.push(function () {
									const innerArgs = arguments;

									if (sync) {
										async.setImmediate(function () {
											callback.apply(null, innerArgs);
										});
									} else {
										callback.apply(null, innerArgs);
									}
								});
								var sync = true;
								fn.apply(this, args);
								sync = false;
							});
						}

						async.ensureAsync = ensureAsync;

						async.constant = _restParam(function (values) {
							const args = [null].concat(values);
							return function (callback) {
								return callback.apply(this, args);
							};
						});

						async.wrapSync = async.asyncify = function asyncify(func) {
							return _restParam(function (args) {
								const callback = args.pop();
								let result;
								try {
									result = func.apply(this, args);
								} catch (e) {
									return callback(e);
								}

								// if result is Promise object
								if (_isObject(result) && typeof result.then === 'function') {
									result
										.then(function (value) {
											callback(null, value);
										})
										['catch'](function (err) {
											callback(err.message ? err : new Error(err));
										});
								} else {
									callback(null, result);
								}
							});
						};

						// Node.js
						if (typeof module === 'object' && module.exports) {
							module.exports = async;
						}
						// AMD / RequireJS
						else if (typeof define === 'function' && define.amd) {
							define([], function () {
								return async;
							});
						}
						// included directly via <script> tag
						else {
							root.async = async;
						}
					})();
				}.call(
					this,
					require('_process'),
					typeof global !== 'undefined'
						? global
						: typeof self !== 'undefined'
							? self
							: typeof window !== 'undefined'
								? window
								: {}
				));
			},
			{ _process: 12 },
		],
		12: [
			function (require, module, exports) {
				// shim for using process in browser
				const process = (module.exports = {});

				// cached from whatever global is present so that test runners that stub it
				// don't break things.  But we need to wrap it in a try catch in case it is
				// wrapped in strict mode code which doesn't define any globals.  It's inside a
				// function because try/catches deoptimize in certain engines.

				let cachedSetTimeout;
				let cachedClearTimeout;

				function defaultSetTimout() {
					throw new Error('setTimeout has not been defined');
				}
				function defaultClearTimeout() {
					throw new Error('clearTimeout has not been defined');
				}
				(function () {
					try {
						if (typeof setTimeout === 'function') {
							cachedSetTimeout = setTimeout;
						} else {
							cachedSetTimeout = defaultSetTimout;
						}
					} catch (e) {
						cachedSetTimeout = defaultSetTimout;
					}
					try {
						if (typeof clearTimeout === 'function') {
							cachedClearTimeout = clearTimeout;
						} else {
							cachedClearTimeout = defaultClearTimeout;
						}
					} catch (e) {
						cachedClearTimeout = defaultClearTimeout;
					}
				})();
				function runTimeout(fun) {
					if (cachedSetTimeout === setTimeout) {
						//normal enviroments in sane situations
						return setTimeout(fun, 0);
					}

					// if setTimeout wasn't available but was latter defined
					if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
						cachedSetTimeout = setTimeout;
						return setTimeout(fun, 0);
					}

					try {
						// when when somebody has screwed with setTimeout but no I.E. maddness
						return cachedSetTimeout(fun, 0);
					} catch (e) {
						try {
							// When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
							return cachedSetTimeout.call(null, fun, 0);
						} catch (e) {
							// same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
							return cachedSetTimeout.call(this, fun, 0);
						}
					}
				}
				function runClearTimeout(marker) {
					if (cachedClearTimeout === clearTimeout) {
						//normal enviroments in sane situations
						return clearTimeout(marker);
					}

					// if clearTimeout wasn't available but was latter defined
					if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
						cachedClearTimeout = clearTimeout;
						return clearTimeout(marker);
					}

					try {
						// when when somebody has screwed with setTimeout but no I.E. maddness
						return cachedClearTimeout(marker);
					} catch (e) {
						try {
							// When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
							return cachedClearTimeout.call(null, marker);
						} catch (e) {
							// same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
							// Some versions of I.E. have different rules for clearTimeout vs setTimeout
							return cachedClearTimeout.call(this, marker);
						}
					}
				}
				let queue = [];
				let draining = false;
				let currentQueue;
				let queueIndex = -1;

				function cleanUpNextTick() {
					if (!draining || !currentQueue) {
						return;
					}

					draining = false;

					if (currentQueue.length) {
						queue = currentQueue.concat(queue);
					} else {
						queueIndex = -1;
					}

					if (queue.length) {
						drainQueue();
					}
				}

				function drainQueue() {
					if (draining) {
						return;
					}

					const timeout = runTimeout(cleanUpNextTick);
					draining = true;

					let len = queue.length;
					while (len) {
						currentQueue = queue;
						queue = [];
						while (++queueIndex < len) {
							if (currentQueue) {
								currentQueue[queueIndex].run();
							}
						}
						queueIndex = -1;
						len = queue.length;
					}
					currentQueue = null;
					draining = false;
					runClearTimeout(timeout);
				}

				process.nextTick = function (fun) {
					const args = new Array(arguments.length - 1);

					if (arguments.length > 1) {
						for (let i = 1; i < arguments.length; i++) {
							args[i - 1] = arguments[i];
						}
					}

					queue.push(new Item(fun, args));

					if (queue.length === 1 && !draining) {
						runTimeout(drainQueue);
					}
				};

				// v8 likes predictible objects
				function Item(fun, array) {
					this.fun = fun;
					this.array = array;
				}
				Item.prototype.run = function () {
					this.fun.apply(null, this.array);
				};
				process.title = 'browser';
				process.browser = true;
				process.env = {};
				process.argv = [];
				process.version = ''; // empty string to avoid regexp issues
				process.versions = {};

				function noop() {}

				process.on = noop;
				process.addListener = noop;
				process.once = noop;
				process.off = noop;
				process.removeListener = noop;
				process.removeAllListeners = noop;
				process.emit = noop;

				process.binding = function (name) {
					throw new Error('process.binding is not supported');
				};

				process.cwd = function () {
					return '/';
				};
				process.chdir = function (dir) {
					throw new Error('process.chdir is not supported');
				};
				process.umask = function () {
					return 0;
				};
			},
			{},
		],
		13: [
			function (require, module, exports) {
				(function (global) {
					/*! https://mths.be/punycode v1.4.1 by @mathias */
					(function (root) {
						/** Detect free variables */
						const freeExports = typeof exports === 'object' && exports && !exports.nodeType && exports;
						const freeModule = typeof module === 'object' && module && !module.nodeType && module;
						const freeGlobal = typeof global === 'object' && global;

						if (
							freeGlobal.global === freeGlobal
							|| freeGlobal.window === freeGlobal
							|| freeGlobal.self === freeGlobal
						) {
							root = freeGlobal;
						}

						/**
						 * The `punycode` object.
						 * @name punycode
						 * @type Object
						 */
						let punycode;
						/** Highest positive signed 32-bit float value */
						const maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1
						/** Bootstring parameters */
						const base = 36;
						const tMin = 1;
						const tMax = 26;
						const skew = 38;
						const damp = 700;
						const initialBias = 72;
						const initialN = 128; // 0x80
						const delimiter = '-'; // '\x2D'
						/** Regular expressions */
						const regexPunycode = /^xn--/;
						const regexNonASCII = /[^\x20-\x7E]/; // unprintable ASCII chars + non-ASCII chars
						const regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g; // RFC 3490 separators
						/** Error messages */
						const errors = {
							'overflow': 'Overflow: input needs wider integers to process',
							'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
							'invalid-input': 'Invalid input',
						};
							/** Convenience shortcuts */
						const baseMinusTMin = base - tMin;
						const floor = Math.floor;
						const stringFromCharCode = String.fromCharCode;
						/** Temporary variable */
						let key;

						/*--------------------------------------------------------------------------*/

						/**
						 * A generic error utility function.
						 * @private
						 * @param {String} type The error type.
						 * @returns {Error} Throws a `RangeError` with the applicable error message.
						 */
						function error(type) {
							throw new RangeError(errors[type]);
						}

						/**
						 * A generic `Array#map` utility function.
						 * @private
						 * @param {Array} array The array to iterate over.
						 * @param {Function} callback The function that gets called for every array
						 * item.
						 * @returns {Array} A new array of values returned by the callback function.
						 */
						function map(array, fn) {
							let length = array.length;
							const result = [];
							while (length--) {
								result[length] = fn(array[length]);
							}
							return result;
						}

						/**
						 * A simple `Array#map`-like wrapper to work with domain name strings or email
						 * addresses.
						 * @private
						 * @param {String} domain The domain name or email address.
						 * @param {Function} callback The function that gets called for every
						 * character.
						 * @returns {Array} A new string of characters returned by the callback
						 * function.
						 */
						function mapDomain(string, fn) {
							const parts = string.split('@');
							let result = '';

							if (parts.length > 1) {
								// In email addresses, only the domain name should be punycoded. Leave
								// the local part (i.e. everything up to `@`) intact.
								result = parts[0] + '@';
								string = parts[1];
							}

							// Avoid `split(regex)` for IE8 compatibility. See #17.
							string = string.replace(regexSeparators, '\x2E');
							const labels = string.split('.');
							const encoded = map(labels, fn).join('.');
							return result + encoded;
						}

						/**
						 * Creates an array containing the numeric code points of each Unicode
						 * character in the string. While JavaScript uses UCS-2 internally,
						 * this function will convert a pair of surrogate halves (each of which
						 * UCS-2 exposes as separate characters) into a single code point,
						 * matching UTF-16.
						 * @see `punycode.ucs2.encode`
						 * @see <https://mathiasbynens.be/notes/javascript-encoding>
						 * @memberOf punycode.ucs2
						 * @name decode
						 * @param {String} string The Unicode input string (UCS-2).
						 * @returns {Array} The new array of code points.
						 */
						function ucs2decode(string) {
							const output = [];
							let counter = 0;
							const length = string.length;
							let value;
							let extra;
							while (counter < length) {
								value = string.charCodeAt(counter++);

								if (value >= 0xd800 && value <= 0xdbff && counter < length) {
									// high surrogate, and there is a next character
									extra = string.charCodeAt(counter++);

									if ((extra & 0xfc00) == 0xdc00) {
										// low surrogate
										output.push(((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000);
									} else {
										// unmatched surrogate; only append this code unit, in case the next
										// code unit is the high surrogate of a surrogate pair
										output.push(value);
										counter--;
									}
								} else {
									output.push(value);
								}
							}
							return output;
						}

						/**
						 * Creates a string based on an array of numeric code points.
						 * @see `punycode.ucs2.decode`
						 * @memberOf punycode.ucs2
						 * @name encode
						 * @param {Array} codePoints The array of numeric code points.
						 * @returns {String} The new Unicode string (UCS-2).
						 */
						function ucs2encode(array) {
							return map(array, function (value) {
								let output = '';

								if (value > 0xffff) {
									value -= 0x10000;
									output += stringFromCharCode(((value >>> 10) & 0x3ff) | 0xd800);
									value = 0xdc00 | (value & 0x3ff);
								}

								output += stringFromCharCode(value);
								return output;
							}).join('');
						}

						/**
						 * Converts a basic code point into a digit/integer.
						 * @see `digitToBasic()`
						 * @private
						 * @param {Number} codePoint The basic numeric code point value.
						 * @returns {Number} The numeric value of a basic code point (for use in
						 * representing integers) in the range `0` to `base - 1`, or `base` if
						 * the code point does not represent a value.
						 */
						function basicToDigit(codePoint) {
							if (codePoint - 48 < 10) {
								return codePoint - 22;
							}

							if (codePoint - 65 < 26) {
								return codePoint - 65;
							}

							if (codePoint - 97 < 26) {
								return codePoint - 97;
							}

							return base;
						}

						/**
						 * Converts a digit/integer into a basic code point.
						 * @see `basicToDigit()`
						 * @private
						 * @param {Number} digit The numeric value of a basic code point.
						 * @returns {Number} The basic code point whose value (when used for
						 * representing integers) is `digit`, which needs to be in the range
						 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
						 * used; else, the lowercase form is used. The behavior is undefined
						 * if `flag` is non-zero and `digit` has no uppercase form.
						 */
						function digitToBasic(digit, flag) {
							//  0..25 map to ASCII a..z or A..Z
							// 26..35 map to ASCII 0..9
							return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
						}

						/**
						 * Bias adaptation function as per section 3.4 of RFC 3492.
						 * https://tools.ietf.org/html/rfc3492#section-3.4
						 * @private
						 */
						function adapt(delta, numPoints, firstTime) {
							let k = 0;
							delta = firstTime ? floor(delta / damp) : delta >> 1;
							delta += floor(delta / numPoints);
							for (; /* no initialization */ delta > (baseMinusTMin * tMax) >> 1; k += base) {
								delta = floor(delta / baseMinusTMin);
							}
							return floor(k + ((baseMinusTMin + 1) * delta) / (delta + skew));
						}

						/**
						 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
						 * symbols.
						 * @memberOf punycode
						 * @param {String} input The Punycode string of ASCII-only symbols.
						 * @returns {String} The resulting string of Unicode symbols.
						 */
						function decode(input) {
							// Don't use UCS-2
							const output = [];
							const inputLength = input.length;
							let out;
							let i = 0;
							let n = initialN;
							let bias = initialBias;
							let basic;
							let j;
							let index;
							let oldi;
							let w;
							let k;
							let digit;
							let t;
							/** Cached calculation results */
							let baseMinusT;

							// Handle the basic code points: let `basic` be the number of input code
							// points before the last delimiter, or `0` if there is none, then copy
							// the first basic code points to the output.

							basic = input.lastIndexOf(delimiter);

							if (basic < 0) {
								basic = 0;
							}

							for (j = 0; j < basic; ++j) {
								// if it's not a basic code point
								if (input.charCodeAt(j) >= 0x80) {
									error('not-basic');
								}

								output.push(input.charCodeAt(j));
							}

							// Main decoding loop: start just after the last delimiter if any basic code
							// points were copied; start at the beginning otherwise.

							for (
								index = basic > 0 ? basic + 1 : 0;
								index < inputLength /* no final expression */;

							) {
								// `index` is the index of the next character to be consumed.
								// Decode a generalized variable-length integer into `delta`,
								// which gets added to `i`. The overflow checking is easier
								// if we increase `i` as we go, then subtract off its starting
								// value at the end to obtain `delta`.
								for (oldi = i, w = 1, k = base /* no condition */; ; k += base) {
									if (index >= inputLength) {
										error('invalid-input');
									}

									digit = basicToDigit(input.charCodeAt(index++));

									if (digit >= base || digit > floor((maxInt - i) / w)) {
										error('overflow');
									}

									i += digit * w;
									t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;

									if (digit < t) {
										break;
									}

									baseMinusT = base - t;

									if (w > floor(maxInt / baseMinusT)) {
										error('overflow');
									}

									w *= baseMinusT;
								}

								out = output.length + 1;
								bias = adapt(i - oldi, out, oldi == 0);

								// `i` was supposed to wrap around from `out` to `0`,
								// incrementing `n` each time, so we'll fix that now:
								if (floor(i / out) > maxInt - n) {
									error('overflow');
								}

								n += floor(i / out);
								i %= out;

								// Insert `n` at position `i` of the output
								output.splice(i++, 0, n);
							}

							return ucs2encode(output);
						}

						/**
						 * Converts a string of Unicode symbols (e.g. a domain name label) to a
						 * Punycode string of ASCII-only symbols.
						 * @memberOf punycode
						 * @param {String} input The string of Unicode symbols.
						 * @returns {String} The resulting Punycode string of ASCII-only symbols.
						 */
						function encode(input) {
							let n;
							let delta;
							let handledCPCount;
							let basicLength;
							let bias;
							let j;
							let m;
							let q;
							let k;
							let t;
							let currentValue;
							const output = [];
							/** `inputLength` will hold the number of code points in `input`. */
							let inputLength;
							/** Cached calculation results */
							let handledCPCountPlusOne;
							let baseMinusT;
							let qMinusT;

							// Convert the input in UCS-2 to Unicode
							input = ucs2decode(input);

							// Cache the length
							inputLength = input.length;

							// Initialize the state
							n = initialN;
							delta = 0;
							bias = initialBias;

							// Handle the basic code points
							for (j = 0; j < inputLength; ++j) {
								currentValue = input[j];

								if (currentValue < 0x80) {
									output.push(stringFromCharCode(currentValue));
								}
							}

							handledCPCount = basicLength = output.length;

							// `handledCPCount` is the number of code points that have been handled;
							// `basicLength` is the number of basic code points.

							// Finish the basic string - if it is not empty - with a delimiter
							if (basicLength) {
								output.push(delimiter);
							}

							// Main encoding loop:
							while (handledCPCount < inputLength) {
								// All non-basic code points < n have been handled already. Find the next
								// larger one:
								for (m = maxInt, j = 0; j < inputLength; ++j) {
									currentValue = input[j];

									if (currentValue >= n && currentValue < m) {
										m = currentValue;
									}
								}

								// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
								// but guard against overflow
								handledCPCountPlusOne = handledCPCount + 1;

								if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
									error('overflow');
								}

								delta += (m - n) * handledCPCountPlusOne;
								n = m;

								for (j = 0; j < inputLength; ++j) {
									currentValue = input[j];

									if (currentValue < n && ++delta > maxInt) {
										error('overflow');
									}

									if (currentValue == n) {
										// Represent delta as a generalized variable-length integer
										for (q = delta, k = base /* no condition */; ; k += base) {
											t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;

											if (q < t) {
												break;
											}

											qMinusT = q - t;
											baseMinusT = base - t;
											output.push(stringFromCharCode(digitToBasic(t + (qMinusT % baseMinusT), 0)));
											q = floor(qMinusT / baseMinusT);
										}

										output.push(stringFromCharCode(digitToBasic(q, 0)));
										bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
										delta = 0;
										++handledCPCount;
									}
								}

								++delta;
								++n;
							}
							return output.join('');
						}

						/**
						 * Converts a Punycode string representing a domain name or an email address
						 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
						 * it doesn't matter if you call it on a string that has already been
						 * converted to Unicode.
						 * @memberOf punycode
						 * @param {String} input The Punycoded domain name or email address to
						 * convert to Unicode.
						 * @returns {String} The Unicode representation of the given Punycode
						 * string.
						 */
						function toUnicode(input) {
							return mapDomain(input, function (string) {
								return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
							});
						}

						/**
						 * Converts a Unicode string representing a domain name or an email address to
						 * Punycode. Only the non-ASCII parts of the domain name will be converted,
						 * i.e. it doesn't matter if you call it with a domain that's already in
						 * ASCII.
						 * @memberOf punycode
						 * @param {String} input The domain name or email address to convert, as a
						 * Unicode string.
						 * @returns {String} The Punycode representation of the given domain name or
						 * email address.
						 */
						function toASCII(input) {
							return mapDomain(input, function (string) {
								return regexNonASCII.test(string) ? 'xn--' + encode(string) : string;
							});
						}

						/*--------------------------------------------------------------------------*/

						/** Define the public API */
						punycode = {
							/**
							 * A string representing the current Punycode.js version number.
							 * @memberOf punycode
							 * @type String
							 */
							version: '1.4.1',
							/**
							 * An object of methods to convert from JavaScript's internal character
							 * representation (UCS-2) to Unicode code points, and back.
							 * @see <https://mathiasbynens.be/notes/javascript-encoding>
							 * @memberOf punycode
							 * @type Object
							 */
							ucs2: {
								decode: ucs2decode,
								encode: ucs2encode,
							},
							decode: decode,
							encode: encode,
							toASCII: toASCII,
							toUnicode: toUnicode,
						};

						/** Expose `punycode` */
						// Some AMD build optimizers, like r.js, check for specific condition patterns
						// like the following:
						if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
							define('punycode', function () {
								return punycode;
							});
						} else if (freeExports && freeModule) {
							if (module.exports == freeExports) {
								// in Node.js, io.js, or RingoJS v0.8.0+
								freeModule.exports = punycode;
							} else {
								// in Narwhal or RingoJS v0.7.0-
								for (key in punycode) {
									punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
								}
							}
						} else {
							// in Rhino or a web browser
							root.punycode = punycode;
						}
					})(this);
				}.call(
					this,
					typeof global !== 'undefined'
						? global
						: typeof self !== 'undefined'
							? self
							: typeof window !== 'undefined'
								? window
								: {}
				));
			},
			{},
		],
		14: [
			function (require, module, exports) {
				// Copyright Joyent, Inc. and other Node contributors.
				//
				// Permission is hereby granted, free of charge, to any person obtaining a
				// copy of this software and associated documentation files (the
				// "Software"), to deal in the Software without restriction, including
				// without limitation the rights to use, copy, modify, merge, publish,
				// distribute, sublicense, and/or sell copies of the Software, and to permit
				// persons to whom the Software is furnished to do so, subject to the
				// following conditions:
				//
				// The above copyright notice and this permission notice shall be included
				// in all copies or substantial portions of the Software.
				//
				// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
				// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
				// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
				// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
				// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
				// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
				// USE OR OTHER DEALINGS IN THE SOFTWARE.

				'use strict';

				// If obj.hasOwnProperty has been overridden, then calling
				// obj.hasOwnProperty(prop) will break.
				// See: https://github.com/joyent/node/issues/1707
				function hasOwnProperty(obj, prop) {
					return Object.prototype.hasOwnProperty.call(obj, prop);
				}

				module.exports = function (qs, sep, eq, options) {
					sep = sep || '&';
					eq = eq || '=';
					const obj = {};

					if (typeof qs !== 'string' || qs.length === 0) {
						return obj;
					}

					const regexp = /\+/g;
					qs = qs.split(sep);

					let maxKeys = 1000;

					if (options && typeof options.maxKeys === 'number') {
						maxKeys = options.maxKeys;
					}

					let len = qs.length;

					// maxKeys <= 0 means that we should not limit keys count
					if (maxKeys > 0 && len > maxKeys) {
						len = maxKeys;
					}

					for (let i = 0; i < len; ++i) {
						const x = qs[i].replace(regexp, '%20');
						const idx = x.indexOf(eq);
						var kstr;
						var vstr;
						var k;
						var v;

						if (idx >= 0) {
							kstr = x.substr(0, idx);
							vstr = x.substr(idx + 1);
						} else {
							kstr = x;
							vstr = '';
						}

						k = decodeURIComponent(kstr);
						v = decodeURIComponent(vstr);

						if (!hasOwnProperty(obj, k)) {
							obj[k] = v;
						} else if (isArray(obj[k])) {
							obj[k].push(v);
						} else {
							obj[k] = [obj[k], v];
						}
					}

					return obj;
				};

				var isArray
					= Array.isArray
					|| function (xs) {
						return Object.prototype.toString.call(xs) === '[object Array]';
					};
			},
			{},
		],
		15: [
			function (require, module, exports) {
				// Copyright Joyent, Inc. and other Node contributors.
				//
				// Permission is hereby granted, free of charge, to any person obtaining a
				// copy of this software and associated documentation files (the
				// "Software"), to deal in the Software without restriction, including
				// without limitation the rights to use, copy, modify, merge, publish,
				// distribute, sublicense, and/or sell copies of the Software, and to permit
				// persons to whom the Software is furnished to do so, subject to the
				// following conditions:
				//
				// The above copyright notice and this permission notice shall be included
				// in all copies or substantial portions of the Software.
				//
				// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
				// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
				// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
				// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
				// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
				// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
				// USE OR OTHER DEALINGS IN THE SOFTWARE.

				'use strict';

				const stringifyPrimitive = function (v) {
					switch (typeof v) {
						case 'string':
							return v;

						case 'boolean':
							return v ? 'true' : 'false';

						case 'number':
							return isFinite(v) ? v : '';

						default:
							return '';
					}
				};

				module.exports = function (obj, sep, eq, name) {
					sep = sep || '&';
					eq = eq || '=';

					if (obj === null) {
						obj = undefined;
					}

					if (typeof obj === 'object') {
						return map(objectKeys(obj), function (k) {
							const ks = encodeURIComponent(stringifyPrimitive(k)) + eq;

							if (isArray(obj[k])) {
								return map(obj[k], function (v) {
									return ks + encodeURIComponent(stringifyPrimitive(v));
								}).join(sep);
							} else {
								return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
							}
						}).join(sep);
					}

					if (!name) return '';

					return (
						encodeURIComponent(stringifyPrimitive(name))
						+ eq
						+ encodeURIComponent(stringifyPrimitive(obj))
					);
				};

				var isArray
					= Array.isArray
					|| function (xs) {
						return Object.prototype.toString.call(xs) === '[object Array]';
					};

				function map(xs, f) {
					if (xs.map) return xs.map(f);

					const res = [];
					for (let i = 0; i < xs.length; i++) {
						res.push(f(xs[i], i));
					}
					return res;
				}

				var objectKeys
					= Object.keys
					|| function (obj) {
						const res = [];
						for (const key in obj) {
							if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
						}
						return res;
					};
			},
			{},
		],
		16: [
			function (require, module, exports) {
				'use strict';

				exports.decode = exports.parse = require('./decode');
				exports.encode = exports.stringify = require('./encode');
			},
			{ './decode': 14, './encode': 15 },
		],
		17: [
			function (require, module, exports) {
				// Copyright Joyent, Inc. and other Node contributors.
				//
				// Permission is hereby granted, free of charge, to any person obtaining a
				// copy of this software and associated documentation files (the
				// "Software"), to deal in the Software without restriction, including
				// without limitation the rights to use, copy, modify, merge, publish,
				// distribute, sublicense, and/or sell copies of the Software, and to permit
				// persons to whom the Software is furnished to do so, subject to the
				// following conditions:
				//
				// The above copyright notice and this permission notice shall be included
				// in all copies or substantial portions of the Software.
				//
				// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
				// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
				// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
				// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
				// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
				// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
				// USE OR OTHER DEALINGS IN THE SOFTWARE.

				'use strict';

				const punycode = require('punycode');
				const util = require('./util');

				exports.parse = urlParse;
				exports.resolve = urlResolve;
				exports.resolveObject = urlResolveObject;
				exports.format = urlFormat;

				exports.Url = Url;

				function Url() {
					this.protocol = null;
					this.slashes = null;
					this.auth = null;
					this.host = null;
					this.port = null;
					this.hostname = null;
					this.hash = null;
					this.search = null;
					this.query = null;
					this.pathname = null;
					this.path = null;
					this.href = null;
				}

				// Reference: RFC 3986, RFC 1808, RFC 2396

				// define these here so at least they only have to be
				// compiled once on the first module load.
				const protocolPattern = /^([a-z0-9.+-]+:)/i;
				const portPattern = /:[0-9]*$/;
				// Special case for a simple path URL
				const simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/;
				// RFC 2396: characters reserved for delimiting URLs.
				// We actually just auto-escape these.
				const delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'];
				// RFC 2396: characters not allowed for various reasons.
				const unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims);
				// Allowed by RFCs, but cause of XSS attacks.  Always escape these.
				const autoEscape = ["'"].concat(unwise);
				// Characters that are never ever allowed in a hostname.
				// Note that any invalid chars are also handled, but these
				// are the ones that are *expected* to be seen, so we fast-path
				// them.
				const nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape);
				const hostEndingChars = ['/', '?', '#'];
				const hostnameMaxLen = 255;
				const hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/;
				const hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/;
				// protocols that can allow "unsafe" and "unwise" chars.
				const unsafeProtocol = {
					'javascript': true,
					'javascript:': true,
				};
					// protocols that never have a hostname.
				const hostlessProtocol = {
					'javascript': true,
					'javascript:': true,
				};
					// protocols that always contain a // bit.
				const slashedProtocol = {
					'http': true,
					'https': true,
					'ftp': true,
					'gopher': true,
					'file': true,
					'http:': true,
					'https:': true,
					'ftp:': true,
					'gopher:': true,
					'file:': true,
				};
				const querystring = require('querystring');

				function urlParse(url, parseQueryString, slashesDenoteHost) {
					if (url && util.isObject(url) && url instanceof Url) return url;

					const u = new Url();
					u.parse(url, parseQueryString, slashesDenoteHost);
					return u;
				}

				Url.prototype.parse = function (url, parseQueryString, slashesDenoteHost) {
					if (!util.isString(url)) {
						throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
					}

					// Copy chrome, IE, opera backslash-handling behavior.
					// Back slashes before the query string get converted to forward slashes
					// See: https://code.google.com/p/chromium/issues/detail?id=25916
					const queryIndex = url.indexOf('?');
					const splitter = queryIndex !== -1 && queryIndex < url.indexOf('#') ? '?' : '#';
					const uSplit = url.split(splitter);
					const slashRegex = /\\/g;
					uSplit[0] = uSplit[0].replace(slashRegex, '/');
					url = uSplit.join(splitter);

					let rest = url;

					// trim before proceeding.
					// This is to support parse stuff like "  http://foo.com  \n"
					rest = rest.trim();

					if (!slashesDenoteHost && url.split('#').length === 1) {
						// Try fast path regexp
						const simplePath = simplePathPattern.exec(rest);

						if (simplePath) {
							this.path = rest;
							this.href = rest;
							this.pathname = simplePath[1];

							if (simplePath[2]) {
								this.search = simplePath[2];

								if (parseQueryString) {
									this.query = querystring.parse(this.search.substr(1));
								} else {
									this.query = this.search.substr(1);
								}
							} else if (parseQueryString) {
								this.search = '';
								this.query = {};
							}

							return this;
						}
					}

					let proto = protocolPattern.exec(rest);

					if (proto) {
						proto = proto[0];
						var lowerProto = proto.toLowerCase();
						this.protocol = lowerProto;
						rest = rest.substr(proto.length);
					}

					// figure out if it's got a host
					// user@server is *always* interpreted as a hostname, and url
					// resolution will treat //foo/bar as host=foo,path=bar because that's
					// how the browser resolves relative URLs.
					if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
						var slashes = rest.substr(0, 2) === '//';

						if (slashes && !(proto && hostlessProtocol[proto])) {
							rest = rest.substr(2);
							this.slashes = true;
						}
					}

					if (!hostlessProtocol[proto] && (slashes || (proto && !slashedProtocol[proto]))) {
						// there's a hostname.
						// the first instance of /, ?, ;, or # ends the host.
						//
						// If there is an @ in the hostname, then non-host chars *are* allowed
						// to the left of the last @ sign, unless some host-ending character
						// comes *before* the @-sign.
						// URLs are obnoxious.
						//
						// ex:
						// http://a@b@c/ => user:a@b host:c
						// http://a@b?@c => user:a host:c path:/?@c

						// v0.12 TODO(isaacs): This is not quite how Chrome does things.
						// Review our test case against browsers more comprehensively.

						// find the first instance of any hostEndingChars
						let hostEnd = -1;
						for (var i = 0; i < hostEndingChars.length; i++) {
							var hec = rest.indexOf(hostEndingChars[i]);

							if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) hostEnd = hec;
						}

						// at this point, either we have an explicit point where the
						// auth portion cannot go past, or the last @ char is the decider.
						let auth; let atSign;

						if (hostEnd === -1) {
							// atSign can be anywhere.
							atSign = rest.lastIndexOf('@');
						} else {
							// atSign must be in auth portion.
							// http://a@b/c@d => host:b auth:a path:/c@d
							atSign = rest.lastIndexOf('@', hostEnd);
						}

						// Now we have a portion which is definitely the auth.
						// Pull that off.
						if (atSign !== -1) {
							auth = rest.slice(0, atSign);
							rest = rest.slice(atSign + 1);
							this.auth = decodeURIComponent(auth);
						}

						// the host is the remaining to the left of the first non-host char
						hostEnd = -1;
						for (var i = 0; i < nonHostChars.length; i++) {
							var hec = rest.indexOf(nonHostChars[i]);

							if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) hostEnd = hec;
						}

						// if we still have not hit it, then the entire thing is a host.
						if (hostEnd === -1) hostEnd = rest.length;

						this.host = rest.slice(0, hostEnd);
						rest = rest.slice(hostEnd);

						// pull out port.
						this.parseHost();

						// we've indicated that there is a hostname,
						// so even if it's empty, it has to be present.
						this.hostname = this.hostname || '';

						// if hostname begins with [ and ends with ]
						// assume that it's an IPv6 address.
						const ipv6Hostname
							= this.hostname[0] === '[' && this.hostname[this.hostname.length - 1] === ']';

						// validate a little.
						if (!ipv6Hostname) {
							const hostparts = this.hostname.split(/\./);
							for (var i = 0, l = hostparts.length; i < l; i++) {
								const part = hostparts[i];

								if (!part) continue;

								if (!part.match(hostnamePartPattern)) {
									let newpart = '';
									for (let j = 0, k = part.length; j < k; j++) {
										if (part.charCodeAt(j) > 127) {
											// we replace non-ASCII char with a temporary placeholder
											// we need this to make sure size of hostname is not
											// broken by replacing non-ASCII by nothing
											newpart += 'x';
										} else {
											newpart += part[j];
										}
									}

									// we test again with ASCII char only
									if (!newpart.match(hostnamePartPattern)) {
										const validParts = hostparts.slice(0, i);
										const notHost = hostparts.slice(i + 1);
										const bit = part.match(hostnamePartStart);

										if (bit) {
											validParts.push(bit[1]);
											notHost.unshift(bit[2]);
										}

										if (notHost.length) {
											rest = '/' + notHost.join('.') + rest;
										}

										this.hostname = validParts.join('.');
										break;
									}
								}
							}
						}

						if (this.hostname.length > hostnameMaxLen) {
							this.hostname = '';
						} else {
							// hostnames are always lower case.
							this.hostname = this.hostname.toLowerCase();
						}

						if (!ipv6Hostname) {
							// IDNA Support: Returns a punycoded representation of "domain".
							// It only converts parts of the domain name that
							// have non-ASCII characters, i.e. it doesn't matter if
							// you call it with a domain that already is ASCII-only.
							this.hostname = punycode.toASCII(this.hostname);
						}

						var p = this.port ? ':' + this.port : '';
						const h = this.hostname || '';
						this.host = h + p;
						this.href += this.host;

						// strip [ and ] from the hostname
						// the host field still retains them, though
						if (ipv6Hostname) {
							this.hostname = this.hostname.substr(1, this.hostname.length - 2);

							if (rest[0] !== '/') {
								rest = '/' + rest;
							}
						}
					}

					// now rest is set to the post-host stuff.
					// chop off any delim chars.
					if (!unsafeProtocol[lowerProto]) {
						// First, make 100% sure that any "autoEscape" chars get
						// escaped, even if encodeURIComponent doesn't think they
						// need to be.
						for (var i = 0, l = autoEscape.length; i < l; i++) {
							const ae = autoEscape[i];

							if (rest.indexOf(ae) === -1) continue;

							let esc = encodeURIComponent(ae);

							if (esc === ae) {
								esc = escape(ae);
							}

							rest = rest.split(ae).join(esc);
						}
					}

					// chop off from the tail first.
					const hash = rest.indexOf('#');

					if (hash !== -1) {
						// got a fragment string.
						this.hash = rest.substr(hash);
						rest = rest.slice(0, hash);
					}

					const qm = rest.indexOf('?');

					if (qm !== -1) {
						this.search = rest.substr(qm);
						this.query = rest.substr(qm + 1);

						if (parseQueryString) {
							this.query = querystring.parse(this.query);
						}

						rest = rest.slice(0, qm);
					} else if (parseQueryString) {
						// no query string, but parseQueryString still requested
						this.search = '';
						this.query = {};
					}

					if (rest) this.pathname = rest;

					if (slashedProtocol[lowerProto] && this.hostname && !this.pathname) {
						this.pathname = '/';
					}

					//to support http.request
					if (this.pathname || this.search) {
						var p = this.pathname || '';
						const s = this.search || '';
						this.path = p + s;
					}

					// finally, reconstruct the href based on what has been validated.
					this.href = this.format();
					return this;
				};

				// format a parsed object into a url string
				function urlFormat(obj) {
					// ensure it's an object, and not a string url.
					// If it's an obj, this is a no-op.
					// this way, you can call url_format() on strings
					// to clean up potentially wonky urls.
					if (util.isString(obj)) obj = urlParse(obj);

					if (!(obj instanceof Url)) return Url.prototype.format.call(obj);

					return obj.format();
				}

				Url.prototype.format = function () {
					let auth = this.auth || '';

					if (auth) {
						auth = encodeURIComponent(auth);
						auth = auth.replace(/%3A/i, ':');
						auth += '@';
					}

					let protocol = this.protocol || '';
					let pathname = this.pathname || '';
					let hash = this.hash || '';
					let host = false;
					let query = '';

					if (this.host) {
						host = auth + this.host;
					} else if (this.hostname) {
						host
							= auth
							+ (this.hostname.indexOf(':') === -1 ? this.hostname : '[' + this.hostname + ']');

						if (this.port) {
							host += ':' + this.port;
						}
					}

					if (this.query && util.isObject(this.query) && Object.keys(this.query).length) {
						query = querystring.stringify(this.query);
					}

					let search = this.search || (query && '?' + query) || '';

					if (protocol && protocol.substr(-1) !== ':') protocol += ':';

					// only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
					// unless they had them to begin with.
					if (this.slashes || ((!protocol || slashedProtocol[protocol]) && host !== false)) {
						host = '//' + (host || '');

						if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
					} else if (!host) {
						host = '';
					}

					if (hash && hash.charAt(0) !== '#') hash = '#' + hash;

					if (search && search.charAt(0) !== '?') search = '?' + search;

					pathname = pathname.replace(/[?#]/g, function (match) {
						return encodeURIComponent(match);
					});
					search = search.replace('#', '%23');

					return protocol + host + pathname + search + hash;
				};

				function urlResolve(source, relative) {
					return urlParse(source, false, true).resolve(relative);
				}

				Url.prototype.resolve = function (relative) {
					return this.resolveObject(urlParse(relative, false, true)).format();
				};

				function urlResolveObject(source, relative) {
					if (!source) return relative;

					return urlParse(source, false, true).resolveObject(relative);
				}

				Url.prototype.resolveObject = function (relative) {
					if (util.isString(relative)) {
						const rel = new Url();
						rel.parse(relative, false, true);
						relative = rel;
					}

					const result = new Url();
					const tkeys = Object.keys(this);
					for (let tk = 0; tk < tkeys.length; tk++) {
						const tkey = tkeys[tk];
						result[tkey] = this[tkey];
					}

					// hash is always overridden, no matter what.
					// even href="" will remove it.
					result.hash = relative.hash;

					// if the relative url is empty, then there's nothing left to do here.
					if (relative.href === '') {
						result.href = result.format();
						return result;
					}

					// hrefs like //foo/bar always cut to the protocol.
					if (relative.slashes && !relative.protocol) {
						// take everything except the protocol from relative
						const rkeys = Object.keys(relative);
						for (let rk = 0; rk < rkeys.length; rk++) {
							const rkey = rkeys[rk];

							if (rkey !== 'protocol') result[rkey] = relative[rkey];
						}

						//urlParse appends trailing / to urls like http://www.example.com
						if (slashedProtocol[result.protocol] && result.hostname && !result.pathname) {
							result.path = result.pathname = '/';
						}

						result.href = result.format();
						return result;
					}

					if (relative.protocol && relative.protocol !== result.protocol) {
						// if it's a known url protocol, then changing
						// the protocol does weird things
						// first, if it's not file:, then we MUST have a host,
						// and if there was a path
						// to begin with, then we MUST have a path.
						// if it is file:, then the host is dropped,
						// because that's known to be hostless.
						// anything else is assumed to be absolute.
						if (!slashedProtocol[relative.protocol]) {
							const keys = Object.keys(relative);
							for (let v = 0; v < keys.length; v++) {
								const k = keys[v];
								result[k] = relative[k];
							}
							result.href = result.format();
							return result;
						}

						result.protocol = relative.protocol;

						if (!relative.host && !hostlessProtocol[relative.protocol]) {
							var relPath = (relative.pathname || '').split('/');
							while (relPath.length && !(relative.host = relPath.shift()));

							if (!relative.host) relative.host = '';

							if (!relative.hostname) relative.hostname = '';

							if (relPath[0] !== '') relPath.unshift('');

							if (relPath.length < 2) relPath.unshift('');

							result.pathname = relPath.join('/');
						} else {
							result.pathname = relative.pathname;
						}

						result.search = relative.search;
						result.query = relative.query;
						result.host = relative.host || '';
						result.auth = relative.auth;
						result.hostname = relative.hostname || relative.host;
						result.port = relative.port;

						// to support http.request
						if (result.pathname || result.search) {
							const p = result.pathname || '';
							const s = result.search || '';
							result.path = p + s;
						}

						result.slashes = result.slashes || relative.slashes;
						result.href = result.format();
						return result;
					}

					const isSourceAbs = result.pathname && result.pathname.charAt(0) === '/';
					const isRelAbs = relative.host || (relative.pathname && relative.pathname.charAt(0) === '/');
					let mustEndAbs = isRelAbs || isSourceAbs || (result.host && relative.pathname);
					const removeAllDots = mustEndAbs;
					let srcPath = (result.pathname && result.pathname.split('/')) || [];
					var relPath = (relative.pathname && relative.pathname.split('/')) || [];
					const psychotic = result.protocol && !slashedProtocol[result.protocol];

					// if the url is a non-slashed url, then relative
					// links like ../.. should be able
					// to crawl up to the hostname, as well.  This is strange.
					// result.protocol has already been set by now.
					// Later on, put the first path part into the host field.
					if (psychotic) {
						result.hostname = '';
						result.port = null;

						if (result.host) {
							if (srcPath[0] === '') srcPath[0] = result.host;
							else srcPath.unshift(result.host);
						}

						result.host = '';

						if (relative.protocol) {
							relative.hostname = null;
							relative.port = null;

							if (relative.host) {
								if (relPath[0] === '') relPath[0] = relative.host;
								else relPath.unshift(relative.host);
							}

							relative.host = null;
						}

						mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
					}

					if (isRelAbs) {
						// it's absolute.
						result.host = relative.host || relative.host === '' ? relative.host : result.host;
						result.hostname
							= relative.hostname || relative.hostname === '' ? relative.hostname : result.hostname;
						result.search = relative.search;
						result.query = relative.query;
						srcPath = relPath;
						// fall through to the dot-handling below.
					} else if (relPath.length) {
						// it's relative
						// throw away the existing file, and take the new path instead.
						if (!srcPath) srcPath = [];

						srcPath.pop();
						srcPath = srcPath.concat(relPath);
						result.search = relative.search;
						result.query = relative.query;
					} else if (!util.isNullOrUndefined(relative.search)) {
						// just pull out the search.
						// like href='?foo'.
						// Put this after the other two cases because it simplifies the booleans
						if (psychotic) {
							result.hostname = result.host = srcPath.shift();
							//occationaly the auth can get stuck only in host
							//this especially happens in cases like
							//url.resolveObject('mailto:local1@domain1', 'local2@domain2')
							var authInHost
								= result.host && result.host.indexOf('@') > 0 ? result.host.split('@') : false;

							if (authInHost) {
								result.auth = authInHost.shift();
								result.host = result.hostname = authInHost.shift();
							}
						}

						result.search = relative.search;
						result.query = relative.query;

						//to support http.request
						if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
							result.path
								= (result.pathname ? result.pathname : '') + (result.search ? result.search : '');
						}

						result.href = result.format();
						return result;
					}

					if (!srcPath.length) {
						// no path at all.  easy.
						// we've already handled the other stuff above.
						result.pathname = null;

						//to support http.request
						if (result.search) {
							result.path = '/' + result.search;
						} else {
							result.path = null;
						}

						result.href = result.format();
						return result;
					}

					// if a url ENDs in . or .., then it must get a trailing slash.
					// however, if it ends in anything else non-slashy,
					// then it must NOT get a trailing slash.
					let last = srcPath.slice(-1)[0];
					const hasTrailingSlash
						= ((result.host || relative.host || srcPath.length > 1)
							&& (last === '.' || last === '..'))
						|| last === '';

					// strip single dots, resolve double dots to parent dir
					// if the path tries to go above the root, `up` ends up > 0
					let up = 0;
					for (let i = srcPath.length; i >= 0; i--) {
						last = srcPath[i];

						if (last === '.') {
							srcPath.splice(i, 1);
						} else if (last === '..') {
							srcPath.splice(i, 1);
							up++;
						} else if (up) {
							srcPath.splice(i, 1);
							up--;
						}
					}

					// if the path is allowed to go above the root, restore leading ..s
					if (!mustEndAbs && !removeAllDots) {
						for (; up--; up) {
							srcPath.unshift('..');
						}
					}

					if (mustEndAbs && srcPath[0] !== '' && (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
						srcPath.unshift('');
					}

					if (hasTrailingSlash && srcPath.join('/').substr(-1) !== '/') {
						srcPath.push('');
					}

					const isAbsolute = srcPath[0] === '' || (srcPath[0] && srcPath[0].charAt(0) === '/');

					// put the host back
					if (psychotic) {
						result.hostname = result.host = isAbsolute ? '' : srcPath.length ? srcPath.shift() : '';
						//occationaly the auth can get stuck only in host
						//this especially happens in cases like
						//url.resolveObject('mailto:local1@domain1', 'local2@domain2')
						var authInHost
							= result.host && result.host.indexOf('@') > 0 ? result.host.split('@') : false;

						if (authInHost) {
							result.auth = authInHost.shift();
							result.host = result.hostname = authInHost.shift();
						}
					}

					mustEndAbs = mustEndAbs || (result.host && srcPath.length);

					if (mustEndAbs && !isAbsolute) {
						srcPath.unshift('');
					}

					if (!srcPath.length) {
						result.pathname = null;
						result.path = null;
					} else {
						result.pathname = srcPath.join('/');
					}

					//to support request.http
					if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
						result.path
							= (result.pathname ? result.pathname : '') + (result.search ? result.search : '');
					}

					result.auth = relative.auth || result.auth;
					result.slashes = result.slashes || relative.slashes;
					result.href = result.format();
					return result;
				};

				Url.prototype.parseHost = function () {
					let host = this.host;
					let port = portPattern.exec(host);

					if (port) {
						port = port[0];

						if (port !== ':') {
							this.port = port.substr(1);
						}

						host = host.substr(0, host.length - port.length);
					}

					if (host) this.hostname = host;
				};
			},
			{ './util': 18, 'punycode': 13, 'querystring': 16 },
		],
		18: [
			function (require, module, exports) {
				'use strict';

				module.exports = {
					isString: function (arg) {
						return typeof arg === 'string';
					},
					isObject: function (arg) {
						return typeof arg === 'object' && arg !== null;
					},
					isNull: function (arg) {
						return arg === null;
					},
					isNullOrUndefined: function (arg) {
						return arg == null;
					},
				};
			},
			{},
		],
		config: [
			function (require, module, exports) {
				module.exports = {
					fetchHistoryFor: 24 * 3600 * 60 * 1000,
					refetchSitesInterval: 2 * 24 * 3600 * 1000,
					cacheTTL: 24 * 3600 * 1000,
					fetchSitesInterval: null,
						// disabling temporarily while searching for ad dial source
						// page is password protected
						//httpPath: 'https://fvdspeeddial.com/fst',
						httpPath: '',
						debug: false,
				};
			},
			{},
		],
	},
	{},
	[1]
);
