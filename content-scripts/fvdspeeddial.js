var elems = document.getElementsByName( "enableSuperfish" );

for( var i = 0; i != elems.length; i++ ){
	
	(function( elem ){
		
		elem.addEventListener( "click", function(){

			chrome.extension.sendMessage( {
				action: "setSuperFishState",
				value: elem.value == 1 ? true : false
			} );
			
		} );
		
	})( elems[i] );
	
}
