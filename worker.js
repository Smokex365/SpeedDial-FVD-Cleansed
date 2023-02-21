var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Broadcaster from './js/_external/broadcaster.js';
import collectAndSendReport from './js/crashreport.js';
import { refreshIdleInterval } from './js/bg/poweroffidle.js';
import { sendEvent } from './js/bg/analytics.js';
import Sync from './js/sync/bg.js';
import HiddenCaptureQueueModule from './js/capture/hiddencapturequeue.js';
import ContextMenu from './js/bg/contextmenu.js';
import ThumbMakerModule from './js/thumbmaker/bg.js';
import runMigrations from './js/bg/v2vmigrations.js';
import SpeedDialBgModule from './js/bg/speeddiIalBgModule.js';
import { getPreviousSession } from './js/bg/sessions.js';
import StorageModuleSD from './js/storage.js';
import { Utils, _b } from './js/utils.js';
import Config from './js/config.js';
import { EventType } from './js/types.js';
import PowerOffModule from './js/poweroff.js';
import { default as FvdSpeedDialModule } from './js/speedDialCore.js';
class Worker {
    constructor() {
        this.fvdSpeedDial = new FvdSpeedDialModule(this.addEventListener, { mode: "worker" });
        chrome.runtime.onInstalled.addListener((details) => {
            this.onInstalledDetails = details;
        });
        this.init();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const { fvdSpeedDial } = this;
            yield fvdSpeedDial.init();
            yield fvdSpeedDial.Backup.localStorageCheck();
            globalThis.fvdSpeedDial = fvdSpeedDial;
            this.storage();
            this.modules();
            this.broadcasterListener();
            this.externalListener();
            this.onInstalledListener();
            this.contextMenu();
            this.setUninstallURL();
            fvdSpeedDial.localStorage.setItem('just-opened', 1);
            try {
                globalThis.fvdSpeedDial = fvdSpeedDial;
            }
            catch (ex) {
                console.warn(ex);
            }
            this.browserAction();
        });
    }
    contextMenu() {
        const { fvdSpeedDial } = this;
        new ContextMenu(fvdSpeedDial);
        fvdSpeedDial.ContextMenu.init();
    }
    modules() {
        const { fvdSpeedDial } = this;
        fvdSpeedDial.Utils = Utils;
        fvdSpeedDial.SpeedDial = new SpeedDialBgModule(fvdSpeedDial);
        fvdSpeedDial.ThumbMaker = new ThumbMakerModule(fvdSpeedDial);
        fvdSpeedDial.Sync = new Sync(fvdSpeedDial);
        fvdSpeedDial.PowerOff = new PowerOffModule(fvdSpeedDial);
        fvdSpeedDial.HiddenCaptureQueue = new HiddenCaptureQueueModule(fvdSpeedDial);
    }
    browserAction() {
        const { fvdSpeedDial } = this;
        const { Utils } = fvdSpeedDial;
        Utils.browserAction(fvdSpeedDial);
    }
    storage() {
        const that = this;
        const { fvdSpeedDial, onStorageConnected } = this;
        fvdSpeedDial.StorageSD = new StorageModuleSD(fvdSpeedDial);
        const { StorageSD } = fvdSpeedDial;
        StorageSD.connect(() => {
            fvdSpeedDial.ContextMenu.rebuild();
            onStorageConnected.apply(that);
        });
        StorageSD.addGroupsCallback(function () {
            fvdSpeedDial.ContextMenu.sheduleRebuild();
        });
        StorageSD.addDialsCallback(function (message) {
            if (message.action === 'remove') {
                try {
                    fvdSpeedDial.HiddenCaptureQueue.removeFromQueueById(message.data.id);
                }
                catch (ex) {
                    console.warn(ex);
                }
            }
        });
        StorageSD.addGroupsCallback((data) => {
            if (data.action === 'remove') {
                if (data.groupId === fvdSpeedDial.Prefs.get('sd.default_group')) {
                    StorageSD.groupsList(function (groups) {
                        const group = groups[0];
                        const newId = group.id;
                        fvdSpeedDial.Prefs.set('sd.default_group', newId);
                    });
                }
                else {
                    chrome.runtime.sendMessage({
                        action: 'forceRebuild',
                        resetActiveGroup: true,
                        needDisplayType: 'speeddial',
                    });
                }
            }
        });
    }
    onStorageConnected() {
        const { onInstalledDetails } = this;
        if (onInstalledDetails && onInstalledDetails.reason === 'install') {
            Utils.openSpeedDialSingle('newtab');
        }
    }
    broadcasterListener() {
        const that = this;
        const { fvdSpeedDial } = this;
        const { SpeedDial, StorageSD, ThumbMaker, Backup, HiddenCaptureQueue } = fvdSpeedDial;
        const { ThumbManager } = SpeedDial;
        let isFirstInstall = false;
        Broadcaster.onMessage.addListener(function (message, sender, sendResponse) {
            if (message.action === 'web:pp-donate-success') {
                fvdSpeedDial.localStorage.setItem('paypal-donate-state', JSON.stringify({ date: new Date().getTime() }));
            }
            else if (message.action === 'storage:connected') {
                const currentV = chrome.runtime.getManifest().version;
                const lastV = fvdSpeedDial.localStorage.getItem('__v2vmigrations_last_ver');
                if (lastV !== currentV) {
                    fvdSpeedDial.localStorage.setItem('__v2vmigrations_last_ver', chrome.runtime.getManifest().version);
                    if (isFirstInstall) {
                        return;
                    }
                    runMigrations(lastV, currentV);
                }
            }
            else if ((message.action === 'storage:fs:updatestate' && message.state === 'normal') ||
                message.action === 'finishLocalStorageRestore') {
            }
            else if (message.action === 'pref:changed') {
                fvdSpeedDial.ContextMenu.rebuild();
            }
            else if (message && message.action === 'databaseBackup:getState') {
                sendResponse(Backup.isRestoring ? 'restoring' : 'normal');
            }
            else if (message.action === 'crash') {
                collectAndSendReport(message);
            }
            else if (message.action === 'previousSession:get') {
                getPreviousSession(message.sessionId, false);
            }
            else if (message.action === 'previousSession:restore') {
                getPreviousSession(message.sessionId, true);
            }
            else if (message.action === 'first-install') {
                sendEvent('install');
            }
            else if (message.action === 'sdtab:open') {
                setTimeout(() => {
                }, 3000);
            }
            else if (message.action === 'storage:fs:getState') {
                console.info('sendResponse(FileSystem.state)');
                return true;
            }
            else if (message.action === 'thumbmaker:getimagedatapath') {
                console.info('thumbmaker:getimagedatapath', message.params);
                ThumbMaker.getImageDataPath(message.params, function (imgUrl, size) {
                    sendResponse({
                        imgUrl: imgUrl,
                        size: size,
                    });
                });
                return true;
            }
            else if (message.action === 'thumbmaker:screentab') {
                ThumbMaker.screenTab(message.params);
            }
            else if (message.action === 'sync:adddatatosync') {
                fvdSpeedDial.Sync.addDataToSync(message.params, function () {
                    if (message.wantResponse) {
                        sendResponse();
                    }
                });
                if (message.wantResponse) {
                    return true;
                }
            }
            else if (message.action === 'sync:removesyncdata') {
                fvdSpeedDial.Sync.removeSyncData(message.params, function () {
                    sendResponse();
                });
                return true;
            }
            else if (message.action === 'sync:isactive') {
                sendResponse(fvdSpeedDial.Sync.isActive());
                return true;
            }
            else if (message.action === 'sync:hasdatatosync') {
                fvdSpeedDial.Sync.hasDataToSync(function (has) {
                    sendResponse(has);
                });
                return true;
            }
            else if (message.action === 'sync:start') {
                fvdSpeedDial.Sync.startSync(message.type, function (state) {
                    sendResponse(state);
                });
                return true;
            }
            else if (message.action === 'sync:addonoptionsurl') {
                fvdSpeedDial.Sync.syncAddonOptionsUrl(sendResponse);
                return true;
            }
            else if (message.action === 'sync:importfinish') {
                fvdSpeedDial.Sync.importFinished();
            }
            else if (message.action === 'sync:syncaddonexists') {
                fvdSpeedDial.Sync.syncAddonExists(sendResponse);
                return true;
            }
            else if (message.action === 'hiddencapture:queue') {
                const params = message.params;
                let cb = null;
                if (params.wantResponse) {
                    cb = function (res) {
                        sendResponse(res);
                    };
                }
                HiddenCaptureQueue.capture(params, cb);
                if (cb) {
                    return true;
                }
            }
            else if (message.action === 'hiddencapture:empty') {
                HiddenCaptureQueue.empty();
            }
            else if (message.action === 'storage:dialsCleared') {
                HiddenCaptureQueue.empty();
            }
            else if (message.action === 'deny:changed') {
            }
            else if (message.action === 'proxy:storage') {
                const startTime = new Date().getTime();
                if (message.wantResponse) {
                    message.args.push(function () {
                        const duration = (new Date().getTime() - startTime) / 1000;
                        sendResponse({
                            args: Array.prototype.slice.call(arguments),
                            receiveTime: startTime,
                            duration: duration,
                        });
                    });
                }
                let accessObj = StorageSD;
                const parts = message.method.split('.');
                const m = parts.pop();
                parts.forEach(function (part) {
                    accessObj = accessObj[part];
                });
                accessObj[m].apply(accessObj, message.args);
                if (message.wantResponse) {
                    return true;
                }
            }
            else if (message.action === 'miscDataSet' && message.name === 'sd.background') {
                console.log('To front page!!!!');
            }
            if (message.action === 'pref:changed' &&
                (message.name === 'poweroff.enabled' || message.name === 'poweroff.hidden')) {
                Broadcaster.sendMessage({
                    action: 'poweroff:hiddenchange',
                    isHidden: message.value,
                });
            }
            if (message.action === 'pref:changed') {
                that._prefChangeCallback(message.name, message.value);
            }
            if (message.action === 'pref:changed' && message.name === 'poweroff.idle.interval') {
                refreshIdleInterval(fvdSpeedDial);
            }
        });
    }
    externalListener() {
        chrome.runtime.onMessageExternal.addListener(function (message, sender, callback) {
            switch (message.action) {
                case 'sayHello':
                    callback('hello');
                    break;
            }
        });
    }
    onInstalledListener() {
        const { fvdSpeedDial } = this;
        const { onInstalledDetails, fvdSpeedDial: { localStorage, Utils }, } = this;
        if (onInstalledDetails) {
            if (onInstalledDetails.reason === 'install') {
                localStorage.setItem('installVersion', chrome.runtime.getManifest().version);
            }
            else if (onInstalledDetails.reason === 'update') {
                Utils.releaseNotes(fvdSpeedDial, true);
            }
        }
    }
    addEventListener(eventType, cb) {
        if (eventType === EventType.LOAD) {
            cb();
        }
        else if (eventType === EventType.UNLOAD) {
        }
    }
    refreshUrls() {
        const refreshUrls = [Config.NEWTAB_URL];
        refreshUrls.forEach(function (url) {
            chrome.tabs.query({
                url: url,
            }, function (tabs) {
                if (!tabs) {
                    console.log('Fail get tab', url, chrome.runtime.lastError);
                    return;
                }
                for (let i = 0; i < tabs.length; i++) {
                    const { id, status } = tabs[i];
                    if (status === 'loading' || typeof id === 'undefined') {
                        continue;
                    }
                    chrome.tabs.update(id, {
                        url: chrome.runtime.getURL('newtab.html'),
                    });
                }
            });
        });
    }
    _prefChangeCallback(name, value) {
        const { fvdSpeedDial: { Prefs, StorageSD }, } = this;
        if (['sd.enable_top_sites', 'sd.enable_most_visited', 'sd.enable_recently_closed'].indexOf(name) !== -1) {
            const enableSpeedDial = _b(Prefs.get('sd.enable_top_sites'));
            const enableMostVisited = _b(Prefs.get('sd.enable_most_visited'));
            const enableRecentlyClosed = _b(Prefs.get('sd.enable_recently_closed'));
            console.info({ enableSpeedDial, enableMostVisited, enableRecentlyClosed });
            const disabledItems = [];
            if (!enableSpeedDial) {
                disabledItems.push('speeddial');
            }
            if (!enableMostVisited) {
                disabledItems.push('mostvisited');
            }
            if (!enableRecentlyClosed) {
                disabledItems.push('recentlyclosed');
            }
            try {
                const [type] = Utils.arrayDiff(['speeddial', 'mostvisited', 'recentlyclosed'], disabledItems);
                if (disabledItems.indexOf(Prefs.get('sd.display_type')) !== -1) {
                    Prefs.set('sd.display_type', type);
                }
                if (disabledItems.indexOf(Prefs.get('sd.last_selected_display_type')) !== -1) {
                    Prefs.set('sd.last_selected_display_type', type);
                }
            }
            catch (ex) {
                console.warn(ex);
            }
            chrome.runtime.sendMessage({
                action: 'forceRebuild',
                needActiveTab: true,
            });
        }
        else if (name === 'sd.scrolling') {
            Prefs.set('sd.recentlyclosed_columns', 'auto');
            Prefs.set('sd.top_sites_columns', 'auto');
        }
        else if (name === 'sd.display_popular_group') {
            Utils.Async.chain([
                function (chainCallback) {
                    if (parseInt(Prefs.get('sd.default_group')) === 0) {
                        StorageSD.groupsList(function (groups) {
                            const group = groups[0];
                            const newId = group.id;
                            Prefs.set('sd.default_group', newId);
                            chainCallback();
                        });
                    }
                    else {
                        chainCallback();
                    }
                },
                function () {
                    chrome.runtime.sendMessage({
                        action: 'forceRebuild',
                        resetActiveGroup: true,
                        needDisplayType: 'speeddial',
                    });
                },
            ]);
        }
    }
    setUninstallURL() {
        const { fvdSpeedDial: { Prefs, localStorage }, } = this;
        if (chrome.runtime.hasOwnProperty('setUninstallURL')) {
            const uninstallURL = Config.UNINSTALL_URL +
                '?client=sd_chrome' +
                '&version=' +
                chrome.runtime.getManifest().version +
                '&version_install=' +
                localStorage.getItem('installVersion') +
                '&start=' +
                localStorage.getItem('prefs.sd.install_time') +
                '&end=' +
                Date.now() +
                '&provider=' +
                encodeURIComponent(Prefs.get('sd.search_provider') || 'fvd');
            chrome.runtime.setUninstallURL(uninstallURL);
        }
        else {
            console.info('set uninstall url is not available');
        }
    }
}
new Worker();
