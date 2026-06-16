import json
import re
from pathlib import Path

root = Path(r"d:\s0846\Pokechess")
text = (root / "unitlist" / "gen1.txt").read_text(encoding="utf-8")
out_path = root / "js" / "data.js"

NAME_MAP = {
    "Nidoran♀": "NidoranF",
    "Nidoran♂": "NidoranM",
}

LATER_GEN_EVOS = {
    "Steelix",
    "Blissey",
    "Tangrowth",
    "Scizor",
    "Kingdra",
    "Porygon2",
    "Electivire",
    "Magmortar",
    "Magnezone",
}

ROLE_MAP = {
    "Atk": "Attack",
    "Attack": "Attack",
    "Def": "Defense",
    "Defense": "Defense",
    "Support": "Support",
    "Assassin": "Attack",
}

TYPE_COLORS = {
    "Fire": "#D85A30",
    "Water": "#185FA5",
    "Grass": "#3B6D11",
    "Electric": "#BA7517",
    "Ice": "#0C447C",
    "Psychic": "#993556",
    "Flying": "#534AB7",
    "Normal": "#5F5E5A",
    "Poison": "#72243E",
    "Rock": "#5F5A5A",
    "Ground": "#854F0B",
    "Ghost": "#3C3489",
    "Bug": "#6D8E1E",
    "Dragon": "#5B7DD1",
    "Fairy": "#C96BAA",
    "Fighting": "#A63D2E",
    "Steel": "#6F7C8B",
}

FIELD_PREFIXES = (
    "Type:",
    "Url:",
    "Role:",
    "Cost:",
    "HP:",
    "Atk:",
    "Def",
    "EvoCost:",
    "EvoTo:",
    "EvoFrom:",
    "Ability:",
    "Legendary:",
    "HatchGroup:",
    "Skill",
)


def normalize_name(name: str) -> str:
    return NAME_MAP.get(name.strip(), name.strip())


def normalize_dirs(dirs: str | None) -> str | None:
    if not dirs:
        return None
    parts = [p.strip() for p in dirs.split(",") if p.strip()]
    if parts == ["1"]:
        return "3"
    return ",".join(parts)


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("—", "-")).strip(" .")


def get_skill_name(text: str) -> str:
    text = clean_text(text)
    match = re.match(
        r"([A-Za-z0-9'.\- ]+?)(?=\s*\(|\s*\||\s+Line\b|\s+Cone\b|\s+AoE\b|\s+Aoe\b|\s+Target\b|\s+Self\b|\s+Ally\b|\s+All Ally\b|\s+Random\b|:)",
        text,
    )
    if match:
        return match.group(1).strip()
    if ":" in text:
        return text.split(":", 1)[0].strip()
    return text.strip()


def get_shape(text: str) -> str:
    text = clean_text(text)
    target_block = re.search(r"(Target\s*=\s*\[[^\]]+\])", text, re.I)
    if target_block:
        return target_block.group(1)
    m = re.search(r"\bAoE\((\d+)\)", text, re.I)
    if m:
        return f"AoE({m.group(1)})"
    m = re.search(r"\bAoe\((\d+)\)", text, re.I)
    if m:
        return f"AoE({m.group(1)})"
    m = re.search(r"\bCone\((\d+)\)(?:\(([0-9,]+)\))?", text, re.I)
    if m:
        dirs = normalize_dirs(m.group(2)) or "3"
        return f"Cone({m.group(1)})({dirs})"
    m = re.search(r"\bLine\((\d+)\)(?:\(([0-9,]+)\))?", text, re.I)
    if m:
        dirs = normalize_dirs(m.group(2)) or "3"
        return f"Line({m.group(1)})({dirs})"
    m = re.search(r"\bTarget\s*=?\s*(\d+)", text, re.I)
    if m:
        return f"Line({m.group(1)})(3)"
    if re.search(r"\bSelf\b", text, re.I):
        return "Self"
    if re.search(r"\bAll Ally\b", text, re.I):
        return "AllAllies"
    if re.search(r"\bAlly\b", text, re.I):
        return "Ally"
    return "Line(1)(3)"


def get_damage(text: str) -> int:
    text = clean_text(text)
    for pat in (
        r"fixed\s+(\d+)\s+damage",
        r"deal\s+(\d+)\s+damage",
        r"drain\s+(\d+)\s+hp",
        r"hitting\s+for\s+(\d+)\s+damage",
    ):
        m = re.search(pat, text, re.I)
        if m:
            return int(m.group(1))
    return 0


