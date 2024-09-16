import Broadcaster from '../_external/broadcaster.js';
import { _b, FVDEventEmitter, Utils } from '../utils.js';
import Config from '../config.js';
import { _ } from '../localizer.js';
import lightCollapsedMessage from './light_collapsed_message.js';
import DragAndDrop from './speeddial/draganddrop.js';
import SpeedDialBuilderModule from './speeddial/builder.js';
import { ThumbManagerModule } from '../thumbmanager/tab.js';
import ThumbManagerBgModule from '../thumbmanager/bg.js';
import { Log } from '../../extras/log.js';
import Analytics from '../bg/google-analytics.js';
import { defaultGroupGlobalIDs, DIALS_TRASH_KEY, GROUPS_TRASH_KEY, newTabUrls } from '../constants.js';
import { userStorageKey } from '../sync/user.js';

let _loadLog = new Log();

const GroupsModule = function (fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;
	this.getGroupFont = function () {
		let group = document.querySelector('#groupsBox .group');
		let style;
		let needRemoveGroup = false;

		if (!group) {
			group = document.createElement('div');
			group.className = 'group';
			document.querySelector('#groupsBox').appendChild(group);
			style = window.getComputedStyle(group);
			needRemoveGroup = true;
		} else {
			style = window.getComputedStyle(group);
		}

		const font = style.font;

		if (needRemoveGroup) {
			group.parentNode.removeChild(group);
		}

		return font;
	};
	this.rebuildGroupsList = function () {
		const { fvdSpeedDial } = this;
		const { StorageSD, SpeedDial, Dialogs } = fvdSpeedDial;

		const l = new Log();

		l.profile.start('total');
		l.profile.start('preparations');
		// for speed dial we build groups list with add button
		// for most visited we build three options: all time, last month, last week
		// for recently closed build nothing
		// const that = new SpeedDial();
		let isAdditionalListOpened = false;

		const elements = document.getElementsByClassName('additionalGroupsList');

		if (elements.length) {
			if (elements[0].getAttribute('active') === 1) {
				isAdditionalListOpened = true;
			}
		}

		document
			.getElementById('speedDialGroupsWrapper')
			.setAttribute('type', SpeedDial.currentDisplayType());

		let groupsBox = document.getElementById('groupsBox');
		const tmpContainer = groupsBox.cloneNode(true);
		// remove childs

		while (tmpContainer.firstChild) {
			tmpContainer.removeChild(tmpContainer.firstChild);
		}
		l.profile.end('preparations');

		if (SpeedDial.currentDisplayType() === 'speeddial') {
			let countInPopularGroup = 0;

			Utils.Async.chain([
				function (chainCallback) {
					if (_b(fvdSpeedDial.Prefs.get('sd.display_popular_group'))) {
						l.profile.start('fetch total count dials');
						StorageSD.countDials(
							{
								uniqueUrl: true,
							},
							function (count) {
								l.profile.end('fetch total count dials');
								countInPopularGroup = Math.min(
									fvdSpeedDial.Prefs.get('sd.all_groups_limit_dials'),
									count
								);
								chainCallback();
							}
						);
					} else {
						chainCallback();
					}
				},

				function () {
					l.profile.start('fetch groups list');
					StorageSD.groupsList(function (groups) {
						// check if current group found
						const currentGroupId = fvdSpeedDial.SpeedDial.currentGroupId();

						let groupFound = false;

						for (let i = 0; i !== groups.length; i++) {
							if (groups[i].id === currentGroupId) {
								groupFound = true;
								break;
							}
						}

						if (currentGroupId === 0) {
							// popular group always exists
							groupFound = true;
						}

						if (!groupFound) {
							// group not found, try to set first group in list to current
							if (!groups.length) {
								// do nothing
								return;
							}

							fvdSpeedDial.SpeedDial.setCurrentGroupId(groups[0].id);
							// and rebuild dial with new group
							fvdSpeedDial.SpeedDial.sheduleFullRebuild();
							return;
						}

						l.profile.start('building groups html');

						const sdMenu = document.querySelector('#searchBar .activeContent');
						// 100 is a space that should remain between groups and the right window border
						let groupsBoxMaxWidth
							= SpeedDial._viewportWidth()
							// groups container left margin
							- 20
							- document.getElementById('fastMenuToggleButton').offsetWidth
							// offset between fast menu and right browser's border
							- 15
							// additional groups button width
							- 20
							// add group button width
							- 18
							// left margin between add group button and other groups
							- 12
							// right margin of the add group button
							- SpeedDial._groupElemMargin
							// correction parameter
							//-10
							- 10;

						if (_b(fvdSpeedDial.Prefs.get('sd.main_menu_displayed'))) {
							groupsBoxMaxWidth -= sdMenu.offsetWidth;
						}

						const restoreSessionText = _('restore_previous_session');

						const groupsFont = fvdSpeedDial.SpeedDial.Groups.getGroupFont();
						let groupsActiveWidth = 0;
						let maxGroupsInMainList = 0;

						function incActiveWidth(text) {
							let groupSize
								= SpeedDial._groupElemXPadding * 2
								+ Utils.measureText(groupsFont, text)
								+ SpeedDial._groupElemMargin;

							if (text === restoreSessionText) {
								groupSize += 23;
							} else {
								if (groupSize > SpeedDial._groupElemMaxWidth) {
									groupSize = SpeedDial._groupElemMaxWidth;
								}
							}

							groupsActiveWidth += groupSize;
						}

						if (SpeedDial.sessionRestore) {
							const item = fvdSpeedDial.SpeedDial.Builder.groupsItem(restoreSessionText, 'restore');

							// add context menu
							//fvdSpeedDial.fvdSpeedDial.ContextMenus.assignToElem( item, "speeddialGroup" );
							tmpContainer.appendChild(item);

							incActiveWidth(item.textContent);
						}

						// first add popular group if need
						if (_b(fvdSpeedDial.Prefs.get('sd.display_popular_group'))) {
							let defGroupName = _('newtab_popular_group_title');

							if (_b(fvdSpeedDial.Prefs.get('sd.enable_dials_counter'))) {
								defGroupName += ' (' + countInPopularGroup + ')';
							}

							const item = fvdSpeedDial.SpeedDial.Builder.groupsItem(defGroupName, 0);

							// add context menu
							fvdSpeedDial.ContextMenus.assignToElem(item, 'speeddialGroup');
							tmpContainer.appendChild(item);

							incActiveWidth(item.textContent);
						}

						for (let i = 0; i !== groups.length; i++) {
							//incActiveWidth(groups[i].name + " ("+groups[i].count_dials+")");

							let name = groups[i].name;

							if (_b(fvdSpeedDial.Prefs.get('sd.enable_dials_counter'))) {
								name += ' (' + groups[i].count_dials + ')';
							}

							incActiveWidth(name);

							if (groupsActiveWidth >= groupsBoxMaxWidth) {
								break;
							}

							maxGroupsInMainList++;
						}

						const groupsInMainListCount = maxGroupsInMainList;

						const groupsInMainList = groups.splice(0, groupsInMainListCount);
						const groupsInAdditionalList = groups;

						for (let i = 0; i !== groupsInMainList.length; i++) {
							const item = fvdSpeedDial.SpeedDial.Builder.groupsItem(
								groupsInMainList[i].name,
								groupsInMainList[i].id,
								groupsInMainList[i].count_dials
							);
							fvdSpeedDial.ContextMenus.assignToElem(item, 'speeddialGroup');
							tmpContainer.appendChild(item);
						}

						if (groupsInAdditionalList.length > 0) {
							// add button for open additional groups list
							const additionalGroupsButton
								= fvdSpeedDial.SpeedDial.Builder.groupsAdditionalGroupsButton();

							tmpContainer.appendChild(additionalGroupsButton);

							const additionalList
								= fvdSpeedDial.SpeedDial.Builder.groupsAdditionalList(groupsInAdditionalList);

							additionalList.setAttribute('active', 0);

							tmpContainer.appendChild(additionalList);

							fvdSpeedDial.Scrolling.additionalGroupsListOpen = false;
						}

						// add group add item
						const item = document.createElement('div');
						item.setAttribute('class', 'group add');
						const image = document.createElement('div');

						image.setAttribute('class', 'image');
						item.appendChild(image);

						item.addEventListener(
							'click',
							function (event) {
								Dialogs.addGroup();
							},
							true
						);

						tmpContainer.appendChild(item);

						groupsBox = document.getElementById('groupsBox');
						groupsBox.parentNode.replaceChild(tmpContainer, groupsBox);
						l.profile.end('building groups html');

						if (isAdditionalListOpened) {
							SpeedDial.Groups.displayAdditionalList({
								disableAnimation: true,
							});
						}

						setTimeout(function () {
							fvdSpeedDial.ContextMenus.rebuildSpeedDialCellMenu();
						}, 0);

						try {
							const currentGroupId = SpeedDial.currentGroupId();
							const item = document.getElementById('group_select_' + currentGroupId);

							document.getElementById('groupsBoxContainer').scrollLeft = item.offsetLeft;
						} catch (ex) {
							console.warn(ex);
						}
						l.profile.end('total');

						//console.log("**Groups**\n", l.toString());// #Debug
						if (_loadLog) {
							_loadLog.profile.end('Total Loading');
							console.info('** Total Loading **\n', _loadLog.toString());
							_loadLog = null;
						}
					});
				},
			]);
		} else if (SpeedDial.currentDisplayType() === 'mostvisited') {
			for (let i = 0; i !== SpeedDial._mostVisitedIntervals.length; i++) {
				const interval = SpeedDial._mostVisitedIntervals[i];
				const item = fvdSpeedDial.SpeedDial.Builder.groupsItem(
					_('newtab_mostvisited_interval_' + interval),
					interval
				);

				tmpContainer.appendChild(item);
			}
			groupsBox.parentNode.replaceChild(tmpContainer, groupsBox);
		} else {
			groupsBox.parentNode.replaceChild(tmpContainer, groupsBox);
		}
	};
	this.displayAdditionalList = function (params) {
		params = params || {};
		const that = this;

		try {
			const listElem = document.getElementsByClassName('additionalGroupsList')[0];

			if (listElem.getAttribute('active') === 1) {
				this.closeAdditionalList();
				return;
			}

			const btn = document.getElementsByClassName('additionalGroupsButton')[0];
			const pos = Utils.getOffset(btn);

			//listElem.style.left = pos.left + "px";

			if (document.body.clientWidth - pos.left > listElem.offsetWidth + 30) {
				listElem.style.left = pos.left + 'px';
			} else {
				listElem.style.left = pos.left - listElem.offsetWidth - 20 + 'px';
			}

			if (params.disableAnimation) {
				listElem.setAttribute('disableanim', 1);
				setTimeout(function () {
					listElem.removeAttribute('disableanim');
				}, 500);
			}

			listElem.setAttribute('active', 1);
			document.addEventListener('click', that.closeAdditionalList, false);
			$('.additionalGroupsElemList').scrollTo('.additionalGroupsElemList [current=1]');

			fvdSpeedDial.Scrolling.additionalGroupsListOpen = true;
		} catch (ex) {
			console.warn(ex);
		}
	};

	this.closeAdditionalList = function () {
		try {
			const listElem = document.getElementsByClassName('additionalGroupsList')[0];

			listElem.setAttribute('active', 0);
			document.removeEventListener('click', fvdSpeedDial.SpeedDial.Groups.closeAdditionalList);

			fvdSpeedDial.Scrolling.additionalGroupsListOpen = false;
		} catch (ex) {
			console.warn(ex);
		}
	};
};
const SpeedDialModule = function (fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;
	this.DragAndDrop = new DragAndDrop(fvdSpeedDial);
	this.Groups = new GroupsModule(this.fvdSpeedDial);
	this.Builder = new SpeedDialBuilderModule(this.fvdSpeedDial);
	this.ThumbManager = new ThumbManagerModule(this.fvdSpeedDial);
	this.ThumbManagerBg = new ThumbManagerBgModule(this.fvdSpeedDial);
};

