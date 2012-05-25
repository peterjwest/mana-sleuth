// This file corrects incorrect or incomplete content from the gatherer database
var corrections = exports;

// These are additions for categories (e.g. type, subtype) not included in the gatherer database
corrections.additions = {
  Type: [
    {name: "Token", genuine: true},
    {name: "Eaturecray", genuine: false}
  ],
  Subtype: [
    {name: "The Biggest, Baddest, Nastiest, Scariest Creature You'll Ever See", genuine: false},
    {name: "Donkey", genuine: false},
    {name: "Lord", genuine: false},
    {name: "Igpay", genuine: false},
    {name: "Townsfolk", genuine: false},
    {name: "Chicken", genuine: false},
    {name: "Egg", genuine: false},
    {name: "Gamer", genuine: false},
    {name: "Clamfolk", genuine: false},
    {name: "Elves", genuine: false},
    {name: "Hero", genuine: false},
    {name: "Bureaucrat", genuine: false},
    {name: "Goblins", genuine: false},
    {name: "Mime", genuine: false},
    {name: "Cow", genuine: false},
    {name: "Child", genuine: false},
    {name: "Lady of Proper Etiquette", genuine: false},
    {name: "Waiter", genuine: false},
    {name: "Dinosaur", genuine: false},
    {name: "Paratrooper", genuine: false},
    {name: "Designer", genuine: false},
    {name: "Ship", genuine: false},
    {name: "Mummy", genuine: false}
  ]
};

// These are removals for invald categories in the gatherer database
corrections.removals = {
  Type: [
    {name: "Plane"},
    {name: "Ongoing"},
    {name: "Vanguard"},
    {name: "Scheme"},
  ],
  Subtype: [
    {name: "Shadowmoor"},
    {name: "Lorwyn"},
    {name: "Mirrodin"},
    {name: "Zendikar"},
  ],
  Colour: [
    {name: "Colorless"}
  ],
  Rarity: [
    {name: "Promo"},
    {name: "Land"}
  ]
};

corrections.replacements = {
  // These replace outdated types with their modern equivalent
  types: {
    'Interrupt': {types: ['Instant']},
    'Summon Legend': {types: ['Legendary', 'Creature']},
    'Summon': {types: ['Creature']},
    'Enchant Creature': {types: ['Enchantment'], subtypes: ['Aura']},
    'Enchant Player': {types: ['Enchantment'], subtypes: ['Aura']},
    '(none)': {types: ['Token']}
  },

  // Removes the erratically used 'Land' rarity, and the once used 'Promo' rarity
  rarities: {
    'Land': {rarity: 'Common'},
    'Promo': {rarity: 'Special'}
  },

  // Fixes for cards in the unglued/unhinged set
  cards: {
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
    }
  }
};