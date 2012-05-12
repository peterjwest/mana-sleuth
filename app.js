// Standard modules
var request = require('request');
var url = require('url');
var http = require('http');
var jquery = require("jquery");
// var jsdom = require('jsdom');
var cheerio = require("cheerio");
var mongoose = require('mongoose');

// Util modules
var async = require('./util/async.js');
var scheduler = require('./util/scheduler.js');
var util = require('./util/util.js');
var modelGenerator = require('./util/model_generator.js');

// App modules
var router = require('./router.js');
var scraper = require('./scraper.js')(request, cheerio, jquery, util);
var schemas = require('./schemas.js')(mongoose);
var models = modelGenerator(mongoose, schemas);

mongoose.connect('mongodb://localhost/mana_sleuth');

// App settings
var settings = {
  colours: {Green: 'G', Black: 'B', Blue: 'U', Red: 'R', White: 'W'},
  rarities: {L: 'Land', C: 'Common', U: 'Uncommon', R: 'Rare', M: 'Mythic Rare', P: 'Promo', S: 'Special'},
  categories: ['Type', 'Subtype', 'Expansion', 'Block', 'Format']
};

var fixtures = {
  cards: {
    "B.F.M. (Big Furry Monster)": {
      subtypes: ["The-Biggest-Baddest-Nastiest-Scariest-Creature-You'll-Ever-See"],
      rules: [
        "You must play both B.F.M. cards to put B.F.M. into play. "+
        "If either B.F.M. card leaves play, sacrifice the other.",
        "B.F.M. can be blocked only by three or more creatures."
      ],
      flavourText:
        "\"It was big. Really, really big. No, bigger than that. Even bigger. "+
        "Keep going. More. No, more. Look, we're talking krakens and dreadnoughts for jewelry. "+
        "It was big\"\n-Arna Kennerd, skyknight",
      multipart: {type: 'double'},
      printings: [
        {gathererId: 9780},
        {gathererId: 9844},
      ]
    },
    "Look at Me, I'm R&D": {
      printings: [{artist: 'spork;'}]
    },
    "Miss Demeanor": {
      subtypes: ["Lady-of-Proper-Etiquette"]
    },
    "Who/What/When/Where/Why": {
      name: "Who",
      types: ["Instant"],
      rules: ["Target player gains X life."],
      cmc: ["1"],
      colors: ["W"],
      cost: "{X}{W}"
    }
  },
  subtypes: [
    "The-Biggest-Baddest-Nastiest-Scariest-Creature-You'll-Ever-See",
    "Donkey",
    "Lord",
    "Igpay",
    "Townsfolk",
    "Chicken",
    "Egg",
    "Gamer",
    "Clamfolk",
    "Elves",
    "Hero",
    "Bureaucrat",
    "Goblins",
    "Mime",
    "Cow",
    "Child",
    "Lady-of-Proper-Etiquette",
    "Waiter",
    "Dinosaur",
    "Paratrooper",
    "Designer",
    "Ship",
    "Mummy"
  ],
  replaceTypes: {
    'Interrupt': {types: ['Instant']},
    'Summon Legend': {types: ['Legendary', 'Creature']},
    'Summon': {types: ['Creature']},
    'Enchant Creature': {types: ['Enchantment'], subtypes: ['Aura'], rules: ["Enchant Creature"]},
    'Enchant Player': {types: ['Enchantment'], subtypes: ['Aura'], rules: ["Enchant Player"]},
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

  // Loops through updating cards
  updateCards: function(count, success) {

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
        if (count == 0) return console.log("Finished");
        count--;
        memory = process.memoryUsage().rss;
        console.log("Memory: "+humanisedMemory(memory)+" MB ("+humanisedMemory(memory-lastMemory)+" MB change), "+count+" cards left");
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
      models.Card.lastUpdated()
        // .where('printings.expansion').nin([
        //     collections.expansions.Unglued,
        //     collections.expansions.Unhinged,
        // ])
        .run(function(err, card) { next.success(card) });
    })

    // Scrap card details
    .then(function(card) {
      console.log("Updating "+card.name);
      cards.push(card);
      scraper.getCardDetails(router.card(card.gathererId()), this.success);
    })

    // Substitute database references
    .then(function(data) {
      details = data;

      // Adjusting data to the database structure, applying fixtures
      details.cards.map(function(card) {

        // Applying fixtures
        var applyFixtures = function(item, fixtures) {
          for (i in fixtures) {
            if (typeof fixtures[i] == "Object" || typeof fixtures[i] == 'Array') {
              applyFixtures(item[i], fixtures[i]);
            }
            else item[i] = fixtures[i];
          }
        };

        if (fixtures.cards[card.name]) {
          applyFixtures(card, fixtures.cards[card.name]);
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
            scraper.getCardDetails(router.card(altCard.gathererId(), altCard.name), function(data) {
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

        // card.save(this.success);
        console.log(card);
      }).then(this.success);
    })

    .then(function() {
      // details = null;
      // cards = null;

      console.log("Updated");
      if (success) success();
    });
  }
};

// scheduler.every('2 days', 'findCards', app.findCards);

async.promise(function() {
//   app.updateCategories(this.success);
// }).then(function() {
  app.updateCards(4300);
});

// {
//   "printings.expansion": { $nin: [
//     ObjectId("4fa5ca4f3c02895c11000182"),
//     ObjectId("4fa5ca4f3c02895c11000181")
//   ] },
//   complete: false
// }