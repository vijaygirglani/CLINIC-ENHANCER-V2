/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MONTH REPORT CARD
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  The month, played back in about ten seconds: the figures count up, the
 *  daily bars grow, the top diagnoses slide in, the split bar draws itself.
 *  Then it sits still and prints.
 *
 *  This is the screen a doctor shows his CA and his wife, and the reason he
 *  renews next year. Everything in it comes from records already saved —
 *  nothing new is collected to make it work.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Users, IndianRupee, TrendingDown, Wallet, Printer, Leaf, Stethoscope,
  UserPlus, Repeat, Activity,
} from "lucide-react";
import { AnimatedNumber, motionOff } from "@/components/AnimatedNumber";
import { getPatients, type Patient } from "@/lib/store";
import { getDisplayClinic } from "@/lib/displaySettings";

export interface MonthStatsShape {
  totalPatients: number;
  totalFees: number;
  generalPatients: number;
  ayurvedicPatients: number;
  generalFees: number;
  ayurvedicFees: number;
  manualExpenses: number;
  pharmacyExpenses: number;
  totalExpenses: number;
  netTotal: number;
  dailyBreakdown: { date: string; count: number; totalFees: number }[];
  doctorSplit: {
    doctor1: { name: string; pct: number; amount: number };
    doctor2: { name: string; pct: number; amount: number };
  };
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MonthReportCard({
  stats, year, month,
}: {
  stats: MonthStatsShape;
  year: number;
  month: number;      // 1-12
}) {
  const [printing, setPrinting] = useState(false);
  const still = motionOff();
  const clinic = getDisplayClinic();
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  /* ── top diagnoses and new-vs-repeat, from the records themselves ─────── */
  const extra = useMemo(() => {
    let all: Patient[] = [];
    try {
      all = getPatients();
    } catch {
      return { top: [] as { label: string; n: number }[], fresh: 0, repeat: 0 };
    }

    const inMonth = all.filter(p => (p.visitDate || "").startsWith(monthStr));

    // Top complaints. Codes and free text both land here, so normalise
    // lightly: trim, collapse spaces, title-case the first letter.
    const counts: Record<string, number> = {};
    for (const p of inMonth) {
      const raw = (p.complaint || p.complaintCode || "").trim();
      if (!raw) continue;
      const key = raw.replace(/\s+/g, " ").toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    }
    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, n]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), n }));

    // A patient counts as new if their FIRST ever visit falls in this month.
    const firstSeen: Record<string, string> = {};
    for (const p of all) {
      const m = (p.mobile || "").replace(/\D/g, "");
      if (!m) continue;
      const d = p.visitDate || "";
      if (!firstSeen[m] || d < firstSeen[m]) firstSeen[m] = d;
    }
    const seenThisMonth = new Set<string>();
    let fresh = 0;
    let repeat = 0;
    for (const p of inMonth) {
      const m = (p.mobile || "").replace(/\D/g, "");
      if (!m || seenThisMonth.has(m)) continue;
      seenThisMonth.add(m);
      if ((firstSeen[m] || "").startsWith(monthStr)) fresh++;
      else repeat++;
    }

    return { top, fresh, repeat };
  }, [monthStr]);

  const busiestFees = Math.max(1, ...stats.dailyBreakdown.map(d => d.totalFees));
  const totalTyped = stats.generalPatients + stats.ayurvedicPatients;
  const genPct = totalTyped > 0 ? Math.round((stats.generalPatients / totalTyped) * 100) : 0;
  const ayuPct = totalTyped > 0 ? 100 - genPct : 0;
  const peopleTotal = Math.max(1, extra.fresh + extra.repeat);

  const handlePrint = () => {
    setPrinting(true);
    // Let the state land so the animations are finished in the printed copy.
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 120);
  };

  const d = (n: number) => (still || printing ? 0 : n);

  return (
    <div id="print-month" className="medical-card overflow-hidden">
      {/* ── header ── */}
      <div className="px-6 py-5 bg-gradient-to-r from-primary to-cyan-600 text-white flex items-center gap-4">
        <div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-[0.2em]">Month report</p>
          <h2 className="font-display font-bold text-3xl leading-tight text-white">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <p className="text-white/70 text-sm mt-0.5">
            {clinic.clinicName} · {clinic.doctorName}
          </p>
        </div>
        <button type="button" onClick={handlePrint}
          className="ml-auto no-print px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold flex items-center gap-2 transition-colors">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      {/* ── the four figures ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5">
        {[
          { label: "Patients", value: stats.totalPatients, icon: Users, tone: "text-blue-700", bg: "from-blue-50 to-blue-100/40", money: false },
          { label: "Collection", value: stats.totalFees, icon: IndianRupee, tone: "text-emerald-700", bg: "from-emerald-50 to-emerald-100/40", money: true },
          { label: "Expenses", value: stats.totalExpenses, icon: TrendingDown, tone: "text-rose-700", bg: "from-rose-50 to-rose-100/40", money: true },
          { label: "Net", value: stats.netTotal, icon: Wallet, tone: "text-violet-700", bg: "from-violet-50 to-violet-100/40", money: true },
        ].map((c, i) => (
          <motion.div key={c.label}
            initial={still || printing ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: d(i * 0.1), duration: 0.35 }}
            className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${c.bg} p-4`}>
            <c.icon className="absolute -right-3 -bottom-4 w-20 h-20 text-slate-900/5" strokeWidth={1.5} />
            <p className="relative text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{c.label}</p>
            <p className={`relative text-3xl font-display font-bold leading-tight mt-1 ${c.tone}`}>
              <AnimatedNumber value={c.value} format={c.money ? "currency" : "number"} duration={1100} />
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── daily collection bars ── */}
      {stats.dailyBreakdown.length > 0 && (
        <div className="px-5 pb-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Collection by day</p>
          <div className="flex items-end gap-[3px] h-28">
            {stats.dailyBreakdown.map((day, i) => (
              <motion.div key={day.date}
                className="flex-1 min-w-[3px] rounded-t bg-gradient-to-t from-primary/80 to-cyan-400/80 hover:from-primary hover:to-cyan-400"
                initial={still || printing ? false : { height: 0 }}
                animate={{ height: `${Math.max(4, (day.totalFees / busiestFees) * 100)}%` }}
                transition={{ duration: 0.5, delay: d(0.4 + i * 0.015), ease: "easeOut" }}
                title={`${format(new Date(day.date + "T00:00:00"), "dd MMM")} — ₹${day.totalFees.toLocaleString("en-IN")} · ${day.count} patients`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
            <span>{format(new Date(stats.dailyBreakdown[0].date + "T00:00:00"), "dd MMM")}</span>
            <span>{format(new Date(stats.dailyBreakdown[stats.dailyBreakdown.length - 1].date + "T00:00:00"), "dd MMM")}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 px-5 pb-5">
        {/* ── general vs ayurvedic ── */}
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">General vs Ayurvedic</p>
          <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
            <motion.div className="bg-primary"
              initial={still || printing ? false : { width: 0 }}
              animate={{ width: `${genPct}%` }}
              transition={{ duration: 0.8, delay: d(0.5), ease: "easeOut" }} />
            <motion.div className="bg-emerald-500"
              initial={still || printing ? false : { width: 0 }}
              animate={{ width: `${ayuPct}%` }}
              transition={{ duration: 0.8, delay: d(0.6), ease: "easeOut" }} />
          </div>
          <div className="flex justify-between mt-3 text-sm">
            <span className="flex items-center gap-1.5 text-slate-600">
              <Stethoscope className="w-3.5 h-3.5 text-primary" />
              <b className="text-slate-900">{stats.generalPatients}</b> general
              <span className="text-slate-400">· ₹{stats.generalFees.toLocaleString("en-IN")}</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <b className="text-slate-900">{stats.ayurvedicPatients}</b> ayurvedic
              <span className="text-slate-400">· ₹{stats.ayurvedicFees.toLocaleString("en-IN")}</span>
            </span>
          </div>
        </div>

        {/* ── new vs returning ── */}
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">New vs returning people</p>
          <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
            <motion.div className="bg-amber-500"
              initial={still || printing ? false : { width: 0 }}
              animate={{ width: `${(extra.fresh / peopleTotal) * 100}%` }}
              transition={{ duration: 0.8, delay: d(0.7), ease: "easeOut" }} />
            <motion.div className="bg-violet-500"
              initial={still || printing ? false : { width: 0 }}
              animate={{ width: `${(extra.repeat / peopleTotal) * 100}%` }}
              transition={{ duration: 0.8, delay: d(0.8), ease: "easeOut" }} />
          </div>
          <div className="flex justify-between mt-3 text-sm">
            <span className="flex items-center gap-1.5 text-slate-600">
              <UserPlus className="w-3.5 h-3.5 text-amber-600" />
              <b className="text-slate-900">{extra.fresh}</b> new
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <Repeat className="w-3.5 h-3.5 text-violet-600" />
              <b className="text-slate-900">{extra.repeat}</b> returning
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Counted by person, not by visit.</p>
        </div>
      </div>

      {/* ── top complaints ── */}
      {extra.top.length > 0 && (
        <div className="px-5 pb-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> What you treated most
          </p>
          <div className="space-y-1.5">
            {extra.top.map((t, i) => (
              <motion.div key={t.label}
                initial={still || printing ? false : { opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: d(0.9 + i * 0.07), duration: 0.3 }}
                className="flex items-center gap-3">
                <span className="w-5 text-right text-[11px] font-bold text-slate-300 tabular-nums">{i + 1}</span>
                <span className="text-sm text-slate-700 truncate flex-1 min-w-0">{t.label}</span>
                <div className="w-28 sm:w-44 h-2 rounded-full bg-slate-100 overflow-hidden shrink-0">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400"
                    initial={still || printing ? false : { width: 0 }}
                    animate={{ width: `${(t.n / extra.top[0].n) * 100}%` }}
                    transition={{ duration: 0.5, delay: d(1 + i * 0.07), ease: "easeOut" }} />
                </div>
                <span className="w-8 text-right text-xs font-bold text-slate-500 tabular-nums shrink-0">{t.n}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── doctor split ── */}
      <div className="px-5 pb-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 grid grid-cols-2 gap-4">
          {[stats.doctorSplit.doctor1, stats.doctorSplit.doctor2].map((doc, i) => (
            <motion.div key={i}
              initial={still || printing ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: d(1.2 + i * 0.1) }}>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                {doc.name} · {doc.pct}%
              </p>
              <p className="text-xl font-display font-bold text-slate-900">
                <AnimatedNumber value={doc.amount} format="currency" duration={900} />
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MonthReportCard;
