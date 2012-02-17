var request = require('request');
var url = require('url');
var http = require('http');
var jquery = require("jquery");
var jsdom = require('jsdom');
var mongoose = require('mongoose');
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
    artist: String
  }),
  
  Multipart: new Schema({
    cards: [Schema.ObjectId],
    type: {type: String, match: /^flip|split|transform$/}
  }),
  
  Printings: new Schema({
    name: String,
    cardId: Schema.ObjectId,
    setId: Schema.ObjectId
  }),
  
  Set: new Schema({
    name: String,
    blockId: Schema.ObjectId
  })
};

// Sync method for adding/updating models
var sync = function(criteria, details) {
  var Card = this;
  Card.findOne(criteria, function(err, card) { 
    if (!card) card = new Card();
    card.set(details);
    card.save();
  });
};

// Define models
var models = {};
for (i in schemas) {
  models[i] = mongoose.model(i, schemas[i]);
  models[i].sync = sync;
}

// Method to find cards which need updating
models.Card.updatable = function(number, fn) {
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
    cards: '/Pages/Search/Default.aspx?',
    details: '/Pages/Card/Details.aspx?',
    original: '/Pages/Card/Details.aspx?printed=true&',
    sets: '/Pages/Card/Printings.aspx?',
    image: '/Handlers/Image.ashx?'
  },
  cards: function() {
    return this.domain+this.paths.cards+'?output=checklist&text=+[]';
  },
  card: function(type, id, query) {
    if (!this.paths[type]) throw "Cannot find card resource type";
    var imageType = (type == 'image' ? '&type=card' : '');
    var queryString = 'multiverseid='+id+imageType+(query ? '&'+query : '');
    return this.domain+this.paths[type]+queryString;
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

// Runs a function in a promise interface
var promise = function(fn) {
  var create = function() {
    var promise = {next: {success: function() { }, fail: function() {} }};
    promise.then = function(success, fail) {
      var newPromise = create();
      promise.next = {
        success: function() {
            success.apply(this, [newPromise.next].concat([].slice.call(arguments)));
        },
        fail: fail
      };
      return newPromise;
    };
    return promise;
  };
  
  var promise = create();
  fn({ 
    success: function() { promise.next.success.apply(this, arguments); },
    fail: function() { promise.next.fail.apply(this, arguments); }
  });
  return promise;
}

// Runs a function with asynchronous behaviour on an array of items
var chain = function(items, fn) {
  return promise(function(next) {
    var iterate = function(fn, i) {
      if (i < items.length) {
        fn({ 
          'continue': function() { iterate(fn, i + 1) },
          'break': function() { next.success(i + 1); }
        }, items[i]);
      }
      else { next.success(i); }
    };
  
    iterate(fn, 0);
  });
};

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
  findCards: function() {
    console.log("Finding new cards");
    requestPage(gatherer.cards(), function($) {
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

      var i = 0;
      for (id in cards) {
          models.Card.sync({gathererId: id}, cards[id]);
          i++;
      }
      console.log("Found "+i+" cards");
    });  
  },

  updateCards: function() {
    console.log("Updating cards");
    models.Card.updatable(1, function(cards) {
      var i = 0;
      chain(cards, function(card, success) {
        after(between(300, 600), function() {
          requestPage(gatherer.card('details', card.gathererId), function($) {
            $(".contentTitle").text().replace(/^\s+|\s+$/g, "");
            
            var rows = $(".cardDetails .rightCol .row");
            
            var filterer = function(rows, search, negativeSearch) {
                return rows.filter(function() {
                    var text = $(this).find(".label").text();
                    return text.match(search) && (!negativeSearch || !text.match(negativeSearch));
                }).first().find(".value").text().replace(/^\s+|\s+$/g, "");
            };
            
            var powerToughness = filterer(rows, /P\/T/i).split(/\s*\/\s*/);
            var details = {
                gathererId: card.gathererId,
                lastUpdated: new Date(),
                name: filterer(rows, /name/i),
                cost: {
                    string: filterer(rows, /mana cost/i, /converted mana cost/i),
                    cmc: parseInt(filterer(rows, /converted mana cost/i)) || 0
                },
                rules: filterer(rows, /text|rules/i),
                artist: filterer(rows, /artist/i),
                power: powerToughness[0] || '',
                toughness: powerToughness[1] || '',
                types: filterer(rows, /types/i)
            };
            
            after(between(300, 600), function() {
              requestPage(gatherer.card('sets', card.gathererId), function($) {
                var printings = $(".cardList:first .cardItem");
                var formats = $(".cardList:last .cardItem");
                
                var printFields = {};
                $(".cardList:first tr.headerRow td").each(function() {
                    var field = $(this).text().replace(/^\s+|\s+$/g, "")
                    printFields[field] = $(this).prevAll().length;
                });
                
                console.log(printFields);
                
                card.set(details);
                card.save();
                
                success();
              });
            });
          });
        });
      });
    });
  }
};

// scheduler.every('2 days', 'findCards', app.findCards);
// scheduler.every('2 minutes', 'updateCards', app.updateCards);

// app.findCards();
// app.updateCards();

// promise(function(next) { console.log("starting"); setTimeout(function() { next.success(); }, 500); })
// .then(function(next) { console.log("done"); next.success(); })
// .then(function(next) { console.log("re-done"); next.success(); })
// .then(function(next) { console.log("re-re-done"); }, function() { console.log("oh no!"); });

chain([1,2,3,4,5,6], function(next, item) {
  setTimeout(function() {
    console.log(item); 
    if (item == 4) return next.break();
    next.continue();
  }, 10);
}).then(function(next, i) { console.log("Final: "+i); });

promise(function(next) {
    setTimeout(function() {
        next.success(1,2,3);
    }, 50);
}).then(function(next, a, b, c) {
    console.log(a,b,c);
});