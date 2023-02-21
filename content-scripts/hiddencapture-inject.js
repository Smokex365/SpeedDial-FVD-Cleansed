(function () {
	const replaceAlerts = function () {
		window.onbeforeunload = function () {};
		window.alert = function () {};
		window.confirm = function () {};
		window.prompt = function () {};

		if (window.jQuery) {
			const $ = window.jQuery;
			$(window).unbind && $(window).unbind('beforeunload');
			$(window).off && $(window).off('beforeunload');
		}
	};

	window.addEventListener('message', function (e) {
		if (e.data && e.data.action === 'fvdsd:hiddenCapture:__replaceAlerts') {
			replaceAlerts();
		}
	});

	replaceAlerts();
})();
