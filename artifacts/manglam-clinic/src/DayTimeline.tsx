/**
 * DayTimeline — the clinic day as one strip.
 *
 * A mark for every patient at the hour they were seen, filling left to right
 * through the day. After a month you can see your own rush hours plainly,
 * which is what tells you when to have help at the desk.
 *
 * Reads `createdAt`, which every record already carries.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { motionOff } from "@/components/AnimatedNumber";

export interface TimelinePatient {
  id: number;
  name: string;
  createdAt?: string;
  fees?: number;
  registerType?: "general" | "ayurvedic";
}

/** Clinic hours shown on the strip. */
const START_HOUR = 8;
const END_HOUR = 22;

export function DayTimeline({ patients }: { patients: TimelinePatient[] }) {
  const marks = useMemo(() => {
    const out: { id: number; name: string; pos: number; hour: number; ayur: boolean; time: string }[] = [];
    for (const p of patients) {
      if (!p.createdAt) continue;
      const d = new Date(p.createdAt);
      if (!isFinite(d.getTime())) continue;
      const h = d.getHours() + d.getMinutes() / 60;
      if (h < START_HOUR || h > END_HOUR) continue;
      out.push({
        id: p.id,
        name: p.name,
        pos: ((h - START_HOUR) / (END_HOUR - START_HOUR)) * 100,
        hour: Math.floor(h),
        ayur: p.registerType === "ayurvedic",
        time: d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }),
      });
    }
    return out.sort((a, b) => a.pos - b.pos);
  }, [patients]);

  // Per-hour counts drive the column heights behind the marks.
  const perHour = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const m of marks) counts[m.hour] = (counts[m.hour] || 0) + 1;
    return counts;
  }, [marks]);

  const busiest = Math.max(1, ...Object.values(perHour));
  const hours: number[] = [];
  for (let h = START_HOUR; h < END_HOUR; h++) hours.push(h);

  const still = motionOff();

  if (marks.length === 0) {
    return null;
  }

  const peakHour = Object.entries(perHour).sort((a, b) => b[1] - a[1])[0];
  const fmtHour = (h: number) => {
    const ampm = h >= 12 ? "pm" : "am";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}${ampm}`;
  };

  return (
    <div className="medical-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-slate-400" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">The day</p>
        {peakHour && (
          <p className="ml-auto text-[11px] text-slate-400">
            busiest around <span className="font-semibold text-slate-600">{fmtHour(Number(peakHour[0]))}</span>
            {" · "}{peakHour[1]} patients
          </p>
        )}
      </div>

      {/* hour columns */}
      <div className="relative h-16 flex items-end gap-[2px]">
        {hours.map((h, i) => {
          const n = perHour[h] || 0;
          const height = n === 0 ? 3 : 10 + (n / busiest) * 48;
          return (
            <motion.div key={h}
              className={`flex-1 rounded-t-md ${n === 0 ? "bg-slate-100" : "bg-gradient-to-t from-primary/70 to-cyan-400/70"}`}
              initial={still ? false : { height: 3 }}
              animate={{ height }}
              transition={{ duration: 0.5, delay: still ? 0 : i * 0.03, ease: "easeOut" }}
              title={`${fmtHour(h)} — ${n} patient${n === 1 ? "" : "s"}`}
            />
          );
        })}
      </div>

      {/* the patients themselves, as dots along the line */}
      <div className="relative h-5 mt-1">
        <div className="absolute left-0 right-0 top-2 h-px bg-slate-200" />
        {marks.map((m, i) => (
          <motion.span key={m.id}
            className={`absolute top-[3px] w-2 h-2 rounded-full ring-2 ring-white
              ${m.ayur ? "bg-emerald-500" : "bg-primary"}`}
            style={{ left: `calc(${m.pos}% - 4px)` }}
            initial={still ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: still ? 0 : 0.3 + i * 0.02, type: "spring", stiffness: 500, damping: 24 }}
            title={`${m.name} · ${m.time}`}
          />
        ))}
      </div>

      <div className="flex justify-between mt-1 text-[10px] text-slate-400">
        <span>{fmtHour(START_HOUR)}</span>
        <span>{fmtHour(Math.floor((START_HOUR + END_HOUR) / 2))}</span>
        <span>{fmtHour(END_HOUR)}</span>
      </div>
    </div>
  );
}

export default DayTimeline;
