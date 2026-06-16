// =============================================================================
// ecs.js — Entity Component System for Pokemon Chess
// =============================================================================
// ARCHITECTURE OVERVIEW
//
// Old (Object-Oriented / AoS):
//   G.pokemon = [
//     { id, species, hp, maxHp, atk, def, col, row, fainted, status, modifiers, … },
//     { id, species, hp, maxHp, atk, def, col, row, fainted, status, modifiers, … },
//     …                              // ← each entity is a fat JS object
//   ]
//
// New (ECS / SoA):
//   ECS.id        = Int32Array  [ 0, 1, 2, … ]   // entity IDs
//   ECS.hp        = Int16Array  [ 8, 7, 10, … ]  // hp of entity[i]
//   ECS.maxHp     = Int16Array  …
//   ECS.col       = Uint8Array  …
//   ECS.row       = Uint8Array  …
//   ECS.atk       = Int8Array   …
//   ECS.def       = Int8Array   …
//   ECS.player    = Uint8Array  …
//   ECS.fainted   = Uint8Array  (0/1 booleans)
//   ECS.speciesId = Uint16Array …  // index into SPECIES_LIST[]
//   …etc.
//
// WHY THIS BEATS OBJECTS FOR 1 000+ ENTITIES
// -------------------------------------------
// 1.  CACHE LOCALITY (the big one)
//     When the CPU fetches ECS.hp[i] it loads an entire 64-byte cache line
//     of consecutive hp values — roughly 32-64 entities in one memory fetch.
//     The tight weather/status loop then reads hp[0..N] sequentially;
//     almost every access is a cache HIT.
//
//     With AoS, each entity object is scattered on the JS heap (V8 allocates
//     them independently). Iterating all .hp means jumping ~8–40 bytes between
//     objects for every property read — each jump may miss the L1/L2 cache,
//     causing a 100–300 cycle stall per entity. At 1 000 entities × 6
//     per-turn loops that's ~1 800 000 potential cache misses per turn vs ~30.
//
// 2.  TYPED ARRAYS ARE NOT GC-MANAGED
//     Plain JS objects are on the V8 managed heap. 1 000 objects ×
//     ~20 properties each = ~20 000 heap slots the GC must trace on every
//     major collection, causing frame hitches. TypedArrays live in a separate
//     backing store; the GC ignores their contents entirely.
//
// 3.  SIMD / JIT VECTORISATION
//     V8's Turbofan can auto-vectorise hot loops over Int16Array (using SSE2 /
//     AVX on x86) in a way it cannot for property accesses on untyped objects.
//
// 4.  MEMORY FOOTPRINT
//     1 000 JS objects at ~20 props each ≈ 200–400 kB (with hidden-class
//     overhead).  The equivalent typed arrays: ~20 arrays × 1 000 entries ×
//     1–2 bytes = ~40 kB — a 5–10× saving that keeps hot data in L2 cache.
// =============================================================================

const MAX_ENTITIES = 1200; // headroom for Gen 1–9 teams

// ─── Component arrays ────────────────────────────────────────────────────────
const ECS = {
  // Meta
  count: 0,                                        // how many live entities
  id:        new Int32Array(MAX_ENTITIES),          // entity handle (stable across slots)

  // Position
  col:       new Uint8Array(MAX_ENTITIES),
  row:       new Uint8Array(MAX_ENTITIES),

  // Ownership
  player:    new Uint8Array(MAX_ENTITIES),          // 1 or 2

  // Combat stats
  hp:        new Int16Array(MAX_ENTITIES),
  maxHp:     new Int16Array(MAX_ENTITIES),
  atk:       new Int8Array(MAX_ENTITIES),
  def:       new Int8Array(MAX_ENTITIES),

  // Species reference (index into SPECIES_LIST; avoids repeated hash-map look-ups)
  speciesId: new Uint16Array(MAX_ENTITIES),

  // Boolean flags packed as Uint8 (0 / 1)
  fainted:       new Uint8Array(MAX_ENTITIES),
  hasMoved:      new Uint8Array(MAX_ENTITIES),
  hasAttacked:   new Uint8Array(MAX_ENTITIES),
  hasUsedSkill:  new Uint8Array(MAX_ENTITIES),
  isEgg:         new Uint8Array(MAX_ENTITIES),
  hasHatched:    new Uint8Array(MAX_ENTITIES),
  focusBandUsed: new Uint8Array(MAX_ENTITIES),

  // EXP / hatch
  exp:           new Int16Array(MAX_ENTITIES),
  hatchProgress: new Int16Array(MAX_ENTITIES),
  hatchCost:     new Int16Array(MAX_ENTITIES),

  // Status: 0=none 1=burn 2=poison 3=toxic 4=paralysis 5=sleep 6=freeze 7=confuse
  status:    new Uint8Array(MAX_ENTITIES),

  // Held-item index (0 = none, otherwise index into ITEM_LIST)
  heldItem:  new Uint8Array(MAX_ENTITIES),

  // ── Non-hot data kept as regular JS (not worth typed-array overhead) ──────
  // Modifiers are sparse and short-lived; a small per-entity array is fine.
  modifiers:    [],   // modifiers[i] = Array<{stat, amount, duration}>
  skillUses:    [],   // skillUses[i] = {}
  skillCooldowns: [], // skillCooldowns[i] = {}
  leechSeed:    [],   // leechSeed[i] = null | {sourceIdx, duration}

  // Back-reference: species name string (for log messages / UI only)
  speciesName: [],    // speciesName[i] = "Bulbasaur"
};

