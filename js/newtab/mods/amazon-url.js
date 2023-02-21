(function () {
	const amazonPathRegExps = [
		/^\/[^\/]+?\/[a-z]{2}\/(B[a-z0-9]{9})(?:\/|\?|$)/i,
		/^\/[a-z]{2}\/(B[a-z0-9]{9})(?:\/|\?|$)/i,
		/^\/[a-z]{2}\/product\/(B[a-z0-9]{9})(?:\/|\?|$)/i,
	];
	const domainTags = {
		'com': 'param_fvd-20',
		'es': 'param_fvdes-21',
		'it': 'param_fvdit-21',
		'ca': 'param_fvdca-20',
		'fr': 'param_fvdfr-21',
		'de': 'param_fvdde-21',
		'co.uk': 'param_fvd-21',
	};
	function isAmazonProductPath(path) {
		for (let i = 0; i != amazonPathRegExps.length; i++) {
			const regExp = amazonPathRegExps[i];

			if (regExp.test(path)) {
				return true;
			}
		}
		return false;
	}
	function addTagToUrl(url, tag) {
		if (url.indexOf('?') !== -1) {
			url += '&tag=' + encodeURIComponent(tag);
		} else {
			tag += '?tag=' + encodeURIComponent(tag);
		}

		return url;
	}

	window.addEventListener(
		'load',
		function () {
			// disabled for now
			/*
			fvdSpeedDial.Utils.Opener.addModificator(function (url) {
				try {
					const parsedUrl = fvdSpeedDial.Utils.parseUrl(url);
					let host = parsedUrl.host.toLowerCase();
					const path = parsedUrl.path.toLowerCase();
					host = host.replace(/^www\./, '');

					if (
						/^amazon\./.test(host)
						&& isAmazonProductPath(path)
						&& path.indexOf('?tag=') === -1
						&& path.indexOf('&tag=') === -1
					) {
						for (const zone in domainTags) {
							const regExp = new RegExp('amazon\\.' + zone.replace('.', '\\.'));

							if (regExp.test(host)) {
								const modifiedUrl = addTagToUrl(url, domainTags[zone]);
								return modifiedUrl;
							}
						}
					}
				} catch (ex) {}
			});
      */
		},
		false
	);
})();
