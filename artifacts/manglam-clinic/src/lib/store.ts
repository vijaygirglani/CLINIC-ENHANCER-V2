// ClinicPro — localStorage data store
// ALL keys use "cp_" prefix — completely separate from old app's "mc_" keys.
// Zero data collision with the old Manglam Clinic app.

// ═══════════════════════════════════════════════════════════════
// SHARED TYPES (copied from old app — unchanged)
// ═══════════════════════════════════════════════════════════════

// ── Patient Tag System ────────────────────────────────────────────────────────
export type TagCategory =
  | "chronic"
  | "mental"
  | "digestive"
  | "behavior"
  | "allergy"
  | "reproductive"
  | "custom";

export interface PatientTag {
  id: string;           // unique slug e.g. "diabetic", "custom_abc123"
  label: string;        // display text
  emoji: string;        // icon shown on tag
  category: TagCategory;
  color: string;        // tailwind bg color class e.g. "bg-red-100"
  textColor: string;    // tailwind text color class e.g. "text-red-700"
  borderColor: string;  // tailwind border color e.g. "border-red-300"
  isCustom?: boolean;
}

export const PRESET_TAGS: PatientTag[] = [
  // Chronic — Red
  { id: "diabetic",      label: "Diabetic",       emoji: "🩸", category: "chronic",      color: "bg-red-100",    textColor: "text-red-700",    borderColor: "border-red-300" },
  { id: "hypertensive",  label: "Hypertensive",   emoji: "💓", category: "chronic",      color: "bg-red-100",    textColor: "text-red-700",    borderColor: "border-red-300" },
  { id: "cardiac",       label: "Cardiac",         emoji: "❤️", category: "chronic",      color: "bg-red-100",    textColor: "text-red-700",    borderColor: "border-red-300" },
  { id: "asthmatic",     label: "Asthmatic",      emoji: "🫁", category: "chronic",      color: "bg-red-100",    textColor: "text-red-700",    borderColor: "border-red-300" },
  { id: "epileptic",     label: "Epileptic",      emoji: "⚡", category: "chronic",      color: "bg-red-100",    textColor: "text-red-700",    borderColor: "border-red-300" },
  { id: "thyroid",       label: "Thyroid",         emoji: "🦋", category: "chronic",      color: "bg-red-100",    textColor: "text-red-700",    borderColor: "border-red-300" },
  { id: "kidney",        label: "Kidney Disease",  emoji: "🫘", category: "chronic",      color: "bg-red-100",    textColor: "text-red-700",    borderColor: "border-red-300" },
  { id: "liver",         label: "Liver Disease",   emoji: "🟤", category: "chronic",      color: "bg-red-100",    textColor: "text-red-700",    borderColor: "border-red-300" },
  // Mental — Purple
  { id: "anxiety",       label: "Anxiety",         emoji: "😰", category: "mental",       color: "bg-purple-100", textColor: "text-purple-700", borderColor: "border-purple-300" },
  { id: "depression",    label: "Depression",      emoji: "🌧️", category: "mental",       color: "bg-purple-100", textColor: "text-purple-700", borderColor: "border-purple-300" },
  { id: "psychiatric",   label: "Psychiatric",     emoji: "🧠", category: "mental",       color: "bg-purple-100", textColor: "text-purple-700", borderColor: "border-purple-300" },
  { id: "addiction",     label: "Addiction",       emoji: "🚬", category: "mental",       color: "bg-purple-100", textColor: "text-purple-700", borderColor: "border-purple-300" },
  { id: "insomnia",      label: "Insomnia",        emoji: "🌙", category: "mental",       color: "bg-purple-100", textColor: "text-purple-700", borderColor: "border-purple-300" },
  // Digestive — Orange
  { id: "gastritis",     label: "Gastritis",       emoji: "🔥", category: "digestive",    color: "bg-orange-100", textColor: "text-orange-700", borderColor: "border-orange-300" },
  { id: "ibs",           label: "IBS",             emoji: "🌀", category: "digestive",    color: "bg-orange-100", textColor: "text-orange-700", borderColor: "border-orange-300" },
  { id: "acidity",       label: "Acidity Prone",   emoji: "⚗️", category: "digestive",    color: "bg-orange-100", textColor: "text-orange-700", borderColor: "border-orange-300" },
  { id: "constipation",  label: "Constipation",    emoji: "🪨", category: "digestive",    color: "bg-orange-100", textColor: "text-orange-700", borderColor: "border-orange-300" },
  // Behavior — Yellow
  { id: "vip",           label: "VIP / Known",     emoji: "⭐", category: "behavior",     color: "bg-yellow-100", textColor: "text-yellow-700", borderColor: "border-yellow-300" },
  { id: "relative",      label: "Relative / Staff",emoji: "👨‍👩‍👦", category: "behavior",   color: "bg-yellow-100", textColor: "text-yellow-700", borderColor: "border-yellow-300" },
  { id: "poor",          label: "Poor Patient",    emoji: "🙏", category: "behavior",     color: "bg-yellow-100", textColor: "text-yellow-700", borderColor: "border-yellow-300" },
  { id: "irregular",     label: "Irregular F/U",   emoji: "📅", category: "behavior",     color: "bg-yellow-100", textColor: "text-yellow-700", borderColor: "border-yellow-300" },
  // Allergy — Bright Red (safety critical)
  { id: "allergy_pen",   label: "Penicillin Allergy", emoji: "🚨", category: "allergy",  color: "bg-rose-100",   textColor: "text-rose-700",   borderColor: "border-rose-400" },
  { id: "allergy_sulpha",label: "Sulpha Allergy",  emoji: "🚨", category: "allergy",     color: "bg-rose-100",   textColor: "text-rose-700",   borderColor: "border-rose-400" },
  { id: "allergy_asp",   label: "Aspirin Allergy", emoji: "🚨", category: "allergy",     color: "bg-rose-100",   textColor: "text-rose-700",   borderColor: "border-rose-400" },
  // Reproductive — Pink / Blue
  { id: "pregnant",      label: "Pregnant",        emoji: "🤰", category: "reproductive", color: "bg-pink-100",   textColor: "text-pink-700",   borderColor: "border-pink-300" },
  { id: "lactating",     label: "Lactating",       emoji: "🍼", category: "reproductive", color: "bg-pink-100",   textColor: "text-pink-700",   borderColor: "border-pink-300" },
  { id: "pediatric",     label: "Pediatric",       emoji: "👶", category: "reproductive", color: "bg-blue-100",   textColor: "text-blue-700",   borderColor: "border-blue-300" },
];

// Storage key for custom tags added by doctor
export const CUSTOM_TAGS_KEY = "cp_custom_tags";

export function getCustomTags(): PatientTag[] {
  try { return JSON.parse(localStorage.getItem(CUSTOM_TAGS_KEY) || "[]"); }
  catch { return []; }
}

export function saveCustomTag(tag: PatientTag) {
  const tags = getCustomTags();
  const idx = tags.findIndex(t => t.id === tag.id);
  if (idx !== -1) tags[idx] = tag;
  else tags.push(tag);
  localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tags));
}

export function deleteCustomTag(id: string) {
  const tags = getCustomTags().filter(t => t.id !== id);
  localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tags));
}

export function getAllTags(): PatientTag[] {
  return [...PRESET_TAGS, ...getCustomTags()];
}

// Per-patient tags stored separately keyed by mobile number
// so tags persist across all visits regardless of patient id
export const PATIENT_TAGS_KEY = "cp_patient_tags";

export function getPatientTags(mobile: string): PatientTag[] {
  try {
    const all = JSON.parse(localStorage.getItem(PATIENT_TAGS_KEY) || "{}");
    return all[mobile] || [];
  } catch { return []; }
}

export function savePatientTags(mobile: string, tags: PatientTag[]) {
  try {
    const all = JSON.parse(localStorage.getItem(PATIENT_TAGS_KEY) || "{}");
    all[mobile] = tags;
    localStorage.setItem(PATIENT_TAGS_KEY, JSON.stringify(all));
  } catch {}
}

// ── Patient Interface ─────────────────────────────────────────────────────────
export interface Patient {
  id: number;
  patientNo?: string;
  name: string;
  age: number;
  ageMonths?: number;
  weight?: string;
  address: string;
  mobile: string;
  complaintCode?: string;
  complaint?: string;
  treatment?: string;
  adviceCode?: string;
  advice?: string;
  reports?: string;
  fees: number;
  attachments?: string[];
  registerType?: "general" | "ayurvedic";
  doctorId?: 1 | 2;
  visitDate: string;
  createdAt: string;
}

export interface ComplaintCodeMedicine {
  medicineName: string;
  defaultQty: number;
  mrp: number;
}

export interface ComplaintCode {
  id: number;
  code: string;
  complaint: string;
  treatment: string;
  medicines?: ComplaintCodeMedicine[];
  createdAt: string;
}