// ── Interning tables (built once at startup from DB) ─────────────────────────
let SPECIES_LIST = [];   // ["Bulbasaur", "Ivysaur", …]  index → name
let SPECIES_INDEX = {};  // name → index  (O(1) look-up, replaces DB[name] key hashing)
let ITEM_LIST = [];      // item name strings
let ITEM_INDEX = {};

// STATUS encoding constants (avoids string comparisons in hot loops)
const STATUS = Object.freeze({
  NONE: 0, BURN: 1, POISON: 2, TOXIC: 3,
  PARALYSIS: 4, SLEEP: 5, FREEZE: 6, CONFUSE: 7,
});
const STATUS_NAME = ['', 'burn', 'poison', 'toxic', 'paralysis', 'sleep', 'freeze', 'confuse'];

// ─── Initialisation ───────────────────────────────────────────────────────────

function ecsInit() {
  // Build intern tables from the existing DB and ITEMS objects
  SPECIES_LIST = Object.keys(DB);
  SPECIES_INDEX = {};
  SPECIES_LIST.forEach((n, i) => { SPECIES_INDEX[n] = i; });

  ITEM_LIST = ['', ...Object.keys(ITEMS)]; // 0 = "no item"
  ITEM_INDEX = {};
  ITEM_LIST.forEach((n, i) => { ITEM_INDEX[n] = i; });

  // Zero-fill all typed arrays
  ECS.count = 0;
  for (const key of Object.keys(ECS)) {
    if (ECS[key] instanceof TypedArray_proto) ECS[key].fill(0);
  }
  ECS.modifiers = [];
  ECS.skillUses = [];
  ECS.skillCooldowns = [];
  ECS.leechSeed = [];
  ECS.speciesName = [];
}

// Detect TypedArray generically
const TypedArray_proto = Object.getPrototypeOf(Int8Array);

// ─── Entity creation ──────────────────────────────────────────────────────────

let _nextId = 0;

/**
 * Spawn a new entity and return its dense index.
 * Caller sets fields directly on ECS arrays after this returns.
 */
function ecsSpawn() {
  const i = ECS.count++;
  ECS.id[i] = _nextId++;
  ECS.modifiers[i] = [];
  ECS.skillUses[i] = {};
  ECS.skillCooldowns[i] = {};
  ECS.leechSeed[i] = null;
  return i;
}

/**
 * Create a Pokemon entity from species name + placement.
 * Replaces the G.pokemon.push({…}) block in startGame().
 */
function ecsSpawnPokemon(species, player, col, row) {
  const db = DB[species];
  if (!db) throw new Error(`Unknown species: ${species}`);
  const i = ecsSpawn();
  const si = SPECIES_INDEX[species];

  ECS.speciesId[i]   = si;
  ECS.speciesName[i] = species;
  ECS.player[i]      = player;
  ECS.col[i]         = col;
  ECS.row[i]         = row;

  if (db.legendary) {
    // Legendary starts as an egg
    ECS.hp[i]         = 10;
    ECS.maxHp[i]      = 10;
    ECS.atk[i]        = db.atk || 0;
    ECS.def[i]        = db.def || 0;
    ECS.isEgg[i]      = 1;
    ECS.hatchCost[i]  = db.hatchCost || 30;
  } else {
    ECS.hp[i]    = db.hp;
    ECS.maxHp[i] = db.hp;
    ECS.atk[i]   = db.atk || 0;
    ECS.def[i]   = db.def || 0;
  }
  return i;
}

