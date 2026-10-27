/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AnimatedNumber — numbers that count up instead of just appearing
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Drop-in replacement for a plain `{value}` or `{formatCurrency(value)}`.
 *
 *      <AnimatedNumber value={42} />
 *      <AnimatedNumber value={collectionTotal} format="currency" pulse />
 *
 *  Three things it respects, so it never becomes a nuisance:
 *
 *   1. `prefers-reduced-motion` — the number appears instantly.
 *   2. Lite mode (`cp_lite_mode` = "1" in localStorage) — for the older PCs
 *      in other clinics, where moving pixels stutter and look worse than
 *      static ones. One switch turns every animation in the app off.
 *   3. It animates from the PREVIOUS value, not from zero, on every update
 *      after the first. So saving one patient ticks 41 → 42 rather than
 *      replaying the whole count.
 *
 *  `pulse` makes the number flash and bump when it goes UP — used on the
 *  collection card, where it confirms the fee actually landed.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";

/* ── lite mode ───────────────────────────────────────────────────────────── */

const LITE_KEY = "cp_lite_mode";

export function isLiteMode(): boolean {
  try {
    return localStorage.getItem(LITE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setLiteMode(on: boolean): void {
  try {
    localStorage.setItem(LITE_KEY, on ? "1" : "0");
    window.dispatchEvent(new Event("cp-lite-mode-changed"));
  } catch {
    /* storage blocked — leave it on */
  }
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** True when animation should be skipped entirely. */
export function motionOff(): boolean {
  return isLiteMode() || prefersReducedMotion();
}

/* ── formatting ──────────────────────────────────────────────────────────── */

export type NumberFormat = "number" | "currency" | "money" | "plain";

function formatValue(n: number, fmt: NumberFormat, decimals: number): string {
  switch (fmt) {
    case "currency":
      // Matches formatCurrency() in lib/utils.ts — ₹ with no paise.
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(n);
    case "money":
      // ₹ with paise only when there are paise — for stock values like ₹0.70
      return (
        "₹" +
        n.toLocaleString("en-IN", {
          minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
          maximumFractionDigits: 2,
        })
      );
    case "plain":
      return n.toFixed(decimals);
    case "number":
    default:
      return n.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
  }
}

/* ── easing ──────────────────────────────────────────────────────────────── */

// easeOutCubic — fast off the mark, settles gently. Reads as "landing on" a
// figure rather than drifting towards it.
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/* ── the count-up hook ───────────────────────────────────────────────────── */

export function useCountUp(value: number, duration = 650): number {
  const safeValue = Number.isFinite(value) ? value : 0;
  const [shown, setShown] = useState(() => (motionOff() ? safeValue : 0));
  const fromRef = useRef(motionOff() ? safeValue : 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (motionOff()) {
      fromRef.current = safeValue;
      setShown(safeValue);
      return;
    }

    const from = fromRef.current;
    const to = safeValue;

    if (from === to) {
      setShown(to);
      return;
    }

    // Short hop for a small change, full sweep for a big one, so a 41 → 42
    // tick does not take as long as 0 → 12,400.
    const span = Math.abs(to - from);
    const scale = Math.min(1, span / Math.max(1, Math.abs(to) || 1));
    const ms = Math.max(220, duration * (0.35 + 0.65 * scale));

    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const current = from + (to - from) * ease(t);
      setShown(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
        setShown(to);
        rafRef.current = null;
      }
    };

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      // Park at wherever it got to, so the next change continues from there
      // instead of snapping back.
      fromRef.current = safeValue;
    };
  }, [safeValue, duration]);

  return shown;
}

/* ── the component ───────────────────────────────────────────────────────── */

export interface AnimatedNumberProps {
  value: number;
  format?: NumberFormat;
  decimals?: number;
  duration?: number;
  /** flash + bump when the value increases */
  pulse?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  format = "number",
  decimals = 0,
  duration = 650,
  pulse = false,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedNumberProps) {
  const shown = useCountUp(value, duration);
  const controls = useAnimationControls();
  const prevRef = useRef(value);
  const firstRef = useRef(true);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;

    // Don't pulse on first paint — only on a real increase while watching.
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    if (!pulse || motionOff() || value <= prev) return;

    controls.start({
      scale: [1, 1.14, 1],
      transition: { duration: 0.45, times: [0, 0.35, 1], ease: "easeOut" },
    });
  }, [value, pulse, controls]);

  // Mid-flight the value is fractional; round for display unless the format
  // genuinely carries decimals.
  const display =
    format === "money" || decimals > 0
      ? formatValue(shown, format, decimals)
      : formatValue(Math.round(shown), format, 0);

  return (
    <motion.span
      animate={controls}
      style={{ display: "inline-block" }}
      className={className}
      // Tabular figures stop the number jittering sideways as digits change.
      // Without this a counting figure visibly wobbles.
    >
      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        {prefix}
        {display}
        {suffix}
      </span>
    </motion.span>
  );
}

/** Convenience wrapper for rupee figures. */
export function AnimatedCurrency(props: Omit<AnimatedNumberProps, "format">) {
  return <AnimatedNumber {...props} format="currency" />;
}

/**
 * Big flip-style token number for the waiting-room display.
 * The whole number swaps out and the new one drops in.
 */
export function FlipNumber({
  value,
  className = "",
}: {
  value: number | string;
  className?: string;
}) {
  if (motionOff()) return <span className={className}>{value}</span>;
  return (
    <motion.span
      key={String(value)}
      initial={{ y: "-55%", opacity: 0, filter: "blur(6px)" }}
      animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      style={{ display: "inline-block", fontVariantNumeric: "tabular-nums" }}
      className={className}
    >
      {value}
    </motion.span>
  );
}

export default AnimatedNumber;
