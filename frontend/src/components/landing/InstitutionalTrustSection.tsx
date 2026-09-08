import { Landmark, Award } from "lucide-react";

export function InstitutionalTrustSection() {
  const institutions = [
    {
      name: "Ministry of Civil Aviation",
      role: "Aviation Policy & Tariff Monitoring",
      ref: "Rule 135 Aircraft Rules 1937",
    },
    {
      name: "MoSPI / NSO",
      role: "Consumer Price Index (Base 2024=100)",
      ref: "Group 07.3 Transport Deflator",
    },
    {
      name: "Reserve Bank of India",
      role: "High-Frequency Inflation Tracking",
      ref: "Monetary Policy Assessment",
    },
    {
      name: "DGCA",
      role: "Passenger Volume Statistics",
      ref: "Annual City-Pair Traffic Survey",
    },
    {
      name: "Smart India Hackathon",
      role: "Problem Statement 26056",
      ref: "Government of India Initiative",
    },
  ];

  return (
    <section className="relative py-20 bg-gradient-to-b from-white via-sky-50/30 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden border-t border-slate-200/80 dark:border-white/10">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50 dark:bg-white/5 px-3.5 py-1 text-xs font-bold text-blue-700 dark:text-slate-300 backdrop-blur-md mb-3 shadow-xs">
          <Award className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
          <span>Institutional Foundations</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white mb-2">
          Built for India's Aviation Ecosystem
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12 font-medium">
          Grounded directly in Indian statutory frameworks, official gazettes, and national statistical dissemination standards.
        </p>

        {/* Institutional Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {institutions.map((inst) => (
            <div
              key={inst.name}
              className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.03] hover:bg-white hover:border-blue-400/50 backdrop-blur-xl transition-all duration-300 shadow-md shadow-blue-950/5 hover:-translate-y-1"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-cyan-300 mb-3 border border-blue-200 dark:border-blue-400/20 shadow-xs">
                <Landmark className="h-5 w-5" />
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{inst.name}</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-semibold">{inst.role}</div>
              <div className="text-[10px] text-blue-600 dark:text-cyan-400/80 font-mono font-bold mt-2 pt-2 border-t border-slate-100 dark:border-white/10 w-full">
                {inst.ref}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
