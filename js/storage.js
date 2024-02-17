/* eslint-disable eqeqeq */
import AppLog from './log.js';
import { Utils, getCleanUrl } from './utils.js';
import Sync from './sync/tab.js';
import Config from './config.js';
import Broadcaster from './_external/broadcaster.js';
import FileSystemSD from './storage/filesystem.js';
import { _ } from './localizer.js';
import initStorage from './storage/init.js';
import { defaultGroupTitles } from './constants.js';
import Analytics from './bg/google-analytics.js';

const LOG_STORAGE = true;
const CACHE = {};
const DATABASE_TYPE = /*LS.getItem('global.database.mode') ||*/ 'indexed.db'; // 'storage.local'
const tablesDefaultValues = {
	dials: { thumb_version: 0, get_screen_method: 'manual' },
	mostvisited_extended: { thumb_version: 0, get_screen_method: 'manual' },
	deny: {},
	misc: {},
	groups: { sync: 1 },
};

function checkLocalFile(url, thumb_source_type, thumb_url, cb) {
	const res = {};

	if (thumb_source_type && thumb_source_type !== 'screen') {
		return cb(null);
	}

	if (url.indexOf('file://') === 0) {
		if (thumb_source_type) {
			res.thumb_source_type = thumb_source_type;
		}

		if (thumb_url) {
			res.thumb_url = thumb_url;
		}

		// process add local file to speed dial
		try {
			res.title = url.match(/[\/\\]([^\/\\?]+)[^\/\\]*$/i)[1];
		} catch (ex) {
			console.warn(ex);
			res.title = url;
		}

		if (/(\.jpe?g|\.gif|\.png)$/i.test(url) && false) {
			res.thumb_url = url;
			res.thumb_source_type = 'url';
			Utils.imageUrlToDataUrl(res.thumb_url, function (th, size) {
				if (!th || !size) {
					console.error('Fail to read image', res.thumb_url);
					return cb(null);
				}

				res.thumb = th;
				res.thumb_width = size.width;
				res.thumb_height = size.height;
				cb(res);
			});
		} else if (/(\.html?|\.pdf)$/i.test(url)) {
			cb(res);
		} else {
			// not allowed for auto screen use standard image for local file
			res.screen_maked = 1; // use force url
			res.thumb_url = 'https://s3.amazonaws.com/fvd-data/sdpreview/local_file.png';
			Utils.imageUrlToDataUrl(res.thumb_url, function (th, size) {
				res.thumb = th;
				res.thumb_width = size.width;
				res.thumb_height = size.height;
				cb(res);
			});
			res.thumb_source_type = 'url';
		}
	} else {
		cb(null);
	}
}
class StorageSD {
	constructor(fvdSpeedDial) {
		this.fvdSpeedDial = fvdSpeedDial;
	}
	onDataChanged = {
		listeners: [],
		addListener: function (listener) {
			if (this.listeners.indexOf(listener) < 0) {
				this.listeners.push(listener);
			}
		},
		dispatch: function () {
			for (const listener of this.listeners) {
				try {
					listener();
				} catch (err) {
					console.error('Fail to call listener Storage.onDataChanged: ', err);
				}
			}
		},
	};
	_connection = null;
	_dbName = 'fvdSpeedDialDataBase';
	_estimatedSize = 500 * 1024 * 1024;
	// state of establishing connection and doing the inital actions
	connecting = false;
	connectionPromise = Promise.resolve(null);
	// callbacks
	_groupsChangeCallbacks = [];
	_dialsChangeCallbacks = [];
	_standardThumbDirUrl = '/images/newtab/dials_standard';
	_dialFieldsToFetch =
		'rowid as `id`, `url`, `display_url`, `title`, `auto_title`, `update_interval`, ' +
		'`thumb_source_type`, `thumb_url`, `position`, `group_id`, `clicks`, `deny`, `screen_maked`, ' +
		'`thumb`, `thumb_version`, `screen_delay`, `thumb_width`, `thumb_height`, `get_screen_method`, ' +
		'`global_id`, `previewTitle`, `preview_style`';
	// force use transaction
	_transaction = null;
	_backupRegexp = /_backup_(.+?)_(.+)$/i;
	_requiredTables = ['deny', 'dials', 'groups', 'misc', 'mostvisited_extended'];
	isIncognito = false;
	_defaultDials = [
		{
			group: {
				name: _('bg_default_group_name'),
				global_id: 'default',
				sync: 1,
			},
			dials: 'server',
		},
	];
	prepareDataType = function (table, data = {}) {
		const prepared = Object.assign(data);
		const tables = {
			dial: {
				number: [
					'id',
					'group_id',
					'clicks',
					'deny',
					'position',
					'screen_delay',
					'screen_maked',
					'thumb_version',
					'thumb_height',
					'thumb_width',
				],
			},
		};

		if (typeof table === 'string' && tables.hasOwnProperty(table)) {
			for (const type in tables[table]) {
				if (type === 'number') {
					for (const field of tables[table][type]) {
						if (prepared.hasOwnProperty(field) && prepared[field] != null) {
							const value = parseInt(prepared[field]);

							if (!isNaN(value)) {
								prepared[field] = value;
							}
						}
					}
				}
			}
		}

		return prepared;
	};
	createForOneTransaction = function (callback) {
		const transactionStorage = new StorageSD();

		transactionStorage._connection = this._connection;
		transactionStorage._connection.transaction(function (tx) {
			transactionStorage._transaction = tx;
			callback(transactionStorage);
		});
	};
	backupTables = function (tables, postfix, callback) {
		AppLog.info('Create backup of tables', tables, postfix);
		const that = this;

		Utils.Async.arrayProcess(
			tables,
			function (table, arrayProcessCallback) {
				that.transaction(function (tx) {
					tx.executeSql(
						'CREATE TABLE IF NOT EXISTS _backup_' +
							postfix +
							'_' +
							table +
							' AS SELECT * FROM ' +
							table,
						[],
						function () {
							arrayProcessCallback();
						}
					);
				});
			},
			callback
		);
	};
	removeBackup = function (postfix, callback) {
		AppLog.info('Remove backup with postfix', postfix);
		const regexp = this._backupRegexp;
		const that = this;

		this._getTables(function (tables) {
			Utils.Async.arrayProcess(
				tables,
				function (table, arrayProcessCallback) {
					const matches = table.match(regexp);

					if (matches && (matches[1] === postfix || !postfix)) {
						that.transaction(function (tx) {
							AppLog.info('remove backup - drop table', table);
							tx.executeSql('DROP TABLE ' + table, [], arrayProcessCallback);
						});
					} else {
						arrayProcessCallback();
					}
				},
				callback
			);
		});
	};
	restoreBackupInitial = function (callback) {
		const that = this;
		const regexp = this._backupRegexp;

		this._getTables(function (tables) {
			const backupPostfixes = [];

			Utils.Async.arrayProcess(
				tables,
				function (table, arrayProcessCallback) {
					const matches = table.match(regexp);

					if (matches && backupPostfixes.indexOf(matches[1]) === -1) {
						backupPostfixes.push(matches[1]);
					}

					arrayProcessCallback();
				},
				function () {
					if (!backupPostfixes.length) {
						callback();
					} else {
						const restorePostfix = backupPostfixes.shift();

						AppLog.info('restore initial backup with postfix', restorePostfix);
						that.restoreBackup(restorePostfix, function () {
							Utils.Async.arrayProcess(
								backupPostfixes,
								function (postfix, arrayProcessCallback) {
									that.removeBackup(postfix, arrayProcessCallback);
								},
								callback
							);
						});
					}
				}
			);
		});
	};
	restoreBackup = function (postfix, callback) {
		AppLog.info('restore backup with postfix', postfix);
		const that = this;
		const regexp = this._backupRegexp;

		this._getTables(function (tables) {
			Utils.Async.arrayProcess(
				tables,
				function (table, arrayProcessCallback) {
					const matches = table.match(regexp);

					if (matches && matches[1] === postfix) {
						const tableOrig = matches[2];

						that.transaction(function (tx) {
							Utils.Async.chain([
								function (chainCallback) {
									AppLog.info('backup - cleanup original table', tableOrig);
									tx.executeSql('DELETE FROM ' + tableOrig, [], chainCallback);
								},
								function (chainCallback) {
									AppLog.info('backup - insert from', table, 'to', tableOrig);
									tx.executeSql(
										'INSERT INTO ' + tableOrig + ' SELECT * FROM ' + table,
										[],
										chainCallback
									);
								},
								function (chainCallback) {
									AppLog.info('backup - drop table', table);
									tx.executeSql('DROP TABLE ' + table, [], chainCallback);
								},
								function () {
									arrayProcessCallback();
								},
							]);
						});
					} else {
						arrayProcessCallback();
					}
				},
				function () {
					that._getTables(function (tables) {
						AppLog.info('tables after backup restore', tables);
						callback();
					});
				}
			);
		});
	};
	connect = (callback) => {
		const that = this;

		if (that.connecting) {
			return that.connectionPromise.then(callback);
		}

		that.connecting = true;
		that.connectionPromise = new Promise(function (resolve, reject) {
			that._connection = openDatabase(that._dbName, '1.0', '', that._estimatedSize);
			that._createTables(function (result) {
				that.restoreBackupInitial(function () {
					that.connecting = false;
					resolve();

					if (callback) {
						callback();
					}

					Broadcaster.sendMessage({
						action: 'storage = connected',
					});
				});
			});
		});
	};
	createOrReuseTransaction = function (tx, callback) {
		if (tx) {
			return callback(tx);
		} else {
			return this.transaction(callback);
		}
	};
	transaction = function (callback) {
		const self = this;

		if (this._transaction) {
			callback(this._transaction);
		} else {
			self._connection.transaction(callback, function (err) {
				// ugly way of comparement(messages) but code is always 0 for SQLError
				if (err.message !== 'database has been closed') {
					return console.error('Fail to get a transaction(not recoverable)', err);
				}

				self.connect(function () {
					self._connection.transaction(callback, function (err) {
						console.error("Can't get a transaction even after reconnect", err);
					});
				});
			});
		}
	};
	resetAllDialsClicks = function (cb) {
		const self = this;

		dbTransaction(function (tx) {
			dbUpdate(fvdSpeedDial, {
				tx: tx,
				table: 'dials',
				set: {
					clicks: 0,
				},
				success: function (tx, results) {
					self.onDataChanged.dispatch();
					cb();
				},
			});
		});
	};
	restoreTableRow = function (tx, table, row, cb) {
		const { fvdSpeedDial } = this;
		const fields = [];
		const questions = [];
		const values = [];
		const self = this;

		for (const k in row) {
			fields.push(k);
			questions.push('?');
			values.push(row[k]);
		}
		const transactionCreated = !tx;

		self.createOrReuseTransaction(tx, function () {
			dbTransaction(function (tx) {
				Utils.Async.chain([
					function (next) {
						const insertSet = {};

						for (const i in fields) insertSet[fields[i]] = values[i];

						if (insertSet.rowid && !insertSet.id) insertSet.id = insertSet.rowid;

						dbInsert(fvdSpeedDial, {
							tx: tx,
							table: table,
							set: insertSet,
							success: function (tx, res) {
								if (table !== 'dials') {
									return next();
								}

								if (!row.thumb) {
									// thumb not found, probably kind of a bug, but now just ignore this preview
									return next();
								}

								if (row.thumb.indexOf('data:') !== 0) {
									if (row.thumb_source_type === 'url' && row.thumb_url) {
										// need to fetch thumb from url
										Utils.imageUrlToDataUrl(row.thumb_url, function (th, size) {
											if (!th || !size) {
												console.info('Fail to fetch thumb from', row.thumb_url);
												transactionCreated && next();
												return;
											}

											fvdSpeedDial.StorageSD.updateDial(
												res.insertId,
												{
													thumb: th,
													thumb_width: size.width,
													thumb_height: size.height,
												},
												function () {
													transactionCreated && next();
												}
											);
										});
									} else {
										transactionCreated && next();
										/*
										fvdSpeedDial.StorageSD.updateDial(
											res.insertId,
											{
												screen_maked: 0,
											},
											function () {
												transactionCreated && next();
											}
										);
										*/
									}
								} else {
									// save data uri to file, by update dial thumb
									fvdSpeedDial.StorageSD.updateDial(
										res.insertId,
										{
											thumb: row.thumb,
										},
										function () {
											transactionCreated && next();
										}
									);
								}

								if (!transactionCreated) {
									// prevent staling transaction by async requests
									next();
								}
							},
							error: function (tx, error) {
								console.log('Fail', error);
								return next(); // Task
							},
						});
					},
					function () {
						cb();
					},
				]);
			});
		});
	};
	restoreTableData = function (tx, table, tableData, cb, rowDoneCb) {
		const self = this;
		const { fvdSpeedDial } = this;

		rowDoneCb = rowDoneCb || function () {};
		const transactionCreated = !tx;

		Utils.Async.chain([
			function (next) {
				if (tx) {
					return next();
				}

				self.transaction(function (_tx) {
					tx = _tx;
					next();
				});
			},
			function () {
				dbTransaction(function (tx) {
					dbDelete(fvdSpeedDial, {
						tx: tx,
						from: String(table),
						force: true,
						success: function (tx) {
							if (table === 'dials') {
								Broadcaster.sendMessage({
									action: 'storage:dialsCleared',
								});
							}

							let rowIndex = 0;
							const globalIds = [];

							Utils.Async.eachSeries(
								tableData,
								function (row, apc2) {
									console.info('Restoring row', rowIndex, 'of', table);

									if (row && typeof row === 'object' && row.global_id) {
										if (globalIds.indexOf(row.global_id) !== -1) {
											//skip
											rowIndex++;
											//rowDoneCb();
											apc2();
										} else {
											globalIds.push(row.global_id);
										}
									}

									self.restoreTableRow(transactionCreated ? null : tx, table, row, function () {
										console.info('Restored row', rowIndex, 'of', table);
										rowIndex++;
										rowDoneCb();
										apc2();
									});
								},
								function () {
									// console.log('Done table', table);
									cb();
								}
							);
						},
					});
				});
			},
		]);
	};
	// restore tables data
	restoreTablesDataInOneTransaction = function (data, callback, progressCallback, tx) {
		const tables = [];
		let totalRows = 0;
		let count = 0;

		for (const table in data) {
			tables.push(table);
			totalRows += data[table].length;
		}
		const that = this;
		console.info('Start restoring db data in one transaction');

		that.createOrReuseTransaction(tx, function (tx) {
			Utils.Async.eachSeries(
				tables,
				function (table, apc1) {
					console.info('Restoring table', table);
					that.restoreTableData(
						tx,
						table,
						data[table],
						function () {
							//console.log("Restored data for", table);
							apc1();
						},
						function () {
							count++;

							if (progressCallback) {
								progressCallback(count, totalRows);
							}
						}
					);
				},
				function () {
					//console.log("Restore in one transaction finished");
					callback();
				}
			);
		});
	};
	restoreTablesData = function (data, callback, progressCallback) {
		const tables = [];
		let totalRows = 0;
		let count = 0;

		for (const table in data) {
			tables.push(table);
			totalRows += data[table].length;
		}
		const that = this;

		Utils.Async.eachSeries(
			tables,
			function (table, apc1) {
				that.restoreTableData(null, table, data[table], apc1, function () {
					count++;

					if (progressCallback) {
						progressCallback(count, totalRows);
					}
				});
			},
			function () {
				callback();
			}
		);
	};
	fullDump = function (cb) {
		const { fvdSpeedDial } = this;
		const self = this;
		const tables = ['deny', 'dials', 'groups', 'misc'];
		const data = {};

		Utils.Async.arrayProcess(
			tables,
			function (table, next) {
				dbTransaction(function (tx) {
					dbSelect(fvdSpeedDial, {
						tx: tx,
						from: table,
						success: function (tx, results) {
							data[table] = self._resultsToArray(results);
							next();
						},
					});
				});
			},
			function () {
				cb(null, data);
			}
		);
	};
	// dump functions
	dump = function (dumpToJsonCallback) {
		const { fvdSpeedDial } = this;
		const that = this;

		Utils.Async.chain([
			function (callback, dataObject) {
				dbTransaction(function (tx) {
					dbSelect(fvdSpeedDial, {
						tx: tx,
						from: 'dials',
						success: function (tx, results) {
							dataObject.dials = that._resultsToArray(results);
							callback();
						},
					});
				});
			},
			function (callback, dataObject) {
				dbTransaction(function (tx) {
					dbSelect(fvdSpeedDial, {
						tx: tx,
						from: 'groups',
						success: function (tx, results) {
							dataObject.groups = that._resultsToArray(results);
							callback();
						},
					});
				});
			},
			function (callback, dataObject) {
				dbTransaction(function (tx) {
					dbSelect(fvdSpeedDial, {
						tx: tx,
						from: 'deny',
						success: function (tx, results) {
							dataObject.deny = that._resultsToArray(results);
							callback();
						},
					});
				});
			},
			function (callback, dataObject) {
				dumpToJsonCallback(dataObject);
			},
		]);
	};
	resetAutoDialsForGroup = function (params, callback) {
		const { fvdSpeedDial } = this;
		const self = this;
		let whereIn = false;
		const where = {
			// get_screen_method: 'auto',
			thumb_source_type: 'screen',
		};

		if (!isNaN(params.groupId)) {
			where.group_id = parseInt(params.groupId);
		}

		if (params.ids) {
			whereIn = {
				key: 'id',
				arr: params.ids,
			};
		}

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				where: where,
				whereIn: whereIn,
				limit: parseInt(params.limit) || false,
				success: function (tx, results_s) {
					Utils.Async.arrayProcess(
						results_s.rows,
						function (dial, arrayProcessCallback) {
							dbUpdate(fvdSpeedDial, {
								tx: tx,
								table: 'dials',
								set: {
									thumb: '',
									screen_maked: 0,
								},
								where: {
									key: 'id',
									val: dial.id,
								},
								success: function (tx, results) {
									arrayProcessCallback();
								},
								error: function (tx, error) {
									//console.error("Query failed", error);
									arrayProcessCallback();
								},
							});
						},
						function () {
							self.onDataChanged.dispatch();
							callback();
						}
					);
				},
			});
		});
	};
	setAutoUpdateGlobally = function (params, cb) {
		const { fvdSpeedDial } = this;
		const self = this;
		const whereObj = {
			thumb_source_type: 'screen',
			get_screen_method: 'auto',
		};

		if (params && typeof params === 'object' && typeof params.where === 'object' && params.where) {
			for (const k in params.where) {
				whereObj[k] = params.where[k];
			}
		}

		dbTransaction(function (tx) {
			//need check
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				fields: ['global_id'],
				where: whereObj,
				success: function (tx, results_s) {
					const globalIds = [];
					for (let i = 0; results_s.rows.length !== i; i++) {
						globalIds.push(results_s.rows[i].global_id);
					}
					Utils.Async.arrayProcess(
						globalIds,
						function (globalId, next) {
							dbUpdate(fvdSpeedDial, {
								tx: tx,
								table: 'dials',
								set: {
									update_interval: params.interval,
								},
								where: {
									key: 'global_id',
									val: globalId,
								},
								success: function (tx, results) {
									next();
								},
								error: function (error) {
									next();
								},
							});
						},
						function () {
							for (let i = 0; i !== globalIds.length; i++) {
								Sync.addDataToSync({
									category: ['dials'],
									data: globalIds[i],
								});
							}
							self.onDataChanged.dispatch();
							cb(globalIds);
						}
					);
				},
			});
		});
	};
	turnOffAutoUpdateGlobally = function (cb) {
		const { fvdSpeedDial } = this;
		const self = this;

		dbTransaction(function (tx) {
			//need check
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				fields: ['global_id'],
				where: {
					'thumb_source_type': 'screen',
					'get_screen_method': 'auto',
					'update_interval !': '',
				},
				success: function (tx, results_s) {
					const globalIds = [];

					for (let i = 0; results_s.rows.length !== i; i++) {
						globalIds.push(results_s.rows[i].global_id);
					}
					Utils.Async.arrayProcess(
						globalIds,
						function (globalId, next) {
							dbUpdate(fvdSpeedDial, {
								tx: tx,
								table: 'dials',
								set: {
									update_interval: '',
								},
								where: {
									key: 'global_id',
									val: globalId,
								},
								success: function (tx, results) {
									next();
								},
								error: function (error) {
									next();
								},
							});
						},
						function () {
							for (let i = 0; i !== globalIds.length; i++) {
								Sync.addDataToSync({
									category: ['dials'],
									data: globalIds[i],
								});
							}
							self.onDataChanged.dispatch();
							cb(globalIds);
						}
					);
				},
			});
		});
	};
	setAutoPreviewGlobally = function (params, callback) {
		const { fvdSpeedDial } = this;
		const self = this;

		dbTransaction(function (tx) {
			//need check
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				fields: ['global_id', 'thumb_source_type', 'get_screen_method'],
				where: {
					OR: {
						thumb_source_type: 'url',
						get_screen_method: 'manual',
					},
				},
				success: function (tx, results_s) {
					const globalIds = [];

					for (let i = 0; results_s.rows.length !== i; i++) {
						globalIds.push(results_s.rows[i].global_id);
					}
					Utils.Async.arrayProcess(
						globalIds,
						function (globalId, next) {
							dbUpdate(fvdSpeedDial, {
								tx: tx,
								table: 'dials',
								set: {
									get_screen_method: 'auto',
									thumb_source_type: 'screen',
									screen_maked: 0,
									thumb: '',
								},
								where: {
									key: 'global_id',
									val: globalId,
								},
								success: function (tx, results) {
									next();
								},
								error: function (error) {
									next();
								},
							});
						},
						function () {
							for (let i = 0; i !== globalIds.length; i++) {
								Sync.addDataToSync({
									category: ['dials'],
									data: globalIds[i],
								});
							}
							self.onDataChanged.dispatch();
							callback(globalIds);
						}
					);
				},
			});
		});
	};
	// dial functions
	dialGlobalId = function (id, callback) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				field: ['global_id'],
				where: { rowid: id },
				success: function (tx, results) {
					let globalId = null;

					if (results.rows.length === 1) {
						globalId = results.rows[0].global_id;
					}

					callback(globalId);
				},
			});
		});
	};
	listDialsIdsByGroup = function (groupId, callback) {
		groupId = parseInt(groupId);

		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				field: ['rowid', 'global_id'],
				where: { group_id: groupId },
				success: function (tx, results) {
					const data = [];

					for (let i = 0; i !== results.rows.length; i++) {
						const dial = results.rows[i];

						data.push({
							id: dial.rowid,
							global_id: dial.global_id,
						});
					}
					callback(data);
				},
			});
		});
	};
	getDialsToPreviewUpdate = function (cb) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				//fields: ['id', 'rowid', 'update_interval', 'last_preview_update', 'url'],
				where: {
					'update_interval !': '',
					'thumb_source_type': 'screen',
				},
				success: function (tx, results) {
					const data = [];
					const now = new Date().getTime();

					for (let i = 0; i !== results.rows.length; i++) {
						const dial = results.rows[i];

						if (!dial.last_preview_update) {
							dbUpdate(fvdSpeedDial, {
								tx: tx,
								table: 'dials',
								set: {
									last_preview_update: now,
								},
								where: {
									key: 'id',
									val: dial.rowid,
								},
							});
							continue;
						}

						let interval = String(dial.update_interval || '').split('|');

						switch (interval[1]) {
							case 'minutes':
								interval = interval[0] * 60;
								break;
							case 'hours':
								interval = interval[0] * 3600;
								break;
							case 'days':
								interval = interval[0] * 3600 * 24;
								break;
							default:
								continue;
						}
						interval *= 1000;

						//if (now - dial.last_preview_update < interval) {
						if (now - dial.last_preview_update < interval - 15e3) {
							//Task #1002
							continue;
						}

						data.push({
							id: dial.rowid,
							url: dial.url,
						});
						dbUpdate(fvdSpeedDial, {
							tx: tx,
							table: 'dials',
							set: {
								last_preview_update: dial.rowid,
							},
							where: {
								key: 'id',
								val: dial.rowid,
							},
						});
					}
					cb(data);
				},
			});
		});
	};
	searchDials = function (query, params, cb) {
		const that = this;
		const { fvdSpeedDial } = this;

		if (typeof params === 'function') {
			cb = params;
			params = {};
		}

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				fields: String(that._dialFieldsToFetch).replace('rowid as `id`', '`rowid`, `id`'),
				where: {
					OR: {
						'url~': query,
						'title~': query,
						'auto_title~': query,
					},
				},
				limit: params.limit || 20,
				order: '!clicks',
				success: function (tx, results) {
					const data = [];

					for (let i = 0; i !== results.rows.length; i++)
						if (!results.rows[i].deny) {
							const dial = results.rows[i];

							that._prepareDialData(dial);
							data.push(dial);
						}
					cb(null, data);
				},
				error: function (tx, error) {
					console.error('FAIL', error);
					cb(error);
				},
			});
		});
	};
	listDials = function (orderBy, groupId, limit, callback, withoutThumbs) {
		groupId = parseInt(groupId);

		const { fvdSpeedDial } = this;
		const that = this;

		if (typeof orderBy === 'function') {
			callback = orderBy;
			orderBy = null;
		}

		if (typeof callback !== 'function' && typeof withoutThumbs === 'function') {
			const thumbs = typeof callback !== 'number' ? _b(callback) : parseInt(callback) || 50;

			callback = withoutThumbs;
			withoutThumbs = thumbs;
		}

		if (!orderBy) {
			orderBy = 'position';
		}

		const whereArr = { deny: 0 };

		if (groupId && groupId > 0) {
			whereArr['group_id'] = groupId;
		}

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				fields: String(that._dialFieldsToFetch).replace('rowid as `id`', '`rowid`, `id`'),
				rename: { rowid: 'id' },
				order: orderBy,
				where: whereArr,
				group: groupId === 0 ? 'url' : false,
				limit: parseInt(limit) ? parseInt(limit) : false,
				success: function (tx, results) {
					const data = [];

					for (let i = 0; i !== results.rows.length; i++) {
						const dial = results.rows[i];
						that._prepareDialData(dial);
						data.push(dial);
					}

					that.checkIncognito(() => {
						if (
							typeof withoutThumbs === 'undefined' ||
							!withoutThumbs ||
							DATABASE_TYPE === 'storage.local'
						) {
							that.getDialsPreview(data, callback, withoutThumbs);
						} else {
							callback(data);
						}
					});
				},
				error: function (tx, error) {
					console.error('FAIL', error);
				},
			});
		});
	};
	getSyncGroupsList = function (val, callback) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'groups',
				where: { sync: val },
				success: function (tx, results) {
					const list = [];
					const full = [];

					for (const k in results.rows) {
						list.push(results.rows[k].id);
						full.push(results.rows[k]);
					}
					callback(list, full);
				},
			});
		}, 1);
	};

	dialsRawList = function (params, callback) {
		const { fvdSpeedDial } = this;
		const self = this;

		params = params || {};

		if (typeof params.fetchThumb === 'undefined') {
			params.fetchThumb = true;
		}

		const query = {
			from: 'dials',
			whereIn: params.whereIn ? params.whereIn : false,
			limit: params.limit ? params.limit : false,
		};

		if (params.where) {
			query.whereSQL = typeof params.where === 'object' ? params.where.join(' AND ') : params.where;
		}

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'groups',
				success: function (tx, groupsList) {
					self._rawList(query, function (list) {
						for (const kd in list) {
							for (const kg in groupsList.rows) {
								if (list[kd].group_id === groupsList.rows[kg].id) {
									list[kd].group_global_id = groupsList.rows[kg].global_id;
									break;
								}
							}
						}
						// preparations
						list.forEach(function (dial) {
							// fix bug when update_interval set to undefined(maybe with sync)
							if (dial.update_interval === 'undefined') {
								dial.update_interval = '';
							}
						});

						if (params.fetchThumb) {
							// need to replace filesystem urls by data uris
							// because rawList request is used for sync
							Utils.Async.arrayProcess(
								list,
								function (dial, next) {
									if (params.fetchOnlyCustomThumb) {
										if (
											dial.thumb_source_type === 'local_file' ||
											(dial.thumb_source_type === 'screen' && dial.get_screen_method === 'manual')
										) {
											// fetch allowed
										} else {
											return setTimeout(next, 0);
										}
									}

									self._resolveDialThumb(dial, function (dataUrl) {
										//dial.thumb = dataUrl; Task 951
										next();
									});
								},
								function () {
									callback(list);
								}
							);
						} else {
							return callback(list);
						}
					});
				},
			});
		}, 1);
	};
	_resolveDialThumb = function (dial, cb, params) {
		const self = this;

		if (typeof dial.thumb !== 'string' || dial.thumb.indexOf('filesystem:') === -1) {
			return cb(dial.thumb);
		}

		self.getDialsPreview(
			[dial],
			function (list) {
				const response = list.shift();

				cb(response.thumb);
			},
			null,
			params
		);
	};
	getDialThumb = function (globalId, cb) {
		const { fvdSpeedDial } = this;
		const self = this;

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				//fields: ['thumb'],
				where: {
					global_id: globalId,
				},
				success: function (tx, results) {
					if (results.rows.length === 1) {
						const dial = results.rows[0];

						self._resolveDialThumb(
							dial,
							function (thumb) {
								cb(thumb);
							},
							{ format: 'dataurl' }
						);
					} else {
						cb(null);
					}
				},
				error: function (tx, ex) {
					console.warn(tx, ex);
				},
			});
		});
	};
	getDial = function (id, callback) {
		const { fvdSpeedDial } = this;
		const that = this;

		if (!isNaN(id)) {
			id = parseInt(id);
		} else {
			console.warn('dial id', id);
		}

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				fields: [
					'id',
					'rowid',
					'url',
					'display_url',
					'title',
					'auto_title',
					'thumb_source_type',
					'thumb_url',
					'position',
					'group_id',
					'clicks',
					'deny',
					'screen_maked',
					'thumb',
					'screen_delay',
					'thumb_width',
					'thumb_height',
					'get_screen_method',
					'update_interval',
					'global_id',
					'previewTitle',
					'preview_style',
				],
				rename: {
					rowid: 'id',
				},
				where: {
					rowid: id,
				},
				success: function (tx, results) {
					if (results.rows.length === 1) {
						const dial = results.rows[0];

						that._prepareDialData(dial);
						that.getDialsPreview([dial], function (list) {
							callback(list.shift());
						});
					} else {
						callback(null);
					}
				},
			});
		});
	};

	getDialDataList = function (dialId, dataList, callback) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				fields: dataList,
				where: {
					id: parseInt(dialId),
				},
				success: function (tx, results) {
					if (results.rows.length === 1) {
						callback(results.rows[0]);
					}
				},
			});
		});
	};

	addDial = function (addData, callback, hints) {
		const that = this;
		const { fvdSpeedDial } = this;
		addData = that.prepareDataType('dial', addData);

		hints = hints || [];
		let storeThumb = null;
		addData.thumb = addData.thumb || '';
		addData.screen_delay =
			addData.screen_delay || fvdSpeedDial.Prefs.get('sd.preview_creation_delay_default');
		const screen_maked = 0;
		let localFileData = null;
		let res = null;

		Utils.Async.chain([
			function (next) {
				checkLocalFile(addData.url, addData.thumb_source_type, addData.thumb_url, function (lf) {
					localFileData = lf;
					next();
				});
			},
			function (next) {
				if (localFileData) {
					for (const k in localFileData) {
						addData[k] = localFileData[k];
					}
					next();
				} else {
					if (addData.thumb_source_type === 'screen') {
						if (addData.thumb) {
							addData.screen_maked = 1; // thumb specified for screen type
						} else {
						}
					}

					next();
				}
			},
			function (next) {
				if (addData.thumb) {
					// store thumb separately
					storeThumb = addData.thumb;
					delete addData.thumb;
				}

				that.isDenyUrl(addData.url, function (deny) {
					if (deny && hints.indexOf('ignore_deny') === -1) {
						if (callback) {
							callback({
								result: false,
								error: 'url_deny',
							});
						}
					} else {
						that.nextDialPosition(addData.group_id, function (position) {
							if (!addData.position) {
								addData.position = position;
							}

							addData.clicks = addData.clicks || 0;
							addData.deny = addData.deny || 0;
							addData.screen_maked = addData.screen_maked || 0;

							if (!addData.global_id) {
								addData.global_id = that._generateGUID();
							}

							const insertData = that._getInsertData(addData);

							dbTransaction(function (tx) {
								dbInsert(fvdSpeedDial, {
									tx: tx,
									table: 'dials',
									set: insertData.dataObject,
									success: function (tx, results) {
										that._callDialsChangeCallbacks({
											action: 'add',
										});
										res = {
											id: insertData.dataObject.id,
											result: true,
										};
										next();
									},
									error: function (tx, error) {
										console.log('Error add dials', tx, error);
									},
								});
							});
						});
					}
				});
			},
			function (next) {
				if (!storeThumb) {
					return next();
				}

				// store thumb
				fvdSpeedDial.StorageSD.updateDial(
					res.id,
					{
						thumb: storeThumb,
					},
					next
				);
			},
			function () {
				if (callback) {
					callback(res);
				}
			},
		]);
	};
	syncFixDialsPositions = function (groupId, callback) {
		groupId = parseInt(groupId);

		const { fvdSpeedDial } = this;
		const that = this;

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				fields: ['id'],
				order: 'position',
				where: {
					group_id: groupId,
				},
				success: function (tx, dialsResult) {
					const dials = dialsResult.rows;
					let position = 1;

					Utils.Async.arrayProcess(
						dials,
						function (dial, arrayProcessCallback) {
							dbUpdate(fvdSpeedDial, {
								tx: tx,
								table: 'dials',
								//noResponse: true,
								set: {
									position: position,
								},
								where: {
									key: 'id',
									val: dial.id,
								},
								success: function (tx, results) {
									position++;
									arrayProcessCallback();
								},
								error: function (tx, error) {
									console.error('Query failed', error);
									arrayProcessCallback();
								},
							});
						},
						function () {
							that.onDataChanged.dispatch();
							callback();
						}
					);
				},
				error: function (tx, error) {
					console.log('Fail get data syncFixDialsPositions', tx, error);
					callback();
				},
			});
		}, 1);
	};
	syncDialData = function (globalId, fields, callback) {
		const { fvdSpeedDial } = this;

		fields = fields || ['rowid', '*'];
		dbTransaction(function (tx) {
			//need check
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				fields: fields.join(','),
				where: {
					global_id: globalId,
					//key: 'global_id', val: globalId
				},
				success: function (tx, results) {
					if (results.rows.length >= 1) {
						callback(results.rows[0]);
					} else {
						callback(null);
					}
				},
				error: function (tx, error) {
					console.log('Fail get syncDialData', arguments);
				},
			});
		}, 1);
	};
	syncRemoveDials = function (notRemoveDials, callback) {
		const { fvdSpeedDial } = this;
		const that = this;
		const removeInfo = {
			count: 0,
			removedFromGroups: [],
		}; // describes remove process info

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'groups',
				where: { sync: '1' },
				success: function (tx, gResults) {
					const groupsIn = {
						key: 'group_id',
						arr: [],
					};

					for (const i in gResults.rows) groupsIn.arr.push(gResults.rows[i].id);
					let whereNotIn = false;

					if (notRemoveDials.length > 0) {
						whereNotIn = {
							key: 'global_id',
							arr: notRemoveDials,
						};
					}

					dbSelect(fvdSpeedDial, {
						tx: tx,
						from: 'dials',
						whereIn: groupsIn,
						whereNotIn: whereNotIn,
						success: function (tx, dResults) {
							const dials = dResults.rows;

							Utils.Async.arrayProcess(
								dials,
								function (dial, arrayProcessCallback) {
									removeInfo.count++;
									removeInfo.removedFromGroups.push(dial.group_id);
									dbDelete(fvdSpeedDial, {
										tx: tx,
										from: 'dials',
										where: {
											key: 'id',
											val: dial.id,
										},
										success: function (tx, results) {
											that._callDialsChangeCallbacks({
												action: 'remove',
												data: {
													id: dial.rowid,
												},
											});
											arrayProcessCallback();
										},
										error: function (err) {
											console.warn('Dial delete fail', err);
										},
									});
								},
								function () {
									AppLog.info('sync remove dials not in list, removed', removeInfo.count);
									callback(removeInfo);
								}
							);
						},
						error: function (tx, error) {
							console.warn('Fail get dResults', error);
						},
					});
				},
				error: function (tx, error) {
					console.warn('Fail get gResults', error);
				},
			});
		}, 1);
	};
	syncUpdateMass = function (globalIds, data, callback) {
		const { fvdSpeedDial } = this;
		const self = this;
		let globalResult = false;

		dbTransaction(function (tx) {
			Utils.Async.arrayProcess(
				globalIds,
				function (globalId, nextId) {
					dbUpdate(fvdSpeedDial, {
						tx: tx,
						table: 'dials',
						set: data,
						where: {
							key: 'global_id',
							val: globalId,
						},
						success: function (tx, result) {
							if (result && typeof result === 'object' && result.rowsAffected) {
								globalResult = true;
							}

							nextId();
						},
						error: function (tx, error) {
							console.warn('Update fail', globalId, error);
							nextId();
						},
					});
				},
				function () {
					self.onDataChanged.dispatch();

					if (callback) {
						callback({
							result: globalResult,
						});
					}
				}
			);
		}, 1);
	};
	syncSaveDial = function (dial, callback) {
		const {
			fvdSpeedDial: { ThumbMaker },
		} = this;

		const that = this;
		let oldData = null;
		let nullThumbSrc = false;
		const saveInfo = {}; // describes dial info with it saves

		this.dialExistsByGlobalId(dial.global_id, function (exists) {
			that.syncGetGroupId(dial.group_global_id, function (groupId) {
				if (groupId === 0) {
					console.info('Cannot add dial, group not found', dial);
					callback(saveInfo); // cannot add dial, group not found
				} else {
					dial.group_id = groupId;
					saveInfo.group_id = groupId;
					let deny = 0;

					Utils.Async.chain([
						function (chainCallback) {
							that.isDenyUrl(dial.url, function (aDeny) {
								deny = aDeny ? 1 : 0;
								chainCallback();
							});
						},
						function (chainCallback) {
							if (exists) {
								that.syncDialData(
									dial.global_id,
									[
										'rowid',
										'thumb_source_type',
										'thumb_url',
										'url',
										'group_id',
										'screen_maked',
										'get_screen_method',
									],
									function (result) {
										if (result) {
											oldData = result;

											// check if dials moved
											if (oldData.group_id !== dial.group_id) {
												saveInfo.move = {
													from: oldData.group_id,
													to: dial.group_id,
												};
											}

											if (oldData.thumb_source_type !== dial.thumb_source_type) {
												nullThumbSrc = true;
											} else {
												if (dial.thumb_source_type === 'screen') {
													if (dial.url !== oldData.url) {
														nullThumbSrc = true;
													} else if (dial.get_screen_method !== oldData.get_screen_method) {
														nullThumbSrc = true;
													}
												} else if (dial.thumb_source_type === 'url') {
													if (dial.thumb_url !== oldData.thumb_url) {
														nullThumbSrc = true;
													}
												} else if (dial.thumb_source_type === 'local_file') {
													/*
																 *
																 * process local file here
																 *
																if( dial._previewContent ){
																var newContentMd5 = fvd_speed_dial_Misc.md5( dial._previewContent );
																var tmp = oldData.thumb_url.split( /[\/\\]/ );
																var fileName = tmp[tmp.length - 1];
																if( fileName.indexOf( newContentMd5 ) == -1 ){
																	nullThumbSrc = true;
																}
																}
																*/
												}
											}

											if (nullThumbSrc) {
												dial.screen_maked = 0;
											} else {
												dial.screen_maked = oldData.screen_maked;
											}

											chainCallback();
										} else {
											nullThumbSrc = true;
											chainCallback();
										}
									}
								);
							} else {
								nullThumbSrc = true;
								chainCallback();
							}
						},

						function (chainCallback) {
							if (
								(nullThumbSrc && dial.thumb_source_type === 'url') ||
								(dial._previewUrl && dial.thumb_source_type === 'local_file') ||
								(dial._previewUrl && dial.thumb_source_type === 'screen')
							) {
								// need to grab thumb from url
								let loadContentUrl = dial.thumb_url;

								if (
									(dial._previewUrl && dial.thumb_source_type === 'local_file') ||
									(dial._previewUrl && dial.thumb_source_type === 'screen')
								) {
									loadContentUrl = dial._previewUrl;
								}

								ThumbMaker.getImageDataPath(
									{
										imgUrl: loadContentUrl,
										screenWidth: 364, // SpeedDial.getMaxCellWidth(),
									},
									function (dataUrl, thumbSize) {
										delete dial._previewUrl;
										dial.thumb = dataUrl;
										chainCallback();
									}
								);
							} else {
								chainCallback();
							}
						},
						function (chainCallback) {
							const toDb = {
								url: dial.url,
								title: dial.title,
								auto_title: dial.auto_title,
								thumb_url: dial.thumb_url,
								thumb_source_type: dial.thumb_source_type,
								thumb_width: dial.thumb_width,
								thumb_height: dial.thumb_height,
								group_id: dial.group_id,
								deny: deny,
								position: dial.position,
								global_id: dial.global_id,
								screen_maked: dial.screen_maked,
								update_interval: dial.update_interval || '',
							};

							if (dial.get_screen_method) {
								toDb.get_screen_method = dial.get_screen_method;
							}

							if (dial.thumb) {
								toDb.thumb = dial.thumb;
							}

							if (exists) {
								that.updateDial(oldData.rowid, toDb, function () {
									chainCallback();
								});
							} else {
								that.addDial(
									toDb,
									function () {
										chainCallback();
									},
									['ignore_deny']
								);
							}
						},
						function (chainCallback) {
							if (dial.thumb_source_type === 'local_file') {
								chainCallback();
							} else {
								chainCallback();
							}
						},
						function () {
							callback(saveInfo);
						},
					]);
				}
			});
		});
	};
	deleteDial = function (dialId, callback) {
		const that = this;

		Utils.Async.chain([
			function (next) {
				fvdSpeedDial.StorageSD.getDial(dialId, function (d) {
					if (!d || typeof d !== 'object') {
						return next();
					}

					// GA dial remove event track
					that.getGroupTitleById(d.group_id, (groupTitle) => {
						const GADialAddParams = {
							title: d.title,
							url: getCleanUrl(d.url),
							dial_id: d.id,
							group: groupTitle,
							group_id: d.group_id,
						};
						Analytics.fireRemoveDialEvent(GADialAddParams);
					});

					let thumb = String(d.thumb) || '';

					if (thumb.indexOf('blob:') === 0) {
						try {
							window.URL.revokeObjectURL(thumb);
						} catch (ex) {
							console.warn(ex);
						}
					}

					if (d.thumbSource && d.thumbSource.indexOf('filesystem:') === 0) {
						thumb = String(d.thumbSource);
					}

					if (thumb.indexOf('filesystem:') !== 0) {
						return next();
					}

					FileSystemSD.removeByURL(thumb, function () {
						next();
					});
				});
			},
			function () {
				dbTransaction(function (tx) {
					dbDelete(fvdSpeedDial, {
						tx: tx,
						from: 'dials',
						where: {
							key: 'id',
							val: dialId,
						},
						success: function (tx, results) {
							if (callback) {
								that._callDialsChangeCallbacks({
									action: 'remove',
									data: {
										id: dialId,
									},
								});
								callback({
									result: results.rowsAffected === 1,
								});
							}
						},
					});
				}, 1);
			},
		]);
	};
	clearDials = function (callback, where) {
		const { fvdSpeedDial } = this;
		const that = this;
		let whereIn = false;

		if (where) {
			if (where && typeof where === 'object' && where.key) {
				whereIn = where;
			} else {
				console.error('Wrong where', where);
			}
		}

		dbTransaction(function (tx) {
			//need check
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				fields: ['rowid', 'thumb', 'id'],
				whereIn: whereIn,
				success: function (tx, results) {
					const r = [];
					const ids = [];

					for (let i = 0; i !== results.rows.length; i++) {
						r.push(results.rows[i]);
						ids.push(results.rows[i].id);
					}
					Utils.Async.arrayProcess(
						r,
						function (row, next) {
							that._callDialsChangeCallbacks({
								action: 'remove',
								data: {
									id: row.rowid,
								},
							});

							if (
								!row.thumb ||
								typeof row.thumb !== 'string' ||
								row.thumb.indexOf('filesystem:') !== 0
							) {
								return next();
							}

							FileSystemSD.removeByURL(row.thumb, function () {
								next();
							});
						},
						function () {
							dbDelete(fvdSpeedDial, {
								tx: tx,
								from: 'dials',
								whereIn: !ids ? false : { key: 'id', arr: ids },
								force: true,
								success: function () {
									if (callback) {
										Broadcaster.sendMessage({
											action: 'storage:dialsCleared',
										});
										callback();
									}
								},
							});
						}
					);
				},
			});
		});
	};
	updateDial = function (dialId, data, callback) {
		const {
			fvdSpeedDial: { ThumbMaker, HiddenCaptureQueue },
		} = this;

		callback = callback || function () {};
		const that = this;
		let global_id;

		try {
			if (data.thumb_source_type === 'screen' && data.screen_maked === 0) {
				HiddenCaptureQueue.removeFromQueueById(dialId);
			}
		} catch (ex) {
			console.warn(ex);
		}
		Utils.Async.chain([
			function (next) {
				that.dialGlobalId(dialId, function (_guid) {
					if (_guid) {
						global_id = _guid;
					}

					next();
				});
			},
			function (next) {
				if (!data.thumb || typeof data.thumb !== 'string') {
					return next();
				}

				if (data.thumb.indexOf('data:image/png;base64,https://') !== -1) {
					data.thumb = data.thumb.replace('data:image/png;base64,https://', 'https://');
				}

				if (
					data.thumb.indexOf('filesystem:') !== -1 ||
					data.thumb.indexOf('blob:') !== -1 ||
					data.thumb.indexOf('file:') !== -1 ||
					data.thumb.indexOf('http') === 0
					// || data.thumb.indexOf('data:') === 0
				) {
					return next(data.thumb);
				}

				const fname = global_id || dialId;

				Utils.Async.chain([
					function (next1) {
						if (typeof document === 'undefined') {
							console.info('document is undefined');
							next1();
						} else {
							const img = document.createElement('img');
							img.crossOrigin = 'anonymous';
							img.setAttribute('src', data.thumb);
							img.onerror = function (e) {
								console.warn('Image error', e);
							};
							img.onload = function () {
								if (img.width <= 320) {
									next1();
								} else {
									ThumbMaker.resize(img, 320, function (imgUrl, size) {
										data.thumb = imgUrl;
										next1();
									});
								}
							};
						}
					},
					function (next1) {
						// store thumb
						const thumb = Utils.dataURIToBlob(data.thumb);
						const ext = Utils.typeToExt(thumb.type);
						const thumbName = '/' + Config.FS_DIALS_PREVIEW_DIR + '/' + fname + '.' + ext;

						if (typeof webkitRequestFileSystem === 'undefined') {
							console.info('webkitRequestFileSystem is undefined');
							next();
						} else {
							FileSystemSD.write(thumbName, thumb, function (err, url) {
								if (err) {
									throw err;
								}

								data.thumb = url;
								next();

								if (FileSystemSD.hasOwnProperty('deleteBlobUrl')) {
									FileSystemSD.deleteBlobUrl(thumbName);
								}
							});
						}
					},
				]);
			},
			function () {
				const tmp = that._getUpdateData(data);
				const dataArray = tmp.dataArray;
				const strings = tmp.strings;

				dbTransaction(function (tx) {
					dbSelect(fvdSpeedDial, {
						tx: tx,
						from: 'dials',
						where: {
							key: 'id',
							val: dialId,
						},
						success: function (tx, results) {
							let setObj = {};

							for (const k in strings) {
								const v = String(strings[k]).split('`').join('').split(' ').shift();

								setObj[v] = dataArray[k];
							}

							if (data.thumb) {
								if (String(setObj.thumb).indexOf('blob:') === 0) {
									delete setObj.thumb; // Remove blob thumbs
								} else {
									setObj['thumb_version'] = parseInt(results.thumb_version) || 1;
								}
							}

							setObj = that.prepareDataType('dial', setObj);

							dbUpdate(fvdSpeedDial, {
								tx: tx,
								table: 'dials',
								set: setObj,
								where: {
									key: 'id',
									val: dialId,
								},
								success: function (tx, results) {
									that._callDialsChangeCallbacks({
										action: 'update',
										data: {
											id: dialId,
											data: data,
										},
									});

									if (callback) {
										callback({
											result: results.rowsAffected === 1,
											dial: data,
										});
									}
								},
							});
						},
					});
				});
			},
		]);
	};
	moveDial = function (dialId, groupId, callback) {
		groupId = parseInt(groupId);

		const that = this;

		this.nextDialPosition(groupId, function (newPosition) {
			that.updateDial(
				dialId,
				{
					group_id: groupId,
					position: newPosition,
				},
				function (result) {
					callback(result);
				}
			);
		});
	};
	dialCanSync = function (globalId, callback) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			//need check
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				fields: ['id', 'group_id'],
				where: { global_id: globalId },
				success: function (tx, results_d) {
					if (results_d.rows.length) {
						dbSelect(fvdSpeedDial, {
							tx: tx,
							from: 'groups',
							fields: ['id', 'sync'],
							where: { id: results_d.rows[0]['group_id'] },
							success: function (tx, results) {
								try {
									callback(results.rows[0].sync === 1);
								} catch (ex) {
									console.warn(ex);
									callback(true);
								}
							},
						});
					}
				},
			});
		}, 1);
	};
	insertDialUpdateStorage = function (dialId, sign, interval, newDialPosition, callback) {
		const { fvdSpeedDial } = this;
		const that = this;

		this.getDialDataList(dialId, ['group_id'], function (dial) {
			dbTransaction(function (tx) {
				//need check
				const changedGlobalIds = [];
				const positionGlobalIds = {};

				Utils.Async.chain([
					function (chainCallback) {
						dbSelect(fvdSpeedDial, {
							tx: tx,
							from: 'dials',
							fields: ['global_id', 'position'],
							where: {
								'group_id': dial.group_id,
								'position >=': interval.start,
								'position <=': interval.end,
							},
							success: function (tx, results) {
								for (let i = 0; i !== results.rows.length; i++) {
									changedGlobalIds.push(results.rows[i].global_id);
									positionGlobalIds[results.rows[i].global_id] = results.rows[i].position;
								}
								chainCallback();
							},
						});
					},
					function (chainCallback) {
						Utils.Async.arrayProcess(
							changedGlobalIds,
							function (globalID, arrayProcessCallback) {
								let position = parseInt(positionGlobalIds[globalID]);

								if (sign === '-') position--;
								else position++;

								dbUpdate(fvdSpeedDial, {
									tx: tx,
									table: 'dials',
									set: {
										position: position,
									},
									where: {
										key: 'global_id',
										val: globalID,
									},
									success: function (tx, results) {
										position++;
										arrayProcessCallback();
									},
									error: function (tx, error) {
										console.error('Got and sql error', error);
										arrayProcessCallback();
									},
								});
							},
							function () {
								that.updateDial(
									dialId,
									{
										position: newDialPosition,
									},
									function () {
										chainCallback();
									}
								);
							}
						);
					},
					function () {
						callback(changedGlobalIds);
					},
				]);
			});
		});
	};
	/**
	 * params is url, excludeIds, finalCheck
	 */
	dialExists = function (params, callback) {
		const { fvdSpeedDial } = this;
		const that = this;

		params = params || {};
		let additionalWhere = false;

		if (params.excludeIds) {
			additionalWhere = {
				key: 'rowid',
				arr: params.excludeIds,
			};
		}

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				where: {
					url: params.url,
				},
				whereNotIn: additionalWhere,
				success: function (tx, results) {
					const exists = Boolean(results.rows.length);

					if (exists) {
						return callback(exists);
					}

					return callback(exists); // Task #1143
				},
			});
		});
	};
	dialExistsByGlobalId = function (globalId, callback) {
		const { fvdSpeedDial } = this;
		//ff match results!

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				where: {
					global_id: globalId,
				},
				success: function (tx, results) {
					const exists = Boolean(results.rows.length);

					callback(exists);
				},
			});
		});
	};
	getDialByGroupId = function (globalId, callback) {
		const { fvdSpeedDial } = this;
		//ff match results!

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				where: {
					global_id: globalId,
				},
				success: function (tx, results) {
					callback(results.rows[0]);
				},
			});
		});
	};
	getAllDialList = function (callback) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				success: function (tx, results) {
					callback(results.rows);
				},
			});
		});
	};
	getDialListByGroupId = function (groupId, callback) {
		const { fvdSpeedDial } = this;
		//ff match results!

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				where: {
					group_id: groupId,
				},
				success: function (tx, results) {
					callback(results.rows);
				},
			});
		});
	};
	nextDialPositionCache = {};
	nextDialPosition = function (group_id, callback) {
		const { fvdSpeedDial } = this;
		const ts = this;
		let max = 0;

		if (ts.nextDialPositionCache[group_id]) {
			ts.nextDialPositionCache[group_id]++;
			callback(parseInt(ts.nextDialPositionCache[group_id]));
			return;
		}

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				maxOf: {
					field: 'position',
					name: 'cnt',
				},
				where: {
					group_id,
				},
				success: function (tx, results) {
					try {
						if (results.rows.length) {
							max = results.rows[0].cnt;
						}

						ts.nextDialPositionCache[group_id] = ++max;
					} catch (ex) {
						console.warn('nextDialPosition:', ex);
						max = 1;
					}
					callback(max);
				},
			});
		});
	};
	countDials = function (params, callback) {
		const { fvdSpeedDial } = this;

		if (typeof params === 'function') {
			callback = params;
			params = {};
		}

		if (CACHE['countDials']) {
			callback(CACHE['countDials']);
			return true;
		}

		params = params || {};
		let distinct = 'url';

		if (params.uniqueUrl) distinct = 'url';

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				fields: ['url'],
				countAs: 'cnt',
				distinct: distinct,
				where: { deny: 0 },
				success: function (tx, results) {
					const count = results.rows.length ? results.rows[0].cnt : 0;

					CACHE['countDials'] = count;
					callback(count);
				},
			});
		});
	};
	refreshDenyDials = function (callback) {
		const { fvdSpeedDial } = this;
		const that = this;
		// go away all dials and refresh its deny field

		dbTransaction(function (tx) {
			//need check
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'dials',
				fields: ['id', 'rowid', 'url', 'deny'],
				success: function (tx, results) {
					for (let i = 0; i !== results.rows.length; i++) {
						const dial = results.rows[i];

						(function (i, dial) {
							that.isDenyUrl(dial.url, function (deny) {
								const newDeny = deny ? 1 : 0;

								if (newDeny !== dial.deny) {
									that.updateDial(
										dial.rowid,
										{
											deny: newDeny,
										},
										function () {
											if (i === results.rows.length - 1) {
												if (callback) {
													callback();
												}
											}
										}
									);
								} else {
									if (i === results.rows.length - 1) {
										if (callback) {
											callback();
										}
									}
								}
							});
						})(i, dial);
					}

					if (results.rows.length === 0) {
						if (callback) {
							callback();
						}
					}
				},
			});
		});
	};
	// deny functions
	deny = function (type, sign, callback) {
		const { fvdSpeedDial } = this;

		if (!sign) {
			throw 'deny_empty_sign';
		}

		const firstSign = sign;

		if (type === 'host') {
			if (Utils.isValidUrl(sign)) {
				sign = Utils.parseUrl(sign, 'host');
			}
		} else if (type === 'url') {
			if (!Utils.isValidUrl(sign)) {
				throw 'deny_invalid_url';
			}

			sign = Utils.urlToCompareForm(sign);
		} else {
			throw 'deny_wrong_type';
		}

		const that = this;

		this._denySignExists(type, sign, function (exists) {
			if (!exists) {
				dbTransaction(function (tx) {
					dbInsert(fvdSpeedDial, {
						tx: tx,
						table: 'deny',
						set: {
							type: type,
							sign: firstSign,
							effective_sign: sign,
						},
						success: function (tx, results) {
							if (callback) {
								callback({
									id: results.insertId,
									result: results.rowsAffected === 1,
								});
							}

							that._callDenyChangeCallbacks({
								action: 'add',
								type: type,
								sign: sign,
							});
						},
					});
				});
			} else {
				callback({
					result: false,
					error: 'deny_already_exists',
				});
			}
		});
	};
	editDeny = function (id, data, callback) {
		const { fvdSpeedDial } = this;
		const that = this;

		data.effective_sign = Utils.urlToCompareForm(data.sign);
		this._denySignExists(
			data.type,
			data.effective_sign,
			function (exists) {
				if (exists) {
					if (callback) {
						callback({
							result: false,
							error: 'deny_already_exists',
						});
					}
				} else {
					const updateData = that._getUpdateData(data);

					dbTransaction(function (tx) {
						//need check
						dbUpdate(fvdSpeedDial, {
							tx: tx,
							table: 'deny',
							set: updateData.dataObject,
							where: { key: 'rowid', val: id },
							success: function (tx, results) {
								if (callback) {
									callback({
										result: results.rowsAffected === 1,
									});
								}

								that._callDenyChangeCallbacks({
									action: 'edit',
								});
							},
						});
					});
				}
			},
			id
		);
	};
	denyList = function (callback) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			//need check
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'deny',
				rename: { rowid: 'id' },
				fields: ['id', 'rowid', 'effective_sign', 'sign', 'type'],
				success: function (tx, results) {
					const result = [];

					for (let i = 0; i !== results.rows.length; i++) {
						result.push(results.rows[i]);
					}
					callback(result);
				},
			});
		});
	};
	removeDeny = function (id, callback) {
		const { fvdSpeedDial } = this;
		const that = this;

		dbTransaction(function (tx) {
			dbDelete(fvdSpeedDial, {
				tx: tx,
				from: 'deny',
				where: {
					key: 'id',
					val: id,
				},
				success: function (tx, results) {
					if (callback) {
						callback();
					}

					that._callDenyChangeCallbacks({
						action: 'remove',
					});
				},
			});
		});
	};
	clearDeny = function (callback) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			dbDelete(fvdSpeedDial, {
				tx: tx,
				from: 'deny',
				force: true,
				success: function (tx, results) {
					if (callback) {
						callback();
					}
				},
			});
		});
	};
	isDenyUrl = function (url, callback) {
		const { fvdSpeedDial } = this;
		const that = this;

		url = url || '';
		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'deny',
				fields: ['effective_sign', 'type'],
				success: function (tx, results) {
					let result = false;
					let denyDetails = null;

					for (let i = 0, len = results.rows.length; i < len; i++) {
						const item = results.rows[i];

						switch (item.type) {
							case 'url':
								result = Utils.isIdenticalUrls(item.effective_sign, url);
								break;
							case 'host':
								const host = Utils.parseUrl(url, 'host');

								result = Utils.isIdenticalHosts(item.effective_sign, host, {
									ignoreSubDomains: true,
								});
								break;
						}

						if (result) {
							denyDetails = {
								deny: item,
							};
							break;
						}
					}
					callback(result, denyDetails);
				},
			});
		});
	};
	/* Groups */
	resetDefaultGroupId = function () {
		const { fvdSpeedDial } = this;

		this.groupsList(function (groups) {
			const group = groups[0];
			const newId = group.id;

			fvdSpeedDial.Prefs.set('sd.default_group', newId);
		});
	};
	groupIdByGlobalId = function (globalId, callback) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'groups',
				fields: ['id'],
				where: { global_id: globalId },
				success: function (tx, results) {
					let id = null;

					if (results.rows.length === 1) {
						id = results.rows[0].id;
					}

					callback(id);
				},
			});
		});
	};
	groupGlobalId = function (id, callback) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'groups',
				fields: ['id', 'global_id'],
				where: { id: id },
				success: function (tx, results) {
					let globalId = null;

					if (results.rows.length === 1) {
						globalId = results.rows[0].global_id;
					}

					callback(globalId);
				},
			});
		});
	};
	addDialsCallback = function (callback) {
		if (this._dialsChangeCallbacks.indexOf(callback) !== -1) {
			return;
		}

		this._dialsChangeCallbacks.push(callback);
	};
	removeDialsCallback = function (callback) {
		const index = this._dialsChangeCallbacks.indexOf(callback);

		if (index === -1) {
			return;
		}

		this._dialsChangeCallbacks.splice(index, 1);
	};
	addGroupsCallback = function (callback) {
		if (this._groupsChangeCallbacks.indexOf(callback) !== -1) {
			return;
		}

		this._groupsChangeCallbacks.push(callback);
	};
	removeGroupsCallback = function (callback) {
		const index = this._groupsChangeCallbacks.indexOf(callback);

		if (index === -1) {
			return;
		}

		this._groupsChangeCallbacks.splice(index, 1);
	};
	groupAdd = function (params, callback, forcePosition) {
		const { fvdSpeedDial } = this;
		const that = this;
		let position;

		if (typeof params.sync === 'undefined') {
			params.sync = 1;
		}

		if (params.hasOwnProperty('forcePosition')) {
			forcePosition = params.forcePosition;
			delete params.forcePosition;
		}

		Utils.Async.chain([
			function (next) {
				that.groupExists(
					{
						name: params.name,
					},
					function (exists) {
						if (exists) {
							throw 'group_exists';
						}

						next();
					}
				);
			},
			function (next) {
				that.nextGroupPosition(function (nextPosition) {
					position = nextPosition;
					next();
				});
			},
			function (next) {
				if (forcePosition === 'top') {
					position = 1;
					dbTransaction(function (tx) {
						dbSelect(fvdSpeedDial, {
							tx: tx,
							from: 'groups',
							fields: ['id', 'position'],
							success: function (tx, results) {
								for (const key in results.rows) {
									dbUpdate(fvdSpeedDial, {
										tx: tx,
										table: 'groups',
										set: {
											position: results.rows[key].position + 1,
										},
										where: {
											key: 'id',
											val: results.rows[key].id,
										},
									});
								}
								next();
							},
						});
					});
				} else {
					if (!isNaN(forcePosition)) {
						position = forcePosition;
					}

					next();
				}
			},
			function () {
				if (typeof params.position !== 'undefined') {
					position = params.position;
				}

				if (!params.global_id) {
					params.global_id = that._generateGUID();
				}

				dbTransaction(function (tx) {
					dbInsert(fvdSpeedDial, {
						tx: tx,
						table: 'groups',
						set: {
							position: position,
							name: params.name,
							global_id: params.global_id,
							sync: params.sync,
						},
						success: function (tx, results) {
							if (callback) {
								callback({
									id: results.insertId,
									result: results.rowsAffected === 1,
								});
							}

							that._callGroupsChangeCallbacks({
								action: 'add',
							});
						},
					});
				});
			},
		]);
	};
	syncFixGroupsPositions = function (callback) {
		const { fvdSpeedDial } = this;
		const that = this;
		const query = {
			from: 'groups',
			fields: ['id'],
			order: 'position',
		};

		this._rawList(query, function (list) {
			let position = 1;

			Utils.Async.arrayProcess(
				list,
				function (group, arrayProcessCallback) {
					dbTransaction(function (tx) {
						dbUpdate(fvdSpeedDial, {
							tx: tx,
							table: 'groups',
							set: {
								position: position,
							},
							where: {
								key: 'id',
								val: group.id,
							},
							success: function (tx, results) {
								position++;
								arrayProcessCallback();
							},
							error: function (tx, error) {
								console.error('Got and sql error', error);
								arrayProcessCallback();
							},
						});
					}, 1);
				},
				function () {
					that.onDataChanged.dispatch();
					callback();
				}
			);
		});
	};
	getSafeGroupName = function (group) {
		if (
			group.global_id &&
			group.global_id === 'default' &&
			(typeof group.name === 'undefined' || !group.name || group.name === 'undefined')
		) {
			group.name = _('bg_default_group_name');
		}

		return group.name;
	};
	// save group for sync
	syncSaveGroup = function (group, callback) {
		const { fvdSpeedDial } = this;

		callback = callback || function () {};
		const that = this;

		this.groupExistsByGlobalId(group.global_id, function (exists) {
			if (exists) {
				dbTransaction(function (tx) {
					//need check
					dbUpdate(fvdSpeedDial, {
						tx: tx,
						table: 'groups',
						set: {
							name: group.name, //that.getSafeGroupName(group),
							position: group.position,
							//sync : 1
						},
						where: {
							key: 'global_id',
							val: group.global_id,
						},
						success: function (tx, results) {
							that.onDataChanged.dispatch();
							callback();
						},
						error: function (tx, err) {
							//that.onDataChanged.dispatch();
							//callback();
						},
					});
				}, 1);
			} else {
				dbTransaction(function (tx) {
					dbInsert(fvdSpeedDial, {
						tx: tx,
						table: 'groups',
						set: {
							name: group.name, //that.getSafeGroupName(group),
							position: group.position,
							global_id: group.global_id,
							sync: 1,
						},
						success: function (tx, results) {
							that.onDataChanged.dispatch();
							callback();
						},
						error: function (tx, err) {
							//that.onDataChanged.dispatch();
							//callback();
						},
					});
				}, 1);
			}
		});
	};
	// get group id by global id
	syncGetGroupId = function (globalId, callback) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'groups',
				fields: ['id'],
				where: { global_id: globalId },
				success: function (tx, results) {
					let groupId = 0;

					if (results.rows.length === 1) {
						groupId = results.rows[0].id;
					}

					callback(groupId);
				},
			});
		}, 1);
	};
	// remove groups that not in list
	syncRemoveGroups = function (notRemoveIds, callback) {
		const { fvdSpeedDial } = this;
		const that = this;
		const query = {
			from: 'groups',
			fields: ['id'],
			where: { sync: 1 },
			whereNotIn: notRemoveIds.length ? { key: 'global_id', arr: notRemoveIds } : false,
		};

		this._rawList(query, function (groups) {
			Utils.Async.arrayProcess(
				groups,
				function (group, arrayProcessCallback) {
					const groupId = group.id;

					dbTransaction(function (tx) {
						dbDelete(fvdSpeedDial, {
							tx: tx,
							from: 'dials',
							where: { key: 'group_id', val: groupId },
							success: function (tx, results) {
								dbDelete(fvdSpeedDial, {
									tx: tx,
									from: 'groups',
									where: { key: 'id', val: groupId },
									success: function (tx, results) {
										arrayProcessCallback();
									},
									error: function (tx, ex) {
										console.warn(tx, ex);
									},
								});
							},
							error: function (tx, ex) {
								console.warn(tx, ex);
							},
						});
					}, 1);
				},
				function () {
					AppLog.info('sync remove groups not in list, removed', groups.length);
					that.onDataChanged.dispatch();
					callback(groups.length);
				}
			);
		});
	};
	getGroup = function (groupId, callback) {
		const { fvdSpeedDial } = this;

		const where = {};

		if (!isNaN(groupId)) {
			where.id = parseInt(groupId);
		} else {
			where.global_id = groupId;
		}

		dbSelect(fvdSpeedDial, {
			tx: true,
			from: 'groups',
			fields: ['id', 'name', 'sync', 'global_id'],
			where,
			success: function (tx, results) {
				if (!results.rows.length) {
					callback(null);
				} else {
					dbSelect(fvdSpeedDial, {
						tx: tx,
						from: 'dials',
						countAs: 'cnt',
						where: { group_id: results.rows[0].id },
						success: function (tx, results_d) {
							results.rows[0]['count_dials'] = results_d.rows.length ? results_d.rows[0].cnt : 0;
							let group = null;

							if (results.rows.length === 1) {
								group = results.rows[0];
							}

							callback(group);
						},
					});
				}
			},
		});
	};
	getGroupTitleById = function (groupId, callback) {
		this.getGroup(groupId, (group) => {
			let groupTitle = 'Popular';

			if (group) {
				switch (group.global_id) {
					case defaultGroupTitles.recommend.key:
						groupTitle = defaultGroupTitles.recommend.value;
						break;
					case defaultGroupTitles.sponsoredst.key:
						groupTitle = defaultGroupTitles.sponsoredst.value;
						break;
					case defaultGroupTitles.default.key:
						groupTitle = defaultGroupTitles.default.value;
						break;
					default:
						groupTitle = 'Other';
				}
			}

			callback(groupTitle, group);
		});
	};
	groupsCount = function (callback) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			//need check
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'groups',
				countAs: 'cnt',
				success: function (tx, results) {
					callback(results.rows.length ? results.rows[0].cnt : 0);
				},
			});
		});
	};
	groupsList = function (callback) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'groups',
				order: 'position',
				success: function (tx, results_g) {
					const data = [];

					dbSelect(fvdSpeedDial, {
						tx: tx,
						from: 'dials',
						success: function (tx, results) {
							const counts = {};

							for (let d = 0; d !== results.rows.length; d++) {
								counts[results.rows[d].group_id] = 1 + (counts[results.rows[d].group_id] || 0);
							}
							for (let i = 0; i !== results_g.rows.length; i++) {
								data[i] = results_g.rows[i];
								data[i]['count_dials'] = counts[data[i].id] || 0;

								if (
									data[i].global_id === 'default' &&
									(typeof data[i].name === 'undefined' ||
										!data[i].name ||
										data[i].name === 'undefined')
								) {
									data[i].name = _('bg_default_group_name');
								}
							}
							AppLog.info('Groups list queried successully, count:', data.length);
							callback(data);
						},
					});
				},
				error: function (tx, error) {
					AppLog.err('Fail query groups list:', err.message);
				},
			});
		});
	};
	groupsRawList = function (params, callback) {
		params = params || {};
		let whereSQL = false;

		if (params.where) {
			whereSQL = params.where;
		}

		const query = {
			from: 'groups',
			whereSQL: whereSQL,
		};

		this._rawList(query, callback);
	};
	groupUpdate = function (groupId, data, callback) {
		groupId = parseInt(groupId);
		const { fvdSpeedDial } = this;
		const { Sync } = fvdSpeedDial;

		const that = this;
		const tmp = this._getUpdateData(data);
		const dataArray = tmp.dataArray;
		const strings = tmp.strings;

		dataArray.push(groupId);
		let syncChanged = false;

		Utils.Async.chain([
			function (chainCallback) {
				if (typeof data.sync !== 'undefined') {
					that.getGroup(groupId, function (group) {
						if (group.sync !== data.sync) {
							syncChanged = true;
						}

						chainCallback();
					});
				} else {
					chainCallback();
				}
			},
			function () {
				const setObj = dbGenerateSet(strings, dataArray);

				dbTransaction(function (tx) {
					dbUpdate(fvdSpeedDial, {
						tx: tx,
						table: 'groups',
						set: setObj,
						where: { key: 'id', val: dataArray.pop() },
						success: function (tx, results) {
							if (syncChanged && Sync.groupSyncChanged) {
								Sync.groupSyncChanged(groupId, function () {
									if (callback) {
										callback({
											result: results.rowsAffected === 1,
										});
									}
								});
							} else {
								if (callback) {
									callback({
										result: results.rowsAffected === 1,
									});
								}
							}

							that._callGroupsChangeCallbacks({
								action: 'update',
							});
						},
					});
				});
			},
		]);
	};
	groupDelete = function (groupId, callback) {
		groupId = parseInt(groupId);

		const { fvdSpeedDial } = this;
		const that = this;

		dbTransaction(function (tx) {
			dbDelete(fvdSpeedDial, {
				tx: tx,
				from: 'groups',
				where: {
					key: 'id',
					val: groupId,
				},
				success: function (tx, results) {
					try {
						callback({
							result: results.rowsAffected === 1,
						});
						that._callGroupsChangeCallbacks({
							action: 'remove',
							groupId: groupId,
						});
					} catch (ex) {
						console.warn('groupDelete:', ex);
					}
				},
				error: function (tx, err) {
					console.warn(tx, err);
				},
			});
		});
	};

	groupDeleteByGlobalID = function (globalId, callback) {
		const { fvdSpeedDial } = this;
		const that = this;

		dbTransaction(function (tx) {
			dbDelete(fvdSpeedDial, {
				tx: tx,
				from: 'groups',
				where: {
					key: 'global_id',
					val: globalId,
				},
				success: function (tx, results) {
					try {
						callback({
							result: results.rowsAffected === 1,
						});
						that._callGroupsChangeCallbacks({
							action: 'remove',
							global_id: globalId,
						});
					} catch (ex) {
						console.warn('groupDelete:', ex);
					}
				},
				error: function (tx, err) {
					console.warn(tx, err);
				},
			});
		});
	};

	clearGroups = function (callback, where) {
		const { fvdSpeedDial } = this;
		const self = this;

		where = where || false;

		if (where && typeof where !== 'object') {
			console.error('WHERE must not be a string', where);
		}

		dbTransaction(function (tx) {
			dbDelete(fvdSpeedDial, {
				tx: tx,
				from: 'groups',
				where: where,
				force: true,
				success: function (tx, results) {
					self.onDataChanged.dispatch();

					if (callback) {
						callback();
					}
				},
				error: function (tx, ex) {
					console.warn(tx, ex);
				},
			});
		});
	};
	nextGroupPosition = function (callback) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'groups',
				maxOf: {
					field: 'position',
					name: 'maxpos',
				},
				success: function (tx, results) {
					try {
						let max = 1;

						if (results.rows.length) max = results.rows[0].maxpos + 1;

						callback(max);
					} catch (ex) {
						console.warn('nextGroupPosition:', ex);
					}
				},
			});
		});
	};
	groupCanSyncById = function (id, callback) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'groups',
				where: { id: id },
				fields: ['id', 'sync'],
				success: function (tx, results) {
					try {
						callback(results.rows[0].sync === 1);
					} catch (ex) {
						console.warn(ex);
						callback(true);
					}
				},
			});
		}, 1);
	};
	groupCanSync = function (globalId, callback) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'groups',
				where: { global_id: globalId },
				fields: ['id', 'global_id', 'sync'],
				success: function (tx, results) {
					if (results.rows.length) {
						callback(results.rows[0].sync === 1);
					} else {
						callback(true);
					}
					/*
						try {
							callback(results.rows[0].sync == 1);
						} catch (ex) {
							console.warn(ex);
							callback(true);
						}
						*/
				},
			});
		}, 1);
	};
	/**
	 * check group exists
	 * @param {String} name
	 * @param {Array} [excludeIds=null]
	 * @return {Boolean}
	 */
	groupExists = function (params, callback) {
		const { fvdSpeedDial } = this;

		params.excludeIds = params.excludeIds || null;
		let additionalWhere = false;

		if (params.excludeIds) {
			additionalWhere = {
				key: 'id',
				arr: params.excludeIds,
			};
		}

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'groups',
				where: {
					name: params.name,
				},
				whereNotIn: additionalWhere,
				success: function (tx, results) {
					const exists = Boolean(results.rows.length);

					try {
						callback(exists);
					} catch (ex) {
						console.warn(ex);
					}
				},
			});
		});
	};
	groupExistsById = function (id, callback) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'groups',
				where: {
					id: id,
				},
				success: function (tx, results) {
					const exists = Boolean(results.rows.length);

					try {
						callback(exists);
					} catch (ex) {
						console.warn(ex);
					}
				},
			});
		});
	};
	groupExistsByGlobalId = function (globalId, callback) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'groups',
				where: {
					global_id: globalId,
				},
				success: function (tx, results) {
					const exists = Boolean(results.rows.length);

					try {
						callback(exists);
					} catch (ex) {
						console.warn(ex);
					}
				},
			});
		});
	};
	getMisc = function (name, callback) {
		const { fvdSpeedDial } = this;
		// const start = Date.now();

		dbTransaction(function (tx) {
			dbSelect(fvdSpeedDial, {
				tx: tx,
				from: 'misc',
				where: {
					name: name,
				},
				success: function (tx, results) {
					let v = null;

					if (results.rows.length === 1) {
						v = String(results.rows[0].value);
					}

					if (
						name === 'sd.background' &&
						v !== null &&
						(v.indexOf('/') === 0 || v.indexOf('filesystem:') === 0) &&
						v !== fvdSpeedDial.Prefs._themeDefaults['fancy']['sd.background_url'] &&
						v !== fvdSpeedDial.Prefs._themeDefaults['standard']['sd.background_url']
					) {
						FileSystemSD.readAsDataURLbyURL(v, function (par, url) {
							callback(url);
						});
					} else {
						callback(v);
					}
				},
			});
		});
	};
	setMisc = function (name, value, callback) {
		const { fvdSpeedDial } = this;

		Utils.Async.chain([
			function (next) {
				if (name !== 'sd.background') {
					return next();
				}

				if (
					typeof value === 'string' &&
					(value.indexOf('data:') === 0 || value.indexOf('filesystem:') === 0) &&
					value !== fvdSpeedDial.Prefs._themeDefaults['fancy']['sd.background_url'] &&
					value !== fvdSpeedDial.Prefs._themeDefaults['standard']['sd.background_url']
				) {
					// save to file
					const img = Utils.dataURIToBlob(value);
					const ext = Utils.typeToExt(img.type);

					FileSystemSD.write(
						'/' + Config.FS_MISC_DIR + '/background.' + ext,
						img,
						function (err, url) {
							if (err) {
								throw err;
							}

							value = url;
							next();
						}
					);
				} else {
					next();
				}
			},
			function () {
				dbTransaction(function (tx) {
					dbUpdate(fvdSpeedDial, {
						tx: tx,
						table: 'misc',
						set: {
							name: name,
							value: value,
						},
						success: function () {
							console.log('dbUpdate, success');
							callback = callback || function () {};

							if (fvdSpeedDial.hasOwnProperty('DatabaseBackup')) {
								fvdSpeedDial.Backup.backgroundImageBackup(callback);
							} else if (callback) {
								callback();
							}
						},
					});
				});
			},
		]);
	};
	getDialsPreview = function (dials, callback, thumbsLimit, params) {
		const list = dials;
		const self = this;

		params = params || {};

		if (!list.length) {
			if (callback) callback(list);

			return;
		}

		let shortList = list;

		if (typeof thumbsLimit === 'number' && false) {
			shortList = list.slice(0, thumbsLimit || 50);
		}

		Utils.Async.each(
			shortList,
			function (dial, next) {
				if (
					dial.thumb &&
					(String(dial.thumb).includes('/sd_previews') ||
						String(dial.thumb).includes('filesystem:'))
				) {
					dial.thumbSource = dial.thumb;

					if (typeof webkitRequestFileSystem === 'object') {
						FileSystemSD.readAsDataURLbyURL(dial.thumb, function (par, blobURL) {
							dial = blobURL;
							next();
						});
					} else {
						FileSystemSD.safeReadAsDataURLbyURL(dial.thumb, function (state, blobURL) {
							dial.thumb = blobURL;
							next();
						});
					}
				} else {
					next();
				}
			},
			function () {
				if (callback) callback(list);
			}
		);
	};
	_rawList = function (query, callback) {
		const { fvdSpeedDial } = this;

		if (!query && typeof query !== 'object') console.warn('Wrong query in _rawList', query);

		dbTransaction(function (tx) {
			query.tx = tx;
			query.success = function (tx, results) {
				const data = [];

				for (let i = 0; i !== results.rows.length; i++) {
					data.push(Utils.clone(results.rows[i]));
				}
				callback(data);
			};
			query.error = function (tx, error) {
				console.log('Request error', { query, error });
			};
			dbSelect(fvdSpeedDial, query);
		}, 1);
	};
	_prepareDialData = function (dial) {
		dial.displayTitle = dial.title ? dial.title : dial.auto_title;
	};
	_callDialsChangeCallbacks = function (data) {
		const toRemoveCallbacks = [];
		let i;

		for (i = 0; i < this._dialsChangeCallbacks.length; i++) {
			try {
				this._dialsChangeCallbacks[i](data);
			} catch (ex) {
				console.warn(ex);
				toRemoveCallbacks.push(this._dialsChangeCallbacks[i]);
			}
		}
		for (i = 0; i !== toRemoveCallbacks.length; i++) {
			this.removeDialsCallback(toRemoveCallbacks[i]);
		}
		this.onDataChanged.dispatch();
	};
	_callGroupsChangeCallbacks = function (data) {
		const toRemoveCallbacks = [];
		let i;

		for (i = 0; i !== this._groupsChangeCallbacks.length; i++) {
			try {
				this._groupsChangeCallbacks[i](data);
			} catch (ex) {
				console.warn(ex);
				toRemoveCallbacks.push(this._groupsChangeCallbacks[i]);
			}
		}
		for (i = 0; i !== toRemoveCallbacks.length; i++) {
			this.removeGroupsCallback(toRemoveCallbacks[i]);
		}
		this.onDataChanged.dispatch();
	};
	_callDenyChangeCallbacks = function (data) {
		Broadcaster.sendMessage({
			action: 'deny:changed',
			data: data,
		});
	};
	_denySignExists = function (type, effective_sign, callback, except) {
		const { fvdSpeedDial } = this;

		dbTransaction(function (tx) {
			const query = {
				tx: tx,
				from: 'deny',
				where: {
					type: type,
					effective_sign: effective_sign,
				},
				success: function (tx, results) {
					const exists = Boolean(results.rows.length);

					callback(exists);
				},
			};

			if (except) {
				query.where['id !'] = except;
			}

			dbSelect(fvdSpeedDial, query);
		});
	};
	_getInsertData = function (data) {
		const dataArray = [];
		const stringKeys = [];
		const stringValues = [];

		for (const k in data) {
			stringKeys.push('`' + k + '`');
			stringValues.push('?');
			dataArray.push(data[k]);
		}
		return {
			keys: stringKeys.join(','),
			values: stringValues.join(','),
			dataArray: dataArray,
			dataObject: createObject(stringKeys.join(','), dataArray),
		};
	};
	_getUpdateData = function (data) {
		const dataArray = [];
		const strings = [];

		for (const k in data) {
			strings.push('`' + k + '` = ?');
			dataArray.push(data[k]);
		}
		return {
			dataArray: dataArray,
			strings: strings,
			dataObject: data,
		};
	};
	_resultsToArray = function (results) {
		const data = [];

		for (let i = 0; i !== results.rows.length; i++) {
			data.push(results.rows[i]);
		}
		return data;
	};
	_getTables = function (tx, callback) {
		const { fvdSpeedDial } = this;

		if (typeof tx === 'function') {
			callback = tx;
			tx = null;
		}

		const self = this;
		const data = [];

		Utils.Async.chain([
			function (next) {
				if (tx) {
					return next();
				}

				dbTransaction(function (_tx) {
					tx = _tx;
					next();
				});
			},
			function () {
				if (fvdSpeedDial.StorageSD.DB) {
					for (const key in fvdSpeedDial.StorageSD.DB.tables)
						data.push(fvdSpeedDial.StorageSD.DB.tables[key].name);
				}

				callback(data);
			},
		]);
	};
	_getIndexes = function (callback, _tx) {
		return false;
	};
	_tableFields = function (table, callback, _tx) {
		return false;
	};
	_generateGUID = function () {
		const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
		const string_length = 32;
		let randomstring = '';

		for (let i = 0; i < string_length; i++) {
			const rnum = Math.floor(Math.random() * chars.length);

			randomstring += chars.substring(rnum, rnum + 1);
		}
		return randomstring;
	};
	_createTables = function (callback) {
		const { fvdSpeedDial } = this;
		const self = this;

		self._connection.transaction(
			function (tx) {
				initStorage(fvdSpeedDial, tx, null, callback);
			},
			function (err) {
				console.error('Fail to get transaction for table creation', err);
			}
		);
	};
	checkState = function (callback) {
		const state = { incognito: false, storageFail: false };

		chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
			if (tabs[0]?.incognito) state.incognito = true;

			const db = window.indexedDB.open('test');

			db.onerror = function () {
				state.storageFail = true;
				state.DATABASE_TYPE = DATABASE_TYPE;
				callback(state);
			};
			db.onsuccess = function () {
				state.DATABASE_TYPE = DATABASE_TYPE;
				callback(state);
			};
		});
	};
	checkIncognito = function (callback) {
		const self = this;

		chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
			self.isIncognito =
				tabs[0]?.incognito || String(tabs[0]?.cookieStoreId)?.indexOf('firefox-container-') !== -1;
			callback(self.isIncognito);
		});
	};
	dbSelect(from, where = {}, callback) {
		dbTransaction(function (tx) {
			const query = {
				tx: tx,
				from,
				where,
				success: (tx, results) => {
					callback(results);
				},
			};

			dbSelect(fvdSpeedDial, query);
		});
	}
	dbUpdate(table, set = {}, where = {}, callback) {
		dbTransaction(function (tx) {
			dbUpdate(fvdSpeedDial, {
				tx: tx,
				table,
				set,
				where,
				success: function (tx, results) {
					callback && callback(results);
				},
				error: function (tx, error) {
					console.warn('Query failed', error);
				},
			});
		});
	}
}
export default StorageSD;
function openDatabase(dbName, version, opt, size) {
	const db = new createDatabase();

	db.init(dbName, version, opt, size);
	return db;
}
function createDatabase() {
	const self = this;

	this.init = function (dbName, version, opt, size) {
		if (LOG_STORAGE) {
			console.info('openDatabase', 'init', dbName, version, opt, size);
		}
	};
	this.transaction = function (cb) {
		if (cb) cb(self);
	};
	this.executeSql = function (sql, data, success, error) {
		console.warn(sql);
	};
}
const db = function () {};

