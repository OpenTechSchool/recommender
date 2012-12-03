
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
  /*
  function cached_func(func) {
    function wrapped() {
      if (!func.cached) {
        func.cached = func.apply(arguments);
      }
      return func.cached;
    }
    return wrapped;
  }*/

  // Models

  var Profile = Backbone.Model.extend({
    get_recommendations: function() {

    }

  });
  var Book = Backbone.Model.extend({
    getRecommendationCount: function() {
        var app = this.collection.app;
        return app.recommendations.where({"item_id": this.id}).length;
    },
    latestRecommendation: function() {
      var app = this.collection.app,
          my_id = this.get("id");
      return app.recommendations.find(function(item){
        return item.get("item_id") == my_id;
      });
    }

  });
  var Recommendation = Backbone.Model.extend({
    extendedJSON: function() {
        var json = this.toJSON(),
            app = this.collection.app;
        json["user"] = this.getUser().toJSON();
        json["book"] = this.getBook().toJSON();
      return json;
    },
    getUser: function() {
      return this.collection.app.profiles.get(this.get("by"));
    },
    getBook: function() {
      return this.collection.app.books.get(this.get("item_id"));
    }

  });

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
	var HomeView = Backbone.View.extend({
     template: _.template($('#tmpl-main').html()),

    render: function () {
      $(this.el).html(this.template());
      return this;
    }
  });

  var BooksView = Backbone.View.extend({
    template: _.template($('#tmpl-books').html()),
    itemTemplate: _.template($('#tmpl-book-item').html()),

    sub_menu: "mr",
    item_count: 10,
    query: undefined,

    events: {
      "click .nav li a": "select_menu"
    },

    update_books: function() {
      var $el = $(this.el),
          $target = $el.find("#book-list").html("Loading...");
          app = this.options.app,
          view = this,
          rendered = [];

      $el.find(".nav li").removeClass("active");
      $el.find("#sub-menu-" + this.sub_menu).addClass("active");

      var book_listing = app.books.models;
      if (this.query) {
        var query = [],
            level = "",
            tags = [];
        _.each(this.query.split("+"), function(item) {
            if (item.slice(0, 6) === "level:") {
            var qu = item.slice(6);
            if (qu && !level) {
              level = qu;
            }
            return;
          }
          if (item.slice(0, 4) === "tag:") {
            var tag = item.slice(4);
            if (tag) {
              tags.push(tag);
            }
            return;
          }
          query.push(item);
        });
        
        if (level) {
          book_listing = _.filter(book_listing, function(book) {
            return book.get("level") === level;
          });
        }

        if (tags.length) {
          book_listing = _.filter(book_listing, function(book) {
            return _.intersection(book.get("tags"), tags).length;
          });
        }

        if(query.length) {
          book_listing = _.filter(book_listing, function(book) {
            return !_.find(query, function(keyword) {
              return book.attributes.title.toLowerCase().indexOf(keyword) === -1 &&
                     book.attributes.desc.toLowerCase().indexOf(keyword) === -1 &&
                     book.attributes.author.toLowerCase().indexOf(keyword) === -1;
            });
          });
        }
        
      }

      if (this.sub_menu == "lb") {
        $target.empty();
        _.each(_.first(book_listing, this.item_count), function(book) {
          var rcm = book.latestRecommendation();
          if (!rcm) {
            // no recommendation found
            return;
          }
          $target.append(view.itemTemplate({
            book: book.toJSON(),
            rcd: rcm.toJSON(),
            user: rcm.getUser().toJSON()
          }));
        });
      } else if (this.sub_menu === "lr") {
        $target.empty();
        recommendations = app.recommendations.models;
        if (this.query) {
          var item_ids = _.pluck(book_listing, "id");
          recommendations = _.filter(recommendations, function(rcm) {
            var item_id = rcm.get("item_id");
            return _.find(item_ids, function(x) { return x === item_id; });
          });
        }
        _.each(_.first(recommendations, this.item_count), function(rcm) {
          $target.append(view.itemTemplate({
            book: rcm.getBook().toJSON(),
            rcd: rcm.toJSON(),
            user: rcm.getUser().toJSON()
          }));
        });
      } else {
        // this must be most recommended
        var selected_books = _.first(_.sortBy(book_listing, function(book) {
              return book.getRecommendationCount();
            }), this.item_count);
        $target.empty();
        _.each(selected_books,function(book) {
          var rcm = book.latestRecommendation();
          if (!rcm) {
            // no recommendation found
            return;
          }
          $target.append(view.itemTemplate({
            book: book.toJSON(),
            rcd: rcm.toJSON(),
            user: rcm.getUser().toJSON()
          }));
        });
      }

      if ($target.children().length === 0) {
        $target.html('<div class="alert">' +
          '<strong>Empty Set</strong>. We are not able to find any matches.' +
          '</div>');
      }
    },

    select_menu: function(ev) {
      this.sub_menu = $(ev.currentTarget).data("menu-item");
      this.update_books();
      return false;
    },

    set_query: function(query) {
      if (query === this.query) return;  // do nothing
      this.query = query;
      this.update_books();
    },

    render: function () {
      $(this.el).html(this.template());
      this.update_books();
      return this;
    }


  });

  var BooksByView = TmplView.extend({
    template: _.template($('#tmpl-books-by').html()),

    extend_context: function() {
      var app = this.options.app;
      return {"recommendations": app.recommendations.where({
          "type": "book",
          "by": this.model.id
        }).map(function(item){
          return item.extendedJSON();
          })
      };
    }
  });

  var BookView = TmplView.extend({
     default_context: {"level": null},
     template: _.template($('#tmpl-book').html()),

    extend_context: function() {
      var app = this.options.app;
      return {"recommendations": app.recommendations.where({
          "type": "book",
          "item_id": this.model.id
        }).map(function(item){
          return item.extendedJSON();
          })
      };
    }
  });

  var SearchFormView = Backbone.View.extend({
    events: {
      "submit form": "submit_form"
    },

    set_query: function(query) {
      if (query) {
        query = query.split("+").join(" ");
      }
      $(this.el).find("input").val(query);
    },

    submit_form: function() {
      var search = $(this.el).find("input").val().split(" ").join("+");
      this.options.app.navigate("search/books/" + search , {trigger: true});
      return false;
    }
  });

  var MainNavView = Backbone.View.extend({
    template: _.template($('#tmpl-login-bar').html()),

    events : {
      "submit form": "login_submit",
      "click .toggle-edit": "toggleEdit",
      "click .prepare-pull-request": "triggerPullRequest"
    },

    initialize: function() {
      this.options.app.state.on("change", $.proxy(this.render_login_bar, this));
    },

    render_login_bar: function() {
      $(this.el).find("#login-bar").html(
          this.template({state: this.options.app.state.toJSON()}));
    },

    toggleEdit: function(){
      this.options.app.state.set("edit-mode", !this.options.app.state.get("edit-mode"));
      return false;
    },

    triggerPullRequest: function() {
      this.options.app.triggerPullRequest();
    },

    login_submit: function() {
      var me = this,
          username = $(this.el).find("#username").val(),
          github = new Github({
            username: username,
            password: $(this.el).find("#password").val(),
            auth: "basic"
          }),
          repo = github.getRepo(this.options.app.github_username, this.options.app.github_repo);

      repo.show(function(err, repo) {
        if (err && err.error) {
          $(me.el).find("#js-msg").html(err.request.statusText + " Please try again.");
          return;
        }
        me.options.app.state.set({
            "authenticated": true,
            "github": github,
            "username": username,
            "repo": repo,
            "edit_mode" : true
          });
        });
      return false;
    },

    select: function(to_select) {
      var me = this.$el;
      me.find("#main-nav li").removeClass("active");
      me.find("#" + to_select).addClass("active");
    }

  });


  var PulLRequestView = Backbone.View.extend({
    // expected to have the modal-div given

    events: {
      "click .send-pull-request": "_send_request"
    },

    template: _.template($('#tmpl-pull-request').html()),
    thanks_tmpl: _.template('<div class="modal-body"><div class="alert alert-success">'+
      '<p>Thanks for your submission. We will review your Pull ' +
      'Request as soon as we can. Until then you can follow the updates ' +
      '<a href="<%= html_url %>">here</a>.</p></div></div>'),
    error_tmpl: _.template('<div class="modal-body"><div class="alert alert-error">'+
      '<p>Sending the Pull-request failed: <strong><%= request.statusText %></strong>:</p>' +
      '<p><%= request.responseText %></p></div></div>'),

    initialize: function(){
      this.state = new Backbone.Model({
        cur_progress: 0, // in percent
        can_pr: false,
        "tmp-branch-name": "live-editor-patch-" + (new Date()).getTime(),
        cur_action: ""
      });
    },

    start: function() {
      var app = this.options.app,
          $el = $(this.el);

      $el.find(".close").hide();
      $el.find(".content-wrapper").html(this.template());
      this.render();
      this.state.on("change", $.proxy(this.render, this));
      this.state.on("change:cur_progress", function(model, val) {
        if (val === 80) {
          $el.find(".progress").removeClass("active").addClass("progress-success");
          $el.find(".btn").attr("disabled", null).removeClass("disabled");
        }
      });

      this._run();
    },

    _run: function(){
      // with the help of the awesome prose.io-project: https://github.com/prose/prose/blob/ac77888c4c0b63622172e17bbd0589024d9752c5/_includes/model.js
      var app = this.options.app,
          state = this.state,
          BRANCH = state.get("tmp-branch-name"),
          user = app.state.get("username"),
          github = app.state.get("github"),
          repo = github.getRepo(app.github_username, app.github_repo),
          forkedRepo = github.getRepo(user, app.github_repo),
          ref_dfr = $.Deferred(),
          books_dfr = $.Deferred(),
          profiles_dfr = $.Deferred(),
          written_dfr = $.Deferred(),
          pull_r_dfr = $.Deferred(),
          done_dfr = $.Deferred(),
          fork_dfr = $.Deferred();
      
      // wait for the fork to be created;
      function wait_for_fork() {
        _.delay(function() {
          forkedRepo.contents("", function(err, contents) {
            if(contents) {
              fork_dfr.resolve();
              return;
            }
            wait_for_fork();
          });
        }, 500);
      }

      // creating temporary branch
      fork_dfr.done(function() {
        state.set("cur_progress", 20);
        state.set("cur_action", "fork established");
        repo.getRef("heads/gh-pages", function(err, commitSha) {
          // Create temp branch
          state.set("cur_action", "creating temporary branch");
          var refSpec = { "ref": "refs/heads/" + BRANCH, "sha": commitSha };
          forkedRepo.createRef(refSpec, function() {
              state.set("cur_progress", 30);
              state.set("cur_action", "temporary branch established");
              ref_dfr.resolve();
            });
        });
      });

      // write files

      // Stupid enough this has to be done in order..
      function upload_collection(collection_name) {
        var collection = app[collection_name],
            write_def = $.Deferred();
        state.set("cur_action", "uploading " + collection_name);
        forkedRepo.write(BRANCH, collection.url,
          JSON.stringify(collection.toJSON(), null, '  '), "updating " + collection_name, function() {
            state.set("cur_action", collection_name + " uploaded.");
            write_def.resolve();
          });
        return write_def.promise();
      }

      ref_dfr.done(function() {
        state.set("cur_progress", 50);
        if (!app.books.dirty) return books_dfr.resolve(); // no changes here
        
        upload_collection("books").then($.proxy(books_dfr.resolve, books_dfr));
      });

      books_dfr.done(function() {
        state.set("cur_progress", 60);
        if (!app.profiles.dirty) return profiles_dfr.resolve(); // no changes here

        upload_collection("profiles").then($.proxy(profiles_dfr.resolve, profiles_dfr));
      });

      // always at last
      profiles_dfr.done(function() {
        state.set("cur_progress", 70);
        if (!app.recommendations.dirty) return written_dfr.resolve(); // no changes here

        upload_collection("recommendations").then(
            $.proxy(written_dfr.resolve, written_dfr));
      });

      written_dfr.done(function() {
        state.set("cur_action", "All ready. Awaiting your input...");
        state.set("cur_progress", 80);
      });

      state.set("cur_action", "Forking repository...");
      state.set("cur_progress", 10);
      repo.fork(wait_for_fork);
    },

    _send_request: function() {
      var $el = $(this.el),
          me = this;
          app = this.options.app,
          state = this.state,
          BRANCH = this.state.get("tmp-branch-name"),
          repo = app.state.get("github").getRepo(app.github_username, app.github_repo);

      $el.find("input, textarea, .btn").attr("disabled", "disabled");
      $el.find(".progress").addClass("active");

      state.set("cur_action", "Sending pull request");
      state.set("cur_progress", 90);
        
          
      repo.createPullRequest({
        title: $el.find("#title").val() || "Please merge my changes",
        body: $el.find("#desc").val() || "Automatically created via the online editor.",
        base: "gh-pages",
        head: app.state.get("username") + ":" + BRANCH
      }, function(err, repo_info) {
        if (err) {
          state.set("error", err);
        } else {
          state.set("repo_info", repo_info);
        }
        me.render();
      });
    },

    render: function() {
      var cur_progress = this.state.get("cur_progress"),
          repo_info = this.state.get("repo_info"),
          err = this.state.get("error"),
          $el = $(this.el);
      if (err) {
        console.log("error");
        $el.find(".content-wrapper").empty().html(this.error_tmpl(err));
        $el.find(".close").show();
      } else if (repo_info) {
        $el.find(".content-wrapper").empty().html(this.thanks_tmpl(repo_info));
        $el.find(".close").show();
      } else {
        $el.find("#message").html(this.state.get("cur_action"));
        $el.find(".bar").css({"width": cur_progress + "%" });
      }
    }
  });


  var AppState = Backbone.Model.extend({
    defaults: {
      authenticated: false,
      dirty: false,
      edit_mode: false
    }
  });


  var Router = Backbone.Router.extend({

    routes: {
        "": "home",
        // Books
        "books/by/:user": "books_by",
        "books/:book": "book",
        "search/books/:params": "books",
        "books/": "books"
    },

    el: $("body"),

    github_username: "ligthyear",
    github_repo: "recommender",

    _submit_editable: function(content){
      var splitted = content.name.split(".", 2),
          collection_name = splitted[0],
          item_key = splitted[1],
          collection  = this[collection_name],
          model = collection.get(content.pk);
      collection.dirty = true;
      model.set(item_key, content.value);
      this.state.set("dirty", true);
    },

    initialize: function() {
      var app = this;
      app.state = new AppState({});
      app.profiles = new Profiles();
      app.books = new Books();
      app.recommendations = new Recommendations();

      app.profiles.app = app.books.app = app.recommendations.app = app;

      app.main = $('#main');
      app.search = new SearchFormView({el: $('#search-form'), app: app});
      app.mainNavView = mainNavView = new MainNavView({el: $('#navbar'), app: app});

      mainNavView.render_login_bar();

      app.progress = 10;

      app.on("pageLoaded", function(target) {
        mainNavView.select(target);
        if (app.state.get("edit_mode")){
          $(app.el).find(".js-editable").editable({
            url: $.proxy(this._submit_editable, this)
          });
        }
      });
      window.onbeforeunload = function() {
        if (app.state.get("dirty")) {
          return "You have unpublished changes. Sure you want to leave the page without submitting them as a pull-request?";
        }
      };

    },

    triggerPullRequest: function() {
      var modal = this.show_modal("Preparing Pull Request", "Please wait"),
          view = new PulLRequestView({el: modal, app: this});
          view.start();
      return;
    },

    show_modal: function(title, content) {
      var $el = $(this.el).find("#generalModal");
      $el.find(".close").show();
      $el.find(".modal-header h3").html(title);
      $el.find(".content-wrapper").html(content);
      $el.modal('show');
      return $el;
    },

    _update_loading_progress: function(additional) {
      this.progress += additional;
      this.main.find("#progress-bar").css({"width": this.progress + "%"});
    },

    start: function() {
      var me = this;
      function next() {
        me._update_loading_progress(30);
      }
      return $.when(this.profiles.fetch().then(next),
            this.books.fetch().then(next),
            this.recommendations.fetch().then(next)
          ).then(function() {
            Backbone.history.start();
          });
    },

    books: function (params) {
      // Since the home view never changes, we instantiate it and render it only once
      if (!this.booksView) {
          this.booksView = new BooksView({app: this});
          this.booksView.render();
      } else {
          this.booksView.delegateEvents(); // delegate events when the view is recycled
      }
      this.search.set_query(params);
      this.booksView.set_query(_.isString(params)? params.toLowerCase(): params);
      this.main.html(this.booksView.el);
      this.trigger("pageLoaded", "books-menu");
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
      this.trigger("pageLoaded", "books-menu");
    },

    book: function (book) {
        // Since the home view never changes, we instantiate it and render it only once
        if (!this.bookView) {
            this.bookView = new BookView({app: this});
        } else {
            this.bookView.delegateEvents(); // delegate events when the view is recycled
        }
        this.bookView.model = this.books.get(book);
        this.bookView.render();
        this.main.html(this.bookView.el);
        this.trigger("pageLoaded", "books-menu");
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
        this.trigger("pageLoaded", "home-menu");
    }

  });

  
  var app = new Router();
  app.start();
  window.app = app;

});