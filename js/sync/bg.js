import Broadcaster from '../_external/broadcaster.js';
import { Utils, _b } from '../utils.js';
import AppLog from '../log.js';
import { EventType } from '../types.js';

const MemoryCache = {
	_data: {},
	set: function (key, value, timeoutValue) {
		timeoutValue = timeoutValue || 300000;
		const self = this;
		let obj = {};


		if (this._data[key]) {
			try {
				clearTimeout(this._data[key].timeout);
			} catch (ex) {
			}
			obj = this._data[key];
		} else {
			this._data[key] = obj;
		}

		obj.timeout = setTimeout(function () {
			self._data[key] = null;
		}, timeoutValue);
		obj.value = value;
	},
	del: function (key) {
		if (!this._data[key]) {
			return;
		}

		try {
			clearTimeout(this._data[key].timeout);
		} catch (ex) {
		}
		delete this._data[key];
	},
	get: function (key) {
		if (!this._data[key]) {
			return null;
		}

		return this._data[key].value;
	},
};

const TempStore = {
	_key: function (id) {
		return '_tmp_store_' + id;
	},
	pop: function (id) {
		const value = MemoryCache.get(this._key(id));

		if (!value) {
			return null;
		}

		MemoryCache.del(this._key(id));
		return [value[0]].join('');
	},
	append: function (id, value) {
		let currentValue = MemoryCache.get(this._key(id));

		if (!currentValue) {
			currentValue = [];
		}

		currentValue.push(value);
		// save temp data for 10 minutes
		MemoryCache.set(this._key(id), currentValue, 600000);
	},
};

