import AppLog from '../log.js';
import Broadcaster from '../_external/broadcaster.js';
import { Utils } from '../utils.js';
import ServerDials from '../bg/serverdialsModule.js';
import Dexie from '../_external/dexie.js';
import { _ } from '../localizer.js';

const createTablesRequests = {
	dials:
		'id++, url, display_url, title, auto_title, thumb_source_type, thumb_url, position, group_id, deny, [group_id+deny], clicks, screen_maked,' +
		' thumb, thumb_version, screen_delay, thumb_width, thumb_height, &global_id, get_screen_method, update_interval, last_preview_update, need_sync_screen',
	mostvisited_extended:
		'auto_id++, &id, title, auto_title, thumb_source_type, thumb_url, screen_maked, thumb, thumb_version, removed, ' +
		'screen_delay, thumb_width, thumb_height, get_screen_method',
	deny: 'id++,sign, effective_sign, type',
	misc: '&name, value',
	groups: 'id++, name, position, &global_id, sync',
};

const requiredIndexes = [];
const requiredFields = [];
const legacyDials = false;

const initStorage = function (fvdSpeedDial, tx, databaseBackup, callback) {
	const failCreateTable = function (table, trx, err) {
		AppLog.err('Fail to create table', table, err.message);
	};

	let currentTables;
	const tablesCreated = [];
	const backupRestored = false;

	Utils.Async.chain([
		function (callback1) {
			// get list of current tables
			fvdSpeedDial.StorageSD._getTables(tx, function (tables) {
				currentTables = tables;
				callback1();
			});
		},

		function (callback2) {
			console.info('CREATING Dexie DB', 0, createTablesRequests);

			fvdSpeedDial.StorageSD.DB = new Dexie('fvd_speeddial');

			fvdSpeedDial.StorageSD.DB.version(1).stores(createTablesRequests);

			console.info('Dexie store, open ...', fvdSpeedDial.StorageSD.DB);

			fvdSpeedDial.StorageSD.DB.open()
				.then(function (e) {
					console.info('Open DB then ' + e);
				})
				.catch(function (e) {
					console.info('Open DB failed: ' + e);
				})
				.finally(function (e) {
					console.info('SUCCESS Open DB: ', fvdSpeedDial.StorageSD.DB);

					Utils.Async.arrayProcess(
						fvdSpeedDial.StorageSD.DB.tables,
						function (table, nextTable) {
							table.count(function (count) {
								if (count === 0) {
									tablesCreated.push(table.name);
								}

								nextTable();
							});
						},
						function () {
							callback2();
						}
					);
				});
		},

		function (callback2) {
			fvdSpeedDial.Backup.dataBaseCheck(tablesCreated).finally(() => {
				callback2();
			});
		},

		function (callback2) {
			// create default dials
			if (backupRestored) {
				// do not create default dials because database has just been restore
				return callback2();
			}

			if (tablesCreated.indexOf('groups') === -1 || tablesCreated.indexOf('dials') === -1) {
				return callback2();
			}

			if (legacyDials) {
				// do not create default dials because legacy restored
				return callback2();
			}

			const dialsCreated = [];

			// add default group
			let groupDials;

			Utils.Async.chain([
				function (next) {
					// need to fetch dials from server

					const serverDials = new ServerDials(fvdSpeedDial);

					serverDials.fetch(
						{
							userType: 'new',
						},
						function (err, dials) {
							if (err) {
								groupDials = [];
								AppLog.err('Fail to fetch dials from the server', err);
								console.error('Fail to fetch dials from the server', err);
							} else {
								AppLog.info('Fetched', dials.length, ' dials from the server');
								groupDials = dials;
							}

							next();
						}
					);
				},
				function (next) {
					fvdSpeedDial.StorageSD.getGroup('default', function (group) {
						if (group !== null && typeof group === 'object' && group.id) {
							next();
						} else {
							fvdSpeedDial.StorageSD.groupAdd(
								{
									name: _('bg_default_group_name'),
									position: 1,
									sync: 1,
									global_id: 'default',
								},
								function () {
									next();
								}
							);
						}
					});
				},
				function (next) {
					const processDial = function (dialData, done) {
						dialData.get_screen_method = dialData.thumb_source_type !== 'url' ? 'auto' : 'custom';

						if (!dialData.group_id) dialData.group_id = 'default';

						if (dialData.previewUrl && !dialData.thumb_url) {
							dialData.thumb_url = dialData.previewUrl;
							//dialData.thumb = dialData.previewUrl;
							dialData.get_screen_method = 'custom';
							dialData.thumb_source_type = 'url';
						}

						fvdSpeedDial.StorageSD.addDial(dialData, function (res) {
							if (res) {
								dialData.id = res.id;
								dialsCreated.push(dialData);
							}

							if (dialData.thumb_source_type === 'url') {
								fvdSpeedDial.ThumbMaker.getImageDataPath(
									{
										imgUrl: dialData.thumb_url,
										screenWidth: 364, // SpeedDial.getMaxCellWidth(),
									},
									function (dataUrl, thumbSize) {
										fvdSpeedDial.StorageSD.updateDial(
											res.id,
											{
												thumb: dataUrl,
												thumb_width: Math.round(thumbSize.width),
												thumb_height: Math.round(thumbSize.height),
											},
											function () {
												chrome.runtime.sendMessage({
													action: 'forceRebuild',
												});
											}
										);
									}
								);
							}

							done();
						});
					};

					Utils.Async.arrayProcess(groupDials, processDial, next);
				},
				function () {
					AppLog.info('Created', dialsCreated.length, ' default dials');

					Broadcaster.sendMessage({
						action: 'defaultDialsCreated',
						dials: dialsCreated,
					});
					callback2();
				},
			]);
		},
		function () {
			if (tablesCreated.length) {
				AppLog.info('Tables created: ' + tablesCreated.join(', '));
			}

			AppLog.info('Initialization complete');
			callback(true);
		},
	]);
};

export default initStorage;
