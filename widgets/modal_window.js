_.namespace('Backbone.widgets', function() {

    var ModalWindow = Backbone.Widget.extend({
        className: "backbone_modal_window",
        templates: {
            "base":
                '<div class="window_wrap">' +
                    '<div class="close"><img src="/site_media/images/backbone_widgets/icon_x.png" /></div>' +
                    '<div class="window">' +
                        '<div class="content"></div>' +
                    '</div>' +
                '</div>'
        },

        events: {
            'click .close': 'handle_close',
            'click': 'clickout'
        },

        initialize: function() {
            this.render_base_template();
            this.hide();
            this.$el.appendTo(this.options.wrapper || 'body');

            this.content = this.$('.content');

            if (_.isNumber(this.options.padding)) {
                this.$('.window').css('padding', this.options.padding);
            } else {
                this.options.padding = 14;
            }
            if (this.options.wrapper) {
                this.$el.css('position', 'absolute');
            }

            if (this.options.width) {
                this.$('.window_wrap').width(this.options.width + (this.options.padding * 2));
            }

            if (this.options.widget) {
                this.set_widget(this.options.widget);
            }

            if (this.options.disable_close) {
                this.$('.close').hide();
            }

            this.on_close(function() {
                if (this.widget) { this.widget.close(); }
                $(this.options.wrapper || window).off('resize.backbone_modal_widget');
            });
        },

        set_widget: function(widget) {
            if (this.widget) { this.widget.close(); }
            this.widget = widget;

            this.content.empty().append(this.widget.el);
        },

        set_content: function(el) {
            this.content.empty().append(el);
        },

        show: function() {
            this.$el.show();
            this.content.children().show();
            $(this.options.wrapper || window).on('resize.backbone_model_widget', _.bind(this.resize, this)).resize();
            this.trigger('show');
        },

        hide: function() {
            this.$el.hide();
            $(this.options.wrapper || window).off('resize.backbone_modal_widget');
            this.trigger('hide');
        },

        handle_close: function() {
            if (!this.options.disable_close) {
                this.hide();
                if (this.options.on_close) { this.options.on_close(); }
            }
        },

        clickout: function(e) {
            if (e.target === this.el) {
                this.handle_close();
            }
        },

        resize: function() {
            var wheight = $(this.options.wrapper || window).height(),
                modal_window = this.$('.window_wrap'),
                eheight = modal_window.outerHeight(),
                top = (wheight / 2) - (eheight / 2);

            modal_window.css('top', top);
        }
    });

    return {
        ModalWindow: ModalWindow
    };
});
