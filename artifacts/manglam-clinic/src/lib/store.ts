// Local storage-based data store — fully offline, no server needed

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
  advice?: string;
  reports?: string;
  fees: number;
  attachments?: string[];
  registerType?: "general" | "ayurvedic";
  visitDate: string;
  createdAt: string;
}

export interface ComplaintCode {
  id: number;
  code: string;
  complaint: string;
  treatment: string;
  createdAt: string;
}

const PATIENTS_KEY = "mc_patients";
const CODES_KEY = "mc_complaint_codes";
const COUNTER_KEY = "mc_id_counter";
const PATIENT_NO_COUNTER_KEY = "mc_patient_no_counter";

function nextId(): number {
  const val = parseInt(localStorage.getItem(COUNTER_KEY) || "0") + 1;
  localStorage.setItem(COUNTER_KEY, String(val));
  return val;
}

export function getNextPatientNo(visitDate: string): string {
  const dateKey = visitDate.replace(/-/g, "");
  const counterKey = `${PATIENT_NO_COUNTER_KEY}_${dateKey}`;
  const val = parseInt(localStorage.getItem(counterKey) || "0") + 1;
  localStorage.setItem(counterKey, String(val));
  return String(val).padStart(2, "0");
}

// Case number format: "00" + DD + MM + YY + 2-digit seq  e.g. 0019052601
export function getNextCaseNo(visitDate: string): string {
  const d = new Date(visitDate + "T00:00:00");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const dateKey = `${dd}${mm}${yy}`;
  const counterKey = `mc_case_no_${dateKey}`;
  const val = parseInt(localStorage.getItem(counterKey) || "0") + 1;
  localStorage.setItem(counterKey, String(val));
  return `00${dateKey}${String(val).padStart(2, "0")}`;
}

export function lookupByComplaint(query: string): Patient[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return getPatients()
    .filter(p =>
      (p.complaint || "").toLowerCase().includes(q) ||
      (p.complaintCode || "").toLowerCase().includes(q)
    )
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate));
}

export function lookupByAddress(query: string): Patient[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return getPatients()
    .filter(p => (p.address || "").toLowerCase().includes(q))
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate));
}

// Follow-up reminders: parse "F5", "F 7", "f10" from advice field of Ayurvedic patients
export interface FollowUpReminder {
  patient: Patient;
  followUpDate: string;
  daysOverdue: number; // negative = upcoming, 0 = today, positive = overdue
}

export function getFollowUpReminders(): FollowUpReminder[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const ayurvedicPatients = getPatients().filter(p => p.registerType === "ayurvedic");
  const seen = new Set<string>(); // dedupe by mobile+visitDate
  const reminders: FollowUpReminder[] = [];

  for (const p of ayurvedicPatients) {
    const advice = p.advice || "";
    const match = advice.match(/f\s*(\d+)/i);
    if (!match) continue;
    const days = parseInt(match[1]);
    if (!days || days <= 0) continue;
    const visitDate = new Date(p.visitDate + "T00:00:00");
    const followUp = new Date(visitDate);
    followUp.setDate(followUp.getDate() + days);
    const followUpStr = followUp.toISOString().slice(0, 10);
    // Only show if within 3 days upcoming OR overdue
    const diffMs = today.getTime() - followUp.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < -3) continue; // more than 3 days in future — skip
    const key = `${p.mobile}_${p.visitDate}`;
    if (seen.has(key)) continue;
    seen.add(key);
    reminders.push({ patient: p, followUpDate: followUpStr, daysOverdue: diffDays });
  }

  return reminders.sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
}

// ─── Patients ───────────────────────────────────────────────────────────────

