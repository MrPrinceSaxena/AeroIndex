import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plane, ArrowRight, Menu, X, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ThemeToggle } from "../ThemeToggle";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 shadow-xs py-3"
          : "bg-gradient-to-b from-white/95 via-white/80 to-transparent dark:from-slate-950/95 dark:via-slate-950/80 dark:to-transparent py-4"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Concise Modern Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-xs transition-transform group-hover:scale-105">
              <Plane className="h-4.5 w-4.5" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              APIx
            </span>
          </Link>

          {/* Simple Clean Desktop Menu */}
          <nav className="hidden md:flex items-center gap-1 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 px-3 py-1.5 backdrop-blur-md">
            <a
              href="#overview"
              className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white transition-colors rounded-full"
            >
              Overview
            </a>
            <a
              href="#features"
              className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white transition-colors rounded-full"
            >
              Features
            </a>
            <a
              href="#india-map"
              className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white transition-colors rounded-full flex items-center gap-1.5"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
              </span>
              Radar
            </a>
            <a
              href="#pipeline"
              className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white transition-colors rounded-full"
            >
              Pipeline
            </a>
            <a
              href="#methodology"
              className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white transition-colors rounded-full"
            >
              Methodology
            </a>
          </nav>

          {/* Right Header Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            <ThemeToggle />

            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 transition-all hover:bg-slate-200/70"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-[10px] font-bold text-white">
                    {user.avatar_initials || user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold max-w-[100px] truncate text-xs">{user.name}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 p-3 shadow-xl backdrop-blur-2xl animate-in fade-in duration-150 z-50">
                    <div className="pb-2.5 border-b border-slate-100 dark:border-white/5">
                      <div className="font-bold text-slate-900 dark:text-white text-xs truncate">{user.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                    </div>
                    <div className="pt-2 space-y-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate("/overview");
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-left"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-left"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => navigate(isAuthenticated ? "/overview" : "/login?redirect=/overview")}
              className="group inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{isAuthenticated ? "Live Console" : "Launch App"}</span>
              <ArrowRight className="h-3.5 w-3.5 transform transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="mt-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 p-4 backdrop-blur-2xl shadow-xl md:hidden animate-in fade-in duration-150">
            <div className="flex flex-col space-y-2">
              <a
                href="#overview"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Overview
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Features
              </a>
              <a
                href="#india-map"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Live Radar
              </a>
              <a
                href="#pipeline"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Pipeline
              </a>
              <a
                href="#methodology"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Methodology
              </a>
              
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2">
                {!isAuthenticated ? (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Sign In
                  </Link>
                ) : null}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(isAuthenticated ? "/overview" : "/login?redirect=/overview");
                  }}
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-center text-sm font-bold text-white shadow-xs"
                >
                  {isAuthenticated ? "Enter Console →" : "Launch App →"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
