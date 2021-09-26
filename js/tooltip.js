(function(){
	var ToolTip = function(){
		
	};
	
	ToolTip.prototype = {
		_container: null,
		_arrowLeftOffset: 10,
		_arrowTopOffset: 19,		
		_currentElement: null,
		
		displayImage: function( elem, imageSrc, event ){
			var html = "<img src=\""+imageSrc+"\"/>";
			this.display( elem, html, event );
		},
		
		display: function( elem, html, event, isText ){
			event.stopPropagation();
			
			if( this._currentElement == elem ){
				return;				
			}
			
			this._currentElement = elem;
			
			var that = this;
			
			var setFunction = function(){
				var toolTipContainer = fvdSpeedDial.Templates.clone( "tiptip_holder" );
				that._container = toolTipContainer;	
				
				// position
				var offset = fvdSpeedDial.Utils.getOffset( elem );
				toolTipContainer.style.left = offset.left + (elem.offsetWidth/2) - that._arrowLeftOffset - 1 + "px";
				toolTipContainer.style.top = offset.top + elem.offsetHeight + that._arrowTopOffset + "px";			
				
				document.body.appendChild( that._container );	
				var contentContainer = document.getElementById("tiptip_content");
				if(isText) {
				  contentContainer.classList.add("textTip");
				}
				if( html.tagName ){
					contentContainer.appendChild( html );			
				}
				else{
					contentContainer.innerHTML = html;					
				}
				
				setTimeout( function(){
					toolTipContainer.setAttribute( "active", 1 );				
					that._assignClickListener();				
				}, 0 );	
			};
			
			if( this._container ){
				this.close( setFunction );
			}		
			else{
				setFunction();
			}	
		},
		
		close: function( callback ){
			
			fvdSpeedDial.ToolTip._container.setAttribute( "active", 0 );
			
			fvdSpeedDial.ToolTip._container.addEventListener( "webkitTransitionEnd", function(){
				try{
					fvdSpeedDial.ToolTip._container.parentNode.removeChild( fvdSpeedDial.ToolTip._container );
					fvdSpeedDial.ToolTip._container = null;
					fvdSpeedDial.ToolTip._currentElement = null;
					fvdSpeedDial.ToolTip._removeClickListener();
					
					if( callback ){
						callback();
					}
				}
				catch( ex ){
					
				}
			}, false );		
			
		},
		
		_clickListener: function( event ){
			if( fvdSpeedDial.ToolTip._container ){
				var el = event.target;
				do{
					if( el == fvdSpeedDial.ToolTip._container ){
						return;
					}
					el = el.parentNode;
				}
				while( el );
			}	
			
			fvdSpeedDial.ToolTip.close();
		},
				
		_assignClickListener: function(){
			document.addEventListener( "click", fvdSpeedDial.ToolTip._clickListener, false );
		},
		
		_removeClickListener: function(){
			document.removeEventListener( "click", fvdSpeedDial.ToolTip._clickListener );
		}
	};
	
	this.ToolTip = new ToolTip();
}).apply(fvdSpeedDial);
