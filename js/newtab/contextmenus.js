import { dhtmlXMenuObject } from './contextmenu/dhtmlxmenu.js';
import { _ } from '../localizer.js';
import { _b } from '../utils.js';
import { userStorageKey } from '../sync/user.js';
import { DIALS_TRASH_KEY, defaultGroupGlobalIDs } from '../constants.js';

const ContextMenus = function (fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;
};

ContextMenus.prototype = {
	_globalMenu: null,
	_speedDialCellMenu: null,
	_speedDialGroupContextMenu: null,
	_speedDialGroupManageGroupsMenu: null,
	_mostVisitedCellMenu: null,
	_mostVisitedInGroupUrlMenu: null,
	_appsCellMenu: null,
	_recentlyClosedCellMenu: null,
	init: function () {
		const { fvdSpeedDial } = this;
		const that = this;

		setTimeout(function () {
			// apps cell menu
			that._appsCellMenu = new dhtmlXMenuObject();
			that._appsCellMenu.renderAsContextMenu();
			that.rebuildAppsCellMenu();
			that._appsCellMenu.attachEvent('onclick', function (action, cellId) {
				const cell = document.getElementById(cellId);
				const appId = cell.getAttribute('_app');

				switch (action) {
					case 'open':
						chrome.management.launchApp(appId);
						break;
					case 'remove':
						chrome.management.uninstall(appId);
						break;
				}
			});
			// recently closed cell menu
			that._recentlyClosedCellMenu = new dhtmlXMenuObject();
			that._recentlyClosedCellMenu.renderAsContextMenu();
			that.rebuildRecentlyClosedCellMenu();
			that._recentlyClosedCellMenu.attachEvent('onclick', function (action, cellId) {
				const cell = document.getElementById(cellId);

				if (!cell) {
					return false;
				}

				const dialId = fvdSpeedDial.SpeedDial._getDialIdByCell(cell);

				fvdSpeedDial.StorageSD.RecentlyClosed.get(dialId, function (data) {
					const data_url = fvdSpeedDial.SpeedDial.urlReplace(data.url);

					switch (action) {
						case 'open_tab':
							fvdSpeedDial.Utils.Opener.currentTab(data_url);
							break;
						case 'open_new_tab':
							fvdSpeedDial.Utils.Opener.newTab(data_url);
							break;
						case 'open_bg_tab':
							fvdSpeedDial.Utils.Opener.backgroundTab(data_url);
							break;
						case 'open_incognito_tab':
							fvdSpeedDial.Utils.Opener.incognitoTab(data_url);
							break;
						case 'add_to_speeddial':
							fvdSpeedDial.Dialogs.addDial(data, 'speeddial', true);
							break;
						case 'remove':
							fvdSpeedDial.StorageSD.RecentlyClosed.remove(data.id, function () {
								fvdSpeedDial.SpeedDial.sheduleFullRebuild();
							});
							break;
						case 'block':
							fvdSpeedDial.Dialogs.deny({
								type: 'url',
								sign: data.url,
							});
							break;
						case 'copy_url':
							fvdSpeedDial.Utils.copyToClipboard(data.url);
							break;
					}
				});
			});
			// most visited in group url menu
			that._mostVisitedInGroupUrlMenu = new dhtmlXMenuObject();
			that._mostVisitedInGroupUrlMenu.renderAsContextMenu();
			that._mostVisitedInGroupUrlMenu.attachEvent('onclick', function (action, cellId) {
				const dialId = cellId.replace('mostvisitedInGroupUrl_', '');

				fvdSpeedDial.MostVisited.getById(
					dialId,
					fvdSpeedDial.SpeedDial.currentGroupId(),
					'url',
					function (data) {
						switch (action) {
							case 'open_tab':
								fvdSpeedDial.Utils.Opener.currentTab(data.url);
								break;
							case 'open_new_tab':
								fvdSpeedDial.Utils.Opener.newTab(data.url);
								break;
							case 'open_bg_tab':
								fvdSpeedDial.Utils.Opener.backgroundTab(data.url);
								break;
							case 'add_to_speeddial':
								fvdSpeedDial.Dialogs.addDial(data, 'speeddial', true, function () {
									fvdSpeedDial.Dialogs.ViewGroup.currentDlg.close();
								});
								break;
							case 'remove':
								fvdSpeedDial.MostVisited.deleteId(data.id, function (result) {
									if (result.result) {
										fvdSpeedDial.Dialogs.ViewGroup.rebuild();
										fvdSpeedDial.SpeedDial.sheduleFullRebuild();
									}
								});
								break;
							case 'block':
								fvdSpeedDial.Dialogs.deny({
									type: 'url',
									sign: data.url,
								});
								break;
							case 'copy_url':
								fvdSpeedDial.Utils.copyToClipboard(data.url);
								break;
						}
					}
				);
			});
			that.rebuildMostVisitedInGroupUrlMenu();
			// most visited cell menu
			that._mostVisitedCellMenu = new dhtmlXMenuObject();
			that._mostVisitedCellMenu.renderAsContextMenu();
			that._mostVisitedCellMenu.attachEvent('onContextMenu', function (x, cellId) {
				const cell = document.getElementById(cellId);

				if (!cell) {
					return false;
				}

				const dialId = fvdSpeedDial.SpeedDial._getDialIdByCell(cell);

				fvdSpeedDial.MostVisited.getById(
					dialId,
					fvdSpeedDial.SpeedDial.currentGroupId(),
					null,
					function (data) {
						fvdSpeedDial.MostVisited.extendData(data, function (extendedData) {
							if (extendedData.thumb_source_type === 'screen') {
								that._mostVisitedCellMenu.setItemEnabled('refresh');
							} else {
								that._mostVisitedCellMenu.setItemDisabled('refresh');
							}
						});
					}
				);
			});
			that._mostVisitedCellMenu.attachEvent('onClick', function (action, cellId) {
				const cell = document.getElementById(cellId);

				if (!cell) {
					return false;
				}

				const dialId = fvdSpeedDial.SpeedDial._getDialIdByCell(cell);

				fvdSpeedDial.MostVisited.getById(
					dialId,
					fvdSpeedDial.SpeedDial.currentGroupId(),
					null,
					function (data) {
						if (data) {
							switch (action) {
								case 'open_tab':
									fvdSpeedDial.Utils.Opener.currentTab(data.url);
									break;
								case 'open_new_tab':
									fvdSpeedDial.Utils.Opener.newTab(data.url);
									break;
								case 'open_bg_tab':
									fvdSpeedDial.Utils.Opener.backgroundTab(data.url);
									break;
								case 'open_incognito_tab':
									fvdSpeedDial.Utils.Opener.incognitoTab(data.url);
									break;
								case 'add_to_speeddial':
									if (data.title) {
									} else if (data.auto_title) {
										data.title = data.auto_title;
									}

									fvdSpeedDial.Dialogs.addDial(data, 'speeddial', true);
									break;
								case 'edit':
									fvdSpeedDial.MostVisited.extendData(data, function (extendedData) {
										fvdSpeedDial.Dialogs.addDial(extendedData, 'mostvisited', false);
									});
									break;
								case 'refresh':
									fvdSpeedDial.MostVisited.extendData(data, function (extendedData) {
										if (extendedData.get_screen_method === 'manual') {
											fvdSpeedDial.SpeedDial.makeThumb(
												extendedData.id,
												extendedData.url,
												'mostvisited',
												extendedData.screen_delay
											);
										} else {
											fvdSpeedDial.SpeedDial.ThumbManager.hiddenCaptureThumb({
												type: 'mostvisited',
												interval: fvdSpeedDial.SpeedDial.currentGroupId(),
												data: {
													id: dialId,
												},
												elemId: cell.getAttribute('id'),
											});
										}
									});
									break;
								case 'remove':
									fvdSpeedDial.MostVisited.deleteId(data.id, function (result) {
										if (result.result) {
											fvdSpeedDial.SpeedDial.dialRemoveAnimate(data.id);
										}
									});
									break;
								case 'block':
									fvdSpeedDial.Dialogs.deny({
										type: 'url',
										sign: data.url,
									});
									break;
								case 'copy_url':
									fvdSpeedDial.Utils.copyToClipboard(data.url);
									break;
							}
						}
					}
				);
			});
			that.rebuildMostVisitedCellMenu();
			// SpeedDial manage groups group menu
			that._speedDialGroupManageGroupsMenu = new dhtmlXMenuObject();
			that._speedDialGroupManageGroupsMenu.renderAsContextMenu();
			that.rebuildSpeedDialGroupManageGroupsMenu();
			const UserInfo = that.fvdSpeedDial.localStorage.getItem(userStorageKey);
			let isPremiumUser = false;

			if (UserInfo && UserInfo?.user?.premium?.active) {
				isPremiumUser = true;
			}

			let recommendGroupId = null;

			that.fvdSpeedDial.StorageSD.groupIdByGlobalId(defaultGroupGlobalIDs.recommend, (_recommendId) => {
				recommendGroupId = _recommendId;
			});

			that._speedDialGroupManageGroupsMenu.attachEvent('onContextMenu', function (x, elemId) {
				const groupId = elemId.replace('group_', '');
				const menu = that._speedDialGroupManageGroupsMenu;

				if (+groupId === recommendGroupId && !isPremiumUser) {
					menu.setItemDisabled('edit');
					menu.setItemDisabled('remove');
				}

				menu.setCheckboxState(
					'default_group',
					fvdSpeedDial.Prefs.get('sd.default_group') === groupId
				);
			});
			that._speedDialGroupManageGroupsMenu.attachEvent('onClick', function (action, elemId) {
				const groupId = elemId.replace('group_', '');

				switch (action) {
					case 'default_group':
						fvdSpeedDial.Prefs.set('sd.default_group', groupId);
						that._speedDialGroupManageGroupsMenu.setCheckboxState('default_group', true);
						break;
					case 'edit':
						fvdSpeedDial.Dialogs.ManageGroups.editGroupById(groupId);
						break;
					case 'remove':
						fvdSpeedDial.SpeedDial.removeGroup(groupId, () => {
							fvdSpeedDial.SpeedDial.sheduleRebuildGroupsList();
						});
						break;
				}
			});
			// SpeeDial group menu
			that._speedDialGroupContextMenu = new dhtmlXMenuObject();
			that._speedDialGroupContextMenu.renderAsContextMenu();
			that._speedDialGroupContextMenu.attachEvent('onContextMenu', function (x, elemId) {
				const elem = document.getElementById(elemId);

				if (!elem) {
					return false;
				}

				const groupId = fvdSpeedDial.SpeedDial._getGroupByItem(elem);
				const menu = that._speedDialGroupContextMenu;

				if (+groupId === 0 || (+groupId === recommendGroupId && !isPremiumUser)) {
					menu.setItemDisabled('edit');
					menu.setItemDisabled('remove');
					//menu.setItemDisabled( "sync_group" );
				} else {
					menu.setItemEnabled('edit');
					menu.setItemEnabled('remove');
					//menu.setItemEnabled( "sync_group" );
				}

				menu.setCheckboxState(
					'default_group',
					fvdSpeedDial.Prefs.get('sd.default_group') === groupId
				);
				menu.setCheckboxState(
					'last_selected_group',
					fvdSpeedDial.Prefs.get('sd.default_group') === -1
				);
				//fvdSpeedDial.StorageSD.getGroup( groupId, function( group ){
				//menu.setCheckboxState( "sync_group", group.sync == 1 );
				//} );
			});
			that._speedDialGroupContextMenu.attachEvent('onClick', function (action, elemId) {
				const menu = that._speedDialGroupContextMenu;
				const elem = document.getElementById(elemId);

				if (!elem) {
					return false;
				}

				const groupId = fvdSpeedDial.SpeedDial._getGroupByItem(elem);

				switch (action) {
					case 'sync_group':
						var sync = menu.getCheckboxState('sync_group') ? 1 : 0;

						fvdSpeedDial.Utils.Async.chain([
							function (chainCallback) {
								fvdSpeedDial.Sync.syncAddonExists(function (exists) {
									if (!exists) {
										fvdSpeedDial.Dialogs.installFVDSync();
									} else {
										chainCallback();
									}
								});
							},
							function (chainCallback) {
								if (sync === 1) {
									chainCallback();
								} else {
									fvdSpeedDial.Dialogs.setGroupNoSyncDialog(function (set) {
										if (set) {
											chainCallback();
										}
									});
								}
							},
							function () {
								fvdSpeedDial.StorageSD.groupUpdate(groupId, {
									sync: sync,
								});
							},
						]);
						break;
					case 'default_group':
						fvdSpeedDial.Prefs.set('sd.default_group', groupId);
						menu.setCheckboxState('default_group', true);
						menu.setCheckboxState('last_selected_group', false);
						break;
					case 'last_selected_group':
						fvdSpeedDial.Prefs.set('sd.default_group', -1);
						menu.setCheckboxState('default_group', false);
						menu.setCheckboxState('last_selected_group', true);
						break;
					case 'edit':
						fvdSpeedDial.Dialogs.addGroup(groupId);
						break;
					case 'remove':
						fvdSpeedDial.SpeedDial.removeGroup(groupId, () => {
							fvdSpeedDial.SpeedDial.sheduleRebuildGroupsList();
						});
						break;
					case 'open_all':
						fvdSpeedDial.SpeedDial.openAllDialsInGrop(groupId);
						break;
					case 'manage':
						fvdSpeedDial.Dialogs.manageGroups();
						break;
					case 'refresh_all':
						fvdSpeedDial.SpeedDial.refreshAllDialsInGroup(fvdSpeedDial.SpeedDial.currentGroupId());
						break;
				}
			});
			that.rebuildSpeedDialGroupContextMenu();
			// SpeedDial cell menu
			that._speedDialCellMenu = new dhtmlXMenuObject();
			that._speedDialCellMenu.renderAsContextMenu();
			that._speedDialCellMenu.attachEvent('onContextMenu', function (x, elemId) {
				const elem = document.getElementById(elemId);

				if (!elem) {
					return false;
				}

				const dialId = fvdSpeedDial.SpeedDial._getDialIdByCell(elem);

				fvdSpeedDial.StorageSD.getDial(dialId, function (data) {
					fvdSpeedDial.StorageSD.groupsList(function (groups) {
						for (let i = 0; i != groups.length; i++) {
							that._speedDialCellMenu.setItemEnabled('move_to_gr_' + groups[i].id);
						}

						if (data.url.includes("kelkoogroup.net/permanentLinkGo")) {
							that._speedDialCellMenu.setItemDisabled('edit');
						} else {
							that._speedDialCellMenu.setItemEnabled('edit');
						}

						that._speedDialCellMenu.setItemDisabled('move_to_gr_' + data.group_id);

						if (data.thumb_source_type == 'screen') {
							that._speedDialCellMenu.setItemEnabled('refresh');
						} else {
							that._speedDialCellMenu.setItemDisabled('refresh');
						}
					});
				});
			});
			that._speedDialCellMenu.attachEvent('onclick', function (action, elemId) {
				const elem = document.getElementById(elemId);

				if (!elem) {
					return false;
				}

				const dialId = fvdSpeedDial.SpeedDial._getDialIdByCell(elem);

				switch (action) {
					case 'edit':
						fvdSpeedDial.StorageSD.getDial(dialId, function (data) {
							if (data == null) {
								return;
							}

							fvdSpeedDial.Dialogs.addDial(data);
						});
						break;
					case 'remove':
						var confirmResult = false;

						fvdSpeedDial.Utils.Async.chain([
							function (chainCallback) {
								if (!_b(fvdSpeedDial.Prefs.get('sd.display_dial_remove_dialog'))) {
									confirmResult = true;
									chainCallback();
								} else {
									fvdSpeedDial.Dialogs.confirmCheck(
										_('dlg_confirm_remove_dial_title'),
										_('dlg_confirm_remove_dial_text'),
										_('dlg_dont_show_it_again'),
										false,
										function (result, state) {
											confirmResult = result;

											if (confirmResult && state) {
												fvdSpeedDial.Prefs.set('sd.display_dial_remove_dialog', false);
											}

											chainCallback();
										}
									);
								}
							},
							function (chainCallback) {
								if (confirmResult) {
									fvdSpeedDial.Sync.addDataToSync(
										{
											category: 'deleteDials',
											data: dialId,
											translate: 'dial',
										},
										function () {
											const saveGlobalIdInTrash = function (globalId) {
												const currentUserInfo = fvdSpeedDial.localStorage.getItem(userStorageKey);
												const currentUserId = currentUserInfo?.user?.user_id;
												const trash = fvdSpeedDial.Prefs.get(DIALS_TRASH_KEY, {});
												const currentUserTrash = trash[currentUserId] || [];
												fvdSpeedDial.Prefs.set(DIALS_TRASH_KEY, {
													...trash,
													[currentUserId]: [...currentUserTrash, globalId],
												});
											};

											fvdSpeedDial.StorageSD.getDial(dialId, function (d) {
												saveGlobalIdInTrash(d.global_id);
											});

											fvdSpeedDial.StorageSD.deleteDial(dialId, function () {
												fvdSpeedDial.SpeedDial.dialRemoveAnimate(dialId);
											});
										}
									);
								}
							},
						]);
						break;
					case 'refresh':
						fvdSpeedDial.StorageSD.getDial(dialId, function (data) {
							if (data.get_screen_method == 'manual') {
								try {
									fvdSpeedDial.SpeedDial.makeThumb(
										data.id,
										data.url,
										'speeddial',
										data.screen_delay
									);
								} catch (ex) {
									console.warn(ex); 
								}
							} else {
								fvdSpeedDial.SpeedDial.ThumbManager.hiddenCaptureThumb({
									type: 'speeddial',
									data: {
										id: dialId,
									},
									elemId: elem.getAttribute('id'),
								});
							}
						});
						break;
					case 'copy_url':
						fvdSpeedDial.StorageSD.getDial(dialId, function (data) {
							if (data.url.includes("kelkoogroup.net/permanentLinkGo")) {
								fvdSpeedDial.Utils.copyToClipboard(data.display_url);
							} else {
								fvdSpeedDial.Utils.copyToClipboard(data.url);
							}
						});
						break;
					case 'open_tab':
						fvdSpeedDial.StorageSD.getDial(dialId, function (data) {
							fvdSpeedDial.Utils.Opener.currentTab(data.url);
						});
						break;
					case 'open_new_tab':
						fvdSpeedDial.StorageSD.getDial(dialId, function (data) {
							fvdSpeedDial.Utils.Opener.newTab(data.url);
						});
						break;
					case 'open_bg_tab':
						fvdSpeedDial.StorageSD.getDial(dialId, function (data) {
							fvdSpeedDial.Utils.Opener.backgroundTab(data.url);
						});
						break;
					case 'open_incognito_tab':
						fvdSpeedDial.StorageSD.getDial(dialId, function (data) {
							fvdSpeedDial.Utils.Opener.incognitoTab(data.url);
						});
						break;
				}

				if (action.indexOf('move_to_gr_') != -1) {
					const groupId = action.replace('move_to_gr_', '');
					let can = false;

					fvdSpeedDial.Utils.Async.chain([
						function (chainCallback) {
							fvdSpeedDial.StorageSD.groupCanSyncById(groupId, function (c) {
								can = c;

								if (!can) {
									fvdSpeedDial.Dialogs.moveDialToNoSyncGroupDialog(function (r) {
										if (r) {
											chainCallback();
										}
									});
								} else {
									chainCallback();
								}
							});
						},
						function () {
							fvdSpeedDial.SpeedDial.dialMoveToGroup(dialId, groupId);
						},
					]);
				}
			});
			that.rebuildSpeedDialCellMenu();
		}, 0);
	},
	assignToElem: function (elem, type) {
		let menu = null;

		switch (type) {
			case 'speeddial':
				menu = this._speedDialCellMenu;
				break;
			case 'speeddialGroup':
				menu = this._speedDialGroupContextMenu;
				break;
			case 'speeddialManageGroups':
				menu = this._speedDialGroupManageGroupsMenu;
				break;
			case 'mostvisited':
				menu = this._mostVisitedCellMenu;
				break;
			case 'mostvisitedGroupUrl':
				menu = this._mostVisitedInGroupUrlMenu;
				break;
			case 'recentlyclosed':
				menu = this._recentlyClosedCellMenu;
				break;
			case 'app':
				menu = this._appsCellMenu;
				break;
		}

		if (menu !== null) {
			menu.addContextZone(elem);
		}
	},
	setGlobalMenu: function (type) {
		let menu = null;

		switch (type) {
			case 'speeddial':
				menu = this._createSpeedDialGlobalMenu();
				break;
			case 'mostvisited':
				menu = this._createMostVisitedGlobalMenu();
				break;
			case 'recentlyclosed':
				menu = this._createRecentlyClosedGlobalMenu();
				break;
		}

		if (this._globalMenu != null) {
			this._globalMenu.unload();
		}

		if (menu != null) {
			menu.addContextZone(document.documentElement);
		}

		this._globalMenu = menu;
	},
	rebuildSpeedDialCellMenu: function (callback) {
		const that = this;

		fvdSpeedDial.StorageSD.groupsList(function (groups) {
			that._speedDialCellMenu.clearAll();
			that._speedDialCellMenu.addNewChild(
				that._speedDialCellMenu.topId,
				0,
				'open_tab',
				_('cm_speeddial_cell_open_tab'),
				false,
				false
			);
			that._speedDialCellMenu.addNewChild(
				that._speedDialCellMenu.topId,
				1,
				'open_new_tab',
				_('cm_speeddial_cell_open_new_tab'),
				false,
				false
			);
			that._speedDialCellMenu.addNewChild(
				that._speedDialCellMenu.topId,
				2,
				'open_bg_tab',
				_('cm_speeddial_cell_open_bg_tab'),
				false,
				false
			);
			that._speedDialCellMenu.addNewChild(
				that._speedDialCellMenu.topId,
				3,
				'open_incognito_tab',
				_('cm_speeddial_cell_open_incognito_tab'),
				false,
				false
			);
			that._speedDialCellMenu.addNewSeparator('open_incognito_tab', 'sep');
			that._speedDialCellMenu.addNewChild(
				that._speedDialCellMenu.topId,
				5,
				'refresh',
				_('cm_speeddial_cell_refresh'),
				false,
				false
			);
			//that._speedDialCellMenu.addNewChild(that._speedDialCellMenu.topId, 5, "manual_refresh", _("cm_speeddial_cell_refresh_manual"), false, false);
			that._speedDialCellMenu.addNewChild(
				that._speedDialCellMenu.topId,
				6,
				'edit',
				_('cm_speeddial_cell_edit'),
				false,
				false
			);
			that._speedDialCellMenu.addNewChild(
				that._speedDialCellMenu.topId,
				7,
				'remove',
				_('cm_speeddial_cell_remove'),
				false,
				false
			);
			that._speedDialCellMenu.addNewChild(
				that._speedDialCellMenu.topId,
				8,
				'copy_url',
				_('cm_speeddial_cell_copy_url'),
				false,
				false
			);
			that._speedDialCellMenu.addNewChild(
				that._speedDialCellMenu.topId,
				9,
				'move_to',
				_('cm_speeddial_cell_move_to'),
				false,
				false
			);
			for (let i = 0; i != groups.length; i++) {
				if (groups[i].name.length > 55) {
					var name = groups[i].name.substr(0, 53) + '...';
				} else {
					var name = groups[i].name;
				}

				that._speedDialCellMenu.addNewChild(
					'move_to',
					i,
					'move_to_gr_' + groups[i].id,
					name,
					false,
					false
				);
			}

			if (callback) {
				callback();
			}
		});
	},
	rebuildSpeedDialGroupManageGroupsMenu: function () {
		const menu = this._speedDialGroupManageGroupsMenu;

		menu.clearAll();
		menu.addNewChild(menu.topId, 0, 'edit', _('cm_speeddial_group_edit'), false, false);
		menu.addCheckbox(
			'sibling',
			'edit',
			null,
			'default_group',
			_('cm_speeddial_group_default'),
			false,
			false
		);
		menu.addNewChild(menu.topId, 2, 'remove', _('cm_speeddial_group_remove'), false, false);
	},
	rebuildSpeedDialGroupContextMenu: function (callback) {
		const menu = this._speedDialGroupContextMenu;

		menu.clearAll();
		menu.addNewChild(menu.topId, 0, 'edit', _('cm_speeddial_group_edit'), false, false);
		menu.addCheckbox(
			'sibling',
			'edit',
			null,
			'default_group',
			_('cm_speeddial_group_default'),
			false,
			false
		);
		menu.addCheckbox(
			'sibling',
			'default_group',
			null,
			'last_selected_group',
			_('newtab_last_used_group'),
			false,
			false
		);
		//menu.addCheckbox("sibling", "last_selected_group", null, "sync_group", _("cm_speeddial_group_sync_this_group"), false, false);
		menu.addNewChild(menu.topId, 4, 'remove', _('cm_speeddial_group_remove'), false, false);
		menu.addNewChild(menu.topId, 5, 'open_all', _('cm_speeddial_group_open_all'), false, false);
		menu.addNewChild(menu.topId, 6, 'manage', _('cm_speeddial_group_manage'), false, false);
		menu.addNewChild(menu.topId, 7, 'refresh_all', _('cm_refresh_all'), false, false);
		menu.addNewSeparator('remove', 'sep');
	},
	rebuildMostVisitedInGroupUrlMenu: function () {
		const menu = this._mostVisitedInGroupUrlMenu;

		menu.clearAll();
		menu.addNewChild(menu.topId, 0, 'open_tab', _('cm_speeddial_cell_open_tab'), false, false);
		menu.addNewChild(
			menu.topId,
			1,
			'open_new_tab',
			_('cm_speeddial_cell_open_new_tab'),
			false,
			false
		);
		menu.addNewChild(
			menu.topId,
			2,
			'open_bg_tab',
			_('cm_speeddial_cell_open_bg_tab'),
			false,
			false
		);
		menu.addNewChild(menu.topId, 3, 'remove', _('cm_speeddial_cell_remove'), false, false);
		menu.addNewChild(
			menu.topId,
			4,
			'add_to_speeddial',
			_('cm_mostvisited_cell_add_to_speeddial'),
			false,
			'/images/icons/16x16.png'
		);
		menu.addNewChild(menu.topId, 5, 'block', _('cm_mostvisited_cell_block'), false, false);
		menu.addNewChild(menu.topId, 6, 'copy_url', _('cm_speeddial_cell_copy_url'), false, false);
		menu.addNewSeparator('open_bg_tab', 'sep');
	},
	rebuildRecentlyClosedCellMenu: function () {
		const menu = this._recentlyClosedCellMenu;

		menu.clearAll();
		menu.addNewChild(menu.topId, 0, 'open_tab', _('cm_speeddial_cell_open_tab'), false, false);
		menu.addNewChild(
			menu.topId,
			1,
			'open_new_tab',
			_('cm_speeddial_cell_open_new_tab'),
			false,
			false
		);
		menu.addNewChild(
			menu.topId,
			2,
			'open_bg_tab',
			_('cm_speeddial_cell_open_bg_tab'),
			false,
			false
		);
		menu.addNewChild(
			menu.topId,
			3,
			'open_incognito_tab',
			_('cm_speeddial_cell_open_incognito_tab'),
			false,
			false
		);
		menu.addNewSeparator('open_incognito_tab', 'sep');
		menu.addNewChild(
			menu.topId,
			5,
			'add_to_speeddial',
			_('cm_mostvisited_cell_add_to_speeddial'),
			false,
			'/images/icons/16x16.png'
		);
		menu.addNewChild(menu.topId, 6, 'remove', _('cm_speeddial_cell_remove'), false, false);
		menu.addNewChild(menu.topId, 7, 'block', _('cm_mostvisited_cell_block'), false, false);
		menu.addNewChild(menu.topId, 8, 'copy_url', _('cm_speeddial_cell_copy_url'), false, false);
	},
	rebuildMostVisitedCellMenu: function () {
		const menu = this._mostVisitedCellMenu;

		menu.clearAll();
		menu.addNewChild(menu.topId, 0, 'open_tab', _('cm_speeddial_cell_open_tab'), false, false);
		menu.addNewChild(
			menu.topId,
			1,
			'open_new_tab',
			_('cm_speeddial_cell_open_new_tab'),
			false,
			false
		);
		menu.addNewChild(
			menu.topId,
			2,
			'open_bg_tab',
			_('cm_speeddial_cell_open_bg_tab'),
			false,
			false
		);
		menu.addNewChild(
			menu.topId,
			3,
			'open_incognito_tab',
			_('cm_speeddial_cell_open_incognito_tab'),
			false,
			false
		);
		menu.addNewSeparator('open_incognito_tab', 'sep');
		menu.addNewChild(menu.topId, 5, 'refresh', _('cm_speeddial_cell_refresh'), false, false);
		//menu.addNewChild(menu.topId, 5, "manual_refresh", _("cm_speeddial_cell_refresh_manual"), false, false);
		menu.addNewChild(
			menu.topId,
			6,
			'add_to_speeddial',
			_('cm_mostvisited_cell_add_to_speeddial'),
			false,
			'/images/icons/16x16.png'
		);
		menu.addNewChild(menu.topId, 7, 'edit', _('cm_speeddial_cell_edit'), false, false);
		menu.addNewChild(menu.topId, 8, 'remove', _('cm_speeddial_cell_remove'), false, false);
		menu.addNewChild(menu.topId, 9, 'block', _('cm_mostvisited_cell_block'), false, false);
		menu.addNewChild(menu.topId, 10, 'copy_url', _('cm_speeddial_cell_copy_url'), false, false);
	},
	rebuildAppsCellMenu: function () {
		const menu = this._appsCellMenu;

		menu.clearAll();
		menu.addNewChild(menu.topId, 0, 'open', _('cm_apps_open'), false, false);
		menu.addNewChild(menu.topId, 1, 'remove', _('cm_apps_remove'), false, false);
	},
	_createRecentlyClosedGlobalMenu: function () {
		const menu = new dhtmlXMenuObject();

		menu.renderAsContextMenu();
		menu.addNewChild(menu.topId, 0, 'open_all', _('cm_speeddial_global_open_all'), false, false);
		menu.addNewChild(menu.topId, 1, 'style', _('cm_speeddial_global_style'), false, false);
		menu.addRadioButton(
			'child',
			'style',
			0,
			'style_fancy',
			_('cm_speeddial_global_style_fancy'),
			'style',
			false,
			false
		);
		menu.addRadioButton(
			'child',
			'style',
			1,
			'style_standard',
			_('cm_speeddial_global_style_standard'),
			'style',
			false,
			false
		);
		function rebuildColumns() {
			try {
				menu.removeItem('number_of_columns');
			} catch (ex) {
				console.warn(ex); 
			}
			let columnsAuto = fvdSpeedDial.SpeedDial.cellsInRowMax('auto');
			let title = null;

			if (columnsAuto.rows) {
				columnsAuto = columnsAuto.rows;
				title = _('cm_speeddial_global_number_of_rows');
			} else if (columnsAuto.cols) {
				columnsAuto = columnsAuto.cols;
				title = _('cm_speeddial_global_number_of_columns');
			}

			menu.addNewChild(menu.topId, 1, 'number_of_columns', title, false, false);
			const preValue = fvdSpeedDial.Prefs.get('sd.recentlyclosed_columns');
			let numOfColumns = columnsAuto;

			if (preValue != 'auto') {
				if (preValue > columnsAuto || isNaN(numOfColumns)) {
					numOfColumns = preValue;
				}
			}

			menu.addRadioButton(
				'child',
				'number_of_columns',
				0,
				'columns_auto',
				_('newtab_columns_auto'),
				'number_of_columns',
				false,
				false
			);
			for (let columnNum = 1; columnNum <= numOfColumns; columnNum++) {
				menu.addRadioButton(
					'child',
					'number_of_columns',
					columnNum,
					'columns_' + columnNum,
					columnNum,
					'number_of_columns',
					false,
					false
				);
			}
			menu.setRadioChecked('number_of_columns', 'columns_' + preValue);
		}
		menu.attachEvent('onContextMenu', function () {
			rebuildColumns();

			if (fvdSpeedDial.PowerOffClient.isHidden()) {
				menu.hide();
			}

			const checkId = 'style_' + fvdSpeedDial.Prefs.get('sd.display_mode');

			menu.setRadioChecked('style', checkId);
		});
		menu.attachEvent('onClick', function (action) {
			if (action.indexOf('columns_') == 0) {
				const columns = action.replace('columns_', '');

				fvdSpeedDial.Prefs.set('sd.recentlyclosed_columns', columns);
				return;
			} else if (action.indexOf('style') == 0) {
				const style = action.replace('style_', '');

				fvdSpeedDial.Prefs.set(
					'sd.display_dial_background_color',
					style == 'fancy' ? 'dark' : 'white'
				);
				fvdSpeedDial.Prefs.set('sd.display_mode', style);
			} else if (action == 'open_all') {
				fvdSpeedDial.SpeedDial.openAllCurrentRecentlyClosedLinks();
			}
		});
		return menu;
	},
	_createMostVisitedGlobalMenu: function () {
		const { fvdSpeedDial } = this;
		const menu = new dhtmlXMenuObject();

		menu.renderAsContextMenu();
		menu.addNewChild(menu.topId, 0, 'open_all', _('cm_speeddial_global_open_all'), false, false);
		menu.addNewChild(menu.topId, 1, 'style', _('cm_speeddial_global_style'), false, false);
		menu.addNewChild(menu.topId, 2, 'view', _('cm_speeddial_global_view'), false, false);
		menu.addRadioButton(
			'child',
			'style',
			0,
			'style_fancy',
			_('cm_speeddial_global_style_fancy'),
			'style',
			false,
			false
		);
		menu.addRadioButton(
			'child',
			'style',
			1,
			'style_standard',
			_('cm_speeddial_global_style_standard'),
			'style',
			false,
			false
		);
		const currentCellSize = fvdSpeedDial.SpeedDial._currentCellSize();

		menu.addRadioButton(
			'child',
			'view',
			0,
			'view_list',
			_('cm_speeddial_global_view_list'),
			'view',
			false,
			false
		);
		menu.addRadioButton(
			'child',
			'view',
			1,
			'view_custom',
			_('cm_speeddial_global_preview')
				+ ' ( '
				+ currentCellSize.width
				+ 'x'
				+ currentCellSize.height
				+ ' )',
			'view',
			false,
			false
		);
		menu.addNewChild(
			'view',
			2,
			'view_dial_size',
			_('cm_speeddial_global_change_size'),
			false,
			false
		);
		menu.addNewChild(menu.topId, 3, 'scroll_type', _('cm_scrolling_type'), false, false);
		menu.addRadioButton(
			'child',
			'scroll_type',
			0,
			'scroll_type_vertical',
			_('options_scrolling_vertical'),
			'scroll_type',
			false,
			false
		);
		menu.addRadioButton(
			'child',
			'scroll_type',
			1,
			'scroll_type_horizontal',
			_('options_scrolling_horizontal'),
			'scroll_type',
			false,
			false
		);
		menu.addNewSeparator('open_all', 'sep');
		function rebuildColumns() {
			try {
				menu.removeItem('number_of_columns');
			} catch (ex) {
				console.warn(ex); 
			}
			let columnsAuto = fvdSpeedDial.SpeedDial.cellsInRowMax('auto');
			let title = null;

			if (columnsAuto.rows) {
				columnsAuto = columnsAuto.rows;
				title = _('cm_speeddial_global_number_of_rows');
			} else if (columnsAuto.cols) {
				columnsAuto = columnsAuto.cols;
				title = _('cm_speeddial_global_number_of_columns');
			}

			menu.addNewChild(menu.topId, 5, 'number_of_columns', title, false, false);
			const preValue = fvdSpeedDial.Prefs.get('sd.most_visited_columns');
			let numOfColumns = columnsAuto;

			if (preValue != 'auto') {
				if (preValue > columnsAuto || isNaN(numOfColumns)) {
					numOfColumns = preValue;
				}
			}

			menu.addRadioButton(
				'child',
				'number_of_columns',
				0,
				'columns_auto',
				_('newtab_columns_auto'),
				'number_of_columns',
				false,
				false
			);
			for (let columnNum = 1; columnNum <= numOfColumns; columnNum++) {
				menu.addRadioButton(
					'child',
					'number_of_columns',
					columnNum,
					'columns_' + columnNum,
					columnNum,
					'number_of_columns',
					false,
					false
				);
			}
			menu.setRadioChecked('number_of_columns', 'columns_' + preValue);
		}
		function onContextMenu() {
			rebuildColumns();
			let checkId = 'view_' + fvdSpeedDial.SpeedDial.currentThumbsMode();

			menu.setRadioChecked('view', checkId);
			checkId = 'style_' + fvdSpeedDial.Prefs.get('sd.display_mode');
			menu.setRadioChecked('style', checkId);
			checkId = 'scroll_type_' + fvdSpeedDial.Prefs.get('sd.scrolling');
			menu.setRadioChecked('scroll_type', checkId);

			if (
				fvdSpeedDial.Prefs.get('sd.display_mode') == 'fancy'
				|| fvdSpeedDial.SpeedDial.currentThumbsMode() == 'list'
			) {
				menu.setItemDisabled('scroll_type');
			} else {
				menu.setItemEnabled('scroll_type');
			}

			if (fvdSpeedDial.PowerOffClient.isHidden()) {
				menu.hide();
			}
		}
		menu.attachEvent('onContextMenu', onContextMenu);
		menu.attachEvent('onClick', function (action) {
			let callOnContextMenu = true;

			if (action.indexOf('view') == 0) {
				if (action == 'view_dial_size') {
					fvdSpeedDial.SpeedDial.openSizeSetup();
				} else {
					const thumbsMode = action.replace('view_', '');

					fvdSpeedDial.SpeedDial.setCurrentThumbsMode(thumbsMode);
					rebuildColumns();
				}
			} else if (action.indexOf('style') == 0) {
				const style = action.replace('style_', '');

				fvdSpeedDial.Prefs.set(
					'sd.display_dial_background_color',
					style == 'fancy' ? 'dark' : 'white'
				);
				fvdSpeedDial.Prefs.set('sd.display_mode', style);
				menu.setItemDisabled('style_fancy');
				menu.setItemDisabled('style_standard');
				setTimeout(function () {
					menu.setItemEnabled('style_fancy');
					menu.setItemEnabled('style_standard');
				}, 1000);
			} else if (action.indexOf('columns_') == 0) {
				const columns = action.replace('columns_', '');

				fvdSpeedDial.Prefs.set('sd.most_visited_columns', columns);
				callOnContextMenu = false;
			} else if (action.indexOf('scroll_type_') == 0) {
				const newScrollType = action.replace('scroll_type_', '');

				fvdSpeedDial.Prefs.set('sd.scrolling', newScrollType);
			} else if (action == 'open_all') {
				fvdSpeedDial.SpeedDial.openAllCurrentMostVisitedLinks();
			}

			if (callOnContextMenu) {
				onContextMenu();
			}
		});
		return menu;
	},
	_createSpeedDialGlobalMenu: function () {
		const { fvdSpeedDial } = this;
		const { Prefs } = fvdSpeedDial;
		const menu = new dhtmlXMenuObject();

		menu.renderAsContextMenu();
		menu.addNewChild(
			menu.topId,
			0,
			'add_dial',
			_('cm_speeddial_global_add_dial'),
			false,
			'/images/newtab/contextmenu/plus.png'
		);
		menu.addNewChild(menu.topId, 1, 'open_all', _('cm_speeddial_global_open_all'), false, false);
		menu.addNewChild(menu.topId, 2, 'style', _('cm_speeddial_global_style'), false, false);
		const currentCellSize = fvdSpeedDial.SpeedDial._currentCellSize();

		menu.addNewChild(menu.topId, 3, 'view', _('cm_speeddial_global_view'), false, false);
		menu.addRadioButton(
			'child',
			'style',
			0,
			'style_fancy',
			_('cm_speeddial_global_style_fancy'),
			'style',
			false,
			false
		);
		menu.addRadioButton(
			'child',
			'style',
			1,
			'style_standard',
			_('cm_speeddial_global_style_standard'),
			'style',
			false,
			false
		);
		menu.addRadioButton(
			'child',
			'view',
			0,
			'view_list',
			_('cm_speeddial_global_view_list'),
			'view',
			false,
			false
		);
		menu.addRadioButton(
			'child',
			'view',
			1,
			'view_custom',
			_('cm_speeddial_global_preview')
				+ ' ( '
				+ currentCellSize.width
				+ 'x'
				+ currentCellSize.height
				+ ' )',
			'view',
			false,
			false
		);
		menu.addNewChild(
			'view',
			2,
			'view_dial_size',
			_('cm_speeddial_global_change_size'),
			false,
			false
		);
		menu.addNewChild(menu.topId, 4, 'scroll_type', _('cm_scrolling_type'), false, false);
		menu.addRadioButton(
			'child',
			'scroll_type',
			0,
			'scroll_type_vertical',
			_('options_scrolling_vertical'),
			'scroll_type',
			false,
			false
		);
		menu.addRadioButton(
			'child',
			'scroll_type',
			1,
			'scroll_type_horizontal',
			_('options_scrolling_horizontal'),
			'scroll_type',
			false,
			false
		);
		menu.addNewChild(menu.topId, 5, 'refresh_all', _('cm_refresh_all'), false, false);
		menu.addNewSeparator('add_dial', 'sep');
		function rebuildColumns() {
			try {
				menu.removeItem('number_of_columns');
			} catch (ex) {
				console.warn(ex); 
			}
			let columnsAuto = fvdSpeedDial.SpeedDial.cellsInRowMax('auto');
			let title = null;

			if (columnsAuto.rows) {
				columnsAuto = columnsAuto.rows;
				title = _('cm_speeddial_global_number_of_rows');
			} else if (columnsAuto.cols) {
				columnsAuto = columnsAuto.cols;
				title = _('cm_speeddial_global_number_of_columns');
			}

			menu.addNewChild(menu.topId, 4, 'number_of_columns', title, false, false);
			const preValue = fvdSpeedDial.Prefs.get('sd.top_sites_columns');
			let numOfColumns = columnsAuto;

			if (preValue != 'auto') {
				if (preValue > columnsAuto || isNaN(numOfColumns)) {
					numOfColumns = preValue;
				}
			}

			menu.addRadioButton(
				'child',
				'number_of_columns',
				0,
				'columns_auto',
				_('newtab_columns_auto'),
				'number_of_columns',
				false,
				false
			);
			for (let columnNum = 1; columnNum <= numOfColumns; columnNum++) {
				menu.addRadioButton(
					'child',
					'number_of_columns',
					columnNum,
					'columns_' + columnNum,
					columnNum,
					'number_of_columns',
					false,
					false
				);
			}
			menu.setRadioChecked('number_of_columns', 'columns_' + preValue);
		}
		function onContextMenu() {
			// need to build number of columns menu
			rebuildColumns();
			let checkId = 'view_' + fvdSpeedDial.SpeedDial.currentThumbsMode();

			menu.setRadioChecked('view', checkId);
			checkId = 'style_' + fvdSpeedDial.Prefs.get('sd.display_mode');
			menu.setRadioChecked('style', checkId);
			checkId = 'scroll_type_' + fvdSpeedDial.Prefs.get('sd.scrolling');
			menu.setRadioChecked('scroll_type', checkId);

			if (
				fvdSpeedDial.Prefs.get('sd.display_mode') == 'fancy'
				|| fvdSpeedDial.SpeedDial.currentThumbsMode() == 'list'
			) {
				menu.setItemDisabled('scroll_type');
			} else {
				menu.setItemEnabled('scroll_type');
			}

			if (fvdSpeedDial.PowerOffClient.isHidden()) {
				menu.hide();
			}
		}

		menu.attachEvent('onContextMenu', onContextMenu);
		menu.attachEvent('onClick', function (action) {
			let callOnContextMenu = true;

			if (action.indexOf('view') === 0) {
				if (action === 'view_dial_size') {
					fvdSpeedDial.SpeedDial.openSizeSetup();
				} else {
					const thumbsMode = action.replace('view_', '');

					fvdSpeedDial.SpeedDial.setCurrentThumbsMode(thumbsMode);
					rebuildColumns();
				}
			} else if (action.indexOf('style') === 0) {
				menu.setItemDisabled('style_fancy');
				menu.setItemDisabled('style_standard');
				setTimeout(function () {
					menu.setItemEnabled('style_fancy');
					menu.setItemEnabled('style_standard');
				}, 1000);
				const style = action.replace('style_', '');

				Prefs.set('sd.display_dial_background_color', style === 'fancy' ? 'dark' : 'white');
				Prefs.set('sd.display_mode', style);
			} else if (action.indexOf('columns_') === 0) {
				const columns = action.replace('columns_', '');

				Prefs.set('sd.top_sites_columns', columns);
				callOnContextMenu = false;
			} else if (action.indexOf('scroll_type_') === 0) {
				const newScrollType = action.replace('scroll_type_', '');

				Prefs.set('sd.scrolling', newScrollType);
			}

			switch (action) {
				case 'add_dial':
					fvdSpeedDial.Dialogs.addDial();
					break;
				case 'open_all':
					fvdSpeedDial.SpeedDial.openAllDialsInGrop(fvdSpeedDial.SpeedDial.currentGroupId());
					break;
				case 'refresh_all':
					fvdSpeedDial.SpeedDial.refreshAllDialsInGroup(fvdSpeedDial.SpeedDial.currentGroupId());
					break;
			}

			if (callOnContextMenu) {
				onContextMenu();
			}
		});
		return menu;
	},
};
export default ContextMenus;
