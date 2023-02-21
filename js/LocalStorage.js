var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class LocalStorage {
    constructor(initMode = {}) {
        this.storage = {};
        this.exclude = [
            'last',
            'current',
            '_app_log',
            'database_backup',
            'background_backup',
            'localstorage_backup',
        ];
        this.mode = Object.assign({
            listen: true,
        }, initMode);
    }
    listener() {
        chrome.storage.local.onChanged.addListener((changes) => {
            Object.keys(changes).forEach((key) => {
                if (!this.exclude.includes(key)) {
                    if (changes[key].hasOwnProperty('newValue')) {
                        this._setStorageItem(key, changes[key].newValue);
                    }
                    else {
                        this._removeStorageItem(key);
                    }
                }
            });
        });
    }
    _setStorageItem(key, val) {
        this.storage[key] = val;
    }
    _removeStorageItem(key) {
        if (this.storage.hasOwnProperty(key)) {
            delete this.storage[key];
        }
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.preload();
            if (this.mode.listen) {
                this.listener();
            }
            return this.storage;
        });
    }
    preload() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                chrome.storage.local.get((result) => {
                    this.storage = Object.keys(result).reduce((storage, key) => {
                        if (!this.exclude.includes(key)) {
                            storage[key] = result[key];
                        }
                        return storage;
                    }, {});
                    resolve(this.storage);
                });
            });
        });
    }
    getAllItems() {
        return this.storage;
    }
    getItemAsync(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const values = yield chrome.storage.local.get(key);
            return values.hasOwnProperty(key) ? values[key] : undefined;
        });
    }
    setItemAsync(key, val) {
        return chrome.storage.local.set({ [key]: val });
    }
    removeItemAsync(key) {
        return chrome.storage.local.remove([key]);
    }
    getItem(key) {
        return this.storage.hasOwnProperty(key) ? this.storage[key] : undefined;
    }
    hasItem(key) {
        return this.storage.hasOwnProperty(key);
    }
    setItem(key, val) {
        this._setStorageItem(key, val);
        return this.setItemAsync(key, val);
    }
    removeItem(key) {
        this._removeStorageItem(key);
        return this.removeItemAsync(key);
    }
}
export default LocalStorage;
