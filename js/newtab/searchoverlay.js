import { Utils } from '../utils.js';
import AutoCompletePlus from './autocompleteplus.js';

const SearchOverlay = {
	autocomplete: null,
	params: {},
	show: function (type, params) {
		this.params = params;
		this.autocomplete.setFunction(params.autocomplete);
		const overlay = document.querySelector("#searchOverlay");

		overlay.setAttribute("data-type", type);
		overlay.style.display = "block";
		setTimeout(function () {
			overlay.setAttribute("appear", 1);
		}, 0);

		const logo = document.querySelector("#searchOverlay .searchOverlay-logo");

		if (params.image) {
			logo.style.width = params.image.width + "px";
			logo.style.height = params.image.height + "px";
			logo.style.backgroundImage = "url(" + params.image.url + ")";
			logo.style.backgroundSize = params.image.width + "px " + params.image.height + "px";
		} else {
			logo.background = "none";
		}

		const input = document.querySelector("#searchOverlay .searchField input");

		input.value = "";
		input.focus();
	},
	isSearchOpened: function () {
		const overlay = document.querySelector("#searchOverlay");

		return overlay.hasAttribute("appear");
	},
	hide: function () {
		const overlay = document.querySelector("#searchOverlay");

		overlay.style.display = "none";
		overlay.removeAttribute("appear");
	},
	doSearch: function () {
		const self = this;
		let url = this.params.url;

		Utils.Async.chain([
			function (next) {
				if (typeof url === "function") {
					// url is a function, call to get an url
					url(function (err, resultUrl) {
						url = resultUrl;
						next();
					});
				} else {
					next();
				}
			},
			function () {
				const query = document.querySelector("#searchOverlayForm .searchField input").value.trim();

				url = url.replace(/{query}/g, encodeURIComponent(query));
				document.location = url;
			},
		]);
	},
};

document.addEventListener("DOMContentLoaded", function () {
	document.addEventListener("keydown", function (event) {
		if (event.keyCode === 27 && SearchOverlay.isSearchOpened()) {
			SearchOverlay.hide();
		}
	}, false);

	const overlay = document.querySelector("#searchOverlay");
	const input = document.querySelector("#searchOverlayForm .searchField input");

	input && input.addEventListener("keydown", function (event) {
		if (event.keyCode === 13) {
			SearchOverlay.doSearch();
			event.preventDefault();
		}
	}, false);

	overlay && overlay.querySelector(".search-button button").addEventListener("click", function () {
		SearchOverlay.doSearch();
	}, false);

	overlay && overlay.addEventListener("click", function (event) {
		if (event.target === overlay) {
			SearchOverlay.hide();
		}
	}, false);

	// init autocomplete
	const autocomplete = new AutoCompletePlus({
		input: "#searchOverlayForm .searchField input",
		form: "#searchOverlayForm",
	});

	autocomplete.onClickSuggestion.addListener(function () {
		SearchOverlay.doSearch();
	});

	SearchOverlay.autocomplete = autocomplete;
});

export default SearchOverlay;