/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PokemonDBEntry, Skill } from "../types";

function S(name: string, desc: string, dmg: number = 0, extra: Partial<Skill> = {}): Skill {
  let defaultRaw = extra.skillRaw;
  if (!defaultRaw) {
    const parts: string[] = [];
    if (dmg > 0) {
      parts.push(`Deals ${dmg} damage.`);
    }
    if (extra.statusChance) {
      const pct = Math.round((extra.statusChanceValue || 0.3) * 100);
      parts.push(`Has a ${pct}% chance to inflict ${extra.statusChance.toUpperCase()}.`);
    }
    if (extra.skillHeal) {
      parts.push(`Restores ${extra.skillHeal} HP to ${extra.skillHealTarget || "self"}.`);
    }
    if (extra.selfDamage) {
      parts.push(`User takes ${extra.selfDamage} recoil damage.`);
    }

    // Explicit explanations for the custom legendary and beast skills
    if (name === "Tidal Bell" || name === "Tidal bell") {
      parts.push("Summons a Tidal Bell (3 charges) on an adjacent empty tile. The bell reduces damage taken by nearby allies (except Lugia) by 2 per hit, consuming 1 charge.");
    } else if (name === "Clear Bell") {
      parts.push("Summons a Clear Bell (3 HP) on an empty tile within 2 range. Restores 1 HP to adjacent allies in a 3x3 area at the end of each turn.");
    } else if (name === "Extreme Speed") {
      parts.push("Dashes forward up to 3 tiles in a straight line, dealing 4 damage to enemies collided.");
    } else if (name === "Roar") {
      parts.push("Lowers targeted enemy's Attack by 1 for 2 turns.");
    } else if (name === "Mist") {
      parts.push("Cleanses status conditions and negative stat modifiers on allies within a 2-tile radius of the caster (+1 Def for 2 turns).");
    } else if (name === "Aromatherapy") {
      parts.push("Cleanses all status conditions and restores +3 HP to allies within a 2-tile radius of the target cell.");
    } else if (name === "Future Sight") {
      parts.push("Sends up to 2 enemy units in the target line to the next 2 turns (banished for 2 turns after a 2-turn countdown).");
    }

    if (parts.length === 0) {
      parts.push("Deploys a specialized strategic maneuver.");
    }
    defaultRaw = `${name} (${desc}): ${parts.join(" ")}`;
  }

  return {
    skillName: name,
    skillDesc: desc,
    skillDmg: dmg,
    skillRaw: defaultRaw,
    ...extra
  };
}

function Pkmn(
  dex: number,
  types: string[],
  cost: number,
  stats: number[],
  cls: string,
  abilityFull: string,
  skills: Skill[],
  extra: Partial<PokemonDBEntry> = {}
): PokemonDBEntry {
  const parts = abilityFull.split(" - ");
  const abilityName = parts[0]?.trim() || "No Ability";
  const abilityDesc = parts.slice(1).join(" - ").trim() || "";

  return {
    dex,
    t1: types[0],
    t2: types[1] || "",
    cost,
    hp: stats[0],
    atk: stats[1],
    def: stats[2] || 0,
    cls,
    ability: abilityName,
    abilityDesc,
    img: `https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${String(dex).padStart(3, '0')}.png`,
    skills,
    skillName: skills[0]?.skillName,
    skillDesc: skills[0]?.skillDesc,
    skillDmg: skills[0]?.skillDmg,
    skillCost: skills[0]?.skillCost,
    skillRaw: skills[0]?.skillRaw,
    base: false,
    legendary: false,
    evoCost: null,
    evoTo: null,
    evoFrom: null,
    ...extra
  };
}

