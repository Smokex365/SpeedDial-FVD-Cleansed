const Profile = function (log) {
	this._durations = {};
	this._startTimes = {};
	this._log = log;
};

Profile.prototype.start = function (action) {
	if (this._startTimes[action]) {
		this.end(action);
	}

	this._startTimes[action] = new Date().getTime();
};

Profile.prototype.end = function (action) {
	if (!this._durations[action]) {
		this._durations[action] = 0;
	}

	this._durations[action] += new Date().getTime() - this._startTimes[action];
	this._startTimes[action] = 0;
};

Profile.prototype.getReport = function () {
	const lines = [];
	for (const action in this._durations) {
		lines.push(action + ': ' + Math.round(this._durations[action] / 10) / 100 + 's');
	}

	return lines.join('\n');
};

Profile.prototype.writeReport = function () {
	const report = this.getReport();
	this._log.add('profile', report);
};

export const Log = function (eRequest) {
	const self = this;

	this.messages = [];
	this._profile = null;
	this._vars = {};

	const types = ['error', 'info', 'log', 'debug'];

	types.forEach(function (type) {
		self[type] = function () {
			const args = Array.prototype.slice.apply(arguments);
			args.unshift(type);

			self.add.apply(self, args);
		};
	});

	this.__defineGetter__('profile', function () {
		if (!this._profile) {
			this._profile = new Profile(this);
		}

		return this._profile;
	});
};

Log.prototype.add = function () {
	const args = Array.prototype.slice.call(arguments);

	const type = args.shift();

	let message = '';

	for (let i = 0; i != args.length; i++) {
		message += ' ';

		if (typeof args[i] === 'object') {
			message += JSON.stringify(args[i], {
				showHidden: true,
				depth: null,
			});
		} else {
			message += args[i];
		}
	}

	this.messages.push({
		date: new Date(),
		type: type,
		message: message,
	});
};

Log.prototype.inc = function (name, by) {
	by = by || 1;

	if (!this._vars[name]) {
		this._vars[name] = 0;
	}

	this._vars[name] += by;
};

Log.prototype.toString = function () {
			return '';
	};

export const _loadLog = new Log();
_loadLog.profile.start('Total Loading');
_loadLog.profile.start('Window Loading');
_loadLog.profile.start('DOM Loading');
document.addEventListener(
	'DOMContentLoaded',
	function () {
		_loadLog.profile.end('DOM Loading');
	},
	false
);
window.addEventListener(
	'load',
	function () {
		_loadLog.profile.end('Window Loading');
	},
	false
);
