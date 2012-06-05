// Standard modules
var request = require('request');
var url = require('url');
var http = require('http');
var cheerio = require("cheerio");
var mongoose = require('mongoose');

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
app.scraper = require('./scraper.js')(request, cheerio, util);
app.schemas = require('./schemas.js')(mongoose);
app.models = modelGenerator(mongoose, app.schemas);
app.corrections = require('./corrections.js');
app.categories = require('./categories.js')(app, async, util);
app.expansions = require('./expansions.js')(app, async, util);
app.cards = require('./cards.js')(app, async, util);

mongoose.connect('mongodb://localhost/mana_sleuth');
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
  var route = routes[req.params[0]] || [];
  var params = (req.params[1] || "").split("/");
  var data = {};

  route.map(function(param, i) {
    data[param] = params[i];
  });

  req.query = util.merge(data, req.query);
  next();
};

var encodeUrl = function() {
  var keys = util.keys(req.query).sort();
  var url = '';
  keys.map(function() {

  });
};

var handleXhr = function(req, res, next) {
  delete req.query.xhr
  req.xhr = req.headers['x-requested-with'] == 'XMLHttpRequest';
  next();
};

server.get(/^(?:\/|\/(cards)\/?(.*))$/, decodeUrl, handleXhr, function(req, res) {
  req.query.page = req.query.page || 1;
  app.cards.search(req.query).then(function(cards, total) {
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

// app.categories.update()
//   .then(app.expansions.populate)
//   .then(app.cards.update);

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