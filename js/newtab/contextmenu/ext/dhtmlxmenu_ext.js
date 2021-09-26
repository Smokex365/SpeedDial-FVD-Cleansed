//v.3.0 build 110707

/*
 Copyright DHTMLX LTD. http://www.dhtmlx.com
 You allowed to use this component or parts of it under GPL terms
 To use it on other terms or get Professional edition of the component please contact us at sales@dhtmlx.com
 */
dhtmlXMenuObject.prototype.extendedModule = "DHXMENUEXT";
dhtmlXMenuObject.prototype.setItemEnabled = function(a){
    this._changeItemState(a, "enabled", this._getItemLevelType(a))
};
dhtmlXMenuObject.prototype.setItemDisabled = function(a){
    this._changeItemState(a, "disabled", this._getItemLevelType(a))
};
dhtmlXMenuObject.prototype.isItemEnabled = function(a){
    return this.itemPull[this.idPrefix + a] != null ? this.itemPull[this.idPrefix + a].state == "enabled" : !1
};
dhtmlXMenuObject.prototype._changeItemState = function(a, c, b){
    var d = !1, e = this.idPrefix + a;
    if (this.itemPull[e] != null && this.idPull[e] != null && this.itemPull[e].state != c) 
        this.itemPull[e].state = c, this.idPull[e].className = this.itemPull[e].parent == this.idPrefix + this.topId && !this.context ? "dhtmlxMenu_" + this.skin + "_TopLevel_Item_" + (this.itemPull[e].state == "enabled" ? "Normal" : "Disabled") : "sub_item" + (this.itemPull[e].state == "enabled" ? "" : "_dis"), this._updateItemComplexState(this.idPrefix + a, this.itemPull[this.idPrefix +
        a].complex, !1), this._updateItemImage(a, b), this.idPrefix + this.menuLastClicked == e && b != "TopLevel" && this._redistribSubLevelSelection(e, this.itemPull[e].parent);
    return d
};
dhtmlXMenuObject.prototype.getItemText = function(a){
    return this.itemPull[this.idPrefix + a] != null ? this.itemPull[this.idPrefix + a].title : ""
};
dhtmlXMenuObject.prototype.setItemText = function(a, c){
    a = this.idPrefix + a;
    if (this.itemPull[a] != null && this.idPull[a] != null) 
        if (this._clearAndHide(), this.itemPull[a].title = c, this.itemPull[a].parent == this.idPrefix + this.topId && !this.context) {
            for (var b = null, d = 0; d < this.idPull[a].childNodes.length; d++) 
                try {
                    this.idPull[a].childNodes[d].className == "top_level_text" && (b = this.idPull[a].childNodes[d])
                } 
                catch (e) {
                }
            if (String(this.itemPull[a].title).length == "" || this.itemPull[a].title == null) 
                b != null && b.parentNode.removeChild(b);
            else {
                if (!b) 
                    b = document.createElement("DIV"), b.className = "top_level_text", this._rtl && this.idPull[a].childNodes.length > 0 ? this.idPull[a].insertBefore(b, this.idPull[a].childNodes[0]) : this.idPull[a].appendChild(b);
                b.innerHTML = this.itemPull[a].title
            }
        }
        else {
            b = null;
            for (d = 0; d < this.idPull[a].childNodes[1].childNodes.length; d++) 
                if (String(this.idPull[a].childNodes[1].childNodes[d].className || "") == "sub_item_text") 
                    b = this.idPull[a].childNodes[1].childNodes[d];
            if (String(this.itemPull[a].title).length == "" ||
            this.itemPull[a].title ==
            null) {
                if (b) 
                    b.parentNode.removeChild(b), b = null, this.idPull[a].childNodes[1].innerHTML = "&nbsp;"
            }
            else {
                if (!b) 
                    b = document.createElement("DIV"), b.className = "sub_item_text", this.idPull[a].childNodes[1].innerHTML = "", this.idPull[a].childNodes[1].appendChild(b);
                b.innerHTML = this.itemPull[a].title
            }
        }
};
dhtmlXMenuObject.prototype.loadFromHTML = function(a, c, b){
    this.itemTagName = "DIV";
    typeof a == "string" && (a = document.getElementById(a));
    this._buildMenu(a, null);
    this.init();
    c && a.parentNode.removeChild(a);
    b != null && b()
};
dhtmlXMenuObject.prototype.hideItem = function(a){
    this._changeItemVisible(a, !1)
};
dhtmlXMenuObject.prototype.showItem = function(a){
    this._changeItemVisible(a, !0)
};
dhtmlXMenuObject.prototype.isItemHidden = function(a){
    var c = null;
    this.idPull[this.idPrefix + a] != null && (c = this.idPull[this.idPrefix + a].style.display == "none");
    return c
};
dhtmlXMenuObject.prototype._changeItemVisible = function(a, c){
    var b = this.idPrefix + a;
    if (this.itemPull[b] != null && (this.itemPull[b].type == "separator" && (b = "separator_" + b), this.idPull[b] != null)) 
        this.idPull[b].style.display = c ? "" : "none", this._redefineComplexState(this.itemPull[this.idPrefix + a].parent)
};
dhtmlXMenuObject.prototype.setUserData = function(a, c, b){
    this.userData[this.idPrefix + a + "_" + c] = b
};
dhtmlXMenuObject.prototype.getUserData = function(a, c){
    return this.userData[this.idPrefix + a + "_" + c] != null ? this.userData[this.idPrefix + a + "_" + c] : null
};
dhtmlXMenuObject.prototype.setOpenMode = function(a){
    if (a == "win" || a == "web") 
        this.menuMode = a
};
dhtmlXMenuObject.prototype.setWebModeTimeout = function(a){
    this.menuTimeoutMsec = !isNaN(a) ? a : 400
};
dhtmlXMenuObject.prototype.enableDynamicLoading = function(a, c){
    this.dLoad = !0;
    this.dLoadUrl = a;
    this.dLoadSign = String(this.dLoadUrl).search(/\?/) == -1 ? "?" : "&";
    this.loaderIcon = c;
    this.init()
};
dhtmlXMenuObject.prototype._updateLoaderIcon = function(a, c){
    if (this.idPull[a] != null && !(String(this.idPull[a].className).search("TopLevel_Item") >= 0)) {
        var b = this._rtl ? 0 : 2;
        if (this.idPull[a].childNodes[b] && this.idPull[a].childNodes[b].childNodes[0]) {
            var d = this.idPull[a].childNodes[b].childNodes[0];
            if (String(d.className).search("complex_arrow") === 0) 
                d.className = "complex_arrow" + (c ? "_loading" : "")
        }
    }
};
dhtmlXMenuObject.prototype.getItemImage = function(a){
    var c = [null, null], a = this.idPrefix + a;
    if (this.itemPull[a].type == "item") 
        c[0] = this.itemPull[a].imgen, c[1] = this.itemPull[a].imgdis;
    return c
};
dhtmlXMenuObject.prototype.setItemImage = function(a, c, b){
    if (this.itemPull[this.idPrefix + a].type == "item") 
        this.itemPull[this.idPrefix + a].imgen = c, this.itemPull[this.idPrefix + a].imgdis = b, this._updateItemImage(a, this._getItemLevelType(a))
};
dhtmlXMenuObject.prototype.clearItemImage = function(a){
    this.setItemImage(a, "", "")
};
dhtmlXMenuObject.prototype.setAutoShowMode = function(a){
    this.contextAutoShow = a == !0 ? !0 : !1
};
dhtmlXMenuObject.prototype.setAutoHideMode = function(a){
    this.contextAutoHide = a == !0 ? !0 : !1
};
dhtmlXMenuObject.prototype.setContextMenuHideAllMode = function(a){
    this.contextHideAllMode = a == !0 ? !0 : !1
};
dhtmlXMenuObject.prototype.getContextMenuHideAllMode = function(){
    return this.contextHideAllMode
};
dhtmlXMenuObject.prototype.setVisibleArea = function(a, c, b, d){
    this._isVisibleArea = !0;
    this.menuX1 = a;
    this.menuX2 = c;
    this.menuY1 = b;
    this.menuY2 = d
};
dhtmlXMenuObject.prototype.setTooltip = function(a, c){
    a = this.idPrefix + a;
    if (this.itemPull[a] != null && this.idPull[a] != null) 
        this.idPull[a].title = c.length > 0 ? c : null, this.itemPull[a].tip = c
};
dhtmlXMenuObject.prototype.getTooltip = function(a){
    return this.itemPull[this.idPrefix + a] == null ? null : this.itemPull[this.idPrefix + a].tip
};
dhtmlXMenuObject.prototype.setHotKey = function(a, c){
    a = this.idPrefix + a;
    if (this.itemPull[a] != null && this.idPull[a] != null && (this.itemPull[a].parent != this.idPrefix + this.topId || this.context) && !this.itemPull[a].complex) {
        var b = this.itemPull[a].type;
        if (b == "item" || b == "checkbox" || b == "radio") {
            var d = null;
            try {
                if (this.idPull[a].childNodes[this._rtl ? 0 : 2].childNodes[0].className == "sub_item_hk") 
                    d = this.idPull[a].childNodes[this._rtl ? 0 : 2].childNodes[0]
            } 
            catch (e) {
            }
            if (c.length == 0) 
                this.itemPull[a].hotkey_backup = this.itemPull[a].hotkey, this.itemPull[a].hotkey = "", d != null && d.parentNode.removeChild(d);
            else {
                this.itemPull[a].hotkey = c;
                this.itemPull[a].hotkey_backup = null;
                if (d == null) {
                    d = document.createElement("DIV");
                    d.className = "sub_item_hk";
                    for (var f = this.idPull[a].childNodes[this._rtl ? 0 : 2]; f.childNodes.length > 0;) 
                        f.removeChild(f.childNodes[0]);
                    f.appendChild(d)
                }
                d.innerHTML = c
            }
        }
    }
};
dhtmlXMenuObject.prototype.getHotKey = function(a){
    return this.itemPull[this.idPrefix + a] == null ? null : this.itemPull[this.idPrefix + a].hotkey
};
dhtmlXMenuObject.prototype.setItemSelected = function(a){
    if (this.itemPull[this.idPrefix + a] == null) 
        return null
};
dhtmlXMenuObject.prototype.setTopText = function(a){
    if (!this.context) {
        if (this._topText == null) 
            this._topText = document.createElement("DIV"), this._topText.className = "dhtmlxMenu_TopLevel_Text_" + (this._rtl ? "left" : this._align == "left" ? "right" : "left"), this.base.appendChild(this._topText);
        this._topText.innerHTML = a
    }
};
dhtmlXMenuObject.prototype.setAlign = function(a){
    if (this._align != a && (a == "left" || a == "right")) {
        this._align = a;
        if (this.cont) 
            this.cont.className = this._align == "right" ? "align_right" : "align_left";
        if (this._topText != null) 
            this._topText.className = "dhtmlxMenu_TopLevel_Text_" + (this._align == "left" ? "right" : "left")
    }
};
dhtmlXMenuObject.prototype.setHref = function(a, c, b){
    if (this.itemPull[this.idPrefix + a] != null) 
        this.itemPull[this.idPrefix + a].href_link = c, b != null && (this.itemPull[this.idPrefix + a].href_target = b)
};
dhtmlXMenuObject.prototype.clearHref = function(a){
    this.itemPull[this.idPrefix + a] != null && (delete this.itemPull[this.idPrefix + a].href_link, delete this.itemPull[this.idPrefix + a].href_target)
};
dhtmlXMenuObject.prototype.getCircuit = function(a){
    for (var c = Array(a); this.getParentId(a) != this.topId;) 
        a = this.getParentId(a), c[c.length] = a;
    return c.reverse()
};
dhtmlXMenuObject.prototype._clearAllSelectedSubItemsInPolygon = function(a){
    for (var c = this._getSubItemToDeselectByPolygon(a), b = 0; b < this._openedPolygons.length; b++) 
        this._openedPolygons[b] != a && this._hidePolygon(this._openedPolygons[b]);
    for (b = 0; b < c.length; b++) 
        if (this.idPull[c[b]] != null && this.itemPull[c[b]].state == "enabled") 
            this.idPull[c[b]].className = "dhtmlxMenu_" + this.skin + "_SubLevelArea_Item_Normal"
};
dhtmlXMenuObject.prototype._checkArrowsState = function(a){
    var c = this.idPull["polygon_" + a], b = this.idPull["arrowup_" + a], d = this.idPull["arrowdown_" + a];
    b.className = c.scrollTop == 0 ? "dhtmlxMenu_" + this.skin + "_SubLevelArea_ArrowUp_Disabled" : "dhtmlxMenu_" + this.skin + "_SubLevelArea_ArrowUp" + (b.over ? "_Over" : "");
    d.className = c.scrollTop + c.offsetHeight < c.scrollHeight ? "dhtmlxMenu_" + this.skin + "_SubLevelArea_ArrowDown" + (d.over ? "_Over" : "") : "dhtmlxMenu_" + this.skin + "_SubLevelArea_ArrowDown_Disabled"
};
dhtmlXMenuObject.prototype._addUpArrow = function(a){
    var c = this, b = document.createElement("DIV");
    b.pId = this.idPrefix + a;
    b.id = "arrowup_" + this.idPrefix + a;
    b.className = "dhtmlxMenu_" + this.skin + "_SubLevelArea_ArrowUp";
    b.innerHTML = "<div class='dhtmlxMenu_" + this.skin + "_SubLevelArea_Arrow'><div class='dhtmlxMenu_SubLevelArea_Arrow_Icon'></div></div>";
    b.style.display = "none";
    b.over = !1;
    b.onselectstart = function(a){
        a = a || event;
        return a.returnValue = !1
    };
    b.oncontextmenu = function(a){
        a = a || event;
        return a.returnValue = !1
    };
    b.onmouseover = function(){
        c.menuMode == "web" && window.clearTimeout(c.menuTimeoutHandler);
        c._clearAllSelectedSubItemsInPolygon(this.pId);
        if (this.className != "dhtmlxMenu_" + c.skin + "_SubLevelArea_ArrowUp_Disabled") 
            this.className = "dhtmlxMenu_" + c.skin + "_SubLevelArea_ArrowUp_Over", this.over = !0, c._canScrollUp = !0, c._doScrollUp(this.pId, !0)
    };
    b.onmouseout = function(){
        if (c.menuMode == "web") 
            window.clearTimeout(c.menuTimeoutHandler), c.menuTimeoutHandler = window.setTimeout(function(){
                c._clearAndHide()
            }, c.menuTimeoutMsec, "JavaScript");
        this.over = !1;
        c._canScrollUp = !1;
        if (this.className != "dhtmlxMenu_" + c.skin + "_SubLevelArea_ArrowUp_Disabled") 
            this.className = "dhtmlxMenu_" + c.skin + "_SubLevelArea_ArrowUp", window.clearTimeout(c._scrollUpTM)
    };
    b.onclick = function(a){
        a = a || event;
        a.returnValue = !1;
        a.cancelBubble = !0;
        return !1
    };
    document.body.insertBefore(b, document.body.firstChild);
    this.idPull[b.id] = b
};
dhtmlXMenuObject.prototype._addDownArrow = function(a){
    var c = this, b = document.createElement("DIV");
    b.pId = this.idPrefix + a;
    b.id = "arrowdown_" + this.idPrefix + a;
    b.className = "dhtmlxMenu_" + this.skin + "_SubLevelArea_ArrowDown";
    b.innerHTML = "<div class='dhtmlxMenu_" + this.skin + "_SubLevelArea_Arrow'><div class='dhtmlxMenu_SubLevelArea_Arrow_Icon'></div></div>";
    b.style.display = "none";
    b.over = !1;
    b.onselectstart = function(a){
        a = a || event;
        return a.returnValue = !1
    };
    b.oncontextmenu = function(a){
        a = a || event;
        return a.returnValue = !1
    };
    b.onmouseover = function(){
        c.menuMode == "web" && window.clearTimeout(c.menuTimeoutHandler);
        c._clearAllSelectedSubItemsInPolygon(this.pId);
        if (this.className != "dhtmlxMenu_" + c.skin + "_SubLevelArea_ArrowDown_Disabled") 
            this.className = "dhtmlxMenu_" + c.skin + "_SubLevelArea_ArrowDown_Over", this.over = !0, c._canScrollDown = !0, c._doScrollDown(this.pId, !0)
    };
    b.onmouseout = function(){
        if (c.menuMode == "web") 
            window.clearTimeout(c.menuTimeoutHandler), c.menuTimeoutHandler = window.setTimeout(function(){
                c._clearAndHide()
            }, c.menuTimeoutMsec, "JavaScript");
        this.over = !1;
        c._canScrollDown = !1;
        if (this.className != "dhtmlxMenu_" + c.skin + "_SubLevelArea_ArrowDown_Disabled") 
            this.className = "dhtmlxMenu_" + c.skin + "_SubLevelArea_ArrowDown", window.clearTimeout(c._scrollDownTM)
    };
    b.onclick = function(a){
        a = a || event;
        a.returnValue = !1;
        a.cancelBubble = !0;
        return !1
    };
    document.body.insertBefore(b, document.body.firstChild);
    this.idPull[b.id] = b
};
dhtmlXMenuObject.prototype._removeUpArrow = function(a){
    var c = "arrowup_" + this.idPrefix + a;
    this._removeArrow(c)
};
dhtmlXMenuObject.prototype._removeDownArrow = function(a){
    var c = "arrowdown_" + this.idPrefix + a;
    this._removeArrow(c)
};
dhtmlXMenuObject.prototype._removeArrow = function(a){
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
        delete this.idPull[a]
    } 
    catch (b) {
    }
};
dhtmlXMenuObject.prototype._isArrowExists = function(a){
    return this.idPull["arrowup_" + a] != null && this.idPull["arrowdown_" + a] != null ? !0 : !1
};
dhtmlXMenuObject.prototype._doScrollUp = function(a, c){
    var b = this.idPull["polygon_" + a];
    if (this._canScrollUp && b.scrollTop > 0) {
        var d = !1, e = b.scrollTop - this._scrollUpTMStep;
        e < 0 && (d = !0, e = 0);
        b.scrollTop = e;
        if (!d) {
            var f = this;
            this._scrollUpTM = window.setTimeout(function(){
                f._doScrollUp(a, !1)
            }, this._scrollUpTMTime)
        }
    }
    else 
        this._canScrollUp = !1, this._checkArrowsState(a);
    c && this._checkArrowsState(a)
};
dhtmlXMenuObject.prototype._doScrollDown = function(a, c){
    var b = this.idPull["polygon_" + a];
    if (this._canScrollDown && b.scrollTop + b.offsetHeight <= b.scrollHeight) {
        var d = !1, e = b.scrollTop + this._scrollDownTMStep;
        e + b.offsetHeight > b.scollHeight && (d = !0, e = b.scollHeight - b.offsetHeight);
        b.scrollTop = e;
        if (!d) {
            var f = this;
            this._scrollDownTM = window.setTimeout(function(){
                f._doScrollDown(a, !1)
            }, this._scrollDownTMTime)
        }
    }
    else 
        this._checkArrowsState(a);
    c && this._checkArrowsState(a)
};
dhtmlXMenuObject.prototype._countPolygonItems = function(a){
    var c = 0, b;
    for (b in this.itemPull) {
        var d = this.itemPull[b].parent, e = this.itemPull[b].type;
        d == this.idPrefix + a && (e == "item" || e == "radio" || e == "checkbox") && c++
    }
    return c
};
dhtmlXMenuObject.prototype.setOverflowHeight = function(a){
    if (!(this.limit == 0 && a <= 0)) 
        if (this._clearAndHide(), this.limit >= 0 && a > 0) 
            this.limit = a;
        else 
            if (this.limit > 0 && a <= 0) {
                for (var c in this.itemPull) 
                    if (this._isArrowExists(c)) {
                        var b = String(c).replace(this.idPrefix, "");
                        this._removeUpArrow(b);
                        this._removeDownArrow(b);
                        this.idPull["polygon_" + c].style.height = ""
                    }
                this.limit = 0
            }
};
dhtmlXMenuObject.prototype._getRadioImgObj = function(a){
    try {
        var c = this.idPull[this.idPrefix + a].childNodes[this._rtl ? 2 : 0].childNodes[0]
    } 
    catch (b) {
        c = null
    }
    return c
};
dhtmlXMenuObject.prototype._setRadioState = function(a, c){
    var b = this._getRadioImgObj(a);
    if (b != null) {
        var d = this.itemPull[this.idPrefix + a];
        d.checked = c;
        d.imgen = "rdbt_" + (d.checked ? "1" : "0");
        d.imgdis = d.imgen;
        b.className = "sub_icon " + d.imgen
    }
};
dhtmlXMenuObject.prototype._radioOnClickHandler = function(a, c, b){
    if (!(c.charAt(1) == "d" || this.itemPull[this.idPrefix + a].group == null)) {
        var d = this.itemPull[this.idPrefix + a].group;
        this.checkEvent("onRadioClick") ? this.callEvent("onRadioClick", [d, this.getRadioChecked(d), a, this.contextMenuZoneId, b]) && this.setRadioChecked(d, a) : this.setRadioChecked(d, a);
        this.checkEvent("onClick") && this.callEvent("onClick", [a])
    }
};
dhtmlXMenuObject.prototype.getRadioChecked = function(a){
    for (var c = null, b = 0; b < this.radio[a].length; b++) {
        var d = this.radio[a][b].replace(this.idPrefix, ""), e = this._getRadioImgObj(d);
        if (e != null) {
            var f = e.className.match(/rdbt_1$/gi);
            f != null && (c = d)
        }
    }
    return c
};
dhtmlXMenuObject.prototype.setRadioChecked = function(a, c){
    if (this.radio[a] != null) 
        for (var b = 0; b < this.radio[a].length; b++) {
            var d = this.radio[a][b].replace(this.idPrefix, "");
            this._setRadioState(d, d == c)
        }
};
dhtmlXMenuObject.prototype.addRadioButton = function(a, c, b, d, e, f, k, i){
    if (!(this.context && c == this.topId)) {
        if (this.itemPull[this.idPrefix + c] == null) 
            return;
        if (a == "child" && this.itemPull[this.idPrefix + c].type != "item") 
            return
    }
    var h = this.idPrefix + (d != null ? d : this._genStr(24)), g = "rdbt_" + (k ? "1" : "0"), j = g;
    if (a == "sibling") {
        var l = this.idPrefix + this.getParentId(c);
        this._addItemIntoGlobalStrorage(h, l, e, "radio", i, g, j);
        this._renderSublevelItem(h, this.getItemPosition(c))
    }
    else 
        l = this.idPrefix + c, this._addItemIntoGlobalStrorage(h, l, e, "radio", i, g, j), this.idPull["polygon_" + l] == null && this._renderSublevelPolygon(l, l), this._renderSublevelItem(h, b - 1), this._redefineComplexState(l);
    var m = f != null ? f : this._genStr(24);
    this.itemPull[h].group = m;
    this.radio[m] == null && (this.radio[m] = []);
    this.radio[m][this.radio[m].length] = h;
    k == !0 && this.setRadioChecked(m, String(h).replace(this.idPrefix, ""))
};
dhtmlXMenuObject.prototype._getCheckboxState = function(a){
    return this.itemPull[this.idPrefix + a] == null ? null : this.itemPull[this.idPrefix + a].checked
};
dhtmlXMenuObject.prototype._setCheckboxState = function(a, c){
    this.itemPull[this.idPrefix + a] != null && (this.itemPull[this.idPrefix + a].checked = c)
};
dhtmlXMenuObject.prototype._updateCheckboxImage = function(a){
    if (this.idPull[this.idPrefix + a] != null) {
        this.itemPull[this.idPrefix + a].imgen = "chbx_" + (this._getCheckboxState(a) ? "1" : "0");
        this.itemPull[this.idPrefix + a].imgdis = this.itemPull[this.idPrefix + a].imgen;
        try {
            this.idPull[this.idPrefix + a].childNodes[this._rtl ? 2 : 0].childNodes[0].className = "sub_icon " + this.itemPull[this.idPrefix + a].imgen
        } 
        catch (c) {
        }
    }
};
dhtmlXMenuObject.prototype._checkboxOnClickHandler = function(a, c, b){
    if (c.charAt(1) != "d" && this.itemPull[this.idPrefix + a] != null) {
        var d = this._getCheckboxState(a);
        this.checkEvent("onCheckboxClick") ? this.callEvent("onCheckboxClick", [a, d, this.contextMenuZoneId, b]) && this.setCheckboxState(a, !d) : this.setCheckboxState(a, !d);
        this.checkEvent("onClick") && this.callEvent("onClick", [a,this.contextMenuZoneId])
    }
};
dhtmlXMenuObject.prototype.setCheckboxState = function(a, c){
    this._setCheckboxState(a, c);
    this._updateCheckboxImage(a)
};
dhtmlXMenuObject.prototype.getCheckboxState = function(a){
    return this._getCheckboxState(a)
};
dhtmlXMenuObject.prototype.addCheckbox = function(a, c, b, d, e, f, k){
    if (!(this.context && c == this.topId)) {
        if (this.itemPull[this.idPrefix + c] == null) 
            return;
        if (a == "child" && this.itemPull[this.idPrefix + c].type != "item") 
            return
    }
    var i = "chbx_" + (f ? "1" : "0"), h = i;
    if (a == "sibling") {
        var g = this.idPrefix + (d != null ? d : this._genStr(24)), j = this.idPrefix + this.getParentId(c);
        this._addItemIntoGlobalStrorage(g, j, e, "checkbox", k, i, h);
        this.itemPull[g].checked = f;
        this._renderSublevelItem(g, this.getItemPosition(c))
    }
    else 
        g = this.idPrefix +
        (d !=
        null ? d : this._genStr(24)), j = this.idPrefix + c, this._addItemIntoGlobalStrorage(g, j, e, "checkbox", k, i, h), this.itemPull[g].checked = f, this.idPull["polygon_" + j] == null && this._renderSublevelPolygon(j, j), this._renderSublevelItem(g, b - 1), this._redefineComplexState(j)
};
dhtmlXMenuObject.prototype._readLevel = function(a){
    var c = "", b;
    for (b in this.itemPull) 
        if (this.itemPull[b].parent == a) {
            var d = "", e = "", f = "", k = String(this.itemPull[b].id).replace(this.idPrefix, ""), i = "", h = this.itemPull[b].title != "" ? ' text="' + this.itemPull[b].title + '"' : "", g = "";
            this.itemPull[b].type == "item" &&
            (this.itemPull[b].imgen != "" && (d = ' img="' + this.itemPull[b].imgen + '"'), this.itemPull[b].imgdis != "" && (e = ' imgdis="' + this.itemPull[b].imgdis + '"'), this.itemPull[b].hotkey != "" &&
            (f = "<hotkey>" + this.itemPull[b].hotkey +
            "</hotkey>"));
            this.itemPull[b].type == "separator" ? i = ' type="separator"' : this.itemPull[b].state == "disabled" && (g = ' enabled="false"');
            this.itemPull[b].type == "checkbox" && (i = ' type="checkbox"' + (this.itemPull[b].checked ? ' checked="true"' : ""));
            this.itemPull[b].type == "radio" && (i = ' type="radio" group="' + this.itemPull[b].group + '" ' + (this.itemPull[b].checked ? ' checked="true"' : ""));
            c += "<item id='" + k + "'" + h + i + d + e + g + ">";
            c += f;
            this.itemPull[b].complex && (c += this._readLevel(b));
            c += "</item>"
        }
    return c
};
dhtmlXMenuObject.prototype.serialize = function(){
    var a = "<menu>" + this._readLevel(this.idPrefix + this.topId) + "</menu>";
    return a
};

//v.3.0 build 110707
/*

 Copyright DHTMLX LTD. http://www.dhtmlx.com

 You allowed to use this component or parts of it under GPL terms

 To use it on other terms or get Professional edition of the component please contact us at sales@dhtmlx.com

 */

