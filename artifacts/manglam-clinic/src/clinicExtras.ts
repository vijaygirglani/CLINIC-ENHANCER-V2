/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Small stores that sit beside the patient records
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Allergies, the daily collection target, the idle-screen delay, and the
 *  running total of pending fees recovered.
 *
 *  All of it lives under `cp_` keys, so the lossless backup in store.ts sweeps
 *  it up automatically — nothing to add to the backup code. And nothing here
 *  imports store.ts, so patient records cannot be affected by any of it.
 */

/* ── allergies ────────────────────────────────────────────────────────────
   Deliberately free text keyed by mobile, not one of the PRESET_TAGS. An
   allergy is "penicillin, sulpha" — a word, not a checkbox — and it is the
   one thing on the screen that must never be missed, so it gets its own
   store rather than sitting among twenty chronic tags. */

const ALLERGY_KEY = "cp_allergies";

function normMobile(m: string): string {
  return (m || "").replace(/\D/g, "");
}

export function getAllergy(mobile: string): string {
  try {
    const all = JSON.parse(localStorage.getItem(ALLERGY_KEY) || "{}");
    return all[normMobile(mobile)] || "";
  } catch {
    return "";
  }
}

export function setAllergy(mobile: string, text: string): void {
  const key = normMobile(mobile);
  if (!key) return;
  try {
    const all = JSON.parse(localStorage.getItem(ALLERGY_KEY) || "{}");
    const t = (text || "").trim();
    if (t) all[key] = t;
    else delete all[key];
    localStorage.setItem(ALLERGY_KEY, JSON.stringify(all));
  } catch {
    /* storage full or blocked — the allergy just is not saved */
  }
}

/* ── clinic targets & shell settings ──────────────────────────────────────── */

export interface ClinicExtras {
  /** daily collection target, ₹. 0 hides the ring. */
  dailyTarget: number;
  /** minutes of no input before the idle screen appears. 0 turns it off. */
  idleMinutes: number;
}

const EXTRAS_KEY = "cp_clinic_extras";

export const DEFAULT_EXTRAS: ClinicExtras = {
  dailyTarget: 5000,
  idleMinutes: 5,
};

export function getExtras(): ClinicExtras {
  try {
    return { ...DEFAULT_EXTRAS, ...JSON.parse(localStorage.getItem(EXTRAS_KEY) || "{}") };
  } catch {
    return DEFAULT_EXTRAS;
  }
}

export function saveExtras(e: ClinicExtras): void {
  try {
    localStorage.setItem(EXTRAS_KEY, JSON.stringify(e));
    window.dispatchEvent(new Event("cp-extras-changed"));
  } catch {
    /* storage blocked */
  }
}

/* ── pending fees recovered ───────────────────────────────────────────────
   Every time a pending fee is marked paid, the amount is added here. After a
   few months this number is the plainest answer to "what did this app
   actually do for me". */

const RECOVERED_KEY = "cp_fees_recovered";

export interface Recovered {
  total: number;
  count: number;
  since: string;
}

export function getRecovered(): Recovered {
  try {
    const r = JSON.parse(localStorage.getItem(RECOVERED_KEY) || "{}");
    return {
      total: Number(r.total) || 0,
      count: Number(r.count) || 0,
      since: r.since || new Date().toISOString(),
    };
  } catch {
    return { total: 0, count: 0, since: new Date().toISOString() };
  }
}

export function addRecovered(amount: number): Recovered {
  const cur = getRecovered();
  const next: Recovered = {
    total: cur.total + (Number(amount) || 0),
    count: cur.count + 1,
    since: cur.since,
  };
  try {
    localStorage.setItem(RECOVERED_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("cp-recovered-changed"));
  } catch {
    /* storage blocked */
  }
  return next;
}

/* ── weight parsing ───────────────────────────────────────────────────────
   The weight field is free text — "12", "12 kg", "12.5kg", "8kg 200g" all
   turn up in real registers. Pull the first number out and ignore the rest. */

export function parseWeightKg(raw: string | number | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === "number") return isFinite(raw) && raw > 0 ? raw : null;
  const m = String(raw).match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!isFinite(n) || n <= 0 || n > 400) return null;
  return n;
}

/** Age in months from the two fields the form captures. */
export function ageInMonths(age?: number, ageMonths?: number): number | null {
  const y = Number(age) || 0;
  const m = Number(ageMonths) || 0;
  const total = y * 12 + m;
  return total > 0 ? total : null;
}
