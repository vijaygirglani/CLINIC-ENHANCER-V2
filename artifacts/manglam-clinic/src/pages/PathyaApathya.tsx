import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Printer, Search, BookOpen } from "lucide-react";
import { format } from "date-fns";

type Lang = "gu" | "hi";

interface Disease {
  id: string;
  nameGu: string;
  nameHi: string;
  nameEn: string;
  causes: string[];
  pathya: { category: string; items: string[] }[];
  apathya: { category: string; items: string[] }[];
}

const diseases: Disease[] = [

  // ── PHASE 1 — DIGESTIVE DISORDERS ──────────────────────────────────────────

  {
    id: "amlapitta",
    nameGu: "અમ્લપિત્ત",
    nameHi: "अम्लपित्त",
    nameEn: "Hyperacidity / Acid Reflux",
    causes: ["Sour-spicy food / Khatu-tikhun", "Irregular meals", "Tea / Coffee / Alcohol", "Stress, anger", "Day sleep"],
    pathya: [
      { category: "Grains", items: ["Old rice (Juna Chaval), Wheat (Gehun), Barley (Jav)", "Moong dal"] },
      { category: "Vegetables", items: ["Bitter gourd (Karela), Parval, Tindora", "Bottle gourd (Lauki / Dudhi), Turai"] },
      { category: "Fruits", items: ["Pomegranate (Anar), Pear (Nashpati)", "Dates (Kharjur) — limited"] },
      { category: "Dairy", items: ["Cow milk (cold / thandu)", "Ghee (small quantity)"] },
      { category: "Drinks", items: ["Coconut water (Naryal pani)", "Fennel-Jeera water (Varyali-Jeeru)"] },
    ],
    apathya: [
      { category: "Grains", items: ["Maida (all-purpose flour)", "Urad dal"] },
      { category: "Fruits", items: ["Sour fruits — lemon (excess), tamarind (Imli)", "Mango in excess (Keri)"] },
      { category: "Drinks", items: ["Tea, Coffee, Alcohol", "Cold / fizzy beverages"] },
    ],
  },

  {
    id: "ajirna",
    nameGu: "અજીર્ણ / અપચ",
    nameHi: "अजीर्ण / अपच",
    nameEn: "Indigestion / Dyspepsia",
    causes: ["Eating too fast", "Overeating", "Irregular meal times", "Stress", "Cold drinks with food"],
    pathya: [
      { category: "Grains", items: ["Light moong-rice khichdi", "Moong dal soup (Paatlo ras)"] },
      { category: "Digestives", items: ["Ginger (Adrak)", "Warm water (Garam pani)", "Jeera water"] },
      { category: "Fruits", items: ["Papaya (Papita)", "Pomegranate (Anar)"] },
    ],
    apathya: [
      { category: "Food", items: ["Heavy meals", "Fried food, Maida"] },
      { category: "Drinks", items: ["Cold drinks", "Day sleep after meals"] },
    ],
  },

  {
    id: "vibandha",
    nameGu: "વિબન્ધ / કબ્જ",
    nameHi: "विबन्ध / कब्ज",
    nameEn: "Constipation",
    causes: ["Low water intake", "Low-fibre diet", "No exercise", "Suppressing urges", "Bakery food excess"],
    pathya: [
      { category: "Grains", items: ["Wheat roti with bran (Chokar)", "Barley (Jav)"] },
      { category: "Vegetables", items: ["Palak, Lauki (Dudhi)", "Papaya (Papita)"] },
      { category: "Fruits", items: ["Soaked fig (Anjeer)", "Soaked raisins (Kishmish)"] },
      { category: "Drinks", items: ["Warm water on empty stomach", "Ghee in warm milk at night"] },
    ],
    apathya: [
      { category: "Food", items: ["Maida (refined flour), Bakery food", "Fried / heavy food", "Dry food (Sukhu khavanu)"] },
      { category: "Drinks", items: ["Excess tea", "Cold / fizzy beverages"] },
    ],
  },

  {
    id: "atisara",
    nameGu: "અતિસાર / ઝાડા",
    nameHi: "अतिसार / दस्त",
    nameEn: "Diarrhea",
    causes: ["Contaminated food", "Street food", "Bacterial infection", "Oily food excess"],
    pathya: [
      { category: "Grains", items: ["Rice water (Chaval no Maad)", "Moong dal khichdi"] },
      { category: "Drinks", items: ["ORS solution", "Coconut water (Naryal pani)", "Thin buttermilk (Chaas)"] },
      { category: "Fruits", items: ["Pomegranate (Anar)", "Ripe banana (Paku Kela)"] },
    ],
    apathya: [
      { category: "Food", items: ["Oily food", "Street food", "Milk excess in acute phase"] },
      { category: "Fruits", items: ["Raw / unripe fruits", "Sour / acidic foods"] },
    ],
  },

  {
    id: "grahani",
    nameGu: "ગ્રહણી",
    nameHi: "ग्रहणी",
    nameEn: "IBS / Malabsorption",
    causes: ["Irregular meals", "Excess oil & spices", "Contaminated water", "Mental stress"],
    pathya: [
      { category: "Grains", items: ["Old rice (Juna Chaval)", "Thin moong dal, Daliya"] },
      { category: "Drinks", items: ["Thin buttermilk (Paatlu Chaas)", "Jeera water", "Coconut water"] },
      { category: "Fruits", items: ["Ripe banana (Paku kela)", "Apple (Safarzam)"] },
    ],
    apathya: [
      { category: "Food", items: ["Fried / heavy food", "Excess milk and curd", "Excess spicy food"] },
      { category: "Habits", items: ["Irregular meal times", "Raw / unripe fruits"] },
    ],
  },

  {
    id: "adhmana",
    nameGu: "ઉદર રોગ / ગેસ",
    nameHi: "उदर रोग / गैस",
    nameEn: "Bloating / Abdominal Gas",
    causes: ["Gas-forming foods", "Irregular eating", "Cold drinks", "Stress", "Constipation"],
    pathya: [
      { category: "Grains", items: ["Old rice (Juna Chaval)", "Moong dal, Barley (Jav)"] },
      { category: "Spices", items: ["Asafoetida (Hing)", "Carom seeds (Ajwain)", "Cumin (Jeera)"] },
      { category: "Drinks", items: ["Warm water throughout day", "Ajwain water (boiled)"] },
    ],
    apathya: [
      { category: "Food", items: ["Beans excess (Rajma, Chhole)", "Cauliflower (Phoolgobi)", "Urad dal"] },
      { category: "Drinks", items: ["Cold / fizzy beverages", "Excess milk"] },
    ],
  },

  {
    id: "arsha",
    nameGu: "અર્શ / હરસ",
    nameHi: "अर्श / बवासीर",
    nameEn: "Piles / Hemorrhoids",
    causes: ["Constipation (Kabajiyat)", "Spicy food", "Low water intake", "Prolonged sitting"],
    pathya: [
      { category: "Grains", items: ["Wheat roti with bran (Chokar waali roti)", "Barley (Jav), Daliya"] },
      { category: "Vegetables", items: ["Palak (Spinach), Lauki (Dudhi), Parval", "Papaya (Papita)"] },
      { category: "Fruits", items: ["Fig (Anjeer) — soaked", "Pomegranate (Anar)"] },
      { category: "Drinks", items: ["Lots of water (2–3 litres/day)", "Buttermilk (Chaas)"] },
    ],
    apathya: [
      { category: "Food", items: ["Spicy / chilli food", "Fried / oily food"] },
      { category: "Habits", items: ["Prolonged sitting", "Constipation"] },
    ],
  },

  // ── PHASE 1 — RESPIRATORY DISORDERS ────────────────────────────────────────

  {
    id: "kasa",
    nameGu: "કાસ / ઉધરસ",
    nameHi: "कास / खांसी",
    nameEn: "Cough",
    causes: ["Cold exposure", "Dust / smoke", "Dry air", "Throat infection"],
    pathya: [
      { category: "Herbs & Spices", items: ["Ginger (Adrak)", "Honey (Madhu)", "Turmeric milk (Haldi-Dudh)"] },
      { category: "Drinks", items: ["Warm water", "Tulsi tea"] },
    ],
    apathya: [
      { category: "Food", items: ["Ice cream", "Cold drinks", "Curd at night"] },
      { category: "Environment", items: ["Dust exposure", "Cold air / AC", "Smoking"] },
    ],
  },

  {
    id: "pratishyaya",
    nameGu: "પ્રતિશ્યાય / શરદી",
    nameHi: "प्रतिश्याय / जुकाम",
    nameEn: "Cold / Rhinitis",
    causes: ["Cold exposure", "Season change", "Dust / allergens", "Night awakening"],
    pathya: [
      { category: "Herbs", items: ["Tulsi tea (Tulsi chai)", "Steam inhalation"] },
      { category: "Drinks", items: ["Warm water", "Ginger-honey tea"] },
    ],
    apathya: [
      { category: "Food", items: ["Cold foods", "Ice cream", "Cold drinks"] },
      { category: "Habits", items: ["Night awakening", "Cold water bath", "Dust exposure"] },
    ],
  },

  {
    id: "shwasa",
    nameGu: "શ્વાસ / દમ",
    nameHi: "श्वास / अस्थमा",
    nameEn: "Asthma",
    causes: ["Dust", "Allergens", "Cold foods", "Smoking", "Stress"],
    pathya: [
      { category: "Food", items: ["Warm water", "Ginger (Adrak)", "Light meals", "Honey (Madhu)"] },
      { category: "Lifestyle", items: ["Breathing exercises (Pranayama)", "Warm environment"] },
    ],
    apathya: [
      { category: "Food", items: ["Cold foods", "Curd", "Fried food", "Excess salt"] },
      { category: "Environment", items: ["Dust", "Smoking", "Cold air", "Flowers / strong fragrance"] },
    ],
  },

  // ── PHASE 1 — METABOLIC DISORDERS ──────────────────────────────────────────

  {
    id: "madhumeha",
    nameGu: "મધુમેહ (Diabetes)",
    nameHi: "मधुमेह (Diabetes)",
    nameEn: "Diabetes / Madhumeha",
    causes: ["Excess sugar / sweets", "No exercise", "Genetic (hereditary)", "Stress", "Obesity"],
    pathya: [
      { category: "Grains", items: ["Barley (Jav), Bajra, Ragi (Finger millet)", "Moong dal"] },
      { category: "Vegetables", items: ["Bitter gourd (Karela)", "Fenugreek (Methi)", "Spinach (Palak)"] },
      { category: "Fruits", items: ["Indian plum (Jamun)", "Gooseberry (Amla)"] },
      { category: "Lifestyle", items: ["Walking (Chalvu)", "Soaked Methi seeds morning"] },
    ],
    apathya: [
      { category: "Food", items: ["Sugar (Shakkar), Sweets / Mithai", "Potato (Batata), Rice in excess"] },
      { category: "Fruits", items: ["Mango (Keri), Banana (Kela)", "Grapes (Draksh), Chiku"] },
      { category: "Habits", items: ["Day sleep", "Sedentary lifestyle"] },
    ],
  },

  {
    id: "sthoulya",
    nameGu: "સ્થૌલ્ય / જાડાપણ",
    nameHi: "स्थौल्य / मोटापा",
    nameEn: "Obesity",
    causes: ["Excess sweets & fried food", "No exercise", "Day sleep", "Excess eating"],
    pathya: [
      { category: "Grains", items: ["Barley (Jav)", "Old rice"] },
      { category: "Drinks", items: ["Honey water (Madhu-pani)", "Warm lemon water morning"] },
      { category: "Vegetables", items: ["Green vegetables", "Bitter gourd (Karela)"] },
      { category: "Lifestyle", items: ["Regular exercise", "Walking daily"] },
    ],
    apathya: [
      { category: "Food", items: ["Fried foods", "Sweets / Mithai", "Excess oil"] },
      { category: "Habits", items: ["Day sleep", "Sedentary lifestyle", "Overeating"] },
    ],
  },

  {
    id: "hypertension",
    nameGu: "ઉચ્ચ રક્તચાપ (High BP)",
    nameHi: "उच्च रक्तचाप (High BP)",
    nameEn: "Hypertension / High B.P.",
    causes: ["Excess salt (Mith)", "Fried / oily food", "Stress", "Obesity", "Smoking"],
    pathya: [
      { category: "Grains", items: ["Barley (Jav), Oats", "Wheat with bran (Chokar)"] },
      { category: "Vegetables", items: ["Spinach (Palak), Beetroot", "Garlic (Lasun)", "Low salt diet"] },
      { category: "Fruits", items: ["Banana (Kela), Watermelon (Tarbuj)", "Pomegranate (Anar)"] },
      { category: "Drinks", items: ["Coconut water (Naryal pani)"] },
      { category: "Lifestyle", items: ["Meditation (Dhyan)", "Walking daily"] },
    ],
    apathya: [
      { category: "Food", items: ["Excess salt (Vadhu Mith)", "Pickles (Achar), Papad", "Fried / oily food"] },
      { category: "Drinks", items: ["Alcohol, excess Tea-Coffee", "Cold / fizzy beverages"] },
      { category: "Habits", items: ["Stress", "Smoking"] },
    ],
  },

  // ── PHASE 1 — JOINT & PAIN DISORDERS ───────────────────────────────────────

  {
    id: "sandhivata",
    nameGu: "સંધિવાત (Joint Pain)",
    nameHi: "संधिवात / जोड़ों का दर्द",
    nameEn: "Osteoarthritis / Joint Pain",
    causes: ["Cold-natured foods", "Gas-forming diet", "Old age", "Urad dal excess"],
    pathya: [
      { category: "Food", items: ["Sesame (Tal)", "Methi seeds", "Warm food", "Ghee"] },
      { category: "Oils", items: ["Sesame oil massage", "Castor oil (under supervision)"] },
      { category: "Lifestyle", items: ["Gentle exercise", "Warm environment"] },
    ],
    apathya: [
      { category: "Food", items: ["Cold water (Thandu Paani)", "Curd at night", "Urad dal, Rajma"] },
      { category: "Habits", items: ["Excess walking (acute phase)", "Cold exposure"] },
    ],
  },

  {
    id: "amavata",
    nameGu: "આમવાત (RA)",
    nameHi: "आमवात (RA)",
    nameEn: "Rheumatoid Arthritis",
    causes: ["Ama (toxins) accumulation", "Irregular diet", "Curd / sour food excess", "Cold damp environment"],
    pathya: [
      { category: "Food", items: ["Dry ginger (Sunthi)", "Warm water", "Light meals", "Methi"] },
      { category: "Oils", items: ["Castor oil (under supervision)", "Warm oil massage"] },
    ],
    apathya: [
      { category: "Food", items: ["Curd (Dahi)", "Heavy meals", "Urad dal", "Fried food"] },
      { category: "Habits", items: ["Day sleep", "Cold water / cold exposure"] },
    ],
  },

  {
    id: "katishoola",
    nameGu: "કટિશૂળ (Back Pain)",
    nameHi: "कटिशूल / कमर दर्द",
    nameEn: "Low Back Pain",
    causes: ["Heavy lifting", "Prolonged sitting", "Cold exposure", "Wrong posture", "Vata aggravation"],
    pathya: [
      { category: "Food", items: ["Warm food", "Ghee", "Sesame (Tal)"] },
      { category: "Therapy", items: ["Oil massage (Abhyanga)", "Warm compress"] },
      { category: "Lifestyle", items: ["Yoga", "Proper rest"] },
    ],
    apathya: [
      { category: "Food", items: ["Cold / refrigerated food", "Excess dry food"] },
      { category: "Habits", items: ["Heavy lifting", "Long sitting", "Cold water bath", "Wrong posture"] },
    ],
  },

  // ── PHASE 2 — SKIN DISORDERS ────────────────────────────────────────────────

  {
    id: "dadru",
    nameGu: "દાદ (Fungal)",
    nameHi: "दाद",
    nameEn: "Dadru / Fungal Infection",
    causes: ["Excessive sweating", "Warm moist environment", "Synthetic clothing", "Low immunity"],
    pathya: [
      { category: "Herbs & Food", items: ["Neem (Limdo)", "Turmeric (Haldi)", "Light diet"] },
      { category: "Lifestyle", items: ["Keep skin dry", "Cotton clothes", "Personal hygiene"] },
    ],
    apathya: [
      { category: "Food", items: ["Excess sweets (Vadhu Mithai)", "Oily food (Teliyu khavanu)"] },
      { category: "Habits", items: ["Sweating without cleaning", "Synthetic clothing", "Sharing towels"] },
    ],
  },

  {
    id: "vicharchika",
    nameGu: "વિચર્ચિકા (Eczema)",
    nameHi: "विचर्चिका / एक्जिमा",
    nameEn: "Vicharchika / Eczema",
    causes: ["Allergic reaction", "Stress", "Synthetic detergents", "Fish with milk combination"],
    pathya: [
      { category: "Vegetables", items: ["Bitter vegetables (Tikha shak)", "Neem (Limdo)"] },
      { category: "Grains", items: ["Old grains (Juna anaj)"] },
      { category: "Drinks", items: ["Adequate hydration (Purtu paani)"] },
    ],
    apathya: [
      { category: "Food", items: ["Curd (Dahi)", "Fish with milk (Incompatible combination)", "Junk food"] },
      { category: "Habits", items: ["Stress", "Chemical soaps / detergents"] },
    ],
  },

  {
    id: "kitibha",
    nameGu: "સોરાયસિસ",
    nameHi: "सोरायसिस / किटिभ",
    nameEn: "Kitibha / Psoriasis",
    causes: ["Stress", "Alcohol", "Wrong food combinations", "Genetic factors"],
    pathya: [
      { category: "Herbs", items: ["Neem (Limdo)", "Bitter gourd (Karela)", "Triphala"] },
      { category: "Lifestyle", items: ["Meditation (Dhyan)", "Stress reduction"] },
    ],
    apathya: [
      { category: "Food", items: ["Non-veg excess (Mangsahar vadhu)", "Alcohol (Daaru)", "Junk food"] },
      { category: "Habits", items: ["Stress (Tanav)", "Smoking"] },
    ],
  },

  {
    id: "yauvana-pidika",
    nameGu: "ખીલ (Acne)",
    nameHi: "यौवन पिडिका / मुंहासे",
    nameEn: "Yauvana Pidika / Acne",
    causes: ["Hormonal imbalance", "Oily food", "Late nights", "Constipation"],
    pathya: [
      { category: "Food", items: ["Fruits (Fal)", "Green vegetables (Lila shak)", "Neem"] },
      { category: "Lifestyle", items: ["Adequate sleep (Purti ughh)", "Face hygiene", "Stress reduction"] },
    ],
    apathya: [
      { category: "Food", items: ["Fried foods (Talelu)", "Chocolate excess", "Junk food"] },
      { category: "Habits", items: ["Late nights (Mode sudhi jagvu)", "Constipation"] },
    ],
  },

  {
    id: "sheetapitta",
    nameGu: "શીતપિત્ત (Urticaria)",
    nameHi: "शीतपित्त / पित्ती",
    nameEn: "Sheetapitta / Urticaria",
    causes: ["Allergic food", "Excess spicy food", "Cold exposure", "Seafood"],
    pathya: [
      { category: "Food", items: ["Coriander water (Dhana paani)", "Ghee", "Cooling diet", "Coconut water"] },
    ],
    apathya: [
      { category: "Food", items: ["Seafood (Samudri khorak)", "Fermented food (Khatu khavanu)", "Excess spicy food"] },
      { category: "Habits", items: ["Cold exposure", "Stress"] },
    ],
  },

  {
    id: "khalitya",
    nameGu: "વાળ ખરવા (Hair Fall)",
    nameHi: "खालित्य / बाल झड़ना",
    nameEn: "Khalitya / Hair Fall",
    causes: ["Stress", "Nutritional deficiency", "Junk food", "Sleep deprivation"],
    pathya: [
      { category: "Food", items: ["Amla (Aamla)", "Sesame (Tal)", "Milk (Dudh)", "Almonds"] },
      { category: "Lifestyle", items: ["Stress reduction (Tanav occho)", "Scalp oil massage"] },
    ],
    apathya: [
      { category: "Food", items: ["Junk food", "Excess salt / spice"] },
      { category: "Habits", items: ["Stress (Tanav)", "Sleep deprivation (Ochi ughh)", "Chemical hair products"] },
    ],
  },

  // ── PHASE 2 — WOMEN'S HEALTH ────────────────────────────────────────────────

  {
    id: "kashtartava",
    nameGu: "માસિક દુઃખાવો",
    nameHi: "कष्टार्तव / मासिक दर्द",
    nameEn: "Kashtartava / Painful Menses",
    causes: ["Vata imbalance", "Cold food excess", "Stress", "Sedentary lifestyle"],
    pathya: [
      { category: "Food", items: ["Warm water (Garam paani)", "Ajwain (Ajmo)", "Rest (Aaram)", "Light food"] },
      { category: "Lifestyle", items: ["Heat compress on lower abdomen", "Light yoga"] },
    ],
    apathya: [
      { category: "Food", items: ["Cold foods (Thandu khavanu)", "Excess exercise during period"] },
      { category: "Habits", items: ["Stress (Tanav)", "Cold water bath during periods"] },
    ],
  },

  {
    id: "pcod",
    nameGu: "પીસીઓડી / PCOS",
    nameHi: "पीसीओडी / PCOS",
    nameEn: "PCOD / PCOS",
    causes: ["Hormonal imbalance", "Sedentary lifestyle", "Junk food", "Insulin resistance"],
    pathya: [
      { category: "Food", items: ["Barley (Jav)", "Green vegetables (Lila shak)", "Weight control"] },
      { category: "Lifestyle", items: ["Regular exercise (Kasrat)", "Yoga", "Stress management"] },
    ],
    apathya: [
      { category: "Food", items: ["Junk food", "Sugar excess (Vadhu Khandi)", "Fried food"] },
      { category: "Habits", items: ["Sedentary lifestyle (Kasratno abhav)", "Irregular sleep"] },
    ],
  },

  {
    id: "shweta-pradara",
    nameGu: "સફેદ પાણી (Leucorrhea)",
    nameHi: "श्वेत प्रदर / सफेद पानी",
    nameEn: "Shweta Pradara / Leucorrhea",
    causes: ["Poor hygiene", "Excess spicy food", "Hormonal imbalance", "Weakness"],
    pathya: [
      { category: "Food", items: ["Pomegranate (Dadam)", "Rice (Chokhaa)", "Buttermilk (Chaas)"] },
      { category: "Lifestyle", items: ["Proper hygiene (Svacchhata)", "Cotton innerwear"] },
    ],
    apathya: [
      { category: "Food", items: ["Excess spicy food (Vadhu tikhhu)", "Junk food"] },
      { category: "Habits", items: ["Poor hygiene (Asvachchhata)", "Synthetic clothing"] },
    ],
  },

  // ── PHASE 2 — CHILD HEALTH ──────────────────────────────────────────────────

  {
    id: "bal-shardi",
    nameGu: "બાળકોમાં વારંવાર શરદી",
    nameHi: "बच्चों में बार-बार जुकाम",
    nameEn: "Recurrent Cold in Children",
    causes: ["Low immunity", "Cold drinks excess", "Dust exposure", "No Suvarnaprashan"],
    pathya: [
      { category: "Food", items: ["Suvarnaprashan (immunity booster)", "Warm water", "Tulsi (Holy basil)"] },
      { category: "Nutrition", items: ["Nutritious food (Paushtik aahar)", "Ghee", "Turmeric milk"] },
    ],
    apathya: [
      { category: "Food", items: ["Ice cream", "Cold drinks (Thanda peyna)", "Refrigerated food"] },
      { category: "Environment", items: ["Dust exposure (Dhul)", "AC excess", "Cold water bath"] },
    ],
  },

  // ── PHASE 2 — URINARY DISORDERS ────────────────────────────────────────────

  {
    id: "mutrakriccha",
    nameGu: "મૂત્રમાં દાઝ",
    nameHi: "मूत्रकृच्छ / पेशाब में जलन",
    nameEn: "Mutrakriccha / Burning Urination",
    causes: ["Dehydration", "Spicy food excess", "UTI", "Heat (Pitta)"],
    pathya: [
      { category: "Drinks", items: ["Coconut water (Naaliyer paani)", "Coriander water (Dhana paani)", "Plenty of fluids"] },
    ],
    apathya: [
      { category: "Food", items: ["Spicy food (Tikhu khavanu)", "Excess salt"] },
      { category: "Habits", items: ["Dehydration (Paani ochi pivu)", "Holding urine"] },
    ],
  },

  {
    id: "ashmari",
    nameGu: "પથરી (Kidney Stones)",
    nameHi: "अश्मरी / पथरी",
    nameEn: "Ashmari / Kidney Stones",
    causes: ["Dehydration", "Excess salt", "High oxalate diet", "Junk food"],
    pathya: [
      { category: "Drinks", items: ["Coconut water (Naaliyer paani)", "Barley water (Javnu paani)", "Lemon water (Limbu paani)"] },
      { category: "Lifestyle", items: ["3–4 litres water daily"] },
    ],
    apathya: [
      { category: "Food", items: ["Dehydration (Paani ochi pivu)", "Excess salt (Vadhu Mith)", "Junk food"] },
      { category: "Food", items: ["Excess spinach (Oxalate)", "Tomato excess"] },
    ],
  },

  // ── PHASE 2 — ENT & HEAD DISORDERS ─────────────────────────────────────────

  {
    id: "migraine",
    nameGu: "આધાશીશી (Migraine)",
    nameHi: "माइग्रेन / अर्धावभेदक",
    nameEn: "Migraine / Ardhavabhedaka",
    causes: ["Stress", "Fasting (Upvas)", "Excess screen time", "Sleep disruption", "Strong smells"],
    pathya: [
      { category: "Food", items: ["Cow ghee (Gay nu ghee)", "Light diet"] },
      { category: "Lifestyle", items: ["Adequate sleep (Purti ughh)", "Meditation (Dhyan)", "Stress reduction"] },
    ],
    apathya: [
      { category: "Food", items: ["Fasting (Upvas)", "Excess tea / coffee", "Junk food"] },
      { category: "Habits", items: ["Stress (Tanav)", "Excess screen time (Vadhu mobile)", "Irregular sleep"] },
    ],
  },

  {
    id: "mukha-paka",
    nameGu: "મોઢાના છાલા",
    nameHi: "मुखपाक / मुंह के छाले",
    nameEn: "Mouth Ulcers / Mukhapaka",
    causes: ["Excess spicy food", "Vitamin deficiency", "Stress", "Tobacco"],
    pathya: [
      { category: "Food", items: ["Ghee (Ghee)", "Coconut water (Naaliyer paani)", "Soft food (Naram khorak)"] },
    ],
    apathya: [
      { category: "Food", items: ["Spicy food (Tikhu khavanu)", "Hot food (Garam khorak)", "Fried food"] },
      { category: "Habits", items: ["Tobacco (Tamaku)", "Stress"] },
    ],
  },

  {
    id: "sinusitis",
    nameGu: "સાઈનસ",
    nameHi: "साइनसाइटिस / दुष्ट प्रतिश्याय",
    nameEn: "Sinusitis / Dushta Pratishyaya",
    causes: ["Cold exposure", "Dust allergy", "Pollution", "Kapha imbalance"],
    pathya: [
      { category: "Therapy", items: ["Steam inhalation (Varal)", "Nasya (Nasal oil drops)"] },
      { category: "Food", items: ["Warm water (Garam paani)", "Ginger tea", "Turmeric"] },
    ],
    apathya: [
      { category: "Food", items: ["Ice cream", "Cold foods (Thandu)", "Curd"] },
      { category: "Environment", items: ["Dust (Dhul)", "Cold exposure (Thandi)", "AC excess"] },
    ],
  },

  // ── PHASE 3 — LIVER & DIGESTIVE-METABOLIC ──────────────────────────────────

  {
    id: "fatty-liver",
    nameGu: "ફેટી લીવર",
    nameHi: "फैटी लिवर",
    nameEn: "Fatty Liver",
    causes: ["Alcohol", "Excess fried / sugar food", "Obesity", "Sedentary lifestyle"],
    pathya: [
      { category: "Food", items: ["Barley (Jav)", "Green vegetables (Lila shak)", "Bitter gourd (Karela)"] },
      { category: "Drinks", items: ["Warm water (Garam paani)"] },
      { category: "Lifestyle", items: ["Walking (Chalvu)", "Exercise"] },
    ],
    apathya: [
      { category: "Food", items: ["Alcohol (Daaru)", "Fried foods (Talelu)", "Sugar excess (Vadhu Khandi)"] },
      { category: "Habits", items: ["Day sleep (Divasni ughh)", "Sedentary lifestyle"] },
    ],
  },

  {
    id: "kamala",
    nameGu: "કામળો (Jaundice)",
    nameHi: "कामला / पीलिया",
    nameEn: "Kamala / Jaundice",
    causes: ["Liver infection", "Contaminated water", "Alcohol", "Heavy meals"],
    pathya: [
      { category: "Drinks", items: ["Sugarcane juice (Sheradino ras)", "Coconut water (Naaliyer paani)"] },
      { category: "Food", items: ["Moong soup (Magne soup)", "Rest (Aaram)"] },
    ],
    apathya: [
      { category: "Food", items: ["Oily food (Teliyu khavanu)", "Alcohol (Daaru)", "Heavy meals (Bhaare bhajan)"] },
    ],
  },

  {
    id: "pandu",
    nameGu: "પાંડુ / લોહીની ઉણપ",
    nameHi: "पांडु / खून की कमी",
    nameEn: "Pandu / Anemia",
    causes: ["Iron deficiency", "Excess fasting", "Junk food", "Malabsorption"],
    pathya: [
      { category: "Fruits", items: ["Pomegranate (Dadam)", "Dates (Khajur)", "Gooseberry (Amla)"] },
      { category: "Vegetables", items: ["Beetroot (Bit)", "Green vegetables"] },
    ],
    apathya: [
      { category: "Food", items: ["Junk food", "Excess fasting (Vadhu upvas)"] },
      { category: "Habits", items: ["Tea with meals (reduces iron absorption)"] },
    ],
  },

  // ── PHASE 3 — THYROID & HORMONAL ───────────────────────────────────────────

  {
    id: "hypothyroidism",
    nameGu: "થાઈરોઈડ ઓછું",
    nameHi: "हाइपोथायरॉइड",
    nameEn: "Hypothyroidism",
    causes: ["Kapha imbalance", "Sedentary lifestyle", "Iodine deficiency", "Stress"],
    pathya: [
      { category: "Food", items: ["Exercise (Kasrat)", "Warm water (Garam paani)", "Light meals (Halkho khorak)", "Millets (Millets)"] },
    ],
    apathya: [
      { category: "Food", items: ["Heavy meals (Bhaare bhajan)", "Excess soy products"] },
      { category: "Habits", items: ["Day sleep (Divasni ughh)", "Sedentary lifestyle (Kasratno abhav)"] },
    ],
  },

  // ── PHASE 3 — MENTAL & LIFESTYLE DISORDERS ─────────────────────────────────

  {
    id: "nidranasha",
    nameGu: "નિંદ્રાનાશ (Insomnia)",
    nameHi: "निद्रानाश / अनिद्रा",
    nameEn: "Nidranasha / Insomnia",
    causes: ["Stress", "Excess mobile use", "Tea-Coffee at night", "Vata imbalance"],
    pathya: [
      { category: "Food", items: ["Warm milk (Garam dudh)", "Ghee"] },
      { category: "Therapy", items: ["Head oil massage (Shiro abhyanga)", "Foot massage"] },
      { category: "Lifestyle", items: ["Meditation (Dhyan)", "Early sleep (Vaheli ughh)"] },
    ],
    apathya: [
      { category: "Habits", items: ["Excess mobile use (Vadhu mobile)", "Tea-Coffee at night", "Stress (Tanav)"] },
    ],
  },

  {
    id: "chinta",
    nameGu: "ચિંતા (Anxiety)",
    nameHi: "चिंता / एंग्जायटी",
    nameEn: "Chinta / Anxiety",
    causes: ["Overthinking", "Sleep deprivation", "Stress", "Vata imbalance"],
    pathya: [
      { category: "Herbs", items: ["Brahmi (Brahmi)", "Ashwagandha"] },
      { category: "Lifestyle", items: ["Meditation (Dhyan)", "Pranayama (Pranayam)", "Proper sleep (Purti ughh)"] },
    ],
    apathya: [
      { category: "Habits", items: ["Overthinking (Vadhu vichar)", "Sleep deprivation (Ochi ughh)", "Stress (Tanav)"] },
    ],
  },

  {
    id: "depression",
    nameGu: "ઉદાસીનતા (Depression)",
    nameHi: "अवसाद / डिप्रेशन",
    nameEn: "Depression Supportive Care",
    causes: ["Isolation", "Irregular routine", "Alcohol", "Grief / trauma"],
    pathya: [
      { category: "Food", items: ["Nutritious food (Paushtik aahar)", "Ghee", "Almonds"] },
      { category: "Lifestyle", items: ["Counseling (Counseling)", "Yoga", "Meditation (Dhyan)"] },
    ],
    apathya: [
      { category: "Habits", items: ["Isolation (Ekalataa)", "Alcohol (Daaru)", "Irregular routine (Aniyamit dincharya)"] },
    ],
  },

  // ── PHASE 3 — SEXUAL & REPRODUCTIVE ────────────────────────────────────────

  {
    id: "shukra-kshaya",
    nameGu: "શુક્ર ક્ષય",
    nameHi: "शुक्र क्षय",
    nameEn: "Shukra Kshaya / Low Semen Vitality",
    causes: ["Stress", "Excess sexual activity", "Night awakening", "Junk food"],
    pathya: [
      { category: "Food", items: ["Milk (Dudh)", "Ghee", "Almonds (Badam)", "Ashwagandha"] },
    ],
    apathya: [
      { category: "Habits", items: ["Stress (Tanav)", "Excess sexual activity (Vadhu sambhog)", "Night awakening"] },
    ],
  },

  {
    id: "erectile-dysfunction",
    nameGu: "નપુંસકતા",
    nameHi: "नपुंसकता / इरेक्टाइल डिसफंक्शन",
    nameEn: "Erectile Dysfunction",
    causes: ["Stress", "Alcohol", "Smoking", "Diabetes", "Vata imbalance"],
    pathya: [
      { category: "Food", items: ["Ashwagandha", "Milk (Dudh)", "Ghee", "Shatavari"] },
      { category: "Lifestyle", items: ["Healthy sleep (Sari ughh)", "Yoga"] },
    ],
    apathya: [
      { category: "Habits", items: ["Smoking (Dhumrapan)", "Alcohol (Daaru)", "Stress (Tanav)"] },
    ],
  },

  // ── PHASE 3 — EYE DISORDERS ─────────────────────────────────────────────────

  {
    id: "eye-strain",
    nameGu: "આંખનો થાક",
    nameHi: "आंखों की थकान",
    nameEn: "Eye Strain / Akshi Roga",
    causes: ["Excess screen time", "Night awakening", "Pitta imbalance", "Vitamin A deficiency"],
    pathya: [
      { category: "Therapy", items: ["Triphala eye wash (Triphala dhovan)", "Eye exercises (Ankh kasrat)"] },
      { category: "Lifestyle", items: ["Proper sleep (Purti ughh)", "Screen breaks every 20 min"] },
    ],
    apathya: [
      { category: "Habits", items: ["Excess screen time (Vadhu mobile)", "Night awakening (Mode jagvu)"] },
    ],
  },

  {
    id: "conjunctivitis",
    nameGu: "આંખ આવવી",
    nameHi: "आंख आना / नेत्राभिष्यंद",
    nameEn: "Conjunctivitis",
    causes: ["Eye infection", "Dust exposure", "Eye rubbing", "Contaminated hands"],
    pathya: [
      { category: "Therapy", items: ["Eye hygiene (Ankh svacchhata)", "Cold compress (Thandi patti)", "Rest (Aaram)"] },
    ],
    apathya: [
      { category: "Habits", items: ["Dust exposure (Dhul)", "Eye rubbing (Ankh ghosvu)", "Sharing eye drops"] },
    ],
  },

  // ── PHASE 3 — PANCHAKARMA PATHYA ───────────────────────────────────────────

  {
    id: "vamana-pathya",
    nameGu: "વમન પ્રક્રિયા પછી",
    nameHi: "वमन पथ्य (Vamana post-diet)",
    nameEn: "Vamana Pathya (Post Vamana Diet)",
    causes: ["Post Panchakarma recovery", "Kapha detox", "Digestive reset"],
    pathya: [
      { category: "Food", items: ["Thin rice gruel (Patli khichdi)", "Moong soup (Magne soup)", "Light diet (Halkho khorak)"] },
    ],
    apathya: [
      { category: "Food", items: ["Heavy food (Bhaaru bhajan)", "Fried food (Talelu)", "Cold water (Thandu paani)"] },
    ],
  },

  // ── PHASE 3 — SEASONAL (RITUCHARYA) ────────────────────────────────────────

  {
    id: "summer-ritucharya",
    nameGu: "ઉનાળુ ઋતુચર્યા",
    nameHi: "ग्रीष्म ऋतुचर्या (Summer Diet)",
    nameEn: "Summer Ritucharya Diet",
    causes: ["Pitta aggravation in summer", "Dehydration risk", "Excess sun exposure"],
    pathya: [
      { category: "Drinks", items: ["Coconut water (Naaliyer paani)", "Buttermilk (Chaas)", "Rose water (Gulab jal)"] },
      { category: "Fruits", items: ["Watermelon (Tarbuj)", "Mango (in moderation)"] },
      { category: "Food", items: ["Light food (Halkho khorak)", "Cooling diet"] },
    ],
    apathya: [
      { category: "Habits", items: ["Excess sun exposure (Vadhu tado)", "Dehydration (Paani ochi pivu)"] },
      { category: "Food", items: ["Spicy foods (Tikhu khavanu)", "Fried food"] },
    ],
  },

  {
    id: "winter-ritucharya",
    nameGu: "શિયાળુ ઋતુચર્યા",
    nameHi: "शीत ऋतुचर्या (Winter Diet)",
    nameEn: "Winter Ritucharya Diet",
    causes: ["Vata aggravation in winter", "Dry cold air", "Reduced digestion (Agni)"],
    pathya: [
      { category: "Food", items: ["Ghee (Ghee)", "Sesame (Tal)", "Warm food (Garam khorak)"] },
      { category: "Lifestyle", items: ["Exercise (Kasrat)", "Oil massage (Abhyanga)", "Warm bath"] },
    ],
    apathya: [
      { category: "Habits", items: ["Cold exposure (Thandi)", "Excess fasting (Vadhu upvas)"] },
    ],
  },

  // ── PHASE 3 — GERIATRIC ─────────────────────────────────────────────────────

  {
    id: "memory-weakness",
    nameGu: "યાદશક્તિ ઓછી",
    nameHi: "स्मृतिदौर्बल्य / याददाश्त कमजोर",
    nameEn: "Memory Weakness / Smriti Daurbalya",
    causes: ["Stress", "Sleep deprivation", "Excess screen time", "Vata imbalance"],
    pathya: [
      { category: "Herbs", items: ["Brahmi (Brahmi)", "Almonds (Badam)", "Ashwagandha"] },
      { category: "Lifestyle", items: ["Meditation (Dhyan)", "Proper sleep (Purti ughh)"] },
    ],
    apathya: [
      { category: "Habits", items: ["Stress (Tanav)", "Sleep deprivation (Ochi ughh)", "Excess screen time (Vadhu mobile)"] },
    ],
  },

];

