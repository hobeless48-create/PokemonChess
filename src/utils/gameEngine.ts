/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PokemonEntity, Pedestal, PokemonDBEntry, Skill, StatModifier } from "../types";
import { DB } from "../data/pokemon";
import { ITEMS } from "../data/items";
import { TEFF } from "../data/typeCharts";

const DDIRS: { [key: number]: { dc: number; dr: number } } = {
  1: { dc: 0, dr: -1 },
  2: { dc: 1, dr: 0 },
  3: { dc: 0, dr: 1 },
  4: { dc: -1, dr: 0 }
};

export function normalizeDir(dir: number, player: number): number {
  if (dir === 1 || dir === 3) {
    return player === 1 ? 3 : 1;
  }
  return dir;
}

export const MOVE_PATTERNS: {
  [cls: string]: { [stage: number]: { dc: number; dr: number }[] };
} = {
  Attack: {
    1: [
      { dc: -1, dr: -1 }, { dc: 1, dr: -1 },
      { dc: -1, dr: 1 }, { dc: 1, dr: 1 }
    ],
    2: [
      { dc: -1, dr: -1 }, { dc: 0, dr: -1 }, { dc: 1, dr: -1 },
      { dc: -1, dr: 0 },                      { dc: 1, dr: 0 },
      { dc: -1, dr: 1 },  { dc: 0, dr: 1 },  { dc: 1, dr: 1 }
    ],
    3: [
      { dc: -1, dr: -1 }, { dc: 0, dr: -1 }, { dc: 1, dr: -1 },
      { dc: -1, dr: 0 },                      { dc: 1, dr: 0 },
      { dc: -1, dr: 1 },  { dc: 0, dr: 1 },  { dc: 1, dr: 1 },
      { dc: 0, dr: -2 },  { dc: -2, dr: 0 }, { dc: 2, dr: 0 }, { dc: 0, dr: 2 }
    ]
  },
  Defense: {
    1: [
      { dc: 0, dr: -1 },
      { dc: -1, dr: 0 }, { dc: 1, dr: 0 },
      { dc: 0, dr: 1 }
    ],
    2: [
      { dc: 0, dr: -2 }, { dc: 0, dr: -1 },
      { dc: -2, dr: 0 }, { dc: -1, dr: 0 }, { dc: 1, dr: 0 }, { dc: 2, dr: 0 },
      { dc: 0, dr: 1 },  { dc: 0, dr: 2 }
    ],
    3: [
      { dc: 0, dr: -3 }, { dc: 0, dr: -2 }, { dc: 0, dr: -1 },
      { dc: -3, dr: 0 }, { dc: -2, dr: 0 }, { dc: -1, dr: 0 }, { dc: 1, dr: 0 }, { dc: 2, dr: 0 }, { dc: 3, dr: 0 },
      { dc: 0, dr: 1 },  { dc: 0, dr: 2 },  { dc: 0, dr: 3 }
    ]
  },
  Support: {
    1: [
      { dc: 0, dr: -1 },
      { dc: -1, dr: 0 }, { dc: 1, dr: 0 },
      { dc: 0, dr: 1 }
    ],
    2: [
      { dc: -1, dr: -1 }, { dc: 0, dr: -1 }, { dc: 1, dr: -1 },
      { dc: -1, dr: 0 },                      { dc: 1, dr: 0 },
      { dc: -1, dr: 1 },  { dc: 0, dr: 1 },  { dc: 1, dr: 1 }
    ],
    3: [
      { dc: -1, dr: -1 }, { dc: 0, dr: -1 }, { dc: 1, dr: -1 },
      { dc: -1, dr: 0 },                      { dc: 1, dr: 0 },
      { dc: -1, dr: 1 },  { dc: 0, dr: 1 },  { dc: 1, dr: 1 },
      { dc: 0, dr: -2 },  { dc: -2, dr: 0 }, { dc: 2, dr: 0 }, { dc: 0, dr: 2 }
    ]
  },
  Assassin: {
    1: [
      { dc: -1, dr: -1 }, { dc: 1, dr: -1 },
      { dc: -1, dr: 1 },  { dc: 1, dr: 1 }
    ],
    2: [
      { dc: -2, dr: -2 }, { dc: -1, dr: -1 }, { dc: 1, dr: -1 }, { dc: 2, dr: -2 },
      { dc: -2, dr: 2 },  { dc: -1, dr: 1 },  { dc: 1, dr: 1 },  { dc: 2, dr: 2 }
    ],
    3: [
      { dc: -3, dr: -3 }, { dc: -2, dr: -2 }, { dc: -1, dr: -1 }, { dc: 1, dr: -1 }, { dc: 2, dr: -2 }, { dc: 3, dr: -3 },
      { dc: -3, dr: 3 },  { dc: -2, dr: 2 },  { dc: -1, dr: 1 },  { dc: 1, dr: 1 },  { dc: 2, dr: 2 },  { dc: 3, dr: 3 }
    ]
  }
};

