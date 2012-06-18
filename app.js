// Standard modules
var request = require('request');
var url = require('url');
var http = require('http');
var cheerio = require("cheerio");
var mongoose = require('mongoose');
var connection = mongoose.createConnection('mongodb://localhost/mana_sleuth');

// Util modules
var async = require('./util/async.js');
var scheduler = require('./util/scheduler.js');
var util = require('./util/util.js');
var modelGenerator = require('./util/model_generator.js');
var memoryTracker = require('./util/memory_tracker.js');
var pager = require('./pager.js');

// App modules
var app = {};
app.router = require('./router.js');
app.schemas = require('./schemas.js')(mongoose);
app.models = modelGenerator(connection, app.schemas);
var requestCache = require('./requestCache.js')(mongoose, request, modelGenerator);
app.scraper = require('./scraper.js')(requestCache, cheerio, util);
app.corrections = require('./corrections.js');
app.categories = require('./categories.js')(app, async, util);
app.expansions = require('./expansions.js')(app, async, util);
app.cards = require('./cards.js')(app, async, util);

memoryTracker.update();

var express = require('express');
var less = require('connect-lesscss');
var server = express.createServer();

server.configure(function() {
  server.set('views', __dirname + '/views');
  server.set('view engine', 'jade');
  server.use(express.static(__dirname + '/public'));
  server.use(express.bodyParser());
  server.use("/css/styles.css", less("public/less/styles.less", {paths: ["public/less"]}));
});

server.configure('development', function() {
  server.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

var routes = {
  cards: ['query', 'page']
};

var decodeUrl = function(req, res, next) {
  req.route = req.params[0];
  var paramNames = routes[req.route] || [];
  var params = (req.params[1] || "").split("/");
  var data = {};

  paramNames.map(function(param, i) {
    data[param] = params[i];
  });

  req.query = util.merge(data, req.query);
  next();
};

var encodeUrl = function(req, res) {
  var paramNames = routes[req.route] || [];
  var url = '/'+req.route;
  paramNames.map(function(param) {
    if (req.query[param]) url += '/'+req.query[param];
  });
  return url;
};

var handleXhr = function(req, res, next) {
  delete req.query.xhr
  req.xhr = req.headers['x-requested-with'] == 'XMLHttpRequest';
  next();
};

server.get(/^(?:\/|\/(cards)\/?(.*))$/, decodeUrl, handleXhr, function(req, res) {
  console.log(req.route, req.query);
  console.log(encodeUrl(req, res));
  req.query.page = req.query.page || 1;
  app.cards.search(req.query).then(function(cards, total) {

    if (cards) {
      cards.map(function(card) {
        card.objects(app.categories.id);
      });
    }

    res.render('index', {
      layout: !req.xhr,
      title: "Mana Sleuth",
      subtitle: "Streamlined MTG card search",
      pager: pager(20, total, req.query.page),
      cards: cards,
      categories: app.categories,
      router: app.router,
      util: util,
      request: req
    });
  });
});

server.listen(3000);

app.categories.update()
  .then(app.expansions.populate)
  .then(app.cards.update);

util.url = function(pageUrl, params) {
  var urlData = url.parse(pageUrl, true);
  var query = urlData.query;
  query = util.merge(query, params || {});

  // Prevents the previous URL being used
  delete urlData.search;

  delete query.xhr;

  for (key in query) {
    var value = query[key];
    if (value === undefined || value === null || value === false) delete query[key];
    else query[key] = (query[key] + "").replace(" ", "+");
  };

  return url.format(urlData);
};
