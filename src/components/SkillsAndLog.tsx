/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PokemonEntity, BattleLogEntry, Skill, Pedestal } from "../types";
import { DB } from "../data/pokemon";
import { getSkillData, getAffectedCells, getSkillTargetType } from "../utils/gameEngine";
import { STATUS_META, SCOL } from "../data/typeCharts";

interface SkillsAndLogProps {
  selectedCell: { col: number; row: number } | null;
  pokemon: PokemonEntity[];
  logs: BattleLogEntry[];
  actionMode: any;
  hoveredCell: { col: number; row: number } | null;
  pedestals: Pedestal[];
  weather: string | null;
  boardSize?: number;
}

export const SkillsAndLog: React.FC<SkillsAndLogProps> = ({
  selectedCell,
  pokemon,
  logs,
  actionMode,
  hoveredCell,
  pedestals,
  weather,
  boardSize = 11
}) => {
  const [activeTab, setActiveTab] = useState<"skill" | "status" | "log">("skill");

  // Determine selected pokemon
  const pkMatch = selectedCell
    ? pokemon.find(p => p.col === selectedCell.col && p.row === selectedCell.row && !p.fainted)
    : null;

  const db = pkMatch ? DB[pkMatch.species] : null;

  const currentSkillIdx = actionMode && actionMode.type === "skill" && actionMode.pokeId === pkMatch?.id
    ? (typeof actionMode.skillIdx !== "undefined" ? actionMode.skillIdx : 0)
    : 0;

  const skillList: Skill[] = pkMatch?.customSkills || (db
    ? (Array.isArray(db.skills) && db.skills.length > 0
        ? db.skills
        : [{
            skillName: db.skillName || "Skill",
            skillDesc: db.skillDesc || "",
            skillDmg: db.skillDmg,
            skillRaw: db.skillRaw,
            skillCost: db.skillCost || 2,
            statusChance: db.statusChance,
            statusChanceValue: db.statusChanceValue,
            skillEffect: db.skillEffect
          }])
    : []);

  const getCalculatedCost = (sk: Skill, idx: number) => {
    if (!pkMatch || !db) return sk.skillCost || 2;
    let cost = sk.skillCost || db.skillCost || 2;
    if (pkMatch.heldItem === "Miracle Seed" && !pkMatch.hasUsedSkill) {
      cost = Math.max(0, cost - 1);
    }
    
    const isChosen = actionMode?.type === "skill" && actionMode?.pokeId === pkMatch.id && actionMode?.skillIdx === idx;
    const isWeatherSkill = ["Sunny Day", "Rain Dance", "Hail", "Sandstorm"].includes(sk.skillName);
    const targetType = getSkillTargetType(sk, db, pkMatch.rotomForm);
    const isInstant = (
      sk.skillDesc === "All" ||
      targetType === "self" ||
      targetType === "all_allies" ||
      targetType === "all_ice" ||
      sk.skillDesc?.toLowerCase() === "self" ||
      isWeatherSkill
    ) && sk.skillName !== "Transform";

    let hasPressureModifier = false;
    if (isInstant) {
      if (sk.skillName === "Powder Snow") {
        hasPressureModifier = pokemon.some(p => {
          if (p.player === pkMatch.player || p.fainted) return false;
          const pDb = DB[p.species];
          return pDb && pDb.ability === "Pressure" && !p.pressureTriggered;
        });
      }
    } else {
      const targetCell = (isChosen && hoveredCell) ? hoveredCell : null;
      if (targetCell) {
        const affected = getAffectedCells(pkMatch, sk, idx, targetCell, pokemon, pedestals, boardSize);
        hasPressureModifier = pokemon.some(p => {
          if (p.player === pkMatch.player || p.fainted) return false;
          const pDb = DB[p.species];
          if (!pDb || pDb.ability !== "Pressure" || p.pressureTriggered) return false;
          return affected.some(c => c.col === p.col && c.row === p.row);
        });
      }
    }

    if (hasPressureModifier) {
      cost += 1;
    }
    return cost;
  };

  // Describe pattern helper
  const getHumanRangeText = (desc: string) => {
    if (!desc) return "Standard target range.";
    if (desc === "Self") return "Self target area.";
    if (desc === "Ally") return "Allied target tile.";
    if (desc === "AllAllies") return "Affects all active team members simultaneously.";
    if (desc === "All") return "Saturates every unit on the map.";

    let m = desc.match(/Target\s*=\s*\[(\d+)\((.+)\)\]/i);
    let targetText = "";
    let inner = desc;
    if (m) {
      targetText = `Target ${m[1]} units inside area. `;
      inner = m[2];
    }

    const parts = inner.split("+").map(s => s.trim()).filter(Boolean);
    const humanParts = parts.map(part => {
      let mm = part.match(/Line\((\d+)\)\(([0-9,]+)\)/i);
      if (mm) return `Straight line up to ${mm[1]} tiles`;
      mm = part.match(/Cone\((\d+)\)(?:\(([0-9,]+)\))?/i);
      if (mm) return `Cone spray up to ${mm[1]} tiles`;
      mm = part.match(/AoE\((\d+)\)/i);
      if (mm) return `Area-of-effect radius of ${mm[1]} tiles`;
      return part;
    });

    return targetText + humanParts.join(" + ");
  };

  return (
    <div className="col-skills flex flex-col gap-4 w-full md:w-[280px] shrink-0">
      {/* Current Skill Card */}
      <div className="skill-card bg-[#16213e] border border-[#ff9800] rounded-2xl overflow-hidden shadow-xl">
        <div className="skill-header bg-[#ff9800] px-4 py-2 text-[#1a1a2e] font-bold text-sm uppercase tracking-wider">
          {skillList.length > 1 ? "Move Configurations" : "Currently Selected Move"}
        </div>

        <div className="skill-body p-4 min-h-[140px] flex flex-col justify-center">
          {pkMatch && db && skillList.length > 0 ? (
            <div className="flex flex-col gap-3">
              {skillList.map((skill, idx) => {
                const isCastingIdx = actionMode?.type === "skill" && actionMode?.pokeId === pkMatch.id && actionMode?.skillIdx === idx;
                const isDefaultSelected = (!actionMode || actionMode.type !== "skill" || actionMode.pokeId !== pkMatch.id) && idx === 0;
                const isActive = isCastingIdx || isDefaultSelected;
                return (
                  <div key={idx} className={`p-3 rounded-xl border transition ${
                    isActive 
                      ? "bg-[#252f5a] border-[#ff9800] ring-1 ring-[#ff9800]/50 shadow-md" 
                      : "bg-[#0f172a]/55 border-slate-800 opacity-80"
                  }`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm font-bold leading-none ${isActive ? "text-[#ff9800]" : "text-gray-100"}`}>
                        {skill.skillName} {isActive && <span className="text-[9px] font-normal text-amber-500 uppercase tracking-wider ml-1">(Selected)</span>}
                      </span>
                      <span className="font-mono text-[9px] bg-slate-900 px-1.5 py-0.5 rounded text-amber-400 font-extrabold">
                        {getCalculatedCost(skill, idx)}⚡
                      </span>
                    </div>
                    <div className="text-xs text-gray-300 leading-relaxed font-sans mb-1.5 whitespace-pre-line">
                      {skill.skillRaw || skill.skillDesc || db.skillRaw || db.skillDesc}
                    </div>
                    <div className="skill-pattern text-[10px] text-gray-400 bg-slate-950/85 p-1.5 rounded border border-slate-900 leading-tight">
                      🎯 <strong>Casting Matrix:</strong> {getHumanRangeText(skill.skillDesc || "")}
                    </div>
                    {skill.statusChance && (() => {
                      const getStatusDurationDesc = (status: string) => {
                        switch (status.toLowerCase()) {
                          case "burn": return "2 turns max";
                          case "freeze": return "1 turn";
                          case "sleep": return "50% wake chance/turn";
                          case "poison":
                          case "toxic":
                          case "paralysis":
                          case "confuse":
                          default:
                            return "permanent";
                        }
                      };
                      return (
                        <div className="chance-badge mt-1.5 self-start bg-[#4caf50] text-[#1a1a2e] font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider leading-none select-none inline-block">
                          ⚡ {skill.statusChance}: {Math.round((skill.statusChanceValue || 0.3) * 100)}% Chance ({getStatusDurationDesc(skill.statusChance)})
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-xs italic text-center">Select an active Pokémon on the board to analyze their Move configuration details.</p>
          )}
        </div>
      </div>

      {/* Tabs list menu */}
      <div className="tabs flex bg-[#0f0f1a] p-1 rounded-xl border border-slate-800 shrink-0">
        <button
          onClick={() => setActiveTab("skill")}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition ${
            activeTab === "skill"
              ? "bg-[#43a047] text-[#1a1a2e]"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Board Intel
        </button>
        <button
          onClick={() => setActiveTab("status")}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition ${
            activeTab === "status"
              ? "bg-[#43a047] text-[#1a1a2e]"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Status Guide
        </button>
        <button
          onClick={() => setActiveTab("log")}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition ${
            activeTab === "log"
              ? "bg-[#43a047] text-[#1a1a2e]"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Log ({logs.length})
        </button>
      </div>

      {/* Dynamic log panel list */}
      <div className="log-panel bg-[#16213e] border border-slate-700 rounded-2xl p-3 flex flex-col h-[280px]">
        {activeTab === "skill" ? (
          <div className="h-full overflow-y-auto text-[11px] text-gray-300 flex flex-col gap-3 font-sans leading-relaxed">
            <h4 className="font-bold text-gray-200 uppercase tracking-widest text-[9px] pb-1 border-b border-slate-800">
              Battlefield Regulations
            </h4>
            <div>
              <strong className="text-[#ffd700]">⚡ Energy Engine:</strong> Command actions cost Energy. Players gain max Energy bonuses as Phase levels shift.
            </div>
            <div>
              <strong className="text-[#4fc3f7]">💥 Attack Multipliers:</strong> Attacking matching elemental vulnerabilities deals double damage or ignores defenses!
            </div>
            <div>
              <strong className="text-emerald-400">🌿 Command EXP:</strong> Earn XP from taking actions. Distribute EXP to trigger evolutions or hatch legendary eggs!
            </div>
            <div className="text-[10px] text-slate-400 italic">
              Tip: Clear conditions like Frost and Burn using Sitrus or Lum items from the shop overlay.
            </div>
          </div>
        ) : activeTab === "status" ? (
          <div className="h-full overflow-y-auto text-[11px] text-gray-300 flex flex-col gap-2.5 font-sans leading-relaxed">
            <h4 className="font-bold text-gray-200 uppercase tracking-widest text-[9px] pb-1 border-b border-slate-800">
              Status Affliction Guide
            </h4>
            {Object.keys(STATUS_META).map(key => {
              const meta = STATUS_META[key];
              const color = SCOL[key] || "#7f8c8d";
              return (
                <div key={key} className="flex gap-2 items-start border-b border-slate-800/40 pb-1.5 last:border-b-0 last:pb-0">
                  <span
                    className="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider text-slate-950 font-sans shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {meta.label}
                  </span>
                  <p className="text-[10px] text-gray-300 font-medium leading-normal">{meta.desc}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="log-box h-full overflow-y-auto pr-1 flex flex-col gap-2 font-mono text-[10px] bg-slate-950 p-2.5 rounded-lg border border-slate-800 shadow-inner">
            {logs.length === 0 ? (
              <div className="text-gray-500 italic text-center py-12">No event records available.</div>
            ) : (
              logs.map(log => {
                let colorClass = "text-gray-300";
                if (log.type === "sys") colorClass = "text-[#4fc3f7] font-bold";
                else if (log.type === "atk" || log.type === "combat") colorClass = "text-[#ef5350]";
                else if (log.type === "heal") colorClass = "text-[#4caf50]";

                return (
                  <div key={log.id} className={`log-entry border-b border-slate-900/60 pb-1.5 flex flex-col gap-0.5 last:border-0 ${colorClass}`}>
                    <div className="flex justify-between text-[8px] text-gray-500 uppercase leading-none">
                      <span>{log.type || "global"}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className="leading-snug break-words">{log.msg}</p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
