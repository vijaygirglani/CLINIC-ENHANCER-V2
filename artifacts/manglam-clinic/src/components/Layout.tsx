import { Link, useLocation } from "wouter";
import {
  UserPlus, BookOpen, Leaf, Code2, BookMarked, ClipboardList, MessageCircle, Menu, X,
  Package, Wallet, Users, Hourglass,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getQueueStats, subscribeQueue } from "@/lib/queue";
import { motionOff } from "@/components/AnimatedNumber";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IdleScreen } from "@/components/IdleScreen";
import { ShortcutRail } from "@/components/ShortcutRail";
import { motion } from "framer-motion";

const NAV = [
  { to: "/",                  label: "Patient Registration", icon: UserPlus },
  { to: "/queue",             label: "Token Queue",          icon: Users },
  { to: "/daily-register",    label: "Daily Register",       icon: BookOpen },
  { to: "/ayurvedic-register",label: "Ayurvedic Register",   icon: Leaf },
  { to: "/complaint-codes",   label: "Complaint Codes",      icon: Code2 },
  { to: "/advice-codes",      label: "Advice Master",        icon: ClipboardList },
  { to: "/broadcast",         label: "Broadcast",            icon: MessageCircle },
  { to: "/pathya-apathya",    label: "Pathya-Apathya",       icon: BookMarked },
  { to: "/inventory",         label: "Inventory",            icon: Package },
  { to: "/expenses",          label: "Expenses",             icon: Wallet },
];

/**
 * Live "N waiting" pill in the header, so the doctor can see the queue
 * building up from any page without switching to it. Pops when the number
 * changes, and disappears entirely when nobody is waiting.
 */
function QueueBadge() {
  const [, setTick] = useState(0);
  const [bump, setBump] = useState(0);
  const [prev, setPrev] = useState(0);

  useEffect(() => {
    const un = subscribeQueue(() => setTick(t => t + 1));
    const i = setInterval(() => setTick(t => t + 1), 20000);
    return () => { un(); clearInterval(i); };
  }, []);

  const stats = getQueueStats();
  const waiting = stats.waiting;

  useEffect(() => {
    if (waiting !== prev) {
      setPrev(waiting);
      if (waiting > prev && !motionOff()) setBump(b => b + 1);
    }
  }, [waiting, prev]);

  if (waiting === 0 && !stats.nowServing) return null;

  const hot = stats.longestWaitMin >= 30;

  return (
    <Link href="/queue"
      className={`shrink-0 flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-xl text-xs font-bold transition-colors
        ${hot ? "bg-rose-100 text-rose-700 hover:bg-rose-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
      title={stats.nowServing ? `Now serving token ${stats.nowServing.token}` : "Open the token queue"}>
      <Hourglass className="w-3.5 h-3.5" />
      <span
        key={bump}
        className="tabular-nums"
        style={bump && !motionOff() ? { animation: "cp-badge-pop 0.4s ease-out" } : undefined}>
        {waiting}
      </span>
      <span className="hidden 2xl:inline font-semibold opacity-70">waiting</span>
      {stats.nowServing && (
        <span className="hidden 2xl:inline pl-2 ml-0.5 border-l border-current/25 font-semibold opacity-70">
          #{stats.nowServing.token} in
        </span>
      )}
      <style>{`@keyframes cp-badge-pop{0%{transform:scale(1)}40%{transform:scale(1.5)}100%{transform:scale(1)}}`}</style>
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── STICKY NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow">
                <span className="text-white font-bold text-sm">MC</span>
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-slate-900 leading-tight text-sm">Manglam Clinic</p>
                <p className="text-xs text-slate-500 leading-tight">Dr. Vijay Girglani</p>
              </div>
            </Link>

            {/* Desktop Nav — scrolls horizontally instead of overflowing off-screen */}
            <nav className="hidden lg:flex items-center gap-1 ml-4 flex-1 min-w-0 overflow-x-auto [scrollbar-width:thin] [-ms-overflow-style:none]">
              {NAV.map(({ to, label, icon: Icon }) => {
                const active = location === to;
                return (
                  <Link key={to} href={to}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0
                      ${active
                        ? "bg-primary/10 text-primary"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}>
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Live queue pill */}
            <QueueBadge />

            {/* Light / Dark / Auto */}
            <ThemeToggle />

            {/* More menu — always-visible dropdown fallback for narrower desktop windows */}
            <div className="hidden lg:block shrink-0">
              <details className="relative">
                <summary className="list-none cursor-pointer p-2 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center">
                  <Menu className="w-4 h-4" />
                </summary>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-50">
                  {NAV.map(({ to, label, icon: Icon }) => {
                    const active = location === to;
                    return (
                      <Link key={to} href={to}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all
                          ${active ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100"}`}>
                        <Icon className="w-4 h-4" />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </details>
            </div>

            {/* Mobile hamburger */}
            <button className="ml-auto lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              onClick={() => setMobileOpen(o => !o)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav dropdown */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-2 space-y-1">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = location === to;
              return (
                <Link key={to} href={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${active ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100"}`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* ── PAGE CONTENT — offset by header height ── */}
      {/* The key makes the content re-mount per route, so each section slides
          in. 150 ms and a 6 px lift: enough to feel deliberate, short enough
          that it never gets in the way of typing. */}
      <main className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={location}
          initial={motionOff() ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>

      {/* Hold Ctrl for the shortcut rail */}
      <ShortcutRail />

      {/* Clock screen after a few idle minutes — also hides patient details
          from anyone walking past the desk */}
      <IdleScreen />
    </div>
  );
}
