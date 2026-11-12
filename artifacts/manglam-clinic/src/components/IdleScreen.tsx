/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  IdleScreen — what the clinic PC shows when nobody is using it
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  After a few minutes untouched the app fades to a clock, today's figures and
 *  the clinic name. Touch anything and it fades back instantly, exactly where
 *  you were.
 *
 *  Two reasons it earns its place, beyond looking good:
 *
 *   · A patient walking past the desk no longer sees the previous patient's
 *     name, mobile and complaint sitting on screen.
 *   · It is a second place the clinic's own name sits in front of people all
 *     day — which matters when the app is sold to someone else.
 *
 *  ── Scenes ────────────────────────────────────────────────────────────────
 *  It no longer sits on one background. Six scenes take turns, each with its
 *  own palette and its own motion, crossfading every twenty seconds or so.
 *  The one it opens on is picked at random, so the screen is not the same
 *  thing every lunch break.
 *
 *  The clock, the figures and the clinic name do not move between scenes —
 *  only what is behind them and the colour of the ink. A wall screen that
 *  rearranges itself is distracting; one that changes its light is not.
 *
 *  In Lite mode, or with reduce-motion on, it holds one still scene and
 *  nothing animates or rotates at all.
 *
 *  Off entirely for anyone who sets the delay to 0 on the Queue page.
 */

import { useState, useEffect, useRef, useCallback, type ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getExtras } from "@/lib/clinicExtras";
import { getDisplayClinic } from "@/lib/displaySettings";
import { getDailyStats } from "@/lib/store";
import { motionOff } from "@/components/AnimatedNumber";
import { getQueueStats } from "@/lib/queue";

/* ── the scenes ──────────────────────────────────────────────────────────── */

interface Scene {
  id: string;
  /** The page behind everything. */
  bg: string;
  /** Headline ink. */
  ink: string;
  /** Second-line ink, already faded. */
  muted: string;
  /** The little stat chips. */
  chip: string;
  /** Whatever moves. Gets `still` so it can hold perfectly still. */
  Art: ComponentType<{ still: boolean }>;
}

/** A deterministic scatter, so the stars do not jump on every render. */
function scatter(n: number, seed: number) {
  const out: Array<{ x: number; y: number; r: number; d: number }> = [];
  let v = seed;
  for (let i = 0; i < n; i++) {
    v = (v * 9301 + 49297) % 233280;
    const a = v / 233280;
    v = (v * 9301 + 49297) % 233280;
    const b = v / 233280;
    v = (v * 9301 + 49297) % 233280;
    const c = v / 233280;
    out.push({ x: a * 100, y: b * 100, r: 1 + c * 2.2, d: a * 6 });
  }
  return out;
}

const STARS = scatter(26, 7);
const BOKEH = scatter(9, 23);

