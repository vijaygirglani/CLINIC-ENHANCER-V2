/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  GOOGLE SHEET → TOKEN QUEUE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Your staff type arriving patients into a Google Sheet. This reads that
 *  sheet and turns each row into a token, so the queue builds itself and all
 *  you do is press Call Next.
 *
 *  It uses the SAME sheet you already set up on the registration page — the
 *  URL lives under `manglam_sheet_url`, so there is nothing new to configure.
 *
 *  The sheet is treated as "today's list", which is how you said your staff
 *  work it: cleared every morning, so every row in it is someone waiting now.
 *
 *  Rows already turned into a token are never added twice. A row is matched
 *  by mobile number when there is one, and by name when there is not, so
 *  re-syncing a minute later only picks up what the staff added since.
 */

import {
  getQueue, issueToken, queueToday, type QueueEntry,
} from "@/lib/queue";

export const SHEET_KEY = "manglam_sheet_url";

/* ── the sheet itself ─────────────────────────────────────────────────────── */

export interface SheetPatient {
  name: string;
  mobile: string;
  age: string;
  note: string;
}

export function extractSheetId(input: string): string | null {
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(input.trim())) return input.trim();
  return null;
}

export function getSavedSheetId(): string | null {
  try {
    const raw = localStorage.getItem(SHEET_KEY) || "";
    return raw ? extractSheetId(raw) || raw : null;
  } catch {
    return null;
  }
}

function csvUrl(sheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
}

/** Split one CSV line, respecting quoted fields. */
function splitCsvLine(line: string): string[] {
  const cols: string[] = [];
  let cur = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
    else cur += ch;
  }
  cols.push(cur.trim());
  return cols;
}

export async function fetchSheetPatients(sheetId: string): Promise<SheetPatient[]> {
  // A cache-buster, or the browser serves the copy it fetched a minute ago and
  // the whole point of auto-sync is lost.
  const res = await fetch(`${csvUrl(sheetId)}&_=${Date.now()}`);
  if (!res.ok) {
    throw new Error("Could not read the sheet. In Google Sheets use File → Share → Publish to web, as CSV.");
  }
  const text = await res.text();
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ""));
  const idx = (names: string[]) => names.reduce((found, n) => (found >= 0 ? found : header.indexOf(n)), -1);
  const nameIdx   = idx(["name", "patientname", "patient"]);
  const mobileIdx = idx(["mobile", "mobileno", "phone", "caseno", "case"]);
  const ageIdx    = idx(["age"]);
  const noteIdx   = idx(["note", "remark", "remarks", "complaint", "reason"]);

  const out: SheetPatient[] = [];
  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line);
    const name = (nameIdx >= 0 ? cols[nameIdx] || "" : "").trim();
    if (!name) continue;                       // a blank row is not a patient
    out.push({
      name,
      mobile: (mobileIdx >= 0 ? cols[mobileIdx] || "" : "").trim(),
      age:    (ageIdx    >= 0 ? cols[ageIdx]    || "" : "").trim(),
      note:   (noteIdx   >= 0 ? cols[noteIdx]   || "" : "").trim(),
    });
  }
  return out;
}

/* ── matching a sheet row to a token already issued ───────────────────────── */

/** Mobile digits when there are enough of them, otherwise the squashed name. */
export function rowKey(name: string, mobile: string): string {
  const digits = (mobile || "").replace(/\D/g, "");
  if (digits.length >= 10) return "m:" + digits.slice(-10);
  return "n:" + (name || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function keysAlreadyInQueue(date: string): Set<string> {
  const keys = new Set<string>();
  for (const e of getQueue(date)) {
    keys.add(rowKey(e.name, e.mobile));
    if (e.sourceKey) keys.add(e.sourceKey);
  }
  return keys;
}

/* ── the sync ─────────────────────────────────────────────────────────────── */

export interface SyncResult {
  added: number;
  skipped: number;
  total: number;
  firstToken: number | null;
  entries: QueueEntry[];
}

/**
 * Read the sheet and give a token to everyone not already in today's queue.
 * Tokens are issued in sheet order, so the list your staff typed is the order
 * you call people in.
 */
export async function syncQueueFromSheet(sheetId: string): Promise<SyncResult> {
  const rows = await fetchSheetPatients(sheetId);
  const date = queueToday();
  const seen = keysAlreadyInQueue(date);

  const entries: QueueEntry[] = [];
  let skipped = 0;

  for (const row of rows) {
    const key = rowKey(row.name, row.mobile);
    if (seen.has(key)) { skipped++; continue; }
    seen.add(key);                     // guards against duplicates within the sheet too
    const entry = issueToken({
      name: row.name,
      mobile: row.mobile,
      age: row.age,
      note: row.note,
      source: "sheet",
      sourceKey: key,
    });
    entries.push(entry);
  }

  return {
    added: entries.length,
    skipped,
    total: rows.length,
    firstToken: entries.length ? entries[0].token : null,
    entries,
  };
}
