module.exports = function(scraper, corrections) {
  var categories = {data: {}, by: {}};
  categories.types = ['Colour', 'Type', 'Subtype', 'Expansion', 'Block', 'Format', 'Rarity'];

  // Get card category collections from the database cache
  categories.get = function() {
    return async.promise(function() {
      var next = this;
      models.Cache.findOne({name: 'categories'}, function(err, cache) {
        categories.types.map(function(category) {
          var model = models[category];
          categories.data[model.collectionName] = cache.value[model.collectionName];
        });
        categories.hash(["name", "_id"]);
        next.success();
      });
    });
  };

  // Caches categories into the database
  categories.cache = function() {
    console.log("Caching categories");
    return async.promise(function() {
      var next = this;
      models.Cache.sync({name: 'categories'}, function(err, cache) {
        cache.set({name: 'categories', value: util.clone(categories.data)});
        cache.save(next.success);
      });
    });
  };

  // Puts all categories into hashes keyed by the given key
  categories.hash = function(keys) {
    keys.map(function(key) {
      var hash = {};
      for (category in categories.data) {
        //console.log(categories.data[category]);
        categories.by[category] = util.hash(categories.data[category], function(item) { return item[key]; });
      }
    });
  };

  // Updates the categories from the scraper
  categories.update = function() {
    console.log("Updating categories");

    // Gets category names from the scraper
    return async.promise(function() {
      scraper.getCategories(router.categories(), this.success);
    })

    // Iterates through different models and saves them
    .then(function(data) {
      async.map(categories.types, function(category) {
        var model = models[category];

        var categoryData = data[category].map(function(name) { return {name: name}; });
        categoryData = categories.applyCorrections(categoryData);

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
      categories.hash(["name", "_id"]);
      categories.cache().then(this.success);
    })

    .then(function() {
      console.log("Updated "+settings.categories.length+ " categories");
      this.success();
    });
  };

  // Applies any neccessary corrections to a category
  categories.applyCorrections = function(data) {
    if (corrections.additions[category]) {
      data = corrections.additions[category].concat(data);
    }

    if (corrections.removals[category]) {
      var removals = util.hash(corrections.removals[category], util.key('name'));
      data = data.filter(function(item) { return !removals[item.name]; });
    }

    return data;
  };

  return categories;
};