// ── Advice Master (auto-fill for the "Advice" field) ──────────────────────────
export interface AdviceCode {
  id: number;
  code: string;
  advice: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// NEW TYPES — Medicine, Inventory, Billing, Profit
// ═══════════════════════════════════════════════════════════════

export interface MedicineBatch {
  batchNo: string;
  expiryDate: string;   // "MM/YY"
  qty: number;
}

export interface MedicineItem {
  id: number;
  name: string;           // "Merci Tab"
  mrp: number;            // MRP per pack (e.g. ₹79 for 10 tabs)
  mrpPerTablet: number;   // MRP per tablet (e.g. ₹7.90)
  packSize: number;       // tablets per pack (e.g. 10)
  reorderLevel: number;   // alert when stock <= this (in tablets)
  currentStock: number;   // total TABLETS on hand
  landingCost: number;    // landing cost per PACK (divide by packSize for per-tablet)
  batches?: MedicineBatch[]; // manually-tracked batches, for expiry tracking only (independent of currentStock)
  createdAt: string;
}

export interface PurchaseBillItem {
  medicineId: number;
  medicineName: string;
  mrp: number;            // MRP per pack/strip
  packSize: number;       // tablets per pack (e.g. 10)
  mrpPerTablet: number;   // mrp / packSize
  batchNo: string;
  expiryDate: string;     // "MM/YY"
  qtyPaid: number;        // packs paid
  qtyFree: number;        // packs free
  ratePerUnit: number;    // rate per pack
  discountPct: number;
  gstPct: number;
  // Auto-calculated
  landingCostPerUnit: number;   // landing cost per PACK
  landingCostPerTablet: number; // landing cost per TABLET
  totalQtyReceived: number;     // total PACKS received
  totalTabletsReceived: number; // total TABLETS = packs × packSize
  taxableAmount: number;
  gstAmount: number;
  totalPaid: number;
}

export interface PurchaseBillPayment {
  date: string;    // "YYYY-MM-DD" — when this portion was actually paid
  amount: number;
}

export interface PurchaseBill {
  id: number;
  supplierName: string;
  billNo: string;
  billDate: string;
  items: PurchaseBillItem[];   // kept for backward compatibility with older/imported bills — new bills leave this empty
  notes?: string;              // free-text description (e.g. medicines bought), optional
  grandTotal: number;
  pendingAmount?: number;   // amount still owed to the pharmacy for this bill (0 / undefined = fully paid)
  payments: PurchaseBillPayment[]; // cash-basis payment log — what was actually paid, and when
  createdAt: string;
}

export function getPurchaseBillPaymentStatus(bill: PurchaseBill): "paid" | "partial" | "pending" {
  const pending = bill.pendingAmount || 0;
  if (pending <= 0) return "paid";
  if (pending >= bill.grandTotal) return "pending";
  return "partial";
}

export interface MedicineSaleItem {
  medicineId: number;
  medicineName: string;
  qty: number;
  mrp: number;
  landingCost: number;
  salePrice: number;      // mrp * qty
  profit: number;         // (mrp - landingCost) * qty
}

export interface MedicineBill {
  id: number;
  patientId?: number;     // optional — can be a loose/walk-in sale
  patientName: string;
  doctorId: number;       // 1 or 2
  billDate: string;
  items: MedicineSaleItem[];
  totalSale: number;
  totalCost: number;
  totalProfit: number;
  createdAt: string;
}

export interface Doctor {
  id: number;
  name: string;
  profitSharePct: number; // e.g. 60 for 60%
}

export interface StockLedgerEntry {
  id: number;
  medicineId: number;
  medicineName: string;
  type: "purchase" | "sale" | "adjustment";
  qty: number;            // positive = in, negative = out
  balanceAfter: number;
  refId?: number;         // purchaseBillId or medicineBillId
  refNo?: string;         // bill no or patient name
  date: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// STORAGE KEYS — all cp_ prefixed
// ═══════════════════════════════════════════════════════════════

const PATIENTS_KEY        = "cp_patients";
const CODES_KEY           = "cp_complaint_codes";
const ADVICE_CODES_KEY    = "cp_advice_codes";
const COUNTER_KEY         = "cp_id_counter";
const PATIENT_NO_KEY      = "cp_patient_no_counter";
const MEDICINES_KEY       = "cp_medicines";
const PURCHASE_BILLS_KEY  = "cp_purchase_bills";
const MEDICINE_BILLS_KEY  = "cp_medicine_bills";
const DOCTORS_KEY         = "cp_doctors";
const STOCK_LEDGER_KEY    = "cp_stock_ledger";

// ═══════════════════════════════════════════════════════════════
// ID COUNTER (shared across all entities)
// ═══════════════════════════════════════════════════════════════

function nextId(): number {
  const val = parseInt(localStorage.getItem(COUNTER_KEY) || "0") + 1;
  localStorage.setItem(COUNTER_KEY, String(val));
  return val;
}

// ═══════════════════════════════════════════════════════════════
// PATIENT NO & CASE NO
// ═══════════════════════════════════════════════════════════════

export function getNextPatientNo(visitDate: string): string {
  const dateKey = visitDate.replace(/-/g, "");
  const counterKey = `${PATIENT_NO_KEY}_${dateKey}`;
  const val = parseInt(localStorage.getItem(counterKey) || "0") + 1;
  localStorage.setItem(counterKey, String(val));
  return String(val).padStart(2, "0");
}

export function getNextCaseNo(visitDate: string): string {
  const d = new Date(visitDate + "T00:00:00");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const dateKey = `${dd}${mm}${yy}`;
  const counterKey = `cp_case_no_${dateKey}`;
  const val = parseInt(localStorage.getItem(counterKey) || "0") + 1;
  localStorage.setItem(counterKey, String(val));
  return `00${dateKey}${String(val).padStart(2, "0")}`;
}

// ═══════════════════════════════════════════════════════════════
// PATIENTS (all functions copied from old app)
// ═══════════════════════════════════════════════════════════════

export function getPatients(): Patient[] {
  try { return JSON.parse(localStorage.getItem(PATIENTS_KEY) || "[]"); }
  catch { return []; }
}

function savePatients(patients: Patient[]) {
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
}

export function addPatient(data: Omit<Patient, "id" | "createdAt">): Patient {
  const patients = getPatients();
  const patient: Patient = { ...data, id: nextId(), createdAt: new Date().toISOString() };
  patients.push(patient);
  savePatients(patients);
  return patient;
}

export function updatePatient(id: number, data: Partial<Patient>): Patient | null {
  const patients = getPatients();
  const idx = patients.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  patients[idx] = { ...patients[idx], ...data };
  savePatients(patients);
  return patients[idx];
}

export function deletePatient(id: number): boolean {
  const patients = getPatients();
  const filtered = patients.filter((p) => p.id !== id);
  savePatients(filtered);
  return filtered.length !== patients.length;
}

export function getPatientsByDate(date: string): Patient[] {
  return getPatients().filter((p) => p.visitDate === date)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getAyurvedicPatientsByDate(date: string): Patient[] {
  return getPatients().filter((p) => p.visitDate === date && p.registerType === "ayurvedic")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ═══════════════════════════════════════════════════════════════
// PATIENT CONTACTS — unique mobile numbers for WhatsApp broadcast
// (pulled from BOTH the Daily Register and Ayurvedic Register;
// the patient/case number is intentionally ignored)
// ═══════════════════════════════════════════════════════════════
export interface PatientContact {
  mobile: string;                 // normalized 10-digit number
  name: string;                   // most recent name on record for this number
  visitCount: number;
  lastVisitDate: string;
  registerTypes: ("general" | "ayurvedic")[];
}

export function getUniqueContacts(): PatientContact[] {
  const patients = getPatients();
  const map = new Map<string, PatientContact>();

  for (const p of patients) {
    const digits = (p.mobile || "").replace(/\D/g, "");
    if (digits.length < 10) continue;          // skip blank / invalid / non-mobile entries
    const normalized = digits.slice(-10);       // last 10 digits (drop +91/0 prefixes)

    // Skip case/patient numbers that were accidentally entered into the mobile field.
    // Real Indian mobile numbers are 10 digits starting with 6-9 and never start with "00".
    if (normalized.startsWith("00")) continue;
    if (!/^[6-9]/.test(normalized)) continue;

    const regType: "general" | "ayurvedic" = p.registerType === "ayurvedic" ? "ayurvedic" : "general";

    const existing = map.get(normalized);
    if (!existing) {
      map.set(normalized, {
        mobile: normalized,
        name: p.name || "",
        visitCount: 1,
        lastVisitDate: p.visitDate,
        registerTypes: [regType],
      });
    } else {
      existing.visitCount++;
      if (!existing.registerTypes.includes(regType)) existing.registerTypes.push(regType);
      if ((p.visitDate || "") >= (existing.lastVisitDate || "")) {
        existing.name = p.name || existing.name;
        existing.lastVisitDate = p.visitDate;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

export function lookupByMobile(mobile: string): { latestInfo?: Patient; history: Patient[] } {
  const q = (mobile || "").trim();
  if (q.length < 3) return { history: [] };
  const all = getPatients().filter((p) => p.mobile.toLowerCase().includes(q.toLowerCase()));
  const sorted = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { latestInfo: sorted[0], history: sorted };
}

export function lookupByName(name: string): { latestInfo?: Patient; history: Patient[] } {
  const q = (name || "").trim();
  if (q.length < 2) return { history: [] };
  const all = getPatients().filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  const sorted = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { latestInfo: sorted[0], history: sorted };
}

export function lookupByComplaint(query: string): Patient[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return getPatients()
    .filter(p => (p.complaint || "").toLowerCase().includes(q) || (p.complaintCode || "").toLowerCase().includes(q))
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate));
}

export function lookupByAddress(query: string): Patient[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return getPatients()
    .filter(p => (p.address || "").toLowerCase().includes(q))
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate));
}

export interface PatientSuggestion {
  name: string;
  mobile: string;
  age: number;
  ageMonths?: number;
  weight?: string;
  address?: string;
  visitCount: number;
  lastVisit: string;
  recentVisits: Patient[];
}

export function searchPatientSuggestions(query: string): PatientSuggestion[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const all = getPatients().filter(p => p.name.toLowerCase().includes(q));
  const byMobile = new Map<string, Patient[]>();
  for (const p of all) {
    if (!byMobile.has(p.mobile)) byMobile.set(p.mobile, []);
    byMobile.get(p.mobile)!.push(p);
  }
  const suggestions: PatientSuggestion[] = [];
  for (const [mobile, visits] of byMobile) {
    const sorted = visits.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const latest = sorted[0];
    suggestions.push({
      name: latest.name, mobile, age: latest.age || 0,
      ageMonths: latest.ageMonths || 0, weight: latest.weight || "",
      address: latest.address || "", visitCount: sorted.length,
      lastVisit: latest.visitDate, recentVisits: sorted.slice(0, 3),
    });
  }
  return suggestions.sort((a, b) => b.lastVisit.localeCompare(a.lastVisit)).slice(0, 8);
}

export interface FollowUpReminder {
  patient: Patient;
  followUpDate: string;
  daysOverdue: number;
}

export function getFollowUpReminders(): FollowUpReminder[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ayurvedicPatients = getPatients().filter(p => p.registerType === "ayurvedic");
  const seen = new Set<string>();
  const reminders: FollowUpReminder[] = [];
  for (const p of ayurvedicPatients) {
    const match = (p.advice || "").match(/f\s*(\d+)/i);
    if (!match) continue;
    const days = parseInt(match[1]);
    if (!days || days <= 0) continue;
    const visitDate = new Date(p.visitDate + "T00:00:00");
    const followUp = new Date(visitDate);
    followUp.setDate(followUp.getDate() + days);
    const followUpStr = followUp.toISOString().slice(0, 10);
    const diffMs = today.getTime() - followUp.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < -3) continue;
    const key = `${p.mobile}_${p.visitDate}`;
    if (seen.has(key)) continue;
    seen.add(key);
    reminders.push({ patient: p, followUpDate: followUpStr, daysOverdue: diffDays });
  }
  return reminders.sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
}

export interface DailyStats {
  date: string;
  totalPatients: number;
  totalFees: number;
  patients: Patient[];
}

export function getDailyStats(date: string): DailyStats {
  const patients = getPatientsByDate(date);
  return { date, totalPatients: patients.length, totalFees: patients.reduce((s, p) => s + (p.fees || 0), 0), patients };
}

export function getAyurvedicDailyStats(date: string): DailyStats {
  const patients = getAyurvedicPatientsByDate(date);
  return { date, totalPatients: patients.length, totalFees: patients.reduce((s, p) => s + (p.fees || 0), 0), patients };
}

export function getAllDates(): { date: string; count: number; totalFees: number }[] {
  const patients = getPatients();
  const map: Record<string, { count: number; totalFees: number }> = {};
  for (const p of patients) {
    if (!map[p.visitDate]) map[p.visitDate] = { count: 0, totalFees: 0 };
    map[p.visitDate].count += 1;
    map[p.visitDate].totalFees += p.fees || 0;
  }
  return Object.entries(map).map(([date, v]) => ({ date, ...v })).sort((a, b) => b.date.localeCompare(a.date));
}

export function getAllAyurvedicDates(): { date: string; count: number; totalFees: number }[] {
  const patients = getPatients().filter((p) => p.registerType === "ayurvedic");
  const map: Record<string, { count: number; totalFees: number }> = {};
  for (const p of patients) {
    if (!map[p.visitDate]) map[p.visitDate] = { count: 0, totalFees: 0 };
    map[p.visitDate].count += 1;
    map[p.visitDate].totalFees += p.fees || 0;
  }
  return Object.entries(map).map(([date, v]) => ({ date, ...v })).sort((a, b) => b.date.localeCompare(a.date));
}

export function getMonthlyStats(year: number, month: number) {
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const patients = getPatients().filter((p) => p.visitDate.startsWith(monthStr));
  const totalFees = patients.reduce((sum, p) => sum + (p.fees || 0), 0);
  const generalPatients = patients.filter(p => p.registerType !== "ayurvedic").length;
  const ayurvedicPatients = patients.filter(p => p.registerType === "ayurvedic").length;
  const generalFees = patients.filter(p => p.registerType !== "ayurvedic").reduce((s, p) => s + (p.fees || 0), 0);
  const ayurvedicFees = patients.filter(p => p.registerType === "ayurvedic").reduce((s, p) => s + (p.fees || 0), 0);
  const dayMap: Record<string, { count: number; totalFees: number; generalFees: number; ayurvedicFees: number }> = {};
  for (const p of patients) {
    if (!dayMap[p.visitDate]) dayMap[p.visitDate] = { count: 0, totalFees: 0, generalFees: 0, ayurvedicFees: 0 };
    dayMap[p.visitDate].count += 1;
    dayMap[p.visitDate].totalFees += p.fees || 0;
    if (p.registerType === "ayurvedic") dayMap[p.visitDate].ayurvedicFees += p.fees || 0;
    else dayMap[p.visitDate].generalFees += p.fees || 0;
  }
  const dailyBreakdown = Object.entries(dayMap).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date));
  const manualExpenses = getExpensesByMonth(year, month).reduce((s, e) => s + e.amount, 0);
  const pharmacyExpenses = getPharmacyPaidAmountByMonth(year, month);
  const totalExpenses = manualExpenses + pharmacyExpenses;
  const netTotal = totalFees - totalExpenses;
  const doctors = getDoctors();
  const d1 = doctors[0] || { name: "Doctor 1", profitSharePct: 80 };
  const d2 = doctors[1] || { name: "Doctor 2", profitSharePct: 20 };
  const doctorSplit = {
    doctor1: { name: d1.name, pct: d1.profitSharePct, amount: Math.round(netTotal * (d1.profitSharePct / 100) * 100) / 100 },
    doctor2: { name: d2.name, pct: d2.profitSharePct, amount: Math.round(netTotal * (d2.profitSharePct / 100) * 100) / 100 },
  };
  return {
    totalPatients: patients.length, totalFees, generalPatients, ayurvedicPatients, generalFees, ayurvedicFees, dailyBreakdown,
    manualExpenses, pharmacyExpenses, totalExpenses, netTotal, doctorSplit,
  };
}

// ═══════════════════════════════════════════════════════════════
// COMPLAINT CODES
// ═══════════════════════════════════════════════════════════════

export function getComplaintCodes(): ComplaintCode[] {
  try { return JSON.parse(localStorage.getItem(CODES_KEY) || "[]"); }
  catch { return []; }
}

function saveCodes(codes: ComplaintCode[]) {
  localStorage.setItem(CODES_KEY, JSON.stringify(codes));
}

export function addComplaintCode(data: Omit<ComplaintCode, "id" | "createdAt">): ComplaintCode {
  const codes = getComplaintCodes();
  const code: ComplaintCode = { ...data, code: data.code.toUpperCase(), id: nextId(), createdAt: new Date().toISOString() };
  codes.push(code);
  saveCodes(codes);
  return code;
}

export function updateComplaintCode(id: number, data: Partial<ComplaintCode>): ComplaintCode | null {
  const codes = getComplaintCodes();
  const idx = codes.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  codes[idx] = { ...codes[idx], ...data, code: (data.code || codes[idx].code).toUpperCase() };
  saveCodes(codes);
  return codes[idx];
}

export function deleteComplaintCode(id: number): boolean {
  const codes = getComplaintCodes();
  const filtered = codes.filter((c) => c.id !== id);
  saveCodes(filtered);
  return filtered.length !== codes.length;
}

export function findComplaintCode(code: string): ComplaintCode | undefined {
  return getComplaintCodes().find((c) => c.code === code.toUpperCase());
}

export function importComplaintCodes(jsonStr: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (!Array.isArray(data)) return { success: false, message: "Invalid format. Expected an array of codes." };
    const existing = getComplaintCodes();
    let added = 0;
    let counter = parseInt(localStorage.getItem(COUNTER_KEY) || "0");
    for (const item of data) {
      if (!item.code || !item.complaint || !item.treatment) continue;
      const exists = existing.find((c) => c.code === item.code.toUpperCase());
      if (!exists) {
        counter++;
        existing.push({ id: counter, code: item.code.toUpperCase(), complaint: item.complaint, treatment: item.treatment, createdAt: item.createdAt || new Date().toISOString() });
        added++;
      }
    }
    saveCodes(existing);
    localStorage.setItem(COUNTER_KEY, String(counter));
    return { success: true, message: `Imported ${added} new codes (duplicates skipped).` };
  } catch { return { success: false, message: "Failed to parse codes file." }; }
}

