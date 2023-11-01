// tab script for hidden capture, sends and receive data from background tab

const HiddenCaptureQueue = {
	capture: function (params, callback) {
		chrome.runtime.sendMessage({
			action: "hiddencapture:queue",
			wantResponse: !!callback,
		}, function (res) {
			if (callback) {
				callback(res);
			}
		});
	},
	empty: function () {
		chrome.runtime.sendMessage({
			action: "hiddencapture:empty",
		}, function () {});
	},
};

export default HiddenCaptureQueue;