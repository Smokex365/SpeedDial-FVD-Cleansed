import { Utils, _b, getDomainName, randomColor } from '../utils.js';
import debug from '../debug.js';
import { DIALS_TRASH_KEY, GROUPS_TRASH_KEY, defaultGroupGlobalIDs } from '../constants.js';
import { userStorageKey } from '../sync/user.js';

const escapeStringRegexp = function (string) {
	if (typeof string !== 'string') {
		throw new TypeError('Expected a string');
	}

	return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
};

const history = {
	exists: function (startTime, query, cb) {
		chrome.history.search(
			{
				text: query,
				startTime: startTime,
				maxResults: 1,
			},
			function (items) {
				debug.log('Search in the history for', query, 'found', items);
				cb(null, items.length > 0);
			}
		);
	},
	isHistoryAvailable: function () {
		return true;
	},
	isAnyHistoryFoundBefore: function (time, cb) {
		chrome.history.search(
			{
				maxResults: 1,
				text: '',
				endTime: time,
				startTime: 0,
			},
			function (items) {
				cb(null, items.length > 0);
			}
		);
	},
	search: function (startTime, query, cb) {
		chrome.history.search(
			{
				text: query,
				startTime: startTime,
				maxResults: 10000,
			},
			function (items) {
				debug.log('Search all items in the history for', query, 'found', items.length);
				cb(null, items);
			}
		);
	},
};

const config = {
	updateRequestInterval: 24 * 3600 * 1000,
	fetchHistoryFor: 24 * 3600 * 60 * 1000,
	minVisits: 4,
	maxDials: 8,
	disableUpdates: true,
};

