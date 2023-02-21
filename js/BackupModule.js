var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Broadcaster from './_external/broadcaster.js';
export var BackupKeys;
(function (BackupKeys) {
    BackupKeys["LOCAL_STORAGE_CHECK"] = "installVersion";
    BackupKeys["LOCAL_STORAGE_BACKUP"] = "localstorage_backup";
    BackupKeys["LOCAL_STORAGE_RESTORED"] = "localStorageRestored";
    BackupKeys["BACKGROUND_BACKUP"] = "background_backup";
    BackupKeys["BACKGROUND_RESTORED"] = "backgroundImageRestored";
    BackupKeys["DATABASE_BACKUP"] = "database_backup";
})(BackupKeys || (BackupKeys = {}));
const FORCE_RESTORE = false;
class BackupModule {
    constructor(fvdSpeedDial) {
        this.exclude = [
            'last',
            'current',
            '_app_log',
            BackupKeys.DATABASE_BACKUP,
            BackupKeys.BACKGROUND_BACKUP,
            BackupKeys.LOCAL_STORAGE_BACKUP,
        ];
        this.isRestoring = false;
        this.backgroundImageBackup = function (cb) {
            const { fvdSpeedDial: { StorageSD }, } = this;
            console.info('DatabaseBackup: do background backup');
            StorageSD.getMisc('sd.background', (fileUrl) => __awaiter(this, void 0, void 0, function* () {
                if (!fileUrl) {
                    return cb(false);
                }
                yield chrome.storage.local.set({ background_backup: fileUrl });
                cb(true);
            }));
        };
        this.fvdSpeedDial = fvdSpeedDial;
        if (this.isWorker) {
            this.listeners();
        }
    }
    get isWorker() {
        return typeof window === 'undefined';
    }
    listeners() {
        Broadcaster.onMessage.addListener((msg, sender, sendResponse) => {
            if (msg && msg.action === 'databaseBackup:getState') {
                sendResponse(this.isRestoring ? 'restoring' : 'normal');
            }
        });
    }
    localStorageBackup() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield chrome.storage.local.get();
            const backupData = Object.keys(data).reduce((acc, key) => {
                if (!this.exclude.includes(key)) {
                    acc[key] = data[key];
                }
                return acc;
            }, {});
            yield chrome.storage.local.set({ [BackupKeys.LOCAL_STORAGE_BACKUP]: backupData });
            return true;
        });
    }
    localStorageCheck(force = FORCE_RESTORE) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = false;
            const check = yield chrome.storage.local.get([BackupKeys.LOCAL_STORAGE_CHECK]);
            console.info('localStorageCheck', check);
            if (force || !check[BackupKeys.LOCAL_STORAGE_CHECK]) {
                const data = yield chrome.storage.local.get([BackupKeys.LOCAL_STORAGE_BACKUP]);
                if (typeof data[BackupKeys.LOCAL_STORAGE_BACKUP] === 'object') {
                    yield chrome.storage.local.set(Object.assign({ [BackupKeys.LOCAL_STORAGE_RESTORED]: Date.now() }, data[BackupKeys.LOCAL_STORAGE_BACKUP]));
                    console.warn('LocalStorage has been restored', new Date());
                    Broadcaster.sendMessage({
                        action: 'finishLocalStorageRestore',
                    });
                    result = true;
                }
            }
            return result;
        });
    }
    backgroundImageCheck(force = FORCE_RESTORE) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fvdSpeedDial: { StorageSD }, } = this;
            console.info('Background image check');
            const check = yield chrome.storage.local.get([
                BackupKeys.LOCAL_STORAGE_RESTORED,
                BackupKeys.BACKGROUND_RESTORED,
            ]);
            const localStorageRestored = check[BackupKeys.LOCAL_STORAGE_RESTORED] || 0;
            const backgroundRestored = check[BackupKeys.BACKGROUND_RESTORED] || 0;
            if (force || localStorageRestored > backgroundRestored) {
                const data = yield chrome.storage.local.get([BackupKeys.BACKGROUND_BACKUP]);
                if (data[BackupKeys.BACKGROUND_BACKUP]) {
                    yield new Promise((resolve) => {
                        StorageSD.setMisc('sd.background', data[BackupKeys.BACKGROUND_BACKUP], () => {
                            console.warn('Background image has been restored', new Date());
                            resolve();
                        });
                    });
                }
                yield chrome.storage.local.set({
                    [BackupKeys.BACKGROUND_RESTORED]: Date.now(),
                });
            }
            return true;
        });
    }
    dataBaseCheck(createdTables = [], force = FORCE_RESTORE) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fvdSpeedDial: { StorageSD }, } = this;
            let result = false;
            if (!this.isWorker) {
                console.info('Skip backup for pages');
                return result;
            }
            console.info('#'.repeat(50));
            const [dials] = StorageSD.DB.tables.filter((table) => table.name === 'dials');
            const [groups] = StorageSD.DB.tables.filter((table) => table.name === 'groups');
            const dialsCount = yield dials.count();
            const groupsCount = yield groups.count();
            console.info('groups', dialsCount, groups);
            console.info('dials', groupsCount, dials);
            if (force || !groupsCount || !dialsCount) {
                const data = yield chrome.storage.local.get([BackupKeys.DATABASE_BACKUP]);
                console.info('data', data);
                if (typeof data[BackupKeys.DATABASE_BACKUP] === 'object') {
                    console.info('DATABASE_BACKUP', data);
                    this.dataBaseRestore(data[BackupKeys.DATABASE_BACKUP]);
                }
            }
            return result;
        });
    }
    dataBaseRestore(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fvdSpeedDial: { StorageSD }, } = this;
            console.info('Start restoring database backup, restore data is', data);
            this.isRestoring = true;
            Broadcaster.sendMessage({
                action: 'startDBRestore',
            });
            const end = () => {
                console.info('End', 'send restoring false');
                this.isRestoring = false;
                Broadcaster.sendMessage({
                    action: 'finishDBRestore',
                });
            };
            return new Promise((resolve, reject) => {
                const restoreTimeout = setTimeout(function () {
                    end();
                    console.info('Backup restoring has been timed out');
                    reject(new Error('backup restore timed out'));
                }, 5 * 60 * 1000);
                const startTime = new Date().getTime();
                StorageSD.restoreTablesDataInOneTransaction(data, () => {
                    console.info('Database backup has been restored');
                    const endTime = new Date().getTime();
                    console.info('Restore duration: ' + (endTime - startTime) / 1000);
                    clearTimeout(restoreTimeout);
                    end();
                    resolve(true);
                }, null, true);
            });
        });
    }
}
export default BackupModule;
