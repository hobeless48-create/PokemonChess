/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Skill {
  skillName: string;
  skillDesc: string;
  skillDmg?: number | string;
  skillRaw?: string;
  skillCost?: number;
  statusChance?: string;
  statusChanceValue?: number;
  skillHeal?: number;
  skillHealTarget?: string;
  selfDamage?: number;
  special?: string;
  specialDuration?: number;
  cooldown?: number;
  limit?: number;
  skillCooldown?: number;
  skillLimit?: number;
  drainAmount?: number;
  aoe?: number;
  skillEffect?: {
    target: string;
    stat: string;
    amount: number;
    duration: number;
  };
  customOffsets?: { dc: number; dr: number }[];
  isTargetSkill?: boolean;
  targetCount?: number;
  isCustom?: boolean;
  accuracy?: number;
  pushAmount?: number;
  pullAmount?: number;
  summonConfig?: {
    species: string;
    isMini: boolean;
    isStatic: boolean;
    hp?: number;
    atk?: number;
    def?: number;
    customSkill?: any; // Skill can be nested
    hasAoe?: boolean;
    aoeEffect?: string;
    aoeRange?: number;
    aoeDmg?: number;
    aoeHeal?: number;
    aoeCondition?: string;
  };
  customRadiusOffsets?: { dc: number; dr: number }[];
}

export interface PokemonDBEntry {
  dex: number;
  t1: string;
  t2: string;
  cost: number;
  hp: number;
  atk: number;
  def: number;
  cls: string;
  ability: string;
  abilityDesc: string;
  img: string;
  skills: Skill[];
  customMoveOffsets?: { dc: number; dr: number }[];
  skillName?: string;
  skillDesc?: string;
  skillDmg?: number | string;
  skillRaw?: string;
  skillCost?: number;
  base?: boolean;
  legendary?: boolean;
  evoCost?: number | null;
  evoTo?: string | null;
  evoFrom?: string | null;
  color?: string;
  hatchCost?: number;
  hatchGroup?: string;
  drainAmount?: number;
  specialDuration?: number;
  cooldown?: number;
  limit?: number;
  skillCooldown?: number;
  skillLimit?: number;
  special?: string;
  skillHealTarget?: string;
  skillHeal?: number;
  selfDamage?: number;
  statusChance?: string;
  statusChanceValue?: number;
  aoe?: number;
  skillEffect?: {
    target: string;
    stat: string;
    amount: number;
    duration: number;
  };
  isSummon?: boolean;
  accuracy?: number;
  pushAmount?: number;
  pullAmount?: number;
  summonConfig?: any;
}

export interface StatModifier {
  stat: string;
  amount: number;
  duration: number;
  source: string;
}

export interface LeechSeedStatus {
  sourceId: number; // Entity ID of the attacker
  duration: number;
}

export interface PokemonEntity {
  id: number;
  species: string;
  player: number; // 1 (Blue) or 2 (Red)
  col: number;
  row: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  fainted: boolean;
  exp: number;
  status: string | null; // 'burn' | 'poison' | 'toxic' | 'paralysis' | 'sleep' | 'freeze' | 'confuse' etc.
  statusTurns?: number;
  modifiers: StatModifier[];
  heldItem: string | null;
  isEgg: boolean;
  hasHatched: boolean;
  pendingHatch?: boolean;
  pendingEvo?: boolean;
  rotation?: number;
  futureSightCountdown?: number;
  futureSightCasterPlayer?: number;
  banishedTurns?: number;
  banishedCol?: number;
  banishedRow?: number;
  pendingEvoChoice?: boolean;
  pendingEvoTo?: string;
  hatchProgress?: number;
  hasMoved?: boolean;
  hasMovedEver?: boolean;
  hasAttacked?: boolean;
  hasUsedSkill?: boolean;
  hasUsedMP?: boolean;
  weatherTriggered?: boolean;
  focusBandUsed?: boolean;
  skillUses?: { [key: string]: number };
  skillCooldowns?: { [key: string]: number };
  leechSeed?: LeechSeedStatus | null;
  reflectedType?: string | null;
  transformState?: {
    originalSpecies: string;
    originalAtk: number;
    originalDef: number;
    originalMaxHp: number;
    turnsLeft: number;
  } | null;
  damageReceivedThisTurn?: number;
  damageReceivedLastTurn?: number;
  pressureTriggered?: boolean;
  customSkills?: Skill[];
  isSummon?: boolean;
  summonConfig?: any;
  shield?: number;
  shieldDuration?: number;
  activeAbilityUsed?: boolean;
  curryEffect?: {
    hpBoost: number;
    turnsLeft: number;
  } | null;
  customBar?: {
    type: "Happiness" | "Frost" | "Angry";
    value: number;
    max: number;
  } | null;
  zygCellsCollected?: number;
  zyg10Spawned?: boolean;
  aegislashForm?: "Shield" | "Blade";
}

export interface Pedestal {
  player: number; // 1 or 2
  col: number;
  row: number;
  hp: number;
  maxHp: number;
}

export interface BattleLogEntry {
  id: string;
  msg: string;
  type: "sys" | "atk" | "heal" | "combat" | "";
  timestamp: string;
}

export interface Inventory {
  held: string[];
  consumable: string[];
}

export interface PlayerState {
  gold: number;
  freeExp: number;
  inventory: Inventory;
  hatchPools: { [hatchGroup: string]: number };
}

export interface Hazard {
  col: number;
  row: number;
  type: "spikes" | "stealthRock" | "honey";
  duration: number;
  player: number;
}

export interface GameState {
  turn: number;
  phase: number;
  currentPlayer: number; // 1 or 2
  energy: { [player: number]: number };
  maxEnergy: { [player: number]: number };
  movePoints?: { [player: number]: number };
  consumablesUsedThisTurn?: { total: number; powerHerb: number; };
  weather: {
    type: string | null;
    duration: number;
  };
  terrain: {
    type: string | null;
    duration: number;
  };
  hazards?: Hazard[];
  pokemon: PokemonEntity[];
  pedestals: Pedestal[];
  logs: BattleLogEntry[];
  players: { [player: number]: PlayerState };
  selectedCell: { col: number; row: number } | null;
  highlightedCells: { col: number; row: number; type: "move" | "atk" | "atk-preview" | "skill-preview" }[];
  actionMode: {
    type: "move" | "attack" | "skill" | "equip";
    pokeId?: number;
    skillIdx?: number;
    confirmingIdx?: number | null;
    item?: string;
    itemType?: string;
    maxTargets?: number;
    targets?: { col: number; row: number }[];
  } | null;
  skillMenuFor: number | null;
}

export interface ShopItem {
  name: string;
  desc: string;
  category: "Offense" | "Defense" | "Utility" | "Consumable";
  cost: number;
  img: string;
  type: "held" | "consumable";
  effect?: {
    stat: string;
    amount: number;
    condition?: string;
  };
}
