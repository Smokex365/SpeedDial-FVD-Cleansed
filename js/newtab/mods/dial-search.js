import Broadcaster from '../../_external/broadcaster.js';
import { _ } from '../../localizer.js';
import { _b } from '../../utils.js';
import Config from '../../config.js';
import { EventType } from '../../types.js';

const CORRECT_CONTAINER_WIDTH_INCREASE = 11;

function SearchRequest(StorageSD, query, cb) {
	let cancelled = false;

	this.cancel = function () {
		cancelled = true;
	};
	StorageSD.searchDials(query, function (err, dials) {
		if (cancelled) {
			return;
		}

		cb(err, dials);
	});
}

const DialSearchModule = function (fvdSpeedDial) {
	const DialSearch = this;
	this.fvdSpeedDial = fvdSpeedDial;
	const { SpeedDial } = fvdSpeedDial;

	SpeedDial.onBuildCompleted.addListener(function (params) {
		if (!params || !params.isSearch) {
			DialSearch.reset();
			DialSearch.hide();
		}
	});
	Broadcaster.onMessage.addListener(function (msg) {
		if (msg.action === 'pref:changed') {
			if (msg.name === 'sd.enable_dials_search') {
				DialSearch.refreshEnableState();
			}
		}
	});

	fvdSpeedDial.addEventListener(
		EventType.LOAD,
		() => {
			DialSearch.container = document.getElementById('dial-search-container');
			DialSearch.queryInput = document.getElementById('dial-search-query');
			DialSearch.searchInputParent = document.querySelector(
				'#dial-search-container .dial-search-input'
			);
			DialSearch.resetButton = document.querySelector(
				'#dial-search-container .dial-search-reset-icon'
			);
			const { queryInput, searchInputParent, resetButton } = DialSearch;

			queryInput.addEventListener(
				'input',
				function () {
					const q = queryInput.value;

					DialSearch.doSearch(q);
					DialSearch.refreshResetButtonState();
				},
				false
			);
			searchInputParent.addEventListener(
				'mouseover',
				function () {
					DialSearch.show();
					queryInput.focus();
				},
				false
			);
			searchInputParent.addEventListener(
				'mouseout',
				function () {
					DialSearch.hide();
				},
				false
			);
			queryInput.addEventListener(
				'blur',
				function () {
					DialSearch.hide();
				},
				false
			);
			queryInput.addEventListener(
				'keydown',
				function (event) {
					if (event.keyCode === 27) {
						// escape pressed, clear and blur input
						DialSearch.reset();
						DialSearch.doSearch();
					}

					if (event.keyCode === 13) {
						if (DialSearch.isInNotFoundState()) {
							DialSearch.doWebSearch();
						}
					}
				},
				false
			);
			queryInput.addEventListener(
				'mousedown',
				function () {
					queryInput.setAttribute('user-clicked', 1);
				},
				false
			);
			resetButton.addEventListener(
				'mousedown',
				function (event) {
					DialSearch.empty();
					event.preventDefault();
				},
				false
			);
			document.addEventListener('keydown', (event) => {
				if (event.ctrlKey && event.code === 'KeyF') {
					event.preventDefault();
					event.stopPropagation();
					DialSearch.show();
					queryInput.focus();
					queryInput.setAttribute('user-clicked', 1);
				}
			});
			document.querySelector('.dial-search-not-found-block a').addEventListener(
				'click',
				function (event) {
					DialSearch.doWebSearch();
					event.preventDefault();
				},
				false
			);
			document.querySelector('#dial-search-container .dial-search-icon').addEventListener(
				'mousedown',
				function (event) {
					queryInput.focus();
					event.preventDefault();
				},
				false
			);
			DialSearch.refreshEnableState();
		},
		false
	);
};

DialSearchModule.prototype = {
	resetHelperAttributes: function () {
		const { queryInput } = this;
		document.body.removeAttribute('dial-search-show-results');
		document.body.removeAttribute('dial-search-not-found');
		queryInput.removeAttribute('user-clicked');
	},
	doSearch: function (query) {
		const self = this;
		const {
			fvdSpeedDial: { SpeedDial, StorageSD },
		} = this;
		let { activeSearchRequest = null } = this;

		if (activeSearchRequest) {
			try {
				activeSearchRequest.cancel();
			} catch (ex) {
				console.warn(ex);
			}
			activeSearchRequest = null;
		}

		query = query || '';
		query = query.trim();

		if (query.length === 0) {
			this.resetHelperAttributes();
			SpeedDial.rebuildCells({
				isSearch: true,
			});
			return;
		}

		if (query.length < Config.MIN_DIALS_SEARCH_QUERY_LENGTH) {
			this.resetHelperAttributes();
			return;
		}

		activeSearchRequest = new SearchRequest(StorageSD, query, function (err, dials) {
			self.resetHelperAttributes();

			if (!err) {
				document.body.setAttribute('dial-search-show-results', 1);

				if (dials.length === 0) {
					self.setNotFound();
				} else {
					SpeedDial.rebuildCells({
						dials: dials,
						isSearch: true,
					});
				}
			}
		});
	},
	setNotFound: function () {
		const { queryInput } = this;

		const query = queryInput.value;

		document.body.setAttribute('dial-search-not-found', 1);
		const message = _('newtab_dials_search_no_match_query');
		const messageContainer = document.querySelector(
			'#dial-search-container .dial-search-no-match-message'
		);

		messageContainer.innerHTML = message;
		messageContainer.querySelector('strong').textContent = query;
	},
	isInNotFoundState: function () {
		return document.body.hasAttribute('dial-search-not-found');
	},
	doWebSearch: function (query) {
		const {
			fvdSpeedDial: { SpeedDialMisc },
		} = this;
		const { queryInput } = this;

		query = query || queryInput.value;
		query = query.trim();

		if (!query.length) {
			return;
		}

		SpeedDialMisc.doSearch(query);
	},
	show: function () {
		const { searchInputParent } = this;
		searchInputParent.setAttribute('expanded', 1);
	},
	hide: function () {
		const { queryInput, searchInputParent } = this;
		const val = queryInput.value.trim();

		if (!val && !queryInput.hasAttribute('user-clicked')) {
			queryInput.blur();
		}

		if (document.activeElement === queryInput || val) {
			return;
		}

		searchInputParent.setAttribute('expanded', 0);
		queryInput.removeAttribute('user-clicked');
		this.refreshResetButtonState();
	},
	reset: function () {
		const { queryInput } = this;
		this.resetHelperAttributes();
		queryInput.value = '';
		queryInput.blur();
		this.refreshResetButtonState();
	},
	empty: function () {
		const { queryInput } = this;
		queryInput.value = '';
		this.doSearch();
		this.refreshResetButtonState();
	},
	refreshResetButtonState: function () {
		const { queryInput, searchInputParent } = this;
		const text = queryInput.value;

		if (text.length) {
			searchInputParent.setAttribute('with-text', 1);
		} else {
			searchInputParent.removeAttribute('with-text');
		}
	},
	refreshEnableState: function () {
		const {
			fvdSpeedDial: { Prefs },
		} = this;

		if (_b(Prefs.get('sd.enable_dials_search'))) {
			document.body.setAttribute('dialsearchenabled', 1);
		} else {
			document.body.removeAttribute('dialsearchenabled');
		}
	},
};

export default DialSearchModule;
