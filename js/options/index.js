var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import '../_external/jquery.js';
import '../_external/parallax.js';
import '../_external/qtip/jquery.qtip.min.js';
import '../_external/fix_input_number.js';
import '../colorpicker/jscolor.js';
import '../newtab/contextmenu/dhtmlxmenu.js';
import { default as FvdSpeedDialModule } from '../speedDialCore.js';
import SpeedDialModule from '../newtab/speeddial.js';
import SpeedDialMiscModule from '../newtab/speeddial_misc.js';
import { EventType } from "../types.js";
import PowerOffModule from '../poweroff.js';
import OptionsPowerOffModule from './poweroff.js';
import StorageSD from '../storage.js';
import Sync from '../sync/tab.js';
import UserInfoSync from '../sync/user.js';
import Templates from '../templates.js';
import ContextMenus from '../newtab/contextmenus.js';
import CSSModule from '../newtab/css.js';
import Localizer, { _ } from '../localizer.js';
import RuntimeStore from '../runtimestore.js';
import BackgroundModule from '../newtab/background.js';
import DialogsModule from '../dialogs.js';
import OptionsModule from "./options.js";
import PremiumForShareModule from '../premiumforshare.js';
import AppsModule from "../newtab/apps.js";
import StorageAppsModule from '../storage/apps.js';
import ThumbMakerModule from '../thumbmaker/tab.js';
import ToolTip from '../tooltip.js';
import Broadcaster from '../_external/broadcaster.js';
import { FileSystemSD } from '../storage/filesystem.js';
import { Utils } from '../utils.js';
class SettingModule {
    constructor() {
        this.fvdSpeedDial = new FvdSpeedDialModule(this.addEventListener, { mode: "page" });
        this.FileSystem = new FileSystemSD();
        this.init();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const { fvdSpeedDial } = this;
            window.fvdSpeedDial = fvdSpeedDial;
            yield fvdSpeedDial.init();
            fvdSpeedDial.Templates = Templates;
            fvdSpeedDial.UserInfoSync = new UserInfoSync(fvdSpeedDial);
            fvdSpeedDial.Sync = Sync;
            fvdSpeedDial.ToolTip = ToolTip;
            fvdSpeedDial.RuntimeStore = new RuntimeStore(fvdSpeedDial);
            fvdSpeedDial.SpeedDial = new SpeedDialModule(fvdSpeedDial);
            fvdSpeedDial.SpeedDialMisc = new SpeedDialMiscModule(fvdSpeedDial);
            fvdSpeedDial.ContextMenus = new ContextMenus(fvdSpeedDial);
            fvdSpeedDial.Options = new OptionsModule(fvdSpeedDial);
            fvdSpeedDial.CSS = new CSSModule(fvdSpeedDial);
            fvdSpeedDial.PowerOff = new PowerOffModule(fvdSpeedDial);
            fvdSpeedDial.Background = new BackgroundModule(fvdSpeedDial);
            fvdSpeedDial.PremiumForShare = new PremiumForShareModule(fvdSpeedDial);
            fvdSpeedDial.Dialogs = new DialogsModule(fvdSpeedDial);
            fvdSpeedDial.Apps = new AppsModule(fvdSpeedDial);
            fvdSpeedDial.StorageApps = new StorageAppsModule(fvdSpeedDial);
            fvdSpeedDial.OptionsPowerOff = new OptionsPowerOffModule(fvdSpeedDial);
            fvdSpeedDial.ThumbMaker = new ThumbMakerModule(fvdSpeedDial);
            this.start();
            this.initEvent();
        });
    }
    addEventListener(eventType, cb) {
        if (eventType === EventType.LOAD) {
            if (document.readyState === 'complete') {
                cb();
            }
            else {
                window.addEventListener('load', (event) => {
                    cb(event);
                });
            }
        }
        else if (eventType === EventType.UNLOAD) {
            window.addEventListener('unload', (event) => {
                cb(event);
            });
        }
    }
    start() {
        const { fvdSpeedDial } = this;
        const { ContextMenus, Options } = fvdSpeedDial;
        fvdSpeedDial.StorageSD = new StorageSD(fvdSpeedDial);
        fvdSpeedDial.StorageSD.connect(() => {
            ContextMenus.init();
            Options.init();
            Localizer.localizeCurrentPage();
            Sync.isActive(function (isActive) {
                document.documentElement.setAttribute("data-sync-active", String(isActive ? 1 : 0));
            });
            const numberInputs = document.querySelectorAll("input[type=\"number\"]");
            for (let i = 0; i !== numberInputs.length; i++) {
                const numberInput = numberInputs[i];
                ((numberInput) => {
                    numberInput.addEventListener("input", () => {
                        const max = parseInt(numberInput.getAttribute("max") || "");
                        const min = parseInt(numberInput.getAttribute("min") || "");
                        if (!isNaN(max) && +numberInput.value > max) {
                            numberInput.value = String(max);
                        }
                        else if (!isNaN(max) && +numberInput.value < min) {
                            numberInput.value = String(min);
                        }
                        if (isNaN(Number(numberInput.value)) || numberInput.value === "") {
                            numberInput.value = String(1);
                        }
                        Options._changeOption(numberInput);
                    }, false);
                })(numberInput);
            }
        });
    }
    initEvent() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18;
        const { fvdSpeedDial } = this;
        const { ToolTip, Dialogs, Options, StorageSD, Prefs, PowerOff, CSS, SpeedDialMisc, ContextMenus } = fvdSpeedDial;
        Broadcaster.onMessage.addListener(function (msg, sender, sendResponse) {
            const that = this;
            if (msg.action === 'poweroff:hide') {
                if (!PowerOff.isHidden()) {
                    Prefs.set('poweroff.hidden', true);
                }
            }
            if (msg.action === 'pref:changed' && msg.name === 'sd.display_mode') {
                CSS.prefChanged(msg.name, msg.value);
            }
            if (['user:logout', 'user:login'].includes(msg.action)) {
                globalThis.navigation.reload();
                SpeedDialMisc.refreshSearchPanel();
                ContextMenus.init();
            }
            if (msg.action === 'windowScopeMiscItemGet') {
                fvdSpeedDial.StorageSD.getMisc(msg.data.key, function (result) {
                    if (String(result).indexOf('filesystem') === 0) {
                        that.FileSystem.readAsDataURLbyURL(result, function (err, data) {
                            sendResponse({ result: data });
                        });
                    }
                    else {
                        sendResponse({ result: result });
                    }
                });
                return true;
            }
            if (msg.action === 'windowScopeMiscItemSet') {
                if (msg.data.key === 'sd.background'
                    && String(msg.data.val).indexOf('https:') === 0) {
                    Utils.imageUrlToDataUrl(msg.data.val, function (dataUrl) {
                        fvdSpeedDial.Prefs.set('sd.background_url', msg.data.val);
                        fvdSpeedDial.StorageSD.setMisc('sd.background', dataUrl);
                    });
                }
                else {
                    if (String(msg.data.val).indexOf('/images/newtab/firefox') !== -1) {
                        msg.data.val = '/images/newtab/fancy_bg.jpg';
                    }
                    fvdSpeedDial.StorageSD.setMisc(msg.data.key, msg.data.val);
                }
                return true;
            }
            if (msg.action === 'windowScopeSaveDial') {
                fvdSpeedDial.StorageSD.syncSaveDial(msg.dial, function (saveInfo) {
                    sendResponse(saveInfo);
                });
                return true;
            }
        });
        window.addEventListener("unload", function () {
            Options.destroy();
        }, false);
        setTimeout(function () {
            const linkToSd = document.getElementById("linkToSD");
            linkToSd.style.top = "-50px";
            linkToSd.addEventListener("webkitTransitionEnd", function () {
                setTimeout(function () {
                    linkToSd.setAttribute("blackshadow", "1");
                }, 500);
            }, false);
        }, 1000);
        (_a = document.getElementById("linkToSD")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", function () {
            document.location = 'newtab.html';
        }, false);
        (_b = document.getElementById("buttonBigSettings")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", function () {
            Options.setType('global');
        }, false);
        (_c = document.getElementById("buttonBigSpeedDial")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", function () {
            Options.setType('speeddial');
        }, false);
        (_d = document.getElementById("buttonBigMostVisited")) === null || _d === void 0 ? void 0 : _d.addEventListener("click", function () {
            Options.setType('mostvisited');
        }, false);
        (_e = document.getElementById("buttonBigRecentlyClosed")) === null || _e === void 0 ? void 0 : _e.addEventListener("click", function () {
            Options.setType('recentlyclosed');
        }, false);
        (_f = document.getElementById("buttonBigBackground")) === null || _f === void 0 ? void 0 : _f.addEventListener("click", function () {
            Options.setType('bg');
        }, false);
        (_g = document.getElementById("buttonBigSdFontColors")) === null || _g === void 0 ? void 0 : _g.addEventListener("click", function () {
            Options.setType('fonts');
        }, false);
        (_h = document.getElementById("buttonBigSdSync")) === null || _h === void 0 ? void 0 : _h.addEventListener("click", function () {
            Options.syncOptionsOpen();
        }, false);
        (_j = document.getElementById("buttonBigSdGetSatisfaction")) === null || _j === void 0 ? void 0 : _j.addEventListener("click", function () {
            Options.openGetSatisfactionSuggestions();
        }, false);
        (_k = document.getElementById("buttonBigSdDonate")) === null || _k === void 0 ? void 0 : _k.addEventListener("click", function (event) {
            Options.openDonateMessage(event);
        }, false);
        (_l = document.getElementById("buttonBigSdPowerOff")) === null || _l === void 0 ? void 0 : _l.addEventListener("click", function (event) {
            Options.setType('poweroff');
        }, false);
        try {
            if (document.getElementById("buttonBigSdWidgets"))
                (_m = document.getElementById("buttonBigSdWidgets")) === null || _m === void 0 ? void 0 : _m.addEventListener("click", function (event) {
                    Options.setType('widgets');
                }, false);
        }
        catch (ex) {
            console.warn(ex);
        }
        (_o = document.getElementById("settingsContent")) === null || _o === void 0 ? void 0 : _o.addEventListener("scroll", function (event) {
            document.getElementById("settingsContent").scrollLeft = 0;
        }, false);
        (_p = document.getElementById("importExport_export")) === null || _p === void 0 ? void 0 : _p.addEventListener("click", function (event) {
            if (!Options.dontAllowIfLocked()) {
                return;
            }
            try {
                Dialogs.importExport({ type: 'export' });
            }
            catch (e) {
                console.log(e);
            }
        }, false);
        (_q = document.getElementById("importExport_import")) === null || _q === void 0 ? void 0 : _q.addEventListener("click", function (event) {
            if (!Options.dontAllowIfLocked()) {
                return;
            }
            Dialogs.importExport({ type: 'import' });
        }, false);
        (_r = document.getElementById("sdButtonManageDeny")) === null || _r === void 0 ? void 0 : _r.addEventListener("click", function (event) {
            if (!Options.dontAllowIfLocked()) {
                return;
            }
            Dialogs.manageDeny();
        }, false);
        if (document.getElementById("displayPlusCellsHelp"))
            (_s = document.getElementById("displayPlusCellsHelp")) === null || _s === void 0 ? void 0 : _s.addEventListener("click", function (event) {
                ToolTip.displayImage(document.getElementById("displayPlusCellsHelp"), '/images/help/display_plus_cells.png', event);
            }, false);
        if (document.getElementById("displayQuickMenuHelp"))
            (_t = document.getElementById("displayQuickMenuHelp")) === null || _t === void 0 ? void 0 : _t.addEventListener("click", function (event) {
                ToolTip.displayImage(document.getElementById("displayQuickMenuHelp"), '/images/help/show_quick_menu.png', event);
            }, false);
        (_u = document.getElementById("displayClicksHelp")) === null || _u === void 0 ? void 0 : _u.addEventListener("click", function (event) {
            ToolTip.displayImage(document.getElementById("displayClicksHelp"), '/images/help/show_clicks.png', event);
        }, false);
        if (document.getElementById("displayEnableDialsCounter"))
            (_v = document.getElementById("displayEnableDialsCounter")) === null || _v === void 0 ? void 0 : _v.addEventListener("click", function (event) {
                ToolTip.displayImage(document.getElementById("displayEnableDialsCounter"), '/images/help/dials_counter.png', event);
            }, false);
        if (document.getElementById("displayShowInContextMenuHelp"))
            (_w = document.getElementById("displayShowInContextMenuHelp")) === null || _w === void 0 ? void 0 : _w.addEventListener("click", function (event) {
                ToolTip.displayImage(document.getElementById("displayShowInContextMenuHelp"), '/images/help/display_in_context_menu.png', event);
            }, false);
        if (document.getElementById("displayDialBackgroundHelp"))
            (_x = document.getElementById("displayDialBackgroundHelp")) === null || _x === void 0 ? void 0 : _x.addEventListener("click", function (event) {
                ToolTip.displayImage(document.getElementById("displayDialBackgroundHelp"), '/images/help/hide_background.png', event);
            }, false);
        if (document.getElementById("displayShowGrayLineHelp"))
            (_y = document.getElementById("displayShowGrayLineHelp")) === null || _y === void 0 ? void 0 : _y.addEventListener("click", function (event) {
                ToolTip.displayImage(document.getElementById("displayShowGrayLineHelp"), '/images/help/show_gray_line.png', event);
            }, false);
        (_z = document.getElementById("mainButtonActionHelp")) === null || _z === void 0 ? void 0 : _z.addEventListener("click", function (event) {
            ToolTip.displayImage(document.getElementById("mainButtonActionHelp"), '/images/help/main_button.png', event);
        }, false);
        (_0 = document.getElementById("buttonManageGroups")) === null || _0 === void 0 ? void 0 : _0.addEventListener("click", function (event) {
            if (!Options.dontAllowIfLocked()) {
                return;
            }
            Dialogs.manageGroups({ callback: function (result) {
                    if (result) {
                        Options.rebuildGroupsList();
                    }
                } });
        }, false);
        (_1 = document.getElementById("buttonResetSDClicks")) === null || _1 === void 0 ? void 0 : _1.addEventListener("click", function (event) {
            Dialogs.confirm(_("options_confirm_reset_clicks_title"), _("options_confirm_reset_clicks_text"), function (res) {
                if (res) {
                    StorageSD.resetAllDialsClicks(function () {
                        Dialogs.alert(_("options_success_reset_clicks_title"), _("options_success_reset_clicks_text"));
                    });
                }
            });
        }, false);
        (_2 = document.getElementById("bg_color")) === null || _2 === void 0 ? void 0 : _2.addEventListener("change", function (event) {
            Options.refreshBg();
            document.getElementById('bg_useColor').checked = true;
        }, false);
        (_3 = document.getElementById("bg_imageType")) === null || _3 === void 0 ? void 0 : _3.addEventListener("change", function (event) {
            Options.refreshBgViewType();
        }, false);
        (_4 = document.getElementById("backgroundUploadButton")) === null || _4 === void 0 ? void 0 : _4.addEventListener("click", function (event) {
            document.getElementById("backgroundUploadButton").getElementsByTagName('input')[0].click();
        }, false);
        (_5 = document.getElementById("uploadBackgroundFile")) === null || _5 === void 0 ? void 0 : _5.addEventListener("change", function (event) {
            Options.selectLocalBackground();
        }, false);
        (_6 = document.getElementById("btnLoadAndPreview")) === null || _6 === void 0 ? void 0 : _6.addEventListener("click", function (event) {
            Options.bgLoadAndPreview();
        }, false);
        (_7 = document.getElementById("backgroundButtonRestoreDefault")) === null || _7 === void 0 ? void 0 : _7.addEventListener("click", function (event) {
            Options.bgRestoreDefault();
        }, false);
        (_8 = document.getElementById("helpListElemColor")) === null || _8 === void 0 ? void 0 : _8.addEventListener("click", function (event) {
            ToolTip.displayImage(document.getElementById("helpListElemColor"), '/images/help/text_list_elem_color.png', event);
        }, false);
        (_9 = document.getElementById("helpShowUrlTitleColor")) === null || _9 === void 0 ? void 0 : _9.addEventListener("click", function (event) {
            ToolTip.displayImage(document.getElementById("helpShowUrlTitleColor"), '/images/help/text_list_show_url_title_color.png', event);
        }, false);
        (_10 = document.getElementById("helpTextListLinkColor")) === null || _10 === void 0 ? void 0 : _10.addEventListener("click", function (event) {
            ToolTip.displayImage(document.getElementById("helpTextListLinkColor"), '/images/help/text_list_link_color.png', event);
        }, false);
        if (document.getElementById("helpTextOtherkColor"))
            (_11 = document.getElementById("helpTextOtherkColor")) === null || _11 === void 0 ? void 0 : _11.addEventListener("click", function (event) {
                ToolTip.displayImage(document.getElementById("helpTextOtherkColor"), '/images/help/text_other_color.png', event);
            }, false);
        (_12 = document.getElementById("fontsButtonRestoreDefault")) === null || _12 === void 0 ? void 0 : _12.addEventListener("click", function (event) {
            Options.fontsRestoreDefaults();
        }, false);
        (_13 = document.getElementById("applyChangesButton")) === null || _13 === void 0 ? void 0 : _13.addEventListener("click", function (event) {
            if (!Options.dontAllowIfLocked()) {
                return;
            }
            Options.applyChanges();
        }, false);
        (_14 = document.getElementById("buttonCloseButton")) === null || _14 === void 0 ? void 0 : _14.addEventListener("click", function (event) {
            Options.close();
        }, false);
        (_15 = document.getElementById("setAuthoPreview_setPreview")) === null || _15 === void 0 ? void 0 : _15.addEventListener("click", function (event) {
            Options.setAutoPreviewGlobally();
        }, false);
        (_16 = document.getElementById("sdPreviewSettings_turnOffAutoUpdate")) === null || _16 === void 0 ? void 0 : _16.addEventListener("click", function (event) {
            Options.turnOffAutoUpdateGlobally();
        }, false);
        (_17 = document.getElementById("sdPreviewSettings_setAutoUpdate")) === null || _17 === void 0 ? void 0 : _17.addEventListener("click", function (event) {
            Options.setAutoUpdateGlobally();
        }, false);
        (_18 = document.querySelector(".backupViaEversyncSuggestion button")) === null || _18 === void 0 ? void 0 : _18.addEventListener("click", function () {
            Options.syncOptionsOpen(false, 'backups');
        }, false);
        $("[data-only-in-standard]").qtip({
            content: { text: _("options_available_in_standard_theme_only") },
            position: {
                at: 'top center',
                my: 'bottom center',
            },
            style: {
                classes: "qtip-dark",
                tip: {
                    corner: true,
                    width: 10,
                    height: 4,
                },
            },
            events: {
                show: function (event, api) {
                    return $("#themeSelect").val() !== "standard";
                },
            },
        });
    }
}
new SettingModule();