const SCENES: Scene[] = [
  {
    id: "midnight",
    bg: "linear-gradient(135deg,#0b1f3a 0%,#123a63 55%,#0d6b6b 100%)",
    ink: "#ffffff", muted: "rgba(255,255,255,0.55)", chip: "rgba(255,255,255,0.10)",
    Art: ({ still }) => still ? null : (
      <motion.div
        className="absolute -top-1/3 -left-1/4 rounded-full pointer-events-none"
        style={{ width: "70vw", height: "70vw", background: "radial-gradient(circle,rgba(56,189,248,0.22),transparent 65%)" }}
        animate={{ x: ["0%", "26%", "0%"], y: ["0%", "20%", "0%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
    ),
  },

  {
    id: "dawn",
    bg: "linear-gradient(170deg,#2b1055 0%,#7b2d6b 45%,#d9693f 80%,#f0a868 100%)",
    ink: "#fff7ed", muted: "rgba(255,247,237,0.6)", chip: "rgba(255,255,255,0.13)",
    Art: ({ still }) => (
      <>
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: "58vw", height: "58vw", left: "21vw", bottom: "-30vw",
            background: "radial-gradient(circle,rgba(255,214,150,0.6),rgba(255,160,90,0.18) 45%,transparent 70%)",
          }}
          animate={still ? {} : { y: ["0%", "-7%", "0%"], opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        {!still && [0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: "50%", bottom: "-10vh", width: 2, height: "70vh",
              background: "linear-gradient(to top,rgba(255,214,150,0.35),transparent)",
              transformOrigin: "bottom center",
            }}
            animate={{ rotate: [-22 + i * 22, -16 + i * 22, -22 + i * 22], opacity: [0.2, 0.45, 0.2] }}
            transition={{ duration: 14 + i * 3, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </>
    ),
  },

  {
    id: "forest",
    bg: "linear-gradient(145deg,#06281f 0%,#0b4034 50%,#15605a 100%)",
    ink: "#ecfdf5", muted: "rgba(236,253,245,0.55)", chip: "rgba(255,255,255,0.10)",
    Art: ({ still }) => still ? null : (
      <>
        {BOKEH.map((b, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${b.x}%`, top: `${b.y}%`,
              width: `${b.r * 26}px`, height: `${b.r * 26}px`,
              background: "radial-gradient(circle,rgba(134,239,172,0.3),transparent 70%)",
            }}
            animate={{ y: ["0%", "-140%", "0%"], opacity: [0.15, 0.5, 0.15] }}
            transition={{ duration: 22 + i * 3, repeat: Infinity, ease: "easeInOut", delay: b.d }}
          />
        ))}
      </>
    ),
  },

  {
    id: "ocean",
    bg: "linear-gradient(160deg,#021d35 0%,#05456b 55%,#0790a0 100%)",
    ink: "#ecfeff", muted: "rgba(236,254,255,0.55)", chip: "rgba(255,255,255,0.11)",
    Art: ({ still }) => still ? null : (
      <>
        {[0, 1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: "-30%", right: "-30%", bottom: `${6 + i * 11}%`, height: "26vh",
              borderRadius: "50%",
              background: `rgba(103,232,249,${0.06 + i * 0.025})`,
            }}
            animate={{ x: ["0%", i % 2 ? "7%" : "-7%", "0%"] }}
            transition={{ duration: 18 + i * 4, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </>
    ),
  },

  {
    id: "mandala",
    bg: "linear-gradient(150deg,#3b0a16 0%,#7c2d12 50%,#b45309 100%)",
    ink: "#fffbeb", muted: "rgba(255,251,235,0.58)", chip: "rgba(255,255,255,0.12)",
    Art: ({ still }) => (
      <motion.svg
        viewBox="-100 -100 200 200"
        className="absolute pointer-events-none"
        style={{ width: "100vh", height: "100vh", left: "50%", top: "50%", x: "-50%", y: "-50%", opacity: 0.17 }}
        animate={still ? {} : { rotate: 360 }}
        transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
      >
        {[26, 40, 54, 68, 82].map(r => (
          <circle key={r} cx="0" cy="0" r={r} fill="none" stroke="#fde68a" strokeWidth="0.6" />
        ))}
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i * Math.PI * 2) / 16;
          return (
            <g key={i} transform={`rotate(${(i * 360) / 16})`}>
              <ellipse cx="0" cy="-54" rx="9" ry="22" fill="none" stroke="#fcd34d" strokeWidth="0.7" />
              <line x1="0" y1="-26" x2="0" y2="-82" stroke="#fde68a" strokeWidth="0.35" opacity={a ? 0.7 : 0.7} />
            </g>
          );
        })}
      </motion.svg>
    ),
  },

  {
    id: "night",
    bg: "linear-gradient(165deg,#070b1f 0%,#131a3f 55%,#2b1b4d 100%)",
    ink: "#e0e7ff", muted: "rgba(224,231,255,0.5)", chip: "rgba(255,255,255,0.09)",
    Art: ({ still }) => (
      <>
        {STARS.map((s, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none bg-white"
            style={{ left: `${s.x}%`, top: `${s.y * 0.75}%`, width: s.r, height: s.r }}
            animate={still ? {} : { opacity: [0.2, 0.95, 0.2] }}
            transition={{ duration: 3 + (i % 5), repeat: Infinity, ease: "easeInOut", delay: s.d }}
          />
        ))}
        {!still && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ width: "60vw", height: "60vw", right: "-18vw", top: "-22vw",
                     background: "radial-gradient(circle,rgba(129,140,248,0.2),transparent 65%)" }}
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </>
    ),
  },
];

/** How long each scene holds before the next fades in. */
const SCENE_MS = 20000;

/* ── the screen ──────────────────────────────────────────────────────────── */

export function IdleScreen() {
  const [idle, setIdle] = useState(false);
  const [, setTick] = useState(0);
  const [minutes, setMinutes] = useState(() => getExtras().idleMinutes);
  const [scene, setScene] = useState(0);
  const timer = useRef<any>(null);

  const arm = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    const mins = getExtras().idleMinutes;
    setMinutes(mins);
    if (mins <= 0) return;
    timer.current = setTimeout(() => {
      // A different scene each time it drops off, rather than always the first.
      setScene(Math.floor(Math.random() * SCENES.length));
      setIdle(true);
    }, mins * 60000);
  }, []);

  useEffect(() => {
    const wake = () => {
      setIdle(false);
      arm();
    };
    const events = ["mousemove", "mousedown", "keydown", "wheel", "touchstart"];
    events.forEach(e => window.addEventListener(e, wake, { passive: true }));
    window.addEventListener("cp-extras-changed", arm);
    arm();
    return () => {
      events.forEach(e => window.removeEventListener(e, wake));
      window.removeEventListener("cp-extras-changed", arm);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [arm]);

  // Keep the clock moving only while the screen is actually showing.
  useEffect(() => {
    if (!idle) return;
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, [idle]);

  const still = motionOff();

  // Rotate scenes while idle. Held still in Lite mode — one scene, no changes.
  useEffect(() => {
    if (!idle || still) return;
    const t = setInterval(() => setScene(s => (s + 1) % SCENES.length), SCENE_MS);
    return () => clearInterval(t);
  }, [idle, still]);

  if (minutes <= 0) return null;

  const look = SCENES[scene] || SCENES[0];
  const clinic = getDisplayClinic();
  const now = new Date();

  let seen = 0;
  let collected = 0;
  try {
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const s = getDailyStats(key);
    seen = s?.totalPatients || 0;
    collected = s?.totalFees || 0;
  } catch {
    /* if stats cannot be read, the clock alone is still useful */
  }

  let waiting = 0;
  try {
    waiting = getQueueStats().waiting;
  } catch {
    /* queue not in use */
  }

  return (
    <AnimatePresence>
      {idle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="fixed inset-0 z-[90] overflow-hidden cursor-pointer select-none"
          aria-hidden="true"
        >
          {/* The scene itself crossfades underneath; everything above it holds
              its position, so only the light in the room changes. */}
          <AnimatePresence initial={false}>
            <motion.div
              key={look.id}
              className="absolute inset-0"
              style={{ background: look.bg }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: still ? 0 : 1.6, ease: "easeInOut" }}
            >
              <look.Art still={still} />
            </motion.div>
          </AnimatePresence>

          <div
            className="relative h-full flex flex-col items-center justify-center px-8"
            style={{ color: look.ink }}
          >
            <motion.p
              initial={still ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="font-display font-extrabold tabular-nums leading-none"
              style={{ fontSize: "clamp(4rem,16vw,13rem)" }}
            >
              {now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}
            </motion.p>

            <motion.p
              initial={still ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              // Clear of the clock's descenders — "pm" dips into this line at
              // the sizes this renders at on a wide screen.
              className="mt-6 text-lg md:text-2xl"
              style={{ color: look.muted }}
            >
              {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </motion.p>

            <motion.div
              initial={still ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              <Stat label="seen today" value={String(seen)} look={look} />
              <Stat label="collected" value={`₹${collected.toLocaleString("en-IN")}`} look={look} />
              {waiting > 0 && <Stat label="waiting" value={String(waiting)} look={look} />}
            </motion.div>

            <motion.div
              initial={still ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="absolute bottom-10 left-0 right-0 text-center"
            >
              <p className="font-display font-bold text-2xl">{clinic.clinicName}</p>
              <p className="text-sm mt-0.5" style={{ color: look.muted }}>
                {clinic.doctorName}{clinic.qualification ? ` · ${clinic.qualification}` : ""}
              </p>
              <p className="text-xs mt-6" style={{ color: look.muted, opacity: 0.7 }}>
                Touch anywhere to continue
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value, look }: { label: string; value: string; look: Scene }) {
  return (
    <div
      className="px-5 py-3 rounded-2xl text-center min-w-[128px]"
      style={{ background: look.chip }}
    >
      <p className="font-display font-bold text-3xl tabular-nums">{value}</p>
      <p className="text-xs mt-0.5" style={{ color: look.muted }}>{label}</p>
    </div>
  );
}

export default IdleScreen;
