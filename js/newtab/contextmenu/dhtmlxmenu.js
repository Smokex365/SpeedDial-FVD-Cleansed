//v.3.0 build 110707
/*
 Copyright DHTMLX LTD. http://www.dhtmlx.com
 You allowed to use this component or parts of it under GPL terms
 To use it on other terms or get Professional edition of the component please contact us at sales@dhtmlx.com
 */
let _isFF;
let _isIE;
let _isOpera;
let _OperaRv;
let _isChrome;
let _isKHTML;
let _KHTMLrv;
let _FFrv;
let _isMacOS;

const dhtmlx = function (a) {
	for (const b in a) dhtmlx[b] = a[b];
	return dhtmlx;
};
dhtmlx.extend_api = function (a, b, c) {
	const d = window[a];

	if (d)
		(window[a] = function (a) {
			if (a && typeof a === 'object' && !a.tagName) {
				var c = d.apply(this, b._init ? b._init(a) : arguments);
				let f;
				for (f in dhtmlx) if (b[f]) this[b[f]](dhtmlx[f]);
				for (f in a)
					if (b[f]) this[b[f]](a[f]);
					else f.indexOf('on') == 0 && this.attachEvent(f, a[f]);
			} else c = d.apply(this, arguments);

			b._patch && b._patch(this);
			return c || this;
		}),
			(window[a].prototype = d.prototype),
			c && dhtmlXHeir(window[a].prototype, c);
};
const dhtmlxAjax = {
	get: function (a, b) {
		const c = new dtmlXMLLoaderObject(!0);
		c.async = arguments.length < 3;
		c.waitCall = b;
		c.loadXML(a);
		return c;
	},
	post: function (a, b, c) {
		const d = new dtmlXMLLoaderObject(!0);
		d.async = arguments.length < 4;
		d.waitCall = c;
		d.loadXML(a, !0, b);
		return d;
	},
	getSync: function (a) {
		return this.get(a, null, !0);
	},
	postSync: function (a, b) {
		return this.post(a, b, null, !0);
	},
};
function dtmlXMLLoaderObject(a, b, c, d) {
	this.xmlDoc = '';
	this.async = typeof c !== 'undefined' ? c : !0;
	this.onloadAction = a || null;
	this.mainObject = b || null;
	this.waitCall = null;
	this.rSeed = d || !1;
	return this;
}

dtmlXMLLoaderObject.prototype.waitLoadFunction = function (a) {
	let b = !0;
	return (this.check = function () {
		if (a && a.onloadAction != null && (!a.xmlDoc.readyState || a.xmlDoc.readyState == 4) && b) {
			b = !1;

			if (typeof a.onloadAction === 'function') a.onloadAction(a.mainObject, null, null, null, a);

			if (a.waitCall) a.waitCall.call(this, a), (a.waitCall = null);
		}
	});
};
dtmlXMLLoaderObject.prototype.getXMLTopNode = function (a, b) {
	if (this.xmlDoc.responseXML) {
		let c = this.xmlDoc.responseXML.getElementsByTagName(a);
		c.length == 0 &&
			a.indexOf(':') != -1 &&
			(c = this.xmlDoc.responseXML.getElementsByTagName(a.split(':')[1]));
		var d = c[0];
	} else d = this.xmlDoc.documentElement;

	if (d) return (this._retry = !1), d;

	if (_isIE && !this._retry) {
		const e = this.xmlDoc.responseText;
		var b = this.xmlDoc;
		this._retry = !0;
		this.xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
		this.xmlDoc.async = !1;
		this.xmlDoc.loadXML(e);
		return this.getXMLTopNode(a, b);
	}

	dhtmlxError.throwError('LoadXML', 'Incorrect XML', [b || this.xmlDoc, this.mainObject]);
	return document.createElement('DIV');
};
dtmlXMLLoaderObject.prototype.loadXMLString = function (a) {
	if (_isIE)
		(this.xmlDoc = new ActiveXObject('Microsoft.XMLDOM')),
			(this.xmlDoc.async = this.async),
			(this.xmlDoc.onreadystatechange = function () {}),
			this.xmlDoc.loadXML(a);
	else {
		const b = new DOMParser();
		this.xmlDoc = b.parseFromString(a, 'text/xml');
	}

	if (this.onloadAction) this.onloadAction(this.mainObject, null, null, null, this);

	if (this.waitCall) this.waitCall(), (this.waitCall = null);
};
dtmlXMLLoaderObject.prototype.loadXML = function (a, b, c, d) {
	this.rSeed && (a += (a.indexOf('?') != -1 ? '&' : '?') + 'a_dhx_rSeed=' + new Date().valueOf());
	this.filePath = a;
	this.xmlDoc =
		!_isIE && window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');

	if (this.async) this.xmlDoc.onreadystatechange = new this.waitLoadFunction(this);

	this.xmlDoc.open(b ? 'POST' : 'GET', a, this.async);
	d
		? (this.xmlDoc.setRequestHeader('User-Agent', 'dhtmlxRPC v0.1 (' + navigator.userAgent + ')'),
		  this.xmlDoc.setRequestHeader('Content-type', 'text/xml'))
		: b && this.xmlDoc.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	this.xmlDoc.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	this.xmlDoc.send(c);
	this.async || new this.waitLoadFunction(this)();
};
dtmlXMLLoaderObject.prototype.destructor = function () {
	return (this.setXSLParamValue =
		this.getXMLTopNode =
		this.xmlNodeToJSON =
		this.doSerialization =
		this.loadXMLString =
		this.loadXML =
		this.doXSLTransToString =
		this.doXSLTransToObject =
		this.doXPathOpera =
		this.doXPath =
		this.xmlDoc =
		this.mainObject =
		this.onloadAction =
		this.filePath =
		this.rSeed =
		this.async =
		this._retry =
		this._getAllNamedChilds =
		this._filterXPath =
			null);
};
dtmlXMLLoaderObject.prototype.xmlNodeToJSON = function (a) {
	for (var b = {}, c = 0; c < a.attributes.length; c++)
		b[a.attributes[c].name] = a.attributes[c].value;
	b._tagvalue = a.firstChild ? a.firstChild.nodeValue : '';
	for (c = 0; c < a.childNodes.length; c++) {
		const d = a.childNodes[c].tagName;
		d && (b[d] || (b[d] = []), b[d].push(this.xmlNodeToJSON(a.childNodes[c])));
	}
	return b;
};
function callerFunction(a, b) {
	return (this.handler = function (c) {
		if (!c) c = window.event;

		a(c, b);
		return !0;
	});
}

function getAbsoluteLeft(a) {
	return getOffset(a).left;
}

function getAbsoluteTop(a) {
	return getOffset(a).top;
}

function getOffsetSum(a) {
	for (var b = 0, c = 0; a; )
		(b += parseInt(a.offsetTop)), (c += parseInt(a.offsetLeft)), (a = a.offsetParent);
	return {
		top: b,
		left: c,
	};
}

function getOffsetRect(a) {
	const b = a.getBoundingClientRect();
	const c = document.body;
	const d = document.documentElement;
	const e = window.pageYOffset || d.scrollTop || c.scrollTop;
	const g = window.pageXOffset || d.scrollLeft || c.scrollLeft;
	const f = d.clientTop || c.clientTop || 0;
	const h = d.clientLeft || c.clientLeft || 0;
	const i = b.top + e - f;
	const k = b.left + g - h;
	return {
		top: Math.round(i),
		left: Math.round(k),
	};
}

function getOffset(a) {
	return a.getBoundingClientRect ? getOffsetRect(a) : getOffsetSum(a);
}

function convertStringToBoolean(a) {
	typeof a === 'string' && (a = a.toLowerCase());
	switch (a) {
		case '1':
		case 'true':
		case 'yes':
		case 'y':
		case 1:
		case !0:
			return !0;
		default:
			return !1;
	}
}

function getUrlSymbol(a) {
	return a.indexOf('?') != -1 ? '&' : '?';
}

function dhtmlDragAndDropObject() {
	if (window.dhtmlDragAndDrop) return window.dhtmlDragAndDrop;

	this.dragStartObject = this.dragStartNode = this.dragNode = this.lastLanding = 0;
	this.tempDOMM = this.tempDOMU = null;
	this.waitDrag = 0;
	window.dhtmlDragAndDrop = this;
	return this;
}

dhtmlDragAndDropObject.prototype.removeDraggableItem = function (a) {
	a.onmousedown = null;
	a.dragStarter = null;
	a.dragLanding = null;
};
dhtmlDragAndDropObject.prototype.addDraggableItem = function (a, b) {
	a.onmousedown = this.preCreateDragCopy;
	a.dragStarter = b;
	this.addDragLanding(a, b);
};
dhtmlDragAndDropObject.prototype.addDragLanding = function (a, b) {
	a.dragLanding = b;
};
dhtmlDragAndDropObject.prototype.preCreateDragCopy = function (a) {
	if (!((a || window.event) && (a || event).button == 2)) {
		if (window.dhtmlDragAndDrop.waitDrag)
			return (
				(window.dhtmlDragAndDrop.waitDrag = 0),
				(document.body.onmouseup = window.dhtmlDragAndDrop.tempDOMU),
				(document.body.onmousemove = window.dhtmlDragAndDrop.tempDOMM),
				!1
			);

		window.dhtmlDragAndDrop.dragNode && window.dhtmlDragAndDrop.stopDrag(a);
		window.dhtmlDragAndDrop.waitDrag = 1;
		window.dhtmlDragAndDrop.tempDOMU = document.body.onmouseup;
		window.dhtmlDragAndDrop.tempDOMM = document.body.onmousemove;
		window.dhtmlDragAndDrop.dragStartNode = this;
		window.dhtmlDragAndDrop.dragStartObject = this.dragStarter;
		document.body.onmouseup = window.dhtmlDragAndDrop.preCreateDragCopy;
		document.body.onmousemove = window.dhtmlDragAndDrop.callDrag;
		window.dhtmlDragAndDrop.downtime = new Date().valueOf();
		a && a.preventDefault && a.preventDefault();
		return !1;
	}
};
dhtmlDragAndDropObject.prototype.callDrag = function (a) {
	if (!a) a = window.event;

	dragger = window.dhtmlDragAndDrop;

	if (!(new Date().valueOf() - dragger.downtime < 100)) {
		if (!dragger.dragNode)
			if (dragger.waitDrag) {
				dragger.dragNode = dragger.dragStartObject._createDragNode(dragger.dragStartNode, a);

				if (!dragger.dragNode) return dragger.stopDrag();

				dragger.dragNode.onselectstart = function () {
					return !1;
				};
				dragger.gldragNode = dragger.dragNode;
				document.body.appendChild(dragger.dragNode);
				document.body.onmouseup = dragger.stopDrag;
				dragger.waitDrag = 0;
				dragger.dragNode.pWindow = window;
				dragger.initFrameRoute();
			} else return dragger.stopDrag(a, !0);

		if (dragger.dragNode.parentNode != window.document.body && dragger.gldragNode) {
			let b = dragger.gldragNode;

			if (dragger.gldragNode.old) b = dragger.gldragNode.old;

			b.parentNode.removeChild(b);
			const c = dragger.dragNode.pWindow;
			b.pWindow &&
				b.pWindow.dhtmlDragAndDrop.lastLanding &&
				b.pWindow.dhtmlDragAndDrop.lastLanding.dragLanding._dragOut(
					b.pWindow.dhtmlDragAndDrop.lastLanding
				);

			if (_isIE) {
				const d = document.createElement('Div');
				d.innerHTML = dragger.dragNode.outerHTML;
				dragger.dragNode = d.childNodes[0];
			} else dragger.dragNode = dragger.dragNode.cloneNode(!0);

			dragger.dragNode.pWindow = window;
			dragger.gldragNode.old = dragger.dragNode;
			document.body.appendChild(dragger.dragNode);
			c.dhtmlDragAndDrop.dragNode = dragger.dragNode;
		}

		dragger.dragNode.style.left =
			a.clientX +
			15 +
			(dragger.fx ? dragger.fx * -1 : 0) +
			(document.body.scrollLeft || document.documentElement.scrollLeft) +
			'px';
		dragger.dragNode.style.top =
			a.clientY +
			3 +
			(dragger.fy ? dragger.fy * -1 : 0) +
			(document.body.scrollTop || document.documentElement.scrollTop) +
			'px';
		const e = a.srcElement ? a.srcElement : a.target;
		dragger.checkLanding(e, a);
	}
};
dhtmlDragAndDropObject.prototype.calculateFramePosition = function (a) {
	if (window.name) {
		for (var b = parent.frames[window.name].frameElement.offsetParent, c = 0, d = 0; b; )
			(c += b.offsetLeft), (d += b.offsetTop), (b = b.offsetParent);

		if (parent.dhtmlDragAndDrop) {
			const e = parent.dhtmlDragAndDrop.calculateFramePosition(1);
			c += e.split('_')[0] * 1;
			d += e.split('_')[1] * 1;
		}

		if (a) return c + '_' + d;
		else this.fx = c;

		this.fy = d;
	}

	return '0_0';
};
dhtmlDragAndDropObject.prototype.checkLanding = function (a, b) {
	a && a.dragLanding
		? (this.lastLanding && this.lastLanding.dragLanding._dragOut(this.lastLanding),
		  (this.lastLanding = a),
		  (this.lastLanding = this.lastLanding.dragLanding._dragIn(
				this.lastLanding,
				this.dragStartNode,
				b.clientX,
				b.clientY,
				b
		  )),
		  (this.lastLanding_scr = _isIE ? b.srcElement : b.target))
		: a && a.tagName != 'BODY'
		? this.checkLanding(a.parentNode, b)
		: (this.lastLanding &&
				this.lastLanding.dragLanding._dragOut(this.lastLanding, b.clientX, b.clientY, b),
		  (this.lastLanding = 0),
		  this._onNotFound && this._onNotFound());
};
dhtmlDragAndDropObject.prototype.stopDrag = function (a, b) {
	dragger = window.dhtmlDragAndDrop;

	if (!b) {
		dragger.stopFrameRoute();
		const c = dragger.lastLanding;
		dragger.lastLanding = null;
		c &&
			c.dragLanding._drag(
				dragger.dragStartNode,
				dragger.dragStartObject,
				c,
				_isIE ? event.srcElement : a.target
			);
	}

	dragger.lastLanding = null;
	dragger.dragNode &&
		dragger.dragNode.parentNode == document.body &&
		dragger.dragNode.parentNode.removeChild(dragger.dragNode);
	dragger.dragNode = 0;
	dragger.gldragNode = 0;
	dragger.fx = 0;
	dragger.fy = 0;
	dragger.dragStartNode = 0;
	dragger.dragStartObject = 0;
	document.body.onmouseup = dragger.tempDOMU;
	document.body.onmousemove = dragger.tempDOMM;
	dragger.tempDOMU = null;
	dragger.tempDOMM = null;
	dragger.waitDrag = 0;
};
dhtmlDragAndDropObject.prototype.stopFrameRoute = function (a) {
	a && window.dhtmlDragAndDrop.stopDrag(1, 1);
	for (let b = 0; b < window.frames.length; b++)
		try {
			window.frames[b] != a &&
				window.frames[b].dhtmlDragAndDrop &&
				window.frames[b].dhtmlDragAndDrop.stopFrameRoute(window);
		} catch (c) {}
	try {
		parent.dhtmlDragAndDrop &&
			parent != window &&
			parent != a &&
			parent.dhtmlDragAndDrop.stopFrameRoute(window);
	} catch (d) {}
};
dhtmlDragAndDropObject.prototype.initFrameRoute = function (a, b) {
	if (a)
		window.dhtmlDragAndDrop.preCreateDragCopy(),
			(window.dhtmlDragAndDrop.dragStartNode = a.dhtmlDragAndDrop.dragStartNode),
			(window.dhtmlDragAndDrop.dragStartObject = a.dhtmlDragAndDrop.dragStartObject),
			(window.dhtmlDragAndDrop.dragNode = a.dhtmlDragAndDrop.dragNode),
			(window.dhtmlDragAndDrop.gldragNode = a.dhtmlDragAndDrop.dragNode),
			(window.document.body.onmouseup = window.dhtmlDragAndDrop.stopDrag),
			(window.waitDrag = 0),
			!_isIE && b && (!_isFF || _FFrv < 1.8) && window.dhtmlDragAndDrop.calculateFramePosition();

	try {
		parent.dhtmlDragAndDrop &&
			parent != window &&
			parent != a &&
			parent.dhtmlDragAndDrop.initFrameRoute(window);
	} catch (c) {}
	for (let d = 0; d < window.frames.length; d++)
		try {
			window.frames[d] != a &&
				window.frames[d].dhtmlDragAndDrop &&
				window.frames[d].dhtmlDragAndDrop.initFrameRoute(window, !a || b ? 1 : 0);
		} catch (e) {}
};
_OperaRv = _KHTMLrv = _FFrv = _isChrome = _isMacOS = _isKHTML = _isOpera = _isIE = _isFF = !1;
navigator.userAgent.indexOf('Macintosh') != -1 && (_isMacOS = !0);
navigator.userAgent.toLowerCase().indexOf('chrome') > -1 && (_isChrome = !0);
navigator.userAgent.indexOf('Safari') != -1 || navigator.userAgent.indexOf('Konqueror') != -1
	? ((_KHTMLrv = parseFloat(
			navigator.userAgent.substr(navigator.userAgent.indexOf('Safari') + 7, 5)
	  )),
	  _KHTMLrv > 525 ? ((_isFF = !0), (_FFrv = 1.9)) : (_isKHTML = !0))
	: navigator.userAgent.indexOf('Opera') != -1
	? ((_isOpera = !0),
	  (_OperaRv = parseFloat(
			navigator.userAgent.substr(navigator.userAgent.indexOf('Opera') + 6, 3)
	  )))
	: navigator.appName.indexOf('Microsoft') != -1
	? ((_isIE = !0),
	  navigator.appVersion.indexOf('MSIE 8.0') != -1 &&
			document.compatMode != 'BackCompat' &&
			(_isIE = 8),
	  navigator.appVersion.indexOf('MSIE 9.0') != -1 &&
			document.compatMode != 'BackCompat' &&
			(_isIE = 8))
	: ((_isFF = !0), (_FFrv = parseFloat(navigator.userAgent.split('rv:')[1])));
