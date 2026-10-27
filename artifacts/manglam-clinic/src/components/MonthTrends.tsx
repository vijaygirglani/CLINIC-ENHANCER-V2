/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MonthTrends — the shape of the practice over time
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Two comparisons the month report could not show on its own:
 *
 *   1. THIS MONTH AGAINST LAST — the same day of each month side by side, so
 *      you can see whether the 12th was busier this time than last.
 *   2. TWELVE MONTHS — collection and patients month by month, with the month
 *      you are looking at marked, so a season or a slide shows up plainly.
 *
 *  Everything is computed from records already saved. Switch between
 *  collection and patient count with the toggle.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, IndianRupee, Users } from "lucide-react";
import { motionOff } from "@/components/AnimatedNumber";
import { getPatients, type Patient } from "@/lib/store";

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

type Metric = "fees" | "count";

interface MonthBucket {
  year: number;
  month: number;         // 1-12
  label: string;
  fees: number;
  count: number;
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Step back n months from a year/month pair. */
function stepBack(year: number, month: number, n: number): { year: number; month: number } {
  const zero = year * 12 + (month - 1) - n;
  return { year: Math.floor(zero / 12), month: (zero % 12) + 1 };
}

export function MonthTrends({ year, month }: { year: number; month: number }) {
  const [metric, setMetric] = useState<Metric>("fees");
  const still = motionOff();

  const data = useMemo(() => {
    let all: Patient[] = [];
    try { all = getPatients(); } catch { all = []; }

    // ── twelve months ending with the one being viewed ──
    const buckets: MonthBucket[] = [];
    const index: Record<string, MonthBucket> = {};
    for (let i = 11; i >= 0; i--) {
      const { year: y, month: m } = stepBack(year, month, i);
      const b: MonthBucket = { year: y, month: m, label: MONTH_SHORT[m - 1], fees: 0, count: 0 };
      buckets.push(b);
      index[monthKey(y, m)] = b;
    }

    // ── day-by-day for this month and the one before ──
    const prev = stepBack(year, month, 1);
    const thisKey = monthKey(year, month);
    const prevKey = monthKey(prev.year, prev.month);
    const thisDays: number[] = new Array(32).fill(0);
    const prevDays: number[] = new Array(32).fill(0);
    const thisDayCount: number[] = new Array(32).fill(0);
    const prevDayCount: number[] = new Array(32).fill(0);

    for (const p of all) {
      const d = p.visitDate || "";
      if (d.length < 7) continue;
      const key = d.slice(0, 7);
      const b = index[key];
      if (b) { b.fees += p.fees || 0; b.count += 1; }

      const day = Number(d.slice(8, 10));
      if (!day || day < 1 || day > 31) continue;
      if (key === thisKey) { thisDays[day] += p.fees || 0; thisDayCount[day] += 1; }
      else if (key === prevKey) { prevDays[day] += p.fees || 0; prevDayCount[day] += 1; }
    }

    const current = index[thisKey];
    const previous = index[prevKey];

    return {
      buckets,
      thisDays, prevDays, thisDayCount, prevDayCount,
      current, previous,
      prevLabel: `${MONTH_SHORT[prev.month - 1]} ${prev.year}`,
      thisLabel: `${MONTH_SHORT[month - 1]} ${year}`,
    };
  }, [year, month]);

  const val = (b: MonthBucket) => (metric === "fees" ? b.fees : b.count);
  const maxMonth = Math.max(1, ...data.buckets.map(val));

  const dayThis = metric === "fees" ? data.thisDays : data.thisDayCount;
  const dayPrev = metric === "fees" ? data.prevDays : data.prevDayCount;
  const maxDay = Math.max(1, ...dayThis, ...dayPrev);

  const curVal = data.current ? val(data.current) : 0;
  const prevVal = data.previous ? val(data.previous) : 0;
  const diff = curVal - prevVal;
  const pct = prevVal > 0 ? Math.round((diff / prevVal) * 100) : null;

  const fmt = (n: number) => (metric === "fees" ? "₹" + n.toLocaleString("en-IN") : String(n));
  const d = (n: number) => (still ? 0 : n);

  return (
    <div className="medical-card overflow-hidden">
      {/* header + metric switch */}
      <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
        <p className="font-display font-bold text-slate-800">Comparison</p>
        <div className="ml-auto flex gap-1 p-0.5 rounded-xl bg-slate-100">
          {([["fees", "Collection", IndianRupee], ["count", "Patients", Users]] as const).map(([k, label, Icon]) => (
            <button key={k} type="button" onClick={() => setMetric(k as Metric)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors
                ${metric === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* the headline: this month against last */}
      <div className="px-5 py-4 flex flex-wrap items-center gap-4 bg-gradient-to-r from-slate-50 to-white">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{data.thisLabel}</p>
          <p className="text-2xl font-display font-bold text-slate-900">{fmt(curVal)}</p>
        </div>
        <div className="text-slate-300">vs</div>
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{data.prevLabel}</p>
          <p className="text-2xl font-display font-bold text-slate-400">{fmt(prevVal)}</p>
        </div>
        <div className={`ml-auto px-3 py-2 rounded-xl flex items-center gap-2 text-sm font-bold
          ${diff > 0 ? "bg-emerald-100 text-emerald-700" : diff < 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
          {diff > 0 ? <TrendingUp className="w-4 h-4" /> : diff < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          {diff === 0 ? "level" : `${diff > 0 ? "+" : "−"}${fmt(Math.abs(diff))}`}
          {pct !== null && diff !== 0 && (
            <span className="font-semibold opacity-70">({diff > 0 ? "+" : "−"}{Math.abs(pct)}%)</span>
          )}
        </div>
      </div>

      {/* day by day, both months */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-4 mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Day by day</p>
          <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary" /> {data.thisLabel}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-300" /> {data.prevLabel}
          </span>
        </div>
        <div className="flex items-end gap-[2px] h-24">
          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
            const a = dayThis[day] || 0;
            const b = dayPrev[day] || 0;
            return (
              <div key={day} className="flex-1 flex items-end justify-center gap-[1px] h-full group relative"
                title={`${day} — ${data.thisLabel}: ${fmt(a)} · ${data.prevLabel}: ${fmt(b)}`}>
                {/* last month sits behind, in grey */}
                <motion.div className="w-1/2 rounded-t-sm bg-slate-200"
                  initial={still ? false : { height: 0 }}
                  animate={{ height: `${(b / maxDay) * 100}%` }}
                  transition={{ duration: 0.45, delay: d(day * 0.008), ease: "easeOut" }} />
                <motion.div className="w-1/2 rounded-t-sm bg-gradient-to-t from-primary to-cyan-400"
                  initial={still ? false : { height: 0 }}
                  animate={{ height: `${(a / maxDay) * 100}%` }}
                  transition={{ duration: 0.45, delay: d(0.1 + day * 0.008), ease: "easeOut" }} />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-slate-400">
          <span>1</span><span>8</span><span>15</span><span>22</span><span>31</span>
        </div>
      </div>

      {/* twelve months */}
      <div className="px-5 pb-5 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Last twelve months</p>
        {/* Bar heights are in PIXELS, not percentages: a percentage height
            inside an auto-sized flex column has nothing to resolve against,
            so the bars collapse to nothing. BAR_AREA is the definite height
            they are measured against. */}
        <div className="flex items-end gap-1.5">
          {data.buckets.map((b, i) => {
            const isCurrent = b.year === year && b.month === month;
            const v = val(b);
            const BAR_AREA = 112;
            const h = v > 0 ? Math.max(6, (v / maxMonth) * BAR_AREA) : 3;
            return (
              <div key={`${b.year}-${b.month}`} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <span className={`text-[10px] font-bold tabular-nums truncate w-full text-center
                  ${isCurrent ? "text-primary" : "text-slate-400"}`}>
                  {v > 0 ? (metric === "fees" ? Math.round(v / 1000) + "k" : v) : ""}
                </span>
                <div className="w-full flex items-end" style={{ height: BAR_AREA }}>
                  <motion.div
                    className={`w-full rounded-t-md ${v === 0
                      ? "bg-slate-100"
                      : isCurrent
                        ? "bg-gradient-to-t from-primary to-cyan-400"
                        : "bg-slate-200 hover:bg-slate-300"}`}
                    initial={still ? false : { height: 0 }}
                    animate={{ height: h }}
                    transition={{ duration: 0.5, delay: d(i * 0.04), ease: "easeOut" }}
                    title={`${b.label} ${b.year} — ${fmt(v)}`}
                  />
                </div>
                <span className={`text-[10px] ${isCurrent ? "font-bold text-primary" : "text-slate-400"}`}>
                  {b.label}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          {metric === "fees" ? "Figures above the bars are in thousands." : "Patients seen each month."}
        </p>
      </div>
    </div>
  );
}

export default MonthTrends;
