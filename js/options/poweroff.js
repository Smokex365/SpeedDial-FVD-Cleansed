fvdSpeedDial.Options.PowerOff = new function(){
	
	var self = this;
	
	function refresh(){
		
		var tabChangePass = document.getElementById( "poweroffTabChangePassCode" );
		var tabRestore = document.getElementById( "poweroffTabRestorePassCode" );
		
		var setupForm = document.querySelector( ".tabCreate .createPassCode" );
		var setupedMessage = document.querySelector( ".tabCreate .setuped" );
		
		if( !fvdSpeedDial.PowerOff.isEnabled() ){
			
			tabChangePass.style.display = "none";
			tabRestore.style.display = "none";
						
			if( fvdSpeedDial.Options.Tabs.tabsA["powerOffTabs"] ){
				fvdSpeedDial.Options.Tabs.tabsA["powerOffTabs"].setActiveTab( 0 );
			}			
			
			setupForm.style.display = "block";
			setupedMessage.style.display = "none";
				
		}
		else{
			tabChangePass.style.display = "";
			tabRestore.style.display = "";		
			
			setupForm.style.display = "none";
			setupedMessage.style.display = "block";
			
			document.getElementById( "currentPassCodeEmail" ).textContent = fvdSpeedDial.PowerOff.getEmail();
		}
		
	}
	
	function hideErrors(){
		
		var errors = document.querySelectorAll( "#poweroffSettings .error" );
		
		for( var i = 0; i != errors.length; i++ ){			
			errors[i].style.display = "none";			
		}
		
	}
	
	function showError( id, text ){
		
		var error = document.getElementById( id );
		
		console.log( id, error );
		
		error.textContent = text;
		error.style.display = "block";
		
	}
	
	this.createPassCode = function(){
		
		hideErrors();
		
		var passCode = document.getElementById( "passcodeValue" ).value;
		var repeatPasscode = document.getElementById( "repeatPasscodeValue" ).value;
		var email = document.getElementById( "reserveEmailValue" ).value;
		
		if( !passCode ){			
			return showError( "createPassCodeError", _("options_poweroff_error_empty_passcode") );
		}
		
		if( passCode != repeatPasscode ){			
			return showError( "createPassCodeError", _("options_poweroff_error_passcode_dont_match") );
		}
		
		if( !fvdSpeedDial.Utils.validateText( "email", email ) ){
			return showError( "createPassCodeError", _("options_poweroff_error_email_wrong_format") );
		}
		
		document.getElementById( "passcodeValue" ).value = "";
		document.getElementById( "repeatPasscodeValue" ).value = "";
		document.getElementById( "reserveEmailValue" ).value = "";
		
		fvdSpeedDial.PowerOff.setup( email, passCode );
		
		//document.getElementById( "closeButton" ).setAttribute( "active", 1 );
		
		refresh();
		
	};
	
	this.changePassCode = function(){
		
		hideErrors();
		
		var oldPassCode = document.getElementById( "oldPasscodeValue" ).value; 
		var newPassCode = document.getElementById( "newPasscodeValue" ).value; 
		
		if( !fvdSpeedDial.PowerOff.checkPassword( oldPassCode ) ){
			return showError( "changePassCodeError", _("options_poweroff_error_wrong_pass_code") );
		}
		
		document.getElementById( "oldPasscodeValue" ).value = "";
		document.getElementById( "newPasscodeValue" ).value = "";	
	
		//document.getElementById( "closeButton" ).setAttribute( "active", 1 );
	
		if( !newPassCode ){
			fvdSpeedDial.PowerOff.removePassword();
			refresh();
			
			return;
		}
		
		fvdSpeedDial.PowerOff.changePassword( newPassCode );
		
		fvdSpeedDial.Dialogs.alert( _("options_poweroff_passcode_changed_title"), _("options_poweroff_passcode_changed_text") );
		
	};
	
	this.restorePassCode = function(){
		
		fvdSpeedDial.PowerOff.restorePassword( function(){
			
			fvdSpeedDial.Dialogs.alert( _("options_powerof_password_restore_title"), _("options_powerof_password_restore_text") + ":<br>" + fvdSpeedDial.PowerOff.getEmail() );
			
		} );
		
	};
	
	window.addEventListener( "load", function(){
		
		document.getElementById( "createPassCode" ).addEventListener("click", function(){
			
			self.createPassCode();
			
		}, false);
		
		document.getElementById( "changePassCode" ).addEventListener( "click", function(){
			
			self.changePassCode();
			
		}, false );
		
		document.getElementById( "resorePassCode" ).addEventListener( "click", function(){
			
			self.restorePassCode();
			
		}, false );
		
		refresh();
		
	}, false );
	
};
