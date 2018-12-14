const { keyBy } = require('lodash');
const Bluebird = require('bluebird');

const { alternate } = require('../util/util');

module.exports = function(app) {
  var cards = {};

  // Loops through updating cards
  cards.update = function() {
    console.log("Updating individual cards");

    // Get required categories from the database
    return app.categories.get()

    // Reset any failed cards
    .then(() => app.models.Card.update({}, { $set: { failed: false }}, { multi: true }))

    // Update cards
    .then(cards.updateNextCard);
  };

  cards.updateNextCard = function() {
    return app.models.Card.getNext().then((card) => {
      if (card) {
        console.log("Updating " + card.name);
        return cards.updateCard(card).then(cards.updateNextCard);
      }
      else {
        console.log("Updated all cards");
        return;
      }
    });
  }

  // This uses the card details and printings pages to get the full details of a card
  cards.updateCard = function(card) {
    const cards = [card];
    return (
      app.gatherer.scraper.getCardDetails(card.gathererId())
      .then((details) => {
        if (!details.multipart) return details;

        var altName = alternate(details.multipart.cards, details.cardData[0].name);
        return app.models.Card.findOne({ name: altName }).then((card) => {
          console.log("Updating " + card.name + " (multipart)");
          cards.push(card);
          return details;
        });
      })
      .then((details) => {
        return {
          ...details,
          cardData: details.cardData.map((card) => {
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
              return app.categories.gathererName.Type[type];
            }).filter(function(type) { return type; });

            card.subtypes = card.subtypes.map(function(subtype) {
              return app.categories.gathererName.Subtype[subtype];
            }).filter(function(subtype) { return subtype; });

            card.formats = card.formats.filter(function(cardFormat) {
              var format = app.categories.gathererName.Format[cardFormat.format];
              var legality = app.categories.gathererName.Legality[cardFormat.legality];
              cardFormat.format = (format || {})._id;
              cardFormat.legality = (legality || {})._id;
              return cardFormat.format && cardFormat.legality;
            });

            return card;
          }),
        };
      })
      .then((details) => {
        const cardDataByName = keyBy(details.cardData, 'name');
        return Bluebird.mapSeries(cards, (card) => {
          card.set(cardDataByName[card.name]);
          card.colourCount = card.colours.length;
          card.complete = true;

          // Set multipart details
          if (details.multipart) {
            card.multipart = {
              card: alternate(cards, card.name)._id,
              type: card.multipart.type || details.multipart.type,
            };
          }

          return card.save();
        });
      })

      .catch((error) => {
        console.log(`Could not process "${card.name}": ${error}`);
        card.failed = true;
        return card.save();
      })
    );
  };

  return cards;
};
