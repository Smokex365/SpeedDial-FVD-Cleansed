import './jquery.js';

(function ($) {
	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

	/**
	 * Start animate speech progress
	 *
	 * @param $el jQuery element
	 */
	function startAnimateSpeechProgress($el) {
		const properties = { 'border-color': '#F58F6F' };
		$el.pulse(properties, { pulses: -1, duration: 900 });
	}

	/**
	 * Stop animate speech progress
	 *
	 * @param $el jQuery element
	 */
	function stopAnimateSpeechProgress($el) {
		$el.pulse('destroy');
	}

	$.fn.speechify = function (options) {
		if (!SpeechRecognition) {
			return;
		}

		options = options || {};

		$.extend(options, {
			lang: chrome.i18n.getUILanguage(), //"en-US"
		});

		const recognizer = new SpeechRecognition();
		const $input = $(this);
		const $container = $('<div>').addClass('speechify-container');
		const $icon = $('<div>').addClass('speechify-icon');
		$container.insertBefore($input);
		$container.append($input);
		$container.append($icon);

		if (options.build) {
			options.build({
				icon: $icon,
			});
		}

		let isSpeaking = false;

		recognizer.continuous = false;
		recognizer.lang = options.lang;
		recognizer.maxAlternatives = 1;

		$icon.click(function () {
			if (isSpeaking) {
				stopSpeaking();
			} else {
				startSpeaking();
			}
		});

		function startSpeaking() {
			if (isSpeaking) {
				return;
			}

			isSpeaking = true;

			if (options.onSpeakStart) {
				options.onSpeakStart();
			}

			recognizer.start();
			$input.val('');
			$container.addClass('speaking');
			startAnimateSpeechProgress();
		}

		function stopSpeaking() {
			if (!isSpeaking) {
				return;
			}

			isSpeaking = false;
			recognizer.stop();
			$container.removeClass('speaking');
			stopAnimateSpeechProgress();
		}

		function stopAnimateSpeechProgress() {
			// console.log('stop animate');
		}

		function startAnimateSpeechProgress() {
			// console.log('start animate');
		}

		recognizer.onresult = function (event) {
			$input.val('');
			for (let i = event.resultIndex; i < event.results.length; i++) {
				let result;

				if (event.results[i].isFinal) {
					result = event.results[i][0].transcript;

					if (result) {
						$input.val(result);

						if (options.onResult) {
							options.onResult(result);
						} else {
							const $form = $input.parents('form');

							if ($form.length) {
								$form.submit();
							}
						}

						stopSpeaking();
						break;
					} else {
						$input.val('');
					}
				} else {
					result = $input.val() + event.results[i][0].transcript;

					if (result) {
						$input.val(result);
					}
				}
			}
		};

		recognizer.onerror = stopSpeaking;
		recognizer.onend = stopSpeaking;
	};
})(jQuery);
