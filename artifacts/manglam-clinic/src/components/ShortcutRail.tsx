/**
 * ShortcutRail — hold Ctrl and the keyboard shortcuts slide up from the bottom.
 *
 * The shortcuts already exist and are printed in small grey text at the top of
 * the registration page, where nobody reads them. This puts them under your
 * thumb at the moment you reach for Ctrl, and takes them away again.
 *
 * It only listens for the Ctrl key itself, so it never swallows a keystroke
 * or interferes with Ctrl+S and the rest.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Keyboard } from "lucide-react";
import { motionOff } from "@/components/AnimatedNumber";

interface Shortcut { keys: string; label: string; }

const COMMON: Shortcut[] = [
  { keys: "Ctrl + F", label: "Search patients" },
  { keys: "Ctrl + G", label: "Jump to today" },
  { keys: "Ctrl + Z", label: "Undo last action" },
];

const BY_ROUTE: Record<string, Shortcut[]> = {
  "/": [
    { keys: "Ctrl + S", label: "Save General" },
    { keys: "Ctrl + N", label: "New patient" },
    { keys: "Ctrl + P", label: "Print last" },
  ],
  "/queue": [
    { keys: "Enter", label: "Give token" },
  ],
};

export function ShortcutRail() {
  const [show, setShow] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    let timer: any = null;

    const down = (e: KeyboardEvent) => {
      // Only a bare Ctrl press, held on its own.
      if (e.key !== "Control") return;
      if (timer) clearTimeout(timer);
      // A short delay so Ctrl+S never flashes the rail on the way past.
      timer = setTimeout(() => setShow(true), 450);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key !== "Control") return;
      if (timer) clearTimeout(timer);
      setShow(false);
    };
    const blur = () => { if (timer) clearTimeout(timer); setShow(false); };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (motionOff()) return null;

  const list = [...(BY_ROUTE[location] || []), ...COMMON];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="fixed bottom-0 left-0 right-0 z-[80] pointer-events-none flex justify-center pb-4 px-4"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-5 py-3 rounded-2xl bg-slate-900/92 backdrop-blur-md shadow-2xl">
            <Keyboard className="w-4 h-4 text-slate-500 shrink-0" />
            {list.map((s, i) => (
              <motion.div key={s.keys}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
                className="flex items-center gap-2 shrink-0">
                <kbd className="px-2 py-1 rounded-md bg-white/10 text-white text-[11px] font-semibold tracking-wide">
                  {s.keys}
                </kbd>
                <span className="text-slate-300 text-xs">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ShortcutRail;
