import { useEffect, useRef } from "react";

/**
 * The printed A5 prescription.
 *
 * ── Three languages ──────────────────────────────────────────────────────
 * Only the printed LABELS change — Patient Name, Age, Advice and so on. What
 * you typed into the record (the complaint, the medicines, the advice text)
 * prints exactly as you wrote it, in whatever script you wrote it in. The
 * form does not translate anything, and it should not pretend to.
 *
 * The language is a setting rather than an argument, read here from
 * localStorage. That way the six Print buttons spread across Registration,
 * Daily Register and the Ayurvedic Register all follow it without any of them
 * having to be changed, and the doctor sets it once.
 *
 * Two things that matter for Gujarati and Devanagari:
 *   · The font stack has to name Indic fonts. 'Segoe UI' alone silently falls
 *     back to something that renders conjuncts badly, or not at all.
 *   · letter-spacing breaks conjuncts — it pushes the parts of a joined glyph
 *     apart. It is applied only when printing in English.
 */

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

// ── Language ─────────────────────────────────────────────────────────────────

export type PrescriptionLang = "en" | "hi" | "gu";

export const PRINT_LANG_KEY = "cp_print_lang";

export const PRINT_LANG_LABEL: Record<PrescriptionLang, string> = {
  en: "English",
  hi: "हिंदी",
  gu: "ગુજરાતી",
};

export function getPrintLang(): PrescriptionLang {
  try {
    const v = localStorage.getItem(PRINT_LANG_KEY);
    if (v === "hi" || v === "gu" || v === "en") return v;
  } catch {
    /* storage unavailable — English is a safe default */
  }
  return "en";
}

export function setPrintLang(lang: PrescriptionLang): void {
  try {
    localStorage.setItem(PRINT_LANG_KEY, lang);
  } catch {
    /* nothing to do — the next print simply uses the default */
  }
}

interface Labels {
  title: string;
  date: string;
  name: string;
  mobile: string;
  age: string;
  weight: string;
  address: string;
  complaint: string;
  advice: string;
  reports: string;
  signature: string;
  nextVisit: string;
  disclaimer: string;
}

