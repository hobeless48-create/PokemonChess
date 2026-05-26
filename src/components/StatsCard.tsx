/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PokemonEntity, Pedestal, Skill } from "../types";
import { DB } from "../data/pokemon";
import { TCOL } from "../data/typeCharts";
import { getModifiedStat, getSkillData, predictDamage, getAffectedCells, getSkillTargetType } from "../utils/gameEngine";

interface StatsCardProps {
  selectedCell: { col: number; row: number } | null;
  pokemon: PokemonEntity[];
  pedestals: Pedestal[];
  currentPlayer: number;
  myPlayerNumber: number;
  energy: number;
  freeExp: number;
  onSelectAction: (type: "move" | "attack" | "skill", id: number, skillIdx?: number) => void;
  onAllocateExp: (id: number) => void;
  onUnequipItem: (id: number) => void;
  onRotateSkill?: (id: number) => void;
  actionMode: any;
  skillMenuFor: number | null;
  onToggleSkillMenu: (id: number) => void;
  weather: string | null;
  terrain: string | null;
  movePoints?: { [player: number]: number };
  hoveredCell: { col: number; row: number } | null;
  boardSize?: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  selectedCell,
  pokemon,
  pedestals,
  currentPlayer,
  myPlayerNumber,
  energy,
  freeExp,
  onSelectAction,
  onAllocateExp,
  onUnequipItem,
  onRotateSkill,
  actionMode,
  skillMenuFor,
  onToggleSkillMenu,
  weather,
  terrain,
  movePoints,
  hoveredCell,
  boardSize = 11
}) => {
  const [showStatBreakdown, setShowStatBreakdown] = useState<boolean>(false);

  // Check if we can display a Combat Forecast
  const actor = selectedCell ? pokemon.find(p => p.col === selectedCell.col && p.row === selectedCell.row && !p.fainted) : null;
  
  const getHoveredTarget = () => {
    if (!hoveredCell) return null;
    if (!actionMode || (actionMode.type !== "attack" && actionMode.type !== "skill")) return null;
    const pkTarget = pokemon.find(p => p.col === hoveredCell.col && p.row === hoveredCell.row && !p.fainted);
    const pedTarget = pedestals.find(pd => pd.col === hoveredCell.col && pd.row === hoveredCell.row);
    return pkTarget || pedTarget;
  };

  const target = getHoveredTarget();

  const renderCombatForecast = () => {
    if (!actor || !target) return null;
    const skillIdx = actionMode?.type === "skill" ? actionMode.skillIdx : undefined;
    const isSkill = skillIdx !== undefined;
    
    // Call predict damage
    const pred = predictDamage(actor, target, skillIdx, pokemon, pedestals, weather, terrain);
    const isDefendingPedestal = !('species' in target);
    const targetName = isDefendingPedestal ? `Player ${(target as Pedestal).player} Pedestal` : (target as PokemonEntity).species;
    const skillName = isSkill ? (DB[actor.species]?.skills?.[skillIdx]?.skillName || "Skill") : "Melee Attack";

    // Format type text
    let typeEffectivenessText = "Neutral (1.0x)";
    let typeColor = "text-gray-400 font-mono";
    if (pred.typeMult > 0) {
      typeEffectivenessText = `Super Effective (+${pred.typeMult} Dmg)`;
      typeColor = "text-emerald-400 font-bold font-mono";
    } else if (pred.typeMult < 0) {
      typeEffectivenessText = `Not Very Effective (${pred.typeMult} Dmg)`;
      typeColor = "text-rose-400 font-bold font-mono";
    }

    const isHeal = pred.damage < 0;

    return (
      <div className="combat-forecast bg-[#1a1c2e]/95 backdrop-blur-md border border-[#ff9800] rounded-2xl overflow-hidden shadow-2xl w-full mb-4 animate-fade-in relative z-30">
        <div className="bg-[#ff9800] px-4 py-2 text-[#1a1a2e] font-black text-xs uppercase tracking-wider flex items-center justify-between">
          <span>⚔️ Combat Forecast</span>
          <span className="text-[9px] bg-slate-950 text-[#ff9800] font-mono px-1.5 py-0.5 rounded font-extrabold uppercase">
            Live Preview
          </span>
        </div>

        <div className="p-4 flex flex-col gap-2 text-xs text-gray-200">
          <div className="flex justify-between items-center pb-1 border-b border-slate-800/80">
            <span className="text-gray-400 font-semibold">Action Mode</span>
            <span className="font-bold text-white bg-indigo-950/80 text-indigo-300 px-2 py-0.5 rounded text-[10px] border border-indigo-500/20">
              {skillName}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Attacker</span>
            <span className="font-bold text-sky-400">{actor.species}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Target</span>
            <span className="font-bold text-rose-400">{targetName}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Base Atk Power</span>
            <span className="font-mono text-gray-100 font-bold">{pred.baseAtk}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Target Def Reduction</span>
            <span className="font-mono text-gray-100 font-bold">-{pred.targetDef}</span>
          </div>

          {!isDefendingPedestal && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Type Vulnerability</span>
              <span className={typeColor}>{typeEffectivenessText}</span>
            </div>
          )}

          {pred.abilityBonus !== 0 && (
            <div className="flex justify-between items-center text-emerald-400 font-semibold">
              <span>Passive Ability Bonus</span>
              <span className="font-mono">+{pred.abilityBonus}</span>
            </div>
          )}

          {pred.tidalBellReduction > 0 && (
            <div className="flex justify-between items-center text-rose-400 font-semibold">
              <span>🔔 Tidal Bell Shield</span>
              <span className="font-mono">-{pred.tidalBellReduction}</span>
            </div>
          )}

          {pred.isElectricAbsorb && (
            <div className="flex justify-between items-center text-emerald-400 font-bold uppercase tracking-wider text-[9px]">
              <span>Volt Absorb Active</span>
              <span>Heals Target</span>
            </div>
          )}

          {pred.isWaterAbsorb && (
            <div className="flex justify-between items-center text-emerald-400 font-bold uppercase tracking-wider text-[9px]">
              <span>Water Absorb Active</span>
              <span>Heals Target</span>
            </div>
          )}

          {pred.isLevitateMiss && (
            <div className="flex justify-between items-center text-rose-400 font-bold uppercase tracking-wider text-[9px]">
              <span>Levitate Immune</span>
              <span>0 Damage (Miss)</span>
            </div>
          )}

          {pred.isDreamEaterMiss && (
            <div className="flex justify-between items-center text-rose-400 font-bold uppercase tracking-wider text-[9px]">
              <span>Target Not Asleep</span>
              <span>0 Damage (Miss)</span>
            </div>
          )}

          {pred.isSturdyTriggered && (
            <div className="flex justify-between items-center text-yellow-400 font-bold uppercase tracking-wider text-[9px]">
              <span>Sturdy Triggered</span>
              <span>Survives with 1 HP</span>
            </div>
          )}

          <div className="border-t border-slate-800/80 pt-2 mt-1 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-100">Projected Outcome</span>
            <span className={`text-sm font-black font-sans leading-none ${isHeal ? "text-emerald-400" : "text-rose-400 animate-pulse"}`}>
              {isHeal ? `💚 Heal +${Math.abs(pred.damage)} HP` : `💥 Deal ${pred.damage} Damage`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (!selectedCell) {
    return (
      <>
        {renderCombatForecast()}
        <div className="stats-card bg-[#16213e] border border-slate-700 rounded-2xl overflow-hidden shadow-xl w-full p-6 text-center text-gray-400">
          <span className="text-4xl block mb-2">🔍</span>
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-400 mb-1">Grid Telemetry</h3>
          <p className="text-xs">Click on any Pokémon or pedestal to view interactive statistics and actions.</p>
        </div>
      </>
    );
  }

  const { col, row } = selectedCell;
  const pedMatch = pedestals.find(pd => pd.col === col && pd.row === row);

  // If a pedestal is clicked
  if (pedMatch) {
    const pct = Math.round((pedMatch.hp / pedMatch.maxHp) * 100);
    return (
      <>
        {renderCombatForecast()}
        <div className="stats-card bg-[#16213e] border border-slate-700 rounded-2xl overflow-hidden shadow-[#43a047]/10 w-full p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Player {pedMatch.player} Pedestal</h3>
              <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">
                Grid Position {String.fromCharCode(65 + col)}{row + 1}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-300 mb-1">
            <span>Shield Integrity</span>
            <span className="font-bold">{pedMatch.hp} / {pedMatch.maxHp} HP</span>
          </div>

          <div className="hp-track-bar h-2 bg-slate-900 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-300 ${
                pct < 33 ? "bg-red-500 animate-pulse" : pct < 66 ? "bg-amber-500" : "bg-[#4caf50]"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed bg-[#0f0f1a] p-2.5 rounded-lg border border-slate-800">
            The central Command link. If this pedestal is reduced to 0 HP and Player {pedMatch.player} has no alive units, they lose the game. Protect your pedestal!
          </p>
        </div>
      </>
    );
  }

  const pkMatch = pokemon.find(p => p.col === col && p.row === row && !p.fainted);

  if (!pkMatch) {
    return (
      <>
        {renderCombatForecast()}
        <div className="stats-card bg-[#16213e] border border-slate-700 rounded-2xl overflow-hidden shadow-xl w-full p-6 text-center text-gray-400">
          <span className="text-4xl block mb-2">🌫️</span>
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-400 mb-1">Empty Terrain Cell</h3>
          <p className="text-xs">Cell coordinates: {String.fromCharCode(65 + col)}{row + 1}. Tap a valid active token to command.</p>
        </div>
      </>
    );
  }

  const db = DB[pkMatch.species];
  if (!db) {
    return (
      <>
        {renderCombatForecast()}
        <div className="stats-card bg-[#16213e] border border-slate-700 rounded-2xl overflow-hidden w-full p-4 text-center">
          <p className="text-xs text-red-400">Database Entry Stale/Missing error.</p>
        </div>
      </>
    );
  }

  const pct = Math.round((pkMatch.hp / pkMatch.maxHp) * 100);
  const remainingColor = pct < 25 ? "bg-red-500" : pct < 50 ? "bg-amber-500" : "bg-emerald-500";

  const isBell = pkMatch.species === "Clear Bell" || pkMatch.species === "Tidal Bell" || pkMatch.species === "Tidal bell";
  const isMyTurn = myPlayerNumber === 0 || currentPlayer === myPlayerNumber;
  const isMyUnit = pkMatch.player === currentPlayer && isMyTurn && !isBell;
  const isEggForm = pkMatch.isEgg && !pkMatch.hasHatched;
  const teamMP = movePoints?.[currentPlayer] ?? 0;
  const unitUsedMP = pkMatch.hasUsedMP ?? false;
  const canMove = isMyUnit && !isEggForm && (energy >= 1 || (teamMP > 0 && !unitUsedMP));
  const canAtk = isMyUnit && !isEggForm && energy >= 1;

  // Retrieve skill configuration lists
  const skillList: Skill[] = pkMatch.customSkills || (Array.isArray(db.skills) && db.skills.length > 0
    ? db.skills
    : [{
        skillName: db.skillName || "Skill",
        skillDesc: db.skillDesc || "",
        skillDmg: db.skillDmg,
        skillRaw: db.skillRaw,
        skillCost: db.skillCost || 2
      }]);

  const currentSkillIdx = actionMode && actionMode.type === "skill" && actionMode.pokeId === pkMatch.id
    ? (actionMode.skillIdx || 0)
    : 0;

  const displaySkill = skillList[currentSkillIdx] || skillList[0];

  const getCalculatedCost = (sk: Skill, idx: number) => {
    let cost = sk.skillCost || db.skillCost || 2;
    if (pkMatch.heldItem === "Miracle Seed" && !pkMatch.hasUsedSkill) {
      cost = Math.max(0, cost - 1);
    }
    
    const isChosen = actionMode?.type === "skill" && actionMode?.pokeId === pkMatch.id && actionMode?.skillIdx === idx;
    const isWeatherSkill = ["Sunny Day", "Rain Dance", "Hail", "Sandstorm"].includes(sk.skillName);
    const targetType = getSkillTargetType(sk, db);
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

  const canUseSkill = (skObj: Skill, idx: number) => {
    const sc = getCalculatedCost(skObj, idx);
    const isNewWeatherActive = weather === "Harsh Sunlight" || weather === "Heavy Rain" || weather === "Strong Winds";
    const isWeatherMove = ["Sunny Day", "Rain Dance", "Hail", "Sandstorm"].includes(skObj.skillName);
    if (isNewWeatherActive && isWeatherMove) {
      return false;
    }
    return isMyUnit && !isEggForm && energy >= sc && !pkMatch.skillUses?.[skObj.skillName];
  };

  const canInvestExp = isMyUnit && freeExp > 0 && !pkMatch.pendingEvo && !pkMatch.pendingEvoChoice && (
    pkMatch.isEgg
      ? (pkMatch.hatchProgress || 0) < (db?.hatchCost || 30)
      : (!!db.evoCost && (pkMatch.exp || 0) < db.evoCost)
  );

  const totalAtk = getModifiedStat(pkMatch, "atk", pokemon, { weather, terrain });
  const totalDef = getModifiedStat(pkMatch, "def", pokemon, { weather, terrain });

  // Status visual map
  const getStatusName = (st: string, statusTurns?: number) => {
    const map: { [k: string]: string } = {
      burn: `🔥 Burn (${2 - (statusTurns || 0)}t remaining)`,
      poison: "☠️ Poison (permanent)",
      toxic: "☣️ Toxic (permanent)",
      paralysis: "⚡ Paralysis (permanent)",
      sleep: "💤 Sleep (50% wake chance)",
      freeze: "❄️ Freeze (1t remaining)",
      confuse: "💫 Confuse (permanent)"
    };
    return map[st] || st;
  };

  return (
    <>
      {renderCombatForecast()}
      <div className="stats-card bg-[#16213e] border border-[#43a047] rounded-2xl overflow-hidden shadow-lg w-full flex flex-col">
      <div className="stats-header bg-[#43a047] px-4 py-2 text-[#1a1a2e] font-bold text-sm uppercase tracking-wider flex justify-between items-center">
        <span>Active Combat Record</span>
        <span className="text-[10px] bg-emerald-900 text-white font-extrabold px-1.5 py-0.5 rounded leading-none">
          P{pkMatch.player} Slot
        </span>
      </div>

      <div className="stats-content p-4 flex flex-col gap-3">
        {/* Identity row with Sprite */}
        <div className="flex gap-3 items-start">
          <div className="w-16 h-16 bg-[#0f0f1a] border border-[#2a3a5a] rounded-xl flex items-center justify-center shrink-0 shadow-inner">
            <img
              src={db.img}
              alt={pkMatch.species}
              referrerPolicy="no-referrer"
              className="w-[90%] h-[90%] object-contain select-none pointer-events-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-white leading-tight capitalize">
              {pkMatch.species} {pkMatch.isEgg && !pkMatch.hasHatched ? " (Egg)" : ""}
            </h3>
            <span className="text-[11px] text-gray-400 font-medium block">
              Class: {db.cls} · Sector {String.fromCharCode(65 + col)}{row + 1}
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded animate-pulse" style={{ backgroundColor: TCOL[db.t1] || '#7f8c8d' }}>
                {db.t1}
              </span>
              {db.t2 && (
                <span className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded animate-pulse" style={{ backgroundColor: TCOL[db.t2] || '#7f8c8d' }}>
                  {db.t2}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Health proportion Bar */}
        <div>
          <div className="flex justify-between items-center text-xs text-gray-300 leading-none mb-1">
            <span>Life Force</span>
            <span className="font-bold">{pkMatch.hp} / {pkMatch.maxHp} HP</span>
          </div>
          <div className="hp-bar-big h-2 bg-slate-900 rounded-full overflow-hidden">
            <div className={`h-full ${remainingColor} transition-all duration-300`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Exp progress meter - or hatch pool details */}
        {pkMatch.isEgg ? (
          <div className="bg-[#0f0f1a] p-2 rounded-lg border border-slate-800 text-[11px] flex justify-between items-center text-amber-400">
            <span>🥚 Egg Hatch Progress</span>
            <span className="font-bold">
              {pkMatch.pendingHatch ? "Ready to Hatch" : `${pkMatch.hatchProgress || 0} / ${db.hatchCost || 30} XP`}
            </span>
          </div>
        ) : (
          <div className="stat-row bg-[#0f0f1a] p-2 rounded-lg border border-slate-800 text-xs flex justify-between">
            <span className="text-gray-400 uppercase tracking-wider text-[10px] font-bold">Evolution Progress</span>
            <span className="text-white font-mono font-bold">
              {pkMatch.pendingEvo ? "Ready to Evolve" : (db.evoTo ? `${pkMatch.exp} / ${db.evoCost} EXP` : "Max evolved form")}
            </span>
          </div>
        )}

        {/* Stat detail parameters lists */}
        <div className="flex flex-col gap-1.5 bg-[#0f0f1a] p-3 rounded-lg border border-slate-800 text-xs text-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-medium">Equipped Held Item</span>
            {pkMatch.heldItem ? (
              <span
                onClick={() => isMyUnit && onUnequipItem(pkMatch.id)}
                className={`text-[#ffd700] transition font-bold flex items-center gap-1 ${isMyUnit ? "hover:text-[#ff9800] cursor-pointer" : ""}`}
              >
                {pkMatch.heldItem} {isMyUnit && <small className="text-red-500 font-extrabold text-[9px] uppercase leading-none">(Click Unequip)</small>}
              </span>
            ) : (
              <span className="text-gray-500 italic">None</span>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-medium">Status Condition</span>
            {pkMatch.status ? (
              <span className="text-red-400 font-bold uppercase">{getStatusName(pkMatch.status, pkMatch.statusTurns)}</span>
            ) : (
              <span className="text-gray-500">None</span>
            )}
          </div>

          {/* Collapsible stat breakdown drawer */}
          <div className="border-t border-slate-800/80 pt-2 mt-1">
            <div
              onClick={() => setShowStatBreakdown(!showStatBreakdown)}
              className="flex justify-between items-center cursor-pointer hover:bg-slate-900 rounded px-1 -mx-1"
            >
              <span className="text-gray-400 font-medium select-none">Atk: {totalAtk} | Def: {totalDef}</span>
              <span className="text-indigo-400 text-[10px] uppercase font-bold tracking-wider hover:underline flex items-center">
                Stat Breakdown {showStatBreakdown ? "▲" : "▼"}
              </span>
            </div>

            {showStatBreakdown && (
              <div className="bg-slate-950 p-2 rounded border border-slate-800/60 mt-1.5 text-[10px] text-gray-400 flex flex-col gap-1">
                <div>
                  <strong className="text-gray-200">Attack:</strong> Base {pkMatch.atk} {totalAtk !== pkMatch.atk ? `| Modifiers: ${totalAtk - pkMatch.atk > 0 ? "+" : ""}${totalAtk - pkMatch.atk}` : ""}
                </div>
                <div>
                  <strong className="text-gray-200">Defense:</strong> Base {pkMatch.def} {totalDef - pkMatch.def !== 0 ? `| Modifiers: ${totalDef - pkMatch.def > 0 ? "+" : ""}${totalDef - pkMatch.def}` : ""}
                </div>
                {pkMatch.modifiers && pkMatch.modifiers.length > 0 && (
                  <div className="border-t border-slate-900 pt-1 mt-1 flex flex-col gap-0.5 text-[9px]">
                    <div className="text-gray-300 font-semibold mb-0.5">Active Stat Modifiers:</div>
                    {pkMatch.modifiers.map((m, idx) => (
                      <div key={idx} className={`flex justify-between px-0.5 ${m.amount > 0 ? "text-emerald-400" : "text-orange-400"}`}>
                        <span>{m.amount > 0 ? "📈" : "📉"} {m.source}: {m.amount > 0 ? "+" : ""}{m.amount} {m.stat.toUpperCase()}</span>
                        <span>{m.duration} {m.duration === 1 ? "turn" : "turns"} left</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-[9px] text-slate-500 italic mt-0.5 border-t border-slate-900 pt-1">
                  *Modified parameters are calculated live using passive skills, buffs, and items.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ability explanation row */}
        <div className="ability-text bg-[#0f0f1a] p-2.5 rounded-lg border border-slate-800 text-[11px] leading-snug">
          <strong className="text-emerald-400">✨ {db.ability}:</strong> <span className="text-gray-300">{db.abilityDesc}</span>
        </div>

        {/* Action Grid commands panel */}
        {isMyUnit && (
          <div className="grid grid-cols-3 gap-2 mt-1">
            <button
              disabled={!canMove}
              onClick={() => onSelectAction("move", pkMatch.id)}
              className={`py-2 rounded-lg border flex flex-col items-center justify-center transition leading-normal outline-none focus:outline-none ${
                canMove
                  ? (teamMP > 0 && !unitUsedMP
                      ? "bg-[#4fc3f7]/10 hover:bg-[#4fc3f7]/25 border-[#4fc3f7]/50 text-[#4fc3f7] cursor-pointer"
                      : "bg-[#ffb74d]/10 hover:bg-[#ffb74d]/25 border-[#ffb74d]/50 text-[#ffb74d] cursor-pointer")
                  : "bg-slate-800/40 border-slate-800 text-gray-500 cursor-not-allowed opacity-55"
              }`}
            >
              <span className="text-xs font-bold font-sans">🚶 Move</span>
              <span className="text-[9px] opacity-75 font-mono">
                {teamMP > 0 && !unitUsedMP ? "Costs 1 MP" : "Costs 1 Energy"}
              </span>
            </button>

            <button
              disabled={!canAtk}
              onClick={() => onSelectAction("attack", pkMatch.id)}
              className={`py-2 rounded-lg border flex flex-col items-center justify-center transition leading-normal outline-none focus:outline-none ${
                canAtk
                  ? "bg-[#ef5350]/10 hover:bg-[#ef5350]/25 border-[#ef5350]/50 text-[#ef5350] cursor-pointer"
                  : "bg-slate-800/40 border-slate-800 text-gray-500 cursor-not-allowed opacity-55"
              }`}
            >
              <span className="text-xs font-bold font-sans">⚔️ Attack</span>
              <span className="text-[9px] opacity-75 font-mono">1⚡ Cost</span>
            </button>

            {/* Support Multi-skill lists trees */}
            {skillList.length > 1 ? (
              <div className="flex flex-col relative">
                <button
                  onClick={() => onToggleSkillMenu(pkMatch.id)}
                  className={`w-full h-full py-2 rounded-lg border flex flex-col items-center justify-center transition leading-normal outline-none focus:outline-none ${
                    skillMenuFor === pkMatch.id || (actionMode?.type === "skill" && actionMode?.pokeId === pkMatch.id)
                      ? "bg-indigo-500/25 border-indigo-400 text-indigo-300 font-extrabold"
                      : "bg-[#534ab7]/10 hover:bg-[#534ab7]/25 border-[#534ab7]/40 text-[#b5b4eb] cursor-pointer"
                  }`}
                >
                  <span className="text-xs font-bold font-sans">✨ Skills</span>
                  <span className="text-[9px] truncate max-w-[76px] opacity-75 font-mono">
                    {displaySkill?.skillName || "Choose skill"}
                  </span>
                </button>

                {skillMenuFor === pkMatch.id && (
                  <div className="absolute bottom-[44px] right-0 bg-[#0f0f1a] border border-indigo-500/50 shadow-2xl p-2 rounded-xl flex flex-col gap-1.5 w-[160px] z-50">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block text-center pb-1 border-b border-indigo-950">
                      Casting Menu
                    </span>
                    {skillList.map((sk, idx) => {
                      const cost = getCalculatedCost(sk, idx);
                      const activeSkillAllowed = canUseSkill(sk, idx);
                      const isChosen = actionMode?.type === "skill" && actionMode?.pokeId === pkMatch.id && actionMode?.skillIdx === idx;
                      const isConfirming = actionMode?.type === "skill" && actionMode?.pokeId === pkMatch.id && actionMode?.confirmingIdx === idx;

                      return (
                        <button
                          key={idx}
                          disabled={!activeSkillAllowed}
                          onClick={() => {
                            onToggleSkillMenu(pkMatch.id);
                            onSelectAction("skill", pkMatch.id, idx);
                          }}
                          className={`w-full py-1.5 text-left px-2 rounded-md text-[10px] flex justify-between items-center transition ${
                            isConfirming
                              ? "bg-amber-500 text-slate-950 font-bold"
                              : isChosen
                              ? "bg-indigo-800 border border-indigo-400 text-white"
                              : activeSkillAllowed
                              ? "bg-slate-800 hover:bg-slate-700 text-gray-200"
                              : "bg-slate-950 text-gray-600 cursor-not-allowed"
                          }`}
                        >
                          <span className="truncate font-sans font-semibold">
                            {isConfirming ? "⚡ Confirm Cast" : sk.skillName}
                          </span>
                          <span className="font-mono bg-slate-900 px-1 rounded text-gray-300 font-extrabold text-[8px]">
                            {cost}⚡
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <button
                disabled={!canUseSkill(displaySkill, currentSkillIdx)}
                onClick={() => onSelectAction("skill", pkMatch.id, 0)}
                className={`py-2 rounded-lg border flex flex-col items-center justify-center transition leading-normal outline-none focus:outline-none ${
                  actionMode?.type === "skill" && actionMode?.pokeId === pkMatch.id
                    ? "bg-indigo-500/20 border-indigo-400 text-indigo-300"
                    : canUseSkill(displaySkill, currentSkillIdx)
                    ? "bg-[#534ab7]/10 hover:bg-[#534ab7]/25 border-[#534ab7]/40 text-[#b5b4eb] cursor-pointer"
                    : "bg-slate-800/40 border-slate-800 text-gray-500 cursor-not-allowed opacity-55"
                }`}
              >
                <span className="text-xs font-bold font-sans">
                  {actionMode?.type === "skill" && actionMode?.pokeId === pkMatch.id && actionMode?.confirmingIdx === 0
                    ? "Confirm Cast"
                    : `✨ ${displaySkill?.skillName || "Skill"}`}
                </span>
                <span className="text-[9px] opacity-75 font-mono">{getCalculatedCost(displaySkill, currentSkillIdx)}⚡ Cost</span>
              </button>
            )}
          </div>
        )}

        {isMyUnit && onRotateSkill && (
          <button
            onClick={() => onRotateSkill(pkMatch.id)}
            className="w-full mt-1.5 py-2 rounded-lg border bg-[#5c6bc0]/10 hover:bg-[#5c6bc0]/25 border-[#5c6bc0]/40 text-[#c5cae9] cursor-pointer flex flex-col items-center justify-center transition leading-normal outline-none"
          >
            <span className="text-xs font-bold font-sans">🔄 Rotate Skill (R)</span>
            <span className="text-[9px] opacity-75 font-mono">
              Direction: {pkMatch.rotation === 1 ? "Right" : pkMatch.rotation === 2 ? "Bottom" : pkMatch.rotation === 3 ? "Left" : "Start"}
            </span>
          </button>
        )}

        {/* Level Allocate XP button */}
        {canInvestExp && (
          <button
            onClick={() => onAllocateExp(pkMatch.id)}
            className="w-full mt-1.5 py-1.5 text-center bg-[#4caf50]/20 hover:bg-[#4caf50]/40 text-[#4caf50] border border-[#4caf50]/50 rounded-lg text-xs font-bold transition flex justify-center items-center gap-1.5"
          >
            <span>🌿 Invest 1 Command EXP</span>
            <span className="bg-emerald-900 border border-emerald-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded ml-0.5">
              Available: {freeExp}
            </span>
          </button>
        )}
      </div>
    </div>
  </>
  );
};
