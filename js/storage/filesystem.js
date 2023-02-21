/**
 * due to continue bug reporting, that previews stored in local filesystem is disappeared,
 * store object with redundancy, both in local fs and indexedDB, hope it helps
 */
import Broadcaster from '../_external/broadcaster.js';
import { Utils } from '../utils.js';

const RedundancyStorage = {
	_dbInst: null,
	_db: function (cb) {
		const self = this;

		if (this._dbInst) {
			return cb(this._dbInst);
		}

		const request = indexedDB.open('FSRedundancy', 1);

		request.onupgradeneeded = function (event) {
			const db = event.target.result;
			const objectStore = db.createObjectStore('fs_store', { keyPath: 'path' });
		};
		request.onerror = function (event) {
			console.error("Fatal! Can't request indexedDB.");
		};
		request.onsuccess = function (event) {
			self._dbInst = event.target.result;
			cb(self._dbInst);
		};
	},
	set: function (path, contents, cb) {
		cb = cb || function () {};
		this._db(function (db) {
			const transaction = db.transaction(['fs_store'], 'readwrite');

			transaction.onerror = function (event) {
				cb(event);
			};
			const request = transaction.objectStore('fs_store').put({
				path: path,
				contents: contents,
			});

			request.onsuccess = function (event) {
				cb(null);
			};
		});
	},
	get: function (path, cb) {
		this._db(function (db) {
			const transaction = db.transaction(['fs_store']);
			const request = transaction.objectStore('fs_store').get(path);

			request.onerror = function (event) {
				console.warn(path);
				cb(event);
			};
			request.onsuccess = function (event) {
				if (!request.result || !request.result.contents) {
					console.warn(path);
					cb(true);
				} else {
					cb(null, request.result.contents);
				}
			};
		});
	},
	delete: function (path, cb) {
		cb = cb || function () {};
		this._db(function (db) {
			const transaction = db.transaction(['fs_store'], 'readwrite');

			transaction.onerror = function (event) {
				cb(event);
			};
			const request = transaction.objectStore('fs_store').delete(path);

			request.onsuccess = function (event) {
				cb(null);
			};
		});
	},
	getAllPaths: function (cb) {
		this._db(function (db) {
			const transaction = db.transaction(['fs_store']);
			const objectStore = transaction.objectStore('fs_store');
			const paths = [];

			objectStore.openCursor().onsuccess = function (event) {
				const cursor = event.target.result;

				if (cursor) {
					paths.push(cursor.key);
					cursor.continue();
				} else {
					cb(null, paths);
				}
			};
		});
	},
};

