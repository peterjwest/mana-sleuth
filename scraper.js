module.exports = function(request, cheerio, util) {
  var scraper = {};

  // Gets the response of page and gives it to the callback function
  scraper.requestPage = function(uri, success) {
    var tries = 0;
    var threshold = 3;
    var attempt = function() {
      tries++;
      request({uri: uri}, function (error, response, html) {
        if (html) success(cheerio.load(html));
        else if (tries < threshold) attempt();
      });
    };
    attempt();
  };

  scraper.getCategories = function(url, success) {
    scraper.requestPage(url, function($) {
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

      success({
        Colour: find(/color/i),
        Expansion: find(/set|expansion/i),
        Format: find(/format/i),
        Block: find(/block/i),
        Type: find(/type/i, /subtype/i),
        Subtype: find(/subtype/i),
        Rarity: find(/rarity/i)
      });
    });
  };

  scraper.getExpansionCards = function(url, success) {
    scraper.requestPage(url, function($) {
      var cards = {};
      $(".cardItem").each(function() {
        var $card = $(this);
        var name = $card.find(".name").text();
        var card = cards[name] || {printings: []};
        cards[name] = card;

        card.lastUpdated = new Date();
        card.name = name;
        card.colours = $card.find(".color").text().split("/");

        // Map rarity letters to words
        var rarities = {
          L: 'Land',
          C: 'Common',
          U: 'Uncommon',
          R: 'Rare',
          M: 'Mythic Rare',
          P: 'Promo',
          S: 'Special'
        };

        card.printings.push({
          gathererId: $card.find(".nameLink").attr("href").match(/multiverseid=(\d+)/i)[1],
          artist: $card.find(".artist").text(),
          rarity: rarities[$card.find(".rarity").text()]
        });
      });
      success(util.values(cards));
    });
  };

  scraper.getCardDetails = function(urls, success) {
    scraper.requestPage(urls.details, function($) {
      var cards = [];
      var multipart = false;
      var details = $(".cardDetails");

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
        return $(rows.toArray().filter(function(self) {
          var text = $(self).find(".label").text();
          return text.match(search) && (!negativeSearch || !text.match(negativeSearch));
        })[0]).find(".value").textifyImages();
      };

      // Iterate through details
      var cards = details.toArray().map(function(self) {
        var rows = $(self).find(".rightCol .row");
        var strength = util.zip(
          text(find(rows, /P\/T/i)).split(/ \/ /),
          ["power", "toughness"]
        );

        var card = {
          lastUpdated: new Date(),
          name: text(find(rows, /name/i)),
          cost: text(find(rows, /mana cost/i, /converted mana cost/i)),
          cmc: parseFloat(text(find(rows, /converted mana cost/i))) || 0,
          rules: find(rows, /text|rules/i, /flavor text/i).children().toArray()
            .map(function(self) { return text($(self)); })
            .filter(function(rule) { return rule; }),
          power: strength.power || '',
          toughness: strength.toughness || '',
          flavourText: text(find(rows, /flavor text/i)),
          watermark: text(find(rows, /watermark/i)),
          complete: true
        };

        var categories = util.zip(
          text(find(rows, /types/i)).split(/\s+—\s+/),
          ["types", "subtypes"]
        );
        card.types = (categories.types || "").split(/\s+/);
        card.subtypes = (categories.subtypes || "").split(/\s+/);

        return card;
      });

      // Detect flip and transform cards
      if (cards.length > 1) {
        multipart = {type: 'unknown'};
        var rules = find(details.find(".rightCol .row"), /text|rules/i).text();
        if (rules.match(/transform/i)) multipart.type = 'transform';
        if (rules.match(/flip/i)) multipart.type = 'flip';
        multipart.cards = cards.map(util.key('name'));
      }

      // Detect split cards
      var name = $(".contentTitle").text().replace(/^\s+|\s+$/g, "");
      if (name.match(/\/\//)) {
        multipart = {type: 'split'};
        var names = name.split(/\s*\/\/\s*/);
        multipart.cards = [cards[0].name, util.alternate(names, cards[0].name)];
      }

      // Get card legalities
      scraper.getCardLegalities(urls.printings, function(legalities) {
        cards.map(function(card) {
          card.legalities = legalities;
        });

        details = null;
        $ = null;
        success({cards: cards, multipart: multipart});
      });
    });
  };

  scraper.getCardLegalities = function(url, success) {
    scraper.requestPage(url, function($) {
      var formats = $(".cardList:last");
      var legalities = [];

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

        legalities.push({
          format: find("Format").text().replace(/^\s+|\s+$/g, ""),
          legality: find("Legality").text().replace(/^\s+|\s+$/g, "")
        });
      });

      formats = null;
      $ = null;
      success(legalities);
    });
  };

  return scraper;
};