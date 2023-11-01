import Broadcaster from '../_external/broadcaster.js';
const RecentlyClosedModule = function (fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;
	const { StorageSD, Prefs } = fvdSpeedDial;
	const that = this;
	this._tabs = [];
	this._tabsData = {};

	chrome.tabs.onUpdated.addListener(function (tabId) {
		chrome.tabs.get(tabId, function (tab) {
			// console.info('tabs.get', tab);
			that._tabsData[tabId] = tab;
		});
	});

	chrome.tabs.onRemoved.addListener(function (tabId) {
		try {
			if (that._tabsData[tabId]) {
				const tab = that._tabsData[tabId];

				if (!that.hasUrl(tab.url)) {
					// check for deny

					fvdSpeedDial.StorageSD.isDenyUrl(tab.url, function (deny) {
						tab.displayTitle = tab.title;
						tab.deny = deny;
						that._tabs.unshift(tab);
						that._tabs.slice(0, Prefs.get('sd.max_recently_closed_records'));
						// send message that found new closed tab
						Broadcaster.sendMessage({
							action: 'foundRecentlyClosed',
							needActiveTab: true,
						});
					});
				}

				delete that._tabsData[tabId];
			}
		} catch (ex) {
			console.warn(ex);
		}
	});
};

RecentlyClosedModule.prototype = {
	getAvailableCount: function (callback) {
		callback(this._tabs.length);
	},

	checkDenyAll: function (callback) {
		const that = this;
		const tabsToRemove = [];
		const tabsLength = this._tabs.length;

		for (let i = 0; i !== tabsLength; i++) {
			(function (i) {
				Storage.isDenyUrl(that._tabs[i].url, function (deny) {
					that._tabs[i].deny = !!deny;

					if (i === tabsLength - 1) {
						for (let j = 0; j !== tabsToRemove.length; j++) {
							const index = that._tabs.indexOf(tabsToRemove[j]);

							if (index !== -1) {
								that._tabs.splice(index, 1);
							}
						}

						if (callback) {
							callback();
						}
					}
				});
			})(i);
		}

		if (tabsLength === 0) {
			if (callback) {
				callback();
			}
		}
	},
	hasUrl: function (url) {
		for (let i = 0; i !== this._tabs.length; i++) {
			if (this._tabs[i].url === url) {
				return true;
			}
		}

		return false;
	},

	remove: function (id, callback) {
		for (let i = 0; i !== this._tabs.length; i++) {
			if (this._tabs[i].id === id) {
				this._tabs.splice(i, 1);
				break;
			}
		}

		if (callback) {
			callback();
		}
	},

	removeAll: function (callback) {
		this._tabs = [];

		if (callback) {
			callback();
		}
	},

	getData: function (params, callback) {
		const count = params.count;
		const result = [];

		for (let i = 0; i !== this._tabs.length && result.length < count; i++) {
			if (this._tabs[i].deny) {
				continue;
			}

			result.push(this._tabs[i]);
		}

		callback(result);
	},

	get: function (id, callback) {
		for (let i = 0; i !== this._tabs.length; i++) {
			if (this._tabs[i].id === id) {
				callback(this._tabs[i]);
				break;
			}
		}
	},
};

export default RecentlyClosedModule;
