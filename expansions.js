module.exports = function(app, async, util) {
  var expansions = {};

  // Iterates through new expansions and populates cards for them
  expansions.populate = function() {
    console.log("Populating unpopulated expansions");

    // Find expansions which haven't been marked as populated
    var unpopulated = app.categories.data.expansions.filter(function(e) { return !e.populated; });
    return async.map(unpopulated, function(expansion) {
      expansions.populateOne(expansion).then(this.success);
    })
    .then(function() {
      console.log("Populated all expansions");
      this.success();
    });
  };

  // This uses the card search list view page to get basic details of cards in an expansion
  expansions.populateOne = function(expansion, success) {
    console.log("Finding cards for "+expansion.name);
    var count = {updated: 0, created: 0};

    return async.promise(function() {
      app.scraper.getExpansionCards(app.router.cards(expansion.name), this.success);
    })

    // Iterate through each card
    .map(function(details) {
      var next = this;
      app.models.Card.sync({name: details.name}, function(err, card) {
        count[card.unsaved ? 'created' : 'updated']++;

        // Substitute colour references
        details.colours = details.colours.map(function(colour) {
          return app.categories.name.colours[colour];
        }).filter(function(colour) { return colour; });

        // Populate printing
        details.printings = details.printings.map(function(printing) {
          var replacement = app.corrections.replacements.Rarity[printing.rarity];
          if (replacement) printing.rarity = replacement.rarity;

          printing.rarity = app.categories.name.rarities[printing.rarity];
          printing.expansion = expansion._id;
          return printing;
        });

        // Add to existing printings
        details.printings = card.printings.concat(details.printings);

        card.set(details);
        card.save(next.success);
      });
    })
    .then(function() {
      console.log("Created "+count.created+" cards, updated "+count.updated+" cards");

      // Mark expansion as populated
      expansion.populated = true;
      expansion.save(this.success);
    });
  };

  return expansions;
};