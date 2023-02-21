const elems = document.getElementsByName('enableSuperfish');

for (let i = 0; i !== elems.length; i++) {
	(function (elem) {
		elem.addEventListener('click', function () {
			chrome.runtime.sendMessage({
				action: 'setSuperFishState',
				value: elem.value === 1 ? true : false,
			});
		});
	})(elems[i]);
}
