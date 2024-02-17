import { Aes } from './_external/aes.js';
import { _b } from './utils.js';

function PowerOffModule(fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;

	const PASSPHRASE = '*j12398sdfh4123iud9123';
	let SERVER_URL = 'https://qa.fvdspeeddial.com/sdserver/poweroff.php';
		SERVER_URL = 'https://fvdspeeddial.com/sdserver/poweroff.php';
	
	function cryptString(string) {
		return Aes.Ctr.encrypt(string, PASSPHRASE, 256);
	}

	function deCryptString(string) {
		return Aes.Ctr.decrypt(string, PASSPHRASE, 256);
	}

	function getPassword() {
		const { Prefs } = fvdSpeedDial;
		return deCryptString(Prefs.get('poweroff.password'));
	}

	function getEmail() {
		const { Prefs } = fvdSpeedDial;
		return deCryptString(Prefs.get('poweroff.restore_email'));
	}

	this.isHidden = function () {
		const { Prefs, PowerOff } = fvdSpeedDial;
		return !!(PowerOff.isEnabled() && _b(Prefs.get('poweroff.hidden')));
	};

	this.getEmail = function () {
		return getEmail();
	};

	this.isEnabled = function () {
		const { Prefs } = fvdSpeedDial;
		return _b(Prefs.get('poweroff.enabled'));
	};

	this.setup = function (email, password) {
		const { Prefs } = fvdSpeedDial;
		Prefs.set('poweroff.enabled', true);
		Prefs.set('poweroff.password', cryptString(password));
		Prefs.set('poweroff.restore_email', cryptString(email));
	};

	this.removePassword = function () {
		const { Prefs } = fvdSpeedDial;
		Prefs.set('poweroff.enabled', false);
	};

	this.changePassword = function (password) {
		const { Prefs } = fvdSpeedDial;
		Prefs.set('poweroff.password', cryptString(password));
	};

	this.checkPassword = function (password) {
		return password === getPassword();
	};

	this.restorePassword = function (callback) {
		const { Prefs } = fvdSpeedDial;
		const url = `${SERVER_URL}?a=restore&email=${encodeURIComponent(
			getEmail()
		)}&epassword=${encodeURIComponent(Prefs.get('poweroff.password'))}`;

		fetch(url)
			.then(req => {
				try {
					callback(req);
				} catch (ex) {
					console.warn(ex);
					callback({ error: true });
				}
			})
			.catch(() => {
				callback({ error: true });
			});
	};
}

export default PowerOffModule;
