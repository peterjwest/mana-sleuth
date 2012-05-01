var request = require('request');
var url = require('url');
var http = require('http');
var jquery = require("jquery");
var jsdom = require('jsdom');
var async = require('./async.js');
var scheduler = require('./scheduler.js');
var util = require('./util.js');
var mongoose = require('mongoose');
var schemas = require('./schemas.js')(mongoose);
var models = require('./models.js')(mongoose, schemas);

mongoose.connect('mongodb://localhost/mana_sleuth');

// Gatherer routing
var gatherer = {
  domain: 'http://gatherer.wizards.com',
  paths: {
    advanced: '/Pages/Advanced.aspx?',
    cards: '/Pages/Search/Default.aspx?',
    details: '/Pages/Card/Details.aspx?',
    original: '/Pages/Card/Details.aspx?printed=true&',
    printings: '/Pages/Card/Printings.aspx?',
    image: '/Handlers/Image.ashx?'
  },
  cards: function(expansion) {
    var params = 'output=checklist&set=|['+encodeURIComponent('"'+expansion+'"')+']';
    return this.domain+this.paths.cards+params;
  },
  card: function(type, id, query) {
    if (!this.paths[type]) throw "Cannot find card resource type";
    var imageType = (type == 'image' ? '&type=card' : '');
    var queryString = 'multiverseid='+id+imageType+(query ? '&'+query : '');
    return this.domain+this.paths[type]+queryString;
  },
  categories: function() {
    return this.domain+this.paths.advanced;
  }
};

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

// Gets the response of page and gives it to the callback function
var requestPage = function(uri, success) {
  var tries = 0;
  var threshold = 3;
  var attempt = function() {
    tries++;
    request({uri: uri}, function (error, response, html) {
      if (html) {
        jsdom.env(html, function (err, window) {
          success(jquery.create(window));
        });
      }
      else if (tries < threshold) attempt();
    });
  };
  attempt();
};

var scraper = {
  getCategories: function(success) {
    requestPage(gatherer.categories(), function($) {
      var conditions = $(".advancedSearchTable tr");

      var find = function(search, negativeSearch) {
        var match = conditions.filter(function() {
          var text = $(this).find(".label2").text();
          return text.match(search) && (!negativeSearch || !text.match(negativeSearch));
        }).first();

        return match.find(".dynamicAutoComplete a").map(function() {
          return $(this).text().replace(/^\s+|\s+$/g, "");
        }).toArray();
      };

      success({
        Expansion: find(/set|expansion/i),
        Format: find(/format/i),
        Block: find(/block/i),
        Type: find(/type/i, /subtype/i),
        Subtype: find(/subtype/i),
        Rarity: find(/rarity/i)
      });
    });
  },

  getExpansionCards: function(expansion, success) {
    requestPage(gatherer.cards(expansion.name), function($) {
      var cards = {};
      $(".cardItem").each(function() {
        var $card = $(this);
        var name = $card.find(".name").text();
        var card = cards[name] || {printings: []};
        cards[name] = card;

        card.lastUpdated = new Date();
        card.name = name;
        card.colours = $card.find(".color").text().split("/")
          .map(function(c) { return settings.colours[c]; })
          .filter(function(c) { return c; });


        card.printings.push({
          gathererId: $card.find(".nameLink").attr("href").match(/multiverseid=(\d+)/i)[1],
          artist: $card.find(".artist").text(),
          expansion: expansion._id,
          rarity: settings.rarities[$card.find(".rarity").text()]
        });
      });
      success(util.values(cards));
    });
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
    scraper.getCategories(function(values) {
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
    scraper.getExpansionCards(expansion, function(cards) {
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
      var details = {};

      // Gets card details page
      async.promise(function() {
        requestPage(gatherer.card('details', card.gathererId()), this.success);
      })

      // Scrapes the details
      .then(function($) {
        var next = this;
        var rows = $(".cardDetails .rightCol .row");

        $.fn.textifyImages = function() {
          this.find("img").each(function() {
            $(this).replaceWith($("<span>").text("{"+$(this).attr("alt")+"}"));
          });
          return this;
        };

        var text = function(elem) {
          return elem.text().replace(/^\s+|\s+$/g, "");
        };

        var find = function(rows, search, negativeSearch) {
          return rows.filter(function() {
            var text = $(this).find(".label").text();
            return text.match(search) && (!negativeSearch || !text.match(negativeSearch));
          }).first().find(".value").textifyImages();
        };

        var strength = util.zip(text(find(rows, /P\/T/i)).split(/\s*\/\s*/), ["power", "toughness"]);

        details = {
          lastUpdated: new Date(),
          cost: text(find(rows, /mana cost/i, /converted mana cost/i)),
          cmc: parseInt(text(find(rows, /converted mana cost/i))) || 0,
          rules: find(rows, /text|rules/i).children().map(function() { return text($(this)); }).toArray(),
          power: strength.power || '',
          toughness: strength.toughness || '',
          flavourText: text(find(rows, /flavor text/i)),
          watermark: text(find(rows, /watermark/i)),
          complete: true
        };

        // Detect split cards
        var name = $(".contentTitle").text().replace(/^\s+|\s+$/g, "");
        if (name.match(/\/\//)) {
          details.multipart = new models.Multipart();
          details.multipart.type = "split";
          var names = name.split(/\s+\/\/\s+/);
          // TODO: the rest
        }

        // Gets reference fields from the database (types, subtypes)
        var categories = util.zip(text(find(rows, /types/i)).split(/\s+—\s+/), ["types", "subtypes"]);

        details.types = (categories.types || "").split(/\s+/).map(function(type) {
          return collections.types[type];
        }).filter(function(type) { return type; });

        details.subtypes = (categories.subtypes || "").split(/\s+/).map(function(subtype) {
          return collections.subtypes[subtype];
        }).filter(function(subtype) { return subtype; });

        next.success();
      })

      // Gets printings page
      .then(function() {
        requestPage(gatherer.card('printings', card.gathererId()), this.success);
      })

      // Scrapes printings
      .then(function($) {
        var formats = $(".cardList:last");
        var formatFields = {};
        details.legalities = [];

        formats.find("tr.headerRow td").each(function() {
          var field = $(this).text().replace(/^\s+|\s+$/g, "")
          formatFields[field] = $(this).prevAll().length;
        });

        formats.find("tr.cardItem").each(function() {
          var row = $(this);
          var find = function(col) {
            return row.children("td").eq(formatFields[col])
          };
          var values = {
            format: find("Format").text().replace(/^\s+|\s+$/g, ""),
            legality: find("Legality").text().replace(/^\s+|\s+$/g, "")
          };
          var legality = new models.Legality();
          legality.set({
            format: collections.formats[values.format],
            legality: values.legality
          });
          details.legalities.push(legality);
        });

        console.log("Updating "+card.name);
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