# ♟️ Pokémon Chess - Peer-to-Peer Multiplayer Guide

A tactical board game built with React, Vite, and custom CSS, now updated with a **zero-configuration Peer-to-Peer (P2P) multiplayer mode** using WebRTC.

---

## 🚀 Running the Game Locally

### Prerequisites
*   [Node.js](https://nodejs.org/) (v16+) installed.

### Steps
1.  **Clone or extract** the project files to your system.
2.  Open your terminal in the project directory.
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Launch the development server:**
    ```bash
    npm run dev
    ```
5.  Open your browser and navigate to the address shown in the terminal (usually `http://localhost:3000`).

---

## 🌐 How Peer-to-Peer (P2P) Works

This game uses **PeerJS** to establish a direct WebRTC data channel between players' browsers. 
*   **No Dedicated Server Needed:** Signaling and matchmaking are handled by PeerJS's public signaling cloud server.
*   **Direct Browser Connection:** Once connected, game actions and state updates travel directly from one browser tab to another with near-zero latency.

---

## 👥 How to Connect and Play

You can test this locally by opening two different tabs of `http://localhost:3000` (or sharing with a friend).

### Step 1: Host a Game (Player 1)
1.  On the **Setup Screen**, go to the **P2P Online Multiplayer** panel.
2.  Click **Host Game**.
3.  The panel will display your unique ID: `pchess-XXXX`.
4.  Click the **Copy** button to copy this ID to your clipboard.
5.  Send this ID to the other player.

### Step 2: Join a Game (Player 2)
1.  Go to the **P2P Online Multiplayer** panel.
2.  Paste the host's ID into the **Host Peer ID** input box.
3.  Click **Join**.
4.  Once connected, the status banner will update:
    *   Host gets: `Connected! You are Player 1 (Blue)`.
    *   Guest gets: `Connected! You are Player 2 (Red)`.

### Step 3: Setup & Roster Lock-in
1.  **Roster Sync:** As you select Pokémon and place them on the grid, they will sync to the other player's screen in real-time. Input restrictions prevent you from editing your opponent's team.
2.  **Ready Toggle:** When your team setup is complete and budget is valid, click **Ready to Battle**.
3.  **Launch Match:** Once both players have toggled Ready, the Host's system automatically starts the match and sends the starting board state to the Guest, transitioning both screens to the active game board.

---

## 📡 Sharing the Game with Another Player

To play with a friend on another device, you need to share access to the game application:

### Option A: Play on the Same Local Network (LAN/Wi-Fi)
If both you and your friend are connected to the same Wi-Fi network, you do not need to host it online:
1.  Run `npm run dev` on the host computer.
2.  Look at VITE's output in the terminal under the **Network** line (e.g. `http://192.168.1.118:3000`).
3.  Have your friend open their browser and navigate to that Network URL.
4.  Follow the **How to Connect and Play** steps above.

### Option B: Share Online via Local Tunnel (Fastest)
If you want to play over the internet without deploying:
1.  Run `npm run dev` locally.
2.  In a separate terminal, use a local tunnel tool like `ngrok` or `localtunnel` to expose your local port `3000`:
    *   *Using Localtunnel:* `npx localtunnel --port 3000`
    *   *Using Ngrok:* `ngrok http 3000`
3.  Send the generated public URL to your friend.
4.  Both open the URL, host/join via Peer ID, and play!

### Option C: Production Deployment
To deploy the game permanently online:
1.  **Build production bundle:**
    ```bash
    npm run build
    ```
2.  Upload the compiled `dist/` directory to static hosting services like **Vercel**, **Netlify**, or **GitHub Pages**.
3.  Both players open the deployed website link and connect via the Peer ID panel.

---

## 🎮 Multiplayer Gameplay Mechanics

*   **Turn Lockout:** Action inputs (clicks, moves, attacks, skills, shop, equips) are restricted to the active player's turn.
*   **Opponent Turn Overlay:** The passive player sees a frosted blur overlay saying `"Opponent's Turn"` to clarify turn state.
*   **Keyboard Hotkeys:** Global keybinds (`E` to end turn, `B` for backpack, `F` for shop, `1-6` for selections) are automatically blocked during the opponent's turn.
*   **State & Roll Sync:** Every movement, log message, and status chance d20 animation popup is synchronized between both screens.
*   **Fallback Safety:** If a player disconnects or clicks **Leave Online**, the game falls back to local hotseat mode automatically so you can finish the match on a single screen without losing your progress.