class ServerDials {
	fvdSpeedDial;
		// serverUrl = 'http://fvdspeeddial.com/fst/dials.php';
		serverUrl = '';
			mapFunction = null;
	mapClass = null;
	installTime = null;
	userType = null;
	clientSoftware = null;
	country = null;
	listeners = [];
	avoidToExcludeGroups = [defaultGroupGlobalIDs.recommend];
	onDialsUpdate = {
		addListener: (fn) => {
			if (this.listeners.indexOf(fn) === -1) {
				this.listeners.push(fn);
			}
		},
		removeListener: (fn) => {
			const index = this.listeners.indexOf(fn);

			if (index !== -1) {
				this.listeners.splice(index, 1);
			}
		},
		callListeners: (...args) => {
			// const args = Array.prototype.slice.call(...args);
			this.listeners.forEach(function (listener) {
				listener.apply(window, args);
			});
		},
	};
	constructor(fvdSpeedDial) {
		this.fvdSpeedDial = fvdSpeedDial;
		const { StorageSD, Prefs, localStorage } = this.fvdSpeedDial;

		this.onDialsUpdate.addListener(function (dials) {
			let defaultGroupId;

			Utils.Async.chain([
				function (next) {
					StorageSD.syncGetGroupId('default', function (id) {
						defaultGroupId = id;
						next();
					});
				},
				function () {
					if (!defaultGroupId) {
						console.info("Can't create a dial from the server, default group isn't exist");
						return;
					}

					Utils.Async.arrayProcess(
						dials,
						function (dialData, next) {
							dialData.group_id = defaultGroupId;
							StorageSD.addDial(dialData, function (res) {
								if (!res) {
									return next();
								}

								dialData.id = res.id;
								ThumbMaker.getImageDataPath(
									{
										imgUrl: dialData.thumb_url,
										screenWidth: SpeedDial.getMaxCellWidth(),
									},
									function (dataUrl, thumbSize) {
										StorageSD.updateDial(
											res.id,
											{
												thumb: dataUrl,
												thumb_width: Math.round(thumbSize.width),
												thumb_height: Math.round(thumbSize.height),
											},
											next
										);
									}
								);
							});
						},
						function () {
							chrome.runtime.sendMessage({
								action: 'forceRebuild',
							});
						}
					);
				},
			]);
		});

		this.setMapClass(function () {
			const serverGroupsIds = {};

			this.init = function (serverDials, cb) {
				const serverGroupsMap = {};

				if (!serverDials) {
					serverDials = [];
				}

				const currentUserInfo = localStorage.getItem(userStorageKey);
				const trashedDials = Prefs.get(DIALS_TRASH_KEY, {});
				const trashedGroups = Prefs.get(GROUPS_TRASH_KEY, {});
				const currentUserDialsTrash = trashedDials[currentUserInfo?.user?.user_id] || [];
				const currentUserGroupsTrash = trashedGroups[currentUserInfo?.user?.user_id] || [];

				const filteredDials = serverDials.filter((dial) => !currentUserDialsTrash.includes(dial.globalId));

				const isNewRecommendDial = filteredDials.some((dial) => dial.group.globalId === defaultGroupGlobalIDs.recommend);

				filteredDials.forEach(function (serverDial) {
					serverGroupsMap[serverDial.group.globalId] = serverDial.group;
				});

				
				const serverGroupsGlobalIds = Object.keys(serverGroupsMap).filter((group) => !currentUserGroupsTrash.includes(group) 
				|| (group === defaultGroupGlobalIDs.recommend // to bring back recommend group 
					&& isNewRecommendDial)); // if there are any new recommend dials (not removed yet)

				Utils.Async.each(
					serverGroupsGlobalIds,
					function (serverGroupGlobalId, next) {
						const serverGroup = serverGroupsMap[serverGroupGlobalId];
						let id = 0;

						Utils.Async.chain([
							function (next2) {
								StorageSD.groupIdByGlobalId(serverGroup.globalId, function (_id) {
									if (!_id) {
										// debug.log('need to create group', serverGroup);
										StorageSD.groupAdd(
											{
												global_id: serverGroup.globalId,
												name: serverGroup.name,
											},
											function (res) {
												if (!res.id) {
													throw new Exception('Fail to create group ' + serverGroup.globalId);
												}

												debug.log('group created, id:', res.id);
												id = res.id;
												next2();
											}
										);
									} else {
										debug.log('group', serverGroup, 'already in db with id', _id);
										id = _id;
										next2();
									}
								});
							},
							function () {
								serverGroupsIds[serverGroup.globalId] = id;
								next();
							},
						]);
					},
					function () {
						debug.log('Init complete');
						cb();
					}
				);
			};
			this.map = function (serverDial) {
				const dial = {
					url: serverDial.url,
					display_url: serverDial.displayUrl,
					global_id: serverDial.globalId,
					title: serverDial.title,
					thumb_url: serverDial.previewUrl,
					group_id: serverGroupsIds[serverDial.group.globalId],
					group_globalId: serverDial.group.globalId,
				};

				if (serverDial.previewUrl) {
					dial.thumb_url = serverDial.previewUrl;
					dial.thumb_source_type = 'url';
				} else {
					dial.thumb_source_type = 'custom_preview';
					dial.preview_style = dial?.preview_style || randomColor();
					const hasProtocol = String(dial.display_url).includes('http://') || String(dial.display_url).includes('https://');
					const domainName = getDomainName(hasProtocol ? dial.display_url : `http://${dial.display_url}`).replace('www.', '').split('.').join(' ');
					const titleSplittedBySpace = dial?.title?.split(/[\s,-:_.]+/) || [];

					if (titleSplittedBySpace.length) {
						dial.previewTitle = titleSplittedBySpace.filter((word) => domainName.includes(word.toLowerCase())).join(' ')
							.replace(' com', '')
							.replace(' tv', '')
							.replace(' io', '')
							.replace(' net', '')
							.replace(' fr', '')
							.replace(' es', '')
							.replace(' ro', '')
							.replace(' ru', '')
							.replace(' us', '')
							.replace(' pl', '')
							.replace(' uk', '')
							.replace(' ca', '');
					} else {
						dial.previewTitle = domainName;
					}
				}

				return dial;
			};
		});
	}
	setConfig(key, value) {
		config[key] = value;
		return this;
	}
	setMapFunction(func) {
		this.mapFunction = func;
		return this;
	}
	setMapClass(mapClass) {
		this.mapClass = mapClass;
		return this;
	}
	setInstallTime(installTime) {
		this.installTime = installTime;
		return this;
	}
	setUserType(userType) {
		this.userType = userType;
		return this;
	}
	setClientSoftware(clientSoftware) {
		this.clientSoftware = clientSoftware;
		return this;
	}
	setCountry(country) {
		this.country = country;
	}
	getLastUpdateRequestTime() {
		return this.fvdSpeedDial.localStorage.getItem('_serverDialsLastUpdateTime');
	}
	setLastUpdateRequestTime() {
		this.fvdSpeedDial.localStorage.setItem('_serverDialsLastUpdateTime', new Date().getTime());
	}
	getExcludeDialsGlobalIds() {
		let globalIds = [];

		if (this.fvdSpeedDial.localStorage.getItem('_serverDialsExcludeGlobalIds')) {
			try {
				globalIds = JSON.parse(
					this.fvdSpeedDial.localStorage.getItem('_serverDialsExcludeGlobalIds')
				);
			} catch (ex) {
				console.warn(ex);
			}
		}

		if (!Array.isArray(globalIds)) {
			globalIds = [];
		}

		return globalIds;
	}
	addToExcludeDialsGlobalIds(globalIds) {
		const exclude = this.getExcludeDialsGlobalIds();

		for (let i = 0; i !== globalIds.length; i++) {
			if (exclude.indexOf(globalIds[i]) !== -1) {
				continue;
			}

			exclude.push(globalIds[i]);
		}
		this.fvdSpeedDial.localStorage.setItem('_serverDialsExcludeGlobalIds', JSON.stringify(exclude));
	}
	_mapResult(result, cb) {
		const self = this;

		Utils.Async.chain([
			function (next) {
				if (self.mapFunction) {
					result = result.map(self.mapFunction);
				}

				next();
			},
			function (next) {
				if (!self.mapClass) {
					return next();
				}

				const mapper = new self.mapClass();

				mapper.init(result, function () {
					result = result.map(mapper.map.bind(mapper));
					next();
				});
			},
			function () {
				cb(null, result);
			},
		]);
	}
	fetch(params, cb, excludeGlobalIds, ignoreHistory = false) {
		const self = this;

		params = params || {};

		if (this.clientSoftware) {
			params.clientSoftware = this.clientSoftware;
		}

		if (this.country) {
			params.country = this.country;
		}

		const exclude = excludeGlobalIds?.length > 0 ? excludeGlobalIds : this.getExcludeDialsGlobalIds();

		if (exclude.length && !params.dontExclude) {
			params.exclude = exclude.join(',');
		}

		const paramsArr = [];

		for (const k in params) {
			paramsArr.push(k + '=' + encodeURIComponent(params[k]));
		}
		const url = this.serverUrl + '?' + paramsArr.join('&');

		const fetchParams = {
			method: 'get',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json',
			},
		};

