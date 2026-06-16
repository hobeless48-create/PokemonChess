function setWeather(type, duration = 3) {
  G.weather = { type, duration };
  log(`Weather changed to ${type}!`, 'sys');
}

function clearWeather() {
  if (G.weather.type) log('Weather cleared.', 'sys');
  G.weather = { type: null, duration: 0 };
}

function getWeatherLabel() {
  return G.weather.type ? `${G.weather.type} (${G.weather.duration})` : 'Clear';
}

function applyWeatherTurnEffects() {
  if (!G.weather.type) return;
  if (G.weather.type === 'Hail Storm') {
    G.pokemon.forEach(p => {
      if (p.fainted) return;
      const db = DB[p.species];
      if (db.t1 !== 'Ice' && db.t2 !== 'Ice') {
        p.hp = Math.max(0, p.hp - 1);
        log(`${p.species} is hurt by hail!`, 'atk');
        if (p.hp <= 0) { p.fainted = true; log(`${p.species} fainted!`, 'sys'); }
      }
    });
  }
  if (G.weather.type === 'Sand Storm') {
    G.pokemon.forEach(p => {
      if (p.fainted) return;
      const db = DB[p.species];
      if (!['Rock', 'Ground'].includes(db.t1) && !['Rock', 'Ground'].includes(db.t2)) {
        p.hp = Math.max(0, p.hp - 1);
        log(`${p.species} is hurt by sandstorm!`, 'atk');
        if (p.hp <= 0) { p.fainted = true; log(`${p.species} fainted!`, 'sys'); }
      }
    });
  }
  if (--G.weather.duration <= 0) clearWeather();
}

function addModifier(p, stat, amount, duration, sourceName = "Unknown") {
  p.modifiers = p.modifiers || [];

  // Check if a modifier from this exact source already exists on the Pokemon
  const existing = p.modifiers.find(m => m.source === sourceName && m.stat === stat && m.amount === amount);

  if (existing) {
    // Instead of stacking, refresh the duration to the maximum
    existing.duration = Math.max(existing.duration, duration);
    return false; // Return false to let the game know we didn't add a new stack
  }

  // If it doesn't exist, safely add it!
  p.modifiers.push({ stat, amount, duration, source: sourceName });
  return true; // Return true to indicate a new buff was successfully added
}

// MODIFIED: Now ticks only for specific player's Pokemon
function tickModifiers(player) {
  G.pokemon.forEach(p => {
    if (p.player !== player) return; // Only tick for current player
    if (!p.modifiers) return;
    p.modifiers = p.modifiers.filter(m => { m.duration--; return m.duration > 0; });
  });
}

function getModifiedStat(p, stat, context = {}) {
  const db = DB[p.species];
  let base = stat === 'atk' ? db.atk : (stat === 'def' ? (typeof p.def === 'number' ? p.def : (db.def || 0)) : db[stat] || 0);

  if (db && db.ability === "Unaware") {
    return base;
  }

  // Held Item Passive Modifier Injection
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
    if (p.heldItem === "King's Rock" && stat === "atk" && context.target && context.target.hp < (context.target.maxHp * 0.5)) base += 1;
    if (p.heldItem === "Scope Lens" && stat === "atk" && context.target && context.target.hp === context.target.maxHp) base += 1;
  }

  if (!p.modifiers) return base;
  return p.modifiers.reduce((value, m) => m.stat === stat ? value + m.amount : value, base);
}

function alivePokemonCount(player) {
  return G.pokemon.filter(p => p.player === player && !p.fainted).length;
}

function checkLossByPedestal(player) {
  const pedestal = G.pedestals.find(pd => pd.player === player);
  if (!pedestal) return;
  if (pedestal.hp <= 0 && alivePokemonCount(player) === 0) {
    const winner = player === 1 ? 2 : 1;
    win(winner, `Player ${player} lost their pedestal and has no remaining Pokemon.`);
  }
}

function renderModifiers(p) {
  if (!p.modifiers || !p.modifiers.length) return 'None';
  return p.modifiers.map(m => `${m.stat.toUpperCase()}${m.amount > 0 ? '+' : ''}${m.amount} (${m.duration})`).join(', ');
}

function getStatusChanceValue(status, source = null) {
  if (source && typeof source.statusChanceValue === 'number') return source.statusChanceValue;
  if (status === 'sleep') return 0.5;
  if (status === 'paralysis') return 0.3;
  if (status === 'confuse') return 0.3;
  if (status === 'freeze') return 0.25;
  if (status === 'burn' || status === 'poison' || status === 'toxic') return 0.3;
  return 0;
}

function attemptStatusAction(p, actionType) {
  if (!p || !p.status || p.fainted) return { ok: true };
  const status = p.status;
  if (status === 'freeze') return { ok: false, msg: `${p.species} is frozen and cannot act.` };
  if (status === 'sleep') {
    const woke = Math.random() < getStatusChanceValue(status);
    p.status = null;
    return woke ? { ok: true, msg: `${p.species} woke up from sleep.` } : { ok: false, msg: `${p.species} failed to wake from sleep.` };
  }
  if (status === 'paralysis') {
    if (Math.random() < getStatusChanceValue(status)) return { ok: false, msg: `${p.species} is paralyzed and cannot move.` };
    return { ok: true };
  }
  if (status === 'confuse') {
    if (Math.random() < getStatusChanceValue(status)) {
      p.hp = Math.max(0, p.hp - 2);
      log(`${p.species} hurt itself in confusion!`, 'atk');
      if (p.hp <= 0) { p.fainted = true; log(`${p.species} fainted!`, 'sys'); }
      return { ok: false };
    }
    return { ok: true };
  }
  return { ok: true };
}

function tryActionStatus(p, actionType) {
  const result = attemptStatusAction(p, actionType);
  if (!result.ok) {
    if (result.msg) log(result.msg, 'sys');
    renderAll();
    return false;
  }
  if (result.msg) log(result.msg, 'sys');
  return true;
}

function allocateExp(id) {
  const p = G.pokemon.find(x => x.id === id);
  if (!p || G.freeExp[G.cur] < 1) return;
  const db = DB[p.species];
  if (p.isEgg) {
    const cost = db?.hatchCost || 30;
    const grp = db?.hatchGroup;
    const pool = grp ? (G.hatchPools[p.player][grp] || 0) : (p.hatchProgress || 0);
    if (pool >= cost) {
      log(`${p.species} already has enough hatch progress.`, 'sys');
    }
    G.freeExp[G.cur]--;
    if (grp) {
      G.hatchPools[p.player][grp] = (G.hatchPools[p.player][grp] || 0) + 1;
      log(`Allocated 1 Command XP to ${grp} hatch pool (Player ${p.player}). Total: ${G.hatchPools[p.player][grp]}`, 'heal');
    } else {
      p.hatchProgress = (p.hatchProgress || 0) + 1;
      log(`Allocated 1 Command XP to ${p.species} egg.`, 'heal');
    }
    checkEvo(p);
    renderAll();
    return;
  }
  if (db?.evoCost && (p.exp || 0) >= db.evoCost) {
    log(`${p.species} is already ready to evolve.`, 'sys');
    return;
  }
  if (!db?.evoCost) {
    log(`${p.species} cannot gain evolution from Command EXP.`, 'sys');
    return;
  }
  G.freeExp[G.cur]--;
  p.exp = (p.exp || 0) + 1;
  log(`Allocated 1 Command EXP to ${p.species}.`, 'heal');
  checkEvo(p);
  renderAll();
}

function pk(col, row) { return G.pokemon.find(p => p.col === col && p.row === row && !p.fainted); }
function ped(col, row) { return G.pedestals.find(p => p.col === col && p.row === row); }

function typeBonus(attacker, target) {
  const adb = DB[attacker.species];
  const tdb = DB[target.species];
  let b = 0;
  const atkType = adb.t1;
  const defType = tdb.t1;
  const e = TEFF[atkType];
  if (!e) return 0;
  if (e.strong && e.strong.includes(defType)) { b++; }
  if (e.weak && e.weak.includes(defType)) { b--; }
  return b;
}

function log(msg, type = '') { G.log.unshift({ msg, type }); if (G.log.length > 50) G.log.pop(); const lb = document.getElementById('log-box'); if (lb) lb.innerHTML = G.log.map(l => `<div class="log-entry log-${l.type}">${l.msg}</div>`).join(''); }

function adjCells(col, row, range, diagonal) {
  const out = [];
  for (let dc = -range; dc <= range; dc++) {
    for (let dr = -range; dr <= range; dr++) {
      if (dc === 0 && dr === 0) continue;
      if (!diagonal && Math.abs(dc) + Math.abs(dr) > range) continue;
      const nc = col + dc, nr = row + dr;
      if (nc >= 0 && nc < 8 && nr >= 0 && nr < 8) out.push({ col: nc, row: nr });
    }
  }
  return out;
}

const DDIRS = { 1: { dc: 0, dr: -1 }, 2: { dc: 1, dr: 0 }, 3: { dc: 0, dr: 1 }, 4: { dc: -1, dr: 0 } };
function normalizeDir(dir, player) {
  if (player === 1) return dir;
  if (dir === 1) return 3;
  if (dir === 3) return 1;
  return dir;
}

