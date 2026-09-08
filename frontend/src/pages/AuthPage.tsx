import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Plane,
  Lock,
  Mail,
  User,
  Building,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Landmark,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const redirectTarget = searchParams.get("redirect") || "/overview";

  const navigate = useNavigate();
  const { login, signup, loginAsPersona, isAuthenticated } = useAuth();

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("MoSPI Statistical Analyst");
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTarget]);

  // Calculate password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "None", color: "bg-slate-200" };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500" };
    if (score === 2) return { score: 2, label: "Moderate", color: "bg-amber-500" };
    if (score === 3) return { score: 3, label: "Strong", color: "bg-blue-600" };
    return { score: 4, label: "Institutional Grade", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, password);
        setSuccessMsg("Signed in successfully. Redirecting...");
        navigate(redirectTarget, { replace: true });
      } else {
        if (!name.trim()) throw new Error("Please enter your full name.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        await signup({ name, email, password, organization, role });
        setSuccessMsg("Account registered successfully. Redirecting...");
        navigate(redirectTarget, { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickPersona = async (personaKey: string) => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await loginAsPersona(personaKey);
      setSuccessMsg("Fast-track authenticated as official persona.");
      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || "Demo login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-gradient-to-b from-sky-50/50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white overflow-hidden font-sans">
      
      {/* Background Runway Atmosphere */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/assets/images/hero-bright-runway.jpg"
          alt="Aviation runway takeoff backdrop"
          className="h-full w-full object-cover object-center opacity-40 brightness-105 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-white/40 dark:from-slate-950 dark:via-slate-950/80 dark:to-slate-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.15),transparent_70%)]" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/25 transition-transform group-hover:scale-105">
            <Plane className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">APIx</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Air Fare Price Index India
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <Link
            to="/"
            className="px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-white text-slate-700 dark:text-white transition-all shadow-xs"
          >
            ← Return to Landing Page
          </Link>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 w-full my-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Evaluator Quick Pass / Official Personas */}
          <div className="lg:col-span-5 flex flex-col space-y-5">
            <div className="rounded-3xl border border-blue-200/80 dark:border-white/15 bg-white/90 dark:bg-slate-900/75 p-6 sm:p-7 backdrop-blur-2xl shadow-xl shadow-blue-950/5">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-600 dark:text-cyan-300 mb-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>SIH Jury & Evaluator Quick Pass</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">
                One-Click Role Authentication
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 mb-5 leading-relaxed font-medium">
                Test role-based views and clearances without typing manual credentials:
              </p>

              {/* Persona Fast Login Buttons */}
              <div className="space-y-2.5">
                {[
                  {
                    key: "mospi",
                    name: "Dr. Rajiv Sharma",
                    role: "MoSPI Senior Statistical Officer",
                    org: "Ministry of Statistics & PI",
                    badge: "Level 3 Clearance",
                    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200",
                  },
                  {
                    key: "dgca",
                    name: "Ananya Verma",
                    role: "DGCA Tariff Compliance Lead",
                    org: "Directorate General of Civil Aviation",
                    badge: "Rule 135 Unit",
                    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200",
                  },
                  {
                    key: "rbi",
                    name: "Dr. Arvind Nambiar",
                    role: "RBI Monetary Policy Analyst",
                    org: "Reserve Bank of India",
                    badge: "Inflation Cell",
                    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200",
                  },
                  {
                    key: "airline",
                    name: "Siddharth Kapoor",
                    role: "IndiGo Revenue Manager",
                    org: "Commercial Air Transport",
                    badge: "Yield Access",
                    badgeColor: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200",
                  },
                  {
                    key: "researcher",
                    name: "Prof. Vikramaditya Sen",
                    role: "Aviation Economics Researcher",
                    org: "IIT Delhi Center for Transport",
                    badge: "Open API",
                    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200",
                  },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleQuickPersona(p.key)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 hover:bg-blue-50/80 dark:bg-white/5 dark:hover:bg-white/10 text-left transition-all duration-200 hover:border-blue-300 hover:scale-[1.01] group shadow-2xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {p.name}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${p.badgeColor}`}>
                          {p.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{p.role}</div>
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white dark:bg-white/10 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0 shadow-2xs">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Statutory Notice */}
              <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                <Landmark className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>Ministry of Civil Aviation & MoSPI Compliant</span>
              </div>
            </div>
          </div>

          {/* Right Column: Master Auth Card (Sign In / Register) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/20 bg-white/95 dark:bg-slate-900/80 p-7 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-blue-950/10">
              
              {/* Card Header & Tab Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
                <div>
                  <h3 className="text-2xl font-black text-slate-950 dark:text-white">
                    {mode === "login" ? "Account Sign In" : "Register Credentials"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    {mode === "login"
                      ? "Access real-time airfare indices, elasticity feeds, and API keys"
                      : "Create official credentials for government and economic research"}
                  </p>
                </div>

                {/* Animated Mode Pill Switcher */}
                <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setErrorMsg(null);
                    }}
                    className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      mode === "login"
                        ? "bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setErrorMsg(null);
                    }}
                    className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      mode === "signup"
                        ? "bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    Register
                  </button>
                </div>
              </div>

              {/* Status Alert Messages */}
              {errorMsg && (
                <div className="mt-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mt-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Form Element */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                
                {/* Sign Up Specific Fields */}
                {mode === "signup" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Dr. Rajesh Kumar"
                          className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Organization
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={organization}
                            onChange={(e) => setOrganization(e.target.value)}
                            placeholder="e.g. MoSPI / RBI / University"
                            className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Functional Role
                        </label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-none transition-all"
                        >
                          <option value="MoSPI Statistical Analyst">MoSPI Statistical Analyst</option>
                          <option value="DGCA Tariff Monitoring Officer">DGCA Tariff Monitoring Officer</option>
                          <option value="RBI Monetary Policy Economist">RBI Monetary Policy Economist</option>
                          <option value="Airline Network Yield Manager">Airline Network Yield Manager</option>
                          <option value="Aviation Economics Researcher">Aviation Economics Researcher</option>
                          <option value="Enterprise Travel Procurement">Enterprise Travel Procurement</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Official Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@organization.gov.in / edu / com"
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => alert("Demo mode: Use any of the Quick Persona logins or enter your password.")}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-none transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter for Signup */}
                  {mode === "signup" && password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-500">Security Strength:</span>
                        <span className="text-slate-800 dark:text-slate-200">{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full flex-1 rounded-full transition-all ${
                              step <= strength.score ? strength.color : "bg-slate-200 dark:bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Statutory Checkbox for Signup */}
                {mode === "signup" && (
                  <div className="pt-2 flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                    <input type="checkbox" required id="terms" className="mt-0.5 rounded text-blue-600" />
                    <label htmlFor="terms">
                      I agree to the National Airfare Index Data Access Terms, Rule 135 tariff compliance monitoring protocols, and MoSPI statistical guidelines.
                    </label>
                  </div>
                )}

                {/* Submit CTA Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-cyan-500/35 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70"
                  >
                    {submitting ? (
                      <span>Verifying Credentials...</span>
                    ) : (
                      <>
                        <span>{mode === "login" ? "Sign In to APIx Platform" : "Create Official Account"}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>

              </form>

              {/* Bottom Card Footer */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/10 text-center text-xs text-slate-500">
                {mode === "login" ? (
                  <span>
                    Don't have an official account yet?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setErrorMsg(null);
                      }}
                      className="font-bold text-blue-600 hover:text-blue-700"
                    >
                      Register here
                    </button>
                  </span>
                ) : (
                  <span>
                    Already registered?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setErrorMsg(null);
                      }}
                      className="font-bold text-blue-600 hover:text-blue-700"
                    >
                      Sign in directly
                    </button>
                  </span>
                )}
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer Attribution Bar */}
      <footer className="relative z-20 py-4 border-t border-slate-200/60 dark:border-white/10 text-center text-[11px] text-slate-500">
        <span>APIx Authentication Gateway • Smart India Hackathon PS 26056 • Ministry of Civil Aviation</span>
      </footer>

    </div>
  );
}
