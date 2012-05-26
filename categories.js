module.exports = function(app, async, util) {
  var categories = {data: {}, name: {}, id: {}};
  categories.types = ['Colour', 'Type', 'Subtype', 'Expansion', 'Block', 'Format', 'Rarity'];

  // Get card category collections from the database cache
  categories.get = function() {
    return async.promise(function() {
      var next = this;
      app.models.Cache.findOne({name: 'categories'}, function(err, cache) {
        categories.types.map(function(category) {
          var model = app.models[category];
          categories.data[model.collectionName] = cache.value[model.collectionName];
        });
        categories.hash();
        next.success();
      });
    });
  };

  // Caches categories into a single database entry
  categories.cache = function() {
    console.log("Caching categories");
    return async.promise(function() {
      var next = this;
      app.models.Cache.sync({name: 'categories'}, function(err, cache) {
        cache.set({name: 'categories', value: util.clone(categories.data)});
        cache.save(next.success);
      });
    });
  };

  // Puts all categories into hashes keyed by the given key
  categories.hash = function(keys) {
    var keys = {name: "name", _id: "id"};
    for (key in keys) {
      for (category in categories.data) {
        categories[keys[key]][category] = util.hash(categories.data[category], util.key(key));
      }
    }
  };

  // Updates the categories from the scraper
  categories.update = function() {
    console.log("Updating categories");

    // Gets category names from the scraper
    return async.promise(function() {
      app.scraper.getCategories(app.router.categories(), this.success);
    })

    // Iterates through different models and saves them
    .then(function(data) {
      async.map(categories.types, function(category) {
        var model = app.models[category];
        var categoryData = data[category].map(function(name) { return {name: name}; });
        categoryData = categories.applyCorrections(categoryData, category);

        // Save categories
        categories.data[model.collectionName] = [];
        async.map(categoryData, function(details) {
          var next = this;

          model.sync({name: details.name}, function(err, item) {
            categories.data[model.collectionName].push(item);
            item.set(details);
            item.save(next.success);
          });
        }).then(this.success);

      }).then(this.success);
    })

    // Hash and cache the categories
    .then(function() {
      categories.hash();
      categories.cache().then(this.success);
    })

    .then(function() {
      console.log("Updated "+categories.types.length+ " categories");
      this.success();
    });
  };

  // Applies any neccessary corrections to a category
  categories.applyCorrections = function(data, category) {
    var additions = app.corrections.additions[category];
    var removals = app.corrections.removals[category];

    if (additions) data = additions.concat(data);
    if (removals) {
      var removals = util.hash(removals, util.key('name'));
      data = data.filter(function(item) { return !removals[item.name]; });
    }

    return data;
  };

  return categories;
};