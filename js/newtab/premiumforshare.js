import Prefs from '../prefs.js';
import PremiumForShare from '../premiumforshare.js';

document.addEventListener("DOMContentLoaded", function () {
	PremiumForShare.canDisplay(function (can) {
		if (!can) {
			return;
		}

		const shareOverlay = document.getElementById("premiumforshareOverflay");
		const iframe = shareOverlay.querySelector("iframe");

		shareOverlay.style.display = "block";
		shareOverlay.setAttribute("hidden", 1);

		iframe.setAttribute("src", "https://everhelper.me/shareforpremium/");
		iframe.addEventListener("load", function _frameLoad() {
			iframe.removeEventListener("load", _frameLoad);
			shareOverlay.removeAttribute("hidden");
			shareOverlay.setAttribute("appear", 1);
		}, false);
		window.addEventListener("message", function (e) {
			if (e.data && e.data.action === "shareForPremium:close") {
				shareOverlay.removeAttribute("appear", 1);
				setTimeout(function () {
					shareOverlay.parentNode.removeChild(shareOverlay);
				}, 200);
				Prefs.set("premiumforshare.displayed", true);
			}
		});
	});
});
