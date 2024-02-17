import { Utils } from '../utils.js';
import ServerDialsModule from './serverdialsModule.js';
import Broadcaster from '../_external/broadcaster.js';
import { DIALS_TRASH_KEY, GROUPS_TRASH_KEY, defaultGroupGlobalIDs } from '../constants.js';
import { userStorageKey } from '../sync/user.js';

class UpdateDials {
	fvdSpeedDial;

	constructor(fvdSpeedDial) {
		this.fvdSpeedDial = fvdSpeedDial;
	}

	update() {
		const fvdSpeedDial = this.fvdSpeedDial;
		const dialsCreated = [];
		// const removedGroups = fvdSpeedDial.Prefs.get('fvd.groups_trash');
		const currentUserInfo = fvdSpeedDial.localStorage.getItem(userStorageKey);
		const removedDials = fvdSpeedDial.Prefs.get(DIALS_TRASH_KEY, {});
		const currentUserRemovedDials = removedDials[currentUserInfo?.user?.user_id] || [];
		const allowedGroups = Object.values(defaultGroupGlobalIDs).filter((globalID) => globalID !== defaultGroupGlobalIDs.popular);
		const allowedGroupIds = [];
		let excludeGlobalIds = [];
		let allowedExitingDials = [];
		let serverDials = [];
		let dbExistingDials = [];
		const serverDialsModule = new ServerDialsModule(fvdSpeedDial);


		Utils.Async.chain([
			function (next) {
				for (const groupId of allowedGroups) {
					fvdSpeedDial.StorageSD.groupIdByGlobalId(groupId, (id) => {
						if (id) {
							allowedGroupIds.push(id);
						}
					});
				}

				next();
			},
			// taking allowed group dials and preventing them from exclude
			function (next) {
				fvdSpeedDial.StorageSD.listDials(null, null, null, (_exitingDials) => {
					dbExistingDials = _exitingDials;
					allowedExitingDials = _exitingDials?.filter((d) => allowedGroupIds.includes(d.group_id)) || [];

					const dialsToFetchIds = allowedExitingDials.map((d) => d.global_id);

					const dialsToExcludeIds = serverDialsModule.getExcludeDialsGlobalIds();

					excludeGlobalIds = dialsToExcludeIds?.filter((d) => !dialsToFetchIds.includes(d));
					next();
				});
			},
			// fetching allowed group dials
			function (next) {
				serverDialsModule.fetch(
					{
						userType: 'new',
					},
					function (err, dials) {
						if (err) {
							serverDials = [];
						} else {
							serverDials = dials;
						}

						next();
					},
					excludeGlobalIds,
					true // True to ignor browser history check
				);
			},
			// only default, sponsoredst and recommend group dials to update
			function (next) {
				serverDials = serverDials.filter((dial) => allowedGroups.includes(dial.group_globalId));
				next();
			},
			// ignoring removed groups by user
			/**function (next) {
				serverDials = serverDials.filter((dial) => !removedGroups.includes(dial.group_globalId));
				next();
			},*/
			// ignoring removed dials by user
			function (next) {
				serverDials = serverDials.filter((dial) => !currentUserRemovedDials.includes(dial.global_id));
				next();
			},
			// Remove groups by user trash if login/logout
			function (next) {
				const currentUserInfo = fvdSpeedDial.localStorage.getItem(userStorageKey);
				const userID = currentUserInfo?.user?.user_id;
				const groupsTrash = fvdSpeedDial.Prefs.get(GROUPS_TRASH_KEY) || [];

				const groupsRemoveProcess = (groupGlobalId, done) => {
					fvdSpeedDial.StorageSD.groupDeleteByGlobalID(groupGlobalId, done);
				};

				if (groupsTrash[userID]) {
					Utils.Async.arrayProcess(groupsTrash[userID], groupsRemoveProcess, next);
				} else {
					next();
				}

			},
			// Removing dials by server
			function (next) {
				const dialsToRemove = [];

				for (const dial of allowedExitingDials) {
					if (
						!serverDials.some((d) => d.global_id === dial.global_id)
						&& dial.global_id.length <= 10
					) {
						dialsToRemove.push(dial);
					}
				}

				const removeDial = function (dialData, done) {
					fvdSpeedDial.StorageSD.deleteDial(dialData.id, () => {
						chrome.runtime.sendMessage({
							action: 'forceRebuild',
						});

						done();
					});
				};

				Utils.Async.arrayProcess(dialsToRemove, removeDial, next);
			},
			// adding & updating dials
			function (next) {
				const processDial = function (dialData, done) {
					const dialExists = allowedExitingDials.find((d) => d.global_id === dialData.global_id);

					dialData.get_screen_method = dialData.thumb_source_type !== 'url' ? 'auto' : 'custom';

					if (dialData.previewUrl && !dialData.thumb_url) {
						dialData.thumb_url = dialData.previewUrl;
						//dialData.thumb = dialData.previewUrl;
						dialData.get_screen_method = 'custom';
						dialData.thumb_source_type = 'url';
					}

					// adding dial if not exists
					if (!dialExists) {
						fvdSpeedDial.StorageSD.addDial(dialData, function (res) {
							if (res) {
								dialData.id = res.id;
								dialsCreated.push(dialData);
							}

							if (dialData.thumb_source_type === 'url') {
								fvdSpeedDial.ThumbMaker.getImageDataPath(
									{
										imgUrl: dialData.thumb_url,
										screenWidth: 364,
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
					} else {
						// editing dial if exists
						fvdSpeedDial.ThumbMaker.getImageDataPath(
							{
								imgUrl: dialData.thumb_url,
								screenWidth: 364,
							},
							function (dataUrl, thumbSize) {
								fvdSpeedDial.StorageSD.updateDial(
									dialExists.id,
									{
										...dialData,
										preview_style: dialExists?.preview_style || dialData?.preview_style,
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

						done();
					}
				};

				Utils.Async.arrayProcess(serverDials, processDial, next);
			},
			function () {
				Broadcaster.sendMessage({
					action: 'defaultDialsCreated',
					dials: dialsCreated,
				});
			},
		]);
	}
}

export default UpdateDials;
