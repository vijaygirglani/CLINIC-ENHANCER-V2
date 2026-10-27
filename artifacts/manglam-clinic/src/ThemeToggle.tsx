/**
 * Light / Dark / Auto, as a small segmented control in the header.
 *
 * "Auto" follows Windows' own setting, so the app goes dark at sunset on its
 * own if the machine is set that way.
 */

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { getTheme, setTheme, subscribeTheme, type ThemeChoice } from "@/lib/theme";

const OPTIONS: { value: ThemeChoice; label: string; icon: any }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "auto", label: "Auto", icon: Monitor },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [choice, setChoice] = useState<ThemeChoice>(getTheme);

  useEffect(() => subscribeTheme(() => setChoice(getTheme())), []);

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="shrink-0 flex items-center gap-0.5 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = choice === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => { setTheme(value); setChoice(value); }}
            aria-pressed={active}
            aria-label={label}
            title={value === "auto" ? "Follow the computer's setting" : label}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors
              ${active
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-600 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {!compact && <span className="hidden 2xl:inline">{label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default ThemeToggle;
