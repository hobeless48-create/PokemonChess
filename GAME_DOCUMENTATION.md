POKÉMON CHESS - Complete Technical Documentation
1. GAME OVERVIEW
Pokémon Chess is a tactical turn-based strategy game that combines Pokémon mechanics with chess-like board positioning. Two players compete on an 8×8 grid, controlling teams of Pokémon with the objective of destroying the opponent's pedestal or defeating all their Pokémon.

Core Game Loop
Team Setup: Players select 1-6 Pokémon (max total cost: 10) and position them on their deployment rows
Tactical Turns: Alternate turns spending Energy to Move, Attack, or use Skills
Evolution: Pokémon gain EXP to evolve into stronger forms
Item Shop: Spend gold to buy held items and consumables
Victory: Destroy enemy pedestal while they have no Pokémon remaining
2. CORE MECHANICS
2.1 Energy System
Starting Energy: 3 per player (max 3 at game start)
Energy Refresh: Fully restored at the start of each turn
Phase Scaling:
Turn 10: Max Energy increases to 4
Turn 30: Max Energy increases to 5
Costs:
Move: 1 Energy (0 with Quick Claw first move)
Attack: 1 Energy
Skill: 2+ Energy (varies by Pokémon)
2.2 Gold Economy
Income Schedule:
Turns 1, 6, 11, 16: +5 gold
Turns 21, 26, 31, 36: +6 gold
Turn 41+: +7 gold
Usage: Purchase items from the Premium Shop
2.3 Command EXP
Gain: +2 Free EXP per turn end
Usage: Manually allocate to any Pokémon that can still evolve/hatch
Auto-gain: All Pokémon gain +1 EXP at turn end (including eggs via hatch pools)
3. POKÉMON SYSTEM
3.1 Data Structure (data.js)
Each Pokémon is defined by:

javascript
{
  t1: 'Fire',           // Primary type
  t2: '',               // Secondary type (optional)
  cost: 3,              // Team building cost (1-5)
  base: true,           // Can be selected at team setup
  hp: 10,               // Base HP
  evoCost: 8,           // EXP needed to evolve
  evoTo: 'Charizard',   // Evolution target
  evoFrom: 'Charmeleon',// Previous evolution
  atk: 3,               // Base attack stat
  skillDmg: 3,          // Skill damage
  skillName: 'Flamethrower',
  skillDesc: 'Cone(1) — fire cone',  // Skill shape syntax
  cls: 'Attack',        // Role class
  color: '#993C1D',     // UI color
  statusChance: 'burn', // Status infliction
  aoe: 1,               // Area of effect radius
  legendary: true,      // Legendary flag
  hatchGroup: 'birds',  // Group for shared hatch pool
  hatchCost: 30,        // EXP to hatch legendary egg
  skillEffect: {        // Buff/debuff effect
    target: 'enemy',    // 'self', 'ally', 'enemy'
    stat: 'atk',
    amount: -1,
    duration: 2
  },
  skills: []            // Optional array of multiple skills (if supported)
}
3.2 Evolution Stages
Stage 1: Base form (e.g., Caterpie, Charmander)
Stage 2: First evolution (e.g., Metapod, Charmeleon)
Stage 3: Final evolution (e.g., Butterfree, Charizard)
Legendary Eggs: Start as eggs (10 HP), require 30 EXP to hatch into true form
Hatch Groups: Multiple legendaries can share a hatch group to pool EXP (e.g., the "birds" group for Articuno, Zapdos, Moltres)
3.3 Role Classes & Movement Patterns
Movement is role-based and direction-aware (Player 1 moves up, Player 2 moves down):

