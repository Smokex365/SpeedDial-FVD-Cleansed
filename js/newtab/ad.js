import Prefs from '../prefs.js';
import { _b, Utils } from '../utils.js';
import Config from '../config.js';
import SpeedDialMisc from './speeddial_misc.js';

const AD = function (label) {
	if (_b(Prefs.get("ad_dontDisplay_" + label))) {
		return;
	}

	const containerId = "ad_"+label+"Message";
	let interval = null;

	document.querySelector("#"+containerId+" .ad_dontShow").addEventListener("click", function (e) {
		Prefs.set("ad_dontDisplay_" + label, e.target.checked);
	}, false);

	function setRandomShowInFuture(now) {
		now = now || new Date().getTime();

		const randomMinutesToShow = Utils.getRandomInt(60, 1000);

		Prefs.set("ad_lastShow_" + label, now + randomMinutesToShow * 60 * 1000);
	}

	function show() {
		const lastShowTime = parseInt(Prefs.get("ad_lastShow_" + label));
		const now = new Date().getTime();

		if (_b(Prefs.get("ad_dontDisplay_" + label))) {
			return;
		}

		if (!lastShowTime) {
			setRandomShowInFuture();

			return;
		}

		if (now - lastShowTime >= Config.DISPLAY_AD_EVERY) {
			SpeedDialMisc.showOptions(containerId, document.getElementById("searchBar"), null, null, function () {
				setRandomShowInFuture(lastShowTime);
			}, function () {
				Prefs.set("ad_lastShow_" + label, now);
			});
		}
	}
	interval = setInterval(show, 1000);
};

const ads = [];

document.addEventListener("DOMContentLoaded", function () {
	const popups = document.getElementsByClassName("sdAdPopup");

	for (let i = 0; i !== popups.length; i++) {
		const tmp = popups[i].getAttribute("id").match(/^ad_(.+)Message$/i);

		ads.push(new AD(tmp[1]));
	}
}, false);