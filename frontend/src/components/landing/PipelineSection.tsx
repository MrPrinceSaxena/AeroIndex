import {
  Layers,
  Bot,
  ShieldCheck,
  Filter,
  Calculator,
  Cpu,
  Database,
  CheckCircle2,
} from "lucide-react";


export function PipelineSection() {
  const steps = [
    {
      num: "01",
      icon: Layers,
      title: "Multiple Sources",
      subtitle: "Multi-Carrier Feeds",
      desc: "Scrapes airline-direct search endpoints (Air India & IndiGo) without third-party OTA markup distortions.",
      tag: "RFC 9309 Compliant",
      accent: "text-blue-400",
      border: "border-blue-500/40",
      bg: "bg-blue-500/10",
    },
    {
      num: "02",
      icon: Bot,
      title: "Data Collection",
      subtitle: "Playwright Headless",
      desc: "Scheduled APScheduler cron runs headless Chromium to render dynamic SPAs and capture T+7 and T+30 booking windows.",
      tag: "Daily 06:00 UTC Cron",
      accent: "text-cyan-400",
      border: "border-cyan-500/40",
      bg: "bg-cyan-500/10",
    },
    {
      num: "03",
      icon: ShieldCheck,
      title: "Validation",
      subtitle: "Tax & Cross-Check",
      desc: "Reconciles Total Fare = Base Fare + Statutory Taxes (UDF/PSF) and cross-validates prices across carriers.",
      tag: "Fee Unbundling",
      accent: "text-indigo-400",
      border: "border-indigo-500/40",
      bg: "bg-indigo-500/10",
    },
    {
      num: "04",
      icon: Filter,
      title: "Normalization",
      subtitle: "IQR & Quarantine",
      desc: "Flags 1.5 × IQR statistical outliers and isolates synthetic gap-fillers into an isolated quarantine view.",
      tag: "Zero Contamination",
      accent: "text-emerald-400",
      border: "border-emerald-500/40",
      bg: "bg-emerald-500/10",
    },
    {
      num: "05",
      icon: Calculator,
      title: "Statistical Analysis",
      subtitle: "DGCA Geometric Mean",
      desc: "Applies official DGCA passenger volume weights with monthly chain-linking to eliminate substitution bias.",
      tag: "Jevons Formulation",
      accent: "text-amber-400",
      border: "border-amber-500/40",
      bg: "bg-amber-500/10",
    },
    {
      num: "06",
      icon: Cpu,
      title: "Aviation Intelligence",
      subtitle: "Policy & API Serving",
      desc: "Serves 11 authenticated REST endpoints and an 8-page analytics dashboard for MoSPI, RBI, and DGCA.",
      tag: "11 REST Endpoints",
      accent: "text-purple-400",
      border: "border-purple-500/40",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <section id="pipeline" className="relative py-24 bg-slate-950 overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/40 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-cyan-300 backdrop-blur-md mb-3">
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            <span>End-to-End Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            From Raw Data to{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-white bg-clip-text text-transparent">
              Real Insight.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            A fully automated, auditable statistical engineering pipeline transforming erratic airline dynamic fares into transparent national price indices.
          </p>
        </div>

        {/* 6-Stage Horizontal Flow Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="group relative flex flex-col justify-between rounded-3xl border border-white/15 bg-gradient-to-b from-white/10 via-white/[0.03] to-transparent p-7 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-cyan-400/50 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20"
              >
                {/* Stage Number & Badge */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black font-mono text-cyan-400/80">
                        {step.num}
                      </span>
                      <div className="h-px w-6 bg-white/20" />
                    </div>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-300 border border-white/10">
                      {step.tag}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${step.bg} border ${step.border} group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-5 w-5 ${step.accent}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {step.title}
                      </h3>
                      <div className="text-xs text-slate-400">{step.subtitle}</div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed mt-3">
                    {step.desc}
                  </p>
                </div>

                {/* Footer Checkmark */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Automated Stage</span>
                  </span>
                  {idx < steps.length - 1 && (
                    <span className="text-slate-500 group-hover:text-cyan-400 transition-colors">
                      Next →
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
