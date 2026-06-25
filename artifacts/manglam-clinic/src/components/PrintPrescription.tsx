import { useEffect, useRef } from "react";

// ── Clinic settings (mirrors Home.tsx) ───────────────────────────────────────
const CLINIC_SETTINGS_KEY = "manglam_clinic_settings";
interface ClinicSettings {
  clinicName: string;
  doctorName: string;
  qualification: string;
  tagline: string;
  address: string;
  phone: string;
  mapsUrl: string;
  footerCity: string;
  logoLetter: string;
}
const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  clinicName:    "Manglam Clinic",
  doctorName:    "Dr. Vijay Girglani",
  qualification: "B.A.M.S., C.C.H., C.S.D.",
  tagline:       "AYURVEDIC & SKIN SPECIALIST",
  address:       "Opp. Krishna Hotel, Pipaliya Char Rasta",
  phone:         "9638181875",
  mapsUrl:       "",
  footerCity:    "Morbi, Gujarat",
  logoLetter:    "M",
};
function getClinicSettings(): ClinicSettings {
  try {
    const stored = JSON.parse(
      localStorage.getItem("manglam_clinic_settings_for_print") ||
      localStorage.getItem(CLINIC_SETTINGS_KEY) ||
      "{}"
    );
    return { ...DEFAULT_CLINIC_SETTINGS, ...stored };
  } catch {
    return DEFAULT_CLINIC_SETTINGS;
  }
}

// ── Patient type (subset used for printing) ───────────────────────────────────
interface Patient {
  id?: number;
  name: string;
  mobile: string;
  age?: number;
  ageMonths?: number;
  weight?: string;
  address?: string;
  complaint?: string;
  treatment?: string;
  advice?: string;
  reports?: string;
  visitDate?: string;
  patientNo?: number;
}