dtmlXMLLoaderObject.prototype.doXPath = function (a, b, c, d) {
	if (_isKHTML || (!_isIE && !window.XPathResult)) return this.doXPathOpera(a, b);

	if (_isIE)
		return (
			b || (b = this.xmlDoc.nodeName ? this.xmlDoc : this.xmlDoc.responseXML),
			b || dhtmlxError.throwError('LoadXML', 'Incorrect XML', [b || this.xmlDoc, this.mainObject]),
			c != null && b.setProperty('SelectionNamespaces', "xmlns:xsl='" + c + "'"),
			d == 'single' ? b.selectSingleNode(a) : b.selectNodes(a) || []
		);
	else {
		let e = b;
		b || (b = this.xmlDoc.nodeName ? this.xmlDoc : this.xmlDoc.responseXML);
		b || dhtmlxError.throwError('LoadXML', 'Incorrect XML', [b || this.xmlDoc, this.mainObject]);
		b.nodeName.indexOf('document') != -1 ? (e = b) : ((e = b), (b = b.ownerDocument));
		let g = XPathResult.ANY_TYPE;

		if (d == 'single') g = XPathResult.FIRST_ORDERED_NODE_TYPE;

		const f = [];
		const h = b.evaluate(
			a,
			e,
			function () {
				return c;
			},
			g,
			null
		);

		if (g == XPathResult.FIRST_ORDERED_NODE_TYPE) return h.singleNodeValue;

		for (let i = h.iterateNext(); i; ) (f[f.length] = i), (i = h.iterateNext());
		return f;
	}
};
function j() {
	if (!this.catches) this.catches = [];

	return this;
}

