const util = require('../util/util');

module.exports = function(app) {
  const search = {};

  search.run = function(params) {
    // Get required categories from the database
    return app.categories.get()

    // Perform the search
    .then(function() {
      const next = this;
      const trim = function(string) { return string.replace(/^ | $/g, ""); };
      const scrub = function(string) { return string.replace(/\s+/g, " "); };
      const normalise = function(string) { return string.toLowerCase().replace(/[^a-z0-9']/g, ""); };
      const firstUpper = function(string) { return string.charAt(0).toUpperCase() + string.slice(1); };
      const searchQuery = trim(scrub(params.query || ""));
      let terms = [];

      const keywords = {
        cost: {pattern: /^[0-9]+$/, criteria: function(keyword) { return {cmc: parseInt(keyword)}; }},
        colourless: {pattern: /^colou?rless$/i, criteria: function() { return {colourCount: 0}; }},
        monocoloured: {pattern: /^monocolou?red$/i, criteria: function() { return {colourCount: 1}; }},
        coloured: {pattern: /^colou?red$/i, criteria: function() { return {colourCount: {$gt: 0}}; }},
        multicoloured: {pattern: /^multicolou?red$/i, criteria: function() { return {colourCount: {$gt: 1}}; }},
        non: {
          pattern: /^non-?([a-z]+)$/i,
          criteria: function(keyword) {
            const colour = app.categories.name.Colour[firstUpper(normalise(keyword[1]))];
            const type = app.categories.name.Type[firstUpper(normalise(keyword[1]))];
            const subtype = app.categories.name.Subtype[firstUpper(normalise(keyword[1]))];
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
              app.categories.name.Type['Instant']._id,
              app.categories.name.Type['Sorcery']._id
            ]}}
          }
        },
        strength: {
          pattern: /^[0-9+\-^\*]*\/[0-9+\-^\*]*$/,
          criteria: function(keyword) {
            if (keyword === "/") return {};
            const strength = keyword.split("/");
            const criteria = {types: app.categories.name.Type['Creature']._id};
            if (strength[0] !== '') criteria['power'] = strength[0];
            if (strength[1] !== '') criteria['toughness'] = strength[1];
            return criteria;
          }
        },
      }

      // Splits the search query into terms, splitting quoted and non quoted words
      const tokens = searchQuery ? searchQuery.match(/[^"]+|["]/g) : [];

      let quote = false;
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
        const subterms = [];
        let match = false;
        let length;

        if (term.type !== 'words') return [term];

        while(term.words.length > 0) {
          match = false;

          for (length = term.words.length; length > 0; length--) {
            const subterm = term.words.slice(0, length);
            for (const category in app.categories.id) {
              for (const i in app.categories.id[category]) {
                const categoryItem = app.categories.id[category][i];
                const value = subterm.join(" ");
                for (const word in keywords) {
                  const search = keywords[word].pattern && value.match(keywords[word].pattern);
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

      if (params.format) {
        const format = app.categories.name.Format[params.format];
        if (format) terms.push({type: 'Format', obj: format});
      }

      const attrs = {
        Colour: 'colours',
        Type: 'types',
        Subtype: 'subtypes',
        Format: 'formats.format',
        Legality: 'formats.legality',
        Expansion: 'printings.expansion',
        Rarity: 'printings.rarity'
      };

      const criteria = [];
      terms.map(function(term) {
        if (term.type === 'rules') {
          const match = new RegExp("\\b"+util.regEscape(term.term)+"\\b", "i");
          criteria.push({$or: [{rules: match}, {name: match}]});
        }
        else if (term.type === 'keyword') {
          criteria.push(keywords[term.keyword].criteria(term.match));
        }
        else {
          criteria.push({ [attrs[term.type]]: term.obj._id });
        }
      });

      const conditions = criteria.length > 0 ? {'$and': criteria} : {};
      const query = app.models.Card.find(conditions).sort({'formats.format': 1});
      query.limit(20).skip((params.page - 1) * 20).then(function(cards) {
        app.models.Card.count(conditions, function(err, total) {
          next.success(cards, total);
        });
      });
    });
  };

  return search;
};