export function getPatients(): Patient[] {
  try {
    return JSON.parse(localStorage.getItem(PATIENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePatients(patients: Patient[]) {
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
}

export function addPatient(data: Omit<Patient, "id" | "createdAt">): Patient {
  const patients = getPatients();
  const patient: Patient = {
    ...data,
    id: nextId(),
    createdAt: new Date().toISOString(),
  };
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
  return getPatients()
    .filter((p) => p.visitDate === date)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getAyurvedicPatientsByDate(date: string): Patient[] {
  return getPatients()
    .filter((p) => p.visitDate === date && p.registerType === "ayurvedic")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function lookupByMobile(mobile: string): { latestInfo?: Patient; history: Patient[] } {
  if (!mobile || mobile.length < 5) return { history: [] };
  const all = getPatients().filter((p) =>
    p.mobile.toLowerCase().includes(mobile.toLowerCase())
  );
  const sorted = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { latestInfo: sorted[0], history: sorted };
}

export function lookupByName(name: string): { latestInfo?: Patient; history: Patient[] } {
  if (!name || name.length < 2) return { history: [] };
  const all = getPatients().filter((p) =>
    p.name.toLowerCase().includes(name.toLowerCase())
  );
  const sorted = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { latestInfo: sorted[0], history: sorted };
}

export interface DailyStats {
  date: string;
  totalPatients: number;
  totalFees: number;
  patients: Patient[];
}

export function getDailyStats(date: string): DailyStats {
  const patients = getPatientsByDate(date);
  const totalFees = patients.reduce((sum, p) => sum + (p.fees || 0), 0);
  return { date, totalPatients: patients.length, totalFees, patients };
}

export function getAyurvedicDailyStats(date: string): DailyStats {
  const patients = getAyurvedicPatientsByDate(date);
  const totalFees = patients.reduce((sum, p) => sum + (p.fees || 0), 0);
  return { date, totalPatients: patients.length, totalFees, patients };
}

export function getAllDates(): { date: string; count: number; totalFees: number }[] {
  const patients = getPatients();
  const map: Record<string, { count: number; totalFees: number }> = {};
  for (const p of patients) {
    if (!map[p.visitDate]) map[p.visitDate] = { count: 0, totalFees: 0 };
    map[p.visitDate].count += 1;
    map[p.visitDate].totalFees += p.fees || 0;
  }
  return Object.entries(map)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getAllAyurvedicDates(): { date: string; count: number; totalFees: number }[] {
  const patients = getPatients().filter((p) => p.registerType === "ayurvedic");
  const map: Record<string, { count: number; totalFees: number }> = {};
  for (const p of patients) {
    if (!map[p.visitDate]) map[p.visitDate] = { count: 0, totalFees: 0 };
    map[p.visitDate].count += 1;
    map[p.visitDate].totalFees += p.fees || 0;
  }
  return Object.entries(map)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// Monthly stats
export function getMonthlyStats(year: number, month: number): {
  totalPatients: number;
  totalFees: number;
  generalPatients: number;
  ayurvedicPatients: number;
  generalFees: number;
  ayurvedicFees: number;
  dailyBreakdown: { date: string; count: number; totalFees: number; generalFees: number; ayurvedicFees: number }[];
} {
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
    if (p.registerType === "ayurvedic") {
      dayMap[p.visitDate].ayurvedicFees += p.fees || 0;
    } else {
      dayMap[p.visitDate].generalFees += p.fees || 0;
    }
  }
  const dailyBreakdown = Object.entries(dayMap)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { totalPatients: patients.length, totalFees, generalPatients, ayurvedicPatients, generalFees, ayurvedicFees, dailyBreakdown };
}

// ─── Backup / Restore ───────────────────────────────────────────────────────

export function exportBackup(): string {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    patients: getPatients(),
    complaintCodes: getComplaintCodes(),
    idCounter: parseInt(localStorage.getItem(COUNTER_KEY) || "0"),
  };
  return JSON.stringify(data, null, 2);
}

export function importBackup(jsonStr: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.patients || !Array.isArray(data.patients)) {
      return { success: false, message: "Invalid backup file format." };
    }
    savePatients(data.patients);
    if (data.complaintCodes && Array.isArray(data.complaintCodes)) {
      saveCodes(data.complaintCodes);
    }
    if (data.idCounter) {
      localStorage.setItem(COUNTER_KEY, String(data.idCounter));
    }
    return { success: true, message: `Restored ${data.patients.length} patients and ${data.complaintCodes?.length || 0} complaint codes.` };
  } catch {
    return { success: false, message: "Failed to parse backup file. Make sure it is a valid JSON backup." };
  }
}

// ─── Complaint Codes ────────────────────────────────────────────────────────

export function getComplaintCodes(): ComplaintCode[] {
  try {
    return JSON.parse(localStorage.getItem(CODES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCodes(codes: ComplaintCode[]) {
  localStorage.setItem(CODES_KEY, JSON.stringify(codes));
}

export function addComplaintCode(data: Omit<ComplaintCode, "id" | "createdAt">): ComplaintCode {
  const codes = getComplaintCodes();
  const code: ComplaintCode = {
    ...data,
    code: data.code.toUpperCase(),
    id: nextId(),
    createdAt: new Date().toISOString(),
  };
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
    if (!Array.isArray(data)) {
      return { success: false, message: "Invalid format. Expected an array of codes." };
    }
    const existing = getComplaintCodes();
    let added = 0;
    let counter = parseInt(localStorage.getItem(COUNTER_KEY) || "0");
    for (const item of data) {
      if (!item.code || !item.complaint || !item.treatment) continue;
      const exists = existing.find((c) => c.code === item.code.toUpperCase());
      if (!exists) {
        counter++;
        existing.push({
          id: counter,
          code: item.code.toUpperCase(),
          complaint: item.complaint,
          treatment: item.treatment,
          createdAt: item.createdAt || new Date().toISOString(),
        });
        added++;
      }
    }
    saveCodes(existing);
    localStorage.setItem(COUNTER_KEY, String(counter));
    return { success: true, message: `Imported ${added} new codes (duplicates skipped).` };
  } catch {
    return { success: false, message: "Failed to parse codes file." };
  }
}
