import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Layout } from "@/components/Layout";
import {
  addPatient, lookupByMobile, lookupByName, findComplaintCode,
  getNextPatientNo, getNextCaseNo, lookupByComplaint, lookupByAddress,
  searchPatientSuggestions,
  type Patient, type PatientSuggestion,
} from "@/lib/store";
import { PrintPrescription, printPatientPrescription } from "@/components/PrintPrescription";
import {
  Loader2, User, Phone, MapPin, Activity, Save, RefreshCw,
  FileText, Printer, Paperclip, X, Leaf, Weight, Calendar,
  Zap, Search, SlidersHorizontal, Sheet, Link, ClipboardPaste,
  Hourglass, CheckCircle2, WalletCards, MessageSquare, ChevronDown, Stethoscope,
  ShoppingBag, PackagePlus, Trash2, IndianRupee,
} from "lucide-react";

// ── Pending Fees helpers ──────────────────────────────────────────────
const PENDING_KEY = "manglam_pending_fees";
interface PendingEntry { patientId: number; name: string; mobile: string; fees: number; date: string; markedAt: string; }
function getPendingFees(): PendingEntry[] { try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]"); } catch { return []; } }
function addPendingFee(e: PendingEntry) { const l = getPendingFees().filter(x => x.patientId !== e.patientId); l.push(e); localStorage.setItem(PENDING_KEY, JSON.stringify(l)); }
function removePendingFee(id: number) { localStorage.setItem(PENDING_KEY, JSON.stringify(getPendingFees().filter(e => e.patientId !== id))); }

