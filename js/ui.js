// =========================================================================
// POKEMON CHESS - UI.JS (CLEANED & FIXED VERSION)
// Handles Board Rendering, Panel Tabs, and Premium Shop Layout
// =========================================================================

function renderBoard() {
  const cl = document.getElementById('col-labels');
  if (cl) cl.innerHTML = 'ABCDEFGH'.split('').map(c => `<span>${c}</span>`).join('');
  const br = document.getElementById('board-rows'); 
  if (!br) return;
  br.innerHTML = '';
  const hlMap = {}; G.hlCells.forEach(c => { hlMap[c.col + ',' + c.row] = c.type; });
  if (!G.actionMode) {
    (G.previewSkillCells || []).forEach(c => { const k = c.col + ',' + c.row; if (!hlMap[k]) hlMap[k] = 'skill-preview'; });
    (G.previewAtkCells || []).forEach(c => { const k = c.col + ',' + c.row; if (!hlMap[k]) hlMap[k] = 'atk-preview'; });
  }
  const selTargets = {};
  if (G.actionMode && G.actionMode.targets) { G.actionMode.targets.forEach(t => { selTargets[t.col + ',' + t.row] = true; }); }
  const selKey = G.selectedCell ? G.selectedCell.col + ',' + G.selectedCell.row : null;
  for (let row = 0; row < 8; row++) {
    const rEl = document.createElement('div'); rEl.className = 'board-row';
    const lbl = document.createElement('span'); lbl.className = 'row-label'; lbl.textContent = row + 1;
    rEl.appendChild(lbl);
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell ' + ((col + row) % 2 === 0 ? 'light' : 'dark');
      const pd2 = ped(col, row);
      if (pd2) cell.classList.add('pedestal-p' + pd2.player);
      const hl = hlMap[col + ',' + row];
      if (hl === 'move') cell.classList.add('hl-move');
      if (hl === 'atk') cell.classList.add('hl-atk');
      if (hl === 'atk-preview') cell.classList.add('hl-atk-preview');
      if (hl === 'skill-preview') cell.classList.add('hl-skill-preview');
      if (selTargets[col + ',' + row]) cell.classList.add('hl-selected');
      if (selKey === col + ',' + row) cell.classList.add('selected');
      cell.onclick = () => cellClick(col, row);
      if (pd2) {
        const pt = document.createElement('div'); pt.className = 'ped-token p' + pd2.player;
        pt.innerHTML = `<span style="font-size:7px;font-weight:700;line-height:1.2">P${pd2.player}<br>${pd2.hp}HP</span>`;
        cell.appendChild(pt);
      }
      const p = pk(col, row);
      if (p) {
        const db = DB[p.species];
        const tok = document.createElement('div');
        tok.className = 'token p' + p.player + (p.fainted ? ' fainted' : '');
        const pct = Math.round(p.hp / p.maxHp * 100);
        const barCls = pct < 25 ? 'low' : pct < 50 ? 'mid' : '';
        const heldIndicator = p.heldItem ? `<span class="held-icon" style="z-index:4;">🛡️</span>` : '';
        
        const imgHtml = db && db.img ? `<img src="${db.img}" style="width:85%; height:85%; object-fit:contain; z-index:1; pointer-events:none; filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.4));" />` : `<span style="font-size:7px;font-weight:700;z-index:1">${p.species.substring(0, 3).toUpperCase()}</span>`;
        const hpBadge = `<div style="position:absolute; bottom:-4px; right:-4px; font-size:9px; font-weight:900; background:rgba(0,0,0,0.85); color:white; padding:1px 4px; border-radius:6px; z-index:3; border: 1px solid rgba(255,255,255,0.3);">${p.hp}</div>`;

        tok.innerHTML = `${imgHtml}${hpBadge}<div class="hp-bar ${barCls}" style="width:${pct}%"></div>${heldIndicator}`;
        cell.appendChild(tok);
      }
      rEl.appendChild(cell);
    }
    br.appendChild(rEl);
  }
}

function renderHeader() {
  const tl = document.getElementById('turn-label');
  if (tl) {
    tl.textContent = `Player ${G.cur}'s turn`;
    tl.style.color = G.cur === 1 ? 'var(--p1)' : 'var(--p2)';
  }
  const pl = document.getElementById('phase-label');
  if (pl) pl.textContent = `Turn ${G.turn} · Phase ${G.phase}`;
  const gl = document.getElementById('gold-label');
  if (gl) gl.textContent = `Gold: ${G.gold[G.cur]}`;
  const wl = document.getElementById('weather-label');
  if (wl) wl.textContent = `Weather: ${getWeatherLabel()}`;
  
  const detail = document.getElementById('header-detail');
  if (detail) {
    if (G.headerDetailMode) {
      detail.style.display = 'block';
      detail.innerHTML = G.headerDetailMode === 'phase' ? getPhaseInfo() : getGoldInfo();
    } else {
      detail.style.display = 'none';
    }
  }
  const eb = document.getElementById('energy-stars'); 
  if (eb) {
    eb.innerHTML = '';
    for (let i = 0; i < G.maxE[G.cur]; i++) {
      const s = document.createElement('div'); s.className = 'star' + (i < G.energy[G.cur] ? ' on' : ''); eb.appendChild(s);
    }
  }
}

