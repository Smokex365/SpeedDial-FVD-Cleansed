// import StorageSD from "../storage.js";

const StorageApps = function (fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;
};

StorageApps.prototype = {
	storePositions: function (positions, callback) {
		this.fvdSpeedDial.StorageSD.setMisc("apps_positions", JSON.stringify(positions), callback);
	},

	get: function (callback) {
		const { fvdSpeedDial: {StorageSD} } = this;

		chrome.management.getAll(function (extensions) {
			// need to add webstore app
			chrome.management.get("ahfgeienlihckogmohjhadlkjgocpleb", function (webstoreApp) {

				if (webstoreApp) {
					extensions.push(webstoreApp);
				}

				const apps = [];

				for (let i = 0; i !== extensions.length; i++) {
					const ext = extensions[i];

					if (!ext.isApp) {
						continue;
					}

					if (!ext.enabled) {
						continue;
					}

					apps.push(ext);
				}

				StorageSD.getMisc("apps_positions", function (result) {
					try {
						const positions = JSON.parse(result);

						for (let i = 0; i !== apps.length; i++) {
							if (positions[apps[i].id]) {
								apps[i].position = positions[apps[i].id];
							} else {
								apps[i].position = Number.MAX_VALUE;
							}
						}
					} catch (ex) {
						console.warn(ex);
					}

					apps.sort(function (a, b) {
						return a.position - b.position;
					});

					callback(apps);
				});
			});
		});
	},
};

export default StorageApps;
