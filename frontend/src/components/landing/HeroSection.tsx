import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Plane,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Compass,
  ShieldCheck,
  LineChart,
  Waypoints,
  Table2,
  Landmark,
  BookOpen,
  ChevronRight,
  Zap,
} from "lucide-react";

export function HeroSection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedRoute, setSelectedRoute] = useState<"DEL-BOM" | "DEL-BLR" | "BOM-BLR">("DEL-BOM");

  const goProtected = (path: string) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(path)}`);
    }
  };

  const routeData = {
    "DEL-BOM": {
      name: "DEL → BOM",
      origin: "Delhi (DEL)",
      destination: "Mumbai (BOM)",
      fare: "₹6,230",
      change: "+8.4%",
      isUp: true,
      routesTracked: 142,
      points: [42, 48, 45, 52, 50, 58, 62, 59, 68, 74, 71, 79],
      advanceLead: "T+7 Tactical Lead",
    },
    "DEL-BLR": {
      name: "DEL → BLR",
      origin: "Delhi (DEL)",
      destination: "Bengaluru (BLR)",
      fare: "₹5,840",
      change: "-3.2%",
      isUp: false,
      routesTracked: 118,
      points: [60, 58, 55, 53, 56, 52, 49, 51, 48, 46, 47, 44],
      advanceLead: "T+30 Advance Lead",
    },
    "BOM-BLR": {
      name: "BOM → BLR",
      origin: "Mumbai (BOM)",
      destination: "Bengaluru (BLR)",
      fare: "₹4,120",
      change: "+2.1%",
      isUp: true,
      routesTracked: 96,
      points: [35, 36, 38, 37, 39, 41, 40, 42, 43, 42, 44, 45],
      advanceLead: "T+7 Tactical Lead",
    },
  };

  const current = routeData[selectedRoute];

  return (
    <section
      id="overview"
      className="relative min-h-[95vh] pt-24 sm:pt-28 pb-14 overflow-hidden bg-gradient-to-b from-sky-50/50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-between"
    >
      {/* Background High-Impact Runway Airliner Takeoff Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/assets/images/hero-bright-runway.jpg"
          alt="Airliner taking off on illuminated airport runway with sky and city"
          className="h-full w-full object-cover object-center opacity-90 brightness-[0.98] contrast-[1.03] scale-100 transition-transform duration-1000"
        />
        {/* Luminous Light Gradients for clean text contrast and airy atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent dark:from-slate-950/95 dark:via-slate-950/70 dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/40 dark:from-slate-950 dark:via-transparent dark:to-slate-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.12),transparent_70%)]" />
      </div>

      {/* Hero Content Grid */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center pt-2 sm:pt-4">
          
          {/* Left Column: Hero Copy & Calls to Action */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-5 text-left">
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50/90 dark:bg-blue-950/60 px-4 py-1.5 backdrop-blur-xl shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              <span className="text-[11px] font-black tracking-widest uppercase text-blue-700 dark:text-cyan-300">
                Real-Time Aviation Intelligence
              </span>
            </div>

            {/* Main Catchy Headline */}
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.08]">
              India’s Skies, <br />
              <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent drop-shadow-xs">
                Smarter Insights.
              </span>
            </h1>

            {/* Supporting Subheadline */}
            <p className="max-w-2xl text-base sm:text-lg text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
              APIx delivers real-time air fare intelligence with reliable data, transparent methodology, and actionable insights for a more connected India. Powered by DGCA passenger traffic weighting and cryptographic provenance.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => goProtected("/overview")}
                className="group relative inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{isAuthenticated ? "Enter Console" : "Sign In & Explore"}</span>
                <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>

              <button
                onClick={() => goProtected("/index")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/10 hover:bg-white px-6 py-3.5 text-sm font-bold text-slate-900 dark:text-white backdrop-blur-xl shadow-xs transition-all duration-300 hover:border-blue-400 hover:scale-[1.02]"
              >
                <LineChart className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                <span>View Air Fare Index</span>
              </button>

              <a
                href="#india-map"
                className="inline-flex items-center gap-1.5 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white transition-colors"
              >
                <Compass className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
                <span>Live Route Radar</span>
                <ChevronRight className="h-3 w-3 text-slate-400" />
              </a>
            </div>

            {/* Micro Trust Indicators */}
            <div className="pt-3 flex flex-wrap items-center gap-5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200/80 dark:border-white/10 w-full">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>RFC 9309 Compliant Scraping</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                <Landmark className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>DGCA FY24 Traffic Weighted</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Zero Base Drift Chain-Linking</span>
              </div>
            </div>

          </div>

          {/* Right Column: Floating Luminous Translucent Glass Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              
              {/* Decorative Soft Glow */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-400/25 to-cyan-300/25 blur-xl opacity-80" />

              {/* Luminous Frosted Glass Card */}
              <div className="relative rounded-3xl border border-white/80 dark:border-white/20 bg-white/85 dark:bg-slate-900/75 p-6 sm:p-7 backdrop-blur-2xl shadow-xl shadow-blue-900/10 dark:shadow-black/60 animate-float">
                
                {/* Card Top: Route Selector & Live Indicator */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                      <Plane className="h-4 w-4" />
                    </span>
                    <div className="flex gap-1.5 bg-slate-100 dark:bg-white/10 p-1 rounded-xl">
                      {(["DEL-BOM", "DEL-BLR", "BOM-BLR"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setSelectedRoute(r)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                            selectedRoute === r
                              ? "bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xs"
                              : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Live Quote</span>
                  </div>
                </div>

                {/* Card Fare Highlight */}
                <div className="mt-5 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Weighted Corridor Fare
                    </span>
                    <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white mt-0.5">
                      {current.fare}
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black border ${
                      current.isUp
                        ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30"
                        : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                    }`}
                  >
                    {current.isUp ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    <span>{current.change}</span>
                  </div>
                </div>

                {/* Mini Sparkline Curve */}
                <div className="mt-4 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    <span className="font-semibold">30-Day Rate Trajectory</span>
                    <span className="text-blue-600 dark:text-cyan-300 font-bold">{current.advanceLead}</span>
                  </div>
                  <div className="h-16 w-full flex items-end">
                    <svg className="h-full w-full overflow-visible" viewBox="0 0 120 40">
                      <defs>
                        <linearGradient id="brightCurveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`M 0,${40 - (current.points[0] * 35) / 100} ` +
                          current.points
                            .slice(1)
                            .map((p, i) => `L ${(i + 1) * 10.9},${40 - (p * 35) / 100}`)
                            .join(" ")}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <polygon
                        points={
                          `0,${40 - (current.points[0] * 35) / 100} ` +
                          current.points
                            .slice(1)
                            .map((p, i) => `${(i + 1) * 10.9},${40 - (p * 35) / 100}`)
                            .join(" ") +
                          ` 120,40 0,40`
                        }
                        fill="url(#brightCurveGrad)"
                      />
                    </svg>
                  </div>
                </div>

                {/* Aviation Feature Badges */}
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 p-2.5 shadow-2xs">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">Live Fare Trends</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">High-Frequency Feeds</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 p-2.5 shadow-2xs">
                    <Compass className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">Route Insights</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{current.routesTracked} Corridors</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 p-2.5 shadow-2xs">
                    <Landmark className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">Policy Benchmarks</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">DGCA & CPI Aligned</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 p-2.5 shadow-2xs">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">Reliable Data</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Quarantine Isolated</div>
                    </div>
                  </div>
                </div>

                {/* Card Footer CTA */}
                <button
                  onClick={() => goProtected("/routes")}
                  className="mt-5 w-full flex items-center justify-between rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/40 border border-blue-200 dark:border-blue-400/30 p-2.5 text-xs font-bold text-blue-700 dark:text-cyan-300 transition-colors"
                >
                  <span>Analyze {selectedRoute} corridor depth</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Dock: 6 Translucent Frosted Glass Quick-Access Tiles */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full mt-10 lg:mt-14">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <button
            onClick={() => goProtected("/index")}
            className="group flex flex-col items-start p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 hover:bg-white hover:border-blue-400/60 backdrop-blur-xl transition-all duration-300 text-left shadow-xs hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-cyan-400 mb-2 group-hover:scale-110 transition-transform">
              <LineChart className="h-4 w-4" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Air Fare Index</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Track trends</div>
          </button>

          <button
            onClick={() => goProtected("/routes")}
            className="group flex flex-col items-start p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 hover:bg-white hover:border-indigo-400/60 backdrop-blur-xl transition-all duration-300 text-left shadow-xs hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 mb-2 group-hover:scale-110 transition-transform">
              <Waypoints className="h-4 w-4" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Route Analytics</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Understand markets</div>
          </button>

          <button
            onClick={() => goProtected("/explorer")}
            className="group flex flex-col items-start p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 hover:bg-white hover:border-cyan-400/60 backdrop-blur-xl transition-all duration-300 text-left shadow-xs hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 mb-2 group-hover:scale-110 transition-transform">
              <Table2 className="h-4 w-4" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Data Explorer</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Dive deeper</div>
          </button>

          <button
            onClick={() => goProtected("/data-quality")}
            className="group flex flex-col items-start p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 hover:bg-white hover:border-emerald-400/60 backdrop-blur-xl transition-all duration-300 text-left shadow-xs hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Data Quality</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Validated & trusted</div>
          </button>

          <button
            onClick={() => goProtected("/benchmarking")}
            className="group flex flex-col items-start p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 hover:bg-white hover:border-amber-400/60 backdrop-blur-xl transition-all duration-300 text-left shadow-xs hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-110 transition-transform">
              <Landmark className="h-4 w-4" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">DGCA Benchmarking</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Aligned with standards</div>
          </button>

          <button
            onClick={() => goProtected("/methodology")}
            className="group flex flex-col items-start p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 hover:bg-white hover:border-purple-400/60 backdrop-blur-xl transition-all duration-300 text-left shadow-xs hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 mb-2 group-hover:scale-110 transition-transform">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Policy & Research</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Insights for impact</div>
          </button>

        </div>
      </div>
    </section>
  );
}
