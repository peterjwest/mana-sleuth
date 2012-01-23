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
  Multipart: new Schema({
    cards: [Schema.ObjectId],
    type: String //flip, split, double-faced
  }),
  
  Card: new Schema({
    name: String,
    power: {type: String, match: /^\d+|\*$/},
    toughness: {type: String, match: /^\d+|\*$/},
    cost: {string: String, cmc: Number},
    colours: [String],
    rules: String,
    multipart: Schema.ObjectId,
    gathererId: {type: Number, index: true},
    dataComplete: Boolean,
    lastUpdated: Date,
    flavourText: String,
    artist: String
    //expansions, formats, types
  })
};

// Define models
var models = {};
for (i in schemas) {
  models[i] = mongoose.model(i, schemas[i]);
}

// Sync method for adding/updating cards
models.Card.sync = function(details) {
  var Card = this;
  Card.findOne({gathererId: details.gathererId}, function(err, card) { 
    if (!card) card = new Card();
    card.set(details);
    card.save();
  });
};

// Method to find cards which need updating
models.Card.updatable = function(number, fn) {
  var Card = this;
  Card.find().asc('lastUpdated').limit(number).find(function(err, cards) {
    fn(cards);
  });
};

//Time units
units = [];
units.second = 1000;
units.minute = 60 * units.second;
units.hour = 60 * units.minute;
units.day = 24 * units.hour;
units.week = 7 * units.day;

//Schedules tasks
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
    cards: '/Pages/Search/Default.aspx',
    details: '/Pages/Card/Details.aspx',
    sets: '/Pages/Card/Printings.aspx',
    image: '/Handlers/Image.ashx'
  },
  cards: function() {
    return this.domain+this.paths.cards+'?output=checklist&text=+[]';
  },
  card: function(type, id, query) {
    if (!this.paths[type]) throw "Cannot find card resource type";
    var imageType = (type == 'image' ? '&type=card' : '');
    var queryString = 'multiverseid='+id+imageType+(query ? '&'+query : '');
    return this.domain+this.paths[type]+'?'+queryString;
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

// App functionality
var app = {
  findCards: function() {
    console.log("Finding new cards");
    
    request({uri: gatherer.cards()}, function (error, response, body) {
      jsdom.env(body, function (err, window) {
        var $ = jquery.create(window);
        var cards = $(".cardItem");
        
        cards.each(function() {
          var $card = $(this)
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
          models.Card.sync(card);
        });
        console.log("Found "+cards.length+" cards");
      });
    });
  },
  
  updateCards: function() {
    console.log("Updating cards");
    
    models.Card.updatable(20, function(cards) {
      var i = 0;
      cards.map(function(card) {
        setTimeout(function() {
            var uri = gatherer.card('details', card.gathererId);
            request({uri: uri}, function (error, response, body) {
              jsdom.env(body, function (err, window) {
                var $ = jquery.create(window);
                $(".contentTitle").text().replace(/^\s+|\s+$/g, "");
                
                var rows = $(".cardDetails .rightCol .row");
                
                var filterer = function(rows, search, negativeSearch) {
                    return rows.filter(function() {
                        var text = $(this).find(".label").text();
                        return text.match(search) && (!negativeSearch || !text.match(negativeSearch));
                    }).first().find(".value").text().replace(/^\s+|\s+$/g, "");
                };
                
                var details = {
                    gathererId: card.gathererId,
                    lastUpdated: new Date(),
                    name: filterer(rows, /name/i),
                    cost: {
                        string: filterer(rows, /mana cost/i, /converted mana cost/i),
                        cmc: parseInt(filterer(rows, /converted mana cost/i)) || 0
                    },
                    rules: filterer(rows, /text|rules/i),
                    artist: filterer(rows, /artist/i)
                    //types: filterer(rows, /types/i),
                    //expansion: filterer(rows, /expansion/i),
                    //rarity: filterer(rows, /rarity/i),
                }
                
                card.set(details);
                card.save();
              });
            });
        }, i * 3000);
        i++;
      });
    });
  }
};

scheduler.every('2 days', 'findCards', app.findCards);
scheduler.every('2 minutes', 'updateCards', app.updateCards);

app.updateCards();