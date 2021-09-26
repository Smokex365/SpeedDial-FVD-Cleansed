// signletone.
(function() {
	var Apps = function(){

	};

	Apps.prototype = {
		storePositions: function(positions, callback){
			fvdSpeedDial.Storage.setMisc("apps_positions", JSON.stringify(positions), callback);
		},

		get: function(callback){

			chrome.management.getAll(function(extensions){
				// need to add webstore app
				chrome.management.get( "ahfgeienlihckogmohjhadlkjgocpleb", function( webstoreApp ){

					if( webstoreApp ){
						extensions.push( webstoreApp );
					}

					var apps = [];

					for (var i = 0; i != extensions.length; i++) {
						var ext = extensions[i];
						if (!ext.isApp) {
							continue;
						}
						if (!ext.enabled) {
							continue;
						}

						apps.push(ext);
					}

					fvdSpeedDial.Storage.getMisc("apps_positions", function(result){
						try {
							var positions = JSON.parse(result);
							for (var i = 0; i != apps.length; i++) {
								if (positions[apps[i].id]) {
									apps[i].position = positions[apps[i].id];
								}
								else {
									apps[i].position = Number.MAX_VALUE;
								}
							}
						}
						catch (ex) {

						}

						apps.sort(function(a, b){
							return a.position - b.position;
						});

						callback(apps);
					});

				} );

			});



		}
	};

	this.Apps = new Apps();

}).apply(fvdSpeedDial.Storage);

