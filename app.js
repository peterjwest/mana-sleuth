const express = require('express');
const less = require('connect-lesscss');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const config = require('./config');
const modelGenerator = require('./util/model_generator');

const connection = mongoose.createConnection(config.databases.app);
const server = express();
const app = {};
app.schemas = require('./app/schemas');
app.models = modelGenerator(connection, app.schemas);
app.router = require('./app/router');
app.corrections = require('./app/corrections');
app.categories = require('./app/categories')(app);
app.expansions = require('./app/expansions')(app);
app.cards = require('./app/cards')(app);
app.search = require('./app/search')(app);
app.pager = require('./app/pager');
app.gatherer = {
  router: require('./app/gatherer/router.js'),
  scraper: require('./app/gatherer/scraper.js'),
};

server.set('views', __dirname + '/views');
server.set('view engine', 'pug');
server.use(express.static(__dirname + '/public'));
server.use(bodyParser());
server.use("/css/styles.css", less("public/less/styles.less", {paths: ["public/less"]}));

const handleXhr = function(req, res, next) {
  delete req.query.xhr
  req.xhr = req.headers['x-requested-with'] == 'XMLHttpRequest';
  next();
};

server.get(/^\/?(.*)$/, handleXhr, app.router.decode, function(req, res) {
  req.query.page = req.query.page || 1;
  app.search.run(req.query).then(function(cards, total) {

    // Maps through cards, adding in references and sorting expansions
    if (cards) {
      var expansions = app.categories.id.Expansion;
      cards.map(function(card) {
        card.printings = card.printings.sort(function(a,b) {
          if (!a.expansion || !b.expansion) return 0;
          return expansions[b.expansion].released - expansions[a.expansion].released;
        });
        card.objects(app.categories.id);
      });
    }

    // Sorts formats by priority
    var formats = app.categories.data.Format.sort(function(a, b) { return b.priority - a.priority; });

    res.render('index', {
      layout: !req.xhr,
      title: config.title,
      subtitle: config.subtitle,
      pager: app.pager(20, total, req.query.page),
      cards: cards,
      formats: formats,
      categories: app.categories,
      app: app,
      request: req,
    });
  });
});

server.listen(3000);

// app.categories.update()
//   .then(app.expansions.populate)
//   .then(app.cards.update);