		fetch(new Request(url, fetchParams))
			.then((response) => {
				return response.json();
			})
			.then((dials) => {
				const toExcludeGlobalIdCondidates = Object.entries(dials).reduce((acc, [globalId, dial]) => {
					if (this.avoidToExcludeGroups.includes(dial[0].group.globalId)) {
						return acc;
					}
					
					return [...acc, globalId];
				}, []);
				self.addToExcludeDialsGlobalIds(Object.keys(toExcludeGlobalIdCondidates));
				debug.log('Loaded dials count: ', Object.keys(dials).length);

				fetch(new Request('https://geoloc.tempest.com', fetchParams))
					.then((res) => {
						return res.json();
					})
					.then((geo) => {
						dialPicker.pickDials(dials, geo.cc, ignoreHistory, (result) => {
							debug.log('dialPicker.pickDials:', 'dials', dials);
							debug.log('dialPicker.pickDials:', 'result', result);

							self._mapResult(result, function (err, result) {
								if (err) {
									return cb(err);
								}

								// debug.log('Fetching dials finished, found', result.length, 'dials');
								cb(null, result);
							});
						});
					});
			})
			.catch(function (ex) {
				console.info('Request failed', ex);
				cb(ex);
			});
	}
	fetchUpdates() {
		if (config.disableUpdates) {
			return debug.log('updates are disabled\n');
		}

		if (!this.installTime && !this.userType) {
			return debug.log("can't run dials update because neither installTime nor userType are set");
		}

		const self = this;
		const now = new Date().getTime();
		const lastUpdateTime = this.getLastUpdateRequestTime();

		if (!lastUpdateTime) {
			// just set last update time
			this.setLastUpdateRequestTime();
			return;
		}

		const elapsedTimeFromUpdate = now - lastUpdateTime;

		if (elapsedTimeFromUpdate < config.updateRequestInterval) {
			// not time
			return;
		}

		debug.log(
			'Elapsed from last update',
			elapsedTimeFromUpdate,
			'need interval',
			config.updateRequestInterval
		);
		const params = {};

		if (this.installTime) {
			params.installTime = this.installTime;
		}

		if (this.userType) {
			params.userType = this.userType;
		}

		debug.log('Start fetchin dials updates');
		this.fetch(params, function (err, dials) {
			self.setLastUpdateRequestTime();

			if (err) {
				return debug.log('Fail to fetch dials', err);
			}

			if (dials && dials.length) {
				self.onDialsUpdate.callListeners(dials);
			}
		});
	}
}