def get_status(text: str):
    text = clean_text(text)
    patterns = (
        r"(\d+)%\s+chance[^.]*?\b(Burn|Poison|Paralyze|Paralyse|Confuse|Freeze|Sleep)\b",
        r"\b(Burn|Poison|Paralyze|Paralyse|Confuse|Freeze|Sleep)\b\s+for\s+\d+\s+turns[^.]*?(\d+)%",
    )
    for pat in patterns:
        m = re.search(pat, text, re.I)
        if not m:
            continue
        if m.group(1).isdigit():
            pct = int(m.group(1))
            status = m.group(2)
        else:
            status = m.group(1)
            pct = int(m.group(2))
        status = status.lower().replace("paralyse", "paralysis").replace("paralyze", "paralysis")
        return status, round(pct / 100, 2)
    if re.search(r"100%\s+chance[^.]*sleep", text, re.I):
        return "sleep", 1.0
    return None, None


def get_stat_effect(text: str):
    text = clean_text(text)
    m = re.search(r"Gain\s*\+?(-?\d+)\s+(Atk|Def)[^.]*?(\d+)\s+turn", text, re.I)
    if m:
        return {"target": "self", "stat": m.group(2).lower(), "amount": int(m.group(1)), "duration": int(m.group(3))}
    m = re.search(r"(?:lower|reduce)[^.]*target[^.]*?(Atk|Def)[^.]*?by\s+(\d+)(?:[^.]*?(\d+)\s+turn)?", text, re.I)
    if m:
        return {"target": "enemy", "stat": m.group(1).lower(), "amount": -int(m.group(2)), "duration": int(m.group(3) or 2)}
    m = re.search(r"Enemies[^.]*get\s+(-?\d+)\s+(Atk|Def)[^.]*?(\d+)\s+turn", text, re.I)
    if m:
        return {"target": "enemy", "stat": m.group(2).lower(), "amount": int(m.group(1)), "duration": int(m.group(3))}
    m = re.search(r"ally[^.]*\+?(-?\d+)\s+(Atk|Def)[^.]*?(\d+)\s+turn", text, re.I)
    if m:
        return {"target": "ally", "stat": m.group(2).lower(), "amount": int(m.group(1)), "duration": int(m.group(3))}
    return None


def get_heal(text: str):
    text = clean_text(text)
    m = re.search(r"heal\s+(\d+)\s+hp", text, re.I) or re.search(r"recover\s+(\d+)\s+hp", text, re.I)
    if not m:
        return None, None
    amount = int(m.group(1))
    if re.search(r"all ally|all allies", text, re.I):
        return amount, "all_allies"
    if re.search(r"to self|self", text, re.I):
        return amount, "self"
    if re.search(r"ally", text, re.I):
        return amount, "ally"
    return amount, "self"


def get_drain(text: str):
    text = clean_text(text)
    m = re.search(r"drain\s+(\d+)\s+hp", text, re.I)
    if m and "hp/turn" not in text.lower():
        return int(m.group(1))
    return None


def get_self_damage(text: str):
    text = clean_text(text)
    for pat in (
        r"self\s+damage(?:\s+for)?\s+(\d+)",
        r"user\s+takes\s+(\d+)\s+recoil",
        r"user\s+takes\s+(\d+)\s+damage",
    ):
        m = re.search(pat, text, re.I)
        if m:
            return int(m.group(1))
    return None


def get_skill_cost(text: str):
    text = clean_text(text)
    for pat in (r"costs\s+(\d+)\s+energy", r"energy\s+cost\s*=\s*(\d+)"):
        m = re.search(pat, text, re.I)
        if m:
            return int(m.group(1))
    return None


def get_cooldown(text: str):
    m = re.search(r"cooldown\s*(\d+)", clean_text(text), re.I)
    return int(m.group(1)) if m else None


def get_limit(text: str):
    if re.search(r"once a game", clean_text(text), re.I):
        return 1
    return None


