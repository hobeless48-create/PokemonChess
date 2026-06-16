// =============================================================================
// data.js — COMPRESSED POKEMON DATABASE (FACTORY PATTERN)
// =============================================================================
//
// # ARRAY EXPLANATIONS:
// # types: [ "PrimaryType", "SecondaryType" ] -> e.g., ["Grass", "Poison"] or ["Fire", ""]
// # stats: [ HP, ATK, DEF ]                   -> e.g., [8, 2, 0]
//
// # HOW TO USE Pkmn() (The Pokemon Builder):
// # Pkmn(dex, types, cost, stats, role, "Ability - Description", [ Skills ], { Extras })
//
// # HOW TO USE S() (The Skill Builder):
// # S("Skill Name", "Shape/Target", Damage, { Extra effects like status, heal, cost })
// =============================================================================

const DEFAULT_PKMN = {
  t2: "", base: false, legendary: false,
  evoCost: null, evoTo: null, evoFrom: null, def: 0
};

// --- Helper to build Skills ---
function S(name, desc, dmg, extra = {}) {
  return {
    skillName: name,
    skillDesc: desc,
    skillDmg: dmg,
    skillRaw: `${name} (${desc}): Deal ${dmg} damage`,
    ...extra
  };
}

// --- Helper to build Pokemon ---
function Pkmn(dex, types, cost, stats, cls, abilityFull, skills, extra = {}) {
  const [abilityName, ...descParts] = abilityFull.split(" - ");
  return {
    ...DEFAULT_PKMN,
    dex,
    t1: types[0],
    t2: types[1] || "",
    cost,
    hp: stats[0],
    maxHp: stats[0],
    atk: stats[1],
    def: stats[2] || 0,
    cls,
    ability: abilityName.trim(),
    abilityDesc: descParts.join(" - ").trim(),
    img: `https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${String(dex).padStart(3, '0')}.png`,
    skills,
    skillName: skills[0]?.skillName,
    skillDesc: skills[0]?.skillDesc,
    skillDmg: skills[0]?.skillDmg,
    ...extra
  };
}

// =============================================================================
// THE DATABASE
// =============================================================================

