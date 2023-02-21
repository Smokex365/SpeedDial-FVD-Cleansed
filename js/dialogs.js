import Dialog from './newtab/dialogs/simple-dialog.js';
import { _b, Utils } from './utils.js';
import { _ } from './localizer.js';
import importTranslate from './importtranslators.js';
import ToolTip from './tooltip.js';
import Config from './config.js';
import DialSearch from './newtab/searchoverlay.js';
import DragLists from './newtab/draglists.js';
import HistoryComplete from './historycomplete.js';

const ManageGroupsModule = function (fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;
	this.newIdNum = 0;
	this.buildGroupItem = function (dbGroup) {
		const {
			fvdSpeedDial: { ContextMenus, Dialogs },
		} = this;
		const group = document.createElement('div');
		const textDiv = document.createElement('div');
		const spanName = document.createElement('span');
		spanName.className = 'groupName';
		spanName.textContent = dbGroup.name;
		const spanCount = document.createElement('span');
		spanCount.className = 'groupDialsCount';
		spanCount.textContent = ' (' + dbGroup.count_dials + ')';
		textDiv.appendChild(spanName);
		textDiv.appendChild(spanCount);
		textDiv.className = 'text';
		group.appendChild(textDiv);
		const divIcons = document.createElement('div');
		divIcons.className = 'icons';
		const iconRemove = document.createElement('div');
		iconRemove.className = 'iconRemove';
		const iconEdit = document.createElement('div');
		iconEdit.className = 'iconEdit';
		divIcons.appendChild(iconRemove);
		divIcons.appendChild(iconEdit);
		group.appendChild(divIcons);
		(function (group, dbGroup) {
			iconRemove.addEventListener(
				'mousedown',
				function (event) {
					Dialogs.ManageGroups.removeFromList(group);
					event.stopPropagation();
				},
				false
			);
			iconEdit.addEventListener(
				'mousedown',
				function (event) {
					Dialogs.ManageGroups.editGroupById(dbGroup.id);
					event.stopPropagation();
				},
				false
			);
		})(group, dbGroup);
		group.id = 'group_' + dbGroup.id;
		group.setAttribute('sync', dbGroup.sync);
		group.className = 'group';
		ContextMenus.assignToElem(group, 'speeddialManageGroups');
		return group;
	};
	this.addGroup = function () {
		const {
			fvdSpeedDial: { Dialogs },
		} = this;
		const currentGroups = Dialogs.ManageGroups.currentGroupsList();
		const groupsNames = [];
		for (let i = 0; i !== currentGroups.length; i++) {
			groupsNames.push(currentGroups[i].name);
		}
		Dialogs.addGroup(null, {
			commitToCallback: function (dialogResult) {
				if (dialogResult.result) {
					Dialogs.ManageGroups.addGroupToList(dialogResult.data);
				}
			},
			existsGroupsNames: groupsNames,
		});
	};
	this.addGroupToList = function (dbGroup) {
		this.newIdNum++;
		dbGroup.count_dials = 0;
		dbGroup.id = 'new_' + this.newIdNum;
		const group = this.buildGroupItem(dbGroup);
		const container = document.getElementById('dialogManageGroups_groupsList');

		if (dbGroup.addPosition === 'top' && container.firstChild) {
			container.insertBefore(group, container.firstChild);
		} else {
			container.appendChild(group);
		}

		this.refreshGroupsListDrag();
	};
	this.refreshGroupsListDrag = function () {
		const container = document.getElementById('dialogManageGroups_groupsList');
		const items = [];
		const els = document.querySelectorAll('#dialogManageGroups_groupsList .group');
		for (let i = 0; i !== els.length; i++) {
			const el = els[i];
			items.push(el);
		}
		DragLists.startDragFor(container, items, null, 'group');
	};
	this.editGroupById = function (groupId) {
		const {
			fvdSpeedDial: { Dialogs },
		} = this;
		const currentGroups = Dialogs.ManageGroups.currentGroupsList();
		const groupsNames = [];
		let initData = {};
		for (let i = 0; i !== currentGroups.length; i++) {
			if (currentGroups[i].id !== groupId) {
				groupsNames.push(currentGroups[i].name);
			} else {
				initData = currentGroups[i];
			}
		}
		Dialogs.addGroup(groupId, {
			commitToCallback: function (dialogResult) {
				if (dialogResult.result) {
					Dialogs.ManageGroups.setGroup(groupId, dialogResult.data);
				}
			},
			existsGroupsNames: groupsNames,
			initData: initData,
		});
	};
	this.setGroup = function (groupId, group) {
		const groupElem = document.getElementById('group_' + groupId);
		const spanName = groupElem.getElementsByClassName('groupName')[0];
		spanName.textContent = group.name;
		groupElem.setAttribute('sync', group.sync);
	};
	this.removeFromList = function (group) {
		const {
			fvdSpeedDial: { StorageSD, Dialogs },
		} = this;
		const groups = group.parentNode.getElementsByClassName('group');
		
		if (groups.length === 1) {
			Dialogs.alert(
				_('dlg_alert_cannot_remove_group_title'),
				_('dlg_alert_cannot_remove_group_text')
			);
			return false;
		}

		function hide() {
			group.style.webkitTransitionDuration = '200ms';
			group.style.webkitTransitionProperty = 'opacity';
			group.style.opacity = 0;
			group.addEventListener(
				'webkitTransitionEnd',
				function (event) {
					group.parentNode.removeChild(group);
				},
				false
			);
		}
		const groupId = group.getAttribute('id').replace('group_', '');
		StorageSD.getGroup(groupId, function (group) {
			if (group !== null) {
				if (group.count_dials === 0) {
					hide();
				} else {
					Dialogs.confirm(
						_('dlg_confirm_remove_group_title'),
						_('dlg_confirm_remove_group_text').replace('%count%', group.count_dials),
						function (result) {
							if (result) {
								hide();
							}
						}
					);
				}
			} else {
				hide();
			}
		});
	};
	this.currentGroupsList = function () {
		const groups = [];
		const groupsIds = [];
		// first get list of groups
		const elems = document
			.getElementById('dialogManageGroups_groupsList')
			.getElementsByClassName('group');
		for (let i = 0; i !== elems.length; i++) {
			const id = elems[i].getAttribute('id').replace('group_', '');

			if (groupsIds.indexOf(String(id)) !== -1) continue;
			else groupsIds.push(String(id));

			const name = elems[i].getElementsByClassName('groupName')[0].textContent;
			const position = i + 1;
			groups.push({
				id: id,
				name: name,
				position: position,
				sync: elems[i].getAttribute('sync'),
			});
		}
		return groups;
	};
};
const DialogsModule = function (fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;
	this.ManageGroups = new ManageGroupsModule(fvdSpeedDial);
};
DialogsModule.prototype = {
	LOCAL_FILE_URL: '<customFile>',
	_erroredFields: [],
	// default dialogs
	alert: function (title, text, callback, param) {
		const btns = {};

		if (typeof param !== 'object') param = { param: param || false };

		if (param.btns) {
			for (const i in param.btns)
				btns[i] = function () {
					param.btns[i](dlg);
				};
		}

		btns[param.ok ? param.ok : _('dlg_alert_ok')] = function () {
			dlg.close();

			if (callback) {
				callback();
			}
		};
		const dlg = new Dialog({
			width: 400,
			title: title,
			content: text,
			buttons: btns,
		});
	},
	alertCheck: function (title, text, cbText, cbInitState, callback, params) {
		const {
			fvdSpeedDial: { Templates },
		} = this;
		const btns = {};
		btns[_('dlg_alert_ok')] = function () {
			dlg.close();

			if (callback) {
				callback(document.getElementById('dialogAlertCheck_checkbox').checked);
			}
		};
		const dlg = new Dialog({
			className: 'alertDialog',
			width: params.width,
			title: title,
			content: Templates.getHTML('prototype_dialogAlertCheck'),
			buttons: btns,
			onShow: function () {
				document.getElementById('dialogAlertCheck_text').innerHTML = text;
				document.getElementById('dialogAlertCheck_checkBoxLabel').innerHTML = cbText;
				document.getElementById('dialogAlertCheck_checkbox').checked = cbInitState;
			},
		});
		params = params || {};
		params.width = params.width || 400;

		if (document.getElementById('dialogAlertCheck_text')) {
			return;
		}
	},
	confirmCheck: function (title, text, cbText, cbInitState, callback) {
		const {
			fvdSpeedDial: { Templates },
		} = this;

		if (document.getElementById('dialogAlertCheck_text')) {
			return;
		}

		const btns = {};
		btns[_('dlg_confirm_ok')] = function () {
			dlg.close();

			if (callback) {
				callback(true, document.getElementById('dialogAlertCheck_checkbox').checked);
			}
		};
		btns[_('dlg_confirm_cancel')] = function () {
			dlg.close();

			if (callback) {
				callback(false, document.getElementById('dialogAlertCheck_checkbox').checked);
			}
		};

		const dlg = new Dialog({
			className: 'alertDialog',
			width: 400,
			title: title,
			content: Templates.getHTML('prototype_dialogAlertCheck'),
			buttons: btns,
			onShow: function () {
				document.getElementById('dialogAlertCheck_text').innerHTML = text;
				document.getElementById('dialogAlertCheck_checkBoxLabel').innerHTML = cbText;
				document.getElementById('dialogAlertCheck_checkbox').checked = cbInitState;
			},
		});
	},
	confirm: function (title, text, callback) {
		const btns = {};
		btns[_('dlg_confirm_ok')] = function () {
			dlg.close();
			callback(true);
		};
		btns[_('dlg_confirm_cancel')] = function () {
			dlg.close();
			callback(false);
		};
		const dlg = new Dialog({
			width: 400,
			enterOnButton: _('dlg_confirm_ok'),
			title: title,
			content: text,
			buttons: btns,
		});
	},
	initPrototypes: function () {},
	errorToField: function (field, print, errorMessage) {
		let dialogErrorBox = document.getElementById('dialogErrorBox');

		if (!dialogErrorBox) {
			dialogErrorBox = document.createElement('div');
			dialogErrorBox.className = 'dialog-errorBox';
			dialogErrorBox.setAttribute('id', 'dialogErrorBox');
			const span = document.createElement('div');
			dialogErrorBox.appendChild(span);
			print.appendChild(dialogErrorBox);
		}

		field.setAttribute('error', '1');
		this._erroredFields.push(field);
		const span = dialogErrorBox.getElementsByTagName('div')[0];
		span.textContent = errorMessage;
		const pos = Utils.getOffset(field);
		dialogErrorBox.style.left = pos.left + 'px';
		dialogErrorBox.style.top = pos.top - 1 + field.offsetHeight + 'px';
		dialogErrorBox.style.width = field.offsetWidth - 2 + 'px';
		dialogErrorBox.setAttribute('active', 1);
	},
	hideErrorBox: function () {
		try {
			const dialogErrorBox = document.getElementById('dialogErrorBox');

			if (dialogErrorBox) {
				dialogErrorBox.setAttribute('active', 0);
			}

			for (let i = 0; i !== this._erroredFields.length; i++) {
				this._erroredFields[i].setAttribute('error', 0);
			}
		} catch (ex) {
			console.warn(ex);
		}
	},
	PicsUserPics: {
		SDPREVIEW_URL_PREFIX: 'https://everhelper.me/sdpreviews',
		currentXHR: [],
		buildElem: function (preview, callbacks, dlg) {
			let resultCallback = callbacks.resultCallback;
			const _report = callbacks._report;
			const previewElem = document.createElement('div');
			previewElem.className = 'item';
			const img = document.createElement('div');
			img.className = 'preview';
			//            img.setAttribute("src", preview.url);
			const tmpImg = new Image();
			tmpImg.onload = function () {
				try {
					img.style.background = 'url("' + preview.url + '") no-repeat center center ';

					if (tmpImg.width > img.offsetWidth || tmpImg.height > img.offsetHeight) {
						img.style.backgroundSize = 'contain';
					}
				} catch (ex) {
					console.warn(ex);
				}
			};
			tmpImg.src = preview.url;
			const report = document.createElement('div');
			report.className = 'report';
			report.setAttribute('title', _('dialog_pick_user_pics_report'));

			if (_report) {
				previewElem.appendChild(report);
			}

			const reportContainer = document.createElement('div');
			reportContainer.className = 'reportContainer';
			const buttonInappropriate = document.createElement('button');
			const buttonDuplicate = document.createElement('button');
			buttonInappropriate.className = 'fvdButton inappropriate';
			buttonDuplicate.className = 'fvdButton duplicate';
			buttonInappropriate.textContent = _('dialog_pick_user_pics_report_innop');
			buttonDuplicate.textContent = _('dialog_pick_user_pics_report_duplicate');
			const closeReport = document.createElement('div');
			closeReport.className = 'close';
			reportContainer.appendChild(buttonInappropriate);
			//reportContainer.appendChild( buttonDuplicate );
			reportContainer.appendChild(closeReport);
			const thankYouReport = document.createElement('div');
			thankYouReport.textContent = _('dialog_pick_user_pics_report_thanks');
			thankYouReport.className = 'thanks';
			reportContainer.appendChild(thankYouReport);
			previewElem.appendChild(img);
			previewElem.appendChild(reportContainer);
			closeReport.addEventListener('click', function (event) {
				previewElem.removeAttribute('report');
				event.stopPropagation();
			});
			report.addEventListener('click', function (e) {
				previewElem.setAttribute('report', 1);
				e.stopPropagation();
			});
			previewElem.addEventListener(
				'click',
				function () {
					resultCallback(preview);
					resultCallback = null;

					if (dlg) {
						dlg.close();
					}
				},
				false
			);
			function _okReport() {
				setTimeout(function () {
					previewElem.removeAttribute('report');
					setTimeout(function () {
						reportContainer.removeAttribute('thanks');
					}, 500);
				}, 1000);
			}
			reportContainer.addEventListener(
				'click',
				function (event) {
					event.stopPropagation();
				},
				false
			);
			buttonInappropriate.addEventListener('click', function () {
				_report(preview.id, 'inappropriate', function () {
					reportContainer.setAttribute('thanks', 1);
					_okReport();
				});
			});
			buttonDuplicate.addEventListener('click', function () {
				_report(preview.id, 'duplicate', function () {
					reportContainer.setAttribute('thanks', 1);
					_okReport();
				});
			});
			setTimeout(function () {
				previewElem.setAttribute('appear', 1);
			}, 0);
			return previewElem;
		},
		rate: function (sdPreviewId, callback) {
			callback = callback || function () {};
			this.request(
				'rating.php',
				{
					sdpreview_id: sdPreviewId,
				},
				callback
			);
		},
		cancelCurrentRequests: function () {
			this.currentXHR.forEach(function (xhr) {
				xhr.abort();
			});
			this.currentXHR = [];
		},
		request: function (file, params, callback) {
			let url = this.SDPREVIEW_URL_PREFIX + '/' + file;
			const that = this;
			const queryStr = [];
			for (const k in params) {
				queryStr.push(k + '=' + encodeURIComponent(params[k]));
			}
			url += '?' + queryStr.join('&');
			const xhr = new XMLHttpRequest();
			that.currentXHR.push(xhr);
			xhr.open('GET', url);
			xhr.onload = function () {
				const index = that.currentXHR.indexOf(xhr);

				if (index !== -1) {
					that.currentXHR.splice(index, 1);
				}

				try {
					const response = JSON.parse(xhr.responseText);

					if (response.errorCode) {
						return callback(new Error('Server returns error ' + response.errorCode));
					}

					callback(null, response.body);
				} catch (ex) {
					console.warn(ex);
					return callback(new Error('Fail parse server response'));
				}
			};
			xhr.onerror = function () {
				const index = that.currentXHR.indexOf(xhr);

				if (index !== -1) {
					that.currentXHR.splice(index, 1);
				}

				callback(new Error('Fail make request'));
			};
			xhr.send(null);
		},
	},
	pickUserPics: function (params, resultCallback) {
		const {
			fvdSpeedDial: { Templates },
		} = this;
		const btns = {};
		btns[_('dlg_button_cancel')] = function () {
			dlg.close();
		};
		const ADDITIONAL_SEARCH = [
			{
				title: 'Google Images',
				url: 'https://www.google.com/search?hl=en&site=imghp&tbm=isch&source=hp&q={simplehost}',
			},
			{
				title: 'Icon Finder',
				url: ' https://www.iconfinder.com/search/?q={simplehost}+icon',
			},
			{
				title: 'Find Icons',
				url: 'https://findicons.com/search/{simplehost}',
			},
			{
				title: 'Icons Pedia',
				url: 'https://www.iconspedia.com/search/{simplehost}/',
			},
		];
		let currentOrder = 'best';
		let currentPage = 0;
		let currentTotalPages = 0;
		const that = this;
		function _request(file, params, callback) {
			that.PicsUserPics.request(file, params, callback);
		}
		function _listImages(pageNum, order, callback) {
			_request(
				'listing.php',
				{
					p: pageNum,
					order: order,
					host: params.host,
				},
				callback
			);
		}
		function _report(sdPreviewId, type, callback) {
			_request(
				'report.php',
				{
					sdpreview_id: sdPreviewId,
					type: type,
				},
				callback
			);
		}
		function _setOrder(order) {
			if (that.PicsUserPics.currentXHR.length > 0) {
				that.PicsUserPics.currentXHR.forEach(xhr => {
					xhr.abort();
				});
				that.PicsUserPics.currentXHR = [];
			}

			currentOrder = order;
			currentPage = 0;
			const container = document.querySelector('#dialogPicUserPics .picsContainer');
			const elems = document.querySelectorAll('#dialogPicUserPics .head .order');
			while (container.firstChild) {
				container.removeChild(container.firstChild);
			}
			for (let i = 0; i !== elems.length; i++) {
				const el = elems[i];
				el.removeAttribute('active');
			}
			document.querySelector('#dialogPicUserPics .head .order.' + order).setAttribute('active', 1);
			_buildList();
		}
		function _showAdditionalSearch(found) {
			const container = document.querySelector('#dialogPicUserPics .picsContainer');

			if (!found) {
				const notFoundElem = document.createElement('div');
				notFoundElem.className = 'notFound';
				notFoundElem.textContent = _('dialog_pick_user_pics_not_found');
				container.appendChild(notFoundElem);
			}

			const additionalSearch = document.createElement('div');
			additionalSearch.className = 'additionalSearch';
			const title = document.createElement('div');
			title.textContent = _('dialog_pick_user_pics_not_found_title').replace('{host}', params.host);
			title.className = 'title';
			additionalSearch.appendChild(title);
			const tmp = params.host.split('.');
			let hostSimple = params.host;

			if (tmp.length >= 2) {
				hostSimple = tmp[tmp.length - 2];

				if (hostSimple === 'co' && tmp.length > 2) {
					hostSimple = tmp[tmp.length - 3];
				}
			}

			ADDITIONAL_SEARCH.forEach(function (item) {
				const elem = document.createElement('div');
				const a = document.createElement('a');
				a.textContent = item.title;
				a.setAttribute(
					'href',
					item.url.replace('{host}', params.host).replace('{simplehost}', hostSimple)
				);
				a.setAttribute('target', '_blank');
				elem.appendChild(a);
				additionalSearch.appendChild(elem);
			});
			container.appendChild(additionalSearch);
			const additionalHelpMessage = document.createElement('div');
			additionalHelpMessage.className = 'additionalHelpMessage';
			const text = document.createElement('span');
			text.textContent = _('dialog_pick_user_pics_not_found_enter_in');
			additionalHelpMessage.appendChild(text);
			const img = document.createElement('div');
			img.className = 'img';
			additionalHelpMessage.appendChild(img);
			container.appendChild(additionalHelpMessage);
		}
		function _buildList() {
			const container = document.querySelector('#dialogPicUserPics .picsContainer');

			if (container.querySelector('div.loading')) {
				return;
			}

			const loading = document.createElement('div');
			loading.className = 'loading';
			container.appendChild(loading);
			_listImages(currentPage, currentOrder, function (error, data) {
				currentTotalPages = data.totalPages;
				container.removeChild(loading);

				if (error) {
					that.alert(
						_('dlg_alert_fail_obtain_user_pics_title'),
						_('dlg_alert_fail_obtain_user_pics_text')
					);
					return;
				}

				if (data.previews.length === 0) {
					_showAdditionalSearch(false);
				}

				data.previews.forEach(function (preview) {
					const previewElem = that.PicsUserPics.buildElem(
						preview,
						{
							resultCallback: resultCallback,
							_report: _report,
						},
						dlg
					);
					container.appendChild(previewElem);
				});

				if (currentPage === currentTotalPages - 1) {
					_showAdditionalSearch(true);
				}
			});
		}
		const dlg = new Dialog({
			width: 735,
			title: this._title('pick_user_images'),
			content: Templates.getHTML('prototype_dialogPickUserPics'),
			buttons: btns,
			closeCallback: function () {
				if (resultCallback) {
					resultCallback(null);
				}
			},
			onShow: function (dlg) {
				['best', 'new'].forEach(function (order) {
					const elem = document.querySelector('#dialogPicUserPics .head .order.' + order);
					elem.addEventListener('click', function () {
						_setOrder(order);
					});
				});
				_setOrder(currentOrder);
				const container = document.querySelector('#dialogPicUserPics .picsContainer');
				container.addEventListener('scroll', function () {
					const remainScroll
						= container.scrollHeight - container.scrollTop - container.offsetHeight;

					if (remainScroll < 50 && currentPage < currentTotalPages - 1) {
						if (container.querySelector('div.loading')) {
							return;
						}

						currentPage++;
						_buildList();
					}
				});
				const bottomActions = dlg.container.querySelector('.dialog-actions');
				const reportBottomDesc = document.createElement('div');
				reportBottomDesc.setAttribute('id', 'dialogPicUserPics_reportBottomDesc');
				const span1 = document.createElement('span');
				span1.textContent = _('dialog_pick_user_pics_bottom_desc_1');
				const span2 = document.createElement('span');
				span2.textContent = _('dialog_pick_user_pics_bottom_desc_2');
				const alertImg = document.createElement('img');
				alertImg.setAttribute('src', '/images/screamer.png');
				reportBottomDesc.appendChild(span1);
				reportBottomDesc.appendChild(alertImg);
				reportBottomDesc.appendChild(span2);
				bottomActions.insertBefore(reportBottomDesc, bottomActions.firstChild);
			},
		});
	},
	setAutoUpdateBatch: function () {
		const {
			fvdSpeedDial: { StorageSD, Templates, Dialogs },
		} = this;
		const btns = {};
		btns[_('dlg_button_save')] = function () {
			const interval
				= document.getElementById('dialogSetAutoUpdate_autoupdate_preview_interval').value
				+ '|'
				+ document.getElementById('dialogSetAutoUpdate_autoupdate_preview_interval_type').value;
			StorageSD.setAutoUpdateGlobally(
				{
					interval: interval,
				},
				function () {
					dlg.close();
					Dialogs.alert(
						_('dlg_alert_dials_autoupdate_updated_title'),
						_('dlg_alert_dials_autoupdate_updated_text')
					);
				}
			);
		};
		btns[_('dlg_button_cancel')] = function () {
			dlg.close();
		};
		const dlg = new Dialog({
			width: 300,
			title: this._title('set_autoupdate_batch'),
			content: Templates.getHTML('prototype_dialogSetAutoUpdate'),
			buttons: btns,
		});
	},
	manageDeny: function () {
		const {
			fvdSpeedDial: { Templates },
		} = this;
		const that = this;
		const btns = {};
		btns[_('dlg_button_add_deny_rule')] = function () {
			that.deny();
		};
		btns[_('dlg_button_close')] = function () {
			dlg.close();
		};
		const dlg = new Dialog({
			width: 600,
			title: that._title('manage_deny'),
			content: Templates.getHTML('prototype_dialogManageDeny'),
			buttons: btns,
			onShow: function () {
				that.manageDenyRefresh();
			},
		});
	},
	manageDenyRefresh: function () {
		const {
			fvdSpeedDial: { StorageSD, Dialogs },
		} = this;
		const oldContainer = document.getElementById('denyUrlsContainer');

		if (!oldContainer) {
			return;
		}

		const container = oldContainer.cloneNode(true);
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}
		StorageSD.denyList(function (data) {
			for (let i = 0; i !== data.length; i++) {
				const d = data[i];
				const tr = document.createElement('tr');
				const tdSign = document.createElement('td');
				const divSign = document.createElement('div');
				const tdType = document.createElement('td');
				const divType = document.createElement('div');
				const tdActions = document.createElement('td');
				const divActions = document.createElement('div');
				divSign.textContent = d.sign;
				tdType.textContent = d.type === 'host' ? 'domain' : d.type;
				const iconEdit = document.createElement('div');
				const iconRemove = document.createElement('div');
				iconEdit.className = 'icon edit';
				iconRemove.className = 'icon remove';
				divActions.className = 'speedDialIcons';
				divActions.appendChild(iconEdit);
				divActions.appendChild(iconRemove);
				tdSign.appendChild(divSign);
				tdType.appendChild(divType);
				tdActions.appendChild(divActions);
				tr.appendChild(tdSign);
				tr.appendChild(tdType);
				tr.appendChild(tdActions);
				(function (d) {
					// events
					iconRemove.addEventListener(
						'click',
						function () {
							StorageSD.removeDeny(d.id, function () {
								tr.remove();
							});
						},
						false
					);
					iconEdit.addEventListener(
						'click',
						function () {
							Dialogs.deny(d);
						},
						false
					);
				})(d);
				container.appendChild(tr);
			}
			oldContainer.parentNode.replaceChild(container, oldContainer);
		});
	},
	importExport: function (params) {
		const {
			fvdSpeedDial: {
				StorageSD,
				Templates,
				SpeedDial,
				Prefs,
				RuntimeStore,
				Options,
				Dialogs,
				Sync,
				ThumbMaker,
			},
		} = this;
		const that = this;

		if (params.type === 'export') {
			const btns = {};
			btns[_('dlg_button_copy_to_clipboard')] = function () {
				Utils.copyToClipboard(document.getElementById('importExportTextArea').value);
				dlg.showActionMessage(_('sah_copied'));
			};
			btns[_('dlg_button_close')] = function () {
				dlg.close();
			};
			let dlg = new Dialog({
				width: 400,
				title: that._title('export'),
				content: Templates.getHTML('prototype_dialogExport'),
				buttons: btns,
				onShow: function () {
					document.getElementById('dialogImportExportContainer').setAttribute('type', 'export');
					Utils.Async.chain([
						function (callback, dataObject) {
							StorageSD.dump(function (data) {
								dataObject.db = data;
								callback();
							});
						},
						function (callback, dataObject) {
							Prefs.dump(function (data) {
								dataObject.prefs = data;
								callback();
							});
						},
						function (callback, dataObject) {
							document.getElementById('importExportTextArea').value = JSON.stringify(dataObject);
						},
					]);
				},
			});
		} else if (params.type === 'import') {
			const btns = {};
			let importInProcess = false;
			btns[_('dlg_button_import')] = function () {
				that.confirm(_('dlg_confirm_import_title'), _('dlg_confirm_import_text'), function (r) {
					if (r) {
						const importExportTextArea = document.getElementById('importExportTextArea');
						const text = importExportTextArea.value.trim();

						if (text === '') {
							that.errorToField(importExportTextArea, document.body, _('error_must_be_filled'));
							return;
						}

						let importData = null;
						try {
							importData = JSON.parse(text);
							importData.db.dials;
							importData.db.groups;
							importData.db.deny;

							if (!importData.prefs) {
								throw '';
							}
						} catch (ex) {
							console.warn(ex);
							try {
								// try to translate import file
								importData = importTranslate.translate(JSON.parse(text));

								if (!importData) {
									throw '';
								}
							} catch (ex) {
								console.warn(ex);
								that.errorToField(
									importExportTextArea,
									document.body,
									_('error_wrong_import_data')
								);
								return;
							}
						}
						const importContainer = document.getElementById('dialogImportExportContainer');
						importContainer.setAttribute('type', 'importing');
						// activate import chain
						const statusTextContainer = document.getElementById('importingProcessState');
						const groupsRelations = {}; // relations between groups ids in dump and imported groups IDS
						let countGroupsImported = 0;
						let countDialsImported = 0;
						RuntimeStore.set('importing_in_process', true);
						Utils.Async.chain([
							// step 1. Clear old data
							function (callback) {
								importInProcess = true;
								statusTextContainer.textContent = _('dlg_importing_step1');
								Utils.Async.chain([
									function (cb) {
										StorageSD.clearGroups.call(StorageSD, cb, null);
									},
									function (cb) {
										StorageSD.clearDials.call(StorageSD, cb, null);
									},
									function (cb) {
										StorageSD.clearDeny.call(StorageSD, cb);
									},
									callback,
								]);
							},
							// step 2. Import prefs
							function (callback) {
								statusTextContainer.textContent = _('dlg_importing_step2');
								for (const k in importData.prefs) {
									Prefs.set(k, importData.prefs[k]);
								}
								Options.refreshOptionValues(function () {
									Options.applyChanges(function () {
										callback();
									});
								});
							},
							// step 3. Import deny
							function (callback) {
								statusTextContainer.textContent = _('dlg_importing_step3');

								if (importData.db.deny.length === 0) {
									callback();
									return;
								}

								Utils.Async.arrayProcess(
									importData.db.deny,
									function (denyData, callback2) {
										try {
											StorageSD.deny(denyData.type, denyData.sign, function () {
												callback2();
											});
										} catch (ex) {
											console.warn(ex);
											callback2();
										}
									},
									function () {
										callback();
									}
								);
							},
							// step 4. Import groups
							function (callback) {
								statusTextContainer.textContent = _('dlg_importing_step4');
								Utils.Async.arrayProcess(
									importData.db.groups,
									function (group, callback2) {
										try {
											StorageSD.groupExists(
												{
													name: group.name,
												},
												function (exists) {
													if (exists) {
														callback2();
													} else {
														if (group.name && group.position) {
															StorageSD.groupAdd(
																{
																	name: group.name,
																	position: group.position,
																	sync: 1,
																	global_id: group.global_id,
																},
																function (result) {
																	if (result.result) {
																		countGroupsImported++;
																		groupsRelations[group.id] = result.id;
																	}

																	callback2();
																}
															);
														} else {
															callback2();
														}
													}
												}
											);
										} catch (ex) {
											console.warn(ex);
											callback2();
										}
									},
									function () {
										callback();
									}
								);
							},
							// step 5. Import dials
							function (callback) {
								statusTextContainer.textContent = _('dlg_importing_step5');
								Utils.Async.arrayProcess(
									importData.db.dials,
									function (dial, callback2) {
										if (dial.id) delete dial.id;

										if (
											dial.url
											&& dial.thumb_source_type
											&& dial.group_id
											&& dial.position
											&& groupsRelations[dial.group_id]
										) {
											try {
												const dialData = {};
												dial.group_id = groupsRelations[dial.group_id];

												if (dial.screen_maked === 1) {
													dial.screen_maked = 0; // screen not transfered and need to remake
												}

												StorageSD.addDial(dial, function (result) {
													if (result.result) {
														countDialsImported++;

														if (dial.thumb_source_type === 'url' && dial.thumb_url) {
															ThumbMaker.getImageDataPath(
																{
																	imgUrl: dial.thumb_url,
																	screenWidth: SpeedDial.getMaxCellWidth(),
																},
																function (dataUrl) {
																	StorageSD.updateDial(
																		result.id,
																		{
																			thumb: dataUrl,
																		},
																		function () {
																			callback2();
																		}
																	);
																}
															);
														} else {
															callback2();
														}
													} else {
														callback2();
													}
												});
											} catch (ex) {
												console.warn(ex);
												callback2();
											}
										} else {
											callback2();
										}
									},
									function () {
										callback();
									}
								);
							},
							// finish step
							function () {
								statusTextContainer.textContent = _('dlg_importing_finished')
									.replace('%groups%', String(countGroupsImported))
									.replace('%dials%', String(countDialsImported));
								importContainer.setAttribute('type', 'success');
								importInProcess = false;
								RuntimeStore.set('importing_in_process', false);
								Sync.importFinished();
								SpeedDial.refreshAllDialsInGroup();
							},
						]);
					}
				});
			};
			btns[_('dlg_button_close')] = function () {
				if (!importInProcess) {
					dlg.close();
				} else {
					Dialogs.alert(_('dlg_alert_wait_importing_title'), _('dlg_alert_wait_importing_text'));
				}
			};
			let dlg = new Dialog({
				width: 400,
				title: that._title('import'),
				content: Templates.getHTML('prototype_dialogExport'),
				buttons: btns,
				onShow: function () {
					document.getElementById('dialogImportExportContainer').setAttribute('type', 'import');
				},
				clickCallback: function () {
					that.hideErrorBox();
				},
				closeCallback: function () {
					that.hideErrorBox();
				},
			});
		}
	},
	viewGroup: function (host) {
		const {
			fvdSpeedDial: { Templates },
		} = this;
		const that = this;
		that.ViewGroup.currentHost = host;
		const btns = {};
		btns[_('dlg_button_close')] = function () {
			dlg.close();
		};
		const dlg = new Dialog({
			width: 400,
			title: that._title('view_group'),
			content: Templates.getHTML('prototype_dialogViewGroup'),
			buttons: btns,
			onShow: function () {
				that.ViewGroup.rebuild();
				// set events
				document.getElementById('dialogViewGroup_typeTitle').addEventListener(
					'click',
					function () {
						that.ViewGroup.changeType();
					},
					false
				);
				document.getElementById('dialogViewGroup_typeUrl').addEventListener(
					'click',
					function () {
						that.ViewGroup.changeType();
					},
					false
				);
			},
		});
		that.ViewGroup.currentDlg = dlg;
	},
	ViewGroup: {
		currentHost: null,
		currentDlg: null,
		rebuild: function () {
			const that = this;
			MostVisited.getDataByHost(SpeedDial.currentGroupId(), this.currentHost, function (data) {
				const container = document.getElementById('dialogViewGroup_urlContainer');
				while (container.firstChild) {
					container.removeChild(container.firstChild);
				}
				for (let i = 0; i !== data.length; i++) {
					const url = document.createElement('a');
					url.setAttribute('class', 'url');
					url.setAttribute('_url', data[i].url);
					url.setAttribute('href', data[i].url);
					url.setAttribute('_title', data[i].title);
					url.setAttribute('id', 'mostvisitedInGroupUrl_' + data[i].id);
					const favicon = document.createElement('img');
					favicon.setAttribute('src', Utils.getFavicon(data[i].url));
					favicon.setAttribute('width', 16);
					const divText = document.createElement('div');
					divText.className = 'text';
					divText.textContent = data[i].title;
					const divHits = document.createElement('div');
					divHits.className = 'hits';
					divHits.textContent = data[i].visitCount;
					url.appendChild(favicon);
					url.appendChild(divText);
					url.appendChild(divHits);
					/*
            (function(i){
              url.addEventListener( "click", function( event ){
                fvdSpeedDial.Utils.Opener.asClicked( data[i].url, fvdSpeedDial.Prefs.get( "sd.default_open_in" ), event );
              }, false );
            })(i);
            */
					ContextMenus.assignToElem(url, 'mostvisitedGroupUrl');
					container.appendChild(url);
				}
				document.querySelector(
					'[name=dialogViewGroup_viewType][value='
						+ Prefs.get('sd.most_visited.group_view_type')
						+ ']'
				).checked = true;
				that.changeType();
			});
		},
		changeType: function () {
			const container = document.getElementById('dialogViewGroup_urlContainer');
			const type = document.querySelector('[name=dialogViewGroup_viewType]:checked').value;
			const altType = type === 'url' ? 'title' : 'url';
			this.fvdSpeedDial.Prefs.set('sd.most_visited.group_view_type', type);
			const elems = container.getElementsByClassName('url');
			for (let i = 0; i !== elems.length; i++) {
				const textItem = elems[i].getElementsByClassName('text')[0];
				const item = elems[i];
				textItem.textContent = item.getAttribute('_' + type);
				item.setAttribute('title', item.getAttribute('_' + altType));
			}
		},
	},
	deny: function (settings) {
		const {
			fvdSpeedDial: { StorageSD, Dialogs, SpeedDialMisc },
		} = this;
		settings = settings || {
			type: 'host',
			sign: '',
		};
		const that = this;
		const btns = {};
		let dlg = null;
		btns[_('dlg_button_deny')] = function () {
			const type = that.Deny.currentType();
			const signBox = document.getElementById('dialogDeny_sign');
			let sign = signBox.value;

			if (!sign) {
				that.errorToField(signBox, document.body, _('error_must_be_filled'));
				return false;
			}

			if (type === 'url') {
				if (!Utils.isValidUrl(sign)) {
					sign = SpeedDialMisc.addProtocolToURL(sign);
				}
			}

			if (settings.id) {
				// edit deny
				StorageSD.editDeny(
					settings.id,
					{
						sign: sign,
						type: type,
					},
					function (result) {
						if (result.result) {
              that.manageDenyRefresh();
							dlg.close();
						} else {
							if (result.error === 'deny_already_exists') {
								that.errorToField(signBox, document.body, _('error_already_exists'));
							}
						}
					}
				);
			} else {
				StorageSD.deny(type, sign, function (result) {
					if (result.result) {
            that.manageDenyRefresh();
						dlg.close();
					} else {
						if (result.error === 'deny_already_exists') {
							that.errorToField(signBox, document.body, _('error_already_exists'));
						}
					}
				});
			}
		};
		btns[_('dlg_button_cancel')] = function () {
			dlg.close();
		};
		let historyComplete = null;
		dlg = new Dialog({
			width: 400,
			title: settings.id ? that._title('edit_deny') : that._title('deny'),
			content: fvdSpeedDial.Templates.getHTML('prototype_dialogDeny'),
			buttons: btns,
			enterOnButton: _('dlg_button_deny'),
			clickCallback: function () {
				that.hideErrorBox();
			},
			closeCallback: function () {
				historyComplete.destroy();
				that.hideErrorBox();
			},
			onShow: function () {
				const denyHostRadio = document.getElementById('dialogDeny_denyHost');
				const denyURLRadio = document.getElementById('dialogDeny_denyURL');
				const signBox = document.getElementById('dialogDeny_sign');
				historyComplete = HistoryComplete.create(signBox);

				if (settings.type === 'host') {
					denyHostRadio.setAttribute('checked', true);
				} else if (settings.type === 'url') {
					denyURLRadio.setAttribute('checked', true);
				}

				signBox.setAttribute('value', settings.sign);
				that.Deny.changeType();
				// set events
				document.getElementById('dialogDeny_denyHost').addEventListener(
					'click',
					function () {
						Dialogs.Deny.changeType();
					},
					false
				);
				document.getElementById('dialogDeny_denyURL').addEventListener(
					'click',
					function () {
						Dialogs.Deny.changeType();
					},
					false
				);
				document.getElementById('dialogDeny_sign').focus();
			},
		});
	},
	Deny: {
		currentType: function () {
			const denyHostRadio = document.getElementById('dialogDeny_denyHost');
			const denyURLRadio = document.getElementById('dialogDeny_denyURL');
			let currentType = null;

			if (denyHostRadio.checked) {
				currentType = 'host';
			} else if (denyURLRadio.checked) {
				currentType = 'url';
			}

			return currentType;
		},
		changeType: function () {
			const currentType = this.currentType();
			const signBox = document.getElementById('dialogDeny_sign');
			let currUrl = signBox.value;

			if (currentType === 'url') {
				if (signBox.hasAttribute('urlValue') && signBox.getAttribute('urlValue')) {
					currUrl = signBox.getAttribute('urlValue');
				}

				signBox.value = currUrl;
			} else if (currentType === 'host') {
				signBox.setAttribute('urlValue', currUrl);
				let host = Utils.parseUrl(currUrl, 'host');

				if (!host) {
					host = signBox.value;
				}

				signBox.value = host;
			}
		},
	},
	manageGroups: function (dialogParams) {
		const {
			fvdSpeedDial: { StorageSD, Templates, SpeedDial, Sync },
		} = this;
		dialogParams = dialogParams || {};
		const that = this;
		const btns = {};
		const leftBtns = {};
		btns[_('dlg_button_save')] = function () {
			dlg.getMainButton().setAttribute('loading', 1);
			const groups = that.ManageGroups.currentGroupsList();
			const groupIds = [];
			const groupsProcessed = [];
			for (let i = 0; i !== groups.length; i++) {
				if (groupIds.indexOf()) groupIds.push(parseInt(groups[i].id));
			}
			StorageSD.groupsList(function (currentGroups) {
				const positionsFunction = function () {
					Utils.Async.arrayProcess(
						JSON.parse(JSON.stringify(groups)),
						function (group, arrayProcessCallback) {
							//Utils.Async.eachSeries(groups, function(group, arrayProcessCallback) {
							if (group.id.toString().indexOf('new_') === 0) {
								if (groupsProcessed.indexOf(group.id) === -1) groupsProcessed.push(group.id);
								else {
									console.warn('duplicate group', group);
									return;
								}

								StorageSD.groupAdd(
									{
										name: group.name,
										sync: group.sync,
										position: group.position,
									},
									function (result) {
										console.log('added group', group);

										if (result.result) {
											Sync.addDataToSync({
												category: ['groups', 'newGroups'],
												data: result.id,
												translate: 'group',
											});
										}

										arrayProcessCallback();
									}
								);
							} else {
								StorageSD.groupUpdate(
									group.id,
									{
										position: group.position,
										name: group.name,
										sync: group.sync,
									},
									function () {
										Sync.addDataToSync({
											category: 'groups',
											data: group.id,
											translate: 'group',
										});
										arrayProcessCallback();
									}
								);
							}
						},
						function () {
							SpeedDial.sheduleRebuildGroupsList();

							if (dialogParams.callback) {
								dialogParams.callback(true);
							}

							dlg.getMainButton().setAttribute('loading', 0);
							dlg.close();
						}
					);
				};
				const groupsIdsToRemove = [];
				for (let i = 0; i !== currentGroups.length; i++) {
					const currentGroup = currentGroups[i];

					if (groupIds.indexOf(currentGroup.id) === -1) {
						groupsIdsToRemove.push(currentGroup.id);
					}
				}

				if (groupsIdsToRemove.length > 0) {
					for (let i = 0; i !== groupsIdsToRemove.length; i++) {
						(function (i) {
							// remove group
							SpeedDial.removeGroup(
								groupsIdsToRemove[i],
								function () {
									if (i === groupsIdsToRemove.length - 1) {
										positionsFunction();
									}
								},
								{
									noConfirmIfHaveDials: true,
								}
							);
						})(i);
					}
				} else {
					positionsFunction();
				}
			});
			$(dlg.body).find('button').attr('disabled', 'disabled');
			$(dlg.body).find('.icons').remove();
		};
		btns[_('dlg_button_cancel')] = function () {
			if (dialogParams.callback) {
				dialogParams.callback(false);
			}

			dlg.close();
		};
		leftBtns[_('dlg_manage_groups_add_group')] = function () {
			that.ManageGroups.addGroup();
		};
		const dlg = new Dialog({
			width: 400,
			title: that._title('manage_groups'),
			content: Templates.getHTML('prototype_dialogManageGroups'),
			buttons: btns,
			leftButtons: leftBtns,
			clickCallback: function () {
				that.hideErrorBox();
			},
			closeCallback: function () {
				that.hideErrorBox();

				if (typeof Scrolling === 'object') {
					Scrolling.manageGroupsDialogOpen = false;
				}
			},
			onShow: function () {
				StorageSD.groupsList(function (groups) {
					const container = document.getElementById('dialogManageGroups_groupsList');
					for (let i = 0; i !== groups.length; i++) {
						const dbGroup = groups[i];
						const group = that.ManageGroups.buildGroupItem(dbGroup);
						container.appendChild(group);
					}
					setTimeout(function () {
						that.ManageGroups.refreshGroupsListDrag();
					}, 0);
				});

				if (typeof Scrolling === 'object') {
					Scrolling.manageGroupsDialogOpen = true;
				}
			},
		});
	},
	setGroupNoSyncDialog: function (callback) {
		const {
			fvdSpeedDial: { Dialogs },
		} = this;

		if (_b(Prefs.get('sd.display_nosync_group_dialog'))) {
			Dialogs.confirmCheck(
				_('dlg_nosync_group_title'),
				_('dlg_nosync_group_text'),
				_('dlg_dont_show_it_again'),
				false,
				function (r, state) {
					if (r) {
						if (state) {
							Prefs.set('sd.display_nosync_group_dialog', false);
						}
					}

					callback(r);
				}
			);
		} else {
			callback(true);
		}
	},
	moveDialToNoSyncGroupDialog: function (callback) {
		const {
			fvdSpeedDial: { Dialogs },
		} = this;

		Utils.Async.chain([
			function (chainCallback) {
				Sync.syncAddonExists(function (exists) {
					if (exists) {
						chainCallback();
					} else {
						callback(true);
					}
				});
			},
			function () {
				// display dialog if need
				if (_b(Prefs.get('sd.display_move_to_nosync_group_dialog'))) {
					Dialogs.confirmCheck(
						_('dlg_move_to_nosync_group_title'),
						_('dlg_move_to_nosync_group_text'),
						_('dlg_dont_show_it_again'),
						false,
						function (r, state) {
							if (r) {
								if (state) {
									Prefs.set('sd.display_move_to_nosync_group_dialog', false);
								}
							}

							callback(r);
						}
					);
				} else {
					callback(true);
				}
			},
		]);
	},
	addGroup: function (groupId, dialogParams) {
		const {
			fvdSpeedDial: { StorageSD, Templates, SpeedDial, Prefs, Sync, Dialogs },
		} = this;
		let initData = {};
		let bounce = false;
		let buttonAddModifyText = _('dlg_button_add_group');

		if (groupId) {
			buttonAddModifyText = _('dlg_button_modify_group');
		}

		let dlg;
		const btns = {};
		btns[buttonAddModifyText] = function () {
			if (bounce) {
				return;
			} else {
				bounce = true;
				setTimeout(() => {
					bounce = false;
				}, 750);
			}

			const nameElem = document.getElementById('addGroup_name');
			const name = nameElem.value.trim();

			if (!name) {
				that.errorToField(nameElem, document.body, _('error_must_be_filled'));
				return false;
			}

			let addPosition;

			if (document.getElementById('addGroup_addToTop').checked) {
				addPosition = 'top';
			} else {
				addPosition = 'bottom';
			}

			if (!groupId) {
				fvdSpeedDial.Prefs.set('sd.add_group_position_default', addPosition);
			}

			const sync = document.getElementById('addGroup_sync').checked ? 1 : 0;

			if (dialogParams && dialogParams.commitToCallback) {
				if (dialogParams.existsGroupsNames) {
					const nameLC = name.toLowerCase();
					for (let i = 0; i !== dialogParams.existsGroupsNames.length; i++) {
						if (dialogParams.existsGroupsNames[i].toLowerCase() === nameLC) {
							that.errorToField(nameElem, document.body, _('error_already_exists'));
							return false;
						}
					}
				}

				dialogParams.commitToCallback({
					result: true,
					data: {
						addPosition: addPosition,
						name: name,
						sync: sync,
					},
				});
				dlg.close();
			} else {
				StorageSD.groupExists(
					{
						name: name,
						excludeIds: groupId ? [groupId] : null,
					},
					function (exists) {
						if (exists) {
							that.errorToField(nameElem, document.body, _('error_already_exists'));
							return false;
						} else {
							if (groupId) {
								Utils.Async.chain([
									function (chainCallback) {
										if (sync === 1 || initData.sync === 0) {
											chainCallback();
											return;
										}

										Dialogs.setGroupNoSyncDialog(function (set) {
											if (set) {
												chainCallback();
											}
										});
									},
									function () {
										StorageSD.groupUpdate(
											groupId,
											{
												name: name,
												sync: sync,
											},
											function () {
												SpeedDial.sheduleRebuildGroupsList();
												dlg.close();
											}
										);
										Sync.addDataToSync({
											category: 'groups',
											data: groupId,
											translate: 'group',
										});
									},
								]);
							} else {
								StorageSD.groupAdd(
									{
										name: name,
										sync: sync,
										forcePosition: addPosition,
									},
									function (result) {
										if (result.result) {
											Sync.addDataToSync({
												category: ['groups', 'newGroups'],
												data: result.id,
												translate: 'group',
											});

											if (addPosition === 'top') {
												// need to add all groups to sync
												StorageSD.groupsRawList({}, function (groups) {
													groups.forEach(function (group) {
														if (group.id === result.id) {
															return;
														}

														Sync.addDataToSync({
															category: ['groups'],
															data: group.global_id,
														});
													});
												});
											}

											SpeedDial.setCurrentGroupId(result.id);
											dlg.close();
										}
									}
								);
							}
						}
					}
				);
			}
		};
		btns[_('dlg_button_cancel')] = function () {
			if (dialogParams && dialogParams.commitToCallback) {
				dialogParams.commitToCallback({
					result: false,
				});
			}

			dlg.close();
		};
		const that = this;
		dlg = new Dialog({
			width: 400,
			title: groupId ? this._title('modify_group') : this._title('add_group'),
			content: Templates.getHTML('prototype_dialogAddGroup'),
			buttons: btns,
			clickCallback: function () {
				that.hideErrorBox();
			},
			closeCallback: function () {
				that.hideErrorBox();
			},
			onShow: function () {
				const positionFieldContainer = document.getElementById('addGroup_addPositionContainer');

				if (groupId) {
					Utils.Async.chain([
						function (chainCallback) {
							if (
								dialogParams
								&& dialogParams.initData
								&& Object.keys(dialogParams.initData).length
							) {
								initData = dialogParams.initData;
								chainCallback();
							} else {
								StorageSD.getGroup(groupId, function (group) {
									initData = group;
									chainCallback();
								});
							}
						},
						function () {
							document.getElementById('addGroup_name').value = initData.name;

							if (initData.sync === 1) {
								document.getElementById('addGroup_sync').checked = true;
							}
						},
					]);
					positionFieldContainer.setAttribute('hidden', 1);
				} else {
					positionFieldContainer.removeAttribute('hidden');
				}

				if (Prefs.get('sd.add_group_position_default') === 'top') {
					document.getElementById('addGroup_addToTop').checked = true;
				} else {
					document.getElementById('addGroup_addToBottom').checked = true;
				}

				document.getElementById('addGroup_name').focus();
			},
			enterOnButton: buttonAddModifyText,
		});
	},
	AddGroup: {
		clickSync: function () {
			Sync.syncAddonExists(function (exists) {
				if (!exists) {
					const cb = document.getElementById('addGroup_sync');
					cb.checked = !cb.checked;
					new Dialogs().installFVDSync();
				}
			});
		},
	},
	installFVDSync: function () {
		let dlg;
		const btns = {};
		btns[_('dlg_button_close')] = function () {
			dlg.close();
		};
		dlg = new Dialog({
			width: 400,
			title: this._title('install_fvd_sync'),
			content: Templates.getHTML('prototype_dialogInstallSync'),
			buttons: btns,
			enterOnButton: _('dlg_button_close'),
		});
	},
	addDial: function (dialData, type, forceAdd, _callback) {
		const {
			fvdSpeedDial: {
				StorageSD,
				Templates,
				SpeedDial,
				SpeedDialMisc,
				Prefs,
				Dialogs,
				MostVisited,
				ThumbMaker,
				Sync,
			},
		} = this;
		let dialId = null;
		let dlg;
		type = type || 'speeddial';

		if (type === 'speeddial' && !forceAdd && dialData) {
			dialId = dialData.id;
		}

		if (type === 'mostvisited' && !forceAdd) {
			dialId = dialData.id;
		}

		const that = this;

		let buttonAddModifyText = _('dlg_button_add_dial');

		if (dialId) {
			buttonAddModifyText = _('dlg_button_modify_dial');
		}

		const btns = {};
		btns[buttonAddModifyText] = function () {
			// check if need grab img
			let backgroundUrl = '';

			if (!document.getElementById('addDialog_image_url').hasAttribute('autoText')) {
				backgroundUrl = document.getElementById('addDialog_image_url').value;
			}

			// check fields
			let url = document.getElementById('addDialog_url').value.trim();
			let title = document.getElementById('addDialog_title').value.trim();
			const groupValue = document.getElementById('addDialog_group').value;
			const groupNameNode = document.getElementById('addDialog_groupName');
			const groupName = groupNameNode.value.trim();
			const customPreviewCheckbox = document.getElementById('addDialog_useCustomPreview');
			const manualPreviewRadio = document.getElementById('addDialog_useManualPreview');
			const autoPreviewRadio = document.getElementById('addDialog_useAutoPreview');
			let autoPreviewUpdateEnabled = document.getElementById(
				'addDialog_autoupdate_preview_enable'
			).checked;
			const autoPreviewUpdateInterval = parseInt(
				document.getElementById('addDialog_autoupdate_preview_interval').value,
				10
			);
			const autoPreviewUpdateIntervalType = document.getElementById(
				'addDialog_autoupdate_preview_interval_type'
			).value;
			let updateInterval = '';

			if (!autoPreviewRadio.checked || isNaN(autoPreviewUpdateInterval)) {
				autoPreviewUpdateEnabled = false;
			}

			if (autoPreviewUpdateEnabled) {
				updateInterval = autoPreviewUpdateInterval + '|' + autoPreviewUpdateIntervalType;
			}

			const screenDelay = 0; //not used now /*document.getElementById("addDialog_screenDelay").value;*/

			if (!url) {
				that.errorToField(
					document.getElementById('addDialog_url'),
					document.body,
					_('error_must_be_filled')
				);
				return false;
			}

			if (!Utils.isValidUrl(url)) {
				//that.errorToField( document.getElementById( "addDialog_url" ), document.body, _("error_invalid_url") );
				//return false;
				url = SpeedDialMisc.addProtocolToURL(url);

				if (!Utils.isValidUrl(url)) {
					that.errorToField(
						document.getElementById('addDialog_url'),
						document.body,
						_('error_invalid_url')
					);
					return false;
				}
			} else {
				url = SpeedDialMisc.changeProtocolToHTTPS(url);
			}

			let getScreenMethod = 'auto';

			if (customPreviewCheckbox.checked) {
				getScreenMethod = 'custom';
			} else if (manualPreviewRadio.checked) {
				getScreenMethod = 'manual';
			}

			function sdUserPicsPreviewsAfterAdd() {
				if (getScreenMethod === 'custom' && Dialogs.AddDial.pickedUserPreview) {
					if (Dialogs.AddDial.pickedUserPreview.url === backgroundUrl) {
						Dialogs.PicsUserPics.rate(Dialogs.AddDial.pickedUserPreview.id);
					}
				}
			}
			const afterTitle = function () {
				if (type === 'speeddial') {
					if (groupValue === 0 && !groupName) {
						that.errorToField(groupNameNode, document.body, _('error_must_be_filled'));
						return false;
					}

					const getGroupValue = function (callback) {
						if (groupValue === 0) {
							// check if group exists
							StorageSD.groupExists(
								{
									name: groupName,
								},
								function (exists) {
									if (exists) {
										that.errorToField(groupNameNode, document.body, _('error_already_exists'));
									} else {
										// add group
										StorageSD.groupAdd(
											{
												name: groupName,
												sync: 1,
											},
											function (result) {
												if (result.result) {
													Sync.addDataToSync({
														category: ['groups', 'newGroups'],
														data: result.id,
														translate: 'group',
													});
													callback(result.id);
												}
											}
										);
									}
								}
							);
						} else {
							callback(groupValue);
						}
					};
					// check deny
					StorageSD.isDenyUrl(url, function (deny, denyDetails) {
						if (deny) {
							that.errorToField(
								document.getElementById('addDialog_url'),
								document.body,
								_('error_url_deny_' + denyDetails.deny.type)
							);
						} else {
							// check existing
							StorageSD.dialExists(
								{
									url: url,
									excludeIds: dialId ? [dialId] : null,
								},
								function (exists) {
									function afterCheck() {
										let thumb_source_type = 'screen';
										const addDial = function (dataUrl, thumbSize, need_sync_screen) {
											need_sync_screen = need_sync_screen ? 1 : 0;
											dataUrl = dataUrl || '';

											if (dialId) {
												StorageSD.getDial(dialId, function (dialDataOld) {
													getGroupValue(function (groupValue) {
														const updateData = {
															title: title,
															url: url,
															thumb_source_type: thumb_source_type,
															thumb_url: backgroundUrl,
															group_id: groupValue,
															screen_delay: screenDelay,
															get_screen_method: getScreenMethod,
															need_sync_screen: need_sync_screen,
															update_interval: updateInterval,
														};

														if (thumbSize) {
															updateData.thumb_width = thumbSize.width;
															updateData.thumb_height = thumbSize.height;
														}

														if (dialDataOld.url !== url) {
															updateData.auto_title = '';
														}

														if (dialDataOld.thumb_source_type === 'url') {
															if (thumb_source_type === 'screen') {
																dataUrl = '';
																updateData.screen_maked = 0;
															}
														} else if (thumb_source_type === 'screen') {
															// if url no have changes save old screen thumb
															if (dialDataOld.url !== url) {
																// reset screen maked flag
																updateData.screen_maked = 0;
															} else if (getScreenMethod !== dialDataOld.get_screen_method) {
																dataUrl = '';
																updateData.screen_maked = 0;
															} else {
																dataUrl = dialDataOld.thumb;
															}
														} else if (thumb_source_type === 'local_file') {
															//dataUrl = dialDataOld.thumb;
														}

														updateData.thumb = dataUrl;
														StorageSD.updateDial(dialId, updateData, function () {
															Sync.addDataToSync({
																category: 'dials',
																data: dialId,
																translate: 'dial',
															});
															//fvdSpeedDial.SpeedDial.sheduleFullRebuild();
															const queryInput = document.getElementById('dial-search-query');

															if (queryInput && queryInput.value) {
																DialSearch.doSearch(queryInput.value);
															} else {
																SpeedDial.sheduleFullRebuild();
															}

															sdUserPicsPreviewsAfterAdd();

															if (_callback) {
																_callback();
															}

															dlg.close();
														});
													});
												});
											} else {
												getGroupValue(function (groupValue) {
													if (!dataUrl) {
														const screen = document.getElementById('addDialog_previewCell');

														if (screen.hasAttribute('screen')) {
															dataUrl = screen.getAttribute('screen');
														}
													}

													const addData = {
														url: url,
														title: title,
														thumb_source_type: thumb_source_type,
														thumb_url: backgroundUrl,
														group_id: groupValue,
														thumb: dataUrl,
														screen_delay: screenDelay,
														get_screen_method: getScreenMethod,
														need_sync_screen: need_sync_screen,
														update_interval: updateInterval,
													};

													if (thumbSize) {
														addData.thumb_width = thumbSize.width;
														addData.thumb_height = thumbSize.height;
													}

													StorageSD.addDial(addData, function (result) {
														if (result.result) {
															Sync.addDataToSync({
																category: ['dials', 'newDials'],
																data: result.id,
																translate: 'dial',
															});
															SpeedDial.justAddedId = result.id;
															setTimeout(function () {
																// need to send user in group where dial created
																if (SpeedDial.currentDisplayType() !== 'speeddial') {
																	SpeedDial.setCurrentDisplayType('speeddial');
																}

																if (SpeedDial.currentGroupId() !== groupValue) {
																	SpeedDial.setCurrentGroupId(groupValue);
																}

																SpeedDial.sheduleFullRebuild();
															}, 200);
														}

														sdUserPicsPreviewsAfterAdd();
														dlg.close();

														if (_callback) {
															_callback();
														}
													});
												});
											}
										};

										if (backgroundUrl && customPreviewCheckbox.checked) {
											thumb_source_type = 'url';

											if (backgroundUrl !== that.LOCAL_FILE_URL) {
												ThumbMaker.getImageDataPath(
													{
														imgUrl: backgroundUrl,
														screenWidth: SpeedDial.getMaxCellWidth(),
													},
													function (dataUrl, thumbSize) {
														addDial(dataUrl, thumbSize);
													}
												);
											} else {
												thumb_source_type = 'local_file';
												const previewCell = document.getElementById('addDialog_previewCell');
												const dataUrl = previewCell.getAttribute('syncScreen');
												const thumbSize = {
													width: previewCell.getAttribute('syncScreenWidth'),
													height: previewCell.getAttribute('syncScreenHeight'),
												};
												addDial(dataUrl, thumbSize, Dialogs.AddDial.localFileChanged());
											}
										} else {
											addDial();
										}
									}

									if (exists && !dialId) {
										if (_b(Prefs.get('sd.display_dial_already_exists_dialog'))) {
											that.confirmCheck(
												_('dlg_confirm_dial_exists_title'),
												_('dlg_confirm_dial_exists_text'),
												_('newtab_do_not_display_migrate'),
												false,
												function (result, cbResult) {
													if (cbResult) {
														Prefs.set('sd.display_dial_already_exists_dialog', false);
													}

													if (result) {
														afterCheck();
													}
												}
											);
										} else {
											afterCheck();
										}
									} else {
										afterCheck();
									}
								}
							);
						}
					});
				} else if (type === 'mostvisited') {
					if (dialId) {
						let thumb_source_type = 'screen';
						const screen = document.getElementById('addDialog_previewCell');
						const modifyMostVisited = function (dataUrl, thumbSize) {
							if (typeof dataUrl === 'undefined') {
								if (screen.hasAttribute('screen')) {
									dataUrl = screen.getAttribute('screen');
								}
							}

							dataUrl = dataUrl || '';
							const updateData = {
								thumb: dataUrl,
								title: title,
								thumb_source_type: thumb_source_type,
								thumb_url: backgroundUrl,
								screen_delay: screenDelay,
								get_screen_method: getScreenMethod,
							};

							if (thumbSize) {
								updateData.thumb_width = thumbSize.width;
								updateData.thumb_height = thumbSize.height;
							}

							if (thumb_source_type === 'screen' && !dataUrl) {
								updateData.screen_maked = 0;
							}

							MostVisited.updateData(dialId, updateData, function () {
								SpeedDial.sheduleFullRebuild();
								sdUserPicsPreviewsAfterAdd();
								dlg.close();
							});
						};

						if (backgroundUrl && customPreviewCheckbox.checked) {
							thumb_source_type = 'url';

							if (backgroundUrl === that.LOCAL_FILE_URL && screen.hasAttribute('syncscreen')) {
								thumb_source_type = 'local_file';
								backgroundUrl = screen.getAttribute('syncscreen');
							}

							ThumbMaker.getImageDataPath(
								{
									imgUrl: backgroundUrl,
									screenWidth: SpeedDial.getMaxCellWidth(),
								},
								function (dataUrl, thumbSize) {
									modifyMostVisited(dataUrl, thumbSize);
								}
							);
						} else {
							modifyMostVisited();
						}
					}
				}
			};

			if (document.getElementById('addDialog_title').hasAttribute('autoText')) {
				// get auto title
				title = '';
				afterTitle();
			} else {
				if (!title) {
					that.errorToField(
						document.getElementById('addDialog_title'),
						document.body,
						_('error_must_be_filled')
					);
					return false;
				}

				afterTitle();
			}
		};
		btns[_('dlg_button_cancel')] = function () {
			dlg.close();
		};

		function setupPickFrom() {
			function buildUrlsListing(urls) {
				const listingContianer = document.createElement('div');
				listingContianer.className = 'toolTipUrlsList';
				urls.forEach(function (item) {
					const u = document.createElement('div');
					u.className = 'elem';
					const uUrl = document.createElement('div');
					uUrl.className = 'url';
					const uTitle = document.createElement('div');
					uTitle.className = 'title';
					uTitle.textContent = item.title;
					uUrl.textContent = item.url;
					u.appendChild(uTitle);
					u.appendChild(uUrl);
					u.addEventListener('click', function () {
						document.getElementById('addDialog_url').value = item.url;
						document.getElementById('addDialog_title').value = item.title;
						document.getElementById('addDialog_title').removeAttribute('autotext');
						ToolTip.close();
					});
					listingContianer.appendChild(u);
				});
				return listingContianer;
			}
			const pickFromTabs = document.getElementById('addDialog_pickFromOpenedTabs');
			const pickFromMostvisited = document.getElementById('addDialog_pickFromMostVisited');
			const pickFromMostPopular = document.getElementById('addDialog_pickFromMostPopular');
			pickFromMostPopular.addEventListener('click', function (event) {
				that.PicsUserPics.request('country_top.php', {}, function (error, data) {
					if (error) {
						return;
					}

					const items = [];
					data.domains.forEach(function (domain) {
						items.push({
							url: SpeedDialMisc.addProtocolToURL(domain),
							title: domain,
						});
					});
					ToolTip.display(pickFromMostPopular, buildUrlsListing(items), event);
				});
			});
			pickFromTabs.addEventListener('click', function (event) {
				chrome.tabs.query({}, function (_tabs) {
					const tabs = [];
					_tabs.forEach(function (tab) {
						if (tab.url.indexOf('http') !== 0) {
							return;
						}

						if (!tab.title) {
							tab.title = '...';
						}

						tabs.push(tab);
					});

					if (tabs.length > 0) {
						ToolTip.display(pickFromTabs, buildUrlsListing(tabs), event);
					}
				});
			});
			pickFromMostvisited.addEventListener('click', function (event) {
				MostVisited.getData(
					{
						interval: 'month',
						type: 'host',
						count: 25,
					},
					function (_tabs) {
						const tabs = [];
						_tabs.forEach(function (tab) {
							if (!tab.title) {
								return;
							}

							tabs.push(tab);
						});

						if (tabs.length > 0) {
							ToolTip.display(pickFromMostvisited, buildUrlsListing(tabs), event);
						}
					}
				); // max count
			});
		}
		let historyComplete = null;
		Dialogs.AddDial.pickedUserPreview = null;
		const _testInputUrlValue = {
			oldValue: '',
			interval: null,
			listener: null,
			start: function () {
				const that = this;
				this.interval = setInterval(function () {
					const value = document.getElementById('addDialog_url').value;

					if (value !== that.oldValue) {
						that.oldValue = value;

						if (that.listener) {
							that.listener();
						}
					}
				}, 100);
			},
			end: function () {
				clearInterval(this.interval);
			},
		};

		new Dialog({
			width: 414,
			title: dialId ? this._title('modify_dial') : this._title('add_dial'),
			content: Templates.getHTML('prototype_dialogAddDial'),
			buttons: btns,
			enterOnButton: buttonAddModifyText,
			clickCallback: function () {
				that.hideErrorBox();
			},
			closeCallback: function () {
				_testInputUrlValue.end();

				if (historyComplete) {
					historyComplete.destroy();
				}

				that.hideErrorBox();
			},
			onShow: function (dialog) {
				dlg = dialog;
				const pickLocalFile = document.querySelector('#addDialog_PickLocalFileContainer a');
				pickLocalFile.addEventListener(
					'click',
					function (event) {
						let text = _('bg_dialog_adddial_pick_local_file_desc');

						if (navigator.userAgent.toLowerCase().indexOf('windows') !== -1) {
							text = text.replace('{examples}', _('bg_dialog_adddial_pick_local_file_desc_win'));
						} else {
							text = text.replace('{examples}', _('bg_dialog_adddial_pick_local_file_desc_linux'));
						}

						ToolTip.display(pickLocalFile, text, event, true);
						event.preventDefault();
						const url = document.getElementById('addDialog_url');

						if (url && !url.value) url.value = 'file:///';
					},
					false
				);
				_testInputUrlValue.listener = function () {
					setTimeout(function () {
						Dialogs.AddDial.showFastUserPics();
					}, 0);
					setTimeout(function () {
						Dialogs.AddDial.getTitle();
					}, 500);
				};
				_testInputUrlValue.start();
				setTimeout(function () {
					dlg._wrapper.setAttribute('id', 'addDialog_wrapper');
				}, 0);
				setupPickFrom();
				document.querySelector('#addDialogPickImages .showMoreContainer button').addEventListener(
					'click',
					function () {
						document.getElementById('addDialog_pickUserPic').click();
					},
					false
				);
				document.getElementById('addDialog_pickUserPic').addEventListener(
					'click',
					function () {
						let url = document.getElementById('addDialog_url').value.toLowerCase();

						if (url.indexOf('http') !== 0) {
							url = SpeedDialMisc.addProtocolToURL(url);
						}

						const host = Utils.parseUrl(url, 'host');
						dlg.container.style.display = 'none';
						Dialogs.pickUserPics(
							{
								host: host,
							},
							function (result) {
								dlg.container.style.display = '';

								if (result) {
									Dialogs.AddDial.setPickedUserPreview(result);
								}
							}
						);
					},
					false
				);
				document
					.getElementById('addDialog_autoupdate_preview_enable')
					.addEventListener('change', function () {
						Dialogs.AddDial.applyAutoPreviewEnabled();
					});

				if (!dialData && type === 'speeddial') {
					document.getElementById('addDialog_PickFromContainer').removeAttribute('hidden');
				}

				const afterAll = function () {
					Utils.setAutoTextForTextField(
						document.getElementById('addDialog_title'),
						_('dialog_add_dial_dynamic_title')
					);
					Utils.setAutoTextForTextField(
						document.getElementById('addDialog_image_url'),
						_('dialog_add_dial_enter_image_url')
					);
				};
				const fillGroups = function (selectGroup) {
					// fill groups
					StorageSD.groupsList(function (groups) {
						const selectGroups = document.getElementById('addDialog_group');
						selectGroups.options.length = 0;
						for (let i = 0; i !== groups.length; i++) {
							const option = document.createElement('option');

							if (String(groups[i].name).length < 53) option.textContent = groups[i].name;
							else {
								option.textContent = String(groups[i].name).substr(0, 53) + '...';
								option.setAttribute('title', groups[i].name);
							}

							option.value = groups[i].id;
							selectGroups.appendChild(option);
						}
						// add create group
						const option = document.createElement('option');
						option.textContent = _('dlg_adddial_create_group');
						option.value = 0;
						option.className = 'createNewGroup';
						selectGroups.appendChild(option);

						if (selectGroup) {
							selectGroups.value = selectGroup;
						} else {
							selectGroups.selectedIndex = 0;
						}

						that.AddDial.changeGroup();
					});
				};

				if (type === 'speeddial') {
					historyComplete = HistoryComplete.create(document.getElementById('addDialog_url'));
					document.getElementById('addDialog_url').focus();
				}

				document.getElementById('addDialog_url').removeAttribute('display-url');

				if (dialData) {
					document.getElementById('addDialog_url').value = dialData.url;

					if (dialData.title) document.getElementById('addDialog_title').value = dialData.title;

					if (dialData.display_url) {
						document
							.getElementById('addDialog_url')
							.setAttribute('display-url', dialData.display_url);
					}

					const customPreviewCheckbox = document.getElementById('addDialog_useCustomPreview');

					if (dialData.thumb_source_type === 'url') {
						// check if default url is selected
						let isDefaultPreview = false;
						const select = document.getElementById('addDialog_default_image');
						for (let i = 0; i !== select.options.length; i++) {
							const option = select.options[i];

							if (option.value.indexOf(dialData.thumb_url) !== -1) {
								isDefaultPreview = true;
								select.value = option.value;
								that.AddDial.selectDefaultPreview(select);

								if (select.value.indexOf('|') !== -1) {
									const extSelect = document.getElementById('addDialog_default_image_ext');
									extSelect.value = dialData.thumb_url;
									that.AddDial.selectDefaultPreview(extSelect);
								}

								break;
							}
						}

						if (!isDefaultPreview) {
							document.getElementById('addDialog_image_url').value = dialData.thumb_url;
							that.AddDial.refreshPreview();
						}

						customPreviewCheckbox.checked = true;
					} else if (dialData.thumb_source_type === 'local_file') {
						document.getElementById('addDialog_image_url').value = that.LOCAL_FILE_URL;
						customPreviewCheckbox.checked = true;
						document
							.getElementById('addDialog_previewCell')
							.setAttribute('syncScreen', dialData.thumb);
						document
							.getElementById('addDialog_previewCell')
							.setAttribute('syncScreenWidth', dialData.thumb_width);
						document
							.getElementById('addDialog_previewCell')
							.setAttribute('syncScreenHeight', dialData.thumb_height);
						that.AddDial.refreshPreview();
					} else if (dialData.thumb_source_type === 'screen') {
						if (dialData.screen_maked === 1) {
							document
								.getElementById('addDialog_previewCell')
								.setAttribute('screen', dialData.thumb);
							that.AddDial.refreshPreview();
						}

						customPreviewCheckbox.checked = false;

						if (dialData.get_screen_method === 'manual') {
							document.getElementById('addDialog_useManualPreview').checked = true;
						} else {
							document.getElementById('addDialog_useAutoPreview').checked = true;
						}
					}

					if (type === 'speeddial') {
						fillGroups(dialData.group_id);

						if (dialData.update_interval) {
							const tmp = dialData.update_interval.split('|');

							if (tmp.length === 2) {
								document.getElementById('addDialog_autoupdate_preview_enable').checked = true;
								document.getElementById('addDialog_autoupdate_preview_interval').value = tmp[0];
								document.getElementById('addDialog_autoupdate_preview_interval_type').value
									= tmp[1];
							}
						}
					} else if (type === 'mostvisited') {
						const selectGroups = document.getElementById('addDialog_group');
						selectGroups.parentNode.parentNode.setAttribute('hidden', true);
						// disable url field
						document.getElementById('addDialog_url').setAttribute('disabled', true);
					}

					afterAll();
				} else {
					let groupId = SpeedDial.currentGroupId();

					if (groupId === 0) {
						groupId = Prefs.get('sd.default_group');

						if (groupId === 0 || groupId === -1) {
							StorageSD.groupsList(function (groups) {
								if (groups.length > 0) {
									groupId = groups[0].id;
								}

								fillGroups(groupId);
								afterAll();
							});
						} else {
							fillGroups(groupId);
							afterAll();
						}
					} else {
						fillGroups(groupId);
						afterAll();
					}
				}

				Dialogs.AddDial.refreshCustomPreviewState();
				// set events
				document.getElementById('addDialog_title').addEventListener(
					'focus',
					function () {
						Dialogs.AddDial.focusTitle();
					},
					false
				);
				document.getElementById('addDialog_group').addEventListener(
					'change',
					function () {
						Dialogs.AddDial.changeGroup();
					},
					false
				);
				const radioButtonsPreviewType = document.querySelectorAll(
					'.addDialog_selectPreviewTypeBlock input'
				);
				for (let i = 0; i !== radioButtonsPreviewType.length; i++) {
					radioButtonsPreviewType[i].addEventListener(
						'click',
						function () {
							Dialogs.AddDial.refreshCustomPreviewState();
						},
						false
					);
				}
				document.getElementById('addDialog_uploadFile').addEventListener(
					'change',
					function () {
						Dialogs.AddDial.selectLocalFile();
					},
					false
				);
				document.getElementById('addDialog_default_image').addEventListener(
					'change',
					function () {
						Dialogs.AddDial.selectDefaultPreview(
							document.getElementById('addDialog_default_image')
						);
					},
					false
				);
				document.getElementById('addDialog_default_image_ext').addEventListener(
					'change',
					function () {
						Dialogs.AddDial.selectDefaultPreview(
							document.getElementById('addDialog_default_image_ext')
						);
					},
					false
				);
				document.getElementById('addDialog_uploadFileContainer').addEventListener(
					'click',
					function () {
						document
							.getElementById('addDialog_uploadFileContainer')
							.getElementsByTagName('input')[0]
							.click();
					},
					false
				);
				document.getElementById('addDialog_refreshPreview').addEventListener(
					'click',
					function () {
						Dialogs.AddDial.refreshPreview();
					},
					false
				);
				that.AddDial.applyAutoPreviewEnabled();
			},
		});
	},
	AddDial: {
		pickedUserPreview: null,
		setPickedUserPreview: function (pickedUserPreview) {
			const cb = document.getElementById('addDialog_useCustomPreview');

			if (!cb.checked) {
				cb.click();
			}

			this.pickedUserPreview = pickedUserPreview;
			document.getElementById('addDialog_image_url').value = pickedUserPreview.url;
			document.getElementById('addDialog_image_url').removeAttribute('autotext');
			this.refreshPreview();
		},
		applyAutoPreviewEnabled: function () {
			const enabled = document.getElementById('addDialog_autoupdate_preview_enable').checked;
			const interval = document.getElementById('addDialog_autoupdate_preview_interval');
			const intervalType = document.getElementById('addDialog_autoupdate_preview_interval_type');

			if (enabled) {
				interval.removeAttribute('disabled');
				intervalType.removeAttribute('disabled');
			} else {
				interval.setAttribute('disabled', 1);
				intervalType.setAttribute('disabled', 1);
			}
		},
		showFastUserPics: function () {
			const { Dialogs, SpeedDialMisc } = fvdSpeedDial;
			const wrapper = document.getElementById('addDialog_wrapper');

			if (!wrapper) {
				return;
			}

			wrapper.removeAttribute('withPreview');
			const dialUrlElem = document.getElementById('addDialog_url');
			let url = dialUrlElem.getAttribute('display-url') || dialUrlElem.value;
			const urlLower = url.toLowerCase();

			if (urlLower.indexOf('http://') === -1 && urlLower.indexOf('https://') === -1) {
				url = SpeedDialMisc.addProtocolToURL(url);
			} else {
				url = SpeedDialMisc.changeProtocolToHTTPS(url);
			}

			const parsed = Utils.parseUrl(url);

			if (!parsed || !parsed.host) {
				return;
			}

			const tmp = parsed.host.split('.');

			if (tmp.length < 2) {
				return;
			}

			const zone = tmp[tmp.length - 1];

			if (zone.length < 2) {
				return;
			}

			Dialogs.PicsUserPics.cancelCurrentRequests();
			Dialogs.PicsUserPics.request(
				'listing.php',
				{
					p: 0,
					order: 'rating',
					host: parsed.host,
					on_page: 10,
				},
				function (error, data) {
					if (error) {
						console.log('Fail get preview pics', error);
						return;
					}

					if (data.previews.length > 0) {
						wrapper.setAttribute('withPreview', 1);
						document.getElementById('addDialogPickImages').scrollTop = 0;
						const container = document.querySelector('#addDialogPickImages .picsContainer');
						while (container.firstChild) {
							container.removeChild(container.firstChild);
						}
						data.previews.forEach(function (preview) {
							const previewElem = Dialogs.PicsUserPics.buildElem(
								preview,
								{
									resultCallback: function (preview) {
										Dialogs.AddDial.setPickedUserPreview(preview);
									},
								},
								{
									close: function () {
										wrapper.removeAttribute('withPreview');
									},
								}
							);
							container.appendChild(previewElem);
						});
					} else {
						console.log('Not found previews');
					}
				}
			);
		},
		refreshCustomPreviewState: function () {
			const { SpeedDial } = fvdSpeedDial;
			const useCustomPreview = document.getElementById('addDialog_useCustomPreview').checked;
			const useAutoPreview = document.getElementById('addDialog_useAutoPreview').checked;
			const customPreviewBlock = document.getElementById('addDialog_customPreviewBlock');
			const autoPreviewBlock = document.getElementById('addDialog_autoPreviewBlock');

			if (useCustomPreview) {
				customPreviewBlock.removeAttribute('hidden');
			} else {
				customPreviewBlock.setAttribute('hidden', true);
			}

			if (
				useAutoPreview
				&& Config.AUTOUPDATE_PREVIEW_ENABLED
				&& SpeedDial.currentDisplayType() === 'speeddial'
			) {
				autoPreviewBlock.removeAttribute('hidden');
			} else {
				autoPreviewBlock.setAttribute('hidden', true);
			}
		},
		getTitle: function (callback) {
			const { SpeedDialMisc } = fvdSpeedDial;
			const addDialogURL = document.getElementById('addDialog_url');

			if (addDialogURL) {
				let url = addDialogURL.value;

				if (!Utils.isValidUrl(url)) {
					url = SpeedDialMisc.addProtocolToURL(url);
				}

				const parsed = Utils.parseUrl(url);

				if (!parsed || !parsed.host || String(parsed.host).split('.').pop().length < 2) return;

				const titleElement = document.getElementById('addDialog_title');
				const currentTitle = titleElement ? String(titleElement.value) : '';

				if (!currentTitle || currentTitle === _('dialog_add_dial_dynamic_title')) {
					Utils.getTitleForUrl(
						url,
						function (title) {
							if (title) {
								document.getElementById('addDialog_title').value = title;
								document.getElementById('addDialog_title').removeAttribute('autoText');
							}

							if (callback) {
								callback(title);
							}
						},
						true
					);
				}
			} else {
				if (callback) {
					callback('');
				}
			}
		},
		changeGroup: function () {
			const groupValue = document.getElementById('addDialog_group').value;
			const groupName = document.getElementById('addDialog_groupName').parentNode.parentNode;

			if (groupValue === 0) {
				groupName.removeAttribute('hidden');
				document.getElementById('addDialog_groupName').focus();
			} else {
				groupName.setAttribute('hidden', true);
			}
		},
		focusTitle: function () {
			try {
				const title = document.getElementById('addDialog_title').value;

				if (!title) {
					const url = document.getElementById('addDialog_url').value;
					let host = Utils.parseUrl(url, 'host');

					if (host) {
						host = host.charAt(0).toUpperCase() + host.slice(1);
						document.getElementById('addDialog_title').value = host;
					}
				}
			} catch (ex) {
				console.warn(ex);
			}
		},
		localFileChanged: function () {
			return document
				.querySelector('#addDialog_uploadFileContainer input')
				.getAttribute('fvdsd-changed');
		},

		selectLocalFile: function () {
			const that = this;
			const { SpeedDial, ThumbMaker, Dialogs } = fvdSpeedDial;
			try {
				const file = document.querySelector('#addDialog_uploadFileContainer input').files[0];

				if (file.type.indexOf('image/') !== 0) {
					that.errorToField(
						document.getElementById('addDialog_image_url'),
						document.body,
						_('error_not_image')
					);
				} else {
					document
						.querySelector('#addDialog_uploadFileContainer input')
						.setAttribute('fvdsd-changed', 1);
					const reader = new FileReader();
					reader.onload = function () {
						ThumbMaker.getImageDataPath(
							{
								imgUrl: reader.result,
								screenWidth: SpeedDial.getMaxCellWidth(),
							},
							function (dataUrl) {
								const img = new Image();
								img.onload = function () {
									const previewCell = document.getElementById('addDialog_previewCell');
									previewCell.setAttribute('syncScreen', dataUrl);
									previewCell.setAttribute('syncScreenWidth', img.width);
									previewCell.setAttribute('syncScreenHeight', img.height);
									that.refreshPreview();
								};
								img.src = dataUrl;
								document.getElementById('addDialog_image_url').removeAttribute('autoText');
								document.getElementById('addDialog_image_url').value = Dialogs.LOCAL_FILE_URL;
							}
						);
					};
					reader.readAsDataURL(file);
				}
			} catch (ex) {
				console.warn(ex);
			}
		},
		refreshPreview: function () {
			const { Dialogs } = fvdSpeedDial;

			const previewCell = document.getElementById('addDialog_previewCell');
			const screen = previewCell.getElementsByClassName('preview-image')[0];
			const backgroundUrl = document.getElementById('addDialog_image_url').value;

			if (backgroundUrl === Dialogs.LOCAL_FILE_URL) {
				previewCell.setAttribute('filled', 1);
				Utils.setUrlPreview(
					{
						elem: screen,
						size: {
							width: screen.offsetWidth,
							height: screen.offsetHeight,
						},
					},
					{
						url: previewCell.getAttribute('syncScreen'),
					}
				);
			} else if (backgroundUrl) {
				previewCell.setAttribute('filled', 1);
				Utils.setUrlPreview(
					{
						elem: screen,
						size: {
							width: screen.offsetWidth,
							height: screen.offsetHeight,
						},
					},
					{
						url: backgroundUrl,
					}
				);
			} else {
				if (previewCell.hasAttribute('screen')) {
					Utils.setScreenPreview(
						document
							.getElementById('addDialog_previewCell')
							.getElementsByClassName('preview-image')[0],
						previewCell.getAttribute('screen')
					);
					previewCell.setAttribute('filled', 1);
				} else {
					previewCell.setAttribute('filled', 0);
					screen.style.background = '';
				}
			}
		},
		selectDefaultPreview: function (fromSelect) {
			const url = fromSelect.value;
			const extSelectContainer = document.getElementById('addDialog_default_image_extContainer');
			const extSelect = document.getElementById('addDialog_default_image_ext');
			const select = document.getElementById('addDialog_default_image');

			if (url.indexOf('|') === -1) {
				document.getElementById('addDialog_image_url').removeAttribute('autoText');
				document.getElementById('addDialog_image_url').value = url;

				if (fromSelect !== extSelect) {
					extSelectContainer.setAttribute('hidden', true);
				}

				this.refreshPreview();
			} else {
				const selectedText = select.options[select.selectedIndex].text;
				const urls = url.split('|');
				extSelect.options.length = 0;
				for (let i = 0; i !== urls.length; i++) {
					extSelect.options[extSelect.options.length] = new Option(
						selectedText + ' #' + (i + 1),
						urls[i]
					);
				}
				extSelectContainer.removeAttribute('hidden');
				this.selectDefaultPreview(extSelect);
			}
		},
	},
	_title: function (code) {
		return _('dialog_title_' + code);
	},
};

export default DialogsModule;
