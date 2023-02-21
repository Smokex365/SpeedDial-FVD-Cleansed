import { Utils } from './utils.js';

const _HistoryComplete = function (parent, elem) {
	this._parent = parent;
	this._elem = elem;
	this._init();
};

_HistoryComplete.prototype = {
	_elem: null,
	_completionContainer: null,
	_maxResults: 25,
	_focusedIndex: -1,
	_completeElements: [],
	_document: null,
	_bodyClickListener: null,

	destroy: function () {
		try {
			this._completionContainer.parentNode.removeChild(this._completionContainer);
		} catch (ex) {
			console.warn(ex);
		}
	},

	_displayed: function () {
		if (this._completionContainer && this._completionContainer.getAttribute('appear') === 1) {
			return true;
		}

		return false;
	},

	_init: function () {
		this._document = this._elem.ownerDocument;
		const that = this;

		this._elem.addEventListener(
			'blur',
			function () {
				that._hideContainer();
			},
			false
		);

		this._elem.addEventListener('keydown', function (event) {
			if (event.keyCode === 40) {
				// down
				if (that._displayed()) {
					that._focusedIndex++;

					if (that._focusedIndex >= that._completeElements.length) {
						that._focusedIndex = 0;
					}

					that._refreshFocus();
					event.stopPropagation();
					event.preventDefault();
					that._applyFocused(true);
				} else {
					let v = that._elem.value.trim();

					if (!v) {
						v = null;
					}

					that._searchInHistory(v, function (results) {
						if (results.set.length === 0) {
							that._hideContainer();
						} else {
							that._displayContainer(results.set);
						}
					});
				}
			} else if (event.keyCode === 38) {
				// up
				if (that._displayed()) {
					that._focusedIndex--;

					if (that._focusedIndex < 0) {
						that._focusedIndex = that._completeElements.length - 1;
					}

					that._refreshFocus();
					event.stopPropagation();
					event.preventDefault();
					that._applyFocused(true);
				}
			} else if (event.keyCode === 13) {
				if (that._displayed() && that._focusedIndex !== -1) {
					that._applyFocused();
					event.stopPropagation();
					event.preventDefault();
				}
			}
		});

		this._elem.addEventListener('keyup', function (event) {
			if ([13, 38, 40].indexOf(event.keyCode) !== -1) {
				event.stopPropagation();
				return;
			}

			const text = that._elem.value.trim();

			if (!text) {
				that._hideContainer();
			} else {
				that._searchInHistory(text, function (results) {
					if (results.set.length === 0) {
						that._hideContainer();
					} else {
						that._displayContainer(results.set);
					}
				});
			}
		});
	},

	_focusElement: function (index) {
		this._focusedIndex = index;
		this._refreshFocus();
	},

	_dropElementsFocus: function () {
		this._focusedIndex = -1;
		this._refreshFocus();
	},

	_applyFocused: function (preventHide) {
		try {
			const focused = this._completeElements[this._focusedIndex];

			this._elem.value = focused.getAttribute('suggestion');

			if (!preventHide) {
				this._hideContainer();
			}
		} catch (ex) {
			console.warn(ex);
		}
	},

	_refreshFocus: function () {
		let focusedElem = null;

		for (let i = 0; i !== this._completeElements.length; i++) {
			if (this._focusedIndex === i) {
				this._completeElements[i].setAttribute('focused', 1);
				focusedElem = this._completeElements[i];
			} else {
				this._completeElements[i].removeAttribute('focused');
			}
		}

		if (focusedElem) {
			const visbleStart = this._getContainer().scrollTop;
			const visibleEnd = visbleStart + this._getContainer().offsetHeight;
			const startElem = focusedElem.offsetTop;
			const endElem = startElem + focusedElem.offsetHeight;
			let needScrollDelta = 0;

			if (endElem > visibleEnd) {
				needScrollDelta = endElem - visibleEnd;
			}

			if (startElem < visbleStart) {
				needScrollDelta = startElem - visbleStart;
			}

			if (needScrollDelta !== 0) {
				this._getContainer().scrollTop += needScrollDelta;
			}
		}
	},

	_searchInHistory: function (query, callback) {
		const that = this;
		this._parent.searchInHistory(query, that._maxResults, function (results) {
			callback({
				query: query,
				set: results,
			});
		});
	},

	_getContainer: function () {
		if (this._completionContainer === null) {
			this._completionContainer = this._document.createElement('div');
			this._completionContainer.className = 'historyComplete';
			// set position to elem
			const elemPos = Utils.getOffset(this._elem);

			this._completionContainer.style.left = elemPos.left + 'px';
			this._completionContainer.style.top = elemPos.top + this._elem.offsetHeight + 'px';
			this._completionContainer.style.width = this._elem.offsetWidth - 2 + 'px';
			this._completionContainer.setAttribute('appear', 0);

			this._document.body.appendChild(this._completionContainer);
		}

		return this._completionContainer;
	},

	_displayContainer: function (results) {
		const that = this;

		that._focusedIndex = -1;
		const tmp = this._getContainer().cloneNode(true);

		while (tmp.firstChild) {
			tmp.removeChild(tmp.firstChild);
		}

		this._completeElements = [];

		for (let i = 0; i !== results.length; i++) {
			const favicon = this._document.createElement('img');

			favicon.setAttribute('src', Utils.getFavicon(results[i].url));

			const elem = this._document.createElement('div');

			elem.className = 'elem';
			const urlDiv = this._document.createElement('div');

			urlDiv.className = 'url';
			const titleDiv = this._document.createElement('div');

			titleDiv.className = 'title';
			urlDiv.innerHTML = results[i].url;

			titleDiv.appendChild(favicon);
			const titleTextDiv = this._document.createElement('div');

			titleTextDiv.innerHTML = results[i].title;
			titleDiv.appendChild(titleTextDiv);

			elem.appendChild(titleDiv);
			elem.appendChild(urlDiv);

			elem.setAttribute('suggestion', results[i].rawurl);

			(function (i) {
				elem.addEventListener(
					'mousedown',
					function () {
						that._applyFocused();
					},
					false
				);

				elem.addEventListener(
					'mouseover',
					function () {
						that._focusElement(i);
					},
					false
				);
				elem.addEventListener(
					'mouseout',
					function () {
						that._dropElementsFocus();
					},
					false
				);
			})(i);

			this._completeElements.push(elem);

			tmp.appendChild(elem);
		}

		const oldContainer = this._getContainer();

		oldContainer.parentNode.replaceChild(tmp, oldContainer);

		this._completionContainer = tmp;

		tmp.setAttribute('appear', 1);

		if (!this._bodyClickListener) {
			this._bodyClickListener = function () {
				that._hideContainer();
			};
			this._document.body.addEventListener('click', this._bodyClickListener, false);
		}
	},

	_hideContainer: function () {
		this._getContainer().setAttribute('appear', 0);

		if (this._bodyClickListener) {
			this._document.body.removeEventListener('click', this._bodyClickListener);
			this._bodyClickListener = null;
		}
	},
};

