module.exports = function(mongoose, schemas) {
  var utils = require('../node_modules/mongoose/lib/utils.js');

  // Sync method for adding/updating models
  var sync = function(criteria, fn) {
    var model = this;
    model.findOne(criteria, function(err, item) {
      var unsaved = !item;
      if (unsaved) item = new model();
      item.unsaved = unsaved;
      if (fn) fn(err, item);
    });
  };

  // Define models
  var models = {};
  for (i in schemas) {
    models[i] = mongoose.model(i, schemas[i]);
    models[i].sync = sync;
    models[i].collectionName = utils.toCollectionName(i);
  }

  return models;
};