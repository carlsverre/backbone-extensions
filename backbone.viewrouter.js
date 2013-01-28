_.namespace('Backbone', function() {

    // from backbone.js
    var namedParam    = /:\w+/g;
    var splatParam    = /\*\w+/g;
    var escapeRegExp  = /[-[\]{}()+.,\\^$|#\s]/g;

    var risonParam    = /:rison/g;

    var ViewRouter = Backbone.Router.extend({

        navigate: function(fragment, options) {
            Backbone.Router.prototype.navigate.apply(this, arguments);
        },

        route: function(route, name, callback) {
            var cb = undefined;
            if (! _.isUndefined(callback)) {
                cb = function() {
                    var route_data = callback.apply(this, arguments);
                    route_data && this._change_page(name, route_data);
                };
            }
            return Backbone.Router.prototype.route.call(this, route, name, cb);
        },

        _change_page: function(name, route_data, non_rison) {
            // error out if session or render_target are undefined
            // we do this here so that you can use ViewRouter as an
            // inline replacement to regular Backbone.Router
            if (!this.session) { throw "Must define 'session' variable on ViewRouter"; }
            if (!this.render_target) { throw "Must define 'render_target' variable on ViewRouter"; }

            // deconstruct the current view
            if (this.current_view) { this.current_view.close(); }

            // update session variables
            this.session.set(_.extend({ page: name }, route_data.session));

            // construct new view
            this.current_view = new route_data.view;
            this.render_target.html(this.current_view.el);

            // load rison support
            this._load_rison(route_data.rison);

            this.current_view.trigger('ready');
        },

        _load_rison: function(rison) {
            // load rison
            if (rison) {
                var params = this._decode_rison(rison);
                params && this.current_view.update_params(params);
            }

            this.current_view.on('serialize_params', function(prefix, params) {
                var rison = this._encode_rison(params);
                this.navigate(prefix + "/" + rison);
            }, this);
        },

        _decode_rison: function(rison) {
            if (!rison) { return {}; }
            return RISON.urldecode(_.sprintf("(%s)", rison));
        },
        _encode_rison: function(params) {
            var rison = RISON.urlencode(params);
            return rison.substring(1, rison.length - 1); // remove leading and trailing parens
        },

        _routeToRegExp: function(route) {
            route = route.replace(escapeRegExp, '\\$&')
                         .replace(risonParam, '(?:\/([^\/]+))?')
                         .replace(namedParam, '([^\/]+)')
                         .replace(splatParam, '(.*?)');
            return new RegExp('^' + route + '$');
        }
    });

    return {
        ViewRouter: ViewRouter
    };
});
