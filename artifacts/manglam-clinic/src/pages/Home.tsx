import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Layout } from "@/components/Layout";
import {
  addPatient, updatePatient, getPatients, lookupByMobile, lookupByName, findComplaintCode,
  getNextPatientNo, getNextCaseNo, lookupByComplaint, lookupByAddress,
  searchPatientSuggestions,
  type Patient, type PatientSuggestion,
  type PatientTag, type TagCategory,
  PRESET_TAGS, getAllTags, getCustomTags,
  saveCustomTag, deleteCustomTag,
  getPatientTags, savePatientTags,
} from "@/lib/store";
import { PrintPrescription, printPatientPrescription } from "@/components/PrintPrescription";
import {
  Loader2, User, Phone, MapPin, Activity, Save, RefreshCw,
  FileText, Printer, Paperclip, X, Leaf, Weight, Calendar,
  Zap, Search, SlidersHorizontal, Sheet, Link, ClipboardPaste,
  Hourglass, CheckCircle2, WalletCards, MessageSquare, ChevronDown, Stethoscope,
  MessageCircle, Tag, Plus, Pencil, Trash2, AlertTriangle,
} from "lucide-react";

// ── Pending Fees helpers ──────────────────────────────────────────────
const PENDING_KEY = "manglam_pending_fees";
interface PendingEntry { patientId: number; name: string; mobile: string; fees: number; date: string; markedAt: string; }
function getPendingFees(): PendingEntry[] { try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]"); } catch { return []; } }
function addPendingFee(e: PendingEntry) { const l = getPendingFees().filter(x => x.patientId !== e.patientId); l.push(e); localStorage.setItem(PENDING_KEY, JSON.stringify(l)); }
function removePendingFee(id: number) { localStorage.setItem(PENDING_KEY, JSON.stringify(getPendingFees().filter(e => e.patientId !== id))); }
import { useToast } from "@/hooks/use-toast";
import {
  searchMedicineNames, getAvailableBatchesForMedicine,
  savePatientBill, deletePatientBill, getPatientBills, newId, formatExpiry,
  type PatientBill, type PatientMedicineItem,
} from "@/lib/inventory";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// ── Inline WhatsApp Modal (no external dependency) ────────────────────────────
function WhatsAppModal({ patientName, mobile, onClose }: { patientName: string; mobile: string; onClose: () => void }) {
  const fmt = (m: string) => { const d = m.replace(/\D/g, ""); return d.length === 10 ? `91${d}` : d; };
  const msg = encodeURIComponent(`Hello ${patientName}, this is a message from the clinic.`);
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Send WhatsApp</p>
              <p className="text-xs text-slate-500">{patientName} · {mobile}</p>
            </div>
            <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
          <a href={`https://wa.me/${fmt(mobile)}?text=${msg}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white font-bold text-sm transition-colors">
            <MessageCircle className="w-4 h-4" /> Open WhatsApp
          </a>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Pathya-Apathya Disease helpers ───────────────────────────────────────────
const PA_STORAGE_KEY = "mc_imported_diseases";
interface PADisease {
  id: string; group: string;
  nameEn: string; nameHi: string; nameGu: string;
  causesEn: string[]; causesHi: string[]; causesGu: string[];
  pathyaEn: string[]; pathyaHi: string[]; pathyaGu: string[];
  apathyaEn: string[]; apathyaHi: string[]; apathyaGu: string[];
}
// Static built-in diseases list (name + keywords for matching)
const BUILTIN_DISEASE_KEYWORDS: { id: string; nameEn: string; nameHi: string; nameGu: string; keywords: string[] }[] = [
  { id: "amlapitta",       nameEn: "Amlapitta (Hyperacidity)",      nameHi: "अम्लपित्त",        nameGu: "અમ્લપિત્ત",     keywords: ["acid", "acidity", "hyperacidity", "reflux", "amlapitta", "heartburn", "burning", "chest"] },
  { id: "agnimandya",      nameEn: "Agnimandya (Weak Digestion)",   nameHi: "अग्निमांद्य",      nameGu: "અગ્નિમાંદ્ય",  keywords: ["digestion", "digestive", "appetite", "agnimandya", "weak stomach", "indigestion"] },
  { id: "ajirna",          nameEn: "Ajirna (Indigestion)",          nameHi: "अजीर्ण",           nameGu: "અજીર્ણ",        keywords: ["indigestion", "ajirna", "bloat", "gas", "abdomen", "stomach"] },
  { id: "atisara",         nameEn: "Atisara (Diarrhea)",            nameHi: "अतिसार",           nameGu: "અતિસાર",        keywords: ["diarrhea", "diarrhoea", "loose stool", "loose motion", "atisara"] },
  { id: "grahani",         nameEn: "Grahani (IBS)",                 nameHi: "ग्रहणी",           nameGu: "ગ્રહણી",        keywords: ["ibs", "grahani", "irritable bowel", "alternating", "colon"] },
  { id: "arsha",           nameEn: "Arsha (Piles/Hemorrhoids)",     nameHi: "अर्श (बवासीर)",   nameGu: "અર્શ (પાઈલ્સ)", keywords: ["piles", "hemorrhoid", "arsha", "bleeding", "rectal", "bavaseer"] },
  { id: "vibandha",        nameEn: "Vibandha (Constipation)",       nameHi: "विबन्ध",           nameGu: "વિબન્ધ",        keywords: ["constipation", "vibandha", "hard stool", "irregular bowel"] },
  { id: "adhmana",         nameEn: "Adhmana (Bloating/Gas)",        nameHi: "आध्मान",           nameGu: "આધ્માન",        keywords: ["bloating", "gas", "adhmana", "flatulence", "distension", "wind"] },
  { id: "chhardi",         nameEn: "Chhardi (Vomiting)",            nameHi: "छर्दि",             nameGu: "છર્દિ",          keywords: ["vomiting", "nausea", "chhardi", "vomit"] },
  { id: "krimi",           nameEn: "Krimi (Worm Infestation)",      nameHi: "कृमि",              nameGu: "કૃમિ",           keywords: ["worm", "krimi", "parasite", "stomach worm"] },
  { id: "udarashoola",     nameEn: "Udarashoola (Abdominal Pain)",  nameHi: "उदरशूल",           nameGu: "ઉદ્રરશૂળ",     keywords: ["abdominal pain", "stomach ache", "udarashoola", "colic", "cramp"] },
  { id: "yakrit-vikara",   nameEn: "Yakrit Vikara (Liver Disorder)",nameHi: "यकृत विकार",       nameGu: "યકૃત વિકાર",   keywords: ["liver", "yakrit", "hepatitis", "fatty liver", "jaundice", "sgpt"] },
  { id: "pandu",           nameEn: "Pandu (Anemia)",                nameHi: "पांडु",             nameGu: "પાંડુ",          keywords: ["anemia", "pandu", "weakness", "pallor", "hemoglobin", "hb low"] },
  { id: "mutrakriccha",    nameEn: "Mutrakriccha (Burning Urination)",nameHi: "मूत्रकृच्छ",    nameGu: "મૂત્રકૃચ્છ",  keywords: ["burning urination", "dysuria", "urinary burning", "urine pain", "mutrakriccha"] },
  { id: "uti",             nameEn: "UTI (Urinary Tract Infection)",  nameHi: "मूत्रमार्ग संक्रमण", nameGu: "UTI",       keywords: ["uti", "urinary infection", "urinary tract", "urine infection", "frequent urination"] },
  { id: "ashmari",         nameEn: "Ashmari (Kidney Stones)",       nameHi: "अश्मरी",           nameGu: "અશ્મરી",        keywords: ["kidney stone", "ashmari", "renal stone", "calculus", "gravel", "urine stone"] },
  { id: "prostate-vruddhi",nameEn: "Prostate Enlargement",          nameHi: "प्रोस्टेट वृद्धि", nameGu: "પ્રોસ્ટેટ",   keywords: ["prostate", "bph", "enlarged prostate", "urine flow", "prostate vruddhi"] },
  { id: "atimutra",        nameEn: "Atimutra (Frequent Urination)",  nameHi: "अतिमूत्र",        nameGu: "અતિમૂત્ર",     keywords: ["frequent urination", "polyuria", "atimutra", "diabetes urine", "night urination"] },
];

function getAllDiseases(): PADisease[] {
  try {
    const imported: PADisease[] = JSON.parse(localStorage.getItem(PA_STORAGE_KEY) || "[]");
    return imported;
  } catch { return []; }
}

function formatMobileWA(m: string): string {
  const d = m.replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  if (d.startsWith("91") && d.length === 12) return d;
  return d;
}

function buildWhatsAppMsg(disease: PADisease, patientName: string, lang: "en" | "hi" | "gu"): string {
  const today = format(new Date(), "dd/MM/yyyy");

  const name    = lang === "gu" ? (disease.nameGu || disease.nameEn) : lang === "hi" ? (disease.nameHi || disease.nameEn) : disease.nameEn;
  const causes  = (lang === "gu" ? disease.causesGu  : lang === "hi" ? disease.causesHi  : disease.causesEn).map(c => `  • ${c}`).join("\n");
  const pathya  = (lang === "gu" ? disease.pathyaGu  : lang === "hi" ? disease.pathyaHi  : disease.pathyaEn).map(p => `  • ${p}`).join("\n");
  const apathya = (lang === "gu" ? disease.apathyaGu : lang === "hi" ? disease.apathyaHi : disease.apathyaEn).map(a => `  • ${a}`).join("\n");

  const ptLabel     = lang === "gu" ? "દર્દી"         : lang === "hi" ? "दर्दी"        : "Patient";
  const dateLabel   = lang === "gu" ? "તારીખ"        : lang === "hi" ? "तारीख"       : "Date";
  const causesLabel = lang === "gu" ? "કારણ (Nidana)" : lang === "hi" ? "कारण (Nidana)" : "Causes (Nidana)";
  const pathyaLabel = lang === "gu" ? "પથ્ય — શું ખાવું"   : lang === "hi" ? "पथ्य — क्या खाएं"   : "Pathya — What to Eat";
  const apathyaLbl  = lang === "gu" ? "અપથ્ય — શું ન ખાવું" : lang === "hi" ? "अपथ्य — क्या न खाएं" : "Apathya — What to Avoid";
  const footer      = lang === "gu"
    ? "_Manglam Skin Care Clinic, Tankara તરફથી આયુર્વેદિક માર્ગદર્શન_"
    : lang === "hi"
    ? "_Manglam Skin Care Clinic, Tankara से आयुर्वेदिक मार्गदर्शन_"
    : "_Manglam Skin Care Clinic, Tankara — Ayurvedic Guidance_";

  const ptLine = patientName ? `\n👤 *${ptLabel}:* ${patientName}` : "";

  return [
    `🏥 *Manglam Skin Care Clinic*`,
    `Dr. Vijay Girglani | B.A.M.S., C.S.D. | Reg. GBI 17318`,
    ptLine,
    `📅 *${dateLabel}:* ${today}`,
    ``,
    `🔖 *${name}*`,
    ``,
    `⚠️ *${causesLabel}:*`,
    causes || "  (See doctor for details)",
    ``,
    `✅ *${pathyaLabel}:*`,
    pathya || "  (See doctor for details)",
    ``,
    `❌ *${apathyaLbl}:*`,
    apathya || "  (See doctor for details)",
    ``,
    footer,
  ].filter(l => l !== "").join("\n");
}

// Smart disease matcher: score diseases against complaint text
function matchDiseasesToComplaint(complaint: string, imported: PADisease[]): Array<{ disease: PADisease | null; builtin: typeof BUILTIN_DISEASE_KEYWORDS[0] | null; score: number }> {
  if (!complaint || complaint.trim().length < 3) return [];
  const q = complaint.toLowerCase();
  const results: Array<{ disease: PADisease | null; builtin: typeof BUILTIN_DISEASE_KEYWORDS[0] | null; score: number; name: string }> = [];

  // Score builtins
  for (const b of BUILTIN_DISEASE_KEYWORDS) {
    let score = 0;
    for (const kw of b.keywords) { if (q.includes(kw)) score += kw.length; }
    if (score > 0) results.push({ builtin: b, disease: null, score, name: b.nameEn });
  }

  // Score imported diseases
  for (const d of imported) {
    let score = 0;
    const nameWords = d.nameEn.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    for (const w of nameWords) { if (q.includes(w)) score += w.length * 2; }
    if (score > 0) results.push({ builtin: null, disease: d, score, name: d.nameEn });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 6);
}

// ── Google Sheet helpers ──────────────────────────────────────────────
const SHEET_KEY = "manglam_sheet_url";

function extractSheetId(input: string): string | null {
  // Accept full URL or bare ID
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(input.trim())) return input.trim();
  return null;
}

function sheetCsvUrl(sheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
}

interface SheetRow {
  name: string;
  mobile: string;
  age: string;
  weight: string;
  address: string;
}

async function fetchSheetRows(sheetId: string): Promise<SheetRow[]> {
  const url = sheetCsvUrl(sheetId);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not fetch sheet. Make sure it is published to web as CSV.");
  const text = await res.text();
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  // Detect header row — find column indices
  const header = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ""));
  const idx = (names: string[]) => names.reduce((found, n) => found >= 0 ? found : header.indexOf(n), -1);
  const nameIdx    = idx(["name", "patientname", "patient"]);
  const mobileIdx  = idx(["mobile", "mobileno", "phone", "caseno", "case"]);
  const ageIdx     = idx(["age"]);
  const weightIdx  = idx(["weight"]);
  const addressIdx = idx(["address", "village", "city", "area"]);

  return lines.slice(1).map(line => {
    // Handle quoted CSV fields
    const cols: string[] = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    cols.push(cur.trim());
    return {
      name:    nameIdx    >= 0 ? cols[nameIdx]    || "" : "",
      mobile:  mobileIdx  >= 0 ? cols[mobileIdx]  || "" : "",
      age:     ageIdx     >= 0 ? cols[ageIdx]      || "" : "",
      weight:  weightIdx  >= 0 ? cols[weightIdx]   || "" : "",
      address: addressIdx >= 0 ? cols[addressIdx]  || "" : "",
    };
  }).filter(r => r.name || r.mobile);
}

const patientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.string().min(1, "Mobile / Case No. required"),
  visitDate: z.string().min(1, "Visit date required"),
  age: z.coerce.number().min(0).optional(),
  ageMonths: z.coerce.number().min(0).max(11).optional(),
  weight: z.string().optional(),
  address: z.string().optional(),
  complaintCode: z.string().optional(),
  complaint: z.string().optional(),
  treatment: z.string().optional(),
  advice: z.string().optional(),
  reports: z.string().optional(),
  fees: z.coerce.number().min(0).optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;
type FilterMode = "history" | "complaint" | "address";

const todayStr = format(new Date(), "yyyy-MM-dd");

const emptyDefaults: PatientFormValues = {
  name: "", mobile: "", visitDate: todayStr,
  age: 0, ageMonths: 0, weight: "", address: "",
  complaintCode: "", complaint: "", treatment: "",
  advice: "", reports: "", fees: 0,
};

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT TAG SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

const TAG_CATEGORY_LABELS: Record<TagCategory, string> = {
  chronic:      "Chronic Conditions",
  mental:       "Mental / Behavioral",
  digestive:    "Digestive",
  behavior:     "Patient Behavior",
  allergy:      "Allergies ⚠️",
  reproductive: "Pregnancy / Pediatric",
  custom:       "My Custom Tags",
};

function TagPill({ tag, onRemove }: { tag: PatientTag; onRemove?: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold cursor-default select-none ${tag.color} ${tag.textColor} ${tag.borderColor}`}>
        <span>{tag.emoji}</span>
        <span className="max-w-[80px] truncate">{tag.label}</span>
        {onRemove && (
          <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }} className="ml-0.5 hover:opacity-60 transition-opacity">
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </span>
      {hovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none whitespace-nowrap">
          <div className={`px-3 py-2 rounded-xl shadow-xl border text-center ${tag.color} ${tag.textColor} ${tag.borderColor}`}>
            <div className="text-2xl mb-0.5">{tag.emoji}</div>
            <div className="text-xs font-bold">{tag.label}</div>
            <div className="text-[10px] opacity-60 mt-0.5">{TAG_CATEGORY_LABELS[tag.category]}</div>
          </div>
          <div className={`w-2 h-2 rotate-45 mx-auto -mt-1 border-r border-b ${tag.borderColor} ${tag.color}`} />
        </div>
      )}
    </div>
  );
}

function CustomTagEditorModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const COLORS = [
    { color: "bg-slate-100",   textColor: "text-slate-700",   borderColor: "border-slate-300",   label: "Gray"    },
    { color: "bg-teal-100",    textColor: "text-teal-700",    borderColor: "border-teal-300",    label: "Teal"    },
    { color: "bg-cyan-100",    textColor: "text-cyan-700",    borderColor: "border-cyan-300",    label: "Cyan"    },
    { color: "bg-lime-100",    textColor: "text-lime-700",    borderColor: "border-lime-300",    label: "Lime"    },
    { color: "bg-amber-100",   textColor: "text-amber-700",   borderColor: "border-amber-300",   label: "Amber"   },
    { color: "bg-fuchsia-100", textColor: "text-fuchsia-700", borderColor: "border-fuchsia-300", label: "Fuchsia" },
    { color: "bg-indigo-100",  textColor: "text-indigo-700",  borderColor: "border-indigo-300",  label: "Indigo"  },
  ];
  const EMOJIS = ["🏷️","💊","🩺","📋","⚕️","🔬","🌿","💉","🩻","🧪","🫀","🦷","👁️","🦴","🩹","🌡️","⭐","🔴","🟡","🟢","🔵","🟣"];

  const [label, setLabel]       = useState("");
  const [emoji, setEmoji]       = useState("🏷️");
  const [colorIdx, setColorIdx] = useState(0);
  const [existing, setExisting] = useState<PatientTag[]>(() => getCustomTags());
  const [editing, setEditing]   = useState<PatientTag | null>(null);

  const resetForm = () => { setLabel(""); setEmoji("🏷️"); setColorIdx(0); setEditing(null); };

  const handleSave = () => {
    if (!label.trim()) return;
    const c = COLORS[colorIdx];
    const tag: PatientTag = {
      id: editing ? editing.id : `custom_${Date.now()}`,
      label: label.trim(), emoji,
      category: "custom",
      color: c.color, textColor: c.textColor, borderColor: c.borderColor,
      isCustom: true,
    };
    saveCustomTag(tag);
    setExisting(getCustomTags());
    resetForm();
    onSaved();
  };

  const handleEdit = (tag: PatientTag) => {
    setEditing(tag); setLabel(tag.label); setEmoji(tag.emoji);
    const idx = COLORS.findIndex(c => c.color === tag.color);
    setColorIdx(idx >= 0 ? idx : 0);
  };

  const handleDelete = (id: string) => {
    deleteCustomTag(id);
    setExisting(getCustomTags());
    onSaved();
  };

  const preview = { ...COLORS[colorIdx], id: "preview", label: label || "Preview", emoji, category: "custom" as TagCategory };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          <div className="px-5 py-4 flex items-center gap-3 bg-violet-600">
            <Tag className="w-5 h-5 text-white" />
            <p className="font-bold text-white flex-1 text-base">Custom Tags</p>
            <button onClick={onClose} className="w-7 h-7 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{editing ? "Edit Tag" : "New Tag"}</p>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Label</label>
                <input value={label} onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. Migraine, Ortho Patient..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Icon</label>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJIS.map(e => (
                    <button key={e} type="button" onClick={() => setEmoji(e)}
                      className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all
                        ${emoji === e ? "bg-violet-100 border-2 border-violet-400 scale-110" : "bg-white border border-slate-200 hover:border-violet-200"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Color</label>
                <div className="flex gap-2">
                  {COLORS.map((c, i) => (
                    <button key={i} type="button" onClick={() => setColorIdx(i)} title={c.label}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${c.color} ${colorIdx === i ? `${c.borderColor} scale-125 shadow` : "border-transparent"}`} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Preview:</span>
                <TagPill tag={preview as PatientTag} />
              </div>
              <div className="flex gap-2">
                {editing && <button type="button" onClick={resetForm} className="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50">Cancel</button>}
                <button type="button" onClick={handleSave} disabled={!label.trim()}
                  className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-bold text-sm transition-colors">
                  {editing ? "Update" : "Add Tag"}
                </button>
              </div>
            </div>
            {existing.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Your Tags</p>
                {existing.map(tag => (
                  <div key={tag.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <TagPill tag={tag} />
                    <div className="ml-auto flex gap-1">
                      <button type="button" onClick={() => handleEdit(tag)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-violet-300 hover:bg-violet-50 transition-colors">
                        <Pencil className="w-3 h-3 text-slate-400" />
                      </button>
                      <button type="button" onClick={() => handleDelete(tag.id)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:border-red-300 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PatientTagsSection({ mobile, activeTags, onChange }: {
  mobile: string;
  activeTags: PatientTag[];
  onChange: (tags: PatientTag[]) => void;
}) {
  const [open, setOpen]                         = useState(false);
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [allTags, setAllTags]                   = useState<PatientTag[]>(() => getAllTags());
  const [search, setSearch]                     = useState("");

  const refreshTags = () => setAllTags(getAllTags());

  const toggleTag = (tag: PatientTag) => {
    const exists = activeTags.find(t => t.id === tag.id);
    const next = exists ? activeTags.filter(t => t.id !== tag.id) : [...activeTags, tag];
    onChange(next);
    if (mobile) savePatientTags(mobile, next);
  };

  const grouped = (Object.keys(TAG_CATEGORY_LABELS) as TagCategory[]).reduce((acc, cat) => {
    const filtered = allTags.filter(t =>
      t.category === cat &&
      (search === "" || t.label.toLowerCase().includes(search.toLowerCase()))
    );
    if (filtered.length > 0) acc[cat] = filtered;
    return acc;
  }, {} as Record<TagCategory, PatientTag[]>);

  const allergyTags = activeTags.filter(t => t.category === "allergy");

  return (
    <div className="space-y-2">
      {allergyTags.length > 0 && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-300">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-rose-700 mb-1">⚠️ Allergy Alert — check before prescribing</p>
            <div className="flex flex-wrap gap-1">
              {allergyTags.map(t => <TagPill key={t.id} tag={t} />)}
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {activeTags.filter(t => t.category !== "allergy").map(tag => (
          <TagPill key={tag.id} tag={tag} onRemove={() => toggleTag(tag)} />
        ))}
        {allergyTags.map(tag => (
          <TagPill key={tag.id} tag={tag} onRemove={() => toggleTag(tag)} />
        ))}
        <button type="button" onClick={() => setOpen(v => !v)}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-dashed border-slate-300 text-xs text-slate-400 hover:border-primary hover:text-primary transition-colors">
          <Plus className="w-3 h-3" />
          {activeTags.length === 0 ? "Add Tags" : "More"}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search tags..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-primary" />
              <button type="button" onClick={() => setShowCustomEditor(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold hover:bg-violet-100 transition-colors">
                <Plus className="w-3 h-3" /> Custom
              </button>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 max-h-60 overflow-y-auto space-y-3">
              {(Object.keys(grouped) as TagCategory[]).map(cat => (
                <div key={cat}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{TAG_CATEGORY_LABELS[cat]}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {grouped[cat].map(tag => {
                      const active = !!activeTags.find(t => t.id === tag.id);
                      return (
                        <button key={tag.id} type="button" onClick={() => toggleTag(tag)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold transition-all
                            ${active
                              ? `${tag.color} ${tag.textColor} ${tag.borderColor} ring-2 ring-offset-1 ring-current`
                              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                            }`}>
                          <span>{tag.emoji}</span>
                          <span>{tag.label}</span>
                          {active && <CheckCircle2 className="w-2.5 h-2.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {Object.keys(grouped).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-3">No tags found</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {showCustomEditor && (
        <CustomTagEditorModal
          onClose={() => setShowCustomEditor(false)}
          onSaved={() => { refreshTags(); setShowCustomEditor(false); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const { toast } = useToast();
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [patientHistory, setPatientHistory] = useState<Patient[]>([]);
  const [historyName, setHistoryName] = useState("");
  const [historyMobile, setHistoryMobile] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<Patient | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("history");
  const [filterQuery, setFilterQuery] = useState("");
  const [filterResults, setFilterResults] = useState<Patient[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nameSuggestions, setNameSuggestions] = useState<PatientSuggestion[]>([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const isPrefillingRef = useRef(false); // suppress dropdown during programmatic pre-fill
  const [pendingFees, setPendingFees] = useState<PendingEntry[]>(() => getPendingFees());
  const [feesMarkedPending, setFeesMarkedPending] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<string>("");
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingAlert, setPendingAlert] = useState<PendingEntry | null>(null);
  const [patientTags, setPatientTags] = useState<PatientTag[]>([]);

  // ── Medicine Table state ──
  interface MedRow {
    medicineName: string;
    qty: number;
    mrp: number;
    batchNo: string;
    billId: string;
    landingCostPerTablet: number;
  }
  const [medRows, setMedRows] = useState<MedRow[]>([{ medicineName: "", qty: 1, mrp: 0, batchNo: "", billId: "", landingCostPerTablet: 0 }]);
  const medRowsRef = useRef<MedRow[]>([{ medicineName: "", qty: 1, mrp: 0, batchNo: "", billId: "", landingCostPerTablet: 0 }]);
  const setMedRowsSync = (rows: MedRow[] | ((prev: MedRow[]) => MedRow[])) => {
    setMedRows(prev => {
      const next = typeof rows === "function" ? rows(prev) : rows;
      medRowsRef.current = next;
      return next;
    });
  };
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [editPatientId, setEditPatientId] = useState<number | null>(null);
  const [editBillId, setEditBillId]       = useState<string | null>(null);
  const medGross = medRows.reduce((s, r) => s + r.mrp * r.qty, 0);
  const billAmount = medGross + otherCharges;
  // medNames no longer needed - using searchMedicineNames from inventory
  const activeDoctor = { id: 1 as 1 | 2 };
  const [waPatient, setWaPatient] = useState<{name: string; mobile: string} | null>(null);

  const [medSuggestions, setMedSuggestions] = useState<{name: string; mrpPerTablet: number; currentStock: number; bestBatch: any}[]>([]);
  const [activeMedIdx, setActiveMedIdx] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const medInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const addMedRow = () => setMedRowsSync(p => [...p, { medicineName: "", qty: 1, mrp: 0, batchNo: "", billId: "", landingCostPerTablet: 0 }]);

  // Check if medicine has multiple batches (different MRPs)
  const hasMultipleBatches = (medicineName: string): boolean => {
    if (!medicineName) return false;
    const batches = getAvailableBatchesForMedicine(medicineName);
    if (batches.length <= 1) return false;
    const mrps = new Set(batches.map(b => b.mrpPerTablet.toFixed(2)));
    return mrps.size > 1;
  };

  const getMedSuggestions = (query: string) => {
    if (!query || query.length < 1) return [];
    const results = searchMedicineNames(query);
    const suggestions: {name: string; mrpPerTablet: number; currentStock: number; bestBatch: any; batchLabel: string}[] = [];
    for (const r of results) {
      if (r.batches.length === 1) {
        // Single batch - show one line
        suggestions.push({
          name: r.name,
          mrpPerTablet: r.bestBatch?.mrpPerTablet || 0,
          currentStock: r.batches.reduce((s, b) => s + b.tabletsAvailable, 0),
          bestBatch: r.bestBatch,
          batchLabel: "",
        });
      } else {
        // Multiple batches - show each batch separately so doctor can pick
        for (const batch of r.batches) {
          suggestions.push({
            name: r.name,
            mrpPerTablet: batch.mrpPerTablet,
            currentStock: batch.tabletsAvailable,
            bestBatch: batch,
            batchLabel: `Batch ${batch.batchNo} · exp:${formatExpiry(batch.expiryDate)}`,
          });
        }
      }
    }
    return suggestions.slice(0, 10);
  };
  const updateMedRow = (i: number, field: keyof MedRow, val: string | number) =>
    setMedRowsSync(p => p.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const removeMedRow = (i: number) => setMedRowsSync(p => p.filter((_, idx) => idx !== i));
  const refreshPending = () => setPendingFees(getPendingFees());

  // Close dropdowns on scroll
  useEffect(() => {
    const close = () => { setMedSuggestions([]); setActiveMedIdx(null); };
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, []);

  // ── Pre-fill form from a Patient record (history click OR ?edit= URL param) ──
  const prefillFromPatient = useCallback((patient: Patient) => {
    isPrefillingRef.current = true;
    form.reset({
      name:          patient.name,
      mobile:        patient.mobile,
      visitDate:     patient.visitDate,
      age:           patient.age,
      ageMonths:     patient.ageMonths  || 0,
      weight:        patient.weight     || "",
      address:       patient.address    || "",
      complaintCode: patient.complaintCode || "",
      complaint:     patient.complaint  || "",
      treatment:     patient.treatment  || "",
      advice:        patient.advice     || "",
      reports:       patient.reports    || "",
      fees:          patient.fees,
    });

    const bill = getPatientBills().find(
      b => b.patientId === patient.id && b.billDate === patient.visitDate
    );
    if (bill) {
      setMedRowsSync(bill.items.map(i => ({
        medicineName:         i.medicineName,
        qty:                  i.qtyTablets,
        mrp:                  i.mrpPerTablet,
        batchNo:              i.batchNo,
        billId:               i.billId,
        landingCostPerTablet: i.landingCostPerTablet,
      })));
      setOtherCharges(bill.otherCharges ?? 0);
      setEditBillId(bill.id);
    } else {
      setMedRowsSync([{ medicineName: "", qty: 1, mrp: 0, batchNo: "", billId: "", landingCostPerTablet: 0 }]);
      setOtherCharges(0);
      setEditBillId(null);
    }
    setEditPatientId(patient.id);
    setShowNameDropdown(false);
  }, [form]);

  // ── Edit mode: pre-fill form from /?edit=PATIENTID ──────────────────────────
  useEffect(() => {
    const pidStr = new URLSearchParams(window.location.search).get("edit");
    if (!pidStr) return;
    const pid = Number(pidStr);
    if (!pid) return;
    const patient = getPatients().find(p => p.id === pid);
    if (!patient) return;
    prefillFromPatient(patient);
  }, []);

  // ── Pathya-Apathya suggest state ──
  const [importedDiseases, setImportedDiseases] = useState<PADisease[]>(() => getAllDiseases());
  const [paMatches, setPaMatches]               = useState<ReturnType<typeof matchDiseasesToComplaint>>([]);
  const [selectedPADisease, setSelectedPADisease] = useState<PADisease | null>(null);
  const [showPAPanel, setShowPAPanel]           = useState(false);
  const [paSent, setPaSent]                     = useState(false);
  const [paLang, setPaLang]                     = useState<"en" | "hi" | "gu">("gu");

  // ── Google Sheet state ──
  const [sheetUrl, setSheetUrl] = useState<string>(() => localStorage.getItem(SHEET_KEY) || "");
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [sheetInput, setSheetInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [sheetRows, setSheetRows] = useState<SheetRow[]>([]);
  const [showSheetPicker, setShowSheetPicker] = useState(false);
  const sheetConnected = !!sheetUrl;

  // Separate refs so search always reads live DOM value
  const mobileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: emptyDefaults,
  });

  const complaintCodeValue = form.watch("complaintCode");
  const visitDateValue = form.watch("visitDate");
  const nameValue = form.watch("name");
  const complaintValue = form.watch("complaint");

  // Live dropdown: watch name field, search on every keystroke
  useEffect(() => {
    if (isPrefillingRef.current) {
      isPrefillingRef.current = false; // consume the flag; subsequent keystrokes work normally
      return;
    }
    if (nameValue && nameValue.length >= 2) {
      const results = searchPatientSuggestions(nameValue);
      setNameSuggestions(results);
      setShowNameDropdown(results.length > 0);
    } else {
      setNameSuggestions([]);
      setShowNameDropdown(false);
    }
  }, [nameValue]);

  useEffect(() => {
    if (complaintCodeValue && complaintCodeValue.length >= 2) {
      const codeRecord = findComplaintCode(complaintCodeValue);
      if (codeRecord) {
        form.setValue("complaint", codeRecord.complaint);
        form.setValue("treatment", codeRecord.treatment);
        // Auto-fill medicine rows from complaint code template
        if (codeRecord.medicines && codeRecord.medicines.length > 0) {
          setMedRowsSync(codeRecord.medicines.map(m => {
            const results = searchMedicineNames(m.medicineName);
            const match = results.find(r => r.name.toLowerCase() === m.medicineName.toLowerCase());
            return {
              medicineName: m.medicineName,
              qty: m.defaultQty,
              mrp: match?.bestBatch?.mrpPerTablet || 0,
              batchNo: match?.bestBatch?.batchNo || "",
              billId: match?.bestBatch?.billId || "",
              landingCostPerTablet: match?.bestBatch?.landingCostPerTablet || 0,
            };
          }));
        }
      }
    }
  }, [complaintCodeValue, form]);

  // Auto-match diseases from complaint text
  useEffect(() => {
    if (complaintValue && complaintValue.length >= 3) {
      const freshImported = getAllDiseases();
      setImportedDiseases(freshImported);
      const matches = matchDiseasesToComplaint(complaintValue, freshImported);
      setPaMatches(matches);
      if (matches.length > 0 && !selectedPADisease) setShowPAPanel(true);
    } else {
      setPaMatches([]);
      setShowPAPanel(false);
    }
  }, [complaintValue]);

  // Read directly from DOM ref so we always get the latest typed value
  const runMobileLookup = useCallback(() => {
    const mobile = (mobileRef.current?.value || form.getValues("mobile") || "").trim();
    if (!mobile || mobile.length < 3) return;
    setIsLookingUp(true);
    const result = lookupByMobile(mobile);
    if (result.latestInfo) {
      form.setValue("name", result.latestInfo.name);
      form.setValue("age", result.latestInfo.age || 0);
      form.setValue("ageMonths", result.latestInfo.ageMonths || 0);
      form.setValue("weight", result.latestInfo.weight || "");
      form.setValue("address", result.latestInfo.address || "");
      setHistoryName(result.latestInfo.name);
      setHistoryMobile(mobile);
      const pendingMatch = getPendingFees().find(e => e.mobile.replace(/\D/g, "") === mobile.replace(/\D/g, ""));
      if (pendingMatch) setPendingAlert(pendingMatch);
      setPatientTags(getPatientTags(mobile));
      toast({ title: "Patient found", description: `${result.history.length} visit(s) found.` });
    } else {
      setHistoryName("");
      setHistoryMobile(mobile);
      if (mobile.length >= 5) {
        toast({ title: "No patient found", description: `No record for "${mobile}".` });
      }
    }
    setPatientHistory(result.history);
    setFilterMode("history");
    setIsLookingUp(false);
  }, [form, toast]);

  const runNameLookup = useCallback(() => {
    const name = (nameRef.current?.value || form.getValues("name") || "").trim();
    if (!name || name.length < 2) return;
    setIsLookingUp(true);
    const result = lookupByName(name);
    if (result.latestInfo) {
      form.setValue("age", result.latestInfo.age || 0);
      form.setValue("ageMonths", result.latestInfo.ageMonths || 0);
      form.setValue("weight", result.latestInfo.weight || "");
      form.setValue("address", result.latestInfo.address || "");
      form.setValue("mobile", result.latestInfo.mobile);
      setHistoryName(name);
      setHistoryMobile(result.latestInfo.mobile);
      toast({ title: "Patient found", description: `${result.history.length} visit(s) found.` });
    } else {
      setHistoryName(name);
      setHistoryMobile("");
      toast({ title: "No patient found", description: `No record for "${name}".` });
    }
    setPatientHistory(result.history);
    setFilterMode("history");
    setIsLookingUp(false);
  }, [form, toast]);

  // When user clicks a suggestion: autofill all fields + load history
  const handleSelectSuggestion = useCallback((s: PatientSuggestion) => {
    form.setValue("name", s.name);
    form.setValue("mobile", s.mobile);
    form.setValue("age", s.age || 0);
    form.setValue("ageMonths", s.ageMonths || 0);
    form.setValue("weight", s.weight || "");
    form.setValue("address", s.address || "");
    if (mobileRef.current) mobileRef.current.value = s.mobile;
    if (nameRef.current) nameRef.current.value = s.name;
    setShowNameDropdown(false);
    const result = lookupByMobile(s.mobile);
    setPatientHistory(result.history);
    setHistoryName(s.name);
    setHistoryMobile(s.mobile);
    setPatientTags(getPatientTags(s.mobile));
    setFilterMode("history");
    toast({ title: "Patient found", description: `${s.visitCount} visit(s) found.` });
  }, [form, toast]);

  // ── Google Sheet handlers ──
  const handleSaveSheet = () => {
    const id = extractSheetId(sheetInput);
    if (!id) {
      toast({ title: "Invalid URL", description: "Paste the full Google Sheet URL or just the Sheet ID.", variant: "destructive" });
      return;
    }
    localStorage.setItem(SHEET_KEY, id);
    setSheetUrl(id);
    setShowSheetModal(false);
    toast({ title: "Google Sheet connected!", description: "Tap Sync from Sheet to load patients." });
  };

  const handleSync = async () => {
    if (!sheetUrl) { setShowSheetModal(true); return; }
    setIsSyncing(true);
    try {
      const rows = await fetchSheetRows(sheetUrl);
      if (rows.length === 0) {
        toast({ title: "Sheet is empty", description: "No patient rows found. Check column headers.", variant: "destructive" });
      } else {
        setSheetRows(rows);
        setShowSheetPicker(true);
      }
    } catch (e: any) {
      toast({ title: "Sync failed", description: e.message || "Could not reach Google Sheet.", variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePickRow = (row: SheetRow) => {
    form.setValue("name", row.name);
    form.setValue("mobile", row.mobile);
    if (mobileRef.current) mobileRef.current.value = row.mobile;
    if (nameRef.current) nameRef.current.value = row.name;
    const ageNum = parseInt(row.age) || 0;
    form.setValue("age", ageNum);
    form.setValue("weight", row.weight || "");
    form.setValue("address", row.address || "");
    setShowSheetPicker(false);
    // Also run lookup so history loads
    if (row.mobile) {
      const result = lookupByMobile(row.mobile);
      setPatientHistory(result.history);
      setHistoryName(row.name);
      setHistoryMobile(row.mobile);
    }
    toast({ title: "Patient filled!", description: `Details loaded for ${row.name}` });
  };

  const handleAutoCase = () => {
    const date = form.getValues("visitDate") || todayStr;
    const caseNo = getNextCaseNo(date);
    form.setValue("mobile", caseNo);
    if (mobileRef.current) mobileRef.current.value = caseNo;
    toast({ title: "Case No. Generated", description: caseNo });
  };

  useEffect(() => {
    if (filterMode === "complaint" || filterMode === "address") {
      if (!filterQuery || filterQuery.length < 2) { setFilterResults([]); return; }
      if (filterMode === "complaint") setFilterResults(lookupByComplaint(filterQuery));
      else setFilterResults(lookupByAddress(filterQuery));
    }
  }, [filterQuery, filterMode]);

  const sendPathyaWhatsApp = (disease: PADisease) => {
    const patientName = form.getValues("name") || "";
    const mobile = form.getValues("mobile") || "";
    const msg = buildWhatsAppMsg(disease, patientName, paLang);
    const number = formatMobileWA(mobile);
    const url = number
      ? `https://wa.me/${number}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    setPaSent(true);
    setTimeout(() => setPaSent(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = ev => setAttachments(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const savePatient = (data: PatientFormValues, registerType: "general" | "ayurvedic") => {
    const visitDate = data.visitDate || todayStr;

    // Stock check before saving
    const validMedRows = medRowsRef.current.filter(r => r.medicineName.trim() && r.qty !== 0);
    // Stock check using new inventory system
    if (validMedRows.length > 0) {
      for (const r of validMedRows) {
        if (r.billId) {
          const batches = getAvailableBatchesForMedicine(r.medicineName);
          const available = batches.reduce((s, b) => s + b.tabletsAvailable, 0);
          if (r.qty > 0 && available < r.qty) {
            toast({ title: `Insufficient stock: ${r.medicineName}`, description: `Required: ${r.qty}, Available: ${available}`, variant: "destructive" });
            return;
          }
        }
      }
    }

    // Consultation fee only — otherCharges lives exclusively in bill.otherCharges
    const finalFees = Number(data.fees || 0);

    let saved: Patient;
    if (editPatientId) {
      // Edit mode: overwrite existing patient record
      const updated = updatePatient(editPatientId, {
        name: data.name, mobile: data.mobile,
        age: data.age || 0, ageMonths: data.ageMonths || 0,
        weight: data.weight || "", address: data.address || "",
        complaintCode: data.complaintCode || "", complaint: data.complaint || "",
        treatment: data.treatment || "", advice: data.advice || "",
        reports: data.reports || "", fees: finalFees,
        registerType, attachments, visitDate,
      });
      if (!updated) {
        toast({ title: "Error updating patient", variant: "destructive" });
        return;
      }
      saved = updated;
      // If all medicines removed in edit, delete the old bill so stock is restored
      if (editBillId && validMedRows.length === 0) {
        deletePatientBill(editPatientId);
      }
    } else {
      // New patient
      const autoPatientNo = getNextPatientNo(visitDate);
      saved = addPatient({
        name: data.name, mobile: data.mobile, patientNo: autoPatientNo,
        age: data.age || 0, ageMonths: data.ageMonths || 0,
        weight: data.weight || "", address: data.address || "",
        complaintCode: data.complaintCode || "", complaint: data.complaint || "",
        treatment: data.treatment || "", advice: data.advice || "",
        reports: data.reports || "", fees: finalFees, doctorId: activeDoctor?.id || 1,
        attachments, registerType, visitDate,
      });
    }
    // Save patient bill to inventory system (deducts stock, tracks profit)
    // Save whenever there are medicines OR a charge/discount (otherCharges !== 0)
    if (validMedRows.length > 0 || otherCharges !== 0) {
      const items: PatientMedicineItem[] = validMedRows.map(r => {
        const salePrice = r.mrp * r.qty;
        const cost = r.landingCostPerTablet * r.qty;
        return {
          medicineName: r.medicineName,
          batchNo: r.batchNo,
          billId: r.billId,
          qtyTablets: r.qty,
          mrpPerTablet: r.mrp,
          landingCostPerTablet: r.landingCostPerTablet,
          salePrice,
          cost,
          profit: salePrice - cost,
        };
      });
      // items may be [] when otherCharges-only — reduce on empty array safely returns 0
      const medSale   = items.reduce((s, i) => s + i.salePrice, 0);
      const medCost   = items.reduce((s, i) => s + i.cost, 0);
      const medProfit = items.reduce((s, i) => s + i.profit, 0);
      const patientBill: PatientBill = {
        id: editBillId ?? newId(),
        patientId: saved.id,
        patientName: saved.name,
        doctorId: activeDoctor?.id || 1,
        billDate: visitDate,
        items,                              // [] when no medicines
        otherCharges: otherCharges ?? 0,
        totalSale:   medSale,               // pure medicine sale; otherCharges tracked separately
        totalCost:   medCost,               // 0 when no medicines
        totalProfit: medProfit,             // pure medicine margin; otherCharges tracked separately
        createdAt: new Date().toISOString(),
      };
      savePatientBill(patientBill);
    }

    if (feesMarkedPending && saved.fees > 0) {
      const pendingVal = pendingAmount.trim() !== "" ? Number(pendingAmount) : saved.fees;
      const finalPending = (!isNaN(pendingVal) && pendingVal > 0 && pendingVal <= saved.fees) ? pendingVal : saved.fees;
      addPendingFee({ patientId: saved.id, name: saved.name, mobile: saved.mobile, fees: finalPending, date: visitDate, markedAt: new Date().toISOString() });
      refreshPending();
    }
    setFeesMarkedPending(false);
    setPendingAmount("");
    setLastSaved(saved);
    setFeesMarkedPending(false);
    toast({
      title: "Saved!",
      description: registerType === "ayurvedic" ? "Saved to Ayurvedic Register." : "Saved to Daily Register.",
    });
    form.reset({ ...emptyDefaults, visitDate });
    if (mobileRef.current) mobileRef.current.value = "";
    if (nameRef.current) nameRef.current.value = "";
    setAttachments([]);
    setPatientHistory([]);
    setHistoryName("");
    setHistoryMobile("");
    setMedRowsSync([{ medicineName: "", qty: 1, mrp: 0, batchNo: "", billId: "", landingCostPerTablet: 0 }]);
    setOtherCharges(0);
    setEditPatientId(null);
    setEditBillId(null);
    setSelectedPADisease(null);
    setPaMatches([]);
    setShowPAPanel(false);
    setPatientTags([]);
  };

  const onSubmit = (data: PatientFormValues) => savePatient(data, "general");
  const onSaveAyurvedic = () => form.handleSubmit(data => savePatient(data, "ayurvedic"))();

  // Register mobile/name with RHF but also attach our DOM ref
  const { ref: mobileRHFRef, ...mobileRest } = form.register("mobile");
  const { ref: nameRHFRef, ...nameRest } = form.register("name");

  return (
    <Layout>
      {lastSaved && <PrintPrescription patient={lastSaved} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── MAIN FORM ── */}
        <div className="lg:col-span-8 space-y-6">
          <div className="medical-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-display text-slate-900">Patient Registration</h2>
                <p className="text-slate-500 text-sm">Register a new visit and view medical history.</p>
              </div>
              {/* Sheet action buttons */}
              <div className="ml-auto flex items-center gap-2">
                <button type="button" onClick={handleSync}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow">
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Sync from Sheet
                </button>
                <button type="button" onClick={() => { setSheetInput(sheetUrl); setShowSheetModal(true); }}
                  title="Connect Google Sheet"
                  className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                  <Sheet className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sheet connected banner */}
            {sheetConnected && (
              <div className="mb-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                <span><strong>Google Sheet connected.</strong> Press "Sync from Sheet" to load today's patients.</span>
              </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Visit Date */}
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" /> Visit Date
                    </label>
                    <input type="date" {...form.register("visitDate")}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800" />
                  </div>
                </div>

                {/* Mobile / Case No */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" /> Mobile / Case No. <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          {...mobileRest}
                          ref={(el) => {
                            mobileRHFRef(el);
                            (mobileRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                          }}
                          onKeyDown={e => {
                            if (e.key === "Enter") { e.preventDefault(); runMobileLookup(); }
                          }}
                          className="w-full pl-4 pr-10 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800 font-mono"
                          placeholder="Mobile or Case No."
                        />
                        {isLookingUp && <Loader2 className="w-4 h-4 absolute right-3 top-3.5 animate-spin text-slate-400" />}
                      </div>
                      <button type="button" onClick={runMobileLookup}
                        className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all" title="Search">
                        <Search className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={handleAutoCase} title="Auto-generate case number"
                        className="px-3 py-2 rounded-xl bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 transition-all flex items-center gap-1 shadow whitespace-nowrap">
                        <Zap className="w-3.5 h-3.5" /> Auto
                      </button>
                    </div>
                    {form.formState.errors.mobile && <p className="text-destructive text-xs">{form.formState.errors.mobile.message}</p>}
                    <p className="text-xs text-slate-400">
                      Case format: <span className="font-mono text-purple-600">00{format(new Date(visitDateValue || todayStr), "ddMMyy")}01</span>
                      &nbsp;· Press <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px]">Enter</kbd> or <Search className="w-3 h-3 inline" /> to search
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" /> Patient Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="flex gap-2">
                        <input
                          {...nameRest}
                          ref={(el) => {
                            nameRHFRef(el);
                            (nameRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                          }}
                          onKeyDown={e => {
                            if (e.key === "Enter") { e.preventDefault(); runNameLookup(); setShowNameDropdown(false); }
                            if (e.key === "Escape") setShowNameDropdown(false);
                          }}
                          onBlur={() => setTimeout(() => setShowNameDropdown(false), 200)}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800"
                          placeholder="Full Name"
                        />
                        <button type="button" onClick={runNameLookup}
                          className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all" title="Search by name">
                          <Search className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Live patient suggestions dropdown */}
                      {showNameDropdown && nameSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-y-auto" style={{ zIndex: 9999, maxHeight: "280px" }}>
                          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                            <Search className="w-3 h-3 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              {nameSuggestions.length} patient{nameSuggestions.length > 1 ? "s" : ""} found
                            </span>
                          </div>
                          {nameSuggestions.map((s, i) => (
                            <button
                              key={i}
                              type="button"
                              onMouseDown={e => { e.preventDefault(); handleSelectSuggestion(s); }}
                              className="w-full px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-slate-50 last:border-0"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                                  <User className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm truncate">{s.name}</span>
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                                      {s.visitCount} visit{s.visitCount > 1 ? "s" : ""}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs font-mono text-slate-500">{s.mobile}</span>
                                    {s.age > 0 && <span className="text-xs text-slate-400">{s.age}y</span>}
                                    {s.address && <span className="text-xs text-slate-400 truncate max-w-[100px]">· {s.address}</span>}
                                  </div>
                                  {s.recentVisits[0] && (
                                    <div className="mt-1 text-[10px] text-slate-400">
                                      <span className="font-semibold text-slate-500">{format(new Date(s.recentVisits[0].visitDate), "dd MMM yyyy")}</span>
                                      {s.recentVisits[0].complaint && <span className="ml-1">· {s.recentVisits[0].complaint.slice(0, 40)}</span>}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] text-primary font-bold shrink-0 mt-1">Fill →</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {form.formState.errors.name && <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>}
                  </div>
                </div>

                {/* Age + Weight + Address */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Age <span className="text-slate-400 text-xs">(optional)</span></label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input type="number" {...form.register("age")} min={0}
                          className="w-full px-3 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800" placeholder="0" />
                        <span className="absolute right-2 top-3.5 text-xs text-slate-400">yrs</span>
                      </div>
                      <div className="w-20 relative">
                        <input type="number" {...form.register("ageMonths")} min={0} max={11}
                          className="w-full px-2 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800" placeholder="0" />
                        <span className="absolute right-2 top-3.5 text-xs text-slate-400">mo</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Weight className="w-4 h-4 text-slate-400" /> Weight
                    </label>
                    <input {...form.register("weight")}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800" placeholder="e.g. 65 kg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" /> Address
                    </label>
                    <input {...form.register("address")}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800" placeholder="City / Area" />
                  </div>
                </div>
              </div>

              {/* Medical Details */}
              <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" /> Complaint Code
                    </label>
                    <input {...form.register("complaintCode")}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 uppercase transition-all text-slate-800"
                      placeholder="E.G. CCF" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Bill Amount (₹)
                      {medRows.length > 0 && <span className="ml-2 text-xs text-green-600 font-normal">auto from medicines</span>}
                    </label>
                    <div className="flex gap-2 items-center">
                      <input type="number"
                        value={medRows.length > 0 ? billAmount : undefined}
                        readOnly={medRows.length > 0}
                        {...(medRows.length === 0 ? form.register("fees") : {})}
                        min={0}
                        className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-semibold text-slate-900 ${medRows.length > 0 ? "bg-green-50 border-green-300 cursor-not-allowed" : "bg-white border-slate-200"}`}
                        placeholder="Amount" />
                      <button type="button"
                        onClick={() => setFeesMarkedPending(p => !p)}
                        title={feesMarkedPending ? "Click to unmark pending" : "Mark fees as pending"}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-3 rounded-xl border font-semibold text-xs transition-all ${
                          feesMarkedPending
                            ? "bg-amber-100 border-amber-400 text-amber-700 shadow-inner"
                            : "bg-white border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-500"
                        }`}>
                        <Hourglass className="w-4 h-4" />
                        {feesMarkedPending ? "Pending" : "Mark Pending"}
                      </button>
                    </div>
                    {feesMarkedPending && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                          <Hourglass className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-bold text-amber-700 mb-1">How much is pending? (&#8377;)</p>
                            <input
                              type="number" min={0}
                              value={pendingAmount}
                              onChange={e => setPendingAmount(e.target.value)}
                              placeholder={`Leave blank = full &#8377;${form.watch("fees") || 0}`}
                              className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-sm font-bold text-amber-800 focus:outline-none focus:border-amber-500 placeholder:text-amber-300 placeholder:font-normal"
                            />
                          </div>
                        </div>
                        {pendingAmount.trim() !== "" && Number(pendingAmount) > 0 ? (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs">
                            <span className="flex items-center gap-1 text-emerald-600 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Paid: &#8377;{Math.max(0, Number(form.watch("fees") || 0) - Number(pendingAmount))}
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="flex items-center gap-1 text-amber-600 font-bold">
                              <Hourglass className="w-3.5 h-3.5" /> Pending: &#8377;{Number(pendingAmount)}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-amber-500 px-1">Leave blank &#8594; full amount marked pending</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Presenting Complaints</label>
                  <textarea {...form.register("complaint")} rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none text-slate-800" placeholder="Describe the symptoms..." />
                </div>

                {/* ── Pathya-Apathya Disease Suggest Panel ── */}
                <AnimatePresence>
                  {paMatches.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-2xl border border-emerald-200 bg-emerald-50/60 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="flex items-center gap-2 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setShowPAPanel(p => !p)}
                          className="flex items-center gap-2 flex-1 min-w-0"
                        >
                          <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                            <Leaf className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-sm font-bold text-emerald-800">
                            Pathya-Apathya Suggestions
                          </span>
                          <span className="text-xs font-semibold bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full ml-1 shrink-0">
                            {paMatches.length} match{paMatches.length > 1 ? "es" : ""}
                          </span>
                        </button>
                        {/* Language selector */}
                        <div className="flex items-center gap-1 shrink-0 ml-auto">
                          {(["gu", "hi", "en"] as const).map(l => (
                            <button
                              key={l}
                              type="button"
                              onClick={() => setPaLang(l)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                paLang === l
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                              }`}
                            >
                              {l === "gu" ? "ગુ" : l === "hi" ? "हि" : "EN"}
                            </button>
                          ))}
                        </div>
                        <ChevronDown
                          onClick={() => setShowPAPanel(p => !p)}
                          className={`w-4 h-4 text-emerald-600 transition-transform cursor-pointer shrink-0 ${showPAPanel ? "rotate-180" : ""}`}
                        />
                      </div>

                      <AnimatePresence>
                        {showPAPanel && (
                          <motion.div
                            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-3">
                              {/* Disease chips */}
                              <div className="flex flex-wrap gap-2">
                                {paMatches.map((m, i) => {
                                  const name = m.disease?.nameEn || m.builtin?.nameEn || "";
                                  const isSelected = selectedPADisease?.id === (m.disease?.id || m.builtin?.id);
                                  // Only imported diseases have full data for preview
                                  const hasFullData = !!m.disease;
                                  return (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => {
                                        if (m.disease) {
                                          setSelectedPADisease(isSelected ? null : m.disease);
                                        } else {
                                          toast({ title: "Open Pathya-Apathya tab", description: `"${name}" data is in the Pathya-Apathya section. Import it to send via WhatsApp.` });
                                        }
                                      }}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                        isSelected
                                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                                          : hasFullData
                                          ? "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                      }`}
                                    >
                                      <Stethoscope className="w-3 h-3" />
                                      {name}
                                      {!hasFullData && <span className="text-[9px] text-slate-400 ml-0.5">(built-in)</span>}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Selected disease full preview + WhatsApp */}
                              <AnimatePresence>
                                {selectedPADisease && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="bg-white rounded-xl border border-emerald-200 overflow-hidden"
                                  >
                                    {/* Disease header */}
                                    <div className="flex items-center justify-between px-4 py-3 bg-emerald-600">
                                      <div>
                                        <p className="font-bold text-white text-sm">
                                          {paLang === "gu" ? (selectedPADisease.nameGu || selectedPADisease.nameEn)
                                            : paLang === "hi" ? (selectedPADisease.nameHi || selectedPADisease.nameEn)
                                            : selectedPADisease.nameEn}
                                        </p>
                                        <p className="text-emerald-100 text-xs">{selectedPADisease.nameEn}</p>
                                      </div>
                                      <button type="button" onClick={() => setSelectedPADisease(null)} className="text-white/70 hover:text-white">
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>

                                    <div className="p-4 space-y-3 max-h-60 overflow-y-auto text-xs">
                                      {(() => {
                                        const pathyaList = paLang === "gu" ? selectedPADisease.pathyaGu : paLang === "hi" ? selectedPADisease.pathyaHi : selectedPADisease.pathyaEn;
                                        const apathyaList = paLang === "gu" ? selectedPADisease.apathyaGu : paLang === "hi" ? selectedPADisease.apathyaHi : selectedPADisease.apathyaEn;
                                        const pathyaLabel = paLang === "gu" ? "પથ્ય — શું ખાવું" : paLang === "hi" ? "पथ्य — क्या खाएं" : "Pathya — What to Eat";
                                        const apathyaLabel = paLang === "gu" ? "અપથ્ય — શું ન ખાવું" : paLang === "hi" ? "अपथ्य — क्या न खाएं" : "Apathya — What to Avoid";
                                        return (
                                          <>
                                            {pathyaList.length > 0 && (
                                              <div>
                                                <p className="font-bold text-emerald-700 mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {pathyaLabel}</p>
                                                <ul className="space-y-0.5 text-slate-600">
                                                  {pathyaList.slice(0, 5).map((p, i) => (
                                                    <li key={i} className="flex gap-1"><span className="text-emerald-500 shrink-0">•</span>{p}</li>
                                                  ))}
                                                  {pathyaList.length > 5 && <li className="text-slate-400">+{pathyaList.length - 5} more...</li>}
                                                </ul>
                                              </div>
                                            )}
                                            {apathyaList.length > 0 && (
                                              <div>
                                                <p className="font-bold text-red-600 mb-1 flex items-center gap-1"><X className="w-3 h-3" /> {apathyaLabel}</p>
                                                <ul className="space-y-0.5 text-slate-600">
                                                  {apathyaList.slice(0, 4).map((a, i) => (
                                                    <li key={i} className="flex gap-1"><span className="text-red-400 shrink-0">•</span>{a}</li>
                                                  ))}
                                                  {apathyaList.length > 4 && <li className="text-slate-400">+{apathyaList.length - 4} more...</li>}
                                                </ul>
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>

                                    {/* WhatsApp send bar */}
                                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-500">
                                          {form.getValues("mobile")
                                            ? <span>Will send to <strong className="text-slate-700 font-mono">{form.getValues("mobile")}</strong></span>
                                            : <span className="text-amber-600">Fill mobile number to send directly</span>
                                          }
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => sendPathyaWhatsApp(selectedPADisease)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm ${
                                          paSent
                                            ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                                            : "bg-[#25D366] hover:bg-[#1ebe5b] text-white shadow-green-200 shadow-md"
                                        }`}
                                      >
                                        <MessageSquare className="w-4 h-4" />
                                        {paSent ? "Sent! ✓" : "Send on WhatsApp"}
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Medicine Table ── */}
                <div className="space-y-2">
                  {/* Medicine Table Header */}
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      💊 Medicines
                      {medGross > 0 && <span className="text-xs text-green-600 font-normal">Gross: ₹{medGross.toFixed(2)}</span>}
                    </label>
                  </div>

                  {/* Visual Infosoft style table */}
                  <div className="rounded-xl overflow-visible border border-slate-300 shadow-sm">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-700 text-white">
                          <th className="px-3 py-2 text-left font-semibold text-xs w-8">No</th>
                          <th className="px-2 py-2 text-left font-semibold text-xs">Item Name</th>
                          <th className="px-2 py-2 text-left font-semibold text-xs w-24">Batch</th>
                          <th className="px-2 py-2 text-right font-semibold text-xs w-16">Qty</th>
                          <th className="px-2 py-2 text-right font-semibold text-xs w-24">MRP/Tab</th>
                          <th className="px-2 py-2 text-right font-semibold text-xs w-24">Amount</th>
                          <th className="px-2 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {medRows.map((r, i) => (
                            <tr key={i} className={`border-b border-slate-200 transition-colors hover:bg-blue-50/40
                              ${hasMultipleBatches(r.medicineName)
                                ? "bg-orange-50/60 border-l-2 border-l-orange-400"
                                : i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                              <td className="px-3 py-1 text-slate-500 text-xs font-medium">{i + 1}</td>
                              <td className="px-2 py-1">
                                <div className="relative">
                                  {hasMultipleBatches(r.medicineName) && (
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-orange-100 text-orange-600 font-semibold px-1.5 py-0.5 rounded-full z-10 pointer-events-none">
                                      2 MRP
                                    </span>
                                  )}
                                  <input value={r.medicineName}
                                    onChange={e => {
                                      updateMedRow(i, "medicineName", e.target.value);
                                      updateMedRow(i, "mrp", 0);
                                      setActiveMedIdx(i);
                                      setMedSuggestions(getMedSuggestions(e.target.value));
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setDropdownPos({ top: rect.bottom + 2, left: rect.left, width: Math.max(rect.width, 320) });
                                    }}
                                    onFocus={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setDropdownPos({ top: rect.bottom + 2, left: rect.left, width: Math.max(rect.width, 320) });
                                      setActiveMedIdx(i);
                                      setMedSuggestions(getMedSuggestions(r.medicineName));
                                    }}
                                    onBlur={() => setTimeout(() => { setMedSuggestions([]); setActiveMedIdx(null); }, 150)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Escape") { setMedSuggestions([]); setActiveMedIdx(null); }
                                      if (e.key === "Enter" && medSuggestions.length > 0) {
                                        e.preventDefault();
                                        const s = medSuggestions[0];
                                        setMedRowsSync(p => p.map((r, idx) => idx === i ? {
                                          ...r, medicineName: s.name, mrp: s.mrpPerTablet,
                                          batchNo: s.bestBatch?.batchNo || "",
                                          billId: s.bestBatch?.billId || "",
                                          landingCostPerTablet: s.bestBatch?.landingCostPerTablet || 0,
                                        } : r));
                                        medRowsRef.current = medRowsRef.current.map((r, idx) => idx === i ? {
                                          ...r, medicineName: s.name, mrp: s.mrpPerTablet,
                                          batchNo: s.bestBatch?.batchNo || "",
                                          billId: s.bestBatch?.billId || "",
                                          landingCostPerTablet: s.bestBatch?.landingCostPerTablet || 0,
                                        } : r);
                                        setMedSuggestions([]);
                                        setActiveMedIdx(null);
                                      }
                                    }}
                                    placeholder="Type medicine name..."
                                    autoComplete="off"
                                    className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50" />
                                  {activeMedIdx === i && medSuggestions.length > 0 && (
                                    <div style={{ position: "fixed", zIndex: 99999, backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", width: Math.max(dropdownPos.width, 320) + "px", maxHeight: "240px", overflowY: "auto", top: dropdownPos.top + "px", left: dropdownPos.left + "px" }}
                                      id={`med-dropdown-${i}`}>
                                      {medSuggestions.map((s, si) => (
                                        <button key={si} type="button"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            setMedRowsSync(p => p.map((r, idx) => idx === i ? {
                                              ...r,
                                              medicineName: s.name,
                                              mrp: s.mrpPerTablet,
                                              batchNo: s.bestBatch?.batchNo || "",
                                              billId: s.bestBatch?.billId || "",
                                              landingCostPerTablet: s.bestBatch?.landingCostPerTablet || 0,
                                            } : r));
                                            medRowsRef.current = medRowsRef.current.map((r, idx) => idx === i ? {
                                              ...r,
                                              medicineName: s.name,
                                              mrp: s.mrpPerTablet,
                                              batchNo: s.bestBatch?.batchNo || "",
                                              billId: s.bestBatch?.billId || "",
                                              landingCostPerTablet: s.bestBatch?.landingCostPerTablet || 0,
                                            } : r);
                                            setMedSuggestions([]);
                                            setActiveMedIdx(null);
                                          }}
                                          className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between gap-2 border-b border-slate-50 last:border-0 hover:bg-blue-50 ${si === 0 ? "rounded-t-lg" : ""}`}>
                                          <span className="font-semibold text-slate-800">{s.name}</span>
                                          <span className="text-slate-500 shrink-0 text-right">
                                            <span className="text-primary font-medium">₹{s.mrpPerTablet.toFixed(2)}/tab</span>
                                            <span className={`ml-2 ${s.currentStock <= 0 ? "text-red-500" : "text-green-600"}`}>
                                              {s.currentStock <= 0 ? "OUT" : `${s.currentStock} tabs`}
                                            </span>
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-1 min-w-[90px]">
                                {r.medicineName ? (
                                  <select value={r.batchNo}
                                    onChange={e => {
                                      const sel = getAvailableBatchesForMedicine(r.medicineName).find(b => b.batchNo === e.target.value);
                                      if (sel) {
                                        const updated = { batchNo: sel.batchNo, billId: sel.billId, mrp: sel.mrpPerTablet, landingCostPerTablet: sel.landingCostPerTablet };
                                        setMedRowsSync(p => p.map((x, idx) => idx === i ? { ...x, ...updated } : x));
                                        medRowsRef.current = medRowsRef.current.map((x, idx) => idx === i ? { ...x, ...updated } : x);
                                      }
                                    }}
                                    className="w-full border border-slate-300 rounded px-1 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary/50">
                                    {getAvailableBatchesForMedicine(r.medicineName).map(b => (
                                      <option key={b.batchNo} value={b.batchNo}>{b.batchNo} ({b.tabletsAvailable})</option>
                                    ))}
                                    {!getAvailableBatchesForMedicine(r.medicineName).length && r.batchNo && <option value={r.batchNo}>{r.batchNo}</option>}
                                  </select>
                                ) : <span className="text-slate-300 text-xs">—</span>}
                              </td>
                              <td className="px-2 py-1">
                                <input type="number" value={r.qty}
                                  onChange={e => updateMedRow(i, "qty", Number(e.target.value))}
                                  className="w-16 border border-slate-300 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary/50 bg-white" />
                              </td>
                              <td className="px-2 py-1">
                                <input type="number" step="0.01" value={r.mrp || ""}
                                  onChange={e => updateMedRow(i, "mrp", Number(e.target.value))}
                                  placeholder="0.00"
                                  className="w-20 border border-slate-300 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary/50 bg-white" />
                              </td>
                              <td className="px-2 py-1 text-right font-bold text-slate-800 text-xs">
                                {r.mrp > 0 ? `₹${(r.mrp * r.qty).toFixed(2)}` : "—"}
                              </td>
                              <td className="px-2 py-1 text-center">
                                <button type="button" onClick={() => removeMedRow(i)}
                                  className="text-red-400 hover:text-red-600">✕</button>
                              </td>
                            </tr>
                          ))}
                          {/* Empty row — always visible for adding new medicine */}
                          <tr className="border-b border-slate-200 bg-white hover:bg-blue-50/40 cursor-pointer" onClick={addMedRow}>
                            <td className="px-3 py-2 text-slate-300 text-xs">{medRows.length + 1}</td>
                            <td className="px-2 py-2" colSpan={4}>
                              <span className="text-slate-400 text-xs">+ Click to add medicine...</span>
                            </td>
                            <td className="px-2 py-2 text-right text-slate-300 text-xs">—</td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                      {/* Summary row */}
                      <div className="bg-slate-700 border-t border-slate-600 px-4 py-2.5 flex items-center justify-between gap-4 rounded-b-xl flex-wrap">
                        <div className="flex items-center gap-3 text-xs flex-wrap">
                          <span className="text-white/70">Med Gross: <strong className="text-white">₹{medGross.toFixed(2)}</strong></span>
                          <span className="text-white/30">|</span>
                          <div className="flex items-center gap-1.5">
                            <label className="text-white/70 whitespace-nowrap">Procedure / Discount:</label>
                            <input type="number" value={otherCharges || ""}
                              onChange={e => setOtherCharges(Number(e.target.value))}
                              className="w-24 border border-white/20 rounded px-2 py-1 text-xs text-right focus:outline-none bg-white/10 text-white placeholder-white/30"
                              placeholder="0" />
                            <span className="text-white/40 text-xs">(-=discount +procedure)</span>
                          </div>
                        </div>
                        <div className="text-base font-bold text-white whitespace-nowrap">
                          Bill Total: ₹{billAmount.toFixed(2)}
                        </div>
                      </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Advice / Notes
                      <span className="text-slate-400 font-normal text-xs ml-2">— F5 = follow-up after 5 days</span>
                    </label>
                    <textarea {...form.register("advice")} rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none text-slate-800" placeholder="F5 · Rest, diet..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Reports Required</label>
                    <textarea {...form.register("reports")} rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none text-slate-800" placeholder="Blood test, X-ray..." />
                  </div>
                </div>
                {/* Attachments */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-slate-400" /> Attach Report Images
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                    onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="w-6 h-6 text-slate-300" />
                    <p className="text-sm text-slate-400">Click to upload image reports</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-2">
                      {attachments.map((src, i) => (
                        <div key={i} className="relative group">
                          <img src={src} className="w-20 h-20 object-cover rounded-xl border border-slate-200" alt={`Report ${i + 1}`} />
                          <button type="button" onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {/* Patient Tags */}
              <div className="bg-slate-50/60 px-5 py-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4 text-slate-400" />
                  <label className="text-sm font-semibold text-slate-700">Patient Tags</label>
                  <span className="text-xs text-slate-400 font-normal ml-1">— saved to patient profile, visible every visit</span>
                </div>
                <PatientTagsSection
                  mobile={form.watch("mobile") || ""}
                  activeTags={patientTags}
                  onChange={setPatientTags}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-end gap-3 pt-2">
                {lastSaved && (
                  <button type="button" onClick={() => printPatientPrescription(lastSaved)}
                    className="px-5 py-3 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2">
                    <Printer className="w-5 h-5" /> Print Last
                  </button>
                )}
                <button type="submit"
                  className="px-7 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
                  style={{background: `rgb(var(--primary))`}}>
                  <Save className="w-5 h-5" /> Save Patient
                </button>
                {lastSaved && (
                  <button type="button"
                    onClick={() => setWaPatient({name: lastSaved.name, mobile: lastSaved.mobile})}
                    className="px-5 py-3 rounded-xl font-semibold bg-green-500 hover:bg-green-600 text-white shadow-lg transition-all flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" /> WhatsApp
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-4">
            {/* Filter Mode Selector */}
            <div className="medical-card p-3">
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                <button onClick={() => setFilterMode("history")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${filterMode === "history" ? "bg-white shadow text-primary" : "text-slate-500 hover:text-slate-700"}`}>
                  <RefreshCw className="w-3 h-3" /> History
                </button>
                <button onClick={() => setFilterMode("complaint")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${filterMode === "complaint" ? "bg-white shadow text-primary" : "text-slate-500 hover:text-slate-700"}`}>
                  <Activity className="w-3 h-3" /> Complaint
                </button>
                <button onClick={() => setFilterMode("address")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${filterMode === "address" ? "bg-white shadow text-primary" : "text-slate-500 hover:text-slate-700"}`}>
                  <MapPin className="w-3 h-3" /> Village
                </button>
              </div>

              {(filterMode === "complaint" || filterMode === "address") && (
                <div className="mt-2 relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={filterQuery}
                    onChange={e => setFilterQuery(e.target.value)}
                    placeholder={filterMode === "complaint" ? "Search complaint or code..." : "Search village / city..."}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary text-sm"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Results Panel */}
            <AnimatePresence mode="wait">
              {/* ── HISTORY MODE ── */}
              {filterMode === "history" && (
                <motion.div key="history" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="medical-card overflow-hidden flex flex-col max-h-[calc(100vh-220px)]">
                  {patientHistory.length > 0 ? (
                    <>
                      {/* Patient identity header */}
                      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 truncate">{historyName || patientHistory[0]?.name}</p>
                            <p className="text-xs font-mono text-slate-500">{historyMobile || patientHistory[0]?.mobile}</p>
                            {/* Show tags in history header */}
                            {patientTags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {patientTags.map(tag => <TagPill key={tag.id} tag={tag} />)}
                              </div>
                            )}
                          </div>
                          <span className="ml-auto text-xs text-slate-400 shrink-0">{patientHistory.length} visits</span>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {patientHistory.map((visit, i) => (
                          <div key={i}
                            className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-primary/5 hover:border-primary/20 transition-colors cursor-pointer"
                            onClick={() => { prefillFromPatient(visit); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold px-2 py-1 bg-white rounded-md border border-slate-200 text-slate-600">
                                {format(new Date(visit.visitDate), "dd MMM yyyy")}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {visit.registerType === "ayurvedic" && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">AYU</span>
                                )}
                                {visit.fees > 0 && (
                                  <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-md">₹{visit.fees}</span>
                                )}
                                <span className="text-[10px] text-slate-400 font-medium">tap to edit</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              {visit.complaint && <p className="text-xs text-slate-700"><span className="text-[10px] uppercase text-slate-400 font-bold">Complaint: </span>{visit.complaint}</p>}
                              {visit.treatment && <p className="text-xs text-slate-600"><span className="text-[10px] uppercase text-slate-400 font-bold">Treatment: </span>{visit.treatment}</p>}
                              {visit.advice && <p className="text-xs text-slate-500"><span className="text-[10px] uppercase text-slate-400 font-bold">Advice: </span>{visit.advice}</p>}
                              {visit.reports && (
                                <p className="text-xs text-indigo-700 bg-indigo-50 rounded-lg px-2 py-1 flex items-start gap-1.5">
                                  <FileText className="w-3 h-3 mt-0.5 shrink-0 text-indigo-400" />
                                  <span><span className="text-[10px] uppercase text-indigo-400 font-bold">Reports: </span>{visit.reports}</span>
                                </p>
                              )}
                            </div>
                            <div className="mt-2 flex justify-end">
                              <button type="button" onClick={e => { e.stopPropagation(); printPatientPrescription(visit); }}
                                className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary transition-colors">
                                <Printer className="w-3 h-3" /> Print
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="p-8 flex flex-col items-center justify-center text-center text-slate-400 h-64">
                      <FileText className="w-12 h-12 mb-4 text-slate-300" />
                      <p className="font-medium">No history yet</p>
                      <p className="text-sm mt-2">Type mobile / case no. then press<br /><kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs mx-1">Enter</kbd>or click <Search className="w-3 h-3 inline mx-1" /></p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── COMPLAINT / VILLAGE MODE ── compact list ── */}
              {(filterMode === "complaint" || filterMode === "address") && (
                <motion.div key="filter" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="medical-card overflow-hidden flex flex-col max-h-[calc(100vh-220px)]">
                  {filterResults.length > 0 ? (
                    <>
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 shrink-0 flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-sm text-slate-800">
                          {filterMode === "complaint" ? "By Complaint" : "By Village"}
                        </span>
                        <span className="ml-auto text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                          {filterResults.length} patients
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {filterResults.map((p, i) => (
                          <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                            <span className="text-xs text-slate-400 font-medium w-5 shrink-0">{i + 1}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 text-sm truncate">{p.name}</p>
                              <p className="text-xs font-mono text-slate-400">{p.mobile}</p>
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">
                              {format(new Date(p.visitDate), "dd/MM/yy")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="p-8 flex flex-col items-center justify-center text-center text-slate-400 h-48">
                      {filterMode === "complaint" ? <Activity className="w-10 h-10 mb-3 text-slate-300" /> : <MapPin className="w-10 h-10 mb-3 text-slate-300" />}
                      <p className="text-sm font-medium">{filterQuery.length < 2 ? "Type to search..." : "No results found"}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── PENDING FEES PANEL ── */}
            <div className="medical-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <WalletCards className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-sm text-slate-800">Pending Fees</span>
                  {pendingFees.length > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">{pendingFees.length}</span>
                  )}
                </div>
                {pendingFees.length > 0 && (
                  <span className="text-xs font-bold text-amber-700">
                    Total: ₹{pendingFees.reduce((s, e) => s + e.fees, 0)}
                  </span>
                )}
              </div>
              {pendingFees.length === 0 ? (
                <div className="px-4 py-6 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
                  <p className="text-xs font-medium">No pending fees</p>
                  <p className="text-xs mt-1 text-slate-300">Use "Mark Pending" in the fees field</p>
                </div>
              ) : (
                <div className="divide-y divide-amber-50 max-h-64 overflow-y-auto">
                  {pendingFees.map((e, i) => (
                    <div key={e.patientId} className="flex items-center gap-2 px-3 py-2.5 hover:bg-amber-50/50 transition-colors">
                      <span className="text-xs text-slate-400 w-4 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{e.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{e.mobile} · {format(new Date(e.date + "T00:00:00"), "dd MMM")}</p>
                      </div>
                      <span className="font-bold text-amber-600 text-sm shrink-0">₹{e.fees}</span>
                      <button
                        onClick={() => { removePendingFee(e.patientId); refreshPending(); toast({ title: "Marked as Paid", description: `${e.name}'s fees cleared.` }); }}
                        title="Mark as paid"
                        className="shrink-0 p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="px-3 py-2 bg-amber-50 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600">Total Pending</span>
                    <span className="font-bold text-amber-600">₹{pendingFees.reduce((s, e) => s + e.fees, 0)}</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      {/* ── Google Sheet Connect Modal ── */}
      <AnimatePresence>
        {showSheetModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Sheet className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Connect Google Sheet</h3>
                <button onClick={() => setShowSheetModal(false)} className="ml-auto text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4 text-sm text-slate-700 space-y-1.5">
                <p className="font-semibold text-emerald-800 mb-2">One-time setup in Google Sheets:</p>
                <p>1. Open your Google Sheet</p>
                <p>2. Click <strong>File → Share → Publish to web</strong></p>
                <p>3. Choose <strong>Sheet1</strong> and <strong>Comma-separated values (.csv)</strong></p>
                <p>4. Click <strong>Publish</strong> → confirm with OK</p>
                <p>5. Copy the URL shown, or just copy the Sheet ID from the browser address bar</p>
                <p>6. Paste it below and click Save</p>
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                  ⚠️ Use <strong>Publish to web</strong> (not the Share button) — this ensures the app can always read the data.
                </div>
                <p className="mt-2 text-xs text-slate-500">Sheet columns: <strong>Name | Mobile | Age | Weight | Address</strong></p>
              </div>

              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Google Sheet URL or ID</label>
              <input
                value={sheetInput}
                onChange={e => setSheetInput(e.target.value)}
                placeholder="Paste URL or Sheet ID here..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 text-sm font-mono"
              />

              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowSheetModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button onClick={handleSaveSheet}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all">
                  Save & Connect
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sheet Patient Picker Modal ── */}
      <AnimatePresence>
        {showSheetPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                <RefreshCw className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900">Select Patient from Sheet</h3>
                <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{sheetRows.length} patients</span>
                <button onClick={() => setShowSheetPicker(false)} className="text-slate-400 hover:text-slate-600 ml-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                {sheetRows.map((row, i) => (
                  <button key={i} onClick={() => handlePickRow(row)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-emerald-50 transition-colors text-left">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 text-xs font-bold">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 truncate">{row.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{row.mobile}{row.age ? ` · ${row.age} yrs` : ""}{row.address ? ` · ${row.address}` : ""}</p>
                    </div>
                    <span className="text-xs text-emerald-600 font-semibold shrink-0">Fill →</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ── WHATSAPP MODAL ── */}
      {waPatient && (
        <WhatsAppModal
          patientName={waPatient.name}
          mobile={waPatient.mobile}
          onClose={() => setWaPatient(null)}
        />
      )}

      {/* ── PENDING FEES ALERT POPUP ── */}
      <AnimatePresence>
        {pendingAlert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="px-6 py-5 text-center" style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)" }}>
                <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <WalletCards className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-black text-amber-900">Pending Fees Alert!</h2>
                <p className="text-sm text-amber-700 mt-1 font-medium">This patient has an outstanding balance</p>
              </div>
              <div className="px-6 py-5">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200">
                  <div>
                    <p className="font-black text-slate-900 text-base">{pendingAlert.name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{pendingAlert.mobile}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-amber-600">&#8377;{pendingAlert.fees}</p>
                    <p className="text-xs text-slate-400">since {new Date(pendingAlert.date + "T00:00:00").toLocaleDateString("en-IN", { day:"numeric", month:"short" })}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setPendingAlert(null)}
                  className="flex-1 py-3 rounded-2xl border-2 border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all">
                  Remind Later
                </button>
                <button
                  onClick={() => { removePendingFee(pendingAlert.patientId); refreshPending(); setPendingAlert(null); toast({ title: "&#10003; Fees Cleared", description: `${pendingAlert.name}'s pending fees marked as paid.` }); }}
                  className="flex-[2] py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg"
                  style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                  <CheckCircle2 className="w-4 h-4" /> Mark as Paid
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PENDING FEES FULL MODAL ── */}
      <AnimatePresence>
        {showPendingModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowPendingModal(false)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-amber-100" style={{ background: "linear-gradient(135deg,#fffbeb,#fef3c7)" }}>
                <WalletCards className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-slate-900 text-base">Pending Fees</h3>
                {pendingFees.length > 0 && <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-500 text-white">{pendingFees.length}</span>}
                <span className="ml-auto font-bold text-amber-700 text-sm">Total: &#8377;{pendingFees.reduce((s,e) => s+e.fees, 0)}</span>
                <button onClick={() => setShowPendingModal(false)} className="text-slate-400 hover:text-slate-600 ml-2"><X className="w-5 h-5" /></button>
              </div>
              {pendingFees.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-300" />
                  <p className="font-bold text-sm">All fees cleared!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                  {pendingFees.map((e, i) => (
                    <div key={e.patientId} className="flex items-center gap-3 px-5 py-3 hover:bg-amber-50/50 transition-colors">
                      <span className="text-xs text-slate-400 w-5 shrink-0 font-bold">{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{e.name}</p>
                        <p className="text-[11px] font-mono text-slate-400">{e.mobile} &middot; {new Date(e.date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p>
                      </div>
                      <span className="font-black text-amber-600 text-base shrink-0">&#8377;{e.fees}</span>
                      <button onClick={() => { removePendingFee(e.patientId); refreshPending(); toast({ title: "Paid", description: `${e.name} cleared.` }); }}
                        className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                      </button>
                    </div>
                  ))}
                  <div className="px-5 py-3 bg-amber-50 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-600">Total Pending</span>
                    <span className="font-black text-amber-600 text-lg">&#8377;{pendingFees.reduce((s,e) => s+e.fees, 0)}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FLOATING PENDING FEES BUTTON ── */}
      {pendingFees.length > 0 && (
        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { refreshPending(); setShowPendingModal(true); }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl font-bold text-white text-sm"
          style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)" }}>
          <WalletCards className="w-4 h-4" />
          <span>Pending Fees</span>
          <span className="bg-white text-amber-600 text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">{pendingFees.length}</span>
        </motion.button>
      )}

    </Layout>
  );
}
