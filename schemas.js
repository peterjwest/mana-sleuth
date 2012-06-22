module.exports = function(mongoose) {
  var Schema = mongoose.Schema;
  var schemas = {};

  schemas.Printing = new Schema({
    gathererId: Number,
    expansion: Schema.ObjectId,
    rarity: Schema.ObjectId,
    artist: String
  });

  schemas.CardFormat = new Schema({
    format: Schema.ObjectId,
    legality: String
  });

  schemas.Card = new Schema({
    name: {type: String, index: true},
    power: {type: String, match: /^\d*|\*$/},
    toughness: {type: String, match: /^\d*|\*$/},
    loyalty: Number,
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
      card: Schema.ObjectId,
      type: {type: String, match: /^flip|split|transform|double$/}
    },
    complete: {type: Boolean, default: false}
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
    populated: {type: Boolean, default: false}
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
    genuine: {type: Boolean, default: true}
  });

  schemas.Subtype = new Schema({
    name: {type: String, index: true, unique: true},
    gathererName: {type: String, index: true, unique: true},
    genuine: {type: Boolean, default: true}
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
    var printing = this.printings[0];
    return printing ? printing.gathererId : false;
  };

  schemas.Card.methods.objects = function(objects) {
    this.objects = {};
    if (objects) {
      for (key in objects) {
        if (this[key]) {
          this.objects[key] =  this[key].map(function(id) { return objects[key][id]; });
        }
      }
    }
    return this.objects;
  };

  schemas.Card.methods.names = function(key) {
    return this.objects[key].map(function(obj) { return obj.name; }).join(", ");
  };

  schemas.Card.methods.has = function(key, name) {
    var found = false;
    this.objects[key].map(function(obj) {
      if (obj.name == name) found = true;
    });
    return found;
  };

  schemas.Card.statics.lastUpdated = function(fn) {
    var query = this.findOne({complete: false}).sort('lastUpdated', 1);
    return fn ? query.run(fn) : query;
  };

  return schemas;
};
