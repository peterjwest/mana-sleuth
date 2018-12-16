const Bluebird = require('bluebird');

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

function mapCardData(cardData, categories, replacements) {
  // Applying card replacement corrections
  var replacement = replacements.Card[cardData.name];
  if (replacement) {
    applyReplacements(cardData, replacement);
  }

  const printings = cardData.printings && cardData.printings.map((printing) => ({
    ...printing,
    rarity: categories.Rarity[printing.rarity],
    expansion: categories.Expansion[printing.expansion],
  }));

  // Replace types, subtypes and format names with database references
  return {
    ...cardData,
    types: cardData.types.map((type) => categories.Type[type]).filter((type) => type),
    subtypes: cardData.subtypes.map((subtype) => categories.Subtype[subtype]).filter((subtype) => subtype),
    ...(printings ? { printings: printings } : {}),
    formats: (
      cardData.formats
      .map((cardFormat) => {
        const format = categories.Format[cardFormat.format];
        const legality = categories.Legality[cardFormat.legality];
        return {
          ...cardFormat,
          format: format ? format._id : undefined,
          legality: legality ? legality._id : undefined,
        };
      })
      .filter((cardFormat) => cardFormat.format && cardFormat.legality)
    ),
  };
}

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
    return (
      app.gatherer.scraper.getCardData(card.name, card.gathererId())
      .then((rawCardData) => {
        const cardData = mapCardData(rawCardData, app.categories.gathererName, app.corrections.replacements);

        if (!cardData.multipart) {
          return [{ data: cardData, card: card }];
        }

        return (
          Bluebird.mapSeries(cardData.multipart.cards, (name) => {
            return (
              app.models.Card.findOne({ name: name })
              .then((multipartCard) => {
                console.log(`Updating ${multipartCard.name} (multipart of ${card.name})`);
                return (
                  app.gatherer.scraper.getCardData(multipartCard.name, multipartCard.gathererId())
                  .then((rawCardData) => {
                    const cardData = mapCardData(rawCardData, app.categories.gathererName, app.corrections.replacements);
                    return { data: cardData, card: multipartCard };
                  })
                );
              })
            );
          })
          .then((multipartCardData) => [{ data: cardData, card: card }, ...multipartCardData])
        );
      })
      // Map multipart cards to database references
      .then((cardDetails) => {
        return cardDetails.map(({ card, data }) => {
          if (!data.multipart) {
            return { card, data };
          }

          const multipartCards = data.multipart.cards.map((cardName) => {
            const cardMatch = cardDetails.find(({ data }) => data.name === cardName);
            return cardMatch ? cardMatch.card._id : undefined;
          });

          return {
            card: card,
            data: { ...data, multipart: { ...data.multipart, cards: multipartCards }},
          };
        });
      })
      .then((cardDetails) => {
        return Bluebird.mapSeries(cardDetails, ({ card, data }) => {
          card.set(data);
          if (!data.multipart) {
            card.multipart = undefined;
          }
          card.colourCount = card.colours.length;
          card.complete = true;
          return card.save();
        })
        .catch((error) => {
          const ids = cardDetails.map(({ card }) => card._id);
          return app.models.Card.updateMany({ _id: { $in: ids }}, { $set: { complete: false, failed: true } })
          .then(() => { throw error; });
        });
      })
      .catch((error) => {
        console.log(`Could not process "${card.name}": ${error}`);
      })
    );
  };

  return cards;
};
