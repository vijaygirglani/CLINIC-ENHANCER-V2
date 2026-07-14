import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { Layout } from "@/components/Layout";
import {
  getMedicines, addMedicine, updateMedicine, deleteMedicine, getStockStatus, getStockAlertCounts, getStockValuation,
  getPurchaseBills, addSimplePurchaseBill, deletePurchaseBill, getPharmacyPurchaseSummary, getPurchaseBillPaymentStatus,
  markPurchaseBillPaid, getPurchaseSummaryByMonth,
  getExpiryList, addMedicineBatch, deleteMedicineBatch,
  getPharmacies, addPharmacy, updatePharmacy, deletePharmacy, syncPharmaciesFromPurchases,
  importPharmaBillsCsv,
  type MedicineItem, type PurchaseBill, type Pharmacy, type ExpiryItem,
} from "@/lib/store";
import {
  Package, Plus, Edit2, Trash2, IndianRupee, AlertTriangle, CalendarClock,
  Building2, ShoppingCart, TrendingUp, Search, CheckCircle2, Upload, RefreshCw, Calendar,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

type Tab = "medicines" | "purchase" | "expiry" | "pharmacies";
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const medicineSchema = z.object({
  name: z.string().min(1, "Required"),
  packSize: z.coerce.number().min(1, "Must be at least 1"),
  mrp: z.coerce.number().min(0, "Required"),
  reorderLevel: z.coerce.number().min(0, "Required"),
  currentStock: z.coerce.number().min(0, "Required"),
});

const pharmacySchema = z.object({
  name: z.string().min(1, "Required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  gstNo: z.string().optional(),
  address: z.string().optional(),
});

const EXPIRY_STATUS_STYLE: Record<ExpiryItem["status"], string> = {
  expired: "bg-red-100 text-red-700 border-red-200",
  "expiring-soon": "bg-amber-100 text-amber-700 border-amber-200",
  expiring: "bg-yellow-100 text-yellow-700 border-yellow-200",
  good: "bg-emerald-100 text-emerald-700 border-emerald-200",
};
const EXPIRY_STATUS_LABEL: Record<ExpiryItem["status"], string> = {
  expired: "Expired", "expiring-soon": "≤30 days", expiring: "≤60 days", good: "Good",
};

export default function Inventory() {
  const [tab, setTab] = useState<Tab>("medicines");
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [purchaseBills, setPurchaseBills] = useState<PurchaseBill[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [expiryList, setExpiryList] = useState<ExpiryItem[]>([]);
  const [expiryFilter, setExpiryFilter] = useState<"all" | "expired" | "expiring-soon" | "expiring">("all");
  const { toast } = useToast();

  const refresh = useCallback(() => {
    setMedicines(getMedicines());
    setPurchaseBills(getPurchaseBills().sort((a, b) => b.billDate.localeCompare(a.billDate)));
    setPharmacies(getPharmacies());
    setExpiryList(getExpiryList());
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const stockValuation = getStockValuation();
  const alertCounts = getStockAlertCounts();
  const expiringSoonCount = expiryList.filter(e => e.status === "expiring-soon" || e.status === "expired").length;

  // ── Medicine dialog ──
  const [medDialogOpen, setMedDialogOpen] = useState(false);
  const [editingMedId, setEditingMedId] = useState<number | null>(null);
  const medForm = useForm({
    resolver: zodResolver(medicineSchema),
    defaultValues: { name: "", packSize: 10, mrp: 0, reorderLevel: 10, currentStock: 0 },
  });

  const openNewMedicine = () => {
    setEditingMedId(null);
    medForm.reset({ name: "", packSize: 10, mrp: 0, reorderLevel: 10, currentStock: 0 });
    setMedDialogOpen(true);
  };
  const openEditMedicine = (m: MedicineItem) => {
    setEditingMedId(m.id);
    medForm.reset({ name: m.name, packSize: m.packSize, mrp: m.mrp, reorderLevel: m.reorderLevel, currentStock: m.currentStock });
    setMedDialogOpen(true);
  };
  const onSubmitMedicine = (data: z.infer<typeof medicineSchema>) => {
    const mrpPerTablet = data.packSize > 1 ? data.mrp / data.packSize : data.mrp;
    if (editingMedId) {
      updateMedicine(editingMedId, { ...data, mrpPerTablet });
      toast({ title: "Updated", description: "Medicine updated." });
    } else {
      const existing = getMedicines().find(m => m.name.toLowerCase() === data.name.trim().toLowerCase());
      if (existing) {
        toast({ variant: "destructive", title: "Already exists", description: "A medicine with this name is already in the list." });
        return;
      }
      addMedicine({ ...data, mrpPerTablet, landingCost: 0 });
      toast({ title: "Added", description: "Medicine added to inventory." });
    }
    setMedDialogOpen(false);
    refresh();
  };
  const handleDeleteMedicine = (id: number) => {
    if (!confirm("Delete this medicine? Its batches will be removed too.")) return;
    deleteMedicine(id);
    toast({ title: "Deleted", description: "Medicine removed." });
    refresh();
  };

  // ── Pharmacy dialog ──
  const [pharmDialogOpen, setPharmDialogOpen] = useState(false);
  const [editingPharmId, setEditingPharmId] = useState<number | null>(null);
  const pharmForm = useForm({
    resolver: zodResolver(pharmacySchema),
    defaultValues: { name: "", contactPerson: "", phone: "", gstNo: "", address: "" },
  });
  const openNewPharmacy = () => {
    setEditingPharmId(null);
    pharmForm.reset({ name: "", contactPerson: "", phone: "", gstNo: "", address: "" });
    setPharmDialogOpen(true);
  };
  const openEditPharmacy = (p: Pharmacy) => {
    setEditingPharmId(p.id);
    pharmForm.reset({ name: p.name, contactPerson: p.contactPerson || "", phone: p.phone || "", gstNo: p.gstNo || "", address: p.address || "" });
    setPharmDialogOpen(true);
  };
  const onSubmitPharmacy = (data: z.infer<typeof pharmacySchema>) => {
    if (editingPharmId) {
      updatePharmacy(editingPharmId, data);
      toast({ title: "Updated", description: "Pharmacy updated." });
    } else {
      addPharmacy(data);
      toast({ title: "Added", description: "Pharmacy added." });
    }
    setPharmDialogOpen(false);
    refresh();
  };
  const handleDeletePharmacy = (id: number) => {
    if (!confirm("Delete this pharmacy?")) return;
    deletePharmacy(id);
    toast({ title: "Deleted", description: "Pharmacy removed." });
    refresh();
  };
  const handleSyncPharmacies = () => {
    const added = syncPharmaciesFromPurchases();
    toast({ title: added > 0 ? "Synced" : "Nothing new", description: added > 0 ? `Added ${added} pharmacy name(s) from your purchase bills.` : "All pharmacy names from your purchase bills are already listed." });
    refresh();
  };

  // ── Purchase entry (bill-level only) ──
  const [billPharmacy, setBillPharmacy] = useState("");
  const [billNo, setBillNo] = useState("");
  const [billDate, setBillDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [billAmount, setBillAmount] = useState(0);
  const [billPendingAmount, setBillPendingAmount] = useState(0);
  const [billNotes, setBillNotes] = useState("");

  const resetBillForm = () => {
    setBillPharmacy(""); setBillNo(""); setBillDate(format(new Date(), "yyyy-MM-dd"));
    setBillAmount(0); setBillPendingAmount(0); setBillNotes("");
  };

  const handleSaveBill = () => {
    if (!billPharmacy.trim()) { toast({ variant: "destructive", title: "Pharmacy name required" }); return; }
    if (billAmount <= 0) { toast({ variant: "destructive", title: "Amount required" }); return; }
    addSimplePurchaseBill({
      supplierName: billPharmacy.trim(), billNo: billNo.trim(), billDate,
      grandTotal: billAmount, pendingAmount: Math.min(billPendingAmount, billAmount), notes: billNotes.trim() || undefined,
    });
    toast({ title: "Purchase bill saved" });
    resetBillForm();
    refresh();
  };

  const handleDeleteBill = (id: number) => {
    if (!confirm("Delete this purchase bill?")) return;
    deletePurchaseBill(id);
    toast({ title: "Deleted", description: "Purchase bill removed." });
    refresh();
  };
  const handleMarkPaid = (id: number) => {
    markPurchaseBillPaid(id);
    toast({ title: "Marked as paid" });
    refresh();
  };

  const [pharmacyFilter, setPharmacyFilter] = useState("all");
  const [billSearch, setBillSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "partial" | "pending">("all");
  const pharmacySummary = getPharmacyPurchaseSummary();
  const visibleBills = purchaseBills.filter(b => {
    if (pharmacyFilter !== "all" && b.supplierName !== pharmacyFilter) return false;
    if (statusFilter !== "all" && getPurchaseBillPaymentStatus(b) !== statusFilter) return false;
    if (billSearch.trim()) {
      const q = billSearch.trim().toLowerCase();
      if (!b.supplierName.toLowerCase().includes(q) && !(b.billNo || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Monthly purchase summary
  const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth() + 1);
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const monthlyPurchaseSummary = getPurchaseSummaryByMonth(summaryYear, summaryMonth);

  // CSV import
  const csvImportRef = useRef<HTMLInputElement>(null);
  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = importPharmaBillsCsv(text);
      if (result.errors.length > 0) {
        toast({ variant: "destructive", title: "Import finished with issues", description: `${result.billsAdded} bills, ${result.expensesAdded} expenses added. ${result.errors[0]}` });
      } else {
        toast({ title: "Import complete", description: `${result.billsAdded} purchase bill(s) and ${result.expensesAdded} expense(s) added${result.skipped ? `, ${result.skipped} skipped (duplicates or blank)` : ""}.` });
      }
      refresh();
    };
    reader.readAsText(file);
    if (csvImportRef.current) csvImportRef.current.value = "";
  };

  // ── Expiry tracker — quick add batch ──
  const [batchMedicineId, setBatchMedicineId] = useState<number | "">("");
  const [batchNo, setBatchNo] = useState("");
  const [batchExpiry, setBatchExpiry] = useState("");
  const [batchQty, setBatchQty] = useState(1);

  const handleAddBatch = () => {
    if (!batchMedicineId) { toast({ variant: "destructive", title: "Select a medicine" }); return; }
    if (!batchExpiry.trim()) { toast({ variant: "destructive", title: "Expiry (MM/YY) required" }); return; }
    addMedicineBatch(Number(batchMedicineId), { batchNo: batchNo.trim(), expiryDate: batchExpiry.trim(), qty: batchQty });
    toast({ title: "Batch added" });
    setBatchMedicineId(""); setBatchNo(""); setBatchExpiry(""); setBatchQty(1);
    refresh();
  };

  const handleDeleteExpiryItem = (e: ExpiryItem) => {
    if (!confirm(`Remove ${e.medicineName} (batch ${e.batchNo}) from the expiry tracker?`)) return;
    deleteMedicineBatch(e.medicineId, e.batchIndex);
    toast({ title: "Removed" });
    refresh();
  };

  const filteredExpiry = expiryList.filter(e => expiryFilter === "all" ? true : e.status === expiryFilter);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600 shadow-inner">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-display text-slate-900">Inventory</h2>
              <p className="text-slate-500 text-sm">Purchases, pharmacies, medicines &amp; expiry tracking.</p>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Stock Value (Cost)", value: formatCurrency(stockValuation.atCost), icon: IndianRupee, color: "bg-teal-100 text-teal-600" },
            { label: "Potential Profit", value: formatCurrency(stockValuation.potentialProfit), icon: TrendingUp, color: "bg-emerald-100 text-emerald-600" },
            { label: "Low / Out of Stock", value: alertCounts.low + alertCounts.out, icon: AlertTriangle, color: "bg-amber-100 text-amber-600" },
            { label: "Expiring / Expired", value: expiringSoonCount, icon: CalendarClock, color: "bg-red-100 text-red-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="medical-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="text-lg font-display font-bold text-slate-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {([
            { key: "medicines", label: "Medicines", icon: Package },
            { key: "purchase", label: "Purchase Entry", icon: ShoppingCart },
            { key: "expiry", label: "Expiry Tracker", icon: CalendarClock },
            { key: "pharmacies", label: "Pharmacies", icon: Building2 },
          ] as { key: Tab; label: string; icon: typeof Package }[]).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                tab === key ? "bg-primary/10 text-primary" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* ── MEDICINES TAB ── */}
        {tab === "medicines" && (
          <div className="medical-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <span className="text-sm text-slate-500">{medicines.length} medicines</span>
              <button onClick={openNewMedicine} className="px-4 py-2 rounded-xl font-semibold bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl transition-all flex items-center gap-1.5 text-sm">
                <Plus className="w-4 h-4" /> Add Medicine
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white border-b border-slate-200/60">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-500">Name</th>
                    <th className="px-4 py-3 font-semibold text-slate-500 text-right">Stock (tab)</th>
                    <th className="px-4 py-3 font-semibold text-slate-500 text-right">Pack size</th>
                    <th className="px-4 py-3 font-semibold text-slate-500 text-right">Reorder at</th>
                    <th className="px-4 py-3 font-semibold text-slate-500 text-right">MRP/tab</th>
                    <th className="px-4 py-3 font-semibold text-slate-500">Status</th>
                    <th className="px-4 py-3 font-semibold text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medicines.length > 0 ? medicines.map(m => {
                    const status = getStockStatus(m);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{m.currentStock}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{m.packSize}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{m.reorderLevel}</td>
                        <td className="px-4 py-3 text-right text-slate-700">₹{m.mrpPerTablet?.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          {status === "out" && <span className="text-xs font-bold px-2 py-1 rounded-md bg-red-100 text-red-700">Out of stock</span>}
                          {status === "low" && <span className="text-xs font-bold px-2 py-1 rounded-md bg-amber-100 text-amber-700">Low stock</span>}
                          {status === "ok" && <span className="text-xs font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">OK</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEditMedicine(m)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteMedicine(m.id)} className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No medicines yet. Add one, set its stock &amp; reorder level manually.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 px-4 py-3 border-t border-slate-100">Stock here is managed manually — it's no longer linked to Purchase Entry. Use "Expiry Tracker" to log batch/expiry info for a medicine.</p>
          </div>
        )}

        {/* ── PURCHASE ENTRY TAB ── */}
        {tab === "purchase" && (
          <div className="space-y-6">
            <input ref={csvImportRef} type="file" accept=".csv" className="hidden" onChange={handleImportCsv} />
            <div className="flex justify-end">
              <button onClick={() => csvImportRef.current?.click()}
                className="px-3 py-2 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-1.5 text-sm">
                <Upload className="w-4 h-4" /> Import historical bills (CSV)
              </button>
            </div>

            {/* Monthly purchase summary */}
            <div className="medical-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly purchase summary</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <select value={summaryMonth} onChange={e => setSummaryMonth(Number(e.target.value))}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white">
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                  <select value={summaryYear} onChange={e => setSummaryYear(Number(e.target.value))}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white">
                    {[summaryYear - 1, summaryYear, summaryYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Purchased</p>
                  <p className="text-lg font-display font-bold text-slate-900">{formatCurrency(monthlyPurchaseSummary.totalPurchased)}</p>
                  <p className="text-[11px] text-slate-400">{monthlyPurchaseSummary.billCount} bill(s)</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50">
                  <p className="text-[11px] font-semibold text-emerald-700 uppercase">Paid</p>
                  <p className="text-lg font-display font-bold text-emerald-800">{formatCurrency(monthlyPurchaseSummary.totalPaid)}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50">
                  <p className="text-[11px] font-semibold text-amber-700 uppercase">Pending</p>
                  <p className="text-lg font-display font-bold text-amber-800">{formatCurrency(monthlyPurchaseSummary.totalPending)}</p>
                </div>
              </div>
            </div>

            {/* Pharmacy-wise purchase & outstanding summary */}
            {pharmacySummary.length > 0 && (
              <div className="medical-card p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pharmacy-wise purchases</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pharmacySummary.map(s => (
                    <button key={s.pharmacyName} onClick={() => setPharmacyFilter(s.pharmacyName)}
                      className={`text-left p-3 rounded-xl border transition-all ${pharmacyFilter === s.pharmacyName ? "border-primary bg-primary/5" : "border-slate-200 hover:bg-slate-50"}`}>
                      <p className="font-semibold text-slate-800 text-sm truncate">{s.pharmacyName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.billCount} bill{s.billCount > 1 ? "s" : ""} · {formatCurrency(s.totalPurchased)}</p>
                      {s.totalPending > 0 && (
                        <p className="text-xs font-bold text-amber-700 mt-1">Pending: {formatCurrency(s.totalPending)}</p>
                      )}
                    </button>
                  ))}
                </div>
                {pharmacyFilter !== "all" && (
                  <button onClick={() => setPharmacyFilter("all")} className="mt-3 text-xs font-semibold text-primary hover:underline">Clear filter (showing all pharmacies)</button>
                )}
              </div>
            )}

            {/* Simple bill entry */}
            <div className="medical-card p-5 space-y-4">
              <p className="text-sm font-semibold text-slate-700">Add purchase bill</p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Pharmacy / Supplier</label>
                  <input list="pharmacy-list" value={billPharmacy} onChange={e => setBillPharmacy(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" placeholder="e.g. Shree Ram Pharma" />
                  <datalist id="pharmacy-list">
                    {pharmacies.map(p => <option key={p.id} value={p.name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Bill No. (optional)</label>
                  <input value={billNo} onChange={e => setBillNo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" placeholder="Optional" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Bill Date</label>
                  <input type="date" value={billDate} onChange={e => setBillDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Total amount (₹)</label>
                  <input type="number" value={billAmount || ""} onChange={e => setBillAmount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Pending amount (₹, optional)</label>
                  <input type="number" value={billPendingAmount || ""} onChange={e => setBillPendingAmount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" placeholder="0 = fully paid" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Notes (optional)</label>
                  <input value={billNotes} onChange={e => setBillNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" placeholder="e.g. medicines bought" />
                </div>
              </div>
              <button onClick={handleSaveBill} className="px-5 py-2.5 rounded-xl font-semibold bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl transition-all">
                Save purchase bill
              </button>
            </div>

            {/* Purchase bills table */}
            <div className="medical-card overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 space-y-3">
                <span className="text-sm font-semibold text-slate-700">
                  Purchase bills <span className="text-slate-400 font-normal">({visibleBills.length})</span>
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={billSearch} onChange={e => setBillSearch(e.target.value)}
                      placeholder="Search company, bill number..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" />
                  </div>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium bg-white">
                    <option value="all">All status</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partially paid</option>
                    <option value="pending">Pending</option>
                  </select>
                  <select value={pharmacyFilter} onChange={e => setPharmacyFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium bg-white">
                    <option value="all">All companies</option>
                    {pharmacySummary.map(s => <option key={s.pharmacyName} value={s.pharmacyName}>{s.pharmacyName}</option>)}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white border-b border-slate-200/60">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-500">Date</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">Pharmacy</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">Bill no.</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">Notes</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 text-right">Total</th>
                      <th className="px-4 py-3 font-semibold text-slate-500">Payment</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleBills.length > 0 ? (billSearch || statusFilter !== "all" || pharmacyFilter !== "all" ? visibleBills : visibleBills.slice(0, 20)).map(b => {
                      const status = getPurchaseBillPaymentStatus(b);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{format(new Date(b.billDate + "T00:00:00"), "dd MMM yyyy")}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{b.supplierName}</td>
                          <td className="px-4 py-3 text-slate-500">{b.billNo || "-"}</td>
                          <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">{b.notes || "-"}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(b.grandTotal)}</td>
                          <td className="px-4 py-3">
                            {status === "paid" ? (
                              <span className="text-xs font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">Paid</span>
                            ) : (
                              <span className="text-xs font-bold px-2 py-1 rounded-md bg-amber-100 text-amber-700">
                                {status === "partial" ? "Partially paid" : "Pending"} · {formatCurrency(b.pendingAmount || 0)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {status !== "paid" && (
                                <button onClick={() => handleMarkPaid(b.id)} title="Mark as paid" className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                              )}
                              <button onClick={() => handleDeleteBill(b.id)} className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No purchase bills recorded yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── EXPIRY TRACKER TAB ── */}
        {tab === "expiry" && (
          <div className="space-y-4">
            <div className="medical-card p-5 space-y-4">
              <p className="text-sm font-semibold text-slate-700">Add batch (for expiry tracking)</p>
              <div className="grid sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Medicine</label>
                  <select value={batchMedicineId} onChange={e => setBatchMedicineId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none bg-white">
                    <option value="">Select medicine...</option>
                    {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Batch no. (optional)</label>
                  <input value={batchNo} onChange={e => setBatchNo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Expiry (MM/YY)</label>
                  <input value={batchExpiry} onChange={e => setBatchExpiry(e.target.value)} placeholder="12/27"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Quantity</label>
                  <input type="number" value={batchQty} onChange={e => setBatchQty(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" />
                </div>
              </div>
              <button onClick={handleAddBatch} className="px-4 py-2.5 rounded-xl font-semibold bg-slate-800 text-white hover:bg-slate-900 transition-all flex items-center gap-1.5 text-sm">
                <Plus className="w-4 h-4" /> Add batch
              </button>
              {medicines.length === 0 && <p className="text-xs text-amber-600">Add a medicine on the Medicines tab first.</p>}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {([
                { key: "all", label: "All" },
                { key: "expired", label: "Expired" },
                { key: "expiring-soon", label: "≤ 30 days" },
                { key: "expiring", label: "≤ 60 days" },
              ] as const).map(f => (
                <button key={f.key} onClick={() => setExpiryFilter(f.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${expiryFilter === f.key ? "bg-primary/10 text-primary" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="medical-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200/60">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-600">Medicine</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Batch</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Expiry</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 text-right">Qty</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 text-right">Days left</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpiry.length > 0 ? filteredExpiry.map((e, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{e.medicineName}</td>
                        <td className="px-4 py-3 text-slate-500">{e.batchNo}</td>
                        <td className="px-4 py-3 text-slate-500">{e.expiryDate}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{e.qty}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{e.daysToExpiry}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded-md border ${EXPIRY_STATUS_STYLE[e.status]}`}>{EXPIRY_STATUS_LABEL[e.status]}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleDeleteExpiryItem(e)} title="Remove this batch"
                            className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No batches match this filter.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── PHARMACIES TAB ── */}
        {tab === "pharmacies" && (
          <div className="medical-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <span className="text-sm text-slate-500">{pharmacies.length} pharmacies</span>
              <div className="flex gap-2">
                <button onClick={handleSyncPharmacies} className="px-3 py-2 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-1.5 text-sm">
                  <RefreshCw className="w-4 h-4" /> Sync from Purchase Bills
                </button>
                <button onClick={openNewPharmacy} className="px-4 py-2 rounded-xl font-semibold bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl transition-all flex items-center gap-1.5 text-sm">
                  <Plus className="w-4 h-4" /> Add Pharmacy
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white border-b border-slate-200/60">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-500">Name</th>
                    <th className="px-4 py-3 font-semibold text-slate-500">Contact</th>
                    <th className="px-4 py-3 font-semibold text-slate-500">Phone</th>
                    <th className="px-4 py-3 font-semibold text-slate-500">GST No.</th>
                    <th className="px-4 py-3 font-semibold text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pharmacies.length > 0 ? pharmacies.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                      <td className="px-4 py-3 text-slate-600">{p.contactPerson || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{p.phone || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{p.gstNo || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditPharmacy(p)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeletePharmacy(p.id)} className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No pharmacies yet. Add one, or sync from your purchase bills.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Medicine dialog */}
      <Dialog open={medDialogOpen} onOpenChange={setMedDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6">
          <DialogHeader><DialogTitle className="font-display text-xl">{editingMedId ? "Edit" : "New"} Medicine</DialogTitle></DialogHeader>
          <form onSubmit={medForm.handleSubmit(onSubmitMedicine)} className="space-y-4 mt-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Name</label>
              <input {...medForm.register("name")} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" placeholder="e.g. Merci Tab" />
              {medForm.formState.errors.name && <p className="text-destructive text-xs mt-1">{medForm.formState.errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Pack size (tab/pack)</label>
                <input type="number" {...medForm.register("packSize")} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">MRP per pack (₹)</label>
                <input type="number" {...medForm.register("mrp")} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Reorder level (tablets)</label>
                <input type="number" {...medForm.register("reorderLevel")} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Current stock (tablets)</label>
                <input type="number" {...medForm.register("currentStock")} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" />
              </div>
            </div>
            <p className="text-xs text-slate-400">Stock &amp; expiry are fully manual now — update "Current stock" here any time, and add batches on the Expiry Tracker tab.</p>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setMedDialogOpen(false)} className="px-5 py-2.5 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl font-medium bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Save</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pharmacy dialog */}
      <Dialog open={pharmDialogOpen} onOpenChange={setPharmDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6">
          <DialogHeader><DialogTitle className="font-display text-xl">{editingPharmId ? "Edit" : "New"} Pharmacy</DialogTitle></DialogHeader>
          <form onSubmit={pharmForm.handleSubmit(onSubmitPharmacy)} className="space-y-4 mt-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Pharmacy name</label>
              <input {...pharmForm.register("name")} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" />
              {pharmForm.formState.errors.name && <p className="text-destructive text-xs mt-1">{pharmForm.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Contact person</label>
              <input {...pharmForm.register("contactPerson")} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Phone</label>
                <input {...pharmForm.register("phone")} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">GST No.</label>
                <input {...pharmForm.register("gstNo")} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Address</label>
              <textarea {...pharmForm.register("address")} rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none resize-none" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setPharmDialogOpen(false)} className="px-5 py-2.5 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl font-medium bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Save</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
