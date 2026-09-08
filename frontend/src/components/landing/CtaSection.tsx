import { useNavigate } from "react-router-dom";
import { ArrowRight, LayoutDashboard, LineChart, Sparkles } from "lucide-react";

export function CtaSection() {
  const navigate = useNavigate();

  return (
    <section className="relative py-28 bg-slate-950 overflow-hidden border-t border-white/10">
      {/* Background Image with Ascending Airliner */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/images/cta-plane-ascending.jpg"
          alt="Airliner ascending above clouds"
          className="h-full w-full object-cover object-center opacity-40 mix-blend-luminosity brightness-75 scale-105 transform animate-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Glowing Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-950/60 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cyan-300 backdrop-blur-xl shadow-lg shadow-cyan-950/80 mb-6">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Real-time Aviation Intelligence</span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          A Clearer View of{" "}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-white bg-clip-text text-transparent glow-text">
            India's Skies.
          </span>
        </h2>

        {/* Supporting text */}
        <p className="mt-5 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Explore reliable aviation intelligence built for better decisions. Powered by high-frequency feeds, official DGCA weights, and open REST APIs.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => navigate("/overview")}
            className="group relative inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-8 py-4 text-sm font-bold text-white shadow-2xl shadow-blue-500/30 transition-all duration-300 hover:shadow-cyan-500/40 hover:scale-105 active:scale-[0.98]"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Enter Dashboard</span>
            <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </button>

          <button
            onClick={() => navigate("/index")}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/15 px-7 py-4 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/40 hover:scale-105"
          >
            <LineChart className="h-4 w-4 text-cyan-400" />
            <span>Explore Air Fare Index</span>
          </button>
        </div>

        {/* Micro Telemetry Footer */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>11 REST API Endpoints Live</span>
          </span>
          <span>•</span>
          <span>PostgreSQL Audit Trail</span>
          <span>•</span>
          <span>Smart India Hackathon 2024 / 2026 Prototype</span>
        </div>

      </div>
    </section>
  );
}
