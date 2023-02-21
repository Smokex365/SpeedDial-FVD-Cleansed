import Broadcaster from '../_external/broadcaster.js';
import { Utils, _b } from '../utils.js';
import AppLog from '../log.js';

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
		return value.join('');
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
	const { Prefs } = fvdSpeedDial;
	const fvdSynchronizerName = 'EverSync';
	const fvdSynchronizerIds = [
		// Chrome Webstore EverSync ID
		'iohcojnlgnfbmjfjfkbhahhmppcggdog',
		// Opera addons EverSync ID
		'ffhogmjbkahkkpjpjmeppoegnjhpopmc',
	];

	let active = false;
	let port = null;
	let lastTransactionId = 0;
	let lastRequestId = 0;
	const pendingRequests = [];
	const PENDING_REQUESTS_TIMEOUT = 1000 * 5 * 60; // max life time of pending requests

	function setActivity(newActivity) {
		active = newActivity;

		Broadcaster.sendMessage({ action: 'sync:activitystatechanged' });
	}

	this.clearExpiredRequests = () => {
		const now = new Date().getTime();
		const ids = [];

		pendingRequests.forEach(function (request) {
			if (now - request.time >= PENDING_REQUESTS_TIMEOUT) {
				ids.push(request.id);
			}
		});

		ids.forEach(function (id) {
			removePendingRequest(id);
		});
	};

	function removePendingRequest(id) {
		let index = -1;

		for (let i = 0; i !== pendingRequests.length; i++) {
			if (pendingRequests[i].id === id) {
				index = i;
				break;
			}
		}

		if (index !== -1) {
			pendingRequests.splice(index, 1);
		}
	}

	function requestWithCallback(data, callback) {
		if (!port) {
			return callback(null);
		}

		lastRequestId++;
		data.requestId = lastRequestId;

		pendingRequests.push({
			id: lastRequestId,
			callback: callback,
			time: new Date().getTime(),
		});

		try {
			port.postMessage(data);
		} catch (ex) {
			console.warn(ex);
		}
	}

	function callRequestResponse(requestId, data) {
		pendingRequests.forEach(function (request) {
			if (request.id === requestId) {
				request.callback(data);
			}
		});

		removePendingRequest(requestId);
	}

	this.isActive = function () {
		return active;
	};

	this.hasDataToSync = function (callback) {
		requestWithCallback(
			{
				action: 'hasToSyncData',
			},
			function (response) {
				callback(response && response.has);
			}
		);
	};

	this.groupSyncChanged = function (groupId, callback) {
		// need sync group as new and all it dials.
		fvdSpeedDial.StorageSD.getGroup(groupId, function (group) {
			if (group.sync === 1) {
				Utils.Async.chain([
					function (chainCallback) {
						// remove data from sync
						Sync.removeSyncData(
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
											arrayProcessCallback
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
							chainCallback
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
							{
								category: ['groups', 'newGroups'],
								data: group.global_id,
							},
							chainCallback
						);
					},

					function (chainCallback) {
						Sync.removeSyncData(
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
							chainCallback
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
										arrayProcessCallback
									);
								},
								chainCallback
							);
						});
					},

					function () {
						chrome.runtime.sendMessage({
							message: 'displayNoSyncGroupAlert',
							needActiveTab: true,
						});

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

	this.removeSyncData = function (params, callback) {
		let category = params.category;

		if (!active) {
			if (callback) {
				callback();
			}

			return;
		}

		if (typeof category === 'string') {
			category = [category];
		}

		requestWithCallback(
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

	this.addDataToSync = function (params, callback) {
		let category = params.category;
		const _data = params.data;

		if (!active) {
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

	this.startSync = function (type, callback) {
		type = type || 'main';
		requestWithCallback(
			{
				action: 'startSync',
				type: type,
			},
			function (result) {
				if (callback) {
					callback(result.state);
				}
			}
		);
	};

	function clearGroupsAndDials(callback) {
		Utils.Async.chain([
			function (chainCallback) {
				/*
				fvdSpeedDial.StorageSD.clearDials(function () {
					chainCallback();
				}, '(SELECT `groups`.`sync` FROM `groups` WHERE `groups`.`id` = `dials`.`group_id`) = 1');
				*/
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
		/*
		// TODO
		fvdSpeedDial.StorageSD.backupTables(['dials', 'groups'], id, function () {
			callback(id);
		});
		*/

		callback(id);
	}

	function commitTransaction(id, callback) {
		fvdSpeedDial.StorageSD.removeBackup(id, callback);
	}

	function rollbackTransaction(id, callback) {
		fvdSpeedDial.StorageSD.restoreBackup(id, callback);
	}

	function processPortMessage(message) {
		const { StorageSD } = fvdSpeedDial;
		switch (message.action) {
			case 'saveTempData':
				const id = message.data.id;
				const value = message.data.value;

				TempStore.append(id, value);
				console.log('Got a chunk', id);
				sendResponse(message.requestId, {
					id: id,
				});
				break;

			// transactions
			case 'startTransaction':
				createTransaction(function (id) {
					sendResponse(message.requestId, {
						transId: id,
					});
				});
				break;

			case 'rollbackTransaction':
				rollbackTransaction(message.transId, function () {
					sendResponse(message.requestId, {});
				});
				break;

			case 'commitTransaction':
				commitTransaction(message.transId, function () {
					sendResponse(message.requestId, {});
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
					sendResponse(message.requestId, {});
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
						sendResponse(message.requestId, {});
					},
					function (current, max) {
						port.postMessage({
							action: 'restoreBackupProgress',
							current: current,
							max: max,
						});
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
					sendResponse(message.requestId, { list: list });
				});
				break;

			case 'queryDialThumb':
				StorageSD.getDialThumb(message.global_id, function (thumb) {
					sendResponse(message.requestId, {
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
						sendResponse(message.requestId, {
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
						sendResponse(message.requestId);
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
									sendResponse(message.requestId, { saveInfo: saveInfo });
								});
							} else {
								sendResponse(message.requestId, { saveInfo: null });
							}
						});
					}
				);
				break;

			case 'saveGroup':
				StorageSD.groupCanSync(message.group.global_id, function (can) {
					if (can) {
						StorageSD.syncSaveGroup(message.group, function () {
							sendResponse(message.requestId);
						});
					} else {
						sendResponse(message.requestId);
					}
				});
				break;

			case 'moveDial':
				StorageSD.moveDial(message.id, message.groupId, function () {
					sendResponse(message.requestId);
				});
				break;

			case 'saveDial':
				StorageSD.syncSaveDial(message.dial, function (saveInfo) {
					sendResponse(message.requestId, {
						saveInfo: saveInfo,
					});
				});
				break;

			case 'updateMass':
				console.log('OBtained message', message);
				StorageSD.syncUpdateMass(message.globalIds, message.data, function () {
					if (message.requestId) {
						sendResponse(message.requestId, {});
					}
				});
				break;

			case 'removeGroupsNotInList':
				const notRemoveGroups = message.groupsIds;

				StorageSD.syncRemoveGroups(notRemoveGroups, function (removed) {
					sendResponse(message.requestId, {
						removed: removed,
					});
				});
				break;

			case 'removeDialsNotInList':
				const notRemoveDials = message.dialsIds;

				StorageSD.syncRemoveDials(notRemoveDials, function (removeInfo) {
					sendResponse(message.requestId, { removeInfo: removeInfo });
				});
				break;

			case 'fixGroupsPositions':
				StorageSD.syncFixGroupsPositions(function () {
					sendResponse(message.requestId);
				});
				break;

			case 'fixDialsPositions':
				StorageSD.syncFixDialsPositions(message.groupId, function () {
					sendResponse(message.requestId);
				});
				break;

			case 'rebuild':
				chrome.runtime.sendMessage({
					action: 'forceRebuild',
				});
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
						new Sync().groupSyncChanged(id, function () {
							sendResponse(message.requestId);
						});
					} else {
						sendResponse(message.requestId);
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
							chainCallback
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
											arrayProcessCallback
										);
									},
									function () {
										sendResponse(message.requestId);
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
						sendResponse(message.requestId);
					} else {
						StorageSD.groupUpdate(
							groupId,
							{
								sync: message.value,
							},
							function () {
								sendResponse(message.requestId);
							}
						);
					}
				});
				break;

			case 'dialCanSync':
				StorageSD.dialCanSync(message.global_id, function (can) {
					sendResponse(message.requestId, { can: can });
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
						sendResponse(message.requestId, result);
					},
				]);
				break;

			case 'Deny.dump':
				StorageSD.denyList(function (result) {
					sendResponse(message.requestId, { result: result });
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
					sendResponse(message.requestId, { result: dump });
				});
				break;
			case 'Prefs.set':
				Prefs.set(message.data.key, message.data.val);
				break;
			case 'reloadAllPages':
				Utils.reloadAllPages(message.timeout || 0);
				break;

			case 'miscItemGet':
				StorageSD.getMisc(message.data.key, function (result) {
					if (String(result).indexOf('filesystem') === 0) {
						FileSystemSD.readAsDataURLbyURL(result, function (err, data) {
							//var blob = fvdSpeedDial.Utils.dataURIToBlob(data);
							sendResponse(message.requestId, { result: data });
						});
					} else {
						sendResponse(message.requestId, { result: result });
					}
				});
				break;

			case 'miscItemSet':

				if (
					message.data.key === 'sd.background'
					&& String(message.data.val).indexOf('https:') === 0
				) {

					Utils.imageUrlToDataUrl(message.data.val, function (dataUrl) {
						Prefs.set('sd.background_url', message.data.val);
						fvdSpeedDial.StorageSD.setMisc('sd.background', dataUrl);
					});
				} else {
					if (String(message.data.val).indexOf('/images/newtab/firefox') !== -1) {
						message.data.val = '/images/newtab/fancy_bg.jpg';
					}

					fvdSpeedDial.StorageSD.setMisc(message.data.key, message.data.val);
				}

				break;
			case '_response':
				callRequestResponse(message.requestId, message);
				break;
		}
	}

	function sendResponse(requestId, message) {
		message = message || {};

		message.action = '_response';
		message.requestId = requestId;

		port.postMessage(message);
	}

	function getSynchronizerId(callback) {
		chrome.management.getAll(function (results) {
			let id = null;

			results.forEach(function (extension) {
				if (
					extension.enabled
					&& (extension.name === fvdSynchronizerName || fvdSynchronizerIds.indexOf(extension.id) >= 0)
				) {
					id = extension.id;
				}
			});
			callback(id);
		});
	}

	chrome.runtime.onConnectExternal.addListener(function (_p) {

		if (!_p.sender) {
			console.log('Sender not specified');
			return;
		}

		port = _p;
		port.onMessage.addListener(processPortMessage);
		port.onDisconnect.addListener(function () {
			setActivity(false);
		});

		if (fvdSpeedDial.PowerOff.isHidden()) {
			//do not send activate message to synchronizer if speed dial is locked
			return;
		}

		port.postMessage({
			action: 'activate',
			apiv: 2,
		});

		if (!_b(Prefs.get('sd.synced_after_install'))) {
			console.info('needInitialSync');
			Prefs.set('sd.synced_after_install', true);
			port.postMessage({
				action: 'needInitialSync',
			});
		}

		setActivity(true);
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
