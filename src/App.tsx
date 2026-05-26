/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { GameState, PokemonEntity, Pedestal, BattleLogEntry, PlayerState, Skill } from "./types";
import { DB } from "./data/pokemon";
import { ITEMS } from "./data/items";
import { Peer, DataConnection } from "peerjs";
import {
  getRoleBasedMoves,
  getAtkCells,
  getSkillCells,
  getSkillShapeCells,
  parseSkillShape,
  getModifiedStat,
  typeBonus,
  getStatusChanceValue,
  pkAt,
  pedAt,
  getSkillData,
  getSkillTargetType,
  adjCells
} from "./utils/gameEngine";

import { SetupScreen } from "./components/SetupScreen";
import { Board } from "./components/Board";
import { FieldTrackers } from "./components/FieldTrackers";
import { StatsCard } from "./components/StatsCard";
import { SkillsAndLog } from "./components/SkillsAndLog";
import { Modals } from "./components/Modals";
import { Pokedex } from "./components/Pokedex";

function canInflictStatus(p: PokemonEntity, status: string): boolean {
  const db = DB[p.species];
  if (!db) return true;
  if (db.ability === "Leaf Guard") return false;
  if (status === "sleep" && (db.ability === "Insomnia" || db.ability === "Vital Spirit")) return false;
  if (status === "confuse" && db.ability === "Inner Focus") return false;
  if ((status === "burn" || status === "freeze") && db.ability === "Thick Fat") return false;
  return true;
}

function canOverrideWeather(current: string | null, next: string): boolean {
  if (!current) return true;

  const isNewWeather = (w: string) => ["Harsh Sunlight", "Heavy Rain", "Strong Winds"].includes(w);
  const isStandardWeather = (w: string) => ["Sunlight", "Rain", "Hail Storm", "Sandstorm"].includes(w);

  if (isNewWeather(current) && isStandardWeather(next)) {
    return false;
  }

  if (isNewWeather(current) && isNewWeather(next)) {
    if (current === "Harsh Sunlight") {
      return next === "Heavy Rain" || next === "Strong Winds" || next === "Harsh Sunlight";
    }
    if (current === "Heavy Rain") {
      return next === "Harsh Sunlight" || next === "Strong Winds" || next === "Heavy Rain";
    }
    if (current === "Strong Winds") {
      return next === "Strong Winds";
    }
  }

  return true;
}

