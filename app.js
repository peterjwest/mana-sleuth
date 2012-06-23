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
var cacheConnection = mongoose.createConnection('mongodb://localhost/gatherer');
var requestCache = require('./util/request_cache.js')(cacheConnection, request, modelGenerator);

// App modules
var app = {};
app.router = require('./app/router.js');
app.schemas = require('./app/schemas.js')(mongoose);
app.models = modelGenerator(connection, app.schemas);
app.scraper = require('./app/scraper.js')(requestCache, cheerio, util);
app.corrections = require('./app/corrections.js');
app.categories = require('./app/categories.js')(app, async, util);
app.expansions = require('./app/expansions.js')(app, async, util);
app.cards = require('./app/cards.js')(app, async, util);
app.search = require('./app/search.js')(app, async, util);
app.pager = require('./app/pager.js');


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
  req.route = {name: req.params[0] || ""};
  var params = (req.params[1] || "").split("/");
  var data = {};

  (routes[req.route.name] || []).map(function(arg, i) {
    if (params[i]) data[arg] = params[i];
  });

  req.route.data = util.merge(req.query, data);


  next();
};

var encodeUrl = function(route) {
  var url = '/'+route.name;
  (routes[route.route] || []).map(function(arg) {
    if (route.data[arg]) {
      url += '/'+route.data[arg];
      delete route.data[arg];
    }
  });

  var query = util.dehash(route.data, function(value, name) { return name+"="+util.cast("string", value).replace(/\s/g, "+"); }).join("&");
  if (query) url += "?" + query;

  return url;
};

util.url = function(route, params) {
  var data = util.merge(route.data, params);
  return encodeUrl(route, data);
};

var handleXhr = function(req, res, next) {
  delete req.query.xhr
  req.xhr = req.headers['x-requested-with'] == 'XMLHttpRequest';
  next();
};

server.get(/^(?:\/|\/(cards)\/?(.*))$/, decodeUrl, handleXhr, function(req, res) {
  req.query.page = req.query.page || 1;
  app.search.run(req.query).then(function(cards, total) {

    // Maps through cards, ading in references and sorting expansions
    if (cards) {
      var expansions = app.categories.id.expansions;
      cards.map(function(card) {
        card.printings = card.printings.sort(function(a,b) {
          return expansions[b.expansion].released - expansions[a.expansion].released;
        });
        card.objects(app.categories.id);
      });
    }

    // Sorts formats by priority
    var formats = app.categories.data.formats.sort(function(a, b) { return b.priority - a.priority; });

    res.render('index', {
      layout: !req.xhr,
      title: "Mana Sleuth",
      subtitle: "Streamlined MTG card search",
      pager: pager(20, total, req.query.page),
      cards: cards,
      formats: formats,
      categories: app.categories,
      router: app.router,
      util: util,
      request: req,
    });
  });
});

server.listen(3000);

app.categories.update()
  .then(app.expansions.populate)
  .then(app.cards.update);
