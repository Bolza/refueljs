/*

	@param data direct set data
	@param key  localStorage key
	@param url  ajax call url
*/
Refuel.define('DataSource', {inherits: 'Events', require: ['ajax']}, 
	function DataSource() {

		var data = {},
			_loadStatus = 'idle';

		var config = {
				'defaultDataType': 'Object',
				'dataPath': null,
				'successCallback': successCallback.bind(this),
				'errorCallback': errorCallback.bind(this)
			},
			extLoadingState = {
				requested: 0,
				completed: 0
			};

		this.setLoadComplete = function() {
			_loadStatus = 'complete';
		}
		this.setLoadProgress = function() {
			_loadStatus = 'progress'; 
		}
		this.setLoadIdle = function() {
			_loadStatus = 'idle';
		}
		Object.defineProperty(this, 'loadComplete', {
			get: function() {
		        return _loadStatus == 'complete';
		    }
		});
		Object.defineProperty(this, 'loadProgress', {
			get: function() {
		        return _loadStatus == 'progress';
		    }
		});
		Object.defineProperty(this, 'loadIdle', {
			get: function() {
		        return _loadStatus == 'idle';
		    }
		});
		Object.defineProperty(this, 'data', {
			configurable: true,
					
			get: function() {
		        return data;
		    },
		    set: function(val) {
		    	data = val;
		    }
		});

		this.init = function(myConfig) {
			config = Refuel.mix(config, myConfig);
			refreshInterface.call(this);

			if (this.loadComplete) {
           		this.notify('dataAvailable', {'data': data});
           	}
           	else if (config.data) {
				this.setData(config.data);
           		config.data = null;
			} 
           	else if (config.autoload) {
           		this.load();
           	}
        }

        this.setConfig = function (myConfig) {
        	config = Refuel.mix(config, myConfig);
        }	

		this.setData = function(dataObj) {
			this.setLoadProgress();
			data = dataObj;
			
			extLoadingState.found = extLoadingState.requested = extLoadingState.completed = 0;
			for(var key in data) {
				var prop = data[key];

				if (Refuel.refuelClass(prop) == 'DataSource') {
					extLoadingState.found++;
					if (prop.loadComplete) {
						checkLoadingState.call(this);
					}
					else if (!prop.loadProgress || !prop.loadComplete) {
						extLoadingState.requested++;
						prop.subscribe('dataAvailable', function() {
							extLoadingState.completed++;
							checkLoadingState.call(this);
						}, this);
						prop.setConfig({autoload: config.autoload})
						prop.init();
					}
				}
			}
			if (!extLoadingState.found) checkLoadingState.call(this);
		}

		function checkLoadingState() {
			if (this.loadProgress && extLoadingState.requested == extLoadingState.completed) {
				this.setLoadComplete();
				this.notify('dataAvailable', {'data': data});
			}
		}

		this.getData = function() {
			return data;
		}

		function filterLSData(key, value) {
			if (Refuel.refuelClass(value) == 'ObservableArray') {
				return value.data;
			}
			else {
				return value;
			}
		}

		this.save = function() {
			if (config.key) {
				localStorage.setItem(config.key, JSON.stringify(data, filterLSData));
            }
            else if (config.url) {
            	console.error('Ajax call not yet implemented');
            }

			for(var key in data) {
				var prop = data[key];
				if (Refuel.refuelClass(prop) == 'DataSource') {
					prop.save();
				}	
			}
		}

		this.load = function() {
			this.setLoadProgress();
			if (config.key) {
				var storedData = localStorage.getItem(config.key);
				var storedObject = JSON.parse(storedData);
				if (storedObject) {
            		this.setData(storedObject);
            	}
            	else {
            		
            		var defaultEmptyData = config.defaultDataType == 'Array' ? [] : {};
            		this.setData(defaultEmptyData);
            	}
            }
            else if (config.url) {
            	Refuel.ajax.get(config.url, config);
            }

            for(var key in data) {
				var prop = data[key];
				if (Refuel.refuelClass(prop) == 'DataSource') {
					if (!prop.loadComplete || !prop.loadProgress) prop.load();
				}	
			}
		}

		function successCallback(dataObj) {
			//console.log('successCallback',dataObj);
			this.setData(dataObj.responseJSON);
		}
		
		function errorCallback(dataObj) {
			console.error("datasource error:", config, dataObj);
			this.notify("dataError", this.getData());
		}

		function refreshInterface() {
			var facade = {},
				url = config.url,
				key = config.key;

			if (url) {

				facade = {
					"get": function() {
						Refuel.ajax.get(url, config);
					},
					"post": function(body) {
						Refuel.ajax.post(url, body, config);
					},
					"put": function(body) {
						Refuel.ajax.put(url, body, config);
					},
					"delete": function() {
						Refuel.ajax.delete(url, config);
					},
					"getData": this.getData //è veramente da rendere pubblica??? potrebbe essere necessario 
				}
			 }
			 else if (key) {
				facade = {
					"get": function() {
						return localStorage.getItem(key);
					},
					"set": function(dataObj) {
						localStorage.setItem(key, JSON.stringify(data));


					},
					/*"update": function(dataObj) {
						localstorage.update(config.config.key, dataObj);
					},*/
					"remove": function() {
						localStorage.removeItem(key);
					}
				}
			}
			
			for (var key in facade) {
				if (!this[key]) {
					this[key] = facade[key];
				}
			}
			return facade;
		}


    });
