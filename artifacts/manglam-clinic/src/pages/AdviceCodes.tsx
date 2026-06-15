import { useState, useEffect, useCallback, useRef } from "react";
import { Layout } from "@/components/Layout";
import {
  getAdviceCodes, addAdviceCode, updateAdviceCode, deleteAdviceCode,
  importAdviceCodes, type AdviceCode,
} from "@/lib/store";
import { exportToExcel } from "@/lib/export";
import { Plus, Edit2, Trash2, Search, ClipboardList, Download, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const codeSchema = z.object({
  code: z.string().min(1, "Required"),
  advice: z.string().min(1, "Required"),
});

export default function AdviceCodes() {
  const [codes, setCodes] = useState<AdviceCode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const refresh = useCallback(() => { setCodes(getAdviceCodes()); }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const form = useForm({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "", advice: "" },
  });

  const handleOpenNew = () => {
    setEditingId(null);
    form.reset({ code: "", advice: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: AdviceCode) => {
    setEditingId(item.id);
    form.reset({ code: item.code, advice: item.advice });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this advice code?")) return;
    deleteAdviceCode(id);
    toast({ title: "Deleted", description: "Advice code removed." });
    refresh();
  };

  const onSubmit = (data: z.infer<typeof codeSchema>) => {
    if (editingId) {
      updateAdviceCode(editingId, data);
      toast({ title: "Updated", description: "Advice code updated." });
    } else {
      addAdviceCode(data);
      toast({ title: "Added", description: "New advice code added." });
    }
    setIsDialogOpen(false);
    refresh();
  };

  const handleExportCodes = () => {
    const exportData = codes.map(c => ({ Code: c.code, Advice: c.advice }));
    exportToExcel(exportData, "Manglam_Advice_Master");
    toast({ title: "Exported", description: "Advice codes exported to Excel." });
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(codes.map(c => ({ code: c.code, advice: c.advice })), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Manglam_Advice_Master.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Advice codes exported as JSON." });
  };

  const handleImportCodes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      const result = importAdviceCodes(json);
      if (result.success) {
        toast({ title: "Import Successful", description: result.message });
        refresh();
      } else {
        toast({ variant: "destructive", title: "Import Failed", description: result.message });
      }
    };
    reader.readAsText(file);
    if (importRef.current) importRef.current.value = "";
  };

  const filteredCodes = codes.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.advice.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportCodes} />
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-display text-slate-900">Advice Master</h2>
              <p className="text-slate-500 text-sm">Short codes that auto-fill the "Advice" field during patient registration (e.g. type <span className="font-bold text-emerald-700">F5</span> to get "FOLLOW UP AFTER 5 DAYS").</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExportCodes} className="px-3 py-2.5 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-1.5 text-sm">
              <Download className="w-4 h-4" /> Export Codes
            </button>
            <button onClick={handleExportJSON} className="px-3 py-2.5 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-1.5 text-sm">
              <Download className="w-4 h-4" /> Export JSON
            </button>
            <button onClick={() => importRef.current?.click()} className="px-3 py-2.5 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-1.5 text-sm">
              <Upload className="w-4 h-4" /> Import Codes
            </button>
            <button onClick={handleOpenNew} className="px-4 py-2.5 rounded-xl font-semibold bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add New Code
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="medical-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search codes or advice text..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-700" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-500">Code</th>
                  <th className="px-6 py-4 font-semibold text-slate-500">Advice</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCodes.length > 0 ? (
                  filteredCodes.map((code) => (
                    <tr key={code.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 uppercase border border-emerald-200">{code.code}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">{code.advice}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenEdit(code)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(code.id)} className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                      {codes.length === 0 ? "No advice codes yet. Add your first one!" : "No matching codes found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editingId ? "Edit" : "New"} Advice Code</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Short Code (e.g. F5)</label>
              <input {...form.register("code")} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none uppercase transition-all" placeholder="F5" />
              {form.formState.errors.code && <p className="text-destructive text-xs mt-1">{form.formState.errors.code.message}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Advice Text</label>
              <textarea {...form.register("advice")} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none resize-none transition-all" placeholder="FOLLOW UP AFTER 5 DAYS" />
              {form.formState.errors.advice && <p className="text-destructive text-xs mt-1">{form.formState.errors.advice.message}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsDialogOpen(false)} className="px-5 py-2.5 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl font-medium bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Save Code</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
