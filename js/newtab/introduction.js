var INTRO_DEV = false;//localStorage.getItem('intro_dev') ? true : true;

fvdSpeedDial.Introduction = new function(){
	var self = this;

	this.hideCallbacks = [];
	this.allowStartButton = true;
	this.SLIDES = [
		{
			title: _("newtab_introduction_slide1_title"),
			text: _("newtab_introduction_slide1_text")
		},
		{
			title: _("newtab_introduction_slide_es_title"),
			text: _("newtab_introduction_slide_es_text")
		},
    /*
		{
			title: _("newtab_introduction_slide2_title"),
			text: _("newtab_introduction_slide2_text")
		},
    {
      key: "select-mobile-store",
      title: "",
      text: _("newtab_introduction_slide3_text")
    }*/
	];

	this.SLIDES.push({
		title: _("newtab_introduction_slide_configure_title"),
		text: _("newtab_introduction_slide_configure_text"),
		bottom: _("newtab_introduction_slide_configure_text_bottom"),
		img: "disabled",
		checkboxes: {
			'speed_dial': {
				text: _("newtab_introduction_slide_configure_checkbox_speed_dial"),
				option: "sd.enable_top_sites"
			},
			'most_visited': {
				text: _("newtab_introduction_slide_configure_checkbox_most_visited"),
				option: "sd.enable_most_visited"
			},
			'recently_closed': {
				text: _("newtab_introduction_slide_configure_checkbox_recently_closed"),
				option: "sd.enable_recently_closed"
			},
		}
	});

	var currentSlideIndex = -1;
	// for ad dials
	var selectedMobileStore = null;
	var hideRequestInProcess = false;

	function show(){
		document.getElementById("introductionOverlay").setAttribute("appear", 1);
		buildImages();
		selectSlide(0);
		// setup store select step
    var as = document.querySelectorAll("#introductionDialog .mobile-stores-select > a");
    as = [].slice.call(as);
    as.forEach(function(a) {
      a.addEventListener("click", function() {
        if(hideRequestInProcess) {
          return;
        }
        selectedMobileStore = a.getAttribute("value");
        hide();
        return false;
      });
    });
	}

	function hide(){
    if(hideRequestInProcess) {
      return;
    }
    hideRequestInProcess = true;
	  document.getElementById("introductionOverlay").setAttribute("loading", 1);
		fvdSpeedDial.Utils.Async.arrayProcess(self.hideCallbacks, function(cb, next) {
		  cb({
		    store: selectedMobileStore
		  }, next);
		}, function() {
		  document.getElementById("introductionOverlay").removeAttribute("loading");
      fvdSpeedDial.Prefs.set( "donotshowintro", true );
      var overlay = document.getElementById("introductionOverlay");
      overlay.style.opacity = 0;
      setTimeout( function(){
        overlay.removeAttribute("appear");
      }, 200 );
		});
	}

	function selectSlide( index ) {
		currentSlideIndex = index;
		var imgContainer = document.querySelector( "#introductionOverlay .imageContainer" );
    if(!imgContainer) {
      return;
    }
		var images = imgContainer.getElementsByTagName( "img" );
		// hide step contents
	 	var stepContents = document.querySelectorAll("#introductionDialog .step-content[appear]");
	 	for(var i = 0; i != stepContents.length; i++) {
	 	  stepContents[i].removeAttribute("appear");
	 	}
		var stepContent = document.querySelector("#introductionDialog .step-content[step=\""+index+"\"]");
		if(stepContent) {
		  stepContent.setAttribute("appear", 1);
		  setTimeout(function() {
        imgContainer.removeAttribute("appear");
		  }, 500);
		}
		else {
		  imgContainer.setAttribute("appear", 1);
		}
		for( var i = 0; i != images.length; i++ ){
			if( images[i].getAttribute("step") == index && !stepContent ){
				images[i].setAttribute( "appear", 1 );
			}
			else{
				images[i].setAttribute( "appear", 0 );
			}
		}

		var data = self.SLIDES[index];

		var introductionDialog = document.querySelector( "#introductionDialog" );
		var titleContainer = document.querySelector( "#introductionDialog .slideTitle" );
		var textContainer = document.querySelector( "#introductionDialog .slideText" );
		var headerContainer = document.querySelector("#introductionDialog .headerMsg");
		var bottomContainer = document.querySelector("#introductionDialog .slideBottom");
		var rightContainer = document.querySelector("#introductionDialog .right");
		var leftContainer = document.querySelector("#introductionDialog .left");
		var checkboxesContainer = document.querySelector("#introductionDialog .slideCheck");

		introductionDialog.setAttribute('slide', index);

		titleContainer.innerHTML = data.title;
		textContainer.innerHTML = data.text;

		if (data.img && data.img == "disabled") {
			rightContainer.className = "right disabled";
			leftContainer.className = "left wide";
		} else {
			rightContainer.className = "right";
			leftContainer.className = "left";
		}

		if (checkboxesContainer) {
			checkboxesContainer.innerHTML = '';
			if (data.checkboxes) {
				let prefix = 'intro_checkbox_';
				for (let key in data.checkboxes) {
					let item = data.checkboxes[key];
					let checked = _b(fvdSpeedDial.Prefs.get(item.option)) ? 'checked' : '';
					let checkbox = '<label><input type="checkbox" option="' + item.option + '" name="' + prefix + key + '" ' + checked + ' />' + item.text + '</label>';
					checkboxesContainer.innerHTML = checkboxesContainer.innerHTML + checkbox;
				}
				let checkboxes = checkboxesContainer.getElementsByTagName('input');
				for (let input of checkboxes) {
					input.addEventListener('click', (event) => {
						if (event.target) {
							let option = event.target.getAttribute('option');
							if (option) {
								fvdSpeedDial.Prefs.set(option, event.target.checked);
							}
						}
						let checked = 0;
						for (let checkbox of checkboxes) {
							if (checkbox.checked) {
								checked++;
							}
							checkbox.removeAttribute('disabled');
						}
						if (checked < 2) {
							for (let checkbox of checkboxes) {
								if (checkbox.checked) {
									checkbox.setAttribute('disabled', 'disabled');
								}
							}
						}
					}, false);
				}
				checkboxesContainer.classList.remove('disabled');
			} else {
				checkboxesContainer.classList.add('disabled');
			}
		}

		if (bottomContainer) {
			if (data.bottom) {
				bottomContainer.classList.remove('disabled');
				bottomContainer.innerHTML = data.bottom;
			} else {
				bottomContainer.classList.add('disabled');
				bottomContainer.innerHTML = '';
			}
		}

		refreshButtons();
	}

	function buildImages(){
		var container = document.querySelector( "#introductionOverlay .imageContainer" );
    if(!container) {
      return;
    }
		while( container.firstChild ){
			container.removeChild( container.firstChild );
		}
		for( var i = 0; i != self.SLIDES.length; i++ ){
		  if(document.querySelector("#introductionDialog .step-content[step=\""+i+"\"]")) {
		    continue;
		  }
			var img = new Image();
			img.src = "images/newtab/introduction/slide"+(i+1)+".png";
			img.setAttribute( "step", i );
			container.appendChild( img );
		}

	}

	function refreshButtons(){
		var prev = document.querySelector( "#introductionDialog .buttons .prev" );
		var next = document.querySelector( "#introductionDialog .buttons .next" );
		var start = document.querySelector( "#introductionDialog .buttons .start" );

		if( currentSlideIndex == 0 ){
			prev.setAttribute( "appear", 0 );
		}
		else{
			prev.setAttribute( "appear", 1 );
		}

		if( currentSlideIndex < self.SLIDES.length - 1 ){
			next.setAttribute( "appear", 1 );
		}
		else{
			next.setAttribute( "appear", 0 );
		}

		if(currentSlideIndex == self.SLIDES.length - 1) {
		  document.querySelector("#introductionDialog .header")
        .setAttribute("title", _("newtab_introduction_last_step"));
		  if(self.allowStartButton) {
        start.setAttribute( "appear", 1 );
		  }
		}
		else{
		  document.querySelector("#introductionDialog .header").removeAttribute("title");
			start.setAttribute( "appear", 0 );
		}

	}

	window.addEventListener( "load", function(){

		if(_b( fvdSpeedDial.Prefs.get( "donotshowintro" ))) {
			return;
		}

		show();

    var imgContainer = document.querySelector( "#introductionOverlay .imageContainer" );
    var nextButton = document.querySelector( "#introductionDialog .buttons .next" );
    var prevButton = document.querySelector( "#introductionDialog .buttons .prev" );
    var startButton = document.querySelector( "#introductionDialog .buttons .start" );

    if(nextButton) {
      nextButton.addEventListener("click", function(){
        selectSlide( currentSlideIndex + 1 );
      }, false);
    }
    if(prevButton) {
      prevButton.addEventListener("click", function(){
        selectSlide( currentSlideIndex - 1 );
      }, false);
    }
		startButton.addEventListener("click", function() {
			hide();
		}, false);
		document.querySelector( "#introductionDialog .close" ).addEventListener("click", function() {
			hide();
		}, false);

    if(!imgContainer) {
      startButton.setAttribute("appear", 1);
    }
	});

};
