import Prefs from './prefs.js';
import Config from './config.js';

export function _b(v) {
	if (typeof v === 'boolean') {
		return v;
	}

	return v === 'true';
}

export function _isb(v) {
	if (typeof v === 'boolean') {
		return true;
	}

	return v === 'true' || v === 'false';
}

export function _r(v) {
	if (_isb(v)) {
		return _b(v);
	}

	return v;
}

export function _array(list) {
	const result = [];

	for (let i = 0; i !== list.length; i++) {
		result.push(list[i]);
	}

	return result;
}

if (typeof window !== 'undefined') {
	Element.prototype.insertAfter = function (newElem, targetElem) {
		if (this.lastChild === targetElem) {
			this.appendChild(newElem);
		} else {
			this.insertBefore(newElem, targetElem.nextSibling);
		}
	};
}

export function FVDEventEmitter() {
	const callbacks = [];

	this.addListener = function (listener) {
		callbacks.push(listener);
	};

	this.removeListener = function (listener) {
		const index = callbacks.indexOf(listener);

		if (index !== -1) {
			callbacks.splice(index, 1);
		}
	};

	this.callListeners = function () {
		const args = arguments;
		const toRemove = [];

		callbacks.forEach(function (callback) {
			try {
				callback.apply(window, args);
			} catch (ex) {
				console.warn(ex);
				toRemove.push(callback);
			}
		});
		toRemove.forEach(function (callback) {
			const index = callbacks.indexOf(callback);

			if (index > -1) {
				callbacks.splice(index, 1);
			}
		});
	};
}