const MOVE_PATTERNS = {
  Attack: {
    1: [{ dc: -1, dr: -1 }, { dc: 1, dr: -1 }, { dc: -1, dr: 1 }, { dc: 1, dr: 1 }],
    2: [{ dc: -1, dr: -1 }, { dc: 0, dr: -1 }, { dc: 1, dr: -1 }, { dc: -1, dr: 1 }, { dc: 0, dr: 1 }, { dc: 1, dr: 1 }],
    3: [{ dc: 0, dr: -2 }, { dc: -1, dr: -1 }, { dc: 0, dr: -1 }, { dc: 1, dr: -1 }, { dc: -1, dr: 1 }, { dc: 0, dr: 1 }, { dc: 1, dr: 1 }, { dc: 0, dr: 2 }]
  },
  Defense: {
    1: [{ dc: 0, dr: -1 }, { dc: -1, dr: 0 }, { dc: 1, dr: 0 }, { dc: 0, dr: 1 }],
    2: [{ dc: 0, dr: -1 }, { dc: -1, dr: 0 }, { dc: 1, dr: 0 }, { dc: -1, dr: 1 }, { dc: 0, dr: 1 }, { dc: 1, dr: 1 }],
    3: [{ dc: 0, dr: -1 }, { dc: -2, dr: 0 }, { dc: -1, dr: 0 }, { dc: 1, dr: 0 }, { dc: 2, dr: 0 }, { dc: -1, dr: 1 }, { dc: 0, dr: 1 }, { dc: 1, dr: 1 }]
  },
  Support: {
    1: [{ dc: 0, dr: -1 }, { dc: -1, dr: 0 }, { dc: 1, dr: 0 }],
    2: [{ dc: 0, dr: -1 }, { dc: -1, dr: 0 }, { dc: 1, dr: 0 }, { dc: 0, dr: 1 }],
    3: [{ dc: -1, dr: -1 }, { dc: 0, dr: -1 }, { dc: 1, dr: -1 }, { dc: -1, dr: 0 }, { dc: 1, dr: 0 }, { dc: 0, dr: 1 }]
  }
};

function getSpeciesStage(species) {
  const db = DB[species];
  if (!db) return 1;
  if (db.legendary) return 3;
  if (!db.evoFrom) return 1;
  if (db.evoTo) return 2;
  return 3;
}

function getLineCells(col, row, range, dirs) {
  const out = [];
  dirs.forEach(d => {
    const dir = DDIRS[d];
    if (!dir) return;
    for (let step = 1; step <= range; step++) {
      const nc = col + dir.dc * step;
      const nr = row + dir.dr * step;
      if (nc < 0 || nc >= 8 || nr < 0 || nr >= 8) break;
      out.push({ col: nc, row: nr });
    }
  });
  return out;
}

function getConeCells(col, row, range, dir) {
  const out = [];
  if (dir === 1 || dir === 3) {
    const dy = dir === 1 ? -1 : 1;
    for (let step = 1; step <= range; step++) {
      const nr = row + dy * step;
      if (range === 1) {
        for (let dx = -1; dx <= 1; dx++) { const nc = col + dx; if (nc >= 0 && nc < 8 && nr >= 0 && nr < 8) out.push({ col: nc, row: nr }); }
      } else if (step === 1) {
        const nc = col; if (nc >= 0 && nc < 8 && nr >= 0 && nr < 8) out.push({ col: nc, row: nr });
      } else if (step < range) {
        for (let dx = -1; dx <= 1; dx++) { const nc = col + dx; if (nc >= 0 && nc < 8 && nr >= 0 && nr < 8) out.push({ col: nc, row: nr }); }
      } else {
        for (let dx = -(range - 1); dx <= (range - 1); dx++) { const nc = col + dx; if (nc >= 0 && nc < 8 && nr >= 0 && nr < 8) out.push({ col: nc, row: nr }); }
      }
    }
  } else {
    const dx = dir === 2 ? 1 : -1;
    for (let step = 1; step <= range; step++) {
      const nc = col + dx * step;
      if (range === 1) {
        for (let dy = -1; dy <= 1; dy++) { const nr = row + dy; if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) out.push({ col: nc, row: row }); }
      } else if (step === 1) {
        if (nc >= 0 && nc < 8) out.push({ col: nc, row });
      } else if (step < range) {
        for (let dy = -1; dy <= 1; dy++) { const nr = row + dy; if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) out.push({ col: nc, row: nr }); }
      } else {
        for (let dy = -(range - 1); dy <= (range - 1); dy++) { const nr = row + dy; if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) out.push({ col: nc, row: nr }); }
      }
    }
  }
  return out;
}

function parseSkillShape(db, p, skillIdx) {
  let desc = '';
  if (typeof skillIdx !== 'undefined' && db && Array.isArray(db.skills) && db.skills[skillIdx]) {
    desc = db.skills[skillIdx].skillDesc || db.skills[skillIdx].desc || '';
  } else {
    desc = (db.skillDesc || '');
  }

  if (desc.trim().toLowerCase() === 'all') return { type: 'all' };

  let m = desc.match(/Target\s*=\s*\[(\d+)\((.+)\)\]/i);
  let targetCount = null;
  let inner = desc;
  if (m) { targetCount = +m[1]; inner = m[2]; }
  const parts = inner.split('+').map(s => s.trim()).filter(Boolean);
  const parsedParts = [];
  parts.forEach(part => {
    let mm = part.match(/Line\((\d+)\)\(([0-9,]+)\)/i);
    if (mm) { parsedParts.push({ type: 'line', range: +mm[1], dirs: mm[2].split(',').map(n => normalizeDir(+n, p.player)) }); return; }
    mm = part.match(/Cone\((\d+)\)(?:\(([0-9,]+)\))?/i);
    if (mm) { const dirs = mm[2] ? mm[2].split(',').map(n => normalizeDir(+n, p.player)) : [normalizeDir(3, p.player)]; parsedParts.push({ type: 'cone', range: +mm[1], dirs }); return; }
    mm = part.match(/AoE\((\d+)\)/i);
    if (mm) { parsedParts.push({ type: 'aoe', radius: +mm[1] }); return; }
  });
  if (parsedParts.length === 0) return { type: null, targetCount };
  if (parsedParts.length === 1) return Object.assign(parsedParts[0], { targetCount });
  return { type: 'combo', parts: parsedParts, targetCount };
}

function getSkillData(db, skillIdx) {
  if (typeof skillIdx !== 'undefined' && db && Array.isArray(db.skills) && db.skills[skillIdx]) return db.skills[skillIdx];
  return db;
}

function getSkillTargetType(skill, dbAll) {
  return skill?.skillEffect?.target
    || skill?.skillHealTarget
    || (skill?.special === 'leechSeed' ? 'enemy' : null)
    || dbAll?.skillEffect?.target
    || dbAll?.skillHealTarget
    || (dbAll?.special === 'leechSeed' ? 'enemy' : null)
    || null;
}

function getSkillCells(p, skillIdx) {
  const db = DB[p.species];
  const skill = getSkillData(db, skillIdx);
  const shape = parseSkillShape(db, p, skillIdx);
  const effectTarget = getSkillTargetType(skill, db);
  if (effectTarget === 'self') {
    return [{ col: p.col, row: p.row, type: 'atk' }];
  }
  if (effectTarget === 'all_allies') {
    return G.pokemon.filter(x => x.player === p.player && !x.fainted).map(x => ({ col: x.col, row: x.row, type: 'atk' }));
  }
  if (shape && shape.type) {
    const cells = [];
    const addShapeCells = (sh) => {
      if (!sh) return;
      if (sh.type === 'line') cells.push(...getLineCells(p.col, p.row, sh.range, sh.dirs));
      else if (sh.type === 'cone') sh.dirs.forEach(dir => cells.push(...getConeCells(p.col, p.row, sh.range, dir)));
      else if (sh.type === 'aoe') cells.push(...adjCells(p.col, p.row, sh.radius, true));
    };
    if (skill.skillDesc === "All") {
      return G.pokemon.filter(target =>
        target.player !== p.player || skill.skillEffect?.target === "all_allies"
      ).map(target => ({
        col: target.col,
        row: target.row,
        type: 'atk'
      }));
    }
    if (shape.type === 'combo') {
      shape.parts.forEach(addShapeCells);
    } else {
      addShapeCells(shape);
    }
    const seen = {};
    return cells.reduce((acc, c) => {
      const key = c.col + ',' + c.row;
      if (seen[key]) return acc;
      seen[key] = true;
      const t = pk(c.col, c.row), pd = ped(c.col, c.row);
      if (effectTarget === 'ally') {
        if (t && t.player === p.player) acc.push({ col: c.col, row: c.row, type: 'atk' });
        return acc;
      }
      if (effectTarget === 'enemy') {
        if ((t && t.player !== p.player) || (pd && pd.player !== p.player)) acc.push({ col: c.col, row: c.row, type: 'atk' });
        return acc;
      }
      if ((t && t.player !== p.player) || (pd && pd.player !== p.player)) acc.push({ col: c.col, row: c.row, type: 'atk' });
      return acc;
    }, []);
  }
  const range = (db.moveRange || 1) + 1;
  if (db.aoe) {
    return adjCells(p.col, p.row, db.aoe, true).filter(c => {
      const t = pk(c.col, c.row), pd = ped(c.col, c.row);
      if (effectTarget === 'ally') return t && t.player === p.player;
      return (t && t.player !== p.player) || (pd && pd.player !== p.player);
    }).map(c => ({ ...c, type: 'atk' }));
  }
  return adjCells(p.col, p.row, range, true).filter(c => {
    const t = pk(c.col, c.row), pd = ped(c.col, c.row);
    if (effectTarget === 'ally') return t && t.player === p.player;
    return (t && t.player !== p.player) || (pd && pd.player !== p.player);
  }).map(c => ({ ...c, type: 'atk' }));
}

