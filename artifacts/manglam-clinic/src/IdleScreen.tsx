/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  IdleScreen — what the clinic PC shows when nobody is using it
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  After a few minutes untouched the app fades to a clock, today's figures and
 *  the clinic name, with a slow gradient drifting behind it. Touch anything
 *  and it fades back instantly, exactly where you were.
 *
 *  Two reasons it earns its place, beyond looking good:
 *
 *   · A patient walking past the desk no longer sees the previous patient's
 *     name, mobile and complaint sitting on screen.
 *   · It is a second place the clinic's own name sits in front of people all
 *     day — which matters when the app is sold to someone else.
 *
 *  Off by default for anyone who sets the delay to 0 in the Queue page.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getExtras } from "@/lib/clinicExtras";
import { getDisplayClinic } from "@/lib/displaySettings";
import { getDailyStats } from "@/lib/store";
import { motionOff } from "@/components/AnimatedNumber";
import { getQueueStats } from "@/lib/queue";

export function IdleScreen() {
  const [idle, setIdle] = useState(false);
  const [, setTick] = useState(0);
  const [minutes, setMinutes] = useState(() => getExtras().idleMinutes);
  const timer = useRef<any>(null);

  const arm = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    const mins = getExtras().idleMinutes;
    setMinutes(mins);
    if (mins <= 0) return;
    timer.current = setTimeout(() => setIdle(true), mins * 60000);
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

  if (minutes <= 0) return null;

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

  const still = motionOff();

  return (
    <AnimatePresence>
      {idle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="fixed inset-0 z-[90] overflow-hidden cursor-pointer select-none"
          style={{ background: "linear-gradient(135deg,#0b1f3a 0%,#123a63 55%,#0d6b6b 100%)" }}
          aria-hidden="true"
        >
          {!still && (
            <motion.div
              className="absolute -top-1/3 -left-1/4 rounded-full pointer-events-none"
              style={{ width: "70vw", height: "70vw", background: "radial-gradient(circle,rgba(56,189,248,0.2),transparent 65%)" }}
              animate={{ x: ["0%", "26%", "0%"], y: ["0%", "20%", "0%"] }}
              transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          <div className="relative h-full flex flex-col items-center justify-center text-white px-8">
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
              className="mt-6 text-white/55 text-lg md:text-2xl"
            >
              {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </motion.p>

            <motion.div
              initial={still ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              <Stat label="seen today" value={String(seen)} />
              <Stat label="collected" value={`₹${collected.toLocaleString("en-IN")}`} />
              {waiting > 0 && <Stat label="waiting" value={String(waiting)} />}
            </motion.div>

            <motion.div
              initial={still ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="absolute bottom-10 left-0 right-0 text-center"
            >
              <p className="font-display font-bold text-2xl">{clinic.clinicName}</p>
              <p className="text-white/50 text-sm mt-0.5">
                {clinic.doctorName}{clinic.qualification ? ` · ${clinic.qualification}` : ""}
              </p>
              <p className="text-white/25 text-xs mt-6">Touch anywhere to continue</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3 rounded-2xl bg-white/10 text-center min-w-[128px]">
      <p className="font-display font-bold text-3xl tabular-nums">{value}</p>
      <p className="text-white/50 text-xs mt-0.5">{label}</p>
    </div>
  );
}

export default IdleScreen;
