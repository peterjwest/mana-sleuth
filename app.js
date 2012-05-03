// Standard modules
var request = require('request');
var url = require('url');
var http = require('http');
var jquery = require("jquery");
var jsdom = require('jsdom');
var mongoose = require('mongoose');

// Util modules
var async = require('./util/async.js');
var scheduler = require('./util/scheduler.js');
var util = require('./util/util.js');
var modelGenerator = require('./util/model_generator.js');

// App modules
var router = require('./router.js');
var scraper = require('./scraper.js')(request, jsdom, jquery, util);
var schemas = require('./schemas.js')(mongoose);
var models = modelGenerator(mongoose, schemas);

mongoose.connect('mongodb://localhost/mana_sleuth');

// App settings
var settings = {
  colours: {Green: 'G', Black: 'B', Blue: 'U', Red: 'R', White: 'W'},
  rarities: {L: 'Land', C: 'Common', U: 'Uncommon', R: 'Rare', M: 'Mythic Rare', P: 'Promo', S: 'Special'},
  categories: ['Type', 'Subtype', 'Expansion', 'Block', 'Format'],
  fixtures: {
    cards: {
      '74360': {artist: 'spork;'}
    }
  }
};

// App functionality
var app = {

  // Get card category collections from the database
  getCollections: function(categories) {
    var collections = {};
    return async.map(categories, function(name) {
      var next = this;
      var model = models[name];
      model.find(function(err, data) {
        collections[model.collectionName] = util.hash(data, function(item) { return item.name; });
        next.success();
      });
    }).then(function() { this.success(collections); });
  },

  // This uses the advanced search page to get category names like expansion, block, format, rarity
  updateCategories: function(callback) {
    console.log("Updating categories");
    scraper.getCategories(router.categories(), function(values) {
      var expansions = [];

      // Iterates through different models and saves them
      async.map(settings.categories, function(category) {
        async.map(values[category], function(name) {
          var next = this;
          var details = {name: name};
          models[category].sync(details, function(item) {
            if (category == "Expansion" && !item.populated) expansions.push(item);
            item.set(details);
            item.save(next.success);
          });
        }).then(this.success);
      })

      // Iterates through new expansions and populates cards for them
      .then(function() {
        console.log("Updated "+settings.categories.length+ " categories");
        async.map(expansions, function(expansion) {
          app.populateExpansion(expansion, this.success);
        }).then(function() { if(callback) callback(); });
      });
    });
  },

  // This uses the card search list view page to get basic details of cards in an expansion
  populateExpansion: function(expansion, callback) {
    console.log("Finding cards for "+expansion.name);
    scraper.getExpansionCards(router.cards(expansion.name), function(cards) {
      async.map(cards, function(details) {
        var next = this;
        models.Card.sync({name: details.name}, function(card) {
          details.printings = card.printings.concat(details.printings);
          card.set(details);
          card.save(next.success);
        });
      })
      .then(function() {
        console.log("Found "+cards.length+" cards");
        expansion.populated = true;
        expansion.save(function() {
          if (callback) callback();
        });
      });
    });
  },

  // This uses the card details and printings pages to get the full details of a card
  updateCards: function(callback) {
    console.log("Updating cards");

    // Get required collections from the database
    var collections = {};
    app.getCollections(settings.categories).then(function(data) {
      collections = data;
      this.success();
    })

    // Get the cards which need updating
    .then(function() {
      models.Card.lastUpdated(100, this.success);
    })

    // Update each card
    .map(function(card) {
      var next = this;
      scraper.getCardDetails(router.card(card.gathererId()), function(details) {
        console.log("Updating "+card.name);
        console.log(details);

        //Form array of all cards, then map through and save...
        //How to save multipart refs?
        return next.success();

        card.set(details);
        card.save(next.success);
      });
    })
    .then(function() {
      if (callback) callback();
    });
  }
};

// scheduler.every('2 days', 'findCards', app.findCards);

async.promise(function() {
  app.updateCategories(this.success);
}).then(function() {
  app.updateCards();
  //scheduler.every('30 minutes', 'updateCards', app.updateCards);
});