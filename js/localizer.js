export function _(msg) {
	let text = chrome.i18n.getMessage(msg);

	if (!text) {
		text = "";
	}

	return text;
}

const Localizer = function () {

};

Localizer.prototype = {
	localizeCurrentPage: function () {
		if (typeof window === 'undefined') return;

		this.localizeElem(document);
	},
	localizeElem: function (el) {
		const elements = el.querySelectorAll("*[msg]");

		for (let i = 0, len = elements.length; i !== len; i++) {
			const element = elements[i];

			if (element.hasAttribute("msg_target")) {
				element.setAttribute(element.getAttribute("msg_target"), _(element.getAttribute("msg")));
			} else {
				element.innerHTML = _(element.getAttribute("msg"));
			}

			element.removeAttribute("msg");
		}
	},
};

export default new Localizer();

