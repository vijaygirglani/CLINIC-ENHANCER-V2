/**
 * StaffLeave — who was off, and how often, this month.
 *
 * The whole point is the strip of days beside each person. One click on a
 * day walks it round: nothing → full day → half day → nothing. Marking a
 * week of leave is five clicks, not five dialogs, which is the difference
 * between a register that gets kept and one that does not.
 *
 * Everything is per month, matching the month picker the Expenses page
 * already has, so the two halves of the page always talk about the same
 * stretch of time.
 */

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  UserPlus, Users, Trash2, Edit2, Download, CalendarDays,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/export";
import { motionOff } from "@/components/AnimatedNumber";
import {
  getStaff, addStaff, updateStaff, removeStaff, cycleLeave, leaveOn,
  summariesFor, subscribeStaff, daysInMonth, isoFor, offOn,
  type Staff, type MonthSummary,
} from "@/lib/staff";

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

const money = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN");

/** Trailing zeros look wrong on a day count: 2 not 2.0, but 2.5 stays 2.5. */
const days = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function StaffLeave({ year, month }: { year: number; month: number }) {
  const { toast } = useToast();
  const still = motionOff();

  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);
  useEffect(() => subscribeStaff(refresh), [refresh]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState({ name: "", role: "", salary: "", paidLeaves: "0" });

  // Read straight through on every render rather than memoising: the source
  // is localStorage, which a tap changes behind React's back, so a memo would
  // just go stale.
  const rows: MonthSummary[] = summariesFor(year, month);

  const total = daysInMonth(year, month);
  const todayIso = (() => {
    const d = new Date();
    return isoFor(d.getFullYear(), d.getMonth() + 1, d.getDate());
  })();
  const offToday = offOn(todayIso);

  /* ── staff dialog ─────────────────────────────────────────────────── */

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", role: "", salary: "", paidLeaves: "0" });
    setDialogOpen(true);
  };

  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({
      name: s.name,
      role: s.role || "",
      salary: s.monthlySalary ? String(s.monthlySalary) : "",
      paidLeaves: String(s.paidLeavesPerMonth || 0),
    });
    setDialogOpen(true);
  };

  const save = () => {
    const name = form.name.trim();
    if (!name) {
      toast({ variant: "destructive", title: "Name needed", description: "Enter the person's name." });
      return;
    }
    const payload = {
      name,
      role: form.role.trim() || undefined,
      monthlySalary: form.salary ? Number(form.salary) : undefined,
      paidLeavesPerMonth: Number(form.paidLeaves) || 0,
    };
    if (editing) {
      updateStaff(editing.id, payload);
      toast({ title: "Saved", description: `${name} updated.` });
    } else {
      addStaff(payload);
      toast({ title: "Added", description: `${name} added to the staff list.` });
    }
    setDialogOpen(false);
    refresh();
  };

  const confirmRemove = (s: Staff) => {
    if (!confirm(`Remove ${s.name}?\n\nThis also deletes every leave recorded for them. This cannot be undone.`)) return;
    removeStaff(s.id);
    toast({ title: "Removed", description: `${s.name} and their leave records were deleted.` });
    refresh();
  };

  /* ── export ───────────────────────────────────────────────────────── */

  const handleExport = () => {
    if (rows.length === 0) {
      toast({ variant: "destructive", title: "No staff", description: "Add someone first." });
      return;
    }
    const out = rows.map(r => ({
      Name: r.staff.name,
      Role: r.staff.role || "",
      "Full days": r.fullDays,
      "Half days": r.halfDays,
      "Total leave days": r.totalDays,
      "Paid allowance": r.staff.paidLeavesPerMonth || 0,
      "Unpaid days": r.unpaidDays,
      "Monthly salary (₹)": r.staff.monthlySalary ?? "",
      "Deduction (₹)": r.deduction ?? "",
      Dates: r.leaves.map(l => `${Number(l.date.slice(8))}${l.kind === "half" ? "(½)" : ""}`).join(", "),
    }));
    exportToExcel(out, `Staff_Leave_${MONTHS[month - 1]}_${year}`);
    toast({ title: "Exported", description: "Staff leave exported to Excel." });
  };

  /* ── render ───────────────────────────────────────────────────────── */

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          Leave recorded for <strong className="text-slate-700">{MONTHS[month - 1]} {year}</strong>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExport}
            className="px-3 py-2 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-1.5 text-sm">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={openNew}
            className="px-4 py-2 rounded-xl font-semibold bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm">
            <UserPlus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      {/* who is off today */}
      {offToday.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-900">
          <strong>Off today:</strong>{" "}
          {offToday.map(o => `${o.staff.name}${o.kind === "half" ? " (half day)" : ""}`).join(", ")}
        </div>
      )}

      {/* nobody yet */}
      {rows.length === 0 ? (
        <div className="medical-card p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7" />
          </div>
          <p className="font-semibold text-slate-700">No staff added yet</p>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            Add the people who work at the clinic, then tap a day beside a name
            to mark leave. Tap again for a half day, once more to clear it.
          </p>
          <button onClick={openNew}
            className="mt-5 px-4 py-2.5 rounded-xl font-semibold bg-primary text-white shadow-lg shadow-primary/25 text-sm inline-flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Add the first person
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((r, i) => (
            <StaffRow
              key={r.staff.id}
              row={r}
              year={year}
              month={month}
              totalDays={total}
              todayIso={todayIso}
              index={i}
              still={still}
              onChange={refresh}
              onEdit={() => openEdit(r.staff)}
              onRemove={() => confirmRemove(r.staff)}
            />
          ))}

          {/* month total across everyone */}
          <div className="medical-card p-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
            <span className="text-sm font-semibold text-slate-600">
              {MONTHS[month - 1]} total — {rows.length} {rows.length === 1 ? "person" : "people"}
            </span>
            <div className="flex flex-wrap items-center gap-5 text-sm">
              <span className="text-slate-600">
                <strong className="text-slate-900 text-base">
                  {days(rows.reduce((s, r) => s + r.totalDays, 0))}
                </strong> leave days
              </span>
              {rows.some(r => r.deduction !== null) && (
                <span className="text-rose-600 font-semibold">
                  {money(rows.reduce((s, r) => s + (r.deduction || 0), 0))} deduction
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── add / edit ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit staff" : "Add staff"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <Field label="Name">
              <input autoFocus value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Rekha Ben"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
            </Field>
            <Field label="Role (optional)">
              <input value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                placeholder="e.g. Receptionist, Compounder"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Monthly salary (optional)">
                <input type="number" inputMode="numeric" value={form.salary}
                  onChange={e => setForm(f => ({ ...f, salary: e.target.value }))}
                  placeholder="e.g. 12000"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
              </Field>
              <Field label="Paid leaves a month">
                <input type="number" inputMode="numeric" min={0} step={0.5} value={form.paidLeaves}
                  onChange={e => setForm(f => ({ ...f, paidLeaves: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
              </Field>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Leave the salary blank and no deduction is ever shown for this
              person — the leave count still works. With a salary filled in,
              anything past the paid allowance is charged at salary ÷ 30 a day.
            </p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setDialogOpen(false)}
                className="flex-1 py-3 rounded-xl font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                Cancel
              </button>
              <button onClick={save}
                className="flex-1 py-3 rounded-xl font-semibold bg-primary text-white shadow-lg shadow-primary/25 transition-all">
                {editing ? "Save" : "Add"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── one person ────────────────────────────────────────────────────────── */

function StaffRow({
  row, year, month, totalDays, todayIso, index, still, onChange, onEdit, onRemove,
}: {
  row: MonthSummary;
  year: number;
  month: number;
  totalDays: number;
  todayIso: string;
  index: number;
  still: boolean;
  onChange: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { staff } = row;

  const tap = (day: number) => {
    cycleLeave(staff.id, isoFor(year, month, day));
    onChange();
  };

  return (
    <motion.div
      initial={still ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: still ? 0 : Math.min(index * 0.04, 0.3) }}
      className="medical-card p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-bold text-slate-800 leading-tight">{staff.name}</p>
          <p className="text-xs text-slate-500">
            {staff.role || "Staff"}
            {staff.monthlySalary ? ` · ${money(staff.monthlySalary)}/month` : ""}
            {staff.paidLeavesPerMonth ? ` · ${days(staff.paidLeavesPerMonth)} paid` : ""}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-display font-extrabold text-2xl text-slate-900 leading-none tabular-nums">
              {days(row.totalDays)}
            </p>
            <p className="text-[10px] uppercase font-bold text-slate-400">
              {row.totalDays === 1 ? "day off" : "days off"}
            </p>
          </div>
          <div className="flex gap-1">
            <button onClick={onEdit} title="Edit"
              className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onRemove} title="Remove"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* the month, one square per day */}
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
          const iso = isoFor(year, month, day);
          const lv = leaveOn(staff.id, iso);
          const isToday = iso === todayIso;
          const isSunday = new Date(year, month - 1, day).getDay() === 0;

          const base = "relative w-7 h-7 rounded-md text-[10px] font-bold flex items-center justify-center transition-all select-none";
          // A half day is a lighter fill with a ½ in the corner, not a split
          // background — the diagonal split swallowed the date underneath it.
          const look = lv?.kind === "full"
            ? "bg-rose-500 text-white shadow-sm"
            : lv?.kind === "half"
            ? "bg-rose-100 text-rose-900 ring-1 ring-rose-400"
            : isSunday
            ? "bg-slate-100 text-slate-400 hover:bg-slate-200"
            : "bg-slate-50 text-slate-500 hover:bg-slate-200";

          return (
            <button
              key={day}
              onClick={() => tap(day)}
              title={`${day} ${MONTHS[month - 1]}${lv ? (lv.kind === "half" ? " — half day" : " — full day") : ""}`}
              className={`${base} ${look} ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}`}
            >
              {day}
              {lv?.kind === "half" && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 text-white text-[7px] leading-3 text-center">
                  ½
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* the numbers under it */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-xs text-slate-500">
        <span>{row.fullDays} full</span>
        <span>{row.halfDays} half</span>
        {staff.paidLeavesPerMonth > 0 && (
          <span className={row.unpaidDays > 0 ? "text-amber-700 font-semibold" : "text-emerald-700 font-semibold"}>
            {row.unpaidDays > 0 ? `${days(row.unpaidDays)} beyond allowance` : "within allowance"}
          </span>
        )}
        {/* money() already writes the ₹, so there is no rupee icon beside it */}
        {row.deduction !== null && row.deduction > 0 && (
          <span className="text-rose-600 font-semibold inline-flex items-center gap-1">
            {money(row.deduction)} deduction
            <span className="text-slate-400 font-normal">
              (at {money(row.dailyRate || 0)}/day)
            </span>
          </span>
        )}
      </div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default StaffLeave;
