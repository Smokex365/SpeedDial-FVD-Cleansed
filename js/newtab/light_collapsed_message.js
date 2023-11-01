import { _b } from '../utils.js';

let timeout = null;

function elem() {
	return document.querySelector("#lightCollapsedMessage");
}
function reposition() {
	const msg = elem();

	if (msg.hasAttribute("top")) {
		// message in top, do not center it
		return;
	}

	const windowWidth = document.documentElement.clientWidth;
	const windowHeight = document.documentElement.clientHeight;
	const elemWidth = msg.offsetWidth;
	const elemHeight = msg.offsetHeight;
	const pos = {
		left: windowWidth/2 - elemWidth/2,
		top: windowHeight/2 - elemHeight/2,
	};

	msg.style.left = pos.left + "px";
	msg.style.top = pos.top + "px";
}

const lightCollapsedMessage = {
	show: function (Prefs) {
		if (!_b(Prefs.get("sd.light_collapsed_message_show"))) {
			return;
		}

		const self = this;
		const msg = elem();

		msg.style.display = "block";
		reposition();
		setTimeout(function () {
			msg.setAttribute("appear", 1);
			try {
				clearTimeout(timeout);
			} catch (ex) {
				console.warn(ex);
			}
			timeout = setTimeout(function () {
				self.hideAnimate();
			}, 3000);
		}, 100);
	},
	hide: function () {
		const msg = elem();


		if (msg.style.display === "none") {
			return;
		}

		msg.style.display = "none";
		msg.removeAttribute("appear");
		msg.removeAttribute("top");
	},
	hideAnimate: function () {
		const self = this;

		elem().removeAttribute("appear");
		setTimeout(function () {
			self.hide();
		}, 300);
	},
	doNotShowMore: function () {
		chrome.storage.local.set({'prefs.sd.light_collapsed_message_show': false});
	},
};

window.addEventListener("resize", function () {
	if (elem() && elem().style.display === "block") {
		reposition();
	}
}, false);

document.addEventListener("DOMContentLoaded", function () {
	if (!elem()) {
		return;
	}

	const closeButton = elem().querySelector(".close-button");

	closeButton.addEventListener("click", function () {
		lightCollapsedMessage.doNotShowMore();
		lightCollapsedMessage.hideAnimate();
	}, false);
}, false);

export default lightCollapsedMessage;