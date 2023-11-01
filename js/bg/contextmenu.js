import { _b } from '../utils.js';
import { _ } from '../localizer.js';
import Sync from '../sync/tab.js';

const ContextMenu = function (fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;
	fvdSpeedDial.ContextMenu = this;
};

const MENU_ID = 'fvd_speeddial';
const GROUP_ID_PREFIX = 'm_groupid_';

ContextMenu.prototype = {
	_mainId: null,
	needRebuild: false,

	init: function () {
		const that = this;

		setInterval(function () {
			if (that.needRebuild) {
				that.rebuild();
				that.needRebuild = false;
			}
		}, 200);

		this.addListener();
	},

	sheduleRebuild: function () {
		this.needRebuild = true;
	},

	rebuild: function () {
		const { fvdSpeedDial } = this;

		chrome.contextMenus.removeAll();

		if (this._mainId) {
			// chrome.contextMenus.remove(this._mainId);
			this._mainId = null;
		}

		if (!_b(fvdSpeedDial.Prefs.get('sd.show_in_context_menu'))) {
			return;
		}

		this._mainId = chrome.contextMenus.create({
			id: MENU_ID,
			type: 'normal',
			title: _('cm_main_title'),
			contexts: ['page', 'link'],
		});

		const that = this;

		// add groups list
		fvdSpeedDial.StorageSD.groupsList(function (groups) {
			for (let i = 0; i !== groups.length; i++) {
				(function (i) {
					let groupTitle = groups[i].name;

					if (i === 0) {
						groupTitle = _('cm_add_to') + groupTitle;
					}

					try {
						chrome.contextMenus.create({
							id: GROUP_ID_PREFIX + groups[i].id,
							type: 'normal',
							title: groupTitle,
							contexts: ['page', 'link'],
							parentId: that._mainId,
						});
					} catch (ex) {}
				})(i);
			}
		});
	},

	addListener: function () {
		this.removeListener();
		chrome.contextMenus.onClicked.addListener(this.listener.bind(this));
	},

	removeListener: function () {
		chrome.contextMenus.onClicked.removeListener(this.listener);
	},

	listener: function (clickData, tab) {
		const groupId = parseInt(clickData.menuItemId.replace(GROUP_ID_PREFIX, ''));

		if (clickData.linkUrl) {
			this.addLinkToSpeedDial(clickData, groupId, tab);
		} else {
			this.addTabToSpeedDial(tab, groupId);
		}
	},

	checkDialExists: function (data, callback) {
		const that = this;

		fvdSpeedDial.StorageSD.dialExists(
			{
				url: data.url,
			},
			function (exists) {
				if (exists) {
					that.showAlreadyExistsMessage(data.tabId, callback);
				} else {
					callback(true);
				}
			}
		);
	},

	addLinkToSpeedDial: function (clickData, groupId, tab) {
		const that = this;

		this.checkDialExists(
			{
				tabId: tab.id,
				url: clickData.linkUrl,
			},
			function (canAdd) {
				if (!canAdd) {
					return;
				}

				fvdSpeedDial.StorageSD.addDial(
					{
						url: clickData.linkUrl,
						title: '',
						thumb_source_type: 'screen',
						group_id: groupId,
						get_screen_method: 'auto',
					},
					function (result) {
						if (result.result) {
							Sync.addDataToSync({
								category: ['dials', 'newDials'],
								data: result.id,
								translate: 'dial',
							});
						}
					}
				);

				that.showSuccessAdded(tab.id);
			}
		);
	},

	addTabToSpeedDial: function (tab, groupId) {
		const that = this;

		this.checkDialExists(
			{
				tabId: tab.id,
				url: tab.url,
			},
			function (canAdd) {
				if (!canAdd) {
					return;
				}

				fvdSpeedDial.StorageSD.addDial(
					{
						url: tab.url,
						title: tab.title,
						thumb_source_type: 'screen',
						group_id: groupId,
						get_screen_method: 'auto',
					},
					function (result) {
						if (result.result) {
							Sync.addDataToSync({
								category: ['dials', 'newDials'],
								data: result.id,
								translate: 'dial',
							});
						}
					}
				);

				that.showSuccessAdded(tab.id);
			}
		);
	},

	showSuccessAdded: function (tabId) {
		this.injectScripts(tabId, function () {
			chrome.tabs.sendMessage(tabId, {
				action: 'dialAdded',
				text: _('cs_dial_added'),
			});
		});
	},

	showAlreadyExistsMessage: function (tabId, callback) {
		const { fvdSpeedDial } = this;

		if (_b(fvdSpeedDial.Prefs.get('sd.display_dial_already_exists_dialog'))) {
			this.injectScripts(tabId, function () {
				chrome.tabs.sendMessage(
					tabId,
					{
						action: 'alreadyExists',
						text: _('dlg_confirm_dial_exists_text'),
						checkText: _('newtab_do_not_display_migrate'),
						addDialText: _('dlg_button_add_dial'),
						cancelText: _('dlg_button_cancel'),
					},
					callback
				);
			});
		} else {
			callback(true);
		}
	},

	injectScripts: function (tabId, callback) {
		chrome.scripting.executeScript(
			{
				target: { tabId },
				files: ['/content-scripts/fvdsdadd/cs.js'],
			},
			() => {
				chrome.scripting.insertCSS(
					{
						target: { tabId },
						files: ['/content-scripts/fvdsdadd/cs.css'],
					},
					() => {
						callback();
					}
				);
			}
		);
	},
};

export default ContextMenu;