Class	Stage 1	Stage 2	Stage 3
Attack	Diagonal forward (2)	Forward + diagonals (3)	Extended forward + sides (4)
Defense	Cardinal directions (4)	Cardinal + back diagonals (6)	Extended cardinal (8)
Support	Forward + sides (3)	Cardinal directions (4)	Wide forward arc (6)
3.4 Type Effectiveness (TEFF)
javascript
Fire → Strong vs: Grass, Ice, Bug | Weak vs: Water, Rock, Fire
Water → Strong vs: Fire, Rock, Ground | Weak vs: Grass, Electric, Water
Grass → Strong vs: Water, Rock, Ground | Weak vs: Fire, Ice, Flying, Poison, Bug
Electric → Strong vs: Water, Flying | Weak vs: Ground, Grass, Electric
Ice → Strong vs: Grass, Flying, Ground | Weak vs: Fire, Rock, Steel
Psychic → Strong vs: Fighting, Poison | Weak vs: Dark, Ghost, Psychic
Flying → Strong vs: Grass, Fighting, Bug | Weak vs: Electric, Ice, Rock
Normal → Strong vs: none | Weak vs: Fighting
Poison → Strong vs: Grass | Weak vs: Ground, Psychic, Ghost
Rock → Strong vs: Fire, Flying, Ice, Bug | Weak vs: Water, Grass, Fighting, Ground
Ground → Strong vs: Fire, Electric, Rock, Poison | Weak vs: Water, Grass, Ice
Ghost → Strong vs: Ghost, Psychic | Weak vs: Ghost, Dark
Bonus: +1 damage for strong, -1 damage for weak

4. COMBAT SYSTEM
4.1 Basic Attack
Range: 1 cell forward only
Cost: 1 Energy
Damage: max(0, attacker.atk + typeBonus - target.def)
Burn Penalty: -1 damage if attacker is burned
4.2 Skills
Skills use a parsing system for targeting shapes:

Shape Syntax:

Line(2)(3) - Line of range 2 in direction 1 (forward)
Cone(2) - Cone spreading forward, range 2
AoE(1) - Area of effect, radius 1 (adjacent)
Target = [3(Line(2)(3)+Cone(1))] - Multi-target syntax
Directions (normalized for player):

1: Up (forward for P1, back for P2)
2: Right
3: Down (back for P1, forward for P2)
4: Left
Skill Properties:

Cost: 2+ Energy (varies)
Cooldown: Turns before reuse
Limit: Maximum uses per battle
Effect: Buff/debuff application
Multiple Skills: Pokémon can optionally have a skills array containing multiple skills
4.3 Damage Calculation
javascript
damage = max(0, attackValue + typeBonus - targetDefense)

// Attack Value sources:
// - Base stat from DB
// - Modifiers (temporary buffs/debuffs)
// - Held items (conditional)
// - Status effects (burn reduces damage)

// Defense applied against:
// - Physical attacks: target.def
// - Skills: target.def (modified by items like Assault Vest)
Skill Damage Calculation:
- If skill has explicit skillDmg defined, use it
- Otherwise: floor(ATK / 2)
4.4 Held Item Effects in Combat
Item	Effect
Muscle Band	+1 Atk always
Black Belt	+1 Atk on melee attacks
Wise Glasses	+1 Atk on skills
Sharp Beak	+1 Atk if moved this turn
Scope Lens	+1 Atk vs full HP targets
King's Rock	+1 Atk vs <50% HP targets
Life Orb	+1 Atk all actions, -1 HP after
Shell Bell	+1 Energy on hit (once/turn)
Rocky Helmet	1 recoil damage to melee attackers
Focus Band	Survive fatal hit at 1 HP (once)
Eviolite	+1 Def if can still evolve
Assault Vest	+1 Def vs skills
Metal Coat	+1 Atk if haven't moved
EXP Share	+1 EXP/turn if no actions
Lucky Egg	+1 EXP on KO
Smoke Ball	Free retreat after attacking
Quick Claw	First move costs 0 Energy
Miracle Seed	First skill costs -1 Energy
Light Clay	Buffs last +1 turn
Terrain Extender	Weather lasts +1 turn
Destiny Knot	Reflect status ailments
Safety Goggles	Immune to weather damage
Big Root	+1 HP from healing effects
5. ITEM SYSTEM (items.js)
5.1 Held Items (Persistent)
Offense Category (Red theme):

Muscle Band, Black Belt, Wise Glasses, Sharp Beak, Scope Lens, Shell Bell, King's Rock, Life Orb
Defense Category (Blue theme):

Leftovers, Rocky Helmet, Eviolite, Focus Band, Metal Coat, Assault Vest, Big Root
Utility Category (Purple theme):