const DB = {

  // --- GRASS STARTER LINE ---
  Bulbasaur: Pkmn(1, ["Grass", "Poison"], 3, [8, 2, 0], "Support",
    "Overgrow - When HP ≤ 50%, deal +1 damage with Grass skills",
    [ S("Leech Seed", "Line(1)(3)", 1, { special: "leechSeed", specialDuration: 2, skillRaw: "Leech Seed (Target 1: Drain 1 HP/turn for 2 turns, heal user equal amount)" }) ],
    { base: true, evoCost: 6, evoTo: "Ivysaur", color: "#3B6D11" }
  ),
  Ivysaur: Pkmn(2, ["Grass", "Poison"], 3, [10, 3, 0], "Support",
    "Overgrow - When HP ≤ 50%, deal +1 damage with Grass skills",
    [ S("Razor Leaf", "Line(2)(1)", 3) ],
    { evoFrom: "Bulbasaur", evoCost: 9, evoTo: "Venusaur", color: "#3B6D11" }
  ),
  Venusaur: Pkmn(3, ["Grass", "Poison"], 3, [14, 4, 1], "Defense",
    "Chlorophyll - 1 per turn reduce energy cost to move by 1",
    [ S("Solar Beam", "AoE(2)", 4, { skillCost: 4, skillRaw: "Solar Beam (AoE(2): Deal 4 damage. Energy Cost = 4. If Sunny Day active, costs 1 less Energy)" }) ],
    { evoFrom: "Ivysaur", color: "#3B6D11" }
  ),

  // --- FIRE STARTER LINE ---
  Charmander: Pkmn(4, ["Fire", ""], 3, [7, 3, 0], "Attack",
    "Blaze - When HP ≤ 50%, deal +1 damage with Fire skills",
    [ S("Ember", "Line(2)(3)", 2, { statusChance: "burn", statusChanceValue: 0.3, skillRaw: "Ember (Target 2: Deal 2 damage, 30% chance to Burn for 2 turns)" }) ],
    { base: true, evoCost: 6, evoTo: "Charmeleon", color: "#D85A30" }
  ),
  Charmeleon: Pkmn(5, ["Fire", ""], 3, [9, 4, 0], "Attack",
    "Blaze - When HP ≤ 50%, deal +1 damage with Fire skills",
    [ S("Flamethrower", "Line(3)(1)", 3, { statusChance: "burn", statusChanceValue: 0.3, skillRaw: "Flamethrower (Line(3)(1): Deal 3 damage, 30% chance to Burn for 2 turns)" }) ],
    { evoFrom: "Charmander", evoCost: 9, evoTo: "Charizard", color: "#D85A30" }
  ),
  Charizard: Pkmn(6, ["Fire", "Flying"], 3, [12, 5, 1], "Attack",
    "Solar Power - In Sunny Weather, Atk +2 but takes 2 damage at the end of the turn",
    [ S("Fire Blast", "Line(1)(3)", 4, { statusChance: "burn", statusChanceValue: 0.3, skillRaw: "Fire Blast (Cross(1-tile out from target, range 3): Deal 4 damage, 30% chance to Burn for 2 turns)" }) ],
    { evoFrom: "Charmeleon", color: "#D85A30" }
  ),

  // --- WATER STARTER LINE ---
  Squirtle: Pkmn(7, ["Water", ""], 3, [8, 2, 1], "Defense",
    "Torrent - When HP ≤ 50%, deal +1 damage with Water skills",
    [ S("Water Gun", "Line(2)(3)", 2, { skillRaw: "Water Gun (Line(2): Deal 2 damage)" }) ],
    { base: true, evoCost: 6, evoTo: "Wartortle", color: "#185FA5" }
  ),
  Wartortle: Pkmn(8, ["Water", ""], 3, [10, 3, 2], "Defense",
    "Torrent - When HP ≤ 50%, deal +1 damage with Water skills",
    [ S("Water Pulse", "AoE(1)", 2, { statusChance: "confuse", statusChanceValue: 0.2, skillRaw: "Water Pulse (AoE(1): Deal 2 damage, 20% chance to Confuse for 3 turns)" }) ],
    { evoFrom: "Squirtle", evoCost: 9, evoTo: "Blastoise", color: "#185FA5" }
  ),
  Blastoise: Pkmn(9, ["Water", ""], 3, [13, 4, 2], "Defense",
    "Rain Dish - In Rain, heals 1 HP at start of turn",
    [ S("Hydro Cannon", "Line(3)(1)", 6, { skillCost: 3, skillRaw: "Hydro Cannon (Line(3)(1): Deal 6 damage, Cost 3)" }) ],
    { evoFrom: "Wartortle", color: "#185FA5" }
  ),

  // --- BUG LINE (CATERPIE) ---
  Caterpie: Pkmn(10, ["Bug", ""], 1, [6, 1, 0], "Support",
    "Shield Dust - Immune to secondary effects of enemy skills",
    [ S("String Shot", "Line(1)(3)", 0, { skillRaw: "String Shot (Line(1): Next turn target move cost +1)" }) ],
    { base: true, evoCost: 3, evoTo: "Metapod", color: "#6D8E1E" }
  ),
  Metapod: Pkmn(11, ["Bug", ""], 1, [8, 1, 1], "Defense",
    "Shed Skin - 30% chance to cure status conditions at start of turn",
    [ S("Harden", "Self", 0, { skillEffect: { target: "self", stat: "def", amount: 1, duration: 3 }, skillRaw: "Harden (Self: Gain +1 Def for 3 turns)" }) ],
    { evoFrom: "Caterpie", evoCost: 4, evoTo: "Butterfree", color: "#6D8E1E" }
  ),
  Butterfree: Pkmn(12, ["Bug", "Flying"], 1, [10, 3, 1], "Support",
    "Compound Eyes - Skills have 30% higher status infliction chance",
    [ S("Sleep Powder", "Line(3)(3)", 0, { statusChance: "sleep", statusChanceValue: 0.5, skillRaw: "Sleep Powder (Target 3: 50% chance to inflict Sleep for 3 turns)" }) ],
    { evoFrom: "Metapod", color: "#6D8E1E" }
  ),

  // --- BUG LINE (WEEDLE) ---
  Weedle: Pkmn(13, ["Bug", "Poison"], 1, [5, 2, 0], "Attack",
    "Shield Dust - Immune to secondary effects of enemy skills",
    [ S("Poison Sting", "Line(1)(3)", 1, { statusChance: "poison", statusChanceValue: 0.3, skillRaw: "Poison Sting (Target 1: Deal 1 damage, 30% chance to Poison for 3 turns)" }) ],
    { base: true, evoCost: 3, evoTo: "Kakuna", color: "#6D8E1E" }
  ),
  Kakuna: Pkmn(14, ["Bug", "Poison"], 1, [7, 1, 1], "Defense",
    "Shed Skin - 30% chance to cure status conditions at start of turn",
    [ S("Iron Defense", "Self", 0, { skillEffect: { target: "self", stat: "def", amount: 2, duration: 2 }, skillRaw: "Iron Defense (Self: Gain +2 Def for 2 turns)" }) ],
    { evoFrom: "Weedle", evoCost: 4, evoTo: "Beedrill", color: "#6D8E1E" }
  ),
  Beedrill: Pkmn(15, ["Bug", "Poison"], 1, [9, 4, 1], "Assassin",
    "Swarm - When HP ≤ 50%, deal +1 damage with Bug skills",
    [ S("Twin Needle", "Line(2)(3)", 4, { skillRaw: "Twin Needle (Target 2: Deal 4 damage. Attacks twice, hitting for 2 damage each time)" }) ],
    { evoFrom: "Kakuna", color: "#6D8E1E" }
  ),

  // --- FLYING LINE (PIDGEY) ---
  Pidgey: Pkmn(16, ["Normal", "Flying"], 1, [6, 2, 0], "Support",
    "Keen Eye - Stats cannot be lowered by enemies",
    [ S("Sand Attack", "Line(2)(3)", 0, { skillEffect: { target: "enemy", stat: "atk", amount: -1, duration: 2 }, skillRaw: "Sand Attack (Target 2: Reduce target's Atk by 1 for 2 turns)" }) ],
    { base: true, evoCost: 4, evoTo: "Pidgeotto", color: "#5F5E5A" }
  ),
  Pidgeotto: Pkmn(17, ["Normal", "Flying"], 1, [9, 3, 0], "Support",
    "Keen Eye - Stats cannot be lowered by enemies",
    [ S("Gust", "Line(2)(1)", 3) ],
    { evoFrom: "Pidgey", evoCost: 7, evoTo: "Pidgeot", color: "#5F5E5A" }
  ),
  Pidgeot: Pkmn(18, ["Normal", "Flying"], 1, [12, 4, 1], "Attack",
    "Tangled Feet - When Confused, gains move cost reduce by 1 (2 time)",
    [ S("Hurricane", "AoE(1)", 4, { statusChance: "confuse", statusChanceValue: 0.3, skillRaw: "Hurricane (AoE(1-tile radius around target, range 3): Deal 4 damage, 30% chance to Confuse for 3 turns)" }) ],
    { evoFrom: "Pidgeotto", color: "#5F5E5A" }
  ),

  // --- NORMAL LINE (RATTATA) ---
  Rattata: Pkmn(19, ["Normal", ""], 1, [5, 3, 0], "Assassin",
    "Run Away - Can move through enemy-occupied tiles",
    [ S("Quick Attack", "Line(2)(3)", 3, { skillRaw: "Quick Attack (Target 2: Deal 3 damage. Always moves first in priority)" }) ],
    { base: true, evoCost: 5, evoTo: "Raticate", color: "#5F5E5A" }
  ),
  Raticate: Pkmn(20, ["Normal", ""], 1, [10, 4, 1], "Assassin",
    "Guts - When afflicted with status, Atk +2",
    [ S("Hyper Fang", "Line(1)(3)", 4, { skillRaw: "Hyper Fang (Target 1: Deal 4 damage, 10% chance target Flinches and skips next turn)" }) ],
    { evoFrom: "Rattata", color: "#5F5E5A" }
  ),

  // --- FLYING LINE (SPEAROW) ---
  Spearow: Pkmn(21, ["Normal", "Flying"], 1, [6, 3, 0], "Attack",
    "Keen Eye - Stats cannot be lowered by enemies",
    [ S("Peck", "Line(1)(3)", 3) ],
    { base: true, evoCost: 5, evoTo: "Fearow", color: "#5F5E5A" }
  ),
  Fearow: Pkmn(22, ["Normal", "Flying"], 1, [11, 4, 1], "Attack",
    "Sniper - Critical hits deal +3 damage instead of +2",
    [ S("Drill Peck", "Line(2)(1)", 4) ],
    { evoFrom: "Spearow", color: "#5F5E5A" }
  ),

  // --- POISON LINE (EKANS) ---
  Ekans: Pkmn(23, ["Poison", ""], 1, [6, 3, 0], "Support",
    "Intimidate - Any adjacent enemy gets Atk -1",
    [ S("Glare", "Line(2)(3)", 0, { statusChance: "paralysis", statusChanceValue: 0.5, skillRaw: "Glare (Target 2: 50% chance to Paralyze for 3 turns)" }) ],
    { base: true, evoCost: 6, evoTo: "Arbok", color: "#72243E" }
  ),
  Arbok: Pkmn(24, ["Poison", ""], 1, [11, 4, 1], "Defense",
    "Intimidate - Any adjacent enemy gets Atk -1",
    [ S("Crunch", "Line(1)(3)", 4, { skillEffect: { target: "enemy", stat: "def", amount: -1, duration: 2 }, skillRaw: "Crunch (Target 1: Deal 4 damage, 20% chance to lower target's Def by 1)" }) ],
    { evoFrom: "Ekans", color: "#72243E" }
  ),

  // --- ELECTRIC LINE (PIKACHU) ---
  Pikachu: Pkmn(25, ["Electric", ""], 2, [7, 3, 0], "Attack",
    "Static - Contact attacks have a 30% chance to Paralyze the attacker for 3 turns",
    [ S("Thunderbolt", "Line(3)(3)", 2, { statusChance: "paralysis", statusChanceValue: 0.1, skillRaw: "Thunderbolt (Target 3: Deal 2 damage, 10% chance to Paralyze for 3 turns)" }) ],
    { base: true, evoCost: 7, evoTo: "Raichu", color: "#BA7517" }
  ),
  Raichu: Pkmn(26, ["Electric", ""], 2, [11, 5, 1], "Attack",
    "Lightning Rod - Draws all single-target Electric skills to itself; immune to Electric damage",
    [ S("Thunder", "Line(4)(3)", 4, { statusChance: "paralysis", statusChanceValue: 0.3, skillRaw: "Thunder (Target 4: Deal 4 damage, 30% chance to Paralyze for 3 turns)" }) ],
    { evoFrom: "Pikachu", color: "#BA7517" }
  ),

  // --- GROUND LINE (SANDSHREW) ---
  Sandshrew: Pkmn(27, ["Ground", ""], 2, [8, 3, 1], "Defense",
    "Sand Veil - In Sandstorm, increases dodge chance by 20%",
    [ S("Rollout", "Line(1)(3)", 2, { skillRaw: "Rollout (Target 1: Deal 2 damage. Damage increases by 1 each consecutive hit up to +2)" }) ],
    { base: true, evoCost: 6, evoTo: "Sandslash", color: "#854F0B" }
  ),
  Sandslash: Pkmn(28, ["Ground", ""], 2, [12, 4, 2], "Defense",
    "Sand Rush - In Sandstorm, movement range is doubled",
    [ S("Earthquake", "AoE(2)", 4, { skillRaw: "Earthquake (AoE(All tiles within 2-tile radius around user): Deal 4 damage)" }) ],
    { evoFrom: "Sandshrew", color: "#854F0B" }
  ),

  // --- POISON LINE (NIDORAN F) ---
  NidoranF: Pkmn(29, ["Poison", ""], 2, [8, 2, 1], "Support",
    "Poison Point - When hit by melee, 30% chance Poison attacker for 4 turns",
    [ S("Growl", "Cone(2)(3)", 0, { skillEffect: { target: "enemy", stat: "atk", amount: -1, duration: 2 }, skillRaw: "Growl (Cone(2): Enemies in cone get -1 Atk for 2 turns)" }) ],
    { base: true, evoCost: 5, evoTo: "Nidorina", color: "#72243E" }
  ),
  Nidorina: Pkmn(30, ["Poison", ""], 2, [10, 3, 1], "Support",
    "Rivalry - Deal +1 damage if target same gender, -1 if opposite",
    [ S("Bite", "Line(1)(3)", 3, { skillRaw: "Bite (Line(1): Deal 3 damage, 30% chance Flinch)" }) ],
    { evoFrom: "NidoranF", evoCost: 7, evoTo: "Nidoqueen", color: "#72243E" }
  ),
  Nidoqueen: Pkmn(31, ["Poison", "Ground"], 2, [14, 4, 2], "Defense",
    "Sheer Force - Skills with secondary effects deal +1 damage but lose effects",
    [ S("Earth Power", "Line(3)(1)", 4, { skillEffect: { target: "enemy", stat: "def", amount: -1, duration: 2 }, skillRaw: "Earth Power (Line(3)(1): Deal 4 damage, lower target Def by 1 for 2 turns)" }) ],
    { evoFrom: "Nidorina", color: "#72243E" }
  ),

  // --- POISON LINE (NIDORAN M) ---
  NidoranM: Pkmn(32, ["Poison", ""], 2, [7, 2, 0], "Attack",
    "Rivalry - Deal +1 damage if target same gender, -1 if opposite",
    [ S("Horn Attack", "Line(1)(3)", 3) ],
    { base: true, evoCost: 5, evoTo: "Nidorino", color: "#72243E" }
  ),
  Nidorino: Pkmn(33, ["Poison", ""], 2, [10, 3, 0], "Attack",
    "Poison Point - When hit by melee, 30% chance Poison attacker for 4 turns",
    [ S("Poison Jab", "Line(1)(3)", 3, { statusChance: "poison", statusChanceValue: 0.6, skillRaw: "Poison Jab (Line(1): Deal 3 damage, 60% chance Poison for 4 turns)" }) ],
    { evoFrom: "NidoranM", evoCost: 7, evoTo: "Nidoking", color: "#72243E" }
  ),
  Nidoking: Pkmn(34, ["Poison", "Ground"], 2, [13, 5, 1], "Attack",
    "Sheer Force - Skills with secondary effects deal +1 damage but lose effects",
    [ S("Megahorn", "Line(2)(1)", 5) ],
    { evoFrom: "Nidorino", color: "#72243E" }
  ),

  // --- FAIRY LINE (CLEFAIRY) ---
  Clefairy: Pkmn(35, ["Fairy", ""], 2, [10, 2, 1], "Support",
    "Magic Guard - Immune to indirect damage (Burn, Poison, Hail, Sand Storm, Leech)",
    [ S("Moonlight", "Self", 0, { skillHeal: 4, skillHealTarget: "self", skillCost: 2, skillRaw: "Moonlight (Self: Heal 4 HP, costs 2 Energy)" }) ],
    { base: true, evoCost: 6, evoTo: "Clefable", color: "#C96BAA" }
  ),
  Clefable: Pkmn(36, ["Fairy", ""], 2, [13, 3, 1], "Support",
    "Unaware - Ignore enemy stat modifiers when attacking",
    [ S("Metronome", "Line(1)(3)", 0, { skillCost: 2, skillRaw: "Metronome (Random: Use random skill from any Pokemon, costs 2 Energy)" }) ],
    { evoFrom: "Clefairy", color: "#C96BAA" }
  ),

  // --- FIRE LINE (VULPIX) ---
  Vulpix: Pkmn(37, ["Fire", ""], 2, [7, 2, 1], "Support",
    "Flash Fire - Immune to Fire damage, after Fire hit deal +1 Fire damage",
    [ S("Will-O-Wisp", "Line(2)(1)", 1, { skillRaw: "Will-O-Wisp (Line(2)(1): Deal 1 damage, inflict Burn for 3 turns)" }) ],
    { base: true, evoCost: 6, evoTo: "Ninetales", color: "#D85A30" }
  ),
  Ninetales: Pkmn(38, ["Fire", ""], 2, [11, 4, 1], "Support",
    "Drought - When deployed, set Sunny Day for 5 turns",
    [ S("Flamethrower", "Line(3)(1)", 4, { statusChance: "burn", statusChanceValue: 0.4, skillRaw: "Flamethrower (Line(3)(1): Deal 4 damage, 40% chance Burn for 3 turns)" }) ],
    { evoFrom: "Vulpix", color: "#D85A30" }
  ),

  // --- NORMAL/FAIRY LINE (JIGGLYPUFF) ---
  Jigglypuff: Pkmn(39, ["Normal", "Fairy"], 1, [10, 2, 0], "Support",
    "Competitive - When stats lowered, gain +2 Atk for 2 turns",
    [ S("Sing", "AoE(1)", 0, { skillRaw: "Sing (AoE(1): Adjacent enemies Sleep for 2 turns)" }) ],
    { base: true, evoCost: 5, evoTo: "Wigglytuff", color: "#5F5E5A" }
  ),
  Wigglytuff: Pkmn(40, ["Normal", "Fairy"], 1, [15, 3, 1], "Support",
    "Cute Charm - When hit by melee, 30% chance inflict Infatuation (attacker cannot target this Pokemon for 2 turns)",
    [ S("Hyper Voice", "Cone(2)(3)", 3) ],
    { evoFrom: "Jigglypuff", color: "#5F5E5A" }
  ),

  // --- POISON/FLYING LINE (ZUBAT) ---
  Zubat: Pkmn(41, ["Poison", "Flying"], 1, [7, 2, 0], "Attack",
    "Inner Focus - Immune to Flinch",
    [ S("Leech Life", "Line(1)(3)", 2, { skillHeal: 1, skillHealTarget: "self", skillRaw: "Leech Life (Line(1): Deal 2 damage, heal 1 HP)" }) ],
    { base: true, evoCost: 5, evoTo: "Golbat", color: "#72243E" }
  ),
  Golbat: Pkmn(42, ["Poison", "Flying"], 1, [11, 4, 1], "Attack",
    "Infiltrator - Ignore defensive modifiers on targets",
    [ S("Poison Fang", "Line(1)(3)", 3, { statusChance: "poison", statusChanceValue: 0.7, skillRaw: "Poison Fang (Line(1): Deal 3 damage, 70% chance Poison for 4 turns)" }) ],
    { evoFrom: "Zubat", color: "#72243E" }
  ),

  // --- GRASS/POISON LINE (ODDISH) ---
  Oddish: Pkmn(43, ["Grass", "Poison"], 1, [7, 2, 1], "Support",
    "Chlorophyll - During Sunny Day, first Move costs 0 Energy",
    [ S("Absorb", "Line(1)(3)", 2, { skillHeal: 1, skillHealTarget: "self", skillRaw: "Absorb (Line(1): Deal 2 damage, heal 1 HP)" }) ],
    { base: true, evoCost: 5, evoTo: "Gloom", color: "#3B6D11" }
  ),
  Gloom: Pkmn(44, ["Grass", "Poison"], 1, [10, 3, 1], "Support",
    "Stench - After attacking, 20% chance inflict Flinch",
    [ S("Poison Powder", "Cone(1)(3)", 0, { statusChance: "poison", statusChanceValue: 0.7, skillRaw: "Poison Powder (Cone(1): 70% chance Poison for 4 turns)" }) ],
    { evoFrom: "Oddish", evoCost: 7, evoTo: "Vileplume", color: "#3B6D11" }
  ),
  Vileplume: Pkmn(45, ["Grass", "Poison"], 1, [12, 4, 1], "Support",
    "Effect Spore - When hit by melee, 30% chance inflict Poison or Sleep for 2 turns",
    [ S("Petal Dance", "AoE(1)", 3, { skillRaw: "Petal Dance (AoE(1): Deal 3 damage to adjacent enemies, user Confused for 3 turns)" }) ],
    { evoFrom: "Gloom", color: "#3B6D11" }
  ),

  // --- BUG/GRASS LINE (PARAS) ---
  Paras: Pkmn(46, ["Bug", "Grass"], 1, [7, 2, 0], "Attack",
    "Dry Skin - Take +1 damage from Fire, during Rain Dance heal 1 HP/turn",
    [ S("Scratch", "Line(1)(3)", 2) ],
    { base: true, evoCost: 5, evoTo: "Parasect", color: "#6D8E1E" }
  ),
  Parasect: Pkmn(47, ["Bug", "Grass"], 1, [11, 4, 1], "Attack",
    "Damp - Prevents explosive/self-destruct skills by enemies",
    [ S("Spore", "Line(1)(3)", 0, { statusChance: "sleep", statusChanceValue: 1, skillRaw: "Spore (Target 1: Inflict Sleep for 2 turns, 100% chance)" }) ],
    { evoFrom: "Paras", color: "#6D8E1E" }
  ),

  // --- BUG/POISON LINE (VENONAT) ---
  Venonat: Pkmn(48, ["Bug", "Poison"], 1, [8, 2, 1], "Support",
    "Compound Eyes - Status skills have +15% accuracy",
    [ S("Supersonic", "Line(2)(3)", 0, { statusChance: "confuse", statusChanceValue: 0.7, skillRaw: "Supersonic (Line(2): 70% chance Confuse for 3 turns)" }) ],
    { base: true, evoCost: 6, evoTo: "Venomoth", color: "#6D8E1E" }
  ),
  Venomoth: Pkmn(49, ["Bug", "Poison"], 1, [11, 4, 1], "Support",
    "Tinted Lens - Resisted hits deal normal damage",
    [ S("Silver Wind", "Line(3)(3)", 3, { skillRaw: "Silver Wind (Line(3): Deal 3 damage, 20% chance raise Atk and Def by 1)" }) ],
    { evoFrom: "Venonat", color: "#6D8E1E" }
  ),

  // --- GROUND LINE (DIGLETT) ---
  Diglett: Pkmn(50, ["Ground", ""], 1, [6, 2, 0], "Attack",
    "Arena Trap - Adjacent enemies cannot Move away",
    [ S("Mud-Slap", "Line(1)(3)", 2, { skillRaw: "Mud-Slap (Line(1): Deal 2 damage, reduce target skill range by 1 next turn)" }) ],
    { base: true, evoCost: 5, evoTo: "Dugtrio", color: "#854F0B" }
  ),
  Dugtrio: Pkmn(51, ["Ground", ""], 1, [9, 4, 1], "Attack",
    "Sand Force - During Sand Storm, Ground attacks deal +1 damage",
    [ S("Earthquake", "AoE(1)", 4, { skillRaw: "Earthquake (AoE(1): Deal 4 damage to adjacent enemies)" }) ],
    { evoFrom: "Diglett", color: "#854F0B" }
  ),

  // --- NORMAL LINE (MEOWTH) ---
  Meowth: Pkmn(52, ["Normal", ""], 1, [7, 2, 0], "Attack",
    "Pickup - At turn end, 15% chance find random consumable item",
    [ S("Pay Day", "Line(1)(3)", 2, { skillRaw: "Pay Day (Line(1): Deal 2 damage, gain +1 Gold if defeats target)" }) ],
    { base: true, evoCost: 6, evoTo: "Persian", color: "#5F5E5A" }
  ),
  Persian: Pkmn(53, ["Normal", ""], 1, [10, 4, 1], "Attack",
    "Technician - Skills with base damage ≤2 deal +1 damage",
    [ S("Slash", "Line(1)(3)", 4, { skillRaw: "Slash (Line(1): Deal 4 damage, crit on 14+)" }) ],
    { evoFrom: "Meowth", color: "#5F5E5A" }
  ),

  // --- WATER LINE (PSYDUCK) ---
  Psyduck: Pkmn(54, ["Water", ""], 1, [8, 2, 1], "Support",
    "Damp - Prevents explosive skills by enemies",
    [ S("Confusion", "Line(2)(3)", 2, { statusChance: "confuse", statusChanceValue: 0.3, skillRaw: "Confusion (Line(2): Deal 2 damage, 30% chance Confuse for 3 turns)" }) ],
    { base: true, evoCost: 6, evoTo: "Golduck", color: "#185FA5" }
  ),
  Golduck: Pkmn(55, ["Water", ""], 1, [12, 4, 1], "Support",
    "Swift Swim - During Rain Dance, Move costs -1 Energy",
    [ S("Psychic", "Line(3)(1)", 4, { skillEffect: { target: "enemy", stat: "def", amount: -1, duration: 2 }, skillRaw: "Psychic (Line(3)(1): Deal 4 damage, lower target Def by 1)" }) ],
    { evoFrom: "Psyduck", color: "#185FA5" }
  ),

  // --- FIGHTING LINE (MANKEY) ---
  Mankey: Pkmn(56, ["Fighting", ""], 1, [7, 3, 0], "Attack",
    "Defiant - When stats lowered, gain +2 Atk",
    [ S("Karate Chop", "Line(1)(3)", 3, { skillRaw: "Karate Chop (Line(1): Deal 3 damage, crit on 15+)" }) ],
    { base: true, evoCost: 6, evoTo: "Primeape", color: "#A63D2E" }
  ),
  Primeape: Pkmn(57, ["Fighting", ""], 1, [11, 5, 1], "Attack",
    "Anger Point - When hit by crit, gain +3 Atk for 2 turns",
    [ S("Close Combat", "Line(1)(3)", 6, { skillRaw: "Close Combat (Line(1): Deal 6 damage, lower own Def by 1 for 2 turns)" }) ],
    { evoFrom: "Mankey", color: "#A63D2E" }
  ),

  // --- FIRE LINE (GROWLITHE) ---
  Growlithe: Pkmn(58, ["Fire", ""], 2, [9, 3, 1], "Attack",
    "Intimidate - Adjacent enemies get -1 Atk",
    [ S("Flame Wheel", "Line(2)(1)", 3, { statusChance: "burn", statusChanceValue: 0.4, skillRaw: "Flame Wheel (Line(2)(1): Deal 3 damage, 40% chance Burn for 3 turns)" }) ],
    { base: true, evoCost: 7, evoTo: "Arcanine", color: "#D85A30" }
  ),
  Arcanine: Pkmn(59, ["Fire", ""], 2, [14, 5, 1], "Attack",
    "Justified - When hit by Dark attack, gain +2 Atk",
    [ S("Extreme Speed", "Line(3)(1)", 4, { skillCost: 0, skillRaw: "Extreme Speed (Line(3)(1): Deal 4 damage, costs 0 Energy, once per turn)" }) ],
    { evoFrom: "Growlithe", color: "#D85A30" }
  ),

  // --- WATER LINE (POLIWAG) ---
  Poliwag: Pkmn(60, ["Water", ""], 1, [7, 2, 1], "Support",
    "Water Absorb - Heal 3 HP when hit by Water attack",
    [ S("Bubble", "Line(2)(1)", 2, { skillRaw: "Bubble (Line(2)(1): Deal 2 damage, 30% chance reduce target Move by 1)" }) ],
    { base: true, evoCost: 5, evoTo: "Poliwhirl", color: "#185FA5" }
  ),
  Poliwhirl: Pkmn(61, ["Water", ""], 1, [10, 3, 1], "Support",
    "Damp - Prevents explosive skills by enemies",
    [ S("Hypnosis", "Line(2)(3)", 0, { statusChance: "sleep", statusChanceValue: 0.8, skillRaw: "Hypnosis (Line(2): 80% chance Sleep for 2 turns)" }) ],
    { evoFrom: "Poliwag", evoCost: 7, evoTo: "Poliwrath", color: "#185FA5" }
  ),
  Poliwrath: Pkmn(62, ["Water", "Fighting"], 1, [14, 4, 2], "Defense",
    "Water Absorb - Heal 3 HP when hit by Water attack",
    [ S("Submission", "Line(1)(3)", 5, { selfDamage: 1, skillRaw: "Submission (Line(1): Deal 5 damage, user takes 1 recoil)" }) ],
    { evoFrom: "Poliwhirl", color: "#185FA5" }
  ),

  // --- PSYCHIC LINE (ABRA) ---
  Abra: Pkmn(63, ["Psychic", ""], 2, [6, 3, 0], "Support",
    "Synchronize - When inflicted with status, inflict same status on attacker for same duration",
    [ S("Teleport", "Self", 0, { skillCost: 2, skillEffect: { target: "self", stat: "atk", amount: 0, duration: 1 }, skillRaw: "Teleport (Self: Move to any empty cell, costs 2 Energy)" }) ],
    { base: true, evoCost: 4, evoTo: "Kadabra", color: "#993556" }
  ),
  Kadabra: Pkmn(64, ["Psychic", ""], 2, [8, 4, 1], "Support",
    "Magic Guard - Immune to indirect damage",
    [ S("Confusion", "Line(3)(1)", 3, { statusChance: "confuse", statusChanceValue: 0.3, skillRaw: "Confusion (Line(3)(1): Deal 3 damage, 30% chance Confuse for 3 turns)" }) ],
    { evoFrom: "Abra", evoCost: 7, evoTo: "Alakazam", color: "#993556" }
  ),
  Alakazam: Pkmn(65, ["Psychic", ""], 2, [10, 5, 1], "Support",
    "Inner Focus - Immune to Flinch",
    [ S("Psychic", "Line(3)(1)", 5, { skillEffect: { target: "enemy", stat: "def", amount: -1, duration: 2 }, skillRaw: "Psychic (Line(3)(1): Deal 5 damage, lower target Def by 1)" }) ],
    { evoFrom: "Kadabra", color: "#993556" }
  ),

  // --- FIGHTING LINE (MACHOP) ---
  Machop: Pkmn(66, ["Fighting", ""], 1, [9, 3, 0], "Attack",
    "Guts - When afflicted with status, gain +2 Atk",
    [ S("Karate Chop", "Line(1)(3)", 3, { skillRaw: "Karate Chop (Line(1): Deal 3 damage, crit on 15+)" }) ],
    { base: true, evoCost: 6, evoTo: "Machoke", color: "#A63D2E" }
  ),
  Machoke: Pkmn(67, ["Fighting", ""], 1, [12, 4, 1], "Attack",
    "No Guard - All attacks cannot miss (ignore accuracy/evasion)",
    [ S("Vital Throw", "Line(1)(3)", 4, { skillRaw: "Vital Throw (Line(1): Deal 4 damage, ignores Def modifiers)" }) ],
    { evoFrom: "Machop", evoCost: 8, evoTo: "Machamp", color: "#A63D2E" }
  ),
  Machamp: Pkmn(68, ["Fighting", ""], 1, [15, 5, 1], "Attack",
    "Steadfast - When hit by flinch-causing attack, gain +1 Move range for 1 turn",
    [ S("Close Combat", "Line(1)(3)", 5, { skillCost: 3, statusChance: "confuse", statusChanceValue: 1, skillRaw: "Close Combat (Line(1): Deal 5 damage, 100% chance Confuse for 3 turns, costs 3 Energy. Self inflict Def-2)" }) ],
    { evoFrom: "Machoke", color: "#A63D2E" }
  ),

  // --- GRASS/POISON LINE (BELLSPROUT) ---
  Bellsprout: Pkmn(69, ["Grass", "Poison"], 1, [7, 3, 0], "Attack",
    "Chlorophyll - During Sunny Day, first Move costs 0 Energy",
    [ S("Vine Whip", "Line(2)(1)", 3) ],
    { base: true, evoCost: 5, evoTo: "Weepinbell", color: "#3B6D11" }
  ),
  Weepinbell: Pkmn(70, ["Grass", "Poison"], 1, [10, 4, 0], "Attack",
    "Gluttony - Can use consumable items at 50% HP",
    [ S("Razor Leaf", "Cone(2)(3)", 3) ],
    { evoFrom: "Bellsprout", evoCost: 7, evoTo: "Victreebel", color: "#3B6D11" }
  ),
  Victreebel: Pkmn(71, ["Grass", "Poison"], 1, [12, 5, 1], "Attack",
    "Chlorophyll - During Sunny Day, first Move costs 0 Energy",
    [ S("Leaf Blade", "Line(2)(1)", 4, { skillRaw: "Leaf Blade (Line(2)(1): Deal 4 damage, crit on 14+)" }) ],
    { evoFrom: "Weepinbell", color: "#3B6D11" }
  ),

  // --- WATER/POISON LINE (TENTACOOL) ---
  Tentacool: Pkmn(72, ["Water", "Poison"], 1, [7, 2, 1], "Support",
    "Clear Body - Immune to stat reduction from enemy skills",
    [ S("Poison Sting", "Line(1)(3)", 2, { statusChance: "poison", statusChanceValue: 0.5, skillRaw: "Poison Sting (Line(1): Deal 2 damage, 50% chance Poison for 4 turns)" }) ],
    { base: true, evoCost: 6, evoTo: "Tentacruel", color: "#185FA5" }
  ),
  Tentacruel: Pkmn(73, ["Water", "Poison"], 1, [12, 4, 2], "Support",
    "Liquid Ooze - When enemy would heal from drain, they take damage instead",
    [ S("Toxic Spikes", "AoE(1)", 0, { skillRaw: "Toxic Spikes (AoE(1): Enemies entering adjacent cells Poisoned for 4 turns)" }) ],
    { evoFrom: "Tentacool", color: "#185FA5" }
  ),

  // --- ROCK/GROUND LINE (GEODUDE) ---
  Geodude: Pkmn(74, ["Rock", "Ground"], 1, [8, 3, 2], "Defense",
    "Rock Head - Immune to recoil damage",
    [ S("Rollout", "Line(2)(1)", 3, { skillRaw: "Rollout (Line(2)(1): Deal 3 damage, +1 damage for consecutive use)" }) ],
    { base: true, evoCost: 5, evoTo: "Graveler", color: "#5F5A5A" }
  ),
  Graveler: Pkmn(75, ["Rock", "Ground"], 1, [11, 4, 2], "Defense",
    "Sturdy - Cannot be OHKO'd from full HP (survive at 1 HP)",
    [ S("Rock Throw", "Line(2)(1)", 3) ],
    { evoFrom: "Geodude", evoCost: 7, evoTo: "Golem", color: "#5F5A5A" }
  ),
  Golem: Pkmn(76, ["Rock", "Ground"], 1, [14, 5, 3], "Defense",
    "Sand Veil - During Sand Storm, gain +1 Def",
    [ S("Earthquake", "AoE(1)", 5, { skillRaw: "Earthquake (AoE(1): Deal 5 damage to adjacent enemies)" }) ],
    { evoFrom: "Graveler", color: "#5F5A5A" }
  ),

  // --- FIRE LINE (PONYTA) ---
  Ponyta: Pkmn(77, ["Fire", ""], 1, [8, 3, 1], "Attack",
    "Flash Fire - Immune to Fire damage, after Fire hit deal +1 Fire damage",
    [ S("Ember", "Line(2)(1)", 2, { statusChance: "burn", statusChanceValue: 0.4, skillRaw: "Ember (Line(2)(1): Deal 2 damage, 40% chance Burn for 3 turns)" }) ],
    { base: true, evoCost: 6, evoTo: "Rapidash", color: "#D85A30" }
  ),
  Rapidash: Pkmn(78, ["Fire", ""], 1, [11, 4, 1], "Attack",
    "Flame Body - When hit by melee, 30% chance Burn attacker for 3 turns",
    [ S("Fire Spin", "Line(2)(1)", 3, { skillRaw: "Fire Spin (Line(2)(1): Deal 3 damage, target cannot Move next turn)" }) ],
    { evoFrom: "Ponyta", color: "#D85A30" }
  ),

  // --- WATER/PSYCHIC LINE (SLOWPOKE) ---
  Slowpoke: Pkmn(79, ["Water", "Psychic"], 1, [11, 2, 1], "Support",
    "Own Tempo - Immune to Confusion",
    [ S("Confusion", "Line(2)(3)", 2, { statusChance: "confuse", statusChanceValue: 0.3, skillRaw: "Confusion (Line(2): Deal 2 damage, 30% chance Confuse for 3 turns)" }) ],
    { base: true, evoCost: 7, evoTo: "Slowbro", color: "#185FA5" }
  ),
  Slowbro: Pkmn(80, ["Water", "Psychic"], 1, [15, 3, 2], "Defense",
    "Shell Armor - Immune to critical hits",
    [ S("Psychic", "Line(3)(1)", 4, { skillEffect: { target: "enemy", stat: "def", amount: -1, duration: 2 }, skillRaw: "Psychic (Line(3)(1): Deal 4 damage, lower target Def by 1)" }) ],
    { evoFrom: "Slowpoke", color: "#185FA5" }
  ),

  // --- ELECTRIC/STEEL LINE (MAGNEMITE) ---
  Magnemite: Pkmn(81, ["Electric", "Steel"], 1, [7, 3, 1], "Support",
    "Sturdy - Cannot be OHKO'd from full HP",
    [ S("Thunder Shock", "Line(2)(1)", 3, { statusChance: "paralysis", statusChanceValue: 0.4, skillRaw: "Thunder Shock (Line(2)(1): Deal 3 damage, 40% chance Paralyze for 3 turns)" }) ],
    { base: true, evoCost: 6, evoTo: "Magneton", color: "#BA7517" }
  ),
  Magneton: Pkmn(82, ["Electric", "Steel"], 1, [10, 4, 2], "Support",
    "Magnet Pull - Adjacent Steel enemies cannot Move",
    [ S("Spark", "Line(2)(1)", 3, { statusChance: "paralysis", statusChanceValue: 0.5, skillRaw: "Spark (Line(2)(1): Deal 3 damage, 50% chance Paralyze for 3 turns)" }) ],
    { evoFrom: "Magnemite", evoCost: 8, evoTo: "Magnezone", color: "#BA7517" }
  ),

  // --- NORMAL/FLYING (FARFETCH'D) ---
  "Farfetch'd": Pkmn(83, ["Normal", "Flying"], 2, [9, 4, 1], "Attack",
    "Defiant - When stats lowered, gain +2 Atk",
    [ S("Slash", "Line(1)(3)", 4, { skillRaw: "Slash (Line(1): Deal 4 damage, crit on 14+)" }) ],
    { base: true, color: "#5F5E5A" }
  ),

  // --- NORMAL/FLYING LINE (DODUO) ---
  Doduo: Pkmn(84, ["Normal", "Flying"], 1, [7, 3, 0], "Attack",
    "Early Bird - Sleep duration reduced by 1 turn",
    [ S("Peck", "Line(1)(3)", 2) ],
    { base: true, evoCost: 5, evoTo: "Dodrio", color: "#5F5E5A" }
  ),
  Dodrio: Pkmn(85, ["Normal", "Flying"], 1, [11, 5, 1], "Attack",
    "Tangled Feet - When Confused, gain +1 Def",
    [ S("Tri Attack", "Target = [3(Line(1)(1))]", 2, { statusChance: "burn", statusChanceValue: 0.1, skillRaw: "Tri Attack (Target = [3(Line(1)(1))]: Deal 2 damage to 3 targets, 10% chance Burn/Paralyze/Freeze for 3 turns)" }) ],
    { evoFrom: "Doduo", color: "#5F5E5A" }
  ),

  // --- WATER LINE (SEEL) ---
  Seel: Pkmn(86, ["Water", ""], 1, [9, 2, 1], "Support",
    "Thick Fat - Take -1 damage from Fire and Ice",
    [ S("Headbutt", "Line(1)(3)", 3, { skillRaw: "Headbutt (Line(1): Deal 3 damage, 30% chance Flinch)" }) ],
    { base: true, evoCost: 6, evoTo: "Dewgong", color: "#185FA5" }
  ),
  Dewgong: Pkmn(87, ["Water", "Ice"], 1, [13, 4, 2], "Support",
    "Ice Body - During Hail, heal 1 HP/turn",
    [ S("Aurora Beam", "Line(3)(1)", 3, { skillEffect: { target: "enemy", stat: "atk", amount: -1, duration: 2 }, skillRaw: "Aurora Beam (Line(3)(1): Deal 3 damage, 30% chance lower target Atk by 1)" }) ],
    { evoFrom: "Seel", color: "#185FA5" }
  ),

  // --- POISON LINE (GRIMER) ---
  Grimer: Pkmn(88, ["Poison", ""], 1, [9, 2, 2], "Defense",
    "Stench - After attacking, 20% chance inflict Flinch",
    [ S("Poison Gas", "Cone(1)(3)", 0, { statusChance: "poison", statusChanceValue: 0.6, skillRaw: "Poison Gas (Cone(1): 60% chance Poison for 4 turns)" }) ],
    { base: true, evoCost: 6, evoTo: "Muk", color: "#72243E" }
  ),
  Muk: Pkmn(89, ["Poison", ""], 1, [14, 4, 2], "Defense",
    "Poison Touch - When hitting with melee, 30% chance Poison for 4 turns",
    [ S("Gunk Shot", "Line(2)(1)", 4, { statusChance: "poison", statusChanceValue: 0.7, skillRaw: "Gunk Shot (Line(2)(1): Deal 4 damage, 70% chance Poison for 4 turns)" }) ],
    { evoFrom: "Grimer", color: "#72243E" }
  ),

  // --- WATER LINE (SHELLDER) ---
  Shellder: Pkmn(90, ["Water", ""], 1, [8, 2, 2], "Defense",
    "Shell Armor - Immune to critical hits",
    [ S("Icicle Spear", "Line(2)(1)", 2, { skillRaw: "Icicle Spear (Line(2)(1): Deal 2 damage, hits twice)" }) ],
    { base: true, evoCost: 6, evoTo: "Cloyster", color: "#185FA5" }
  ),
  Cloyster: Pkmn(91, ["Water", "Ice"], 1, [11, 4, 3], "Defense",
    "Skill Link - Multi-hit skills always hit max times",
    [ S("Spike Cannon", "Line(3)(1)", 2, { skillRaw: "Spike Cannon (Line(3)(1): Deal 2 damage, hits 2-5 times)" }) ],
    { evoFrom: "Shellder", color: "#185FA5" }
  ),

  // --- GHOST/POISON LINE (GASTLY) ---
  Gastly: Pkmn(92, ["Ghost", "Poison"], 2, [6, 3, 1], "Support",
    "Levitate - Immune to Ground attacks",
    [ S("Lick", "Line(1)(3)", 2, { statusChance: "paralysis", statusChanceValue: 0.4, skillRaw: "Lick (Line(1): Deal 2 damage, 40% chance Paralyze for 3 turns)" }) ],
    { base: true, evoCost: 5, evoTo: "Haunter", color: "#3C3489" }
  ),
  Haunter: Pkmn(93, ["Ghost", "Poison"], 2, [9, 4, 1], "Support",
    "Levitate - Immune to Ground attacks",
    [ S("Shadow Punch", "Line(2)(1)", 3, { skillRaw: "Shadow Punch (Line(2)(1): Deal 3 damage, cannot miss)" }) ],
    { evoFrom: "Gastly", evoCost: 8, evoTo: "Gengar", color: "#3C3489" }
  ),
  Gengar: Pkmn(94, ["Ghost", "Poison"], 2, [11, 5, 1], "Support",
    "Cursed Body - When hit, 30% chance disable attacker's last skill for 2 turns",
    [ S("Shadow Ball", "Line(3)(1)", 4, { skillEffect: { target: "enemy", stat: "def", amount: -1, duration: 2 }, skillRaw: "Shadow Ball (Line(3)(1): Deal 4 damage, 30% chance lower target Def by 1)" }) ],
    { evoFrom: "Haunter", color: "#3C3489" }
  ),

  // --- ROCK/GROUND LINE (ONIX) ---
  Onix: Pkmn(95, ["Rock", "Ground"], 2, [10, 3, 3], "Defense",
    "Rock Head - Immune to recoil damage",
    [ S("Rock Throw", "Line(2)(1)", 3) ],
    { base: true, evoCost: 8, evoTo: "Steelix", color: "#5F5A5A" }
  ),

  // --- PSYCHIC LINE (DROWZEE) ---
  Drowzee: Pkmn(96, ["Psychic", ""], 1, [9, 2, 1], "Support",
    "Insomnia - Immune to Sleep",
    [ S("Hypnosis", "Line(2)(3)", 0, { statusChance: "sleep", statusChanceValue: 0.8, skillRaw: "Hypnosis (Line(2): 80% chance Sleep for 2 turns)" }) ],
    { base: true, evoCost: 6, evoTo: "Hypno", color: "#993556" }
  ),
  Hypno: Pkmn(97, ["Psychic", ""], 1, [13, 3, 2], "Support",
    "Insomnia - Immune to Sleep",
    [ S("Dream Eater", "Line(2)(3)", 3, { drainAmount: 3, skillRaw: "Dream Eater (Line(2): Drain 3 HP from sleeping target, fail if not asleep)" }) ],
    { evoFrom: "Drowzee", color: "#993556" }
  ),

  // --- WATER LINE (KRABBY) ---
  Krabby: Pkmn(98, ["Water", ""], 1, [7, 3, 1], "Attack",
    "Hyper Cutter - Immune to Atk reduction",
    [ S("Crabhammer", "Line(1)(3)", 3, { skillRaw: "Crabhammer (Line(1): Deal 3 damage, crit on 14+)" }) ],
    { base: true, evoCost: 6, evoTo: "Kingler", color: "#185FA5" }
  ),
  Kingler: Pkmn(99, ["Water", ""], 1, [11, 5, 1], "Attack",
    "Shell Armor - Prevent the user from being hit by critical hits",
    [ S("Guillotine", "Line(1)(3)", 8, { skillCost: 3, skillRaw: "Guillotine (Line(1): Deal 8 damage, costs 3 Energy, 50% accuracy)" }) ],
    { evoFrom: "Krabby", color: "#185FA5" }
  ),

  // --- ELECTRIC LINE (VOLTORB) ---
  Voltorb: Pkmn(100, ["Electric", ""], 1, [7, 3, 1], "Support",
    "Soundproof - Immune to sound-based skills",
    [ S("Sonic Boom", "Line(2)(1)", 2, { skillRaw: "Sonic Boom (Line(2)(1): Deal fixed 2 damage, ignores Def)" }) ],
    { base: true, evoCost: 5, evoTo: "Electrode", color: "#BA7517" }
  ),
  Electrode: Pkmn(101, ["Electric", ""], 1, [10, 4, 1], "Support",
    "Aftermath - When KO'd by melee, attacker takes 2 damage",
    [ S("Explosion", "AoE(2)", 6, { skillCost: 0, skillRaw: "Explosion (AoE(2): Deal 6 damage to all adjacent, user faints, costs 0 Energy)" }) ],
    { evoFrom: "Voltorb", color: "#BA7517" }
  ),

  // --- GRASS/PSYCHIC LINE (EXEGGCUTE) ---
  Exeggcute: Pkmn(102, ["Grass", "Psychic"], 2, [9, 2, 1], "Support",
    "Chlorophyll - During Sunny Day, first Move costs 0 Energy",
    [ S("Sleep Powder", "Cone(1)(3)", 0, { statusChance: "sleep", statusChanceValue: 0.6, skillRaw: "Sleep Powder (Cone(1): 60% chance Sleep for 2 turns)" }) ],
    { base: true, evoCost: 7, evoTo: "Exeggutor", color: "#3B6D11" }
  ),
  Exeggutor: Pkmn(103, ["Grass", "Psychic"], 2, [13, 4, 2], "Support",
    "Harvest - At turn end, 50% chance restore used Berry",
    [ S("Psychic", "Line(3)(1)", 4, { skillEffect: { target: "enemy", stat: "def", amount: -1, duration: 2 }, skillRaw: "Psychic (Line(3)(1): Deal 4 damage, lower target Def by 1)" }) ],
    { evoFrom: "Exeggcute", color: "#3B6D11" }
  ),

  // --- GROUND LINE (CUBONE) ---
  Cubone: Pkmn(104, ["Ground", ""], 2, [8, 3, 1], "Attack",
    "Rock Head - Immune to recoil damage",
    [ S("Bone Club", "Line(2)(1)", 3, { skillRaw: "Bone Club (Line(2)(1): Deal 3 damage, 30% chance Flinch)" }) ],
    { base: true, evoCost: 7, evoTo: "Marowak", color: "#854F0B" }
  ),
  Marowak: Pkmn(105, ["Ground", ""], 2, [11, 4, 1], "Attack",
    "Battle Armor - Immune to critical hits",
    [ S("Bonemerang", "Line(3)(1)", 3, { skillRaw: "Bonemerang (Line(3)(1): Deal 3 damage twice)" }) ],
    { evoFrom: "Cubone", color: "#854F0B" }
  ),

  // --- FIGHTING (HITMONLEE) ---
  Hitmonlee: Pkmn(106, ["Fighting", ""], 2, [10, 5, 1], "Attack",
    "Limber - Immune to Paralysis",
    [ S("High Jump Kick", "Line(2)(1)", 6, { selfDamage: 2, skillRaw: "High Jump Kick (Line(2)(1): Deal 6 damage, if miss user takes 2 damage)" }) ],
    { base: true, color: "#A63D2E" }
  ),

  // --- FIGHTING (HITMONCHAN) ---
  Hitmonchan: Pkmn(107, ["Fighting", ""], 2, [10, 4, 1], "Attack",
    "Keen Eye - Immune to accuracy reduction",
    [ S("Mach Punch", "Line(1)(3)", 3, { skillCost: 0, skillRaw: "Mach Punch (Line(1): Deal 3 damage, costs 0 Energy, once per turn)" }) ],
    { base: true, color: "#A63D2E" }
  ),

  // --- NORMAL (LICKITUNG) ---
  Lickitung: Pkmn(108, ["Normal", ""], 2, [13, 3, 2], "Defense",
    "Own Tempo - Immune to Confusion",
    [ S("Wrap", "Line(1)(3)", 2, { skillRaw: "Wrap (Line(1): Deal 2 damage/turn for 3 turns, target cannot Move)" }) ],
    { base: true, color: "#5F5E5A" }
  ),

  // --- POISON LINE (KOFFING) ---
  Koffing: Pkmn(109, ["Poison", ""], 1, [8, 2, 2], "Defense",
    "Levitate - Immune to Ground attacks",
    [ S("Poison Gas", "AoE(1)", 0, { statusChance: "poison", statusChanceValue: 0.5, skillRaw: "Poison Gas (AoE(1): 50% chance Poison for 4 turns on adjacent enemies)" }) ],
    { base: true, evoCost: 6, evoTo: "Weezing", color: "#72243E" }
  ),
  Weezing: Pkmn(110, ["Poison", ""], 1, [12, 4, 2], "Defense",
    "Levitate - Immune to Ground attacks",
    [ S("Sludge Bomb", "Line(2)(1)", 4, { statusChance: "poison", statusChanceValue: 0.5, skillRaw: "Sludge Bomb (Line(2)(1): Deal 4 damage, 50% chance Poison for 4 turns)" }) ],
    { evoFrom: "Koffing", color: "#72243E" }
  ),

  // --- GROUND/ROCK LINE (RHYHORN) ---
  Rhyhorn: Pkmn(111, ["Ground", "Rock"], 2, [11, 3, 2], "Defense",
    "Rock Head - Immune to recoil damage",
    [ S("Rock Blast", "Line(2)(1)", 2, { skillRaw: "Rock Blast (Line(2)(1): Deal 2 damage, hits 2-5 times)" }) ],
    { base: true, evoCost: 7, evoTo: "Rhydon", color: "#854F0B" }
  ),
  Rhydon: Pkmn(112, ["Ground", "Rock"], 2, [15, 5, 2], "Defense",
    "Solid Rock - Reduce super effective damage by 1",
    [ S("Earthquake", "AoE(1)", 5, { skillRaw: "Earthquake (AoE(1): Deal 5 damage to adjacent enemies)" }) ],
    { evoFrom: "Rhyhorn", color: "#854F0B" }
  ),

  // --- NORMAL (CHANSEY) ---
  Chansey: Pkmn(113, ["Normal", ""], 3, [25, 2, 1], "Support",
    "Natural Cure - At turn end, cure any status",
    [ S("Soft-Boiled", "Ally", 0, { skillHeal: 5, skillHealTarget: "ally", skillCost: 2, skillRaw: "Soft-Boiled (Ally: Heal 5 HP, costs 2 Energy)" }) ],
    { base: true, evoCost: 10, evoTo: "Blissey", color: "#5F5E5A" }
  ),

  // --- GRASS (TANGELA) ---
  Tangela: Pkmn(114, ["Grass", ""], 2, [10, 3, 2], "Defense",
    "Regenerator - At turn end, heal 1 HP",
    [ S("Vine Whip", "Line(2)(1)", 3, { skillRaw: "Vine Whip (Line(2)(1): Deal 3 damage, 30% chance reduce target Move by 1)" }) ],
    { base: true, evoCost: 8, evoTo: "Tangrowth", color: "#3B6D11" }
  ),

  // --- NORMAL (KANGASKHAN) ---
  Kangaskhan: Pkmn(115, ["Normal", ""], 3, [14, 4, 1], "Attack",
    "Early Bird - Sleep duration reduced by 1 turn",
    [ S("Dizzy Punch", "Line(1)(3)", 4, { statusChance: "confuse", statusChanceValue: 0.3, skillRaw: "Dizzy Punch (Line(1): Deal 4 damage, 30% chance Confuse for 3 turns)" }) ],
    { base: true, color: "#5F5E5A" }
  ),

  // --- WATER LINE (HORSEA) ---
  Horsea: Pkmn(116, ["Water", ""], 1, [7, 3, 1], "Support",
    "Sniper - Critical hits deal +1 damage, crit on 16+",
    [ S("Water Gun", "Line(2)(1)", 2) ],
    { base: true, evoCost: 6, evoTo: "Seadra", color: "#185FA5" }
  ),
  Seadra: Pkmn(117, ["Water", ""], 1, [10, 4, 1], "Support",
    "Poison Point - When hit by melee, 30% chance Poison attacker for 4 turns",
    [ S("Dragon Breath", "Line(2)(1)", 3, { statusChance: "paralysis", statusChanceValue: 0.5, skillRaw: "Dragon Breath (Line(2)(1): Deal 3 damage, 50% chance Paralyze for 3 turns)" }) ],
    { evoFrom: "Horsea", evoCost: 8, evoTo: "Kingdra", color: "#185FA5" }
  ),

  // --- WATER LINE (GOLDEEN) ---
  Goldeen: Pkmn(118, ["Water", ""], 1, [8, 3, 0], "Attack",
    "Water Veil - Immune to Burn",
    [ S("Horn Attack", "Line(1)(3)", 3) ],
    { base: true, evoCost: 6, evoTo: "Seaking", color: "#185FA5" }
  ),
  Seaking: Pkmn(119, ["Water", ""], 1, [12, 4, 1], "Attack",
    "Water Veil - Immune to Burn",
    [ S("Waterfall", "Line(2)(1)", 4, { skillRaw: "Waterfall (Line(2)(1): Deal 4 damage, 30% chance Flinch)" }) ],
    { evoFrom: "Goldeen", color: "#185FA5" }
  ),

  // --- WATER LINE (STARYU) ---
  Staryu: Pkmn(120, ["Water", ""], 1, [7, 3, 1], "Support",
    "Natural Cure - At turn end, cure any status",
    [ S("Swift", "Line(3)(1)", 3, { skillRaw: "Swift (Line(3)(1): Deal 3 damage, cannot miss)" }) ],
    { base: true, evoCost: 6, evoTo: "Starmie", color: "#185FA5" }
  ),
  Starmie: Pkmn(121, ["Water", "Psychic"], 1, [11, 4, 2], "Support",
    "Illuminate - Enemies within range 2 cannot hide (visible in Fog/Sand)",
    [ S("Psychic", "Line(3)(1)", 4, { skillEffect: { target: "enemy", stat: "def", amount: -1, duration: 2 }, skillRaw: "Psychic (Line(3)(1): Deal 4 damage, lower target Def by 1)" }) ],
    { evoFrom: "Staryu", color: "#185FA5" }
  ),

  // --- PSYCHIC/FAIRY (MR. MIME) ---
  "Mr. Mime": Pkmn(122, ["Psychic", "Fairy"], 2, [9, 3, 2], "Support",
    "Soundproof - Immune to sound-based skills",
    [ S("Barrier", "Self", 0, { skillEffect: { target: "self", stat: "def", amount: 2, duration: 3 }, skillRaw: "Barrier (Self: Gain +2 Def for 3 turns)" }) ],
    { base: true, color: "#993556" }
  ),

  // --- BUG/FLYING (SCYTHER) ---
  Scyther: Pkmn(123, ["Bug", "Flying"], 2, [10, 4, 1], "Attack",
    "Technician - Skills with base damage ≤2 deal +1 damage",
    [ S("X-Scissor", "Line(2)(1)", 4, { skillRaw: "X-Scissor (Line(2)(1): Deal 4 damage, crit on 14+)" }) ],
    { base: true, evoCost: 8, evoTo: "Scizor", color: "#6D8E1E" }
  ),

  // --- ICE/PSYCHIC (JYNX) ---
  Jynx: Pkmn(124, ["Ice", "Psychic"], 2, [11, 4, 1], "Support",
    "Dry Skin - Take +1 damage from Fire, during Rain Dance heal 1 HP/turn",
    [ S("Lovely Kiss", "Line(1)(3)", 0, { statusChance: "sleep", statusChanceValue: 0.9, skillRaw: "Lovely Kiss (Line(1): 90% chance Sleep for 2 turns)" }) ],
    { base: true, color: "#0C447C" }
  ),

  // --- ELECTRIC (ELECTABUZZ) ---
  Electabuzz: Pkmn(125, ["Electric", ""], 2, [10, 4, 1], "Attack",
    "Static - When hit by melee, 30% chance Paralyze attacker for 3 turns",
    [ S("Thunder Punch", "Line(1)(3)", 4, { statusChance: "paralysis", statusChanceValue: 0.4, skillRaw: "Thunder Punch (Line(1): Deal 4 damage, 40% chance Paralyze for 3 turns)" }) ],
    { base: true, evoCost: 8, evoTo: "Electivire", color: "#BA7517" }
  ),

  // --- FIRE (MAGMAR) ---
  Magmar: Pkmn(126, ["Fire", ""], 2, [10, 4, 1], "Attack",
    "Flame Body - When hit by melee, 30% chance Burn attacker for 3 turns",
    [ S("Fire Punch", "Line(1)(3)", 4, { statusChance: "burn", statusChanceValue: 0.4, skillRaw: "Fire Punch (Line(1): Deal 4 damage, 40% chance Burn for 3 turns)" }) ],
    { base: true, evoCost: 8, evoTo: "Magmortar", color: "#D85A30" }
  ),

  // --- BUG (PINSIR) ---
  Pinsir: Pkmn(127, ["Bug", ""], 2, [11, 5, 1], "Attack",
    "Hyper Cutter - Immune to Atk reduction",
    [ S("Guillotine", "Line(1)(3)", 6, { skillCost: 3, skillRaw: "Guillotine (Line(1): Deal 6 damage, costs 3 Energy, 50% accuracy)" }) ],
    { base: true, color: "#6D8E1E" }
  ),

  // --- NORMAL (TAUROS) ---
  Tauros: Pkmn(128, ["Normal", ""], 2, [12, 4, 1], "Attack",
    "Intimidate - Adjacent enemies get -1 Atk",
    [ S("Take Down", "Line(2)(1)", 5, { selfDamage: 1, skillRaw: "Take Down (Line(2)(1): Deal 5 damage, user takes 1 recoil)" }) ],
    { base: true, color: "#5F5E5A" }
  ),

  // --- WATER LINE (MAGIKARP) ---
  Magikarp: Pkmn(129, ["Water", ""], 1, [5, 1, 1], "Support",
    "Swift Swim - During Rain Dance, Move costs -1 Energy",
    [ S("Splash", "Self", 0, { skillEffect: { target: "self", stat: "atk", amount: 0, duration: 1 }, skillRaw: "Splash (Self: Do nothing, gain +1 EXP)" }) ],
    { base: true, evoCost: 20, evoTo: "Gyarados", color: "#185FA5" }
  ),
  Gyarados: Pkmn(130, ["Water", "Flying"], 1, [14, 5, 1], "Attack",
    "Intimidate - Adjacent enemies get -1 Atk",
    [ S("Hydro Pump", "Line(3)(1)", 5, { skillCost: 3, skillRaw: "Hydro Pump (Line(3)(1): Deal 5 damage, costs 3 Energy)" }) ],
    { evoFrom: "Magikarp", color: "#185FA5" }
  ),

  // --- WATER/ICE (LAPRAS) ---
  Lapras: Pkmn(131, ["Water", "Ice"], 3, [16, 4, 2], "Support",
    "Water Absorb - Heal 3 HP when hit by Water attack",
    [ S("Ice Beam", "Line(3)(1)", 4, { statusChance: "freeze", statusChanceValue: 0.4, skillRaw: "Ice Beam (Line(3)(1): Deal 4 damage, 40% chance Freeze for 2 turns)" }) ],
    { base: true, color: "#185FA5" }
  ),

  // --- NORMAL (DITTO) ---
  Ditto: Pkmn(132, ["Normal", ""], 2, [8, 2, 1], "Support",
    "Imposter - When deployed, transform into Pokemon across, copying stats/skills for 3 turns",
    [ S("Transform", "Self", 0, { skillEffect: { target: "self", stat: "atk", amount: 0, duration: 1 }, skillRaw: "Transform (Self: Copy target's stats (HP fixed at 8) / skills / ability for 3 turns)" }) ],
    { base: true, color: "#5F5E5A" }
  ),

  // --- NORMAL LINE (EEVEE) ---
  Eevee: Pkmn(133, ["Normal", ""], 3, [9, 3, 1], "Support",
    "Adaptability - Atk +1",
    [ S("Take Down", "Line(1)(3)", 3, { selfDamage: 1, skillRaw: "Take Down (Line(1): Deal 3 damage but self damage 1)" }) ],
    { base: true, evoCost: 6, evoTo: "Vaporeon", color: "#5F5E5A" }
  ),
  Vaporeon: Pkmn(134, ["Water", ""], 3, [12, 3, 2], "Defense",
    "Water Absorb - Heal 3 HP when hit by Water attack",
    [ S("Aurora Beam", "Line(3)(1)", 3, { skillEffect: { target: "enemy", stat: "atk", amount: -1, duration: 2 }, skillRaw: "Aurora Beam (Line(3)(1): Deal 3 damage, 30% chance lower target Atk by 1)" }) ],
    { evoFrom: "Eevee", color: "#185FA5" }
  ),
  Jolteon: Pkmn(135, ["Electric", ""], 3, [12, 4, 1], "Attack",
    "Volt Absorb - Heal 3 HP when hit by Electric attack",
    [ S("Thunder", "Line(3)(1)", 4, { statusChance: "paralysis", statusChanceValue: 0.5, skillRaw: "Thunder (Line(3)(1): Deal 4 damage, 50% chance Paralyze for 3 turns)" }) ],
    { evoFrom: "Eevee", color: "#BA7517" }
  ),
  Flareon: Pkmn(136, ["Fire", ""], 3, [10, 5, 1], "Attack",
    "Flash Fire - Immune to Fire, after Fire hit deal +1 Fire damage",
    [ S("Fire Blast", "Line(3)(1)", 5, { statusChance: "burn", statusChanceValue: 0.5, skillRaw: "Fire Blast (Line(3)(1): Deal 5 damage, 50% chance Burn for 3 turns)" }) ],
    { evoFrom: "Eevee", color: "#D85A30" }
  ),

  // --- NORMAL (PORYGON) ---
  Porygon: Pkmn(137, ["Normal", ""], 2, [10, 3, 1], "Support",
    "Trace - Copy ability of last enemy that attacked this Pokemon",
    [ S("Tri Attack", "Line(2)(1)", 3, { statusChance: "burn", statusChanceValue: 0.2, skillRaw: "Tri Attack (Line(2)(1): Deal 3 damage, 20% chance Burn/Paralyze/Freeze for 3 turns)" }) ],
    { base: true, evoCost: 8, evoTo: "Porygon2", color: "#5F5E5A" }
  ),

  // --- ROCK/WATER LINE (OMANYTE) ---
  Omanyte: Pkmn(138, ["Rock", "Water"], 2, [8, 3, 2], "Defense",
    "Shell Armor - Immune to critical hits",
    [ S("Water Gun", "Line(2)(1)", 2) ],
    { base: true, evoCost: 7, evoTo: "Omastar", color: "#5F5A5A" }
  ),
  Omastar: Pkmn(139, ["Rock", "Water"], 2, [12, 4, 3], "Defense",
    "Swift Swim - During Rain Dance, Move costs -1 Energy",
    [ S("Ancient Power", "Line(2)(1)", 3, { skillRaw: "Ancient Power (Line(2)(1): Deal 3 damage, 20% chance raise all stats by 1)" }) ],
    { evoFrom: "Omanyte", color: "#5F5A5A" }
  ),

  // --- ROCK/WATER LINE (KABUTO) ---
  Kabuto: Pkmn(140, ["Rock", "Water"], 2, [8, 3, 2], "Defense",
    "Battle Armor - Immune to critical hits",
    [ S("Scratch", "Line(1)(3)", 2) ],
    { base: true, evoCost: 7, evoTo: "Kabutops", color: "#5F5A5A" }
  ),
  Kabutops: Pkmn(141, ["Rock", "Water"], 2, [11, 5, 1], "Attack",
    "Swift Swim - During Rain Dance, Move costs -1 Energy",
    [ S("Slash", "Line(2)(1)", 4, { skillRaw: "Slash (Line(2)(1): Deal 4 damage, crit on 14+)" }) ],
    { evoFrom: "Kabuto", color: "#5F5A5A" }
  ),

  // --- ROCK/FLYING (AERODACTYL) ---
  Aerodactyl: Pkmn(142, ["Rock", "Flying"], 3, [12, 5, 1], "Attack",
    "Unnerve - When this unit is on the field, consumable Berries cannot be used",
    [ S("Wing Attack", "Line(3)(1)", 4) ],
    { base: true, color: "#5F5A5A" }
  ),

  // --- NORMAL (SNORLAX) ---
  Snorlax: Pkmn(143, ["Normal", ""], 4, [20, 4, 2], "Defense",
    "Thick Fat - Take -1 damage from Fire and Ice",
    [ S("Body Slam", "Line(1)(3)", 4, { statusChance: "paralysis", statusChanceValue: 0.4, skillRaw: "Body Slam (Line(1): Deal 4 damage, 40% chance Paralyze for 3 turns)" }) ],
    { base: true, color: "#5F5E5A" }
  ),

  // =========================================================================
  // LEGENDARY BIRDS
  // =========================================================================

  Articuno: Pkmn(144, ["Ice", "Flying"], 5, [14, 4, 2], "Support",
    "Snow Cloak - If in Hail, there is a 20% chance to dodge any attack",
    [
      S("Blizzard", "AoE(2)", 4, { statusChance: "freeze", statusChanceValue: 0.5, skillRaw: "Blizzard (AoE(2): Deal 4 damage, 50% chance Freeze for 2 turns)" }),
      S("Snow Scape", "Self", 0, { skillEffect: { target: "all_ice", stat: "def", amount: 1, duration: 2 }, skillRaw: " All Ice-type Pokemon gain +1 Def for 2 turns)" }),
      S("Powder Snow", "All", 1, { statusChance: "freeze", statusChanceValue: 0.1, skillRaw: "Powder Snow (All: Deal 1 Damage to every pokemon, 10% chance to freeze it — Ice type can't be frozen)" })
    ],
    { base: true, legendary: true, hatchGroup: "birds", hatchCost: 30, color: "#0C447C" }
  ),

  Zapdos: Pkmn(145, ["Electric", "Flying"], 5, [13, 5, 1], "Attack",
    "Static - When hit or hitting enemies, 30% chance to inflict Paralysis for 3 turns",
    [
      S("Thunder", "Cone(3)(3)", 5, { skillRaw: "Thunder (Cone(3): Target 2, Deal 5 Damage)" }),
      S("Zap Cannon", "Line(4)(3)", 6, { skillRaw: "Zap Cannon (Line(4): Deal 6 Damage)" }),
      S("Charge", "Self", 0, { skillEffect: { target: "self", stat: "atk", amount: 2, duration: 1 }, skillRaw: "Charge (Self: Next attack damage +2)" })
    ],
    { base: true, legendary: true, hatchGroup: "birds", hatchCost: 30, color: "#BA7517" }
  ),

  Moltres: Pkmn(146, ["Fire", "Flying"], 5, [13, 5, 1], "Attack",
    "Flame Body - When hit or hitting enemies, 30% chance to inflict Burn for 3 turns",
    [
      S("Heat Wave", "Cone(3)(3)", 5, { skillRaw: "Heat Wave (Cone(3): Deal 5 damage)" }),
      S("Overheat", "AoE(2)", 6, { selfDamage: 4, skillCooldown: 2, skillEffect: { target: "self", stat: "atk", amount: 0, duration: 1 }, skillRaw: "Overheat (AoE(2): Deal 6 Damage but self damage for 4. Cooldown 2 turns)" }),
      S("Sky Attack", "Self", 6, { skillCooldown: 3, skillEffect: { target: "self", stat: "atk", amount: 0, duration: 1 }, skillRaw: "Sky Attack (Self: Unit becomes Untargetable. Cannot move till next turn. Next turn: select a target, unit moves in front of it and deals 6 Damage. Both user and target cannot act that turn. Cooldown 3 turns)" })
    ],
    { base: true, legendary: true, hatchGroup: "birds", hatchCost: 30, color: "#D85A30" }
  ),

  // =========================================================================
  // DRAGON LINE
  // =========================================================================

  Dratini: Pkmn(147, ["Dragon", ""], 3, [8, 3, 0], "Attack",
    "Shed Skin - At turn end, 30% chance cure any status",
    [ S("Twister", "Line(2)(1)", 3, { skillRaw: "Twister (Line(2)(1): Deal 3 damage, 30% chance Flinch)" }) ],
    { base: true, evoCost: 7, evoTo: "Dragonair", color: "#5B7DD1" }
  ),
  Dragonair: Pkmn(148, ["Dragon", ""], 3, [11, 4, 1], "Attack",
    "Marvel Scale - When afflicted with status, gain +2 Def",
    [ S("Dragon Breath", "Line(2)(1)", 3, { statusChance: "paralysis", statusChanceValue: 0.5, skillRaw: "Dragon Breath (Line(2)(1): Deal 3 damage, 50% chance Paralyze for 3 turns)" }) ],
    { evoFrom: "Dratini", evoCost: 8, evoTo: "Dragonite", color: "#5B7DD1" }
  ),
  Dragonite: Pkmn(149, ["Dragon", "Flying"], 3, [14, 5, 1], "Attack",
    "Multiscale - When at full HP, reduce incoming damage by 3",
    [ S("Outrage", "Self", 5, { skillRaw: "Outrage (Self: For 3 turns, hit the nearest unit for 5 damage each turn — targets both ally and enemies)" }) ],
    { evoFrom: "Dragonair", evoCost: 9, color: "#5B7DD1" }
  ),

  // =========================================================================
  // LEGENDARY PSYCHICS
  // =========================================================================

  Mewtwo: Pkmn(150, ["Psychic", ""], 5, [16, 6, 1], "Attack",
    "Pressure - Once a turn, opponent's attack costs 1 more energy (cannot stack)",
    [
      S("Psychic", "Cone(3)(1)", 6, { skillRaw: "Psychic (Cone(3)(1): Choose 2 targets in range and deal 6 damage)" }),
      S("Recover", "Self", 0, { skillHeal: 4, skillHealTarget: "self", skillCooldown: 2, skillRaw: "Recover (Self: Recover 4 HP. Cooldown 2 turns)" }),
      S("Psycutter", "Line(3)(1)", 5, { skillRaw: "Psycutter (Line(3)(1): Deal 5 damage +1 per point of target's Defense)" })
    ],
    { base: true, legendary: true, hatchGroup: "psychic", hatchCost: 30, color: "#993556" }
  ),

  Mew: Pkmn(151, ["Psychic", ""], 5, [14, 4, 2], "Support",
    "Synchronize - When inflicted with status, inflict same status on attacker with +1 turn duration",
    [
      S("Transform", "Self", 0, { skillEffect: { target: "self", stat: "atk", amount: 0, duration: 1 }, skillRaw: "Transform (Self: Copy target's Stats (HP fixed at 14), Ability and Skills for 3 turns. Cannot transform into other Legendaries. Multi-skill Pokemon will overwrite Skill 2 and 3 as well)" }),
      S("Life Dew", "AllAllies", 0, { skillLimit: 1, skillRaw: "Life Dew (Heal all allies regardless of range for 2 HP — Once per game)" }),
      S("Reflect Type", "Line(1)(3)", 0, { skillRaw: "Reflect Type (Target one enemy Pokemon and change the user's type to match it)" })
    ],
    { base: true, legendary: true, hatchGroup: "psychic", hatchCost: 30, color: "#993556" }
  ),
};

