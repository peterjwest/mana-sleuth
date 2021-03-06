// This file corrects incorrect or incomplete content from the gatherer database
const corrections = {};

// These are additions for categories (e.g. type, subtype) not included in the gatherer database
corrections.additions = {
  Type: [
    {name: "Token"},
    {name: "Eaturecray"},
    {name: "Host"}
  ],
  Subtype: [
    {name: "The Biggest, Baddest, Nastiest, Scariest Creature You'll Ever See"},
    {name: "Lady of Proper Etiquette"},
  ],
  Legality: [
    {name: "Legal"},
    {name: "Restricted"},
    {name: "Banned"},
  ],
};

// These are removals for invald categories in the gatherer database
corrections.removals = {
  Colour: [
    {name: "Colorless"}
  ],
  Rarity: [
    {name: "Promo"},
    {name: "Land"}
  ],
  Type: [
    {name: 'Summon'},
    {name: 'Scariest'},
    {name: 'You\'ll'},
    {name: 'Ever'},
    {name: 'See'},
  ],
  Subtype: [
    {name: 'The'},
    {name: 'Biggest,'},
    {name: 'Baddest,'},
    {name: 'and/or'},
    {name: 'Bolas\'s'},
    {name: 'Lady'},
    {name: 'of'},
    {name: 'Proper'},
    {name: 'Etiquette'},
    {name: 'ir'},
  ],
  Card: [
    {name: 'Curse of the Fire Penguin Creature'},
  ],
};

// Missing from gatherer:
// 'Anthologies': {released: new Date('November 1, 1998')},

