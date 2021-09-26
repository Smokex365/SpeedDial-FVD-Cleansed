//v.3.0 build 110707

/*
 Copyright DHTMLX LTD. http://www.dhtmlx.com
 You allowed to use this component or parts of it under GPL terms
 To use it on other terms or get Professional edition of the component please contact us at sales@dhtmlx.com
 */
function dhtmlXMenuObject(b, c){
    var a = this;
    this.addBaseIdAsContextZone = null;
    this.isDhtmlxMenuObject = !0;
    this.skin = c != null ? c : "dhx_skyblue";
    this.imagePath = "";
    this._isIE6 = !1;
    if (_isIE) 
        this._isIE6 = window.XMLHttpRequest == null ? !0 : !1;
    if (b == null) 
        this.base = document.body;
    else {
        var d = typeof b == "string" ? document.getElementById(b) : b;
        if (d != null) {
            this.base = d;
            if (!this.base.id) 
                this.base.id = (new Date).valueOf();
            for (; this.base.childNodes.length > 0;) 
                this.base.removeChild(this.base.childNodes[0]);
            this.base.className += " dhtmlxMenu_" +
            this.skin +
            "_Middle dir_left";
            this.base._autoSkinUpdate = !0;
            if (this.base.oncontextmenu) 
                this.base._oldContextMenuHandler = this.base.oncontextmenu;
            this.addBaseIdAsContextZone = this.base.id;
            this.base.onselectstart = function(a){
                a = a || event;
                return a.returnValue = !1
            };
            this.base.oncontextmenu = function(a){
                a = a || event;
                return a.returnValue = !1
            }
        }
        else 
            this.base = document.body
    }
    this.topId = "dhxWebMenuTopId";
    if (!this.extendedModule) {
        for (var f = function(){
            alert(this.i18n.dhxmenuextalert)
        }, e = "setItemEnabled,setItemDisabled,isItemEnabled,_changeItemState,getItemText,setItemText,loadFromHTML,hideItem,showItem,isItemHidden,_changeItemVisible,setUserData,getUserData,setOpenMode,setWebModeTimeout,enableDynamicLoading,_updateLoaderIcon,getItemImage,setItemImage,clearItemImage,setAutoShowMode,setAutoHideMode,setContextMenuHideAllMode,getContextMenuHideAllMode,setVisibleArea,setTooltip,getTooltip,setHotKey,getHotKey,setItemSelected,setTopText,setRTL,setAlign,setHref,clearHref,getCircuit,_clearAllSelectedSubItemsInPolygon,_checkArrowsState,_addUpArrow,_addDownArrow,_removeUpArrow,_removeDownArrow,_isArrowExists,_doScrollUp,_doScrollDown,_countPolygonItems,setOverflowHeight,_getRadioImgObj,_setRadioState,_radioOnClickHandler,getRadioChecked,setRadioChecked,addRadioButton,_getCheckboxState,_setCheckboxState,_readLevel,_updateCheckboxImage,_checkboxOnClickHandler,setCheckboxState,getCheckboxState,addCheckbox,serialize".split(","), g = 0; g < e.length; g++) 
            this[e[g]] || (this[e[g]] = f);
        e = null
    }
    this.fixedPosition = !1;
    this.menuLastClicked = this.menuSelected = -1;
    this.idPrefix = "";
    this.itemTagName = "item";
    this.itemTextTagName = "itemtext";
    this.userDataTagName = "userdata";
    this.itemTipTagName = "tooltip";
    this.itemHotKeyTagName = "hotkey";
    this.itemHrefTagName = "href";
    this.dirTopLevel = "bottom";
    this.dirSubLevel = "right";
    this.menuY2 = this.menuY1 = this.menuX2 = this.menuX1 = null;
    this.menuMode = "web";
    this.menuTimeoutMsec = 400;
    this.menuTimeoutHandler = null;
    this.idPull = {};
    this.itemPull = {};
    this.userData = {};
    this.radio = {};
    this._rtl = !1;
    this._align = "left";
    this.menuTouched = !1;
    this.zInd = this.zIndInit = 3001;
    this.zIndStep = 50;
    this.menuModeTopLevelTimeout = !0;
    this.menuModeTopLevelTimeoutTime = 200;
    this._topLevelBottomMargin = 1;
    this._topLevelRightMargin = 0;
    this._topLevelOffsetLeft = 1;
    this._arrowFFFix = _isIE ? document.compatMode == "BackCompat" ? 0 : -4 : -4;
    this.setSkin = function(a){
        var b = this.skin;
        this.skin = a;
        switch (this.skin) {
            case "dhx_black":
            case "dhx_blue":
            case "dhx_skyblue":
            case "dhx_web":
                this._topLevelBottomMargin = 2;
                this._topLevelOffsetLeft = this._topLevelRightMargin = 1;
                this._arrowFFFix = _isIE ? document.compatMode == "BackCompat" ? 0 : -4 : -4;
                break;
            case "dhx_web":
                this._arrowFFFix = 0
        }
        if (this.base._autoSkinUpdate) 
            this.base.className = this.base.className.replace("dhtmlxMenu_" + b + "_Middle", "") + " dhtmlxMenu_" + this.skin + "_Middle";
        for (var c in this.idPull) 
            this.idPull[c].className = String(this.idPull[c].className).replace(b, this.skin)
    };
    this.setSkin(this.skin);
    this.dLoad = !1;
    this.dLoadUrl = "";
    this.dLoadSign = "?";
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
    for (g = 0; g < 10; g++) 
        this.dacCycles[g] = g;
    this.dacSpeedIE = 10;
    this.dacCyclesIE = [];
    for (g = 0; g < 10; g++) 
        this.dacCyclesIE[g] = g;
    this._enableDacSupport = function(a){
        this.sxDacProc = a
    };
    this._selectedSubItems = [];
    this._openedPolygons = [];
    this._addSubItemToSelected = function(a, b){
        for (var c = !0, d = 0; d < this._selectedSubItems.length; d++) 
            this._selectedSubItems[d][0] == a && this._selectedSubItems[d][1] == b && (c = !1);
        c == !0 && this._selectedSubItems.push([a, b]);
        return c
    };
    this._removeSubItemFromSelected = function(a, b){
        for (var c = [], d = !1, e = 0; e < this._selectedSubItems.length; e++) 
            this._selectedSubItems[e][0] == a && this._selectedSubItems[e][1] == b ? d = !0 : c[c.length] = this._selectedSubItems[e];
        if (d == !0) 
            this._selectedSubItems = c;
        return d
    };
    this._getSubItemToDeselectByPolygon = function(a){
        for (var b = [], c = 0; c < this._selectedSubItems.length; c++) 
            if (this._selectedSubItems[c][1] == a) {
                b[b.length] = this._selectedSubItems[c][0];
                for (var b = b.concat(this._getSubItemToDeselectByPolygon(this._selectedSubItems[c][0])), d = !0, e = 0; e < this._openedPolygons.length; e++) 
                    this._openedPolygons[e] == this._selectedSubItems[c][0] && (d = !1);
                d == !0 && (this._openedPolygons[this._openedPolygons.length] = this._selectedSubItems[c][0]);
                this._selectedSubItems[c][0] = -1;
                this._selectedSubItems[c][1] = -1
            }
        return b
    };
    this._hidePolygon = function(a){
        if (this.idPull["polygon_" + a] != null) 
            if (this.sxDacProc != null && this.idPull["sxDac_" + a] != null) 
                this.idPull["sxDac_" + a]._hide();
            else 
                if (this.idPull["polygon_" + a].style.display != "none") {
                    this.idPull["polygon_" + a].style.display = "none";
                    if (this.idPull["arrowup_" + a] != null) 
                        this.idPull["arrowup_" + a].style.display = "none";
                    if (this.idPull["arrowdown_" + a] != null) 
                        this.idPull["arrowdown_" + a].style.display = "none";
                    this._updateItemComplexState(a, !0, !1);
                    if (this._isIE6 && this.idPull["polygon_" + a + "_ie6cover"] != null) 
                        this.idPull["polygon_" + a + "_ie6cover"].style.display = "none";
                    a = String(a).replace(this.idPrefix, "");
                    a == this.topId && (a = null);
                    this.callEvent("onHide", [a])
                }
    };
    this._showPolygon = function(a, b){
        var c = this._countVisiblePolygonItems(a);
        if (c != 0) {
            var d = "polygon_" + a;
            if (this.idPull[d] != null && this.idPull[a] != null && (!this.menuModeTopLevelTimeout || this.menuMode != "web" || this.context || this.idPull[a]._mouseOver || b != this.dirTopLevel)) {
                this.fixedPosition || this._autoDetectVisibleArea();
                var e = 0, g = 0, f = null, i = null;
                if (this.limit > 0 && this.limit < c) {
                    var n = "arrowup_" + a, D = "arrowdown_" + a;
                    this.idPull["arrowup_" + a] == null && this._addUpArrow(String(a).replace(this.idPrefix, ""));
                    this.idPull["arrowdown_" + a] == null && this._addDownArrow(String(a).replace(this.idPrefix, ""));
                    f = this.idPull["arrowup_" + a];
                    f.style.visibility = "hidden";
                    f.style.display = "";
                    f.style.zIndex = this.zInd;
                    e = f.offsetHeight;
                    i = this.idPull["arrowdown_" + a];
                    i.style.visibility = "hidden";
                    i.style.display = "";
                    i.style.zIndex = this.zInd;
                    g = i.offsetHeight
                }
                this.idPull[d].style.visibility = "hidden";
                this.idPull[d].style.left = "0px";
                this.idPull[d].style.top = "0px";
                this.idPull[d].style.display = "";
                this.idPull[d].style.zIndex = this.zInd;
                if (this.limit > 0) 
                    this.limit < c ? (this.idPull[d].style.height = 24 * this.limit + "px", this.idPull[d].scrollTop = 0) : this.idPull[d].style.height = "";
                this.zInd += this.zIndStep;
                if (this.itemPull[a] != null) 
                    var C = "polygon_" + this.itemPull[a].parent;
                else 
                    this.context && (C = this.idPull[this.idPrefix + this.topId]);
                var q = this.idPull[a].tagName != null ? getAbsoluteLeft(this.idPull[a]) : this.idPull[a][0], t = this.idPull[a].tagName != null ? getAbsoluteTop(this.idPull[a]) : this.idPull[a][1], u = this.idPull[a].tagName != null ? this.idPull[a].offsetWidth : 0, B = this.idPull[a].tagName != null ? this.idPull[a].offsetHeight + e + g : 0, l = 0, o = 0, s = this.idPull[d].offsetWidth, x = this.idPull[d].offsetHeight;
                b == "bottom" && (l = this._rtl ? q + (u != null ? u : 0) - s : this._align == "right" ? q + u - s : q - 1 + (b == this.dirTopLevel ? this._topLevelRightMargin : 0), o = t - 1 + B - e - g + this._topLevelBottomMargin);
                b == "right" && (l = q + u - 1, o = t + 2);
                b == "left" &&
                (l = q - this.idPull[d].offsetWidth +
                2, o = t + 2);
                b == "top" && (l = q - 1, o = t - x + 2);
                if (this.fixedPosition) 
                    var v = 65536, y = 65536;
                else 
                    if (v = this.menuX2 != null ? this.menuX2 : 0, y = this.menuY2 != null ? this.menuY2 : 0, v == 0) 
                        window.innerWidth ? (v = window.innerWidth, y = window.innerHeight) : (v = document.body.offsetWidth, y = document.body.scrollHeight);
                l + s > v && !this._rtl && (l = q - s + 2);
                l < this.menuX1 && this._rtl && (l = q + u - 2);
                l < 0 && (l = 0);
                o + x > y && this.menuY2 != null && (o = Math.max(t + B - x + 2, 2), this.itemPull[a] != null && !this.context && this.itemPull[a].parent == this.idPrefix + this.topId && (o -= this.base.offsetHeight));
                this.idPull[d].style.left = l + "px";
                this.idPull[d].style.top = o + e + "px";
                if (this.sxDacProc != null && this.idPull["sxDac_" + a] != null) 
                    this.idPull["sxDac_" + a]._show();
                else {
                    this.idPull[d].style.visibility = "";
                    if (this.limit > 0 && this.limit < c) 
                        f.style.left = l + "px", f.style.top = o + "px", f.style.width = s + this._arrowFFFix + "px", f.style.visibility = "", i.style.left = l + "px", i.style.top = o + e + x + "px", i.style.width = s + this._arrowFFFix + "px", i.style.visibility = "", this._checkArrowsState(a);
                    if (this._isIE6) {
                        var r = d + "_ie6cover";
                        if (this.idPull[r] ==
                        null) {
                            var w = document.createElement("IFRAME");
                            w.className = "dhtmlxMenu_IE6CoverFix_" + this.skin;
                            w.frameBorder = 0;
                            w.setAttribute("src", "javascript:false;");
                            document.body.insertBefore(w, document.body.firstChild);
                            this.idPull[r] = w
                        }
                        this.idPull[r].style.left = this.idPull[d].style.left;
                        this.idPull[r].style.top = this.idPull[d].style.top;
                        this.idPull[r].style.width = this.idPull[d].offsetWidth + "px";
                        this.idPull[r].style.height = this.idPull[d].offsetHeight + "px";
                        this.idPull[r].style.zIndex = this.idPull[d].style.zIndex -
                        1;
                        this.idPull[r].style.display = ""
                    }
                    a = String(a).replace(this.idPrefix, "");
                    a == this.topId && (a = null);
                    this.callEvent("onShow", [a])
                }
            }
        }
    };
    this._redistribSubLevelSelection = function(a, b){
        for (; this._openedPolygons.length > 0;) 
            this._openedPolygons.pop();
        var c = this._getSubItemToDeselectByPolygon(b);
        this._removeSubItemFromSelected(-1, -1);
        for (var d = 0; d < c.length; d++) 
            if (this.idPull[c[d]] != null && c[d] != a && this.itemPull[c[d]].state == "enabled") 
                this.idPull[c[d]].className = "sub_item";
        for (d = 0; d < this._openedPolygons.length; d++) 
            this._openedPolygons[d] !=
            b &&
            this._hidePolygon(this._openedPolygons[d]);
        if (this.itemPull[a].state == "enabled") {
            this.idPull[a].className = "sub_item_selected";
            if (this.itemPull[a].complex && this.dLoad && this.itemPull[a].loaded == "no") {
                this.loaderIcon == !0 && this._updateLoaderIcon(a, !0);
                var e = new dtmlXMLLoaderObject(this._xmlParser, window);
                this.itemPull[a].loaded = "get";
                this.callEvent("onXLS", []);
                e.loadXML(this.dLoadUrl + this.dLoadSign + "action=loadMenu&parentId=" + a.replace(this.idPrefix, "") + "&etc=" + (new Date).getTime())
            }
            if ((this.itemPull[a].complex ||
            this.dLoad && this.itemPull[a].loaded == "yes") &&
            this.itemPull[a].complex &&
            this.idPull["polygon_" + a] != null) 
                this._updateItemComplexState(a, !0, !0), this._showPolygon(a, this.dirSubLevel);
            this._addSubItemToSelected(a, b);
            this.menuSelected = a
        }
    };
    this._doOnClick = function(a, b, c){
        this.menuLastClicked = a;
        if (this.itemPull[this.idPrefix + a].href_link != null && this.itemPull[this.idPrefix + a].state == "enabled") {
            var d = document.createElement("FORM"), e = String(this.itemPull[this.idPrefix + a].href_link).split("?");
            d.action = e[0];
            if (e[1] != null) 
                for (var f = String(e[1]).split("&"), g = 0; g < f.length; g++) {
                    var i = String(f[g]).split("="), n = document.createElement("INPUT");
                    n.type = "hidden";
                    n.name = i[0] || "";
                    n.value = i[1] || "";
                    d.appendChild(n)
                }
            if (this.itemPull[this.idPrefix + a].href_target != null) 
                d.target = this.itemPull[this.idPrefix + a].href_target;
            d.style.display = "none";
            document.body.appendChild(d);
            d.submit();
            d != null && (document.body.removeChild(d), d = null)
        }
        else 
            b.charAt(0) != "c" && b.charAt(1) != "d" && b.charAt(2) != "s" &&
            (this.checkEvent("onClick") ? (this._clearAndHide(), this._isContextMenuVisible() && this.contextAutoHide && this._hideContextMenu(), this.callEvent("onClick", [a, this.contextMenuZoneId, c])) : b.charAt(1) == "d" || this.menuMode == "win" && b.charAt(2) == "t" || (this._clearAndHide(), this._isContextMenuVisible() && this.contextAutoHide && this._hideContextMenu()))
    };
    this._doOnTouchMenu = function(a){
        if (this.menuTouched == !1) 
            this.menuTouched = !0, this.checkEvent("onTouch") && this.callEvent("onTouch", [a])
    };
    this._searchMenuNode = function(a, b){
        for (var c = [], d = 0; d < b.length; d++) 
            if (typeof b[d] ==
            "object") {
                b[d].length == 5 && typeof b[d][0] != "object" && b[d][0].replace(this.idPrefix, "") == a && d == 0 && (c = b);
                var e = this._searchMenuNode(a, b[d]);
                e.length > 0 && (c = e)
            }
        return c
    };
    this._getMenuNodes = function(a){
        var b = [], c;
        for (c in this.itemPull) 
            this.itemPull[c].parent == a && (b[b.length] = c);
        return b
    };
    this._genStr = function(a){
        for (var b = "", c = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", d = 0; d < a; d++) 
            b += c.charAt(Math.round(Math.random() * (c.length - 1)));
        return b
    };
    this.getItemType = function(a){
        a = this.idPrefix +
        a;
        return this.itemPull[a] == null ? null : this.itemPull[a].type
    };
    this.forEachItem = function(a){
        for (var b in this.itemPull) 
            a(String(b).replace(this.idPrefix, ""))
    };
    this._clearAndHide = function(){
        a.menuSelected = -1;
        for (a.menuLastClicked = -1; a._openedPolygons.length > 0;) 
            a._openedPolygons.pop();
        for (var b = 0; b < a._selectedSubItems.length; b++) {
            var c = a._selectedSubItems[b][0];
            if (a.idPull[c] != null && a.itemPull[c].state == "enabled") {
                if (a.idPull[c].className == "sub_item_selected") 
                    a.idPull[c].className = "sub_item";
                if (a.idPull[c].className ==
                "dhtmlxMenu_" + a.skin + "_TopLevel_Item_Selected") 
                    a.idPull[c].className = a.itemPull[c].cssNormal != null ? a.itemPull[c].cssNormal : "dhtmlxMenu_" + a.skin + "_TopLevel_Item_Normal"
            }
            a._hidePolygon(c)
        }
        a.menuTouched = !1;
        if (a.context) 
            a.contextHideAllMode ? (a._hidePolygon(a.idPrefix + a.topId), a.zInd = a.zIndInit) : a.zInd = a.zIndInit + a.zIndStep
    };
    this._doOnLoad = function(){
    };
    this.loadXML = function(a, b){
        if (b) 
            this._doOnLoad = function(){
                b()
            };
        this.callEvent("onXLS", []);
        this._xmlLoader.loadXML(a)
    };
    this.loadXMLString = function(a, b){
        if (b) 
            this._doOnLoad = function(){
                b()
            };
        this._xmlLoader.loadXMLString(a)
    };
    this._buildMenu = function(a, b){
        for (var c = 0, d = 0; d < a.childNodes.length; d++) 
            if (a.childNodes[d].tagName == this.itemTagName) {
                var e = a.childNodes[d], f = {};
                f.id = this.idPrefix + (e.getAttribute("id") || this._genStr(24));
                f.title = e.getAttribute("text") || "";
                f.imgen = e.getAttribute("img") || "";
                f.imgdis = e.getAttribute("imgdis") || "";
                f.tip = "";
                f.hotkey = "";
                e.getAttribute("cssNormal") != null && (f.cssNormal = e.getAttribute("cssNormal"));
                f.type = e.getAttribute("type") || "item";
                if (f.type ==
                "checkbox") 
                    f.checked = e.getAttribute("checked") != null, f.imgen = "chbx_" + (f.checked ? "1" : "0"), f.imgdis = f.imgen;
                if (f.type == "radio") 
                    f.checked = e.getAttribute("checked") != null, f.imgen = "rdbt_" + (f.checked ? "1" : "0"), f.imgdis = f.imgen, f.group = e.getAttribute("group") || this._genStr(24), this.radio[f.group] == null && (this.radio[f.group] = []), this.radio[f.group][this.radio[f.group].length] = f.id;
                f.state = e.getAttribute("enabled") != null || e.getAttribute("disabled") != null ? e.getAttribute("enabled") == "false" ||
                e.getAttribute("disabled") ==
                "true" ? "disabled" : "enabled" : "enabled";
                f.parent = b != null ? b : this.idPrefix + this.topId;
                f.complex = this.dLoad ? e.getAttribute("complex") != null ? !0 : !1 : this._buildMenu(e, f.id) > 0;
                this.dLoad && f.complex && (f.loaded = "no");
                this.itemPull[f.id] = f;
                for (var g = 0; g < e.childNodes.length; g++) {
                    var i = e.childNodes[g].tagName;
                    i != null && (i = i.toLowerCase());
                    if (i == this.userDataTagName) {
                        var n = e.childNodes[g];
                        n.getAttribute("name") != null &&
                        (this.userData[f.id + "_" + n.getAttribute("name")] = n.firstChild.nodeValue != null ? n.firstChild.nodeValue : "")
                    }
                    if (i == this.itemTextTagName) 
                        f.title = e.childNodes[g].firstChild.nodeValue;
                    if (i == this.itemTipTagName) 
                        f.tip = e.childNodes[g].firstChild.nodeValue;
                    if (i == this.itemHotKeyTagName) 
                        f.hotkey = e.childNodes[g].firstChild.nodeValue;
                    if (i == this.itemHrefTagName && f.type == "item") 
                        f.href_link = e.childNodes[g].firstChild.nodeValue, e.childNodes[g].getAttribute("target") != null && (f.href_target = e.childNodes[g].getAttribute("target"))
                }
                c++
            }
        return c
    };
    this._xmlParser = function(){
        if (a.dLoad) {
            var b = this.getXMLTopNode("menu");
            parentId = b.getAttribute("parentId") != null ? b.getAttribute("parentId") : null;
            if (parentId == null) 
                a._buildMenu(b, null), a._initTopLevelMenu();
            else {
                a._buildMenu(b, a.idPrefix + parentId);
                a._addSubMenuPolygon(a.idPrefix + parentId, a.idPrefix + parentId);
                if (a.menuSelected == a.idPrefix + parentId) {
                    var c = a.idPrefix + parentId, d = a.itemPull[a.idPrefix + parentId].parent == a.idPrefix + a.topId, e = d && !a.context ? a.dirTopLevel : a.dirSubLevel, f = !1;
                    if (d && a.menuModeTopLevelTimeout && a.menuMode == "web" && !a.context) {
                        var g = a.idPull[a.idPrefix + parentId];
                        if (g._mouseOver == !0) {
                            var p = a.menuModeTopLevelTimeoutTime - ((new Date).getTime() - g._dynLoadTM);
                            if (p > 1) 
                                g._menuOpenTM = window.setTimeout(function(){
                                    a._showPolygon(c, e)
                                }, p), f = !0
                        }
                    }
                    f || a._showPolygon(c, e)
                }
                a.itemPull[a.idPrefix + parentId].loaded = "yes";
                a.loaderIcon == !0 && a._updateLoaderIcon(a.idPrefix + parentId, !1)
            }
            this.destructor();
            a.callEvent("onXLE", [])
        }
        else 
            b = this.getXMLTopNode("menu"), a._buildMenu(b, null), a.init(), a.callEvent("onXLE", []), a._doOnLoad()
    };
    this._xmlLoader = new dtmlXMLLoaderObject(this._xmlParser, window);
    this._showSubLevelItem = function(a, b){
        if (document.getElementById("arrow_" + this.idPrefix + a) != null) 
            document.getElementById("arrow_" + this.idPrefix + a).style.display = b ? "none" : "";
        if (document.getElementById("image_" + this.idPrefix + a) != null) 
            document.getElementById("image_" + this.idPrefix + a).style.display = b ? "none" : "";
        if (document.getElementById(this.idPrefix + a) != null) 
            document.getElementById(this.idPrefix + a).style.display = b ? "" : "none"
    };
    this._hideSubLevelItem = function(a){
        this._showSubLevelItem(a, !0)
    };
    this.idPrefix = this._genStr(12);
    this._bodyClick = function(b){
        b = b || event;
        b.button == 2 || _isOpera && b.ctrlKey == !0 || (a.context ? a.contextAutoHide && (!_isOpera || a._isContextMenuVisible() && _isOpera) && a._hideContextMenu() : a._clearAndHide())
    };
    this._bodyContext = function(b){
        var b = b || event, c = (b.srcElement || b.target).className;
        if (!(c.search("dhtmlxMenu") != -1 && c.search("SubLevelArea") != -1)) {
            var d = !0, e = b.target || b.srcElement;
            e.id != null && a.isContextZone(e.id) && (d = !1);
            e == document.body && (d = !1);
            d && a.hideContextMenu()
        }
    };
    _isIE ? (document.body.attachEvent("onclick", this._bodyClick), document.body.attachEvent("oncontextmenu", this._bodyContext)) : (window.addEventListener("click", this._bodyClick, !1), window.addEventListener("contextmenu", this._bodyContext, !1));
    this._UID = this._genStr(32);
    dhtmlxMenuObjectLiveInstances[this._UID] = this;
    dhtmlxEventable(this);
    return this
}

dhtmlXMenuObject.prototype.init = function(){
    if (this._isInited != !0) 
        this.dLoad ? (this.callEvent("onXLS", []), this._xmlLoader.loadXML(this.dLoadUrl + this.dLoadSign + "action=loadMenu&etc=" + (new Date).getTime())) : (this._initTopLevelMenu(), this._isInited = !0)
};
dhtmlXMenuObject.prototype._countVisiblePolygonItems = function(b){
    var c = 0, a;
    for (a in this.itemPull) {
        var d = this.itemPull[a].parent, f = this.itemPull[a].type;
        this.idPull[a] != null && d == b && (f == "item" || f == "radio" || f == "checkbox") && this.idPull[a].style.display != "none" && c++
    }
    return c
};
dhtmlXMenuObject.prototype._redefineComplexState = function(b){
    if (this.idPrefix + this.topId != b && this.idPull["polygon_" + b] != null && this.idPull[b] != null) {
        var c = this._countVisiblePolygonItems(b);
        c > 0 && !this.itemPull[b].complex && this._updateItemComplexState(b, !0, !1);
        c == 0 && this.itemPull[b].complex && this._updateItemComplexState(b, !1, !1)
    }
};
dhtmlXMenuObject.prototype._updateItemComplexState = function(b, c){
    if (!this.context && this._getItemLevelType(b.replace(this.idPrefix, "")) == "TopLevel") 
        this.itemPull[b].complex = c;
    else 
        if (!(this.idPull[b] == null || this.itemPull[b] == null)) 
            if (this.itemPull[b].complex = c, b != this.idPrefix + this.topId) {
                var a = null, d = this.idPull[b].childNodes[this._rtl ? 0 : 2];
                d.childNodes[0] && String(d.childNodes[0].className).search("complex_arrow") === 0 && (a = d.childNodes[0]);
                if (this.itemPull[b].complex) {
                    if (a == null) {
                        a = document.createElement("DIV");
                        a.className = "complex_arrow";
                        for (a.id = "arrow_" + b; d.childNodes.length > 0;) 
                            d.removeChild(d.childNodes[0]);
                        d.appendChild(a)
                    }
                    if (this.dLoad && this.itemPull[b].loaded == "get" && this.loaderIcon) {
                        if (a.className != "complex_arrow_loading") 
                            a.className = "complex_arrow_loading"
                    }
                    else 
                        a.className = "complex_arrow"
                }
                else 
                    !this.itemPull[b].complex && a != null && (d.removeChild(a), this.itemPull[b].hotkey_backup != null && this.setHotKey && this.setHotKey(b.replace(this.idPrefix, ""), this.itemPull[b].hotkey_backup))
            }
};
dhtmlXMenuObject.prototype._getItemLevelType = function(b){	
    return this.itemPull[this.idPrefix + b].parent == this.idPrefix + this.topId ? "TopLevel" : "SubLevelArea"
};
dhtmlXMenuObject.prototype._redistribTopLevelSelection = function(b){
    var c = this._getSubItemToDeselectByPolygon("parent");
    this._removeSubItemFromSelected(-1, -1);
    for (var a = 0; a < c.length; a++) 
        if (c[a] != b && this._hidePolygon(c[a]), this.idPull[c[a]] != null && c[a] != b) 
            this.idPull[c[a]].className = this.idPull[c[a]].className.replace(/Selected/g, "Normal");
    if (this.itemPull[this.idPrefix + b].state == "enabled") 
        this.idPull[this.idPrefix + b].className = "dhtmlxMenu_" + this.skin + "_TopLevel_Item_Selected", this._addSubItemToSelected(this.idPrefix +
        b, "parent"), this.menuSelected = this.menuMode == "win" ? this.menuSelected != -1 ? b : this.menuSelected : b, this.itemPull[this.idPrefix + b].complex && this.menuSelected != -1 && this._showPolygon(this.idPrefix + b, this.dirTopLevel)
};
dhtmlXMenuObject.prototype._initTopLevelMenu = function(){
    this.dirTopLevel = "bottom";
    this.dirSubLevel = this._rtl ? "left" : "right";
    if (this.context) 
        this.idPull[this.idPrefix + this.topId] = [0, 0], this._addSubMenuPolygon(this.idPrefix + this.topId, this.idPrefix + this.topId);
    else 
        for (var b = this._getMenuNodes(this.idPrefix + this.topId), c = 0; c < b.length; c++) 
            this.itemPull[b[c]].type == "item" && this._renderToplevelItem(b[c], null), this.itemPull[b[c]].type == "separator" && this._renderSeparator(b[c], null)
};
dhtmlXMenuObject.prototype._renderToplevelItem = function(b, c){
    var a = this, d = document.createElement("DIV");
    d.id = b;
    d.className = this.itemPull[b].state == "enabled" && this.itemPull[b].cssNormal != null ? this.itemPull[b].cssNormal : "dhtmlxMenu_" + this.skin + "_TopLevel_Item_" + (this.itemPull[b].state == "enabled" ? "Normal" : "Disabled");
    if (this.itemPull[b].title != "") {
        var f = document.createElement("DIV");
        f.className = "top_level_text";
        f.innerHTML = this.itemPull[b].title;
        d.appendChild(f)
    }
    if (this.itemPull[b].tip.length > 0) 
        d.title = this.itemPull[b].tip;
    if (this.itemPull[b].imgen != "" || this.itemPull[b].imgdis != "") {
        var e = this.itemPull[b][this.itemPull[b].state == "enabled" ? "imgen" : "imgdis"];
        if (e) {
            var g = document.createElement("IMG");
            g.border = "0";
            g.id = "image_" + b;
            g.src = this.imagePath + e;
            g.className = "dhtmlxMenu_TopLevel_Item_Icon";
            d.childNodes.length > 0 && !this._rtl ? d.insertBefore(g, d.childNodes[0]) : d.appendChild(g)
        }
    }
    d.onselectstart = function(a){
        a = a || event;
        return a.returnValue = !1
    };
    d.oncontextmenu = function(a){
        a = a || event;
        return a.returnValue = !1
    };
    if (!this.cont) 
        this.cont = document.createElement("DIV"), this.cont.dir = "ltr", this.cont.className = this._align == "right" ? "align_right" : "align_left", this.base.appendChild(this.cont);
    c != null && (c++, c < 0 && (c = 0), c > this.cont.childNodes.length - 1 && (c = null));
    c != null ? this.cont.insertBefore(d, this.cont.childNodes[c]) : this.cont.appendChild(d);
    this.idPull[d.id] = d;
    this.itemPull[b].complex && !this.dLoad && this._addSubMenuPolygon(this.itemPull[b].id, this.itemPull[b].id);
    d.onmouseover = function(){
        a.menuMode == "web" && window.clearTimeout(a.menuTimeoutHandler);
        var b = a._getSubItemToDeselectByPolygon("parent");
        a._removeSubItemFromSelected(-1, -1);
        for (var c = 0; c < b.length; c++) 
            if (b[c] != this.id && a._hidePolygon(b[c]), a.idPull[b[c]] != null && b[c] != this.id) 
                if (a.itemPull[b[c]].cssNormal != null) 
                    a.idPull[b[c]].className = a.itemPull[b[c]].cssNormal;
                else {
                    if (a.idPull[b[c]].className == "sub_item_selected") 
                        a.idPull[b[c]].className = "sub_item";
                    a.idPull[b[c]].className = a.idPull[b[c]].className.replace(/Selected/g, "Normal")
                }
        if (a.itemPull[this.id].state == "enabled") {
            this.className = "dhtmlxMenu_" + a.skin + "_TopLevel_Item_Selected";
            a._addSubItemToSelected(this.id, "parent");
            a.menuSelected = a.menuMode == "win" ? a.menuSelected != -1 ? this.id : a.menuSelected : this.id;
            if (a.dLoad && a.itemPull[this.id].loaded == "no") {
                if (a.menuModeTopLevelTimeout && a.menuMode == "web" && !a.context) 
                    this._mouseOver = !0, this._dynLoadTM = (new Date).getTime();
                var d = new dtmlXMLLoaderObject(a._xmlParser, window);
                a.itemPull[this.id].loaded = "get";
                a.callEvent("onXLS", []);
                d.loadXML(a.dLoadUrl + a.dLoadSign + "action=loadMenu&parentId=" +
                this.id.replace(a.idPrefix, "") +
                "&etc=" +
                (new Date).getTime())
            }
            if ((!a.dLoad || a.dLoad && (!a.itemPull[this.id].loaded || a.itemPull[this.id].loaded == "yes")) && a.itemPull[this.id].complex && a.menuSelected != -1) 
                if (a.menuModeTopLevelTimeout && a.menuMode == "web" && !a.context) {
                    this._mouseOver = !0;
                    var e = this.id;
                    this._menuOpenTM = window.setTimeout(function(){
                        a._showPolygon(e, a.dirTopLevel)
                    }, a.menuModeTopLevelTimeoutTime)
                }
                else 
                    a._showPolygon(this.id, a.dirTopLevel)
        }
        a._doOnTouchMenu(this.id.replace(a.idPrefix, ""))
    };
    d.onmouseout = function(){
        if (!(a.itemPull[this.id].complex && a.menuSelected != -1) && a.itemPull[this.id].state == "enabled") 
            d.className = a.itemPull[this.id].cssNormal != null ? a.itemPull[this.id].cssNormal : "dhtmlxMenu_" + a.skin + "_TopLevel_Item_Normal";
        if (a.menuMode == "web") 
            window.clearTimeout(a.menuTimeoutHandler), a.menuTimeoutHandler = window.setTimeout(function(){
                a._clearAndHide()
            }, a.menuTimeoutMsec, "JavaScript");
        if (a.menuModeTopLevelTimeout && a.menuMode == "web" && !a.context) 
            this._mouseOver = !1, window.clearTimeout(this._menuOpenTM)
    };
    d.onclick = function(b){
        a.menuMode == "web" && window.clearTimeout(a.menuTimeoutHandler);
        if (!(a.menuMode != "web" && a.itemPull[this.id].state == "disabled")) {
            b = b || event;
            b.cancelBubble = !0;
            b.returnValue = !1;
            if (a.menuMode == "win" && a.itemPull[this.id].complex) {
                if (a.menuSelected == this.id) {
                    a.menuSelected = -1;
                    var c = !1
                }
                else 
                    a.menuSelected = this.id, c = !0;
                c ? a._showPolygon(this.id, a.dirTopLevel) : a._hidePolygon(this.id)
            }
            var d = a.itemPull[this.id].complex ? "c" : "-", e = a.itemPull[this.id].state != "enabled" ? "d" : "-", f = {
                ctrl: b.ctrlKey,
                alt: b.altKey,
                shift: b.shiftKey
            };
            a._doOnClick(this.id.replace(a.idPrefix, ""), d + e + "t", f);
            return !1
        }
    }
};
dhtmlXMenuObject.prototype.setImagePath = function(){
};
dhtmlXMenuObject.prototype.setIconsPath = function(b){
    this.imagePath = b
};
dhtmlXMenuObject.prototype.setIconPath = dhtmlXMenuObject.prototype.setIconsPath;
dhtmlXMenuObject.prototype._updateItemImage = function(b){
    var b = this.idPrefix + b, c = this.itemPull[b].parent == this.idPrefix + this.topId && !this.context, a = null;
    if (c) 
        for (var d = 0; d < this.idPull[b].childNodes.length; d++) 
            try {
                this.idPull[b].childNodes[d].className == "dhtmlxMenu_TopLevel_Item_Icon" && (a = this.idPull[b].childNodes[d])
            } 
            catch (f) {
            }
    else 
        try {
            a = this.idPull[b].childNodes[this._rtl ? 2 : 0].childNodes[0]
        } 
        catch (e) {
        }
    var g = this.itemPull[b].type == "radio" ? this.itemPull[b][this.itemPull[b].state == "enabled" ? "imgen" : "imgdis"] : this.itemPull[b][this.itemPull[b].state == "enabled" ? "imgen" : "imgdis"];
    if (g.length > 0) 
        if (a != null) 
            a.src = this.imagePath + g;
        else 
            if (c) 
                a = document.createElement("IMG"), a.className = "dhtmlxMenu_TopLevel_Item_Icon", a.src = this.imagePath + g, a.border = "0", a.id = "image_" + b, !this._rtl && this.idPull[b].childNodes.length > 0 ? this.idPull[b].insertBefore(a, this.idPull[b].childNodes[0]) : this.idPull[b].appendChild(a);
            else {
                a = document.createElement("IMG");
                a.className = "sub_icon";
                a.src = this.imagePath + g;
                a.border = "0";
                a.id = "image_" +
                b;
                for (var h = this.idPull[b].childNodes[this._rtl ? 2 : 0]; h.childNodes.length > 0;) 
                    h.removeChild(h.childNodes[0]);
                h.appendChild(a)
            }
    else 
        a != null && a.parentNode.removeChild(a)
};
dhtmlXMenuObject.prototype.removeItem = function(b, c, a){
    c || (b = this.idPrefix + b);
    var d = null;
    if (b != this.idPrefix + this.topId) {
        if (this.itemPull[b] == null) 
            return;
        var f = this.itemPull[b].type;
        if (f == "separator") {
            var e = this.idPull["separator_" + b];
            this.itemPull[b].parent == this.idPrefix + this.topId ? (e.onclick = null, e.onselectstart = null, e.id = null) : (e.childNodes[0].childNodes[0].onclick = null, e.childNodes[0].childNodes[0].onselectstart = null, e.childNodes[0].childNodes[0].id = null, e.childNodes[0].removeChild(e.childNodes[0].childNodes[0]), e.removeChild(e.childNodes[0]));
            e.parentNode.removeChild(e);
            this.idPull["separator_" + b] = null;
            this.itemPull[b] = null;
            delete this.idPull["separator_" + b]
        }
        else {
            d = this.itemPull[b].parent;
            e = this.idPull[b];
            e.onclick = null;
            e.oncontextmenu = null;
            e.onmouseover = null;
            e.onmouseout = null;
            e.onselectstart = null;
            for (e.id = null; e.childNodes.length > 0;) 
                e.removeChild(e.childNodes[0]);
            e.parentNode.removeChild(e);
            this.idPull[b] = null;
            this.itemPull[b] = null;
            delete this.idPull[b]
        }
        delete this.itemPull[b];
        f = e = null
    }
    for (var g in this.itemPull) 
        this.itemPull[g].parent ==
        b &&
        this.removeItem(g, !0, !0);
    var h = Array(b);
    d != null && !a && this.idPull["polygon_" + d] != null && this.idPull["polygon_" + d].tbd.childNodes.length == 0 && (h.push(d), this._updateItemComplexState(d, !1, !1));
    for (var j = 0; j < h.length; j++) 
        if (this.idPull["polygon_" + h[j]]) {
            var k = this.idPull["polygon_" + h[j]];
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
                var m = "polygon_" + h[j] + "_ie6cover";
                this.idPull[m] !=
                null &&
                (document.body.removeChild(this.idPull[m]), delete this.idPull[m])
            }
            this.idPull["arrowup_" + b] != null && this._removeArrow && this._removeArrow("arrowup_" + b);
            this.idPull["arrowdown_" + b] != null && this._removeArrow && this._removeArrow("arrowdown_" + b);
            this.idPull["polygon_" + h[j]] = null;
            delete this.idPull["polygon_" + h[j]]
        }
    h = null
};
dhtmlXMenuObject.prototype._getAllParents = function(b){
    var c = [], a;
    for (a in this.itemPull) 
        if (this.itemPull[a].parent == b && (c[c.length] = this.itemPull[a].id, this.itemPull[a].complex)) 
            for (var d = this._getAllParents(this.itemPull[a].id), f = 0; f < d.length; f++) 
                c[c.length] = d[f];
    return c
};
dhtmlXMenuObject.prototype.renderAsContextMenu = function(){
    this.context = !0;
    if (this.base._autoSkinUpdate == !0) 
        this.base.className = this.base.className.replace("dhtmlxMenu_" + this.skin + "_Middle", ""), this.base._autoSkinUpdate = !1;
    this.addBaseIdAsContextZone != null && this.addContextZone(this.addBaseIdAsContextZone)
};
dhtmlXMenuObject.prototype.addContextZone = function(b){
	if( typeof b == "string" ){
		c = document.getElementById( b );
	}
	else{
		c = b;
		if( b == document.body ){
			b = "document.body";
		}
		else{
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
	
    var f = this;
    if (_isOpera) 
        this.operaContext = function(a){
            f._doOnContextMenuOpera(a, f)
        }, c.addEventListener("mouseup", this.operaContext, !1);
    else {
        if (c.oncontextmenu != null && !c._oldContextMenuHandler) 
            c._oldContextMenuHandler = c.oncontextmenu;
        c.oncontextmenu = function(a){
			if( a.target.tagName == "INPUT" || a.target.tagName == "textarea" ){				
				return;
			}
			
            for (var b in dhtmlxMenuObjectLiveInstances) 
                b != f._UID && dhtmlxMenuObjectLiveInstances[b].context && dhtmlxMenuObjectLiveInstances[b]._hideContextMenu();
            a = a || event;
            a.cancelBubble = !0;
            a.returnValue = !1;
            f._doOnContextBeforeCall(a, this);
            return !1
        }
    }
};
dhtmlXMenuObject.prototype._doOnContextMenuOpera = function(b, c){
    for (var a in dhtmlxMenuObjectLiveInstances) 
        a != c._UID && dhtmlxMenuObjectLiveInstances[a].context && dhtmlxMenuObjectLiveInstances[a]._hideContextMenu();
    b.cancelBubble = !0;
    b.returnValue = !1;
    b.button == 0 && b.ctrlKey == !0 && c._doOnContextBeforeCall(b, this);
    return !1
};
dhtmlXMenuObject.prototype.removeContextZone = function(b){
    if (!this.isContextZone(b)) 
        return !1;
    b == document.body && (b = "document.body." + this.idPrefix);
    var c = this.contextZones[b];
    _isOpera ? c.removeEventListener("mouseup", this.operaContext, !1) : (c.oncontextmenu = c._oldContextMenuHandler != null ? c._oldContextMenuHandler : null, c._oldContextMenuHandler = null);
    try {
        this.contextZones[b] = null, delete this.contextZones[b]
    } 
    catch (a) {
    }
    return !0
};
dhtmlXMenuObject.prototype.isContextZone = function(b){
    if (b == document.body && this.contextZones["document.body." + this.idPrefix] != null) 
        return !0;
    var c = !1;
    this.contextZones[b] != null && this.contextZones[b] == document.getElementById(b) && (c = !0);
    return c
};
dhtmlXMenuObject.prototype._isContextMenuVisible = function(){
    return this.idPull["polygon_" + this.idPrefix + this.topId] == null ? !1 : this.idPull["polygon_" + this.idPrefix + this.topId].style.display == ""
};
dhtmlXMenuObject.prototype._showContextMenu = function(b, c, a){
    this._clearAndHide();
    if (this.idPull["polygon_" + this.idPrefix + this.topId] == null) 
        return !1;
    window.clearTimeout(this.menuTimeoutHandler);
    this.idPull[this.idPrefix + this.topId] = [b, c];
    this._showPolygon(this.idPrefix + this.topId, "bottom");
    this.callEvent("onContextMenu", [a, this.contextMenuZoneId])
};
dhtmlXMenuObject.prototype._hideContextMenu = function(){
    if (this.idPull["polygon_" + this.idPrefix + this.topId] == null) 
        return !1;
    this._clearAndHide();
    this._hidePolygon(this.idPrefix + this.topId);
    this.zInd = this.zIndInit
};
dhtmlXMenuObject.prototype._doOnContextBeforeCall = function(b, c){
    this.contextMenuZoneId = c.id;
    this._clearAndHide();
    this._hideContextMenu();
    var a = b.srcElement || b.target, d = _isIE || _isOpera || _KHTMLrv ? b.offsetX : b.layerX, f = _isIE || _isOpera || _KHTMLrv ? b.offsetY : b.layerY, e = getAbsoluteLeft(a) + d, g = getAbsoluteTop(a) + f;
    this.checkEvent("onBeforeContextMenu") ? this.callEvent("onBeforeContextMenu", [c.id, b]) && this.contextAutoShow && (this._showContextMenu(e, g), this.callEvent("onAfterContextMenu", [c.id, b])) : this.contextAutoShow &&
    (this._showContextMenu(e, g), this.callEvent("onAfterContextMenu", [c.id]))
};
dhtmlXMenuObject.prototype.showContextMenu = function(b, c){
    this._showContextMenu(b, c, !1)
};
dhtmlXMenuObject.prototype.hideContextMenu = function(){
    this._hideContextMenu()
};
dhtmlXMenuObject.prototype._autoDetectVisibleArea = function(){
    if (!this._isVisibleArea) 
        this.menuX1 = document.body.scrollLeft, this.menuX2 = this.menuX1 + (window.innerWidth || document.body.clientWidth), this.menuY1 = Math.max((_isIE ? document.documentElement : document.getElementsByTagName("html")[0]).scrollTop, document.body.scrollTop), this.menuY2 = this.menuY1 + (_isIE ? Math.max(document.documentElement.clientHeight || 0, document.documentElement.offsetHeight || 0, document.body.clientHeight || 0) : window.innerHeight)
};
dhtmlXMenuObject.prototype.getItemPosition = function(b){
    var b = this.idPrefix + b, c = -1;
    if (this.itemPull[b] == null) 
        return c;
    for (var a = this.itemPull[b].parent, d = this.idPull["polygon_" + a] != null ? this.idPull["polygon_" + a].tbd : this.cont, f = 0; f < d.childNodes.length; f++) 
        if (d.childNodes[f] == this.idPull["separator_" + b] || d.childNodes[f] == this.idPull[b]) 
            c = f;
    return c
};
dhtmlXMenuObject.prototype.setItemPosition = function(b, c){
    b = this.idPrefix + b;
    if (this.idPull[b] != null) {
        var a = this.itemPull[b].parent == this.idPrefix + this.topId, d = this.idPull[b], f = this.getItemPosition(b.replace(this.idPrefix, "")), e = this.itemPull[b].parent, g = this.idPull["polygon_" + e] != null ? this.idPull["polygon_" + e].tbd : this.cont;
        g.removeChild(g.childNodes[f]);
        c < 0 && (c = 0);
        a && c < 1 && (c = 1);
        c < g.childNodes.length ? g.insertBefore(d, g.childNodes[c]) : g.appendChild(d)
    }
};
dhtmlXMenuObject.prototype.getParentId = function(b){
    b = this.idPrefix + b;
    return this.itemPull[b] == null ? null : (this.itemPull[b].parent != null ? this.itemPull[b].parent : this.topId).replace(this.idPrefix, "")
};
dhtmlXMenuObject.prototype.addNewSibling = function(b, c, a, d, f, e){
    var g = this.idPrefix + (c != null ? c : this._genStr(24)), h = this.idPrefix + (b != null ? this.getParentId(b) : this.topId);
    this._addItemIntoGlobalStrorage(g, h, a, "item", d, f, e);
    h == this.idPrefix + this.topId && !this.context ? this._renderToplevelItem(g, this.getItemPosition(b)) : this._renderSublevelItem(g, this.getItemPosition(b))
};
dhtmlXMenuObject.prototype.addNewChild = function(b, c, a, d, f, e, g){
    if (b == null) 
        if (this.context) 
            b = this.topId;
        else {
            this.addNewSibling(b, a, d, f, e, g);
            c != null && this.setItemPosition(a, c);
            return
        }
    a = this.idPrefix + (a != null ? a : this._genStr(24));
    this.setHotKey && this.setHotKey(b, "");
    b = this.idPrefix + b;
    this._addItemIntoGlobalStrorage(a, b, d, "item", f, e, g);
    this.idPull["polygon_" + b] == null && this._renderSublevelPolygon(b, b);
    this._renderSublevelItem(a, c - 1);
    this._redefineComplexState(b)
};
dhtmlXMenuObject.prototype._addItemIntoGlobalStrorage = function(b, c, a, d, f, e, g){
    var h = {
        id: b,
        title: a,
        imgen: e != null ? e : "",
        imgdis: g != null ? g : "",
        type: d,
        state: f == !0 ? "disabled" : "enabled",
        parent: c,
        complex: !1,
        hotkey: "",
        tip: ""
    };
    this.itemPull[h.id] = h
};
dhtmlXMenuObject.prototype._addSubMenuPolygon = function(b, c){
    for (var a = this._renderSublevelPolygon(b, c), d = this._getMenuNodes(c), f = 0; f < d.length; f++) 
        this.itemPull[d[f]].type == "separator" ? this._renderSeparator(d[f], null) : this._renderSublevelItem(d[f], null);
    for (var e = b == c ? "topLevel" : "subLevel", f = 0; f < d.length; f++) 
        this.itemPull[d[f]].complex && this._addSubMenuPolygon(b, this.itemPull[d[f]].id)
};
dhtmlXMenuObject.prototype._renderSublevelPolygon = function(b, c){
    var a = document.createElement("DIV");
    a.className = "dhtmlxMenu_" + this.skin + "_SubLevelArea_Polygon " + (this._rtl ? "dir_right" : "");
    a.dir = "ltr";
    a.oncontextmenu = function(a){
        a = a || event;
        a.returnValue = !1;
        a.cancelBubble = !0;
        return !1
    };
    a.id = "polygon_" + c;
    a.onclick = function(a){
        a = a || event;
        a.cancelBubble = !0
    };
    a.style.display = "none";
    document.body.insertBefore(a, document.body.firstChild);
    var d = document.createElement("TABLE");
    d.className = "dhtmlxMebu_SubLevelArea_Tbl";
    d.cellSpacing = 0;
    d.cellPadding = 0;
    d.border = 0;
    var f = document.createElement("TBODY");
    d.appendChild(f);
    a.appendChild(d);
    a.tbl = d;
    a.tbd = f;
    this.idPull[a.id] = a;
    this.sxDacProc != null && (this.idPull["sxDac_" + c] = new this.sxDacProc(a, a.className), _isIE ? (this.idPull["sxDac_" + c]._setSpeed(this.dacSpeedIE), this.idPull["sxDac_" + c]._setCustomCycle(this.dacCyclesIE)) : (this.idPull["sxDac_" + c]._setSpeed(this.dacSpeed), this.idPull["sxDac_" + c]._setCustomCycle(this.dacCycles)));
    return a
};
dhtmlXMenuObject.prototype._renderSublevelItem = function(b, c){
    var a = this, d = document.createElement("TR");
    d.className = this.itemPull[b].state == "enabled" ? "sub_item" : "sub_item_dis";
    var f = document.createElement("TD");
    f.className = "sub_item_icon";
    var e = this.itemPull[b][this.itemPull[b].state == "enabled" ? "imgen" : "imgdis"];
    if (e != "") {
        var g = this.itemPull[b].type;
        if (g == "checkbox" || g == "radio") {
            var h = document.createElement("DIV");
            h.id = "image_" + this.itemPull[b].id;
            h.className = "sub_icon " + e;
            f.appendChild(h)
        }
        if (!(g ==
        "checkbox" ||
        g == "radio")) 
            h = document.createElement("IMG"), h.id = "image_" + this.itemPull[b].id, h.className = "sub_icon", h.src = this.imagePath + e, f.appendChild(h)
    }
    var j = document.createElement("TD");
    j.className = "sub_item_text";
    if (this.itemPull[b].title != "") {
        var k = document.createElement("DIV");
        k.className = "sub_item_text";
        k.innerHTML = this.itemPull[b].title;
        j.appendChild(k)
    }
    else 
        j.innerHTML = "&nbsp;";
    var m = document.createElement("TD");
    m.className = "sub_item_hk";
    if (this.itemPull[b].complex) {
        var z = document.createElement("DIV");
        z.className = "complex_arrow";
        z.id = "arrow_" + this.itemPull[b].id;
        m.appendChild(z)
    }
    else 
        if (this.itemPull[b].hotkey.length > 0 && !this.itemPull[b].complex) {
            var A = document.createElement("DIV");
            A.className = "sub_item_hk";
            A.innerHTML = this.itemPull[b].hotkey;
            m.appendChild(A)
        }
        else 
            m.innerHTML = "&nbsp;";
    d.appendChild(this._rtl ? m : f);
    d.appendChild(j);
    d.appendChild(this._rtl ? f : m);
    d.id = this.itemPull[b].id;
    d.parent = this.itemPull[b].parent;
    if (this.itemPull[b].tip.length > 0) 
        d.title = this.itemPull[b].tip;
    d.onselectstart = function(a){
        a = a || event;
        return a.returnValue = !1
    };
    d.onmouseover = function(){
        a.menuMode == "web" && window.clearTimeout(a.menuTimeoutHandler);
        a._redistribSubLevelSelection(this.id, this.parent)
    };
    if (a.menuMode == "web") 
        d.onmouseout = function(){
            window.clearTimeout(a.menuTimeoutHandler);
            a.menuTimeoutHandler = window.setTimeout(function(){
                a._clearAndHide()
            }, a.menuTimeoutMsec, "JavaScript")
        };
    d.onclick = function(b){
        if (a.checkEvent("onClick") || !a.itemPull[this.id].complex) {
            b = b || event;
            b.cancelBubble = !0;
            b.returnValue = !1;
            tc = a.itemPull[this.id].complex ? "c" : "-";
            td = a.itemPull[this.id].state == "enabled" ? "-" : "d";
            var c = {
                ctrl: b.ctrlKey,
                alt: b.altKey,
                shift: b.shiftKey
            };
            switch (a.itemPull[this.id].type) {
                case "checkbox":
                    	a._checkboxOnClickHandler(this.id.replace(a.idPrefix, ""), tc + td + "n", c);
						a.hide();
                    break;
                case "radio":
                    a._radioOnClickHandler(this.id.replace(a.idPrefix, ""), tc + td + "n", c);
                    break;
                case "item":
                    a._doOnClick(this.id.replace(a.idPrefix, ""), tc + td + "n", c)
            }
            return !1
        }
    };
    var p = this.idPull["polygon_" + this.itemPull[b].parent];
    c != null &&
    (c++, c < 0 && (c = 0), c >
    p.tbd.childNodes.length -
    1 &&
    (c = null));
    c != null && p.tbd.childNodes[c] != null ? p.tbd.insertBefore(d, p.tbd.childNodes[c]) : p.tbd.appendChild(d);
    this.idPull[d.id] = d
};
dhtmlXMenuObject.prototype._renderSeparator = function(b, c){
    var a = this.context ? "SubLevelArea" : this.itemPull[b].parent == this.idPrefix + this.topId ? "TopLevel" : "SubLevelArea";
    if (!(a == "TopLevel" && this.context)) {
        var d = this;
        if (a != "TopLevel") {
            var f = document.createElement("TR");
            f.className = "sub_sep";
            var e = document.createElement("TD");
            e.colSpan = "3";
            f.appendChild(e)
        }
        var g = document.createElement("DIV");
        g.id = "separator_" + b;
        g.className = a == "TopLevel" ? "top_sep" : "sub_sep";
        g.onselectstart = function(a){
            a = a || event;
            a.returnValue = !1
        };
        g.onclick = function(a){
            a = a || event;
            a.cancelBubble = !0;
            var b = {
                ctrl: a.ctrlKey,
                alt: a.altKey,
                shift: a.shiftKey
            };
            d._doOnClick(this.id.replace("separator_" + d.idPrefix, ""), "--s", b)
        };
        if (a == "TopLevel") {
            if (c != null) 
                c++, c < 0 && (c = 0), this.cont.childNodes[c] != null ? this.cont.insertBefore(g, this.cont.childNodes[c]) : this.cont.appendChild(g);
            else {
                var h = this.cont.childNodes[this.cont.childNodes.length - 1];
                String(h).search("TopLevel_Text") == -1 ? this.cont.appendChild(g) : this.cont.insertBefore(g, h)
            }
            this.idPull[g.id] = g
        }
        else {
            var j = this.idPull["polygon_" + this.itemPull[b].parent];
            c != null && (c++, c < 0 && (c = 0), c > j.tbd.childNodes.length - 1 && (c = null));
            c != null && j.tbd.childNodes[c] != null ? j.tbd.insertBefore(f, j.tbd.childNodes[c]) : j.tbd.appendChild(f);
            e.appendChild(g);
            this.idPull[g.id] = f
        }
    }
};
dhtmlXMenuObject.prototype.addNewSeparator = function(b, c){
    var c = this.idPrefix + (c != null ? c : this._genStr(24)), a = this.idPrefix + this.getParentId(b);
	
    this._addItemIntoGlobalStrorage(c, a, "", "separator", !1, "", "");
    this._renderSeparator(c, this.getItemPosition(b))
};
dhtmlXMenuObject.prototype.hide = function(){
    this._clearAndHide()
};
dhtmlXMenuObject.prototype.clearAll = function(){
    this.removeItem(this.idPrefix + this.topId, !0);
    this._isInited = !1;
    this.idPrefix = this._genStr(12)
};
dhtmlXMenuObject.prototype.unload = function(){
    _isIE ? (document.body.detachEvent("onclick", this._bodyClick), document.body.detachEvent("oncontextmenu", this._bodyContext)) : (window.removeEventListener("click", this._bodyClick, !1), window.removeEventListener("contextmenu", this._bodyContext, !1));
    this._bodyContext = this._bodyClick = null;
    this.removeItem(this.idPrefix + this.topId, !0);
    this.idPull = this.itemPull = null;
    if (this.context) 
        for (var b in this.contextZones) 
            this.removeContextZone(b);
    if (this.cont != null) 
        this.cont.className = "", this.cont.parentNode.removeChild(this.cont), this.cont = null;
    if (this.base != null) {
        this.base.className = "";
        if (!this.context) 
            this.base.oncontextmenu = this.base._oldContextMenuHandler || null;
        this.base = this.base.onselectstart = null
    }
    this.setSkin = null;
    this.detachAllEvents();
    if (this._xmlLoader) 
        this._xmlLoader.destructor(), this._xmlLoader = null;
    this.extendedModule = this.serialize = this.addCheckbox = this.getCheckboxState = this.setCheckboxState = this.addRadioButton = this.setRadioChecked = this.getRadioChecked = this.userData = this.setOverflowHeight = this.contextZones = this.getCircuit = this.clearHref = this.setHref = this.setAlign = this.setRTL = this.setTopText = this.setItemSelected = this.getHotKey = this.setHotKey = this.getTooltip = this.setTooltip = this.setVisibleArea = this.getContextMenuHideAllMode = this.setContextMenuHideAllMode = this.setAutoHideMode = this.setAutoShowMode = this.clearItemImage = this.setItemImage = this.getItemImage = this.enableDynamicLoading = this.setWebModeTimeout = this.setOpenMode = this.getUserData = this.setUserData = this.isItemHidden = this.showItem = this.hideItem = this.loadFromHTML = this.setItemText = this.getItemText = this.isItemEnabled = this.setItemDisabled = this.setItemEnabled = this._removeArrow = this._checkboxOnClickHandler = this._updateCheckboxImage = this._readLevel = this._setCheckboxState = this._getCheckboxState = this._radioOnClickHandler = this._setRadioState = this._getRadioImgObj = this._countPolygonItems = this._doScrollDown = this._doScrollUp = this._isArrowExists = this._removeDownArrow = this._removeUpArrow = this._addDownArrow = this._addUpArrow = this._checkArrowsState = this._clearAllSelectedSubItemsInPolygon = this._updateLoaderIcon = this._changeItemVisible = this._changeItemState = this.hideContextMenu = this.showContextMenu = this.hide = this.detachAllEvents = this.radio = this.items = this.unload = this.dhx_Event = this.detachEvent = this.eventCatcher = this.checkEvent = this.callEvent = this.attachEvent = this.addNewSeparator = this.addNewChild = this.addNewSibling = this.getParentId = this.setItemPosition = this.getItemPosition = this.clearAll = this._hideContextMenu = this._renderSeparator = this._renderSublevelItem = this._renderSublevelPolygon = this._addSubMenuPolygon = this._addItemIntoGlobalStrorage = this._autoDetectVisibleArea = this._doOnContextBeforeCall = this._showContextMenu = this._isContextMenuVisible = this.isContextZone = this.removeContextZone = this.addContextZone = this.renderAsContextMenu = this._getAllParents = this.removeItem = this._updateItemImage = this.setIconPath = this.setIconsPath = this.setImagePath = this._renderToplevelItem = this._initTopLevelMenu = this._redistribTopLevelSelection = this._getItemLevelType = this._updateItemComplexState = this._redefineComplexState = this._countVisiblePolygonItems = this._hideSubLevelItem = this._showSubLevelItem = this._xmlParser = this._buildMenu = this.loadXMLString = this.loadXML = this.init = this.forEachItem = this.getItemType = this._doOnLoad = this._clearAndHide = this._genStr = this._getMenuNodes = this._searchMenuNode = this._doOnTouchMenu = this._doOnClick = this._redistribSubLevelSelection = this._showPolygon = this._hidePolygon = this._getSubItemToDeselectByPolygon = this._removeSubItemFromSelected = this._addSubItemToSelected = this._openedPolygons = this._selectedSubItems = this._enableDacSupport = this.zIndStep = this.zIndInit = this.zInd = this.dacSpeedIE = this.dacSpeed = this.dacCyclesIE = this.dacCycles = this.topId = this.skin = this.userDataTagName = this.itemTipTagName = this.itemTextTagName = this.itemTagName = this.itemHrefTagName = this.itemHotKeyTagName = this.isDhtmlxMenuObject = this.menuTouched = this.menuTimeoutMsec = this.menuTimeoutHandler = this.menuModeTopLevelTimeoutTime = this.menuModeTopLevelTimeout = this.menuMode = this.imagePath = this.idPrefix = this.menuLastClicked = this.menuSelected = this.limit = this.dirTopLevel = this.dirSubLevel = this.fixedPosition = this.loaderIcon = this.dLoadUrl = this.dLoadSign = this.dLoad = this.contextMenuZoneId = this.contextHideAllMode = this.contextAutoShow = this.contextAutoHide = this.context = this.addBaseIdAsContextZone = this._topLevelRightMargin = this._topLevelBottomMargin = this._topLevelOffsetLeft = this._topLevelBottomMargin = this._scrollUpTMTime = this._scrollUpTMStep = this._scrollDownTMTime = this._scrollDownTMStep = this._rtl = this._isInited = this._isIE6 = this._arrowFFFix = this._align = null;
    dhtmlxMenuObjectLiveInstances[this._UID] = null;
    try {
        delete dhtmlxMenuObjectLiveInstances[this._UID]
    } 
    catch (c) {
    }
    this._UID = null
};
var dhtmlxMenuObjectLiveInstances = {};
dhtmlXMenuObject.prototype.i18n = {
    dhxmenuextalert: "dhtmlxmenu_ext.js required"
};
(function(){
    dhtmlx.extend_api("dhtmlXMenuObject", {
        _init: function(b){
            return [b.parent, b.skin]
        },
        align: "setAlign",
        top_text: "setTopText",
        context: "renderAsContextMenu",
        icon_path: "setIconsPath",
        open_mode: "setOpenMode",
        rtl: "setRTL",
        skin: "setSkin",
        dynamic: "enableDynamicLoading",
        xml: "loadXML",
        items: "items",
        overflow: "setOverflowHeight"
    }, {
        items: function(b, c){
            for (var a = 1E5, d = null, f = 0; f < b.length; f++) {
                var e = b[f];
                e.type == "separator" ? (this.addNewSeparator(d, a, e.id), d = e.id) : (this.addNewChild(c, a, e.id, e.text, e.disabled, e.img, e.img_disabled), d = e.id, e.items && this.items(e.items, e.id))
            }
        }
    })
})();

//v.3.0 build 110707
/*

 Copyright DHTMLX LTD. http://www.dhtmlx.com

 You allowed to use this component or parts of it under GPL terms

 To use it on other terms or get Professional edition of the component please contact us at sales@dhtmlx.com

 */

