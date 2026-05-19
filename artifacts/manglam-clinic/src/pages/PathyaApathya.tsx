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
  {
    id: "amlapitta",
    nameGu: "આમ્લપિત્ત",
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
    id: "grahani",
    nameGu: "ગ્રહણી",
    nameHi: "ग्रहणी",
    nameEn: "IBS / Malabsorption",
    causes: ["Irregular meals", "Excess oil & spices", "Contaminated water", "Mental stress"],
    pathya: [
      { category: "Grains", items: ["Old rice (Juna Chaval), Daliya (Porridge)", "Thin moong dal"] },
      { category: "Fruits", items: ["Ripe banana (Paku kela)", "Apple (Safarzam)"] },
      { category: "Drinks", items: ["Thin buttermilk (Paatlu Chaas)", "Coconut water"] },
    ],
    apathya: [
      { category: "Food", items: ["Fried / heavy food", "Excess milk and curd (Dudh-Dahi)"] },
      { category: "Fruits", items: ["Raw / unripe fruits", "Cold / refrigerated foods"] },
    ],
  },
  {
    id: "arsha",
    nameGu: "અર્શ",
    nameHi: "अर्श",
    nameEn: "Piles / Hemorrhoids",
    causes: ["Constipation (Kabajiyat)", "Spicy food", "Low water intake", "Prolonged sitting"],
    pathya: [
      { category: "Grains", items: ["Wheat roti with bran (Chokar waali roti)", "Barley (Jav), Daliya"] },
      { category: "Vegetables", items: ["Palak (Spinach), Lauki (Dudhi), Parval", "Bathua"] },
      { category: "Fruits", items: ["Fig (Anjeer) — soaked, Papaya (Papita)", "Pomegranate (Anar)"] },
      { category: "Drinks", items: ["Lots of water (2–3 litres/day)", "Buttermilk (Chaas / Mattha)"] },
    ],
    apathya: [
      { category: "Food", items: ["Spicy / chilli food", "Fried / oily food"] },
      { category: "Fruits", items: ["Raw banana (Kachu Kela)", "Jamun / Black plum"] },
    ],
  },
  {
    id: "vibandha",
    nameGu: "કબ્જ (Kabaj)",
    nameHi: "विबन्ध / कब्ज",
    nameEn: "Constipation",
    causes: ["Low water intake", "Low-fibre diet", "No exercise", "Stress"],
    pathya: [
      { category: "Grains", items: ["Wheat roti with bran (Chokar)", "Barley (Jav)"] },
      { category: "Vegetables", items: ["Palak, Lauki (Dudhi)", "Carrot (Gajar), Beetroot (Chukandar)"] },
      { category: "Fruits", items: ["Papaya (Papita), Soaked fig (Anjeer)", "Soaked raisins (Kishmish)"] },
      { category: "Drinks", items: ["Warm water on empty stomach", "Lots of fluids throughout day"] },
    ],
    apathya: [
      { category: "Food", items: ["Maida (refined flour), Biscuits", "Fried / heavy food"] },
      { category: "Drinks", items: ["Excess tea", "Cold / fizzy beverages"] },
    ],
  },
  {
    id: "atisara",
    nameGu: "અ.તિ.સ.ર (Julo)",
    nameHi: "अतिसार / दस्त",
    nameEn: "Diarrhea",
    causes: ["Contaminated food", "Eating outside", "Bacterial infection", "Mental stress"],
    pathya: [
      { category: "Grains", items: ["Rice water (Chaval no Maad)", "Sabudana, Moong dal khichdi"] },
      { category: "Drinks", items: ["ORS solution", "Coconut water (Naryal pani), Thin buttermilk (Chaas)"] },
      { category: "Fruits", items: ["Ripe banana (Paku Kela)", "Boiled apple (Ushnu Safarzam)"] },
    ],
    apathya: [
      { category: "Food", items: ["Milk (Dudh) & Ghee during acute phase", "Fried / oily food"] },
      { category: "Fruits", items: ["Raw / unripe fruits", "Sour / acidic foods"] },
    ],
  },
  {
    id: "ajirna",
    nameGu: "અ.જ.ર.ણ (Apchyo)",
    nameHi: "अजीर्ण / अपच",
    nameEn: "Indigestion / Dyspepsia",
    causes: ["Eating too fast", "Overeating", "Irregular meal times", "Stress"],
    pathya: [
      { category: "Grains", items: ["Light moong-rice khichdi", "Moong dal soup (Paatlo ras)"] },
      { category: "Digestives", items: ["Ginger-Jeera water (Adrak-Jeeru pani)", "Triphala churna"] },
      { category: "Fruits", items: ["Papaya (Papita), Pomegranate (Anar)", "Pomegranate juice (Anar ras)"] },
    ],
    apathya: [
      { category: "Food", items: ["Heavy / large meals", "Fried food, Maida"] },
      { category: "Drinks", items: ["Alcohol, Cold beverages", "Cold drinks / Soft drinks"] },
    ],
  },
  {
    id: "udararoga",
    nameGu: "ઉ.દ.ર (Vaayu / Gas)",
    nameHi: "उदर रोग / गैस",
    nameEn: "Bloating / Abdominal Gas",
    causes: ["Gas-forming foods", "Irregular eating", "Constipation (Kabaj)", "Stress"],
    pathya: [
      { category: "Grains", items: ["Old rice (Juna Chaval)", "Moong dal, Barley (Jav)"] },
      { category: "Spices", items: ["Asafoetida (Hing), Carom seeds (Ajwain)", "Cumin (Jeera), Fennel (Saunf)"] },
      { category: "Drinks", items: ["Warm water throughout the day", "Ajwain water (boiled)"] },
    ],
    apathya: [
      { category: "Food", items: ["Urad dal, Rajma (kidney beans), Chhole", "Cauliflower (Phoolgobi), Sweet potato"] },
      { category: "Drinks", items: ["Cold / fizzy beverages", "Excess milk (Dudh)"] },
    ],
  },
  {
    id: "prameha",
    nameGu: "મ.ધ.મ.ઈ (Diabetes)",
    nameHi: "मधुमेह (Diabetes)",
    nameEn: "Diabetes / Madhumeha",
    causes: ["Excess sugar / sweets", "No exercise", "Genetic (hereditary)", "Stress"],
    pathya: [
      { category: "Grains", items: ["Barley (Jav), Bajra, Ragi (finger millet)", "Moong dal"] },
      { category: "Vegetables", items: ["Bitter gourd (Karela), Fenugreek (Methi)", "Spinach (Palak), Broccoli"] },
      { category: "Fruits", items: ["Indian plum (Jamun), Gooseberry (Amla)", "Pear (Nashpati)"] },
      { category: "Other", items: ["Soaked methi seeds (morning on empty stomach)", "Fresh karela (bitter gourd) juice"] },
    ],
    apathya: [
      { category: "Food", items: ["Sugar (Shakkar), Sweets / Mithai", "Potato (Batata), Rice in excess"] },
      { category: "Fruits", items: ["Mango (Keri), Banana (Kela), Grapes (Draksh)", "Chiku (Sapodilla)"] },
    ],
  },
  {
    id: "raktapitta",
    nameGu: "ઉ.ચ. B.P. (High BP)",
    nameHi: "उच्च रक्तचाप (High BP)",
    nameEn: "Hypertension / High B.P.",
    causes: ["Excess salt (Mith)", "Fried / oily food", "Stress", "Obesity (Jadapat)"],
    pathya: [
      { category: "Grains", items: ["Barley (Jav), Oats", "Wheat with bran (Chokar)"] },
      { category: "Vegetables", items: ["Spinach (Palak), Beetroot (Chukandar)", "Garlic (Lasun), Onion (Dungri)"] },
      { category: "Fruits", items: ["Banana (Kela), Watermelon (Tarbuj)", "Pomegranate (Anar), Grapes (Draksh)"] },
      { category: "Drinks", items: ["Coconut water (Naryal pani)", "Pomegranate juice (Anar ras)"] },
    ],
    apathya: [
      { category: "Food", items: ["Excess salt (Vadhu Mith)", "Pickles (Achar), Papad"] },
      { category: "Drinks", items: ["Alcohol, excess Tea-Coffee", "Cold / fizzy beverages"] },
    ],
  },
  {
    id: "sandhivata",
    nameGu: "સ.ન.ધ.વ.ત (Joint Pain)",
    nameHi: "संधिवात / जोड़ों का दर्द",
    nameEn: "Arthritis / Joint Pain",
    causes: ["Cold-natured foods", "Gas-forming diet", "Old age", "Injury"],
    pathya: [
      { category: "Grains", items: ["Old rice (Juna Chaval), Wheat (Gehun)", "Moong dal"] },
      { category: "Vegetables", items: ["Ginger (Adrak), Garlic (Lasun)", "Turmeric (Haldi) — use generously"] },
      { category: "Other", items: ["Sesame seeds (Tal), Flaxseed (Alsi)", "Warm milk with turmeric (Haldi-Dudh)"] },
    ],
    apathya: [
      { category: "Food", items: ["Urad dal, Rajma (kidney beans)", "Sour / acidic foods"] },
      { category: "Drinks", items: ["Cold water (Thandu Paani)", "Alcohol"] },
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