// ═══════════════════════════════════════════════════════════════
// ADVICE MASTER — codes that auto-fill the "Advice" field
// ═══════════════════════════════════════════════════════════════

// Default seed list (from clinic's Advice Master sheet).
// Loaded automatically the first time getAdviceCodes() runs and
// storage is empty. After that, the doctor's edits are authoritative.
const DEFAULT_ADVICE_CODES: { code: string; advice: string }[] = [
  { code: "F1",    advice: "FOLLOW UP TOMORROW" },
  { code: "F2",    advice: "FOLLOW UP AFTER 2 DAYS" },
  { code: "F3",    advice: "FOLLOW UP AFTER 3 DAYS" },
  { code: "F4",    advice: "FOLLOW UP AFTER 4 DAYS" },
  { code: "F5",    advice: "FOLLOW UP AFTER 5 DAYS" },
  { code: "F7",    advice: "FOLLOW UP AFTER 7 DAYS" },
  { code: "F10",   advice: "FOLLOW UP AFTER 10 DAYS" },
  { code: "F15",   advice: "FOLLOW UP AFTER 15 DAYS" },
  { code: "F20",   advice: "FOLLOW UP AFTER 20 DAYS" },
  { code: "F30",   advice: "FOLLOW UP AFTER 30 DAYS" },
  { code: "F1IV",  advice: "FOLLOW UP TOMORROW, IV FLUID" },
  { code: "F2IV",  advice: "FOLLOW UP AFTER 2 DAYS, IV FLUID" },
  { code: "I",     advice: "INJECTION" },
  { code: "IV",    advice: "IV FLUID" },
  { code: "RIV",   advice: "REPORTS AND IV FLUID" },
  { code: "D",     advice: "DRESSING" },
  { code: "DICLO", advice: "INJ. DICLO" },
  { code: "NEB",   advice: "DUOLIN NEBULIZER" },
  { code: "NEB1",  advice: "DUOLIN BUDECORT NEBULIZER" },
  { code: "REN",   advice: "REFUSED FOR NEBULIZER" },
  { code: "REI",   advice: "REFUSED FOR INJECTION" },
  { code: "REIV",  advice: "REFUSED FOR IV FLUIDS" },
  { code: "RER",   advice: "REFUSED FOR REPORTS" },
  { code: "RES",   advice: "REFUSED FOR SYP" },
  { code: "R1",    advice: "REPORT TOMORROW" },
  { code: "R2",    advice: "REPORT AFTER 2 DAYS" },
  { code: "R3",    advice: "REPORT AFTER 3 DAYS" },
  { code: "R5",    advice: "REPORT AFTER 5 DAYS" },
  { code: "U",     advice: "USG ABDOMEN MORBI" },
  { code: "XRAY",  advice: "MORBI XRAY" },
  { code: "CT",    advice: "CT SCAN" },
  { code: "SU",    advice: "REFER FOR SURGICAL OPINION / REFER TO SURGEON" },
  { code: "GY",    advice: "REFER TO GYNECOLOGIST" },
  { code: "PH",    advice: "REFER TO PHYSICIAN" },
  { code: "PE",    advice: "REFER TO PEDIATRICIAN" },
  { code: "OR",    advice: "REFER TO ORTHOPEDIC" },
  { code: "DE",    advice: "REFER TO DENTAL" },
  { code: "ENT",   advice: "REFER TO ENT" },
];