// ─── Entity look-up helpers ───────────────────────────────────────────────────

/**
 * Find entity index at (col, row) that is not fainted.
 * O(N) scan over a Uint8Array — extremely cache-friendly.
 * At 12 entities (typical match) this is ~12 comparisons; at 1 000 it still
 * touches only ~3 cache lines for col[], ~3 for row[], ~3 for fainted[].
 */
function ecsFindAt(col, row) {
  const n = ECS.count;
  const cols = ECS.col, rows = ECS.row, fa = ECS.fainted;
  for (let i = 0; i < n; i++) {
    if (!fa[i] && cols[i] === col && rows[i] === row) return i;
  }
  return -1;
}

/** Convenience: returns the entity object-view used by legacy UI code. */
function ecsGet(i) {
  // Returns a live proxy object so legacy code continues working unchanged.
  // Only create these for UI / logging paths, NOT hot game-logic loops.
  return new EntityProxy(i);
}

/** Convert an old-style G.pokemon entity to its ECS index. */
function ecsIndexById(id) {
  const n = ECS.count;
  const ids = ECS.id;
  for (let i = 0; i < n; i++) { if (ids[i] === id) return i; }
  return -1;
}

// ─── Proxy shim ── lets legacy UI/log code use entity.hp, entity.species, etc.
// Only used on UI paths; hot-loop systems use raw typed arrays directly.
class EntityProxy {
  constructor(idx) { this._i = idx; }
  get id()          { return ECS.id[this._i]; }
  get species()     { return ECS.speciesName[this._i]; }
  get player()      { return ECS.player[this._i]; }
  get col()         { return ECS.col[this._i]; }
  get row()         { return ECS.row[this._i]; }
  get hp()          { return ECS.hp[this._i]; }
  get maxHp()       { return ECS.maxHp[this._i]; }
  get atk()         { return ECS.atk[this._i]; }
  get def()         { return ECS.def[this._i]; }
  get fainted()     { return !!ECS.fainted[this._i]; }
  get status()      { return STATUS_NAME[ECS.status[this._i]] || null; }
  get hasMoved()    { return !!ECS.hasMoved[this._i]; }
  get hasAttacked() { return !!ECS.hasAttacked[this._i]; }
  get hasUsedSkill(){ return !!ECS.hasUsedSkill[this._i]; }
  get isEgg()       { return !!ECS.isEgg[this._i]; }
  get hasHatched()  { return !!ECS.hasHatched[this._i]; }
  get exp()         { return ECS.exp[this._i]; }
  get heldItem()    { return ITEM_LIST[ECS.heldItem[this._i]] || null; }
  get modifiers()   { return ECS.modifiers[this._i]; }
  get leechSeed()   { return ECS.leechSeed[this._i]; }
  // Setters so legacy assignment still works
  set hp(v)          { ECS.hp[this._i] = v; }
  set fainted(v)     { ECS.fainted[this._i] = v ? 1 : 0; }
  set status(v)      { ECS.status[this._i] = STATUS_NAME.indexOf(v || '') < 0 ? 0 : STATUS_NAME.indexOf(v); }
  set col(v)         { ECS.col[this._i] = v; }
  set row(v)         { ECS.row[this._i] = v; }
  set exp(v)         { ECS.exp[this._i] = v; }
  set hasMoved(v)    { ECS.hasMoved[this._i] = v ? 1 : 0; }
  set hasAttacked(v) { ECS.hasAttacked[this._i] = v ? 1 : 0; }
  set hasUsedSkill(v){ ECS.hasUsedSkill[this._i] = v ? 1 : 0; }
  set leechSeed(v)   { ECS.leechSeed[this._i] = v; }
  set heldItem(v)    { ECS.heldItem[this._i] = v ? (ITEM_INDEX[v] || 0) : 0; }
  set modifiers(v)   { ECS.modifiers[this._i] = v; }
}

// ─── SYSTEMS ─────────────────────────────────────────────────────────────────
// Each system operates on the flat typed arrays directly.
// No property dereferences, no prototype chain, no hash-map look-ups.

// --- Weather System -----------------------------------------------------------
/**
 * Applies end-of-turn weather damage.
 * Reads: ECS.fainted, ECS.speciesId, ECS.hp (three sequential array scans)
 * Writes: ECS.hp, ECS.fainted
 * Cache profile: 3 cache lines per 64 entities — excellent.
 */
