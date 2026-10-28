# Pokémon Chess

A browser based tactical Pokémon chess game built with React, TypeScript, and Vite. Play locally or connect two browsers with PeerJS WebRTC multiplayer.

## Requirements

- Node.js 20 or newer
- npm (included with Node.js)
- A modern browser; multiplayer needs an internet connection for PeerJS signaling

## Run locally

Open PowerShell in this folder and run:

```powershell
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:3000`). No API key is needed for local play.

## Start a multiplayer match

1. Open the game in both browsers.
2. On the first browser, choose **Host Game** and share the displayed peer ID.
3. On the second browser, enter that ID and choose **Join**.
4. Set up each roster and choose **Ready to Battle**. The match begins when both players are ready.

## Production build

```powershell
npm run build
```

Vite writes the static site to `docs/`. The configured base path is `/PokemonChess/`, which matches the GitHub Pages repository URL. Keep the generated `docs/` output when publishing through GitHub Pages.

## Configuration and project files

- `src/` contains the game and UI.
- `public/` contains static assets.
- `GAME_DOCUMENTATION.md` describes game rules and mechanics.
- `vite.config.ts` configures the GitHub Pages base path and build output.
- `.env.example` documents optional hosting environment values. Do not put real credentials in committed files.
