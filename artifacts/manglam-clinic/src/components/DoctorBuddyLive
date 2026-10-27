/**
 * DoctorBuddyLive — works out what the doctor should be doing.
 *
 * Kept in its own component on purpose: it watches three form fields, and
 * `useWatch` re-renders whatever component it sits in. Isolated here, a
 * keystroke in the complaint box repaints this little box and nothing else —
 * the registration page itself is untouched, so typing stays instant.
 */

import { useEffect, useRef, useState } from "react";
import { useWatch, type Control } from "react-hook-form";
import { DoctorBuddy, type DoctorMood } from "@/components/DoctorBuddy";
import { getQueueStats, subscribeQueue } from "@/lib/queue";

/** Minutes of nothing at all before he puts the kettle on. */
const TEA_AFTER_MIN = 4;

export function DoctorBuddyLive({
  control,
  savedTick,
  className = "",
}: {
  control: Control<any>;
  /** bumped on a successful save */
  savedTick: number;
  className?: string;
}) {
  const name = useWatch({ control, name: "name" }) as string | undefined;
  const complaint = useWatch({ control, name: "complaint" }) as string | undefined;
  const treatment = useWatch({ control, name: "treatment" }) as string | undefined;

  const [waiting, setWaiting] = useState(0);
  const [, setTick] = useState(0);

  // Queue count, live.
  useEffect(() => {
    const read = () => {
      try { setWaiting(getQueueStats().waiting); } catch { setWaiting(0); }
    };
    read();
    const un = subscribeQueue(read);
    const t = setInterval(read, 20000);
    return () => { un(); clearInterval(t); };
  }, []);

  // "Saved" only lasts a few seconds.
  const savedAt = useRef(0);
  useEffect(() => {
    if (!savedTick) return;
    savedAt.current = Date.now();
    setTick(n => n + 1);
    const t = setTimeout(() => setTick(n => n + 1), 4200);
    return () => clearTimeout(t);
  }, [savedTick]);

  // Last time anything happened, for the tea break.
  const lastActive = useRef(Date.now());
  useEffect(() => {
    if ((name || complaint || treatment || "").toString().trim()) {
      lastActive.current = Date.now();
    }
  }, [name, complaint, treatment]);
  useEffect(() => { if (waiting > 0) lastActive.current = Date.now(); }, [waiting]);

  // Re-check every half minute so the tea break can arrive on its own.
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const typed = (s?: string) => (s || "").trim().length > 0;
  const now = Date.now();

  let mood: DoctorMood;
  if (now - savedAt.current < 4000) mood = "saved";
  else if (typed(treatment)) mood = "writing";
  else if (typed(complaint)) mood = "listening";
  else if (typed(name)) mood = "greeting";
  else if (waiting > 0) mood = "waiting";
  else if (now - lastActive.current > TEA_AFTER_MIN * 60000) mood = "tea";
  else mood = "idle";

  return (
    <DoctorBuddy mood={mood} waitingCount={waiting} patientName={name} className={className} />
  );
}

export default DoctorBuddyLive;
