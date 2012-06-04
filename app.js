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

var handleXhr = function(req, res, next) {
  delete req.query.xhr
  req.xhr = req.headers['x-requested-with'] == 'XMLHttpRequest';
  next();
};

server.get('/', handleXhr, function(req, res) {
  req.query.page = parseInt(req.query.page || 1);
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
  var parsedUrl = url.parse(pageUrl, true);
  parsedUrl.query = util.merge(parsedUrl.query, params || {});

  for (key in parsedUrl) {
    var value = parsedUrl[key];
    if (value === undefined || value === null || value === false) delete parsedUrl[key];
  };

  delete parsedUrl.search;
  return url.format(parsedUrl);
};