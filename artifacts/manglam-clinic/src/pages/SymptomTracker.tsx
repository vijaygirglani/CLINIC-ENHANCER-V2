/**
 * SymptomTracker.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Symptom Improvement Timeline + Doctor's Analytics Dashboard
 *
 * HOW TO ADD TO YOUR APP:
 *  1. Copy this file into your /src/pages/ or /src/components/ folder
 *  2. Add a route for it in your router (e.g. /symptom-tracker)
 *  3. Add a nav link in your Layout component
 *
 * DATA STORAGE: All data is saved in localStorage under "manglam_symptom_cases"
 * It reads patient names/mobiles from existing "mc_patients" localStorage key.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useMemo } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { Layout } from "@/components/Layout";
import {
  Users, TrendingUp, TrendingDown, Minus, Plus, ChevronDown, ChevronUp,
  Activity, BarChart2, Search, X, CheckCircle2, AlertCircle, Clock,
  Stethoscope, ArrowRight, Award, Target, Calendar, RefreshCw, Trash2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface SymptomEntry {
  name: string;       // e.g. "Joint Pain (Sandhishoola)"
  severity: number;   // 0 = absent, 1-10 = severity
}

interface VisitRecord {
  visitNo: number;            // 1, 2, 3, 4...
  date: string;               // "yyyy-MM-dd"
  symptoms: SymptomEntry[];
  treatment: string;          // medicines/protocol used
  notes: string;
  overallSeverity: number;    // computed average
}

interface SymptomCase {
  id: string;                 // unique ID
  patientName: string;
  patientMobile: string;
  patientAge: string;
  disease: string;            // e.g. "Amavata"
  diseaseGroup: string;       // e.g. "Musculoskeletal"
  prakriti: string;           // Vata / Pitta / Kapha / Mixed
  rogaBala: "Mild" | "Moderate" | "Severe";
  createdAt: string;          // "yyyy-MM-dd"
  visits: VisitRecord[];
  status: "Active" | "Resolved" | "Follow-up Needed";
}

// ─────────────────────────────────────────────────────────────────────────────
// DISEASE SYMPTOM DATABASE
// Add more diseases as needed. Symptoms are from classical Ayurvedic texts.
// ─────────────────────────────────────────────────────────────────────────────

const DISEASE_SYMPTOMS: Record<string, { group: string; symptoms: string[] }> = {
  "Amavata (Rheumatoid Arthritis)": {
    group: "Musculoskeletal",
    symptoms: [
      "Joint Pain (Sandhishoola)", "Joint Swelling (Shopha)", "Joint Stiffness (Stabdhata)",
      "Morning Stiffness", "Tenderness on Touch", "Restricted Movement",
      "Fever (Jwara)", "Fatigue / Weakness (Daurbalya)", "Loss of Appetite (Agnimandya)",
      "Constipation (Vibandha)", "Body Ache (Angamardana)", "Heaviness (Gaurava)",
    ],
  },
  "Gridhrasi (Sciatica)": {
    group: "Musculoskeletal",
    symptoms: [
      "Lower Back Pain (Kati Shoola)", "Radiating Leg Pain", "Numbness / Tingling",
      "Difficulty Walking", "Pain on Bending Forward", "Thigh Pain (Uru Shoola)",
      "Calf Pain (Jangha Shoola)", "Foot Pain / Weakness", "Muscle Spasm",
      "Aggravation on Sitting", "Aggravation at Night",
    ],
  },
  "Prameha (Diabetes / Urinary Disorders)": {
    group: "Metabolic",
    symptoms: [
      "Frequent Urination (Bahu Mutra)", "Turbid / Cloudy Urine", "Excessive Thirst (Trishna)",
      "Excessive Hunger (Kshudha)", "Fatigue / Weakness", "Burning Urination",
      "Numbness in Feet / Hands", "Slow Wound Healing", "Blurred Vision",
      "Weight Loss / Gain", "Sweet Taste in Mouth", "Skin Infections (Recurring)",
    ],
  },
  "Sthaulya (Obesity)": {
    group: "Metabolic",
    symptoms: [
      "Excess Body Weight", "Excessive Sweating (Atisvedana)", "Breathlessness on Exertion",
      "Joint Pain due to Weight", "Fatigue / Low Energy", "Excessive Hunger (Atikshudha)",
      "Excessive Sleep (Atinidra)", "Low Libido", "Lethargy (Alasya)",
      "Constipation (Vibandha)", "Heaviness of Body (Gaurava)", "Low Digestive Fire (Mandagni)",
    ],
  },
  "Udara Roga (Abdominal Disorders)": {
    group: "Digestive",
    symptoms: [
      "Abdominal Distension / Bloating", "Abdominal Pain (Udarashoola)", "Constipation",
      "Diarrhea / Loose Stools", "Loss of Appetite (Agnimandya)", "Nausea / Vomiting",
      "Flatulence / Gas (Adhmana)", "Indigestion (Ajirna)", "Heaviness after Meals",
      "Belching / Burping", "Weakness (Daurbalya)", "Jaundice (Kamala)",
    ],
  },
  "Amlapitta (Hyperacidity / Acid Reflux)": {
    group: "Digestive",
    symptoms: [
      "Heartburn / Chest Burning", "Sour Belching (Amla Udgara)", "Nausea",
      "Vomiting (Chhardi)", "Headache (Shirashool)", "Burning in Throat",
      "Loss of Appetite", "Abdominal Pain", "Excessive Thirst",
      "Giddiness (Bhrama)", "Fatigue",
    ],
  },
  "Kushtha (Skin Disorders / Eczema / Psoriasis)": {
    group: "Skin",
    symptoms: [
      "Skin Lesions / Patches", "Itching (Kandu)", "Burning Sensation (Daha)",
      "Skin Discoloration", "Dryness / Scaling", "Oozing / Discharge",
      "Thickening of Skin", "Redness (Raga)", "Pain at Lesion Site",
      "Spreading of Lesions", "Secondary Infection", "Sleep Disturbance due to Itching",
    ],
  },
  "Shwasa (Asthma / Respiratory)": {
    group: "Respiratory",
    symptoms: [
      "Breathlessness (Shwasa)", "Wheezing", "Cough (Kasa)", "Chest Tightness",
      "Phlegm / Sputum Production", "Nocturnal Aggravation", "Exercise-Induced Symptoms",
      "Nasal Congestion", "Sneezing", "Fatigue on Exertion", "Anxiety / Restlessness",
    ],
  },
  "Pandu (Anemia)": {
    group: "Hematological",
    symptoms: [
      "Pallor (Pandutha)", "Weakness / Fatigue (Daurbalya)", "Breathlessness",
      "Palpitations", "Dizziness / Giddiness", "Loss of Appetite",
      "Headache", "Cold Extremities", "Yellowish Tinge (mild jaundice)",
      "Edema of Feet", "Poor Concentration",
    ],
  },
  "Sandhigata Vata (Osteoarthritis)": {
    group: "Musculoskeletal",
    symptoms: [
      "Joint Pain (worse on movement)", "Crepitation / Cracking Sound", "Joint Stiffness (worse in morning)",
      "Swelling around Joints", "Restricted Range of Motion", "Muscle Weakness around Joint",
      "Pain at Rest (advanced stage)", "Deformity (advanced)", "Tenderness on Palpation",
      "Fatigue", "Aggravation in Cold / Rainy Season",
    ],
  },
  "Custom Disease": {
    group: "Other",
    symptoms: [],
  },
};

const DISEASE_LIST = Object.keys(DISEASE_SYMPTOMS);
const PRAKRITI_LIST = ["Vata", "Pitta", "Kapha", "Vata-Pitta", "Vata-Kapha", "Pitta-Kapha", "Tridosha (Sama)"];

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const CASES_KEY = "manglam_symptom_cases";
const PATIENTS_KEY = "mc_patients";

function loadCases(): SymptomCase[] {
  try { return JSON.parse(localStorage.getItem(CASES_KEY) || "[]"); } catch { return []; }
}
function saveCases(cases: SymptomCase[]) {
  localStorage.setItem(CASES_KEY, JSON.stringify(cases));
}
interface RawPatient { name: string; mobile: string; age?: number; visitDate: string; }
function loadPatients(): RawPatient[] {
  try { return JSON.parse(localStorage.getItem(PATIENTS_KEY) || "[]"); } catch { return []; }
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function computeOverall(symptoms: SymptomEntry[]): number {
  const active = symptoms.filter(s => s.severity > 0);
  if (!active.length) return 0;
  return Math.round(active.reduce((s, x) => s + x.severity, 0) / active.length * 10) / 10;
}

function improvementPct(baseline: number, current: number): number {
  if (baseline === 0) return 0;
  return Math.round(((baseline - current) / baseline) * 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// SEVERITY BADGE
// ─────────────────────────────────────────────────────────────────────────────

function SeverityBadge({ val }: { val: number }) {
  const color =
    val === 0 ? "bg-slate-100 text-slate-400" :
    val <= 3  ? "bg-green-100 text-green-700" :
    val <= 6  ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700";
  const label = val === 0 ? "None" : val <= 3 ? "Mild" : val <= 6 ? "Moderate" : "Severe";
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${color}`}>
      {val === 0 ? "—" : `${val}/10`} {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPROVEMENT INDICATOR
// ─────────────────────────────────────────────────────────────────────────────

function ImprovementIcon({ prev, curr }: { prev: number; curr: number }) {
  if (prev === 0 && curr === 0) return <Minus className="w-3.5 h-3.5 text-slate-300" />;
  if (curr < prev) return <TrendingDown className="w-3.5 h-3.5 text-green-500" />;
  if (curr > prev) return <TrendingUp className="w-3.5 h-3.5 text-red-500" />;
  return <Minus className="w-3.5 h-3.5 text-amber-400" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// SYMPTOM RATING SLIDER (used in visit forms)
// ─────────────────────────────────────────────────────────────────────────────

function SymptomSlider({
  symptom, value, onChange, prevValue,
}: { symptom: string; value: number; onChange: (v: number) => void; prevValue?: number }) {
  const color =
    value === 0 ? "accent-slate-300" :
    value <= 3  ? "accent-green-500" :
    value <= 6  ? "accent-amber-500" : "accent-red-500";

  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          {prevValue !== undefined && <ImprovementIcon prev={prevValue} curr={value} />}
          <p className="text-xs font-medium text-slate-700 truncate">{symptom}</p>
        </div>
        <input
          type="range" min={0} max={10} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className={`w-full h-1.5 rounded-full ${color}`}
        />
      </div>
      <div className="shrink-0 text-right w-20">
        <SeverityBadge val={value} />
        {prevValue !== undefined && prevValue !== value && (
          <p className={`text-[9px] mt-0.5 font-bold ${prevValue > value ? "text-green-600" : "text-red-500"}`}>
            {prevValue > value ? `↓ ${prevValue - value}` : `↑ ${value - prevValue}`} from V{/* */}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

