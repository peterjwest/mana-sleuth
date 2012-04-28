var request = require('request');
var url = require('url');
var http = require('http');
var jquery = require("jquery");
var jsdom = require('jsdom');
var mongoose = require('mongoose');
var async = require('./async.js');
var scheduler = require('./scheduler.js');
var schemas = require('./schemas.js');

mongoose.connect('mongodb://localhost/mana_sleuth');

// Sync method for adding/updating models
var sync = function(criteria, success) {
  var Model = this;
  Model.findOne(criteria, function(err, item) {
    var unsaved = !item;
    if (unsaved) item = new Model();
    item.unsaved = unsaved;
    if (success) success(item);
  });
};

// Define models
var models = {};
for (i in schemas) {
  models[i] = mongoose.model(i, schemas[i]);
  models[i].sync = sync;
  models[i].collectionName = mongoose.utils.toCollectionName(i);
}

// Method to find cards which need updating
models.Card.lastUpdated = function(number, fn) {
  var Card = this;
  Card.find({complete: false}).asc('lastUpdated').limit(number).find(function(err, cards) {
    fn(cards);
  });
};

// Util
var util = {
  values: function(obj) {
    var key, array = [];
    for (key in obj) {
      array.push(obj[key]);
    }
    return array;
  },
  hash: function(array, fn) {
    var obj = {};
    array.map(function(item, key) { obj[fn(item, key)] = item; });
    return obj;
  },
  zip: function(array, keys) {
    var obj = {};
    array.map(function(item, key) { obj[keys[key]] = item; });
    return obj;
  },
  pluck: function(array, key) {
    var values = [];
    array.map(function(item) { values.push(item[key]); });
    return values;
  },
  quote: function(str) {
    return '"'+str+'"';
  }
};

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
    var params = 'output=checklist&set=|['+encodeURIComponent(util.quote(expansion))+']';
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

// Errors in the gatherer database
var fixtures = {
  cards: {
    '74360': {artist: 'spork;'}
  }
}

// Colours of magic
var colours = {Green: 'G', Black: 'B', Blue: 'U', Red: 'R', White: 'W'};

var toArray = function(obj) {
  var i, array = [];
  for (i = 0; i < obj.length; i++) array.push(obj[i]);
  return array;
}

// Gets a random number between a min and max
var between = function(min, max) { return Math.random()*(max - min) + min };

// Runs a callback after a set amount of time
var after = function(time, fn) { setTimeout(fn, time); };

// Gets the response of page and gives it to the callback function
var requestPage = function(uri, fn) {
  request({uri: uri}, function (error, response, body) {
    jsdom.env(body, function (err, window) {
      fn(jquery.create(window));
    });
  });
};

