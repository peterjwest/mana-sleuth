module.exports = function(mongoose, schemas) {
  var utils = require('../node_modules/mongoose/lib/utils.js');

  // Sync method for adding/updating models
  var sync = function(criteria, success) {
    var Model = this;
    Model.findOne(criteria, function(err, item) {
      var unsaved = !item;
      if (unsaved) item = new Model();
      item.unsaved = unsaved;
      if (success) success(item);
    });
  };

  // Define models
  var models = {};
  for (i in schemas) {
    models[i] = mongoose.model(i, schemas[i]);
    models[i].sync = sync;
    models[i].collectionName = utils.toCollectionName(i);
  }

  // Method to find cards which need updating
  if (models.Card) {
    models.Card.lastUpdated = function(fn) {
      var query = this.findOne({complete: false}).asc('lastUpdated');
      return fn ? query.run(fn) : query;
    };
  }

  return models;
};