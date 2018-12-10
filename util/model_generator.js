const utils = require('../node_modules/mongoose/lib/utils.js');

module.exports = function(connection, schemas) {

  // Sync method for adding/updating models
  const sync = function(criteria, fn) {
    const model = this;
    model.findOne(criteria, function(err, item) {
      const unsaved = !item;
      if (unsaved) item = new model();
      item.unsaved = unsaved;
      if (fn) fn(err, item);
    });
  };

  // Define models
  const models = {};
  for (const i in schemas) {
    models[i] = connection.model(i, schemas[i]);
    models[i].sync = sync;
    models[i].collectionName = utils.toCollectionName(i);
  }

  return models;
};
