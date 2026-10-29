# Pokémon Chess

A browser tactical game for two players: assemble Pokémon teams, deploy them on a grid, and spend shared resources on movement, attacks, skills, and evolution. Built with React, TypeScript, and Vite, with local shared-screen play and PeerJS multiplayer.

## Goal

Destroy the opponent's **Pedestal** or defeat **all of their Pokémon**. Protect your own Pedestal and keep at least one Pokémon alive.

In the current implementation, each Pedestal starts with **10 HP**. This is a custom tactical ruleset: positioning, skills, types, evolution, and items determine the battle.

## Run it

Requirements: Node.js 22.12 or newer, npm, Git for cloning, and a modern browser. Online play also needs an internet connection for PeerJS signaling and a working WebRTC connection between players.

Open PowerShell and run:

```powershell
git clone https://github.com/hobeless48-create/PokemonChess.git
cd PokemonChess
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:3000/PokemonChess/`. Keep the `/PokemonChess/` path: it is the configured base for development and deployment. No API key is needed to play.

## How to play locally

1. Enter the preparation and roster setup flow from the opening screen. Review the board and roster settings before selecting teams.
2. Build both players' rosters. The defaults are an **11 × 11 board**, **up to six Pokémon per team**, a **15-point team budget**, and **up to one Legendary**. These limits can be changed in the preparation settings.
3. Place the selected Pokémon in each team's permitted deployment rows. The setup board highlights valid positions and shows the running team cost.
4. Choose **Confirm Rosters & Deployment**. Player 1 takes the first turn; local players share the screen and alternate control.
5. Select a friendly Pokémon, choose a move, attack, or skill, then click a highlighted legal destination or target. Read the unit panel for range, costs, and status restrictions.
6. Use the shop and backpack for items, and allocate Command EXP to develop the Pokémon you want to evolve.
7. Choose **End Turn** when finished. The other player receives their turn resources, and ongoing effects and progression resolve through the turn flow.
8. Continue until a Pedestal is destroyed or one team has no surviving Pokémon.

A first game works well with a small mix of frontline, ranged, and support roles. Inspect movement and skill previews before spending resources.

## Play online with two browsers

1. Run or serve the game so both players can open it. For two devices, use an address reachable by both devices rather than the host's `localhost`.
2. In roster setup, the first player chooses **Host Game** and shares the displayed peer ID.
3. The second player enters that ID and chooses **Join**.
4. Wait for the connection, then build and deploy each player's roster.
5. Both players choose **Ready to Battle**. The match starts when both sides are ready.

PeerJS uses WebRTC for the game connection. If a network blocks the connection, roster readiness alone will not establish a match; check that both browsers show a connected state.

## Controls

| Input or control | What it does |
| --- | --- |
| Click a friendly Pokémon | Select it and inspect available actions |
| Action buttons + highlighted cells | Choose a movement destination, attack, or skill target |
| E | End turn |
| H | Open or close the rules panel |
| B | Open the backpack |
| F | Open the shop |
| C | Open the type chart |
| R | Rotate a directional skill preview |
| 1–6 | Quickly select Pokémon |

Use the on-screen action and target previews to see whether an action is legal before confirming it.

## Rules notes

### Turn resources

- **Energy:** the team starts with 3 Energy per turn. The base maximum rises to 4 at turn 10 and 5 at turn 25, and refreshes for the incoming player. Abilities can modify the limit.
- **Movement Points (MP):** movement has a separate shared pool. Teams start with 3 MP, normally recover 3 at turn start, and can store up to 4. Certain abilities alter these values.
- **Movement cost:** a normal move uses 1 MP when that Pokémon has not already used MP that turn and the team has MP available; otherwise it normally costs 1 Energy. Items, terrain, and abilities can change the cost.
- **Attacks and skills:** a normal attack costs 1 Energy. Skills use their displayed costs and may also have cooldowns, limited uses, or special conditions.
- **Gold:** players start with 5 gold. Turn-end income and shared milestone payouts fund held items and consumables.

The turn number advances when play returns to Player 1, so each numbered turn normally includes both players' actions.

### Positioning and combat

Attack, Defense, Support, and Assassin roles have different movement patterns. Evolution can expand movement and improve skills. Use highlighted cells and the Pokémon's panel to check legal range.

Elemental matchups, passive abilities, held items, weather, terrain, and status effects change combat. Burn, poison, sleep, freeze, paralysis, and confusion can affect damage or prevent actions. Check the type chart and battle log when an expected action fails.

### Evolution and items

Pokémon gain passive EXP through the turn flow, while players receive 2 allocatable Command EXP for the incoming turn. Spend it to reach evolution thresholds or develop egg hatch pools. The unit panel shows the relevant requirements.

Held items provide ongoing effects; consumables are used from the backpack. The current limit is two consumables per turn, with Power Herb limited to one use per turn.

## Current scope

The React application is the current playable version. Some older help and documentation still describe an 8 × 8 board, a 10-point budget, 30-HP Pedestals, or earlier resource rules. The defaults above follow the current application; use its preparation settings and live resource indicators when playing.

Local play alternates two human players on one screen. Online play connects two browsers; this README does not assume an AI opponent or a persistent saved campaign.

## Useful files

- [Application](src/App.tsx) — current setup defaults, turns, resources, multiplayer flow, and victory checks.
- [Setup screen](src/components/SetupScreen.tsx) — roster selection, deployment, and online readiness.
- [Board](src/components/Board.tsx) — board presentation and targeting interactions.
- [Game helpers](src/utils/gameEngine.ts) — movement, targeting, and other shared game calculations.
- [Pokémon data](src/data/pokemon.ts) and [additional roster](src/data/pokemon_gen3_6.ts) — species and abilities.
- [Items](src/data/items.ts) and [type charts](src/data/typeCharts.ts) — item and matchup data.
- [GAME_DOCUMENTATION.md](GAME_DOCUMENTATION.md) — detailed design and historical mechanics; check older numbers against the current app.
- [Vite configuration](vite.config.ts) — base path and production output.

## Checks and production build

Run from the repository root:

```powershell
npm run lint
npm run build
```

`lint` runs TypeScript checking. There is no `npm test` script in the current manifest.

Vite writes the static site to `docs/` with the base path `/PokemonChess/`. Keep the generated `docs/` output when publishing through GitHub Pages. To preview a build locally, run:

```powershell
npm run preview
```

For a manual check, finish roster deployment, move and attack with both players, end turns, open the item panels, and test one host/join match in two browsers.
