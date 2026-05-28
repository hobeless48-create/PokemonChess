import React from "react";
import { PokemonEntity, Pedestal } from "../types";
import { DB } from "../data/pokemon";
import { SCOL } from "../data/typeCharts";
import { predictDamage } from "../utils/gameEngine";

interface BoardProps {
  pokemon: PokemonEntity[];
  pedestals: Pedestal[];
  selectedCell: { col: number; row: number } | null;
  highlightedCells: { col: number; row: number; type: "move" | "atk" | "atk-preview" | "skill-preview" }[];
  onCellClick: (col: number, row: number) => void;
  actionModeTargets?: { col: number; row: number }[];
  onCellHover?: (col: number, row: number) => void;
  onCellHoverEnd?: () => void;
  actionMode?: any;
  weather?: string | null;
  terrain?: string | null;
  hazards?: any[];
  boardSize?: number;
  onCellRightClick?: (col: number, row: number) => void;
  radiusPreviewCells?: { col: number; row: number }[];
}

function getEmojiFor(species: string): string | null {
  const name = species.toLowerCase();
  if (name === "zygarde cell") return "🟢";
  if (name === "zygarde reassembly unit") return "📦";
  if (name === "clear bell" || name === "tidal bell") return "🔔";
  if (name.includes("pillar")) return "🪨";
  
  const db = DB[species];
  if (!db || db.isSummon) {
    if (db?.cls === "Defense" || name.includes("rock") || name.includes("stone") || name.includes("shield")) return "🪨";
    return "👾";
  }
  if (!db.img || db.img.trim() === "") {
    return "👾";
  }
  return null;
}

