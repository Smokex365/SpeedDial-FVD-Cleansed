function _b( v ){
  if( typeof v == "boolean" ){
    return v;
  }

  if( v == "true" ){
    return true;
  }

  return false;
}

function _isb( v ){
  if( typeof v == "boolean" ){
    return true;
  }

  if( v == "true" || v == "false" ){
    return true;
  }

  return false;
}

function _r( v ){

  if( _isb( v ) ){
    return _b(v);
  }
  return v;

}

function _array( list ){

  var result = [];

  for( var i = 0; i != list.length; i++ ){
    result.push( list[i] );
  }

  return result;

}

Element.prototype.insertAfter = function( newElem, targetElem ){

  if( this.lastChild == targetElem ){
    this.appendChild( newElem );
  }
  else{
    this.insertBefore( newElem, targetElem.nextSibling );
  }

};

function FVDEventEmitter() {
  var callbacks = [];

  this.addListener = function( listener ){

    callbacks.push( listener );

  };

  this.removeListener = function( listener ){

    var index = callbacks.indexOf( listener );

    if( index != -1 ){
      callbacks.splice( index, 1 );
    }

  };

  this.callListeners = function() {
    var args = arguments;
    var toRemove = [];
    callbacks.forEach(function( callback ){
      try {
        callback.apply( window, args );
      }
      catch( ex ){
        toRemove.push( callback );
      }
    });
    toRemove.forEach(function( callback ){
      var index = callbacks.indexOf( callback );
      if( index > -1 ){
        callbacks.splice( index, 1 );
      }
    });
  };
};


// extends