function getPokemonDisplayName(p) { return p.species + (p.isEgg && !p.hasHatched ? ' (Egg)' : ''); }

function toggleSkillMenu(id) {
  G.skillMenuFor = G.skillMenuFor === id ? null : id;
  if (G.actionMode && G.actionMode.type === 'skill' && G.actionMode.poke && G.actionMode.poke.id !== id) {
    clearHL();
  }
  renderAll();
}

function getHumanDirText(dirs) {
  if (!dirs || dirs.length === 0) return 'forward';
  const sorted = [...dirs].sort((a, b) => a - b).join(',');
  if (sorted === '1,2,3,4') return 'in all four directions';
  if (sorted === '1,3') return 'in a vertical line';
  if (sorted === '2,4') return 'sideways';
  if (sorted === '3') return 'forward';
  if (sorted === '1') return 'backward';
  return 'in the highlighted directions';
}

function getHumanAreaText(radius) {
  const size = radius * 2 + 1;
  return `around the unit in a ${size}x${size} area`;
}

function describeSkillRange(skill) {
  const desc = skill?.skillDesc || '';
  if (!desc) return 'Uses the default highlighted tiles.';
  if (desc === 'Self') return 'Targets only the user.';
  if (desc === 'Ally') return 'Targets one allied unit in the highlighted tiles.';
  if (desc === 'AllAllies') return 'Affects all allied units on the board.';

  const targetBlock = desc.match(/Target\s*=\s*\[(\d+)\((.+)\)\]/i);
  let targetText = '';
  let inner = desc;
  if (targetBlock) {
    targetText = `Choose up to ${targetBlock[1]} targets. `;
    inner = targetBlock[2];
  }

  const parts = inner.split('+').map(s => s.trim()).filter(Boolean);
  const humanParts = parts.map(part => {
    let m = part.match(/Line\((\d+)\)\(([0-9,]+)\)/i);
    if (m) return `hits in a straight line up to ${m[1]} tile${m[1] === '1' ? '' : 's'} ${getHumanDirText(m[2].split(',').map(Number))}`;
    m = part.match(/Cone\((\d+)\)(?:\(([0-9,]+)\))?/i);
    if (m) return `hits a cone up to ${m[1]} tile${m[1] === '1' ? '' : 's'} ${getHumanDirText((m[2] || '3').split(',').map(Number))}`;
    m = part.match(/AoE\((\d+)\)/i);
    if (m) return `hits ${getHumanAreaText(+m[1])}`;
    return `uses the highlighted pattern: ${part}`;
  });

  return targetText + humanParts.join(', then ');
}

function getSkillChanceHtml(db) {
  if (!db) return '';
  if (db.statusChance) {
    const value = Math.round(getStatusChanceValue(db.statusChance, db) * 100);
    return `<div style="font-size:11px; margin-top:4px; color:#c77dff;"><strong>${db.statusChance}:</strong> ${value}% chance</div>`;
  }
  return '';
}

function renderFieldTracker() {
  const el = document.getElementById('field-tracker'); if (!el) return;
  const team1 = G.pokemon.filter(p => p.player === 1).sort((a, b) => a.col !== b.col ? a.col - b.col : a.row - b.row);
  const team2 = G.pokemon.filter(p => p.player === 2).sort((a, b) => a.col !== b.col ? a.col - b.col : a.row - b.row);
  const maxLen = Math.max(team1.length, team2.length, 1);
  let cols = '';
  for (let i = 0; i < maxLen; i++) { cols += `<div class="ft-col">${renderFieldTrackerSlot(team1[i] || null, 1)}${renderFieldTrackerSlot(team2[i] || null, 2)}</div>`; }
  el.innerHTML = `<div class="ft-title">Field Tracker</div><div class="ft-row">${cols}</div>`;
}

