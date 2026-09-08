import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plane, ArrowRight, Menu, X } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { useSystemHealth } from "../../hooks/useSystemHealth";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const health = useSystemHealth();

  const isHealthy = health.data?.overall_status === "healthy" || !health.isError;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 shadow-lg shadow-blue-950/5 py-3"
          : "bg-gradient-to-b from-white/90 via-white/40 to-transparent dark:from-slate-950/80 dark:via-slate-950/30 dark:to-transparent py-4 sm:py-5"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/25 transition-transform duration-300 group-hover:scale-105">
              <Plane className="h-5 w-5 transform transition-transform group-hover:-rotate-12" />
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">APIx</span>
                <span className="hidden sm:inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-cyan-300 border border-blue-200 dark:border-blue-400/30">
                  v2.4
                </span>
              </div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Air Fare Price Index India
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-1.5 backdrop-blur-lg shadow-sm">
            <a
              href="#overview"
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-white/10 rounded-full"
            >
              Overview
            </a>
            <a
              href="#statistics"
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-white/10 rounded-full"
            >
              Impact
            </a>
            <a
              href="#features"
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-white/10 rounded-full"
            >
              Features
            </a>
            <a
              href="#india-map"
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-white/10 rounded-full flex items-center gap-1.5"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              Live Map
            </a>
            <a
              href="#pipeline"
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-white/10 rounded-full"
            >
              Pipeline
            </a>
            <a
              href="#stakeholders"
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-white/10 rounded-full"
            >
              Use Cases
            </a>
            <a
              href="#methodology"
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-white/10 rounded-full"
            >
              Methodology
            </a>
          </nav>

          {/* Right Header Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Live Indicator */}
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-300 backdrop-blur-md shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-[11px] tracking-wide uppercase">
                {isHealthy ? "Live Network Active" : "Telemetry Active"}
              </span>
            </div>

            {/* Theme Toggle */}
            <div className="text-slate-700 dark:text-white/80 hover:text-blue-600 dark:hover:text-white">
              <ThemeToggle />
            </div>

            {/* Primary Launch Dashboard CTA */}
            <button
              onClick={() => navigate("/overview")}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition-all duration-300 hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Enter Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5 transform transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="mt-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 p-5 backdrop-blur-2xl shadow-2xl md:hidden animate-in fade-in duration-200">
            <div className="flex flex-col space-y-3">
              <a
                href="#overview"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-white/10"
              >
                Overview
              </a>
              <a
                href="#statistics"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-white/10"
              >
                Impact Statistics
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-white/10"
              >
                Platform Features
              </a>
              <a
                href="#india-map"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-white/10"
              >
                Interactive Indian Aviation Map
              </a>
              <a
                href="#pipeline"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-white/10"
              >
                Data Pipeline
              </a>
              <a
                href="#stakeholders"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-white/10"
              >
                Stakeholder Solutions
              </a>
              <a
                href="#methodology"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-white/10"
              >
                Methodology & Trust
              </a>
              
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/overview");
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 text-center text-sm font-bold text-white shadow-md"
                >
                  Enter Dashboard →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
