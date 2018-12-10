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
  for (const name in schemas) {
    models[name] = connection.model(name, schemas[name], name);
    models[name].sync = sync;
    models[name].modelName = name;
  }

  return models;
};