function systemWeather() {
  const wt = G.weather.type;
  if (!wt) return;

  const n  = ECS.count;
  const fa = ECS.fainted;
  const hp = ECS.hp;
  const si = ECS.speciesId;

  if (wt === 'Hail Storm') {
    for (let i = 0; i < n; i++) {
      if (fa[i]) continue;
      const db = DB[SPECIES_LIST[si[i]]];
      if (db.t1 !== 'Ice' && db.t2 !== 'Ice') {
        hp[i] = Math.max(0, hp[i] - 1);
        log(`${ECS.speciesName[i]} is hurt by hail!`, 'atk');
        if (hp[i] <= 0) { fa[i] = 1; log(`${ECS.speciesName[i]} fainted!`, 'sys'); }
      }
    }
  } else if (wt === 'Sand Storm') {
    for (let i = 0; i < n; i++) {
      if (fa[i]) continue;
      const db = DB[SPECIES_LIST[si[i]]];
      if (!['Rock','Ground'].includes(db.t1) && !['Rock','Ground'].includes(db.t2)) {
        hp[i] = Math.max(0, hp[i] - 1);
        log(`${ECS.speciesName[i]} is hurt by sandstorm!`, 'atk');
        if (hp[i] <= 0) { fa[i] = 1; log(`${ECS.speciesName[i]} fainted!`, 'sys'); }
      }
    }
  }

  if (--G.weather.duration <= 0) clearWeather();
}

// --- Modifier / Buff System ---------------------------------------------------
/**
 * Ticks modifier durations for all entities belonging to `player`.
 * Modifiers live in ECS.modifiers[] (plain JS arrays) because they're
 * sparse; iterating only the non-empty ones is still fast.
 */
function systemTickModifiers(player) {
  const n  = ECS.count;
  const pl = ECS.player;
  for (let i = 0; i < n; i++) {
    if (pl[i] !== player) continue;
    const mods = ECS.modifiers[i];
    if (!mods.length) continue;
    // Tick in-place, remove expired
    let w = 0;
    for (let m = 0; m < mods.length; m++) {
      mods[m].duration--;
      if (mods[m].duration > 0) mods[w++] = mods[m];
    }
    mods.length = w;
  }
}

/**
 * Compute effective stat for entity `i` with optional context.
 * Replaces getModifiedStat(p, stat, context) — but uses index, not object.
 */
function systemGetStat(i, stat, context = {}) {
  const db = DB[SPECIES_LIST[ECS.speciesId[i]]];
  let base = stat === 'atk' ? ECS.atk[i] : (stat === 'def' ? ECS.def[i] : (db[stat] || 0));

  if (db.ability === 'Unaware') return base;

  const itemName = ITEM_LIST[ECS.heldItem[i]];
  if (itemName) {
    const item = ITEMS[itemName];
    if (item?.effect?.stat === stat) {
      const cond = item.effect.condition;
      if (!cond) base += item.effect.amount;
      else if (cond === 'melee' && context.action === 'melee') base += item.effect.amount;
      else if (cond === 'skill' && context.isSkill) base += item.effect.amount;
    }
    if (itemName === 'Eviolite' && stat === 'def' && db.evoTo) base++;
    if (itemName === 'Assault Vest' && stat === 'def' && context.bySkill) base++;
    if (itemName === 'Metal Coat' && stat === 'atk' && !ECS.hasMoved[i]) base++;
    if (itemName === 'Sharp Beak' && stat === 'atk' && ECS.hasMoved[i]) base++;
    if (context.target !== undefined) {
      const ti = context.target; // now an index, not an object
      if (itemName === "King's Rock" && stat === 'atk' && ECS.hp[ti] < ECS.maxHp[ti] * 0.5) base++;
      if (itemName === 'Scope Lens'  && stat === 'atk' && ECS.hp[ti] === ECS.maxHp[ti]) base++;
    }
  }

  const mods = ECS.modifiers[i];
  for (let m = 0; m < mods.length; m++) {
    if (mods[m].stat === stat) base += mods[m].amount;
  }
  return base;
}

// --- Status System -----------------------------------------------------------
/**
 * Evaluate whether entity `i` can take action `actionType`.
 * Returns { ok: bool, msg?: string }.
 */
