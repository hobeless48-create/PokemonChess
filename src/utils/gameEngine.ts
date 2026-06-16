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

export function getPokemonTypes(p: PokemonEntity): string[] {
  const db = DB[p.species];
  if (!db) return [];
  
  if (p.species === "Rotom") {
    const form = p.rotomForm || "Normal";
    if (form === "Heat") return ["Electric", "Fire"];
    if (form === "Wash") return ["Electric", "Water"];
    if (form === "Frost") return ["Electric", "Ice"];
    if (form === "Fan") return ["Electric", "Flying"];
    if (form === "Mow") return ["Electric", "Grass"];
    return ["Electric", "Ghost"];
  }

  const t1 = p.reflectedType || db.t1;
  const t2 = p.reflectedType ? null : db.t2;
  const types: string[] = [t1];
  if (t2 && t2 !== "None") {
    types.push(t2);
  }
  return types;
}

export function hasType(p: PokemonEntity, type: string): boolean {
  return getPokemonTypes(p).includes(type);
}

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

export function adjCells(col: number, row: number, range: number, diagonal: boolean, boardSize: number = 11): { col: number; row: number }[] {
  const out: { col: number; row: number }[] = [];
  for (let dc = -range; dc <= range; dc++) {
    for (let dr = -range; dr <= range; dr++) {
      if (dc === 0 && dr === 0) continue;
      if (!diagonal && Math.abs(dc) + Math.abs(dr) > range) continue;
      const nc = col + dc, nr = row + dr;
      if (nc >= 0 && nc < boardSize && nr >= 0 && nr < boardSize) {
        out.push({ col: nc, row: nr });
      }
    }
  }
  return out;
}

export function getLineCells(col: number, row: number, range: number, dirs: number[], boardSize: number = 11): { col: number; row: number }[] {
  const out: { col: number; row: number }[] = [];
  dirs.forEach(d => {
    const dir = DDIRS[d];
    if (!dir) return;
    for (let step = 1; step <= range; step++) {
      const nc = col + dir.dc * step;
      const nr = row + dir.dr * step;
      if (nc < 0 || nc >= boardSize || nr < 0 || nr >= boardSize) break;
      out.push({ col: nc, row: nr });
    }
  });
  return out;
}

export function getConeCells(col: number, row: number, range: number, dir: number, boardSize: number = 11): { col: number; row: number }[] {
  const out: { col: number; row: number }[] = [];
  if (dir === 1 || dir === 3) {
    const dy = dir === 1 ? -1 : 1;
    for (let step = 1; step <= range; step++) {
      const nr = row + dy * step;
      if (range === 1) {
        for (let dx = -1; dx <= 1; dx++) {
          const nc = col + dx;
          if (nc >= 0 && nc < boardSize && nr >= 0 && nr < boardSize) out.push({ col: nc, row: nr });
        }
      } else if (step === 1) {
        const nc = col;
        if (nc >= 0 && nc < boardSize && nr >= 0 && nr < boardSize) out.push({ col: nc, row: nr });
      } else if (step < range) {
        for (let dx = -1; dx <= 1; dx++) {
          const nc = col + dx;
          if (nc >= 0 && nc < boardSize && nr >= 0 && nr < boardSize) out.push({ col: nc, row: nr });
        }
      } else {
        for (let dx = -(range - 1); dx <= (range - 1); dx++) {
          const nc = col + dx;
          if (nc >= 0 && nc < boardSize && nr >= 0 && nr < boardSize) out.push({ col: nc, row: nr });
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
          if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) out.push({ col: nc, row: nr });
        }
      } else if (step === 1) {
        if (nc >= 0 && nc < boardSize) out.push({ col: nc, row });
      } else if (step < range) {
        for (let dy = -1; dy <= 1; dy++) {
          const nr = row + dy;
          if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) out.push({ col: nc, row: nr });
        }
      } else {
        for (let dy = -(range - 1); dy <= (range - 1); dy++) {
          const nr = row + dy;
          if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) out.push({ col: nc, row: nr });
        }
      }
    }
  }
  return out;
}

let cachedEvoMap: { [species: string]: { evoFrom: string | null; evoTo: string | null } } | null = null;

function buildEvoMap() {
  const map: { [species: string]: { evoFrom: string | null; evoTo: string | null } } = {};
  
  const cleanName = (name: string | null | undefined) => {
    if (!name) return null;
    let cleaned = name.trim();
    if (cleaned === "None" || cleaned === "") return null;
    if (cleaned.includes(" Ability:")) {
      cleaned = cleaned.split(" Ability:")[0].trim();
    }
    return cleaned;
  };

  // Step 1: Initialize all species with their declared links
  for (const species in DB) {
    const db = DB[species];
    map[species] = {
      evoFrom: cleanName(db.evoFrom),
      evoTo: cleanName(db.evoTo)
    };
  }

  // Step 2: Synchronize/fill missing links bidirectionally
  for (const species in map) {
    const entry = map[species];
    if (entry.evoTo && map[entry.evoTo]) {
      if (!map[entry.evoTo].evoFrom) {
        map[entry.evoTo].evoFrom = species;
      }
    }
    if (entry.evoFrom && map[entry.evoFrom]) {
      if (!map[entry.evoFrom].evoTo) {
        map[entry.evoFrom].evoTo = species;
      }
    }
  }

  cachedEvoMap = map;
}