const TEFF = {
  Fire:{strong:['Grass','Ice','Bug','Steel'],weak:['Water','Rock','Fire','Dragon']},
  Water:{strong:['Fire','Rock','Ground'],weak:['Grass','Electric','Water','Dragon']},
  Grass:{strong:['Water','Rock','Ground'],weak:['Fire','Ice','Flying','Poison','Bug','Dragon','Steel']},
  Electric:{strong:['Water','Flying'],weak:['Ground','Grass','Electric','Dragon']},
  Ice:{strong:['Grass','Flying','Ground','Dragon'],weak:['Fire','Rock','Steel','Water']},
  Psychic:{strong:['Fighting','Poison'],weak:['Steel','Psychic']},
  Flying:{strong:['Grass','Fighting','Bug'],weak:['Electric','Ice','Rock','Steel']},
  Normal:{strong:[],weak:['Rock','Steel','Fighting']},
  Poison:{strong:['Grass','Fairy'],weak:['Ground','Psychic','Poison','Rock','Ghost']},
  Rock:{strong:['Fire','Flying','Ice','Bug'],weak:['Water','Grass','Fighting','Ground','Steel']},
  Ground:{strong:['Fire','Electric','Rock','Poison','Steel'],weak:['Water','Grass','Ice','Bug']},
  Ghost:{strong:['Ghost','Psychic'],weak:['Ghost']},
  Bug:{strong:['Grass','Psychic'],weak:['Fire','Flying','Rock','Fighting','Ghost','Steel','Fairy','Poison']},
  Dragon:{strong:['Dragon'],weak:['Steel','Fairy']},
  Fairy:{strong:['Fighting','Dragon'],weak:['Fire','Poison','Steel']},
  Fighting:{strong:['Normal','Rock','Steel','Ice'],weak:['Psychic','Flying','Fairy','Bug','Poison']},
  Steel:{strong:['Rock','Ice','Fairy'],weak:['Fire','Water','Electric','Steel']},
};