db.prototype = {
	CACHE: {},
	get: function (table, mode) {
		if (typeof this.CACHE[table] === 'object' && typeof this.CACHE[table][mode] === 'object') {
			return this.clone(this.CACHE[table][mode]);
		} else {
			return false;
		}
	},
	set: function (table, mode, data) {
		if (typeof this.CACHE[table] !== 'object') this.CACHE[table] = {};

		this.CACHE[table][mode] = this.clone(data);
	},
	clear: function (table) {
		try {
			if (table) {
				this.CACHE[table] = {};
			} else {
				this.CACHE = {};
			}
		} catch (ex) {
			console.warn(ex);
		}
	},
	clone: function (oldObj) {
		let newObj = oldObj;

		if (oldObj && typeof oldObj === 'object') {
			newObj = Object.prototype.toString.call(oldObj) === '[object Array]' ? [] : {};
			for (const i in oldObj) {
				newObj[i] = this.clone(oldObj[i]);
			}
		}

		return newObj;
	},
	clone2: function (data) {
		const str = JSON.stringify(data);

		return JSON.parse(str);
	},
};
// const dbCache = new db();
const lastQueryTime = Date.now();

function dbSelect(fvdSpeedDial, obj) {
	const param = obj;

	if (DATABASE_TYPE === 'storage.local') {
		fvdSpeedDial.StorageLocal.get(obj);
		return;
	}

	obj.start = Date.now();
	const mode = String(param.order || 'default');

	let Data = fvdSpeedDial.StorageSD.DB.table(param.from);

	if (param.order) {
		param.order = String(param.order).replace('ASC', '').split('`').join('').trim();
		let reverse = false;

		if (param.order.indexOf('!') !== -1 || param.order.indexOf('DESC') !== -1) {
			reverse = true;
			param.order = param.order.replace('!', '').replace('DESC', '');
		}

		Data = Data.toCollection();

		if (reverse) Data = Data.reverse();

		Data = Data.sortBy(param.order.trim());
	} else {
		Data = Data.orderBy(':id').toArray();
	}

	Data.then(function (arr) {
		dbSelectProcess(obj, arr);
	}).catch(function (error) {
		console.warn('ERROR: ', error, param);

		if (typeof param.error === 'function') {
			param.error.call(true, error);
		}
	});
}
function dbSelectProcess(obj, arr) {
	const param = obj;

	if (param.whereSQL) {
		if (typeof param.whereSQL === 'string') {
			param.whereSQL = param.whereSQL.split('AND');
		}

		for (const key in param.whereSQL) {
			const val = String(param.whereSQL[key]).trim();
			const eq = val
				.split('`.`')
				.pop()
				.replace(/[`'"]/g, '')
				.replace(/(=|>|<|!=)/g, ' $1 ')
				.trim()
				.split(' ');

			let field = eq.shift();

			if (field.includes('rowid')) {
				field = 'id';
			}

			let value = eq.pop();
			const list = val
				.split('(')
				.pop()
				.replace(/[\s`'"]/g, '')
				.split(')')
				.shift()
				.trim()
				.split(',');

			if (field) {
				if (val.indexOf(' NOT IN ') !== -1) {
					param.whereNotIn = {
						key: field,
						arr: list,
					};
				} else if (val.indexOf(' IN ') !== -1) {
					param.whereIn = {
						key: field,
						arr: list,
					};
				} else {
					if (!param.where) {
						param.where = {};
					}

					if (!isNaN(value)) {
						value = parseInt(value);
					}

					if (val.indexOf(' IS NOT NULL') !== -1) {
						param.where[field + '!'] = '';
					} else if (val.indexOf('!=') !== -1) {
						param.where[field + '!'] = value;
					} else if (val.indexOf('>') !== -1) {
						param.where[field + '>'] = value;
					} else if (val.indexOf('<') !== -1) {
						param.where[field + '<'] = value;
					} else if (val.indexOf('=') !== -1) {
						param.where[field] = value;
					}
				}
			}
		}
	}

	const results = {
		rows: [],
	};

	for (const c in arr) {
		if (typeof arr[c].id !== 'undefined') {
			arr[c].rowid = arr[c].id;
		}

		if (typeof param.where === 'object' && param.where) {
			let cont = false;

			for (const w in param.where) {
				if (w) {
					if (w === 'OR' && typeof param.where[w] === 'object' && param.where[w]) {
						let hit = false;

						for (const o in param.where[w]) {
							const test = dbWhereTest(o, param.where[w][o], arr[c]);

							if (test) {
								hit = true;
								break;
							}
						}

						if (!hit) {
							cont = true;
						}
					} else {
						const test = dbWhereTest(w, param.where[w], arr[c]);

						if (!test) {
							cont = true;
						}
					}
				}
			}

			if (cont) {
				continue;
			}
		}

		if (param.whereIn) {
			let cont = true;

			for (const w in param.whereIn['arr'])
				if (arr[c][param.whereIn['key']] === param.whereIn['arr'][w]) cont = false;

			if (cont) continue;
		}

		if (param.whereNotIn) {
			let cont = false;

			for (const w in param.whereNotIn['arr'])
				if (arr[c][param.whereNotIn['key']] === param.whereNotIn['arr'][w]) cont = true;

			if (cont) continue;
		}

		results.rows[results.rows.length] = arr[c];
	}

	if (param.limit) {
		results.rows = results.rows.slice(param.offset || 0, param.limit);
	}

	if (param.countAs) {
		const count = results.rows.length;

		for (const r in results.rows) {
			results.rows[r][param.countAs] = count;
		}
	}

	if (param.maxOf) {
		//Max of item
		let maxVal = 0;

		if (typeof param.maxOf === 'string') param.maxOf = { field: param.maxOf, name: param.maxOf };

		for (const r in results.rows) {
			const val = parseInt(results.rows[r][param.maxOf.field]) || 1;

			maxVal = Math.max(maxVal, val);
		}
		for (const r in results.rows) results.rows[r][param.maxOf.name] = maxVal;
	}

	//Fields
	if (param.fields && typeof param.fields !== 'undefined')
		if (typeof param.fields === 'string')
			param.fields = String(param.fields).split('`').join('').split(',');

	if (param.fields && typeof param.fields === 'object') {
		for (const f in param.fields) param.fields[f] = String(param.fields[f]).trim();

		if (param.countAs) param.fields.push(param.countAs);

		if (param.fields.indexOf('*') === -1)
			for (const r in results.rows) {
				for (const f in results.rows[r]) {
					if (param.fields.indexOf(f) === -1) delete results.rows[r][f];
				}
			}
	}

	//Rename fields
	if (param.rename) {
		for (const r in results.rows) {
			for (const f in results.rows[r]) {
				for (const i in param.rename) {
					if (i === f) {
						results.rows[r][param.rename[i]] = results.rows[r][f];
						delete results.rows[r][f];
					}
				}
			}
		}
	}

	if (typeof param.success === 'function') {
		param.success.call(true, param.tx, results);
	}
}
function dbWhereTest(exp, val, line) {
	exp = String(exp);

	const equal = Boolean(exp.indexOf('=') > -1);
	const more = Boolean(exp.indexOf('>') > -1);
	const less = Boolean(exp.indexOf('<') > -1);
	const not = Boolean(exp.indexOf('!') > -1);
	const like = Boolean(exp.indexOf('~') > -1);

	const wClean = exp
		.replace('!', '')
		.replace('=', '')
		.replace('>', '')
		.replace('<', '')
		.replace('~', '')
		.trim();

	const exist = Boolean(typeof line[wClean] !== 'undefined');
	const intLine = parseInt(line[wClean]);
	const intVal = parseInt(val);

	if (
		(not && exist && line[wClean] === val) || // "!"
		(more && // ">"
			(!exist || intLine <= intVal) &&
			(!equal || !exist || intLine !== intVal)) ||
		(less && // "<"
			(!exist || intLine >= intVal) &&
			(!equal || !exist || intLine !== intVal)) ||
		(like && // "~ LIKE"
			(!exist || String(line[wClean]).indexOf(val) === -1)) ||
		(wClean === exp && // "=="
			(!exist || line[wClean] != val))
	) {
		return false;
	} else {
		return true;
	}
}
function dbInsert(fvdSpeedDial, obj) {
	if (obj.table === 'dials') {
		CACHE['countDials'] = false;
	}

	if (DATABASE_TYPE === 'storage.local') {
		fvdSpeedDial.StorageLocal.set(obj);
		return;
	}

	const param = obj;

	if (typeof tablesDefaultValues[param.table] !== undefined) {
		for (const key in tablesDefaultValues[param.table]) {
			const def = tablesDefaultValues[param.table].key;

			if (typeof param.set[key] === 'undefined' || param.set[key] === '') {
				param.set[key] = def;
			}
		}
	}

	fvdSpeedDial.StorageSD.DB[param.table]
		.add(param.set)
		.then(function (insertId) {
			if (typeof param.success === 'function')
				param.success.call(true, param.tx, {
					insertId: insertId,
					rowsAffected: insertId && insertId !== 0 ? 1 : 0,
				});
		})
		.catch(function (error) {
			console.error('dbInsert (ERROR): ', error, param);

			if (typeof param.error === 'function') param.error.call(true, error);
		});
}
function dbUpdate(fvdSpeedDial, obj) {
	const param = obj;

	if (DATABASE_TYPE === 'storage.local') {
		fvdSpeedDial.StorageLocal.upd(obj);
		return;
	}

	if (!param.where && param.set) {
		if (typeof param.set.id !== 'undefined') param.where = { key: 'id', val: param.set.id };
		else if (typeof param.set.name !== 'undefined')
			param.where = { key: 'name', val: param.set.name };
	}

	if (param.where) {
		if (param.where.key === 'rowid') {
			param.where.key = 'id';
		}

		if (param.where.key === 'id') {
			if (String(parseInt(param.where.val)) === String(param.where.val)) {
				param.where.val = parseInt(param.where.val);
			} else {
				//console.warn("NOT EQUAL", param.where.val, obj);
			}
		}
	}

	let selWhere = {};

	if (param.where) {
		selWhere[param.where.key] = param.where.val;
	} else {
		selWhere = false;
	}

	dbSelect(fvdSpeedDial, {
		tx: param.tx,
		from: param.table,
		where: selWhere,
		success: function (tx, results) {
			if (!results.rows.length) {
				dbInsert(fvdSpeedDial, obj);
			} else {
				let Query = fvdSpeedDial.StorageSD.DB[param.table];

				if (param.where) {
					Query = Query.where(param.where.key).equals(param.where.val);
				} else {
					Query = Query.toCollection();
				}

				Query.modify(param.set)
					.then(function (data) {
						data = { rowsAffected: data };

						if (typeof param.success === 'function') {
							param.success.call(true, param.tx, data);
						}
					})
					.catch(function (error) {
						console.warn('dbUpdate (ERROR): ', error, param);

						if (typeof param.error === 'function') param.error.call(true, error);
					});
			}
		},
		error: function (tx, error) {
			console.warn('dbUpdate (ERROR): ', error, param);

			if (typeof param.error === 'function') param.error.call(true, error);
		},
	});
}
function dbDelete(fvdSpeedDial, obj, successFunction, errorFunction) {
	if (obj.table === 'dials' || obj.from === 'dials') {
		CACHE['countDials'] = false;
	}

	if (DATABASE_TYPE === 'storage.local') {
		fvdSpeedDial.StorageLocal.del(obj);
		return;
	}

	if (!obj.force && (!obj.where || !obj.where.key)) {
		return false;
	}

	const param = obj;
	let Process = fvdSpeedDial.StorageSD.DB[param.from || param.table];

	if (param.where) {
		if (param.where.key === 'rowid') {
			param.where.key = 'id';
		}

		if (param.where.key === 'id') param.where.val = parseInt(param.where.val);

		Process = Process.where(param.where.key).equals(param.where.val);
	} else if (param.whereIn) {
		Process = Process.where(param.whereIn.key).anyOf(param.whereIn.arr);
	} else {
		Process = Process.toCollection();
	}

	Process.delete()
		.then(function (data) {
			if (typeof param.success === 'function')
				param.success.call(true, param.tx, {
					rowsAffected: data,
				});
		})
		.catch(function (error) {
			console.error('dbDelete (ERROR): ', error, param);

			if (typeof param.error === 'function') param.error.call(true, error);
		});
}
function dbClearAll(StorageSD, obj, really) {
	const param = obj;

	param.table = param.table || param.from || false;

	if (!param.table || really !== 'really') {
		return false;
	}

	const Process = StorageSD.DB[param.table];

	Process.clear()
		.then(function (response) {
			if (typeof param.success === 'function')
				param.success.call(true, param.tx, {
					rowsAffected: response,
				});
		})
		.catch(function (error) {
			console.error('dbClearAll (ERROR): ', error, param);

			if (typeof param.error === 'function') param.error.call(true, error);
		});
}
function dbGenerateSet(fields, dataArr) {
	const setObj = {};

	if (typeof fields === 'string') fields = fields.split(',');

	if (dataArr) {
		for (const key in fields) {
			const val = String(fields[key])
				.split('`')
				.join('')
				.split('=')
				.join('')
				.split('?')
				.join('')
				.trim();

			setObj[val] = dataArr[key];
		}
	} else {
		console.warn('Required dataArr');
	}

	return setObj;
}
function dbTransaction(callback, wait) {
	if (!wait) {
		callback.call(true, true);
	} else {
		setTimeout(() => {
			callback.call(true, true);
		}, Math.min(1e3, parseInt(wait) || 1));
	}
}
function createObject(keys, vals) {
	const obj = {};

	if (typeof keys === 'string') {
		keys = String(keys).split('`').join('').split(',');
	}

	for (const i in keys) obj[keys[i]] = vals[i];
	return obj;
}