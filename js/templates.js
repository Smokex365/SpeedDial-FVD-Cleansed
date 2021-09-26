(function () {
    var el = document.createElement("div");

    var tmplResolve, tmplPromise = new Promise((resolve, reject)=>{ // #2094
        tmplResolve = resolve;
    });

    /* // Task #1637
    var xhr = new XMLHttpRequest();
    xhr.open("GET", chrome.runtime.getURL("/templates.html"), false);
    xhr.send(null);
    el.innerHTML = xhr.responseText;
    */
   
    jQuery.get(chrome.runtime.getURL("/templates.html"), (data)=>{
        console.info('Templates loaded');
        el.innerHTML = data;
        fvdSpeedDial.Localizer.localizeElem(el);
        tmplResolve(); // #2094
    });

    
    fvdSpeedDial.Localizer.localizeElem(el);

    fvdSpeedDial.Templates = {
        initPromise: function () { // #2094
            return tmplPromise;
        },
        
        getHTML: function (id) {
            return el.querySelector("#" + id).innerHTML;
        }
        , clone: function (id) {
            return el.querySelector("#" + id).cloneNode(true);
        }
        , get: function (templateName, options, cb) {
            if (typeof options === "function") {
                cb = options;
                options = {};
            }
            options = options || {};
            var xhr = new XMLHttpRequest();
            xhr.open("GET", chrome.runtime.getURL("/templates/" + templateName + ".html"));
            xhr.onload = function () {
                var res = xhr.responseText;
                if (options.fragment) {
                    var tmp = document.createElement("template");
                    tmp.innerHTML = res;
                    res = tmp.content;
                }
                cb(null, res);
            };
            xhr.onerror = function (err) {
                cb(err);
            };
            xhr.send(null);
        }
        , loadStyleSheet: function (location, cb) {
            cb = cb || function () {};
            var link = document.createElement("link");
            link.setAttribute("href", location);
            link.setAttribute("rel", "stylesheet");
            link.addEventListener("load", function () {
                cb();
            }, false);
            document.head.appendChild(link);
        }
    };
})();