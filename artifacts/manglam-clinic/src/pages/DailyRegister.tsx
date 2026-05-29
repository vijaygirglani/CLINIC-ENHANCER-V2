import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { Layout } from "@/components/Layout";
import {
  getDailyStats, updatePatient, deletePatient, getAllDates,
  exportBackup, importBackup, addPatient, getMonthlyStats,
  type Patient, type DailyStats,
} from "@/lib/store";
import {
  Calendar, Download, Edit2, Trash2, Users, IndianRupee, FileText,
  ChevronDown, ChevronUp, Printer, Upload, Save, RotateCcw, BarChart2,
  TrendingUp, Leaf, MessageCircle, Send, X,
} from "lucide-react";
import { exportToExcel, parseExcelFile } from "@/lib/export";
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
  patientNo: z.string().optional(),
  complaintCode: z.string().optional(),
  complaint: z.string().optional(),
  treatment: z.string().optional(),
  advice: z.string().optional(),
  reports: z.string().optional(),
  fees: z.coerce.number().optional(),
});

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function DailyRegister() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showMonthly, setShowMonthly] = useState(false);
  const [allDates, setAllDates] = useState<{ date: string; count: number; totalFees: number }[]>([]);
  const [printPatient, setPrintPatient] = useState<Patient | null>(null);
  const [filterType, setFilterType] = useState<"all" | "general" | "ayurvedic">("all");
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const importRef = useRef<HTMLInputElement>(null);
  const excelImportRef = useRef<HTMLInputElement>(null);
  const [showWaReport, setShowWaReport] = useState(false);
  const [waCustomNote, setWaCustomNote] = useState("");
  const { toast } = useToast();

  const refresh = useCallback(() => {
    setStats(getDailyStats(selectedDate));
    setAllDates(getAllDates());
  }, [selectedDate]);

  useEffect(() => { refresh(); }, [refresh]);

  const editForm = useForm({ resolver: zodResolver(editSchema), values: editingPatient || {} });

  const filteredPatients = (stats?.patients || []).filter(p => {
    if (filterType === "all") return true;
    if (filterType === "general") return p.registerType !== "ayurvedic";
    return p.registerType === "ayurvedic";
  });

  const monthlyStats = showMonthly ? getMonthlyStats(monthlyYear, monthlyMonth) : null;

  const handleExport = () => {
    if (!stats?.patients?.length) {
      toast({ variant: "destructive", title: "No Data", description: "No patients to export for this date." });
      return;
    }
    const exportData = stats.patients.map((p, i) => ({
      "S.No": i + 1, "Name": p.name,
      "Age": `${p.age || 0} yrs${p.ageMonths ? ` ${p.ageMonths} mo` : ""}`,
      "Weight": p.weight || "-", "Address": p.address || "-", "Mobile/Case": p.mobile,
      "Register": p.registerType === "ayurvedic" ? "Ayurvedic" : "General",
      "Complaint Code": p.complaintCode || "-", "Complaint": p.complaint || "-",
      "Treatment": p.treatment || "-", "Advice": p.advice || "-", "Reports": p.reports || "-",
      "Fees": p.fees || 0, "Date": format(new Date(p.visitDate), "dd-MMM-yyyy"),
    }));
    exportToExcel(exportData, `Manglam_Clinic_${selectedDate}`);
    toast({ title: "Export Successful", description: "Excel file downloaded." });
  };

  const handleBackup = () => {
    const json = exportBackup();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Manglam_Clinic_Backup_${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: "Backup Created", description: "All patient data backed up." });
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (!confirm("This will replace ALL data with the backup. Are you sure?")) return;
      const result = importBackup(ev.target?.result as string);
      if (result.success) { toast({ title: "Restore Successful", description: result.message }); refresh(); }
      else toast({ variant: "destructive", title: "Restore Failed", description: result.message });
    };
    reader.readAsText(file);
    if (importRef.current) importRef.current.value = "";
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const rows = await parseExcelFile(file);
      let imported = 0;
      for (const row of rows) {
        const name = String(row["Name"] || row["name"] || "").trim();
        const mobile = String(row["Mobile"] || row["mobile"] || row["Mobile/Case"] || "").trim();
        if (!name || !mobile) continue;
        const visitDateRaw = String(row["Date"] || row["date"] || row["Visit Date"] || selectedDate);
        let visitDate = selectedDate;
        try { const d = new Date(visitDateRaw); if (!isNaN(d.getTime())) visitDate = format(d, "yyyy-MM-dd"); } catch {}
        addPatient({
          name, mobile, patientNo: String(row["Pt.No"] || ""),
          age: Number(row["Age"] || 0) || 0, weight: String(row["Weight"] || ""),
          address: String(row["Address"] || ""), complaint: String(row["Complaint"] || ""),
          complaintCode: String(row["Complaint Code"] || ""), treatment: String(row["Treatment"] || ""),
          advice: String(row["Advice"] || ""), reports: String(row["Reports"] || ""),
          fees: Number(row["Fees"] || 0) || 0,
          registerType: String(row["Register"] || "").toLowerCase().includes("ayur") ? "ayurvedic" : "general",
          visitDate,
        });
        imported++;
      }
      toast({ title: "Import Successful", description: `${imported} patients imported.` });
      refresh();
    } catch { toast({ variant: "destructive", title: "Import Failed", description: "Could not read the Excel file." }); }
    if (excelImportRef.current) excelImportRef.current.value = "";
  };

  const onEditSubmit = (data: any) => {
    if (!editingPatient) return;
    updatePatient(editingPatient.id, { ...data, fees: Number(data.fees || 0) });
    toast({ title: "Updated", description: "Patient record updated." });
    setEditingPatient(null); refresh();
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this record?")) return;
    deletePatient(id);
    toast({ title: "Deleted" }); refresh();
  };

  const exportMonthlyReport = () => {
    if (!monthlyStats) return;
    const rows = monthlyStats.dailyBreakdown.map(d => ({
      "Date": format(new Date(d.date + "T00:00:00"), "dd-MMM-yyyy"),
      "Patients": d.count, "Total Collection (₹)": d.totalFees,
      "General (₹)": d.generalFees, "Ayurvedic (₹)": d.ayurvedicFees,
    }));
    rows.push({ "Date": "TOTAL", "Patients": monthlyStats.totalPatients, "Total Collection (₹)": monthlyStats.totalFees, "General (₹)": monthlyStats.generalFees, "Ayurvedic (₹)": monthlyStats.ayurvedicFees });
    exportToExcel(rows, `Monthly_Report_${MONTHS[monthlyMonth - 1]}_${monthlyYear}`);
    toast({ title: "Monthly Report Exported" });
  };

  const buildDailyReportMsg = () => {
    const generalCount = (stats?.patients || []).filter(p => p.registerType !== "ayurvedic").length;
    const ayurvedicCount = (stats?.patients || []).filter(p => p.registerType === "ayurvedic").length;
    const generalFees = (stats?.patients || []).filter(p => p.registerType !== "ayurvedic").reduce((s, p) => s + (p.fees || 0), 0);
    const ayurvedicFees = (stats?.patients || []).filter(p => p.registerType === "ayurvedic").reduce((s, p) => s + (p.fees || 0), 0);
    const dateStr = format(new Date(selectedDate + "T00:00:00"), "dd/MM/yyyy");
    return `🏥 *Manglam Clinic Daily Update*

📅 *Date:* ${dateStr}

👥 *Patients Seen Today:* ${stats?.totalPatients || 0}

💵 *Today's Collection:* ₹${(stats?.totalFees || 0).toLocaleString("en-IN")}

🩺 *General Cases:* ${generalCount} (₹${generalFees.toLocaleString("en-IN")})

🌿 *Ayurvedic Cases:* ${ayurvedicCount} (₹${ayurvedicFees.toLocaleString("en-IN")})${waCustomNote.trim() ? `\n\n📝 *Note:* ${waCustomNote.trim()}` : ""}

Thank you everyone for your trust 🙏
*Dr. Vijay Girglani*
📍 Manglam Hospital, Morbi`;
  };

  const handleSendDailyReport = () => {
    const msg = buildDailyReportMsg();
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    setShowWaReport(false);
    setWaCustomNote("");
    toast({ title: "Opening WhatsApp", description: "Daily report ready to share." });
  };

  return (
    <Layout>
      {printPatient && <PrintPrescription patient={printPatient} />}
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleRestoreFile} />
      <input ref={excelImportRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportExcel} />

      <div className="space-y-5">
        {/* ── STICKY HEADER ── */}
        <div className="sticky top-16 z-30 -mx-4 md:-mx-8 px-4 md:px-8 bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-3 shadow-sm">
          <div className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900">Daily Register</h2>
              <p className="text-slate-500 text-xs">General + Ayurvedic patients for selected date</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary shadow-sm text-slate-700 font-medium text-sm" />
              </div>
              <button onClick={() => { setShowWaReport(true); setWaCustomNote(""); }}
                className="px-3 py-2 rounded-xl font-semibold bg-green-500 text-white hover:bg-green-600 shadow-sm text-sm flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" /> Daily Report
              </button>
              <button onClick={handleExport} className="px-3 py-2 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm text-sm flex items-center gap-1.5">
                <Download className="w-4 h-4" /> Export
              </button>
              <button onClick={() => excelImportRef.current?.click()} className="px-3 py-2 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm text-sm flex items-center gap-1.5">
                <Upload className="w-4 h-4" /> Import
              </button>
              <button onClick={handleBackup} className="px-3 py-2 rounded-xl font-semibold bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 text-sm flex items-center gap-1.5">
                <Save className="w-4 h-4" /> Backup
              </button>
              <button onClick={() => importRef.current?.click()} className="px-3 py-2 rounded-xl font-semibold bg-orange-500 text-white shadow-sm hover:bg-orange-600 text-sm flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" /> Restore
              </button>
            </div>
          </div>
        </div>

        {/* ── STATS CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats?.totalPatients || 0, icon: Users, color: "bg-blue-100 text-primary" },
            { label: "General", value: (stats?.patients || []).filter(p => p.registerType !== "ayurvedic").length, icon: FileText, color: "bg-slate-100 text-slate-600" },
            { label: "Ayurvedic", value: (stats?.patients || []).filter(p => p.registerType === "ayurvedic").length, icon: Leaf, color: "bg-emerald-100 text-emerald-600" },
            { label: "Collection", value: formatCurrency(stats?.totalFees || 0), icon: IndianRupee, color: "bg-emerald-100 text-emerald-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="medical-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-display font-bold text-slate-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── FILTER TABS ── */}
        <div className="flex items-center gap-2">
          {(["all", "general", "ayurvedic"] as const).map(type => (
            <button key={type} onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
                filterType === type
                  ? type === "ayurvedic" ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}>
              {type === "all" ? "All Patients" : type === "general" ? "General" : "Ayurvedic"}
            </button>
          ))}
          <span className="text-sm text-slate-400 ml-2">{filteredPatients.length} patients</span>
        </div>

        {/* ── PATIENT TABLE ── */}
        <div className="medical-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200/60">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">#</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Patient</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Weight</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Complaint</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Treatment</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Type</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Fees</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p, i) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">
                          {p.age ? `${p.age}y` : ""}{p.ageMonths ? ` ${p.ageMonths}m` : ""}
                          {p.age && p.mobile ? " · " : ""}{p.mobile}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.weight || "-"}</td>
                      <td className="px-4 py-3 max-w-[150px] truncate text-slate-600">
                        {p.complaintCode && <span className="font-bold text-primary mr-1">[{p.complaintCode}]</span>}
                        {p.complaint || "-"}
                      </td>
                      <td className="px-4 py-3 max-w-[150px] truncate text-slate-600">{p.treatment || "-"}</td>
                      <td className="px-4 py-3">
                        {p.registerType === "ayurvedic"
                          ? <span className="text-xs font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">Ayurvedic</span>
                          : <span className="text-xs font-bold px-2 py-1 rounded-md bg-blue-100 text-blue-700">General</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{p.fees ? `₹${p.fees}` : "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setPrintPatient(p); setTimeout(() => printPatientPrescription(p), 50); }}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
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
                      <div className="flex flex-col items-center text-slate-400">
                        <FileText className="w-12 h-12 mb-3 text-slate-300" />
                        <p className="font-medium">No patients for this date</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── MONTHLY REPORT ── */}
        <div className="medical-card overflow-hidden">
          <button onClick={() => setShowMonthly(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="font-semibold text-slate-800">Monthly Collection Report</span>
            </div>
            {showMonthly ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {showMonthly && (
            <div className="border-t border-slate-100">
              <div className="px-6 py-4 bg-slate-50 flex flex-wrap items-center gap-3">
                <select value={monthlyMonth} onChange={e => setMonthlyMonth(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:border-primary">
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select value={monthlyYear} onChange={e => setMonthlyYear(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:border-primary">
                  {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button onClick={exportMonthlyReport}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm">
                  <Download className="w-4 h-4" /> Export Monthly
                </button>
              </div>

              {monthlyStats && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 px-6 py-4 bg-gradient-to-br from-primary/5 to-emerald-50/40 border-b border-slate-100">
                    {[
                      { label: "Total Patients", value: monthlyStats.totalPatients },
                      { label: "General Pts.", value: monthlyStats.generalPatients },
                      { label: "Ayurvedic Pts.", value: monthlyStats.ayurvedicPatients },
                      { label: "Total Collection", value: formatCurrency(monthlyStats.totalFees) },
                      { label: "Ayurvedic Fees", value: formatCurrency(monthlyStats.ayurvedicFees) },
                    ].map((item, i) => (
                      <div key={i} className="text-center">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{item.label}</p>
                        <p className="text-xl font-display font-bold mt-1 text-slate-900">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {monthlyStats.dailyBreakdown.length > 0 ? (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 font-semibold text-slate-500">Date</th>
                          <th className="px-6 py-3 font-semibold text-slate-500 text-center">Patients</th>
                          <th className="px-6 py-3 font-semibold text-slate-500 text-right">General</th>
                          <th className="px-6 py-3 font-semibold text-slate-500 text-right">Ayurvedic</th>
                          <th className="px-6 py-3 font-semibold text-slate-500 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {monthlyStats.dailyBreakdown.map(d => (
                          <tr key={d.date} onClick={() => { setSelectedDate(d.date); setShowMonthly(false); }}
                            className="hover:bg-primary/5 transition-colors cursor-pointer">
                            <td className="px-6 py-2.5 font-medium text-slate-700">
                              {format(new Date(d.date + "T00:00:00"), "dd MMM yyyy (EEE)")}
                              {d.date === format(new Date(), "yyyy-MM-dd") && (
                                <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold">Today</span>
                              )}
                            </td>
                            <td className="px-6 py-2.5 text-center text-slate-600">{d.count}</td>
                            <td className="px-6 py-2.5 text-right text-blue-700 font-medium">{d.generalFees > 0 ? formatCurrency(d.generalFees) : "—"}</td>
                            <td className="px-6 py-2.5 text-right text-emerald-700 font-medium">{d.ayurvedicFees > 0 ? formatCurrency(d.ayurvedicFees) : "—"}</td>
                            <td className="px-6 py-2.5 text-right font-bold text-slate-900">{formatCurrency(d.totalFees)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 border-t-2 border-slate-300">
                          <td className="px-6 py-3 font-bold text-slate-800">TOTAL</td>
                          <td className="px-6 py-3 text-center font-bold text-slate-800">{monthlyStats.totalPatients}</td>
                          <td className="px-6 py-3 text-right font-bold text-blue-700">{formatCurrency(monthlyStats.generalFees)}</td>
                          <td className="px-6 py-3 text-right font-bold text-emerald-700">{formatCurrency(monthlyStats.ayurvedicFees)}</td>
                          <td className="px-6 py-3 text-right font-bold text-slate-900 text-base">{formatCurrency(monthlyStats.totalFees)}</td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <div className="px-6 py-10 text-center text-slate-400">
                      <BarChart2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p>No data for {MONTHS[monthlyMonth - 1]} {monthlyYear}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── DAY-WISE SUMMARY ── */}
        <div className="medical-card overflow-hidden">
          <button onClick={() => setShowSummary(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-slate-800">Day-wise Collection Summary</span>
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
                  {allDates.length === 0
                    ? <tr><td colSpan={3} className="px-6 py-6 text-center text-slate-400">No data yet</td></tr>
                    : allDates.map(d => (
                      <tr key={d.date} onClick={() => setSelectedDate(d.date)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer">
                        <td className="px-6 py-3 font-medium text-slate-700">
                          {format(new Date(d.date + "T00:00:00"), "dd MMM yyyy")}
                          {d.date === format(new Date(), "yyyy-MM-dd") && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold">Today</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-slate-600">{d.count} patients</td>
                        <td className="px-6 py-3 text-right font-semibold text-emerald-700">{formatCurrency(d.totalFees)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── WHATSAPP DAILY REPORT MODAL ── */}
      {showWaReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-green-50 rounded-t-2xl">
              <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">Send Daily Report</p>
                <p className="text-xs text-slate-500">
                  {format(new Date(selectedDate + "T00:00:00"), "dd MMM yyyy")}
                </p>
              </div>
              <button onClick={() => setShowWaReport(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Preview */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Report Preview</p>
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {buildDailyReportMsg()}
                </div>
              </div>

              {/* Optional note */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Add a Note (optional)
                </label>
                <textarea
                  value={waCustomNote}
                  onChange={e => setWaCustomNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Camp tomorrow, Holiday notice..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 text-sm resize-none"
                />
              </div>

              {/* Stats summary strip */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Total", value: stats?.totalPatients || 0, color: "bg-blue-50 text-blue-700" },
                  { label: "General", value: (stats?.patients || []).filter(p => p.registerType !== "ayurvedic").length, color: "bg-slate-50 text-slate-700" },
                  { label: "Ayurvedic", value: (stats?.patients || []).filter(p => p.registerType === "ayurvedic").length, color: "bg-emerald-50 text-emerald-700" },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-xs font-semibold mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-center">
                <p className="text-xl font-bold text-amber-700">₹{(stats?.totalFees || 0).toLocaleString("en-IN")}</p>
                <p className="text-xs font-semibold text-amber-600 mt-0.5">Total Collection</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowWaReport(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm">
                Cancel
              </button>
              <button onClick={handleSendDailyReport}
                className="flex-1 py-2.5 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 text-sm">
                <Send className="w-4 h-4" /> Send on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT DIALOG ── */}
      <Dialog open={!!editingPatient} onOpenChange={open => !open && setEditingPatient(null)}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit Patient Visit</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Name</label>
                <input {...editForm.register("name")} className="w-full px-3 py-2 rounded-xl border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Mobile / Case No.</label>
                <input {...editForm.register("mobile")} className="w-full px-3 py-2 rounded-xl border focus:border-primary outline-none font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Age (yrs / mo)</label>
                <div className="flex gap-1">
                  <input type="number" {...editForm.register("age")} className="w-full px-2 py-2 rounded-xl border focus:border-primary outline-none" placeholder="yrs" />
                  <input type="number" {...editForm.register("ageMonths")} className="w-16 px-2 py-2 rounded-xl border focus:border-primary outline-none" placeholder="mo" min={0} max={11} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Weight</label>
                <input {...editForm.register("weight")} className="w-full px-3 py-2 rounded-xl border focus:border-primary outline-none" placeholder="e.g. 65 kg" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Address</label>
              <input {...editForm.register("address")} className="w-full px-3 py-2 rounded-xl border focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Complaint Code</label>
              <input {...editForm.register("complaintCode")} className="w-full px-3 py-2 rounded-xl border focus:border-primary outline-none uppercase" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Complaint</label>
              <input {...editForm.register("complaint")} className="w-full px-3 py-2 rounded-xl border focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Treatment</label>
              <textarea {...editForm.register("treatment")} rows={2} className="w-full px-3 py-2 rounded-xl border focus:border-primary outline-none resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Advice (use F5 for follow-up after 5 days)</label>
              <input {...editForm.register("advice")} className="w-full px-3 py-2 rounded-xl border focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Reports</label>
              <input {...editForm.register("reports")} className="w-full px-3 py-2 rounded-xl border focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Fees (₹)</label>
              <input type="number" {...editForm.register("fees")} className="w-full px-3 py-2 rounded-xl border focus:border-primary outline-none" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setEditingPatient(null)} className="px-4 py-2 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl font-medium bg-primary text-white shadow-md hover:bg-primary/90">Save Changes</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