function renderFieldTrackerSlot(p, player) {
  const pColor = player === 1 ? 'var(--p1)' : 'var(--p2)';
  if (!p) return `<div class="ft-slot ft-empty"><div class="ft-header"><span class="ft-player" style="color:${pColor}">P${player}</span></div><div class="ft-nameline" style="color:#aaa;font-weight:400">empty</div></div>`;
  
  const pct = Math.round(p.hp / p.maxHp * 100);
  const barColor = p.fainted ? '#ccc' : pct < 25 ? '#E24B4A' : pct < 50 ? '#EF9F27' : '#3B6D11';
  const eggTag = (p.isEgg && !p.hasHatched) ? `<span class="ft-egg-tag">egg</span>` : '';
  const shortName = p.species.length > 8 ? p.species.substring(0, 7) + '…' : p.species;
  
  const miniImg = DB[p.species]?.img ? `<img src="${DB[p.species].img}" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;margin-right:4px;">` : '';
  const statusIcons = { burn: '🔥 Burn', freeze: '❄️ Freeze', poison: '☠️ Poison', sleep: '💤 Sleep', paralysis: '⚡ Paralysis', confuse: '💫 Confuse', toxic: '☣️ Toxic' };
  const statusLine = p.status ? `<div style="font-size:10px; font-weight:800; color:${SCOL[p.status] || '#888'}; margin-bottom:3px; text-transform:uppercase;">${statusIcons[p.status] || p.status}</div>` : '';

  return `<div class="ft-slot${p.fainted ? ' ft-fainted' : ''}">
    <div class="ft-header"><span class="ft-player" style="color:${pColor}">P${player}</span></div>
    <div class="ft-nameline">${miniImg}${shortName}${eggTag}</div>
    ${statusLine}
    <div class="ft-hp" style="margin-top:0;">${p.fainted ? 'K.O.' : `${p.hp}/${p.maxHp}`}</div>
    <div class="ft-bar-bg"><div class="ft-bar-fill" style="width:${p.fainted ? 0 : pct}%;background:${barColor}"></div></div>
  </div>`;
}

function canAllocateExpTo(p) {
  const db = DB[p.species];
  if (p.isEgg) { const cost = db?.hatchCost || 30; const grp = db?.hatchGroup; const pool = grp ? (G.hatchPools[p.player][grp] || 0) : (p.hatchProgress || 0); return pool < cost; }
  return Boolean(db?.evoCost && (p.exp || 0) < db.evoCost);
}

function getPhaseInfo() {
  const phaseText = { 1: 'Phase 1: Early game. Standard energy and slow board development.', 2: 'Phase 2: Midgame. More aggressive board pressure and stable gold pacing.', 3: 'Phase 3: Late midgame. Gold payout increases and energy can reach 5 soon.', 4: 'Phase 4: Endgame prep. High energy and strong boards; avoid losing tempo.', 5: 'Phase 5: Final stage. Highest payouts and decisive attacks; protect your lead.' };
  const nextPhase = G.phase < 5 ? `Next phase starts at turn ${G.phase === 1 ? 11 : G.phase === 2 ? 21 : G.phase === 3 ? 31 : G.phase === 4 ? 41 : 0}.` : 'No further phases.';
  const nextEnergy = G.phase === 1 ? 'Max energy rises to 4 at turn 10.' : G.phase === 2 ? 'Max energy rises to 5 at turn 30.' : '';
  const goldSchedule = 'Gold payouts: +5 at turns 1,6,11,16; +6 at turns 21,26,31,36; +7 at turn 41.';
  return `<div><strong>${phaseText[G.phase]}</strong></div><div style="margin-top:6px">${nextPhase}</div><div style="margin-top:4px">${nextEnergy}</div><div style="margin-top:4px">${goldSchedule}</div>`;
}
function getGoldInfo() { return `<div><strong>Player 1:</strong> ${G.gold[1]} gold · Free EXP ${G.freeExp[1] || 0}</div><div style="margin-top:4px"><strong>Player 2:</strong> ${G.gold[2]} gold · Free EXP ${G.freeExp[2] || 0}</div><div style="margin-top:6px;color:var(--txt2);font-size:11px">Click gold again to hide this summary.</div>`; }
function togglePhaseInfo() { const detail = document.getElementById('header-detail'); if (G.headerDetailMode === 'phase') { G.headerDetailMode = null; detail.style.display = 'none'; } else { G.headerDetailMode = 'phase'; detail.style.display = 'block'; detail.innerHTML = getPhaseInfo(); } }
function toggleGoldInfo() { const detail = document.getElementById('header-detail'); if (G.headerDetailMode === 'gold') { G.headerDetailMode = null; detail.style.display = 'none'; } else { G.headerDetailMode = 'gold'; detail.style.display = 'block'; detail.innerHTML = getGoldInfo(); } }