def build_skill(skill_text: str):
    text = clean_text(skill_text)
    skill = {
        "skillName": get_skill_name(text),
        "skillDesc": get_shape(text),
        "skillDmg": get_damage(text),
        "skillRaw": text,
    }
    status, chance = get_status(text)
    if status:
        skill["statusChance"] = status
        skill["statusChanceValue"] = chance
    effect = get_stat_effect(text)
    if effect:
        skill["skillEffect"] = effect
    heal, heal_target = get_heal(text)
    if heal:
        skill["skillHeal"] = heal
        skill["skillHealTarget"] = heal_target
    drain = get_drain(text)
    if drain:
        skill["drainAmount"] = drain
    if "Leech Seed" in skill["skillName"] or ("hp/turn" in text.lower() and "heal user equal amount" in text.lower()):
        dur = re.search(r"(\d+)\s+turn", text, re.I)
        skill["special"] = "leechSeed"
        skill["specialDuration"] = int(dur.group(1)) if dur else 2
    if skill["skillName"] in {"Rain Dance", "Sunny Day", "Snow Scape"}:
        weather_map = {"Rain Dance": "Rain", "Sunny Day": "Sunny Day", "Snow Scape": "Hail Storm"}
        skill["setWeather"] = weather_map[skill["skillName"]]
        skill["weatherDuration"] = 5
    self_damage = get_self_damage(text)
    if self_damage:
        skill["selfDamage"] = self_damage
    skill_cost = get_skill_cost(text)
    if skill_cost is not None:
        skill["skillCost"] = skill_cost
    cooldown = get_cooldown(text)
    if cooldown is not None:
        skill["skillCooldown"] = cooldown
    limit = get_limit(text)
    if limit is not None:
        skill["skillLimit"] = limit
    if skill["skillDesc"] == "Self" and "skillEffect" not in skill and "skillHeal" not in skill:
        skill["skillEffect"] = {"target": "self", "stat": "atk", "amount": 0, "duration": 1}
    return skill


entries = []
current = None
current_skill = None

for raw_line in text.splitlines():
    line = raw_line.strip()
    if not line:
        continue
    m = re.match(r"^(\d+)\.\s*(.+)$", line)
    if m:
        if current:
            if current_skill:
                current["skills_raw"].append(current_skill.strip())
            entries.append(current)
        current = {
            "dex": int(m.group(1)),
            "raw_name": m.group(2).strip(),
            "name": normalize_name(m.group(2)),
            "skills_raw": [],
        }
        current_skill = None
        continue
    if current is None:
        continue
    skill_match = re.match(r"^Skill(?:\s+\d+)?\s*:\s*(.+)$", line, re.I)
    if skill_match:
        if current_skill:
            current["skills_raw"].append(current_skill.strip())
        current_skill = skill_match.group(1).strip()
        continue
    is_field = line.startswith(FIELD_PREFIXES)
    if is_field and current_skill:
        current["skills_raw"].append(current_skill.strip())
        current_skill = None
    if current_skill:
        current_skill += " " + line
        continue
    if line.startswith("Type:"):
        current["type"] = line.split(":", 1)[1].strip()
    elif line.startswith("Url:"):
        current["img"] = line.split(":", 1)[1].strip()
    elif line.startswith("Role:"):
        current["role"] = line.split(":", 1)[1].strip()
    elif line.startswith("Cost:"):
        m = re.search(r"(\d+)", line)
        current["cost"] = int(m.group(1)) if m else 1
    elif line.startswith("HP:"):
        current["hp"] = int(re.search(r"(\d+)", line).group(1))
    elif line.startswith("Atk:"):
        current["atk"] = int(re.search(r"(\d+)", line).group(1))
    elif line.startswith("Def"):
        m = re.search(r"(\d+)", line)
        current["def"] = int(m.group(1)) if m else 0
    elif line.startswith("EvoCost:"):
        m = re.search(r"(\d+)", line)
        current["evoCost"] = int(m.group(1)) if m else None
    elif line.startswith("EvoTo:"):
        current["evoTo"] = normalize_name(line.split(":", 1)[1].strip())
    elif line.startswith("EvoFrom:"):
        current["evoFrom"] = normalize_name(line.split(":", 1)[1].strip())
    elif line.startswith("Ability:"):
        ability_text = line.split(":", 1)[1].strip()
        m = re.match(r"([^\(\|]+?)(?:\s*\((.*)\))?$", ability_text)
        if m:
            current["ability"] = clean_text(m.group(1))
            if m.group(2):
                current["abilityDesc"] = clean_text(m.group(2))
        else:
            current["ability"] = clean_text(ability_text)
    elif line.startswith("Legendary:"):
        current["legendary"] = "true" in line.lower()
    elif line.startswith("HatchGroup:"):
        current["hatchGroup"] = line.split(":", 1)[1].strip().lower()

