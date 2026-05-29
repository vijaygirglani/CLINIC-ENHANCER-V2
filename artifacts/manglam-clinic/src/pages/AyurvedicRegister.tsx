import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Layout } from "@/components/Layout";
import {
  getAyurvedicDailyStats, updatePatient, deletePatient, getAllAyurvedicDates,
  getFollowUpReminders,
  type Patient, type DailyStats, type FollowUpReminder,
} from "@/lib/store";
import {
  Calendar, Download, Edit2, Trash2, Users, IndianRupee, FileText,
  ChevronDown, ChevronUp, Printer, Bell, X, Clock, AlertTriangle,
  Hourglass, CheckCircle2, WalletCards,
} from "lucide-react";

// ── Pending Fees helpers ──────────────────────────────────────────────
const PENDING_KEY = "manglam_pending_fees";
interface PendingEntry { patientId: number; name: string; mobile: string; fees: number; date: string; markedAt: string; }
function getPendingFees(): PendingEntry[] { try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]"); } catch { return []; } }
function addPendingFee(entry: PendingEntry) { const list = getPendingFees().filter(e => e.patientId !== entry.patientId); list.push(entry); localStorage.setItem(PENDING_KEY, JSON.stringify(list)); }
function removePendingFee(patientId: number) { const list = getPendingFees().filter(e => e.patientId !== patientId); localStorage.setItem(PENDING_KEY, JSON.stringify(list)); }
function isPending(patientId: number): boolean { return getPendingFees().some(e => e.patientId === patientId); }
import { exportToExcel } from "@/lib/export";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PrintPrescription, printPatientPrescription } from "@/components/PrintPrescription";
import * as z from "zod";

const editSchema = z.object({
  name: z.string().min(1),
  age: z.coerce.number().optional(),
  ageMonths: z.coerce.number().optional(),
  weight: z.string().optional(),
  address: z.string().optional(),
  mobile: z.string(),
  complaintCode: z.string().optional(),
  complaint: z.string().optional(),
  treatment: z.string().optional(),
  advice: z.string().optional(),
  reports: z.string().optional(),
  fees: z.coerce.number().optional(),
});

