export function getPreviousSession(sessionId, restore) {
	if (!restore) {
		chrome.storage.local.get('last', function (result) {
			if (result && result.last && result.last.length) {
				chrome.runtime.sendMessage({
					action: 'previousSession:button',
					nTabs: result.last.length,
					sessionId: 999,
				});
			}
		});
	} else {
		chrome.storage.local.get('target', function (result) {
			if (result && result.target === 'window') {
				chrome.tabs.getAllInWindow(function (tabsCheck) {
					let inNewWindow = false;

					for (const k in tabsCheck) {
						const url = String(tabsCheck[k].url);

						if (
							url.indexOf('about:') === -1
							&& url.indexOf('chrome://') === -1
							&& url.indexOf('chrome-extension://') === -1
							&& url.indexOf('moz-extension://') === -1
						) {
							inNewWindow = true;
							break;
						}
					}

					if (inNewWindow) {
						chrome.windows.create(function (window) {
							restoreSessionInWindow(window.id);
						});
					} else {
						chrome.windows.getCurrent(function (window) {
							restoreSessionInWindow(window.id);
						});
					}
				});
			} else {
				chrome.windows.getCurrent(function (window) {
					restoreSessionInWindow(window.id);
				});
			}
		});
	}
}

export function restoreSessionInWindow(windowId) {
	chrome.tabs.getAllInWindow(windowId, function (tabsForRemove) {
		chrome.storage.local.get('last', function (result) {
			if (result && result.last && result.last.length) {
				for (const Tab of result.last) {
					chrome.tabs.create({
						windowId: windowId,
						url: Tab.url,
						active: Tab.selected,
						pinned: Tab.pinned,
					});
				} //for

				//Remove old tabs
				const rmTabArr = [];

				for (const rmTab of tabsForRemove) {
					rmTabArr.push(rmTab.id);
				}
				chrome.tabs.remove(rmTabArr);
			} //if
		});
	});
}

const EventN = 0;
let WriteStop = true;
const removedWindows = [];

chrome.storage.local.get('current', function (result) {
	if (result['current']) {
		let Last;
		let upd = 0;

		for (const key in result['current']) {
			if (result['current'][key].updated > upd) {
				Last = result['current'][key].tabsList;
				upd = result['current'][key].updated;
			}
		}

		if (Last) {
			chrome.storage.local.set({
				last: Last,
				target: 'self',
			});
		}
	}

	WriteStop = false;
});

chrome.windows.onRemoved.addListener(function (windowId) {
	removedWindows.push(windowId);

	chrome.storage.local.get('current', function (result) {
		if (result['current'])
			for (const key in result['current']) {
				if (result['current'][key]['windowId'] === windowId) {
					chrome.storage.local.set({
						last: result['current'][key].tabsList,
						target: 'window',
					});

					localStorage.setItem('just-opened', 1);
					localStorage.setItem('page-show-loading', 1);

					chrome.runtime.sendMessage({
						action: 'previousSession:get',
					});

					break;
				}
			}
	});
});

export function chromeTabsChange() {
	if (!WriteStop) WriteStop = true;
	else return false;

	setTimeout(function () {
		WriteStop = false;
		chrome.tabs.query({ currentWindow: true }, function (Tabs) {
			if (Tabs.length && Tabs[0].id !== -1) {
				const tabsList = [];
				let windowId = false;

				for (const Tab of Tabs)
					if (removedWindows.indexOf(Tab.windowId) === -1) {
						windowId = Tab.windowId;

						tabsList.push({
							id: Tab.id,
							url: Tab.url,
							index: Tab.index,
							pinned: Tab.pinned,
							selected: Tab.selected,
						});
					}

				if (tabsList.length) {
					chrome.storage.local.get(['current', 'last'], function (result) {
						const current = result.current || {};

						current[windowId] = {
							windowId: windowId,
							updated: Date.now(),
							tabsList: tabsList,
						}; //if

						chrome.storage.local.set({
							current: current,
						});
					});
				}
			}
		});
	}, 1000);
}
