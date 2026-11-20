/**
 * symptoms.ts — turning free-typed complaints into something countable.
 *
 * ── The problem ──────────────────────────────────────────────────────────
 * Complaints are typed by hand, in a hurry, by different people. The same
 * illness arrives as "fever", "Fever ", "taav", "temp since 2 days",
 * "fever + cold". Counting raw strings would produce a list of four hundred
 * one-off complaints and tell you nothing.
 *
 * So each complaint is split into parts, each part is normalised, and known
 * spellings and local words are folded onto one canonical name. "Cough, cold
 * and fever" becomes three countable symptoms.
 *
 * ── What it deliberately does NOT do ─────────────────────────────────────
 * It does not diagnose, and it does not guess. Anything it cannot recognise
 * is kept under the doctor's own words rather than being forced into a
 * bucket or thrown away — a wrong bucket is worse than an honest "other".
 *
 * The synonym table is plain data at the top of this file. Add to it as you
 * notice words your patients actually use.
 */

import { getPatients, getComplaintCodes, type Patient } from "@/lib/store";

/* ── the vocabulary ──────────────────────────────────────────────────────
   Left side is the canonical name that gets counted and shown.
   Right side is every spelling that should fold onto it. All lower case. */
export const SYNONYMS: Record<string, string[]> = {
  "Fever": ["fever", "feber", "fevar", "taav", "tav", "bukhar", "pyrexia",
            "temperature", "temp", "high temp", "jwar", "jvar"],
  "Cough": ["cough", "caugh", "khansi", "khasi", "kas", "dry cough", "wet cough"],
  "Cold": ["cold", "sardi", "coryza", "running nose", "runny nose", "nasal discharge",
           "blocked nose", "nose block", "sneezing", "chhik"],
  "Sore throat": ["sore throat", "throat pain", "throat ache", "gada dukhe", "gale me dard"],
  "Headache": ["headache", "head ache", "head pain", "sir dard", "sirdard",
               "matha dukhe", "mathu dukhe"],
  "Body ache": ["body ache", "bodyache", "body pain", "bodypain", "angdukhavo",
                "badan dard", "sharir dard", "myalgia"],
  "Vomiting": ["vomiting", "vomit", "vomitting", "ulti", "ulty", "emesis", "nausea"],
  "Loose motions": ["loose motion", "loose motions", "loosemotion", "diarrhoea",
                    "diarrhea", "jhada", "zada", "dast", "motions"],
  "Stomach pain": ["stomach pain", "stomach ache", "abdominal pain", "abdomen pain",
                   "pet dard", "pet ma dukhavo", "pet dukhe", "gastritis", "acidity"],
  "Constipation": ["constipation", "kabjiyat", "kabj"],
  "Weakness": ["weakness", "fatigue", "tiredness", "tired", "kamjori", "lethargy"],
  "Skin rash": ["rash", "skin rash", "itching", "khaj", "kharas", "allergy",
                "skin allergy", "urticaria", "eczema"],
  "Joint pain": ["joint pain", "knee pain", "arthritis", "sandha dukhe", "ghutne me dard"],
  "Back pain": ["back pain", "backache", "back ache", "kamar dard", "pith dukhe"],
  "Breathlessness": ["breathlessness", "breathless", "dyspnoea", "dyspnea",
                     "shortness of breath", "sas chadhvo", "asthma", "wheezing"],
  "Ear pain": ["ear pain", "earache", "ear ache", "kan dukhe", "otalgia"],
  "Eye complaint": ["eye pain", "red eye", "watering eyes", "conjunctivitis", "aankh dukhe"],
  "Dental": ["tooth pain", "toothache", "dental pain", "dant dukhe", "danth dard"],
  "Injury": ["injury", "wound", "cut", "fall", "trauma", "fracture", "sprain"],
  "Burning urine": ["burning urine", "burning micturition", "uti", "urine infection",
                    "peshab me jalan"],
  "Giddiness": ["giddiness", "dizziness", "vertigo", "chakkar"],
  "Check-up": ["check up", "checkup", "routine", "follow up", "followup", "review"],
};

/** Built once: every spelling pointing at its canonical name. */
const LOOKUP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const [canon, words] of Object.entries(SYNONYMS)) {
    m[canon.toLowerCase()] = canon;
    for (const w of words) m[w] = canon;
  }
  return m;
})();

/** Words that carry no clinical meaning on their own. */
const NOISE = new Set([
  "and", "with", "since", "days", "day", "week", "weeks", "month", "months",
  "yr", "yrs", "year", "years", "ago", "x", "c/o", "co", "complaint", "of",
  "for", "from", "the", "a", "an", "patient", "pt", "severe", "mild", "slight",
]);

