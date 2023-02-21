import { Utils } from '../../utils.js';

window.addEventListener(
	'load',
	function () {
		Utils.Opener.addModificator(function (url) {
			try {
				const parsedUrl = Utils.parseUrl(url);

				if (parsedUrl && parsedUrl.host) {
					let host = parsedUrl.host.toLowerCase();

					host = host.replace(/^www\./, '');

					if (host === 'gearbest.com') {
						return 'https://fvdspeeddial.com/load.php?url=' + encodeURIComponent(url);
					}
				}
			} catch (ex) {
				console.warn(ex);
			}
		});
	},
	false
);
