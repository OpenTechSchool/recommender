
$(function() {

  // Util
  var TmplView = Backbone.View.extend({

    default_context: {},

    extend_context: function() {
      return {};
    },
    render:function () {
      var context = _.extend({},
          this.default_context,
          this.model ? this.model.toJSON() : {},
          this.extend_context());

      $(this.el).html(this.template(context));
      return this;
    }
  });

  // Models

  var Profile = Backbone.Model.extend({});
  var Book = Backbone.Model.extend({});
  var Recommendation = Backbone.Model.extend({});

  // Model Collections
  var Profiles = Backbone.Collection.extend({
    model: Profile,
    url: "data/profiles.json"
  });

  var Books = Backbone.Collection.extend({
    model: Book,
    url: "data/books.json"
  });

  var Recommendations = Backbone.Collection.extend({
    model: Recommendation,
    url: "data/recommendations.json"
  });


  // Views
	var HomeView = TmplView.extend({
     template: _.template($('#tmpl-main').html())
  });

  var BooksView = TmplView.extend({
    template: _.template($('#tmpl-books').html())
  });

  var BooksByView = TmplView.extend({
     template: _.template($('#tmpl-books-by').html()),

    extend_context: function() {
      var app = this.options.app;
      return {"recommendations": app.recommendations.where({
          "type": "book",
          "by": this.model.id
        }).map(function(item){
          return {"text": item.get("says"),
                  "book": app.books.get(item.get("item_id")).toJSON()};
          })
      };
    }
  });

  var BookView = TmplView.extend({
     default_context: {"level": null},
     template: _.template($('#tmpl-book').html()),

    extend_context: function() {
      var app = this.options.app;
      console.log(this);
      return {"recommendations": app.recommendations.where({
          "type": "book",
          "item_id": this.model.id
        }).map(function(item){
          console.log(item);
          return {"text": item.get("says"),
                 "user": app.profiles.get(item.get("by")).toJSON()};
          })
      };
    }
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
      this.books = new Books();
      this.recommendations = new Recommendations();

      this.profiles.fetch();
      this.books.fetch();
      this.recommendations.fetch();

      this.main = $('#main');
      this.mainNavView = new MainNavView({el: $('#main-nav')});

    },

    books: function () {
        // Since the home view never changes, we instantiate it and render it only once
        if (!this.booksView) {
            this.booksView = new BooksView({app: this});
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
            this.booksByView = new BooksByView({app: this});
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
            this.bookView = new BookView({app: this});
            this.bookView.render();
        } else {
            this.bookView.delegateEvents(); // delegate events when the view is recycled
        }
        this.bookView.model = this.books.get(book);
        console.log(book);
        console.log(this.bookView.model);
        this.bookView.render();
        this.main.html(this.bookView.el);
        this.mainNavView.select('books-menu');
    },

    home: function () {
        // Since the home view never changes, we instantiate it and render it only once
        if (!this.homeView) {
            this.homeView = new HomeView({app: this});
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