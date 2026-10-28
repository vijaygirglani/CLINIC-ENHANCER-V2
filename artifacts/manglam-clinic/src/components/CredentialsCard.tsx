/**
 * CredentialsCard — the doctor's card, for the waiting-room screen.
 *
 * Patients stare at that screen for twenty minutes. Between tokens this
 * slides over and tells them who is treating them: name, qualification,
 * what he treats, the clinic's hours and how to reach it. It is the one
 * thing on the screen that quietly builds trust rather than passing time.
 *
 * It never covers the token itself — it takes the lower half of the screen,
 * so a patient glancing up for their number still sees it.
 *
 * Everything comes from the clinic settings that already drive the printed
 * prescription, so there is nothing new to fill in. Any line left blank in
 * those settings is simply left out rather than printed empty.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Clock, Phone, MapPin, Stethoscope, BadgeCheck } from "lucide-react";
import { motionOff } from "@/components/AnimatedNumber";
import type { DisplayClinic, DisplayLang } from "@/lib/displaySettings";
import { DISPLAY_TEXT } from "@/lib/displaySettings";

export interface CredentialsCardProps {
  show: boolean;
  clinic: DisplayClinic;
  lang: DisplayLang;
  look: { background: string; panel: string; ink: string; muted: string; accent: string };
}

export function CredentialsCard({ show, clinic, lang, look }: CredentialsCardProps) {
  const still = motionOff();
  const T = DISPLAY_TEXT[lang];

  // A row only appears when there is something to put in it.
  const rows = [
    clinic.timing && { icon: Clock, label: T.cardTimings, value: clinic.timing },
    clinic.phone && { icon: Phone, label: T.cardContact, value: clinic.phone },
    clinic.address && { icon: MapPin, label: "", value: clinic.address },
  ].filter(Boolean) as Array<{ icon: any; label: string; value: string }>;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={still ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={still ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="absolute inset-x-0 bottom-0 z-20 p-6 md:p-10"
        >
          {/* The theme's own background, so it is fully opaque. The translucent
              panel colour let the footer text ghost through behind it. */}
          <div
            className="rounded-3xl px-8 py-7 md:px-12 md:py-9 overflow-hidden relative"
            style={{
              background: look.background,
              boxShadow: `0 0 0 1px ${look.accent}44, 0 -18px 40px rgba(0,0,0,0.25)`,
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: look.panel }} />
            <div className="relative flex items-start gap-6">
              {/* avatar initial */}
              <div
                className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center font-display font-extrabold text-4xl md:text-5xl"
                style={{ background: `${look.accent}22`, color: look.accent }}
              >
                {clinic.logoLetter}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="text-[11px] md:text-xs font-bold uppercase mb-1"
                  style={{ color: look.muted }}
                >
                  {T.cardAbout}
                </p>

                <h2
                  className="font-display font-extrabold text-3xl md:text-5xl leading-tight truncate"
                  style={{ color: look.ink }}
                >
                  {clinic.doctorName}
                </h2>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                  {clinic.qualification && (
                    <span
                      className="inline-flex items-center gap-1.5 text-lg md:text-2xl font-semibold"
                      style={{ color: look.accent }}
                    >
                      <BadgeCheck className="w-5 h-5 md:w-6 md:h-6" />
                      {clinic.qualification}
                    </span>
                  )}
                  {clinic.specialization && (
                    <span
                      className="inline-flex items-center gap-1.5 text-base md:text-xl"
                      style={{ color: look.muted }}
                    >
                      <Stethoscope className="w-4 h-4 md:w-5 md:h-5" />
                      {clinic.specialization}
                    </span>
                  )}
                </div>

                {rows.length > 0 && (
                  <div className="flex flex-wrap gap-x-10 gap-y-2 mt-5">
                    {rows.map(({ icon: Icon, label, value }, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <Icon className="w-5 h-5 shrink-0" style={{ color: look.accent }} />
                        <div className="leading-tight">
                          {label && (
                            <p className="text-[10px] font-bold uppercase" style={{ color: look.muted }}>
                              {label}
                            </p>
                          )}
                          <p className="text-lg md:text-2xl font-semibold" style={{ color: look.ink }}>
                            {value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CredentialsCard;