export function adjCells(col: number, row: number, range: number, diagonal: boolean): { col: number; row: number }[] {
  const out: { col: number; row: number }[] = [];
  for (let dc = -range; dc <= range; dc++) {
    for (let dr = -range; dr <= range; dr++) {
      if (dc === 0 && dr === 0) continue;
      if (!diagonal && Math.abs(dc) + Math.abs(dr) > range) continue;
      const nc = col + dc, nr = row + dr;
      if (nc >= 0 && nc < 11 && nr >= 0 && nr < 11) {
        out.push({ col: nc, row: nr });
      }
    }
  }
  return out;
}

export function getLineCells(col: number, row: number, range: number, dirs: number[]): { col: number; row: number }[] {
  const out: { col: number; row: number }[] = [];
  dirs.forEach(d => {
    const dir = DDIRS[d];
    if (!dir) return;
    for (let step = 1; step <= range; step++) {
      const nc = col + dir.dc * step;
      const nr = row + dir.dr * step;
      if (nc < 0 || nc >= 11 || nr < 0 || nr >= 11) break;
      out.push({ col: nc, row: nr });
    }
  });
  return out;
}

export function getConeCells(col: number, row: number, range: number, dir: number): { col: number; row: number }[] {
  const out: { col: number; row: number }[] = [];
  if (dir === 1 || dir === 3) {
    const dy = dir === 1 ? -1 : 1;
    for (let step = 1; step <= range; step++) {
      const nr = row + dy * step;
      if (range === 1) {
        for (let dx = -1; dx <= 1; dx++) {
          const nc = col + dx;
          if (nc >= 0 && nc < 11 && nr >= 0 && nr < 11) out.push({ col: nc, row: nr });
        }
      } else if (step === 1) {
        const nc = col;
        if (nc >= 0 && nc < 11 && nr >= 0 && nr < 11) out.push({ col: nc, row: nr });
      } else if (step < range) {
        for (let dx = -1; dx <= 1; dx++) {
          const nc = col + dx;
          if (nc >= 0 && nc < 11 && nr >= 0 && nr < 11) out.push({ col: nc, row: nr });
        }
      } else {
        for (let dx = -(range - 1); dx <= (range - 1); dx++) {
          const nc = col + dx;
          if (nc >= 0 && nc < 11 && nr >= 0 && nr < 11) out.push({ col: nc, row: nr });
        }
      }
    }
  } else {
    const dx = dir === 2 ? 1 : -1;
    for (let step = 1; step <= range; step++) {
      const nc = col + dx * step;
      if (range === 1) {
        for (let dy = -1; dy <= 1; dy++) {
          const nr = row + dy;
          if (nr >= 0 && nr < 11 && nc >= 0 && nc < 11) out.push({ col: nc, row: nr });
        }
      } else if (step === 1) {
        if (nc >= 0 && nc < 11) out.push({ col: nc, row });
      } else if (step < range) {
        for (let dy = -1; dy <= 1; dy++) {
          const nr = row + dy;
          if (nr >= 0 && nr < 11 && nc >= 0 && nc < 11) out.push({ col: nc, row: nr });
        }
      } else {
        for (let dy = -(range - 1); dy <= (range - 1); dy++) {
          const nr = row + dy;
          if (nr >= 0 && nr < 11 && nc >= 0 && nc < 11) out.push({ col: nc, row: nr });
        }
      }
    }
  }
  return out;
}

export function getSpeciesStage(species: string): number {
  const db = DB[species];
  if (!db) return 1;
  if (db.legendary || species === "Aerodactyl") return 3;
  if (!db.evoFrom) return 1;
  if (db.evoTo) return 2;
  return 3;
}

export function pkAt(col: number, row: number, pokemonList: PokemonEntity[]): PokemonEntity | undefined {
  return pokemonList.find(p => p.col === col && p.row === row && !p.fainted && !(p.banishedTurns && p.banishedTurns > 0));
}

