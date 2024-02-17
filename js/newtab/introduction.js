import { Utils, _b } from '../utils.js';
import { _ } from '../localizer.js';
import { EventType } from '../types.js';

const IntroductionModule = function (fvdSpeedDial) {
	const self = this;

	this.hideCallbacks = [];
	this.allowStartButton = true;
	this.SLIDES = [
		{
			title: _('newtab_introduction_slide1_title'),
			text: _('newtab_introduction_slide1_text'),
		},
		{
			title: _('newtab_introduction_slide_es_title'),
			text: _('newtab_introduction_slide_es_text'),
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
		title: _('newtab_introduction_slide_configure_title'),
		text: _('newtab_introduction_slide_configure_text'),
		bottom: _('newtab_introduction_slide_configure_text_bottom'),
		img: 'disabled',
		checkboxes: {
			speed_dial: {
				text: _('newtab_introduction_slide_configure_checkbox_speed_dial'),
				option: 'sd.enable_top_sites',
			},
			most_visited: {
				text: _('newtab_introduction_slide_configure_checkbox_most_visited'),
				option: 'sd.enable_most_visited',
			},
			recently_closed: {
				text: _('newtab_introduction_slide_configure_checkbox_recently_closed'),
				option: 'sd.enable_recently_closed',
			},
			show_recommended: {
				text: _('newtab_introduction_slide_configure_checkbox_show_recommended'),
				option: 'sd.enable_show_recommended',
			},
		},
	});

	let currentSlideIndex = -1;
	// for ad dials
	let selectedMobileStore = null;
	let hideRequestInProcess = false;

	function show() {
		document.getElementById('introductionOverlay').setAttribute('appear', 1);
		buildImages();
		selectSlide(0);
		// setup store select step
		let as = document.querySelectorAll('#introductionDialog .mobile-stores-select > a');

		as = [].slice.call(as);
		as.forEach(function (a) {
			a.addEventListener('click', function () {
				if (hideRequestInProcess) {
					return;
				}

				selectedMobileStore = a.getAttribute('value');
				hide();
				return false;
			});
		});
	}

	function hide() {
		const { Prefs } = fvdSpeedDial;

		if (hideRequestInProcess) {
			return;
		}

		hideRequestInProcess = true;
		document.getElementById('introductionOverlay').setAttribute('loading', 1);
		Utils.Async.arrayProcess(
			self.hideCallbacks,
			function (cb, next) {
				cb(
					{
						store: selectedMobileStore,
					},
					next
				);
			},
			function () {
				document.getElementById('introductionOverlay').removeAttribute('loading');

				Prefs.set('donotshowintro', true);
				const overlay = document.getElementById('introductionOverlay');

				overlay.style.opacity = 0;
				setTimeout(function () {
					overlay.removeAttribute('appear');
				}, 200);
			}
		);
	}

	function selectSlide(index) {
		const { SpeedDial, Prefs } = fvdSpeedDial;

		currentSlideIndex = index;
		const imgContainer = document.querySelector('#introductionOverlay .imageContainer');

		if (!imgContainer) {
			return;
		}

		const images = imgContainer.getElementsByTagName('img');
		// hide step contents
		const stepContents = document.querySelectorAll('#introductionDialog .step-content[appear]');

		for (let i = 0; i !== stepContents.length; i++) {
			stepContents[i].removeAttribute('appear');
		}
		const stepContent = document.querySelector(
			'#introductionDialog .step-content[step="' + index + '"]'
		);

		if (stepContent) {
			stepContent.setAttribute('appear', 1);
			setTimeout(function () {
				imgContainer.removeAttribute('appear');
			}, 500);
		} else {
			imgContainer.setAttribute('appear', 1);
		}

		for (let i = 0; i !== images.length; i++) {
			if (parseInt(images[i].getAttribute('step')) === index && !stepContent) {
				images[i].setAttribute('appear', 1);
			} else {
				images[i].setAttribute('appear', 0);
			}
		}

		const data = self.SLIDES[index];

		const introductionDialog = document.querySelector('#introductionDialog');
		const titleContainer = document.querySelector('#introductionDialog .slideTitle');
		const textContainer = document.querySelector('#introductionDialog .slideText');
		const headerContainer = document.querySelector('#introductionDialog .headerMsg');
		const bottomContainer = document.querySelector('#introductionDialog .slideBottom');
		const rightContainer = document.querySelector('#introductionDialog .right');
		const leftContainer = document.querySelector('#introductionDialog .left');
		const checkboxesContainer = document.querySelector('#introductionDialog .slideCheck');

		introductionDialog.setAttribute('slide', index);
		titleContainer.innerHTML = data.title;
		textContainer.innerHTML = data.text;

		if (data.img && data.img === 'disabled') {
			rightContainer.className = 'right disabled';
			leftContainer.className = 'left wide';
		} else {
			rightContainer.className = 'right';
			leftContainer.className = 'left';
		}

		if (checkboxesContainer) {
			checkboxesContainer.innerHTML = '';

			if (data.checkboxes) {
				const prefix = 'intro_checkbox_';

				for (const key in data.checkboxes) {
					const item = data.checkboxes[key];

					let checked = _b(Prefs.get(item.option)) ? 'checked' : '';

					if (item.option === 'sd.enable_show_recommended') {
						checked = 'checked';
					}

					const disabled = item.option === 'sd.enable_show_recommended' ? ' disabled' : '';

					const checkbox
						= '<label><input type="checkbox" option="'
						+ item.option
						+ '" name="'
						+ prefix
						+ key
						+ '" '
						+ checked
						+ disabled
						+ ' />'
						+ item.text
						+ '</label>';

					checkboxesContainer.innerHTML = checkboxesContainer.innerHTML + checkbox;
				}
				const checkboxes = checkboxesContainer.getElementsByTagName('input');

				for (const input of checkboxes) {
					input.addEventListener(
						'click',
						event => {
							if (event.target) {
								const option = event.target.getAttribute('option');

								if (option) {
									Prefs.set(option, event.target.checked);
								}
							}

							let checked = 0;

							for (const checkbox of checkboxes) {
								if (checkbox.checked) {
									checked++;
								}

								const option = checkbox.getAttribute('option');

								if (option !== 'sd.enable_show_recommended') {
									checkbox.removeAttribute('disabled');
								}

							}

							if (checked < 2) {
								for (const checkbox of checkboxes) {
									if (checkbox.checked) {
										checkbox.setAttribute('disabled', 'disabled');
									}
								}
							}

							// SpeedDial.sheduleFullRebuild();
						},
						false
					);
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

	function buildImages() {
		const container = document.querySelector('#introductionOverlay .imageContainer');

		if (!container) {
			return;
		}

		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}
		for (let i = 0; i !== self.SLIDES.length; i++) {
			if (document.querySelector('#introductionDialog .step-content[step="' + i + '"]')) {
				continue;
			}

			const img = new Image();
			img.src = 'images/newtab/introduction/slide' + (i + 1) + '.png';
			img.setAttribute('step', i);
			container.appendChild(img);
		}
	}

	function refreshButtons() {
		const prev = document.querySelector('#introductionDialog .buttons .prev');
		const next = document.querySelector('#introductionDialog .buttons .next');
		const start = document.querySelector('#introductionDialog .buttons .start');

		if (currentSlideIndex === 0) {
			prev.setAttribute('appear', 0);
		} else {
			prev.setAttribute('appear', 1);
		}

		if (currentSlideIndex < self.SLIDES.length - 1) {
			next.setAttribute('appear', 1);
		} else {
			next.setAttribute('appear', 0);
		}

		if (currentSlideIndex === self.SLIDES.length - 1) {
			document
				.querySelector('#introductionDialog .header')
				.setAttribute('title', _('newtab_introduction_last_step'));

			if (self.allowStartButton) {
				start.setAttribute('appear', 1);
			}
		} else {
			document.querySelector('#introductionDialog .header').removeAttribute('title');
			start.setAttribute('appear', 0);
		}
	}

	fvdSpeedDial.addEventListener(EventType.LOAD, function () {
		const { Prefs } = fvdSpeedDial;

		if (_b(Prefs.get('donotshowintro'))) {
			return;
		}

		show();

		const imgContainer = document.querySelector('#introductionOverlay .imageContainer');
		const nextButton = document.querySelector('#introductionDialog .buttons .next');
		const prevButton = document.querySelector('#introductionDialog .buttons .prev');
		const startButton = document.querySelector('#introductionDialog .buttons .start');

		if (nextButton) {
			nextButton.addEventListener(
				'click',
				function () {
					selectSlide(currentSlideIndex + 1);
				},
				false
			);
		}

		if (prevButton) {
			prevButton.addEventListener(
				'click',
				function () {
					selectSlide(currentSlideIndex - 1);
				},
				false
			);
		}

		startButton.addEventListener(
			'click',
			function () {
				hide();
			},
			false
		);
		document.querySelector('#introductionDialog .close').addEventListener(
			'click',
			function () {
				hide();
			},
			false
		);

		if (!imgContainer) {
			startButton.setAttribute('appear', 1);
		}
	});
};

export default IntroductionModule;