if current:
    if current_skill:
        current["skills_raw"].append(current_skill.strip())
    entries.append(current)

for entry in entries:
    dex = entry["dex"]
    if not entry.get("img"):
        entry["img"] = f"https://assets.pokemon.com/assets/cms2/img/pokedex/detail/{dex:03d}.png"
    types = [t.strip() for t in entry.get("type", "Normal").split("/")]
    entry["t1"] = types[0] if types else "Normal"
    entry["t2"] = types[1] if len(types) > 1 else ""
    entry["cls"] = ROLE_MAP.get(entry.get("role", "Attack"), "Attack")
    entry["color"] = TYPE_COLORS.get(entry["t1"], "#777777")

    evo_to = entry.get("evoTo")
    if evo_to:
        evo_to = normalize_name(evo_to.split("/", 1)[0].strip())
        if evo_to in LATER_GEN_EVOS:
            evo_to = None
    entry["evoTo"] = evo_to
    if entry.get("evoTo") is None:
        entry["evoCost"] = None
    if entry["name"] == "Eevee":
        entry["evoTo"] = "Vaporeon"
        entry["evoCost"] = entry.get("evoCost") or 6

    stage = (
        3
        if entry.get("legendary")
        else (
            1
            if not entry.get("evoFrom") and entry.get("evoTo")
            else 2
            if entry.get("evoFrom") and entry.get("evoTo")
            else 3
            if entry.get("evoFrom")
            else 2
        )
    )
    if stage == 1:
        entry["moveRange"] = 1 if entry["cls"] == "Defense" else 2
    elif stage == 2:
        entry["moveRange"] = 2
    else:
        entry["moveRange"] = 3 if entry["cls"] != "Defense" else 2

    if entry.get("legendary"):
        entry["moveRange"] = max(entry["moveRange"], 3)
        entry["hatchCost"] = 30
    if not entry.get("evoFrom"):
        entry["base"] = True

    skills = [build_skill(s) for s in entry.get("skills_raw", [])]
    if skills:
        entry["skills"] = skills
        primary = skills[0]
        for key in (
            "skillName",
            "skillDesc",
            "skillDmg",
            "skillRaw",
            "statusChance",
            "statusChanceValue",
            "skillEffect",
            "skillHeal",
            "skillHealTarget",
            "drainAmount",
            "special",
            "specialDuration",
            "setWeather",
            "weatherDuration",
            "selfDamage",
            "skillCost",
            "skillCooldown",
            "skillLimit",
        ):
            if key in primary:
                entry[key] = primary[key]


def js_key(name: str) -> str:
    return name if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name) else json.dumps(name)


def js_value(value):
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=True)
    if value is True:
        return "true"
    if value is False:
        return "false"
    if value is None:
        return "null"
    if isinstance(value, (int, float)):
        if isinstance(value, float) and value.is_integer():
            return str(int(value))
        return str(value)
    if isinstance(value, list):
        return "[" + ", ".join(js_value(v) for v in value) + "]"
    if isinstance(value, dict):
        return "{" + ", ".join(f"{k}:{js_value(v)}" for k, v in value.items()) + "}"
    raise TypeError(type(value))


ordered_fields = [
    "dex",
    "t1",
    "t2",
    "cost",
    "base",
    "legendary",
    "hatchGroup",
    "hatchCost",
    "evoFrom",
    "evoCost",
    "evoTo",
    "hp",
    "atk",
    "def",
    "moveRange",
    "cls",
    "ability",
    "abilityDesc",
    "img",
    "color",
    "skillName",
    "skillDesc",
    "skillDmg",
    "skillCost",
    "skillCooldown",
    "skillLimit",
    "statusChance",
    "statusChanceValue",
    "skillEffect",
    "skillHeal",
    "skillHealTarget",
    "drainAmount",
    "special",
    "specialDuration",
    "setWeather",
    "weatherDuration",
    "selfDamage",
    "skillRaw",
    "skills",
]

