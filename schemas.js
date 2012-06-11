module.exports = function(mongoose) {
  var Schema = mongoose.Schema;
  var schemas = {};

  schemas.Printing = new Schema({
    gathererId: Number,
    expansion: Schema.ObjectId,
    rarity: Schema.ObjectId,
    artist: String
  });

  schemas.Legality = new Schema({
    format: Schema.ObjectId,
    legality: String
  });

  schemas.Card = new Schema({
    name: String,
    power: {type: String, match: /^\d*|\*$/},
    toughness: {type: String, match: /^\d*|\*$/},
    cost: String,
    cmc: Number,
    colours: [Schema.ObjectId],
    rules: [String],
    lastUpdated: Date,
    flavourText: String,
    watermark: String,
    types: [Schema.ObjectId],
    subtypes: [Schema.ObjectId],
    printings: [schemas.Printing],
    legalities: [schemas.Legality],
    multipart: {
      card: Schema.ObjectId,
      type: {type: String, match: /^flip|split|transform|double$/}
    },
    complete: {type: Boolean, default: false}
  });

  schemas.Expansion = new Schema({
    name: String,
    gathererName: String,
    released: Date,
    complete: {type: Boolean, default: false},
    populated: {type: Boolean, default: false}
  });

  schemas.Format = new Schema({
    name: String,
    gathererName: String
  });

  schemas.Block = new Schema({
    name: String,
    gathererName: String,
    expansions: [Schema.ObjectId]
  });

  schemas.Colour = new Schema({
    name: String,
    gathererName: String,
  });

  schemas.Type = new Schema({
    name: String,
    gathererName: String,
    genuine: {type: Boolean, default: true}
  });

  schemas.Subtype = new Schema({
    name: String,
    gathererName: String,
    genuine: {type: Boolean, default: true}
  });

  schemas.Rarity = new Schema({
    name: String,
    gathererName: String,
  });

  schemas.Cache = new Schema({
    name: String,
    value: {}
  })

  // Method to find gatherer id for a card
  schemas.Card.methods.gathererId = function() {
    var printing = this.printings[0];
    return printing ? printing.gathererId : false;
  };

  schemas.Card.methods.typeNames = function(types) {
    return this.types.map(function(id) { return types[id].name; }).join(", ");
  };

  schemas.Card.methods.subtypeNames = function(subtypes) {
    return this.subtypes.map(function(id) { return subtypes[id].name; }).join(", ");
  };

  return schemas;
};