function printPathya() {
  const el = document.getElementById("print-pathya");
  if (!el) return;
  el.style.display = "block";
  window.print();
  el.style.display = "none";
}

export default function PathyaApathya() {
  const [lang, setLang] = useState<Lang>("hi");
  const [patientName, setPatientName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Disease>(diseases[0]);

  const filtered = diseases.filter(d =>
    d.nameGu.toLowerCase().includes(search.toLowerCase()) ||
    d.nameHi.toLowerCase().includes(search.toLowerCase()) ||
    d.nameEn.toLowerCase().includes(search.toLowerCase())
  );

  const diseaseName = lang === "gu" ? selected.nameGu : selected.nameHi;
  const today = format(new Date(), "dd/MM/yyyy");

  const pathyaTitle = lang === "gu" ? "પથ્ય — શું ખાવું" : "पथ्य — क्या खाएं";
  const apathyaTitle = lang === "gu" ? "અ.પ — શું ન ખાવું" : "अपथ्य — क्या न खाएं";
  const causesTitle = lang === "gu" ? "કારણો (Nidana)" : "कारण (Nidana)";

  return (
    <Layout>
      {/* Print area */}
      <div
        id="print-pathya"
        style={{ display: "none", fontFamily: "Arial, sans-serif", fontSize: "13px", padding: "20px", maxWidth: "720px", margin: "0 auto" }}
      >
        <table style={{ width: "100%", borderBottom: "3px double #2d6a4f", paddingBottom: "8px", marginBottom: "12px" }}>
          <tbody>
            <tr>
              <td>
                <div style={{ fontSize: "18px", fontWeight: "900", color: "#2d6a4f" }}>Manglam Skin Care Clinic</div>
                <div style={{ fontSize: "11px", color: "#666" }}>Ayurvedic Dietary Guidelines — Pathya-Apathya</div>
              </td>
              <td style={{ textAlign: "right", verticalAlign: "top" }}>
                <div style={{ fontWeight: "bold" }}>Dr. Vijay Girglani</div>
                <div style={{ fontSize: "11px" }}>B.A.M.S., C.S.D. (Skin)</div>
                <div style={{ fontSize: "11px" }}>Reg. No. GBI 17318</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ background: "#2d6a4f", color: "#fff", padding: "8px 14px", borderRadius: "6px", marginBottom: "10px", display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: "bold" }}>{diseaseName}</div>
            <div style={{ fontSize: "11px", opacity: 0.85 }}>{selected.nameEn}</div>
          </div>
          <div style={{ fontSize: "12px", textAlign: "right" }}>
            {patientName && <div>Patient: {patientName}</div>}
            <div>Date: {today}</div>
          </div>
        </div>

        <div style={{ marginBottom: "10px", padding: "8px 12px", background: "#fff3cd", borderRadius: "6px" }}>
          <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "4px" }}>Causes (Nidana)</div>
          <div>
            {selected.causes.map((c, i) => (
              <span key={i} style={{ background: "#ffc107", color: "#000", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", marginRight: "6px", display: "inline-block", marginBottom: "4px" }}>{c}</span>
            ))}
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ background: "#d1fae5", padding: "8px", border: "1px solid #a7f3d0", width: "50%" }}>
                ✅ Pathya (What to eat)
              </th>
              <th style={{ background: "#fee2e2", padding: "8px", border: "1px solid #fca5a5", width: "50%" }}>
                ❌ Apathya (What to avoid)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ verticalAlign: "top", padding: "10px", border: "1px solid #d1fae5" }}>
                {selected.pathya.map((s, i) => (
                  <div key={i} style={{ marginBottom: "8px" }}>
                    <div style={{ fontWeight: "bold", fontSize: "11px", color: "#065f46" }}>{s.category}</div>
                    {s.items.map((item, j) => <div key={j} style={{ fontSize: "12px" }}>• {item}</div>)}
                  </div>
                ))}
              </td>
              <td style={{ verticalAlign: "top", padding: "10px", border: "1px solid #fee2e2" }}>
                {selected.apathya.map((s, i) => (
                  <div key={i} style={{ marginBottom: "8px" }}>
                    <div style={{ fontWeight: "bold", fontSize: "11px", color: "#991b1b" }}>{s.category}</div>
                    {s.items.map((item, j) => <div key={j} style={{ fontSize: "12px" }}>• {item}</div>)}
                  </div>
                ))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Main UI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="medical-card p-4 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Language</p>
            <div className="flex gap-2">
              <button
                onClick={() => setLang("hi")}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${lang === "hi" ? "bg-amber-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                हि — Hindi
              </button>
              <button
                onClick={() => setLang("gu")}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${lang === "gu" ? "bg-amber-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                ગુ — Gujarati
              </button>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Patient Name (Optional)</label>
              <input
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                placeholder="e.g. Rajesh Shah"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all text-slate-800 text-sm"
              />
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search disease..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all text-slate-700 text-sm shadow-sm"
            />
          </div>

          <div className="medical-card overflow-hidden">
            <div className="px-4 pt-3 pb-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
              {filtered.length} Diseases
            </div>
            <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
              {filtered.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className={`w-full text-left px-4 py-3 hover:bg-amber-50/80 transition-colors ${selected.id === d.id ? "bg-amber-50 border-l-4 border-amber-500" : ""}`}
                >
                  <p className={`text-sm font-bold leading-tight ${selected.id === d.id ? "text-amber-700" : "text-slate-800"}`}>
                    {lang === "gu" ? d.nameGu : d.nameHi}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{d.nameEn}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-9">
          <div className="medical-card overflow-hidden">
            {/* Header */}
            <div className="bg-emerald-800 text-white p-5 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-x-2 mb-2 text-emerald-300 text-xs">
                  <BookOpen className="w-4 h-4" />
                  <span>Manglam Skin Care Clinic</span>
                  <span>·</span>
                  <span>Dr. Vijay Girglani · B.A.M.S., C.S.D. · Reg. GBI 17318</span>
                </div>
                <h2 className="text-2xl font-bold text-white">{diseaseName}</h2>
                <p className="text-emerald-300 text-sm mt-0.5">{selected.nameEn}</p>
              </div>
              <div className="text-right text-sm shrink-0">
                {patientName && <p className="text-emerald-200 font-medium">{patientName}</p>}
                <p className="text-emerald-300 text-xs">{today}</p>
                <button
                  onClick={printPathya}
                  className="mt-2 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors ml-auto"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
              </div>
            </div>

            {/* Causes */}
            <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">{causesTitle}</p>
              <div className="flex flex-wrap gap-2">
                {selected.causes.map((c, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-amber-200 text-amber-800 rounded-full font-medium">{c}</span>
                ))}
              </div>
            </div>

            {/* Pathya / Apathya */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              {/* Pathya */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">✅</span>
                  <div>
                    <h3 className="font-bold text-slate-800">{pathyaTitle}</h3>
                    <p className="text-xs text-slate-400">What to eat &amp; follow</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {selected.pathya.map((sec, i) => (
                    <div key={i}>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1.5">{sec.category}</p>
                      <ul className="space-y-1">
                        {sec.items.map((item, j) => (
                          <li key={j} className="text-sm text-slate-700 flex items-start gap-1.5">
                            <span className="text-emerald-400 mt-0.5 shrink-0">•</span>{item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Apathya */}
              <div className="p-5 bg-red-50/30">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">❌</span>
                  <div>
                    <h3 className="font-bold text-slate-800">{apathyaTitle}</h3>
                    <p className="text-xs text-slate-400">What to avoid</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {selected.apathya.map((sec, i) => (
                    <div key={i}>
                      <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1.5">{sec.category}</p>
                      <ul className="space-y-1">
                        {sec.items.map((item, j) => (
                          <li key={j} className="text-sm text-slate-700 flex items-start gap-1.5">
                            <span className="text-red-400 mt-0.5 shrink-0">•</span>{item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
