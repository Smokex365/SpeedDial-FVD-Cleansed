import Prefs from '../prefs.js';

const Donate = {
	canShow: function () {
		return !Prefs.get("paypal-donate-state");
	},
};

export default Donate;