const dialPicker = {
	_getTheBestChoice: function (choices) {
		let selectedChoice;

		for (let i = 0; i !== choices.length; i++) {
			const choice = choices[i];

			if (choice.bestMatch) {
				selectedChoice = choice;
				break;
			}
		}
		return selectedChoice;
	},
	pickDials: function (dials, location, ignoreHistory, cb) {
		const self = this;
		let result = [];
		const addAnyWayDials = [];
		const dialListWithAllowedCountries = [];

		Object.keys(dials).forEach(function (globalId) {
			const dialChoices = dials[globalId];

			// if there is only one choice and it is the best match with addAnyWay = true, add it

			if (dialChoices.length === 1 && dialChoices[0].addAnyWay && dialChoices[0].bestMatch) {
				const dial = dialChoices[0];

				dial.globalId = globalId;
				// debug.log('Found anyway dial with one choice with the best match', dial);
				addAnyWayDials.push(dial);
				delete dials[globalId];
			}

			const dialsWithAllowedCountries = dialChoices.filter((dial) => dial.allowedCountries.length > 0) || [];

			dialsWithAllowedCountries.forEach((dial) => {
				if (dial.allowedCountries.includes(location)) {
					dial.globalId = globalId;
					dialListWithAllowedCountries.push(dial);
				}
			});
		});

		const historySearch = new HistorySearch();
		let checkHistory = false;
		const globalIds = Object.keys(dials);

		Utils.Async.chain([
			function (next) {
				if (!globalIds.length) {
					return next();
				}

				if (!history.isHistoryAvailable()) {
					return next();
				}

				checkHistory = true;
				const startInitTime = new Date().getTime();

				historySearch.init(function () {
					const endInitTime = new Date().getTime();
					const historyInitDuration = (endInitTime - startInitTime) / 1000;

					debug.log('History init duration:', historyInitDuration + 's');
					next();
				});
			},
			function (next) {
				if (checkHistory) {
					Utils.Async.each(
						globalIds,
						function (globalId, eachNext) {
							let choices = dials[globalId];
							// remove choices which used only in noHistory case

							choices = choices.filter(function (choice) {
								return !choice.noHistoryOnly;
							});
							historySearch.getChoices(choices, function (err, historyChoices) {

								if (err) {
									return debug.log('Fail to search in history', err, historyChoices);
								}

								if (historyChoices.length > 1) {
									debug.log(
										'history result for ',
										globalId,
										' is ambiguous, get the best choice, available',
										choices.length
									);
									const dial = self._getTheBestChoice(choices);

									if (dial) {
										dial.globalId = globalId;
										debug.log('Found the best choice(fallback from history)', dial);
										result.push(dial);
									}
								} else if (historyChoices.length === 1) {
									result.push({ ...historyChoices[0], globalId });
								}

								eachNext();
							});
						},
						function () {
							// order result and pick only needed amount of dials
							result.sort(function (a, b) {
								return b.orderValue - a.orderValue;
							});
							debug.log('Ordered picked dials list(' + result.length + '):');
							result.forEach(function (dial) {
								debug.log(dial.title, dial.orderValue);
							});
							debug.log('Slice dials to count', config.maxDials);
							result = result.slice(0, config.maxDials);
							next();
						}
					);
				} else {
					debug.log('Do not check history, add only the best choices of noHistory dials');
					// just add the best matches of each dial(if found)
					for (const globalId in dials) {
						const choices = dials[globalId];
						const dial = self._getTheBestChoice(choices);

						if (dial && dial.noHistory) {
							dial.globalId = globalId;
							debug.log('Found the best choice', dial);
							result.push(dial);
						}
					}
					next();
				}
			},
			function () {
				// add addAnyWay and with AllowedCountries to the end of the result
				result = addAnyWayDials.concat(dialListWithAllowedCountries).concat(result);
				cb(result);
			},
		]);
	},
};