export function pedAt(col: number, row: number, pedestals: Pedestal[]): Pedestal | undefined {
  return pedestals.find(p => p.col === col && p.row === row);
}

export function getRoleBasedMoves(p: PokemonEntity, pokemonList: PokemonEntity[], pedestals: Pedestal[]): { col: number; row: number }[] {
  const db = DB[p.species];
  const out: { col: number; row: number }[] = [];
  const col = p.col;
  const row = p.row;
  const fwd = p.player === 1 ? 1 : -1;
  if (db && db.legendary && p.isEgg && !p.hasHatched) return [];

  const addIfValid = (c: number, r: number) => {
    if (c >= 0 && c < 11 && r >= 0 && r < 11 && !pkAt(c, r, pokemonList) && !pedAt(c, r, pedestals)) {
      out.push({ col: c, row: r });
    }
  };

  const cls = (db && db.cls) || 'Attack';
  const stage = getSpeciesStage(p.species);
  const patternSet = MOVE_PATTERNS[cls] || MOVE_PATTERNS['Attack'];
  const pattern = patternSet[stage] || patternSet[1];
  pattern.forEach(off => {
    const nc = col + off.dc;
    const nr = row + off.dr * fwd;
    addIfValid(nc, nr);
  });
  return out;
}

export function getAtkCells(p: PokemonEntity, pokemonList: PokemonEntity[], pedestals: Pedestal[]): { col: number; row: number }[] {
  const adj = adjCells(p.col, p.row, 1, true);
  const out: { col: number; row: number }[] = [];
  adj.forEach(c => {
    const t = pkAt(c.col, c.row, pokemonList);
    const pd = pedAt(c.col, c.row, pedestals);
    if ((t && t.player !== p.player) || (pd && pd.player !== p.player)) {
      out.push({ col: c.col, row: c.row });
    }
  });
  return out;
}

export interface ParsedShape {
  type: string | null;
  range?: number;
  dirs?: number[];
  radius?: number;
  parts?: ParsedShape[];
  targetCount: number | null;
}

export function parseSkillShape(db: PokemonDBEntry, p: PokemonEntity, skillIdx?: number): ParsedShape {
  let desc = '';
  if (typeof skillIdx !== 'undefined' && db && Array.isArray(db.skills) && db.skills[skillIdx]) {
    desc = db.skills[skillIdx].skillDesc || '';
  } else {
    desc = db.skillDesc || '';
  }

  if (desc.trim().toLowerCase() === 'all') return { type: 'all', targetCount: null };

  const m = desc.match(/Target\s*=\s*\[(\d+)\((.+)\)\]/i);
  let targetCount: number | null = null;
  let inner = desc;
  if (m) {
    targetCount = parseInt(m[1], 10);
    inner = m[2];
  }

  const parts = inner.split('+').map(s => s.trim()).filter(Boolean);
  const parsedParts: ParsedShape[] = [];

  parts.forEach(part => {
    let mm = part.match(/Line\((\d+)\)\(([0-9,]+)\)/i);
    if (mm) {
      const rot = p.rotation || 0;
      parsedParts.push({
        type: 'line',
        range: parseInt(mm[1], 10),
        dirs: mm[2].split(',').map(n => {
          const d = parseInt(n, 10);
          const baseDir = normalizeDir(d, p.player);
          const rotated = ((baseDir - 1 + rot) % 4) + 1;
          return rotated;
        }),
        targetCount: null
      });
      return;
    }
    mm = part.match(/Cone\((\d+)\)(?:\(([0-9,]+)\))?/i);
    if (mm) {
      const rot = p.rotation || 0;
      const baseDirs = mm[2] ? mm[2].split(',').map(n => parseInt(n, 10)) : [3];
      const dirs = baseDirs.map(d => {
        const baseDir = normalizeDir(d, p.player);
        const rotated = ((baseDir - 1 + rot) % 4) + 1;
        return rotated;
      });
      parsedParts.push({
        type: 'cone',
        range: parseInt(mm[1], 10),
        dirs,
        targetCount: null
      });
      return;
    }
    mm = part.match(/AoE\((\d+)\)(?:\((\d+)\))?/i);
    if (mm) {
      const radius = parseInt(mm[1], 10);
      const range = mm[2] ? parseInt(mm[2], 10) : undefined;
      parsedParts.push({
        type: 'aoe',
        radius,
        range,
        targetCount: null
      });
      return;
    }
  });

  if (parsedParts.length === 0) return { type: null, targetCount };
  if (parsedParts.length === 1) return { ...parsedParts[0], targetCount };
  return { type: 'combo', parts: parsedParts, targetCount };
}

