/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface RulesProps {
  open: boolean;
  onClose: () => void;
}

export const Rules: React.FC<RulesProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#0f172a] border border-[#1e3a5f]/70 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl shadow-cyan-500/10 animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1e3a5f]/50 bg-[#0a0f1a]/80 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">
              Game Rules
            </h3>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700 rounded-lg px-4 py-1.5 text-xs font-bold transition cursor-pointer"
          >
            ✕ Close (H)
          </button>
        </div>

        {/* Scrollable content */}
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">

          {/* Goal */}
          <div className="bg-gradient-to-r from-cyan-950/30 to-cyan-950/10 border border-cyan-800/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🏆</span>
              <div>
                <h4 className="text-sm font-black text-cyan-300 uppercase tracking-wide mb-1">Victory Condition</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Destroy the opponent's <span className="text-amber-400 font-semibold">🏛️ Pedestal</span> <span className="text-slate-500">(30 HP)</span> OR defeat <strong>all</strong> of their Pokémon to win the match!
                </p>
              </div>
            </div>
          </div>

          {/* Energy */}
          <div className="bg-gradient-to-r from-purple-950/30 to-purple-950/10 border border-purple-800/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">⚡</span>
              <div>
                <h4 className="text-sm font-black text-purple-300 uppercase tracking-wide mb-1">Energy System</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Each turn you get <span className="text-yellow-300 font-mono font-semibold">3 Energy</span> (scales up at Turn 10 → 4, Turn 30 → 5).
                  <br />
                  <span className="text-emerald-400 font-semibold">Move</span> costs <strong>1</strong> · <span className="text-red-400 font-semibold">Attack</span> costs <strong>1</strong> · <span className="text-cyan-400 font-semibold">Skill</span> costs <strong>2+</strong>.
                  <br />
                  Energy fully refreshes at the start of your turn.
                </p>
              </div>
            </div>
          </div>

          {/* Movement & Combat */}
          <div className="bg-gradient-to-r from-blue-950/30 to-blue-950/10 border border-blue-800/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">♟️</span>
              <div>
                <h4 className="text-sm font-black text-blue-300 uppercase tracking-wide mb-1">Movement &amp; Combat</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Each Pokémon class moves differently:
                </p>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  <div className="bg-red-950/20 border border-red-900/20 rounded-lg px-2.5 py-1.5">
                    <span className="text-red-400 font-bold text-xs">Attack</span>
                    <span className="text-slate-400 text-[10px] ml-1">Aggressive, forward-focused</span>
                  </div>
                  <div className="bg-cyan-950/20 border border-cyan-900/20 rounded-lg px-2.5 py-1.5">
                    <span className="text-cyan-400 font-bold text-xs">Defense</span>
                    <span className="text-slate-400 text-[10px] ml-1">Protective, cardinal movement</span>
                  </div>
                  <div className="bg-green-950/20 border border-green-900/20 rounded-lg px-2.5 py-1.5">
                    <span className="text-green-400 font-bold text-xs">Support</span>
                    <span className="text-slate-400 text-[10px] ml-1">Flexible, broad movement</span>
                  </div>
                  <div className="bg-purple-950/20 border border-purple-900/20 rounded-lg px-2.5 py-1.5">
                    <span className="text-purple-400 font-bold text-xs">Assassin</span>
                    <span className="text-slate-400 text-[10px] ml-1">Precise, high-risk strikes</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic">
                  Evolutions expand movement range and unlock stronger skills.
                </p>
              </div>
            </div>
          </div>

          {/* Gold & Shop */}
          <div className="bg-gradient-to-r from-amber-950/30 to-amber-950/10 border border-amber-800/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🪙</span>
              <div>
                <h4 className="text-sm font-black text-amber-300 uppercase tracking-wide mb-1">Gold &amp; Shop</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Earn gold periodically at turns <strong>1, 6, 11, 16</strong> (+5) and <strong>21+</strong> (+6/+7).
                  <br />
                  Buy <span className="text-emerald-400 font-semibold">Held Items</span> (permanent passives) and <span className="text-orange-400 font-semibold">Consumables</span> (one-time use) from the Shop (<strong>F</strong> key).
                  <br />
                  Manage inventory via Backpack (<strong>B</strong> key).
                </p>
              </div>
            </div>
          </div>

          {/* Evolution */}
          <div className="bg-gradient-to-r from-emerald-950/30 to-emerald-950/10 border border-emerald-800/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🧬</span>
              <div>
                <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wide mb-1">Evolution</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pokémon gain <span className="text-yellow-300 font-mono font-semibold">+1 EXP</span> per turn end + <span className="text-amber-300 font-mono font-semibold">+2 Command EXP</span> per turn (manually allocatable).
                  <br />
                  Evolve into stronger forms when reaching the EXP threshold.
                  <br />
                  <span className="text-amber-300 font-semibold">★ Legendary Eggs</span> need <strong>30 EXP</strong> to hatch! Eggs share a hatch pool within their group.
                </p>
              </div>
            </div>
          </div>

          {/* Type Matchups */}
          <div className="bg-gradient-to-r from-rose-950/30 to-rose-950/10 border border-rose-800/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🔥</span>
              <div>
                <h4 className="text-sm font-black text-rose-300 uppercase tracking-wide mb-1">Type Matchups</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every Pokémon has <span className="text-indigo-400 font-semibold">1-2 elemental types</span>.
                  <br />
                  Attacks deal <span className="text-green-400 font-semibold">+1 bonus</span> vs weak types and <span className="text-red-400 font-semibold">-1</span> vs resistant types.
                  <br />
                  Check the full chart via <strong>Type Chart</strong> (<strong>C</strong> key).
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {["🔥 Fire", "💧 Water", "🌿 Grass", "⚡ Electric", "❄️ Ice", "👁️ Psychic", "🕊️ Flying", "⭕ Normal", "☠️ Poison", "🪨 Rock", "🌍 Ground", "👻 Ghost"].map(t => (
                    <span key={t} className="text-[10px] bg-slate-800/60 border border-slate-700/40 rounded-full px-2 py-0.5 text-slate-300">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Status & Weather */}
          <div className="bg-gradient-to-r from-indigo-950/30 to-indigo-950/10 border border-indigo-800/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🌤️</span>
              <div>
                <h4 className="text-sm font-black text-indigo-300 uppercase tracking-wide mb-1">Weather &amp; Status</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Weather</strong> (Sunlight, Rain, Hail, Sandstorm, etc.) modifies type damage and affects all Pokémon.
                  <br />
                  <strong>Status Effects</strong>: Burn (-1 ATK), Poison (HP loss), Sleep/Freeze (cannot act), Paralysis (skip chance), Confusion (self-damage).
                </p>
              </div>
            </div>
          </div>

          {/* Turn Flow */}
          <div className="bg-gradient-to-r from-slate-800/40 to-slate-800/10 border border-slate-700/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🔄</span>
              <div>
                <h4 className="text-sm font-black text-slate-300 uppercase tracking-wide mb-1">Turn Flow</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Players alternate turns. Each turn: earn gold → spend energy → distribute EXP → end turn.
                  Plan carefully — every move counts!
                </p>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="bg-gradient-to-r from-slate-800/40 to-slate-800/10 border border-slate-700/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">⌨️</span>
              <div>
                <h4 className="text-sm font-black text-slate-300 uppercase tracking-wide mb-1">Keyboard Shortcuts</h4>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <div className="text-xs"><kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-[10px]">E</kbd> <span className="text-slate-400 ml-1">End Turn</span></div>
                  <div className="text-xs"><kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-[10px]">H</kbd> <span className="text-slate-400 ml-1">Rules</span></div>
                  <div className="text-xs"><kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-[10px]">B</kbd> <span className="text-slate-400 ml-1">Backpack</span></div>
                  <div className="text-xs"><kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-[10px]">F</kbd> <span className="text-slate-400 ml-1">Shop</span></div>
                  <div className="text-xs"><kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-[10px]">C</kbd> <span className="text-slate-400 ml-1">Type Chart</span></div>
                  <div className="text-xs"><kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-[10px]">R</kbd> <span className="text-slate-400 ml-1">Rotate Skill</span></div>
                  <div className="text-xs"><kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-[10px]">1-6</kbd> <span className="text-slate-400 ml-1">Quick Select</span></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
