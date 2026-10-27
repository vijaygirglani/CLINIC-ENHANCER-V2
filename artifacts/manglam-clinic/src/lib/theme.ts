/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THEME — light / dark / auto
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  The choice is stored in `cp_theme` and applied by adding or removing the
 *  `dark` class on <html>. index.html runs the same logic inline BEFORE React
 *  boots, so a dark-mode user never sees a white flash on startup.
 *
 *  "auto" follows Windows' own light/dark setting and updates live if the
 *  machine switches at sunset.
 *
 *  Deliberately tiny and dependency-free: next-themes is in package.json but
 *  needs a provider and a mounted-state dance that is more trouble than this.
 */

export type ThemeChoice = "light" | "dark" | "auto";

const THEME_KEY = "cp_theme";
export const THEME_EVENT = "cp-theme-changed";

export function getTheme(): ThemeChoice {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "dark" || v === "auto") return v;
  } catch {
    /* storage blocked */
  }
  return "light";
}

/** What "auto" currently resolves to. */
export function systemPrefersDark(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

/** The theme actually on screen right now. */
export function resolvedTheme(): "light" | "dark" {
  const choice = getTheme();
  if (choice === "auto") return systemPrefersDark() ? "dark" : "light";
  return choice;
}

export function applyTheme(): void {
  const dark = resolvedTheme() === "dark";
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  // Tells the browser to render form controls and scrollbars to match.
  root.style.colorScheme = dark ? "dark" : "light";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#0b1220" : "#2563eb");
}

export function setTheme(choice: ThemeChoice): void {
  try {
    localStorage.setItem(THEME_KEY, choice);
  } catch {
    /* storage blocked — the theme still applies for this session */
  }
  applyTheme();
  try {
    window.dispatchEvent(new Event(THEME_EVENT));
  } catch {
    /* non-browser context */
  }
}

/**
 * Start watching. Call once at boot.
 *  · keeps "auto" in step with the OS
 *  · keeps a second window (the display screen on another monitor) in step
 */
export function initTheme(): () => void {
  applyTheme();

  let mq: MediaQueryList | null = null;
  const onSystem = () => {
    if (getTheme() === "auto") applyTheme();
  };
  try {
    mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", onSystem);
  } catch {
    mq = null;
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === THEME_KEY) applyTheme();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    if (mq) mq.removeEventListener("change", onSystem);
    window.removeEventListener("storage", onStorage);
  };
}

/** Subscribe to theme changes made in this window or another one. */
export function subscribeTheme(fn: () => void): () => void {
  const onLocal = () => fn();
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === THEME_KEY) fn();
  };
  window.addEventListener(THEME_EVENT, onLocal);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_EVENT, onLocal);
    window.removeEventListener("storage", onStorage);
  };
}