EXP Share, Lucky Egg, Smoke Ball, Quick Claw, Miracle Seed, Light Clay, Terrain Extender, Destiny Knot, Safety Goggles
5.2 Consumables (One-time use)
Sitrus Berry: Heal 2 HP
Berry Juice: Heal 1 HP
Lum Berry: Clear all status
Mental Herb: Clear freeze/sleep/confusion
White Herb: Clear all negative modifiers
Power Herb: +1 Atk for 2 turns
5.3 Item Shop Interface
Main Tabs: Held Items / Consumables
Sub-tabs (Held only): All / Offense / Defense / Utility
Layout: Horizontal cards with icon, description, cost, buy button
Inventory: Separate held/consumable tabs, equip/use functionality
6. STATUS EFFECTS & WEATHER
6.1 Status Conditions
Status	Effect	Duration
Burn	-1 damage dealt, -1 HP/turn, 50% cure/turn	Until cured
Poison	-1 HP/turn, 25% cure/turn	Until cured
Toxic	-1 HP/turn (persistent)	Permanent
Paralysis	30% chance to skip action	Until cured
Sleep	Cannot act, 50% wake chance when attempting	Until wake
Freeze	Cannot act, 25% thaw/turn	Until thaw
Confusion	30% chance to self-damage (2 HP)	Until cured
6.2 Leech Seed
Effect: Drain 1 HP from target per turn end, heal source 1 HP
Data Structure:
javascript
p.leechSeed = {
  source: attackerPokemon,  // Who planted the seed
  duration: 3               // How many turns it lasts
};
6.3 Weather System
Hail Storm: Non-Ice types take 1 damage/turn
Sand Storm: Non-Rock/Ground types take 1 damage/turn
Duration: 3 turns by default
Clearing: Automatic when duration expires
7. TURN STRUCTURE
7.1 Player Turn Actions
Select Pokémon (click board)
Choose Action:
Move (1 Energy)
Attack (1 Energy)
Skill (2+ Energy)
Allocate EXP (from free pool)
Target Selection (click highlighted cells)
Repeat until energy depleted or pass
End Turn button
7.2 Turn End Resolution (automatic)
Apply status effects (burn, poison, toxic damage, Leech Seed) for current player's Pokémon
Tick modifier durations for current player's Pokémon
Apply weather damage
Decrement weather duration
Grant EXP to all Pokémon (+1)
Legendary eggs gain hatch progress
Resolve pending evolutions/hatches
Grant +2 Command EXP
Reset action flags (hasMoved, hasAttacked, hasUsedSkill)
Tick skill cooldowns
Switch player
Increment turn counter (if returning to P1)
Update phase
Check phase triggers (energy cap increases)
Grant gold on designated turns
Restore energy to max
7.3 Game Phases
Phase	Turns	Description
1	1-10	Early game. Standard energy and slow board development. Max energy: 3
2	11-20	Midgame. More aggressive board pressure and stable gold pacing.
3	21-30	Late midgame. Gold payout increases and energy can reach 5 soon. Max energy: 4 (from turn 10)
4	31-40	Endgame prep. High energy and strong boards; avoid losing tempo. Max energy: 5 (from turn 30)
5	41+	Final stage. Highest payouts and decisive attacks; protect your lead.
8. UI ARCHITECTURE
8.1 Screen Structure
screens/
├── setup/           # Team selection and positioning
├── game/            # Main gameplay
└── end/             # Victory/defeat screen
8.2 Game Screen Layout
┌─────────────────────────────────────────────────────┐
│  HEADER: Turn | Phase | Gold | Weather | Energy    │
├──────────────────┬──────────────────────────────────┤
│                  │  FIELD TRACKER                   │
│   CHESS BOARD    │  (Team HP bars)                  │
│   (8×8 Grid)     ├──────────────────────────────────┤
│                  │  TABS: Info | Teams | Log        │
│                  │  ─────────────────────────────   │
│                  │  Pokemon Info Card               │
│                  │  Action Buttons                  │
│                  │  Move Description                │
└──────────────────┴──────────────────────────────────┘
8.3 Key UI Components (ui.js)
renderBoard(): Renders the 8×8 grid with:

Cell highlighting (move/attack/skill preview)
Pedestal rendering (30 HP each)
Token display (species abbreviation, HP, held item icon)
Status indicators (colored borders)
renderInfo(): Side panel showing:

Selected Pokémon stats
Action buttons (Move, Attack, Skill, +EXP)
Held item with unequip option
Skill description with chance meters
renderFieldTracker(): Horizontal team overview with:

HP bars for all Pokémon
Status dot indicators
Egg tags for unhatched legendaries
renderItemShop(): Premium shop with:

Horizontal card layout
Category filtering
Gold cost display
Purchase validation
9. CODE ARCHITECTURE
9.1 Global State (G object)
javascript
G = {
  turn: 1,              // Current turn number
  phase: 1,             // Game phase (1-5)
  cur: 1,               // Current player (1 or 2)
  energy: [0, 3, 3],    // Energy per player (index 0 unused)
  maxE: [0, 3, 3],      // Max energy per player
  gold: [0, 5, 5],      // Gold per player
  freeExp: [0, 0, 0],   // Command EXP pool
  weather: {type, duration},
  selectedCell: {col, row},
  hlCells: [],          // Highlighted cells
  actionMode: {type, poke, skillIdx, targets},
  pokemon: [],          // Active Pokémon instances
  pedestals: [{player, col, row, hp}],
  inventory: {1: {held:[], consumable:[]}, 2: {...}},
  hatchPools: {1: {}, 2: {}}  // Group-based hatch progress
}
9.2 Core Functions (game.js)
Movement & Positioning:

getRoleBasedMoves(p) - Calculate valid moves based on class/stage
getAtkCells(p) - Get forward attack cell
getSkillCells(p, skillIdx) - Parse skill shape to cells
parseSkillShape(db, p, skillIdx) - Parse skill description syntax
Combat:

doMove(p, col, row) - Execute movement
doAttack(attacker, tc, tr) - Execute basic attack
doSkill(attacker, tc, tr, skillIdx) - Execute skill
doSkillMulti(attacker, targets, skillIdx) - Multi-target skill
doDmg(attacker, dmg, tc, tr, isSkill, skillDb) - Damage application
typeBonus(attacker, target) - Calculate type advantage
Status & Modifiers:

addModifier(p, stat, amount, duration) - Apply stat modifier
getModifiedStat(p, stat, context) - Calculate final stat with modifiers
tryActionStatus(p, actionType) - Check status prevention
attemptStatusAction(p, actionType) - Resolve status RNG
Evolution:

checkEvo(p) - Check if evolution conditions met
resolvePendingEvolutions() - Process evolutions at turn end
allocateExp(id) - Manual EXP allocation
Turn Management:

endTurn() - Complete turn and switch players
updatePhase() - Update game phase based on turn
applyWeatherTurnEffects() - Weather damage application
statusTurnEnd(player) - Apply status effects to a specific player's Pokémon
tickModifiers(player) - Tick modifiers for a specific player's Pokémon
9.3 Data Files
data.js:

DB - Pokémon database (60+ species)
TEFF - Type effectiveness chart
SCOL - Status color mapping
STATUS_META - Status descriptions
TCOL - Type color mapping
items.js:

ITEMS - Item database with effects and costs
10. SETUP PHASE
10.1 Team Building
Filter System: By cost, type, role, rarity
Tab Interface: Visual filter tabs with type/role colors
Cost Validation: Real-time total cost display (max 10)
Legendary Handling: Show star indicator, start as eggs
10.2 Positioning
P1 Deployment: Rows 0-1 (bottom)
P2 Deployment: Rows 6-7 (top)
Pedestals: Fixed at (3,0) for P1, (4,7) for P2
Drag-and-drop: Click slot → click board cell
Visual Feedback: Valid cells highlighted, occupied cells show Pokémon
11. VICTORY CONDITIONS
11.1 Win Scenarios
Pedestal Destruction: Enemy pedestal HP ≤ 0 AND they have no alive Pokémon
Timeout: After turn limit, higher score wins (pedestal HP × 3 + sum Pokémon HP)
11.2 Loss Check
checkLossByPedestal(player) - Called whenever pedestal takes damage or Pokémon faints
12. TECHNICAL NOTES
12.1 Skill Shape Parsing
The skill description parser uses regex to extract targeting shapes:

javascript
// Examples:
"Line(2)(3)"           → {type:'line', range:2, dirs:[1]}
"Cone(1)"              → {type:'cone', range:1, dirs:[1]}
"AoE(1)"               → {type:'aoe', radius:1}
"Target = [3(Line(2)(3)+Cone(1))]" → combo with target count 3
12.2 Direction Normalization
Directions are normalized based on player perspective so "forward" is always toward the enemy:

javascript
// Player 2 has directions flipped (1↔3)
normalizeDir(dir, player) // P1: unchanged, P2: 1→3, 3→1
12.3 Modifier Stack
Modifiers stack additively and tick down at turn end:

javascript
p.modifiers = [{stat:'atk', amount:2, duration:3}, ...]

12.4 Skill Cooldowns & Limits
Each skill can have:
- cooldown: Number of turns before the skill can be used again
- limit: Maximum number of times the skill can be used per battle

Tracked per Pokémon:
- skillCooldowns: Object tracking remaining cooldowns by skill key
- skillUses: Object tracking number of uses by skill key

12.5 Hatch Pools
Legendary Pokémon can share a hatchGroup to pool EXP together. When any Pokémon in the group gains EXP, the entire pool gains progress. Once the pool reaches the hatchCost, all eggs in the group hatch.

Documentation: Changes Made to game.js
1. Skill Damage Calculation System (Lines 340-355)
New Function: calculateSkillDamage(attacker, skill, dbAll)

Replaces hardcoded skill damage with dynamic calculation:

Condition	Damage Calculation
Skill has explicit skillDmg defined	Use that fixed value
No skillDmg defined	floor(ATK / 2)
Example:

Pokémon with ATK 5 → Skill deals 2 damage
Pokémon with ATK 4 → Skill deals 2 damage
Pokémon with ATK 3 → Skill deals 1 damage
Status move with skillDmg: 0 → Always deals 0 (no damage, just status)
Usage in code:

javascript
const baseSkillDmg = calculateSkillDamage(attacker, skill, dbAll);
// Replaces: skill.skillDmg||dbAll.skillDmg||0
2. Status Effect Timing (Lines 455-500)
Modified: statusTurnEnd(player)

Now includes Leech Seed drain effect and only processes status for the specified player:

javascript
// Only affects player's own Pokemon when THEY end turn
G.pokemon.filter(p=>p.player===player&&!p.fainted).forEach(p=>{
  // Leech Seed drain
  if(p.leechSeed && p.leechSeed.source){
    p.hp -= 1; // Drain 1 HP
    p.leechSeed.source.hp += 1; // Heal source
  }
  // Burn, Poison, Toxic damage
  // Status duration countdown (sleep, freeze thaw checks)
});
Modified: tickModifiers(player) (Lines 125-130)

Changed from global to player-specific:

javascript
// OLD: All Pokemon lose modifier duration
// NEW: Only current player's Pokemon lose duration
function tickModifiers(player){
  G.pokemon.forEach(p=>{
    if(p.player !== player) return; // Skip enemy Pokemon
    // ... tick duration
  });
}
3. End Turn Sequence (Lines 502-540)
Modified: endTurn() function

Status effects now trigger in this order:

statusTurnEnd(G.cur) - Current player's Pokemon take burn/poison/leech damage
tickModifiers(G.cur) - Current player's modifiers tick down
applyWeatherTurnEffects() - Weather affects everyone (global)
Switch player
Strategic Implication: If you poison an enemy, they won't take damage until THEIR turn ends. This gives them one turn to act while poisoned before taking damage.

4. Status Data Structure Addition
For Leech Seed support, Pokemon objects can now have:

javascript
p.leechSeed = {
  source: attackerPokemon,  // Who planted the seed
  duration: 3               // How many turns it lasts
};
Summary Table: Skill Damage by ATK
ATK Stat	Skill Damage	Example Pokemon
1	0	Magikarp (before evolution)
2	1	Caterpie, Weedle
3	1	Most basic Pokemon
4	2	Mid-stage evolutions
5	2	Final evolutions
6	3	Legendary Pokemon
Override Example: For a status-only move like Sleep Powder, define in database:

javascript
skillDmg: 0,  // Fixed 0 damage, ignores ATK calculation
For a move that should deal fixed damage regardless of ATK:

javascript
skillDmg: 3,  // Always deals 3, ignores ATK/2 calculation

