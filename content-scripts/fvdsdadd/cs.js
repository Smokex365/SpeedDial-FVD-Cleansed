if (!window.__fvdsd_add_dial_script_inserted) {
	window.__fvdsd_add_dial_script_inserted = true;

	function _createOverlay() {
		const overlay = document.createElement('div');
		const container = document.createElement('div');
		const span = document.createElement('span');

		overlay.setAttribute('id', 'fvdsd-overlay');
		container.setAttribute('id', 'fvdsd-dial-added');

		return {
			overlay: overlay,
			container: container,
			span: span,
		};
	}

	chrome.runtime.onMessage.addListener(function (message, sender, messageCallback) {
		switch (message.action) {
			case 'alreadyExists':
				setTimeout(function () {
					if (confirm(message.text)) {
						messageCallback(true);
					} else {
						messageCallback(false);
					}
				}, 0);

				return true;

				break;

			case 'dialAdded':
				var r = _createOverlay();
				var overlay = r.overlay;
				var container = r.container;
				var span = r.span;

				span.textContent = message.text;

				container.appendChild(span);

				container.style.opacity = 0;

				overlay.appendChild(container);

				document.body.appendChild(overlay);

				setTimeout(function () {
					container.style.opacity = 1;

					overlay.addEventListener(
						'click',
						function () {
							hide();
						},
						false
					);

					function hide() {
						container.style.opacity = 0;

						setTimeout(function () {
							document.body.removeChild(overlay);
						}, 600);

						clearTimeout(t);
					}

					var t = setTimeout(function () {
						hide();
					}, 2000);
				}, 0);

				break;
		}
	});
}