lines = []
lines.append("const DB = {")
for entry in entries:
    key = js_key(entry["name"])
    payload = []
    for field in ordered_fields:
        if field in entry:
            payload.append(f"{field}:{js_value(entry[field])}")
    lines.append(f"  {key}:{{{', '.join(payload)}}},")
lines.append("};")
lines.append("")
lines.append("const TEFF = {")
lines.append("  Fire:{strong:['Grass','Ice','Bug','Steel'],weak:['Water','Rock','Fire','Dragon']},")
lines.append("  Water:{strong:['Fire','Rock','Ground'],weak:['Grass','Electric','Water','Dragon']},")
lines.append("  Grass:{strong:['Water','Rock','Ground'],weak:['Fire','Ice','Flying','Poison','Bug','Dragon','Steel']},")
lines.append("  Electric:{strong:['Water','Flying'],weak:['Ground','Grass','Electric','Dragon']},")
lines.append("  Ice:{strong:['Grass','Flying','Ground','Dragon'],weak:['Fire','Rock','Steel','Water']},")
lines.append("  Psychic:{strong:['Fighting','Poison'],weak:['Steel','Psychic']},")
lines.append("  Flying:{strong:['Grass','Fighting','Bug'],weak:['Electric','Ice','Rock','Steel']},")
lines.append("  Normal:{strong:[],weak:['Rock','Steel','Fighting']},")
lines.append("  Poison:{strong:['Grass','Fairy'],weak:['Ground','Psychic','Poison','Rock','Ghost']},")
lines.append("  Rock:{strong:['Fire','Flying','Ice','Bug'],weak:['Water','Grass','Fighting','Ground','Steel']},")
lines.append("  Ground:{strong:['Fire','Electric','Rock','Poison','Steel'],weak:['Water','Grass','Ice','Bug']},")
lines.append("  Ghost:{strong:['Ghost','Psychic'],weak:['Ghost']},")
lines.append("  Bug:{strong:['Grass','Psychic'],weak:['Fire','Flying','Rock','Fighting','Ghost','Steel','Fairy','Poison']},")
lines.append("  Dragon:{strong:['Dragon'],weak:['Steel','Fairy']},")
lines.append("  Fairy:{strong:['Fighting','Dragon'],weak:['Fire','Poison','Steel']},")
lines.append("  Fighting:{strong:['Normal','Rock','Steel','Ice'],weak:['Psychic','Flying','Fairy','Bug','Poison']},")
lines.append("  Steel:{strong:['Rock','Ice','Fairy'],weak:['Fire','Water','Electric','Steel']},")
lines.append("};")
lines.append("")
lines.append("const SCOL = {burn:'#F0997B',poison:'#B5D4F4',paralysis:'#FAC775',sleep:'#D3D1C7',freeze:'#B5D4F4',confuse:'#AFA9EC',toxic:'#A064BE'};")
lines.append("const STATUS_META = {")
lines.append("  sleep:{label:'Sleep',desc:'50% chance to wake and act; if the action fails, sleep ends.'},")
lines.append("  paralysis:{label:'Paralysis',desc:'30% chance to be unable to act each turn.'},")
lines.append("  confuse:{label:'Confuse',desc:'30% chance to hurt itself for 2 damage instead of acting.'},")
lines.append("  freeze:{label:'Freeze',desc:'Cannot act until thawed. 25% chance to thaw at end of turn.'},")
lines.append("  toxic:{label:'Toxic',desc:'Takes 1 damage every end of turn while afflicted.'},")
lines.append("  burn:{label:'Burn',desc:'Takes 1 damage every end of turn until cured.'},")
lines.append("  poison:{label:'Poison',desc:'Takes 1 damage every end of turn until cured.'}")
lines.append("};")
lines.append("const TCOL = {Fire:'#D85A30',Water:'#185FA5',Grass:'#3B6D11',Electric:'#BA7517',Ice:'#0C447C',Psychic:'#993556',Flying:'#534AB7',Normal:'#5F5E5A',Poison:'#72243E',Rock:'#5F5A5A',Ground:'#854F0B',Ghost:'#3C3489',Bug:'#6D8E1E',Dragon:'#5B7DD1',Fairy:'#C96BAA',Fighting:'#A63D2E',Steel:'#6F7C8B'};")
lines.append("")
lines.append("let G = {};")
lines.append("")

out_path.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {len(entries)} entries to {out_path}")
