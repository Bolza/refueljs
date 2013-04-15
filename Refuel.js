(function() {
	window.Refuel = {};
	var classMap = {};

	Refuel.classMap = classMap;
	  
	function argumentsToArray(args){
		return Array.prototype.slice.call(args);
	}

	Refuel.mix = function(base, argumenting) {
		var res = Refuel.clone(base);
		for (var prop in argumenting) {
			res[prop] = argumenting[prop];
		}
		return res;
	}

	Refuel.implement = function(interface, target, options) {
		target.constructor = target;
		interface.apply(target);
	}

	Refuel.isArray = function(target) {
		return toString.call(target) === '[object Array]';
	}
	Refuel.isUndefined = function(target) {
		return typeof(target) === 'undefined';
	}
	
	Refuel.clone = function(old) {
		var obj = {};
		for (var i in old) {
			if (old.hasOwnProperty(i)) {
				obj[i] = old[i];
			}
		}
		return obj;
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
		if (path && path != '.' && path != '') {
			var dataPath = path.split('.');
			var parent;
			for (var i=0, item; item = dataPath[i]; i++) {
				parent = extData;
				extData = extData[item];
				
				while (Refuel.refuelClass(extData) == 'DataSource') {
					parent = extData;
					extData = extData.getData()[item];
				}
			}
		}
		if (getParent) return {'value': extData, 'parent': parent}
		else return extData;
	}

	Refuel.createInstance = function (className, initObj) {
	    var cl = classMap[className];
	    if(typeof cl === 'undefined') throw className+' not defined, please use Refuel.define';

	    var instance;
	    var F = cl.body;
	    //console.log('createInstance', className, '<-', cl.inherits);
	    if (cl.inherits) {
	    	if (!classMap[cl.inherits]) throw cl.inherits+' not defined, please use Refuel.define'  
	        F.prototype = Refuel.createInstance(cl.inherits, initObj);
	    }
	    instance = new F(initObj);    
	   	instance._refuelClassName = className;
	    if (instance.hasOwnProperty('init')) {
	    	instance.init(initObj);
	    } 
	    return instance;

	}

	Refuel.define = function(className, req, body) {
	    if(classMap[className] !== undefined) {
	        console.error(className,' alredy defined!');
	        return;
	    }
	    if(body === undefined) {
	        body = req;
	    }
	    //console.log( 'defineClass',className, req);
	    var requirements = [];
	    requirements = requirements.concat(req.require, req.inherits);
	    requirements = requirements.filter(function(c){
	        if (c !== undefined) return true;
	        else return false;
	    });

	    define(className, requirements, function() {
	        //console.log('defineClass.define', className,'->', require);
	        classMap[className] = {
	            body: body,
	            inherits: req.inherits
	        };
	    });
	}
	
	var head = document.querySelector('head');
	var script = head.querySelector('script[data-rf-startup]'); 
	var node = document.createElement('script');
	var startupModule = script.getAttribute('data-rf-startup');
    node.type = 'text/javascript';
    node.charset = 'utf-8';
    node.async = true;
	node.addEventListener('load', onScriptLoad, false);
	node.src = 'require.js';
	head.appendChild(node);

	function onScriptLoad(e) {
		if(e.type === 'load') {
			console.log(node.src, 'loaded!');
			e.target.parentNode.removeChild(e.target);
			require.config({
            	baseUrl: '.',
            	paths: {
            		'hammer.js': '.',
            		'path.js': '.'
            	}
          	});
          	startupRequirements = [startupModule, 'hammer.js', 'path.js'];
			require(startupRequirements, function(start) {
				Path.listen();
				classMap[startupModule].body();
			});
		}

	}


})();

