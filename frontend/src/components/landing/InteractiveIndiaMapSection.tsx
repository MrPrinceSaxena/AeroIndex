import { useState } from "react";
import { Plane, Compass, ArrowRight, MapPin, Radio, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface AirportNode {
  code: string;
  name: string;
  city: string;
  state: string;
  x: number;
  y: number;
  trafficShare: string;
  tier: "Trunk Benchmark" | "Metro Hub" | "Regional";
}

const AIRPORTS: AirportNode[] = [
  { code: "DEL", name: "Indira Gandhi Intl", city: "Delhi", state: "NCR", x: 365, y: 290, trafficShare: "31.2%", tier: "Trunk Benchmark" },
  { code: "BOM", name: "Chhatrapati Shivaji Maharaj Intl", city: "Mumbai", state: "Maharashtra", x: 260, y: 530, trafficShare: "22.4%", tier: "Trunk Benchmark" },
  { code: "BLR", name: "Kempegowda Intl", city: "Bengaluru", state: "Karnataka", x: 345, y: 715, trafficShare: "14.8%", tier: "Trunk Benchmark" },
  { code: "HYD", name: "Rajiv Gandhi Intl", city: "Hyderabad", state: "Telangana", x: 385, y: 585, trafficShare: "8.6%", tier: "Metro Hub" },
  { code: "MAA", name: "Chennai Intl", city: "Chennai", state: "Tamil Nadu", x: 415, y: 725, trafficShare: "7.1%", tier: "Metro Hub" },
  { code: "CCU", name: "Netaji Subhash Chandra Bose Intl", city: "Kolkata", state: "West Bengal", x: 620, y: 440, trafficShare: "6.9%", tier: "Metro Hub" },
  { code: "AMD", name: "Sardar Vallabhbhai Patel Intl", city: "Ahmedabad", state: "Gujarat", x: 245, y: 435, trafficShare: "3.4%", tier: "Metro Hub" },
  { code: "GOI", name: "Manohar Intl (Mopa)", city: "Goa", state: "Goa", x: 270, y: 645, trafficShare: "2.1%", tier: "Regional" },
  { code: "COK", name: "Cochin Intl", city: "Kochi", state: "Kerala", x: 325, y: 805, trafficShare: "2.3%", tier: "Regional" },
  { code: "GAU", name: "Lokpriya Gopinath Bordoloi Intl", city: "Guwahati", state: "Assam", x: 735, y: 360, trafficShare: "1.2%", tier: "Regional" },
  { code: "SXR", name: "Sheikh ul-Alam Intl", city: "Srinagar", state: "J&K", x: 310, y: 150, trafficShare: "1.1%", tier: "Regional" },
  { code: "JAI", name: "Jaipur Intl", city: "Jaipur", state: "Rajasthan", x: 320, y: 340, trafficShare: "1.4%", tier: "Regional" },
];

interface RouteItem {
  id: string;
  from: string;
  to: string;
  fare: string;
  change: string;
  isUp: boolean;
  frequency: string;
  paxWeight: string;
  path: string;
  isPrimaryTrunk?: boolean;
}

const ROUTES: RouteItem[] = [
  {
    id: "DEL-BOM",
    from: "DEL",
    to: "BOM",
    fare: "₹6,230",
    change: "↓ 4.2%",
    isUp: false,
    frequency: "68 flights/day",
    paxWeight: "43.8% DGCA Weight",
    path: "M 365 290 Q 285 400, 260 530",
    isPrimaryTrunk: true,
  },
  {
    id: "DEL-BLR",
    from: "DEL",
    to: "BLR",
    fare: "₹5,150",
    change: "↑ 3.4%",
    isUp: true,
    frequency: "54 flights/day",
    paxWeight: "32.2% DGCA Weight",
    path: "M 365 290 Q 380 500, 345 715",
    isPrimaryTrunk: true,
  },
  {
    id: "BOM-BLR",
    from: "BOM",
    to: "BLR",
    fare: "₹3,940",
    change: "↑ 2.2%",
    isUp: true,
    frequency: "42 flights/day",
    paxWeight: "24.0% DGCA Weight",
    path: "M 260 530 Q 295 625, 345 715",
    isPrimaryTrunk: true,
  },
  {
    id: "DEL-CCU",
    from: "DEL",
    to: "CCU",
    fare: "₹4,890",
    change: "↓ 1.5%",
    isUp: false,
    frequency: "36 flights/day",
    paxWeight: "Metro Trunk",
    path: "M 365 290 Q 490 350, 620 440",
  },
  {
    id: "BOM-HYD",
    from: "BOM",
    to: "HYD",
    fare: "₹4,120",
    change: "↓ 2.8%",
    isUp: false,
    frequency: "32 flights/day",
    paxWeight: "Metro Corridor",
    path: "M 260 530 Q 320 545, 385 585",
  },
  {
    id: "BLR-MAA",
    from: "BLR",
    to: "MAA",
    fare: "₹2,850",
    change: "↓ 0.9%",
    isUp: false,
    frequency: "28 flights/day",
    paxWeight: "Regional Shuttle",
    path: "M 345 715 Q 380 710, 415 725",
  },
  {
    id: "DEL-AMD",
    from: "DEL",
    to: "AMD",
    fare: "₹3,620",
    change: "↑ 1.8%",
    isUp: true,
    frequency: "26 flights/day",
    paxWeight: "Commercial Link",
    path: "M 365 290 Q 300 360, 245 435",
  },
  {
    id: "BOM-GOI",
    from: "BOM",
    to: "GOI",
    fare: "₹2,980",
    change: "↑ 4.5%",
    isUp: true,
    frequency: "24 flights/day",
    paxWeight: "Tourist Corridor",
    path: "M 260 530 Q 260 590, 270 645",
  },
  {
    id: "DEL-GAU",
    from: "DEL",
    to: "GAU",
    fare: "₹5,420",
    change: "↓ 1.1%",
    isUp: false,
    frequency: "18 flights/day",
    paxWeight: "NE Gateway",
    path: "M 365 290 Q 550 310, 735 360",
  },
  {
    id: "DEL-SXR",
    from: "DEL",
    to: "SXR",
    fare: "₹4,680",
    change: "↑ 5.2%",
    isUp: true,
    frequency: "22 flights/day",
    paxWeight: "Northern Ridge",
    path: "M 365 290 Q 330 215, 310 150",
  },
];

export function InteractiveIndiaMapSection() {
  const [activeAirport, setActiveAirport] = useState<AirportNode>(AIRPORTS[0]);
  const [activeRoute, setActiveRoute] = useState<RouteItem>(ROUTES[0]);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <section
      id="india-map"
      className="relative py-24 bg-gradient-to-b from-white via-sky-50/40 to-white dark:from-slate-950 dark:via-slate-900/90 dark:to-slate-950 overflow-hidden border-t border-b border-slate-200/80 dark:border-white/10"
    >
      {/* Background Dynamic Light Orbs */}
      <div className="absolute top-1/3 left-1/4 -translate-y-1/2 w-[650px] h-[650px] bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-cyan-400/10 dark:bg-cyan-400/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-10 right-1/3 w-[350px] h-[350px] bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50 dark:bg-blue-950/50 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-cyan-300 backdrop-blur-md mb-3 shadow-xs">
              <Compass className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
              <span>National Airspace Corridor Radar</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
              India’s Aviation Corridors,{" "}
              <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 bg-clip-text text-transparent">
                Mapped Live.
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl font-medium">
              Real-time flight routes, DGCA passenger volume weighting, and live corridor prices rendered on an authentic vector radar map of India.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/90 dark:bg-slate-900/80 p-3.5 backdrop-blur-xl shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-xs">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>12 Active Hubs</span>
                <span className="text-slate-400">•</span>
                <span className="text-blue-600 dark:text-cyan-400">10 Major Corridors</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Calibrated against DGCA Annual Traffic Survey FY24
              </div>
            </div>
          </div>
        </div>

        {/* The 3D Map Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left / Center: Interactive SVG Flight Route Canvas */}
          <div className="lg:col-span-8 relative rounded-3xl border border-slate-800/90 bg-gradient-to-b from-slate-950 via-[#030712] to-slate-950 p-4 sm:p-6 shadow-2xl overflow-hidden min-h-[580px] flex flex-col justify-between">
            
            {/* Top Bar inside Map Canvas */}
            <div className="flex items-center justify-between z-20 pb-2">
              <div className="flex items-center gap-2.5 rounded-full border border-cyan-500/30 bg-slate-900/90 px-3.5 py-1.5 text-xs text-slate-200 backdrop-blur-md shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span className="font-bold text-[11px] tracking-wide text-cyan-300">LIVE AIRSPACE RADAR</span>
                <span className="text-slate-500">•</span>
                <span className="text-[10px] text-slate-400 font-mono">100M+ PAX BASKET</span>
              </div>

              {/* Corridor filter pills */}
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 border border-white/10 p-1 rounded-xl">
                {(["DEL-BOM", "DEL-BLR", "BOM-BLR"] as const).map((rId) => {
                  const rObj = ROUTES.find((r) => r.id === rId)!;
                  const isSel = activeRoute.id === rId;
                  return (
                    <button
                      key={rId}
                      onClick={() => setActiveRoute(rObj)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                        isSel
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {rId} ({rObj.fare})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SVG India Flight Radar Canvas */}
            <div className="relative w-full aspect-[4/3.8] max-h-[520px] flex items-center justify-center my-auto">
              <svg
                viewBox="100 80 750 780"
                className="w-full h-full drop-shadow-[0_0_40px_rgba(59,130,246,0.3)] select-none"
              >
                <defs>
                  {/* Glowing Node Filter */}
                  <filter id="mapGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="corridorGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  {/* Dynamic Neon Gradients */}
                  <linearGradient id="activeArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>

                  <linearGradient id="radarGridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
                  </linearGradient>

                  {/* India Landmass Shading Gradient */}
                  <linearGradient id="indiaLandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0f172a" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#1e293b" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#0a0f1d" stopOpacity="0.9" />
                  </linearGradient>

                  <radialGradient id="radarCenterGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Radar Concentric Distance Range Rings */}
                <circle cx="365" cy="530" r="140" fill="none" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="365" cy="530" r="260" fill="none" stroke="rgba(56, 189, 248, 0.07)" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="365" cy="530" r="380" fill="none" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="1" />
                <circle cx="365" cy="530" r="420" fill="url(#radarCenterGlow)" />

                {/* Latitude and Longitude Airspace Coordinates */}
                <line x1="120" y1="290" x2="800" y2="290" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" strokeDasharray="2 4" />
                <line x1="120" y1="530" x2="800" y2="530" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" strokeDasharray="2 4" />
                <line x1="120" y1="715" x2="800" y2="715" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" strokeDasharray="2 4" />
                <line x1="365" y1="100" x2="365" y2="840" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" strokeDasharray="2 4" />

                {/* ======================================================== */}
                {/* AUTHENTIC GEOGRAPHIC OUTLINE OF INDIA                    */}
                {/* ======================================================== */}
                {/* 1. Outer Glow Silhouette */}
                <path
                  d="
                    M 300 130 
                    C 330 110, 360 125, 380 145 
                    C 410 170, 440 185, 460 215 
                    C 475 240, 520 255, 560 270 
                    C 600 280, 640 275, 680 290 
                    C 710 300, 750 310, 775 340 
                    C 795 365, 785 390, 750 405 
                    C 720 415, 690 410, 665 425 
                    C 645 440, 630 470, 605 490 
                    C 580 510, 550 540, 530 580 
                    C 510 620, 480 660, 450 710 
                    C 430 740, 400 780, 365 830 
                    C 350 850, 335 845, 325 825 
                    C 310 790, 295 750, 280 700 
                    C 265 650, 250 600, 245 545 
                    C 240 500, 220 460, 205 440 
                    C 185 415, 210 380, 230 365 
                    C 255 350, 275 320, 290 270 
                    C 300 230, 280 180, 300 130 Z
                  "
                  fill="url(#indiaLandGradient)"
                  stroke="rgba(56, 189, 248, 0.45)"
                  strokeWidth="2.5"
                  filter="url(#mapGlow)"
                />

                {/* 2. Inner Regional State Boundaries / Grids */}
                <path
                  d="
                    M 300 270 Q 365 290, 460 215
                    M 230 365 Q 365 340, 560 270
                    M 205 440 Q 365 435, 605 490
                    M 245 545 Q 385 585, 530 580
                    M 280 700 Q 345 715, 450 710
                    M 365 290 L 385 585 L 365 830
                  "
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />

                {/* Lakshadweep and Andaman Locators */}
                <circle cx="210" cy="760" r="3" fill="#38bdf8" opacity="0.6" />
                <circle cx="215" cy="780" r="2.5" fill="#38bdf8" opacity="0.6" />
                <circle cx="760" cy="680" r="3.5" fill="#38bdf8" opacity="0.6" />
                <circle cx="770" cy="710" r="3" fill="#38bdf8" opacity="0.6" />
                <circle cx="775" cy="740" r="2.5" fill="#38bdf8" opacity="0.6" />

                {/* ======================================================== */}
                {/* FLIGHT ROUTE ARCS WITH DYNAMIC NEON LIGHTING            */}
                {/* ======================================================== */}
                {ROUTES.map((r) => {
                  const isActive = activeRoute.id === r.id;
                  return (
                    <g key={r.id} className="transition-all duration-300">
                      {/* Background Route Glow */}
                      <path
                        d={r.path}
                        fill="none"
                        stroke={isActive ? "#38bdf8" : r.isPrimaryTrunk ? "rgba(96, 165, 250, 0.35)" : "rgba(148, 163, 184, 0.15)"}
                        strokeWidth={isActive ? "6" : r.isPrimaryTrunk ? "2.5" : "1.5"}
                        strokeLinecap="round"
                        filter={isActive ? "url(#corridorGlow)" : undefined}
                        opacity={isActive ? 0.9 : 0.6}
                      />

                      {/* Main Interactive Route Line */}
                      <path
                        d={r.path}
                        fill="none"
                        stroke={isActive ? "url(#activeArcGrad)" : r.isPrimaryTrunk ? "#60a5fa" : "#64748b"}
                        strokeWidth={isActive ? "3.5" : r.isPrimaryTrunk ? "2" : "1.2"}
                        strokeDasharray={isActive ? "6 3" : r.isPrimaryTrunk ? "none" : "3 3"}
                        className="cursor-pointer hover:stroke-cyan-300 transition-all"
                        onClick={() => setActiveRoute(r)}
                      />
                    </g>
                  );
                })}

                {/* ======================================================== */}
                {/* AIRPORT NODES WITH CONCENTRIC BEACONS                    */}
                {/* ======================================================== */}
                {AIRPORTS.map((a) => {
                  const isSelected = activeAirport.code === a.code;
                  const isRouteEndpoint = activeRoute.from === a.code || activeRoute.to === a.code;
                  const isTrunk = a.tier === "Trunk Benchmark";

                  return (
                    <g
                      key={a.code}
                      transform={`translate(${a.x}, ${a.y})`}
                      className="cursor-pointer group"
                      onClick={() => setActiveAirport(a)}
                    >
                      {/* Concentric Radar Beacon Ripple */}
                      <circle
                        r={isSelected || isRouteEndpoint ? "18" : isTrunk ? "12" : "8"}
                        fill="none"
                        stroke={isSelected || isRouteEndpoint ? "#38bdf8" : "#2563eb"}
                        strokeWidth={isSelected || isRouteEndpoint ? "1.8" : "1"}
                        className="animate-ping opacity-70"
                        style={{ animationDuration: isSelected ? "2s" : "3.5s" }}
                      />

                      {/* Halo Backlight */}
                      <circle
                        r={isSelected || isRouteEndpoint ? "10" : "6"}
                        fill={isSelected ? "#0284c7" : isRouteEndpoint ? "#2563eb" : "#0f172a"}
                        stroke={isSelected || isRouteEndpoint ? "#38bdf8" : isTrunk ? "#60a5fa" : "#475569"}
                        strokeWidth="2"
                        filter="url(#mapGlow)"
                      />

                      {/* Core Node Dot */}
                      <circle
                        r={isSelected ? "5" : "3.5"}
                        fill={isSelected || isRouteEndpoint ? "#ffffff" : isTrunk ? "#38bdf8" : "#94a3b8"}
                      />

                      {/* Node Airport Code Pill */}
                      <g transform="translate(10, -8)">
                        <rect
                          x="0"
                          y="-2"
                          width={a.code.length * 8 + 12}
                          height="18"
                          rx="5"
                          fill={isSelected || isRouteEndpoint ? "rgba(2, 132, 199, 0.9)" : "rgba(15, 23, 42, 0.85)"}
                          stroke={isSelected || isRouteEndpoint ? "#38bdf8" : "rgba(255, 255, 255, 0.15)"}
                          strokeWidth="1"
                        />
                        <text
                          x="6"
                          y="11"
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="bold"
                          className="font-mono tracking-wider"
                        >
                          {a.code}
                        </text>
                      </g>

                      {/* City Name Label (Visible for Trunk & Selected) */}
                      {(isTrunk || isSelected || isRouteEndpoint) && (
                        <text
                          x="10"
                          y="24"
                          fill={isSelected || isRouteEndpoint ? "#38bdf8" : "#cbd5e1"}
                          fontSize="9.5"
                          fontWeight="600"
                          className="drop-shadow-md"
                        >
                          {a.city}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Bottom Quick-Switch Corridor Ribbon */}
            <div className="z-20 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                <span>Active Trunks:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {ROUTES.slice(0, 5).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveRoute(r)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-1 text-xs font-bold transition-all border ${
                      activeRoute.id === r.id
                        ? "bg-blue-600 text-white border-cyan-400 shadow-md shadow-blue-500/30 scale-105"
                        : "bg-slate-900/90 text-slate-300 border-white/10 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span>{r.from} → {r.to}</span>
                    <span className="text-cyan-300 font-black">{r.fare}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Live Corridor Inspector & Airport Intelligence */}
          <div className="lg:col-span-4 flex flex-col space-y-4">
            
            {/* Active Route Inspector Card */}
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-900/80 p-6 backdrop-blur-2xl shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Corridor Telemetry
                  </span>
                </div>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                  Live Feed
                </span>
              </div>

              {/* Route Heading */}
              <div className="mt-4">
                <div className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-2.5">
                  <span>{activeRoute.from}</span>
                  <Plane className="h-5 w-5 text-blue-600 dark:text-cyan-400 transform rotate-90" />
                  <span>{activeRoute.to}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold flex items-center gap-2">
                  <span>{activeRoute.paxWeight}</span>
                  <span>•</span>
                  <span>{activeRoute.frequency}</span>
                </div>
              </div>

              {/* Metric Highlights */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Weighted Fare</div>
                  <div className="text-2xl font-black text-slate-950 dark:text-white mt-0.5">{activeRoute.fare}</div>
                  <div className={`text-[11px] font-bold mt-1 ${activeRoute.isUp ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {activeRoute.change} (24h)
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Advance Lead</div>
                  <div className="text-lg font-black text-slate-950 dark:text-white mt-0.5">T+7 / T+30</div>
                  <div className="text-[11px] font-bold text-blue-600 dark:text-cyan-400 mt-1">
                    Dual Lead-Time
                  </div>
                </div>
              </div>

              {/* Verified Provenance Specs */}
              <div className="mt-4 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Direct Airline Scrapes:</span>
                  <span className="font-bold text-slate-900 dark:text-white">IndiGo + Air India</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Outlier Filter:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">1.5 × IQR Normalized</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Index Math:</span>
                  <span className="font-bold text-blue-600 dark:text-cyan-300">Jevons Geometric Mean</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    navigate("/routes");
                  } else {
                    navigate(`/login?redirect=${encodeURIComponent("/routes")}`);
                  }
                }}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:shadow-cyan-500/30 transition-all hover:scale-[1.01]"
              >
                <span>Analyze Corridor Depth in Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Selected Airport Node Card */}
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/90 dark:bg-slate-900/60 p-4.5 backdrop-blur-xl shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-blue-400/30">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {activeAirport.name} ({activeAirport.code})
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    {activeAirport.city}, {activeAirport.state} • {activeAirport.tier}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-700 dark:text-slate-300 pt-2.5 border-t border-slate-200/80 dark:border-white/10">
                <span className="text-slate-500">DGCA Passenger Traffic Share:</span>
                <span className="font-bold text-blue-600 dark:text-cyan-300">{activeAirport.trafficShare}</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
