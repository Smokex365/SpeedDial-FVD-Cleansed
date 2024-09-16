import UniClick from '../../_external/uniclick.js';
import Templates from '../../templates.js';
import { _ } from '../../localizer.js';
import { _b, getCleanUrl, Utils, isAffiliatedURL } from '../../utils.js';
import SpeedDial from '../speeddial.js';
import Scrolling from '../scrolling.js';
import RecentlyClosed from '../../storage/recentlyclosed.js';
import Sync from '../../sync/tab.js';
import Config from '../../config.js';
import { defaultGroupTitles } from '../../constants.js';
import Analytics from '../../bg/google-analytics.js';

const mirrorSurfaceDistance = 0;
const CLICK_SCREEN_OVER = 100;
const cellsMirrors = {};
const mirrorsElemsAttrs = {};
const mirrorsCheckInterval = null;
const mirrorUpdatePeriod = 100;
const mirrorFadeTimeout = 200;

const SpeedDialBuilderModule = function (fvdSpeedDial) {
	const that = this;
	this.fvdSpeedDial = fvdSpeedDial;
};

SpeedDialBuilderModule.prototype = {
	_effSizeDim: function (dim) {
		const {
			fvdSpeedDial: { SpeedDial },
		} = this;
		return dim + SpeedDial._dialBodyPadding * 2;
	},

	listViewContainerSize: function (container, countInRow) {
		const {
			fvdSpeedDial: { SpeedDial },
		} = this;

		const countChilds = container.childNodes.length;
		const countInCol = this.listElemCountInCol(countInRow, countChilds);

		if (countInRow > countChilds) {
			countInRow = countChilds;
		}

		const size = SpeedDial._currentListElemSize();

		const width = size.width * countInRow + SpeedDial._listElemMarginX * countInRow;
		const height = size.height * countInCol + SpeedDial._listElemMarginY * countInCol;

		return {
			width: width,
			height: height,
		};
	},

	listCol: function () {
		const row = document.createElement('div');

		row.className = 'listCol';
		return row;
	},

	listElemCountInCol: function (inRow, totalCount) {
		return Math.ceil(totalCount / inRow);
	},

	listElem: function (num, countInCol, data, displayType, adv) {
		const {
			fvdSpeedDial: { SpeedDial, ContextMenus },
		} = this;

		const dataPreview = this.getDialPreviewData(data);

		const cell = Templates.clone('prototype_' + displayType + 'ListElem');

		cell.setAttribute('id', 'dialCell_' + data.id);
		cell.setAttribute('type', displayType);
		const textNode = cell.getElementsByClassName('text')[0];

		if (isAffiliatedURL(data.url)) {
			const editButton = cell.getElementsByClassName('edit')[0];
			const speedDialIcons = cell.getElementsByClassName('speedDialIcons')[0];
			speedDialIcons.removeChild(editButton);
		}

		textNode.textContent = data.displayTitle;
		const favicon = cell.getElementsByTagName('img')[0];

		favicon.setAttribute('src', Utils.getFavicon(data.url));

		this._assignEvents(cell, data, displayType, 'list');
		ContextMenus.assignToElem(cell, displayType);
		let countInColInd = countInCol;
		let numInd = num;

		if (typeof adv === 'object' && adv.total && adv.countInRow) {
			if (
				countInCol === 2
				&& ((adv.total === 4 && adv.countInRow === 3 && num > 1)
					|| (adv.total === 5 && adv.countInRow === 4 && num > 2))
			) {
				countInColInd = 1;
				numInd = num - 1;
			}
		}

		this.setListElemPos(cell, numInd, countInColInd);
		cell.style.position = 'absolute';

		if (displayType === 'speeddial') {
			cell.setAttribute('position', data.position);
		}

		const size = SpeedDial._currentListElemSize();

		cell.style.height = size.height + 'px';

		// for list view type selection

		if (!data.displayTitle) {
			if (displayType !== 'recentlyclosed') {
				if (data.get_screen_method === 'manual') {
					cell.setAttribute('_title', _('newtab_click_to_get_title'));
				} else {
					cell.setAttribute('_title', _('newtab_getting_title'));

					SpeedDial.ThumbManager.hiddenCaptureThumb({
						data: data,
						type: cell.getAttribute('type'),
						saveImage: false,
						resetScreenMaked: false,
						interval: SpeedDial.currentGroupId(),
						elemId: cell.getAttribute('id'),
						elem: cell,
					});
				}

				cell.setAttribute('notitle', 1);
			} else {
				cell.setAttribute('_title', '');
			}
		} else {
			cell.setAttribute('_title', data.displayTitle);
		}

		cell.setAttribute('_url', dataPreview.url);

		if (displayType === 'mostvisited') {
			const viewsText = cell.getElementsByClassName('views')[0];
			const inGroup = cell.getElementsByClassName('ingroup')[0];

			const views = _('newtab_mostvisited_views');
			const ingroup = _('newtab_mostvisited_ingroup');

			viewsText.textContent = views + ': ' + data.totalVisits;
			inGroup.textContent = ingroup + ': ' + data.inGroup;
		}

		return cell;
	},

	setListElemPos: function (cell, num, countInCol) {
		const pos = this._listElemPos(num, countInCol);

		cell.style.top = pos.y + 'px';
		cell.style.left = pos.x + 'px';
		cell.setAttribute('col', pos.col);
		cell.setAttribute('row', pos.row);
		cell.setAttribute('index', num);
	},

	plusCell: function (num, countInRow, size, countRowsTotal) {
		const {
			fvdSpeedDial: { SpeedDial, Dialogs },
		} = this;

		const cell = Templates.clone('prototype_speeddialCell');

		cell.removeAttribute('id');

		cell.setAttribute('width', size.width);
		cell.setAttribute('height', size.height);

		const dialPos = this._getDialXY(num, countInRow, size);

		cell.style.left = dialPos.x + 'px';
		cell.style.top = dialPos.y + 'px';

		cell.setAttribute('col', dialPos.col);
		cell.setAttribute('row', dialPos.row);

		const body = cell.getElementsByClassName('body')[0];

		body.style.width = this._effSizeDim(size.width) + 'px';
		body.style.height = this._effSizeDim(size.height) + 'px';
		cell.style.width = this._effSizeDim(size.width) + SpeedDial._dialBodyPadding * 2 + 'px';

		cell.setAttribute('type', 'plus');

		this.setDialSkew(cell, dialPos, countInRow, size, countRowsTotal);

		// events

		cell.onclick = function (event) {
			if (event.button === 0) {
				Dialogs.addDial();
			}
		};

		cell.querySelector('.footer span').innerHTML = '&nbsp;';

		return cell;
	},

	cellsContainerHeight: function (countCells, countInRow, size) {
		const {
			fvdSpeedDial: { SpeedDial, Prefs },
		} = this;

		let height = 0;

		const num = countCells - 1;
		const dialPos = this._getDialXY(num, countInRow, size);

		height = dialPos.y + size.height + SpeedDial.cellsMarginY();

		if (Prefs.get('sd.display_mode') === 'fancy') {
			height += 100; // experimental
		}

		return height;
	},

	refreshLastRow: function () {
		const _dials = document.querySelectorAll('.newtabCell');

		let maxRow = 0;
		let i;
		let row;

		for (i = 0; i !== _dials.length; i++) {
			_dials[i].removeAttribute('lastrow');

			row = parseInt(_dials[i].getAttribute('row'), 10);

			if (row > maxRow) {
				maxRow = row;
			}
		}

		for (i = 0; i !== _dials.length; i++) {
			row = parseInt(_dials[i].getAttribute('row'), 10);

			if (row === maxRow) {
				_dials[i].setAttribute('lastrow', 1);
			}
		}
	},

	// if have position changes of dials, this function reorder dials list and change visually their positions
	refreshDialsByPositions: function (countInRow, displayMode, size) {
		const {
			fvdSpeedDial: { Prefs, Scrolling },
		} = this;

		let i;
		let _dials;
		let dials;

		if (displayMode === 'list') {
			_dials = document.getElementsByClassName('newtabListElem');
			const countInCol = this.listElemCountInCol(countInRow.cols, _dials.length);

			if (typeof countInRow === 'object') {
				countInRow = countInRow.cols;
			}

			// to array
			dials = [];
			for (i = 0; i !== _dials.length; i++) {
				dials.push(_dials[i]);
			}

			// order list
			dials.sort(function (a, b) {
				return a.getAttribute('position') - b.getAttribute('position');
			});

			for (i = 0; i !== dials.length; i++) {
				this.setListElemPos(dials[i], i, countInCol);
			}
		} else {
			_dials = document.querySelectorAll('.newtabCell[type=speeddial]');

			// need to recalc in horizontal mode
			if (Scrolling.activeScrollingType() === 'horizontal') {
				countInRow = SpeedDial.cellsInRowMax(null, null, {
					objects: _dials.length,
				});
			}

			if (typeof countInRow === 'object') {
				if (countInRow.rows) {
					countInRow = Math.ceil(_dials.length / countInRow.rows);

					if (_b(Prefs.get('sd.display_plus_cells'))) {
						countInRow++;
					}
				} else {
					countInRow = countInRow.cols;
				}
			}

			// to array
			dials = [];
			for (i = 0; i !== _dials.length; i++) {
				if (_dials[i].hasAttribute('type') && _dials[i].getAttribute('type') === 'plus') {
					continue;
				}

				dials.push(_dials[i]);
			}

			// order list
			dials.sort(function (a, b) {
				return a.getAttribute('position') - b.getAttribute('position');
			});

			const countRows = document.getElementById('cellsContainer').getAttribute('rows');

			for (i = 0; i !== dials.length; i++) {
				const cell = dials[i];
				const dialPos = this._getDialXY(i, countInRow, size);

				this.setDialPosition(cell, dialPos);
				this.setDialSkew(cell, dialPos, countInRow, size, countRows);
			}
		}

		this.refreshLastRow();
	},

	skewAngle: function (col, row, middle, countRowsTotal, inRow) {
		const skewMax = 1.7;
		const middleRow = Math.floor(countRowsTotal / 2);

		if (inRow % 2 === 0) {
			middle++;
		}

		const skewDeg = (skewMax * Math.abs(col - middle)) / middle;
		let type = 'top';

		if (row >= middleRow) {
			type = 'down';
		}

		if (type === 'down') {
		}

		return {
			deg: skewDeg,
			type: type,
		};
	},

	rotateAngle: function (col, row, middle, countRowsTotal, inRow) {
		const {
			fvdSpeedDial: { Prefs },
		} = this;

		if (inRow % 2 === 0) {
			inRow++;
			middle = Math.ceil(inRow / 2) - 1;

			if (col >= middle) {
				col++;
			}
		}

		let skewMax = Prefs.get('sd.rotate_angle_max');
		let newSkewMax;
		let originLeft;
		const middleRow = Math.floor(countRowsTotal / 2);

		newSkewMax = (inRow / 10) * skewMax;

		if (newSkewMax > skewMax) {
			newSkewMax = skewMax;
		}

		skewMax = newSkewMax;

		const fixedMiddle = false;
		const skewDeg = (skewMax * Math.abs(col - middle)) / middle;
		let type = 'top';

		if (row >= middleRow) {
			type = 'down';
		}

		if (type === 'down') {
		}

		const originTop = 0;

		if (skewDeg === 0) {
			originLeft = 0;
		} else {
			if (col <= middle) {
				originLeft = 100 + (middle - col - 1) * 50;
			} else {
				originLeft = 0 - (col - middle - 1) * 50;
			}
		}

		return {
			deg: skewDeg,
			type: type,
			originLeft: originLeft,
			originTop: originTop,
		};
	},

	dialZ: function (col, row, middle, countRowsTotal, inRow, size) {
		// get z pos
		let z = 0;

		if (col !== middle) {
			let c = middle;
			const inc = col < middle ? -1 : 1;

			while (c !== col) {
				z
					= z
					+ size.width
						* Math.sin((this.rotateAngle(c, row, middle, countRowsTotal, inRow).deg * Math.PI) / 180);
				c += inc;
			}
		}

		return z;
	},

	setDialSkew: function (cell, dialPos, inRow, size, countRowsTotal) {
		const {
			fvdSpeedDial: { Prefs },
		} = this;

		if (Prefs.get('sd.display_mode') !== 'fancy') {
			return;
		}

		const middle = Math.ceil(inRow / 2) - 1;
		let angle = 0;

		if (dialPos.col !== middle || inRow % 2 === 0) {
			angle = this.rotateAngle(dialPos.col, dialPos.row, middle, countRowsTotal, inRow);

			if (dialPos.col > middle) {
				angle.deg = -angle.deg;
			}

			cell.style.webkitTransform = 'rotateY(' + angle.deg + 'deg)'; //"rotateY("+(angle.deg * 40)+"deg)" //"skewY("+angle.deg+"deg)";
			cell.style.webkitTransformOrigin = angle.originLeft + '% ' + angle.originTop + '%';
			cell.setAttribute('skew', angle.deg);
		} else {
			cell.style.webkitTransform = '';
		}

		let relPos = dialPos.col;

		if (relPos > middle) {
			relPos = inRow - 1 - dialPos.col;
		}
	},

	setDialPosition: function (cell, dialPos) {
		cell.style.left = dialPos.x + 'px';
		cell.style.top = dialPos.y + 'px';

		cell.setAttribute('row', dialPos.row);
		cell.setAttribute('col', dialPos.col);
	},

	cellTitle: function (data) {
		const params = {
			url: data.url,
			title: data.title,
		};
		const title = String(params.title + '\n' + params.url);

		return this.cutTitle(title);
	},

	cutTitle: function (title) {
		const limit = 100;

		title = String(title);

		if (title.length > limit) title = title.substr(0, limit) + '...';

		return title;
	},

	getDialPreviewData: function (data) {
		const previewData = {};
		const override = {};

		if (data.display_url) {
			override.url = data.display_url;
		}

		for (const k in data) {
			let v = data[k];

			if (override && override[k]) {
				v = override[k];
			}

			previewData[k] = v;
		}
		return previewData;
	},

	cell: function (data, num, countInRow, displayType, displayMode, size, countRowsTotal) {
		const {
			fvdSpeedDial: { Prefs, SpeedDial, ContextMenus },
		} = this;

		const cell = Templates.clone('prototype_' + displayType + 'Cell');
		const dataPreview = this.getDialPreviewData(data);

		cell.setAttribute('data-url', data.url);

		if (data.display_url) {
			cell.setAttribute('data-display-url', data.display_url);
		}

		cell.setAttribute('width', size.width);
		cell.setAttribute('height', size.height);
		cell.setAttribute('id', 'dialCell_' + data.id);
		cell.setAttribute('type', displayType);

		const dialPos = this._getDialXY(num, countInRow, size);

		// postitioning things
		this.setDialPosition(cell, dialPos, countInRow);
		this.setDialSkew(cell, dialPos, countInRow, size, countRowsTotal);
		cell.setAttribute('position', data.position);

		if (data.displayDialBg) {
			cell.setAttribute('displayDialBg', data.displayDialBg);
		}

		if (isAffiliatedURL(data.url)) {
			const screen = cell.querySelector(".screen");
			const add = document.createElement("span");
			const imgWrapper = document.createElement("span");
			const addImg = document.createElement("img");
			addImg.src = '/images/info.svg';
			addImg.width = 20;
			addImg.height = 20;
			imgWrapper.setAttribute("data-tooltip", _('newtab_dial_info'));
			imgWrapper.className = 'info-icon-wrapper';
			imgWrapper.appendChild(addImg);
			add.appendChild(imgWrapper);
			add.className = Prefs.get('sd.display_mode') === 'fancy' ? "add" : "add-standart";
			screen.appendChild(add);
		}

		if (Prefs.get('sd.display_mode') === "standard" && isAffiliatedURL(data.url)) {
			const speedDialIcons = cell.querySelector(".speedDialIcons");
			const editButton = speedDialIcons.querySelector(".edit");
			speedDialIcons.removeChild(editButton);
		}

		const body = cell.getElementsByClassName('body')[0];

		body.style.width = this._effSizeDim(size.width) + 'px';
		body.style.height = this._effSizeDim(size.height) + 'px';
		cell.style.width
			= this._effSizeDim(size.width) + fvdSpeedDial.SpeedDial._dialBodyPadding * 2 + 'px';

		const titleBlock = cell.getElementsByClassName('head')[0].getElementsByTagName('span')[0];

		if (data.displayTitle) {
			titleBlock.textContent = data.displayTitle;
			titleBlock.setAttribute('title', this.cutTitle(data.displayTitle));
		} else {
			if (data.get_screen_method === 'manual') {
				titleBlock.textContent = _('newtab_click_to_get_title');
			} else {
				titleBlock.textContent = _('newtab_getting_title');
			}
		}

		if (Prefs.get('sd.display_mode') === 'fancy' || true) {
			cell.setAttribute(
				'title',
				this.cellTitle({
					title: titleBlock.textContent,
					url: dataPreview.url,
				})
			);
		}

		if (!data.displayTitle) {
			cell.setAttribute('notitle', 1);
		}

		const footerTitleBlock = cell
			.getElementsByClassName('footer')[0]
			.getElementsByTagName('span')[0];

		footerTitleBlock.textContent = Utils.urlToCompareForm(dataPreview.url);

		const favicon = cell.getElementsByClassName('head')[0].getElementsByTagName('img')[0];

		favicon.setAttribute('src', Utils.getFavicon(data.url));

		const that = this;
		const screenParent = body.getElementsByClassName('screenParent')[0];

		SpeedDial.ThumbManager.setThumbToElement({
			elem: cell,
			data: data,
			cellSize: size,
			interval: SpeedDial.currentGroupId(),
			nocache: data.thumb_version,
		});

		const menuOverlay = cell.getElementsByClassName('menuOverlay')[0];

		if (displayType === 'speeddial') {
			const clicksText = menuOverlay.getElementsByClassName('text')[0];

			const spanClicksCount = document.createElement('span');

			spanClicksCount.className = 'clicksCount';
			spanClicksCount.textContent = data.clicks;
			clicksText.appendChild(document.createTextNode(_('newtab_dial_clicks') + ': '));
			clicksText.appendChild(spanClicksCount);
		} else if (displayType === 'mostvisited') {
			// set views and in group
			const viewsText = cell.getElementsByClassName('views')[0];
			const inGroup = cell.getElementsByClassName('ingroup')[0];

			let views = null;
			let ingroup = null;

			if (displayMode !== 'small') {
				views = _('newtab_mostvisited_views');
				ingroup = _('newtab_mostvisited_ingroup');
			} else {
				views = _('newtab_mostvisited_views_small');
				ingroup = _('newtab_mostvisited_ingroup_small');
			}

			viewsText.textContent = views + ': ' + data.totalVisits;
			inGroup.textContent = ingroup + ': ' + data.inGroup;
		}

		// context menu
		ContextMenus.assignToElem(cell, displayType);

		// assign events
		this._assignEvents(cell, data, displayType, displayMode);

		return cell;
	},

	documentTitle: function (text) {
		text = String(text).split('(')[0].trim();

		if (text === _('newtab_default') || text === 'Default') {
			text = '';
		} else {
			text = ' - ' + text;
		}

		document.title = _('newtab_title') + text;
	},

	groupsItem: function (text, groupId, countDials) {
		const { fvdSpeedDial } = this;
		const { SpeedDial, ContextMenus } = fvdSpeedDial;

		const item = document.createElement('div');

		item.setAttribute('class', groupId !== 'restore' ? 'group' : 'group restore-session');
		const spanName = document.createElement('span');
		const spanCount = document.createElement('span');

		spanName.className = 'groupName';

		if (typeof countDials !== 'undefined') {
			spanName.textContent = text;
			spanCount.textContent = ' (' + countDials + ')';
			spanCount.className = 'groupCount';
		} else {
			spanName.textContent = text;
		}

		item.appendChild(spanName);
		item.appendChild(spanCount);

		// prevents dbl click
		item.addEventListener(
			'dblclick',
			function (event) {
				event.stopPropagation();
			},
			false
		);

		if (groupId !== 'restore') {
			item.addEventListener(
				'click',
				function (event) {
					fvdSpeedDial.StorageSD.getGroupTitleById(groupId, (groupTitle) => {
						const metricParams = {
							dial_group: groupTitle,
						};

						const dialsRequiredGroups = [defaultGroupTitles.recommend.value, defaultGroupTitles.sponsoredst.value];

						if (dialsRequiredGroups.includes(groupTitle)) {
							fvdSpeedDial.StorageSD.getDialListByGroupId(groupId, (groupDials) => {
								metricParams.items = groupDials.map((item) => ({
									item_name: item.title,
									item_url: fvdSpeedDial.SpeedDialMisc.getCleanRedirectTxt(item.display_url),
								}));
								Analytics.fireGroupVisitEvent(metricParams);
							});
						} else {
							Analytics.fireGroupVisitEvent(metricParams);
						}

						// after group clicking, fires tab update listener, that fires GA page_view event
						// by bellow logic preventing fake page view event;
						fvdSpeedDial.localStorage.setItem('preventPageViewEvent', true);
						setTimeout(() => {
							fvdSpeedDial.localStorage.setItem('preventPageViewEvent', false);
						}, 1000);

					});

					SpeedDial.setCurrentGroupId(groupId);
				},
				false
			);

			// special for right click event. if mouse up - activate group, it uses because context menu prevent propagation of "click" event for right button
			item.addEventListener(
				'mouseup',
				function (event) {
					if (event.button === 2) {
						SpeedDial.setCurrentGroupId(groupId);
					}
				},
				false
			);
		} else {
			item.addEventListener(
				'click',
				function (event) {
					chrome.runtime.sendMessage({
						action: 'previousSession:restore',
					});
				},
				false
			);
		}

		if (SpeedDial.currentGroupId() === groupId) {
			item.setAttribute('current', '1');

			try {
				SpeedDial.Builder.documentTitle(text);
			} catch (ex) {
				console.warn(ex);
			}
		} else {
			item.setAttribute('current', '0');
		}

		item.setAttribute('id', 'group_select_' + groupId);
		item.setAttribute('title', item.textContent);

		return item;
	},

	groupsAdditionalGroupsButton: function () {
		const { fvdSpeedDial } = this;
		const { SpeedDial, ContextMenus } = fvdSpeedDial;

		const additionalGroupsButton = document.createElement('div');

		additionalGroupsButton.className = 'additionalGroupsButton';
		const img = document.createElement('div');

		img.className = 'img';
		additionalGroupsButton.appendChild(img);

		additionalGroupsButton.addEventListener(
			'click',
			function (event) {
				SpeedDial.Groups.displayAdditionalList();
				event.stopPropagation();
			},
			false
		);

		return additionalGroupsButton;
	},

	groupsAdditionalList: function (groups) {
		const { fvdSpeedDial } = this;
		const { SpeedDial, ContextMenus, Dialogs } = fvdSpeedDial;
		const that = this;

		const container = document.createElement('div');
		const list = document.createElement('div');
		const manageGroups = document.createElement('div');

		container.className = 'additionalGroupsList';
		list.className = 'additionalGroupsElemList';

		for (let i = 0; i !== groups.length; i++) {
			const group = groups[i];

			(function (group) {
				const groupElem = that.groupsItem(group.name, group.id, group.count_dials);

				ContextMenus.assignToElem(groupElem, 'speeddialGroup');
				//container.appendChild( groupElem );
				list.appendChild(groupElem);
			})(group);
		}

		container.appendChild(list);

		manageGroups.className = 'manageGroups';
		manageGroups.textContent = _('newtab_manage_groups');
		manageGroups.addEventListener(
			'click',
			function () {
				Dialogs.manageGroups();
			},
			false
		);

		container.appendChild(document.createElement('hr'));
		container.appendChild(manageGroups);
		return container;
	},

	_getDialXY: function (num, countInRow, size) {
		const {
			fvdSpeedDial: { SpeedDial },
		} = this;

		const xInCells = num % countInRow;
		const yInCells = Math.floor(num / countInRow);

		const x = xInCells * size.width + (xInCells > 0 ? xInCells * SpeedDial._cellsMarginX : 0);
		const y = yInCells * size.height + (yInCells > 0 ? yInCells * SpeedDial.cellsMarginY() : 0);

		return {
			x: x,
			y: y,
			row: yInCells,
			col: xInCells,
		};
	},

	_listElemPos: function (num, countInCol) {
		const {
			fvdSpeedDial: { SpeedDial },
		} = this;

		const yInCells = num % countInCol;
		const xInCells = Math.floor(num / countInCol);

		const size = SpeedDial._currentListElemSize();

		const x = xInCells * size.width + (xInCells > 0 ? xInCells * SpeedDial._listElemMarginX : 0);
		const y = yInCells * size.height + (yInCells > 0 ? yInCells * SpeedDial._listElemMarginY : 0);

		return {
			x: x,
			y: y,
			col: xInCells,
			row: yInCells,
		};
	},
	_assignEvents: function (cell, data, displayType, displayMode) {
		const {
			fvdSpeedDial: { SpeedDial, SpeedDialMisc, StorageSD, Prefs, Dialogs, MostVisited },
		} = this;

		let clickEventAssigned = false;

		// prevent scrolling by middel button on dial
		cell.addEventListener('mousedown', function (event) {
			event.preventDefault();
		});

		if (displayMode !== 'list') {
			const favicon = cell.getElementsByClassName('head')[0].getElementsByTagName('img')[0];
			// prevent dragging on favicon iamge

			favicon.addEventListener(
				'mousedown',
				function (event) {
					event.preventDefault();
				},
				false
			);

			if (data.thumb_source_type === 'screen' && data.get_screen_method === 'manual') {
				if (data.screen_maked === 0) {
					clickEventAssigned = true;
					// onclick make screen
					cell.addEventListener(
						'click',
						function (event) {
							if (cell.hasAttribute('noclick')) {
								cell.removeAttribute('noclick');
								return;
							}

							if (event.button === 0) {
								SpeedDial.makeThumb(data.id, data.url, displayType, data.screen_delay);
							}

							event.stopPropagation();
						},
						false
					);
				}
			}
		}

		if (!clickEventAssigned) {
			if (!data.displayTitle && data.get_screen_method === 'manual') {
				clickEventAssigned = true;
				// onclick make screen
				cell.addEventListener(
					'click',
					function (event) {
						if (cell.hasAttribute('noclick')) {
							cell.removeAttribute('noclick');
							return;
						}

						if (event.button === 0) {
							SpeedDial.makeThumb(data.id, data.url, displayType, data.screen_delay, false);
						}

						event.stopPropagation();
					},
					false
				);
			}
		}
		// events for all types

		// add dbl click listener (empty)
		cell.addEventListener(
			'dblclick',
			function (event) {
				event.stopPropagation();
			},
			false
		);

		if (!clickEventAssigned) {
			let allowAddClick = true;

			UniClick.add(cell, function (event) {
				if (cell.hasAttribute('noclick')) {
					cell.removeAttribute('noclick');
					return;
				}

				if (displayType === 'speeddial') {
					if (allowAddClick) {
						StorageSD.getGroupTitleById(data.group_id, (groupTitle, group) => {
							const url = getCleanUrl(data.display_url);
							const displayURL = SpeedDial.checkAdMarketplace(data.url, { ignoreVersion: true });
							const redirectURL = SpeedDial.checkAdMarketplace(url, { ignoreVersion: true });
							let affiliation = 'none';

							if (redirectURL.includes('ampxdirect.com') || displayURL.includes('ampxdirect.com')) {
								affiliation = 'admk';
							}

							if (redirectURL.includes('v2i8b.com') || displayURL.includes('v2i8b.com')) {
								affiliation = 'snmx';
							}

							if (redirectURL.includes('kelkoogroup.net') || displayURL.includes('kelkoogroup.net')) {
								affiliation = 'kelk';
							}

							Analytics.fireDialClickEvent({
								title: data.title,
								url: data.display_url ? url :  getCleanUrl(data.url),
								affiliation,
								dial_id: data.id,
								group: groupTitle,
								group_id: data.group_id,
							});
						});
						SpeedDial.addDialClick(data.id);
						allowAddClick = false;
						setTimeout(function () {
							allowAddClick = true;
						}, 10000);
					}
				}

				const data_url = SpeedDial.urlReplace(data.url);
				const openedIn = Utils.Opener.asClicked(data_url, Prefs.get('sd.default_open_in'), event);

				if (displayMode !== 'list' && openedIn === 'current') {
					if (Prefs.get('sd.display_mode') === 'fancy') {
						const cells = document.getElementsByClassName('newtabCell');

						for (let i = 0; i !== cells.length; i++) {
							if (cells[i] === cell) {
								continue;
							}

							cells[i].setAttribute('fadeOut', 1);
						}
					}
				}

				if (displayType === 'recentlyclosed') {
					RecentlyClosed.remove(data.id, function () {
						SpeedDial.dialRemoveAnimate(data.id);
					});
				}

				event.stopPropagation();
			});
		}

		const removeButton = cell.getElementsByClassName('remove')[0];

		removeButton.addEventListener(
			'click',
			function (event) {
				event.stopPropagation();
				let confirmResult = false;

				Utils.Async.chain([
					function (chainCallback) {
						if (!_b(Prefs.get('sd.display_dial_remove_dialog'))) {
							confirmResult = true;
							chainCallback();
						} else {
							Dialogs.confirmCheck(
								_('dlg_confirm_remove_dial_title'),
								_('dlg_confirm_remove_dial_text'),
								_('dlg_dont_show_it_again'),
								false,
								function (result, state) {
									confirmResult = result;

									if (confirmResult && state) {
										Prefs.set('sd.display_dial_remove_dialog', false);
									}

									chainCallback();
								}
							);
						}
					},
					function (chainCallback) {
						if (confirmResult) {
							if (displayType === 'speeddial') {
								Sync.addDataToSync(
									{
										category: 'deleteDials',
										data: data.id,
										translate: 'dial',
									},
									function () {
										StorageSD.deleteDial(data.id, function () {
											SpeedDial.dialRemoveAnimate(data.id);
										});
									}
								);
							} else if (displayType === 'recentlyclosed') {
								RecentlyClosed.remove(data.id, function () {
									SpeedDial.dialRemoveAnimate(data.id);
								});
							} else if (displayType === 'mostvisited') {
								MostVisited.deleteId(data.id, function (result) {
									if (result.result) {
										SpeedDial.dialRemoveAnimate(data.id);
									}
								});
							}
						}
					},
				]);
			},
			false
		);

		if (displayType !== 'recentlyclosed') {
			const editButton = cell.getElementsByClassName('edit')[0];

			if (editButton) {
				editButton.addEventListener(
					'click',
					function (event) {
						if (event.button !== 0) {
							return;
						}
	
						event.stopPropagation();
	
						Dialogs.addDial(data, displayType, false);
					},
					false
				);
			}
			
		}

		if (displayType === 'mostvisited' || displayType === 'recentlyclosed') {
			const denyButton = cell.getElementsByClassName('deny')[0];

			denyButton.addEventListener(
				'click',
				function (event) {
					if (event.button !== 0) {
						return;
					}

					Dialogs.deny({
						type: 'url',
						sign: data.url,
					});

					event.stopPropagation();
				},
				false
			);

			const addButton = cell.getElementsByClassName('add')[0];

			addButton.addEventListener(
				'click',
				function (event) {
					if (event.button !== 0) {
						return;
					}

					if (data.title) {
					} else if (data.auto_title) {
						data.title = data.auto_title;
					}

					Dialogs.addDial(data, 'speeddial', true);
					event.stopPropagation();
				},
				false
			);
		}

		// mostvisited related events
		if (displayType === 'mostvisited') {
			const inGroup = cell.getElementsByClassName('ingroup')[0];

			inGroup.addEventListener(
				'click',
				function (event) {
					Dialogs.viewGroup(data.host);
					event.stopPropagation();
				},
				false
			);
		} else if (displayType === 'recentlyclosed') {
		} else if (displayType === 'speeddial') {
			// speeddial related
			cell.addEventListener(
				'mousedown',
				function (event) {
					if (event.button !== 0) {
						return;
					}

					let isFancyMode = false;

					if (Prefs.get('sd.display_mode') === 'fancy') {
						isFancyMode = true;
					}

					if (isFancyMode) {
						cell.setAttribute('transformBeforeDrag', cell.style.webkitTransform);
						cell.setAttribute('transformOriginBeforeDrag', cell.style.webkitTransformOrigin);
					}

					let needStartDrag = true;

					function _startDragMouseUp() {
						needStartDrag = false;
					}

					cell.addEventListener('mouseup', _startDragMouseUp, false);
					setTimeout(function () {
						cell.removeEventListener('mouseup', _startDragMouseUp);

						if (!needStartDrag) {
							return;
						}

						if (SpeedDial.currentGroupId() === 0) {
							SpeedDialMisc.showCenterScreenNotification(_('newtab_cant_move_dials_in_popular'));
							return;
						}

						SpeedDial.DragAndDrop.startDrag(
							cell,
							function (draggedOn) {
								const dialId = fvdSpeedDial.SpeedDial._getDialIdByCell(cell);

								StorageSD.getDial(dialId, console.log);

								//removeSpecialMirror();
								cell.removeAttribute('transformBeforeDrag');
								cell.removeAttribute('transformOriginBeforeDrag');
								const insertType = draggedOn.getAttribute('insert_type');
								// animate
								let dials = [];

								if (displayMode === 'list') {
									dials = document.getElementsByClassName('newtabListElem');
								} else {
									dials = document.querySelectorAll('.newtabCell[type=speeddial]');
								}

								let maxDialPosition = 0;
								// get max dial position

								for (let i = 0; i !== dials.length; i++) {
									const dialPos = parseInt(dials[i].getAttribute('position'));

									if (dialPos > maxDialPosition) {
										maxDialPosition = dialPos;
									}
								}

								const relDial = {
									position: parseInt(draggedOn.getAttribute('position')),
								};
								const dial = {
									position: parseInt(cell.getAttribute('position')),
								};

								let sign = null;

								if (relDial.position > dial.position) {
									sign = -1;
								} else {
									sign = 1;
								}

								let newDialPosition;

								if (insertType === 'after') {
									if (sign === -1) {
										newDialPosition = relDial.position;
									} else {
										newDialPosition = relDial.position + 1;

										if (newDialPosition > maxDialPosition) {
											newDialPosition = relDial.position;
										}
									}
								} else if (insertType === 'before') {
									if (sign === 1) {
										newDialPosition = relDial.position;
									} else {
										newDialPosition = relDial.position - 1;

										if (newDialPosition < 1) {
											newDialPosition = 1;
										}
									}
								}

								if (newDialPosition === dial.position) {
									// no position changes
									SpeedDial.Builder.refreshDialsByPositions(
										SpeedDial.cellsInRowMax(null, null, {
											objects: function () {
												return document.getElementById('cellsContainer').childNodes.length;
											},
										}),
										displayMode,
										SpeedDial._currentCellSize()
									);

									return;
								}

								const dialsRangeStart = Math.min(newDialPosition, dial.position);
								const dialsRangeEnd = Math.max(newDialPosition, dial.position);

								for (let i = 0; i !== dials.length; i++) {
									const dialPos = parseInt(dials[i].getAttribute('position'));

									if (dialPos >= dialsRangeStart && dialPos <= dialsRangeEnd) {
										dials[i].setAttribute('position', dialPos + sign);
									}
								}

								cell.setAttribute('position', newDialPosition);

								SpeedDial.Builder.refreshDialsByPositions(
									SpeedDial.cellsInRowMax(null, null, {
										objects: function () {
											return document.getElementById('cellsContainer').childNodes.length;
										},
									}),
									displayMode,
									SpeedDial._currentCellSize()
								);

								// update storage 
								StorageSD.insertDialUpdateStorage(
									dialId,
									sign === -1 ? '-' : '+',
									{ start: dialsRangeStart, end: dialsRangeEnd },
									newDialPosition,
									function (changedIds) {
										Utils.Async.arrayProcess(
											changedIds,
											function (dialId, arrayProcessCallback) {
												Sync.addDataToSync(
													{
														category: 'dials',
														data: dialId,
													},
													function () {
														arrayProcessCallback();
													}
												);
											},
											function () {}
										);
									}
								);
							},
							event,
							{
								groupFocus: function (groupId) {
									if (groupId > 0) {
										const elem = document.getElementById('group_select_' + groupId);

										elem.setAttribute('dragDialTo', 1);
									}

									cell.setAttribute('dragovergroup', 1);
								},
								groupBlured: function () {
									const groups = document.querySelectorAll('#groupsBox .group');

									for (let i = 0; i !== groups.length; i++) {
										if (groups[i]) {
											groups[i].removeAttribute('dragDialTo');
										}
									}
									cell.removeAttribute('dragovergroup');
								},

								dropOnGroup: function (groupId) {
									SpeedDial.dialMoveToGroup(data.id, groupId);
								},

								dragMove: function (x, y, elems) {
									if (!isFancyMode) {
										return;
									}

									let elem = null;
									let distance = 99999999999;

									elems.forEach(function (e) {
										const d = Math.abs(e.centerPos.left - x);

										if (d < distance) {
											distance = d;
											elem = e.elem;
										}
									});

									if (elem) {
										let transform = elem.style.webkitTransform;
										let transformOrigin = elem.style.webkitTransformOrigin;

										if (elem.hasAttribute('transformBeforeDrag')) {
											transform = elem.getAttribute('transformBeforeDrag');
										}

										if (elem.hasAttribute('transformOriginBeforeDrag')) {
											transformOrigin = elem.getAttribute('transformOriginBeforeDrag');
										}

										cell.style.webkitTransform = transform;
										cell.style.webkitTransformOrigin = transformOrigin;
									}
								},
								drop: function () {
									if (!isFancyMode) {
										return;
									}

									cell.style.webkitTransform = cell.getAttribute('transformBeforeDrag');
									cell.style.webkitTransformOrigin = cell.getAttribute('transformOriginBeforeDrag');

									cell.removeAttribute('transformBeforeDrag');
									cell.removeAttribute('transformOriginBeforeDrag');
								},
							}
						);
					}, 300);
					event.stopPropagation();
				},
				false
			);
		}
	},
};

export default SpeedDialBuilderModule;
