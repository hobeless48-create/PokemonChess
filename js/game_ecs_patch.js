// =============================================================================
// game_ecs_patch.js  —  Drop-in replacements for newGame() and startGame()
//
// Include AFTER ecs.js and BEFORE game.js in your HTML:
//   <script src="js/ecs.js"></script>
//   <script src="js/game_ecs_patch.js"></script>
//   <script src="js/game.js"></script>   ← rest of game.js unchanged
//
// The patch overrides only the two functions that create entities.
// Every other function in game.js (doAttack, doDmg, doSkill, endTurn, …)
// continues to work via the EntityProxy shim and the pk() / getModifiedStat()
// replacements defined in ecs.js.
// =============================================================================

function newGame() {
  // Reset ECS storage
  ecsInit();          // zero-fills all typed arrays, rebuilds intern tables
  _nextId = 0;

  // Reset global game state (identical to original)
  G = {
    turn: 1, phase: 1, cur: 1,
    energy: [0, 3, 3], maxE: [0, 3, 3],
    gold: [0, 5, 5], freeExp: [0, 0, 0],
    weather: { type: null, duration: 0 },
    selectedCell: null, hlCells: [], actionMode: null,
    skillMenuFor: null,
    // G.pokemon is rebuilt by rebuildGPokemonProxy() inside startGame
    pokemon: [],
    pedestals: [
      { player: 1, col: 3, row: 0, hp: 30 },
      { player: 2, col: 4, row: 7, hp: 30 }
    ],
    log: [], p1done: false, p3done: false, over: false,
    headerDetailMode: null,
    shopOpen: false, invOpen: false,
    inventory: { 1: { held: [], consumable: [] }, 2: { held: [], consumable: [] } },
    hatchPools: { 1: {}, 2: {} }
  };
}

function startGame() {
  // ── 1. Collect team selections (identical to original) ──────────────────
  const teams = [];
  for (let pl = 0; pl < 2; pl++) {
    teams[pl] = [];
    for (let s = 0; s < 6; s++) {
      const sel = document.getElementById(`p${pl + 1}s${s}`);
      const value = sel ? sel.value : '';
      if (value) teams[pl].push({ species: value, slot: s });
    }
  }

  const startBtn = document.querySelector('.start-btn');

  for (let pl = 0; pl < 2; pl++) {
    const cost = teams[pl].reduce((a, item) => a + (DB[item.species]?.cost || 0), 0);
    if (cost > 10) {
      if (startBtn) {
        startBtn.textContent = `Player ${pl + 1} team cost exceeds 10!`;
        startBtn.style.backgroundColor = '#E24B4A';
        setTimeout(() => { startBtn.textContent = 'Start Game'; startBtn.style.backgroundColor = ''; }, 3000);
      }
      return;
    }
    if (teams[pl].length < 1) {
      if (startBtn) {
        startBtn.textContent = `Player ${pl + 1} needs at least 1 Pokemon!`;
        startBtn.style.backgroundColor = '#E24B4A';
        setTimeout(() => { startBtn.textContent = 'Start Game'; startBtn.style.backgroundColor = ''; }, 3000);
      }
      return;
    }
  }

  // ── 2. Initialise ECS and game state ────────────────────────────────────
  newGame();

  // ── 3. Spawn entities into ECS typed arrays ─────────────────────────────
  //    This is the only meaningful change from the original startGame():
  //    instead of pushing plain objects into G.pokemon[], we call
  //    ecsSpawnPokemon() which writes into the flat typed arrays.
  for (let pl = 0; pl < 2; pl++) {
    teams[pl].forEach(item => {
      const db = DB[item.species];
      const pos = SETUP_POSITIONS[pl + 1][item.slot] || { col: 0, row: pl === 0 ? 1 : 6 };
      ecsSpawnPokemon(item.species, pl + 1, pos.col, pos.row);
    });
  }

  // ── 4. Build the G.pokemon proxy array so legacy code still works ───────
  rebuildGPokemonProxy();

  // ── 5. Start UI (identical to original) ─────────────────────────────────
  if (document.getElementById('shop-overlay'))
    document.getElementById('shop-overlay').style.display = 'none';
  if (document.getElementById('inventory-overlay'))
    document.getElementById('inventory-overlay').style.display = 'none';
  G.shopOpen = false;
  G.invOpen  = false;
  log('Game started! Player 1 goes first.', 'sys');
  showScreen('game');
  renderAll();
}

// ── endTurn hook: reset per-turn flags via ECS system ───────────────────────
// Wrap the original endTurn to call systemResetTurnFlags.
// (Alternatively, replace the hasMoved/hasAttacked/hasUsedSkill resets
//  that already exist in endTurn() with this one-liner.)
const _origEndTurn_ecs = typeof endTurn === 'function' ? endTurn : null;
function endTurn() {
  // Flush ECS turn flags for the player ABOUT TO PLAY (after swap)
  // The actual swap of G.cur happens inside the original endTurn.
  if (_origEndTurn_ecs) _origEndTurn_ecs();
  // After cur has switched, reset flags for new active player
  systemResetTurnFlags(G.cur);
}
