(function () {
    var queryInput;
    var searchInputParent;
    var resetButton;
    var container;
    var activeSearchRequest = null;
    const CORRECT_CONTAINER_WIDTH_INCREASE = 11;

    function SearchRequest(query, cb) {
        var cancelled = false;
        this.cancel = function () {
            cancelled = true;
        };
        fvdSpeedDial.Storage.searchDials(query, function (err, dials) {
            if (cancelled) {
                return;
            }
            cb(err, dials);
        });
    }
    fvdSpeedDial.DialSearch = {
        resetHelperAttributes: function () {
            document.body.removeAttribute("dial-search-show-results");
            document.body.removeAttribute("dial-search-not-found");
            queryInput.removeAttribute("user-clicked");
        }
        , doSearch: function (query) {
            var self = this;
            if (activeSearchRequest) {
                try {
                    activeSearchRequest.cancel();
                }
                catch (ex) {}
                activeSearchRequest = null;
            }
            query = query || "";
            query = query.trim();
            if (query.length === 0) {
                this.resetHelperAttributes();
                fvdSpeedDial.SpeedDial.rebuildCells({
                    isSearch: true
                });
                return;
            }
            if (query.length < fvdSpeedDial.Config.MIN_DIALS_SEARCH_QUERY_LENGTH) {
                this.resetHelperAttributes();
                return;
            }
            activeSearchRequest = new SearchRequest(query, function (err, dials) {
                self.resetHelperAttributes();
                if (!err) {
                    document.body.setAttribute("dial-search-show-results", 1);
                    if (dials.length === 0) {
                        self.setNotFound();
                    }
                    else {
                        fvdSpeedDial.SpeedDial.rebuildCells({
                            dials: dials
                            , isSearch: true
                        });
                    }
                }
            });
        }
        , setNotFound: function () {
            var query = queryInput.value;
            document.body.setAttribute("dial-search-not-found", 1);
            var message = _("newtab_dials_search_no_match_query");
            var messageContainer = document.querySelector("#dial-search-container .dial-search-no-match-message");
            messageContainer.innerHTML = message;
            messageContainer.querySelector("strong").textContent = query;
        }
        , isInNotFoundState: function () {
            return document.body.hasAttribute("dial-search-not-found");
        }
        , doWebSearch: function (query) {
            query = query || queryInput.value;
            query = query.trim();
            if (!query.length) {
                return;
            }
            fvdSpeedDial.SpeedDialMisc.doSearch(query);
        }
        , show: function () {
            searchInputParent.setAttribute("expanded", 1);
        }
        , hide: function () {
            var val = queryInput.value.trim();
            if (!val && !queryInput.hasAttribute("user-clicked")) {
                queryInput.blur();
            }
            if (document.activeElement === queryInput || val) {
                return;
            }
            searchInputParent.setAttribute("expanded", 0);
            queryInput.removeAttribute("user-clicked");
            this.refreshResetButtonState();
        }
        , reset: function () {
            this.resetHelperAttributes();
            queryInput.value = "";
            queryInput.blur();
            this.refreshResetButtonState();
        }
        , empty: function () {
            queryInput.value = "";
            this.doSearch();
            this.refreshResetButtonState();
        }
        , refreshResetButtonState: function () {
            var text = queryInput.value;
            if (text.length) {
                searchInputParent.setAttribute("with-text", 1);
            }
            else {
                searchInputParent.removeAttribute("with-text");
            }
        }
        , refreshEnableState: function () {
            if (_b(fvdSpeedDial.Prefs.get("sd.enable_dials_search"))) {
                document.body.setAttribute("dialsearchenabled", 1);
            }
            else {
                document.body.removeAttribute("dialsearchenabled");
            }
        }
    };
    document.addEventListener("DOMContentLoaded", function () {
        container = document.getElementById("dial-search-container");
        queryInput = document.getElementById("dial-search-query");
        searchInputParent = document.querySelector("#dial-search-container .dial-search-input");
        resetButton = document.querySelector("#dial-search-container .dial-search-reset-icon");
        queryInput.addEventListener("input", function () {
            var q = queryInput.value;
            fvdSpeedDial.DialSearch.doSearch(q);
            fvdSpeedDial.DialSearch.refreshResetButtonState();
        }, false);
        searchInputParent.addEventListener("mouseover", function () {
            fvdSpeedDial.DialSearch.show();
            queryInput.focus();
        }, false);
        searchInputParent.addEventListener("mouseout", function () {
            fvdSpeedDial.DialSearch.hide();
        }, false);
        queryInput.addEventListener("blur", function () {
            fvdSpeedDial.DialSearch.hide();
        }, false);
        queryInput.addEventListener("keydown", function (event) {
            if (event.keyCode === 27) {
                // escape pressed, clear and blur input
                fvdSpeedDial.DialSearch.reset();
                fvdSpeedDial.DialSearch.doSearch();
            }
            if (event.keyCode === 13) {
                if (fvdSpeedDial.DialSearch.isInNotFoundState()) {
                    fvdSpeedDial.DialSearch.doWebSearch();
                }
            }
        }, false);
        queryInput.addEventListener("mousedown", function () {
            queryInput.setAttribute("user-clicked", 1);
        }, false);
        resetButton.addEventListener("mousedown", function (event) {
            fvdSpeedDial.DialSearch.empty();
            event.preventDefault();
        }, false);
        document.addEventListener('keydown', (event) => {
          if (event.ctrlKey && event.code === 'KeyF') {
            event.preventDefault()
            event.stopPropagation()
            fvdSpeedDial.DialSearch.show()
            queryInput.focus()
            queryInput.setAttribute("user-clicked", 1)
          }
        })
        document.querySelector(".dial-search-not-found-block a").addEventListener("click", function (event) {
            fvdSpeedDial.DialSearch.doWebSearch();
            event.preventDefault();
        }, false);
        document.querySelector("#dial-search-container .dial-search-icon").addEventListener("mousedown", function (event) {
            queryInput.focus();
            event.preventDefault();
        }, false);
        fvdSpeedDial.SpeedDial.onBuildCompleted.addListener(function (params) {
            if (!params || !params.isSearch) {
                    fvdSpeedDial.DialSearch.reset();
                    fvdSpeedDial.DialSearch.hide();
                /*
                if (queryInput.value) fvdSpeedDial.DialSearch.doSearch(queryInput.value);
                else {
                    fvdSpeedDial.DialSearch.reset();
                    fvdSpeedDial.DialSearch.hide();
                }
                */
            }
        });
        Broadcaster.onMessage.addListener(function (msg) {
            if (msg.action == "pref:changed") {
                if (msg.name === "sd.enable_dials_search") {
                    fvdSpeedDial.DialSearch.refreshEnableState();
                }
            }
        });
        fvdSpeedDial.DialSearch.refreshEnableState();
        /*
        if(_b(fvdSpeedDial.Prefs.get("sd.enable_search"))) {
          var formTable = document.querySelector("#searchFormContainer > form > table");
          setTimeout(function() {
            container.setAttribute("active", 1);
            var newWidth = formTable.offsetWidth + CORRECT_CONTAINER_WIDTH_INCREASE;
            container.style.width = newWidth + "px";
          }, 500);
        }
        else {
          container.setAttribute("active", 1);
        }
        */
    }, false);
})();