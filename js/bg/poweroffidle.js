import { _b } from '../utils.js';
import Broadcaster from '../_external/broadcaster.js';

export function refreshIdleInterval(fvdSpeedDial) {
	const interval = parseInt(fvdSpeedDial.Prefs.get('poweroff.idle.interval'), 10);

	function callback_onIdleStateChanged(state) {
		console.log('Idle callback activate', interval);
		const isEnabled = _b(fvdSpeedDial.Prefs.get('poweroff.enabled'));

		if (state === 'idle' && parseInt(fvdSpeedDial.Prefs.get('poweroff.idle.interval'), 10) && isEnabled) {
			Broadcaster.sendMessage({ action: 'poweroff:hide' });
		}
	}

	try {
		chrome.idle.onStateChanged.removeListener(callback_onIdleStateChanged);
	} catch (ex) {
		console.warn(ex);
	}

	if (interval) {
		console.log('Set idle callback for', interval);
		chrome.idle.onStateChanged.addListener(callback_onIdleStateChanged);
		chrome.idle.setDetectionInterval(interval);
	}
}
