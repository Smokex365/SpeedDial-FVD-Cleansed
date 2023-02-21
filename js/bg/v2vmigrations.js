import {Utils} from '../utils.js';
// import StorageSD from "../storage.js";

function runMigrations(lastV, currentV) {
	console.log("Run migrations. lastver:", lastV, "currentver:", currentV);

	const migrations = [];
	const countRunned = 0;
	const numLastV = parseInt(String(lastV).split('.').join(''));

	if (numLastV < 7811) {
		migrations.push(function () {
			StorageSD.turnOffAutoUpdateGlobally(()=>{});
		});
	}

	migrations.push(function () {
		console.log("Migrations process completed, runned", countRunned, "migrations");
		// force refresh speeddial
		chrome.runtime.sendMessage({
			action: "forceRebuild",
		});
	});

	Utils.Async.chain(migrations);
}

export default runMigrations;