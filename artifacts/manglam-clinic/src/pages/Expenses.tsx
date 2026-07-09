import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Layout } from "@/components/Layout";
import {
  getExpenses, addExpense, updateExpense, deleteExpense, getExpensesByMonth,
  getExpenseCategoryBreakdown, EXPENSE_CATEGORIES, type Expense,
} from "@/lib/store";
import { exportToExcel } from "@/lib/export";
import {
  Wallet, Plus, Edit2, Trash2, Download, IndianRupee, Calendar,
  CreditCard, Banknote, TrendingDown,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const expenseSchema = z.object({
  date: z.string().min(1, "Required"),
  category: z.string().min(1, "Required"),
  amount: z.coerce.number().min(0.01, "Must be greater than 0"),
  paymentMode: z.enum(["cash", "online"]),
  note: z.string().optional(),
});

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();

  const refresh = useCallback(() => { setExpenses(getExpenses()); }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      category: "Misc",
      amount: 0,
      paymentMode: "cash",
      note: "",
    },
  });

  const handleOpenNew = () => {
    setEditingId(null);
    form.reset({ date: format(new Date(), "yyyy-MM-dd"), category: "Misc", amount: 0, paymentMode: "cash", note: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: Expense) => {
    setEditingId(item.id);
    form.reset({ date: item.date, category: item.category, amount: item.amount, paymentMode: item.paymentMode, note: item.note || "" });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this expense entry?")) return;
    deleteExpense(id);
    toast({ title: "Deleted", description: "Expense removed." });
    refresh();
  };

  const onSubmit = (data: z.infer<typeof expenseSchema>) => {
    if (editingId) {
      updateExpense(editingId, data);
      toast({ title: "Updated", description: "Expense updated." });
    } else {
      addExpense(data);
      toast({ title: "Added", description: "Expense recorded." });
    }
    setIsDialogOpen(false);
    refresh();
  };

  const monthExpenses = getExpensesByMonth(year, month);
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayTotal = expenses.filter(e => e.date === todayStr).reduce((s, e) => s + e.amount, 0);
  const cashTotal = monthExpenses.filter(e => e.paymentMode !== "online").reduce((s, e) => s + e.amount, 0);
  const onlineTotal = monthExpenses.filter(e => e.paymentMode === "online").reduce((s, e) => s + e.amount, 0);
  const categoryBreakdown = getExpenseCategoryBreakdown(year, month);

  const handleExport = () => {
    if (monthExpenses.length === 0) {
      toast({ variant: "destructive", title: "No Data", description: "No expenses for this month." });
      return;
    }
    const rows = monthExpenses.map(e => ({
      Date: e.date, Category: e.category, "Amount (₹)": e.amount,
      "Payment Mode": e.paymentMode === "online" ? "Online" : "Cash", Note: e.note || "",
    }));
    rows.push({ Date: "TOTAL", Category: "", "Amount (₹)": monthTotal, "Payment Mode": "", Note: "" });
    exportToExcel(rows, `Expenses_${MONTHS[month - 1]}_${year}`);
    toast({ title: "Exported", description: "Expenses exported to Excel." });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-display text-slate-900">Expenses</h2>
              <p className="text-slate-500 text-sm">Track clinic expenses and see monthly totals.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExport} className="px-3 py-2.5 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-1.5 text-sm">
              <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={handleOpenNew} className="px-4 py-2.5 rounded-xl font-semibold bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Expense
            </button>
          </div>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium bg-white">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium bg-white">
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "This Month", value: formatCurrency(monthTotal), icon: TrendingDown, color: "bg-rose-100 text-rose-600" },
            { label: "Today", value: formatCurrency(todayTotal), icon: IndianRupee, color: "bg-amber-100 text-amber-600" },
            { label: "Cash", value: formatCurrency(cashTotal), icon: Banknote, color: "bg-emerald-100 text-emerald-600", sub: `${monthExpenses.filter(e => e.paymentMode !== "online").length} entries` },
            { label: "Online", value: formatCurrency(onlineTotal), icon: CreditCard, color: "bg-blue-100 text-blue-600", sub: `${monthExpenses.filter(e => e.paymentMode === "online").length} entries` },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="medical-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="text-xl font-display font-bold text-slate-900">{value}</p>
                {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Category breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="medical-card p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">By Category — {MONTHS[month - 1]} {year}</p>
            <div className="flex flex-wrap gap-2">
              {categoryBreakdown.map(c => (
                <span key={c.category} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-sm">
                  <span className="font-medium text-slate-600">{c.category}</span>
                  <span className="font-bold text-slate-900">{formatCurrency(c.total)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="medical-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/60">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Category</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Note</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Mode</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthExpenses.length > 0 ? (
                  monthExpenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{format(new Date(e.date + "T00:00:00"), "dd MMM yyyy")}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">{e.category}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[220px] truncate">{e.note || "-"}</td>
                      <td className="px-4 py-3">
                        {e.paymentMode === "online"
                          ? <span className="text-xs font-bold px-2 py-1 rounded-md bg-blue-100 text-blue-700">Online</span>
                          : <span className="text-xs font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">Cash</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(e.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleOpenEdit(e)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(e.id)} className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center text-slate-400">
                        <Wallet className="w-12 h-12 mb-3 text-slate-300" />
                        <p className="font-medium">No expenses for {MONTHS[month - 1]} {year}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              {monthExpenses.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td colSpan={4} className="px-4 py-3 text-right font-semibold text-slate-600">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-rose-700 text-base">{formatCurrency(monthTotal)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editingId ? "Edit" : "New"} Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Date</label>
              <input type="date" {...form.register("date")} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
              {form.formState.errors.date && <p className="text-destructive text-xs mt-1">{form.formState.errors.date.message}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Category</label>
              <select {...form.register("category")} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all bg-white">
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Amount (₹)</label>
              <input type="number" step="0.01" {...form.register("amount")} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="0" />
              {form.formState.errors.amount && <p className="text-destructive text-xs mt-1">{form.formState.errors.amount.message}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Payment Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => form.setValue("paymentMode", "cash")}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all ${form.watch("paymentMode") !== "online" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" : "bg-slate-100 text-slate-600"}`}>
                  <Banknote className="w-4 h-4" /> Cash
                </button>
                <button type="button" onClick={() => form.setValue("paymentMode", "online")}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all ${form.watch("paymentMode") === "online" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" : "bg-slate-100 text-slate-600"}`}>
                  <CreditCard className="w-4 h-4" /> Online
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Note (optional)</label>
              <textarea {...form.register("note")} rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none resize-none transition-all" placeholder="e.g. June rent, staff salary..." />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsDialogOpen(false)} className="px-5 py-2.5 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl font-medium bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Save Expense</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
