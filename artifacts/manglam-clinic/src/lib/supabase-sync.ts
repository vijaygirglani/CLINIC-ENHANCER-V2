// ── Supabase Cloud Sync for Manglam Clinic ──────────────────────────────────
// Handles push / pull / merge of patient records between devices

const SUPABASE_URL = "https://pqyctvkczrawkrxnniva.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxeWN0dmtjenJhd2tyeG5uaXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NzA4MjMsImV4cCI6MjA5NjE0NjgyM30.1mcG_KxdatnaNfGGJo6fzP2749QSi7_N7zB3efA8j6w";

const HEADERS = {
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  Prefer: "resolution=merge-duplicates",
};

export interface CloudPatient {
  id: string;           // composite: mobile_visitDate_patientNo
  name: string;
  mobile: string;
  address: string;
  age: number;
  age_months: number;
  weight: string;
  complaint_code: string;
  complaint: string;
  treatment: string;
  advice: string;
  reports: string;
  fees: number;
  payment_mode: string;
  patient_no: number;
  register_type: string;
  visit_date: string;
  updated_at: string;
  device: string;
}

// Convert local Patient → CloudPatient
export function toCloud(p: any, device: string): CloudPatient {
  return {
    id: `${p.mobile}_${p.visitDate}_${p.patientNo}`,
    name: p.name,
    mobile: p.mobile,
    address: p.address || "",
    age: p.age || 0,
    age_months: p.ageMonths || 0,
    weight: p.weight || "",
    complaint_code: p.complaintCode || "",
    complaint: p.complaint || "",
    treatment: p.treatment || "",
    advice: p.advice || "",
    reports: p.reports || "",
    fees: p.fees || 0,
    payment_mode: p.paymentMode || "cash",
    patient_no: p.patientNo || 0,
    register_type: p.registerType || "general",
    visit_date: p.visitDate || "",
    updated_at: new Date().toISOString(),
    device,
  };
}

// Convert CloudPatient → local Patient shape
export function fromCloud(c: CloudPatient): any {
  return {
    id: parseInt(c.mobile.replace(/\D/g, "").slice(-6) + c.patient_no) || Date.now(),
    name: c.name,
    mobile: c.mobile,
    address: c.address,
    age: c.age,
    ageMonths: c.age_months,
    weight: c.weight,
    complaintCode: c.complaint_code,
    complaint: c.complaint,
    treatment: c.treatment,
    advice: c.advice,
    reports: c.reports,
    fees: c.fees,
    paymentMode: c.payment_mode,
    patientNo: c.patient_no,
    registerType: c.register_type,
    visitDate: c.visit_date,
    attachments: [],
  };
}

// ── Push all local patients to Supabase (upsert) ─────────────────────────────
export async function pushToCloud(localPatients: any[]): Promise<{ pushed: number }> {
  const device = getDeviceLabel();
  const rows = localPatients.map(p => toCloud(p, device));

  // Upsert in batches of 100
  const BATCH = 100;
  let pushed = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/patients`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase push failed: ${err}`);
    }
    pushed += batch.length;
  }
  return { pushed };
}

// ── Pull all patients from Supabase ──────────────────────────────────────────
export async function pullFromCloud(): Promise<CloudPatient[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/patients?select=*&order=visit_date.desc`,
    { headers: { ...HEADERS, Prefer: "return=representation" } }
  );
  if (!res.ok) throw new Error(`Supabase pull failed: ${await res.text()}`);
  return res.json();
}

// ── Get last sync time from localStorage ─────────────────────────────────────
const LAST_SYNC_KEY = "manglam_last_sync";
export function getLastSync(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}
export function setLastSync() {
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
}

// ── Pull only records newer than last sync ────────────────────────────────────
export async function pullNewSince(since: string): Promise<CloudPatient[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/patients?select=*&updated_at=gt.${encodeURIComponent(since)}&order=visit_date.desc`,
    { headers: { ...HEADERS, Prefer: "return=representation" } }
  );
  if (!res.ok) throw new Error(`Supabase pull failed: ${await res.text()}`);
  return res.json();
}

// ── Device label (PC vs Mobile) ───────────────────────────────────────────────
export function getDeviceLabel(): string {
  const ua = navigator.userAgent;
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  return isMobile ? "mobile" : "pc";
}

// ── Count records in cloud ────────────────────────────────────────────────────
export async function getCloudCount(): Promise<number> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/patients?select=id`, {
    headers: { ...HEADERS, Prefer: "count=exact", "Range-Unit": "items", Range: "0-0" },
  });
  const count = res.headers.get("Content-Range");
  if (count) {
    const total = count.split("/")[1];
    if (total && total !== "*") return parseInt(total);
  }
  // Fallback: just return array length
  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}