const SCOL = {burn:'#F0997B',poison:'#B5D4F4',paralysis:'#FAC775',sleep:'#D3D1C7',freeze:'#B5D4F4',confuse:'#AFA9EC',toxic:'#A064BE'};
const STATUS_META = {
  sleep:{label:'Sleep',desc:'50% chance to wake and act; if the action fails, sleep ends.'},
  paralysis:{label:'Paralysis',desc:'30% chance to be unable to act each turn.'},
  confuse:{label:'Confuse',desc:'30% chance to hurt itself for 2 damage instead of acting.'},
  freeze:{label:'Freeze',desc:'Cannot act until thawed. 25% chance to thaw at end of turn.'},
  toxic:{label:'Toxic',desc:'Takes 1 damage every end of turn while afflicted.'},
  burn:{label:'Burn',desc:'Takes 1 damage every end of turn until cured.'},
  poison:{label:'Poison',desc:'Takes 1 damage every end of turn until cured.'}
};
const TCOL = {Fire:'#D85A30',Water:'#185FA5',Grass:'#3B6D11',Electric:'#BA7517',Ice:'#0C447C',Psychic:'#993556',Flying:'#534AB7',Normal:'#5F5E5A',Poison:'#72243E',Rock:'#5F5A5A',Ground:'#854F0B',Ghost:'#3C3489',Bug:'#6D8E1E',Dragon:'#5B7DD1',Fairy:'#C96BAA',Fighting:'#A63D2E',Steel:'#6F7C8B'};

let G = {};