function renderInfo() {
  const area = document.getElementById('poke-info-area');
  if (!area) return;
  if (!G.selectedCell) { area.innerHTML = '<p style="color:#aaa;font-size:12px;text-align:center;padding:20px 0">Tap a Pokemon to select</p>'; return; }
  const { col, row } = G.selectedCell;
  const pd2 = ped(col, row);
  if (pd2) {
    const pct = Math.round(pd2.hp / 30 * 100);
    area.innerHTML = `<div class="poke-info-card"><div class="poke-info-name">Player ${pd2.player} Pedestal</div><div style="font-size:11px;color:var(--txt2);margin-bottom:8px">${String.fromCharCode(65 + pd2.col)}${pd2.row + 1} · ${pd2.hp}/30 HP</div><div class="hp-track-bar"><div class="hp-track-fill ${pct < 33 ? 'low' : pct < 66 ? 'mid' : ''}" style="width:${pct}%"></div></div></div>`;
    return;
  }
  const p = pk(col, row);
  if (!p) { area.innerHTML = '<p style="color:#aaa;font-size:12px;text-align:center;padding:20px 0">Empty cell</p>'; return; }

  const db = DB[p.species];
  const pct = Math.round(p.hp / p.maxHp * 100);
  const isActive = p.player === G.cur && !p.fainted;
  const canMove = isActive && G.energy[G.cur] >= 1;
  const canAtk = isActive && G.energy[G.cur] >= 1;
  const sc = db ? (db.skillCost || 2) : 2;
  const skillList = db && Array.isArray(db.skills) && db.skills.length > 0 ? db.skills : [{ skillName: db?.skillName, skillDesc: db?.skillDesc, skillRaw: db?.skillRaw, skillCost: db?.skillCost, statusChance: db?.statusChance, statusChanceValue: db?.statusChanceValue, skillEffect: db?.skillEffect, skillHeal: db?.skillHeal }];
  const selectedSkillIdx = G.actionMode && G.actionMode.type === 'skill' && G.actionMode.poke && G.actionMode.poke.id === p.id ? (G.actionMode.skillIdx || 0) : 0;
  const displaySkillObj = skillList[selectedSkillIdx] || skillList[0] || null;
  const multiSkillOpen = G.skillMenuFor === p.id;
  const skillSelected = G.actionMode && G.actionMode.type === 'skill' && G.actionMode.poke && G.actionMode.poke.id === p.id;

  const moveBtn = `<button class="act-btn${canMove ? '' : ' disabled'}" onclick="${canMove ? `selectAction('move',${p.id})` : ''}" style="background:${canMove ? '#EF9F2722' : ''}">Move<br><span style="font-size:9px;opacity:0.7">1 ⚡</span></button>`;
  const atkBtn = `<button class="act-btn${canAtk ? '' : ' disabled'}" onclick="${canAtk ? `selectAction('attack',${p.id})` : ''}" style="background:${canAtk ? '#E24B4A22' : ''}">Attack<br><span style="font-size:9px;opacity:0.7">1 ⚡</span></button>`;

  let skillHtml = '';
  if (db && skillList.length > 1) {
    const childButtons = skillList.map((sk, idx) => {
      const cost = sk.skillCost || db.skillCost || 2;
      const canUse = isActive && G.energy[G.cur] >= cost;
      const isChosen = skillSelected && selectedSkillIdx === idx;
      const isConfirming = G.actionMode && G.actionMode.confirmingIdx === idx;
      const btnStyle = isConfirming ? '#EF9F27' : (isChosen ? '#6C59E6' : (canUse ? '#534AB722' : ''));
      const extraCSS = isConfirming ? '; color: white; border: 1px solid #D85A30' : '';
      const nameText = isConfirming ? 'Click to Cast!' : (sk.skillName || `Skill ${idx + 1}`);

      return `<button class="act-btn${canUse ? '' : ' disabled'}${isChosen ? ' selected' : ''}" onclick="${canUse ? `selectAction('skill',${p.id},${idx})` : ''}" style="background:${btnStyle}${extraCSS}">Skill ${idx + 1}<br><span style="font-size:9px;opacity:0.7">${nameText} · ${cost} ⚡</span></button>`;
    }).join('');
    skillHtml = `<div class="skill-tree" style="flex:1.45"><button class="act-btn${isActive ? '' : ' disabled'}${(multiSkillOpen || skillSelected) ? ' selected' : ''}" onclick="${isActive ? `toggleSkillMenu(${p.id})` : ''}" style="background:${(multiSkillOpen || skillSelected) ? '#6C59E6' : (isActive ? '#534AB722' : '')}">Skills<br><span style="font-size:9px;opacity:0.7">${displaySkillObj?.skillName || 'Choose skill'}</span></button><div class="skill-children${multiSkillOpen ? ' open' : ''}">${childButtons}</div></div>`;
  } else {
    const sk = skillList[0] || {};
    const cost = sk.skillCost || (db ? db.skillCost : 2) || 2;
    const canUseFinal = isActive && G.energy[G.cur] >= sc;
    const isConfirming = G.actionMode && G.actionMode.confirmingIdx === 0;
    const btnStyle = isConfirming ? '#EF9F27' : (skillSelected ? '#6C59E6' : (canUseFinal ? '#534AB722' : ''));
    const extraCSS = isConfirming ? '; color: white; border: 1px solid #D85A30' : '';
    const nameText = isConfirming ? 'Click to Cast!' : (sk.skillName || 'Skill');

    skillHtml = `<button class="act-btn${canUseFinal ? '' : ' disabled'}${skillSelected ? ' selected' : ''}" onclick="${canUseFinal ? `selectAction('skill',${p.id},0)` : ''}" style="background:${btnStyle}${extraCSS}">${nameText}<br><span style="font-size:9px;opacity:0.7">${cost} ⚡</span></button>`;
  }

  const canAlloc = isActive && G.freeExp[G.cur] > 0 && canAllocateExpTo(p);
  const expBtn = `<button class="act-btn${canAlloc ? '' : ' disabled'}" onclick="${canAlloc ? `allocateExp(${p.id})` : ''}" style="background:${canAlloc ? '#3B6D1122' : ''}">+1 EXP<br><span style="font-size:9px;opacity:0.7">Pool: ${G.freeExp[G.cur]}</span></button>`;
  const displayName = getPokemonDisplayName(p);
  const pendingLabel = getPokemonPendingLabel(p);
  const spriteHtml = db && db.img ? `<img src="${db.img}" alt="${displayName}" style="width:64px;height:64px;object-fit:contain;image-rendering:auto;flex-shrink:0" />` : '';
  const abilityText = db && db.ability ? `${db.ability}${db.abilityDesc ? ` - ${db.abilityDesc}` : ''}` : 'None';
  const actionsHtml = `<div class="actions-row">${moveBtn}${atkBtn}${skillHtml}${expBtn}</div>`;
  const moveName = displaySkillObj ? (displaySkillObj.skillName || db?.skillName) : (db?.skillName || 'Skill');
  const moveDesc = displaySkillObj ? (displaySkillObj.skillRaw || displaySkillObj.skillDesc || db?.skillDesc) : (db?.skillRaw || db?.skillDesc || '');
  const moveRangeDesc = describeSkillRange(displaySkillObj || db);

  const heldDisplay = p.heldItem
    ? `<span class="stat-lbl">Held Item</span><span class="stat-val" style="color:#d4af37;cursor:pointer" onclick="unequipItem(${p.id})">${p.heldItem} <small style="color:red">(Unequip)</small></span>`
    : `<span class="stat-lbl">Held Item</span><span class="stat-val" style="color:#aaa">None</span>`;

  area.innerHTML = `<div class="poke-info-card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
      <div style="display:flex;gap:10px;align-items:flex-start">
        ${spriteHtml}
        <div><div class="poke-info-name">${displayName}</div>
        <div style="font-size:11px;color:${p.player === 1 ? 'var(--p1)' : 'var(--p2)'};margin-top:1px">Player ${p.player} · ${String.fromCharCode(65 + p.col)}${p.row + 1} · ${db ? db.cls : ''}</div></div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px"><span class="stat-lbl">HP</span><span class="stat-val">${p.hp} / ${p.maxHp}</span></div>
    <div class="hp-track-bar" style="margin-bottom:8px"><div class="hp-track-fill ${pct < 25 ? 'low' : pct < 50 ? 'mid' : ''}" style="width:${pct}%"></div></div>
    <div class="stat-row"><span class="stat-lbl">EXP</span><span class="stat-val">${getPokemonExpText(p)}</span></div>
    <div class="stat-row">${heldDisplay}</div>
    ${(() => {
      const statusIcons = { burn: '🔥 Burn', freeze: '❄️ Freeze', poison: '☠️ Poison', sleep: '💤 Sleep', paralysis: '⚡ Paralysis', confuse: '💫 Confuse', toxic: '☣️ Toxic' };
      const statusText = p.status ? `<span style="font-weight:bold; color:var(--p2)">${statusIcons[p.status] || p.status}</span>` : '<span style="color:#aaa">None</span>';
      
      const atkTotal = getModifiedStat(p, 'atk');
      const defTotal = getModifiedStat(p, 'def');
      const atkBase = db ? (db.atk || 0) : 0;
      const defBase = db ? (typeof p.def === 'number' ? p.def : (db.def || 0)) : 0;

      return `
        <div class="stat-row">
          <span class="stat-lbl">Status</span>
          <span class="stat-val">${statusText}</span>
        </div>
        <div class="stat-row">
          <span class="stat-lbl">Mods</span>
          <span class="stat-val">${renderModifiers(p)}</span>
        </div>
        ${pendingLabel ? `<div class="stat-row"><span class="stat-lbl">Event</span><span class="stat-val" style="color: #BA7517">${pendingLabel}</span></div>` : ''}
        
        <div class="stat-row" style="cursor:pointer; background: #eaf1f8; padding: 4px; border-radius: 4px;" onclick="const b = document.getElementById('stat-breakdown-${p.id}'); b.style.display = b.style.display === 'none' ? 'block' : 'none';">
          <span class="stat-lbl">Stats</span>
          <span class="stat-val" style="color:var(--p1); font-weight:bold; display:flex; justify-content:space-between; width:100%;">
            <span>Atk ${atkTotal} | Def ${defTotal}</span>
            <small style="opacity:0.7">▼ Click</small>
          </span>
        </div>
        
        <div id="stat-breakdown-${p.id}" style="display:none; background:#f0f0ee; border-radius:4px; padding:8px; font-size:11px; margin-bottom:6px; border: 1px solid #ddd;">
          <div style="margin-bottom:6px;">
            <b>Attack Breakdown:</b><br> 
            Base: ${atkBase} ${atkTotal !== atkBase ? `<span style="color:var(--p1)">| Modifiers: ${atkTotal - atkBase > 0 ? '+' : ''}${atkTotal - atkBase}</span>` : ''}
          </div>
          <div>
            <b>Defense Breakdown:</b><br> 
            Base: ${defBase} ${defTotal !== defBase ? `<span style="color:var(--p1)">| Modifiers: ${defTotal - defBase > 0 ? '+' : ''}${defTotal - defBase}</span>` : ''}
          </div>
          <div style="color:#888; font-size:9px; margin-top:4px; border-top: 1px solid #ddd; padding-top:4px;">Includes buffs, debuffs, and held items.</div>
        </div>
      `;
    })()}
    <div class="stat-row"><span class="stat-lbl">Ability</span><span class="stat-val">${abilityText}</span></div>
    ${(isActive ? actionsHtml : '')}</div>
    <div class="move-card"><div class="move-name">${moveName}</div><div class="move-sub">${moveDesc}</div><div class="move-sub" style="margin-top:6px">Pattern: ${moveRangeDesc}</div>${getSkillChanceHtml(displaySkillObj || db)}</div>`;
}

