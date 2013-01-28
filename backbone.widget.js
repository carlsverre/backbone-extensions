_.namespace('Backbone', function(B) {
    B.Widget = B.TemplateView.extend({
        show: function() { this.$el.show(); },
        hide: function() { this.$el.hide(); }
    });
});
