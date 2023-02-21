const scr = document.createElement('script');
scr.src = 'chrome-extension://' + chrome.runtime.id + '/content-scripts/hiddencapture-inject.js';

document.documentElement.appendChild(scr);

document.addEventListener('DOMContentLoaded', function () {
	document.body.style.overflow = 'hidden';
});
