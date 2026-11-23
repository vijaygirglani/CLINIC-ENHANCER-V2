/**
 * reportContacts.ts — the people a daily report gets sent to.
 *
 * Saved once so the report can go straight to a colleague's WhatsApp instead
 * of opening the contact list and hunting for them every evening.
 *
 * Self-contained, and the `cp_` prefix means these travel with every backup.
 */

const KEY = "cp_report_contacts";

export interface ReportContact {
  id: string;
  name: string;
  /** Digits as typed. Normalised to 91XXXXXXXXXX only when a link is built. */
  mobile: string;
  note?: string;
  /** Picked by default when the report opens. Only one contact holds it. */
  preferred?: boolean;
}

function read(): ReportContact[] {
  try {
    const rows = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(rows) ? rows.filter(r => r && r.id && r.name) : [];
  } catch {
    return [];
  }
}

function write(rows: ReportContact[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    /* storage full — the list on screen still works for this send */
  }
  try {
    window.dispatchEvent(new CustomEvent("cp-report-contacts-changed"));
  } catch {
    /* older browser — nothing depends on the event */
  }
}

export function subscribeContacts(fn: () => void): () => void {
  window.addEventListener("cp-report-contacts-changed", fn);
  return () => window.removeEventListener("cp-report-contacts-changed", fn);
}

export function getContacts(): ReportContact[] {
  return read().sort((a, b) =>
    Number(!!b.preferred) - Number(!!a.preferred) || a.name.localeCompare(b.name)
  );
}

export function addContact(name: string, mobile: string, note?: string): ReportContact | null {
  const digits = onlyDigits(mobile);
  if (!name.trim() || digits.length < 10) return null;

  const rows = read();
  const row: ReportContact = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name: name.trim(),
    mobile: digits,
    note: note?.trim() || undefined,
    // The first one saved becomes the default, so the common case is one tap.
    preferred: rows.length === 0,
  };
  write([...rows, row]);
  return row;
}

export function updateContact(id: string, patch: Partial<Omit<ReportContact, "id">>): void {
  write(read().map(r => (r.id === id ? { ...r, ...patch } : r)));
}

export function removeContact(id: string): void {
  write(read().filter(r => r.id !== id));
}

/** Only one contact can be the default, so the others are cleared. */
export function setPreferred(id: string): void {
  write(read().map(r => ({ ...r, preferred: r.id === id })));
}

export function onlyDigits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

/**
 * An Indian mobile for wa.me, which wants the country code and no "+".
 * A number already carrying 91 is left alone; ten digits get 91 added.
 * Anything else is returned as-is and the caller decides whether to trust it.
 */
export function waNumber(mobile: string): string {
  const d = onlyDigits(mobile);
  if (d.length === 10) return "91" + d;
  if (d.length === 12 && d.startsWith("91")) return d;
  if (d.length === 11 && d.startsWith("0")) return "91" + d.slice(1);
  return d;
}

/** "+91 98765 43210" — how a number should look on screen. */
export function prettyNumber(mobile: string): string {
  const d = onlyDigits(mobile);
  const ten = d.length > 10 ? d.slice(-10) : d;
  if (ten.length !== 10) return mobile;
  return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
}

/**
 * The link that opens WhatsApp with the message ready.
 * Without a number it opens WhatsApp and lets the sender pick a chat.
 */
export function whatsappLink(text: string, mobile?: string): string {
  const msg = encodeURIComponent(text);
  const num = mobile ? waNumber(mobile) : "";
  return num ? `https://wa.me/${num}?text=${msg}` : `https://wa.me/?text=${msg}`;
}
