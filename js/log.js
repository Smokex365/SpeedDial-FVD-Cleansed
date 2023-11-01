import LocalStorage from "./LocalStorage.js";

const MAX_LOG_RECORDS = 300;
const MAX_LOG_SIZE = 1024 * 1024;
const STORAGE_KEY = '_app_log';

const AppLog = {
	localStorage: new LocalStorage({listen: false}),
	_logUpdated: false,
	_log: [],
	_writeCheckInterval: null,
	_read: async function () {
		this._log = [];

		const stored = await this.localStorage.getItemAsync(STORAGE_KEY);

		if (stored) {
			try {
				this._log = JSON.parse(stored);
			} catch (ex) { console.warn(ex); }
		}
	},
	getText: function () {
		return this._log.join("\n");
	},
	startWriteCheckInterval: function () {
		const self = this;

		this._writeCheckInterval = setInterval(function () {
			if (self._logUpdated) {
				self._logUpdated = false;
				self.write();
			}
		}, 1000);
	},
	write: function () {
		if (this._log.length > MAX_LOG_RECORDS) {
			this._log.splice(0, this._log.length - MAX_LOG_RECORDS);
		}

		let logJSON = JSON.stringify(this._log);

		while (logJSON.length > MAX_LOG_SIZE) {
			// preserve log size not greater than MAX_LOG_SIZE
			this._log.shift();
			logJSON = JSON.stringify(this._log);
		}
		this.localStorage.setItemAsync(STORAGE_KEY, logJSON);
	},
	info: function () {
		const args = Array.prototype.slice.call(arguments);

		args.unshift("info");
		this.log.apply(this, args);
	},
	err: function () {
		const args = Array.prototype.slice.call(arguments);

		args.unshift("err");
		this.log.apply(this, args);
	},
	warn: function () {
		const args = Array.prototype.slice.call(arguments);

		args.unshift("warn");
		this.log.apply(this, args);
	},
	log: function () {
		const args = Array.prototype.slice.call(arguments);
		const level = args.shift();
		let logLine = [];

		logLine.push(new Date().toUTCString());
		logLine.push("_" + level + "_");
		for (let i = 0; i !== args.length; i++) {
			let elem = args[i];


			if (typeof elem === "object") {
				elem = JSON.stringify(elem);
			}

			logLine.push(elem);
		}
		logLine = logLine.join(" ");
		// this._logUpdated = true;
		this._log.push(logLine);
		this.write();
	},
};

export default AppLog;