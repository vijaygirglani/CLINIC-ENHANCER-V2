import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { getUniqueContacts, type PatientContact } from "@/lib/store";
import { exportToExcel } from "@/lib/export";
import {
  MessageCircle, Search, Download, Copy, Send, Users,
  CheckSquare, Square, ChevronRight, ChevronLeft, X, Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Broadcast() {
  const [contacts] = useState<PatientContact[]>(() => getUniqueContacts());
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(contacts.map((c) => c.mobile)));
  const [message, setMessage] = useState("");
  const [countryCode, setCountryCode] = useState("91");
  const [senderOpen, setSenderOpen] = useState(false);
  const [senderIndex, setSenderIndex] = useState(0);
  const [sentMobiles, setSentMobiles] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => c.name.toLowerCase().includes(q) || c.mobile.includes(q));
  }, [contacts, searchTerm]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.mobile));

  const toggleOne = (mobile: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(mobile)) next.delete(mobile); else next.add(mobile);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((c) => next.delete(c.mobile));
      } else {
        filtered.forEach((c) => next.add(c.mobile));
      }
      return next;
    });
  };

  const selectedContacts = useMemo(
    () => contacts.filter((c) => selected.has(c.mobile)),
    [contacts, selected]
  );

  const handleExport = () => {
    const data = selectedContacts.map((c) => ({
      Name: c.name,
      Mobile: c.mobile,
      "WhatsApp Number (with code)": `${countryCode}${c.mobile}`,
      Visits: c.visitCount,
      "Last Visit": c.lastVisitDate,
      Register: c.registerTypes.join(", "),
    }));
    exportToExcel(data, "Manglam_Clinic_Patient_Contacts");
    toast({ title: "Exported", description: `${data.length} contacts exported to Excel.` });
  };

  const handleCopyNumbers = async () => {
    const text = selectedContacts.map((c) => `${countryCode}${c.mobile}`).join("\n");
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${selectedContacts.length} numbers copied to clipboard.` });
  };

  const buildWaLink = (contact: PatientContact) => {
    const personalized = message.replace(/\{name\}/gi, contact.name || "");
    return `https://wa.me/${countryCode}${contact.mobile}?text=${encodeURIComponent(personalized)}`;
  };

  const startBroadcast = () => {
    if (!message.trim()) {
      toast({ variant: "destructive", title: "Write a message first", description: "Type the message you want to send before starting." });
      return;
    }
    if (selectedContacts.length === 0) {
      toast({ variant: "destructive", title: "No contacts selected", description: "Select at least one patient to message." });
      return;
    }
    setSenderIndex(0);
    setSentMobiles(new Set());
    setSenderOpen(true);
  };

  const current = selectedContacts[senderIndex];

  const handleOpenWhatsApp = () => {
    if (!current) return;
    window.open(buildWaLink(current), "_blank");
    setSentMobiles((prev) => new Set(prev).add(current.mobile));
  };

  const goNext = () => setSenderIndex((i) => Math.min(i + 1, selectedContacts.length - 1));
  const goPrev = () => setSenderIndex((i) => Math.max(i - 1, 0));

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 shadow-inner">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-display text-slate-900">WhatsApp Broadcast</h2>
            <p className="text-slate-500 text-sm">
              All unique patient mobile numbers from the Daily &amp; Ayurvedic Registers (case/patient numbers excluded).
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="medical-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><Users className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{contacts.length}</p>
              <p className="text-xs text-slate-500">Unique contacts found</p>
            </div>
          </div>
          <div className="medical-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center"><Check className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{selectedContacts.length}</p>
              <p className="text-xs text-slate-500">Selected for broadcast</p>
            </div>
          </div>
          <div className="medical-card p-4 flex flex-col justify-center">
            <label className="text-xs font-semibold text-slate-500 mb-1">Country Code (for WhatsApp link)</label>
            <input value={countryCode} onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, ""))}
              className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-center" placeholder="91" />
          </div>
        </div>

        {/* Message composer */}
        <div className="medical-card p-5 space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Broadcast Message
            <span className="text-slate-400 font-normal text-xs ml-2 normal-case">
              — use <span className="font-mono bg-slate-100 px-1 rounded">{"{name}"}</span> to insert each patient's name
            </span>
          </label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none text-slate-800"
            placeholder={"Dear {name}, Manglam Clinic will remain closed on... / New OPD timings are..."} />
          <div className="flex flex-wrap gap-2 justify-end">
            <button onClick={handleCopyNumbers} className="px-3 py-2.5 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-1.5 text-sm">
              <Copy className="w-4 h-4" /> Copy Numbers
            </button>
            <button onClick={handleExport} className="px-3 py-2.5 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-1.5 text-sm">
              <Download className="w-4 h-4" /> Export to Excel
            </button>
            <button onClick={startBroadcast} className="px-4 py-2.5 rounded-xl font-semibold bg-green-600 text-white shadow-lg shadow-green-600/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm">
              <Send className="w-4 h-4" /> Start WhatsApp Broadcast
            </button>
          </div>
          <p className="text-xs text-slate-400">
            WhatsApp doesn't allow apps to auto-send messages to many numbers at once. "Start Broadcast" opens a
            guided sender: it opens a pre-filled WhatsApp chat for each selected patient one by one — you just tap
            <span className="font-semibold"> Send</span> in WhatsApp, then come back and tap <span className="font-semibold">Next</span>.
          </p>
        </div>

        {/* Contact list */}
        <div className="medical-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or mobile number..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-700" />
            </div>
            <button onClick={toggleAllFiltered} className="px-3 py-2.5 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-1.5 text-sm shrink-0">
              {allFilteredSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
              {allFilteredSelected ? "Unselect All" : "Select All"} ({filtered.length})
            </button>
          </div>

          <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-200/60 sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-500 w-10"></th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Name</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Mobile</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Register</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Visits</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Last Visit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length > 0 ? filtered.map((c) => (
                  <tr key={c.mobile} className="hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => toggleOne(c.mobile)}>
                    <td className="px-4 py-3">
                      {selected.has(c.mobile) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-slate-300" />}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{c.name || "—"}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{c.mobile}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {c.registerTypes.map((r) => (
                          <span key={r} className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${r === "ayurvedic" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                            {r === "ayurvedic" ? "Ayurvedic" : "Daily"}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.visitCount}</td>
                    <td className="px-4 py-3 text-slate-600">{c.lastVisitDate}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No contacts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Guided sender overlay */}
      {senderOpen && current && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-slate-900">WhatsApp Broadcast</h3>
              <button onClick={() => setSenderOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="text-sm text-slate-500">
              Contact <span className="font-semibold text-slate-800">{senderIndex + 1}</span> of {selectedContacts.length}
              {sentMobiles.has(current.mobile) && <span className="ml-2 text-green-600 font-semibold">✓ opened</span>}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="font-bold text-slate-800">{current.name || "—"}</p>
              <p className="font-mono text-slate-600 text-sm">+{countryCode} {current.mobile}</p>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-sm text-slate-700 whitespace-pre-wrap">
              {message.replace(/\{name\}/gi, current.name || "")}
            </div>

            <button onClick={handleOpenWhatsApp} className="w-full px-4 py-3 rounded-xl font-semibold bg-green-600 text-white shadow-lg shadow-green-600/25 hover:shadow-xl transition-all flex items-center justify-center gap-2">
              <MessageCircle className="w-4 h-4" /> Open WhatsApp Chat
            </button>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button onClick={goPrev} disabled={senderIndex === 0} className="px-4 py-2 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition-colors flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-xs text-slate-400">{sentMobiles.size} of {selectedContacts.length} opened</span>
              {senderIndex < selectedContacts.length - 1 ? (
                <button onClick={goNext} className="px-4 py-2 rounded-xl font-medium bg-primary text-white transition-colors flex items-center gap-1">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={() => setSenderOpen(false)} className="px-4 py-2 rounded-xl font-medium bg-green-600 text-white transition-colors flex items-center gap-1">
                  Done <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
