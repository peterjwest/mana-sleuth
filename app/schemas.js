const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const schemas = {};

const fieldModelNames = {
  Format: 'formats',
  Printing: 'printings',
  Subtype: 'subtypes',
  Type: 'types',
  Colour: 'colours',
};

schemas.Printing = new Schema({
  gathererId: Number,
  expansion: Schema.ObjectId,
  rarity: Schema.ObjectId,
  artist: String
});

schemas.CardFormat = new Schema({
  format: Schema.ObjectId,
  legality: Schema.ObjectId
});

// To make a nested object required, use a single nested schema
var MultipartSchema = new Schema({
  cards: [Schema.ObjectId],
  type: {type: String, match: /^flip|split|transform|double|partner|meld$/}
});

schemas.Card = new Schema({
  name: {type: String, index: true},
  power: {type: String, match: /^\d*|\*$/},
  toughness: {type: String, match: /^\d*|\*$/},
  loyalty: String,
  cost: String,
  cmc: Number,
  colours: {type: [Schema.ObjectId], index: true},
  colourCount: Number,
  rules: [String],
  lastUpdated: Date,
  flavourText: String,
  watermark: String,
  types: {type: [Schema.ObjectId], index: true},
  subtypes: {type: [Schema.ObjectId], index: true},
  printings: [schemas.Printing],
  formats: [schemas.CardFormat],
  multipart: {
    type: MultipartSchema,
    required: false,
  },
  complete: {type: Boolean, default: false},
  failed: {type: Boolean, default: false}
});
schemas.Card.index({'lastUpdated': 1, 'complete': 1});
schemas.Card.index({'printings.gathererId': 1});
schemas.Card.index({'printings.expansion': 1});
schemas.Card.index({'formats.format': 1});

schemas.Expansion = new Schema({
  name: {type: String, index: true, unique: true},
  gathererName: {type: String, index: true, unique: true},
  released: Date,
  complete: {type: Boolean, default: false},
  crawled: {type: Boolean, default: false}
});

schemas.Format = new Schema({
  name: {type: String, index: true, unique: true},
  gathererName: {type: String, index: true, unique: true},
  priority: {type: Number, default: 0}
});

schemas.Block = new Schema({
  name: {type: String, index: true, unique: true},
  gathererName: {type: String, index: true, unique: true},
  expansions: [Schema.ObjectId]
});

schemas.Colour = new Schema({
  name: {type: String, index: true, unique: true},
  gathererName: {type: String, index: true, unique: true}
});

schemas.Type = new Schema({
  name: {type: String, index: true, unique: true},
  gathererName: {type: String, index: true, unique: true},
});

schemas.Subtype = new Schema({
  name: {type: String, index: true, unique: true},
  gathererName: {type: String, index: true, unique: true},
});

schemas.Rarity = new Schema({
  name: {type: String, index: true, unique: true},
  gathererName: {type: String, index: true, unique: true},
});

schemas.Legality = new Schema({
  name: {type: String, index: true, unique: true},
  gathererName: {type: String, index: true, unique: true}
});

schemas.Cache = new Schema({
  name: {type: String, index: true, unique: true},
  value: {}
});

schemas.Card.methods.gathererId = function() {
  const printing = this.printings[0];
  return printing ? printing.gathererId : undefined;
};

schemas.Card.methods.objects = function(objects) {
  this.objects = {};
  if (objects) {
    for (const modelName in objects) {
      const fieldName = fieldModelNames[modelName];
      if (fieldName) {
        this.objects[fieldName] =  this[fieldName].map(function(id) { return objects[modelName][id]; });
      }
    }
  }
  return this.objects;
};

schemas.Card.methods.names = function(fieldName) {
  return this.objects[fieldName].map(function(obj) { return obj.name; }).join(", ");
};

schemas.Card.methods.has = function(fieldName, name) {
  let found = false;
  this.objects[fieldName].map(function(obj) {
    if (obj.name == name) found = true;
  });
  return found;
};

schemas.Card.statics.getNext = function() {
  return this.findOne({ complete: false, failed: false }).sort({lastUpdated: 1});
};

module.exports = schemas;
