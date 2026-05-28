// ─── ADD THIS BLOCK at the bottom of store.ts ───────────────────────────────
// Place it just above the "Backup / Restore" section

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

/**
 * Live search: returns unique patients (deduplicated by mobile)
 * that match the query, each enriched with visit count + recent history.
 * Used for the name-field autocomplete dropdown.
 */
export function searchPatientSuggestions(query: string): PatientSuggestion[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const all = getPatients().filter(p => p.name.toLowerCase().includes(q));

  // Group visits by mobile number so each unique patient appears once
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
      name: latest.name,
      mobile,
      age: latest.age || 0,
      ageMonths: latest.ageMonths || 0,
      weight: latest.weight || "",
      address: latest.address || "",
      visitCount: sorted.length,
      lastVisit: latest.visitDate,
      recentVisits: sorted.slice(0, 3), // last 3 visits for preview
    });
  }

  // Sort by most-recent visit, limit to 8 results
  return suggestions
    .sort((a, b) => b.lastVisit.localeCompare(a.lastVisit))
    .slice(0, 8);
}
