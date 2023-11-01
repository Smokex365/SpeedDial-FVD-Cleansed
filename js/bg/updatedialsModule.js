import { Utils } from '../utils.js';
import ServerDialsModule from './serverdialsModule.js';
import Broadcaster from '../_external/broadcaster.js';

class UpdateDials {
	fvdSpeedDial;
	serverUrl = 'http://fvdspeeddial.com/fst/dials.php';
	geolocationUrl = 'https://geoloc.tempest.com';

	constructor(fvdSpeedDial) {
		this.fvdSpeedDial = fvdSpeedDial;
	}

	update() {
		const fvdSpeedDial = this.fvdSpeedDial;
		const dialsCreated = [];
		const allowedGroups = ['sponsoredst', 'recommend'];
		const allowedGroupIds = [];
		let excludeGlobalIds = [];
		let allowedExitingDials = [];
		let serverDials = [];
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
					allowedExitingDials =
						_exitingDials?.filter((d) => allowedGroupIds.includes(d.group_id)) || [];

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
					excludeGlobalIds
				);
			},
			// Removing dials by server
			function (next) {
				const dialsToRemove = [];

				for (const dial of allowedExitingDials) {
					if (
						!serverDials.some((d) => d.global_id === dial.global_id) &&
						dial.global_id.length < 10
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