export const Board: React.FC<BoardProps> = ({
  pokemon,
  pedestals,
  selectedCell,
  highlightedCells,
  onCellClick,
  actionModeTargets = [],
  onCellHover,
  onCellHoverEnd,
  actionMode,
  weather = null,
  terrain = null,
  hazards = [],
  boardSize = 11,
  onCellRightClick,
  radiusPreviewCells = []
}) => {
  const getHighlightType = (col: number, row: number): "move" | "atk" | "atk-preview" | "skill-preview" | null => {
    const found = highlightedCells.find(h => h.col === col && h.row === row);
    return found ? found.type : null;
  };

  const isTargetSelected = (col: number, row: number): boolean => {
    return actionModeTargets.some(t => t.col === col && t.row === row);
  };

  const cols = Array.from({ length: boardSize }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className="board-section flex flex-col items-center bg-[#16213e] p-4 rounded-2xl border border-[#2a3a5a] shadow-xl">
      {/* Column labels A-K */}
      <div className="board-labels-top flex pl-8 mb-2">
        {cols.map(char => (
          <span key={char} className="w-10 text-center text-xs font-bold text-gray-400">
            {char}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-[2px]">
        {Array.from({ length: boardSize }, (_, rowIdx) => (
          <div key={rowIdx} className="board-row flex items-center">
            {/* Row Number */}
            <span className="row-label w-8 text-xs font-bold text-gray-400 text-right pr-3 shrink-0">
              {rowIdx + 1}
            </span>

            {/* Column cells */}
            {Array.from({ length: boardSize }, (_, colIdx) => {
              const alternateDark = (colIdx + rowIdx) % 2 !== 0;
              const hl = getHighlightType(colIdx, rowIdx);
              const isSelected = selectedCell?.col === colIdx && selectedCell?.row === rowIdx;
              const isTargSelected = isTargetSelected(colIdx, rowIdx);
              const isRadiusPreview = radiusPreviewCells.some(c => c.col === colIdx && c.row === rowIdx);

              const pkMatch = pokemon.find(p => p.col === colIdx && p.row === rowIdx && !p.fainted);
              const pedMatch = pedestals.find(pd => pd.col === colIdx && pd.row === rowIdx);

              const cellHazards = hazards?.filter(h => h.col === colIdx && h.row === rowIdx) || [];
              const hasHoney = cellHazards.some(h => h.type === "honey");

              // Setup CSS layout
              let cellBg = alternateDark ? "bg-[#1a2a4a]" : "bg-[#2a3a5a]";
              if (hasHoney) {
                cellBg = "bg-[#d48c00]/40";
              }
              let borderStyle = "border border-slate-700/50";
              let animationClass = "";

              if (pedMatch) {
                cellBg = pedMatch.player === 1 ? "bg-[#4fc3f7]/30" : "bg-[#ef5350]/30";
              }

              if (hl === "move") {
                cellBg = "bg-amber-500/50 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.85),inset_0_0_10px_rgba(245,158,11,0.5)] z-10 scale-[0.98]";
                borderStyle = "border-2 border-amber-300";
                animationClass = "animate-pulse";
              } else if (hl === "atk") {
                cellBg = "bg-rose-500/60 cursor-pointer shadow-[0_0_18px_rgba(244,63,94,0.95),inset_0_0_12px_rgba(244,63,94,0.6)] z-10 scale-[0.98]";
                borderStyle = "border-2 border-rose-300";
                animationClass = "animate-pulse";
              } else if (hl === "atk-preview") {
                cellBg = "bg-red-500/50 cursor-help shadow-[0_0_12px_rgba(239,68,68,0.7)] z-10";
                borderStyle = "border-2 border-red-300";
              } else if (hl === "skill-preview") {
                cellBg = "bg-indigo-600/60 cursor-help shadow-[0_0_16px_rgba(129,140,248,0.95),inset_0_0_10px_rgba(129,140,248,0.5)] z-10 scale-[0.98]";
                borderStyle = "border-2 border-indigo-300";
                animationClass = "animate-pulse";
              }

              if (isRadiusPreview) {
                cellBg = "bg-red-600/70 cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.95),inset_0_0_12px_rgba(239,68,68,0.6)] border-2 border-red-400 z-10 scale-[0.98]";
                animationClass = "animate-pulse";
              }

              let extraOutline = "";
              if (isSelected) {
                extraOutline = "outline outline-3 outline-[#ffd700] outline-offset-[-2px] z-10";
              } else if (isTargSelected) {
                extraOutline = "outline outline-2 outline-[#4caf50] outline-offset-[-2px] z-10";
              }

              return (
                <div
                  key={colIdx}
                  onClick={() => onCellClick(colIdx, rowIdx)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onCellRightClick?.(colIdx, rowIdx);
                  }}
                  onMouseEnter={() => onCellHover?.(colIdx, rowIdx)}
                  onMouseLeave={() => onCellHoverEnd?.()}
                  className={`w-10 h-10 flex items-center justify-center relative transition-all duration-100 shrink-0 ${cellBg} ${borderStyle} ${animationClass} ${extraOutline} hover:brightness-110`}
                >
                  {/* Damage / Healing prediction overlay */}
                  {hl && (hl === "atk" || hl === "atk-preview" || hl === "skill-preview") && (() => {
                    const actor = selectedCell ? pokemon.find(p => p.col === selectedCell.col && p.row === selectedCell.row && !p.fainted) : null;
                    const target = pkMatch || pedMatch;
                    if (actor && target) {
                      const skillIdx = actionMode?.type === "skill" ? actionMode.skillIdx : undefined;
                      const prediction = predictDamage(actor, target, skillIdx, pokemon, pedestals, weather, terrain);
                      if (prediction.damage < 0) {
                        return (
                          <div className="absolute top-0 left-0 right-0 bg-emerald-950/90 text-emerald-300 text-[8px] font-black py-[1px] text-center border-b border-emerald-500/30 z-20 pointer-events-none rounded-t select-none leading-none">
                            💚+{Math.abs(prediction.damage)}
                          </div>
                        );
                      } else {
                        return (
                          <div className="absolute top-0 left-0 right-0 bg-red-950/90 text-red-300 text-[8px] font-black py-[1px] text-center border-b border-red-500/30 z-20 pointer-events-none rounded-t select-none leading-none">
                            💥{prediction.damage}
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}

                  {/* Hazard graphic */}
                  {(() => {
                    if (cellHazards.length > 0) {
                      const hasSpikes = cellHazards.some(h => h.type === "spikes");
                      const hasStealthRock = cellHazards.some(h => h.type === "stealthRock");
                      const hasHoneyVal = cellHazards.some(h => h.type === "honey");
                      
                      const icons: string[] = [];
                      if (hasSpikes) icons.push("🕸️");
                      if (hasStealthRock) icons.push("⛰️");
                      if (hasHoneyVal) icons.push("🍯");
                      const icon = icons.join("");
                      
                      return (
                        <div className="absolute bottom-1 left-1 text-[10px] pointer-events-none select-none z-5" title={cellHazards.map(h => `${h.type === "spikes" ? "Spikes" : h.type === "stealthRock" ? "Stealth Rock" : "Honey"} (P${h.player}: ${h.duration}t)`).join(", ")}>
                          {icon}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Pedestal graphic */}
                  {pedMatch && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-1 pointer-events-none select-none text-[8px] font-bold text-center leading-tight">
                      <span className="text-sm">🏛️</span>
                      <span className={pedMatch.player === 1 ? "text-cyan-300" : "text-red-400"}>
                        P{pedMatch.player} HP:{pedMatch.hp}
                      </span>
                    </div>
                  )}

                  {/* Pokémon Entity Token */}
                  {pkMatch && (
                    <div
                      className={`w-8 h-8 rounded-full flex flex-col items-center justify-center relative overflow-hidden shadow-md border-2 ${
                        pkMatch.player === 1
                          ? "bg-sky-900/80 border-[#4fc3f7] text-[#4fc3f7]"
                          : "bg-red-950/80 border-[#ef5350] text-[#ef5350]"
                      }`}
                    >
                      {/* Sprite icon or Emoji fallback */}
                      {(() => {
                        const emoji = getEmojiFor(pkMatch.species);
                        if (emoji) {
                          return (
                            <span className="text-sm select-none pointer-events-none leading-none mt-[-2px]">
                              {emoji}
                            </span>
                          );
                        }
                        return (
                          <img
                            src={DB[pkMatch.species]?.img}
                            alt={pkMatch.species}
                            referrerPolicy="no-referrer"
                            className="w-[85%] h-[85%] object-contain select-none pointer-events-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                          />
                        );
                      })()}

                      {/* Micro health gauge */}
                      {(() => {
                        const pct = Math.round((pkMatch.hp / pkMatch.maxHp) * 100);
                        const gaugeColor = pct < 25 ? "bg-red-500" : pct < 50 ? "bg-amber-500" : "bg-emerald-500";
                        return (
                          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-900">
                            <div className={`h-full ${gaugeColor}`} style={{ width: `${pct}%` }} />
                          </div>
                        );
                      })()}

                      {/* Small status dot */}
                      {pkMatch.status && (
                        <span
                          className="absolute top-[2px] left-[2px] w-[7px] h-[7px] rounded-full border border-white"
                          style={{ backgroundColor: SCOL[pkMatch.status] }}
                          title={pkMatch.status}
                        />
                      )}

                      {/* Held item icon */}
                      {pkMatch.heldItem && (
                        <span
                          className="absolute top-[1px] right-[2px] text-[7px]"
                          title={`Held item: ${pkMatch.heldItem}`}
                        >
                          🛡️
                        </span>
                      )}

                      {/* Mini numerical health indicator */}
                      <div className="absolute right-[1px] bottom-[2px] text-[8px] leading-none font-black text-white bg-slate-950/90 px-[2px] py-[1px] rounded scale-85">
                        {pkMatch.hp}
                      </div>
                    </div>
                  )}

                  {/* Front-attack indicator */}
                  {(() => {
                    const hasFrontMon = pokemon.some(p => !p.fainted && (
                      (p.player === 1 && p.row + 1 === rowIdx && p.col === colIdx) ||
                      (p.player === 2 && p.row - 1 === rowIdx && p.col === colIdx)
                    ));
                    if (hasFrontMon) {
                      return (
                        <div className="absolute top-1 right-1 text-[8px] bg-red-600/40 text-rose-100 rounded px-[2px] py-[1px] leading-none font-black opacity-90 pointer-events-none z-10" title="Melee Attack Target Tile (1 Energy)">
                          ⚔️1⚡
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
