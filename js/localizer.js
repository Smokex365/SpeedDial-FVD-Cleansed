var _enMessages = null;

function _( msg ){
	var text = chrome.i18n.getMessage(msg);

	if( !text ){
		text = "";
	}

	return text;
}

(function(){

	var Localizer = function(){

	};
	Localizer.prototype = {
		localizeCurrentPage: function(){
			this.localizeElem(document);
		},
		localizeElem: function(el) {
			var elements = el.querySelectorAll( "*[msg]" );
			for( var i = 0, len = elements.length; i != len; i++ ){
				var element = elements[i];
				if( element.hasAttribute("msg_target") ){
					element.setAttribute( element.getAttribute("msg_target"), _( element.getAttribute("msg") ) );
				}
				else{
					element.innerHTML = _( element.getAttribute("msg") );
				}
				element.removeAttribute( "msg" );
			}
		}
	};

	this.Localizer = new Localizer();

}).apply( fvdSpeedDial );
