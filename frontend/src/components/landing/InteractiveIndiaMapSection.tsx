import { useState } from "react";
import { Plane, Compass, ArrowRight, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface AirportNode {
  code: string;
  name: string;
  city: string;
  x: number;
  y: number;
  trafficShare: string;
  tier: "Trunk" | "Metro" | "Regional";
}

const AIRPORTS: AirportNode[] = [
  { code: "DEL", name: "Indira Gandhi Intl", city: "Delhi", x: 380, y: 220, trafficShare: "31.2%", tier: "Trunk" },
  { code: "BOM", name: "Chhatrapati Shivaji Intl", city: "Mumbai", x: 260, y: 520, trafficShare: "22.4%", tier: "Trunk" },
  { code: "BLR", name: "Kempegowda Intl", city: "Bengaluru", x: 340, y: 730, trafficShare: "14.8%", tier: "Trunk" },
  { code: "HYD", name: "Rajiv Gandhi Intl", city: "Hyderabad", x: 380, y: 580, trafficShare: "8.6%", tier: "Metro" },
  { code: "MAA", name: "Chennai Intl", city: "Chennai", x: 420, y: 740, trafficShare: "7.1%", tier: "Metro" },
  { code: "CCU", name: "Netaji Subhash Chandra Bose Intl", city: "Kolkata", x: 680, y: 410, trafficShare: "6.9%", tier: "Metro" },
  { code: "AMD", name: "Sardar Vallabhbhai Patel Intl", city: "Ahmedabad", x: 240, y: 410, trafficShare: "3.4%", tier: "Metro" },
  { code: "GOI", name: "Dabolim / Mopa Intl", city: "Goa", x: 270, y: 650, trafficShare: "2.1%", tier: "Regional" },
  { code: "COK", name: "Cochin Intl", city: "Kochi", x: 320, y: 840, trafficShare: "2.3%", tier: "Regional" },
  { code: "GAU", name: "Lokpriya Gopinath Bordoloi Intl", city: "Guwahati", x: 820, y: 320, trafficShare: "1.2%", tier: "Regional" },
];

interface RouteItem {
  id: string;
  from: string;
  to: string;
  fare: string;
  change: string;
  isUp: boolean;
  frequency: string;
  path: string;
}

const ROUTES: RouteItem[] = [
  {
    id: "DEL-BOM",
    from: "DEL",
    to: "BOM",
    fare: "₹6,230",
    change: "↓ 4.2%",
    isUp: false,
    frequency: "64 flights/day",
    path: "M 380 220 Q 300 350, 260 520",
  },
  {
    id: "BLR-DEL",
    from: "BLR",
    to: "DEL",
    fare: "₹5,840",
    change: "↑ 7.1%",
    isUp: true,
    frequency: "48 flights/day",
    path: "M 340 730 Q 400 480, 380 220",
  },
  {
    id: "BOM-HYD",
    from: "BOM",
    to: "HYD",
    fare: "₹4,120",
    change: "↓ 2.8%",
    isUp: false,
    frequency: "32 flights/day",
    path: "M 260 520 Q 320 540, 380 580",
  },
  {
    id: "DEL-BLR",
    from: "DEL",
    to: "BLR",
    fare: "₹5,150",
    change: "↑ 3.4%",
    isUp: true,
    frequency: "42 flights/day",
    path: "M 380 220 Q 370 500, 340 730",
  },
  {
    id: "DEL-CCU",
    from: "DEL",
    to: "CCU",
    fare: "₹4,890",
    change: "↓ 1.5%",
    isUp: false,
    frequency: "28 flights/day",
    path: "M 380 220 Q 530 280, 680 410",
  },
  {
    id: "BOM-BLR",
    from: "BOM",
    to: "BLR",
    fare: "₹3,940",
    change: "↑ 2.2%",
    isUp: true,
    frequency: "36 flights/day",
    path: "M 260 520 Q 290 630, 340 730",
  },
];

export function InteractiveIndiaMapSection() {
  const [activeAirport, setActiveAirport] = useState<AirportNode>(AIRPORTS[0]);
  const [activeRoute, setActiveRoute] = useState<RouteItem>(ROUTES[0]);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <section id="india-map" className="relative py-24 bg-gradient-to-b from-white via-sky-50/50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden border-t border-b border-slate-200/80 dark:border-white/10">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-cyan-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-cyan-300 backdrop-blur-md mb-3 shadow-xs">
              <Compass className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
              <span>National Corridor Radar</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
              See India from{" "}
              <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
                the Sky.
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl font-medium">
              Real-time flight movements, live corridor prices, and passenger load weighting mapped across India's premier aviation trunk routes.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/90 dark:bg-white/5 p-3.5 backdrop-blur-xl shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">10 Hubs • 45+ Domestic Corridors</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">DGCA Annual Traffic Survey FY24 Aligned</div>
            </div>
          </div>
        </div>

        {/* The 3D Map Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left / Center: Interactive SVG Flight Route Canvas */}
          <div className="lg:col-span-8 relative rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:p-8 shadow-2xl overflow-hidden min-h-[520px] flex items-center justify-center">
            
            {/* Top Bar inside Map Canvas */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/80 px-3.5 py-1 text-xs text-slate-200 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-bold text-[11px] tracking-wide">Live Network Radar</span>
              </div>
              <div className="text-[11px] text-cyan-400/80 font-mono font-bold tracking-wider">
                AIRSPACE: INDIA DOMESTIC
              </div>
            </div>

            {/* SVG India Flight Radar Canvas */}
            <div className="relative w-full max-w-[700px] aspect-[4/3] flex items-center justify-center">
              <svg
                viewBox="100 100 800 800"
                className="w-full h-full drop-shadow-[0_0_35px_rgba(59,130,246,0.35)]"
              >
                <defs>
                  {/* Glowing Node Filter */}
                  <filter id="mapGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <linearGradient id="mapRouteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.95" />
                  </linearGradient>
                </defs>

                {/* India Stylized Abstract Geometric Outlines */}
                <path
                  d="M 380 160 L 450 200 L 520 220 L 620 280 L 780 260 L 880 320 L 800 390 L 700 420 L 580 500 L 450 680 L 370 870 L 310 820 L 250 660 L 220 500 L 210 380 L 300 240 Z"
                  fill="rgba(30, 41, 59, 0.4)"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* Animated Flight Path Arcs */}
                {ROUTES.map((r) => {
                  const isActive = activeRoute.id === r.id;
                  return (
                    <g key={r.id}>
                      <path
                        d={r.path}
                        fill="none"
                        stroke={isActive ? "#38bdf8" : "rgba(147, 197, 253, 0.35)"}
                        strokeWidth={isActive ? "3.5" : "1.8"}
                        className="flight-path-animated cursor-pointer transition-all"
                        onClick={() => setActiveRoute(r)}
                        filter={isActive ? "url(#mapGlow)" : undefined}
                      />
                    </g>
                  );
                })}

                {/* Airport Nodes */}
                {AIRPORTS.map((a) => {
                  const isSelected = activeAirport.code === a.code;
                  return (
                    <g
                      key={a.code}
                      transform={`translate(${a.x}, ${a.y})`}
                      className="cursor-pointer group"
                      onClick={() => setActiveAirport(a)}
                    >
                      {/* Outer pulse */}
                      <circle
                        r={isSelected ? "15" : "9"}
                        fill="none"
                        stroke={isSelected ? "#38bdf8" : "rgba(56, 189, 248, 0.5)"}
                        strokeWidth="1.5"
                        className="animate-ping opacity-60"
                      />
                      {/* Main Node Circle */}
                      <circle
                        r={isSelected ? "8" : "5"}
                        fill={isSelected ? "#38bdf8" : "#2563eb"}
                        stroke="#ffffff"
                        strokeWidth="2"
                        filter="url(#mapGlow)"
                      />
                      {/* Node Text Label */}
                      <text
                        x="12"
                        y="4"
                        fill={isSelected ? "#38bdf8" : "#f1f5f9"}
                        fontSize="13"
                        fontWeight="bold"
                        className="font-mono tracking-wider drop-shadow-md"
                      >
                        {a.code}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Floating Live Fare Badges over Map */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2 z-20">
              {ROUTES.slice(0, 4).map((r) => (
                <button
                  key={r.id}
                  onClick={() => setActiveRoute(r)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all backdrop-blur-xl border ${
                    activeRoute.id === r.id
                      ? "bg-blue-600 text-white border-cyan-400 shadow-lg shadow-blue-500/40 scale-105"
                      : "bg-slate-900/90 text-slate-200 border-white/10 hover:bg-white/20"
                  }`}
                >
                  <span>{r.from} → {r.to}</span>
                  <span className="text-cyan-300 font-black">{r.fare}</span>
                  <span className={r.isUp ? "text-rose-400 text-[10px]" : "text-emerald-400 text-[10px]"}>
                    {r.change}
                  </span>
                </button>
              ))}
            </div>

          </div>

          {/* Right Column: Live Corridor Inspector Panel */}
          <div className="lg:col-span-4 flex flex-col space-y-5">
            
            {/* Active Route Inspector Card */}
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/20 bg-white/95 dark:bg-slate-900/60 p-6 backdrop-blur-2xl shadow-xl shadow-blue-950/5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-white/10">
                <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-cyan-300">
                  Corridor Inspector
                </span>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                  Live Feed
                </span>
              </div>

              <div className="mt-4">
                <div className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <span>{activeRoute.from}</span>
                  <Plane className="h-5 w-5 text-blue-600 dark:text-cyan-400 transform rotate-90" />
                  <span>{activeRoute.to}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                  Trunk Corridor • {activeRoute.frequency}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Current Fare Index</div>
                  <div className="text-2xl font-black text-slate-950 dark:text-white mt-0.5">{activeRoute.fare}</div>
                  <div className={`text-[11px] font-bold mt-1 ${activeRoute.isUp ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {activeRoute.change} 24h Trend
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Advance Purchase</div>
                  <div className="text-lg font-black text-slate-950 dark:text-white mt-0.5">T+7 / T+30</div>
                  <div className="text-[11px] font-bold text-blue-600 dark:text-cyan-300 mt-1">
                    Dual Basket Window
                  </div>
                </div>
              </div>

              <div className="mt-5 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400">Primary Airline Feeds:</span>
                  <span className="font-bold text-slate-900 dark:text-white">IndiGo & Air India Direct</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400">Tax Reconciliation:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Base + UDF Verified</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Outlier Filter:</span>
                  <span className="font-bold text-blue-600 dark:text-cyan-300">1.5 × IQR Enforced</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (isAuthenticated) {
                    navigate("/routes");
                  } else {
                    navigate(`/login?redirect=${encodeURIComponent("/routes")}`);
                  }
                }}
                className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:shadow-cyan-500/30 transition-all"
              >
                <span>View Full Route Analytics</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Selected Airport Node Card */}
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/90 dark:bg-slate-900/50 p-5 backdrop-blur-xl shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-400/30">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{activeAirport.name} ({activeAirport.code})</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">{activeAirport.city} • {activeAirport.tier} Tier Hub</div>
                </div>
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-700 dark:text-slate-300 pt-2.5 border-t border-slate-200/80 dark:border-white/10">
                <span className="text-slate-500">DGCA National Traffic Volume Share:</span>
                <span className="font-bold text-blue-600 dark:text-cyan-300">{activeAirport.trafficShare}</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
