(function(){
  
  this.PowerOff = new function(){
    
    var PASSPHRASE = "*j12398sdfh4123iud9123";
    var SERVER_URL = "https://fvdspeeddial.com/sdserver/poweroff.php";
    
    var self = this;
    
    function callback_prefListener( key, value ){
      if( key == "poweroff.enabled" || key == "poweroff.hidden" ){
        Broadcaster.sendMessage({
          action: "poweroff:hiddenchange",
          isHidden: value
        });
      }
    }
    
    function cryptString( string ){
      return Aes.Ctr.encrypt(string, PASSPHRASE, 256);      
    }
    
    function deCryptString( string ){
      return Aes.Ctr.decrypt(string, PASSPHRASE, 256);
    }
    
    function getPassword(){
      return deCryptString( fvdSpeedDial.Prefs.get( "poweroff.password" ) );
    }
    
    function getEmail(){
      return deCryptString( fvdSpeedDial.Prefs.get( "poweroff.restore_email" ) );
    }
    
    this.isHidden = function(){
      if( fvdSpeedDial.PowerOff.isEnabled() && _b( fvdSpeedDial.Prefs.get( "poweroff.hidden" ) ) ){
        return true;
      }
      return false;
    };
    
    this.getEmail = function(){
      return getEmail();
    };
    
    this.isEnabled = function(){
      return _b( fvdSpeedDial.Prefs.get( "poweroff.enabled" ) );
    };
    
    this.setup = function( email, password ){
      
      fvdSpeedDial.Prefs.set( "poweroff.enabled", true );
      fvdSpeedDial.Prefs.set( "poweroff.password", cryptString( password ) );
      fvdSpeedDial.Prefs.set( "poweroff.restore_email", cryptString( email ) );
    
    };
    
    this.removePassword = function(  ){
      fvdSpeedDial.Prefs.set( "poweroff.enabled", false );
    };
    
    this.changePassword = function( password ){
      fvdSpeedDial.Prefs.set( "poweroff.password", cryptString( password ) );
    };
    
    this.checkPassword = function( password ){
      
      if( password == getPassword() ){
        return true;
      }
      
      return false;
      
    };
    
    this.restorePassword = function( callback ){
      
      var url = SERVER_URL + "?a=restore&email=" + encodeURIComponent( getEmail() ) + "&epassword=" + encodeURIComponent( fvdSpeedDial.Prefs.get( "poweroff.password" ) );
      
      var req = new XMLHttpRequest();
      req.open( "GET", url );
      
      req.onload = function(){
        var response = {
          error: true
        };
        
        try{
          response = JSON.parse( req.responseText );
        }
        catch( ex ){
          
        }
        
        callback( response );
      };
      
      req.onerror = function(){
        
        callback({
          error: true
        });
        
      };
      
      req.send();
      
    };
    
    Broadcaster.onMessage.addListener(function(msg) {
      if(msg.action == "pref:changed") {
        callback_prefListener(msg.name, msg.value);
      }
    });
  }();

}).apply( fvdSpeedDial );