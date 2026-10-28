/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  WAITING-ROOM DISPLAY — settings, clinic details and the rotating tips
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Kept apart from the screen itself so the display stays a view and this
 *  stays testable. Nothing here imports store.ts.
 */

/* ── clinic details ───────────────────────────────────────────────────────
   Read from the same key the Clinic Settings dialog writes, so a clinic that
   renames itself renames the waiting-room screen too. That matters when the
   app goes to another doctor — nothing on the screen is hard-coded to
   Manglam. */

export interface DisplayClinic {
  clinicName: string;
  doctorName: string;
  qualification: string;
  tagline: string;
  logoLetter: string;
  footerCity: string;
  /* Read for the credentials card. The settings form already saves these. */
  specialization: string;
  timing: string;
  phone: string;
  address: string;
}

const CLINIC_KEY = "manglam_clinic_settings";

const CLINIC_FALLBACK: DisplayClinic = {
  clinicName: "Manglam Clinic",
  doctorName: "Dr. Vijay Girglani",
  qualification: "B.A.M.S.",
  tagline: "AYURVEDIC & GENERAL PRACTICE",
  logoLetter: "M",
  footerCity: "Morbi, Gujarat",
  specialization: "",
  timing: "",
  phone: "",
  address: "",
};

export function getDisplayClinic(): DisplayClinic {
  try {
    const raw = JSON.parse(localStorage.getItem(CLINIC_KEY) || "{}");
    return {
      clinicName: raw.clinicName || CLINIC_FALLBACK.clinicName,
      doctorName: raw.doctorName || CLINIC_FALLBACK.doctorName,
      qualification: raw.qualification || CLINIC_FALLBACK.qualification,
      tagline: raw.tagline || CLINIC_FALLBACK.tagline,
      logoLetter: raw.logoLetter || CLINIC_FALLBACK.logoLetter,
      footerCity: raw.footerCity || CLINIC_FALLBACK.footerCity,
      specialization: raw.specialization || "",
      timing: raw.timing || "",
      phone: raw.phone || "",
      address: raw.footerAddress || raw.address || "",
    };
  } catch {
    return CLINIC_FALLBACK;
  }
}

/* ── settings ─────────────────────────────────────────────────────────────── */

export type DisplayLook = "midnight" | "forest" | "daylight";
export type DisplayLang = "gu" | "hi" | "en";

export interface DisplaySettings {
  look: DisplayLook;
  lang: DisplayLang;
  showUpNext: boolean;
  showTips: boolean;
  /** seconds a tip stays on screen */
  tipSeconds: number;
  chime: boolean;
  /** Cycle the doctor's credentials card in between tokens. */
  showCard: boolean;
  /** How often the card appears, in seconds. */
  cardEverySeconds: number;
}

const SETTINGS_KEY = "cp_display_settings";

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  look: "midnight",
  lang: "gu",
  showUpNext: true,
  showTips: true,
  tipSeconds: 20,
  chime: true,
  showCard: true,
  cardEverySeconds: 90,
};

export function getDisplaySettings(): DisplaySettings {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return { ...DEFAULT_DISPLAY_SETTINGS, ...raw };
  } catch {
    return DEFAULT_DISPLAY_SETTINGS;
  }
}

export function saveDisplaySettings(s: DisplaySettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    window.dispatchEvent(new Event("cp-display-settings-changed"));
  } catch {
    /* storage blocked — settings apply for this session only */
  }
}

/* ── the looks ────────────────────────────────────────────────────────────── */

export interface LookTheme {
  name: string;
  background: string;
  glow: string;
  /** main token colour */
  ink: string;
  /** secondary text */
  muted: string;
  /** the patient name under the token */
  accent: string;
  panel: string;
  divider: string;
}

export const LOOKS: Record<DisplayLook, LookTheme> = {
  midnight: {
    name: "Midnight",
    background: "linear-gradient(135deg,#0b1f3a 0%,#123a63 55%,#0d6b6b 100%)",
    glow: "radial-gradient(circle,rgba(56,189,248,0.22),transparent 65%)",
    ink: "#ffffff",
    muted: "rgba(255,255,255,0.55)",
    accent: "#a5f3fc",
    panel: "rgba(255,255,255,0.10)",
    divider: "rgba(255,255,255,0.15)",
  },
  forest: {
    name: "Forest",
    background: "linear-gradient(135deg,#052e2b 0%,#0b4f45 55%,#12694a 100%)",
    glow: "radial-gradient(circle,rgba(52,211,153,0.22),transparent 65%)",
    ink: "#ffffff",
    muted: "rgba(255,255,255,0.55)",
    accent: "#a7f3d0",
    panel: "rgba(255,255,255,0.10)",
    divider: "rgba(255,255,255,0.15)",
  },
  daylight: {
    name: "Daylight",
    background: "linear-gradient(135deg,#f8fafc 0%,#e8f0fb 55%,#dff3f4 100%)",
    glow: "radial-gradient(circle,rgba(37,99,235,0.12),transparent 65%)",
    ink: "#0f172a",
    muted: "rgba(15,23,42,0.50)",
    accent: "#0369a1",
    panel: "rgba(15,23,42,0.06)",
    divider: "rgba(15,23,42,0.12)",
  },
};

