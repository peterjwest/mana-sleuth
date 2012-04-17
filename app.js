var request = require('request');
var url = require('url');
var http = require('http');
var jquery = require("jquery");
var jsdom = require('jsdom');
var mongoose = require('mongoose');
mongoose.utils = require('./node_modules/mongoose/lib/utils.js');
var async = require('./async.js');
mongoose.connect('mongodb://localhost/mana_sleuth');

// Define schemas
var Schema = mongoose.Schema;

var schemas = {
  Card: new Schema({
    name: String,
    power: {type: String, match: /^\d*|\*$/},
    toughness: {type: String, match: /^\d*|\*$/},
    cost: {string: String, cmc: Number},
    colours: [String],
    rules: String,
    multipart: Schema.ObjectId,
    gathererId: {type: Number, index: true},
    dataComplete: Boolean,
    lastUpdated: Date,
    flavourText: String,
    artist: String,
    watermark: String,
    types: [Schema.ObjectId],
    subtypes: [Schema.ObjectId],
    format: [Schema.ObjectId],
    printings: [Schema.ObjectId]
  }),

  Multipart: new Schema({
    cards: [Schema.ObjectId],
    type: {type: String, match: /^flip|split|transform$/}
  }),

  Printing: new Schema({
    expansion: Schema.ObjectId,
    rarity: Schema.ObjectId
  }),

  Expansion: new Schema({
    name: String
  }),

  Format: new Schema({
    name: String
  }),

  Block: new Schema({
    name: String,
    expansions: [Schema.ObjectId]
  }),

  Type: new Schema({
    name: String
  }),

  Subtype: new Schema({
    name: String
  }),

  Rarity: new Schema({
    name: String
  })
};

