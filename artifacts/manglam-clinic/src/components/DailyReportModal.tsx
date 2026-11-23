/**
 * DailyReportModal — the evening WhatsApp message, for any date.
 *
 * Three things it has to do:
 *
 *   · Pick any date and pull that day's real figures out of the register.
 *   · Let every figure be overwritten by hand, because the register is not
 *     always the whole story — cash taken after closing, a fee waived, an
 *     expense paid from the drawer.
 *   · Send it straight to one colleague rather than opening WhatsApp and
 *     hunting through the contact list.
 *
 * ── One deliberate change from the old report ───────────────────────────
 * The collection total and the cash/online split used to be worked out two
 * different ways, so they could disagree. Here the collection is always
 * cash + online, which means an edited figure still produces a message that
 * adds up.
 *
 * Nothing is translated and nothing is invented: what is typed is what is
 * sent, and the preview is the message, character for character.
 */

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  MessageCircle, X, RotateCcw, Users, Plus, Trash2, Star, Pencil, Check,
  Send, Wallet, Smartphone, Receipt, CalendarDays,
} from "lucide-react";
import { getDailyStats, getExpenses } from "@/lib/store";
import {
  getContacts, addContact, removeContact, setPreferred, updateContact,
  subscribeContacts, whatsappLink, prettyNumber, onlyDigits,
  type ReportContact,
} from "@/lib/reportContacts";

const LOOSE_SALE_KEY = "manglam_loose_sales";

interface LooseSale { id: string; product: string; amount: number; date: string }

function looseForDate(date: string): LooseSale[] {
  try {
    const rows = JSON.parse(localStorage.getItem(LOOSE_SALE_KEY) || "[]");
    return Array.isArray(rows) ? rows.filter((e: LooseSale) => e && e.date === date) : [];
  } catch {
    return [];
  }
}

/** Clinic identity, read the same way the prescription reads it. */
function clinicIdentity(): { clinic: string; doctor: string; place: string } {
  try {
    const s = JSON.parse(
      localStorage.getItem("manglam_clinic_settings_for_print") ||
      localStorage.getItem("manglam_clinic_settings") ||
      "{}"
    );
    return {
      clinic: s.clinicName || "Manglam Clinic",
      doctor: s.doctorName || "Dr. Vijay Girglani",
      place: s.footerCity || s.address || "",
    };
  } catch {
    return { clinic: "Manglam Clinic", doctor: "Dr. Vijay Girglani", place: "" };
  }
}

/** What the register actually holds for a given day. */
interface DayFigures {
  patients: number;
  generalCount: number;
  generalFees: number;
  ayurvedicCount: number;
  ayurvedicFees: number;
  cash: number;
  online: number;
  expenses: number;
  expenseLabel: string;
  looseTotal: number;
  looseCount: number;
}

function figuresFor(date: string): DayFigures {
  let rows: any[] = [];
  try { rows = getDailyStats(date).patients || []; } catch { rows = []; }

  const general = rows.filter(p => p.registerType !== "ayurvedic");
  const ayurvedic = rows.filter(p => p.registerType === "ayurvedic");
  const sum = (a: any[]) => a.reduce((s, p) => s + (Number(p.fees) || 0), 0);

  let expenses = 0;
  let expenseLabel = "";
  try {
    const todays = getExpenses().filter(e => e && e.date === date);
    expenses = todays.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    expenseLabel = [...new Set(todays.map(e => String(e.category || "").trim()).filter(Boolean))].join(", ");
  } catch {
    /* no expenses recorded */
  }

  const loose = looseForDate(date);

  return {
    patients: rows.length,
    generalCount: general.length,
    generalFees: sum(general),
    ayurvedicCount: ayurvedic.length,
    ayurvedicFees: sum(ayurvedic),
    cash: sum(rows.filter(p => p.paymentMode !== "online")),
    online: sum(rows.filter(p => p.paymentMode === "online")),
    expenses,
    expenseLabel,
    looseTotal: loose.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    looseCount: loose.length,
  };
}

const rupees = (n: number) => "₹" + Math.round(n || 0).toLocaleString("en-IN");

