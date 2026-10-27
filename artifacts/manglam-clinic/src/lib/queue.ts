/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TOKEN QUEUE — the clinic waiting list
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Deliberately self-contained. It does NOT import from store.ts, so it can
 *  never break — or be broken by — the patient records layer.
 *
 *  Storage key is `cp_token_queue`, which means the lossless backup in
 *  store.ts (snapshotAllKeys, which sweeps every cp_ / manglam_ / mc_ key)
 *  picks the queue up automatically. Nothing to add to the backup code.
 *
 *  Token numbers restart at 1 every day on their own, because numbering is
 *  computed per date — there is no nightly reset to remember or forget.
 *
 *  Every mutation fires a `cp-queue-changed` window event, and the module
 *  also listens to the browser `storage` event, so a second window (the
 *  waiting-room display on another monitor) stays in step with the desk
 *  without polling.
 */

export type QueueStatus = "waiting" | "serving" | "done" | "skipped";

export interface QueueEntry {
  id: number;
  token: number;
  name: string;
  mobile: string;
  age?: string;
  note?: string;
  registerType?: "general" | "ayurvedic";
  status: QueueStatus;
  /** yyyy-MM-dd — the clinic day this token belongs to */
  date: string;
  arrivedAt: string;
  calledAt?: string;
  doneAt?: string;
  /** set once the consultation is saved, so the token links to the record */
  patientId?: number;
  /** bumped by recall() so a display screen can flash the same token again */
  announceCount?: number;
}

export interface QueueStats {
  waiting: number;
  serving: number;
  done: number;
  skipped: number;
  total: number;
  nowServing: QueueEntry | null;
  upNext: QueueEntry[];
  nextToken: number;
  /** average minutes from arrival to being called, for tokens called today */
  avgWaitMin: number;
  /** minutes the longest-waiting patient has been sitting there */
  longestWaitMin: number;
}

const QUEUE_KEY = "cp_token_queue";
export const QUEUE_EVENT = "cp-queue-changed";

/* ── date helper ─────────────────────────────────────────────────────────── */

export function queueToday(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/* ── raw read / write ────────────────────────────────────────────────────── */

function readAll(): QueueEntry[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Drop anything malformed rather than letting one bad row kill the page.
    return parsed.filter(
      (e: any) =>
        e &&
        typeof e.id === "number" &&
        typeof e.token === "number" &&
        typeof e.date === "string",
    ) as QueueEntry[];
  } catch {
    return [];
  }
}

function writeAll(list: QueueEntry[]): void {
  // Keep only the last 14 days. A queue row is tiny, but there is no reason
  // to carry last March's tokens around in a 5 MB budget forever.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffStr = (() => {
    const m = String(cutoff.getMonth() + 1).padStart(2, "0");
    const d = String(cutoff.getDate()).padStart(2, "0");
    return `${cutoff.getFullYear()}-${m}-${d}`;
  })();
  const trimmed = list.filter(e => e.date >= cutoffStr);

  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed));
  } catch (e: any) {
    const name = e?.name || "";
    if (
      name === "QuotaExceededError" ||
      name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      e?.code === 22 ||
      e?.code === 1014
    ) {
      throw new Error(
        "Storage is full, so the token could not be saved. Take a backup and clear old data from Daily Register → Clear Data.",
      );
    }
    throw e;
  }
  notify();
}

/* ── change notification ─────────────────────────────────────────────────── */

function notify(): void {
  try {
    window.dispatchEvent(new Event(QUEUE_EVENT));
  } catch {
    /* non-browser context — nothing to notify */
  }
}

/**
 * Subscribe to queue changes. Returns an unsubscribe function.
 * Fires for changes made in this window AND in any other window/tab.
 */
export function subscribeQueue(fn: () => void): () => void {
  const onLocal = () => fn();
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === QUEUE_KEY) fn();
  };
  window.addEventListener(QUEUE_EVENT, onLocal);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(QUEUE_EVENT, onLocal);
    window.removeEventListener("storage", onStorage);
  };
}

/* ── reads ───────────────────────────────────────────────────────────────── */

/** All tokens for a day, lowest token first. */
export function getQueue(date: string = queueToday()): QueueEntry[] {
  return readAll()
    .filter(e => e.date === date)
    .sort((a, b) => a.token - b.token);
}

export function getNextTokenNumber(date: string = queueToday()): number {
  const day = getQueue(date);
  return day.length === 0 ? 1 : Math.max(...day.map(e => e.token)) + 1;
}

function minutesBetween(fromISO: string, toISO?: string): number {
  const from = new Date(fromISO).getTime();
  const to = toISO ? new Date(toISO).getTime() : Date.now();
  if (!isFinite(from) || !isFinite(to)) return 0;
  return Math.max(0, Math.round((to - from) / 60000));
}

/** How long this patient has been waiting, in minutes. */
export function waitMinutes(e: QueueEntry): number {
  if (e.status === "waiting") return minutesBetween(e.arrivedAt);
  return minutesBetween(e.arrivedAt, e.calledAt);
}

export function getQueueStats(date: string = queueToday()): QueueStats {
  const day = getQueue(date);
  const waiting = day.filter(e => e.status === "waiting");
  const serving = day.filter(e => e.status === "serving");
  const done = day.filter(e => e.status === "done");
  const skipped = day.filter(e => e.status === "skipped");

  const called = day.filter(e => e.calledAt);
  const avgWaitMin =
    called.length === 0
      ? 0
      : Math.round(
          called.reduce((s, e) => s + minutesBetween(e.arrivedAt, e.calledAt), 0) /
            called.length,
        );

  const longestWaitMin =
    waiting.length === 0 ? 0 : Math.max(...waiting.map(e => minutesBetween(e.arrivedAt)));

  return {
    waiting: waiting.length,
    serving: serving.length,
    done: done.length,
    skipped: skipped.length,
    total: day.length,
    nowServing: serving[0] || null,
    upNext: waiting.slice(0, 3),
    nextToken: getNextTokenNumber(date),
    avgWaitMin,
    longestWaitMin,
  };
}

