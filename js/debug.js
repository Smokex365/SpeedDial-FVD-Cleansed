import Config from "./config.js";

const Debug = function () {

};

Debug.prototype = {
};

["log", "info", "warn", "error"].forEach(function (method) {
	Debug.prototype[method] = function () {
		if (!Config || !Config.DEBUG) {
			return;
		}

		const args = Array.prototype.slice.call(arguments);

		console[method].apply(console, args); // #Debug
	};
});

export default new Debug();