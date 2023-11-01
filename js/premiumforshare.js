import Sync from './sync/tab.js';

const PremiumForShare = function (fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;

	function isAuthorizedOnServer(cb) {
		const xhr = new XMLHttpRequest();

		xhr.open("POST", "https://everhelper.pro/shareforpremium/can.php");
		xhr.onload = function () {
			const resp = JSON.parse(xhr.responseText);

			if (!resp.can) {
				cb(false);
			} else {
				cb(true);
			}
		};
		xhr.send(JSON.stringify({
			action: "user:authstate",
		}));
	}

	this.canDisplay = function (params, cb) {
		if (typeof params === "function") {
			cb = params;
			params = {};
		}

		if (document.location.hash === "#premiumforshare") {
			return cb(true);
		}

		if (!params.ignoreDisplayed && this.fvdSpeedDial.Prefs.get("premiumforshare.displayed")) {
			return;
		}

		const installTime = parseInt(this.fvdSpeedDial.Prefs.get("sd.install_time"));

		if (new Date().getTime() - installTime < 3600 * 24 * 7 * 1000) {
			return cb(false);
		}

		Sync.syncAddonExists(function (exists) {
			if (!exists) {
				return cb(false);
			}

			isAuthorizedOnServer(function (authorized) {
				if (!authorized) {
					return cb(false);
				}

				const introductionOverlay = document.getElementById("introductionOverlay");

				if (introductionOverlay && introductionOverlay.hasAttribute("appear")) {
					return cb(false);
				}

				cb(true);
			});
		});
	};
};

export default PremiumForShare;