corrections.replacements = {
  // Updates names and adds release dates for expansions
  Expansion: {
    'Aether Revolt': {released: new Date('January 20, 2017')},
    'Alara Reborn': {released: new Date('April 30, 2009')},
    'Alliances': {released: new Date('June 10, 1996')},
    'Amonkhet': {released: new Date('April 28, 2017')},
    'Antiquities': {released: new Date('March 1, 1994')},
    'Apocalypse': {released: new Date('June 4, 2001')},
    'Arabian Nights': {released: new Date('December 1, 1993')},
    'Archenemy': {released: new Date('June 18, 2010')},
    'Archenemy: Nicol Bolas': {released: new Date('June 16, 2017')},
    'Avacyn Restored': {released: new Date('May 4, 2012')},
    'Battle Royale Box Set': {name: 'Battle Royale', released: new Date('November 12, 1999')},
    'Battle for Zendikar': {released: new Date('October 2, 2015')},
    'Battlebond': {released: new Date('June 8, 2018')},
    'Beatdown Box Set': {name: 'Beatdown', released: new Date('December 1, 2000')},
    'Betrayers of Kamigawa': {released: new Date('February 4, 2005')},
    'Born of the Gods': {released: new Date('February 7, 2014')},
    'Champions of Kamigawa': {released: new Date('October 1, 2004')},
    'Chronicles': {released: new Date('July 1, 1995')},
    'Classic Sixth Edition': {released: new Date('April 28, 1999')},
    'Coldsnap': {released: new Date('July 21, 2006')},
    'Commander 2013 Edition': {released: new Date('November 1, 2013')},
    'Commander 2014': {released: new Date('November 7, 2014')},
    'Commander 2015': {released: new Date('November 13, 2015')},
    'Commander 2016': {released: new Date('November 11, 2016')},
    'Commander 2017': {released: new Date('August 25, 2017')},
    'Commander 2018': {released: new Date('August 10, 2018')},
    'Commander Anthology': {released: new Date('June 9, 2017')},
    'Commander Anthology 2018': {released: new Date('June 8, 2018')},
    'Commander\'s Arsenal': {released: new Date('November 2, 2012')},
    'Conflux': {released: new Date('February 6, 2009')},
    'Conspiracy: Take the Crown': {released: new Date('August 26, 2016')},
    'Core Set 2019': {released: new Date('July 13, 2018')},
    'Dark Ascension': {released: new Date('February 3, 2012')},
    'Darksteel': {released: new Date('February 6, 2004')},
    'Dissension': {released: new Date('May 5, 2006')},
    'Dominaria': {released: new Date('April 27, 2018')},
    'Dragon\'s Maze': {released: new Date('May 3, 2013')},
    'Dragons of Tarkir': {released: new Date('March 27, 2015')},
    'Duel Decks Anthology, Divine vs. Demonic': {released: new Date('December 5, 2014')},
    'Duel Decks Anthology, Elves vs. Goblins': {released: new Date('November 16, 2007')},
    'Duel Decks Anthology, Garruk vs. Liliana': {released: new Date('October 30, 2009')},
    'Duel Decks Anthology, Jace vs. Chandra': {released: new Date('December 5, 2014')},
    'Duel Decks: Ajani vs. Nicol Bolas': {released: new Date('September 2, 2011')},
    'Duel Decks: Blessed vs. Cursed': {released: new Date('February 26, 2016')},
    'Duel Decks: Divine vs. Demonic': {released: new Date('April 10, 2009')},
    'Duel Decks: Elspeth vs. Kiora': {released: new Date('February 27, 2015')},
    'Duel Decks: Elspeth vs. Tezzeret': {released: new Date('September 3, 2010')},
    'Duel Decks: Elves vs. Goblins': {released: new Date('November 16, 2007')},
    'Duel Decks: Elves vs. Inventors': {released: new Date('April 6, 2018')},
    'Duel Decks: Garruk vs. Liliana': {released: new Date('October 30, 2009')},
    'Duel Decks: Heroes vs. Monsters': {released: new Date('September 6, 2013')},
    'Duel Decks: Izzet vs. Golgari': {released: new Date('September 7, 2012')},
    'Duel Decks: Jace vs. Chandra': {released: new Date('November 7, 2008')},
    'Duel Decks: Jace vs. Vraska': {released: new Date('March 14, 2014')},
    'Duel Decks: Knights vs. Dragons': {released: new Date('April 1, 2011')},
    'Duel Decks: Merfolk vs. Goblins': {released: new Date('November 10, 2017')},
    'Duel Decks: Mind vs. Might': {released: new Date('March 31, 2017')},
    'Duel Decks: Nissa vs. Ob Nixilis': {released: new Date('September 2, 2016')},
    'Duel Decks: Phyrexia vs. the Coalition': {released: new Date('March 19, 2010')},
    'Duel Decks: Sorin vs. Tibalt': {released: new Date('March 15, 2013')},
    'Duel Decks: Speed vs. Cunning': {released: new Date('September 5, 2014')},
    'Duel Decks: Venser vs. Koth': {released: new Date('March 30, 2012')},
    'Duel Decks: Zendikar vs. Eldrazi': {released: new Date('August 28, 2015')},
    'Eighth Edition': {released: new Date('July 28, 2003')},
    'Eldritch Moon': {released: new Date('July 22, 2016')},
    'Eternal Masters': {released: new Date('June 10, 2016')},
    'Eventide': {released: new Date('July 25, 2008')},
    'Exodus': {released: new Date('June 15, 1998')},
    'Explorers of Ixalan': {released: new Date('November 24, 2017')},
    'Fallen Empires': {released: new Date('November 1, 1994')},
    'Fate Reforged': {released: new Date('January 23, 2015')},
    'Fifth Dawn': {released: new Date('June 4, 2004')},
    'Fifth Edition': {released: new Date('March 24, 1997')},
    'Fourth Edition': {released: new Date('April 1, 1995')},
    'From the Vault: Angels': {released: new Date('August 21, 2015')},
    'From the Vault: Annihilation (2014)': {name: 'From the Vault: Annihilation', released: new Date('August 22, 2014')},
    'From the Vault: Dragons': {released: new Date('August 29, 2008')},
    'From the Vault: Exiled': {released: new Date('August 28, 2009')},
    'From the Vault: Legends': {released: new Date('August 26, 2011')},
    'From the Vault: Lore': {released: new Date('August 19, 2016')},
    'From the Vault: Realms': {released: new Date('August 31, 2012')},
    'From the Vault: Relics': {released: new Date('August 27, 2010')},
    'From the Vault: Transform': {released: new Date('November 24, 2017')},
    'From the Vault: Twenty': {released: new Date('August 23, 2013')},
    'Future Sight': {released: new Date('May 4, 2007')},
    'Game Night': {released: new Date('November 16, 2018')},
    'Gatecrash': {released: new Date('February 1, 2013')},
    'Gift Pack': {released: new Date('November 16, 2018')},
    'Global Series: Jiang Yanggu and Mu Yanling': {released: new Date('June 22, 2018')},
    'Guild Kit: Boros': {released: new Date('November 2, 2018')},
    'Guild Kit: Dimir': {released: new Date('November 2, 2018')},
    'Guild Kit: Golgari': {released: new Date('November 2, 2018')},
    'Guild Kit: Izzet': {released: new Date('November 2, 2018')},
    'Guild Kit: Selesnya': {released: new Date('November 2, 2018')},
    'Guildpact': {released: new Date('February 3, 2006')},
    'Guilds of Ravnica': {released: new Date('October 5, 2018')},
    'Guilds of Ravnica Mythic Edition': {released: new Date('October 3, 2018')},
    'Homelands': {released: new Date('October 1, 1995')},
    'Hour of Devastation': {released: new Date('July 14, 2017')},
    'Ice Age': {released: new Date('June 1, 1995')},
    'Iconic Masters': {released: new Date('November 17, 2017')},
    'Innistrad': {released: new Date('September 30, 2011')},
    'Invasion': {released: new Date('October 2, 2000')},
    'Ixalan': {released: new Date('September 29, 2017')},
    'Journey into Nyx': {released: new Date('May 2, 2014')},
    'Judgment': {released: new Date('May 27, 2002')},
    'Kaladesh': {released: new Date('	September 30, 2016')},
    'Khans of Tarkir': {released: new Date('September 26, 2014')},
    'Legends': {released: new Date('June 1, 1994')},
    'Legions': {released: new Date('February 3, 2003')},
    'Limited Edition Alpha': {released: new Date('August 5, 1993')},
    'Limited Edition Beta': {released: new Date('October 1, 1993')},
    'Lorwyn': {released: new Date('October 12, 2007')},
    'Magic 2010': {released: new Date('July 17, 2009')},
    'Magic 2011': {released: new Date('July 16, 2010')},
    'Magic 2012': {released: new Date('July 15, 2011')},
    'Magic 2013': {released: new Date('July 13, 2012')},
    'Magic 2014 Core Set': {name: 'Magic 2014', released: new Date('July 19, 2013')},
    'Magic 2015 Core Set': {name: 'Magic 2015', released: new Date('July 18, 2014')},
    'Magic Origins': {released: new Date('July 17, 2015')},
    'Magic: The Gathering-Commander': {name: 'Commander', released: new Date('June 17 2011')},
    'Magic: The Gathering—Conspiracy': {name: 'Conspiracy', released: new Date('June 6, 2014')},
    'Masterpiece Series: Amonkhet Invocations': {released: new Date('April 28, 2017	')},
    'Masterpiece Series: Kaladesh Inventions': {released: new Date('September 30, 2016')},
    'Masters 25': {released: new Date('March 16, 2018')},
    'Masters Edition': {released: new Date('September 10, 2007')},
    'Masters Edition II': {released: new Date('September 22, 2008')},
    'Masters Edition III': {released: new Date('September 7, 2009')},
    'Masters Edition IV': {released: new Date('January 10, 2011')},
    'Mercadian Masques': {released: new Date('October 4, 1999')},
    'Mirage': {released: new Date('October 7, 1996')},
    'Mirrodin': {released: new Date('October 3, 2003')},
    'Mirrodin Besieged': {released: new Date('February 4, 2011')},
    'Modern Event Deck 2014': {name: 'Modern Event Deck', released: new Date('May 30, 2014')},
    'Modern Masters': {released: new Date('June 7, 2013')},
    'Modern Masters 2015 Edition': {released: new Date('May 22, 2015')},
    'Modern Masters 2017 Edition': {released: new Date('March 17, 2017')},
    'Morningtide': {released: new Date('February 1, 2008')},
    'Nemesis': {released: new Date('February 14, 2000')},
    'New Phyrexia': {released: new Date('May 13, 2011')},
    'Ninth Edition': {released: new Date('July 29, 2005')},
    'Oath of the Gatewatch': {released: new Date('January 22, 2016')},
    'Odyssey': {released: new Date('October 1, 2001')},
    'Onslaught': {released: new Date('October 7, 2002')},
    'Planar Chaos': {released: new Date('February 2, 2007')},
    'Planechase': {released: new Date('September 4, 2009')},
    'Planechase 2012 Edition': {released: new Date('June 1, 2012')},
    'Planechase Anthology': {released: new Date('November 25, 2016')},
    'Planeshift': {released: new Date('February 5, 2001')},
    'Portal': {released: new Date('June 1, 1997')},
    'Portal Second Age': {released: new Date('June 1, 1998')},
    'Portal Three Kingdoms': {released: new Date('May 1, 1999')},
    'Premium Deck Series: Fire and Lightning': {released: new Date('November 19, 2010')},
    'Premium Deck Series: Graveborn': {released: new Date('November 18, 2011')},
    'Premium Deck Series: Slivers': {released: new Date('November 20, 2009')},
    'Promo set for Gatherer': {name: 'Promo cards'},
    'Prophecy': {released: new Date('June 5, 2000')},
    'Ravnica: City of Guilds': {released: new Date('October 7, 2005')},
    'Return to Ravnica': {released: new Date('October 5, 2012')},
    'Revised Edition': {released: new Date('April 1, 1994')},
    'Rise of the Eldrazi': {released: new Date('April 23, 2010')},
    'Rivals of Ixalan': {released: new Date('January 19, 2018')},
    'Saviors of Kamigawa': {released: new Date('June 3, 2005')},
    'Scars of Mirrodin': {released: new Date('October 1, 2010')},
    'Scourge': {released: new Date('May 26, 2003')},
    'Seventh Edition': {released: new Date('April 11, 2001')},
    'Shadowmoor': {released: new Date('May 2, 2008')},
    'Shadows over Innistrad': {released: new Date('April 8, 2016')},
    'Shards of Alara': {released: new Date('October 3, 2008')},
    'Signature Spellbook: Jace': {released: new Date('June 15, 2018')},
    'Starter 1999': {released: new Date('July 1, 1999')},
    'Starter 2000': {released: new Date('July 1, 2000')},
    'Stronghold': {released: new Date('March 2, 1998')},
    'Tempest': {released: new Date('October 13, 1997')},
    'Tempest Remastered': {released: new Date('May 6, 2015')},
    'Tenth Edition': {released: new Date('July 13, 2007')},
    'The Dark': {released: new Date('August 1, 1994')},
    'Theros': {released: new Date('September 27, 2013')},
    'Time Spiral "Timeshifted"': {released: new Date('September 23, 2006')},
    'Time Spiral': {released: new Date('October 6, 2006')},
    'Torment': {released: new Date('February 4, 2002')},
    'Ugin\'s Fate promos': {released: new Date('January 17, 2015')},
    'Ultimate Box Toppers': {released: new Date('December 7, 2018')},
    'Ultimate Masters': {released: new Date('December 7, 2018')},
    'Unglued': {released: new Date('August 17, 1998')},
    'Unhinged': {released: new Date('November 19, 2004')},
    'Unlimited Edition': {released: new Date('December 1, 1993')},
    'Unstable': {released: new Date('December 8, 2017')},
    'Urza\'s Destiny': {released: new Date('June 7, 1999')},
    'Urza\'s Legacy': {released: new Date('February 15, 1999')},
    'Urza\'s Saga': {released: new Date('October 12, 1998')},
    'Vanguard': {released: new Date('December 1, 1997')},
    'Vintage Masters': {released: new Date('June 16, 2014')},
    'Visions': {released: new Date('February 3, 1997')},
    'Weatherlight': {released: new Date('June 9, 1997')},
    'Welcome Deck 2016': {released: new Date('April 8, 2016')},
    'Welcome Deck 2017': {released: new Date('June 7, 2018')},
    'Worldwake': {released: new Date('February 5, 2010')},
    'Zendikar': {released: new Date('October 2, 2009')},
    'Zendikar Expeditions': {released: new Date('October 2, 2015')},
  },

  // These mark popular formats as more important
  Format: {
    'Standard': {priority: 6},
    'Commander': {priority: 5},
    'Modern': {priority: 4},
    'Brawl': {priority: 3},
    'Vintage': {priority: 2},
    'Legacy': {priority: 1},
  },

  // Removes the erratically used 'Land' rarity, and the once used 'Promo' rarity
  Rarity: {
    'Land': {rarity: 'Common'},
    'Promo': {rarity: 'Special'}
  },

  // Fixes for cards, predominantly in the unglued/unhinged set and for tokens
  Card: {
    "B.F.M. (Big Furry Monster)": {
      types: ['Creature'],
      subtypes: ["The Biggest, Baddest, Nastiest, Scariest Creature You'll Ever See"],
      rules: [
        "You must play both B.F.M. cards to put B.F.M. into play. "+
        "If either B.F.M. card leaves play, sacrifice the other.",
        "B.F.M. can be blocked only by three or more creatures."
      ],
      flavourText:
        "\"It was big. Really, really big. No, bigger than that. Even bigger. "+
        "Keep going. More. No, more. Look, we're talking krakens and dreadnoughts for jewelry. "+
        "It was big!\"\n-Arna Kennerd, skyknight",
      multipart: {type: 'double', cards: ['B.F.M. (Big Furry Monster, Right Side)']},
      power: 99,
      toughness: 99,
      cmc : 15,
      cost : "{Black}{Black}{Black}{Black}{Black}{Black}{Black}{Black}{Black}{Black}{Black}{Black}{Black}{Black}{Black}",
      printings: [{
        gathererId: 9780,
        artist: 'Douglas Shuler',
        rarity :'Rare',
        expansion : 'Unglued',
      }],
    },
    "B.F.M. (Big Furry Monster, Right Side)": {
      types: ['Creature'],
      subtypes: ["The Biggest, Baddest, Nastiest, Scariest Creature You'll Ever See"],
      rules: [
        "You must play both B.F.M. cards to put B.F.M. into play. "+
        "If either B.F.M. card leaves play, sacrifice the other.",
        "B.F.M. can be blocked only by three or more creatures."
      ],
      flavourText:
        "\"It was big. Really, really big. No, bigger than that. Even bigger. "+
        "Keep going. More. No, more. Look, we're talking krakens and dreadnoughts for jewelry. "+
        "It was big!\"\n-Arna Kennerd, skyknight",
      multipart: {type: 'double', cards: ['B.F.M. (Big Furry Monster)']},
      printings: [{
        gathererId: 9844,
        artist: 'Douglas Shuler',
        rarity :'Rare',
        expansion : 'Unglued',
      }],
    },
    'Curse of the Fire Penguin': {
      types: ['Enchantment'],
      subtypes: ['Aura'],
      rules: [
        "Curse of the Fire Penquin consumes and confuses enchanted creature.",
        "(Enchanted creature becomes a Penguin with base power and toughness 6/5, loses all abilities, "+
        "gains trample and \"When this creature dies, return Curse of the Fire Penguin to the battlefield.\")",
      ],
      power: '',
      toughness: '',
      multipart: undefined,
      printings: [{
        gathererId : 73956,
        artist : 'Matt Thompson',
        rarity :'Rare',
        expansion : 'Unhinged',
      }],
    },
    "Look at Me, I'm R&D": {
      printings: [{
        gathererId : 74360,
        artist: 'spork;',
        rarity :'Rare',
        expansion : 'Unhinged',
      }],
    },
    "Miss Demeanor": {
      subtypes: ["Lady of Proper Etiquette"]
    },
    'Old Fogey': {
      types: ['Creature'],
    },
    "Little Girl": {
      cost: "{1/2W}"
    },
    'Mox Lotus': {
      rules: [
        '{Tap}: Add {Infinite}.',
        '{100}: Add one mana of any color.',
      ],
    },
    'Cheap Ass': {
      rules: [
        'Spells you cast cost {½} less to cast.',
      ],
    },
    'Flaccify': {
      rules: [
        'Counter target spell unless its controller pays {3}{½}.',
      ],
    },
    'Draco': {
      rules: [
        'Domain — This spell costs {2} less to cast for each basic land type among lands you control.',
        'Flying',
        'Domain — At the beginning of your upkeep, sacrifice Draco unless you pay {10}. This cost is reduced by {2} for each basic land type among lands you control.',
      ]
    },
    "Forest": {rules: ['{Tap}: Add {Green}.']},
    "Mountain": {rules: ['{Tap}: Add {Red}.']},
    "Swamp": {rules: ['{Tap}: Add {Black}.']},
    "Plains": {rules: ['{Tap}: Add {White}.']},
    "Island": {rules: ['{Tap}: Add {Blue}.']},
    "Snow-Covered Forest": {rules: ['{Tap}: Add {Green}.']},
    "Snow-Covered Mountain": {rules: ['{Tap}: Add {Red}.']},
    "Snow-Covered Swamp": {rules: ['{Tap}: Add {Black}.']},
    "Snow-Covered Plains": {rules: ['{Tap}: Add {White}.']},
    "Snow-Covered Island": {rules: ['{Tap}: Add {Blue}.']},
    "Demon": {types: ["Token", "Creature"]},
    "Spirit": {types: ["Token", "Creature"]},
    "Thrull": {types: ["Token", "Creature"]},
    "Elemental": {types: ["Token", "Creature"]},
    "Goblin": {types: ["Token", "Creature"]},
    "Beast": {types: ["Token", "Creature"]},
    "Elephant": {types: ["Token", "Creature"]},
    "Elemental Shaman": {types: ["Token", "Creature"]},
    "Hornet": {types: ["Token", "Artifact", "Creature"]},
    "Minion": {types: ["Token", "Creature"]},
    "Saproling": {types: ["Token", "Creature"]},
    "Elf Warrior": {types: ["Token", "Creature"]},
    "Soldier token card": {name: "Soldier", types: ["Token", "Creature"], subtypes: ["Soldier"]},
    "Zombie token card": {name: "Zombie", types: ["Token", "Creature"], subtypes: ["Zombie"]},
    "Pegasus token card": {name: "Pegasus", types: ["Token", "Creature"], subtypes: ["Pegasus"]},
    "Sheep token card": {name: "Sheep", types: ["Token", "Creature"], subtypes: ["Sheep"]},
    "Squirrel token card": {name: "Squirrel", types: ["Token", "Creature"], subtypes: ["Squirrel"]},
    "Goblin token card": {name: "Goblin", types: ["Token", "Creature"], subtypes: ["Goblin"]}
  }
};

module.exports = corrections;
