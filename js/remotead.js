(function(){

  const UPDATE_AD_INTERVAL = 24 * 3600 * 1 * 1000; // 7 days

  const AD_URL = "https://s3.amazonaws.com/fvd-special/remotead/fvdsd_chrome2.json";

  const USE_CACHE = true;

  var console = {};

  var messages = {
    donotdisplay: _("newtab_do_not_display_migrate")
  };

  var supportedLanguages = [];
  var adHTML = '<div>'+
    '<iframe></iframe>'+
  '</div>';

  chrome.i18n.getAcceptLanguages(function(languageList) {
    supportedLanguages = languageList;
  });

  console.log = function(){

    var args = Array.prototype.slice.call(arguments);

    args.unshift( "REMOTEAD:" );

    window.console.log.apply( window.console, args );

  };

  console.error = function(){

    var args = Array.prototype.slice.call(arguments);

    args.unshift( "REMOTEAD ERROR:" );

    window.console.error.apply( window.console, args );

  };

  if( !USE_CACHE ){
    window.console.warn("Use REMOTEAD without cache!");
  }



  var storage = new function(){
    function _k( k ){
      return "__remotead." + k;
    }
    this.set = function( k, v ){
      localStorage[_k(k)] = v;
    };
    this.get = function( k ){
      return localStorage[_k(k)];
    };
  };

  function getUrlContents( url, callback ){
    var xhr = new XMLHttpRequest();
    xhr.open( "GET", url );
    xhr.onload = function(){
      callback( xhr.responseText );
    };

    xhr.send( null );
  }

  function hasEqualElements(a, b){
    for( var i = 0; i != a.length; i++ ){
      if( b.indexOf( a[i] ) != -1 ){
        return true;
      }
    }

    return false;
  }

  function cloneObj( obj ){
    return JSON.parse( JSON.stringify( obj ) );
  }

  function parseUrl(str, component){

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

  }

  /* tab listener */

  Broadcaster.onMessage.addListener(function( msg ){

    if( msg.a == "remoteAD:ignore" ){

      RemoteAD.ignoreAd( msg.id );

    }

  });

  chrome.tabs.onUpdated.addListener(function( tabId, changeInfo, tab ){

    if( changeInfo.status == "complete" ){

      try{

        var host = parseUrl( tab.url, "host" ).toLowerCase();
        host = host.replace(/^www\./, "");

        RemoteAD.getADToShow({
          host: host
        }, function( ad ){

          if( ad ){

            chrome.tabs.sendMessage( tabId, {
              a: "fvd:remotead:show",
              ad: ad,
              html: adHTML
            } );

          }

        });

      }
      catch( ex ){

        console.error("Fail check tab", ex);

      }

    }

  });

  /*main*/

  var RemoteAdClass = function(){

    var _isFirstStart = null;

    function cacheTTL( cache ){
      return new Date().getTime() - cache.createDate;
    }

    function getADList( params, callback ){

      var cache = storage.get("adcache");

      var now = new Date().getTime();

      if( USE_CACHE && cache ){
        try{
          cache = JSON.parse(cache);

          if( cacheTTL(cache) > 0 ){
            console.log("CACHE!");

            return callback( cache.data );
          }
        }
        catch( ex ){

        }
      }

      getUrlContents( AD_URL + "?c=" + (new Date().getTime()), function( text ){

        console.log(text);

        var data = JSON.parse(text);

        var cache = {
          createDate: new Date().getTime(),
          data: data
        };

        storage.set( "adcache", JSON.stringify( cache ) );

        callback( data );

      } );

    }

    function isFirstStart(){

      if( _isFirstStart === null ){

        if( !storage.get("firstStartCompleted") ){
          _isFirstStart = true;
          storage.set("firstStartCompleted", true);
        }
        else{
          _isFirstStart = false;
        }

        console.log("Is first start?", _isFirstStart);

      }

      return _isFirstStart;

    }

    function canDisplayAD( ad ){

      var now = new Date().getTime();

      if( ad.languages ){
        if( !hasEqualElements( ad.languages, supportedLanguages ) ){
          console.log("Language not supported", ad.languages,", not in list of ", supportedLanguages);
          return false;
        }
      }

      if( ad.newUserDelay ){

        var obtainedTime = parseInt( storage.get( "ad.obtained_time." + ad.id ) );

        if( obtainedTime ){
          if( now - obtainedTime < ad.newUserDelay * 3600 * 1000 ){
            console.log("Delay is active");

            return false;
          }
        }
        else if( isFirstStart() ){
          storage.set( "ad.obtained_time." + ad.id, now );

          console.log("Need to wait delay for first start", ad.newUserDelay);

          return false;
        }

      }

      var adIgnored = !!parseInt( storage.get( "ad.ignored." + ad.id ) );

      if( adIgnored ){
        console.log("AD is ignored by user");

        return false;
      }

      return true;

    }

    function getADToShow( params, callback ){

      if( typeof params == "function" ){
        callback = params;
        params = {};
      }

      params = params || {};

      getADList( null, function( ads ){

        for( var i = 0; i != ads.length; i++ ){
          var ad = ads[i];

          if( params.nohosts && ad.hosts && ad.hosts.length > 0 ){
            continue;
          }

          if( params.host && ( !ad.hosts || ad.hosts.indexOf( params.host ) == -1 ) ){
            continue;
          }

          ad = cloneObj( ad );

          ad.frameUrl += "?id=" + encodeURIComponent( ad.id );

          if( canDisplayAD( ad ) ){
            callback( ad );
            return;
          }
          else{
            console.log("Can't show");
          }
        }

        callback( null );

      } );

    }

    this.ignoreAd = function( adId ){
      storage.set( "ad.ignored." + adId, 1 );
    };

    this.getADToShow = function(){

      // always empty
      return [];

      //return getADToShow.apply( this, arguments );

    };


  };

  var RemoteAD = new RemoteAdClass();
  window.RemoteAD = RemoteAD;
})();