export const Utils = {
	measureTextCanvases: {},
	hostRegExp: /^https?:\/\/(?:[^@:/]*@)?([^:/]+)/,

	getRandomString: function (length) {
		length = length || 5;
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

		for (let i = 0; i < length; i++)
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	},

	debounce: function (func, wait, immediate) {
		let timeout;

		return function () {
			const context = this;
			const args = arguments;
			const later = function () {
				timeout = null;

				if (!immediate) func.apply(context, args);
			};
			const callNow = immediate && !timeout;

			clearTimeout(timeout);
			timeout = setTimeout(later, wait);

			if (callNow) func.apply(context, args);
		};
	},

	measureText: function (canvasFontDefinition, text) {
		let canvas;

		if (this.measureTextCanvases[canvasFontDefinition]) {
			canvas = this.measureTextCanvases[canvasFontDefinition];
		} else {
			canvas = document.createElement('canvas');
			this.measureTextCanvases[canvasFontDefinition] = canvas;
		}

		const ctx = canvas.getContext('2d');

		ctx.font = canvasFontDefinition;
		return ctx.measureText(text).width;
	},

	getChromeVersion: function () {
		const match = navigator.userAgent.match(/Chrome\/([0-9\.]+)/i);

		if (!match) {
			return null;
		}

		return match[1];
	},

	isActiveTab: function (cb) {
		chrome.tabs.getCurrent(function (tab) {
			if (tab) {
				cb(tab.active);
			}
		});
	},

	getRandomInt: function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},

	clone: function (obj) {
		return JSON.parse(JSON.stringify(obj));
	},

	shuffle: function (inputArr) {
		const valArr = [];
		let k = '';
		let i = 0;
		let strictForIn = false;
		let populateArr = [];

		for (k in inputArr) {
			// Get key and value arrays
			if (inputArr.hasOwnProperty(k)) {
				valArr.push(inputArr[k]);

				if (strictForIn) {
					delete inputArr[k];
				}
			}
		}
		valArr.sort(function () {
			return 0.5 - Math.random();
		});

		// BEGIN REDUNDANT
		this.php_js = this.php_js || {};
		this.php_js.ini = this.php_js.ini || {};
		// END REDUNDANT
		strictForIn
			= this.php_js.ini['phpjs.strictForIn']
			&& this.php_js.ini['phpjs.strictForIn'].local_value
			&& this.php_js.ini['phpjs.strictForIn'].local_value !== 'off';
		populateArr = strictForIn ? inputArr : populateArr;

		for (i = 0; i < valArr.length; i++) {
			// Repopulate the old array
			populateArr[i] = valArr[i];
		}

		return strictForIn || populateArr;
	},

	getUserCountry: function (cb) {
		const xhr = new XMLHttpRequest();

		xhr.open('GET', 'https://everhelper.pro/spec/country.php');
		xhr.onload = function () {
			cb(xhr.responseText);
		};
		xhr.send(null);
	},

	getUserClientDetails: function (cb) {
		const xhr = new XMLHttpRequest();

		xhr.open('GET', 'https://everhelper.pro/spec/country.php?detailed=1');
		xhr.onload = function () {
			cb(null, JSON.parse(xhr.responseText));
		};
		xhr.send(null);
	},

	hasEqualElements: function (a, b) {
		for (let i = 0; i !== a.length; i++) {
			if (b.indexOf(a[i]) !== -1) {
				return true;
			}
		}

		return false;
	},

	validateText: function (type, text) {
		switch (type) {
			case 'email':
				const re
					= /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

				return re.test(text);
				break;
		}
	},

	getQueryValue: function (variable) {
		const query = window.location.hash.substring(1);
		const vars = query.split('&');

		for (let i = 0; i < vars.length; i++) {
			const pair = vars[i].split('=');

			if (decodeURIComponent(pair[0]) === variable) {
				return decodeURIComponent(pair[1]);
			}
		}

		return null;
	},

	arrayDiff: function (a1, a2) {
		return a1.filter(function (i) {
			return !(a2.indexOf(i) > -1);
		});
	},

	urlToCompareForm: function (url) {
		url = url.toLowerCase();
		url = url.replace(/https?:\/\//i, '');
		url = url.replace(/^www\./i, '');
		url = url.replace(/\/+$/i, '');

		return url;
	},

	isValidUrl: function (url) {
		if (url.indexOf('file:///') === 0) {
			return true;
		}

		try {
			const parsed = this.parseUrl(url);

			if (!parsed.host) {
				return false;
			}

			/*
        if( parsed.host.indexOf(".") == -1 ){
          return false;
        }
        */

			if (parsed.host.length < 2) {
				return false;
			}

			return true;
		} catch (ex) {
			console.warn(ex);
			return false;
		}
	},

	getMainDomain: function (domain) {
		const parts = String(domain || '').split('.');
		let result = '';
		const countParts = parts.length;

		if (parts.length > 1) {
			result = parts[countParts - 2] + '.' + parts[countParts - 1];
		} else {
			result = parts[countParts - 1];
		}

		return result;
	},

	isIdenticalUrls: function (url1, url2) {
		url1 = this.urlToCompareForm(url1);
		url2 = this.urlToCompareForm(url2);

		return url1 === url2;
	},

	isIdenticalHosts: function (host1, host2, params) {
		params = params || {};

		if (params.ignoreSubDomains) {
			host1 = this.getMainDomain(host1);
			host2 = this.getMainDomain(host2);
		}

		host1 = this.urlToCompareForm(host1);
		host2 = this.urlToCompareForm(host2);

		return host1 === host2;
	},

	httpBuildQuery: function (data) {
		const arr = [];

		for (const k in data) {
			arr.push(k + '=' + encodeURIComponent(data[k]));
		}
		return arr.join('&');
	},

	buildUrlFromParsed: function (parsed) {
		let url = parsed.scheme + '://';

		if (parsed.user && parsed.pass) {
			url += parsed.user + ':' + parsed.pass + '@';
		} else if (parsed.user) {
			url += parsed.user + '@';
		}

		url += parsed.host;

		if (parsed.path) {
			url += parsed.path;
		}

		if (parsed.query) {
			url += '?' + parsed.query;
		}

		if (parsed.fragment) {
			url += '#' + parsed.query;
		}

		return url;
	},

	typeToExt: function (type) {
		switch (type) {
			case 'image/png':
				return 'png';
			case 'image/jpeg':
				return 'jpg';
			case 'image/gif':
				return 'gif';
		}
	},

	b64toBlob: function (b64Data, contentType, sliceSize) {
		contentType = contentType || '';
		sliceSize = sliceSize || 512;

		const byteCharacters = atob(b64Data);
		const byteArrays = [];

		for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
			const slice = byteCharacters.slice(offset, offset + sliceSize);

			const byteNumbers = new Array(slice.length);

			for (let i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}

			const byteArray = new Uint8Array(byteNumbers);

			byteArrays.push(byteArray);
		}

		return new Blob(byteArrays, { type: contentType });
	},

	dataURIToBlob: function (url) {
		url = url.replace(/^data:/, '');
		const tmp = url.split(';');
		const contentType = tmp[0];

		url = tmp[1].split(',')[1];
		return this.b64toBlob(url, contentType);
	},

	parseUrlHost: function (url) {
		const m = url.match(this.hostRegExp);

		if (!m) {
			throw new Error('Fail to parse host');
		}

		return m[1];
	},

	parseUrl: function (str, component) {
		const key = [
			'source',
			'scheme',
			'authority',
			'userInfo',
			'user',
			'pass',
			'host',
			'port',
			'relative',
			'path',
			'directory',
			'file',
			'query',
			'fragment',
		];
		const ini = (this.php_js && this.php_js.ini) || {};
		const mode = (ini['phpjs.parse_url.mode'] && ini['phpjs.parse_url.mode'].local_value) || 'php';
		let parser = {
			php: /^(?:([^:\/?#]+):)?(?:\/\/()(?:(?:()(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?()(?:(()(?:(?:[^?#\/]*\/)*)()(?:[^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
			strict:
				/^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
			loose:
				/^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/\/?)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/, // Added one optional slash to post-scheme to catch file:/// (should restrict this)
		};

		const m = parser[mode].exec(str);
		const uri = {};
		let i = 14;

		while (i--) {
			if (m[i]) {
				uri[key[i]] = m[i];
			}
		}

		if (component) {
			return uri[component.replace('PHP_URL_', '').toLowerCase()];
		}

		if (mode !== 'php') {
			const name
				= (ini['phpjs.parse_url.queryKey'] && ini['phpjs.parse_url.queryKey'].local_value)
				|| 'queryKey';

			parser = /(?:^|&)([^&=]*)=?([^&]*)/g;
			uri[name] = {};
			uri[key[12]].replace(parser, function ($0, $1, $2) {
				if ($1) {
					uri[name][$1] = $2;
				}
			});
		}

		delete uri.source;
		return uri;
	},

	scrollToElem: function (elem) {
		const viewportHeight = window.innerHeight;
		const currentTopStart = document.body.scrollTop;
		const currentTopEnd = currentTopStart + viewportHeight;

		const elemOffset = this.getOffset(elem);

		if (elemOffset.top > currentTopStart && elemOffset.top + elem.offsetHeight < currentTopEnd) {
			return; // no need scroll
		}

		let scrollAmount = 0;

		if (elemOffset.top < currentTopStart) {
			scrollAmount = elemOffset.top;
		} else {
			scrollAmount = elemOffset.top + elem.offsetHeight - viewportHeight;
		}

		document.body.scrollTop = scrollAmount;
	},

	getBoundingClientRect: function (elem) {
		const r = elem.getBoundingClientRect();

		return {
			top: r.top + window.scrollY,
			bottom: r.bottom + window.scrollY,
			left: r.left + window.scrollX,
			right: r.right + window.scrollX,
			width: r.width,
			height: r.height,
		};
	},

	getOffset: function (obj) {
		let curleft = 0;
		let curtop = 0;

		if (obj.offsetParent) {
			do {
				curleft += obj.offsetLeft;
				curtop += obj.offsetTop;
			} while ((obj = obj.offsetParent));
		}

		return {
			left: curleft,
			top: curtop,
		};
	},

	isChildOf: function (elem, parent) {
		while (true) {
			if (elem === parent) {
				return true;
			}

			if (elem.parentNode) {
				elem = elem.parentNode;
			} else {
				return false;
			}
		}
	},

	copyToClipboard: function (text) {
		const clipboardholder = document.createElement('textarea');

		clipboardholder.style.width = '0px';
		clipboardholder.style.height = '0px';
		clipboardholder.style.opacity = 0;
		document.body.appendChild(clipboardholder);
		clipboardholder.value = text;
		clipboardholder.select();
		document.execCommand('Copy');
		document.body.removeChild(clipboardholder);
	},

	ucfirst: function (str) {
		const firstLetter = str.slice(0, 1);

		return firstLetter.toUpperCase() + str.substring(1);
	},

	cropLength: function (str, len) {
		if (str.length <= len) {
			return str;
		}

		return str.substring(0, len) + '...';
	},

	setScreenPreview: function (elem, screen, nocache, norepeat, data) {
		if (typeof screen === 'string' && screen.indexOf('filesystem:') === 0) {
			if (nocache) {
				screen += '?' + nocache;
			}
		}

		elem.style.background = '';
		elem.style.background = 'url(' + screen + ')';
		//elem.style.backgroundSize = "contain";
		elem.style.backgroundSize = '100%';
		elem.style.backgroundPosition = 'top left';
		elem.style.backgroundRepeat = 'no-repeat';
		try {
			if (
				typeof data === 'object'
				&& ((data.thumb_width === 30 && data.thumb_height === 30)
					|| (typeof data.thumbSize === 'object'
						&& data.thumbSize.width === 30
						&& data.thumbSize.height === 30))
			) {
				elem.classList.add('preview-image-undefined');
			}
		} catch (ex) {
			console.warn(ex);
		}
	},

	removeScreenPreview: function (elem) {
		if (elem) {
			elem.style.background = '';
			elem.style.backgroundSize = '';
			elem.style.backgroundPosition = '';
			elem.style.backgroundRepeat = '';
		}
	},

	setUrlPreview: function (elemParams, picParams, nocache) {
		if (typeof picParams.url === 'string' && picParams.url.indexOf('filesystem:') === 0) {
			if (nocache) {
				picParams.url += '?' + nocache;
			}
		}

		this.Async.chain([
			function (callback2) {
				if (!picParams.size) {
					const img = new Image();

					img.onload = function () {
						picParams.size = {
							width: img.width,
							height: img.height,
						};

						callback2();
					};
					img.onerror = function () {
						picParams.size = {
							width: 0,
							height: 0,
						};

						callback2();
					};

					img.src = picParams.url;
				} else {
					callback2();
				}
			},

			function () {
				elemParams.elem.style.background = 'url(' + picParams.url + ')';
				elemParams.elem.style.backgroundPosition = 'center center';

				if (
					picParams.size.width
					&& picParams.size.height
					&& picParams.size.width < elemParams.size.width
					&& picParams.size.height < elemParams.size.height
				) {
					elemParams.elem.style.backgroundSize = '';
				} else {
					elemParams.elem.style.backgroundSize = 'contain';
				}

				elemParams.elem.style.backgroundRepeat = 'no-repeat';
			},
		]);
	},

	imageUrlToDataUrlOld: function (url, callback, format, quality) {
		const img = new Image();

		img.onload = function () {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');

			canvas.width = img.width;
			canvas.height = img.height;

			ctx.drawImage(img, 0, 0, img.width, img.height);

			if (img.width * img.height < 1024 * 1024) {
				// limitations due to chrome bug
				// older limitations were 300x300, but now it seems to work with larger pictures
				format = 'image/png';
			}

			format = format || 'image/jpeg';
			quality = quality || 90;

			callback(canvas.toDataURL(format, quality), {
				width: img.width,
				height: img.height,
			});
		};
		img.onerror = function () {
			callback(null);
		};
		img.setAttribute('crossorigin', 'anonymous');
		img.src = url;
	},

	toDataUrl: async blob => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.addEventListener('error', () => reject(false), { passive: true });
			reader.addEventListener('load', () => resolve(reader.result), { passive: true });
			reader.readAsDataURL(blob);
		});
	},

	imageUrlToDataUrl: function (url, callback, format, quality) {
		const { toDataUrl } = this;
		
		const size  = {};

		fetch(url)
			.then(response => {
				return response.blob();
			})
			.then(blob => {
				return createImageBitmap(blob);
			})
			.then(imageBitmap => {
				const { width, height } = imageBitmap;
				size.width = width;
				size.height = height;
				// create canvas
				const canvas = new OffscreenCanvas(width, height);
				// get 2D context
				const context = canvas.getContext('2d');
				// import the bitmap onto the canvas
				context.drawImage(imageBitmap, 0, 0, width, height);
				format = format || 'image/png';
				quality = quality || 90;
				return canvas.convertToBlob({ type: format, quality });
			})
			.then(blob => {
				return toDataUrl(blob);
			})
			.then(dataUrl => {
				// console.info('dataUrl', dataUrl.substring(0, 50), '...');
				callback(dataUrl, size);
			})
			.catch(function (ex) {
				console.warn('Request failed', ex);
				callback(null, {});
			});
	},

	getUrlContent: function (url, callback) {
		const req = new XMLHttpRequest();

		req.open('GET', url);
		req.onload = function () {
			callback(req.responseText);
		};
		req.onerror = function () {
			callback(null);
		};
		req.send();
	},

	cacheTitle: {},
	getTitleReq: false,
	getTitleForUrl: function (url, callback, abort) {
		const that = this;

		if (that.cacheTitle[url]) {
			return callback(this.cacheTitle[url]);
		}

		if (
			abort
			&& typeof that.getTitleReq === 'object'
			&& typeof that.getTitleReq.abort === 'function'
		) {
			try {
				that.getTitleReq.abort();
			} catch (ex) {
				console.warn(ex);
			}
		}

		const req = new XMLHttpRequest();

		req.open('GET', url);
		req.onload = function () {
			const tmp = document.createElement('div');

			tmp.innerHTML = req.responseText;
			try {
				const title = tmp.getElementsByTagName('title')[0];

				that.cacheTitle[url] = title.textContent;
				callback(title.textContent);
			} catch (ex) {
				console.warn(ex);
				callback(null);
			}
		};
		req.onerror = function () {
			callback(null);
		};

		try {
			req.send();
		} catch (ex) {
			console.info(ex);
		}

		if (abort) that.getTitleReq = req;
	},

	setAutoTextForTextField: function (elem, text) {
		elem.addEventListener(
			'focus',
			function () {
				if (elem.hasAttribute('autoText')) {
					elem.removeAttribute('autoText');
					elem.value = '';
				}
			},
			false
		);

		elem.addEventListener(
			'blur',
			function () {
				if (elem.value === '') {
					elem.setAttribute('autoText', 1);
					elem.value = text;
				}
			},
			false
		);

		if (elem.value === '') {
			elem.setAttribute('autoText', 1);
			elem.value = text;
		}
	},

	Async: {
		chain: function (callbacksChain) {
			const dataObject = {};
			const f = function () {
				if (callbacksChain.length > 0) {
					const nextCallback = callbacksChain.shift();

					nextCallback(f, dataObject);
				}
			};

			f();
		},
		each: function (dataArray, callback, finishCallback) {
			let itemsProcessed = 0;

			dataArray.forEach(function (item) {
				callback(
					item,
					function () {
						itemsProcessed++;

						if (itemsProcessed === dataArray.length) {
							finishCallback();
						}
					},
					itemsProcessed
				);
			});
		},
		eachSeries: function (dataArray, callback, finishCallback) {
			return this.arrayProcess(dataArray, callback, finishCallback, true);
		},
		arrayProcess: function (dataArray, callback, finishCallback, noTimeout) {
			let iterationsWithoutTimeout = 0;
			const f = function (i) {
				if (i >= dataArray.length) {
					finishCallback();
				} else {
					if (noTimeout) {
						callback(dataArray[i], function () {
							f(i + 1);
						});
					} else {
						if (iterationsWithoutTimeout < 20) {
							iterationsWithoutTimeout++;
							callback(dataArray[i], function () {
								f(i + 1);
							});
						} else {
							iterationsWithoutTimeout = 0;
							setTimeout(function () {
								callback(dataArray[i], function () {
									f(i + 1);
								});
							}, 0);
						}
					}
				}
			};

			f(0);
		},

		cc: function (stateFunction) {
			const rf = function (result) {
				if (result === 'break') {
					return;
				}

				stateFunction(rf);
			};

			stateFunction(rf);
		},
	},

	UI: {
		showAndHide: function (elem, timeout) {
			timeout = timeout | 3000;
			elem.style.opacity = 1;
			setTimeout(function () {
				elem.style.opacity = 0;
			}, timeout);
		},
	},

	Opener: {
		modificators: [],
		addModificator: function (fn) {
			if (this.modificators.indexOf(fn) === -1) {
				this.modificators.push(fn);
			}
		},
		removeModificator: function (fn) {
			const index = this.modificators.indexOf(fn);

			if (index >= 0) {
				this.modificators.splice(index, 1);
			}
		},
		prepareUrl: function (url) {
			this.modificators.forEach(function (modificator) {
				const modifiedUrl = modificator(url);

				if (modifiedUrl) {
					url = modifiedUrl;
				}
			});
			return url;
		},
		asClicked: function (url, def, event) {
			let action = def;

			if (event.button === 0) {
				// ctrlKey for win/linux, metaKey for mac
				if (event.ctrlKey || event.metaKey) {
					if (event.shiftKey) {
						//action = "new";
						action = 'window';
					} else {
						action = 'background';
					}
				} else if (event.shiftKey) {
					action = 'new';
				}
			} else if (event.button === 1) {
				action = 'background';
			}

			this.byAction(action, url);

			return action;
		},

		byAction: function (action, url) {
			switch (action) {
				case 'current':
					this.currentTab(url);
					break;
				case 'new':
					this.newTab(url);
					break;
				case 'background':
					this.backgroundTab(url);
					break;
				case 'window':
					this.newWindow(url);
					break;
			}
		},

		activeTab: function (url) {
			url = this.prepareUrl(url);
			chrome.tabs.query(
				{
					active: true,
				},
				function (tabs) {
					chrome.tabs.update(tabs[0].id, {
						url: url,
					});
				}
			);
		},

		currentTab: function (url) {
			url = this.prepareUrl(url);
			chrome.tabs.getCurrent(function (tab) {
				chrome.tabs.update(tab.id, {
					url: url,
				});
			});
		},

		newTab: function (url) {
			url = this.prepareUrl(url);
			chrome.tabs.create({
				url: url,
				active: true,
			});
		},

		backgroundTab: function (url) {
			url = this.prepareUrl(url);
			chrome.tabs.create({
				url: url,
				active: false,
			});
		},

		newWindow: function (url) {
			url = this.prepareUrl(url);

			chrome.windows.create({
				url: url,
			});
		},

		incognitoTab: function (url) {
			url = this.prepareUrl(url);
			let win;

			Utils.Async.chain([
				function (next) {
					chrome.windows.getCurrent(function (currentWindow) {
						// check if current window is incognito
						if (currentWindow.incognito) {
							win = currentWindow;
							next();
						} else {
							// looking for an incognito window
							chrome.windows.getAll(function (windows) {
								console.log('existing windows', windows);
								for (let i = 0; i !== windows.length; i++) {
									if (windows[i].incognito) {
										win = windows[i];
										break;
									}
								}
								next();
							});
						}
					});
				},
				function () {
					if (win) {
						chrome.tabs.create({
							windowId: win.id,
							url: url,
							active: true,
						});
					} else {
						// incognito window not found, let's create it
						chrome.windows.create({
							url: url,
							incognito: true,
							focused: true,
						});
					}
				},
			]);
		},
	},

	hexToRGBA: function (hex, opacity) {
		return (
			'rgba('
			+ (hex = hex.replace('#', ''))
				.match(new RegExp('(.{' + hex.length / 3 + '})', 'g'))
				.map(function (l) {
					return parseInt(hex.length % 2 ? l + l : l, 16);
				})
				.concat(opacity || 1)
				.join(',')
			+ ')'
		);
	},

	reloadAllTimeout: false,

	reloadAllPages: function (timeout, except) {
		const ts = this;

		timeout = timeout || 0;

		if (typeof except !== 'object') except = [except || 'none'];

		clearTimeout(ts.reloadAllTimeout);

		ts.reloadAllTimeout = setTimeout(function () {
			ts.reloadAddonPages();
		}, timeout);
	},

	reloadAddonPages: function (callback) {
		const tabs = [];
		const extId = chrome.runtime.getURL('');

		chrome.tabs.query({}, function (allTabs) {
			for (const i in allTabs) {
				if (allTabs[i].url === 'chrome://newtab/' || allTabs[i].url.indexOf(extId) !== -1) {
					tabs.push(allTabs[i]);

					try {
						console.info('Reload', allTabs[i]);
						chrome.tabs.reload(allTabs[i].id);
					} catch (ex) {
						console.warn(ex);
					}
				}
			}
		});
	},

	getInstallVersion: function (fvdSpeedDial) {
		return parseInt(String(fvdSpeedDial.localStorage['installVersion']).split('.').join('')) || 0;
	},

	getCurrentVersion: function () {
		return chrome.runtime.getManifest().version || 0;
	},

	releaseNotes: function (fvdSpeedDial, mode) {
		const { Prefs } = fvdSpeedDial;

		if (mode) {
			chrome.action.setIcon({ path: 'images/icons/new-128x128.png' });
			Prefs.set('sd.browser_action_mode', 'new');
		} else {
			chrome.action.setIcon({ path: 'images/icons/64x64.png' });
			Prefs.set('sd.browser_action_mode', 'standard');
		}
	},

	openReleaseNotes: function () {
		let url;
		let ru = false;
		const acepted = ['ru', 'by', 'kz', 'uz', 'uk'];

		chrome.i18n.getAcceptLanguages(locations => {
			for (const loc of locations) {
				for (const ac of acepted) {
					if (loc.indexOf(ac) !== -1) {
						ru = true;
						break;
					}
				}
			}

			if (ru) {
				url = 'https://everhelper.pro/release-notes-ru.php';
			} else {
				url = 'https://everhelper.pro/release-notes-en.php';
			}

			Utils.Opener.newTab(url);
			Utils.releaseNotes(fvdSpeedDial, false);
		});
	},

	browserAction: function (fvdSpeedDial) {
		const { Prefs, StorageSD } = fvdSpeedDial;

		chrome.action.onClicked.addListener(function (tab) {
			if (Prefs.get('sd.browser_action_mode') === 'new') {
				Utils.openReleaseNotes();
			} else {
				if (tab._ignore) {
					return;
				}

				const action = Prefs.get('sd.main_button_action');

				if (action === 'sd_in_new_tab') {
					Utils.openSpeedDialSingle('newtab');
				} else if (action === 'sd_in_active_tab') {
					Utils.openSpeedDialSingle('active');
				} else if (action === 'add_site_to_sd') {
					StorageSD.groupsList(function (groups) {
						let groupId = null;

						for (let i = 0; i !== groups.length; i++) {
							if (groups[i].global_id === 'default') {
								groupId = groups[i].id;
								break;
							}
						}

						if (!groupId && groups.length) {
							groupId = groups[0].id;
							return;
						}

						if (!groupId) {
							return;
						}

						chrome.tabs.query(
							{
								active: true,
							},
							function (tabs) {
								fvdSpeedDial.ContextMenu.addTabToSpeedDial(tabs[0], groupId);
							}
						);
					});
				}
			}
		});
	},

	openSpeedDialSingle: function (tabPosition) {
		let foundTabId = null;
		let foundTabIndex;

		Utils.Async.chain([
			function (chainCallback) {
				chrome.tabs.query(
					{
						url: Config.NEWTAB_URL,
					},
					function (tabs) {
						if (tabs.length > 0) {
							foundTabId = tabs[0].id;
							foundTabIndex = tabs[0].index;
						}

						chainCallback();
					}
				);
			},
			function (chainCallback) {
				chrome.tabs.query(
					{
						url: chrome.runtime.getURL('newtab.html'),
					},
					function (tabs) {
						if (tabs.length > 0) {
							foundTabId = tabs[0].id;
						}

						chainCallback();
					}
				);
			},
			function () {
				if (!foundTabId) {
					if (tabPosition === 'active') {
						Utils.Opener.activeTab('newtab.html#force-display');
					} else if (tabPosition === 'newtab') {
						chrome.tabs.create({
							url: 'newtab.html#force-display',
							active: true,
						});
					}
				} else {
					chrome.tabs.update(foundTabId, {
						active: true,
					});
				}
			},
		]);
	},

	getFavicon: function (url) {
		let favicon = '';
		try {
			const parts = this.parseUrl(url);

			if (parts && parts.host) {
				favicon = `${Config.FAVICON_SERVICE}${parts.host}`;
			}
		} catch (ex) {}
		return favicon;
	},
};

