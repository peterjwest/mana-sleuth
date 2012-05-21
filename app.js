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

// App modules
var router = require('./router.js');
var scraper = require('./scraper.js')(request, cheerio, util);
var schemas = require('./schemas.js')(mongoose);
var models = modelGenerator(mongoose, schemas);
var fixtures = require('./fixtures.js');

mongoose.connect('mongodb://localhost/mana_sleuth');

// App settings
var settings = {
  categories: ['Colour', 'Type', 'Subtype', 'Expansion', 'Block', 'Format', 'Rarity']
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

        var data = values[category].map(function(name) { return {name: name}; });

        // Removes invalid categories
        if (fixtures.removals[category]) {
          var removals = util.hash(fixtures.removals[category], util.key('name'));
          data = data.filter(function(item) { return !removals[item.name]; });
        }

        // Adds additional categories
        if (fixtures.additions[category]) {
          data = fixtures.additions[category].concat(data);
        }

        // Save categories
        async.map(data, function(details) {
          var next = this;
          model.sync({name: details.name}, function(item) {
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

          details.colours = details.colours.map(function(colour) {
            return collections.colours[colour];
          }).filter(function(colour) { return colour; });

          details.printings = details.printings.map(function(printing) {
            if (fixtures.replacements.rarities[printing.rarity]) {
              printing.rarity = fixtures.replacements.rarities[printing.rarity].rarity;
            }
            printing.rarity = collections.rarities[printing.rarity];
            printing.expansion = expansion._id;
            return printing;
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

  // Loops through updating cards
  updateCards: function(success) {

    // Get required collections from the database
    app.getCollections(settings.categories)

    // Update cards
    .then(function(collections) {

      // Track memory
      var lastMemory = 0;
      var memory = process.memoryUsage().rss;
      var humanisedMemory = function(bytes) { return (bytes/1024)/1024; }

      console.log("Updating cards");
      var run = function() {
        memory = process.memoryUsage().rss;
        console.log("Memory: "+humanisedMemory(memory)+" MB ("+humanisedMemory(memory-lastMemory)+" MB change)");
        lastMemory = memory;
        process.memoryUsage().rss
        setTimeout(function() { app.updateCard(collections, run); }, 0);
      };
      run();
    });
  },

  // This uses the card details and printings pages to get the full details of a card
  updateCard: function(collections, success) {
    var cards = [];
    var details = {cards: []};

    // Get the card last updated
    async.promise(function() {
      var next = this;
      models.Card.lastUpdated().run(function(err, card) { next.success(card) });
    })

    // Scrap card details
    .then(function(card) {
      if (card) {
        console.log("Updating "+card.name);
        cards.push(card);
        var urls = {
          details: router.card(card.gathererId()),
          printings: router.printings(card.gathererId())
        };
        scraper.getCardDetails(urls, this.success);
      }
      else console.log("Finished");
    })

    // Apply fixtures and substitute database references
    .then(function(data) {
      details = data;

      details.cards.map(function(card) {

        // Applying replacements
        var applyReplacements = function(item, fixtures) {
          for (i in fixtures) {
            if (typeof fixtures[i] == "Object" || typeof fixtures[i] == 'Array') {
              if (typeof fixtures[i] == 'Array') item[i] = [];
              applyFixtures(item[i], fixtures[i]);
            }
            else item[i] = fixtures[i];
          }
        };

        // Applying type replacement fixtures
        var type = card.types.join(" ");
        if (fixtures.replacements.types[type] !== null) {
          applyReplacements(card, fixtures.replacements.types[type])
        }

        // Applying card replacement fixtures
        if (fixtures.replacements.cards[card.name]) {
          applyReplacements(card, fixtures.replacements.cards[card.name]);
        }

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

      this.success();
    })

    // Handle multipart cards
    .then(function() {
      var next = this;

      if (details.multipart) {
        async.promise(function() {
          var next = this;
          var altName = util.alternate(details.multipart.cards, cards[0].name);
          models.Card.findOne({name: altName}, function(err, card) { next.success(card); });
        })

        .then(function(card) {
          console.log("Updating "+card.name+" (multipart)");
          cards.push(card);

          var altCard = cards[0].name == details.cards[0].name ? cards[1] : cards[0];
          if (details.multipart.type == "split") {
            var urls = {
              details: router.card(card.gathererId(), altCard.name),
              printings: router.printings(card.gathererId())
            };
            scraper.getCardDetails(urls, function(data) {
              details.cards = details.cards.concat(data.cards);
              next.success();
            });
          }
          else next.success();
        });
      }
      else next.success();
    })

    // Save cards
    .then(function() {
      var cardDetails = util.hash(details.cards, function(card) { return card.name; });
      async.map(cards, function(card) {
        card.set(cardDetails[card.name]);

        //Set multipart details
        if (details.multipart) {
          card.set({multipart: {
            card: util.alternate(cards, card)._id,
            type: card.multipart.type || details.multipart.type
          }});
        }

        card.save(this.success);
      }).then(this.success);
    })

    .then(function() {
      console.log("Updated");
      if (success) success();
    });
  },

  searchCards: function(query) {
    return async.promise(function() {
      var findCards = this;
      var categories = ['Colour', 'Type', 'Subtype', 'Expansion', 'Format', 'Rarity'];

      app.getCollections(categories).then(function(collections) {
        var words = query.replace(/^\s+|\s+&/, "").split(/\s+/);
        var length, item;
        var match = false;
        var matches = [];

        while(words.length > 0) {
          match = false;

          for (length = words.length; length > 0; length--) {
            term = words.slice(0, length);
            for (category in collections) {
              for (j in collections[category]) {
                item = collections[category][j];
                if (term.join(" ").toLowerCase().replace(/[^a-z0-9]/g, "") == item.name.toLowerCase().replace(/[^a-z0-9]/g, "")) {
                  match = {type: category, obj: item};
                }
              }
            }
            if (match) break;
          }
          if (match) matches.push(match);
          else {
            matches.push({type: 'rules', term: words[0]});
            length = 1;
          }

          words = words.slice(length);
        }

        var mongoAttrs = {
          colours: 'colours',
          types: 'types',
          subtypes: 'subtypes',
          formats: 'legalities.format',
          expansions: 'printings.expansion',
          rarities: 'printings.rarity'
        };
        var criteria =  [];
        matches.map(function(match) {
          if (match.type == "rules") {
            var match = new RegExp("\\b"+util.regEscape(match.term)+"\\b", "i");
            criteria.push({$or: [{rules: match}, {name: match}]});
          }
          else {
            var obj = {};
            obj[mongoAttrs[match.type]] = match.obj._id;
            criteria.push(obj);
          }
        });

        models.Card.find({'$and': criteria}).limit(20).run(function(err, cards) {
          findCards.success(cards);
        });
      });
    });
  }
};

// async.promise(function() {
//  app.updateCategories(this.success);
// }).then(function() {
//   app.updateCards();
// });

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

server.listen(3000);

server.get('/', function(request, response) {
  response.render('index', {
    title: "Mana Sleuth",
    subtitle: "Streamlined MTG card search",
    cards: false,
    router: router
  });
});

server.post('/', function(request, response) {
  app.searchCards(request.param("query")).then(function(cards) {
    response.render('index', {
      title: "Mana Sleuth",
      subtitle: "Streamlined MTG card search",
      cards: cards,
      router: router
    });
  });
});