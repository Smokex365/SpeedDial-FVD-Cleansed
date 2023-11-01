import Broadcaster from '../_external/broadcaster.js';

const DEFAULT_CSS = {
	"border": "none",
};
const CONTAINER_STYLES = [
	"top",
	"left",
	"right",
	"bottom",
];

const RemoteAD = new function () {
	const self = this;

	this.hideAD = function () {
		const overlay = document.querySelector(".remoteADContainerOverlay");

		if (overlay) {
			overlay.querySelector(".remoteADContainer").style.opacity = 0;

			setTimeout(function () {
				overlay.parentNode.removeChild(overlay);
			}, 500);
		}
	};

	function checkADShow() {
		return;
		chrome.runtime.getBackgroundPage(function (bg) {
			console.log(bg);
			bg.RemoteAD.getADToShow({
				nohosts: true,
			}, function (ad) {
				if (document.querySelector(".dialog-overlay") || document.querySelector(".popupOptions[active=\"1\"]")) {
					return;
				}

				if (ad) {
					Broadcaster.onMessage.addListener(function (msg) {
						if (msg.a === "remoteAD:close" && msg.id === ad.id) {
							self.hideAD();
						}
					});

					const adContainer = bg.document.getElementById("prototype_remoteADContainer").cloneNode(true);

					adContainer.setAttribute("active", 1);
					const iframe = adContainer.querySelector("iframe");

					for (const k in DEFAULT_CSS) {
						if (!(k in ad.css)) {
							ad.css[k] = DEFAULT_CSS[k];
						}
					}

					if (ad.css) {
						const containerStyles = [];
						const frameStyles = [];

						for (const k in ad.css) {
							if (CONTAINER_STYLES.indexOf(k) !== -1) {
								containerStyles.push(k+":"+ad.css[k]);
							} else {
								frameStyles.push(k+":"+ad.css[k]);
							}

						}

						adContainer.setAttribute("style", containerStyles.join(";"));
						iframe.setAttribute("style", frameStyles.join(";"));
					}

					iframe.setAttribute("src", ad.frameUrl);

					const overlay = document.createElement("div");

					overlay.className = "remoteADContainerOverlay";
					overlay.appendChild(adContainer);

					overlay.addEventListener("click", function () {
						self.hideAD();
					}, false);

					adContainer.addEventListener("click", function (event) {
						event.stopPropagation();
						//event.preventDefault();
					}, false);

					adContainer.style.opacity = 0;

					setTimeout(function () {
						adContainer.style.opacity = 1;
					}, 0);

					/*
            adContainer.querySelector(".dontShowAgain input").addEventListener( "click", function(){

              bg.RemoteAD.ignoreAd( ad.id );
              self.hideAD();

            }, false );
            */

					document.body.appendChild(overlay);
				}
			});
		});
	}

	window.addEventListener("load", function () {
		setTimeout(function () {
			checkADShow();
		}, 3000);
	}, false);
};

export default RemoteAD;