const LABELS: Record<PrescriptionLang, Labels> = {
  en: {
    title: "Prescription",
    date: "Date :-",
    name: "Patient Name :-",
    mobile: "Mobile No. :-",
    age: "Age :-",
    weight: "Weight :-",
    address: "Address :-",
    complaint: "Chief Complaint :-",
    advice: "Advice",
    reports: "Reports",
    signature: "Doctor's Signature",
    nextVisit: "Next Visit",
    disclaimer: "Not valid for Medico – Legal Purpose",
  },
  hi: {
    title: "पर्ची",
    date: "दिनांक :-",
    name: "रोगी का नाम :-",
    mobile: "मोबाइल नं. :-",
    age: "उम्र :-",
    weight: "वज़न :-",
    address: "पता :-",
    complaint: "मुख्य शिकायत :-",
    advice: "सलाह",
    reports: "जाँच",
    signature: "डॉक्टर के हस्ताक्षर",
    nextVisit: "अगली विज़िट",
    disclaimer: "चिकित्सा-कानूनी प्रयोजन हेतु मान्य नहीं",
  },
  gu: {
    title: "પ્રિસ્ક્રિપ્શન",
    date: "તારીખ :-",
    name: "દર્દીનું નામ :-",
    mobile: "મોબાઈલ નં. :-",
    age: "ઉંમર :-",
    weight: "વજન :-",
    address: "સરનામું :-",
    complaint: "મુખ્ય ફરિયાદ :-",
    advice: "સલાહ",
    reports: "તપાસ",
    signature: "ડૉક્ટરની સહી",
    nextVisit: "આગલી મુલાકાત",
    disclaimer: "તબીબી-કાનૂની હેતુ માટે માન્ય નથી",
  },
};

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
function buildPrescriptionHTML(patient: Patient, lang: PrescriptionLang): string {
  const cs = getClinicSettings();
  const L = LABELS[lang];

  /* Indic scripts need their own fonts named; without them Gujarati and
     Devanagari fall back to whatever the system picks and conjuncts break. */
  const FONTS = lang === "en"
    ? `'Segoe UI', Arial, sans-serif`
    : lang === "gu"
    ? `'Noto Sans Gujarati', 'Shruti', 'Nirmala UI', 'Segoe UI', Arial, sans-serif`
    : `'Noto Sans Devanagari', 'Mangal', 'Nirmala UI', 'Segoe UI', Arial, sans-serif`;

  /* letter-spacing pulls joined Indic glyphs apart, so it is English-only. */
  const ls = (amount: string) => (lang === "en" ? `letter-spacing: ${amount};` : "");

  const visitDate = patient.visitDate
    ? patient.visitDate.split("-").reverse().join(" / ")
    : new Date().toLocaleDateString("en-IN").replace(/\//g, " / ");

  const ageStr = [
    patient.age ? `${patient.age}y` : "",
    patient.ageMonths ? `${patient.ageMonths}m` : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Split multi-line treatment into lines (split by newline)
  const medLines: string[] = patient.treatment
    ? patient.treatment
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [];
  // Ensure at least 7 blank lines for medicines
  while (medLines.length < 10) medLines.push("");

  const adviceLines: string[] = patient.advice
    ? patient.advice
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [];
  while (adviceLines.length < 2) adviceLines.push("");

  const reportLines: string[] = patient.reports
    ? patient.reports
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [];
  while (reportLines.length < 2) reportLines.push("");

  const complaint = patient.complaint || "";

  // Med rows: first non-empty line gets content, rest are blank dashed lines
  const medRowsHTML = medLines
    .map(
      (med) => `<div style="min-height: 18px; font-size: 10px; font-weight: 600; color: #111; padding: 3px 0; border-bottom: 1px dashed #c8e6d4;">${med}</div>`
    )
    .join("");

  const adviceRowsHTML = adviceLines
    .map(
      (a) => `<div style="min-height: 16px; font-size: 10px; font-weight: 600; color: #111; border-bottom: 1px dashed #f0c080; padding: 2px 0;">${a}</div>`
    )
    .join("");

  const reportRowsHTML = reportLines
    .map(
      (r) => `<div style="min-height: 16px; font-size: 10px; font-weight: 600; color: #111; border-bottom: 1px dashed #a8d8ea; padding: 2px 0;">${r}</div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${L.title} – ${patient.name}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A5 portrait; margin: 0; }
  html, body {
    width: 148mm;
    height: 210mm;
    font-family: ${FONTS};
    background: #fff;
    color: #111;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
</style>
</head>
<body>
<div style="width: 148mm; min-height: 210mm; background: #fff; color: #111; display: flex; flex-direction: column; overflow: hidden; font-family: ${FONTS};">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #0d3d2b 0%, #1a6b47 60%, #0d3d2b 100%); padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact;">
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 42px; height: 42px; border-radius: 10px; background: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative;">
        <svg width="28" height="28" viewBox="0 0 28 28">
          <rect x="11" y="3" width="6" height="22" rx="2" fill="#c0392b"/>
          <rect x="3" y="11" width="22" height="6" rx="2" fill="#c0392b"/>
        </svg>
      </div>
      <div>
        <div style="font-size: 20px; font-weight: 700; color: #fff; ${ls("-0.3px")} line-height: 1;">${cs.clinicName}</div>
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 12px; font-weight: 700; color: #fff;">${cs.doctorName}</div>
      <!-- Reads the saved qualification. It used to be hard-coded to B.A.M.S.,
           which meant every other doctor printed this doctor's degree. -->
      <div style="font-size: 9px; color: #a8e6c8; margin-top: 2px;">${cs.qualification}</div>
    </div>
  </div>

  <!-- Rainbow accent bar -->
  <div style="height: 4px; background: linear-gradient(90deg, #e74c3c, #e67e22, #f1c40f, #2ecc71, #3498db, #9b59b6); flex-shrink: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact;"></div>

  <!-- Sub-header strip -->
  <div style="background: linear-gradient(90deg, #eafaf1, #fef9e7, #eaf4fb); padding: 5px 18px; display: flex; justify-content: flex-end; align-items: center; border-bottom: 1px solid #d5e8d4; flex-shrink: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact;">
    <span style="font-size: 9.5px; font-weight: 600; color: #555;">${L.date}</span>
    <span style="font-size: 10px; font-weight: 700; color: #1a6b47; margin-left: 6px; min-width: 90px;">${visitDate}</span>
  </div>

  <!-- Content -->
  <div style="padding: 10px 18px 8px; display: flex; flex-direction: column; flex: 1;">

    <!-- Patient info table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
      <tr>
        <td style="width: 14px; padding: 4px 0; vertical-align: bottom;">
          <span style="font-size: 11px; font-weight: 700; color: #e74c3c;">•</span>
        </td>
        <td style="white-space: nowrap; padding: 4px 6px 4px 2px; vertical-align: bottom;">
          <span style="font-size: 9.5px; font-weight: 600; color: #2c3e50;">${L.name}</span>
        </td>
        <td style="border-bottom: 1.5px solid #3498db; padding: 4px 4px 2px; vertical-align: bottom;">
          <span style="font-size: 10px; font-weight: 600; color: #111;">${patient.name || ""}</span>
        </td>
      </tr>
      <tr>
        <td style="width: 14px; padding: 4px 0; vertical-align: bottom;">
          <span style="font-size: 11px; font-weight: 700; color: #e67e22;">•</span>
        </td>
        <td style="white-space: nowrap; padding: 4px 6px 4px 2px; vertical-align: bottom;">
          <span style="font-size: 9.5px; font-weight: 600; color: #2c3e50;">${L.mobile}</span>
        </td>
        <td style="border-bottom: 1.5px solid #9b59b6; padding: 4px 4px 2px; vertical-align: bottom;">
          <span style="font-size: 10px; font-weight: 600; color: #111;">${patient.mobile || ""}</span>
        </td>
      </tr>
      <tr>
        <td style="width: 14px; padding: 4px 0; vertical-align: bottom;">
          <span style="font-size: 11px; font-weight: 700; color: #2ecc71;">•</span>
        </td>
        <td style="white-space: nowrap; padding: 4px 6px 4px 2px; vertical-align: bottom;">
          <span style="font-size: 9.5px; font-weight: 600; color: #2c3e50;">${L.age}</span>
        </td>
        <td style="padding: 4px 0 2px; vertical-align: bottom;">
          <div style="display: flex; align-items: flex-end; gap: 6px;">
            <span style="border-bottom: 1.5px solid #e74c3c; min-width: 36px; padding-bottom: 2px; font-size: 10px; display: inline-block;">${ageStr}</span>
            <span style="font-size: 9.5px; font-weight: 600; color: #2c3e50; white-space: nowrap;">${L.weight}</span>
            <span style="border-bottom: 1.5px solid #e67e22; min-width: 36px; padding-bottom: 2px; font-size: 10px; display: inline-block;">${patient.weight || ""}</span>
            <span style="font-size: 9.5px; font-weight: 600; color: #2c3e50; white-space: nowrap;">${L.address}</span>
            <span style="border-bottom: 1.5px solid #3498db; flex: 1; min-width: 60px; padding-bottom: 2px; font-size: 10px; display: inline-block;">${patient.address || ""}</span>
          </div>
        </td>
      </tr>
      <tr>
        <td style="width: 14px; padding: 4px 0; vertical-align: bottom;">
          <span style="font-size: 11px; font-weight: 700; color: #3498db;">•</span>
        </td>
        <td style="white-space: nowrap; padding: 4px 6px 4px 2px; vertical-align: bottom;">
          <span style="font-size: 9.5px; font-weight: 600; color: #2c3e50;">${L.complaint}</span>
        </td>
        <td style="border-bottom: 1.5px solid #2ecc71; padding: 4px 4px 2px; vertical-align: bottom;">
          <span style="font-size: 10px; font-weight: 600; color: #111;">${complaint}</span>
        </td>
      </tr>
      <tr>
        <td></td><td></td>
        <td style="border-bottom: 1.5px solid #2ecc71; padding: 2px 4px 2px; height: 18px;"></td>
      </tr>
    </table>

    <!-- Rx section -->
    <div style="background: linear-gradient(90deg, #eafaf1, #f0f8ff); border-left: 4px solid #1a6b47; border-radius: 0 6px 6px 0; padding: 7px 10px 4px; margin-bottom: 8px; print-color-adjust: exact; -webkit-print-color-adjust: exact;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
        <span style="font-size: 22px; font-weight: 700; color: #c0392b; line-height: 1;">&#8478;</span>
        <div style="flex: 1; height: 1.5px; background: linear-gradient(90deg, #c0392b, transparent);"></div>
      </div>
      <div style="padding-left: 10px;">
        ${medRowsHTML}
      </div>
    </div>

    <!-- Bottom two columns -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 4px;">
      <div style="background: linear-gradient(135deg, #fef9e7, #fdebd0); border-left: 3px solid #e67e22; border-radius: 0 6px 6px 0; padding: 6px 8px; print-color-adjust: exact; -webkit-print-color-adjust: exact;">
        <div style="font-size: 9.5px; font-weight: 700; color: #e67e22; margin-bottom: 5px; ${ls("0.5px")} text-transform: uppercase;">• ${L.advice}</div>
        ${adviceRowsHTML}
      </div>
      <div style="background: linear-gradient(135deg, #eaf4fb, #e8f8f5); border-left: 3px solid #3498db; border-radius: 0 6px 6px 0; padding: 6px 8px; print-color-adjust: exact; -webkit-print-color-adjust: exact;">
        <div style="font-size: 9.5px; font-weight: 700; color: #3498db; margin-bottom: 5px; ${ls("0.5px")} text-transform: uppercase;">• ${L.reports}</div>
        ${reportRowsHTML}
      </div>
    </div>

    <!-- Doctor's Signature — separate below both columns -->
    <div style="margin-top: 10px; text-align: right; padding-right: 4px;">
      <div style="display: inline-block; width: 120px; height: 24px; border-bottom: 1.5px solid #9b59b6;"></div>
      <div style="font-size: 7.5px; color: #9b59b6; text-align: right; margin-top: 2px; font-weight: 600;">${L.signature}</div>
    </div>

  </div>

  <!-- Rainbow separator -->
  <div style="height: 3px; background: linear-gradient(90deg, #9b59b6, #3498db, #2ecc71, #f1c40f, #e67e22, #e74c3c); margin: 4px 0 0; flex-shrink: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact;"></div>

  <!-- Footer -->
  <div style="padding: 8px 18px; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(90deg, #0d3d2b, #1a6b47); flex-shrink: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact;">
    <div style="line-height: 1.7;">
      <div style="font-size: 11px; font-weight: 700; color: #fff; ${ls("0.3px")}">${cs.clinicName}</div>
      <div style="font-size: 10px; font-weight: 600; color: #a8e6c8;">${cs.address}</div>
      <div style="font-size: 11px; font-weight: 700; color: #f1c40f; ${ls("0.5px")}">&#128222; ${cs.phone}</div>
    </div>
    <div>
      <div style="font-size: 8px; color: #a8e6c8; font-weight: 600; margin-bottom: 3px; text-align: right;">${L.nextVisit}</div>
      <div style="min-width: 80px; height: 18px; border-bottom: 1.5px solid #f1c40f;"></div>
    </div>
  </div>

  <div style="text-align: center; font-size: 7px; color: #999; ${ls("0.3px")} padding: 3px 0; background: #f9f9f9; flex-shrink: 0;">
    ${L.disclaimer}
  </div>

</div>
</body>
</html>`;
}

// ── printPatientPrescription — opens a print window ──────────────────────────
/**
 * `lang` is optional. Left out, it follows the saved setting, which is what
 * every Print button in the app does — so the language can be changed in one
 * place without touching any of them.
 */
export function printPatientPrescription(patient: Patient, lang?: PrescriptionLang): void {
  const html = buildPrescriptionHTML(patient, lang || getPrintLang());
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

/** The prescription HTML on its own, for a preview that does not print. */
export function buildPrescriptionPreview(patient: Patient, lang?: PrescriptionLang): string {
  return buildPrescriptionHTML(patient, lang || getPrintLang());
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
