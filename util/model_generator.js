module.exports = function(connection, schemas) {
  // Find a document by criteria or create a new one
  const findOrCreate = function(criteria, fn) {
    const Model = this;
    return Model.findOne(criteria)
    .then((document) => {
      const unsaved = !document;
      if (unsaved) document = new Model();
      document.unsaved = unsaved;
      return document;
    });
  };

  // Define models
  const models = {};
  for (const name in schemas) {
    models[name] = connection.model(name, schemas[name], name);
    models[name].findOrCreate = findOrCreate;
    models[name].modelName = name;
  }

  return models;
};