function getSkillShapeCells(p, skillIdx) {
  const db = DB[p.species];
  const skill = getSkillData(db, skillIdx);
  const shape = parseSkillShape(db, p, skillIdx);
  const effectTarget = getSkillTargetType(skill, db);
  if (effectTarget === 'self') return [{ col: p.col, row: p.row, type: 'atk' }];
  if (effectTarget === 'all_allies') {
    return G.pokemon.filter(x => x.player === p.player && !x.fainted).map(x => ({ col: x.col, row: x.row, type: 'atk' }));
  }
  if (shape && shape.type) {
    const cells = [];
    const addShapeCells = (sh) => {
      if (!sh) return;
      if (sh.type === 'line') cells.push(...getLineCells(p.col, p.row, sh.range, sh.dirs));
      else if (sh.type === 'cone') sh.dirs.forEach(dir => cells.push(...getConeCells(p.col, p.row, sh.range, dir)));
      else if (sh.type === 'aoe') cells.push(...adjCells(p.col, p.row, sh.radius, true));
    };
    if (shape.type === 'combo') shape.parts.forEach(addShapeCells); else addShapeCells(shape);
    const seen = {};
    return cells.reduce((acc, c) => { const key = c.col + ',' + c.row; if (seen[key]) return acc; seen[key] = true; acc.push({ col: c.col, row: c.row, type: 'atk' }); return acc; }, []);
  }
  const range = (db.moveRange || 1) + 1;
  if (db.aoe) {
    return adjCells(p.col, p.row, db.aoe, true).map(c => ({ ...c, type: 'atk' }));
  }
  return adjCells(p.col, p.row, range, true).map(c => ({ ...c, type: 'atk' }));
}

