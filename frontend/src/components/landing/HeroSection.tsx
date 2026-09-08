import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Sparkles,
  ChevronRight,
} from "lucide-react";


export function HeroSection() {
  const navigate = useNavigate();
  const [selectedRoute, setSelectedRoute] = useState<"DEL-BOM" | "DEL-BLR" | "BOM-BLR">("DEL-BOM");

  const routeData = {
    "DEL-BOM": {
      name: "DEL → BOM",
      origin: "Indira Gandhi Intl (DEL)",
      destination: "Chhatrapati Shivaji Intl (BOM)",
      fare: "₹6,230",
      change: "+8.4%",
      isUp: true,
      routesTracked: 142,
      points: [42, 48, 45, 52, 50, 58, 62, 59, 68, 74, 71, 79],
      advanceLead: "T+7 Tactical",
    },
    "DEL-BLR": {
      name: "DEL → BLR",
      origin: "Indira Gandhi Intl (DEL)",
      destination: "Kempegowda Intl (BLR)",
      fare: "₹5,840",
      change: "-3.2%",
      isUp: false,
      routesTracked: 118,
      points: [60, 58, 55, 53, 56, 52, 49, 51, 48, 46, 47, 44],
      advanceLead: "T+30 Advance",
    },
    "BOM-BLR": {
      name: "BOM → BLR",
      origin: "Chhatrapati Shivaji Intl (BOM)",
      destination: "Kempegowda Intl (BLR)",
      fare: "₹4,120",
      change: "+2.1%",
      isUp: true,
      routesTracked: 96,
      points: [35, 36, 38, 37, 39, 41, 40, 42, 43, 42, 44, 45],
      advanceLead: "T+7 Tactical",
    },
  };

  const current = routeData[selectedRoute];

  return (
    <section
      id="overview"
      className="relative min-h-screen pt-28 pb-16 overflow-hidden bg-slate-950 flex flex-col justify-between"
    >
      {/* Background Cinematic Atmosphere with Airplane Window view */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/images/hero-plane-window.jpg"
          alt="Aviation sky view from airplane window"
          className="h-full w-full object-cover object-center opacity-60 mix-blend-luminosity brightness-75 scale-105 transform animate-pulse-slow"
        />
        {/* Layered Gradient Overlays for readability and glass depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.25),transparent_60%)]" />
      </div>

      {/* Thin Glowing Flight Trajectories SVG */}
      <svg
        className="absolute inset-0 h-full w-full z-0 pointer-events-none opacity-40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="flightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path
          d="M -100 300 Q 400 100, 900 350 T 1800 200"
          fill="none"
          stroke="url(#flightGrad)"
          strokeWidth="1.5"
          className="flight-path-animated"
        />
        <path
          d="M 200 800 Q 700 400, 1300 650 T 2000 450"
          fill="none"
          stroke="url(#flightGrad)"
          strokeWidth="1.5"
          className="flight-path-animated"
          style={{ animationDuration: "35s" }}
        />
      </svg>

      {/* Main Content Hero Grid */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center pt-4 lg:pt-8">
          
          {/* Left Column: Hero Text & Call to Actions */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 text-left">
            
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/40 px-3.5 py-1.5 backdrop-blur-xl shadow-lg shadow-cyan-950/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <span className="text-[11px] font-bold tracking-widest uppercase text-cyan-300">
                Real-Time. Reliable. Transparent.
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black tracking-tight text-white leading-[1.08]">
              Turning Aviation Data <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-white bg-clip-text text-transparent glow-text">
                into Action.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="max-w-2xl text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
              APIx transforms air-fare and aviation data into transparent, reliable, and actionable intelligence for a more connected India. Powered by DGCA traffic weights and cryptographic provenance.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => navigate("/overview")}
                className="group relative inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-500/25 transition-all duration-300 hover:shadow-cyan-500/35 hover:scale-[1.03] active:scale-[0.98]"
              >
                <span>Explore APIx</span>
                <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>

              <button
                onClick={() => navigate("/index")}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/40 hover:scale-[1.02]"
              >
                <LineChart className="h-4 w-4 text-cyan-400" />
                <span>View Air Fare Index</span>
              </button>

              <a
                href="#india-map"
                className="inline-flex items-center gap-1.5 px-4 py-3 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <span>Live Route Radar</span>
                <ChevronRight className="h-3.5 w-3.5 text-cyan-400" />
              </a>
            </div>

            {/* Micro Trust Indicators */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400 border-t border-white/10 w-full">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>RFC 9309 Compliant Scraping</span>
              </div>
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-blue-400" />
                <span>Official DGCA Pax Weighted</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>Zero Base Drift Chain-Linking</span>
              </div>
            </div>

          </div>

          {/* Right Column: Floating Translucent Glass Card (Matches Reference Image) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              
              {/* Decorative Background Glow Blur */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600/40 to-cyan-500/40 blur-2xl opacity-70 animate-pulse-slow" />

              {/* The Master Frosted Glass Card */}
              <div className="relative rounded-3xl border border-white/20 bg-slate-900/60 p-6 sm:p-7 backdrop-blur-2xl shadow-2xl shadow-black/60 animate-float">
                
                {/* Card Top: Route Selector & Live Indicator */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-cyan-400 border border-blue-400/30">
                      <Plane className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex gap-1.5">
                        {(["DEL-BOM", "DEL-BLR", "BOM-BLR"] as const).map((r) => (
                          <button
                            key={r}
                            onClick={() => setSelectedRoute(r)}
                            className={`text-xs px-2.5 py-1 rounded-md font-bold transition-all ${
                              selectedRoute === r
                                ? "bg-cyan-500/30 text-cyan-300 border border-cyan-400/50"
                                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Live Quote</span>
                  </div>
                </div>

                {/* Card Fare Highlight */}
                <div className="mt-5 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Weighted Corridor Fare
                    </span>
                    <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-0.5">
                      {current.fare}
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold border ${
                      current.isUp
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
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
                <div className="mt-4 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span>30-Day Rate Trajectory</span>
                    <span className="text-cyan-300 font-semibold">{current.advanceLead}</span>
                  </div>
                  <div className="h-16 w-full flex items-end">
                    <svg className="h-full w-full overflow-visible" viewBox="0 0 120 40">
                      <defs>
                        <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`M 0,${40 - (current.points[0] * 35) / 100} ` +
                          current.points
                            .slice(1)
                            .map((p, i) => `L ${(i + 1) * 10.9},${40 - (p * 35) / 100}`)
                            .join(" ")}
                        fill="none"
                        stroke="#38bdf8"
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
                        fill="url(#curveGradient)"
                      />
                    </svg>
                  </div>
                </div>

                {/* Believable Aviation Insights Grid (Matching Reference Photo) */}
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md">
                    <Clock className="h-4 w-4 text-cyan-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">Live Fare Trends</div>
                      <div className="text-[10px] text-slate-400">High-Frequency Feeds</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md">
                    <Compass className="h-4 w-4 text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">Route Insights</div>
                      <div className="text-[10px] text-slate-400">{current.routesTracked} Routes Tracked</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md">
                    <Landmark className="h-4 w-4 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">Policy Benchmarks</div>
                      <div className="text-[10px] text-slate-400">DGCA & CPI Aligned</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md">
                    <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">Reliable Data</div>
                      <div className="text-[10px] text-slate-400">Strict Quarantine View</div>
                    </div>
                  </div>
                </div>

                {/* Card Footer CTA */}
                <button
                  onClick={() => navigate("/routes")}
                  className="mt-5 w-full flex items-center justify-between rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/30 p-2.5 text-xs font-semibold text-cyan-300 transition-colors"
                >
                  <span>Analyze {selectedRoute} corridor depth</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Dock: 6 Translucent Quick-Access Feature Tiles (Matching Reference Layout) */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full mt-12 lg:mt-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <button
            onClick={() => navigate("/index")}
            className="group flex flex-col items-start p-3.5 rounded-2xl border border-white/10 bg-slate-900/50 hover:bg-white/10 hover:border-cyan-400/40 backdrop-blur-xl transition-all duration-300 text-left hover:-translate-y-1"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-cyan-400 mb-2 group-hover:scale-110 transition-transform">
              <LineChart className="h-4 w-4" />
            </div>
            <div className="text-xs font-bold text-white">Air Fare Index</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Track trends</div>
          </button>

          <button
            onClick={() => navigate("/routes")}
            className="group flex flex-col items-start p-3.5 rounded-2xl border border-white/10 bg-slate-900/50 hover:bg-white/10 hover:border-cyan-400/40 backdrop-blur-xl transition-all duration-300 text-left hover:-translate-y-1"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300 mb-2 group-hover:scale-110 transition-transform">
              <Waypoints className="h-4 w-4" />
            </div>
            <div className="text-xs font-bold text-white">Route Analytics</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Understand markets</div>
          </button>

          <button
            onClick={() => navigate("/explorer")}
            className="group flex flex-col items-start p-3.5 rounded-2xl border border-white/10 bg-slate-900/50 hover:bg-white/10 hover:border-cyan-400/40 backdrop-blur-xl transition-all duration-300 text-left hover:-translate-y-1"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 mb-2 group-hover:scale-110 transition-transform">
              <Table2 className="h-4 w-4" />
            </div>
            <div className="text-xs font-bold text-white">Data Explorer</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Dive deeper</div>
          </button>

          <button
            onClick={() => navigate("/data-quality")}
            className="group flex flex-col items-start p-3.5 rounded-2xl border border-white/10 bg-slate-900/50 hover:bg-white/10 hover:border-cyan-400/40 backdrop-blur-xl transition-all duration-300 text-left hover:-translate-y-1"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="text-xs font-bold text-white">Data Quality</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Validated & trusted</div>
          </button>

          <button
            onClick={() => navigate("/benchmarking")}
            className="group flex flex-col items-start p-3.5 rounded-2xl border border-white/10 bg-slate-900/50 hover:bg-white/10 hover:border-cyan-400/40 backdrop-blur-xl transition-all duration-300 text-left hover:-translate-y-1"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 mb-2 group-hover:scale-110 transition-transform">
              <Landmark className="h-4 w-4" />
            </div>
            <div className="text-xs font-bold text-white">DGCA Benchmarking</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Aligned with standards</div>
          </button>

          <button
            onClick={() => navigate("/methodology")}
            className="group flex flex-col items-start p-3.5 rounded-2xl border border-white/10 bg-slate-900/50 hover:bg-white/10 hover:border-cyan-400/40 backdrop-blur-xl transition-all duration-300 text-left hover:-translate-y-1"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300 mb-2 group-hover:scale-110 transition-transform">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="text-xs font-bold text-white">Policy & Research</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Insights for impact</div>
          </button>

        </div>
      </div>
    </section>
  );
}
