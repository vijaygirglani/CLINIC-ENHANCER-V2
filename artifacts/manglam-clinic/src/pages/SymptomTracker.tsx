/**
 * Symptom Tracker — two questions, two tabs.
 *
 *   Patient  — "is this person actually getting better?"
 *              Every complaint they have had, in order, with the gap between
 *              visits, and a flag when the same complaint keeps coming back.
 *              A third visit for the same thing is a signal the line of
 *              treatment is not working, and it is the easiest thing in a
 *              busy OPD to miss.
 *
 *   Trends   — "what is going around?"
 *              Which complaints are rising and falling across the clinic,
 *              month on month, with the seasonal shape over twelve months.
 *
 * Both read the registers you already keep. Nothing new has to be recorded.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, Search, User, TrendingUp, TrendingDown, Minus, AlertTriangle,
  CalendarDays, Stethoscope, ArrowLeft, Download,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/export";
import { motionOff } from "@/components/AnimatedNumber";
import {
  allPatients, historyFor, trendsFor, dailyCounts, twelveMonths, patientsWith,
  isKnownSymptom, type PatientRef, type PatientHistory, type SymptomCount,
} from "@/lib/symptoms";

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

const fmtDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
};

export default function SymptomTracker() {
  const now = new Date();
  const [tab, setTab] = useState<"patient" | "trends">("patient");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 shadow-inner">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-display text-slate-900">Symptom Tracker</h2>
              <p className="text-slate-500 text-sm">
                {tab === "patient"
                  ? "Is this patient actually getting better?"
                  : "What is going around, and when."}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100 w-fit">
          {([["patient", "Patient"], ["trends", "What's going around"]] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "patient"
          ? <PatientTab />
          : <TrendsTab year={year} month={month} setYear={setYear} setMonth={setMonth} />}
      </div>
    </Layout>
  );
}

/* ══ Patient ═══════════════════════════════════════════════════════════ */

function PatientTab() {
  const still = motionOff();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const people = useMemo(() => allPatients(), []);
  const history: PatientHistory | null = useMemo(
    () => (selected ? historyFor(selected) : null),
    [selected]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people.slice(0, 40);
    return people
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.mobile || "").includes(q))
      .slice(0, 40);
  }, [query, people]);

  if (history) {
    return <PatientDetail history={history} onBack={() => setSelected(null)} still={still} />;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or mobile number..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
        />
      </div>

      {people.length === 0 ? (
        <EmptyCard
          icon={<User className="w-7 h-7" />}
          title="No patients yet"
          body="Once you have registered a few patients, their complaint history appears here."
        />
      ) : matches.length === 0 ? (
        <EmptyCard
          icon={<Search className="w-7 h-7" />}
          title="Nobody matches that"
          body="Try part of the name, or the last few digits of the mobile number."
        />
      ) : (
        <div className="medical-card divide-y divide-slate-100 overflow-hidden">
          {matches.map((p: PatientRef) => (
            <button
              key={p.key}
              onClick={() => setSelected(p.key)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {p.mobile || "no mobile"} · last seen {fmtDate(p.lastVisit)}
                </p>
              </div>
              <span className="shrink-0 text-xs font-bold text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">
                {p.visits} {p.visits === 1 ? "visit" : "visits"}
              </span>
            </button>
          ))}
        </div>
      )}
      {query.trim() === "" && people.length > 40 && (
        <p className="text-xs text-slate-400 text-center">
          Showing the 40 most recent. Search to find anyone else.
        </p>
      )}
    </div>
  );
}

