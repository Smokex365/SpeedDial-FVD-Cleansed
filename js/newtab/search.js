(function () {
  var Search = function () {}
  Search.prototype = {
    _defaultProvider: 'google',
    _ui: {},
    _menuState: false,
    _searchProviders: {
      "google": {
        name: 'Google',
        url: 'https://www.google.com/search?q={q}'
      },
      "fvd": {
        name: "Speed Dial",
        url: "https://fvdmedia.com/addon_search/?q={q}&from=chrome_fvdsd&install_time={time}&search_type={type}"
      },
      "yandex": {
        name: 'Yandex',
        url: 'https://yandex.ru/yandsearch?clid=2028026&text={q}',
        locale: ['ru','by','kz','uz','uk'],
        ip: ['ru','by','kz','uz','uk','ua'],
        replace: (url) => {
          let that = this.Search
          let indexUK = that._locale.locales.indexOf('uk')
          if (that._locale.ip === 'uk') {
            indexUK = 0
          }
          let indexUA = that._locale.locales.indexOf('ua')
          if (that._locale.ip === 'ua') {
            indexUA = 0
          }
          if (
            (indexUK !== -1 && indexUK < 3)
            || (indexUA !== -1 && indexUA < 3)
          ) {
            url = url.replace('yandex.ru', 'yandex.fr')
          }
          return url
        }
      },
      "bing": {
        name: 'Bing',
        //url: "https://searchingtraining.com/?a=gsb_lsphp_00_00_ssg01&q={q}",
        //url: "https://newdirects.com/search.php?engine=bing&client=sd_chrome&version={version}&q={q}",
        url: "https://search.fvdspeeddial.com/search.php?engine=bing&client=sd_chrome&version={version}&q={q}",
        ip: ['au','at','be','br','ca','dk','fi','fr','fx','de','in','it','ie','jp','lu','nl','nz','no','es','se','ch','gb','us','um','uk']
      },
      "yahoo": {
        name: 'Yahoo',
        url: "https://searchingcards.com/?a=gsp_lsphp_00_20&q={q}",
        ip: ['ar','at','br','ca','ch','cl','co','de','dk','es','fi','fr','hk','in','id','it','mx','nz','no','pe','ph','sg','se','tw','th','gb','uk','us','ie','ve','my'],
        //versionLess: 7670
      }
    },
    _locale: {
      ip: null,
      locales: [],
      timeout: 7 * 24 * 60 * 60 * 100
    },
    _installVersion: 1000,
    init: () => {
      let that = this.Search
      that.getUI()
      that.listeners()
      that.fill()
      that.getLocationByIP()
      that.getLocationByBrowser()
      that.getInstallVersion()
    },
    getUI: () => {
      let that = this.Search
      that.ui = {
        $container: $('#searchFormContainer'),
        $logo: $('#searchLogo'),
        $menu: $('#searchMenu'),
        $list: $('#searchList'),
      }
    },
    listeners: () => {
      var that = this.Search
      that.ui.$logo.on("click", function (event) {
        return
        //that.menu('show')
      })
      that.ui.$list.on("click", "li", function (event) {
        that.clickProvider($(event.currentTarget))
      })
      document.body.addEventListener("click", that.onBodyClick.bind(this), false);
    },
    fill: () => {
      let that = this.Search
      let provider = that.getProvider()
      let installVersion = fvdSpeedDial.Utils.getInstallVersion()

      that.ui.$list.html('')
      for (var key in that._searchProviders) {
        let item = that._searchProviders[key]
        if (item.hasOwnProperty('versionLess')) {
          if (installVersion > item['versionLess']) {
            continue
          }
        }
        let $option = $("<li>")
          .attr("provider", key)
          .addClass('provider-' + key)
          .append(
            $("<span>").addClass("provider-name")
              .text(item.name)
          )
        ;
        if (key === provider) {
          $option.addClass('active')
        }
        that.ui.$list.append($option);
      }

      let current = that.ui.$logo.attr('provider')
      if (!current || current === provider) {
        that.ui.$logo.attr('provider', provider)
      } else {
        that.ui.$logo.addClass('fade')
        setTimeout(()=>{
          that.ui.$logo.attr('provider', provider)
          that.ui.$logo.removeClass('fade')
        }, 75)
      }
    },
    onBodyClick: (event) => {
      try {
        let that = this.Search
        if (that._menuState) {
          that.menu('close')
        }
      } catch(ex) {
        console.warn(ex)
      }
    },
    menu: (mode) => {
      let that = this.Search
      that.fill()
      if (mode === 'close') {
        that._menuState = false
        that.ui.$menu.fadeOut(75)
        that.highlight(true)
      } else {
        that.ui.$menu.fadeIn(75)
        that.highlight(false)
        setTimeout(() => {
          that._menuState = true
        }, 1)
      }
    },
    clickProvider: ($option) => {
      let that = this.Search
      let provider = $option.attr('provider')
      that.setProvider(provider)
      that.menu('close')
    },
    highlight: (unhighlight) => {
      let that = this.Search
      that.ui.$container.addClass('highlight')
      clearTimeout(that._highlightTimeout)
      if (unhighlight) {
        that._highlightTimeout = setTimeout(() => {
          that.ui.$container.removeClass('highlight')
        }, 3e3)
      }
    },
    setProvider: (provider) => {
      let that = this.Search
      if (that._searchProviders[provider]) {
        fvdSpeedDial.Prefs.set("sd.search_provider", provider)
      }
      return that.getProvider()
    },
    getProvider: () => {
      let that = this.Search
      let provider = fvdSpeedDial.Prefs.get("sd.search_provider")
      if (!provider || !that._searchProviders[provider]) {
        provider = that._defaultProvider
      }
      return provider
    },
    doSearch: (query) => {
      let url
      if (!query) {
        let q = document.getElementById("q")
        if (q.hasAttribute("clickUrl")) {
          query = {
            click_url: q.getAttribute("clickUrl")
          }
        } else {
          query = q.value
        }
      }

      if (typeof query === "object" && query.click_url) {
        url = query.click_url
      } else {
        let that = this.Search
        let provider = that.getProvider()
        if (provider === 'fvd') {
          provider = that.detectProvider()
        }
        let providerData = that._searchProviders[provider]
        if(String(query).trim().length == 0){
          return false
        }
        url = String(providerData.url)
        url = url
          .replace('{q}', encodeURIComponent(query))
          .replace('{time}', fvdSpeedDial.Prefs.get("sd.install_time"))
          .replace('{type}', (fvdSpeedDial.Utils.getInstallVersion() < 6930 ? '0' : '1'))
          .replace('{version}', fvdSpeedDial.Utils.getCurrentVersion())
        ;
        if (typeof providerData.replace === 'function') {
          url = providerData.replace(url)
        }
      }
      console.info(url)
      document.location = url
    },
    detectProvider: () => {
      let that = this.Search
      let provider = null
      let installVersion = fvdSpeedDial.Utils.getInstallVersion()

			for (let key in that._searchProviders) {
        if (key !== 'fvd') {
          let providerItem = that._searchProviders[key]
          if (providerItem.hasOwnProperty('versionLess')) {
            if (installVersion > providerItem['versionLess']) {
              continue
            }
          }
          if (providerItem.locale) {
            for (let loc of providerItem.locale) {
              let index = that._locale.locales.indexOf(loc)
              if (index !== -1 && index < 3) {
                provider = key
                break
              }
            }
          }
          if (!provider && that._locale.ip && providerItem.ip) {
            if(providerItem.ip.indexOf(that._locale.ip) !== -1) {
              provider = key
            }
          }
          if (provider) {
            break
          }
        }
      }
      if (!provider) {
        if (
          !that._searchProviders['yahoo']['versionLess']
          || installVersion < that._searchProviders['yahoo']['versionLess']
        ) {
          provider = 'yahoo'
        } else {
          provider = 'bing'
        }
      }
      console.info('Provider detected', provider)
      return provider
    },
    getLocationByBrowser: () => {
      let that = this.Search
      let locales = localStorage.getItem('definedLocationsList')
      let localesTimeout = parseInt(localStorage.getItem('definedLocationsListTimeout')) || 0
      //that._locale.timeout
      if (locales && localesTimeout > Date.now()) {
        that._locale.locales = locales.split(',')
      } else {
        chrome.i18n.getAcceptLanguages((locations) => {
          let locales = []
          for (let location of locations) {
            locales.push(location.split('-').shift().toLowerCase())
          }
          localStorage.setItem("definedLocationsList", locales)
          console.info(that._locale.timeout)
          localStorage.setItem('definedLocationsListTimeout', Date.now() + that._locale.timeout)
          that._locale.locales = locales
        })
      }
    },
    getLocationByIP: () => {
      let that = this.Search
      let location = localStorage.getItem('serviceLocation')
      let localesTimeout = parseInt(localStorage.getItem('serviceLocationListTimeout')) || 0
      if (location && localesTimeout > Date.now()) {
        that._locale.ip = location
      } else {
        fvdSpeedDial.Utils.getUserCountry(function(country) {
          if(country) {
            country = String(country).toLowerCase()
            localStorage.setItem('serviceLocation', country)
            localStorage.setItem('serviceLocationListTimeout', Date.now() + that._locale.timeout)
            that._locale.ip = country
          }
        });
      }
    },
    getLocationSync: () => {
      var location = localStorage.getItem("serviceLocation")
      if (!location) {
        location = chrome.i18n.getUILanguage()
      }
      location = String(location || '').toLowerCase()
      return location
    },
    getInstallVersion: () => {
      let that = this.Search
      let version = parseInt(String(localStorage.getItem("installVersion")).split('.').join('')) || 1000
      that._installVersion = version
    },
    getInstallVersion: () => {
      let that = this.Search
      let version = parseInt(String(localStorage.getItem("installVersion")).split('.').join('')) || 1000
      that._installVersion = version
    },
    reset: (reload) => {
      localStorage.removeItem('serviceLocation');
      localStorage.removeItem('definedLocation');
      localStorage.removeItem('definedLocationsList');
      if (reload) {
        document.location.reload();
      }
    }
  };
  this.Search = new Search();
}).apply( fvdSpeedDial );