const Sync = function (fvdSpeedDial) {
	const { Prefs, UserInfoSync } = fvdSpeedDial;
	const fvdSynchronizerName = 'EverSync';
	const fvdSynchronizerIds = [
		// Chrome Webstore EverSync ID
		'iohcojnlgnfbmjfjfkbhahhmppcggdog',
		// Opera addons EverSync ID
		'ffhogmjbkahkkpjpjmeppoegnjhpopmc',
	];

	let active = false;
	const port = null;
	const responsePorts = {
		['workerPort']: {
			active: false,
			port: null,
			pendingRequests: [],
		},
	};
	let lastTransactionId = 0;
	let lastRequestId = 0;
	const pendingRequests = [];
	const PENDING_REQUESTS_TIMEOUT = 1000 * 5 * 60; // max life time of pending requests

	function setActivity(newActivity, currentPort) {
		currentPort.active = newActivity;
		active = newActivity;

		if (typeof window === 'object') {
			Broadcaster.sendMessage({ action: 'sync:activitystatechanged' });
		}
	}

	this.clearExpiredRequests = () => {
		const now = new Date().getTime();

		Object.entries(responsePorts).forEach(function (key, portData) {
			const ids = [];

			portData.pendingRequests.forEach(function (request) {
				if (now - request.time >= PENDING_REQUESTS_TIMEOUT) {
					ids.push(request.id);
				}
			});

			ids.forEach(function (id) {
				removePendingRequest(key, id);
			});
		});
	};

	function removePendingRequest(currentPortKey, id) {
		let index = -1;

		for (let i = 0; i !== responsePorts[currentPortKey].pendingRequests.length; i++) {
			if (responsePorts[currentPortKey].pendingRequests[i].id === id) {
				index = i;
				break;
			}
		}

		if (index !== -1) {
			responsePorts[currentPortKey].pendingRequests.splice(index, 1);
		}
	}

	function requestWithCallback(currentPort, data, callback) {
		if (!currentPort?.port || (!currentPort?.port && !responsePorts['workerPort']?.port)) {
			return callback(null);
		}
		
		lastRequestId++;
		data.requestId = lastRequestId;
		
		const toRequestPort = currentPort || responsePorts['workerPort'];
		
		if (!toRequestPort.pendingRequests) {
			toRequestPort.pendingRequests = [];
		}
		
		toRequestPort.pendingRequests.push({
			id: lastRequestId,
			callback: callback,
			time: new Date().getTime(),
		});

		try {
			toRequestPort.port.postMessage(data);
			return true;
		} catch (ex) {
			console.warn(ex);
			return callback(null);
		}
	}

	function getCurrentPortByRequestId(requestId) {
		// eslint-disable-next-line max-len
		const currentPortKey = Object.keys(responsePorts).find((portDataKey) => responsePorts[portDataKey].pendingRequests.find((request) => request.id === requestId));

		if (currentPortKey && responsePorts[currentPortKey].active) {
			return currentPortKey;
		}

		const withoutRequestIdPortKey = Object.keys(responsePorts).find((portKey) => responsePorts[portKey].active);
		return withoutRequestIdPortKey || responsePorts['workerPort'];
	}

	function callRequestResponse(requestId, data) {
		const currentPortKey = getCurrentPortByRequestId(requestId);

		if (responsePorts[currentPortKey]) {
			responsePorts[currentPortKey].pendingRequests.forEach(function (request) {
				if (request.id === requestId) {
					request.callback(data);
				}
			});
		}


		removePendingRequest(currentPortKey, requestId);
	}

	this.isActive = function () {
		return Object.values(responsePorts).some((port) => port.active);
	};

	this.hasDataToSync = function (requestId, callback) {
		const currentPortKey = getCurrentPortByRequestId(requestId);

		let currentPort = null;

		if (responsePorts[currentPortKey] && responsePorts[currentPortKey].active) {
			currentPort = responsePorts[currentPortKey];
		} else {
			const activePort = Object.values(responsePorts).find((acPort) => acPort.active);

			if (activePort) {
				currentPort = activePort;
			} else {
				currentPort = responsePorts['workerPort'];
			}
		}

		requestWithCallback(
			currentPort,
			{
				action: 'hasToSyncData',
			},
			function (response) {
				callback(response && response.has);
			}
		);
	};

	this.getAccountInfo = function (currentPort, callback) {
		requestWithCallback(currentPort, {
			action: 'getAccountInfo',
		},
		function (response) {
			callback(response && response.info);
		}
		);
	};

	this.groupSyncChanged = function (groupId, requestId, callback) {
		// need sync group as new and all it dials.
		fvdSpeedDial.StorageSD.getGroup(groupId, function (group) {
			if (group.sync === 1) {
				Utils.Async.chain([
					function (chainCallback) {
						// remove data from sync
						Sync.removeSyncData(
							requestId,
							{
								category: ['deleteGroups'],
								data: group.global_id,
							},
							function () {
								chainCallback();
							}
						);
					},

					function (chainCallback) {
						fvdSpeedDial.StorageSD.listDialsIdsByGroup(groupId, function (dials) {
							Utils.Async.arrayProcess(
								dials,
								function (dial, arrayProcessCallback) {
									Sync.removeSyncData(
										requestId,
										{
											category: ['deleteDials'],
											data: dial.global_id,
										},
										arrayProcessCallback
									);
								},
								function () {
									chainCallback();
								}
							);
						});
					},

					function (chainCallback) {
						// add data to sync
						// need to sync all groups
						fvdSpeedDial.StorageSD.groupsRawList({}, function (groups) {
							Utils.Async.arrayProcess(
								groups,
								function (group, arrayProcessCallback) {
									if (group.sync === 1) {
										Sync.addDataToSync(
											{
												category: ['groups', 'newGroups'],
												data: group.global_id,
												syncAnyWay: true,
											},
											arrayProcessCallback,
											requestId
										);
									} else {
										arrayProcessCallback();
									}
								},
								function () {
									chainCallback();
								}
							);
						});
					},
					function (chainCallback) {
						Sync.addDataToSync(
							{
								category: ['specialActions'],
								data: 'merge_group:' + groupId + ':' + group.global_id,
							},
							chainCallback,
							requestId
						);
					},
					function () {
						if (callback) {
							callback();
						}
					},
				]);
			} else if (group.sync === 0) {
				Utils.Async.chain([
					function (chainCallback) {
						// remove data from sync
						Sync.removeSyncData(
							requestId,
							{
								category: ['groups', 'newGroups'],
								data: group.global_id,
							},
							chainCallback
						);
					},

					function (chainCallback) {
						Sync.removeSyncData(
							requestId,
							{
								category: ['specialActions'],
								data: 'merge_group:' + groupId + ':' + group.global_id,
							},
							chainCallback
						);
					},

					function (chainCallback) {
						// add data to sync
						Sync.addDataToSync(
							{
								category: ['deleteGroups'],
								data: group.global_id,
								syncAnyWay: true,
							},
							chainCallback,
							requestId
						);
					},

					function (chainCallback) {
						fvdSpeedDial.StorageSD.listDialsIdsByGroup(groupId, function (dials) {
							Utils.Async.arrayProcess(
								dials,
								function (dial, arrayProcessCallback) {
									Sync.addDataToSync(
										{
											category: ['deleteDials'],
											data: dial.global_id,
											syncAnyWay: true,
										},
										arrayProcessCallback,
										requestId
									);
								},
								chainCallback
							);
						});
					},

					function () {
						if (typeof window === 'object') {
							chrome.runtime.sendMessage({
								message: 'displayNoSyncGroupAlert',
								needActiveTab: true,
							});
						}

						if (callback) {
							callback();
						}
					},
				]);
			}
		});
	};

	this.syncAddonOptionsUrl = function (callback) {
		getSynchronizerId(function (id) {
			let url = null;

			if (id) {
				url = 'chrome-extension://' + id + '/options.html';
			}

			callback(url);
		});
	};

	this.syncAddonExists = function (callback) {
		getSynchronizerId(function (id) {
			let exists = false;

			if (id) {
				exists = true;
			}

			callback(exists);
		});
	};


	this.removeSyncData = function (requestId, params, callback) {
		let category = params.category;

		const cuppertPortKey = getCurrentPortByRequestId(requestId);
		const currentPort = responsePorts[cuppertPortKey];

		if (!currentPort.active) {
			if (callback) {
				callback();
			}

			return;
		}

		if (typeof category === 'string') {
			category = [category];
		}

		requestWithCallback(
			currentPort,
			{
				action: 'removeSyncData',
				data: params.data,
				category: category,
			},
			function () {
				if (callback) {
					callback();
				}
			}
		);
	};

	this.importFinished = () => {
		port.postMessage({
			action: 'importFinished',
		});
	};

	this.addDataToSync = function (params, callback, requestId) {
		let category = params.category;
		const _data = params.data;
		const currentPortKey = getCurrentPortByRequestId(requestId);
		let currentPort = currentPortKey !== 'workerPort' ? responsePorts[currentPortKey] : null;

		if (!currentPort) {
			const windowScopedPortKey = Object.keys(responsePorts).find((portKey) => responsePorts[portKey].active && portKey !== 'workerPort');

			if (windowScopedPortKey) {
				currentPort = responsePorts[windowScopedPortKey];
			} else {
				currentPort = responsePorts['workerPort'];
			}
		}

		if (!currentPort?.active) {
			if (callback) {
				callback();
			}

			return;
		}

		let data = null;

		if (typeof category === 'string') {
			category = [category];
		}

		Utils.Async.chain([
			function (chainCallback) {
				if (params.translate) {
					if (params.translate === 'group') {
						fvdSpeedDial.StorageSD.groupGlobalId(_data, function (globalId) {
							data = globalId;

							chainCallback();
						});
					} else if (params.translate === 'dial') {
						fvdSpeedDial.StorageSD.dialGlobalId(_data, function (globalId) {
							data = globalId;

							chainCallback();
						});
					} else {
						console.log('Undefined translate', params.translate);
					}
				} else {
					data = _data;
					chainCallback();
				}
			},
			function (chainCallback) {
				if (params.syncAnyWay) {
					chainCallback();
					return;
				}

				chainCallback();
			},

			function () {
				requestWithCallback(
					currentPort,
					{
						action: 'addDataToSync',
						data: data,
						category: category,
					},
					function () {
						if (callback) {
							callback();
						}
					}
				);
			},
		]);
	};

	this.startSync = function (type, requestId, callback) {
		type = type || 'main';

		const currentPortKey = getCurrentPortByRequestId(requestId);

		const currentPort = responsePorts[currentPortKey] || Object.values(responsePorts)[Object.values(responsePorts).length - 1];

		requestWithCallback(
			currentPort,
			{
				action: 'startSync',
				type: type,
			},
			function (result) {
				if (callback) {
					callback(result?.state);
				}
			}
		);
	};

	function clearGroupsAndDials(callback) {
		Utils.Async.chain([
			function (chainCallback) {
				fvdSpeedDial.StorageSD.getSyncGroupsList(1, function (groups) {
					fvdSpeedDial.StorageSD.clearDials(
						function () {
							chainCallback();
						},
						{ key: 'group_id', arr: groups }
					);
				});
			},
			function (chainCallback) {
				fvdSpeedDial.StorageSD.clearGroups(
					function () {
						chainCallback();
					},
					{ key: 'sync', val: 1 }
				);
			},
			callback,
		]);
	}

	function getStorage(message, callback) {
		callback(fvdSpeedDial.StorageSD);
	}

	// transactions

	function createTransaction(callback) {
		lastTransactionId++;
		const id = lastTransactionId;
		callback(id);
	}

	function commitTransaction(id, callback) {
		fvdSpeedDial.StorageSD.removeBackup(id, callback);
	}

	function rollbackTransaction(id, callback) {
		fvdSpeedDial.StorageSD.restoreBackup(id, callback);
	}

	function processPortMessage(message, currentPort) {
		const { StorageSD, UserInfoSync, localStorage } = fvdSpeedDial;
		switch (message.action) {
			case 'saveTempData':
				const id = message.data.id;
				const value = message.data.value;

				TempStore.append(id, value);
				// console.log('Got a chunk', id);
				sendResponse(currentPort, message.requestId, {
					id: id,
				});
				break;

			// transactions
			case 'startTransaction':
				createTransaction(function (id) {
					sendResponse(currentPort, message.requestId, {
						transId: id,
					});
				});
				break;

			case 'rollbackTransaction':
				rollbackTransaction(message.transId, function () {
					sendResponse(currentPort, message.requestId, {});
				});
				break;

			case 'commitTransaction':
				commitTransaction(message.transId, function () {
					sendResponse(currentPort, message.requestId, {});
				});
				break;

			case 'syncStartNotification':
				AppLog.info('sync starts');
				Broadcaster.sendMessage({ action: 'syncStartNotification' });
				break;

			case 'syncEndNotification':
				AppLog.info('sync ends');
				Broadcaster.sendMessage({ action: 'syncEndNotification' });
				break;

			case 'clearGroupsAndDials':
				AppLog.info('sync clear groups and dials');
				clearGroupsAndDials(function () {
					sendResponse(currentPort, message.requestId, {});
				});
				break;

			case 'toSyncDataChanged':
				Broadcaster.sendMessage({
					action: 'sync:syncdatachanged',
				});

				break;

			case 'restoreBackup':
				AppLog.info('restore backup');

				if (typeof message.data === 'string') {
					// got a temp data id
					message.data = JSON.parse(TempStore.pop(message.data));
				}

				StorageSD.restoreTablesData(
					message.data,
					function () {
						sendResponse(currentPort, message.requestId, {});
					},
					function (current, max) {
						const currentPortKey = getCurrentPortByRequestId(message.requestId);

						let currentPort = null;

						if (responsePorts[currentPortKey] && responsePorts[currentPortKey].active) {
							currentPort = responsePorts[currentPortKey];
						} else {
							const activePort = Object.values(responsePorts).find((rPort) => rPort.active);

							if (activePort) {
								currentPort = activePort;
							}
						}

						

						if (currentPort) {
							currentPort.port.postMessage({
								action: 'restoreBackupProgress',
								current: current,
								max: max,
							});
						}
					}
				);
				break;

			case 'queryGroups':
				if (!message.ignoreNoSync) {
					const whereSync = 'sync=1';

					if (message.where) {
						message.where.push(whereSync);
					} else {
						message.where = [whereSync];
					}
				}

				StorageSD.groupsRawList(message, function (list) {
					sendResponse(currentPort, message.requestId, { list: list });
				});
				break;

			case 'queryDialThumb':
				StorageSD.getDialThumb(message.global_id, function (thumb) {
					sendResponse(currentPort, message.requestId, {
						thumb: thumb,
					});
				});
				break;

			case 'queryDials':
				StorageSD.getSyncGroupsList(1, function (groups) {
					if (!message.ignoreNoSync) {
						message.whereIn = {
							key: 'group_id',
							arr: groups,
						};
					}

					fvdSpeedDial.StorageSD.dialsRawList(message, function (list) {
						sendResponse(currentPort, message.requestId, {
							list: list,
						});
					});
				});

				break;

			case 'mergeUpdateCollisedGroup':
				StorageSD.groupUpdate(
					message.clientGroup.id,
					{
						global_id: message.serverGroup.global_id,
					},
					function () {
						sendResponse(currentPort, message.requestId);
					}
				);
				break;

			case 'mergeUpdateCollisedDial':
				StorageSD.updateDial(
					message.clientDial.rowid,
					{
						global_id: message.serverDial.global_id,
					},
					function () {
						StorageSD.dialCanSync(message.serverDial.global_id, function (can) {
							if (can) {
								StorageSD.syncSaveDial(message.serverDial, function (saveInfo) {
									sendResponse(currentPort, message.requestId, { saveInfo: saveInfo });
								});
							} else {
								sendResponse(currentPort, message.requestId, { saveInfo: null });
							}
						});
					}
				);
				break;

			case 'saveGroup':
				StorageSD.groupCanSync(message.group.global_id, function (can) {
					if (can) {
						StorageSD.syncSaveGroup(message.group, function () {
							sendResponse(currentPort, message.requestId);
						});
					} else {
						sendResponse(currentPort, message.requestId);
					}
				});
				break;

			case 'moveDial':
				StorageSD.moveDial(message.id, message.groupId, function () {
					sendResponse(currentPort, message.requestId);
				});
				break;

			case 'saveDial':
				chrome.runtime.sendMessage({
					action: 'windowScopeSaveDial',
					dial: message.dial,
				}, function (saveInfo) {
					sendResponse(currentPort, message.requestId, {
						saveInfo: saveInfo,
					});
				});
				return true;
				break;

			case 'updateMass':
				// console.log('OBtained message', message);
				StorageSD.syncUpdateMass(message.globalIds, message.data, function () {
					if (message.requestId) {
						sendResponse(currentPort, message.requestId, {});
					}
				});
				break;

			case 'removeGroupsNotInList':
				const notRemoveGroups = message.groupsIds;

				StorageSD.syncRemoveGroups(notRemoveGroups, function (removed) {
					sendResponse(currentPort, message.requestId, {
						removed: removed,
					});
				});
				break;

			case 'removeDialsNotInList':
				const notRemoveDials = message.dialsIds;

				StorageSD.syncRemoveDials(notRemoveDials, function (removeInfo) {
					sendResponse(currentPort, message.requestId, { removeInfo: removeInfo });
				});
				break;

			case 'fixGroupsPositions':
				StorageSD.syncFixGroupsPositions(function () {
					sendResponse(currentPort, message.requestId);
				});
				break;

			case 'fixDialsPositions':
				StorageSD.syncFixDialsPositions(message.groupId, function () {
					sendResponse(currentPort, message.requestId);
				});
				break;

			case 'rebuild':
				if (typeof window === 'object') {
					chrome.runtime.sendMessage({
						action: 'forceRebuild',
					});
				}
				
				// need to refresh default group id
				const activeGroupId = Prefs.get('sd.default_group');

				if (activeGroupId && activeGroupId > 0) {
					fvdSpeedDial.StorageSD.groupExistsById(activeGroupId, function (exists) {
						if (!exists) {
							fvdSpeedDial.StorageSD.resetDefaultGroupId();
						}
					});
				}

				fvdSpeedDial.ContextMenu.rebuild();
				break;

			case 'syncAllGroupContents':
				StorageSD.syncGetGroupId(message.groupGlobalId, function (id) {
					if (id) {
						new Sync().groupSyncChanged(id, message.requestId, function () {
							sendResponse(currentPort, message.requestId);
						});
					} else {
						sendResponse(currentPort, message.requestId);
					}
				});
				break;

			case 'addGroupDialsToSync':
				Utils.Async.chain([
					function (chainCallback) {
						Sync.addDataToSync(
							{
								category: ['groups'],
								data: message.groupGlobalId,
							},
							chainCallback,
							message.requestId
						);
					},
					function () {
						fvdSpeedDial.StorageSD.syncGetGroupId(message.groupGlobalId, function (groupId) {
							fvdSpeedDial.StorageSD.listDialsIdsByGroup(groupId, function (dials) {
								Utils.Async.arrayProcess(
									dials,
									function (dial, arrayProcessCallback) {
										Sync.addDataToSync(
											{
												category: ['dials', 'newDials'],
												data: dial.global_id,
											},
											arrayProcessCallback,
											message.requestId
										);
									},
									function () {
										sendResponse(currentPort, message.requestId);
									}
								);
							});
						});
					},
				]);
				break;

			case 'setGroupSync':
				StorageSD.syncGetGroupId(message.global_id, function (groupId) {
					if (!groupId) {
						sendResponse(currentPort, message.requestId);
					} else {
						StorageSD.groupUpdate(
							groupId,
							{
								sync: message.value,
							},
							function () {
								sendResponse(currentPort, message.requestId);
							}
						);
					}
				});
				break;

			case 'dialCanSync':
				StorageSD.dialCanSync(message.global_id, function (can) {
					sendResponse(currentPort, message.requestId, { can: can });
				});
				break;

			case 'countItems':
				const result = {};

				Utils.Async.chain([
					function (chainCallback) {
						StorageSD.countDials(function (countDials) {
							result.dials = countDials;
							chainCallback();
						});
					},
					function (chainCallback) {
						StorageSD.groupsCount(function (countGroups) {
							result.groups = countGroups;
							chainCallback();
						});
					},
					function () {
						sendResponse(currentPort, message.requestId, result);
					},
				]);
				break;

			case 'localStorage.get':
				const fvdSpeedDialLastUpdateTime = localStorage.getItem(message.data.key);
				sendResponse(currentPort, message.requestId, { result: fvdSpeedDialLastUpdateTime });
				break;

			case 'localStorage.set':
				localStorage.setItem(message.data.key, message.data.value);
				break;

			case 'Deny.dump':
				StorageSD.denyList(function (result) {
					sendResponse(currentPort, message.requestId, { result: result });
				});
				break;

			case 'Deny.set':
				StorageSD.clearDeny(function () {
					Utils.Async.arrayProcess(
						message.data,
						function (deny, next) {
							StorageSD.deny(deny.type, deny.sign, function () {
								next();
							});
						},
						function () {
						}
					);
				});
				break;

			case 'Prefs.dump':
				Prefs.dump(dump => {
					sendResponse(currentPort, message.requestId, { result: dump });
				});
				break;
			case 'Prefs.set':
				Prefs.set(message.data.key, message.data.val);
				break;
			case 'reloadAllPages':
				Utils.reloadAllPages(message.timeout || 0);
				break;

			case 'miscItemGet':
				chrome.runtime.sendMessage({
					action: 'windowScopeMiscItemGet',
					data: {
						key: message.data.key,
					},
				}, function ({ result }) {
					sendResponse(currentPort, message.requestId, { result });
				});
				return true;

				break;

			case 'miscItemSet':
				chrome.runtime.sendMessage({
					action: 'windowScopeMiscItemSet',
					data: {
						key: message.data.key,
						val: message.data.val,
					},
				});

				return true;

				break;
			case '_response':
				callRequestResponse(message.requestId, message);
				break;
			
			case 'sync:logout':
				UserInfoSync.triggerOnLogout();
				break;
			case 'sync:login':
				UserInfoSync.triggerOnLogin(message.data);
				break;
		}
	}

	function sendResponse(currentPort, requestId, message) {
		message = message || {};

		message.action = '_response';
		message.requestId = requestId;

		currentPort.port.postMessage(message);
	}

	function getSynchronizerId(callback) {
		chrome.management.getAll(function (results) {
			let id = null;

			results.forEach(function (extension) {
				if (
					extension.enabled
					&& (extension.name.includes(fvdSynchronizerName) || fvdSynchronizerIds.indexOf(extension.id) >= 0)
				) {
					id = extension.id;
				}
			});
			callback(id);
		});
	}

	const that = this;

	chrome.runtime.onConnectExternal.addListener(function (_p) {


		if (!_p.sender) {
			return;
		}


		if (_p?.sender?.documentId && !responsePorts[_p?.sender?.documentId]) {
			responsePorts[_p?.sender?.documentId] = {
				port: null,
				active: false,
				pendingRequests: [],
			};
		}

		const currentPort = responsePorts[_p?.sender?.documentId || 'workerPort'];

		currentPort.port = _p;
		currentPort.port.onMessage.addListener((message) => processPortMessage(message, currentPort, responsePorts, _p?.sender?.documentId));
		currentPort.port.onDisconnect.addListener(function () {
			setActivity(false, currentPort);
			// currentPort.active = false;
		});

		if (fvdSpeedDial.PowerOff.isHidden()) {
			//do not send activate message to synchronizer if speed dial is locked
			return;
		}

		currentPort.port.postMessage({
			action: 'activate',
			apiv: 2,
		});

		if (!_b(Prefs.get('sd.synced_after_install'))) {
			console.info('needInitialSync');
			Prefs.set('sd.synced_after_install', true);
			currentPort.port.postMessage({
				action: 'needInitialSync',
			});
		}

		setActivity(true, currentPort);
		currentPort.active = true;

		that.getAccountInfo(currentPort, function (info) {
			UserInfoSync.setUserInfo(info);

			if (!info?.user?.premium?.active) {
				Prefs.set('sd.enable_search', true);
			} else {
				Prefs.set('sd.enable_search', UserInfoSync.getIsSearchEnable());
			}
		});
	});

	

	Broadcaster.onMessage.addListener(function (msg, sender, sendResponse) {
		if (port) {
			try {
				if (msg.isHidden) {
					port.postMessage({
						action: 'deactivate',
					});
				} else {
					port.postMessage({
						action: 'activate',
					});
				}
			} catch (ex) {
				// console.warn(ex);
			}
		}
	});
};

export default Sync;
