if (typeof __fvdSpeedDial_inserted == "undefined" && !document.getElementById("fvdSpeedDialCropper_delay")) {

	__fvdSpeedDial_inserted = true;

	(function(){

    function viewPortSize() {
      var res = {};
      if (document.compatMode === 'BackCompat') {
        res.height = document.body.clientHeight;
        res.width = document.body.clientWidth;
      } else {
        res.height = document.documentElement.clientHeight;
        res.width = document.documentElement.clientWidth;
      }
      return res;
    }

		function _( msg ){
			return chrome.i18n.getMessage( msg );
		}

		function fixFlash(){
			var objects = document.getElementsByTagName( "object" );
			var _singleEmbeds = document.getElementsByTagName( "embed" );
			var singleEmbeds = [];
			for( var i = 0; i != _singleEmbeds.length; i++ ){
				singleEmbeds.push( _singleEmbeds[i] );
			}

			for( var i = 0; i != objects.length; i++ ){
				var needReplace = false;

				var _embed = objects[i].getElementsByTagName("embed")[0];
				if( _embed ){
					var index;
					if( (index = singleEmbeds.indexOf( _embed )) != -1 ){
						singleEmbeds.splice( index, 1 );
					}
				}

				var object = objects[i].cloneNode( true );
				var embed = object.getElementsByTagName("embed")[0];

				if( embed ){
					if( embed.getAttribute( "wmode" ) != "transparent" ){
						needReplace = true;
					}

					embed.setAttribute( "wmode", "transparent" );
				}


				//<param name="background" value="transparent" />
				//<param name="windowless" value="true" />

				var objectType = null;

				var params = object.getElementsByTagName( "param" );

				for( var j = 0; j != params.length; j++ ){
					if( params[j].getAttribute("name").toLowerCase() == "movie" ){
						objectType = "flash";
						break;
					}
					if( params[j].getAttribute("name").toLowerCase() == "source" ){
						objectType = "silverlight";
						break;
					}
				}



				if( objectType == "flash" ){
					var paramElem = null;

					for (var j = 0; j != params.length; j++) {
						if( params[j].getAttribute("name").toLowerCase() == "wmode" ){
							paramElem = params[j];
							break;
						}
					}

					if( !paramElem ){
						paramElem = document.createElement( "param" );
						object.appendChild( paramElem );
					}

					if( paramElem.getAttribute( "wmode" ) != "transparent" ){
						needReplace = true;
					}

					paramElem.setAttribute( "name", "wmode" );
					paramElem.setAttribute( "value", "transparent" );
				}
				else if( objectType == "silverlight" ){

					var paramElem = null;

					for (var j = 0; j != params.length; j++) {
						if( params[j].getAttribute("name").toLowerCase() == "windowless" ){
							paramElem = params[j];
							break;
						}
					}

					if( !paramElem ){
						paramElem = document.createElement( "param" );
						object.appendChild( paramElem );
					}

					if( paramElem.getAttribute("value") != "true" ){
						needReplace = true;
					}
					paramElem.setAttribute( "name", "windowless" );
					paramElem.setAttribute( "value", "true" );

				}



				if( needReplace ){
					objects[i].parentNode.replaceChild( object, objects[i] );
				}
			}

			for( var i = 0; i != singleEmbeds.length; i++ ){
				var embed = singleEmbeds[i];
				if( embed.getAttribute("wmode") == "transparent" ){
					continue;
				}

				var newEmbed = embed.cloneNode(true);
				newEmbed.setAttribute( "wmode", "transparent" );
				embed.parentNode.replaceChild( newEmbed, embed );
			}

		}

		var overlay = null;
		var initData = null;
		var interval = null;
		var delayBox = null;
		var button = null;
		var cancelButton = null;
		var buttonStartCrop = null;
		var img = null;
		var keyListener = null;
		var pleaseWaitDiv = null;
		var delayBoxResizeWindowListener = null;

		var listener = function(port){

			// immedately remove listener, accept only one connection
			chrome.extension.onConnect.removeListener( listener );

			if( document.getElementsByTagName("frame").length != 0 ){
				// if has frame set do not screen by marquee, screen full page

				var framesCounter = 0;

				function getFrames( doc ){
					var frames = doc.getElementsByTagName("frame");

					for( var i = 0; i != frames.length; i++ ){
						var frame = frames[i];
						framesCounter++;

						(function( frame ){

							frame.addEventListener( "load", function(){

								framesCounter--;
								if( getFrames( frame.contentDocument ) == 0 && framesCounter == 0 ){

									port.postMessage({"message": "make_fullscreen_snapshoot"});

								}

							}, false );


						})( frame );

					}

					return frames.length;
				}

				getFrames( document );

				return;
			}

			setTimeout( function(){
				port.postMessage({"message": "ready_to_init"});
			}, 100 );

			fixFlash();

			keyListener = function(event){

				if (event.keyCode == 27) {
					port.postMessage({
						"message": "click_cancel"
					});
				}

			}

			port.onMessage.addListener(function(message){

				switch (message.message) {
					case "destroy":

						try {
							delayBox.setAttribute("hidden", true);

							try {
								document.removeEventListener("keydown", keyListener);
							}
							catch (ex) {

							}

							try{
								window.removeEventListener( "resize", delayBoxResizeWindowListener );
							}
							catch( ex ){

							}

							try {
								var ias = $(img).imgAreaSelect({
									instance: true
								});
								ias.cancelSelection();
							}
							catch (ex) {

							}

							button.setAttribute("hidden", true);
							cancelButton.setAttribute("hidden", true);
							overlay.setAttribute("hidden", true);

							try {
								var ttHolder = document.getElementById("tiptip_holder");
								ttHolder.parentNode.removeChild(ttHolder);
							}
							catch (ex) {

							}
						}
						catch (ex) {

						}


						break;

					case "captured":

						pleaseWaitDiv = document.createElement("div");
						pleaseWaitDiv.textContent = _("cropper_message_wait");
						pleaseWaitDiv.setAttribute("id", "fvdSpeedDialCropper_PleaseWait");

						overlay.style.backgroundColor = "rgba(0,0,0,0.8)";

						overlay.appendChild(pleaseWaitDiv);

						break;

					case "url_setted":

						port.postMessage({
							message: "return_to_speeddial"
						});

					break;

					case "created":

						var toSpeedDial = true;

						try{
							if( message.data.urlChanged ){
								toSpeedDial = false;

								pleaseWaitDiv.textContent = "";

								var selectUrlContainer = document.createElement( "div" );
								selectUrlContainer.className = "fvdSpeedDial_questionContainer";

								var divUrlOld = document.createElement("div");
								var divUrlnew = document.createElement("div");
								divUrlOld.className = "fvdSpeedDial_urlPickRow";
								divUrlnew.className = "fvdSpeedDial_urlPickRow";

								var spanOldUrl = document.createElement("span");
								var spanNewUrl = document.createElement("span");

								spanOldUrl.className = "fvdSpeedDial_urlContent";
								spanNewUrl.className = "fvdSpeedDial_urlContent";

								spanOldUrl.setAttribute( "title", message.data.startUrl );
								spanNewUrl.setAttribute( "title", message.data.currentUrl );

								var urlPickLinkOld = document.createElement("span");
								var urlPickLinkNew = document.createElement("span");
								urlPickLinkOld.textContent = _("cropper_pick_this");
								urlPickLinkNew.textContent = _("cropper_pick_this");
								urlPickLinkNew.className = "fvdSpeedDial_urlPickLink";
								urlPickLinkOld.className = "fvdSpeedDial_urlPickLink";

								urlPickLinkNew.addEventListener( "click", function( event ){
									if( event.button == 0 ){
										port.postMessage( {message: "set_url", data:{
											url: message.data.currentUrl
										}} );
									}
								}, false );

								urlPickLinkOld.addEventListener( "click", function( event ){
									if( event.button == 0 ){
										port.postMessage( {message: "set_url", data:{
											url: message.data.startUrl
										}} );
									}
								}, false );

								spanOldUrl.textContent = _("cropper_your_url") + ": " +  message.data.startUrl;
								spanNewUrl.textContent = _("cropper_last_page_url") + ": " +  message.data.currentUrl;

								divUrlOld.appendChild(spanOldUrl);
								divUrlnew.appendChild(spanNewUrl);
								divUrlOld.appendChild(urlPickLinkOld);
								divUrlnew.appendChild(urlPickLinkNew);

								selectUrlContainer.appendChild(divUrlOld);
								selectUrlContainer.appendChild(divUrlnew);

								pleaseWaitDiv.appendChild(selectUrlContainer);
							}
						}
						catch( ex ){

						}

						if( toSpeedDial ){
							port.postMessage({
								message: "return_to_speeddial"
							});
						}



						break;

					case "init":

						initData = message.data;

						document.addEventListener("keydown", keyListener, false);

						var elapsed = 0;

						function adjustDelayBoxPosition(){
							var left = delayBox.style.left.replace( "px", "" );
							var top = delayBox.style.top.replace( "px", "" );

							var maxLeft = document.documentElement.clientWidth - delayBox.offsetWidth;
							var maxTop = window.innerHeight - delayBox.offsetHeight - 40;

							if( left > maxLeft ){
								left = maxLeft;
							}
							if( top > maxTop ){
								top = maxTop;
							}

							delayBox.style.left = left + "px";
							delayBox.style.top = top + "px";
						}

						delayBoxResizeWindowListener = function(){
							adjustDelayBoxPosition();
						}

						window.addEventListener( "resize", delayBoxResizeWindowListener, false );

						delayBox = document.createElement("div");

						delayBox.style.left = initData.photoPosition.left + "px";
						delayBox.style.top = initData.photoPosition.top + "px";

						delayBox.setAttribute("id", "fvdSpeedDialCropper_delay");

						buttonStartCrop = document.createElement("div");
						buttonStartCrop.className = "fvdSpeedDialCropper_SnapImage";
						buttonStartCrop.setAttribute("id", "fvdSpeedDialCropper_StartCrop");

						buttonStartCrop.setAttribute("title", _("cropper_click_to_make_preview"));
						$(buttonStartCrop).tipTip({activeOnStart: true, defaultPosition: "right"});

						buttonStartCrop.addEventListener("click", function(){
							try{
								document.getElementById("tiptip_holder").style.display = "none";
							}
							catch( ex ){

							}
							port.postMessage({
								"message": "click_start_crop"
							});
						}, false);

						var buttonCancelCrop = document.createElement("div");
						buttonCancelCrop.className = "fvdSpeedDialCropper_cancel";
						buttonCancelCrop.setAttribute("id", "fvdSpeedDialCropper_DelayCancelCrop");

						buttonCancelCrop.addEventListener("click", function(){
							port.postMessage({
								"message": "click_cancel"
							});
						}, false);

						var moveButton = document.createElement("div");
						moveButton.className = "fvdSpeedDialCropper_move";
						moveButton.setAttribute("id", "fvdSpeedDialCropper_DelayMove");


						moveButton.addEventListener("mousedown", function(event){
							var tmpOverlay = document.createElement( "div" );
							tmpOverlay.style.position = "fixed";
							tmpOverlay.style.left = "0px";
							tmpOverlay.style.top = "0px";
							tmpOverlay.style.width = "100%";
							tmpOverlay.style.height = "100%";
							tmpOverlay.style.zIndex = 99999999;
							document.body.appendChild(tmpOverlay);

							var posLeft = delayBox.style.left.replace("px", "");
							var posTop = delayBox.style.top.replace("px", "");

							try {
								posLeft = parseFloat(posLeft);
								posTop = parseFloat(posTop);
								if (isNaN(posLeft)) {
									posLeft = 0;
								}
								if (isNaN(posTop)) {
									posTop = 0;
								}
							}
							catch (ex) {

							}

							var startX = event.screenX;
							var startY = event.screenY;

							var moveEvent = function(event){
								//
								var newLeft = posLeft + event.screenX - startX;
								var newTop = posTop + event.screenY - startY;

								var allowLeft = true;
								var allowTop = true;

								if (newLeft < 0) {
									allowLeft = false;
								}
								else
									if (newLeft + delayBox.offsetWidth > document.documentElement.clientWidth) {
										allowLeft = false;
									}

								if (newTop < 0) {
									allowTop = false;
								}
								else
									if (newTop + delayBox.offsetHeight + 40 > window.innerHeight) {
										allowTop = false;
									}

								if (allowLeft) {
									delayBox.style.left = newLeft + "px";
								}

								if (allowTop) {
									delayBox.style.top = newTop + "px";
								}


								event.preventDefault();
								event.stopPropagation();
							}

							var mouseUpEvent = function(){
								document.removeEventListener("mousemove", moveEvent);
								document.removeEventListener("mouseup", mouseUpEvent);

								try{
									tmpOverlay.parentNode.removeChild(tmpOverlay);
								}
								catch( ex ){

								}

								port.postMessage( {message: "change_photo_position", data:{
									left: delayBox.style.left.replace("px", ""),
									top: delayBox.style.top.replace("px", "")
								}} );

							}
							document.addEventListener("mousemove", moveEvent, false);
							document.addEventListener("mouseup", mouseUpEvent, false);

							event.preventDefault();
							event.stopPropagation();
						}, false);

						delayBox.appendChild(buttonStartCrop);
						delayBox.appendChild(buttonCancelCrop);
						delayBox.appendChild(moveButton);

						document.body.appendChild(delayBox);

						setTimeout( function(){
							adjustDelayBoxPosition();
						}, 100 );

						break;

					case "show_crop_area":

						delayBox.setAttribute("hidden", true);
						buttonStartCrop.setAttribute( "hidden", true );


						overlay = document.createElement("div");
						overlay.setAttribute("id", "fvdSpeedDialCropper_Overlay");

						img = document.createElement("img");
						img.src = chrome.extension.getURL("images/cropper/img.png");

						overlay.appendChild(img);

						document.body.appendChild(overlay);

						button = document.createElement("div");
						button.setAttribute("id", "fvdSpeedDialCropper_Snap");
						button.setAttribute("hidden", true);
						button.setAttribute("title", _("cropper_click_to_make_preview"));
						button.className = "fvdSpeedDialCropper_SnapImage";

						button.addEventListener("click", function(event){
							var ias = $(img).imgAreaSelect({
								instance: true
							});
							var selection = ias.getSelection();
							ias.cancelSelection();
							button.setAttribute("hidden", true);
							cancelButton.setAttribute("hidden", true);

							try {
								var ttHolder = document.getElementById("tiptip_holder");
								ttHolder.parentNode.removeChild(ttHolder);
							}
							catch (ex) {

							}
              selection.x1 *= window.devicePixelRatio;
							selection.y1 *= window.devicePixelRatio;
							selection.width *= window.devicePixelRatio;
              selection.height *= window.devicePixelRatio;

							setTimeout(function(){
								port.postMessage({
									"message": "snapshoot",
									"data": selection
								});
							}, 100);


						}, false);

						document.body.appendChild(button);

						try {
							$(button).tipTip({
								activeOnStart: true
							});
						}
						catch (ex) {

						}

						cancelButton = document.createElement("div");
						cancelButton.className = "fvdSpeedDialCropper_cancel";
						cancelButton.setAttribute("hidden", true);

						cancelButton.addEventListener("click", function(){
							port.postMessage({
								"message": "click_cancel"
							});
						}, false);

						document.body.appendChild(cancelButton);

						var positionButton = function(params){
							button.style.left = params.x1 + 3 + "px";
							button.style.top = params.y2 - button.offsetHeight - 3 + "px";

							var posTop = params.y1 - cancelButton.offsetHeight;
							if (posTop < 0) {
								posTop = 0;
							}

							cancelButton.style.left = params.x2 + 3 + "px";
							cancelButton.style.top = posTop + "px";
						};

						var whRatio = initData.init.width / initData.init.height;
            var windowSize = viewPortSize();
            var winWidth = windowSize.width;
            var winHeight = windowSize.height;

						if( winWidth < initData.init.width ){
							initData.init.width = winWidth;
							initData.init.height = initData.init.width / whRatio;
						}

						if( winHeight < initData.init.height ){
							initData.init.height = winHeight;
							initData.init.width = initData.init.height * whRatio;
						}

						var x1 = Math.round((winWidth - initData.init.width)/2);
						var y1 = Math.round((winHeight - initData.init.height)/2);
						var x2 = x1 + initData.init.width;
						var y2 = y1 + initData.init.height;

						$(img).imgAreaSelect({
							parent: overlay,
							handles: true,
							persistent: true,
							x1: x1,
							y1: y1,
							x2: x2,
							y2: y2,
							aspectRatio: initData.aspectRatio + ":1",
							minWidth: initData.minWidth,
							onSelectChange: function(img, params){
								positionButton(params);
								return true;
							},
							onInit: function(img, params){
								button.removeAttribute("hidden");
								cancelButton.removeAttribute("hidden");
								positionButton(params);
								return true;
							}
						});

						break;
				}

			});




		};


		chrome.extension.onConnect.addListener( listener );



	})();

}