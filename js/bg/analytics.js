import {Utils} from '../utils.js';

export function sendEvent(action) {
	const statsUrl = `https://fvdspeeddial.com/a/?a=${encodeURIComponent(action)}&from=chrome_addon`;

	Utils.getUrlContent(statsUrl);
}
