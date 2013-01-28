/**
 * This file defines a Backbone.TemplateView
 *
 * A TemplateView is a Backbone.View which is backed by a underscore
 * template.  The template should be stored in the html in a script tag
 * with type="text/template"
 *
 * @returns Backbone.TemplateView
 *
 * @requires Backbone
 */

_.namespace('Backbone', function(B) {
    function compile_template(template) {
        var src = "";
        if (_.isFunction(template)) {
            // template has already been compiled
            return template;
        } else if (template[0] === '#') {
            // template is an id, find it in the dom
            var query = $(_.sprintf("%s[type='text/template']", template));

            if (query.length == 0) {
                throw Error("TemplateView: No template found with id = " + template);
            } else if (query.length > 1) {
                throw Error("TemplateView: More than one template found with id = " + template);
            }

            src = query.text();
        } else {
            // template is a inline string, just compile it
            src = template;
        }

        return _.template(src, null, { variable: 'd' });
    }

    B.TemplateView = B.View.extend({
        constructor: function() {
            // operate directly on the prototype, so the templates are
            // only compiled once
            var proto = this.constructor.prototype;

            // mixin all the templates from inheriting templates
            var sup = this.constructor.__super__;
            while(sup) {
                if (_.has(sup, 'templates')) {
                    proto.templates = _.extend(proto.templates, sup.templates);
                }
                sup = sup.constructor.__super__;
            }

            _.each(proto.templates, function(template, key) {
                // we only compile strings, if it's not a string we
                // assume that the user is defining their own template
                // (probably their own function)
                if (_.isString(template)) {
                    proto.templates[key] = compile_template(template);
                }
            });

            B.View.prototype.constructor.apply(this, arguments);
        },

        render_base_template: function(context) {
            this.$el.html(this.render_template('base', context));
        },

        render_template: function(name, extra_context) {
            var model = _.isUndefined(this.model) ? {} : this.model.toJSON(),
                context = _.extend({
                    model: model,           // serialized representation of the model
                    _model: this.model,     // actual model
                    partial: this.partial_helper(extra_context)
                }, this.helpers, extra_context);

            return this.templates[name](context);
        },

        // generate a helper to render partials with the current context
        partial_helper: function(extra_context) {
            return _.bind(function(name, context) {
                return this.render_template(name, _.extend(extra_context, context));
            }, this);
        }
    });
});