export const DD = function () {};

const _dragAndDropElem = function (params) {
	const that = this;

	let placeHolder = null;
	const _preserveMargins = {
		left: null,
		top: null,
	};

	this._elem = params.elem;
	this._ddTargets = params.targets;
	this._initParams = params;
	this._lastMousePos = null;
	this._ddTargetsList = null;
	this._lastMouseMoveEvent = null;
	// to prevent dd when user mousedown and scroll without mouse move
	this._mouseMoved = false;

	function _elParent() {
		return that._elem.parentNode;
	}

	function _createPlaceHolder() {
		placeHolder = document.createElement('div');
		placeHolder.style.width = that._elem.offsetWidth + 'px';
		placeHolder.style.height = that._elem.offsetHeight + 'px';
		placeHolder.className = that._elem.className;

		_elParent().insertBefore(placeHolder, that._elem);
	}

	function _removePlaceHolder() {
		_elParent().removeChild(placeHolder);
	}

	// methods
	this.event = function (type) {
		const args = [];

		for (let i = 1; i < arguments.length; i++) {
			args.push(arguments[i]);
		}

		if (that._initParams['callback' + type]) {
			that._initParams['callback' + type].apply(window, args);
		}
	};

	this.init = function () {
		this._elem.addEventListener(
			'mousedown',
			function (event) {
				if (event.button !== 0) {
					return;
				}

				that._mouseMoved = false;
				that._draggingStartCursorPosition = that._mousePos(event);
				document.addEventListener('mousemove', that._mouseMove, false);
				document.addEventListener('mouseup', that._mouseUp, false);
				document.addEventListener('mouseout', that._cancelIfNoMove, false);
				that.event('MouseDownReal');
			},
			false
		);
	};

	this.adjustPos = function (mouse) {
		let i;

		mouse = mouse || that._lastMousePos;
		that._lastMousePos = mouse;

		let marginLeft = mouse.x - that._draggingStartCursorPosition.x;
		let marginTop = mouse.y - that._draggingStartCursorPosition.y;

		that._elem.style.webkitTransition = 'none';

		const newMargins = that._initParams.changePos(marginLeft, marginTop, that);

		marginLeft = newMargins.left;
		marginTop = newMargins.top;

		if (marginLeft !== false) {
			that._elem.style.marginLeft = marginLeft + 'px';
		}

		if (marginTop !== false) {
			that._elem.style.marginTop = marginTop + 'px';
		}

		const elemOffset = Utils.getOffset(that._elem);

		const centerPos = {
			left: elemOffset.left + that._elem.offsetWidth / 2,
			top: elemOffset.top + that._elem.offsetHeight / 2,
		};

		const nowDraggedOn = [];
		const nowDraggedOnElems = [];

		for (i = 0; i !== that._ddTargetsList.length; i++) {
			const targetOffset = Utils.getOffset(that._ddTargetsList[i]);

			if (
				centerPos.left >= targetOffset.left
				&& centerPos.left <= targetOffset.left + that._ddTargetsList[i].offsetWidth
				&& centerPos.top >= targetOffset.top
				&& centerPos.top <= targetOffset.top + that._ddTargetsList[i].offsetHeight
			) {
				// save cursor position rel to dragged elem
				const cursor = {
					left: centerPos.left - targetOffset.left,
					top: centerPos.top - targetOffset.top,
				};

				const draggedOnData = {
					cursor: cursor,
					el: that._ddTargetsList[i],
					width: that._ddTargetsList[i].offsetWidth,
					height: that._ddTargetsList[i].offsetHeight,
				};

				nowDraggedOn.push(draggedOnData);
				nowDraggedOnElems.push(draggedOnData.el);
			}
		}

		for (i = 0; i !== nowDraggedOn.length; i++) {
			if (params.alwaysPropatateDragOn) {
				that.event('Dragon', nowDraggedOn[i].el, nowDraggedOn[i]);
			} else {
				if (that._nowDraggedOn.indexOf(nowDraggedOn[i].el) === -1) {
					that.event('Dragon', nowDraggedOn[i].el, nowDraggedOn[i]);
				}
			}
		}

		for (i = 0; i !== that._nowDraggedOn.length; i++) {
			if (nowDraggedOnElems.indexOf(that._nowDraggedOn[i]) === -1) {
				that.event('Dragleave', that._nowDraggedOn[i]);
			}
		}

		that._nowDraggedOn = nowDraggedOnElems;
		return {
			left: marginLeft,
			top: marginTop,
		};
	};

	this._mouseMove = function (event) {
		that._mouseMoved = true;
		event = event || that._lastMouseMoveEvent;
		that._lastMouseMoveEvent = event;

		if (params.usePlaceHolder) {
			if (!that._startEventSent) {
				_createPlaceHolder();
				that._elem.style.position = 'absolute';

				if (that._elem.style.marginTop) {
					_preserveMargins.top = that._elem.style.marginTop;
				}

				if (that._elem.style.marginLeft) {
					_preserveMargins.left = that._elem.style.marginLeft;
				}

				that._startEventSent = true;
				that.event('Start');
			}
		}

		if (!that._nowDragging) {
			that._nowDragging = true;

			that.event('MouseDown');
		}

		if (that._ddTargetsList === null) {
			// search elements for drag
			const targets = document.querySelectorAll('*[dd_class~=' + that._ddTargets + ']');

			that._ddTargetsList = [];
			for (let i = 0; i !== targets.length; i++) {
				if (targets[i] === that._elem) {
					continue;
				}

				that._ddTargetsList.push(targets[i]);
			}
		}

		const mouse = that._mousePos(event);
		const margins = that.adjustPos(mouse);

		if (!params.usePlaceHolder) {
			if (!that._startEventSent) {
				if (margins.left !== 0 || margins.top !== 0) {
					that._startEventSent = true;
					that.event('Start');
				}
			}
		}
	};

	this._cancelIfNoMove = function () {
		if (!that._mouseMoved) {
			that._mouseUp();
		}
	};

	this._mouseUp = function () {
		if (params.usePlaceHolder) {
			_removePlaceHolder();
			that._elem.style.position = '';
		}

		document.removeEventListener('mousemove', that._mouseMove, false);
		document.removeEventListener('mouseup', that._mouseUp, false);
		try {
			document.removeEventListener('mouseout', that._cancelIfNoMove, false);
		} catch (ex) {
			console.warn(ex);
		}

		that._elem.style.webkitTransition = '';

		if (_preserveMargins.top) {
			that._elem.style.marginTop = _preserveMargins.top;
		} else {
			that._elem.style.marginTop = '';
		}

		if (_preserveMargins.left) {
			that._elem.style.marginLeft = _preserveMargins.left;
		} else {
			that._elem.style.marginLeft = '';
		}

		if (params.constantStyle) {
			for (const k in params.constantStyle) {
				that._elem.style[k] = params.constantStyle[k];
			}
		}

		that._nowDragging = false;
		that._startEventSent = false;
		that._ddTargetsList = null;

		that.event('End', { elements: that._ddTargetsList });
	};

	this._mousePos = function (event) {
		let scrollTop = document.body.scrollTop;

		if (this._initParams.scrollingNotMean) {
			scrollTop = 0;
		}

		return {
			x: event.x,
			y: event.y + scrollTop,
		};
	};

	this.init();
};

_dragAndDropElem.prototype = {
	// options
	_initParams: null,
	_elem: null,
	_ddTargets: null,

	// privates
	_ddTargetsList: null,
	_nowDragging: false,
	_draggingStartCursorPosition: { x: null, y: null },
	_nowDraggedOn: [],
	_startEventSent: false,
};

DD.prototype = {
	create: function (params) {
		return new _dragAndDropElem(params);
	},
};
