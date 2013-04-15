Refuel.define('GenericModule',{inherits: 'BasicModule', require:'ListModule'}, 
    function GenericModule() {
        var config = {};
        this.items = [];

        this.init = function(myConfig) {
            config = Refuel.mix(config, myConfig);
            this.defineUpdateManager(oa_update);

            this.dataSource.subscribe('dataAvailable', function(data) {
                this.create();
                this.draw();
            }, this);

            this.dataSource.init(config);
        }
            
        this.create = function() {
            this.template.subscribe('_new_list', createList, this);
            this.template.setRoot(config.root);
        }
       

        function createList(e) {
            var label = e.symbol.linkedTo;
            if (typeof this.items[label] === 'undefined') {
                var linkedData = Refuel.resolveChain(label, this.dataSource.getData()) || '';
                var obj = {};
                obj[label] = linkedData || [];

                var list = Refuel.createInstance('ListModule', { 
                    root: e.symbol.domElement,
                    dataLabel: label,
                    dataSource: this.data(label)
                });

                this.addModule(list);
            }
        }

        function oa_update(e) {
            //console.log('GenericModule.update ->',e);      
        }

});
