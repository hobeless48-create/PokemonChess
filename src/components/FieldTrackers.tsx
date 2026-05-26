/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { PokemonEntity } from "../types";
import { DB } from "../data/pokemon";
import { SCOL } from "../data/typeCharts";

interface FieldTrackersProps {
  pokemon: PokemonEntity[];
  selectedCell: { col: number; row: number } | null;
  onSelectCell: (col: number, row: number) => void;
}

export const FieldTrackers: React.FC<FieldTrackersProps> = ({
  pokemon,
  selectedCell,
  onSelectCell
}) => {
  const p1Team = pokemon.filter(p => p.player === 1);
  const p2Team = pokemon.filter(p => p.player === 2);

  const getStatusIcon = (status: string, statusTurns?: number) => {
    switch (status) {
      case "burn": return `🔥 Burn (${2 - (statusTurns || 0)}t)`;
      case "freeze": return `❄️ Freeze (1t)`;
      case "poison": return "☠️ Poison (perm)";
      case "sleep": return "💤 Sleep (50%)";
      case "paralysis": return "⚡ Paralysis (perm)";
      case "confuse": return "💫 Confuse (perm)";
      case "toxic": return "☣️ Toxic (perm)";
      default: return status;
    }
  };

  const renderTeamList = (playerNum: number, team: PokemonEntity[]) => {
    const pColor = playerNum === 1 ? "border-[#4fc3f7]" : "border-[#ef5350]";
    const pHeaderBg = playerNum === 1 ? "bg-[#4fc3f7] text-[#1a1a2e]" : "bg-[#ef5350] text-[#1a1a2e]";

    return (
      <div className={`tracker-card rounded-xl overflow-hidden border border-slate-700 bg-[#16213e] flex-1 min-w-[200px]`}>
        <div className={`tracker-header px-4 py-2 text-sm font-bold uppercase tracking-wider ${pHeaderBg}`}>
          Player {playerNum} Team {playerNum === 1 ? "(Blue)" : "(Red)"}
        </div>
        
        <div className="tracker-list p-3 max-h-[280px] overflow-y-auto flex flex-col gap-2">
          {team.length === 0 ? (
            <div className="text-gray-500 text-xs italic text-center py-4">No active Pokémon</div>
          ) : (
            team.map(p => {
              const pct = Math.round((p.hp / p.maxHp) * 100);
              const barColor = p.fainted
                ? "bg-slate-600"
                : pct < 25
                ? "bg-red-500"
                : pct < 50
                ? "bg-amber-500"
                : "bg-emerald-500";
              const isSelected = selectedCell?.col === p.col && selectedCell?.row === p.row;
              const meta = DB[p.species];

              return (
                <div
                  key={p.id}
                  onClick={() => onSelectCell(p.col, p.row)}
                  className={`tracker-item p-2.5 rounded-lg transition cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? "bg-[#2a5a8a] border-l-4 border-[#ffd700]"
                      : "bg-[#0f2444] border-l-4 border-transparent hover:bg-slate-800"
                  } ${p.fainted ? "opacity-40" : ""}`}
                >
                  <div className="tracker-name flex items-center justify-between text-xs font-bold text-white leading-none">
                    <div className="flex items-center gap-1">
                      {meta?.img && (
                        <img
                          src={meta.img}
                          alt={p.species}
                          className="w-5 h-5 object-contain"
                          referrerPolicy="referrer"
                        />
                      )}
                      <span>{p.species}</span>
                    </div>

                    <div className="flex gap-1">
                      {p.isEgg && !p.hasHatched && (
                        <span className="bg-amber-500 text-slate-900 font-extrabold text-[8px] px-1 rounded uppercase tracking-wide">
                          Egg
                        </span>
                      )}
                      {meta?.legendary && !p.isEgg && (
                        <span className="bg-[#ffd700] text-slate-950 font-black text-[9px] px-1 rounded">
                          ★
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Active status tags details */}
                  {p.status && !p.fainted && (
                    <div
                      className="text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wide w-fit leading-none mt-1 shadow-sm border border-white/20"
                      style={{ backgroundColor: SCOL[p.status], color: '#1a1a2e' }}
                    >
                      {getStatusIcon(p.status, p.statusTurns)}
                    </div>
                  )}

                  {/* Health bars indicators */}
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1 leading-none">
                    <span>❤️ {p.fainted ? "K.O." : `${p.hp}/${p.maxHp} HP`}</span>
                    {p.isEgg && !p.hasHatched && (
                      <span className="text-[#ffd700] text-[9px]">
                        Hatch: {p.hatchProgress || 0}/{meta?.hatchCost || 30}
                      </span>
                    )}
                  </div>

                  {!p.fainted && (
                    <div className="hp-bar-mini h-1 bg-slate-900 rounded-full overflow-hidden mt-1">
                      <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="col-trackers flex flex-col gap-4 w-full md:w-[220px] shrink-0">
      {renderTeamList(1, p1Team)}
      {renderTeamList(2, p2Team)}
    </div>
  );
};
