import React, { useState, useEffect } from "react";
import { DB } from "../data/pokemon";
import { PokemonDBEntry, Skill } from "../types";
import { TCOL } from "../data/typeCharts";

interface PokedexProps {
  onBack: () => void;
  boardSize: number;
}

// Helper to get initial offsets from description if customOffsets doesn't exist
function parseInitialOffsets(desc: string): { dc: number; dr: number }[] {
  const offsets: { dc: number; dr: number }[] = [];
  if (!desc) return offsets;

  // Simple Line(range)(dirs) parser
  let match = desc.match(/Line\((\d+)\)\(([0-9,]+)\)/i);
  if (match) {
    const range = parseInt(match[1], 10);
    const dirs = match[2].split(",").map(Number);
    dirs.forEach(d => {
      // 1: Up, 2: Right, 3: Down, 4: Left
      let dc = 0, dr = 0;
      if (d === 1) dr = -1;
      else if (d === 2) dc = 1;
      else if (d === 3) dr = 1;
      else if (d === 4) dc = -1;

      for (let step = 1; step <= range; step++) {
        offsets.push({ dc: dc * step, dr: dr * step });
      }
    });
    return offsets;
  }

  // Simple AoE(radius) parser
  match = desc.match(/AoE\((\d+)\)/i);
  if (match) {
    const radius = parseInt(match[1], 10);
    for (let dc = -radius; dc <= radius; dc++) {
      for (let dr = -radius; dr <= radius; dr++) {
        if (dc === 0 && dr === 0) continue;
        if (Math.max(Math.abs(dc), Math.abs(dr)) <= radius) {
          offsets.push({ dc, dr });
        }
      }
    }
    return offsets;
  }

  // Simple Cone(range) parser
  match = desc.match(/Cone\((\d+)\)/i);
  if (match) {
    const range = parseInt(match[1], 10);
    // Default cone points downwards/forward (dr = 1)
    for (let step = 1; step <= range; step++) {
      if (step === 1) {
        offsets.push({ dc: 0, dr: 1 });
      } else {
        const spread = step - 1;
        for (let dc = -spread; dc <= spread; dc++) {
          offsets.push({ dc, dr: step });
        }
      }
    }
    return offsets;
  }

  return offsets;
}

// Helper to save customized Pokémon entry to localStorage
const savePokemonToLocalDB = (name: string, entry: any) => {
  try {
    const saved = localStorage.getItem("pokemon_chess_custom_db");
    const currentCustom = saved ? JSON.parse(saved) : {};
    
    currentCustom[name] = {
      hp: entry.hp,
      atk: entry.atk,
      def: entry.def,
      cost: entry.cost,
      ability: entry.ability,
      abilityDesc: entry.abilityDesc,
      skills: entry.skills,
      skillName: entry.skillName,
      skillDesc: entry.skillDesc,
      skillDmg: entry.skillDmg,
      customMoveOffsets: entry.customMoveOffsets
    };
    
    localStorage.setItem("pokemon_chess_custom_db", JSON.stringify(currentCustom));
  } catch (err) {
    console.error("Failed to save custom Pokémon entry to localStorage:", err);
  }
};

