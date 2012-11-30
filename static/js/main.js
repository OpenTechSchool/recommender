
console.log($);

$(function() {

  var TmplView = Backbone.View.extend({
      render:function () {
          $(this.el).html(this.template());
          return this;
      }
  });

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
      console.log(this);
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
            this.booksByView.render();
        } else {
            this.booksByView.delegateEvents(); // delegate events when the view is recycled
        }
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