export function getSkillData(db: PokemonDBEntry, skillIdx?: number): Skill {
  if (typeof skillIdx !== 'undefined' && db && Array.isArray(db.skills) && db.skills[skillIdx]) {
    return db.skills[skillIdx];
  }
  return {
    skillName: db.skillName || "Skill",
    skillDesc: db.skillDesc || "",
    skillDmg: db.skillDmg,
    skillRaw: db.skillRaw,
    skillCost: db.skillCost,
    statusChance: db.statusChance,
    statusChanceValue: db.statusChanceValue,
    skillEffect: db.skillEffect
  };
}

export function getSkillTargetType(skill: Skill, dbAll: PokemonDBEntry): string | null {
  return (
    skill?.skillEffect?.target ||
    skill?.skillHealTarget ||
    (skill?.special === 'leechSeed' ? 'enemy' : null) ||
    dbAll?.skillEffect?.target ||
    dbAll?.skillHealTarget ||
    (dbAll?.special === 'leechSeed' ? 'enemy' : null) ||
    null
  );
}

export function getModifiedStat(p: PokemonEntity, stat: "atk" | "def", pokemonList: PokemonEntity[], context: any = {}): number {
  const db = DB[p.species];
  if (!db) return stat === 'atk' ? p.atk : p.def;
  let base = stat === 'atk' ? p.atk : p.def;

  if (db && db.ability === "Unaware") {
    return base;
  }

  // Active Abilities
  if (db.ability === "Adaptability" && stat === "atk") {
    base += 1;
  }
  if (db.ability === "Huge Power" && stat === "atk") {
    base += 2;
  }
  if (db.ability === "Guts" && stat === "atk" && p.status) {
    base += 2;
  }
  if (db.ability === "Marvel Scale" && stat === "def" && p.status) {
    base += 2;
  }

  // Burn status debuff: -1 ATK
  if (p.status === "burn" && stat === "atk") {
    base = Math.max(0, base - 1);
  }
  const isSunny = context.weather === "Sunlight" || context.weather === "Harsh Sunlight";
  const isRain = context.weather === "Rain" || context.weather === "Heavy Rain";
  const isSandstorm = context.weather === "Sandstorm";
  const isHail = context.weather === "Hail Storm";

  if (isSunny) {
    if (db.ability === "Solar Power" && stat === "atk") {
      base += 2;
    }
    if (db.ability === "Chlorophyll" && stat === "def") {
      base += 1;
    }
  }
  if (isSandstorm) {
    if (db.ability === "Sand Veil" && stat === "def") {
      base += 1;
    }
    if (stat === "def" && (db.t1 === "Rock" || db.t2 === "Rock")) {
      base += 1;
    }
  }

  // Active Weather adjustments
  if (stat === "atk") {
    const activeType = p.reflectedType || db.t1;
    if (context.weather === "Sunlight" && activeType === "Fire") {
      base += 1;
    }
    if (context.weather === "Harsh Sunlight") {
      if (activeType === "Fire") base += 1;
      if (activeType === "Water") base = Math.max(0, base - 2);
    }
    if (context.weather === "Rain" && activeType === "Water") {
      base += 1;
    }
    if (context.weather === "Heavy Rain") {
      if (activeType === "Water") base += 1;
      if (activeType === "Fire") base = Math.max(0, base - 2);
    }
    if (isHail && context.action === "melee") {
      base = Math.max(0, base - 1);
    }
    if (isSandstorm && context.isSkill) {
      base = Math.max(0, base - 1);
    }
  }

  // Check adjacent Intimidate opponents
  if (stat === "atk" && pokemonList && pokemonList.length > 0) {
    const enemies = pokemonList.filter(other => other.player !== p.player && !other.fainted);
    const hasAdjIntimidate = enemies.some(other => {
      const otherDb = DB[other.species];
      if (otherDb && otherDb.ability === "Intimidate") {
        const dist = Math.abs(other.col - p.col) + Math.abs(other.row - p.row);
        return dist === 1;
      }
      return false;
    });
    if (hasAdjIntimidate) {
      base = Math.max(0, base - 1);
    }
  }

  // Held Item checks
  if (p.heldItem && ITEMS[p.heldItem]) {
    const itemData = ITEMS[p.heldItem];
    if (itemData.effect && itemData.effect.stat === stat) {
      if (!itemData.effect.condition) {
        base += itemData.effect.amount;
      } else {
        if (itemData.effect.condition === "melee" && context.action === "melee") base += itemData.effect.amount;
        if (itemData.effect.condition === "skill" && context.isSkill) base += itemData.effect.amount;
      }
    }
    if (p.heldItem === "Eviolite" && stat === "def" && db.evoTo) base += 1;
    if (p.heldItem === "Assault Vest" && stat === "def" && context.bySkill) base += 1;
    if (p.heldItem === "Metal Coat" && stat === "atk" && !p.hasMoved) base += 1;
    if (p.heldItem === "Sharp Beak" && stat === "atk" && p.hasMoved) base += 1;
    if ((p.heldItem === "King's Rock" || p.heldItem === "King’s Rock") && stat === "atk" && context.target && context.target.hp < context.target.maxHp * 0.5) base += 1;
    if (p.heldItem === "Scope Lens" && stat === "atk" && context.target && context.target.hp === context.target.maxHp) base += 1;
  }

  // Active Modifiers
  if (p.modifiers) {
    p.modifiers.forEach(m => {
      if (m.stat === stat) base += m.amount;
    });
  }

  return base;
}