function AnalyticsDashboard({ cases }: { cases: SymptomCase[] }) {
  const [filterDisease, setFilterDisease] = useState("All");

  const diseases = useMemo(() => {
    const s = new Set(cases.map(c => c.disease));
    return ["All", ...Array.from(s)];
  }, [cases]);

  const filtered = filterDisease === "All" ? cases : cases.filter(c => c.disease === filterDisease);

  // Per-disease stats
  const diseaseStats = useMemo(() => {
    const map: Record<string, {
      total: number; resolved: number; avgImprovement: number;
      avgDays: number; treatmentSuccess: Record<string, number[]>;
      symptoms: Record<string, number[]>; // symptom name -> improvement % per case
    }> = {};

    for (const c of cases) {
      if (!map[c.disease]) {
        map[c.disease] = { total: 0, resolved: 0, avgImprovement: 0, avgDays: 0, treatmentSuccess: {}, symptoms: {} };
      }
      const d = map[c.disease];
      d.total++;
      if (c.status === "Resolved") d.resolved++;

      if (c.visits.length >= 2) {
        const first = c.visits[0];
        const last  = c.visits[c.visits.length - 1];
        const imp   = improvementPct(first.overallSeverity, last.overallSeverity);
        d.avgImprovement += imp;
        const days = differenceInDays(parseISO(last.date), parseISO(first.date));
        d.avgDays += days;

        // Track treatment success
        const tx = last.treatment || first.treatment || "Unspecified";
        if (!d.treatmentSuccess[tx]) d.treatmentSuccess[tx] = [];
        d.treatmentSuccess[tx].push(imp);

        // Per-symptom improvement
        for (const s of first.symptoms) {
          const latestSym = last.symptoms.find(ls => ls.name === s.name);
          if (latestSym && s.severity > 0) {
            const si = improvementPct(s.severity, latestSym.severity);
            if (!d.symptoms[s.name]) d.symptoms[s.name] = [];
            d.symptoms[s.name].push(si);
          }
        }
      }
    }

    // Average everything
    for (const key of Object.keys(map)) {
      const d = map[key];
      const n = d.total > 0 ? d.total : 1;
      d.avgImprovement = Math.round(d.avgImprovement / n);
      d.avgDays = Math.round(d.avgDays / n);
    }
    return map;
  }, [cases]);

  const overallResolved  = cases.filter(c => c.status === "Resolved").length;
  const overallActive    = cases.filter(c => c.status === "Active").length;
  const avgImpAll = cases.length > 0
    ? Math.round(Object.values(diseaseStats).reduce((s, d) => s + d.avgImprovement, 0) / Object.keys(diseaseStats).length)
    : 0;

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <BarChart2 className="w-14 h-14 mb-3 text-slate-200" />
        <p className="font-semibold text-slate-500">No data yet</p>
        <p className="text-sm mt-1">Start tracking cases to see analytics here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── OVERVIEW CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Cases", value: cases.length, icon: <Users className="w-5 h-5" />, color: "text-blue-600 bg-blue-50" },
          { label: "Active", value: overallActive, icon: <Activity className="w-5 h-5" />, color: "text-amber-600 bg-amber-50" },
          { label: "Resolved", value: overallResolved, icon: <CheckCircle2 className="w-5 h-5" />, color: "text-emerald-600 bg-emerald-50" },
          { label: "Avg Improvement", value: `${avgImpAll}%`, icon: <TrendingDown className="w-5 h-5" />, color: "text-purple-600 bg-purple-50" },
        ].map((card, i) => (
          <div key={i} className="medical-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">{card.label}</p>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTER ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-500 uppercase">Filter by Disease:</span>
        {diseases.map(d => (
          <button key={d} onClick={() => setFilterDisease(d)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterDisease === d
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
            }`}>
            {d}
          </button>
        ))}
      </div>

      {/* ── DISEASE PERFORMANCE TABLE ── */}
      <div className="medical-card overflow-hidden">
        <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" /> Disease Performance Overview
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-500">Disease</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-500">Cases</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-500">Resolved</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-500">Avg Improvement</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-500">Avg Days</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500">Best Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {Object.entries(diseaseStats)
                .filter(([d]) => filterDisease === "All" || d === filterDisease)
                .sort((a, b) => b[1].avgImprovement - a[1].avgImprovement)
                .map(([disease, st]) => {
                  const successRate = st.total > 0 ? Math.round((st.resolved / st.total) * 100) : 0;
                  // Best treatment = highest avg improvement
                  const bestTx = Object.entries(st.treatmentSuccess)
                    .map(([tx, imps]) => ({ tx, avg: Math.round(imps.reduce((s, x) => s + x, 0) / imps.length) }))
                    .sort((a, b) => b.avg - a.avg)[0];

                  return (
                    <tr key={disease} className="hover:bg-emerald-50/30">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{disease}</p>
                        <p className="text-[10px] text-slate-400">{DISEASE_SYMPTOMS[disease]?.group || "Other"}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{st.total}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          successRate >= 70 ? "bg-emerald-100 text-emerald-700" :
                          successRate >= 40 ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"}`}>
                          {st.resolved}/{st.total} ({successRate}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                st.avgImprovement >= 60 ? "bg-emerald-500" :
                                st.avgImprovement >= 30 ? "bg-amber-400" : "bg-red-400"
                              }`}
                              style={{ width: `${Math.min(st.avgImprovement, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700">{st.avgImprovement}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 text-xs font-medium">
                        {st.avgDays > 0 ? `${st.avgDays} days` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-[160px] truncate">
                        {bestTx ? (
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="truncate" title={bestTx.tx}>{bestTx.tx}</span>
                            <span className="text-emerald-600 font-bold shrink-0">({bestTx.avg}%↑)</span>
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SYMPTOM RESPONSE TABLE ── */}
      {filterDisease !== "All" && diseaseStats[filterDisease] && (
        <div className="medical-card overflow-hidden">
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" /> Symptom Response — {filterDisease}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Average improvement % per symptom across all tracked cases</p>
          </div>
          <div className="p-4 space-y-2">
            {Object.entries(diseaseStats[filterDisease].symptoms)
              .map(([sym, imps]) => ({
                sym,
                avg: Math.round(imps.reduce((s, x) => s + x, 0) / imps.length),
                n: imps.length,
              }))
              .sort((a, b) => b.avg - a.avg)
              .map(({ sym, avg, n }) => (
                <div key={sym} className="flex items-center gap-3">
                  <p className="text-xs text-slate-700 w-52 shrink-0 truncate" title={sym}>{sym}</p>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        avg >= 60 ? "bg-emerald-500" : avg >= 30 ? "bg-amber-400" : "bg-red-400"
                      }`}
                      style={{ width: `${Math.min(Math.max(avg, 0), 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-12 text-right">{avg}%</span>
                  <span className="text-[10px] text-slate-400 w-10 text-right">{n} case{n !== 1 ? "s" : ""}</span>
                </div>
              ))}
            {Object.keys(diseaseStats[filterDisease].symptoms).length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                Need ≥2 visits per case to show symptom response data
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CASE DETAIL PANEL
// ─────────────────────────────────────────────────────────────────────────────

function CaseDetail({
  symCase, onUpdate, onClose,
}: {
  symCase: SymptomCase;
  onUpdate: (updated: SymptomCase) => void;
  onClose: () => void;
}) {
  const [addingVisit, setAddingVisit]   = useState(false);
  const [newSymptoms, setNewSymptoms]   = useState<SymptomEntry[]>([]);
  const [newTreatment, setNewTreatment] = useState("");
  const [newNotes, setNewNotes]         = useState("");
  const [newDate, setNewDate]           = useState(format(new Date(), "yyyy-MM-dd"));
  const [customSymptom, setCustomSymptom] = useState("");
  const [expandedVisit, setExpandedVisit] = useState<number | null>(symCase.visits.length - 1);

  // Pre-populate new visit symptoms from disease or last visit
  const startNewVisit = () => {
    const lastVisit = symCase.visits[symCase.visits.length - 1];
    if (lastVisit) {
      // Carry forward last visit's symptoms as starting point
      setNewSymptoms(lastVisit.symptoms.map(s => ({ ...s })));
      setNewTreatment(lastVisit.treatment);
    } else {
      const diseaseSyms = DISEASE_SYMPTOMS[symCase.disease]?.symptoms || [];
      setNewSymptoms(diseaseSyms.map(s => ({ name: s, severity: 0 })));
    }
    setNewDate(format(new Date(), "yyyy-MM-dd"));
    setNewNotes("");
    setAddingVisit(true);
  };

  const saveVisit = () => {
    const overall = computeOverall(newSymptoms);
    const visit: VisitRecord = {
      visitNo: symCase.visits.length + 1,
      date: newDate,
      symptoms: newSymptoms,
      treatment: newTreatment,
      notes: newNotes,
      overallSeverity: overall,
    };
    const activeCount = newSymptoms.filter(s => s.severity > 0).length;
    const baseline = symCase.visits[0];
    const imp = baseline ? improvementPct(baseline.overallSeverity, overall) : 0;

    let status: SymptomCase["status"] = "Active";
    if (activeCount === 0 || imp >= 90) status = "Resolved";
    else if (imp >= 50) status = "Follow-up Needed";

    const updated: SymptomCase = {
      ...symCase,
      visits: [...symCase.visits, visit],
      status,
    };
    onUpdate(updated);
    setAddingVisit(false);
    setExpandedVisit(updated.visits.length - 1);
  };

  const addCustomSymptom = () => {
    if (!customSymptom.trim()) return;
    setNewSymptoms(prev => [...prev, { name: customSymptom.trim(), severity: 0 }]);
    setCustomSymptom("");
  };

  const baseline = symCase.visits[0];
  const latest   = symCase.visits[symCase.visits.length - 1];
  const overallImp = baseline && latest && symCase.visits.length > 1
    ? improvementPct(baseline.overallSeverity, latest.overallSeverity)
    : null;

  const statusColor = symCase.status === "Resolved" ? "bg-emerald-100 text-emerald-700" :
                      symCase.status === "Follow-up Needed" ? "bg-amber-100 text-amber-700" :
                      "bg-blue-100 text-blue-700";

  return (
    <div className="space-y-4">
      {/* ── Case Header ── */}
      <div className="medical-card p-5 bg-gradient-to-br from-emerald-700 to-emerald-900 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                {symCase.status}
              </span>
              <span className="text-emerald-300 text-xs">{symCase.disease}</span>
            </div>
            <h3 className="text-xl font-bold">{symCase.patientName}</h3>
            <p className="text-emerald-300 text-sm">
              {symCase.patientMobile}
              {symCase.patientAge ? ` · ${symCase.patientAge}` : ""}
              {symCase.prakriti ? ` · ${symCase.prakriti} Prakriti` : ""}
            </p>
            <p className="text-emerald-400 text-xs mt-1">
              Started: {format(parseISO(symCase.createdAt), "dd MMM yyyy")}
              {" · "}{symCase.visits.length} visit{symCase.visits.length !== 1 ? "s" : ""}
              {" · "}{symCase.rogaBala} severity
            </p>
          </div>
          <div className="text-right shrink-0">
            {overallImp !== null && (
              <div className={`text-3xl font-bold ${overallImp >= 50 ? "text-green-300" : overallImp >= 0 ? "text-amber-300" : "text-red-300"}`}>
                {overallImp >= 0 ? "↓" : "↑"}{Math.abs(overallImp)}%
              </div>
            )}
            {overallImp !== null && (
              <p className="text-emerald-300 text-xs">Overall improvement</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Symptom Timeline ── */}
      {symCase.visits.length > 1 && (
        <div className="medical-card overflow-hidden">
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" /> Symptom Timeline
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-500 w-48">Symptom</th>
                  {symCase.visits.map((v, i) => (
                    <th key={i} className="px-3 py-2 text-center font-semibold text-slate-500 min-w-[80px]">
                      <div>Visit {v.visitNo}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {format(parseISO(v.date), "dd MMM")}
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center font-semibold text-emerald-600 min-w-[80px]">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {/* Overall row */}
                <tr className="bg-slate-50">
                  <td className="px-4 py-2 font-bold text-slate-700">Overall Severity</td>
                  {symCase.visits.map((v, i) => (
                    <td key={i} className="px-3 py-2 text-center">
                      <SeverityBadge val={v.overallSeverity} />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center">
                    {overallImp !== null && (
                      <span className={`text-xs font-bold ${overallImp >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {overallImp >= 0 ? "↓" : "↑"}{Math.abs(overallImp)}%
                      </span>
                    )}
                  </td>
                </tr>
                {/* Per-symptom rows */}
                {baseline?.symptoms.map((baseSym) => {
                  const firstVal = baseSym.severity;
                  const lastSym = latest?.symptoms.find(s => s.name === baseSym.name);
                  const lastVal = lastSym?.severity ?? firstVal;
                  const imp = improvementPct(firstVal, lastVal);
                  return (
                    <tr key={baseSym.name} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2 text-slate-600">{baseSym.name}</td>
                      {symCase.visits.map((v, i) => {
                        const sv = v.symptoms.find(s => s.name === baseSym.name);
                        return (
                          <td key={i} className="px-3 py-2 text-center">
                            <SeverityBadge val={sv?.severity ?? 0} />
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center">
                        {firstVal > 0 && (
                          <span className={`text-xs font-bold ${imp >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {imp >= 0 ? "↓" : "↑"}{Math.abs(imp)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Visit Records ── */}
      <div className="space-y-3">
        {symCase.visits.map((v, idx) => (
          <div key={idx} className="medical-card overflow-hidden">
            <button
              onClick={() => setExpandedVisit(expandedVisit === idx ? null : idx)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx === 0 ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                }`}>
                  V{v.visitNo}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800">
                    {idx === 0 ? "Initial Visit" : `Follow-up Visit ${idx}`}
                    {" · "}
                    <span className="font-normal text-slate-500">{format(parseISO(v.date), "dd MMM yyyy")}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Overall: {v.overallSeverity}/10
                    {idx > 0 && (
                      <span className={`ml-2 font-bold ${
                        improvementPct(symCase.visits[0].overallSeverity, v.overallSeverity) >= 0
                          ? "text-emerald-600" : "text-red-500"
                      }`}>
                        ({improvementPct(symCase.visits[0].overallSeverity, v.overallSeverity) >= 0 ? "↓" : "↑"}
                        {Math.abs(improvementPct(symCase.visits[0].overallSeverity, v.overallSeverity))}% from baseline)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {expandedVisit === idx ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {expandedVisit === idx && (
              <div className="border-t border-slate-100 p-5 space-y-4">
                {v.treatment && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                    <p className="text-xs font-bold text-emerald-700 mb-1">🌿 Treatment Given</p>
                    <p className="text-sm text-slate-700">{v.treatment}</p>
                  </div>
                )}
                {v.notes && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    <p className="text-xs font-bold text-amber-700 mb-1">📝 Notes</p>
                    <p className="text-sm text-slate-700">{v.notes}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Symptom Ratings</p>
                  {v.symptoms.filter(s => s.severity > 0).map((s, si) => {
                    const prev = idx > 0 ? symCase.visits[idx - 1].symptoms.find(ps => ps.name === s.name)?.severity : undefined;
                    return (
                      <div key={si} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-1.5">
                          {prev !== undefined && <ImprovementIcon prev={prev} curr={s.severity} />}
                          <span className="text-xs text-slate-700">{s.name}</span>
                        </div>
                        <SeverityBadge val={s.severity} />
                      </div>
                    );
                  })}
                  {v.symptoms.every(s => s.severity === 0) && (
                    <p className="text-xs text-emerald-600 font-semibold text-center py-2">✅ All symptoms resolved!</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Add New Visit ── */}
      {!addingVisit ? (
        <button onClick={startNewVisit}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50 font-semibold text-sm transition-colors">
          <Plus className="w-4 h-4" />
          {symCase.visits.length === 0 ? "Record Initial Visit" : "Add Follow-up Visit"}
        </button>
      ) : (
        <div className="medical-card p-5 space-y-4 border-2 border-emerald-200">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800">
              {symCase.visits.length === 0 ? "📋 Initial Visit" : `📋 Follow-up Visit ${symCase.visits.length + 1}`}
            </h4>
            <button onClick={() => setAddingVisit(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Date & Treatment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Visit Date</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Treatment Given (Medicines / Protocol)</label>
              <input value={newTreatment} onChange={e => setNewTreatment(e.target.value)}
                placeholder="e.g. Yogaraj Guggulu 2g BD + Pathya diet"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm" />
            </div>
          </div>

          {/* Symptom Sliders */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Rate Each Symptom (0 = None, 10 = Severe)
            </p>
            <div className="space-y-0 bg-slate-50 rounded-xl p-3">
              {newSymptoms.map((sym, si) => {
                const prevVisit = symCase.visits[symCase.visits.length - 1];
                const prevVal = prevVisit?.symptoms.find(s => s.name === sym.name)?.severity;
                return (
                  <SymptomSlider
                    key={sym.name}
                    symptom={sym.name}
                    value={sym.severity}
                    prevValue={prevVal}
                    onChange={v => setNewSymptoms(prev => prev.map((s, i) => i === si ? { ...s, severity: v } : s))}
                  />
                );
              })}
            </div>
          </div>

          {/* Add Custom Symptom */}
          <div className="flex gap-2">
            <input value={customSymptom} onChange={e => setCustomSymptom(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustomSymptom()}
              placeholder="Add custom symptom..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm" />
            <button onClick={addCustomSymptom}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors">
              + Add
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Doctor's Notes (optional)</label>
            <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)}
              rows={2} placeholder="Any observations, dietary compliance, patient feedback..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm resize-none" />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setAddingVisit(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={saveVisit}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-md">
              Save Visit Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW CASE FORM
// ─────────────────────────────────────────────────────────────────────────────

function NewCaseForm({ onSave, onCancel }: { onSave: (c: SymptomCase) => void; onCancel: () => void }) {
  const [name, setName]       = useState("");
  const [mobile, setMobile]   = useState("");
  const [age, setAge]         = useState("");
  const [disease, setDisease] = useState(DISEASE_LIST[0]);
  const [prakriti, setPrakriti] = useState(PRAKRITI_LIST[0]);
  const [rogaBala, setRogaBala] = useState<SymptomCase["rogaBala"]>("Moderate");
  const [customDisease, setCustomDisease] = useState("");
  const [ptQuery, setPtQuery] = useState("");
  const [ptSuggestions, setPtSuggestions] = useState<RawPatient[]>([]);
  const [showPtDrop, setShowPtDrop] = useState(false);

  // Patient autocomplete
  useEffect(() => {
    if (ptQuery.length >= 2) {
      const q = ptQuery.toLowerCase();
      const uniq = new Map<string, RawPatient>();
      for (const p of loadPatients()) {
        if (p.name.toLowerCase().includes(q) || p.mobile.includes(q)) {
          const key = p.mobile;
          const ex = uniq.get(key);
          if (!ex || p.visitDate > ex.visitDate) uniq.set(key, p);
        }
      }
      const results = Array.from(uniq.values()).slice(0, 6);
      setPtSuggestions(results);
      setShowPtDrop(results.length > 0);
    } else {
      setPtSuggestions([]);
      setShowPtDrop(false);
    }
  }, [ptQuery]);

  const selectPatient = (p: RawPatient) => {
    setName(p.name);
    setMobile(p.mobile);
    setAge(p.age ? String(p.age) : "");
    setPtQuery(p.name);
    setShowPtDrop(false);
  };

  const handleSave = () => {
    if (!name.trim()) return alert("Patient name is required");
    const finalDisease = disease === "Custom Disease" ? (customDisease.trim() || "Custom Disease") : disease;
    const syms = DISEASE_SYMPTOMS[disease]?.symptoms || [];
    const newCase: SymptomCase = {
      id: genId(),
      patientName: name.trim(),
      patientMobile: mobile.trim(),
      patientAge: age.trim(),
      disease: finalDisease,
      diseaseGroup: DISEASE_SYMPTOMS[disease]?.group || "Other",
      prakriti,
      rogaBala,
      createdAt: format(new Date(), "yyyy-MM-dd"),
      visits: [],
      status: "Active",
    };
    // Auto-create first visit shell with disease symptoms
    const initVisit: VisitRecord = {
      visitNo: 1,
      date: format(new Date(), "yyyy-MM-dd"),
      symptoms: syms.map(s => ({ name: s, severity: 0 })),
      treatment: "",
      notes: "",
      overallSeverity: 0,
    };
    newCase.visits = [initVisit];
    onSave(newCase);
  };

  return (
    <div className="medical-card p-6 space-y-5">
      <h3 className="font-bold text-slate-800 text-lg">➕ New Symptom Tracking Case</h3>

      {/* Patient Search */}
      <div>
        <label className="text-xs font-bold text-slate-500 block mb-1">Search Existing Patient</label>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={ptQuery} onChange={e => setPtQuery(e.target.value)}
            placeholder="Type name or mobile to search..."
            className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm" />
          {showPtDrop && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
              {ptSuggestions.map((p, i) => (
                <button key={i} onClick={() => selectPatient(p)}
                  className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0">
                  <p className="text-sm font-bold text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.mobile}{p.age ? ` · ${p.age}y` : ""}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Patient Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">Patient Name *</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Full name"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">Mobile / Case No.</label>
          <input value={mobile} onChange={e => setMobile(e.target.value)}
            placeholder="10-digit mobile"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm font-mono" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">Age</label>
          <input value={age} onChange={e => setAge(e.target.value)}
            placeholder="e.g. 45y"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm" />
        </div>
      </div>

      {/* Disease + Clinical Assessment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">Disease / Condition *</label>
          <select value={disease} onChange={e => setDisease(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm bg-white">
            {DISEASE_LIST.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {disease === "Custom Disease" && (
            <input value={customDisease} onChange={e => setCustomDisease(e.target.value)}
              placeholder="Enter disease name..."
              className="w-full px-3 py-2 mt-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm" />
          )}
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">Prakriti</label>
          <select value={prakriti} onChange={e => setPrakriti(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm bg-white">
            {PRAKRITI_LIST.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">Roga-Bala (Severity)</label>
          <div className="flex gap-2">
            {(["Mild", "Moderate", "Severe"] as const).map(rb => (
              <button key={rb} onClick={() => setRogaBala(rb)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                  rogaBala === rb
                    ? rb === "Mild" ? "bg-green-500 text-white"
                      : rb === "Moderate" ? "bg-amber-500 text-white"
                      : "bg-red-500 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}>
                {rb}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Symptom preview */}
      {DISEASE_SYMPTOMS[disease]?.symptoms.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <p className="text-xs font-bold text-emerald-700 mb-2">
            📋 {DISEASE_SYMPTOMS[disease].symptoms.length} symptoms will be tracked for {disease}:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DISEASE_SYMPTOMS[disease].symptoms.map(s => (
              <span key={s} className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
          Cancel
        </button>
        <button onClick={handleSave}
          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-md">
          Create Case & Record First Visit
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SymptomTracker() {
  const [cases, setCases]             = useState<SymptomCase[]>(() => loadCases());
  const [activeTab, setActiveTab]     = useState<"cases" | "analytics">("cases");
  const [selectedCase, setSelectedCase] = useState<SymptomCase | null>(null);
  const [showNewCase, setShowNewCase] = useState(false);
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | SymptomCase["status"]>("All");

  const persist = (updated: SymptomCase[]) => { setCases(updated); saveCases(updated); };

  const handleNewCase = (c: SymptomCase) => {
    const updated = [c, ...cases];
    persist(updated);
    setShowNewCase(false);
    setSelectedCase(c);
  };

  const handleUpdateCase = (updated: SymptomCase) => {
    const newList = cases.map(c => c.id === updated.id ? updated : c);
    persist(newList);
    setSelectedCase(updated);
  };

  const handleDeleteCase = (id: string) => {
    if (!confirm("Delete this case permanently?")) return;
    const newList = cases.filter(c => c.id !== id);
    persist(newList);
    setSelectedCase(null);
  };

  const filtered = cases.filter(c => {
    const matchSearch = !search ||
      c.patientName.toLowerCase().includes(search.toLowerCase()) ||
      c.disease.toLowerCase().includes(search.toLowerCase()) ||
      c.patientMobile.includes(search);
    const matchStatus = filterStatus === "All" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const activeCases   = cases.filter(c => c.status === "Active").length;
  const resolvedCases = cases.filter(c => c.status === "Resolved").length;
  const followupCases = cases.filter(c => c.status === "Follow-up Needed").length;

  // ── Back to list view
  if (selectedCase) {
    const fresh = cases.find(c => c.id === selectedCase.id) || selectedCase;
    return (
      <Layout>
        <div className="space-y-4">
          {/* Back bar */}
          <div className="sticky top-16 z-30 -mx-4 md:-mx-8 px-4 md:px-8 bg-white/95 backdrop-blur-md border-b border-slate-100 py-3 shadow-sm flex items-center justify-between gap-3">
            <button onClick={() => setSelectedCase(null)}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors">
              <ArrowRight className="w-4 h-4 rotate-180" /> Back to Cases
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const updated = { ...fresh, status: "Resolved" as const };
                  handleUpdateCase(updated);
                }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
              </button>
              <button onClick={() => handleDeleteCase(fresh.id)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-bold transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete Case
              </button>
            </div>
          </div>
          <CaseDetail symCase={fresh} onUpdate={handleUpdateCase} onClose={() => setSelectedCase(null)} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">

        {/* ── HEADER ── */}
        <div className="sticky top-16 z-30 -mx-4 md:-mx-8 px-4 md:px-8 bg-white/95 backdrop-blur-md border-b border-emerald-100 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-lg shrink-0">
                📊
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Symptom Tracker</h2>
                <p className="text-xs text-slate-500">Track patient improvement & treatment outcomes</p>
              </div>
            </div>
            <button onClick={() => setShowNewCase(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-md">
              <Plus className="w-4 h-4" /> New Case
            </button>
          </div>
        </div>

        {/* ── MINI STATS ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active", count: activeCases, color: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-400" },
            { label: "Follow-up", count: followupCases, color: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-400" },
            { label: "Resolved", count: resolvedCases, color: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-400" },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border px-4 py-3 ${s.color}`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                <p className="text-xs font-semibold">{s.label}</p>
              </div>
              <p className="text-2xl font-bold">{s.count}</p>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {(["cases", "analytics"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all capitalize ${
                activeTab === tab
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}>
              {tab === "cases" ? "📋 Cases" : "📊 Analytics"}
            </button>
          ))}
        </div>

        {/* ── NEW CASE FORM ── */}
        {showNewCase && (
          <NewCaseForm onSave={handleNewCase} onCancel={() => setShowNewCase(false)} />
        )}

        {/* ── CASES TAB ── */}
        {activeTab === "cases" && !showNewCase && (
          <div className="space-y-4">
            {/* Search + Filter */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by patient name, disease, mobile..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm shadow-sm" />
              </div>
              <div className="flex gap-1">
                {(["All", "Active", "Follow-up Needed", "Resolved"] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      filterStatus === s
                        ? "bg-emerald-600 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Cases List */}
            {filtered.length === 0 ? (
              <div className="medical-card flex flex-col items-center justify-center py-16 text-slate-400">
                <Stethoscope className="w-12 h-12 mb-3 text-slate-200" />
                <p className="font-semibold text-slate-500">
                  {cases.length === 0 ? "No cases yet" : "No cases match your filter"}
                </p>
                <p className="text-sm mt-1">
                  {cases.length === 0 ? "Click '+ New Case' to start tracking a patient" : "Try changing the filter or search"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(c => {
                  const baseline = c.visits[0];
                  const latest   = c.visits[c.visits.length - 1];
                  const imp = baseline && latest && c.visits.length > 1
                    ? improvementPct(baseline.overallSeverity, latest.overallSeverity)
                    : null;
                  const days = c.visits.length > 1
                    ? differenceInDays(parseISO(latest.date), parseISO(baseline.date))
                    : 0;

                  const statusColor =
                    c.status === "Resolved" ? "border-l-emerald-500 bg-emerald-50/30" :
                    c.status === "Follow-up Needed" ? "border-l-amber-500 bg-amber-50/20" :
                    "border-l-blue-500";

                  return (
                    <button key={c.id} onClick={() => setSelectedCase(c)}
                      className={`medical-card w-full text-left p-4 border-l-4 hover:shadow-md transition-all ${statusColor}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-bold text-slate-900">{c.patientName}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              c.status === "Resolved" ? "bg-emerald-100 text-emerald-700" :
                              c.status === "Follow-up Needed" ? "bg-amber-100 text-amber-700" :
                              "bg-blue-100 text-blue-700"
                            }`}>{c.status}</span>
                          </div>
                          <p className="text-sm text-slate-600">{c.disease}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(parseISO(c.createdAt), "dd MMM yyyy")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {c.visits.length} visit{c.visits.length !== 1 ? "s" : ""}
                            </span>
                            {days > 0 && (
                              <span>{days} days in treatment</span>
                            )}
                            <span>{c.prakriti} · {c.rogaBala}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {imp !== null ? (
                            <>
                              <p className={`text-2xl font-bold ${
                                imp >= 50 ? "text-emerald-600" : imp >= 0 ? "text-amber-500" : "text-red-500"
                              }`}>
                                {imp >= 0 ? "↓" : "↑"}{Math.abs(imp)}%
                              </p>
                              <p className="text-[10px] text-slate-400">improved</p>
                            </>
                          ) : (
                            <p className="text-xs text-slate-400">No follow-up yet</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === "analytics" && (
          <AnalyticsDashboard cases={cases} />
        )}

      </div>
    </Layout>
  );
}