function seedAdviceCodes(): AdviceCode[] {
  let counter = parseInt(localStorage.getItem(COUNTER_KEY) || "0");
  const seeded: AdviceCode[] = DEFAULT_ADVICE_CODES.map((item) => {
    counter++;
    return { id: counter, code: item.code, advice: item.advice, createdAt: new Date().toISOString() };
  });
  localStorage.setItem(COUNTER_KEY, String(counter));
  saveAdviceCodes(seeded);
  return seeded;
}

export function getAdviceCodes(): AdviceCode[] {
  try {
    const raw = localStorage.getItem(ADVICE_CODES_KEY);
    if (raw === null) return seedAdviceCodes(); // first run — seed defaults
    return JSON.parse(raw);
  } catch { return []; }
}

function saveAdviceCodes(codes: AdviceCode[]) {
  localStorage.setItem(ADVICE_CODES_KEY, JSON.stringify(codes));
}

export function addAdviceCode(data: Omit<AdviceCode, "id" | "createdAt">): AdviceCode {
  const codes = getAdviceCodes();
  const code: AdviceCode = { ...data, code: data.code.toUpperCase(), id: nextId(), createdAt: new Date().toISOString() };
  codes.push(code);
  saveAdviceCodes(codes);
  return code;
}

export function updateAdviceCode(id: number, data: Partial<AdviceCode>): AdviceCode | null {
  const codes = getAdviceCodes();
  const idx = codes.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  codes[idx] = { ...codes[idx], ...data, code: (data.code || codes[idx].code).toUpperCase() };
  saveAdviceCodes(codes);
  return codes[idx];
}

export function deleteAdviceCode(id: number): boolean {
  const codes = getAdviceCodes();
  const filtered = codes.filter((c) => c.id !== id);
  saveAdviceCodes(filtered);
  return filtered.length !== codes.length;
}

export function findAdviceCode(code: string): AdviceCode | undefined {
  return getAdviceCodes().find((c) => c.code === code.toUpperCase());
}

export function importAdviceCodes(jsonStr: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (!Array.isArray(data)) return { success: false, message: "Invalid format. Expected an array of codes." };
    const existing = getAdviceCodes();
    let added = 0;
    let counter = parseInt(localStorage.getItem(COUNTER_KEY) || "0");
    for (const item of data) {
      if (!item.code || !item.advice) continue;
      const exists = existing.find((c) => c.code === item.code.toUpperCase());
      if (!exists) {
        counter++;
        existing.push({ id: counter, code: item.code.toUpperCase(), advice: item.advice, createdAt: item.createdAt || new Date().toISOString() });
        added++;
      }
    }
    saveAdviceCodes(existing);
    localStorage.setItem(COUNTER_KEY, String(counter));
    return { success: true, message: `Imported ${added} new advice codes (duplicates skipped).` };
  } catch { return { success: false, message: "Failed to parse advice codes file." }; }
}

// ═══════════════════════════════════════════════════════════════
// BACKUP / RESTORE
// ═══════════════════════════════════════════════════════════════

export function exportBackup(): string {
  const data = {
    version: 2,
    app: "ClinicPro",
    exportedAt: new Date().toISOString(),
    patients: getPatients(),
    complaintCodes: getComplaintCodes(),
    adviceCodes: getAdviceCodes(),
    medicines: getMedicines(),
    purchaseBills: getPurchaseBills(),
    medicineBills: getMedicineBills(),
    doctors: getDoctors(),
    pharmacies: getPharmacies(),
    expenses: getExpenses(),
    idCounter: parseInt(localStorage.getItem(COUNTER_KEY) || "0"),
  };
  return JSON.stringify(data, null, 2);
}

export function importBackup(jsonStr: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.patients || !Array.isArray(data.patients)) return { success: false, message: "Invalid backup file format." };
    savePatients(data.patients);
    if (data.complaintCodes && Array.isArray(data.complaintCodes)) saveCodes(data.complaintCodes);
    if (data.adviceCodes && Array.isArray(data.adviceCodes)) saveAdviceCodes(data.adviceCodes);
    if (data.medicines && Array.isArray(data.medicines)) localStorage.setItem(MEDICINES_KEY, JSON.stringify(data.medicines));
    if (data.purchaseBills && Array.isArray(data.purchaseBills)) localStorage.setItem(PURCHASE_BILLS_KEY, JSON.stringify(data.purchaseBills));
    if (data.medicineBills && Array.isArray(data.medicineBills)) localStorage.setItem(MEDICINE_BILLS_KEY, JSON.stringify(data.medicineBills));
    if (data.doctors && Array.isArray(data.doctors)) localStorage.setItem(DOCTORS_KEY, JSON.stringify(data.doctors));
    if (data.pharmacies && Array.isArray(data.pharmacies)) localStorage.setItem(PHARMACIES_KEY, JSON.stringify(data.pharmacies));
    if (data.expenses && Array.isArray(data.expenses)) localStorage.setItem(EXPENSES_KEY, JSON.stringify(data.expenses));
    if (data.idCounter) localStorage.setItem(COUNTER_KEY, String(data.idCounter));
    return { success: true, message: `Restored ${data.patients.length} patients, ${data.medicines?.length || 0} medicines, ${data.expenses?.length || 0} expenses.` };
  } catch { return { success: false, message: "Failed to parse backup file." }; }
}

// ═══════════════════════════════════════════════════════════════
// DOCTORS
// ═══════════════════════════════════════════════════════════════

const DEFAULT_DOCTORS: Doctor[] = [
  { id: 1, name: "Doctor 1", profitSharePct: 80 },
  { id: 2, name: "Doctor 2", profitSharePct: 20 },
];

