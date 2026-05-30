/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { DB } from "../data/pokemon";
import { TCOL } from "../data/typeCharts";
import { PokemonDBEntry } from "../types";

function isMythical(name: string, p: PokemonDBEntry): boolean {
  return p.hatchGroup === "Mythical" || ["Mew", "Celebi", "Jirachi", "Deoxys", "Phione", "Manaphy", "Darkrai", "Shaymin", "Arceus", "Victini", "Keldeo", "Meloetta", "Genesect", "Diancie", "Hoopa", "Volcanion"].includes(name);
}

interface SetupScreenProps {
  onStartGame: (p1Team: { species: string; col: number; row: number }[], p2Team: { species: string; col: number; row: number }[]) => void;
  p2pStatus: "disconnected" | "connecting" | "connected";
  peerId: string | null;
  myPlayerNumber: number;
  p1Ready: boolean;
  p2Ready: boolean;
  onHostGame: () => void;
  onJoinGame: (id: string) => void;
  onDisconnectP2P: () => void;
  onToggleReady: () => void;
  onSyncSetupData: (slots: string[], placements: { col: number; row: number }[]) => void;
  peerP1Slots?: string[];
  peerP1Placements?: { col: number; row: number }[];
  peerP2Slots?: string[];
  peerP2Placements?: { col: number; row: number }[];
  boardSize?: number;
  maxUnits?: number;
  maxCost?: number;
  maxLegendary?: number;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onStartGame,
  p2pStatus,
  peerId,
  myPlayerNumber,
  p1Ready,
  p2Ready,
  onHostGame,
  onJoinGame,
  onDisconnectP2P,
  onToggleReady,
  onSyncSetupData,
  peerP1Slots,
  peerP1Placements,
  peerP2Slots,
  peerP2Placements,
  boardSize = 11,
  maxUnits = 6,
  maxCost = 15,
  maxLegendary = 1
}) => {
  // Input for joining online games
  const [joinId, setJoinId] = useState<string>("");

  // Filter settings
  const [costFilter, setCostFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [genFilter, setGenFilter] = useState<string>("all");

  // Selected slots (which slot is active for board placement setting)
  const [selectedPlayer, setSelectedPlayer] = useState<number>(1);
  const [selectedSlot, setSelectedSlot] = useState<number>(0);

  // Teams selections (maxUnits slots)
  const [p1Slots, setP1Slots] = useState<string[]>(() => Array(maxUnits).fill(""));
  const [p2Slots, setP2Slots] = useState<string[]>(() => Array(maxUnits).fill(""));

  const getP1TypeCounts = () => {
    const counts: { [t: string]: number } = {};
    p1Slots.forEach(sp => {
      if (!sp) return;
      const db = DB[sp];
      if (!db) return;
      const types = [db.t1];
      if (db.t2 && db.t2 !== "None") {
        types.push(db.t2);
      }
      types.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const getP2TypeCounts = () => {
    const counts: { [t: string]: number } = {};
    p2Slots.forEach(sp => {
      if (!sp) return;
      const db = DB[sp];
      if (!db) return;
      const types = [db.t1];
      if (db.t2 && db.t2 !== "None") {
        types.push(db.t2);
      }
      types.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  // Board placements
  const [p1Placements, setP1Placements] = useState<{ col: number; row: number }[]>(() =>
    Array.from({ length: maxUnits }, (_, i) => ({ col: i % boardSize, row: 1 + Math.floor(i / boardSize) }))
  );
  const [p2Placements, setP2Placements] = useState<{ col: number; row: number }[]>(() =>
    Array.from({ length: maxUnits }, (_, i) => ({ col: (i + 1) % boardSize, row: boardSize - 2 - Math.floor(i / boardSize) }))
  );

  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  // Reset/re-initialize slots and placements when custom config parameters change
  React.useEffect(() => {
    setP1Slots(Array(maxUnits).fill(""));
    setP2Slots(Array(maxUnits).fill(""));
    setP1Placements(Array.from({ length: maxUnits }, (_, i) => ({ col: i % boardSize, row: 1 + Math.floor(i / boardSize) })));
    setP2Placements(Array.from({ length: maxUnits }, (_, i) => ({ col: (i + 1) % boardSize, row: boardSize - 2 - Math.floor(i / boardSize) })));
    setSelectedSlot(0);
    setWarningMsg(null);
  }, [maxUnits, boardSize]);

  // Synchronize slots and placements from Peer
  React.useEffect(() => {
    if (p2pStatus === "connected" && peerP1Slots) {
      setP1Slots(peerP1Slots);
    }
  }, [peerP1Slots, p2pStatus]);

  React.useEffect(() => {
    if (p2pStatus === "connected" && peerP1Placements) {
      setP1Placements(peerP1Placements);
    }
  }, [peerP1Placements, p2pStatus]);

  React.useEffect(() => {
    if (p2pStatus === "connected" && peerP2Slots) {
      setP2Slots(peerP2Slots);
    }
  }, [peerP2Slots, p2pStatus]);

  React.useEffect(() => {
    if (p2pStatus === "connected" && peerP2Placements) {
      setP2Placements(peerP2Placements);
    }
  }, [peerP2Placements, p2pStatus]);

  // Lock selectedPlayer to myPlayerNumber when connected
  React.useEffect(() => {
    if (p2pStatus === "connected" && myPlayerNumber !== 0) {
      setSelectedPlayer(myPlayerNumber);
    }
  }, [p2pStatus, myPlayerNumber]);

  // Computed fields
  const p1TotalCost = p1Slots.reduce((sum, sp) => sum + (DB[sp]?.cost || 0), 0);
  const p2TotalCost = p2Slots.reduce((sum, sp) => sum + (DB[sp]?.cost || 0), 0);

  const parsedTypes = Array.from(
    new Set(Object.values(DB).flatMap(p => [p.t1, p.t2].filter(Boolean)))
  ).sort();

  const filteredSpecies = Object.keys(DB).filter(name => {
    const p = DB[name];
    if (!p) return false;
    if (name === "Clear Bell" || name === "Tidal Bell" || name === "Tidal bell" || p.isSummon) return false;
    
    const isBase = p.base || !p.evoFrom || p.evoFrom === "None" || p.evoFrom === "";
    if (!isBase) return false; // Only base stages of evolution are allowed
    
    if (costFilter !== "all" && p.cost.toString() !== costFilter) return false;
    if (typeFilter !== "all" && p.t1 !== typeFilter && p.t2 !== typeFilter) return false;
    if (roleFilter !== "all" && p.cls !== roleFilter) return false;
    
    const isMyth = isMythical(name, p);
    if (rarityFilter === "legendary" && (!p.legendary || isMyth)) return false;
    if (rarityFilter === "mythical" && !isMyth) return false;
    if (rarityFilter === "non-legendary" && (p.legendary || isMyth)) return false;
    
    if (genFilter === "gen1" && p.dex > 151) return false;
    if (genFilter === "gen2" && (p.dex <= 151 || p.dex > 251)) return false;
    if (genFilter === "gen3" && (p.dex <= 251 || p.dex > 386)) return false;
    if (genFilter === "gen4" && (p.dex <= 386 || p.dex > 493)) return false;
    if (genFilter === "gen5" && (p.dex <= 493 || p.dex > 649)) return false;
    if (genFilter === "gen6" && p.dex <= 649) return false;
    return true;
  }).sort();

  const handleSlotSelect = (player: number, slotIdx: number, species: string) => {
    if (p2pStatus === "connected") {
      if (myPlayerNumber === 1 && player !== 1) return;
      if (myPlayerNumber === 2 && player !== 2) return;
    }

    if (player === 1) {
      const next = [...p1Slots];
      next[slotIdx] = species;
      setP1Slots(next);
      if (p2pStatus === "connected" && myPlayerNumber === 1) {
        onSyncSetupData(next, p1Placements);
      }
    } else {
      const next = [...p2Slots];
      next[slotIdx] = species;
      setP2Slots(next);
      if (p2pStatus === "connected" && myPlayerNumber === 2) {
        onSyncSetupData(next, p2Placements);
      }
    }
  };

  const p1SpawnRows = Math.min(3, Math.floor((boardSize - 1) / 2));

  const handleCellPlacement = (col: number, row: number) => {
    if (p2pStatus === "connected") {
      if (selectedPlayer !== myPlayerNumber) return;
    }

    if (selectedPlayer === 1) {
      if (row >= p1SpawnRows) return; // P1 only rows 1 to spawn zone limit
      const nextPlacements = [...p1Placements];
      nextPlacements[selectedSlot] = { col, row };
      setP1Placements(nextPlacements);
      if (p2pStatus === "connected" && myPlayerNumber === 1) {
        onSyncSetupData(p1Slots, nextPlacements);
      }
    } else {
      if (row < boardSize - p1SpawnRows) return; // P2 only rows boardSize-limit to boardSize
      const nextPlacements = [...p2Placements];
      nextPlacements[selectedSlot] = { col, row };
      setP2Placements(nextPlacements);
      if (p2pStatus === "connected" && myPlayerNumber === 2) {
        onSyncSetupData(p2Slots, nextPlacements);
      }
    }
  };

  const startPlaying = () => {
    // Validate
    const p1Active = p1Slots.map((sp, idx) => ({ sp, idx })).filter(item => item.sp !== "");
    const p2Active = p2Slots.map((sp, idx) => ({ sp, idx })).filter(item => item.sp !== "");

    if (p2pStatus === "connected") {
      if (myPlayerNumber === 1) {
        if (p1Active.length === 0) {
          setWarningMsg("Your team needs at least 1 Pokemon!");
          return;
        }
        if (p1TotalCost > maxCost) {
          setWarningMsg(`Your team cost (${p1TotalCost}) exceeds ${maxCost}!`);
          return;
        }
        const p1LegendaryCount = p1Active.filter(item => DB[item.sp]?.legendary).length;
        if (p1LegendaryCount > maxLegendary) {
          setWarningMsg(`Your team can contain at most ${maxLegendary} Legendary Pokémon!`);
          return;
        }
      } else if (myPlayerNumber === 2) {
        if (p2Active.length === 0) {
          setWarningMsg("Your team needs at least 1 Pokemon!");
          return;
        }
        if (p2TotalCost > maxCost) {
          setWarningMsg(`Your team cost (${p2TotalCost}) exceeds ${maxCost}!`);
          return;
        }
        const p2LegendaryCount = p2Active.filter(item => DB[item.sp]?.legendary).length;
        if (p2LegendaryCount > maxLegendary) {
          setWarningMsg(`Your team can contain at most ${maxLegendary} Legendary Pokémon!`);
          return;
        }
      }
      setWarningMsg(null);
      onToggleReady();
      return;
    }

    if (p1Active.length === 0) {
      setWarningMsg("Player 1 needs at least 1 Pokemon!");
      return;
    }
    if (p2Active.length === 0) {
      setWarningMsg("Player 2 needs at least 1 Pokemon!");
      return;
    }

    if (p1TotalCost > maxCost) {
      setWarningMsg(`Player 1 team cost (${p1TotalCost}) exceeds ${maxCost}!`);
      return;
    }
    if (p2TotalCost > maxCost) {
      setWarningMsg(`Player 2 team cost (${p2TotalCost}) exceeds ${maxCost}!`);
      return;
    }

    const p1LegendaryCount = p1Active.filter(item => DB[item.sp]?.legendary).length;
    const p2LegendaryCount = p2Active.filter(item => DB[item.sp]?.legendary).length;

    if (p1LegendaryCount > maxLegendary) {
      setWarningMsg(`Player 1 team can contain at most ${maxLegendary} Legendary Pokémon!`);
      return;
    }
    if (p2LegendaryCount > maxLegendary) {
      setWarningMsg(`Player 2 team can contain at most ${maxLegendary} Legendary Pokémon!`);
      return;
    }

    // Map selections to fully specified positions
    const p1Team = p1Active.map(item => ({
      species: item.sp,
      col: p1Placements[item.idx].col,
      row: p1Placements[item.idx].row
    }));

    const p2Team = p2Active.map(item => ({
      species: item.sp,
      col: p2Placements[item.idx].col,
      row: p2Placements[item.idx].row
    }));

    setWarningMsg(null);
    onStartGame(p1Team, p2Team);
  };

  const getOccupantSymbol = (col: number, row: number) => {
    // Check if occupied by any slot
    for (let i = 0; i < maxUnits; i++) {
      if (p1Slots[i] && p1Placements[i] && p1Placements[i].col === col && p1Placements[i].row === row) {
        return { player: 1, idx: i, species: p1Slots[i] };
      }
      if (p2Slots[i] && p2Placements[i] && p2Placements[i].col === col && p2Placements[i].row === row) {
        return { player: 2, idx: i, species: p2Slots[i] };
      }
    }
    return null;
  };

  return (
    <div id="screen-setup" className="max-w-4xl mx-auto p-4 md:p-6 bg-[#16213e]/90 rounded-2xl shadow-2xl border border-[#0f3460]">
      <div className="setup-header text-center mb-6">
        <h2 className="text-3xl font-bold text-white tracking-wide font-sans mb-1">Pokémon Chess</h2>
        <p className="text-sm text-gray-400">Assemble your team: Max Budget {maxCost} · Up to {maxLegendary} Legendary · Up to {maxUnits} active units</p>
      </div>

      {/* P2P Multiplayer Connection Panel */}
      <div className="bg-[#0f0f1a] p-4 rounded-xl border border-[#2a3a5a] mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>🌐</span> P2P Online Multiplayer
          </h3>
          <p className="text-[11px] text-gray-400 mt-1">
            {p2pStatus === "connected" 
              ? `Connected! You are ${myPlayerNumber === 1 ? "Player 1 (Blue)" : "Player 2 (Red)"}`
              : p2pStatus === "connecting"
              ? "Connecting to PeerJS Network..."
              : "Play with a friend on another device or browser tab using PeerJS."}
          </p>
        </div>

        {p2pStatus === "disconnected" ? (
          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center shrink-0">
            <button
              onClick={onHostGame}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition cursor-pointer"
            >
              Host Game
            </button>
            <div className="flex gap-1.5 items-center bg-slate-900 border border-slate-800 p-1 rounded-lg">
              <input
                type="text"
                placeholder="Host Peer ID"
                value={joinId}
                onChange={e => setJoinId(e.target.value)}
                className="bg-transparent text-xs text-white px-2 py-1 outline-none w-32 border-none"
              />
              <button
                onClick={() => { if (joinId.trim()) onJoinGame(joinId.trim()); }}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-md transition cursor-pointer"
              >
                Join
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 items-center shrink-0">
            {peerId && (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-gray-300">
                <span className="text-gray-500 font-sans">Your ID:</span>
                <span>{peerId}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(peerId)}
                  className="text-amber-400 hover:text-amber-300 font-sans font-bold ml-1.5 underline cursor-pointer"
                >
                  Copy
                </button>
              </div>
            )}
            <button
              onClick={onDisconnectP2P}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition cursor-pointer"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {warningMsg && (
        <div className="bg-red-950/80 border border-red-500/50 text-red-100 p-3 rounded-lg mb-6 text-center text-sm font-semibold animate-pulse">
          ⚠️ {warningMsg}
        </div>
      )}

      {/* Modern Parameter Filter panel */}
      <div className="setup-filters-panel bg-[#0f0f1a] p-4 rounded-xl border border-[#2a3a5a] mb-6 flex flex-col gap-4">
        {/* Cost filters */}
        <div className="filter-group">
          <span className="filter-group-label text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Filter Cost (Gold)</span>
          <div className="filter-tabs flex flex-wrap gap-2">
            {["all", "1", "2", "3", "4", "5", "6", "7"].map(c => (
              <button
                key={c}
                onClick={() => setCostFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition border ${
                  costFilter === c
                    ? "bg-[#4fc3f7] text-[#1a1a2e] border-[#4fc3f7]"
                    : "bg-[#1a2a4a] text-gray-300 border-[#2a3a5a] hover:bg-[#1a4a7a]"
                }`}
              >
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
        </div>

        {/* Type filters */}
        <div className="filter-group">
          <span className="filter-group-label text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Filter Elemental Type</span>
          <div className="filter-tabs flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition border ${
                typeFilter === "all"
                  ? "bg-[#4fc3f7] text-[#1a1a2e] border-[#4fc3f7]"
                  : "bg-[#1a2a4a] text-gray-300 border-[#2a3a5a] hover:bg-[#1a4a7a]"
              }`}
            >
              All Types
            </button>
            {parsedTypes.map(t => {
              const isSelected = typeFilter === t;
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                    isSelected ? "text-white font-bold" : "hover:border-gray-400"
                  }`}
                  style={{
                    backgroundColor: isSelected ? TCOL[t] : "#1a2a4a",
                    borderColor: isSelected ? TCOL[t] : `${TCOL[t]}44`,
                    color: isSelected ? "#ffffff" : TCOL[t]
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Roles, Rarity, and Generation in separate rows */}
        <div className="flex flex-col gap-4">
          <div className="filter-group">
            <span className="filter-group-label text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Filter Class Role</span>
            <div className="filter-tabs flex gap-2">
              {["all", "Attack", "Defense", "Support", "Assassin"].map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition border flex-1 ${
                    roleFilter === r
                      ? "bg-[#4fc3f7] text-[#1a1a2e] border-[#4fc3f7]"
                      : "bg-[#1a2a4a] text-gray-300 border-[#2a3a5a] hover:bg-[#1a4a7a]"
                  }`}
                >
                  {r === "all" ? "All" : r}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-group-label text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Rarity Specification</span>
            <div className="filter-tabs flex gap-2">
              {["all", "legendary", "mythical", "non-legendary"].map(rv => {
                const isSelected = rarityFilter === rv;
                let activeStyle = "";
                if (isSelected) {
                  if (rv === "legendary") {
                    activeStyle = "bg-[#ffd700] text-[#1a1a2e] border-[#ffd700] font-bold";
                  } else if (rv === "mythical") {
                    activeStyle = "bg-purple-600 text-white border-purple-600 font-bold";
                  } else if (rv === "non-legendary") {
                    activeStyle = "bg-slate-500 text-white border-slate-500 font-bold";
                  } else {
                    activeStyle = "bg-[#4fc3f7] text-[#1a1a2e] border-[#4fc3f7] font-bold";
                  }
                } else {
                  activeStyle = "bg-[#1a2a4a] text-gray-300 border-[#2a3a5a] hover:bg-[#1a4a7a]";
                }

                return (
                  <button
                    key={rv}
                    onClick={() => setRarityFilter(rv)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition border flex-1 capitalize ${activeStyle}`}
                  >
                    {rv === "all" ? "All" : rv === "legendary" ? "Legendary" : rv === "mythical" ? "Mythical" : "Standard"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-group-label text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Generation Filter</span>
            <div className="filter-tabs flex flex-wrap gap-2">
              {["all", "gen1", "gen2", "gen3", "gen4", "gen5", "gen6"].map(g => (
                <button
                  key={g}
                  onClick={() => setGenFilter(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition border flex-1 min-w-[70px] uppercase ${
                    genFilter === g
                      ? "bg-[#4fc3f7] text-[#1a1a2e] border-[#4fc3f7] font-bold"
                      : "bg-[#1a2a4a] text-gray-300 border-[#2a3a5a] hover:bg-[#1a4a7a]"
                  }`}
                >
                  {g === "all" ? "All" : g === "gen1" ? "Gen 1" : g === "gen2" ? "Gen 2" : g === "gen3" ? "Gen 3" : g === "gen4" ? "Gen 4" : g === "gen5" ? "Gen 5" : "Gen 6"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selection Board grids setup and placement */}
      <div className="setup-placement bg-[#0f0f1a] p-4 rounded-xl border border-[#2a3a5a] mb-6">
        <div className="setup-placement-header flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div className="text-gray-300 font-semibold">
            Deploy Selected Slot: <span className="text-[#ffd700]">Player {selectedPlayer} (Slot #{selectedSlot + 1})</span>
          </div>
          <div className="text-xs text-gray-400">
            Click any grid tile in your designated rows to relocate the slot's battlefield spawn point.
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 justify-center">
          {/* Player 1 deployment grid */}
          <div className="flex flex-col items-center">
            <div className="text-xs font-bold text-[#4fc3f7] mb-2 uppercase tracking-wide">Player 1 rows (1-{p1SpawnRows})</div>
            <div className="grid gap-1 bg-[#16213e] p-2 rounded-lg" style={{ gridTemplateColumns: `repeat(${boardSize}, 30px)` }}>
              {Array.from({ length: p1SpawnRows }, (_, rIdx) => (
                <React.Fragment key={rIdx}>
                  {Array.from({ length: boardSize }, (_, cIdx) => {
                    const row = rIdx;
                    const col = cIdx;
                    const occ = getOccupantSymbol(col, row);
                    const isSelectedVal = selectedPlayer === 1 && p1Placements[selectedSlot] && p1Placements[selectedSlot].col === col && p1Placements[selectedSlot].row === row;
                    const isPedestalLoc = col === Math.floor(boardSize / 2) && row === 0;

                    return (
                      <div
                        key={col}
                        onClick={() => !isPedestalLoc && handleCellPlacement(col, row)}
                        className={`w-[30px] h-[30px] rounded flex items-center justify-center relative cursor-pointer text-[8px] transition ${
                          isPedestalLoc
                            ? "bg-slate-700/80 border border-slate-500"
                            : isSelectedVal
                            ? "bg-[#2a5a8a] border-2 border-[#ffd700]"
                            : "bg-[#0f3460] border border-[#2a3a5a] hover:bg-[#1a4a7a]"
                        }`}
                      >
                        <span className="absolute top-[1px] left-1 text-[7px] text-gray-500">
                          {String.fromCharCode(65 + col)}{row + 1}
                        </span>

                        {isPedestalLoc ? (
                          <div className="text-sm">🏛️</div>
                        ) : occ ? (
                          <img
                            src={DB[occ.species]?.img}
                            alt={occ.species}
                            className={`w-[85%] h-[85%] object-contain ${occ.player === 1 ? "bg-[#4fc3f7]/20" : "bg-[#ef5350]/20"} rounded-full`}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Player 2 deployment grid */}
          <div className="flex flex-col items-center">
            <div className="text-xs font-bold text-[#ef5350] mb-2 uppercase tracking-wide">Player 2 rows ({boardSize - p1SpawnRows + 1}-{boardSize})</div>
            <div className="grid gap-1 bg-[#16213e] p-2 rounded-lg" style={{ gridTemplateColumns: `repeat(${boardSize}, 30px)` }}>
              {Array.from({ length: p1SpawnRows }, (_, rIdx) => (
                <React.Fragment key={rIdx}>
                  {Array.from({ length: boardSize }, (_, cIdx) => {
                    const row = rIdx + (boardSize - p1SpawnRows);
                    const col = cIdx;
                    const occ = getOccupantSymbol(col, row);
                    const isSelectedVal = selectedPlayer === 2 && p2Placements[selectedSlot] && p2Placements[selectedSlot].col === col && p2Placements[selectedSlot].row === row;
                    const isPedestalLoc = col === Math.floor(boardSize / 2) && row === boardSize - 1;

                    return (
                      <div
                        key={col}
                        onClick={() => !isPedestalLoc && handleCellPlacement(col, row)}
                        className={`w-[30px] h-[30px] rounded flex items-center justify-center relative cursor-pointer text-[8px] transition ${
                          isPedestalLoc
                            ? "bg-slate-700/80 border border-slate-500"
                            : isSelectedVal
                            ? "bg-[#2a5a8a] border-2 border-[#ffd700]"
                            : "bg-[#0f0f1a] border border-[#2a3a5a] hover:bg-[#1a4a7a]"
                        }`}
                      >
                        <span className="absolute top-[1px] left-1 text-[7px] text-gray-500">
                          {String.fromCharCode(65 + col)}{row + 1}
                        </span>

                        {isPedestalLoc ? (
                          <div className="text-sm">🏛️</div>
                        ) : occ ? (
                          <img
                            src={DB[occ.species]?.img}
                            alt={occ.species}
                            className={`w-[85%] h-[85%] object-contain ${occ.player === 1 ? "bg-[#4fc3f7]/20" : "bg-[#ef5350]/20"} rounded-full`}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid selector slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Player 1 Team slot List */}
        <div className="team-section bg-[#0f0f1a] rounded-xl p-4 border border-[#4fc3f7]/30">
          <div className="team-title text-sm font-bold text-[#4fc3f7] uppercase tracking-wider mb-3">
            🔵 Player 1 Team Roster (Blue)
          </div>

          {(() => {
            const p1TypeCounts = getP1TypeCounts();
            if (p1TypeCounts.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-[#16213e]/20 rounded border border-[#2a3a5a]/50 text-[11px] items-center">
                <span className="text-gray-400 font-bold">Types:</span>
                {p1TypeCounts.map(([type, count]) => (
                  <span 
                    key={type} 
                    className="px-1.5 py-0.5 rounded text-white font-extrabold text-[10px] shadow-sm"
                    style={{ backgroundColor: TCOL[type] || "#7f8c8d" }}
                  >
                    {count} {type}
                  </span>
                ))}
              </div>
            );
          })()}

          <div className="flex flex-col gap-2">
            {p1Slots.map((slotSp, sIdx) => {
              const isActive = selectedPlayer === 1 && selectedSlot === sIdx;
              const meta = DB[slotSp];
              return (
                <div
                  key={sIdx}
                  onClick={() => {
                    if (p2pStatus === "connected" && myPlayerNumber !== 1) return;
                    setSelectedPlayer(1);
                    setSelectedSlot(sIdx);
                  }}
                  className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition ${
                    isActive
                      ? "bg-[#1a2a4a]/80 border-[#4fc3f7] shadow-lg shadow-[#4fc3f7]/5"
                      : "bg-[#16213e]/40 border-[#2a3a5a] hover:bg-[#1a2a4a]/40"
                  }`}
                >
                  <span className="w-5 text-gray-500 font-mono text-center text-xs">#{sIdx + 1}</span>

                  <select
                     disabled={p2pStatus === "connected" && myPlayerNumber !== 1}
                     value={slotSp}
                     onChange={(e) => handleSlotSelect(1, sIdx, e.target.value)}
                     className={`flex-1 bg-[#0f0f1a] border border-[#2a3a5a] rounded p-1 text-xs text-gray-100 font-sans focus:outline-none focus:border-[#4fc3f7] ${
                       p2pStatus === "connected" && myPlayerNumber !== 1 ? "opacity-60 cursor-not-allowed" : ""
                     }`}
                  >
                    <option value="">— Empty Slot —</option>
                    {filteredSpecies.map(spName => (
                      <option key={spName} value={spName}>
                        {spName} ({DB[spName].cost} Gold) {DB[spName].legendary ? "★ Egg" : ""}
                      </option>
                    ))}
                    {slotSp && !filteredSpecies.includes(slotSp) && (
                      <option key={slotSp} value={slotSp}>
                        {slotSp} ({DB[slotSp].cost} Gold)
                      </option>
                    )}
                  </select>

                  <div className="flex items-center gap-2">
                    {meta && (
                      <span className="text-[10px] uppercase font-bold text-gray-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {meta.cls}
                      </span>
                    )}
                    <span className="cost-badge text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 min-w-12 text-center text-gray-300">
                      Cost: {meta?.cost || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="total-cost text-right mt-3 text-xs font-semibold">
            Total cost:{" "}
            <span className={p1TotalCost > maxCost ? "text-[#ef5350] font-bold" : "text-[#4caf50]"}>
              {p1TotalCost} / {maxCost} Gold
            </span>
          </div>
        </div>

        {/* Player 2 Team slot List */}
        <div className="team-section bg-[#0f0f1a] rounded-xl p-4 border border-[#ef5350]/30">
          <div className="team-title text-sm font-bold text-[#ef5350] uppercase tracking-wider mb-3">
            🔴 Player 2 Team Roster (Red)
          </div>

          {(() => {
            const p2TypeCounts = getP2TypeCounts();
            if (p2TypeCounts.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-[#16213e]/20 rounded border border-[#2a3a5a]/50 text-[11px] items-center">
                <span className="text-gray-400 font-bold">Types:</span>
                {p2TypeCounts.map(([type, count]) => (
                  <span 
                    key={type} 
                    className="px-1.5 py-0.5 rounded text-white font-extrabold text-[10px] shadow-sm"
                    style={{ backgroundColor: TCOL[type] || "#7f8c8d" }}
                  >
                    {count} {type}
                  </span>
                ))}
              </div>
            );
          })()}

          <div className="flex flex-col gap-2">
            {p2Slots.map((slotSp, sIdx) => {
              const isActive = selectedPlayer === 2 && selectedSlot === sIdx;
              const meta = DB[slotSp];
              return (
                <div
                  key={sIdx}
                  onClick={() => {
                    if (p2pStatus === "connected" && myPlayerNumber !== 2) return;
                    setSelectedPlayer(2);
                    setSelectedSlot(sIdx);
                  }}
                  className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition ${
                    isActive
                      ? "bg-[#2a1d2e]/80 border-[#ef5350] shadow-lg shadow-[#ef5350]/5"
                      : "bg-[#16213e]/40 border-[#2a3a5a] hover:bg-[#2a1d2e]/40"
                  }`}
                >
                  <span className="w-5 text-gray-500 font-mono text-center text-xs">#{sIdx + 1}</span>

                  <select
                     disabled={p2pStatus === "connected" && myPlayerNumber !== 2}
                     value={slotSp}
                     onChange={(e) => handleSlotSelect(2, sIdx, e.target.value)}
                     className={`flex-1 bg-[#0f0f1a] border border-[#2a3a5a] rounded p-1 text-xs text-gray-100 font-sans focus:outline-none focus:border-[#ef5350] ${
                       p2pStatus === "connected" && myPlayerNumber !== 2 ? "opacity-60 cursor-not-allowed" : ""
                     }`}
                  >
                    <option value="">— Empty Slot —</option>
                    {filteredSpecies.map(spName => (
                      <option key={spName} value={spName}>
                        {spName} ({DB[spName].cost} Gold) {DB[spName].legendary ? "★ Egg" : ""}
                      </option>
                    ))}
                    {slotSp && !filteredSpecies.includes(slotSp) && (
                      <option key={slotSp} value={slotSp}>
                        {slotSp} ({DB[slotSp].cost} Gold)
                      </option>
                    )}
                  </select>

                  <div className="flex items-center gap-2">
                    {meta && (
                      <span className="text-[10px] uppercase font-bold text-gray-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {meta.cls}
                      </span>
                    )}
                    <span className="cost-badge text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 min-w-12 text-center text-gray-300">
                      Cost: {meta?.cost || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="total-cost text-right mt-3 text-xs font-semibold">
            Total cost:{" "}
            <span className={p2TotalCost > maxCost ? "text-[#ef5350] font-bold" : "text-[#4caf50]"}>
              {p2TotalCost} / {maxCost} Gold
            </span>
          </div>
        </div>
      </div>

      {p2pStatus === "connected" ? (
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className={`w-3.5 h-3.5 rounded-full ${p1Ready ? "bg-emerald-500" : "bg-slate-700"}`} />
              <span className={p1Ready ? "text-emerald-400" : "text-gray-400"}>Player 1 (Host): {p1Ready ? "Ready" : "Building..."}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3.5 h-3.5 rounded-full ${p2Ready ? "bg-emerald-500" : "bg-slate-700"}`} />
              <span className={p2Ready ? "text-emerald-400" : "text-gray-400"}>Player 2 (Guest): {p2Ready ? "Ready" : "Building..."}</span>
            </div>
          </div>
          <button
            onClick={startPlaying}
            className={`w-full py-4 text-center text-[#0f0f1a] uppercase tracking-wider font-extrabold text-sm rounded-xl cursor-pointer transition transform active:scale-95 shadow-xl ${
              (myPlayerNumber === 1 ? p1Ready : p2Ready)
                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                : "bg-[#4caf50] hover:bg-[#388e3c] shadow-[#4caf50]/20"
            }`}
          >
            {(myPlayerNumber === 1 ? p1Ready : p2Ready) ? "Cancel Ready" : "Ready to Battle"}
          </button>
        </div>
      ) : (
        <button
          onClick={startPlaying}
          className="start-btn w-full py-4 text-center bg-[#4caf50] hover:bg-[#388e3c] text-[#0f0f1a] uppercase tracking-wider font-extrabold text-sm rounded-xl cursor-pointer transition transform active:scale-95 shadow-xl shadow-[#4caf50]/20"
        >
          Confirm Rosters & Deployment
        </button>
      )}
    </div>
  );
};
