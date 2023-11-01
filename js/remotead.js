import Broadcaster from './_external/broadcaster.js';

const UPDATE_AD_INTERVAL = 24 * 3600 * 1000; // 7 days

const AD_URL = "https://s3.amazonaws.com/fvd-special/remotead/fvdsd_chrome2.json";

const USE_CACHE = true;

const console = {};

const messages = {
	donotdisplay: _("newtab_do_not_display_migrate"),
};

let supportedLanguages = [];
const adHTML = '<div>'
    +'<iframe></iframe>'
  +'</div>';

chrome.i18n.getAcceptLanguages(function (languageList) {
	supportedLanguages = languageList;
});

console.log = function () {
	const args = Array.prototype.slice.call(arguments);

	args.unshift("REMOTEAD:");
	window.console.log.apply(window.console, args);
};

console.error = function () {
	const args = Array.prototype.slice.call(arguments);

	args.unshift("REMOTEAD ERROR:");
	window.console.error.apply(window.console, args);
};

if (!USE_CACHE) {
	window.console.warn("Use REMOTEAD without cache!");
}

const storage = new function () {
	function _k(k) {
		return "__remotead." + k;
	}
	this.set = function (k, v) {
		localStorage[_k(k)] = v;
	};
	this.get = function (k) {
		return localStorage[_k(k)];
	};
};

function getUrlContents(url, callback) {
	const xhr = new XMLHttpRequest();

	xhr.open("GET", url);
	xhr.onload = function () {
		callback(xhr.responseText);
	};

	xhr.send(null);
}

function hasEqualElements(a, b) {
	for (let i = 0; i !== a.length; i++) {
		if (b.indexOf(a[i]) !== -1) {
			return true;
		}
	}

	return false;
}

function cloneObj(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function parseUrl(str, component) {

	const key = ['source', 'scheme', 'authority', 'userInfo', 'user', 'pass', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'fragment']; const ini = (this.php_js && this.php_js.ini)
      || {}; const mode = (ini['phpjs.parse_url.mode']
      && ini['phpjs.parse_url.mode'].local_value)
      || 'php'; let parser = {
		php: /^(?:([^:\/?#]+):)?(?:\/\/()(?:(?:()(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?()(?:(()(?:(?:[^?#\/]*\/)*)()(?:[^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/\/?)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/, // Added one optional slash to post-scheme to catch file:/// (should restrict this)
	};

	const m = parser[mode].exec(str); const uri = {}; let i = 14;

	while (i--) {
		if (m[i]) {
			uri[key[i]] = m[i];
		}
	}

	if (component) {
		return uri[component.replace('PHP_URL_', '').toLowerCase()];
	}

	if (mode !== 'php') {
		const name = (ini['phpjs.parse_url.queryKey']
          && ini['phpjs.parse_url.queryKey'].local_value)
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

}

/* tab listener */

Broadcaster.onMessage.addListener(function (msg) {
	if (msg.a === "remoteAD:ignore") {
		RemoteAD.ignoreAd(msg.id);
	}
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (changeInfo.status === "complete") {

		try {

			let host = parseUrl(tab.url, "host").toLowerCase();

			host = host.replace(/^www\./, "");

			RemoteAD.getADToShow({
				host: host,
			}, function (ad) {

				if (ad) {

					chrome.tabs.sendMessage(tabId, {
						a: "fvd:remotead:show",
						ad: ad,
						html: adHTML,
					});

				}

			});

		} catch (ex) {

			console.warn("Fail check tab", ex);

		}

	}

});

/*main*/

const RemoteAdClass = new function () {

	let _isFirstStart = null;

	function cacheTTL(cache) {
		return new Date().getTime() - cache.createDate;
	}

	function getADList(params, callback) {

		let cache = storage.get("adcache");

		const now = new Date().getTime();

		if (USE_CACHE && cache) {
			try {
				cache = JSON.parse(cache);

				if (cacheTTL(cache) > 0) {
					console.log("CACHE!");

					return callback(cache.data);
				}
			} catch (ex) {
				console.warn(ex);
			}
		}

		getUrlContents(AD_URL + "?c=" + (new Date().getTime()), function (text) {

			console.log(text);

			const data = JSON.parse(text);

			const cache = {
				createDate: new Date().getTime(),
				data: data,
			};

			storage.set("adcache", JSON.stringify(cache));

			callback(data);

		});

	}

	function isFirstStart() {
		if (_isFirstStart === null) {

			if (!storage.get("firstStartCompleted")) {
				_isFirstStart = true;
				storage.set("firstStartCompleted", true);
			} else {
				_isFirstStart = false;
			}

			console.log("Is first start?", _isFirstStart);

		}

		return _isFirstStart;

	}

	function canDisplayAD(ad) {

		const now = new Date().getTime();

		if (ad.languages) {
			if (!hasEqualElements(ad.languages, supportedLanguages)) {
				console.log("Language not supported", ad.languages,", not in list of ", supportedLanguages);
				return false;
			}
		}

		if (ad.newUserDelay) {

			const obtainedTime = parseInt(storage.get("ad.obtained_time." + ad.id));

			if (obtainedTime) {
				if (now - obtainedTime < ad.newUserDelay * 3600 * 1000) {
					console.log("Delay is active");

					return false;
				}
			} else if (isFirstStart()) {
				storage.set("ad.obtained_time." + ad.id, now);

				console.log("Need to wait delay for first start", ad.newUserDelay);

				return false;
			}

		}

		const adIgnored = !!parseInt(storage.get("ad.ignored." + ad.id));

		if (adIgnored) {
			console.log("AD is ignored by user");

			return false;
		}

		return true;

	}

	function getADToShow(params, callback) {

		if (typeof params === "function") {
			callback = params;
			params = {};
		}

		params = params || {};

		getADList(null, function (ads) {

			for (let i = 0; i !== ads.length; i++) {
				let ad = ads[i];

				if (params.nohosts && ad.hosts && ad.hosts.length > 0) {
					continue;
				}

				if (params.host && (!ad.hosts || ad.hosts.indexOf(params.host) === -1)) {
					continue;
				}

				ad = cloneObj(ad);

				ad.frameUrl += "?id=" + encodeURIComponent(ad.id);

				if (canDisplayAD(ad)) {
					callback(ad);
					return;
				} else {
					console.log("Can't show");
				}
			}

			callback(null);

		});

	}

	this.ignoreAd = function (adId) {
		storage.set("ad.ignored." + adId, 1);
	};

	this.getADToShow = function () {

		// always empty
		return [];

		//return getADToShow.apply( this, arguments );

	};


};

export default RemoteAdClass();