export function isPathBlocked(
  c0: number,
  r0: number,
  c1: number,
  r1: number,
  pokemonList: PokemonEntity[] = [],
  pedestals: Pedestal[] = []
): boolean {
  const dc = c1 - c0;
  const dr = r1 - r0;
  const steps = Math.max(Math.abs(dc), Math.abs(dr));
  if (steps <= 1) return false;

  for (let s = 1; s < steps; s++) {
    const tc = c0 + Math.round((dc * s) / steps);
    const tr = r0 + Math.round((dr * s) / steps);
    const obstacleUnit = pokemonList.find(p => p.col === tc && p.row === tr && !p.fainted);
    const obstaclePed = pedestals.find(p => p.col === tc && p.row === tr);
    if (obstacleUnit || obstaclePed) {
      return true;
    }
  }
  return false;
}

export function getSkillShapeCells(
  p: PokemonEntity,
  pokemonList: PokemonEntity[] = [],
  pedestals: Pedestal[] = [],
  skillIdx?: number
): { col: number; row: number }[] {
  const db = DB[p.species];
  if (!db) return [];
  const skill = getSkillData(db, skillIdx);

  if (skill.skillName === "Teleport") {
    const out: { col: number; row: number }[] = [];
    for (let c = 0; c < 11; c++) {
      for (let r = 0; r < 11; r++) {
        const dist = Math.max(Math.abs(c - p.col), Math.abs(r - p.row));
        if (dist <= 3) {
          out.push({ col: c, row: r });
        }
      }
    }
    return out;
  }

  const shape = parseSkillShape(db, p, skillIdx);
  const effectTarget = getSkillTargetType(skill, db);

  if (effectTarget === 'self' || skill.skillName === "Transform") {
    return [{ col: p.col, row: p.row }];
  }
  
  if (shape && shape.type) {
    const cells: { col: number; row: number }[] = [];
    const addShapeCells = (sh: ParsedShape) => {
      if (!sh) return;
      if (sh.type === 'line' && sh.range && sh.dirs) {
        cells.push(...getLineCells(p.col, p.row, sh.range, sh.dirs));
      } else if (sh.type === 'cone' && sh.range && sh.dirs) {
        sh.dirs.forEach(dir => cells.push(...getConeCells(p.col, p.row, sh.range!, dir)));
      } else if (sh.type === 'aoe' && sh.radius) {
        if (sh.range) {
          cells.push(...adjCells(p.col, p.row, sh.range, true));
          cells.push({ col: p.col, row: p.row });
        } else {
          cells.push(...adjCells(p.col, p.row, sh.radius, true));
          cells.push({ col: p.col, row: p.row });
        }
      }
    };

    if (shape.type === 'combo' && shape.parts) {
      shape.parts.forEach(addShapeCells);
    } else {
      addShapeCells(shape);
    }
    
    // De-duplicate
    const seen: { [key: string]: boolean } = {};
    let filtered = cells.filter(c => {
      const key = `${c.col},${c.row}`;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });

    const hasLineOrCone = shape.type === 'line' || shape.type === 'cone' ||
      (shape.type === 'combo' && shape.parts?.some(sh => sh.type === 'line' || sh.type === 'cone'));

    if (hasLineOrCone) {
      filtered = filtered.filter(c => !isPathBlocked(p.col, p.row, c.col, c.row, pokemonList, pedestals));
    }

    return filtered;
  }

  const range = (db.cost || 1) + 1; // Default fallback range math
  return adjCells(p.col, p.row, range, true);
}