// ── Loose Medicine Sale helpers ───────────────────────────────────────────────
const LOOSE_SALE_KEY = "manglam_loose_sales";
interface LooseSaleEntry { id: string; product: string; amount: number; date: string; time: string; }
function getLooseSales(date: string): LooseSaleEntry[] {
  try { return (JSON.parse(localStorage.getItem(LOOSE_SALE_KEY) || "[]") as LooseSaleEntry[]).filter(e => e.date === date); }
  catch { return []; }
}
function addLooseSale(entry: LooseSaleEntry) {
  const all: LooseSaleEntry[] = (() => { try { return JSON.parse(localStorage.getItem(LOOSE_SALE_KEY) || "[]"); } catch { return []; } })();
  all.push(entry);
  localStorage.setItem(LOOSE_SALE_KEY, JSON.stringify(all));
}
function removeLooseSale(id: string) {
  const all: LooseSaleEntry[] = (() => { try { return JSON.parse(localStorage.getItem(LOOSE_SALE_KEY) || "[]"); } catch { return []; } })();
  localStorage.setItem(LOOSE_SALE_KEY, JSON.stringify(all.filter(e => e.id !== id)));
}
function genSaleId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

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
    ? "_Manglam Clinic તરફથી આયુર્વેદિક માર્ગદર્શન_"
    : lang === "hi"
    ? "_Manglam Clinic से आयुर्वेदिक मार्गदर्शन_"
    : "_Manglam Clinic — Ayurvedic Guidance_";

  const ptLine = patientName ? `\n*${ptLabel}:* ${patientName}` : "";

  return [
    `*Manglam Clinic*`,
    `Dr. Vijay Girglani | B.A.M.S.`,
    ptLine,
    `*${dateLabel}:* ${today}`,
    ``,
    `*${name}*`,
    ``,
    `*${causesLabel}:*`,
    causes || "  (See doctor for details)",
    ``,
    `*${pathyaLabel}:*`,
    pathya || "  (See doctor for details)",
    ``,
    `*${apathyaLbl}:*`,
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
  paymentMode: z.enum(["cash", "online"]).optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;
type FilterMode = "history" | "complaint" | "address";

const todayStr = format(new Date(), "yyyy-MM-dd");

const emptyDefaults: PatientFormValues = {
  name: "", mobile: "", visitDate: todayStr,
  age: 0, ageMonths: 0, weight: "", address: "",
  complaintCode: "", complaint: "", treatment: "",
  advice: "", reports: "", fees: 0, paymentMode: "cash" as const,
};

// ── Language config ────────────────────────────────────────────────────────
type CardLang = "en" | "hi" | "gu";

const CARD_LABELS: Record<CardLang, {
  clinicName: string; doctor: string; tagline: string;
  patientCard: string; caseNo: string;
  patientName: string; address: string; clinicPhone: string;
  footer: string; footerSub: string;
}> = {
  en: {
    clinicName:  "Manglam Clinic",
    doctor:      "Dr. Vijay Girglani  |  B.A.M.S.",
    tagline:     "AYURVEDIC & GENERAL PRACTICE",
    patientCard: "✦  PATIENT CARD  ✦",
    caseNo:      "CASE NO.",
    patientName: "PATIENT NAME",
    address:     "ADDRESS",
    clinicPhone: "CLINIC PHONE",
    footer:      "MANGLAM HOSPITAL  •  MORBI, GUJARAT",
    footerSub:   "Show this card on your next visit",
  },
  hi: {
    clinicName:  "मंगलम क्लिनिक",
    doctor:      "डॉ. विजय गिरगलानी  |  बी.ए.एम.एस.",
    tagline:     "आयुर्वेदिक एवं सामान्य चिकित्सा",
    patientCard: "✦  रोगी कार्ड  ✦",
    caseNo:      "केस नं.",
    patientName: "रोगी का नाम",
    address:     "पता",
    clinicPhone: "क्लिनिक फोन",
    footer:      "मंगलम हॉस्पिटल  •  मोरबी, गुजरात",
    footerSub:   "अगली मुलाकात पर यह कार्ड दिखाएं",
  },
  gu: {
    clinicName:  "મંગલમ ક્લિનિક",
    doctor:      "ડૉ. વિજય ગિરગ્લાણી  |  બી.એ.એમ.એસ.",
    tagline:     "આયુર્વેદિક અને સામાન્ય પ્રેક્ટિસ",
    patientCard: "✦  દર્દી કાર્ડ  ✦",
    caseNo:      "કેસ નં.",
    patientName: "દર્દીનું નામ",
    address:     "સરનામું",
    clinicPhone: "ક્લિનિક ફોન",
    footer:      "મંગલમ હૉસ્પિટલ  •  મોરબી, ગુજરાત",
    footerSub:   "આગલી મુલાકાત વખતે આ કાર્ડ બતાવો",
  },
};

// ── Draw patient card ────────────────────────────────────────────────────────
function drawPatientCard(patient: Patient, lang: CardLang = "en"): HTMLCanvasElement {
  const L = CARD_LABELS[lang];
  const scale = 3;
  const W = 360;

  // Layout constants
  const AMBER_H=5, HDR_PT=24, LOGO_D=64, LOGO_MB=10, CNAME_H=22, CNAME_MB=3,
        DR_H=14, DR_MB=10, DIV_H=12, HDR_PB=16, PANEL_MX=16, PANEL_MB=16,
        STRIPE_H=3, PANEL_PT=16, PC_LABEL_H=18,
        CASE_PT=10, CASE_LABEL=12, CASE_NUM=28, CASE_PB=10, CASE_MB=12,
        ROW_H=40, LOC_H=52, PANEL_PB=16, FTR_PB=16, FTR_L1=14, FTR_L2=14;

  const caseBoxH   = CASE_PT + CASE_LABEL + CASE_NUM + CASE_PB;
  // 2 normal rows (name, phone) + 1 tall location block
  const panelInnerH = STRIPE_H + PANEL_PT + PC_LABEL_H + caseBoxH + CASE_MB + ROW_H * 2 + LOC_H + PANEL_PB;
  const hdrH       = HDR_PT + LOGO_D + LOGO_MB + CNAME_H + CNAME_MB + DR_H + DR_MB + DIV_H + HDR_PB;
  const ftrH       = FTR_L1 + FTR_L2 + FTR_PB + 4;
  const H          = AMBER_H + hdrH + panelInnerH + PANEL_MB + ftrH + AMBER_H;

  const canvas = document.createElement("canvas");
  canvas.width = W * scale; canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
    ctx.closePath();
  };

  const amberGrad = ctx.createLinearGradient(0,0,W,0);
  amberGrad.addColorStop(0,"#c45e10"); amberGrad.addColorStop(0.5,"#e07828"); amberGrad.addColorStop(1,"#c45e10");

  // Background
  const bgGrad = ctx.createLinearGradient(0,0,0,H);
  bgGrad.addColorStop(0,"#1a3a0f"); bgGrad.addColorStop(0.5,"#1f4a12"); bgGrad.addColorStop(1,"#0f2208");
  rr(0,0,W,H,24); ctx.fillStyle=bgGrad; ctx.fill();
  ctx.save(); ctx.clip();

  // Decorative circles
  ctx.save(); ctx.globalAlpha=0.05; ctx.fillStyle="#ffffff";
  ctx.beginPath(); ctx.arc(W-30,50,100,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(-20,H-50,110,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // Top amber bar
  ctx.fillStyle=amberGrad; ctx.fillRect(0,0,W,AMBER_H);

  // ── Header ──
  let cy = AMBER_H + HDR_PT;
  const logoX=W/2, logoY=cy+LOGO_D/2;
  ctx.save(); ctx.shadowColor="rgba(224,120,40,0.5)"; ctx.shadowBlur=14;
  ctx.strokeStyle="rgba(224,120,40,0.4)"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(logoX,logoY,LOGO_D/2+3,0,Math.PI*2); ctx.stroke();
  ctx.restore();
  const logoGrad = ctx.createRadialGradient(logoX-10,logoY-10,4,logoX,logoY,LOGO_D/2);
  logoGrad.addColorStop(0,"#e07828"); logoGrad.addColorStop(1,"#b84f0a");
  ctx.fillStyle=logoGrad;
  ctx.beginPath(); ctx.arc(logoX,logoY,LOGO_D/2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#ffffff"; ctx.font=`900 28px serif`;
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText("M",logoX,logoY+1);
  cy += LOGO_D+LOGO_MB;

  ctx.fillStyle="#ffffff"; ctx.font=`bold 20px serif`;
  ctx.textAlign="center"; ctx.textBaseline="alphabetic";
  ctx.fillText(L.clinicName,W/2,cy+CNAME_H-4);
  cy += CNAME_H+CNAME_MB;

  ctx.fillStyle="#d4a574"; ctx.font=`italic 10.5px serif`;
  ctx.fillText(L.doctor,W/2,cy+DR_H-3);
  cy += DR_H+DR_MB;

  const lineY=cy+DIV_H/2;
  ctx.strokeStyle="rgba(212,165,116,0.3)"; ctx.lineWidth=0.8;
  ctx.beginPath(); ctx.moveTo(20,lineY); ctx.lineTo(W/2-62,lineY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W/2+62,lineY); ctx.lineTo(W-20,lineY); ctx.stroke();
  ctx.fillStyle="rgba(212,165,116,0.8)"; ctx.font=`600 7px sans-serif`;
  ctx.textBaseline="middle"; ctx.fillText(L.tagline,W/2,lineY);
  cy += DIV_H+HDR_PB;

  // ── White panel ──
  const pX=PANEL_MX, pW=W-PANEL_MX*2, pY=cy;
  ctx.save(); ctx.shadowColor="rgba(0,0,0,0.35)"; ctx.shadowBlur=18; ctx.shadowOffsetY=4;
  rr(pX,pY,pW,panelInnerH,16); ctx.fillStyle="#ffffff"; ctx.fill();
  ctx.restore();
  ctx.save(); rr(pX,pY,pW,panelInnerH,16); ctx.clip();

  ctx.fillStyle=amberGrad; ctx.fillRect(pX,pY,pW,STRIPE_H);

  let py = pY+STRIPE_H+PANEL_PT;

  ctx.fillStyle="#7c3a0a"; ctx.font=`700 7.5px sans-serif`;
  ctx.letterSpacing="2px"; ctx.textAlign="center"; ctx.textBaseline="alphabetic";
  ctx.fillText(L.patientCard,W/2,py+10);
  ctx.letterSpacing="0px"; py+=PC_LABEL_H;

  // Case number box — uses patient mobile as case no
  const cBX=pX+12, cBW=pW-24;
  rr(cBX,py,cBW,caseBoxH,10); ctx.fillStyle="#fdf0e6"; ctx.fill();
  ctx.fillStyle="#b8825a"; ctx.font=`700 6.5px sans-serif`;
  ctx.letterSpacing="1.5px"; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  ctx.fillText(L.caseNo,cBX+14,py+CASE_PT+CASE_LABEL-2);
  ctx.letterSpacing="0px";
  // ✅ FIX: use patient.mobile digits directly as the case number
  const rawD = patient.mobile.replace(/\D/g,"");
  const displayNo = rawD.slice(-10).padStart(10,"0");
  ctx.fillStyle="#c45e10"; ctx.font=`900 22px monospace`;
  ctx.textBaseline="alphabetic";
  ctx.fillText(displayNo,cBX+14,py+CASE_PT+CASE_LABEL+CASE_NUM-4);
  const icX=cBX+cBW-46, icY=py+caseBoxH/2-14;
  ctx.fillStyle="rgba(196,94,16,0.1)"; rr(icX,icY,28,28,7); ctx.fill();
  ctx.strokeStyle="#c45e10"; ctx.lineWidth=1.5;
  rr(icX+4,icY+6,20,16,3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(icX+4,icY+11); ctx.lineTo(icX+24,icY+11); ctx.stroke();
  py += caseBoxH+CASE_MB;

  const rowPX=pX+12, rowPXR=pX+pW-12;

  const infoRow = (emoji: string, label: string, value: string) => {
    const rowMid=py+ROW_H/2, iBubR=11;
    ctx.fillStyle="#fdf0e6";
    ctx.beginPath(); ctx.arc(rowPX+iBubR,rowMid,iBubR,0,Math.PI*2); ctx.fill();
    ctx.font=`11px sans-serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(emoji,rowPX+iBubR,rowMid);
    const textX=rowPX+iBubR*2+8;
    ctx.fillStyle="#94a3b8"; ctx.font=`700 7px sans-serif`;
    ctx.letterSpacing="0.8px"; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
    ctx.fillText(label,textX,rowMid-2); ctx.letterSpacing="0px";
    ctx.fillStyle="#1e293b"; ctx.font=`700 11px sans-serif`; ctx.textBaseline="alphabetic";
    let v=value; const maxW=rowPXR-textX-4;
    while(ctx.measureText(v).width>maxW && v.length>2) v=v.slice(0,-1);
    if(v!==value) v=v.trimEnd()+"…";
    ctx.fillText(v,textX,rowMid+12);
    py+=ROW_H;
    ctx.strokeStyle="#f1f5f9"; ctx.lineWidth=0.8;
    ctx.beginPath(); ctx.moveTo(rowPX,py); ctx.lineTo(rowPXR,py); ctx.stroke();
  };

  infoRow("👤", L.patientName, patient.name.toUpperCase());
  infoRow("📞", L.clinicPhone, "+91 96381 81875");

  // ── Location highlight block (replaces plain address row) ──
  const locBX=rowPX-4, locBW=rowPXR-rowPX+8, locBH=LOC_H;
  // Amber gradient background
  const locGrad=ctx.createLinearGradient(locBX,0,locBX+locBW,0);
  locGrad.addColorStop(0,"#fff3e6"); locGrad.addColorStop(1,"#ffe8cc");
  rr(locBX,py,locBW,locBH,10); ctx.fillStyle=locGrad; ctx.fill();
  // Amber left accent bar
  ctx.fillStyle="#e07828";
  rr(locBX,py,4,locBH,2); ctx.fill();
  // Pin icon bubble
  const pinCX=locBX+22, pinCY=py+locBH/2, pinR=13;
  ctx.fillStyle="#c45e10";
  ctx.beginPath(); ctx.arc(pinCX,pinCY,pinR,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#ffffff"; ctx.font=`bold 13px sans-serif`;
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText("📍",pinCX,pinCY);
  // Text block
  const locTextX=locBX+42;
  ctx.fillStyle="#7c3a0a"; ctx.font=`700 7px sans-serif`;
  ctx.letterSpacing="0.8px"; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  ctx.fillText(L.address.toUpperCase(), locTextX, py+14);
  ctx.letterSpacing="0px";
  ctx.fillStyle="#1a1a1a"; ctx.font=`700 10px sans-serif`;
  ctx.fillText("Pipaliya Char Rasta, Morbi", locTextX, py+27);
  // "Tap to open in Maps" CTA
  const ctaBX=locTextX, ctaBY=py+32, ctaBW=110, ctaBH=13;
  const ctaGrad=ctx.createLinearGradient(ctaBX,0,ctaBX+ctaBW,0);
  ctaGrad.addColorStop(0,"#c45e10"); ctaGrad.addColorStop(1,"#e07828");
  rr(ctaBX,ctaBY,ctaBW,ctaBH,6); ctx.fillStyle=ctaGrad; ctx.fill();
  ctx.fillStyle="#ffffff"; ctx.font=`700 7px sans-serif`;
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText("👆 TAP HERE FOR LOCATION",ctaBX+ctaBW/2,ctaBY+ctaBH/2);
  py+=locBH;

  ctx.restore(); // end panel clip

  // ── Footer ──
  const fY=pY+panelInnerH+PANEL_MB;
  ctx.fillStyle="rgba(212,165,116,0.75)"; ctx.font=`700 8px sans-serif`;
  ctx.letterSpacing="1.5px"; ctx.textAlign="center"; ctx.textBaseline="alphabetic";
  ctx.fillText(L.footer,W/2,fY+FTR_L1); ctx.letterSpacing="0px";
  ctx.fillStyle="rgba(255,255,255,0.35)"; ctx.font=`9px sans-serif`;
  ctx.fillText(L.footerSub,W/2,fY+FTR_L1+FTR_L2+2);

  // Bottom amber bar
  ctx.fillStyle=amberGrad; ctx.fillRect(0,H-AMBER_H,W,AMBER_H);
  ctx.restore();
  return canvas;
}

// ── Patient Card Modal ─────────────────────────────────────────────────────
function PatientCardModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const rawDigits = patient.mobile.replace(/\D/g, "");
  const caseNo = rawDigits.padStart(10, "0");
  const CLINIC_MOBILE = "9638181875";
  const CLINIC_ADDRESS = "Pipaliya Char Rasta";
  const MAPS_URL = "https://www.google.com/maps/place/Mangalm+Hospital/@22.9329183,70.672955,17z/data=!4m16!1m9!3m8!1s0x395a1d86adcf87dd:0x538508c1bbd0e512!2sMangalm+Hospital!8m2!3d22.9329183!4d70.6755299!9m1!1b1!16s%2Fg%2F11bcclqsjl!3m5!1s0x395a1d86adcf87dd:0x538508c1bbd0e512!8m2!3d22.9329183!4d70.6755299!16s%2Fg%2F11bcclqsjl?entry=ttu&g_ep=EgoyMDI2MDUzMS4wIKXMDSoASAFQAw%3D%3D";
  const clinicPhone = CLINIC_MOBILE.replace(/(\d{5})(\d{5})/, "$1 $2");
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState("");
  const [lang, setLang] = useState<CardLang>("en");
  // Show language picker before share
  const [showLangPicker, setShowLangPicker] = useState(false);

  const L = CARD_LABELS[lang];
  const patientWaLabel = rawDigits.length >= 10
    ? `Send to ${rawDigits.slice(-10)}`
    : "Send on WhatsApp";

  // ── Load jsPDF dynamically (only once) ──
  const getJsPDF = async () => {
    if ((window as any).__jsPDF) return (window as any).__jsPDF;
    await new Promise<void>((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = () => res(); s.onerror = () => rej(new Error("jsPDF load failed"));
      document.head.appendChild(s);
    });
    (window as any).__jsPDF = (window as any).jspdf.jsPDF;
    return (window as any).__jsPDF;
  };

  const doShare = async (chosenLang: CardLang) => {
    setShowLangPicker(false);
    setLang(chosenLang);
    setSharing(true);
    setShareError("");
    try {
      // ── 1. Draw card to canvas ──
      const canvas = drawPatientCard(patient, chosenLang);
      const W_px = canvas.width;   // physical pixels (360 * scale=3 = 1080)
      const H_px = canvas.height;

      // ── 2. Convert canvas → JPEG (much smaller than PNG, quality still great) ──
      const imgData = canvas.toDataURL("image/jpeg", 0.88);

      // ── 3. Build PDF — same aspect ratio as canvas, in mm ──
      const jsPDF = await getJsPDF();
      // Card is portrait; keep 90mm wide to stay compact
      const PDF_W = 90;
      const PDF_H = Math.round((H_px / W_px) * PDF_W);
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [PDF_W, PDF_H], compress: true });

      // Full-bleed card image
      doc.addImage(imgData, "JPEG", 0, 0, PDF_W, PDF_H, undefined, "FAST");

      // ── 4. Clickable link annotation — covers the location highlight block ──
      // Location block comes after: header + panel top + case box + 2 normal rows
      const AMBER_H=5, HDR_PT=24, LOGO_D=64, LOGO_MB=10, CNAME_H=22, CNAME_MB=3,
            DR_H=14, DR_MB=10, DIV_H=12, HDR_PB=16, PANEL_MX=16, STRIPE_H=3,
            PANEL_PT=16, PC_LABEL_H=18, CASE_PT=10, CASE_LABEL=12, CASE_NUM=28,
            CASE_PB=10, CASE_MB=12, ROW_H=40, LOC_H=52;
      const hdrH    = HDR_PT+LOGO_D+LOGO_MB+CNAME_H+CNAME_MB+DR_H+DR_MB+DIV_H+HDR_PB;
      const caseBoxH = CASE_PT+CASE_LABEL+CASE_NUM+CASE_PB;
      const panelTop = AMBER_H + hdrH;
      // name row + phone row, then location block starts
      const locTop  = panelTop + STRIPE_H + PANEL_PT + PC_LABEL_H + caseBoxH + CASE_MB + ROW_H * 2;
      const W_log   = 360;
      const toMM    = (px: number) => (px / W_log) * PDF_W;
      // cover the full location block width (panel inner)
      doc.link(toMM(PANEL_MX), toMM(locTop), toMM(W_log - PANEL_MX*2), toMM(LOC_H), { url: MAPS_URL });

      // ── 5. Output as Blob ──
      const pdfBlob = doc.output("blob");

      // ✅ FIX: correctly build WhatsApp number from patient mobile
      const waRaw = patient.mobile.replace(/\D/g, "");
      const waNumber = waRaw.length === 10 ? `91${waRaw}`
        : waRaw.startsWith("91") && waRaw.length === 12 ? waRaw : waRaw;

      const pdfFile = new File([pdfBlob], "manglam-patient-card.pdf", { type: "application/pdf" });
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobile) {
        // ── Mobile: Web Share API opens WhatsApp share sheet directly ──
        if (
          typeof navigator.share === "function" &&
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [pdfFile] })
        ) {
          try {
            await navigator.share({ files: [pdfFile], title: "Manglam Clinic — Patient Card" });
            setSharing(false);
            return;
          } catch (e: any) {
            if (e?.name === "AbortError") { setSharing(false); return; }
          }
        }
        // Mobile fallback: open WhatsApp to patient number directly
        window.open(`whatsapp://send?phone=${waNumber}`, "_blank");
        setSharing(false);
        return;
      }

      // ── Desktop: open WhatsApp directly to patient's chat, then show attach button ──
      // Step 1: open WhatsApp desktop app to exact patient number
      window.open(`whatsapp://send?phone=${waNumber}`, "_blank");

      // Step 2: create a blob URL (lives in memory only, no file saved to disk)
      // User taps the "📎 Attach PDF" button below which opens it, then they drag into WA
      const blobUrl = URL.createObjectURL(pdfBlob);
      setShareError(`pdf:${blobUrl}|${waNumber}`);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 300_000);
    } catch (err: any) {
      console.error("Card share error:", err);
      setShareError("Could not generate card. Please try again.");
    }
    setSharing(false);
  };

  // Language options config
  const LANGS: { id: CardLang; label: string; native: string; flag: string }[] = [
    { id: "en", label: "English",  native: "English",  flag: "🇬🇧" },
    { id: "hi", label: "Hindi",    native: "हिन्दी",    flag: "🇮🇳" },
    { id: "gu", label: "Gujarati", native: "ગુજરાતી", flag: "🏵️" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-xs"
        >
          {/* ── Language tab strip ── */}
          <div className="flex gap-1 mb-3 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
            {LANGS.map(l => (
              <button
                key={l.id}
                onClick={() => setLang(l.id)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5"
                style={{
                  background: lang === l.id ? "#ffffff" : "transparent",
                  color: lang === l.id ? "#c45e10" : "rgba(255,255,255,0.7)",
                  boxShadow: lang === l.id ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                }}
              >
                <span style={{ fontSize: 16 }}>{l.flag}</span>
                <span>{l.native}</span>
              </button>
            ))}
          </div>

          {/* ── Card preview ── */}
          <div ref={cardRef} className="rounded-3xl overflow-hidden shadow-2xl" style={{
            background: "linear-gradient(180deg, #1a3a0f 0%, #1f4a12 50%, #0f2208 100%)",
            position: "relative",
          }}>
            {/* Top amber bar */}
            <div style={{ height: 5, background: "linear-gradient(90deg, #c45e10, #e07828, #c45e10)" }} />

            {/* Decorative bg circles */}
            <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: 60, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

            {/* Clinic header */}
            <div className="flex flex-col items-center pt-6 pb-4 px-5" style={{ position: "relative", zIndex: 1 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "linear-gradient(135deg, #e07828, #b84f0a)",
                boxShadow: "0 0 0 3px rgba(224,120,40,0.3), 0 0 18px rgba(224,120,40,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10,
              }}>
                <span style={{ color: "#fff", fontFamily: "serif", fontWeight: 900, fontSize: 26 }}>M</span>
              </div>
              <p style={{ color: "#ffffff", fontFamily: "serif", fontWeight: 700, fontSize: 18, letterSpacing: 0.5, marginBottom: 3 }}>{L.clinicName}</p>
              <p style={{ color: "#d4a574", fontStyle: "italic", fontSize: 10, marginBottom: 10 }}>{L.doctor}</p>
              <div className="flex items-center gap-2 w-full">
                <div style={{ flex: 1, height: 1, background: "rgba(212,165,116,0.3)" }} />
                <p style={{ color: "rgba(212,165,116,0.8)", fontSize: 7, letterSpacing: "1.5px", whiteSpace: "nowrap" }}>{L.tagline}</p>
                <div style={{ flex: 1, height: 1, background: "rgba(212,165,116,0.3)" }} />
              </div>
            </div>

            {/* White panel */}
            <div className="mx-4 mb-4 rounded-2xl overflow-hidden" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
              <div style={{ height: 3, background: "linear-gradient(90deg, #c45e10, #e07828)" }} />
              <div className="px-4 py-4" style={{ background: "#ffffff" }}>
                <p style={{ textAlign: "center", fontSize: 8, fontWeight: 700, letterSpacing: "2px", color: "#7c3a0a", marginBottom: 10 }}>{L.patientCard}</p>

                <div className="rounded-xl px-3 py-2.5 mb-4" style={{ background: "#fdf0e6" }}>
                  <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: "1.5px", color: "#b8825a", marginBottom: 4 }}>{L.caseNo}</p>
                  <p style={{ fontSize: 20, fontWeight: 900, fontFamily: "monospace", color: "#c45e10", letterSpacing: 1 }}>{caseNo}</p>
                </div>

                {[
                  { icon: "👤", label: L.patientName, value: patient.name.toUpperCase(), href: null },
                  { icon: "📍", label: L.address,     value: patient.address || CLINIC_ADDRESS, href: "https://www.google.com/maps/place/Mangalm+Hospital/@22.9329183,70.672955,17z/data=!4m16!1m9!3m8!1s0x395a1d86adcf87dd:0x538508c1bbd0e512!2sMangalm+Hospital!8m2!3d22.9329183!4d70.6755299!9m1!1b1!16s%2Fg%2F11bcclqsjl!3m5!1s0x395a1d86adcf87dd:0x538508c1bbd0e512!8m2!3d22.9329183!4d70.6755299!16s%2Fg%2F11bcclqsjl?entry=ttu&g_ep=EgoyMDI2MDUzMS4wIKXMDSoASAFQAw%3D%3D" },
                  { icon: "📞", label: L.clinicPhone, value: `+91 ${clinicPhone}`, href: null },
                ].map((row, i, arr) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 py-2">
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fdf0e6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>
                        {row.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: "1px", color: "#94a3b8", marginBottom: 1 }}>{row.label}</p>
                        {row.href ? (
                          <a
                            href={row.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 11, fontWeight: 700, color: "#c45e10", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", textDecoration: "underline", textDecorationColor: "rgba(196,94,16,0.4)", textUnderlineOffset: 2 }}
                          >{row.value}</a>
                        ) : (
                          <p style={{ fontSize: 11, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.value}</p>
                        )}
                      </div>
                    </div>
                    {i < arr.length - 1 && <div style={{ height: 1, background: "#f1f5f9" }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pb-4 px-4 flex flex-col items-center gap-0.5" style={{ position: "relative", zIndex: 1 }}>
              <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "1.5px", color: "rgba(212,165,116,0.75)" }}>{L.footer}</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{L.footerSub}</p>
            </div>

            <div style={{ height: 5, background: "linear-gradient(90deg, #c45e10, #e07828, #c45e10)" }} />
          </div>

          {/* hint */}
          {shareError && (() => {
            if (shareError.startsWith("pdf:")) {
              const parts = shareError.slice(4).split("|");
              const blobUrl = parts[0];
              const waNum   = parts[1] || "";
              return (
                <div className="mt-2 rounded-xl overflow-hidden"
                  style={{ border: "1px solid rgba(196,94,16,0.3)", background: "#fffbf5" }}>
                  {/* Header */}
                  <div style={{ background: "linear-gradient(90deg,#c45e10,#e07828)", padding: "8px 12px" }}>
                    <p style={{ color: "#fff", fontWeight: 700, fontSize: 11, margin: 0 }}>
                      ✅ WhatsApp opened to patient's chat
                    </p>
                  </div>
                  {/* Steps */}
                  <div style={{ padding: "10px 12px", fontSize: 11, color: "#7c3a0a" }}>
                    <p style={{ margin: "0 0 8px 0", fontWeight: 600 }}>Now attach the card:</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ background: "#c45e10", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>1</span>
                        <span>Click <b>📎 Attach PDF</b> below — opens card in browser</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ background: "#c45e10", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>2</span>
                        <span>Right-click the PDF → <b>Download</b> or drag it into WhatsApp</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <a href={blobUrl} target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, textAlign: "center", background: "linear-gradient(90deg,#c45e10,#e07828)", color: "#fff", borderRadius: 8, padding: "7px 0", fontWeight: 700, fontSize: 12, textDecoration: "none", display: "block" }}>
                        📎 Attach PDF
                      </a>
                      {waNum && (
                        <a href={`whatsapp://send?phone=${waNum}`} target="_blank" rel="noopener noreferrer"
                          style={{ flex: 1, textAlign: "center", background: "#25d366", color: "#fff", borderRadius: 8, padding: "7px 0", fontWeight: 700, fontSize: 12, textDecoration: "none", display: "block" }}>
                          💬 Reopen Chat
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div className="mt-2 px-3 py-2 rounded-xl text-center text-xs font-medium"
                style={{ background: shareError.startsWith("✅") ? "rgba(34,197,94,0.15)" : "rgba(251,191,36,0.15)", color: shareError.startsWith("✅") ? "#15803d" : "#92400e", border: `1px solid ${shareError.startsWith("✅") ? "rgba(34,197,94,0.3)" : "rgba(251,191,36,0.3)"}` }}>
                {shareError}
              </div>
            );
          })()}

          {/* ── Language picker overlay (shown before share) ── */}
          <AnimatePresence>
            {showLangPicker && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="mt-3 rounded-2xl overflow-hidden shadow-xl"
                style={{ background: "#fff", border: "1px solid rgba(196,94,16,0.2)" }}
              >
                <p style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#7c3a0a", padding: "10px 16px 6px", letterSpacing: "1px" }}>
                  CHOOSE LANGUAGE TO SHARE
                </p>
                {LANGS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => doShare(l.id)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-orange-50 transition-colors"
                    style={{ borderTop: "1px solid #f1f5f9" }}
                  >
                    <span style={{ fontSize: 20 }}>{l.flag}</span>
                    <div className="text-left">
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{l.label}</p>
                      <p style={{ fontSize: 11, color: "#94a3b8" }}>{l.native}</p>
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: 13, color: "#c45e10" }}>→</span>
                  </button>
                ))}
                <button
                  onClick={() => setShowLangPicker(false)}
                  className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                  style={{ borderTop: "1px solid #f1f5f9" }}
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Action buttons ── */}
          {!showLangPicker && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-white/90 backdrop-blur text-slate-600 font-semibold text-sm hover:bg-white transition-all shadow">
                Close
              </button>
              <button
                onClick={() => setShowLangPicker(true)}
                disabled={sharing}
                className="flex-[2] py-3 rounded-2xl bg-[#25D366] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1ebe5a] transition-all shadow-lg shadow-green-500/30 disabled:opacity-70">
                {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                {sharing ? "Capturing…" : patientWaLabel}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Home() {
  const { toast } = useToast();
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [patientHistory, setPatientHistory] = useState<Patient[]>([]);
  const [historyName, setHistoryName] = useState("");
  const [historyMobile, setHistoryMobile] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<Patient | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("history");
  const [filterQuery, setFilterQuery] = useState("");
  const [filterResults, setFilterResults] = useState<Patient[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nameSuggestions, setNameSuggestions] = useState<PatientSuggestion[]>([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [pendingFees, setPendingFees] = useState<PendingEntry[]>(() => getPendingFees());
  const [feesMarkedPending, setFeesMarkedPending] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<string>("");
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingAlert, setPendingAlert] = useState<PendingEntry | null>(null);
  const refreshPending = () => setPendingFees(getPendingFees());

  // ── Loose Medicine Sales state ──
  const getLiveToday = () => format(new Date(), "yyyy-MM-dd");
  const [looseSales, setLooseSales]         = useState<LooseSaleEntry[]>(() => getLooseSales(getLiveToday()));
  const [looseProduct, setLooseProduct]     = useState("");
  const [looseAmount, setLooseAmount]       = useState("");
  const refreshLooseSales = () => setLooseSales(getLooseSales(getLiveToday()));
  const looseTodayTotal = looseSales.reduce((s, e) => s + e.amount, 0);

  // ── Auto-refresh at midnight so the panel resets without page reload ──
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      refreshLooseSales();
    }, 60 * 1000); // check every 60 seconds
    return () => clearInterval(checkMidnight);
  }, []);

  const handleAddLooseSale = () => {
    const product = looseProduct.trim();
    const amount  = Number(looseAmount);
    if (!product || !amount || amount <= 0) return;
    const entry: LooseSaleEntry = {
      id: genSaleId(), product, amount,
      date: getLiveToday(),
      time: format(new Date(), "hh:mm a"),
    };
    addLooseSale(entry);
    refreshLooseSales();
    setLooseProduct("");
    setLooseAmount("");
  };

  const handleRemoveLooseSale = (id: string) => {
    removeLooseSale(id);
    refreshLooseSales();
  };

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
  const paymentModeValue = form.watch("paymentMode");
  const feesValue = form.watch("fees");

  // Live dropdown: watch name field, search on every keystroke
  useEffect(() => {
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
    if (result.latestInfo) {
      const match = getPendingFees().find(e => e.mobile.replace(/\D/g,"") === mobile.replace(/\D/g,""));
      if (match) setPendingAlert(match);
    }
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
    if (result.latestInfo) {
      const match = getPendingFees().find(e => e.mobile.replace(/\D/g,"") === result.latestInfo!.mobile.replace(/\D/g,""));
      if (match) setPendingAlert(match);
    }
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
    setFilterMode("history");
    toast({ title: "Patient found", description: `${s.visitCount} visit(s) found.` });
    const match = getPendingFees().find(e => e.mobile.replace(/\D/g,"") === s.mobile.replace(/\D/g,""));
    if (match) setPendingAlert(match);
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
    const autoPatientNo = getNextPatientNo(visitDate);
    const saved = addPatient({
      name: data.name, mobile: data.mobile, patientNo: autoPatientNo,
      age: data.age || 0, ageMonths: data.ageMonths || 0,
      weight: data.weight || "", address: data.address || "",
      complaintCode: data.complaintCode || "", complaint: data.complaint || "",
      treatment: data.treatment || "", advice: data.advice || "",
      reports: data.reports || "", fees: Number(data.fees || 0),
      paymentMode: data.paymentMode || "cash",
      attachments, registerType, visitDate,
    });
    if (feesMarkedPending && saved.fees > 0) {
      const pendingVal = pendingAmount.trim() !== "" ? Number(pendingAmount) : saved.fees;
      const finalPending = (!isNaN(pendingVal) && pendingVal > 0) ? pendingVal : saved.fees;
      addPendingFee({ patientId: saved.id, name: saved.name, mobile: saved.mobile, fees: finalPending, date: visitDate, markedAt: new Date().toISOString() });
      refreshPending();
    }
    setLastSaved(saved);
    setFeesMarkedPending(false);
    setPendingAmount("");
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
    setSelectedPADisease(null);
    setPaMatches([]);
    setShowPAPanel(false);
  };

  const onSubmit = (data: PatientFormValues) => savePatient(data, "general");
  const onSaveAyurvedic = () => form.handleSubmit(data => savePatient(data, "ayurvedic"))();

  // Register mobile/name with RHF but also attach our DOM ref
  const { ref: mobileRHFRef, ...mobileRest } = form.register("mobile");
  const { ref: nameRHFRef, ...nameRest } = form.register("name");

  return (
    <Layout>
      {lastSaved && <PrintPrescription patient={lastSaved} />}
      {showCard && lastSaved && <PatientCardModal patient={lastSaved} onClose={() => setShowCard(false)} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── MAIN FORM ── */}
        <div className="lg:col-span-8 space-y-6">
          <div className="medical-card p-6 md:p-8 border-l-4 border-l-primary shadow-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white shadow-md shadow-primary/30">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-display bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Patient Registration</h2>
                <p className="text-slate-500 text-sm">Register a new visit and view medical history.</p>
              </div>
              {/* Sheet action buttons */}
              <div className="ml-auto flex items-center gap-2">
                <button type="button" onClick={handleSync}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md shadow-emerald-200">
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
              <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-700 text-sm shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                <span><strong>Google Sheet connected.</strong> Press "Sync from Sheet" to load today's patients.</span>
              </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Visit Date */}
              <div className="bg-gradient-to-br from-blue-50/60 to-slate-50/40 p-6 rounded-2xl border border-blue-100 border-l-4 border-l-blue-400 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" /> Visit Date
                    </label>
                    <input type="date" {...form.register("visitDate")}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-blue-50/30 transition-all text-slate-800" />
                  </div>
                </div>

                {/* Mobile / Case No */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
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
                          className="w-full pl-4 pr-10 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-blue-50/30 transition-all text-slate-800 font-mono"
                          placeholder="Mobile or Case No."
                        />
                        {isLookingUp && <Loader2 className="w-4 h-4 absolute right-3 top-3.5 animate-spin text-slate-400" />}
                      </div>
                      <button type="button" onClick={runMobileLookup}
                        className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all" title="Search">
                        <Search className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={handleAutoCase} title="Auto-generate case number"
                        className="px-3 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-all flex items-center gap-1 shadow whitespace-nowrap">
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
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
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-blue-50/30 transition-all text-slate-800"
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Age <span className="text-slate-400 text-xs">(optional)</span></label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input type="number" {...form.register("age")} min={0}
                          className="w-full px-3 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-blue-50/30 transition-all text-slate-800" placeholder="0" />
                        <span className="absolute right-2 top-3.5 text-xs text-slate-400">yrs</span>
                      </div>
                      <div className="w-20 relative">
                        <input type="number" {...form.register("ageMonths")} min={0} max={11}
                          className="w-full px-2 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-blue-50/30 transition-all text-slate-800" placeholder="0" />
                        <span className="absolute right-2 top-3.5 text-xs text-slate-400">mo</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                      <Weight className="w-4 h-4 text-slate-400" /> Weight
                    </label>
                    <input {...form.register("weight")}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-blue-50/30 transition-all text-slate-800" placeholder="e.g. 65 kg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" /> Address
                    </label>
                    <input {...form.register("address")}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-blue-50/30 transition-all text-slate-800" placeholder="City / Area" />
                  </div>
                </div>
              </div>

              {/* Medical Details */}
              <div className="bg-gradient-to-br from-emerald-50/50 to-blue-50/20 p-6 rounded-2xl border border-emerald-100 border-l-4 border-l-emerald-400 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" /> Complaint Code
                    </label>
                    <input {...form.register("complaintCode")}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-blue-50/30 uppercase transition-all text-slate-800"
                      placeholder="E.G. CCF" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Consultation Fees (₹)</label>
                    {/* Preset buttons */}
                    <div className="flex gap-1.5 mb-1">
                      {[200, 250, 550].map(preset => (
                        <button key={preset} type="button"
                          onClick={() => form.setValue("fees", preset)}
                          className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all border border-primary/20">
                          ₹{preset}
                        </button>
                      ))}
                    </div>
                    {/* Row 1: Amount input */}
                    <input type="number" {...form.register("fees")} min={0}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-blue-50/30 transition-all font-semibold text-slate-900" placeholder="Amount" />
                    {/* Row 2: Cash/Online toggle + Mark Pending */}
                    <div className="flex gap-2 items-center">
                      <div className="flex rounded-xl border border-slate-200 overflow-hidden shrink-0">
                        <button type="button"
                          onClick={() => form.setValue("paymentMode", "cash")}
                          className={`flex items-center gap-1 px-3 py-2 text-xs font-bold transition-all ${
                            paymentModeValue !== "online"
                              ? "bg-emerald-500 text-white shadow-inner"
                              : "bg-white text-slate-400 hover:bg-slate-50"
                          }`}>
                          💵 Cash
                        </button>
                        <button type="button"
                          onClick={() => form.setValue("paymentMode", "online")}
                          className={`flex items-center gap-1 px-3 py-2 text-xs font-bold transition-all border-l border-slate-200 ${
                            paymentModeValue === "online"
                              ? "bg-blue-500 text-white shadow-inner"
                              : "bg-white text-slate-400 hover:bg-slate-50"
                          }`}>
                          📱 Online
                        </button>
                      </div>
                      <button type="button"
                        onClick={() => { setFeesMarkedPending(p => !p); setPendingAmount(""); }}
                        title={feesMarkedPending ? "Click to unmark pending" : "Mark fees as pending"}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border font-semibold text-xs transition-all ${
                          feesMarkedPending
                            ? "bg-amber-100 border-amber-400 text-amber-700 shadow-inner"
                            : "bg-white border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-500"
                        }`}>
                        <Hourglass className="w-3.5 h-3.5" />
                        {feesMarkedPending ? "Pending ✓" : "Mark Pending"}
                      </button>
                    </div>
                    {feesMarkedPending && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                          <Hourglass className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">Pending Amount (₹)</p>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-xs">₹</span>
                              <input
                                type="number" min={0}
                                value={pendingAmount}
                                onChange={e => setPendingAmount(e.target.value)}
                                placeholder={`Full (₹${feesValue || 0})`}
                                className="w-full pl-6 pr-3 py-1.5 rounded-lg border border-amber-300 bg-white text-sm font-bold text-amber-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 placeholder:text-amber-300 placeholder:font-normal"
                              />
                            </div>
                          </div>
                        </div>
                        {pendingAmount.trim() !== "" && Number(pendingAmount) > 0 && Number(feesValue) > 0 ? (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs">
                            <span className="flex items-center gap-1 text-emerald-600 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Paid: ₹{Math.max(0, Number(feesValue) - Number(pendingAmount))}
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="flex items-center gap-1 text-amber-600 font-bold">
                              <Hourglass className="w-3.5 h-3.5" /> Pending: ₹{Number(pendingAmount)}
                            </span>
                          </div>
                        ) : (
                          <p className="text-[10px] text-amber-500 px-1">Leave blank to mark full amount (₹{feesValue || 0}) as pending</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Presenting Complaints</label>
                  <textarea {...form.register("complaint")} rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-blue-50/30 transition-all resize-none text-slate-800" placeholder="Describe the symptoms..." />
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
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Treatment Plan</label>
                  <textarea {...form.register("treatment")} rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-blue-50/30 transition-all resize-none text-slate-800" placeholder="Prescribed medicines..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Advice / Notes
                      <span className="text-slate-400 font-normal text-xs ml-2">— F5 = follow-up after 5 days</span>
                    </label>
                    <textarea {...form.register("advice")} rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-blue-50/30 transition-all resize-none text-slate-800" placeholder="F5 · Rest, diet..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reports Required</label>
                    <textarea {...form.register("reports")} rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-blue-50/30 transition-all resize-none text-slate-800" placeholder="Blood test, X-ray..." />
                  </div>
                </div>
                {/* Attachments */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
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
              <div className="flex flex-wrap justify-end gap-3 pt-2">
                {lastSaved && (
                  <button type="button" onClick={() => printPatientPrescription(lastSaved)}
                    className="px-5 py-3 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2">
                    <Printer className="w-5 h-5" /> Print Last
                  </button>
                )}
                {lastSaved && (
                  <button type="button" onClick={() => setShowCard(true)}
                    className="px-5 py-3 rounded-xl font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-400/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2">
                    <WalletCards className="w-5 h-5" /> Share Card
                  </button>
                )}
                <button type="button" onClick={onSaveAyurvedic}
                  className="px-5 py-3 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2">
                  <Leaf className="w-5 h-5" /> Save Ayurvedic
                </button>
                <button type="submit"
                  className="px-7 py-3 rounded-xl font-semibold bg-gradient-to-r from-primary via-blue-500 to-indigo-600 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2">
                  <Save className="w-5 h-5" /> Save General
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-4">
            {/* Filter Mode Selector */}
            <div className="medical-card p-3">
              <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
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
                      <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-primary/10 to-blue-50 shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{historyName || patientHistory[0]?.name}</p>
                            <p className="text-xs font-mono text-slate-500">{historyMobile || patientHistory[0]?.mobile}</p>
                          </div>
                          <span className="ml-auto text-xs text-slate-400 shrink-0">{patientHistory.length} visits</span>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {patientHistory.map((visit, i) => (
                          <div key={i} className="p-3 rounded-xl border border-slate-100 bg-white hover:bg-gradient-to-r hover:from-blue-50/60 hover:to-slate-50 transition-all hover:border-blue-100 hover:shadow-sm">
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
                              </div>
                            </div>
                            <div className="space-y-1">
                              {visit.complaint && <p className="text-xs text-slate-700"><span className="text-[10px] uppercase text-slate-400 font-bold">Complaint: </span>{visit.complaint}</p>}
                              {visit.treatment && <p className="text-xs text-slate-600"><span className="text-[10px] uppercase text-slate-400 font-bold">Treatment: </span>{visit.treatment}</p>}
                              {visit.advice && <p className="text-xs text-slate-500"><span className="text-[10px] uppercase text-slate-400 font-bold">Advice: </span>{visit.advice}</p>}
                            </div>
                            <div className="mt-2 flex justify-end">
                              <button type="button" onClick={() => printPatientPrescription(visit)}
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

            {/* ── LOOSE MEDICINE SALES ── */}
            <div className="medical-card overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">Loose Medicine Sales</span>
                </div>
                {looseTodayTotal > 0 && (
                  <span className="text-xs font-bold text-violet-700 bg-white px-2 py-0.5 rounded-full flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" />{looseTodayTotal.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              {/* Add Entry Form */}
              <div className="p-3 border-b border-violet-50 bg-white space-y-2">
                <input
                  value={looseProduct}
                  onChange={e => setLooseProduct(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); document.getElementById("loose-amount-input")?.focus(); } }}
                  placeholder="Product name (e.g. Triphala Churna)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 text-sm transition-all"
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
                    <input
                      id="loose-amount-input"
                      type="number"
                      value={looseAmount}
                      onChange={e => setLooseAmount(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddLooseSale(); } }}
                      placeholder="Amount"
                      min={0}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 text-sm font-mono transition-all"
                    />
                  </div>
                  <button
                    onClick={handleAddLooseSale}
                    disabled={!looseProduct.trim() || !looseAmount || Number(looseAmount) <= 0}
                    className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center gap-1.5 shadow-sm">
                    <PackagePlus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>
              {/* Sales List */}
              {looseSales.length === 0 ? (
                <div className="px-4 py-5 text-center text-slate-400">
                  <ShoppingBag className="w-7 h-7 mx-auto mb-1.5 text-violet-200" />
                  <p className="text-xs font-medium text-slate-500">No loose sales today</p>
                  <p className="text-xs mt-0.5 text-slate-400">Add a product above to start tracking</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-52 overflow-y-auto">
                  {looseSales.map((sale, i) => (
                    <div key={sale.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-violet-50/40 transition-colors group">
                      <span className="text-xs text-slate-300 w-4 shrink-0 font-mono">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-slate-800 truncate">{sale.product}</p>
                        <p className="text-[10px] text-slate-400">{sale.time}</p>
                      </div>
                      <span className="font-bold text-violet-700 text-sm shrink-0">₹{sale.amount.toLocaleString("en-IN")}</span>
                      <button
                        onClick={() => handleRemoveLooseSale(sale.id)}
                        title="Remove"
                        className="shrink-0 p-1 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="px-3 py-2.5 bg-violet-50 flex justify-between items-center sticky bottom-0">
                    <span className="text-xs font-bold text-violet-700 flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" /> Today's Total ({looseSales.length} item{looseSales.length !== 1 ? "s" : ""})
                    </span>
                    <span className="font-bold text-violet-700 flex items-center gap-0.5">
                      <IndianRupee className="w-3.5 h-3.5" />{looseTodayTotal.toLocaleString("en-IN")}
                    </span>
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

      {/* ── PENDING FEES FLOATING BUTTON ── */}
      <motion.button
        onClick={() => { refreshPending(); setShowPendingModal(true); }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl font-bold text-sm text-white shadow-2xl"
        style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)", boxShadow: "0 8px 32px rgba(245,158,11,0.5)" }}
      >
        <WalletCards className="w-5 h-5" />
        <span>Pending Fees</span>
        {pendingFees.length > 0 && (
          <motion.span
            key={pendingFees.length}
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
            className="w-5 h-5 rounded-full bg-white text-amber-600 text-[11px] font-black flex items-center justify-center"
          >
            {pendingFees.length}
          </motion.span>
        )}
      </motion.button>

      {/* ── PENDING FEES POPUP MODAL ── */}
      <AnimatePresence>
        {showPendingModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowPendingModal(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <WalletCards className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-base leading-none">Pending Fees</p>
                    <p className="text-amber-100 text-xs mt-0.5">{pendingFees.length} patient{pendingFees.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {pendingFees.length > 0 && (
                    <div className="text-right">
                      <p className="text-[10px] text-amber-100 font-semibold uppercase tracking-wide">Total</p>
                      <p className="text-white font-black text-xl leading-none">₹{pendingFees.reduce((s, e) => s + e.fees, 0).toLocaleString("en-IN")}</p>
                    </div>
                  )}
                  <button onClick={() => setShowPendingModal(false)} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
              {/* Body */}
              {pendingFees.length === 0 ? (
                <div className="px-6 py-14 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="font-bold text-slate-700 text-base">All cleared!</p>
                  <p className="text-slate-400 text-sm mt-1">No pending fees at the moment.</p>
                </div>
              ) : (
                <div className="max-h-[55vh] overflow-y-auto divide-y divide-slate-100">
                  {pendingFees.map((e, i) => (
                    <div key={e.patientId} className="flex items-center gap-3 px-5 py-3.5 hover:bg-amber-50/40 transition-colors">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-black text-amber-600">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{e.name}</p>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">{e.mobile} · {format(new Date(e.date + "T00:00:00"), "dd MMM yyyy")}</p>
                      </div>
                      <p className="font-black text-amber-600 text-base shrink-0">₹{e.fees.toLocaleString("en-IN")}</p>
                      <button
                        onClick={() => { removePendingFee(e.patientId); refreshPending(); setPendingAlert(null); toast({ title: "✅ Marked as Paid", description: `${e.name}'s fees cleared.` }); }}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold text-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                      </button>
                    </div>
                  ))}
                  <div className="px-5 py-3 bg-amber-50 flex justify-between items-center sticky bottom-0">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <Hourglass className="w-3.5 h-3.5 text-amber-500" /> Total Pending
                    </span>
                    <span className="font-black text-amber-600 text-base">₹{pendingFees.reduce((s, e) => s + e.fees, 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}
              <div className="px-5 py-4 border-t border-slate-100">
                <button onClick={() => setShowPendingModal(false)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PENDING FEES ALERT (auto-pops on 2nd visit) ── */}
      <AnimatePresence>
        {pendingAlert && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setPendingAlert(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
              style={{ border: "3px solid #f59e0b" }}
            >
              <div className="px-5 pt-7 pb-4 flex flex-col items-center text-center" style={{ background: "linear-gradient(160deg, #fffbeb, #fff7ed)" }}>
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.55, delay: 0.15 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}
                >
                  <Hourglass className="w-8 h-8 text-white" />
                </motion.div>
                <p className="text-[11px] font-black uppercase tracking-widest text-amber-500 mb-1">⚠️ Pending Fees Alert</p>
                <h3 className="text-xl font-black text-slate-900">{pendingAlert.name}</h3>
                <p className="text-sm text-slate-400 mt-0.5 font-mono">{pendingAlert.mobile}</p>
              </div>
              <div className="mx-5 my-4 rounded-2xl p-4 flex items-center gap-4" style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Outstanding Amount</p>
                  <p className="text-3xl font-black text-amber-700 mt-1">₹{pendingAlert.fees.toLocaleString("en-IN")}</p>
                  <p className="text-[11px] text-amber-500 mt-1">Since {format(new Date(pendingAlert.date + "T00:00:00"), "dd MMM yyyy")}</p>
                </div>
                <IndianRupee className="w-10 h-10 text-amber-400 opacity-60 shrink-0" />
              </div>
              <p className="text-center text-xs text-slate-400 px-5 pb-3">This patient has unpaid fees from a previous visit</p>
              <div className="px-5 pb-5 flex gap-3">
                <button
                  onClick={() => setPendingAlert(null)}
                  className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Remind Later
                </button>
                <button
                  onClick={() => {
                    removePendingFee(pendingAlert.patientId);
                    refreshPending();
                    setPendingAlert(null);
                    toast({ title: "✅ Fees Cleared", description: `${pendingAlert.name}'s pending fees marked as paid.` });
                  }}
                  className="flex-[2] py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark as Paid
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </Layout>
  );
}
