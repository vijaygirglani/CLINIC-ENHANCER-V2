import { Link, useLocation } from "wouter";
import {
  UserPlus, BookOpen, Leaf, Code2, BookMarked, ClipboardList, MessageCircle, Menu, X,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { to: "/",                  label: "Patient Registration", icon: UserPlus },
  { to: "/daily-register",    label: "Daily Register",       icon: BookOpen },
  { to: "/ayurvedic-register",label: "Ayurvedic Register",   icon: Leaf },
  { to: "/complaint-codes",   label: "Complaint Codes",      icon: Code2 },
  { to: "/advice-codes",      label: "Advice Master",        icon: ClipboardList },
  { to: "/broadcast",         label: "Broadcast",            icon: MessageCircle },
  { to: "/pathya-apathya",    label: "Pathya-Apathya",       icon: BookMarked },
];

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

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1 ml-4">
              {NAV.map(({ to, label, icon: Icon }) => {
                const active = location === to;
                return (
                  <Link key={to} href={to}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
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
      <main className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
