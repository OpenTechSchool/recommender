
$(function() {

  // Util
  var TmplView = Backbone.View.extend({
    make_context: function() {
      if (!this.model) {
        return {};
      }
      return this.model.attributes;
    },
    render:function () {
        $(this.el).html(this.template(this.make_context()));
        return this;
    }
  });

  // Models

  var Profile = Backbone.Model.extend({});

  // Model Collections
  var Profiles = Backbone.Collection.extend({
    model: Profile,
    url: "data/profiles.json"
  });


  // Views
	var HomeView = TmplView.extend({
     template: _.template($('#tmpl-main').html())
  });

  var BooksView = TmplView.extend({
     template: _.template($('#tmpl-books').html())
  });

  var BooksByView = TmplView.extend({
     template: _.template($('#tmpl-books-by').html())
  });

  var BookView = TmplView.extend({
     template: _.template($('#tmpl-book').html())
  });

  var MainNavView = Backbone.View.extend({
    select: function(to_select) {
      var me = this.$el;
      me.find("li").removeClass("active");
      me.find("#" + to_select).addClass("active");
    }

  });


  var Router = Backbone.Router.extend({

    routes: {
        "": "home",
        // Books
        "books/by/:user": "books_by",
        "books/:book": "book",
        "books/": "books"
    },

    el: $("body"),

    initialize: function() {
      this.profiles = new Profiles();
      this.profiles.fetch();

      this.main = $('#main');
      this.mainNavView = new MainNavView({el: $('#main-nav')});

    },

    books: function () {
        // Since the home view never changes, we instantiate it and render it only once
        if (!this.booksView) {
            this.booksView = new BooksView();
            this.booksView.render();
        } else {
            this.booksView.delegateEvents(); // delegate events when the view is recycled
        }
        this.main.html(this.booksView.el);
        this.mainNavView.select('books-menu');
    },


    books_by: function (user) {
        // Since the home view never changes, we instantiate it and render it only once
        if (!this.booksByView) {
            this.booksByView = new BooksByView();
        } else {
            this.booksByView.delegateEvents(); // delegate events when the view is recycled
        }
        this.booksByView.model = this.profiles.get(user);
        this.booksByView.render();
        this.main.html(this.booksByView.el);
        this.mainNavView.select('books-menu');
    },

    book: function (book) {
        // Since the home view never changes, we instantiate it and render it only once
        if (!this.bookView) {
            this.bookView = new BookView();
            this.bookView.render();
        } else {
            this.bookView.delegateEvents(); // delegate events when the view is recycled
        }
        this.main.html(this.bookView.el);
        this.mainNavView.select('books-menu');
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
        this.mainNavView.select('home-menu');
    }

  });

  
  window.App = new Router();
  Backbone.history.start();

});