// ── A5 prescription HTML generator ───────────────────────────────────────────
function buildPrescriptionHTML(patient: Patient): string {
  const cs = getClinicSettings();

  const visitDate = patient.visitDate
    ? patient.visitDate.split("-").reverse().join(" / ")
    : new Date().toLocaleDateString("en-IN").replace(/\//g, " / ");

  const ageStr = [
    patient.age ? `${patient.age}y` : "",
    patient.ageMonths ? `${patient.ageMonths}m` : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Split multi-line treatment into numbered lines (split by newline or comma)
  const medLines: string[] = patient.treatment
    ? patient.treatment
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [];
  // Ensure at least 7 blank lines for medicines
  while (medLines.length < 7) medLines.push("");

  const adviceLines: string[] = patient.advice
    ? patient.advice
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [];
  while (adviceLines.length < 4) adviceLines.push("");

  const reportLines: string[] = patient.reports
    ? patient.reports
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [];
  while (reportLines.length < 3) reportLines.push("");

  const medRowsHTML = medLines
    .map(
      (med, i) => `
      <div class="med-row">
        <span class="med-num">${i + 1}.</span>
        <div class="field-line">${med}</div>
      </div>`
    )
    .join("");

  const adviceRowsHTML = adviceLines
    .map(
      (a) => `<div class="field-line advice-line">${a}</div>`
    )
    .join("");

  const reportRowsHTML = reportLines
    .map(
      (r) => `<div class="field-line advice-line">${r}</div>`
    )
    .join("");

  const complaintLines = patient.complaint
    ? patient.complaint.split(/\n/).map((l) => l.trim()).filter(Boolean)
    : [""];
  while (complaintLines.length < 2) complaintLines.push("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Prescription – ${patient.name}</title>
<style>
  /* ── Reset ── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── A5: 148mm × 210mm ── */
  @page {
    size: A5 portrait;
    margin: 0;
  }

  html, body {
    width: 148mm;
    height: 210mm;
    font-family: 'Segoe UI', Arial, sans-serif;
    background: #fff;
    color: #111;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .page {
    width: 148mm;
    height: 210mm;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #fff;
  }

  /* ── Header ── */
  .header {
    background: #1a3a2e;
    padding: 10px 16px 9px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .header-left { display: flex; align-items: center; gap: 8px; }

  .logo-mark {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 700; color: #fff;
    flex-shrink: 0;
  }

  .clinic-name {
    font-size: 18px; font-weight: 700; color: #fff;
    letter-spacing: -0.3px; line-height: 1;
  }

  .clinic-tagline {
    font-size: 7px; color: #9fcfb8;
    letter-spacing: 0.9px; text-transform: uppercase; margin-top: 2px;
  }

  .doctor-info { text-align: right; }
  .doctor-name { font-size: 11px; font-weight: 700; color: #fff; }
  .doctor-deg  { font-size: 7.5px; color: #9fcfb8; margin-top: 1px; line-height: 1.5; }

  /* ── Accent bar ── */
  .accent-bar {
    height: 2.5px;
    background: linear-gradient(90deg, #2d6a4f 0%, #52b788 50%, #d4a017 100%);
    flex-shrink: 0;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  /* ── Body content ── */
  .content {
    flex: 1;
    padding: 9px 16px 7px;
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow: hidden;
  }

  /* ── Common row ── */
  .row {
    display: flex;
    align-items: flex-end;
    gap: 5px;
    margin-bottom: 8px;
  }

  .bullet {
    font-size: 10px; font-weight: 700; color: #2d6a4f;
    padding-bottom: 2px; min-width: 10px; flex-shrink: 0;
  }

  .lbl {
    font-size: 9.5px; font-weight: 500; color: #333;
    white-space: nowrap; padding-bottom: 2px; flex-shrink: 0;
  }

  .field-line {
    flex: 1;
    border-bottom: 0.8px solid #1a3a2e;
    min-height: 17px;
    font-size: 10px;
    color: #111;
    font-weight: 500;
    padding-bottom: 1px;
    line-height: 1.4;
  }

  .field-fixed {
    border-bottom: 0.8px solid #1a3a2e;
    min-height: 17px;
    font-size: 10px;
    color: #111;
    font-weight: 500;
    padding-bottom: 1px;
  }

  /* ── Date row ── */
  .date-row {
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    gap: 5px;
    margin-bottom: 10px;
  }

  /* ── Rx section ── */
  .rx-header-row {
    display: flex;
    align-items: flex-end;
    gap: 5px;
    margin-bottom: 7px;
  }

  .rx-symbol {
    font-size: 20px; font-weight: 700; color: #2d6a4f;
    line-height: 1; padding-bottom: 1px;
  }

  .med-row {
    display: flex;
    align-items: flex-end;
    gap: 5px;
    margin-bottom: 9px;
    padding-left: 14px;
  }

  .med-num {
    font-size: 9px; font-weight: 700; color: #2d6a4f;
    min-width: 13px; padding-bottom: 2px; flex-shrink: 0;
  }

  /* ── Bottom two columns ── */
  .bottom-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 2px;
    flex: 1;
  }

  .col-header {
    display: flex;
    align-items: flex-end;
    gap: 5px;
    margin-bottom: 7px;
  }

  .col-title {
    font-size: 9.5px; font-weight: 600; color: #333;
    padding-bottom: 2px; white-space: nowrap;
  }

  .col-title-line {
    flex: 1;
    border-bottom: 0.8px solid #1a3a2e;
    height: 1px;
    margin-bottom: 3px;
  }

  .advice-line {
    flex: unset;
    width: 100%;
    padding-left: 14px;
    margin-bottom: 9px;
  }

  /* ── Signature ── */
  .sig-area {
    margin-top: 6px;
    text-align: right;
  }
  .sig-line {
    display: inline-block;
    width: 88px;
    border-bottom: 0.8px solid #1a3a2e;
    height: 20px;
  }
  .sig-label {
    font-size: 7px; color: #888; text-align: right; margin-top: 2px;
  }

  /* ── Footer ── */
  .footer {
    border-top: 0.5px solid #d0e8dd;
    padding: 5px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8faf9;
    flex-shrink: 0;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .footer-address {
    font-size: 7px; color: #777; line-height: 1.6;
  }

  .footer-address strong { color: #1a3a2e; font-size: 8px; }

  .next-visit-label {
    font-size: 7.5px; color: #2d6a4f; font-weight: 600; margin-bottom: 2px; text-align: right;
  }
  .next-visit-line {
    border-bottom: 0.8px solid #1a3a2e; min-width: 70px; height: 16px;
  }

  .not-valid {
    text-align: center; font-size: 6.5px; color: #bbb;
    letter-spacing: 0.3px; padding: 3px 0;
    border-top: 0.4px solid #eee;
    flex-shrink: 0;
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <div class="logo-mark">${cs.logoLetter || "M"}</div>
      <div>
        <div class="clinic-name">${cs.clinicName}</div>
        <div class="clinic-tagline">${cs.tagline}</div>
      </div>
    </div>
    <div class="doctor-info">
      <div class="doctor-name">${cs.doctorName}</div>
      <div class="doctor-deg">${cs.qualification}<br>Reg. No. GBI 17318</div>
    </div>
  </div>

  <div class="accent-bar"></div>

  <!-- Content -->
  <div class="content">

    <!-- Date -->
    <div class="date-row">
      <span class="lbl">Date :-</span>
      <div class="field-fixed" style="width:90px;">${visitDate}</div>
    </div>

    <!-- 1. Patient Name -->
    <div class="row">
      <span class="bullet">•)</span>
      <span class="lbl">Patient Name :-</span>
      <div class="field-line">${patient.name || ""}</div>
    </div>

    <!-- 2. Mobile No -->
    <div class="row">
      <span class="bullet">•)</span>
      <span class="lbl">Mobile No. :-</span>
      <div class="field-line">${patient.mobile || ""}</div>
    </div>

    <!-- 3. Age / Weight / Address -->
    <div class="row">
      <span class="bullet">•)</span>
      <span class="lbl">Age :-</span>
      <div class="field-fixed" style="width:32px;">${ageStr}</div>
      <span class="lbl" style="margin-left:5px;">Weight :-</span>
      <div class="field-fixed" style="width:32px;">${patient.weight || ""}</div>
      <span class="lbl" style="margin-left:5px;">Address :-</span>
      <div class="field-line">${patient.address || ""}</div>
    </div>

    <!-- 4. Chief Complaint -->
    <div class="row" style="margin-bottom:3px;">
      <span class="bullet">•)</span>
      <span class="lbl">Chief Complaint :- (C/O)</span>
      <div class="field-line">${complaintLines[0]}</div>
    </div>
    <div class="row" style="padding-left:12px; margin-bottom:7px;">
      <div class="field-line">${complaintLines[1] || ""}</div>
    </div>

    <!-- 5. Rx -->
    <div class="rx-header-row">
      <span class="bullet">•)</span>
      <span class="rx-symbol">℞</span>
      <div class="field-line"></div>
    </div>
    ${medRowsHTML}

    <!-- 6. Advice + Reports -->
    <div class="bottom-cols">
      <div>
        <div class="col-header">
          <span class="bullet">•)</span>
          <span class="col-title">Advice</span>
          <div class="col-title-line"></div>
        </div>
        ${adviceRowsHTML}
      </div>
      <div>
        <div class="col-header">
          <span class="bullet">•)</span>
          <span class="col-title">Reports</span>
          <div class="col-title-line"></div>
        </div>
        ${reportRowsHTML}
        <div class="sig-area">
          <div class="sig-line"></div>
          <div class="sig-label">Doctor's Signature</div>
        </div>
      </div>
    </div>

  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-address">
      <strong>${cs.clinicName}</strong><br>
      ${cs.address} &nbsp;|&nbsp; Mo. ${cs.phone}
    </div>
    <div>
      <div class="next-visit-label">Next Visit</div>
      <div class="next-visit-line"></div>
    </div>
  </div>

  <div class="not-valid">Not valid for Medico – Legal Purpose</div>

</div>
</body>
</html>`;
}

// ── printPatientPrescription — opens a print window ──────────────────────────
export function printPatientPrescription(patient: Patient): void {
  const html = buildPrescriptionHTML(patient);
  const win = window.open("", "_blank", "width=600,height=850");
  if (!win) {
    alert("Pop-up blocked! Please allow pop-ups for this site.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  // Give browser time to render before triggering print
  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
      // Close after print dialog closes (works in most browsers)
      win.addEventListener("afterprint", () => win.close());
    }, 350);
  };
}

// ── PrintPrescription — hidden component that auto-triggers on mount ──────────
// Rendered in Home.tsx as: {lastSaved && <PrintPrescription patient={lastSaved} />}
// It does NOT auto-print on every render — only when explicitly called via
// printPatientPrescription(). This component just mounts the hidden iframe
// so the function is importable alongside it.
export function PrintPrescription({ patient }: { patient: Patient }) {
  // This component intentionally renders nothing visible.
  // Printing is triggered imperatively via printPatientPrescription().
  return null;
}

export default PrintPrescription;
