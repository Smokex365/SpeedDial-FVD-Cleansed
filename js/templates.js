import './_external/jquery.js';
import Localizer from './localizer.js';

const el = document.createElement("div");

let tmplResolve;
const tmplPromise = new Promise((resolve, reject)=>{
	tmplResolve = resolve;
});

$(function () {
	$.get(chrome.runtime.getURL("/templates.html"), data=>{
		console.info('Templates loaded');
		el.innerHTML = data;
		Localizer.localizeElem(el);
		tmplResolve();
	});
});

const Templates = {
	initPromise: function () {
		return tmplPromise;
	},

	getHTML: function (id) {
		return el.querySelector("#" + id).innerHTML;
	},
	clone: function (id) {
		return el.querySelector("#" + id).cloneNode(true);
	},
	get: function (templateName, options, cb) {
		// console.log(`Template get ${templateName}`, options);

		if (typeof options === "function") {
			cb = options;
			options = {};
		}

		options = options || {};
		const xhr = new XMLHttpRequest();

		xhr.open("GET", chrome.runtime.getURL("/templates/" + templateName + ".html"));
		xhr.onload = function () {
			let res = xhr.responseText;

			if (options.fragment) {
				const tmp = document.createElement("template");

				tmp.innerHTML = res;
				res = tmp.content;
			}

			cb(null, res);
		};
		xhr.onerror = function (err) {
			cb(err);
		};
		xhr.send(null);
	},
	loadStyleSheet: function (location, cb) {
		cb = cb || function () {};
		const link = document.createElement("link");

		link.setAttribute("href", location);
		link.setAttribute("rel", "stylesheet");
		link.addEventListener("load", function () {
			cb();
		}, false);
		document.head.appendChild(link);
	},
};

export default Templates;