function HistorySearch() {
	this.fetchHistoryFor = config.fetchHistoryFor;
	this.historyData = '';
}

HistorySearch.prototype.getMinHistoryTime = function () {
	return new Date().getTime() - this.fetchHistoryFor;
};

HistorySearch.prototype.isAnyHistoryFound = function (cb) {
	history.isAnyHistoryFoundBefore(this.getMinHistoryTime(), cb);
};

HistorySearch.prototype.init = function (cb) {
	const self = this;
	const minHistoryTime = this.getMinHistoryTime();

	debug.log('Fetch history since', new Date(minHistoryTime));
	history.search(minHistoryTime, '', function (err, items) {
		if (err) {
			return cb(err);
		}

		const lines = items.map(function (item) {
			return item.url + '|' + item.visitCount;
		});

		debug.log('History data URLs count:', lines.length);
		self.historyData = lines.join('\n').toLowerCase();
		debug.log('History data size:', self.historyData.length / 1024 / 1024, 'MB');
		cb(null);
	});
};

HistorySearch.prototype.getVisitsCountBySign = function (sign) {
	const regExp = new RegExp(escapeStringRegexp(sign) + '[^\\|]+\\|([0-9]+)', 'ig');
	let m;
	let visits = 0;

	do {
		m = regExp.exec(this.historyData);

		if (m) {
			visits += parseInt(m[1]);
		}
	} while (m);
	return visits;
};

HistorySearch.prototype.getChoices = function (dialsChoices, cb) {
	const self = this;
	const choices = [];
	const startLookUpTime = new Date().getTime();
	
	dialsChoices.forEach(function (dialChoice) {
		if (!dialChoice.checkHost) {
			// debug.log('checkHost is not provided for', dialChoice, 'skip');
			return;
		}
		
		const visitsCount = self.getVisitsCountBySign(dialChoice.checkHost);
		
		// debug.log('Count visits:', dialChoice.checkHost, visitsCount);
		
		if (visitsCount >= config.minVisits) {
			// this url was found in history, add dial for this url
			debug.log('Host', dialChoice.checkHost, 'found in the history, add choice', dialChoice);
			dialChoice.orderValue = visitsCount;
			choices.push(dialChoice);
		} else {
			// debug.log(
			// 'Host',
			// dialChoice.checkHost,
			// ' not found in the history(or visits count less than needed)'
			// );
		}
	});
	setTimeout(function () {
		cb(null, choices);
	}, 0);
};

export default ServerDials;
