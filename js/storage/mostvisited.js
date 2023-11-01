import Config from '../config.js';
import { Utils } from '../utils.js';
const MostVisitedModule = function (fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;
};

MostVisitedModule.prototype = {
	_cache: {},
	_shortCache: {},
	_maxRetrieveResultSet: 5000,

	getAvailableCount: function (interval, callback) {
		const { fvdSpeedDial } = this;

		this.getData(
			{
				interval: interval,
				type: 'host',
				count: this._maxRetrieveResultSet,
			},
			function (data) {
				callback(data.length);
			}
		);
	},

	isRemoved: function (id, callback) {
		const {
			fvdSpeedDial: { StorageSD },
		} = this;
		id = parseInt(id);
		StorageSD.dbSelect(
			'mostvisited_extended',
			{
				id,
				removed: 1,
			},
			function (results) {
				const exists = Boolean(results.rows.length);
				callback(exists);
			}
		);
	},

	deleteId: function (id, callback) {
		const that = this;

		this.updateData(
			id,
			{
				removed: 1,
			},
			function (result) {
				that.invalidateCache();
				callback(result);
			}
		);
	},

	restoreRemoved: function (callback) {
		const that = this;
		const {
			fvdSpeedDial: { StorageSD },
		} = this;

		StorageSD.dbUpdate(
			'mostvisited_extended',
			{ removed: 0 },
			{ key: 'removed', val: 1 },
			(results) => {
				that.invalidateCache();

				if (callback) {
					callback();
				}
			}
		);
	},

	updateData: function (id, data, callback) {
		const {
			fvdSpeedDial: { StorageSD },
		} = this;
		id = parseInt(id);

		const updateData = StorageSD._getUpdateData(data);
		const setData = updateData.dataObject;

		if (data.thumb) {
			setData.thumb_version = 2;
		}

		setData.id = id;

		StorageSD.dbUpdate('mostvisited_extended', setData, { key: 'id', val: id }, (results) => {
			if (callback) {
				callback({
					result: results.rowsAffected === 1,
				});
			}
		});
	},

	getExtendedData: function (cb) {
		const {
			fvdSpeedDial: { StorageSD },
		} = this;

		StorageSD.dbSelect('mostvisited_extended', {}, (results) => {
			const r = [];
			for (let i = 0; i !== results.rows.length; i++) {
				r.push(results.rows[i]);
			}
			cb(r);
		});
	},

	extendData: function (oldData = {}, callback) {
		const {
			fvdSpeedDial: { StorageSD },
		} = this;

		const data = Object.assign({}, oldData);
		data.id = parseInt(data.id);

		StorageSD.dbSelect('mostvisited_extended', { id: data.id }, (results) => {
			if (results.rows.length === 1) {
				const [dbData] = results.rows;

				data.title = dbData.title;
				data.thumb_source_type = dbData.thumb_source_type;
				data.thumb_url = dbData.thumb_url;
				data.screen_maked = dbData.screen_maked;
				data.thumb = dbData.thumb;
				data.screen_delay = dbData.screen_delay;
				data.auto_title = dbData.auto_title;
				data.thumb_width = dbData.thumb_width;
				data.thumb_height = dbData.thumb_height;
				data.get_screen_method = dbData.get_screen_method;
				data.thumb_version = dbData.thumb_version;
			}

			if (!data.thumb_source_type) {
				data.thumb_source_type = 'screen';
			}

			if (!data.thumb_url) {
				data.thumb_url = '';
			}

			if (!data.screen_maked) {
				data.screen_maked = 0;
			}

			if (!data.thumb) {
				data.thumb = '';
			}

			if (typeof data.screen_delay === 'undefined') {
				data.screen_delay = fvdSpeedDial.Prefs.get('sd.preview_creation_delay_default');
			}

			data.displayTitle = data.title ? data.title : data.auto_title ? data.auto_title : '';
			callback(data);
		});
	},

	invalidateCache: function (full) {
		// short cache invalidated completely
		this._shortCache = {};

		if (full) {
			this._cache = {};
		}
	},

	getById: function (id, interval, type, callback) {
		this.getData(
			{
				interval: interval,
				type: type,
				count: 1,
				cond: { id: id },
			},
			function (data) {
				for (let i = 0; i !== data.length; i++) {
					callback(data[i]);
					return;
				}
				callback(null);
			}
		);
	},

	getDataByHost: function (interval, host, callback) {
		this.getData(
			{
				interval: interval,
				type: 'url',
				count: this._maxRetrieveResultSet,
				cond: { host: host },
			},
			function (data) {
				callback(data);
			}
		);
	},

	// params: interval, type, count, cond
	getData: function (params, callback) {
		const { fvdSpeedDial } = this;
		const { Prefs, StorageSD } = fvdSpeedDial;

		const interval = params.interval;
		let type = params.type;
		const count = parseInt(params.count);
		const cond = params.cond;

		type = type || 'host';
		// check short cache
		const shortCacheResult = this._getFromShortCache([interval, type, count, cond]);

		if (shortCacheResult) {
			// found in short cache
			callback(shortCacheResult);
			return;
		}

		let needReloadCache = false;

		if (
			typeof this._cache[interval] === 'undefined' ||
			typeof this._cache[interval][type] === 'undefined'
		) {
			needReloadCache = true;
		} else if (
			new Date().getTime() - this._cache[interval].time >
			Prefs.get('sd.most_visited_cache_life_time')
		) {
			needReloadCache = true;
		}

		let that = this;
		const callbackCalled = false;

		const afterGetData = function (preData) {
			const result = [];

			if (cond) {
				const tmp = [];

				for (let i = 0; i !== preData.length; i++) {
					const d = preData[i];

					if (cond.host && cond.host !== d.host) {
						continue;
					}

					if (cond.id && cond.id !== d.id) {
						continue;
					}

					tmp.push(d);
				}
				preData = tmp;
			}

			if (preData.length === 0) {
				callback([]);
				return;
			}

			function __checkEnd() {
				that._setToShortCache([interval, type, count, cond], result);
				callback(result);
			}

			Utils.Async.arrayProcess(
				preData,
				function (d, apCallback) {
					if (d.url.indexOf('chrome-extension://') === 0) {
						return apCallback();
					}

					if (result.length >= count) {
						return __checkEnd();
					}

					try {
						StorageSD.isDenyUrl(d.url, function (deny) {
							if (!callbackCalled) {
								if (!deny) {
									that.isRemoved(d.id, function (removed) {
										if (!removed) {
											result.push(d);
										}

										apCallback();
									});
								} else {
									apCallback();
								}
							}
						});
					} catch (ex) {
						console.warn(ex);
						apCallback();
					}
				},
				function () {
					__checkEnd();
				}
			);
		};

		if (needReloadCache) {
			that = this;

			this.reloadCacheForInterval(interval, function () {
				afterGetData(that._cache[interval][type].slice(0, that._cache[interval][type].length));
			});
		} else {
			afterGetData(this._cache[interval][type].slice(0, this._cache[interval][type].length));
		}
	},

	reloadCacheForInterval: function (interval, reloadCacheForInterval_callback) {
		const period = this._intervalToDatePeriod(interval);
		const that = this;

		chrome.history.search(
			{
				text: '',
				startTime: period.start,
				endTime: period.end,
				maxResults: this._maxRetrieveResultSet,
			},
			function (items) {
				that._orderHistoryResults(items);
				const resultByHost = {};
				const resultByUrl = [];

				const workFinishCallback = function () {
					const resultByHostArray = [];

					for (const host in resultByHost) {
						resultByHostArray.push(resultByHost[host]);
					}

					that._cache[interval] = {
						url: resultByUrl,
						host: resultByHostArray,
						time: new Date().getTime(),
					};

					if (reloadCacheForInterval_callback) {
						reloadCacheForInterval_callback();
					}
				};

				for (let i = 0; i !== items.length; i++) {
					const item = items[i];
					const itemUrl = item.url.toLowerCase();

					if (itemUrl.indexOf('http') !== 0) {
						item.invalid = true;
					}

					if (itemUrl.indexOf('chrome-extension') === 0) {
						continue;
					}

					try {
						item.host = Utils.parseUrlHost(itemUrl).replace('www.', '');
					} catch (ex) {
						// console.warn(ex);
						continue;
					}

					if (typeof resultByHost[item.host] === 'undefined') {
						// add to hosts results
						resultByHost[item.host] = item;
						resultByHost[item.host].inGroup = 1;
						resultByHost[item.host].totalVisits = item.visitCount;
					} else {
						resultByHost[item.host].inGroup++;
						resultByHost[item.host].totalVisits += item.visitCount;
					}

					resultByUrl.push(item);
				}

				workFinishCallback();
			}
		);
	},

	_getFromShortCache: function (args) {
		const { fvdSpeedDial } = this;
		const { Prefs, StorageSD } = fvdSpeedDial;

		const key = JSON.stringify(args);

		if (typeof this._shortCache[key] === 'undefined') {
			return null;
		}

		const record = this._shortCache[key];

		// check timeouting
		if (new Date().getTime() - record.time > Prefs.get('sd.most_visited_cache_life_time')) {
			// timeouted
			delete this._shortCache[key];
			return null;
		}

		return this._shortCache[key].data;
	},

	_setToShortCache: function (args, data) {
		const key = JSON.stringify(args);

		this._shortCache[key] = {
			time: new Date().getTime(),
			data: data,
		};
	},

	_orderHistoryResults: function (items) {
		// order by visits count desc
		for (let i = 0; i < items.length - 1; i++) {
			for (let j = i; j !== items.length; j++) {
				if (items[i].visitCount < items[j].visitCount) {
					const tmp = items[j];

					items[j] = items[i];
					items[i] = tmp;
				}
			}
		}
	},

	_intervalToDatePeriod: function (interval) {
		switch (interval) {
			case 'all_time':
				return {
					start: 1,
					end: new Date().getTime(),
				};

			case 'month':
				return {
					start: new Date().getTime() - 30 * 24 * 60 * 60 * 1000,
					end: new Date().getTime(),
				};

			case 'week':
				return {
					start: new Date().getTime() - 7 * 24 * 60 * 60 * 1000,
					end: new Date().getTime(),
				};
		}
	},
};

export default MostVisitedModule;
