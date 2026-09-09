import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Plane,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  LineChart,
  Waypoints,
  Table2,
  ShieldCheck,
  Landmark,
  BookOpen,
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
      origin: "Delhi",
      destination: "Mumbai",
      fare: "₹6,230",
      change: "+8.4%",
      isUp: true,
      routesTracked: 142,
      points: [42, 48, 45, 52, 50, 58, 62, 59, 68, 74, 71, 79],
      advanceLead: "T+7 Tactical",
    },
    "DEL-BLR": {
      name: "DEL → BLR",
      origin: "Delhi",
      destination: "Bengaluru",
      fare: "₹5,840",
      change: "-3.2%",
      isUp: false,
      routesTracked: 118,
      points: [60, 58, 55, 53, 56, 52, 49, 51, 48, 46, 47, 44],
      advanceLead: "T+30 Advance",
    },
    "BOM-BLR": {
      name: "BOM → BLR",
      origin: "Mumbai",
      destination: "Bengaluru",
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
      className="relative min-h-[90vh] pt-24 pb-12 overflow-hidden bg-gradient-to-b from-sky-50/40 via-white to-slate-50/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-between"
    >
      {/* Background Image with Clean Atmospheric Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/assets/images/hero-bright-runway.jpg"
          alt="Aviation runway"
          className="h-full w-full object-cover object-center opacity-80 brightness-[0.98] contrast-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/75 to-white/30 dark:from-slate-950/95 dark:via-slate-950/80 dark:to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/50 dark:from-slate-950 dark:via-transparent dark:to-slate-950/50" />
      </div>

      {/* Hero Main Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Clear, Professional Hero Copy */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-5 text-left">
            
            {/* Crisp Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-50/90 dark:bg-blue-950/50 px-3.5 py-1 text-[11px] font-bold text-blue-700 dark:text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>Real-Time Airfare Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.12]">
              India’s Skies, <br />
              <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
                Smarter Insights.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="max-w-xl text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              High-frequency airfare price index and corridor analytics computed from verified airline sources, calibrated with DGCA passenger traffic weighting.
            </p>

            {/* Clean Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => goProtected("/overview")}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{isAuthenticated ? "Enter Dashboard" : "Launch Console"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <a
                href="#india-map"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-white px-5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 backdrop-blur-md transition-all hover:border-slate-300"
              >
                <span>Live Route Radar</span>
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Verified Direct Scrapes</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span>DGCA FY24 Weighted</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                <span>Chain-Linked Index</span>
              </div>
            </div>

          </div>

          {/* Right Column: Clean Floating Metric Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm">
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 p-5 backdrop-blur-xl shadow-lg">
                
                {/* Route Selector */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-xs">
                      <Plane className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex gap-1 bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg">
                      {(["DEL-BOM", "DEL-BLR", "BOM-BLR"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setSelectedRoute(r)}
                          className={`text-xs px-2 py-0.5 rounded-md font-semibold transition-all ${
                            selectedRoute === r
                              ? "bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live
                  </span>
                </div>

                {/* Fare & Trend */}
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Weighted Fare
                    </span>
                    <div className="text-3xl font-black text-slate-950 dark:text-white mt-0.5">
                      {current.fare}
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${
                      current.isUp
                        ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {current.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>{current.change}</span>
                  </div>
                </div>

                {/* Trajectory Sparkline */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                    <span>30-Day Trajectory</span>
                    <span className="text-blue-600 dark:text-cyan-400 font-semibold">{current.advanceLead}</span>
                  </div>
                  <div className="h-12 w-full flex items-end">
                    <svg className="h-full w-full overflow-visible" viewBox="0 0 120 40">
                      <defs>
                        <linearGradient id="heroSparkGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
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
                        strokeWidth="2"
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
                        fill="url(#heroSparkGrad)"
                      />
                    </svg>
                  </div>
                </div>

                {/* Corridor Action Button */}
                <button
                  onClick={() => goProtected("/routes")}
                  className="mt-3 w-full flex items-center justify-between rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
                >
                  <span>Explore {selectedRoute} route data</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Dock Quick Tiles */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          
          <button
            onClick={() => goProtected("/index")}
            className="flex flex-col items-start p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900/80 transition-all text-left shadow-2xs"
          >
            <LineChart className="h-4 w-4 text-blue-600 dark:text-cyan-400 mb-1.5" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Fare Index</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Track index series</span>
          </button>

          <button
            onClick={() => goProtected("/routes")}
            className="flex flex-col items-start p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900/80 transition-all text-left shadow-2xs"
          >
            <Waypoints className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mb-1.5" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Route Analytics</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Corridor spreads</span>
          </button>

          <button
            onClick={() => goProtected("/explorer")}
            className="flex flex-col items-start p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900/80 transition-all text-left shadow-2xs"
          >
            <Table2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400 mb-1.5" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Data Explorer</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Raw fare quotes</span>
          </button>

          <button
            onClick={() => goProtected("/data-quality")}
            className="flex flex-col items-start p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900/80 transition-all text-left shadow-2xs"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mb-1.5" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Data Quality</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Outlier sanitization</span>
          </button>

          <button
            onClick={() => goProtected("/benchmarking")}
            className="flex flex-col items-start p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900/80 transition-all text-left shadow-2xs"
          >
            <Landmark className="h-4 w-4 text-amber-600 dark:text-amber-400 mb-1.5" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">DGCA Benchmark</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Statistical alignment</span>
          </button>

          <button
            onClick={() => goProtected("/methodology")}
            className="flex flex-col items-start p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900/80 transition-all text-left shadow-2xs"
          >
            <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400 mb-1.5" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Methodology</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Formula & weights</span>
          </button>

        </div>
      </div>
    </section>
  );
}
