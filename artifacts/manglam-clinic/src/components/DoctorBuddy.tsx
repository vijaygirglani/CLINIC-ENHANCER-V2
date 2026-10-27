/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  DoctorBuddy — the little doctor beside the Visit Date
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  The idea that makes this worth having: he is NOT on a random loop. He
 *  mirrors what is actually happening, so a glance at him tells you something
 *  true about the clinic right now.
 *
 *      nobody waiting, nothing typed   → stands, blinks, waits
 *      patients waiting outside        → looks towards the door, counts them
 *      a name has just been filled in  → raises a hand, greets them
 *      a complaint is being typed      → listens with the stethoscope
 *      a treatment is being typed      → writes the prescription
 *      a patient was just saved        → thumbs up
 *      quiet for a long while          → tea
 *
 *  Drawn as inline SVG so it stays sharp at any size, carries no image to
 *  download, and still works with no internet. Holds perfectly still in Lite
 *  mode or with Windows' reduce-motion on.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { motionOff } from "@/components/AnimatedNumber";

export type DoctorMood =
  | "idle"
  | "waiting"
  | "greeting"
  | "listening"
  | "writing"
  | "saved"
  | "tea";

const LINES: Record<DoctorMood, string[]> = {
  idle:      ["Ready when you are.", "All clear.", "Next patient any time."],
  waiting:   ["Someone is waiting.", "There is a queue outside."],
  greeting:  ["Namaste 🙏", "Please sit."],
  listening: ["Listening…", "Tell me what is wrong.", "Hmm, go on."],
  writing:   ["Writing it down…", "Take this after food.", "Three days, then review."],
  saved:     ["Saved. Well done.", "Done — next one.", "That one is in the register."],
  tea:       ["Chai break ☕", "Quiet morning.", "Resting a minute."],
};

/* ── palette per mood ─────────────────────────────────────────────────────── */

const TONE: Record<DoctorMood, { coat: string; accent: string; bg: string; ring: string }> = {
  idle:      { coat: "#ffffff", accent: "#1152cc", bg: "from-slate-50 to-blue-50/40",      ring: "ring-slate-200" },
  waiting:   { coat: "#ffffff", accent: "#d97706", bg: "from-amber-50 to-orange-50/40",    ring: "ring-amber-200" },
  greeting:  { coat: "#ffffff", accent: "#0284c7", bg: "from-sky-50 to-cyan-50/40",        ring: "ring-sky-200" },
  listening: { coat: "#ffffff", accent: "#7c3aed", bg: "from-violet-50 to-purple-50/40",   ring: "ring-violet-200" },
  writing:   { coat: "#ffffff", accent: "#0d9488", bg: "from-teal-50 to-emerald-50/40",    ring: "ring-teal-200" },
  saved:     { coat: "#ffffff", accent: "#059669", bg: "from-emerald-50 to-green-50/40",   ring: "ring-emerald-200" },
  tea:       { coat: "#ffffff", accent: "#b45309", bg: "from-orange-50 to-amber-50/40",    ring: "ring-orange-200" },
};

