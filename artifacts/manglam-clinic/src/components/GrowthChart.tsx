/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  GROWTH CHART — a child's weight across visits
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  You have been capturing `weight` and `ageMonths` on every patient since the
 *  app was built and nothing has ever read them back. This draws them.
 *
 *  The line draws itself left to right, the points land one after another and
 *  today's point arrives last with a ring around it.
 *
 *  ── A deliberate omission ────────────────────────────────────────────────
 *  There are no WHO percentile bands behind the line. I am not going to put
 *  reference curves on a chart you will show a parent unless the numbers come
 *  from the real table — invented ones would look authoritative and be wrong.
 *  Give me the WHO weight-for-age table you want to use and I will add the
 *  bands properly.
 *
 *  What it does show is the thing that actually matters between visits:
 *  how much the child gained, over how long, and whether the weight went
 *  DOWN — which is flagged in red.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Baby, AlertTriangle, Weight as WeightIcon } from "lucide-react";
import { motionOff } from "@/components/AnimatedNumber";
import { parseWeightKg, ageInMonths } from "@/lib/clinicExtras";

export interface GrowthVisit {
  visitDate: string;
  weight?: string | number;
  age?: number;
  ageMonths?: number;
}

interface Point {
  t: number;        // ms since epoch
  kg: number;
  label: string;
  months: number | null;
}

/** A child, for this purpose: 12 years or under on the most recent visit. */
export function looksLikeChild(visits: GrowthVisit[]): boolean {
  if (!visits.length) return false;
  const latest = visits[0];
  const months = ageInMonths(latest.age, latest.ageMonths);
  if (months === null) return false;
  return months <= 12 * 12;
}

/** Enough weights recorded to be worth drawing. */
export function hasGrowthData(visits: GrowthVisit[]): boolean {
  return visits.filter(v => parseWeightKg(v.weight) !== null).length >= 2;
}