/** Tidy one fragment: lower case, no punctuation at the edges, no doubled spaces. */
function tidy(part: string): string {
  return part
    .toLowerCase()
    .replace(/[.,;:!?()\[\]{}"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Strip the duration tail people add — "fever since 3 days" → "fever". */
function stripDuration(s: string): string {
  return s
    .replace(/\b(since|from|for|x)\b.*$/i, "")
    .replace(/\b\d+\s*(d|day|days|w|week|weeks|m|month|months|hr|hrs|hour|hours)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Split a complaint into canonical symptoms.
 *
 * Unknown text is kept, title-cased, rather than discarded — the doctor's own
 * words are better than losing the record.
 */
export function parseComplaint(text: string | undefined): string[] {
  if (!text) return [];

  const parts = text
    .split(/[,/+;&\n]|\band\b|\bwith\b/i)
    .map(tidy)
    .map(stripDuration)
    .filter(Boolean);

  const out: string[] = [];

  for (const part of parts) {
    if (!part || NOISE.has(part)) continue;

    // whole fragment first — "loose motions" should not be read as "motions"
    const direct = LOOKUP[part];
    if (direct) { if (!out.includes(direct)) out.push(direct); continue; }

    // then the longest known phrase contained in it
    let best: string | null = null;
    let bestLen = 0;
    for (const [spelling, canon] of Object.entries(LOOKUP)) {
      if (spelling.length > bestLen && part.includes(spelling)) {
        best = canon; bestLen = spelling.length;
      }
    }
    if (best) { if (!out.includes(best)) out.push(best); continue; }

    // unknown — keep the doctor's own words
    const words = part.split(" ").filter(w => !NOISE.has(w));
    if (words.length === 0) continue;
    const kept = words.join(" ").trim();
    if (kept.length < 2) continue;
    const titled = kept.charAt(0).toUpperCase() + kept.slice(1);
    if (!out.includes(titled)) out.push(titled);
  }

  return out;
}

/** True for a symptom this module recognised rather than passed through. */
export function isKnownSymptom(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(SYNONYMS, name);
}

/* ── pulling symptoms off real visits ────────────────────────────────── */

let codeTextCache: Record<string, string> | null = null;

/** A complaint code resolves to its full complaint text. */
function complaintCodeText(code: string | undefined): string {
  if (!code) return "";
  if (!codeTextCache) {
    codeTextCache = {};
    try {
      for (const c of getComplaintCodes()) {
        if (c?.code) codeTextCache[String(c.code).toLowerCase()] = c.complaint || "";
      }
    } catch {
      codeTextCache = {};
    }
  }
  return codeTextCache[String(code).toLowerCase()] || "";
}

/** Call after complaint codes change, so the next read picks them up. */
export function resetSymptomCaches(): void {
  codeTextCache = null;
}

export function symptomsOf(visit: Patient): string[] {
  const fromCode = complaintCodeText(visit.complaintCode);
  const text = [visit.complaint, fromCode].filter(Boolean).join(", ");
  return parseComplaint(text);
}

/* ── one patient over time ───────────────────────────────────────────── */

export interface VisitEntry {
  visit: Patient;
  date: string;
  symptoms: string[];
  /** Days since this patient's previous visit, null for the first. */
  gapDays: number | null;
}

export interface RepeatFlag {
  symptom: string;
  count: number;
  /** Days between the first and last visit carrying it. */
  spanDays: number;
  dates: string[];
}

export interface PatientHistory {
  key: string;
  name: string;
  mobile: string;
  entries: VisitEntry[];
  /** Symptoms seen more than once, most frequent first. */
  repeats: RepeatFlag[];
  totalVisits: number;
  firstVisit: string;
  lastVisit: string;
}

function dayDiff(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86400000
  );
}

/** Patients are identified by mobile where there is one, else by name. */
export function identityKey(p: Patient): string {
  const digits = (p.mobile || "").replace(/\D/g, "");
  if (digits.length >= 10) return "m:" + digits.slice(-10);
  return "n:" + (p.name || "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function historyFor(key: string): PatientHistory | null {
  const visits = getPatients()
    .filter(p => p && p.visitDate && identityKey(p) === key)
    .sort((a, b) => a.visitDate.localeCompare(b.visitDate));

  if (visits.length === 0) return null;

  const entries: VisitEntry[] = visits.map((v, i) => ({
    visit: v,
    date: v.visitDate,
    symptoms: symptomsOf(v),
    gapDays: i === 0 ? null : dayDiff(visits[i - 1].visitDate, v.visitDate),
  }));

  const bySymptom = new Map<string, string[]>();
  for (const e of entries) {
    for (const s of e.symptoms) {
      if (!bySymptom.has(s)) bySymptom.set(s, []);
      bySymptom.get(s)!.push(e.date);
    }
  }

  const repeats: RepeatFlag[] = [];
  for (const [symptom, dates] of bySymptom) {
    if (dates.length < 2) continue;
    repeats.push({
      symptom,
      count: dates.length,
      spanDays: dayDiff(dates[0], dates[dates.length - 1]),
      dates,
    });
  }
  repeats.sort((a, b) => b.count - a.count || a.symptom.localeCompare(b.symptom));

  const latest = visits[visits.length - 1];

  return {
    key,
    name: latest.name,
    mobile: latest.mobile,
    entries: entries.reverse(), // newest first for display
    repeats,
    totalVisits: visits.length,
    firstVisit: visits[0].visitDate,
    lastVisit: latest.visitDate,
  };
}

/** Everyone who has been to the clinic, most recent first. */
export interface PatientRef {
  key: string;
  name: string;
  mobile: string;
  visits: number;
  lastVisit: string;
}

export function allPatients(): PatientRef[] {
  const map = new Map<string, PatientRef>();
  for (const p of getPatients()) {
    if (!p || !p.visitDate) continue;
    const key = identityKey(p);
    const found = map.get(key);
    if (!found) {
      map.set(key, { key, name: p.name, mobile: p.mobile, visits: 1, lastVisit: p.visitDate });
    } else {
      found.visits++;
      if (p.visitDate > found.lastVisit) {
        found.lastVisit = p.visitDate;
        found.name = p.name;
        found.mobile = p.mobile;
      }
    }
  }
  return [...map.values()].sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
}

/* ── what is going around ────────────────────────────────────────────── */

export interface SymptomCount {
  symptom: string;
  count: number;
  /** Count in the comparison period, for the arrow. */
  previous: number;
  known: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function monthPrefix(year: number, month: number): string {
  return `${year}-${pad(month)}`;
}

function countsForPrefix(prefix: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of getPatients()) {
    if (!p || !p.visitDate || !p.visitDate.startsWith(prefix)) continue;
    for (const s of symptomsOf(p)) {
      counts.set(s, (counts.get(s) || 0) + 1);
    }
  }
  return counts;
}

/** Top symptoms this month, each with last month's count beside it. */
export function trendsFor(year: number, month: number, limit = 12): SymptomCount[] {
  const now = countsForPrefix(monthPrefix(year, month));
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prev = countsForPrefix(monthPrefix(prevYear, prevMonth));

  return [...now.entries()]
    .map(([symptom, count]) => ({
      symptom,
      count,
      previous: prev.get(symptom) || 0,
      known: isKnownSymptom(symptom),
    }))
    .sort((a, b) => b.count - a.count || a.symptom.localeCompare(b.symptom))
    .slice(0, limit);
}

/** Visits per day across one month, for the shape of the month. */
export function dailyCounts(year: number, month: number, symptom?: string): number[] {
  const days = new Date(year, month, 0).getDate();
  const out = new Array(days).fill(0);
  const prefix = monthPrefix(year, month);

  for (const p of getPatients()) {
    if (!p || !p.visitDate || !p.visitDate.startsWith(prefix)) continue;
    if (symptom && !symptomsOf(p).includes(symptom)) continue;
    const d = Number(p.visitDate.slice(8, 10));
    if (d >= 1 && d <= days) out[d - 1]++;
  }
  return out;
}

/** The last twelve months of one symptom, oldest first — the seasonal shape. */
export function twelveMonths(year: number, month: number, symptom?: string):
  Array<{ label: string; year: number; month: number; count: number }> {
  const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const out: Array<{ label: string; year: number; month: number; count: number }> = [];

  for (let back = 11; back >= 0; back--) {
    let m = month - back;
    let y = year;
    while (m <= 0) { m += 12; y -= 1; }
    const prefix = monthPrefix(y, m);

    let count = 0;
    for (const p of getPatients()) {
      if (!p || !p.visitDate || !p.visitDate.startsWith(prefix)) continue;
      if (symptom) {
        if (symptomsOf(p).includes(symptom)) count++;
      } else {
        count++;
      }
    }
    out.push({ label: MONTH_SHORT[m - 1], year: y, month: m, count });
  }
  return out;
}

/** How many separate patients reported a symptom this month. */
export function patientsWith(symptom: string, year: number, month: number): number {
  const prefix = monthPrefix(year, month);
  const seen = new Set<string>();
  for (const p of getPatients()) {
    if (!p || !p.visitDate || !p.visitDate.startsWith(prefix)) continue;
    if (symptomsOf(p).includes(symptom)) seen.add(identityKey(p));
  }
  return seen.size;
}
