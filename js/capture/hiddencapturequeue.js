import HiddenCaptureModule from './hiddencapture.js';
import Broadcaster from '../_external/broadcaster.js';

const MAX_SIMULTANEUSELY_CAPTURES = 1;

const HiddenCaptureQueueModule = function (fvdSpeedDial) {
	const HiddenCapture = new HiddenCaptureModule(fvdSpeedDial);
	let queue = [];
	let currentItem = null;
	let nowCapturesInProgressCount = 0;

	const ignoreIdsAfterComplete = [];

	function checkNeedIgnoreIdAndRemove(id) {
		const removeIndex = ignoreIdsAfterComplete.indexOf(id);

		if (removeIndex !== -1) {
			ignoreIdsAfterComplete.splice(removeIndex, 1);
			return true;
		}

		return false;
	}

	function captureNext() {
		
		if (nowCapturesInProgressCount >= MAX_SIMULTANEUSELY_CAPTURES) {
			
			return;
		}

		if (queue.length === 0) {
			return;
		}

		const item = queue.shift();

		currentItem = item;
		nowCapturesInProgressCount++;

		HiddenCapture.capture(item.params, function (resultData) {
			if (!checkNeedIgnoreIdAndRemove(currentItem.id)) {

				Broadcaster.sendMessage({
					action: 'hiddencapture:done',
					params: item.params,
					result: resultData,
				});

				if (item.callback) {
					item.callback(resultData);
				}
			}

			currentItem = null;
			nowCapturesInProgressCount--;
			captureNext();
		});
	}

	this.removeFromQueueById = function (id) {
		if (currentItem && currentItem.id === id) {
			ignoreIdsAfterComplete.push(id);
			return;
		}

		let index = -1;

		for (let i = 0; i !== queue.length; i++) {
			if (queue[i].id === id) {
				index = i;
				break;
			}
		}

		if (index !== -1) {
			queue.splice(index, 1);
		}
	};

	this.getQueue = function () {
		return queue;
	};

	this.getCurrentItem = function () {
		return currentItem;
	};

	this.isEnqueued = function (id) {
		if (currentItem && currentItem.id === id) {
			return true;
		}

		for (let i = 0; i !== queue.length; i++) {
			if (queue[i].id === id) {
				return true;
			}
		}
		return false;
	};

	this.capture = function (params, callback) {
		checkNeedIgnoreIdAndRemove(params.id);

		queue.push({
			id: params.id,
			params: params,
			callback: callback,
		});

		captureNext();
	};

	this.empty = function () {
		queue = [];
	};
};

export default HiddenCaptureQueueModule;
