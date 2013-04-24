/**
    @param root: HTMLElement,
    @param symbol: Parsed template symbol, if this symbol exists, this Module's Template has been already parsed
    
    @param items Array of ListItemModule [read only]

**/
Refuel.define('ListModule',{inherits: 'BasicModule', require:'ListItemModule'}, 
    function ListModule() {
        var ENTER_KEY = 13;
        this.items = [];
        var config = {};
        this.init = function(myConfig) {
            config = Refuel.mix(config, myConfig);
            this.dataLabel = config.dataLabel;
           
            this.dataSource.setConfig({defaultDataType: 'Array'});
            this.defineUpdateManager(oa_update.bind(this));
            this.template.subscribe('_new_listitem', addListItem, this);
            this.template.setRoot(config.root);
            
            this.dataSource.subscribe('dataAvailable', function(data) {
                this.create();
                this.draw();
            }, this);
            this.dataSource.init(config);   
        }

        this.create = function() {
            this.enableAutoUpdate(this.dataSource.getData(), config.dataLabel);
        }

        this.add = function(objData) {
            this.dataSource.data.push(objData);
        }

        this.remove = function(objData) {
            var index = this.getItemIndex(objData);
            this.data.splice(index, 1);    
        }
        this.removeAt = function(index) {
            this.data.splice(index, 1);    
        }
        this.update = function(objData) {
            var obj = {};
            obj[config.dataLabel] = objData;
            this.dataSource.setData(obj);
        }

        function oa_update(e) {
            switch(e.action) {
                case 'add': 
                    addListItem.call(this,{data: e.data, index:e.index});
                break;
                case 'delete': 
                    removeListItem.call(this, {index: e.index});
                break;
                break;
                case 'filterApply': 
                case 'filterClear':
                    this.draw();
                break;
                case 'update': 

                break;
            }
        }

        //Data change callbacks
        function removeListItem(e) {
            this.items[e.index].template.remove();
            this.items.splice(e.index, 1);
        }
        function addListItem(obj) {
            var rootSymbol = this.template.getSymbolByAction('list');
            var listItem = Refuel.createInstance('ListItemModule', { 
                parentRoot: config.root, 
                template: rootSymbol.template,
                autoload: false,
                data: obj.data
            });
            this.addModule(listItem);
        }

        //TODO defineAction('add') ?

        this.defineAction('delete', function(e) {
            this.remove(e.module)
        });

        this.applyOnItems = function(callback, args) {
            var data = this.items;
            for(var i = 0, item; item = data[i]; i++) {
                var newargs = [].concat(args);
                newargs.unshift(item);
                callback.apply(item, newargs);
            }
        }

        this.getItemIndex = function(item) {
            for (var i = 0, curItem; curItem = this.items[i]; i++) {
                if (curItem === item) return i;
            };
            return null;
        }

        this.applyFilterBy = function(filterObj, permanent) {
            this.data.applyFilter(function(item, index, array) {
                var result = true;
                for (var key in filterObj) {
                    result = result && filterObj[key] == Refuel.resolveChain(key, item);
                }
                return result;
            });
            if (permanent) this.data.consolidate();
        }

        this.filterBy = function(filterObj) {
            return this.data.filter(function(item, index, array) {
                var result = true;
                for (var key in filterObj) {
                    result = result && filterObj[key] == Refuel.resolveChain(key, item);
                }
                return result;
            });
        }

        this.filterClear = function() {
            this.data.filterClear();
        }
       
});