export function getDoctors(): Doctor[] {
  try {
    const stored = localStorage.getItem(DOCTORS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_DOCTORS;
  } catch { return DEFAULT_DOCTORS; }
}

export function saveDoctors(doctors: Doctor[]) {
  localStorage.setItem(DOCTORS_KEY, JSON.stringify(doctors));
}

// Updates the doctor revenue-split settings (name + %) — validates the two percentages add up to 100.
export function updateDoctorSplit(doctor1: { name: string; profitSharePct: number }, doctor2: { name: string; profitSharePct: number }): { success: boolean; message?: string } {
  const total = doctor1.profitSharePct + doctor2.profitSharePct;
  if (Math.abs(total - 100) > 0.01) {
    return { success: false, message: `Percentages must add up to 100 (currently ${total}).` };
  }
  saveDoctors([
    { id: 1, name: doctor1.name.trim() || "Doctor 1", profitSharePct: doctor1.profitSharePct },
    { id: 2, name: doctor2.name.trim() || "Doctor 2", profitSharePct: doctor2.profitSharePct },
  ]);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
// LANDING COST CALCULATOR
// ═══════════════════════════════════════════════════════════════

export function calcLandingCost(params: {
  qtyPaid: number;
  qtyFree: number;
  ratePerUnit: number;
  discountPct: number;
  gstPct: number;
  mrp: number;
  packSize?: number;
}): {
  taxableAmount: number;
  gstAmount: number;
  totalPaid: number;
  totalQtyReceived: number;
  totalTabletsReceived: number;
  landingCostPerUnit: number;
  landingCostPerTablet: number;
  mrpPerTablet: number;
  profitPerUnit: number;
  profitPct: number;
  profitPerTablet: number;
} {
  const { qtyPaid, qtyFree, ratePerUnit, discountPct, gstPct, mrp, packSize = 1 } = params;
  const totalQtyReceived = qtyPaid + qtyFree;
  const totalTabletsReceived = totalQtyReceived * packSize;
  const grossAmt = qtyPaid * ratePerUnit;
  const discAmt = grossAmt * (discountPct / 100);
  const taxableAmount = grossAmt - discAmt;
  const gstAmount = taxableAmount * (gstPct / 100);
  const totalPaid = taxableAmount + gstAmount;
  const landingCostPerUnit = totalQtyReceived > 0 ? totalPaid / totalQtyReceived : 0;
  const landingCostPerTablet = packSize > 1 ? landingCostPerUnit / packSize : landingCostPerUnit;
  const mrpPerTablet = packSize > 1 ? mrp / packSize : mrp;
  const profitPerUnit = mrp - landingCostPerUnit;
  const profitPct = mrp > 0 ? (profitPerUnit / mrp) * 100 : 0;
  const profitPerTablet = mrpPerTablet - landingCostPerTablet;
  return {
    taxableAmount, gstAmount, totalPaid,
    totalQtyReceived, totalTabletsReceived,
    landingCostPerUnit, landingCostPerTablet,
    mrpPerTablet,
    profitPerUnit, profitPct, profitPerTablet
  };
}

// ═══════════════════════════════════════════════════════════════
// MEDICINES (Item Master)
// ═══════════════════════════════════════════════════════════════

// ALWAYS calculate per-tablet MRP from mrp/packSize - never trust stored value
export function getMrpPerTablet(med: MedicineItem): number {
  const ps = med.packSize || 1;
  return ps > 1 ? med.mrp / ps : med.mrp;
}

export function getLandingCostPerTablet(med: MedicineItem): number {
  const ps = med.packSize || 1;
  return ps > 1 ? med.landingCost / ps : med.landingCost;
}

export function getMedicines(): MedicineItem[] {
  try { return JSON.parse(localStorage.getItem(MEDICINES_KEY) || "[]"); }
  catch { return []; }
}

function saveMedicines(medicines: MedicineItem[]) {
  localStorage.setItem(MEDICINES_KEY, JSON.stringify(medicines));
}

export function addMedicine(data: Omit<MedicineItem, "id" | "createdAt">): MedicineItem {
  const medicines = getMedicines();
  const medicine: MedicineItem = { ...data, id: nextId(), createdAt: new Date().toISOString() };
  medicines.push(medicine);
  saveMedicines(medicines);
  return medicine;
}

export function updateMedicine(id: number, data: Partial<MedicineItem>): MedicineItem | null {
  const medicines = getMedicines();
  const idx = medicines.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  medicines[idx] = { ...medicines[idx], ...data };
  saveMedicines(medicines);
  return medicines[idx];
}

export function deleteMedicine(id: number): boolean {
  const medicines = getMedicines();
  const filtered = medicines.filter((m) => m.id !== id);
  saveMedicines(filtered);
  return filtered.length !== medicines.length;
}

export function searchMedicines(query: string): MedicineItem[] {
  if (!query || query.length < 1) return getMedicines();
  const q = query.toLowerCase();
  return getMedicines().filter(m => m.name.toLowerCase().includes(q));
}

// Stock status helpers
export function getStockStatus(medicine: MedicineItem): "out" | "low" | "ok" {
  if (medicine.currentStock <= 0) return "out";
  if (medicine.currentStock <= medicine.reorderLevel) return "low";
  return "ok";
}

export function getStockAlertCounts(): { out: number; low: number } {
  const medicines = getMedicines();
  return {
    out: medicines.filter(m => m.currentStock <= 0).length,
    low: medicines.filter(m => m.currentStock > 0 && m.currentStock <= m.reorderLevel).length,
  };
}

// ═══════════════════════════════════════════════════════════════
// PURCHASE BILLS
// ═══════════════════════════════════════════════════════════════

export function getPurchaseBills(): PurchaseBill[] {
  try {
    const raw: (PurchaseBill & { payments?: PurchaseBillPayment[] })[] = JSON.parse(localStorage.getItem(PURCHASE_BILLS_KEY) || "[]");
    // Backfill `payments` for bills saved before payment-tracking existed — best-effort assumes any already-paid
    // portion was paid on the bill's own date, so cash-basis reporting works without needing a re-import.
    return raw.map(b => {
      if (b.payments) return b as PurchaseBill;
      const paidAmount = Math.max(0, (b.grandTotal || 0) - (b.pendingAmount || 0));
      return { ...b, payments: paidAmount > 0 ? [{ date: b.billDate, amount: paidAmount }] : [] };
    });
  }
  catch { return []; }
}

function savePurchaseBills(bills: PurchaseBill[]) {
  localStorage.setItem(PURCHASE_BILLS_KEY, JSON.stringify(bills));
}

// Bill-level purchase entry — pharmacy, bill no., date, total, pending amount, optional notes.
// No item/medicine linkage — stock & expiry are managed manually on the Medicines tab.
export function addSimplePurchaseBill(data: {
  supplierName: string; billNo: string; billDate: string; grandTotal: number; pendingAmount: number; notes?: string;
}): PurchaseBill {
  const bills = getPurchaseBills();
  const paidNow = Math.max(0, data.grandTotal - data.pendingAmount);
  const bill: PurchaseBill = {
    id: nextId(),
    supplierName: data.supplierName,
    billNo: data.billNo,
    billDate: data.billDate,
    items: [],
    notes: data.notes,
    grandTotal: data.grandTotal,
    pendingAmount: Math.max(0, data.pendingAmount),
    payments: paidNow > 0 ? [{ date: data.billDate, amount: paidNow }] : [],
    createdAt: new Date().toISOString(),
  };
  bills.push(bill);
  savePurchaseBills(bills);
  return bill;
}

export function deletePurchaseBill(id: number): boolean {
  const bills = getPurchaseBills();
  const bill = bills.find(b => b.id === id);
  if (!bill) return false;

  // Reverse any stock this bill may have contributed (legacy/imported bills with items)
  const medicines = getMedicines();
  let touched = false;
  for (const item of bill.items) {
    const idx = medicines.findIndex(m => m.id === item.medicineId);
    if (idx !== -1) {
      medicines[idx].currentStock = Math.max(0, medicines[idx].currentStock - item.totalQtyReceived);
      touched = true;
    }
  }
  if (touched) saveMedicines(medicines);

  const filtered = bills.filter(b => b.id !== id);
  savePurchaseBills(filtered);
  return true;
}

// Records a cash-basis payment against a bill — reduces pending amount and logs when it was paid.
export function recordPurchaseBillPayment(id: number, amountPaidNow: number, paymentDate: string): PurchaseBill | null {
  const bills = getPurchaseBills();
  const idx = bills.findIndex(b => b.id === id);
  if (idx === -1) return null;
  const bill = bills[idx];
  const currentPending = bill.pendingAmount || 0;
  const amount = Math.min(Math.max(0, amountPaidNow), currentPending);
  if (amount <= 0) return bill;
  bills[idx] = {
    ...bill,
    pendingAmount: Math.max(0, currentPending - amount),
    payments: [...(bill.payments || []), { date: paymentDate, amount }],
  };
  savePurchaseBills(bills);
  return bills[idx];
}

export function markPurchaseBillPaid(id: number, paymentDate?: string): PurchaseBill | null {
  const bill = getPurchaseBills().find(b => b.id === id);
  if (!bill) return null;
  const pending = bill.pendingAmount || 0;
  if (pending <= 0) return bill;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return recordPurchaseBillPayment(id, pending, paymentDate || todayStr);
}

// Legacy alias kept so existing pendingAmount edits (e.g. from imports) still work.
export function updatePurchaseBillPayment(id: number, pendingAmount: number): PurchaseBill | null {
  const bills = getPurchaseBills();
  const idx = bills.findIndex(b => b.id === id);
  if (idx === -1) return null;
  bills[idx] = { ...bills[idx], pendingAmount: Math.max(0, pendingAmount) };
  savePurchaseBills(bills);
  return bills[idx];
}

export interface PharmacyPurchaseSummary {
  pharmacyName: string;
  billCount: number;
  totalPurchased: number;
  totalPending: number;
}

// Pharmacy-wise purchase tracking — total purchased & outstanding balance per pharmacy
export function getPharmacyPurchaseSummary(): PharmacyPurchaseSummary[] {
  const bills = getPurchaseBills();
  const map: Record<string, PharmacyPurchaseSummary> = {};
  for (const b of bills) {
    const key = b.supplierName.trim() || "Unknown";
    if (!map[key]) map[key] = { pharmacyName: key, billCount: 0, totalPurchased: 0, totalPending: 0 };
    map[key].billCount += 1;
    map[key].totalPurchased += b.grandTotal;
    map[key].totalPending += b.pendingAmount || 0;
  }
  return Object.values(map).sort((a, b) => b.totalPending - a.totalPending || b.totalPurchased - a.totalPurchased);
}

// Purchases grouped by bill date's month — "of what was billed this month, how much is paid/pending"
export function getPurchaseSummaryByMonth(year: number, month: number): { totalPurchased: number; totalPaid: number; totalPending: number; billCount: number } {
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const bills = getPurchaseBills().filter(b => b.billDate.startsWith(monthStr));
  const totalPurchased = bills.reduce((s, b) => s + b.grandTotal, 0);
  const totalPending = bills.reduce((s, b) => s + (b.pendingAmount || 0), 0);
  return { totalPurchased, totalPaid: totalPurchased - totalPending, totalPending, billCount: bills.length };
}

// Cash-basis: total actually PAID to pharmacies during a given calendar month, regardless of the bill's own month.
export function getPharmacyPaidAmountByMonth(year: number, month: number): number {
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  let total = 0;
  for (const bill of getPurchaseBills()) {
    for (const p of bill.payments || []) {
      if (p.date.startsWith(monthStr)) total += p.amount;
    }
  }
  return total;
}

// Adds any pharmacy/company name found in Purchase Bills that isn't already in the Pharmacy master list.
export function syncPharmaciesFromPurchases(): number {
  const existing = getPharmacies();
  const existingNames = new Set(existing.map(p => p.name.trim().toLowerCase()));
  const billNames = new Set<string>();
  for (const b of getPurchaseBills()) {
    const name = b.supplierName.trim();
    if (name) billNames.add(name);
  }
  let added = 0;
  const toAdd: Pharmacy[] = [];
  for (const name of billNames) {
    if (!existingNames.has(name.toLowerCase())) {
      toAdd.push({ id: nextId(), name, createdAt: new Date().toISOString() });
      existingNames.add(name.toLowerCase());
      added++;
    }
  }
  if (toAdd.length > 0) savePharmacies([...existing, ...toAdd]);
  return added;
}

// ═══════════════════════════════════════════════════════════════
// MEDICINE BILLS (Sales)
// ═══════════════════════════════════════════════════════════════

export function getMedicineBills(): MedicineBill[] {
  try { return JSON.parse(localStorage.getItem(MEDICINE_BILLS_KEY) || "[]"); }
  catch { return []; }
}

function saveMedicineBills(bills: MedicineBill[]) {
  localStorage.setItem(MEDICINE_BILLS_KEY, JSON.stringify(bills));
}

export function addMedicineBill(data: Omit<MedicineBill, "id" | "createdAt">): MedicineBill {
  const bills = getMedicineBills();
  const bill: MedicineBill = { ...data, id: nextId(), createdAt: new Date().toISOString() };
  bills.push(bill);
  saveMedicineBills(bills);

  // Deduct stock for each item
  const medicines = getMedicines();
  for (const item of data.items) {
    const idx = medicines.findIndex(m => m.id === item.medicineId);
    if (idx !== -1) {
      medicines[idx].currentStock = Math.max(0, medicines[idx].currentStock - item.qty);
    }
    addStockLedgerEntry({
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      type: "sale",
      qty: -item.qty,
      balanceAfter: medicines.find(m => m.id === item.medicineId)?.currentStock || 0,
      refId: bill.id,
      refNo: data.patientName,
      date: data.billDate,
    });
  }
  saveMedicines(medicines);
  return bill;
}

export function getMedicineBillsByDate(date: string): MedicineBill[] {
  return getMedicineBills().filter(b => b.billDate === date);
}

export function getMedicineBillsByMonth(year: number, month: number): MedicineBill[] {
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  return getMedicineBills().filter(b => b.billDate.startsWith(monthStr));
}

// ═══════════════════════════════════════════════════════════════
// DAILY PROFIT REPORT
// ═══════════════════════════════════════════════════════════════

export interface DoctorDailyStats {
  doctorId: 1 | 2;
  doctorName: string;
  patients: number;
  consultationFees: number;
  medicineSales: number;
  medicineCost: number;
  medicineProfit: number;
  total: number; // consultationFees + medicineProfit
}

export interface DailyProfitReport {
  date: string;
  totalPatients: number;
  totalConsultation: number;
  totalMedicineSales: number;
  totalMedicineCost: number;
  totalMedicineProfit: number;
  grandTotal: number;
  doctor1: DoctorDailyStats;
  doctor2: DoctorDailyStats;
  lowStockAlerts: { name: string; currentStock: number }[];
}

export function getDailyProfitReport(date: string, settings?: { doctor1Name: string; doctor2Name: string }): DailyProfitReport {
  const allPatients = getPatientsByDate(date);
  const allMedBills = getMedicineBillsByDate(date);

  const calcDoctor = (doctorId: 1 | 2, name: string): DoctorDailyStats => {
    const pts = allPatients.filter(p => (p as any).doctorId === doctorId || (!p.hasOwnProperty('doctorId') && doctorId === 1));
    // For medicine bills, filter by doctorId
    const bills = allMedBills.filter(b => b.doctorId === doctorId);
    const consultationFees = pts.reduce((s, p) => s + (p.fees || 0), 0);
    const medicineSales = bills.reduce((s, b) => s + b.totalSale, 0);
    const medicineCost = bills.reduce((s, b) => s + b.totalCost, 0);
    const medicineProfit = bills.reduce((s, b) => s + b.totalProfit, 0);
    return {
      doctorId, doctorName: name,
      patients: pts.length,
      consultationFees, medicineSales, medicineCost, medicineProfit,
      total: consultationFees + medicineProfit,
    };
  };

  const d1Name = settings?.doctor1Name || "Doctor 1";
  const d2Name = settings?.doctor2Name || "Doctor 2";
  const doctor1 = calcDoctor(1, d1Name);
  const doctor2 = calcDoctor(2, d2Name);

  const lowStockAlerts = getMedicines()
    .filter(m => m.currentStock > 0 && m.currentStock <= m.reorderLevel)
    .map(m => ({ name: m.name, currentStock: m.currentStock }));

  return {
    date,
    totalPatients: allPatients.length,
    totalConsultation: doctor1.consultationFees + doctor2.consultationFees,
    totalMedicineSales: doctor1.medicineSales + doctor2.medicineSales,
    totalMedicineCost: doctor1.medicineCost + doctor2.medicineCost,
    totalMedicineProfit: doctor1.medicineProfit + doctor2.medicineProfit,
    grandTotal: doctor1.total + doctor2.total,
    doctor1, doctor2, lowStockAlerts,
  };
}

// ═══════════════════════════════════════════════════════════════
// STOCK LEDGER
// ═══════════════════════════════════════════════════════════════

export function getStockLedger(): StockLedgerEntry[] {
  try { return JSON.parse(localStorage.getItem(STOCK_LEDGER_KEY) || "[]"); }
  catch { return []; }
}

export function getStockLedgerForMedicine(medicineId: number): StockLedgerEntry[] {
  return getStockLedger().filter(e => e.medicineId === medicineId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function addStockLedgerEntry(data: Omit<StockLedgerEntry, "id" | "createdAt">) {
  const ledger = getStockLedger();
  ledger.push({ ...data, id: nextId(), createdAt: new Date().toISOString() });
  localStorage.setItem(STOCK_LEDGER_KEY, JSON.stringify(ledger));
}

// ═══════════════════════════════════════════════════════════════
// STOCK VALUATION
// ═══════════════════════════════════════════════════════════════

export function getStockValuation(): { atCost: number; atMrp: number; potentialProfit: number } {
  const medicines = getMedicines();
  const atCost = medicines.reduce((s, m) => s + m.currentStock * getLandingCostPerTablet(m), 0);
  const atMrp = medicines.reduce((s, m) => s + m.currentStock * getMrpPerTablet(m), 0);
  return { atCost: Math.round(atCost), atMrp: Math.round(atMrp), potentialProfit: Math.round(atMrp - atCost) };
}

// ═══════════════════════════════════════════════════════════════
// FIFO BATCH LOOKUP
// ═══════════════════════════════════════════════════════════════

export interface FifoBatch {
  batchNo: string;
  expiryDate: string;
  mrp: number;
  availableQty: number;
  landingCost: number;
  purchaseBillId: number;
}

// Get oldest batch first for a medicine (FIFO)
export function getFifoBatches(medicineName: string): FifoBatch[] {
  const result: FifoBatch[] = [];
  const bills = getPurchaseBills().sort((a, b) => a.billDate.localeCompare(b.billDate));
  
  for (const bill of bills) {
    for (const item of bill.items) {
      if (item.medicineName.toLowerCase() === medicineName.toLowerCase()) {
        result.push({
          batchNo: item.batchNo,
          expiryDate: item.expiryDate,
          mrp: item.mrp,
          availableQty: item.totalQtyReceived,
          landingCost: item.landingCostPerUnit,
          purchaseBillId: bill.id,
        });
      }
    }
  }
  return result;
}

// Get medicine MRP from latest purchase bill
export function getMedicineMrpFromPurchase(medicineName: string): number {
  const bills = getPurchaseBills().sort((a, b) => b.billDate.localeCompare(a.billDate));
  for (const bill of bills) {
    for (const item of bill.items) {
      if (item.medicineName.toLowerCase() === medicineName.toLowerCase()) {
        return item.mrp;
      }
    }
  }
  return 0;
}

// Get all unique medicine names from purchase bills (for autocomplete)
export function getMedicineNamesFromPurchases(): string[] {
  const names = new Set<string>();
  for (const bill of getPurchaseBills()) {
    for (const item of bill.items) {
      names.add(item.medicineName);
    }
  }
  return Array.from(names).sort();
}

// Check stock for a list of medicines before saving patient
export interface StockCheckResult {
  ok: boolean;
  errors: { medicineName: string; required: number; available: number }[];
}

export function checkMedicineStock(items: { medicineName: string; qty: number }[]): StockCheckResult {
  const errors: { medicineName: string; required: number; available: number }[] = [];
  const medicines = getMedicines();
  
  for (const item of items) {
    const med = medicines.find(m => m.name.toLowerCase() === item.medicineName.toLowerCase());
    const available = med?.currentStock || 0;
    if (available < item.qty) {
      errors.push({ medicineName: item.medicineName, required: item.qty, available });
    }
  }
  return { ok: errors.length === 0, errors };
}

// Deduct stock for medicines when patient bill is saved
export function deductMedicineStock(items: { medicineName: string; qty: number; mrp: number; landingCost: number }[], patientName: string, date: string) {
  const medicines = getMedicines();
  
  for (const item of items) {
    let med = medicines.find(m => m.name.toLowerCase() === item.medicineName.toLowerCase());
    
    // Auto-create medicine if not exists
    if (!med) {
      const newMed: MedicineItem = {
        id: nextId(),
        name: item.medicineName,
        mrp: item.mrp,
        mrpPerTablet: item.mrp,
        packSize: 1,
        reorderLevel: 5,
        currentStock: 0,
        landingCost: item.landingCost, // stored as per-pack
        createdAt: new Date().toISOString(),
      };
      medicines.push(newMed);
      med = newMed;
    }
    
    const prevStock = med.currentStock;
    med.currentStock = Math.max(0, med.currentStock - item.qty);
    
    // Add ledger entry
    const ledger = getStockLedger();
    ledger.push({
      id: nextId(),
      medicineId: med.id,
      medicineName: item.medicineName,
      type: "sale",
      qty: -item.qty,
      balanceAfter: med.currentStock,
      refNo: patientName,
      date,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(STOCK_LEDGER_KEY, JSON.stringify(ledger));
  }
  
  saveMedicines(medicines);
}


// ═══════════════════════════════════════════════════════════════
// EXPIRY TRACKING (per purchase bill item)
// ═══════════════════════════════════════════════════════════════

export interface ExpiryItem {
  medicineId: number;
  batchIndex: number;
  medicineName: string;
  batchNo: string;
  expiryDate: string;   // "MM/YY"
  qty: number;
  status: "expired" | "expiring-soon" | "expiring" | "good";
  daysToExpiry: number;
}

// Manually-tracked expiry list — sourced from each medicine's `batches[]`, entered directly on the Medicines tab.
// Independent of Purchase Entry (which is bill-level only and doesn't carry item/expiry data).
export function getExpiryList(): ExpiryItem[] {
  const today = new Date();
  const items: ExpiryItem[] = [];
  for (const med of getMedicines()) {
    (med.batches || []).forEach((batch, batchIndex) => {
      if (!batch.expiryDate) return;
      const parts = batch.expiryDate.split("/");
      if (parts.length !== 2) return;
      const month = parseInt(parts[0]) - 1;
      const year = parseInt(parts[1]) < 100 ? 2000 + parseInt(parts[1]) : parseInt(parts[1]);
      const expiry = new Date(year, month + 1, 0); // last day of expiry month
      const diffMs = expiry.getTime() - today.getTime();
      const daysToExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      let status: ExpiryItem["status"] = "good";
      if (daysToExpiry < 0) status = "expired";
      else if (daysToExpiry <= 30) status = "expiring-soon";
      else if (daysToExpiry <= 60) status = "expiring";
      items.push({
        medicineId: med.id,
        batchIndex,
        medicineName: med.name,
        batchNo: batch.batchNo || "-",
        expiryDate: batch.expiryDate,
        qty: batch.qty,
        status,
        daysToExpiry,
      });
    });
  }
  return items.sort((a, b) => a.daysToExpiry - b.daysToExpiry);
}

export function addMedicineBatch(medicineId: number, batch: MedicineBatch): boolean {
  const medicines = getMedicines();
  const idx = medicines.findIndex(m => m.id === medicineId);
  if (idx === -1) return false;
  medicines[idx].batches = [...(medicines[idx].batches || []), batch];
  saveMedicines(medicines);
  return true;
}

export function deleteMedicineBatch(medicineId: number, batchIndex: number): boolean {
  const medicines = getMedicines();
  const idx = medicines.findIndex(m => m.id === medicineId);
  if (idx === -1) return false;
  medicines[idx].batches = (medicines[idx].batches || []).filter((_, i) => i !== batchIndex);
  saveMedicines(medicines);
  return true;
}

// ═══════════════════════════════════════════════════════════════
// WHATSAPP REPORT GENERATOR
// ═══════════════════════════════════════════════════════════════

export function generateWhatsAppReport(date: string, clinicName = "Clinic", settings?: { doctor1Name: string; doctor2Name: string }): string {
  const report = getDailyProfitReport(date, settings);
  const d = new Date(date + "T00:00:00");
  const displayDate = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  let text = `🏥 *${clinicName} — Daily Report*\n`;
  text += `📅 ${displayDate}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Doctor 1
  text += `👨‍⚕️ *${report.doctor1.doctorName}*\n`;
  text += `   Patients: ${report.doctor1.patients}\n`;
  text += `   Consultation: ${fmt(report.doctor1.consultationFees)}\n`;
  text += `   Med Sales: ${fmt(report.doctor1.medicineSales)}\n`;
  text += `   Med Cost: ${fmt(report.doctor1.medicineCost)}\n`;
  text += `   Med Profit: ${fmt(report.doctor1.medicineProfit)}\n`;
  text += `   *Total: ${fmt(report.doctor1.total)}*\n\n`;

  // Doctor 2
  text += `👨‍⚕️ *${report.doctor2.doctorName}*\n`;
  text += `   Patients: ${report.doctor2.patients}\n`;
  text += `   Consultation: ${fmt(report.doctor2.consultationFees)}\n`;
  text += `   Med Sales: ${fmt(report.doctor2.medicineSales)}\n`;
  text += `   Med Cost: ${fmt(report.doctor2.medicineCost)}\n`;
  text += `   Med Profit: ${fmt(report.doctor2.medicineProfit)}\n`;
  text += `   *Total: ${fmt(report.doctor2.total)}*\n\n`;

  // Clinic total
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🏥 *CLINIC TOTAL*\n`;
  text += `   Total Patients: ${report.totalPatients}\n`;
  text += `   Total Collection: ${fmt(report.totalConsultation)}\n`;
  text += `   Total Med Profit: ${fmt(report.totalMedicineProfit)}\n`;
  text += `   *Grand Total: ${fmt(report.grandTotal)}*\n`;

  if (report.lowStockAlerts.length > 0) {
    text += `\n⚠️ *LOW STOCK:*\n`;
    for (const a of report.lowStockAlerts) {
      text += `• ${a.name} — ${a.currentStock} units\n`;
    }
  }

  return text;
}

// ═══════════════════════════════════════════════════════════════
// DATA MIGRATION — run once on app start
// ═══════════════════════════════════════════════════════════════

export function runMigrations() {
  const medicines = getMedicines();
  if (medicines.length === 0) return;

  const bills = getPurchaseBills();
  // Always recalculate mrpPerTablet and landingCost from latest purchase bill
  for (const med of medicines) {
    for (let i = bills.length - 1; i >= 0; i--) {
      const item = bills[i].items.find(it =>
        it.medicineName.toLowerCase() === med.name.toLowerCase()
      );
      if (item) {
        const packSize = item.packSize || 1;
        med.packSize = packSize;
        med.mrp = item.mrp; // MRP per pack
        med.mrpPerTablet = packSize > 1 ? Math.round((item.mrp / packSize) * 100) / 100 : item.mrp;
        med.landingCost = item.landingCostPerTablet
          ? item.landingCostPerTablet
          : (packSize > 1 ? item.landingCostPerUnit / packSize : item.landingCostPerUnit);
        break;
      }
    }
    if (!med.packSize || med.packSize < 1) med.packSize = 1;
    if (!med.mrpPerTablet || med.mrpPerTablet <= 0) med.mrpPerTablet = med.mrp;
  }
  saveMedicines(medicines);
}

export function restoreStockForPatient(patientId: number) {
  const medBills = getMedicineBills().filter(b => b.patientId === patientId);
  if (medBills.length === 0) return;
  const medicines = getMedicines();
  for (const bill of medBills) {
    for (const item of bill.items) {
      const idx = medicines.findIndex(m => m.name.toLowerCase() === item.medicineName.toLowerCase() || m.id === item.medicineId);
      if (idx !== -1) medicines[idx].currentStock += item.qty;
    }
  }
  saveMedicines(medicines);
  const remaining = getMedicineBills().filter(b => b.patientId !== patientId);
  localStorage.setItem(MEDICINE_BILLS_KEY, JSON.stringify(remaining));
}

// ═══════════════════════════════════════════════════════════════
// PHARMACY / SUPPLIER MASTER
// ═══════════════════════════════════════════════════════════════

export interface Pharmacy {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  gstNo?: string;
  address?: string;
  createdAt: string;
}

const PHARMACIES_KEY = "cp_pharmacies";

export function getPharmacies(): Pharmacy[] {
  try { return JSON.parse(localStorage.getItem(PHARMACIES_KEY) || "[]"); }
  catch { return []; }
}

function savePharmacies(pharmacies: Pharmacy[]) {
  localStorage.setItem(PHARMACIES_KEY, JSON.stringify(pharmacies));
}

export function addPharmacy(data: Omit<Pharmacy, "id" | "createdAt">): Pharmacy {
  const pharmacies = getPharmacies();
  const pharmacy: Pharmacy = { ...data, id: nextId(), createdAt: new Date().toISOString() };
  pharmacies.push(pharmacy);
  savePharmacies(pharmacies);
  return pharmacy;
}

export function updatePharmacy(id: number, data: Partial<Pharmacy>): Pharmacy | null {
  const pharmacies = getPharmacies();
  const idx = pharmacies.findIndex(p => p.id === id);
  if (idx === -1) return null;
  pharmacies[idx] = { ...pharmacies[idx], ...data };
  savePharmacies(pharmacies);
  return pharmacies[idx];
}

export function deletePharmacy(id: number): boolean {
  const pharmacies = getPharmacies();
  const filtered = pharmacies.filter(p => p.id !== id);
  savePharmacies(filtered);
  return filtered.length !== pharmacies.length;
}

// Last purchase info for a medicine — powers the "repeat buy" 1-click reorder
export interface LastPurchaseInfo {
  pharmacyName: string;
  billDate: string;
  ratePerUnit: number;
  packSize: number;
  mrp: number;
  gstPct: number;
  discountPct: number;
}

export function getLastPurchaseInfo(medicineName: string): LastPurchaseInfo | null {
  const bills = getPurchaseBills().sort((a, b) => b.billDate.localeCompare(a.billDate));
  for (const bill of bills) {
    const item = bill.items.find(it => it.medicineName.toLowerCase() === medicineName.trim().toLowerCase());
    if (item) {
      return {
        pharmacyName: bill.supplierName,
        billDate: bill.billDate,
        ratePerUnit: item.ratePerUnit,
        packSize: item.packSize,
        mrp: item.mrp,
        gstPct: item.gstPct,
        discountPct: item.discountPct,
      };
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════════════

export type ExpenseCategory =
  | "Rent" | "Staff Salary" | "Electricity" | "Stock Purchase"
  | "Equipment" | "Maintenance" | "Marketing" | "Misc";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Rent", "Staff Salary", "Electricity", "Stock Purchase",
  "Equipment", "Maintenance", "Marketing", "Misc",
];

export interface Expense {
  id: number;
  date: string;            // "YYYY-MM-DD"
  category: ExpenseCategory | string;
  amount: number;
  paymentMode: "cash" | "online";
  note?: string;
  createdAt: string;
}

const EXPENSES_KEY = "cp_expenses";

export function getExpenses(): Expense[] {
  try { return JSON.parse(localStorage.getItem(EXPENSES_KEY) || "[]"); }
  catch { return []; }
}

function saveExpenses(expenses: Expense[]) {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export function addExpense(data: Omit<Expense, "id" | "createdAt">): Expense {
  const expenses = getExpenses();
  const expense: Expense = { ...data, id: nextId(), createdAt: new Date().toISOString() };
  expenses.push(expense);
  saveExpenses(expenses);
  return expense;
}

export function updateExpense(id: number, data: Partial<Expense>): Expense | null {
  const expenses = getExpenses();
  const idx = expenses.findIndex(e => e.id === id);
  if (idx === -1) return null;
  expenses[idx] = { ...expenses[idx], ...data };
  saveExpenses(expenses);
  return expenses[idx];
}

export function deleteExpense(id: number): boolean {
  const expenses = getExpenses();
  const filtered = expenses.filter(e => e.id !== id);
  saveExpenses(filtered);
  return filtered.length !== expenses.length;
}

export function getExpensesByDate(date: string): Expense[] {
  return getExpenses().filter(e => e.date === date).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getExpensesByMonth(year: number, month: number): Expense[] {
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  return getExpenses().filter(e => e.date.startsWith(monthStr)).sort((a, b) => b.date.localeCompare(a.date));
}

export function getExpenseCategoryBreakdown(year: number, month: number): { category: string; total: number }[] {
  const expenses = getExpensesByMonth(year, month);
  const map: Record<string, number> = {};
  for (const e of expenses) {
    map[e.category] = (map[e.category] || 0) + e.amount;
  }
  return Object.entries(map).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total);
}

// ═══════════════════════════════════════════════════════════════
// IMPORT HISTORICAL BILLS (CSV, from old billing software)
// ═══════════════════════════════════════════════════════════════
// Expected columns (header row, any case/order not required to match — matched by name):
// Bill ID, Company, Bill Number, Bill Date (dd/mm/yyyy), Amount (INR), Status (paid/unpaid), Paid Date, Paid Via, Notes
// Rows where Company = "CLINIC EXPENSES" are routed to the Expenses log instead of Purchase Bills.
// Imported purchase bills carry the total & payment status only (no per-medicine stock impact) —
// this is historical bookkeeping so pharmacy totals & pending dues aren't lost, without touching current stock.

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { result.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  result.push(cur);
  return result;
}

function parseDDMMYYYY(s: string): string {
  const parts = s.trim().split("/");
  if (parts.length !== 3) return "";
  const [dd, mm, yyyy] = parts;
  if (!dd || !mm || !yyyy) return "";
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

export interface ImportBillsResult {
  billsAdded: number;
  expensesAdded: number;
  skipped: number;
  errors: string[];
}

export function importPharmaBillsCsv(csvText: string): ImportBillsResult {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return { billsAdded: 0, expensesAdded: 0, skipped: 0, errors: ["File appears to be empty."] };

  const header = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
  const findCol = (...names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i !== -1) return i;
    }
    return -1;
  };
  const iCompany = findCol("company");
  const iBillNo = findCol("bill number", "bill no", "billno");
  const iDate = findCol("bill date", "date");
  const iAmount = findCol("amount (inr)", "amount");
  const iStatus = findCol("status");
  const iPaidDate = findCol("paid date");
  const iPaidVia = findCol("paid via", "payment mode");
  const iNotes = findCol("notes", "note");

  if (iCompany === -1 || iAmount === -1 || iDate === -1) {
    return { billsAdded: 0, expensesAdded: 0, skipped: 0, errors: ["Couldn't find Company / Bill Date / Amount columns in the file header."] };
  }

  const existingBills = getPurchaseBills();
  const existingExpenses = getExpenses();
  const newBills: PurchaseBill[] = [];
  const newExpenses: Expense[] = [];
  let skipped = 0;
  const errors: string[] = [];

  for (let li = 1; li < lines.length; li++) {
    const cols = parseCsvLine(lines[li]);
    const company = (cols[iCompany] || "").trim();
    const billNo = iBillNo !== -1 ? (cols[iBillNo] || "").trim() : "";
    const rawDate = (cols[iDate] || "").trim();
    const amount = parseFloat(cols[iAmount] || "0") || 0;
    const status = iStatus !== -1 ? (cols[iStatus] || "").trim().toLowerCase() : "paid";
    const rawPaidDate = iPaidDate !== -1 ? (cols[iPaidDate] || "").trim() : "";
    const paidVia = iPaidVia !== -1 ? (cols[iPaidVia] || "").trim().toLowerCase() : "";
    const notes = iNotes !== -1 ? (cols[iNotes] || "").trim() : "";

    if (!company || amount <= 0) { skipped++; continue; }
    const date = parseDDMMYYYY(rawDate);
    if (!date) { skipped++; errors.push(`Row ${li + 1}: couldn't read date "${rawDate}", skipped.`); continue; }

    if (company.toUpperCase() === "CLINIC EXPENSES") {
      const dup = existingExpenses.some(e => e.date === date && e.amount === amount && (e.note || "") === notes)
        || newExpenses.some(e => e.date === date && e.amount === amount && (e.note || "") === notes);
      if (dup) { skipped++; continue; }
      const category: ExpenseCategory = /salary/i.test(notes) ? "Staff Salary"
        : /rent/i.test(notes) ? "Rent"
        : /card|market/i.test(notes) ? "Marketing"
        : "Misc";
      newExpenses.push({
        id: nextId(), date, category, amount,
        paymentMode: paidVia.includes("cash") ? "cash" : "cash",
        note: notes || "Imported from old billing software",
        createdAt: new Date().toISOString(),
      });
    } else {
      const dup = existingBills.some(b => b.supplierName.toLowerCase() === company.toLowerCase() && b.billDate === date && b.grandTotal === amount && (b.billNo || "") === billNo)
        || newBills.some(b => b.supplierName.toLowerCase() === company.toLowerCase() && b.billDate === date && b.grandTotal === amount && (b.billNo || "") === billNo);
      if (dup) { skipped++; continue; }
      const isPaid = status === "paid";
      const pending = isPaid ? 0 : amount;
      const paidDate = parseDDMMYYYY(rawPaidDate) || date; // fall back to bill date if Paid Date missing
      newBills.push({
        id: nextId(),
        supplierName: company,
        billNo,
        billDate: date,
        items: [],
        notes: notes || undefined,
        grandTotal: amount,
        pendingAmount: pending,
        payments: isPaid ? [{ date: paidDate, amount }] : [],
        createdAt: new Date().toISOString(),
      });
    }
  }

  if (newBills.length > 0) savePurchaseBills([...existingBills, ...newBills]);
  if (newExpenses.length > 0) saveExpenses([...existingExpenses, ...newExpenses]);

  return { billsAdded: newBills.length, expensesAdded: newExpenses.length, skipped, errors };
}
