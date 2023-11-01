import { _b, Utils } from '../utils.js';

const CSS = function (fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;
	this.FANCY_BACKGROUND_URL = fvdSpeedDial.Prefs._themeDefaults['fancy']['sd.background_url'];
};

CSS.prototype = {
	stylesheets: [],
	getFancyBackgroundUrl: function () {
		return this.FANCY_BACKGROUND_URL;
	},

	setTheme: function (name) {
		document.getElementById('themeCSS').setAttribute('href', '/themes/' + name + '.css');
	},

	refreshTheme: function () {
		const {
			fvdSpeedDial: { Prefs },
		} = this;
		try {
			this.setTheme(Prefs.get('sd.display_mode'));
		} catch (ex) {
			console.warn(ex);
		}
	},

	refresh: function () {
		const { fvdSpeedDial } = this;
		const { Prefs } = fvdSpeedDial;

		// get colors from settings
		const classesColors = {
			'.newtabCell .head': {
				'color': this._color(Prefs.get('sd.text.cell_title.color')),
				'font-size': this._size(Prefs.get('sd.text.cell_title.size')),
				'font-weight': this._fontWeight(Prefs.get('sd.text.cell_title.bolder')),
				'display': _b(Prefs.get('sd.show_icons_and_titles_above_dials')) ? 'block' : 'none',
			},
			'.newtabCell .footer': {
				'color': this._color(Prefs.get('sd.text.cell_url.color')),
				'font-size': this._size(Prefs.get('sd.text.cell_url.size')),
				'font-weight': this._fontWeight(Prefs.get('sd.text.cell_url.bolder')),
				'display': _b(Prefs.get('sd.show_urls_under_dials')) ? 'block' : 'none',
			},
			'.newtabListElem .text': {
				'color': this._color(Prefs.get('sd.text.list_elem.color')),
				'font-size': this._size(Prefs.get('sd.text.list_elem.size')),
				'font-weight': this._fontWeight(Prefs.get('sd.text.list_elem.bolder')),
			},

			'#listViewTypeSelector': {
				'color': this._color(Prefs.get('sd.text.list_show_url_title.color')),
				'font-size': this._size(Prefs.get('sd.text.list_show_url_title.size')),
				'font-weight': this._fontWeight(Prefs.get('sd.text.list_show_url_title.bolder')),
			},

			'.link': {
				'color': this._color(Prefs.get('sd.text.list_link.color')),
				'font-size': this._size(Prefs.get('sd.text.list_link.size')),
				'font-weight': this._fontWeight(Prefs.get('sd.text.list_link.bolder')),
			},

			'.textother': {
				'color': this._color(Prefs.get('sd.text.cell_title.color')),
				'font-size': this._size(Prefs.get('sd.text.cell_title.size')),
				'font-weight': this._fontWeight(Prefs.get('sd.text.cell_title.bolder')),
			},

			'.newtabCell': {
				opacity: Prefs.get('sd.dials_opacity') / 100,
			},
			'.newtabListElem': {
				opacity: Prefs.get('sd.dials_opacity') / 100,
			},
			'#groupsBox > div': {
				opacity: Prefs.get('sd.dials_opacity') / 100,
			},
		};

		if (!_b(Prefs.get('sd.display_dial_background'))) {
			classesColors['.newtabCell .body .screenParent'] = {
				'box-shadow': 'none !important',
			};

			if (!_b(Prefs.get('sd.display_dial_borders'))) {
				classesColors['.newtabCell .body .screenParent']['border'] = 'none !important';
			} else {
				classesColors['.newtabCell .body .screenParent']['border-width'] = '1px !important';
			}

			classesColors['.newtabCell[type="plus"] .body .preview-image'] = {
				background: 'none !important',
			};
			classesColors['#speedDialContent .newtabCell .body'] = {
				background: 'none !important',
			};
			classesColors['.newtabCell .menuOverlay .text'] = {
				'margin-right': '5px',
				'margin-left': '5px',
				'margin-bottom': '5px',
			};
			classesColors['.newtabCell .speedDialIcons'] = {
				'margin-right': '5px !important',
			};

			classesColors['.newtabCell .imgShadow'] = {
				display: 'none',
			};

			classesColors['.newtabCell .menuOverlay'] = {
				'background-color': 'rgba( 62, 125, 179, 0.6 ) !important',
			};
			classesColors[
				'#speedDialContent[style="standard"] .newtabCell[type="mostvisited"] .menuOverlay'
			] = {
				left: '-3px',
				right: '-3px !important',
				width: 'auto',
				bottom: '7px',
			};
			classesColors['.newtabCell .mostVisitedMenu > .views'] = {
				'margin-left': '3px',
			};
			classesColors['.newtabCell .mostVisitedMenu > .ingroup'] = {
				'margin-right': '3px',
			};
		} else if (Prefs.get('sd.display_dial_background_color') !== null) {
			const style = Prefs.get('sd.display_mode');
			const theme = Prefs.get('sd.display_dial_background_color');

			if (style === 'fancy' && theme === 'white') {
				classesColors['#speedDialContent .newtabCell .body'] = {
					'background-color': 'rgba(255,255,255,1)!important',
				};
			} else if (style === 'standard' && theme === 'dark') {
				classesColors['#speedDialContent .newtabCell .body'] = {
					'background-color': 'rgba(50, 50, 50, 0.3)!important',
				};
				classesColors["#speedDialContent .newtabCell[type='plus'] .body .preview-image"] = {
					background: 'none!important',
				};
			}
		}

		if (!_b(Prefs.get('sd.display_quick_menu_and_clicks'))) {
			classesColors['.newtabCell .speedDialIcons'] = {
				display: 'none',
			};
			classesColors['.newtabCell .text'] = {
				display: 'none',
			};
			classesColors['.newtabCell .menuOverlay'] = {
				display: 'none',
			};
			classesColors['.newtabCell .body'] = {
				'padding-bottom': '0!important',
			};
		}

		classesColors['#groupsBox .group'] = {
			'color': this._color(Prefs.get('sd.text.group_font.color')) + '!important',
			'font-size': this._size(Prefs.get('sd.text.group_font.size')) + '!important',
			'font-weight': this._fontWeight(Prefs.get('sd.text.group_font.bolder')),
		};

		classesColors['.additionalGroupsList .group .groupName'] = {
			'font-size': this._size(Prefs.get('sd.text.group_font.size')) + '!important',
		};

		classesColors["#groupsBox .group[current='1']"] = {
			color: this._color(Prefs.get('sd.text.group_active_font.color')) + '!important',
			background:
				'-webkit-linear-gradient(top, rgba(86,132,73,0.6), rgba(117,173,102,0.7))!important',
		};

		classesColors["#groupsBox .group[current='1'] *"] = {
			color: this._color(Prefs.get('sd.text.group_active_font.color')) + '!important',
		};

		classesColors['#groupsBox .additionalGroupsButton'] = {};

		try {
			const group_bg = Prefs.get('sd.text.group_bg.color');
			const group_active_bg = Prefs.get('sd.text.group_active_bg.color');

			if (Prefs.get('sd.text.group_font.color') === 'FFFFFF') {
				classesColors['#groupsBox .group'].color = this._color('FFFFFF') + '!important';

				if (group_bg === '6E6E6E') {
					const bgColor
						= '-webkit-linear-gradient(top , rgba(110, 110, 110, 0.5), rgba(100, 100, 100, 0.5))!important';

					classesColors['#groupsBox .group'].background = bgColor;
					classesColors['#groupsBox .additionalGroupsButton'].background = bgColor;
				}
			}

			if (group_bg !== '6E6E6E') {
				const bgColor
					= '-webkit-linear-gradient(top, '
					+ Utils.hexToRGBA(group_bg, 0.5)
					+ ', '
					+ Utils.hexToRGBA(group_bg, 0.5)
					+ ')!important';

				classesColors['#groupsBox .group'].background = bgColor;
				classesColors['#groupsBox .additionalGroupsButton'].background = bgColor;
			}

			if (group_active_bg !== '75AD66') {
				classesColors["#groupsBox .group[current='1']"].background
					= '-webkit-linear-gradient(top, '
					+ Utils.hexToRGBA(group_active_bg, 0.85)
					+ ', '
					+ Utils.hexToRGBA(group_active_bg, 0.95)
					+ ')!important';
			}

			classesColors['#groupsBox .group .image'] = {
				background: this._color(Prefs.get('sd.text.group_font.color')) + '!important',
			};
			classesColors['#groupsBox .additionalGroupsButton .img'] = {
				background: this._color(Prefs.get('sd.text.group_font.color')) + '!important',
			};
		} catch (ex) {
			console.warn(ex);
		}

		if (
			(Prefs.get('sd.background_url_type') === 'noimage'
				&& Prefs.get('sd.text.cell_title.color') === 'FFFFFF'
				&& Prefs.get('sd.background_color') === 'FFFFFF')
			|| !_b(Prefs.get('sd.background_color_enabled'))
		) {
			classesColors['.newtabCell .head'].color = this._color('000000');
		}

		if (!_b(Prefs.get('sd.display_quick_menu_and_clicks'))) {
		} else if (!_b(Prefs.get('sd.display_clicks'))) {
			classesColors['.newtabCell .text'] = {
				display: 'none',
			};
			classesColors['.newtabCell .mostVisitedMenu'] = {
				display: 'none',
			};
			classesColors[".newtabCell[type='mostvisited'] .menuOverlay"] = {
				'padding-bottom': '0!important',
			};
		}

		for (let si = 0; si !== this.stylesheets.length; si++) {
			try {
				const stylesheet = this.stylesheets[si];

				while (stylesheet.cssRules.length > 0) {
					stylesheet.deleteRule(0);
				}
				for (const selector in classesColors) {
					stylesheet.addRule(selector, '', 0);
					const rule = stylesheet.cssRules[0];
					const properties = classesColors[selector];

					for (const properyName in properties) {
						let value = properties[properyName];
						let important = null;

						if (typeof value === 'string' && value.indexOf('!important') !== -1) {
							important = 'important';
							value = value.replace('!important', '');
						}

						rule.style.setProperty(properyName, value, important);
					}
				}
			} catch (ex) {
				console.warn(ex);
			}
		}

		if (_b(Prefs.get('sd.enable_dials_counter'))) {
			document.body.removeAttribute('hidegroupcounter');
		} else {
			document.body.setAttribute('hidegroupcounter', '1');
		}

		if (_b(Prefs.get('sd.show_gray_line'))) {
			document.body.removeAttribute('hidegrayline');
		} else {
			document.body.setAttribute('hidegrayline', '1');
		}

		this.refreshTheme();
	},

	_color: function (c) {
		return '#' + c;
	},

	_size: function (s) {
		return s + 'px';
	},

	_fontWeight: function (bolder) {
		if (_b(bolder)) {
			return 'bold';
		}

		return 'normal';
	},

	_updateThemeActions: function (value, cb) {
		const { fvdSpeedDial, FANCY_BACKGROUND_URL } = this;
		const { Prefs, SpeedDial, StorageSD } = fvdSpeedDial;

		cb = cb || function () {};

		const fancyDefaults = Prefs._themeDefaults['fancy'];
		const standardDefaults = Prefs._themeDefaults['standard'];
		const prefsToRestore = [
			'sd.text.cell_title.color',
			'sd.text.list_elem.color',
			'sd.text.list_show_url_title.color',
			'sd.text.list_link.color',
			'sd.text.other.color',
		];

		Utils.Async.chain([
			function (next) {
				if (value === 'standard') {
					if (
						(Prefs.get('sd.background_color') === '000000'
							&& _b(Prefs.get('sd.background_color_enabled')))
						|| (Prefs.get('sd.background_url') === FANCY_BACKGROUND_URL
							&& Prefs.get('sd.background_url_type') !== 'noimage')
					) {
						if (Prefs.get('sd.background_url') === FANCY_BACKGROUND_URL) {
							Prefs.sSet('sd.background_url_type', 'noimage');
						}

						Prefs.sSet('sd.background_color_enabled', true);
						Prefs.sSet('sd.background_color', 'FFFFFF');

						prefsToRestore.forEach(function (pref) {
							if (Prefs.get(pref) === fancyDefaults[pref]) {
								Prefs.set(pref, standardDefaults[pref]);
							}
						});
					}

					if (!_b(Prefs.get('sd.show_urls_under_dials'))) {
						Prefs.sSet('sd.show_urls_under_dials', true);
					}

					if (!_b(Prefs.get('sd.show_icons_and_titles_above_dials'))) {
						Prefs.sSet('sd.show_icons_and_titles_above_dials', true);
					}

					setTimeout(next, 0);
				} else if (value === 'fancy') {
					Prefs.sSet('sd.top_sites_columns', 'auto');
					Prefs.sSet('sd.most_visited_columns', 'auto');

					// set fonts
					prefsToRestore.forEach(function (pref) {
						if (Prefs.get(pref) === standardDefaults[pref]) {
							Prefs.set(pref, fancyDefaults[pref]);
						}
					});

					// in fancy mode plus cells always display
					if (!_b(Prefs.get('sd.display_plus_cells'))) {
						Prefs.sSet('sd.display_plus_cells', true);
					}

					if (_b(Prefs.get('sd.show_urls_under_dials'))) {
						Prefs.sSet('sd.show_urls_under_dials', false);
					}

					if (_b(Prefs.get('sd.show_icons_and_titles_above_dials'))) {
						Prefs.sSet('sd.show_icons_and_titles_above_dials', false);
					}

					if (Prefs.get('sd.background_url_type') === 'noimage') {
						const bgUrl = FANCY_BACKGROUND_URL;

						Utils.imageUrlToDataUrl(bgUrl, function (dataUrl) {
							if (!dataUrl) {
								dataUrl = '';
							}

							Prefs.set('sd.background_url', bgUrl);
							StorageSD.setMisc('sd.background', dataUrl, function () {
								Prefs.set('sd.background_url_type', fancyDefaults['sd.background_url_type']);
								SpeedDial.refreshBackground();
								next();
							});
						});
					} else {
						setTimeout(next, 0);
					}
				}
			},
			function () {
				cb();
			},
		]);
	},

	prefChanged: function (name, value) {
		const { fvdSpeedDial } = this;
		const { Prefs, SpeedDial, CSS } = fvdSpeedDial;

		if (name === 'sd.display_mode') {
			setTimeout(function () {
				Prefs.set('sd.top_sites_columns', 'auto');
				Prefs.set('sd.most_visited_columns', 'auto');

				CSS._updateThemeActions(value);
				CSS.refresh();
				CSS.refreshTheme();
				SpeedDial.sheduleRebuild();
				SpeedDial.refreshBackground();
			}, 0);
		}
	},
};

export default CSS;
