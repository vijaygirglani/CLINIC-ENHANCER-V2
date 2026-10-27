/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PathyaFlipCard — one big card you turn over, for showing the patient
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  The side-by-side panels stay the default, because at the desk you want
 *  pathya and apathya visible at once. This is the other situation: turning
 *  the monitor towards the patient, where one large face at a time reads far
 *  better than two columns of small text.
 *
 *  Click anywhere on the card, or press Space, to turn it over.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCw, Check, Ban } from "lucide-react";
import { motionOff } from "@/components/AnimatedNumber";

export function PathyaFlipCard({
  title, pathyaTitle, apathyaTitle, pathya, apathya, subtitle,
}: {
  title: string;
  subtitle?: string;
  pathyaTitle: string;
  apathyaTitle: string;
  pathya: string[];
  apathya: string[];
}) {
  const [flipped, setFlipped] = useState(false);
  const still = motionOff();

  const Face = ({
    heading, items, tone, icon: Icon, back,
  }: {
    heading: string; items: string[]; tone: "green" | "red"; icon: any; back?: boolean;
  }) => (
    <div
      className={`absolute inset-0 rounded-3xl border-2 overflow-hidden flex flex-col
        ${tone === "green" ? "bg-emerald-50 border-emerald-300" : "bg-rose-50 border-rose-300"}`}
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: back ? "rotateY(180deg)" : undefined,
      }}
    >
      <div className={`px-6 py-4 flex items-center gap-3 ${tone === "green" ? "bg-emerald-500" : "bg-rose-500"}`}>
        <Icon className="w-7 h-7 text-white shrink-0" strokeWidth={2.5} />
        <div className="min-w-0">
          <p className="text-white/80 text-xs font-semibold">{title}</p>
          <h3 className="text-white font-bold text-2xl leading-tight truncate">{heading}</h3>
        </div>
        <RotateCw className="w-5 h-5 text-white/60 ml-auto shrink-0" />
      </div>
      <ul className="flex-1 overflow-y-auto p-6 space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-lg leading-snug text-slate-800">
            <span className={`mt-2 w-2 h-2 rounded-full shrink-0 ${tone === "green" ? "bg-emerald-500" : "bg-rose-500"}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Patient view · click the card to turn it over
        </p>
        <button
          type="button"
          onClick={() => setFlipped(f => !f)}
          className="ml-auto px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" /> Turn over
        </button>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Pathya and apathya card for ${title}. Currently showing ${flipped ? apathyaTitle : pathyaTitle}. Activate to turn over.`}
        onClick={() => setFlipped(f => !f)}
        onKeyDown={e => {
          if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped(f => !f); }
        }}
        className="relative w-full cursor-pointer select-none outline-none focus-visible:ring-4 focus-visible:ring-primary/30 rounded-3xl"
        style={{ perspective: 1800, height: 460 }}
      >
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={still ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 22 }}
        >
          <Face heading={pathyaTitle} items={pathya} tone="green" icon={Check} />
          <Face heading={apathyaTitle} items={apathya} tone="red" icon={Ban} back />
        </motion.div>
      </div>

      {subtitle && <p className="text-center text-xs text-slate-400 mt-3">{subtitle}</p>}
    </div>
  );
}

export default PathyaFlipCard;
