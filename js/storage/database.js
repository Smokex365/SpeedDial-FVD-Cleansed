(function () {
	const dialsByGuid = {};
	let onConnectDone; let onConnectFailed;
	const initialPromise = new Promise(function (resolve, reject) {
		onConnectDone = resolve;
		onConnectFailed = reject;
	});
	const data = {
		groups: [
			{
				global_id: 'xxx',
				name: 'blabla',
				index: 'blabla',
				dials: [
					{
						global_id: '',
					},
				],
			},
		],
	};
	function getGroupById(id) {
		let result = null;
		for (let i = 0; i != data.groups.length; i++) {
			const group = data.groups[id];

			if (group.id === id) {
				result = group;
				break;
			}
		}
		return result;
	}
	function applyOrder(source, order) {
		const field = order[0];
		const direction = order[1];
		// make clone of array
		const arr = source.slice();
		arr.sort(function (a, b) {
			let res = 0;

			if (a[field] > b[field]) {
				res = 1;
			} else if (a[field] < b[field]) {
				res = -1;
			}

			if (direction === 'desc') {
				res = -res;
			}

			return res;
		});
		return arr;
	}
	// we don't want to allow Database API user to change data stored internally
	function sclone(data) {
		return JSON.parse(JSON.stringify(data));
	}
	const Database = {
		getDialsByGroup: function (groupId, order, limit) {
			order = order || ['position', 'asc'];
			const self = this;
			return initialPromise.then(function () {
				var result = [];
				const group = getGroupById(groupId);

				if (group) {
					var result = group.dials;

					if (order[0] !== 'position') {
						result = applyOrder(result, order);
					}

					if (limit) {
						result = result.slice(0, limit);
					}
				}

				return clone(result);
			});
		},
	};
	fvdSpeedDial.Database = Database;
})();
