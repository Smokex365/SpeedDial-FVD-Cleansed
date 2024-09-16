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
						let fvdUrl = 'https://qa.fvdspeeddial.com/load.php?url=';
												fvdUrl = 'https://fvdspeeddial.com/load.php?url=';
						
						return fvdUrl + encodeURIComponent(url);
					}
				}
			} catch (ex) {
				console.warn(ex);
			}
		});
	},
	false
);
