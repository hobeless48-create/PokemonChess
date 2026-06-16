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

export const DB_GEN3_6: { [species: string]: PokemonDBEntry } = {
  "Treecko": Pkmn(252, ["Grass"], 3, [6, 2, 0], "Atk",
    "Overgrow - When HP ≤ 50%, deal +1 damage with Grass skills",
    [
      S("Pound", "Line(1)(1)", 1, {"skillRaw":"Pound (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Grovyle","color":"#3B6D11"}
  ),

  "Grovyle": Pkmn(253, ["Grass"], 3, [9, 4, 0], "Atk",
    "Overgrow - When HP ≤ 50%, deal +1 damage with Grass skills",
    [
      S("Leaf Blade", "Line(2)(1)", 2, {"skillRaw":"Leaf Blade (Target = [1(Line(2)(1))], Damage: 2, High crit chance)"})
    ], {"evoFrom":"Treecko","evoCost":8,"evoTo":"Sceptile","color":"#3B6D11"}
  ),

  "Sceptile": Pkmn(254, ["Grass"], 3, [13, 5, 0], "Atk",
    "Unburden - If this pokemon does not have any held item , move energy reduce by 1 , (once per turn",
    [
      S("Giga Drain", "Line(3)(1)", 2, {"skillHeal":1,"skillHealTarget":"self","skillRaw":"Giga Drain (Target = [1(Line(3)(1))], Damage: 2, Heal user 1 HP)"})
    ], {"evoFrom":"Grovyle","color":"#3B6D11"}
  ),

  "Torchic": Pkmn(255, ["Fire"], 3, [6, 2, 0], "Atk",
    "Blaze - When HP ≤ 50%, deal +1 damage with Fire skills",
    [
      S("Ember", "Line(2)(1)", 1, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Ember (Target = [1(Line(2)(1))], Damage: 1, 30% chance to inflict Burn for 3 turns)"})
    ], {"evoCost":6,"evoTo":"Combusken","color":"#D85A30"}
  ),

  "Combusken": Pkmn(256, ["Fire", "Fighting"], 3, [9, 4, 0], "Atk",
    "Blaze - When HP ≤ 50%, deal +1 damage with Fire skills",
    [
      S("Double Kick", "Line(1)(1)", 1, {"skillRaw":"Double Kick (Target = [2(Line(1)(1))], Damage: 1 per hit)"})
    ], {"evoFrom":"Torchic","evoCost":8,"evoTo":"Blaziken","color":"#D85A30"}
  ),

  "Blaziken": Pkmn(257, ["Fire", "Fighting"], 3, [14, 5, 0], "Atk",
    "Speed Boost - If this pokemon does not have any held item , move energy reduce by 1 , (twice per turn",
    [
      S("Blaze Kick", "Line(2)(1)", 2, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Blaze Kick (Target = [1(Line(2)(1))], Damage: 2, Inflict Burn for 3 turns)"})
    ], {"evoFrom":"Combusken","color":"#D85A30"}
  ),

  "Mudkip": Pkmn(258, ["Water"], 3, [8, 2, 2], "Def",
    "Torrent - When HP ≤ 50%, deal +1 damage with Water skills",
    [
      S("Water Gun", "Line(2)(1)", 1, {"skillRaw":"Water Gun (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Marshtomp","color":"#185FA5"}
  ),

  "Marshtomp": Pkmn(259, ["Water", "Ground"], 3, [11, 3, 2], "Def",
    "Torrent - When HP ≤ 50%, deal +1 damage with Water skills",
    [
      S("Mud Shot", "Line(2)(1)", 1, {"skillRaw":"Mud Shot (Target = [1(Line(2)(1))], Damage: 1, Slows enemy)"})
    ], {"evoFrom":"Mudkip","evoCost":8,"evoTo":"Swampert","color":"#185FA5"}
  ),

  "Swampert": Pkmn(260, ["Water", "Ground"], 3, [15, 3, 2], "Def",
    "Torrent - When HP ≤ 50%, deal +1 damage with Water skills",
    [
      S("Earthquake", "AoE(2)", 2, {"skillRaw":"Earthquake (Target = [1(AoE(2))], Damage: 2)"})
    ], {"evoFrom":"Marshtomp","color":"#185FA5"}
  ),

  "Poochyena": Pkmn(261, ["Dark"], 1, [5, 2, 0], "Atk",
    "Run Away - Immune to trapping/movement locks",
    [
      S("Bite", "Line(1)(1)", 1, {"skillRaw":"Bite (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Mightyena","color":"#5F5E5A"}
  ),

  "Mightyena": Pkmn(262, ["Dark"], 1, [11, 4, 0], "Atk",
    "Intimidate - Adjacent enemies -1 Atk for 2 turns",
    [
      S("Crunch", "Line(2)(1)", 2, {"skillRaw":"Crunch (Target = [1(Line(2)(1))], Damage: 2)"})
    ], {"evoFrom":"Poochyena","color":"#5F5E5A"}
  ),

  "Zigzagoon": Pkmn(263, ["Normal"], 1, [5, 1, 0], "Support",
    "Pickup - Chance to obtain useful energy/items during battle",
    [
      S("Tackle", "Line(1)(1)", 0, {"skillRaw":"Tackle (Target = [1(Line(1)(1))], Damage: 0)"})
    ], {"evoCost":6,"evoTo":"Linoone","color":"#5F5E5A"}
  ),

  "Linoone": Pkmn(264, ["Normal"], 1, [11, 3, 0], "Support",
    "Pickup - Chance to obtain useful energy/items during battle",
    [
      S("Slash", "Line(2)(1)", 1, {"skillRaw":"Slash (Target = [1(Line(2)(1))], Damage: 1, High crit chance)"})
    ], {"evoFrom":"Zigzagoon","color":"#5F5E5A"}
  ),

  "Wurmple": Pkmn(265, ["Bug"], 1, [5, 1, 0], "Support",
    "Shield Dust - Blocks additional status effects from enemy skills",
    [
      S("String Shot", "Line(2)(1)", 0, {"skillRaw":"String Shot (Target = [1(Line(2)(1))], Slows enemy movement)"})
    ], {"evoCost":4,"evoTo":"Silcoon","color":"#6D8E1E"}
  ),

  "Silcoon": Pkmn(266, ["Bug"], 1, [8, 1, 1], "Def",
    "Shed Skin - 30% chance to cure status at turn end",
    [
      S("Harden", "AoE(0)", 0, {"skillRaw":"Harden (Target = [1(AoE(0))], Def +1 for 2 turns)"})
    ], {"evoFrom":"Wurmple","evoCost":5,"evoTo":"Beautifly","color":"#6D8E1E"}
  ),

  "Beautifly": Pkmn(267, ["Bug", "Flying"], 1, [11, 4, 0], "Atk",
    "Swarm - When HP ≤ 50%, Bug skills deal +1 damage",
    [
      S("Air Cutter", "Cone(2)", 2, {"skillRaw":"Air Cutter (Target = [1(Cone(2))], Damage: 2, High crit chance)"})
    ], {"evoFrom":"Silcoon","color":"#6D8E1E"}
  ),

  "Cascoon": Pkmn(268, ["Bug"], 1, [8, 1, 1], "Def",
    "Shed Skin - 30% chance to cure status at turn end",
    [
      S("Iron Defense", "AoE(0)", 0, {"skillRaw":"Iron Defense (Target = [1(AoE(0))], Def +1 for 3 turns)"})
    ], {"evoFrom":"Wurmple","evoCost":5,"evoTo":"Dustox","color":"#6D8E1E"}
  ),

  "Dustox": Pkmn(269, ["Bug", "Poison"], 1, [11, 2, 1], "Support",
    "Shield Dust - Blocks additional status effects from enemy skills",
    [
      S("Toxic Powder", "AoE(1)", 0, {"statusChance":"poison","statusChanceValue":0.3,"skillRaw":"Toxic Powder (Target = [1(AoE(1))], Inflict Poison for 4 turns)"})
    ], {"evoFrom":"Cascoon","color":"#72243E"}
  ),

  "Lotad": Pkmn(270, ["Water", "Grass"], 2, [5, 1, 0], "Support",
    "Swift Swim - Move costs -1 energy during Rain weather",
    [
      S("Absorb", "Line(2)(1)", 0, {"skillHeal":1,"skillHealTarget":"self","skillRaw":"Absorb (Target = [1(Line(2)(1))], Damage: 0, Heal user 1 HP)"})
    ], {"evoCost":5,"evoTo":"Lombre","color":"#3B6D11"}
  ),

  "Lombre": Pkmn(271, ["Water", "Grass"], 2, [9, 2, 0], "Support",
    "Swift Swim - Move costs -1 energy during Rain weather",
    [
      S("Mega Drain", "Line(2)(1)", 1, {"skillHeal":1,"skillHealTarget":"self","skillRaw":"Mega Drain (Target = [1(Line(2)(1))], Damage: 1, Heal user 1 HP)"})
    ], {"evoFrom":"Lotad","evoCost":8,"evoTo":"Ludicolo","color":"#3B6D11"}
  ),

  "Ludicolo": Pkmn(272, ["Water", "Grass"], 2, [13, 4, 1], "Support",
    "Swift Swim - Move costs -1 energy during Rain weather",
    [
      S("Hydro Pump", "Line(4)(1)", 2, {"skillRaw":"Hydro Pump (Target = [1(Line(4)(1))], Damage: 2)"})
    ], {"evoFrom":"Lombre","color":"#3B6D11"}
  ),

  "Seedot": Pkmn(273, ["Grass"], 2, [6, 1, 1], "Def",
    "Chlorophyll - Move costs -1 energy during Sun weather",
    [
      S("Bide", "AoE(0)", 0, {"skillRaw":"Bide (Target = [1(AoE(0))], Endure attacks then unleash damage)"})
    ], {"evoCost":5,"evoTo":"Nuzleaf","color":"#3B6D11"}
  ),

  "Nuzleaf": Pkmn(274, ["Grass", "Dark"], 2, [10, 3, 0], "Atk",
    "Chlorophyll - Move costs -1 energy during Sun weather",
    [
      S("Razor Leaf", "Line(3)(1)", 1, {"skillRaw":"Razor Leaf (Target = [1(Line(3)(1))], Damage: 1)"})
    ], {"evoFrom":"Seedot","evoCost":8,"evoTo":"Shiftry","color":"#3B6D11"}
  ),

  "Shiftry": Pkmn(275, ["Grass", "Dark"], 2, [14, 5, 0], "Atk",
    "Chlorophyll - Move costs -1 energy during Sun weather",
    [
      S("Hurricane", "Cone(2)", 2, {"statusChance":"confuse","statusChanceValue":0.3,"skillRaw":"Hurricane (Target = [1(Cone(2))], Damage: 2, May confuse target)"})
    ], {"evoFrom":"Nuzleaf","color":"#3B6D11"}
  ),

  "Taillow": Pkmn(276, ["Normal", "Flying"], 1, [5, 2, 0], "Atk",
    "Guts - Deal +1 skill damage when inflicted with status conditions",
    [
      S("Quick Attack", "Line(2)(1)", 1, {"skillRaw":"Quick Attack (Target = [1(Line(2)(1))], Damage: 1, Strike first)"})
    ], {"evoCost":6,"evoTo":"Swellow","color":"#5F5E5A"}
  ),

  "Swellow": Pkmn(277, ["Normal", "Flying"], 1, [11, 4, 0], "Atk",
    "Guts - Deal +1 skill damage when inflicted with status conditions",
    [
      S("Brave Bird", "Line(3)(1)", 3, {"selfDamage":1,"skillRaw":"Brave Bird (Target = [1(Line(3)(1))], Damage: 3, User takes 1 recoil damage)"})
    ], {"evoFrom":"Taillow","color":"#5F5E5A"}
  ),

  "Wingull": Pkmn(278, ["Water", "Flying"], 1, [5, 1, 0], "Support",
    "Keen Eye - Accuracy cannot be lowered by enemies",
    [
      S("Supersonic", "Line(2)(1)", 0, {"statusChance":"confuse","statusChanceValue":0.3,"skillRaw":"Supersonic (Target = [1(Line(2)(1))], Inflict Confuse for 3 turns)"})
    ], {"evoCost":6,"evoTo":"Pelipper","color":"#185FA5"}
  ),

  "Pelipper": Pkmn(279, ["Water", "Flying"], 1, [11, 3, 2], "Def",
    "Drizzle - Changes weather to Rain for 5 turns upon deploying",
    [
      S("Scald", "Line(3)(1)", 1, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Scald (Target = [1(Line(3)(1))], Damage: 1, 30% chance to Burn)"})
    ], {"evoFrom":"Wingull","color":"#185FA5"}
  ),

  "Ralts": Pkmn(280, ["Psychic", "Fairy"], 3, [5, 1, 0], "Support",
    "Synchronize - Passes status condition back to the inflicter",
    [
      S("Confusion", "Line(2)(1)", 0, {"skillRaw":"Confusion (Target = [1(Line(2)(1))], Damage: 0)"})
    ], {"evoCost":6,"evoTo":"Kirlia","color":"#C96BAA"}
  ),

  "Kirlia": Pkmn(281, ["Psychic", "Fairy"], 3, [8, 2, 0], "Support",
    "Synchronize - Passes status condition back to the inflicter",
    [
      S("Psychic", "Line(3)(1)", 1, {"skillRaw":"Psychic (Target = [1(Line(3)(1))], Damage: 1)"})
    ], {"evoFrom":"Ralts","evoCost":9,"evoTo":"Gardevoir","color":"#C96BAA"}
  ),

  "Gardevoir": Pkmn(282, ["Psychic", "Fairy"], 3, [13, 4, 1], "Support",
    "Synchronize - Passes status condition back to the inflicter",
    [
      S("Moonblast", "Line(4)(1)", 2, {"skillRaw":"Moonblast (Target = [1(Line(4)(1))], Damage: 2, Lowers enemy Atk)"})
    ], {"evoFrom":"Kirlia","color":"#C96BAA"}
  ),

  "Surskit": Pkmn(283, ["Bug", "Water"], 1, [5, 1, 0], "Support",
    "Swift Swim - Move costs -1 energy during Rain weather",
    [
      S("Bubble", "Line(2)(1)", 0, {"skillRaw":"Bubble (Target = [1(Line(2)(1))], Damage: 0, Slows enemy)"})
    ], {"evoCost":6,"evoTo":"Masquerain","color":"#185FA5"}
  ),

  "Masquerain": Pkmn(284, ["Bug", "Flying"], 1, [11, 3, 0], "Atk",
    "Intimidate - Adjacent enemies -1 Atk for 2 turns",
    [
      S("Bug Buzz", "Cone(2)", 1, {"skillRaw":"Bug Buzz (Target = [1(Cone(2))], Damage: 1)"})
    ], {"evoFrom":"Surskit","color":"#6D8E1E"}
  ),

  "Shroomish": Pkmn(285, ["Grass"], 2, [7, 1, 0], "Support",
    "Poison Point - 30% chance to poison melee attackers",
    [
      S("Spore", "Line(1)(1)", 0, {"statusChance":"sleep","statusChanceValue":0.5,"skillRaw":"Spore (Target = [1(Line(1)(1))], Inflict Sleep for 2 turns, 100% chance)"})
    ], {"evoCost":6,"evoTo":"Breloom","color":"#3B6D11"}
  ),

  "Breloom": Pkmn(286, ["Grass", "Fighting"], 2, [12, 5, 0], "Atk",
    "Technician - Skills with 1 base damage deal +1 extra damage",
    [
      S("Mach Punch", "Line(1)(1)", 2, {"skillRaw":"Mach Punch (Target = [1(Line(1)(1))], Damage: 2, Strike first)"})
    ], {"evoFrom":"Shroomish","color":"#3B6D11"}
  ),

  "Slakoth": Pkmn(287, ["Normal"], 3, [8, 2, 0], "Support",
    "Truant - Can only act every other turn",
    [
      S("Slack Off", "AoE(0)", 0, {"skillHeal":3,"skillHealTarget":"self","skillRaw":"Slack Off (Target = [1(AoE(0))], Override skillDmg: 0, Heal user 3 HP)"})
    ], {"evoCost":5,"evoTo":"Vigoroth","color":"#5F5E5A"}
  ),

  "Vigoroth": Pkmn(288, ["Normal"], 3, [12, 4, 0], "Atk",
    "Vital Spirit - Immune to Sleep condition",
    [
      S("Fury Swipes", "Line(1)(1)", 1, {"skillRaw":"Fury Swipes (Target = [3(Line(1)(1))], Damage: 1 per hit)"})
    ], {"evoFrom":"Slakoth","evoCost":9,"evoTo":"Slaking","color":"#5F5E5A"}
  ),

  "Slaking": Pkmn(289, ["Normal"], 3, [18, 6, 0], "Atk",
    "Truant - Can only act every other turn",
    [
      S("Giga Impact", "Line(2)(1)", 4, {"skillRaw":"Giga Impact (Target = [1(Line(2)(1))], Damage: 4)"})
    ], {"evoFrom":"Vigoroth","color":"#5F5E5A"}
  ),

  "Nincada": Pkmn(290, ["Bug", "Ground"], 2, [6, 2, 2], "Def",
    "Compound Eyes - Boosts user skill accuracy",
    [
      S("Mud-Slap", "Line(1)(1)", 1, {"skillRaw":"Mud-Slap (Target = [1(Line(1)(1))], Damage: 1, Lowers enemy accuracy)"})
    ], {"evoCost":6,"evoTo":"Ninjask","color":"#854F0B"}
  ),

  "Ninjask": Pkmn(291, ["Bug", "Flying"], 2, [11, 4, 0], "Atk",
    "Ghost Shell - When Nincada evolves into Ninjask, summon 1 Shedinja on an adjacent empty tile",
    [
      S("X-Scissor", "Line(2)(1)", 2, {"skillRaw":"X-Scissor (Target = [1(Line(2)(1))], Damage: 2)"})
    ], {"evoFrom":"Nincada","color":"#6D8E1E"}
  ),

  "Shedinja": Pkmn(292, ["Bug", "Ghost"], 2, [1, 4, 0], "Atk",
    "Wonder Guard - Immune to all damage except Super-Effective types or status",
    [
      S("Shadow Sneak", "Line(3)(1)", 2, {"skillRaw":"Shadow Sneak (Target = [1(Line(3)(1))], Damage: 2, Strike first)"})
    ], {"evoFrom":"Nincada","color":"#6D8E1E"}
  ),

  "Whismur": Pkmn(293, ["Normal"], 2, [7, 1, 0], "Support",
    "Scrappy - Enables moves to hit Ghost-type Pokémon",
    [
      S("Pound", "Line(1)(1)", 0, {"skillRaw":"Pound (Target = [1(Line(1)(1))], Damage: 0)"})
    ], {"evoCost":5,"evoTo":"Loudred","color":"#5F5E5A"}
  ),

  "Loudred": Pkmn(294, ["Normal"], 2, [10, 3, 0], "Support",
    "Scrappy - Enables moves to hit Ghost-type Pokémon",
    [
      S("Stomp", "Line(1)(1)", 1, {"skillRaw":"Stomp (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoFrom":"Whismur","evoCost":8,"evoTo":"Exploud","color":"#5F5E5A"}
  ),

  "Exploud": Pkmn(295, ["Normal"], 2, [15, 4, 0], "Atk",
    "Scrappy - Enables moves to hit Ghost-type Pokémon",
    [
      S("Boomburst", "AoE(2)", 2, {"skillRaw":"Boomburst (Target = [1(AoE(2))], Damage: 2)"})
    ], {"evoFrom":"Loudred","color":"#5F5E5A"}
  ),

  "Makuhita": Pkmn(296, ["Fighting"], 2, [9, 2, 1], "Def",
    "Guts - Deal +1 skill damage when inflicted with status conditions",
    [
      S("Arm Thrust", "Line(1)(1)", 1, {"skillRaw":"Arm Thrust (Target = [2(Line(1)(1))], Damage: 1 per hit)"})
    ], {"evoCost":6,"evoTo":"Hariyama","color":"#A63D2E"}
  ),

  "Hariyama": Pkmn(297, ["Fighting"], 2, [16, 4, 2], "Def",
    "Thick Fat - Immune to Fire and Ice secondary status effects",
    [
      S("Close Combat", "Line(1)(1)", 3, {"skillRaw":"Close Combat (Target = [1(Line(1)(1))], Damage: 3, User Def -1 for 2 turns)"})
    ], {"evoFrom":"Makuhita","color":"#A63D2E"}
  ),

  "Azurill": Pkmn(298, ["Normal", "Fairy"], 2, [5, 1, 0], "Support",
    "Huge Power - Double basic attack damage",
    [
      S("Charm", "Line(2)(1)", 0, {"skillRaw":"Charm (Target = [1(Line(2)(1))], Enemy Atk -1 for 2 turns)"})
    ], {"evoCost":5,"evoTo":"Marill","color":"#C96BAA"}
  ),

  "Nosepass": Pkmn(299, ["Rock"], 2, [8, 2, 3], "Def",
    "Magnet Pull - Prevents adjacent Steel-type enemies from moving",
    [
      S("Rock Slide", "Cone(2)", 1, {"skillRaw":"Rock Slide (Target = [1(Cone(2))], Damage: 1)"})
    ], {"evoCost":7,"evoTo":"Probopass (Gen 4)","color":"#854F0B"}
  ),

  "Skitty": Pkmn(300, ["Normal"], 1, [5, 1, 0], "Support",
    "Cute Charm - 30% chance to confuse enemy when hit by melee",
    [
      S("Disarming Voice", "Cone(2)", 0, {"skillRaw":"Disarming Voice (Target = [1(Cone(2))], Damage: 0, Never misses)"})
    ], {"evoCost":6,"evoTo":"Delcatty","color":"#5F5E5A"}
  ),

  "Delcatty": Pkmn(301, ["Normal"], 1, [11, 3, 0], "Support",
    "Cute Charm - 30% chance to confuse enemy when hit by melee",
    [
      S("Sing", "Line(2)(1)", 0, {"statusChance":"sleep","statusChanceValue":0.5,"skillRaw":"Sing (Target = [1(Line(2)(1))], Inflict Sleep for 2 turns)"})
    ], {"evoFrom":"Skitty","color":"#5F5E5A"}
  ),

  "Sableye": Pkmn(302, ["Dark", "Ghost"], 2, [10, 3, 1], "Support",
    "Keen Eye - Accuracy cannot be lowered by enemies",
    [
      S("Shadow Sneak", "Line(3)(1)", 1, {"skillRaw":"Shadow Sneak (Target = [1(Line(3)(1))], Damage: 1, Strike first)"})
    ], {"color":"#3C3489"}
  ),

  "Mawile": Pkmn(303, ["Steel", "Fairy"], 2, [10, 4, 0], "Atk",
    "Intimidate - Adjacent enemies -1 Atk for 2 turns",
    [
      S("Iron Head", "Line(1)(1)", 2, {"skillRaw":"Iron Head (Target = [1(Line(1)(1))], Damage: 2, 30% chance to Flinch)"})
    ], {"color":"#C96BAA"}
  ),

  "Aron": Pkmn(304, ["Steel", "Rock"], 3, [7, 2, 2], "Def",
    "Sturdy - Cannot be OHKO'd from maximum health",
    [
      S("Metal Claw", "Line(1)(1)", 1, {"skillRaw":"Metal Claw (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Lairon","color":"#854F0B"}
  ),

  "Lairon": Pkmn(305, ["Steel", "Rock"], 3, [10, 3, 2], "Def",
    "Sturdy - Cannot be OHKO'd from maximum health",
    [
      S("Iron Defense", "AoE(0)", 0, {"skillRaw":"Iron Defense (Target = [1(AoE(0))], Def +1 for 3 turns)"})
    ], {"evoFrom":"Aron","evoCost":9,"evoTo":"Aggron","color":"#854F0B"}
  ),

  "Aggron": Pkmn(306, ["Steel", "Rock"], 3, [14, 4, 3], "Def",
    "Rock Head - Immune to recoil/self-damage effects",
    [
      S("Heavy Slam", "Line(2)(1)", 2, {"skillRaw":"Heavy Slam (Target = [1(Line(2)(1))], Damage: 2)"})
    ], {"evoFrom":"Lairon","color":"#854F0B"}
  ),

  "Meditite": Pkmn(307, ["Fighting", "Psychic"], 2, [6, 2, 0], "Atk",
    "Huge Power - Double basic attack damage",
    [
      S("Detect", "AoE(0)", 0, {"skillRaw":"Detect (Target = [1(AoE(0))], Completely evade next enemy skill)"})
    ], {"evoCost":7,"evoTo":"Medicham","color":"#993556"}
  ),

  "Medicham": Pkmn(308, ["Fighting", "Psychic"], 2, [11, 4, 0], "Atk",
    "Huge Power - Double basic attack damage",
    [
      S("High Jump Kick", "Line(1)(1)", 3, {"selfDamage":1,"skillRaw":"High Jump Kick (Target = [1(Line(1)(1))], Damage: 3, Recoil if misses)"})
    ], {"evoFrom":"Meditite","color":"#993556"}
  ),

  "Electrike": Pkmn(309, ["Electric"], 2, [6, 2, 0], "Atk",
    "Static - 30% chance to paralyze melee attackers",
    [
      S("Spark", "Line(2)(1)", 1, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Spark (Target = [1(Line(2)(1))], Damage: 1, 30% paralyze)"})
    ], {"evoCost":6,"evoTo":"Manectric","color":"#BA7517"}
  ),

  "Manectric": Pkmn(310, ["Electric"], 2, [12, 4, 0], "Atk",
    "Intimidate - Adjacent enemies -1 Atk for 2 turns",
    [
      S("Thunderbolt", "Line(3)(1)", 2, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Thunderbolt (Target = [1(Line(3)(1))], Damage: 2, 30% paralyze)"})
    ], {"evoFrom":"Electrike","color":"#BA7517"}
  ),

  "Plusle": Pkmn(311, ["Electric"], 2, [10, 2, 0], "Support",
    "Plus - At the start of your turn, Electric-type allies gain Atk +1 , If Minun is on the field, Electric-type allies gain an additional Atk +1",
    [
      S("Helping Hand", "Line(2)(1)", 0, {"skillRaw":"Helping Hand (Target = [1(Line(2)(1))], Grants adjacent ally Atk +1)"})
    ], {"color":"#BA7517"}
  ),

  "Minun": Pkmn(312, ["Electric"], 2, [10, 2, 1], "Support",
    "Minus - At the start of your turn, Electric-type allies gain Def +1 , If Plusle is on the field, Electric-type allies gain an additional Def +1",
    [
      S("Thunder Wave", "Line(2)(1)", 0, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Thunder Wave (Target = [1(Line(2)(1))], Inflict Paralysis for 3 turns)"})
    ], {"color":"#BA7517"}
  ),

  "Volbeat": Pkmn(313, ["Bug"], 2, [11, 3, 1], "Support",
    "Swarm - When HP ≤ 50%, Bug skills deal +1 damage",
    [
      S("Signal Beam", "Line(3)(1)", 1, {"statusChance":"confuse","statusChanceValue":0.3,"skillRaw":"Signal Beam (Target = [1(Line(3)(1))], Damage: 1, 30% confuse)"})
    ], {"color":"#6D8E1E"}
  ),

  "Illumise": Pkmn(314, ["Bug"], 2, [11, 2, 1], "Support",
    "Oblivious - Immune to Taunt and Intimidate effects",
    [
      S("Moonlight", "AoE(0)", 0, {"skillHeal":3,"skillHealTarget":"self","skillRaw":"Moonlight (Target = [1(AoE(0))], Override skillDmg: 0, Heal user 3 HP)"})
    ], {"color":"#6D8E1E"}
  ),

  "Roselia": Pkmn(315, ["Grass", "Poison"], 2, [9, 3, 0], "Support",
    "Poison Point - 30% chance to poison melee attackers",
    [
      S("Toxic Spikes", "AoE(1)", 0, {"statusChance":"poison","statusChanceValue":0.3,"skillRaw":"Toxic Spikes (Target = [1(AoE(1))], Sets poison hazard trap)"})
    ], {"evoFrom":"Budew (Gen 4)","evoCost":8,"evoTo":"Roserade (Gen 4)","color":"#3B6D11"}
  ),

  "Gulpin": Pkmn(316, ["Poison"], 2, [8, 1, 1], "Def",
    "Sticky Hold - Items/Energy cannot be stolen or manipulated by enemies",
    [
      S("Sludge", "Line(2)(1)", 1, {"skillRaw":"Sludge (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Swalot","color":"#72243E"}
  ),

  "Swalot": Pkmn(317, ["Poison"], 2, [14, 3, 2], "Def",
    "Liquid Ooze - Attacks draining user's HP deal damage to the drainer instead",
    [
      S("Gunk Shot", "Line(3)(1)", 2, {"statusChance":"poison","statusChanceValue":0.3,"skillRaw":"Gunk Shot (Target = [1(Line(3)(1))], Damage: 2, Inflict Poison)"})
    ], {"evoFrom":"Gulpin","color":"#72243E"}
  ),

  "Carvanha": Pkmn(318, ["Water", "Dark"], 2, [5, 3, 0], "Atk",
    "Rough Skin - Deals 1 damage to melee attackers",
    [
      S("Bite", "Line(1)(1)", 1, {"skillRaw":"Bite (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Sharpedo","color":"#185FA5"}
  ),

  "Sharpedo": Pkmn(319, ["Water", "Dark"], 2, [12, 5, 0], "Atk",
    "Speed Boost - Gains +1 extra movement tile every 3 turns",
    [
      S("Crunch", "Line(2)(1)", 2, {"skillRaw":"Crunch (Target = [1(Line(2)(1))], Damage: 2)"})
    ], {"evoFrom":"Carvanha","color":"#185FA5"}
  ),

  "Wailmer": Pkmn(320, ["Water"], 2, [12, 2, 1], "Def",
    "Water Absorb - Immune to Water, heals 3 HP when struck",
    [
      S("Splash", "AoE(1)", 1, {"skillRaw":"Splash (Target = [1(AoE(1))], Damage: 1)"})
    ], {"evoCost":8,"evoTo":"Wailord","color":"#185FA5"}
  ),

  "Wailord": Pkmn(321, ["Water"], 2, [24, 4, 1], "Def",
    "Water Absorb - Immune to Water, heals 3 HP when struck",
    [
      S("Water Spout", "AoE(2)", 2, {"skillRaw":"Water Spout (Target = [1(AoE(2))], Damage: 2, Lowers as user HP drops)"})
    ], {"evoFrom":"Wailmer","color":"#185FA5"}
  ),

  "Numel": Pkmn(322, ["Fire", "Ground"], 2, [7, 2, 0], "Atk",
    "Oblivious - Immune to Taunt and Intimidate effects",
    [
      S("Ember", "Line(2)(1)", 1, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Ember (Target = [1(Line(2)(1))], Damage: 1, 30% Burn)"})
    ], {"evoCost":6,"evoTo":"Camerupt","color":"#D85A30"}
  ),

  "Camerupt": Pkmn(323, ["Fire", "Ground"], 2, [13, 5, 0], "Atk",
    "Solid Rock - Reduces incoming super-effective damage by 1",
    [
      S("Eruption", "Cone(2)", 3, {"skillRaw":"Eruption (Target = [1(Cone(2))], Damage: 3, Scales with max HP)"})
    ], {"evoFrom":"Numel","color":"#D85A30"}
  ),

  "Torkoal": Pkmn(324, ["Fire"], 3, [13, 4, 3], "Def",
    "Drought - Changes weather to Sun for 5 turns upon deploying",
    [
      S("Lava Plume", "AoE(1)", 2, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Lava Plume (Target = [1(AoE(1))], Damage: 2, 30% Burn)"})
    ], {"color":"#D85A30"}
  ),

  "Spoink": Pkmn(325, ["Psychic"], 2, [6, 1, 0], "Support",
    "Own Tempo - Immune to Confuse condition",
    [
      S("Psybeam", "Line(2)(1)", 0, {"statusChance":"confuse","statusChanceValue":0.3,"skillRaw":"Psybeam (Target = [1(Line(2)(1))], Damage: 0, 30% confuse)"})
    ], {"evoCost":6,"evoTo":"Grumpig","color":"#993556"}
  ),

  "Grumpig": Pkmn(326, ["Psychic"], 2, [12, 3, 1], "Support",
    "Thick Fat - Immune to Fire and Ice secondary status effects",
    [
      S("Psychic", "Line(3)(1)", 1, {"skillRaw":"Psychic (Target = [1(Line(3)(1))], Damage: 1)"})
    ], {"evoFrom":"Spoink","color":"#993556"}
  ),

  "Spinda": Pkmn(327, ["Normal"], 2, [11, 3, 0], "Support",
    "Own Tempo - Immune to Confuse condition",
    [
      S("Teeter Dance", "AoE(1)", 0, {"statusChance":"confuse","statusChanceValue":0.3,"skillRaw":"Teeter Dance (Target = [1(AoE(1))], Inflict Confuse for 3 turns, 100% chance)"})
    ], {"color":"#5F5E5A"}
  ),

  "Trapinch": Pkmn(328, ["Ground"], 3, [6, 3, 0], "Atk",
    "Arena Trap - Adjacent enemies cannot move away from user",
    [
      S("Bite", "Line(1)(1)", 1, {"skillRaw":"Bite (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Vibrava","color":"#854F0B"}
  ),

  "Vibrava": Pkmn(329, ["Ground", "Dragon"], 3, [9, 3, 0], "Atk",
    "Levitate - Immune to Ground-type skill damage",
    [
      S("Dragon Breath", "Line(2)(1)", 1, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Dragon Breath (Target = [1(Line(2)(1))], Damage: 1, 30% paralyze)"})
    ], {"evoFrom":"Trapinch","evoCost":9,"evoTo":"Flygon","color":"#854F0B"}
  ),

  "Flygon": Pkmn(330, ["Ground", "Dragon"], 3, [14, 5, 0], "Atk",
    "Levitate - Immune to Ground-type skill damage",
    [
      S("Dragon Claw", "Line(3)(1)", 2, {"skillRaw":"Dragon Claw (Target = [1(Line(3)(1))], Damage: 2)"})
    ], {"evoFrom":"Vibrava","color":"#854F0B"}
  ),

  "Cacnea": Pkmn(331, ["Grass"], 2, [6, 3, 0], "Atk",
    "Sand Veil - Immune to Sandstorm weather chip damage",
    [
      S("Needle Arm", "Line(1)(1)", 1, {"skillRaw":"Needle Arm (Target = [1(Line(1)(1))], Damage: 1, 30% Flinch)"})
    ], {"evoCost":6,"evoTo":"Cacturne","color":"#3B6D11"}
  ),

  "Cacturne": Pkmn(332, ["Grass", "Dark"], 2, [12, 5, 0], "Atk",
    "Sand Veil - Immune to Sandstorm weather chip damage",
    [
      S("Sucker Punch", "Line(2)(1)", 2, {"skillRaw":"Sucker Punch (Target = [1(Line(2)(1))], Damage: 2, Strikes first if targeted)"})
    ], {"evoFrom":"Cacnea","color":"#3B6D11"}
  ),

  "Swablu": Pkmn(333, ["Normal", "Flying"], 2, [6, 1, 0], "Support",
    "Natural Cure - Cures all status conditions upon turn end",
    [
      S("Sing", "Line(2)(1)", 0, {"statusChance":"sleep","statusChanceValue":0.5,"skillRaw":"Sing (Target = [1(Line(2)(1))], Inflict Sleep for 2 turns)"})
    ], {"evoCost":7,"evoTo":"Altaria","color":"#5F5E5A"}
  ),

  "Altaria": Pkmn(334, ["Dragon", "Flying"], 2, [13, 3, 1], "Support",
    "Natural Cure - Cures all status conditions upon turn end",
    [
      S("Dragon Pulse", "Line(3)(1)", 1, {"skillRaw":"Dragon Pulse (Target = [1(Line(3)(1))], Damage: 1)"})
    ], {"evoFrom":"Swablu","color":"#5F5E5A"}
  ),

  "Zangoose": Pkmn(335, ["Normal"], 2, [12, 5, 0], "Atk",
    "Immunity - Immune to Poison condition",
    [
      S("Crush Claw", "Line(1)(1)", 2, {"skillRaw":"Crush Claw (Target = [1(Line(1)(1))], Damage: 2, Lowers enemy Def)"})
    ], {"color":"#5F5E5A"}
  ),

  "Seviper": Pkmn(336, ["Poison"], 2, [12, 5, 0], "Atk",
    "Shed Skin - 30% chance to cure status at turn end",
    [
      S("Poison Tail", "Line(2)(1)", 2, {"statusChance":"poison","statusChanceValue":0.3,"skillRaw":"Poison Tail (Target = [1(Line(2)(1))], Damage: 2, High crit, inflicts Poison)"})
    ], {"color":"#72243E"}
  ),

  "Lunatone": Pkmn(337, ["Rock", "Psychic"], 4, [13, 3, 1], "Support",
    "Lunar Aura - During even-numbered turns, Dark/Fairy/Ghost-type Pokémon gain Def +1 , If Solrock is on the field, the bonus becomes Def +2 instead",
    [
      S("Rock Slide", "Cone(2)", 1, {"skillRaw":"Rock Slide (Target = [1(Cone(2))], Damage: 1)"})
    ], {"color":"#854F0B"}
  ),

  "Solrock": Pkmn(338, ["Rock", "Psychic"], 4, [13, 4, 0], "Atk",
    "Solar Aura - During odd-numbered turns, Rock/Psychic/Fire-type Pokémon gain Atk +1 , If Lunatone is on the field,  the bonus becomes Atk +2 instead",
    [
      S("Stone Edge", "Line(2)(1)", 2, {"skillRaw":"Stone Edge (Target = [1(Line(2)(1))], Damage: 2, High crit)"})
    ], {"color":"#854F0B"}
  ),

  "Barboach": Pkmn(339, ["Water", "Ground"], 2, [7, 1, 1], "Def",
    "Oblivious - Immune to Taunt and Intimidate effects",
    [
      S("Mud Shot", "Line(2)(1)", 0, {"skillRaw":"Mud Shot (Target = [1(Line(2)(1))], Damage: 0, Slows enemy)"})
    ], {"evoCost":6,"evoTo":"Whiscash","color":"#185FA5"}
  ),

  "Whiscash": Pkmn(340, ["Water", "Ground"], 2, [14, 3, 2], "Def",
    "Oblivious - Immune to Taunt and Intimidate",
    [
      S("Earthquake", "AoE(2)", 2, {"skillRaw":"Earthquake (Target = [1(AoE(2))], Damage: 2)"})
    ], {"evoFrom":"Barboach","color":"#185FA5"}
  ),

  "Corphish": Pkmn(341, ["Water"], 2, [6, 2, 0], "Atk",
    "Hyper Cutter - User's Atk stat cannot be lowered by enemies",
    [
      S("Vice Grip", "Line(1)(1)", 1, {"skillRaw":"Vice Grip (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Crawdaunt","color":"#185FA5"}
  ),

  "Crawdaunt": Pkmn(342, ["Water", "Dark"], 2, [12, 5, 0], "Atk",
    "Adaptability - Deals +1 extra damage when using matching type skills",
    [
      S("Crabhammer", "Line(1)(1)", 3, {"skillRaw":"Crabhammer (Target = [1(Line(1)(1))], Damage: 3, High crit)"})
    ], {"evoFrom":"Corphish","color":"#185FA5"}
  ),

  "Baltoy": Pkmn(343, ["Ground", "Psychic"], 2, [6, 1, 2], "Def",
    "Levitate - Immune to Ground-type skill damage",
    [
      S("Mud-Slap", "Line(1)(1)", 0, {"skillRaw":"Mud-Slap (Target = [1(Line(1)(1))], Damage: 0, Lowers enemy accuracy)"})
    ], {"evoCost":7,"evoTo":"Claydol","color":"#854F0B"}
  ),

  "Claydol": Pkmn(344, ["Ground", "Psychic"], 2, [12, 3, 3], "Def",
    "Levitate - Immune to Ground-type skill damage",
    [
      S("Earth Power", "Line(3)(1)", 1, {"skillRaw":"Earth Power (Target = [1(Line(3)(1))], Damage: 1, Lowers enemy Def)"})
    ], {"evoFrom":"Baltoy","color":"#854F0B"}
  ),

  "Lileep": Pkmn(345, ["Rock", "Grass"], 3, [8, 2, 2], "Def",
    "Suction Cups - Immune to knockback and forced movement",
    [
      S("Giga Drain", "Line(2)(1)", 1, {"skillHeal":1,"skillHealTarget":"self","skillRaw":"Giga Drain (Target = [1(Line(2)(1))], Damage: 1, Heal user 1 HP)"})
    ], {"evoCost":7,"evoTo":"Cradily","color":"#3B6D11"}
  ),

  "Cradily": Pkmn(346, ["Rock", "Grass"], 3, [14, 3, 3], "Def",
    "Suction Cups - Immune to knockback and forced movement",
    [
      S("Ancient Power", "Line(3)(1)", 1, {"skillRaw":"Ancient Power (Target = [1(Line(3)(1))], Damage: 1, Chance to buff self)"})
    ], {"evoFrom":"Lileep","color":"#3B6D11"}
  ),

  "Anorith": Pkmn(347, ["Rock", "Bug"], 3, [7, 3, 0], "Atk",
    "Battle Armor - Immune to receiving critical hits",
    [
      S("Metal Claw", "Line(1)(1)", 1, {"skillRaw":"Metal Claw (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":7,"evoTo":"Armaldo","color":"#854F0B"}
  ),

  "Armaldo": Pkmn(348, ["Rock", "Bug"], 3, [13, 5, 0], "Atk",
    "Battle Armor - Immune to receiving critical hits",
    [
      S("X-Scissor", "Line(2)(1)", 2, {"skillRaw":"X-Scissor (Target = [1(Line(2)(1))], Damage: 2)"})
    ], {"evoFrom":"Anorith","color":"#854F0B"}
  ),

  "Feebas": Pkmn(349, ["Water"], 2, [4, 1, 0], "Support",
    "Swift Swim - Move costs -1 energy during Rain weather",
    [
      S("Splash", "AoE(0)", 0, {"skillRaw":"Splash (Target = [1(AoE(0))], Override skillDmg: 0, Moves randomly)"})
    ], {"evoCost":8,"evoTo":"Milotic","color":"#185FA5"}
  ),

  "Milotic": Pkmn(350, ["Water"], 2, [15, 3, 3], "Def",
    "Marvel Scale - Def +1 when inflicted with a status condition",
    [
      S("Recover", "AoE(0)", 0, {"skillHeal":4,"skillHealTarget":"self","skillRaw":"Recover (Target = [1(AoE(0))], Override skillDmg: 0, Heal user 4 HP)"})
    ], {"evoFrom":"Feebas","color":"#185FA5"}
  ),

  "Castform": Pkmn(351, ["Normal"], 2, [7, 3, 0], "Support",
    "Forecast - At the start of your turn, Castform checks the current weather,Sunny Weather: Adjacent Fire-type allies gain Atk +1,Rain Weather: Adjacent Water-type allies heal 1 HP,Hail/Snow Weather: Adjacent Ice-type allies gain Def +1 , All weather effects only affect adjacent allies around Castform",
    [
      S("Weather Ball", "Line(3)(1)", 3, {"skillRaw":"Weather Ball (Target = [1(Line(3)(1))], Damage: 3, Element scales with weather)"})
    ], {"color":"#5F5E5A"}
  ),

  "Kecleon": Pkmn(352, ["Normal"], 2, [11, 4, 1], "Support",
    "Color Change - Changes user type to match the element that hit them",
    [
      S("Shadow Sneak", "Line(3)(1)", 2, {"skillRaw":"Shadow Sneak (Target = [1(Line(3)(1))], Damage: 2, Strike first)"})
    ], {"color":"#5F5E5A"}
  ),

  "Shuppet": Pkmn(353, ["Ghost"], 2, [6, 2, 0], "Atk",
    "Insomnia - Immune to Sleep condition",
    [
      S("Night Shade", "Line(2)(1)", 1, {"skillRaw":"Night Shade (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Banette","color":"#3C3489"}
  ),

  "Banette": Pkmn(354, ["Ghost"], 2, [12, 5, 0], "Atk",
    "Insomnia - Immune to Sleep condition",
    [
      S("Shadow Claw", "Line(1)(1)", 2, {"skillRaw":"Shadow Claw (Target = [1(Line(1)(1))], Damage: 2, High crit)"})
    ], {"evoFrom":"Shuppet","color":"#3C3489"}
  ),

  "Duskull": Pkmn(355, ["Ghost"], 2, [5, 1, 2], "Def",
    "Levitate - Immune to Ground-type skill damage",
    [
      S("Astonish", "Line(1)(1)", 0, {"skillRaw":"Astonish (Target = [1(Line(1)(1))], Damage: 0, 30% Flinch)"})
    ], {"evoCost":6,"evoTo":"Dusclops","color":"#3C3489"}
  ),

  "Dusclops": Pkmn(356, ["Ghost"], 2, [9, 3, 3], "Def",
    "Pressure - Enemy skills targeting user cost +1 energy",
    [
      S("Shadow Punch", "Line(2)(1)", 1, {"skillRaw":"Shadow Punch (Target = [1(Line(2)(1))], Damage: 1, Never misses)"})
    ], {"evoFrom":"Duskull","evoCost":8,"evoTo":"Dusknoir (Gen 4)","color":"#3C3489"}
  ),

  "Tropius": Pkmn(357, ["Grass", "Flying"], 3, [14, 3, 1], "Support",
    "Chlorophyll - Move costs -1 energy during Sun weather",
    [
      S("Synthesis", "AoE(0)", 0, {"skillHeal":3,"skillHealTarget":"self","skillRaw":"Synthesis (Target = [1(AoE(0))], Override skillDmg: 0, Heal user 3 HP)"})
    ], {"color":"#3B6D11"}
  ),

  "Chimecho": Pkmn(358, ["Psychic"], 2, [11, 3, 1], "Support",
    "Levitate - Immune to Ground-type skill damage",
    [
      S("Heal Pulse", "Line(3)(1)", 0, {"skillHeal":3,"skillHealTarget":"ally","skillRaw":"Heal Pulse (Target = [1(Line(3)(1))], Override skillDmg: 0, Heal target 3 HP)"})
    ], {"evoFrom":"Chingling (Gen 4)","color":"#993556"}
  ),

  "Absol": Pkmn(359, ["Dark"], 3, [12, 6, 0], "Atk",
    "Super Luck - Skills crit on 16+ naturally",
    [
      S("Night Slash", "Line(2)(1)", 3, {"skillRaw":"Night Slash (Target = [1(Line(2)(1))], Damage: 3, High crit)"})
    ], {"color":"#5F5E5A"}
  ),

  "Wynaut": Pkmn(360, ["Psychic"], 2, [14, 1, 1], "Def",
    "Shadow Tag - Adjacent enemies cannot voluntarily move away",
    [
      S("Counter", "Line(1)(1)", 0, {"skillRaw":"Counter (Target = [1(Line(1)(1))], Reflect damage taken back to attacker)"})
    ], {"evoCost":5,"evoTo":"Wobbuffet","color":"#993556"}
  ),

  "Snorunt": Pkmn(361, ["Ice"], 2, [7, 2, 0], "Support",
    "Inner Focus - Immune to Flinch effects",
    [
      S("Powder Snow", "Line(2)(1)", 1, {"skillRaw":"Powder Snow (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Glalie","color":"#8CD16D"}
  ),

  "Glalie": Pkmn(362, ["Ice"], 2, [13, 4, 0], "Atk",
    "Inner Focus - Immune to Flinch effects",
    [
      S("Ice Beam", "Line(3)(1)", 2, {"statusChance":"freeze","statusChanceValue":0.3,"skillRaw":"Ice Beam (Target = [1(Line(3)(1))], Damage: 2, 30% Freeze)"})
    ], {"evoFrom":"Snorunt","color":"#8CD16D"}
  ),

  "Spheal": Pkmn(363, ["Ice", "Water"], 3, [8, 1, 1], "Def",
    "Thick Fat - Immune to Fire and Ice secondary status effects",
    [
      S("Powder Snow", "Line(2)(1)", 0, {"skillRaw":"Powder Snow (Target = [1(Line(2)(1))], Damage: 0)"})
    ], {"evoCost":6,"evoTo":"Sealeo","color":"#185FA5"}
  ),

  "Sealeo": Pkmn(364, ["Ice", "Water"], 3, [11, 3, 2], "Def",
    "Thick Fat - Immune to Fire and Ice secondary status effects",
    [
      S("Aurora Beam", "Line(3)(1)", 1, {"skillRaw":"Aurora Beam (Target = [1(Line(3)(1))], Damage: 1, Lowers enemy Atk)"})
    ], {"evoFrom":"Spheal","evoCost":8,"evoTo":"Walrein","color":"#185FA5"}
  ),

  "Walrein": Pkmn(365, ["Ice", "Water"], 3, [16, 4, 2], "Def",
    "Thick Fat - Immune to Fire and Ice secondary status effects",
    [
      S("Blizzard", "AoE(2)", 2, {"statusChance":"freeze","statusChanceValue":0.3,"skillRaw":"Blizzard (Target = [1(AoE(2))], Damage: 2, 30% Freeze)"})
    ], {"evoFrom":"Sealeo","color":"#185FA5"}
  ),

  "Clamperl": Pkmn(366, ["Water"], 2, [6, 2, 2], "Def",
    "Shell Armor - Immune to receiving critical hits",
    [
      S("Clamp", "Line(1)(1)", 1, {"skillRaw":"Clamp (Target = [1(Line(1)(1))], Damage: 1, Locks enemy position)"})
    ], {"evoCost":7,"evoTo":"Huntail","color":"#185FA5"}
  ),

  "Huntail": Pkmn(367, ["Water"], 2, [12, 5, 0], "Atk",
    "Swift Swim - Move costs -1 energy during Rain weather",
    [
      S("Crunch", "Line(2)(1)", 2, {"skillRaw":"Crunch (Target = [1(Line(2)(1))], Damage: 2)"})
    ], {"evoFrom":"Clamperl","color":"#185FA5"}
  ),

  "Gorebyss": Pkmn(368, ["Water"], 2, [12, 4, 1], "Support",
    "Swift Swim - Move costs -1 energy during Rain weather",
    [
      S("Psychic", "Line(3)(1)", 2, {"skillRaw":"Psychic (Target = [1(Line(3)(1))], Damage: 2)"})
    ], {"evoFrom":"Clamperl","color":"#185FA5"}
  ),

  "Relicanth": Pkmn(369, ["Water", "Rock"], 3, [14, 4, 2], "Def",
    "Rock Head - Immune to recoil/self-damage effects",
    [
      S("Head Smash", "Line(1)(1)", 3, {"selfDamage":1,"skillRaw":"Head Smash (Target = [1(Line(1)(1))], Damage: 3, Recoil removed by ability)"})
    ], {"color":"#185FA5"}
  ),

  "Luvdisc": Pkmn(370, ["Water"], 1, [9, 1, 0], "Support",
    "Hydration - During rain, remove all status conditions at the end of the turn",
    [
      S("Entrainment", "Line(1)(1)", 0, {"skillRaw":"Entrainment (Target ally copies Luvdisc's Ability for 3 turns)"})
    ], {"color":"#185FA5"}
  ),

  "Bagon": Pkmn(371, ["Dragon"], 3, [7, 2, 0], "Atk",
    "Rock Head - Immune to recoil/self-damage effects",
    [
      S("Headbutt", "Line(1)(1)", 1, {"skillRaw":"Headbutt (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":7,"evoTo":"Shelgon","color":"#5F5E5A"}
  ),

  "Shelgon": Pkmn(372, ["Dragon"], 3, [11, 3, 2], "Def",
    "Rock Head - Immune to recoil/self-damage effects",
    [
      S("Iron Defense", "AoE(0)", 0, {"skillRaw":"Iron Defense (Target = [1(AoE(0))], Def +1 for 3 turns)"})
    ], {"evoFrom":"Bagon","evoCost":9,"evoTo":"Salamence","color":"#5F5E5A"}
  ),

  "Salamence": Pkmn(373, ["Dragon", "Flying"], 3, [16, 6, 0], "Atk",
    "Intimidate - Adjacent enemies -1 Atk for 2 turns",
    [
      S("Dragon Claw", "Line(3)(1)", 3, {"skillRaw":"Dragon Claw (Target = [1(Line(3)(1))], Damage: 3)"})
    ], {"evoFrom":"Shelgon","color":"#5F5E5A"}
  ),

  "Beldum": Pkmn(374, ["Steel", "Psychic"], 3, [7, 2, 1], "Def",
    "Clear Body - User's stats cannot be lowered by enemies",
    [
      S("Take Down", "Line(1)(1)", 1, {"selfDamage":1,"skillRaw":"Take Down (Target = [1(Line(1)(1))], Damage: 1, User takes 1 recoil damage)"})
    ], {"evoCost":7,"evoTo":"Metang","color":"#993556"}
  ),

  "Metang": Pkmn(375, ["Steel", "Psychic"], 3, [11, 3, 2], "Def",
    "Clear Body - User's stats cannot be lowered by enemies",
    [
      S("Bullet Punch", "Line(1)(1)", 1, {"skillRaw":"Bullet Punch (Target = [1(Line(1)(1))], Damage: 1, Strike first)"})
    ], {"evoFrom":"Beldum","evoCost":9,"evoTo":"Metagross","color":"#993556"}
  ),

  "Metagross": Pkmn(376, ["Steel", "Psychic"], 3, [15, 5, 3], "Def",
    "Clear Body - User's stats cannot be lowered by enemies",
    [
      S("Meteor Mash", "Line(2)(1)", 3, {"skillRaw":"Meteor Mash (Target = [1(Line(2)(1))], Damage: 3, High crit)"})
    ], {"evoFrom":"Metang","color":"#993556"}
  ),

  "Regirock": Pkmn(377, ["Rock"], 5, [14, 4, 3], "Def",
    "Clear Body - User's stats cannot be lowered by enemies",
    [
      S("Stone Edge", "Line(3)(1)", 2, {"skillRaw":"Stone Edge (Target = [1(Line(3)(1))], Damage: 2, High crit)"})
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Legendary","color":"#854F0B"}
  ),

  "Regice": Pkmn(378, ["Ice"], 5, [14, 4, 3], "Def",
    "Clear Body - User's stats cannot be lowered by enemies",
    [
      S("Ice Beam", "Line(3)(1)", 2, {"statusChance":"freeze","statusChanceValue":0.3,"skillRaw":"Ice Beam (Target = [1(Line(3)(1))], Damage: 2, 30% Freeze)"})
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Legendary","color":"#8CD16D"}
  ),

  "Registeel": Pkmn(379, ["Steel"], 5, [14, 3, 3], "Def",
    "Clear Body - User's stats cannot be lowered by enemies",
    [
      S("Iron Head", "Line(2)(1)", 1, {"skillRaw":"Iron Head (Target = [1(Line(2)(1))], Damage: 1, 30% Flinch)"})
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Legendary","color":"#5F5E5A"}
  ),

  "Latias": Pkmn(380, ["Dragon", "Psychic"], 5, [14, 4, 1], "Support",
    "Eon Link - Immune to Ground-type skill damage , If Latios is on the field, When Latias moves, Latios may move 1 tile for free , When Latias uses a normal attack, Latios may perform a normal attack for free",
    [
      S("Mist Ball", "Line(3)(1)", 2, {"skillRaw":"Mist Ball (Target = [1(Line(3)(1))], Damage: 2, Reduce target Atk -1 for 2 turns)"}),
      S("Healing Wish", "Line(3)(1)", 0, {"skillRaw":"Healing Wish (Target = [1(Line(3)(1))], Heal target ally 4 HP, Remove 1 negative status effect)"})
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Legendary","color":"#993556"}
  ),

  "Latios": Pkmn(381, ["Dragon", "Psychic"], 5, [14, 5, 0], "Atk",
    "Levitate - Immune to Ground-type skill damage , If Latias is on the field , When Latias uses a skill, reduce Latios's skill cost by 1 for this turn",
    [
      S("Luster Purge", "Line(4)(1)", 3, {"skillRaw":"Luster Purge (Target = [1(Line(4)(1))], Damage: 3, Reduce target Def -1 for 2 turns)"}),
      S("Dragon Pulse", "Line(4)(1)", 2, {"skillRaw":"Dragon Pulse (Target = [1(Line(4)(1))], Damage: 2, Ignore 1 Def)"})
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Legendary","color":"#993556"}
  ),

  "Kyogre": Pkmn(382, ["Water"], 5, [16, 6, 1], "Atk",
    "Drizzle - Changes weather to Rain indefinitely upon deployment",
    [
      S("Origin Pulse", "AoE(2)", 3, {"skillRaw":"Origin Pulse (Target = [1(AoE(2))], Damage: 3)"}),
      S("Water Spout", "All Enemy Pokémon", 2, {"skillRaw":"Water Spout (Target = [All Enemy Pokémon], Damage: 2, Damage +1 if HP is above 70%, Does not affect Altars/Eggs)"}),
      S("Ice Beam", "Line(4)(1)", 2, {"statusChance":"freeze","statusChanceValue":0.3,"skillRaw":"Ice Beam (Target = [1(Line(4)(1))], Damage: 2, 30% Freeze)"})
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Legendary","color":"#185FA5"}
  ),

  "Groudon": Pkmn(383, ["Ground"], 5, [16, 6, 3], "Def",
    "Drought - Changes weather to Sun indefinitely upon deployment",
    [
      S("Precipice Blades", "Cone(2)", 3, {"skillRaw":"Precipice Blades (Target = [1(Cone(2))], Damage: 3)"}),
      S("Lava Plume", "Around(1)", 2, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Lava Plume (Target = [1(Around(1))], Damage: 2, 30% Burn)"}),
      S("Stone Edge", "Line(3)(1)", 3, {"skillRaw":"Stone Edge (Target = [1(Line(3)(1))], Damage: 3, High crit)"})
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Legendary","color":"#854F0B"}
  ),

  "Rayquaza": Pkmn(384, ["Dragon", "Flying"], 5, [16, 7, 0], "Atk",
    "Air Lock - Negates all weather effects on the entire battlefield",
    [
      S("Dragon Ascent", "Dash(4)", 7, {"skillRaw":"Dragon Ascent (Target = [1(Dash(4))], Damage: 7, Flying-type, Push target back 1 tile)"}),
      S("Extreme Speed", "Line(5)(1)", 5, {"skillRaw":"Extreme Speed (Target = [1(Line(5)(1))], Damage: 5, )"}),
      S("Hyper Beam", "Line(6)(1)", 4, {"skillRaw":"Hyper Beam (Target = [1(Line(6)(1))], Damage: 4, Cannot move next turn)"})
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Legendary","color":"#5F5E5A"}
  ),

  "Jirachi": Pkmn(385, ["Steel", "Psychic"], 5, [14, 4, 1], "Support",
    "Serene Grace - Doubles the activation chance of secondary skill effects",
    [
      S("Doom Desire", "Line(3)(1)", 5, {"skillRaw":"Doom Desire (Target = [1(Line(3)(1))], Damage: 5, Strikes after 2 turns delay)"}),
      S("Wish", "All Allies", 0, {"skillHeal":2,"skillHealTarget":"ally","skillRaw":"Wish (Target = [1(All Allies)], Heal 2 HP after 1 turn)"}),
      S("Psychic", "Line(4)(1)", 2, {"skillRaw":"Psychic (Target = [1(Line(4)(1))], Damage: 2, 30% Stun)"})
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Legendary","color":"#993556"}
  ),

  "Deoxys": Pkmn(386, ["Psychic"], 5, [12, 6, 0], "Atk (Normal Form setup)",
    "DNA Mutation - DNA Mutation",
    [
      S("Psycho Boost", "Target = [1(Line(4)(1))]", 6, {
        "skillEffect": {"stat": "atk", "amount": -1, "duration": 2, "target": "self"},
        "skillRaw": "Psycho Boost (Target = [1(Line(4)(1))]), Damage: 6, user Atk -1 for 2 turns"
      }),
      S("Cosmic Wall", "Target = [1(self)]", 0, {
        "skillEffect": {"stat": "def", "amount": 2, "duration": 2, "target": "self"},
        "skillRaw": "Cosmic Wall (Target = [1(self)]), Gives user +2 Def for 2 turns"
      })
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Legendary","color":"#993556"}
  ),

  "Turtwig": Pkmn(387, ["Grass"], 3, [8, 2, 2], "Def",
    "Overgrow - When HP ≤ 50%, deal +1 damage with Grass skills",
    [
      S("Razor Leaf", "Line(2)(1)", 1, {"skillRaw":"Razor Leaf (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Grotle","color":"#3B6D11"}
  ),

  "Grotle": Pkmn(388, ["Grass"], 3, [11, 3, 2], "Def",
    "Overgrow - When HP ≤ 50%, deal +1 damage with Grass skills",
    [
      S("Mega Drain", "Line(2)(1)", 1, {"skillHeal":1,"skillHealTarget":"self","skillRaw":"Mega Drain (Target = [1(Line(2)(1))], Damage: 1, Heal user 1 HP)"})
    ], {"evoCost":8,"evoTo":"Torterra","color":"#3B6D11"}
  ),

  "Torterra": Pkmn(389, ["Grass", "Ground"], 3, [15, 5, 3], "Def",
    "Overgrow - When HP ≤ 50%, deal +1 damage with Grass skills",
    [
      S("Earthquake", "AoE(2)", 2, {"skillRaw":"Earthquake (Target = [1(AoE(2))], Damage: 2)"})
    ], {"evoFrom":"Grotle Ability: Overgrow (When HP ≤ 50%, deal +1 damage with Grass skills) Skill: Earthquake (Target = [1(AoE(2))], Damage: 2)","color":"#3B6D11"}
  ),

  "Chimchar": Pkmn(390, ["Fire"], 3, [6, 2, 0], "Atk",
    "Blaze - When HP ≤ 50%, deal +1 damage with Fire skills",
    [
      S("Ember", "Line(2)(1)", 1, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Ember (Target = [1(Line(2)(1))], Damage: 1, 30% chance to inflict Burn for 3 turns)"})
    ], {"evoCost":6,"evoTo":"Monferno","color":"#D85A30"}
  ),

  "Monferno": Pkmn(391, ["Fire", "Fighting"], 3, [9, 4, 0], "Atk",
    "Blaze - When HP ≤ 50%, deal +1 damage with Fire skills",
    [
      S("Flame Wheel", "Line(2)(1)", 2, {"skillRaw":"Flame Wheel (Target = [1(Line(2)(1))], Damage: 2)"})
    ], {"evoCost":8,"evoTo":"Infernape","color":"#D85A30"}
  ),

  "Infernape": Pkmn(392, ["Fire", "Fighting"], 3, [13, 5, 0], "Atk",
    "Blaze - When HP ≤ 50%, deal +1 damage with Fire skills",
    [
      S("Close Combat", "Line(1)(1)", 2, {"skillRaw":"Close Combat (Target = [1(Line(1)(1))], Damage: 2, User Def -1 for 2 turns)"})
    ], {"evoFrom":"Monferno Ability: Blaze (When HP ≤ 50%, deal +1 damage with Fire skills) Skill: Close Combat (Target = [1(Line(1)(1))], Damage: 2, User Def -1 for 2 turns)","color":"#D85A30"}
  ),

  "Piplup": Pkmn(393, ["Water"], 3, [7, 2, 0], "Support",
    "Torrent - When HP ≤ 50%, deal +1 damage with Water skills",
    [
      S("Water Gun", "Line(2)(1)", 1, {"skillRaw":"Water Gun (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Prinplup","color":"#185FA5"}
  ),

  "Prinplup": Pkmn(394, ["Water"], 3, [10, 3, 1], "Support",
    "Torrent - When HP ≤ 50%, deal +1 damage with Water skills",
    [
      S("Bubble Beam", "Line(3)(1)", 1, {"skillRaw":"Bubble Beam (Target = [1(Line(3)(1))], Damage: 1, Slows enemy)"})
    ], {"evoCost":8,"evoTo":"Empoleon","color":"#185FA5"}
  ),

  "Empoleon": Pkmn(395, ["Water", "Steel"], 3, [14, 4, 1], "Support",
    "Torrent - When HP ≤ 50%, deal +1 damage with Water skills",
    [
      S("Hydro Pump", "Line(4)(1)", 2, {"skillRaw":"Hydro Pump (Target = [1(Line(4)(1))], Damage: 2)"})
    ], {"evoFrom":"Prinplup Ability: Torrent (When HP ≤ 50%, deal +1 damage with Water skills) Skill: Hydro Pump (Target = [1(Line(4)(1))], Damage: 2)","color":"#185FA5"}
  ),

  "Starly": Pkmn(396, ["Normal", "Flying"], 1, [5, 2, 0], "Atk",
    "Keen Eye - Accuracy cannot be lowered by enemies",
    [
      S("Quick Attack", "Line(2)(1)", 1, {"skillRaw":"Quick Attack (Target = [1(Line(2)(1))], Damage: 1, Strike first)"})
    ], {"evoCost":5,"evoTo":"Staravia","color":"#5F5E5A"}
  ),

  "Staravia": Pkmn(397, ["Normal", "Flying"], 1, [9, 3, 0], "Atk",
    "Intimidate - Adjacent enemies -1 Atk for 2 turns",
    [
      S("Wing Attack", "Line(2)(1)", 3, {"skillRaw":"Wing Attack (Target = [1(Line(2)(1))], Damage: 3)"})
    ], {"evoCost":7,"evoTo":"Staraptor","color":"#5F5E5A"}
  ),

  "Staraptor": Pkmn(398, ["Normal", "Flying"], 1, [13, 5, 0], "Atk",
    "Intimidate - Adjacent enemies -1 Atk for 2 turns",
    [
      S("Brave Bird", "Line(3)(1)", 6, {"selfDamage":1,"skillRaw":"Brave Bird (Target = [1(Line(3)(1))], Damage: 6, User takes 1 recoil damage)"})
    ], {"evoFrom":"Staravia Ability: Intimidate (Adjacent enemies -1 Atk for 2 turns) Skill: Brave Bird (Target = [1(Line(3)(1))], Damage: 6, User takes 1 recoil damage)","color":"#5F5E5A"}
  ),

  "Bidoof": Pkmn(399, ["Normal"], 1, [6, 1, 0], "Support",
    "Simple - Buffs and debuffs applied to this Pokémon are increased by +1",
    [
      S("Tackle", "Line(1)(1)", 1, {"skillRaw":"Tackle (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Bibarel","color":"#5F5E5A"}
  ),

  "Bibarel": Pkmn(400, ["Normal", "Water"], 1, [12, 3, 0], "Support",
    "Simple - Buffs and debuffs applied to this Pokémon are increased by +1",
    [
      S("Water Pulse", "Line(2)(1)", 3, {"statusChance":"confuse","statusChanceValue":0.3,"skillRaw":"Water Pulse (Target = [1(Line(2)(1))], Damage: 3, 30% Confuse)"})
    ], {"evoFrom":"Bidoof Ability: Simple (Buffs and debuffs applied to this Pokémon are increased by +1) Skill: Water Pulse (Target = [1(Line(2)(1))], Damage: 3, 30% Confuse)","color":"#185FA5"}
  ),

  "Kricketot": Pkmn(401, ["Bug"], 1, [5, 1, 0], "Support",
    "Shed Skin - 30% chance to cure status at turn end",
    [
      S("Growl", "Line(2)(1)", 0, {"skillRaw":"Growl (Target = [1(Line(2)(1))], Enemy Atk -1 for 2 turns)"})
    ], {"evoCost":4,"evoTo":"Kricketune","color":"#6D8E1E"}
  ),

  "Kricketune": Pkmn(402, ["Bug"], 1, [11, 4, 0], "Atk",
    "Swarm - When HP ≤ 50%, Bug skills deal +1 damage",
    [
      S("X-Scissor", "Line(2)(1)", 2, {"skillRaw":"X-Scissor (Target = [1(Line(2)(1))], Damage: 2)"})
    ], {"evoFrom":"Kricketot Ability: Swarm (When HP ≤ 50%, Bug skills deal +1 damage) Skill: X-Scissor (Target = [1(Line(2)(1))], Damage: 2)","color":"#6D8E1E"}
  ),

  "Shinx": Pkmn(403, ["Electric"], 2, [6, 2, 0], "Atk",
    "Guts - Gain Atk +1 while affected by a status condition",
    [
      S("Spark", "Line(2)(1)", 1, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Spark (Target = [1(Line(2)(1))], Damage: 1, 30% Paralysis)"})
    ], {"evoCost":5,"evoTo":"Luxio","color":"#BA7517"}
  ),

  "Luxio": Pkmn(404, ["Electric"], 2, [9, 3, 0], "Atk",
    "Guts - Gain Atk +1 while affected by a status condition",
    [
      S("Bite", "Line(1)(1)", 1, {"skillRaw":"Bite (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":7,"evoTo":"Luxray","color":"#BA7517"}
  ),

  "Luxray": Pkmn(405, ["Electric"], 2, [14, 5, 0], "Atk",
    "Guts - Gain Atk +1 while affected by a status condition",
    [
      S("Wild Charge", "Line(2)(1)", 3, {"selfDamage":1,"skillRaw":"Wild Charge (Target = [1(Line(2)(1))], Damage: 3, User takes 1 recoil damage)"})
    ], {"evoFrom":"Luxio","color":"#BA7517"}
  ),

  "Budew": Pkmn(406, ["Grass", "Poison"], 2, [5, 1, 0], "Support",
    "Natural Cure - Cures all status conditions upon turn end",
    [
      S("Mortal Spin", "Aoe(1)", 1, {"statusChance":"poison","statusChanceValue":0.3,"skillRaw":"Mortal Spin (Target = [1(Aoe(1))], Damage: 1, 30% Poison)"})
    ], {"evoCost":5,"evoTo":"Roselia","color":"#3B6D11"}
  ),

  "Roserade": Pkmn(407, ["Grass", "Poison"], 2, [12, 4, 1], "Support",
    "Poison Point - 30% chance to poison melee attackers",
    [
      S("Sludge Bomb", "Line(3)(1)", 4, {"statusChance":"poison","statusChanceValue":0.3,"skillRaw":"Sludge Bomb (Target = [1(Line(3)(1))], Damage: 4, 30% Poison)"})
    ], {"evoFrom":"Roselia Ability: Poison Point (30% chance to poison melee attackers) Skill: Sludge Bomb (Target = [1(Line(3)(1))], Damage: 4, 30% Poison)","color":"#3B6D11"}
  ),

  "Cranidos": Pkmn(408, ["Rock"], 3, [7, 4, 0], "Atk",
    "Mold Breaker - Ignores enemy defensive abilities during attacks",
    [
      S("Headbutt", "Line(1)(1)", 2, {"skillRaw":"Headbutt (Target = [1(Line(1)(1))], Damage: 2)"})
    ], {"evoCost":7,"evoTo":"Rampardos","color":"#854F0B"}
  ),

  "Rampardos": Pkmn(409, ["Rock"], 3, [14, 6, 0], "Atk",
    "Mold Breaker - Ignores enemy defensive abilities during attacks",
    [
      S("Head Smash", "Line(1)(1)", 4, {"selfDamage":1,"skillRaw":"Head Smash (Target = [1(Line(1)(1))], Damage: 4, User takes 1 recoil damage)"})
    ], {"evoFrom":"Cranidos Ability: Mold Breaker (Ignores enemy defensive abilities during attacks) Skill: Head Smash (Target = [1(Line(1)(1))], Damage: 4, User takes 1 recoil damage)","color":"#854F0B"}
  ),

  "Shieldon": Pkmn(410, ["Rock", "Steel"], 3, [6, 1, 2], "Def",
    "Sturdy - Cannot be OHKO'd from maximum health",
    [
      S("Iron Defense", "AoE(0)", 0, {"skillRaw":"Iron Defense (Target = [1(AoE(0))], Def +1 for 3 turns)"})
    ], {"evoCost":7,"evoTo":"Bastiodon","color":"#854F0B"}
  ),

  "Bastiodon": Pkmn(411, ["Rock", "Steel"], 3, [13, 2, 3], "Def",
    "Sturdy - Cannot be OHKO'd from maximum health",
    [
      S("Metal Burst", "Line(1)(1)", 0, {"skillRaw":"Metal Burst (Target = [1(Line(1)(1))], Reflects 2 damage when hit)"})
    ], {"evoFrom":"Shieldon Ability: Sturdy (Cannot be OHKO'd from maximum health) Skill: Metal Burst (Target = [1(Line(1)(1))], Reflects 2 damage when hit)","color":"#854F0B"}
  ),

  "Burmy": Pkmn(412, ["Bug"], 1, [5, 1, 1], "Def",
    "Shed Skin - 30% chance to cure status at turn end",
    [
      S("Protect", "AoE(0)", 0, {"skillRaw":"Protect (Target = [1(AoE(0))], Negates next damage instance)"})
    ], {"evoCost":5,"evoTo":"Wormadam","color":"#6D8E1E"}
  ),

  "Wormadam": Pkmn(413, ["Bug", "Grass"], 1, [12, 3, 2], "Def",
    "Anticipation - Senses enemy dangerous super-effective skills",
    [
      S("Giga Drain", "Line(2)(1)", 1, {"skillHeal":1,"skillHealTarget":"self","skillRaw":"Giga Drain (Target = [1(Line(2)(1))], Damage: 1, Heal user 1 HP)"})
    ], {"evoFrom":"Burmy Ability: Anticipation (Senses enemy dangerous super-effective skills) Skill: Giga Drain (Target = [1(Line(2)(1))], Damage: 1, Heal user 1 HP)","color":"#3B6D11"}
  ),

  "Mothim": Pkmn(414, ["Bug", "Flying"], 1, [12, 4, 0], "Atk",
    "Swarm - When HP ≤ 50%, Bug skills deal +1 damage",
    [
      S("Air Cutter", "Cone(2)", 2, {"skillRaw":"Air Cutter (Target = [1(Cone(2))], Damage: 2, High crit chance)"})
    ], {"evoFrom":"Burmy Ability: Swarm (When HP ≤ 50%, Bug skills deal +1 damage) Skill: Air Cutter (Target = [1(Cone(2))], Damage: 2, High crit chance)","color":"#6D8E1E"}
  ),

  "Combee": Pkmn(415, ["Bug", "Flying"], 1, [5, 1, 0], "Support",
    "Honey Gather - Sometimes finds extra energy items",
    [
      S("Sweet Scent", "AoE(1)", 0, {"skillRaw":"Sweet Scent (Target = [1(AoE(1))], Lowers enemy evasion)"})
    ], {"evoCost":5,"evoTo":"Vespiquen","color":"#6D8E1E"}
  ),

  "Vespiquen": Pkmn(416, ["Bug", "Flying"], 1, [14, 4, 2], "Def",
    "Honey Nest - When an ally attacks an enemy with a normal attack or skill, the tile the target is standing on becomes a Honey Tile for 3 turns",
    [
      S("Aromatic Mist", "AoE(1)", 0, {"skillRaw":"Aromatic Mist (Target = [1(AoE(1))], Adjacent allies gain Def +1, Does not affect self)"})
    ], {"evoFrom":"Combee","color":"#6D8E1E"}
  ),

  "Pachirisu": Pkmn(417, ["Electric"], 1, [7, 2, 1], "Support",
    "Volt Absorb - Immune to Electric skills, heals 1 HP when hit",
    [
      S("Electric Terrain", "Line(1)(1)", 0, {"skillRaw":"Electric Terrain (Create Electric Terrain for 5 turns)"})
    ], {"color":"#BA7517"}
  ),

  "Buizel": Pkmn(418, ["Water"], 2, [6, 2, 0], "Atk",
    "Water Veil - Prevents the Pokémon from getting a burn",
    [
      S("Aqua Jet", "Line(2)(1)", 2, {"skillRaw":"Aqua Jet (Target = [1(Line(2)(1))], Damage: 2,)"})
    ], {"evoCost":6,"evoTo":"Floatzel","color":"#185FA5"}
  ),

  "Floatzel": Pkmn(419, ["Water"], 2, [13, 5, 0], "Atk",
    "Water Veil - Prevents the Pokémon from getting a burn",
    [
      S("Aqua Tail", "Line(2)(1)", 5, {"skillRaw":"Aqua Tail (Target = [1(Line(2)(1))], Damage: 5)"})
    ], {"evoFrom":"Buizel","color":"#185FA5"}
  ),

  "Cherubi": Pkmn(420, ["Grass"], 1, [6, 1, 0], "Support",
    "Chlorophyll - Move costs -1 energy during Sun weather",
    [
      S("Magical Leaf", "Line(2)(1)", 0, {"skillRaw":"Magical Leaf (Target = [1(Line(2)(1))], Damage: 0, Never misses)"})
    ], {"evoCost":5,"evoTo":"Cherrim","color":"#3B6D11"}
  ),

  "Cherrim": Pkmn(421, ["Grass"], 1, [9, 3, 1], "Support",
    "Flower Gift - Boosts ally Atk by +1 during Sun weather",
    [
      S("Sunny Day", "AoE(0)", 0, {"skillRaw":"Sunny Day (Target = [1(AoE(0))], Changes weather to Sun for 5 turns)"})
    ], {"evoFrom":"Cherubi","color":"#3B6D11"}
  ),

  "Shellos": Pkmn(422, ["Water"], 2, [8, 1, 1], "Def",
    "Storm Drain - When an enemy Water-type Pokémon uses a normal attack or skill, heal 1 HP",
    [
      S("Water Pulse", "Line(2)(1)", 1, {"statusChance":"confuse","statusChanceValue":0.3,"skillRaw":"Water Pulse (Target = [1(Line(2)(1))], Damage: 1, 30% Confuse)"})
    ], {"evoCost":6,"evoTo":"Gastrodon","color":"#185FA5"}
  ),

  "Gastrodon": Pkmn(423, ["Water", "Ground"], 2, [12, 2, 2], "Def",
    "Storm Drain - When an enemy Water-type Pokémon uses a normal attack or skill, heal 1 HP",
    [
      S("Muddy Water", "Cone(2)", 2, {"skillRaw":"Muddy Water (Target = [1(Cone(2))], Damage: 2, Lowers enemy accuracy 1 stage)"})
    ], {"evoFrom":"Shellos","color":"#185FA5"}
  ),

  "Ambipom": Pkmn(424, ["Normal"], 2, [13, 5, 0], "Atk",
    "Skill Link - After using a skill, roll a d20. If the result is higher than 10, deal +50% extra damage to the targets",
    [
      S("Double Hit", "Line(1)(1)", 5, {"skillRaw":"Double Hit (Target = [2(Line(1)(1))], Damage: 5)"})
    ], {"evoFrom":"Aipom","color":"#5F5E5A"}
  ),

  "Drifloon": Pkmn(425, ["Ghost", "Flying"], 2, [10, 1, 0], "Support",
    "Aftermath - Deals 2 damage to melee attacker when defeated",
    [
      S("Ominous Wind", "Line(2)(1)", 1, {"skillRaw":"Ominous Wind (Target = [1(Line(2)(1))], Damage: 1, Chance to buff self)"})
    ], {"evoCost":6,"evoTo":"Drifblim","color":"#3C3489"}
  ),

  "Drifblim": Pkmn(426, ["Ghost", "Flying"], 2, [16, 4, 0], "Support",
    "Aftermath - Deals 4 damage to melee attacker when defeated",
    [
      S("Phantom Force", "Line(3)(1)", 4, {"skillRaw":"Phantom Force (Target = [1(Line(3)(1))], Damage: 4, Infiltrates defenses)"})
    ], {"evoFrom":"Drifloon","color":"#3C3489"}
  ),

  "Buneary": Pkmn(427, ["Normal"], 2, [6, 2, 0], "Atk",
    "Run Away - Immune to trapping/movement locks",
    [
      S("Pound", "Line(1)(1)", 1, {"skillRaw":"Pound (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Lopunny","color":"#5F5E5A"}
  ),

  "Lopunny": Pkmn(428, ["Normal"], 2, [12, 4, 0], "Atk",
    " - ",
    [
      S("Return", "Line(2)(1)", 2, {"skillRaw":"Return (Target = [1(Line(2)(1))], Damage: 2)"})
    ], {"evoFrom":"Buneary Ability: Limber (The Pokémon is protected from paralysis)","color":"#5F5E5A"}
  ),

  "Mismagius": Pkmn(429, ["Ghost"], 2, [12, 4, 1], "Support",
    "Levitate - Immune to Ground-type skill damage",
    [
      S("Shadow Ball", "Line(3)(1)", 4, {"skillRaw":"Shadow Ball (Target = [1(Line(3)(1))], Damage: 4,Lowers enemy def-1)"})
    ], {"evoFrom":"Misdreavus","color":"#3C3489"}
  ),

  "Honchkrow": Pkmn(430, ["Dark", "Flying"], 2, [14, 5, 0], "Atk",
    "Ability: Moxie - When this Pokémon defeats an enemy, gain Atk +1, Max 4",
    [
      S("Night Slash", "Line(2)(1)", 2, {"skillRaw":"Night Slash (Target = [1(Line(2)(1))], Damage: 2, High crit)"})
    ], {"evoFrom":"Murkrow","color":"#5F5E5A"}
  ),

  "Glameow": Pkmn(431, ["Normal"], 2, [6, 2, 0], "Atk",
    "Keen Eye - This Pokémon cannot have its accuracy reduced",
    [
      S("Fake Out", "Line(1)(1)", 1, {"skillRaw":"Fake Out (Target = [1(Line(1)(1))], Damage: 1, Flinches target if used first)"})
    ], {"evoCost":6,"evoTo":"Purugly","color":"#5F5E5A"}
  ),

  "Purugly": Pkmn(432, ["Normal"], 2, [13, 4, 0], "Atk",
    "Defiant - Gains Atk +2 while affected by any negative stat modifier (washes away when debuff ends)",
    [
      S("Body Slam", "Line(1)(1)", 2, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Body Slam (Target = [1(Line(1)(1))], Damage: 2, 30% Paralysis)"})
    ], {"evoFrom":"Glameow","color":"#5F5E5A"}
  ),

  "Chingling": Pkmn(433, ["Psychic"], 2, [5, 1, 0], "Support",
    "Levitate - Immune to Ground-type skill damage",
    [
      S("Wrap", "Line(1)(1)", 0, {"skillRaw":"Wrap (Target = [1(Line(1)(1))], Locks enemy movement)"})
    ], {"evoCost":5,"evoTo":"Chimecho","color":"#993556"}
  ),

  "Stunky": Pkmn(434, ["Poison", "Dark"], 3, [7, 2, 0], "Atk",
    "Stench - Basic attacks have a 10% chance to flinch target",
    [
      S("Smokescreen", "AoE(1)", 0, {"skillRaw":"Smokescreen (Target = [1(AoE(1))], Reduce enemy Accuracy 3 stage for 2 turns)"})
    ], {"evoCost":6,"evoTo":"Skuntank","color":"#72243E"}
  ),

  "Skuntank": Pkmn(435, ["Poison", "Dark"], 3, [10, 5, 0], "Atk",
    " - ",
    [
      S("Smokescreen", "AoE(2)", 0, {"skillRaw":"Smokescreen (Target = [1(AoE(2))], Reduce enemy Accuracy 4 stage for 2 turns)"})
    ], {"evoFrom":"Stunky Ability: Aftermath (Deals 2 damage to melee attacker when defeated)","color":"#72243E"}
  ),

  "Bronzor": Pkmn(436, ["Steel", "Psychic"], 2, [7, 1, 2], "Def",
    "Heavy Metal - Immune to knockback effects",
    [
      S("Confusion", "Line(2)(1)", 1, {"skillRaw":"Confusion (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Bronzong","color":"#993556"}
  ),

  "Bronzong": Pkmn(437, ["Steel", "Psychic"], 2, [13, 3, 3], "Def",
    "Heavy Metal - Immune to knockback effects",
    [
      S("Gyro Ball", "Line(2)(1)", 2, {"skillRaw":"Gyro Ball (Target = [1(Line(2)(1))], Damage = 2 + your remaining movement points)"})
    ], {"evoFrom":"Bronzor","color":"#993556"}
  ),

  "Bonsly": Pkmn(438, ["Rock"], 2, [6, 2, 1], "Def",
    "Rock Head - Immune to recoil",
    [
      S("Rock Throw", "Line(2)(1)", 1, {"skillRaw":"Rock Throw (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":5,"evoTo":"Sudowoodo","color":"#854F0B"}
  ),

  "Mime Jr.": Pkmn(439, ["Psychic", "Fairy"], 2, [5, 1, 0], "Support",
    "Filter - Reduces incoming super-effective damage by 1",
    [
      S("Copycat", "Line(1)(1)", 0, {"skillRaw":"Copycat (Copies the last used enemy skill in range)"})
    ], {"evoCost":5,"evoTo":"Mr. Mime","color":"#C96BAA"}
  ),

  "Happiny": Pkmn(440, ["Normal"], 3, [15, 1, 0], "Support",
    "Natural Cure - Cures all status conditions upon turn end",
    [
      S("Refresh", "AoE(0)", 0, {"skillRaw":"Refresh (Target = [1(AoE(0))], Cures all status conditions on self)"})
    ], {"evoCost":6,"evoTo":"Chansey","color":"#5F5E5A"}
  ),

  "Chatot": Pkmn(441, ["Normal", "Flying"], 2, [11, 3, 0], "Support",
    "Keen Eye - Accuracy cannot be lowered by enemies",
    [
      S("Chatter", "Line(3)(1)", 1, {"statusChance":"confuse","statusChanceValue":0.3,"skillRaw":"Chatter (Target = [1(Line(3)(1))], Damage: 1, Confuses target for 3 turns)"})
    ], {"color":"#5F5E5A"}
  ),

  "Spiritomb": Pkmn(442, ["Ghost", "Dark"], 4, [13, 4, 3], "Def",
    "Ability: Infiltrator - Ignores damage reduction and damage-blocking skills",
    [
      S("Will-O-Wisp", "Line(2)(1)", 0, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Will-O-Wisp (Target = [1(Line(2)(1))], Inflict Burn for 3 turns, 100% chance)"})
    ], {"color":"#3C3489"}
  ),

  "Gible": Pkmn(443, ["Dragon", "Ground"], 3, [7, 2, 0], "Atk",
    "Rough Skin - Deals 1 damage to melee attackers",
    [
      S("Sand Tomb", "Line(1)(1)", 1, {"skillRaw":"Sand Tomb (Target = [1(Line(1)(1))], Damage: 1, Traps enemy)"})
    ], {"evoCost":7,"evoTo":"Gabite","color":"#854F0B"}
  ),

  "Gabite": Pkmn(444, ["Dragon", "Ground"], 3, [11, 4, 0], "Atk",
    "Rough Skin - Deals 1 damage to melee attackers",
    [
      S("Slash", "Line(2)(1)", 2, {"skillRaw":"Slash (Target = [1(Line(2)(1))], Damage: 2, High crit chance)"})
    ], {"evoCost":9,"evoTo":"Garchomp","color":"#854F0B"}
  ),

  "Garchomp": Pkmn(445, ["Dragon", "Ground"], 3, [16, 6, 0], "assasin",
    "Rough Skin - Deals 1 damage to melee attackers",
    [
      S("Dragon Claw", "Line(3)(1)", 3, {"skillRaw":"Dragon Claw (Target = [1(Line(3)(1))], Damage: 3)"})
    ], {"evoFrom":"Gabite Ability: Rough Skin (Deals 1 damage to melee attackers) Skill: Dragon Claw (Target = [1(Line(3)(1))], Damage: 3)","color":"#854F0B"}
  ),

  "Munchlax": Pkmn(446, ["Normal"], 4, [11, 2, 2], "Def",
    "Thick Fat - Immune to Fire and Ice secondary status effects",
    [
      S("Tackle", "Line(1)(1)", 2, {"skillRaw":"Tackle (Target = [1(Line(1)(1))], Damage: 2)"})
    ], {"evoCost":8,"evoTo":"Snorlax","color":"#5F5E5A"}
  ),

  "Riolu": Pkmn(447, ["Fighting"], 3, [7, 2, 0], "Atk",
    "Inner Focus - Immune to Flinch effects",
    [
      S("Quick Attack", "Line(2)(1)", 2, {"skillRaw":"Quick Attack (Target = [1(Line(2)(1))], Damage: 2, Strike first)"})
    ], {"evoCost":7,"evoTo":"Lucario","color":"#A63D2E"}
  ),

  "Lucario": Pkmn(448, ["Fighting", "Steel"], 3, [13, 5, 0], "Atk",
    " - ",
    [
      S("Aura Sphere", "Line(4)(1)", 5, {"skillRaw":"Aura Sphere (Target = [1(Line(4)(1))], Damage: 5, Never misses)"})
    ], {"evoFrom":"Riolu Ability: Inner Focus (Immune to confuse effects)","color":"#A63D2E"}
  ),

  "Hippopotas": Pkmn(449, ["Ground"], 2, [8, 2, 1], "Def",
    "Sand Stream - Changes weather to Sandstorm for 5 turns on deploy",
    [
      S("Mud-Slap", "Line(1)(1)", 1, {"skillRaw":"Mud-Slap (Target = [1(Line(1)(1))], Damage: 1, Lowers enemy accuracy)"})
    ], {"evoCost":6,"evoTo":"Hippowdon","color":"#854F0B"}
  ),

  "Hippowdon": Pkmn(450, ["Ground"], 2, [15, 4, 3], "Def",
    "Sand Stream - Changes weather to Sandstorm indefinitely on deploy",
    [
      S("Earthquake", "AoE(2)", 2, {"skillRaw":"Earthquake (Target = [1(AoE(2))], Damage: 2)"})
    ], {"evoFrom":"Hippopotas Ability: Sand Stream (Changes weather to Sandstorm indefinitely on deploy) Skill: Earthquake (Target = [1(AoE(2))], Damage: 2)","color":"#854F0B"}
  ),

  "Skorupi": Pkmn(451, ["Poison", "Bug"], 2, [7, 2, 2], "Def",
    "Battle Armor - Immune to receiving critical hits",
    [
      S("Poison Sting", "Line(1)(1)", 1, {"statusChance":"poison","statusChanceValue":0.3,"skillRaw":"Poison Sting (Target = [1(Line(1)(1))], Damage: 1, 30% Poison)"})
    ], {"evoCost":6,"evoTo":"Drapion","color":"#72243E"}
  ),

  "Drapion": Pkmn(452, ["Poison", "Dark"], 2, [14, 4, 2], "Def",
    "Sniper - Crit on 16+ naturally",
    [
      S("Cross Poison", "Line(2)(1)", 2, {"statusChance":"poison","statusChanceValue":0.3,"skillRaw":"Cross Poison (Target = [1(Line(2)(1))], Damage: 2, High crit, 30% Poison)"})
    ], {"evoFrom":"Skorupi Ability: Sniper (Crit on 16+ naturally) Skill: Cross Poison (Target = [1(Line(2)(1))], Damage: 2, High crit, 30% Poison)","color":"#72243E"}
  ),

  "Croagunk": Pkmn(453, ["Poison", "Fighting"], 2, [7, 2, 0], "Atk",
    "Dry Skin - Immune to Water, but takes extra damage from Fire skills",
    [
      S("Poison Jab", "Line(1)(1)", 1, {"statusChance":"poison","statusChanceValue":0.3,"skillRaw":"Poison Jab (Target = [1(Line(1)(1))], Damage: 1, 30% Poison)"})
    ], {"evoCost":6,"evoTo":"Toxicroak","color":"#72243E"}
  ),

  "Toxicroak": Pkmn(454, ["Poison", "Fighting"], 2, [13, 5, 0], "Atk",
    "Dry Skin - Immune to Water, heals 3 HP when hit by Water",
    [
      S("Gunk Shot", "Line(3)(1)", 2, {"statusChance":"poison","statusChanceValue":0.3,"skillRaw":"Gunk Shot (Target = [1(Line(3)(1))], Damage: 2, Inflicts Poison)"})
    ], {"evoFrom":"Croagunk Ability: Dry Skin (Immune to Water, heals 3 HP when hit by Water) Skill: Gunk Shot (Target = [1(Line(3)(1))], Damage: 2, Inflicts Poison)","color":"#72243E"}
  ),

  "Carnivine": Pkmn(455, ["Grass"], 2, [12, 4, 0], "Atk",
    "Levitate - Immune to Ground-type skill damage",
    [
      S("Power Whip", "Line(2)(1)", 2, {"skillRaw":"Power Whip (Target = [1(Line(2)(1))], Damage: 2)"})
    ], {"color":"#3B6D11"}
  ),

  "Finneon": Pkmn(456, ["Water"], 1, [6, 1, 0], "Support",
    "Swift Swim - Move costs -1 energy during Rain weather",
    [
      S("Water Gun", "Line(2)(1)", 0, {"skillRaw":"Water Gun (Target = [1(Line(2)(1))], Damage: 0)"})
    ], {"evoCost":6,"evoTo":"Lumineon","color":"#185FA5"}
  ),

  "Lumineon": Pkmn(457, ["Water"], 1, [12, 3, 1], "Support",
    "Swift Swim - Move costs -1 energy during Rain weather",
    [
      S("Captivate", "Line(2)(1)", 0, {"skillRaw":"Captivate (Target = [1(Line(2)(1))], Lowers enemy Atk drastically)"})
    ], {"evoFrom":"Finneon Ability: Swift Swim (Move costs -1 energy during Rain weather) Skill: Captivate (Target = [1(Line(2)(1))], Lowers enemy Atk drastically)","color":"#185FA5"}
  ),

  "Mantyke": Pkmn(458, ["Water", "Flying"], 2, [6, 1, 1], "Support",
    "Water Absorb - Immune to Water, heals 3 HP when struck",
    [
      S("Bubble Beam", "Line(2)(1)", 0, {"skillRaw":"Bubble Beam (Target = [1(Line(2)(1))], Damage: 0, Slows enemy)"})
    ], {"evoCost":5,"evoTo":"Mantine","color":"#185FA5"}
  ),

  "Snover": Pkmn(459, ["Grass", "Ice"], 2, [8, 2, 1], "Def",
    "Snow Warning - Changes weather to Hail for 5 turns on deploy",
    [
      S("Powder Snow", "Line(2)(1)", 1, {"skillRaw":"Powder Snow (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":7,"evoTo":"Abomasnow","color":"#3B6D11"}
  ),

  "Abomasnow": Pkmn(460, ["Grass", "Ice"], 2, [14, 4, 2], "Def",
    "Snow Warning - Changes weather to Hail indefinitely on deploy",
    [
      S("Blizzard", "AoE(2)", 2, {"statusChance":"freeze","statusChanceValue":0.3,"skillRaw":"Blizzard (Target = [1(AoE(2))], Damage: 2, 30% Freeze)"})
    ], {"evoFrom":"Snover Ability: Snow Warning (Changes weather to Hail indefinitely on deploy) Skill: Blizzard (Target = [1(AoE(2))], Damage: 2, 30% Freeze)","color":"#3B6D11"}
  ),

  "Weavile": Pkmn(461, ["Dark", "Ice"], 2, [13, 5, 0], "Atk",
    "Pressure - Enemy skills targeting user cost +1 energy",
    [
      S("Night Slash", "Line(2)(1)", 2, {"skillRaw":"Night Slash (Target = [1(Line(2)(1))], Damage: 2, High crit)"})
    ], {"evoFrom":"Sneasel","color":"#8CD16D"}
  ),

  "Magnezone": Pkmn(462, ["Electric", "Steel"], 2, [14, 4, 3], "Def",
    "Magnet Pull - Prevents adjacent Steel-type enemies from moving",
    [
      S("Thunderbolt", "Line(3)(1)", 2, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Thunderbolt (Target = [1(Line(3)(1))], Damage: 2, 30% Paralysis)"})
    ], {"evoFrom":"Magneton","color":"#BA7517"}
  ),

  "Lickilicky": Pkmn(463, ["Normal"], 2, [15, 3, 2], "Def",
    "Own Tempo - Immune to Confuse condition",
    [
      S("Body Slam", "Line(1)(1)", 1, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Body Slam (Target = [1(Line(1)(1))], Damage: 1, 30% Paralysis)"})
    ], {"evoFrom":"Lickitung","color":"#5F5E5A"}
  ),

  "Rhyperior": Pkmn(464, ["Ground", "Rock"], 3, [16, 5, 3], "Def",
    "Solid Rock - Reduces incoming super-effective damage by 1",
    [
      S("Rock Wrecker", "Line(3)(1)", 3, {"skillRaw":"Rock Wrecker (Target = [1(Line(3)(1))], Damage: 3, Must recharge next turn)"})
    ], {"evoFrom":"Rhydon","color":"#854F0B"}
  ),

  "Tangrowth": Pkmn(465, ["Grass"], 2, [15, 4, 2], "Def",
    "Regenerator - Heal 1 HP at turn end",
    [
      S("Power Whip", "Line(2)(1)", 2, {"skillRaw":"Power Whip (Target = [1(Line(2)(1))], Damage: 2)"})
    ], {"evoFrom":"Tangela","color":"#3B6D11"}
  ),

  "Electivire": Pkmn(466, ["Electric"], 3, [14, 5, 0], "Atk",
    "Motor Drive - Gains speed/energy bonus when hit by Electric skills",
    [
      S("Thunder Punch", "Line(1)(1)", 2, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Thunder Punch (Target = [1(Line(1)(1))], Damage: 2, 30% Paralysis)"})
    ], {"evoFrom":"Electabuzz","color":"#BA7517"}
  ),

  "Magmortar": Pkmn(467, ["Fire"], 3, [14, 5, 0], "Atk",
    "Flame Body - 30% chance to burn melee attackers",
    [
      S("Fire Punch", "Line(1)(1)", 2, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Fire Punch (Target = [1(Line(1)(1))], Damage: 2, 30% Burn)"})
    ], {"evoFrom":"Magmar","color":"#D85A30"}
  ),

  "Togekiss": Pkmn(468, ["Fairy", "Flying"], 2, [14, 4, 1], "Support",
    "Serene Grace - Doubles activation chance of secondary skill effects",
    [
      S("Air Slash", "Line(3)(1)", 2, {"skillRaw":"Air Slash (Target = [1(Line(3)(1))], Damage: 2, 60% Flinch chance due to ability)"})
    ], {"evoFrom":"Togetic","color":"#C96BAA"}
  ),

  "Yanmega": Pkmn(469, ["Bug", "Flying"], 2, [14, 4, 0], "Atk",
    "Speed Boost - Gains +1 extra movement tile every 3 turns",
    [
      S("Bug Buzz", "Cone(2)", 2, {"skillRaw":"Bug Buzz (Target = [1(Cone(2))], Damage: 2)"})
    ], {"evoFrom":"Yanma","color":"#6D8E1E"}
  ),

  "Leafeon": Pkmn(470, ["Grass"], 2, [13, 4, 0], "Atk",
    "Chlorophyll - Move costs -1 energy during Sun weather",
    [
      S("Leaf Blade", "Line(2)(1)", 2, {"skillRaw":"Leaf Blade (Target = [1(Line(2)(1))], Damage: 2, High crit chance)"})
    ], {"evoFrom":"Eevee","color":"#3B6D11"}
  ),

  "Glaceon": Pkmn(471, ["Ice"], 2, [13, 4, 0], "Atk",
    "Snow Cloak - Immune to Hail weather chip damage",
    [
      S("Ice Beam", "Line(3)(1)", 2, {"statusChance":"freeze","statusChanceValue":0.3,"skillRaw":"Ice Beam (Target = [1(Line(3)(1))], Damage: 2, 30% Freeze)"})
    ], {"evoFrom":"Eevee","color":"#8CD16D"}
  ),

  "Gliscor": Pkmn(472, ["Ground", "Flying"], 2, [14, 4, 2], "Def",
    "Hyper Cutter - User's Atk stat cannot be lowered by enemies",
    [
      S("Earthquake", "AoE(2)", 2, {"skillRaw":"Earthquake (Target = [1(AoE(2))], Damage: 2)"})
    ], {"evoFrom":"Gligar","color":"#854F0B"}
  ),

  "Mamoswine": Pkmn(473, ["Ice", "Ground"], 3, [16, 5, 2], "Def",
    "Thick Fat - Immune to Fire and Ice secondary status effects",
    [
      S("Icicle Crash", "Line(3)(1)", 2, {"skillRaw":"Icicle Crash (Target = [1(Line(3)(1))], Damage: 2, 30% Flinch)"})
    ], {"evoFrom":"Piloswine","color":"#854F0B"}
  ),

  "Porygon-Z": Pkmn(474, ["Normal"], 2, [13, 5, 0], "Atk",
    "Adaptability - Deals +1 extra damage when using matching type skills",
    [
      S("Tri Attack", "Line(3)(1)", 2, {"skillRaw":"Tri Attack (Target = [1(Line(3)(1))], Damage: 2, Random status chance)"})
    ], {"evoFrom":"Porygon2","color":"#5F5E5A"}
  ),

  "Gallade": Pkmn(475, ["Psychic", "Fighting"], 3, [13, 5, 0], "Atk",
    "Steadfast - Gains bonus movement space when flinched",
    [
      S("Close Combat", "Line(1)(1)", 3, {"skillRaw":"Close Combat (Target = [1(Line(1)(1))], Damage: 3, User Def -1 for 2 turns)"})
    ], {"evoFrom":"Kirlia","color":"#993556"}
  ),

  "Probopass": Pkmn(476, ["Rock", "Steel"], 2, [14, 2, 3], "Def",
    "Magnet Pull - Prevents adjacent Steel-type enemies from moving",
    [
      S("Power Gem", "Line(3)(1)", 1, {"skillRaw":"Power Gem (Target = [1(Line(3)(1))], Damage: 1)"})
    ], {"evoFrom":"Nosepass","color":"#854F0B"}
  ),

  "Dusknoir": Pkmn(477, ["Ghost"], 2, [12, 4, 3], "Def",
    "Pressure - Enemy skills targeting user cost +1 energy",
    [
      S("Shadow Punch", "Line(2)(1)", 2, {"skillRaw":"Shadow Punch (Target = [1(Line(2)(1))], Damage: 2, Never misses)"})
    ], {"evoFrom":"Dusclops","color":"#3C3489"}
  ),

  "Froslass": Pkmn(478, ["Ice", "Ghost"], 2, [13, 4, 0], "Atk",
    "Snow Cloak - 20% to dodge an attack if in hail",
    [
      S("Blizzard", "AoE(2)", 2, {"statusChance":"freeze","statusChanceValue":0.3,"skillRaw":"Blizzard (Target = [1(AoE(2))], Damage: 2, 30% Freeze)"})
    ], {"evoFrom":"Snorunt","color":"#3C3489"}
  ),

  "Rotom": Pkmn(479, ["Electric", "Ghost"], 2, [11, 3, 1], "Support",
    "Appliance Shift - Rotom changes form based on the most type exist on your team (e.g. Charizard : fire , groundon, fire + ground , another fire) , Fire → Heat Rotom , Water → Wash , Rotom Ice → Frost , Rotom Flying → Fan , Rotom Grass → Mow Rotom,If no type has the highest count, Rotom remains in Normal Form (Ghost)",
    [
      S("Appliance Pulse", "Appliance Pulse", 0, {"skillRaw":"Appliance Pulse"})
    ], {"color":"#BA7517"}
  ),

  "Uxie": Pkmn(480, ["Psychic"], 4, [14, 3, 3], "Def",
    "Knowledge Share , Increase Whole team def by 1 . and if there a mesprit and azelf on the team. Move point regen +1 per turn - ",
    [
      S("Psyshock", "Line(3)(1)", 3, {"skillRaw":"Psyshock (Target = [1(Line(3)(1))], Damage: 3, Targets physical armor status)"})
    ], {"color":"#993556"}
  ),

  "Mesprit": Pkmn(481, ["Psychic"], 4, [14, 4, 1], "Support",
    "Emotional Aura - When ally use a skill, Heal that ally HP by 1 , and if there azelt and uxie in the team. it gain a an ability button to choose ally to buff. +2 Atk. the buff disappear once the player end the turn. (once per turn",
    [
      S("Psychic", "Line(3)(1)", 2, {"skillRaw":"Psychic (Targest = [1(Line(3)(1))], Damage: 2)"})
    ], {"color":"#993556"}
  ),

  "Azelf": Pkmn(482, ["Psychic"], 4, [14, 5, 0], "Atk",
    "Fighting Spirit (all ally gain 1 Atk. and if there mesprit and uxie on the team . max movepoint +1. - ",
    [
      S("Extrasensory", "Line(3)(1)", 2, {"skillRaw":"Extrasensory (Target = [1(Line(3)(1))], Damage: 2, 30% Flinch)"})
    ], {"color":"#993556"}
  ),

  "Dialga": Pkmn(483, ["Steel", "Dragon"], 6, [16, 5, 3], "Def",
    "Time Distortion - Your team gains Max Move Point +1. When an enemy is defeated or an ally faints, gain 1 Energy Point",
    [
      S("Roar of Time", "AoE(2)", 0, {"skillRaw":"Roar of Time (Target = [3(AoE(2))], Damage 7, Cost: 4 Energy Point)"}),
      S("Flash Cannon", "Line(4)(1)", 3, {"skillRaw":"Flash Cannon (Target = [1(Line(4)(1))], Damage: 3, Reduce target Def -1)"}),
      S("Time Lock", "AoE(1)", 0, {"skillRaw":"Time Lock (Target = [1(AoE(1))], Enemies cannot gain buffs next turn)"})
    ], {"color":"#5F5E5A"}
  ),

  "Palkia": Pkmn(484, ["Water", "Dragon"], 6, [16, 6, 0], "Atk",
    "Spatial Control - Once per turn, choose 1 ally on the field and teleport it into Palkia's AoE(2) range",
    [
      S("Spacial Rend", "Target = [1(Line(4)(1))]", 6, {"skillRaw":"Spacial Rend (Target = [1(Line(4)(1))]), Damage: 6, Ignore Def."}),
      S("Aqua Ring", "Target = [1(self)]", 0, {"skillHeal":1,"skillHealTarget":"self","skillRaw":"Aqua Ring (Target = [1(self)]), Heal 1 HP to self"}),
      S("Chilling Water", "Target = [1(AoE(2))]", 2, {
        "skillEffect": {"stat": "atk", "amount": -1, "duration": 2, "target": "enemy"},
        "skillRaw": "Chilling Water (Target = [1(AoE(2))]), Damage: 2, Atk -1 for 2 turns"
      })
    ], {"color":"#185FA5"}
  ),

  "Heatran": Pkmn(485, ["Fire", "Steel"], 5, [15, 4, 3], "Def",
    "Flash Fire - Immune to Fire, receiving Fire skills boosts Fire skill power",
    [
      S("Magma Storm", "Target = [1(AoE(1))]", 2, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Magma Storm (Target = [1(AoE(1))]), Damage: 2, 30% Burn"}),
      S("Overheat", "Target = [1(AoE(2))]", 6, {
        "selfDamage": 2,
        "skillRaw": "Overheat (Target = [1(AoE(2))]), Damage: 6, User takes 2 recoil damage."
      })
    ], {"color":"#D85A30"}
  ),

  "Regigigas": Pkmn(486, ["Normal"], 6, [12, 4, 3], "Def",
    "Slow Start - Regigigas is locked for the first 15 turns. Click Awake at turn 16+ to unlock early. At turn 21 it wakes automatically, gaining push/pull immunity and +1 team Max MP and MP regen. Each turn asleep from 16 to 19, it gains +2 Max HP, +2 HP, and +1 Atk.",
    [
      S("Double Edge", "Target = [1(Line(3)(1))]", 8, {
        "selfDamage": 3,
        "skillRaw": "Double Edge (Target = [1(Line(3)(1))]), Damage: 8, User takes 3 recoil damage."
      }),
      S("Crush Grip", "Target = [1(Line(3)(1))]", 0, {"skillCost":3,"skillRaw":"Crush Grip (Target = [1(Line(3)(1))]), Damage based on target current HP (Cost: 3)"}),
      S("Giga Impact", "Target = [1(Line(2)(1))]", 12, {"skillCost":4,"skillRaw":"Giga Impact (Target = [1(Line(2)(1))]), Damage: 12, Recharge next turn (Cost: 4)"})
    ], {"color":"#5F5E5A"}
  ),

  "Giratina": Pkmn(487, ["Ghost", "Dragon"], 6, [16, 5, 3], "Def",
    "Pressure - When Giratina is summoned, create a movable Soul Prison adjacent to Giratina. Whenever a Pokémon faints, Soul Prison gains 2 Max HP, Giratina heals 2 HP, and gains permanent Skill Damage +1 (max +8).",
    [
      S("Distortion Rift", "Target = [1(AoE(2))]", 5, {"skillRaw":"Distortion Rift (Target = [1(AoE(2))]), Damage: 5, Reduce enemy movement points by 1"}),
      S("Shadow Force", "Target = [1(Line(3)(1))]", 3, {"skillRaw":"Shadow Force (Target = [1(Line(3)(1))]), Damage: 3, Ignores shields and protection effects"}),
      S("Phantom Grasp", "Target = [1(Line(3)(1))]", 3, {
        "pullAmount": 1,
        "skillRaw": "Phantom Grasp (Target = [1(Line(3)(1))]), Damage: 3, Pull target 1 tile toward Giratina"
      })
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Legendary","color":"#3C3489"}
  ),

  "Cresselia": Pkmn(488, ["Psychic"], 5, [16, 3, 3], "Def",
    "Lunar Veil (At the start of your turn, grant Lunar Veil to the nearest ally within AoE 1 for 3 turns. Lunar Veil blocks the next negative status effect once and is then removed. - ",
    [
      S("Moonlight", "AoE(0)", 0, {"skillHeal":4,"skillHealTarget":"self","skillRaw":"Moonlight (Target = [1(AoE(0))], Override skillDmg: 0, Heal user 4 HP)"}),
      S("Psybeam", "Line(3)(1)", 3, {"skillRaw":"Psybeam (Target = [1(Line(3)(1))], Damage: 3, Reduce target Skill Damage by 1 next turn)"}),
      S("Lunar Pulse", "AoE(1)", 2, {"statusChance":"sleep","statusChanceValue":0.5,"skillRaw":"Lunar Pulse (Target = [1(AoE(1))], Damage: 2, Put the target to Sleep for 1 turn)"})
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Legendary","color":"#993556"}
  ),

  "Phione": Pkmn(489, ["Water"], 1, [4, 3, 1], "Support",
    "Ocean Heart - At the start of your turn, allies within AoE 1 heal 1 HP and remove Burn and Poison effects",
    [
      S("Whirlpool", "Line(2)(1)", 1, {"skillRaw":"Whirlpool (Target = [1(Line(2)(1))], Damage: 1, Restricts movement)"})
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Legendary","color":"#185FA5"}
  ),

  "Manaphy": Pkmn(490, ["Water"], 5, [11, 5, 1], "Support",
    "Hydration - Cures status conditions naturally during Rain weather",
    [
      S("Sea Call", "self", 0, {"skillRaw":"Sea Call (Target = self Summon 1 Phione nearby for 3 turns)"})
    ], {"color":"#185FA5"}
  ),

  "Darkrai": Pkmn(491, ["Dark"], 5, [13, 5, 0], "Atk",
    "Bad Dreams - Sleeping Pokémon on the board take 1 true damage at the start of their turn, ignoring shields, protection, and damage reduction effects",
    [
      S("Dark Void", "AoE(1)", 0, {"statusChance":"sleep","statusChanceValue":0.5,"skillRaw":"Dark Void (Target = [2(AoE(1))], Inflict Sleep for 2 turns, 100% chance)"}),
      S("Nightmare", "Unit)", 4, {"statusChance":"sleep","statusChanceValue":0.5,"skillRaw":"Nightmare (Target = [1(Unit))], Damage: 4, Deal +2 true damage if target is asleep)"}),
      S("Shadow Burst", "Line(3)(1)", 3, {"skillRaw":"Shadow Burst (Target = [1(Line(3)(1))], Damage: 3, Target uses +1 movement point when moving next turn)"})
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Legendary","color":"#5F5E5A"}
  ),

  "Shaymin": Pkmn(492, ["Grass"], 5, [8, 4, 1], "Support",
    "Ability: Gracidea Bloom - At the start of battle, Shaymin gains +1 Max HP for each allied Grass Pokémon",
    [
      S("Seed Flare", "Line(3)(1)", 4, {"skillRaw":"Seed Flare (Target = [1(Line(3)(1))], Damage: 4, Reduce target Def by 1)"}),
      S("Aromatherapy", "All Allies", 0, {"skillRaw":"Aromatherapy (Target = [All Allies], Override skillDmg: 0, Remove all negative status effects)"}),
      S("Nature Pulse", "All(AoE(1))", 0, {"skillRaw":"Nature Pulse (Target = [All(AoE(1))], Heal allies hit for 2 HP)"})
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Legendary","color":"#3B6D11"}
  ),

  "Arceus": Pkmn(493, ["Normal"], 7, [16, 6, 3], "Def",
    "Divine Origin - At the start of battle, Arceus gains bonuses based on the types present on the board. Fire: +1 Skill Damage, Water: Heal 1 HP after casting a skill, Grass: +2 Max HP, Electric: The first movement each turn costs no movement points, Ghost: Skills ignore shields, Steel: +1 Def, Dragon: Skills cost 1 less Energy, Psychic: Skills have -1 cooldown, Dark: Deal +1 true damage, Fairy: Adjacent allies take -1 damage",
    [
      S("Judgment", "AoE(1)", 6, {"skillRaw":"Judgment (Target = [1(AoE(1))], Damage: 6, Gain additional effects based on Arceus's current bonuses)"})
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Legendary","color":"#5F5E5A"}
  ),

  "Victini": Pkmn(494, ["Psychic", "Fire"], 5, [14, 4, 1], "Support",
    "Victory Star - At the start of your turn, the allied Pokémon with the highest Atk gains +1 damage this turn",
    [
      S("V-Create", "Cone(3)", 5, {"skillRaw":"V-Create (Target = [1(Cone(3))], Damage: 5, Reduce user's Def by 1 next turn)"})
    ], {"evoCost":30,"legendary":true,"hatchCost":30,"hatchGroup":"Mythical","color":"#D85A30"}
  ),

  "Snivy": Pkmn(495, ["Grass"], 3, [7, 2, 0], "Support",
    "Overgrow - When HP ≤ 50%, deal +1 damage with Grass skills",
    [
      S("Vine Whip", "Line(2)(1)", 1, {"skillRaw":"Vine Whip (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Servine","color":"#3B6D11"}
  ),

  "Servine": Pkmn(496, ["Grass"], 3, [10, 3, 1], "Support",
    " - ",
    [
      S("Mega Drain", "Line(2)(1)", 1, {"skillHeal":1,"skillHealTarget":"self","skillRaw":"Mega Drain (Target = [1(Line(2)(1))], Damage: 1, Heal user 1 HP)"})
    ], {"evoCost":8,"evoTo":"Serperior","color":"#3B6D11"}
  ),

  "Serperior": Pkmn(497, ["Grass"], 3, [14, 4, 1], "Support",
    " - ",
    [
      S("Leaf Storm", "Cone(2)", 2, {"skillRaw":"Leaf Storm (Target = [1(Cone(2))], Damage: 2, User Atk -1 for 2 turns)"})
    ], {"evoFrom":"Servine Ability: Overgrow (When HP ≤ 50%, deal +1 damage with Grass skills)","color":"#3B6D11"}
  ),

  "Tepig": Pkmn(498, ["Fire"], 3, [8, 2, 0], "Atk",
    "Blaze - When HP ≤ 50%, deal +1 damage with Fire skills",
    [
      S("Ember", "Line(2)(1)", 1, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Ember (Target = [1(Line(2)(1))], Damage: 1, 30% chance to inflict Burn for 3 turns)"})
    ], {"evoCost":6,"evoTo":"Pignite","color":"#D85A30"}
  ),

  "Pignite": Pkmn(499, ["Fire", "Fighting"], 3, [11, 4, 0], "Atk",
    " - ",
    [
      S("Flame Charge", "Line(2)(1)", 2, {"skillRaw":"Flame Charge (Target = [1(Line(2)(1))], Damage: 2)"})
    ], {"evoCost":8,"evoTo":"Emboar","color":"#D85A30"}
  ),

  "Emboar": Pkmn(500, ["Fire", "Fighting"], 3, [15, 5, 0], "Atk",
    " - ",
    [
      S("Flare Blitz", "Line(2)(1)", 3, {"selfDamage":1,"skillRaw":"Flare Blitz (Target = [1(Line(2)(1))], Damage: 3, User takes 1 recoil damage)"})
    ], {"evoFrom":"Pignite Ability: Blaze (When HP ≤ 50%, deal +1 damage with Fire skills)","color":"#D85A30"}
  ),

  "Oshawott": Pkmn(501, ["Water"], 3, [7, 2, 0], "Support",
    "Torrent - When HP ≤ 50%, deal +1 damage with Water skills",
    [
      S("Water Gun", "Line(2)(1)", 1, {"skillRaw":"Water Gun (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Dewott","color":"#185FA5"}
  ),

  "Dewott": Pkmn(502, ["Water"], 3, [10, 3, 0], "Support",
    " - ",
    [
      S("Razor Shell", "Line(1)(1)", 1, {"skillRaw":"Razor Shell (Target = [1(Line(1)(1))], Damage: 1, 30% chance to lower enemy Def)"})
    ], {"evoCost":8,"evoTo":"Samurott","color":"#185FA5"}
  ),

  "Samurott": Pkmn(503, ["Water"], 3, [14, 4, 1], "Support",
    "Torrent - When HP ≤ 50%, deal +1 damage with Water skills",
    [
      S("Hydro Pump", "Line(4)(1)", 2, {"skillRaw":"Hydro Pump (Target = [1(Line(4)(1))], Damage: 2)"})
    ], {"evoFrom":"Dewott Ability: Torrent (When HP ≤ 50%, deal +1 damage with Water skills) Skill: Hydro Pump (Target = [1(Line(4)(1))], Damage: 2)","color":"#185FA5"}
  ),

  "Patrat": Pkmn(504, ["Normal"], 1, [6, 2, 0], "Support",
    "Alert Eyes - Nearby Normal allies cannot be ambushed or pulled",
    [
      S("Bite", "Line(1)(1)", 1, {"skillRaw":"Bite (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":5,"evoTo":"Watchog","color":"#5F5E5A"}
  ),

  "Watchog": Pkmn(505, ["Normal"], 1, [11, 4, 0], "Support",
    "Alert Eyes - Nearby Normal allies cannot be ambushed or pulled",
    [
      S("Hypnosis", "Line(2)(1)", 0, {"statusChance":"sleep","statusChanceValue":0.5,"skillRaw":"Hypnosis (Target = [1(Line(2)(1))], Inflict Sleep for 2 turns)"})
    ], {"evoFrom":"Patrat","color":"#5F5E5A"}
  ),

  "Lillipup": Pkmn(506, ["Normal"], 2, [6, 2, 0], "Atk",
    "Pickup - Sometimes finds extra energy items",
    [
      S("Tackle", "Line(1)(1)", 2, {"skillRaw":"Tackle (Target = [1(Line(1)(1))], Damage: 2)"})
    ], {"evoCost":5,"evoTo":"Herdier","color":"#5F5E5A"}
  ),

  "Herdier": Pkmn(507, ["Normal"], 2, [10, 3, 0], "Atk",
    " - ",
    [
      S("Take Down", "Line(1)(1)", 4, {"selfDamage":1,"skillRaw":"Take Down (Target = [1(Line(1)(1))], Damage: 4, User takes 1 recoil damage)"})
    ], {"evoCost":7,"evoTo":"Stoutland","color":"#5F5E5A"}
  ),

  "Stoutland": Pkmn(508, ["Normal"], 2, [14, 5, 0], "Atk",
    " - ",
    [
      S("Giga Impact", "Line(2)(1)", 3, {"skillRaw":"Giga Impact (Target = [1(Line(2)(1))], Damage: 3, Must recharge next turn)"})
    ], {"evoFrom":"Herdier Ability: Intimidate (Adjacent enemies -1 Atk for 2 turns)","color":"#5F5E5A"}
  ),

  "Purrloin": Pkmn(509, ["Dark"], 2, [6, 2, 0], "Atk",
    "Limber - Immune to Paralysis condition",
    [
      S("Scratch", "Line(1)(1)", 1, {"skillRaw":"Scratch (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Liepard","color":"#5F5E5A"}
  ),

  "Liepard": Pkmn(510, ["Dark"], 2, [12, 4, 0], "Atk",
    "Limber - Immune to Paralysis condition",
    [
      S("Night Slash", "Line(2)(1)", 2, {"skillRaw":"Night Slash (Target = [1(Line(2)(1))], Damage: 2, High crit)"})
    ], {"evoFrom":"Purrloin","color":"#5F5E5A"}
  ),

  "Pansage": Pkmn(511, ["Grass"], 2, [6, 2, 0], "Support",
    "Gluttony - Triggers berry/HP items at 50% HP instead of 25%",
    [
      S("Vine Whip", "Line(2)(1)", 1, {"skillRaw":"Vine Whip (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Simisage","color":"#3B6D11"}
  ),

  "Simisage": Pkmn(512, ["Grass"], 2, [13, 4, 0], "Support",
    "Jungle Spirit - Allied Simi Pokémon gain +1 Max HP",
    [
      S("Grass Pledge", "Target = [1(Line(3)(1))]", 2, {
        "skillRaw": "Grass Pledge (Target = [1(Line(3)(1))]), Damage: 2, deals +2 damage if Fire or Water Pledge was used first"
      })
    ], {"evoFrom":"Pansage","color":"#3B6D11"}
  ),

  "Pansear": Pkmn(513, ["Fire"], 2, [6, 2, 0], "Atk",
    "Gluttony - Triggers berry/HP items at 50% HP instead of 25%",
    [
      S("Incinerate", "Line(2)(1)", 1, {"skillRaw":"Incinerate (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Simisear","color":"#D85A30"}
  ),

  "Simisear": Pkmn(514, ["Fire"], 2, [13, 4, 0], "Atk",
    "Blazing Spirit - Allied Simi Pokémon gain +1 Atk",
    [
      S("Fire Pledge", "Line(3)(1)", 2, {"skillRaw":"Fire Pledge ((Target = [1(Line(3)(1))], Damage: 2)"})
    ], {"evoFrom":"Pansear","color":"#D85A30"}
  ),

  "Panpour": Pkmn(515, ["Water"], 2, [6, 2, 0], "Support",
    "Gluttony - Triggers berry/HP items at 50% HP instead of 25%",
    [
      S("Water Gun", "Line(2)(1)", 1, {"skillRaw":"Water Gun (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Simipour","color":"#185FA5"}
  ),

  "Simipour": Pkmn(516, ["Water"], 2, [13, 4, 0], "Support",
    "Flowing Spirit - When an allied Simi Pokémon uses a Berry, heal 1 additional HP",
    [
      S("Water Pledge", "Line(3)(1)", 2, {"skillRaw":"Water Pledge ((Target = [1(Line(3)(1))], Damage: 2)"})
    ], {"evoFrom":"Panpour","color":"#185FA5"}
  ),

  "Munna": Pkmn(517, ["Psychic"], 2, [8, 1, 0], "Support",
    "Synchronize - Inflicts the same status condition back to the attacker",
    [
      S("Psybeam", "Line(2)(1)", 1, {"statusChance":"confuse","statusChanceValue":0.3,"skillRaw":"Psybeam (Target = [1(Line(2)(1))], Damage: 1, 30% Confuse)"})
    ], {"evoCost":6,"evoTo":"Musharna","color":"#993556"}
  ),

  "Musharna": Pkmn(518, ["Psychic"], 2, [14, 3, 1], "Support",
    "Dream Mist - At the start of your turn, sleeping allies heal 1 HP",
    [
      S("Hypnosis", "AoE(2)", 0, {"statusChance":"sleep","statusChanceValue":0.5,"skillRaw":"Hypnosis (Target = [1(AoE(2))]), Put enemies hit to Sleep for 1 turn)"})
    ], {"evoFrom":"Munna","color":"#993556"}
  ),

  "Pidove": Pkmn(519, ["Normal", "Flying"], 1, [5, 2, 0], "Atk",
    "Super Luck - Crit on 16+ naturally",
    [
      S("Gust", "Line(2)(1)", 1, {"skillRaw":"Gust (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":5,"evoTo":"Tranquill","color":"#5F5E5A"}
  ),

  "Tranquill": Pkmn(520, ["Normal", "Flying"], 1, [9, 3, 0], "Atk",
    " - ",
    [
      S("Air Cutter", "Cone(2)", 1, {"skillRaw":"Air Cutter (Target = [1(Cone(2))], Damage: 1, High crit chance)"})
    ], {"evoCost":7,"evoTo":"Unfezant","color":"#5F5E5A"}
  ),

  "Unfezant": Pkmn(521, ["Normal", "Flying"], 1, [13, 5, 0], "Atk",
    " - ",
    [
      S("Sky Attack", "Line(3)(1)", 3, {"skillRaw":"Sky Attack (Target = [1(Line(3)(1))], Damage: 3, Charges for 1 turn)"})
    ], {"evoFrom":"Tranquill Ability: Super Luck (Crit on 16+ naturally)","color":"#5F5E5A"}
  ),

  "Blitzle": Pkmn(522, ["Electric"], 2, [6, 2, 0], "Atk",
    "Motor Drive - Gains speed/energy bonus when hit by Electric skills",
    [
      S("Spark", "Line(2)(1)", 1, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Spark (Target = [1(Line(2)(1))], Damage: 1, 30% Paralysis)"})
    ], {"evoCost":6,"evoTo":"Zebstrika","color":"#BA7517"}
  ),

  "Zebstrika": Pkmn(523, ["Electric"], 2, [13, 4, 0], "Atk",
    " - ",
    [
      S("Wild Charge", "Line(2)(1)", 3, {"selfDamage":1,"skillRaw":"Wild Charge (Target = [1(Line(2)(1))], Damage: 3, User takes 1 recoil damage)"})
    ], {"evoFrom":"Blitzle Ability: Motor Drive (Gains speed/energy bonus when hit by Electric skills)","color":"#BA7517"}
  ),

  "Roggenrola": Pkmn(524, ["Rock"], 3, [7, 2, 1], "Def",
    "Sturdy - Cannot be OHKO'd from maximum health",
    [
      S("Rock Throw", "Line(2)(1)", 1, {"skillRaw":"Rock Throw (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":5,"color":"#854F0B"}
  ),

  "Boldore": Pkmn(525, ["Rock"], 3, [11, 3, 2], "Def",
    "Sturdy - Cannot be OHKO'd from maximum health",
    [
      S("Power Gem", "Line(3)(1)", 1, {"skillRaw":"Power Gem (Target = [1(Line(3)(1))], Damage: 1)"})
    ], {"evoCost":8,"evoTo":"Gigalith","color":"#854F0B"}
  ),

  "Gigalith": Pkmn(526, ["Rock"], 3, [15, 5, 3], "Def",
    " - ",
    [
      S("Stone Edge", "Line(3)(1)", 3, {"skillRaw":"Stone Edge (Target = [1(Line(3)(1))], Damage: 3, High crit chance)"})
    ], {"evoFrom":"Boldore Ability: Sand Stream (Changes weather to Sandstorm for 5 turns on deploy)","color":"#854F0B"}
  ),

  "Woobat": Pkmn(527, ["Psychic", "Flying"], 2, [6, 2, 0], "Support",
    "Unaware - Ignores enemy stat changes during calculation",
    [
      S("Confusion", "Line(2)(1)", 1, {"skillRaw":"Confusion (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Swoobat","color":"#993556"}
  ),

  "Swoobat": Pkmn(528, ["Psychic", "Flying"], 2, [12, 3, 0], "Support",
    "Simple - Doubles the effect of stat changes on self",
    [
      S("Air Slash", "Line(3)(1)", 1, {"skillRaw":"Air Slash (Target = [1(Line(3)(1))], Damage: 1, 30% Flinch)"})
    ], {"evoFrom":"Woobat","color":"#993556"}
  ),

  "Drilbur": Pkmn(529, ["Ground"], 3, [7, 3, 0], "Atk",
    "Sand Rush - Move costs -1 energy during Sandstorm weather",
    [
      S("Mud-Slap", "Line(1)(1)", 1, {"skillRaw":"Mud-Slap (Target = [1(Line(1)(1))], Damage: 1, Lowers enemy accuracy)"})
    ], {"evoCost":6,"evoTo":"Excadrill","color":"#854F0B"}
  ),

  "Excadrill": Pkmn(530, ["Ground", "Steel"], 3, [15, 5, 0], "Atk",
    "Mold Breaker - Ignores enemy defensive abilities during attacks",
    [
      S("Earthquake", "AoE(2)", 2, {"skillRaw":"Earthquake (Target = [1(AoE(2))], Damage: 2)"})
    ], {"evoFrom":"Drilbur","color":"#854F0B"}
  ),

  "Audino": Pkmn(531, ["Normal"], 3, [15, 2, 1], "Support",
    "Healing Touch - At the end of your turn, heal the lowest HP adjacent Normal ally for 1 HP",
    [
      S("Heal Pulse", "AoE(2)", 0, {"skillRaw":"Heal Pulse (Target = [1(AoE(2))], Override skillDmg: 0, Heal allies hit for 3 HP If normal type additions 1)"})
    ], {"color":"#5F5E5A"}
  ),

  "Timburr": Pkmn(532, ["Fighting"], 3, [8, 3, 0], "Atk",
    "Guts - Deals +1 damage when afflicted by status condition",
    [
      S("Low Kick", "Line(1)(1)", 1, {"skillRaw":"Low Kick (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":5,"evoTo":"Gurdurr","color":"#A63D2E"}
  ),

  "Gurdurr": Pkmn(533, ["Fighting"], 3, [11, 4, 0], "Atk",
    "Guts - Deals +1 damage when afflicted by status condition",
    [
      S("Wake-Up Slap", "Line(1)(1)", 2, {"skillRaw":"Wake-Up Slap (Target = [1(Line(1)(1))], Damage: 2)"})
    ], {"evoCost":8,"evoTo":"Conkeldurr","color":"#A63D2E"}
  ),

  "Conkeldurr": Pkmn(534, ["Fighting"], 3, [15, 5, 0], "Atk",
    "Guts - Deals +2 damage when afflicted by status condition",
    [
      S("Superpower", "Line(1)(1)", 3, {"skillRaw":"Superpower (Target = [1(Line(1)(1))], Damage: 3, User Atk/Def -1 for 2 turns)"})
    ], {"evoFrom":"Gurdurr","color":"#A63D2E"}
  ),

  "Tympole": Pkmn(535, ["Water"], 2, [6, 2, 0], "Support",
    "Swift Swim - Move costs -1 energy during Rain weather",
    [
      S("Bubble Beam", "Line(2)(1)", 1, {"skillRaw":"Bubble Beam (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":5,"evoTo":"Palpitoad","color":"#185FA5"}
  ),

  "Palpitoad": Pkmn(536, ["Water", "Ground"], 2, [10, 3, 0], "Support",
    " - ",
    [
      S("Mud Shot", "Line(2)(1)", 1, {"skillRaw":"Mud Shot (Target = [1(Line(2)(1))], Damage: 1, Slows enemy)"})
    ], {"evoCost":7,"evoTo":"Seismitoad","color":"#185FA5"}
  ),

  "Seismitoad": Pkmn(537, ["Water", "Ground"], 2, [14, 4, 1], "Support",
    "Poison Point - 30% inflict poison when hit by melee",
    [
      S("Hydro Pump", "Line(4)(1)", 2, {"skillRaw":"Hydro Pump (Target = [1(Line(4)(1))], Damage: 2)"})
    ], {"evoFrom":"Palpitoad Ability: Poison Point (30% inflict poison when hit by melee) Skill: Hydro Pump (Target = [1(Line(4)(1))], Damage: 2)","color":"#185FA5"}
  ),

  "Throh": Pkmn(538, ["Fighting"], 2, [13, 4, 2], "Def",
    "Guts - Deals +1 damage when afflicted by status condition",
    [
      S("Storm Throw", "Line(1)(1)", 2, {"skillRaw":"Storm Throw (Target = [1(Line(1)(1))], Damage: 2, Always results in a critical hit)"})
    ], {"color":"#A63D2E"}
  ),

  "Sawk": Pkmn(539, ["Fighting"], 2, [12, 4, 0], "Atk",
    "Sturdy - Cannot be OHKO'd from maximum health",
    [
      S("Close Combat", "Line(1)(1)", 3, {"skillRaw":"Close Combat (Target = [1(Line(1)(1))], Damage: 3, User Def -1 for 2 turns)"})
    ], {"color":"#A63D2E"}
  ),

  "Sewaddle": Pkmn(540, ["Bug", "Grass"], 2, [6, 2, 1], "Def",
    "Swarm - +1 damage with Bug skills when HP ≤ 50%",
    [
      S("Bug Bite", "Line(1)(1)", 1, {"skillRaw":"Bug Bite (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":5,"color":"#3B6D11"}
  ),

  "Swadloon": Pkmn(541, ["Bug", "Grass"], 2, [10, 3, 2], "Def",
    "Leaf Guard - Immune to status conditions during Sun weather",
    [
      S("Protect", "AoE(0)", 0, {"skillRaw":"Protect (Target = [1(AoE(0))], Negates next damage instance)"})
    ], {"evoCost":7,"evoTo":"Leavanny","color":"#3B6D11"}
  ),

  "Leavanny": Pkmn(542, ["Bug", "Grass"], 2, [14, 4, 2], "Def",
    "Swarm - +1 damage with Bug skills when HP ≤ 50%",
    [
      S("X-Scissor", "Line(2)(1)", 2, {"skillRaw":"X-Scissor (Target = [1(Line(2)(1))], Damage: 2)"})
    ], {"evoFrom":"Swadloon","color":"#3B6D11"}
  ),

  "Venipede": Pkmn(543, ["Bug", "Poison"], 3, [6, 2, 0], "Atk",
    "Poison Point - 30% inflict poison when hit by melee",
    [
      S("Poison Sting", "Line(1)(1)", 1, {"statusChance":"poison","statusChanceValue":0.3,"skillRaw":"Poison Sting (Target = [1(Line(1)(1))], Damage: 1, 30% Poison)"})
    ], {"evoCost":5,"evoTo":"Whirlipede","color":"#72243E"}
  ),

  "Whirlipede": Pkmn(544, ["Bug", "Poison"], 3, [9, 3, 2], "Def",
    "Speed Boost - Gains +1 extra movement tile every 3 turns",
    [
      S("Iron Defense", "AoE(0)", 0, {"skillRaw":"Iron Defense (Target = [1(AoE(0))], Def +1 for 3 turns)"})
    ], {"evoCost":8,"evoTo":"Scolipede","color":"#72243E"}
  ),

  "Scolipede": Pkmn(545, ["Bug", "Poison"], 3, [14, 5, 0], "Atk",
    "Speed Boost - Gains +1 extra movement tile every 3 turns",
    [
      S("Megahorn", "Line(2)(1)", 3, {"skillRaw":"Megahorn (Target = [1(Line(2)(1))], Damage: 3)"})
    ], {"evoFrom":"Whirlipede","color":"#72243E"}
  ),

  "Cottonee": Pkmn(546, ["Grass", "Fairy"], 2, [6, 1, 0], "Support",
    "Fairy Wind - While Whimsicott is on the field, Fairy allies gain +1 Happiness whenever they move or use a skill",
    [
      S("Stun Spore", "Line(2)(1)", 0, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Stun Spore (Target = [1(Line(2)(1))], Inflict Paralysis for 3 turns)"})
    ], {"evoCost":6,"evoTo":"Whimsicott","color":"#3B6D11"}
  ),

  "Whimsicott": Pkmn(547, ["Grass", "Fairy"], 2, [12, 3, 1], "Support",
    "Fairy Wind - While Whimsicott is on the field, Fairy allies gain +1 Happiness whenever they move or use a skill",
    [
      S("Moonblast", "Line(3)(1)", 3, {"skillRaw":"Moonblast (Target = [1(Line(3)(1))], Damage: 3, Gain +1 Happiness)"})
    ], {"evoFrom":"Cottonee","color":"#3B6D11"}
  ),

  "Petilil": Pkmn(548, ["Grass"], 2, [6, 1, 0], "Support",
    "Chlorophyll - Move costs -1 during Sun weather",
    [
      S("Sleep Powder", "Line(2)(1)", 0, {"statusChance":"sleep","statusChanceValue":0.5,"skillRaw":"Sleep Powder (Target = [1(Line(2)(1))], Inflict Sleep for 2 turns)"})
    ], {"evoCost":6,"evoTo":"Lilligant","color":"#3B6D11"}
  ),

  "Lilligant": Pkmn(549, ["Grass"], 2, [13, 3, 1], "Support",
    "Own Tempo - Immune to Confuse condition",
    [
      S("Quiver Dance", "AoE(0)", 0, {"skillRaw":"Quiver Dance (Target = [1(AoE(0))], Buffs own next skill damage and movement range)"})
    ], {"evoFrom":"Petilil","color":"#3B6D11"}
  ),

  "Basculin": Pkmn(550, ["Water"], 2, [11, 4, 0], "Atk",
    "Adaptability - Deals +1 damage when using Water skills",
    [
      S("Aqua Jet", "Line(2)(1)", 2, {"skillRaw":"Aqua Jet (Target = [1(Line(2)(1))], Damage: 2, Strikes first)"})
    ], {"color":"#185FA5"}
  ),

  "Sandile": Pkmn(551, ["Ground", "Dark"], 3, [6, 2, 0], "Atk",
    "Intimidate - Adjacent enemies -1 Atk for 2 turns",
    [
      S("Bite", "Line(1)(1)", 1, {"skillRaw":"Bite (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":5,"evoTo":"Krokorok","color":"#854F0B"}
  ),

  "Krokorok": Pkmn(552, ["Ground", "Dark"], 3, [10, 4, 0], "Atk",
    " - ",
    [
      S("Crunch", "Line(2)(1)", 2, {"skillRaw":"Crunch (Target = [1(Line(2)(1))], Damage: 2)"})
    ], {"evoCost":8,"evoTo":"Krookodile","color":"#854F0B"}
  ),

  "Krookodile": Pkmn(553, ["Ground", "Dark"], 3, [15, 5, 0], "Atk",
    "Moxie - Gains +1 Atk permanently upon defeating an enemy",
    [
      S("Earthquake", "AoE(2)", 2, {"skillRaw":"Earthquake (Target = [1(AoE(2))], Damage: 2)"})
    ], {"evoFrom":"Krokorok","color":"#854F0B"}
  ),

  "Darumaka": Pkmn(554, ["Fire"], 3, [7, 3, 0], "Atk",
    "Hustle - Increases skill damage by 1 but lowers accuracy slightly",
    [
      S("Fire Punch", "Line(1)(1)", 2, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Fire Punch (Target = [1(Line(1)(1))], Damage: 2, 30% Burn)"})
    ], {"evoCost":6,"evoTo":"Darmanitan","color":"#D85A30"}
  ),

  "Darmanitan": Pkmn(555, ["Fire"], 3, [15, 6, 0], "Atk",
    "Sheer Force - Removes secondary effects to deal +1 extra damage",
    [
      S("Flare Blitz", "Line(2)(1)", 4, {"selfDamage":1,"skillRaw":"Flare Blitz (Target = [1(Line(2)(1))], Damage: 4, User takes 1 recoil damage)"})
    ], {"evoFrom":"Darumaka","color":"#D85A30"}
  ),

  "Maractus": Pkmn(556, ["Grass"], 2, [12, 4, 0], "Support",
    "Water Absorb - Immune to Water, heals 3 HP when hit",
    [
      S("Needle Arm", "Line(2)(1)", 2, {"skillRaw":"Needle Arm (Target = [1(Line(2)(1))], Damage: 2, 30% Flinch)"})
    ], {"color":"#3B6D11"}
  ),

  "Dwebble": Pkmn(557, ["Bug", "Rock"], 2, [6, 2, 2], "Def",
    "Sturdy - Cannot be OHKO'd from maximum health",
    [
      S("Rock Throw", "Line(2)(1)", 1, {"skillRaw":"Rock Throw (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Crustle","color":"#854F0B"}
  ),

  "Crustle": Pkmn(558, ["Bug", "Rock"], 2, [13, 4, 3], "Def",
    "Sturdy - Cannot be OHKO'd from maximum health",
    [
      S("Shell Smash", "Line(1)(1)", 0, {"skillRaw":"Shell Smash (User Def lowered by 1, but Atk increased by 2 for 3 turns)"})
    ], {"evoFrom":"Dwebble","color":"#854F0B"}
  ),

  "Scraggy": Pkmn(559, ["Dark", "Fighting"], 2, [6, 2, 0], "Atk",
    "Shed Skin - 30% chance to cure status at turn end",
    [
      S("Feint Attack", "Line(1)(1)", 1, {"skillRaw":"Feint Attack (Target = [1(Line(1)(1))], Damage: 1, Never misses)"})
    ], {"evoCost":6,"evoTo":"Scrafty","color":"#A63D2E"}
  ),

  "Scrafty": Pkmn(560, ["Dark", "Fighting"], 2, [13, 4, 1], "Atk",
    " - ",
    [
      S("High Jump Kick", "Line(1)(1)", 3, {"skillRaw":"High Jump Kick (Target = [1(Line(1)(1))], Damage: 3, Crashes for 1 damage if misses)"})
    ], {"evoFrom":"Scraggy Ability: Shed Skin (30% chance to cure status at turn end)","color":"#A63D2E"}
  ),

  "Sigilyph": Pkmn(561, ["Psychic", "Flying"], 2, [12, 3, 1], "Support",
    "Magic Guard - Immune to indirect damage like weather or status tick damage",
    [
      S("Air Slash", "Line(3)(1)", 2, {"skillRaw":"Air Slash (Target = [1(Line(3)(1))], Damage: 2, 30% Flinch)"})
    ], {"color":"#993556"}
  ),

  "Yamask": Pkmn(562, ["Ghost"], 3, [6, 1, 2], "Def",
    "Mummy - Melee attackers have their ability changed to Mummy",
    [
      S("Night Shade", "Line(2)(1)", 0, {"skillRaw":"Night Shade (Target = [1(Line(2)(1))], Deals fixed 1 damage)"})
    ], {"evoCost":6,"evoTo":"Cofagrigus","color":"#3C3489"}
  ),

  "Cofagrigus": Pkmn(563, ["Ghost"], 3, [13, 3, 3], "Def",
    "Mummy - Melee attackers have their ability changed to Mummy",
    [
      S("Shadow Ball", "Line(3)(1)", 2, {"skillRaw":"Shadow Ball (Target = [1(Line(3)(1))], Damage: 2)"})
    ], {"evoFrom":"Yamask","color":"#3C3489"}
  ),

  "Tirtouga": Pkmn(564, ["Water", "Rock"], 3, [7, 2, 2], "Def",
    "Solid Rock - Reduces incoming super-effective damage by 1",
    [
      S("Aqua Jet", "Line(2)(1)", 1, {"skillRaw":"Aqua Jet (Target = [1(Line(2)(1))], Damage: 1, Strikes first)"})
    ], {"evoCost":7,"evoTo":"Carracosta","color":"#185FA5"}
  ),

  "Carracosta": Pkmn(565, ["Water", "Rock"], 3, [14, 4, 3], "Def",
    "Solid Rock - Reduces incoming super-effective damage by 1",
    [
      S("Hydro Pump", "Line(4)(1)", 2, {"skillRaw":"Hydro Pump (Target = [1(Line(4)(1))], Damage: 2)"})
    ], {"evoFrom":"Tirtouga Ability: Solid Rock (Reduces incoming super-effective damage by 1) Skill: Hydro Pump (Target = [1(Line(4)(1))], Damage: 2)","color":"#185FA5"}
  ),

  "Archen": Pkmn(566, ["Rock", "Flying"], 3, [6, 3, 0], "Atk",
    "Defeatist - Atk halved when HP ≤ 50%",
    [
      S("Rock Wing", "Line(2)(1)", 2, {"skillRaw":"Rock Wing (Target = [1(Line(2)(1))], Damage: 2)"})
    ], {"evoCost":7,"evoTo":"Archeops","color":"#854F0B"}
  ),

  "Archeops": Pkmn(567, ["Rock", "Flying"], 3, [14, 6, 0], "Atk",
    "Defeatist - Atk halved when HP ≤ 50%",
    [
      S("Stone Edge", "Line(3)(1)", 4, {"skillRaw":"Stone Edge (Target = [1(Line(3)(1))], Damage: 4)"})
    ], {"evoFrom":"Archen","color":"#854F0B"}
  ),

  "Trubbish": Pkmn(568, ["Poison"], 2, [6, 2, 0], "Support",
    "Stench - Basic attacks have a 10% chance to flinch target",
    [
      S("Toxic Spikes", "AoE(1)", 0, {"statusChance":"poison","statusChanceValue":0.3,"skillRaw":"Toxic Spikes (Target = [1(AoE(1))], Creates hazard that poisons stepping enemies)"})
    ], {"evoCost":6,"evoTo":"Garbodor","color":"#72243E"}
  ),

  "Garbodor": Pkmn(569, ["Poison"], 2, [13, 4, 1], "Support",
    "Aftermath - Deals 2 damage to melee attacker when defeated",
    [
      S("Gunk Shot", "Line(3)(1)", 2, {"statusChance":"poison","statusChanceValue":0.3,"skillRaw":"Gunk Shot (Target = [1(Line(3)(1))], Damage: 2, Inflicts Poison)"})
    ], {"evoFrom":"Trubbish Ability: Aftermath (Deals 2 damage to melee attacker when defeated) Skill: Gunk Shot (Target = [1(Line(3)(1))], Damage: 2, Inflicts Poison)","color":"#72243E"}
  ),

  "Zorua": Pkmn(570, ["Dark"], 3, [6, 2, 0], "Atk",
    "Illusion - Enters battle disguised as the last ally unit in your deck array",
    [
      S("Fake Tears", "Line(2)(1)", 0, {"skillRaw":"Fake Tears (Target = [1(Line(2)(1))], Drastically lowers enemy Def for 2 turns)"})
    ], {"evoCost":6,"evoTo":"Zoroark","color":"#5F5E5A"}
  ),

  "Zoroark": Pkmn(571, ["Dark"], 3, [13, 5, 0], "Atk",
    "Illusion - Enters battle disguised as the last ally unit in your deck array",
    [
      S("Night Daze", "Line(3)(1)", 2, {"skillRaw":"Night Daze (Target = [1(Line(3)(1))], Damage: 2, 30% chance to lower accuracy)"})
    ], {"evoFrom":"Zorua","color":"#5F5E5A"}
  ),

  "Minccino": Pkmn(572, ["Normal"], 2, [6, 2, 0], "Atk",
    "Technician - Skills with 1 base damage deal +1 extra damage",
    [
      S("Double Slap", "Line(1)(1)", 1, {"skillRaw":"Double Slap (Target = [2(Line(1)(1))], Damage: 1 per hit)"})
    ], {"evoCost":6,"evoTo":"Cinccino","color":"#5F5E5A"}
  ),

  "Cinccino": Pkmn(573, ["Normal"], 2, [12, 4, 0], "Atk",
    "Skill Link - Multi-hit skills always trigger maximum hits",
    [
      S("Tail Slap", "Line(1)(1)", 1, {"skillRaw":"Tail Slap (Target = [3(Line(1)(1))], Damage: 1 per hit)"})
    ], {"evoFrom":"Minccino","color":"#5F5E5A"}
  ),

  "Gothita": Pkmn(574, ["Psychic"], 3, [6, 1, 0], "Support",
    "Shadow Tag - Prevents adjacent enemies from moving away",
    [
      S("Confusion", "Line(2)(1)", 1, {"skillRaw":"Confusion (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":5,"evoTo":"Gothorita","color":"#993556"}
  ),

  "Gothorita": Pkmn(575, ["Psychic"], 3, [9, 2, 1], "Support",
    "Shadow Tag - Prevents adjacent enemies from moving away",
    [
      S("Psybeam", "Line(2)(1)", 1, {"statusChance":"confuse","statusChanceValue":0.3,"skillRaw":"Psybeam (Target = [1(Line(2)(1))], Damage: 1, 30% Confuse)"})
    ], {"evoCost":8,"evoTo":"Gothitelle","color":"#993556"}
  ),

  "Gothitelle": Pkmn(576, ["Psychic"], 3, [14, 4, 1], "Support",
    "Shadow Tag - Prevents adjacent enemies from moving away",
    [
      S("Psychic", "Line(3)(1)", 2, {"skillRaw":"Psychic (Target = [1(Line(3)(1))], Damage: 2)"})
    ], {"evoFrom":"Gothorita","color":"#993556"}
  ),

  "Solosis": Pkmn(577, ["Psychic"], 3, [7, 2, 0], "Support",
    "Magic Guard - Immune to indirect status damage ticks",
    [
      S("Rollout", "Line(2)(1)", 1, {"skillRaw":"Rollout (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":5,"evoTo":"Duosion","color":"#993556"}
  ),

  "Duosion": Pkmn(578, ["Psychic"], 3, [10, 3, 0], "Support",
    "Magic Guard - Immune to indirect status damage ticks",
    [
      S("Psyshock", "Line(2)(1)", 1, {"skillRaw":"Psyshock (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":8,"evoTo":"Reuniclus","color":"#993556"}
  ),

  "Reuniclus": Pkmn(579, ["Psychic"], 3, [15, 5, 1], "Support",
    "Magic Guard - Immune to indirect status damage ticks",
    [
      S("Psychic", "Line(3)(1)", 2, {"skillRaw":"Psychic (Target = [1(Line(3)(1))], Damage: 2)"})
    ], {"evoFrom":"Duosion","color":"#993556"}
  ),

  "Ducklett": Pkmn(580, ["Water", "Flying"], 2, [6, 2, 0], "Support",
    "Keen Eye - Accuracy cannot be lowered by enemies",
    [
      S("Water Gun", "Line(2)(1)", 1, {"skillRaw":"Water Gun (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Swanna","color":"#185FA5"}
  ),

  "Swanna": Pkmn(581, ["Water", "Flying"], 2, [13, 4, 0], "Support",
    " - ",
    [
      S("Brave Bird", "Line(3)(1)", 3, {"selfDamage":1,"skillRaw":"Brave Bird (Target = [1(Line(3)(1))], Damage: 3, User takes 1 recoil damage)"})
    ], {"evoFrom":"Ducklett Ability: Hydration (Cures status conditions naturally during Rain weather)","color":"#185FA5"}
  ),

  "Vanillite": Pkmn(582, ["Ice"], 2, [6, 2, 0], "Support",
    "Ice Body - Regenerates 1 HP per turn during Hail weather",
    [
      S("Powder Snow", "Line(2)(1)", 1, {"statusChance":"freeze","statusChanceValue":0.3,"skillRaw":"Powder Snow (Target = [1(Line(2)(1))], Damage: 1, 30% Freeze)"})
    ], {"evoCost":5,"evoTo":"Vanillish","color":"#8CD16D"}
  ),

  "Vanillish": Pkmn(583, ["Ice"], 2, [9, 3, 0], "Support",
    "Ice Body - Regenerates 1 HP per turn during Hail weather",
    [
      S("Icy Wind", "Line(2)(1)", 1, {"skillRaw":"Icy Wind (Target = [1(Line(2)(1))], Damage: 1, Slows target)"})
    ], {"evoCost":8,"evoTo":"Vanilluxe","color":"#8CD16D"}
  ),

  "Vanilluxe": Pkmn(584, ["Ice"], 2, [14, 4, 1], "Support",
    "Snow Warning - Changes weather to Hail for 5 turns on deploy",
    [
      S("Blizzard", "AoE(2)", 2, {"statusChance":"freeze","statusChanceValue":0.3,"skillRaw":"Blizzard (Target = [1(AoE(2))], Damage: 2, 30% Freeze)"})
    ], {"evoFrom":"Vanillish Ability: Snow Warning (Changes weather to Hail for 5 turns on deploy) Skill: Blizzard (Target = [1(AoE(2))], Damage: 2, 30% Freeze)","color":"#8CD16D"}
  ),

  "Deerling": Pkmn(585, ["Normal", "Grass"], 2, [6, 2, 0], "Support",
    "Chlorophyll - Move costs -1 during Sun weather",
    [
      S("Double Kick", "Line(1)(1)", 1, {"skillRaw":"Double Kick (Target = [2(Line(1)(1))], Damage: 1 per hit)"})
    ], {"evoCost":6,"evoTo":"Sawsbuck","color":"#3B6D11"}
  ),

  "Sawsbuck": Pkmn(586, ["Normal", "Grass"], 2, [13, 4, 0], "Support",
    "Sap Sipper - Immune to Grass skills, grants +1 Atk instead if struck",
    [
      S("Horn Leech", "Line(1)(1)", 2, {"skillHeal":1,"skillHealTarget":"self","skillRaw":"Horn Leech (Target = [1(Line(1)(1))], Damage: 2, Heals user 1 HP)"})
    ], {"evoFrom":"Deerling","color":"#3B6D11"}
  ),

  "Emolga": Pkmn(587, ["Electric", "Flying"], 2, [11, 3, 0], "Support",
    "Static - 30% inflict paralysis when hit by melee",
    [
      S("Nuzzle", "Line(1)(1)", 0, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Nuzzle (Target = [1(Line(1)(1))], Inflict Paralysis for 3 turns, 100% chance)"})
    ], {"color":"#BA7517"}
  ),

  "Karrablast": Pkmn(588, ["Bug"], 2, [6, 3, 0], "Atk",
    "Swarm - +1 damage with Bug skills when HP ≤ 50%",
    [
      S("Peck", "Line(1)(1)", 1, {"skillRaw":"Peck (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Escavalier","color":"#6D8E1E"}
  ),

  "Escavalier": Pkmn(589, ["Bug", "Steel"], 2, [13, 5, 3], "Def",
    "Shell Armor - Immune to receiving critical hits",
    [
      S("Iron Head", "Line(1)(1)", 2, {"skillRaw":"Iron Head (Target = [1(Line(1)(1))], Damage: 2, 30% Flinch)"})
    ], {"evoFrom":"Karrablast","color":"#6D8E1E"}
  ),

  "Foongus": Pkmn(590, ["Grass", "Poison"], 2, [7, 2, 0], "Support",
    "Effect Spore - 30% chance to poison/paralyze/sleep on melee contact",
    [
      S("Spore", "Line(1)(1)", 0, {"statusChance":"sleep","statusChanceValue":0.5,"skillRaw":"Spore (Target = [1(Line(1)(1))], Inflict Sleep for 2 turns, 100% accuracy)"})
    ], {"evoCost":6,"evoTo":"Amoonguss","color":"#3B6D11"}
  ),

  "Amoonguss": Pkmn(591, ["Grass", "Poison"], 2, [15, 4, 1], "Support",
    " - ",
    [
      S("Clear Smog", "Line(2)(1)", 1, {"skillRaw":"Clear Smog (Target = [1(Line(2)(1))], Damage: 1, Resets target's stat buffs)"})
    ], {"evoFrom":"Foongus Ability: Regenerator (Heal 1 HP at turn end)","color":"#3B6D11"}
  ),

  "Frillish": Pkmn(592, ["Water", "Ghost"], 2, [7, 2, 1], "Def",
    "Cursed Body - 30% chance to disable enemy's skill when struck",
    [
      S("Night Shade", "Line(2)(1)", 0, {"skillRaw":"Night Shade (Target = [1(Line(2)(1))], Fixed 1 damage)"})
    ], {"evoCost":6,"color":"#185FA5"}
  ),

  "Jellicent": Pkmn(593, ["Water", "Ghost"], 2, [14, 3, 2], "Def",
    "Water Absorb - Immune to Water, heals 3 HP when hit",
    [
      S("Scald", "Line(3)(1)", 1, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Scald (Target = [1(Line(3)(1))], Damage: 1, 30% Burn)"})
    ], {"evoFrom":"Frillish Ability: Water Absorb (Immune to Water, heals 3 HP when hit) Skill: Scald (Target = [1(Line(3)(1))], Damage: 1, 30% Burn)","color":"#185FA5"}
  ),

  "Alomomola": Pkmn(594, ["Water"], 3, [16, 3, 2], "Def",
    "Regenerator - Heal 1 HP at turn end",
    [
      S("Wish", "AoE(0)", 0, {"skillRaw":"Wish (Target = [1(AoE(0))], Override skillDmg: 0, Heals user or adjacent ally 4 HP next turn)"})
    ], {"color":"#185FA5"}
  ),

  "Joltik": Pkmn(595, ["Bug", "Electric"], 2, [5, 2, 0], "Atk",
    "Compound Eyes - Increases own skill accuracy by 30%",
    [
      S("Electroweb", "Line(2)(1)", 1, {"skillRaw":"Electroweb (Target = [1(Line(2)(1))], Damage: 1, Slows target)"})
    ], {"evoCost":6,"evoTo":"Galvantula","color":"#BA7517"}
  ),

  "Galvantula": Pkmn(596, ["Bug", "Electric"], 2, [12, 4, 0], "Atk",
    "Compound Eyes - Increases own skill accuracy by 30%",
    [
      S("Thunder", "Line(4)(1)", 3, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Thunder (Target = [1(Line(4)(1))], Damage: 3, 30% Paralysis)"})
    ], {"evoFrom":"Joltik","color":"#BA7517"}
  ),

  "Ferroseed": Pkmn(597, ["Grass", "Steel"], 3, [7, 2, 2], "Def",
    "Iron Barbs - Deals 1 damage back to melee attackers",
    [
      S("Spikes", "AoE(0)", 0, {"skillRaw":"Spikes (Target = [1(AoE(0))], Lays trap on user's tile that deals damage to moving enemies)"})
    ], {"evoCost":7,"evoTo":"Ferrothorn","color":"#3B6D11"}
  ),

  "Ferrothorn": Pkmn(598, ["Grass", "Steel"], 3, [14, 4, 3], "Def",
    "Iron Barbs - Deals 1 damage back to melee attackers",
    [
      S("Power Whip", "Line(2)(1)", 2, {"skillRaw":"Power Whip (Target = [1(Line(2)(1))], Damage: 2)"})
    ], {"evoFrom":"Ferroseed","color":"#3B6D11"}
  ),

  "Klink": Pkmn(599, ["Steel"], 2, [6, 2, 1], "Def",
    "Plus - Boosts skill damage if adjacent to an ally with Minus/Plus ability",
    [
      S("Gear Grind", "Line(1)(1)", 1, {"skillRaw":"Gear Grind (Target = [2(Line(1)(1))], Damage: 1 per hit)"})
    ], {"evoCost":5,"color":"#5F5E5A"}
  ),

  "Klang": Pkmn(600, ["Steel"], 2, [9, 3, 2], "Def",
    "Plus - Boosts skill damage if adjacent to an ally with Minus/Plus ability",
    [
      S("Shift Gear", "AoE(0)", 0, {"skillRaw":"Shift Gear (Target = [1(AoE(0))], Increases self Atk by 1 and extends move range)"})
    ], {"evoCost":8,"evoTo":"Klinklang","color":"#5F5E5A"}
  ),

  "Klinklang": Pkmn(601, ["Steel"], 2, [13, 4, 3], "Def",
    "Clear Body - User's stats cannot be lowered by enemies",
    [
      S("Gear Up", "AoE(1)", 0, {"skillRaw":"Gear Up (Target = [1(AoE(1))], Increases adjacent allies' Def by 1)"})
    ], {"evoFrom":"Klang","color":"#5F5E5A"}
  ),

  "Tynamo": Pkmn(602, ["Electric"], 3, [5, 2, 0], "Atk",
    "Levitate - Immune to Ground-type skill damage",
    [
      S("Tackle", "Line(1)(1)", 1, {"skillRaw":"Tackle (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":5,"evoTo":"Eelektrik","color":"#BA7517"}
  ),

  "Eelektrik": Pkmn(603, ["Electric"], 3, [9, 3, 0], "Atk",
    "Levitate - Immune to Ground-type skill damage",
    [
      S("Spark", "Line(2)(1)", 1, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Spark (Target = [1(Line(2)(1))], Damage: 1, 30% Paralysis)"})
    ], {"evoCost":8,"evoTo":"Eelektross","color":"#BA7517"}
  ),

  "Eelektross": Pkmn(604, ["Electric"], 3, [14, 5, 0], "Atk",
    " - ",
    [
      S("Wild Charge", "Line(2)(1)", 3, {"selfDamage":1,"skillRaw":"Wild Charge (Target = [1(Line(2)(1))], Damage: 3, User takes 1 recoil damage)"})
    ], {"evoFrom":"Eelektrik Ability: Levitate (Immune to Ground-type skill damage, removing all weaknesses)","color":"#BA7517"}
  ),

  "Elgyem": Pkmn(605, ["Psychic"], 2, [6, 2, 0], "Support",
    "Synchronize - Inflicts the same status condition back to the attacker",
    [
      S("Confusion", "Line(2)(1)", 1, {"skillRaw":"Confusion (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoCost":6,"evoTo":"Beheeyem","color":"#993556"}
  ),

  "Beheeyem": Pkmn(606, ["Psychic"], 2, [13, 4, 0], "Support",
    "Analytic - Deals +1 extra damage if executing action last in turn order",
    [
      S("Psychic", "Line(3)(1)", 2, {"skillRaw":"Psychic (Target = [1(Line(3)(1))], Damage: 2)"})
    ], {"evoFrom":"Elgyem","color":"#993556"}
  ),

  "Litwick": Pkmn(607, ["Ghost", "Fire"], 3, [6, 2, 0], "Atk",
    "Flame Body - 30% inflict burn when hit by melee",
    [
      S("Ember", "Line(2)(1)", 1, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Ember (Target = [1(Line(2)(1))], Damage: 1, 30% Burn)"})
    ], {"evoCost":5,"evoTo":"Lampent","color":"#D85A30"}
  ),

  "Lampent": Pkmn(608, ["Ghost", "Fire"], 3, [9, 3, 0], "Atk",
    " - ",
    [
      S("Shadow Sneak", "Line(2)(1)", 1, {"skillRaw":"Shadow Sneak (Target = [1(Line(2)(1))], Damage: 1, Strikes first)"})
    ], {"evoCost":8,"evoTo":"Chandelure","color":"#D85A30"}
  ),

  "Chandelure": Pkmn(609, ["Ghost", "Fire"], 3, [14, 5, 0], "Atk",
    "Infiltrator - Skill damage bypasses enemy defensive screens/shields",
    [
      S("Shadow Ball", "Line(3)(1)", 2, {"skillRaw":"Shadow Ball (Target = [1(Line(3)(1))], Damage: 2, 30% chance to lower enemy SpDef)"})
    ], {"evoFrom":"Lampent","color":"#D85A30"}
  ),

  "Axew": Pkmn(610, ["Dragon"], 3, [6, 3, 0], "Atk",
    "Mold Breaker - Ignores enemy defensive abilities during attacks",
    [
      S("Dual Chop", "Line(1)(1)", 1, {"skillRaw":"Dual Chop (Target = [2(Line(1)(1))], Damage: 1 per hit)"})
    ], {"evoCost":6,"evoTo":"Fraxure","color":"#5F5E5A"}
  ),

  "Fraxure": Pkmn(611, ["Dragon"], 3, [10, 4, 0], "Atk",
    "Mold Breaker - Ignores enemy defensive abilities during attacks",
    [
      S("Dragon Claw", "Line(2)(1)", 2, {"skillRaw":"Dragon Claw (Target = [1(Line(2)(1))], Damage: 2)"})
    ], {"evoCost":8,"evoTo":"Haxorus","color":"#5F5E5A"}
  ),

  "Haxorus": Pkmn(612, ["Dragon"], 3, [14, 6, 0], "Atk",
    "Mold Breaker - Ignores enemy defensive abilities during attacks",
    [
      S("Outrage", "AoE(1)", 4, {"statusChance":"confuse","statusChanceValue":0.3,"skillRaw":"Outrage (Target = [1(AoE(1))], Damage: 4, Confuses self for 3 turns afterward)"})
    ], {"evoFrom":"Fraxure","color":"#5F5E5A"}
  ),

  "Cubchoo": Pkmn(613, ["Ice"], 2, [7, 2, 0], "Atk",
    "Slush Rush - Move costs -1 energy during Hail weather",
    [
      S("Powder Snow", "Line(2)(1)", 1, {"statusChance":"freeze","statusChanceValue":0.3,"skillRaw":"Powder Snow (Target = [1(Line(2)(1))], Damage: 1, 30% Freeze)"})
    ], {"evoCost":6,"evoTo":"Beartic","color":"#8CD16D"}
  ),

  "Beartic": Pkmn(614, ["Ice"], 2, [14, 5, 0], "Atk",
    "Slush Rush - Move costs -1 energy during Hail weather",
    [
      S("Icicle Crash", "Line(3)(1)", 2, {"skillRaw":"Icicle Crash (Target = [1(Line(3)(1))], Damage: 2, 30% Flinch)"})
    ], {"evoFrom":"Cubchoo","color":"#8CD16D"}
  ),

  "Cryogonal": Pkmn(615, ["Ice"], 2, [12, 3, 1], "Support",
    ": Crystal Ice (At the start of battle, grant Shield equal to Cryogonal's Def to allied Ice Pokémon. Fire, Fighting, Rock, and Steel Pokémon cannot receive this shield. - ",
    [
      S("Freeze-Dry", "Line(3)(1)", 1, {"statusChance":"freeze","statusChanceValue":0.3,"skillRaw":"Freeze-Dry (Target = [1(Line(3)(1))], Damage: 1, Super-effective against Water-types, 30% Freeze)"})
    ], {"color":"#8CD16D"}
  ),

  "Shelmet": Pkmn(616, ["Bug"], 2, [7, 2, 2], "Def",
    "Shell Armor - Immune to receiving critical hits",
    [
      S("Absorb", "Line(1)(1)", 1, {"skillHeal":1,"skillHealTarget":"self","skillRaw":"Absorb (Target = [1(Line(1)(1))], Damage: 1, Heals user 1 HP)"})
    ], {"evoCost":6,"evoTo":"Accelgor","color":"#6D8E1E"}
  ),

  "Accelgor": Pkmn(617, ["Bug"], 2, [13, 4, 0], "Atk",
    " - ",
    [
      S("Bug Buzz", "Cone(2)", 2, {"skillRaw":"Bug Buzz (Target = [1(Cone(2))], Damage: 2)"})
    ], {"evoFrom":"Shelmet Ability: Hydration (Cures status conditions naturally during Rain weather)","color":"#6D8E1E"}
  ),

  "Stunfisk": Pkmn(618, ["Ground", "Electric"], 2, [14, 3, 2], "Def",
    "Static - 30% inflict paralysis when hit by melee",
    [
      S("Discharge", "AoE(1)", 1, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Discharge (Target = [1(AoE(1))], Damage: 1, 30% Paralysis to all targets)"})
    ], {"color":"#BA7517"}
  ),

  "Mienfoo": Pkmn(619, ["Fighting"], 2, [6, 3, 0], "Atk",
    "Regenerator - Heal 1 HP at turn end",
    [
      S("Swift", "Line(2)(1)", 1, {"skillRaw":"Swift (Target = [1(Line(2)(1))], Damage: 1, Never misses)"})
    ], {"evoCost":7,"evoTo":"Mienshao","color":"#A63D2E"}
  ),

  "Mienshao": Pkmn(620, ["Fighting"], 2, [13, 5, 0], "Atk",
    " - ",
    [
      S("High Jump Kick", "Line(1)(1)", 3, {"skillRaw":"High Jump Kick (Target = [1(Line(1)(1))], Damage: 3, Crashes for 1 damage if misses)"})
    ], {"evoFrom":"Mienfoo Ability: Regenerator (Heal 1 HP at turn end)","color":"#A63D2E"}
  ),

  "Druddigon": Pkmn(621, ["Dragon"], 3, [14, 4, 2], "Def",
    "Rough Skin - Deals 1 damage back to melee attackers",
    [
      S("Dragon Tail", "Line(1)(1)", 1, {"skillRaw":"Dragon Tail (Target = [1(Line(1)(1))], Damage: 1, Knocks target back 1 tile)"})
    ], {"color":"#5F5E5A"}
  ),

  "Golett": Pkmn(622, ["Ground", "Ghost"], 2, [7, 3, 1], "Def",
    "Iron Fist - Boosts punching/slam skill damage by 1",
    [
      S("Shadow Punch", "Line(2)(1)", 1, {"skillRaw":"Shadow Punch (Target = [1(Line(2)(1))], Damage: 1, Never misses)"})
    ], {"evoCost":6,"color":"#854F0B"}
  ),

  "Golurk": Pkmn(623, ["Ground", "Ghost"], 2, [14, 4, 2], "Def",
    "Iron Fist - Boosts punching/slam skill damage by 1",
    [
      S("Phantom Force", "Line(3)(1)", 2, {"skillRaw":"Phantom Force (Target = [1(Line(3)(1))], Damage: 2, Bypasses protect screens)"})
    ], {"evoFrom":"Golett","color":"#854F0B"}
  ),

  "Pawniard": Pkmn(624, ["Dark", "Steel"], 3, [6, 3, 0], "Atk",
    "Defiant - +2 Atk when stats are lowered by enemies",
    [
      S("Metal Claw", "Line(1)(1)", 1, {"skillRaw":"Metal Claw (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":7,"evoTo":"Bisharp","color":"#5F5E5A"}
  ),

  "Bisharp": Pkmn(625, ["Dark", "Steel"], 3, [13, 5, 0], "Atk",
    "Defiant - +2 Atk when stats are lowered by enemies",
    [
      S("Iron Head", "Line(1)(1)", 2, {"skillRaw":"Iron Head (Target = [1(Line(1)(1))], Damage: 2, 30% Flinch)"})
    ], {"evoFrom":"Pawniard","color":"#5F5E5A"}
  ),

  "Bouffalant": Pkmn(626, ["Normal"], 2, [14, 4, 2], "Def",
    "Reckless - Increases recoil skill damage by 1",
    [
      S("Head Charge", "Line(2)(1)", 3, {"selfDamage":1,"skillRaw":"Head Charge (Target = [1(Line(2)(1))], Damage: 3, User takes 1 recoil damage)"})
    ], {"color":"#5F5E5A"}
  ),

  "Rufflet": Pkmn(627, ["Normal", "Flying"], 2, [7, 2, 0], "Atk",
    "Keen Eye - Accuracy cannot be lowered by enemies",
    [
      S("Wing Attack", "Line(1)(1)", 1, {"skillRaw":"Wing Attack (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":7,"evoTo":"Braviary","color":"#5F5E5A"}
  ),

  "Braviary": Pkmn(628, ["Normal", "Flying"], 2, [14, 5, 0], "Atk",
    "Defiant - +2 Atk when stats are lowered by enemies",
    [
      S("Brave Bird", "Line(3)(1)", 3, {"selfDamage":1,"skillRaw":"Brave Bird (Target = [1(Line(3)(1))], Damage: 3, User takes 1 recoil damage)"})
    ], {"evoFrom":"Rufflet","color":"#5F5E5A"}
  ),

  "Vullaby": Pkmn(629, ["Dark", "Flying"], 2, [7, 2, 1], "Def",
    "Overcoat - Immune to Hail weather chip damage and powder status hazards",
    [
      S("Pluck", "Line(1)(1)", 1, {"skillRaw":"Pluck (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":7,"color":"#5F5E5A"}
  ),

  "Mandibuzz": Pkmn(630, ["Dark", "Flying"], 2, [15, 3, 2], "Def",
    "Overcoat - Immune to Hail weather chip damage and powder status hazards",
    [
      S("Foul Play", "Line(2)(1)", 0, {"skillRaw":"Foul Play (Target = [1(Line(2)(1))], Damage scales directly based on enemy Atk)"})
    ], {"evoFrom":"Vullaby","color":"#5F5E5A"}
  ),

  "Heatmor": Pkmn(631, ["Fire"], 2, [13, 4, 0], "Atk",
    "Flash Fire - Immune to Fire, receiving Fire skills boosts Fire skill power",
    [
      S("Fire Lash", "Line(2)(1)", 2, {"skillRaw":"Fire Lash (Target = [1(Line(2)(1))], Damage: 2, 100% chance to lower enemy Def)"})
    ], {"color":"#D85A30"}
  ),

  "Durant": Pkmn(632, ["Bug", "Steel"], 2, [11, 4, 2], "Def",
    "Hustle - Increases skill damage by 1 but lowers accuracy slightly",
    [
      S("Iron Head", "Line(1)(1)", 2, {"skillRaw":"Iron Head (Target = [1(Line(1)(1))], Damage: 2, 30% Flinch)"})
    ], {"color":"#6D8E1E"}
  ),

  "Deino": Pkmn(633, ["Dark", "Dragon"], 3, [7, 2, 0], "Atk",
    "Hustle - Increases skill damage by 1 but lowers accuracy slightly",
    [
      S("Bite", "Line(1)(1)", 1, {"skillRaw":"Bite (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoCost":7,"evoTo":"Zweilous","color":"#5F5E5A"}
  ),

  "Zweilous": Pkmn(634, ["Dark", "Dragon"], 3, [11, 4, 0], "Atk",
    "Hustle - Increases skill damage by 1 but lowers accuracy slightly",
    [
      S("Crunch", "Line(2)(1)", 2, {"skillRaw":"Crunch (Target = [1(Line(2)(1))], Damage: 2)"})
    ], {"evoCost":9,"evoTo":"Hydreigon","color":"#5F5E5A"}
  ),

  "Hydreigon": Pkmn(635, ["Dark", "Dragon"], 3, [16, 5, 0], "Atk",
    " - ",
    [
      S("Dragon Pulse", "Line(3)(1)", 3, {"skillRaw":"Dragon Pulse (Target = [1(Line(3)(1))], Damage: 3)"})
    ], {"evoFrom":"Zweilous Ability: Levitate (Immune to Ground-type skill damage)","color":"#5F5E5A"}
  ),

  "Larvesta": Pkmn(636, ["Bug", "Fire"], 3, [7, 3, 0], "Atk",
    "Flame Body - 30% inflict burn when hit by melee",
    [
      S("Flame Wheel", "Line(2)(1)", 3, {"skillRaw":"Flame Wheel (Target = [1(Line(2)(1))], Damage: 3)"})
    ], {"evoCost":9,"evoTo":"Volcarona","color":"#D85A30"}
  ),

  "Volcarona": Pkmn(637, ["Bug", "Fire"], 3, [15, 5, 0], "Atk",
    " - ",
    [
      S("Fiery Dance", "Cone(2)", 5, {"skillRaw":"Fiery Dance (Target = [1(Cone(2))], Damage: 5, 50% chance to buff own Atk by 1)"})
    ], {"evoFrom":"Larvesta Ability: Flame Body (30% inflict burn when hit by melee)","color":"#D85A30"}
  ),

  "Cobalion": Pkmn(638, ["Steel", "Fighting"], 5, [12, 4, 3], "Def",
    "Justified - Gains +2 Atk for 2 turns when hit by Dark-type skills",
    [
      S("Iron Head", "Line(3)(1)", 4, {"skillRaw":"Iron Head(Target = [1(Line(3)(1))], Damage: 4)"}),
      S("Sacred Sword", "Line(2)(1)", 2, {"skillRaw":"Sacred Sword (Target = [1(Line(2)(1))], Damage: 2, Ignores enemy's Def buffs entirely)"})
    ], {"color":"#A63D2E"}
  ),

  "Terrakion": Pkmn(639, ["Rock", "Fighting"], 5, [12, 5, 0], "Atk",
    "Justified - Gains +2 Atk for 2 turns when hit by Dark-type skills",
    [
      S("Stone Edge", "Unit)", 3, {"skillRaw":"Stone Edge (Target = [1(Unit))], Damage: 3)"}),
      S("Rock Wrecker", "Line(3)(1)", 6, {"skillRaw":"Rock Wrecker (Target = [1(Line(3)(1))], Damage: 6, Must recharge next turn)"})
    ], {"color":"#854F0B"}
  ),

  "Virizion": Pkmn(640, ["Grass", "Fighting"], 5, [12, 4, 1], "Support",
    "Justified - Gains +2 Atk for 2 turns when hit by Dark-type skills",
    [
      S("Giga Drain", "Line(2)(1)", 2, {"skillHeal":1,"skillHealTarget":"self","skillRaw":"Giga Drain (Target = [1(Line(2)(1))], Damage: 2, Heals user 1 HP)"}),
      S("Leaf Blade", "Line(3)(1)", 3, {"skillHeal":1,"skillHealTarget":"self","skillRaw":"Leaf Blade(Target = [1(Line(3)(1))], Damage: 3, Heal user 1 HP)"})
    ], {"color":"#3B6D11"}
  ),

  "Tornadus": Pkmn(641, ["Flying"], 5, [14, 5, 0], "Atk",
    "Storm Rider - The first movement each turn costs no movement points",
    [
      S("Air Slash", "Line(4)(1)", 3, {"skillRaw":"Air Slash(Target = [1(Line(4)(1))], Damage: 3, Push target 2 tile)"}),
      S("Hurricane", "AoE(1)", 4, {"skillRaw":"Hurricane(Target = [2(AoE(1))], Damage: 4, Reduce enemy accuracy next turn)"})
    ], {"color":"#5F5E5A"}
  ),

  "Thundurus": Pkmn(642, ["Electric", "Flying"], 5, [14, 5, 0], "Atk",
    "Thunderstorm - Enemies hit by Electric skills use +1 movement point next turn",
    [
      S("Thunderbolt", "Line(4)(1)", 4, {"skillRaw":"Thunderbolt(Target = [1(Line(4)(1))], Damage: 4)"}),
      S("Wild Charge", "Unit)", 5, {"skillRaw":"Wild Charge(Target = [1(Unit))], Damage: 5, User takes 1 damage)"})
    ], {"color":"#BA7517"}
  ),

  "Reshiram": Pkmn(643, ["Dragon", "Fire"], 5, [16, 6, 0], "Atk",
    "Turboblaze - Burned enemies cannot be healed",
    [
      S("Blue Flare", "AoE(1)", 5, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Blue Flare (Target = [1(AoE(1))], Damage: 5, Burn enemies hit for 2 turns)"}),
      S("Fusion Flare", "Line(4)(1)", 4, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Fusion Flare (Target = [1(Line(4)(1))], Damage: 4, Deal +2 damage to Burned targets)"}),
      S("Inferno", "Unit)", 3, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Inferno (Target = [1(Unit))], Damage: 3, Burn target for 3 turns)"})
    ], {"color":"#D85A30"}
  ),

  "Zekrom": Pkmn(644, ["Dragon", "Electric"], 5, [16, 5, 3], "Def",
    "Teravolt - Zekrom's attacks ignore Shield effects",
    [
      S("Bolt Strike", "Unit)", 5, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Bolt Strike(Target = [1(Unit))], Damage: 5, 30% chance to inflict Paralysis)"}),
      S("Fusion Bolt", "Line(4)(1)", 4, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Fusion Bolt(Target = [1(Line(4)(1))], Damage: 4, Deal +2 damage to targets affected by Paralysis)"}),
      S("Thunder Cage", "AoE(1)", 3, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Thunder Cage(Target = [1(AoE(1))], Damage: 3, Inflict Paralysis for 2 turns)"})
    ], {"color":"#BA7517"}
  ),

  "Landorus": Pkmn(645, ["Ground", "Flying"], 5, [15, 5, 2], "Def",
    "Earth Force - Adjacent Ground or Flying allies gain +1 Def",
    [
      S("Earthquake", "AoE(1)", 4, {"skillRaw":"Earthquake (Target = [2(AoE(1))], Damage: 4)"}),
      S("Stone Crush", "Line(3)(1)", 3, {"skillRaw":"Stone Crush (Target = [1(Line(3)(1))], Damage: 3, Reduce target Def by 1)"})
    ], {"color":"#854F0B"}
  ),

  "Kyurem": Pkmn(646, ["Dragon", "Ice"], 5, [16, 5, 2], "Def",
    "Frozen Core - At the start of your turn, allied Ice Pokémon gain 1 Frost",
    [
      S("Dragon Breath", "Target = [1(Line(3)(1))]", 5, {"statusChance":"freeze","statusChanceValue":0.05,"skillRaw":"Dragon Breath (Target = [1(Line(3)(1))]), Damage: 5, 5% Freeze"}),
      S("Glaciate", "Target = [All Enemies]", 0, {"statusChance":"freeze","statusChanceValue":0.25,"skillRaw":"Glaciate (Target = [All Enemies]), 25% Freeze (40% if Frost >= 16)"}),
      S("Blizzard", "Target = [1(AoE(2))]", 4, {
        "statusChance": "freeze",
        "statusChanceValue": 0.15,
        "skillRaw": "Blizzard (Target = [1(AoE(2))]), Damage: 4, 15% Freeze"
      })
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Legendary","color":"#8CD16D"}
  ),

  "Keldeo": Pkmn(647, ["Water", "Fighting"], 5, [14, 4, 1], "Support",
    "Resolute Blade - Psychic, Grass, and Flying Pokémon on the field lose 1 Def. Ice, Ground, Steel, and Rock Pokémon lose 2 Def",
    [
      S("Sacred Sword", "Line(3)(1)", 4, {"skillRaw":"Sacred Sword (Target = [1(Line(3)(1))], Damage: 4, Reduce target Def by 1)"}),
      S("Leer", "AoE(1)", 0, {"skillRaw":"Leer (Target = [1(AoE(1))], Damage: 0, Reduce enemy Def by 2)"}),
      S("Secret Sword", "Line(4)(1)", 5, {"skillRaw":"Secret Sword (Target = [1(Line(4)(1))], Damage: 5, Deal true damage equal to target's Def)"})
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Mythical","color":"#185FA5"}
  ),

  "Meloetta": Pkmn(648, ["Normal", "Psychic"], 5, [14, 4, 1], "Support",
    "Aria Forme - After using a skill, Meloetta changes form. Aria Forme: Debuffs applied by Meloetta's skills last 1 additional turn. Pirouette Forme: +2 Skill Damage. Meloetta switches form after every skill cast",
    [
      S("Relic Song", "AoE(2)", 4, {"statusChance":"sleep","statusChanceValue":0.2,"skillRaw":"Relic Song (Target = [1(AoE(2))], Damage: 4, 20% chance to Sleep enemies hit)"}),
      S("Echo Voice", "Line(4)(1)", 4, {"skillRaw":"Echo Voice (Target = [1(Line(4)(1))], Damage: 4, Deal +1 damage for each skill used this turn)"}),
      S("Sing", "AoE(2)", 0, {"statusChance":"sleep","statusChanceValue":0.5,"skillRaw":"Sing (Target = [2(AoE(2))], Damage: 0, Put enemies hit to Sleep for 3 turn)"})
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Mythical","color":"#993556"}
  ),

  "Genesect": Pkmn(649, ["Bug", "Steel"], 5, [14, 6, 0], "Atk",
    "Download - At the start of battle, Genesect analyzes the enemy team. If enemies have higher total Def, gain +2 Skill Damage. If enemies have higher total Atk, gain +1 Def",
    [
      S("Techno Blast", "Line(6)(1)", 5, {"skillRaw":"Techno Blast (Target = [1(Line(6)(1))], Damage: 5, Deal +2 damage if Genesect has no held item)"}),
      S("Magnet Bomb", "AoE(1)", 4, {"skillRaw":"Magnet Bomb (Target = [1(AoE(1))], Damage: 4 Push enemies hit 2 tiles away)"}),
      S("X-Scissor", "Line(3))", 4, {"skillRaw":"X-Scissor (Target = [1(Line(3)))], Damage: 4, Hit twice if target is below 50% HP)"})
    ], {"legendary":true,"hatchCost":30,"hatchGroup":"Mythical","color":"#6D8E1E"}
  ),

  "Chespin": Pkmn(650, ["Grass"], 3, [8, 2, 2], "Def",
    "Overgrow - When HP ≤ 50%, Grass-type skill attacks deal +1 damage",
    [
      S("Vine Whip", "Line(2)(1)", 1, {"skillRaw":"Vine Whip (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoFrom":"None","evoCost":6,"evoTo":"Quilladin","color":"#3B6D11"}
  ),

  "Quilladin": Pkmn(651, ["Grass"], 3, [11, 3, 2], "Def",
    "Overgrow - When HP ≤ 50%, Grass-type skill attacks deal +1 damage",
    [
      S("Mud Shot", "Line(3)(1)", 2, {"skillRaw":"Mud Shot (Target = [1(Line(3)(1))], Damage: 2, Reduces enemy movement by 1 tile next turn)"})
    ], {"evoFrom":"Chespin","evoCost":8,"evoTo":"Chesnaught","color":"#3B6D11"}
  ),

  "Chesnaught": Pkmn(652, ["Grass", "Fighting"], 3, [15, 5, 3], "Def",
    "Overgrow - When HP ≤ 50%, Grass-type skill attacks deal +1 damage",
    [
      S("Spiky Shield", "AoE(1)", 0, {"skillRaw":"Spiky Shield (Target = [1(AoE(1))], Blocks all damage this turn, reflects 2 damage to close-range attackers)"})
    ], {"evoFrom":"Quilladin","evoTo":"None","color":"#3B6D11"}
  ),

  "Fennekin": Pkmn(653, ["Fire"], 3, [6, 2, 0], "Atk",
    "Blaze - When HP ≤ 50%, Fire-type skill attacks deal +1 damage",
    [
      S("Ember", "Line(3)(1)", 1, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Ember (Target = [1(Line(3)(1))], Damage: 1, 30% chance to burn for 3 turns)"})
    ], {"evoFrom":"None","evoCost":6,"evoTo":"Braixen","color":"#D85A30"}
  ),

  "Braixen": Pkmn(654, ["Fire"], 3, [9, 3, 0], "Atk",
    "Blaze - When HP ≤ 50%, Fire-type skill attacks deal +1 damage",
    [
      S("Psybeam", "Line(3)(1)", 2, {"statusChance":"confuse","statusChanceValue":0.3,"skillRaw":"Psybeam (Target = [1(Line(3)(1))], Damage: 2, 30% chance to confuse for 3 turns)"})
    ], {"evoFrom":"Fennekin","evoCost":8,"evoTo":"Delphox","color":"#D85A30"}
  ),

  "Delphox": Pkmn(655, ["Fire", "Psychic"], 3, [13, 5, 0], "Atk",
    "Blaze - When HP ≤ 50%, Fire-type skill attacks deal +1 damage",
    [
      S("Mystical Fire", "Cone(3)", 3, {"skillRaw":"Mystical Fire (Target = [1(Cone(3))], Damage: 3, Reduces enemy Atk by 1)"})
    ], {"evoFrom":"Braixen","evoTo":"None","color":"#D85A30"}
  ),

  "Froakie": Pkmn(656, ["Water"], 3, [6, 3, 0], "Atk",
    "Torrent - When HP ≤ 50%, Water-type skill attacks deal +1 damage",
    [
      S("Water Pulse", "Line(3)(1)", 2, {"statusChance":"confuse","statusChanceValue":0.3,"skillRaw":"Water Pulse (Target = [1(Line(3)(1))], Damage: 2, 30% chance to confuse for 3 turns)"})
    ], {"evoFrom":"None","evoCost":6,"evoTo":"Frogadier","color":"#185FA5"}
  ),

  "Frogadier": Pkmn(657, ["Water"], 3, [9, 4, 0], "Atk",
    "Torrent - When HP ≤ 50%, Water-type skill attacks deal +1 damage",
    [
      S("Aerial Ace", "Line(2)(1)", 2, {"skillRaw":"Aerial Ace (Target = [1(Line(2)(1))], Damage: 2, Never misses)"})
    ], {"evoFrom":"Froakie","evoCost":8,"evoTo":"Greninja","color":"#185FA5"}
  ),

  "Greninja": Pkmn(658, ["Water", "Dark"], 3, [13, 6, 0], "Atk",
    "Competitive - Gain Atk +2 when stats are lowered",
    [
      S("Water Shuriken", "Line(3)(1)", 1, {"skillRaw":"Water Shuriken (Target = [3(Line(3)(1))], Damage: 1 per hit, attacks 3 random times)"})
    ], {"evoFrom":"Frogadier","evoTo":"None","color":"#185FA5"}
  ),

  "Bunnelby": Pkmn(659, ["Normal"], 1, [6, 2, 0], "Atk",
    "Competitive - Gain Atk +2 when stats are lowered",
    [
      S("Mud-Slap", "Line(2)(1)", 1, {"skillRaw":"Mud-Slap (Target = [1(Line(2)(1))], Damage: 1, Reduces enemy accuracy)"})
    ], {"evoFrom":"None","evoCost":6,"evoTo":"Diggersby","color":"#5F5E5A"}
  ),

  "Diggersby": Pkmn(660, ["Normal", "Ground"], 1, [12, 4, 0], "Atk",
    "Huge Power - Increases base Atk by +2 for normal attacks",
    [
      S("Earthquake", "AoE(1)", 3, {"skillRaw":"Earthquake (Target = [1(AoE(1))], Damage: 3, Deals damage in an area)"})
    ], {"evoFrom":"Bunnelby","evoTo":"None","color":"#854F0B"}
  ),

  "Fletchling": Pkmn(661, ["Normal", "Flying"], 1, [5, 2, 0], "Atk",
    "Competitive - Gain Atk +2 when stats are lowered",
    [
      S("Peck", "Line(1)(1)", 1, {"skillRaw":"Peck (Target = [1(Line(1)(1))], Damage: 1)"})
    ], {"evoFrom":"None","evoCost":5,"evoTo":"Fletchinder","color":"#5F5E5A"}
  ),

  "Fletchinder": Pkmn(662, ["Fire", "Flying"], 1, [9, 3, 0], "Atk",
    "Flame Body - 30% chance to burn attacker for 3 turns on close-range hit",
    [
      S("Ember", "Line(2)(1)", 1, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Ember (Target = [1(Line(2)(1))], Damage: 1, 30% chance to burn for 3 turns)"})
    ], {"evoFrom":"Fletchling","evoCost":7,"evoTo":"Talonflame","color":"#D85A30"}
  ),

  "Talonflame": Pkmn(663, ["Fire", "Flying"], 1, [13, 5, 0], "Atk",
    "Gale Wings - Click active ability to fly to any empty tile in AoE(2) range (costs 1 MP, once per turn)",
    [
      S("Flare Blitz", "Line(3)(1)", 4, {"selfDamage":1,"skillRaw":"Flare Blitz (Target = [1(Line(3)(1))], Damage: 4, Takes 1 recoil damage)"})
    ], {"evoFrom":"Fletchinder","evoTo":"None","color":"#D85A30"}
  ),

  "Scatterbug": Pkmn(664, ["Bug"], 1, [5, 2, 0], "Support",
    "Shield Dust - Prevents secondary effects from enemy skills",
    [
      S("String Shot", "Line(2)(1)", 0, {"skillRaw":"String Shot (Target = [1(Line(2)(1))], Damage: 0, Reduces enemy movement by 1 tile)"})
    ], {"evoFrom":"None","evoCost":5,"evoTo":"Spewpa","color":"#6D8E1E"}
  ),

  "Spewpa": Pkmn(665, ["Bug"], 1, [8, 1, 2], "Def",
    "Shed Skin - 30% chance to cure status condition at end of turn",
    [
      S("Harden", "AoE(0)", 0, {"skillRaw":"Harden (Target = [1(AoE(0))], Damage: 0, Increases Def by +1)"})
    ], {"evoFrom":"Scatterbug","evoCost":7,"evoTo":"Vivillon","color":"#6D8E1E"}
  ),

  "Vivillon": Pkmn(666, ["Bug", "Flying"], 1, [12, 3, 0], "Support",
    "Compound Eyes - Increases accuracy of status skills by 20%",
    [
      S("Sleep Powder", "Cone(2)", 0, {"statusChance":"sleep","statusChanceValue":0.5,"skillRaw":"Sleep Powder (Target = [1(Cone(2))], Damage: 0, Puts enemies to sleep for 2 turns)"})
    ], {"evoFrom":"Spewpa","evoTo":"None","color":"#6D8E1E"}
  ),

  "Litleo": Pkmn(667, ["Fire", "Normal"], 2, [7, 3, 0], "Atk",
    "Rivalry - Deals more damage to same-gender/same-type opponents",
    [
      S("Ember", "Line(2)(1)", 1, {"statusChance":"burn","statusChanceValue":0.3,"skillRaw":"Ember (Target = [1(Line(2)(1))], Damage: 1, 30% chance to burn for 3 turns)"})
    ], {"evoFrom":"None","evoCost":7,"evoTo":"Pyroar","color":"#D85A30"}
  ),

  "Pyroar": Pkmn(668, ["Fire", "Normal"], 2, [13, 5, 0], "Atk",
    "Moxie - Gain permanent Atk +1 when KO enemy",
    [
      S("Flamethrower", "Line(4)(1)", 3, {"skillRaw":"Flamethrower (Target = [1(Line(4)(1))], Damage: 3)"})
    ], {"evoFrom":"Litleo","evoTo":"None","color":"#D85A30"}
  ),

  "Flab": Pkmn(669, ["Fairy"], 2, [6, 2, 0], "Support",
    "Flower Veil - Prevents Grass-type allies from being debuffed",
    [
      S("Fairy Wind", "Line(2)(1)", 1, {"skillRaw":"Fairy Wind (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoFrom":"None","evoCost":5,"evoTo":"Floette","color":"#C96BAA"}
  ),

  "Floette": Pkmn(670, ["Fairy"], 2, [9, 3, 1], "Support",
    "Flower Veil - Prevents allies from being debuffed",
    [
      S("Wish", "AoE(1)", 0, {"skillRaw":"Wish (Target = [1(AoE(1))], Damage: 0, Heals allies 1 HP)"})
    ], {"evoFrom":"Flabébé","evoCost":8,"evoTo":"Florges","color":"#C96BAA"}
  ),

  "Florges": Pkmn(671, ["Fairy"], 2, [14, 5, 2], "Support",
    "Flower Veil - Whenever a Fairy ally is healed, gain 1 Happiness",
    [
      S("Floral Blessing", "all(AoE(2))", 0, {"skillRaw":"Floral Blessing (Target = [all(AoE(2))], Heal allies 1 HP)"})
    ], {"evoFrom":"Floette","evoTo":"None","color":"#C96BAA"}
  ),

  "Skiddo": Pkmn(672, ["Grass"], 2, [8, 2, 1], "Def",
    "Sap Sipper - Blocks Grass-type moves, gains Atk +1 when hit",
    [
      S("Vine Whip", "Line(2)(1)", 1, {"skillRaw":"Vine Whip (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoFrom":"None","evoCost":6,"evoTo":"Gogoat","color":"#3B6D11"}
  ),

  "Gogoat": Pkmn(673, ["Grass"], 2, [15, 5, 2], "Def",
    "Sap Sipper - Absorbs Grass moves, gains Atk +1",
    [
      S("Horn Leech", "Line(2)(1)", 2, {"skillRaw":"Horn Leech (Target = [1(Line(2)(1))], Damage: 2, Heals self for 2 HP)"})
    ], {"evoFrom":"Skiddo","evoTo":"None","color":"#3B6D11"}
  ),

  "Pancham": Pkmn(674, ["Fighting"], 2, [7, 3, 0], "Atk",
    "Iron Fist - Increases punch-type skill damage by +1",
    [
      S("Karate Chop", "Line(1)(1)", 1, {"skillRaw":"Karate Chop (Target = [1(Line(1)(1))], Damage: 1, High crit rate)"})
    ], {"evoFrom":"None","evoCost":7,"evoTo":"Pangoro","color":"#A63D2E"}
  ),

  "Pangoro": Pkmn(675, ["Fighting", "Dark"], 2, [14, 6, 0], "Atk",
    "Iron Fist - Increases punch-type skill damage by +1",
    [
      S("Crunch", "Line(2)(1)", 2, {"skillRaw":"Crunch (Target = [1(Line(2)(1))], Damage: 2, 30% chance to lower enemy Def)"})
    ], {"evoFrom":"Pancham","evoTo":"None","color":"#A63D2E"}
  ),

  "Furfrou": Pkmn(676, ["Normal"], 2, [13, 4, 3], "Def",
    "Fur Coat - Reduces incoming damage from AoE/Cone/Line skills by 1",
    [
      S("Cotton Guard", "AoE(0)", 0, {"skillRaw":"Cotton Guard (Target = [1(AoE(0))], Damage: 0, Increases Def by +2 for 2 turns)"})
    ], {"evoFrom":"None","evoTo":"None","color":"#5F5E5A"}
  ),

  "Espurr": Pkmn(677, ["Psychic"], 2, [6, 2, 0], "Support",
    "Infiltrator - Attacks bypass barriers and protective effects",
    [
      S("Confusion", "Line(3)(1)", 1, {"statusChance":"confuse","statusChanceValue":0.3,"skillRaw":"Confusion (Target = [1(Line(3)(1))], Damage: 1, 30% chance to confuse for 3 turns)"})
    ], {"evoFrom":"None","evoCost":6,"evoTo":"Meowstic","color":"#993556"}
  ),

  "Meowstic": Pkmn(678, ["Psychic"], 2, [12, 4, 1], "Support",
    "Prankster - Status skills move first",
    [
      S("Psychic", "Cone(3)", 2, {"skillRaw":"Psychic (Target = [1(Cone(3))], Damage: 2, Reduces enemy range)"})
    ], {"evoFrom":"Espurr","evoTo":"None","color":"#993556"}
  ),

  "Honedge": Pkmn(679, ["Steel", "Ghost"], 2, [6, 3, 2], "Def",
    "No Guard - Attacks never miss",
    [
      S("Shadow Sneak", "Line(3)(1)", 1, {"skillRaw":"Shadow Sneak (Target = [1(Line(3)(1))], Damage: 1)"})
    ], {"evoFrom":"None","evoCost":6,"evoTo":"Doublade","color":"#3C3489"}
  ),

  "Doublade": Pkmn(680, ["Steel", "Ghost"], 2, [10, 4, 3], "Def",
    "No Guard - All attacks never miss",
    [
      S("Iron Defense", "AoE(0)", 0, {"skillRaw":"Iron Defense (Target = [1(AoE(0))], Damage: 0, Increases Def by +1)"})
    ], {"evoFrom":"Honedge","evoCost":8,"evoTo":"Aegislash","color":"#3C3489"}
  ),

  "Aegislash": Pkmn(681, ["Steel", "Ghost"], 2, [14, 4, 3], "Def",
    "Stance Change - Shield Form gives Def +1; Blade Form gives Atk +1. Swaps to Blade on attacks, swaps to Shield on King's Shield",
    [
      S("King's Shield", "AoE(1)", 0, {"skillRaw":"King's Shield (Target = [1(AoE(1))], Damage: 0, Blocks all damage, reduces attacker Atk by 1)"})
    ], {"evoFrom":"Doublade","evoTo":"None","color":"#3C3489"}
  ),

  "Spritzee": Pkmn(682, ["Fairy"], 2, [7, 2, 0], "Support",
    "Aroma Veil - Protects allies from disruptive status moves",
    [
      S("Sweet Kiss", "Line(2)(1)", 0, {"statusChance":"confuse","statusChanceValue":0.3,"skillRaw":"Sweet Kiss (Target = [1(Line(2)(1))], Damage: 0, 30% chance to confuse for 3 turns)"})
    ], {"evoFrom":"None","evoCost":7,"evoTo":"Aromatisse","color":"#C96BAA"}
  ),

  "Aromatisse": Pkmn(683, ["Fairy"], 2, [13, 4, 1], "Support",
    "Aroma Veil - Protects allies from status moves",
    [
      S("Aromatherapy", "AoE(2)", 0, {"skillRaw":"Aromatherapy (Target = [1(AoE(2))], Damage: 0, Cures all status conditions)"})
    ], {"evoFrom":"Spritzee","evoTo":"None","color":"#C96BAA"}
  ),

  "Swirlix": Pkmn(684, ["Fairy"], 2, [7, 2, 0], "Support",
    "Sweet Veil - Prevents Sleep status for all team members",
    [
      S("Fairy Wind", "Line(2)(1)", 1, {"skillRaw":"Fairy Wind (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoFrom":"None","evoCost":7,"evoTo":"Slurpuff","color":"#C96BAA"}
  ),

  "Slurpuff": Pkmn(685, ["Fairy"], 2, [13, 4, 1], "Support",
    "Sweet Veil - Prevents Sleep for all team members",
    [
      S("Draining Kiss", "Line(2)(1)", 2, {"skillRaw":"Draining Kiss (Target = [1(Line(2)(1))], Damage: 2, Heals self for 1 HP)"})
    ], {"evoFrom":"Swirlix","evoTo":"None","color":"#C96BAA"}
  ),

  "Inkay": Pkmn(686, ["Dark", "Psychic"], 2, [6, 2, 0], "Support",
    "Contrary - Inverts all stat changes (debuffs become buffs, buffs become debuffs)",
    [
      S("Hypnosis", "Line(2)(1)", 0, {"statusChance":"sleep","statusChanceValue":0.5,"skillRaw":"Hypnosis (Target = [1(Line(2)(1))], Damage: 0, Puts enemy to sleep for 2 turns)"})
    ], {"evoFrom":"None","evoCost":7,"evoTo":"Malamar","color":"#993556"}
  ),

  "Malamar": Pkmn(687, ["Dark", "Psychic"], 2, [13, 5, 0], "Atk",
    "Contrary - Inverts all stat changes (debuffs become buffs, buffs become debuffs)",
    [
      S("Superpower", "Line(1)(1)", 4, {"skillRaw":"Superpower (Target = [1(Line(1)(1))], Damage: 4, Gains Atk +1 and Def +1 from Contrary)"})
    ], {"evoFrom":"Inkay","evoTo":"None","color":"#993556"}
  ),

  "Binacle": Pkmn(688, ["Rock", "Water"], 2, [6, 2, 0], "Atk",
    "Tough Claws - Increases close-range attacks by +1",
    [
      S("Razor Shell", "Line(2)(1)", 2, {"skillRaw":"Razor Shell (Target = [1(Line(2)(1))], Damage: 2, 50% chance to lower enemy Def)"})
    ], {"evoFrom":"None","evoCost":7,"evoTo":"Barbaracle","color":"#185FA5"}
  ),

  "Barbaracle": Pkmn(689, ["Rock", "Water"], 2, [12, 5, 1], "Atk",
    "Tough Claws - Close-range attacks deal +1 damage",
    [
      S("Stone Edge", "Line(3)(1)", 3, {"skillRaw":"Stone Edge (Target = [1(Line(3)(1))], Damage: 3, High crit rate)"})
    ], {"evoFrom":"Binacle","evoTo":"None","color":"#185FA5"}
  ),

  "Skrelp": Pkmn(690, ["Poison", "Water"], 2, [6, 2, 0], "Support",
    "Poison Point - 30% chance to poison attacker on close-range hit",
    [
      S("Sludge Bomb", "Line(3)(1)", 2, {"statusChance":"poison","statusChanceValue":0.3,"skillRaw":"Sludge Bomb (Target = [1(Line(3)(1))], Damage: 2, Poisons for 4 turns)"})
    ], {"evoFrom":"None","evoCost":7,"evoTo":"Dragalge","color":"#185FA5"}
  ),

  "Dragalge": Pkmn(691, ["Poison", "Dragon"], 2, [13, 4, 1], "Support",
    "Poison Touch - 30% chance all attacks poison target",
    [
      S("Draco Meteor", "AoE(2)", 3, {"skillRaw":"Draco Meteor (Target = [1(AoE(2))], Damage: 3)"})
    ], {"evoFrom":"Skrelp","evoTo":"None","color":"#72243E"}
  ),

  "Clauncher": Pkmn(692, ["Water"], 2, [6, 2, 0], "Atk",
    "Mega Launcher - Increases cannon-type skill range by +1 tile",
    [
      S("Water Pulse", "Line(3)(1)", 2, {"statusChance":"confuse","statusChanceValue":0.3,"skillRaw":"Water Pulse (Target = [1(Line(3)(1))], Damage: 2, 30% chance to confuse)"})
    ], {"evoFrom":"None","evoCost":7,"evoTo":"Clawitzer","color":"#185FA5"}
  ),

  "Clawitzer": Pkmn(693, ["Water"], 2, [12, 5, 0], "Atk",
    "Mega Launcher - Cannon-type skills deal +1 damage",
    [
      S("Aura Sphere", "Line(4)(1)", 3, {"skillRaw":"Aura Sphere (Target = [1(Line(4)(1))], Damage: 3, Never misses)"})
    ], {"evoFrom":"Clauncher","evoTo":"None","color":"#185FA5"}
  ),

  "Helioptile": Pkmn(694, ["Electric", "Normal"], 2, [6, 2, 0], "Atk",
    "Dry Skin - Heals 1 HP per turn in rain, weak to fire",
    [
      S("Thunder Shock", "Line(2)(1)", 1, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Thunder Shock (Target = [1(Line(2)(1))], Damage: 1, 30% chance to paralyze)"})
    ], {"evoFrom":"None","evoCost":7,"evoTo":"Heliolisk","color":"#BA7517"}
  ),

  "Heliolisk": Pkmn(695, ["Electric", "Normal"], 2, [12, 5, 0], "Atk",
    "Solar Power - Increases Atk by +2 in sun, costs 1 HP per turn",
    [
      S("Thunderbolt", "Line(4)(1)", 3, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Thunderbolt (Target = [1(Line(4)(1))], Damage: 3, 30% chance to paralyze)"})
    ], {"evoFrom":"Helioptile","evoTo":"None","color":"#BA7517"}
  ),

  "Tyrunt": Pkmn(696, ["Rock", "Dragon"], 3, [7, 3, 0], "Atk",
    "Strong Jaw - Increases bite/chewing skill damage by +1",
    [
      S("Bite", "Line(1)(1)", 1, {"skillRaw":"Bite (Target = [1(Line(1)(1))], Damage: 1, 30% chance to flinch)"})
    ], {"evoFrom":"None","evoCost":8,"evoTo":"Tyrantrum","color":"#854F0B"}
  ),

  "Tyrantrum": Pkmn(697, ["Rock", "Dragon"], 3, [14, 6, 1], "Atk",
    "Strong Jaw - Bite/chewing skills deal +1 damage",
    [
      S("Head Smash", "Line(2)(1)", 4, {"selfDamage":1,"skillRaw":"Head Smash (Target = [1(Line(2)(1))], Damage: 4, Takes 1 recoil damage)"})
    ], {"evoFrom":"Tyrunt","evoTo":"None","color":"#854F0B"}
  ),

  "Amaura": Pkmn(698, ["Rock", "Ice"], 3, [8, 2, 0], "Support",
    "Refrigerate - When freezing a target, target also gets Def -1 for 1 turn",
    [
      S("Powder Snow", "Cone(2)", 1, {"statusChance":"freeze","statusChanceValue":0.3,"skillRaw":"Powder Snow (Target = [1(Cone(2))], Damage: 1, 30% chance to freeze)"})
    ], {"evoFrom":"None","evoCost":8,"evoTo":"Aurorus","color":"#854F0B"}
  ),

  "Aurorus": Pkmn(699, ["Rock", "Ice"], 3, [16, 4, 2], "Def",
    "Refrigerate - When freezing a target, target also gets Def -1 for 1 turn",
    [
      S("Blizzard", "AoE(2)", 3, {"statusChance":"freeze","statusChanceValue":0.3,"skillRaw":"Blizzard (Target = [1(AoE(2))], Damage: 3, 30% chance to freeze for 2 turns)"})
    ], {"evoFrom":"Amaura","evoTo":"None","color":"#854F0B"}
  ),

  "Sylveon": Pkmn(700, ["Fairy"], 2, [14, 4, 1], "Support",
    "Fairy Harmony - Whenever a Fairy ally is healed or gains a buff, Sylveon gains 1 Happiness",
    [
      S("Moonlight Melody", "Line(3)(1)", 3, {"skillRaw":"Moonlight Melody (Target = [1(Line(3)(1))], Damage: 3. If Sylveon has 10 Happiness, Damage +1. If Sylveon has 20 Happiness, heal all Fairy allies 2 HP)"})
    ], {"evoFrom":"Eevee","evoTo":"None","color":"#C96BAA"}
  ),

  "Hawlucha": Pkmn(701, ["Fighting", "Flying"], 2, [10, 4, 0], "Support",
    "Fighting Spirit Cheer - Fighting-type allies gain 1 Angry when using normal attacks",
    [
      S("Flying Press", "Line(3)(1)", 4, {"skillRaw":"Flying Press (Target = [1(Line(3)(1))], Damage: 4, Pushes target back 2 tiles)"})
    ], {"evoFrom":"None","evoTo":"None","color":"#A63D2E"}
  ),

  "Dedenne": Pkmn(702, ["Electric", "Fairy"], 2, [11, 3, 0], "Support",
    "Cheek Pouch - Heals 1 HP after using a skill",
    [
      S("Nuzzle", "Line(1)(1)", 1, {"statusChance":"paralysis","statusChanceValue":0.3,"skillRaw":"Nuzzle (Target = [1(Line(1)(1))], Damage: 1, Paralyzes target for 3 turns)"})
    ], {"evoFrom":"None","evoTo":"None","color":"#BA7517"}
  ),

  "Carbink": Pkmn(703, ["Rock", "Fairy"], 2, [11, 2, 4], "Def",
    "Clear Body - Prevents all stat reductions",
    [
      S("Light Screen", "AoE(1)", 0, {"skillRaw":"Light Screen (Target = [1(AoE(1))], Damage: 0, Reduces enemy special damage)"})
    ], {"evoFrom":"None","evoTo":"None","color":"#854F0B"}
  ),

  "Goomy": Pkmn(704, ["Dragon"], 3, [6, 2, 0], "Support",
    "Hydration - Cures all status conditions in rain",
    [
      S("Sludge Bomb", "Line(2)(1)", 2, {"statusChance":"poison","statusChanceValue":0.3,"skillRaw":"Sludge Bomb (Target = [1(Line(2)(1))], Damage: 2, 30% chance to poison)"})
    ], {"evoFrom":"None","evoCost":7,"evoTo":"Sliggoo","color":"#5F5E5A"}
  ),

  "Sliggoo": Pkmn(705, ["Dragon"], 3, [10, 3, 1], "Support",
    "Sap Sipper - Blocks Grass moves, gains Atk +1",
    [
      S("Dragon Pulse", "Line(3)(1)", 3, {"skillRaw":"Dragon Pulse (Target = [1(Line(3)(1))], Damage: 3)"})
    ], {"evoFrom":"Goomy","evoCost":9,"evoTo":"Goodra","color":"#5F5E5A"}
  ),

  "Goodra": Pkmn(706, ["Dragon"], 3, [15, 5, 3], "Def",
    "Gooey - Reduces enemy movement by 1 when hit by close-range attacks",
    [
      S("Muddy Water", "AoE(2)", 2, {"skillRaw":"Muddy Water (Target = [1(AoE(2))], Damage: 2, Reduces enemy accuracy)"})
    ], {"evoFrom":"Sliggoo","evoTo":"None","color":"#5F5E5A"}
  ),

  "Klefki": Pkmn(707, ["Steel", "Fairy"], 2, [12, 3, 1], "Support",
    "Fairy Locksmith - If Klefki has 18+ Happiness, Steel-type damage dealt to Fairy allies is reduced by 2",
    [
      S("Dazzling Keyring", "Aoe", 0, {"skillRaw":"Dazzling Keyring (Target = [1(Aoe)], Grant Shield to an Aoe ally equal to Klefki Happiness ÷ 5)"})
    ], {"evoFrom":"None","evoTo":"None","color":"#C96BAA"}
  ),

  "Phantump": Pkmn(708, ["Ghost", "Grass"], 2, [6, 2, 2], "Def",
    "Natural Cure - Removes all status when switched out",
    [
      S("Astonish", "Line(1)(1)", 1, {"skillRaw":"Astonish (Target = [1(Line(1)(1))], Damage: 1, 30% chance to flinch)"})
    ], {"evoFrom":"None","evoCost":7,"evoTo":"Trevenant","color":"#3B6D11"}
  ),

  "Trevenant": Pkmn(709, ["Ghost", "Grass"], 2, [14, 5, 2], "Def",
    "Regenerator - Heals 1 HP at end of turn",
    [
      S("Wood Hammer", "Line(2)(1)", 3, {"selfDamage":1,"skillRaw":"Wood Hammer (Target = [1(Line(2)(1))], Damage: 3, Takes 1 recoil damage)"})
    ], {"evoFrom":"Phantump","evoTo":"None","color":"#3B6D11"}
  ),

  "Pumpkaboo": Pkmn(710, ["Ghost", "Grass"], 2, [7, 2, 2], "Def",
    "Pickup - Randomly collects energy or buffs from defeated Pokemon",
    [
      S("Shadow Sneak", "Line(2)(1)", 1, {"skillRaw":"Shadow Sneak (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoFrom":"None","evoCost":7,"evoTo":"Gourgeist","color":"#3B6D11"}
  ),

  "Gourgeist": Pkmn(711, ["Ghost", "Grass"], 2, [13, 4, 3], "Def",
    "Pressure - Enemy skills targeting this Pokemon cost +1 Energy",
    [
      S("Phantom Force", "Line(3)(1)", 3, {"skillRaw":"Phantom Force (Target = [1(Line(3)(1))], Damage: 3, Becomes invulnerable for 1 turn)"})
    ], {"evoFrom":"Pumpkaboo","evoTo":"None","color":"#3B6D11"}
  ),

  "Bergmite": Pkmn(712, ["Ice"], 2, [7, 2, 2], "Def",
    "Ice Body - Heals 1 HP per turn in hail",
    [
      S("Rapid Spin", "AoE(1)", 1, {"skillRaw":"Rapid Spin (Target = [1(AoE(1))], Damage: 1, Clears hazards)"})
    ], {"evoFrom":"None","evoCost":7,"evoTo":"Avalugg","color":"#8CD16D"}
  ),

  "Avalugg": Pkmn(713, ["Ice"], 2, [15, 5, 3], "Def",
    "Sturdy - Prevents OHKO, survives with 1 HP",
    [
      S("Avalanche", "Line(2)(1)", 2, {"skillRaw":"Avalanche (Target = [1(Line(2)(1))], Damage: 2-4, Doubled if hit first this turn)"})
    ], {"evoFrom":"Bergmite","evoTo":"None","color":"#8CD16D"}
  ),

  "Noibat": Pkmn(714, ["Flying", "Dragon"], 3, [6, 2, 0], "Atk",
    "Infiltrator - Attacks bypass barriers and protective effects",
    [
      S("Gust", "Line(2)(1)", 1, {"skillRaw":"Gust (Target = [1(Line(2)(1))], Damage: 1)"})
    ], {"evoFrom":"None","evoCost":8,"evoTo":"Noivern","color":"#5F5E5A"}
  ),

  "Noivern": Pkmn(715, ["Flying", "Dragon"], 3, [14, 5, 0], "Atk",
    "Infiltrator - Bypasses all barriers and protective effects",
    [
      S("Boomburst", "AoE(2)", 3, {"skillRaw":"Boomburst (Target = [1(AoE(2))], Damage: 3)"})
    ], {"evoFrom":"Noibat","evoTo":"None","color":"#5F5E5A"}
  ),

  "Xerneas": Pkmn(716, ["Fairy"], 6, [15, 5, 1], "Support",
    "Blessing Aura - Whenever a Fairy ally uses a skill, gain 1 Happiness , If Xerneas has 20+ Happiness, gain 1 Energy Regen",
    [
      S("Geomancy", "AoE(2)", 0, {"skillHeal":3,"skillHealTarget":"ally","skillRaw":"Geomancy (Target = [1(AoE(2))], Charges 1 turn, next turn increases Atk +2 and heals 3 HP)"}),
      S("Heart Sacrifice", "Ally", 0, {"skillHeal":6,"skillHealTarget":"ally","skillRaw":"Heart Sacrifice (Target = [1(Ally)], Requires target to have 10+ Happiness. Remove 10 Happiness from target, Heal target 6 HP)"}),
      S("Eternal Radiance", "AoE(2)", 5, {"skillRaw":"Eternal Radiance (Target = [1(AoE(2))], Damage: 5. Consume all Happiness. Gain +1 Damage for every 5 Happiness consumed, then heal all allies equal to Happiness consumed ÷ 5)"})
    ], {"evoFrom":"None","evoCost":30,"evoTo":"None","color":"#C96BAA"}
  ),

  "Yveltal": Pkmn(717, ["Dark", "Flying"], 6, [14, 5, 3], "Def",
    "Dark Aura - All  Flying and Dark Pokémon on the field gain +2 Atk",
    [
      S("Oblivion Wing", "Line(3)(1)", 5, {"skillRaw":"Oblivion Wing (Target = [1(Line(3)(1))], Damage: 5, Heal Yveltal for damage dealt-2)"}),
      S("Crimson Feast", "AoE(1)", 2, {"skillRaw":"Crimson Feast (Target = [3(AoE(1))], Damage: 2, Heal Yveltal 1 HP for each enemy hit)"}),
      S("Soul Drain Eclipse", "Line(3)(1)", 5, {"skillRaw":"Soul Drain Eclipse (Target = [1(Line(3)(1))], Damage: 5, Steal 1 Atk from target and heal the lowest HP Dark ally 3 HP)"})
    ], {"evoFrom":"None","evoCost":30,"evoTo":"None","color":"#5F5E5A"}
  ),

  "Zygarde Reassembly Unit": Pkmn(718, ["Dragon", "Ground"], 6, [16, 4, 3], "Def",
    "Zygarde Reassembly Unit - A special structure placed on start. End of turn: empty tiles in AoE(2) have 10% chance to generate a Zygarde Cell. Collecting 10 cells summons Zygarde 10%.",
    [], {"base":true,"legendary":true,"evoCost":null,"evoTo":"Zygarde 10%","evoFrom":"None","color":"#5F8E4F"}
  ),

  "Zygarde 10%": Pkmn(718, ["Dragon", "Ground"], 6, [8, 2, 2], "Def",
    "Aura Break 10% - All Dark and Fairy Pokémon on the field lose 2 Atk. Under 50% HP, transforms to Complete Forme.",
    [
      S("Land's Wrath", "AoE(2)", 2, {"skillRaw":"Land's Wrath (Target = [3(AoE(2))], Damage: 2)"})
    ], {"base":false,"legendary":true,"evoCost":null,"evoTo":"Zygarde 50%","evoFrom":"Zygarde Reassembly Unit","color":"#5F8E4F","img":"https://img.pokemondb.net/artwork/avif/zygarde-10.avif"}
  ),

  "Zygarde 50%": Pkmn(718, ["Dragon", "Ground"], 6, [11, 4, 3], "Def",
    "Aura Break 50% - All Dark and Fairy Pokémon on the field lose 2 Atk. Under 50% HP, transforms to Complete Forme.",
    [
      S("Thousand Waves", "Cone(2)", 4, {"skillRaw":"Thousand Waves (Target = [3(Cone(2))], Damage: 4, Enemies hit cannot use Move Points next turn)"}),
      S("Ground Lock", "Line(3)(1)", 4, {"pullAmount":1,"skillRaw":"Ground Lock (Target = [1(Line(3)(1))], Damage: 4, Pull target 1 tile and Ground them)"})
    ], {"base":false,"legendary":true,"evoCost":null,"evoTo":"Zygarde Complete Forme","evoFrom":"Zygarde 10%","color":"#5F8E4F"}
  ),

  "Zygarde Complete Forme": Pkmn(718, ["Dragon", "Ground"], 6, [30, 5, 3], "Def",
    "Power Construct - Complete Forme has 30 HP, 5 Atk, 3 Def. Immune to status and destroys remaining Cells.",
    [
      S("Thousand Arrows", "AoE(1)", 5, {"skillRaw":"Thousand Arrows (Target = [3(AoE(1))], Damage: 5, Targets become grounded)"}),
      S("Core Enforcer", "Line(5)(1)", 6, {"skillRaw":"Core Enforcer (Target = [1(Line(5)(1))], Damage: 6, Disable target Ability for 2 turns)"}),
      S("World Rebirth", "AoE(2)", 0, {"skillHeal":2,"skillHealTarget":"ally","skillRaw":"World Rebirth (Target = [3(AoE(2))], Heal all allies 2 HP, Remove all debuffs)"})
    ], {"base":false,"legendary":true,"evoCost":null,"evoTo":"None","evoFrom":"Zygarde 50%","color":"#5F8E4F","img":"https://img.pokemondb.net/artwork/avif/zygarde-complete.avif"}
  ),

  "Diancie": Pkmn(719, ["Rock", "Fairy"], 5, [14, 4, 4], "Def",
    "Crystal Happiness - Whenever a Fairy ally gains Happiness, Diancie gains 1 Happiness. At 20 Happiness, heal all allies 1 HP and remove all status effects from them, then reset Happiness to 0",
    [
      S("Diamond Storm", "AoE(2)", 3, {"skillRaw":"Diamond Storm (Target = [3(AoE(2))], Damage: 3, Allies inside the AoE gain +1 Def for 1 turn)"}),
      S("Crystal Bloom", "AoE(2)", 0, {"skillRaw":"Crystal Bloom (Target = [3(AoE(2))], Heal allies 3 HP. Fairy and Rock allies heal 1 additional HP)"}),
      S("Royal Prism", "Line(4)(1)", 7, {"skillRaw":"Royal Prism (Target = [1(Line(4)(1))], Damage: 7, User takes 3 damage next turn)"})
    ], {"evoFrom":"None","evoCost":30,"evoTo":"None","color":"#854F0B"}
  ),

  "Hoopa": Pkmn(720, ["Psychic", "Ghost"], 5, [13, 5, 1], "Support",
    "Ring of Distortion - At the start of each turn, Hoopa may use this ability once per turn. Hoopa can teleport 1 allied unit to any empty tile anywhere on the map. When a unit is teleported, Hoopa gains +2 Atk. The teleported ally cannot attack for 1 turn but gains +1 Def for 1 turn.",
    [
      S("Hyperspace Hole", "Target = [1(Line(5)(1))]", 5, {"skillRaw":"Hyperspace Hole (Target = [1(Line(5)(1))]), Damage: 5, Ignores shields and protection"}),
      S("Dimensional Gate", "Target = [1(AoE(2))]", 0, {"skillRaw":"Dimensional Gate (Target = [1(AoE(2))]), Teleport allies in range randomly within AoE(2) around Hoopa"}),
      S("Spatial Collapse", "Target = [1(AoE(2))]", 0, {"skillRaw":"Spatial Collapse (Target = [1(AoE(2))]), Teleport enemies in range, deals 3 True damage"})
    ], {"evoFrom":"None","evoCost":30,"evoTo":"None","color":"#993556"}
  ),

  "Volcanion": Pkmn(721, ["Fire", "Water"], 5, [15, 5, 1], "Atk",
    "Steam Pressure - Whenever Volcanion uses a skill, all enemies hit gain 1 Steam stack. At 3 Steam stacks, the target becomes Burned for 2 turns ,Volcanion is immune to Burn. If Volcanion takes damage from a Fire or Water skill,Heal 1 hp",
    [
      S("Steam Cannon", "Target = [1(Line(5)(1))]", 6, {"skillRaw":"Steam Cannon (Target = [1(Line(5)(1))]), Damage: 6, Enemies gain 1 Steam stack"}),
      S("Hydro Eruption", "Target = [3(Cone(3))]", 4, {"skillRaw":"Hydro Eruption (Target = [3(Cone(3))]), Damage: 4, Enemies gain 1 Steam stack"}),
      S("Magma Flood", "Target = [5(AoE(2))]", 2, {"skillRaw":"Magma Flood (Target = [5(AoE(2))]), Damage: 2, Enemies gain 1 Steam stack"})
    ], {"evoFrom":"None","evoCost":30,"evoTo":"None","color":"#D85A30"}
  ),

  "Soul Prison": Pkmn(999, ["Ghost"], 0, [5, 0, 0], "Support",
    "Prisoner of War - Movable unit. Does not attack or use skills.",
    [], {"evoFrom":"None","evoCost":0,"evoTo":"None","color":"#3C3489"}
  )
};
