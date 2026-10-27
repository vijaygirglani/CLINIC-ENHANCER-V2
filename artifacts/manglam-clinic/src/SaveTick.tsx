/**
 * SaveTick — a circle and a tick that draw themselves over the Save button.
 *
 * During a fast OPD a toast in the corner is read by nobody. This lands where
 * your eye already is, for half a second, and confirms the record went in.
 *
 * Usage: keep a counter in state, bump it on a successful save, and pass it
 * as `trigger`. Each new value plays the animation once.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { motionOff } from "@/components/AnimatedNumber";

export function SaveTick({ trigger, label }: { trigger: number; label?: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    if (motionOff()) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 1100);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={trigger}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          className="absolute inset-0 z-20 flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 pointer-events-none"
        >
          <svg viewBox="0 0 52 52" className="w-7 h-7 shrink-0" aria-hidden="true">
            <motion.circle
              cx="26" cy="26" r="22" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round"
              initial={{ pathLength: 0, rotate: -90 }}
              animate={{ pathLength: 1, rotate: -90 }}
              transition={{ duration: 0.38, ease: "easeOut" }}
              style={{ transformOrigin: "26px 26px" }}
            />
            <motion.path
              d="M15 27 L23 34 L38 19"
              fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.26, delay: 0.3, ease: "easeOut" }}
            />
          </svg>
          {label && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.42 }}
              className="text-white font-bold"
            >
              {label}
            </motion.span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SaveTick;
