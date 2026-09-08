import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Scale,
  RefreshCw,
  FileCode2,
} from "lucide-react";


export function MethodologyTrustSection() {
  const navigate = useNavigate();

  return (
    <section id="methodology" className="relative py-24 bg-slate-950 overflow-hidden border-t border-white/10">
      {/* Background Deep Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-blue-700/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/40 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-cyan-300 backdrop-blur-md mb-3">
            <Scale className="h-3.5 w-3.5 text-cyan-400" />
            <span>Economic Rigor</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Transparent{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-white bg-clip-text text-transparent">
              by Design.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Every index value is mathematically defensible, traceable to exact database records, and protected by strict architectural isolation.
          </p>
        </div>

        {/* Master Methodology Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: The Mathematical Engine Card */}
          <div className="lg:col-span-7 rounded-3xl border border-white/20 bg-gradient-to-b from-white/10 via-white/[0.04] to-transparent p-8 backdrop-blur-2xl shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
                  <FileCode2 className="h-4 w-4" />
                  <span>DGCA Traffic-Weighted Geometric Index</span>
                </div>
                <span className="rounded-full bg-blue-500/20 px-3 py-0.5 text-[11px] font-bold text-cyan-300 border border-blue-400/30">
                  Axiomatic CPI Standard
                </span>
              </div>

              {/* Formula Display Box */}
              <div className="mt-6 rounded-2xl border border-cyan-400/30 bg-slate-900/80 p-6 backdrop-blur-xl shadow-inner font-mono text-xs sm:text-sm text-slate-200 space-y-4">
                <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-wide">
                  1. Route-Window Geometric Mean:
                </div>
                <div className="bg-black/40 p-3 rounded-xl text-center text-cyan-200 font-bold text-sm sm:text-base border border-white/5">
                  P̄(r, w, t) = [ ∏ P(r, w, i, t) ]^(1 / N)
                </div>

                <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-wide">
                  2. DGCA-Weighted Chain-Linked Aggregation:
                </div>
                <div className="bg-black/40 p-3 rounded-xl text-center text-cyan-200 font-bold text-sm sm:text-base border border-white/5">
                  I(t) = I(t-1) × ∏ [ P̄(r, T+7, t) / P̄(r, T+7, t-1) ]^(w_r · 0.6) × [ P̄(r, T+30, t) / P̄(r, T+30, t-1) ]^(w_r · 0.4)
                </div>
              </div>

              {/* Explanation Points */}
              <div className="mt-6 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Zero Substitution Bias:</strong> The Jevons geometric mean satisfies both the Time-Reversal and Transitivity axiomatic tests required by UN/ILO CPI manuals.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Official Passenger Weights:</strong> Route weights derived from DGCA Annual Survey (DEL-BOM 43.8%, DEL-BLR 32.2%, BOM-BLR 24.0%).
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Zero Base Drift:</strong> Monthly chain-linking prevents base-year obsolescence as airline route schedules evolve.
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => navigate("/methodology")}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/30 px-5 py-2.5 text-xs font-bold text-cyan-300 transition-colors"
              >
                <span>Read Full Methodology Whitepaper</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <span className="text-[11px] text-slate-400">MoSPI CPI 2024 Compatible</span>
            </div>
          </div>

          {/* Right Column: Trust & Quarantine Cards */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-4">
            
            {/* Trust Panel 1: Quarantine Barrier */}
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-6 backdrop-blur-2xl shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Database Quarantine Barrier</h4>
                  <div className="text-[11px] text-emerald-300 font-semibold">Zero Contamination Guarantee</div>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Synthetic gap-fillers are tagged <code>data_origin = 'imputed'</code> and physically isolated. The index engine computes strictly against the PostgreSQL view <code>observed_fare_quotes</code>.
              </p>
            </div>

            {/* Trust Panel 2: Fee Unbundling */}
            <div className="rounded-3xl border border-blue-500/30 bg-blue-950/20 p-6 backdrop-blur-2xl shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-cyan-400 border border-blue-500/40">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Base Fare & Tax Reconciliation</h4>
                  <div className="text-[11px] text-cyan-300 font-semibold">Statutory Fee Isolation</div>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Verifies <code>total = base_fare + taxes + UDF</code> for every quote. Prevents airport fee hikes or fuel surcharges from distorting base passenger tariff indices.
              </p>
            </div>

            {/* Trust Panel 3: Live Verification */}
            <div className="rounded-3xl border border-cyan-500/30 bg-cyan-950/20 p-6 backdrop-blur-2xl shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Continuous Verification</h4>
                  <div className="text-[11px] text-cyan-300 font-semibold">149 / 149 Unit Tests Passing</div>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                100% automated test pass rate with historical DGCA backtest verification and real-time scraper telemetry logs.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
