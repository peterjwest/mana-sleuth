// This file corrects incorrect or incomplete content from the gatherer database
var corrections = exports;

// These are additions for categories (e.g. type, subtype) not included in the gatherer database
corrections.additions = {
  Type: [
    {gathererName: "Token", genuine: true},
    {gathererName: "Eaturecray", genuine: false}
  ],
  Subtype: [
    {gathererName: "The Biggest, Baddest, Nastiest, Scariest Creature You'll Ever See", genuine: false},
    {gathererName: "Donkey", genuine: false},
    {gathererName: "Lord", genuine: false},
    {gathererName: "Igpay", genuine: false},
    {gathererName: "Townsfolk", genuine: false},
    {gathererName: "Chicken", genuine: false},
    {gathererName: "Egg", genuine: false},
    {gathererName: "Gamer", genuine: false},
    {gathererName: "Clamfolk", genuine: false},
    {gathererName: "Elves", genuine: false},
    {gathererName: "Hero", genuine: false},
    {gathererName: "Bureaucrat", genuine: false},
    {gathererName: "Goblins", genuine: false},
    {gathererName: "Mime", genuine: false},
    {gathererName: "Cow", genuine: false},
    {gathererName: "Child", genuine: false},
    {gathererName: "Lady of Proper Etiquette", genuine: false},
    {gathererName: "Waiter", genuine: false},
    {gathererName: "Dinosaur", genuine: false},
    {gathererName: "Paratrooper", genuine: false},
    {gathererName: "Designer", genuine: false},
    {gathererName: "Ship", genuine: false},
    {gathererName: "Mummy", genuine: false},
    {gathererName: "Gus", genuine: false}
  ]
};

// These are removals for invald categories in the gatherer database
corrections.removals = {
  Type: [
    {gathererName: "Plane"},
    {gathererName: "Ongoing"},
    {gathererName: "Vanguard"},
    {gathererName: "Scheme"},
  ],
  Subtype: [
    {gathererName: "Shadowmoor"},
    {gathererName: "Lorwyn"},
    {gathererName: "Mirrodin"},
    {gathererName: "Zendikar"},
  ],
  Colour: [
    {gathererName: "Colorless"}
  ],
  Rarity: [
    {gathererName: "Promo"},
    {gathererName: "Land"}
  ],
  Expansion: [
    {gathererName: "Vanguard"},
    {gathererName: "Promo set for Gatherer"}
  ]
};

