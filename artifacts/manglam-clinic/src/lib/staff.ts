/**
 * staff.ts — who works at the clinic, and which days they were off.
 *
 * Self-contained: imports nothing from store.ts, so the expense ledger and
 * the backup format are untouched by anything in here.
 *
 * Both keys start with `cp_`, which is what the backup sweeps up, so staff
 * and their leave records travel with every backup without another change.
 *
 * ── How a leave is recorded ──────────────────────────────────────────────
 * One row per person per day. A day is either a full day off or a half day;
 * there is no third state, and a person cannot have two rows for one date.
 * That keeps the month's total honest — it is simply the sum of the days.
 *
 * ── Why paid leave is a number per person ───────────────────────────────
 * Marking every single leave paid or unpaid is work nobody keeps up with.
 * Instead each person carries an allowance — "2 paid leaves a month" — and
 * anything past it counts as unpaid. One number, set once, and the month's
 * deduction follows from it.
 */

const STAFF_KEY = "cp_staff";
const LEAVE_KEY = "cp_staff_leaves";

export type LeaveKind = "full" | "half";

export interface Staff {
  id: string;
  name: string;
  role?: string;
  /** Optional. Leave it out and no deduction is ever shown for this person. */
  monthlySalary?: number;
  /** Leaves allowed in a month before anything is deducted. */
  paidLeavesPerMonth: number;
  /** Someone who has left stays in the records but off the current month. */
  active: boolean;
  createdAt: string;
}

export interface Leave {
  id: string;
  staffId: string;
  /** ISO date, yyyy-mm-dd. */
  date: string;
  kind: LeaveKind;
  note?: string;
}

/* ── storage ─────────────────────────────────────────────────────────── */

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, rows: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(rows));
  } catch {
    /* storage full — the screen still shows what is in memory */
  }
  try {
    window.dispatchEvent(new CustomEvent("cp-staff-changed"));
  } catch {
    /* older browser without CustomEvent — nothing depends on this */
  }
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function subscribeStaff(fn: () => void): () => void {
  window.addEventListener("cp-staff-changed", fn);
  return () => window.removeEventListener("cp-staff-changed", fn);
}

/* ── staff ───────────────────────────────────────────────────────────── */

