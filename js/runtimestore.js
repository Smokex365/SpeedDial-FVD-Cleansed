// cleaned after addon/browser restart
import Broadcaster from './_external/broadcaster.js';

const RuntimeStore = function (fvdSpeedDial) {
	this.fvdSpeedDial = fvdSpeedDial;

	const PREFIX = "__runtime_storage:";
	// clean

	// for (const k in localStorage) { // TODO надо подтереть префс?
	// 	if (k.indexOf(PREFIX) === 0) {
	// 		delete localStorage[k];
	// 	}
	// }
	function _key(k) {
		return PREFIX + k;
	}

	this.set = (k, v) => {
		this.fvdSpeedDial.Prefs.set(_key(k), JSON.stringify({
			value: v,
			type: typeof v,
		}));
		Broadcaster.sendMessage({
			action: "runtimestore:itemchanged",
			name: k,
			value: v,
		});
	};

	this.get = k => {
		let t = this.fvdSpeedDial.Prefs.get(_key(k));

		if (!t) {
			return;
		}

		t = JSON.parse(t);
		let v = t.value;

		switch (t) {
			case "boolean":
				v = v === "true";
				break;
			case "number":
				v = parseInt(v, 10);
				break;
		}
		return v;
	};
};

export default RuntimeStore;