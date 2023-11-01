(function () {
	document.addEventListener("DOMContentLoaded", function () {
		document.body.addEventListener("blur", function (event) {
			const target = event.target;

			if (target.matches("input[type=number][min]")) {
				const min = parseInt(target.getAttribute("min"));
				const val = parseInt(target.value);

				if (val < min) {
					target.value = min;
				}
			}
		}, true);
	}, false);
})();