function renderTeams() {
  const el = document.getElementById('tab-teams'); if (!el || el.style.display === 'none') return;
  let html = '';
  for (let pl = 1; pl <= 2; pl++) {
    const pd2 = G.pedestals.find(p => p.player === pl);
    html += `<div style="margin-bottom:10px"><div style="font-weight:600;font-size:13px;color:${pl === 1 ? 'var(--p1)' : 'var(--p2)'};margin-bottom:5px">Player ${pl} · ${G.gold[pl]} gold · Pedestal ${pd2 ? pd2.hp : 0}/30 HP</div>`;
    G.pokemon.filter(p => p.player === pl).forEach(p => {
      const db = DB[p.species]; const pct = Math.round(p.hp / p.maxHp * 100); const name = getPokemonDisplayName(p);
      html += `<div style="display:flex;align-items:center;gap:7px;padding:4px 0;border-bottom:1px solid #f0f0ee;opacity:${p.fainted ? 0.38 : 1}"><div style="width:7px;height:7px;border-radius:50%;background:${p.fainted ? '#ccc' : (db ? db.color : '#888')};flex-shrink:0"></div><div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600">${name}</div></div><div style="width:54px"><div style="font-size:10px;text-align:right;color:#888">${p.fainted ? 'KO' : `${p.hp}/${p.maxHp}`}</div><div style="height:4px;background:#eee;border-radius:2px;overflow:hidden;margin-top:2px"><div style="width:${pct}%;height:100%;background:${pct < 25 ? '#E24B4A' : pct < 50 ? '#EF9F27' : '#3B6D11'};border-radius:2px"></div></div></div></div>`;
    });
    html += '</div>';
  }
  el.innerHTML = html;
}

