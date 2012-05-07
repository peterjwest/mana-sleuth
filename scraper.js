module.exports = function(request, jsdom, jquery, util) {
  var scraper = {};

  // Gets the response of page and gives it to the callback function
  scraper.requestPage = function(uri, success) {
    var tries = 0;
    var threshold = 3;
    var attempt = function() {
      tries++;
      request({uri: uri}, function (error, response, html) {
        if (html) {
          jsdom.env(html, function (err, window) {
            success(jquery.create(window));
          });
        }
        else if (tries < threshold) attempt();
      });
    };
    attempt();
  };

  scraper.getCategories = function(url, success) {
    scraper.requestPage(url, function($) {
      var conditions = $(".advancedSearchTable tr");

      var find = function(search, negativeSearch) {
        var match = conditions.filter(function() {
          var text = $(this).find(".label2").text();
          return text.match(search) && (!negativeSearch || !text.match(negativeSearch));
        }).first();

        return match.find(".dynamicAutoComplete a").map(function() {
          return $(this).text().replace(/^\s+|\s+$/g, "");
        }).toArray();
      };

      success({
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

        card.printings.push({
          gathererId: $card.find(".nameLink").attr("href").match(/multiverseid=(\d+)/i)[1],
          artist: $card.find(".artist").text(),
          rarity: $card.find(".rarity").text()
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
      var card = {};

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
        return rows.filter(function() {
          var text = $(this).find(".label").text();
          return text.match(search) && (!negativeSearch || !text.match(negativeSearch));
        }).first().find(".value").textifyImages();
      };

      // Detect flip and transform cards
      if (details.length > 1) {
        multipart = {type: 'unknown'};
        var rules = find(details.find(".rightCol .row"), /text|rules/i).text();
        if (rules.match(/transform/i)) multipart.type = 'transform';
        if (rules.match(/flip/i)) multipart.type = 'flip';
        multipart.cards = [];
      }

      // Iterate through details
      details.each(function() {
        var rows = $(this).find(".rightCol .row");
        var strength = util.zip(text(find(rows, /P\/T/i)).split(/\s*\/\s*/), ["power", "toughness"]);

        card = {
          lastUpdated: new Date(),
          name: text(find(rows, /name/i)),
          cost: text(find(rows, /mana cost/i, /converted mana cost/i)),
          cmc: parseInt(text(find(rows, /converted mana cost/i))) || 0,
          rules: find(rows, /text|rules/i).children().map(function() { return text($(this)); }).toArray(),
          power: strength.power || '',
          toughness: strength.toughness || '',
          flavourText: text(find(rows, /flavor text/i)),
          watermark: text(find(rows, /watermark/i)),
          complete: true
        };

        var categories = util.zip(text(find(rows, /types/i)).split(/\s+—\s+/), ["types", "subtypes"]);

        card.types = (categories.types || "").split(/\s+/);
        // .map(function(type) {
        //   return collections.types[type];
        // }).filter(function(type) { return type; });

        card.subtypes = (categories.subtypes || "").split(/\s+/);
        // .map(function(subtype) {
        //   return collections.subtypes[subtype];
        // }).filter(function(subtype) { return subtype; });

        if (multipart) multipart.cards.push(card.name);
        cards.push(card);
      });

      // Detect split cards
      var name = $(".contentTitle").text().replace(/^\s+|\s+$/g, "");
      if (name.match(/\/\//)) {
        multipart = {type: 'split'};
        var names = name.split(/\s*\/\/\s*/);
        multipart.cards = [card.name, util.alternate(names, card.name)];
      }

      // Get card legalities
      scraper.getCardLegalities(urls.printings, function(legalities) {
        cards.map(function(card) {
          card.legalities = legalities;
        });

        success({cards: cards, multipart: multipart});
      });
    });
  };

  scraper.getCardLegalities = function(url, success) {
    scraper.requestPage(url, function($) {
      var formats = $(".cardList:last");
      var legalities = [];

      var formatFields = {};
      formats.find("tr.headerRow td").each(function() {
        var field = $(this).text().replace(/^\s+|\s+$/g, "")
        formatFields[field] = $(this).prevAll().length;
      });

      formats.find("tr.cardItem").each(function() {
        var row = $(this);
        var find = function(col) {
          return row.children("td").eq(formatFields[col])
        };
        legalities.push({
          format: find("Format").text().replace(/^\s+|\s+$/g, ""),
          legality: find("Legality").text().replace(/^\s+|\s+$/g, "")
        });
        //var legality = new models.Legality();
        // legality.set({
        //   format: collections.formats[values.format],
        //   legality: values.legality
        // });
      });

      success(legalities);
    });
  };

  return scraper;
};