export function getEvolutionLineStages(species: string): { totalStages: number; currentStage: number } {
  if (!cachedEvoMap) {
    buildEvoMap();
  }

  const entry = cachedEvoMap ? cachedEvoMap[species] : null;
  if (!entry) return { totalStages: 1, currentStage: 1 };

  // Climb up to find the base species
  let baseName = species;
  let current = entry;
  while (current.evoFrom && cachedEvoMap && cachedEvoMap[current.evoFrom]) {
    baseName = current.evoFrom;
    current = cachedEvoMap[baseName];
  }

  // Count total stages climbing down
  let totalStages = 1;
  let currentStage = (species === baseName) ? 1 : 2;
  
  const baseEntry = cachedEvoMap ? cachedEvoMap[baseName] : null;
  if (baseEntry && baseEntry.evoTo && cachedEvoMap && cachedEvoMap[baseEntry.evoTo]) {
    totalStages = 2;
    const secondName = baseEntry.evoTo;
    const secondEntry = cachedEvoMap[secondName];
    if (species === secondName) {
      currentStage = 2;
    }
    if (secondEntry.evoTo && cachedEvoMap[secondEntry.evoTo]) {
      totalStages = 3;
      const thirdName = secondEntry.evoTo;
      if (species === thirdName) {
        currentStage = 3;
      }
    }
  }

  return { totalStages, currentStage };
}

export function getSpeciesStage(species: string): number {
  const db = DB[species];
  if (!db) return 1;
  if (db.legendary || species === "Aerodactyl") return 3;
  return getEvolutionLineStages(species).currentStage;
}

export function pkAt(col: number, row: number, pokemonList: PokemonEntity[]): PokemonEntity | undefined {
  return pokemonList.find(p => p.col === col && p.row === row && !p.fainted && !(p.banishedTurns && p.banishedTurns > 0));
}

export function pedAt(col: number, row: number, pedestals: Pedestal[]): Pedestal | undefined {
  return pedestals.find(p => p.col === col && p.row === row);
}

export function getRoleBasedMoves(p: PokemonEntity, pokemonList: PokemonEntity[], pedestals: Pedestal[], boardSize: number = 11): { col: number; row: number }[] {
  const db = DB[p.species];
  if (p.isEgg && !p.hasHatched) return [];

  // Shadow Tag trapping check
  if (db && db.ability !== "Run Away") {
    const enemies = pokemonList.filter(other => other.player !== p.player && !other.fainted);
    const isTrapped = enemies.some(other => {
      const otherDb = DB[other.species];
      if (otherDb && otherDb.ability === "Shadow Tag") {
        const dist = Math.max(Math.abs(other.col - p.col), Math.abs(other.row - p.row));
        return dist === 1;
      }
      return false;
    });
    if (isTrapped) {
      return [];
    }
  }

  const out: { col: number; row: number }[] = [];
  const col = p.col;
  const row = p.row;
  const fwd = p.player === 1 ? 1 : -1;

  const addIfValid = (c: number, r: number) => {
    if (c >= 0 && c < boardSize && r >= 0 && r < boardSize && !pkAt(c, r, pokemonList) && !pedAt(c, r, pedestals)) {
      out.push({ col: c, row: r });
    }
  };

  let cls = (db && db.cls) || 'Attack';
  if (cls === 'Atk') cls = 'Attack';
  if (cls === 'Def') cls = 'Defense';
  
  let pattern: { dc: number; dr: number }[] = [];
  if (db && db.customMoveOffsets && db.customMoveOffsets.length > 0) {
    pattern = db.customMoveOffsets;
  } else {
    const evoInfo = getEvolutionLineStages(p.species);
    const isLegendary = db?.legendary;
    
    if (evoInfo.totalStages === 1 && !isLegendary && p.species !== "Aerodactyl") {
      // No evolution mon (every role) - 1 tile omnidirectional (3x3)
      pattern = [
        { dc: -1, dr: -1 }, { dc: 0, dr: -1 }, { dc: 1, dr: -1 },
        { dc: -1, dr: 0 },                      { dc: 1, dr: 0 },
        { dc: -1, dr: 1 },  { dc: 0, dr: 1 },  { dc: 1, dr: 1 }
      ];
    } else if (evoInfo.totalStages === 2 && !isLegendary) {
      // 2-stage evolution
      const role = cls;
      if (role === "Attack") {
        if (evoInfo.currentStage === 1) {
          pattern = [
            { dc: -1, dr: -1 }, { dc: 1, dr: -1 },
            { dc: -1, dr: 1 },  { dc: 1, dr: 1 }
          ];
        } else {
          pattern = [
            { dc: -1, dr: -1 }, { dc: 0, dr: -1 }, { dc: 1, dr: -1 },
            { dc: -1, dr: 0 },                      { dc: 1, dr: 0 },
            { dc: -1, dr: 1 },  { dc: 0, dr: 1 },  { dc: 1, dr: 1 },
            { dc: -2, dr: -2 }, { dc: 2, dr: -2 }, { dc: -2, dr: 2 }, { dc: 2, dr: 2 }
          ];
        }
      } else if (role === "Defense") {
        if (evoInfo.currentStage === 1) {
          pattern = [
            { dc: 0, dr: -1 },
            { dc: -1, dr: 0 }, { dc: 1, dr: 0 },
            { dc: 0, dr: 1 }
          ];
        } else {
          pattern = [
            { dc: 0, dr: -2 }, { dc: 0, dr: -1 },
            { dc: -1, dr: -1 }, { dc: 1, dr: -1 },
            { dc: -1, dr: 0 },                      { dc: 1, dr: 0 },
            { dc: -1, dr: 1 },  { dc: 1, dr: 1 },
            { dc: 0, dr: 1 },  { dc: 0, dr: 2 }
          ];
        }
      } else if (role === "Support") {
        if (evoInfo.currentStage === 1) {
          pattern = [
            { dc: 0, dr: -1 },
            { dc: -1, dr: 0 }, { dc: 1, dr: 0 },
            { dc: 0, dr: 1 }
          ];
        } else {
          pattern = [
            { dc: 0, dr: -2 }, { dc: 0, dr: -1 },
            { dc: -2, dr: 0 }, { dc: -1, dr: 0 }, { dc: 1, dr: 0 }, { dc: 2, dr: 0 },
            { dc: 0, dr: 1 },  { dc: 0, dr: 2 },
            { dc: -2, dr: -2 }, { dc: 2, dr: -2 }, { dc: -2, dr: 2 }, { dc: 2, dr: 2 }
          ];
        }
      } else if (role === "Assassin") {
        if (evoInfo.currentStage === 1) {
          pattern = [
            { dc: -1, dr: -1 }, { dc: 1, dr: -1 },
            { dc: -1, dr: 1 },  { dc: 1, dr: 1 }
          ];
        } else {
          pattern = [
            { dc: -1, dr: -1 }, { dc: 1, dr: -1 },
            { dc: -1, dr: 1 },  { dc: 1, dr: 1 },
            { dc: -2, dr: -2 }, { dc: 2, dr: -2 },
            { dc: -2, dr: 2 },  { dc: 2, dr: 2 },
            { dc: -3, dr: -3 }, { dc: 3, dr: -3 },
            { dc: -3, dr: 3 },  { dc: 3, dr: 3 }
          ];
        }
      }
    } else {
      const stage = getSpeciesStage(p.species);
      const patternSet = MOVE_PATTERNS[cls] || MOVE_PATTERNS['Attack'];
      pattern = patternSet[stage] || patternSet[1];
    }
  }

  pattern.forEach(off => {
    const nc = col + off.dc;
    const nr = row + off.dr * fwd;
    addIfValid(nc, nr);
  });

  return out;
}

