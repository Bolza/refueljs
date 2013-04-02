/** 
    Every config param can be set in the Module
    
    @param parentRoot: HTMLElement
    @param template: Refuel.Template instance
**/

Refuel.define('ListItemModule', {inherits: 'BasicModule'},  
    function ListItemModule() {
        var self = this;

        this.init = function(myConfig) {
            this.config = Refuel.mix(this.config, myConfig);
            this.enableAutoUpdate(this.dataSource.getData());
        }
        this.create = function() {
        }

        this.toggleClass = function(classname, value) {
            var root = this.template.getRoot();
            //var value = value || !this.template.getRoot().className
            if (value === undefined) root.classList.toggle(classname);
            root.classList.add(classname);
            root.classList.remove(classname);

        }
        
        //serve anche sapere quando il tmpl ha finito di parsare? automatizzare il processo!
        //in callback del datasource, probabilmente automatizzando
        this.draw = function() {
            this.template.create(this.config.parentRoot, this.config.template, this.dataSource.getData());
        }

		


});

