/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TOKEN QUEUE — reception desk screen
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Two jobs:
 *    · the desk issues tokens as patients arrive
 *    · the doctor presses Call Next and the queue advances
 *
 *  The waiting-room screen the patients see is its own page at /display,
 *  opened from here in a second window so it can live on a TV.
 *
 *  Nothing here touches store.ts, so patient records cannot be affected by
 *  anything on this page.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import {
  AnimatedNumber,
  FlipNumber,
  isLiteMode,
  setLiteMode,
  motionOff,
} from "@/components/AnimatedNumber";
import {
  issueToken,
  callNext,
  callToken,
  recallCurrent,
  completeToken,
  skipToken,
  restoreToken,
  removeToken,
  clearFinished,
  clearQueue,
  getQueue,
  getQueueStats,
  subscribeQueue,
  waitMinutes,
  queueToday,
  type QueueEntry,
} from "@/lib/queue";
import { playChime } from "@/lib/chime";
import { WalkingPatient } from "@/components/WalkingPatient";
import { getExtras, saveExtras } from "@/lib/clinicExtras";
import { getSavedSheetId, syncQueueFromSheet } from "@/lib/sheet";
import {
  Users, UserPlus, PlayCircle, SkipForward, CheckCircle2, RotateCcw,
  Trash2, Monitor, Clock, Volume2, Leaf, Stethoscope, Hourglass,
  Zap, ChevronRight, Bell, Sparkles, ExternalLink, RefreshCw, Sheet as SheetIcon,
} from "lucide-react";

/* ── wait-time colour: green under 10 min, amber to 30, red past that ────── */