function getRoleBasedMoves(p) {
  const db = DB[p.species];
  const out = [];
  const col = p.col;
  const row = p.row;
  const fwd = p.player === 1 ? 1 : -1;
  if (db && db.legendary && !p.hasHatched) return [];
  const addIfValid = (c, r) => { if (c >= 0 && c < 8 && r >= 0 && r < 8 && !pk(c, r) && !ped(c, r)) out.push({ col: c, row: r, type: 'move' }); };
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

function getAtkCells(p) {
  const fwd = p.player === 1 ? 1 : -1;
  const tc = p.col;
  const tr = p.row + fwd;
  if (tc < 0 || tc >= 8 || tr < 0 || tr >= 8) return [];
  const t = pk(tc, tr), pd = ped(tc, tr);
  if ((t && t.player !== p.player) || (pd && pd.player !== p.player)) return [{ col: tc, row: tr, type: 'atk' }];
  return [];
}

function awardActionExp(p, amount) {
  if (!p || p.fainted || p.isEgg) return;
  p.exp = (p.exp || 0) + amount;
  if (p.heldItem === "Lucky Egg") p.exp += 1;
  checkEvo(p);
}

function healPokemon(target, amount, logType = 'heal') {
  if (!target || target.fainted || !amount || amount <= 0) return;
  const before = target.hp;
  target.hp = Math.min(target.maxHp, target.hp + amount);
  const healed = target.hp - before;
  if (healed > 0) log(`${target.species} restored ${healed} HP.`, logType);
}

function applySkillGlobals(attacker, db) {
  if (db.setWeather) setWeather(db.setWeather, db.weatherDuration || 5);
  if (db.skillHeal && db.skillHealTarget === 'self') healPokemon(attacker, db.skillHeal, 'heal');
  if (db.skillHeal && db.skillHealTarget === 'all_allies') {
    G.pokemon.filter(p => p.player === attacker.player && !p.fainted).forEach(p => healPokemon(p, db.skillHeal, 'heal'));
  }

  // Apply +1 Def to all Ice types
  if (db.skillEffect && db.skillEffect.target === 'all_ice') {
    G.pokemon.filter(p => !p.fainted && (DB[p.species].t1 === 'Ice' || DB[p.species].t2 === 'Ice')).forEach(p => {
      const added = addModifier(p, db.skillEffect.stat, db.skillEffect.amount, db.skillEffect.duration, db.skillName || "Snow Scape");
      if (added) {
        log(`${p.species} gains ${db.skillEffect.amount > 0 ? '+' : ''}${db.skillEffect.amount} ${db.skillEffect.stat.toUpperCase()} for ${db.skillEffect.duration} turns from Snow Scape!`, 'heal');
      } else {
        log(`${p.species}'s Snow Scape buff duration was refreshed!`, 'sys');
      }
    });
  }

  if (db.selfDamage && !attacker.fainted) {
    attacker.hp = Math.max(0, attacker.hp - db.selfDamage);
    log(`${attacker.species} takes ${db.selfDamage} recoil damage.`, 'atk');
    if (attacker.hp <= 0) { attacker.fainted = true; log(`${attacker.species} fainted!`, 'sys'); }
  }
}

function applySkillEffect(attacker, target, db) {
  const effect = db.skillEffect;
  if (db.skillHeal && db.skillHealTarget === 'ally' && target && target.player === attacker.player) {
    healPokemon(target, db.skillHeal, 'heal');
  }
  if (db.drainAmount && target && !target.fainted) {
    healPokemon(attacker, db.drainAmount, 'heal');
  }
  if (db.special === 'leechSeed' && target && !target.fainted && target.player !== attacker.player) {
    target.leechSeed = { source: attacker, duration: db.specialDuration || 2 };
    log(`${target.species} was seeded!`, 'atk');
  }
  if (!effect) return;
  const amount = effect.amount || 0;
  const duration = effect.duration || 2;
  const stat = effect.stat;
  const label = stat ? stat.toUpperCase() : '';
  const sourceName = db.skillName || "Skill"; // Track where the buff came from!

  if (effect.target === 'self') {
    const added = addModifier(attacker, stat, amount, duration, sourceName);
    if (added) log(`${attacker.species} gains ${amount > 0 ? '+' : ''}${amount} ${label} for ${duration} turns.`, 'heal');
    else log(`${attacker.species}'s ${sourceName} buff duration was refreshed!`, 'sys');
    return;
  }
  if (!target || target.fainted) return;
  const isAlly = target.player === attacker.player;

  if (effect.target === 'ally' && isAlly) {
    const added = addModifier(target, stat, amount, duration, sourceName);
    if (added) log(`${target.species} ${amount > 0 ? 'gains' : 'loses'} ${amount > 0 ? '+' : ''}${amount} ${label} for ${duration} turns.`, 'heal');
    else log(`${target.species}'s ${sourceName} buff duration was refreshed!`, 'sys');
  }

  if (effect.target === 'enemy' && !isAlly) {
    const added = addModifier(target, stat, amount, duration, sourceName);
    if (added) log(`${target.species} ${amount > 0 ? 'gains' : 'loses'} ${amount > 0 ? '+' : ''}${amount} ${label} for ${duration} turns.`, 'atk');
    else log(`${target.species}'s ${sourceName} debuff duration was refreshed!`, 'sys');
  }
}

// In game.js, modify applyStatusMaybe function:
function applyStatusMaybe(db, target) {
  if (!db.statusChance || target.status) return;

  // Ice types cannot be frozen
  if (db.statusChance === 'freeze') {
    const tDb = DB[target.species];
    if (tDb && (tDb.t1 === 'Ice' || tDb.t2 === 'Ice')) return;
  }

  const chance = getStatusChanceValue(db.statusChance, db);
  if (Math.random() < chance) {
    target.status = db.statusChance;
    log(`${target.species} got ${db.statusChance}!`, 'sys');
    showChanceVisualization(chance, db.statusChance);
  }
}

// Add this function to visualize chances
function showChanceVisualization(chance, statusType) {
  const roll = Math.floor(Math.random() * 20) + 1;
  const threshold = Math.floor(chance * 20);
  const success = roll <= threshold;

  const chanceBar = document.createElement('div');
  chanceBar.className = 'chance-visualization';
  chanceBar.innerHTML = `
    <div class="chance-label">${statusType} chance: ${Math.round(chance * 100)}%</div>
    <div class="chance-bar">
      <div class="chance-threshold" style="width: ${threshold * 5}%"></div>
      <div class="chance-roll" style="left: ${roll * 5}%"></div>
    </div>
    <div class="chance-result">Roll: ${roll}/20 ${success ? '✓' : '✗'}</div>
  `;

  // Add to UI temporarily
  document.body.appendChild(chanceBar);
  setTimeout(() => chanceBar.remove(), 3000);
}

function doDmg(attacker, dmg, tc, tr, isSkill, skillDb) {
  const target = pk(tc, tr);
  const pd = ped(tc, tr);
  if (target) {
    const bonus = typeBonus(attacker, target);
    const attackVal = isSkill ? dmg : getModifiedStat(attacker, 'atk', { action: "melee", isSkill: false, target: target });
    const targetDef = getModifiedStat(target, 'def', { bySkill: isSkill });
    let d = Math.max(0, attackVal + bonus - targetDef);
    if (attacker.status === 'burn') d = Math.max(0, d - 1);

    if (attacker.heldItem === "Life Orb") d += 0;

    target.hp = Math.max(0, target.hp - d);

    if (target.heldItem === "Rocky Helmet" && !isSkill) {
      attacker.hp = Math.max(0, attacker.hp - 1);
      log(`${target.species}'s Rocky Helmet deals 1 recoil damage back to ${attacker.species}!`, 'atk');
      if (attacker.hp <= 0) { attacker.fainted = true; log(`${attacker.species} fainted!`, 'sys'); }
    }

    // Apply status effects even if damage is 0
    if (isSkill) applyStatusMaybe(skillDb || DB[attacker.species], target);

    // Show chance visualization for status effects
    if (isSkill && skillDb && skillDb.statusChance) {
      const chance = getStatusChanceValue(skillDb.statusChance, skillDb);
      showChanceVisualization(chance, skillDb.statusChance);
    }

    log(`${attacker.species} ${isSkill ? 'uses skill on' : 'attacks'} ${target.species} for ${d} dmg`, 'atk');

    if (target.hp <= 0 && target.heldItem === "Focus Band" && !target.focusBandUsed) {
      target.hp = 1;
      target.focusBandUsed = true;
      log(`❤️ ${target.species} survived on 1 HP thanks to its Focus Band!`, 'heal');
    }

    if (target.hp <= 0) {
      target.fainted = true;
      log(`${target.species} fainted!`, 'sys');
      if (attacker.heldItem === "Lucky Egg") awardActionExp(attacker, 1);
      checkLossByPedestal(target.player);
    }
  } else if (pd) {
    let d = dmg;
    if (attacker.status === 'burn') d = Math.max(0, d - 1);
    pd.hp = Math.max(0, pd.hp - d);
    log(`${attacker.species} hits P${pd.player} pedestal for ${d}! (${pd.hp} HP)`, 'atk');
    if (pd.hp <= 0) {
      log(`Player ${pd.player}'s pedestal was destroyed!`, 'sys');
      checkLossByPedestal(pd.player);
    }
  }

  if (attacker.heldItem === "Life Orb" && !attacker.fainted) {
    attacker.hp = Math.max(0, attacker.hp - 1);
    log(`${attacker.species} loses 1 HP from Life Orb!`, 'atk');
    if (attacker.hp <= 0) { attacker.fainted = true; log(`${attacker.species} fainted!`, 'sys'); }
  }
}

// Add this new function to visualize chances
function showChanceVisualization(chance, statusType) {
  const roll = Math.floor(Math.random() * 20) + 1;
  const threshold = Math.floor(chance * 20);
  const success = roll <= threshold;

  const chanceBar = document.createElement('div');
  chanceBar.className = 'chance-visualization';
  chanceBar.innerHTML = `
    <div class="chance-label">${statusType} chance: ${Math.round(chance * 100)}%</div>
    <div class="chance-bar">
      <div class="chance-threshold" style="width: ${threshold * 5}%"></div>
      <div class="chance-roll" style="left: ${roll * 5}%"></div>
    </div>
    <div class="chance-result">Roll: ${roll}/20 ${success ? '✓' : '✗'}</div>
  `;

  // Add to UI temporarily
  document.body.appendChild(chanceBar);
  setTimeout(() => chanceBar.remove(), 3000);
}

function doAttack(attacker, tc, tr) {
  if (!tryActionStatus(attacker, 'attack')) return;
  doDmg(attacker, DB[attacker.species].atk, tc, tr, false);
  awardActionExp(attacker, 1);

  if (attacker.heldItem === "Shell Bell") {
    G.energy[G.cur] = Math.min(G.maxE[G.cur], G.energy[G.cur] + 1);
    log(`${attacker.species} gains 1 Energy from Shell Bell!`, 'heal');
  }

  attacker.hasAttacked = true;
  G.energy[G.cur] = Math.max(0, G.energy[G.cur] - 1);
  clearHL(); renderAll();
}

// MODIFIED: Skill damage now uses floor(ATK/2) by default, or explicit skillDmg if defined
function calculateSkillDamage(attacker, skill, dbAll) {
  // If skill has explicit skillDmg defined (even if 0), use it (for status moves)
  // Otherwise calculate from ATK/2 rounded down
  if (typeof skill.skillDmg !== 'undefined') {
    return skill.skillDmg;
  }
  if (typeof dbAll.skillDmg !== 'undefined' && typeof skill.skillIdx === 'undefined') {
    return dbAll.skillDmg;
  }
  // Default: ATK / 2, round down
  return Math.floor(getModifiedStat(attacker, 'atk', { isSkill: true }) / 2);
}

function doSkill(attacker, tc, tr, skillIdx) {
  const dbAll = DB[attacker.species];
  const skill = getSkillData(dbAll, skillIdx);
  const targetType = getSkillTargetType(skill, dbAll);
  let cost = skill.skillCost || dbAll.skillCost || 2;

  if (attacker.heldItem === "Miracle Seed" && !attacker.hasUsedSkill) {
    cost = Math.max(0, cost - 1);
  }

  const skillKey = (typeof skillIdx !== 'undefined') ? `s_${skillIdx}` : 's_base';
  const limit = (typeof skill.limit !== 'undefined') ? skill.limit : ((typeof skill.skillLimit !== 'undefined') ? skill.skillLimit : ((typeof dbAll.skillLimit !== 'undefined') ? dbAll.skillLimit : undefined));
  const cd = (typeof skill.cooldown !== 'undefined') ? skill.cooldown : ((typeof skill.skillCooldown !== 'undefined') ? skill.skillCooldown : ((typeof dbAll.skillCooldown !== 'undefined') ? dbAll.skillCooldown : 0));
  const used = attacker.skillUses && attacker.skillUses[skillKey] ? attacker.skillUses[skillKey] : 0;
  const cdRem = attacker.skillCooldowns && attacker.skillCooldowns[skillKey] ? attacker.skillCooldowns[skillKey] : 0;
  if (cdRem > 0) { log(`${attacker.species}'s ${skill.skillName || dbAll.skillName} is on cooldown (${cdRem} turns).`, 'sys'); return; }
  if (typeof limit !== 'undefined' && limit >= 0 && used >= limit) { log(`${attacker.species} cannot use ${skill.skillName || dbAll.skillName} any more (limit ${limit}).`, 'sys'); return; }
  if (G.energy[G.cur] < cost) { log('Not enough energy!', 'sys'); return; }
  if (!tryActionStatus(attacker, 'skill')) return;

  // Calculate skill damage using new system
  const baseSkillDmg = calculateSkillDamage(attacker, skill, dbAll);

  // FIX: Properly extract the AoE radius directly from the description string
  const shape = parseSkillShape(dbAll, attacker, skillIdx);
  const aoeRadius = skill.aoe || (shape && shape.type === 'aoe' ? shape.radius : 0);

  if (aoeRadius > 0) {
    adjCells(attacker.col, attacker.row, aoeRadius, true).forEach(c => {
      const t = pk(c.col, c.row), pd = ped(c.col, c.row);
      if ((t && t.player !== attacker.player) || (pd && pd.player !== attacker.player)) {
        doDmg(attacker, baseSkillDmg, c.col, c.row, true, skill);
        if (t) applySkillEffect(attacker, t, skill);
      }
      if (skill.skillEffect?.target === 'ally' && t && t.player === attacker.player) {
        applySkillEffect(attacker, t, skill);
      }
    });
    applySkillGlobals(attacker, skill);
    log(`${attacker.species} used ${skill.skillName || dbAll.skillName}!`, 'atk');

  } else if (skill.skillDesc === "All") {
    // Hits EVERY pokemon on the board
    G.pokemon.filter(t => !t.fainted).forEach(t => {
      doDmg(attacker, baseSkillDmg, t.col, t.row, true, skill);
      applySkillEffect(attacker, t, skill);
    });
    applySkillGlobals(attacker, skill);
    log(`${attacker.species} used ${skill.skillName || dbAll.skillName} on ALL Pokémon!`, 'atk');

  } else {
    // Treat 'all_ice' similarly to 'self' so it doesn't trigger the damage function
    if (targetType === 'self' || targetType === 'all_ice') {
      applySkillEffect(attacker, attacker, skill);
      applySkillGlobals(attacker, skill);
      log(`${attacker.species} used ${skill.skillName || dbAll.skillName}!`, 'atk');
    } else {
      const target = pk(tc, tr);
      doDmg(attacker, baseSkillDmg, tc, tr, true, skill);
      applySkillEffect(attacker, target, skill);
      applySkillGlobals(attacker, skill);
      log(`${attacker.species} used ${skill.skillName || dbAll.skillName}!`, 'atk');
    }
  }

  awardActionExp(attacker, 2);
  attacker.hasUsedSkill = true;
  G.energy[G.cur] = Math.max(0, G.energy[G.cur] - cost);
  attacker.skillUses = attacker.skillUses || {};
  attacker.skillCooldowns = attacker.skillCooldowns || {};
  attacker.skillUses[skillKey] = (attacker.skillUses[skillKey] || 0) + 1;
  if (cd && cd > 0) attacker.skillCooldowns[skillKey] = cd;
  clearHL(); renderAll();
}

function doSkillMulti(attacker, targets, skillIdx) {
  const dbAll = DB[attacker.species];
  const skill = getSkillData(dbAll, skillIdx);
  let cost = skill.skillCost || dbAll.skillCost || 2;

  if (attacker.heldItem === "Miracle Seed" && !attacker.hasUsedSkill) {
    cost = Math.max(0, cost - 1);
  }

  const totalCost = cost * (targets.length || 0);
  const skillKey = (typeof skillIdx !== 'undefined') ? `s_${skillIdx}` : 's_base';
  const limit = (typeof skill.limit !== 'undefined') ? skill.limit : ((typeof skill.skillLimit !== 'undefined') ? skill.skillLimit : ((typeof dbAll.skillLimit !== 'undefined') ? dbAll.skillLimit : undefined));
  const cd = (typeof skill.cooldown !== 'undefined') ? skill.cooldown : ((typeof skill.skillCooldown !== 'undefined') ? skill.skillCooldown : ((typeof dbAll.skillCooldown !== 'undefined') ? dbAll.skillCooldown : 0));
  const used = attacker.skillUses && attacker.skillUses[skillKey] ? attacker.skillUses[skillKey] : 0;
  const cdRem = attacker.skillCooldowns && attacker.skillCooldowns[skillKey] ? attacker.skillCooldowns[skillKey] : 0;
  if (cdRem > 0) { log(`${attacker.species}'s ${skill.skillName || dbAll.skillName} is on cooldown (${cdRem} turns).`, 'sys'); return; }
  if (typeof limit !== 'undefined' && limit >= 0 && used >= limit) { log(`${attacker.species} cannot use ${skill.skillName || dbAll.skillName} any more (limit ${limit}).`, 'sys'); return; }
  if (G.energy[G.cur] < totalCost) { log('Not enough energy for multi-target!', 'sys'); return; }
  if (!tryActionStatus(attacker, 'skill')) return;

  // Calculate skill damage using new system
  const baseSkillDmg = calculateSkillDamage(attacker, skill, dbAll);

  targets.forEach(t => {
    doDmg(attacker, baseSkillDmg, t.col, t.row, true, skill);
    const target = pk(t.col, t.row);
    applySkillEffect(attacker, target, skill);
  });
  applySkillGlobals(attacker, skill);
  log(`${attacker.species} used ${skill.skillName || dbAll.skillName} on ${targets.length} targets!`, 'atk');
  awardActionExp(attacker, 2);
  attacker.hasUsedSkill = true;
  G.energy[G.cur] = Math.max(0, G.energy[G.cur] - totalCost);
  attacker.skillUses = attacker.skillUses || {};
  attacker.skillCooldowns = attacker.skillCooldowns || {};
  attacker.skillUses[skillKey] = (attacker.skillUses[skillKey] || 0) + 1;
  if (cd && cd > 0) attacker.skillCooldowns[skillKey] = cd;
  clearHL(); renderAll();
}

function doMove(p, col, row) {
  let cost = 1;
  if (p.heldItem === "Quick Claw" && !p.hasMovedEver) { cost = 0; p.hasMovedEver = true; log(`${p.species} activated Quick Claw! Move cost is 0.`, 'heal'); }
  if (G.energy[G.cur] < cost) { log('No energy!', 'sys'); return; }
  if (!tryActionStatus(p, 'move')) return;
  p.col = col; p.row = row;
  G.energy[G.cur] = Math.max(0, G.energy[G.cur] - cost);
  p.hasMoved = true;
  log(`${p.species} moved to ${String.fromCharCode(65 + col)}${row + 1}`, 'sys');
  clearHL(); G.selectedCell = null; G.actionMode = null; renderAll();
}

function checkEvo(p) {
  const db = DB[p.species];
  if (!db) return;
  if (db.legendary && p.isEgg && !p.hasHatched) {
    const cost = db.hatchCost || 30;
    const grp = db.hatchGroup;
    const pool = grp ? (G.hatchPools[p.player][grp] || 0) : (p.hatchProgress || 0);
    if (pool >= cost && !p.pendingHatch) {
      p.pendingHatch = true;
      log(`${p.species} is ready to hatch at end of turn.`, 'sys');
    }
    return;
  }
  if (!db.evoTo || !db.evoCost) return;
  if ((p.exp || 0) >= db.evoCost && !p.pendingEvo) {
    p.pendingEvo = true;
    log(`${p.species} is ready to evolve at end of turn.`, 'sys');
  }
}

function resolvePendingEvolutions() {
  G.pokemon.forEach(p => {
    if (p.fainted) return;
    const db = DB[p.species];
    if (p.pendingHatch && db && db.legendary && p.isEgg && !p.hasHatched) {
      p.pendingHatch = false; p.hasHatched = true; p.isEgg = false;
      const oldMax = p.maxHp || 10;
      const damageTaken = Math.max(0, oldMax - (p.hp || 0));
      const ndb = DB[p.species];
      p.maxHp = ndb.hp;
      p.hp = Math.max(1, p.maxHp - damageTaken);
      p.def = ndb.def || 0;
      log(`The Legendary Egg hatched into its true form: ${p.species}!`, 'sys');
    }
    if (p.pendingEvo && db && db.evoTo && db.evoCost && (p.exp || 0) >= db.evoCost) {
      p.pendingEvo = false;
      const old = p.species;
      const oldMax = DB[old] ? DB[old].hp : (p.maxHp || 0);
      const damageTaken = Math.max(0, oldMax - (p.hp || 0));
      p.species = db.evoTo;
      const ndb = DB[db.evoTo];
      p.maxHp = ndb.hp;
      p.hp = Math.max(1, p.maxHp - damageTaken);
      p.def = ndb.def || 0;
      log(`${old} evolved into ${db.evoTo}!`, 'heal');
    }
  });
}

// MODIFIED: Now only applies to specific player's Pokemon when they end turn
function statusTurnEnd(player) {
  G.pokemon.filter(p => p.player === player && !p.fainted).forEach(p => {
    // Handle Leech Seed (drain effect)
    if (p.leechSeed && p.leechSeed.source && !p.leechSeed.source.fainted) {
      const drain = 1;
      p.hp = Math.max(0, p.hp - drain);
      p.leechSeed.source.hp = Math.min(p.leechSeed.source.maxHp, p.leechSeed.source.hp + drain);
      log(`${p.species} loses ${drain} HP to Leech Seed!`, 'atk');
      p.leechSeed.duration--;
      if (p.leechSeed.duration <= 0) p.leechSeed = null;
      if (p.hp <= 0) {
        p.fainted = true;
        log(`${p.species} fainted!`, 'sys');
        checkLossByPedestal(p.player);
      }
    }

    if (p.status === 'burn') {
      p.hp = Math.max(0, p.hp - 1);
      if (Math.random() < 0.5) p.status = null;
      if (p.hp <= 0) { p.fainted = true; log(`${p.species} fainted!`, 'sys'); checkLossByPedestal(p.player); }
    }
    if (p.status === 'poison') {
      p.hp = Math.max(0, p.hp - 1);
      if (Math.random() < 0.25) p.status = null;
      if (p.hp <= 0) { p.fainted = true; log(`${p.species} fainted!`, 'sys'); checkLossByPedestal(p.player); }
    }
    if (p.status === 'toxic') {
      p.hp = Math.max(0, p.hp - 1);
      if (p.hp <= 0) { p.fainted = true; log(`${p.species} fainted!`, 'sys'); checkLossByPedestal(p.player); }
    }
    if (p.status === 'freeze' && Math.random() < 0.25) { p.status = null; log(`${p.species} thawed!`, 'heal'); }
    if (p.status === 'sleep' && Math.random() < 0.25) { p.status = null; log(`${p.species} woke up!`, 'heal'); }
    if (p.status === 'confuse' && Math.random() < 0.33) { p.status = null; }
  });
}

function endTurn() {
  // MODIFIED: Status and modifiers now only tick for current player when they end turn
  statusTurnEnd(G.cur);
  tickModifiers(G.cur);
  applyWeatherTurnEffects();

  G.pokemon.forEach(p => {
    if (p.fainted) return;

    if (p.heldItem === "Leftovers" && p.player === G.cur && p.hp < p.maxHp) {
      p.hp = Math.min(p.maxHp, p.hp + 1);
      log(`🍏 ${p.species} restored 1 HP from Leftovers.`, 'heal');
    }

    if (p.heldItem === "EXP Share" && p.player === G.cur && !p.hasMoved && !p.hasAttacked && !p.hasUsedSkill) {
      p.exp = (p.exp || 0) + 1;
      log(`🎓 ${p.species} gained 1 EXP from EXP Share.`, 'heal');
    }

    if (p.isEgg) {
      const db = DB[p.species];
      if (db && db.hatchGroup) G.hatchPools[p.player][db.hatchGroup] = (G.hatchPools[p.player][db.hatchGroup] || 0) + 1;
      else p.hatchProgress = (p.hatchProgress || 0) + 1;
      checkEvo(p);
    } else {
      p.exp = (p.exp || 0) + 1; checkEvo(p);
    }
  });
  resolvePendingEvolutions();
  G.freeExp[G.cur] = (G.freeExp[G.cur] || 0) + 2;
  log(`Player ${G.cur} gained 2 Command EXP`, 'sys');
  G.pokemon.filter(p => p.player === G.cur).forEach(p => {
    p.hasMoved = false; p.hasAttacked = false; p.hasUsedSkill = false;
    if (p.skillCooldowns) { Object.keys(p.skillCooldowns).forEach(k => { if (p.skillCooldowns[k] > 0) p.skillCooldowns[k]--; }); }
  });
  G.cur = G.cur === 1 ? 2 : 1;
  if (G.cur === 1) G.turn++;
  updatePhase();
  G.energy[G.cur] = G.maxE[G.cur];
  clearHL(); G.selectedCell = null; G.actionMode = null;
  log(`--- Player ${G.cur}'s turn (T${G.turn}) ---`, 'sys');
  renderAll();
}

function updatePhase() {
  const t = G.turn;
  if (t <= 10) G.phase = 1; else if (t <= 20) G.phase = 2; else if (t <= 30) G.phase = 3; else if (t <= 40) G.phase = 4; else G.phase = 5;
  if (t === 10 && !G.p1done) { G.maxE[1] = 4; G.maxE[2] = 4; G.p1done = true; log('Phase 1! Max energy +1 (4)', 'heal'); }
  if (t === 30 && !G.p3done) { G.maxE[1] = 5; G.maxE[2] = 5; G.p3done = true; log('Phase 3! Max energy +1 (5)', 'heal'); }
  const gTurns = [1, 6, 11, 16, 21, 26, 31, 36, 41];
  if (gTurns.includes(t)) {
    const g = t >= 41 ? 7 : t >= 21 ? 6 : 5;
    G.gold[1] += g; G.gold[2] += g;
  }
}

function win(player, reason) {
  G.over = true;
  if (player === 0) {
    const s1 = G.pedestals.find(p => p.player === 1).hp * 3 + G.pokemon.filter(p => p.player === 1 && !p.fainted).reduce((a, p) => a + p.hp, 0);
    const s2 = G.pedestals.find(p => p.player === 2).hp * 3 + G.pokemon.filter(p => p.player === 2 && !p.fainted).reduce((a, p) => a + p.hp, 0);
    document.getElementById('end-title').textContent = s1 >= s2 ? 'Player 1 wins!' : 'Player 2 wins!';
    document.getElementById('end-score').textContent = `P1 score: ${s1}  |  P2 score: ${s2}`;
  } else {
    document.getElementById('end-title').textContent = `Player ${player} wins!`;
    document.getElementById('end-score').textContent = reason;
  }
  showScreen('end');
}

function clearHL() { G.hlCells = []; G.actionMode = null; }

function computePreviewHighlights() {
  G.previewAtkCells = []; G.previewSkillCells = [];
  if (!G.selectedCell) return;
  const p = pk(G.selectedCell.col, G.selectedCell.row);
  if (!p || p.fainted) return;
  G.previewAtkCells = getAtkCells(p);
  const effSkillIdx = (G.actionMode && typeof G.actionMode.skillIdx !== 'undefined') ? G.actionMode.skillIdx : undefined;
  G.previewSkillCells = getSkillCells(p, effSkillIdx);
}

function cellClick(col, row) {
  if (G.over) return;

  if (G.actionMode && G.actionMode.type === 'equip') {
    const p = pk(col, row);
    if (p && p.player === G.cur && !p.fainted) {
      if (G.actionMode.itemType === 'held') {
        if (p.heldItem) G.inventory[G.cur].held.push(p.heldItem);
        p.heldItem = G.actionMode.item;
        const idx = G.inventory[G.cur].held.indexOf(G.actionMode.item);
        if (idx > -1) G.inventory[G.cur].held.splice(idx, 1);
        log(`${p.species} equipped ${G.actionMode.item}.`, 'heal');
      } else {
        const itemUsed = G.actionMode.item;
        if (itemUsed === "Sitrus Berry") p.hp = Math.min(p.maxHp, p.hp + 2);
        if (itemUsed === "Berry Juice") p.hp = Math.min(p.maxHp, p.hp + 1);
        if (itemUsed === "Lum Berry") p.status = null;
        if (itemUsed === "Mental Herb") p.status = null;
        if (itemUsed === "White Herb") p.modifiers = [];
        if (itemUsed === "Power Herb") {
          const added = addModifier(p, 'atk', 1, 2, "Power Herb");
          if (!added) log(`${p.species}'s Power Herb duration was refreshed.`, 'sys');
        }

        const idx = G.inventory[G.cur].consumable.indexOf(itemUsed);
        if (idx > -1) G.inventory[G.cur].consumable.splice(idx, 1);
        log(`${p.species} consumed ${itemUsed}.`, 'heal');
      }
      clearHL(); G.actionMode = null; renderAll(); return;
    } else {
      log("Select your own active Pokemon to use item.", "sys"); return;
    }
  }

  const hl = G.hlCells.find(c => c.col === col && c.row === row);
  if (G.actionMode && hl) {
    if (G.actionMode.type === 'skill' && (G.actionMode.maxTargets || 0) > 1 && hl.type === 'atk') {
      G.actionMode.targets = G.actionMode.targets || [];
      const idx = G.actionMode.targets.findIndex(t => t.col === col && t.row === row);
      if (idx >= 0) G.actionMode.targets.splice(idx, 1); else G.actionMode.targets.push({ col, row });
      renderAll();
      if (G.actionMode.targets.length >= G.actionMode.maxTargets) { doSkillMulti(G.actionMode.poke, G.actionMode.targets, G.actionMode.skillIdx); }
      return;
    }
    if (G.actionMode.type === 'move' && hl.type === 'move') { doMove(G.actionMode.poke, col, row); return; }
    if (G.actionMode.type === 'attack' && hl.type === 'atk') { doAttack(G.actionMode.poke, col, row); return; }
    if (G.actionMode.type === 'skill' && hl.type === 'atk') { doSkill(G.actionMode.poke, col, row, G.actionMode.skillIdx); return; }
  }
  clearHL(); G.actionMode = null;
  const p = pk(col, row), pd2 = ped(col, row);
  G.selectedCell = (p || pd2) ? { col, row } : null;
  computePreviewHighlights();
  renderAll();
}

function selectAction(type, id, skillIdx) {
  const p = G.pokemon.find(x => x.id === id); if (!p) return;
  const db = DB[p.species];
  if (db.legendary && !p.hasHatched) { log('Legendary Egg is dormant. Requires 30 EXP to act!', 'sys'); return; }

  const prev = G.actionMode;
  clearHL();

  if (type === 'skill') {
    G.skillMenuFor = p.id;
    const effSkillIdx = (typeof skillIdx !== 'undefined') ? skillIdx : (prev && prev.skillIdx);
    const skillData = getSkillData(db, effSkillIdx);
    const shape = parseSkillShape(db, p, effSkillIdx);
    const targetType = getSkillTargetType(skillData, db);
    const maxT = (shape && shape.targetCount) ? shape.targetCount : 1;

    // FIX: Reliably detect ALL instant-cast / self-cast skills
    const isInstantCast = ((shape && (shape.type === 'aoe' || shape.type === 'all')) && !shape.targetCount) ||
      targetType === 'self' || targetType === 'all_ice' || targetType === 'all_allies' ||
      (skillData.skillDesc && skillData.skillDesc.trim().toLowerCase() === 'self');

    if (isInstantCast) {
      if (prev && prev.type === 'skill' && prev.poke.id === p.id && prev.confirmingIdx === effSkillIdx) {
        doSkill(p, null, null, effSkillIdx);
        return;
      } else {
        G.actionMode = { type: 'skill', poke: p, skillIdx: effSkillIdx, confirmingIdx: effSkillIdx, preview: true };

        // --- FIX: Show visual indicators for Instant Casts ---
        if (shape && shape.type === 'all') {
          // Powder Snow: Highlight every valid target on the board
          G.hlCells = G.pokemon.filter(t => !t.fainted).map(t => ({ col: t.col, row: t.row, type: 'atk' }));
        } else if (targetType === 'all_ice') {
          // Snow Scape: Highlight only the Ice types getting the buff
          G.hlCells = G.pokemon.filter(t => !t.fainted && (DB[t.species].t1 === 'Ice' || DB[t.species].t2 === 'Ice')).map(t => ({ col: t.col, row: t.row, type: 'atk' }));
        } else if (targetType === 'all_allies') {
          // Highlight your whole team
          G.hlCells = G.pokemon.filter(t => !t.fainted && t.player === p.player).map(t => ({ col: t.col, row: t.row, type: 'atk' }));
        } else {
          // Blizzard (AoE) and Self Casts: Highlight the standard shape area
          G.hlCells = getSkillShapeCells(p, effSkillIdx);
        }
        // -----------------------------------------------------

        renderAll();
        return;
      }
    }

    // Normal Targeted Skills - click the board to cast
    G.actionMode = { type: 'skill', poke: p, preview: true, skillIdx: effSkillIdx, confirmingIdx: null };
    G.actionMode.maxTargets = maxT;
    G.actionMode.targets = [];
    G.hlCells = getSkillShapeCells(p, effSkillIdx);
    renderAll();
    return;
  }

  // Move and Attack Logic
  G.skillMenuFor = null;
  G.actionMode = { type, poke: p };
  if (type === 'move') G.hlCells = getRoleBasedMoves(p);
  if (type === 'attack') G.hlCells = getAtkCells(p);
  renderAll();
}

const SETUP_FILTER = { cost: 'all', type: 'all', role: 'all', rarity: 'all' };
let SETUP_SELECTED_SLOT = { player: 1, slot: 0 };
let SETUP_POSITIONS = { 1: [], 2: [] };

function getSetupSpecies() {
  return Object.keys(DB).filter(name => {
    const db = DB[name];
    if (!db || (!db.base && !db.legendary)) return false;
    if (SETUP_FILTER.cost !== 'all' && db.cost.toString() !== SETUP_FILTER.cost) return false;
    if (SETUP_FILTER.type !== 'all' && db.t1 !== SETUP_FILTER.type && db.t2 !== SETUP_FILTER.type) return false;
    if (SETUP_FILTER.role !== 'all' && db.cls !== SETUP_FILTER.role) return false;
    if (SETUP_FILTER.rarity === 'legendary' && !db.legendary) return false;
    if (SETUP_FILTER.rarity === 'non-legendary' && db.legendary) return false;
    return true;
  }).sort();
}

function getSetupTypes() {
  const types = new Set(); Object.values(DB).forEach(db => { if (!db || (!db.base && !db.legendary)) return; if (db.t1) types.add(db.t1); if (db.t2) types.add(db.t2); }); return Array.from(types).sort();
}

function getSetupRoles() {
  const roles = new Set(); Object.values(DB).forEach(db => { if (!db || (!db.base && !db.legendary)) return; if (db.cls) roles.add(db.cls); }); return Array.from(roles).sort();
}

function setSetupFilter(field, value) {
  SETUP_FILTER[field] = value; updateSetupSelectOptions(); renderSetupBoard();
}

function buildSetup() {
  const filterEl = document.getElementById('setup-filters');
  if (filterEl) {
    const types = getSetupTypes(), roles = getSetupRoles();
    filterEl.innerHTML = `
      <div class="setup-filters-panel">
        <div class="filter-group"><div class="filter-group-label">Cost</div><div class="filter-tabs" id="cost-tabs"></div></div>
        <div class="filter-group"><div class="filter-group-label">Type</div><div class="filter-tabs" id="type-tabs"></div></div>
        <div class="filter-group"><div class="filter-group-label">Role</div><div class="filter-tabs" id="role-tabs"></div></div>
        <div class="filter-group"><div class="filter-group-label">Rarity</div><div class="filter-tabs" id="rarity-tabs"></div></div>
      </div>
    `;
    const costTabs = document.getElementById('cost-tabs');
    ['all', '1', '2', '3', '4', '5'].forEach(c => { const el = document.createElement('div'); el.className = 'filter-tab' + (c === 'all' ? ' active' : ''); el.textContent = (c === 'all' ? 'All' : c); el.dataset.value = c; el.onclick = () => { setSetupFilter('cost', c); Array.from(costTabs.children).forEach(n => n.classList.remove('active')); el.classList.add('active'); }; costTabs.appendChild(el); });
    const typeTabs = document.getElementById('type-tabs');
    const allType = document.createElement('div'); allType.className = 'filter-tab active'; allType.textContent = 'All'; allType.onclick = () => { setSetupFilter('type', 'all'); Array.from(typeTabs.children).forEach(n => n.classList.remove('active')); allType.classList.add('active'); }; typeTabs.appendChild(allType);
    types.forEach(t => { const el = document.createElement('div'); el.className = 'filter-tab'; el.textContent = t; el.onclick = () => { setSetupFilter('type', t); Array.from(typeTabs.children).forEach(n => n.classList.remove('active')); el.classList.add('active'); }; typeTabs.appendChild(el); });
    const roleTabs = document.getElementById('role-tabs');
    const allRole = document.createElement('div'); allRole.className = 'filter-tab active'; allRole.textContent = 'All'; allRole.onclick = () => { setSetupFilter('role', 'all'); Array.from(roleTabs.children).forEach(n => n.classList.remove('active')); allRole.classList.add('active'); }; roleTabs.appendChild(allRole);
    roles.forEach(r => { const el = document.createElement('div'); el.className = 'filter-tab'; el.textContent = r; el.onclick = () => { setSetupFilter('role', r); Array.from(roleTabs.children).forEach(n => n.classList.remove('active')); el.classList.add('active'); }; roleTabs.appendChild(el); });
    const rarityTabs = document.getElementById('rarity-tabs');
    ['all', 'legendary', 'non-legendary'].forEach(rv => { const el = document.createElement('div'); el.className = 'filter-tab' + (rv === 'all' ? ' active' : ''); el.textContent = rv === 'all' ? 'All' : (rv === 'legendary' ? 'Legendary' : 'Non-legendary'); el.onclick = () => { setSetupFilter('rarity', rv); Array.from(rarityTabs.children).forEach(n => n.classList.remove('active')); el.classList.add('active'); }; rarityTabs.appendChild(el); });
  }
  
  initSetupPositions();
  
  for (let pl = 1; pl <= 2; pl++) {
    const el = document.getElementById(`p${pl}-slots`); 
    if (!el) continue;
    el.innerHTML = '';
    
    for (let s = 0; s < 6; s++) {
      const row = document.createElement('div'); 
      row.className = 'poke-slot'; 
      row.dataset.player = pl; 
      row.dataset.slot = s;
      
      row.addEventListener('click', e => { 
        if (e.target.tagName === 'SELECT') return; 
        selectSetupSlot(pl, s); 
      });
      
      const label = document.createElement('span'); 
      label.className = 'slot-num'; 
      label.textContent = (s + 1);
      
      const sel = document.createElement('select'); 
      sel.id = `p${pl}s${s}`; 
      sel.style.cssText = 'flex: 1; margin: 0 8px; display: block; background: #fff; border: 1px solid #ccc; padding: 6px; border-radius: 4px; font-weight: 500; color: #333;';
      sel.onchange = () => { 
        updateCost(pl); 
        renderSetupBoard(); 
      };
      
      row.appendChild(label); 
      row.appendChild(sel); 
      el.appendChild(row); 
    }
  }
  
  selectSetupSlot(1, 0); 
  updateSetupSelectOptions(); 
  updateCost(1);
  updateCost(2);
  renderSetupBoard();
}

function updateSetupSelectOptions() {
  const names = getSetupSpecies();
  
  for (let pl = 1; pl <= 2; pl++) {
    for (let s = 0; s < 6; s++) {
      const sel = document.getElementById(`p${pl}s${s}`); 
      if (!sel) continue;
      const current = sel.value; 
      sel.innerHTML = '';
      
      const emptyOpt = document.createElement('option'); 
      emptyOpt.value = ''; 
      emptyOpt.textContent = '— empty —'; 
      sel.appendChild(emptyOpt);
      
      if (current && current !== '' && !names.includes(current) && DB[current]) {
        const opt = document.createElement('option'); 
        opt.value = current; 
        opt.textContent = `${current}${DB[current].legendary ? ' ★' : ''} (${DB[current].cost})`; 
        sel.appendChild(opt);
      }
      
      names.forEach(n => { 
        const opt = document.createElement('option'); 
        opt.value = n; 
        opt.textContent = `${n}${DB[n].legendary ? ' ★' : ''} (${DB[n].cost})`; 
        sel.appendChild(opt); 
      });
      
      if (current && [...sel.options].some(o => o.value === current)) {
        sel.value = current;
      } else {
        sel.value = '';
      }
    }
  }
}

function updateCost(pl) {
  let total = 0;
  for (let s = 0; s < 6; s++) {
    const sel = document.getElementById(`p${pl}s${s}`);
    if (sel && sel.value && DB[sel.value]) { 
      total += DB[sel.value].cost; 
    }
  }
  const d = document.getElementById(`p${pl}-cost-display`); 
  if (d) {
    d.textContent = `Total cost: ${total} / 10`; 
    d.className = 'total-cost ' + (total > 10 ? 'cost-bad' : 'cost-ok');
  }
}

function updateSetupSelectOptions() {
  const names = getSetupSpecies();
  
  for (let pl = 1; pl <= 2; pl++) {
    for (let s = 0; s < 6; s++) {
      const sel = document.getElementById(`p${pl}s${s}`); 
      if (!sel) continue;
      const current = sel.value; 
      sel.innerHTML = '';
      
      const emptyOpt = document.createElement('option'); 
      emptyOpt.value = ''; 
      emptyOpt.textContent = '— empty —'; 
      sel.appendChild(emptyOpt);
      
      // Preserve currently selected item even if filtered out visually
      if (current && current !== '' && !names.includes(current) && DB[current]) {
        const opt = document.createElement('option'); 
        opt.value = current; 
        opt.textContent = `${current}${DB[current].legendary ? ' ★' : ''} (${DB[current].cost})`; 
        sel.appendChild(opt);
      }
      
      // Populate text dropdown with Name (Cost)
      names.forEach(n => { 
        const opt = document.createElement('option'); 
        opt.value = n; 
        opt.textContent = `${n}${DB[n].legendary ? ' ★' : ''} (${DB[n].cost})`; 
        sel.appendChild(opt); 
      });
      
      if (current && [...sel.options].some(o => o.value === current)) sel.value = current; 
      else sel.value = '';
    }
  }
}

function updateCost(pl) {
  let total = 0;
  for (let s = 0; s < 6; s++) {
    const sel = document.getElementById(`p${pl}s${s}`);
    if (sel && sel.value && DB[sel.value]) { 
        total += DB[sel.value].cost; 
    }
  }
  const d = document.getElementById(`p${pl}-cost-display`); 
  if(d) {
      d.textContent = `Total cost: ${total} / 10`; 
      d.className = 'total-cost ' + (total > 10 ? 'cost-bad' : 'cost-ok');
  }
}

function updateSetupSelectOptions() {
  const names = getSetupSpecies();
  
  for (let pl = 1; pl <= 2; pl++) {
    for (let s = 0; s < 6; s++) {
      const sel = document.getElementById(`p${pl}s${s}`); 
      if (!sel) continue;
      const current = sel.value; 
      sel.innerHTML = '';
      
      const emptyOpt = document.createElement('option'); 
      emptyOpt.value = ''; 
      emptyOpt.textContent = '— empty —'; 
      sel.appendChild(emptyOpt);
      
      // Preserve currently selected item even if filtered out visually
      if (current && current !== '' && !names.includes(current) && DB[current]) {
        const opt = document.createElement('option'); 
        opt.value = current; 
        opt.textContent = `${current}${DB[current].legendary ? ' ★' : ''} (${DB[current].cost})`; 
        sel.appendChild(opt);
      }
      
      // Populate text dropdown with Name (Cost)
      names.forEach(n => { 
        const opt = document.createElement('option'); 
        opt.value = n; 
        opt.textContent = `${n}${DB[n].legendary ? ' ★' : ''} (${DB[n].cost})`; 
        sel.appendChild(opt); 
      });
      
      if (current && [...sel.options].some(o => o.value === current)) sel.value = current; 
      else sel.value = '';
    }
  }
}

function updateCost(pl) {
  let total = 0;
  for (let s = 0; s < 6; s++) {
    const sel = document.getElementById(`p${pl}s${s}`);
    if (sel && sel.value && DB[sel.value]) { 
        total += DB[sel.value].cost; 
    }
  }
  const d = document.getElementById(`p${pl}-cost-display`); 
  if(d) {
      d.textContent = `Total cost: ${total} / 10`; 
      d.className = 'total-cost ' + (total > 10 ? 'cost-bad' : 'cost-ok');
  }
}

function initSetupPositions() {
  SETUP_POSITIONS[1] = Array.from({ length: 6 }, (_, i) => ({ col: i, row: 1 })); SETUP_POSITIONS[2] = Array.from({ length: 6 }, (_, i) => ({ col: i, row: 6 }));
}

function selectSetupSlot(player, slot) {
  SETUP_SELECTED_SLOT = { player, slot };
  document.querySelectorAll('.poke-slot').forEach(el => { if (+el.dataset.player === player && +el.dataset.slot === slot) el.classList.add('selected'); else el.classList.remove('selected'); });
  renderSetupBoard();
}

function renderSetupBoard() {
  const board = document.getElementById('placement-board'); if (!board) return;
  const selected = SETUP_SELECTED_SLOT; const occupancy = {};
  for (let pl = 1; pl <= 2; pl++) {
    SETUP_POSITIONS[pl].forEach((pos, slot) => {
      const sel = document.getElementById(`p${pl}s${slot}`);
      if (!sel || !sel.value) return; occupancy[`${pos.col},${pos.row}`] = { player: pl, slot, species: sel.value };
    });
  }
  const getCellHtml = (boardOwner, col, row) => {
    const cellKey = `${col},${row}`; const occupied = occupancy[cellKey];
    const selectedPos = SETUP_POSITIONS[selected.player][selected.slot];
    const isSelectedCell = selectedPos && selectedPos.col === col && selectedPos.row === row;
    const isAllowed = (selected.player === boardOwner);
    const cellClass = ['setup-board-cell', 'allowed'];
    if (isAllowed) cellClass.push('allowed-for-selection');
    if (occupied) cellClass.push('occupied');
    if (isSelectedCell) cellClass.push('selected-cell');
    const clickAttr = isAllowed ? `onclick="setupPlacementClick(${col},${row})"` : '';
    const label = String.fromCharCode(65 + col) + (row + 1);
    let cellHtml = `<div class="${cellClass.join(' ')}" ${clickAttr}><div class="cell-label">${label}</div>`;
    const setupPeds = (typeof G !== 'undefined' && G.pedestals) ? G.pedestals : [{ player: 1, col: 3, row: 0, hp: 30 }, { player: 2, col: 4, row: 7, hp: 30 }];
    const pedHere = setupPeds.find(pd => pd.col === col && pd.row === row);
    if (occupied) {
      const occDb = DB[occupied.species];
      const occImg = (occDb && occDb.img) ? `<img src="${occDb.img}" style="width:90%; height:90%; object-fit:contain;" />` : occupied.species.substring(0, 2);
      cellHtml += `<div class="setup-token player${occupied.player}" style="display:flex; justify-content:center; align-items:center; background:none; border:none; box-shadow:none;">${occImg}</div>`;
    }

    cellHtml += '</div>'; return cellHtml;
  };
  let html = '<div style="display: flex; gap: 40px; flex-wrap: wrap; justify-content: flex-start; padding: 10px 0;"><div><div style="font-size:13px; font-weight:700; color:var(--p1); margin-bottom:8px;">Player 1 Deployment (Rows 1-2)</div><div class="setup-board-grid" style="grid-template-rows: repeat(2, 38px);">';
  for (let row = 0; row < 2; row++) { for (let col = 0; col < 8; col++) { html += getCellHtml(1, col, row); } }
  html += '</div></div><div><div style="font-size:13px; font-weight:700; color:var(--p2); margin-bottom:8px;">Player 2 Deployment (Rows 7-8)</div><div class="setup-board-grid" style="grid-template-rows: repeat(2, 38px);">';
  for (let row = 6; row < 8; row++) { for (let col = 0; col < 8; col++) { html += getCellHtml(2, col, row); } }
  html += '</div></div></div>';
  board.innerHTML = html;
}

function setupPlacementClick(col, row) {
  const player = SETUP_SELECTED_SLOT.player; const slot = SETUP_SELECTED_SLOT.slot;
  const allowed = player === 1 ? row <= 1 : row >= 6; if (!allowed) return;
  const clickedSlotIndex = SETUP_POSITIONS[player].findIndex((pos, i) => {
    if (pos.col !== col || pos.row !== row) return false;
    const sel = document.getElementById(`p${player}s${i}`);
    return sel && sel.value !== '';
  });
  if (clickedSlotIndex !== -1) { if (clickedSlotIndex !== slot) selectSetupSlot(player, clickedSlotIndex); return; }
  SETUP_POSITIONS[player][slot] = { col, row }; renderSetupBoard();
}

function updateSetupSelectOptions() {
  const names = getSetupSpecies();
  for (let pl = 1; pl <= 2; pl++) {
    for (let s = 0; s < 6; s++) {
      const sel = document.getElementById(`p${pl}s${s}`); if (!sel) continue;
      const current = sel.value; sel.innerHTML = '';
      const emptyOpt = document.createElement('option'); emptyOpt.value = ''; emptyOpt.textContent = '— empty —'; sel.appendChild(emptyOpt);
      if (current && current !== '' && !names.includes(current) && DB[current]) {
        const opt = document.createElement('option'); opt.value = current; opt.textContent = `${current}${DB[current].legendary ? ' ★' : ''} — cost ${DB[current].cost}`; sel.appendChild(opt);
      }
      names.forEach(n => { const opt = document.createElement('option'); opt.value = n; opt.textContent = `${n}${DB[n].legendary ? ' ★' : ''} — cost ${DB[n].cost}`; sel.appendChild(opt); });
      if (current && [...sel.options].some(o => o.value === current)) sel.value = current; else sel.value = '';
    }
  }
}

function updateCost(pl) {
  let total = 0;
  for (let s = 0; s < 6; s++) {
    const sel = document.getElementById(`p${pl}s${s}`);
    const badge = document.getElementById(`p${pl}b${s}`);
    if (sel.value && DB[sel.value]) { total += DB[sel.value].cost; badge.textContent = `cost ${DB[sel.value].cost}`; } else badge.textContent = '—';
  }
  const d = document.getElementById(`p${pl}-cost-display`); d.textContent = `Total cost: ${total} / 10`; d.className = 'total-cost ' + (total > 10 ? 'cost-bad' : 'cost-ok');
}

function resetGame() { newGame(); if (document.getElementById('shop-overlay')) document.getElementById('shop-overlay').style.display = 'none'; showScreen('setup'); }
window.addEventListener('DOMContentLoaded', buildSetup);

function rollD20(bonus = 0) { return Math.floor(Math.random() * 20) + 1 + bonus; }
function checkCritical(attacker) {
  const db = DB[attacker.species]; if (!db) return false;
  const hasCritAbility = ['Sniper', 'Super Luck'].includes(db.ability);
  const hasCritItem = attacker.modifiers && attacker.modifiers.includes('Scope Lens');
  if (hasCritAbility || hasCritItem) {
    const rollResult = rollD20();
    if (rollResult >= 16) { log(`🎯 Critical Hit! ของ ${attacker.species} ทำงาน!`, 'combat'); return true; }
  }
  return false;
}

function buyItem(itemName) {
  const item = ITEMS[itemName];
  if (!item) return;
  if (G.gold[G.cur] < item.cost) { log("Not enough gold to buy " + itemName, "sys"); return; }
  G.gold[G.cur] -= item.cost;
  G.inventory[G.cur][item.type].push(itemName);
  log(`Purchased ${itemName} (Sent to Inventory).`, "sys");
  renderAll();
  if (G.shopOpen) renderItemShop();
}

function unequipItem(pokemonId) {
  const p = G.pokemon.find(x => x.id === pokemonId);
  if (!p || !p.heldItem || p.player !== G.cur) return;
  G.inventory[G.cur].held.push(p.heldItem);
  log(`Unequipped ${p.heldItem} from ${p.species}.`, "sys");
  p.heldItem = null;
  renderAll();
}
