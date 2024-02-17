import {Utils} from '../utils.js';

let HOST = 'https://qa.fvdspeeddial.com';
HOST = 'https://fvdspeeddial.com';

export function sendEvent(action) {
	const statsUrl = `${HOST}/a/?a=${encodeURIComponent(action)}&from=chrome_addon`;

	Utils.getUrlContent(statsUrl);
}
