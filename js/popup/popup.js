(function(){
	
	var Popup = function(){
		window.addEventListener( "load", function(){	
	
			fvdSpeedDial.Localizer.localizeCurrentPage();			
			
		}, false );
	}
	
	Popup.prototype = {
		showOptions: function(){
			fvdSpeedDial.Utils.Opener.newTab( chrome.runtime.getURL("options.html") );
		},
		
		showSpeedDial: function(){
			fvdSpeedDial.Utils.Opener.newTab( chrome.runtime.getURL("newtab.html") );			
		}
	}
	
	this.Popup = new Popup();
		
}).apply(fvdSpeedDial);
