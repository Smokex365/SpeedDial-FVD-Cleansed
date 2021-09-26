(function() {
  fvdSpeedDial.SearchOverlay = {
    autocomplete: null,
    params: {},
    show: function(type, params) {
      this.params = params;
      this.autocomplete.setFunction(params.autocomplete);
      var overlay = document.querySelector("#searchOverlay");
      overlay.setAttribute("data-type", type);
      overlay.style.display = "block";
      setTimeout(function() {
        overlay.setAttribute("appear", 1);
      }, 0);

      var logo = document.querySelector("#searchOverlay .searchOverlay-logo");
      if(params.image) {
        logo.style.width = params.image.width + "px";
        logo.style.height = params.image.height + "px";
        logo.style.backgroundImage = "url(" + params.image.url + ")";
        logo.style.backgroundSize = params.image.width + "px " + params.image.height + "px";
      }
      else {
        logo.background = "none";
      }

      var input = document.querySelector("#searchOverlay .searchField input");
      input.value = "";
      input.focus();
    },
    isSearchOpened: function() {
      var overlay = document.querySelector("#searchOverlay");
      return overlay.hasAttribute("appear");
    },
    hide: function() {
      var overlay = document.querySelector("#searchOverlay");
      overlay.style.display = "none";
      overlay.removeAttribute("appear");
    },
    doSearch: function() {
      var self = this;
      var url = this.params.url;
      fvdSpeedDial.Utils.Async.chain([
        function(next) {
          if(typeof url === "function") {
            // url is a function, call to get an url
            url(function(err, resultUrl) {
              url = resultUrl;
              next();
            });
          }
          else {
            next();
          }
        },
        function() {
          var query = document.querySelector("#searchOverlayForm .searchField input").value.trim();
          url = url.replace(/{query}/g, encodeURIComponent(query));
          document.location = url;
        }
      ]);
    }
  };

  document.addEventListener("DOMContentLoaded", function() {
    document.addEventListener("keydown", function(event) {
      if(event.keyCode == 27 && fvdSpeedDial.SearchOverlay.isSearchOpened()) {
        fvdSpeedDial.SearchOverlay.hide();
      }
    }, false);

    var overlay = document.querySelector("#searchOverlay");
    var input = document.querySelector("#searchOverlayForm .searchField input");
    input.addEventListener("keydown", function(event) {
      if(event.keyCode == 13) {
        fvdSpeedDial.SearchOverlay.doSearch();
        event.preventDefault();
      }
    }, false);

    overlay.querySelector(".search-button button").addEventListener("click", function() {
      fvdSpeedDial.SearchOverlay.doSearch();
    }, false);

    overlay.addEventListener("click", function(event) {
      if(event.target == overlay) {
        fvdSpeedDial.SearchOverlay.hide();
      }
    }, false);

    // init autocomplete
    var autocomplete = new fvdSpeedDial.AutoCompletePlus({
      input: "#searchOverlayForm .searchField input",
      form: "#searchOverlayForm"
    });

    autocomplete.onClickSuggestion.addListener(function() {
      fvdSpeedDial.SearchOverlay.doSearch();
    });

    fvdSpeedDial.SearchOverlay.autocomplete = autocomplete;
  });
})();