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
        var urls = {
          details: app.router.card(card.gathererId()),
          printings: app.router.printings(card.gathererId())
        };

        app.scraper.getCardDetails(urls, this.success);
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
          var urls = {
            details: app.router.card(card.gathererId(), altCard.name),
            printings: app.router.printings(card.gathererId())
          };
          app.scraper.getCardDetails(urls, function(data) {
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

  cards.search = function(params) {
    // Get required categories from the database
    return app.categories.get()

    // Perform the search
    .then(function() {
      var next = this;
      var trim = function(string) { return string.replace(/^ | $/g, ""); };
      var scrub = function(string) { return string.replace(/\s+/g, " "); };
      var normalise = function(string) { return string.toLowerCase().replace(/[^a-z0-9']/g, ""); };
      var firstUpper = function(string) { return string.charAt(0).toUpperCase() + string.slice(1); };
      var terms = [];
      var query = trim(scrub(params.query || ""));

      var keywords = {
        cost: {pattern: /^[0-9]+$/, criteria: function(keyword) { return {cmc: parseInt(keyword)}; }},
        colourless: {pattern: /^colou?rless$/i, criteria: function() { return {colourCount: 0}; }},
        monocoloured: {pattern: /^monocolou?red$/i, criteria: function() { return {colourCount: 1}; }},
        coloured: {pattern: /^colou?red$/i, criteria: function() { return {colourCount: {$gt: 0}}; }},
        multicoloured: {pattern: /^multicolou?red$/i, criteria: function() { return {colourCount: {$gt: 1}}; }},
        non: {
          pattern: /^non-?([a-z]+)$/i,
          criteria: function(keyword) {
            var colour = app.categories.name.colours[firstUpper(normalise(keyword[1]))];
            var type = app.categories.name.types[firstUpper(normalise(keyword[1]))];
            var subtype = app.categories.name.subtypes[firstUpper(normalise(keyword[1]))];
            if (colour) return {colours: {$nin: [colour._id]}};
            if (type) return {types: {$nin: [type._id]}};
            if (subtype) return {subtypes: {$nin: [subtype._id]}};
            return {type: 'rules', term: keyword[0]};
          }
        },
        permanent: {
          pattern: /^permanent$/i,
          criteria: function() {
            return {types: {$nin: [
              app.categories.name.types['Instant']._id,
              app.categories.name.types['Sorcery']._id
            ]}}
          }
        },
        strength: {
          pattern: /^[0-9+\-^\*]*\/[0-9+\-^\*]*$/,
          criteria: function(keyword) {
            if (keyword === "/") return {};
            var strength = keyword.split("/");
            var criteria = {types: app.categories.name.types['Creature']._id};
            if (strength[0] !== '') criteria['power'] = strength[0];
            if (strength[1] !== '') criteria['toughness'] = strength[1];
            return criteria;
          }
        }
      }

      if (query) {
        // Splits the search query into terms, splitting quoted and non quoted words
        var tokens = query.match(/[^"]+|["]/g);
        var quote = false;
        tokens.map(trim).filter(util.self).map(function(token) {
          if (token === quote) quote = false;
          else if (token.match("\"")) quote = token;
          else {
            if (quote) terms.push({type: 'rules', term: token});
            else terms.push({type: 'words', words: token.split(" ")});
          }
        });

        // Detects category keywords for non quoted terms
        terms = terms.map(function(term) {
          var subterms = [];
          var subterm, length, categoryItem, value;
          var match = false, keyword = false, search;

          if (term.type !== 'words') return [term];

          while(term.words.length > 0) {
            match = false;

            for (length = term.words.length; length > 0; length--) {
              subterm = term.words.slice(0, length);
              for (category in app.categories.id) {
                for (i in app.categories.id[category]) {
                  categoryItem = app.categories.id[category][i];
                  value = subterm.join(" ");
                  keyword = false;
                  for (word in keywords) {
                    search = value.match(keywords[word].pattern);
                    if (search) {
                      match = {
                        type: 'keyword', keyword: word,
                        match: search
                      };
                    }
                  };
                  if (!match && normalise(value) == normalise(categoryItem.name || "")) {
                    match = {type: category, obj: categoryItem};
                  }
                }
              }
              if (match) break;
            }
            if (match) subterms.push(match);
            else {
              subterms.push({type: 'rules', term: term.words[0]});
              length = 1;
            }

            term.words = term.words.slice(length);
          }
          return subterms;
        }).reduce(function(a, b) { return a.concat(b); }, []);
      }

      var mongoAttrs = {
        colours: 'colours',
        types: 'types',
        subtypes: 'subtypes',
        formats: 'formats.format',
        expansions: 'printings.expansion',
        rarities: 'printings.rarity'
      };

      var criteria =  [];
      terms.map(function(term) {
        if (term.type === 'rules') {
          var match = new RegExp("\\b"+util.regEscape(term.term)+"\\b", "i");
          criteria.push({$or: [{rules: match}, {name: match}]});
        }
        else if (term.type === 'keyword') {
          criteria.push(keywords[term.keyword].criteria(term.match));
        }
        else {
          var obj = {};
          obj[mongoAttrs[term.type]] = term.obj._id;
          criteria.push(obj);
        }
      });

      var conditions = criteria.length > 0 ? {'$and': criteria} : {};
      app.models.Card.find(conditions).skip((params.page - 1) * 20).limit(20).sort('name', 1).run(function(err, cards) {
        app.models.Card.count(conditions, function(err, total) {
          next.success(cards, total);
        });
      });
    });
  };

  return cards;
};
