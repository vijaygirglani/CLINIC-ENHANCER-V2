/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PrescriptionFly — the prescription lifts off the desk when you save
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  A sheet of paper with the patient's name on it rises off the form, tilts,
 *  and flies up and to the right — towards the register, where the record has
 *  just gone. About a second, then it is gone.
 *
 *  It is drawn over the whole screen but never catches a click, so it cannot
 *  get in the way of the next patient you are already typing.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Check } from "lucide-react";
import { motionOff } from "@/components/AnimatedNumber";

export function PrescriptionFly({
  trigger,
  patientName,
  ayurvedic = false,
}: {
  /** bump this on a successful save */
  trigger: number;
  patientName?: string;
  ayurvedic?: boolean;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!trigger || motionOff()) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 1250);
    return () => clearTimeout(t);
  }, [trigger]);

  const tint = ayurvedic
    ? { bar: "from-emerald-500 to-teal-600", ink: "text-emerald-600", ring: "ring-emerald-200" }
    : { bar: "from-primary to-blue-600", ink: "text-primary", ring: "ring-blue-200" };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={trigger}
          className="fixed inset-0 z-[70] pointer-events-none flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          aria-hidden="true"
        >
          <motion.div
            initial={{ y: 40, x: 0, scale: 0.85, rotate: -4, opacity: 0 }}
            animate={{
              y: [40, -20, -300],
              x: [0, 20, 220],
              scale: [0.85, 1, 0.5],
              rotate: [-4, 2, 14],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 1.2, times: [0, 0.38, 1], ease: [0.3, 0.8, 0.4, 1] }}
            className={`w-56 bg-white rounded-2xl shadow-2xl ring-4 ${tint.ring} overflow-hidden`}
          >
            {/* letterhead */}
            <div className={`h-7 bg-gradient-to-r ${tint.bar} flex items-center px-3 gap-1.5`}>
              <FileText className="w-3.5 h-3.5 text-white" />
              <span className="text-[10px] font-bold text-white tracking-wide">PRESCRIPTION</span>
              <Check className="w-3.5 h-3.5 text-white ml-auto" strokeWidth={3} />
            </div>

            <div className="p-3">
              {patientName && (
                <p className={`text-sm font-bold truncate ${tint.ink}`}>{patientName}</p>
              )}
              {/* ruled lines standing in for the written prescription */}
              <div className="mt-2 space-y-1.5">
                {[100, 78, 90, 62].map((w, i) => (
                  <motion.div
                    key={i}
                    className="h-1.5 rounded-full bg-slate-200"
                    style={{ width: `${w}%` }}
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.22, delay: 0.1 + i * 0.05 }}
                  />
                ))}
              </div>
              <div className="mt-3 flex justify-end">
                <div className="h-1.5 w-12 rounded-full bg-slate-300" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PrescriptionFly;
