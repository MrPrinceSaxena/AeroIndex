import { Landmark, Plane, GraduationCap, Briefcase, ArrowRight, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function StakeholdersSection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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
      color: "from-blue-100 to-cyan-50 dark:from-blue-600/20 dark:to-cyan-500/10",
      accent: "text-blue-600 dark:text-blue-400",
      border: "hover:border-blue-400 dark:hover:border-blue-400/50",
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
      color: "from-cyan-100 to-sky-50 dark:from-cyan-600/20 dark:to-teal-500/10",
      accent: "text-cyan-600 dark:text-cyan-400",
      border: "hover:border-cyan-400 dark:hover:border-cyan-400/50",
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
      color: "from-purple-100 to-indigo-50 dark:from-purple-600/20 dark:to-indigo-500/10",
      accent: "text-purple-600 dark:text-purple-400",
      border: "hover:border-purple-400 dark:hover:border-purple-400/50",
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
      color: "from-amber-100 to-orange-50 dark:from-amber-600/20 dark:to-orange-500/10",
      accent: "text-amber-600 dark:text-amber-400",
      border: "hover:border-amber-400 dark:hover:border-amber-400/50",
    },
  ];

  return (
    <section id="stakeholders" className="relative py-24 bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden border-t border-slate-200/80 dark:border-white/10">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[700px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-cyan-300 backdrop-blur-md mb-3 shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Ecosystem Impact</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
            Built for Everyone Shaping{" "}
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
              India's Aviation.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
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
                className={`group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-900/60 p-8 backdrop-blur-2xl shadow-xl shadow-blue-950/5 transition-all duration-300 ${s.border} hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/15`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} border border-slate-200/80 dark:border-white/20 shadow-xs group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`h-7 w-7 ${s.accent}`} />
                    </div>
                    <span className="rounded-full bg-slate-100 dark:bg-white/10 px-3.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/15 backdrop-blur-md">
                      {s.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                    {s.title}
                  </h3>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 mb-4">{s.subtitle}</div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{s.desc}</p>

                  {/* Capability checklist */}
                  <div className="mt-6 space-y-2.5">
                    {s.capabilities.map((cap) => (
                      <div key={cap} className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-cyan-400" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA */}
                <div className="mt-8 pt-5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (isAuthenticated) {
                        navigate("/overview");
                      } else {
                        navigate(`/login?redirect=${encodeURIComponent("/overview")}`);
                      }
                    }}
                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-cyan-300 hover:text-blue-800 dark:hover:text-white transition-colors"
                  >
                    <span>Explore Solutions</span>
                    <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </button>
                  <span className="text-[11px] text-slate-500 font-semibold">SIH 26056 Compliant</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