corrections.replacements = {
  // Updates names and adds release dates for expansions
  Expansion: {
    'Alara Reborn': {released: new Date('April 30 ,2009')},
    'Alliances': {released: new Date('June 10, 1996')},
    'Anthologies': {released: new Date('November 1, 1998')},
    'Antiquities': {released: new Date('March 1, 1994')},
    'Apocalypse': {released: new Date('June 4, 2001')},
    'Arabian Nights': {released: new Date('December 1, 1993')},
    'Archenemy': {released: new Date('June 18, 2010')},
    'Avacyn Restored': {released: new Date('May 4, 2012')},
    'Betrayers of Kamigawa': {released: new Date('February 4, 2005')},
    'Champions of Kamigawa': {released: new Date('October 1, 2004')},
    'Chronicles': {released: new Date('July 1 1995')},
    'Classic Sixth Edition': {released: new Date('April 28, 1999')},
    'Coldsnap': {released: new Date('July 21, 2006')},
    'Conflux': {released: new Date('February 6, 2009')},
    'Dark Ascension': {released: new Date('February 3, 2012')},
    'Darksteel': {released: new Date('February 6, 2004')},
    'Dissension': {released: new Date('May 5, 2006')},
    'Duel Decks: Ajani vs. Nicol Bolas': {released: new Date('September 2, 2011')},
    'Duel Decks: Divine vs. Demonic': {released: new Date('April 10, 2009')},
    'Duel Decks: Elspeth vs. Tezzeret': {released: new Date('September 3, 2010')},
    'Duel Decks: Elves vs. Goblins': {released: new Date('November 16, 2007')},
    'Duel Decks: Garruk vs. Liliana': {released: new Date('October 30, 2009')},
    'Duel Decks: Jace vs. Chandra': {released: new Date('November 7, 2008')},
    'Duel Decks: Knights vs. Dragons': {released: new Date('April 1, 2011')},
    'Duel Decks: Phyrexia vs. the Coalition': {released: new Date('March 19, 2010')},
    'Duel Decks: Venser vs. Koth': {released: new Date('March 30, 2012')},
    'Eighth Edition': {released: new Date('July 28, 2003')},
    'Eventide': {released: new Date('July 25, 2008')},
    'Exodus': {released: new Date('June 15, 1998')},
    'Fallen Empires': {released: new Date('November 1, 1994')},
    'Fifth Dawn': {released: new Date('June 4, 2004')},
    'Fifth Edition': {released: new Date('March 24, 1997')},
    'Fourth Edition': {released: new Date('April 1, 1995')},
    'From the Vault: Dragons': {released: new Date('August 29, 2008')},
    'From the Vault: Exiled': {released: new Date('August 28, 2009')},
    'From the Vault: Legends': {released: new Date('August 26, 2011')},
    'From the Vault: Relics': {released: new Date('August 27, 2010')},
    'Future Sight': {released: new Date('May 4, 2007')},
    'Guildpact': {released: new Date('February 3, 2006')},
    'Homelands': {released: new Date('October 1, 1995')},
    'Ice Age': {released: new Date('June 1, 1995')},
    'Innistrad': {released: new Date('September 30, 2011')},
    'Invasion': {released: new Date('October 2, 2000')},
    'Judgment': {released: new Date('May 27, 2002')},
    'Legends': {released: new Date('June 1, 1994')},
    'Legions': {released: new Date('February 3, 2003')},
    'Limited Edition Alpha': {released: new Date('August 5, 1993')},
    'Limited Edition Beta': {released: new Date('October 1, 1993')},
    'Lorwyn': {released: new Date('October 12, 2007')},
    'Magic 2010': {released: new Date('July 17, 2009')},
    'Magic 2011': {released: new Date('July 16, 2010')},
    'Magic 2012': {released: new Date('July 15, 2011')},
    'Masters Edition': {released: new Date('September 10, 2007')},
    'Masters Edition II': {released: new Date('September 22, 2008')},
    'Masters Edition III': {released: new Date('September 7, 2009')},
    'Masters Edition IV': {released: new Date('January 10, 2011')},
    'Mercadian Masques': {released: new Date('October 4, 1999')},
    'Mirage': {released: new Date('October 7, 1996')},
    'Mirrodin': {released: new Date('October 3, 2003')},
    'Mirrodin Besieged': {released: new Date('February 4, 2011')},
    'Morningtide': {released: new Date('February 1, 2008')},
    'Nemesis': {released: new Date('February 14, 2000')},
    'New Phyrexia': {released: new Date('May 13, 2011')},
    'Ninth Edition': {released: new Date('July 29, 2005')},
    'Odyssey': {released: new Date('October 1, 2001')},
    'Onslaught': {released: new Date('October 7, 2002')},
    'Planar Chaos': {released: new Date('February 2, 2007')},
    'Planechase': {released: new Date('September 4, 2009')},
    'Planechase 2012 Edition': {released: new Date('June 1, 2012')},
    'Planeshift': {released: new Date('February 5, 2001')},
    'Portal': {released: new Date('June 1, 1997')},
    'Portal Second Age': {released: new Date('June 1, 1998')},
    'Portal Three Kingdoms': {released: new Date('May 1, 1999')},
    'Premium Deck Series: Fire and Lightning': {released: new Date('November 19, 2010')},
    'Premium Deck Series: Graveborn': {released: new Date('November 18, 2011')},
    'Premium Deck Series: Slivers': {released: new Date('November 20, 2009')},
    'Prophecy': {released: new Date('June 5, 2000')},
    'Ravnica: City of Guilds': {released: new Date('October 7, 2005')},
    'Revised Edition': {released: new Date('April 1, 1994')},
    'Rise of the Eldrazi': {released: new Date('April 23, 2010')},
    'Saviors of Kamigawa': {released: new Date('June 3, 2005')},
    'Scars of Mirrodin': {released: new Date('October 1, 2010')},
    'Scourge': {released: new Date('May 26, 2003')},
    'Seventh Edition': {released: new Date('April 11, 2001')},
    'Shadowmoor': {released: new Date('May 2, 2008')},
    'Shards of Alara': {released: new Date('October 3, 2008')},
    'Starter 1999': {released: new Date('July 1, 1999')},
    'Starter 2000': {released: new Date('July 1, 2000')},
    'Stronghold': {released: new Date('March 2, 1998')},
    'Tempest': {released: new Date('October 13, 1997')},
    'Tenth Edition': {released: new Date('July 13, 2007')},
    'The Dark': {released: new Date('August 1, 1994')},
    'Time Spiral': {released: new Date('October 6, 2006')},
    'Time Spiral "Timeshifted"': {released: new Date('September 23, 2006')},
    'Torment': {released: new Date('February 4, 2002')},
    'Unglued': {released: new Date('August 17, 1998')},
    'Unhinged': {released: new Date('November 19, 2004')},
    'Unlimited Edition': {released: new Date('December 1 1993')},
    'Urza\'s Destiny': {released: new Date('June 7, 1999')},
    'Urza\'s Legacy': {released: new Date('February 15, 1999')},
    'Urza\'s Saga': {released: new Date('October 12, 1998')},
    'Visions': {released: new Date('February 3, 1997')},
    'Weatherlight': {released: new Date('June 9, 1997')},
    'Worldwake': {released: new Date('February 5, 2010')},
    'Zendikar': {released: new Date('October 2, 2009')},
    'Battle Royale Box Set': {name: 'Battle Royale', released: new Date('November 12 1999')},
    'Beatdown Box Set': {name: 'Beatdown', released: new Date('December 1 2000')},
    'Magic: The Gathering-Commander': {name: 'Commander', released: new Date('June 17 2011')}
  },

  // These replace outdated types with their modern equivalent
  Type: {
    'Interrupt': {types: ['Instant']},
    'Summon Legend': {types: ['Legendary', 'Creature']},
    'Summon': {types: ['Creature']},
    'Enchant Creature': {types: ['Enchantment'], subtypes: ['Aura']},
    'Enchant Player': {types: ['Enchantment'], subtypes: ['Aura']},
    '(none)': {types: ['Token']}
  },

  // Removes the erratically used 'Land' rarity, and the once used 'Promo' rarity
  Rarity: {
    'Land': {rarity: 'Common'},
    'Promo': {rarity: 'Special'}
  },

  // Fixes for cards, predominantly in the unglued/unhinged set
  Card: {
    "B.F.M. (Big Furry Monster)": {
      subtypes: ["The Biggest, Baddest, Nastiest, Scariest Creature You'll Ever See"],
      rules: [
        "You must play both B.F.M. cards to put B.F.M. into play. "+
        "If either B.F.M. card leaves play, sacrifice the other.",
        "B.F.M. can be blocked only by three or more creatures."
      ],
      flavourText:
        "\"It was big. Really, really big. No, bigger than that. Even bigger. "+
        "Keep going. More. No, more. Look, we're talking krakens and dreadnoughts for jewelry. "+
        "It was big\"\n-Arna Kennerd, skyknight",
      multipart: {type: 'double'},
      printings: [
        {gathererId: 9780},
        {gathererId: 9844},
      ]
    },
    "Look at Me, I'm R&D": {
      printings: [{artist: 'spork;'}]
    },
    "Miss Demeanor": {
      subtypes: ["Lady of Proper Etiquette"]
    },
    "Little Girl": {
      cost: "{1/2W}"
    },
    "Forest": { rules: [] },
    "Mountain": { rules: [] },
    "Swamp": { rules: [] },
    "Plains": { rules: [] },
    "Island": { rules: [] },
    "Snow-Covered Forest": { rules: [] },
    "Snow-Covered Mountain": { rules: [] },
    "Snow-Covered Swamp": { rules: [] },
    "Snow-Covered Plains": { rules: [] },
    "Snow-Covered Island": { rules: [] }
  }
};