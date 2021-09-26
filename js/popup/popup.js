(function(){
	
	var Popup = function(){
		window.addEventListener( "load", function(){	
	
			fvdSpeedDial.Localizer.localizeCurrentPage();			
			
		}, false );
	}
	
	Popup.prototype = {
		showOptions: function(){
			fvdSpeedDial.Utils.Opener.newTab( chrome.extension.getURL("options.html") );
		},
		
		showSpeedDial: function(){
			fvdSpeedDial.Utils.Opener.newTab( chrome.extension.getURL("newtab.html") );			
		}
	}
	
	this.Popup = new Popup();
		
}).apply(fvdSpeedDial);
