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
      color: "from-blue-600/30 to-cyan-500/20",
      accent: "text-cyan-400",
      borderAccent: "hover:border-cyan-400/60",
    },
    {
      icon: Waypoints,
      title: "Route Analytics",
      subtitle: "Elasticity & Corridor Yields",
      description:
        "Discover corridor-level price trends, T+7 vs T+30 booking lead-time elasticities, and route-specific index contributions.",
      link: "/routes",
      badge: "Lead-Time Curve",
      color: "from-indigo-600/30 to-blue-500/20",
      accent: "text-indigo-400",
      borderAccent: "hover:border-indigo-400/60",
    },
    {
      icon: Table2,
      title: "Data Explorer",
      subtitle: "Granular Traceability",
      description:
        "Filter, search, and paginate through verified raw quotes with carrier badges, fee unbundling, and cryptographic SHA-256 provenance.",
      link: "/explorer",
      badge: "Live Database Rows",
      color: "from-cyan-600/30 to-teal-500/20",
      accent: "text-cyan-300",
      borderAccent: "hover:border-cyan-300/60",
    },
    {
      icon: ShieldCheck,
      title: "Data Quality",
      subtitle: "Trust & Automated Auditing",
      description:
        "Validate dataset freshness, IQR outlier detection rates, fee reconciliation compliance, and scraper health telemetry.",
      link: "/data-quality",
      badge: "IQR Outlier Filter",
      color: "from-emerald-600/30 to-teal-500/20",
      accent: "text-emerald-400",
      borderAccent: "hover:border-emerald-400/60",
    },
    {
      icon: Landmark,
      title: "DGCA Benchmarking",
      subtitle: "Official Ground Truth",
      description:
        "Compare live high-frequency APIx trends directly against published DGCA Monthly Traffic and Fare Monitor reports.",
      link: "/benchmarking",
      badge: "DGCA Ground Truth",
      color: "from-amber-600/30 to-orange-500/20",
      accent: "text-amber-400",
      borderAccent: "hover:border-amber-400/60",
    },
    {
      icon: BookOpen,
      title: "Policy & Research",
      subtitle: "Defensible Whitepaper",
      description:
        "Mathematical justifications, UN/ILO CPI compliance, passenger traffic weights citations, and API documentation for MoSPI/RBI.",
      link: "/methodology",
      badge: "MoSPI CPI Aligned",
      color: "from-purple-600/30 to-indigo-500/20",
      accent: "text-purple-300",
      borderAccent: "hover:border-purple-400/60",
    },
  ];

  return (
    <section id="features" className="relative py-24 bg-slate-950 overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-cyan-300 backdrop-blur-md mb-3">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Comprehensive Intelligence Suite</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            One Platform.{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-white bg-clip-text text-transparent">
              Multiple Perspectives.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
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
                className={`group relative flex flex-col justify-between rounded-3xl border border-white/15 bg-gradient-to-b from-white/10 via-white/[0.04] to-transparent p-7 backdrop-blur-2xl shadow-xl transition-all duration-300 ${f.borderAccent} hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer`}
              >
                {/* Top Section */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} border border-white/20 shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`h-6 w-6 ${f.accent}`} />
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-slate-300 border border-white/15 backdrop-blur-md">
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {f.title}
                  </h3>
                  <div className="text-xs font-semibold text-slate-400 mb-3">{f.subtitle}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{f.description}</p>
                </div>

                {/* Bottom Action */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-slate-300 group-hover:text-cyan-300 transition-colors">
                  <span>Launch Module</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all transform group-hover:translate-x-1">
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