function renderAll() { renderBoard(); renderHeader(); renderInfo(); renderTeams(); renderFieldTracker(); }

function switchTab(tab, el) {
  document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['info', 'teams', 'log'].forEach(t => { 
    const element = document.getElementById('tab-' + t);
    if (element) element.style.display = t === tab ? 'block' : 'none'; 
  });
  if (tab === 'teams') renderTeams();
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const element = document.getElementById('screen-' + id);
  if (element) element.classList.add('active');
}

// =========================================================================
// ✨ PREMIUM SHOP UI (Horizontal Layout & Deep Categorize)
// =========================================================================
let shopMainTab = 'held';
let shopSubTab = 'All';

function getItemStyleConfig(category, type) {
  if (type === 'consumable' || category === 'Consumable') {
    return { color: '#e67e22', bg: '#fef5ec', label: 'Consumable' };
  }
  switch (category) {
    case 'Offense': return { color: '#C0392B', bg: '#FDEDEC', label: 'Held Item · Offense' };
    case 'Defense': return { color: '#2980B9', bg: '#EBF5FB', label: 'Held Item · Defense' };
    case 'Utility': return { color: '#8E44AD', bg: '#F5EEF8', label: 'Held Item · Utility' };
    default: return { color: '#7F8C8D', bg: '#F8F9F9', label: 'Held Item' };
  }
}