// App functionality
var app = {
  // This uses the advanced search page to get category names like expansion, block, format, rarity
  updateCategories: function(callback) {
    console.log("Updating categories");
    requestPage(gatherer.categories(), function($) {
      var find = function(items, search, negativeSearch) {
        var match = items.filter(function() {
          var text = $(this).find(".label2").text();
          return text.match(search) && (!negativeSearch || !text.match(negativeSearch));
        }).first();

        return match.find(".dynamicAutoComplete a").map(function() {
          return $(this).text().replace(/^\s+|\s+$/g, "");
        }).toArray();
      };

      var conditions = $(".advancedSearchTable tr");

      //Can't use this method/page to get artist, since artists are pulled in with AJAX
      var categories = ["Expansion", "Format", "Block", "Type", "Subtype", "Rarity"];
      var values = {
        Expansion: find(conditions, /set|expansion/i),
        Format: find(conditions, /format/i),
        Block: find(conditions, /block/i),
        Type: find(conditions, /type/i, /subtype/i),
        Subtype: find(conditions, /subtype/i),
        Rarity: find(conditions, /rarity/i)
      };

      var expansions = [];

      // Iterates through different models and saves them
      async.map(categories, function(category) {
        async.map(values[category], function(name) {
          var next = this;
          var details = {name: name};
          models[category].sync(details, function(item) {
            if (category == "Expansion" && !item.populated) expansions.push(item);
            item.set(details);
            item.save(next.success());
          });
        }).then(this.success);

      // Iterates through new expansions and populates cards for them
      }).then(function() {
        console.log("Updated "+categories.length+ " categories");
        async.map(expansions, function(expansion) {
          app.populateExpansion(expansion, this.success);
        }).then(function() { if(callback) callback(); });
      });
    });
  },

  // This uses the card search list view page to get basic details of cards in an expansion
  populateExpansion: function(expansion, callback) {
    console.log("Finding cards for "+expansion.name);
    requestPage(gatherer.cards(expansion.name), function($) {
      var cards = {};
      $(".cardItem").each(function() {
        var $card = $(this);
        var card = {
          lastUpdated: new Date(),
          gathererId: $card.find(".nameLink").attr("href")
            .match(/multiverseid=(\d+)/i)[1],
          name: $card.find(".name").text(),
          artist: $card.find(".artist").text(),
          colours: $card.find(".color").text().split("/")
            .map(function(c) { return colours[c]; })
            .filter(function(c) { return c; })
        };
        if (card.artist.match(/^\s*$/)) delete card.artist;
        cards[card.gathererId] = jquery.extend(cards[card.gathererId] || {}, card);
      });
      cards = util.values(cards);

      async.map(cards, function(details) {
        var next = this;
        models.Card.sync({gathererId: details.gathererId}, function(card) {
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
    var collections = {}
    async.map(['Type', 'Subtype', 'Expansion', 'Rarity', 'Block', 'Format'], function(name) {
      var next = this;
      var model = models[name];
      model.find(function(err, data) {
        collections[model.collectionName] = util.hash(data, function(item) { return item.name; });
        next.success();
      });
    })

    // Get the cards which need updating
    .then(function() {
      models.Card.lastUpdated(20000, this.success);
    })

    // Update each card
    .then(function(cards) {
      async.map(cards, function(card) {
        var next = this;
        var details = {};

        // Gets card details page
        async.promise(function() {
          requestPage(gatherer.card('details', card.gathererId), this.success);
        })

        // Scrapes the details
        .then(function($) {
          var next = this;
          $(".contentTitle").text().replace(/^\s+|\s+$/g, "");

          var rows = $(".cardDetails .rightCol .row");

          var replaceImages = function(elem) {
            elem.find("img").each(function() {
              $(this).replaceWith($("<span>").text("{"+$(this).attr("alt")+"}"));
            });
          };

          var text = function(elem) {
            return elem.text().replace(/^\s+|\s+$/g, "");
          };

          var find = function(rows, search, negativeSearch) {
            var match = rows.filter(function() {
              var text = $(this).find(".label").text();
              return text.match(search) && (!negativeSearch || !text.match(negativeSearch));
            }).first().find(".value");
            replaceImages(match);
            return match;
          };

          var strength = util.zip(text(find(rows, /P\/T/i)).split(/\s*\/\s*/), ["power", "toughness"]);

          details = {
            gathererId: card.gathererId,
            lastUpdated: new Date(),
            name: text(find(rows, /name/i)),
            cost: text(find(rows, /mana cost/i, /converted mana cost/i)),
            cmc: parseInt(text(find(rows, /converted mana cost/i))) || 0,
            rules: find(rows, /text|rules/i).children().map(function() { return text($(this)); }).toArray(),
            power: strength.power || '',
            toughness: strength.toughness || '',
            artist: text(find(rows, /artist/i)),
            flavourText: text(find(rows, /flavor text/i)),
            watermark: text(find(rows, /watermark/i)),
            complete: true
          };

          // Gets reference fields from the database (types, subtypes)
          var typeGroups = util.zip(text(find(rows, /types/i)).split(/\s+—\s+/), ["types", "subtypes"]);
          details.types = (typeGroups.types || "").split(/\s+/).map(function(type) {
            return collections.types[type];
          }).filter(function(type) { return type; });
          details.subtypes = (typeGroups.subtypes || "").split(/\s+/).map(function(subtype) {
            return collections.subtypes[subtype];
          }).filter(function(subtype) { return subtype; });
          next.success(card);
        })

        // Gets printings page
        .then(function(card) {
          requestPage(gatherer.card('printings', card.gathererId), this.success);
        })

        // Scrapes printings
        .then(function($) {
          var printings = $(".cardList:first");
          var printFields = {};
          details.printings = [];

          printings.find("tr.headerRow td").each(function() {
            var field = $(this).text().replace(/^\s+|\s+$/g, "")
            printFields[field] = $(this).prevAll().length;
          });

          printings.find("tr.cardItem").each(function() {
            var row = $(this);
            var findCell = function(col) {
              return row.children("td").eq(printFields[col])
            };
            var values = {
              expansion: findCell("Expansion").text().replace(/^\s+|\s+$/g, ""),
              rarity: findCell("Symbol").find("img").attr("alt").match(/\((.*)\)$/, "")[1]
            };
            var printing = new models.Printing();
            printing.set({
              expansion: collections.expansions[values.expansion],
              rarity: collections.rarities[values.rarity]
            });
            details.printings.push(printing);

            //TODO: save block/expansion relationships here
            var blockExpansion = {
              expansion: details.expansion,
              block: findCell("Block").text().replace(/^\s+|\s+$/g, "")
            };
          });

          var formats = $(".cardList:last");
          var formatFields = {};
          details.legalities = [];

          formats.find("tr.headerRow td").each(function() {
            var field = $(this).text().replace(/^\s+|\s+$/g, "")
            formatFields[field] = $(this).prevAll().length;
          });

          formats.find("tr.cardItem").each(function() {
            var row = $(this);
            var findCell = function(col) {
              return row.children("td").eq(formatFields[col])
            };
            var values = {
              format: findCell("Format").text().replace(/^\s+|\s+$/g, ""),
              legality: findCell("Legality").text().replace(/^\s+|\s+$/g, "")
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
          card.save(next.success;
        });
      })
      .then(function() {
        if (callback) callback();
      });
    });
  }
};

// scheduler.every('2 days', 'findCards', app.findCards);
// scheduler.every('2 minutes', 'updateCards', app.updateCards);

async.promise(function() {
  app.updateCategories(this.success);
}).then(function() {
  app.updateCards(this.success);
});