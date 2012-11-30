
console.log($);

$(function() {

	var HomeView = Backbone.View.extend({

	template: _.template($('#tmpl-main').html()),

    render:function () {
        $(this.el).html(this.template());
        return this;
    }

});

  var Router = Backbone.Router.extend({

    routes: {
        "": "home"
    },

    el: $("body"),

    initialize: function() {
      this.main = $('#main');
    },

    home: function () {
        // Since the home view never changes, we instantiate it and render it only once
        if (!this.homeView) {
            this.homeView = new HomeView();
            this.homeView.render();
        } else {
            this.homeView.delegateEvents(); // delegate events when the view is recycled
        }
        this.main.html(this.homeView.el);
        // this.headerView.select('home-menu');
    }

  });

  
  window.App = new Router();
  Backbone.history.start();

});