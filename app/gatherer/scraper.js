const cheerio = require("cheerio");
const { uniq } = require('lodash');

const cachedRequest = require('../../util/cached_request');
const router = require('./router.js');

var scraper = {};

const rarities = {
  L: 'Land',
  C: 'Common',
  U: 'Uncommon',
  R: 'Rare',
  M: 'Mythic Rare',
  P: 'Promo',
  S: 'Special'
};

function getMultipartType(name, rules) {
  if (rules.match(/transform/i)) return 'transform';
  if (rules.match(/flip/i)) return 'flip';
  if (rules.match(/partner/i)) return 'partner';
  if (rules.match(/meld/i)) return 'meld';
  if (name.match(/\/\//)) return 'split';
  return 'unknown';
}

// Gets the response of page and gives it to the callback function
scraper.requestPage = function(url, retries = 3) {
  return cachedRequest({url: url}).then((html) => cheerio.load(html))
  .catch(() => {
    if (retries > 0) {
      return scraper.requestPage(url, retries - 1);
    } else {
      throw new Error(`Cannot access URL: "${url}"`);
    }
  })
};

scraper.getCategories = function() {
  return scraper.requestPage(router.categories()).then(($) => {
    var conditions = $(".advancedSearchTable tr");

    var find = function(search, negativeSearch) {
      var match = $(conditions.toArray().filter(function(self) {
        var text = $(self).find(".label2").text();
        return text.match(search) && (!negativeSearch || !text.match(negativeSearch));
      })[0]);

      return match.find(".dynamicAutoComplete a").toArray().map(function(self) {
        return $(self).text().replace(/^\s+|\s+$/g, "");
      });
    };

    return {
      Colour: find(/color/i),
      Expansion: find(/set|expansion/i),
      Format: find(/format/i),
      Block: find(/block/i),
      Type: find(/type/i, /subtype/i),
      Subtype: find(/subtype/i),
      Rarity: find(/rarity/i),
      Legality: []
    };
  });
};

scraper.getExpansionCards = function(expansion, page = 1, existingCards = []) {
  console.log("Requesting page " + page);
  return scraper.requestPage(router.cards(expansion, page)).then(($) => {
    const cards = existingCards.concat($(".cardItem").map(function() {
      const cardElement = $(this);
      const name = cardElement.find(".name").text();
      return {
        lastUpdated: new Date(),
        name: name,
        colours: uniq(cardElement.find(".color").text().split("/")),
        printings: [{
          gathererId: cardElement.find(".nameLink").attr("href").match(/multiverseid=(\d+)/i)[1],
          artist: cardElement.find(".artist").text(),
          rarity: rarities[cardElement.find(".rarity").text()]
        }],
      };
    }).get());

    const hasNextPage = (
      $('.pagingcontrols a')
      .filter((index, element) => parseInt($(element).text(), 10) === page + 1)
      .length > 0
    );

    if (hasNextPage) {
      return scraper.getExpansionCards(expansion, page + 1, cards);
    }
    else {
      return cards;
    }
  });
};

scraper.getCardData = function(name, id) {
  return scraper.requestPage(router.card(id)).then(($) => {
    const details = $(".cardDetails");

    $.fn.textifyImages = function() {
      this.find("img").each(function() {
        $(this).replaceWith($("<span>").text("{"+$(this).attr("alt")+"}"));
      });
      return this;
    };

    var text = function(elem) {
      return elem.text().replace(/^\s+|\s+$/g, "");
    };

    var find = function(rows, search, negativeSearch) {
      return (
        $(rows.toArray().find((self) => {
          var text = $(self).find(".label").text();
          return text.match(search) && (!negativeSearch || !text.match(negativeSearch));
        }))
        .find(".value").textifyImages()
      );
    };

    // Iterate through all card details
    const cards = details.toArray().map(function(self) {
      const rows = $(self).find(".rightCol .row");
      const [power, toughness] = text(find(rows, /P\/T/i)).split(/ \/ /);
      const [types, subtypes] = text(find(rows, /types/i)).split(/\s+—\s+/);

      return {
        lastUpdated: new Date(),
        name: text(find(rows, /name/i)),
        cost: text(find(rows, /mana cost/i, /converted mana cost/i)),
        cmc: parseFloat(text(find(rows, /converted mana cost/i))) || 0,
        rules: find(rows, /Card text:/i, /flavor text/i).children().toArray()
          .map(function(self) { return text($(self)); })
          .filter(function(rule) { return rule; }),
        power: power || '',
        toughness: toughness || '',
        types: (types || "").split(/\s+/),
        subtypes: (subtypes || "").split(/\s+/),
        loyalty: text(find(rows, /loyalty/i)),
        flavourText: text(find(rows, /flavor text/i)),
        watermark: text(find(rows, /watermark/i)),
      };
    });

    // Detect multipart type
    let multipart = undefined;
    if (cards.length > 1) {
      const titleName = $(".contentTitle").text().replace(/^\s+|\s+$/g, "");
      const combinedRules = cards.map((card) => card.rules).join('\n');
      multipart = {
        type: getMultipartType(titleName, combinedRules),
        cards: cards.filter((card) => card.name !== name).map((card) => card.name),
      };

      if (multipart.type === 'meld') {
        const match = combinedRules.match(/Melds with (.+)\.|creature named (.+), exile them/);
        if (match) {
          multipart.cards.push(match[1] || match[2]);
        }
      }
    }

    // Select correct card details
    const cardData = cards.length > 1 ? cards.find((card) => card.name === name) : cards[0];

    // Get card formats
    return scraper.getCardFormats(id).then((formats) => {
      return { ...cardData, formats: formats, multipart: multipart, name: name };
    });
  });
};

scraper.getCardFormats = function(id) {
  return scraper.requestPage(router.printings(id)).then(($) => {
    var formats = $(".cardList").last();
    var cardFormats = [];

    var formatFields = {};
    var i = 0;
    formats.find("tr.headerRow td").each(function() {
      var field = $(this).text().replace(/^\s+|\s+$/g, "")
      formatFields[field] = i++;
    });

    formats.find("tr.cardItem").each(function() {
      var row = $(this);
      var find = function(col) {
        return $(row.children("td").toArray()[formatFields[col]]);
      };

      cardFormats.push({
        format: find("Format").text().replace(/^\s+|\s+$/g, ""),
        legality: find("Legality").text().replace(/^\s+|\s+$/g, "")
      });
    });

    return cardFormats;
  });
};

module.exports = scraper;
