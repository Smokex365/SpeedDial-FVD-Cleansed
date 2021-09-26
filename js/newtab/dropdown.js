const SETTINGS_KEY_BRANCH = 'fvdsd.';

window.current_value = null;

var dd_data = [];
var selected_value = null;
var allow_close = false;
var menu_opened = false;
var sites_info = {
	"web": {
		cx: "001477807305393216127:7dbycpqumuw",
		selected: true
	},
	"video-search": {
		redirect: "https://fvdvideo.com/search/?q=%q%"
	},
	/*
	"adult":{
		cx: "009547620127771566411:ry_eo0aja1o"
	},
	*/
	"flash-games":{
		cx: "009547620127771566411:vdegr9qva-o"
	},
	"video":{
		cx: "partner-pub-5087362176467115:h6z8ss-efx2"
	},
	"people":{
		cx: "009547620127771566411:tzp3hyliplo"
	},
	'twitter': {
		redirect: "https://twitter.com/search?q=%q%"
	},
	'wiki' : {
		redirect: "https://en.wikipedia.org/wiki/%q%"
	},
	"youtube" : {
		redirect: "https://www.youtube.com/results?search_type=&aq=f&search_query=%q%"
	},
	"metacafe" : {
		redirect: "https://www.metacafe.com/tags/%q%"
	},
	"google_videos" : {
		redirect: "https://www.google.com/search?q=%q%&tbs=vid:1",
		ico : "google"
	},
	"google_images" : {
		redirect : "https://images.google.com/images?q=%q%",
		ico : "google"
	},
	"myspace" : {
		redirect: "https://www.myspace.com/search/videos?q=%q%"
	},
	"dailymotion" : {
		redirect : "https://www.dailymotion.com/relevance/search/%q%"
	},
	"break" : {
		redirect : "https://www.break.com/surfacevideo/%q%"
	},
	"blip": {
		redirect: "https://www.blip.tv/search?q=%q%"
	},
	"spike" : {
		redirect: "https://www.spike.com/search?mkt=en-us&FORM=VCM050&query=%q%"
	},
	"myvideo" : {
		redirect: "https://www.myvideo.de/Videos_A-Z?searchWord=%q%"
	},
	"flurl" : {
		redirect: "https://www.flurl.com/search?site_id=147&search=Search&q=%q%"
	}
};

function dd_get_ico_class( info, site_name ){
  var ico_class;
	if( typeof info.ico != "undefined" ){
		ico_class = info.ico;
	}
	else{
		ico_class = site_name;
	}
	ico_class = "ico-"+ico_class;

	return "dd_ico " + ico_class;
}


function display_adult(display)
{
	if (!display)
	{
		if (window.current_value == 'adult') __dd_set_current_element('web');
	}
};

function is_adult_visible()
{
	var res = true;
	try
	{
		var reg = Components.classes['@mozilla.org/windows-registry-key;1'].createInstance(Components.interfaces.nsIWindowsRegKey);
		try
		{
			reg.open(reg.ROOT_KEY_CURRENT_USER, 'Software\\FVDSuite\\Firefox', reg.ACCESS_READ);
			if (reg.hasValue('DisableAdult') && (reg.getValueType('DisableAdult') == reg.TYPE_INT))
			{
					if (reg.readIntValue('DisableAdult') != 0) res = false;
			}
			reg.close();

		} catch (ee)
		{
			reg.close();
		}

	} catch (e) {}
	return res;
};

function end_drop_down(){
	var list = document.getElementById("dd_search_list");
	if( list ){
		list.parentNode.removeChild(list);
	}
	var selectedElem = document.getElementById("dd_selected_list_elem");
	if(selectedElem){
		selectedElem.parentNode.removeChild(selectedElem);
	}
}

function start_drop_down(){
	return false;

	var adult_display = is_adult_visible();

	for (var site_name in sites_info){
		var info = sites_info[site_name];
		if( typeof info.selected != "undefined" && info.selected ){
			selected_value = site_name;
		}
	}

	var new_list_id = "dd_search_list";

	var list = document.createElement( "div" );
	list.id = new_list_id;
	list.className = "dd_list_main";
	list.style.display = "none";

	for( var site_name in sites_info ){

		if (!((site_name == 'adult') && (!adult_display)))
		{
			var info = sites_info[site_name];
			var elem = document.createElement( "div" );
			elem.className = "dd_list_option " + dd_get_ico_class(info, site_name);
			var text_name = site_name.replace("_", " ");
			var f = text_name[0].toUpperCase();
			text_name = f + text_name.substr(1);
			elem.textContent = text_name;

			elem.value = site_name;

			elem.onclick = function(){
				__dd_set_current_element( this.value );
			}
			list.appendChild( elem );
		}
	}

	document.getElementById("q").parentNode.appendChild(list);

	__dd_set_current_element( selected_value );
}

function getY( oElement )
{

	var iReturnValue = 0;
	while( oElement != null ) {
		iReturnValue += oElement.offsetTop;
		oElement = oElement.offsetParent;
	}



	return iReturnValue;
}



function __dd_set_current_element( site_name ){

	var info = sites_info[site_name];

	var current =  document.createElement( "div" );

	current.className = "dd_list_option dd_list_option_selected "+dd_get_ico_class(info, site_name);

	current.id = "dd_selected_list_elem";
	current.style.top = (getY(document.getElementById("q"))) + "px";

	var currentImg = document.createElement( "img" );
	currentImg.setAttribute( "src", "/images/newtab/arrow.png" );
	currentImg.style.marginLeft = "2px";

	current.appendChild( currentImg );

	current.onclick = function(){
		autocompleteHide();

		if( menu_opened ){
			return false;
		}
		menu_opened = true;

		var list = document.getElementById("dd_search_list");
		list.style.display = "";
		list.style.position = "absolute";
		list.style.zindex = 1000;

		allow_close = false;

		document.onclick = function(){
			if( allow_close ){
				document.getElementById("dd_search_list").style.display = "none";
				menu_opened = false;
			}
		}

		setTimeout( function(){
			allow_close = true;
		}, 100 );


		return false;
	}

	window.current_value = site_name;
	check_google_bk();

	var list = document.getElementById("dd_search_list");
	list.style.display = "none";

	removeDOM_id("dd_selected_list_elem");

	document.getElementById("q").parentNode.appendChild(current);
}

function removeDOM_id(element)
{
	try{
		var e = document.getElementById(element);
		e.parentNode.removeChild(e);
	}
	catch(ex){

	}
}

function check_google_bk()
{
	if ((['web', 'adult', 'flash-games', 'video'].indexOf(window.current_value) != -1) && (document.getElementById('q').value == ''))
	{
		document.getElementById("q").setAttribute('google', 'true');
	} else
	{
		document.getElementById("q").removeAttribute('google');
	}
}

window.onload = function(){
	document.getElementById("q").addEventListener('blur', check_google_bk, false);
};



function dd_hide(){
	if( allow_close ){
		document.getElementById("dd_search_list").style.display = "none";
		menu_opened = false;
	}
}