export function getAtkCells(p: PokemonEntity, pokemonList: PokemonEntity[], pedestals: Pedestal[], boardSize: number = 11): { col: number; row: number }[] {
  const adj = adjCells(p.col, p.row, 1, true, boardSize);
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

export function parseSkillShapeObj(skill: Skill, p: PokemonEntity): ParsedShape {
  const desc = skill.skillDesc || '';
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

export function getSkillShapeCellsObj(
  p: PokemonEntity,
  skill: Skill,
  pokemonList: PokemonEntity[] = [],
  pedestals: Pedestal[] = [],
  boardSize: number = 11
): { col: number; row: number }[] {
  const db = DB[p.species];
  if (!db) return [];

  if (skill.customOffsets && skill.customOffsets.length > 0) {
    const rot = p.rotation || 0;
    const cells: { col: number; row: number }[] = [];
    const fwd = p.player === 1 ? 1 : -1;
    
    skill.customOffsets.forEach(offset => {
      let dc = offset.dc;
      let dr = offset.dr * fwd;
      if (rot > 0) {
        for (let r = 0; r < rot; r++) {
          const temp = dc;
          dc = -dr;
          dr = temp;
        }
      }
      const nc = p.col + dc;
      const nr = p.row + dr;
      if (nc >= 0 && nc < boardSize && nr >= 0 && nr < boardSize) {
        cells.push({ col: nc, row: nr });
      }
    });
    return cells;
  }

  if (skill.skillName === "Teleport") {
    const out: { col: number; row: number }[] = [];
    for (let c = 0; c < boardSize; c++) {
      for (let r = 0; r < boardSize; r++) {
        const dist = Math.max(Math.abs(c - p.col), Math.abs(r - p.row));
        if (dist <= 3) {
          out.push({ col: c, row: r });
        }
      }
    }
    return out;
  }

  const shape = parseSkillShapeObj(skill, p);
  const effectTarget = getSkillTargetType(skill, db);

  if (effectTarget === 'self' || skill.skillName === "Transform") {
    return [{ col: p.col, row: p.row }];
  }
  
  if (shape && shape.type) {
    const cells: { col: number; row: number }[] = [];
    const addShapeCells = (sh: ParsedShape) => {
      if (!sh) return;
      if (sh.type === 'line' && sh.range && sh.dirs) {
        cells.push(...getLineCells(p.col, p.row, sh.range, sh.dirs, boardSize));
      } else if (sh.type === 'cone' && sh.range && sh.dirs) {
        sh.dirs.forEach(dir => cells.push(...getConeCells(p.col, p.row, sh.range!, dir, boardSize)));
      } else if (sh.type === 'aoe' && sh.radius) {
        if (sh.range) {
          cells.push(...adjCells(p.col, p.row, sh.range, true, boardSize));
          cells.push({ col: p.col, row: p.row });
        } else {
          cells.push(...adjCells(p.col, p.row, sh.radius, true, boardSize));
          cells.push({ col: p.col, row: p.row });
        }
      }
    };

    if (shape.type === 'combo' && shape.parts) {
      shape.parts.forEach(part => addShapeCells(part));
    } else {
      addShapeCells(shape);
    }
    return cells;
  }
  return [];
}

export function getSkillData(db: PokemonDBEntry, skillIdx?: number, customSkills?: Skill[]): Skill {
  if (customSkills && typeof skillIdx !== 'undefined' && customSkills[skillIdx]) {
    return customSkills[skillIdx];
  }
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

export function getSkillTargetType(skill: Skill, dbAll: PokemonDBEntry, rotomForm?: string): string | null {
  if (skill?.skillName === "Appliance Pulse") {
    if (rotomForm === "Heat" || rotomForm === "Normal" || rotomForm === "Fan") return "enemy";
    return "self"; // Wash, Frost, Mow are self/instant
  }
  if (skill?.skillName === "Baton Pass" || skill?.skillName === "Dimensional Gate") return "ally";
  if (skill?.skillName === "Spatial Collapse") return "enemy";
  if (skill?.statusChance || dbAll?.statusChance) return "enemy";
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
  
  if (p.regigigasLocked) {
    return stat === 'atk' ? p.atk : p.def;
  }

  // Unhatched eggs have 0 defense
  if (p.isEgg && !p.hasHatched && stat === "def") {
    return 0;
  }

  let base = stat === 'atk' ? p.atk : p.def;

  // Dark Aura ability
  if (stat === "atk" && pokemonList && pokemonList.length > 0) {
    const hasActiveYveltal = pokemonList.some(other => {
      return other.species === "Yveltal" && !other.fainted;
    });
    if (hasActiveYveltal && (hasType(p, "Dark") || hasType(p, "Flying"))) {
      base += 2;
    }
  }

  // Keldeo's Resolute Blade Def debuff
  if (stat === "def" && pokemonList && pokemonList.length > 0) {
    const hasActiveKeldeo = pokemonList.some(other => {
      return other.species === "Keldeo" && !other.fainted;
    });
    if (hasActiveKeldeo) {
      let reduction = 0;
      const types = getPokemonTypes(p);
      types.forEach(t => {
        let r = 0;
        if (t === "Psychic" || t === "Grass" || t === "Flying") {
          r = 1;
        } else if (t === "Ice" || t === "Ground" || t === "Steel" || t === "Rock") {
          r = 2;
        }
        reduction = Math.max(reduction, r);
      });
      base = Math.max(0, base - reduction);
    }
  }

  // Download ability for Porygon2
  if (db.ability === "Download" && stat === "def" && pokemonList && pokemonList.length > 0) {
    const enemies = pokemonList.filter(other => other.player !== p.player && !other.fainted);
    if (enemies.length > 0) {
      let maxEnemyAtk = 0;
      enemies.forEach(enemy => {
        if (!context.inDownloadCheck) {
          const enemyAtk = getModifiedStat(enemy, "atk", pokemonList, { ...context, inDownloadCheck: true });
          if (enemyAtk > maxEnemyAtk) {
            maxEnemyAtk = enemyAtk;
          }
        }
      });
      base += maxEnemyAtk;
    }
  }

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
    base += 1;
  }
  if (db.ability === "Defiant" && stat === "atk" && p.modifiers && p.modifiers.some(m => m.amount < 0)) {
    base += 2;
  }
  if (p.species === "Aegislash") {
    const form = p.aegislashForm || "Shield";
    if (form === "Shield" && stat === "def") {
      base += 1;
    }
    if (form === "Blade" && stat === "atk") {
      base += 1;
    }
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
    if (stat === "def" && hasType(p, "Rock")) {
      base += 1;
    }
    if (stat === "def" && p.species === "Arceus" && hasType(p, "Steel")) {
      base += 1;
    }
  }

  // Active Weather adjustments
  if (stat === "atk") {
    const isFire = hasType(p, "Fire");
    const isWater = hasType(p, "Water");

    if (context.weather === "Sunlight" && isFire) {
      base += 1;
    }
    if (context.weather === "Harsh Sunlight") {
      if (isFire) base += 1;
      if (isWater) base = Math.max(0, base - 2);
    }
    if (context.weather === "Rain" && isWater) {
      base += 1;
    }
    if (context.weather === "Heavy Rain") {
      if (isWater) base += 1;
      if (isFire) base = Math.max(0, base - 2);
    }
    if (isHail && context.action === "melee") {
      base = Math.max(0, base - 1);
    }
    if (isSandstorm && context.isSkill) {
      base = Math.max(0, base - 1);
    }
    
    // Active Terrain adjustments
    if (context.terrain) {
      const isElectric = db.t1 === "Electric" || db.t2 === "Electric";
      const isGrass = db.t1 === "Grass" || db.t2 === "Grass";
      const isPsychic = db.t1 === "Psychic" || db.t2 === "Psychic";
      const isDragon = db.t1 === "Dragon" || db.t2 === "Dragon";

      if (context.terrain === "Electric" && isElectric) {
        base += 1;
      }
      if (context.terrain === "Grassy" && isGrass) {
        base += 1;
      }
      if (context.terrain === "Misty" && isDragon) {
        base = Math.max(0, base - 1);
      }
      if (context.terrain === "Psychic" && isPsychic) {
        base += 1;
      }
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
      if (m.stat === stat) {
        // Clear Body: immune to stat reductions from enemy skills
        if (m.amount < 0 && db.ability === "Clear Body") return;
        // Hyper Cutter: immune to Atk reduction
        if (m.amount < 0 && stat === "atk" && db.ability === "Hyper Cutter") return;
        base += m.amount;
      }
    });
  }

  if (stat === "atk" && base < 0) {
    base = 0;
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
    const obstacleUnit = pokemonList.find(p => p.col === tc && p.row === tr && !p.fainted && p.species !== "Zygarde Cell");
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
  skillIdx?: number,
  boardSize: number = 11
): { col: number; row: number }[] {
  const db = DB[p.species];
  if (!db) return [];
  const skill = getSkillData(db, skillIdx, p.customSkills);

  if (skill.customOffsets && skill.customOffsets.length > 0) {
    const rot = p.rotation || 0;
    const cells: { col: number; row: number }[] = [];
    const fwd = p.player === 1 ? 1 : -1;
    
    skill.customOffsets.forEach(offset => {
      let dc = offset.dc;
      let dr = offset.dr * fwd;
      if (rot > 0) {
        for (let r = 0; r < rot; r++) {
          const temp = dc;
          dc = -dr;
          dr = temp;
        }
      }
      const nc = p.col + dc;
      const nr = p.row + dr;
      if (nc >= 0 && nc < boardSize && nr >= 0 && nr < boardSize) {
        cells.push({ col: nc, row: nr });
      }
    });
    return cells;
  }

  if (skill.skillName === "Teleport") {
    const out: { col: number; row: number }[] = [];
    for (let c = 0; c < boardSize; c++) {
      for (let r = 0; r < boardSize; r++) {
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
        cells.push(...getLineCells(p.col, p.row, sh.range, sh.dirs, boardSize));
      } else if (sh.type === 'cone' && sh.range && sh.dirs) {
        sh.dirs.forEach(dir => cells.push(...getConeCells(p.col, p.row, sh.range!, dir, boardSize)));
      } else if (sh.type === 'aoe' && sh.radius) {
        if (sh.range) {
          cells.push(...adjCells(p.col, p.row, sh.range, true, boardSize));
          cells.push({ col: p.col, row: p.row });
        } else {
          cells.push(...adjCells(p.col, p.row, sh.radius, true, boardSize));
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
  return adjCells(p.col, p.row, range, true, boardSize);
}

export function getSkillCells(
  p: PokemonEntity,
  pokemonList: PokemonEntity[],
  pedestals: Pedestal[],
  skillIdx?: number,
  boardSize: number = 11
): { col: number; row: number; type: "move" | "atk" | "atk-preview" | "skill-preview" }[] {
  const db = DB[p.species];
  if (!db) return [];
  const skill = getSkillData(db, skillIdx, p.customSkills);
  const effectTarget = getSkillTargetType(skill, db);

  if (skill.skillName === "Baton Pass") {
    const shapeCells = getSkillShapeCells(p, pokemonList, pedestals, skillIdx, boardSize);
    return shapeCells
      .filter(c => {
        const t = pkAt(c.col, c.row, pokemonList);
        return t && t.player === p.player && t.id !== p.id && !t.fainted;
      })
      .map(c => ({ col: c.col, row: c.row, type: 'atk' as const }));
  }

  if (skill.skillName === "Teleport") {
    const out: { col: number; row: number; type: "move" | "atk" | "atk-preview" | "skill-preview" }[] = [];
    for (let c = 0; c < boardSize; c++) {
      for (let r = 0; r < boardSize; r++) {
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

  const shapeCells = getSkillShapeCells(p, pokemonList, pedestals, skillIdx, boardSize);

  return shapeCells.reduce<{ col: number; row: number; type: "move" | "atk" | "atk-preview" | "skill-preview" }[]>((acc, c) => {
    const t = pkAt(c.col, c.row, pokemonList);
    const pd = pedAt(c.col, c.row, pedestals);

    if (effectTarget === 'ally') {
      if (t && t.player === p.player) {
         acc.push({ col: c.col, row: c.row, type: 'atk' });
      } else if (!t && !pd) {
         acc.push({ col: c.col, row: c.row, type: 'skill-preview' });
      } else if (isAoE) {
         acc.push({ col: c.col, row: c.row, type: 'skill-preview' });
      }
      return acc;
    }

    if (effectTarget === 'enemy') {
      if ((t && t.player !== p.player) || (pd && pd.player !== p.player)) {
        acc.push({ col: c.col, row: c.row, type: 'atk' });
      } else if (!t && !pd) {
        acc.push({ col: c.col, row: c.row, type: 'skill-preview' });
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

  // Unhatched eggs are immune to type advantages/disadvantages
  if ((attacker.isEgg && !attacker.hasHatched) || (target.isEgg && !target.hasHatched)) {
    return 0;
  }

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

  // Solid Rock / Filter: reduce super-effective damage by 1
  if (b > 0 && (tdb.ability === "Solid Rock" || tdb.ability === "Filter")) {
    b = Math.max(0, b - 1);
  }
  // Tinted Lens: resisted hits deal normal damage
  if (b < 0 && adb.ability === "Tinted Lens") {
    b = 0;
  }

  if (weather === "Strong Winds") {
    const isFlying = hasType(target, "Flying");
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

export function predictDamage(
  actor: PokemonEntity,
  target: PokemonEntity | Pedestal,
  skillIdx: number | undefined,
  pokemonList: PokemonEntity[],
  pedestals: Pedestal[],
  weather: string | null,
  terrain?: string | null,
  isCrit: boolean = false
): {
  damage: number;
  baseAtk: number;
  targetDef: number;
  typeMult: number;
  abilityBonus: number;
  tidalBellReduction: number;
  isElectricAbsorb: boolean;
  isWaterAbsorb: boolean;
  isLevitateMiss: boolean;
  isDreamEaterMiss: boolean;
  isSturdyTriggered: boolean;
  itemDmgBonus: number;
} {
  const isPedestal = !('species' in target);
  
  if (isPedestal) {
    const ped = target as Pedestal;
    let rawAtk = getModifiedStat(actor, "atk", pokemonList, { action: skillIdx === undefined ? "melee" : "skill", isSkill: skillIdx !== undefined, weather, terrain });
    if (actor.status === "burn") rawAtk = Math.max(0, rawAtk - 1);
    
    let pedDmg = 0;
    if (skillIdx === undefined) {
      pedDmg = Math.min(1, Math.max(0, Math.floor(rawAtk / 2) - 1));
    } else {
      const dbEntry = DB[actor.species];
      const skill = getSkillData(dbEntry, skillIdx);
      let rawDmg = 0;
      if (skillIdx === 0) {
        rawDmg = skill.skillDmg ? rawAtk : 0;
      } else {
        const isAtkBase = typeof skill.skillDmg === "string" && skill.skillDmg.toLowerCase() === "atk";
        if (isAtkBase) {
          rawDmg = rawAtk;
        } else {
          rawDmg = typeof skill.skillDmg === "number" ? skill.skillDmg : (parseInt(skill.skillDmg || "0", 10) || 0);
        }
      }
      if (actor.status === "burn") rawDmg = Math.max(0, rawDmg - 1);
      pedDmg = Math.min(1, Math.max(0, rawDmg - 1));
    }
    
    return {
      damage: pedDmg,
      baseAtk: rawAtk,
      targetDef: 1,
      typeMult: 0,
      abilityBonus: 0,
      tidalBellReduction: 0,
      isElectricAbsorb: false,
      isWaterAbsorb: false,
      isLevitateMiss: false,
      isDreamEaterMiss: false,
      isSturdyTriggered: false,
      itemDmgBonus: 0
    };
  }

  const tg = target as PokemonEntity;
  const actorDb = DB[actor.species];
  const targetDb = DB[tg.species];
  
  if (!actorDb || !targetDb) {
    return {
      damage: 0,
      baseAtk: 0,
      targetDef: 0,
      typeMult: 0,
      abilityBonus: 0,
      tidalBellReduction: 0,
      isElectricAbsorb: false,
      isWaterAbsorb: false,
      isLevitateMiss: false,
      isDreamEaterMiss: false,
      isSturdyTriggered: false,
      itemDmgBonus: 0
    };
  }

  let actualCrit = isCrit;
  if (targetDb && (targetDb.ability === "Shell Armor" || targetDb.ability === "Battle Armor")) {
    actualCrit = false;
  }

  let isElectricAbsorb = false;
  let isWaterAbsorb = false;
  let isLevitateMiss = false;
  let isDreamEaterMiss = false;

  let damage = 0;
  let typeMult = 0;
  let abilityBonus = 0;
  let baseAtk = 0;
  let targetDef = 0;
  let itemDmgBonus = 0;

  if (skillIdx === undefined) {
    typeMult = typeBonus(actor, tg, weather);
    baseAtk = getModifiedStat(actor, "atk", pokemonList, { action: "melee", isSkill: false, target: tg, weather, terrain });
    targetDef = getModifiedStat(tg, "def", pokemonList, { weather, terrain });

    if (actor.hp <= actor.maxHp * 0.5) {
      if (actorDb.ability === "Overgrow" && hasType(actor, "Grass")) abilityBonus += 1;
      if (actorDb.ability === "Blaze" && hasType(actor, "Fire")) abilityBonus += 1;
      if (actorDb.ability === "Torrent" && hasType(actor, "Water")) abilityBonus += 1;
      if (actorDb.ability === "Swarm" && hasType(actor, "Bug")) abilityBonus += 1;
    }

    const effectiveDef = actualCrit ? 0 : targetDef;
    damage = Math.floor(baseAtk / 2) + typeMult + abilityBonus - effectiveDef;
    if (actualCrit) {
      const hasSniper = actorDb?.ability === "Sniper";
      damage += hasSniper ? 3 : 2;
    }
    if (actor.status === "burn") {
      damage = damage - 1;
    }

    if (targetDb.ability === "Multiscale" && tg.hp === tg.maxHp) damage -= 3;
    if (targetDb.ability === "Sheer Force" && actor.hp < tg.hp) damage -= 1;
    if (targetDb.ability === "Rock Head" && damage === 1) damage = 0;
    damage = Math.max(0, damage);
    if (actorDb.ability === "Huge Power") {
      damage = damage * 2;
    }
    if (actor.modifiers) {
      actor.modifiers.forEach(m => {
        if (m.stat === "normal_dmg") {
          damage += m.amount;
        }
      });
    }
  } else {
    const skill = getSkillData(actorDb, skillIdx);
    
    if (skill.skillHeal && (skill.skillHealTarget === "ally" || skill.skillHealTarget === "all_allies" || skill.skillHealTarget === "self")) {
      return {
        damage: -skill.skillHeal,
        baseAtk: 0,
        targetDef: 0,
        typeMult: 0,
        abilityBonus: 0,
        tidalBellReduction: 0,
        isElectricAbsorb: false,
        isWaterAbsorb: false,
        isLevitateMiss: false,
        isDreamEaterMiss: false,
        isSturdyTriggered: false,
        itemDmgBonus: 0
      };
    }

    let rawDmg = 0;
    const isAtkBase = typeof skill.skillDmg === 'string' && skill.skillDmg.toLowerCase() === 'atk';

    const isLegendary = actorDb.legendary === true;
    if (isAtkBase) {
      const baseAtk = getModifiedStat(actor, "atk", pokemonList, { isSkill: true, weather, terrain });
      if (skill.statusChance && !isLegendary) {
        rawDmg = Math.max(0, baseAtk - 1);
      } else {
        rawDmg = baseAtk;
      }
    } else {
      if (skillIdx === 0) {
        if (skill.skillDmg && skill.skillDmg !== 0 && skill.skillDmg !== "0" && skill.skillDmg !== "") {
          const baseAtk = getModifiedStat(actor, "atk", pokemonList, { isSkill: true, weather, terrain });
          if (skill.statusChance && !isLegendary) {
            rawDmg = Math.max(0, baseAtk - 1);
          } else {
            rawDmg = baseAtk;
          }
        } else {
          rawDmg = 0;
        }
      } else {
        rawDmg = typeof skill.skillDmg === 'number' ? skill.skillDmg : (parseInt(skill.skillDmg || '0', 10) || 0);
      }
    }

    if (skill.skillName === "Foul Play") {
      rawDmg = getModifiedStat(tg, "atk", pokemonList, { weather, terrain });
    }

    if (skill.skillName === "Sucker Punch") {
      if (actor.damageReceivedLastTurn && actor.damageReceivedLastTurn > 0) {
        rawDmg += 2;
      }
    }

    if (actor.status === "burn") rawDmg = Math.max(0, rawDmg - 1);
    
    if (actor.hp <= actor.maxHp * 0.5) {
      if (actorDb.ability === "Overgrow" && hasType(actor, "Grass")) abilityBonus += 1;
      if (actorDb.ability === "Blaze" && hasType(actor, "Fire")) abilityBonus += 1;
      if (actorDb.ability === "Torrent" && hasType(actor, "Water")) abilityBonus += 1;
      if (actorDb.ability === "Swarm" && hasType(actor, "Bug")) abilityBonus += 1;
    }
    // Technician: skills with base dmg ≤2 deal +1
    if (actorDb.ability === "Technician" && rawDmg <= 2 && rawDmg > 0) rawDmg += 1;
    // Hustle: +1 skill damage
    if (actorDb.ability === "Hustle" && rawDmg > 0) rawDmg += 1;
    // Iron Fist: +1 for punching skills
    const isPunchSkill = skill.skillName && /punch|jab|comet|meteor|mach/i.test(skill.skillName);
    if (actorDb.ability === "Iron Fist" && isPunchSkill) rawDmg += 1;
    // Strong Jaw: +1 for bite skills
    const isBiteSkill = skill.skillName && /bite|fang|crunch/i.test(skill.skillName);
    if (actorDb.ability === "Strong Jaw" && isBiteSkill) rawDmg += 1;
    // Reckless: +1 for self-damage skills
    if (actorDb.ability === "Reckless" && skill.selfDamage && skill.selfDamage > 0) rawDmg += 1;
    // Sand Force: +1 ground dmg in sandstorm
    if (actorDb.ability === "Sand Force" && weather === "Sandstorm" && hasType(actor, "Ground")) rawDmg += 1;
    // Defeatist: Atk halved when HP ≤ 50%
    if (actorDb.ability === "Defeatist" && actor.hp <= actor.maxHp * 0.5) rawDmg = Math.floor(rawDmg / 2);

    const isElectricHit = hasType(actor, "Electric") || skill.skillName.toLowerCase().includes("thunder") || skill.skillName.toLowerCase().includes("shock") || skill.skillName.toLowerCase().includes("electro") || skill.skillName.toLowerCase().includes("discharge");
    const isWaterHit = hasType(actor, "Water") || skill.skillName.toLowerCase().includes("water") || skill.skillName.toLowerCase().includes("hydro") || skill.skillName.toLowerCase().includes("bubble") || skill.skillName.toLowerCase().includes("scald") || skill.skillName.toLowerCase().includes("surf");

    if (targetDb.ability === "Volt Absorb" && isElectricHit) isElectricAbsorb = true;
    if (targetDb.ability === "Water Absorb" && isWaterHit) isWaterAbsorb = true;
    // Lightning Rod: immune to Electric
    if (targetDb.ability === "Lightning Rod" && isElectricHit) isElectricAbsorb = true;
    // Storm Drain: heal 1 HP when hit by Water
    if (targetDb.ability === "Storm Drain" && isWaterHit) {
      return {
        damage: -1,
        baseAtk: rawDmg,
        targetDef: 0,
        typeMult: 0,
        abilityBonus,
        tidalBellReduction: 0,
        isElectricAbsorb: false,
        isWaterAbsorb: false,
        isLevitateMiss: false,
        isDreamEaterMiss: false,
        isSturdyTriggered: false,
        itemDmgBonus: 0
      };
    }
    // Sap Sipper: immune to Grass, +1 Atk
    const isGrassHit = hasType(actor, "Grass") || skill.skillName.toLowerCase().includes("leaf") || skill.skillName.toLowerCase().includes("vine") || skill.skillName.toLowerCase().includes("seed") || skill.skillName.toLowerCase().includes("solar");
    if (targetDb.ability === "Sap Sipper" && isGrassHit) {
      return {
        damage: 0,
        baseAtk: rawDmg,
        targetDef: 0,
        typeMult: 0,
        abilityBonus,
        tidalBellReduction: 0,
        isElectricAbsorb: false,
        isWaterAbsorb: false,
        isLevitateMiss: false,
        isDreamEaterMiss: false,
        isSturdyTriggered: false,
        itemDmgBonus: 0
      };
    }
    // Flash Fire: immune to Fire, boost Fire dmg
    const isFireHit = hasType(actor, "Fire") || skill.skillName.toLowerCase().includes("fire") || skill.skillName.toLowerCase().includes("flame") || skill.skillName.toLowerCase().includes("blast") || skill.skillName.toLowerCase().includes("ember");
    if (targetDb.ability === "Flash Fire" && isFireHit) {
      return {
        damage: 0,
        baseAtk: rawDmg,
        targetDef: 0,
        typeMult: 0,
        abilityBonus,
        tidalBellReduction: 0,
        isElectricAbsorb: false,
        isWaterAbsorb: false,
        isLevitateMiss: false,
        isDreamEaterMiss: false,
        isSturdyTriggered: false,
        itemDmgBonus: 0
      };
    }
    // Dry Skin: +1 damage taken from Fire
    if (targetDb.ability === "Dry Skin" && isFireHit) rawDmg += 1;
    // Dry Skin: heal 1 HP when hit by Water
    if (targetDb.ability === "Dry Skin" && isWaterHit) {
      return {
        damage: -1,
        baseAtk: rawDmg,
        targetDef: 0,
        typeMult: 0,
        abilityBonus,
        tidalBellReduction: 0,
        isElectricAbsorb: false,
        isWaterAbsorb: false,
        isLevitateMiss: false,
        isDreamEaterMiss: false,
        isSturdyTriggered: false,
        itemDmgBonus: 0
      };
    }
    // Snow Cloak: 20% dodge in Hail
    if (targetDb.ability === "Snow Cloak" && weather === "Hail Storm" && Math.random() < 0.2) {
      return {
        damage: 0,
        baseAtk: rawDmg,
        targetDef: 0,
        typeMult: 0,
        abilityBonus,
        tidalBellReduction: 0,
        isElectricAbsorb: false,
        isWaterAbsorb: false,
        isLevitateMiss: false,
        isDreamEaterMiss: false,
        isSturdyTriggered: false,
        itemDmgBonus: 0
      };
    }

    if (isElectricAbsorb || isWaterAbsorb) {
      return {
        damage: -3,
        baseAtk: rawDmg,
        targetDef: 0,
        typeMult: 0,
        abilityBonus,
        tidalBellReduction: 0,
        isElectricAbsorb,
        isWaterAbsorb,
        isLevitateMiss: false,
        isDreamEaterMiss: false,
        isSturdyTriggered: false,
        itemDmgBonus: 0
      };
    }

    if (skill.skillName === "Dream Eater" && tg.status !== "sleep") {
      isDreamEaterMiss = true;
      return {
        damage: 0,
        baseAtk: rawDmg,
        targetDef: 0,
        typeMult: 0,
        abilityBonus,
        tidalBellReduction: 0,
        isElectricAbsorb: false,
        isWaterAbsorb: false,
        isLevitateMiss: false,
        isDreamEaterMiss: true,
        isSturdyTriggered: false,
        itemDmgBonus: 0
      };
    }

    const isGroundSkill = skill.skillName === "Earthquake" || skill.skillName === "Mud Shot" || skill.skillName === "Bone Rush" || (skill.skillRaw || skill.skillDesc || "").toLowerCase().includes("ground");
    if (targetDb.ability === "Levitate" && isGroundSkill) {
      isLevitateMiss = true;
      return {
        damage: 0,
        baseAtk: rawDmg,
        targetDef: 0,
        typeMult: 0,
        abilityBonus,
        tidalBellReduction: 0,
        isElectricAbsorb: false,
        isWaterAbsorb: false,
        isLevitateMiss: true,
        isDreamEaterMiss: false,
        isSturdyTriggered: false,
        itemDmgBonus: 0
      };
    }

    typeMult = typeBonus(actor, tg, weather);
    targetDef = getModifiedStat(tg, "def", pokemonList, { bySkill: true, weather, terrain });
    const effectiveDef = actualCrit ? 0 : targetDef;
    damage = rawDmg + typeMult + abilityBonus - effectiveDef;
    if (actualCrit) {
      const hasSniper = actorDb?.ability === "Sniper";
      damage += hasSniper ? 3 : 2;
    }

    if (skill.skillName === "Sonic Boom") damage = 2;
    if (skill.skillName === "Psycutter") damage += targetDef;
    if (skill.skillName === "Counter") {
      const dmgReceived = actor.damageReceivedLastTurn || 0;
      damage = dmgReceived > 0 ? (dmgReceived + 1) : 0;
    }

    if (targetDb.ability === "Multiscale" && tg.hp === tg.maxHp) damage -= 3;
    if (targetDb.ability === "Sheer Force" && actor.hp < tg.hp) damage -= 1;
    damage = Math.max(0, damage);
    if (actor.modifiers) {
      actor.modifiers.forEach(m => {
        if (m.stat === "skill_dmg") {
          damage += m.amount;
        }
      });
    }
    baseAtk = rawDmg;
  }

  if (actorDb.ability === "Tough Claws" && Math.max(Math.abs(actor.col - tg.col), Math.abs(actor.row - tg.row)) <= 1) {
    damage += 1;
  }

  if (skillIdx !== undefined && targetDb.ability === "Fur Coat") {
    const shape = parseSkillShape(actorDb, actor, skillIdx);
    const isAoE = shape.type === "aoe" || shape.type === "cone" || (shape.type === "line" && (shape.range ?? 0) > 1);
    if (isAoE) {
      damage = Math.max(0, damage - 1);
    }
  }

  if (targetDb.ability === "Wonder Guard" && typeMult <= 0) {
    damage = 0;
  }

  let tidalBellReduction = 0;
  const friendlyBell = pokemonList.find(bell => {
    if ((bell.species !== "Tidal Bell" && bell.species !== "Tidal bell") || bell.fainted || bell.player !== tg.player) return false;
    const dc = Math.abs(bell.col - tg.col);
    const dr = Math.abs(bell.row - tg.row);
    return dc <= 1 && dr <= 1;
  });
  if (friendlyBell && damage > 0 && tg.species !== "Lugia") {
    tidalBellReduction = Math.min(damage, 2);
    damage = Math.max(0, damage - 2);
  }

  let isSturdyTriggered = false;
  if (damage >= tg.hp && targetDb.ability === "Sturdy" && tg.hp === tg.maxHp) {
    isSturdyTriggered = true;
    damage = tg.hp - 1;
  }

  return {
    damage,
    baseAtk,
    targetDef,
    typeMult,
    abilityBonus,
    tidalBellReduction,
    isElectricAbsorb,
    isWaterAbsorb,
    isLevitateMiss,
    isDreamEaterMiss,
    isSturdyTriggered,
    itemDmgBonus
  };
}

export function getAffectedCells(
  actor: PokemonEntity,
  skill: Skill,
  skillIdx: number,
  targetCell: { col: number; row: number } | null,
  pokemonList: PokemonEntity[],
  pedestals: Pedestal[],
  boardSize: number = 11
): { col: number; row: number }[] {
  const dbEntry = DB[actor.species];
  if (!dbEntry) return [];

  if (skill.customOffsets && skill.customOffsets.length > 0) {
    return getSkillShapeCells(actor, pokemonList, pedestals, skillIdx, boardSize);
  }

  const shape = parseSkillShape(dbEntry, actor, skillIdx);
  const isAoE = shape.type === "aoe" || shape.type === "cone" || (shape.type === "line" && shape.range && shape.range > 1);

  if (isAoE) {
    if (shape.type === "aoe" && shape.range && targetCell) {
      const radius = shape.radius || 1;
      const cells = adjCells(targetCell.col, targetCell.row, radius, true, boardSize);
      cells.push({ col: targetCell.col, row: targetCell.row });
      return cells;
    } else {
      return getSkillShapeCells(actor, pokemonList, pedestals, skillIdx, boardSize);
    }
  } else if (targetCell) {
    return [{ col: targetCell.col, row: targetCell.row }];
  }
  return [];
}
