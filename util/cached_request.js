const request = require('request-promise');;
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

const cachedRequest = function(options) {
  return models.Page.findOne({url: options.url})
  .then((page) => {
    if (page) {
      return page.html;
    }
    return request(options).then((html) => {
      page = new models.Page();
      page.url = options.url;
      page.html = html;
      return page.save().then(() => html);
    });
  });
};

module.exports = cachedRequest;
