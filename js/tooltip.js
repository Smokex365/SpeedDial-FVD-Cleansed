import Templates from './templates.js';
import { Utils } from './utils.js';

const ToolTip = function () {

};

ToolTip.prototype = {
	_container: null,
	_arrowLeftOffset: 10,
	_arrowTopOffset: 19,
	_currentElement: null,

	displayImage: function (elem, imageSrc, event) {
		const html = `<img src="${imageSrc}" alt=""/>`;

		this.display(elem, html, event);
	},
	display: function (elem, html, event, isText) {
		event.stopPropagation();

		if (this._currentElement === elem) {
			return;
		}

		this._currentElement = elem;

		this.setFunction = () => {
			const toolTipContainer = Templates.clone("tiptip_holder");

			this._container = toolTipContainer;

			// position
			const offset = Utils.getOffset(elem);

			toolTipContainer.style.left = offset.left + (elem.offsetWidth/2) - this._arrowLeftOffset - 1 + "px";
			toolTipContainer.style.top = offset.top + elem.offsetHeight + this._arrowTopOffset + "px";

			document.body.appendChild(this._container);
			const contentContainer = document.getElementById("tiptip_content");

			if (isText) {
				  contentContainer.classList.add("textTip");
			}

			if (html.tagName) {
				contentContainer.appendChild(html);
			} else {
				contentContainer.innerHTML = html;
			}

			setTimeout(() => {
				toolTipContainer.setAttribute("active", 1);
				this._assignClickListener();
			}, 0);
		};

		if (this._container) {
			this.close(this.setFunction);
		} else {
			this.setFunction();
		}
	},

	close: function (callback) {
		if (this._container) {
			this._container.setAttribute("active", 0);
			this._container.addEventListener("webkitTransitionEnd", () => {
				try {
					this._container.parentNode.removeChild(this._container);
					this._container = null;
					this._currentElement = null;
					this._removeClickListener();
	
					if (callback) {
						callback();
					}
				} catch (ex) {
					console.warn(ex);
				}
			}, false);
		} else {
			console.info('_container is', typeof _container);
		}

	},

	_clickListener: function (event) {
		if (this._container) {
			let el = event.target;

			do {
				if (el === this._container) {
					return;
				}

				el = el.parentNode;
			}
			while (el);
		}

		this.close();
	},

	_assignClickListener: function () {
		document.addEventListener("click", this._clickListener.bind(this), false);
	},

	_removeClickListener: function () {
		document.removeEventListener("click", this._clickListener.bind(this));
	},
};

export default new ToolTip();

