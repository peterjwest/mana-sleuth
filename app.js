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
    return async.map(categories, function(category) {
      var next = this;
      var model = models[category];
      model.find(function(err, data) {
        collections[model.collectionName] = util.hash(data, function(item) { return item.name; });
        next.success();
      });
    }).then(function() { this.success(collections); });
  },

  // This uses the advanced search page to get category names like expansion, block, format, rarity
  updateCategories: function(success) {
    console.log("Updating categories");
    scraper.getCategories(router.categories(), function(values) {
      var collections = {};

      // Iterates through different models and saves them
      async.map(settings.categories, function(category) {
        var model = models[category];
        collections[model.collectionName] = {};

        async.map(values[category], function(name) {
          var next = this;
          var details = {name: name};

          model.sync(details, function(item) {
            collections[model.collectionName][item.name] = item;
            item.set(details);
            item.save(next.success);
          });
        }).then(this.success);
      })

      // Iterates through new expansions and populates cards for them
      .then(function() {
        console.log("Updated "+settings.categories.length+ " categories");

        var unpopulated = util.values(collections.expansions)
          .filter(function(e) { return !e.populated; });

        async.map(unpopulated, function(expansion) {
          app.populateCardsByExpansion(expansion, collections, this.success);
        }).then(function() { if(success) success(); });
      });
    });
  },

  // This uses the card search list view page to get basic details of cards in an expansion
  populateCardsByExpansion: function(expansion, collections, success) {
    console.log("Finding cards for "+expansion.name);
    scraper.getExpansionCards(router.cards(expansion.name), function(cards) {
      async.map(cards, function(details) {
        var next = this;
        models.Card.sync({name: details.name}, function(card) {

          details.colours = details.colours
            .map(function(c) { return settings.colours[c]; })
            .filter(function(c) { return c; });

          details.printings = details.printings.map(function(p) {
            p.expansion = expansion._id;
            p.rarity = settings.rarities[p.rarity];
            return p;
          });

          details.printings = card.printings.concat(details.printings);

          card.set(details);
          card.save(next.success);
        });
      })
      .then(function() {
        console.log("Found "+cards.length+" cards");
        expansion.populated = true;
        expansion.save(function() {
          if (success) success();
        });
      });
    });
  },

  // This uses the card details and printings pages to get the full details of a card
  updateCards: function(success) {
    console.log("Updating cards");
    var collections = {};
    var cards = {};

    // Get required collections from the database
    app.getCollections(settings.categories).then(function(data) {
      collections = data;
      this.success();
    })

    // Get the cards which need updating
    .then(function() {
      models.Card.lastUpdated(100, this.success);
    })

    // Create hash of cards (needed for updating multipart cards)
    .then(function(data) {
      cards = util.hash(data, function(card) { return card.name });
      this.success(data);
    })

    // Update each card
    .map(function(card) {
      var next = this;
      scraper.getCardDetails(router.card(card.gathererId()), function(details) {
        console.log("Updating "+card.name);

        details.cards.map(function(card) {
          card.types = card.types.map(function(type) {
            return collections.types[type];
          }).filter(function(type) { return type; });

          card.subtypes = card.subtypes.map(function(subtype) {
            return collections.subtypes[subtype];
          }).filter(function(subtype) { return subtype; });

          card.legalities.map(function(legality) {
            legality.format = collections.formats[legality.format];
          });
        });

        console.log(details);
        if (details.multipart && details.multipart.type == "split") {
          var alt = util.alternate(details.multipart.cards, card.name);
          models.Card.findOne({name: alt}, function(err, card) {
            if (card) {
              console.log(card);
            }
          });
        };

        // Form array of all cards, then map through and save...
        // How to save multipart refs?
        return next.success();

        card.set(details);
        card.save(next.success);
      });
    })
    .then(function() {
      if (success) success();
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