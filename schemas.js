var mongoose = require('mongoose');
mongoose.utils = require('./node_modules/mongoose/lib/utils.js');
var Schema = mongoose.Schema;
var schemas = exports || {};

schemas.Printing = new Schema({
  expansion: Schema.ObjectId,
  rarity: Schema.ObjectId
});

schemas.Legality = new Schema({
  format: Schema.ObjectId,
  legality: String
});

schemas.Card = new Schema({
  name: String,
  power: {type: String, match: /^\d*|\*$/},
  toughness: {type: String, match: /^\d*|\*$/},
  cost: {string: String, cmc: Number},
  colours: [String],
  rules: String,
  multipart: Schema.ObjectId,
  gathererId: {type: Number, index: true},
  lastUpdated: Date,
  flavourText: String,
  artist: String,
  watermark: String,
  types: [Schema.ObjectId],
  subtypes: [Schema.ObjectId],
  format: [Schema.ObjectId],
  printings: [schemas.Printing],
  legalities: [schemas.Legality],
  complete: Boolean
});

schemas.Multipart = new Schema({
  cards: [Schema.ObjectId],
  type: {type: String, match: /^flip|split|transform$/}
});

schemas.Expansion = new Schema({
  name: String,
  complete: Boolean
});

schemas.Format = new Schema({
  name: String
});

schemas.Block = new Schema({
  name: String,
  expansions: [Schema.ObjectId]
});

schemas.Type = new Schema({
  name: String
});

schemas.Subtype = new Schema({
  name: String
});

schemas.Rarity = new Schema({
  name: String
});