function PatientDetail({
  history, onBack, still,
}: { history: PatientHistory; onBack: () => void; still: boolean }) {
  const { toast } = useToast();

  const handleExport = () => {
    const rows = history.entries.map(e => ({
      Date: e.date,
      "Days since previous": e.gapDays ?? "",
      Symptoms: e.symptoms.join(", "),
      "Complaint as written": e.visit.complaint || "",
      Treatment: e.visit.treatment || "",
      "Fees (₹)": e.visit.fees ?? "",
    }));
    exportToExcel(rows, `Symptoms_${history.name.replace(/\s+/g, "_")}`);
    toast({ title: "Exported", description: `${history.name}'s history exported.` });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> All patients
        </button>
        <button
          onClick={handleExport}
          className="px-3 py-2 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-1.5 text-sm"
        >
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* who */}
      <div className="medical-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-display font-extrabold text-xl text-slate-900">{history.name}</h3>
            <p className="text-sm text-slate-500">{history.mobile || "no mobile on record"}</p>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="font-display font-extrabold text-2xl text-slate-900 leading-none">
                {history.totalVisits}
              </p>
              <p className="text-[10px] uppercase font-bold text-slate-400">visits</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 leading-tight">
                {fmtDate(history.firstVisit)}
              </p>
              <p className="text-[10px] uppercase font-bold text-slate-400">first seen</p>
            </div>
          </div>
        </div>
      </div>

      {/* the thing worth noticing */}
      {history.repeats.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
          <h4 className="font-bold text-amber-900 flex items-center gap-2 text-sm mb-2.5">
            <AlertTriangle className="w-4 h-4" /> Keeps coming back
          </h4>
          <div className="space-y-1.5">
            {history.repeats.map(r => (
              <p key={r.symptom} className="text-sm text-amber-900">
                <strong>{r.symptom}</strong> — {r.count} visits
                {r.spanDays > 0 && <> over {r.spanDays} days</>}
                <span className="text-amber-700/70 text-xs">
                  {" "}({r.dates.map(d => fmtDate(d).replace(/ \d{4}$/, "")).join(", ")})
                </span>
              </p>
            ))}
          </div>
          <p className="text-xs text-amber-800/80 mt-2.5 leading-snug">
            The same complaint returning may mean the line of treatment needs
            rethinking, rather than repeating.
          </p>
        </div>
      )}

      {/* the visits */}
      <div className="space-y-3">
        {history.entries.map((e, i) => (
          <motion.div
            key={e.date + i}
            initial={still ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: still ? 0 : Math.min(i * 0.03, 0.3) }}
            className="medical-card p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                {fmtDate(e.date)}
              </p>
              {e.gapDays !== null && (
                <span className="text-xs text-slate-500">
                  {e.gapDays === 0 ? "same day" : `${e.gapDays} days after the previous visit`}
                </span>
              )}
            </div>

            {e.symptoms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {e.symptoms.map(s => (
                  <span
                    key={s}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isKnownSymptom(s)
                        ? "bg-violet-100 text-violet-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {e.visit.complaint && (
              <p className="text-xs text-slate-500 mb-1">
                <span className="font-semibold text-slate-600">As written:</span> {e.visit.complaint}
              </p>
            )}
            {e.visit.treatment && (
              <p className="text-xs text-slate-500 flex gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                <span className="whitespace-pre-line">{e.visit.treatment}</span>
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ══ Trends ════════════════════════════════════════════════════════════ */

function TrendsTab({
  year, month, setYear, setMonth,
}: {
  year: number; month: number;
  setYear: (n: number) => void; setMonth: (n: number) => void;
}) {
  const still = motionOff();
  const [focus, setFocus] = useState<string | null>(null);

  const trends = useMemo(() => trendsFor(year, month), [year, month]);
  const daily = useMemo(() => dailyCounts(year, month, focus || undefined), [year, month, focus]);
  const yearly = useMemo(() => twelveMonths(year, month, focus || undefined), [year, month, focus]);

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 2, y - 1, y, y + 1];
  }, []);

  const maxDaily = Math.max(1, ...daily);
  const maxYearly = Math.max(1, ...yearly.map(m => m.count));
  const monthTotal = daily.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      {/* month picker */}
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-slate-400" />
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold outline-none focus:border-primary"
        >
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold outline-none focus:border-primary"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {focus && (
          <button
            onClick={() => setFocus(null)}
            className="ml-1 px-3 py-2 rounded-xl text-sm font-semibold bg-violet-100 text-violet-800 hover:bg-violet-200 transition-colors"
          >
            Showing {focus} — show all
          </button>
        )}
      </div>

      {trends.length === 0 ? (
        <EmptyCard
          icon={<Activity className="w-7 h-7" />}
          title={`Nothing recorded in ${MONTHS[month - 1]} ${year}`}
          body="Complaints from the registers appear here once there are visits in this month."
        />
      ) : (
        <>
          {/* the list */}
          <div className="medical-card p-4">
            <h4 className="text-sm font-bold text-slate-700 mb-3">
              Most common this month
              <span className="font-normal text-slate-400"> — tap one to follow it</span>
            </h4>
            <div className="space-y-1.5">
              {trends.map((t: SymptomCount, i) => {
                const max = trends[0].count || 1;
                const diff = t.count - t.previous;
                return (
                  <motion.button
                    key={t.symptom}
                    onClick={() => setFocus(focus === t.symptom ? null : t.symptom)}
                    initial={still ? false : { opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: still ? 0 : Math.min(i * 0.03, 0.3) }}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors ${
                      focus === t.symptom ? "bg-violet-50 ring-1 ring-violet-300" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-36 shrink-0 text-sm font-semibold truncate ${
                      t.known ? "text-slate-800" : "text-slate-500 italic"
                    }`}>
                      {t.symptom}
                    </span>
                    <span className="flex-1 h-5 bg-slate-100 rounded-md overflow-hidden">
                      <motion.span
                        className="block h-full rounded-md bg-gradient-to-r from-violet-500 to-fuchsia-500"
                        initial={still ? false : { width: 0 }}
                        animate={{ width: `${(t.count / max) * 100}%` }}
                        transition={{ duration: still ? 0 : 0.5, ease: "easeOut" }}
                      />
                    </span>
                    <span className="w-10 text-right font-bold text-slate-900 tabular-nums text-sm">
                      {t.count}
                    </span>
                    <span className={`w-16 text-right text-xs font-semibold tabular-nums inline-flex items-center justify-end gap-0.5 ${
                      diff > 0 ? "text-rose-600" : diff < 0 ? "text-emerald-600" : "text-slate-400"
                    }`}>
                      {diff > 0 ? <TrendingUp className="w-3 h-3" />
                        : diff < 0 ? <TrendingDown className="w-3 h-3" />
                        : <Minus className="w-3 h-3" />}
                      {diff === 0 ? "same" : (diff > 0 ? `+${diff}` : diff)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2.5 leading-snug">
              The arrow compares with last month. Complaints in italics are ones
              the app did not recognise, kept in your own words.
            </p>
          </div>

          {/* day by day */}
          <div className="medical-card p-4">
            <div className="flex items-baseline justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-700">
                {focus ? `${focus}, day by day` : "Visits day by day"}
              </h4>
              <span className="text-xs text-slate-500">
                {monthTotal} in {MONTHS[month - 1]}
              </span>
            </div>
            <div className="w-full flex items-end gap-[3px]" style={{ height: 96 }}>
              {daily.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <motion.div
                    className="w-full rounded-t bg-gradient-to-t from-violet-500 to-fuchsia-400"
                    initial={still ? false : { height: 0 }}
                    animate={{ height: v > 0 ? Math.max(4, (v / maxDaily) * 88) : 2 }}
                    transition={{ duration: still ? 0 : 0.4, delay: still ? 0 : i * 0.008 }}
                    title={`${i + 1} ${MONTHS[month - 1]}: ${v}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1</span><span>{Math.ceil(daily.length / 2)}</span><span>{daily.length}</span>
            </div>
          </div>

          {/* the season */}
          <div className="medical-card p-4">
            <h4 className="text-sm font-bold text-slate-700 mb-3">
              {focus ? `${focus} over twelve months` : "Visits over twelve months"}
            </h4>
            <div className="w-full flex items-end gap-1.5" style={{ height: 112 }}>
              {yearly.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-[10px] font-bold text-slate-600 tabular-nums mb-0.5">
                    {m.count || ""}
                  </span>
                  <motion.div
                    className={`w-full rounded-t ${
                      i === yearly.length - 1
                        ? "bg-gradient-to-t from-violet-600 to-fuchsia-500"
                        : "bg-gradient-to-t from-slate-300 to-slate-200"
                    }`}
                    initial={still ? false : { height: 0 }}
                    animate={{ height: m.count > 0 ? Math.max(4, (m.count / maxYearly) * 80) : 2 }}
                    transition={{ duration: still ? 0 : 0.45, delay: still ? 0 : i * 0.03 }}
                    title={`${m.label} ${m.year}: ${m.count}`}
                  />
                  <span className="text-[9px] text-slate-400 mt-1">{m.label}</span>
                </div>
              ))}
            </div>
            {focus && (
              <p className="text-xs text-slate-500 mt-3">
                <strong className="text-slate-700">{patientsWith(focus, year, month)}</strong>{" "}
                separate patients reported {focus.toLowerCase()} in {MONTHS[month - 1]}.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── shared ───────────────────────────────────────────────────────────── */

function EmptyCard({
  icon, title, body,
}: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="medical-card p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <p className="font-semibold text-slate-700">{title}</p>
      <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">{body}</p>
    </div>
  );
}