export function GrowthChart({ visits, name }: { visits: GrowthVisit[]; name?: string }) {
  const points = useMemo<Point[]>(() => {
    const out: Point[] = [];
    for (const v of visits) {
      const kg = parseWeightKg(v.weight);
      if (kg === null) continue;
      const t = new Date(v.visitDate).getTime();
      if (!isFinite(t)) continue;
      out.push({
        t,
        kg,
        label: format(new Date(v.visitDate), "dd MMM yy"),
        months: ageInMonths(v.age, v.ageMonths),
      });
    }
    // Oldest first, so the line reads left to right.
    return out.sort((a, b) => a.t - b.t);
  }, [visits]);

  // Is this a child? Only decides the wording and the icon now — the chart
  // itself is drawn for anybody with two weights on record, because weight
  // over time matters just as much for a diabetic or a thyroid patient.
  const latestMonths = visits.length ? ageInMonths(visits[0].age, visits[0].ageMonths) : null;
  const isChild = latestMonths !== null && latestMonths <= 12 * 12;
  const Icon = isChild ? Baby : WeightIcon;
  const heading = isChild ? "Growth" : "Weight";

  // Nothing recorded at all — stay out of the way.
  if (points.length === 0) return null;

  // Exactly one weight: no line to draw yet, but say so, otherwise the
  // feature is invisible and nobody knows to record it again next time.
  if (points.length === 1) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
        <p className="text-xs text-slate-500">
          <b className="text-slate-700">{points[0].kg} kg</b> on {points[0].label}.
          Record the weight once more and a {heading.toLowerCase()} chart appears here.
        </p>
      </div>
    );
  }

  /* ── geometry ───────────────────────────────────────────────────────── */
  const W = 460;
  const H = 180;
  // Right padding leaves room for the "10.6 kg" label above the last point,
  // which otherwise runs off the edge of the chart.
  const PAD = { l: 38, r: 30, t: 20, b: 26 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const tMin = points[0].t;
  const tMax = points[points.length - 1].t;
  const tSpan = Math.max(1, tMax - tMin);

  const kgs = points.map(p => p.kg);
  let kgMin = Math.min(...kgs);
  let kgMax = Math.max(...kgs);
  // Breathing room, and never a flat line pinned to one edge.
  const padKg = Math.max(0.5, (kgMax - kgMin) * 0.25);
  kgMin = Math.max(0, kgMin - padKg);
  kgMax = kgMax + padKg;
  const kgSpan = Math.max(0.5, kgMax - kgMin);

  const x = (t: number) => PAD.l + ((t - tMin) / tSpan) * innerW;
  const y = (kg: number) => PAD.t + innerH - ((kg - kgMin) / kgSpan) * innerH;

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.t).toFixed(1)} ${y(p.kg).toFixed(1)}`).join(" ");
  const areaPath =
    `${path} L ${x(points[points.length - 1].t).toFixed(1)} ${(PAD.t + innerH).toFixed(1)}` +
    ` L ${x(points[0].t).toFixed(1)} ${(PAD.t + innerH).toFixed(1)} Z`;

  // Four y gridlines at round-ish values.
  const ticks = [0, 1, 2, 3].map(i => kgMin + (kgSpan * i) / 3);

  /* ── the numbers under the chart ────────────────────────────────────── */
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const deltaKg = last.kg - prev.kg;
  const days = Math.max(1, Math.round((last.t - prev.t) / 86400000));
  const lost = deltaKg < -0.05;
  const flat = Math.abs(deltaKg) <= 0.05;

  const spanLabel =
    days >= 60 ? `${Math.round(days / 30)} months` : days >= 14 ? `${Math.round(days / 7)} weeks` : `${days} days`;

  const still = motionOff();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-gradient-to-r from-sky-50 to-white">
        <Icon className="w-4 h-4 text-sky-600" />
        <p className="text-sm font-bold text-slate-800">{heading}</p>
        <span className="ml-auto text-[11px] text-slate-400">
          {points.length} weights recorded
        </span>
      </div>

      <div className="px-2 pt-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
          aria-label={`Weight chart for ${name || "this patient"}: ${points.map(p => `${p.label} ${p.kg} kilograms`).join(", ")}`}>
          {/* gridlines + y labels */}
          {ticks.map((kg, i) => (
            <g key={i}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(kg)} y2={y(kg)} stroke="#e2e8f0" strokeWidth="1" />
              <text x={PAD.l - 6} y={y(kg) + 3.5} textAnchor="end" fontSize="9" fill="#94a3b8">
                {kg.toFixed(kgSpan < 4 ? 1 : 0)}
              </text>
            </g>
          ))}

          {/* soft fill under the line */}
          <motion.path
            d={areaPath}
            fill="url(#growthFill)"
            initial={still ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: still ? 0 : 0.7 }}
          />
          <defs>
            <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* the line, drawing itself */}
          <motion.path
            d={path}
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={still ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
          />

          {/* points landing one after another */}
          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            const delay = still ? 0 : 0.9 * (i / Math.max(1, points.length - 1)) + 0.1;
            return (
              <motion.g key={p.t}
                initial={still ? false : { opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay, type: "spring", stiffness: 400, damping: 22 }}
                style={{ transformOrigin: `${x(p.t)}px ${y(p.kg)}px` }}>
                {isLast && (
                  <circle cx={x(p.t)} cy={y(p.kg)} r="9" fill="#0284c7" opacity="0.15" />
                )}
                <circle cx={x(p.t)} cy={y(p.kg)} r={isLast ? 5 : 3.5}
                  fill="#ffffff" stroke={isLast ? (lost ? "#e11d48" : "#0284c7") : "#0284c7"} strokeWidth="2.5" />
                {isLast && (
                  <text
                    x={Math.min(W - 24, Math.max(24, x(p.t)))}
                    y={Math.max(11, y(p.kg) - 14)}
                    textAnchor="middle" fontSize="11" fontWeight="700"
                    fill={lost ? "#be123c" : "#0369a1"}>
                    {p.kg} kg
                  </text>
                )}
              </motion.g>
            );
          })}

          {/* first and last date */}
          <text x={PAD.l} y={H - 8} fontSize="9" fill="#94a3b8">{points[0].label}</text>
          <text x={W - PAD.r} y={H - 8} textAnchor="end" fontSize="9" fill="#94a3b8">{last.label}</text>
        </svg>
      </div>

      {/* the sentence that actually gets read */}
      <motion.div
        initial={still ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: still ? 0 : 1.1 }}
        className={`m-3 mt-1 px-3 py-2.5 rounded-xl flex items-center gap-2.5 text-sm
          ${lost ? "bg-rose-50 border border-rose-200" : flat ? "bg-slate-50 border border-slate-200" : "bg-emerald-50 border border-emerald-200"}`}
      >
        {lost
          ? <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          : flat
            ? <TrendingUp className="w-4 h-4 text-slate-400 shrink-0" />
            : <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />}
        <p className={`min-w-0 ${lost ? "text-rose-800" : flat ? "text-slate-600" : "text-emerald-800"}`}>
          {lost ? (
            <>
              <b>Lost {Math.abs(deltaKg).toFixed(1)} kg</b> in the last {spanLabel}.
            </>
          ) : flat ? (
            <>No change over the last {spanLabel}.</>
          ) : (
            <>
              <b>Gained {deltaKg.toFixed(1)} kg</b> in the last {spanLabel}.
            </>
          )}
        </p>
        {last.months !== null && (
          <span className="ml-auto shrink-0 whitespace-nowrap text-xs text-slate-400">
            age {last.months < 24 ? `${last.months} mo` : `${Math.floor(last.months / 12)} yr`}
          </span>
        )}
        {lost && <TrendingDown className="w-4 h-4 text-rose-500 shrink-0" />}
      </motion.div>
    </div>
  );
}

export default GrowthChart;
