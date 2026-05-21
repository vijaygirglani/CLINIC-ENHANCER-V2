import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Layout } from "@/components/Layout";
import {
  addPatient, lookupByMobile, lookupByName, findComplaintCode,
  getNextPatientNo, getNextCaseNo, lookupByComplaint, lookupByAddress,
  type Patient,
} from "@/lib/store";
import { PrintPrescription, printPatientPrescription } from "@/components/PrintPrescription";
import {
  Loader2, User, Phone, MapPin, Activity, Save, RefreshCw,
  FileText, Printer, Paperclip, X, Leaf, Weight, Hash, Calendar,
  Zap, Search, SlidersHorizontal,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const patientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.string().min(1, "Mobile / Case No. required"),
  patientNo: z.string().optional(),
  visitDate: z.string().min(1, "Visit date required"),
  age: z.coerce.number().min(0).optional(),
  ageMonths: z.coerce.number().min(0).max(11).optional(),
  weight: z.string().optional(),
  address: z.string().optional(),
  complaintCode: z.string().optional(),
  complaint: z.string().optional(),
  treatment: z.string().optional(),
  advice: z.string().optional(),
  reports: z.string().optional(),
  fees: z.coerce.number().min(0).optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;
type FilterMode = "history" | "complaint" | "address";

const todayStr = format(new Date(), "yyyy-MM-dd");

const emptyDefaults: PatientFormValues = {
  name: "", mobile: "", patientNo: "", visitDate: todayStr,
  age: 0, ageMonths: 0, weight: "", address: "",
  complaintCode: "", complaint: "", treatment: "",
  advice: "", reports: "", fees: 0,
};

export default function Home() {
  const { toast } = useToast();
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [patientHistory, setPatientHistory] = useState<Patient[]>([]);
  const [historyName, setHistoryName] = useState("");
  const [historyMobile, setHistoryMobile] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<Patient | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("history");
  const [filterQuery, setFilterQuery] = useState("");
  const [filterResults, setFilterResults] = useState<Patient[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: emptyDefaults,
  });

  const complaintCodeValue = form.watch("complaintCode");
  const visitDateValue = form.watch("visitDate");

  useEffect(() => {
    if (complaintCodeValue && complaintCodeValue.length >= 2) {
      const codeRecord = findComplaintCode(complaintCodeValue);
      if (codeRecord) {
        form.setValue("complaint", codeRecord.complaint);
        form.setValue("treatment", codeRecord.treatment);
      }
    }
  }, [complaintCodeValue, form]);

  const runMobileLookup = useCallback(() => {
    const mobile = form.getValues("mobile");
    if (!mobile || mobile.length < 4) return;
    setIsLookingUp(true);
    const result = lookupByMobile(mobile);
    if (result.latestInfo) {
      form.setValue("name", result.latestInfo.name);
      form.setValue("age", result.latestInfo.age || 0);
      form.setValue("ageMonths", result.latestInfo.ageMonths || 0);
      form.setValue("weight", result.latestInfo.weight || "");
      form.setValue("address", result.latestInfo.address || "");
      setHistoryName(result.latestInfo.name);
      setHistoryMobile(mobile);
      toast({ title: "Patient found", description: `${result.history.length} visit(s) found.` });
    } else {
      setHistoryName("");
      setHistoryMobile(mobile);
    }
    setPatientHistory(result.history);
    setFilterMode("history");
    setIsLookingUp(false);
  }, [form, toast]);

  const runNameLookup = useCallback(() => {
    const name = form.getValues("name");
    if (!name || name.length < 2) return;
    setIsLookingUp(true);
    const result = lookupByName(name);
    if (result.latestInfo) {
      form.setValue("age", result.latestInfo.age || 0);
      form.setValue("ageMonths", result.latestInfo.ageMonths || 0);
      form.setValue("weight", result.latestInfo.weight || "");
      form.setValue("address", result.latestInfo.address || "");
      form.setValue("mobile", result.latestInfo.mobile);
      setHistoryName(name);
      setHistoryMobile(result.latestInfo.mobile);
      toast({ title: "Patient found", description: `${result.history.length} visit(s) found.` });
    } else {
      setHistoryName(name);
      setHistoryMobile("");
    }
    setPatientHistory(result.history);
    setFilterMode("history");
    setIsLookingUp(false);
  }, [form, toast]);

  const handleAutoCase = () => {
    const date = form.getValues("visitDate") || todayStr;
    const caseNo = getNextCaseNo(date);
    form.setValue("mobile", caseNo);
    toast({ title: "Case No. Generated", description: caseNo });
  };

  useEffect(() => {
    if (filterMode === "complaint" || filterMode === "address") {
      if (!filterQuery || filterQuery.length < 2) { setFilterResults([]); return; }
      if (filterMode === "complaint") setFilterResults(lookupByComplaint(filterQuery));
      else setFilterResults(lookupByAddress(filterQuery));
    }
  }, [filterQuery, filterMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = ev => setAttachments(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const savePatient = (data: PatientFormValues, registerType: "general" | "ayurvedic") => {
    const visitDate = data.visitDate || todayStr;
    const autoPatientNo = data.patientNo || getNextPatientNo(visitDate);
    const saved = addPatient({
      name: data.name, mobile: data.mobile, patientNo: autoPatientNo,
      age: data.age || 0, ageMonths: data.ageMonths || 0,
      weight: data.weight || "", address: data.address || "",
      complaintCode: data.complaintCode || "", complaint: data.complaint || "",
      treatment: data.treatment || "", advice: data.advice || "",
      reports: data.reports || "", fees: Number(data.fees || 0),
      attachments, registerType, visitDate,
    });
    setLastSaved(saved);
    toast({
      title: "Saved!",
      description: registerType === "ayurvedic" ? "Saved to Ayurvedic Register." : "Saved to Daily Register.",
    });
    form.reset({ ...emptyDefaults, visitDate });
    setAttachments([]);
    setPatientHistory([]);
    setHistoryName("");
    setHistoryMobile("");
  };

  const onSubmit = (data: PatientFormValues) => savePatient(data, "general");
  const onSaveAyurvedic = () => form.handleSubmit(data => savePatient(data, "ayurvedic"))();

  return (
    <Layout>
      {lastSaved && <PrintPrescription patient={lastSaved} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── MAIN FORM ── */}
        <div className="lg:col-span-8 space-y-6">
          <div className="medical-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-display text-slate-900">Patient Registration</h2>
                <p className="text-slate-500 text-sm">Register a new visit and view medical history.</p>
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Visit Date + Patient No */}
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" /> Visit Date
                    </label>
                    <input type="date" {...form.register("visitDate")}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-slate-400" /> Patient No. <span className="text-slate-400 text-xs">(optional)</span>
                    </label>
                    <input {...form.register("patientNo")}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800"
                      placeholder="auto-generated if blank" />
                  </div>
                </div>

                {/* Mobile / Case No */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" /> Mobile / Case No. <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          {...form.register("mobile")}
                          onBlur={runMobileLookup}
                          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), runMobileLookup())}
                          className="w-full pl-4 pr-10 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800 font-mono"
                          placeholder="Mobile or Case No."
                        />
                        {isLookingUp && <Loader2 className="w-4 h-4 absolute right-3 top-3.5 animate-spin text-slate-400" />}
                      </div>
                      <button type="button" onClick={runMobileLookup}
                        className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition-all" title="Search">
                        <Search className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={handleAutoCase} title="Auto-generate case number"
                        className="px-3 py-2 rounded-xl bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 transition-all flex items-center gap-1 shadow whitespace-nowrap">
                        <Zap className="w-3.5 h-3.5" /> Auto
                      </button>
                    </div>
                    {form.formState.errors.mobile && <p className="text-destructive text-xs">{form.formState.errors.mobile.message}</p>}
                    <p className="text-xs text-slate-400">
                      Case format: <span className="font-mono text-purple-600">00{format(new Date(visitDateValue || todayStr), "ddMMyy")}01</span>
                      &nbsp;· Press Enter or <Search className="w-3 h-3 inline" /> to search
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" /> Patient Name <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        {...form.register("name")}
                        onBlur={runNameLookup}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), runNameLookup())}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800"
                        placeholder="Full Name"
                      />
                      <button type="button" onClick={runNameLookup}
                        className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition-all" title="Search by name">
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                    {form.formState.errors.name && <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>}
                  </div>
                </div>

                {/* Age + Weight + Address */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Age <span className="text-slate-400 text-xs">(optional)</span></label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input type="number" {...form.register("age")} min={0}
                          className="w-full px-3 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800" placeholder="0" />
                        <span className="absolute right-2 top-3.5 text-xs text-slate-400">yrs</span>
                      </div>
                      <div className="w-20 relative">
                        <input type="number" {...form.register("ageMonths")} min={0} max={11}
                          className="w-full px-2 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800" placeholder="0" />
                        <span className="absolute right-2 top-3.5 text-xs text-slate-400">mo</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Weight className="w-4 h-4 text-slate-400" /> Weight
                    </label>
                    <input {...form.register("weight")}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800" placeholder="e.g. 65 kg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" /> Address
                    </label>
                    <input {...form.register("address")}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800" placeholder="City / Area" />
                  </div>
                </div>
              </div>

              {/* Medical Details */}
              <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" /> Complaint Code
                    </label>
                    <input {...form.register("complaintCode")}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 uppercase transition-all text-slate-800"
                      placeholder="E.G. CCF" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Consultation Fees (₹)</label>
                    <input type="number" {...form.register("fees")} min={0}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-semibold text-slate-900" placeholder="Amount" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Presenting Complaints</label>
                  <textarea {...form.register("complaint")} rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none text-slate-800" placeholder="Describe the symptoms..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Treatment Plan</label>
                  <textarea {...form.register("treatment")} rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none text-slate-800" placeholder="Prescribed medicines..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Advice / Notes
                      <span className="text-slate-400 font-normal text-xs ml-2">— write F5 for follow-up after 5 days</span>
                    </label>
                    <textarea {...form.register("advice")} rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none text-slate-800" placeholder="F5 · Rest, diet..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Reports Required</label>
                    <textarea {...form.register("reports")} rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none text-slate-800" placeholder="Blood test, X-ray..." />
                  </div>
                </div>
                {/* Attachments */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-slate-400" /> Attach Report Images
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                    onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="w-6 h-6 text-slate-300" />
                    <p className="text-sm text-slate-400">Click to upload image reports</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-2">
                      {attachments.map((src, i) => (
                        <div key={i} className="relative group">
                          <img src={src} className="w-20 h-20 object-cover rounded-xl border border-slate-200" alt={`Report ${i + 1}`} />
                          <button type="button" onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-end gap-3 pt-2">
                {lastSaved && (
                  <button type="button" onClick={() => printPatientPrescription(lastSaved)}
                    className="px-5 py-3 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2">
                    <Printer className="w-5 h-5" /> Print Last
                  </button>
                )}
                <button type="button" onClick={onSaveAyurvedic}
                  className="px-5 py-3 rounded-xl font-semibold bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2">
                  <Leaf className="w-5 h-5" /> Save Ayurvedic
                </button>
                <button type="submit"
                  className="px-7 py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2">
                  <Save className="w-5 h-5" /> Save General
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-4">
            {/* Filter Mode Selector */}
            <div className="medical-card p-3">
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                <button onClick={() => setFilterMode("history")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${filterMode === "history" ? "bg-white shadow text-primary" : "text-slate-500 hover:text-slate-700"}`}>
                  <RefreshCw className="w-3 h-3" /> History
                </button>
                <button onClick={() => setFilterMode("complaint")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${filterMode === "complaint" ? "bg-white shadow text-primary" : "text-slate-500 hover:text-slate-700"}`}>
                  <Activity className="w-3 h-3" /> Complaint
                </button>
                <button onClick={() => setFilterMode("address")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${filterMode === "address" ? "bg-white shadow text-primary" : "text-slate-500 hover:text-slate-700"}`}>
                  <MapPin className="w-3 h-3" /> Village
                </button>
              </div>

              {(filterMode === "complaint" || filterMode === "address") && (
                <div className="mt-2 relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={filterQuery}
                    onChange={e => setFilterQuery(e.target.value)}
                    placeholder={filterMode === "complaint" ? "Search complaint or code..." : "Search village / city..."}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary text-sm"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Results Panel */}
            <AnimatePresence mode="wait">
              {/* ── HISTORY MODE ── */}
              {filterMode === "history" && (
                <motion.div key="history" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="medical-card overflow-hidden flex flex-col max-h-[calc(100vh-220px)]">
                  {patientHistory.length > 0 ? (
                    <>
                      {/* Patient identity header */}
                      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{historyName || patientHistory[0]?.name}</p>
                            <p className="text-xs font-mono text-slate-500">{historyMobile || patientHistory[0]?.mobile}</p>
                          </div>
                          <span className="ml-auto text-xs text-slate-400 shrink-0">{patientHistory.length} visits</span>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {patientHistory.map((visit, i) => (
                          <div key={i} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold px-2 py-1 bg-white rounded-md border border-slate-200 text-slate-600">
                                {format(new Date(visit.visitDate), "dd MMM yyyy")}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {visit.registerType === "ayurvedic" && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">AYU</span>
                                )}
                                {visit.fees > 0 && (
                                  <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-md">₹{visit.fees}</span>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              {visit.complaint && <p className="text-xs text-slate-700"><span className="text-[10px] uppercase text-slate-400 font-bold">Complaint: </span>{visit.complaint}</p>}
                              {visit.treatment && <p className="text-xs text-slate-600"><span className="text-[10px] uppercase text-slate-400 font-bold">Treatment: </span>{visit.treatment}</p>}
                              {visit.advice && <p className="text-xs text-slate-500"><span className="text-[10px] uppercase text-slate-400 font-bold">Advice: </span>{visit.advice}</p>}
                            </div>
                            <div className="mt-2 flex justify-end">
                              <button type="button" onClick={() => printPatientPrescription(visit)}
                                className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary transition-colors">
                                <Printer className="w-3 h-3" /> Print
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="p-8 flex flex-col items-center justify-center text-center text-slate-400 h-64">
                      <FileText className="w-12 h-12 mb-4 text-slate-300" />
                      <p className="font-medium">No history</p>
                      <p className="text-sm mt-1">Enter mobile / case no. or name, then press Enter or <Search className="w-3 h-3 inline" /></p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── COMPLAINT / VILLAGE MODE ── compact list ── */}
              {(filterMode === "complaint" || filterMode === "address") && (
                <motion.div key="filter" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="medical-card overflow-hidden flex flex-col max-h-[calc(100vh-220px)]">
                  {filterResults.length > 0 ? (
                    <>
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 shrink-0 flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-sm text-slate-800">
                          {filterMode === "complaint" ? "By Complaint" : "By Village"}
                        </span>
                        <span className="ml-auto text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                          {filterResults.length} patients
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {filterResults.map((p, i) => (
                          <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                            <span className="text-xs text-slate-400 font-medium w-5 shrink-0">{i + 1}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 text-sm truncate">{p.name}</p>
                              <p className="text-xs font-mono text-slate-400">{p.mobile}</p>
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">
                              {format(new Date(p.visitDate), "dd/MM/yy")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="p-8 flex flex-col items-center justify-center text-center text-slate-400 h-48">
                      {filterMode === "complaint" ? <Activity className="w-10 h-10 mb-3 text-slate-300" /> : <MapPin className="w-10 h-10 mb-3 text-slate-300" />}
                      <p className="text-sm font-medium">{filterQuery.length < 2 ? "Type to search..." : "No results found"}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  );
}
