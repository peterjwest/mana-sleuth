var config = require('./config.js');

// Vendor modules
var request = require('request');
var url = require('url');
var http = require('http');
var express = require('express');
var less = require('connect-lesscss');
var server = express.createServer();
var cheerio = require("cheerio");
var mongoose = require('mongoose');
var connection = mongoose.createConnection(config.databases.app);

// Util modules
var async = require('./util/async.js');
var scheduler = require('./util/scheduler.js');
var util = require('./util/util.js');
var modelGenerator = require('./util/model_generator.js');
var cachedRequest = require('./util/cached_request.js')(mongoose, request, modelGenerator, config.databases.cache);

// App modules
var app = {};
app.router = require('./app/router.js')(util);
app.schemas = require('./app/schemas.js')(mongoose);
app.models = modelGenerator(connection, app.schemas);
app.corrections = require('./app/corrections.js');
app.categories = require('./app/categories.js')(app, async, util);
app.expansions = require('./app/expansions.js')(app, async, util);
app.cards = require('./app/cards.js')(app, async, util);
app.search = require('./app/search.js')(app, async, util);
app.pager = require('./app/pager.js');
app.gatherer = require('./app/gatherer/gatherer.js')(cachedRequest, cheerio, util);

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

server.get(/^\/?(.*)$/, handleXhr, app.router.decode, function(req, res) {
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
      title: config.title,
      subtitle: config.subtitle,
      pager: app.pager(20, total, req.query.page),
      cards: cards,
      formats: formats,
      categories: app.categories,
      app: app,
      util: util,
      request: req,
    });
  });
});

server.listen(3000);

// app.categories.update()
//   .then(app.expansions.populate)
//   .then(app.cards.update);
