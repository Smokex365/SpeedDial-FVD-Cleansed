window.addEventListener(
	'message',
	function (event) {
		if (event.source !== window) {
			return;
		}

		if (event.data.data && event.data.type && event.data.type === 'EverHelperExtMessage') {
			const data = event.data.data;

			if (!data.action || data.action === '_response') {
				return;
			}

			data.action = 'web:' + data.action;
			chrome.runtime.sendMessage(data, function (response) {
				const responseData = {
					action: '_response',
				};
				for (const k in response) {
					responseData[k] = response[k];
				}
				window.postMessage(
					{
						type: 'EverHelperExtMessage',
						responseToId: event.data.id,
						data: responseData,
					},
					'*'
				);
			});
		}
	},
	false
);