function waitTone(mins: number) {
  if (mins >= 30) return { chip: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300", dot: "bg-rose-500", border: "border-l-rose-400" };
  if (mins >= 10) return { chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300", dot: "bg-amber-500", border: "border-l-amber-400" };
  return { chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300", dot: "bg-emerald-500", border: "border-l-emerald-400" };
}

function timeOf(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return "—";
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   STAT CARD — gradient, watermark icon, counting number
   ═══════════════════════════════════════════════════════════════════════════ */

function StatCard({
  label, value, icon: Icon, tone, suffix, pulse, sub,
}: {
  label: string;
  value: number;
  icon: any;
  tone: "blue" | "emerald" | "amber" | "violet";
  suffix?: string;
  pulse?: boolean;
  sub?: string;
}) {
  // Dark gets its own gradient and a lifted number colour rather than relying
  // on the compatibility layer — this card is new code, so it does it properly.
  const tones = {
    blue:    { grad: "from-blue-50 to-blue-100/40 dark:from-blue-500/12 dark:to-blue-500/5",             icon: "bg-blue-500/10 text-blue-600 dark:text-blue-300",       num: "text-blue-700 dark:text-blue-300",       mark: "text-blue-500/10 dark:text-blue-400/10" },
    emerald: { grad: "from-emerald-50 to-emerald-100/40 dark:from-emerald-500/12 dark:to-emerald-500/5", icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300", num: "text-emerald-700 dark:text-emerald-300", mark: "text-emerald-500/10 dark:text-emerald-400/10" },
    amber:   { grad: "from-amber-50 to-amber-100/40 dark:from-amber-500/12 dark:to-amber-500/5",         icon: "bg-amber-500/10 text-amber-600 dark:text-amber-300",     num: "text-amber-700 dark:text-amber-300",     mark: "text-amber-500/10 dark:text-amber-400/10" },
    violet:  { grad: "from-violet-50 to-violet-100/40 dark:from-violet-500/12 dark:to-violet-500/5",     icon: "bg-violet-500/10 text-violet-600 dark:text-violet-300",   num: "text-violet-700 dark:text-violet-300",   mark: "text-violet-500/10 dark:text-violet-400/10" },
  }[tone];

  return (
    <motion.div
      initial={motionOff() ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`relative overflow-hidden medical-card bg-gradient-to-br ${tones.grad} p-4`}
    >
      {/* big faint icon behind the number — stops the card reading as a plain box */}
      <Icon className={`absolute -right-3 -bottom-4 w-24 h-24 ${tones.mark}`} strokeWidth={1.5} />
      <div className="relative flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tones.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-display font-bold leading-none mt-0.5 ${tones.num}`}>
            <AnimatedNumber value={value} pulse={pulse} />
            {suffix && <span className="text-base font-semibold ml-0.5">{suffix}</span>}
          </p>
          {sub && <p className="text-[10px] text-slate-400 mt-1 truncate">{sub}</p>}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export default function Reception() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [, setTick] = useState(0);
  const [lite, setLite] = useState(isLiteMode());
  const [chimeOn, setChimeOn] = useState(true);
  const [showFinished, setShowFinished] = useState(false);
  const [idleMins, setIdleMins] = useState(() => getExtras().idleMinutes);

  // ── Sheet sync ──────────────────────────────────────────────────────────
  // Your staff type arriving patients into the same Google Sheet the
  // registration page already uses. This pulls them in and hands out tokens,
  // so the queue builds itself and you only press Call Next.
  const [sheetId] = useState(() => getSavedSheetId());
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(() => getExtras().queueAutoSync !== false);
  const [lastSync, setLastSync] = useState<string>("");

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [age, setAge] = useState("");
  const [note, setNote] = useState("");
  const [regType, setRegType] = useState<"general" | "ayurvedic">("general");
  const nameRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    const un = subscribeQueue(refresh);
    // Wait times are shown in minutes, so a 20 s tick keeps them honest
    // without repainting constantly.
    const t = setInterval(refresh, 20000);
    return () => { un(); clearInterval(t); };
  }, [refresh]);

  const day = getQueue();
  const stats = getQueueStats();
  const waiting = day.filter(e => e.status === "waiting");
  const finished = day.filter(e => e.status === "done" || e.status === "skipped");

  /* ── actions ───────────────────────────────────────────────────────────── */

  /**
   * Open the waiting-room screen in a window of its own, so it can be dragged
   * onto a TV and left there. A popup blocker just gets us a normal tab
   * instead, which still works.
   */
  const openDisplayWindow = () => {
    // "/?display=1" rather than "/display": the root path is served by every
    // host, so this window can never land on a 404 page in the waiting room.
    const url = `${window.location.origin}/?display=1`;
    const w = window.open(url, "clinic-display", "width=1280,height=760,menubar=no,toolbar=no");
    if (!w) {
      window.open(url, "_blank");
      return;
    }
    try { w.focus(); } catch { /* blocked focus is harmless */ }
    toast({
      title: "Display screen opened",
      description: "Drag that window to your second screen or TV, then press F11 for full screen.",
    });
  };

  const runSheetSync = useCallback(async (quiet: boolean) => {
    if (!sheetId) {
      if (!quiet) {
        toast({
          variant: "destructive",
          title: "No sheet connected",
          description: "Connect the Google Sheet on the Patient Registration page first.",
        });
      }
      return;
    }
    setSyncing(true);
    try {
      const res = await syncQueueFromSheet(sheetId);
      setLastSync(new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }));
      if (res.added > 0) {
        if (chimeOn) playChime(0.14);
        toast({
          title: `${res.added} patient${res.added === 1 ? "" : "s"} added from the sheet`,
          description: res.firstToken !== null
            ? `Tokens ${res.firstToken} onward. ${res.skipped} already had one.`
            : undefined,
        });
      } else if (!quiet) {
        toast({
          title: "Nothing new in the sheet",
          description: `All ${res.total} row${res.total === 1 ? "" : "s"} already have a token.`,
        });
      }
    } catch (err: any) {
      // A background sync that fails stays quiet — the clinic's internet
      // dropping for a minute should not throw a red box across the screen
      // every minute. A sync you asked for always reports.
      if (!quiet) {
        toast({ variant: "destructive", title: "Sheet sync failed", description: err?.message || "Could not read the sheet." });
      } else {
        console.warn("Background sheet sync failed:", err);
      }
    } finally {
      setSyncing(false);
    }
  }, [sheetId, toast, chimeOn]);

  // Auto-sync once a minute while the page is open.
  useEffect(() => {
    if (!autoSync || !sheetId) return;
    runSheetSync(true);
    const t = setInterval(() => runSheetSync(true), 60000);
    return () => clearInterval(t);
  }, [autoSync, sheetId, runSheetSync]);

  const handleIssue = () => {
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Name needed", description: "Type the patient's name to give a token." });
      nameRef.current?.focus();
      return;
    }
    try {
      const e = issueToken({ name, mobile, age, note, registerType: regType });
      toast({ title: `Token ${e.token} issued`, description: `${e.name} added to the waiting list.` });
      setName(""); setMobile(""); setAge(""); setNote("");
      nameRef.current?.focus();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Could not issue token", description: err?.message || "Unknown error." });
    }
  };

  const handleCallNext = () => {
    const e = callNext();
    if (!e) {
      toast({ title: "Queue is empty", description: "Nobody is waiting right now." });
      return;
    }
    if (chimeOn) playChime();
    toast({ title: `Token ${e.token} — ${e.name}`, description: "Called in. Previous patient marked done." });
  };

  const handleOpenInRegistration = (e: QueueEntry) => {
    // Hand the details over to the registration form, which picks this up on
    // mount and clears it.
    try {
      localStorage.setItem("cp_queue_prefill", JSON.stringify({
        tokenId: e.id, token: e.token, name: e.name, mobile: e.mobile,
        age: e.age || "", registerType: e.registerType || "general",
      }));
    } catch { /* storage blocked — the doctor can still type it */ }
    navigate("/");
  };

  /* ── render ────────────────────────────────────────────────────────────── */

  const now = stats.nowServing;

  return (
    <Layout>
      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div className="mr-auto">
          <h1 className="text-2xl font-display font-bold leading-tight">Token Queue</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            {" · "}Next token <span className="font-semibold text-slate-700 dark:text-slate-200">{stats.nextToken}</span>
            {lastSync && <span className="text-slate-400"> · sheet read {lastSync}</span>}
          </p>
        </div>

        <button onClick={() => setChimeOn(c => !c)}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors
            ${chimeOn
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
          <Volume2 className="w-3.5 h-3.5" /> {chimeOn ? "Chime on" : "Chime off"}
        </button>

        <button onClick={() => { const v = !lite; setLite(v); setLiteMode(v); }}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors
            ${lite
              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}
          title="Turn every animation off — for older PCs">
          <Zap className="w-3.5 h-3.5" /> {lite ? "Lite mode on" : "Lite mode off"}
        </button>

        {/* Sheet sync — the staff's list becomes the queue */}
        <button onClick={() => runSheetSync(false)} disabled={syncing}
          title={sheetId
            ? "Read the staff sheet now and give a token to anyone new"
            : "Connect the Google Sheet on the Patient Registration page first"}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60
            ${sheetId ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-400"}`}>
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Reading sheet…" : "Sync sheet"}
        </button>

        <button onClick={() => { const v = !autoSync; setAutoSync(v); saveExtras({ ...getExtras(), queueAutoSync: v }); }}
          title="Check the sheet every minute on its own"
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors
            ${autoSync ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          <SheetIcon className="w-3.5 h-3.5" /> {autoSync ? "Auto on" : "Auto off"}
        </button>

        {/* Idle screen delay — the one place it needs to be settable */}
        <select
          value={idleMins}
          onChange={e => { const v = Number(e.target.value); setIdleMins(v); saveExtras({ ...getExtras(), idleMinutes: v }); }}
          title="Show the clock screen after this long with no input — it also hides patient details from anyone walking past"
          className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold border-0 outline-none cursor-pointer hover:bg-slate-200 transition-colors"
        >
          <option value={0}>Idle screen off</option>
          <option value={2}>Idle after 2 min</option>
          <option value={5}>Idle after 5 min</option>
          <option value={10}>Idle after 10 min</option>
          <option value={20}>Idle after 20 min</option>
        </select>

        <button onClick={openDisplayWindow}
          title="Opens in a separate window for your waiting-room TV"
          className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold flex items-center gap-2 hover:bg-slate-800 transition-colors dark:bg-slate-700 dark:hover:bg-slate-600">
          <Monitor className="w-4 h-4" /> Display Screen
          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </button>
      </div>

      {/* ── STAT ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Waiting"  value={stats.waiting} icon={Hourglass}    tone="amber"
          sub={stats.longestWaitMin > 0 ? `longest ${stats.longestWaitMin} min` : "nobody waiting"} />
        <StatCard label="Now serving" value={now?.token || 0} icon={Stethoscope} tone="blue"
          sub={now ? now.name : "press Call Next"} />
        <StatCard label="Seen today" value={stats.done} icon={CheckCircle2} tone="emerald" pulse
          sub={`${stats.total} token${stats.total === 1 ? "" : "s"} issued`} />
        <StatCard label="Avg wait" value={stats.avgWaitMin} icon={Clock} tone="violet" suffix=" min"
          sub={stats.skipped > 0 ? `${stats.skipped} skipped` : "arrival to called"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ══ LEFT: now serving + waiting list ══ */}
        <div className="lg:col-span-2 space-y-5">

          {/* NOW SERVING hero */}
          <div className="medical-card overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <p className="font-display font-bold text-slate-800">Now Serving</p>
              {now && (
                <span className="ml-auto text-xs text-slate-400">
                  called {timeOf(now.calledAt)}
                </span>
              )}
            </div>

            <AnimatePresence mode="wait">
              {now ? (
                <motion.div key={now.id}
                  initial={motionOff() ? false : { opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={motionOff() ? undefined : { opacity: 0, x: -40 }}
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  className="p-5 flex flex-wrap items-center gap-5">
                  <div className="flex items-center gap-1 shrink-0">
                    {/* walks in each time a new token is called */}
                    <WalkingPatient trigger={`${now.token}-${now.announceCount}`} size={52} />
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-primary/25">
                      <span className="font-display font-extrabold text-5xl tabular-nums">
                        <FlipNumber key={`${now.token}-${now.announceCount}`} value={now.token} />
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold text-2xl text-slate-900 truncate">{now.name}</p>
                    <p className="text-sm text-slate-500">
                      {now.mobile || "no mobile"}{now.age ? ` · ${now.age}` : ""}
                      {now.registerType === "ayurvedic" && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                          <Leaf className="w-3 h-3" /> Ayurvedic
                        </span>
                      )}
                    </p>
                    {now.note && <p className="text-xs text-violet-600 mt-1 italic">{now.note}</p>}
                    <p className="text-xs text-slate-400 mt-1">
                      waited {waitMinutes(now)} min before being called
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleOpenInRegistration(now)}
                      className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-colors">
                      Write prescription <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => { recallCurrent(); if (chimeOn) playChime(); }}
                      className="px-3 py-2.5 rounded-xl bg-amber-100 text-amber-700 text-sm font-semibold flex items-center gap-1.5 hover:bg-amber-200 transition-colors"
                      title="Flash this token again on the display screen">
                      <Volume2 className="w-4 h-4" /> Recall
                    </button>
                    <button onClick={() => { completeToken(now.id); toast({ title: `Token ${now.token} done` }); }}
                      className="px-3 py-2.5 rounded-xl bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center gap-1.5 hover:bg-emerald-200 transition-colors">
                      <CheckCircle2 className="w-4 h-4" /> Done
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="p-8 text-center">
                  <Stethoscope className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Nobody is in the room yet.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
              <motion.button onClick={handleCallNext}
                whileTap={motionOff() ? undefined : { scale: 0.98 }}
                disabled={waiting.length === 0}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-cyan-500 text-white font-display font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:cursor-not-allowed transition-all">
                <PlayCircle className="w-6 h-6" />
                {waiting.length === 0 ? "Nobody waiting" : `Call Next — Token ${waiting[0].token}`}
              </motion.button>
              <p className="text-center text-[11px] text-slate-400 mt-2">
                Calling the next patient marks the current one as done.
              </p>
            </div>
          </div>

          {/* WAITING LIST */}
          <div className="medical-card overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <Hourglass className="w-4 h-4 text-amber-500" />
              <p className="font-display font-bold text-slate-800">Waiting</p>
              <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold tabular-nums">
                {waiting.length}
              </span>
              {finished.length > 0 && (
                <button onClick={() => setShowFinished(s => !s)}
                  className="ml-auto text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                  {showFinished ? "Hide" : "Show"} finished ({finished.length})
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              <AnimatePresence initial={false}>
                {waiting.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="p-8 text-center">
                    <Sparkles className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Waiting list is clear.</p>
                  </motion.div>
                )}
                {waiting.map((e, i) => {
                  const mins = waitMinutes(e);
                  const tone = waitTone(mins);
                  return (
                    <motion.div key={e.id} layout
                      initial={motionOff() ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={motionOff() ? undefined : { opacity: 0, x: 60, height: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30, delay: motionOff() ? 0 : Math.min(i * 0.03, 0.3) }}
                      className={`px-5 py-3.5 flex items-center gap-4 border-l-4 ${tone.border} hover:bg-slate-50/70 transition-colors`}>
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <span className="font-display font-bold text-xl text-slate-700 tabular-nums">{e.token}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 truncate">
                          {e.name}
                          {e.registerType === "ayurvedic" && <Leaf className="w-3.5 h-3.5 text-emerald-600 inline ml-1.5 -mt-0.5" />}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {e.mobile || "no mobile"}{e.age ? ` · ${e.age}` : ""} · arrived {timeOf(e.arrivedAt)}
                          {e.note ? ` · ${e.note}` : ""}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums shrink-0 flex items-center gap-1.5 ${tone.chip}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                        {mins} min
                      </span>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { callToken(e.id); if (chimeOn) playChime(); }}
                          className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors" title="Call this one in now">
                          <PlayCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => skipToken(e.id)}
                          className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors" title="Did not turn up">
                          <SkipForward className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeToken(e.id)}
                          className="p-2 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Remove">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* finished rows */}
            <AnimatePresence>
              {showFinished && finished.length > 0 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100 bg-slate-50/60 overflow-hidden">
                  {finished.map(e => (
                    <div key={e.id} className="px-5 py-2.5 flex items-center gap-3 text-sm">
                      <span className="w-8 text-center font-display font-bold text-slate-400 tabular-nums">{e.token}</span>
                      <span className={`flex-1 truncate ${e.status === "skipped" ? "text-amber-600" : "text-slate-500 line-through"}`}>
                        {e.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {e.status === "skipped" ? "skipped" : `done ${timeOf(e.doneAt)}`}
                      </span>
                      <button onClick={() => restoreToken(e.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-white transition-colors" title="Put back in the queue">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="px-5 py-3 flex gap-2">
                    <button onClick={() => { clearFinished(); toast({ title: "Finished tokens cleared" }); }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800">Clear finished</button>
                    <span className="text-slate-300">·</span>
                    <button onClick={() => { if (confirm("Reset today's queue completely? Tokens start again at 1.")) { clearQueue(); toast({ title: "Queue reset" }); } }}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-700">Reset today's queue</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ══ RIGHT: issue a token ══ */}
        <div className="space-y-5">
          <div className="medical-card overflow-hidden sticky top-20">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-gradient-to-r from-primary/5 to-cyan-500/5">
              <UserPlus className="w-4 h-4 text-primary" />
              <p className="font-display font-bold text-slate-800">New Arrival</p>
              <span className="ml-auto px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                Token {stats.nextToken}
              </span>
            </div>
            <div className="p-5 space-y-3"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleIssue(); } }}>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Name</label>
                <input ref={nameRef} value={name} onChange={e => setName(e.target.value)}
                  autoComplete="off" autoCorrect="off" spellCheck={false}
                  placeholder="Name"
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mobile</label>
                  <input value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, ""))}
                    maxLength={10} autoComplete="off" placeholder="10 digits"
                    className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Age</label>
                  <input value={age} onChange={e => setAge(e.target.value)}
                    autoComplete="off" placeholder="e.g. 34"
                    className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Note (optional)</label>
                <input value={note} onChange={e => setNote(e.target.value)}
                  autoComplete="off" placeholder="e.g. report dekhana hai"
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" />
              </div>
              <div className="flex gap-2">
                {(["general", "ayurvedic"] as const).map(t => (
                  <button key={t} onClick={() => setRegType(t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all flex items-center justify-center gap-1.5
                      ${regType === t
                        ? t === "ayurvedic" ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300" : "bg-primary/10 text-primary ring-2 ring-primary/30"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                    {t === "ayurvedic" ? <Leaf className="w-3.5 h-3.5" /> : <Stethoscope className="w-3.5 h-3.5" />}
                    {t}
                  </button>
                ))}
              </div>
              <motion.button onClick={handleIssue}
                whileTap={motionOff() ? undefined : { scale: 0.98 }}
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-display font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
                <UserPlus className="w-5 h-5" /> Give Token {stats.nextToken}
              </motion.button>
              <p className="text-center text-[11px] text-slate-400">
                Press Enter from any field to issue the token.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
