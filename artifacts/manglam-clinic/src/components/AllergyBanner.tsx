/**
 * AllergyBanner — the one thing on the screen that must never be missed.
 *
 * There was no allergy field anywhere in the app. Chronic conditions had
 * twenty preset tags; the one fact that can actually hurt a patient had none.
 *
 * When an allergy is recorded it shows as a red banner that pulses once on
 * load, above everything else about that patient. When there is none, it is a
 * quiet grey line you can click to add one — so it never nags, but it is
 * always one click away.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Plus, X, Check } from "lucide-react";
import { getAllergy, setAllergy } from "@/lib/clinicExtras";
import { motionOff } from "@/components/AnimatedNumber";

export function AllergyBanner({ mobile }: { mobile: string }) {
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setText(mobile ? getAllergy(mobile) : "");
    setEditing(false);
  }, [mobile]);

  if (!mobile) return null;

  const commit = () => {
    const t = draft.trim();
    setAllergy(mobile, t);
    setText(t);
    setEditing(false);
  };

  const still = motionOff();

  if (editing) {
    return (
      <div className="mt-2 flex items-center gap-1.5">
        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          placeholder="e.g. penicillin, sulpha, dust"
          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-rose-300 text-sm outline-none focus:ring-4 focus:ring-rose-100"
        />
        <button type="button" onClick={commit} aria-label="Save allergy"
          className="p-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => setEditing(false)} aria-label="Cancel"
          className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {text ? (
        <motion.button
          key="has"
          type="button"
          onClick={() => { setDraft(text); setEditing(true); }}
          initial={still ? false : { opacity: 0, scale: 0.96 }}
          animate={still ? {} : { opacity: 1, scale: [0.96, 1.04, 1] }}
          transition={{ duration: 0.5, times: [0, 0.6, 1] }}
          className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 border-2 border-rose-300 text-left hover:bg-rose-100 transition-colors"
          title="Click to edit"
        >
          <span className="relative flex w-2.5 h-2.5 shrink-0">
            {!still && (
              <motion.span
                className="absolute inline-flex w-full h-full rounded-full bg-rose-400"
                animate={{ scale: [1, 2.2, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-rose-500" />
          </span>
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-500 leading-none">Allergy</span>
            <span className="block text-sm font-bold text-rose-800 truncate">{text}</span>
          </span>
        </motion.button>
      ) : (
        <motion.button
          key="none"
          type="button"
          onClick={() => { setDraft(""); setEditing(true); }}
          initial={still ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add allergy
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default AllergyBanner;