const HistoryComplete = function () {};

HistoryComplete.prototype = {
	get _cache() {
		return this.__cache;
	},
	set _cache(v) {
		this.__cache = v;
	},
	__cache: null,
	_maxCacheRecords: 2000,

	create: function (elem) {
		this.clearHistoryCache();
		return new _HistoryComplete(this, elem);
	},

	clearHistoryCache: function () {
		this._cache = null;
	},

	getHistory: function (callback) {
		const that = this;

		if (this._cache === null) {
			chrome.history.search(
				{
					text: '',
					maxResults: that._maxCacheRecords * 2,
					endTime: new Date().getTime(),
				},
				function (_results) {
					// filter results
					const results = [];

					for (let i = 0; i !== _results.length && results.length < that._maxCacheRecords; i++) {
						const r = _results[i];
						const urllower = r.url.toLowerCase();

						if (
							urllower.indexOf('chrome') === 0
							|| urllower.indexOf('file:///') === 0
							|| urllower.indexOf('data:') === 0
						) {
							continue;
						}

						let host = '';

						try {
							host = Utils.parseUrlHost(urllower).replace(/^www\./, '');
						} catch (ex) {
							console.warn(ex);
						}

						results.push({
							url: r.url,
							title: r.title,
							_lurl: urllower,
							_ltitle: r.title.toLowerCase(),
							host: host,
							visitCount: r.visitCount,
						});
					}

					results.sort(function (a, b) {
						return b.visitCount - a.visitCount;
					});

					that._cache = results;

					callback(results);
				}
			);
		} else {
			callback(this._cache);
		}
	},

	searchInHistory: function (query, maxResults, callback) {
		// * old variant
		this.getHistory(function (data) {
			let results = [];

			if (query === null) {
				for (let i = 0; i !== data.length && results.length < maxResults; i++) {
					results.push({
						url: data[i].url,
						title: data[i].title,
						rawurl: data[i].url,
					});
				}
				callback(results);
				return;
			}

			query = query.toLowerCase();

			let queryHost = query;

			queryHost = queryHost
				.replace(/^https:\/\//, '')
				.replace(/^http:\/\//, '')
				.replace(/www\./, '');
			const preMatches = [];

			for (let i = 0; i !== data.length; i++) {
				let points = 0;
				let foundByQueryHost = false;

				if (data[i]._lurl.indexOf(query) !== -1) {
					points = 1;

					if (data[i].host && data[i].host.indexOf(query) === 0) {
						points += 1;
					}
				} else if (data[i]._ltitle.indexOf(query) !== -1) {
					points = 1;
				} else if (data[i].host.indexOf(queryHost) === 0) {
					points = 1;
					foundByQueryHost = true;
				}

				if (points) {
					const item = {};

					item.rawurl = data[i].url;
					item.points = points;
					item.visitCount = data[i].visitCount;

					if (foundByQueryHost) {
						item.title = data[i].title;
						item.url = data[i].url.replace(
							new RegExp('^(https?://(?:www.)?)(' + queryHost + ')', 'ig'),
							function (full, pre, match) {
								return pre + '<b>' + match + '</b>';
							}
						);
					} else {
						item.url = data[i].url.replace(new RegExp(query, 'ig'), function (match) {
							return '<b>' + match + '</b>';
						});

						item.title = data[i].title.replace(new RegExp(query, 'ig'), function (match) {
							return '<b>' + match + '</b>';
						});
					}

					preMatches.push(item);
				}
			}

			preMatches.sort(function (a, b) {
				if (b.points === a.points) {
					return b.visitCount - a.visitCount;
				}

				return b.points - a.points;
			});

			results = preMatches.slice(0, maxResults);
			callback(results);
		});
	},
};

export default new HistoryComplete();