export default function App() {
  const [screen, setScreen] = useState<"landing" | "preparation" | "pokedex" | "setup" | "game" | "end">("landing");
  const [winner, setWinner] = useState<{ player: number; reason: string } | null>(null);

  const [gameConfig, setGameConfig] = useState({
    boardSize: 11,
    maxUnits: 6,
    maxCost: 15,
    maxLegendary: 1
  });

  // Core game states
  const [gameState, setGameState] = useState<GameState>({
    turn: 1,
    phase: 1,
    currentPlayer: 1,
    energy: { 1: 3, 2: 3 },
    maxEnergy: { 1: 3, 2: 3 },
    movePoints: { 1: 3, 2: 3 },
    consumablesUsedThisTurn: { total: 0, powerHerb: 0 },
    weather: { type: null, duration: 0 },
    pokemon: [],
    pedestals: [],
    logs: [],
    players: {
      1: { gold: 5, freeExp: 0, inventory: { held: [], consumable: [] }, hatchPools: {} },
      2: { gold: 5, freeExp: 0, inventory: { held: [], consumable: [] }, hatchPools: {} }
    },
    selectedCell: null,
    highlightedCells: [],
    actionMode: null,
    skillMenuFor: null
  });

  const [shopOpen, setShopOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [weatherInfoOpen, setWeatherInfoOpen] = useState(false);
  const [turnNotice, setTurnNotice] = useState<number | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ col: number; row: number } | null>(null);
  const [typeChartOpen, setTypeChartOpen] = useState<boolean>(false);

  // Chance popup visual state
  const [chancePopup, setChancePopup] = useState<{
    statusType: string;
    chance: number;
    roll: number;
    success: boolean;
  } | null>(null);

  // P2P Multiplayer States
  const [p2pStatus, setP2pStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [peerId, setPeerId] = useState<string | null>(null);
  const [myPlayerNumber, setMyPlayerNumber] = useState<number>(0); // 0 = local hotseat, 1 = Host (P1), 2 = Guest (P2)
  const [p1Ready, setP1Ready] = useState<boolean>(false);
  const [p2Ready, setP2Ready] = useState<boolean>(false);

  // Local setup roster selections (saved from SetupScreen to trigger start playing)
  const [localP1Slots, setLocalP1Slots] = useState<string[]>(Array(6).fill(""));
  const [localP1Placements, setLocalP1Placements] = useState<{ col: number; row: number }[]>(
    Array.from({ length: 6 }, (_, i) => ({ col: i, row: 1 }))
  );
  const [localP2Slots, setLocalP2Slots] = useState<string[]>(Array(6).fill(""));
  const [localP2Placements, setLocalP2Placements] = useState<{ col: number; row: number }[]>(
    Array.from({ length: 6 }, (_, i) => ({ col: i + 1, row: 9 }))
  );

  // React useEffect to keep local setup placements and slot states updated when gameConfig changes
  React.useEffect(() => {
    setLocalP1Slots(Array(gameConfig.maxUnits).fill(""));
    setLocalP2Slots(Array(gameConfig.maxUnits).fill(""));
    setLocalP1Placements(Array.from({ length: gameConfig.maxUnits }, (_, i) => ({ col: i % gameConfig.boardSize, row: 1 + Math.floor(i / gameConfig.boardSize) })));
    setLocalP2Placements(Array.from({ length: gameConfig.maxUnits }, (_, i) => ({ col: (i + 1) % gameConfig.boardSize, row: gameConfig.boardSize - 2 - Math.floor(i / gameConfig.boardSize) })));
  }, [gameConfig]);

  // Incoming peer roster sync data (passed down to SetupScreen)
  const [peerP1Slots, setPeerP1Slots] = useState<string[] | undefined>(undefined);
  const [peerP1Placements, setPeerP1Placements] = useState<{ col: number; row: number }[] | undefined>(undefined);
  const [peerP2Slots, setPeerP2Slots] = useState<string[] | undefined>(undefined);
  const [peerP2Placements, setPeerP2Placements] = useState<{ col: number; row: number }[] | undefined>(undefined);

  // Connection refs
  const peerRef = React.useRef<Peer | null>(null);
  const connRef = React.useRef<DataConnection | null>(null);
  const isSyncingRef = React.useRef<boolean>(false);

  // Cleanup effect
  React.useEffect(() => {
    return () => {
      if (connRef.current) connRef.current.close();
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  const sendP2PMessage = (data: any) => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send(data);
    }
  };

  const handlePeerDisconnect = () => {
    addLog("Opponent disconnected. Reverted to local pass-and-play.", "sys");
    setP2pStatus("disconnected");
    setPeerId(null);
    setMyPlayerNumber(0);
    setP1Ready(false);
    setP2Ready(false);
    setPeerP1Slots(undefined);
    setPeerP1Placements(undefined);
    setPeerP2Slots(undefined);
    setPeerP2Placements(undefined);
  };

  const onHostGame = () => {
    setP2pStatus("connecting");
    setMyPlayerNumber(1);

    const shortCode = Math.floor(1000 + Math.random() * 9000);
    const pid = `pchess-${shortCode}`;

    const peer = new Peer(pid, {
      host: "0.peerjs.com",
      secure: true,
      port: 443
    });

    peerRef.current = peer;

    peer.on("open", (id) => {
      setPeerId(id);
    });

    peer.on("connection", (conn) => {
      connRef.current = conn;
      setP2pStatus("connected");

      conn.on("open", () => {
        conn.send({ type: "init_p2p", myPlayerNumber: 2 });
      });

      conn.on("data", (data) => {
        handleData(data);
      });

      conn.on("close", () => {
        handlePeerDisconnect();
      });

      conn.on("error", () => {
        handlePeerDisconnect();
      });
    });

    peer.on("error", (err) => {
      console.error(err);
      setP2pStatus("disconnected");
      setMyPlayerNumber(0);
      setPeerId(null);
    });
  };

  const onJoinGame = (hostId: string) => {
    setP2pStatus("connecting");
    setMyPlayerNumber(2);

    const peer = new Peer({
      host: "0.peerjs.com",
      secure: true,
      port: 443
    });

    peerRef.current = peer;

    peer.on("open", () => {
      const conn = peer.connect(hostId);
      connRef.current = conn;

      conn.on("open", () => {
        setP2pStatus("connected");
      });

      conn.on("data", (data) => {
        handleData(data);
      });

      conn.on("close", () => {
        handlePeerDisconnect();
      });

      conn.on("error", () => {
        handlePeerDisconnect();
      });
    });

    peer.on("error", (err) => {
      console.error(err);
      setP2pStatus("disconnected");
      setMyPlayerNumber(0);
    });
  };

  const onDisconnectP2P = () => {
    if (connRef.current) connRef.current.close();
    if (peerRef.current) peerRef.current.destroy();
    setP2pStatus("disconnected");
    setPeerId(null);
    setMyPlayerNumber(0);
    setP1Ready(false);
    setP2Ready(false);
    setPeerP1Slots(undefined);
    setPeerP1Placements(undefined);
    setPeerP2Slots(undefined);
    setPeerP2Placements(undefined);
  };

  const handleSyncSetupData = (slots: string[], placements: { col: number; row: number }[]) => {
    if (myPlayerNumber === 1) {
      setLocalP1Slots(slots);
      setLocalP1Placements(placements);
      sendP2PMessage({ type: "setup_sync", player: 1, slots, placements });
    } else if (myPlayerNumber === 2) {
      setLocalP2Slots(slots);
      setLocalP2Placements(placements);
      sendP2PMessage({ type: "setup_sync", player: 2, slots, placements });
    }
  };

  const onToggleReady = () => {
    if (myPlayerNumber === 1) {
      const next = !p1Ready;
      setP1Ready(next);
      sendP2PMessage({ type: "ready", player: 1, ready: next });
    } else if (myPlayerNumber === 2) {
      const next = !p2Ready;
      setP2Ready(next);
      sendP2PMessage({ type: "ready", player: 2, ready: next });
    }
  };

  const handleData = (data: any) => {
    if (!data || typeof data !== "object") return;

    switch (data.type) {
      case "init_p2p":
        setMyPlayerNumber(data.myPlayerNumber);
        setP2pStatus("connected");
        break;

      case "setup_sync":
        if (data.player === 1) {
          setPeerP1Slots(data.slots);
          setPeerP1Placements(data.placements);
        } else if (data.player === 2) {
          setPeerP2Slots(data.slots);
          setPeerP2Placements(data.placements);
        }
        break;

      case "ready":
        if (data.player === 1) {
          setP1Ready(data.ready);
        } else if (data.player === 2) {
          setP2Ready(data.ready);
        }
        break;

      case "start_game":
        isSyncingRef.current = true;
        setGameState(data.gameState);
        setScreen("game");
        setTurnNotice(1);
        break;

      case "game_state_sync":
        isSyncingRef.current = true;
        const prevPlayer = gameState.currentPlayer;
        const nextPlayer = data.gameState.currentPlayer;
        setGameState(data.gameState);
        if (prevPlayer !== nextPlayer) {
          setTurnNotice(nextPlayer);
        }
        break;

      case "chance_popup":
        setChancePopup(data.chancePopup);
        break;

      case "restart_game":
        setP1Ready(false);
        setP2Ready(false);
        setPeerP1Slots(undefined);
        setPeerP1Placements(undefined);
        setPeerP2Slots(undefined);
        setPeerP2Placements(undefined);
        setScreen("setup");
        break;

      default:
        break;
    }
  };

  // Broadcast gameState changes
  React.useEffect(() => {
    if (p2pStatus === "connected" && myPlayerNumber !== 0) {
      if (isSyncingRef.current) {
        isSyncingRef.current = false;
        return;
      }
      sendP2PMessage({ type: "game_state_sync", gameState });
    }
  }, [gameState, p2pStatus, myPlayerNumber]);

  // Broadcast chancePopup rolls
  React.useEffect(() => {
    if (p2pStatus === "connected" && myPlayerNumber !== 0) {
      if (gameState.currentPlayer === myPlayerNumber) {
        sendP2PMessage({ type: "chance_popup", chancePopup });
      }
    }
  }, [chancePopup, p2pStatus, myPlayerNumber, gameState.currentPlayer]);

  // Host setup ready checker to launch game
  React.useEffect(() => {
    if (p2pStatus === "connected" && myPlayerNumber === 1 && p1Ready && p2Ready) {
      const p1Active = localP1Slots.map((sp, idx) => ({ sp, idx })).filter(item => item.sp !== "");
      const p2Active = peerP2Slots ? peerP2Slots.map((sp, idx) => ({ sp, idx })).filter(item => item.sp !== "") : [];

      const p1Team = p1Active.map(item => ({
        species: item.sp,
        col: localP1Placements[item.idx].col,
        row: localP1Placements[item.idx].row
      }));
      const p2Team = p2Active.map(item => ({
        species: item.sp,
        col: peerP2Placements ? peerP2Placements[item.idx].col : 0,
        row: peerP2Placements ? peerP2Placements[item.idx].row : 0
      }));

      let nextId = 1;
      const initialPokemon: PokemonEntity[] = [];

      const buildEntity = (species: string, player: number, col: number, row: number): PokemonEntity => {
        const db = DB[species];
        const isEgg = !!db.legendary || species === "Aerodactyl";
        const startHp = species === "Aerodactyl" ? 5 : (isEgg ? 10 : db.hp);
        return {
          id: nextId++,
          species,
          player,
          col,
          row,
          hp: startHp,
          maxHp: startHp,
          atk: db.atk,
          def: db.def || 0,
          fainted: false,
          exp: 0,
          status: null,
          modifiers: [],
          heldItem: null,
          isEgg,
          hasHatched: !isEgg,
          rotation: 0,
          hatchProgress: 0,
          skillUses: {},
          skillCooldowns: {}
        };
      };

      p1Team.forEach(item => initialPokemon.push(buildEntity(item.species, 1, item.col, item.row)));
      p2Team.forEach(item => initialPokemon.push(buildEntity(item.species, 2, item.col, item.row)));

      const startingPedestals: Pedestal[] = [
        { player: 1, col: 5, row: 0, hp: 10, maxHp: 10 },
        { player: 2, col: 5, row: 10, hp: 10, maxHp: 10 }
      ];

      const initialGameState: GameState = {
        turn: 1,
        phase: 1,
        currentPlayer: 1,
        energy: { 1: 3, 2: 3 },
        maxEnergy: { 1: 3, 2: 3 },
        movePoints: { 1: 3, 2: 3 },
        consumablesUsedThisTurn: { total: 0, powerHerb: 0 },
        weather: { type: null, duration: 0 },
        pokemon: initialPokemon,
        pedestals: startingPedestals,
        logs: [
          {
            id: "init",
            msg: "Game started! Player 1 goes first. Command your Pokémon to attack the enemy Pedestal!",
            type: "sys",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
        ],
        players: {
          1: { gold: 5, freeExp: 0, inventory: { held: [], consumable: [] }, hatchPools: {} },
          2: { gold: 5, freeExp: 0, inventory: { held: [], consumable: [] }, hatchPools: {} }
        },
        selectedCell: null,
        highlightedCells: [],
        actionMode: null,
        skillMenuFor: null
      };

      setWinner(null);
      setGameState(initialGameState);
      setScreen("game");
      setTurnNotice(1);

      sendP2PMessage({ type: "start_game", gameState: initialGameState });
    }
  }, [p1Ready, p2Ready, p2pStatus, myPlayerNumber]);

  React.useEffect(() => {
    if (turnNotice !== null) {
      const timer = setTimeout(() => {
        setTurnNotice(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [turnNotice]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (screen !== "game") return;

      const key = e.key.toLowerCase();

      // CLOSE TURN NOTICE (Q)
      if (key === "q" && turnNotice !== null) {
        e.preventDefault();
        setTurnNotice(null);
        return;
      }

      // Block keyboard hotkeys when it is the opponent's turn in P2P mode
      if (p2pStatus === "connected" && myPlayerNumber !== 0 && gameState.currentPlayer !== myPlayerNumber) {
        return;
      }

      // END TURN (E)
      if (key === "e") {
        e.preventDefault();
        handleEndTurn();
        return;
      }

      // ROTATE SKILL (R)
      if (key === "r") {
        e.preventDefault();
        if (gameState.selectedCell) {
          const selectedPk = pkAt(gameState.selectedCell.col, gameState.selectedCell.row, gameState.pokemon);
          if (selectedPk && selectedPk.player === gameState.currentPlayer) {
            handleRotateSkill(selectedPk.id);
          }
        }
        return;
      }

      // BACKPACK (B)
      if (key === "b") {
        e.preventDefault();
        if (inventoryOpen) {
          setInventoryOpen(false);
        } else if (!shopOpen) {
          setInventoryOpen(true);
        }
        return;
      }

      // SHOP (F)
      if (key === "f") {
        e.preventDefault();
        if (shopOpen) {
          setShopOpen(false);
        } else if (!inventoryOpen) {
          setShopOpen(true);
        }
        return;
      }

      // TYPE CHART (C)
      if (key === "c") {
        e.preventDefault();
        setTypeChartOpen(prev => !prev);
        return;
      }

      // Hotkeys 1-6 fast selection
      if (key >= "1" && key <= "6") {
        const idx = parseInt(key, 10) - 1;
        const myTeam = gameState.pokemon.filter(
          p => p.player === gameState.currentPlayer &&
            p.species !== "Clear Bell" &&
            p.species !== "Tidal Bell" &&
            p.species !== "Tidal bell"
        );
        const targetPk = myTeam[idx];
        if (targetPk) {
          e.preventDefault();
          setGameState(prev => ({
            ...prev,
            selectedCell: { col: targetPk.col, row: targetPk.row },
            actionMode: null,
            highlightedCells: []
          }));
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [screen, gameState, inventoryOpen, shopOpen, turnNotice, p2pStatus, myPlayerNumber]);

  // Log logger Helper
  const addLog = (msg: string, type: "sys" | "atk" | "heal" | "combat" | "" = "") => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logId = Math.random().toString(36).substring(2, 9);
    const newEntry: BattleLogEntry = { id: logId, msg, type, timestamp: timeStr };
    setGameState(prev => ({
      ...prev,
      logs: [newEntry, ...prev.logs].slice(0, 50)
    }));
  };

  const applyTidalBellReduction = (target: PokemonEntity, initialDmg: number, list: PokemonEntity[]): number => {
    if (initialDmg <= 0) return 0;
    if (target.species === "Lugia" || target.species === "Clear Bell" || target.species === "Tidal Bell" || target.species === "Tidal bell") {
      return initialDmg;
    }

    // Find a friendly active Tidal Bell within 3x3 range
    const friendlyBell = list.find(bell => {
      if ((bell.species !== "Tidal Bell" && bell.species !== "Tidal bell") || bell.fainted || bell.player !== target.player) {
        return false;
      }
      const dc = Math.abs(bell.col - target.col);
      const dr = Math.abs(bell.row - target.row);
      return dc <= 1 && dr <= 1;
    });

    if (!friendlyBell) return initialDmg;

    // Reduce damage by 2
    const reducedDmg = Math.max(0, initialDmg - 2);
    const diff = initialDmg - reducedDmg;

    if (diff > 0) {
      friendlyBell.hp = Math.max(0, friendlyBell.hp - 1);
      addLog(`🔔 Tidal Bell protects ${target.species}! Damage reduced by ${diff}! (Tidal Bell has ${friendlyBell.hp} charges remaining)`, "heal");
      if (friendlyBell.hp <= 0) {
        friendlyBell.fainted = true;
        addLog(`🔔 The Tidal Bell has shattered!`, "sys");
      }
    }

    return reducedDmg;
  };

  // Turn initialization rosters
  const handleStartGame = (
    p1Team: { species: string; col: number; row: number }[],
    p2Team: { species: string; col: number; row: number }[]
  ) => {
    let nextId = 1;
    const initialPokemon: PokemonEntity[] = [];

    const buildEntity = (species: string, player: number, col: number, row: number): PokemonEntity => {
      const db = DB[species];
      const isEgg = !!db.legendary || species === "Aerodactyl";
      const startHp = species === "Aerodactyl" ? 5 : (isEgg ? 10 : db.hp);
      return {
        id: nextId++,
        species,
        player,
        col,
        row,
        hp: startHp,
        maxHp: startHp,
        atk: db.atk,
        def: db.def || 0,
        fainted: false,
        exp: 0,
        status: null,
        modifiers: [],
        heldItem: null,
        isEgg,
        hasHatched: !isEgg,
        rotation: 0,
        hatchProgress: 0,
        skillUses: {},
        skillCooldowns: {}
      };
    };

    p1Team.forEach(item => initialPokemon.push(buildEntity(item.species, 1, item.col, item.row)));
    p2Team.forEach(item => initialPokemon.push(buildEntity(item.species, 2, item.col, item.row)));

    const startingPedestals: Pedestal[] = [
      { player: 1, col: Math.floor(gameConfig.boardSize / 2), row: 0, hp: 10, maxHp: 10 },
      { player: 2, col: Math.floor(gameConfig.boardSize / 2), row: gameConfig.boardSize - 1, hp: 10, maxHp: 10 }
    ];

    setWinner(null);
    setGameState({
      turn: 1,
      phase: 1,
      currentPlayer: 1,
      energy: { 1: 3, 2: 3 },
      maxEnergy: { 1: 3, 2: 3 },
      movePoints: { 1: 3, 2: 3 },
      consumablesUsedThisTurn: { total: 0, powerHerb: 0 },
      weather: { type: null, duration: 0 },
      pokemon: initialPokemon,
      pedestals: startingPedestals,
      logs: [
        {
          id: "init",
          msg: "Game started! Player 1 goes first. Command your Pokémon to attack the enemy Pedestal!",
          type: "sys",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ],
      players: {
        1: { gold: 5, freeExp: 0, inventory: { held: [], consumable: [] }, hatchPools: {} },
        2: { gold: 5, freeExp: 0, inventory: { held: [], consumable: [] }, hatchPools: {} }
      },
      selectedCell: null,
      highlightedCells: [],
      actionMode: null,
      skillMenuFor: null
    });

    setScreen("game");
    setTurnNotice(1);
  };

  const getAliveCount = (player: number, list: PokemonEntity[]) => {
    return list.filter(p => p.player === player && !p.fainted).length;
  };

  const checkWinner = (pedestals: Pedestal[], list: PokemonEntity[]) => {
    const p1Ped = pedestals.find(pd => pd.player === 1);
    const p2Ped = pedestals.find(pd => pd.player === 2);

    const p1NoMon = getAliveCount(1, list) === 0;
    const p1PedDestroyed = p1Ped ? p1Ped.hp <= 0 : true;

    const p2NoMon = getAliveCount(2, list) === 0;
    const p2PedDestroyed = p2Ped ? p2Ped.hp <= 0 : true;

    if (p1PedDestroyed || p1NoMon) {
      const reason = p1PedDestroyed
        ? "Player 1's Pedestal was destroyed!"
        : "Player 1 has no surviving Pokémon left!";
      setWinner({ player: 2, reason });
      setScreen("end");
    } else if (p2PedDestroyed || p2NoMon) {
      const reason = p2PedDestroyed
        ? "Player 2's Pedestal was destroyed!"
        : "Player 2 has no surviving Pokémon left!";
      setWinner({ player: 1, reason });
      setScreen("end");
    }
  };

  // Status effects checker
  const verifyActionStatus = (p: PokemonEntity): boolean => {
    if (!p.status || p.fainted) return true;

    if (p.status === "freeze") {
      addLog(`${p.species} is frozen solid and cannot act!`, "combat");
      return false;
    }
    if (p.status === "sleep") {
      const wake = Math.random() < 0.5;
      if (wake) {
        p.status = null;
        addLog(`${p.species} woke up from sleep!`, "heal");
        return true;
      } else {
        addLog(`${p.species} is fast asleep...`, "combat");
        return false;
      }
    }
    if (p.status === "paralysis") {
      if (Math.random() < 0.3) {
        addLog(`${p.species} is fully paralyzed and cannot move!`, "combat");
        return false;
      }
    }
    if (p.status === "confuse") {
      if (Math.random() < 0.25) {
        p.hp = Math.max(0, p.hp - 1);
        addLog(`${p.species} got confused and hurt itself! (-1 HP)`, "atk");
        if (p.hp <= 0) {
          p.fainted = true;
          addLog(`${p.species} fainted in confusion!`, "combat");
        }
        return false;
      }
    }
    return true;
  };

  const showChanceRoll = (statusType: string, chance: number) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const threshold = Math.floor(chance * 20);
    const success = roll <= threshold;
    setChancePopup({ statusType, chance, roll, success });
    setTimeout(() => setChancePopup(null), 3500);
    return success;
  };

  // Executing Action Commands
  const handleCellClick = (col: number, row: number) => {
    if (p2pStatus === "connected" && myPlayerNumber !== 0 && gameState.currentPlayer !== myPlayerNumber) {
      return;
    }
    const list = [...gameState.pokemon];
    const peds = [...gameState.pedestals];
    const mode = gameState.actionMode;

    // A. EQUIP ITEM MODE
    if (mode && mode.type === "equip" && mode.item) {
      const p = list.find(x => x.col === col && x.row === row && !x.fainted);
      if (p && p.player === gameState.currentPlayer) {
        const itemObj = ITEMS[mode.item];
        const stateCopy = { ...gameState.players[gameState.currentPlayer] };

        let nextUsed = gameState.consumablesUsedThisTurn || { total: 0, powerHerb: 0 };
        if (mode.itemType !== "held") {
          const used = gameState.consumablesUsedThisTurn || { total: 0, powerHerb: 0 };
          if (used.total >= 2) {
            addLog("❌ Item usage failed! Limit of 2 consumables per turn reached.", "sys");
            setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
            return;
          }
          if (mode.item === "Power Herb" && used.powerHerb >= 1) {
            addLog("❌ Item usage failed! Power Herb is limited to 1 use per turn.", "sys");
            setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
            return;
          }

          // Consume immediately
          if (mode.item === "Sitrus Berry") p.hp = Math.min(p.maxHp, p.hp + 2);
          if (mode.item === "Berry Juice") p.hp = Math.min(p.maxHp, p.hp + 1);
          if (mode.item === "Lum Berry" || mode.item === "Mental Herb") p.status = null;
          if (mode.item === "White Herb") p.modifiers = [];
          if (mode.item === "Power Herb") {
            p.modifiers.push({ stat: "atk", amount: 1, duration: 2, source: "Power Herb" });
          }
          const idx = stateCopy.inventory.consumable.indexOf(mode.item);
          if (idx > -1) stateCopy.inventory.consumable.splice(idx, 1);
          addLog(`${p.species} consumed ${mode.item}!`, "heal");

          nextUsed = {
            total: used.total + 1,
            powerHerb: used.powerHerb + (mode.item === "Power Herb" ? 1 : 0)
          };
        } else {
          // If already has item, put back to inventory
          if (p.heldItem) {
            stateCopy.inventory.held.push(p.heldItem);
          }
          p.heldItem = mode.item;
          const idx = stateCopy.inventory.held.indexOf(mode.item);
          if (idx > -1) stateCopy.inventory.held.splice(idx, 1);
          addLog(`${p.species} equipped ${mode.item}!`, "heal");
        }

        setGameState(prev => ({
          ...prev,
          pokemon: list,
          actionMode: null,
          highlightedCells: [],
          consumablesUsedThisTurn: nextUsed,
          players: {
            ...prev.players,
            [gameState.currentPlayer]: stateCopy
          }
        }));
      } else {
        addLog("Target aborted. Please click your own active Pokemon to apply item.", "sys");
        setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
      }
      return;
    }

    // B. SELECTION & NAVIGATION MOVES/ATTACKS
    const isLit = gameState.highlightedCells.some(h => h.col === col && h.row === row);

    if (mode && isLit) {
      const activeId = mode.pokeId!;
      const actor = list.find(pk => pk.id === activeId);
      if (!actor) return;
      const dbEntry = DB[actor.species];

      if (actor.isEgg && !actor.hasHatched) {
        addLog("Dormant eggs cannot perform actions!", "sys");
        setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
        return;
      }

      if (!verifyActionStatus(actor)) {
        setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
        return;
      }

      // 1. Move Execution
      if (mode.type === "move") {
        const teamMP = gameState.movePoints?.[gameState.currentPlayer] ?? 0;
        const unitUsedMP = actor.hasUsedMP ?? false;

        let usesMP = false;
        if (teamMP > 0 && !unitUsedMP) {
          usesMP = true;
        }

        let cost = 1;
        let consumesMP = usesMP;
        if (dbEntry && dbEntry.ability === "Swift Swim" && (gameState.weather.type === "Rain" || gameState.weather.type === "Heavy Rain")) {
          cost = 0;
          consumesMP = false;
          addLog(`🌊 Swift Swim! ${actor.species} moved for 0 energy/MP cost in the rain.`, "heal");
        } else if (dbEntry && dbEntry.ability === "Chlorophyll" && (gameState.weather.type === "Sunlight" || gameState.weather.type === "Harsh Sunlight")) {
          cost = 0;
          consumesMP = false;
          addLog(`☀️ Chlorophyll! ${actor.species} moved for 0 energy/MP cost in the sun.`, "heal");
        } else if (actor.heldItem === "Smoke Ball" && actor.hasAttacked) {
          cost = 0;
          consumesMP = false;
          addLog(`💨 Smoke Ball triggered! ${actor.species} retreated for 0 energy/MP cost.`, "heal");
        } else if (usesMP) {
          cost = 0;
        } else if (actor.heldItem === "Quick Claw" && !actor.hasMovedEver) {
          cost = 0;
          actor.hasMovedEver = true;
          addLog(`⚡ Quick Claw triggered! ${actor.species} moved for 0 energy cost.`, "heal");
        }

        actor.col = col;
        actor.row = row;
        actor.hasMoved = true;
        if (consumesMP) {
          actor.hasUsedMP = true;
        }

        if (dbEntry && dbEntry.ability === "Speed Boost") {
          if (!actor.modifiers) actor.modifiers = [];
          actor.modifiers.push({ stat: "atk", amount: 1, duration: 1, source: "Speed Boost" });
          addLog(`⚡ Speed Boost! ${actor.species} gained +1 Atk for 1 turn after moving!`, "heal");
        }

        // Stepped on hazards check
        if (gameState.hazards && gameState.hazards.length > 0) {
          const activeHazards = gameState.hazards.filter(h => h.col === col && h.row === row && h.player !== actor.player && h.duration > 0);
          if (activeHazards.length > 0 && dbEntry && dbEntry.ability !== "Levitate") {
            let hazardDmg = 0;
            activeHazards.forEach(h => {
              hazardDmg += 2;
              addLog(`💥 Hazard! ${actor.species} stepped on enemy ${h.type === "spikes" ? "Spikes" : "Stealth Rock"} and took 2 damage!`, "combat");
            });
            actor.hp = Math.max(0, actor.hp - hazardDmg);
            actor.damageReceivedThisTurn = (actor.damageReceivedThisTurn || 0) + hazardDmg;
            if (actor.hp <= 0) {
              actor.fainted = true;
              addLog(`💀 ${actor.species} fainted to battlefield hazards!`, "sys");
            }
          }
        }

        addLog(`${actor.species} moved to ${String.fromCharCode(65 + col)}${row + 1} (${consumesMP ? "used 1 MP" : `cost ${cost} Energy`})`, "sys");

        setGameState(prev => {
          const nextMP = { ...(prev.movePoints || { 1: 3, 2: 3 }) };
          if (consumesMP) {
            nextMP[gameState.currentPlayer] = Math.max(0, nextMP[gameState.currentPlayer] - 1);
          }
          return {
            ...prev,
            pokemon: list,
            selectedCell: { col, row },
            actionMode: null,
            highlightedCells: [],
            movePoints: nextMP,
            energy: {
              ...prev.energy,
              [gameState.currentPlayer]: Math.max(0, prev.energy[gameState.currentPlayer] - cost)
            }
          };
        });
        return;
      }

      // 2. Attack Melee Execution
      if (mode.type === "attack") {
        const target = pkAt(col, row, list);
        const targetPed = pedAt(col, row, peds);

        if (target) {
          const bonus = typeBonus(actor, target);
          const rawAtk = getModifiedStat(actor, "atk", list, { action: "melee", isSkill: false, target, weather: gameState.weather.type });
          const opponentDef = getModifiedStat(target, "def", list, { weather: gameState.weather.type });

          let abilityAtkBonus = 0;
          const actorDb = DB[actor.species];
          if (actorDb && actor.hp <= actor.maxHp * 0.5) {
            if (actorDb.ability === "Overgrow" && (actorDb.t1 === "Grass" || actorDb.t2 === "Grass")) {
              abilityAtkBonus += 1;
              addLog(`✨ Overgrow: ${actor.species}'s Grass melee damage increased!`, "heal");
            }
            if (actorDb.ability === "Blaze" && (actorDb.t1 === "Fire" || actorDb.t2 === "Fire")) {
              abilityAtkBonus += 1;
              addLog(`🔥 Blaze: ${actor.species}'s Fire melee damage increased!`, "heal");
            }
            if (actorDb.ability === "Torrent" && (actorDb.t1 === "Water" || actorDb.t2 === "Water")) {
              abilityAtkBonus += 1;
              addLog(`🌊 Torrent: ${actor.species}'s Water melee damage increased!`, "heal");
            }
          }

          let netDmg = Math.max(0, Math.floor(rawAtk / 2) + bonus + abilityAtkBonus - opponentDef);

          if (actor.status === "burn") {
            netDmg = Math.max(0, netDmg - 1);
          }

          const targetDb = DB[target.species];
          if (targetDb) {
            if (targetDb.ability === "Multiscale" && target.hp === target.maxHp) {
              netDmg = Math.max(0, netDmg - 3);
              addLog(`🛡️ Multiscale! ${target.species} reduced the damage by 3.`, "combat");
            }
            if (targetDb.ability === "Sheer Force" && actor.hp < target.hp) {
              netDmg = Math.max(0, netDmg - 1);
              addLog(`🛡️ Sheer Force! ${target.species} took 1 less damage from enemy with lower HP.`, "combat");
            }
            if (targetDb.ability === "Rock Head" && netDmg === 1) {
              netDmg = 0;
              addLog(`🛡️ Rock Head! Negated basic contact damage of 1!`, "combat");
            }
          }

          netDmg = applyTidalBellReduction(target, netDmg, list);

          const startingHp = target.hp;
          target.hp = Math.max(0, target.hp - netDmg);
          target.damageReceivedThisTurn = (target.damageReceivedThisTurn || 0) + netDmg;
          addLog(`⚔️ ${actor.species} attacked ${target.species} for ${netDmg} damage!`, "combat");

          if (target.hp <= 0 && targetDb && targetDb.ability === "Sturdy" && startingHp === target.maxHp) {
            target.hp = 1;
            addLog(`🛡️ Sturdy! ${target.species} survived the lethal blow with 1 HP!`, "combat");
          }

          if (targetDb) {
            // Gengar Cursed Body контакт
            if (targetDb.ability === "Cursed Body" && !actor.fainted) {
              if (Math.random() < 0.3) {
                const actorDb = DB[actor.species];
                const skillToDisable = actorDb?.skills?.[0]?.skillName;
                if (skillToDisable) {
                  if (!actor.skillCooldowns) actor.skillCooldowns = {};
                  actor.skillCooldowns[skillToDisable] = 2;
                  addLog(`👻 Cursed Body! ${target.species} disabled ${actor.species}'s ${skillToDisable} for 2 turns!`, "combat");
                }
              }
            }

            // Static contact paralyze
            if (targetDb.ability === "Static" && !actor.fainted) {
              if (Math.random() < 0.3 && actor.status !== "paralysis" && canInflictStatus(actor, "paralysis")) {
                actor.status = "paralysis";
                actor.statusTurns = 0;
                addLog(`⚡ Static! ${actor.species} got Paralyzed by contacting ${target.species}!`, "combat");
                if (actorDb && actorDb.ability === "Synchronize" && canInflictStatus(target, "paralysis")) {
                  target.status = "paralysis";
                  target.statusTurns = 1;
                  addLog(`💫 Synchronize! Reflected PARALYSIS back onto ${target.species}!`, "combat");
                }
              }
            }
            // Effect Spore
            if (targetDb.ability === "Effect Spore" && !actor.fainted) {
              if (Math.random() < 0.3 && !actor.status) {
                const effect = Math.random() < 0.5 ? "poison" : "sleep";
                if (canInflictStatus(actor, effect)) {
                  actor.status = effect;
                  actor.statusTurns = 0;
                  addLog(`🍄 Effect Spore! ${actor.species} got ${effect.toUpperCase()} by touching ${target.species}!`, "combat");
                  if (actorDb && actorDb.ability === "Synchronize" && canInflictStatus(target, effect)) {
                    target.status = effect;
                    target.statusTurns = 1;
                    addLog(`💫 Synchronize! Reflected ${effect.toUpperCase()} back onto ${target.species}!`, "combat");
                  }
                }
              }
            }
            // Cute Charm
            if (targetDb.ability === "Cute Charm" && !actor.fainted) {
              if (Math.random() < 0.3 && actor.status !== "confuse" && canInflictStatus(actor, "confuse")) {
                actor.status = "confuse";
                actor.statusTurns = 0;
                addLog(`💖 Cute Charm! ${actor.species} fell in love (CONFUSED) with ${target.species}!`, "combat");
                if (actorDb && actorDb.ability === "Synchronize" && canInflictStatus(target, "confuse")) {
                  target.status = "confuse";
                  target.statusTurns = 1;
                  addLog(`💫 Synchronize! Reflected CONFUSE back onto ${target.species}!`, "combat");
                }
              }
            }
            // Flame Body
            if (targetDb.ability === "Flame Body" && !actor.fainted) {
              if (Math.random() < 0.3 && actor.status !== "burn" && canInflictStatus(actor, "burn")) {
                actor.status = "burn";
                actor.statusTurns = 0;
                addLog(`🔥 Flame Body! ${actor.species} got Burned by touching ${target.species}!`, "combat");
                if (actorDb && actorDb.ability === "Synchronize" && canInflictStatus(target, "burn")) {
                  target.status = "burn";
                  target.statusTurns = 1;
                  addLog(`💫 Synchronize! Reflected BURN back onto ${target.species}!`, "combat");
                }
              }
            }
            // Poison Point
            if (targetDb.ability === "Poison Point" && !actor.fainted) {
              if (Math.random() < 0.3 && actor.status !== "poison" && canInflictStatus(actor, "poison")) {
                actor.status = "poison";
                actor.statusTurns = 0;
                addLog(`☠️ Poison Point! ${actor.species} got Poisoned by touching ${target.species}!`, "combat");
                if (actorDb && actorDb.ability === "Synchronize" && canInflictStatus(target, "poison")) {
                  target.status = "poison";
                  target.statusTurns = 1;
                  addLog(`💫 Synchronize! Reflected POISON back onto ${target.species}!`, "combat");
                }
              }
            }
            // Rough Skin
            if (targetDb.ability === "Rough Skin" && !actor.fainted) {
              actor.hp = Math.max(0, actor.hp - 1);
              addLog(`💥 Rough Skin! ${actor.species} takes -1 HP from contact with ${target.species}.`, "combat");
              if (actor.hp <= 0) {
                actor.fainted = true;
                addLog(`💀 ${actor.species} fainted!`, "sys");
              }
            }
          }

          // Rocky Helmet feedback
          if (target.heldItem === "Rocky Helmet" && !actor.fainted) {
            actor.hp = Math.max(0, actor.hp - 1);
            addLog(`💥 Helmet recoil! ${actor.species} takes -1 HP from Rocky Helmet.`, "combat");
            if (actor.hp <= 0) {
              actor.fainted = true;
              addLog(`💀 ${actor.species} fainted from recoil combat damage!`, "sys");
            }
          }

          // Focus Band checks
          if (target.hp <= 0 && target.heldItem === "Focus Band" && !target.focusBandUsed) {
            target.hp = 1;
            target.focusBandUsed = true;
            addLog(`❤️ Focus Band triggered! ${target.species} survived on 1 HP!`, "heal");
          }

          // Leftovers/Shell Bell
          if (actor.heldItem === "Shell Bell") {
            setGameState(prev => ({
              ...prev,
              energy: {
                ...prev.energy,
                [gameState.currentPlayer]: Math.min(prev.maxEnergy[gameState.currentPlayer], prev.energy[gameState.currentPlayer] + 1)
              }
            }));
            addLog(`🍏 Shell Bell restored +1 Energy.`, "heal");
          }

          if (target.hp <= 0) {
            target.fainted = true;
            addLog(`💀 ${target.species} has fainted!`, "sys");
            if (actor.heldItem === "Lucky Egg") {
              actor.exp += 1;
              addLog(`🎓 Lucky Egg bonus! ${actor.species} got +1 EXP.`, "heal");
            }
          }
        } else if (targetPed) {
          // Hit Pedestal
          let rawAtk = getModifiedStat(actor, "atk", list, { action: "melee", isSkill: false });
          if (actor.status === "burn") rawAtk = Math.max(0, rawAtk - 1);

          // Apply pedestal defense of 1 and cap maximum damage at 1 per hit
          const pedDmg = Math.min(1, Math.max(0, Math.floor(rawAtk / 2) - 1));
          targetPed.hp = Math.max(0, targetPed.hp - pedDmg);
          addLog(`⚔️ ${actor.species} struck enemy Pedestal for ${pedDmg} damage! (Pedestal has 1 Def and takes max 1 damage)`, "combat");
        }

        // Life Orb recoil
        if (actor.heldItem === "Life Orb") {
          actor.hp = Math.max(0, actor.hp - 1);
          addLog(`Life Orb drains 1 HP from ${actor.species}.`, "atk");
          if (actor.hp <= 0) {
            actor.fainted = true;
            addLog(`${actor.species} fainted from Life Orb decay.`, "sys");
          }
        }

        // Add 1 EXP
        actor.exp += 1;
        actor.hasAttacked = true;

        const nextPokemon = [...list];
        const nextPedestals = [...peds];
        checkWinner(nextPedestals, nextPokemon);

        setGameState(prev => ({
          ...prev,
          pokemon: nextPokemon,
          pedestals: nextPedestals,
          actionMode: null,
          highlightedCells: [],
          energy: {
            ...prev.energy,
            [gameState.currentPlayer]: Math.max(0, prev.energy[gameState.currentPlayer] - 1)
          }
        }));
        return;
      }

      // 3. Skill Casting Execution
      if (mode.type === "skill" && typeof mode.skillIdx !== "undefined") {
        const dbEntry = DB[actor.species];
        let skill = getSkillData(dbEntry, mode.skillIdx);

        if (actor.species === "Celebi") {
          if (!actor.modifiers) actor.modifiers = [];
          actor.modifiers.push({ stat: "atk", amount: -2, duration: 1, source: "Celebi backlash" });
          addLog(`🍃 Celebi suffered a -2 ATK debuff for this turn!`, "sys");
        }

        if (!actor.skillUses) actor.skillUses = {};
        if ((actor.skillUses[skill.skillName] || 0) > 0) {
          addLog(`❌ ${actor.species} has already used ${skill.skillName} this turn!`, "sys");
          setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
          return;
        }

        let targetType = getSkillTargetType(skill, dbEntry);
        const isWeatherSkill = ["Sunny Day", "Rain Dance", "Hail", "Sandstorm"].includes(skill.skillName);
        const isInstantSkill = (
          skill.skillDesc === "All" ||
          targetType === "self" ||
          targetType === "all_allies" ||
          targetType === "all_ice" ||
          skill.skillDesc?.toLowerCase() === "self" ||
          isWeatherSkill
        ) && skill.skillName !== "Transform";

        if (isInstantSkill) {
          executeInstantSkill(actor, skill, mode.skillIdx);
          return;
        }

        if (skill.skillName === "Metronome") {
          const pool: any[] = [];
          Object.values(DB).forEach(entry => {
            if (entry.skills && Array.isArray(entry.skills)) {
              entry.skills.forEach(sk => {
                if (sk.skillName && sk.skillName !== "Metronome" && !pool.some(k => k.skillName === sk.skillName)) {
                  pool.push(sk);
                }
              });
            } else if (entry.skillName && entry.skillName !== "Metronome") {
              pool.push({
                skillName: entry.skillName,
                skillDesc: entry.skillDesc || "",
                skillDmg: entry.skillDmg,
                skillRaw: entry.skillRaw,
                skillCost: entry.skillCost || 2
              });
            }
          });
          const randomSkill = pool[Math.floor(Math.random() * pool.length)];
          if (randomSkill) {
            addLog(`🎲 Metronome! ${actor.species} randomly chose to call: ${randomSkill.skillName}!`, "sys");
            skill = randomSkill;
          }
        }

        let scCost = skill.skillCost || dbEntry.skillCost || 2;

        if (actor.heldItem === "Miracle Seed" && !actor.hasUsedSkill) {
          scCost = Math.max(0, scCost - 1);
        }

        targetType = getSkillTargetType(skill, dbEntry);
        const shape = parseSkillShape(dbEntry, actor, mode.skillIdx);
        const isAoE = shape.type === "aoe" || shape.type === "cone" || (shape.type === "line" && shape.range && shape.range > 1);

        let affectedCells: { col: number; row: number }[] = [];
        if (isAoE) {
          if (shape.type === "aoe" && shape.range) {
            affectedCells = adjCells(col, row, shape.radius || 1, true, gameConfig.boardSize);
            affectedCells.push({ col, row });
          } else {
            affectedCells = getSkillShapeCells(actor, list, peds, mode.skillIdx, gameConfig.boardSize);
          }
        } else {
          affectedCells = [{ col, row }];
        }

        const pressureUnit = list.find(p => {
          if (p.player === actor.player || p.fainted) return false;
          const pDb = DB[p.species];
          if (!pDb || pDb.ability !== "Pressure" || p.pressureTriggered) return false;
          return affectedCells.some(c => c.col === p.col && c.row === p.row);
        });

        if (pressureUnit) {
          scCost += 1;
        }

        if (gameState.energy[gameState.currentPlayer] < scCost) {
          addLog("❌ Not enough energy to cast this skill!", "sys");
          setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
          return;
        }

        if (pressureUnit) {
          const match = list.find(p => p.id === pressureUnit.id);
          if (match) {
            match.pressureTriggered = true;
          }
          addLog(`💥 Pressure! ${pressureUnit.species}'s presence increases skill cost by +1!`, "sys");
        }

        // Special Skill Intercept: Clear Bell / Tidal Bell / Tidal bell
        if (skill.skillName === "Clear Bell" || skill.skillName === "Tidal bell" || skill.skillName === "Tidal Bell") {
          const targetPk = pkAt(col, row, list);
          const targetPed = pedAt(col, row, peds);
          if (targetPk || targetPed) {
            addLog(`❌ Summon failed! Cannot summon onto an occupied cell.`, "sys");
            setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
            return;
          }

          const isClearBell = skill.skillName === "Clear Bell";
          const bellSpecies = isClearBell ? "Clear Bell" : "Tidal Bell";
          const existingBell = list.find(p => p.player === actor.player && !p.fainted && (isClearBell ? (p.species === "Clear Bell" || p.species === "Clear bell") : (p.species === "Tidal Bell" || p.species === "Tidal bell")));
          if (existingBell) {
            addLog(`❌ Summon failed! You already have an active ${bellSpecies} on the board.`, "sys");
            setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
            return;
          }

          const nextId = Math.max(...list.map(p => p.id), 0) + 1;

          const bellEntity: PokemonEntity = {
            id: nextId,
            species: isClearBell ? "Clear Bell" : "Tidal Bell",
            player: actor.player,
            col,
            row,
            maxHp: 3,
            hp: 3,
            atk: 0,
            def: 0,
            exp: 0,
            status: null,
            heldItem: null,
            fainted: false,
            modifiers: [],
            isEgg: false,
            hasHatched: false
          };

          list.push(bellEntity);
          addLog(`🔔 Summoned ${bellEntity.species} at ${String.fromCharCode(65 + col)}${row + 1}!`, "heal");

          actor.exp += 2;
          actor.hasUsedSkill = true;
          if (!actor.skillUses) actor.skillUses = {};
          actor.skillUses[skill.skillName] = (actor.skillUses[skill.skillName] || 0) + 1;

          const nextPokemon = [...list];
          const nextPedestals = [...peds];
          checkWinner(nextPedestals, nextPokemon);

          setGameState(prev => ({
            ...prev,
            pokemon: nextPokemon,
            pedestals: nextPedestals,
            actionMode: null,
            highlightedCells: [],
            energy: {
              ...prev.energy,
              [gameState.currentPlayer]: Math.max(0, prev.energy[gameState.currentPlayer] - scCost)
            }
          }));
          return;
        }

        // Special Skill Intercept: Teleport
        if (skill.skillName === "Teleport") {
          const targetPk = pkAt(col, row, list);
          const targetPed = pedAt(col, row, peds);
          if (targetPk || targetPed) {
            addLog(`❌ Teleport failed! Cannot teleport onto an occupied cell.`, "sys");
            setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
            return;
          }
          actor.col = col;
          actor.row = row;
          addLog(`🌀 ${actor.species} teleported to ${String.fromCharCode(65 + col)}${row + 1}!`, "heal");

          actor.exp += 2;
          actor.hasUsedSkill = true;
          if (!actor.skillUses) actor.skillUses = {};
          actor.skillUses[skill.skillName] = (actor.skillUses[skill.skillName] || 0) + 1;

          const nextPokemon = [...list];
          const nextPedestals = [...peds];
          checkWinner(nextPedestals, nextPokemon);

          setGameState(prev => ({
            ...prev,
            pokemon: nextPokemon,
            pedestals: nextPedestals,
            actionMode: null,
            highlightedCells: [],
            energy: {
              ...prev.energy,
              [gameState.currentPlayer]: Math.max(0, prev.energy[gameState.currentPlayer] - scCost)
            }
          }));
          return;
        }

        // Special Skill Intercept: Future Sight
        if (skill.skillName === "Future Sight") {
          let targetsCount = 0;
          affectedCells.forEach(cell => {
            if (targetsCount >= 2) return;
            const target = pkAt(cell.col, cell.row, list);
            if (target && target.player !== actor.player && !target.fainted) {
              target.futureSightCountdown = 2;
              target.futureSightCasterPlayer = actor.player;
              targetsCount++;
              addLog(`⏳ ${actor.species} targeted ${target.species} with Future Sight! Banishment will occur in 2 turns.`, "sys");
            }
          });

          if (targetsCount === 0) {
            addLog(`💨 Miss! Future Sight targeted no enemies in the selected line!`, "combat");
          }

          actor.exp += 2;
          actor.hasUsedSkill = true;
          if (!actor.skillUses) actor.skillUses = {};
          actor.skillUses[skill.skillName] = (actor.skillUses[skill.skillName] || 0) + 1;

          const nextPokemon = [...list];
          const nextPedestals = [...peds];
          checkWinner(nextPedestals, nextPokemon);

          setGameState(prev => ({
            ...prev,
            pokemon: nextPokemon,
            pedestals: nextPedestals,
            actionMode: null,
            highlightedCells: [],
            energy: {
              ...prev.energy,
              [gameState.currentPlayer]: Math.max(0, prev.energy[gameState.currentPlayer] - scCost)
            }
          }));
          return;
        }

        // Special Skill Intercept: Extreme Speed
        if (skill.skillName === "Extreme Speed") {
          const dcol = Math.sign(col - actor.col);
          const drow = Math.sign(row - actor.row);

          if ((dcol !== 0 && drow !== 0) || (dcol === 0 && drow === 0)) {
            addLog(`❌ Extreme Speed failed! Target is not in a straight line.`, "sys");
            setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
            return;
          }

          let currentCol = actor.col;
          let currentRow = actor.row;
          const maxSteps = Math.max(Math.abs(col - actor.col), Math.abs(row - actor.row));
          const stepsToTake = Math.min(3, maxSteps);

          let collided = false;
          let hitSpecies = "";

          for (let step = 1; step <= stepsToTake; step++) {
            const nextCol = actor.col + dcol * step;
            const nextRow = actor.row + drow * step;

            const targetPk = pkAt(nextCol, nextRow, list);
            const targetPed = pedAt(nextCol, nextRow, peds);

            if (targetPk || targetPed) {
              collided = true;
              if (targetPk) {
                hitSpecies = targetPk.species;
                if (targetPk.player !== actor.player) {
                  let dmg = 4;
                  dmg = applyTidalBellReduction(targetPk, dmg, list);
                  targetPk.hp = Math.max(0, targetPk.hp - dmg);
                  addLog(`⚡ Extreme Speed! ${actor.species} collided with enemy ${targetPk.species} for ${dmg} damage!`, "combat");
                  if (targetPk.hp <= 0) targetPk.fainted = true;
                } else {
                  addLog(`⚡ Extreme Speed! ${actor.species} side-swiped ally ${targetPk.species} with no damage!`, "combat");
                }
              } else if (targetPed) {
                hitSpecies = "Pedestal";
                if (targetPed.player !== actor.player) {
                  targetPed.hp = Math.max(0, targetPed.hp - 1);
                  addLog(`⚡ Extreme Speed! ${actor.species} collided with enemy Pedestal!`, "combat");
                }
              }
              break;
            } else {
              currentCol = nextCol;
              currentRow = nextRow;
            }
          }

          actor.col = currentCol;
          actor.row = currentRow;

          if (collided) {
            addLog(`⚡ ${actor.species} dashed to ${String.fromCharCode(65 + currentCol)}${currentRow + 1} after colliding with ${hitSpecies}!`, "combat");
          } else {
            addLog(`⚡ ${actor.species} used Extreme Speed to dash to ${String.fromCharCode(65 + currentCol)}${currentRow + 1}!`, "combat");
          }

          actor.exp += 2;
          actor.hasUsedSkill = true;
          if (!actor.skillUses) actor.skillUses = {};
          actor.skillUses[skill.skillName] = (actor.skillUses[skill.skillName] || 0) + 1;

          const nextPokemon = [...list];
          const nextPedestals = [...peds];
          checkWinner(nextPedestals, nextPokemon);

          setGameState(prev => ({
            ...prev,
            pokemon: nextPokemon,
            pedestals: nextPedestals,
            actionMode: null,
            highlightedCells: [],
            energy: {
              ...prev.energy,
              [gameState.currentPlayer]: Math.max(0, prev.energy[gameState.currentPlayer] - scCost)
            }
          }));
          return;
        }

        // Special Skill Intercept: Transform
        if (skill.skillName === "Transform") {
          const targetPk = pkAt(col, row, list);
          if (!targetPk) {
            addLog(`❌ Transform failed! Choose a pokemon to copy.`, "sys");
            setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
            return;
          }
          if (targetPk.id === actor.id) {
            addLog(`❌ Transform failed! Cannot copy yourself.`, "sys");
            setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
            return;
          }
          const tDb = DB[targetPk.species];
          if (tDb && tDb.legendary) {
            addLog(`❌ Transform failed! Mew cannot transform into other Legendaries.`, "sys");
            setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
            return;
          }

          const isDitto = actor.species === "Ditto";
          const transformHp = isDitto ? 8 : 14;

          actor.transformState = {
            originalSpecies: actor.species,
            originalAtk: actor.atk,
            originalDef: actor.def,
            originalMaxHp: actor.maxHp,
            turnsLeft: 3
          };

          actor.species = targetPk.species;
          actor.atk = targetPk.atk;
          actor.def = targetPk.def;
          actor.maxHp = transformHp;
          actor.hp = transformHp;

          addLog(`🧬 ${isDitto ? "Ditto" : "Mew"} used Transform! Copied ${targetPk.species}'s form and parameters for 3 turns.`, "heal");

          actor.exp += 2;
          actor.hasUsedSkill = true;
          if (!actor.skillUses) actor.skillUses = {};
          actor.skillUses[skill.skillName] = (actor.skillUses[skill.skillName] || 0) + 1;

          const nextPokemon = [...list];
          const nextPedestals = [...peds];
          checkWinner(nextPedestals, nextPokemon);

          setGameState(prev => ({
            ...prev,
            pokemon: nextPokemon,
            pedestals: nextPedestals,
            actionMode: null,
            highlightedCells: [],
            energy: {
              ...prev.energy,
              [gameState.currentPlayer]: Math.max(0, prev.energy[gameState.currentPlayer] - scCost)
            }
          }));
          return;
        }

        // Special Skill Intercept: Reflect Type
        if (skill.skillName === "Reflect Type") {
          const targetPk = pkAt(col, row, list);
          if (!targetPk) {
            addLog(`❌ Reflect Type failed! Target a pokemon field square.`, "sys");
            setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
            return;
          }
          const tDb = DB[targetPk.species];
          if (tDb) {
            actor.reflectedType = tDb.t1;
            addLog(`🛡️ Mew used Reflect Type! changed typing to matched ${targetPk.species} (${tDb.t1})!`, "heal");
          }
        }

        // Special Skill Intercept: Baton Pass
        if (skill.skillName === "Baton Pass") {
          const targetPk = pkAt(col, row, list);
          if (!targetPk) {
            addLog(`❌ Baton Pass failed! Choose an ally to swap position with.`, "sys");
            setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
            return;
          }
          if (targetPk.player !== actor.player) {
            addLog(`❌ Baton Pass failed! Cannot swap with an opponent's Pokémon.`, "sys");
            setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
            return;
          }
          if (targetPk.id === actor.id) {
            addLog(`❌ Baton Pass failed! Cannot swap with yourself.`, "sys");
            setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
            return;
          }

          const oldCol = actor.col;
          const oldRow = actor.row;
          actor.col = targetPk.col;
          actor.row = targetPk.row;
          targetPk.col = oldCol;
          targetPk.row = oldRow;

          addLog(`🔄 Baton Pass! ${actor.species} swapped positions with ally ${targetPk.species}!`, "heal");

          actor.exp += 2;
          actor.hasUsedSkill = true;
          if (!actor.skillUses) actor.skillUses = {};
          actor.skillUses[skill.skillName] = (actor.skillUses[skill.skillName] || 0) + 1;

          const nextPokemon = [...list];
          const nextPedestals = [...peds];
          checkWinner(nextPedestals, nextPokemon);

          setGameState(prev => ({
            ...prev,
            pokemon: nextPokemon,
            pedestals: nextPedestals,
            actionMode: null,
            highlightedCells: [],
            energy: {
              ...prev.energy,
              [gameState.currentPlayer]: Math.max(0, prev.energy[gameState.currentPlayer] - scCost)
            }
          }));
          return;
        }

        // Special Skill Intercept: Sketch
        if (skill.skillName === "Sketch") {
          const targetPk = pkAt(col, row, list);
          if (!targetPk) {
            addLog(`❌ Sketch failed! You must target a pokemon.`, "sys");
            setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
            return;
          }
          if (targetPk.player === actor.player) {
            addLog(`❌ Sketch failed! Cannot sketch an ally's skill.`, "sys");
            setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
            return;
          }

          const targetDb = DB[targetPk.species];
          const targetSkills = targetPk.customSkills || (targetDb ? targetDb.skills : []);
          if (!targetSkills || targetSkills.length === 0) {
            addLog(`❌ Sketch failed! Target has no sketchable skills.`, "sys");
            setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
            return;
          }

          const randomSkill = targetSkills[Math.floor(Math.random() * targetSkills.length)];
          actor.customSkills = [randomSkill];
          addLog(`🎨 Sketch! ${actor.species} permanently copied ${targetPk.species}'s skill: ${randomSkill.skillName}!`, "heal");

          actor.exp += 2;
          actor.hasUsedSkill = true;
          if (!actor.skillUses) actor.skillUses = {};
          actor.skillUses[skill.skillName] = (actor.skillUses[skill.skillName] || 0) + 1;

          const nextPokemon = [...list];
          const nextPedestals = [...peds];
          checkWinner(nextPedestals, nextPokemon);

          setGameState(prev => ({
            ...prev,
            pokemon: nextPokemon,
            pedestals: nextPedestals,
            actionMode: null,
            highlightedCells: [],
            energy: {
              ...prev.energy,
              [gameState.currentPlayer]: Math.max(0, prev.energy[gameState.currentPlayer] - scCost)
            }
          }));
          return;
        }

        // Special Skill Intercept: Spikes / Stealth Rock
        if (skill.skillName === "Spikes" || skill.skillName === "Stealth Rock") {
          if (!gameState.hazards) gameState.hazards = [];
          const nextHazards = [...(gameState.hazards || [])];

          affectedCells.forEach(cell => {
            const type = skill.skillName === "Spikes" ? "spikes" : "stealthRock";
            const existingIdx = nextHazards.findIndex(h => h.col === cell.col && h.row === cell.row && h.type === type && h.player === actor.player);
            if (existingIdx !== -1) {
              nextHazards[existingIdx].duration = 3;
            } else {
              nextHazards.push({
                col: cell.col,
                row: cell.row,
                type,
                duration: 3,
                player: actor.player
              });
            }
          });

          addLog(`🕸️ ${actor.species} set ${skill.skillName} hazards in the targeted area for 3 turns!`, "heal");

          actor.exp += 2;
          actor.hasUsedSkill = true;
          if (!actor.skillUses) actor.skillUses = {};
          actor.skillUses[skill.skillName] = (actor.skillUses[skill.skillName] || 0) + 1;

          const nextPokemon = [...list];
          const nextPedestals = [...peds];
          checkWinner(nextPedestals, nextPokemon);

          setGameState(prev => ({
            ...prev,
            pokemon: nextPokemon,
            pedestals: nextPedestals,
            actionMode: null,
            highlightedCells: [],
            hazards: nextHazards,
            energy: {
              ...prev.energy,
              [gameState.currentPlayer]: Math.max(0, prev.energy[gameState.currentPlayer] - scCost)
            }
          }));
          return;
        }

        // Special Skill Accuracy Roll checking: Guillotine (50%) & High Jump Kick (85%)
        let isHit = true;
        if (skill.skillName === "Guillotine") {
          isHit = Math.random() < 0.50;
        } else if (skill.skillName === "High Jump Kick") {
          isHit = Math.random() < 0.85;
        }

        if (!isHit) {
          addLog(`💨 Miss! ${actor.species}'s ${skill.skillName} missed the target!`, "combat");
          if (skill.skillName === "High Jump Kick") {
            actor.hp = Math.max(0, actor.hp - 2);
            addLog(`⚠️ recoil! ${actor.species} crashed and took 2 recoil damage from the miss!`, "atk");
            if (actor.hp <= 0) {
              actor.fainted = true;
              addLog(`💀 ${actor.species} fainted.`, "sys");
            }
          }
          // Complete turn deduction even for miss
          actor.exp += 2;
          actor.hasUsedSkill = true;
          if (!actor.skillUses) actor.skillUses = {};
          actor.skillUses[skill.skillName] = (actor.skillUses[skill.skillName] || 0) + 1;

          const nextPokemon = [...list];
          const nextPedestals = [...peds];
          checkWinner(nextPedestals, nextPokemon);

          setGameState(prev => ({
            ...prev,
            pokemon: nextPokemon,
            pedestals: nextPedestals,
            actionMode: null,
            highlightedCells: [],
            energy: {
              ...prev.energy,
              [gameState.currentPlayer]: Math.max(0, prev.energy[gameState.currentPlayer] - scCost)
            }
          }));
          return;
        }

        // Compute raw damage:
        let rawDmg = 0;
        const isAtkBase = typeof skill.skillDmg === 'string' && skill.skillDmg.toLowerCase() === 'atk';

        if (isAtkBase) {
          const baseAtk = getModifiedStat(actor, "atk", list, { isSkill: true, weather: gameState.weather.type });
          if (skill.statusChance) {
            rawDmg = Math.max(0, baseAtk - 1);
          } else {
            rawDmg = baseAtk;
          }
        } else {
          if (mode.skillIdx === 0) {
            if (skill.skillDmg && skill.skillDmg !== 0 && skill.skillDmg !== "0" && skill.skillDmg !== "") {
              const baseAtk = getModifiedStat(actor, "atk", list, { isSkill: true, weather: gameState.weather.type });
              if (skill.statusChance) {
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

        if (skill.skillName === "Sucker Punch") {
          if (actor.damageReceivedLastTurn && actor.damageReceivedLastTurn > 0) {
            rawDmg += 2;
          }
        }

        if (actor.status === "burn") {
          rawDmg = Math.max(0, rawDmg - 1);
        }

        // Apply low-health skill element boosts
        let skillAbilityBonus = 0;
        if (actor.hp <= actor.maxHp * 0.5) {
          if (dbEntry.ability === "Overgrow" && (dbEntry.t1 === "Grass" || dbEntry.t2 === "Grass")) {
            skillAbilityBonus += 1;
            addLog(`✨ Overgrow: ${actor.species}'s Grass elemental skill damage increased!`, "heal");
          }
          if (dbEntry.ability === "Blaze" && (dbEntry.t1 === "Fire" || dbEntry.t2 === "Fire")) {
            skillAbilityBonus += 1;
            addLog(`🔥 Blaze: ${actor.species}'s Fire elemental skill damage increased!`, "heal");
          }
          if (dbEntry.ability === "Torrent" && (dbEntry.t1 === "Water" || dbEntry.t2 === "Water")) {
            skillAbilityBonus += 1;
            addLog(`🌊 Torrent: ${actor.species}'s Water elemental skill damage increased!`, "heal");
          }
        }

        const triggerSkillsEffect = (tg: PokemonEntity) => {
          const eff = skill.skillEffect;
          if (eff) {
            const isTargetAlly = eff.target === "ally" || eff.target === "self" || eff.target === "all_allies";
            const isTargetMatch = (isTargetAlly && tg.player === actor.player) || (!isTargetAlly && tg.player !== actor.player);
            if (isTargetMatch) {
              tg.modifiers.push({
                stat: eff.stat,
                amount: eff.amount,
                duration: eff.duration,
                source: skill.skillName
              });
              addLog(`${tg.species} received ${eff.amount >= 0 ? "buff" : "debuff"} ${eff.stat.toUpperCase()}: ${eff.amount} for ${eff.duration} turns`, eff.amount >= 0 ? "heal" : "atk");
            }
          }
          // status inflict chance
          if (skill.statusChance) {
            const chance = getStatusChanceValue(skill.statusChance, skill);
            const threshold = Math.floor(chance * 20);
            const roll = Math.floor(Math.random() * 20) + 1;
            const succ = roll <= threshold;

            setChancePopup({ statusType: skill.statusChance, chance, roll, success: succ });
            setTimeout(() => setChancePopup(null), 3500);

            if (succ && canInflictStatus(tg, skill.statusChance)) {
              let inflictedStatus = skill.statusChance;
              if (inflictedStatus === "paralyze") inflictedStatus = "paralysis";
              tg.status = inflictedStatus;
              tg.statusTurns = 0;
              addLog(`💥 status triggered! ${tg.species} got inflicted with status ${inflictedStatus.toUpperCase()} (rolled ${roll}/20)`, "combat");

              const tgDb = DB[tg.species];
              const actDb = DB[actor.species];
              if (tgDb && tgDb.ability === "Synchronize" && canInflictStatus(actor, skill.statusChance)) {
                let actStatus = skill.statusChance;
                if (actStatus === "paralyze") actStatus = "paralysis";
                actor.status = actStatus;
                actor.statusTurns = 1;
                addLog(`💫 Synchronize! Reflected ${actStatus.toUpperCase()} back onto ${actor.species}!`, "combat");
              }
            }
          }
          if (skill.special === "leechSeed" && tg.player !== actor.player) {
            tg.leechSeed = { sourceId: actor.id, duration: skill.specialDuration || 2 };
            addLog(`${tg.species} was planted with Leech Seed!`, "atk");
          }
        };

        // Count the number of targets successfully hit
        let targetsHit = 0;

        // Go through all affected cells and apply damage/effects
        affectedCells.forEach(cell => {
          if (shape.targetCount && targetsHit >= shape.targetCount) {
            return;
          }

          const target = pkAt(cell.col, cell.row, list);
          const targetPed = pedAt(cell.col, cell.row, peds);

          // Check if valid target depending on targetType
          const isAlly = target ? target.player === actor.player : (targetPed ? targetPed.player === actor.player : false);
          const isEnemy = target ? target.player !== actor.player : (targetPed ? targetPed.player !== actor.player : false);

          let isValid = false;
          if (skill.skillName === "Roar") {
            isValid = target ? target.id !== actor.id : false;
          } else if (targetType === "ally") {
            isValid = isAlly;
          } else if (targetType === "all_allies") {
            isValid = isAlly;
          } else if (targetType === "enemy") {
            isValid = isEnemy;
          } else {
            isValid = rawDmg > 0 ? isEnemy : isAlly;
          }

          if (isValid) {
            if (target) {
              const targetDb = DB[target.species];
              // Ally healing skills: soft-boiled, egg drink, milk drink, synthesis, aromatherapy
              if (skill.skillHeal && (skill.skillHealTarget === "ally" || skill.skillHealTarget === "all_allies")) {
                const healing = skill.skillHeal;
                target.hp = Math.min(target.maxHp, target.hp + healing);
                addLog(`💚 ${actor.species} healed ${target.species} for +${healing} HP!`, "heal");

                if (skill.skillName === "Aromatherapy") {
                  target.status = null;
                  target.statusTurns = 0;
                  addLog(`🌸 Aromatherapy cleansed all status conditions from ${target.species}!`, "heal");
                }
              } else {
                targetsHit++;
                const typeMult = typeBonus(actor, target);
                const adb = DB[actor.species];
                
                const isDamaging = skill.skillDmg !== undefined && skill.skillDmg !== 0 && skill.skillDmg !== "0" && skill.skillDmg !== "";
                let netDmg = 0;
                
                if (isDamaging) {
                  let targetRawDmg = rawDmg;
                  if (skill.skillName === "Foul Play") {
                    const targetAtkVal = getModifiedStat(target, "atk", list, { weather: gameState.weather.type });
                    targetRawDmg = targetAtkVal;
                    if (actor.status === "burn") targetRawDmg = Math.max(0, targetRawDmg - 1);
                  }
                  
                  netDmg = Math.max(0, targetRawDmg + typeMult + skillAbilityBonus - getModifiedStat(target, "def", list, { bySkill: true, weather: gameState.weather.type }));

                  // Volt Absorb / Water Absorb checks
                  if (adb) {
                    const isElectricHit = adb.t1 === "Electric" || adb.t2 === "Electric" || skill.skillName.toLowerCase().includes("thunder") || skill.skillName.toLowerCase().includes("shock") || skill.skillName.toLowerCase().includes("electro") || skill.skillName.toLowerCase().includes("discharge");
                    const isWaterHit = adb.t1 === "Water" || adb.t2 === "Water" || skill.skillName.toLowerCase().includes("water") || skill.skillName.toLowerCase().includes("hydro") || skill.skillName.toLowerCase().includes("bubble") || skill.skillName.toLowerCase().includes("scald") || skill.skillName.toLowerCase().includes("surf");

                    if (targetDb && targetDb.ability === "Volt Absorb" && isElectricHit) {
                      target.hp = Math.min(target.maxHp, target.hp + 3);
                      addLog(`⚡ Volt Absorb! ${target.species} absorbed the electric attack and restored +3 HP!`, "heal");
                      netDmg = 0;
                    } else if (targetDb && targetDb.ability === "Water Absorb" && isWaterHit) {
                      target.hp = Math.min(target.maxHp, target.hp + 3);
                      addLog(`🌊 Water Absorb! ${target.species} absorbed the water attack and restored +3 HP!`, "heal");
                      netDmg = 0;
                    }
                  }

                  // Custom Unique Skill Behavior: Dream Eater
                  if (skill.skillName === "Dream Eater") {
                    if (target.status !== "sleep") {
                      netDmg = 0;
                      addLog(`❌ Dream Eater failed! ${target.species} is not asleep.`, "sys");
                    } else {
                      const healAmt = 3;
                      actor.hp = Math.min(actor.maxHp, actor.hp + healAmt);
                      addLog(`💤 Dream Eater drained the nightmare! ${actor.species} healed +${healAmt} HP.`, "heal");
                    }
                  }

                  // Custom Unique Skill Behavior: Sonic Boom
                  if (skill.skillName === "Sonic Boom") {
                    netDmg = 2; // Fixed 2 damage, ignores defense and type bonuses
                  }

                  // Custom Unique Skill Behavior: Psycutter
                  if (skill.skillName === "Psycutter") {
                    const targetDefVal = getModifiedStat(target, "def", list, { bySkill: true, weather: gameState.weather.type });
                    netDmg = Math.max(0, netDmg + targetDefVal);
                  }

                  // Custom Unique Skill Behavior: Counter
                  if (skill.skillName === "Counter") {
                    const dmgReceived = actor.damageReceivedLastTurn || 0;
                    netDmg = dmgReceived > 0 ? (dmgReceived + 1) : 0;
                  }

                  // Multiscale / Sheer Force / Shield / Levitate checks
                  if (targetDb) {
                    if (targetDb.ability === "Multiscale" && target.hp === target.maxHp) {
                      netDmg = Math.max(0, netDmg - 3);
                      addLog(`🛡️ Multiscale! ${target.species} reduced the skill damage by 3.`, "combat");
                    }
                    if (targetDb.ability === "Sheer Force" && actor.hp < target.hp) {
                      netDmg = Math.max(0, netDmg - 1);
                      addLog(`🛡️ Sheer Force! ${target.species} took 1 less skill damage from enemy with lower HP.`, "combat");
                    }
                  }

                  // Levitate Ground immunity
                  const isGroundSkill =
                    skill.skillName === "Earthquake" ||
                    skill.skillName === "Mud Shot" ||
                    skill.skillName === "Bone Rush" ||
                    skill.skillDesc.toLowerCase().includes("ground");

                  if (targetDb && targetDb.ability === "Levitate" && isGroundSkill) {
                    netDmg = 0;
                    addLog(`☁️ Levitate! ${target.species} completely ignored the Ground-type skill ${skill.skillName}!`, "combat");
                  }

                  netDmg = applyTidalBellReduction(target, netDmg, list);

                  const startingHp = target.hp;
                  target.hp = Math.max(0, target.hp - netDmg);
                  target.damageReceivedThisTurn = (target.damageReceivedThisTurn || 0) + netDmg;
                  addLog(`✨ ${actor.species} casted ${skill.skillName} at ${target.species} for ${netDmg} damage!`, "combat");

                  // Check Sturdy for skill damage
                  if (target.hp <= 0 && targetDb && targetDb.ability === "Sturdy" && startingHp === target.maxHp) {
                    target.hp = 1;
                    addLog(`🛡️ Sturdy! ${target.species} survived the lethal blow with 1 HP!`, "combat");
                  }
                } else {
                  // Non-damaging cast
                  addLog(`✨ ${actor.species} casted ${skill.skillName} at ${target.species}!`, "combat");
                }

                // Custom Unique Skill Behavior: Roar
                if (skill.skillName === "Roar") {
                  if (!target.modifiers) target.modifiers = [];
                  target.modifiers.push({ stat: "atk", amount: -1, duration: 2, source: "Roar" });
                  addLog(`🔊 Roar! ${target.species}'s Attack was lowered by 1 for 2 turns!`, "atk");
                }

                // Custom Unique Skill Behavior: Mist
                if (skill.skillName === "Mist" && target.player === actor.player) {
                  target.status = null;
                  target.statusTurns = 0;
                  target.modifiers = target.modifiers.filter(m => m.amount >= 0);
                  target.modifiers.push({ stat: "def", amount: 1, duration: 2, source: "Mist" });
                  addLog(`🌫️ Mist! Cleansed all debuffs from ${target.species} (+1 Def for 2 turns)!`, "heal");
                }

                // Custom Unique Skill Behavior: Tidal bell
                if (skill.skillName === "Tidal bell" && target.player === actor.player) {
                  target.modifiers.push({ stat: "def", amount: 2, duration: 2, source: "Tidal bell" });
                  addLog(`🔔 Tidal Bell tolls! Granted ${target.species} +2 Def for 2 turns!`, "heal");
                }

                triggerSkillsEffect(target);

                // Gengar Cursed Body on skill hit
                if (targetDb && targetDb.ability === "Cursed Body" && !actor.fainted) {
                  if (Math.random() < 0.3) {
                    if (!actor.skillCooldowns) actor.skillCooldowns = {};
                    actor.skillCooldowns[skill.skillName] = 2;
                    addLog(`👻 Cursed Body! ${target.species} disabled ${actor.species}'s ${skill.skillName} for 2 turns!`, "combat");
                  }
                }

                if (target.hp <= 0) {
                  target.fainted = true;
                  addLog(`💀 ${target.species} fainted!`, "sys");
                  if (actor.heldItem === "Lucky Egg") {
                    actor.exp += 1;
                  }
                }
              }
            } else if (targetPed) {
              targetsHit++;
              const pedDmgRaw = Math.max(0, rawDmg + skillAbilityBonus);
              const pedDmg = Math.min(1, Math.max(0, pedDmgRaw - 1));
              targetPed.hp = Math.max(0, targetPed.hp - pedDmg);
              addLog(`✨ ${actor.species} casted ${skill.skillName} on Pedestal for ${pedDmg} skill damage! (Pedestal takes max 1 damage)`, "combat");
            }
          }
        });

        // Custom Unique Skill Behavior: Hidden Power
        if (skill.skillName === "Hidden Power") {
          const adjacentAllies = list.filter(other => {
            if (other.player !== actor.player || other.fainted || other.id === actor.id) return false;
            const dist = Math.max(Math.abs(other.col - actor.col), Math.abs(other.row - actor.row));
            return dist === 1;
          });
          adjacentAllies.forEach(ally => {
            if (!ally.modifiers) ally.modifiers = [];
            ally.modifiers.push({ stat: "atk", amount: 1, duration: 2, source: "Hidden Power" });
            addLog(`✨ Hidden Power boosted ${ally.species}'s Atk by 1 for 2 turns!`, "heal");
          });
        }

        // Global skills effects like self heals, Sunny day, Snowscape
        if (skill.skillHeal && skill.skillHealTarget === "self") {
          actor.hp = Math.min(actor.maxHp, actor.hp + skill.skillHeal);
          addLog(`💚 Self restore! ${actor.species} recovered +${skill.skillHeal} HP.`, "heal");
        }
        if (skill.selfDamage) {
          actor.hp = Math.max(0, actor.hp - skill.selfDamage);
          addLog(`⚠️ recoil! ${actor.species} takes ${skill.selfDamage} backlash damage from ${skill.skillName}`, "atk");
          if (actor.hp <= 0) {
            actor.fainted = true;
            addLog(`${actor.species} fainted.`, "sys");
          }
        }

        actor.exp += 2;
        actor.hasUsedSkill = true;
        if (!actor.skillUses) actor.skillUses = {};
        actor.skillUses[skill.skillName] = (actor.skillUses[skill.skillName] || 0) + 1;

        if (skill.cooldown && skill.cooldown > 0) {
          if (!actor.skillCooldowns) actor.skillCooldowns = {};
          actor.skillCooldowns[skill.skillName] = skill.cooldown;
        }

        const nextPokemon = [...list];
        const nextPedestals = [...peds];
        checkWinner(nextPedestals, nextPokemon);

        setGameState(prev => ({
          ...prev,
          pokemon: nextPokemon,
          pedestals: nextPedestals,
          actionMode: null,
          highlightedCells: [],
          energy: {
            ...prev.energy,
            [gameState.currentPlayer]: Math.max(0, prev.energy[gameState.currentPlayer] - scCost)
          }
        }));
        return;
      }
    }

    // Default Selection click
    const itemAtCell = pkAt(col, row, list);
    const pedAtCell = pedAt(col, row, peds);

    if (itemAtCell || pedAtCell) {
      // Refresh cell preview ranges
      setGameState(prev => ({
        ...prev,
        selectedCell: { col, row },
        actionMode: null,
        highlightedCells: []
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        selectedCell: null,
        actionMode: null,
        highlightedCells: []
      }));
    }
  };

  // Move / Melee Attack / Skill initialization trigger
  const handleSelectAction = (type: "move" | "attack" | "skill", id: number, skillIdx?: number) => {
    if (p2pStatus === "connected" && myPlayerNumber !== 0 && gameState.currentPlayer !== myPlayerNumber) {
      return;
    }
    const actor = gameState.pokemon.find(p => p.id === id);
    if (!actor) return;
    if (actor.species === "Clear Bell" || actor.species === "Tidal Bell" || actor.species === "Tidal bell") {
      return;
    }
    const dbEntry = DB[actor.species];

    if (actor.isEgg && !actor.hasHatched) {
      addLog("The Egg is currently dormant. Spend Command EXP first to hatch it!", "sys");
      return;
    }

    if (type === "move") {
      const cells = getRoleBasedMoves(actor, gameState.pokemon, gameState.pedestals, gameConfig.boardSize);
      setGameState(prev => ({
        ...prev,
        actionMode: { type, pokeId: id },
        highlightedCells: cells.map(c => ({ col: c.col, row: c.row, type: "move" as const }))
      }));
    } else if (type === "attack") {
      const cells = getAtkCells(actor, gameState.pokemon, gameState.pedestals, gameConfig.boardSize);
      setGameState(prev => ({
        ...prev,
        actionMode: { type, pokeId: id },
        highlightedCells: cells.map(c => ({ col: c.col, row: c.row, type: "atk" as const }))
      }));
    } else {
      // SKILL TRIGGER MODE
      if (!verifyActionStatus(actor)) {
        return;
      }
      const activeSkillIdx = typeof skillIdx !== "undefined" ? skillIdx : 0;
      const skill = getSkillData(dbEntry, activeSkillIdx);

      if (actor.skillUses?.[skill.skillName] && actor.skillUses[skill.skillName] > 0) {
        addLog(`❌ ${actor.species} has already used ${skill.skillName} this turn!`, "sys");
        return;
      }

      if (actor.skillCooldowns?.[skill.skillName] && actor.skillCooldowns[skill.skillName] > 0) {
        addLog(`❌ ${skill.skillName} is on cooldown for ${actor.skillCooldowns[skill.skillName]} more turns!`, "sys");
        return;
      }

      const targetType = getSkillTargetType(skill, dbEntry);

      const isWeatherSkill = ["Sunny Day", "Rain Dance", "Hail", "Sandstorm"].includes(skill.skillName);
      const isInstantSkill = (
        skill.skillDesc === "All" ||
        targetType === "self" ||
        targetType === "all_allies" ||
        targetType === "all_ice" ||
        skill.skillDesc?.toLowerCase() === "self" ||
        isWeatherSkill
      ) && skill.skillName !== "Transform";

      if (isInstantSkill) {
        // Instant/self-casts require consecutive clicks to prevent accidental triggers
        const act = gameState.actionMode;
        if (act && act.type === "skill" && act.pokeId === id && act.confirmingIdx === activeSkillIdx) {
          // CONSECUTIVE: Trigger Cast
          executeInstantSkill(actor, skill, activeSkillIdx);
        } else {
          // FIRST CLICK: Highlight targets
          const scCost = skill.skillCost || dbEntry.skillCost || 2;
          let showCells: { col: number; row: number; type: "move" | "atk" | "atk-preview" | "skill-preview" }[] = [];

          if (targetType === "all_allies") {
            showCells = gameState.pokemon
              .filter(p => !p.fainted && p.player === actor.player)
              .map(p => ({ col: p.col, row: p.row, type: "atk" as const }));
          } else {
            showCells = getSkillShapeCells(actor, gameState.pokemon, gameState.pedestals, activeSkillIdx, gameConfig.boardSize).map(c => ({ col: c.col, row: c.row, type: "atk" as const }));
          }

          setGameState(prev => ({
            ...prev,
            actionMode: { type: "skill", pokeId: id, skillIdx: activeSkillIdx, confirmingIdx: activeSkillIdx },
            highlightedCells: showCells
          }));

          addLog(`Ready to cast ${skill.skillName}! Click the skills button again to confirm cast (${scCost} Energy cost).`, "sys");
        }
      } else {
        // Targeted standard skills
        const cells = getSkillCells(actor, gameState.pokemon, gameState.pedestals, activeSkillIdx, gameConfig.boardSize);
        setGameState(prev => ({
          ...prev,
          actionMode: { type: "skill", pokeId: id, skillIdx: activeSkillIdx, confirmingIdx: null },
          highlightedCells: cells
        }));
      }
    }
  };

  const executeInstantSkill = (actor: PokemonEntity, skill: Skill, skillIdx: number) => {
    const list = [...gameState.pokemon];
    const peds = [...gameState.pedestals];
    const dbEntry = DB[actor.species];

    if (actor.species === "Celebi") {
      if (!actor.modifiers) actor.modifiers = [];
      actor.modifiers.push({ stat: "atk", amount: -2, duration: 1, source: "Celebi backlash" });
      addLog(`🍃 Celebi suffered a -2 ATK debuff for this turn!`, "sys");
    }

    let scCost = skill.skillCost || dbEntry.skillCost || 2;

    if (actor.heldItem === "Miracle Seed" && !actor.hasUsedSkill) {
      scCost = Math.max(0, scCost - 1);
    }

    const isPowderSnow = skill.skillName === "Powder Snow";
    let pressureUnit: PokemonEntity | undefined = undefined;
    if (isPowderSnow) {
      pressureUnit = list.find(p => {
        if (p.player === actor.player || p.fainted) return false;
        const pDb = DB[p.species];
        return pDb && pDb.ability === "Pressure" && !p.pressureTriggered;
      });
      if (pressureUnit) {
        scCost += 1;
      }
    }

    if (gameState.energy[gameState.currentPlayer] < scCost) {
      addLog("Not enough energy to cast this skill!", "sys");
      setGameState(prev => ({ ...prev, actionMode: null, highlightedCells: [] }));
      return;
    }

    if (pressureUnit) {
      const match = list.find(p => p.id === pressureUnit!.id);
      if (match) {
        match.pressureTriggered = true;
      }
      addLog(`💥 Pressure! ${pressureUnit.species}'s presence increases skill cost by +1!`, "sys");
    }

    // Apply self heals
    if (skill.skillHeal && skill.skillHealTarget === "self") {
      actor.hp = Math.min(actor.maxHp, actor.hp + skill.skillHeal);
      addLog(`💚 Self restore! ${actor.species} recovered +${skill.skillHeal} HP.`, "heal");
    }

    // Apply weather configs
    if (skill.skillName === "Sunny Day" || skill.skillName === "Rain Dance" || skill.skillName === "Sandstorm" || skill.skillName === "Hail") {
      const weatherMap: Record<string, string> = {
        "Sunny Day": "Sunlight",
        "Rain Dance": "Rain",
        "Sandstorm": "Sandstorm",
        "Hail": "Hail Storm"
      };
      const wt = weatherMap[skill.skillName] || "Clear";
      if (canOverrideWeather(gameState.weather.type, wt)) {
        setGameState(prev => ({
          ...prev,
          weather: { type: wt, duration: 5 }
        }));
        addLog(`🌤️ Weather is now altered to ${wt}!`, "sys");
      } else {
        addLog(`❌ Weather change to ${wt} failed due to existing stronger weather!`, "sys");
      }
    }

    // Apply stat modifier buffs to matching allies
    const targetType = getSkillTargetType(skill, dbEntry);

    if (skill.skillName === "Life Dew" || targetType === "all_allies") {
      list.forEach(p => {
        if (!p.fainted && p.player === actor.player) {
          p.hp = Math.min(p.maxHp, p.hp + 2);
          addLog(`💧 Life Dew restored +2 HP to ally ${p.species}!`, "heal");
        }
      });
    }

    if (targetType === "all_ice") {
      list.forEach(p => {
        if (!p.fainted && (DB[p.species].t1 === "Ice" || DB[p.species].t2 === "Ice")) {
          p.modifiers.push({ stat: "def", amount: 1, duration: 2, source: "Snow Scape" });
          addLog(`${p.species} gained +1 Def from Snow Scape.`, "heal");
        }
      });
    }

    if (targetType === "self") {
      const eff = skill.skillEffect || dbEntry.skillEffect;
      if (eff) {
        if (!actor.modifiers) actor.modifiers = [];
        actor.modifiers.push({
          stat: eff.stat,
          amount: eff.amount,
          duration: eff.duration,
          source: skill.skillName
        });
        addLog(`🛡️ ${actor.species} gained +${eff.amount} ${eff.stat.toUpperCase()} from ${skill.skillName} for ${eff.duration} turns!`, "heal");
      }
    }

    if (skill.skillName === "Powder Snow") {
      list.forEach(p => {
        if (!p.fainted) {
          const pDb = DB[p.species];
          const isIce = pDb && (pDb.t1 === "Ice" || pDb.t2 === "Ice");

          const defVal = getModifiedStat(p, "def", list, { bySkill: true, weather: gameState.weather.type });
          let netDmg = Math.max(0, 1 - defVal);
          netDmg = applyTidalBellReduction(p, netDmg, list);
          p.hp = Math.max(0, p.hp - netDmg);
          addLog(`❄️ Powder Snow hit ${p.species} for ${netDmg} damage! (Def: ${defVal})`, "combat");

          if (p.hp <= 0) {
            p.fainted = true;
            addLog(`💀 ${p.species} fainted!`, "sys");
          } else if (!isIce && canInflictStatus(p, "freeze")) {
            const chance = 0.1;
            const threshold = Math.floor(chance * 20);
            const roll = Math.floor(Math.random() * 20) + 1;
            const succ = roll <= threshold;
            setChancePopup({ statusType: "freeze", chance, roll, success: succ });
            setTimeout(() => setChancePopup(null), 3500);

            if (succ) {
              p.status = "freeze";
              p.statusTurns = 0;
              addLog(`❄️ Status triggered! ${p.species} got frozen! (rolled ${roll}/20)`, "combat");
            }
          }
        }
      });
    }

    if (skill.selfDamage) {
      actor.hp = Math.max(0, actor.hp - skill.selfDamage);
      if (actor.hp <= 0) actor.fainted = true;
    }

    actor.exp += 2;
    actor.hasUsedSkill = true;
    if (!actor.skillUses) actor.skillUses = {};
    actor.skillUses[skill.skillName] = (actor.skillUses[skill.skillName] || 0) + 1;

    if (skill.cooldown && skill.cooldown > 0) {
      if (!actor.skillCooldowns) actor.skillCooldowns = {};
      actor.skillCooldowns[skill.skillName] = skill.cooldown;
    }

    setGameState(prev => ({
      ...prev,
      pokemon: list,
      pedestals: peds,
      actionMode: null,
      highlightedCells: [],
      energy: {
        ...prev.energy,
        [gameState.currentPlayer]: Math.max(0, prev.energy[gameState.currentPlayer] - scCost)
      }
    }));

    addLog(`✨ ${actor.species} successfully deployed ${skill.skillName}!`, "atk");
  };

  // End turn mechanics
  const handleEndTurn = () => {
    if (p2pStatus === "connected" && myPlayerNumber !== 0 && gameState.currentPlayer !== myPlayerNumber) {
      return;
    }
    const list = [...gameState.pokemon];
    const peds = [...gameState.pedestals];
    const curPlayer = gameState.currentPlayer;

    // Resolve Eevee pending turn-end evolutions and standard pending evolutions
    list.forEach(p => {
      if (p.player === curPlayer && !p.fainted) {
        if (p.species === "Eevee" && p.pendingEvoTo) {
          const oldName = p.species;
          p.species = p.pendingEvoTo;
          const evolvedDb = DB[p.pendingEvoTo];
          if (evolvedDb) {
            p.maxHp = evolvedDb.hp;
            p.hp = evolvedDb.hp; // healed to full
            p.atk = evolvedDb.atk;
            p.def = evolvedDb.def || 0;
            p.exp = 0;
            p.pendingEvoChoice = false;
            p.pendingEvoTo = undefined;
            addLog(`🌿 Turn-End Evolution! Eevee has evolved into ${p.species}!`, "heal");
          }
        } else if (p.pendingEvo) {
          const dbEntry = DB[p.species];
          if (dbEntry && dbEntry.evoTo) {
            const oldName = p.species;
            p.species = dbEntry.evoTo;
            const evolvedDb = DB[dbEntry.evoTo];
            if (evolvedDb) {
              p.maxHp = evolvedDb.hp;
              p.hp = evolvedDb.hp; // healed to full
              p.atk = evolvedDb.atk;
              p.def = evolvedDb.def || 0;
              p.exp = 0;
              p.pendingEvo = false;
              addLog(`🌿 Turn-End Evolution! ${oldName} has evolved into ${p.species}!`, "heal");
            }
          }
        }
      }
    });
    // Reset pressure and rotate damageReceived for all units
    list.forEach(p => {
      p.pressureTriggered = false;
      p.damageReceivedLastTurn = p.damageReceivedThisTurn || 0;
      p.damageReceivedThisTurn = 0;
    });
    // Resolve Future Sight countdown and banishment ticking
    list.forEach(p => {
      if (p.fainted) return;

      // Tick Future Sight countdown
      if (p.futureSightCountdown !== undefined && p.futureSightCountdown > 0 && p.futureSightCasterPlayer === curPlayer) {
        p.futureSightCountdown -= 1;
        if (p.futureSightCountdown === 0) {
          p.banishedTurns = 2;
          p.banishedCol = p.col;
          p.banishedRow = p.row;
          p.col = -1;
          p.row = -1;
          addLog(`🌀 Future Sight triggered! ${p.species} has been banished 2 turns into the future!`, "combat");
        } else {
          addLog(`⏳ Future Sight ticking on ${p.species}... (${p.futureSightCountdown} turn(s) left before banishment)`, "sys");
        }
      }

      // Tick Future Sight banishment duration
      else if (p.banishedTurns !== undefined && p.banishedTurns > 0 && p.futureSightCasterPlayer === curPlayer) {
        p.banishedTurns -= 1;
        if (p.banishedTurns === 0) {
          let targetCol = p.banishedCol!;
          let targetRow = p.banishedRow!;
          if (pkAt(targetCol, targetRow, list) || pedAt(targetCol, targetRow, peds)) {
            let found = false;
            for (let d = 1; d < 11 && !found; d++) {
              const candidates: { col: number; row: number; dist: number }[] = [];
              for (let dx = -d; dx <= d; dx++) {
                for (let dy = -d; dy <= d; dy++) {
                  if (Math.abs(dx) === d || Math.abs(dy) === d) {
                    const c = targetCol + dx;
                    const r = targetRow + dy;
                    if (c >= 0 && c < 11 && r >= 0 && r < 11) {
                      if (!pkAt(c, r, list) && !pedAt(c, r, peds)) {
                        candidates.push({ col: c, row: r, dist: Math.sqrt(dx * dx + dy * dy) });
                      }
                    }
                  }
                }
              }
              if (candidates.length > 0) {
                candidates.sort((a, b) => a.dist - b.dist);
                targetCol = candidates[0].col;
                targetRow = candidates[0].row;
                found = true;
              }
            }
          }
          p.col = targetCol;
          p.row = targetRow;
          p.banishedCol = undefined;
          p.banishedRow = undefined;
          p.futureSightCasterPlayer = undefined;
          addLog(`🌀 Future Sight ended! ${p.species} returned to the board at ${String.fromCharCode(65 + p.col)}${p.row + 1}!`, "combat");
        } else {
          addLog(`🌀 ${p.species} is banished in the future... (${p.banishedTurns} turn(s) remaining)`, "sys");
        }
      }
    });

    // A. Tick status condition damage for ending player
    list.forEach(p => {
      if (p.player !== curPlayer || p.fainted) return;
      if (p.banishedTurns && p.banishedTurns > 0) return;
      if (p.species === "Clear Bell" || p.species === "Tidal Bell" || p.species === "Tidal bell") return;

      // Seed drain
      if (p.leechSeed) {
        const seedSource = list.find(s => s.id === p.leechSeed?.sourceId && !s.fainted);
        p.hp = Math.max(0, p.hp - 1);
        addLog(`☠️ Leech Seed drain! ${p.species} loses -1 HP.`, "atk");
        if (seedSource) {
          seedSource.hp = Math.min(seedSource.maxHp, seedSource.hp + 1);
        }
        if (p.hp <= 0) {
          p.fainted = true;
          addLog(`${p.species} fainted from Leech Seed drain!`, "sys");
        }
      }

      // Poison / Burn ticks
      if (p.status === "poison" || p.status === "toxic" || p.status === "burn") {
        p.hp = Math.max(0, p.hp - 1);
        addLog(`❤️ affliction! ${p.species} takes -1 HP from ${p.status.toUpperCase()}`, "atk");
        if (p.hp <= 0) {
          p.fainted = true;
          addLog(`${p.species} fainted from damage over time!`, "sys");
        }
      }

      // Burn status maximum 2 turns limit
      if (p.status === "burn" && !p.fainted) {
        p.statusTurns = (p.statusTurns || 0) + 1;
        if (p.statusTurns >= 2) {
          p.status = null;
          p.statusTurns = 0;
          addLog(`🔥 ${p.species}'s Burn has subsided after 2 turns!`, "heal");
        }
      }

      // Leftovers
      if (p.heldItem === "Leftovers" && p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + 1);
        addLog(`🍏 leftovers! ${p.species} recovered +1 HP.`, "heal");
      }

      // End-of-turn abilities (Regenerator, Shed Skin, Natural Cure, Rain Dish, Solar Power decay)
      const dbEntry = DB[p.species];
      if (dbEntry && !p.fainted) {
        // Rain Dish
        if (dbEntry.ability === "Rain Dish" && (gameState.weather.type === "Rain" || gameState.weather.type === "Heavy Rain") && p.hp < p.maxHp) {
          p.hp = Math.min(p.maxHp, p.hp + 1);
          addLog(`🌧️ Rain Dish! ${p.species} recovered +1 HP in rain.`, "heal");
        }
        // Regenerator
        if (dbEntry.ability === "Regenerator" && p.hp < p.maxHp) {
          p.hp = Math.min(p.maxHp, p.hp + 1);
          addLog(`🌱 Regenerator! ${p.species} recovered +1 HP.`, "heal");
        }
        // Solar Power decay
        if (dbEntry.ability === "Solar Power" && (gameState.weather.type === "Sunlight" || gameState.weather.type === "Harsh Sunlight")) {
          p.hp = Math.max(0, p.hp - 1);
          addLog(`☀️ Solar Power! ${p.species} takes -1 HP from solar heat.`, "atk");
          if (p.hp <= 0) {
            p.fainted = true;
            addLog(`${p.species} fainted to Solar Power!`, "sys");
          }
        }
        // Shed Skin
        if (dbEntry.ability === "Shed Skin" && p.status) {
          if (Math.random() < 0.3) {
            addLog(`✨ Shed Skin! ${p.species} shed its skin and cured its ${p.status.toUpperCase()}!`, "heal");
            p.status = null;
          }
        }
        // Natural Cure
        if (dbEntry.ability === "Natural Cure" && p.status) {
          addLog(`✨ Natural Cure! ${p.species} recovered from status ${p.status.toUpperCase()}!`, "heal");
          p.status = null;
        }
      }

      // Freeze status ticking (only reduces if player with status ends turn)
      if (p.status === "freeze" && !p.fainted) {
        p.statusTurns = (p.statusTurns || 0) + 1;
        if (p.statusTurns >= 1) {
          p.status = null;
          p.statusTurns = 0;
          addLog(`❄️ ${p.species} thawed out!`, "heal");
        }
      }

      // Moody ability for Smeargle
      if (dbEntry && dbEntry.ability === "Moody" && !p.fainted) {
        const roll = Math.floor(Math.random() * 20) + 1;
        let stat = "";
        let change = 0;
        if (roll >= 10) {
          if (roll % 2 === 0) {
            stat = "def";
            change = 1;
          } else {
            stat = "atk";
            change = 1;
          }
        } else {
          if (roll % 2 === 0) {
            stat = "def";
            change = -1;
          } else {
            stat = "atk";
            change = -1;
          }
        }
        if (!p.modifiers) p.modifiers = [];
        p.modifiers.push({
          stat,
          amount: change,
          duration: 9999, // Permanent
          source: "Moody"
        });
        addLog(`🎲 Moody! Smeargle rolled ${roll} on d20. ${stat.toUpperCase()} modified by ${change >= 0 ? "+" : ""}${change}!`, "heal");
      }

      // EXP passive checks
      if (p.heldItem === "EXP Share" && !p.hasMoved && !p.hasAttacked && !p.hasUsedSkill) {
        p.exp += 1;
        addLog(`🎓 EXP share! ${p.species} gains +1 EXP.`, "heal");
      }

      // Core egg hatch pools progress
      if (p.isEgg && !p.hasHatched) {
        const dbEntry = DB[p.species];
        if (!p.pendingHatch) {
          p.hatchProgress = (p.hatchProgress || 0) + 1;
          const cost = dbEntry?.hatchCost || (p.species === "Aerodactyl" ? 18 : 30);
          if (p.hatchProgress >= cost) {
            p.pendingHatch = true;
          }
        }
        if (p.pendingHatch) {
          p.isEgg = false;
          p.hasHatched = true;
          p.pendingHatch = false;
          p.maxHp = dbEntry.hp;
          p.hp = dbEntry.hp;
          p.def = dbEntry.def || 0;
          if (p.species === "Aerodactyl") {
            addLog(`🦴 Fossil cleaned! A fierce Aerodactyl rises from the stone onto the battlefield!`, "combat");
          } else {
            addLog(`✨ Golden Egg hatched! A Legendary ${p.species} joins the battlefield!`, "combat");
          }
        }
      } else {
        if (p.species !== "Clear Bell" && p.species !== "Tidal Bell" && p.species !== "Tidal bell") {
          // Standard experience accumulation
          p.exp += 1;
          const dbEntry = DB[p.species];
          if (dbEntry?.evoCost && p.exp >= dbEntry.evoCost) {
            if (p.species === "Eevee") {
              p.pendingEvoChoice = true;
              addLog(`✨ Eevee is ready to evolve! Choose its evolution form durings your upcoming turns.`, "heal");
            } else {
              const oldName = p.species;
              p.species = dbEntry.evoTo!;
              const evolvedDb = DB[dbEntry.evoTo!];
              p.maxHp = evolvedDb.hp;
              p.hp = evolvedDb.hp;
              p.atk = evolvedDb.atk;
              p.def = evolvedDb.def || 0;
              p.exp = 0;
              addLog(`🌿 Evolution! ${oldName} evolved into ${p.species}!`, "heal");
            }
          }
        }
      }

      // Decrement transformState duration
      if (p.transformState) {
        p.transformState.turnsLeft -= 1;
        if (p.transformState.turnsLeft <= 0) {
          addLog(`🧬 Transform worn off! ${p.species} reverted back to ${p.transformState.originalSpecies}.`, "sys");
          p.species = p.transformState.originalSpecies;
          p.atk = p.transformState.originalAtk;
          p.def = p.transformState.originalDef;
          p.maxHp = p.transformState.originalMaxHp;
          p.hp = Math.min(p.hp, p.transformState.originalMaxHp);
          p.reflectedType = null;
          p.transformState = null;
        }
      }

      // Decrement stat modifier durations
      if (p.modifiers && p.modifiers.length > 0) {
        p.modifiers = p.modifiers.map(m => {
          const nextDur = m.duration - 1;
          if (nextDur <= 0) {
            addLog(`⏳ ${p.species}'s stat modifier ${m.source} (${m.stat.toUpperCase()} +${m.amount}) has worn off.`, "sys");
          }
          return { ...m, duration: nextDur };
        }).filter(m => m.duration > 0);
      }

      // Decrement skill cooldowns
      if (p.skillCooldowns) {
        const nextCooldowns: { [key: string]: number } = {};
        Object.keys(p.skillCooldowns).forEach(name => {
          const cd = p.skillCooldowns![name];
          if (cd > 1) {
            nextCooldowns[name] = cd - 1;
          } else if (cd === 1) {
            addLog(`⏳ ${p.species}'s skill ${name} is off cooldown.`, "sys");
          }
        });
        p.skillCooldowns = nextCooldowns;
      }

      // Clear trackers flags
      p.hasMoved = false;
      p.hasAttacked = false;
      p.hasUsedSkill = false;
      p.hasUsedMP = false;
      p.skillUses = {};
    });

    // Clear Bell turn-end passive healing
    list.forEach(bell => {
      if ((bell.species === "Clear Bell" || bell.species === "Clear bell") && !bell.fainted && bell.player === curPlayer) {
        list.forEach(ally => {
          if (ally.player === curPlayer && !ally.fainted && !(ally.banishedTurns && ally.banishedTurns > 0) && ally.species !== "Clear Bell" && ally.species !== "Clear bell" && ally.species !== "Tidal Bell" && ally.species !== "Tidal bell") {
            const dc = Math.abs(ally.col - bell.col);
            const dr = Math.abs(ally.row - bell.row);
            if (dc <= 1 && dr <= 1) {
              if (ally.hp < ally.maxHp) {
                ally.hp = Math.min(ally.maxHp, ally.hp + 1);
                addLog(`🔔 Clear Bell healed ${ally.species} for +1 HP!`, "heal");
              }
            }
          }
        });
      }
    });

    // B. Swap players
    const nextPlayer = curPlayer === 1 ? 2 : 1;
    let nextTurn = gameState.turn;
    if (nextPlayer === 1) {
      nextTurn += 1;
    }

    // Phase evaluation
    let nextPhase = gameState.phase;
    if (nextTurn >= 10 && nextTurn < 25) {
      nextPhase = 2;
    } else if (nextTurn >= 25 && nextTurn < 40) {
      nextPhase = 3;
    } else if (nextTurn >= 40) {
      nextPhase = 4;
    }

    // Compute max Energy limits
    const maxE = nextPhase === 1 ? 3 : nextPhase === 2 ? 4 : 5;

    // Gold payouts on turn increments 1, 6, 11, 16, 21 etc.
    const payoutTurns = [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56];
    const updatedPlayers = { ...gameState.players };

    if (payoutTurns.includes(nextTurn) && nextPlayer === 1) {
      const bonusGold = nextTurn > 30 ? 7 : nextTurn > 15 ? 6 : 5;
      updatedPlayers[1].gold += bonusGold;
      updatedPlayers[2].gold += bonusGold;
      addLog(`💰 payout! All players earned +${bonusGold} Gold from turn milestone.`, "sys");
    }

    // Allocate 2 free command EXP points
    updatedPlayers[nextPlayer].freeExp += 2;

    // Weather setter abilities
    // Trigger once per active pokemon with weather abilities
    const activeMons = list.filter(p => !p.fainted);
    const nextWeather = { ...gameState.weather };
    activeMons.forEach(p => {
      const db = DB[p.species];
      if (db) {
        if (db.ability === "Drought" && !p.weatherTriggered) {
          if (canOverrideWeather(nextWeather.type, "Sunlight")) {
            nextWeather.type = "Sunlight";
            nextWeather.duration = 5;
            addLog(`☀️ Drought! ${p.species} bathed the zone in brilliant Sunlight for 5 turns!`, "sys");
          } else {
            addLog(`☀️ Drought was blocked by existing stronger weather!`, "sys");
          }
          p.weatherTriggered = true;
        }
        if (db.ability === "Drizzle" && !p.weatherTriggered) {
          if (canOverrideWeather(nextWeather.type, "Rain")) {
            nextWeather.type = "Rain";
            nextWeather.duration = 5;
            addLog(`🌧️ Drizzle! ${p.species} summoned a downpour for 5 turns!`, "sys");
          } else {
            addLog(`🌧️ Drizzle was blocked by existing stronger weather!`, "sys");
          }
          p.weatherTriggered = true;
        }
        if (db.ability === "Sand Stream" && !p.weatherTriggered) {
          if (canOverrideWeather(nextWeather.type, "Sandstorm")) {
            nextWeather.type = "Sandstorm";
            nextWeather.duration = 5;
            addLog(`⏳ Sand Stream! ${p.species} whipped up a Sandstorm for 5 turns!`, "sys");
          } else {
            addLog(`⏳ Sand Stream was blocked by existing stronger weather!`, "sys");
          }
          p.weatherTriggered = true;
        }
        if (db.ability === "Snow Warning" && !p.weatherTriggered) {
          if (canOverrideWeather(nextWeather.type, "Hail Storm")) {
            nextWeather.type = "Hail Storm";
            nextWeather.duration = 5;
            addLog(`❄️ Snow Warning! ${p.species} summoned a Hail Storm for 5 turns!`, "sys");
          } else {
            addLog(`❄️ Snow Warning was blocked by existing stronger weather!`, "sys");
          }
          p.weatherTriggered = true;
        }
      }
    });

    // Weather decay
    if (nextWeather && nextWeather.type && nextWeather.duration > 0) {
      nextWeather.duration -= 1;
      if (nextWeather.duration <= 0) {
        addLog(`☀️ Weather returned to normal (${nextWeather.type} has ended).`, "sys");
        nextWeather.type = null;
        nextWeather.duration = 0;
      } else {
        addLog(`🌦️ Weather ${nextWeather.type} continues for ${nextWeather.duration} more turns.`, "sys");
      }
    }

    const nextPokemonList = [...list];
    const nextPedestals = [...peds];
    checkWinner(nextPedestals, nextPokemonList);

    setGameState(prev => ({
      ...prev,
      turn: nextTurn,
      phase: nextPhase,
      currentPlayer: nextPlayer,
      pokemon: nextPokemonList,
      pedestals: nextPedestals,
      weather: nextWeather,
      players: updatedPlayers,
      selectedCell: null,
      highlightedCells: [],
      actionMode: null,
      movePoints: {
        ...(prev.movePoints || { 1: 3, 2: 3 }),
        [nextPlayer]: 3
      },
      consumablesUsedThisTurn: { total: 0, powerHerb: 0 },
      energy: {
        ...prev.energy,
        [nextPlayer]: maxE
      },
      maxEnergy: {
        1: maxE,
        2: maxE
      }
    }));

    addLog(`--- Player ${nextPlayer}'s Turn (Turn ${nextTurn} - Phase ${nextPhase}) ---`, "sys");
    setTurnNotice(nextPlayer);
  };

  // Rotate Skill helper
  const handleRotateSkill = (id: number) => {
    if (p2pStatus === "connected" && myPlayerNumber !== 0 && gameState.currentPlayer !== myPlayerNumber) {
      return;
    }
    const actor = gameState.pokemon.find(p => p.id === id);
    if (!actor) return;

    const currentRotation = actor.rotation ?? 0;
    const nextRotation = (currentRotation + 1) % 4;

    const updatedPokemonList = gameState.pokemon.map(p => {
      if (p.id === id) {
        return { ...p, rotation: nextRotation };
      }
      return p;
    });

    setGameState(prev => {
      let nextHighlighted = prev.highlightedCells;
      if (prev.actionMode && prev.actionMode.type === "skill" && prev.actionMode.pokeId === id) {
        const activeSkillIdx = prev.actionMode.skillIdx ?? 0;
        const tempActor = { ...actor, rotation: nextRotation };
        const tempPokemonList = updatedPokemonList;

        const dbEntry = DB[tempActor.species];
        const skill = getSkillData(dbEntry, activeSkillIdx);
        const targetType = getSkillTargetType(skill, dbEntry);

        const isWeatherSkill = ["Sunny Day", "Rain Dance", "Hail", "Sandstorm"].includes(skill.skillName);
        const isInstantSkill = (
          skill.skillDesc === "All" ||
          targetType === "self" ||
          targetType === "all_allies" ||
          targetType === "all_ice" ||
          skill.skillDesc?.toLowerCase() === "self" ||
          isWeatherSkill
        ) && skill.skillName !== "Transform";

        if (isInstantSkill) {
          if (targetType === "all_allies") {
            nextHighlighted = tempPokemonList
              .filter(p => !p.fainted && p.player === tempActor.player)
              .map(p => ({ col: p.col, row: p.row, type: "atk" as const }));
          } else {
            nextHighlighted = getSkillShapeCells(tempActor, tempPokemonList, prev.pedestals, activeSkillIdx, gameConfig.boardSize).map(c => ({ col: c.col, row: c.row, type: "atk" as const }));
          }
        } else {
          nextHighlighted = getSkillCells(tempActor, tempPokemonList, prev.pedestals, activeSkillIdx, gameConfig.boardSize);
        }
      }

      return {
        ...prev,
        pokemon: updatedPokemonList,
        highlightedCells: nextHighlighted
      };
    });
  };

  // EXP invest helper
  const handleAllocateExp = (id: number) => {
    if (p2pStatus === "connected" && myPlayerNumber !== 0 && gameState.currentPlayer !== myPlayerNumber) {
      return;
    }
    const list = [...gameState.pokemon];
    const p = list.find(x => x.id === id);
    if (!p) return;
    const dbEntry = DB[p.species];

    if (p.hasHatched && dbEntry?.legendary) {
      addLog(`❌ Cannot invest command EXP! Legendary ${p.species} has already hatched.`, "sys");
      return;
    }

    if (!p.isEgg && !dbEntry?.evoCost) {
      addLog(`❌ Cannot invest command EXP! ${p.species} cannot evolve.`, "sys");
      return;
    }

    const updatedPlayers = { ...gameState.players };
    if (updatedPlayers[gameState.currentPlayer].freeExp < 1) return;

    updatedPlayers[gameState.currentPlayer].freeExp -= 1;

    if (p.isEgg) {
      p.hatchProgress = (p.hatchProgress || 0) + 1;
      const cost = dbEntry?.hatchCost || (p.species === "Aerodactyl" ? 18 : 30);
      if (p.species === "Aerodactyl") {
        addLog(`Invested 1 command EXP in Fossil: +1 Cleaning Progress (${p.hatchProgress}/${cost})`, "heal");
      } else {
        addLog(`Invested 1 command EXP in Egg: +1 Hatch Progress (${p.hatchProgress}/${cost})`, "heal");
      }
      if (p.hatchProgress >= cost) {
        p.pendingHatch = true;
        addLog(`✨ Egg/Fossil is ready to hatch! It will hatch when you end your turn.`, "heal");
      }
    } else {
      p.exp += 1;
      addLog(`Invested 1 command EXP on ${p.species} (+1 EXP: ${p.exp}/${dbEntry?.evoCost || 0})`, "heal");
      if (dbEntry?.evoCost && p.exp >= dbEntry.evoCost) {
        if (p.species === "Eevee") {
          p.pendingEvoChoice = true;
          addLog(`✨ Eevee is ready to evolve! Select its upcoming form from the interface.`, "heal");
        } else {
          p.pendingEvo = true;
          addLog(`✨ ${p.species} is ready to evolve! It will evolve when you end your turn.`, "heal");
        }
      }
    }

    setGameState(prev => ({
      ...prev,
      pokemon: list,
      players: updatedPlayers
    }));
  };

  // Unequip item helper
  const handleUnequipItem = (id: number) => {
    if (p2pStatus === "connected" && myPlayerNumber !== 0 && gameState.currentPlayer !== myPlayerNumber) {
      return;
    }
    const list = [...gameState.pokemon];
    const p = list.find(x => x.id === id);
    if (!p || !p.heldItem) return;

    const stateCopy = { ...gameState.players[gameState.currentPlayer] };
    stateCopy.inventory.held.push(p.heldItem);

    addLog(`Unequipped ${p.heldItem} from ${p.species}. Item returned to Backpack.`, "sys");
    p.heldItem = null;

    setGameState(prev => ({
      ...prev,
      pokemon: list,
      players: {
        ...prev.players,
        [gameState.currentPlayer]: stateCopy
      }
    }));
  };

  // Shop item transaction purchase
  const handleBuyItem = (name: string) => {
    if (p2pStatus === "connected" && myPlayerNumber !== 0 && gameState.currentPlayer !== myPlayerNumber) {
      return;
    }
    const item = ITEMS[name];
    if (!item) return;
    const playerBal = gameState.players[gameState.currentPlayer];

    if (playerBal.gold < item.cost) {
      addLog("Purchase aborted: Insufficient gold balance.", "sys");
      return;
    }

    const updatedPlayers = { ...gameState.players };
    updatedPlayers[gameState.currentPlayer].gold -= item.cost;

    if (item.type === "held") {
      updatedPlayers[gameState.currentPlayer].inventory.held.push(name);
    } else {
      updatedPlayers[gameState.currentPlayer].inventory.consumable.push(name);
    }

    setGameState(prev => ({
      ...prev,
      players: updatedPlayers
    }));

    addLog(`Bought ${name} for ${item.cost} Gold! Item sent to Backpack inventory.`, "heal");
  };

  // Use overlay item config targeting mode
  const handleUseItemAction = (name: string, type: "held" | "consumable") => {
    if (p2pStatus === "connected" && myPlayerNumber !== 0 && gameState.currentPlayer !== myPlayerNumber) {
      return;
    }
    // Put UI into equip destination highlight mode
    setInventoryOpen(false);
    addLog(`Targeting: Click any active ally token on the board to allocate ${name}.`, "sys");

    // Highlight all user owned units
    const cells = gameState.pokemon
      .filter(p => !p.fainted && p.player === gameState.currentPlayer)
      .map(p => ({ col: p.col, row: p.row, type: "move" as const }));

    setGameState(prev => ({
      ...prev,
      actionMode: { type: "equip", item: name, itemType: type },
      highlightedCells: cells
    }));
  };

  const selectEeveeEvolution = (eeveeId: number, targetForm: string) => {
    setGameState(prev => {
      const list = prev.pokemon.map(p => {
        if (p.id === eeveeId) {
          return { ...p, pendingEvoTo: targetForm };
        }
        return p;
      });
      return { ...prev, pokemon: list };
    });
    addLog(`🧬 Species Selected: Eevee determined to evolve into ${targetForm} at turn-end!`, "heal");
  };

  const handleRestart = () => {
    if (p2pStatus === "connected") {
      sendP2PMessage({ type: "restart_game" });
      setP1Ready(false);
      setP2Ready(false);
      setPeerP1Slots(undefined);
      setPeerP1Placements(undefined);
      setPeerP2Slots(undefined);
      setPeerP2Placements(undefined);
    }
    setScreen("landing");
  };

  return (
    <main className="min-h-vh w-full flex flex-col p-4 md:p-6 bg-[#0b0f19] select-none text-slate-100 font-sans antialiased overflow-x-hidden relative">
      {/* 1. SETUP SCREEN VIEW */}
      {/* 0a. LANDING PAGE VIEW */}
      {screen === "landing" && (
        <div 
          className="flex-grow flex flex-col items-center justify-center min-h-[calc(100vh-3rem)] relative p-6 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("blob:https://gemini.google.com/da24b70d-a3cc-481a-8ac6-ca20bdca051e"), radial-gradient(circle, #1a1a3a 0%, #06060f 100%)`,
            backgroundBlendMode: "overlay"
          }}
        >
          <div className="w-full max-w-xl p-8 md:p-12 rounded-3xl bg-slate-950/80 border border-[#0f3460]/80 shadow-[0_0_50px_rgba(15,52,96,0.3)] backdrop-blur-md text-center flex flex-col items-center gap-8 relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.25em] mb-3 animate-pulse">
                💥 Agentic Tactical Board Game
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 uppercase tracking-wider mb-2 drop-shadow-md">
                Pokémon Chess
              </h1>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                A turn-based multiplayer chess game featuring unique elemental synergies, customized dynamic boards, and interactive Pokédex editing.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <button
                onClick={() => setScreen("preparation")}
                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm uppercase tracking-widest rounded-2xl transition duration-300 transform hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] cursor-pointer outline-none flex items-center justify-center gap-2"
              >
                <span>🎮</span> Preperation Setup
              </button>
              
              <button
                onClick={() => setScreen("pokedex")}
                className="group relative px-8 py-4 bg-[#16213e]/70 hover:bg-[#202e56]/80 text-white font-bold text-sm uppercase tracking-widest rounded-2xl border border-[#2a3a5a] hover:border-cyan-500/50 transition duration-300 transform hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(32,46,86,0.3)] cursor-pointer outline-none flex items-center justify-center gap-2"
              >
                <span>📕</span> Pokédex Database
              </button>
            </div>

            <div className="text-[10px] text-slate-500 font-mono">
              Designed by Antigravity v1.0.0
            </div>
          </div>
        </div>
      )}

      {/* 0b. PREPARATION CONFIGURATION VIEW */}
      {screen === "preparation" && (
        <div 
          className="flex-grow flex flex-col items-center justify-center min-h-[calc(100vh-3rem)] relative p-6 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("blob:https://gemini.google.com/da24b70d-a3cc-481a-8ac6-ca20bdca051e"), radial-gradient(circle, #1a1a3a 0%, #06060f 100%)`,
            backgroundBlendMode: "overlay"
          }}
        >
          <div className="w-full max-w-lg p-8 rounded-3xl bg-slate-950/80 border border-[#0f3460]/80 shadow-[0_0_50px_rgba(15,52,96,0.3)] backdrop-blur-md relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="border-b border-[#0f3460]/45 pb-4 mb-6">
              <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2 font-sans">
                <span>⚙️</span> Battleground Configuration
              </h2>
              <p className="text-xs text-slate-400 mt-1">Configure grid dimensions and roster restrictions for the match.</p>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col bg-[#16213e]/20 p-4 border border-[#0f3460]/30 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black text-gray-300 uppercase tracking-wider font-sans">
                    Grid Board Size (n × n)
                  </label>
                  <span className="text-xs font-bold font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                    {gameConfig.boardSize} × {gameConfig.boardSize}
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={15}
                  step={2}
                  value={gameConfig.boardSize}
                  onChange={e => setGameConfig(prev => ({ ...prev, boardSize: parseInt(e.target.value, 10) }))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <span className="text-[10px] text-gray-500 mt-1">
                  Adjust grid size. Typically 11 × 11 is default. Odd sizes ensure centered pedestals.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col bg-[#16213e]/20 p-4 border border-[#0f3460]/30 rounded-2xl">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 font-sans">
                    Max Roster Units
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={gameConfig.maxUnits}
                    onChange={e => setGameConfig(prev => ({ ...prev, maxUnits: Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)) }))}
                    className="bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-cyan-400 font-mono text-center"
                  />
                </div>

                <div className="flex flex-col bg-[#16213e]/20 p-4 border border-[#0f3460]/30 rounded-2xl">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 font-sans">
                    Max Roster Cost
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={gameConfig.maxCost}
                    onChange={e => setGameConfig(prev => ({ ...prev, maxCost: Math.max(5, Math.min(50, parseInt(e.target.value, 10) || 5)) }))}
                    className="bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-cyan-400 font-mono text-center"
                  />
                </div>

                <div className="flex flex-col bg-[#16213e]/20 p-4 border border-[#0f3460]/30 rounded-2xl">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 font-sans">
                    Max Legendaries
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={gameConfig.maxLegendary}
                    onChange={e => setGameConfig(prev => ({ ...prev, maxLegendary: Math.max(0, Math.min(5, parseInt(e.target.value, 10) ?? 0)) }))}
                    className="bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-white p-2.5 rounded-xl focus:outline-none focus:border-cyan-400 font-mono text-center"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setScreen("setup")}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition duration-200 cursor-pointer text-center outline-none"
              >
                ✨ Create Battle
              </button>
              
              <button
                onClick={() => setScreen("landing")}
                className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition duration-200 cursor-pointer text-center outline-none"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 0c. POKEDEX DATABASE VIEW */}
      {screen === "pokedex" && (
        <div 
          className="flex-grow min-h-[calc(100vh-3rem)] relative p-6 bg-cover bg-center bg-no-repeat overflow-y-auto"
          style={{
            backgroundImage: `radial-gradient(circle, #161a2b 0%, #06060c 100%)`
          }}
        >
          <Pokedex
            onBack={() => setScreen("landing")}
            boardSize={gameConfig.boardSize}
          />
        </div>
      )}

      {screen === "setup" && (
        <SetupScreen
          onStartGame={handleStartGame}
          p2pStatus={p2pStatus}
          peerId={peerId}
          myPlayerNumber={myPlayerNumber}
          p1Ready={p1Ready}
          p2Ready={p2Ready}
          onHostGame={onHostGame}
          onJoinGame={onJoinGame}
          onDisconnectP2P={onDisconnectP2P}
          onToggleReady={onToggleReady}
          onSyncSetupData={handleSyncSetupData}
          peerP1Slots={peerP1Slots}
          peerP1Placements={peerP1Placements}
          peerP2Slots={peerP2Slots}
          peerP2Placements={peerP2Placements}
          boardSize={gameConfig.boardSize}
          maxUnits={gameConfig.maxUnits}
          maxCost={gameConfig.maxCost}
          maxLegendary={gameConfig.maxLegendary}
        />
      )}

      {/* 2. GAME SCREEN VIEW */}
      {screen === "game" && (
        <div className="game-wrapper max-w-[1400px] w-full mx-auto bg-[#0f0f1a] rounded-3xl border border-[#0f3460]/60 shadow-2xl flex flex-col overflow-hidden relative">

          {/* Header row stats menu */}
          <div className="game-header bg-[#16213e] p-4 flex flex-wrap justify-between items-center gap-4 border-b border-[#0f3460]/90">
            <div className="turn-info flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black font-sans leading-none tracking-wide" style={{ color: gameState.currentPlayer === 1 ? '#4fc3f7' : '#ef5350' }}>
                  Player {gameState.currentPlayer} Turn
                </h1>
                {p2pStatus === "connected" && myPlayerNumber !== 0 && (
                  <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded border ${gameState.currentPlayer === myPlayerNumber
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                    }`}>
                    {gameState.currentPlayer === myPlayerNumber ? "Your Turn" : "Opponent's Turn"}
                  </span>
                )}
              </div>
              <div className="flex gap-2 items-center text-xs text-slate-400 mt-1.5 leading-none">
                <span className="font-mono">Turn: #{gameState.turn} (Phase: {gameState.phase})</span>
                <span>•</span>
                <span onClick={() => { setShopOpen(true); }} className="text-amber-400 font-black cursor-pointer hover:underline">
                  Gold: {gameState.players[gameState.currentPlayer].gold} 💰
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-sans">
                  Command Pool XP: +{gameState.players[gameState.currentPlayer].freeExp}
                </span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              {p2pStatus === "connected" && (
                <button
                  onClick={onDisconnectP2P}
                  className="bg-rose-900/50 hover:bg-rose-900 border border-rose-500/30 text-rose-200 text-xs px-3 py-1.5 rounded-full transition cursor-pointer font-bold shrink-0 outline-none"
                >
                  Leave Online
                </button>
              )}

              {/* Weather status */}
              <div className="relative">
                <button
                  onClick={() => setWeatherInfoOpen(!weatherInfoOpen)}
                  className="weather-badge bg-[#0f3460] hover:bg-[#1a4a7a] transition font-sans text-xs px-4 py-2 border border-slate-700/80 rounded-full font-bold cursor-pointer flex items-center gap-1.5"
                >
                  🌤️ Weather System: <span className="text-indigo-300 font-black font-mono ml-0.5">{gameState.weather.type || "Clear Skies"}</span>
                  <span>{weatherInfoOpen ? "▲" : "▼"}</span>
                </button>

                {weatherInfoOpen && (
                  <div className="absolute top-[40px] left-1/2 -translate-x-1/2 bg-[#0f0f1a] border border-slate-700 rounded-xl p-4 w-[280px] shadow-2xl z-[1500] text-left">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">
                      Weather System Diagnostics
                    </h4>
                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                      {/* Clear Skies */}
                      <div className={`p-1.5 rounded text-xs ${!gameState.weather.type ? "bg-slate-800 border border-slate-700 text-white font-bold" : "text-gray-400"}`}>
                        <div className="font-bold text-[11px] text-gray-200">☀️ Clear Skies {!gameState.weather.type && " (Active)"}</div>
                        <div className="text-[10px] mt-0.5">No effect.</div>
                      </div>
                      {/* Sunlight */}
                      <div className={`p-1.5 rounded text-xs ${gameState.weather.type === "Sunlight" ? "bg-amber-955/40 border border-amber-500/30 text-amber-300 font-bold" : "text-gray-400"}`}>
                        <div className="font-bold text-[11px] text-amber-400">☀️ Sunlight {gameState.weather.type === "Sunlight" && " (Active)"}</div>
                        <div className="text-[10px] mt-0.5">Fire moves +1 ATK.</div>
                      </div>
                      {/* Rain */}
                      <div className={`p-1.5 rounded text-xs ${gameState.weather.type === "Rain" ? "bg-blue-955/40 border border-blue-500/30 text-blue-300 font-bold" : "text-gray-400"}`}>
                        <div className="font-bold text-[11px] text-blue-400">🌧️ Rain {gameState.weather.type === "Rain" && " (Active)"}</div>
                        <div className="text-[10px] mt-0.5">Water moves +1 ATK.</div>
                      </div>
                      {/* Hail */}
                      <div className={`p-1.5 rounded text-xs ${gameState.weather.type === "Hail Storm" ? "bg-cyan-955/40 border border-cyan-500/30 text-cyan-300 font-bold" : "text-gray-400"}`}>
                        <div className="font-bold text-[11px] text-cyan-400">❄️ Hail Storm {gameState.weather.type === "Hail Storm" && " (Active)"}</div>
                        <div className="text-[10px] mt-0.5">All units Normal Attack DMG -1.</div>
                      </div>
                      {/* Sandstorm */}
                      <div className={`p-1.5 rounded text-xs ${gameState.weather.type === "Sandstorm" ? "bg-yellow-955/40 border border-yellow-500/30 text-yellow-300 font-bold" : "text-gray-400"}`}>
                        <div className="font-bold text-[11px] text-yellow-400">⏳ Sandstorm {gameState.weather.type === "Sandstorm" && " (Active)"}</div>
                        <div className="text-[10px] mt-0.5">All units Skill DMG -1; Rock types +1 DEF.</div>
                      </div>
                      {/* Harsh Sunlight */}
                      <div className={`p-1.5 rounded text-xs ${gameState.weather.type === "Harsh Sunlight" ? "bg-orange-955/40 border border-orange-500/30 text-orange-300 font-bold" : "text-gray-400"}`}>
                        <div className="font-bold text-[11px] text-orange-400">🔥 Harsh Sunlight {gameState.weather.type === "Harsh Sunlight" && " (Active)"}</div>
                        <div className="text-[10px] mt-0.5">Fire +1 ATK, Water -2 ATK. Overridden only by Heavy Rain/Strong Winds.</div>
                      </div>
                      {/* Heavy Rain */}
                      <div className={`p-1.5 rounded text-xs ${gameState.weather.type === "Heavy Rain" ? "bg-indigo-955/40 border border-indigo-500/30 text-indigo-300 font-bold" : "text-gray-400"}`}>
                        <div className="font-bold text-[11px] text-indigo-400">🌊 Heavy Rain {gameState.weather.type === "Heavy Rain" && " (Active)"}</div>
                        <div className="text-[10px] mt-0.5">Water +1 ATK, Fire -2 ATK. Overridden only by Harsh Sunlight/Strong Winds.</div>
                      </div>
                      {/* Strong Winds */}
                      <div className={`p-1.5 rounded text-xs ${gameState.weather.type === "Strong Winds" ? "bg-purple-955/40 border border-purple-500/30 text-purple-300 font-bold" : "text-gray-400"}`}>
                        <div className="font-bold text-[11px] text-purple-400">🌀 Strong Winds {gameState.weather.type === "Strong Winds" && " (Active)"}</div>
                        <div className="text-[10px] mt-0.5">Flying types immune to super-effective hits. Overrides all; cannot be overridden by Harsh Sunlight/Heavy Rain.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Move Points indicator */}
            <div className="mp-box bg-[#0f3460] py-1.5 px-4 rounded-xl border border-slate-700 flex items-center gap-3">
              <div className="text-center">
                <div className="text-[10px] text-gray-400 uppercase font-black leading-none">Move Points</div>
                <div className="text-xs text-cyan-400 font-extrabold font-mono mt-0.5 leading-none">
                  {gameState.movePoints?.[gameState.currentPlayer] ?? 0} / 3 🚶
                </div>
              </div>

              <div className="stars flex gap-1.5">
                {Array.from({ length: 3 }).map((_, sIdx) => (
                  <div
                    key={sIdx}
                    className={`w-3.5 h-3.5 rounded transition ${sIdx < (gameState.movePoints?.[gameState.currentPlayer] ?? 0)
                        ? "bg-[#4fc3f7] ring-2 ring-[#4fc3f7]/20 scale-110 shadow-md shadow-[#4fc3f7]/20"
                        : "bg-slate-700"
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* Energy points indicators stars */}
            <div className="energy-box bg-[#0f3460] py-1.5 px-4 rounded-xl border border-slate-700 flex items-center gap-3">
              <div className="text-center">
                <div className="text-[10px] text-gray-400 uppercase font-black leading-none">Command Pool</div>
                <div className="text-xs text-amber-500 font-extrabold font-mono mt-0.5 leading-none">
                  {gameState.energy[gameState.currentPlayer]} / {gameState.maxEnergy[gameState.currentPlayer]} ⚡
                </div>
              </div>

              <div className="stars flex gap-1.5">
                {Array.from({ length: gameState.maxEnergy[gameState.currentPlayer] }).map((_, sIdx) => (
                  <div
                    key={sIdx}
                    className={`w-3.5 h-3.5 rounded transition ${sIdx < gameState.energy[gameState.currentPlayer]
                        ? "bg-[#ff9800] ring-2 ring-[#ff9800]/20 scale-110 shadow-md shadow-[#ff9800]/20"
                        : "bg-slate-700"
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* Button selections modals */}
            <div className="action-buttons flex gap-2">
              <button
                disabled={p2pStatus === "connected" && myPlayerNumber !== 0 && gameState.currentPlayer !== myPlayerNumber}
                onClick={() => {
                  if (inventoryOpen) {
                    setInventoryOpen(false);
                  } else if (!shopOpen) {
                    setInventoryOpen(true);
                  }
                }}
                className={`action-btn px-4 py-2 bg-[#0f3460] border border-slate-700 rounded-lg text-xs font-bold uppercase transition shrink-0 outline-none ${p2pStatus === "connected" && myPlayerNumber !== 0 && gameState.currentPlayer !== myPlayerNumber
                    ? "opacity-50 cursor-not-allowed border-slate-800"
                    : "hover:bg-[#1a4a7a] cursor-pointer"
                  }`}
              >
                🎒 BACKPACK (B)
              </button>
              <button
                disabled={p2pStatus === "connected" && myPlayerNumber !== 0 && gameState.currentPlayer !== myPlayerNumber}
                onClick={() => {
                  if (shopOpen) {
                    setShopOpen(false);
                  } else if (!inventoryOpen) {
                    setShopOpen(true);
                  }
                }}
                className={`action-btn px-4 py-2 bg-[#0f3460] border border-slate-700 rounded-lg text-xs font-bold uppercase transition shrink-0 outline-none ${p2pStatus === "connected" && myPlayerNumber !== 0 && gameState.currentPlayer !== myPlayerNumber
                    ? "opacity-50 cursor-not-allowed border-slate-800"
                    : "hover:bg-[#1a4a7a] cursor-pointer"
                  }`}
              >
                🛒 SHOP (F)
              </button>
              <button
                onClick={() => setTypeChartOpen(!typeChartOpen)}
                className="action-btn px-4 py-2 bg-[#0f3460] border border-slate-700 hover:bg-[#1a4a7a] rounded-lg text-xs font-bold uppercase transition shrink-0 outline-none cursor-pointer text-white"
              >
                📊 TYPE CHART (C)
              </button>
              <button
                disabled={p2pStatus === "connected" && myPlayerNumber !== 0 && gameState.currentPlayer !== myPlayerNumber}
                onClick={handleEndTurn}
                className={`action-btn end px-5 py-2 bg-[#ef5350] text-white transition font-black text-xs uppercase rounded-lg shadow-md shadow-[#ef5350]/15 shrink-0 outline-none ${p2pStatus === "connected" && myPlayerNumber !== 0 && gameState.currentPlayer !== myPlayerNumber
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-red-700 cursor-pointer"
                  }`}
              >
                END TURN (E)
              </button>
            </div>
          </div>

          {/* Main 4-Column flexible Grid Dashboard */}
          <div className="main-grid flex flex-col lg:flex-row gap-5 p-4 md:p-6 w-full items-start relative">

            {/* Col 1: Horizontal active trackers */}
            <FieldTrackers
              pokemon={gameState.pokemon}
              selectedCell={gameState.selectedCell}
              onSelectCell={handleCellClick}
            />

            {/* Col 2: Tactical Board grid */}
            <div className="flex-1 flex justify-center min-w-0">
              <Board
                pokemon={gameState.pokemon}
                pedestals={gameState.pedestals}
                selectedCell={gameState.selectedCell}
                highlightedCells={gameState.highlightedCells}
                onCellClick={handleCellClick}
                actionModeTargets={gameState.actionMode?.targets}
                onCellHover={(col, row) => setHoveredCell({ col, row })}
                onCellHoverEnd={() => setHoveredCell(null)}
                actionMode={gameState.actionMode}
                weather={gameState.weather.type}
                hazards={gameState.hazards}
                boardSize={gameConfig.boardSize}
              />
            </div>

            {/* Col 3: stats inspector metrics details */}
            <div className="w-full lg:w-[280px] shrink-0">
              <StatsCard
                selectedCell={gameState.selectedCell}
                pokemon={gameState.pokemon}
                pedestals={gameState.pedestals}
                currentPlayer={gameState.currentPlayer}
                myPlayerNumber={myPlayerNumber}
                energy={gameState.energy[gameState.currentPlayer]}
                freeExp={gameState.players[gameState.currentPlayer].freeExp}
                onSelectAction={handleSelectAction}
                onAllocateExp={handleAllocateExp}
                onUnequipItem={handleUnequipItem}
                onRotateSkill={handleRotateSkill}
                actionMode={gameState.actionMode}
                skillMenuFor={gameState.skillMenuFor}
                onToggleSkillMenu={(id) => setGameState(prev => ({ ...prev, skillMenuFor: prev.skillMenuFor === id ? null : id }))}
                weather={gameState.weather.type}
                movePoints={gameState.movePoints}
                hoveredCell={hoveredCell}
                boardSize={gameConfig.boardSize}
              />
            </div>

            {/* Col 4: skills details and battle history logs */}
            <SkillsAndLog
              selectedCell={gameState.selectedCell}
              pokemon={gameState.pokemon}
              logs={gameState.logs}
              actionMode={gameState.actionMode}
              hoveredCell={hoveredCell}
              pedestals={gameState.pedestals}
              weather={gameState.weather.type}
              boardSize={gameConfig.boardSize}
            />

            {/* Opponent's turn is displayed via header indicators and interaction blocks directly instead of a fullscreen overlay censor scene */}
          </div>
        </div>
      )}

      {/* 3. GAME END SCREEN OVER */}
      {screen === "end" && winner && (
        <div id="screen-end" className="max-w-md mx-auto p-8 bg-[#16213e] border border-[#ef5350] rounded-2xl text-center shadow-2xl mt-12 animate-fade-in">
          <span className="text-6xl block mb-4">🏆</span>
          <h2 className="text-3xl font-black text-white uppercase tracking-wider mb-2" id="end-title">
            Player {winner.player} Victory!
          </h2>
          <p className="text-sm text-gray-400 mb-8" id="end-score">
            {winner.reason}
          </p>

          <button
            onClick={handleRestart}
            className="primary w-full py-4 text-center bg-[#4caf50] hover:bg-[#388e3c] text-[#0f0f1a] font-extrabold rounded-xl capitalize tracking-wide select-none outline-none focus:outline-none transition shadow-lg shadow-[#4caf50]/20"
          >
            Declare Next Match ➡️
          </button>
        </div>
      )}

      {/* Interactive overlays item shop & backpack inventory */}
      <Modals
        shopOpen={shopOpen}
        onToggleShop={() => setShopOpen(!shopOpen)}
        inventoryOpen={inventoryOpen}
        onToggleInventory={() => setInventoryOpen(!inventoryOpen)}
        playerState={gameState.players[gameState.currentPlayer]}
        onBuyItem={handleBuyItem}
        onUseItemAction={handleUseItemAction}
        consumablesUsedThisTurn={gameState.consumablesUsedThisTurn}
        typeChartOpen={typeChartOpen}
        onToggleTypeChart={() => setTypeChartOpen(!typeChartOpen)}
      />

      {/* Eevee Evolution Modal */}
      {(() => {
        const eeveesToEvolve = gameState.pokemon.filter(
          p => p.player === gameState.currentPlayer && !p.fainted && p.species === "Eevee" && p.pendingEvoChoice && !p.pendingEvoTo && (myPlayerNumber === 0 || p.player === myPlayerNumber)
        );
        if (eeveesToEvolve.length === 0) return null;
        const eevee = eeveesToEvolve[0];

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[3000] p-4">
            <div className="bg-slate-900 border-2 border-[#0f3460] rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
              <h3 className="text-xl font-black text-center text-yellow-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-1">
                <span>🧬 Eevee Evolution Path</span>
              </h3>
              <p className="text-xs text-center text-gray-400 mb-6 font-medium">
                Your Eevee on tile ({eevee.col}, {eevee.row}) accumulated enough EXP!
                Choose its path. It will transform at the **end of your turn**.
              </p>

              <div className="grid grid-cols-1 gap-3">
                {/* Vaporeon (Water) */}
                <button
                  onClick={() => selectEeveeEvolution(eevee.id, "Vaporeon")}
                  className="group flex items-center justify-between p-4 bg-[#1a2c4e] border border-[#2b4c80] hover:border-cyan-400 rounded-xl transition cursor-pointer select-none text-left"
                >
                  <div>
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-0.5">🌊 Water Path</span>
                    <strong className="text-sm text-gray-100 group-hover:text-cyan-300 transition">Vaporeon</strong>
                    <p className="text-[10px] text-gray-400 mt-1">High HP (12) • Acid Armor defensive buffs</p>
                  </div>
                  <span className="text-2xl group-hover:scale-110 transition">🌊</span>
                </button>

                {/* Jolteon (Electric) */}
                <button
                  onClick={() => selectEeveeEvolution(eevee.id, "Jolteon")}
                  className="group flex items-center justify-between p-4 bg-[#2c2b1e] border border-[#504e28] hover:border-yellow-400 rounded-xl transition cursor-pointer select-none text-left"
                >
                  <div>
                    <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider block mb-0.5">⚡ Electric Path</span>
                    <strong className="text-sm text-gray-100 group-hover:text-yellow-300 transition">Jolteon</strong>
                    <p className="text-[10px] text-gray-400 mt-1">High ATK (4) • Shock Wave ranged skills</p>
                  </div>
                  <span className="text-2xl group-hover:scale-110 transition">⚡</span>
                </button>

                {/* Flareon (Fire) */}
                <button
                  onClick={() => selectEeveeEvolution(eevee.id, "Flareon")}
                  className="group flex items-center justify-between p-4 bg-[#2c1e1d] border border-[#522b28] hover:border-rose-400 rounded-xl transition cursor-pointer select-none text-left"
                >
                  <div>
                    <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block mb-0.5">🔥 Fire Path</span>
                    <strong className="text-sm text-gray-100 group-hover:text-rose-300 transition">Flareon</strong>
                    <p className="text-[10px] text-gray-400 mt-1">Extreme ATK (5) • Fire Spin area skills</p>
                  </div>
                  <span className="text-2xl group-hover:scale-110 transition">🔥</span>
                </button>
              </div>

              <div className="mt-5 text-center text-[10px] text-slate-500 italic">
                *Once selected, Eevee stays active as normal; evolution resolves when Turn ends.
              </div>
            </div>
          </div>
        );
      })()}

      {/* Chance pop-ups visual modifier element */}
      {chancePopup && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl z-[2000] animate-bounce w-[220px]">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 flex justify-between">
            <span>Status Roller</span>
            <span className="text-amber-400 font-mono">D20</span>
          </h4>
          <div className="text-xs text-gray-200">
            Applying <span className="font-bold text-indigo-400 uppercase">{chancePopup.statusType}</span>
          </div>

          <div className="relative h-2 bg-slate-800 rounded-full mt-2 overflow-hidden border border-slate-950">
            {/* Threshold marker */}
            <div
              className="absolute h-full bg-[#43a047]"
              style={{ width: `${chancePopup.chance * 100}%` }}
            />
            {/* Roll pointer marker */}
            <div
              className={`absolute top-0 bottom-0 w-1 bg-white ${chancePopup.success ? "shadow-md shadow-emerald-500/50" : "shadow-md shadow-red-500/50"}`}
              style={{ left: `${(chancePopup.roll / 20) * 100}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] mt-1.5 leading-none">
            <span className="text-gray-400 font-semibold font-mono">Roll: {chancePopup.roll}/20</span>
            <span className={`font-black uppercase tracking-wider ${chancePopup.success ? "text-emerald-400" : "text-red-400"}`}>
              {chancePopup.success ? "Success" : "Failed"}
            </span>
          </div>
        </div>
      )}

      {/* Turn Transition Notice Popup */}
      {turnNotice !== null && (myPlayerNumber === 0 || myPlayerNumber === turnNotice) && (
        <div 
          onClick={() => setTurnNotice(null)}
          className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900 border-2 border-amber-400 p-4 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.6)] z-[4000] animate-bounce w-[240px] cursor-pointer transition-all hover:scale-105"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Battle Turn</span>
            <span className="text-base animate-pulse">⚔️</span>
          </div>
          <div className="text-sm font-black text-white uppercase tracking-wide">
            {myPlayerNumber === 0 ? `Player ${turnNotice}'s Turn` : "YOUR TURN!"}
          </div>
          <div className="flex justify-between items-center text-[9px] mt-2 leading-none text-gray-400 font-medium">
            <span>Press <span className="text-white font-mono bg-slate-800 px-1 rounded">Q</span> or click to close</span>
            <span className="text-amber-400 font-bold font-mono">3s</span>
          </div>
        </div>
      )}
    </main>
  );
}
