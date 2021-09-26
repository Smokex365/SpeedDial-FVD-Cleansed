(function() {
  var _lastaCIndex = 0,
    acSources = {},
    acSourcesXHR = null;

  /*
    * @param [string] params.query
    */
  acSources.lcs = function(params, cb) {
    //acSources.google(params, cb); return;
    if(acSourcesXHR) {
      acSourcesXHR.abort();
    }
    //var url = "http://services.rt53.net/getSuggestions?sourceID=123&format=unorderedList&q=" + encodeURIComponent(params.query);
    var url = "https://services.rt53.net/getSuggestions?sourceID=nimbus-opera&format=unorderedList&q=" + encodeURIComponent(params.query);
    var req = new XMLHttpRequest();
    acSourcesXHR = req;
    req.open('GET', url, true);
    req.inst = this;
    req.q = "";
    req.onload = function() {
      acSourcesXHR = null;
      let result = {
        query: params.query,
        items: []
      }
      if (typeof req.response === 'string') {
        let div = document.createElement('div')
        div.innerHTML = req.response
        let items = div.getElementsByTagName('li')
        for (let item of items) {
          let suggestion = {}
          let links = item.getElementsByTagName('a')
          if (links.length) {
            let link = links[0]
            suggestion.term = link.innerText.trim()
            suggestion.click_url = link.getAttribute('href')
            let icon = link.getElementsByTagName('img')
            if (icon.length) {
              suggestion.image_url = icon[0].getAttribute('src')
            }
            let pixel = item.getElementsByTagName('ldc_impression_pixel')
            if (pixel.length) {
              suggestion.impression_url = pixel[0].getAttribute('src')
            }
          } else {
            suggestion.term = item.innerText.trim()
          }
          result.items.push(suggestion)
        }
        div.remove()
      }
      if (result.items.length) {
        cb(result)
      } else {
        acSources.google(params, cb)
      }
    };
    req.onerror = function(ex) {
      console.warn(ex)
      acSources.google(params, cb)
    }
    req.send(null);
  };

  /*
   * @param [string] params.query
   */
  acSources.google = function(params, cb) {
    if(acSourcesXHR) {
      acSourcesXHR.abort();
    }
    var url = "https://google.com/complete/search?output=toolbar&q=" + encodeURIComponent(params.query);
    var req = new XMLHttpRequest();
    acSourcesXHR = req;
    req.open('GET', url, true);
    req.inst = this;
    req.q = "";
    req.onload = function() {
      acSourcesXHR = null;
      var r = req.responseXML;
      if (r) {
        var elems = r.getElementsByTagName("suggestion");
        var items = [];
        for (var i = 0; i != elems.length; i++) {
          items.push(elems[i].getAttribute("data"));
        }
        cb({
          items: items
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
  function AutoComplete(params) {
    let acId = ++_lastaCIndex;
    let suggestElemId = "suggest_" + acId;
    let suggestionsTableId = "suggestions_" + acId;
    let self = this;
    let acpObj = {};
    let inputEl = document.querySelector(params.input);
    let relElem = params.rel ? document.querySelector(params.rel) : inputEl;
    let acFunction = null;
    let acSource = 'lcs'; //inputEl.hasAttribute("data-autocomplete-source") ? inputEl.getAttribute("data-autocomplete-source") : "google";

    this.onPopupShow = new FVDEventEmitter();
    this.onPopupHide = new FVDEventEmitter();
    this.onClickSuggestion = new FVDEventEmitter();

    this.setSource = function(source) {
      acSource = source;
    };

    this.setFunction = function(fn) {
      acFunction = fn;
    };

    function $(id) {
      if (id == "force_acp_object_imput") {
        return acpObj.force_input_obj;
      } else if (id == "force_acp_object_form") {
        return acpObj.force_form_obj;
      }
      return document.getElementById(id);
    }

    function autocompleteHide(event) {
      var suggest = $(suggestElemId);
      if (suggest) {
        suggest.style.display = "none";
      }
      document.removeEventListener("click", autocompleteHide, true);
      self.onPopupHide.callListeners();
      if (event) {
        event.stopPropagation();
      }
    }

    function autocompleteShow() {
      fvdSpeedDial.AutoComplete.onPopupShow.callListeners()
      let suggestions = $(suggestElemId);
      suggestions.style.display = "block";
      suggestions.style.opacity = 0;
      autocompleteAlign(suggestions);
      setTimeout(()=>{
          autocompleteAlign(suggestions);
          suggestions.style.opacity = 1;
      }, 1);
    }

    function autocompleteAlign(suggestions) {
      let offset = fvdSpeedDial.Utils.getOffset(relElem);
      let top = offset.top + relElem.offsetHeight + 3;
      suggestions.style.left = offset.left - 9 + 'px';
      suggestions.style.top = top + 'px';
      suggestions.style.width = relElem.clientWidth + 10 + 'px';
    }

    function startAutocomplete() {
      acpObj = {
        force_input_obj : document.querySelector(params.input),
        force_form_obj : document.querySelector(params.form),
        click_callback : function() {},
        acp_searchbox_id : "force_acp_object_imput", /* ID of the search <input tag   */
        acp_search_form_id : "force_acp_object_form", /* ID of the search form         */
        acp_partner : "flsh", /* AutoComplete+ partner ID      */
        acp_suggestions : "7", /* Number of suggestions to get  */
      };

      var input = $(acpObj.acp_searchbox_id);
      input.addEventListener("keyup", function(event) {
        acpObj.ac.keyup(event, input);
      });

      var container = document.createElement("div");
      container.setAttribute("class", "acp_ltr");
      var mainContainer = container;

      var table = document.createElement("table");

      container.appendChild(table);
      table.setAttribute("cellspacing", "0");
      container.setAttribute("style", "display:none");
      container.setAttribute("id", suggestElemId);
      var tbody = document.createElement("tbody");
      tbody.setAttribute("id", suggestionsTableId);
      table.appendChild(tbody);
      //document.querySelector('#front-content').appendChild(container);
	    //input.parentNode.appendChild(container);
      document.body.appendChild(container);
      if (!acpObj.acp_sig) {
        acpObj.acp_sig = "on";
      }
      if (acpObj.acp_sig == "on") {
        var tfoot = document.createElement("tfoot");
        var tr = document.createElement("tr");
        var td = document.createElement("td");

        tr.appendChild(td);
        tfoot.appendChild(tr);
        table.appendChild(tfoot);
      }
      container = table;

      var AutocompleteClass = (function() {
        function AutocompleteClass(mainClass) {
          this.main = mainClass;
          this.dropdown = {
            posY : -1,
            table : $(suggestionsTableId)
          };
        };
        AutocompleteClass.prototype.setStyles = function(selector, property, value) {
          var key;
          if (document.all) {
            key = "rules";
          } else {
            if (document.getElementById) {
              key = "cssRules";
            }
          }
          var last = document.styleSheets.length - 1;
          var length = document.styleSheets[last][key].length;
          for (var index = 0; index < length; index++) {
            if (document.styleSheets[last][key][index].selectorText == selector) {
              document.styleSheets[last][key][index].style[property] = value;
              return;
            }
          }
        }
        AutocompleteClass.prototype.keyup = function(event, input) {
          if (input.value.length == 0) {
            $(suggestElemId).style.display = "none";
            return;
          }
          if (event.keyCode == 27) {
            if ($(suggestElemId) && $(suggestElemId).style.display != "none") {
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
              break;
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
          if (event.keyCode == 38 || event.keyCode == 40) {
            if ($(suggestElemId) && $(suggestElemId).style.display == "none") {
              autocompleteShow()
            }
          }
          this.navi();
        }
        AutocompleteClass.prototype.onInput = function(query) {
          if (!acpObj.acp_b) {
            acpObj.acp_b = 1;
          }
          if (!this.dropdown.table) {
            this.dropdown.table = $(suggestionsTableId);
            //var elem = $(acpObj.acp_searchbox_id);
          }
          this.search(query);
        }
        AutocompleteClass.prototype.search = function(query) {
          let that = this;
          if(acFunction) {
            return acFunction(query, function(err, suggestions) {
              if(err) {
                return console.error("Fail get suggestions", err);
              }
              that.createSuggestions({
                items: suggestions,
                query: query
              });
            });
          }
          acSources[acSource]({
            query: query
          }, function(result) {
            that.createSuggestions({
              "items" : result.items,
              "query" : query
            });
          });
        }
        AutocompleteClass.prototype.createSuggestions = function(searchData) {
          let that = this;

          dd_hide();
          var table = $(suggestionsTableId);
          var list;
          if(Array.isArray(searchData.items)) {
            list = searchData.items;
          }
          else {
            list = String(searchData.items).split(",");
          }
          while (table.rows && table.rows.length) {
            table.deleteRow(-1);
          }
          for (var index in list) {
            let item = list[index]

            if (typeof item !== "object" && item === "") {
              continue;
            }

            let text = typeof item === "string" ? item : item.term
            let data = typeof item === "object" ? item : {}

            var tr = table.insertRow(-1);
            var td = tr.insertCell(0);
            td.style.display = "block";

            var newdiv = this.bolderifyQueryText(searchData.query, text);
            if (data.image_url) {
              let image = document.createElement('img');
              image.setAttribute('src', data.image_url);
              image.setAttribute('class', 'suggestion-img-adv');
              td.appendChild(image);
              newdiv.setAttribute('class', 'with-img');
            }
            if (data.impression_url) {
              let pixel = document.createElement('img');
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
            tr.onmouseover = function() {
              that.navi(this);
            };

            tr.addEventListener("dblclick", function(event) {
              event.stopPropagation();
            }, false);

            tr.addEventListener("click", function(event) {
              $(acpObj.acp_searchbox_id).value = '';
              $(acpObj.acp_searchbox_id).focus();
              var value = this.cells[0].getAttribute("queryText");
              autocompleteHide();
              event.stopPropagation();
              that.main.onClickSuggestion.callListeners(data.click_url ? data : value);
            });
          }
          document.addEventListener("click", autocompleteHide, false);
          if ($(suggestElemId).style.display == "none") {
            autocompleteShow()
          }
          if (table.rows.length == 0) {
            $(suggestElemId).style.display = "none";
          }
        }
        AutocompleteClass.prototype.navi = function(tr) {
          let searchbox = $(acpObj.acp_searchbox_id)
          searchbox.removeAttribute("clickUrl")

          for (var index = this.dropdown.table.rows.length - 1; index >= 0; index--) {
            this.dropdown.table.rows[index].style.backgroundColor = "";
          }
          if (tr === undefined) {
            this.dropdown.table.rows[this.dropdown.posY].style.backgroundColor = "#eee";
            let cell = this.dropdown.table.rows[this.dropdown.posY].cells[0]
            searchbox.value = cell.getAttribute("queryText");
            if (cell.hasAttribute("clickUrl")) {
              searchbox.setAttribute("clickUrl", cell.getAttribute("clickUrl"));
            }
          } else {
            tr.style.backgroundColor = "#eee";
            this.dropdown.posY = tr.getAttribute("sugID");
          }
        }
        AutocompleteClass.prototype.getIndicesOf = function(searchStr, str, caseSensitive) {
          var startIndex = 0, searchStrLen = searchStr.length;
          var index, indices = [];
          if (!caseSensitive) {
            str = str.toLowerCase();
            searchStr = searchStr.toLowerCase();
          }
          while ((index = str.indexOf(searchStr, startIndex)) > -1) {
            indices.push(index);
            startIndex = index + searchStrLen;
          }
          return indices;
        }
        AutocompleteClass.prototype.bolderifyQueryText = function(query, suggestion) {
          var indices = this.getIndicesOf(query, suggestion, false);
          var resultDiv = document.createElement("div");
          var currentText = "";
          for(var i = 0; i < suggestion.length;) {
            if(indices.indexOf(i) !== -1) {
              if(currentText) {
                var span = document.createElement("span");
                span.textContent = currentText;
                resultDiv.appendChild(span);
                currentText = "";
              }
              var bolder = document.createElement("b");
              bolder.textContent = suggestion.substr(i, query.length);
              resultDiv.appendChild(bolder);
              i += query.length;
            }
            else {
              currentText += suggestion[i];
              i++;
            }
          }
          if(currentText) {
            var span = document.createElement("span");
            span.textContent = currentText;
            resultDiv.appendChild(span);
          }
          return resultDiv;
        }

        return AutocompleteClass;
      })();
      acpObj.ac = new AutocompleteClass(self);
    }
    startAutocomplete();
  }
  fvdSpeedDial.AutoCompletePlus = AutoComplete;
})();