export function DoctorBuddy({
  mood,
  waitingCount = 0,
  patientName,
  className = "",
}: {
  mood: DoctorMood;
  waitingCount?: number;
  patientName?: string;
  className?: string;
}) {
  const still = motionOff();
  const tone = TONE[mood];

  /* the line he says — rotates slowly, and changes at once on a new mood */
  const [lineIdx, setLineIdx] = useState(0);
  useEffect(() => {
    setLineIdx(0);
    if (still) return;
    const lines = LINES[mood];
    if (lines.length < 2) return;
    const t = setInterval(() => setLineIdx(i => (i + 1) % lines.length), 6500);
    return () => clearInterval(t);
  }, [mood, still]);

  let line = LINES[mood][lineIdx] || LINES[mood][0];
  if (mood === "waiting" && waitingCount > 0) {
    line = waitingCount === 1 ? "1 waiting outside." : `${waitingCount} waiting outside.`;
  }
  if (mood === "greeting" && patientName) {
    const first = patientName.trim().split(/\s+/)[0];
    if (first) line = `Namaste, ${first}.`;
  }

  /* blinking — the one thing that makes a drawn face feel alive */
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (still) return;
    let timer: any;
    const loop = () => {
      timer = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
        loop();
      }, 2600 + Math.random() * 3200);
    };
    loop();
    return () => clearTimeout(timer);
  }, [still]);

  /* gentle breathing, or a nod while listening */
  const bodyAnim =
    still ? {}
    : mood === "listening" ? { y: [0, -1.5, 0], rotate: [0, -1.5, 0] }
    : mood === "writing" ? { y: [0, -0.8, 0] }
    : { y: [0, -2, 0] };
  const bodyTrans =
    mood === "listening" ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" as const }
    : mood === "writing" ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" as const }
    : { duration: 3.4, repeat: Infinity, ease: "easeInOut" as const };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* ── the character ── */}
      <motion.div
        className={`relative shrink-0 w-[88px] h-[88px] rounded-2xl bg-gradient-to-br ${tone.bg} ring-1 ${tone.ring} flex items-end justify-center overflow-hidden`}
        animate={still ? {} : { scale: [1, 1.012, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.svg
          width="80" height="80" viewBox="0 0 80 80" fill="none"
          animate={bodyAnim} transition={bodyTrans}
          role="img" aria-label={`Doctor is ${mood}. ${line}`}
        >
          {/* tea steam, only on a break */}
          {mood === "tea" && !still && (
            <>
              {[0, 1, 2].map(i => (
                <motion.path key={i}
                  d={`M${55 + i * 3} 34 q2 -4 0 -8`}
                  stroke={tone.accent} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.5"
                  animate={{ y: [0, -7, -12], opacity: [0, 0.55, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
                />
              ))}
            </>
          )}

          {/* ── head ── */}
          <circle cx="40" cy="24" r="12" fill="#f5d0b0" />
          {/* hair */}
          <path d="M28 21 a12 12 0 0 1 24 0 q-6 -6 -12 -4 q-6 -2 -12 4Z" fill="#2b2b2b" />
          {/* eyes — the blink is a height change */}
          <motion.ellipse cx="35.5" cy="24" rx="1.5" ry={blink ? 0.18 : 1.9} fill="#1f2937" />
          <motion.ellipse cx="44.5" cy="24" rx="1.5" ry={blink ? 0.18 : 1.9} fill="#1f2937" />
          {/* mouth — curves up when pleased */}
          {mood === "saved" || mood === "greeting" ? (
            <path d="M36 29 q4 4 8 0" stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          ) : mood === "listening" ? (
            <circle cx="40" cy="29.5" r="1.4" fill="#1f2937" />
          ) : (
            <path d="M36.5 29.5 q3.5 2 7 0" stroke="#1f2937" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          )}

          {/* ── white coat ── */}
          <path d="M26 38 q14 -5 28 0 l3 26 q-17 4 -34 0Z" fill={tone.coat} stroke="#e2e8f0" strokeWidth="1" />
          {/* collar / shirt */}
          <path d="M36 37 l4 7 l4 -7 q-4 -2 -8 0Z" fill={tone.accent} opacity="0.85" />
          {/* pocket */}
          <rect x="45" y="50" width="7" height="6" rx="1" fill="none" stroke="#cbd5e1" strokeWidth="1" />

          {/* ── stethoscope — in the ears while listening ── */}
          <motion.path
            d={mood === "listening"
              ? "M35 34 q-3 8 1 15 M45 34 q3 8 -1 15"
              : "M34 40 q-4 9 3 14 M46 40 q4 9 -3 14"}
            stroke={tone.accent} strokeWidth="1.8" strokeLinecap="round" fill="none"
            animate={still || mood !== "listening" ? {} : { opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 1.3, repeat: Infinity }}
          />
          <motion.circle
            cx="40" cy={mood === "listening" ? 50 : 55} r="2.6"
            fill={tone.accent}
            animate={still || mood !== "listening" ? {} : { scale: [1, 1.25, 1] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* ── right arm — what it does depends on the mood ── */}
          {mood === "writing" ? (
            <motion.g
              animate={still ? {} : { rotate: [0, -7, 0, 7, 0], x: [0, 1.5, 0, -1.5, 0] }}
              transition={{ duration: 0.75, repeat: Infinity, ease: "easeInOut" }}
              style={{ originX: "54px", originY: "44px" }}
            >
              <rect x="52" y="42" width="5" height="16" rx="2.5" fill={tone.coat} stroke="#e2e8f0" strokeWidth="0.8" />
              {/* pen */}
              <rect x="56" y="55" width="2.2" height="9" rx="1.1" fill={tone.accent} transform="rotate(22 57 59)" />
            </motion.g>
          ) : mood === "greeting" ? (
            <motion.rect
              x="52" y="40" width="5" height="15" rx="2.5" fill={tone.coat} stroke="#e2e8f0" strokeWidth="0.8"
              style={{ originX: "54px", originY: "42px" }}
              animate={still ? {} : { rotate: [0, -48, -34, -48, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
            />
          ) : mood === "saved" ? (
            <motion.g
              initial={still ? false : { rotate: 20, y: 4, opacity: 0 }}
              animate={{ rotate: -14, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 14 }}
              style={{ originX: "54px", originY: "44px" }}
            >
              <rect x="52" y="40" width="5" height="14" rx="2.5" fill={tone.coat} stroke="#e2e8f0" strokeWidth="0.8" />
              <circle cx="54.5" cy="38" r="3.2" fill={tone.accent} />
              <path d="M53 38 l1.2 1.3 l2.2 -2.6" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </motion.g>
          ) : mood === "tea" ? (
            <g>
              <rect x="52" y="44" width="5" height="12" rx="2.5" fill={tone.coat} stroke="#e2e8f0" strokeWidth="0.8" />
              {/* cup */}
              <rect x="51" y="38" width="8" height="6" rx="1.4" fill={tone.accent} />
              <path d="M59 40 q3 1 0 3" stroke={tone.accent} strokeWidth="1.2" fill="none" />
            </g>
          ) : (
            <motion.rect
              x="52" y="42" width="5" height="16" rx="2.5" fill={tone.coat} stroke="#e2e8f0" strokeWidth="0.8"
              style={{ originX: "54px", originY: "44px" }}
              animate={still ? {} : { rotate: [0, 4, 0, -3, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {/* ── left arm ── */}
          <rect x="23" y="42" width="5" height="16" rx="2.5" fill={tone.coat} stroke="#e2e8f0" strokeWidth="0.8" />

          {/* looking towards the door when people are waiting */}
          {mood === "waiting" && !still && (
            <motion.g
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
            >
              <circle cx="62" cy="22" r="1.6" fill={tone.accent} opacity="0.5" />
              <circle cx="67" cy="22" r="1.2" fill={tone.accent} opacity="0.3" />
            </motion.g>
          )}
        </motion.svg>
      </motion.div>

      {/* ── what he says ── */}
      <div className="min-w-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${mood}-${line}`}
            initial={still ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={still ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="relative"
          >
            <div className="inline-block px-3 py-2 rounded-2xl rounded-bl-sm bg-white border border-slate-200 shadow-sm max-w-full">
              <p className="text-sm text-slate-700 leading-snug">{line}</p>
            </div>
          </motion.div>
        </AnimatePresence>
        {waitingCount > 0 && mood !== "waiting" && (
          <p className="mt-1.5 text-[11px] text-slate-400">
            {waitingCount} still waiting
          </p>
        )}
      </div>
    </div>
  );
}

export default DoctorBuddy;