(function(){

  var Utils = function(){

  };

  Utils.prototype = {

    _isVersionChanged: false,
    measureTextCanvases: {},
    hostRegExp: /^https?:\/\/(?:[^@:/]*@)?([^:/]+)/,


    getRandomString: function(length) {
      length = length || 5
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

      return text;
    },

    // compare two versions
    vcmp: function(a, b) {
      var pa = a.split('.');
      var pb = b.split('.');
      for (var i = 0; i < 3; i++) {
          var na = Number(pa[i]);
          var nb = Number(pb[i]);
          if (na > nb) return 1;
          if (nb > na) return -1;
          if (!isNaN(na) && isNaN(nb)) return 1;
          if (isNaN(na) && !isNaN(nb)) return -1;
      }
      return 0;
    },

    debounce: function(func, wait, immediate) {
      var timeout;
      return function() {
        var context = this, args = arguments;
        var later = function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      };
    },

    measureText: function(canvasFontDefinition, text) {
      var canvas;
      if(this.measureTextCanvases[canvasFontDefinition]) {
        canvas = this.measureTextCanvases[canvasFontDefinition];
      }
      else {
        canvas = document.createElement('canvas');
        this.measureTextCanvases[canvasFontDefinition] = canvas;
      }
      var ctx = canvas.getContext('2d');
      ctx.font = canvasFontDefinition;
      return ctx.measureText(text).width;
    },

    getChromeVersion: function() {
      var match = navigator.userAgent.match(/Chrome\/([0-9\.]+)/i);
      if(!match) {
        return null;
      }
      return match[1];
    },

    isActiveTab: function(cb) {
      chrome.tabs.getCurrent(function( tab ){
        if( tab ){
          cb(tab.active);
        }
      });
    },

    getRandomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    clone: function( obj ){
      return JSON.parse( JSON.stringify( obj ) );
    },

    shuffle: function(inputArr) {
      var valArr = [],
        k = '',
        i = 0,
        strictForIn = false,
        populateArr = [];

      for (k in inputArr) { // Get key and value arrays
        if (inputArr.hasOwnProperty(k)) {
          valArr.push(inputArr[k]);
          if (strictForIn) {
            delete inputArr[k];
          }
        }
      }
      valArr.sort(function() {
        return 0.5 - Math.random();
      });

      // BEGIN REDUNDANT
      this.php_js = this.php_js || {};
      this.php_js.ini = this.php_js.ini || {};
      // END REDUNDANT
      strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
        .ini['phpjs.strictForIn'].local_value !== 'off';
      populateArr = strictForIn ? inputArr : populateArr;

      for (i = 0; i < valArr.length; i++) { // Repopulate the old array
        populateArr[i] = valArr[i];
      }

      return strictForIn || populateArr;
    },

    getUserCountry: function(cb) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "https://everhelper.me/spec/country.php");
      xhr.onload = function() {
        cb(xhr.responseText);
      };
      xhr.send(null);
    },

    getUserClientDetails: function(cb) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "https://everhelper.me/spec/country.php?detailed=1");
      xhr.onload = function() {
        cb(null, JSON.parse(xhr.responseText));
      };
      xhr.send(null);
    },

    hasEqualElements: function (a, b){

      for( var i = 0; i != a.length; i++ ){
        if( b.indexOf( a[i] ) != -1 ){
          return true;
        }
      }

      return false;

    },

    validateText: function( type, text ){
      switch( type ){
        case "email":
          var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          return re.test( text );
        break;
      }
    },

    getQueryValue: function( variable ){

      var query = window.location.hash.substring(1);
      var vars = query.split('&');
      for (var i = 0; i < vars.length; i++) {
          var pair = vars[i].split('=');
          if (decodeURIComponent(pair[0]) == variable) {
              return decodeURIComponent(pair[1]);
          }
      }

      return null;

    },

    arrayDiff: function( a1, a2 ){
      return a1.filter(function(i) {return !(a2.indexOf(i) > -1);});
    },

    urlToCompareForm: function( url ){
      url = url.toLowerCase();
      url = url.replace( /https?:\/\//i, "" );
      url = url.replace( /^www\./i, "" );
      url = url.replace( /\/+$/i, "" );

      return url;
    },

    isValidUrl: function( url ){

      if( url.indexOf( "file:///" ) === 0 ){
        return true;
      }

      try{
        var parsed = this.parseUrl( url );
        if( !parsed.host ){
          return false;
        }

        /*
        if( parsed.host.indexOf(".") == -1 ){
          return false;
        }
        */

        if( parsed.host.length < 2 ){
          return false;
        }

        return true;
      }
      catch( ex ){
        return false;
      }
    },

    getMainDomain: function(domain) {
      var parts = String(domain || '').split("."),
          result = "",
          countParts = parts.length;
      if(parts.length > 1) {
        result = parts[countParts-2]+"."+parts[countParts-1];
      }
      else {
        result = parts[countParts-1];
      }
      return result;
    },

    isIdenticalUrls: function( url1, url2 ){
      url1 = this.urlToCompareForm( url1 );
      url2 = this.urlToCompareForm( url2 );

      return url1 == url2;
    },

    isIdenticalHosts: function( host1, host2, params ){
      params = params || {};
      if(params.ignoreSubDomains) {
        host1 = this.getMainDomain(host1);
        host2 = this.getMainDomain(host2);
      }
      host1 = this.urlToCompareForm( host1 );
      host2 = this.urlToCompareForm( host2 );

      return host1 == host2;
    },

    httpBuildQuery: function(data) {
      let arr = []
      for(let k in data) {
        arr.push(k + '=' + encodeURIComponent(data[k]))
      }
      return arr.join('&')
    },

    buildUrlFromParsed: function( parsed ){

      var url = parsed.scheme + "://";

      if( parsed.user && parsed.pass ){
        url += parsed.user + ":" + parsed.pass + "@";
      }
      else if( parsed.user ){
        url += parsed.user + "@";
      }

      url += parsed.host;

      if( parsed.path ){
        url += parsed.path;
      }

      if( parsed.query ){
        url += "?" + parsed.query;
      }

      if( parsed.fragment ){
        url += "#" + parsed.query;
      }

      return url;

    },

    typeToExt: function(type) {
      switch(type) {
        case "image/png":
          return "png";
        break;
        case "image/jpeg":
          return "jpg";
        break;
        case "image/gif":
          return "gif";
        break;
      }
    },

    b64toBlob: function(b64Data, contentType, sliceSize) {
      contentType = contentType || '';
      sliceSize = sliceSize || 512;

      var byteCharacters = atob(b64Data);
      var byteArrays = [];

      for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
      }

      var blob = new Blob(byteArrays, {type: contentType});
      return blob;
    },

    dataURIToBlob: function(url) {
      url = url.replace(/^data:/, "");
      var tmp = url.split(";"),
          contentType = tmp[0];
      url = tmp[1].split(",")[1];
      console.log(contentType);
      return this.b64toBlob(url, contentType);
    },

    parseUrlHost: function(url) {
      var m = url.match(this.hostRegExp);
      if(!m) {
        throw new Error('Fail to parse host')
      }
      return m[1]
    },

    parseUrl: function(str, component){
        var key = ['source', 'scheme', 'authority', 'userInfo', 'user', 'pass', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'fragment'], ini = (this.php_js && this.php_js.ini) ||
        {}, mode = (ini['phpjs.parse_url.mode'] &&
        ini['phpjs.parse_url.mode'].local_value) ||
        'php', parser = {
            php: /^(?:([^:\/?#]+):)?(?:\/\/()(?:(?:()(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?()(?:(()(?:(?:[^?#\/]*\/)*)()(?:[^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/\/?)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ // Added one optional slash to post-scheme to catch file:/// (should restrict this)
        };

        var m = parser[mode].exec(str), uri = {}, i = 14;
        while (i--) {
            if (m[i]) {
                uri[key[i]] = m[i];
            }
        }

        if (component) {
            return uri[component.replace('PHP_URL_', '').toLowerCase()];
        }
        if (mode !== 'php') {
            var name = (ini['phpjs.parse_url.queryKey'] &&
            ini['phpjs.parse_url.queryKey'].local_value) ||
            'queryKey';
            parser = /(?:^|&)([^&=]*)=?([^&]*)/g;
            uri[name] = {};
            uri[key[12]].replace(parser, function($0, $1, $2){
                if ($1) {
                    uri[name][$1] = $2;
                }
            });
        }
        delete uri.source;
        return uri;
    },

    isVisibleElem: function( elem ){

      var viewportHeight = window.innerHeight;
      var currentTopStart = document.body.scrollTop;
      var currentTopEnd = currentTopStart + viewportHeight;

      var elemOffset = this.getOffset( elem );

      if( elemOffset.top > currentTopStart && elemOffset.top + elem.offsetHeight < currentTopEnd ){
        return true;
      }

      return false;

    },

    isVersionChanged: function(){

      var app = chrome.app.getDetails();

      if( fvdSpeedDial.Prefs.get( "last_run_version" ) != app.version ){
        this._isVersionChanged = true;
        fvdSpeedDial.Prefs.set( "last_run_version", app.version );
      }

      return this._isVersionChanged;

    },

    scrollToElem: function( elem ){

      var viewportHeight = window.innerHeight;
      var currentTopStart = document.body.scrollTop;
      var currentTopEnd = currentTopStart + viewportHeight;

      var elemOffset = this.getOffset( elem );

      if( elemOffset.top > currentTopStart && elemOffset.top + elem.offsetHeight < currentTopEnd ){
        return; // no need scroll
      }

      var scrollAmount = 0;
      if( elemOffset.top < currentTopStart ){
        scrollAmount = elemOffset.top;
      }
      else{
        scrollAmount = elemOffset.top + elem.offsetHeight - viewportHeight;
      }

      document.body.scrollTop = scrollAmount;

    },

    getBoundingClientRect: function(elem) {
      var r = elem.getBoundingClientRect();
      var rect = {
        top: r.top + window.scrollY,
        bottom: r.bottom + window.scrollY,
        left: r.left + window.scrollX,
        right: r.right + window.scrollX,
        width: r.width,
        height: r.height
      };
      return rect;
    },

    getOffset: function( obj ) {
      var curleft = 0, curtop = 0;
      if (obj.offsetParent) {
        do {
          curleft += obj.offsetLeft;
          curtop += obj.offsetTop;
        }
        while(obj = obj.offsetParent);
      }



      return {
        "left": curleft,
        "top": curtop
      };
    },

    isChildOf: function( elem, parent ){

      while( true ){

        if( elem == parent ){
          return true;
        }

        if( elem.parentNode ){
          elem = elem.parentNode;
        }
        else{
          return false;
        }

      }

    },

    copyToClipboard: function( text ){
      var clipboardholder = document.createElement("textarea");
      clipboardholder.style.width = "0px";
      clipboardholder.style.height = "0px";
      clipboardholder.style.opacity = 0;
      document.body.appendChild(clipboardholder);
      clipboardholder.value = text;
      clipboardholder.select();
      document.execCommand("Copy");
      document.body.removeChild(clipboardholder);
    },

    ucfirst: function( str ){
      var firstLetter = str.slice(0,1);
      return firstLetter.toUpperCase() + str.substring(1);
    },

    cropLength: function( str, len ){
      if( str.length <= len ){
        return str;
      }

      return str.substring(0, len) + "...";
    },

    setScreenPreview: function( elem, screen, nocache, norepeat, data ){
      if(typeof screen == "string" && screen.indexOf("filesystem:") === 0) {
        if(nocache) {
          screen += "?" + nocache;
        }
      }
      elem.style.background = "";
      elem.style.background = "url("+screen+")";
      //elem.style.backgroundSize = "contain";
      elem.style.backgroundSize = "100%";
      elem.style.backgroundPosition = "top left";
      elem.style.backgroundRepeat = "no-repeat";
      try{
        if(
          typeof data == "object"
          &&
          (
            (data.thumb_width == 30 && data.thumb_height == 30)
            || (typeof data.thumbSize == "object" && data.thumbSize.width == 30 && data.thumbSize.height == 30)
          )
        ){
          elem.classList.add("preview-image-undefined");
        }
      }catch(ex){
        console.warn(ex)
      }
    },

    removeScreenPreview: function( elem ){
      if(elem) {
        elem.style.background = "";
        elem.style.backgroundSize = "";
        elem.style.backgroundPosition = "";
        elem.style.backgroundRepeat = "";
      }
    },

    setUrlPreview: function( elemParams, picParams, nocache ){
      if(typeof picParams.url == "string" && picParams.url.indexOf("filesystem:") === 0) {
        if(nocache) {
          picParams.url += "?" + nocache;
        }
      }
      this.Async.chain( [
        function( callback2 ){
          if( !picParams.size ){
            var img = new Image();
            img.onload = function(){
              picParams.size = {
                width: img.width,
                height: img.height
              };

              callback2();
            };
            img.onerror = function(){
              picParams.size = {
                width: 0,
                height: 0
              };


              callback2();
            };

            img.src = picParams.url;
          }
          else{
            callback2();
          }
        },

        function(  ){
          elemParams.elem.style.background = "url("+picParams.url+")";
          elemParams.elem.style.backgroundPosition = "center center";

          if( picParams.size.width && picParams.size.height &&
              picParams.size.width < elemParams.size.width && picParams.size.height < elemParams.size.height ){
            elemParams.elem.style.backgroundSize = "";
          }
          else{
            elemParams.elem.style.backgroundSize = "contain";
          }

          elemParams.elem.style.backgroundRepeat = "no-repeat";
        }
      ] );

    },

    imageUrlToDataUrl: function(url, callback, format, quality) {
      var img = new Image();
      img.onload = function(){
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0, img.width, img.height);

        if(img.width * img.height < 1024*1024) {
          // limitations due to chrome bug
          // older limitations were 300x300, but now it seems to work with larger pictures
          format = "image/png";
        }

        format = format || "image/jpeg";
        quality = quality || 90;

        callback(canvas.toDataURL(format, quality), {
          width: img.width,
          height: img.height
        });
      };
      img.onerror = function(){
        callback( null );
      };
      img.setAttribute('crossorigin', 'anonymous');
      img.src = url;
    },

    getUrlContent: function( url, callback ){
      var req = new XMLHttpRequest();
      req.open( "GET", url );
      req.onload = function(){
        callback( req.responseText );
      };
      req.onerror = function(){
        callback( null );
      };
      req.send();
    },

    cacheTitle: {},
    getTitleReq: false,
    getTitleForUrl: function( url, callback, abort ){
        var that = this;
        if(that.cacheTitle[url]){
          return callback(this.cacheTitle[url]);
        }
        if(abort && typeof that.getTitleReq == "object" && typeof that.getTitleReq.abort == "function"){
          try{
            that.getTitleReq.abort();
          }catch(ex){}
        }
        var req = new XMLHttpRequest();
        req.open( "GET", url );
        req.onload = function(){
            var tmp = document.createElement( "div" );
            tmp.innerHTML = req.responseText;
            try{
              var title = tmp.getElementsByTagName( "title" )[0];

              that.cacheTitle[url] = title.textContent;
              callback( title.textContent );
            }
            catch( ex ){
                callback( null );
            }
        };
        req.onerror = function(){
            callback( null );
        };

        try{
            req.send();
        }catch(ex){
            console.info(ex);
        }

        if(abort) that.getTitleReq = req;

    },

    setAutoTextForTextField: function( elem, text ){

      elem.addEventListener( "focus", function(){

        if( elem.hasAttribute( "autoText" ) ){
          elem.removeAttribute( "autoText" );
          elem.value = "";
        }

      }, false );

      elem.addEventListener( "blur", function(){
        if( elem.value == "" ){
          elem.setAttribute( "autoText", 1 );
          elem.value = text;
        }

      }, false );

      if( elem.value == "" ){
        elem.setAttribute( "autoText", 1 );
        elem.value = text;
      }

    },

    debounce: function(func, wait, immediate) {
      var timeout;
      return function() {
        var context = this, args = arguments;
        var later = function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      };
    },

    Async: {

      chain: function( callbacksChain ){

        var dataObject = {};

        var f = function(){
          if( callbacksChain.length > 0 ){
            var nextCallback = callbacksChain.shift();
            nextCallback( f, dataObject );
          }
        }

        f();

      },
      each: function(dataArray, callback, finishCallback) {
        var itemsProcessed = 0;
        dataArray.forEach(function(item) {
          callback(item, function() {
            itemsProcessed++;
            if(itemsProcessed === dataArray.length) {
              finishCallback();
            }
          });
        });
      },
      eachSeries: function(dataArray, callback, finishCallback) {
        return this.arrayProcess(dataArray, callback, finishCallback, true);
      },
      arrayProcess: function(dataArray, callback, finishCallback, noTimeout) {
        var iterationsWithoutTimeout = 0;
        var f = function( i ){

          if( i >= dataArray.length ){
            finishCallback();
          }
          else{

            if( noTimeout ){
              callback( dataArray[i], function(){
                f(i + 1);
              } );
            }
            else{
              if(iterationsWithoutTimeout < 20) {
                iterationsWithoutTimeout++;
                callback( dataArray[i], function(){
                  f(i + 1);
                } );
              }
              else {
                iterationsWithoutTimeout = 0;
                setTimeout( function() {
                  callback( dataArray[i], function(){
                    f(i + 1);
                  } );
                }, 0 );
              }
            }
          }

        }

        f(0);

      },

      cc: function( stateFunction ){

        var rf = function( result ){

          if( result == "break" ){
            return;
          }

          stateFunction( rf );

        };

        stateFunction( rf );

      }

    },

    UI: {
      showAndHide: function( elem, timeout ){
        timeout = timeout | 3000;
        elem.style.opacity = 1;
        setTimeout( function(){
          elem.style.opacity = 0;
        }, timeout );
      }
    },

    Opener: {
      modificators: [],
      addModificator: function(fn) {
        if(this.modificators.indexOf(fn) === -1) {
          this.modificators.push(fn);
        }
      },
      removeModificator: function(fn) {
        var index = this.modificators.indexOf(fn);
        if(index >= 0) {
          this.modificators.splice(index, 1);
        }
      },
      prepareUrl: function(url) {
        this.modificators.forEach(function(modificator) {
          var modifiedUrl = modificator(url);
          if(modifiedUrl) {
            url = modifiedUrl;
          }
        });
        return url;
      },
      asClicked: function(url, def, event) {
        var action = def;
        if(event.button == 0) {
          // ctrlKey for win/linux, metaKey for mac
            if(event.ctrlKey || event.metaKey) {
            if(event.shiftKey) {
              //action = "new";
              action = "window"; // Task #1367
            }
            else {
              action = "background";
            }
            }else
            if(event.shiftKey) {// Task #1367
                action = "new";
            }
        }
        else if( event.button == 1 ){
          action = "background";
        }

        this.byAction( action, url );

        return action;
      },

      byAction: function(action, url) {
        switch(action) {
          case "current":
            this.currentTab( url );
          break;
          case "new":
            this.newTab( url );
          break;
          case "background":
            this.backgroundTab( url );
          break;
          case "window":// Task #1367
            this.newWindow( url );
          break;
        }
      },

      activeTab: function(url) {
        url = this.prepareUrl(url);
        chrome.tabs.query( {
          active: true
        }, function( tabs ){
          chrome.tabs.update( tabs[0].id, {
            url: url
          } );
        })
      },

      currentTab: function(url) {
        url = this.prepareUrl(url);
        chrome.tabs.getCurrent(function( tab ){
          chrome.tabs.update( tab.id, {
            url: url
          } );
        })
      },

      newTab: function(url) {
        url = this.prepareUrl(url);
        chrome.tabs.create({
          url: url,
          active: true
        });
      },

      backgroundTab: function(url) {
        url = this.prepareUrl(url);
        chrome.tabs.create({
          url: url,
          active: false
        });
      },

      newWindow: function(url) {// Task #1367
        url = this.prepareUrl(url);

        chrome.windows.create({
          url: url
        });
      },

      incognitoTab: function(url) {
        url = this.prepareUrl(url);
        var win;
        fvdSpeedDial.Utils.Async.chain([
          function(next) {
            chrome.windows.getCurrent(function(currentWindow) {
              // check if current window is incognito
              if(currentWindow.incognito) {
                win = currentWindow;
                next();
              }
              else {
                // looking for an incognito window
                chrome.windows.getAll(function(windows) {
                  console.log("existing windows", windows);
                  for(var i = 0; i != windows.length; i++) {
                    if(windows[i].incognito) {
                      win = windows[i];
                      break;
                    }
                  }
                  next();
                });
              }
            });
          },
          function() {
            if(win) {
              chrome.tabs.create({
                windowId: win.id,
                url: url,
                active: true
              });
            }
            else {
              // incognito window not found, let's create it
              chrome.windows.create({
                url: url,
                incognito: true,
                focused: true
              });
            }
          }
        ]);
      }
    },

    hexToRGBA: function (hex, opacity) {
        return 'rgba(' + (hex = hex.replace('#', '')).match(new RegExp('(.{' + hex.length/3 + '})', 'g')).map(function(l) { return parseInt(hex.length%2 ? l+l : l, 16) }).concat(opacity||1).join(',') + ')';
    },


    reloadAllTimeout: false, // Task #2009

    reloadAllPages: function(timeout, except){
        var ts = this;

        timeout = timeout || 0;

        if(typeof except != 'object') except = [except || 'none'];

        clearTimeout(ts.reloadAllTimeout);

        ts.reloadAllTimeout = setTimeout(function(){
            ts.reloadAddonPages();
        }, timeout);
    },

    reloadAddonPages: function(callback) {
        var tabs = [];
        var extId = chrome.extension.getURL('');

        chrome.tabs.query({ }, function(allTabs) {
            for(var i in allTabs){
                if(
                    allTabs[i].url == 'chrome://newtab/'
                    ||
                    allTabs[i].url.indexOf(extId) !== -1
                ){
                    tabs.push(allTabs[i]);

                    try{
                        console.info('Reload', allTabs[i]);
                        chrome.tabs.reload(allTabs[i].id);
                    }catch(ex){
                        console.warn(ex);
                    }
                }
            }
        });
    },

    getInstallVersion: function(){
      var version = parseInt(String(localStorage["installVersion"]).split('.').join('')) || 0;
      return version;
    },

    getCurrentVersion: function(){
      var version = chrome.runtime.getManifest().version || 0;
      return version;
    },

    releaseNotes: function (mode) {
      console.info('releaseNotes', mode)
      if (mode) {
        chrome.browserAction.setIcon({path:'images/icons/new-128x128.png'})
        fvdSpeedDial.Prefs.set("sd.browser_action_mode", 'new')
      } else {
        chrome.browserAction.setIcon({path:'images/icons/64x64.png'})
        fvdSpeedDial.Prefs.set("sd.browser_action_mode", 'standard')
      }
    },

    openReleaseNotes: function () {
      let url;
      let ru = false;
      let acepted = ['ru','by','kz','uz','uk'];
      chrome.i18n.getAcceptLanguages((locations) => {
        for (let loc of locations) {
          for (let ac of acepted) {
            if (loc.indexOf(ac) !== -1) {
              ru = true;
              break;
            }
          }
        }
        if (ru) {
          url = 'https://everhelper.me/release-notes-ru.php';
        } else {
          url = 'https://everhelper.me/release-notes-en.php';
        }
        fvdSpeedDial.Utils.Opener.newTab(url);
        fvdSpeedDial.Utils.releaseNotes(false);
      });
    },

    browserAction: function () {
      chrome.browserAction.onClicked.addListener(function(tab) {
        if (fvdSpeedDial.Prefs.get("sd.browser_action_mode") === 'new') {
          fvdSpeedDial.Utils.openReleaseNotes();
        } else {
          if(tab._ignore) {
            return;
          }
          var action = fvdSpeedDial.Prefs.get("sd.main_button_action");
          if(action === "sd_in_new_tab") {
            fvdSpeedDial.Utils.openSpeedDialSingle("newtab");
          }
          else if(action === "sd_in_active_tab") {
            fvdSpeedDial.Utils.openSpeedDialSingle("active");
          }
          else if(action === "add_site_to_sd") {
            fvdSpeedDial.Storage.groupsList(function(groups) {
              var groupId = null;
              for(var i = 0; i != groups.length;i ++) {
                if(groups[i].global_id === "default") {
                  groupId = groups[i].id;
                  break;
                }
              }
              if(!groupId && groups.length) {
                groupId = groups[0].id;
                return;
              }
              if(!groupId) {
                return;
              }
              chrome.tabs.query({
                active: true
              }, function(tabs) {
                fvdSpeedDial.ContextMenu.addTabToSpeedDial(tabs[0], groupId);
              });
            });
          }
        }
      });
    },

    openSpeedDialSingle: function(tabPosition) {
      var foundTabId = null;
      var foundTabIndex;
      fvdSpeedDial.Utils.Async.chain([
        function(chainCallback) {
          chrome.tabs.query( {
            url: fvdSpeedDial.Config.NEWTAB_URL
          }, function(tabs) {
            if(tabs.length > 0) {
              foundTabId = tabs[0].id;
              foundTabIndex = tabs[0].index;
            }
            chainCallback();
          });
        },
        function(chainCallback) {
          chrome.tabs.query({
            url: chrome.extension.getURL( "newtab.html" )
          }, function(tabs) {
            if(tabs.length > 0) {
              foundTabId = tabs[0].id;
            }
            chainCallback();
          });
        },
        function() {
          if(!foundTabId) {
            if(tabPosition === "active") {
              fvdSpeedDial.Utils.Opener.activeTab("newtab.html#force-display");
            }
            else if(tabPosition === "newtab") {
              chrome.tabs.create({
                url: "newtab.html#force-display",
                active: true
              });
            }
          }
          else{
            chrome.tabs.update( foundTabId, {
              active: true
            } );
          }
        }
      ]);
    }
  };


  fvdSpeedDial.Utils = new Utils();


  (function(){

    var DD = function(){

    }

    var _dragAndDropElem = function( params ){
      var that = this;

      var placeHolder = null;
      var _preserveMargins = {
        left: null,
        top: null
      };

      this._elem = params.elem;
      this._ddTargets = params.targets;
      this._initParams = params;
      this._lastMousePos = null;
      this._ddTargetsList = null;
      this._lastMouseMoveEvent = null;
      // to prevent dd when user mousedown and scroll without mouse move
      this._mouseMoved = false;

      function _elParent(){
        return that._elem.parentNode;
      }

      function _childIndex( child ){
        var p = _elParent();
        for( var i = 0; i != p.childNodes; i++ ){
          if( child == p.childNodes[i] ){
            return i;
          }
        }

        return -1;
      }

      function _createPlaceHolder(){

        placeHolder = document.createElement( "div" );
        placeHolder.style.width = that._elem.offsetWidth + "px";
        placeHolder.style.height = that._elem.offsetHeight + "px";
        placeHolder.className = that._elem.className;

        _elParent().insertBefore( placeHolder, that._elem );

      }

      function _removePlaceHolder(){

        _elParent().removeChild( placeHolder );

      }

      // methods
      this.event = function( type ){

        var args = [];
        for( var i = 1; i < arguments.length; i++ ){
          args.push( arguments[i] );
        }

        if( that._initParams["callback" + type] ){
          that._initParams["callback" + type].apply(window, args);
        }

      }

      this.init = function(){

        this._elem.addEventListener( "mousedown", function( event ){
          if( event.button != 0 ){
            return;
          }
          that._mouseMoved = false;
          that._draggingStartCursorPosition = that._mousePos( event );
          document.addEventListener( "mousemove", that._mouseMove, false );
          document.addEventListener( "mouseup", that._mouseUp, false );
          document.addEventListener( "mouseout", that._cancelIfNoMove, false );
          that.event("MouseDownReal");
        }, false );


      }

      this.adjustPos = function( mouse ){

        mouse = mouse || that._lastMousePos;
        that._lastMousePos = mouse;

        var marginLeft = mouse.x - that._draggingStartCursorPosition.x;
        var marginTop = mouse.y - that._draggingStartCursorPosition.y;

        that._elem.style.webkitTransition = "none";

        var newMargins = that._initParams.changePos( marginLeft, marginTop, that );
        marginLeft = newMargins.left;
        marginTop = newMargins.top;

        if( marginLeft !== false ){
          that._elem.style.marginLeft = marginLeft + "px";
        }

        if( marginTop !== false ){
          that._elem.style.marginTop = marginTop + "px";
        }

        var elemOffset = fvdSpeedDial.Utils.getOffset( that._elem );

        var centerPos = {
          left: elemOffset.left + that._elem.offsetWidth/2,
          top: elemOffset.top + that._elem.offsetHeight/2
        };

        var nowDraggedOn = [];
        var nowDraggedOnElems = [];

        for( var i = 0; i != that._ddTargetsList.length; i++ ){
          var targetOffset = fvdSpeedDial.Utils.getOffset( that._ddTargetsList[i] );

          if( centerPos.left >= targetOffset.left && centerPos.left <= (targetOffset.left + that._ddTargetsList[i].offsetWidth) &&
              centerPos.top >= targetOffset.top && centerPos.top <= (targetOffset.top + that._ddTargetsList[i].offsetHeight) ){

            // save cursor position rel to dragged elem
            var cursor = {
              left: centerPos.left - targetOffset.left,
              top: centerPos.top - targetOffset.top
            };

            var draggedOnData = {
              cursor: cursor,
              el: that._ddTargetsList[i],
              width: that._ddTargetsList[i].offsetWidth,
              height: that._ddTargetsList[i].offsetHeight
            };

            nowDraggedOn.push( draggedOnData );
            nowDraggedOnElems.push( draggedOnData.el );

          }
        }

        for( var i = 0; i != nowDraggedOn.length; i++ ){

          if( params.alwaysPropatateDragOn ){

            that.event( "Dragon", nowDraggedOn[i].el, nowDraggedOn[i] );

          }
          else{

            if( that._nowDraggedOn.indexOf(nowDraggedOn[i].el) == -1 ){
              that.event( "Dragon", nowDraggedOn[i].el, nowDraggedOn[i] );
            }

          }

        }

        for( var i = 0; i != that._nowDraggedOn.length; i++ ){
          if( nowDraggedOnElems.indexOf(that._nowDraggedOn[i]) == -1 ){
            that.event( "Dragleave", that._nowDraggedOn[i] );
          }
        }

        that._nowDraggedOn = nowDraggedOnElems;
        return {
          left: marginLeft,
          top: marginTop
        };

      },

      this._mouseMove = function( event ){
        that._mouseMoved = true;
        event = event || that._lastMouseMoveEvent;
        that._lastMouseMoveEvent = event;
        if( params.usePlaceHolder ){

          if (!that._startEventSent) {

            _createPlaceHolder();
            that._elem.style.position = "absolute";

            if (that._elem.style.marginTop) {
              _preserveMargins.top = that._elem.style.marginTop;
            }
            if (that._elem.style.marginLeft) {
              _preserveMargins.left = that._elem.style.marginLeft;
            }

            that._startEventSent = true;
            that.event( "Start" );

          }

        }

        if( !that._nowDragging ){
          that._nowDragging = true;

          that.event("MouseDown");
        }

        if( that._ddTargetsList == null ){
          // search elements for drag
          var targets = document.querySelectorAll( "*[dd_class~="+that._ddTargets+"]" );
          that._ddTargetsList = [];
          for( var i = 0; i != targets.length; i++ ){
            if( targets[i] == that._elem ){
              continue;
            }
            that._ddTargetsList.push( targets[i] );
          }

        }

        var mouse = that._mousePos(event);
        var margins = that.adjustPos( mouse );

        if (!params.usePlaceHolder) {

          if( !that._startEventSent ){
            if( margins.left != 0 || margins.top != 0 ){

              that._startEventSent = true;
              that.event( "Start" );

            }
          }

        }

      }

      this._cancelIfNoMove = function() {
        if(!that._mouseMoved) {
          that._mouseUp();
        }
      };

      this._mouseUp = function( event ){

        if( params.usePlaceHolder ){
          _removePlaceHolder();
          that._elem.style.position = "";
        }

        document.removeEventListener( "mousemove", that._mouseMove, false );
        document.removeEventListener( "mouseup", that._mouseUp, false );
        try {
          document.removeEventListener( "mouseout", that._cancelIfNoMove, false );
        }
        catch(ex) {

        }

        that._elem.style.webkitTransition = "";

        if( _preserveMargins.top ){
          that._elem.style.marginTop = _preserveMargins.top;
        }
        else{
          that._elem.style.marginTop = "";
        }
        if( _preserveMargins.left ){
          that._elem.style.marginLeft = _preserveMargins.left;
        }
        else{
          that._elem.style.marginLeft = "";
        }

        if( params.constantStyle ){
          for( var k in params.constantStyle ){
            that._elem.style[k] = params.constantStyle[k];
          }
        }
        else{

        }

        that._nowDragging = false;
        that._startEventSent = false;
        that._ddTargetsList = null;


        that.event( "End", {elements: that._ddTargetsList} );

      }

      this._mousePos = function( event ){
        var scrollTop = document.body.scrollTop;
        if( this._initParams.scrollingNotMean ){
          scrollTop = 0;
        }

        return {
          x: event.x,
          y: event.y + scrollTop
        };
      }

      this.init();
    }

    _dragAndDropElem.prototype = {
      // options
      _initParams: null,
      _elem: null,
      _ddTargets: null,

      // privates
      _ddTargetsList: null,
      _nowDragging: false,
      _draggingStartCursorPosition: {x:null, y:null},
      _nowDraggedOn: [],
      _startEventSent: false,

    }

    DD.prototype = {
      create: function( params ){
        return new _dragAndDropElem( params );
      }
    }
    this.DD = new DD();
  }).apply(fvdSpeedDial.Utils);
})();

if (typeof $ == "function"){
  $(()=>{
    jQuery.fn.scrollTo = function (elem) {
      var b = $(elem);
      if (b.length){
          this.scrollTop(0);
          this.scrollTop(b.position().top + b.height() - this.height() + 50);
      }
    };
  });
}
