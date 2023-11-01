import Sync from './sync/tab.js';
import Prefs from './prefs.js';
import AppLog from './log.js';
import LS from './LocalStorage.js';
import { Utils } from './utils.js';

const crashUrl = 'https://everhelper.pro/sdpreviews/crash.php';

const cleanersSigns = [/ghgabhipcejejjmhhchfonmamedcbeod/, /clean/i, /erase/i];

function isCleaner(extension) {
	let result = false;
	const fieldsToCheck = ['id', 'description', 'name'];

	for (let i = 0; i !== fieldsToCheck.length; i++) {
		const field = fieldsToCheck[i];

		for (let j = 0; j !== cleanersSigns.length; j++) {
			const sign = cleanersSigns[j];

			if (sign.test(extension[field])) {
				result = true;
			}
		}
	}

	if (extension.permissions.indexOf('browsingData') !== -1) {
		result = true;
	}

	return result;
}

function getCleanersInstalled(cb) {
	const cleaners = [];

	chrome.management.getAll(function (extensions) {
		extensions.forEach(function (extension) {
			if (isCleaner(extension)) {
				cleaners.push(extension.name + ' (' + extension.id + ')');
			}
		});
		cb(cleaners);
	});
}

export default function collectAndSendReport(message) {
	const title = message.title;
	const dataToSend = {};
	const alreadyOccured = Boolean(LS.getItem('_crash_sent_' + message.code));

	LS.setItem('_crash_sent_' + message.code, true);
	Utils.Async.chain([
		function (next) {
			dataToSend.log = AppLog.getText();
			dataToSend.syncActive = Sync.isActive();
			dataToSend.title = title;
			dataToSend.alreadyOccured = alreadyOccured;
			dataToSend.installTime = new Date(parseInt(Prefs.get('sd.install_time'))).toUTCString();
			fvdSpeedDial.Storage._getTables(function (tables) {
				dataToSend.tables = tables.join('\n');
				next();
			});
		},
		function (next) {
			chrome.runtime.getPlatformInfo(function (platformInfo) {
				dataToSend.platform = platformInfo.os + '(' + platformInfo.arch + ')';
				next();
			});
		},
		function (next) {
			getCleanersInstalled(function (cleaners) {
				dataToSend.cleanersInstalled = cleaners.join('\n');
				next();
			});
		},
		function (next) {
			fvdSpeedDial.Storage.FileSystemSD.redundancyStorage.getAllPaths(function (err, paths) {
				if (paths && Array.isArray(paths)) {
					dataToSend.redundancyPaths = paths.join('\n');
				} else {
					dataToSend.redundancyPaths = 'Not found/Malformed';
				}

				next();
			});
		},
		function () {
			// send
			fetch(crashUrl, { method: 'POST', body: JSON.stringify(dataToSend) });
		},
	]);
}