const FileSystemSD = function () {
	const self = this;
	// can be "restoring" or "normal"
	// "restoring" means restore previous corruptions
	let _state = 'normal';
	let _fs = null;

	function request(callback) {
		if (_fs) {
			return callback(_fs);
		}

		webkitRequestFileSystem(window.PERSISTENT, 1024 * 1024 * 1024, function (fs) {
			_fs = fs;
			callback(fs);
		});
	}

	function _parseDir(path) {
		const index = path.lastIndexOf('/');

		if (index === -1) {
			return '.';
		}

		let dir = path.substr(0, index);

		if (!dir) {
			dir = '/';
		}

		return dir;
	}

	function init() {
		request(function (fs) {
			fs.root.getDirectory('backups', { create: true }, function (dir) {
				dir.getDirectory('bookmarks', { create: true }, function () {});
				dir.getDirectory('sd', { create: true }, function () {});
			});
		});
	}

	this.__defineGetter__('redundancyStorage', function () {
		return RedundancyStorage;
	});
	this.__defineSetter__('state', function (val) {
		_state = val;
		Broadcaster.sendMessage({
			action: 'storage:fs:updatestate',
			state: val,
		});
	});
	this.__defineGetter__('state', function () {
		return _state;
	});

	this.makeDir = function (path, callback) {
		request(function (fs) {
			fs.root.getDirectory(path, { create: true }, function (dir) {
				callback();
			});
		});
	};

	this.removeDir = function (path, callback) {
		request(function (fs) {
			fs.root.getDirectory(path, { create: true }, function (dir) {
				dir.removeRecursively(
					function () {
						callback(true);
					},
					function () {
						callback(false);
					}
				);
			});
		});
	};

	this.removeByURL = function (url, cb) {
		if (typeof webkitResolveLocalFileSystemURL !== 'undefined') {
			webkitResolveLocalFileSystemURL(
				url,
				function (entry) {
					// remove from redundancy storage
					RedundancyStorage.delete(entry.fullPath);
					// remove from fs
					entry.remove(cb, cb);
				},
				cb
			);
		} else {
			console.info('webkitResolveLocalFileSystemURL is', typeof webkitResolveLocalFileSystemURL);
			cb();
		}
	};

	this.readAsDataURL = function (name, callback) {
		request(function (fs) {
			fs.root.getFile(
				name,
				null,
				function (fileEntry) {
					fileEntry.file(function (f) {
						const reader = new FileReader();

						reader.onload = function (e) {
							callback(null, e.target.result);
						};
						reader.readAsDataURL(f);
					});
				},
				function (err) {
					console.log('Fail get entry for', name);
					callback(err);
				}
			);
		});
	};

	this.readAsDataURLbyURL = function (url, callback) {
		url = url.replace(/.+persistent\//, '');
		request(function (fs) {
			fs.root.getFile(
				url,
				null,
				function (fileEntry) {
					fileEntry.file(function (file) {
						const reader = new FileReader();

						reader.onload = function (e) {
							callback(null, e.target.result);
						};
						reader.readAsDataURL(file);
					});
				},
				function (err) {
					console.log('Fail get entry for', url);
					callback(err);
				}
			);
		});
	};

	this.safeReadAsDataURLbyURL = function (url, callback) {
		if (typeof webkitRequestFileSystem === 'object') {
			return readAsDataURLbyURL(url, callback);
		}

		const path = url.split('/persistent').pop();

		RedundancyStorage.get(path, function (err, contents) {
			// const blob = Utils.dataURIToBlob(contents);

			if (err) {
				console.warn(err);
				callback(err, null);
				return;
			} else {
				callback(null, contents);
			}
		});
	};

	this.read = function (name, callback) {
		request(function (fs) {
			fs.root.getFile(
				name,
				null,
				function (fileEntry) {
					fileEntry.file(function (f) {
						const reader = new FileReader();

						reader.onload = function (e) {
							callback(null, e.target.result);
						};
						reader.readAsArrayBuffer(f);
					});
				},
				function (err) {
					console.log('Fail get entry for', name);
					callback(err);
				}
			);
		});
	};

	this.truncate = function (name, callback) {
		request(function (fs) {
			fs.root.getFile(
				name,
				{
					create: true,
				},
				function (fileEntry) {
					fileEntry.createWriter(function (f) {
						f.onwriteend = function (event) {
							callback(null);
						};
						f.onerror = function (err) {
							callback(err);
						};

						f.truncate(0);
					});
				}
			);
		});
	};

	this.getEntryByURL = function (url, cb) {
		webkitResolveLocalFileSystemURL(
			url,
			function (entry) {
				cb(null, entry);
			},
			cb
		);
	};

	this.existsByURL = function (url, cb) {
		webkitResolveLocalFileSystemURL(
			url,
			function (entry) {
				cb(null, true);
			},
			function () {
				cb(null, false);
			}
		);
	};

	this.getEntry = function (name, cb) {
		request(function (fs) {
			fs.root.getFile(
				name,
				null,
				function (fileEntry) {
					cb(null, fileEntry);
				},
				function (err) {
					cb(err);
				}
			);
		});
	};

	this.write = function (name, text, params, callback) {
		if (typeof params === 'function') {
			callback = params;
			params = {};
		}

		if (typeof params.redundancy === 'undefined') {
			params.redundancy = true;
		}

		// first create dir
		console.log('Write File', name);
		const dir = _parseDir(name);

		self.makeDir(dir, function () {
			self.truncate(name, function (err) {
				if (err) {
					return callback(err);
				}

				request(function (fs) {
					fs.root.getFile(
						name,
						{
							create: true,
						},
						function (fileEntry) {
							fileEntry.createWriter(function (f) {
								const blob = new Blob([text]);
								let cbCalled = false;

								f.onwriteend = function (event) {
									if (cbCalled) {
										return;
									}

									cbCalled = true;
									console.log('Write end for', name, f.length);
									// store content to redundancy storage
									const fURL = fileEntry.toURL();

									Utils.Async.chain([
										function (next) {
											if (params.redundancy) {
												const reader = new FileReader();
												let _nextCalled = false;

												reader.onload = function (e) {
													if (_nextCalled) {
														return;
													}

													_nextCalled = true;
													RedundancyStorage.set(name, e.target.result, function (err) {
														console.log('Redundancy set', name, err);
														next();
													});
												};
												reader.onerror = function () {
													if (_nextCalled) {
														return;
													}

													_nextCalled = true;
													return next();
												};
												reader.readAsDataURL(blob);
											} else {
												next();
											}
										},
										function () {
											callback(null, fURL);
										},
									]);
								};
								f.onerror = function (err) {
									if (cbCalled) {
										return;
									}

									cbCalled = true;
									console.error('Twrite file error', err);
									callback(err);
								};

								f.write(blob);
							});
						}
					);
				});
			});
		});
	};

	this.checkIntegrity = function () {
		const notExistsFiles = [];

		Utils.Async.chain([
			function (next) {
				RedundancyStorage.getAllPaths(function (err, paths) {
					if (err) {
						return console.error('FS Integity check: fail get paths from redundancy storage');
					}

					// check all paths should be exists
					Utils.Async.arrayProcess(
						paths,
						function (path, apNext) {
							self.getEntry(path, function (err, entry) {
								if (err) {
									// think that file not found
									notExistsFiles.push(path);
								}

								apNext();
							});
						},
						function () {
							next();
						}
					);
				});
			},
			function (next) {
				if (!notExistsFiles.length) {
					return next();
				}

				// restore files
				self.state = 'restoring';
				Utils.Async.arrayProcess(
					notExistsFiles,
					function (path, apNext) {
						RedundancyStorage.get(path, function (err, contents) {
							const blob = Utils.dataURIToBlob(contents);

							self.write(
								path,
								blob,
								{
									redundancy: true,
								},
								function (err) {
									console.log('File written ', path, ' result', err);
									apNext();
								}
							);
						});
					},
					function () {
						next();
					}
				);
			},
			function () {
				setTimeout(function () {
					self.state = 'normal';
				}, 3000);
			},
		]);
	};

	this.exists = function (name, callback) {
		request(function (fs) {
			fs.root.getFile(
				name,
				null,
				function () {
					callback(true);
				},
				function () {
					callback(false);
				}
			);
		});
	};
};

export default new FileSystemSD();