j.prototype.catchError = function (a, b) {
	this.catches[a] = b;
};
j.prototype.throwError = function (a, b, c) {
	if (this.catches[a]) return this.catches[a](a, b, c);

	if (this.catches.ALL) return this.catches.ALL(a, b, c);

	console.warn('Error type: ' + a + '\nDescription: ' + b);
	return null;
};
window.dhtmlxError = new j();
dtmlXMLLoaderObject.prototype.doXPathOpera = function (a, b) {
	const c = a.replace(/[\/]+/gi, '/').split('/');
	let d = null;
	let e = 1;

	if (!c.length) return [];

	if (c[0] == '.') d = [b];
	else if (c[0] == '')
		(d = (this.xmlDoc.responseXML || this.xmlDoc).getElementsByTagName(
			c[e].replace(/\[[^\]]*\]/g, '')
		)),
			e++;
	else return [];

	for (; e < c.length; e++) d = this._getAllNamedChilds(d, c[e]);
	c[e - 1].indexOf('[') != -1 && (d = this._filterXPath(d, c[e - 1]));
	return d;
};
dtmlXMLLoaderObject.prototype._filterXPath = function (a, b) {
	for (
		var c = [], b = b.replace(/[^\[]*\[\@/g, '').replace(/[\[\]\@]*/g, ''), d = 0;
		d < a.length;
		d++
	)
		a[d].getAttribute(b) && (c[c.length] = a[d]);
	return c;
};
dtmlXMLLoaderObject.prototype._getAllNamedChilds = function (a, b) {
	const c = [];
	_isKHTML && (b = b.toUpperCase());
	for (let d = 0; d < a.length; d++)
		for (let e = 0; e < a[d].childNodes.length; e++)
			_isKHTML
				? a[d].childNodes[e].tagName &&
				  a[d].childNodes[e].tagName.toUpperCase() == b &&
				  (c[c.length] = a[d].childNodes[e])
				: a[d].childNodes[e].tagName == b && (c[c.length] = a[d].childNodes[e]);
	return c;
};
function dhtmlXHeir(a, b) {
	for (const c in b) typeof b[c] === 'function' && (a[c] = b[c]);
	return a;
}

function dhtmlxEvent(a, b, c) {
	a.addEventListener ? a.addEventListener(b, c, !1) : a.attachEvent && a.attachEvent('on' + b, c);
}

dtmlXMLLoaderObject.prototype.xslDoc = null;
dtmlXMLLoaderObject.prototype.setXSLParamValue = function (a, b, c) {
	if (!c) c = this.xslDoc;

	if (c.responseXML) c = c.responseXML;

	const d = this.doXPath(
		"/xsl:stylesheet/xsl:variable[@name='" + a + "']",
		c,
		'http://www.w3.org/1999/XSL/Transform',
		'single'
	);

	if (d != null) d.firstChild.nodeValue = b;
};
dtmlXMLLoaderObject.prototype.doXSLTransToObject = function (a, b) {
	if (!a) a = this.xslDoc;

	if (a.responseXML) a = a.responseXML;

	if (!b) b = this.xmlDoc;

	if (b.responseXML) b = b.responseXML;

	if (_isIE) {
		d = new ActiveXObject('Msxml2.DOMDocument.3.0');
		try {
			b.transformNodeToObject(a, d);
		} catch (c) {
			d = b.transformNode(a);
		}
	} else {
		if (!this.XSLProcessor)
			(this.XSLProcessor = new XSLTProcessor()), this.XSLProcessor.importStylesheet(a);

		var d = this.XSLProcessor.transformToDocument(b);
	}

	return d;
};
dtmlXMLLoaderObject.prototype.doXSLTransToString = function (a, b) {
	const c = this.doXSLTransToObject(a, b);
	return typeof c === 'string' ? c : this.doSerialization(c);
};
dtmlXMLLoaderObject.prototype.doSerialization = function (a) {
	if (!a) a = this.xmlDoc;

	if (a.responseXML) a = a.responseXML;

	if (_isIE) return a.xml;
	else {
		const b = new XMLSerializer();
		return b.serializeToString(a);
	}
};
const dhtmlxEventable = function (a) {
	a.attachEvent = function (a, c, d) {
		a = 'ev_' + a.toLowerCase();
		this[a] || (this[a] = new this.eventCatcher(d || this));
		return a + ':' + this[a].addEvent(c);
	};
	a.callEvent = function (a, c) {
		a = 'ev_' + a.toLowerCase();
		return this[a] ? this[a].apply(this, c) : !0;
	};
	a.checkEvent = function (a) {
		return !!this['ev_' + a.toLowerCase()];
	};
	a.eventCatcher = function (a) {
		const c = [];
		const d = function () {
			for (var d = !0, g = 0; g < c.length; g++)
				if (c[g] != null)
					var f = c[g].apply(a, arguments),
						d = d && f;
			return d;
		};
		d.addEvent = function (a) {
			typeof a !== 'function' && (a = eval(a));
			return a ? c.push(a) - 1 : !1;
		};
		d.removeEvent = function (a) {
			c[a] = null;
		};
		return d;
	};
	a.detachEvent = function (a) {
		if (a != !1) {
			const c = a.split(':');
			this[c[0]].removeEvent(c[1]);
		}
	};
	a.detachAllEvents = function () {
		for (const a in this) a.indexOf('ev_') == 0 && delete this[a];
	};
};
(function () {
	var a = (dhtmlx.message = function (b, c, d, e) {
		if (!a.area)
			(a.area = document.createElement('DIV')),
				(a.area.style.cssText = 'position:absolute;right:5px;width:250px;z-index:100;'),
				(a.area.className = 'dhtmlx_message_area'),
				(a.area.style[a.defPosition] = '5px'),
				document.body.appendChild(a.area);

		typeof b !== 'object' &&
			(b = {
				text: b,
				type: c,
				lifetime: d,
				id: e,
			});
		b.type = b.type || 'info';
		b.id = b.id || a.uid();
		b.lifetime = b.lifetime || a.defTimeout;
		a.hide(b.id);
		const g = document.createElement('DIV');
		g.style.cssText =
			'border-radius:4px; padding:4px 4px 4px 20px;background-color:#FFFFCC;font-size:12px;font-family:Tahoma;color:navy;z-index: 10000;margin:5px;border:1px solid lightgrey;';
		g.innerHTML = b.text;
		g.className = b.type;
		a.defPosition == 'bottom' && a.area.firstChild
			? a.area.insertBefore(g, a.area.firstChild)
			: a.area.appendChild(g);
		a.timers[b.id] = window.setTimeout(function () {
			a.hide(b.id);
		}, b.lifetime);
		a.pull[b.id] = g;
		return b.id;
	});
	a.defTimeout = 4e3;
	a.defPosition = 'top';
	a.pull = {};
	a.timers = {};
	a.seed = new Date().valueOf();
	a.uid = function () {
		return a.seed++;
	};
	a.hideAll = function () {
		for (const b in a.pull) a.hide(b);
	};
	a.hide = function (b) {
		const c = a.pull[b];
		c &&
			c.parentNode &&
			(c.parentNode.removeChild(c), window.clearTimeout(a.timers[b]), delete a.pull[b]);
	};
})();

//v.3.0 build 110707

/*
 Copyright DHTMLX LTD. http://www.dhtmlx.com
 You allowed to use this component or parts of it under GPL terms
 To use it on other terms or get Professional edition of the component please contact us at sales@dhtmlx.com
 */
export const dhtmlXMenuObject = function (b, c) {
	const a = this;
	this.addBaseIdAsContextZone = null;
	this.isDhtmlxMenuObject = !0;
	this.skin = c != null ? c : 'dhx_skyblue';
	this.imagePath = '';
	this._isIE6 = !1;

	if (_isIE) this._isIE6 = window.XMLHttpRequest == null ? !0 : !1;

	if (b == null) this.base = document.body;
	else {
		const d = typeof b === 'string' ? document.getElementById(b) : b;

		if (d != null) {
			this.base = d;

			if (!this.base.id) this.base.id = new Date().valueOf();

			for (; this.base.childNodes.length > 0; ) this.base.removeChild(this.base.childNodes[0]);
			this.base.className += ' dhtmlxMenu_' + this.skin + '_Middle dir_left';
			this.base._autoSkinUpdate = !0;

			if (this.base.oncontextmenu) this.base._oldContextMenuHandler = this.base.oncontextmenu;

			this.addBaseIdAsContextZone = this.base.id;
			this.base.onselectstart = function (a) {
				a = a || event;
				return (a.returnValue = !1);
			};
			this.base.oncontextmenu = function (a) {
				a = a || event;
				return (a.returnValue = !1);
			};
		} else this.base = document.body;
	}

	this.topId = 'dhxWebMenuTopId';

	if (!this.extendedModule) {
		for (
			var f = function () {
					console.warn(this.i18n.dhxmenuextalert);
				},
				e =
					'setItemEnabled,setItemDisabled,isItemEnabled,_changeItemState,getItemText,setItemText,loadFromHTML,hideItem,showItem,isItemHidden,_changeItemVisible,setUserData,getUserData,setOpenMode,setWebModeTimeout,enableDynamicLoading,_updateLoaderIcon,getItemImage,setItemImage,clearItemImage,setAutoShowMode,setAutoHideMode,setContextMenuHideAllMode,getContextMenuHideAllMode,setVisibleArea,setTooltip,getTooltip,setHotKey,getHotKey,setItemSelected,setTopText,setRTL,setAlign,setHref,clearHref,getCircuit,_clearAllSelectedSubItemsInPolygon,_checkArrowsState,_addUpArrow,_addDownArrow,_removeUpArrow,_removeDownArrow,_isArrowExists,_doScrollUp,_doScrollDown,_countPolygonItems,setOverflowHeight,_getRadioImgObj,_setRadioState,_radioOnClickHandler,getRadioChecked,setRadioChecked,addRadioButton,_getCheckboxState,_setCheckboxState,_readLevel,_updateCheckboxImage,_checkboxOnClickHandler,setCheckboxState,getCheckboxState,addCheckbox,serialize'.split(
						','
					),
				g = 0;
			g < e.length;
			g++
		)
			this[e[g]] || (this[e[g]] = f);
		e = null;
	}

	this.fixedPosition = !1;
	this.menuLastClicked = this.menuSelected = -1;
	this.idPrefix = '';
	this.itemTagName = 'item';
	this.itemTextTagName = 'itemtext';
	this.userDataTagName = 'userdata';
	this.itemTipTagName = 'tooltip';
	this.itemHotKeyTagName = 'hotkey';
	this.itemHrefTagName = 'href';
	this.dirTopLevel = 'bottom';
	this.dirSubLevel = 'right';
	this.menuY2 = this.menuY1 = this.menuX2 = this.menuX1 = null;
	this.menuMode = 'web';
	this.menuTimeoutMsec = 400;
	this.menuTimeoutHandler = null;
	this.idPull = {};
	this.itemPull = {};
	this.userData = {};
	this.radio = {};
	this._rtl = !1;
	this._align = 'left';
	this.menuTouched = !1;
	this.zInd = this.zIndInit = 3001;
	this.zIndStep = 50;
	this.menuModeTopLevelTimeout = !0;
	this.menuModeTopLevelTimeoutTime = 200;
	this._topLevelBottomMargin = 1;
	this._topLevelRightMargin = 0;
	this._topLevelOffsetLeft = 1;
	this._arrowFFFix = _isIE ? (document.compatMode == 'BackCompat' ? 0 : -4) : -4;
	this.setSkin = function (a) {
		const b = this.skin;
		this.skin = a;
		switch (this.skin) {
			case 'dhx_black':
			case 'dhx_blue':
			case 'dhx_skyblue':
			case 'dhx_web':
				this._topLevelBottomMargin = 2;
				this._topLevelOffsetLeft = this._topLevelRightMargin = 1;
				this._arrowFFFix = _isIE ? (document.compatMode == 'BackCompat' ? 0 : -4) : -4;
				break;
			case 'dhx_web':
				this._arrowFFFix = 0;
		}

		if (this.base._autoSkinUpdate)
			this.base.className =
				this.base.className.replace('dhtmlxMenu_' + b + '_Middle', '') +
				' dhtmlxMenu_' +
				this.skin +
				'_Middle';

		for (const c in this.idPull)
			this.idPull[c].className = String(this.idPull[c].className).replace(b, this.skin);
	};
	this.setSkin(this.skin);
	this.dLoad = !1;
	this.dLoadUrl = '';
	this.dLoadSign = '?';
	this.loaderIcon = !1;
	this.limit = 0;
	this._scrollUpTM = null;
	this._scrollUpTMTime = 20;
	this._scrollUpTMStep = 3;
	this._scrollDownTM = null;
	this._scrollDownTMTime = 20;
	this._scrollDownTMStep = 3;
	this.context = !1;
	this.contextZones = {};
	this.contextMenuZoneId = !1;
	this.contextHideAllMode = this.contextAutoHide = this.contextAutoShow = !0;
	this.sxDacProc = null;
	this.dacSpeed = 10;
	this.dacCycles = [];
	for (g = 0; g < 10; g++) this.dacCycles[g] = g;
	this.dacSpeedIE = 10;
	this.dacCyclesIE = [];
	for (g = 0; g < 10; g++) this.dacCyclesIE[g] = g;
	this._enableDacSupport = function (a) {
		this.sxDacProc = a;
	};
	this._selectedSubItems = [];
	this._openedPolygons = [];
	this._addSubItemToSelected = function (a, b) {
		for (var c = !0, d = 0; d < this._selectedSubItems.length; d++)
			this._selectedSubItems[d][0] == a && this._selectedSubItems[d][1] == b && (c = !1);
		c == !0 && this._selectedSubItems.push([a, b]);
		return c;
	};
	this._removeSubItemFromSelected = function (a, b) {
		for (var c = [], d = !1, e = 0; e < this._selectedSubItems.length; e++)
			this._selectedSubItems[e][0] == a && this._selectedSubItems[e][1] == b
				? (d = !0)
				: (c[c.length] = this._selectedSubItems[e]);

		if (d == !0) this._selectedSubItems = c;

		return d;
	};
	this._getSubItemToDeselectByPolygon = function (a) {
		for (var b = [], c = 0; c < this._selectedSubItems.length; c++)
			if (this._selectedSubItems[c][1] == a) {
				b[b.length] = this._selectedSubItems[c][0];
				for (
					var b = b.concat(this._getSubItemToDeselectByPolygon(this._selectedSubItems[c][0])),
						d = !0,
						e = 0;
					e < this._openedPolygons.length;
					e++
				)
					this._openedPolygons[e] == this._selectedSubItems[c][0] && (d = !1);
				d == !0 &&
					(this._openedPolygons[this._openedPolygons.length] = this._selectedSubItems[c][0]);
				this._selectedSubItems[c][0] = -1;
				this._selectedSubItems[c][1] = -1;
			}
		return b;
	};
	this._hidePolygon = function (a) {
		if (this.idPull['polygon_' + a] != null)
			if (this.sxDacProc != null && this.idPull['sxDac_' + a] != null)
				this.idPull['sxDac_' + a]._hide();
			else if (this.idPull['polygon_' + a].style.display != 'none') {
				this.idPull['polygon_' + a].style.display = 'none';

				if (this.idPull['arrowup_' + a] != null) this.idPull['arrowup_' + a].style.display = 'none';

				if (this.idPull['arrowdown_' + a] != null)
					this.idPull['arrowdown_' + a].style.display = 'none';

				this._updateItemComplexState(a, !0, !1);

				if (this._isIE6 && this.idPull['polygon_' + a + '_ie6cover'] != null)
					this.idPull['polygon_' + a + '_ie6cover'].style.display = 'none';

				a = String(a).replace(this.idPrefix, '');
				a == this.topId && (a = null);
				this.callEvent('onHide', [a]);
			}
	};
	this._showPolygon = function (a, b) {
		const c = this._countVisiblePolygonItems(a);

		if (c != 0) {
			const d = 'polygon_' + a;

			if (
				this.idPull[d] != null &&
				this.idPull[a] != null &&
				(!this.menuModeTopLevelTimeout ||
					this.menuMode != 'web' ||
					this.context ||
					this.idPull[a]._mouseOver ||
					b != this.dirTopLevel)
			) {
				this.fixedPosition || this._autoDetectVisibleArea();
				let e = 0;
				let g = 0;
				let f = null;
				let i = null;

				if (this.limit > 0 && this.limit < c) {
					const n = 'arrowup_' + a;
					const D = 'arrowdown_' + a;
					this.idPull['arrowup_' + a] == null &&
						this._addUpArrow(String(a).replace(this.idPrefix, ''));
					this.idPull['arrowdown_' + a] == null &&
						this._addDownArrow(String(a).replace(this.idPrefix, ''));
					f = this.idPull['arrowup_' + a];
					f.style.visibility = 'hidden';
					f.style.display = '';
					f.style.zIndex = this.zInd;
					e = f.offsetHeight;
					i = this.idPull['arrowdown_' + a];
					i.style.visibility = 'hidden';
					i.style.display = '';
					i.style.zIndex = this.zInd;
					g = i.offsetHeight;
				}

				this.idPull[d].style.visibility = 'hidden';
				this.idPull[d].style.left = '0px';
				this.idPull[d].style.top = '0px';
				this.idPull[d].style.display = '';
				this.idPull[d].style.zIndex = this.zInd;

				if (this.limit > 0)
					this.limit < c
						? ((this.idPull[d].style.height = 24 * this.limit + 'px'),
						  (this.idPull[d].scrollTop = 0))
						: (this.idPull[d].style.height = '');

				this.zInd += this.zIndStep;

				if (this.itemPull[a] != null) var C = 'polygon_' + this.itemPull[a].parent;
				else this.context && (C = this.idPull[this.idPrefix + this.topId]);

				const q =
					this.idPull[a].tagName != null ? getAbsoluteLeft(this.idPull[a]) : this.idPull[a][0];
				const t =
					this.idPull[a].tagName != null ? getAbsoluteTop(this.idPull[a]) : this.idPull[a][1];
				const u = this.idPull[a].tagName != null ? this.idPull[a].offsetWidth : 0;
				const B = this.idPull[a].tagName != null ? this.idPull[a].offsetHeight + e + g : 0;
				let l = 0;
				let o = 0;
				const s = this.idPull[d].offsetWidth;
				const x = this.idPull[d].offsetHeight;
				b == 'bottom' &&
					((l = this._rtl
						? q + (u != null ? u : 0) - s
						: this._align == 'right'
						? q + u - s
						: q - 1 + (b == this.dirTopLevel ? this._topLevelRightMargin : 0)),
					(o = t - 1 + B - e - g + this._topLevelBottomMargin));
				b == 'right' && ((l = q + u - 1), (o = t + 2));
				b == 'left' && ((l = q - this.idPull[d].offsetWidth + 2), (o = t + 2));
				b == 'top' && ((l = q - 1), (o = t - x + 2));

				if (this.fixedPosition)
					var v = 65536,
						y = 65536;
				else if (
					((v = this.menuX2 != null ? this.menuX2 : 0),
					(y = this.menuY2 != null ? this.menuY2 : 0),
					v == 0)
				)
					window.innerWidth
						? ((v = window.innerWidth), (y = window.innerHeight))
						: ((v = document.body.offsetWidth), (y = document.body.scrollHeight));

				l + s > v && !this._rtl && (l = q - s + 2);
				l < this.menuX1 && this._rtl && (l = q + u - 2);
				l < 0 && (l = 0);
				o + x > y &&
					this.menuY2 != null &&
					((o = Math.max(t + B - x + 2, 2)),
					this.itemPull[a] != null &&
						!this.context &&
						this.itemPull[a].parent == this.idPrefix + this.topId &&
						(o -= this.base.offsetHeight));
				this.idPull[d].style.left = l + 'px';
				this.idPull[d].style.top = o + e + 'px';

				if (this.sxDacProc != null && this.idPull['sxDac_' + a] != null)
					this.idPull['sxDac_' + a]._show();
				else {
					this.idPull[d].style.visibility = '';

					if (this.limit > 0 && this.limit < c)
						(f.style.left = l + 'px'),
							(f.style.top = o + 'px'),
							(f.style.width = s + this._arrowFFFix + 'px'),
							(f.style.visibility = ''),
							(i.style.left = l + 'px'),
							(i.style.top = o + e + x + 'px'),
							(i.style.width = s + this._arrowFFFix + 'px'),
							(i.style.visibility = ''),
							this._checkArrowsState(a);

					if (this._isIE6) {
						const r = d + '_ie6cover';

						if (this.idPull[r] == null) {
							const w = document.createElement('IFRAME');
							w.className = 'dhtmlxMenu_IE6CoverFix_' + this.skin;
							w.frameBorder = 0;
							w.setAttribute('src', 'javascript:false;');
							document.body.insertBefore(w, document.body.firstChild);
							this.idPull[r] = w;
						}

						this.idPull[r].style.left = this.idPull[d].style.left;
						this.idPull[r].style.top = this.idPull[d].style.top;
						this.idPull[r].style.width = this.idPull[d].offsetWidth + 'px';
						this.idPull[r].style.height = this.idPull[d].offsetHeight + 'px';
						this.idPull[r].style.zIndex = this.idPull[d].style.zIndex - 1;
						this.idPull[r].style.display = '';
					}

					a = String(a).replace(this.idPrefix, '');
					a == this.topId && (a = null);
					this.callEvent('onShow', [a]);
				}
			}
		}
	};
	this._redistribSubLevelSelection = function (a, b) {
		for (; this._openedPolygons.length > 0; ) this._openedPolygons.pop();
		const c = this._getSubItemToDeselectByPolygon(b);
		this._removeSubItemFromSelected(-1, -1);
		for (var d = 0; d < c.length; d++)
			if (this.idPull[c[d]] != null && c[d] != a && this.itemPull[c[d]].state == 'enabled')
				this.idPull[c[d]].className = 'sub_item';
		for (d = 0; d < this._openedPolygons.length; d++)
			this._openedPolygons[d] != b && this._hidePolygon(this._openedPolygons[d]);

		if (this.itemPull[a].state == 'enabled') {
			this.idPull[a].className = 'sub_item_selected';

			if (this.itemPull[a].complex && this.dLoad && this.itemPull[a].loaded == 'no') {
				this.loaderIcon == !0 && this._updateLoaderIcon(a, !0);
				const e = new dtmlXMLLoaderObject(this._xmlParser, window);
				this.itemPull[a].loaded = 'get';
				this.callEvent('onXLS', []);
				e.loadXML(
					this.dLoadUrl +
						this.dLoadSign +
						'action=loadMenu&parentId=' +
						a.replace(this.idPrefix, '') +
						'&etc=' +
						new Date().getTime()
				);
			}

			if (
				(this.itemPull[a].complex || (this.dLoad && this.itemPull[a].loaded == 'yes')) &&
				this.itemPull[a].complex &&
				this.idPull['polygon_' + a] != null
			)
				this._updateItemComplexState(a, !0, !0), this._showPolygon(a, this.dirSubLevel);

			this._addSubItemToSelected(a, b);
			this.menuSelected = a;
		}
	};
	this._doOnClick = function (a, b, c) {
		this.menuLastClicked = a;

		if (
			this.itemPull[this.idPrefix + a].href_link != null &&
			this.itemPull[this.idPrefix + a].state == 'enabled'
		) {
			let d = document.createElement('FORM');
			const e = String(this.itemPull[this.idPrefix + a].href_link).split('?');
			d.action = e[0];

			if (e[1] != null)
				for (let f = String(e[1]).split('&'), g = 0; g < f.length; g++) {
					const i = String(f[g]).split('=');
					const n = document.createElement('INPUT');
					n.type = 'hidden';
					n.name = i[0] || '';
					n.value = i[1] || '';
					d.appendChild(n);
				}

			if (this.itemPull[this.idPrefix + a].href_target != null)
				d.target = this.itemPull[this.idPrefix + a].href_target;

			d.style.display = 'none';
			document.body.appendChild(d);
			d.submit();
			d != null && (document.body.removeChild(d), (d = null));
		} else
			b.charAt(0) != 'c' &&
				b.charAt(1) != 'd' &&
				b.charAt(2) != 's' &&
				(this.checkEvent('onClick')
					? (this._clearAndHide(),
					  this._isContextMenuVisible() && this.contextAutoHide && this._hideContextMenu(),
					  this.callEvent('onClick', [a, this.contextMenuZoneId, c]))
					: b.charAt(1) == 'd' ||
					  (this.menuMode == 'win' && b.charAt(2) == 't') ||
					  (this._clearAndHide(),
					  this._isContextMenuVisible() && this.contextAutoHide && this._hideContextMenu()));
	};
	this._doOnTouchMenu = function (a) {
		if (this.menuTouched == !1)
			(this.menuTouched = !0), this.checkEvent('onTouch') && this.callEvent('onTouch', [a]);
	};
	this._searchMenuNode = function (a, b) {
		for (var c = [], d = 0; d < b.length; d++)
			if (typeof b[d] === 'object') {
				b[d].length == 5 &&
					typeof b[d][0] !== 'object' &&
					b[d][0].replace(this.idPrefix, '') == a &&
					d == 0 &&
					(c = b);
				const e = this._searchMenuNode(a, b[d]);
				e.length > 0 && (c = e);
			}
		return c;
	};
	this._getMenuNodes = function (a) {
		const b = [];
		let c;
		for (c in this.itemPull) this.itemPull[c].parent == a && (b[b.length] = c);
		return b;
	};
	this._genStr = function (a) {
		for (
			var b = '', c = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', d = 0;
			d < a;
			d++
		)
			b += c.charAt(Math.round(Math.random() * (c.length - 1)));
		return b;
	};
	this.getItemType = function (a) {
		a = this.idPrefix + a;
		return this.itemPull[a] == null ? null : this.itemPull[a].type;
	};
	this.forEachItem = function (a) {
		for (const b in this.itemPull) a(String(b).replace(this.idPrefix, ''));
	};
	this._clearAndHide = function () {
		a.menuSelected = -1;
		for (a.menuLastClicked = -1; a._openedPolygons.length > 0; ) a._openedPolygons.pop();
		for (let b = 0; b < a._selectedSubItems.length; b++) {
			const c = a._selectedSubItems[b][0];

			if (a.idPull[c] != null && a.itemPull[c].state == 'enabled') {
				if (a.idPull[c].className == 'sub_item_selected') a.idPull[c].className = 'sub_item';

				if (a.idPull[c].className == 'dhtmlxMenu_' + a.skin + '_TopLevel_Item_Selected')
					a.idPull[c].className =
						a.itemPull[c].cssNormal != null
							? a.itemPull[c].cssNormal
							: 'dhtmlxMenu_' + a.skin + '_TopLevel_Item_Normal';
			}

			a._hidePolygon(c);
		}
		a.menuTouched = !1;

		if (a.context)
			a.contextHideAllMode
				? (a._hidePolygon(a.idPrefix + a.topId), (a.zInd = a.zIndInit))
				: (a.zInd = a.zIndInit + a.zIndStep);
	};
	this._doOnLoad = function () {};
	this.loadXML = function (a, b) {
		if (b)
			this._doOnLoad = function () {
				b();
			};

		this.callEvent('onXLS', []);
		this._xmlLoader.loadXML(a);
	};
	this.loadXMLString = function (a, b) {
		if (b)
			this._doOnLoad = function () {
				b();
			};

		this._xmlLoader.loadXMLString(a);
	};
	this._buildMenu = function (a, b) {
		for (var c = 0, d = 0; d < a.childNodes.length; d++)
			if (a.childNodes[d].tagName == this.itemTagName) {
				const e = a.childNodes[d];
				const f = {};
				f.id = this.idPrefix + (e.getAttribute('id') || this._genStr(24));
				f.title = e.getAttribute('text') || '';
				f.imgen = e.getAttribute('img') || '';
				f.imgdis = e.getAttribute('imgdis') || '';
				f.tip = '';
				f.hotkey = '';
				e.getAttribute('cssNormal') != null && (f.cssNormal = e.getAttribute('cssNormal'));
				f.type = e.getAttribute('type') || 'item';

				if (f.type == 'checkbox')
					(f.checked = e.getAttribute('checked') != null),
						(f.imgen = 'chbx_' + (f.checked ? '1' : '0')),
						(f.imgdis = f.imgen);

				if (f.type == 'radio')
					(f.checked = e.getAttribute('checked') != null),
						(f.imgen = 'rdbt_' + (f.checked ? '1' : '0')),
						(f.imgdis = f.imgen),
						(f.group = e.getAttribute('group') || this._genStr(24)),
						this.radio[f.group] == null && (this.radio[f.group] = []),
						(this.radio[f.group][this.radio[f.group].length] = f.id);

				f.state =
					e.getAttribute('enabled') != null || e.getAttribute('disabled') != null
						? e.getAttribute('enabled') == 'false' || e.getAttribute('disabled') == 'true'
							? 'disabled'
							: 'enabled'
						: 'enabled';
				f.parent = b != null ? b : this.idPrefix + this.topId;
				f.complex = this.dLoad
					? e.getAttribute('complex') != null
						? !0
						: !1
					: this._buildMenu(e, f.id) > 0;
				this.dLoad && f.complex && (f.loaded = 'no');
				this.itemPull[f.id] = f;
				for (let g = 0; g < e.childNodes.length; g++) {
					let i = e.childNodes[g].tagName;
					i != null && (i = i.toLowerCase());

					if (i == this.userDataTagName) {
						const n = e.childNodes[g];
						n.getAttribute('name') != null &&
							(this.userData[f.id + '_' + n.getAttribute('name')] =
								n.firstChild.nodeValue != null ? n.firstChild.nodeValue : '');
					}

					if (i == this.itemTextTagName) f.title = e.childNodes[g].firstChild.nodeValue;

					if (i == this.itemTipTagName) f.tip = e.childNodes[g].firstChild.nodeValue;

					if (i == this.itemHotKeyTagName) f.hotkey = e.childNodes[g].firstChild.nodeValue;

					if (i == this.itemHrefTagName && f.type == 'item')
						(f.href_link = e.childNodes[g].firstChild.nodeValue),
							e.childNodes[g].getAttribute('target') != null &&
								(f.href_target = e.childNodes[g].getAttribute('target'));
				}
				c++;
			}
		return c;
	};
	this._xmlParser = function () {
		if (a.dLoad) {
			var b = this.getXMLTopNode('menu');
			parentId = b.getAttribute('parentId') != null ? b.getAttribute('parentId') : null;

			if (parentId == null) a._buildMenu(b, null), a._initTopLevelMenu();
			else {
				a._buildMenu(b, a.idPrefix + parentId);
				a._addSubMenuPolygon(a.idPrefix + parentId, a.idPrefix + parentId);

				if (a.menuSelected == a.idPrefix + parentId) {
					const c = a.idPrefix + parentId;
					const d = a.itemPull[a.idPrefix + parentId].parent == a.idPrefix + a.topId;
					const e = d && !a.context ? a.dirTopLevel : a.dirSubLevel;
					let f = !1;

					if (d && a.menuModeTopLevelTimeout && a.menuMode == 'web' && !a.context) {
						const g = a.idPull[a.idPrefix + parentId];

						if (g._mouseOver == !0) {
							const p = a.menuModeTopLevelTimeoutTime - (new Date().getTime() - g._dynLoadTM);

							if (p > 1)
								(g._menuOpenTM = window.setTimeout(function () {
									a._showPolygon(c, e);
								}, p)),
									(f = !0);
						}
					}

					f || a._showPolygon(c, e);
				}

				a.itemPull[a.idPrefix + parentId].loaded = 'yes';
				a.loaderIcon == !0 && a._updateLoaderIcon(a.idPrefix + parentId, !1);
			}

			this.destructor();
			a.callEvent('onXLE', []);
		} else
			(b = this.getXMLTopNode('menu')),
				a._buildMenu(b, null),
				a.init(),
				a.callEvent('onXLE', []),
				a._doOnLoad();
	};
	this._xmlLoader = new dtmlXMLLoaderObject(this._xmlParser, window);
	this._showSubLevelItem = function (a, b) {
		if (document.getElementById('arrow_' + this.idPrefix + a) != null)
			document.getElementById('arrow_' + this.idPrefix + a).style.display = b ? 'none' : '';

		if (document.getElementById('image_' + this.idPrefix + a) != null)
			document.getElementById('image_' + this.idPrefix + a).style.display = b ? 'none' : '';

		if (document.getElementById(this.idPrefix + a) != null)
			document.getElementById(this.idPrefix + a).style.display = b ? '' : 'none';
	};
	this._hideSubLevelItem = function (a) {
		this._showSubLevelItem(a, !0);
	};
	this.idPrefix = this._genStr(12);
	this._bodyClick = function (b) {
		b = b || event;
		b.button == 2 ||
			(_isOpera && b.ctrlKey == !0) ||
			(a.context
				? a.contextAutoHide &&
				  (!_isOpera || (a._isContextMenuVisible() && _isOpera)) &&
				  a._hideContextMenu()
				: a._clearAndHide());
	};
	this._bodyContext = function (b) {
		var b = b || event;
		const c = (b.srcElement || b.target).className;

		if (!(c.search('dhtmlxMenu') != -1 && c.search('SubLevelArea') != -1)) {
			let d = !0;
			const e = b.target || b.srcElement;
			e.id != null && a.isContextZone(e.id) && (d = !1);
			e == document.body && (d = !1);
			d && a.hideContextMenu();
		}
	};
	_isIE
		? (document.body.attachEvent('onclick', this._bodyClick),
		  document.body.attachEvent('oncontextmenu', this._bodyContext))
		: (window.addEventListener('click', this._bodyClick, !1),
		  window.addEventListener('contextmenu', this._bodyContext, !1));
	this._UID = this._genStr(32);
	dhtmlxMenuObjectLiveInstances[this._UID] = this;
	dhtmlxEventable(this);
	return this;
};

dhtmlXMenuObject.prototype.init = function () {
	if (this._isInited != !0)
		this.dLoad
			? (this.callEvent('onXLS', []),
			  this._xmlLoader.loadXML(
					this.dLoadUrl + this.dLoadSign + 'action=loadMenu&etc=' + new Date().getTime()
			  ))
			: (this._initTopLevelMenu(), (this._isInited = !0));
};
dhtmlXMenuObject.prototype._countVisiblePolygonItems = function (b) {
	let c = 0;
	let a;
	for (a in this.itemPull) {
		const d = this.itemPull[a].parent;
		const f = this.itemPull[a].type;
		this.idPull[a] != null &&
			d == b &&
			(f == 'item' || f == 'radio' || f == 'checkbox') &&
			this.idPull[a].style.display != 'none' &&
			c++;
	}
	return c;
};
dhtmlXMenuObject.prototype._redefineComplexState = function (b) {
	if (
		this.idPrefix + this.topId != b &&
		this.idPull['polygon_' + b] != null &&
		this.idPull[b] != null
	) {
		const c = this._countVisiblePolygonItems(b);
		c > 0 && !this.itemPull[b].complex && this._updateItemComplexState(b, !0, !1);
		c == 0 && this.itemPull[b].complex && this._updateItemComplexState(b, !1, !1);
	}
};
dhtmlXMenuObject.prototype._updateItemComplexState = function (b, c) {
	if (!this.context && this._getItemLevelType(b.replace(this.idPrefix, '')) == 'TopLevel')
		this.itemPull[b].complex = c;
	else if (!(this.idPull[b] == null || this.itemPull[b] == null))
		if (((this.itemPull[b].complex = c), b != this.idPrefix + this.topId)) {
			let a = null;
			const d = this.idPull[b].childNodes[this._rtl ? 0 : 2];
			d.childNodes[0] &&
				String(d.childNodes[0].className).search('complex_arrow') === 0 &&
				(a = d.childNodes[0]);

			if (this.itemPull[b].complex) {
				if (a == null) {
					a = document.createElement('DIV');
					a.className = 'complex_arrow';
					for (a.id = 'arrow_' + b; d.childNodes.length > 0; ) d.removeChild(d.childNodes[0]);
					d.appendChild(a);
				}

				if (this.dLoad && this.itemPull[b].loaded == 'get' && this.loaderIcon) {
					if (a.className != 'complex_arrow_loading') a.className = 'complex_arrow_loading';
				} else a.className = 'complex_arrow';
			} else
				!this.itemPull[b].complex &&
					a != null &&
					(d.removeChild(a),
					this.itemPull[b].hotkey_backup != null &&
						this.setHotKey &&
						this.setHotKey(b.replace(this.idPrefix, ''), this.itemPull[b].hotkey_backup));
		}
};
dhtmlXMenuObject.prototype._getItemLevelType = function (b) {
	return this.itemPull[this.idPrefix + b].parent == this.idPrefix + this.topId
		? 'TopLevel'
		: 'SubLevelArea';
};
dhtmlXMenuObject.prototype._redistribTopLevelSelection = function (b) {
	const c = this._getSubItemToDeselectByPolygon('parent');
	this._removeSubItemFromSelected(-1, -1);
	for (let a = 0; a < c.length; a++)
		if ((c[a] != b && this._hidePolygon(c[a]), this.idPull[c[a]] != null && c[a] != b))
			this.idPull[c[a]].className = this.idPull[c[a]].className.replace(/Selected/g, 'Normal');

	if (this.itemPull[this.idPrefix + b].state == 'enabled')
		(this.idPull[this.idPrefix + b].className =
			'dhtmlxMenu_' + this.skin + '_TopLevel_Item_Selected'),
			this._addSubItemToSelected(this.idPrefix + b, 'parent'),
			(this.menuSelected =
				this.menuMode == 'win' ? (this.menuSelected != -1 ? b : this.menuSelected) : b),
			this.itemPull[this.idPrefix + b].complex &&
				this.menuSelected != -1 &&
				this._showPolygon(this.idPrefix + b, this.dirTopLevel);
};
dhtmlXMenuObject.prototype._initTopLevelMenu = function () {
	this.dirTopLevel = 'bottom';
	this.dirSubLevel = this._rtl ? 'left' : 'right';

	if (this.context)
		(this.idPull[this.idPrefix + this.topId] = [0, 0]),
			this._addSubMenuPolygon(this.idPrefix + this.topId, this.idPrefix + this.topId);
	else
		for (let b = this._getMenuNodes(this.idPrefix + this.topId), c = 0; c < b.length; c++)
			this.itemPull[b[c]].type == 'item' && this._renderToplevelItem(b[c], null),
				this.itemPull[b[c]].type == 'separator' && this._renderSeparator(b[c], null);
};
dhtmlXMenuObject.prototype._renderToplevelItem = function (b, c) {
	const a = this;
	const d = document.createElement('DIV');
	d.id = b;
	d.className =
		this.itemPull[b].state == 'enabled' && this.itemPull[b].cssNormal != null
			? this.itemPull[b].cssNormal
			: 'dhtmlxMenu_' +
			  this.skin +
			  '_TopLevel_Item_' +
			  (this.itemPull[b].state == 'enabled' ? 'Normal' : 'Disabled');

	if (this.itemPull[b].title != '') {
		const f = document.createElement('DIV');
		f.className = 'top_level_text';
		f.innerHTML = this.itemPull[b].title;
		d.appendChild(f);
	}

	if (this.itemPull[b].tip.length > 0) d.title = this.itemPull[b].tip;

	if (this.itemPull[b].imgen != '' || this.itemPull[b].imgdis != '') {
		const e = this.itemPull[b][this.itemPull[b].state == 'enabled' ? 'imgen' : 'imgdis'];

		if (e) {
			const g = document.createElement('IMG');
			g.border = '0';
			g.id = 'image_' + b;
			g.src = this.imagePath + e;
			g.className = 'dhtmlxMenu_TopLevel_Item_Icon';
			d.childNodes.length > 0 && !this._rtl ? d.insertBefore(g, d.childNodes[0]) : d.appendChild(g);
		}
	}

	d.onselectstart = function (a) {
		a = a || event;
		return (a.returnValue = !1);
	};
	d.oncontextmenu = function (a) {
		a = a || event;
		return (a.returnValue = !1);
	};

	if (!this.cont)
		(this.cont = document.createElement('DIV')),
			(this.cont.dir = 'ltr'),
			(this.cont.className = this._align == 'right' ? 'align_right' : 'align_left'),
			this.base.appendChild(this.cont);

	c != null && (c++, c < 0 && (c = 0), c > this.cont.childNodes.length - 1 && (c = null));
	c != null ? this.cont.insertBefore(d, this.cont.childNodes[c]) : this.cont.appendChild(d);
	this.idPull[d.id] = d;
	this.itemPull[b].complex &&
		!this.dLoad &&
		this._addSubMenuPolygon(this.itemPull[b].id, this.itemPull[b].id);
	d.onmouseover = function () {
		a.menuMode == 'web' && window.clearTimeout(a.menuTimeoutHandler);
		const b = a._getSubItemToDeselectByPolygon('parent');
		a._removeSubItemFromSelected(-1, -1);
		for (let c = 0; c < b.length; c++)
			if ((b[c] != this.id && a._hidePolygon(b[c]), a.idPull[b[c]] != null && b[c] != this.id))
				if (a.itemPull[b[c]].cssNormal != null)
					a.idPull[b[c]].className = a.itemPull[b[c]].cssNormal;
				else {
					if (a.idPull[b[c]].className == 'sub_item_selected')
						a.idPull[b[c]].className = 'sub_item';

					a.idPull[b[c]].className = a.idPull[b[c]].className.replace(/Selected/g, 'Normal');
				}

		if (a.itemPull[this.id].state == 'enabled') {
			this.className = 'dhtmlxMenu_' + a.skin + '_TopLevel_Item_Selected';
			a._addSubItemToSelected(this.id, 'parent');
			a.menuSelected =
				a.menuMode == 'win' ? (a.menuSelected != -1 ? this.id : a.menuSelected) : this.id;

			if (a.dLoad && a.itemPull[this.id].loaded == 'no') {
				if (a.menuModeTopLevelTimeout && a.menuMode == 'web' && !a.context)
					(this._mouseOver = !0), (this._dynLoadTM = new Date().getTime());

				const d = new dtmlXMLLoaderObject(a._xmlParser, window);
				a.itemPull[this.id].loaded = 'get';
				a.callEvent('onXLS', []);
				d.loadXML(
					a.dLoadUrl +
						a.dLoadSign +
						'action=loadMenu&parentId=' +
						this.id.replace(a.idPrefix, '') +
						'&etc=' +
						new Date().getTime()
				);
			}

			if (
				(!a.dLoad ||
					(a.dLoad && (!a.itemPull[this.id].loaded || a.itemPull[this.id].loaded == 'yes'))) &&
				a.itemPull[this.id].complex &&
				a.menuSelected != -1
			)
				if (a.menuModeTopLevelTimeout && a.menuMode == 'web' && !a.context) {
					this._mouseOver = !0;
					const e = this.id;
					this._menuOpenTM = window.setTimeout(function () {
						a._showPolygon(e, a.dirTopLevel);
					}, a.menuModeTopLevelTimeoutTime);
				} else a._showPolygon(this.id, a.dirTopLevel);
		}

		a._doOnTouchMenu(this.id.replace(a.idPrefix, ''));
	};
	d.onmouseout = function () {
		if (
			!(a.itemPull[this.id].complex && a.menuSelected != -1) &&
			a.itemPull[this.id].state == 'enabled'
		)
			d.className =
				a.itemPull[this.id].cssNormal != null
					? a.itemPull[this.id].cssNormal
					: 'dhtmlxMenu_' + a.skin + '_TopLevel_Item_Normal';

		if (a.menuMode == 'web')
			window.clearTimeout(a.menuTimeoutHandler),
				(a.menuTimeoutHandler = window.setTimeout(
					function () {
						a._clearAndHide();
					},
					a.menuTimeoutMsec,
					'JavaScript'
				));

		if (a.menuModeTopLevelTimeout && a.menuMode == 'web' && !a.context)
			(this._mouseOver = !1), window.clearTimeout(this._menuOpenTM);
	};
	d.onclick = function (b) {
		a.menuMode == 'web' && window.clearTimeout(a.menuTimeoutHandler);

		if (!(a.menuMode != 'web' && a.itemPull[this.id].state == 'disabled')) {
			b = b || event;
			b.cancelBubble = !0;
			b.returnValue = !1;

			if (a.menuMode == 'win' && a.itemPull[this.id].complex) {
				if (a.menuSelected == this.id) {
					a.menuSelected = -1;
					var c = !1;
				} else (a.menuSelected = this.id), (c = !0);

				c ? a._showPolygon(this.id, a.dirTopLevel) : a._hidePolygon(this.id);
			}

			const d = a.itemPull[this.id].complex ? 'c' : '-';
			const e = a.itemPull[this.id].state != 'enabled' ? 'd' : '-';
			const f = {
				ctrl: b.ctrlKey,
				alt: b.altKey,
				shift: b.shiftKey,
			};
			a._doOnClick(this.id.replace(a.idPrefix, ''), d + e + 't', f);
			return !1;
		}
	};
};
dhtmlXMenuObject.prototype.setImagePath = function () {};
dhtmlXMenuObject.prototype.setIconsPath = function (b) {
	this.imagePath = b;
};
dhtmlXMenuObject.prototype.setIconPath = dhtmlXMenuObject.prototype.setIconsPath;
dhtmlXMenuObject.prototype._updateItemImage = function (b) {
	var b = this.idPrefix + b;
	const c = this.itemPull[b].parent == this.idPrefix + this.topId && !this.context;
	let a = null;

	if (c)
		for (let d = 0; d < this.idPull[b].childNodes.length; d++)
			try {
				this.idPull[b].childNodes[d].className == 'dhtmlxMenu_TopLevel_Item_Icon' &&
					(a = this.idPull[b].childNodes[d]);
			} catch (f) {}
	else
		try {
			a = this.idPull[b].childNodes[this._rtl ? 2 : 0].childNodes[0];
		} catch (e) {}

	const g =
		this.itemPull[b].type == 'radio'
			? this.itemPull[b][this.itemPull[b].state == 'enabled' ? 'imgen' : 'imgdis']
			: this.itemPull[b][this.itemPull[b].state == 'enabled' ? 'imgen' : 'imgdis'];

	if (g.length > 0)
		if (a != null) a.src = this.imagePath + g;
		else if (c)
			(a = document.createElement('IMG')),
				(a.className = 'dhtmlxMenu_TopLevel_Item_Icon'),
				(a.src = this.imagePath + g),
				(a.border = '0'),
				(a.id = 'image_' + b),
				!this._rtl && this.idPull[b].childNodes.length > 0
					? this.idPull[b].insertBefore(a, this.idPull[b].childNodes[0])
					: this.idPull[b].appendChild(a);
		else {
			a = document.createElement('IMG');
			a.className = 'sub_icon';
			a.src = this.imagePath + g;
			a.border = '0';
			a.id = 'image_' + b;
			for (var h = this.idPull[b].childNodes[this._rtl ? 2 : 0]; h.childNodes.length > 0; )
				h.removeChild(h.childNodes[0]);
			h.appendChild(a);
		}
	else a != null && a.parentNode.removeChild(a);
};
dhtmlXMenuObject.prototype.removeItem = function (b, c, a) {
	c || (b = this.idPrefix + b);
	let d = null;

	if (b != this.idPrefix + this.topId) {
		if (this.itemPull[b] == null) return;

		let f = this.itemPull[b].type;

		if (f == 'separator') {
			var e = this.idPull['separator_' + b];
			this.itemPull[b].parent == this.idPrefix + this.topId
				? ((e.onclick = null), (e.onselectstart = null), (e.id = null))
				: ((e.childNodes[0].childNodes[0].onclick = null),
				  (e.childNodes[0].childNodes[0].onselectstart = null),
				  (e.childNodes[0].childNodes[0].id = null),
				  e.childNodes[0].removeChild(e.childNodes[0].childNodes[0]),
				  e.removeChild(e.childNodes[0]));
			e.parentNode.removeChild(e);
			this.idPull['separator_' + b] = null;
			this.itemPull[b] = null;
			delete this.idPull['separator_' + b];
		} else {
			d = this.itemPull[b].parent;
			e = this.idPull[b];
			e.onclick = null;
			e.oncontextmenu = null;
			e.onmouseover = null;
			e.onmouseout = null;
			e.onselectstart = null;
			for (e.id = null; e.childNodes.length > 0; ) e.removeChild(e.childNodes[0]);
			e.parentNode.removeChild(e);
			this.idPull[b] = null;
			this.itemPull[b] = null;
			delete this.idPull[b];
		}

		delete this.itemPull[b];
		f = e = null;
	}

	for (const g in this.itemPull) this.itemPull[g].parent == b && this.removeItem(g, !0, !0);
	let h = Array(b);
	d != null &&
		!a &&
		this.idPull['polygon_' + d] != null &&
		this.idPull['polygon_' + d].tbd.childNodes.length == 0 &&
		(h.push(d), this._updateItemComplexState(d, !1, !1));
	for (let j = 0; j < h.length; j++)
		if (this.idPull['polygon_' + h[j]]) {
			let k = this.idPull['polygon_' + h[j]];
			k.onclick = null;
			k.oncontextmenu = null;
			k.tbl.removeChild(k.tbd);
			k.tbd = null;
			k.removeChild(k.tbl);
			k.tbl = null;
			k.id = null;
			k.parentNode.removeChild(k);
			k = null;

			if (this._isIE6) {
				const m = 'polygon_' + h[j] + '_ie6cover';
				this.idPull[m] != null &&
					(document.body.removeChild(this.idPull[m]), delete this.idPull[m]);
			}

			this.idPull['arrowup_' + b] != null && this._removeArrow && this._removeArrow('arrowup_' + b);
			this.idPull['arrowdown_' + b] != null &&
				this._removeArrow &&
				this._removeArrow('arrowdown_' + b);
			this.idPull['polygon_' + h[j]] = null;
			delete this.idPull['polygon_' + h[j]];
		}
	h = null;
};
dhtmlXMenuObject.prototype._getAllParents = function (b) {
	const c = [];
	let a;
	for (a in this.itemPull)
		if (
			this.itemPull[a].parent == b &&
			((c[c.length] = this.itemPull[a].id), this.itemPull[a].complex)
		)
			for (let d = this._getAllParents(this.itemPull[a].id), f = 0; f < d.length; f++)
				c[c.length] = d[f];
	return c;
};
dhtmlXMenuObject.prototype.renderAsContextMenu = function () {
	this.context = !0;

	if (this.base._autoSkinUpdate == !0)
		(this.base.className = this.base.className.replace('dhtmlxMenu_' + this.skin + '_Middle', '')),
			(this.base._autoSkinUpdate = !1);

	this.addBaseIdAsContextZone != null && this.addContextZone(this.addBaseIdAsContextZone);
};
dhtmlXMenuObject.prototype.addContextZone = function (b) {
	let c;

	if (typeof b === 'string') {
		c = document.getElementById(b);
	} else {
		c = b;

		if (b == document.body) {
			b = 'document.body';
		} else {
			b = c.id;
		}
	}

	/*
    var a = !1, d;
    for (d in this.contextZones) 
        a = a || d == b || this.contextZones[d] == c;
    if (a == !0) 
        return !1;
	*/
	this.contextZones[b] = c;

	const f = this;

	if (_isOpera)
		(this.operaContext = function (a) {
			f._doOnContextMenuOpera(a, f);
		}),
			c.addEventListener('mouseup', this.operaContext, !1);
	else {
		if (c.oncontextmenu != null && !c._oldContextMenuHandler)
			c._oldContextMenuHandler = c.oncontextmenu;

		c.oncontextmenu = function (a) {
			if (a.target.tagName == 'INPUT' || a.target.tagName == 'textarea') {
				return;
			}

			for (const b in dhtmlxMenuObjectLiveInstances)
				b != f._UID &&
					dhtmlxMenuObjectLiveInstances[b].context &&
					dhtmlxMenuObjectLiveInstances[b]._hideContextMenu();
			a = a || event;
			a.cancelBubble = !0;
			a.returnValue = !1;
			f._doOnContextBeforeCall(a, this);
			return !1;
		};
	}
};
dhtmlXMenuObject.prototype._doOnContextMenuOpera = function (b, c) {
	for (const a in dhtmlxMenuObjectLiveInstances)
		a != c._UID &&
			dhtmlxMenuObjectLiveInstances[a].context &&
			dhtmlxMenuObjectLiveInstances[a]._hideContextMenu();
	b.cancelBubble = !0;
	b.returnValue = !1;
	b.button == 0 && b.ctrlKey == !0 && c._doOnContextBeforeCall(b, this);
	return !1;
};
dhtmlXMenuObject.prototype.removeContextZone = function (b) {
	if (!this.isContextZone(b)) return !1;

	b == document.body && (b = 'document.body.' + this.idPrefix);
	const c = this.contextZones[b];
	_isOpera
		? c.removeEventListener('mouseup', this.operaContext, !1)
		: ((c.oncontextmenu = c._oldContextMenuHandler != null ? c._oldContextMenuHandler : null),
		  (c._oldContextMenuHandler = null));
	try {
		(this.contextZones[b] = null), delete this.contextZones[b];
	} catch (a) {}
	return !0;
};
dhtmlXMenuObject.prototype.isContextZone = function (b) {
	if (b == document.body && this.contextZones['document.body.' + this.idPrefix] != null) return !0;

	let c = !1;
	this.contextZones[b] != null && this.contextZones[b] == document.getElementById(b) && (c = !0);
	return c;
};
dhtmlXMenuObject.prototype._isContextMenuVisible = function () {
	return this.idPull['polygon_' + this.idPrefix + this.topId] == null
		? !1
		: this.idPull['polygon_' + this.idPrefix + this.topId].style.display == '';
};
dhtmlXMenuObject.prototype._showContextMenu = function (b, c, a) {
	this._clearAndHide();

	if (this.idPull['polygon_' + this.idPrefix + this.topId] == null) return !1;

	window.clearTimeout(this.menuTimeoutHandler);
	this.idPull[this.idPrefix + this.topId] = [b, c];
	this._showPolygon(this.idPrefix + this.topId, 'bottom');
	this.callEvent('onContextMenu', [a, this.contextMenuZoneId]);
};
dhtmlXMenuObject.prototype._hideContextMenu = function () {
	if (this.idPull['polygon_' + this.idPrefix + this.topId] == null) return !1;

	this._clearAndHide();
	this._hidePolygon(this.idPrefix + this.topId);
	this.zInd = this.zIndInit;
};
dhtmlXMenuObject.prototype._doOnContextBeforeCall = function (b, c) {
	this.contextMenuZoneId = c.id;
	this._clearAndHide();
	this._hideContextMenu();
	const a = b.srcElement || b.target;
	const d = _isIE || _isOpera || _KHTMLrv ? b.offsetX : b.layerX;
	const f = _isIE || _isOpera || _KHTMLrv ? b.offsetY : b.layerY;
	const e = getAbsoluteLeft(a) + d;
	const g = getAbsoluteTop(a) + f;
	this.checkEvent('onBeforeContextMenu')
		? this.callEvent('onBeforeContextMenu', [c.id, b]) &&
		  this.contextAutoShow &&
		  (this._showContextMenu(e, g), this.callEvent('onAfterContextMenu', [c.id, b]))
		: this.contextAutoShow &&
		  (this._showContextMenu(e, g), this.callEvent('onAfterContextMenu', [c.id]));
};
dhtmlXMenuObject.prototype.showContextMenu = function (b, c) {
	this._showContextMenu(b, c, !1);
};
dhtmlXMenuObject.prototype.hideContextMenu = function () {
	this._hideContextMenu();
};
dhtmlXMenuObject.prototype._autoDetectVisibleArea = function () {
	if (!this._isVisibleArea)
		(this.menuX1 = document.body.scrollLeft),
			(this.menuX2 = this.menuX1 + (window.innerWidth || document.body.clientWidth)),
			(this.menuY1 = Math.max(
				(_isIE ? document.documentElement : document.getElementsByTagName('html')[0]).scrollTop,
				document.body.scrollTop
			)),
			(this.menuY2 =
				this.menuY1 +
				(_isIE
					? Math.max(
							document.documentElement.clientHeight || 0,
							document.documentElement.offsetHeight || 0,
							document.body.clientHeight || 0
					  )
					: window.innerHeight));
};
dhtmlXMenuObject.prototype.getItemPosition = function (b) {
	var b = this.idPrefix + b;
	let c = -1;

	if (this.itemPull[b] == null) return c;

	for (
		let a = this.itemPull[b].parent,
			d = this.idPull['polygon_' + a] != null ? this.idPull['polygon_' + a].tbd : this.cont,
			f = 0;
		f < d.childNodes.length;
		f++
	)
		if (d.childNodes[f] == this.idPull['separator_' + b] || d.childNodes[f] == this.idPull[b])
			c = f;
	return c;
};
dhtmlXMenuObject.prototype.setItemPosition = function (b, c) {
	b = this.idPrefix + b;

	if (this.idPull[b] != null) {
		const a = this.itemPull[b].parent == this.idPrefix + this.topId;
		const d = this.idPull[b];
		const f = this.getItemPosition(b.replace(this.idPrefix, ''));
		const e = this.itemPull[b].parent;
		const g = this.idPull['polygon_' + e] != null ? this.idPull['polygon_' + e].tbd : this.cont;
		g.removeChild(g.childNodes[f]);
		c < 0 && (c = 0);
		a && c < 1 && (c = 1);
		c < g.childNodes.length ? g.insertBefore(d, g.childNodes[c]) : g.appendChild(d);
	}
};
dhtmlXMenuObject.prototype.getParentId = function (b) {
	b = this.idPrefix + b;
	return this.itemPull[b] == null
		? null
		: (this.itemPull[b].parent != null ? this.itemPull[b].parent : this.topId).replace(
				this.idPrefix,
				''
		  );
};
dhtmlXMenuObject.prototype.addNewSibling = function (b, c, a, d, f, e) {
	const g = this.idPrefix + (c != null ? c : this._genStr(24));
	const h = this.idPrefix + (b != null ? this.getParentId(b) : this.topId);
	this._addItemIntoGlobalStrorage(g, h, a, 'item', d, f, e);
	h == this.idPrefix + this.topId && !this.context
		? this._renderToplevelItem(g, this.getItemPosition(b))
		: this._renderSublevelItem(g, this.getItemPosition(b));
};
dhtmlXMenuObject.prototype.addNewChild = function (b, c, a, d, f, e, g) {
	if (b == null)
		if (this.context) b = this.topId;
		else {
			this.addNewSibling(b, a, d, f, e, g);
			c != null && this.setItemPosition(a, c);
			return;
		}

	a = this.idPrefix + (a != null ? a : this._genStr(24));
	this.setHotKey && this.setHotKey(b, '');
	b = this.idPrefix + b;
	this._addItemIntoGlobalStrorage(a, b, d, 'item', f, e, g);
	this.idPull['polygon_' + b] == null && this._renderSublevelPolygon(b, b);
	this._renderSublevelItem(a, c - 1);
	this._redefineComplexState(b);
};
dhtmlXMenuObject.prototype._addItemIntoGlobalStrorage = function (b, c, a, d, f, e, g) {
	const h = {
		id: b,
		title: a,
		imgen: e != null ? e : '',
		imgdis: g != null ? g : '',
		type: d,
		state: f == !0 ? 'disabled' : 'enabled',
		parent: c,
		complex: !1,
		hotkey: '',
		tip: '',
	};
	this.itemPull[h.id] = h;
};
dhtmlXMenuObject.prototype._addSubMenuPolygon = function (b, c) {
	for (
		var a = this._renderSublevelPolygon(b, c), d = this._getMenuNodes(c), f = 0;
		f < d.length;
		f++
	)
		this.itemPull[d[f]].type == 'separator'
			? this._renderSeparator(d[f], null)
			: this._renderSublevelItem(d[f], null);
	for (var e = b == c ? 'topLevel' : 'subLevel', f = 0; f < d.length; f++)
		this.itemPull[d[f]].complex && this._addSubMenuPolygon(b, this.itemPull[d[f]].id);
};
dhtmlXMenuObject.prototype._renderSublevelPolygon = function (b, c) {
	const a = document.createElement('DIV');
	a.className =
		'dhtmlxMenu_' + this.skin + '_SubLevelArea_Polygon ' + (this._rtl ? 'dir_right' : '');
	a.dir = 'ltr';
	a.oncontextmenu = function (a) {
		a = a || event;
		a.returnValue = !1;
		a.cancelBubble = !0;
		return !1;
	};
	a.id = 'polygon_' + c;
	a.onclick = function (a) {
		a = a || event;
		a.cancelBubble = !0;
	};
	a.style.display = 'none';
	document.body.insertBefore(a, document.body.firstChild);
	const d = document.createElement('TABLE');
	d.className = 'dhtmlxMebu_SubLevelArea_Tbl';
	d.cellSpacing = 0;
	d.cellPadding = 0;
	d.border = 0;
	const f = document.createElement('TBODY');
	d.appendChild(f);
	a.appendChild(d);
	a.tbl = d;
	a.tbd = f;
	this.idPull[a.id] = a;
	this.sxDacProc != null &&
		((this.idPull['sxDac_' + c] = new this.sxDacProc(a, a.className)),
		_isIE
			? (this.idPull['sxDac_' + c]._setSpeed(this.dacSpeedIE),
			  this.idPull['sxDac_' + c]._setCustomCycle(this.dacCyclesIE))
			: (this.idPull['sxDac_' + c]._setSpeed(this.dacSpeed),
			  this.idPull['sxDac_' + c]._setCustomCycle(this.dacCycles)));
	return a;
};
dhtmlXMenuObject.prototype._renderSublevelItem = function (b, c) {
	const a = this;
	const d = document.createElement('TR');
	d.className = this.itemPull[b].state == 'enabled' ? 'sub_item' : 'sub_item_dis';
	const f = document.createElement('TD');
	f.className = 'sub_item_icon';
	const e = this.itemPull[b][this.itemPull[b].state == 'enabled' ? 'imgen' : 'imgdis'];

	if (e != '') {
		const g = this.itemPull[b].type;

		if (g == 'checkbox' || g == 'radio') {
			var h = document.createElement('DIV');
			h.id = 'image_' + this.itemPull[b].id;
			h.className = 'sub_icon ' + e;
			f.appendChild(h);
		}

		if (!(g == 'checkbox' || g == 'radio'))
			(h = document.createElement('IMG')),
				(h.id = 'image_' + this.itemPull[b].id),
				(h.className = 'sub_icon'),
				(h.src = this.imagePath + e),
				f.appendChild(h);
	}

	const j = document.createElement('TD');
	j.className = 'sub_item_text';

	if (this.itemPull[b].title != '') {
		const k = document.createElement('DIV');
		k.className = 'sub_item_text';
		k.innerHTML = this.itemPull[b].title;
		j.appendChild(k);
	} else j.innerHTML = '&nbsp;';

	const m = document.createElement('TD');
	m.className = 'sub_item_hk';

	if (this.itemPull[b].complex) {
		const z = document.createElement('DIV');
		z.className = 'complex_arrow';
		z.id = 'arrow_' + this.itemPull[b].id;
		m.appendChild(z);
	} else if (this.itemPull[b].hotkey.length > 0 && !this.itemPull[b].complex) {
		const A = document.createElement('DIV');
		A.className = 'sub_item_hk';
		A.innerHTML = this.itemPull[b].hotkey;
		m.appendChild(A);
	} else m.innerHTML = '&nbsp;';

	d.appendChild(this._rtl ? m : f);
	d.appendChild(j);
	d.appendChild(this._rtl ? f : m);
	d.id = this.itemPull[b].id;
	d.parent = this.itemPull[b].parent;

	if (this.itemPull[b].tip.length > 0) d.title = this.itemPull[b].tip;

	d.onselectstart = function (a) {
		a = a || event;
		return (a.returnValue = !1);
	};
	d.onmouseover = function () {
		a.menuMode == 'web' && window.clearTimeout(a.menuTimeoutHandler);
		a._redistribSubLevelSelection(this.id, this.parent);
	};

	if (a.menuMode == 'web')
		d.onmouseout = function () {
			window.clearTimeout(a.menuTimeoutHandler);
			a.menuTimeoutHandler = window.setTimeout(
				function () {
					a._clearAndHide();
				},
				a.menuTimeoutMsec,
				'JavaScript'
			);
		};

	d.onclick = function (b) {
		let tc;
		let td;

		if (a.checkEvent('onClick') || !a.itemPull[this.id].complex) {
			b = b || event;
			b.cancelBubble = !0;
			b.returnValue = !1;
			tc = a.itemPull[this.id].complex ? 'c' : '-';
			td = a.itemPull[this.id].state == 'enabled' ? '-' : 'd';
			const c = {
				ctrl: b.ctrlKey,
				alt: b.altKey,
				shift: b.shiftKey,
			};
			switch (a.itemPull[this.id].type) {
				case 'checkbox':
					a._checkboxOnClickHandler(this.id.replace(a.idPrefix, ''), tc + td + 'n', c);
					a.hide();
					break;
				case 'radio':
					a._radioOnClickHandler(this.id.replace(a.idPrefix, ''), tc + td + 'n', c);
					break;
				case 'item':
					a._doOnClick(this.id.replace(a.idPrefix, ''), tc + td + 'n', c);
			}
			return !1;
		}
	};
	const p = this.idPull['polygon_' + this.itemPull[b].parent];
	c != null && (c++, c < 0 && (c = 0), c > p.tbd.childNodes.length - 1 && (c = null));
	c != null && p.tbd.childNodes[c] != null
		? p.tbd.insertBefore(d, p.tbd.childNodes[c])
		: p.tbd.appendChild(d);
	this.idPull[d.id] = d;
};
dhtmlXMenuObject.prototype._renderSeparator = function (b, c) {
	const a = this.context
		? 'SubLevelArea'
		: this.itemPull[b].parent == this.idPrefix + this.topId
		? 'TopLevel'
		: 'SubLevelArea';

	if (!(a == 'TopLevel' && this.context)) {
		const d = this;

		if (a != 'TopLevel') {
			var f = document.createElement('TR');
			f.className = 'sub_sep';
			var e = document.createElement('TD');
			e.colSpan = '3';
			f.appendChild(e);
		}

		const g = document.createElement('DIV');
		g.id = 'separator_' + b;
		g.className = a == 'TopLevel' ? 'top_sep' : 'sub_sep';
		g.onselectstart = function (a) {
			a = a || event;
			a.returnValue = !1;
		};
		g.onclick = function (a) {
			a = a || event;
			a.cancelBubble = !0;
			const b = {
				ctrl: a.ctrlKey,
				alt: a.altKey,
				shift: a.shiftKey,
			};
			d._doOnClick(this.id.replace('separator_' + d.idPrefix, ''), '--s', b);
		};

		if (a == 'TopLevel') {
			if (c != null)
				c++,
					c < 0 && (c = 0),
					this.cont.childNodes[c] != null
						? this.cont.insertBefore(g, this.cont.childNodes[c])
						: this.cont.appendChild(g);
			else {
				const h = this.cont.childNodes[this.cont.childNodes.length - 1];
				String(h).search('TopLevel_Text') == -1
					? this.cont.appendChild(g)
					: this.cont.insertBefore(g, h);
			}

			this.idPull[g.id] = g;
		} else {
			const j = this.idPull['polygon_' + this.itemPull[b].parent];
			c != null && (c++, c < 0 && (c = 0), c > j.tbd.childNodes.length - 1 && (c = null));
			c != null && j.tbd.childNodes[c] != null
				? j.tbd.insertBefore(f, j.tbd.childNodes[c])
				: j.tbd.appendChild(f);
			e.appendChild(g);
			this.idPull[g.id] = f;
		}
	}
};
dhtmlXMenuObject.prototype.addNewSeparator = function (b, c) {
	var c = this.idPrefix + (c != null ? c : this._genStr(24));
	const a = this.idPrefix + this.getParentId(b);

	this._addItemIntoGlobalStrorage(c, a, '', 'separator', !1, '', '');
	this._renderSeparator(c, this.getItemPosition(b));
};
dhtmlXMenuObject.prototype.hide = function () {
	this._clearAndHide();
};
dhtmlXMenuObject.prototype.clearAll = function () {
	this.removeItem(this.idPrefix + this.topId, !0);
	this._isInited = !1;
	this.idPrefix = this._genStr(12);
};
dhtmlXMenuObject.prototype.unload = function () {
	_isIE
		? (document.body.detachEvent('onclick', this._bodyClick),
		  document.body.detachEvent('oncontextmenu', this._bodyContext))
		: (window.removeEventListener('click', this._bodyClick, !1),
		  window.removeEventListener('contextmenu', this._bodyContext, !1));
	this._bodyContext = this._bodyClick = null;
	this.removeItem(this.idPrefix + this.topId, !0);
	this.idPull = this.itemPull = null;

	if (this.context) for (const b in this.contextZones) this.removeContextZone(b);

	if (this.cont != null)
		(this.cont.className = ''), this.cont.parentNode.removeChild(this.cont), (this.cont = null);

	if (this.base != null) {
		this.base.className = '';

		if (!this.context) this.base.oncontextmenu = this.base._oldContextMenuHandler || null;

		this.base = this.base.onselectstart = null;
	}

	this.setSkin = null;
	this.detachAllEvents();

	if (this._xmlLoader) this._xmlLoader.destructor(), (this._xmlLoader = null);

	this.extendedModule =
		this.serialize =
		this.addCheckbox =
		this.getCheckboxState =
		this.setCheckboxState =
		this.addRadioButton =
		this.setRadioChecked =
		this.getRadioChecked =
		this.userData =
		this.setOverflowHeight =
		this.contextZones =
		this.getCircuit =
		this.clearHref =
		this.setHref =
		this.setAlign =
		this.setRTL =
		this.setTopText =
		this.setItemSelected =
		this.getHotKey =
		this.setHotKey =
		this.getTooltip =
		this.setTooltip =
		this.setVisibleArea =
		this.getContextMenuHideAllMode =
		this.setContextMenuHideAllMode =
		this.setAutoHideMode =
		this.setAutoShowMode =
		this.clearItemImage =
		this.setItemImage =
		this.getItemImage =
		this.enableDynamicLoading =
		this.setWebModeTimeout =
		this.setOpenMode =
		this.getUserData =
		this.setUserData =
		this.isItemHidden =
		this.showItem =
		this.hideItem =
		this.loadFromHTML =
		this.setItemText =
		this.getItemText =
		this.isItemEnabled =
		this.setItemDisabled =
		this.setItemEnabled =
		this._removeArrow =
		this._checkboxOnClickHandler =
		this._updateCheckboxImage =
		this._readLevel =
		this._setCheckboxState =
		this._getCheckboxState =
		this._radioOnClickHandler =
		this._setRadioState =
		this._getRadioImgObj =
		this._countPolygonItems =
		this._doScrollDown =
		this._doScrollUp =
		this._isArrowExists =
		this._removeDownArrow =
		this._removeUpArrow =
		this._addDownArrow =
		this._addUpArrow =
		this._checkArrowsState =
		this._clearAllSelectedSubItemsInPolygon =
		this._updateLoaderIcon =
		this._changeItemVisible =
		this._changeItemState =
		this.hideContextMenu =
		this.showContextMenu =
		this.hide =
		this.detachAllEvents =
		this.radio =
		this.items =
		this.unload =
		this.dhx_Event =
		this.detachEvent =
		this.eventCatcher =
		this.checkEvent =
		this.callEvent =
		this.attachEvent =
		this.addNewSeparator =
		this.addNewChild =
		this.addNewSibling =
		this.getParentId =
		this.setItemPosition =
		this.getItemPosition =
		this.clearAll =
		this._hideContextMenu =
		this._renderSeparator =
		this._renderSublevelItem =
		this._renderSublevelPolygon =
		this._addSubMenuPolygon =
		this._addItemIntoGlobalStrorage =
		this._autoDetectVisibleArea =
		this._doOnContextBeforeCall =
		this._showContextMenu =
		this._isContextMenuVisible =
		this.isContextZone =
		this.removeContextZone =
		this.addContextZone =
		this.renderAsContextMenu =
		this._getAllParents =
		this.removeItem =
		this._updateItemImage =
		this.setIconPath =
		this.setIconsPath =
		this.setImagePath =
		this._renderToplevelItem =
		this._initTopLevelMenu =
		this._redistribTopLevelSelection =
		this._getItemLevelType =
		this._updateItemComplexState =
		this._redefineComplexState =
		this._countVisiblePolygonItems =
		this._hideSubLevelItem =
		this._showSubLevelItem =
		this._xmlParser =
		this._buildMenu =
		this.loadXMLString =
		this.loadXML =
		this.init =
		this.forEachItem =
		this.getItemType =
		this._doOnLoad =
		this._clearAndHide =
		this._genStr =
		this._getMenuNodes =
		this._searchMenuNode =
		this._doOnTouchMenu =
		this._doOnClick =
		this._redistribSubLevelSelection =
		this._showPolygon =
		this._hidePolygon =
		this._getSubItemToDeselectByPolygon =
		this._removeSubItemFromSelected =
		this._addSubItemToSelected =
		this._openedPolygons =
		this._selectedSubItems =
		this._enableDacSupport =
		this.zIndStep =
		this.zIndInit =
		this.zInd =
		this.dacSpeedIE =
		this.dacSpeed =
		this.dacCyclesIE =
		this.dacCycles =
		this.topId =
		this.skin =
		this.userDataTagName =
		this.itemTipTagName =
		this.itemTextTagName =
		this.itemTagName =
		this.itemHrefTagName =
		this.itemHotKeyTagName =
		this.isDhtmlxMenuObject =
		this.menuTouched =
		this.menuTimeoutMsec =
		this.menuTimeoutHandler =
		this.menuModeTopLevelTimeoutTime =
		this.menuModeTopLevelTimeout =
		this.menuMode =
		this.imagePath =
		this.idPrefix =
		this.menuLastClicked =
		this.menuSelected =
		this.limit =
		this.dirTopLevel =
		this.dirSubLevel =
		this.fixedPosition =
		this.loaderIcon =
		this.dLoadUrl =
		this.dLoadSign =
		this.dLoad =
		this.contextMenuZoneId =
		this.contextHideAllMode =
		this.contextAutoShow =
		this.contextAutoHide =
		this.context =
		this.addBaseIdAsContextZone =
		this._topLevelRightMargin =
		this._topLevelBottomMargin =
		this._topLevelOffsetLeft =
		this._topLevelBottomMargin =
		this._scrollUpTMTime =
		this._scrollUpTMStep =
		this._scrollDownTMTime =
		this._scrollDownTMStep =
		this._rtl =
		this._isInited =
		this._isIE6 =
		this._arrowFFFix =
		this._align =
			null;
	dhtmlxMenuObjectLiveInstances[this._UID] = null;
	try {
		delete dhtmlxMenuObjectLiveInstances[this._UID];
	} catch (c) {}
	this._UID = null;
};
var dhtmlxMenuObjectLiveInstances = {};
dhtmlXMenuObject.prototype.i18n = {
	dhxmenuextalert: 'dhtmlxmenu_ext.js required',
};

/*
 Copyright DHTMLX LTD. http://www.dhtmlx.com
 You allowed to use this component or parts of it under GPL terms
 To use it on other terms or get Professional edition of the component please contact us at sales@dhtmlx.com
 */
dhtmlXMenuObject.prototype.extendedModule = 'DHXMENUEXT';
dhtmlXMenuObject.prototype.setItemEnabled = function (a) {
	this._changeItemState(a, 'enabled', this._getItemLevelType(a));
};
dhtmlXMenuObject.prototype.setItemDisabled = function (a) {
	this._changeItemState(a, 'disabled', this._getItemLevelType(a));
};
dhtmlXMenuObject.prototype.isItemEnabled = function (a) {
	return this.itemPull[this.idPrefix + a] != null
		? this.itemPull[this.idPrefix + a].state == 'enabled'
		: !1;
};
dhtmlXMenuObject.prototype._changeItemState = function (a, c, b) {
	var d = !1,
		e = this.idPrefix + a;
	if (this.itemPull[e] != null && this.idPull[e] != null && this.itemPull[e].state != c)
		(this.itemPull[e].state = c),
			(this.idPull[e].className =
				this.itemPull[e].parent == this.idPrefix + this.topId && !this.context
					? 'dhtmlxMenu_' +
					  this.skin +
					  '_TopLevel_Item_' +
					  (this.itemPull[e].state == 'enabled' ? 'Normal' : 'Disabled')
					: 'sub_item' + (this.itemPull[e].state == 'enabled' ? '' : '_dis')),
			this._updateItemComplexState(this.idPrefix + a, this.itemPull[this.idPrefix + a].complex, !1),
			this._updateItemImage(a, b),
			this.idPrefix + this.menuLastClicked == e &&
				b != 'TopLevel' &&
				this._redistribSubLevelSelection(e, this.itemPull[e].parent);
	return d;
};
dhtmlXMenuObject.prototype.getItemText = function (a) {
	return this.itemPull[this.idPrefix + a] != null ? this.itemPull[this.idPrefix + a].title : '';
};
dhtmlXMenuObject.prototype.setItemText = function (a, c) {
	a = this.idPrefix + a;
	if (this.itemPull[a] != null && this.idPull[a] != null)
		if (
			(this._clearAndHide(),
			(this.itemPull[a].title = c),
			this.itemPull[a].parent == this.idPrefix + this.topId && !this.context)
		) {
			for (var b = null, d = 0; d < this.idPull[a].childNodes.length; d++)
				try {
					this.idPull[a].childNodes[d].className == 'top_level_text' &&
						(b = this.idPull[a].childNodes[d]);
				} catch (e) {}
			if (String(this.itemPull[a].title).length == '' || this.itemPull[a].title == null)
				b != null && b.parentNode.removeChild(b);
			else {
				if (!b)
					(b = document.createElement('DIV')),
						(b.className = 'top_level_text'),
						this._rtl && this.idPull[a].childNodes.length > 0
							? this.idPull[a].insertBefore(b, this.idPull[a].childNodes[0])
							: this.idPull[a].appendChild(b);
				b.innerHTML = this.itemPull[a].title;
			}
		} else {
			b = null;
			for (d = 0; d < this.idPull[a].childNodes[1].childNodes.length; d++)
				if (String(this.idPull[a].childNodes[1].childNodes[d].className || '') == 'sub_item_text')
					b = this.idPull[a].childNodes[1].childNodes[d];
			if (String(this.itemPull[a].title).length == '' || this.itemPull[a].title == null) {
				if (b)
					b.parentNode.removeChild(b),
						(b = null),
						(this.idPull[a].childNodes[1].innerHTML = '&nbsp;');
			} else {
				if (!b)
					(b = document.createElement('DIV')),
						(b.className = 'sub_item_text'),
						(this.idPull[a].childNodes[1].innerHTML = ''),
						this.idPull[a].childNodes[1].appendChild(b);
				b.innerHTML = this.itemPull[a].title;
			}
		}
};
dhtmlXMenuObject.prototype.loadFromHTML = function (a, c, b) {
	this.itemTagName = 'DIV';
	typeof a == 'string' && (a = document.getElementById(a));
	this._buildMenu(a, null);
	this.init();
	c && a.parentNode.removeChild(a);
	b != null && b();
};
dhtmlXMenuObject.prototype.hideItem = function (a) {
	this._changeItemVisible(a, !1);
};
dhtmlXMenuObject.prototype.showItem = function (a) {
	this._changeItemVisible(a, !0);
};
dhtmlXMenuObject.prototype.isItemHidden = function (a) {
	var c = null;
	this.idPull[this.idPrefix + a] != null &&
		(c = this.idPull[this.idPrefix + a].style.display == 'none');
	return c;
};
dhtmlXMenuObject.prototype._changeItemVisible = function (a, c) {
	var b = this.idPrefix + a;
	if (
		this.itemPull[b] != null &&
		(this.itemPull[b].type == 'separator' && (b = 'separator_' + b), this.idPull[b] != null)
	)
		(this.idPull[b].style.display = c ? '' : 'none'),
			this._redefineComplexState(this.itemPull[this.idPrefix + a].parent);
};
dhtmlXMenuObject.prototype.setUserData = function (a, c, b) {
	this.userData[this.idPrefix + a + '_' + c] = b;
};
dhtmlXMenuObject.prototype.getUserData = function (a, c) {
	return this.userData[this.idPrefix + a + '_' + c] != null
		? this.userData[this.idPrefix + a + '_' + c]
		: null;
};
dhtmlXMenuObject.prototype.setOpenMode = function (a) {
	if (a == 'win' || a == 'web') this.menuMode = a;
};
dhtmlXMenuObject.prototype.setWebModeTimeout = function (a) {
	this.menuTimeoutMsec = !isNaN(a) ? a : 400;
};
dhtmlXMenuObject.prototype.enableDynamicLoading = function (a, c) {
	this.dLoad = !0;
	this.dLoadUrl = a;
	this.dLoadSign = String(this.dLoadUrl).search(/\?/) == -1 ? '?' : '&';
	this.loaderIcon = c;
	this.init();
};
dhtmlXMenuObject.prototype._updateLoaderIcon = function (a, c) {
	if (this.idPull[a] != null && !(String(this.idPull[a].className).search('TopLevel_Item') >= 0)) {
		var b = this._rtl ? 0 : 2;
		if (this.idPull[a].childNodes[b] && this.idPull[a].childNodes[b].childNodes[0]) {
			var d = this.idPull[a].childNodes[b].childNodes[0];
			if (String(d.className).search('complex_arrow') === 0)
				d.className = 'complex_arrow' + (c ? '_loading' : '');
		}
	}
};
dhtmlXMenuObject.prototype.getItemImage = function (a) {
	var c = [null, null],
		a = this.idPrefix + a;
	if (this.itemPull[a].type == 'item')
		(c[0] = this.itemPull[a].imgen), (c[1] = this.itemPull[a].imgdis);
	return c;
};
dhtmlXMenuObject.prototype.setItemImage = function (a, c, b) {
	if (this.itemPull[this.idPrefix + a].type == 'item')
		(this.itemPull[this.idPrefix + a].imgen = c),
			(this.itemPull[this.idPrefix + a].imgdis = b),
			this._updateItemImage(a, this._getItemLevelType(a));
};
dhtmlXMenuObject.prototype.clearItemImage = function (a) {
	this.setItemImage(a, '', '');
};
dhtmlXMenuObject.prototype.setAutoShowMode = function (a) {
	this.contextAutoShow = a == !0 ? !0 : !1;
};
dhtmlXMenuObject.prototype.setAutoHideMode = function (a) {
	this.contextAutoHide = a == !0 ? !0 : !1;
};
dhtmlXMenuObject.prototype.setContextMenuHideAllMode = function (a) {
	this.contextHideAllMode = a == !0 ? !0 : !1;
};
dhtmlXMenuObject.prototype.getContextMenuHideAllMode = function () {
	return this.contextHideAllMode;
};
dhtmlXMenuObject.prototype.setVisibleArea = function (a, c, b, d) {
	this._isVisibleArea = !0;
	this.menuX1 = a;
	this.menuX2 = c;
	this.menuY1 = b;
	this.menuY2 = d;
};
dhtmlXMenuObject.prototype.setTooltip = function (a, c) {
	a = this.idPrefix + a;
	if (this.itemPull[a] != null && this.idPull[a] != null)
		(this.idPull[a].title = c.length > 0 ? c : null), (this.itemPull[a].tip = c);
};
dhtmlXMenuObject.prototype.getTooltip = function (a) {
	return this.itemPull[this.idPrefix + a] == null ? null : this.itemPull[this.idPrefix + a].tip;
};
dhtmlXMenuObject.prototype.setHotKey = function (a, c) {
	a = this.idPrefix + a;
	if (
		this.itemPull[a] != null &&
		this.idPull[a] != null &&
		(this.itemPull[a].parent != this.idPrefix + this.topId || this.context) &&
		!this.itemPull[a].complex
	) {
		var b = this.itemPull[a].type;
		if (b == 'item' || b == 'checkbox' || b == 'radio') {
			var d = null;
			try {
				if (this.idPull[a].childNodes[this._rtl ? 0 : 2].childNodes[0].className == 'sub_item_hk')
					d = this.idPull[a].childNodes[this._rtl ? 0 : 2].childNodes[0];
			} catch (e) {}
			if (c.length == 0)
				(this.itemPull[a].hotkey_backup = this.itemPull[a].hotkey),
					(this.itemPull[a].hotkey = ''),
					d != null && d.parentNode.removeChild(d);
			else {
				this.itemPull[a].hotkey = c;
				this.itemPull[a].hotkey_backup = null;
				if (d == null) {
					d = document.createElement('DIV');
					d.className = 'sub_item_hk';
					for (var f = this.idPull[a].childNodes[this._rtl ? 0 : 2]; f.childNodes.length > 0; )
						f.removeChild(f.childNodes[0]);
					f.appendChild(d);
				}
				d.innerHTML = c;
			}
		}
	}
};
dhtmlXMenuObject.prototype.getHotKey = function (a) {
	return this.itemPull[this.idPrefix + a] == null ? null : this.itemPull[this.idPrefix + a].hotkey;
};
dhtmlXMenuObject.prototype.setItemSelected = function (a) {
	if (this.itemPull[this.idPrefix + a] == null) return null;
};
dhtmlXMenuObject.prototype.setTopText = function (a) {
	if (!this.context) {
		if (this._topText == null)
			(this._topText = document.createElement('DIV')),
				(this._topText.className =
					'dhtmlxMenu_TopLevel_Text_' +
					(this._rtl ? 'left' : this._align == 'left' ? 'right' : 'left')),
				this.base.appendChild(this._topText);
		this._topText.innerHTML = a;
	}
};
dhtmlXMenuObject.prototype.setAlign = function (a) {
	if (this._align != a && (a == 'left' || a == 'right')) {
		this._align = a;
		if (this.cont) this.cont.className = this._align == 'right' ? 'align_right' : 'align_left';
		if (this._topText != null)
			this._topText.className =
				'dhtmlxMenu_TopLevel_Text_' + (this._align == 'left' ? 'right' : 'left');
	}
};
dhtmlXMenuObject.prototype.setHref = function (a, c, b) {
	if (this.itemPull[this.idPrefix + a] != null)
		(this.itemPull[this.idPrefix + a].href_link = c),
			b != null && (this.itemPull[this.idPrefix + a].href_target = b);
};
dhtmlXMenuObject.prototype.clearHref = function (a) {
	this.itemPull[this.idPrefix + a] != null &&
		(delete this.itemPull[this.idPrefix + a].href_link,
		delete this.itemPull[this.idPrefix + a].href_target);
};
dhtmlXMenuObject.prototype.getCircuit = function (a) {
	for (var c = Array(a); this.getParentId(a) != this.topId; )
		(a = this.getParentId(a)), (c[c.length] = a);
	return c.reverse();
};
dhtmlXMenuObject.prototype._clearAllSelectedSubItemsInPolygon = function (a) {
	for (var c = this._getSubItemToDeselectByPolygon(a), b = 0; b < this._openedPolygons.length; b++)
		this._openedPolygons[b] != a && this._hidePolygon(this._openedPolygons[b]);
	for (b = 0; b < c.length; b++)
		if (this.idPull[c[b]] != null && this.itemPull[c[b]].state == 'enabled')
			this.idPull[c[b]].className = 'dhtmlxMenu_' + this.skin + '_SubLevelArea_Item_Normal';
};
dhtmlXMenuObject.prototype._checkArrowsState = function (a) {
	var c = this.idPull['polygon_' + a],
		b = this.idPull['arrowup_' + a],
		d = this.idPull['arrowdown_' + a];
	b.className =
		c.scrollTop == 0
			? 'dhtmlxMenu_' + this.skin + '_SubLevelArea_ArrowUp_Disabled'
			: 'dhtmlxMenu_' + this.skin + '_SubLevelArea_ArrowUp' + (b.over ? '_Over' : '');
	d.className =
		c.scrollTop + c.offsetHeight < c.scrollHeight
			? 'dhtmlxMenu_' + this.skin + '_SubLevelArea_ArrowDown' + (d.over ? '_Over' : '')
			: 'dhtmlxMenu_' + this.skin + '_SubLevelArea_ArrowDown_Disabled';
};
dhtmlXMenuObject.prototype._addUpArrow = function (a) {
	var c = this,
		b = document.createElement('DIV');
	b.pId = this.idPrefix + a;
	b.id = 'arrowup_' + this.idPrefix + a;
	b.className = 'dhtmlxMenu_' + this.skin + '_SubLevelArea_ArrowUp';
	b.innerHTML =
		"<div class='dhtmlxMenu_" +
		this.skin +
		"_SubLevelArea_Arrow'><div class='dhtmlxMenu_SubLevelArea_Arrow_Icon'></div></div>";
	b.style.display = 'none';
	b.over = !1;
	b.onselectstart = function (a) {
		a = a || event;
		return (a.returnValue = !1);
	};
	b.oncontextmenu = function (a) {
		a = a || event;
		return (a.returnValue = !1);
	};
	b.onmouseover = function () {
		c.menuMode == 'web' && window.clearTimeout(c.menuTimeoutHandler);
		c._clearAllSelectedSubItemsInPolygon(this.pId);
		if (this.className != 'dhtmlxMenu_' + c.skin + '_SubLevelArea_ArrowUp_Disabled')
			(this.className = 'dhtmlxMenu_' + c.skin + '_SubLevelArea_ArrowUp_Over'),
				(this.over = !0),
				(c._canScrollUp = !0),
				c._doScrollUp(this.pId, !0);
	};
	b.onmouseout = function () {
		if (c.menuMode == 'web')
			window.clearTimeout(c.menuTimeoutHandler),
				(c.menuTimeoutHandler = window.setTimeout(
					function () {
						c._clearAndHide();
					},
					c.menuTimeoutMsec,
					'JavaScript'
				));
		this.over = !1;
		c._canScrollUp = !1;
		if (this.className != 'dhtmlxMenu_' + c.skin + '_SubLevelArea_ArrowUp_Disabled')
			(this.className = 'dhtmlxMenu_' + c.skin + '_SubLevelArea_ArrowUp'),
				window.clearTimeout(c._scrollUpTM);
	};
	b.onclick = function (a) {
		a = a || event;
		a.returnValue = !1;
		a.cancelBubble = !0;
		return !1;
	};
	document.body.insertBefore(b, document.body.firstChild);
	this.idPull[b.id] = b;
};
dhtmlXMenuObject.prototype._addDownArrow = function (a) {
	var c = this,
		b = document.createElement('DIV');
	b.pId = this.idPrefix + a;
	b.id = 'arrowdown_' + this.idPrefix + a;
	b.className = 'dhtmlxMenu_' + this.skin + '_SubLevelArea_ArrowDown';
	b.innerHTML =
		"<div class='dhtmlxMenu_" +
		this.skin +
		"_SubLevelArea_Arrow'><div class='dhtmlxMenu_SubLevelArea_Arrow_Icon'></div></div>";
	b.style.display = 'none';
	b.over = !1;
	b.onselectstart = function (a) {
		a = a || event;
		return (a.returnValue = !1);
	};
	b.oncontextmenu = function (a) {
		a = a || event;
		return (a.returnValue = !1);
	};
	b.onmouseover = function () {
		c.menuMode == 'web' && window.clearTimeout(c.menuTimeoutHandler);
		c._clearAllSelectedSubItemsInPolygon(this.pId);
		if (this.className != 'dhtmlxMenu_' + c.skin + '_SubLevelArea_ArrowDown_Disabled')
			(this.className = 'dhtmlxMenu_' + c.skin + '_SubLevelArea_ArrowDown_Over'),
				(this.over = !0),
				(c._canScrollDown = !0),
				c._doScrollDown(this.pId, !0);
	};
	b.onmouseout = function () {
		if (c.menuMode == 'web')
			window.clearTimeout(c.menuTimeoutHandler),
				(c.menuTimeoutHandler = window.setTimeout(
					function () {
						c._clearAndHide();
					},
					c.menuTimeoutMsec,
					'JavaScript'
				));
		this.over = !1;
		c._canScrollDown = !1;
		if (this.className != 'dhtmlxMenu_' + c.skin + '_SubLevelArea_ArrowDown_Disabled')
			(this.className = 'dhtmlxMenu_' + c.skin + '_SubLevelArea_ArrowDown'),
				window.clearTimeout(c._scrollDownTM);
	};
	b.onclick = function (a) {
		a = a || event;
		a.returnValue = !1;
		a.cancelBubble = !0;
		return !1;
	};
	document.body.insertBefore(b, document.body.firstChild);
	this.idPull[b.id] = b;
};
dhtmlXMenuObject.prototype._removeUpArrow = function (a) {
	var c = 'arrowup_' + this.idPrefix + a;
	this._removeArrow(c);
};
dhtmlXMenuObject.prototype._removeDownArrow = function (a) {
	var c = 'arrowdown_' + this.idPrefix + a;
	this._removeArrow(c);
};
dhtmlXMenuObject.prototype._removeArrow = function (a) {
	var c = this.idPull[a];
	c.onselectstart = null;
	c.oncontextmenu = null;
	c.onmouseover = null;
	c.onmouseout = null;
	c.onclick = null;
	c.parentNode && c.parentNode.removeChild(c);
	c = null;
	this.idPull[a] = null;
	try {
		delete this.idPull[a];
	} catch (b) {}
};
dhtmlXMenuObject.prototype._isArrowExists = function (a) {
	return this.idPull['arrowup_' + a] != null && this.idPull['arrowdown_' + a] != null ? !0 : !1;
};
dhtmlXMenuObject.prototype._doScrollUp = function (a, c) {
	var b = this.idPull['polygon_' + a];
	if (this._canScrollUp && b.scrollTop > 0) {
		var d = !1,
			e = b.scrollTop - this._scrollUpTMStep;
		e < 0 && ((d = !0), (e = 0));
		b.scrollTop = e;
		if (!d) {
			var f = this;
			this._scrollUpTM = window.setTimeout(function () {
				f._doScrollUp(a, !1);
			}, this._scrollUpTMTime);
		}
	} else (this._canScrollUp = !1), this._checkArrowsState(a);
	c && this._checkArrowsState(a);
};
dhtmlXMenuObject.prototype._doScrollDown = function (a, c) {
	var b = this.idPull['polygon_' + a];
	if (this._canScrollDown && b.scrollTop + b.offsetHeight <= b.scrollHeight) {
		var d = !1,
			e = b.scrollTop + this._scrollDownTMStep;
		e + b.offsetHeight > b.scollHeight && ((d = !0), (e = b.scollHeight - b.offsetHeight));
		b.scrollTop = e;
		if (!d) {
			var f = this;
			this._scrollDownTM = window.setTimeout(function () {
				f._doScrollDown(a, !1);
			}, this._scrollDownTMTime);
		}
	} else this._checkArrowsState(a);
	c && this._checkArrowsState(a);
};
dhtmlXMenuObject.prototype._countPolygonItems = function (a) {
	var c = 0,
		b;
	for (b in this.itemPull) {
		var d = this.itemPull[b].parent,
			e = this.itemPull[b].type;
		d == this.idPrefix + a && (e == 'item' || e == 'radio' || e == 'checkbox') && c++;
	}
	return c;
};
dhtmlXMenuObject.prototype.setOverflowHeight = function (a) {
	if (!(this.limit == 0 && a <= 0))
		if ((this._clearAndHide(), this.limit >= 0 && a > 0)) this.limit = a;
		else if (this.limit > 0 && a <= 0) {
			for (var c in this.itemPull)
				if (this._isArrowExists(c)) {
					var b = String(c).replace(this.idPrefix, '');
					this._removeUpArrow(b);
					this._removeDownArrow(b);
					this.idPull['polygon_' + c].style.height = '';
				}
			this.limit = 0;
		}
};
dhtmlXMenuObject.prototype._getRadioImgObj = function (a) {
	try {
		var c = this.idPull[this.idPrefix + a].childNodes[this._rtl ? 2 : 0].childNodes[0];
	} catch (b) {
		c = null;
	}
	return c;
};
dhtmlXMenuObject.prototype._setRadioState = function (a, c) {
	var b = this._getRadioImgObj(a);
	if (b != null) {
		var d = this.itemPull[this.idPrefix + a];
		d.checked = c;
		d.imgen = 'rdbt_' + (d.checked ? '1' : '0');
		d.imgdis = d.imgen;
		b.className = 'sub_icon ' + d.imgen;
	}
};
dhtmlXMenuObject.prototype._radioOnClickHandler = function (a, c, b) {
	if (!(c.charAt(1) == 'd' || this.itemPull[this.idPrefix + a].group == null)) {
		var d = this.itemPull[this.idPrefix + a].group;
		this.checkEvent('onRadioClick')
			? this.callEvent('onRadioClick', [
					d,
					this.getRadioChecked(d),
					a,
					this.contextMenuZoneId,
					b,
			  ]) && this.setRadioChecked(d, a)
			: this.setRadioChecked(d, a);
		this.checkEvent('onClick') && this.callEvent('onClick', [a]);
	}
};
dhtmlXMenuObject.prototype.getRadioChecked = function (a) {
	for (var c = null, b = 0; b < this.radio[a].length; b++) {
		var d = this.radio[a][b].replace(this.idPrefix, ''),
			e = this._getRadioImgObj(d);
		if (e != null) {
			var f = e.className.match(/rdbt_1$/gi);
			f != null && (c = d);
		}
	}
	return c;
};
dhtmlXMenuObject.prototype.setRadioChecked = function (a, c) {
	if (this.radio[a] != null)
		for (var b = 0; b < this.radio[a].length; b++) {
			var d = this.radio[a][b].replace(this.idPrefix, '');
			this._setRadioState(d, d == c);
		}
};
dhtmlXMenuObject.prototype.addRadioButton = function (a, c, b, d, e, f, k, i) {
	if (!(this.context && c == this.topId)) {
		if (this.itemPull[this.idPrefix + c] == null) return;
		if (a == 'child' && this.itemPull[this.idPrefix + c].type != 'item') return;
	}
	var h = this.idPrefix + (d != null ? d : this._genStr(24)),
		g = 'rdbt_' + (k ? '1' : '0'),
		j = g;
	if (a == 'sibling') {
		var l = this.idPrefix + this.getParentId(c);
		this._addItemIntoGlobalStrorage(h, l, e, 'radio', i, g, j);
		this._renderSublevelItem(h, this.getItemPosition(c));
	} else
		(l = this.idPrefix + c),
			this._addItemIntoGlobalStrorage(h, l, e, 'radio', i, g, j),
			this.idPull['polygon_' + l] == null && this._renderSublevelPolygon(l, l),
			this._renderSublevelItem(h, b - 1),
			this._redefineComplexState(l);
	var m = f != null ? f : this._genStr(24);
	this.itemPull[h].group = m;
	this.radio[m] == null && (this.radio[m] = []);
	this.radio[m][this.radio[m].length] = h;
	k == !0 && this.setRadioChecked(m, String(h).replace(this.idPrefix, ''));
};
dhtmlXMenuObject.prototype._getCheckboxState = function (a) {
	return this.itemPull[this.idPrefix + a] == null ? null : this.itemPull[this.idPrefix + a].checked;
};
dhtmlXMenuObject.prototype._setCheckboxState = function (a, c) {
	this.itemPull[this.idPrefix + a] != null && (this.itemPull[this.idPrefix + a].checked = c);
};
dhtmlXMenuObject.prototype._updateCheckboxImage = function (a) {
	if (this.idPull[this.idPrefix + a] != null) {
		this.itemPull[this.idPrefix + a].imgen = 'chbx_' + (this._getCheckboxState(a) ? '1' : '0');
		this.itemPull[this.idPrefix + a].imgdis = this.itemPull[this.idPrefix + a].imgen;
		try {
			this.idPull[this.idPrefix + a].childNodes[this._rtl ? 2 : 0].childNodes[0].className =
				'sub_icon ' + this.itemPull[this.idPrefix + a].imgen;
		} catch (c) {}
	}
};
dhtmlXMenuObject.prototype._checkboxOnClickHandler = function (a, c, b) {
	if (c.charAt(1) != 'd' && this.itemPull[this.idPrefix + a] != null) {
		var d = this._getCheckboxState(a);
		this.checkEvent('onCheckboxClick')
			? this.callEvent('onCheckboxClick', [a, d, this.contextMenuZoneId, b]) &&
			  this.setCheckboxState(a, !d)
			: this.setCheckboxState(a, !d);
		this.checkEvent('onClick') && this.callEvent('onClick', [a, this.contextMenuZoneId]);
	}
};
dhtmlXMenuObject.prototype.setCheckboxState = function (a, c) {
	this._setCheckboxState(a, c);
	this._updateCheckboxImage(a);
};
dhtmlXMenuObject.prototype.getCheckboxState = function (a) {
	return this._getCheckboxState(a);
};
dhtmlXMenuObject.prototype.addCheckbox = function (a, c, b, d, e, f, k) {
	if (!(this.context && c == this.topId)) {
		if (this.itemPull[this.idPrefix + c] == null) return;
		if (a == 'child' && this.itemPull[this.idPrefix + c].type != 'item') return;
	}
	var i = 'chbx_' + (f ? '1' : '0'),
		h = i;
	if (a == 'sibling') {
		var g = this.idPrefix + (d != null ? d : this._genStr(24)),
			j = this.idPrefix + this.getParentId(c);
		this._addItemIntoGlobalStrorage(g, j, e, 'checkbox', k, i, h);
		this.itemPull[g].checked = f;
		this._renderSublevelItem(g, this.getItemPosition(c));
	} else
		(g = this.idPrefix + (d != null ? d : this._genStr(24))),
			(j = this.idPrefix + c),
			this._addItemIntoGlobalStrorage(g, j, e, 'checkbox', k, i, h),
			(this.itemPull[g].checked = f),
			this.idPull['polygon_' + j] == null && this._renderSublevelPolygon(j, j),
			this._renderSublevelItem(g, b - 1),
			this._redefineComplexState(j);
};
dhtmlXMenuObject.prototype._readLevel = function (a) {
	var c = '',
		b;
	for (b in this.itemPull)
		if (this.itemPull[b].parent == a) {
			var d = '',
				e = '',
				f = '',
				k = String(this.itemPull[b].id).replace(this.idPrefix, ''),
				i = '',
				h = this.itemPull[b].title != '' ? ' text="' + this.itemPull[b].title + '"' : '',
				g = '';
			this.itemPull[b].type == 'item' &&
				(this.itemPull[b].imgen != '' && (d = ' img="' + this.itemPull[b].imgen + '"'),
				this.itemPull[b].imgdis != '' && (e = ' imgdis="' + this.itemPull[b].imgdis + '"'),
				this.itemPull[b].hotkey != '' && (f = '<hotkey>' + this.itemPull[b].hotkey + '</hotkey>'));
			this.itemPull[b].type == 'separator'
				? (i = ' type="separator"')
				: this.itemPull[b].state == 'disabled' && (g = ' enabled="false"');
			this.itemPull[b].type == 'checkbox' &&
				(i = ' type="checkbox"' + (this.itemPull[b].checked ? ' checked="true"' : ''));
			this.itemPull[b].type == 'radio' &&
				(i =
					' type="radio" group="' +
					this.itemPull[b].group +
					'" ' +
					(this.itemPull[b].checked ? ' checked="true"' : ''));
			c += "<item id='" + k + "'" + h + i + d + e + g + '>';
			c += f;
			this.itemPull[b].complex && (c += this._readLevel(b));
			c += '</item>';
		}
	return c;
};
dhtmlXMenuObject.prototype.serialize = function () {
	var a = '<menu>' + this._readLevel(this.idPrefix + this.topId) + '</menu>';
	return a;
};

(function () {
	dhtmlx.extend_api(
		'dhtmlXMenuObject',
		{
			_init: function (b) {
				return [b.parent, b.skin];
			},
			align: 'setAlign',
			top_text: 'setTopText',
			context: 'renderAsContextMenu',
			icon_path: 'setIconsPath',
			open_mode: 'setOpenMode',
			rtl: 'setRTL',
			skin: 'setSkin',
			dynamic: 'enableDynamicLoading',
			xml: 'loadXML',
			items: 'items',
			overflow: 'setOverflowHeight',
		},
		{
			items: function (b, c) {
				for (let a = 1e5, d = null, f = 0; f < b.length; f++) {
					const e = b[f];
					e.type == 'separator'
						? (this.addNewSeparator(d, a, e.id), (d = e.id))
						: (this.addNewChild(c, a, e.id, e.text, e.disabled, e.img, e.img_disabled),
						  (d = e.id),
						  e.items && this.items(e.items, e.id));
				}
			},
		}
	);
})();
