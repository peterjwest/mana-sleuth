module.exports = function(mongoose, request, modelGenerator) {
  var connection = mongoose.createConnection('mongodb://localhost/gatherer');

  var schemas = {
    Page: new mongoose.Schema({
      url: {type: String, index: true, unique: true},
      html: String
    })
  };

  var models = modelGenerator(connection, schemas);

  return function(options, fn) {
    models.Page.sync({url: options.url}, function(err, page) {
      if (page.unsaved) {
        request(options, function(error, response, html) {
          page.url = options.url;
          page.html = html;
          page.save(function() {
            fn(error, response, html);
          });
        });
      }
      else fn(null, {}, page.html);
    });
  };
};
