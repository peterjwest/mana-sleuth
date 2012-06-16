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
    loyalty: Number,
    cost: String,
    cmc: Number,
    colours: [Schema.ObjectId],
    colourCount: Number,
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

  schemas.GathererPage = new Schema({
    url: String,
    html: String
  })

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
    var query = this.findOne({complete: false}).asc('lastUpdated');
    return fn ? query.run(fn) : query;
  };

  return schemas;
};
