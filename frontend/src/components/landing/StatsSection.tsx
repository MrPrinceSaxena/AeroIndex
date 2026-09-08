import { useState, useEffect } from "react";
import { Database, Route, Layers, ShieldCheck, CheckCircle2, Activity } from "lucide-react";



export function StatsSection() {
  const [faresCount, setFaresCount] = useState(485);
  const [routesCount, setRoutesCount] = useState(90);

  useEffect(() => {
    const timer = setInterval(() => {
      setFaresCount((prev) => (prev < 500 ? prev + 3 : 500));
      setRoutesCount((prev) => (prev < 142 ? prev + 2 : 142));
    }, 40);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="statistics" className="relative py-20 bg-slate-950 overflow-hidden border-t border-b border-white/10">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/40 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-cyan-300 backdrop-blur-md mb-3">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span>Operational Scale</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            The Aviation Picture,{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-white bg-clip-text text-transparent">
              at a Glance.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Continuous high-frequency airline scraping, rigorous statistical cleaning, and multi-source reconciliation aggregated into India’s premier airfare benchmark.
          </p>
        </div>

        {/* 4 Master Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Stat 1 */}
          <div className="group relative rounded-3xl border border-white/15 bg-gradient-to-b from-white/10 to-white/[0.02] p-7 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-cyan-400/50 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-500/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-cyan-300 border border-blue-400/30 mb-6 group-hover:scale-110 transition-transform">
              <Database className="h-6 w-6" />
            </div>
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tight tabular">
              {faresCount}M+
            </div>
            <div className="mt-2 text-sm font-bold text-slate-200">Fares Tracked</div>
            <p className="mt-1 text-xs text-slate-400 leading-normal">
              High-frequency multi-carrier quotes observed with timestamped audit trail.
            </p>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Real-Time Unbundled</span>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="group relative rounded-3xl border border-white/15 bg-gradient-to-b from-white/10 to-white/[0.02] p-7 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-cyan-400/50 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-500/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 mb-6 group-hover:scale-110 transition-transform">
              <Route className="h-6 w-6" />
            </div>
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tight tabular">
              {routesCount}+
            </div>
            <div className="mt-2 text-sm font-bold text-slate-200">Routes Covered</div>
            <p className="mt-1 text-xs text-slate-400 leading-normal">
              Trunk corridors, metro-to-metro city pairs, and key regional routes across India.
            </p>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>DGCA Passenger Weighted</span>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="group relative rounded-3xl border border-white/15 bg-gradient-to-b from-white/10 to-white/[0.02] p-7 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-cyan-400/50 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-500/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-6 group-hover:scale-110 transition-transform">
              <Layers className="h-6 w-6" />
            </div>
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tight tabular">
              10+
            </div>
            <div className="mt-2 text-sm font-bold text-slate-200">Data Sources</div>
            <p className="mt-1 text-xs text-slate-400 leading-normal">
              Airline-direct Playwright connectors, cross-source validation & calibrated backtests.
            </p>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>RFC 9309 Compliant</span>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="group relative rounded-3xl border border-white/15 bg-gradient-to-b from-white/10 to-white/[0.02] p-7 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-cyan-400/50 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-500/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tight tabular">
              99.9%
            </div>
            <div className="mt-2 text-sm font-bold text-slate-200">Data Availability</div>
            <p className="mt-1 text-xs text-slate-400 leading-normal">
              Automated APScheduler background pipeline with zero base drift chain-linking.
            </p>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-[11px] font-semibold text-amber-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Quarantine Barrier Isolated</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
