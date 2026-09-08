import { Landmark, Plane, GraduationCap, Briefcase, ArrowRight, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function StakeholdersSection() {
  const navigate = useNavigate();

  const stakeholders = [
    {
      icon: Landmark,
      title: "Government & Policymakers",
      subtitle: "MoSPI • RBI • Ministry of Civil Aviation",
      desc: "Provide high-frequency CPI transport deflators, detect predatory surge breaches in real-time, and monitor regulatory tariff adherence under Rule 135.",
      capabilities: [
        "Real-time CPI Airfare Deflator",
        "Statutory Price-Cap Monitoring",
        "Corridor Surge Detection",
      ],
      badge: "National Infrastructure",
      color: "from-blue-600/20 to-cyan-500/10",
      accent: "text-blue-400",
      border: "hover:border-blue-400/50",
    },
    {
      icon: Plane,
      title: "Airlines & OTAs",
      subtitle: "Revenue Management & Yield Planners",
      desc: "Track corridor-level demand elasticities, benchmark competitive yield performance across T+7 and T+30 windows, and evaluate passenger volume distribution.",
      capabilities: [
        "Cross-Carrier Yield Benchmarks",
        "Lead-Time Elasticity Modeling",
        "Network Share Visibility",
      ],
      badge: "Commercial Intelligence",
      color: "from-cyan-600/20 to-teal-500/10",
      accent: "text-cyan-400",
      border: "hover:border-cyan-400/50",
    },
    {
      icon: GraduationCap,
      title: "Researchers & Economists",
      subtitle: "Academic Institutions & Think Tanks",
      desc: "Access structured, reproducible historical airfare datasets with transparent weighting formulas, complete methodology notes, and open REST APIs.",
      capabilities: [
        "11 REST Data Endpoints",
        "Reproducible Jevons Index Math",
        "Cryptographic Data Provenance",
      ],
      badge: "Empirical Datasets",
      color: "from-purple-600/20 to-indigo-500/10",
      accent: "text-purple-400",
      border: "hover:border-purple-400/50",
    },
    {
      icon: Briefcase,
      title: "Enterprises & Businesses",
      subtitle: "Corporate Travel & Procurement",
      desc: "Optimize corporate travel policies, forecast airfare budget volatility, and understand the price premium between tactical and advance bookings.",
      capabilities: [
        "Tactical Premium Forecasting",
        "Corporate Fare Budgeting",
        "Route Volatility Analytics",
      ],
      badge: "Strategic Procurement",
      color: "from-amber-600/20 to-orange-500/10",
      accent: "text-amber-400",
      border: "hover:border-amber-400/50",
    },
  ];

  return (
    <section id="stakeholders" className="relative py-24 bg-slate-950 overflow-hidden border-t border-white/10">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[700px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-cyan-300 backdrop-blur-md mb-3">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>Ecosystem Impact</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Built for Everyone Shaping{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-white bg-clip-text text-transparent">
              India's Aviation.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Delivering purpose-built intelligence for regulators, market participants, economists, and strategic planners across the country.
          </p>
        </div>

        {/* 4 Large Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {stakeholders.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className={`group relative flex flex-col justify-between rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 via-white/[0.03] to-transparent p-8 backdrop-blur-2xl shadow-2xl transition-all duration-300 ${s.border} hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/20`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} border border-white/20 shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`h-7 w-7 ${s.accent}`} />
                    </div>
                    <span className="rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-slate-200 border border-white/15 backdrop-blur-md">
                      {s.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {s.title}
                  </h3>
                  <div className="text-xs font-bold text-slate-400 mt-1 mb-4">{s.subtitle}</div>
                  <p className="text-sm text-slate-300 leading-relaxed">{s.desc}</p>

                  {/* Capability checklist */}
                  <div className="mt-6 space-y-2.5">
                    {s.capabilities.map((cap) => (
                      <div key={cap} className="flex items-center gap-2 text-xs font-medium text-slate-200">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA */}
                <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={() => navigate("/overview")}
                    className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300 hover:text-white transition-colors"
                  >
                    <span>Explore Solutions</span>
                    <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </button>
                  <span className="text-[11px] text-slate-400">SIH 26056 Compliant</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
