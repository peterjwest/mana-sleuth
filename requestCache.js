module.exports = function(app, request) {
  return function(options, fn) {
    app.models.GathererPage.sync({url: options.url}, function(err, page) {
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