/* ── writes ──────────────────────────────────────────────────────────────── */

export interface IssueTokenInput {
  name: string;
  mobile?: string;
  age?: string;
  note?: string;
  registerType?: "general" | "ayurvedic";
}

/** Put a patient in the waiting list and hand them a token number. */
export function issueToken(input: IssueTokenInput): QueueEntry {
  const date = queueToday();
  const all = readAll();
  const entry: QueueEntry = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    token: getNextTokenNumber(date),
    name: (input.name || "").trim() || "Patient",
    mobile: (input.mobile || "").trim(),
    age: (input.age || "").trim() || undefined,
    note: (input.note || "").trim() || undefined,
    registerType: input.registerType,
    status: "waiting",
    date,
    arrivedAt: new Date().toISOString(),
  };
  all.push(entry);
  writeAll(all);
  return entry;
}

/**
 * Call the next patient in.
 *
 * Any token already `serving` is closed off as `done` first — which is what
 * actually happens in an OPD: you call the next one when you have finished
 * with this one. Returns the newly called entry, or null if nobody is waiting.
 */
export function callNext(date: string = queueToday()): QueueEntry | null {
  const all = readAll();
  const now = new Date().toISOString();

  for (const e of all) {
    if (e.date === date && e.status === "serving") {
      e.status = "done";
      e.doneAt = now;
    }
  }

  const next = all
    .filter(e => e.date === date && e.status === "waiting")
    .sort((a, b) => a.token - b.token)[0];

  if (!next) {
    writeAll(all);
    return null;
  }

  next.status = "serving";
  next.calledAt = now;
  next.announceCount = (next.announceCount || 0) + 1;
  writeAll(all);
  return next;
}

/** Call one specific token in, out of order. */
export function callToken(id: number): QueueEntry | null {
  const all = readAll();
  const target = all.find(e => e.id === id);
  if (!target) return null;
  const now = new Date().toISOString();

  for (const e of all) {
    if (e.date === target.date && e.status === "serving" && e.id !== id) {
      e.status = "done";
      e.doneAt = now;
    }
  }
  target.status = "serving";
  target.calledAt = now;
  target.doneAt = undefined;
  target.announceCount = (target.announceCount || 0) + 1;
  writeAll(all);
  return target;
}

/** Flash the current token again on the display screen. */
export function recallCurrent(date: string = queueToday()): QueueEntry | null {
  const all = readAll();
  const current = all.find(e => e.date === date && e.status === "serving");
  if (!current) return null;
  current.announceCount = (current.announceCount || 0) + 1;
  writeAll(all);
  return current;
}

/** Mark a token finished, optionally linking it to the saved patient record. */
export function completeToken(id: number, patientId?: number): void {
  const all = readAll();
  const e = all.find(x => x.id === id);
  if (!e) return;
  e.status = "done";
  e.doneAt = new Date().toISOString();
  if (patientId !== undefined) e.patientId = patientId;
  writeAll(all);
}

/**
 * Close off whoever is currently being seen. Called after a consultation is
 * saved, so the doctor never has to tick the token off by hand.
 */
export function completeCurrent(patientId?: number, date: string = queueToday()): QueueEntry | null {
  const all = readAll();
  const current = all.find(e => e.date === date && e.status === "serving");
  if (!current) return null;
  current.status = "done";
  current.doneAt = new Date().toISOString();
  if (patientId !== undefined) current.patientId = patientId;
  writeAll(all);
  return current;
}

/** Patient did not turn up — park the token without losing it. */
export function skipToken(id: number): void {
  const all = readAll();
  const e = all.find(x => x.id === id);
  if (!e) return;
  e.status = "skipped";
  writeAll(all);
}

/** Put a skipped or finished token back in the waiting list. */
export function restoreToken(id: number): void {
  const all = readAll();
  const e = all.find(x => x.id === id);
  if (!e) return;
  e.status = "waiting";
  e.calledAt = undefined;
  e.doneAt = undefined;
  writeAll(all);
}

/** Remove a token entirely — for a mis-typed entry. */
export function removeToken(id: number): void {
  writeAll(readAll().filter(e => e.id !== id));
}

export function updateToken(id: number, patch: Partial<IssueTokenInput>): void {
  const all = readAll();
  const e = all.find(x => x.id === id);
  if (!e) return;
  if (patch.name !== undefined) e.name = patch.name.trim() || e.name;
  if (patch.mobile !== undefined) e.mobile = patch.mobile.trim();
  if (patch.age !== undefined) e.age = patch.age.trim() || undefined;
  if (patch.note !== undefined) e.note = patch.note.trim() || undefined;
  if (patch.registerType !== undefined) e.registerType = patch.registerType;
  writeAll(all);
}

/** Wipe one day's queue. Used by the "Clear finished" / "Reset day" buttons. */
export function clearQueue(date: string = queueToday()): void {
  writeAll(readAll().filter(e => e.date !== date));
}

/** Remove only the done + skipped rows, keeping the live queue intact. */
export function clearFinished(date: string = queueToday()): void {
  writeAll(
    readAll().filter(
      e => !(e.date === date && (e.status === "done" || e.status === "skipped")),
    ),
  );
}
