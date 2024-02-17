import '../_external/jquery.js';
import '../_external/speechify.js';

import Shortcut from '../_external/shortcut.js';
import Broadcaster from '../_external/broadcaster.js';
import { _ } from '../localizer.js';
import Config from '../config.js';
import { Utils, _b } from '../utils.js';
import { start_drop_down, end_drop_down } from './dropdown.js';

const SpeedDialMisc = function (fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;
	Broadcaster.onMessage.addListener(msg => {
		if (msg.action === 'pref:changed') {
			this._prefsListener(msg.name, msg.value);
		} else if (msg.action === 'sync:syncdatachanged') {
			this._syncDataChangedListener();
		}
	});
};

SpeedDialMisc.prototype = {
	_optionsOpened: false,
	_needRebuild: false,
	_checkNeedRebuildInterval: false,

	settingsInvalidated: [],
	settingsInvalidatedIntervalCheck: null,

	allRefreshesSettings: ['speedDial', 'mostVisited', 'recentlyClosed'],
	partPrefs: {},

	_showRateMessageAfterDaysCount: 1,

	refreshSearchPanel: function () {
		const { fvdSpeedDial } = this;

		if (_b(fvdSpeedDial.Prefs.get('sd.enable_search'))) {
			const cseSearchBox = document.getElementById('cse-search-box');

			if (cseSearchBox) {
				cseSearchBox.style.display = 'block';
				document.body.setAttribute('searchEnabled', 1);

				chrome.i18n.getAcceptLanguages(function (languages) {
					if (languages.indexOf('ru') !== -1 && languages.indexOf('ru') < 3) {
						// document.querySelector(".searchForm button span").textContent = _("newtab_search_on_yandex");
					}
				});
			}
		} else {
			const cseSearchBox = document.getElementById('cse-search-box');

			if (cseSearchBox) {
				cseSearchBox.style.display = 'none';
				document.body.setAttribute('searchEnabled', 0);
			}
		}
	},

	unHighlightSearch: function () {
		document.querySelector('#searchFormContainer')
			&& document.querySelector('#searchFormContainer').classList.remove('highlight');
	},

	doSearch: function (query) {
		const {
			fvdSpeedDial: { Search },
		} = this;
		Search.doSearch(query);
	},

	showCenterScreenNotification: function (text) {
		const notification = document.getElementById('center-screen-notification');

		notification.style.display = 'block';
		notification.getElementsByClassName('notification-message')[0].innerHTML = text;
		setTimeout(function () {
			notification.setAttribute('appear', 1);
		}, 0);
		setTimeout(function () {
			notification.removeAttribute('appear');
			setTimeout(function () {
				notification.style.display = 'none';
			}, 500);
		}, 3000);
	},

	init: function () {
		const { fvdSpeedDial } = this;
		const { SpeedDial, Dialogs, PowerOffClient, Apps } = fvdSpeedDial;
		const that = this;

		this.refreshSearchPanel();
				$('#q').speechify({
			lang: chrome.i18n.getUILanguage(),
			onResult: () => {
				this.doSearch();
			},
			build: data => {
				data.icon.attr('title', _('newtab_voice_search'));
			},
		});
		
		const searchForm = document.querySelector('.searchForm');

		searchForm
			&& searchForm.addEventListener(
				'submit',
				event => {
					this.doSearch();
					event.stopPropagation();
					event.preventDefault();
				},
				false
			);

		const inputSearch = document.getElementById('q');

		inputSearch
			&& inputSearch.addEventListener(
				'dblclick',
				function (event) {
					event.stopPropagation();
				},
				false
			);

		inputSearch
			&& inputSearch.addEventListener(
				'focus',
				function () {
					searchForm.setAttribute('active', 1);
				},
				false
			);

		inputSearch
			&& inputSearch.addEventListener(
				'blur',
				function () {
					searchForm.removeAttribute('active');
				},
				false
			);
		// need call immedately
		this._setupIconsMenu();
		this.setExpandedState();
		this.setCustomSearchState();
		this.refreshMenu();

		this.settingsInvalidatedIntervalCheck = setInterval(function () {
			if (that.settingsInvalidated.length !== 0) {
				const toRefresh = that.settingsInvalidated;

				that.settingsInvalidated = [];
				that.refreshSettingsWindow(toRefresh);
			}
		}, 200);

		this._initialOptionsSetup();

		document.addEventListener(
			'click',
			function (event) {
				that._handlerDocumentClick.call(that, event);
			},
			true
		);

		this._checkNeedRebuildInterval = setInterval(function () {
			if (that._needRebuild) {
				that._needRebuild = false;
				that._setupLabelsBelowIcons();
				that._setupIconsMenu();
			}
		}, 100);

		// check need display rate message
		if (!_b(fvdSpeedDial.Prefs.get('sd.dont_display_rate_message')) && !Config.HIDE_RATE_MESSAGE) {
			setTimeout(function () {
				const installTime = fvdSpeedDial.Prefs.get('sd.install_time');

				if (installTime !== null) {
					const now = new Date().getTime();
					const days = Math.floor((now - installTime) / (1000 * 3600 * 24));

					if (days >= that._showRateMessageAfterDaysCount) {
						that.showOptions('rateMessage', document.getElementById('searchBar'), null, null, true);
					}
				}
			}, 5000);
		}

		if (_b(fvdSpeedDial.Prefs.get('display_themes_message'))) {
			setTimeout(function () {
				//that.showOptions( "themesInstallMessage", document.getElementById( "searchBar" ), null,  null, true );
			}, 8000);
		}

		// set listeners

		document.getElementById('enableSpeedDial_yes')
			&& document.getElementById('enableSpeedDial_yes').addEventListener(
				'click',
				() => {
					this.confirmSetting(
						document.getElementById('enableSpeedDial_yes').parentNode,
						'enableSpeedDial',
						true
					);
				},
				false
			);

		document.getElementById('enableSpeedDial_no')
			&& document.getElementById('enableSpeedDial_no').addEventListener(
				'click',
				() => {
					this.confirmSetting(
						document.getElementById('enableSpeedDial_no').parentNode,
						'enableSpeedDial',
						false
					);
				},
				false
			);

		document.getElementById('defaultSpeedDial')
			&& document.getElementById('defaultSpeedDial').addEventListener(
				'change',
				() => {
					this.changeDefaultDisplayType(
						'speeddial',
						document.getElementById('defaultSpeedDial').checked
					);
				},
				false
			);

		document.getElementById('speedDialColumns')
			&& document.getElementById('speedDialColumns').addEventListener(
				'focus',
				() => {
					this.rebuildColumnsField(['speedDialColumns']);
				},
				false
			);

		document.getElementById('sdButtonManageGroups')
			&& document.getElementById('sdButtonManageGroups').addEventListener(
				'click',
				() => {
					this.hideOptions();
					Dialogs.manageGroups();
				},
				false
			);

		document.getElementById('enableMostVisited_yes')
			&& document.getElementById('enableMostVisited_yes').addEventListener(
				'click',
				() => {
					this.confirmSetting(
						document.getElementById('enableMostVisited_yes').parentNode,
						'enableMostVisited',
						true
					);
				},
				false
			);

		document.getElementById('enableMostVisited_no')
			&& document.getElementById('enableMostVisited_no').addEventListener(
				'click',
				() => {
					this.confirmSetting(
						document.getElementById('enableMostVisited_no').parentNode,
						'enableMostVisited',
						false
					);
				},
				false
			);

		document.getElementById('defaultMostVisited')
			&& document.getElementById('defaultMostVisited').addEventListener(
				'change',
				() => {
					this.changeDefaultDisplayType(
						'mostvisited',
						document.getElementById('defaultMostVisited').checked
					);
				},
				false
			);

		document.getElementById('mostVisitedColumns')
			&& document.getElementById('mostVisitedColumns').addEventListener(
				'focus',
				() => {
					this.rebuildColumnsField(['mostVisitedColumns']);
				},
				false
			);

		document.getElementById('mostvisitedButtonSync')
			&& document.getElementById('mostvisitedButtonSync').addEventListener(
				'click',
				function (event) {
					SpeedDial.syncMostVisited();
					document.getElementById('doneflushMostVisitedCache').setAttribute('active', 1);
					setTimeout(function () {
						document.getElementById('doneflushMostVisitedCache').removeAttribute('active');
					}, 2000);
				},
				false
			);

		document.getElementById('mostvisitedButtonRestoreRemoved')
			&& document.getElementById('mostvisitedButtonRestoreRemoved').addEventListener(
				'click',
				function (event) {
					SpeedDial.mostVisitedRestoreRemoved();
				},
				false
			);

		document.getElementById('enableRecentlyClosed_yes')
			&& document.getElementById('enableRecentlyClosed_yes').addEventListener(
				'click',
				() => {
					this.confirmSetting(
						document.getElementById('enableRecentlyClosed_yes').parentNode,
						'enableRecentlyClosed',
						true
					);
				},
				false
			);

		document.getElementById('enableRecentlyClosed_no')
			&& document.getElementById('enableRecentlyClosed_no').addEventListener(
				'click',
				() => {
					this.confirmSetting(
						document.getElementById('enableRecentlyClosed_no').parentNode,
						'enableRecentlyClosed',
						false
					);
				},
				false
			);

		document.getElementById('defaultRecentlyClosed')
			&& document.getElementById('defaultRecentlyClosed').addEventListener(
				'change',
				() => {
					this.changeDefaultDisplayType(
						'recentlyclosed',
						document.getElementById('defaultRecentlyClosed').checked
					);
				},
				false
			);

		document.getElementById('recentlyClosedColumns')
			&& document.getElementById('recentlyClosedColumns').addEventListener(
				'focus',
				() => {
					this.rebuildColumnsField(['recentlyClosedColumns']);
				},
				false
			);

		document.getElementById('sdCbCanTurnOffNewTabPopup')
			&& document.getElementById('sdCbCanTurnOffNewTabPopup').addEventListener(
				'click',
				function (event) {
					fvdSpeedDial.Prefs.set(
						'sd.display_can_turn_off_newtab_popup',
						!document.getElementById('sdCbCanTurnOffNewTabPopup').checked
					);
				},
				false
			);

		if (document.getElementById('rateMessage')) {
			const items = document.getElementById('rateMessage').getElementsByClassName('click');

			for (let i = 0; i !== items.length; i++) {
				items[i].addEventListener('click', () => {
					this.openChromeStorePage();
				});
			}
		}

		document.getElementById('sdCBDontDisplayMigrateMessage')
			&& document.getElementById('sdCBDontDisplayMigrateMessage').addEventListener(
				'click',
				() => {
					this.setRateMessageNotDisplayState(
						document.getElementById('sdCBDontDisplayMigrateMessage').checked
					);
				},
				false
			);

		document.getElementById('sdDontDisplayThemesMessage')
			&& document.getElementById('sdDontDisplayThemesMessage').addEventListener(
				'click',
				function () {
					fvdSpeedDial.Prefs.set(
						'display_themes_message',
						!document.getElementById('sdDontDisplayThemesMessage').checked
					);
				},
				false
			);

		document.getElementById('searchBar')
			&& document.getElementById('searchBar').addEventListener(
				'dblclick',
				() => {
					this.processDblClick(event);
				},
				false
			);
		const buttonsIds = ['buttonSpeedDial', 'buttonMostVisited', 'buttonRecentlyClosed'];

		buttonsIds.forEach(buttonId => {
			document.getElementById(buttonId)
				&& document.getElementById(buttonId).addEventListener(
					'mouseover',
					() => {
						this.mouseOverButton(document.getElementById(buttonId));
					},
					false
				);

			document.getElementById(buttonId)
				&& document.getElementById(buttonId).addEventListener(
					'mouseout',
					() => {
						this.mouseOutButton(document.getElementById(buttonId));
					},
					false
				);
		});
		document.getElementById('sdSetDisplayTypeSpeedDial')
			&& document.getElementById('sdSetDisplayTypeSpeedDial').addEventListener(
				'click',
				function () {
					SpeedDial.setCurrentDisplayType('speeddial');
				},
				false
			);

		document.getElementById('sdSetDisplayTypeSpeedDial')
			&& document.getElementById('sdSetDisplayTypeSpeedDial').addEventListener(
				'click',
				function () {
					SpeedDial.setCurrentDisplayType('speeddial');
				},
				false
			);

		document.getElementById('speedDialExpand')
			&& document.getElementById('speedDialExpand').addEventListener(
				'click',
				function () {
					if (PowerOffClient.isHidden()) {
						return;
					}

					fvdSpeedDial.Prefs.toggle('sd.speeddial_expanded');
				},
				false
			);

		document.getElementById('speedDialHide')
			&& document.getElementById('speedDialHide').addEventListener(
				'click',
				function () {
					if (PowerOffClient.isHidden()) {
						return;
					}

					fvdSpeedDial.Prefs.toggle('sd.speeddial_expanded');
				},
				false
			);

		document.getElementById('sdOpenFastOptions')
			&& document.getElementById('sdOpenFastOptions').addEventListener(
				'click',
				e => {
					this.showOptions('speedDialOptions', document.getElementById('sdOpenFastOptions'), e);
				},
				false
			);

		document.getElementById('sdSetDisplayTypeMostVisited')
			&& document.getElementById('sdSetDisplayTypeMostVisited').addEventListener(
				'click',
				function () {
					SpeedDial.setCurrentDisplayType('mostvisited');
				},
				false
			);

		document.getElementById('mostVisitedExpand')
			&& document.getElementById('mostVisitedExpand').addEventListener(
				'click',
				function () {
					if (PowerOffClient.isHidden()) {
						return;
					}

					fvdSpeedDial.Prefs.toggle('sd.mostvisited_expanded');
				},
				false
			);

		document.getElementById('mostVisitedHide')
			&& document.getElementById('mostVisitedHide').addEventListener(
				'click',
				function () {
					if (PowerOffClient.isHidden()) {
						return;
					}

					fvdSpeedDial.Prefs.toggle('sd.mostvisited_expanded');
				},
				false
			);

		document.getElementById('mostVisitedOpenFastOptions')
			&& document.getElementById('mostVisitedOpenFastOptions').addEventListener(
				'click',
				e => {
					this.showOptions(
						'mostVisitedOptions',
						document.getElementById('mostVisitedOpenFastOptions'),
						e
					);
				},
				false
			);

		document.getElementById('sdSetDisplayTypeRecentlyClosed')
			&& document.getElementById('sdSetDisplayTypeRecentlyClosed').addEventListener(
				'click',
				function () {
					SpeedDial.setCurrentDisplayType('recentlyclosed');
				},
				false
			);

		document.getElementById('recentlyClosedExpand')
			&& document.getElementById('recentlyClosedExpand').addEventListener(
				'click',
				function () {
					if (PowerOffClient.isHidden()) {
						return;
					}

					fvdSpeedDial.Prefs.toggle('sd.recentlyclosed_expanded');
				},
				false
			);

		document.getElementById('recentlyClosedHide')
			&& document.getElementById('recentlyClosedHide').addEventListener(
				'click',
				function () {
					if (PowerOffClient.isHidden()) {
						return;
					}

					fvdSpeedDial.Prefs.toggle('sd.recentlyclosed_expanded');
				},
				false
			);

		document.getElementById('recentlyClosedOpenFastOptions')
			&& document.getElementById('recentlyClosedOpenFastOptions').addEventListener(
				'click',
				e => {
					this.showOptions(
						'recentlyClosedOptions',
						document.getElementById('recentlyClosedOpenFastOptions'),
						e
					);
				},
				false
			);

		document.getElementById('buttonSettings')
			&& document.getElementById('buttonSettings').addEventListener(
				'click',
				function () {
					document.location = 'options.html';
				},
				false
			);

		fvdSpeedDial.Sync.isActive(function (active) {
			if (!active) {
				document.getElementById('buttonSync')
					&& document.getElementById('buttonSync').removeAttribute('hidden');
			}
		});

		document.getElementById('buttonSync')
			&& document.getElementById('buttonSync').addEventListener(
				'click',
				function () {
					fvdSpeedDial.Sync.syncAddonOptionsUrl(function (url) {
						if (url) {
							chrome.tabs.create({
								url: url,
								active: true,
							});
							fvdSpeedDial.Sync.startSync('main', function (state) {
								if (state === 'syncActive') {
									// sync active on another driver
									Dialogs.alert(
										_('dlg_alert_sync_on_another_driver_title'),
										_('dlg_alert_sync_on_another_driver_text')
									);
								}
							});
						} else {
							document.location = 'options.html#sync';
						}
					});
				},
				false
			);

		document.getElementById('fastMenuToggleButton')
			&& document.getElementById('fastMenuToggleButton').addEventListener(
				'click',
				() => {
					this.toggleMenu();
				},
				false
			);

		document.getElementById('speedDialWrapper')
			&& document.getElementById('speedDialWrapper').addEventListener(
				'dblclick',
				function (event) {
					SpeedDial.wrapperDblClick(event);
				},
				false
			);

		document.getElementById('q')
			&& document.getElementById('q').addEventListener(
				'focus',
				function (event) {
					document.getElementById('q').parentNode.setAttribute('focused', '1');
				},
				false
			);

		document.getElementById('q')
			&& document.getElementById('q').addEventListener(
				'blur',
				function (event) {
					document.getElementById('q').parentNode.setAttribute('focused', '0');
				},
				false
			);

		document.getElementById('sdCbSetListViewTypeTitle')
			&& document.getElementById('sdCbSetListViewTypeTitle').addEventListener(
				'click',
				function (event) {
					SpeedDial.setListViewType();
				},
				false
			);

		document.getElementById('sdCbSetListViewTypeUrl')
			&& document.getElementById('sdCbSetListViewTypeUrl').addEventListener(
				'click',
				function (event) {
					SpeedDial.setListViewType();
				},
				false
			);

		document.getElementById('sdListMenuAddDial')
			&& document.getElementById('sdListMenuAddDial').addEventListener(
				'click',
				function (event) {
					Dialogs.addDial();
				},
				false
			);

		document.getElementById('mostVisitedListMenuOpenAllLinks')
			&& document.getElementById('mostVisitedListMenuOpenAllLinks').addEventListener(
				'click',
				function (event) {
					SpeedDial.openAllCurrentMostVisitedLinks();
				},
				false
			);

		document.getElementById('mostVisitedListMenuRemoveAllLinks')
			&& document.getElementById('mostVisitedListMenuRemoveAllLinks').addEventListener(
				'click',
				function (event) {
					SpeedDial.removeAllCurrentMostVisitedLinks();
				},
				false
			);

		document.getElementById('recentlyClosedListMenuOpenAllLinks')
			&& document.getElementById('recentlyClosedListMenuOpenAllLinks').addEventListener(
				'click',
				function (event) {
					SpeedDial.openAllCurrentRecentlyClosedLinks();
				},
				false
			);

		document.getElementById('recentlyClosedListMenuRemoveAllLinks')
			&& document.getElementById('recentlyClosedListMenuRemoveAllLinks').addEventListener(
				'click',
				function (event) {
					SpeedDial.removeAllCurrentRecentlyClosedLinks();
				},
				false
			);

		document.getElementById('no3dSwtichToStandard')
			&& document.getElementById('no3dSwtichToStandard').addEventListener(
				'click',
				function (event) {
					fvdSpeedDial.Prefs.set('sd.display_mode', 'standard');
				},
				false
			);

		document.getElementById('changeBackgroundBlock')
			&& document.getElementById('changeBackgroundBlock').addEventListener(
				'click',
				function (event) {
					frameWin.gFVDSSDSettings.displayWindow('fvdsd_sd', 'paneSdBackground');
				},
				false
			);

		document.getElementById('appsPanelOpenButton')
			&& document.getElementById('appsPanelOpenButton').addEventListener(
				'click',
				function (event) {
					Apps.toggle();
				},
				false
			);

		this.refreshSyncButtonState();

		console.info('Shortcut', Shortcut);

		Shortcut.add('ctrl+enter', function () {
			SpeedDial.toggleExpand();
			return false;
		});

		setTimeout(() => {
			this.unHighlightSearch();
		}, 3000);
	},

	resetDropDown: function () {
		end_drop_down();
		setTimeout(function () {
			start_drop_down();
		}, 500);
	},

	sheduleRebuild: function () {
		this._needRebuild = true;
	},

	processDblClick: function (event) {
		const { fvdSpeedDial } = this;

		if (event.target.id === 'searchBar' || event.target.className === 'dialIcons') {
			const currValue = _b(fvdSpeedDial.Prefs.get('sd.search_bar_expanded'));

			fvdSpeedDial.Prefs.set('sd.search_bar_expanded', !currValue);
		}
	},

	setCustomSearchState: function () {
		const { fvdSpeedDial } = this;

		const disabled = _b(fvdSpeedDial.Prefs.get('sd.disable_custom_search'));
		const form = document.getElementsByClassName('searchForm')[0];

		if (form) {
			if (disabled) {
				form.setAttribute('hidden', true);
			} else {
				form.removeAttribute('hidden');
			}
		}
	},

	openChromeStorePage: function () {
		window.open(Config.STORE_URL);
	},

	setRateMessageNotDisplayState: function (state) {
		const { fvdSpeedDial } = this;

		fvdSpeedDial.Prefs.set('sd.dont_display_rate_message', state);
	},

	setExpandedState: function () {},

	toggleMenu: function () {
		const { fvdSpeedDial } = this;

		const state = !_b(fvdSpeedDial.Prefs.get('sd.main_menu_displayed'));

		fvdSpeedDial.Prefs.set('sd.main_menu_displayed', state);
	},

	refreshMenu: function () {
		const { fvdSpeedDial } = this;

		if (!document.getElementById('searchBar')) {
			return;
		}

		const menu = document.getElementById('searchBar').getElementsByClassName('activeContent')[0];
		const active = _b(fvdSpeedDial.Prefs.get('sd.main_menu_displayed')) ? '1' : '0';

		menu.setAttribute('active', active);
		document.body.setAttribute('menuactive', active);
	},

	mouseOverButton: function (elem) {
		const texts = document.getElementsByClassName('subText');

		for (let i = 0; i !== texts.length; i++) {
			if (texts[i].parentNode === elem) {
				continue;
			}

			texts[i].style.display = 'none';
		}
	},

	mouseOutButton: function () {
		const texts = document.getElementsByClassName('subText');

		for (let i = 0; i !== texts.length; i++) {
			texts[i].style.display = '';
		}
	},

	showOptions: function (id, toElem, event, pos, waitForOtherOpened, openCallback) {
		const that = this;
		const elems = document.getElementsByClassName('popupOptions');

		if (waitForOtherOpened) {
			let wait = false;

			const introductionOverlay = document.getElementById('introductionOverlay');

			if (introductionOverlay && introductionOverlay.hasAttribute('appear')) {
				wait = true;
			}

			for (let i = 0; i !== elems.length; i++) {
				if (elems[i].getAttribute('active') === '1') {
					wait = true;
				}
			}

			if (wait) {
				if (typeof waitForOtherOpened === 'function') {
					return waitForOtherOpened();
				}

				const args = arguments;

				return setTimeout(function () {
					that.showOptions.apply(that, args);
				}, 1000);
			}
		}

		pos = pos || 'left';

		if (id === null) {
			switch (SpeedDial.currentDisplayType()) {
				case 'speeddial':
					id = 'speedDialOptions';
					break;
				case 'mostvisited':
					id = 'mostVisitedOptions';
					break;
				case 'recentlyclosed':
					id = 'recentlyClosedOptions';
					break;
			}
		}

		let left;
		let top;

		if (toElem) {
			const offset = Utils.getOffset(toElem);

			left = offset.left + 0;
			top = offset.top + toElem.offsetHeight;

			if (pos === 'left') {
				left += toElem.offsetWidth;
			}
		} else {
			top = pos.top;
			left = pos.left;
		}

		let optionsOpened = false;

		for (let i = 0; i !== elems.length; i++) {
			if (elems[i].id === id && elems[i].getAttribute('active') !== '1') {
				// check options already active, toggle effect
				elems[i].setAttribute('active', '1');
				elems[i].setAttribute('collapsed', '0');
				elems[i].style.top = top + 'px';

				if (pos === 'left') {
					left -= elems[i].offsetWidth;
				}

				elems[i].style.left = left + 'px';
				optionsOpened = true;

				continue;
			}

			elems[i].setAttribute('active', '0');
		}

		if (event) {
			event.stopPropagation();
		}

		if (openCallback) {
			openCallback();
		}

		this._optionsOpened = optionsOpened;
	},

	hideOptions: function () {
		const elems = document.getElementsByClassName('popupOptions');
		let foundActive = false;

		for (let i = 0; i !== elems.length; i++) {
			if (elems[i].getAttribute('active') === '1') {
				elems[i].setAttribute('active', '0');
				foundActive = true;
			}
		}

		if (foundActive) {
			// search not confirmed settings
			const confirms = document.getElementsByClassName('confirm');

			for (let i = 0; i !== confirms.length; i++) {
				if (confirms[i].getAttribute('appear') === '1') {
					this.confirmSetting(confirms[i], confirms[i].getAttribute('for'), false);
				}
			}
		}

		this._optionsOpened = false;
	},

	confirmSetting: function (confirm, settingId, action) {
		const setting = document.getElementById(settingId);

		if (action) {
			this.ss(setting.getAttribute('sname'), setting.checked, 'bool');
		} else {
			if (setting.getAttribute('type') === 'checkbox') {
				setting.checked = !setting.checked;
			}
		}

		confirm.setAttribute('appear', '0');
	},

	rebuildGroupsList: function () {
		const { fvdSpeedDial } = this;

		const settings = fvdSpeedDial.Prefs;
		const listId = 'defaultGroupSpeedDial';
		const list = document.getElementById(listId);

		if (list) {
			fvdSpeedDial.StorageSD.groupsList(function (groups) {
				list.options.length = 0;

				list.options[list.options.length] = new Option(_('newtab_last_used_group'), -1);
				list.options[list.options.length] = new Option(_('newtab_popular_group_title'), 0);
				for (let i = 0; i !== groups.length; i++) {
					const group = groups[i];

					list.options[list.options.length] = new Option(
						Utils.cropLength(group.name, 18),
						group.id
					);
				}

				list.value = settings.get('sd.default_group');
			});
		} else {
			console.warn('element not found by id', listId);
		}
	},

	rebuildColumnsField: function (fields) {
		const { fvdSpeedDial } = this;

		if (typeof fields === 'undefined' || fields === null) {
			fields = ['speedDialColumns', 'mostVisitedColumns', 'recentlyClosedColumns'];
		}

		for (let i = 0; i !== fields.length; i++) {
			let thumbsType = 'list';

			if (fields[i] === 'speedDialColumns') {
				thumbsType = fvdSpeedDial.Prefs.get('sd.thumbs_type');
			} else if (fields[i] === 'mostVisitedColumns') {
				thumbsType = fvdSpeedDial.Prefs.get('sd.thumbs_type_most_visited');
			}

			let columnsAuto = fvdSpeedDial.SpeedDial.cellsInRowMax('auto');

			if (columnsAuto.rows) {
				columnsAuto = columnsAuto.rows;
			} else {
				columnsAuto = columnsAuto.cols;
			}

			let title = _('newtab_number_of_columns');

			if (thumbsType === 'list' || fvdSpeedDial.Prefs.get('sd.display_mode') === 'fancy') {
			} else if (fvdSpeedDial.Prefs.get('sd.scrolling') === 'horizontal') {
				title = _('newtab_number_of_rows');
			}

			const titleId = fields[i] + 'Title';
			const titleEl = document.getElementById(titleId);

			if (titleEl) {
				titleEl.textContent = title;
			} else {
				console.warn('element not found by id', titleId);
			}

			const field = document.getElementById(fields[i]);

			if (field) {
				const preValue = fvdSpeedDial.Prefs.get(field.getAttribute('sname'));
				let numOfColumns = columnsAuto;

				if (preValue !== 'auto') {
					if (preValue > columnsAuto || isNaN(numOfColumns)) {
						numOfColumns = preValue;
					}
				}

				field.options.length = 1;
				for (let columnNum = 1; columnNum <= numOfColumns; columnNum++) {
					field.options[field.options.length] = new Option(columnNum, columnNum);
				}
				field.value = preValue;
			} else {
				console.warn('element not found by id', fields[i]);
			}
		}
	},

	ss: function (key, value) {
		const { fvdSpeedDial } = this;

		fvdSpeedDial.Prefs.set(key, value);
	},

	changeDefaultDisplayType: function (type, set) {
		if (!set) {
			type = 'last_selected';
		}

		this.ss('sd.display_type', type);
	},

	refreshSyncButtonState: function () {
		const { fvdSpeedDial } = this;

		fvdSpeedDial.Sync.hasDataToSync(function (has) {
			document.getElementById('buttonSync').setAttribute('hasUpdates', has ? 1 : 0);
		});
	},

	refreshSettingsWindow: function (toRefresh = this.allRefreshesSettings) {
		const { fvdSpeedDial } = this;

		const settings = fvdSpeedDial.Prefs;

		const enableSpeedDial = settings.get('sd.enable_top_sites');
		const enableMostVisited = settings.get('sd.enable_most_visited');
		const enableRecentlyClosed = settings.get('sd.enable_recently_closed');

		if (toRefresh.indexOf('speedDial' !== -1)) {
			// build groups
			this.rebuildGroupsList();

			const def = settings.get('sd.display_type') === 'speeddial';
			const allGroupsMax = settings.get('sd.all_groups_limit_dials');
			const thumbsType = settings.get('sd.thumbs_type');
			// const defaultGroup = settings.get("sd.default_group");

			document.getElementById('enableSpeedDial').checked = enableSpeedDial;

			if (_b(enableSpeedDial)) {
				if (!_b(enableMostVisited) && !_b(enableRecentlyClosed)) {
					document.getElementById('enableSpeedDial').setAttribute('disabled', true);
				} else {
					document.getElementById('enableSpeedDial').removeAttribute('disabled');
				}
			}

			const defaultSpeedDial = document.getElementById('defaultSpeedDial');
			defaultSpeedDial && (defaultSpeedDial.checked = def);
			const maxGroupsSpeedDial = document.getElementById('maxGroupsSpeedDial');
			maxGroupsSpeedDial && (maxGroupsSpeedDial.value = allGroupsMax);
			const elementId = 'thumbsSpeedDial' + Utils.ucfirst(thumbsType);
			const element = document.getElementById(elementId);

			if (element) {
				element.checked = true;
			} else {
				console.warn('element not found by id', elementId);
			}

			// this.rebuildColumnsField(['speedDialColumns']);
			const columns = document.getElementById('speedDialColumns');

			columns && (columns.value = settings.get('sd.top_sites_columns'));
		}

		if (toRefresh.indexOf('mostVisited' !== -1)) {
			const def = settings.get('sd.display_type') === 'mostvisited';
			const showLast = settings.get('sd.max_most_visited_records');

			const thumbsType = settings.get('sd.thumbs_type_most_visited');
			const cacheLifeTime = settings.get('sd.most_visited_cache_life_time');

			document.getElementById('enableMostVisited').checked = enableMostVisited;

			if (_b(enableMostVisited)) {
				if (!_b(enableSpeedDial) && !_b(enableRecentlyClosed)) {
					document.getElementById('enableMostVisited').setAttribute('disabled', true);
				} else {
					document.getElementById('enableMostVisited').removeAttribute('disabled');
				}
			}

			const defaultMostVisited = document.getElementById('defaultMostVisited');
			defaultMostVisited && (defaultMostVisited.checked = def);

			const showLastMostVisited = document.getElementById('showLastMostVisited');
			showLastMostVisited && (showLastMostVisited.value = showLast);

			const thumbsMostVisited = document.getElementById(
				'thumbsMostVisited' + Utils.ucfirst(thumbsType)
			);
			thumbsMostVisited && (thumbsMostVisited.checked = true);

			const cacheLifeTimeMostVisited = document.getElementById('cacheLifeTimeMostVisited');
			cacheLifeTimeMostVisited && (cacheLifeTimeMostVisited.value = cacheLifeTime);

			const columns = document.getElementById('mostVisitedColumns');

			if (columns) {
				this.rebuildColumnsField(['mostVisitedColumns']);
				columns.value = settings.get('sd.most_visited_columns');
			}
		}

		if (toRefresh.indexOf('recentlyClosed' !== -1)) {
			const def = settings.get('sd.display_type') === 'recentlyclosed';
			const showLast = settings.get('sd.max_recently_closed_records');

			document.getElementById('enableRecentlyClosed').checked = enableRecentlyClosed;

			if (_b(enableRecentlyClosed)) {
				if (!_b(enableSpeedDial) && !_b(enableMostVisited)) {
					document.getElementById('enableRecentlyClosed').setAttribute('disabled', true);
				} else {
					document.getElementById('enableRecentlyClosed').removeAttribute('disabled');
				}
			}

			const defaultRecentlyClosed = document.getElementById('defaultRecentlyClosed');
			defaultRecentlyClosed && (defaultRecentlyClosed.checked = def);

			const showLastRecentlyClosed = document.getElementById('showLastRecentlyClosed');
			showLastRecentlyClosed && (showLastRecentlyClosed.value = showLast);

			const columns = document.getElementById('recentlyClosedColumns');

			if (columns) {
				this.rebuildColumnsField(['recentlyClosedColumns']);
				columns.value = settings.get('sd.recentlyclosed_columns');
			}
		}
	},
	_handlerDocumentClick: function (event) {
		try {
			if (this._optionsOpened && event.target.className !== 'buttonSmall options') {
				// check if click in options window
				let closeOptions = true;
				let elem = event.target;

				do {
					if (elem.className && elem.className.indexOf('popupOptions') !== -1) {
						closeOptions = false;
						break;
					}
				} while ((elem = elem.parentNode));

				if (closeOptions) {
					this.hideOptions();
				}
			}
		} catch (ex) {
			console.warn(ex);
		}
	},
	_syncDataChangedListener: function () {
		this.refreshSyncButtonState();
	},
	_prefsListener: function (name, value) {
		const { fvdSpeedDial } = this;

		if (!this.partPrefs[name]) {
			if (name === 'sd.display_type' || name === 'sd.display_mode') {
				this.settingsInvalidated = this.allRefreshesSettings;
			} else if (name === 'sd.disable_custom_search') {
				this.setCustomSearchState();
			} else if (name === 'sd.search_bar_expanded') {
				this.setExpandedState();
			} else if (
				['sd.speeddial_expanded', 'sd.mostvisited_expanded', 'sd.recentlyclosed_expanded'].indexOf(
					name
				) !== -1
			) {
				// rebuild icons
				this._setupIconsMenu();
			}
		} else {
			if (
				['sd.enable_top_sites', 'sd.enable_most_visited', 'sd.enable_recently_closed'].indexOf(
					name
				) !== -1
			) {
				if (!value) {
					this.resetDropDown();
					this.hideOptions();
				}

				this.settingsInvalidated = this.allRefreshesSettings;
			} else {
				const partToUpdate = this.partPrefs[name];

				if (this.settingsInvalidated.indexOf(partToUpdate) === -1) {
					this.settingsInvalidated.push(partToUpdate);
				}
			}
		}

		if (name === 'sd.main_menu_displayed') {
			this.refreshMenu();
		}

		if (name === 'sd.enable_search') {
			this.refreshSearchPanel();
		}
	},

	_setupIconsMenu: function () {
		const { fvdSpeedDial } = this;

		const buttonSpeedDial = document.getElementById('buttonSpeedDial');
		const buttonMostVisited = document.getElementById('buttonMostVisited');
		const buttonRecentlyClosed = document.getElementById('buttonRecentlyClosed');

		const currentType = fvdSpeedDial.SpeedDial.currentDisplayType();

		if (buttonSpeedDial) {
			buttonSpeedDial.setAttribute('active', currentType === 'speeddial' ? '1' : '0');

			buttonSpeedDial.setAttribute(
				'expanded',
				_b(fvdSpeedDial.Prefs.get('sd.speeddial_expanded')) ? '1' : '0'
			);

			if (_b(fvdSpeedDial.Prefs.get('sd.enable_top_sites'))) {
				buttonSpeedDial.removeAttribute('hidden');
			} else {
				buttonSpeedDial.setAttribute('hidden', true);
			}
		}

		if (buttonMostVisited) {
			buttonMostVisited.setAttribute('active', currentType === 'mostvisited' ? '1' : '0');
			buttonMostVisited.setAttribute(
				'expanded',
				_b(fvdSpeedDial.Prefs.get('sd.mostvisited_expanded')) ? '1' : '0'
			);

			if (_b(fvdSpeedDial.Prefs.get('sd.enable_most_visited'))) {
				buttonMostVisited.removeAttribute('hidden');
			} else {
				buttonMostVisited.setAttribute('hidden', true);
			}
		}

		if (buttonRecentlyClosed) {
			buttonRecentlyClosed.setAttribute('active', currentType === 'recentlyclosed' ? '1' : '0');

			buttonRecentlyClosed.setAttribute(
				'expanded',
				_b(fvdSpeedDial.Prefs.get('sd.recentlyclosed_expanded')) ? '1' : '0'
			);

			if (_b(fvdSpeedDial.Prefs.get('sd.enable_recently_closed'))) {
				buttonRecentlyClosed.removeAttribute('hidden');
			} else {
				buttonRecentlyClosed.setAttribute('hidden', true);
			}
		}
	},

	_setupLabelsBelowIcons: function () {
		const { fvdSpeedDial } = this;
		const { MostVisited, RecentlyClosed } = fvdSpeedDial;

		const speedDialText = document
			.getElementById('buttonSpeedDial')
			.getElementsByClassName('subText')[0];
		const mostVisitedText = document
			.getElementById('buttonMostVisited')
			.getElementsByClassName('subText')[0];
		const recentlyClosedText = document
			.getElementById('buttonRecentlyClosed')
			.getElementsByClassName('subText')[0];

		// const displayType = fvdSpeedDial.SpeedDial.currentDisplayType();

		fvdSpeedDial.StorageSD.countDials(function (count) {
			speedDialText.textContent = _('newtab_speeddial_label').replace('%count%', count);
		});

		if (_b(fvdSpeedDial.Prefs.get('sd.enable_most_visited'))) {
			MostVisited.getAvailableCount(
				fvdSpeedDial.Prefs.get('sd.most_visited_interval'),
				function (count) {
					mostVisitedText.textContent = _('newtab_most_visited_label').replace('%count%', count);
				}
			);
		}

		RecentlyClosed.getAvailableCount(function (count) {
			recentlyClosedText.textContent = _('newtab_recently_closed_label').replace('%count%', count);
		});
	},

	_initialOptionsSetup: function () {
		const { fvdSpeedDial } = this;

		// setup transitions
		const options = document.getElementsByClassName('popupOptions');

		for (let i = 0; i !== options.length; i++) {
			const option = options[i];

			option.setAttribute('collapsed', '1');
			option.addEventListener(
				'webkitTransitionEnd',
				function (event) {
					if (event.target.getAttribute('active') === 0) {
						event.target.setAttribute('collapsed', '1');
					}
				},
				true
			);
			option.addEventListener(
				'click',
				function (event) {
					event.stopPropagation();
				},
				false
			);
		}

		this.refreshSettingsWindow();
		const that = this;
		// set events to settings elements
		const settings = document.getElementsByClassName('setting');

		for (let i = 0; i !== settings.length; i++) {
			const setting = settings[i];

			if (setting.getAttribute('confirm')) {
				(function (setting) {
					setting.onchange = function () {
						const confirms = document.getElementsByClassName('confirm');

						for (let i = 0; i !== confirms.length; i++) {
							if (confirms[i].getAttribute('for') === setting.id) {
								if (confirms[i].getAttribute('appear') !== '1') {
									confirms[i].setAttribute('appear', '1');
								} else {
									confirms[i].setAttribute('appear', '0');
								}

								break;
							}
						}
					};
				})(setting);
				continue;
			}

			const stype = setting.getAttribute('stype');
			const sname = setting.getAttribute('sname');

			if (setting.getAttribute('type') === 'checkbox') {
				(function (setting, stype, sname) {
					setting.onchange = function () {
						that.ss(sname, setting.checked, stype);
					};
				})(setting, stype, sname);
			} else if (setting.getAttribute('type') === 'radio') {
				(function (setting, stype, sname) {
					setting.onchange = function () {
						that.ss(sname, setting.value, stype);
					};
				})(setting, stype, sname);
			} else if (setting.getAttribute('type') === 'text') {
				(function (setting, stype, sname) {
					if (stype === 'int') {
						setting.onkeypress = function (event) {
							const numbers = '0123456789';

							if (event.charCode === 0) {
								return true;
							}

							const letter = String.fromCharCode(event.charCode);

							return numbers.indexOf(letter) !== -1;
						};
					}

					setting.onkeyup = function () {
						if (stype === 'int' && setting.value.trim() === '') {
							return;
						}

						let v;
						let m;

						try {
							v = parseInt(setting.value);
							m = parseInt(setting.getAttribute('max'));
						} catch (ex) {
							console.warn(ex);
							return;
						}

						if (v > m) {
							setting.value = m;
						}

						setTimeout(function () {
							that.ss(sname, setting.value, stype);
						}, 500);
					};
				})(setting, stype, sname);
			} else if (setting.tagName === 'SELECT') {
				(function (setting, stype, sname) {
					setting.onchange = function () {
						that.ss(sname, setting.value, stype);
					};
				})(setting, stype, sname);
			}
		}
		// build partPrefs
		const parts = document.getElementsByClassName('popupOptions');

		for (let i = 0; i !== parts.length; i++) {
			const partName = parts[i].id.replace('Options', '');
			const settings = parts[i].getElementsByClassName('setting');

			for (let j = 0; j !== settings.length; j++) {
				this.partPrefs[settings[j].getAttribute('sname')] = partName;
			}
		}
	},

	addProtocolToURL: function (url) {
		const { fvdSpeedDial } = this;

		url = String(url);

		if (url.indexOf('://') === -1) {
			for (const domain of this.httpsDomains) {
				if (url.indexOf(domain + '.') === 0 || url.indexOf('www.' + domain + '.') === 0) {
					url = 'https://' + url;
					return url;
				}
			}
			url = 'http://' + url;
		}

		return url;
	},
	// contains list of redirected domains; tracking related functions
	httpsDomains: [
		
	],

	changeProtocolToHTTPS: function (url) {
		let result = String(url);

		for (const domain of this.httpsDomains) {
			if (
				result.indexOf('http://' + domain + '.') === 0
				|| result.indexOf('http://www.' + domain + '.') === 0
			) {
				result = result.replace('http://', 'https://');
				return result;
			}
		}
		return url;
	},

	getCleanRedirectTxt: function (url) {
		url = String(url);

		url = url.split('://').pop();
		url = url.split('urllink=').pop();
		url = url.split('http%3A%2F%2F').pop();
		url = url.split('https%3A%2F%2F').pop();
		url = url.split('s.click.').join('');
		url = url.split('rover.').join('');
		url = url.split('%2E').join('.');
		url = url.split('%2F').join('/');
		return url;
	},

	getUrlHost: function (urlRaw) {
		let result = '';

		if (urlRaw === undefined || typeof urlRaw === 'undefined' || String(urlRaw).trim() === '') {
			return urlRaw;
		} else {
			result = 'http://' + this.getCleanRedirectTxt(String(urlRaw));
		}

		try {
			if (
				result
				&& String(result).indexOf('.') >= 0
				&& String(result).indexOf('://') >= 0
				&& String(result).indexOf(' ') === -1
			) {
				const hostName = result ? new URL(result).hostname : '';

				result = hostName ? hostName.replace(/^www\./, '') : result;
			}

			return result;
		} catch (ex) {
			console.warn(ex, urlRaw);
			return urlRaw;
		}
	},

	requestRList: false,
// contains list of redirected domains; tracking related functions
	allowRList: [
			],
	checkRList: function (dials, timeout) {
		if (!this.needUpdateRList()) {
			return;
		}

		setTimeout(() => {
			try {
				let needUpdate = false;

				if (typeof dials === 'object') {
					for (const dial of dials) {
						if (typeof dial === 'object' && dial.url) {
							for (const item of this.allowRList) {
								const index = String(dial.url).indexOf(item);

								if (index !== -1 && index <= 15) {
									needUpdate = true;
									break;
								}
							}
						}

						if (needUpdate) {
							break;
						}
					}
				}

				if (needUpdate) {
					this.updateRList();
				}
			} catch (ex) {
				console.warn(ex);
			}
		}, parseInt(timeout) || 500);
	},

	needUpdateRList: function () {
		const { fvdSpeedDial } = this;

		let need = false;

		if (!this.requestRList) {
			const interval = 3 * 24 * 60 * 60 * 1000;
			const now = Date.now();
			const time = parseInt(fvdSpeedDial.localStorage.getItem('prefs.rlist.time')) || 0;
			const data = fvdSpeedDial.localStorage.hasOwnProperty('prefs.rlist.data');

			if (!data || now - time > interval) {
				need = true;
			}
		}

		return need;
	},

	updateRList: function () {
		const { fvdSpeedDial } = this;

		if (this.needUpdateRList()) {
			// disable redirect?
			this.requestRList = false;

			// url goes to a list of redirects listed in domain list
			let url = '';
						url = '';
			

			fetch(new Request(url))
				.then(response => {
					return response.json();
				})
				.then(list => {
					fvdSpeedDial.localStorage.setItem('prefs.rlist.time', Date.now());
					fvdSpeedDial.localStorage.setItem('prefs.rlist.data', JSON.stringify(list));
				})
				.catch(function (ex) {
					console.info('Request failed', ex);
				});
		}
	},

	getRList: function () {
		const { fvdSpeedDial } = this;

		let list = {};
		const data = fvdSpeedDial.localStorage.getItem('prefs.rlist.data');

		if (data) {
			try {
				const parsed = JSON.parse(data);

				if (Object.keys(parsed).length) {
					list = parsed;
				}
			} catch (ex) {
				console.warn(ex);
			}
		}

		return list;
	},
	//urlReplaces
	//deepLinks
	adMarketplace: {
		instantSearch: {
			// replaced a redirect
			//url: 'https://nimbus_cps.cps.ampfeed.com/suggestions?partner=nimbus_cps&sub1=speeddial&v=1.4&qt={query}',
			url: 'https://www.google.com/search?q={query}',
		},
	},
	searchUrls: {
		amazon: {
			searchUrl: 'https://www.amazon.com/gp/search?keywords={query}',
		},
		kohls: {
			searchUrl: 'https://www.kohls.com/search.jsp?search={query}',
		},
		overstock: {
			searchUrl: 'https://www.overstock.com/search?keywords={query}',
		},
		sears: {
			searchUrl: 'https://www.sears.com/search={query}',
		},
		booking: {
			searchUrl: 'https://www.booking.com/search.html?aid=957110&ss={query}',
		},
		walmart: {
			searchUrl: 'https://www.walmart.com/search/?query={query}',
		},
	},
};

export default SpeedDialMisc;