function renderItemShop() {
  const shopContainer = document.getElementById('shop-grid');
  if (!shopContainer) return;

  let html = `
    <div class="shop-filter-bar" style="margin-bottom: 12px; display: flex; gap: 10px; justify-content: center; width: 100%; grid-column: span 4;">
      <button onclick="setShopMainTab('held')" class="${shopMainTab === 'held' ? 'active' : ''}" style="flex: 1; padding: 10px 0; font-size: 13px;">Held Items</button>
      <button onclick="setShopMainTab('consumable')" class="${shopMainTab === 'consumable' ? 'active' : ''}" style="flex: 1; padding: 10px 0; font-size: 13px;">Consumables</button>
    </div>
  `;

  if (shopMainTab === 'held') {
    html += `
      <div class="shop-filter-bar sub-filters" style="margin-bottom: 18px; display: flex; gap: 8px; justify-content: center; width: 100%; grid-column: span 4;">
        <button onclick="setShopSubTab('All')" class="${shopSubTab === 'All' ? 'active' : ''}" style="padding: 6px 16px; font-size: 11px;">All</button>
        <button onclick="setShopSubTab('Offense')" class="${shopSubTab === 'Offense' ? 'active' : ''}" style="padding: 6px 16px; font-size: 11px;">Offense</button>
        <button onclick="setShopSubTab('Defense')" class="${shopSubTab === 'Defense' ? 'active' : ''}" style="padding: 6px 16px; font-size: 11px;">Defense</button>
        <button onclick="setShopSubTab('Utility')" class="${shopSubTab === 'Utility' ? 'active' : ''}" style="padding: 6px 16px; font-size: 11px;">Utility</button>
      </div>
    `;
  }

  html += `<div class="items-list-container" style="display: flex; flex-direction: column; gap: 10px; max-height: 380px; overflow-y: auto; padding-right: 6px; width: 100%; grid-column: span 4;">`;

  let matchCount = 0;
  Object.keys(ITEMS).forEach(itemKey => {
    const item = ITEMS[itemKey];

    if (shopMainTab === 'held' && item.type !== 'held') return;
    if (shopMainTab === 'consumable' && item.type !== 'consumable') return;
    if (shopMainTab === 'held' && shopSubTab !== 'All' && item.category !== shopSubTab) return;

    matchCount++;
    const cs = getItemStyleConfig(item.category, item.type);
    const hasGold = G.gold[G.cur] >= item.cost;

    html += `
      <div class="shop-horizontal-card" style="display: flex; align-items: center; border: 1px solid #e1e0da; border-radius: 10px; background: #fff; padding: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.04);">
        <div style="background: ${cs.bg}; border: 1px solid ${cs.color}22; border-radius: 8px; padding: 10px; display: flex; align-items: center; justify-content: center; min-width: 64px; height: 64px; flex-shrink: 0; margin-right: 14px;">
          <img src="${item.img}" alt="${item.name}" style="width: 42px; height: 42px; image-rendering: pixelated; object-fit: contain;" />
        </div>
        <div style="flex: 1; text-align: left; padding-right: 12px; min-width: 0;">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="font-weight: 700; font-size: 15px; color: #1a1a1a;">${item.name}</span>
            <span style="font-size: 9px; font-weight: 700; background: ${cs.bg}; color: ${cs.color}; padding: 2px 7px; border-radius: 4px; border: 1px solid ${cs.color}33; text-transform: uppercase;">${cs.label}</span>
          </div>
          <div style="font-size: 12px; color: #555; margin-top: 5px; line-height: 1.45; word-wrap: break-word;">${item.desc}</div>
        </div>
        <div style="text-align: right; min-width: 100px; padding-left: 14px; border-left: 1px solid #eae9e4; flex-shrink: 0;">
          <div style="color: #bfa128; font-weight: 800; font-size: 14px; margin-bottom: 6px; letter-spacing: 0.3px;">${item.cost} GOLD</div>
          <button onclick="buyItem('${item.name}')" 
                  class="${hasGold ? '' : 'disabled'}"
                  style="background: ${hasGold ? '#1E5631' : '#ccc'}; color: white; border: none; padding: 7px 0; border-radius: 6px; width: 100%; font-size: 12px; font-weight: 700; cursor: ${hasGold ? 'pointer' : 'not-allowed'}; box-shadow: 0 2px 4px rgba(0,0,0,0.15); transition: background 0.2s;">
            Buy
          </button>
        </div>
      </div>
    `;
  });

  if (matchCount === 0) {
    html += `<p style="text-align:center; padding: 40px 0; color:#888; font-style: italic; width:100%;">No items available in this category.</p>`;
  }

  html += `</div>`;
  shopContainer.innerHTML = html;
}

function setShopMainTab(tab) { shopMainTab = tab; shopSubTab = 'All'; renderItemShop(); }
function setShopSubTab(tab) { shopSubTab = tab; renderItemShop(); }

