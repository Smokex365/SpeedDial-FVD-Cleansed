import { Utils } from './utils.js';
import LocalStorage from './LocalStorage.js';

const UserInfo = {
	_isGettingUserCountry: false,
	_userCountryCallbacks: [],
	getCountry: async function (cb) {
		const self = this;
		const key = 'user_info.country';
		const value = await LocalStorage.getItem(key);

		if (value) {
			return cb(null, value);
		}

		this._userCountryCallbacks.push(cb);

		if (this._isGettingUserCountry) {
			return;
		}

		this._isGettingUserCountry = true;
		Utils.getUserCountry(function (country) {
			if (!country) {
				country = '-';
			}

			LS.setItem(key, country);
			self._userCountryCallbacks.forEach(function (cb) {
				try {
					cb(null, country);
				} catch (ex) {
					console.error(ex);
				}
			});
			self._userCountryCallbacks = [];
		});
	},
};

export default UserInfo;
