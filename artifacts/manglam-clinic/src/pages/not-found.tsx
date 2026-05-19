import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">404</h1>
        <p className="text-slate-500 mb-6">Page not found</p>
        <Link href="/" className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors">
          Go Home
        </Link>
      </div>
    </div>
  );
}
