/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShopItem } from "../types";

export const ITEMS: { [name: string]: ShopItem } = {
  // === HELD ITEMS: OFFENSE ===
  "Muscle Band": {
    name: "Muscle Band",
    desc: "สวมใส่: เพิ่ม Atk Modifier +1 ให้กับยูนิตตัวนี้ตลอดเวลา",
    category: "Offense",
    cost: 5,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/muscle-band.png",
    type: "held",
    effect: { stat: "atk", amount: 1 }
  },
  "Black Belt": {
    name: "Black Belt",
    desc: "สวมใส่: เพิ่ม Atk Modifier +1 เฉพาะการโจมตีปกติระยะประชิด",
    category: "Offense",
    cost: 4,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/black-belt.png",
    type: "held",
    effect: { stat: "atk", amount: 1, condition: "melee" }
  },
  "Wise Glasses": {
    name: "Wise Glasses",
    desc: "สวมใส่: เพิ่ม Atk Modifier +1 ให้กับความแรงของ Skill",
    category: "Offense",
    cost: 5,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/wise-glasses.png",
    type: "held",
    effect: { stat: "atk", amount: 1, condition: "skill" }
  },
  "Sharp Beak": {
    name: "Sharp Beak",
    desc: "สวมใส่: ถ้าโจมตีหลังเดินในเทิร์นนั้น → จะได้รับ Atk Modifier +1",
    category: "Offense",
    cost: 4,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/sharp-beak.png",
    type: "held"
  },
  "Scope Lens": {
    name: "Scope Lens",
    desc: "สวมใส่: ถ้าโจมตีศัตรูที่ HP เต็ม 100% → จะได้รับ Atk Modifier +1",
    category: "Offense",
    cost: 4,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/scope-lens.png",
    type: "held"
  },
  "Shell Bell": {
    name: "Shell Bell",
    desc: "สวมใส่: โจมตีโดนศัตรู → ได้รับ Energy +1 แต้ม (เกิดขึ้นสูงสุด 1 ครั้ง/turn)",
    category: "Offense",
    cost: 5,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/shell-bell.png",
    type: "held"
  },
  "King’s Rock": {
    name: "King’s Rock",
    desc: "สวมใส่: โจมตีศัตรูที่ HP ต่ำกว่า 50% → จะได้รับ Atk Modifier +1",
    category: "Offense",
    cost: 4,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/kings-rock.png",
    type: "held"
  },
  "Life Orb": {
    name: "Life Orb",
    desc: "สวมใส่: ทุกการกระทำ Atk Modifier +1 แต่หลังโจมตีเสร็จยูนิตตัวเองจะเสีย 1 HP",
    category: "Offense",
    cost: 5,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/life-orb.png",
    type: "held",
    effect: { stat: "atk", amount: 1 }
  },

  // === HELD ITEMS: DEFENSE ===
  "Leftovers": {
    name: "Leftovers",
    desc: "สวมใส่: เมื่อจบเทิร์นของตัวเอง → ฟื้นฟู HP 1 แต้ม",
    category: "Defense",
    cost: 5,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/leftovers.png",
    type: "held"
  },
  "Rocky Helmet": {
    name: "Rocky Helmet",
    desc: "สวมใส่: เมื่อโดนโจมตีระยะประชิด → ศัตรูผู้โจมตีจะรับความเสียหายสะท้อน 1 HP",
    category: "Defense",
    cost: 4,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/rocky-helmet.png",
    type: "held"
  },
  "Eviolite": {
    name: "Eviolite",
    desc: "สวมใส่: ถ้าตัวหมากยังสามารถวิวัฒนาการต่อได้ → จะได้รับ Def Modifier +1",
    category: "Defense",
    cost: 4,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/eviolite.png",
    type: "held"
  },
  "Focus Band": {
    name: "Focus Band",
    desc: "สวมใส่: ครั้งแรกที่ยูนิตจะโดนโจมตีถึงตาย → พลังชีวิตจะเหลือรอดไว้ที่ 1 HP",
    category: "Defense",
    cost: 5,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/focus-band.png",
    type: "held"
  },
  "Metal Coat": {
    name: "Metal Coat",
    desc: "สวมใส่: ถ้าตัวหมากไม่ได้เดินสั่งขยับเลยในเทิร์นนี้ → จะได้รับ Atk Modifier +1",
    category: "Defense",
    cost: 4,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/metal-coat.png",
    type: "held"
  },
  "Assault Vest": {
    name: "Assault Vest",
    desc: "สวมใส่: เพิ่ม Def Modifier +1 ให้กับยูนิตเฉพาะเวลาคำนวณความเสียหายจาก Skill",
    category: "Defense",
    cost: 4,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/assault-vest.png",
    type: "held"
  },
  "Big Root": {
    name: "Big Root",
    desc: "สวมใส่: กลไกการดูด HP ทั้งหมดของตัวหมากตัวนี้จะฟื้นฟูแรงขึ้น +1 แต้ม",
    category: "Defense",
    cost: 3,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/big-root.png",
    type: "held"
  },

  // === HELD ITEMS: UTILITY ===
  "EXP Share": {
    name: "EXP Share",
    desc: "สวมใส่: หากเทิร์นนี้ยูนิตไม่ได้สั่งเดินและไม่ได้สั่งโจมตีเลย → จบเทิร์นจะได้รับ EXP +1",
    category: "Utility",
    cost: 3,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/exp-share.png",
    type: "held"
  },
  "Lucky Egg": {
    name: "Lucky Egg",
    desc: "สวมใส่: เมื่อยูนิตนี้สามารถโจมตีกำจัดยูนิตศัตรูลงได้สำเร็จ → ได้รับโบนัส EXP +1",
    category: "Utility",
    cost: 4,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/lucky-egg.png",
    type: "held"
  },
  "Smoke Ball": {
    name: "Smoke Ball",
    desc: "สวมใส่: หลังจากโจมตีเสร็จสิ้น สามารถใช้คำสั่งเดินถอยหนี 1 ช่องได้ฟรีโดยไม่เสีย Energy",
    category: "Utility",
    cost: 3,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/smoke-ball.png",
    type: "held"
  },
  "Quick Claw": {
    name: "Quick Claw",
    desc: "สวมใส่: การสั่งเดินเคลื่อนที่ครั้งแรกสุดของเกมสำหรับยูนิตนี้ ค่า Energy Cost จะเป็น -1",
    category: "Utility",
    cost: 3,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/quick-claw.png",
    type: "held"
  },
  "Miracle Seed": {
    name: "Miracle Seed",
    desc: "สวมใส่: การกดใช้สคิล (Skill) แรกของแต่ละเทิร์น แต้มจ่าย Energy Cost จะลดลง 1",
    category: "Utility",
    cost: 4,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/miracle-seed.png",
    type: "held"
  },
  "Light Clay": {
    name: "Light Clay",
    desc: "สวมใส่: ระยะเวลาการกางโล่บาเรีย (Shield) หรือสถานะ Buff จะอยู่ยาวนานขึ้นอีก 1 turn",
    category: "Utility",
    cost: 3,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/light-clay.png",
    type: "held"
  },
  "Terrain Extender": {
    name: "Terrain Extender",
    desc: "สวมใส่: หากยูนิตนี้เปิดใช้งาน Field Effect หรือสภาพอากาศสำเร็จ → เพิ่มระยะเวลา 1 turn",
    category: "Utility",
    cost: 3,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/terrain-extender.png",
    type: "held"
  },
  "Destiny Knot": {
    name: "Destiny Knot",
    desc: "สวมใส่: เมื่อยูนิตนี้โดนโจมตีติดสถานะผิดปกติ → ศัตรูผู้ทำดาเมจจะติดสถานะนั้นด้วยทันที",
    category: "Utility",
    cost: 3,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/destiny-knot.png",
    type: "held"
  },
  "Safety Goggles": {
    name: "Safety Goggles",
    desc: "สวมใส่: ป้องกันความเสียหายจากพายุสภาพอากาศ (Field Effect) หรือโซนพิษอย่างสมบูรณ์",
    category: "Utility",
    cost: 2,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/safety-goggles.png",
    type: "held"
  },

  // === CONSUMABLES ===
  "Sitrus Berry": {
    name: "Sitrus Berry",
    desc: "กดใช้: ฟื้นฟู HP 2 แต้มทันทีให้กับยูนิตโปเกมอนฝั่งคุณที่เลือก",
    category: "Consumable",
    cost: 5,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/sitrus-berry.png",
    type: "consumable"
  },
  "Lum Berry": {
    name: "Lum Berry",
    desc: "กดใช้: ล้างสถานะผิดปกติร้ายแรงทั้งหมดออกจากตัวหมากทันที (1 ครั้ง)",
    category: "Consumable",
    cost: 4,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/lum-berry.png",
    type: "consumable"
  },
  "White Herb": {
    name: "White Herb",
    desc: "กดใช้: ล้างค่าดีบัฟติดลบ (Negative Modifiers) ทั้งหมดออกจากสเตตัสหมากให้เป็นศูนย์",
    category: "Consumable",
    cost: 2,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/white-herb.png",
    type: "consumable"
  },
  "Berry Juice": {
    name: "Berry Juice",
    desc: "กดใช้: เติมสารอาหารช่วยฟื้นฟูคืน HP 1 แต้มให้กับโปเกมอนที่ระบุ",
    category: "Consumable",
    cost: 3,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/berry-juice.png",
    type: "consumable"
  },
  "Mental Herb": {
    name: "Mental Herb",
    desc: "สวมใส่: ปลดสถานะผิดปกติจำพวกหยุดนิ่งข้ามเทิร์น หรืออาการมึนงงสับสน (Confusion) (ต้องสวมใส่ก่อนติดสถานะ)",
    category: "Consumable",
    cost: 3,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/mental-herb.png",
    type: "consumable"
  },
  "Power Herb": {
    name: "Power Herb",
    desc: "กดใช้: ร่ายมนตร์มอบบัฟเพิ่ม Atk Modifier +1 ให้กับยูนิตเป็นเวลา 1 เทิร์น",
    category: "Consumable",
    cost: 2,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/power-herb.png",
    type: "consumable"
  },
  "Cheri Berry": {
    name: "Cheri Berry",
    desc: "กดใช้/สวมใส่: ล้างสถานะอัมพาต (Paralysis) ทันที",
    category: "Consumable",
    cost: 2,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/cheri-berry.png",
    type: "consumable"
  },
  "Chesto Berry": {
    name: "Chesto Berry",
    desc: "กดใช้/สวมใส่: ล้างสถานะหลับ (Sleep) ทันที",
    category: "Consumable",
    cost: 2,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/chesto-berry.png",
    type: "consumable"
  },
  "Pecha Berry": {
    name: "Pecha Berry",
    desc: "กดใช้/สวมใส่: ล้างสถานะพิษ (Poison/Toxic) ทันที",
    category: "Consumable",
    cost: 2,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/pecha-berry.png",
    type: "consumable"
  },
  "Rawst Berry": {
    name: "Rawst Berry",
    desc: "กดใช้/สวมใส่: ล้างสถานะไฟไหม้ (Burn) ทันที",
    category: "Consumable",
    cost: 2,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/rawst-berry.png",
    type: "consumable"
  },
  "Aspear Berry": {
    name: "Aspear Berry",
    desc: "กดใช้/สวมใส่: ล้างสถานะแช่แข็ง (Freeze) ทันที",
    category: "Consumable",
    cost: 2,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/aspear-berry.png",
    type: "consumable"
  },
  "Persim Berry": {
    name: "Persim Berry",
    desc: "กดใช้/สวมใส่: ล้างสถานะสับสน (Confusion) ทันที",
    category: "Consumable",
    cost: 2,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/persim-berry.png",
    type: "consumable"
  },
  "Curry (Small)": {
    name: "Curry (Small)",
    desc: "กดใช้: เพิ่ม Max HP +1 และ Happiness +1 เป็นเวลา 2 เทิร์น (ไม่ซ้อนทับ)",
    category: "Consumable",
    cost: 6,
    img: "https://static.wikia.nocookie.net/pokemonwack/images/0/0f/2929MS.gif/revision/latest?cb=20240627025135",
    type: "consumable"
  },
  "Curry (Medium)": {
    name: "Curry (Medium)",
    desc: "กดใช้: เพิ่ม Max HP +2 และ Happiness +2 เป็นเวลา 3 เทิร์น (ไม่ซ้อนทับ)",
    category: "Consumable",
    cost: 8,
    img: "https://static.wikia.nocookie.net/pokemonwack/images/0/02/2930MS.gif/revision/latest?cb=20240627021757",
    type: "consumable"
  },
  "Curry (Big)": {
    name: "Curry (Big)",
    desc: "กดใช้: เพิ่ม Max HP +3 และ Happiness +3 เป็นเวลา 3 เทิร์น (ไม่ซ้อนทับ)",
    category: "Consumable",
    cost: 10,
    img: "https://static.wikia.nocookie.net/pokemonwack/images/3/34/2931MS.gif/revision/latest?cb=20240701213228",
    type: "consumable"
  },
  "Oval Stone": {
    name: "Oval Stone",
    desc: "สวมใส่: บล็อกการได้รับ EXP ทั้งหมดของยูนิตนี้ แต่จะได้รับ Happiness +1 เมื่อจบเทิร์น",
    category: "Utility",
    cost: 6,
    img: "https://play.pokemonshowdown.com/sprites/itemicons/oval-stone.png",
    type: "held"
  }
};

// Programmatically triple held item costs
Object.keys(ITEMS).forEach(key => {
  if (ITEMS[key].type === "held") {
    ITEMS[key].cost *= 3;
  }
});

