_.namespace("Backbone", function(BB) {

    // clean up method for Backbone Views
    BB.View.prototype.close = function() {
        this.trigger('close');
        this.remove();
        this.off();
    };

    // helper for adding a custom cleanup handler
    //
    // ex: (in view)
    //  this.on_close(function() { this.sub_view.close(); });
    BB.View.prototype.on_close = function(callback) {
        var cb = _.bind(function() {
            this.off(null, cb);
            callback.call(this);
        }, this);

        this.on("close", cb);
    };
});