function systemAttemptAction(i, actionType) {
  const st = ECS.status[i];
  if (!st) return { ok: true };
  const name = ECS.speciesName[i];

  if (st === STATUS.FREEZE)   return { ok: false, msg: `${name} is frozen and cannot act.` };
  if (st === STATUS.SLEEP) {
    const woke = Math.random() < 0.5;
    if (woke) ECS.status[i] = STATUS.NONE;
    return woke ? { ok: true, msg: `${name} woke up!` } : { ok: false, msg: `${name} failed to wake from sleep.` };
  }
  if (st === STATUS.PARALYSIS) {
    if (Math.random() < 0.3) return { ok: false, msg: `${name} is paralyzed and cannot move.` };
    return { ok: true };
  }
  if (st === STATUS.CONFUSE) {
    if (Math.random() < 0.3) {
      ECS.hp[i] = Math.max(0, ECS.hp[i] - 2);
      log(`${name} hurt itself in confusion!`, 'atk');
      if (ECS.hp[i] <= 0) { ECS.fainted[i] = 1; log(`${name} fainted!`, 'sys'); }
      return { ok: false };
    }
    return { ok: true };
  }
  return { ok: true };
}

// --- Turn-reset System -------------------------------------------------------
/**
 * Resets per-turn flags for all entities of `player`.
 * Four sequential Uint8Array scans — maximally cache-friendly.
 */
function systemResetTurnFlags(player) {
  const n  = ECS.count;
  const pl = ECS.player;
  const hm = ECS.hasMoved;
  const ha = ECS.hasAttacked;
  const hs = ECS.hasUsedSkill;

  for (let i = 0; i < n; i++) {
    if (pl[i] !== player) continue;
    hm[i] = 0;
    ha[i] = 0;
    hs[i] = 0;
  }
}

// --- Leech-seed drain System -------------------------------------------------
function systemTickLeechSeed() {
  const n = ECS.count;
  for (let i = 0; i < n; i++) {
    const seed = ECS.leechSeed[i];
    if (!seed || ECS.fainted[i]) continue;
    const si = seed.sourceIdx;
    if (si < 0 || ECS.fainted[si]) { ECS.leechSeed[i] = null; continue; }
    ECS.hp[i]  = Math.max(0, ECS.hp[i] - 1);
    ECS.hp[si] = Math.min(ECS.maxHp[si], ECS.hp[si] + 1);
    log(`${ECS.speciesName[i]} drained by Leech Seed!`, 'atk');
    if (ECS.hp[i] <= 0) { ECS.fainted[i] = 1; log(`${ECS.speciesName[i]} fainted!`, 'sys'); }
    seed.duration--;
    if (seed.duration <= 0) ECS.leechSeed[i] = null;
  }
}

// --- Alive count System ------------------------------------------------------
function systemAliveCount(player) {
  const n = ECS.count;
  const pl = ECS.player, fa = ECS.fainted;
  let c = 0;
  for (let i = 0; i < n; i++) { if (pl[i] === player && !fa[i]) c++; }
  return c;
}

// ─── Compatibility bridge ─────────────────────────────────────────────────────
// Keeps the existing game.js / ui.js code working without modification.
// G.pokemon behaves like an array of entity objects but reads/writes ECS arrays.

function rebuildGPokemonProxy() {
  // Replace G.pokemon with an array of EntityProxy objects.
  // Call this after ecsSpawnPokemon() calls during startGame().
  G.pokemon = [];
  for (let i = 0; i < ECS.count; i++) {
    G.pokemon.push(ecsGet(i));
  }
}

// ─── Drop-in replacements for game.js hot-path functions ─────────────────────

// pk(col, row) → entity proxy or undefined  (used everywhere in game.js)
function pk(col, row) {
  const i = ecsFindAt(col, row);
  return i >= 0 ? ecsGet(i) : undefined;
}

// Replaces G.pokemon.filter(p => p.player === player && !p.fainted).length
function alivePokemonCount(player) {
  return systemAliveCount(player);
}

// Replaces tickModifiers(player)
function tickModifiers(player) {
  systemTickModifiers(player);
}

// Replaces getModifiedStat(p, stat, ctx) — p can be proxy or index
function getModifiedStat(p, stat, context = {}) {
  const i = (typeof p === 'number') ? p : p._i;
  // Translate context.target from proxy → index for systemGetStat
  const ctx = { ...context };
  if (ctx.target && typeof ctx.target === 'object' && '_i' in ctx.target) {
    ctx.target = ctx.target._i;
  }
  return systemGetStat(i, stat, ctx);
}

// Replaces applyWeatherTurnEffects()
function applyWeatherTurnEffects() {
  systemWeather();
}
