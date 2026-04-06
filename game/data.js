const speciesList = [
    {
      name: 'Ember Pup', color: '#ff8a5b', accent: '#ffd3a8', hp: 12, atkMin: 2, atkMax: 4, catchBase: 0.36,
      sprite: ['........', '..11....', '.1221...', '.12321..', '.13331..', '..3443..', '.4....4.', '........']
    },
    {
      name: 'Mossling', color: '#49c972', accent: '#d8ffe4', hp: 11, atkMin: 1, atkMax: 3, catchBase: 0.48,
      sprite: ['........', '..111...', '.12221..', '.12321..', '..333...', '.4..4...', '.4..4...', '........']
    },
    {
      name: 'Volt Finch', color: '#f7d447', accent: '#fff6c0', hp: 10, atkMin: 2, atkMax: 5, catchBase: 0.32,
      sprite: ['........', '...1....', '..121...', '.12321..', '..3331..', '.44.44..', '........', '........']
    },
    {
      name: 'Gloom Bat', color: '#8b6cff', accent: '#efe7ff', hp: 13, atkMin: 2, atkMax: 4, catchBase: 0.34,
      sprite: ['........', '.11..11.', '12311231', '.123321.', '..3333..', '.4.44.4.', '........', '........']
    },
    {
      name: 'Tide Cub', color: '#4fc3f7', accent: '#d8f4ff', hp: 14, atkMin: 2, atkMax: 3, catchBase: 0.4,
      sprite: ['........', '..111...', '.12221..', '.12321..', '.13331..', '..4.4...', '.4...4..', '........']
    },
    {
      name: 'Petal Lynx', color: '#ff7ab6', accent: '#ffe1f0', hp: 15, atkMin: 3, atkMax: 5, catchBase: 0.24,
      sprite: ['........', '..11.1..', '.122221.', '.123321.', '.133331.', '..3443..', '.4....4.', '........']
    },
    {
      name: 'Brookfin', color: '#3fa0d6', accent: '#dff7ff', hp: 16, atkMin: 3, atkMax: 4, catchBase: 0.23,
      sprite: ['........', '..111...', '.122221.', '1233321.', '.133331.', '..44.4..', '.4...4..', '........']
    },
    {
      name: 'Ripple Fry', color: '#60c4ff', accent: '#e2f7ff', hp: 10, atkMin: 2, atkMax: 3, catchBase: 0.44,
      sprite: ['........', '...11...', '..1221..', '.123221.', '..1331..', '.44..44.', '........', '........']
    },
    {
      name: 'Pebble Koi', color: '#f0a35b', accent: '#fff0d6', hp: 13, atkMin: 2, atkMax: 4, catchBase: 0.34,
      sprite: ['........', '..111...', '.122221.', '1233321.', '.123321.', '..44.44.', '........', '........']
    },
    {
      name: 'Tangle Crab', color: '#cc6c58', accent: '#ffe1d9', hp: 15, atkMin: 3, atkMax: 4, catchBase: 0.28,
      sprite: ['........', '.11..11.', '.122222.', '..2332..', '.233332.', '.4.44.4.', '.4....4.', '........']
    },
    {
      name: 'Lantern Eel', color: '#596fd9', accent: '#eef2ff', hp: 16, atkMin: 3, atkMax: 6, catchBase: 0.2,
      sprite: ['...11...', '..1221..', '.123321.', '..2331..', '.2331...', '.4..44..', '...4....', '........']
    },
    {
      name: 'Storm Ray', color: '#7cc6ff', accent: '#f4fbff', hp: 18, atkMin: 4, atkMax: 6, catchBase: 0.16,
      sprite: ['........', '.11..11.', '12211221', '.123332.', '..2332..', '.4.44.4.', '..4..4..', '........']
    },
    {
      name: 'Mire Owl', color: '#7a67b8', accent: '#efe7ff', hp: 15, atkMin: 2, atkMax: 6, catchBase: 0.22,
      sprite: ['........', '.11..11.', '.122222.', '.123332.', '..3333..', '.4.44.4.', '.4....4.', '........']
    },
    {
      name: 'Static Ram', color: '#f0c64a', accent: '#fff4be', hp: 17, atkMin: 4, atkMax: 6, catchBase: 0.2,
      sprite: ['........', '.11..11.', '12211221', '.123321.', '.133331.', '..4..4..', '.4....4.', '........']
    },
    {
      name: 'Crownwyrm', color: '#d94f4f', accent: '#fff0b0', hp: 18, atkMin: 4, atkMax: 7, catchBase: 0.16,
      sprite: ['..1.1...', '.12221..', '.123321.', '12333321', '.133331.', '..4444..', '.4....4.', '........']
    },
    {
      name: 'Cinder Moth', color: '#ffb25e', accent: '#fff0c2', hp: 11, atkMin: 2, atkMax: 4, catchBase: 0.42,
      sprite: ['........', '.1.11.1.', '.122221.', '..2332..', '.233332.', '..4..4..', '.4....4.', '........']
    },
    {
      name: 'Bramble Hog', color: '#7db85c', accent: '#eef8d2', hp: 14, atkMin: 2, atkMax: 4, catchBase: 0.38,
      sprite: ['........', '..1111..', '.122221.', '.123321.', '.133331.', '..3443..', '.4.44.4.', '........']
    },
    {
      name: 'Marsh Mite', color: '#56b88b', accent: '#dfffee', hp: 12, atkMin: 2, atkMax: 3, catchBase: 0.46,
      sprite: ['........', '..111...', '.12221..', '1233321.', '.123321.', '..4..4..', '.4....4.', '........']
    },
    {
      name: 'Quartz Beetle', color: '#8ca2ff', accent: '#eef1ff', hp: 13, atkMin: 3, atkMax: 4, catchBase: 0.34,
      sprite: ['........', '..111...', '.12221..', '1233321.', '.123321.', '.4.44.4.', '.4....4.', '........']
    },
    {
      name: 'Gale Antler', color: '#c7e46d', accent: '#f6ffd6', hp: 15, atkMin: 3, atkMax: 5, catchBase: 0.28,
      sprite: ['.1....1.', '.122221.', '12333231', '.133331.', '..3443..', '..4..4..', '.4....4.', '........']
    },
    {
      name: 'Ember Hound', color: '#ff6d43', accent: '#ffe0b8', hp: 18, atkMin: 4, atkMax: 6, catchBase: 0.18,
      sprite: ['........', '..11....', '.1221...', '.12321..', '1233321.', '..3443..', '.4....4.', '.4....4.']
    },
    {
      name: 'Moss Guardian', color: '#3fb060', accent: '#d9ffca', hp: 18, atkMin: 3, atkMax: 5, catchBase: 0.22,
      sprite: ['........', '..111...', '.12221..', '.12321..', '.13331..', '.34443..', '.4...4..', '.4...4..']
    },
    {
      name: 'Volt Talon', color: '#efc93a', accent: '#fff2aa', hp: 17, atkMin: 4, atkMax: 7, catchBase: 0.18,
      sprite: ['...11...', '..121...', '.12321..', '1233321.', '..3331..', '.44.44..', '..4.4...', '........']
    },
    {
      name: 'Dread Bat', color: '#6d56cf', accent: '#f1ebff', hp: 20, atkMin: 4, atkMax: 6, catchBase: 0.16,
      sprite: ['.11..11.', '12211221', '.123332.', '12333321', '..3333..', '.4.44.4.', '.4....4.', '........']
    },
    {
      name: 'Riverclaw', color: '#39afd1', accent: '#e1f9ff', hp: 21, atkMin: 4, atkMax: 6, catchBase: 0.19,
      sprite: ['........', '..111...', '.122221.', '1233321.', '.133331.', '.344443.', '.4....4.', '........']
    },
    {
      name: 'Rose Lynx', color: '#ff5f9c', accent: '#ffe8f2', hp: 22, atkMin: 5, atkMax: 7, catchBase: 0.14,
      sprite: ['........', '..11.1..', '.122221.', '12333321', '.133331.', '.334433.', '.4....4.', '.4....4.']
    },
    {
      name: 'Bloom Seraph', color: '#ff89c6', accent: '#fff0fb', hp: 19, atkMin: 4, atkMax: 6, catchBase: 0.15,
      sprite: ['...11...', '..1221..', '.123321.', '.123321.', '..3333..', '..4..4..', '.4....4.', '........'],
      battleSprite: [
        '.....11.....',
        '....1221....',
        '...122221...',
        '..123332321..',
        '.1233333321.',
        '.1233443321.',
        '..123333321..',
        '...2333332...',
        '..24.44.42...',
        '.24..44..42..',
        '..4......4...',
        '............'
      ]
    },
    {
      name: 'Abyss Pike', color: '#3e7bd9', accent: '#dff3ff', hp: 20, atkMin: 4, atkMax: 6, catchBase: 0.15,
      sprite: ['........', '...11...', '.122221.', '12333321', '.123321.', '..44.44.', '...4.4..', '........'],
      battleSprite: [
        '............',
        '....111.....',
        '..1222221...',
        '.123333321..',
        '12333333321.',
        '.1233443321.',
        '..123333321.',
        '...23333321.',
        '..24.4444...',
        '.24..4..4...',
        '....4.......',
        '............'
      ]
    },
    {
      name: 'Hollow Hydra', color: '#6b63b8', accent: '#ece7ff', hp: 21, atkMin: 4, atkMax: 7, catchBase: 0.13,
      sprite: ['........', '.11..11.', '12211221', '.123332.', '.233333.', '.4.44.4.', '.4....4.', '........'],
      battleSprite: [
        '...11..11...',
        '..12211221..',
        '.1222212221.',
        '123333333321',
        '.12333333321',
        '..233434332.',
        '.2333333332.',
        '..4.44.44...',
        '.4..44..4...',
        '4...44...4..',
        '....44......',
        '............'
      ]
    },
    {
      name: 'Sun Stag', color: '#f3c552', accent: '#fff4c6', hp: 22, atkMin: 5, atkMax: 7, catchBase: 0.12,
      sprite: ['.1....1.', '.122221.', '12333231', '.133331.', '.233333.', '..4..4..', '.4....4.', '........'],
      battleSprite: [
        '1........1..',
        '11.111111.1.',
        '.1222222221.',
        '123333333321',
        '.12333433321',
        '..2333333332',
        '.2333333332.',
        '..4.44.44...',
        '.4..44..4...',
        '4...44...4..',
        '....44......',
        '............'
      ]
    },
    {
      name: 'Searhorn', color: '#ff8d57', accent: '#ffe0b8', hp: 23, atkMin: 5, atkMax: 7, catchBase: 0.11,
      sprite: ['...11...', '..1221..', '.123321.', '12333321', '.133331.', '..3443..', '.4.44.4.', '........']
    },
    {
      name: 'Prism Jackal', color: '#f3dd6b', accent: '#f4f0c8', hp: 22, atkMin: 6, atkMax: 8, catchBase: 0.12,
      sprite: ['........', '..111...', '.122221.', '1233321.', '.133331.', '..3443..', '.4....4.', '.4....4.']
    },
    {
      name: 'Glass Heron', color: '#83d9e4', accent: '#eefcff', hp: 24, atkMin: 5, atkMax: 7, catchBase: 0.11,
      sprite: ['...1....', '..121...', '.12221..', '..2331..', '.233331.', '..4.4...', '.4...4..', '........']
    },
    {
      name: 'Murk Lotus', color: '#6fc08c', accent: '#e2ffe9', hp: 25, atkMin: 4, atkMax: 7, catchBase: 0.13,
      sprite: ['...11...', '..1221..', '.123321.', '.123321.', '..3333..', '..4.4...', '.4...4..', '........']
    },
    {
      name: 'Cinder Scarab', color: '#cf6f54', accent: '#f7d3b3', hp: 26, atkMin: 6, atkMax: 8, catchBase: 0.1,
      sprite: ['........', '..111...', '.122221.', '12333321', '.123321.', '.4.44.4.', '.4....4.', '........']
    },
    {
      name: 'Hex Coil', color: '#7b6ad1', accent: '#f1eaff', hp: 24, atkMin: 6, atkMax: 9, catchBase: 0.1,
      sprite: ['...11...', '..1221..', '.123321.', '..2331..', '.233321.', '.4.44.4.', '...4.4..', '........']
    },
    {
      name: 'Lunarkoi', color: '#76aef0', accent: '#edf6ff', hp: 25, atkMin: 5, atkMax: 8, catchBase: 0.11,
      sprite: ['........', '..111...', '.122221.', '12333321', '.123321.', '..44.44.', '.4....4.', '........']
    },
    {
      name: 'Veil Crane', color: '#b9d7ff', accent: '#ffffff', hp: 24, atkMin: 5, atkMax: 8, catchBase: 0.11,
      sprite: ['...1....', '..121...', '.12221..', '..2331..', '.233331.', '..4.4...', '..4.4...', '.4...4..']
    },
    {
      name: 'Bastion Stag', color: '#96bd6c', accent: '#f3ffe0', hp: 28, atkMin: 6, atkMax: 8, catchBase: 0.09,
      sprite: ['.1....1.', '.122221.', '12333321', '.133331.', '.233333.', '..3443..', '.4....4.', '.4....4.']
    },
    {
      name: 'Rootback', color: '#4f8d57', accent: '#daf4c7', hp: 30, atkMin: 5, atkMax: 8, catchBase: 0.1,
      sprite: ['........', '..111...', '.122221.', '12333321', '.133331.', '.344443.', '.4....4.', '.4....4.']
    },
    {
      name: 'Comet Drake', color: '#f29b63', accent: '#fff0cf', hp: 27, atkMin: 6, atkMax: 9, catchBase: 0.08,
      sprite: ['..1.1...', '.12221..', '.123321.', '12333321', '.133331.', '..4444..', '.4....4.', '.4....4.']
    },
    {
      name: 'Astral Leviathan', color: '#7fa8e8', accent: '#f5fbff', hp: 31, atkMin: 6, atkMax: 9, catchBase: 0.07,
      sprite: ['...11...', '..1221..', '.123321.', '12333321', '.123332.', '..44.44.', '.4..44..', '........']
    },
    {
      name: 'Forge Colossus', color: '#9b6153', accent: '#ffd9bc', hp: 34, atkMin: 7, atkMax: 10, catchBase: 0.06,
      sprite: ['..1111..', '.1222221', '.1233332', '123333321', '.1233332.', '.3444443.', '.4....4.', '.4....4.']
    },
    {
      name: 'Void Basilisk', color: '#8a75d9', accent: '#f3edff', hp: 32, atkMin: 7, atkMax: 10, catchBase: 0.06,
      sprite: ['..11....', '.1221...', '.123321.', '12333321', '.233333.', '.4.44.4.', '.4....4.', '...44...']
    },
    {
      name: 'Infernyx', color: '#ffb067', accent: '#fff0cf', hp: 38, atkMin: 9, atkMax: 12, catchBase: 0.04,
      sprite: ['...11...', '..1221..', '.123321.', '12333321', '.123332.', '..3443..', '.4.44.4.', '..4..4..']
    },
    {
      name: 'Cataclysm Roc', color: '#ff8a4b', accent: '#fff1da', hp: 46, atkMin: 11, atkMax: 14, catchBase: 0.03,
      sprite: ['..1..1..', '.122221.', '12333321', '.123332.', '123333321', '.334443.', '.4....4.', '.4....4.']
    },
    {
      name: 'Nightfang', color: '#7d73d9', accent: '#f1ecff', hp: 36, atkMin: 10, atkMax: 12, catchBase: 0.04,
      sprite: ['........', '.11..11.', '12211221', '.123332.', '.233333.', '.4.44.4.', '.4....4.', '..4..4..']
    },
    {
      name: 'Eclipse Fenrir', color: '#5f54c8', accent: '#e9e4ff', hp: 44, atkMin: 12, atkMax: 15, catchBase: 0.03,
      sprite: ['.11..11.', '12211221', '.123332.', '123333321', '.2333332.', '.4.44.4.', '4..44..4', '...44...']
    },
    {
      name: 'Riftfin', color: '#4eb9df', accent: '#ebfbff', hp: 37, atkMin: 9, atkMax: 12, catchBase: 0.04,
      sprite: ['...11...', '..1221..', '.123321.', '12333321', '.123332.', '..44.44.', '.4....4.', '........']
    },
    {
      name: 'Abyss Sovereign', color: '#2c87c8', accent: '#ecfbff', hp: 46, atkMin: 11, atkMax: 14, catchBase: 0.03,
      sprite: ['...11...', '.122221.', '123333321', '.1233332.', '123333321', '.3444443.', '.4....4.', '........']
    },
    {
      name: 'Stormlure', color: '#77d6ff', accent: '#f4fdff', hp: 35, atkMin: 10, atkMax: 13, catchBase: 0.04,
      sprite: ['...11...', '..1221..', '.123321.', '.123321.', '..2332..', '.4.44.4.', '..4..4..', '........']
    },
    {
      name: 'Tempest Leviathan', color: '#5ba3ff', accent: '#f5fbff', hp: 45, atkMin: 12, atkMax: 15, catchBase: 0.03,
      sprite: ['..111...', '.122221.', '123333321', '.1233332.', '123333321', '.4.444.4', '4..44..4', '....44..']
    }
  ];
  const speciesByName = Object.fromEntries(speciesList.map(species => [species.name, species]));
  const rarityMeta = {
    common: { label: 'Common', catchAdjust: 0, levelBonus: 0, coinBonus: 0 },
    uncommon: { label: 'Uncommon', catchAdjust: -0.06, levelBonus: 1, coinBonus: 4 },
    rare: { label: 'Rare', catchAdjust: -0.12, levelBonus: 2, coinBonus: 10 },
    legendary: { label: 'Legendary', catchAdjust: -0.18, levelBonus: 3, coinBonus: 18 },
    mythic: { label: 'Mythic', catchAdjust: -0.24, levelBonus: 5, coinBonus: 34 }
  };
  const typeMeta = {
    flame: { label: 'Flame', short: 'FLM', color: '#d86d54' },
    bloom: { label: 'Bloom', short: 'BLM', color: '#5daa61' },
    tide: { label: 'Tide', short: 'TID', color: '#5e97d8' },
    volt: { label: 'Volt', short: 'VLT', color: '#d7b84d' },
    shade: { label: 'Shade', short: 'SHD', color: '#7c6bc0' },
    stone: { label: 'Stone', short: 'STN', color: '#9b8762' },
    gale: { label: 'Gale', short: 'GAL', color: '#8ebc63' }
  };
  const speciesTypesBySpecies = {
    'Ember Pup': 'flame',
    'Cinder Moth': 'flame',
    'Ember Hound': 'flame',
    Crownwyrm: 'flame',
    Mossling: 'bloom',
    'Bramble Hog': 'bloom',
    'Marsh Mite': 'bloom',
    'Petal Lynx': 'bloom',
    'Moss Guardian': 'bloom',
    'Rose Lynx': 'bloom',
    'Bloom Seraph': 'bloom',
    'Tide Cub': 'tide',
    Brookfin: 'tide',
    'Ripple Fry': 'tide',
    'Pebble Koi': 'tide',
    Riverclaw: 'tide',
    'Abyss Pike': 'tide',
    'Volt Finch': 'volt',
    'Lantern Eel': 'volt',
    'Static Ram': 'volt',
    'Volt Talon': 'volt',
    'Storm Ray': 'volt',
    'Prism Jackal': 'volt',
    'Bastion Stag': 'volt',
    'Gloom Bat': 'shade',
    'Mire Owl': 'shade',
    'Dread Bat': 'shade',
    'Hollow Hydra': 'shade',
    'Hex Coil': 'shade',
    'Void Basilisk': 'shade',
    Nightfang: 'shade',
    'Eclipse Fenrir': 'shade',
    'Quartz Beetle': 'stone',
    'Tangle Crab': 'stone',
    'Cinder Scarab': 'stone',
    'Forge Colossus': 'stone',
    'Gale Antler': 'gale',
    'Sun Stag': 'gale',
    'Searhorn': 'flame',
    'Comet Drake': 'flame',
    'Glass Heron': 'tide',
    'Lunarkoi': 'tide',
    'Astral Leviathan': 'tide',
    'Veil Crane': 'tide',
    Riftfin: 'tide',
    'Abyss Sovereign': 'tide',
    'Murk Lotus': 'bloom',
    Rootback: 'bloom',
    Infernyx: 'flame',
    'Cataclysm Roc': 'flame',
    Stormlure: 'volt',
    'Tempest Leviathan': 'volt'
  };
  const typeChart = {
    flame: { bloom: 1.3, tide: 0.8, stone: 0.85 },
    bloom: { tide: 1.3, shade: 0.85, flame: 0.8, gale: 0.9 },
    tide: { flame: 1.3, stone: 1.2, bloom: 0.8, volt: 0.8 },
    volt: { tide: 1.3, gale: 1.2, stone: 0.85, bloom: 0.9 },
    shade: { bloom: 1.2, shade: 0.85, gale: 0.9 },
    stone: { volt: 1.2, flame: 1.15, tide: 0.85, bloom: 0.9 },
    gale: { bloom: 1.2, shade: 1.1, volt: 0.85, stone: 0.9 }
  };
  const evolutionData = {
    'Ember Pup': { evolvesTo: 'Ember Hound', minLevel: 5, minBadges: 1 },
    Mossling: { evolvesTo: 'Moss Guardian', minLevel: 5, minBadges: 1 },
    'Volt Finch': { evolvesTo: 'Volt Talon', minLevel: 6, minBadges: 1 },
    'Gloom Bat': { evolvesTo: 'Dread Bat', minLevel: 6, minBadges: 2 },
    'Tide Cub': { evolvesTo: 'Riverclaw', minLevel: 6, minBadges: 2 },
    'Petal Lynx': { evolvesTo: 'Rose Lynx', minLevel: 7, minBadges: 3 },
    Searhorn: { evolvesTo: 'Comet Drake', minLevel: 18, minBadges: 6 },
    'Prism Jackal': { evolvesTo: 'Bastion Stag', minLevel: 18, minBadges: 6 },
    'Glass Heron': { evolvesTo: 'Veil Crane', minLevel: 19, minBadges: 7 },
    'Murk Lotus': { evolvesTo: 'Rootback', minLevel: 20, minBadges: 7 },
    'Cinder Scarab': { evolvesTo: 'Forge Colossus', minLevel: 21, minBadges: 8 },
    'Hex Coil': { evolvesTo: 'Void Basilisk', minLevel: 21, minBadges: 8 },
    Lunarkoi: { evolvesTo: 'Astral Leviathan', minLevel: 22, minBadges: 9 },
    Infernyx: { evolvesTo: 'Cataclysm Roc', minLevel: 28, minBadges: 10 },
    Nightfang: { evolvesTo: 'Eclipse Fenrir', minLevel: 28, minBadges: 10 },
    Riftfin: { evolvesTo: 'Abyss Sovereign', minLevel: 29, minBadges: 11 },
    Stormlure: { evolvesTo: 'Tempest Leviathan', minLevel: 29, minBadges: 11 }
  };
  const statusMeta = {
    burn: { label: 'Burn', short: 'Burn' },
    stun: { label: 'Stun', short: 'Stun' },
    regen: { label: 'Regen', short: 'Regen' },
    exposed: { label: 'Break', short: 'Break' }
  };
  const passiveTraitsBySpecies = {
    'Ember Pup': { name: 'Blaze Heart', description: '+1 damage above half HP.', highHpBonus: 1 },
    'Ember Hound': { name: 'Blaze Heart', description: '+2 damage above half HP.', highHpBonus: 2 },
    'Cinder Moth': { name: 'Kindled Wings', description: '+1 damage above half HP.', highHpBonus: 1 },
    'Crownwyrm': { name: 'Royal Pyre', description: '+2 damage above half HP.', highHpBonus: 2 },
    Mossling: { name: 'Softroot', description: 'Recover 1 HP at turn start.', turnHeal: 1 },
    'Moss Guardian': { name: 'Deeproot', description: 'Recover 2 HP at turn start.', turnHeal: 2 },
    'Petal Lynx': { name: 'Bloom Veil', description: 'Recover 1 HP at turn start.', turnHeal: 1 },
    'Rose Lynx': { name: 'Bloom Veil', description: 'Recover 2 HP at turn start.', turnHeal: 2 },
    'Bloom Seraph': { name: 'Halo Bloom', description: 'Recover 2 HP at turn start.', turnHeal: 2 },
    'Bramble Hog': { name: 'Bramble Hide', description: 'Take 1 less damage.', incomingReduction: 1 },
    'Quartz Beetle': { name: 'Mirror Shell', description: 'Take 1 less damage.', incomingReduction: 1 },
    'Gloom Bat': { name: 'Night Veil', description: 'Take 1 less damage.', incomingReduction: 1 },
    'Dread Bat': { name: 'Night Veil', description: 'Take 2 less damage.', incomingReduction: 2 },
    'Tangle Crab': { name: 'Hard Clamps', description: 'Take 1 less damage.', incomingReduction: 1 },
    'Pebble Koi': { name: 'Stone Scales', description: 'Take 1 less damage.', incomingReduction: 1 },
    'Volt Finch': { name: 'Shock Hunter', description: '+1 damage to statused foes.', statusHunter: 1 },
    'Volt Talon': { name: 'Shock Hunter', description: '+2 damage to statused foes.', statusHunter: 2 },
    'Static Ram': { name: 'Breaker Horn', description: '+1 damage to statused foes.', statusHunter: 1 },
    'Lantern Eel': { name: 'Flash Feed', description: '+1 damage to statused foes.', statusHunter: 1 },
    'Sun Stag': { name: 'Solar Mantle', description: 'Heal 1 HP and take 1 less damage.', turnHeal: 1, incomingReduction: 1 },
    'Tide Cub': { name: 'Tidal Rhythm', description: 'Recover 1 HP after a hit.', healOnHit: 1 },
    Riverclaw: { name: 'Tidal Rhythm', description: 'Recover 2 HP after a hit.', healOnHit: 2 },
    Brookfin: { name: 'Current Line', description: 'Recover 1 HP after a hit.', healOnHit: 1 },
    'Ripple Fry': { name: 'Current Line', description: 'Recover 1 HP after a hit.', healOnHit: 1 },
    'Storm Ray': { name: 'Rising Surge', description: '+2 damage to healthy foes.', enemyHealthyBonus: 2 },
    'Abyss Pike': { name: 'Rising Surge', description: '+2 damage to healthy foes.', enemyHealthyBonus: 2 },
    'Marsh Mite': { name: 'Bog Ambush', description: '+1 damage to healthy foes.', enemyHealthyBonus: 1 },
    'Gale Antler': { name: 'Wind Chase', description: '+1 damage to healthy foes.', enemyHealthyBonus: 1 },
    'Mire Owl': { name: 'Dusk Watch', description: '+1 damage to higher-level foes.', levelHunter: 1 },
    'Hollow Hydra': { name: 'Many Heads', description: 'Recover 1 HP after a hit.', healOnHit: 1 },
    Searhorn: { name: 'Heat Crest', description: '+2 damage above half HP.', highHpBonus: 2 },
    'Prism Jackal': { name: 'Flash Hunt', description: '+2 damage to statused foes.', statusHunter: 2 },
    'Glass Heron': { name: 'Tide Mirror', description: 'Recover 2 HP after a hit.', healOnHit: 2 },
    'Murk Lotus': { name: 'Stillwater Bloom', description: 'Recover 2 HP at turn start.', turnHeal: 2 },
    'Cinder Scarab': { name: 'Kiln Shell', description: 'Take 2 less damage.', incomingReduction: 2 },
    'Hex Coil': { name: 'Gloam Sense', description: '+2 damage to higher-level foes.', levelHunter: 2 },
    Lunarkoi: { name: 'Moon Current', description: '+2 damage to healthy foes.', enemyHealthyBonus: 2 },
    'Veil Crane': { name: 'Crosswind Veil', description: 'Recover 1 HP after a hit.', healOnHit: 1 },
    'Bastion Stag': { name: 'Siege Horns', description: '+2 damage to healthy foes.', enemyHealthyBonus: 2 },
    Rootback: { name: 'Deep Bark', description: 'Recover 2 HP at turn start and take 1 less damage.', turnHeal: 2, incomingReduction: 1 },
    'Comet Drake': { name: 'Meteor Heart', description: '+2 damage above half HP.', highHpBonus: 2 },
    'Astral Leviathan': { name: 'Void Tides', description: 'Recover 2 HP after a hit and take 1 less damage.', healOnHit: 2, incomingReduction: 1 },
    'Forge Colossus': { name: 'Molten Armor', description: 'Take 3 less damage.', incomingReduction: 3 },
    'Void Basilisk': { name: 'Eclipse Gaze', description: '+3 damage to higher-level foes.', levelHunter: 3 },
    Infernyx: { name: 'Sun Ruin', description: '+3 damage above half HP.', highHpBonus: 3 },
    'Cataclysm Roc': { name: 'Sky Ruin', description: '+4 damage above half HP.', highHpBonus: 4 },
    Nightfang: { name: 'Dread Hunt', description: '+3 damage to higher-level foes.', levelHunter: 3 },
    'Eclipse Fenrir': { name: 'Moon Hunt', description: '+4 damage to higher-level foes.', levelHunter: 4 },
    Riftfin: { name: 'Rift Tide', description: 'Recover 2 HP after a hit.', healOnHit: 2 },
    'Abyss Sovereign': { name: 'Sovereign Tide', description: 'Recover 3 HP after a hit.', healOnHit: 3 },
    Stormlure: { name: 'Storm Pulse', description: '+3 damage to statused foes.', statusHunter: 3 },
    'Tempest Leviathan': { name: 'Leviathan Pulse', description: '+4 damage to statused foes.', statusHunter: 4 }
  };
  const thirdMovesBySpecies = {
    'Ember Pup': { name: 'Smoke Pounce', power: 1.05, accuracy: 0.94, effect: { type: 'exposed', turns: 2, potency: 1, chance: 0.4 } },
    'Ember Hound': { name: 'Wildfire Leap', power: 1.18, accuracy: 0.92, effect: { type: 'burn', turns: 2, potency: 1, chance: 0.5 } },
    'Cinder Moth': { name: 'Soot Veil', power: 0.95, accuracy: 0.96, selfEffect: { type: 'regen', turns: 2, potency: 1, chance: 0.65 } },
    'Mossling': { name: 'Bud Guard', power: 0.9, accuracy: 0.97, selfEffect: { type: 'regen', turns: 2, potency: 1, chance: 1 } },
    'Moss Guardian': { name: 'Canopy Guard', power: 1, accuracy: 0.95, selfEffect: { type: 'regen', turns: 3, potency: 1, chance: 1 } },
    'Bramble Hog': { name: 'Needle Roll', power: 1.1, accuracy: 0.92, effect: { type: 'exposed', turns: 2, potency: 1, chance: 0.55 } },
    'Volt Finch': { name: 'Static Peck', power: 1, accuracy: 0.95, effect: { type: 'stun', turns: 1, potency: 1, chance: 0.35 } },
    'Volt Talon': { name: 'Arc Wing', power: 1.15, accuracy: 0.91, effect: { type: 'stun', turns: 1, potency: 1, chance: 0.5 } },
    'Quartz Beetle': { name: 'Facet Flash', type: 'volt', power: 1.04, accuracy: 0.94, selfEffect: { type: 'regen', turns: 2, potency: 1, chance: 0.5 } },
    'Gale Antler': { name: 'Sky Hook', power: 1.1, accuracy: 0.93, effect: { type: 'exposed', turns: 2, potency: 1, chance: 0.45 } },
    'Gloom Bat': { name: 'Shade Screen', power: 0.98, accuracy: 0.95, effect: { type: 'exposed', turns: 2, potency: 1, chance: 0.45 } },
    'Dread Bat': { name: 'Void Loop', power: 1.08, accuracy: 0.93, healRatio: 0.25 },
    'Mire Owl': { name: 'Grave Blink', type: 'gale', power: 1.06, accuracy: 0.94, effect: { type: 'burn', turns: 2, potency: 1, chance: 0.45 } },
    'Hollow Hydra': { name: 'Echo Bite', power: 1.12, accuracy: 0.9, healRatio: 0.2 },
    'Tide Cub': { name: 'Foam Tackle', power: 1.02, accuracy: 0.95, selfEffect: { type: 'regen', turns: 2, potency: 1, chance: 0.35 } },
    Riverclaw: { name: 'Breaker Wake', power: 1.16, accuracy: 0.92, effect: { type: 'exposed', turns: 2, potency: 1, chance: 0.55 } },
    Brookfin: { name: 'Reef Loop', power: 1.05, accuracy: 0.94, healRatio: 0.2 },
    'Marsh Mite': { name: 'Murk Burst', power: 1.02, accuracy: 0.95, effect: { type: 'stun', turns: 1, potency: 1, chance: 0.3 } },
    'Ripple Fry': { name: 'Stream Zip', power: 1, accuracy: 0.96, selfEffect: { type: 'regen', turns: 2, potency: 1, chance: 0.4 } },
    'Pebble Koi': { name: 'River Vault', power: 1.08, accuracy: 0.94, effect: { type: 'exposed', turns: 2, potency: 1, chance: 0.38 } },
    'Tangle Crab': { name: 'Barnacle Brace', power: 0.96, accuracy: 0.95, selfEffect: { type: 'regen', turns: 2, potency: 1, chance: 0.5 } },
    'Lantern Eel': { name: 'Lure Flicker', power: 1.06, accuracy: 0.93, effect: { type: 'stun', turns: 1, potency: 1, chance: 0.38 } },
    'Storm Ray': { name: 'Skyfall Sweep', power: 1.14, accuracy: 0.89, effect: { type: 'stun', turns: 1, potency: 1, chance: 0.5 } },
    'Abyss Pike': { name: 'Depth Spiral', power: 1.12, accuracy: 0.91, effect: { type: 'exposed', turns: 3, potency: 1, chance: 0.5 } },
    'Petal Lynx': { name: 'Rose Guard', power: 0.96, accuracy: 0.97, selfEffect: { type: 'regen', turns: 2, potency: 1, chance: 1 } },
    'Rose Lynx': { name: 'Blush Fang', power: 1.14, accuracy: 0.92, selfEffect: { type: 'regen', turns: 2, potency: 1, chance: 0.65 } },
    'Bloom Seraph': { name: 'Petal Halo', power: 1.08, accuracy: 0.94, selfEffect: { type: 'regen', turns: 3, potency: 1, chance: 1 } },
    'Static Ram': { name: 'Breaker Step', type: 'stone', power: 1.09, accuracy: 0.92, effect: { type: 'stun', turns: 1, potency: 1, chance: 0.42 } },
    'Sun Stag': { name: 'Dawn Shield', type: 'flame', power: 1.02, accuracy: 0.95, selfEffect: { type: 'regen', turns: 2, potency: 1, chance: 0.8 } },
    'Crownwyrm': { name: 'Crown Guard', power: 1.1, accuracy: 0.91, effect: { type: 'burn', turns: 2, potency: 1, chance: 0.42 } },
    Searhorn: { name: 'Solar Gore', power: 1.16, accuracy: 0.9, effect: { type: 'burn', turns: 2, potency: 1, chance: 0.45 } },
    'Prism Jackal': { name: 'Static Mirage', power: 1.14, accuracy: 0.92, effect: { type: 'stun', turns: 1, potency: 1, chance: 0.42 } },
    'Glass Heron': { name: 'Mirror Plunge', power: 1.12, accuracy: 0.93, healRatio: 0.2 },
    'Murk Lotus': { name: 'Bog Halo', power: 1.05, accuracy: 0.94, selfEffect: { type: 'regen', turns: 3, potency: 1, chance: 0.85 } },
    'Cinder Scarab': { name: 'Kiln Crush', power: 1.18, accuracy: 0.89, effect: { type: 'exposed', turns: 2, potency: 1, chance: 0.5 } },
    'Hex Coil': { name: 'Night Circuit', power: 1.14, accuracy: 0.91, effect: { type: 'burn', turns: 2, potency: 1, chance: 0.4 } },
    Lunarkoi: { name: 'Silver Wake', power: 1.16, accuracy: 0.91, effect: { type: 'exposed', turns: 2, potency: 1, chance: 0.48 } },
    'Veil Crane': { name: 'Wind Veil', power: 1.08, accuracy: 0.94, selfEffect: { type: 'regen', turns: 2, potency: 1, chance: 0.6 } },
    'Bastion Stag': { name: 'Rampart Rush', power: 1.2, accuracy: 0.9, effect: { type: 'stun', turns: 1, potency: 1, chance: 0.42 } },
    Rootback: { name: 'Trunk Wall', power: 1.02, accuracy: 0.94, selfEffect: { type: 'regen', turns: 3, potency: 1, chance: 1 } },
    'Comet Drake': { name: 'Meteor Dive', power: 1.22, accuracy: 0.88, effect: { type: 'burn', turns: 2, potency: 2, chance: 0.48 } },
    'Astral Leviathan': { name: 'Star Surge', power: 1.2, accuracy: 0.89, effect: { type: 'exposed', turns: 3, potency: 1, chance: 0.52 } },
    'Forge Colossus': { name: 'Crucible Crash', power: 1.24, accuracy: 0.87, effect: { type: 'burn', turns: 2, potency: 2, chance: 0.46 } },
    'Void Basilisk': { name: 'Umbra Coil', power: 1.22, accuracy: 0.88, effect: { type: 'exposed', turns: 3, potency: 1, chance: 0.5 } },
    Infernyx: { name: 'Ash Dive', power: 1.28, accuracy: 0.9, effect: { type: 'burn', turns: 3, potency: 2, chance: 0.54 } },
    'Cataclysm Roc': { name: 'Worldfire Dive', power: 1.38, accuracy: 0.86, effect: { type: 'burn', turns: 3, potency: 2, chance: 0.62 } },
    Nightfang: { name: 'Umbra Rush', power: 1.26, accuracy: 0.9, effect: { type: 'exposed', turns: 3, potency: 1, chance: 0.56 } },
    'Eclipse Fenrir': { name: 'Moonrend', power: 1.36, accuracy: 0.87, effect: { type: 'exposed', turns: 3, potency: 2, chance: 0.62 } },
    Riftfin: { name: 'Rift Breaker', power: 1.28, accuracy: 0.9, effect: { type: 'exposed', turns: 3, potency: 2, chance: 0.54 } },
    'Abyss Sovereign': { name: 'Depth Throne', power: 1.36, accuracy: 0.87, healRatio: 0.3, effect: { type: 'exposed', turns: 3, potency: 2, chance: 0.58 } },
    Stormlure: { name: 'Lure Crash', power: 1.3, accuracy: 0.89, effect: { type: 'stun', turns: 1, potency: 2, chance: 0.52 } },
    'Tempest Leviathan': { name: 'Maelstrom Coil', power: 1.38, accuracy: 0.85, effect: { type: 'stun', turns: 1, potency: 2, chance: 0.62 } }
  };
  const routeTrainerNames = {
    'Town Outskirts': ['Pip', 'Lena', 'Bo', 'Mika'],
    'Fern Trail': ['Orin', 'Suri', 'Pax', 'Mira'],
    'Creek Bend': ['Nell', 'Toma', 'Rill', 'Caro'],
    'Dusk Hollow': ['Venn', 'Iris', 'Noa', 'Kest'],
    'Thunder Ridge': ['Jett', 'Roux', 'Bram', 'Skye'],
    'Wild Crown': ['Vale', 'Sable', 'Kira', 'Oris'],
    'Sunspoke Flats': ['Heli', 'Torv', 'Maren', 'Dio'],
    'Mirror Fen': ['Sel', 'Ivo', 'Neris', 'Pell'],
    'Ashen Circuit': ['Cairn', 'Vexa', 'Rune', 'Sorin'],
    'Moonlit Delta': ['Lyra', 'Noemi', 'Tallis', 'Vey'],
    'Ironwood Reach': ['Brigg', 'Aster', 'Moro', 'Quill'],
    'Starfall Wastes': ['Sera', 'Cael', 'Voss', 'Nyx']
  };
  const routeTrainerTitles = ['Scout', 'Tamer', 'Ace', 'Ranger', 'Wanderer'];
  const routeProfiles = [
    {
      label: 'Town Outskirts',
      palette: { plain: '#9ecc78', grass: '#84bf5b', path: '#cfbb88', water: '#63aedf' },
      landmark: 'signpost',
      pool: [
        { species: 'Mossling', rarity: 'common', weight: 28 },
        { species: 'Ember Pup', rarity: 'common', weight: 24 },
        { species: 'Cinder Moth', rarity: 'common', weight: 22 },
        { species: 'Bramble Hog', rarity: 'uncommon', weight: 14 },
        { species: 'Volt Finch', rarity: 'uncommon', weight: 8 },
        { species: 'Gloom Bat', rarity: 'rare', weight: 4 }
      ],
      fishPool: [
        { species: 'Ripple Fry', rarity: 'common', weight: 52 },
        { species: 'Pebble Koi', rarity: 'uncommon', weight: 32 },
        { species: 'Tangle Crab', rarity: 'rare', weight: 16 }
      ],
      fishSpecials: [],
      specials: [],
      boss: { trainer: 'Scout Mira', badge: 'Trail', species: 'Ember Pup', rewardCoins: 24, requiredBadges: 0, minCaptures: 2, minDefeated: 2, minLeadLevel: 4, levelBonus: 3 }
    },
    {
      label: 'Fern Trail',
      palette: { plain: '#8ccf71', grass: '#63b14d', path: '#ccb47b', water: '#74b7d8' },
      landmark: 'fern',
      pool: [
        { species: 'Mossling', rarity: 'common', weight: 24 },
        { species: 'Cinder Moth', rarity: 'common', weight: 22 },
        { species: 'Bramble Hog', rarity: 'common', weight: 20 },
        { species: 'Ember Pup', rarity: 'uncommon', weight: 14 },
        { species: 'Volt Finch', rarity: 'uncommon', weight: 12 },
        { species: 'Tide Cub', rarity: 'uncommon', weight: 5 },
        { species: 'Gloom Bat', rarity: 'rare', weight: 3 }
      ],
      fishPool: [
        { species: 'Ripple Fry', rarity: 'common', weight: 40 },
        { species: 'Pebble Koi', rarity: 'common', weight: 30 },
        { species: 'Tangle Crab', rarity: 'uncommon', weight: 20 },
        { species: 'Lantern Eel', rarity: 'rare', weight: 10 }
      ],
      fishSpecials: [],
      specials: [
        { species: 'Petal Lynx', rarity: 'legendary', chance: 0.07, minSteps: 60, minCaptures: 2, terrain: 'grass' },
        { species: 'Bloom Seraph', rarity: 'legendary', chance: 0.028, minSteps: 125, minCaptures: 3, minDefeated: 4, terrain: 'grass' }
      ],
      boss: { trainer: 'Ranger Vale', badge: 'Fern', species: 'Mossling', rewardCoins: 32, requiredBadges: 1, minCaptures: 4, minDefeated: 4, minLeadLevel: 7, levelBonus: 4 }
    },
    {
      label: 'Creek Bend',
      palette: { plain: '#8ac9b0', grass: '#64b19d', path: '#d2c18d', water: '#4da8da' },
      landmark: 'reeds',
      pool: [
        { species: 'Tide Cub', rarity: 'common', weight: 24 },
        { species: 'Marsh Mite', rarity: 'common', weight: 24 },
        { species: 'Mossling', rarity: 'common', weight: 18 },
        { species: 'Bramble Hog', rarity: 'uncommon', weight: 12 },
        { species: 'Volt Finch', rarity: 'uncommon', weight: 10 },
        { species: 'Ember Pup', rarity: 'uncommon', weight: 8 },
        { species: 'Gloom Bat', rarity: 'rare', weight: 4 }
      ],
      fishPool: [
        { species: 'Pebble Koi', rarity: 'common', weight: 34 },
        { species: 'Ripple Fry', rarity: 'common', weight: 26 },
        { species: 'Tangle Crab', rarity: 'uncommon', weight: 24 },
        { species: 'Lantern Eel', rarity: 'rare', weight: 16 }
      ],
      fishSpecials: [
        { species: 'Abyss Pike', rarity: 'legendary', chance: 0.038, minSteps: 170, minCaptures: 3, minDefeated: 5 }
      ],
      specials: [
        { species: 'Brookfin', rarity: 'legendary', chance: 0.06, minSteps: 110, minDefeated: 4, terrain: 'grass' }
      ],
      boss: { trainer: 'Angler Nia', badge: 'Creek', species: 'Tide Cub', rewardCoins: 38, requiredBadges: 2, minCaptures: 5, minDefeated: 6, minLeadLevel: 9, levelBonus: 5 }
    },
    {
      label: 'Dusk Hollow',
      palette: { plain: '#8691a8', grass: '#6c7c99', path: '#9b9078', water: '#556f97' },
      landmark: 'obelisk',
      pool: [
        { species: 'Gloom Bat', rarity: 'common', weight: 24 },
        { species: 'Marsh Mite', rarity: 'common', weight: 18 },
        { species: 'Quartz Beetle', rarity: 'common', weight: 18 },
        { species: 'Mossling', rarity: 'uncommon', weight: 12 },
        { species: 'Tide Cub', rarity: 'uncommon', weight: 10 },
        { species: 'Ember Pup', rarity: 'uncommon', weight: 8 },
        { species: 'Volt Finch', rarity: 'rare', weight: 6 },
        { species: 'Cinder Moth', rarity: 'rare', weight: 4 }
      ],
      fishPool: [
        { species: 'Lantern Eel', rarity: 'common', weight: 42 },
        { species: 'Tangle Crab', rarity: 'uncommon', weight: 28 },
        { species: 'Pebble Koi', rarity: 'rare', weight: 18 },
        { species: 'Storm Ray', rarity: 'rare', weight: 12 }
      ],
      fishSpecials: [
        { species: 'Storm Ray', rarity: 'legendary', chance: 0.05, minSteps: 150, minCaptures: 3 }
      ],
      dungeonPool: [
        { species: 'Mire Owl', rarity: 'uncommon', weight: 28 },
        { species: 'Dread Bat', rarity: 'rare', weight: 24 },
        { species: 'Quartz Beetle', rarity: 'rare', weight: 22 },
        { species: 'Hollow Hydra', rarity: 'legendary', weight: 12 }
      ],
      specials: [
        { species: 'Mire Owl', rarity: 'legendary', chance: 0.055, minSteps: 160, minCaptures: 4, minDefeated: 6, terrain: 'grass' },
        { species: 'Hollow Hydra', rarity: 'legendary', chance: 0.03, minSteps: 235, minCaptures: 5, minDefeated: 8, terrain: 'grass' }
      ],
      boss: { trainer: 'Warden Noir', badge: 'Dusk', species: 'Gloom Bat', rewardCoins: 46, requiredBadges: 3, minCaptures: 6, minDefeated: 8, minLeadLevel: 12, levelBonus: 6 }
    },
    {
      label: 'Thunder Ridge',
      palette: { plain: '#c5b17b', grass: '#b59753', path: '#d7c48d', water: '#6f91b8' },
      landmark: 'teslapost',
      pool: [
        { species: 'Volt Finch', rarity: 'common', weight: 22 },
        { species: 'Quartz Beetle', rarity: 'common', weight: 20 },
        { species: 'Gale Antler', rarity: 'common', weight: 18 },
        { species: 'Ember Pup', rarity: 'uncommon', weight: 14 },
        { species: 'Gloom Bat', rarity: 'uncommon', weight: 10 },
        { species: 'Tide Cub', rarity: 'uncommon', weight: 8 },
        { species: 'Mossling', rarity: 'rare', weight: 5 },
        { species: 'Lantern Eel', rarity: 'rare', weight: 3 }
      ],
      fishPool: [
        { species: 'Lantern Eel', rarity: 'common', weight: 34 },
        { species: 'Tangle Crab', rarity: 'uncommon', weight: 26 },
        { species: 'Storm Ray', rarity: 'rare', weight: 24 },
        { species: 'Pebble Koi', rarity: 'rare', weight: 16 }
      ],
      fishSpecials: [
        { species: 'Storm Ray', rarity: 'legendary', chance: 0.06, minSteps: 210, minDefeated: 6 }
      ],
      dungeonPool: [
        { species: 'Static Ram', rarity: 'uncommon', weight: 28 },
        { species: 'Volt Talon', rarity: 'rare', weight: 22 },
        { species: 'Storm Ray', rarity: 'rare', weight: 20 },
        { species: 'Sun Stag', rarity: 'legendary', weight: 10 }
      ],
      specials: [
        { species: 'Static Ram', rarity: 'legendary', chance: 0.045, minSteps: 220, minDefeated: 8, terrain: 'grass' },
        { species: 'Sun Stag', rarity: 'legendary', chance: 0.028, minSteps: 260, minCaptures: 6, minDefeated: 9, terrain: 'grass' }
      ],
      boss: { trainer: 'Ace Rook', badge: 'Storm', species: 'Static Ram', rewardCoins: 58, requiredBadges: 4, minCaptures: 7, minDefeated: 10, minLeadLevel: 15, levelBonus: 7 }
    },
    {
      label: 'Wild Crown',
      palette: { plain: '#8cb46f', grass: '#5f8f47', path: '#d5c17d', water: '#6daec8' },
      landmark: 'crowntree',
      pool: [
        { species: 'Gale Antler', rarity: 'common', weight: 22 },
        { species: 'Bramble Hog', rarity: 'common', weight: 20 },
        { species: 'Ember Pup', rarity: 'uncommon', weight: 14 },
        { species: 'Tide Cub', rarity: 'uncommon', weight: 14 },
        { species: 'Quartz Beetle', rarity: 'uncommon', weight: 10 },
        { species: 'Volt Finch', rarity: 'rare', weight: 8 },
        { species: 'Gloom Bat', rarity: 'rare', weight: 7 },
        { species: 'Mossling', rarity: 'uncommon', weight: 5 }
      ],
      fishPool: [
        { species: 'Storm Ray', rarity: 'uncommon', weight: 36 },
        { species: 'Lantern Eel', rarity: 'rare', weight: 28 },
        { species: 'Tangle Crab', rarity: 'rare', weight: 20 },
        { species: 'Pebble Koi', rarity: 'rare', weight: 16 }
      ],
      fishSpecials: [
        { species: 'Storm Ray', rarity: 'legendary', chance: 0.08, minSteps: 300, minCaptures: 7, minDefeated: 10 },
        { species: 'Abyss Pike', rarity: 'legendary', chance: 0.05, minSteps: 320, minCaptures: 7, minDefeated: 10 }
      ],
      dungeonPool: [
        { species: 'Rose Lynx', rarity: 'uncommon', weight: 24 },
        { species: 'Bastion Stag', rarity: 'rare', weight: 22 },
        { species: 'Crownwyrm', rarity: 'rare', weight: 18 },
        { species: 'Bloom Seraph', rarity: 'legendary', weight: 10 }
      ],
      specials: [
        { species: 'Crownwyrm', rarity: 'legendary', chance: 0.03, minSteps: 320, minCaptures: 8, minDefeated: 12, terrain: 'grass' },
        { species: 'Bloom Seraph', rarity: 'legendary', chance: 0.026, minSteps: 290, minCaptures: 7, minDefeated: 10, terrain: 'grass' },
        { species: 'Sun Stag', rarity: 'legendary', chance: 0.024, minSteps: 300, minCaptures: 7, minDefeated: 11, terrain: 'grass' }
      ],
      boss: { trainer: 'Regent Sol', badge: 'Crown', species: 'Crownwyrm', rewardCoins: 72, requiredBadges: 5, minCaptures: 9, minDefeated: 13, minLeadLevel: 18, levelBonus: 8 }
    },
    {
      label: 'Sunspoke Flats',
      palette: { plain: '#d0bc74', grass: '#bc9d4f', path: '#ead8a5', water: '#7ba4c4' },
      landmark: 'teslapost',
      pool: [
        { species: 'Searhorn', rarity: 'common', weight: 20 },
        { species: 'Prism Jackal', rarity: 'common', weight: 20 },
        { species: 'Static Ram', rarity: 'common', weight: 16 },
        { species: 'Gale Antler', rarity: 'uncommon', weight: 14 },
        { species: 'Quartz Beetle', rarity: 'uncommon', weight: 12 },
        { species: 'Ember Hound', rarity: 'uncommon', weight: 10 },
        { species: 'Volt Talon', rarity: 'rare', weight: 5 },
        { species: 'Sun Stag', rarity: 'rare', weight: 3 }
      ],
      fishPool: [
        { species: 'Lantern Eel', rarity: 'common', weight: 32 },
        { species: 'Storm Ray', rarity: 'uncommon', weight: 26 },
        { species: 'Pebble Koi', rarity: 'uncommon', weight: 22 },
        { species: 'Abyss Pike', rarity: 'rare', weight: 20 }
      ],
      fishSpecials: [
        { species: 'Storm Ray', rarity: 'legendary', chance: 0.075, minSteps: 360, minCaptures: 8, minDefeated: 12 },
        { species: 'Abyss Pike', rarity: 'legendary', chance: 0.052, minSteps: 380, minCaptures: 8, minDefeated: 12 }
      ],
      dungeonPool: [
        { species: 'Searhorn', rarity: 'uncommon', weight: 28 },
        { species: 'Prism Jackal', rarity: 'uncommon', weight: 26 },
        { species: 'Comet Drake', rarity: 'rare', weight: 18 },
        { species: 'Sun Stag', rarity: 'legendary', weight: 10 }
      ],
      specials: [
        { species: 'Searhorn', rarity: 'legendary', chance: 0.05, minSteps: 350, minCaptures: 8, minDefeated: 12, terrain: 'grass' },
        { species: 'Prism Jackal', rarity: 'legendary', chance: 0.04, minSteps: 370, minCaptures: 8, minDefeated: 12, terrain: 'grass' },
        { species: 'Sun Stag', rarity: 'legendary', chance: 0.024, minSteps: 390, minCaptures: 9, minDefeated: 13, terrain: 'grass' }
      ],
      boss: { trainer: 'Marshal Helios', badge: 'Sun', species: 'Prism Jackal', rewardCoins: 84, requiredBadges: 6, minCaptures: 10, minDefeated: 14, minLeadLevel: 20, levelBonus: 9 }
    },
    {
      label: 'Mirror Fen',
      palette: { plain: '#a7c8bf', grass: '#73a99a', path: '#d9dbc8', water: '#7bc2d4' },
      landmark: 'reeds',
      pool: [
        { species: 'Glass Heron', rarity: 'common', weight: 20 },
        { species: 'Murk Lotus', rarity: 'common', weight: 19 },
        { species: 'Brookfin', rarity: 'common', weight: 15 },
        { species: 'Marsh Mite', rarity: 'uncommon', weight: 12 },
        { species: 'Tangle Crab', rarity: 'uncommon', weight: 12 },
        { species: 'Mire Owl', rarity: 'uncommon', weight: 10 },
        { species: 'Abyss Pike', rarity: 'rare', weight: 7 },
        { species: 'Bloom Seraph', rarity: 'rare', weight: 5 }
      ],
      fishPool: [
        { species: 'Glass Heron', rarity: 'common', weight: 24 },
        { species: 'Brookfin', rarity: 'common', weight: 20 },
        { species: 'Lantern Eel', rarity: 'common', weight: 24 },
        { species: 'Tangle Crab', rarity: 'uncommon', weight: 18 },
        { species: 'Storm Ray', rarity: 'rare', weight: 14 },
        { species: 'Abyss Pike', rarity: 'rare', weight: 10 }
      ],
      fishSpecials: [
        { species: 'Abyss Pike', rarity: 'legendary', chance: 0.06, minSteps: 395, minCaptures: 9, minDefeated: 13 }
      ],
      dungeonPool: [
        { species: 'Murk Lotus', rarity: 'uncommon', weight: 26 },
        { species: 'Veil Crane', rarity: 'rare', weight: 22 },
        { species: 'Abyss Pike', rarity: 'rare', weight: 18 },
        { species: 'Bloom Seraph', rarity: 'legendary', weight: 12 }
      ],
      specials: [
        { species: 'Murk Lotus', rarity: 'legendary', chance: 0.042, minSteps: 390, minCaptures: 9, minDefeated: 13, terrain: 'grass' },
        { species: 'Bloom Seraph', rarity: 'legendary', chance: 0.028, minSteps: 400, minCaptures: 9, minDefeated: 13, terrain: 'grass' },
        { species: 'Hollow Hydra', rarity: 'legendary', chance: 0.028, minSteps: 420, minCaptures: 10, minDefeated: 14, terrain: 'grass' }
      ],
      boss: { trainer: 'Oracle Selene', badge: 'Mirror', species: 'Glass Heron', rewardCoins: 90, requiredBadges: 7, minCaptures: 11, minDefeated: 15, minLeadLevel: 21, levelBonus: 10 }
    },
    {
      label: 'Ashen Circuit',
      palette: { plain: '#716768', grass: '#54494f', path: '#a88f75', water: '#5d6d85' },
      landmark: 'obelisk',
      pool: [
        { species: 'Cinder Scarab', rarity: 'common', weight: 20 },
        { species: 'Hex Coil', rarity: 'common', weight: 18 },
        { species: 'Ember Hound', rarity: 'common', weight: 16 },
        { species: 'Dread Bat', rarity: 'uncommon', weight: 14 },
        { species: 'Quartz Beetle', rarity: 'uncommon', weight: 12 },
        { species: 'Static Ram', rarity: 'uncommon', weight: 10 },
        { species: 'Hollow Hydra', rarity: 'rare', weight: 6 },
        { species: 'Crownwyrm', rarity: 'rare', weight: 4 }
      ],
      fishPool: [
        { species: 'Lantern Eel', rarity: 'common', weight: 30 },
        { species: 'Storm Ray', rarity: 'uncommon', weight: 24 },
        { species: 'Pebble Koi', rarity: 'uncommon', weight: 20 },
        { species: 'Abyss Pike', rarity: 'rare', weight: 14 },
        { species: 'Tangle Crab', rarity: 'rare', weight: 12 }
      ],
      fishSpecials: [
        { species: 'Storm Ray', rarity: 'legendary', chance: 0.068, minSteps: 430, minCaptures: 10, minDefeated: 15 }
      ],
      dungeonPool: [
        { species: 'Cinder Scarab', rarity: 'uncommon', weight: 24 },
        { species: 'Hex Coil', rarity: 'uncommon', weight: 24 },
        { species: 'Void Basilisk', rarity: 'rare', weight: 16 },
        { species: 'Hollow Hydra', rarity: 'legendary', weight: 10 }
      ],
      specials: [
        { species: 'Hex Coil', rarity: 'legendary', chance: 0.04, minSteps: 425, minCaptures: 10, minDefeated: 15, terrain: 'grass' },
        { species: 'Cinder Scarab', rarity: 'legendary', chance: 0.036, minSteps: 430, minCaptures: 10, minDefeated: 15, terrain: 'grass' },
        { species: 'Hollow Hydra', rarity: 'legendary', chance: 0.03, minSteps: 450, minCaptures: 11, minDefeated: 16, terrain: 'grass' }
      ],
      boss: { trainer: 'Circuit Lord Vexa', badge: 'Ash', species: 'Hex Coil', rewardCoins: 98, requiredBadges: 8, minCaptures: 12, minDefeated: 16, minLeadLevel: 22, levelBonus: 10 }
    },
    {
      label: 'Moonlit Delta',
      palette: { plain: '#9aa2cd', grass: '#737fba', path: '#d6d0e8', water: '#577fca' },
      landmark: 'reeds',
      pool: [
        { species: 'Lunarkoi', rarity: 'common', weight: 20 },
        { species: 'Veil Crane', rarity: 'common', weight: 18 },
        { species: 'Mire Owl', rarity: 'common', weight: 15 },
        { species: 'Brookfin', rarity: 'uncommon', weight: 12 },
        { species: 'Dread Bat', rarity: 'uncommon', weight: 12 },
        { species: 'Riverclaw', rarity: 'uncommon', weight: 10 },
        { species: 'Bloom Seraph', rarity: 'rare', weight: 8 },
        { species: 'Abyss Pike', rarity: 'rare', weight: 5 }
      ],
      fishPool: [
        { species: 'Lunarkoi', rarity: 'common', weight: 24 },
        { species: 'Storm Ray', rarity: 'common', weight: 22 },
        { species: 'Lantern Eel', rarity: 'common', weight: 24 },
        { species: 'Abyss Pike', rarity: 'uncommon', weight: 20 },
        { species: 'Brookfin', rarity: 'uncommon', weight: 10 },
        { species: 'Pebble Koi', rarity: 'rare', weight: 10 }
      ],
      fishSpecials: [
        { species: 'Stormlure', rarity: 'mythic', chance: 0.008, minSteps: 570, minCaptures: 15, minDefeated: 20, minBadges: 10 },
        { species: 'Abyss Pike', rarity: 'legendary', chance: 0.072, minSteps: 470, minCaptures: 11, minDefeated: 16 },
        { species: 'Storm Ray', rarity: 'legendary', chance: 0.056, minSteps: 450, minCaptures: 10, minDefeated: 15 }
      ],
      specials: [
        { species: 'Veil Crane', rarity: 'legendary', chance: 0.04, minSteps: 445, minCaptures: 10, minDefeated: 15, terrain: 'grass' },
        { species: 'Bloom Seraph', rarity: 'legendary', chance: 0.026, minSteps: 455, minCaptures: 11, minDefeated: 16, terrain: 'grass' },
        { species: 'Sun Stag', rarity: 'legendary', chance: 0.026, minSteps: 485, minCaptures: 11, minDefeated: 17, terrain: 'grass' }
      ],
      boss: { trainer: 'Lunarch Nyra', badge: 'Moon', species: 'Veil Crane', rewardCoins: 106, requiredBadges: 9, minCaptures: 13, minDefeated: 17, minLeadLevel: 23, levelBonus: 11 }
    },
    {
      label: 'Ironwood Reach',
      palette: { plain: '#6f8d65', grass: '#465f3f', path: '#b0a084', water: '#688fa0' },
      landmark: 'fern',
      pool: [
        { species: 'Rootback', rarity: 'common', weight: 20 },
        { species: 'Bastion Stag', rarity: 'common', weight: 18 },
        { species: 'Moss Guardian', rarity: 'common', weight: 14 },
        { species: 'Gale Antler', rarity: 'uncommon', weight: 12 },
        { species: 'Quartz Beetle', rarity: 'uncommon', weight: 10 },
        { species: 'Ember Hound', rarity: 'uncommon', weight: 10 },
        { species: 'Rose Lynx', rarity: 'rare', weight: 9 },
        { species: 'Crownwyrm', rarity: 'rare', weight: 7 }
      ],
      fishPool: [
        { species: 'Brookfin', rarity: 'common', weight: 26 },
        { species: 'Tangle Crab', rarity: 'common', weight: 22 },
        { species: 'Lantern Eel', rarity: 'uncommon', weight: 20 },
        { species: 'Storm Ray', rarity: 'rare', weight: 18 },
        { species: 'Abyss Pike', rarity: 'rare', weight: 14 }
      ],
      fishSpecials: [
        { species: 'Storm Ray', rarity: 'legendary', chance: 0.064, minSteps: 500, minCaptures: 12, minDefeated: 17 }
      ],
      specials: [
        { species: 'Nightfang', rarity: 'mythic', chance: 0.008, minSteps: 565, minCaptures: 15, minDefeated: 20, minBadges: 10, terrain: 'grass' },
        { species: 'Bastion Stag', rarity: 'legendary', chance: 0.04, minSteps: 490, minCaptures: 12, minDefeated: 17, terrain: 'grass' },
        { species: 'Rootback', rarity: 'legendary', chance: 0.034, minSteps: 500, minCaptures: 12, minDefeated: 17, terrain: 'grass' },
        { species: 'Crownwyrm', rarity: 'legendary', chance: 0.03, minSteps: 520, minCaptures: 13, minDefeated: 18, terrain: 'grass' }
      ],
      boss: { trainer: 'Warden Brigg', badge: 'Ironwood', species: 'Rootback', rewardCoins: 114, requiredBadges: 10, minCaptures: 14, minDefeated: 18, minLeadLevel: 24, levelBonus: 11 }
    },
    {
      label: 'Starfall Wastes',
      palette: { plain: '#cfc8b9', grass: '#9ca7a7', path: '#f1e7cb', water: '#83b8c6' },
      landmark: 'crowntree',
      pool: [
        { species: 'Comet Drake', rarity: 'common', weight: 18 },
        { species: 'Astral Leviathan', rarity: 'common', weight: 16 },
        { species: 'Sun Stag', rarity: 'common', weight: 14 },
        { species: 'Crownwyrm', rarity: 'uncommon', weight: 12 },
        { species: 'Bloom Seraph', rarity: 'uncommon', weight: 12 },
        { species: 'Hollow Hydra', rarity: 'uncommon', weight: 10 },
        { species: 'Volt Talon', rarity: 'rare', weight: 9 },
        { species: 'Rose Lynx', rarity: 'rare', weight: 9 }
      ],
      fishPool: [
        { species: 'Astral Leviathan', rarity: 'common', weight: 20 },
        { species: 'Storm Ray', rarity: 'common', weight: 20 },
        { species: 'Abyss Pike', rarity: 'common', weight: 20 },
        { species: 'Lantern Eel', rarity: 'uncommon', weight: 18 },
        { species: 'Brookfin', rarity: 'rare', weight: 12 },
        { species: 'Pebble Koi', rarity: 'rare', weight: 16 }
      ],
      fishSpecials: [
        { species: 'Riftfin', rarity: 'mythic', chance: 0.007, minSteps: 600, minCaptures: 16, minDefeated: 22, minBadges: 11 },
        { species: 'Astral Leviathan', rarity: 'legendary', chance: 0.085, minSteps: 545, minCaptures: 13, minDefeated: 18 },
        { species: 'Storm Ray', rarity: 'legendary', chance: 0.07, minSteps: 545, minCaptures: 13, minDefeated: 18 },
        { species: 'Abyss Pike', rarity: 'legendary', chance: 0.07, minSteps: 545, minCaptures: 13, minDefeated: 18 }
      ],
      specials: [
        { species: 'Infernyx', rarity: 'mythic', chance: 0.007, minSteps: 590, minCaptures: 16, minDefeated: 22, minBadges: 11, terrain: 'grass' },
        { species: 'Comet Drake', rarity: 'legendary', chance: 0.04, minSteps: 538, minCaptures: 13, minDefeated: 18, terrain: 'grass' },
        { species: 'Astral Leviathan', rarity: 'legendary', chance: 0.03, minSteps: 540, minCaptures: 13, minDefeated: 18, terrain: 'grass' },
        { species: 'Crownwyrm', rarity: 'legendary', chance: 0.024, minSteps: 540, minCaptures: 13, minDefeated: 18, terrain: 'grass' }
      ],
      boss: { trainer: 'Astral Nyx', badge: 'Starfall', species: 'Comet Drake', rewardCoins: 126, requiredBadges: 11, minCaptures: 15, minDefeated: 20, minLeadLevel: 26, levelBonus: 12 }
    }
  ];
  const playerSprite = ['........', '..111...', '.112211.', '..1331..', '.133331.', '..3223..', '..2..2..', '..4..4..'];
  const playerSprites = Object.fromEntries(
    Array.from({ length: 16 }, (_, index) => {
      const spriteNumber = index + 1;
      const sheetIndex = Math.floor(index / 8);
      const sheetSpriteIndex = index % 8;
      return [
        `sprite${spriteNumber}`,
        {
          label: `Sprite ${spriteNumber}`,
          sheetId: `sheet${sheetIndex + 1}`,
          sheetFrameX: (sheetSpriteIndex % 4) * 3,
          sheetFrameY: Math.floor(sheetSpriteIndex / 4) * 4
        }
      ];
    })
  );
  const defaultPlayerSpriteId = 'sprite1';
  const trainerSprite = ['........', '..111...', '.122221.', '..1331..', '.133331.', '..3443..', '..4..4..', '.5....5.'];
  const routeNpcDialogues = [
    'The roads feel safer when other tamers are nearby.',
    'I always keep one tonic tucked away for emergencies.',
    'Some paths look quiet until the grass starts shaking.',
    'Town cooks say a warm meal helps after a long route.',
    'I heard rare monsters like the edges of the wilds best.',
    'If a route forks, I usually follow the busiest track first.',
    'Fishing sounds peaceful until something massive bites.',
    'A good partner knows when to press on and when to rest.',
    'I mark every town on my map before heading farther out.',
    'Sometimes the shortest path is the one with the most trouble.',
    'The farther routes always seem to carry a different wind.',
    'I like meeting monsters in the field before checking the index.',
    'Some trainers battle anyone they see. I prefer to chat first.',
    'A route can feel completely different depending on the weather.',
    'I once found a charm tucked beside an old signpost.',
    'If you get turned around, follow the path back toward town lights.',
    'Tall grass makes every trip feel like a gamble.',
    'The best catches always seem to show up when supplies run low.',
    'I try to keep my party balanced before I challenge a town boss.',
    'The world feels bigger once you start noticing the side paths.',
    'Some people race between towns. I like taking the scenic route.',
    'A calm route usually means the stronger monsters are still ahead.',
    'I swear the landmark trees watch travelers pass by.',
    'You can learn a lot just by standing still and listening to a route.'
  ];
  const tallGrassSprite = ['........', '.1.1.1..', '..1.1...', '.1.11.1.', '..11....', '.1..1.1.', '........', '........'];
  const treeSprite = ['...11...', '..1221..', '.122221.', '.122221.', '..2332..', '...33...', '...44...', '..4..4..'];
  const fieldStationSprite = ['11111111', '12222221', '12333321', '12344321', '12344321', '12333321', '12222221', '11111111'];
  const capsuleSprite = ['...11...', '..1221..', '.123321.', '.123321.', '.144441.', '..1441..', '...11...', '........'];
  const coinSprite = ['..1111..', '.122221.', '.123321.', '.123321.', '.122221.', '..1111..', '........', '........'];
  const tonicSprite = ['...11...', '..1221..', '..1331..', '..1331..', '..1331..', '...44...', '..4444..', '........'];
  const cacheSprite = ['11111111', '12222221', '12333321', '12333321', '12333321', '12222221', '14444441', '........'];
  const charmSprite = ['...11...', '..1221..', '.123321.', '12344321', '.123321.', '..1221..', '...11...', '........'];
  const bobberSprite = ['........', '...11...', '..1221..', '..1331..', '...11...', '........', '........', '........'];
  const landmarkSprites = {
    signpost: { sprite: ['........', '..11....', '..11....', '..11....', '.1221...', '.1221...', '111111..', '........'], palette: { '1': '#74502b', '2': '#f3e3b1' } },
    fern: { sprite: ['...1....', '..121...', '.12221..', '..121...', '...1....', '..121...', '.1.1.1..', '........'], palette: { '1': '#2f7c3a', '2': '#68bf63' } },
    reeds: { sprite: ['.1..1...', '.1..1...', '.12.21..', '.12221..', '.1.1.1..', '.1.1.1..', '........', '........'], palette: { '1': '#6f9d4d', '2': '#c9df7c' } },
    obelisk: { sprite: ['...11...', '..1221..', '..1331..', '..1331..', '..1331..', '..1221..', '.444444.', '........'], palette: { '1': '#444b59', '2': '#8992a3', '3': '#5d6675', '4': '#6f5f7a' } },
    teslapost: { sprite: ['...11...', '..1221..', '11133111', '...33...', '...33...', '..3443..', '..3..3..', '........'], palette: { '1': '#f2d468', '2': '#c5b17b', '3': '#6e5a3a', '4': '#99c6ff' } },
    crowntree: { sprite: ['...11...', '..1221..', '.122221.', '.123321.', '..2332..', '..2442..', '..4..4..', '........'], palette: { '1': '#d4c16a', '2': '#4f8a3b', '3': '#6aa24c', '4': '#694721' } }
  };

export {
  speciesList,
  speciesByName,
  rarityMeta,
  typeMeta,
  speciesTypesBySpecies,
  typeChart,
  evolutionData,
  statusMeta,
  passiveTraitsBySpecies,
  thirdMovesBySpecies,
  routeTrainerNames,
  routeTrainerTitles,
  routeProfiles,
  playerSprites,
  defaultPlayerSpriteId,
  playerSprite,
  trainerSprite,
  routeNpcDialogues,
  tallGrassSprite,
  treeSprite,
  fieldStationSprite,
  capsuleSprite,
  coinSprite,
  tonicSprite,
  cacheSprite,
  charmSprite,
  bobberSprite,
  landmarkSprites
};
