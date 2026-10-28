/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  WAITING-ROOM DISPLAY SCREEN  —  route /display
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  A page of its own, with no app chrome, so it can be opened in a second
 *  window, dragged onto a TV or second monitor and left there all day.
 *
 *  It stays in step with the desk through the browser `storage` event — press
 *  Call Next on the reception PC and this screen changes immediately, with no
 *  refresh and no polling.
 *
 *  Nothing here is hard-coded to one clinic: the name, doctor and logo letter
 *  come from Clinic Settings, and the tips come from whatever Pathya–Apathya
 *  library has been imported.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getQueueStats, subscribeQueue, type QueueEntry,
} from "@/lib/queue";
import { playChime } from "@/lib/chime";
import { motionOff } from "@/components/AnimatedNumber";
import { CredentialsCard } from "@/components/CredentialsCard";
import { WalkingPatient } from "@/components/WalkingPatient";
import {
  getDisplayClinic, getDisplaySettings, saveDisplaySettings, getDisplayTips,
  LOOKS, DISPLAY_TEXT,
  type DisplaySettings, type DisplayLook, type DisplayLang,
} from "@/lib/displaySettings";
import {
  Settings, X, Maximize2, Minimize2, Users, Volume2, VolumeX, Clock,
} from "lucide-react";

/* ── the big number, dropping in ─────────────────────────────────────────── */

function TokenNumber({ value, flashKey, color }: { value: number | string; flashKey: string | number; color: string }) {
  if (motionOff()) {
    return <span style={{ color, fontVariantNumeric: "tabular-nums" }}>{value}</span>;
  }
  return (
    <motion.span
      key={flashKey}
      initial={{ y: "-55%", opacity: 0, filter: "blur(10px)" }}
      animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      style={{ display: "inline-block", color, fontVariantNumeric: "tabular-nums" }}
    >
      {value}
    </motion.span>
  );
}

/* ── settings panel ──────────────────────────────────────────────────────── */

