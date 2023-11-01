import { FVDEventEmitter, Utils } from '../utils.js';
import { dd_hide } from './dropdown.js';

let _lastaCIndex = 0;
const acSources = {};
let acSourcesXHR = null;

/*
* @param [string] params.query
*/
acSources.lcs = function (params, cb) {
	if (acSourcesXHR) {
		acSourcesXHR.abort();
	}

	const url = "https://services.rt53.net/getSuggestions?sourceID=nimbus-opera&format=unorderedList&q=" + encodeURIComponent(params.query);
	const req = new XMLHttpRequest();

	acSourcesXHR = req;
	req.open('GET', url, true);
	req.inst = this;
	req.q = "";
	req.onload = function () {
		acSourcesXHR = null;
		const result = {
			query: params.query,
			items: [],
		};

		if (typeof req.response === 'string') {
			const div = document.createElement('div');

			div.innerHTML = req.response;
			const items = div.getElementsByTagName('li');

			for (const item of items) {
				const suggestion = {};
				const links = item.getElementsByTagName('a');

				if (links.length) {
					const link = links[0];

					suggestion.term = link.innerText.trim();
					suggestion.click_url = link.getAttribute('href');
					const icon = link.getElementsByTagName('img');

					if (icon.length) {
						suggestion.image_url = icon[0].getAttribute('src');
					}

					const pixel = item.getElementsByTagName('ldc_impression_pixel');

					if (pixel.length) {
						suggestion.impression_url = pixel[0].getAttribute('src');
					}
				} else {
					suggestion.term = item.innerText.trim();
				}

				result.items.push(suggestion);
			}
			div.remove();
		}

		if (result.items.length) {
			cb(result);
		} else {
			acSources.google(params, cb);
		}
	};
	req.onerror = function (ex) {
		console.warn(ex);
		acSources.google(params, cb);
	};
	req.send(null);
};

/*
   * @param [string] params.query
   */
acSources.google = function (params, cb) {
	if (acSourcesXHR) {
		acSourcesXHR.abort();
	}

	const url = "https://google.com/complete/search?output=toolbar&q=" + encodeURIComponent(params.query);
	const req = new XMLHttpRequest();

	acSourcesXHR = req;
	req.open('GET', url, true);
	req.inst = this;
	req.q = "";
	req.onload = function () {
		acSourcesXHR = null;
		const r = req.responseXML;


		if (r) {
			const elems = r.getElementsByTagName("suggestion");
			const items = [];

			for (let i = 0; i !== elems.length; i++) {
				items.push(elems[i].getAttribute("data"));
			}
			cb({
				items: items,
			});
		}
	};
	req.send(null);
};

function addLoadEvent(a) {
	window.addEventListener("load", a);
}

/*
   * @param [string] params.input - selector
   * @param [string] params.form - selector
   */
