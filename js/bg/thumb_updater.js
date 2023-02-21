import Broadcaster from '../_external/broadcaster.js';
// import StorageSD from "../storage.js";

function intervalToSeconds(str) {
	let interval = str.split("|");

	switch (interval[1]) {
		case "minutes":
			interval = interval[0] * 60;
			break;
		case "hours":
			interval = interval[0] * 3600;
			break;
		case "days":
			interval = interval[0] * 3600 * 24;
			break;
		default:
			return null;
	}
	interval *= 1000;
	return interval;
}

const execute = () => {
	let dials = [];
	let needFetchDials = true;
	let nowSyncing = false;

	setInterval(function fetchDials() {
		if (nowSyncing) {
			return;
		}

		if (needFetchDials) {
			needFetchDials = false;
			StorageSD.getDialsToPreviewUpdate(function (_dials) {
				dials = _dials;
				console.info("To update preview dials count", dials.length);
			});
		}
	}, 1000);

	setInterval(function checkNeedUpdateDials() {
		if (nowSyncing) {
			return;
		}

		const now = new Date().getTime();

		dials.forEach(function (dial) {
			if (!dial.last_preview_update) {
				dial.last_preview_update = now;
				return StorageSD.setDialPreviewUpdateTime(dial.id, now);
			}

			const interval = intervalToSeconds(dial.update_interval);


			if (interval) {
				const timeToUpdate = dial.last_preview_update + interval;


				if (now >= timeToUpdate) {
					if (!fvdSpeedDial.HiddenCaptureQueue.isEnqueued(dial.id)) {
						StorageSD.setDialPreviewUpdateTime(dial.id, now);
						dial.last_preview_update = now;
						fvdSpeedDial.HiddenCaptureQueue.capture({
							saveImage: true,
							id: dial.id,
							url: dial.url,
							type: "speeddial",
						}, resultData => {
							Broadcaster.sendMessage({
								action: "hiddencapture:done",
								params: {
									id: dial.id,
									url: dial.url,
									saveImage: true,
									type: "speeddial",
									elemId: "dialCell_" + dial.id,
								},
								result: resultData,
							});
						});
					}
				}
			}
		});
	}, 1000);

	StorageSD.addDialsCallback(function (info) {
		if (nowSyncing) {
			return;
		}

		if (info && info.action) {
			if (info.action === "update") {
				if (info.data && info.data.data) {
					const changedData = info.data.data;

					if (!changedData.hasOwnProperty("update_interval")) {
						return;
					}
				}
			} else if (info.action === "add") {
				if (info.data && info.data.data) {
					const addData = info.data.data;

					if (!addData.update_interval) {
						return;
					}
				}
			}
		}

		needFetchDials = true;
	});

	Broadcaster.onMessage.addListener(function (msg) {
		if (msg) {
			if (msg.action === "syncStartNotification") {
				nowSyncing = true;
			} else if (msg.action === "syncEndNotification") {
				needFetchDials = true;
				nowSyncing = false;
			} else if (msg.action === "turnOffAutoUpdateMsg") {
				needFetchDials = true;
			} else if (msg.action === "changeAutoUpdateMsg") {
				needFetchDials = true;
			}
		}
	});
};

export default execute;