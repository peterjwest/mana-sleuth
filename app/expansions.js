const Bluebird = require('Bluebird');
const { identity } = require('lodash');

module.exports = function(app) {
  const expansions = {};

  // Iterates through new expansions and populates cards for them
  expansions.populate = function() {
    console.log("Crawling uncrawled expansions");

    // Find expansions which haven't been marked as crawled
    const uncrawled = app.categories.data.Expansion.filter(function(e) { return !e.crawled; });
    return Bluebird.mapSeries(uncrawled, (expansion) => {
      return expansions.populateOne(expansion);
    }).then(function() {
      console.log("Crawled all expansions");
    });
  };

  // This uses the card search list view page to get basic details of cards in an expansion
  expansions.populateOne = function(expansion) {
    console.log("Finding cards for "+expansion.name);
    const count = {updated: 0, created: 0};

    return (
      app.gatherer.scraper.getExpansionCards(expansion.name)
      .then((cards) => {
        return Bluebird.mapSeries(cards, (cardData) => {
          return (
            app.models.Card.findOrCreate({name: cardData.name})
            .then((card) => {
              // TODO: Count these better
              count[card.unsaved ? 'created' : 'updated']++;

              // Substitute colour references
              cardData.colours = (
                cardData.colours
                .map((colour) => app.categories.gathererName.Colour[colour])
                .filter(identity)
              );

              // Populate printing
              cardData.printings = cardData.printings.map((printing) => {
                var replacement = app.corrections.replacements.Rarity[printing.rarity];
                if (replacement) printing.rarity = replacement.rarity;

                printing.rarity = app.categories.gathererName.Rarity[printing.rarity];
                printing.expansion = expansion._id;
                return printing;
              });

              // Add to existing printings
              cardData.printings = card.printings.concat(cardData.printings);

              card.set(cardData);
              return card.save();
            })
          );
        });
      })
      .then(() => {
        console.log("Created "+count.created+" cards, updated "+count.updated+" cards");
        expansion.crawled = true;
        return expansion.save();
      })
    );
  };

  return expansions;
};