export const DB: { [species: string]: PokemonDBEntry } = {
  // --- GRASS STARTER LINE ---
  Bulbasaur: Pkmn(1, ["Grass", "Poison"], 3, [8, 2, 0], "Support",
    "Overgrow - When HP ≤ 50%, deal +1 damage with Grass skills",
    [S("Leech Seed", "Line(1)(3)", 1, { special: "leechSeed", specialDuration: 2, skillRaw: "Leech Seed (Target 1: Drain 1 HP/turn for 2 turns, heal user equal amount)" })],
    { base: true, evoCost: 6, evoTo: "Ivysaur", color: "#3B6D11" }
  ),
  Ivysaur: Pkmn(2, ["Grass", "Poison"], 3, [10, 3, 0], "Support",
    "Overgrow - When HP ≤ 50%, deal +1 damage with Grass skills",
    [S("Razor Leaf", "Line(2)(1)", 3)],
    { evoFrom: "Bulbasaur", evoCost: 9, evoTo: "Venusaur", color: "#3B6D11" }
  ),
  Venusaur: Pkmn(3, ["Grass", "Poison"], 3, [14, 4, 1], "Defense",
    "Chlorophyll - 1 per turn reduce energy cost to move by 1",
    [S("Solar Beam", "AoE(2)", 4, { skillCost: 4, skillRaw: "Solar Beam (AoE(2): Deal 4 damage. Energy Cost = 4. If Sunny Day active, costs 1 less Energy)" })],
    { evoFrom: "Ivysaur", color: "#3B6D11" }
  ),

  // --- FIRE STARTER LINE ---
  Charmander: Pkmn(4, ["Fire"], 3, [7, 3, 0], "Attack",
    "Blaze - When HP ≤ 50%, deal +1 damage with Fire skills",
    [S("Ember", "Line(2)(3)", 2, { statusChance: "burn", statusChanceValue: 0.3, skillRaw: "Ember (Target 2: Deal 2 damage, 30% chance to Burn for 2 turns)" })],
    { base: true, evoCost: 6, evoTo: "Charmeleon", color: "#D85A30" }
  ),
  Charmeleon: Pkmn(5, ["Fire"], 3, [9, 4, 0], "Attack",
    "Blaze - When HP ≤ 50%, deal +1 damage with Fire skills",
    [S("Flamethrower", "Line(3)(1)", 3, { statusChance: "burn", statusChanceValue: 0.3, skillRaw: "Flamethrower (Line(3)(1): Deal 3 damage, 30% chance to Burn for 2 turns)" })],
    { evoFrom: "Charmander", evoCost: 9, evoTo: "Charizard", color: "#D85A30" }
  ),
  Charizard: Pkmn(6, ["Fire", "Flying"], 3, [12, 5, 1], "Attack",
    "Solar Power - In Sunny Weather, Atk +2 but takes 2 damage at the end of the turn",
    [S("Fire Blast", "Cone(3)", 4, { statusChance: "burn", statusChanceValue: 0.3, skillRaw: "Fire Blast (Cone(3)): Deal 4 damage, 30% chance to Burn for 2 turns" })],
    { evoFrom: "Charmeleon", color: "#D85A30" }
  ),

  // --- WATER STARTER LINE ---
  Squirtle: Pkmn(7, ["Water"], 3, [8, 2, 1], "Defense",
    "Torrent - When HP ≤ 50%, deal +1 damage with Water skills",
    [S("Water Gun", "Line(2)(3)", 2, { skillRaw: "Water Gun (Line(2): Deal 2 damage)" })],
    { base: true, evoCost: 6, evoTo: "Wartortle", color: "#185FA5" }
  ),
  Wartortle: Pkmn(8, ["Water"], 3, [10, 3, 2], "Defense",
    "Torrent - When HP ≤ 50%, deal +1 damage with Water skills",
    [S("Water Pulse", "AoE(1)", 2, { statusChance: "confuse", statusChanceValue: 0.2, skillRaw: "Water Pulse (AoE(1): Deal 2 damage, 20% chance to Confuse for 3 turns)" })],
    { evoFrom: "Squirtle", evoCost: 9, evoTo: "Blastoise", color: "#185FA5" }
  ),
  Blastoise: Pkmn(9, ["Water"], 3, [13, 4, 2], "Defense",
    "Rain Dish - In Rain, heals 1 HP at start of turn",
    [S("Hydro Cannon", "Line(3)(1)", 6, { skillCost: 3, skillRaw: "Hydro Cannon (Line(3)(1): Deal 6 damage, Cost 3)" })],
    { evoFrom: "Wartortle", color: "#185FA5" }
  ),

  // --- BUG LINE (CATERPIE) ---
  Caterpie: Pkmn(10, ["Bug"], 1, [6, 1, 0], "Support",
    "Shield Dust - Immune to secondary effects of enemy skills",
    [S("String Shot", "Line(1)(3)", 0, { skillRaw: "String Shot (Line(1): Next turn target move cost +1)" })],
    { base: true, evoCost: 3, evoTo: "Metapod", color: "#6D8E1E" }
  ),
  Metapod: Pkmn(11, ["Bug"], 1, [8, 1, 1], "Defense",
    "Shed Skin - 30% chance to cure status conditions at start of turn",
    [S("Harden", "Self", 0, { skillEffect: { target: "self", stat: "def", amount: 1, duration: 3 }, skillRaw: "Harden (Self: Gain +1 Def for 3 turns)" })],
    { evoFrom: "Caterpie", evoCost: 4, evoTo: "Butterfree", color: "#6D8E1E" }
  ),
  Butterfree: Pkmn(12, ["Bug", "Flying"], 1, [10, 3, 1], "Support",
    "Compound Eyes - Skills have 30% higher status infliction chance",
    [S("Sleep Powder", "Line(3)(3)", 0, { statusChance: "sleep", statusChanceValue: 0.5, skillRaw: "Sleep Powder (Target 3: 50% chance to inflict Sleep for 3 turns)" })],
    { evoFrom: "Metapod", color: "#6D8E1E" }
  ),

  // --- BUG LINE (WEEDLE) ---
  Weedle: Pkmn(13, ["Bug", "Poison"], 1, [5, 2, 0], "Attack",
    "Shield Dust - Immune to secondary effects of enemy skills",
    [S("Poison Sting", "Line(1)(3)", 1, { statusChance: "poison", statusChanceValue: 0.3, skillRaw: "Poison Sting (Target 1: Deal 1 damage, 30% chance to Poison for 3 turns)" })],
    { base: true, evoCost: 3, evoTo: "Kakuna", color: "#6D8E1E" }
  ),
  Kakuna: Pkmn(14, ["Bug", "Poison"], 1, [7, 1, 1], "Defense",
    "Shed Skin - 30% chance to cure status conditions at start of turn",
    [S("Iron Defense", "Self", 0, { skillEffect: { target: "self", stat: "def", amount: 2, duration: 2 }, skillRaw: "Iron Defense (Self: Gain +2 Def for 2 turns)" })],
    { evoFrom: "Weedle", evoCost: 4, evoTo: "Beedrill", color: "#6D8E1E" }
  ),
  Beedrill: Pkmn(15, ["Bug", "Poison"], 1, [9, 4, 1], "Assassin",
    "Swarm - When HP ≤ 50%, deal +1 damage with Bug skills",
    [S("Twin Needle", "Line(2)(3)", 4, { skillRaw: "Twin Needle (Target 2: Deal 4 damage. Attacks twice, hitting for 2 damage each time)" })],
    { evoFrom: "Kakuna", color: "#6D8E1E" }
  ),

  // --- FLYING LINE (PIDGEY) ---
  Pidgey: Pkmn(16, ["Normal", "Flying"], 1, [6, 2, 0], "Support",
    "Keen Eye - Stats cannot be lowered by enemies",
    [S("Sand Attack", "Line(2)(3)", 0, { skillEffect: { target: "enemy", stat: "atk", amount: -1, duration: 2 }, skillRaw: "Sand Attack (Target 2: Reduce target's Atk by 1 for 2 turns)" })],
    { base: true, evoCost: 4, evoTo: "Pidgeotto", color: "#5F5E5A" }
  ),
  Pidgeotto: Pkmn(17, ["Normal", "Flying"], 1, [9, 3, 0], "Support",
    "Keen Eye - Stats cannot be lowered by enemies",
    [S("Gust", "Line(2)(1)", 3)],
    { evoFrom: "Pidgey", evoCost: 7, evoTo: "Pidgeot", color: "#5F5E5A" }
  ),
  Pidgeot: Pkmn(18, ["Normal", "Flying"], 1, [12, 4, 1], "Attack",
    "Tangled Feet - When Confused, gains move cost reduce by 1 (2 time)",
    [S("Hurricane", "AoE(1)(3)", 4, { statusChance: "confuse", statusChanceValue: 0.3, skillRaw: "Hurricane (AoE(1-tile radius around target, range 3): Deal 4 damage, 30% chance to Confuse for 3 turns)" })],
    { evoFrom: "Pidgeotto", color: "#5F5E5A" }
  ),

  // --- NORMAL LINE (RATTATA) ---
  Rattata: Pkmn(19, ["Normal"], 1, [5, 3, 0], "Assassin",
    "Run Away - Can move through enemy-occupied tiles",
    [S("Quick Attack", "Line(2)(3)", 3, { skillRaw: "Quick Attack (Target 2: Deal 3 damage. Always moves first in priority)" })],
    { base: true, evoCost: 5, evoTo: "Raticate", color: "#5F5E5A" }
  ),
  Raticate: Pkmn(20, ["Normal"], 1, [10, 4, 1], "Assassin",
    "Guts - When afflicted with status, Atk +2",
    [S("Hyper Fang", "Line(1)(3)", 4, { skillRaw: "Hyper Fang (Target 1: Deal 4 damage, 10% chance target Flinches and skips next turn)" })],
    { evoFrom: "Rattata", color: "#5F5E5A" }
  ),

  // --- FLYING LINE (SPEAROW) ---
  Spearow: Pkmn(21, ["Normal", "Flying"], 1, [6, 3, 0], "Attack",
    "Keen Eye - Stats cannot be lowered by enemies",
    [S("Peck", "Line(1)(3)", 3)],
    { base: true, evoCost: 5, evoTo: "Fearow", color: "#5F5E5A" }
  ),
  Fearow: Pkmn(22, ["Normal", "Flying"], 1, [11, 4, 1], "Attack",
    "Sniper - Critical hits deal +3 damage instead of +2",
    [S("Drill Peck", "Line(2)(1)", 4)],
    { evoFrom: "Spearow", color: "#5F5E5A" }
  ),

  // --- POISON LINE (EKANS) ---
  Ekans: Pkmn(23, ["Poison"], 1, [6, 3, 0], "Support",
    "Intimidate - Any adjacent enemy gets Atk -1",
    [S("Glare", "Line(2)(3)", 0, { statusChance: "paralysis", statusChanceValue: 0.5, skillRaw: "Glare (Target 2: 50% chance to Paralyze for 3 turns)" })],
    { base: true, evoCost: 6, evoTo: "Arbok", color: "#72243E" }
  ),
  Arbok: Pkmn(24, ["Poison"], 1, [11, 4, 1], "Defense",
    "Intimidate - Any adjacent enemy gets Atk -1",
    [S("Crunch", "Line(1)(3)", 4, { skillEffect: { target: "enemy", stat: "def", amount: -1, duration: 2 }, skillRaw: "Crunch (Target 1: Deal 4 damage, 20% chance to lower target's Def by 1)" })],
    { evoFrom: "Ekans", color: "#72243E" }
  ),

  // --- ELECTRIC LINE (PIKACHU) ---
  Pikachu: Pkmn(25, ["Electric"], 2, [7, 3, 0], "Attack",
    "Static - Contact attacks have a 30% chance to Paralyze the attacker for 3 turns",
    [S("Thunderbolt", "Line(3)(3)", 2, { statusChance: "paralysis", statusChanceValue: 0.1, skillRaw: "Thunderbolt (Target 3: Deal 2 damage, 10% chance to Paralyze for 3 turns)" })],
    { base: true, evoCost: 7, evoTo: "Raichu", color: "#BA7517" }
  ),
  Raichu: Pkmn(26, ["Electric"], 2, [11, 5, 1], "Attack",
    "Lightning Rod - Draws all single-target Electric skills to itself; immune to Electric damage",
    [S("Thunder", "Line(4)(3)", 4, { statusChance: "paralysis", statusChanceValue: 0.3, skillRaw: "Thunder (Target 4: Deal 4 damage, 30% chance to Paralyze for 3 turns)" })],
    { evoFrom: "Pikachu", color: "#BA7517" }
  ),

  // --- GROUND LINE (SANDSHREW) ---
  Sandshrew: Pkmn(27, ["Ground"], 2, [8, 3, 1], "Defense",
    "Sand Veil - In Sandstorm, increases dodge chance by 20%",
    [S("Rollout", "Line(1)(3)", 2, { skillRaw: "Rollout (Target 1: Deal 2 damage. Damage increases by 1 each consecutive hit up to +2)" })],
    { base: true, evoCost: 6, evoTo: "Sandslash", color: "#854F0B" }
  ),
  Sandslash: Pkmn(28, ["Ground"], 2, [12, 4, 2], "Defense",
    "Sand Rush - In Sandstorm, movement range is doubled",
    [S("Earthquake", "AoE(2)", 4, { skillRaw: "Earthquake (AoE(All tiles within 2-tile radius around user): Deal 4 damage)" })],
    { evoFrom: "Sandshrew", color: "#854F0B" }
  ),

  // --- POISON LINE (NIDORAN F) ---
  NidoranF: Pkmn(29, ["Poison"], 2, [8, 2, 1], "Support",
    "Poison Point - When hit by melee, 30% chance Poison attacker for 4 turns",
    [S("Growl", "Cone(2)(3)", 0, { skillEffect: { target: "enemy", stat: "atk", amount: -1, duration: 2 }, skillRaw: "Growl (Cone(2): Enemies in cone get -1 Atk for 2 turns)" })],
    { base: true, evoCost: 5, evoTo: "Nidorina", color: "#72243E" }
  ),
  Nidorina: Pkmn(30, ["Poison"], 2, [10, 3, 1], "Support",
    "Rivalry - Deal +1 damage if target same gender, -1 if opposite",
    [S("Bite", "Line(1)(3)", 3, { skillRaw: "Bite (Line(1): Deal 3 damage, 30% chance Flinch)" })],
    { evoFrom: "NidoranF", evoCost: 7, evoTo: "Nidoqueen", color: "#72243E" }
  ),
  Nidoqueen: Pkmn(31, ["Poison", "Ground"], 2, [14, 4, 2], "Defense",
    "Sheer Force - Skills with secondary effects deal +1 damage but lose effects",
    [S("Earth Power", "Line(3)(1)", 4, { skillEffect: { target: "enemy", stat: "def", amount: -1, duration: 2 }, skillRaw: "Earth Power (Line(3)(1): Deal 4 damage, lower target Def by 1 for 2 turns)" })],
    { evoFrom: "Nidorina", color: "#72243E" }
  ),

  // --- POISON LINE (NIDORAN M) ---
  NidoranM: Pkmn(32, ["Poison"], 2, [7, 2, 0], "Attack",
    "Rivalry - Deal +1 damage if target same gender, -1 if opposite",
    [S("Horn Attack", "Line(1)(3)", 3)],
    { base: true, evoCost: 5, evoTo: "Nidorino", color: "#72243E" }
  ),
  Nidorino: Pkmn(33, ["Poison"], 2, [10, 3, 0], "Attack",
    "Poison Point - When hit by melee, 30% chance Poison attacker for 4 turns",
    [S("Poison Jab", "Line(1)(3)", 3, { statusChance: "poison", statusChanceValue: 0.6, skillRaw: "Poison Jab (Line(1): Deal 3 damage, 60% chance Poison for 4 turns)" })],
    { evoFrom: "NidoranM", evoCost: 7, evoTo: "Nidoking", color: "#72243E" }
  ),
  Nidoking: Pkmn(34, ["Poison", "Ground"], 2, [13, 5, 1], "Attack",
    "Sheer Force - Skills with secondary effects deal +1 damage but lose effects",
    [S("Megahorn", "Line(2)(1)", 5)],
    { evoFrom: "Nidorino", color: "#72243E" }
  ),

  // --- FAIRY LINE (CLEFAIRY) ---
  Clefairy: Pkmn(35, ["Fairy"], 2, [10, 2, 1], "Support",
    "Magic Guard - Immune to indirect damage (Burn, Poison, Hail, Sand Storm, Leech)",
    [S("Moonlight", "Self", 0, { skillHeal: 4, skillHealTarget: "self", skillCost: 2, skillRaw: "Moonlight (Self: Heal 4 HP, costs 2 Energy)" })],
    { base: true, evoCost: 6, evoTo: "Clefable", color: "#C96BAA" }
  ),
  Clefable: Pkmn(36, ["Fairy"], 2, [13, 3, 1], "Support",
    "Unaware - Ignore enemy stat modifiers when attacking",
    [S("Metronome", "Line(1)(3)", 0, { skillCost: 2, skillRaw: "Metronome (Random: Use random skill from any Pokemon, costs 2 Energy)" })],
    { evoFrom: "Clefairy", color: "#C96BAA" }
  ),

  // --- FIRE LINE (VULPIX) ---
  Vulpix: Pkmn(37, ["Fire"], 2, [7, 2, 1], "Support",
    "Flash Fire - Immune to Fire damage, after Fire hit deal +1 Fire damage",
    [S("Will-O-Wisp", "Line(2)(1)", 1, { statusChance: "burn", statusChanceValue: 1.0, skillRaw: "Will-O-Wisp (Line(2)(1): Deal 1 damage, inflict Burn for 3 turns)" })],
    { base: true, evoCost: 6, evoTo: "Ninetales", color: "#D85A30" }
  ),
  Ninetales: Pkmn(38, ["Fire"], 2, [11, 4, 1], "Support",
    "Drought - When deployed, set Sunny Day for 5 turns",
    [
      S("Flamethrower", "Line(3)(1)", 4, { statusChance: "burn", statusChanceValue: 0.4, skillRaw: "Flamethrower (Line(3)(1): Deal 4 damage, 40% chance Burn for 3 turns)" }),
      S("Sunny Day", "Self", 0, { skillCost: 2, skillRaw: "Sunny Day (Self): Summons Sunny Day weather on the zone for 5 turns." })
    ],
    { evoFrom: "Vulpix", color: "#D85A30" }
  ),
  "Alolan Vulpix": Pkmn(37.2, ["Ice"], 2, [7, 2, 1], "Support",
    "Snow Warning - When deployed, set Hail Storm for 5 turns",
    [S("Powder Snow", "Line(2)(1)", 1, { statusChance: "freeze", statusChanceValue: 0.3, skillRaw: "Powder Snow (Line(2)(1): Deal 1 Ice damage, 30% chance to Freeze target for 1 turn)" })],
    { base: true, evoCost: 6, evoTo: "Alolan Ninetales", color: "#8CD16D" }
  ),
  "Alolan Ninetales": Pkmn(38.2, ["Ice", "Fairy"], 3, [14, 4, 2], "Support",
    "Snow Warning - When deployed, set Hail Storm for 5 turns",
    [
      S("Ice Beam", "Line(3)(1)", 4, { statusChance: "freeze", statusChanceValue: 0.3, skillRaw: "Ice Beam (Line(3)(1)): Deal 4 Ice damage, 30% chance to Freeze target for 1 turn." }),
      S("Hail", "Self", 0, { skillCost: 2, skillRaw: "Hail (Self): Summons Hail Storm weather on the zone for 5 turns." })
    ],
    { evoFrom: "Alolan Vulpix", color: "#8CD16D" }
  ),

  // --- NORMAL/FAIRY LINE (JIGGLYPUFF) ---
  Jigglypuff: Pkmn(39, ["Normal", "Fairy"], 1, [10, 2, 0], "Support",
    "Competitive - When stats lowered, gain +2 Atk for 2 turns",
    [S("Sing", "AoE(1)", 0, { statusChance: "sleep", statusChanceValue: 1.0, skillRaw: "Sing (AoE(1): Adjacent enemies Sleep for 2 turns)" })],
    { base: true, evoCost: 5, evoTo: "Wigglytuff", color: "#5F5E5A" }
  ),
  Wigglytuff: Pkmn(40, ["Normal", "Fairy"], 1, [15, 3, 1], "Support",
    "Cute Charm - When hit by melee, 30% chance inflict Infatuation (attacker cannot target this Pokemon for 2 turns)",
    [S("Hyper Voice", "Cone(2)(3)", 3)],
    { evoFrom: "Jigglypuff", color: "#5F5E5A" }
  ),

  // --- POISON/FLYING LINE (ZUBAT) ---
  Zubat: Pkmn(41, ["Poison", "Flying"], 1, [7, 2, 0], "Attack",
    "Inner Focus - Immune to Flinch",
    [S("Leech Life", "Line(1)(3)", 2, { skillHeal: 1, skillHealTarget: "self", skillRaw: "Leech Life (Line(1): Deal 2 damage, heal 1 HP)" })],
    { base: true, evoCost: 5, evoTo: "Golbat", color: "#72243E" }
  ),
  Golbat: Pkmn(42, ["Poison", "Flying"], 1, [11, 4, 1], "Attack",
    "Infiltrator - Ignore defensive modifiers on targets",
    [S("Poison Fang", "Line(1)(3)", 3, { statusChance: "poison", statusChanceValue: 0.7, skillRaw: "Poison Fang (Line(1): Deal 3 damage, 70% chance Poison for 4 turns)" })],
    { evoFrom: "Zubat", color: "#72243E" }
  ),

  // --- GRASS/POISON LINE (ODDISH) ---
  Oddish: Pkmn(43, ["Grass", "Poison"], 1, [7, 2, 1], "Support",
    "Chlorophyll - During Sunny Day, first Move costs 0 Energy",
    [S("Absorb", "Line(1)(3)", 2, { skillHeal: 1, skillHealTarget: "self", skillRaw: "Absorb (Line(1): Deal 2 damage, heal 1 HP)" })],
    { base: true, evoCost: 5, evoTo: "Gloom", color: "#3B6D11" }
  ),
  Gloom: Pkmn(44, ["Grass", "Poison"], 1, [10, 3, 1], "Support",
    "Stench - After attacking, 20% chance inflict Flinch",
    [S("Poison Powder", "Cone(1)(3)", 0, { statusChance: "poison", statusChanceValue: 0.7, skillRaw: "Poison Powder (Cone(1): 70% chance Poison for 4 turns)" })],
    { evoFrom: "Oddish", evoCost: 7, evoTo: "Vileplume", color: "#3B6D11" }
  ),
  Vileplume: Pkmn(45, ["Grass", "Poison"], 1, [12, 4, 1], "Support",
    "Effect Spore - When hit by melee, 30% chance inflict Poison or Sleep for 2 turns",
    [S("Petal Dance", "AoE(1)", 3, { skillRaw: "Petal Dance (AoE(1): Deal 3 damage to adjacent enemies, user Confused for 3 turns)" })],
    { evoFrom: "Gloom", color: "#3B6D11" }
  ),

  // --- BUG/GRASS LINE (PARAS) ---
  Paras: Pkmn(46, ["Bug", "Grass"], 1, [7, 2, 0], "Attack",
    "Dry Skin - Take +1 damage from Fire, during Rain Dance heal 1 HP/turn",
    [S("Scratch", "Line(1)(3)", 2)],
    { base: true, evoCost: 5, evoTo: "Parasect", color: "#6D8E1E" }
  ),
  Parasect: Pkmn(47, ["Bug", "Grass"], 1, [11, 4, 1], "Attack",
    "Damp - Prevents explosive/self-destruct skills by enemies",
    [S("Spore", "Line(1)(3)", 0, { statusChance: "sleep", statusChanceValue: 1, skillRaw: "Spore (Target 1: Inflict Sleep for 2 turns, 100% chance)" })],
    { evoFrom: "Paras", color: "#6D8E1E" }
  ),

  // --- BUG/POISON LINE (VENONAT) ---
  Venonat: Pkmn(48, ["Bug", "Poison"], 1, [8, 2, 1], "Support",
    "Compound Eyes - Status skills have +15% accuracy",
    [S("Supersonic", "Line(2)(3)", 0, { statusChance: "confuse", statusChanceValue: 0.7, skillRaw: "Supersonic (Line(2): 70% chance Confuse for 3 turns)" })],
    { base: true, evoCost: 6, evoTo: "Venomoth", color: "#6D8E1E" }
  ),
  Venomoth: Pkmn(49, ["Bug", "Poison"], 1, [11, 4, 1], "Support",
    "Tinted Lens - Resisted hits deal normal damage",
    [S("Silver Wind", "Line(3)(3)", 3, { skillRaw: "Silver Wind (Line(3): Deal 3 damage, 20% chance raise Atk and Def by 1)" })],
    { evoFrom: "Venonat", color: "#6D8E1E" }
  ),

  // --- GROUND LINE (DIGLETT) ---
  Diglett: Pkmn(50, ["Ground"], 1, [6, 2, 0], "Attack",
    "Arena Trap - Adjacent enemies cannot Move away",
    [S("Mud-Slap", "Line(1)(3)", 2, { skillRaw: "Mud-Slap (Line(1): Deal 2 damage, reduce target skill range by 1 next turn)" })],
    { base: true, evoCost: 5, evoTo: "Dugtrio", color: "#854F0B" }
  ),
  Dugtrio: Pkmn(51, ["Ground"], 1, [9, 4, 1], "Attack",
    "Sand Force - During Sand Storm, Ground attacks deal +1 damage",
    [S("Earthquake", "AoE(1)", 4, { skillRaw: "Earthquake (AoE(1): Deal 4 damage to adjacent enemies)" })],
    { evoFrom: "Diglett", color: "#854F0B" }
  ),

  // --- NORMAL LINE (MEOWTH) ---
  Meowth: Pkmn(52, ["Normal"], 1, [7, 2, 0], "Attack",
    "Pickup - At turn end, 15% chance find random consumable item",
    [S("Pay Day", "Line(1)(3)", 2, { skillRaw: "Pay Day (Line(1): Deal 2 damage, gain +1 Gold if defeats target)" })],
    { base: true, evoCost: 6, evoTo: "Persian", color: "#5F5E5A" }
  ),
  Persian: Pkmn(53, ["Normal"], 1, [10, 4, 1], "Attack",
    "Technician - Skills with base damage ≤2 deal +1 damage",
    [S("Slash", "Line(1)(3)", 4, { skillRaw: "Slash (Line(1): Deal 4 damage, crit on 14+)" })],
    { evoFrom: "Meowth", color: "#5F5E5A" }
  ),

  // --- WATER LINE (PSYDUCK) ---
  Psyduck: Pkmn(54, ["Water"], 1, [8, 2, 1], "Support",
    "Damp - Prevents explosive skills by enemies",
    [S("Confusion", "Line(2)(3)", 2, { statusChance: "confuse", statusChanceValue: 0.3, skillRaw: "Confusion (Line(2): Deal 2 damage, 30% chance Confuse for 3 turns)" })],
    { base: true, evoCost: 6, evoTo: "Golduck", color: "#185FA5" }
  ),
  Golduck: Pkmn(55, ["Water"], 1, [12, 4, 1], "Support",
    "Swift Swim - During Rain Dance, Move costs -1 Energy",
    [S("Psychic", "Line(3)(1)", 4, { skillEffect: { target: "enemy", stat: "def", amount: -1, duration: 2 }, skillRaw: "Psychic (Line(3)(1): Deal 4 damage, lower target Def by 1)" })],
    { evoFrom: "Psyduck", color: "#185FA5" }
  ),

  // --- FIGHTING LINE (MANKEY) ---
  Mankey: Pkmn(56, ["Fighting"], 1, [7, 3, 0], "Attack",
    "Defiant - When stats lowered, gain +2 Atk",
    [S("Karate Chop", "Line(1)(3)", 3, { skillRaw: "Karate Chop (Line(1): Deal 3 damage, crit on 15+)" })],
    { base: true, evoCost: 6, evoTo: "Primeape", color: "#A63D2E" }
  ),
  Primeape: Pkmn(57, ["Fighting"], 1, [11, 5, 1], "Attack",
    "Anger Point - When hit by crit, gain +3 Atk for 2 turns",
    [S("Close Combat", "Line(1)(3)", 6, { skillRaw: "Close Combat (Line(1): Deal 6 damage, lower own Def by 1 for 2 turns)" })],
    { evoFrom: "Mankey", color: "#A63D2E" }
  ),

  // --- FIRE LINE (GROWLITHE) ---
  Growlithe: Pkmn(58, ["Fire"], 2, [9, 3, 1], "Attack",
    "Intimidate - Adjacent enemies get -1 Atk",
    [S("Flame Wheel", "Line(2)(1)", 3, { statusChance: "burn", statusChanceValue: 0.4, skillRaw: "Flame Wheel (Line(2)(1): Deal 3 damage, 40% chance Burn for 3 turns)" })],
    { base: true, evoCost: 7, evoTo: "Arcanine", color: "#D85A30" }
  ),
  Arcanine: Pkmn(59, ["Fire"], 2, [14, 5, 1], "Attack",
    "Justified - When hit by Dark attack, gain +2 Atk",
    [S("Extreme Speed", "Line(3)(1)", 4, { skillCost: 0, skillRaw: "Extreme Speed (Line(3)(1): Deal 4 damage, costs 0 Energy, once per turn)" })],
    { evoFrom: "Growlithe", color: "#D85A30" }
  ),

  // --- WATER LINE (POLIWAG) ---
  Poliwag: Pkmn(60, ["Water"], 1, [7, 2, 1], "Support",
    "Water Absorb - Heal 3 HP when hit by Water attack",
    [S("Bubble", "Line(2)(1)", 2, { skillRaw: "Bubble (Line(2)(1): Deal 2 damage, 30% chance reduce target Move by 1)" })],
    { base: true, evoCost: 5, evoTo: "Poliwhirl", color: "#185FA5" }
  ),
  Poliwhirl: Pkmn(61, ["Water"], 1, [10, 3, 1], "Support",
    "Damp - Prevents explosive skills by enemies",
    [S("Hypnosis", "Line(2)(3)", 0, { statusChance: "sleep", statusChanceValue: 0.8, skillRaw: "Hypnosis (Line(2): 80% chance Sleep for 2 turns)" })],
    { evoFrom: "Poliwag", evoCost: 7, evoTo: "Poliwrath", color: "#185FA5" }
  ),
  Poliwrath: Pkmn(62, ["Water", "Fighting"], 1, [14, 4, 2], "Defense",
    "Water Absorb - Heal 3 HP when hit by Water attack",
    [S("Submission", "Line(1)(3)", 5, { selfDamage: 1, skillRaw: "Submission (Line(1): Deal 5 damage, user takes 1 recoil)" })],
    { evoFrom: "Poliwhirl", color: "#185FA5" }
  ),

  // --- PSYCHIC LINE (ABRA) ---
  Abra: Pkmn(63, ["Psychic"], 2, [6, 3, 0], "Support",
    "Synchronize - When inflicted with status, inflict same status on attacker for same duration",
    [S("Teleport", "AoE(3)", 0, { skillCost: 2, skillRaw: "Teleport (AoE(3)): Move to any empty cell within a 7x7 area, costs 2 Energy" })],
    { base: true, evoCost: 4, evoTo: "Kadabra", color: "#993556" }
  ),
  Kadabra: Pkmn(64, ["Psychic"], 2, [8, 4, 1], "Support",
    "Magic Guard - Immune to indirect damage",
    [S("Confusion", "Line(3)(1)", 3, { statusChance: "confuse", statusChanceValue: 0.3, skillRaw: "Confusion (Line(3)(1): Deal 3 damage, 30% chance Confuse for 3 turns)" })],
    { evoFrom: "Abra", evoCost: 7, evoTo: "Alakazam", color: "#993556" }
  ),
  Alakazam: Pkmn(65, ["Psychic"], 2, [10, 5, 1], "Support",
    "Inner Focus - Immune to Flinch",
    [S("Psychic", "Line(3)(1)", 5, { skillEffect: { target: "enemy", stat: "def", amount: -1, duration: 2 }, skillRaw: "Psychic (Line(3)(1): Deal 5 damage, lower target Def by 1)" })],
    { evoFrom: "Kadabra", color: "#993556" }
  ),

  // --- FIGHTING LINE (MACHOP) ---
  Machop: Pkmn(66, ["Fighting"], 1, [9, 3, 0], "Attack",
    "Guts - When afflicted with status, gain +2 Atk",
    [S("Karate Chop", "Line(1)(3)", 3, { skillRaw: "Karate Chop (Line(1): Deal 3 damage, crit on 15+)" })],
    { base: true, evoCost: 6, evoTo: "Machoke", color: "#A63D2E" }
  ),
  Machoke: Pkmn(67, ["Fighting"], 1, [12, 4, 1], "Attack",
    "No Guard - All attacks cannot miss",
    [S("Vital Throw", "Line(1)(3)", 4, { skillRaw: "Vital Throw (Line(1): Deal 4 damage, ignores Def modifiers)" })],
    { evoFrom: "Machop", evoCost: 8, evoTo: "Machamp", color: "#A63D2E" }
  ),
  Machamp: Pkmn(68, ["Fighting"], 1, [15, 5, 1], "Attack",
    "Steadfast - When hit by flinch-causing attack, gain +1 Move range for 1 turn",
    [S("Close Combat", "Line(1)(3)", 5, { skillCost: 3, statusChance: "confuse", statusChanceValue: 1, skillRaw: "Close Combat (Line(1): Deal 5 damage, 100% chance Confuse for 3 turns, costs 3 Energy. Self inflict Def-2)" })],
    { evoFrom: "Machoke", color: "#A63D2E" }
  ),

  // --- GRASS/POISON LINE (BELLSPROUT) ---
  Bellsprout: Pkmn(69, ["Grass", "Poison"], 1, [7, 3, 0], "Attack",
    "Chlorophyll - During Sunny Day, first Move costs 0 Energy",
    [S("Vine Whip", "Line(2)(1)", 3)],
    { base: true, evoCost: 5, evoTo: "Weepinbell", color: "#3B6D11" }
  ),
  Weepinbell: Pkmn(70, ["Grass", "Poison"], 1, [10, 4, 0], "Attack",
    "Gluttony - Can use consumable items at 50% HP",
    [S("Razor Leaf", "Cone(2)(3)", 3)],
    { evoFrom: "Bellsprout", evoCost: 7, evoTo: "Victreebel", color: "#3B6D11" }
  ),
  Victreebel: Pkmn(71, ["Grass", "Poison"], 1, [12, 5, 1], "Attack",
    "Chlorophyll - During Sunny Day, first Move costs 0 Energy",
    [S("Leaf Blade", "Line(2)(1)", 4, { skillRaw: "Leaf Blade (Line(2)(1): Deal 4 damage, crit on 14+)" })],
    { evoFrom: "Weepinbell", color: "#3B6D11" }
  ),

  // --- WATER/POISON LINE (TENTACOOL) ---
  Tentacool: Pkmn(72, ["Water", "Poison"], 1, [7, 2, 1], "Support",
    "Clear Body - Immune to stat reduction from enemy skills",
    [S("Poison Sting", "Line(1)(3)", 2, { statusChance: "poison", statusChanceValue: 0.5, skillRaw: "Poison Sting (Line(1): Deal 2 damage, 50% chance Poison for 4 turns)" })],
    { base: true, evoCost: 6, evoTo: "Tentacruel", color: "#185FA5" }
  ),
  Tentacruel: Pkmn(73, ["Water", "Poison"], 1, [12, 4, 2], "Support",
    "Liquid Ooze - When enemy would heal from drain, they take damage instead",
    [S("Toxic Spikes", "AoE(1)", 0, { skillRaw: "Toxic Spikes (AoE(1): Enemies entering adjacent cells Poisoned for 4 turns)" })],
    { evoFrom: "Tentacool", color: "#185FA5" }
  ),

  // --- ROCK/GROUND LINE (GEODUDE) ---
  Geodude: Pkmn(74, ["Rock", "Ground"], 1, [8, 3, 2], "Defense",
    "Rock Head - Immune to recoil damage",
    [S("Rollout", "Line(2)(1)", 3, { skillRaw: "Rollout (Line(2)(1): Deal 3 damage, +1 damage for consecutive use)" })],
    { base: true, evoCost: 5, evoTo: "Graveler", color: "#5F5A5A" }
  ),
  Graveler: Pkmn(75, ["Rock", "Ground"], 1, [11, 4, 2], "Defense",
    "Sturdy - Cannot be OHKO'd from full HP",
    [S("Rock Throw", "Line(2)(1)", 3)],
    { evoFrom: "Geodude", evoCost: 7, evoTo: "Golem", color: "#5F5A5A" }
  ),
  Golem: Pkmn(76, ["Rock", "Ground"], 1, [14, 5, 3], "Defense",
    "Sand Veil - During Sand Storm, gain +1 Def",
    [S("Earthquake", "AoE(1)", 5, { skillRaw: "Earthquake (AoE(1): Deal 5 damage to adjacent enemies)" })],
    { evoFrom: "Graveler", color: "#5F5A5A" }
  ),

  // --- FIRE LINE (PONYTA) ---
  Ponyta: Pkmn(77, ["Fire"], 1, [8, 3, 1], "Attack",
    "Flash Fire - Immune to Fire damage, after Fire hit deal +1 Fire damage",
    [S("Ember", "Line(2)(1)", 2, { statusChance: "burn", statusChanceValue: 0.4, skillRaw: "Ember (Line(2)(1): Deal 2 damage, 40% chance Burn for 3 turns)" })],
    { base: true, evoCost: 6, evoTo: "Rapidash", color: "#D85A30" }
  ),
  Rapidash: Pkmn(78, ["Fire"], 1, [11, 4, 1], "Attack",
    "Flame Body - When hit by melee, 30% chance Burn attacker for 3 turns",
    [S("Fire Spin", "Line(2)(1)", 3, { skillRaw: "Fire Spin (Line(2)(1): Deal 3 damage, target cannot Move next turn)" })],
    { evoFrom: "Ponyta", color: "#D85A30" }
  ),

  // --- WATER/PSYCHIC LINE (SLOWPOKE) ---
  Slowpoke: Pkmn(79, ["Water", "Psychic"], 1, [11, 2, 1], "Support",
    "Own Tempo - Immune to Confusion",
    [S("Confusion", "Line(2)(3)", 2, { statusChance: "confuse", statusChanceValue: 0.3, skillRaw: "Confusion (Line(2): Deal 2 damage, 30% chance Confuse for 3 turns)" })],
    { base: true, evoCost: 7, evoTo: "Slowbro", color: "#185FA5" }
  ),
  Slowbro: Pkmn(80, ["Water", "Psychic"], 1, [15, 3, 2], "Defense",
    "Shell Armor - Immune to critical hits",
    [S("Psychic", "Line(3)(1)", 4, { skillEffect: { target: "enemy", stat: "def", amount: -1, duration: 2 }, skillRaw: "Psychic (Line(3)(1): Deal 4 damage, lower target Def by 1)" })],
    { evoFrom: "Slowpoke", color: "#185FA5" }
  ),

  // --- ELECTRIC/STEEL LINE (MAGNEMITE) ---
  Magnemite: Pkmn(81, ["Electric", "Steel"], 1, [7, 3, 1], "Support",
    "Sturdy - Cannot be OHKO'd from full HP",
    [S("Thunder Shock", "Line(2)(1)", 3, { statusChance: "paralysis", statusChanceValue: 0.4, skillRaw: "Thunder Shock (Line(2)(1): Deal 3 damage, 40% chance Paralyze for 3 turns)" })],
    { base: true, evoCost: 6, evoTo: "Magneton", color: "#BA7517" }
  ),
  Magneton: Pkmn(82, ["Electric", "Steel"], 1, [10, 4, 2], "Support",
    "Magnet Pull - Adjacent Steel enemies cannot Move",
    [S("Spark", "Line(2)(1)", 3, { statusChance: "paralysis", statusChanceValue: 0.5, skillRaw: "Spark (Line(2)(1): Deal 3 damage, 50% chance Paralyze for 3 turns)" })],
    { evoFrom: "Magnemite", evoCost: 8, evoTo: "Magnezone", color: "#BA7517" }
  ),

  // --- NORMAL (FARFETCH'D) ---
  "Farfetch'd": Pkmn(83, ["Normal", "Flying"], 2, [9, 4, 1], "Attack",
    "Defiant - When stats lowered, gain +2 Atk",
    [S("Slash", "Line(1)(3)", 4, { skillRaw: "Slash (Line(1): Deal 4 damage, crit on 14+)" })],
    { base: true, color: "#5F5E5A" }
  ),

  // --- NORMAL/FLYING LINE (DODUO) ---
  Doduo: Pkmn(84, ["Normal", "Flying"], 1, [7, 3, 0], "Attack",
    "Early Bird - Sleep duration reduced by 1 turn",
    [S("Peck", "Line(1)(3)", 2)],
    { base: true, evoCost: 5, evoTo: "Dodrio", color: "#5F5E5A" }
  ),
  Dodrio: Pkmn(85, ["Normal", "Flying"], 1, [11, 5, 1], "Attack",
    "Tangled Feet - When Confused, gain +1 Def",
    [S("Tri Attack", "Target = [3(Line(1)(1))]", 2, { statusChance: "burn", statusChanceValue: 0.1, skillRaw: "Tri Attack (Target = [3(Line(1)(1))]: Deal 2 damage to 3 targets, 10% chance Burn/Paralyze/Freeze for 3 turns)" })],
    { evoFrom: "Doduo", color: "#5F5E5A" }
  ),

  // --- WATER LINE (SEEL) ---
  Seel: Pkmn(86, ["Water"], 1, [9, 2, 1], "Support",
    "Thick Fat - Take -1 damage from Fire and Ice",
    [S("Headbutt", "Line(1)(3)", 3, { skillRaw: "Headbutt (Line(1): Deal 3 damage, 30% chance Flinch)" })],
    { base: true, evoCost: 6, evoTo: "Dewgong", color: "#185FA5" }
  ),
  Dewgong: Pkmn(87, ["Water", "Ice"], 1, [13, 4, 2], "Support",
    "Ice Body - During Hail, heal 1 HP/turn",
    [S("Aurora Beam", "Line(3)(1)", 3, { skillEffect: { target: "enemy", stat: "atk", amount: -1, duration: 2 }, skillRaw: "Aurora Beam (Line(3)(1): Deal 3 damage, 30% chance lower target Atk by 1)" })],
    { evoFrom: "Seel", color: "#185FA5" }
  ),

  // --- POISON LINE (GRIMER) ---
  Grimer: Pkmn(88, ["Poison"], 1, [9, 2, 2], "Defense",
    "Stench - After attacking, 20% chance inflict Flinch",
    [S("Poison Gas", "Cone(1)(3)", 0, { statusChance: "poison", statusChanceValue: 0.6, skillRaw: "Poison Gas (Cone(1): 60% chance Poison for 4 turns)" })],
    { base: true, evoCost: 6, evoTo: "Muk", color: "#72243E" }
  ),
  Muk: Pkmn(89, ["Poison"], 1, [14, 4, 2], "Defense",
    "Poison Touch - When hitting with melee, 30% chance Poison for 4 turns",
    [S("Gunk Shot", "Line(2)(1)", 4, { statusChance: "poison", statusChanceValue: 0.7, skillRaw: "Gunk Shot (Line(2)(1): Deal 4 damage, 70% chance Poison for 4 turns)" })],
    { evoFrom: "Grimer", color: "#72243E" }
  ),

  // --- WATER LINE (SHELLDER) ---
  Shellder: Pkmn(90, ["Water"], 1, [8, 2, 2], "Defense",
    "Shell Armor - Immune to critical hits",
    [S("Icicle Spear", "Line(2)(1)", 2, { skillRaw: "Icicle Spear (Line(2)(1): Deal 2 damage, hits twice)" })],
    { base: true, evoCost: 6, evoTo: "Cloyster", color: "#185FA5" }
  ),
  Cloyster: Pkmn(91, ["Water", "Ice"], 1, [11, 4, 3], "Defense",
    "Skill Link - Multi-hit skills always hit max times",
    [S("Spike Cannon", "Line(3)(1)", 2, { skillRaw: "Spike Cannon (Line(3)(1): Deal 2 damage, hits 2-5 times)" })],
    { evoFrom: "Shellder", color: "#185FA5" }
  ),

  // --- GHOST/POISON LINE (GASTLY) ---
  Gastly: Pkmn(92, ["Ghost", "Poison"], 2, [6, 3, 1], "Support",
    "Levitate - Immune to Ground attacks",
    [S("Lick", "Line(1)(3)", 2, { statusChance: "paralysis", statusChanceValue: 0.4, skillRaw: "Lick (Line(1): Deal 2 damage, 40% chance Paralyze for 3 turns)" })],
    { base: true, evoCost: 5, evoTo: "Haunter", color: "#3C3489" }
  ),
  Haunter: Pkmn(93, ["Ghost", "Poison"], 2, [9, 4, 1], "Support",
    "Levitate - Immune to Ground attacks",
    [S("Shadow Punch", "Line(2)(1)", 3, { skillRaw: "Shadow Punch (Line(2)(1): Deal 3 damage, cannot miss)" })],
    { evoFrom: "Gastly", evoCost: 8, evoTo: "Gengar", color: "#3C3489" }
  ),
  Gengar: Pkmn(94, ["Ghost", "Poison"], 2, [11, 5, 1], "Support",
    "Cursed Body - When hit, 30% chance disable attacker's last skill for 2 turns",
    [S("Shadow Ball", "Line(3)(1)", 4, { skillEffect: { target: "enemy", stat: "def", amount: -1, duration: 2 }, skillRaw: "Shadow Ball (Line(3)(1): Deal 4 damage, 30% chance lower target Def by 1)" })],
    { evoFrom: "Haunter", color: "#3C3489" }
  ),

  // --- ROCK/GROUND LINE (ONIX) ---
  Onix: Pkmn(95, ["Rock", "Ground"], 2, [10, 3, 3], "Defense",
    "Rock Head - Immune to recoil damage",
    [S("Rock Throw", "Line(2)(1)", 3)],
    { base: true, evoCost: 8, evoTo: "Steelix", color: "#5F5A5A" }
  ),

  // --- PSYCHIC LINE (DROWZEE) ---
  Drowzee: Pkmn(96, ["Psychic"], 1, [9, 2, 1], "Support",
    "Insomnia - Immune to Sleep",
    [S("Hypnosis", "Line(2)(3)", 0, { statusChance: "sleep", statusChanceValue: 0.8, skillRaw: "Hypnosis (Line(2): 80% chance Sleep for 2 turns)" })],
    { base: true, evoCost: 6, evoTo: "Hypno", color: "#993556" }
  ),
  Hypno: Pkmn(97, ["Psychic"], 1, [13, 3, 2], "Support",
    "Insomnia - Immune to Sleep",
    [S("Dream Eater", "Line(2)(3)", 3, { drainAmount: 3, skillRaw: "Dream Eater (Line(2): Drain 3 HP from sleeping target, fail if not asleep)" })],
    { evoFrom: "Drowzee", color: "#993556" }
  ),

  // --- WATER LINE (KRABBY) ---
  Krabby: Pkmn(98, ["Water"], 1, [7, 3, 1], "Attack",
    "Hyper Cutter - Immune to Atk reduction",
    [S("Crabhammer", "Line(1)(3)", 3, { skillRaw: "Crabhammer (Line(1): Deal 3 damage, crit on 14+)" })],
    { base: true, evoCost: 6, evoTo: "Kingler", color: "#185FA5" }
  ),
  Kingler: Pkmn(99, ["Water"], 1, [11, 5, 1], "Attack",
    "Shell Armor - Prevent critical hits",
    [S("Guillotine", "Line(1)(3)", 8, { skillCost: 3, skillRaw: "Guillotine (Line(1): Deal 8 damage, costs 3 Energy, 50% accuracy)" })],
    { evoFrom: "Krabby", color: "#185FA5" }
  ),

  // --- ELECTRIC LINE (VOLTORB) ---
  Voltorb: Pkmn(100, ["Electric"], 1, [7, 3, 1], "Support",
    "Soundproof - Immune to sound-based skills",
    [S("Sonic Boom", "Line(2)(1)", 2, { skillRaw: "Sonic Boom (Line(2)(1): Deal fixed 2 damage, ignores Def)" })],
    { base: true, evoCost: 5, evoTo: "Electrode", color: "#BA7517" }
  ),
  Electrode: Pkmn(101, ["Electric"], 1, [10, 4, 1], "Support",
    "Aftermath - When KO'd by melee, attacker takes 2 damage",
    [S("Explosion", "AoE(2)", 6, { skillCost: 0, skillRaw: "Explosion (AoE(2): Deal 6 damage to all adjacent, user faints, costs 0 Energy)" })],
    { evoFrom: "Voltorb", color: "#BA7517" }
  ),

  // --- GRASS/PSYCHIC LINE (EXEGGCUTE) ---
  Exeggcute: Pkmn(102, ["Grass", "Psychic"], 2, [9, 2, 1], "Support",
    "Chlorophyll - During Sunny Day, first Move costs 0 Energy",
    [S("Sleep Powder", "Cone(1)(3)", 0, { statusChance: "sleep", statusChanceValue: 0.6, skillRaw: "Sleep Powder (Cone(1): 60% chance Sleep for 2 turns)" })],
    { base: true, evoCost: 7, evoTo: "Exeggutor", color: "#3B6D11" }
  ),
  Exeggutor: Pkmn(103, ["Grass", "Psychic"], 2, [13, 4, 2], "Support",
    "Harvest - At turn end, 50% chance restore used Berry",
    [S("Psychic", "Line(3)(1)", 4, { skillEffect: { target: "enemy", stat: "def", amount: -1, duration: 2 }, skillRaw: "Psychic (Line(3)(1): Deal 4 damage, lower target Def by 1)" })],
    { evoFrom: "Exeggcute", color: "#3B6D11" }
  ),

  // --- GROUND LINE (CUBONE) ---
  Cubone: Pkmn(104, ["Ground"], 2, [8, 3, 1], "Attack",
    "Rock Head - Immune to recoil damage",
    [S("Bone Club", "Line(2)(1)", 3, { skillRaw: "Bone Club (Line(2)(1): Deal 3 damage, 30% chance Flinch)" })],
    { base: true, evoCost: 7, evoTo: "Marowak", color: "#854F0B" }
  ),
  Marowak: Pkmn(105, ["Ground"], 2, [11, 4, 1], "Attack",
    "Battle Armor - Immune to critical hits",
    [S("Bonemerang", "Line(3)(1)", 3, { skillRaw: "Bonemerang (Line(3)(1): Deal 3 damage twice)" })],
    { evoFrom: "Cubone", color: "#854F0B" }
  ),

  // --- FIGHTING (HITMONLEE) ---
  Hitmonlee: Pkmn(106, ["Fighting"], 2, [10, 5, 1], "Attack",
    "Limber - Immune to Paralysis",
    [S("High Jump Kick", "Line(2)(1)", 6, { selfDamage: 2, skillRaw: "High Jump Kick (Line(2)(1): Deal 6 damage, if miss user takes 2 damage)" })],
    { base: true, color: "#A63D2E" }
  ),

  // --- FIGHTING (HITMONCHAN) ---
  Hitmonchan: Pkmn(107, ["Fighting"], 2, [10, 4, 1], "Attack",
    "Keen Eye - Immune to accuracy reduction",
    [S("Mach Punch", "Line(1)(3)", 3, { skillCost: 0, skillRaw: "Mach Punch (Line(1): Deal 3 damage, costs 0 Energy, once per turn)" })],
    { base: true, color: "#A63D2E" }
  ),

  // --- NORMAL (LICKITUNG) ---
  Lickitung: Pkmn(108, ["Normal"], 2, [13, 3, 2], "Defense",
    "Own Tempo - Immune to Confusion",
    [S("Wrap", "Line(1)(3)", 2, { skillRaw: "Wrap (Line(1): Deal 2 damage/turn for 3 turns, target cannot Move)" })],
    { base: true, color: "#5F5E5A" }
  ),

  // --- POISON LINE (KOFFING) ---
  Koffing: Pkmn(109, ["Poison"], 1, [8, 2, 2], "Defense",
    "Levitate - Immune to Ground attacks",
    [S("Poison Gas", "AoE(1)", 0, { statusChance: "poison", statusChanceValue: 0.5, skillRaw: "Poison Gas (AoE(1): 50% chance Poison for 4 turns on adjacent enemies)" })],
    { base: true, evoCost: 6, evoTo: "Weezing", color: "#72243E" }
  ),
  Weezing: Pkmn(110, ["Poison"], 1, [12, 4, 2], "Defense",
    "Levitate - Immune to Ground attacks",
    [S("Sludge Bomb", "Line(2)(1)", 4, { statusChance: "poison", statusChanceValue: 0.5, skillRaw: "Sludge Bomb (Line(2)(1): Deal 4 damage, 50% chance Poison for 4 turns)" })],
    { evoFrom: "Koffing", color: "#72243E" }
  ),

  // --- GROUND/ROCK LINE (RHYHORN) ---
  Rhyhorn: Pkmn(111, ["Ground", "Rock"], 2, [11, 3, 2], "Defense",
    "Rock Head - Immune to recoil damage",
    [S("Rock Blast", "Line(2)(1)", 2, { skillRaw: "Rock Blast (Line(2)(1): Deal 2 damage, hits 2-5 times)" })],
    { base: true, evoCost: 7, evoTo: "Rhydon", color: "#854F0B" }
  ),
  Rhydon: Pkmn(112, ["Ground", "Rock"], 2, [15, 5, 2], "Defense",
    "Solid Rock - Reduce super effective damage by 1",
    [S("Earthquake", "AoE(1)", 5, { skillRaw: "Earthquake (AoE(1): Deal 5 damage to adjacent enemies)" })],
    { evoFrom: "Rhyhorn", color: "#854F0B" }
  ),

  // --- NORMAL (CHANSEY) ---
  Chansey: Pkmn(113, ["Normal"], 3, [25, 2, 1], "Support",
    "Natural Cure - At turn end, cure any status",
    [S("Soft-Boiled", "Ally", 0, { skillHeal: 5, skillHealTarget: "ally", skillCost: 2, skillRaw: "Soft-Boiled (Ally: Heal 5 HP, costs 2 Energy)" })],
    { base: true, evoCost: 10, evoTo: "Blissey", color: "#5F5E5A" }
  ),

  // --- GRASS (TANGELA) ---
  Tangela: Pkmn(114, ["Grass"], 2, [10, 3, 2], "Defense",
    "Regenerator - At turn end, heal 1 HP",
    [S("Vine Whip", "Line(2)(1)", 3, { skillRaw: "Vine Whip (Line(2)(1): Deal 3 damage, 30% chance reduce target Move by 1)" })],
    { base: true, evoCost: 8, evoTo: "Tangrowth", color: "#3B6D11" }
  ),

  // --- NORMAL (KANGASKHAN) ---
  Kangaskhan: Pkmn(115, ["Normal"], 3, [14, 4, 1], "Attack",
    "Early Bird - Sleep duration reduced by 1 turn",
    [S("Dizzy Punch", "Line(1)(3)", 4, { statusChance: "confuse", statusChanceValue: 0.3, skillRaw: "Dizzy Punch (Line(1): Deal 4 damage, 30% chance Confuse for 3 turns)" })],
    { base: true, color: "#5F5E5A" }
  ),

  // --- WATER LINE (HORSEA) ---
  Horsea: Pkmn(116, ["Water"], 1, [7, 3, 1], "Support",
    "Sniper - Critical hits deal +1 damage, crit on 16+",
    [S("Water Gun", "Line(2)(1)", 2)],
    { base: true, evoCost: 6, evoTo: "Seadra", color: "#185FA5" }
  ),
  Seadra: Pkmn(117, ["Water"], 1, [10, 4, 1], "Support",
    "Poison Point - When hit by melee, 30% chance Poison attacker for 4 turns",
    [S("Dragon Breath", "Line(2)(1)", 3, { statusChance: "paralysis", statusChanceValue: 0.5, skillRaw: "Dragon Breath (Line(2)(1): Deal 3 damage, 50% chance Paralyze for 3 turns)" })],
    { evoFrom: "Horsea", evoCost: 8, evoTo: "Kingdra", color: "#185FA5" }
  ),

  // --- WATER LINE (GOLDEEN) ---
  Goldeen: Pkmn(118, ["Water"], 1, [8, 3, 0], "Attack",
    "Water Veil - Immune to Burn",
    [S("Horn Attack", "Line(1)(3)", 3)],
    { base: true, evoCost: 6, evoTo: "Seaking", color: "#185FA5" }
  ),
  Seaking: Pkmn(119, ["Water"], 1, [12, 4, 1], "Attack",
    "Water Veil - Immune to Burn",
    [S("Waterfall", "Line(2)(1)", 4, { skillRaw: "Waterfall (Line(2)(1): Deal 4 damage, 30% chance Flinch)" })],
    { evoFrom: "Goldeen", color: "#185FA5" }
  ),

  // --- WATER LINE (STARYU) ---
  Staryu: Pkmn(120, ["Water"], 1, [7, 3, 1], "Support",
    "Natural Cure - At turn end, cure any status",
    [S("Swift", "Line(3)(1)", 3, { skillRaw: "Swift (Line(3)(1): Deal 3 damage, cannot miss)" })],
    { base: true, evoCost: 6, evoTo: "Starmie", color: "#185FA5" }
  ),
  Starmie: Pkmn(121, ["Water", "Psychic"], 1, [11, 4, 2], "Support",
    "Illuminate - Enemies within range 2 cannot hide",
    [S("Psychic", "Line(3)(1)", 4, { skillEffect: { target: "enemy", stat: "def", amount: -1, duration: 2 }, skillRaw: "Psychic (Line(3)(1): Deal 4 damage, lower target Def by 1)" })],
    { evoFrom: "Staryu", color: "#185FA5" }
  ),

  // --- PSYCHIC/FAIRY (MR. MIME) ---
  "Mr. Mime": Pkmn(122, ["Psychic", "Fairy"], 2, [9, 3, 2], "Support",
    "Soundproof - Immune to sound-based skills",
    [S("Barrier", "Self", 0, { skillEffect: { target: "self", stat: "def", amount: 2, duration: 3 }, skillRaw: "Barrier (Self: Gain +2 Def for 3 turns)" })],
    { base: true, color: "#993556" }
  ),

  // --- BUG/FLYING (SCYTHER) ---
  Scyther: Pkmn(123, ["Bug", "Flying"], 2, [10, 4, 1], "Attack",
    "Technician - Skills with base damage ≤2 deal +1 damage",
    [S("X-Scissor", "Line(2)(1)", 4, { skillRaw: "X-Scissor (Line(2)(1): Deal 4 damage, crit on 14+)" })],
    { base: true, evoCost: 8, evoTo: "Scizor", color: "#6D8E1E" }
  ),

  // --- ICE/PSYCHIC (JYNX) ---
  Jynx: Pkmn(124, ["Ice", "Psychic"], 2, [11, 4, 1], "Support",
    "Dry Skin - Take +1 damage from Fire, during Rain Dance heal 1 HP/turn",
    [S("Lovely Kiss", "Line(1)(3)", 0, { statusChance: "sleep", statusChanceValue: 0.9, skillRaw: "Lovely Kiss (Line(1): 90% chance Sleep for 2 turns)" })],
    { base: true, color: "#0C447C" }
  ),

  // --- ELECTRIC (ELECTABUZZ) ---
  Electabuzz: Pkmn(125, ["Electric"], 2, [10, 4, 1], "Attack",
    "Static - When hit by melee, 30% chance Paralyze attacker for 3 turns",
    [S("Thunder Punch", "Line(1)(3)", 4, { statusChance: "paralysis", statusChanceValue: 0.4, skillRaw: "Thunder Punch (Line(1): Deal 4 damage, 40% chance Paralyze for 3 turns)" })],
    { base: true, evoCost: 8, evoTo: "Electivire", color: "#BA7517" }
  ),

  // --- FIRE (MAGMAR) ---
  Magmar: Pkmn(126, ["Fire"], 2, [10, 4, 1], "Attack",
    "Flame Body - When hit by melee, 30% chance Burn attacker for 3 turns",
    [S("Fire Punch", "Line(1)(3)", 4, { statusChance: "burn", statusChanceValue: 0.4, skillRaw: "Fire Punch (Line(1): Deal 4 damage, 40% chance Burn for 3 turns)" })],
    { base: true, evoCost: 8, evoTo: "Magmortar", color: "#D85A30" }
  ),

  // --- BUG (PINSIR) ---
  Pinsir: Pkmn(127, ["Bug"], 2, [11, 5, 1], "Attack",
    "Hyper Cutter - Immune to Atk reduction",
    [S("Guillotine", "Line(1)(3)", 6, { skillCost: 3, skillRaw: "Guillotine (Line(1): Deal 6 damage, costs 3 Energy, 50% accuracy)" })],
    { base: true, color: "#6D8E1E" }
  ),

  // --- NORMAL (TAUROS) ---
  Tauros: Pkmn(128, ["Normal"], 2, [12, 4, 1], "Attack",
    "Intimidate - Adjacent enemies get -1 Atk",
    [S("Take Down", "Line(2)(1)", 5, { selfDamage: 1, skillRaw: "Take Down (Line(2)(1): Deal 5 damage, user takes 1 recoil)" })],
    { base: true, color: "#5F5E5A" }
  ),

  // --- WATER LINE (MAGIKARP) ---
  Magikarp: Pkmn(129, ["Water"], 1, [5, 1, 1], "Support",
    "Swift Swim - During Rain Dance, Move costs -1 Energy",
    [S("Splash", "Self", 0, { skillEffect: { target: "self", stat: "atk", amount: 0, duration: 1 }, skillRaw: "Splash (Self: Do nothing, gain +1 EXP)" })],
    { base: true, evoCost: 20, evoTo: "Gyarados", color: "#185FA5" }
  ),
  Gyarados: Pkmn(130, ["Water", "Flying"], 1, [14, 5, 1], "Attack",
    "Intimidate - Adjacent enemies get -1 Atk",
    [S("Hydro Pump", "Line(3)(1)", 5, { skillCost: 3, skillRaw: "Hydro Pump (Line(3)(1): Deal 5 damage, costs 3 Energy)" })],
    { evoFrom: "Magikarp", color: "#185FA5" }
  ),

  // --- WATER/ICE (LAPRAS) ---
  Lapras: Pkmn(131, ["Water", "Ice"], 3, [16, 4, 2], "Support",
    "Water Absorb - Heal 3 HP when hit by Water attack",
    [S("Ice Beam", "Line(3)(1)", 4, { statusChance: "freeze", statusChanceValue: 0.4, skillRaw: "Ice Beam (Line(3)(1): Deal 4 damage, 40% chance Freeze for 2 turns)" })],
    { base: true, color: "#185FA5" }
  ),

  // --- NORMAL (DITTO) ---
  Ditto: Pkmn(132, ["Normal"], 2, [8, 2, 1], "Support",
    "Imposter - Transform into Pokemon across, copying stats/skills for 3 turns",
    [S("Transform", "Self", 0, { skillEffect: { target: "self", stat: "atk", amount: 0, duration: 1 }, skillRaw: "Transform (Self: Copy target's stats (HP fixed at 8) / skills / ability for 3 turns)" })],
    { base: true, color: "#5F5E5A" }
  ),

  // --- NORMAL LINE (EEVEE) ---
  Eevee: Pkmn(133, ["Normal"], 3, [9, 3, 1], "Support",
    "Adaptability - Atk +1",
    [S("Take Down", "Line(1)(3)", 3, { selfDamage: 1, skillRaw: "Take Down (Line(1): Deal 3 damage but self damage 1)" })],
    { base: true, evoCost: 6, evoTo: "Vaporeon", color: "#5F5E5A" }
  ),
  Vaporeon: Pkmn(134, ["Water"], 3, [12, 3, 2], "Defense",
    "Water Absorb - Heal 3 HP when hit by Water attack",
    [S("Aurora Beam", "Line(3)(1)", 3, { skillEffect: { target: "enemy", stat: "atk", amount: -1, duration: 2 }, skillRaw: "Aurora Beam (Line(3)(1): Deal 3 damage, 30% chance lower target Atk by 1)" })],
    { evoFrom: "Eevee", color: "#185FA5" }
  ),
  Jolteon: Pkmn(135, ["Electric"], 3, [12, 4, 1], "Attack",
    "Volt Absorb - Heal 3 HP when hit by Electric attack",
    [S("Thunder", "Line(3)(1)", 4, { statusChance: "paralysis", statusChanceValue: 0.5, skillRaw: "Thunder (Line(3)(1): Deal 4 damage, 50% chance Paralyze for 3 turns)" })],
    { evoFrom: "Eevee", color: "#BA7517" }
  ),
  Flareon: Pkmn(136, ["Fire"], 3, [10, 5, 1], "Attack",
    "Flash Fire - Immune to Fire, after Fire hit deal +1 Fire damage",
    [S("Fire Blast", "Line(3)(1)", 5, { statusChance: "burn", statusChanceValue: 0.5, skillRaw: "Fire Blast (Line(3)(1): Deal 5 damage, 50% chance Burn for 3 turns)" })],
    { evoFrom: "Eevee", color: "#D85A30" }
  ),

  // --- NORMAL (PORYGON) ---
  Porygon: Pkmn(137, ["Normal"], 2, [10, 3, 1], "Support",
    "Trace - Copy ability of last enemy that attacked this Pokemon",
    [S("Tri Attack", "Line(2)(1)", 3, { statusChance: "burn", statusChanceValue: 0.2, skillRaw: "Tri Attack (Line(2)(1): Deal 3 damage, 20% chance Burn/Paralyze/Freeze for 3 turns)" })],
    { base: true, evoCost: 8, evoTo: "Porygon2", color: "#5F5E5A" }
  ),

  // --- ROCK/WATER LINE (OMANYTE) ---
  Omanyte: Pkmn(138, ["Rock", "Water"], 2, [8, 3, 2], "Defense",
    "Shell Armor - Immune to critical hits",
    [S("Water Gun", "Line(2)(1)", 2)],
    { base: true, evoCost: 7, evoTo: "Omastar", color: "#5F5A5A" }
  ),
  Omastar: Pkmn(139, ["Rock", "Water"], 2, [12, 4, 3], "Defense",
    "Swift Swim - During Rain Dance, Move costs -1 Energy",
    [S("Ancient Power", "Line(2)(1)", 3, { skillRaw: "Ancient Power (Line(2)(1): Deal 3 damage, 20% chance raise all stats by 1)" })],
    { evoFrom: "Omanyte", color: "#5F5A5A" }
  ),

  // --- ROCK/WATER LINE (KABUTO) ---
  Kabuto: Pkmn(140, ["Rock", "Water"], 2, [8, 3, 2], "Defense",
    "Battle Armor - Immune to critical hits",
    [S("Scratch", "Line(1)(3)", 2)],
    { base: true, evoCost: 7, evoTo: "Kabutops", color: "#5F5A5A" }
  ),
  Kabutops: Pkmn(141, ["Rock", "Water"], 2, [11, 5, 1], "Attack",
    "Swift Swim - During Rain Dance, Move costs -1 Energy",
    [S("Slash", "Line(2)(1)", 4, { skillRaw: "Slash (Line(2)(1): Deal 4 damage, crit on 14+)" })],
    { evoFrom: "Kabuto", color: "#5F5A5A" }
  ),

  // --- ROCK/FLYING (AERODACTYL) ---
  Aerodactyl: Pkmn(142, ["Rock", "Flying"], 3, [12, 5, 1], "Attack",
    "Unnerve - Opponent's consumable Berries cannot be used",
    [S("Wing Attack", "Line(3)(1)", 4)],
    { base: true, hatchCost: 18, color: "#5F5A5A" }
  ),

  // --- NORMAL (SNORLAX) ---
  Snorlax: Pkmn(143, ["Normal"], 4, [20, 4, 2], "Defense",
    "Thick Fat - Take -1 damage from Fire and Ice",
    [S("Body Slam", "Line(1)(3)", 4, { statusChance: "paralysis", statusChanceValue: 0.4, skillRaw: "Body Slam (Line(1): Deal 4 damage, 40% chance Paralyze for 3 turns)" })],
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
    { base: true, legendary: true, hatchCost: 30, color: "#0C447C" }
  ),

  Zapdos: Pkmn(145, ["Electric", "Flying"], 5, [13, 5, 1], "Attack",
    "Static - When hit or hitting enemies, 30% chance to inflict Paralysis for 3 turns",
    [
      S("Thunder", "Target = [2(Cone(3)(3))]", 5, { skillRaw: "Thunder (Cone(3): Target 2, Deal 5 Damage)" }),
      S("Zap Cannon", "Line(4)(3)", 6, { skillRaw: "Zap Cannon (Line(4): Deal 6 Damage)" }),
      S("Charge", "Self", 0, { skillEffect: { target: "self", stat: "atk", amount: 2, duration: 2 }, skillRaw: "Charge (Self: Next attack damage +2)" })
    ],
    { base: true, legendary: true, hatchCost: 30, color: "#BA7517" }
  ),

  Moltres: Pkmn(146, ["Fire", "Flying"], 5, [13, 5, 1], "Attack",
    "Flame Body - When hit or hitting enemies, 30% chance to inflict Burn for 3 turns",
    [
      S("Heat Wave", "Cone(3)(3)", 5, { skillRaw: "Heat Wave (Cone(3): Deal 5 damage)" }),
      S("Overheat", "AoE(2)", 6, { selfDamage: 4, cooldown: 2, skillEffect: { target: "self", stat: "atk", amount: 0, duration: 1 }, skillRaw: "Overheat (AoE(2): Deal 6 Damage but self damage for 4. Cooldown 2 turns)" }),
      S("Sky Attack", "Self", 6, { cooldown: 3, skillEffect: { target: "self", stat: "atk", amount: 0, duration: 1 }, skillRaw: "Sky Attack (Self: Unit becomes Untargetable. Cannot move till next turn. Next turn: select a target, unit moves in front of it and deals 6 Damage. Both user and target cannot act that turn. Cooldown 3 turns)" })
    ],
    { base: true, legendary: true, hatchCost: 30, color: "#D85A30" }
  ),

  // =========================================================================
  // DRAGON LINE
  // =========================================================================
  Dratini: Pkmn(147, ["Dragon"], 3, [8, 3, 0], "Attack",
    "Shed Skin - At turn end, 30% chance cure any status",
    [S("Twister", "Line(2)(1)", 3, { skillRaw: "Twister (Line(2)(1): Deal 3 damage, 30% chance Flinch)" })],
    { base: true, evoCost: 7, evoTo: "Dragonair", color: "#5B7DD1" }
  ),
  Dragonair: Pkmn(148, ["Dragon"], 3, [11, 4, 1], "Attack",
    "Marvel Scale - When afflicted with status, gain +2 Def",
    [S("Dragon Breath", "Line(2)(1)", 3, { statusChance: "paralysis", statusChanceValue: 0.5, skillRaw: "Dragon Breath (Line(2)(1): Deal 3 damage, 50% chance Paralyze for 3 turns)" })],
    { evoFrom: "Dratini", evoCost: 8, evoTo: "Dragonite", color: "#5B7DD1" }
  ),
  Dragonite: Pkmn(149, ["Dragon", "Flying"], 3, [14, 5, 1], "Attack",
    "Multiscale - When at full HP, reduce incoming damage by 3",
    [S("Outrage", "Self", 5, { skillRaw: "Outrage (Self: For 3 turns, hit the nearest unit for 5 damage each turn — targets both ally and enemies)" })],
    { evoFrom: "Dragonair", evoCost: 9, color: "#5B7DD1" }
  ),

  // =========================================================================
  // LEGENDARY PSYCHICS
  // =========================================================================
  Mewtwo: Pkmn(150, ["Psychic"], 5, [16, 6, 1], "Attack",
    "Pressure - Once a turn, opponent's attack costs 1 more energy (cannot stack)",
    [
      S("Psychic", "Target = [2(Cone(3)(1))]", 6, { skillRaw: "Psychic (Cone(3)(1): Choose 2 targets in range and deal 6 damage)" }),
      S("Recover", "Self", 0, { skillHeal: 4, skillHealTarget: "self", cooldown: 2, skillRaw: "Recover (Self: Recover 4 HP. Cooldown 2 turns)" }),
      S("Psycutter", "Line(3)(1)", 5, { skillRaw: "Psycutter (Line(3)(1): Deal 5 damage, ignoring target's Defense)" })
    ],
    { base: true, legendary: true, hatchCost: 30, color: "#993556" }
  ),

  Mew: Pkmn(151, ["Psychic"], 5, [14, 4, 2], "Support",
    "Synchronize - When inflicted with status, inflict same status on attacker with +1 turn duration",
    [
      S("Transform", "Self", 0, { skillEffect: { target: "self", stat: "atk", amount: 0, duration: 1 }, skillRaw: "Transform (Self: Copy target's Stats (HP fixed at 14), Ability and Skills for 3 turns. Cannot transform into other Legendaries. Multi-skill Pokemon will overwrite Skill 2 and 3 as well)" }),
      S("Life Dew", "AllAllies", 0, { limit: 1, skillRaw: "Life Dew (Heal all allies regardless of range for 2 HP — Once per game)" }),
      S("Reflect Type", "Line(1)(3)", 0, { skillRaw: "Reflect Type (Target one enemy Pokemon and change the user's type to match it)" })
    ],
    { base: true, legendary: true, hatchCost: 30, color: "#993556" }
  ),

  // --- GENERATION 2 (JOHTO) STARTERS ---
  Chikorita: Pkmn(152, ["Grass"], 3, [7, 2, 0], "Support",
    "Overgrow - When HP ≤ 50%, deal +1 damage with Grass skills",
    [S("Razor Leaf", "Line(3)(1)", 2)],
    { base: true, evoCost: 6, evoTo: "Bayleef", color: "#4CAF50" }
  ),
  Bayleef: Pkmn(153, ["Grass"], 3, [10, 3, 1], "Support",
    "Overgrow - When HP ≤ 50%, deal +1 damage with Grass skills",
    [S("Poison Powder", "AoE(1)", 1, { statusChance: "poison", statusChanceValue: 0.5, skillRaw: "Poison Powder (AoE(1): 50% chance to Poison)" })],
    { evoFrom: "Chikorita", evoCost: 8, evoTo: "Meganium", color: "#4CAF50" }
  ),
  Meganium: Pkmn(154, ["Grass"], 3, [14, 4, 1], "Support",
    "Leaf Guard - This Pokemon is immune to all status conditions",
    [S("Synthesis", "Self", 0, { skillHeal: 3, skillHealTarget: "self" })],
    { evoFrom: "Bayleef", color: "#4CAF50" }
  ),
  Cyndaquil: Pkmn(155, ["Fire"], 3, [6, 2, 0], "Attack",
    "Blaze - When HP ≤ 50%, deal +1 damage with Fire skills",
    [S("Ember", "Line(2)(1)", 2, { statusChance: "burn", statusChanceValue: 0.3 })],
    { base: true, evoCost: 6, evoTo: "Quilava", color: "#FF5722" }
  ),
  Quilava: Pkmn(156, ["Fire"], 3, [9, 3, 0], "Attack",
    "Blaze - When HP ≤ 50%, deal +1 damage with Fire skills",
    [S("Flame Wheel", "Line(3)(1)", 3)],
    { evoFrom: "Cyndaquil", evoCost: 8, evoTo: "Typhlosion", color: "#FF5722" }
  ),
  Typhlosion: Pkmn(157, ["Fire"], 3, [13, 4, 0], "Attack",
    "Flash Fire - Receives 0 damage from Fire skill attacks",
    [S("Flamethrower", "Cone(2)", 4, { statusChance: "burn", statusChanceValue: 0.3 })],
    { evoFrom: "Quilava", color: "#FF5722" }
  ),
  Totodile: Pkmn(158, ["Water"], 3, [8, 2, 2], "Defense",
    "Torrent - When HP ≤ 50%, deal +1 damage with Water skills",
    [S("Water Gun", "Line(2)(1)", 2)],
    { base: true, evoCost: 6, evoTo: "Croconaw", color: "#2196F3" }
  ),
  Croconaw: Pkmn(159, ["Water"], 3, [11, 4, 2], "Defense",
    "Torrent - When HP ≤ 50%, deal +1 damage with Water skills",
    [S("Bite", "Line(1)(1)", 3)],
    { evoFrom: "Totodile", evoCost: 8, evoTo: "Feraligatr", color: "#2196F3" }
  ),
  Feraligatr: Pkmn(160, ["Water"], 3, [15, 5, 2], "Defense",
    "Sheer Force - Takes 1 less damage from enemies with lower current HP",
    [S("Hydro Pump", "Line(4)(1)", 5)],
    { evoFrom: "Croconaw", color: "#2196F3" }
  ),

  // --- EARLY ROUTE ENCOUNTERS ---
  Sentret: Pkmn(161, ["Normal"], 1, [5, 1, 0], "Support",
    "Competitive - Gain +2 Atk when stats are lowered by enemies",
    [S("Quick Attack", "Line(2)(1)", 1)],
    { base: true, evoCost: 7, evoTo: "Furret", color: "#8A7B66" }
  ),
  Furret: Pkmn(162, ["Normal"], 1, [11, 3, 0], "Support",
    "Competitive - Gain +2 Atk when stats are lowered by enemies",
    [S("Baton Pass", "AoE(3)", 0, { skillRaw: "Baton Pass (Swap position with in-range ally)" })],
    { evoFrom: "Sentret", color: "#8A7B66" }
  ),
  Hoothoot: Pkmn(163, ["Normal", "Flying"], 1, [6, 1, 0], "Support",
    "Insomnia - This Pokemon is immune to Sleep status effect",
    [S("Hypnosis", "Line(2)(1)", 0, { statusChance: "sleep", statusChanceValue: 1.0 })],
    { base: true, evoCost: 7, evoTo: "Noctowl", color: "#54433E" }
  ),
  Noctowl: Pkmn(164, ["Normal", "Flying"], 1, [12, 3, 1], "Support",
    "Insomnia - This Pokemon is immune to Sleep status effect",
    [S("Air Slash", "Line(3)(1)", 3)],
    { evoFrom: "Hoothoot", color: "#54433E" }
  ),
  Ledyba: Pkmn(165, ["Bug", "Flying"], 1, [5, 1, 0], "Support",
    "Competitive - Gain +2 Atk when stats are lowered by enemies",
    [S("Supersonic", "Line(2)(1)", 0, { statusChance: "confuse", statusChanceValue: 0.5 })],
    { base: true, evoCost: 6, evoTo: "Ledian", color: "#B83B3B" }
  ),
  Ledian: Pkmn(166, ["Bug", "Flying"], 1, [9, 3, 1], "Support",
    "Competitive - Gain +2 Atk when stats are lowered by enemies",
    [S("Comet Punch", "Line(2)(1)", 3)],
    { evoFrom: "Ledyba", color: "#B83B3B" }
  ),
  Spinarak: Pkmn(167, ["Bug", "Poison"], 1, [5, 2, 0], "Assassin",
    "Poison Point - 30% chance to poison opponent when hit by melee",
    [S("Poison Sting", "Line(2)(1)", 1, { statusChance: "poison", statusChanceValue: 0.5 })],
    { base: true, evoCost: 6, evoTo: "Ariados", color: "#4E7C41" }
  ),
  Ariados: Pkmn(168, ["Bug", "Poison"], 1, [11, 4, 0], "Assassin",
    "Poison Point - 30% chance to poison opponent when hit by melee",
    [S("Shadow Sneak", "Line(3)(1)", 3)],
    { evoFrom: "Spinarak", color: "#4E7C41" }
  ),

  // --- NEW GOLBAT EVOLUTION & LANTURN LINE ---
  Crobat: Pkmn(169, ["Poison", "Flying"], 2, [13, 4, 0], "Assassin",
    "Inner Focus - This Pokemon is immune to Confuse status effect",
    [S("Cross Poison", "Line(3)(1)", 4, { statusChance: "poison", statusChanceValue: 0.3 })],
    { evoFrom: "Golbat", color: "#7A4F8A" }
  ),
  Chinchou: Pkmn(170, ["Water", "Electric"], 2, [8, 1, 0], "Support",
    "Volt Absorb - Heals 3 HP when hit by Electric skills/attacks",
    [S("Thunder Wave", "Line(2)(1)", 0, { statusChance: "paralyze", statusChanceValue: 1.0 })],
    { base: true, evoCost: 7, evoTo: "Lanturn", color: "#3B6E8C" }
  ),
  Lanturn: Pkmn(171, ["Water", "Electric"], 2, [14, 3, 1], "Support",
    "Volt Absorb - Heals 3 HP when hit by Electric skills/attacks",
    [S("Discharge", "AoE(1)", 2, { statusChance: "paralyze", statusChanceValue: 0.3 })],
    { evoFrom: "Chinchou", color: "#3B6E8C" }
  ),

  // --- NEW BABY POKEMON ---
  Pichu: Pkmn(172, ["Electric"], 2, [4, 1, 0], "Support",
    "Static - 30% chance to paralyze opponent when hit by melee",
    [S("Charm", "Line(2)(1)", 0, { skillEffect: { target: "enemy", stat: "atk", amount: -1, duration: 2 } })],
    { base: true, evoCost: 5, evoTo: "Pikachu", color: "#F7D038" }
  ),
  Cleffa: Pkmn(173, ["Fairy"], 2, [5, 1, 0], "Support",
    "Cute Charm - 30% chance to confuse opponent when hit by melee",
    [S("Sweet Kiss", "Line(1)(1)", 0, { statusChance: "confuse", statusChanceValue: 1.0 })],
    { base: true, evoCost: 5, evoTo: "Clefairy", color: "#E0A5C2" }
  ),
  Igglybuff: Pkmn(174, ["Normal", "Fairy"], 2, [6, 1, 0], "Support",
    "Competitive - Gain +2 Atk when stats are lowered by enemies",
    [S("Sing", "Line(2)(1)", 0, { statusChance: "sleep", statusChanceValue: 0.8 })],
    { base: true, evoCost: 5, evoTo: "Jigglypuff", color: "#E8B2C4" }
  ),
  Togepi: Pkmn(175, ["Fairy"], 2, [5, 1, 0], "Support",
    "Serene Grace - Increases likelihood of status effects and prolongs status durations",
    [S("Metronome", "Line(3)(1)", 2, { skillRaw: "Metronome (Casts random skill)" })],
    { base: true, evoCost: 6, evoTo: "Togetic", color: "#C6C6C6" }
  ),
  Togetic: Pkmn(176, ["Fairy", "Flying"], 2, [9, 2, 1], "Support",
    "Serene Grace - Increases likelihood of status effects and prolongs status durations",
    [S("Fairy Wind", "Cone(2)", 3)],
    { evoFrom: "Togepi", color: "#C6C6C6" }
  ),
  Natu: Pkmn(177, ["Psychic", "Flying"], 2, [6, 2, 0], "Attack",
    "Synchronize - When inflicted with status, inflict same status on attacker with +1 turn duration",
    [S("Peck", "Line(1)(1)", 2)],
    { base: true, evoCost: 7, evoTo: "Xatu", color: "#6A9B4E" }
  ),
  Xatu: Pkmn(178, ["Psychic", "Flying"], 2, [11, 4, 0], "Attack",
    "Synchronize - When inflicted with status, inflict same status on attacker with +1 turn duration",
    [S("Psychic", "Line(3)(1)", 4)],
    { evoFrom: "Natu", color: "#6A9B4E" }
  ),

  // --- MAREEP AND BELLOSSOM LINE ---
  Mareep: Pkmn(179, ["Electric"], 3, [6, 2, 0], "Support",
    "Static - 30% chance to paralyze opponent when hit by melee",
    [S("Thundershock", "Line(2)(1)", 2, { statusChance: "paralyze", statusChanceValue: 0.3 })],
    { base: true, evoCost: 6, evoTo: "Flaaffy", color: "#ECE45E" }
  ),
  Flaaffy: Pkmn(180, ["Electric"], 3, [9, 3, 0], "Support",
    "Static - 30% chance to paralyze opponent when hit by melee",
    [S("Electro Ball", "Line(3)(1)", 3)],
    { evoFrom: "Mareep", evoCost: 8, evoTo: "Ampharos", color: "#ECE45E" }
  ),
  Ampharos: Pkmn(181, ["Electric"], 3, [14, 5, 1], "Support",
    "Static - 30% chance to paralyze opponent when hit by melee",
    [S("Thunderbolt", "Line(4)(1)", 5, { statusChance: "paralyze", statusChanceValue: 0.5 })],
    { evoFrom: "Flaaffy", color: "#ECE45E" }
  ),
  Bellossom: Pkmn(182, ["Grass"], 2, [13, 4, 1], "Support",
    "Chlorophyll - Under Sunny day weather, movement energy cost is reduced",
    [S("Magical Leaf", "Line(3)(1)", 3, { skillRaw: "Magical Leaf (Line(3)(1): Undodgeable 3 damage)" })],
    { evoFrom: "Gloom", color: "#4CAF50" }
  ),
  Marill: Pkmn(183, ["Water", "Fairy"], 2, [8, 1, 2], "Defense",
    "Huge Power - High damage ceiling on basic and skill attacks",
    [S("Bubblebeam", "Line(2)(1)", 2)],
    { base: true, evoCost: 7, evoTo: "Azumarill", color: "#3B7EB8" }
  ),
  Azumarill: Pkmn(184, ["Water", "Fairy"], 2, [14, 2, 2], "Defense",
    "Huge Power - High damage ceiling on basic and skill attacks",
    [S("Play Rough", "Line(1)(1)", 4)],
    { evoFrom: "Marill", color: "#3B7EB8" }
  ),
  Sudowoodo: Pkmn(185, ["Rock"], 3, [13, 4, 2], "Defense",
    "Rock Head - Basic damage received equal to 1 is completely negated",
    [S("Rock Slide", "Cone(2)", 3)],
    { base: true, color: "#8B6B3F" }
  ),
  Politoed: Pkmn(186, ["Water"], 3, [14, 3, 1], "Support",
    "Drizzle - Automatically deploys Rain weather at start of wave",
    [
      S("Bounce", "Line(3)(1)", 3, { statusChance: "paralyze", statusChanceValue: 0.3 }),
      S("Rain Dance", "Self", 0, { skillCost: 2, skillRaw: "Rain Dance (Self): Summons Rain weather on the zone for 5 turns." })
    ],
    { evoFrom: "Poliwhirl", color: "#2B8C3E" }
  ),

  // --- FOREST FLORA AND FAUNA ---
  Hoppip: Pkmn(187, ["Grass", "Flying"], 1, [5, 1, 0], "Support",
    "Chlorophyll - Under Sunny day weather, movement energy cost is reduced",
    [S("Stun Spore", "Line(2)(1)", 0, { statusChance: "paralyze", statusChanceValue: 0.7 })],
    { base: true, evoCost: 5, evoTo: "Skiploom", color: "#D19CA4" }
  ),
  Skiploom: Pkmn(188, ["Grass", "Flying"], 1, [8, 2, 0], "Support",
    "Chlorophyll - Under Sunny day weather, movement energy cost is reduced",
    [S("Sleep Powder", "Line(2)(1)", 0, { statusChance: "sleep", statusChanceValue: 0.6 })],
    { evoFrom: "Hoppip", evoCost: 7, evoTo: "Jumpluff", color: "#9CC16D" }
  ),
  Jumpluff: Pkmn(189, ["Grass", "Flying"], 1, [12, 3, 1], "Support",
    "Chlorophyll - Under Sunny day weather, movement energy cost is reduced",
    [S("Giga Drain", "Line(2)(1)", 3, { skillHeal: 2, skillHealTarget: "self" })],
    { evoFrom: "Skiploom", color: "#6EB0D1" }
  ),
  Aipom: Pkmn(190, ["Normal"], 2, [7, 3, 0], "Attack",
    "Run Away - Immune to trapping effects and cannot be blocked by obstacles",
    [S("Double Hit", "Line(1)(1)", 4)],
    { base: true, color: "#7F4E96" }
  ),
  Sunkern: Pkmn(191, ["Grass"], 1, [5, 1, 0], "Support",
    "Solar Power - In Sunny weather, gains +2 Atk but takes 1 damage per action",
    [S("Mega Drain", "Line(2)(1)", 2, { skillHeal: 1, skillHealTarget: "self" })],
    { base: true, evoCost: 6, evoTo: "Sunflora", color: "#FFE04A" }
  ),
  Sunflora: Pkmn(192, ["Grass"], 1, [11, 2, 0], "Support",
    "Solar Power - In Sunny weather, gains +2 Atk but takes 1 damage per action",
    [S("Solarbeam", "Line(4)(1)", 5, { skillCost: 3 })],
    { evoFrom: "Sunkern", color: "#FFE04A" }
  ),
  Yanma: Pkmn(193, ["Bug", "Flying"], 2, [8, 3, 0], "Assassin",
    "Speed Boost - Gain +1 Atk for 1 turn after moving",
    [S("Air Cutter", "Cone(2)", 2)],
    { base: true, color: "#BF3B3B" }
  ),
  Wooper: Pkmn(194, ["Water", "Ground"], 2, [7, 2, 1], "Defense",
    "Water Absorb - Heals 3 HP when hit by Water type skills",
    [S("Mud Shot", "Line(2)(1)", 2, { skillEffect: { target: "enemy", stat: "def", amount: -1, duration: 2 } })],
    { base: true, evoCost: 7, evoTo: "Quagsire", color: "#6DB8C7" }
  ),
  Quagsire: Pkmn(195, ["Water", "Ground"], 2, [13, 4, 1], "Defense",
    "Water Absorb - Heals 3 HP when hit by Water type skills",
    [S("Earthquake", "AoE(2)", 4)],
    { evoFrom: "Wooper", color: "#6DB8C7" }
  ),

  // --- ESPEON, UMBREON & MID STAGE GROUPS ---
  Espeon: Pkmn(196, ["Psychic"], 2, [12, 4, 0], "Attack",
    "Synchronize - When inflicted with status, inflict same status on attacker with +1 turn duration",
    [S("Psychic", "Line(3)(1)", 4)],
    { evoFrom: "Eevee", color: "#DC9AE5" }
  ),
  Umbreon: Pkmn(197, ["Dark"], 2, [14, 2, 3], "Defense",
    "Synchronize - When inflicted with status, inflict same status on attacker with +1 turn duration",
    [S("Foul Play", "Line(1)(1)", 3, { skillRaw: "Foul Play: Deal 3 damage + 1 per opponent's Atk modifier" })],
    { evoFrom: "Eevee", color: "#2B2B2B" }
  ),
  Murkrow: Pkmn(198, ["Dark", "Flying"], 2, [8, 4, 0], "Assassin",
    "Super Luck - High chance of dealing critical hit damage on basic attacks",
    [S("Sucker Punch", "Line(2)(1)", 3, { skillRaw: "Sucker Punch: Deal +2 damage if hit last turn" })],
    { base: true, color: "#1D233F" }
  ),
  Slowking: Pkmn(199, ["Water", "Psychic"], 2, [14, 3, 2], "Defense",
    "Regenerator - Recover 1 HP automatically at the end of the turn",
    [S("Scald", "Line(3)(1)", 3, { statusChance: "burn", statusChanceValue: 0.3 })],
    { evoFrom: "Slowpoke", color: "#E05562" }
  ),
  Misdreavus: Pkmn(200, ["Ghost"], 2, [8, 3, 1], "Support",
    "Levitate - Immune to Ground type skills and hazards on board",
    [S("Confuse Ray", "Line(2)(1)", 0, { statusChance: "confuse", statusChanceValue: 1.0 })],
    { base: true, color: "#4FA090" }
  ),
  Unown: Pkmn(201, ["Psychic"], 1, [3, 2, 0], "Support",
    "Adaptive - Changes its type bonus dynamically to match the majority type of allies",
    [S("Hidden Power", "Line(3)(1)", 2, { skillRaw: "Hidden Power: Boost adjacent allies' Atk by 1 for 2 turns" })],
    { base: true, color: "#3B3F54" }
  ),
  Wobbuffet: Pkmn(202, ["Psychic"], 3, [19, 1, 1], "Defense",
    "Shadow Tag - Locks adjacent enemies, preventing them from moving away",
    [S("Counter", "Line(1)(1)", 1, { skillRaw: "Counter (Row/Col 1): Reflect 1.5x incoming damage received last turn" })],
    { base: true, color: "#2B55E2" }
  ),
  Girafarig: Pkmn(203, ["Normal", "Psychic"], 2, [11, 4, 0], "Attack",
    "Inner Focus - This Pokemon is immune to Confuse status effect",
    [S("Zen Headbutt", "Line(2)(1)", 3)],
    { base: true, color: "#DAB856" }
  ),
  Pineco: Pkmn(204, ["Bug"], 2, [7, 2, 2], "Defense",
    "Sturdy - Prevents instant knockouts from high health",
    [S("Spikes", "AoE(1)", 0, { skillRaw: "Spikes: Set spikes hazard on 1 tile to damage visitors" })],
    { base: true, evoCost: 7, evoTo: "Forretress", color: "#6A7C5F" }
  ),
  Forretress: Pkmn(205, ["Bug", "Steel"], 2, [10, 0, 3], "Defense",
    "Sturdy - Prevents instant knockouts from high health",
    [S("Explosion", "AoE(2)", 10, { skillRaw: "Explosion: Deal massive 10 damage to area, then knock out user" })],
    { evoFrom: "Pineco", color: "#6A7C5F" }
  ),
  Dunsparce: Pkmn(206, ["Normal"], 2, [12, 3, 1], "Support",
    "Serene Grace - Increases likelihood of status effects and prolongs status durations",
    [S("Glare", "Line(2)(1)", 0, { statusChance: "paralyze", statusChanceValue: 0.6 })],
    { base: true, color: "#D6CA6C" }
  ),
  Gligar: Pkmn(207, ["Ground", "Flying"], 2, [9, 3, 2], "Defense",
    "Hyper Cutter - This Pokemon's Attack stat cannot be lowered by opponents",
    [S("Poison Sting", "Line(1)(1)", 2, { statusChance: "poison", statusChanceValue: 0.3 })],
    { base: true, color: "#BF7290" }
  ),
  Steelix: Pkmn(208, ["Steel", "Ground"], 3, [14, 2, 3], "Defense",
    "Rock Head - Basic damage received equal to 1 is completely negated",
    [S("Stealth Rock", "AoE(2)", 0, { skillRaw: "Stealth Rock: Set hazards in AoE(2). Enters deal 2 damage" })],
    { evoFrom: "Onix", color: "#8E9199" }
  ),
  Snubbull: Pkmn(209, ["Fairy"], 2, [8, 3, 0], "Attack",
    "Intimidate - Reduces the Attack stat of all adjacent enemies by 1",
    [S("Bite", "Line(1)(1)", 3)],
    { base: true, evoCost: 7, evoTo: "Granbull", color: "#EC8B9E" }
  ),
  Granbull: Pkmn(210, ["Fairy"], 2, [13, 5, 0], "Attack",
    "Intimidate - Reduces the Attack stat of all adjacent enemies by 1",
    [S("Play Rough", "Line(2)(1)", 4)],
    { evoFrom: "Snubbull", color: "#EC8B9E" }
  ),

  // --- ASSASSINS AND BUG/FIGHTING CHAMPS ---
  Qwilfish: Pkmn(211, ["Water", "Poison"], 2, [11, 4, 0], "Assassin",
    "Poison Point - 30% chance to poison opponent when attacking or hit by melee",
    [S("Pin Missile", "Line(3)(1)", 3)],
    { base: true, color: "#5F8E72" }
  ),
  Scizor: Pkmn(212, ["Bug", "Steel"], 3, [14, 6, 0], "Assassin",
    "Technician - Multiplies the efficacy of rapid strike low-power attacks",
    [S("Bullet Punch", "Line(1)(1)", 4, { skillRaw: "Bullet Punch (Strike first/Melee): Deal 4 damage" })],
    { evoFrom: "Scyther", color: "#C62828" }
  ),
  Shuckle: Pkmn(213, ["Bug", "Rock"], 3, [5, 1, 5], "Defense",
    "Gluttony - Berries consumed restore double health. Extremely defensive shell",
    [S("Toxic", "Line(2)(1)", 0, { statusChance: "poison", statusChanceValue: 1.0, skillRaw: "Toxic: Inflict permanent Toxic" })],
    { base: true, color: "#D1C246" }
  ),
  Heracross: Pkmn(214, ["Bug", "Fighting"], 3, [14, 5, 0], "Attack",
    "Guts - Gain Atk boost +2 when affected by status conditions",
    [S("Megahorn", "Line(2)(1)", 5, { skillRaw: "Megahorn: Deals 5 damage and pushes target back 1 block" })],
    { base: true, color: "#2B5E7C" }
  ),
  Sneasel: Pkmn(215, ["Dark", "Ice"], 3, [8, 4, 0], "Assassin",
    "Inner Focus - This Pokemon is immune to Confuse status effect",
    [S("Ice Shard", "Line(3)(1)", 3, { skillRaw: "Ice Shard: Strike first from up to 3 tiles row/col" })],
    { base: true, color: "#2F4256" }
  ),

  // --- GENERAL JOHTO CONTINUATION ---
  Teddiursa: Pkmn(216, ["Normal"], 2, [8, 3, 0], "Attack",
    "Guts - Gain Atk boost +2 when affected by status conditions",
    [S("Slash", "Line(1)(1)", 3)],
    { base: true, evoCost: 7, evoTo: "Ursaring", color: "#AC8C6B" }
  ),
  Ursaring: Pkmn(217, ["Normal"], 2, [14, 5, 0], "Attack",
    "Guts - Gain Atk boost +2 when affected by status conditions",
    [S("Hammer Arm", "Line(1)(1)", 5)],
    { evoFrom: "Teddiursa", color: "#AC8C6B" }
  ),
  Slugma: Pkmn(218, ["Fire"], 2, [6, 2, 1], "Defense",
    "Flame Body - 30% chance to burn opponent when hit by melee",
    [S("Smog", "Line(2)(1)", 2, { statusChance: "poison", statusChanceValue: 0.3 })],
    { base: true, evoCost: 7, evoTo: "Magcargo", color: "#EC5E4E" }
  ),
  Magcargo: Pkmn(219, ["Fire", "Rock"], 2, [11, 3, 2], "Defense",
    "Flame Body - 30% chance to burn opponent when hit by melee",
    [S("Rock Slide", "Cone(2)", 3)],
    { evoFrom: "Slugma", color: "#EC5E4E" }
  ),
  Swinub: Pkmn(220, ["Ice", "Ground"], 2, [7, 2, 0], "Attack",
    "Oblivious - Completely immune to Intimidate attack penalties and Taunt",
    [S("Powder Snow", "Line(2)(1)", 2)],
    { base: true, evoCost: 6, evoTo: "Piloswine", color: "#A8937D" }
  ),
  Piloswine: Pkmn(221, ["Ice", "Ground"], 2, [12, 4, 0], "Attack",
    "Oblivious - Completely immune to Intimidate penalties",
    [S("Ice Crash", "Line(2)(1)", 4)],
    { evoFrom: "Swinub", color: "#A8937D" }
  ),
  Corsola: Pkmn(222, ["Water", "Rock"], 2, [11, 2, 2], "Defense",
    "Regenerator - Recover 1 HP automatically at the end of the turn",
    [S("Recover", "Self", 0, { skillHeal: 3, skillHealTarget: "self" })],
    { base: true, color: "#E08CA4" }
  ),
  Remoraid: Pkmn(223, ["Water"], 2, [6, 3, 0], "Attack",
    "Sniper - Increases standard critical hit frequency and potency",
    [S("Water Gun", "Line(3)(1)", 2)],
    { base: true, evoCost: 7, evoTo: "Octillery", color: "#BDD1CF" }
  ),
  Octillery: Pkmn(224, ["Water"], 2, [12, 5, 0], "Attack",
    "Sniper - Increases standard critical hit frequency and potency",
    [S("Octazooka", "Line(3)(1)", 4, { statusChance: "confuse", statusChanceValue: 0.2 })],
    { evoFrom: "Remoraid", color: "#BDD1CF" }
  ),
  Delibird: Pkmn(225, ["Ice", "Flying"], 2, [9, 2, 0], "Support",
    "Vital Spirit - Immune to Sleep status effect",
    [S("Present", "Line(2)(1)", 2, { skillRaw: "Present: Deal 2 damage or heal target 2 HP (Random 50/50)" })],
    { base: true, color: "#EC5555" }
  ),
  Mantine: Pkmn(226, ["Water", "Flying"], 3, [13, 2, 3], "Defense",
    "Water Absorb - Heals 3 HP when hit by Water type skills",
    [S("Air Slash", "Line(3)(1)", 3)],
    { base: true, color: "#556EAD" }
  ),
  Skarmory: Pkmn(227, ["Steel", "Flying"], 3, [12, 4, 3], "Defense",
    "Weak Armor - When hit, permanently Atk +1 and Def -1",
    [S("Steel Wing", "Line(2)(1)", 3)],
    { base: true, color: "#8E9DAE" }
  ),
  Houndour: Pkmn(228, ["Dark", "Fire"], 3, [7, 3, 0], "Attack",
    "Flame Body - 30% chance to burn opponent when hit by melee",
    [S("Ember", "Line(2)(1)", 2, { statusChance: "burn", statusChanceValue: 0.3 })],
    { base: true, evoCost: 7, evoTo: "Houndoom", color: "#3B3B3B" }
  ),
  Houndoom: Pkmn(229, ["Dark", "Fire"], 3, [13, 5, 0], "Attack",
    "Flame Body - 30% chance to burn opponent when hit by melee",
    [S("Flamethrower", "Line(3)(1)", 4, { statusChance: "burn", statusChanceValue: 0.3 })],
    { evoFrom: "Houndour", color: "#3B3B3B" }
  ),
  Kingdra: Pkmn(230, ["Water", "Dragon"], 3, [14, 4, 1], "Support",
    "Swift Swim - Under Rain weather conditions, movement energy cost is reduced",
    [S("Dragon Pulse", "Line(3)(1)", 4)],
    { evoFrom: "Seadra", color: "#2B8CBF" }
  ),

  // --- LATE GAME / CHANCE TIER ---
  Phanpy: Pkmn(231, ["Ground"], 2, [7, 2, 1], "Defense",
    "Pickup - 30% chance to pick up 1 Gold when hitting or hit",
    [S("Rollout", "Line(2)(1)", 2)],
    { base: true, evoCost: 7, evoTo: "Donphan", color: "#7BA8BF" }
  ),
  Donphan: Pkmn(232, ["Ground"], 2, [12, 4, 2], "Defense",
    "Pickup - 30% chance to pick up 1 Gold when hitting or hit",
    [S("Earthquake", "AoE(2)", 4)],
    { evoFrom: "Phanpy", color: "#7BA8BF" }
  ),
  Porygon2: Pkmn(233, ["Normal"], 2, [13, 2, 1], "Defense",
    "Download - Gain bonus Def when facing heavily physical opponents",
    [S("Foul Play", "Line(1)(1)", 3)],
    { evoFrom: "Porygon", color: "#EC5E62" }
  ),
  Stantler: Pkmn(234, ["Normal"], 2, [12, 4, 0], "Attack",
    "Intimidate - Reduces the Attack stat of all adjacent enemies by 1",
    [S("Stomp", "Line(1)(1)", 3)],
    { base: true, color: "#AC8E5B" }
  ),
  Smeargle: Pkmn(235, ["Normal"], 1, [10, 1, 0], "Support",
    "Moody - End of turn boosts/lowers stats randomly",
    [S("Sketch", "Line(3)(1)", 1, { skillRaw: "Sketch: Trigger a copy of a matching opponent's skill" })],
    { base: true, color: "#D6C6AC" }
  ),
  Tyrogue: Pkmn(236, ["Fighting"], 2, [6, 2, 0], "Attack",
    "Guts - Gain Atk boost +2 when affected by status conditions",
    [S("Rock Smash", "Line(1)(1)", 2)],
    { base: true, evoCost: 7, evoTo: "Hitmontop", color: "#C4614A" }
  ),
  Hitmontop: Pkmn(237, ["Fighting"], 2, [12, 4, 0], "Attack",
    "Intimidate - Reduces the Attack stat of all adjacent enemies by 1",
    [S("Triple Kick", "Line(1)(1)", 4, { skillRaw: "Triple Kick: Multi-strike 4 damage" })],
    { evoFrom: "Tyrogue", color: "#C4614A" }
  ),
  Smoochum: Pkmn(238, ["Ice", "Psychic"], 2, [5, 1, 0], "Support",
    "Forewarn - Alerter on high incoming threats",
    [S("Sweet Kiss", "Line(1)(1)", 0, { statusChance: "confuse", statusChanceValue: 0.8 })],
    { base: true, evoCost: 6, evoTo: "Jynx", color: "#E59CA8" }
  ),
  Elekid: Pkmn(239, ["Electric"], 2, [6, 2, 0], "Attack",
    "Static - 30% chance to paralyze opponent when hit by melee",
    [S("Thunder Punch", "Line(1)(1)", 3, { statusChance: "paralyze", statusChanceValue: 0.3 })],
    { base: true, evoCost: 6, evoTo: "Electabuzz", color: "#EADB4E" }
  ),
  Magby: Pkmn(240, ["Fire"], 2, [6, 2, 0], "Attack",
    "Flame Body - 30% chance to burn opponent when hit by melee",
    [S("Fire Punch", "Line(1)(1)", 3, { statusChance: "burn", statusChanceValue: 0.3 })],
    { base: true, evoCost: 6, evoTo: "Magmar", color: "#EC623B" }
  ),
  Miltank: Pkmn(241, ["Normal"], 3, [14, 4, 2], "Defense",
    "Thick Fat - Immunity to Burn and Freeze status triggers",
    [S("Milk Drink", "AoE(1)", 0, { skillHeal: 3, skillHealTarget: "ally" })],
    { base: true, color: "#ECA8BD" }
  ),
  Blissey: Pkmn(242, ["Normal"], 3, [25, 2, 1], "Support",
    "Natural Cure - Heal status conditions at turn end",
    [S("Soft-Boiled", "AoE(1)", 0, { skillHeal: 4, skillHealTarget: "ally" })],
    { evoFrom: "Chansey", color: "#FFC6D1" }
  ),

  // --- LEGENDARIES & BEASTS ---
  Raikou: Pkmn(243, ["Electric"], 5, [14, 5, 0], "Attack",
    "Pressure - Heavy status strain forces opposing skills to cost +1 Energy",
    [
      S("Thunder", "Line(2)(1)", 5, { statusChance: "paralyze", statusChanceValue: 0.5, skillCost: 3 }),
      S("Extreme Speed", "Line(3)(1,2,3,4)", 4, { skillCost: 2 }),
      S("Roar", "AoE(2)", 0, { skillCost: 2 })
    ],
    { base: true, legendary: true, hatchCost: 30, color: "#F2D338" }
  ),
  Entei: Pkmn(244, ["Fire"], 5, [15, 5, 1], "Support",
    "Pressure - Heavy status strain forces opposing skills to cost +1 Energy",
    [
      S("Sacred Fire", "Cone(2)", 4, { statusChance: "burn", statusChanceValue: 0.5, skillCost: 3 }),
      S("Will o wisp", "Cone(2)", 0, { statusChance: "burn", statusChanceValue: 1.0, skillCost: 2 }),
      S("Roar", "AoE(2)", 0, { skillCost: 2 })
    ],
    { base: true, legendary: true, hatchCost: 30, color: "#D15E38" }
  ),
  Suicune: Pkmn(245, ["Water"], 5, [15, 4, 3], "Defense",
    "Pressure - Heavy status strain forces opposing skills to cost +1 Energy",
    [
      S("Hydro Pump", "Line(4)(1)", 5, { skillCost: 4 }),
      S("Mist", "AoE(2)", 0, { skillCost: 2, skillHealTarget: "ally" }),
      S("Roar", "AoE(2)", 0, { skillCost: 2 })
    ],
    { base: true, legendary: true, hatchCost: 30, color: "#6AA8E2" }
  ),
  Larvitar: Pkmn(246, ["Rock", "Ground"], 3, [7, 2, 0], "Attack",
    "Guts - Gain Atk boost +2 when affected by status conditions",
    [S("Bite", "Line(1)(1)", 2)],
    { base: true, evoCost: 7, evoTo: "Pupitar", color: "#7A8C5F" }
  ),
  Pupitar: Pkmn(247, ["Rock", "Ground"], 3, [11, 3, 2], "Attack",
    "Shed Skin - 30% chance to heal status conditions at start of turn",
    [S("Rock Slide", "Cone(2)", 3)],
    { evoFrom: "Larvitar", evoCost: 9, evoTo: "Tyranitar", color: "#7A8C5F" }
  ),
  Tyranitar: Pkmn(248, ["Rock", "Dark"], 3, [16, 6, 1], "Attack",
    "Sand Stream - Sets Sandstorm weather conditions at start of active fight",
    [
      S("Stone Edge", "Line(2)(1)", 5),
      S("Sandstorm", "Self", 0, { skillCost: 2, skillRaw: "Sandstorm (Self): Summons Sandstorm weather on the zone for 5 turns." })
    ],
    { evoFrom: "Pupitar", color: "#4E544A" }
  ),
  Lugia: Pkmn(249, ["Psychic", "Flying"], 5, [16, 4, 3], "Defense",
    "Multiscale - Take 3 less damage from all source hits if at maximum HP",
    [
      S("Aeroblast", "Cone(2)", 5, { skillCost: 4 }),
      S("Tidal bell", "AoE(1)", 0, { skillCost: 3, skillHealTarget: "ally" }),
      S("Recover", "Self", 0, { skillCost: 3, skillHeal: 8, skillHealTarget: "self" })
    ],
    { base: true, legendary: true, hatchCost: 30, color: "#9CBEE0" }
  ),
  "Ho-Oh": Pkmn(250, ["Fire", "Flying"], 5, [16, 5, 1], "Support",
    "Regenerator - Recover 1 HP automatically at the end of the turn",
    [
      S("Sacred Fire", "Cone(2)", 5, { statusChance: "burn", statusChanceValue: 0.5 }),
      S("Sunny Day", "Self", 0, { skillCost: 2 }),
      S("Clear Bell", "AoE(1)(2)", 0, { skillCost: 3 })
    ],
    { base: true, legendary: true, hatchCost: 30, color: "#EC5E3B" }
  ),
  Celebi: Pkmn(251, ["Psychic", "Grass"], 5, [14, 5, 1], "Support",
    "Natural Cure - Heal status conditions at turn end for itself and adjacent allies",
    [
      S("Leaf Storm", "Cone(3)", 5, { skillCost: 2 }),
      S("Aromatherapy", "AoE(2)(2)", 0, { skillCost: 2, skillHeal: 3, skillHealTarget: "ally", aoe: 2 }),
      S("Future Sight", "Line(3)(1)", 0, { skillCost: 2 })
    ],
    { base: true, legendary: true, hatchCost: 30, color: "#8CD16D" }
  ),
  "Clear Bell": Pkmn(501, ["Normal"], 1, [3, 0, 0], "Support",
    "Clear Bell - Restores 1 HP to adjacent allies in a 3x3 area at the end of each turn.",
    [],
    { base: true, color: "#ffd700" }
  ),
  "Tidal Bell": Pkmn(502, ["Normal"], 1, [3, 0, 0], "Defense",
    "Tidal Bell - Reduces incoming damage to adjacent allies (except Lugia) by 2 per hit, consuming 1 charge.",
    [],
    { base: true, color: "#00bcd4" }
  ),
  "Tidal bell": Pkmn(502, ["Normal"], 1, [3, 0, 0], "Defense",
    "Tidal Bell - Reduces incoming damage to adjacent allies (except Lugia) by 2 per hit, consuming 1 charge.",
    [],
    { base: true, color: "#00bcd4" }
  ),
};

