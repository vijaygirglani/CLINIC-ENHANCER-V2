/**
 * festivals.ts — which festival, if any, today falls in.
 *
 * Used for the doctor character's festival dress and for the greeting on the
 * waiting-room screen. Self-contained: imports nothing, stores nothing.
 *
 * ── Dates ────────────────────────────────────────────────────────────────
 * Two kinds in here:
 *
 *   • Fixed — Republic Day, Independence Day, Uttarayan. Same dates every
 *     year, so they are matched by month and day alone and keep working for
 *     ever without a table.
 *
 *   • Lunar — Holi, Janmashtami, Navratri, Diwali. These move every year and
 *     cannot be computed from a formula here, so they are listed per year.
 *     Each was cross-checked against two independent panchang sources that
 *     agreed; a third source was discarded after it turned out to be printing
 *     the previous year's dates.
 *
 * Ranges rather than single days, deliberately. Navratri really is nine
 * nights, Diwali really does run into Bestu Varas, and Uttarayan in Gujarat
 * is two days with Vasi Uttarayan. A range is both truer to how these are
 * kept and immune to a one-day disagreement between panchangs — which is
 * exactly what the two sources had over Makar Sankranti 2027.
 *
 * When the table runs out the character simply wears its ordinary coat, so
 * nothing breaks in 2028 — it just stops dressing up. `festivalsRunOutSoon()`
 * says when it is worth topping up.
 */

export type FestivalId =
  | "uttarayan"
  | "republic"
  | "holi"
  | "independence"
  | "janmashtami"
  | "navratri"
  | "diwali";

export interface Festival {
  id: FestivalId;
  /** Greeting, in the three languages the clinic uses. */
  gu: string;
  hi: string;
  en: string;
  /** Drives the outfit and the colour of the panel behind the character. */
  accent: string;
}

export const FESTIVALS: Record<FestivalId, Festival> = {
  uttarayan:    { id: "uttarayan",    gu: "મકરસંક્રાંતિની શુભેચ્છા",  hi: "मकर संक्रांति की शुभकामनाएँ", en: "Happy Uttarayan",      accent: "#0ea5e9" },
  republic:     { id: "republic",     gu: "ગણતંત્ર દિવસ",             hi: "गणतंत्र दिवस",                en: "Republic Day",          accent: "#f97316" },
  holi:         { id: "holi",         gu: "હોળીની શુભેચ્છા",          hi: "होली की शुभकामनाएँ",          en: "Happy Holi",            accent: "#ec4899" },
  independence: { id: "independence", gu: "સ્વતંત્રતા દિવસ",          hi: "स्वतंत्रता दिवस",             en: "Independence Day",      accent: "#16a34a" },
  janmashtami:  { id: "janmashtami",  gu: "જન્માષ્ટમીની શુભેચ્છા",    hi: "जन्माष्टमी की शुभकामनाएँ",    en: "Happy Janmashtami",     accent: "#6366f1" },
  navratri:     { id: "navratri",     gu: "નવરાત્રિની શુભેચ્છા",      hi: "नवरात्रि की शुभकामनाएँ",      en: "Happy Navratri",        accent: "#d946ef" },
  diwali:       { id: "diwali",       gu: "દિવાળીની શુભેચ્છા",        hi: "दीपावली की शुभकामनाएँ",       en: "Happy Diwali",          accent: "#f59e0b" },
};

/** Same every year: [month (1-12), day]. */
const FIXED: Array<{ id: FestivalId; from: [number, number]; to: [number, number] }> = [
  // Uttarayan and Vasi Uttarayan — two days of kites in Gujarat.
  { id: "uttarayan",    from: [1, 14],  to: [1, 15] },
  { id: "republic",     from: [1, 26],  to: [1, 26] },
  { id: "independence", from: [8, 15],  to: [8, 15] },
];

/** Lunar, so listed per year as ISO date ranges, inclusive of both ends. */
const LUNAR: Record<string, Array<{ id: FestivalId; from: string; to: string }>> = {
  "2026": [
    // Holika Dahan 3 Mar, Dhuleti 4 Mar
    { id: "holi",        from: "2026-03-03", to: "2026-03-04" },
    { id: "janmashtami", from: "2026-09-04", to: "2026-09-04" },
    // Navratri begins 11 Oct, through Dussehra on 20 Oct
    { id: "navratri",    from: "2026-10-11", to: "2026-10-20" },
    // Diwali 8 Nov, through Govardhan Puja / Bestu Varas on 10 Nov
    { id: "diwali",      from: "2026-11-08", to: "2026-11-10" },
  ],
  "2027": [
    // Holika Dahan 22 Mar, Dhuleti 23 Mar
    { id: "holi",        from: "2027-03-22", to: "2027-03-23" },
    { id: "janmashtami", from: "2027-08-24", to: "2027-08-24" },
    // Navratri begins 30 Sep, through Dussehra on 9 Oct
    { id: "navratri",    from: "2027-09-30", to: "2027-10-09" },
    // Diwali 29 Oct, through Govardhan Puja / Bestu Varas on 30 Oct
    { id: "diwali",      from: "2027-10-29", to: "2027-10-30" },
  ],
};

/** Local-time ISO date, with no UTC shift to slip it across midnight. */
export function todayISO(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * The festival today falls in, or null on an ordinary day.
 * Lunar wins over fixed if they ever overlap, since those are the ones
 * people actually mark.
 */
export function festivalToday(iso = todayISO()): Festival | null {
  const year = iso.slice(0, 4);

  for (const f of LUNAR[year] || []) {
    if (iso >= f.from && iso <= f.to) return FESTIVALS[f.id];
  }

  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));
  for (const f of FIXED) {
    const after = month > f.from[0] || (month === f.from[0] && day >= f.from[1]);
    const before = month < f.to[0] || (month === f.to[0] && day <= f.to[1]);
    if (after && before) return FESTIVALS[f.id];
  }

  return null;
}

/** True once the lunar table has under a year left, so it gets topped up. */
export function festivalsRunOutSoon(iso = todayISO()): boolean {
  const years = Object.keys(LUNAR).sort();
  const last = years[years.length - 1];
  return !last || Number(iso.slice(0, 4)) >= Number(last);
}

/** Years the lunar table covers — handy for a diagnostics screen. */
export const LUNAR_YEARS = Object.keys(LUNAR).sort();