function SettingsPanel({
  settings, onChange, onClose,
}: {
  settings: DisplaySettings;
  onChange: (s: DisplaySettings) => void;
  onClose: () => void;
}) {
  const set = <K extends keyof DisplaySettings>(k: K, v: DisplaySettings[K]) =>
    onChange({ ...settings, [k]: v });

  const Row = ({ label, children }: { label: string; children: any }) => (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-sm text-slate-300">{label}</span>
      <div className="flex gap-1.5">{children}</div>
    </div>
  );

  const Pill = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: any }) => (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px]
        ${on ? "bg-white text-slate-900" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}>
      {children}
    </button>
  );

  return (
    <motion.div
      initial={motionOff() ? false : { opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={motionOff() ? undefined : { opacity: 0, x: 40 }}
      className="fixed top-0 right-0 bottom-0 z-20 w-[360px] max-w-[90vw] bg-slate-900/95 backdrop-blur-xl border-l border-white/10 p-6 overflow-y-auto"
    >
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-4 h-4 text-slate-400" />
        <h2 className="text-white font-bold">Display settings</h2>
        <button type="button" onClick={onClose} aria-label="Close settings"
          className="ml-auto p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="divide-y divide-white/10">
        <Row label="Look">
          {(Object.keys(LOOKS) as DisplayLook[]).map(k => (
            <Pill key={k} on={settings.look === k} onClick={() => set("look", k)}>{LOOKS[k].name}</Pill>
          ))}
        </Row>
        <Row label="Language">
          {([["gu", "ગુજરાતી"], ["hi", "हिंदी"], ["en", "English"]] as [DisplayLang, string][]).map(([k, label]) => (
            <Pill key={k} on={settings.lang === k} onClick={() => set("lang", k)}>{label}</Pill>
          ))}
        </Row>
        <Row label="Show up next">
          <Pill on={settings.showUpNext} onClick={() => set("showUpNext", true)}>On</Pill>
          <Pill on={!settings.showUpNext} onClick={() => set("showUpNext", false)}>Off</Pill>
        </Row>
        <Row label="Show health tips">
          <Pill on={settings.showTips} onClick={() => set("showTips", true)}>On</Pill>
          <Pill on={!settings.showTips} onClick={() => set("showTips", false)}>Off</Pill>
        </Row>
        <Row label="Tip changes every">
          {[10, 20, 40].map(s => (
            <Pill key={s} on={settings.tipSeconds === s} onClick={() => set("tipSeconds", s)}>{s}s</Pill>
          ))}
        </Row>
        <Row label="Chime on call">
          <Pill on={settings.chime} onClick={() => set("chime", true)}>On</Pill>
          <Pill on={!settings.chime} onClick={() => set("chime", false)}>Off</Pill>
        </Row>
        <Row label="Doctor's card">
          <Pill on={settings.showCard} onClick={() => set("showCard", true)}>On</Pill>
          <Pill on={!settings.showCard} onClick={() => set("showCard", false)}>Off</Pill>
        </Row>
        <Row label="Card appears every">
          {[60, 90, 180].map(s => (
            <Pill key={s} on={settings.cardEverySeconds === s} onClick={() => set("cardEverySeconds", s)}>
              {s < 120 ? `${s}s` : `${s / 60}m`}
            </Pill>
          ))}
        </Row>
      </div>

      <p className="mt-5 text-xs text-slate-400 leading-relaxed">
        Drag this window onto the waiting-room screen and press <b className="text-slate-200">F11</b> for
        full screen. It follows the reception desk on its own — leave it running
        all day.
      </p>
      <p className="mt-3 text-xs text-slate-500 leading-relaxed">
        Health tips come from your own Pathya–Apathya library. Import diseases
        there and they appear here in the chosen language.
      </p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE SCREEN
   ═══════════════════════════════════════════════════════════════════════════ */

export default function Display() {
  const [, setTick] = useState(0);
  const [settings, setSettings] = useState<DisplaySettings>(getDisplaySettings);
  const [showSettings, setShowSettings] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [isFull, setIsFull] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);
  const [flash, setFlash] = useState(0);
  const [cardOn, setCardOn] = useState(false);

  const tipsRef = useRef<string[]>(getDisplayTips(getDisplaySettings().lang));
  const lastAnnounce = useRef<string>("");
  const hideTimer = useRef<any>(null);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  /* live queue + clock */
  useEffect(() => {
    const un = subscribeQueue(refresh);
    const clock = setInterval(refresh, 1000);
    return () => { un(); clearInterval(clock); };
  }, [refresh]);

  /* tips rotate; reload the pool when the language changes */
  useEffect(() => {
    tipsRef.current = getDisplayTips(settings.lang);
    setTipIdx(0);
  }, [settings.lang]);

  useEffect(() => {
    if (!settings.showTips) return;
    const t = setInterval(
      () => setTipIdx(i => (i + 1) % Math.max(1, tipsRef.current.length)),
      Math.max(5, settings.tipSeconds) * 1000,
    );
    return () => clearInterval(t);
  }, [settings.showTips, settings.tipSeconds]);

  /* The credentials card cycles in, stays ~14s, goes away again. Turned off
     entirely from the settings panel for a clinic that does not want it. */
  useEffect(() => {
    if (!settings.showCard) { setCardOn(false); return; }
    const every = Math.max(30, settings.cardEverySeconds) * 1000;
    let hide: any;
    const show = () => {
      setCardOn(true);
      hide = setTimeout(() => setCardOn(false), 14000);
    };
    const t = setInterval(show, every);
    const first = setTimeout(show, 12000);
    return () => { clearInterval(t); clearTimeout(first); clearTimeout(hide); };
  }, [settings.showCard, settings.cardEverySeconds]);

  /* A token has just been called — get the card out of the way so the
     number has the screen to itself. */
  useEffect(() => { if (flash) setCardOn(false); }, [flash]);

  /* hide the buttons after a few still seconds — it is a wall screen */
  useEffect(() => {
    const wake = () => {
      setChromeVisible(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setChromeVisible(false), 4000);
    };
    wake();
    window.addEventListener("mousemove", wake);
    window.addEventListener("touchstart", wake);
    return () => {
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("touchstart", wake);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  /* fullscreen state */
  useEffect(() => {
    const onFs = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const stats = getQueueStats();
  const now: QueueEntry | null = stats.nowServing;

  /* chime + flash whenever a NEW token is called (or recalled) */
  const announceId = now ? `${now.id}-${now.announceCount || 0}` : "";
  useEffect(() => {
    if (!announceId) return;
    if (lastAnnounce.current === "") { lastAnnounce.current = announceId; return; }
    if (lastAnnounce.current === announceId) return;
    lastAnnounce.current = announceId;
    if (settings.chime) playChime(0.3);
    setFlash(f => f + 1);
  }, [announceId, settings.chime]);

  const apply = (s: DisplaySettings) => { setSettings(s); saveDisplaySettings(s); };

  const toggleFullscreen = () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    } catch {
      /* browser refused — F11 still works */
    }
  };

  const look = LOOKS[settings.look];
  const T = DISPLAY_TEXT[settings.lang];
  const tips = tipsRef.current;
  const tip = tips.length ? tips[tipIdx % tips.length] : "";
  const clockText = new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  const clinic = getDisplayClinic();

  // Letter-spacing pulls Devanagari and Gujarati conjuncts apart — "अभी चल रहा है"
  // renders as "अ भी च ल र हा है". Only widen Latin.
  const isLatin = settings.lang === "en";
  const labelClass = isLatin
    ? "tracking-[0.4em] text-sm md:text-base font-semibold"
    : "text-base md:text-xl font-semibold";
  const subLabelClass = isLatin
    ? "tracking-[0.35em] text-xs md:text-sm font-semibold"
    : "text-sm md:text-lg font-semibold";

  return (
    <div className="fixed inset-0 overflow-hidden select-none" style={{ background: look.background, color: look.ink }}>

      {/* the doctor's card, cycling in between tokens */}
      <CredentialsCard show={cardOn} clinic={clinic} lang={settings.lang} look={look} />

      {/* slow drifting glow, so a static wall screen is not dead */}
      {!motionOff() && (
        <motion.div
          className="absolute -top-1/3 -left-1/4 rounded-full pointer-events-none"
          style={{ width: "70vw", height: "70vw", background: look.glow }}
          animate={{ x: ["0%", "28%", "0%"], y: ["0%", "22%", "0%"] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* a soft pulse of light when a new token is called */}
      <AnimatePresence>
        {flash > 0 && (
          <motion.div key={flash} className="absolute inset-0 pointer-events-none"
            style={{ background: look.accent }}
            initial={{ opacity: 0.22 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }} />
        )}
      </AnimatePresence>

      {/* controls — fade out when nobody is touching the machine */}
      <AnimatePresence>
        {chromeVisible && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute top-5 right-5 z-10 flex gap-2">
            <button type="button" onClick={() => apply({ ...settings, chime: !settings.chime })}
              aria-label={settings.chime ? "Mute the chime" : "Turn the chime on"}
              className="p-2.5 rounded-xl transition-colors"
              style={{ background: look.panel, color: look.ink }}>
              {settings.chime ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button type="button" onClick={toggleFullscreen}
              aria-label={isFull ? "Leave full screen" : "Go full screen"}
              className="p-2.5 rounded-xl transition-colors"
              style={{ background: look.panel, color: look.ink }}>
              {isFull ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button type="button" onClick={() => setShowSettings(true)}
              aria-label="Display settings"
              className="p-2.5 rounded-xl transition-colors"
              style={{ background: look.panel, color: look.ink }}>
              <Settings className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <SettingsPanel settings={settings} onChange={apply} onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      {/* ── the screen ── */}
      <div className="relative h-full flex flex-col px-[5vw] py-[4vh]">

        {/* clinic bar — right padding keeps the clock clear of the controls */}
        <div className="flex items-center justify-between gap-6 pr-36">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-2xl shrink-0"
              style={{ background: look.panel }}>
              {clinic.logoLetter}
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-3xl leading-tight truncate">{clinic.clinicName}</p>
              <p className="text-base truncate" style={{ color: look.muted }}>
                {clinic.doctorName}{clinic.qualification ? ` · ${clinic.qualification}` : ""}
              </p>
            </div>
          </div>
          <p className="font-display text-4xl tabular-nums shrink-0" style={{ color: look.muted }}>
            {clockText}
          </p>
        </div>

        {/* NOW SERVING */}
        <div className="flex-1 flex items-stretch justify-center gap-[4vw] py-[2vh] min-h-0">
          <div className="flex-[1.6] flex flex-col items-center justify-center min-w-0">
            <p className={labelClass} style={{ color: look.muted }}>
              {T.nowServing}
            </p>
            <div className="font-display font-extrabold leading-[0.85] mt-[1vh]"
              style={{ fontSize: "clamp(8rem,27vw,24rem)" }}>
              {now
                ? <TokenNumber value={now.token} flashKey={announceId} color={look.ink} />
                : <span style={{ color: look.divider }}>—</span>}
            </div>
            <div className="mt-[2vh] flex items-center justify-center gap-[1.5vw] max-w-full">
              {now && (
                <WalkingPatient key={announceId} trigger={announceId} size={64} color={look.accent} />
              )}
              <AnimatePresence mode="wait">
                <motion.p key={now?.id || "none"}
                  initial={motionOff() ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={motionOff() ? undefined : { opacity: 0, y: -12 }}
                  className="font-semibold text-center truncate"
                  style={{ fontSize: "clamp(1.6rem,3.4vw,3rem)", color: look.accent }}>
                  {now ? now.name : (stats.total === 0 ? T.takeToken : T.pleaseWait)}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* up next */}
          {settings.showUpNext && (
            <div className="hidden md:flex flex-[1] flex-col justify-center pl-[3vw] min-w-0"
              style={{ borderLeft: `1px solid ${look.divider}` }}>
              <p className={`${subLabelClass} mb-[3vh]`} style={{ color: look.muted }}>
                {T.upNext}
              </p>
              <AnimatePresence mode="popLayout">
                {stats.upNext.length === 0 && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-2xl" style={{ color: look.divider }}>
                    {T.noneWaiting}
                  </motion.p>
                )}
                {stats.upNext.map((e, i) => (
                  <motion.div key={e.id} layout
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1 - i * 0.2, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ type: "spring", stiffness: 260, damping: 26 }}
                    className="flex items-baseline gap-[1.5vw] mb-[3vh] min-w-0">
                    <span className="font-display font-bold tabular-nums shrink-0"
                      style={{ fontSize: "clamp(2.4rem,5.5vw,5rem)" }}>
                      {e.token}
                    </span>
                    <span className="truncate" style={{ fontSize: "clamp(1rem,1.8vw,1.75rem)", color: look.muted }}>
                      {e.name}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* footer: waiting count + rotating tip */}
        <div className="flex items-end justify-between gap-6">
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl" style={{ background: look.panel }}>
              <Users className="w-5 h-5" style={{ color: look.accent }} />
              <span className="font-display font-bold text-2xl tabular-nums">{stats.waiting}</span>
              <span className="text-sm" style={{ color: look.muted }}>{T.waiting}</span>
            </div>
            {stats.avgWaitMin > 0 && (
              <div className="hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: look.panel }}>
                <Clock className="w-4 h-4" style={{ color: look.muted }} />
                <span className="font-display font-bold text-xl tabular-nums">~{stats.avgWaitMin}</span>
                <span className="text-sm" style={{ color: look.muted }}>min</span>
              </div>
            )}
          </div>

          {settings.showTips && tip && (
            <AnimatePresence mode="wait">
              <motion.p key={tipIdx}
                initial={motionOff() ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={motionOff() ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.5 }}
                className="text-right text-lg md:text-2xl font-medium max-w-[58%]"
                style={{ color: look.accent }}>
                {tip}
              </motion.p>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