export function DailyReportModal({
  initialDate,
  onClose,
  onSent,
}: {
  initialDate: string;
  onClose: () => void;
  onSent?: (to: string) => void;
}) {
  const [date, setDate] = useState(initialDate);

  // What the register says, recomputed whenever the date changes.
  const actual = useMemo(() => figuresFor(date), [date]);

  /** Overrides are kept separately so "reset" can always get back. */
  const [edits, setEdits] = useState<Partial<Record<keyof DayFigures, string>>>({});
  const [note, setNote] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(true);

  // A new date means new figures, so the old overrides no longer apply.
  useEffect(() => { setEdits({}); }, [date]);

  const [contacts, setContacts] = useState<ReportContact[]>(() => getContacts());
  const [toId, setToId] = useState<string>(() => getContacts().find(c => c.preferred)?.id || "");
  const [managing, setManaging] = useState(false);

  useEffect(() => subscribeContacts(() => setContacts(getContacts())), []);

  const val = (k: keyof DayFigures): number => {
    const edited = edits[k];
    if (edited !== undefined && edited !== "") return Number(edited) || 0;
    if (edited === "") return 0;
    return Number(actual[k]) || 0;
  };
  const text = (k: keyof DayFigures): string => {
    const edited = edits[k];
    if (edited !== undefined) return edited;
    return String(actual[k] ?? "");
  };
  const edited = (k: keyof DayFigures) =>
    edits[k] !== undefined && String(edits[k]) !== String(actual[k]);

  const set = (k: keyof DayFigures, v: string) => setEdits(e => ({ ...e, [k]: v }));
  const anyEdited = (Object.keys(edits) as Array<keyof DayFigures>).some(edited);

  const cash = val("cash");
  const online = val("online");
  const collection = cash + online;
  const expenses = val("expenses");
  const net = collection - expenses;

  /* ── the message ──────────────────────────────────────────────────── */
  const message = useMemo(() => {
    const id = clinicIdentity();
    const dateStr = format(new Date(date + "T00:00:00"), "dd/MM/yyyy");
    const lines: string[] = [];

    lines.push(`*${id.clinic} — Daily Update*`);
    lines.push("");
    lines.push(`Date: ${dateStr}`);
    lines.push("");

    const patients = val("patients");
    if (patients > 0) lines.push(`Patients Seen: ${patients}`);

    if (showBreakdown && (val("generalCount") > 0 || val("ayurvedicCount") > 0)) {
      if (val("generalCount") > 0)
        lines.push(`General: ${val("generalCount")} (${rupees(val("generalFees"))})`);
      if (val("ayurvedicCount") > 0)
        lines.push(`Ayurvedic: ${val("ayurvedicCount")} (${rupees(val("ayurvedicFees"))})`);
    }

    if (patients > 0 || collection > 0) lines.push("");
    if (cash > 0) lines.push(`💵 Cash: ${rupees(cash)}`);
    if (online > 0) lines.push(`📱 Online: ${rupees(online)}`);
    lines.push(`*Collection: ${rupees(collection)}*`);

    const looseTotal = val("looseTotal");
    if (looseTotal > 0) {
      lines.push("");
      lines.push(`🛒 Loose Medicine Sales: ${rupees(looseTotal)}${
        val("looseCount") > 0 ? ` (${val("looseCount")} items)` : ""}`);
    }

    if (expenses > 0) {
      const label = edits.expenseLabel !== undefined ? edits.expenseLabel : actual.expenseLabel;
      lines.push("");
      lines.push(`💸 Expenses: ${rupees(expenses)}${label ? ` (${label})` : ""}`);
      lines.push(`*Net: ${rupees(net)}*`);
    }

    if (note.trim()) {
      lines.push("");
      lines.push(`Note: ${note.trim()}`);
    }

    lines.push("");
    lines.push(id.doctor);
    if (id.clinic) lines.push(`${id.clinic}${id.place ? `, ${id.place}` : ""}`);

    return lines.join("\n");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, edits, note, showBreakdown, actual, cash, online, collection, expenses, net]);

  const recipient = contacts.find(c => c.id === toId);

  const send = () => {
    window.open(whatsappLink(message, recipient?.mobile), "_blank");
    onSent?.(recipient ? recipient.name : "WhatsApp");
    onClose();
  };

  /* ── render ───────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]">

        {/* header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-green-50 rounded-t-2xl shrink-0">
          <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900">Daily Report</p>
            <p className="text-xs text-slate-500">
              Figures come from the register. Change any of them before sending.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* date */}
          <div>
            <Label>Report date</Label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={e => e.target.value && setDate(e.target.value)}
                  className="pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none text-sm font-semibold"
                />
              </div>
              <button
                onClick={() => setDate(format(new Date(), "yyyy-MM-dd"))}
                className="px-3 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Today
              </button>
              {anyEdited && (
                <button
                  onClick={() => setEdits({})}
                  title="Put every figure back to what the register says"
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset to actual
                </button>
              )}
            </div>
          </div>

          {/* figures */}
          <div>
            <Label>Figures</Label>
            <div className="grid sm:grid-cols-2 gap-3">
              <Figure
                icon={<Users className="w-4 h-4" />} label="Patients seen"
                value={text("patients")} onChange={v => set("patients", v)}
                edited={edited("patients")} actual={String(actual.patients)} />
              <Figure
                icon={<Wallet className="w-4 h-4" />} label="Cash collection" prefix="₹"
                value={text("cash")} onChange={v => set("cash", v)}
                edited={edited("cash")} actual={rupees(actual.cash)} />
              <Figure
                icon={<Smartphone className="w-4 h-4" />} label="Online collection" prefix="₹"
                value={text("online")} onChange={v => set("online", v)}
                edited={edited("online")} actual={rupees(actual.online)} />
              <Figure
                icon={<Receipt className="w-4 h-4" />} label="Expenses" prefix="₹"
                value={text("expenses")} onChange={v => set("expenses", v)}
                edited={edited("expenses")} actual={rupees(actual.expenses)} />
            </div>

            <div className="mt-3">
              <input
                value={edits.expenseLabel !== undefined ? edits.expenseLabel : actual.expenseLabel}
                onChange={e => set("expenseLabel", e.target.value)}
                placeholder="What the expense was for (optional)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none text-sm"
              />
            </div>

            {/* the sum, so it is obvious what will be sent */}
            <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span className="text-slate-600">
                Collection <strong className="text-slate-900">{rupees(collection)}</strong>
              </span>
              {expenses > 0 && (
                <span className="text-slate-600">
                  Net after expenses <strong className={net < 0 ? "text-rose-600" : "text-emerald-700"}>
                    {rupees(net)}
                  </strong>
                </span>
              )}
            </div>

            <label className="flex items-center gap-2 mt-3 text-sm text-slate-600 cursor-pointer select-none">
              <input type="checkbox" checked={showBreakdown}
                onChange={e => setShowBreakdown(e.target.checked)}
                className="rounded border-slate-300" />
              Include the general / Ayurvedic split
            </label>
          </div>

          {/* note */}
          <div>
            <Label>Add a note (optional)</Label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. Clinic closed tomorrow, camp on Sunday..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none text-sm resize-none"
            />
          </div>

          {/* who it goes to */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="mb-0">Send to</Label>
              <button
                onClick={() => setManaging(m => !m)}
                className="text-xs font-semibold text-green-700 hover:text-green-800"
              >
                {managing ? "Done" : "Manage numbers"}
              </button>
            </div>

            {contacts.length === 0 && !managing ? (
              <button
                onClick={() => setManaging(true)}
                className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-500 hover:border-green-400 hover:text-green-700 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add a doctor's WhatsApp number
              </button>
            ) : (
              <div className="space-y-2">
                <ChoiceRow
                  active={toId === ""}
                  onClick={() => setToId("")}
                  title="Choose in WhatsApp"
                  sub="Opens WhatsApp and lets you pick the chat"
                />
                {contacts.map(c => (
                  <ChoiceRow
                    key={c.id}
                    active={toId === c.id}
                    onClick={() => setToId(c.id)}
                    title={c.name}
                    sub={prettyNumber(c.mobile) + (c.note ? ` · ${c.note}` : "")}
                    right={managing ? (
                      <span className="flex items-center gap-1">
                        <button
                          title="Make this the default"
                          onClick={e => { e.stopPropagation(); setPreferred(c.id); }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            c.preferred ? "text-amber-500" : "text-slate-300 hover:text-amber-500"}`}
                        >
                          <Star className="w-4 h-4" fill={c.preferred ? "currentColor" : "none"} />
                        </button>
                        <button
                          title="Remove"
                          onClick={e => {
                            e.stopPropagation();
                            if (confirm(`Remove ${c.name} from the list?`)) {
                              removeContact(c.id);
                              if (toId === c.id) setToId("");
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </span>
                    ) : c.preferred ? (
                      <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
                    ) : null}
                  />
                ))}
              </div>
            )}

            {managing && <AddContact onAdded={id => setToId(id)} />}
          </div>

          {/* preview */}
          <div>
            <Label>This is exactly what gets sent</Label>
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {message}
            </div>
          </div>
        </div>

        {/* send */}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0 flex flex-wrap gap-2">
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={send}
            className="flex-1 min-w-[200px] px-4 py-3 rounded-xl font-semibold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25 transition-all inline-flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {recipient ? `Send to ${recipient.name}` : "Open WhatsApp"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── small pieces ─────────────────────────────────────────────────────── */

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${className}`}>
      {children}
    </p>
  );
}

function Figure({
  icon, label, value, onChange, edited, actual, prefix,
}: {
  icon: React.ReactNode; label: string; value: string;
  onChange: (v: string) => void; edited: boolean; actual: string; prefix?: string;
}) {
  return (
    <div className={`rounded-xl border px-3.5 py-2.5 transition-colors ${
      edited ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
        {edited && <span className="ml-auto text-amber-700 normal-case tracking-normal">edited</span>}
      </div>
      <div className="flex items-baseline gap-1 mt-0.5">
        {prefix && <span className="text-slate-400 font-semibold">{prefix}</span>}
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-transparent outline-none text-lg font-bold text-slate-900 tabular-nums"
        />
      </div>
      {edited && (
        <p className="text-[11px] text-amber-700 mt-0.5">Register says {actual}</p>
      )}
    </div>
  );
}

function ChoiceRow({
  active, onClick, title, sub, right,
}: {
  active: boolean; onClick: () => void; title: string; sub: string; right?: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
        active ? "border-green-500 bg-green-50 ring-2 ring-green-100" : "border-slate-200 hover:bg-slate-50"
      }`}
    >
      <span className={`w-4 h-4 rounded-full border-2 shrink-0 grid place-items-center ${
        active ? "border-green-600" : "border-slate-300"}`}>
        {active && <span className="w-2 h-2 rounded-full bg-green-600" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-slate-800 text-sm truncate">{title}</span>
        <span className="block text-xs text-slate-500 truncate">{sub}</span>
      </span>
      {right}
    </div>
  );
}

function AddContact({ onAdded }: { onAdded: (id: string) => void }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");

  const save = () => {
    const digits = onlyDigits(mobile);
    if (!name.trim()) { setError("Enter a name."); return; }
    if (digits.length < 10) { setError("Enter a 10-digit mobile number."); return; }
    const row = addContact(name, mobile);
    if (!row) { setError("That did not look like a valid number."); return; }
    onAdded(row.id);
    setName(""); setMobile(""); setError("");
  };

  return (
    <div className="mt-2 rounded-xl border border-slate-200 p-3 bg-slate-50">
      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
        <input
          value={name}
          onChange={e => { setName(e.target.value); setError(""); }}
          placeholder="Doctor's name"
          className="px-3 py-2.5 rounded-lg border border-slate-200 focus:border-green-500 outline-none text-sm"
        />
        <input
          value={mobile}
          onChange={e => { setMobile(e.target.value); setError(""); }}
          onKeyDown={e => { if (e.key === "Enter") save(); }}
          placeholder="WhatsApp number"
          inputMode="numeric"
          className="px-3 py-2.5 rounded-lg border border-slate-200 focus:border-green-500 outline-none text-sm"
        />
        <button
          onClick={save}
          className="px-4 py-2.5 rounded-lg font-semibold bg-slate-800 text-white text-sm hover:bg-slate-900 transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      {error
        ? <p className="text-xs text-rose-600 mt-2">{error}</p>
        : <p className="text-xs text-slate-500 mt-2">
            Indian numbers only need the 10 digits — 91 is added for you.
          </p>}
    </div>
  );
}

export default DailyReportModal;