export function getStaff(includeInactive = false): Staff[] {
  const rows = read<Staff>(STAFF_KEY)
    .filter(s => s && s.id && s.name)
    .map(s => ({ ...s, paidLeavesPerMonth: Number(s.paidLeavesPerMonth) || 0 }));
  const list = includeInactive ? rows : rows.filter(s => s.active !== false);
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export function addStaff(input: {
  name: string; role?: string; monthlySalary?: number; paidLeavesPerMonth?: number;
}): Staff {
  const row: Staff = {
    id: uid(),
    name: input.name.trim(),
    role: input.role?.trim() || undefined,
    monthlySalary: input.monthlySalary && input.monthlySalary > 0 ? input.monthlySalary : undefined,
    paidLeavesPerMonth: Number(input.paidLeavesPerMonth) || 0,
    active: true,
    createdAt: new Date().toISOString(),
  };
  write(STAFF_KEY, [...read<Staff>(STAFF_KEY), row]);
  return row;
}

export function updateStaff(id: string, patch: Partial<Omit<Staff, "id" | "createdAt">>): void {
  write(STAFF_KEY, read<Staff>(STAFF_KEY).map(s => (s.id === id ? { ...s, ...patch } : s)));
}

/**
 * Removing someone deletes their leave history too, which is the one
 * destructive thing in here — the caller is expected to confirm first.
 */
export function removeStaff(id: string): void {
  write(STAFF_KEY, read<Staff>(STAFF_KEY).filter(s => s.id !== id));
  write(LEAVE_KEY, read<Leave>(LEAVE_KEY).filter(l => l.staffId !== id));
}

/** Keeps the person and every past record, but drops them off this month. */
export function deactivateStaff(id: string): void {
  updateStaff(id, { active: false });
}

/* ── leaves ──────────────────────────────────────────────────────────── */

export function getLeaves(): Leave[] {
  return read<Leave>(LEAVE_KEY).filter(l => l && l.staffId && l.date);
}

export function leaveOn(staffId: string, date: string): Leave | undefined {
  return getLeaves().find(l => l.staffId === staffId && l.date === date);
}

/**
 * One click on a day walks it round: nothing → full day → half day → nothing.
 * Far quicker than a dialog per leave, which is what this screen is for.
 */
export function cycleLeave(staffId: string, date: string): LeaveKind | null {
  const rows = read<Leave>(LEAVE_KEY);
  const i = rows.findIndex(l => l.staffId === staffId && l.date === date);

  if (i === -1) {
    rows.push({ id: uid(), staffId, date, kind: "full" });
    write(LEAVE_KEY, rows);
    return "full";
  }
  if (rows[i].kind === "full") {
    rows[i] = { ...rows[i], kind: "half" };
    write(LEAVE_KEY, rows);
    return "half";
  }
  rows.splice(i, 1);
  write(LEAVE_KEY, rows);
  return null;
}

export function setLeave(staffId: string, date: string, kind: LeaveKind, note?: string): void {
  const rows = read<Leave>(LEAVE_KEY).filter(l => !(l.staffId === staffId && l.date === date));
  rows.push({ id: uid(), staffId, date, kind, note });
  write(LEAVE_KEY, rows);
}

export function clearLeave(staffId: string, date: string): void {
  write(LEAVE_KEY, read<Leave>(LEAVE_KEY).filter(l => !(l.staffId === staffId && l.date === date)));
}

/* ── the month ───────────────────────────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-11" for the given year and 1-based month. */
export function monthPrefix(year: number, month: number): string {
  return `${year}-${pad(month)}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function isoFor(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function leavesForMonth(staffId: string, year: number, month: number): Leave[] {
  const prefix = monthPrefix(year, month);
  return getLeaves()
    .filter(l => l.staffId === staffId && l.date.startsWith(prefix))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface MonthSummary {
  staff: Staff;
  leaves: Leave[];
  fullDays: number;
  halfDays: number;
  /** Full days plus half of the half days — the number that matters. */
  totalDays: number;
  /** Anything past the person's allowance. */
  unpaidDays: number;
  /** Monthly salary ÷ 30, the usual convention. Null without a salary. */
  dailyRate: number | null;
  /** unpaidDays × dailyRate, rounded. Null without a salary. */
  deduction: number | null;
}

export function summaryFor(staff: Staff, year: number, month: number): MonthSummary {
  const leaves = leavesForMonth(staff.id, year, month);
  const fullDays = leaves.filter(l => l.kind === "full").length;
  const halfDays = leaves.filter(l => l.kind === "half").length;
  const totalDays = fullDays + halfDays * 0.5;
  const unpaidDays = Math.max(0, totalDays - (staff.paidLeavesPerMonth || 0));

  const dailyRate = staff.monthlySalary && staff.monthlySalary > 0
    ? staff.monthlySalary / 30
    : null;

  return {
    staff, leaves, fullDays, halfDays, totalDays, unpaidDays, dailyRate,
    deduction: dailyRate === null ? null : Math.round(unpaidDays * dailyRate),
  };
}

export function summariesFor(year: number, month: number): MonthSummary[] {
  return getStaff().map(s => summaryFor(s, year, month));
}

/** Everyone off on a given day — used for the "who is off today" line. */
export function offOn(date: string): Array<{ staff: Staff; kind: LeaveKind }> {
  const staff = getStaff();
  return getLeaves()
    .filter(l => l.date === date)
    .map(l => {
      const s = staff.find(x => x.id === l.staffId);
      return s ? { staff: s, kind: l.kind } : null;
    })
    .filter(Boolean) as Array<{ staff: Staff; kind: LeaveKind }>;
}