export const Pokedex: React.FC<PokedexProps> = ({ onBack, boardSize }) => {
  // Navigation states: "list" | "description"
  const [view, setView] = useState<"list" | "description">("list");
  const [selectedPkmn, setSelectedPkmn] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [genFilter, setGenFilter] = useState("all");
  const [costFilter, setCostFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Editable stats state (Admin Mode)
  const [editName, setEditName] = useState("");
  const [editHp, setEditHp] = useState(0);
  const [editAtk, setEditAtk] = useState(0);
  const [editDef, setEditDef] = useState(0);
  const [editCost, setEditCost] = useState(0);
  const [editAbility, setEditAbility] = useState("");
  const [editAbilityDesc, setEditAbilityDesc] = useState("");
  const [customMoveOffsets, setCustomMoveOffsets] = useState<{ dc: number; dr: number }[]>([]);
  const [activeEditTab, setActiveEditTab] = useState<"skills" | "movement">("skills");

  // Skills Editing state
  const [editSkills, setEditSkills] = useState<Skill[]>([]);
  const [activeSkillIdx, setActiveSkillIdx] = useState<number>(0);
  const [skillEditChecked, setSkillEditChecked] = useState<boolean>(false);

  // Skill attributes editing
  const [skillName, setSkillName] = useState("");
  const [skillDmgChecked, setSkillDmgChecked] = useState(false);
  const [skillDmgVal, setSkillDmgVal] = useState("Atk");
  const [skillStatusChecked, setSkillStatusChecked] = useState(false);
  const [skillStatusChance, setSkillStatusChance] = useState(10); // d20: 1 to 20
  const [skillStatusType, setSkillStatusType] = useState("burn");
  const [skillBuffChecked, setSkillBuffChecked] = useState(false);
  const [skillBuffType, setSkillBuffType] = useState("Atk"); // Atk, Def, Heal
  const [skillBuffAmt, setSkillBuffAmt] = useState(1);
  const [skillBuffTurns, setSkillBuffTurns] = useState(2);
  const [skillTargetChecked, setSkillTargetChecked] = useState(false);
  const [skillTargetCount, setSkillTargetCount] = useState(1); // 1 or 4
  const [customOffsets, setCustomOffsets] = useState<{ dc: number; dr: number }[]>([]);
  const [skillCost, setSkillCost] = useState(2);

  // Collect all elemental types dynamically
  const allTypes = Array.from(
    new Set(Object.values(DB).flatMap(p => [p.t1, p.t2].filter(Boolean)))
  ).sort();

  // Filtered Pokémon list
  const filteredList = Object.keys(DB).filter(name => {
    const p = DB[name];
    if (!p) return false;
    if (name === "Clear Bell" || name === "Tidal Bell" || name === "Tidal bell") return false;
    if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && p.t1 !== typeFilter && p.t2 !== typeFilter) return false;
    if (costFilter !== "all" && p.cost.toString() !== costFilter) return false;
    if (roleFilter !== "all" && p.cls !== roleFilter) return false;
    if (genFilter === "gen1" && p.dex > 151) return false;
    if (genFilter === "gen2" && p.dex <= 151) return false;
    return true;
  }).sort((a, b) => DB[a].dex - DB[b].dex);

  // Pad Dex number helper
  const padDex = (num: number) => {
    return `#${num.toString().padStart(4, "0")}`;
  };

  // Open description page
  const handleSelect = (name: string) => {
    setSelectedPkmn(name);
    setView("description");
    setIsEditMode(false);
  };

  // Synchronize edit states when selected Pokémon or active skill changes
  useEffect(() => {
    if (selectedPkmn && DB[selectedPkmn]) {
      const p = DB[selectedPkmn];
      setEditName(selectedPkmn);
      setEditHp(p.hp);
      setEditAtk(p.atk);
      setEditDef(p.def);
      setEditCost(p.cost);
      setEditAbility(p.ability || "");
      setEditAbilityDesc(p.abilityDesc || "");
      setCustomMoveOffsets(p.customMoveOffsets ? [...p.customMoveOffsets] : []);
      setActiveEditTab("skills");

      // Deep copy skills
      const copySkills = p.skills ? JSON.parse(JSON.stringify(p.skills)) : [];
      setEditSkills(copySkills);
      setActiveSkillIdx(0);
    }
  }, [selectedPkmn, isEditMode]);

  // Sync skill form values when active skill changes
  useEffect(() => {
    if (editSkills && editSkills[activeSkillIdx]) {
      const sk = editSkills[activeSkillIdx];
      setSkillName(sk.skillName || "");
      setSkillEditChecked(sk.isCustom || false);
      setSkillCost(sk.skillCost !== undefined ? sk.skillCost : 2);

      // Damage
      const hasDmg = sk.skillDmg !== undefined && sk.skillDmg !== 0 && sk.skillDmg !== "0" && sk.skillDmg !== "";
      setSkillDmgChecked(hasDmg);
      setSkillDmgVal(sk.skillDmg !== undefined ? String(sk.skillDmg) : "Atk");

      // Status
      setSkillStatusChecked(!!sk.statusChance);
      setSkillStatusType(sk.statusChance || "burn");
      if (sk.statusChanceValue !== undefined) {
        setSkillStatusChance(Math.round(sk.statusChanceValue * 20));
      } else {
        setSkillStatusChance(10);
      }

      // Buff/debuff
      const hasEffect = !!sk.skillEffect || !!sk.skillHeal;
      setSkillBuffChecked(hasEffect);
      if (sk.skillHeal) {
        setSkillBuffType("Heal");
        setSkillBuffAmt(sk.skillHeal);
      } else if (sk.skillEffect) {
        // Uppercase first letter
        const statName = sk.skillEffect.stat.charAt(0).toUpperCase() + sk.skillEffect.stat.slice(1);
        setSkillBuffType(statName);
        setSkillBuffAmt(sk.skillEffect.amount);
        setSkillBuffTurns(sk.skillEffect.duration);
      } else {
        setSkillBuffType("Atk");
        setSkillBuffAmt(1);
        setSkillBuffTurns(2);
      }

      // Target
      setSkillTargetChecked(sk.isTargetSkill || (sk.skillDesc ? sk.skillDesc.toLowerCase().includes("target") : false));
      setSkillTargetCount(sk.targetCount || 1);

      // Custom skill offsets grid
      if (sk.customOffsets && sk.customOffsets.length > 0) {
        setCustomOffsets(sk.customOffsets);
      } else {
        // Parse from description
        setCustomOffsets(parseInitialOffsets(sk.skillDesc || sk.skillRaw || ""));
      }
    } else {
      setSkillName("");
      setSkillEditChecked(false);
      setSkillCost(2);
      setSkillDmgChecked(false);
      setSkillStatusChecked(false);
      setSkillBuffChecked(false);
      setSkillTargetChecked(false);
      setCustomOffsets([]);
    }
  }, [activeSkillIdx, editSkills, isEditMode]);

  // Toggle offset in the 9x9 editor grid
  const toggleOffset = (dc: number, dr: number) => {
    const exists = customOffsets.some(o => o.dc === dc && o.dr === dr);
    let next: { dc: number; dr: number }[] = [];
    if (exists) {
      next = customOffsets.filter(o => !(o.dc === dc && o.dr === dr));
    } else {
      next = [...customOffsets, { dc, dr }];
    }
    setCustomOffsets(next);
  };

  // Toggle offset in the 9x9 editor grid for movement
  const toggleMoveOffset = (dc: number, dr: number) => {
    const exists = customMoveOffsets.some(o => o.dc === dc && o.dr === dr);
    let next: { dc: number; dr: number }[] = [];
    if (exists) {
      next = customMoveOffsets.filter(o => !(o.dc === dc && o.dr === dr));
    } else {
      next = [...customMoveOffsets, { dc, dr }];
    }
    setCustomMoveOffsets(next);
  };

  // Update active skill fields in local state
  const updateSkillInState = (field: keyof Skill, value: any) => {
    const nextSkills = [...editSkills];
    if (nextSkills[activeSkillIdx]) {
      nextSkills[activeSkillIdx] = {
        ...nextSkills[activeSkillIdx],
        [field]: value
      };
      setEditSkills(nextSkills);
    }
  };

  // Save changes back to DB
  const handleSave = () => {
    if (!selectedPkmn || !DB[selectedPkmn]) return;

    // Apply skill parameters to active edited skill
    const nextSkills = [...editSkills];
    if (nextSkills[activeSkillIdx]) {
      const sk = nextSkills[activeSkillIdx];
      sk.skillName = skillName;
      sk.isCustom = skillEditChecked;
      sk.skillCost = skillCost;

      // Damage
      if (skillDmgChecked) {
        sk.skillDmg = skillDmgVal.toLowerCase() === "atk" ? "Atk" : (parseInt(skillDmgVal, 10) || 0);
      } else {
        sk.skillDmg = 0;
      }

      // Status
      if (skillStatusChecked) {
        sk.statusChance = skillStatusType;
        sk.statusChanceValue = skillStatusChance / 20; // Fraction value for engine roller
      } else {
        delete sk.statusChance;
        delete sk.statusChanceValue;
      }

      // Buff/debuff
      if (skillBuffChecked) {
        if (skillBuffType === "Heal") {
          sk.skillHeal = skillBuffAmt;
          sk.skillHealTarget = "ally";
          delete sk.skillEffect;
        } else {
          sk.skillEffect = {
            target: skillBuffType.toLowerCase() === "atk" || skillBuffType.toLowerCase() === "def" ? "ally" : "enemy",
            stat: skillBuffType.toLowerCase(),
            amount: skillBuffAmt,
            duration: skillBuffTurns
          };
          delete sk.skillHeal;
          delete sk.skillHealTarget;
        }
      } else {
        delete sk.skillHeal;
        delete sk.skillHealTarget;
        delete sk.skillEffect;
      }

      // Target
      sk.isTargetSkill = skillTargetChecked;
      if (skillTargetChecked) {
        sk.targetCount = skillTargetCount;
      } else {
        delete sk.targetCount;
      }

      // Offset grid
      sk.customOffsets = customOffsets;

      // Recompile skill description text
      let descParts = [];
      if (sk.skillDmg) {
        descParts.push(`Deals ${sk.skillDmg} damage`);
      }
      if (sk.statusChance) {
        descParts.push(`${Math.round(sk.statusChanceValue! * 100)}% chance to ${sk.statusChance}`);
      }
      if (sk.skillHeal) {
        descParts.push(`Heals target for ${sk.skillHeal} HP`);
      }
      if (sk.skillEffect) {
        descParts.push(`Grants ${sk.skillEffect.amount >= 0 ? "+" : ""}${sk.skillEffect.amount} ${sk.skillEffect.stat.toUpperCase()} for ${sk.skillEffect.duration} turns`);
      }
      sk.skillDesc = descParts.join(", ") || "Custom skill effect";
      sk.skillRaw = sk.skillDesc;
    }

    // Write back to DB globally
    const pkmn = DB[selectedPkmn];
    pkmn.hp = editHp;
    pkmn.atk = editAtk;
    pkmn.def = editDef;
    pkmn.cost = editCost;
    pkmn.ability = editAbility;
    pkmn.abilityDesc = editAbilityDesc;
    pkmn.skills = nextSkills;
    pkmn.customMoveOffsets = customMoveOffsets;

    // If name is edited, replace/rename in DB if needed (but key matches, so keep species name same to avoid breaking slots references, just change display)
    // Species name can be customized inside the entry
    pkmn.skillName = nextSkills[0]?.skillName;
    pkmn.skillDesc = nextSkills[0]?.skillDesc;

    savePokemonToLocalDB(selectedPkmn, pkmn);
    setIsEditMode(false);
  };

  return (
    <div id="screen-pokedex" className="max-w-6xl mx-auto p-4 md:p-6 bg-[#0f0f1a] rounded-3xl border border-[#0f3460]/80 shadow-2xl relative">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#0f3460]/40 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>📕</span> Pokédex Database
          </h2>
          <p className="text-xs text-gray-400 mt-1">Explore elemental stats, abilities, and modify skill mechanics (Admin Access)</p>
        </div>
        <button
          onClick={() => {
            if (view === "description") {
              setView("list");
              setIsEditMode(false);
            } else {
              onBack();
            }
          }}
          className="px-5 py-2.5 bg-[#16213e] hover:bg-[#1a4a7a] text-white border border-[#2a3a5a] rounded-xl text-xs font-bold uppercase transition cursor-pointer outline-none flex items-center gap-1.5"
        >
          {view === "description" ? "⬅️ Back to Database" : "⬅️ Back to Landing"}
        </button>
      </div>

      {/* VIEW: POKEDEX GRID LIST */}
      {view === "list" && (
        <div>
          {/* SEARCH & FILTERS CONTROL BAR */}
          <div className="bg-[#16213e]/40 border border-[#0f3460]/50 p-4 rounded-2xl mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Search Pokémon</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-white p-2.5 rounded-lg focus:outline-none focus:border-cyan-400 font-sans"
              />
            </div>

            {/* Type Dropdown */}
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Elemental Type</label>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-white p-2.5 rounded-lg focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Types</option>
                {allTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Gen Dropdown */}
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Generation</label>
              <select
                value={genFilter}
                onChange={e => setGenFilter(e.target.value)}
                className="bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-white p-2.5 rounded-lg focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Generations</option>
                <option value="gen1">Gen 1 (Kanto)</option>
                <option value="gen2">Gen 2 (Johto)</option>
              </select>
            </div>

            {/* Cost Dropdown */}
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Gold Cost</label>
              <select
                value={costFilter}
                onChange={e => setCostFilter(e.target.value)}
                className="bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-white p-2.5 rounded-lg focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Costs</option>
                <option value="1">1 Gold</option>
                <option value="2">2 Gold</option>
                <option value="3">3 Gold</option>
                <option value="4">4 Gold</option>
                <option value="5">5 Gold</option>
              </select>
            </div>

            {/* Role Dropdown */}
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Class Role</label>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-white p-2.5 rounded-lg focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Roles</option>
                <option value="Attack">Attack</option>
                <option value="Defense">Defense</option>
                <option value="Support">Support</option>
                <option value="Assassin">Assassin</option>
              </select>
            </div>
          </div>

          {/* GRID OF POKEMON - 6 Columns layout */}
          {filteredList.length === 0 ? (
            <div className="text-center py-12 bg-[#16213e]/20 border border-[#0f3460]/40 rounded-2xl">
              <span className="text-4xl block mb-2">🔍</span>
              <p className="text-sm text-gray-400">No Pokémon matching your filter choices.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {filteredList.map(name => {
                const p = DB[name];
                return (
                  <div
                    key={name}
                    onClick={() => handleSelect(name)}
                    className="group bg-[#16213e]/30 border border-[#0f3460]/40 hover:border-cyan-500/80 rounded-2xl p-3 flex flex-col items-center transition duration-150 transform hover:scale-103 hover:shadow-lg hover:shadow-cyan-500/5 cursor-pointer relative"
                  >
                    {/* Header info inside box */}
                    <div className="w-full flex justify-between items-center text-[10px] font-semibold text-gray-400 mb-2 leading-none">
                      <span className="font-mono text-gray-500">{padDex(p.dex)}</span>
                      <span className="font-sans font-bold group-hover:text-cyan-400 transition truncate max-w-[65px]">{name}</span>
                    </div>

                    {/* Sprite Image Container */}
                    <div className="w-16 h-16 flex items-center justify-center bg-slate-950/40 rounded-xl mb-3 overflow-hidden border border-slate-900 group-hover:bg-slate-950/70 transition">
                      <img
                        src={p.img}
                        alt={name}
                        className="w-[85%] h-[85%] object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition duration-150"
                      />
                    </div>

                    {/* Typings */}
                    <div className="flex gap-1 justify-center w-full mt-auto">
                      <span
                        className="text-[8px] font-bold px-2 py-0.5 rounded text-white tracking-wider"
                        style={{ backgroundColor: TCOL[p.t1] || "#68a090" }}
                      >
                        {p.t1}
                      </span>
                      {p.t2 && (
                        <span
                          className="text-[8px] font-bold px-2 py-0.5 rounded text-white tracking-wider"
                          style={{ backgroundColor: TCOL[p.t2] || "#68a090" }}
                        >
                          {p.t2}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* DATABASE BACKUP, IMPORT/EXPORT & RESET TOOLS */}
          <div className="mt-12 bg-[#16213e]/20 border border-[#0f3460]/40 rounded-3xl p-6">
            <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span>💾</span> Custom Database Management
            </h3>
            <p className="text-xs text-gray-400 mb-6 font-sans">
              Backup, import/export, or reset your custom balance changes and skill offset configurations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Import/Export text box */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">
                  Backup Data (JSON String)
                </label>
                <textarea
                  rows={4}
                  readOnly
                  value={(() => {
                    try {
                      return localStorage.getItem("pokemon_chess_custom_db") || "{}";
                    } catch (e) {
                      return "{}";
                    }
                  })()}
                  onClick={e => (e.target as HTMLTextAreaElement).select()}
                  className="bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-gray-300 p-3 rounded-xl focus:outline-none focus:border-cyan-400 font-mono resize-none cursor-pointer"
                  title="Click to select all and copy"
                />
                <span className="text-[9px] text-gray-500 font-sans">
                  Click inside the box to select all, copy, and save your custom edits to a text file.
                </span>
              </div>

              {/* Right Column: Import & Reset buttons */}
              <div className="flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">
                    Import Custom Database
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste backup JSON here..."
                      id="import-db-input"
                      className="flex-grow bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-400 font-sans"
                    />
                    <button
                      onClick={() => {
                        const inputEl = document.getElementById("import-db-input") as HTMLInputElement;
                        const jsonStr = inputEl?.value?.trim();
                        if (!jsonStr) return;
                        try {
                          const parsed = JSON.parse(jsonStr);
                          localStorage.setItem("pokemon_chess_custom_db", JSON.stringify(parsed));
                          alert("Database imported successfully! Refreshing the page to apply changes...");
                          window.location.reload();
                        } catch (e) {
                          alert("Invalid backup JSON format!");
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Import
                    </button>
                  </div>
                </div>

                <div className="border-t border-[#0f3460]/40 pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-300 block font-sans">Restore Factory Defaults</span>
                    <span className="text-[9px] text-gray-500 font-sans">Permanently delete all custom balance changes.</span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete all custom balance edits and reset to default?")) {
                        localStorage.removeItem("pokemon_chess_custom_db");
                        alert("Database reset successfully! Refreshing the page to apply changes...");
                        window.location.reload();
                      }
                    }}
                    className="px-4 py-2 bg-red-950/60 hover:bg-red-950 border border-red-500/40 text-red-200 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: POKEMON DESCRIPTION & ADMIN EDITOR */}
      {view === "description" && selectedPkmn && DB[selectedPkmn] && (() => {
        const p = DB[selectedPkmn];
        return (
          <div className="bg-[#16213e]/20 border border-[#0f3460]/40 rounded-3xl p-6 relative">
            
            {/* EDIT/ADMIN MODE BUTTON ON TOP RIGHT */}
            <div className="absolute top-6 right-6 z-10">
              {isEditMode ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-md shadow-emerald-500/10"
                  >
                    💾 Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditMode(false)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg cursor-pointer transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                import.meta.env.VITE_ENABLE_ADMIN === "true" && (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-[#0f0f1a] text-xs font-black rounded-lg cursor-pointer transition flex items-center gap-1.5 shadow-md shadow-amber-500/15"
                  >
                    <span>🛠️</span> Admin Edit Mode
                  </button>
                )
              )}
            </div>

            {/* BACK BUTTON TO LIST */}
            {!isEditMode && (
              <button
                onClick={() => setView("list")}
                className="mb-4 text-xs font-bold text-gray-400 hover:text-cyan-400 transition cursor-pointer flex items-center gap-1 leading-none"
              >
                ⬅️ Back to Pokédex database
              </button>
            )}

            {/* TWO-COLUMN PROFILE SUMMARY AND PARAMETERS DETAIL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mt-4">
              
              {/* Left Column: Avatar & Basic Stats Info Card */}
              <div className="flex flex-col items-center bg-slate-950/40 border border-slate-900 rounded-2xl p-6 text-center">
                <div className="w-32 h-32 flex items-center justify-center bg-slate-950/60 border border-slate-900/60 rounded-2xl mb-4 relative">
                  <img
                    src={p.img}
                    alt={selectedPkmn}
                    className="w-[85%] h-[85%] object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                  />
                  <span className="absolute bottom-2 right-2 bg-slate-900/90 text-[10px] font-mono font-bold text-gray-400 px-2 py-0.5 rounded border border-slate-800">
                    {padDex(p.dex)}
                  </span>
                </div>

                {isEditMode ? (
                  <div className="w-full mb-4">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block text-left mb-1">Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                ) : (
                  <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-2">{selectedPkmn}</h3>
                )}

                {isEditMode && (
                  <div className="w-full flex flex-col gap-1.5 mb-4">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block text-left">Edit Mode Tab</label>
                    <div className="flex gap-1.5 bg-slate-950/60 p-1 border border-slate-900 rounded-xl">
                      <button
                        onClick={() => setActiveEditTab("skills")}
                        className={`flex-1 py-2 text-center text-[10px] font-black rounded-lg cursor-pointer transition uppercase ${
                          activeEditTab === "skills"
                            ? "bg-cyan-500 text-[#0f0f1a] shadow-md shadow-cyan-500/20"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        ⚔️ Edit Skill Properties
                      </button>
                      <button
                        onClick={() => setActiveEditTab("movement")}
                        className={`flex-1 py-2 text-center text-[10px] font-black rounded-lg cursor-pointer transition uppercase ${
                          activeEditTab === "movement"
                            ? "bg-cyan-500 text-[#0f0f1a] shadow-md shadow-cyan-500/20"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        🏃 Edit Custom Movement
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-1.5 mb-6">
                  <span
                    className="text-[10px] font-extrabold px-3 py-1 rounded text-white tracking-widest uppercase"
                    style={{ backgroundColor: TCOL[p.t1] || "#68a090" }}
                  >
                    {p.t1}
                  </span>
                  {p.t2 && (
                    <span
                      className="text-[10px] font-extrabold px-3 py-1 rounded text-white tracking-widest uppercase"
                      style={{ backgroundColor: TCOL[p.t2] || "#68a090" }}
                    >
                      {p.t2}
                    </span>
                  )}
                </div>

                {/* Base stats layout */}
                <div className="w-full border-t border-slate-900/60 pt-4 flex flex-col gap-3">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left mb-1.5">Base Attributes</h4>

                  {/* HP Stat */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-semibold">HP</span>
                    {isEditMode ? (
                      <input
                        type="number"
                        value={editHp}
                        onChange={e => setEditHp(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-16 bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-white text-center rounded px-1 py-0.5"
                      />
                    ) : (
                      <span className="text-xs text-gray-200 font-bold font-mono">{editHp}</span>
                    )}
                  </div>
                  <div className="h-1.5 bg-[#0f0f1a] rounded-full overflow-hidden border border-slate-900/80">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (editHp / 25) * 100)}%` }} />
                  </div>

                  {/* Attack Stat */}
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-400 font-semibold">ATK</span>
                    {isEditMode ? (
                      <input
                        type="number"
                        value={editAtk}
                        onChange={e => setEditAtk(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-16 bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-white text-center rounded px-1 py-0.5"
                      />
                    ) : (
                      <span className="text-xs text-gray-200 font-bold font-mono">{editAtk}</span>
                    )}
                  </div>
                  <div className="h-1.5 bg-[#0f0f1a] rounded-full overflow-hidden border border-slate-900/80">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, (editAtk / 8) * 100)}%` }} />
                  </div>

                  {/* Defense Stat */}
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-400 font-semibold">DEF</span>
                    {isEditMode ? (
                      <input
                        type="number"
                        value={editDef}
                        onChange={e => setEditDef(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-16 bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-white text-center rounded px-1 py-0.5"
                      />
                    ) : (
                      <span className="text-xs text-gray-200 font-bold font-mono">{editDef}</span>
                    )}
                  </div>
                  <div className="h-1.5 bg-[#0f0f1a] rounded-full overflow-hidden border border-slate-900/80">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, (editDef / 5) * 100)}%` }} />
                  </div>

                  {/* Cost Stat */}
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-400 font-semibold">Cost (Gold)</span>
                    {isEditMode ? (
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={editCost}
                        onChange={e => setEditCost(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-16 bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-white text-center rounded px-1 py-0.5"
                      />
                    ) : (
                      <span className="text-xs text-gray-200 font-bold font-mono">{editCost}</span>
                    )}
                  </div>
                  <div className="h-1.5 bg-[#0f0f1a] rounded-full overflow-hidden border border-slate-900/80">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (editCost / 10) * 100)}%` }} />
                  </div>
                </div>
              </div>

              {/* Right Column: Ability info, and Skills lists / custom skill offsets editor */}
              <div className="md:col-span-2 flex flex-col gap-6">
                
                {/* 1. Ability Info Card */}
                <div className="bg-[#16213e]/30 border border-[#0f3460]/40 rounded-2xl p-5">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <span>✨</span> Passive Ability Description
                  </h4>
                  {isEditMode ? (
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Ability Name</label>
                        <input
                          type="text"
                          value={editAbility}
                          onChange={e => setEditAbility(e.target.value)}
                          className="w-full bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Ability description</label>
                        <textarea
                          rows={2}
                          value={editAbilityDesc}
                          onChange={e => setEditAbilityDesc(e.target.value)}
                          className="w-full bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-cyan-400 font-sans"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <strong className="text-sm text-gray-100 font-black tracking-wide block mb-1">{editAbility}</strong>
                      <p className="text-xs text-gray-400 leading-relaxed font-medium">{editAbilityDesc}</p>
                    </div>
                  )}
                </div>

                {/* 2. Skills & Editor Panel */}
                {activeEditTab === "skills" || !isEditMode ? (
                  <div className="bg-[#16213e]/30 border border-[#0f3460]/40 rounded-2xl p-5">
                    <div className="flex justify-between items-center border-b border-[#0f3460]/40 pb-3 mb-4">
                      <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span>⚔️</span> Pokémon Skill set Configurator
                      </h4>
                      
                      {/* Skills index navigation tabs */}
                      <div className="flex gap-1.5">
                        {editSkills.map((sk, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveSkillIdx(idx)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase transition border cursor-pointer ${
                              activeSkillIdx === idx
                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-400/50 shadow-md"
                                : "bg-[#0f0f1a] text-gray-400 border-[#2a3a5a] hover:bg-[#16213e]"
                            }`}
                          >
                            Skill #{idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    {editSkills[activeSkillIdx] ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Skill properties input fields */}
                        <div className="flex flex-col gap-4">
                          
                          {/* Custom skill checkbox (only active in Edit Mode) */}
                          {isEditMode && (
                            <div className="flex items-center gap-2 bg-[#0f0f1a] p-3 border border-slate-900 rounded-xl">
                              <input
                                type="checkbox"
                                id="skillEditChecked"
                                checked={skillEditChecked}
                                onChange={e => setSkillEditChecked(e.target.checked)}
                                className="w-4 h-4 text-cyan-500 accent-cyan-500 border-[#2a3a5a]"
                              />
                              <label htmlFor="skillEditChecked" className="text-xs text-gray-300 font-bold uppercase tracking-wider cursor-pointer">
                                Customize Skill Mechanics
                              </label>
                            </div>
                          )}

                          {/* Skill Name & Cost */}
                          <div className="grid grid-cols-2 gap-3 font-sans">
                            <div>
                              <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1">Skill Name</label>
                              <input
                                type="text"
                                disabled={!isEditMode || !skillEditChecked}
                                value={skillName}
                                onChange={e => setSkillName(e.target.value)}
                                className={`w-full bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-cyan-400 ${
                                  (!isEditMode || !skillEditChecked) ? "opacity-60 cursor-not-allowed" : ""
                                }`}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block mb-1">Energy Cost</label>
                              <input
                                type="number"
                                min={0}
                                max={10}
                                disabled={!isEditMode || !skillEditChecked}
                                value={skillCost}
                                onChange={e => setSkillCost(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                className={`w-full bg-[#0f0f1a] border border-[#2a3a5a] text-xs text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-cyan-400 ${
                                  (!isEditMode || !skillEditChecked) ? "opacity-60 cursor-not-allowed" : ""
                                }`}
                              />
                            </div>
                          </div>

                          {/* Damage Parameter */}
                          <div className="flex flex-col gap-1.5 bg-[#0f0f1a] p-3 rounded-xl border border-slate-900">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="skillDmgChecked"
                                disabled={!isEditMode || !skillEditChecked}
                                checked={skillDmgChecked}
                                onChange={e => setSkillDmgChecked(e.target.checked)}
                                className="w-4 h-4 text-cyan-500 accent-cyan-500"
                              />
                              <label htmlFor="skillDmgChecked" className="text-xs text-gray-300 font-bold uppercase tracking-wider cursor-pointer">
                                Damaging Skill
                              </label>
                            </div>
                            {skillDmgChecked && (
                              <div className="mt-2 pl-6">
                                <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Damage value (e.g. "Atk" or a number)</label>
                                <input
                                  type="text"
                                  disabled={!isEditMode || !skillEditChecked}
                                  value={skillDmgVal}
                                  onChange={e => setSkillDmgVal(e.target.value)}
                                  className="w-full bg-[#16213e] border border-[#2a3a5a] text-xs text-white px-2.5 py-1 rounded"
                                />
                              </div>
                            )}
                          </div>

                          {/* Status inflict Parameter */}
                          <div className="flex flex-col gap-1.5 bg-[#0f0f1a] p-3 rounded-xl border border-slate-900">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="skillStatusChecked"
                                disabled={!isEditMode || !skillEditChecked}
                                checked={skillStatusChecked}
                                onChange={e => setSkillStatusChecked(e.target.checked)}
                                className="w-4 h-4 text-cyan-500 accent-cyan-500"
                              />
                              <label htmlFor="skillStatusChecked" className="text-xs text-gray-300 font-bold uppercase tracking-wider cursor-pointer">
                                Inflicts Status Condition
                              </label>
                            </div>
                            {skillStatusChecked && (
                              <div className="mt-2 pl-6 grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Chance d20 (1-20)</label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    disabled={!isEditMode || !skillEditChecked}
                                    value={skillStatusChance}
                                    onChange={e => setSkillStatusChance(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 10)))}
                                    className="w-full bg-[#16213e] border border-[#2a3a5a] text-xs text-white px-2 py-1 text-center rounded"
                                  />
                                  <span className="text-[8px] text-cyan-400 mt-1 block">Chance: {skillStatusChance * 5}%</span>
                                </div>
                                <div>
                                  <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Status Type</label>
                                  <select
                                    disabled={!isEditMode || !skillEditChecked}
                                    value={skillStatusType}
                                    onChange={e => setSkillStatusType(e.target.value)}
                                    className="w-full bg-[#16213e] border border-[#2a3a5a] text-xs text-white px-2 py-1.5 rounded"
                                  >
                                    <option value="burn">Burn</option>
                                    <option value="paralysis">Paralysis</option>
                                    <option value="sleep">Sleep</option>
                                    <option value="freeze">Freeze</option>
                                    <option value="poison">Poison</option>
                                    <option value="confuse">Confuse</option>
                                    <option value="toxic">Toxic</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Buff/Debuff Parameter */}
                          <div className="flex flex-col gap-1.5 bg-[#0f0f1a] p-3 rounded-xl border border-slate-900">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="skillBuffChecked"
                                disabled={!isEditMode || !skillEditChecked}
                                checked={skillBuffChecked}
                                onChange={e => setSkillBuffChecked(e.target.checked)}
                                className="w-4 h-4 text-cyan-500 accent-cyan-500"
                              />
                              <label htmlFor="skillBuffChecked" className="text-xs text-gray-300 font-bold uppercase tracking-wider cursor-pointer">
                                Applies Buff/Debuff/Heal
                              </label>
                            </div>
                            {skillBuffChecked && (
                              <div className="mt-2 pl-6 flex flex-col gap-2">
                                <div>
                                  <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Effect Category</label>
                                  <select
                                    disabled={!isEditMode || !skillEditChecked}
                                    value={skillBuffType}
                                    onChange={e => setSkillBuffType(e.target.value)}
                                    className="w-full bg-[#16213e] border border-[#2a3a5a] text-xs text-white px-2 py-1.5 rounded"
                                  >
                                    <option value="Atk">Atk Buff</option>
                                    <option value="Def">Def Buff</option>
                                    <option value="Heal">Heal target</option>
                                  </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Amount</label>
                                    <input
                                      type="number"
                                      disabled={!isEditMode || !skillEditChecked}
                                      value={skillBuffAmt}
                                      onChange={e => setSkillBuffAmt(parseInt(e.target.value, 10) || 1)}
                                      className="w-full bg-[#16213e] border border-[#2a3a5a] text-xs text-white px-2 py-1 text-center rounded"
                                    />
                                  </div>
                                  {skillBuffType !== "Heal" && (
                                    <div>
                                      <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Duration (turns)</label>
                                      <input
                                        type="number"
                                        disabled={!isEditMode || !skillEditChecked}
                                        value={skillBuffTurns}
                                        onChange={e => setSkillBuffTurns(Math.max(1, parseInt(e.target.value, 10) || 2))}
                                        className="w-full bg-[#16213e] border border-[#2a3a5a] text-xs text-white px-2 py-1 text-center rounded"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Target Parameter */}
                          <div className="flex flex-col gap-1.5 bg-[#0f0f1a] p-3 rounded-xl border border-slate-900">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="skillTargetChecked"
                                disabled={!isEditMode || !skillEditChecked}
                                checked={skillTargetChecked}
                                onChange={e => setSkillTargetChecked(e.target.checked)}
                                className="w-4 h-4 text-cyan-500 accent-cyan-500"
                              />
                              <label htmlFor="skillTargetChecked" className="text-xs text-gray-300 font-bold uppercase tracking-wider cursor-pointer">
                                Target skill
                              </label>
                            </div>
                            {skillTargetChecked && (
                              <div className="mt-2 pl-6">
                                <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">How many targets to choose?</label>
                                <select
                                  disabled={!isEditMode || !skillEditChecked}
                                  value={skillTargetCount}
                                  onChange={e => setSkillTargetCount(Number(e.target.value))}
                                  className="w-full bg-[#16213e] border border-[#2a3a5a] text-xs text-white px-2 py-1.5 rounded"
                                >
                                  <option value={1}>1 Target</option>
                                  <option value={2}>2 Targets</option>
                                  <option value={3}>3 Targets</option>
                                  <option value={4}>4 Targets</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right panel: 9x9 Skill range designer grid */}
                        <div className="flex flex-col items-center">
                          <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider text-center block mb-2">
                            Skill Area Coverage Editor (9x9)
                          </label>
                          <p className="text-[9px] text-gray-400 text-center mb-4">
                            Orange represents caster. Click tiles to toggle target area (Blue tiles).
                          </p>

                          <div className="grid gap-[2px] bg-slate-950 p-2 rounded-2xl border border-slate-900" style={{ gridTemplateColumns: "repeat(9, 28px)" }}>
                            {Array.from({ length: 9 }, (_, rIdx) => (
                              <React.Fragment key={rIdx}>
                                {Array.from({ length: 9 }, (_, cIdx) => {
                                  const isCaster = cIdx === 4 && rIdx === 4;
                                  const dc = cIdx - 4;
                                  const dr = rIdx - 4;
                                  const isActive = customOffsets.some(o => o.dc === dc && o.dr === dr);

                                  return (
                                    <div
                                      key={cIdx}
                                      onClick={() => {
                                        if (isEditMode && skillEditChecked && !isCaster) {
                                          toggleOffset(dc, dr);
                                        }
                                      }}
                                      className={`w-[28px] h-[28px] rounded flex items-center justify-center text-[7px] font-mono border ${
                                        isCaster
                                          ? "bg-amber-500 border-amber-300 text-[#0f0f1a] font-extrabold shadow-md shadow-amber-500/20"
                                          : isActive
                                          ? "bg-indigo-600 border-indigo-400 text-white cursor-pointer shadow-md shadow-indigo-500/10"
                                          : `bg-slate-800 border-slate-700/60 text-slate-500 ${
                                              (isEditMode && skillEditChecked) ? "hover:bg-slate-700 cursor-pointer" : ""
                                            }`
                                      }`}
                                      title={`Offset: (${dc}, ${dr})`}
                                    >
                                      {isCaster ? "C" : isActive ? "★" : ""}
                                    </div>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </div>

                          {/* Normal / read-only description */}
                          {!isEditMode && (
                            <div className="w-full bg-[#0f0f1a] p-3 border border-slate-900 rounded-xl mt-6">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                                Original Skill Description
                              </span>
                              <p className="text-xs text-gray-200 font-medium">
                                {editSkills[activeSkillIdx].skillDesc || "No skill description."}
                              </p>
                            </div>
                          )}
                        </div>

                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-6">Skill detail unavailable.</p>
                    )}

                  </div>
                ) : (
                  <div className="bg-[#16213e]/30 border border-[#0f3460]/40 rounded-2xl p-5">
                    <div className="flex justify-between items-center border-b border-[#0f3460]/40 pb-3 mb-4">
                      <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span>🏃</span> Pokémon Custom Movement Configurator
                      </h4>
                      <button
                        onClick={() => setCustomMoveOffsets([])}
                        className="px-3 py-1 bg-red-950/60 hover:bg-red-950 border border-red-500/40 text-red-200 text-[10px] font-bold rounded-lg transition cursor-pointer"
                      >
                        Reset to Default Movement
                      </button>
                    </div>

                    <div className="flex flex-col items-center">
                      <p className="text-xs text-gray-300 text-center mb-4 max-w-md font-sans">
                        Configure custom movement offsets for <strong>{selectedPkmn}</strong>. Yellow (U) represents the unit at center (0,0). Blue (★) represents allowed movement tiles. Click tiles to toggle custom movement offsets.
                      </p>

                      <div className="grid gap-[2px] bg-slate-950 p-2 rounded-2xl border border-slate-900" style={{ gridTemplateColumns: "repeat(9, 28px)" }}>
                        {Array.from({ length: 9 }, (_, rIdx) => (
                          <React.Fragment key={rIdx}>
                            {Array.from({ length: 9 }, (_, cIdx) => {
                              const isCaster = cIdx === 4 && rIdx === 4;
                              const dc = cIdx - 4;
                              const dr = rIdx - 4;
                              const isActive = customMoveOffsets.some(o => o.dc === dc && o.dr === dr);

                              return (
                                <div
                                  key={cIdx}
                                  onClick={() => {
                                    if (!isCaster) {
                                      toggleMoveOffset(dc, dr);
                                    }
                                  }}
                                  className={`w-[28px] h-[28px] rounded flex items-center justify-center text-[7px] font-mono border ${
                                    isCaster
                                      ? "bg-yellow-500 border-yellow-300 text-[#0f0f1a] font-extrabold shadow-md shadow-yellow-500/20"
                                      : isActive
                                      ? "bg-cyan-600 border-cyan-400 text-white cursor-pointer shadow-md shadow-cyan-500/10"
                                      : "bg-slate-800 border-slate-700/60 text-slate-500 hover:bg-slate-700 cursor-pointer"
                                  }`}
                                  title={`Offset: (${dc}, ${dr})`}
                                >
                                  {isCaster ? "U" : isActive ? "★" : ""}
                                </div>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        );
      })()}

    </div>
  );
};