// Sync method for adding/updating models
var sync = function(criteria, details, success) {
  var Model = this;
  Model.findOne(criteria, function(err, card) {
    if (!card) card = new Model();
    card.set(details);
    card.save(success);
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
  Card.find().asc('lastUpdated').limit(number).find(function(err, cards) {
    fn(cards);
  });
};

// Time units
units = [];
units.second = 1000;
units.minute = 60 * units.second;
units.hour = 60 * units.minute;
units.day = 24 * units.hour;
units.week = 7 * units.day;

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

// Schedules tasks
var scheduler = {
  units: units,
  tasks: {},

  decodeTime: function(string) {
    var time = string.split(/\s+/);
    var unit = time[1].replace(/s$/, "");
    if (!this.units[unit]) throw "Cannot determine unit of time";
    return parseInt(parseInt(time[0]) * this.units[unit]);
  },
  every: function(time, name, fn) {
    var id = setInterval(fn, this.decodeTime(time));
    this.tasks[name] = {name: name, id: id, fn: fn};
  },
  remove: function(name) {
    clearInterval(this.tasks[name].id);
    delete this.tasks[name];
  },
  trigger: function(name) {
    this.tasks[name]();
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
      var filterer = function(items, search, negativeSearch) {
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
        Expansion: filterer(conditions, /set|expansion/i),
        Format: filterer(conditions, /format/i),
        Block: filterer(conditions, /block/i),
        Type: filterer(conditions, /type/i, /subtype/i),
        Subtype: filterer(conditions, /subtype/i),
        Rarity: filterer(conditions, /rarity/i)
      };

      async.map(categories, function(category) {
        async.map(values[category], function(name) {
          var details = {name: name};
          models[category].sync(details, details, this.success);
        }).then(this.success);
      }).then(function() {
        console.log("Updated "+categories.length+ " categories");
        if (callback) callback();
      });
    });
  },

  // This uses the card search list view page to get basic details of a number of cards
  findCards: function(callback) {
    var url = gatherer.cards("Dark Ascension");
    console.log("Finding new cards");
    requestPage(url, function($) {
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

      async.map(cards, function(card) {
        models.Card.sync({gathererId: card.gathererId}, card, this.success);
      })
      .then(function() {
        console.log("Found "+cards.length+" cards");
        if (callback) callback();
      });
    });
  },

  // This uses the card details and printings pages to get the full details of a card
  updateCards: function(callback) {
    console.log("Updating cards");
    models.Card.lastUpdated(10, function(cards) {
      async.map(cards, function(card) {
        var next = this;
        var details = {};

        //Gets card details page
        async.promise(function() {
          requestPage(gatherer.card('details', card.gathererId), this.success);
        })
        .then(function($) {
          var next = this;
          $(".contentTitle").text().replace(/^\s+|\s+$/g, "");

          var rows = $(".cardDetails .rightCol .row");

          var filterer = function(rows, search, negativeSearch) {
            return rows.filter(function() {
              var text = $(this).find(".label").text();
              return text.match(search) && (!negativeSearch || !text.match(negativeSearch));
            }).first().find(".value").text().replace(/^\s+|\s+$/g, "");
          };

          var strength = util.zip(filterer(rows, /P\/T/i).split(/\s*\/\s*/), ["power", "toughness"]);
          details = {
            gathererId: card.gathererId,
            lastUpdated: new Date(),
            name: filterer(rows, /name/i),
            cost: {
              string: filterer(rows, /mana cost/i, /converted mana cost/i),
              cmc: parseInt(filterer(rows, /converted mana cost/i)) || 0
            },
            rules: filterer(rows, /text|rules/i),
            power: strength.power || '',
            toughness: strength.toughness || '',
            artist: filterer(rows, /artist/i),
            watermark: filterer(rows, /watermark/i)
          };

          //Gets reference fields from the database (types, subtypes)
          var typeGroups = util.zip(filterer(rows, /types/i).split(/\s+—\s+/), ["types", "subtypes"]);
          var types = (typeGroups.types || "").split(/\s+/);
          var subtypes = (typeGroups.subtypes || "").split(/\s+/);
          var references = [
            {model: models.Type, value: types},
            {model: models.Subtype, value: subtypes}
          ];
          async.map(references, function(reference) {
            var next = this;
            reference.model.find({name: {'$in': reference.value}}, function(err, data) { next.success(data); });
          })
          .then(function(datas) {
            datas.map(function(data, i) {
              details[references[i].model.collectionName] = util.pluck(data, "_id");
            });
            next.success(card);
          });
        })
        // Gets printings page
        .then(function(card) {
          requestPage(gatherer.card('printings', card.gathererId), this.success);
        })
        .then(function($) {
          var cardList = $(".cardList:first");
          var printings = cardList.find(".cardItem");
          var formats = cardList.find(".cardItem");
          var printFields = {};
          var printings = [];

          cardList.find("tr.headerRow td").each(function() {
            var field = $(this).text().replace(/^\s+|\s+$/g, "")
            printFields[field] = $(this).prevAll().length;
          });

          cardList.find("tr.cardItem").each(function() {
            var row = $(this);
            var findCell = function(col) {
              return row.children("td").eq(printFields[col])
            };
            var printing = {
              expansion: findCell("Expansion").text().replace(/^\s+|\s+$/g, ""),
              rarity: findCell("Symbol").find("img").attr("alt").match(/\(.*\)$/g, "")[0].replace(/\(|\)/g, "")
            };
            var blockExpansion = {
              expansion: printing.expansion,
              block: findCell("Block").text().replace(/^\s+|\s+$/g, "")
            };
            printings.push(printing);
          });

          models.Printing.find({'_id': {'$in': card.printings}}).remove(function(err, data) {
            async.map(printings, function(details) {
              var next = this;
              var printing = new models.Printing();
              printing.set(details);
              printing.save(function(err) { next.success(printing._id); });
            }).then(function(printings) {
              details.printings = printings;
              console.log(details);
              card.set(details);
              card.save();

              console.log("Updating "+card.name);
              next.success();
            });
          });
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
  app.findCards(this.success);
}).then(function() {
  app.updateCards(this.success);
});