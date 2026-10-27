/**
 * CollectionRing — today's collection as a ring filling toward a target.
 *
 * You already have the number. This gives it a shape and something to chase.
 * Click the target to change it; 0 hides the ring entirely.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Check, Pencil } from "lucide-react";
import { AnimatedNumber, motionOff } from "@/components/AnimatedNumber";
import { getExtras, saveExtras } from "@/lib/clinicExtras";

export function CollectionRing({ collected }: { collected: number }) {
  const [target, setTarget] = useState(() => getExtras().dailyTarget);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(getExtras().dailyTarget));
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    const onChange = () => setTarget(getExtras().dailyTarget);
    window.addEventListener("cp-extras-changed", onChange);
    return () => window.removeEventListener("cp-extras-changed", onChange);
  }, []);

  const pct = target > 0 ? Math.min(1, collected / target) : 0;
  const hit = target > 0 && collected >= target;

  useEffect(() => {
    if (hit && !celebrated) setCelebrated(true);
    if (!hit && celebrated) setCelebrated(false);
  }, [hit, celebrated]);

  const commit = () => {
    const n = Math.max(0, Math.round(Number(draft) || 0));
    setTarget(n);
    saveExtras({ ...getExtras(), dailyTarget: n });
    setEditing(false);
  };

  if (target <= 0 && !editing) {
    return (
      <button type="button" onClick={() => { setDraft("5000"); setEditing(true); }}
        className="medical-card p-4 flex items-center justify-center gap-2 text-sm font-semibold text-slate-400 hover:text-primary transition-colors w-full">
        <Target className="w-4 h-4" /> Set a daily target
      </button>
    );
  }

  const R = 46;
  const C = 2 * Math.PI * R;
  const still = motionOff();

  return (
    <div className="medical-card p-4 flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: 108, height: 108 }}>
        <svg viewBox="0 0 108 108" className="w-full h-full -rotate-90">
          <circle cx="54" cy="54" r={R} fill="none" stroke="#e2e8f0" strokeWidth="9" />
          <motion.circle
            cx="54" cy="54" r={R} fill="none" strokeWidth="9" strokeLinecap="round"
            stroke={hit ? "#10b981" : "url(#ringGrad)"}
            strokeDasharray={C}
            initial={still ? false : { strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - pct) }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1152cc" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>

        {/* the percentage sits in the middle of the ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {hit ? (
              <motion.div key="hit"
                initial={still ? false : { scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 360, damping: 18 }}
                className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-6 h-6 text-white" strokeWidth={3} />
              </motion.div>
            ) : (
              <motion.p key="pct" initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }}
                className="text-2xl font-display font-bold text-slate-800 tabular-nums">
                <AnimatedNumber value={Math.round(pct * 100)} suffix="%" />
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* one soft ring pulse when the target is reached */}
        {hit && !still && (
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-emerald-400 pointer-events-none"
            initial={{ scale: 0.85, opacity: 0.8 }}
            animate={{ scale: 1.25, opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        )}
      </div>

      <div className="min-w-0">
        {/* "Collection" already has its own stat card above — this one is
            about progress against the target, so it says so. */}
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Against today's target</p>
        <p className="text-3xl font-display font-bold text-slate-900 leading-tight">
          <AnimatedNumber value={collected} format="currency" pulse />
        </p>

        {editing ? (
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-xs text-slate-400">target ₹</span>
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value.replace(/\D/g, ""))}
              onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
              onBlur={commit}
              className="w-24 px-2 py-1 rounded-lg border border-slate-200 text-sm outline-none focus:border-primary"
            />
          </div>
        ) : (
          <button type="button" onClick={() => { setDraft(String(target)); setEditing(true); }}
            className="mt-1 flex items-center gap-1 text-xs text-slate-400 hover:text-primary transition-colors">
            {hit
              ? <span className="font-semibold text-emerald-600">Target ₹{target.toLocaleString("en-IN")} reached</span>
              : <span>₹{Math.max(0, target - collected).toLocaleString("en-IN")} to go of ₹{target.toLocaleString("en-IN")}</span>}
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export default CollectionRing;
