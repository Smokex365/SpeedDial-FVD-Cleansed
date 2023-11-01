const ControlsScroll = new function () {
	const ScrollInstance = function (elem, params) {
		const self = this;

		params.margins = params.margins || {
			horiz: 6,
		};

		params.wheelScrollSpeed = params.wheelScrollSpeed || 9;

		// styling elem
		elem.style.overflow = "hidden";
		elem.style.position = "relative";

		let scrollElem = null;
		let thumbWidth = null;
		let nowIsScrolling = false;


		this.AutoScroll = new function () {
			let interval = null;
			let speed = 1; // max 100
			const axis = "x";
			let direction = 1;
			let pause = false;

			this.setSpeed = function (_speed) {
				speed = _speed;
				//  restartInterval();
			};

			this.start = function () {
				restartInterval();
			};

			this.stop = function () {
				stopInterval();
			};

			this.setPause = function (_pause) {
				pause = _pause;
			};

			function doScroll() {

				if (pause || nowIsScrolling) {
					return;
				}

				if (axis === "x") {
					const maxScrollLeft = elem.scrollWidth - elem.offsetWidth;

					const delta = speed;

					if (direction > 0) {
						if (elem.scrollLeft >= maxScrollLeft) {
							direction = -1;
						} else {
							elem.scrollLeft += delta;
							refreshScrollBarAfterScroll();
						}
					} else {
						if (elem.scrollLeft <= 0) {
							direction = 1;
						} else {
							elem.scrollLeft -= delta;
							refreshScrollBarAfterScroll();
						}
					}
				}
			}

			function stopInterval() {
				if (interval) {
					try {
						clearInterval(interval);
					} catch (ex) {
						console.warn(ex);
					}
				}
			}

			function restartInterval() {
				const time = 50;
				//console.log( "ISS",time,speed );

				stopInterval();
				interval = setInterval(doScroll, time);
			}
		}();

		this.refresh = function () {
			refreshScrollBarVisibility();
		};

		this.refreshScrollManyTimes = function (count) {
			count = count || 5;
			let maked = 0;

			function _r() {
				self.refresh();
				maked++;

				if (maked < count) {
					setTimeout(function () {

						_r();

					}, 100);
				}
			}
			_r();
		};

		function l_windowResize() {
			self.refreshScrollManyTimes();
		}

		function l_sdBuildCompleted() {
			self.refreshScrollManyTimes();
		}

		function _getScrollWidth() {
			return elem.offsetWidth - 2 * params.margins.horiz;
		}

		function _getMaxScrollDistance() {
			if (params.type === "horizontal") {
				return elem.scrollWidth - elem.offsetWidth;
			}
		}

		function prepareScrollValue(v) {
			if (v < 0) {
				return 0;
			}

			const maxScrollDistance = _getMaxScrollDistance();

			if (v > maxScrollDistance) {
				return maxScrollDistance;
			}

			return v;
		}

		function refreshThumbSize() {
			const thumb = scrollElem.querySelector(".scrollThumb");

			if (params.type === "horizontal") {
				const maxScrollDistance = _getMaxScrollDistance();

				const size = _getScrollWidth() - maxScrollDistance;

				thumbWidth = size;
				thumb.style.width = size + "px";
			}
		}

		function refreshThumbPosition() {
			const thumb = scrollElem.querySelector(".scrollThumb");
			const zone = scrollElem.querySelector(".scrollZone");

			if (params.type === "horizontal") {
				let left = elem.scrollLeft;
				const maxLeft = zone.offsetWidth - thumb.offsetWidth;


				if (left > maxLeft) {
					console.log("MAX!", left, maxLeft);
					left = maxLeft;
				}

				thumb.style.marginLeft = left + "px";
			}
		}

		function refreshScrollZone() {
			if (params.type === "horizontal") {
				const width = _getScrollWidth();

				scrollElem.style.width = width + "px";
				//scrollElem.style.left = params.margins.horiz + elem.scrollLeft + "px";
			}
		}

		function refreshScrollBarVisibility() {
			if (elem.offsetWidth >= elem.scrollWidth) {
				scrollElem.style.display = "none";
			} else {
				// hide scroll, because it should not affect scrollWidth of element
				scrollElem.style.display = "none";
				refreshScrollZone();
				refreshThumbPosition();
				refreshThumbSize();
				scrollElem.style.display = "block";
				// refresh thumb again
				refreshThumbPosition();
				refreshThumbSize();
			}
		}

		function refreshScrollBarAfterScroll() {
			refreshScrollZone();
			refreshThumbPosition();
		}

		function setThumbEventListeners(thumb) {
			let _helperOverlay = null;
			const _downPos = {
				left: 0,
				top: 0,
			};
			let _storedScrollLeft = 0;

			function _docMouseMoveListener(event) {
				if (params.type === "horizontal") {
					const delta = event.clientX - _downPos.left;

					elem.scrollLeft = _storedScrollLeft + delta;

					refreshScrollBarAfterScroll();
				}
			}

			function _docMouseUpListener() {
				thumb.removeAttribute("down");
				document.removeEventListener("mousemove", _docMouseMoveListener);
				document.removeEventListener("mouseup", _docMouseUpListener);
				_helperOverlay.parentNode.removeChild(_helperOverlay);

				nowIsScrolling = false;
			}

			thumb.addEventListener("mousedown", function (event) {
				_storedScrollLeft = elem.scrollLeft;
				_downPos.left = event.clientX;
				_downPos.top = event.clientY;
				thumb.setAttribute("down", 1);

				document.addEventListener("mousemove", _docMouseMoveListener, false);
				document.addEventListener("mouseup", _docMouseUpListener, false);

				// create helper overlay

				_helperOverlay = document.createElement("div");
				_helperOverlay.className = "controlScrollHelperOverlay";
				document.body.appendChild(_helperOverlay);
				nowIsScrolling = true;

			}, false);
		}

		function buildScroll() {
			const parentEl = elem.parentNode;
			const oldScroll = parentEl.querySelector(".controlScroll");

			if (oldScroll) {
				parentEl.removeChild(oldScroll);
			}

			scrollElem = fvdSpeedDial.Templates.clone("prototype_controlScroll");
			scrollElem.removeAttribute("id");
			scrollElem.className += " scrollType_" + params.type + " scrollPosition_" + params.position;

			const thumb = scrollElem.querySelector(".scrollThumb");

			// events
			setThumbEventListeners(thumb);

			document.addEventListener("mousewheel", function (event) {
				if (Utils.isChildOf(event.target, elem)) {
					if (params.type === "horizontal") {
						let v = event.wheelDelta > 0 ? -1 : 1;

						v *= params.wheelScrollSpeed;

						elem.scrollLeft = prepareScrollValue(elem.scrollLeft + v);
						refreshScrollBarAfterScroll();
					}

					event.stopPropagation();
					event.preventDefault();
				}

			}, false);

			parentEl.appendChild(scrollElem);
			refreshScrollBarVisibility();
			window.addEventListener("resize", l_windowResize, false);
			SpeedDial.onBuildCompleted.addListener(l_sdBuildCompleted);
			/*
      var oldScroll = elem.querySelector(".controlScroll");
      if( oldScroll ){
        elem.removeChild( oldScroll );
      }

      scrollElem = fvdSpeedDial.Templates.clone("prototype_controlScroll");
      scrollElem.removeAttribute("id");

      scrollElem.className += " scrollType_" + params.type + " scrollPosition_" + params.position;

      var thumb = scrollElem.querySelector( ".scrollThumb" );

      // events
      setThumbEventListeners( thumb );

      document.addEventListener( "mousewheel", function( event ){
        if( fvdSpeedDial.Utils.isChildOf( event.target, elem ) ){

          if( params.type == "horizontal" ){
            var v = event.wheelDelta > 0 ? -1 : 1;
            v *= params.wheelScrollSpeed;

            elem.scrollLeft = prepareScrollValue( elem.scrollLeft + v );
            refreshScrollBarAfterScroll();
          }

          event.stopPropagation();
          event.preventDefault();
        }

      }, false );


      elem.appendChild( scrollElem );

      refreshScrollBarVisibility();

      window.addEventListener( "resize", l_windowResize, false );

      fvdSpeedDial.SpeedDial.onBuildCompleted.addListener( l_sdBuildCompleted );
      */
		}

		buildScroll();
	};

	const instances = [];

	this.setToElem = function (elem, params) {
		const inst = new ScrollInstance(elem, params);

		instances.push(inst);
		return inst;
	};

}();

export default ControlsScroll;