function toggleShop() {
  const overlay = document.getElementById('shop-overlay');
  if (!overlay) return;
  G.shopOpen = !G.shopOpen;
  overlay.style.display = G.shopOpen ? 'flex' : 'none';
  if (G.shopOpen) renderItemShop();
}

// =========================================================================
// ✨ PREMIUM INVENTORY UI (Horizontal Shop-Matching Layout)
// =========================================================================
let currentInvTab = 'held';

function renderInventory() {
  const container = document.getElementById('inventory-grid');
  if (!container) return;

  let html = `
    <div class="shop-filter-bar" style="margin-bottom: 18px; display: flex; gap: 10px; justify-content: center; width: 100%; grid-column: span 4;">
      <button onclick="setInvTab('held')" class="${currentInvTab === 'held' ? 'active' : ''}" style="flex: 1; padding: 10px 0; font-size: 13px;">Held Items</button>
      <button onclick="setInvTab('consumable')" class="${currentInvTab === 'consumable' ? 'active' : ''}" style="flex: 1; padding: 10px 0; font-size: 13px;">Consumables</button>
    </div>
  `;

  html += `<div class="items-list-container" style="display: flex; flex-direction: column; gap: 10px; max-height: 380px; overflow-y: auto; padding-right: 6px; width: 100%; grid-column: span 4;">`;

  const myItems = G.inventory[G.cur][currentInvTab];

  if (!myItems || myItems.length === 0) {
    html += `
        <div style="text-align:center; padding: 50px 0; color:#999; width:100%; border: 2px dashed #e1e0da; border-radius: 10px; background: #fafafa; box-sizing: border-box;">
          <span style="font-size: 28px; display:block; margin-bottom: 8px;">📦</span>
          <p style="font-size:12px; font-weight:600; color:#666;">Your inventory in this category is empty.</p>
          <p style="font-size:11px; color:#aaa; margin-top:2px;">You can purchase stat-boosting modifiers from the Shop.</p>
        </div>`;
  } else {
    myItems.forEach((itemName) => {
      const item = ITEMS[itemName];
      if (!item) return;

      const cs = getItemStyleConfig(item.category, item.type);
      const btnColor = currentInvTab === 'held' ? '#185FA5' : '#D35400';
      const btnLabel = currentInvTab === 'held' ? 'Equip' : 'Use Item';
      const badgeLabel = item.type === 'consumable' ? 'Consumable' : item.category;

      html += `
          <div class="shop-horizontal-card" style="display: flex; align-items: center; border: 1px solid #e1e0da; border-radius: 10px; background: #fff; padding: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); box-sizing: border-box;">
            <div style="background: ${cs.bg}; border: 1px solid ${cs.color}22; border-radius: 8px; padding: 10px; display: flex; align-items: center; justify-content: center; min-width: 64px; height: 64px; flex-shrink: 0; margin-right: 14px; box-sizing: border-box;">
              <img src="${item.img}" alt="${item.name}" style="width: 42px; height: 42px; image-rendering: pixelated; object-fit: contain;" />
            </div>
            
            <div style="flex: 1; text-align: left; padding-right: 12px; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span style="font-weight: 700; font-size: 15px; color: #1a1a1a;">${item.name}</span>
                <span style="font-size: 9px; font-weight: 700; background: ${cs.bg}; color: ${cs.color}; padding: 2px 7px; border-radius: 4px; border: 1px solid ${cs.color}33; text-transform: uppercase;">${badgeLabel}</span>
              </div>
              <div style="font-size: 12px; color: #555; margin-top: 5px; line-height: 1.45; word-wrap: break-word;">${item.desc}</div>
            </div>
            
            <div style="text-align: right; min-width: 100px; padding-left: 14px; border-left: 1px solid #eae9e4; flex-shrink: 0;">
              <button onclick="useItemAction('${item.name}', '${currentInvTab}')" 
                      style="background: ${btnColor}; color: white; border: none; padding: 8px 0; border-radius: 6px; width: 100%; font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.15); transition: opacity 0.2s;">
                ${btnLabel}
              </button>
            </div>
          </div>
        `;
    });
  }
  html += `</div>`;
  container.innerHTML = html;
}

function setInvTab(tab) { currentInvTab = tab; renderInventory(); }

function toggleInventory() {
  const overlay = document.getElementById('inventory-overlay');
  if (!overlay) return;
  G.invOpen = !G.invOpen;
  overlay.style.display = G.invOpen ? 'flex' : 'none';
  if (G.invOpen) renderInventory();
}

function useItemAction(itemName, type) {
  G.actionMode = { type: 'equip', item: itemName, itemType: type };
  toggleInventory();
  log(`Targeting mode: Click an active teammate on the board to ${type === 'held' ? 'equip' : 'use'} ${itemName}`, "sys");
  G.hlCells = G.pokemon.filter(p => p.player === G.cur && !p.fainted).map(p => ({ col: p.col, row: p.row, type: 'move' }));
  renderAll();
}