module.exports = function(app, async, util) {
  var cards = {};

  // Loops through updating cards
  cards.update = function(success) {
    console.log("Updating individual cards");

    // Get required categories from the database
    app.categories.get()

    // Update cards
    .then(function() {
      var next = this;
      var run = function() {
        setTimeout(function() { cards.updateNext().then(run); }, 0);
      };
      run();
    });
  };

  // This uses the card details and printings pages to get the full details of a card
  cards.updateNext = function() {
    var self = {};
    self.cards = [];
    self.details = {cards: []};

    // Get the card last updated
    return async.promise(function() {
      var next = this;
      app.models.Card.lastUpdated().run(function(err, card) { next.success(card) });
    })

    // Scrape card details
    .then(function(card) {
      if (card) {
        console.log("Updating "+card.name);
        self.cards.push(card);
        app.gatherer.scraper.getCardDetails(card.gathererId(), this.success);
      }
      else { console.log("Updated all cards"); }
    })

    // Handle multipart cards
    .then(function(details) {
      var next = this;
      self.details = details;

      if (!self.details.multipart) return next.success();

      async.promise(function() {
        var next = this;
        var altName = util.alternate(self.details.multipart.cards, self.cards[0].name);
        app.models.Card.findOne({name: altName}, function(err, card) { next.success(card); });
      })

      .then(function(card) {
        console.log("Updating "+card.name+" (multipart)");
        self.cards.push(card);

        var altCard = self.cards[0].name == self.details.cards[0].name ? self.cards[1] : self.cards[0];
        if (self.details.multipart.type == "split") {
          app.scraper.getCardDetails(card.gathererId(), function(data) {
            self.details.cards = self.details.cards.concat(data.cards);
            next.success();
          });
        }
        else next.success();
      });
    })

    // Apply corrections and substitute database references
    .then(function() {
      self.details.cards.map(function(card) {

        // Applying replacements
        var applyReplacements = function(item, corrections) {
          for (i in corrections) {
            if (typeof corrections[i] == "Object" || typeof corrections[i] == 'Array') {
              if (typeof corrections[i] == 'Array') item[i] = [];
              applyReplacements(item[i], corrections[i]);
            }
            else item[i] = corrections[i];
          }
        };

        // Applying type replacement corrections
        var type = card.types.join(" ");
        var replacement = app.corrections.replacements.Type[type];
        if (replacement !== null) applyReplacements(card, replacement);

        // Applying card replacement corrections
        var replacement = app.corrections.replacements.Card[card.name];
        if (replacement) applyReplacements(card, replacement);

        card.types = card.types.map(function(type) {
          return app.categories.gathererName.types[type];
        }).filter(function(type) { return type; });

        card.subtypes = card.subtypes.map(function(subtype) {
          return app.categories.gathererName.subtypes[subtype];
        }).filter(function(subtype) { return subtype; });

        card.formats = card.formats.filter(function(cardFormat) {
          var format = app.categories.gathererName.formats[cardFormat.format];
          var legality = app.categories.gathererName.legalities[cardFormat.legality];
          cardFormat.format = (format || {})._id;
          cardFormat.legality = (legality || {})._id;
          return cardFormat.format && cardFormat.legality;
        });
      });

      this.success();
    })

    // Prepare details and push cards
    .then(function() {
      self.details.name = util.hash(self.details.cards, util.key('name'));
      this.success(self.cards);
    })

    // Save cards
    .map(function(card) {
      card.set(self.details.name[card.name]);
      card.colourCount = card.colours.length;

      //Set multipart details
      if (self.details.multipart) {
        card.set({multipart: {
          card: util.alternate(self.cards, card)._id,
          type: card.multipart.type || self.details.multipart.type
        }});
      }
      card.save(this.success);
    })

    .then(function(errors) {
      if (errors.filter(util.self).length) {
        return console.log("Error: Couldn't save card ("+errors.join(", ")+")");
      }
      console.log("Updated");
      this.success();
    });
  };

  return cards;
};
