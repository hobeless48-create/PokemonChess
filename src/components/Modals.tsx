/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ShopItem, PlayerState } from "../types";
import { ITEMS } from "../data/items";

interface ModalsProps {
  shopOpen: boolean;
  onToggleShop: () => void;
  inventoryOpen: boolean;
  onToggleInventory: () => void;
  playerState: PlayerState;
  onBuyItem: (name: string) => void;
  onUseItemAction: (name: string, type: "held" | "consumable") => void;
  consumablesUsedThisTurn?: { total: number; powerHerb: number; };
}

export const Modals: React.FC<ModalsProps> = ({
  shopOpen,
  onToggleShop,
  inventoryOpen,
  onToggleInventory,
  playerState,
  onBuyItem,
  onUseItemAction,
  consumablesUsedThisTurn = { total: 0, powerHerb: 0 }
}) => {
  // Shop category tabs
  const [shopCategory, setShopCategory] = useState<"held" | "consumable">("held");
  const [shopSubTab, setShopSubTab] = useState<string>("All");

  // Inventory category tabs
  const [invCategory, setInvCategory] = useState<"held" | "consumable">("held");

  const getItemStyleConfig = (category: string, type: string) => {
    if (type === "consumable" || category === "Consumable") {
      return { color: "#e67e22", bg: "bg-orange-950/20", border: "border-orange-500/20", label: "Consumable" };
    }
    switch (category) {
      case "Offense":
        return { color: "#C0392B", bg: "bg-red-950/20", border: "border-red-500/20", label: "Held Item · Offense" };
      case "Defense":
        return { color: "#2980B9", bg: "bg-blue-950/20", border: "border-blue-500/20", label: "Held Item · Defense" };
      case "Utility":
        return { color: "#8E44AD", bg: "bg-purple-950/20", border: "border-purple-500/20", label: "Held Item · Utility" };
      default:
        return { color: "#7F8C8D", bg: "bg-slate-900/20", border: "border-slate-500/20", label: "Held Item" };
    }
  };

  if (!shopOpen && !inventoryOpen) return null;

  return (
    <>
      {/* --- Shop Modal Overlay --- */}
      {shopOpen && (
        <div className="shop-overlay fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="shop-panel bg-[#16213e] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="shop-panel-header px-6 py-4 border-b border-slate-800 bg-[#0f172a]/60 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">Command Mart Shop</h3>
                <p className="text-xs text-amber-400 font-semibold font-mono">Current Gold Balance: {playerState.gold} 💰</p>
              </div>
              <button
                onClick={onToggleShop}
                className="bg-slate-800 hover:bg-slate-700 text-gray-200 border border-slate-700 rounded-lg px-4 py-1.5 text-xs font-bold transition cursor-pointer"
              >
                Close Mart
              </button>
            </div>

            {/* Category tabs */}
            <div className="shop-tabs px-6 py-3 border-b border-slate-800 bg-[#0f0f1a] flex gap-2">
              <button
                onClick={() => { setShopCategory("held"); setShopSubTab("All"); }}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition ${
                  shopCategory === "held"
                    ? "bg-[#185fa5] text-white"
                    : "bg-slate-800/40 text-gray-400 hover:bg-slate-800"
                }`}
              >
                Held Items (Passives)
              </button>
              <button
                onClick={() => { setShopCategory("consumable"); }}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition ${
                  shopCategory === "consumable"
                    ? "bg-[#e67e22] text-white"
                    : "bg-slate-800/40 text-gray-400 hover:bg-slate-800"
                }`}
              >
                Consumables (Instants)
              </button>
            </div>

            {/* Held items sub-tabs filter */}
            {shopCategory === "held" && (
              <div className="shop-subtabs px-6 py-2 border-b border-slate-800/50 bg-[#0f0f1a]/50 flex gap-1.5 justify-center">
                {["All", "Offense", "Defense", "Utility"].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setShopSubTab(tag)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition ${
                      shopSubTab === tag
                        ? "bg-[#4fc3f7] text-[#1a1a2e]"
                        : "bg-slate-900 border border-slate-800 text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* Shop item list catalog */}
            <div className="shop-list p-6 overflow-y-auto flex flex-col gap-3 max-h-[50vh]">
              {Object.keys(ITEMS)
                .map(k => ITEMS[k])
                .filter(item => {
                  if (shopCategory === "held" && item.type !== "held") return false;
                  if (shopCategory === "consumable" && item.type !== "consumable") return false;
                  if (shopCategory === "held" && shopSubTab !== "All" && item.category !== shopSubTab) return false;
                  return true;
                })
                .map(item => {
                  const style = getItemStyleConfig(item.category, item.type);
                  const canAfford = playerState.gold >= item.cost;

                  return (
                    <div
                      key={item.name}
                      className="shop-horizontal-card flex items-center border border-slate-800 bg-[#0f0f1a] p-3 rounded-xl transition gap-4 text-left"
                    >
                      {/* Image container */}
                      <div className={`w-14 h-14 ${style.bg} ${style.border} border rounded-xl flex items-center justify-center shrink-0`}>
                        <img
                          src={item.img}
                          alt={item.name}
                          className="w-10 h-10 object-contain"
                        />
                      </div>

                      {/* Middle Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-white text-sm leading-none">{item.name}</span>
                          <span
                            className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-white/10"
                            style={{ color: style.color, backgroundColor: `${style.color}15` }}
                          >
                            {style.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed font-sans">{item.desc}</p>
                      </div>

                      {/* Buy action button */}
                      <div className="text-right min-w-[100px] pl-4 border-l border-slate-800 shrink-0">
                        <div className="text-amber-400 font-extrabold text-xs tracking-wider mb-2 font-mono">{item.cost} GOLD</div>
                        <button
                          disabled={!canAfford}
                          onClick={() => onBuyItem(item.name)}
                          className={`w-full py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition outline-none focus:outline-none cursor-pointer ${
                            canAfford
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow shadow-emerald-500/20"
                              : "bg-slate-800 text-gray-500 cursor-not-allowed border border-slate-700/60"
                          }`}
                        >
                          Buy Item
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* --- Inventory Modal Overlay --- */}
      {inventoryOpen && (
        <div className="shop-overlay fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="shop-panel bg-[#16213e] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="shop-panel-header px-6 py-4 border-b border-slate-800 bg-[#0f172a]/60 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">Commander Backpack</h3>
                <p className="text-xs text-gray-400">Equip or consume items on your team members.</p>
              </div>
              <button
                onClick={onToggleInventory}
                className="bg-slate-800 hover:bg-slate-700 text-gray-200 border border-slate-700 rounded-lg px-4 py-1.5 text-xs font-bold transition cursor-pointer"
              >
                Close Backpack
              </button>
            </div>

            {/* Category tabs */}
            <div className="shop-tabs px-6 py-3 border-b border-slate-800 bg-[#0f0f1a] flex gap-2">
              <button
                onClick={() => setInvCategory("held")}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition ${
                  invCategory === "held"
                    ? "bg-[#185fa5] text-white"
                    : "bg-slate-800/40 text-gray-400 hover:bg-slate-800"
                }`}
              >
                Held Items (Count: {playerState.inventory.held.length})
              </button>
              <button
                onClick={() => setInvCategory("consumable")}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition ${
                  invCategory === "consumable"
                    ? "bg-[#e67e22] text-white"
                    : "bg-slate-800/40 text-gray-400 hover:bg-slate-800"
                }`}
              >
                Consumables (Count: {playerState.inventory.consumable.length})
              </button>
            </div>

            {/* Warning Banner */}
            {inventoryOpen && invCategory === "consumable" && (
              <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex justify-between items-center text-xs font-semibold text-amber-400">
                <span className="flex items-center gap-1.5">
                  <span>⚠️</span> Consumables limit: maximum 2 items per turn (Power Herb limit: 1).
                </span>
                <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/35">
                  Used: {consumablesUsedThisTurn.total} / 2
                </span>
              </div>
            )}

            {/* Inventory panel list */}
            <div className="shop-list p-6 overflow-y-auto flex flex-col gap-3 max-h-[55vh]">
              {(() => {
                const currentList = invCategory === "held" ? playerState.inventory.held : playerState.inventory.consumable;

                if (currentList.length === 0) {
                  return (
                    <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                      <span className="text-4xl block mb-2 opacity-50">🎒</span>
                      <p className="text-sm font-semibold text-gray-400">Backpack is currently empty</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
                        Visit the Command Mart Shop to purchase held passives or instant consumables to assist your Pokémon.
                      </p>
                    </div>
                  );
                }

                return currentList.map((itemName, index) => {
                  const item = ITEMS[itemName];
                  if (!item) return null;
                  const style = getItemStyleConfig(item.category, item.type);

                  const totalUsed = consumablesUsedThisTurn?.total ?? 0;
                  const powerHerbUsed = consumablesUsedThisTurn?.powerHerb ?? 0;
                  const isLocked = item.type === "consumable" && (
                    totalUsed >= 2 ||
                    (item.name === "Power Herb" && powerHerbUsed >= 1)
                  );

                  return (
                    <div
                      key={index} // Use index since same items can stack
                      className="shop-horizontal-card flex items-center border border-slate-800 bg-[#0f0f1a] p-3 rounded-xl transition gap-4 text-left"
                    >
                      {/* Image */}
                      <div className={`w-14 h-14 ${style.bg} ${style.border} border rounded-xl flex items-center justify-center shrink-0`}>
                        <img
                          src={item.img}
                          alt={item.name}
                          className="w-10 h-10 object-contain"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-white text-sm leading-none">{item.name}</span>
                          <span
                            className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-white/10"
                            style={{ color: style.color, backgroundColor: `${style.color}15` }}
                          >
                            {invCategory === "held" ? item.category : "Consumable"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed font-sans">{item.desc}</p>
                      </div>

                      {/* Action buttons */}
                      <div className="text-right min-w-[100px] pl-4 border-l border-slate-800 shrink-0">
                        <button
                          disabled={isLocked}
                          onClick={() => onUseItemAction(item.name, item.type)}
                          className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition outline-none focus:outline-none ${
                            isLocked
                              ? "bg-slate-800 text-gray-500 cursor-not-allowed border border-slate-700/60"
                              : "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-md shadow-indigo-500/20"
                          }`}
                        >
                          {item.type === "held" ? "Equip" : isLocked ? "Locked" : "Use Item"}
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
