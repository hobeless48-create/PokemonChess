# Implementation Plan - Pokémon Chess Major Mechanics & Database Update (Final)

This document outlines the final plan to implement Generations 3-6 Pokémon, critical hit rules, push/pull physics, right-click radius previews, shop changes, custom gauges, active abilities, Zygarde reassembly, Yveltal/Xerneas logic, and emoji fallbacks.

---

## User Review Required

> [!IMPORTANT]
> ### 1. Varied Critical Hits
> - **Default:** No critical rolls on basic attacks or standard skills.
> - **Description Parsing:** If a skill, item, or ability description mentions critical hits, we parse the text to determine the d20 threshold:
>   - Contains `crit on 14+`: Critical hit if roll $> 13$ (35% chance).
>   - Contains `crit on 15+`: Critical hit if roll $> 14$ (30% chance).
>   - Contains `crit on 16+`: Critical hit if roll $> 15$ (25% chance).
>   - Contains `High crit chance` or `high critical rate`: Critical hit if roll $> 8$ (60% chance).
> - **Effect:** Ignored target Def, $+2$ damage on critical hit.
> - **Immunities:** *Shell Armor* and *Battle Armor* prevent critical damage.

> [!IMPORTANT]
> ### 2. Yveltal, Xerneas, Zygarde Mechanics
> - **Yveltal:**
>   - *Dark Aura:* Grants $+2$ Atk to all Flying and Dark Pokémon on the field (both teams).
>   - *Oblivion Wing:* Deals 5 damage, heals Yveltal for `netDamage - 2` (min 0).
>   - *Crimson Feast:* Deals 2 damage, heals Yveltal 1 HP per enemy hit.
>   - *Soul Drain Eclipse:* Deals 5 damage, target gets Atk $-1$ (2 turns), Yveltal gets Atk $+1$ (2 turns), heals lowest HP Dark ally 3 HP.
> - **Xerneas:**
>   - *Blessing Aura:* Whenever a Fairy ally uses a skill, Xerneas gains +1 Happiness. If Xerneas has 20+ Happiness at turn start, player gets $+1$ Command Pool Energy.
>   - *Geomancy:* Starts charging (duration 2). On next turn start, heals allies in AoE(2) for 3 HP and grants Atk $+2$ (2 turns).
>   - *Heart Sacrifice:* Requires ally with $\ge 10$ Happiness. Deduct 10 Happiness, heal target 6 HP.
>   - *Eternal Radiance:* Deals $5 + \lfloor Happiness/5 \rfloor$ damage, heals all allies for $\lfloor Happiness/5 \rfloor$ HP, consumes all Happiness (resets to 0).
> - **Zygarde Reassembly System:**
>   - Zygarde starts as `"Zygarde Reassembly Unit"` (16 HP, 4 Atk, 3 Def).
>   - *Cell Spawn:* At end of each turn, every empty cell within AoE(3) of the unit has a 10% chance to spawn a `"Zygarde Cell"` (1 HP, 0 Def, player = unit.player, `isSummon = true`).
>   - *Cell Collection:*
>     - Allied Pokémon attack/hit a Zygarde Cell to collect it (total cells count +1).
>     - Enemy attacks on a Zygarde Cell destroy it permanently.
>   - *Evolution:* Checked immediately upon collection.
>     - 10 Cells -> transforms to Zygarde 10% (8 HP, 2 Atk, 2 Def).
>     - $+15$ Cells -> transforms to Zygarde 50% (11 HP, 4 Atk, 3 Def).
>     - $+25$ Cells -> transforms to Zygarde Complete Forme (13 HP, 5 Atk, 3 Def).
>     - Evolving retains current board position, modifiers, and damage taken (HP clamps to new max minus damage taken).
>     - *Complete Forme Transition:* Destroys all cells on board and prevents further cell spawns.
>   - *Power Construct:* If Zygarde 10% or 50% drops below 50% HP, transform into Zygarde Complete Forme immediately (max HP = 13, HP clamps to `13 - damageTaken`, Atk = 5, Def = 3).

> [!NOTE]
> ### 3. Emoji Fallback System for Missing Sprites
> - If any unit has no valid `img` URL or it fails to load, render a clean, stylized fallback using text-based emojis instead of placeholder images:
>   - `Zygarde Cell` -> `🟢`
>   - `Zygarde Reassembly Unit` -> `📦`
>   - `Clear Bell` / `Tidal Bell` -> `🔔`
>   - Mini units -> `👾`
>   - Custom pillars -> `🪨`
> - A text log notes which emojis are being used to let the user supply official URLs later.

---

## Proposed Changes

### Types Definition
#### [MODIFY] [types.ts](file:///d:/s0846/PokemonChess/src/types.ts)
- Add skill properties: `accuracy`, `customRadiusOffsets`, `pushAmount`, `pullAmount`, `summonConfig`.
- Add entity properties: `isSummon`, `shield`, `shieldDuration`, `activeAbilityUsed`, `curryEffect`, `customBar`, `zygCellsCollected`.

### Database & Sprites
#### [NEW] [pokemon_gen3_6.ts](file:///d:/s0846/PokemonChess/src/data/pokemon_gen3_6.ts)
- Move compiled database entries into this file.
#### [MODIFY] [pokemon.ts](file:///d:/s0846/PokemonChess/src/data/pokemon.ts)
- Spread `DB_GEN3_6` into `DB`. Set Alolan Vulpix and Alolan Ninetales sprite overrides.

### Core Mechanics & UI
#### [MODIFY] [gameEngine.ts](file:///d:/s0846/PokemonChess/src/utils/gameEngine.ts)
- Check parsed crit rates, bypass Def if crit, implement Yveltal's *Dark Aura* modifier.
#### [MODIFY] [App.tsx](file:///d:/s0846/PokemonChess/src/App.tsx)
- Implement d20 accuracy, crit checks (roll $>8$ for high crit or specific parsed threshold), push/pull cardinal mechanics (colliding check), Zygarde assembly loops, Xerneas Geomancy/Blessing loops, and shop items.
#### [MODIFY] [Board.tsx](file:///d:/s0846/PokemonChess/src/components/Board.tsx)
- Support right-click `radiusPreviewCenter` indicator and emoji fallbacks.
#### [MODIFY] [Pokedex.tsx](file:///d:/s0846/PokemonChess/src/components/Pokedex.tsx)
- Implement skill editor fields for accuracy, push/pull, summons.
#### [MODIFY] [StatsCard.tsx](file:///d:/s0846/PokemonChess/src/components/StatsCard.tsx)
- Display custom bars, shield values, active ability buttons.
