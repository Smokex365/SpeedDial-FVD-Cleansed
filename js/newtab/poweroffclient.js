import Broadcaster from '../_external/broadcaster.js';
import Dialogs from '../dialogs.js';
import { _ } from '../localizer.js';
import { EventType } from '../types.js';

const PowerOffClientModule = function (fvdSpeedDial) {
	const self = this;
	this.fvdSpeedDial = fvdSpeedDial;

	const deck = null;
	let powerOffButton = null;
	let passCodeField = null;
	let enterPassCodeButton = null;

	function callback_hiddenChange() {
		refresh();
	}

	function refresh(params) {
		const { SpeedDial } = fvdSpeedDial;

		params = params || {};

		if (typeof params.total === 'undefined') {
			params.total = true;
		}

		if (self.isHidden()) {
			document.body.setAttribute('poweroff', '1');

			powerOffButton.setAttribute('active', '1');
		} else {
			document.body.setAttribute('poweroff', '0');
			powerOffButton.setAttribute('active', '0');
		}

		if (params.total) {
			SpeedDial.refreshExpandState();
		}
	}

	this.isHidden = function () {
		const {
			fvdSpeedDial: { PowerOff },
		} = this;

		return PowerOff.isHidden();
	};

	this.hide = function () {
		const {
			fvdSpeedDial: { SpeedDial, Prefs },
		} = this;

		if (!this.isHidden()) {
			Prefs.set('poweroff.hidden', true);
		}

		SpeedDial.refreshExpandState();
	};

	this.show = function () {
		const {
			fvdSpeedDial: { SpeedDial, Prefs },
		} = this;

		Prefs.set('poweroff.hidden', false);

		if (!SpeedDial.getExpandState()) {
			SpeedDial.toggleExpand();
		} else {
			SpeedDial.refreshExpandState();
		}
	};

	function tryEnterPasscode() {
		const { Dialogs, PowerOff } = fvdSpeedDial;
		const password = passCodeField.value;

		passCodeField.value = '';

		if (PowerOff.checkPassword(password)) {
			self.show();
		} else {
			const btns = {};

			btns[_('options_poweroff_restore_button')] = dlg => {
				dlg.close();

				PowerOff.restorePassword(function () {
					Dialogs.alert(
						_('options_powerof_password_restore_title'),
						_('options_powerof_password_restore_text') + ':<br>' + PowerOff.getEmail()
					);
				});
			};

			Dialogs.alert(
				_('newtab_powerof_wrong_passcode_title'),
				_('newtab_powerof_wrong_passcode_text'),
				false,
				{ btns: btns, ok: _('dlg_button_close') }
			);
		}
	}

	fvdSpeedDial.addEventListener(
		EventType.LOAD,
		function () {

			powerOffButton = document.querySelector('#searchBar .rightMenu .powerOff');
			passCodeField = document.getElementById('poweroffPassCode');
			enterPassCodeButton = document.getElementById('enterPowerOffPassCode');

			powerOffButton.addEventListener(
				'click',
				function () {
					if (self.fvdSpeedDial.PowerOff.isEnabled()) {
						self.hide();
					} else {
						window.open(chrome.runtime.getURL('/options.html#poweroff'));
					}
				},
				false
			);

			powerOffButton.addEventListener(
				'mouseover',
				function () {
					document
						.querySelector('#speedDialCollapsedContent .collapsedMessagePoweroffForm')
						.setAttribute('notransparency', 1);
				},
				false
			);

			powerOffButton.addEventListener(
				'mouseout',
				function () {
					document
						.querySelector('#speedDialCollapsedContent .collapsedMessagePoweroffForm')
						.removeAttribute('notransparency');
				},
				false
			);

			passCodeField.addEventListener(
				'click',
				function (event) {
					event.stopPropagation();
					event.preventDefault();
				},
				false
			);
			passCodeField.addEventListener(
				'mousedown',
				function (event) {
					event.stopPropagation();
				},
				false
			);

			passCodeField.addEventListener(
				'keypress',
				function (event) {
					if (event.keyCode === 13) {
						tryEnterPasscode();
					}
				},
				false
			);

			enterPassCodeButton.addEventListener(
				'click',
				function () {
					tryEnterPasscode();
				},
				false
			);
			enterPassCodeButton.addEventListener(
				'mousedown',
				function (event) {
					event.stopPropagation();
				},
				false
			);

			Broadcaster.onMessage.addListener(function (msg) {
				if (msg.action === 'poweroff:hiddenchange') {
					callback_hiddenChange();
				} else if (msg.action === 'poweroff:hide') {
					self.hide();
				}
			});

			refresh({
				total: false,
			});
		},
		false
	);
};

export default PowerOffClientModule;
