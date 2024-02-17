var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import LocalStorage from './LocalStorage.js';
import BackupModule from './BackupModule.js';
import Prefs from './prefs.js';
class FvdSpeedDialModule {
    constructor(eventListener, modulesConfig = {}) {
        this.modulesConfig = {
            sync: false,
            mode: "worker",
        };
        this.Backup = new BackupModule(this);
        this.localStorage = new LocalStorage();
        this.addEventListener = eventListener;
        Object.assign(this.modulesConfig, modulesConfig);
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.modulesConfig.mode === "worker") {
            }
            yield this.localStorage.init();
            this.Prefs = new Prefs(this);
            if (this.modulesConfig.mode === "page") {
            }
        });
    }
    id(cb) {
        chrome.management.getSelf((app) => {
            cb(app.id);
        });
    }
}
export default FvdSpeedDialModule;