// Post-process DB to scale evolution costs for a longer 20-turn game duration
Object.keys(DB).forEach(key => {
  const entry = DB[key];
  if (entry && entry.evoCost !== null && typeof entry.evoCost === "number") {
    if (entry.evoCost <= 4) {
      entry.evoCost = entry.evoCost * 2.5; // caterpillars: 3->8, 4->10
    } else if (entry.evoCost <= 7) {
      entry.evoCost = Math.round(entry.evoCost * 2.0); // e.g. first stage starters: 6->12, nidorans: 5->10
    } else {
      entry.evoCost = Math.round(entry.evoCost * 1.8); // e.g. second stage: 9->16, 8->14, magikarp 20->36
    }
  }

  // Post-process DB to set Skill 1 (index 0) damage and description dynamically to match parent ATK
  if (entry && entry.skills && entry.skills.length > 0) {
    const s0 = entry.skills[0];
    if (s0.skillDmg !== undefined && typeof s0.skillDmg === "number" && s0.skillDmg > 0 && s0.skillName !== "Sonic Boom") {
      const oldDmg = s0.skillDmg;
      const newDmg = s0.statusChance ? Math.max(0, entry.atk - 1) : entry.atk;
      s0.skillDmg = newDmg;
      entry.skillDmg = newDmg;
      
      if (s0.skillRaw) {
        let raw = s0.skillRaw;
        raw = raw.replace(new RegExp(`Deals ${oldDmg} damage`, 'i'), `Deals ${newDmg} damage`);
        raw = raw.replace(new RegExp(`Deal ${oldDmg} damage`, 'i'), `Deal ${newDmg} damage`);
        raw = raw.replace(new RegExp(`Deals ${oldDmg} Damage`, 'i'), `Deals ${newDmg} Damage`);
        raw = raw.replace(new RegExp(`Deal ${oldDmg} Damage`, 'i'), `Deal ${newDmg} Damage`);
        raw = raw.replace(new RegExp(`drains ${oldDmg} HP`, 'i'), `drains ${newDmg} HP`);
        raw = raw.replace(new RegExp(`drain ${oldDmg} HP`, 'i'), `drain ${newDmg} HP`);
        raw = raw.replace(new RegExp(`draining ${oldDmg} HP`, 'i'), `draining ${newDmg} HP`);
        raw = raw.replace(new RegExp(`Deals ${oldDmg} Ice damage`, 'i'), `Deals ${newDmg} Ice damage`);
        raw = raw.replace(new RegExp(`Deal ${oldDmg} Ice damage`, 'i'), `Deal ${newDmg} Ice damage`);
        raw = raw.replace(new RegExp(`hit for ${oldDmg} damage`, 'i'), `hit for ${newDmg} damage`);
        raw = raw.replace(new RegExp(`\\(${oldDmg}\\)`, 'g'), `(${newDmg})`);
        s0.skillRaw = raw;
        entry.skillRaw = raw;
      }
    }
  }
});

// Load customized Pokémon database from localStorage if present
try {
  if (typeof window !== "undefined" && window.localStorage) {
    const savedCustomDB = window.localStorage.getItem("pokemon_chess_custom_db");
    if (savedCustomDB) {
      const parsed = JSON.parse(savedCustomDB);
      Object.keys(parsed).forEach(key => {
        if (DB[key]) {
          DB[key] = { ...DB[key], ...parsed[key] };
        }
      });
    }
  }
} catch (err) {
  console.error("Failed to load customized Pokémon DB:", err);
}

