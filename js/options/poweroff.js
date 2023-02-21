import { _ } from '../localizer.js';
import { Utils } from '../utils.js';

const OptionsPowerOff = function (fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;
	const {PowerOff, Options, Dialogs} = this.fvdSpeedDial;

	function refresh() {
		const tabChangePass = document.getElementById("poweroffTabChangePassCode");
		const tabRestore = document.getElementById("poweroffTabRestorePassCode");
		const setupForm = document.querySelector(".tabCreate .createPassCode");
		const setupedMessage = document.querySelector(".tabCreate .setuped");

		if (!PowerOff.isEnabled()) {
			tabChangePass.style.display = "none";
			tabRestore.style.display = "none";

			if (Options.Tabs.tabsA["powerOffTabs"]) {
				Options.Tabs.tabsA["powerOffTabs"].setActiveTab(0);
			}

			setupForm.style.display = "block";
			setupedMessage.style.display = "none";

		} else {
			tabChangePass.style.display = "";
			tabRestore.style.display = "";

			setupForm.style.display = "none";
			setupedMessage.style.display = "block";

			document.getElementById("currentPassCodeEmail").textContent = PowerOff.getEmail();
		}
	}

	function hideErrors() {
		const errors = document.querySelectorAll("#poweroffSettings .error");

		for (let i = 0; i !== errors.length; i++) {
			errors[i].style.display = "none";
		}
	}

	function showError(id, text) {
		const error = document.getElementById(id);

		console.log(id, error);
		error.textContent = text;
		error.style.display = "block";
	}

	this.createPassCode = function () {
		hideErrors();

		const passCode = document.getElementById("passcodeValue").value;
		const repeatPasscode = document.getElementById("repeatPasscodeValue").value;
		const email = document.getElementById("reserveEmailValue").value;

		if (!passCode) {
			return showError("createPassCodeError", _("options_poweroff_error_empty_passcode"));
		}

		if (passCode !== repeatPasscode) {
			return showError("createPassCodeError", _("options_poweroff_error_passcode_dont_match"));
		}

		if (!Utils.validateText("email", email)) {
			return showError("createPassCodeError", _("options_poweroff_error_email_wrong_format"));
		}

		document.getElementById("passcodeValue").value = "";
		document.getElementById("repeatPasscodeValue").value = "";
		document.getElementById("reserveEmailValue").value = "";

		PowerOff.setup(email, passCode);
		//document.getElementById( "closeButton" ).setAttribute( "active", 1 );
		refresh();
	};

	this.changePassCode = function () {
		hideErrors();

		const oldPassCode = document.getElementById("oldPasscodeValue").value;
		const newPassCode = document.getElementById("newPasscodeValue").value;

		if (!PowerOff.checkPassword(oldPassCode)) {
			return showError("changePassCodeError", _("options_poweroff_error_wrong_pass_code"));
		}

		document.getElementById("oldPasscodeValue").value = "";
		document.getElementById("newPasscodeValue").value = "";

		//document.getElementById( "closeButton" ).setAttribute( "active", 1 );

		if (!newPassCode) {
			PowerOff.removePassword();
			refresh();

			return;
		}

		PowerOff.changePassword(newPassCode);

		Dialogs.alert(_("options_poweroff_passcode_changed_title"), _("options_poweroff_passcode_changed_text"));
	};

	this.restorePassCode = function () {
		PowerOff.restorePassword(function () {
			Dialogs.alert(_("options_powerof_password_restore_title"), _("options_powerof_password_restore_text") + ":<br>" + PowerOff.getEmail());
		});
	};

	document.getElementById("createPassCode").addEventListener("click", () =>  {
		this.createPassCode();
	}, false);

	document.getElementById("changePassCode").addEventListener("click", () =>  {
		this.changePassCode();
	}, false);

	document.getElementById("resorePassCode").addEventListener("click", () =>  {
		this.restorePassCode();
	}, false);

	refresh();
};

export default OptionsPowerOff;
