module.exports = function(app, async, util) {
  var search = {};

  search.run = function(params) {
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
        legalities: 'formats.legality',
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

  return search;
};
