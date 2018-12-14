const Bluebird = require('bluebird');
const { keyBy, clone } = require('lodash');

module.exports = function(app) {
  const categories = {data: {}};
  categories.types = ['Colour', 'Type', 'Subtype', 'Expansion', 'Block', 'Format', 'Rarity', 'Legality'];

  // Get card category collections from the database cache
  categories.get = function() {
    return (
      app.models.Cache.findOne({name: 'categories'})
      .then((cache) => {
        categories.types.map((categoryType) => {
          const Model = app.models[categoryType];
          categories.data[Model.modelName] = cache.value[Model.modelName];
        });
        categories.hash();
      })
    );
  };

  // Caches categories into a single database entry
  categories.cache = function() {
    console.log("Caching categories");
    return app.models.Cache.findOrCreate({name: 'categories'})
    .then((cache) => {
      cache.set({name: 'categories', value: clone(categories.data)});
      return cache.save();
    });
  };

  // Puts all categories into hashes keyed by the given key
  categories.hash = function() {
    const keys = {name: "name", gathererName: "gathererName", _id: "id"};
    for (const key in keys) {
      categories[keys[key]] = {};
      for (const category in categories.data) {
        categories[keys[key]][category] = keyBy(categories.data[category], key);
      }
    }
  };

  // Updates the categories from the scraper
  categories.update = function() {
    console.log("Updating categories");

    return app.gatherer.scraper.getCategories()

    // Iterates through different models and saves them
    .then(function(data) {
      return Bluebird.mapSeries(categories.types, (category) => {
        const Model = app.models[category];
        let categoryData = data[category].map((name) => ({ name: name }));
        categoryData = categories.applyCorrections(categoryData, category);
        categoryData.map((item) => item.gathererName = item.name);

        // Save categories
        categories.data[Model.modelName] = [];
        return Bluebird.mapSeries(categoryData, (details) => {
          return (
            Model.findOrCreate({ gathererName: details.gathererName })
            .then((item) => {
              categories.data[Model.modelName].push(item);
              item.set(details);
              return item.save();
            })
          );
        });
      });
    })

    // Hash and cache the categories
    .then(() => {
      categories.hash();
      return categories.cache();
    })

    .then(() => void console.log("Updated "+categories.types.length+ " categories"));
  };

  // Applies any neccessary corrections to a category
  categories.applyCorrections = function(data, category) {
    const additions = app.corrections.additions[category];
    const removals = app.corrections.removals[category];
    const replacements = app.corrections.replacements[category];

    if (additions) data = additions.concat(data);
    if (removals) {
      const removalHash = keyBy(removals, 'name');
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
