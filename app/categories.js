const async = require('../util/async');
const util = require('../util/util');

module.exports = function(app) {
  const categories = {data: {}};
  categories.types = ['Colour', 'Type', 'Subtype', 'Expansion', 'Block', 'Format', 'Rarity', 'Legality'];

  // Get card category collections from the database cache
  categories.get = function() {
    return async.promise(function() {
      const next = this;
      app.models.Cache.findOne({name: 'categories'}, function(err, cache) {
        categories.types.map(function(category) {
          const model = app.models[category];
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
      const next = this;
      app.models.Cache.sync({name: 'categories'}, function(err, cache) {
        cache.set({name: 'categories', value: util.clone(categories.data)});
        cache.save(next.success);
      });
    });
  };

  // Puts all categories into hashes keyed by the given key
  categories.hash = function(keys) {
    const keys = {name: "name", gathererName: "gathererName", _id: "id"};
    for (const key in keys) {
      categories[keys[key]] = {};
      for (const category in categories.data) {
        categories[keys[key]][category] = util.hash(categories.data[category], util.key(key));
      }
    }
  };

  // Updates the categories from the scraper
  categories.update = function() {
    console.log("Updating categories");

    // Gets category names from the scraper
    return async.promise(function() {
      app.gatherer.scraper.getCategories(this.success);
    })

    // Iterates through different models and saves them
    .then(function(data) {
      async.map(categories.types, function(category) {
        const model = app.models[category];
        let categoryData = data[category].map(function(name) { return {name: name}; });
        categoryData = categories.applyCorrections(categoryData, category);
        categoryData.map(function(item) {
          item.gathererName = item.name;
        });

        // Save categories
        categories.data[model.collectionName] = [];
        async.map(categoryData, function(details) {
          const next = this;

          model.sync({gathererName: details.gathererName}, function(err, item) {
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
    const additions = app.corrections.additions[category];
    const removals = app.corrections.removals[category];
    const replacements = app.corrections.replacements[category];

    if (additions) data = additions.concat(data);
    if (removals) {
      const removalHash = util.hash(removals, util.key('name'));
      data = data.filter(function(item) { return !removalHash[item.name]; });
    }
    if (replacements) {
      data.map(function(item) {
        const replacement = replacements[item.name];
        if (replacement) {
          for (const name in replacement) item[name] = replacement[name];
        }
      });
    }

    return data;
  };

  return categories;
};
