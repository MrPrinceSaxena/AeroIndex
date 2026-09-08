import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Waypoints,
  Table2,
  ShieldCheck,
  Landmark,
  BookOpen,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function FeatureCardsSection() {
  const navigate = useNavigate();

  const features = [
    {
      icon: LineChart,
      title: "Air Fare Index",
      subtitle: "Aggregate Market Barometer",
      description:
        "Track and understand macro fare movements across all Indian trunk and regional routes with chain-linked geometric index math.",
      link: "/index",
      badge: "Jevons Geometric Mean",
      color: "from-blue-100 to-cyan-50 dark:from-blue-600/30 dark:to-cyan-500/20",
      accent: "text-blue-600 dark:text-cyan-400",
      borderAccent: "hover:border-blue-400 dark:hover:border-cyan-400/60",
    },
    {
      icon: Waypoints,
      title: "Route Analytics",
      subtitle: "Elasticity & Corridor Yields",
      description:
        "Discover corridor-level price trends, T+7 vs T+30 booking lead-time elasticities, and route-specific index contributions.",
      link: "/routes",
      badge: "Lead-Time Curve",
      color: "from-indigo-100 to-blue-50 dark:from-indigo-600/30 dark:to-blue-500/20",
      accent: "text-indigo-600 dark:text-indigo-400",
      borderAccent: "hover:border-indigo-400 dark:hover:border-indigo-400/60",
    },
    {
      icon: Table2,
      title: "Data Explorer",
      subtitle: "Granular Traceability",
      description:
        "Filter, search, and paginate through verified raw quotes with carrier badges, fee unbundling, and cryptographic SHA-256 provenance.",
      link: "/explorer",
      badge: "Live Database Rows",
      color: "from-cyan-100 to-sky-50 dark:from-cyan-600/30 dark:to-teal-500/20",
      accent: "text-cyan-600 dark:text-cyan-300",
      borderAccent: "hover:border-cyan-400 dark:hover:border-cyan-300/60",
    },
    {
      icon: ShieldCheck,
      title: "Data Quality",
      subtitle: "Trust & Automated Auditing",
      description:
        "Validate dataset freshness, IQR outlier detection rates, fee reconciliation compliance, and scraper health telemetry.",
      link: "/data-quality",
      badge: "IQR Outlier Filter",
      color: "from-emerald-100 to-teal-50 dark:from-emerald-600/30 dark:to-teal-500/20",
      accent: "text-emerald-600 dark:text-emerald-400",
      borderAccent: "hover:border-emerald-400 dark:hover:border-emerald-400/60",
    },
    {
      icon: Landmark,
      title: "DGCA Benchmarking",
      subtitle: "Official Ground Truth",
      description:
        "Compare live high-frequency APIx trends directly against published DGCA Monthly Traffic and Fare Monitor reports.",
      link: "/benchmarking",
      badge: "DGCA Ground Truth",
      color: "from-amber-100 to-orange-50 dark:from-amber-600/30 dark:to-orange-500/20",
      accent: "text-amber-600 dark:text-amber-400",
      borderAccent: "hover:border-amber-400 dark:hover:border-amber-400/60",
    },
    {
      icon: BookOpen,
      title: "Policy & Research",
      subtitle: "Defensible Whitepaper",
      description:
        "Mathematical justifications, UN/ILO CPI compliance, passenger traffic weights citations, and API documentation for MoSPI/RBI.",
      link: "/methodology",
      badge: "MoSPI CPI Aligned",
      color: "from-purple-100 to-indigo-50 dark:from-purple-600/30 dark:to-indigo-500/20",
      accent: "text-purple-600 dark:text-purple-300",
      borderAccent: "hover:border-purple-400 dark:hover:border-purple-400/60",
    },
  ];

  return (
    <section id="features" className="relative py-24 bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-cyan-300 backdrop-blur-md mb-3 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Comprehensive Intelligence Suite</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
            One Platform.{" "}
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
              Multiple Perspectives.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Every module is designed to give government agencies, regulators, economists, and airlines dedicated, auditable perspectives into India's air transport market.
          </p>
        </div>

        {/* 6 Master Feature Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                onClick={() => navigate(f.link)}
                className={`group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/90 dark:bg-slate-900/60 p-7 backdrop-blur-2xl shadow-xl shadow-blue-950/5 transition-all duration-300 ${f.borderAccent} hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/15 cursor-pointer`}
              >
                {/* Top Section */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} border border-slate-200/80 dark:border-white/20 shadow-xs group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`h-6 w-6 ${f.accent}`} />
                    </div>
                    <span className="rounded-full bg-slate-100 dark:bg-white/10 px-3 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/15 backdrop-blur-md">
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                    {f.title}
                  </h3>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">{f.subtitle}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{f.description}</p>
                </div>

                {/* Bottom Action */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                  <span>Launch Module</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 group-hover:bg-blue-600 dark:group-hover:bg-cyan-500 text-slate-700 dark:text-white group-hover:text-white dark:group-hover:text-slate-950 transition-all transform group-hover:translate-x-1 shadow-xs">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