function AutoCompletePlus(params) {
	const fvdSpeedDial = params.fvdSpeedDial || null;
	const acId = ++_lastaCIndex;
	const suggestElemId = "suggest_" + acId;
	const suggestionsTableId = "suggestions_" + acId;
	const self = this;
	let acpObj = {};
	const inputEl = document.querySelector(params.input);
	const relElem = params.rel ? document.querySelector(params.rel) : inputEl;
	let acFunction = null;
	let acSource = 'lcs'; //inputEl.hasAttribute("data-autocomplete-source") ? inputEl.getAttribute("data-autocomplete-source") : "google";

	this.onPopupShow = new FVDEventEmitter();
	this.onPopupHide = new FVDEventEmitter();
	this.onClickSuggestion = new FVDEventEmitter();

	this.setSource = function (source) {
		acSource = source;
	};

	this.setFunction = function (fn) {
		acFunction = fn;
	};

	function $(id) {
		if (id === "force_acp_object_imput") {
			return acpObj.force_input_obj;
		} else if (id === "force_acp_object_form") {
			return acpObj.force_form_obj;
		}

		return document.getElementById(id);
	}

	function autocompleteHide(event) {
		const suggest = $(suggestElemId);

		if (suggest) {
			suggest.style.display = "none";
		}

		document.removeEventListener("click", autocompleteHide, true);
		self.onPopupHide.callListeners();

		if (event) {
			event.stopPropagation();
		}
	}

  const autocompleteShow = () => {
		this.onPopupShow.callListeners();
		const suggestions = $(suggestElemId);

		suggestions.style.display = "block";
		suggestions.style.opacity = 0;
		autocompleteAlign(suggestions);
		setTimeout(()=>{
			autocompleteAlign(suggestions);
			suggestions.style.opacity = 1;
		}, 1);
	}

	function autocompleteAlign(suggestions) {
		const offset = Utils.getOffset(relElem);
		const top = offset.top + relElem.offsetHeight + 3;

		suggestions.style.left = offset.left - 9 + 'px';
		suggestions.style.top = top + 'px';
		suggestions.style.width = relElem.clientWidth + 10 + 'px';
	}

	function startAutocomplete() {
		acpObj = {
			force_input_obj : document.querySelector(params.input),
			force_form_obj : document.querySelector(params.form),
			click_callback : function () {},
			acp_searchbox_id : "force_acp_object_imput", /* ID of the search <input tag   */
			acp_search_form_id : "force_acp_object_form", /* ID of the search form         */
			acp_partner : "flsh", /* AutoComplete+ partner ID      */
			acp_suggestions : "7", /* Number of suggestions to get  */
		};

		const input = $(acpObj.acp_searchbox_id);

    input && input.addEventListener("keyup", function (event) {
			acpObj.ac.keyup(event, input);
		});

		let container = document.createElement("div");
		container.setAttribute("class", "acp_ltr");
		const mainContainer = container;
		const table = document.createElement("table");

		container.appendChild(table);
		table.setAttribute("cellspacing", "0");
		container.setAttribute("style", "display:none");
		container.setAttribute("id", suggestElemId);
		const tbody = document.createElement("tbody");

		tbody.setAttribute("id", suggestionsTableId);
		table.appendChild(tbody);
		//document.querySelector('#front-content').appendChild(container);
	    //input.parentNode.appendChild(container);
		document.body.appendChild(container);

		if (!acpObj.acp_sig) {
			acpObj.acp_sig = "on";
		}

		if (acpObj.acp_sig === "on") {
			const tfoot = document.createElement("tfoot");
			const tr = document.createElement("tr");
			const td = document.createElement("td");

			tr.appendChild(td);
			tfoot.appendChild(tr);
			table.appendChild(tfoot);
		}

		container = table;

		const AutocompleteClass = (function () {
			function AutocompleteClass(mainClass) {
				this.main = mainClass;
				this.dropdown = {
					posY : -1,
					table : $(suggestionsTableId),
				};
			}
			AutocompleteClass.prototype.setStyles = function (selector, property, value) {
				let key;

				if (document.all) {
					key = "rules";
				} else {
					if (document.getElementById) {
						key = "cssRules";
					}
				}

				const last = document.styleSheets.length - 1;
				const length = document.styleSheets[last][key].length;

				for (let index = 0; index < length; index++) {
					if (document.styleSheets[last][key][index].selectorText === selector) {
						document.styleSheets[last][key][index].style[property] = value;
						return;
					}
				}
			};
			AutocompleteClass.prototype.keyup = function (event, input) {
				if (input.value.length === 0) {
					$(suggestElemId).style.display = "none";
					return;
				}

				if (event.keyCode === 27) {
					if ($(suggestElemId) && $(suggestElemId).style.display !== "none") {
						autocompleteHide(event);
						event.stopPropagation();
					}

					return;
				}

				switch (event.keyCode) {
					case 38:
						this.dropdown.posY--;
						break;
					case 40:
						this.dropdown.posY++;
						break;
					case 13:
					case 39:
					case 37:
						return;
					default:
						$(acpObj.acp_searchbox_id).removeAttribute("clickUrl");
						this.onInput(input.value);
						this.dropdown.posY = -1;
						return;
				}

				if (this.dropdown.posY < 0) {
					this.dropdown.posY = this.dropdown.table.rows.length - 1;
				}

				if (this.dropdown.posY >= this.dropdown.table.rows.length) {
					this.dropdown.posY = 0;
				}

				if (event.keyCode === 38 || event.keyCode === 40) {
					if ($(suggestElemId) && $(suggestElemId).style.display === "none") {
						autocompleteShow();
					}
				}

				this.navi();
			};
			AutocompleteClass.prototype.onInput = function (query) {
				if (!acpObj.acp_b) {
					acpObj.acp_b = 1;
				}

				if (!this.dropdown.table) {
					this.dropdown.table = $(suggestionsTableId);
					//var elem = $(acpObj.acp_searchbox_id);
				}

				this.search(query);
			};
			AutocompleteClass.prototype.search = function (query) {
				const that = this;

				if (acFunction) {
					return acFunction(query, function (err, suggestions) {
						if (err) {
							return console.error("Fail get suggestions", err);
						}

						that.createSuggestions({
							items: suggestions,
							query: query,
						});
					});
				}

				acSources[acSource]({
					query: query,
				}, function (result) {
					that.createSuggestions({
						"items" : result.items,
						"query" : query,
					});
				});
			};
			AutocompleteClass.prototype.createSuggestions = function (searchData) {
				const that = this;

				dd_hide();
				const table = $(suggestionsTableId);
				let list;

				if (Array.isArray(searchData.items)) {
					list = searchData.items;
				} else {
					list = String(searchData.items).split(",");
				}

				while (table.rows && table.rows.length) {
					table.deleteRow(-1);
				}
				for (const index in list) {
					const item = list[index];

					if (typeof item !== "object" && item === "") {
						continue;
					}

					const text = typeof item === "string" ? item : item.term;
					const data = typeof item === "object" ? item : {};

					const tr = table.insertRow(-1);
					const td = tr.insertCell(0);

					td.style.display = "block";

					const newdiv = this.bolderifyQueryText(searchData.query, text);

					if (data.image_url) {
						const image = document.createElement('img');

						image.setAttribute('src', data.image_url);
						image.setAttribute('class', 'suggestion-img-adv');
						td.appendChild(image);
						newdiv.setAttribute('class', 'with-img');
					}

					if (data.impression_url) {
						const pixel = document.createElement('img');

						pixel.setAttribute('src', data.impression_url);
						newdiv.appendChild(pixel);
					}

					if (data.click_url) {
						td.setAttribute("clickUrl", data.click_url);
					}

					td.setAttribute("queryText", text);
					td.appendChild(newdiv);
					td.style.width = "";

					tr.setAttribute("sugID", index);
					tr.onmouseover = function () {
						that.navi(this);
					};

					tr.addEventListener("dblclick", function (event) {
						event.stopPropagation();
					}, false);

					tr.addEventListener("click", function (event) {
						$(acpObj.acp_searchbox_id).value = '';
						$(acpObj.acp_searchbox_id).focus();
						const value = this.cells[0].getAttribute("queryText");

						autocompleteHide();
						event.stopPropagation();
						that.main.onClickSuggestion.callListeners(data.click_url ? data : value);
					});
				}
				document.addEventListener("click", autocompleteHide, false);

				if ($(suggestElemId).style.display === "none") {
					autocompleteShow();
				}

				if (table.rows.length === 0) {
					$(suggestElemId).style.display = "none";
				}
			};
			AutocompleteClass.prototype.navi = function (tr) {
				const searchbox = $(acpObj.acp_searchbox_id);

				searchbox.removeAttribute("clickUrl");

				for (let index = this.dropdown.table.rows.length - 1; index >= 0; index--) {
					this.dropdown.table.rows[index].style.backgroundColor = "";
				}

				if (tr === undefined) {
					this.dropdown.table.rows[this.dropdown.posY].style.backgroundColor = "#eee";
					const cell = this.dropdown.table.rows[this.dropdown.posY].cells[0];

					searchbox.value = cell.getAttribute("queryText");

					if (cell.hasAttribute("clickUrl")) {
						searchbox.setAttribute("clickUrl", cell.getAttribute("clickUrl"));
					}
				} else {
					tr.style.backgroundColor = "#eee";
					this.dropdown.posY = tr.getAttribute("sugID");
				}
			};
			AutocompleteClass.prototype.getIndicesOf = function (searchStr, str, caseSensitive) {
				let startIndex = 0; const searchStrLen = searchStr.length;
				let index; const indices = [];

				if (!caseSensitive) {
					str = str.toLowerCase();
					searchStr = searchStr.toLowerCase();
				}

				while ((index = str.indexOf(searchStr, startIndex)) > -1) {
					indices.push(index);
					startIndex = index + searchStrLen;
				}
				return indices;
			};
			AutocompleteClass.prototype.bolderifyQueryText = function (query, suggestion) {
				const indices = this.getIndicesOf(query, suggestion, false);
				const resultDiv = document.createElement("div");
				let currentText = "";

				for (let i = 0; i < suggestion.length;) {
					if (indices.indexOf(i) !== -1) {
						if (currentText) {
							const span = document.createElement("span");

							span.textContent = currentText;
							resultDiv.appendChild(span);
							currentText = "";
						}

						const bolder = document.createElement("b");

						bolder.textContent = suggestion.substr(i, query.length);
						resultDiv.appendChild(bolder);
						i += query.length;
					} else {
						currentText += suggestion[i];
						i++;
					}
				}

				if (currentText) {
					const span = document.createElement("span");

					span.textContent = currentText;
					resultDiv.appendChild(span);
				}

				return resultDiv;
			};

			return AutocompleteClass;
		})();

		acpObj.ac = new AutocompleteClass(self);
	}
	startAutocomplete();
}

export default AutoCompletePlus;