const request = require('request');
const mongoose = require('mongoose');

const modelGenerator = require('./model_generator.js');

const connection = mongoose.createConnection('mongodb://localhost/gatherer');

const schemas = {
  Page: new mongoose.Schema({
    url: {type: String, index: true, unique: true},
    html: String
  })
};

const models = modelGenerator(connection, schemas);

const requestCache =function(options, fn) {
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

requestCache.invalidate = function(url, fn) {
  models.Page.findOne({url: url}).remove(fn);
};

module.exports = requestCache;
