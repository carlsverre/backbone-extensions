_.namespace('Backbone', function(B) {
    B.Form = B.TemplateView.extend({
        events: {
            'submit form': '_handle_submit',
            'click .cancel': '_handle_cancel'
        },

        /* Example of the form object.  Each form element should be
           specified in this array.

           Each element of this array can either be an object or string.
           If you provide an object, the object should define atleast the following properties:
                { nice_name: "human readable name", name: "server_param_name", val: function() { return this.$('.element').val(); } }

           If you want tooltips on a custom object (see previous note),
           make sure to define a `selector` attribute, which references
           an element on which to attach the tooltip.

           Example:

            form: [
                '.element_1_selector',
                { nice_name: "human readable name", name: "server_param_name", val: function() { return this.$('.element').val(); } },
                { selector: '.custom_element', nice_name: "custom object with tooltip", name: "name", val: function() { return this.form_widget.get_value(); } }
            ]
        */
        form: [],

        templates: {
            tooltip:
                '<div class="tooltip"><div class="arrow"></div><%= d.error %></div>'
        },

        initialize: function() {
            if (!_.has(this.templates, "base")) { mp.utility.error("Backbone.Form requires you to define a base template"); }

            this.render_base_template(this.options);
            this.render();  // preform any additional rendering
            this.$el.addClass('backbone_form');

            var form_count = this.$('form').length;
            if (form_count == 0) { mp.utility.error('Backbone.Form requires you to have a form element in your base template'); }
            else if (form_count > 1) { mp.utility.error('Backbone.Form requires you to have only one form element in your base template'); }
        },

        reset: function() {
            this.remove_tooltip();
            this.$('form').get(0).reset();
        },

        _handle_cancel: function() {
            this.trigger('cancel');
        },

        _handle_submit: function(e) {
            // prevent the form from actually submitting
            e.preventDefault();

            // save the form to the server
            this._save();

            return false;
        },

        _save: function() {
            var form_data = this._get_form_data(),
                errors = this._validate(form_data);

            if (errors && errors.length > 0) {
                this.trigger('validation_error', errors);

                if (!this.options.disable_tooltips) {
                    // we only show one tooltip at a time
                    this.show_tooltip(errors[0]);
                }
            } else {
                this.loading_state();
                this.make_request(form_data);
            }
        },

        _get_form_data: function() {
            return _.map(this.form, function(spec) {
                if (_.isString(spec)) {
                    var el = this.$(spec);
                    return {
                        el: el,
                        val: el.val(),
                        nice_name: el.attr('title'),
                        name: el.attr('name')
                    };
                } else {
                    // clone the spec so we don't modify the original
                    // object
                    spec = _.clone(spec);

                    if (!spec.val) { mp.utility.error('Backbone.Form: objects in the forms variable must have a method `val()`'); }
                    spec.val = spec.val.call(this);
                    if (spec.selector) { spec.el = this.$(spec.selector); }

                    return spec;
                }
            }, this);
        },

        _validate: function(form_data) {
            var errors = _(form_data).chain()
                .map(function(spec) {
                    return _.extend({}, spec, {
                        error: this.validate_element(spec, form_data)
                    });
                }, this)
                .filter(function(spec) {
                    return spec.error;
                }).value();

            return errors;
        },

        validate_element: function(form_element, form_data) {
            if (_.isUndefined(form_element.val) || (_.isString(form_element.val) && form_element.val.length == 0)) {
                return _.sprintf("%s is required.", form_element.nice_name);
            }
        },

        make_request: function(form_data) {
            var request_data = {};
            _.each(form_data, function(spec) {
                request_data[spec.name] = spec.val;
            });

            $.ajax(this.endpoint, {
                type: 'POST',
                dataType: 'json',
                data: request_data,
                error: _.bind(function(xhr, status, error) { this.trigger_error(error); }, this),
                success: _.bind(this.trigger_success, this)
            });
        },

        trigger_error: function(error) {
            this.remove_tooltip();
            this.loaded_state();
            this.trigger('error', error);
        },

        trigger_success: function(data) {
            this.remove_tooltip();
            this.loaded_state();
            if (!this.server_response_success(data)) {
                this.trigger('error', this.parse_server_error(data));
            } else {
                this.trigger('save', this.parse_server_success(data));
            }
        },

        // check if the server response was successful
        server_response_success: function(data) {
            return (_.has(data, 'success') && data.success) || (_.has(data, 'error') && data.error.length == 0);
        },

        // parse some type of error message from a server response
        parse_server_error: function(data) {
            return data.message || data.error;
        },

        // parse some type of success message from a server response
        parse_server_success: function(data) {
            return data.message;
        },

        // TOOLTIP STUFF
        show_tooltip: function(spec) {
            this.remove_tooltip();
            this.current_tooltip = $(this.render_template("tooltip", spec));

            if (spec.el) {
                var offset = spec.el.position();
                this.current_tooltip.css({
                    'top': offset.top + spec.el.outerHeight(),
                    'left': offset.left + 10
                });

                var width = spec.el.outerWidth();
                if (width < 100) {
                    // move the arrow so it points at the center of the
                    // element
                    this.current_tooltip.find('.arrow').css({
                        'left': width / 2 - 15
                    });
                }

                spec.el.parent().append(this.current_tooltip);
            }
        },

        remove_tooltip: function() {
            if (this.current_tooltip) { this.current_tooltip.remove(); }
        }
    });
});
