import Broadcaster from '../_external/broadcaster.js';

Broadcaster.onMessage.addListener(function (message) {
	if (message.action === "web:pp-donate-success") {
		localStorage["paypal-donate-state"] = JSON.stringify({
			date: new Date().getTime(),
		});
	}
});