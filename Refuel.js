(function() {

	window.Refuel = window['Refuel'] || {};
	Refuel.config = Refuel.config || config; //overwrite not merge
	var classMap = {};
	var defaultClassName = '_Refuel-default-start-class';
	Refuel.classMap = classMap;
	var _pageParams;

	function argumentsToArray(args){
		return Array.prototype.slice.call(args);
	}

	Refuel.mix = function(base, argumenting, _n) {
		//var res = Refuel.clone(base);
		var res = {};
		var recursionLimit = 10;
		_n = _n || 0;
		for (var prop in base) {
			res[prop] = base[prop];
		}
		for (var prop in argumenting) {
			if (Refuel.isObject(res[prop]) && _n <= recursionLimit) {
				res[prop] = Refuel.mix(res[prop], argumenting[prop], _n++);
			}
			else {
				res[prop] = argumenting[prop];
			}
		}
		return res;
	}

	Refuel.isArray = function(target) {
		return Object.prototype.toString.call(target) === '[object Array]';
	}
	Refuel.isObject = function(target) {
		return Object.prototype.toString.call(target) === '[object Object]';
	}
	Refuel.isUndefined = function(target) {
		return typeof(target) === 'undefined';
	}

	function _getPageParams() {
		var _params = location.search.replace('?', '');
		_params = _params.split('&');
		var params = {};
		for (var i=0, c; c = _params[i]; i++) {
		    c = c.split('=');
		    params[c[0]] = c[1];
		}
		return params;
    }

	Object.defineProperty(Refuel, "pageParams", {
	    get: function() {
	    	if (!_pageParams) _pageParams = _getPageParams(); 
	    	return _pageParams; 
	    }
	});

	Refuel.cookie = {
		set: function(c_name, value, days, domain) {
			if (!days) days=7;
			domain = domain ?  "; domain=" + domain : "";
			var date = new Date(), expires;
			date.setTime(date.getTime()+(days*24*60*60*1000));
			expires = "; expires=" + date.toGMTString();
			document.cookie = c_name + "=" + value + expires + "; path=/" + domain; 
		},
		remove: function(c_name) {
			document.cookie = c_name +'=; expires=Thu, 01-Jan-70 00:00:01 GMT;';
		},
		get: function(c_name) {
			var i,x,y,ARRcookies=document.cookie.split(";");
			y = null;
			for (i=0;i<ARRcookies.length;i++) {
				x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
				y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
				x=x.replace(/^\s+|\s+$/g,"");
				if (x==c_name) {
					if (typeof(y) === 'undefined' || y == false) return null;
					else return unescape(y);
				}
			}
			return null;
		}
	}

	Refuel.clone = function(obj) {
		if(obj === null || typeof(obj) !== 'object'){
			return obj;
		}
		var temp;
		try {
			temp = obj.constructor(); // changed
		}
		catch(e) {
			//htmlElement returns itself
			return obj;
		}
		
		for(var key in obj){
			temp[key] = Refuel.clone(obj[key]);
		}
		return temp;
	}

	Refuel.refuelClass = function(obj) {
		var res = undefined;
		if (obj && obj._refuelClassName) {
			res = obj._refuelClassName
		}
		return res;
			
	}
	
	Refuel.resolveChain = function(path, data, getParent) {
		var extData = data;
		var negate = false;
		if (path && path != '.' && path != '') {
			negate = path.indexOf('!') != -1;
			if (negate) {

				path = path.substr(negate);
			}
			var dataPath = path.split('.');
			var parent;
			for (var i=0, item; item = dataPath[i]; i++) {
				parent = extData;
				if (extData === undefined) {
					console.error(item,'in',path,'from',data,'is undefined');
				}
				extData = extData[item];
				
				while (Refuel.refuelClass(extData) == 'DataSource') {
					parent = extData;
					extData = extData.getData();//[item];
				}

			}
		}
		if (negate) extData = !extData;
		
		if (getParent) return {'value': extData, 'parent': parent}
		else return extData;
	}

	Refuel.createInstance = function (className, initObj) {
		var cl = classMap[className];
	    if(typeof cl === 'undefined') {
			throw className + ' not defined, please use Refuel.define';
		}
	    var instance;
	    var F = cl.body;
	    if (!initObj._refuelClassName) initObj._refuelClassName = className;
	    if (cl.inherits) {
	    	if (!classMap[cl.inherits]) {
				throw cl.inherits + ' not defined, please use Refuel.define';
			}
	        F.prototype = Refuel.createInstance(cl.inherits, initObj);
	    }
	    instance = new F(initObj);   
	    //Parent-class keeps child-class className
	   	if (!instance._refuelClassName) {
	   		instance._refuelClassName = initObj._refuelClassName;
	   		delete initObj._refuelClassName;
	    }
	    if (instance.hasOwnProperty('init')) {
	    	instance.init(initObj);
	    } 
	    return instance;

	}
	Refuel.newModule = function (className, initObj) {
		return Refuel.createInstance(className, initObj);
	}

	Refuel.define = function(className, req, body) {
	   	if(classMap[className] !== undefined) {
			throw new TypeError(className + ' alredy defined!');
	        return;
	    }
	    if(body === undefined) {
	        body = req;
	    }

	    var requirements = [];
	    requirements = requirements.concat(req.require, req.inherits);
	    requirements = requirements.filter(function(c){
	        if (c !== undefined) return true;
	        else return false;
	    });
		try{
			define(className, requirements, function() {
				classMap[className] = {
					body: body,
					inherits: req.inherits
				};
			});
		}
		catch(e){
			console.log(e)
		}
	}

	Refuel.start = function(req, body) {
		startupModule = defaultClassName;
		Refuel.define(defaultClassName, req, body);
		startApplication();
	}

	Refuel.static = function(className, body) {
		Refuel[className] = body();
	}

	Refuel.callOnLoaded = function(path, callback) {
		var node = document.createElement('script');
		node.type = 'text/javascript';
     	node.charset = 'utf-8';
     	node.async = true;
 		node.addEventListener('load', callback, false);
 		node.src = path;
 		var head = document.querySelector('head');
 		head.appendChild(node);
		return node;
	}

	var userDefinedModules;
 	var head = document.querySelector('head');
 	var script = head.querySelector('script[data-rf-startup]');
 	var userModulesElement = head.querySelector('script[data-rf-confmodules]');
 	var node;


 	if (userModulesElement) {
	 	userDefinedModules = userModulesElement.getAttribute('data-rf-confmodules');
 	}

	//var path = window.location.pathname;
	if (script) {
	 	var startupModule = script.getAttribute('data-rf-startup');
	 	var startupPath = startupModule.split('/');
	 	startupModule = startupPath[startupPath.length-1];
		startupPath = startupPath.slice(0,startupPath.length-1).join('/') || '.';
	}

 	if (typeof define == 'undefined') {
 		node = Refuel.callOnLoaded(Refuel.config.requireFilePath, onScriptLoad);
 	} else {
		startApplication();
 	}

	function onScriptLoad(e) {
		if(e && e.type === 'load') {
			console.log(e.target.src, 'loaded!');
			e.target.parentNode.removeChild(e.target);
			startApplication();
			//Refuel.callOnLoaded('js/xrayquire.js', function(){});
		}
	}
	function startApplication() {
		if (!startupModule) return;
		var baseConfig = { baseUrl: '', paths: {} };
		baseConfig.baseUrl = Refuel.config.basePath;//path;
		var startupRequirements = [];
		if (startupModule) {
			startupModule = startupModule.replace('.js', '');
			baseConfig.paths[startupModule] = startupModule;
			startupRequirements.push(startupModule);
		} 

		Refuel.config = Refuel.mix(baseConfig, Refuel.config);
      	require.config(Refuel.config);

      	if(userDefinedModules) {
      		startupRequirements.push(userDefinedModules);	
      	} 
      	else {
      		if (!Refuel.config.modules) startupRequirements.push('config.modules');	
      	}
      	require(startupRequirements, function() {
      		try {
				Path.listen();
			}
			catch (e) {}
			if (startupModule) classMap[startupModule].body();
		});
	}
})();

