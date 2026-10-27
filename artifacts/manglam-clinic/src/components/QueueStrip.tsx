/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  QueueStrip — the queue, condensed into one bar
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Sits at the top of the registration page so the doctor never has to leave
 *  the prescription form to advance the queue. Calling the next patient from
 *  here also drops their name and mobile straight into the form.
 *
 *  Hides itself completely when no tokens have been issued today, so a clinic
 *  that does not use the queue never sees it.
 */

import { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  callNext, getQueueStats, subscribeQueue, type QueueEntry,
} from "@/lib/queue";
import { FlipNumber, motionOff } from "@/components/AnimatedNumber";
import { PlayCircle, Hourglass, Users, ChevronRight, Leaf } from "lucide-react";

export interface QueueStripProps {
  /** Called with the patient who was just brought in, to fill the form. */
  onCalled?: (entry: QueueEntry) => void;
}

export function QueueStrip({ onCalled }: QueueStripProps) {
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    const un = subscribeQueue(refresh);
    const i = setInterval(refresh, 20000);
    return () => { un(); clearInterval(i); };
  }, [refresh]);

  const stats = getQueueStats();

  // Nothing issued today — stay out of the way entirely.
  if (stats.total === 0) return null;

  const now = stats.nowServing;
  const next = stats.upNext[0];

  const handleCall = () => {
    const e = callNext();
    if (e && onCalled) onCalled(e);
  };

  return (
    <motion.div
      initial={motionOff() ? false : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">

        {/* now serving */}
        <div className="flex items-center gap-3 shrink-0">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow
            ${now ? "bg-gradient-to-br from-primary to-cyan-500 text-white shadow-primary/25" : "bg-slate-100 text-slate-300"}`}>
            <span className="font-display font-extrabold text-2xl tabular-nums">
              {now ? <FlipNumber key={`${now.token}-${now.announceCount}`} value={now.token} /> : "–"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">In the room</p>
            <AnimatePresence mode="wait">
              <motion.p key={now?.id || "none"}
                initial={motionOff() ? false : { opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={motionOff() ? undefined : { opacity: 0, x: -14 }}
                transition={{ duration: 0.22 }}
                className="font-display font-bold text-slate-900 leading-tight truncate max-w-[40vw] sm:max-w-[16rem]">
                {now ? now.name : "Nobody yet"}
                {now?.registerType === "ayurvedic" && <Leaf className="w-3.5 h-3.5 text-emerald-600 inline ml-1.5 -mt-0.5" />}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="hidden sm:block w-px h-9 bg-slate-200 shrink-0" />

        {/* counters */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5">
            <Hourglass className={`w-4 h-4 ${stats.longestWaitMin >= 30 ? "text-rose-500" : "text-amber-500"}`} />
            <span className="font-display font-bold text-xl text-slate-800 tabular-nums">{stats.waiting}</span>
            <span className="text-xs text-slate-400 font-semibold">waiting</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-500" />
            <span className="font-display font-bold text-xl text-slate-800 tabular-nums">{stats.done}</span>
            <span className="text-xs text-slate-400 font-semibold">seen</span>
          </div>
        </div>

        {/* actions */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <Link href="/queue"
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors flex items-center gap-1">
            Queue <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <motion.button onClick={handleCall}
            whileTap={motionOff() ? undefined : { scale: 0.97 }}
            disabled={!next}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-500 text-white text-sm font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed transition-all">
            <PlayCircle className="w-4 h-4" />
            {next ? `Call ${next.token}` : "Queue empty"}
          </motion.button>
        </div>
      </div>

      {/* progress hairline — how much of today's queue is cleared */}
      {stats.total > 0 && (
        <div className="h-1 bg-slate-100 dark:bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
            initial={motionOff() ? false : { width: 0 }}
            animate={{ width: `${Math.round((stats.done / stats.total) * 100)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      )}
    </motion.div>
  );
}

export default QueueStrip;
