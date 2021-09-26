(function(){

	var AD = function( label ){
		
		if( _b( fvdSpeedDial.Prefs.get("ad_dontDisplay_" + label) ) ){
			return;
		}
		
		var containerId = "ad_"+label+"Message";
		var interval = null;		
		
		document.querySelector("#"+containerId+" .ad_dontShow").addEventListener("click", function( e ){
			
			fvdSpeedDial.Prefs.set("ad_dontDisplay_" + label, e.target.checked);
			
		}, false);
		
		function setRandomShowInFuture( now ){
			now = now || new Date().getTime();
			
			var randomMinutesToShow = fvdSpeedDial.Utils.getRandomInt( 60, 1000 );
			fvdSpeedDial.Prefs.set( "ad_lastShow_" + label, now + randomMinutesToShow * 60 * 1000 );
		}
		
		function show(){
			var lastShowTime = parseInt(fvdSpeedDial.Prefs.get( "ad_lastShow_" + label ));
			var now = new Date().getTime();
			
			if( _b( fvdSpeedDial.Prefs.get("ad_dontDisplay_" + label) ) ){
				return;
			}
			
			if( !lastShowTime ){
				setRandomShowInFuture();
				
				return;	
			}					
						
			if( now - lastShowTime >= fvdSpeedDial.Config.DISPLAY_AD_EVERY ){
				
				fvdSpeedDial.SpeedDialMisc.showOptions( containerId, document.getElementById( "searchBar" ), null, null, function(){
					setRandomShowInFuture( lastShowTime );
				}, function(){
					fvdSpeedDial.Prefs.set( "ad_lastShow_" + label, now );
				} );
				
			}
		}
		
				
		interval = setInterval( show, 1000 );
					
	};
		
	fvdSpeedDial.newTabAD = new function(){
		
		var ads = [];
		
		document.addEventListener( "DOMContentLoaded", function(){
			
			var popups = document.getElementsByClassName("sdAdPopup");
			
			for( var i = 0; i != popups.length; i++ ){
				var tmp = popups[i].getAttribute("id").match(/^ad_(.+)Message$/i);
				ads.push( new AD(tmp[1]) );
			}		
			
		}, false);
		
	};
	
	
})();


//showOptions: function( containerId, toElem, event, pos, waitForOtherOpened ){