export function getSkillCells(
  p: PokemonEntity,
  pokemonList: PokemonEntity[],
  pedestals: Pedestal[],
  skillIdx?: number
): { col: number; row: number; type: "move" | "atk" | "atk-preview" | "skill-preview" }[] {
  const db = DB[p.species];
  if (!db) return [];
  const skill = getSkillData(db, skillIdx);
  const effectTarget = getSkillTargetType(skill, db);

  if (skill.skillName === "Teleport") {
    const out: { col: number; row: number; type: "move" | "atk" | "atk-preview" | "skill-preview" }[] = [];
    for (let c = 0; c < 11; c++) {
      for (let r = 0; r < 11; r++) {
        const dist = Math.max(Math.abs(c - p.col), Math.abs(r - p.row));
        if (dist <= 3) {
          if (!pkAt(c, r, pokemonList) && !pedAt(c, r, pedestals)) {
            out.push({ col: c, row: r, type: 'skill-preview' });
          }
        }
      }
    }
    return out;
  }

  if (skill.skillName === "Transform") {
    return pokemonList
      .filter(x => x.id !== p.id && !x.fainted)
      .map(x => ({ col: x.col, row: x.row, type: 'atk' as const }));
  }

  if (effectTarget === 'self') {
    return [{ col: p.col, row: p.row, type: 'atk' }];
  }
  if (effectTarget === 'all_allies') {
    return pokemonList
      .filter(x => x.player === p.player && !x.fainted)
      .map(x => ({ col: x.col, row: x.row, type: 'atk' as const }));
  }

  const shape = parseSkillShape(db, p, skillIdx);
  const isAoE = shape.type === "aoe" || shape.type === "cone" || (shape.type === "line" && shape.range && shape.range > 1);

  const shapeCells = getSkillShapeCells(p, pokemonList, pedestals, skillIdx);

  return shapeCells.reduce<{ col: number; row: number; type: "move" | "atk" | "atk-preview" | "skill-preview" }[]>((acc, c) => {
    const t = pkAt(c.col, c.row, pokemonList);
    const pd = pedAt(c.col, c.row, pedestals);

    if (effectTarget === 'ally') {
      if (t && t.player === p.player) {
         acc.push({ col: c.col, row: c.row, type: 'atk' });
      } else if (isAoE) {
         acc.push({ col: c.col, row: c.row, type: 'skill-preview' });
      }
      return acc;
    }

    if (effectTarget === 'enemy') {
      if ((t && t.player !== p.player) || (pd && pd.player !== p.player)) {
        acc.push({ col: c.col, row: c.row, type: 'atk' });
      }
      return acc;
    }

    // Default targeting shows anything that can be hit
    if (t || pd) {
      acc.push({ col: c.col, row: c.row, type: 'atk' });
    } else {
      // Show empty tiles as previews in targeting mode
      acc.push({ col: c.col, row: c.row, type: 'skill-preview' });
    }
    return acc;
  }, []);
}

export function typeBonus(attacker: PokemonEntity, target: PokemonEntity, weather?: string | null): number {
  const adb = DB[attacker.species];
  const tdb = DB[target.species];
  if (!adb || !tdb) return 0;
  let b = 0;
  const atkType = attacker.reflectedType || adb.t1;
  const defType = target.reflectedType || tdb.t1;
  
  const e = TEFF[atkType];
  if (!e) return 0;
  if (e.strong && e.strong.includes(defType)) {
    b++;
  }
  if (e.weak && e.weak.includes(defType)) {
    b--;
  }

  if (weather === "Strong Winds") {
    const isFlying = tdb.t1 === "Flying" || tdb.t2 === "Flying";
    if (isFlying && b > 0) {
      b = 0;
    }
  }

  return b;
}

export function getStatusChanceValue(status: string, source: any = null): number {
  if (source && typeof source.statusChanceValue === 'number') {
    return source.statusChanceValue;
  }
  if (status === 'sleep') return 0.5;
  if (status === 'paralysis') return 0.3;
  if (status === 'confuse') return 0.3;
  if (status === 'freeze') return 0.25;
  if (status === 'burn' || status === 'poison' || status === 'toxic') return 0.3;
  return 0;
}
