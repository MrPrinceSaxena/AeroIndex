import { Link } from "react-router-dom";
import { Plane, Landmark, GitBranch } from "lucide-react";
import { useSystemHealth } from "../../hooks/useSystemHealth";


export function LandingFooter() {
  const health = useSystemHealth();
  const isHealthy = health.data?.overall_status === "healthy" || !health.isError;

  return (
    <footer className="relative bg-slate-950 text-slate-400 text-xs border-t border-white/10 pt-16 pb-12 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          
          {/* Brand & Attribution */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30">
                <Plane className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">APIx</span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Real-time Airfare Price Index (APIx) for India. High-frequency multi-source scraping, DGCA-traffic-weighted chain-linked geometric aggregation, and macroeconomic deflators for MoSPI and the Reserve Bank of India.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isHealthy ? "Pipeline Operational (06:00 UTC)" : "Telemetry Connected"}</span>
              </span>
            </div>
          </div>

          {/* Column 1: Platform Modules */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-[11px]">
              Platform Modules
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/overview" className="hover:text-cyan-300 transition-colors">
                  Overview Dashboard
                </Link>
              </li>
              <li>
                <Link to="/index" className="hover:text-cyan-300 transition-colors">
                  Air Fare Index Series
                </Link>
              </li>
              <li>
                <Link to="/routes" className="hover:text-cyan-300 transition-colors">
                  Route & Elasticity Analytics
                </Link>
              </li>
              <li>
                <Link to="/explorer" className="hover:text-cyan-300 transition-colors">
                  Raw Quotes Explorer
                </Link>
              </li>
              <li>
                <Link to="/data-quality" className="hover:text-cyan-300 transition-colors">
                  Data Quality & Outliers
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Trust & Science */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-[11px]">
              Trust & Governance
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/benchmarking" className="hover:text-cyan-300 transition-colors">
                  DGCA Backtesting
                </Link>
              </li>
              <li>
                <Link to="/methodology" className="hover:text-cyan-300 transition-colors">
                  Formula & Whitepaper
                </Link>
              </li>
              <li>
                <Link to="/system-health" className="hover:text-cyan-300 transition-colors">
                  System Health & Scrapers
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/MrPrinceSaxena/AeroIndex"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  <span>GitHub Repository</span>
                </a>

              </li>
            </ul>
          </div>

          {/* Column 3: Institutional Alignment */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-[11px]">
              Governance
            </h4>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="text-[11px] font-bold text-white">MoSPI CPI 2024=100</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Aligned with UN/ILO index manuals</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="text-[11px] font-bold text-white">DGCA Passenger Survey</div>
                <div className="text-[10px] text-slate-400 mt-0.5">FY2023-24 traffic weights</div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Attribution Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-slate-400" />
            <span>
              Smart India Hackathon (SIH) • Problem Statement 26056 • Ministry of Statistics & Programme Implementation
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>Team AeroIndex</span>
            <span>•</span>
            <span>PostgreSQL & Playwright Architecture</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
