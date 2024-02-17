var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Broadcaster from '../_external/broadcaster.js';
import { default as FvdSpeedDialModule } from '../speedDialCore.js';
import SpeedDialModule from './speeddial.js';
import SpeedDialMiscModule from './speeddial_misc.js';
import { EventType } from '../types.js';
import Localizer from '../localizer.js';
import Config from '../config.js';
import Search from './search.js';
import Scrolling from './scrolling.js';
import ContextMenus from './contextmenus.js';
import AutoCompletePlus from './autocompleteplus.js';
import IntroductionModule from './introduction.js';
import { _b } from '../utils.js';
import { start_drop_down } from './dropdown.js';
import CSSModule from './css.js';
import PowerOffModule from '../poweroff.js';
import PowerOffClientModule from './poweroffclient.js';
import BackgroundModule from './background.js';
import StorageSD from '../storage.js';
import MostVisitedModule from '../storage/mostvisited.js';
import RecentlyClosedModule from '../storage/recentlyclosed.js';
import Sync from '../sync/tab.js';
import UserInfoSync from '../sync/user.js';
import Templates from '../templates.js';
import DialogsModule from '../dialogs.js';
import HiddenCaptureQueueModule from '../capture/hiddencapturequeue.js';
import ThumbMakerModule from '../thumbmaker/tab.js';
import BottomTextModule from './mods/bottom-text.js';
import DialSearchModule from './mods/dial-search.js';
import { Utils } from '../utils.js';
class NewtabModule {
    constructor() {
        this.fvdSpeedDial = new FvdSpeedDialModule(this.addEventListener, { mode: "page" });
        this.init();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('NewtabModule', 'init');
            const { fvdSpeedDial } = this;
            window.fvdSpeedDial = fvdSpeedDial;
            yield fvdSpeedDial.init();
            fvdSpeedDial.Templates = Templates;
            fvdSpeedDial.Sync = Sync;
            fvdSpeedDial.UserInfoSync = new UserInfoSync(fvdSpeedDial);
            fvdSpeedDial.SpeedDial = new SpeedDialModule(fvdSpeedDial);
            fvdSpeedDial.SpeedDialMisc = new SpeedDialMiscModule(fvdSpeedDial);
            fvdSpeedDial.ContextMenus = new ContextMenus(fvdSpeedDial);
            fvdSpeedDial.Search = new Search(fvdSpeedDial);
            fvdSpeedDial.Scrolling = new Scrolling(fvdSpeedDial);
            fvdSpeedDial.CSS = new CSSModule(fvdSpeedDial);
            fvdSpeedDial.PowerOff = new PowerOffModule(fvdSpeedDial);
            fvdSpeedDial.PowerOffClient = new PowerOffClientModule(fvdSpeedDial);
            fvdSpeedDial.Background = new BackgroundModule(fvdSpeedDial);
            fvdSpeedDial.MostVisited = new MostVisitedModule(fvdSpeedDial);
            fvdSpeedDial.RecentlyClosed = new RecentlyClosedModule(fvdSpeedDial);
            fvdSpeedDial.Dialogs = new DialogsModule(fvdSpeedDial);
            fvdSpeedDial.HiddenCaptureQueue = new HiddenCaptureQueueModule(fvdSpeedDial);
            fvdSpeedDial.ThumbMaker = new ThumbMakerModule(fvdSpeedDial);
            fvdSpeedDial.BottomText = new BottomTextModule(fvdSpeedDial);
            fvdSpeedDial.DialSearch = new DialSearchModule(fvdSpeedDial);
            fvdSpeedDial.Introduction = new IntroductionModule(fvdSpeedDial);
            fvdSpeedDial.Utils = Utils;
            this.storage();
            this.runtimeListeners();
            this.broadcasterListeners();
            this.start();
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
    runtimeListeners() {
        const { fvdSpeedDial } = this;
        chrome.runtime.onConnect.addListener(function (port) {
            console.log('Obtained connection', port);
        });
        chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
            if (typeof message === 'object') {
                if (message.action === 'previousSession:button') {
                    fvdSpeedDial.SpeedDial.sessionRestore = message.sessionId;
                    fvdSpeedDial.SpeedDial.sheduleRebuildGroupsList();
                }
                if (['user:login', 'user:logout'].includes(message.action)) {
                    fvdSpeedDial.SpeedDialMisc.refreshSearchPanel();
                    fvdSpeedDial.ContextMenus.init();
                }
            }
        });
    }
    broadcasterListeners() {
        const { fvdSpeedDial } = this;
        const { CSS } = fvdSpeedDial;
        Broadcaster.onMessage.addListener(function (msg) {
            if (msg.action === 'storage:fs:updatestate') {
                if (msg.state === 'restoring') {
                    showCorruptedFilesRestore();
                }
                else if (msg.state === 'normal') {
                    const overlay = document.getElementById('restoreCorruptedFilesOverlay');
                    if (overlay && overlay.hasAttribute('appear')) {
                        document.location.reload();
                    }
                }
            }
            else if (msg.action === 'startDBRestore') {
                showCorruptedFilesRestore();
            }
            else if (msg.action === 'finishDBRestore') {
                document.location.reload();
            }
            else if (msg.action === 'pref:changed') {
                CSS.prefChanged(msg.name, msg.value);
            }
            else if (msg.action == 'hiddencapture:done') {
                console.info('hiddencapture:done');
            }
            else if (msg.action == 'deny:changed') {
                console.info('deny:changed', 'action');
                fvdSpeedDial.RecentlyClosed.checkDenyAll(function () {
                    fvdSpeedDial.StorageSD.refreshDenyDials(function () {
                        fvdSpeedDial.MostVisited.invalidateCache();
                        fvdSpeedDial.SpeedDial.sheduleFullRebuild();
                    });
                });
            }
        });
    }
    storage() {
        const { fvdSpeedDial } = this;
        const { SpeedDial, SpeedDialMisc, ContextMenus } = fvdSpeedDial;
        fvdSpeedDial.StorageSD = new StorageSD(fvdSpeedDial);
        fvdSpeedDial.StorageSD.connect(() => __awaiter(this, void 0, void 0, function* () {
            yield fvdSpeedDial.Backup.backgroundImageCheck();
            SpeedDialMisc.init();
            SpeedDial.init();
            SpeedDial._cellsRebuildCallback = function () {
                document.body.setAttribute('loaded', '1');
                fvdSpeedDial.SpeedDial._cellsRebuildCallback = null;
            };
            SpeedDial.sheduleFullRebuild();
            ContextMenus.init();
            const AutoComplete = new AutoCompletePlus({
                fvdSpeedDial,
                input: '#q',
                form: '#cse-search-box',
            });
            AutoComplete.onClickSuggestion.addListener(function (value) {
                SpeedDialMisc.doSearch(value);
            });
            window.AutoComplete = AutoComplete;
            start_drop_down();
            Localizer.localizeCurrentPage();
        }));
    }
    start() {
        const { fvdSpeedDial } = this;
        const { Prefs } = fvdSpeedDial;
        chrome.runtime.sendMessage({
            action: 'storage:fs:getState',
        }, function (state) {
            if (state === 'restoring') {
                showCorruptedFilesRestore();
            }
        });
        chrome.runtime.sendMessage({
            action: 'databaseBackup:getState',
        }, function (state) {
            if (state === 'restoring') {
                showCorruptedFilesRestore();
            }
        });
        Broadcaster.sendMessage({
            action: 'sdtab:open',
        });
        if (Config.FOCUS_NEWTAB_SEARCH) {
            setTimeout(function () {
                const searchInput = document.getElementById('q');
                if (searchInput) {
                    searchInput.focus();
                }
            }, 0);
        }
        function previousSessionPremission(callback) {
            chrome.tabs.getAllInWindow(function (tabs) {
                let notPinnedTabsAmmount = 0;
                for (const k in tabs) {
                    if (!tabs[k].pinned)
                        notPinnedTabsAmmount++;
                }
                if (notPinnedTabsAmmount > 1) {
                    Prefs.set('just-opened', 0);
                }
                if (callback) {
                    callback(Prefs.get('just-opened'));
                }
            });
        }
        if (_b(Prefs.get('sd.restore_previous_session')) && parseInt(Prefs.get('just-opened'))) {
            previousSessionPremission((prm) => {
                if (parseInt(prm)) {
                    chrome.runtime.sendMessage({
                        action: 'previousSession:get',
                    });
                }
            });
        }
        if (/\bCrOS\b/.test(navigator.userAgent)) {
            const appsPanelOpenButton = document.getElementById('appsPanelOpenButton');
            if (appsPanelOpenButton) {
                appsPanelOpenButton.style.display = 'none';
            }
        }
    }
}
function hideCorruptedFilesRestore() {
    const overlay = document.getElementById('restoreCorruptedFilesOverlay');
    if (overlay) {
        overlay.removeAttribute('appear');
        overlay.setAttribute('hidden', '1');
    }
    else {
        console.warn('restoreCorruptedFilesOverlay not fond');
    }
}
function showCorruptedFilesRestore() {
    const overlay = document.getElementById('restoreCorruptedFilesOverlay');
    if (overlay) {
        overlay.removeAttribute('hidden');
        setTimeout(function () {
            overlay.setAttribute('appear', '1');
        }, 0);
    }
    else {
        console.warn('restoreCorruptedFilesOverlay not fond');
    }
}
new NewtabModule();