SpeedDialModule.prototype = new FVDEventEmitter();

SpeedDialModule.prototype = {
	_displayType: null, // (speeddial, mostvisited, recentlyclosed)
	// currently opened group in this speeddial tab
	_nowOpenedGroup: null,
	_cellsSizes: {
		big: 364,
		medium: 210,
		small: 150,
	},
	_mostVisitedIntervals: ['all_time', 'month', 'week'],
	_displayModesList: ['speeddial', 'mostvisited', 'recentlyclosed'],
	_topLineHeight: 3,
	_dialBodyPadding: 5, // 5px - is padding in dial body
	_cellsSizeRatio: 1.6,
	_cellsMarginX: 20,
	_cellsMarginY: {
		standard_speeddial: 70,
		fancy_speeddial: 30,

		standard_mostvisited: 70,
		fancy_mostvisited: 50,
	},
	_groupElemMaxWidth: 150,
	_groupElemMargin: 5,
	_groupElemXPadding: 5,
	//_groupElemLetterWidth: 6,
	_listElemMarginX: 15,
	_listElemMarginY: 15,
	_listElemSize: {
		// for recentlyclosed and speeddial
		height: 15,
		width: 522,
	},
	_listElemSizeMostVisited: {
		// for mostvisited
		height: 29,
		width: 522,
	},
	_needRebuild: false, // sign to need rebuild all dials list
	_needRebuildGroupsList: false, // sign to need rebuild groups listing
	_needCSSRefresh: false,
	_needBackgroundRefresh: false,
	_rebuildCheckerIntervalInst: null,
	_cellsRebuildCallback: null,
	_firstRebuildDone: false,
	justAddedId: null,
	sessionRestore: false,
	fancySpecialDecrementCount: 0, // this value used for fixing fancy dials list
	// some events
	onBuildStart: new FVDEventEmitter(),
	onBuildCompleted: new FVDEventEmitter(),
	onGroupChange: new FVDEventEmitter(),

	cellsMarginY: function () {
		const { fvdSpeedDial } = this;

		let factor = 0;
		const displayMode = fvdSpeedDial.Prefs.get('sd.display_mode');

		if (displayMode === 'standard') {
			const urls = _b(fvdSpeedDial.Prefs.get('sd.show_urls_under_dials'));
			const title = _b(fvdSpeedDial.Prefs.get('sd.show_icons_and_titles_above_dials'));

			if (!urls && !title) {
				factor = -47;
			} else if (!urls) {
				factor -= 20;
			} else if (!title) {
				factor -= 20;
			}
		}

		return (
			this._cellsMarginY[
				fvdSpeedDial.Prefs.get('sd.display_mode') + '_' + this.currentDisplayType()
			] + factor
		);
	},

	has3D: function () {
		const { fvdSpeedDial } = this;

		if (fvdSpeedDial.localStorage.getItem('has3dCss')) {
			return true;
		}

		const has = 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix();

		if (!has) {
			// chrome 61 canary doesn't have m11 m11 key in a WebKitCSSMatrix instance
			// use another approach to detect if css transforms are available
			const el = document.createElement('div');

			document.body.insertBefore(el, null);
			el.style.transform = 'translate3d(1px,1px,1px)';
			const transformValue = window.getComputedStyle(el).getPropertyValue('transform');

			document.body.removeChild(el);

			if (!transformValue) {
				return false;
			}
		}

		if (document.getElementById('test3d').offsetLeft === 0) {
			return false;
		}

		// cache 3d css state
		fvdSpeedDial.localStorage.setItem('has3dCss', 1);
		return true;
	},

	refreshEnableMirrors: function () {
		const { fvdSpeedDial } = this;

		const sdContent = document.getElementById('speedDialContent');

		if (sdContent) {
			if (_b(fvdSpeedDial.Prefs.get('sd.display_mirror'))) {
				sdContent.setAttribute('enablemirrors', '1');
			} else {
				sdContent.setAttribute('enablemirrors', '0');
			}
		} else {
			console.warn('element not found');
		}
	},

	init: function () {
		const { fvdSpeedDial } = this;
		const { SpeedDial, CSS } = fvdSpeedDial;

		const that = this;

		this.refreshEnableMirrors();

		if (!_b(fvdSpeedDial.Prefs.get('sd.fancy_size_adjusted'))) {
			Utils.Async.chain([
				function (next) {
					const min = that.getMinCellWidth();

					let v = that.getMaxCellWidth();

					const minCols = fvdSpeedDial.Prefs.get('sd.fancy_init_min_columns');

					while (v >= min) {
						fvdSpeedDial.Prefs.set('sd.custom_dial_size_fancy', v);

						if (fvdSpeedDial.SpeedDial.cellsInRowMax('auto', 'fancy').cols >= minCols) {
							break;
						}

						v--;
					}

					if (fvdSpeedDial.Prefs.get('sd.display_mode') === 'fancy') {
						return CSS._updateThemeActions('fancy', next);
					}

					next();
				},
				function () {
					fvdSpeedDial.Prefs.set('sd.fancy_size_adjusted', true);
				},
			]);
		}

		// init css adjuster
		CSS.stylesheets.push(document.styleSheets[0]);

		// immedately actions
		// refresh current type expand state
		this.refreshExpandState();

		// refresh background
		this.refreshBackground();

		// refresh CSS
		this.refreshCSS();

		// start need rebuild checker interval
		this._rebuildCheckerIntervalInst = setInterval(this._needRebuildChecker, 100);

		window.addEventListener(
			'resize',
			function (event) {
				that.sheduleRebuild();
				that.sheduleRebuildGroupsList();
			},
			true
		);

		window.addEventListener(
			'keydown',
			function (event) {
				if (event.ctrlKey) {
					const digits = [49, 50, 51, 52, 53, 54, 55, 56, 57, 48];
					const num = digits.indexOf(event.keyCode);

					if (num !== -1) {
						event.preventDefault();
						event.stopPropagation();
						that.openDialByNum(num, event);
					}
				}
			},
			true
		);

		// init drag and drop
		this.DragAndDrop.init();

		function trackGAPageViewEvent(tab) {
			if (tab.active) {
				const groupID = SpeedDial.currentGroupId();
				let isDisplayDials = fvdSpeedDial.Prefs.get('sd.speeddial_expanded');
				
				if (typeof isDisplayDials === undefined) {
					isDisplayDials = true;
				}

				fvdSpeedDial.StorageSD.getGroupTitleById(groupID, (groupTitle, group) => {
					const sendItems = isDisplayDials && group && Object.values(defaultGroupGlobalIDs).includes(group.global_id);

					fvdSpeedDial.StorageSD.getDialListByGroupId(groupID, (dials) => {
						const params = {
							page_location: tab.url,
							display_dial_group: isDisplayDials ? 'yes' : 'no',
							dial_group: isDisplayDials ? groupTitle : undefined,
							items: sendItems ? dials.map((item) => ({
								item_name: item.title,
								item_url: fvdSpeedDial.SpeedDialMisc.getCleanRedirectTxt(item.display_url),
							})) : undefined,
						};

						Analytics.fireTabViewEvent(params);
					});

				});

			}
		}

		setTimeout(() => {
			fvdSpeedDial.ContextMenus.setGlobalMenu(that.currentDisplayType());
		});

		let updateStop = false;

		function onBrowserTabUpdated(tab) {
			if (tab.status === 'complete' && tab.title !== tab.url && newTabUrls.includes(tab.url)) {
				if (!updateStop) updateStop = true;
				else return false;

				setTimeout(() => {
					updateStop = false;
					trackGAPageViewEvent(tab);
				}, 1000);
			}
		}

		
		//Send google analytic page_view event on tab created
		chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
			if (!fvdSpeedDial.localStorage.getItem('preventPageViewEvent')) {
				onBrowserTabUpdated(tab);
			}
		});

		// full rebuild when tab activated
		chrome.tabs.onActivated.addListener(function (info) {
			chrome.tabs.getCurrent(function (tab) {
				trackGAPageViewEvent(tab);

				if (tab.id === info.tabId) {
					if (document.body.hasAttribute('dial-search-show-results')) {
						// if the search is active don't rebuild page
						return;
					}

					that.sheduleFullRebuild();
				}
			});
		});

		if (_b(fvdSpeedDial.Prefs.get('sd.first_dial_page_open'))) {
			setTimeout(function () {
				//fvdSpeedDial.Apps.display();
			}, 0);
			fvdSpeedDial.Prefs.set('sd.first_dial_page_open', false);
		}

		this.correctPerspectiveOrigin();

		window.addEventListener(
			'scroll',
			function () {
				that.correctPerspectiveOrigin();
			},
			false
		);

		document.getElementById('cbNotDisplayCollapsedWithPowerOff').addEventListener(
			'click',
			function () {
				setTimeout(function () {
					fvdSpeedDial.Prefs.set('collapsed_message.with_poweroff.display', false);
				}, 0);
			},
			false
		);

		document.getElementById('cbNotDisplayCollapsedWithoutPowerOff').addEventListener(
			'click',
			function () {
				setTimeout(function () {
					fvdSpeedDial.Prefs.set('collapsed_message.without_poweroff.display', false);
				}, 0);
			},
			false
		);

		document.querySelector('#searchBar .rightMenu .showHide').addEventListener(
			'click',
			function () {
				that.toggleExpand();
			},
			false
		);

		document.querySelector('#speedDialCollapsedContent .aboutPowerOff').addEventListener(
			'click',
			function () {
				window.open(chrome.runtime.getURL('/options.html#poweroff'));
			},
			false
		);

		this.refreshCollapsedMessages();

		// foce show group
		const forceShowGroupId = Utils.getQueryValue('show_group_id');

		if (forceShowGroupId) {
			that.setCurrentGroupId(forceShowGroupId);
		}

		// clear hash
		document.location.hash = '#';

		// message listener

		Broadcaster.onMessage.addListener(function (message) {
			switch (message.action) {
				case 'syncStartNotification':
					document.getElementById('buttonSync').setAttribute('sync', 1);
					break;
				case 'syncEndNotification':
					document.getElementById('buttonSync').removeAttribute('sync');
					break;
				case 'pref:changed':
					that._prefsListener(message.name, message.value);
					break;
				case 'forceRebuild':
					Utils.Async.chain([
						function (next) {
							if (message.needDisplayType) {
								if (message.needDisplayType !== fvdSpeedDial.SpeedDial.currentDisplayType()) {
									return;
								}
							}

							if (!message.needActiveTab) {
								return next();
							}

							Utils.isActiveTab(function (active) {
								if (!active) {
									return;
								}

								next();
							});
						},
						function () {
							SpeedDial.sheduleFullRebuild();
						},
					]);
					break;
				case 'foundRecentlyClosed':
					Utils.Async.chain([
						function (next) {
							if (!message.needActiveTab) {
								return;
							}

							Utils.isActiveTab(function (active) {
								if (!active) {
									return;
								}

								next();
							});
						},
						function () {
							if (fvdSpeedDial.SpeedDial.currentDisplayType() === 'recentlyclosed') {
								SpeedDial.sheduleFullRebuild();
							} else {
								// else rebuild only misc content
								fvdSpeedDial.SpeedDialMisc.sheduleRebuild();
							}
						},
					]);
					break;
			}
		});
	},

	refreshCollapsedMessages: function () {
		const { fvdSpeedDial } = this;

		if (!_b(fvdSpeedDial.Prefs.get('collapsed_message.with_poweroff.display'))) {
			document.querySelector(
				'#speedDialCollapsedContent .collapsedMessagePoweroffDisabled'
			).style.display = 'none';
		}

		if (!_b(fvdSpeedDial.Prefs.get('collapsed_message.without_poweroff.display'))) {
			document.querySelector(
				'#speedDialCollapsedContent .collapsedMessagePoweroffEnabled'
			).style.display = 'none';
		}
	},

	getMaxCellWidth: function () {
		let max = 0;

		for (const k in this._cellsSizes) {
			const size = this._cellsSizes[k];

			if (size > max) {
				max = size;
			}
		}

		return max;
	},

	getMinCellWidth: function () {
		let min = 9999;

		for (const k in this._cellsSizes) {
			const size = this._cellsSizes[k];

			if (size < min) {
				min = size;
			}
		}

		return min;
	},

	openSizeSetup: function () {
		window.open(chrome.runtime.getURL('/options.html#setup-custom-size'));
	},

	dialRemoveAnimate: function (dialId) {
		const cell = document.getElementById('dialCell_' + dialId);

		if (cell) {
			const that = this;

			cell.addEventListener(
				'webkitTransitionEnd',
				function (event) {
					that.sheduleFullRebuild();
				},
				true
			);

			cell.style.opacity = 0;
			cell.style.webkitTransform = 'scale(0.5)';
		}
	},

	dialMoveToGroup: function (dialId, groupId) {
		const { fvdSpeedDial } = this;

		fvdSpeedDial.StorageSD.moveDial(dialId, groupId, function (result) {
			if (result.result) {
				fvdSpeedDial.Sync.addDataToSync({
					category: 'dials',
					data: dialId,
					translate: 'dial',
				});

				if (fvdSpeedDial.SpeedDial.currentGroupId() === 0) {
					SpeedDial.sheduleFullRebuild();
				} else {
					fvdSpeedDial.SpeedDial.dialRemoveAnimate(dialId);
				}

				fvdSpeedDial.StorageSD.dialGlobalId(dialId, function (dialGlobalId) {
					fvdSpeedDial.Sync.removeSyncData({
						category: ['deleteDials'],
						data: dialGlobalId,
					});
				});
			}
		});
	},

	setListViewType: function () {
		const { fvdSpeedDial } = this;

		let selectedElem = document.querySelector('[name=listViewType]:checked');
		let type;

		if (selectedElem) {
			type = selectedElem.value;
			fvdSpeedDial.Prefs.set('sd.list_view_type', type);
		} else {
			selectedElem = document.querySelector(
				'[name=listViewType][value=' + fvdSpeedDial.Prefs.get('sd.list_view_type') + ']'
			);
			selectedElem.checked = true;
			type = selectedElem.value;
		}

		const elements = document.getElementsByClassName('newtabListElem');
		let altType;

		if (type === 'url') {
			altType = 'title';
		} else {
			altType = 'url';
		}

		for (let i = 0; i !== elements.length; i++) {
			const elem = elements[i];
			const textNode = elem.getElementsByClassName('text')[0];

			textNode.textContent = elem.getAttribute('_' + type);
			elem.setAttribute('title', elem.getAttribute('_' + altType));
		}
	},

	refreshSpeedDialWrapperHeight: function () {
		const wrapper = document.getElementById('speedDialWrapper');

		wrapper.style.height = '';

		const currentHeight = wrapper.offsetHeight;
		//var topHeight = document.getElementById( "speedDialTop" ).offsetHeight;
		const bodyHeight = document.body.offsetHeight;
		const speedDialHeight = bodyHeight - this._topLineHeight;
		// height that not calcs, it's height of panels that occlude speed dial content, such as widgets panel
		let extraHeight = 0;

		if (wrapper.hasAttribute('extraheight')) {
			extraHeight = parseInt(wrapper.getAttribute('extraheight'));
		}

		if (currentHeight > speedDialHeight) {
			// no do anything
			wrapper.style.height = currentHeight + 20 - extraHeight + 'px';
		} else {
			wrapper.style.height = speedDialHeight - extraHeight + 'px';
		}
	},

	correctPerspectiveOrigin: function () {
		let originValue = 100;

		originValue += Math.max(document.body.scrollTop, document.documentElement.scrollTop);
		document.getElementById('cellsContainer').style.webkitPerspectiveOrigin
			= '50% ' + originValue + 'px';
	},

	correctPerspective: function (params) {
		const { fvdSpeedDial } = this;

		params = params || {};

		if (!params._correctAttempt) {
			params._correctAttempt = 1;
		}

		if (params._correctAttempt > 10) {
			return;
		}

		params._correctAttempt++;

		//experimental
		if (!this.getExpandState()) {
			// do not correct for collapsed speed dial
			return;
		}

		let that = this;
		let pers = 600;
		let fixedPerspective = false;

		if (fvdSpeedDial.Prefs.get('sd.display_mode') !== 'fancy') {
			fixedPerspective = true;
		} else if (this.currentDisplayType() === 'mostvisited') {
			//  fixedPerspective = true;
		} else if (this._currentSettingsColumnsCount() !== 'auto') {
			const maxCols = that.cellsInRowMax('auto', null, {
				objects: document.getElementById('cellsContainer').childNodes.length,
			}).cols;

			if (maxCols !== this._currentSettingsColumnsCount()) {
				fixedPerspective = true;
			}
		}

		if (fixedPerspective) {
			document.getElementById('cellsContainer').style.webkitPerspective = pers + 'px';
			return;
		}

		that = this;
		let iter = 0;
		const els = document.querySelectorAll(".newtabCell[row='0']");
		const viewPortWidth = that._viewportWidth();
		/*
			console.log( viewPortWidth, els.length, that.cellsInRowMax( "auto", null, {
				objects: document.getElementById("cellsContainer").childNodes.length
			} ).cols );
				*/
		let el = els[els.length - 1];
		const firstEl = els[0];
		let rect = el.getBoundingClientRect();

		if (rect.right === 0) {
			// wait for rendering
			setTimeout(function () {
				that.correctPerspective(params);
			}, 0);
			return;
		}

		let lastValueWhenInBorders = 0;
		const alreadyCheckedPers = {};
		const cellsContainer = document.getElementById('cellsContainer');

		cellsContainer.style.webkitPerspective = pers + 'px';
		while (true) {
			iter++;

			if (iter > 100 || alreadyCheckedPers[pers] > 5) {
				if (lastValueWhenInBorders) {
					cellsContainer.style.webkitPerspective = lastValueWhenInBorders + 'px';
				}

				break;
			}

			if (!alreadyCheckedPers[pers]) {
				alreadyCheckedPers[pers] = 0;
			}

			alreadyCheckedPers[pers]++;

			// correct perspective
			const delta = 20;

			el = els[els.length - 1];

			rect = el.getBoundingClientRect();

			const normWDelta = 25;
			const wDelta = viewPortWidth - rect.right;

			if (wDelta < normWDelta && wDelta > 0 && rect.left > 0) {
				break;
			}

			let inBorders = false;

			if (wDelta < 0) {
				pers += delta;
			} else {
				if (firstEl.getBoundingClientRect().left > normWDelta) {
					inBorders = true;
					lastValueWhenInBorders = pers;
				}

				pers -= delta;
			}

			const scaleRatio = rect.width / el.offsetWidth;

			// check side dials max scale
			if (
				inBorders
				&& scaleRatio <= Config.FANCY_SIDE_DIALS_MAX_SCALE
				&& scaleRatio >= Config.FANCY_SIDE_DIALS_MIN_SCALE
			) {
				break;
			}

			cellsContainer.style.webkitPerspective = pers + 'px';
		}
	},

	rebuildCells: function (params) {
		const { fvdSpeedDial } = this;
		const { SpeedDial, MostVisited, RecentlyClosed } = fvdSpeedDial;

		this.onBuildStart.callListeners(params);
		const l = new Log();

		l.profile.start('preparing tasks');
		l.profile.start('total');
		const that = this;

		params = params || {};

		const rebuildCellsParams = params;
		const speedDialContent = document.getElementById('speedDialContent');

		if (!params.doNotZeroFancySpecialDecrementCount) {
			this.fancySpecialDecrementCount = 0;
		}

		speedDialContent.setAttribute('style', fvdSpeedDial.Prefs.get('sd.display_mode'));

		// collapse if need
		this.refreshExpandState({ ifcollapsed: true });

		const displayType = this.currentDisplayType();
		const thumbsMode = this.currentThumbsMode();
		const cellSize = this._currentCellSize();
		let countInRow = null;

		document.body.setAttribute('thumbsmode', thumbsMode);
		document.body.setAttribute('displaymode', fvdSpeedDial.Prefs.get('sd.display_mode'));
		document.body.setAttribute('displaytype', displayType);

		let activeScrollingType = fvdSpeedDial.Scrolling.activeScrollingType();

		let container = null;

		let tmpContainer = null;

		// hide containers
		function _getContainer() {
			const listContainer = that._listContainer();
			const cellsContainer = that._cellsContainer();
			let c;

			if (that.currentThumbsMode() === 'list') {
				c = listContainer;
			} else {
				c = cellsContainer;
			}

			return c;
		}
		container = _getContainer();
		tmpContainer = container.cloneNode(true);
		// clear container
		while (tmpContainer.firstChild) {
			tmpContainer.removeChild(tmpContainer.firstChild);
		}
		const finishBuildCallback = function (params) {
			speedDialContent.style.width = '';
			tmpContainer.style.width = '';
			l.profile.start('finishBuildCallback');
			document.body.setAttribute('scrollingtype', activeScrollingType);

			if (that.currentThumbsMode() !== 'list') {
				const containerSize = that._dialsAreaSize({
					objects: tmpContainer.childNodes.length,
					cols: countInRow,
				});

				if (containerSize.width && activeScrollingType === 'vertical') {
					tmpContainer.style.width = containerSize.width + 'px';
				}
			}

			if (that._cellsRebuildCallback) {
				that._cellsRebuildCallback();
			}

			if (displayType === 'recentlyclosed') {
				document.getElementById('groupsWidthSetter').setAttribute('hidden', true);
			} else {
				document.getElementById('groupsWidthSetter').removeAttribute('hidden');
			}

			if (thumbsMode === 'list') {
				that._cellsContainer().setAttribute('hidden', true);
				document.getElementById('listContainerParent').removeAttribute('hidden');
			} else {
				that._listContainer().setAttribute('hidden', true);
				document.getElementById('listContainerParent').setAttribute('hidden', true);
			}

			// magick
			container = _getContainer();
			container.parentNode.replaceChild(tmpContainer, container);
			tmpContainer.removeAttribute('hidden');

			setTimeout(function () {
				that.refreshExpandState();
			}, 0);

			if (thumbsMode === 'list') {
				// hide all list view menus
				const listViewMenus = document.getElementsByClassName('listViewMenu');

				for (let i = 0; i !== listViewMenus.length; i++) {
					listViewMenus[i].setAttribute('hidden', true);
				}

				document.getElementById('listNoItemsToDisplay').setAttribute('hidden', true);

				if (params) {
					if (params.noitems) {
						document.getElementById('listNoItemsToDisplay').removeAttribute('hidden');
						document.getElementById('listViewTypeSelector').setAttribute('hidden', true);
						return;
					}
				}

				document.getElementById('listViewTypeSelector').removeAttribute('hidden');

				//if( displayType == "speeddial" ){
				const listContainerParent = document.getElementById('listContainerParent');
				const size = that.Builder.listViewContainerSize(tmpContainer, countInRow);

				tmpContainer.style.height = size.height + 'px';
				tmpContainer.style.width = size.width + 'px';

				if (size.width !== 0) {
					listContainerParent.style.width = size.width + 'px';
				}

				that.setListViewType();

				const neededMenu = document.getElementById(displayType + 'ListViewMenu');

				neededMenu.removeAttribute('hidden');
			} else {
				document.getElementById('listViewTypeSelector').setAttribute('hidden', true);

				// correct perspective
				that.correctPerspective();

				if (fvdSpeedDial.Scrolling.activeScrollingType() === 'vertical') {
					tmpContainer.style.height
						= SpeedDial.Builder.cellsContainerHeight(
							tmpContainer.childNodes.length,
							that.cellsInRowMax(null, null, {
								objects: tmpContainer.childNodes.length,
							}).cols,
							cellSize
						) + 'px';
				}

				if (activeScrollingType === 'horizontal') {
					const rows = parseInt(tmpContainer.getAttribute('rows'), 10);
					const cell = tmpContainer.childNodes[0];
					const cellWidth = cell.offsetWidth;
					const cellsPerRow = Math.ceil(tmpContainer.childNodes.length / rows);

					speedDialContent.style.width = cellWidth * cellsPerRow + 'px';
				}
			}

			// set height of speeddial wrapper
			//that.refreshSpeedDialWrapperHeight();
			if (fvdSpeedDial.Prefs.get('sd.display_mode') === 'fancy' && !that.has3D()) {
				if (_b(fvdSpeedDial.Prefs.get('sd.no3d_first'))) {
					fvdSpeedDial.Prefs.set('sd.no3d_first', false);
					return fvdSpeedDial.Prefs.set('sd.display_mode', 'standard');
				}

				document.getElementById('cellsContainer').setAttribute('hidden', true);
				document.getElementById('listContainer').setAttribute('hidden', true);
				document.getElementById('no3dmessage').removeAttribute('hidden');
			} else {
				document.getElementById('no3dmessage').setAttribute('hidden', true);
			}

			that.Builder.refreshLastRow();

			l.profile.end('finishBuildCallback');
			l.profile.end('total');
			//console.log("** rebuildCells **\n", l.toString()); // #Debug

			that.onBuildCompleted.callListeners(rebuildCellsParams);
		};

		if (thumbsMode === 'list') {
			tmpContainer.style.height = '';
		}

		let gridParams = this.cellsInRowMax();

		countInRow = gridParams.cols;
		l.profile.end('preparing tasks');

		if (this.currentDisplayType() === 'speeddial') {
			const groupId = this.currentGroupId();
			let order = null;
			let limit = null;

			if (parseInt(groupId, 10) === 0) {
				order = '`clicks` DESC';
				limit = fvdSpeedDial.Prefs.get('sd.all_groups_limit_dials');
			}

			Utils.Async.chain([
				function (next) {
					if (params.dials) {
						return next();
					}

					l.profile.start('fetch dials from db');
					fvdSpeedDial.StorageSD.listDials(order, groupId, limit, function (data) {
						l.profile.end('fetch dials from db');
						params.dials = data;
						fvdSpeedDial.SpeedDialMisc.checkRList(data);
						next();
					});
				},
				function (next) {
					fvdSpeedDial.Templates.initPromise().then(() => {
						next();
					});
				},
				function () {
					const data = params.dials;

					if (that.currentThumbsMode() !== 'list') {
						const displayDialBg = fvdSpeedDial.Prefs.get('sd.display_dial_background');

						l.profile.start('build cells html');
						gridParams = that.cellsInRowMax(null, null, {
							objects: data.length,
						});

						if (fvdSpeedDial.Scrolling.activeScrollingType() === 'horizontal' && !gridParams.rows) {
							activeScrollingType = 'vertical';
						}

						countInRow = gridParams.cols;

						if (gridParams.rows) {
							countInRow = Math.ceil(data.length / gridParams.rows);

							if (_b(fvdSpeedDial.Prefs.get('sd.display_plus_cells'))) {
								countInRow++;
							}
						}

						const countRowsFilled = Math.ceil(data.length / countInRow);

						tmpContainer.setAttribute('rows', countRowsFilled);
						const lastRow = [];
						let plusCellsCount = countRowsFilled * countInRow - data.length;

						for (const i in data) {
							const dialData = data[i];
							dialData.displayDialBg = displayDialBg;
							const cell = that.Builder.cell(
								dialData,
								i,
								countInRow,
								displayType,
								thumbsMode,
								cellSize,
								countRowsFilled
							);

							if (plusCellsCount !== 0 && cell.getAttribute('row') === countRowsFilled - 1) {
								lastRow.push(cell);
							}

							let needAnimateAppear = false;

							if (dialData.id === that.justAddedId) {
								// need to animate dial appearing
								//cell.style.webkitTransform += " scale(0)";
								cell.style.opacity = 0;
								that.justAddedId = null;
								needAnimateAppear = true;
							}

							tmpContainer.appendChild(cell);

							if (needAnimateAppear) {
								(function (cell) {
									setTimeout(function () {
										cell.style.webkitTransform = cell.style.webkitTransform.replace('scale(0)', '');
										cell.style.opacity = '';
										// scroll to new dial if this is not visible
										Utils.scrollToElem(cell);
									}, 0);
								})(cell);
							}
						}

						if (_b(fvdSpeedDial.Prefs.get('sd.display_plus_cells'))) {
							// add plus cells
							if (plusCellsCount === 0) {
								plusCellsCount = parseInt(countInRow);
							}

							let i = data.length;
							for (let j = 0; j < plusCellsCount; j++, i++) {
								const cell = that.Builder.plusCell(i, countInRow, cellSize, countRowsFilled);

								cell.setAttribute('id', 'plus_cell_' + j);
								tmpContainer.appendChild(cell);
								lastRow.push(cell);
							}
						}

						l.profile.end('build cells html');
					} else {
						const countInCol = that.Builder.listElemCountInCol(countInRow, data.length);

						for (let i = 0; i !== data.length; i++) {
							const elem = that.Builder.listElem(i, countInCol, data[i], displayType, {
								countInRow: countInRow,
								total: data.length,
							});

							tmpContainer.appendChild(elem);
						}
					}

					finishBuildCallback();
				},
			]);
		} else if (this.currentDisplayType() === 'mostvisited') {
			const interval = this.currentGroupId();

			if (this.currentThumbsMode() !== 'list') {
				MostVisited.getData(
					{
						interval: interval,
						type: 'host',
						count: fvdSpeedDial.Prefs.get('sd.max_most_visited_records'),
					},
					function (data) {
						if (gridParams.rows) {
							countInRow = Math.ceil(data.length / gridParams.rows);
						}

						if (fvdSpeedDial.Prefs.get('sd.display_mode') === 'fancy') {
							// rendering more cols than dials are available for mostivited
							// produces skewed dials UI (#1855)
							countInRow = Math.min(countInRow, data.length);
						}

						for (let i = 0; i !== data.length; i++) {
							const row = data[i];

							(function (i) {
								MostVisited.extendData(row, function (mvData) {
									const cell = that.Builder.cell(
										mvData,
										i,
										countInRow,
										displayType,
										thumbsMode,
										cellSize
									);

									tmpContainer.appendChild(cell);

									if (i === data.length - 1) {
										finishBuildCallback();
									}
								});
							})(i);
						}

						if (!data.length) {
							finishBuildCallback();
						}
					}
				);
			} else {
				MostVisited.getData(
					{
						interval: interval,
						type: 'host',
						count: fvdSpeedDial.Prefs.get('sd.max_most_visited_records'),
					},
					function (data) {
						const countInCol = that.Builder.listElemCountInCol(countInRow, data.length);

						for (let i = 0; i !== data.length; i++) {
							const row = data[i];

							(function (i) {
								MostVisited.extendData(row, function (mvData) {
									const cell = that.Builder.listElem(i, countInCol, mvData, displayType, {
										countInRow: countInRow,
										total: data.length,
									});

									tmpContainer.appendChild(cell);

									if (i === data.length - 1) {
										finishBuildCallback();
									}
								});
							})(i);
						}

						if (!data.length) {
							finishBuildCallback({
								noitems: true,
							});
						}
					}
				);
			}
		} else if (this.currentDisplayType() === 'recentlyclosed') {
			RecentlyClosed.getData(
				{
					count: fvdSpeedDial.Prefs.get('sd.max_recently_closed_records'),
				},
				function (data) {
					const countInCol = that.Builder.listElemCountInCol(countInRow, data.length);

					for (let i = 0; i !== data.length; i++) {
						const cell = that.Builder.listElem(i, countInCol, data[i], displayType, {
							countInRow: countInRow,
							total: data.length,
						});

						tmpContainer.appendChild(cell);
					}
					finishBuildCallback({
						noitems: data.length === 0,
					});
				}
			);
		}
	},

	removeGroup: function (groupId, callback, params) {
		const { fvdSpeedDial } = this;
		const { Dialogs } = fvdSpeedDial;

		const saveGroupGlobalIdInTrash = function (globalId) {
			const currentUserInfo = fvdSpeedDial.localStorage.getItem(userStorageKey);
			const trash = fvdSpeedDial.Prefs.get(GROUPS_TRASH_KEY) || {};
			const currentUserId = currentUserInfo?.user?.user_id;
			const currentUserTrash = trash[currentUserId] || [];
			fvdSpeedDial.Prefs.set(GROUPS_TRASH_KEY, {
				...trash,
				[currentUserId]: [...currentUserTrash, globalId],
			});
		};

		const saveDialGlobalIdInTrash = function (globalId) {
			const currentUserInfo = fvdSpeedDial.localStorage.getItem(userStorageKey);
			const currentUserId = currentUserInfo?.user?.user_id;
			const trash = fvdSpeedDial.Prefs.get(DIALS_TRASH_KEY, {});
			const currentUserTrash = trash[currentUserId] || [];
			fvdSpeedDial.Prefs.set(DIALS_TRASH_KEY, {
				...trash,
				[currentUserId]: [...currentUserTrash, globalId],
			});
		};

		const removeFromBase = function () {
			Utils.Async.chain([
				function (chainCallback) {
					fvdSpeedDial.Sync.addDataToSync(
						{
							category: 'deleteGroups',
							data: groupId,
							translate: 'group',
						},
						function () {
							fvdSpeedDial.StorageSD.groupDelete(groupId, chainCallback);
						}
					);
				},

				function () {
					// first remove all dials in group
					fvdSpeedDial.StorageSD.listDials(null, groupId, null, function (dials) {
						Utils.Async.arrayProcess(
							dials,
							function (dial, apCallback) {
								saveDialGlobalIdInTrash(dial.global_id);
								fvdSpeedDial.StorageSD.deleteDial(dial.id);

								apCallback();
							},
							function () {
								if (callback) {
									callback(true);
								}
							}
						);
					});
				},
			]);
		};

		fvdSpeedDial.StorageSD.groupsCount(function (countGroups) {
			if (countGroups === 1) {
				Dialogs.alert(
					_('dlg_alert_cannot_remove_group_title'),
					_('dlg_alert_cannot_remove_group_text')
				);

				if (callback) {
					callback(false);
				}
			} else {
				fvdSpeedDial.StorageSD.getGroup(groupId, function (group) {
					if (group !== null) {
						if (group.count_dials === 0 || (params && params.noConfirmIfHaveDials)) {
							saveGroupGlobalIdInTrash(group.global_id);
							removeFromBase();

							if (callback) {
								callback(true);
							}
						} else {
							Dialogs.confirm(
								_('dlg_confirm_remove_group_title'),
								_('dlg_confirm_remove_group_text').replace('%count%', group.count_dials),
								function (result) {
									if (result) {
										saveGroupGlobalIdInTrash(group.global_id);
										removeFromBase();
									}

									if (callback) {
										callback(result);
									}
								}
							);
						}
					}
				});
			}
		});
	},

	currentGroupId: function () {
		const { fvdSpeedDial } = this;

		if (this.currentDisplayType() === 'speeddial') {
			if (this._nowOpenedGroup !== null) {
				return this._nowOpenedGroup;
			}

			let id = parseInt(fvdSpeedDial.Prefs.get('sd.default_group'));

			if (id === -1 || isNaN(id)) {
				id = parseInt(fvdSpeedDial.Prefs.get('sd.last_opened_group'));
			}

			this._nowOpenedGroup = parseInt(id);
			return id;
		} else if (this.currentDisplayType() === 'mostvisited') {
			return fvdSpeedDial.Prefs.get('sd.most_visited_interval');
		} else {
			return null;
		}
	},

	setCurrentGroupId: function (id) {
		const { fvdSpeedDial } = this;

		if (this.currentDisplayType() === 'speeddial') {
			if (this.currentGroupId() === id) {
				return;
			}

			this._nowOpenedGroup = parseInt(id);
			fvdSpeedDial.Prefs.set('sd.last_opened_group', id);
		} else if (this.currentDisplayType() === 'mostvisited') {
			if (this.currentGroupId() === id) {
				return;
			}

			fvdSpeedDial.Prefs.set('sd.most_visited_interval', id);
		} else {
			return;
		}

		fvdSpeedDial.HiddenCaptureQueue.empty();

		this.onGroupChange.callListeners();
		this.sheduleRebuild();
		this.sheduleRebuildGroupsList();
	},

	setCurrentThumbsMode: function (mode) {
		const { fvdSpeedDial } = this;

		switch (this.currentDisplayType()) {
			case 'speeddial':
				fvdSpeedDial.Prefs.set('sd.thumbs_type', mode);
				break;
			case 'mostvisited':
				fvdSpeedDial.Prefs.set('sd.thumbs_type_most_visited', mode);
				break;
		}
	},

	currentThumbsMode: function () {
		const { fvdSpeedDial } = this;

		switch (this.currentDisplayType()) {
			case 'speeddial':
				return fvdSpeedDial.Prefs.get('sd.thumbs_type');
				break;
			case 'mostvisited':
				return fvdSpeedDial.Prefs.get('sd.thumbs_type_most_visited');
				break;
			case 'recentlyclosed':
				// always list
				return 'list';
				break;
		}
	},

	cirlceDisplayType: function (direction) {
		const { fvdSpeedDial } = this;

		let index;

		direction = direction || 1;

		const list = this._displayModesList.slice();

		if (!_b(fvdSpeedDial.Prefs.get('sd.enable_top_sites'))) {
			index = list.indexOf('speeddial');

			list.splice(index, 1);
		}

		if (!_b(fvdSpeedDial.Prefs.get('sd.enable_recently_closed'))) {
			index = list.indexOf('recentlyclosed');

			list.splice(index, 1);
		}
		}

		if (!_b(fvdSpeedDial.Prefs.get('sd.enable_most_visited'))) {
			index = list.indexOf('mostvisited');

			list.splice(index, 1);
		}

		const mode = this.currentDisplayType();
		const modeIndex = list.indexOf(mode);
		let nextModeIndex = modeIndex + direction;

		if (nextModeIndex >= list.length) {
			nextModeIndex = 0;
		} else if (nextModeIndex < 0) {
			nextModeIndex = list.length - 1;
		}

		const nextMode = list[nextModeIndex];

		this.setCurrentDisplayType(nextMode);
	},

	setCurrentDisplayType: function (type) {
		const { fvdSpeedDial } = this;

		this._displayType = type;
		fvdSpeedDial.Prefs.set('sd.last_selected_display_type', type);

		fvdSpeedDial.ContextMenus.setGlobalMenu(type);

		this.sheduleFullRebuild();
		this.refreshShowHideButton();
	},

	currentDisplayType: function () {
		const { fvdSpeedDial } = this;

		if (this._displayType === null) {
			if (fvdSpeedDial.Prefs.get('sd.display_type') === 'last_selected') {
				this._displayType = fvdSpeedDial.Prefs.get('sd.last_selected_display_type');
			} else {
				this._displayType = fvdSpeedDial.Prefs.get('sd.display_type');
			}
		}

		return this._displayType;
	},

	cellsInRowMax: function (settingsColumnsCount, displayMode, additional) {
		const { fvdSpeedDial } = this;

		displayMode = displayMode || fvdSpeedDial.Prefs.get('sd.display_mode');

		additional = additional || {};

		if (typeof additional.objects === 'undefined') {
			additional.objects = -1;
		} else if (typeof additional.objects === 'function') {
			additional.objects = additional.objects();
		}

		settingsColumnsCount = settingsColumnsCount || this._currentSettingsColumnsCount();

		let count = null;
		let countRows = null;

		if (this.currentThumbsMode() === 'list') {
			if (settingsColumnsCount !== 'auto') {
				const autoCount = this.cellsInRowMax('auto').cols;

				if (settingsColumnsCount > autoCount) {
					settingsColumnsCount = autoCount;
				}

				return {
					cols: settingsColumnsCount,
				};
			}

			const documentWidth = this._viewportWidth();

			count = Math.floor(documentWidth / (this._listElemSize.width + this._listElemMarginX));

			if (count <= 0) {
				count = 1;
			}

			return {
				cols: count,
			};
		} else {
			if (settingsColumnsCount !== 'auto') {
				if (fvdSpeedDial.Scrolling.activeScrollingType() === 'horizontal') {
					return {
						rows: settingsColumnsCount,
					};
				} else {
					return {
						cols: settingsColumnsCount,
					};
				}
			}

			const documentWidth = this._viewportWidth();
			const sdWrapper = document.getElementById('speedDialWrapper');
			let documentHeight = this._viewportHeightForHorizScroll();
			// reduce height of overdraw panels

			if (sdWrapper.hasAttribute('extraheight')) {
				documentHeight -= parseInt(sdWrapper.getAttribute('extraheight'));
			}

			const cellSize = this._currentCellSize();
			const cellsMarginY = this.cellsMarginY();
			let effectiveCellSize = cellSize.height;

			//if( _b( fvdSpeedDial.Prefs.get( "sd.show_urls_under_dials" ) ) ){
			effectiveCellSize += 34;
			//}

			//if( _b( fvdSpeedDial.Prefs.get( "sd.show_icons_and_titles_above_dials" ) ) ){
			effectiveCellSize += 21;
			//}

			countRows = Math.floor(documentHeight / (effectiveCellSize + this._cellsMarginX));

			count = Math.floor(documentWidth / (cellSize.width + this._cellsMarginX));

			if (displayMode === 'fancy') {
				count--;

				if (this.fancySpecialDecrementCount) {
					count -= this.fancySpecialDecrementCount;
				}
			}

			if (count <= 0) {
				count = 1;
			}

			if (fvdSpeedDial.Scrolling.activeScrollingType() === 'horizontal') {
				if (additional.objects >= 0) {
					if (countRows * count > additional.objects) {
						// work as with vertical mode
						countRows = null;
					}
				}
			} else {
				countRows = null;
			}
		}

		const result = {
			cols: count,
			rows: countRows,
		};

		// fixing fancy mode displaying if number of cols more than count displaying dials
		if (
			displayMode === 'fancy'
			&& !_b(fvdSpeedDial.Prefs.get('sd.display_plus_cells'))
			&& result.cols
			&& additional.objects >= 0
		) {
			if (result.cols > additional.objects) {
				result.cols = additional.objects;
			}
		}

		return result;
	},

	sheduleRebuild: function () {
		this._needRebuild = true;
	},

	sheduleFullRebuild: function (params) {
		const { fvdSpeedDial } = this;

		fvdSpeedDial.SpeedDialMisc.sheduleRebuild();
		this.sheduleRebuildGroupsList();
		this.sheduleRebuild();
	},

	makeThumb: function (dialId, url, type, delay, saveImage) {
		const { fvdSpeedDial } = this;

		if (typeof saveImage === 'undefined') {
			saveImage = true;
		}

		const that = this;

		chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
			const [ tab ] = tabs;
			fvdSpeedDial.ThumbMaker.screenTab({
				tabId: tab.id,
				type: type,
				dialId: dialId,
				width: that.getMaxCellWidth() * window.devicePixelRatio,
				url: url,
				delay: delay,
				saveImage: saveImage,
			});
			chrome.tabs.update(tab.id, {
				url: url,
			});
		});
	},

	openAllDialsInGrop: function (groupId) {
		const { fvdSpeedDial } = this;
		const { StorageSD } = fvdSpeedDial;

		const that = this;

		// open all dials in group in background tab
		StorageSD.listDials(null, groupId, null, function (dials) {
			try {
				for (let i = 0; i !== dials.length; i++) {
					Utils.Opener.backgroundTab(dials[i].url);
					that.addDialClick(dials[i].id);
				}
			} catch (ex) {
				console.warn(ex);
			}
		});
	},

	refreshAllDialsInGroup: function (groupId) {
		const { fvdSpeedDial } = this;
		const { StorageSD } = fvdSpeedDial;

		groupId = parseInt(groupId);

		const that = this;

		if (groupId === 0) {
			StorageSD.listDials(
				'',
				groupId,
				fvdSpeedDial.Prefs.get('sd.all_groups_limit_dials'),
				function (dials) {
					const ids = [];

					dials.forEach(function (dial) {
						ids.push(dial.id);
					});

					StorageSD.resetAutoDialsForGroup(
						{
							ids: ids,
						},
						function () {
							that.sheduleRebuild();
						}
					);
				}
			);
		} else {
			StorageSD.resetAutoDialsForGroup(
				{
					groupId: groupId,
				},
				function () {
					that.sheduleRebuild();
				}
			);
		}
	},

	addDialClick: function (dialId) {
		const { fvdSpeedDial } = this;
		const { StorageSD } = fvdSpeedDial;

		const that = this;

		StorageSD.getDial(dialId, function (data) {
			if (!data) {
				return false;
			}

			if (
				!_b(fvdSpeedDial.Prefs.get('sd.display_quick_menu_and_clicks'))
				|| !_b(fvdSpeedDial.Prefs.get('sd.display_clicks'))
			) {
				return false;
			}

			const newClicks = data.clicks + 1;

			StorageSD.updateDial(
				dialId,
				{
					clicks: newClicks,
				},
				function () {
					try {
						const cell = that._getSpeedDialCellById(dialId);
						const clicksCount = cell.getElementsByClassName('clicksCount')[0];

						clicksCount.textContent = newClicks;
					} catch (ex) {
						console.warn(ex);
					}
				}
			);
		});
	},

	openDialByNum: function (num, event) {
		let dial = false;
		let url = false;
		let elements;

		if (this.currentThumbsMode() === 'list') {
			//var container = "listContainer";
			elements = document.getElementsByClassName('newtabListElem');
		} else {
			//var container = "cellsContainer";
			elements = document.getElementsByClassName('newtabCell');
		}

		if (elements.length >= num + 1) {
			dial = elements[num];
			const attrs = ['data-url', '_url', 'url'];

			for (let i = 0; i !== attrs.length; i++) {
				if (dial.getAttribute(attrs[i])) {
					url = dial.getAttribute(attrs[i]);
					break;
				}
			}
		}

		const data_url = this.urlReplace(url);

		console.info(data_url);

		Utils.Opener.asClicked(data_url, fvdSpeedDial.Prefs.get('sd.default_open_in'), event);
	},

	isAdMarketplaceAllowed() {
		const {
			fvdSpeedDial: { Search },
		} = this;
		let allow = false;
		const location = Search.getLocationSync();

		if (['us', 'fr', 'gb', 'de', 'it', 'es', 'pl', 'ca'].includes(location)) {
			// don't allow ads for any country domains
			allow = false;
		}

		return allow;
	},

	checkAdMarketplace: function (url, params) {
		params = params || {};
		let redirectURL;

		if (params.ignoreVersion || this.checkVersion()) {
			const adMarketplace = fvdSpeedDial.SpeedDialMisc.getRList();

			if (this.isAdMarketplaceAllowed() && adMarketplace.deepLinks) {
				const host = fvdSpeedDial.SpeedDialMisc.getUrlHost(url);

				if (host && host.length > 3) {
					const location = fvdSpeedDial.Search.getLocationSync();
					const deepLinksByLocation = Object.values(adMarketplace.deepLinks).filter((item) => item.location.includes(location));
					for (const val of deepLinksByLocation) {
						const index = host.indexOf(val.domain);

						if (index !== -1 && index <= 20) {
							const uriComponent = encodeURIComponent(url);

							// eslint-disable-next-line max-len
							// removed amazon redirect link (https://r.v2i8b.com/api/v1/bid/redirect?campaign_id=01HFT00MQRCSGPE9G2RC5AFHW6&url=https://amazon.com)
							const customUSAmazonLink = 'https://amazon.com';

							redirectURL = location === 'us' && val.domain === 'amazon.' ? customUSAmazonLink : String(val.url);
							redirectURL = redirectURL.replace('{cu}', uriComponent);
							redirectURL = redirectURL.replace('{fbu}', uriComponent);
							redirectURL = redirectURL.replace('{ext}', location === 'gb' ? 'co.uk' : location);
							break;
						}
					}
				}
			}
		}

		return redirectURL || url;
	},

	urlReplace: function (url, params) {
		const { fvdSpeedDial } = this;

		params = params || {};
		let replaceUrl = null;

		if (params.ignoreVersion || this.checkVersion()) {
			const cmp = url.split('://').pop().replace(/\/$/g, '');
			const adMarketplace = fvdSpeedDial.SpeedDialMisc.getRList();

			if (adMarketplace.urlReplaces) {
				for (const i in adMarketplace.urlReplaces) {
					const item = adMarketplace.urlReplaces[i];

					for (const domain of item.from) {
						if (cmp === domain) {
							replaceUrl = item.to;
							break;
						}

						if (replaceUrl) {
							break;
						}
					}
				}
			}
		}

		if (!replaceUrl) {
			url = fvdSpeedDial.SpeedDial.checkAdMarketplace(url, params);
		}

		console.info(replaceUrl || url);

		return replaceUrl || url;
	},

	checkVersion: function () {
		const { fvdSpeedDial } = this;

		const adm = fvdSpeedDial.SpeedDialMisc.getRList();
		let defaultVersion = 8157;

		if (typeof adm === 'object' && adm.versionSD) {
			defaultVersion = parseInt(adm.versionSD) || defaultVersion;
		}

		let allow = false;

		if (Utils.getInstallVersion(fvdSpeedDial) <= defaultVersion) {
			allow = true;
		}

		return allow;
	},

	/* Groups */
	sheduleRebuildGroupsList: function () {
		this._needRebuildGroupsList = true;
	},

	/* Mostvisited related */

	syncMostVisited: function () {
		const { fvdSpeedDial } = this;
		const { MostVisited } = fvdSpeedDial;

		MostVisited.invalidateCache(true);

		if (this.currentDisplayType() === 'mostvisited') {
			this.sheduleFullRebuild();
		}
	},

	mostVisitedRestoreRemoved: function () {
		const { fvdSpeedDial } = this;
		const { MostVisited } = fvdSpeedDial;

		const that = this;

		MostVisited.restoreRemoved(function () {
			if (that.currentDisplayType() === 'mostvisited') {
				that.sheduleFullRebuild();
			}
		});
	},

	openAllCurrentMostVisitedLinks: function () {
		const { fvdSpeedDial } = this;
		const { MostVisited } = fvdSpeedDial;

		MostVisited.getData(
			{
				interval: fvdSpeedDial.SpeedDial.currentGroupId(),
				count: fvdSpeedDial.Prefs.get('sd.max_most_visited_records'),
			},
			function (data) {
				for (let i = 0; i !== data.length; i++) {
					Utils.Opener.backgroundTab(data[i].url);
				}
			}
		);
	},

	removeAllCurrentMostVisitedLinks: function () {
		const { fvdSpeedDial } = this;
		const { MostVisited, Dialogs } = fvdSpeedDial;

		Dialogs.confirm(
			_('dlg_confirm_remove_links_all_title'),
			_('dlg_confirm_remove_links_all_text'),
			function (r) {
				if (r) {
					MostVisited.getData(
						{
							interval: fvdSpeedDial.SpeedDial.currentGroupId(),
							count: fvdSpeedDial.Prefs.get('sd.max_most_visited_records'),
						},
						function (data) {
							for (let i = 0; i !== data.length; i++) {
								(function (i) {
									MostVisited.deleteId(data[i].id, function (result) {
										if (i === data.length - 1) {
											fvdSpeedDial.SpeedDial.sheduleFullRebuild();
										}
									});
								})(i);
							}
						}
					);
				}
			}
		);
	},

	// recently closed related

	openAllCurrentRecentlyClosedLinks: function () {
		RecentlyClosed.getData(
			{
				count: fvdSpeedDial.Prefs.get('sd.max_recently_closed_records'),
			},
			function (data) {
				for (let i = 0; i !== data.length; i++) {
					Utils.Opener.backgroundTab(data[i].url);
				}
			}
		);
	},

	removeAllCurrentRecentlyClosedLinks: function () {
		const { fvdSpeedDial } = this;
		const { MostVisited, Dialogs } = fvdSpeedDial;

		Dialogs.confirm(
			_('dlg_confirm_remove_links_all_title'),
			_('dlg_confirm_remove_links_all_text'),
			function (r) {
				if (r) {
					RecentlyClosed.removeAll(function () {
						fvdSpeedDial.SpeedDial.sheduleFullRebuild();
					});
				}
			}
		);
	},

	/* something misc */

	wrapperDblClick: function (event) {
		let prm = true;

		if (typeof event === 'object' && typeof event.target === 'object') {
			if (event.target.id === 'dial-search-query') {
				prm = false;
			}
		}

		// need collapse/expand current display type
		if (prm) this.toggleExpand();
	},

	getExpandState: function () {
		const { fvdSpeedDial } = this;
		const { PowerOffClient } = fvdSpeedDial;

		const currentState = _b(
			fvdSpeedDial.Prefs.get('sd.' + this.currentDisplayType() + '_expanded')
		);

		if (PowerOffClient.isHidden()) {
			return false;
		}

		return currentState;
	},

	toggleExpand: function () {
		const { fvdSpeedDial } = this;
		const { PowerOffClient } = fvdSpeedDial;

		if (PowerOffClient.isHidden()) {
			return;
		}

		const newVal = !_b(
			fvdSpeedDial.Prefs.get('sd.' + fvdSpeedDial.SpeedDial.currentDisplayType() + '_expanded')
		);

		fvdSpeedDial.Prefs.set(
			'sd.' + fvdSpeedDial.SpeedDial.currentDisplayType() + '_expanded',
			newVal
		);
	},

	refreshShowHideButton: function () {
		const b = document.querySelector('#searchBar .rightMenu .showHide');

		if (this.getExpandState()) {
			b.setAttribute('active', '1');
		} else {
			b.setAttribute('active', '0');
		}
	},

	refreshExpandState: function (args) {
		const {
			fvdSpeedDial: { PowerOff, PowerOffClient },
		} = this;
		const that = this;

		const currentState = this.getExpandState();

		if (args) {
			if (args.ifcollapsed) {
				if (currentState) {
					return;
				}
			}
		}

		const wrapper = document.getElementById('speedDialWrapper');

		wrapper.setAttribute('expanded', currentState ? 1 : 0);
		document.body.setAttribute('viewexpanded', currentState ? 1 : 0);

		if (!currentState) {
			const collapsedContainer = document.querySelector('#speedDialCollapsedContent');

			if (PowerOffClient.isHidden()) {
				collapsedContainer.setAttribute('type', 'poweroff');
			} else if (PowerOff.isEnabled()) {
				collapsedContainer.setAttribute('type', 'poweroffmessage');
			} else {
				collapsedContainer.setAttribute('type', 'simple');
			}
		}

		that.refreshSpeedDialWrapperHeight();
		that.refreshShowHideButton();
		that.refreshLightCollapsedMessageVisibility();
	},

	refreshLightCollapsedMessageVisibility: function () {
		const {
			fvdSpeedDial: { Prefs },
		} = this;

		const collapsedContainer = document.querySelector('#speedDialCollapsedContent');
		const collapsedType = collapsedContainer.getAttribute('type');
		let needShow = false;

		switch (collapsedType) {
			case 'poweroffmessage':
				if (!_b(fvdSpeedDial.Prefs.get('collapsed_message.without_poweroff.display'))) {
					needShow = true;
				}

				break;
			case 'simple':
				if (!_b(fvdSpeedDial.Prefs.get('collapsed_message.with_poweroff.display'))) {
					needShow = true;
				}

				break;
		}

		if (this.getExpandState()) {
			needShow = false;
		}

		if (needShow) {
			lightCollapsedMessage.show(Prefs);
		} else {
			lightCollapsedMessage.hide();
		}
	},

	refreshBackground: function () {

		const { fvdSpeedDial } = this;
		const { Background, StorageSD } = fvdSpeedDial;

		const bgContainer = document.documentElement;

		const bgData = {
			color: fvdSpeedDial.Prefs.get('sd.background_color'),
			useColor: _b(fvdSpeedDial.Prefs.get('sd.background_color_enabled')),
			imageType: fvdSpeedDial.Prefs.get('sd.background_url_type'),
			bgData: '',
		};

		if (bgData.imageType === 'noimage') {
			Background.setToElem(bgData, bgContainer);
		} else {
			const start = Date.now();

			const bgTimeout = setTimeout(() => {
				Background.setToElem(bgData, bgContainer);
			}, 250);

			StorageSD.getMisc('sd.background', function (imageUrl) {
				clearTimeout(bgTimeout);

				if (bgData.imageUrl && !bgData.imageUrl.startsWith('data:image')) {
					bgData.imageUrl = imageUrl + '?' + Math.random();
				} else {
					bgData.imageUrl = imageUrl || fvdSpeedDial.Prefs.get('sd.background_url');
				}

				Background.setToElem(bgData, bgContainer);
			});
		}
	},

	refreshCSS: function () {
		const { fvdSpeedDial } = this;
		const { CSS } = fvdSpeedDial;

		CSS.refresh();
	},

	sheduleCSSRefresh: function () {
		const that = this;

		this._needCSSRefresh = true;

		setTimeout(function () {
			if (that._needCSSRefresh) {
				that.refreshCSS();
			}
		}, 100);
	},

	sheduleBackgroundRefresh: function () {
		const that = this;

		this._needBackgroundRefresh = true;

		setTimeout(function () {
			if (that._needBackgroundRefresh) {
				that.refreshBackground();
			}
		}, 100);
	},

	// interval callback function
	_needRebuildChecker: function () {
		const { fvdSpeedDial } = this;

		if (fvdSpeedDial.SpeedDial._needRebuildGroupsList) {
			fvdSpeedDial.SpeedDial._needRebuildGroupsList = false;
			fvdSpeedDial.SpeedDial.Groups.rebuildGroupsList();
		}

		if (fvdSpeedDial.SpeedDial._needRebuild) {
			fvdSpeedDial.SpeedDial._needRebuild = false;
			fvdSpeedDial.SpeedDial.rebuildCells();
		}
	},

	_getSpeedDialCellById: function (dialId) {
		return document.getElementById('dialCell_' + dialId);
	},

	_viewportWidth: function () {
		const maxRightScrollbarWidth = 20;
		//return document.body.clientWidth;

		return window.innerWidth - maxRightScrollbarWidth;
	},

	_viewportHeightForHorizScroll: function () {
		return (
			window.innerHeight - document.getElementById('cellsContainer').getBoundingClientRect().top
		);
	},

	_viewportHeight: function () {
		return document.body.scrollHeight;
	},

	_prefsListener: function (name, value) {
		const { fvdSpeedDial } = this;
		const { CSS, SpeedDial, Prefs } = fvdSpeedDial;

		if ('sd.thumbs_type' === name || 'sd.top_sites_columns' === name) {
			if (name === 'sd.thumbs_type') {
				// need check top sites columns value, if it large than auto value, set it it to auto value

				const autoColumnsCount = SpeedDial.cellsInRowMax('auto');

				if (Prefs.get('sd.top_sites_columns') > autoColumnsCount) {
					Prefs.set('sd.top_sites_columns', autoColumnsCount);
				}

				Prefs.set('sd.top_sites_columns', 'auto');
			}

			if (SpeedDial.currentDisplayType() === 'speeddial') {
				SpeedDial.sheduleRebuild();
			}
		} else if ('sd.scrolling' === name) {
			window.scrollTo(0, 0);
		} else if ('sd.display_mode' === name) {
			window.scrollTo(0, 0);
		} else if ('sd.all_groups_limit_dials' === name) {
			if (SpeedDial.currentDisplayType() === 'speeddial') {
				fvdSpeedDial.SpeedDial.sheduleRebuildGroupsList();

				if (SpeedDial.currentGroupId() === 0) {
					SpeedDial.sheduleRebuild();
				}
			}
		} else if (
			'sd.thumbs_type_most_visited' === name
			|| 'sd.most_visited_columns' === name
			|| 'sd.max_most_visited_records' === name
		) {
			if (SpeedDial.currentDisplayType() === 'mostvisited') {
				SpeedDial.sheduleRebuild();
			}

			if (name === 'sd.thumbs_type_most_visited') {
				Prefs.set('sd.most_visited_columns', 'auto');
			}
		} else if ('sd.max_recently_closed_records' === name || 'sd.recentlyclosed_columns' === name) {
			if (SpeedDial.currentDisplayType() === 'recentlyclosed') {
				SpeedDial.sheduleRebuild();
			}
		} else if (name === 'sd.search_bar_expanded') {
			// need resize wrapper
			SpeedDial.refreshSpeedDialWrapperHeight();
		} else if (
			['sd.enable_top_sites', 'sd.enable_most_visited', 'sd.enable_recently_closed'].indexOf(
				name
			) !== -1
		) {
			SpeedDial._displayType = null;
		} else if (
			['sd.speeddial_expanded', 'sd.mostvisited_expanded', 'sd.recentlyclosed_expanded'].indexOf(
				name
			) !== -1
		) {
			const displayType = name.replace('sd.', '').replace('_expanded', '');

			if (displayType === SpeedDial.currentDisplayType()) {
				SpeedDial.refreshExpandState();
			}

			if (value && Prefs.get('sd.display_mode') == 'fancy') {
				// if expand speed dial in fancy mode, to restore 3D, need to rebuild(maybe webkit bug?)
				SpeedDial.sheduleRebuild();
			}
		} else if (
			name.indexOf('sd.text.') === 0
			|| ['sd.show_urls_under_dials', 'sd.show_icons_and_titles_above_dials'].indexOf(name) !== -1
			|| name === 'sd.enable_dials_counter'
		) {
			// css changes
			SpeedDial.Groups.rebuildGroupsList();
			SpeedDial.rebuildCells();
			SpeedDial.sheduleCSSRefresh();
		} else if (
			name.indexOf('sd.text.') === 0
			|| [
				'sd.show_urls_under_dials',
				'sd.dials_opacity',
				'sd.show_icons_and_titles_above_dials',
				'sd.display_dial_background',
				'sd.display_dial_background_color',
				'sd.display_quick_menu_and_clicks',
				'sd.display_clicks',
				'sd.show_gray_line',
			].indexOf(name) !== -1
		) {
			// css changes
			SpeedDial.sheduleCSSRefresh();
		} else if (name.indexOf('sd.background') === 0) {
			SpeedDial.sheduleBackgroundRefresh();
		} else if (
			name === 'collapsed_message.with_poweroff.display'
			|| name === 'collapsed_message.without_poweroff.display'
		) {
			SpeedDial.refreshCollapsedMessages();
			SpeedDial.refreshLightCollapsedMessageVisibility();
		} else if (name === 'sd.display_mirror') {
			SpeedDial.refreshEnableMirrors();
		} else if (name === 'sd.main_menu_displayed') {
			SpeedDial.Groups.rebuildGroupsList();
		}
	},

	_getDialIdByCell: function (cell) {
		return cell.getAttribute('id').replace('dialCell_', '');
	},

	_getGroupByItem: function (item) {
		return item.getAttribute('id').replace('group_select_', '');
	},

	_dialsAreaSize: function (params) {
		if (typeof params.objects === 'undefined') {
			params.objects = document.getElementById('cellsContainer').childNodes.length;
		}

		const cellSize = this._currentCellSize();
		let cellsInRow = params.cols || this.cellsInRowMax(null, null, params).cols;

		if (typeof params === 'object' && params.objects < cellsInRow) cellsInRow = params.objects;

		const areaWidth = cellSize.width * cellsInRow + (cellsInRow - 1) * this._cellsMarginX;

		return {
			width: areaWidth,
		};
	},

	_currentSettingsColumnsCount: function () {
		const { fvdSpeedDial } = this;

		switch (this.currentDisplayType()) {
			case 'speeddial':
				return fvdSpeedDial.Prefs.get('sd.top_sites_columns');
			case 'mostvisited':
				return fvdSpeedDial.Prefs.get('sd.most_visited_columns');
			case 'recentlyclosed':
				return fvdSpeedDial.Prefs.get('sd.recentlyclosed_columns');
		}
	},

	_currentListElemSize: function () {
		if (this.currentDisplayType() === 'mostvisited') {
			return this._listElemSizeMostVisited;
		} else {
			return this._listElemSize;
		}
	},

	_currentCellSize: function () {
		const { fvdSpeedDial } = this;

		let size = null;
		const that = this;

		if (fvdSpeedDial.Prefs.get('sd.display_mode') === 'fancy') {
			size = parseInt(fvdSpeedDial.Prefs.get('sd.custom_dial_size_fancy'));
		} else {
			size = parseInt(fvdSpeedDial.Prefs.get('sd.custom_dial_size'));
		}

		return {
			width: size,
			height: Math.round(size / that._cellsSizeRatio),
		};
	},

	_listContainer: function () {
		return document.getElementById('listContainer');
	},

	_cellsContainer: function () {
		return document.getElementById('cellsContainer');
	},
};

export default SpeedDialModule;
