const async = require('../util/async');

module.exports = function(app) {
  const expansions = {};

  // Iterates through new expansions and populates cards for them
  expansions.populate = function() {
    console.log("Crawling uncrawled expansions");

    // Find expansions which haven't been marked as crawled
    const uncrawled = app.categories.data.expansions.filter(function(e) { return !e.crawled; });
    return async.map(uncrawled, function(expansion) {
      expansions.populateOne(expansion).then(this.success);
    })
    .then(function() {
      console.log("Crawled all expansions");
      this.success();
    });
  };

  // This uses the card search list view page to get basic details of cards in an expansion
  expansions.populateOne = function(expansion, success) {
    console.log("Finding cards for "+expansion.name);
    const count = {updated: 0, created: 0};

    return async.promise(function() {
      app.gatherer.scraper.getExpansionCards(expansion.name, this.success);
    })

    // Iterate through each card
    .map(function(details) {
      const next = this;
      app.models.Card.sync({name: details.name}, function(err, card) {
        count[card.unsaved ? 'created' : 'updated']++;

        // Substitute colour references
        details.colours = details.colours.map(function(colour) {
          return app.categories.gathererName.colours[colour];
        }).filter(function(colour) { return colour; });

        // Populate printing
        details.printings = details.printings.map(function(printing) {
          var replacement = app.corrections.replacements.Rarity[printing.rarity];
          if (replacement) printing.rarity = replacement.rarity;

          printing.rarity = app.categories.gathererName.rarities[printing.rarity];
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

      // Mark expansion as crawled
      expansion.crawled = true;
      expansion.save(this.success);
    });
  };

  return expansions;
};