export default function AyurvedicRegister() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [allDates, setAllDates] = useState<{ date: string; count: number; totalFees: number }[]>([]);
  const [printPatient, setPrintPatient] = useState<Patient | null>(null);
  const [reminders, setReminders] = useState<FollowUpReminder[]>([]);
  const [showReminders, setShowReminders] = useState(true);
  const [pendingFees, setPendingFees] = useState<PendingEntry[]>([]);
  const [showPending, setShowPending] = useState(true);
  const { toast } = useToast();

  const refreshPending = () => setPendingFees(getPendingFees());

  const refresh = useCallback(() => {
    setStats(getAyurvedicDailyStats(selectedDate));
    setAllDates(getAllAyurvedicDates());
    setReminders(getFollowUpReminders());
  }, [selectedDate]);

  useEffect(() => { refresh(); refreshPending(); }, [refresh]);

  const editForm = useForm({ resolver: zodResolver(editSchema), values: editingPatient || {} });

  const handleExport = () => {
    if (!stats?.patients || stats.patients.length === 0) {
      toast({ variant: "destructive", title: "No Data", description: "No patients to export for this date." });
      return;
    }
    const exportData = stats.patients.map((p, index) => ({
      "S.No": index + 1,
      "Name": p.name,
      "Age": `${p.age || 0} yrs${p.ageMonths ? ` ${p.ageMonths} mo` : ""}`,
      "Weight": p.weight || "-",
      "Address": p.address || "-",
      "Mobile/Case": p.mobile,
      "Complaint": p.complaint || "-",
      "Treatment": p.treatment || "-",
      "Advice": p.advice || "-",
      "Fees": p.fees || 0,
      "Date": format(new Date(p.visitDate), "dd-MMM-yyyy"),
    }));
    exportToExcel(exportData, `Manglam_Ayurvedic_${selectedDate}`);
    toast({ title: "Export Successful", description: "Excel file downloaded." });
  };

  const onEditSubmit = (data: any) => {
    if (!editingPatient) return;
    updatePatient(editingPatient.id, { ...data, fees: Number(data.fees || 0) });
    toast({ title: "Updated", description: "Patient record updated." });
    setEditingPatient(null);
    refresh();
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    deletePatient(id);
    toast({ title: "Deleted", description: "Patient record deleted." });
    refresh();
  };

  const handleTogglePending = (p: Patient) => {
    if (isPending(p.id)) {
      removePendingFee(p.id);
      toast({ title: "Marked as Paid", description: `${p.name}'s fees cleared from pending.` });
    } else {
      addPendingFee({ patientId: p.id, name: p.name, mobile: p.mobile, fees: p.fees || 0, date: p.visitDate, markedAt: new Date().toISOString() });
      toast({ title: "Marked as Pending", description: `₹${p.fees || 0} pending for ${p.name}.` });
    }
    refreshPending();
  };

  const overdueReminders = reminders.filter(r => r.daysOverdue > 0);
  const todayReminders = reminders.filter(r => r.daysOverdue === 0);
  const upcomingReminders = reminders.filter(r => r.daysOverdue < 0);

  return (
    <Layout>
      {printPatient && <PrintPrescription patient={printPatient} />}

      <div className="space-y-6">
        {/* ── STICKY HEADER ── */}
        <div className="sticky top-16 z-30 -mx-4 md:-mx-8 px-4 md:px-8 bg-white/95 backdrop-blur-md border-b border-emerald-100 py-3 shadow-sm">
          <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-lg shrink-0">
                🌿
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-slate-900">Ayurvedic Register</h2>
                <p className="text-slate-500 text-xs">Ayurvedic patients for selected date</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-emerald-500 shadow-sm text-slate-700 font-medium text-sm" />
              </div>
              <button onClick={handleExport}
                className="px-3 py-2 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm text-sm flex items-center gap-1.5">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* ── STATS CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="medical-card p-5 flex items-center gap-4 bg-gradient-to-br from-white to-emerald-50/50">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Patients</p>
              <p className="text-3xl font-display font-bold text-slate-900">{stats?.totalPatients || 0}</p>
            </div>
          </div>
          <div className="medical-card p-5 flex items-center gap-4 bg-gradient-to-br from-white to-emerald-50/50">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Collection</p>
              <p className="text-3xl font-display font-bold text-slate-900">{formatCurrency(stats?.totalFees || 0)}</p>
            </div>
          </div>
        </div>

        {/* ── PATIENT TABLE ── */}
        <div className="medical-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-emerald-50 border-b border-emerald-100">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">#</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Patient</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Weight</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Complaint</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Treatment</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Fees</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-center">Pending</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.patients && stats.patients.length > 0 ? (
                  stats.patients.map((p, i) => (
                    <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">
                          {p.age ? `${p.age}y` : ""}
                          {p.ageMonths ? ` ${p.ageMonths}m` : ""}
                          {(p.age || p.ageMonths) && p.mobile ? " · " : ""}
                          {p.mobile}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.weight || "-"}</td>
                      <td className="px-4 py-3 max-w-[160px] truncate text-slate-600">
                        {p.complaintCode && <span className="font-bold text-emerald-700 mr-1">[{p.complaintCode}]</span>}
                        {p.complaint || "-"}
                      </td>
                      <td className="px-4 py-3 max-w-[160px] truncate text-slate-600">{p.treatment || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${isPending(p.id) ? "text-amber-500" : "text-slate-900"}`}>
                          {p.fees ? `₹${p.fees}` : "-"}
                        </span>
                        {isPending(p.id) && (
                          <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">PENDING</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleTogglePending(p)}
                          title={isPending(p.id) ? "Mark as Paid" : "Mark as Pending"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isPending(p.id)
                              ? "bg-amber-100 text-amber-600 hover:bg-green-100 hover:text-green-600"
                              : "text-slate-300 hover:bg-amber-50 hover:text-amber-500"
                          }`}>
                          {isPending(p.id)
                            ? <Hourglass className="w-4 h-4" />
                            : <Hourglass className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setPrintPatient(p); setTimeout(() => printPatientPrescription(p), 50); }}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                            <Printer className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingPatient(p)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(p.id)}
                            className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <FileText className="w-12 h-12 mb-3 text-slate-300" />
                        <p className="text-base font-medium">No Ayurvedic patients for this date</p>
                        <p className="text-sm mt-1">Save patients using "Save Ayurvedic" on the registration page</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── PENDING FEES PANEL ── */}
        <div className="medical-card overflow-hidden">
          <button onClick={() => setShowPending(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-amber-50/40 transition-colors">
            <div className="flex items-center gap-2">
              <WalletCards className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-slate-800">Pending Fees</span>
              {pendingFees.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">{pendingFees.length}</span>
              )}
              {pendingFees.length > 0 && (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                  Total: ₹{pendingFees.reduce((s, e) => s + e.fees, 0)}
                </span>
              )}
            </div>
            {showPending ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          {showPending && (
            <div className="border-t border-amber-100">
              {pendingFees.length === 0 ? (
                <div className="px-6 py-10 text-center text-slate-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
                  <p className="text-sm font-medium">No pending fees</p>
                  <p className="text-xs mt-1">Use the ⏳ button in the table to mark fees as pending</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-amber-50">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-500">#</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">Patient</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">Visit Date</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 text-right">Pending Amount</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 text-center">Mark Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {pendingFees.map((e, i) => (
                      <tr key={e.patientId} className="hover:bg-amber-50/40 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-medium">{i + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{e.name}</p>
                          <p className="text-xs font-mono text-slate-400">{e.mobile}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {format(new Date(e.date + "T00:00:00"), "dd MMM yyyy")}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-amber-600 text-base">₹{e.fees}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => { removePendingFee(e.patientId); refreshPending(); toast({ title: "Marked as Paid", description: `${e.name}'s fees cleared.` }); }}
                            className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-semibold text-xs hover:bg-emerald-200 transition-colors border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-amber-50 border-t border-amber-200">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 font-bold text-slate-700">Total Pending</td>
                      <td className="px-4 py-3 text-right font-bold text-amber-600 text-base">
                        ₹{pendingFees.reduce((s, e) => s + e.fees, 0)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          )}
        </div>

        {/* ── FOLLOW-UP REMINDERS (moved below patient table) ── */}
        {showReminders && reminders.length > 0 && (
          <div className="rounded-2xl border overflow-hidden">
            <div className={`flex items-center justify-between px-4 py-3 ${
              overdueReminders.length > 0 ? "bg-red-50 border-red-200" :
              todayReminders.length > 0 ? "bg-amber-50 border-amber-200" :
              "bg-blue-50 border-blue-200"
            }`}>
              <div className="flex items-center gap-2 flex-wrap">
                <Bell className={`w-4 h-4 ${overdueReminders.length > 0 ? "text-red-500" : todayReminders.length > 0 ? "text-amber-500" : "text-blue-500"}`} />
                <span className="font-semibold text-sm text-slate-800">Follow-up Reminders</span>
                {overdueReminders.length > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">{overdueReminders.length} overdue</span>
                )}
                {todayReminders.length > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">{todayReminders.length} today</span>
                )}
                {upcomingReminders.length > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-400 text-white">{upcomingReminders.length} upcoming</span>
                )}
              </div>
              <button onClick={() => setShowReminders(false)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-slate-100 bg-white">
              {reminders.map((r, i) => {
                const isOverdue = r.daysOverdue > 0;
                const isToday = r.daysOverdue === 0;
                return (
                  <div key={i} className="flex items-center gap-4 px-4 py-2.5 hover:bg-slate-50">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isOverdue ? "bg-red-100" : isToday ? "bg-amber-100" : "bg-blue-100"
                    }`}>
                      {isOverdue ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        : isToday ? <Bell className="w-3.5 h-3.5 text-amber-500" />
                        : <Clock className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{r.patient.name}</p>
                      <p className="text-xs font-mono text-slate-400">{r.patient.mobile}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-bold ${isOverdue ? "text-red-600" : isToday ? "text-amber-600" : "text-blue-500"}`}>
                        {isOverdue ? `${r.daysOverdue}d overdue` : isToday ? "Due today" : `In ${Math.abs(r.daysOverdue)}d`}
                      </p>
                      <p className="text-xs text-slate-400">{format(new Date(r.followUpDate + "T00:00:00"), "dd MMM")}</p>
                    </div>
                    <button onClick={() => setSelectedDate(r.patient.visitDate)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors shrink-0 border border-emerald-200">
                      View
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {!showReminders && reminders.length > 0 && (
          <button onClick={() => setShowReminders(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors">
            <Bell className="w-4 h-4" />
            {reminders.length} follow-up reminder{reminders.length > 1 ? "s" : ""} — tap to show
          </button>
        )}

        {/* ── DAY-WISE SUMMARY ── */}
        <div className="medical-card overflow-hidden">
          <button onClick={() => setShowSummary(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-slate-800">Day-wise Ayurvedic Collection</span>
              <span className="text-xs text-slate-500 ml-1">({allDates.length} days)</span>
            </div>
            {showSummary ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          {showSummary && (
            <div className="border-t border-slate-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-500">Date</th>
                    <th className="px-6 py-3 font-semibold text-slate-500">Patients</th>
                    <th className="px-6 py-3 font-semibold text-slate-500 text-right">Collection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allDates.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-6 text-center text-slate-400">No data yet</td></tr>
                  ) : (
                    allDates.map(d => (
                      <tr key={d.date} onClick={() => setSelectedDate(d.date)}
                        className="hover:bg-emerald-50/50 cursor-pointer transition-colors">
                        <td className="px-6 py-3 font-medium text-slate-700">
                          {format(new Date(d.date + "T00:00:00"), "dd MMM yyyy")}
                          {d.date === format(new Date(), "yyyy-MM-dd") && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold">Today</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-slate-600">{d.count} patients</td>
                        <td className="px-6 py-3 text-right font-semibold text-emerald-700">{formatCurrency(d.totalFees)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── EDIT DIALOG ── */}
      <Dialog open={!!editingPatient} onOpenChange={open => !open && setEditingPatient(null)}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit Ayurvedic Patient</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Name</label>
                <input {...editForm.register("name")} className="w-full px-3 py-2 rounded-xl border focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Mobile / Case No.</label>
                <input {...editForm.register("mobile")} className="w-full px-3 py-2 rounded-xl border focus:border-emerald-500 outline-none font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Age (yrs / mo)</label>
                <div className="flex gap-1">
                  <input type="number" {...editForm.register("age")} className="w-full px-2 py-2 rounded-xl border outline-none" placeholder="yrs" />
                  <input type="number" {...editForm.register("ageMonths")} className="w-16 px-2 py-2 rounded-xl border outline-none" placeholder="mo" min={0} max={11} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Weight</label>
                <input {...editForm.register("weight")} className="w-full px-3 py-2 rounded-xl border outline-none" placeholder="e.g. 65 kg" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Address</label>
              <input {...editForm.register("address")} className="w-full px-3 py-2 rounded-xl border outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Complaint Code</label>
              <input {...editForm.register("complaintCode")} className="w-full px-3 py-2 rounded-xl border outline-none uppercase" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Complaint</label>
              <input {...editForm.register("complaint")} className="w-full px-3 py-2 rounded-xl border outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Treatment</label>
              <textarea {...editForm.register("treatment")} rows={2} className="w-full px-3 py-2 rounded-xl border outline-none resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">
                Advice <span className="text-slate-400 font-normal">(F5 = follow-up after 5 days)</span>
              </label>
              <input {...editForm.register("advice")} className="w-full px-3 py-2 rounded-xl border outline-none" placeholder="F5 · ..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Fees (₹)</label>
              <input type="number" {...editForm.register("fees")} className="w-full px-3 py-2 rounded-xl border outline-none" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setEditingPatient(null)}
                className="px-4 py-2 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700">Cancel</button>
              <button type="submit"
                className="px-4 py-2 rounded-xl font-medium bg-emerald-600 text-white shadow-md hover:bg-emerald-700">Save Changes</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
