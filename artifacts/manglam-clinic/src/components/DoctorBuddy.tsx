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

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { motionOff } from "@/components/AnimatedNumber";
import { festivalToday, type Festival, type FestivalId } from "@/lib/festivals";

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

/* ── festival dress ───────────────────────────────────────────────────────── */

/** A hex colour at a given alpha, for tinting the panel behind him. */
function tint(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const FESTIVAL_EMOJI: Record<FestivalId, string> = {
  uttarayan: "🪁", republic: "🇮🇳", holi: "🎨", independence: "🇮🇳",
  janmashtami: "🪈", navratri: "🪘", diwali: "🪔",
};

/**
 * What he wears on a festival. Drawn around him — never on his arms, so it
 * cannot interfere with what the arms are doing for the current mood.
 *
 * `back` goes behind the body, `front` in front of it.
 */
function FestivalDress({ f, still, layer }: { f: Festival; still: boolean; layer: "back" | "front" }) {
  const a = f.accent;

  if (layer === "back") {
    switch (f.id) {
      case "uttarayan":
        return (
          <motion.g
            animate={still ? {} : { rotate: [0, 7, 0, -7, 0], y: [0, -2, 0, 2, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            style={{ originX: "66px", originY: "14px" }}
          >
            <path d="M66 5 l6 8 l-6 8 l-6 -8 Z" fill={a} />
            <path d="M66 5 v16 M60 13 h12" stroke="#ffffff" strokeWidth="0.7" opacity="0.8" />
            <path d="M66 21 q-3 6 1 11" stroke="#94a3b8" strokeWidth="0.8" fill="none" />
            <path d="M64 24 l3 1.5 M63 28 l3 1.5" stroke={a} strokeWidth="1.2" strokeLinecap="round" />
          </motion.g>
        );

      case "republic":
      case "independence":
        return (
          <g>
            <rect x="62" y="6" width="1.3" height="22" rx="0.6" fill="#94a3b8" />
            <motion.g
              animate={still ? {} : { skewX: [0, 4, 0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ originX: "63px", originY: "7px" }}
            >
              <rect x="63.3" y="6"    width="12" height="3.2" fill="#FF9933" />
              <rect x="63.3" y="9.2"  width="12" height="3.2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.3" />
              <rect x="63.3" y="12.4" width="12" height="3.2" fill="#138808" />
              <circle cx="69.3" cy="10.8" r="1.1" fill="none" stroke="#000080" strokeWidth="0.45" />
            </motion.g>
          </g>
        );

      case "janmashtami":
        return (
          <g>
            {/* matki hanging in the corner */}
            <path d="M66 4 v5" stroke="#94a3b8" strokeWidth="0.7" />
            <motion.g
              animate={still ? {} : { rotate: [0, 5, 0, -5, 0] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
              style={{ originX: "66px", originY: "9px" }}
            >
              <path d="M61 12 q5 -4 10 0 q1.5 6 -5 7 q-6.5 -1 -5 -7Z" fill={a} />
              <rect x="62.5" y="10.5" width="7" height="2" rx="1" fill="#facc15" />
            </motion.g>
          </g>
        );

      case "navratri":
        return (
          <motion.g
            animate={still ? {} : { rotate: [0, 10, 0, -10, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ originX: "67px", originY: "16px" }}
          >
            {/* crossed dandiya sticks */}
            <rect x="60" y="15" width="15" height="2.2" rx="1.1" fill={a} transform="rotate(-28 67 16)" />
            <rect x="60" y="15" width="15" height="2.2" rx="1.1" fill="#f59e0b" transform="rotate(28 67 16)" />
          </motion.g>
        );

      case "holi":
        return (
          <g>
            {[["#ec4899", 62, 10, 3.4], ["#facc15", 70, 16, 2.6], ["#22c55e", 64, 22, 2.2]].map(
              ([c, cx, cy, r], i) => (
                <motion.circle
                  key={i} cx={cx as number} cy={cy as number} r={r as number} fill={c as string}
                  animate={still ? {} : { y: [0, -5, 0], opacity: [0.45, 0.85, 0.45] }}
                  transition={{ duration: 2.6 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                />
              )
            )}
          </g>
        );

      case "diwali":
        return (
          <g>
            {[[60, 10], [70, 15], [64, 20]].map(([cx, cy], i) => (
              <motion.g key={i}
                animate={still ? {} : { opacity: [0.25, 1, 0.25], scale: [0.85, 1.15, 0.85] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.55, ease: "easeInOut" }}
                style={{ originX: `${cx}px`, originY: `${cy}px` }}
              >
                <path d={`M${cx} ${cy - 2.6} l0.8 1.8 l1.8 0.8 l-1.8 0.8 l-0.8 1.8 l-0.8 -1.8 l-1.8 -0.8 l1.8 -0.8 Z`} fill={a} />
              </motion.g>
            ))}
          </g>
        );
    }
  }

  /* ── front layer ── */
  switch (f.id) {
    case "holi":
      // colour smudged onto the coat
      return (
        <g opacity="0.75">
          <ellipse cx="33" cy="46" rx="3.6" ry="2.6" fill="#ec4899" />
          <ellipse cx="46" cy="55" rx="3" ry="2.2" fill="#22c55e" />
          <ellipse cx="38" cy="59" rx="2.4" ry="1.8" fill="#facc15" />
          <circle cx="35" cy="20" r="1.8" fill="#8b5cf6" opacity="0.8" />
        </g>
      );

    case "janmashtami":
      // peacock feather tucked into the hair — kept clear of the top edge,
      // which was slicing the eye off it
      return (
        <g>
          <path d="M44 15 q6 -5 8 -9" stroke="#0d9488" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <ellipse cx="52.6" cy="5" rx="3" ry="3.9" fill="#0ea5e9" transform="rotate(24 52.6 5)" />
          <ellipse cx="52.6" cy="5.3" rx="1.5" ry="2.1" fill="#7c3aed" transform="rotate(24 52.6 5.3)" />
        </g>
      );

    case "diwali":
      // a row of diyas at his feet — bigger than they were, because at 88px
      // across the first version read as three brown specks
      return (
        <g>
          {[25, 40, 55].map((x, i) => (
            <g key={x}>
              <path d={`M${x - 6} 71 q6 5.5 12 0 q-6 2.6 -12 0Z`} fill="#b45309" />
              <path d={`M${x - 6} 71 q6 2 12 0`} stroke="#92400e" strokeWidth="0.7" fill="none" />
              <motion.path
                d={`M${x} 70 q2.6 -3.6 0 -7 q-2.6 3.4 0 7Z`} fill="#fbbf24"
                animate={still ? {} : { scaleY: [1, 1.35, 0.9, 1.25, 1], opacity: [0.8, 1, 0.88, 1, 0.8] }}
                transition={{ duration: 1.5 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                style={{ originX: `${x}px`, originY: "70px" }}
              />
            </g>
          ))}
        </g>
      );

    case "navratri":
      // the garbo with its lamp — moved up and in from the corner, which the
      // panel's rounded edge was cutting into
      return (
        <g>
          <path d="M14 68 q8 -9 16 0 q1.5 8 -8 8.6 q-9.5 -0.6 -8 -8.6Z" fill={a} />
          <motion.circle cx="22" cy="69.5" r="2.4" fill="#fde047"
            animate={still ? {} : { opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
          <circle cx="17.5" cy="73" r="1.1" fill="#fde047" opacity="0.75" />
          <circle cx="26.5" cy="73" r="1.1" fill="#fde047" opacity="0.75" />
          <path d="M14 66 q8 -3 16 0" stroke="#ffffff" strokeWidth="0.8" fill="none" opacity="0.5" />
        </g>
      );

    case "uttarayan":
    case "republic":
    case "independence":
    default:
      return null;
  }
}

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

  /* is today a festival? re-checked now and then so it turns over at midnight
     without the app being reloaded */
  const [festival, setFestival] = useState<Festival | null>(() => festivalToday());
  useEffect(() => {
    const t = setInterval(() => setFestival(festivalToday()), 15 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  /* The festival greeting goes at the END of the rotation, not the start.
     In Lite mode nothing rotates, so index 0 is all anyone ever sees — and
     "3 waiting outside" is worth more than "Happy Diwali". The dress still
     shows either way. */
  const moodLines = LINES[mood];
  const lines = festival
    ? [...moodLines, `${festival.en} ${FESTIVAL_EMOJI[festival.id]}`]
    : moodLines;

  /* the line he says — rotates slowly, and changes at once on a new mood */
  const [lineIdx, setLineIdx] = useState(0);
  useEffect(() => {
    setLineIdx(0);
    if (still) return;
    if (lines.length < 2) return;
    const t = setInterval(() => setLineIdx(i => (i + 1) % lines.length), 6500);
    return () => clearInterval(t);
  }, [mood, still, lines.length]);

  let line = lines[lineIdx] || lines[0];

  /* The live details replace a mood line, but never the festival greeting —
     otherwise a queue outside would mean the greeting never appears. */
  const onMoodLine = lineIdx < moodLines.length;
  if (onMoodLine && mood === "waiting" && waitingCount > 0) {
    line = waitingCount === 1 ? "1 waiting outside." : `${waitingCount} waiting outside.`;
  }
  if (onMoodLine && mood === "greeting" && patientName) {
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
        className={`relative shrink-0 w-[88px] h-[88px] rounded-2xl bg-gradient-to-br ${festival ? "" : tone.bg} ring-1 ${festival ? "ring-transparent" : tone.ring} flex items-end justify-center overflow-hidden`}
        style={festival ? {
          background: `linear-gradient(135deg, ${tint(festival.accent, 0.18)}, ${tint(festival.accent, 0.05)})`,
          boxShadow: `inset 0 0 0 1px ${tint(festival.accent, 0.3)}`,
        } : undefined}
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

          {/* festival decoration behind him */}
          {festival && <FestivalDress f={festival} still={still} layer="back" />}

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

          {/* festival decoration in front — colour on the coat, diyas at his
              feet. Never drawn on the arms, so the mood animations are safe. */}
          {festival && <FestivalDress f={festival} still={still} layer="front" />}

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
