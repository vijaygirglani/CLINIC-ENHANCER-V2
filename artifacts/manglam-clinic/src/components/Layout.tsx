import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Stethoscope, Users, Activity, FileText, Leaf, BookOpen, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { href: "/", label: "Patient Registration", icon: Users },
  { href: "/daily-register", label: "Daily Register", icon: Activity },
  { href: "/ayurvedic-register", label: "Ayurvedic Register", icon: Leaf },
  { href: "/complaint-codes", label: "Complaint Codes", icon: FileText },
  { href: "/pathya-apathya", label: "Pathya-Apathya", icon: BookOpen },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShowInstallBanner(false);
      setInstallPrompt(null);
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setShowInstallBanner(false);
    }
    setInstallPrompt(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50 px-4 md:px-8 py-3 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 text-white">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none text-slate-900 font-display">Manglam Clinic</h1>
              <p className="text-sm font-medium text-slate-500">Dr. Vijay Girglani</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              const isAyurvedic = item.href === "/ayurvedic-register";
              const isPathya = item.href === "/pathya-apathya";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors duration-200 z-10",
                    isActive
                      ? isAyurvedic ? "text-emerald-700" : isPathya ? "text-amber-700" : "text-primary"
                      : isAyurvedic ? "text-slate-600 hover:text-emerald-700" : isPathya ? "text-slate-600 hover:text-amber-700" : "text-slate-600 hover:text-primary",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className={cn(
                        "absolute inset-0 rounded-lg shadow-sm border -z-10",
                        isAyurvedic ? "bg-emerald-50 border-emerald-200/50" :
                        isPathya ? "bg-amber-50 border-amber-200/50" :
                        "bg-white border-slate-200/50"
                      )}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Install button (shown when browser triggers install prompt) */}
          {!installed && installPrompt && (
            <button
              onClick={handleInstall}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold shadow hover:bg-primary/90 transition-all"
            >
              <Download className="w-4 h-4" /> Install App
            </button>
          )}
        </div>
      </header>

      {/* Install Banner (mobile / bottom) */}
      {showInstallBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 print:hidden">
          <div className="bg-primary text-white rounded-2xl p-4 flex items-center justify-between shadow-2xl gap-3 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Install Manglam Clinic</p>
                <p className="text-xs text-white/80">Use offline on this PC — no internet needed</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={handleInstall}
                className="px-4 py-2 bg-white text-primary rounded-xl text-sm font-bold hover:bg-white/90 transition-all">
                Install
              </button>
              <button onClick={() => setShowInstallBanner(false)}
                className="p-2 text-white/70 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 z-10 print:p-0 print:max-w-none">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
