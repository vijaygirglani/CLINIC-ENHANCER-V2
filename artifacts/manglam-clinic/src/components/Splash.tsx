/**
 * Splash — the clinic's name drawing itself, once, when the app opens.
 *
 * Deliberately short. This is the first thing a doctor you are selling to
 * sees, but it is also the thing you personally sit through forty times a
 * day — so it is 1.7 seconds, it never appears twice in a session, a click
 * or any key skips it instantly, and it is skipped altogether in Lite mode
 * or with reduce-motion on.
 *
 * It is never shown on the waiting-room screen. That window is opened once
 * and left running on a wall; a splash there is just a thing patients watch
 * for no reason.
 *
 * Nothing is written to localStorage — the "once" flag lives in
 * sessionStorage, which empties when the browser tab closes, so it stays out
 * of the backup entirely.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { motionOff } from "@/components/AnimatedNumber";

const SEEN_KEY = "cp_splash_seen";
const HOLD_MS = 1700;

interface Brand {
  clinicName: string;
  doctorName: string;
  qualification: string;
  tagline: string;
  logoLetter: string;
}

const FALLBACK: Brand = {
  clinicName: "Manglam Clinic",
  doctorName: "Dr. Vijay Girglani",
  qualification: "B.A.M.S.",
  tagline: "AYURVEDIC & GENERAL PRACTICE",
  logoLetter: "M",
};

function readBrand(): Brand {
  try {
    const raw = JSON.parse(
      localStorage.getItem("manglam_clinic_settings_for_print") ||
      localStorage.getItem("manglam_clinic_settings") ||
      "{}"
    );
    return {
      clinicName:    raw.clinicName    || FALLBACK.clinicName,
      doctorName:    raw.doctorName    || FALLBACK.doctorName,
      qualification: raw.qualification || FALLBACK.qualification,
      tagline:       raw.tagline       || FALLBACK.tagline,
      logoLetter:    raw.logoLetter    || FALLBACK.logoLetter,
    };
  } catch {
    return FALLBACK;
  }
}

/** sessionStorage can throw in a locked-down browser; never let that break boot. */
function alreadySeen(): boolean {
  try { return sessionStorage.getItem(SEEN_KEY) === "1"; } catch { return false; }
}
function markSeen() {
  try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* fine */ }
}

export function Splash() {
  const still = motionOff();

  // Decided once, on mount, so a re-render can never bring it back.
  const [visible, setVisible] = useState(() => !still && !alreadySeen());
  const brand = useRef<Brand>(readBrand()).current;
  const timer = useRef<any>(null);

  useEffect(() => {
    if (!visible) { markSeen(); return; }
    markSeen();

    const done = () => {
      if (timer.current) clearTimeout(timer.current);
      setVisible(false);
    };
    timer.current = setTimeout(done, HOLD_MS);

    // Any key, click or touch gets you straight to work.
    window.addEventListener("keydown", done);
    window.addEventListener("pointerdown", done);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener("keydown", done);
      window.removeEventListener("pointerdown", done);
    };
  }, [visible]);

  const letters = Array.from(brand.clinicName);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: "linear-gradient(135deg,#0b1f3a 0%,#123a63 55%,#0d6b6b 100%)" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: "easeInOut" } }}
        >
          {/* the mark, drawn as a ring closing around the letter */}
          <div className="relative w-28 h-28 mb-7">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
              <motion.circle
                cx="50" cy="50" r="44" fill="none"
                stroke="#a5f3fc" strokeWidth="3" strokeLinecap="round"
                pathLength={1}
                initial={{ pathLength: 0, rotate: -90, opacity: 0.9 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.05, ease: "easeInOut" }}
                style={{ originX: "50%", originY: "50%", rotate: -90 }}
              />
            </svg>
            <motion.div
              className="absolute inset-0 flex items-center justify-center font-display font-extrabold text-5xl text-white"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 220, damping: 16 }}
            >
              {brand.logoLetter}
            </motion.div>
          </div>

          {/* the name writing itself, letter by letter */}
          <h1 className="font-display font-extrabold text-3xl md:text-5xl text-white tracking-tight flex">
            {letters.map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.035, duration: 0.3, ease: "easeOut" }}
                style={{ whiteSpace: "pre" }}
              >
                {ch}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="mt-2 text-cyan-200/80 text-sm md:text-base font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.95, duration: 0.4 }}
          >
            {brand.doctorName} · {brand.qualification}
          </motion.p>

          <motion.p
            className="mt-1 text-white/45 text-[11px] md:text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.15, duration: 0.4 }}
          >
            {brand.tagline}
          </motion.p>

          {/* a thin bar that empties as the hold runs out */}
          <motion.div
            className="mt-8 h-[3px] rounded-full bg-cyan-300/70"
            initial={{ width: 0 }}
            animate={{ width: 132 }}
            transition={{ duration: HOLD_MS / 1000, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Splash;