/* ── rotating tips ────────────────────────────────────────────────────────
   Pulled from the doctor's own Pathya–Apathya library when one has been
   imported, so the waiting room shows real advice in the patient's language
   rather than filler. Falls back to a short general set. */

const PATHYA_KEY = "mc_imported_diseases";

const FALLBACK_TIPS: Record<DisplayLang, string[]> = {
  gu: [
    "દવા જમ્યા પછી લેવી — ખાલી પેટે નહીં.",
    "રોજ ૮ ગ્લાસ પાણી પીવો.",
    "જમતી વખતે ઠંડુ પાણી ન પીવો.",
    "રાતનું જમવાનું સૂતા પહેલાં ૨ કલાકે લો.",
    "રોજ ૩૦ મિનિટ ચાલવાનું રાખો.",
    "દવાનો કોર્સ પૂરો કરો — સારું લાગે તોય બંધ ન કરો.",
  ],
  hi: [
    "दवा खाने के बाद लें — खाली पेट नहीं।",
    "रोज़ ८ गिलास पानी पिएँ।",
    "खाना खाते समय ठंडा पानी न पिएँ।",
    "रात का खाना सोने से २ घंटे पहले लें।",
    "रोज़ ३० मिनट टहलें।",
    "दवा का कोर्स पूरा करें — आराम लगने पर भी बंद न करें।",
  ],
  en: [
    "Take medicines after food, not on an empty stomach.",
    "Drink 8 glasses of water a day.",
    "Avoid cold water with meals.",
    "Finish dinner two hours before bed.",
    "Walk for 30 minutes every day.",
    "Finish the full course — do not stop when you feel better.",
  ],
};

/**
 * Short, self-contained Pathya lines from the imported library.
 * Long lines are skipped: anything that does not read from across a room is
 * no use on a wall screen.
 */
export function getDisplayTips(lang: DisplayLang): string[] {
  const field = lang === "gu" ? "pathyaGu" : lang === "hi" ? "pathyaHi" : "pathyaEn";
  const out: string[] = [];
  try {
    const list = JSON.parse(localStorage.getItem(PATHYA_KEY) || "[]");
    if (Array.isArray(list)) {
      for (const d of list) {
        const lines = d && (d as any)[field];
        if (!Array.isArray(lines)) continue;
        for (const line of lines) {
          if (typeof line !== "string") continue;
          const t = line.trim();
          if (t.length >= 8 && t.length <= 90) out.push(t);
        }
      }
    }
  } catch {
    /* nothing imported, or malformed — fall through to the defaults */
  }

  if (out.length < 6) return FALLBACK_TIPS[lang];

  // Shuffle so the same six do not loop all morning.
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, 60);
}

/* ── labels ───────────────────────────────────────────────────────────────── */

export const DISPLAY_TEXT: Record<DisplayLang, Record<string, string>> = {
  gu: {
    nowServing: "હવે ચાલુ",
    upNext: "પછીના",
    waiting: "રાહ જોઈ રહ્યા છે",
    noneWaiting: "કોઈ રાહમાં નથી",
    pleaseWait: "કૃપા કરી રાહ જુઓ",
    takeToken: "કૃપા કરી ટોકન લો",
    open: "દવાખાનું ચાલુ છે",
    cardTimings: "દવાખાનાનો સમય",
    cardContact: "સંપર્ક",
    cardAbout: "અમારા ડૉક્ટર",
  },
  hi: {
    nowServing: "अभी चल रहा है",
    upNext: "अगले",
    waiting: "प्रतीक्षा में",
    noneWaiting: "कोई प्रतीक्षा में नहीं",
    pleaseWait: "कृपया प्रतीक्षा करें",
    takeToken: "कृपया टोकन लें",
    open: "क्लिनिक खुला है",
    cardTimings: "क्लिनिक का समय",
    cardContact: "संपर्क",
    cardAbout: "हमारे डॉक्टर",
  },
  en: {
    nowServing: "NOW SERVING",
    upNext: "UP NEXT",
    waiting: "waiting",
    noneWaiting: "No one waiting",
    pleaseWait: "Please wait",
    takeToken: "Please take a token",
    open: "Clinic is open",
    cardTimings: "Clinic timings",
    cardContact: "Contact",
    cardAbout: "Your doctor",
  },
};
