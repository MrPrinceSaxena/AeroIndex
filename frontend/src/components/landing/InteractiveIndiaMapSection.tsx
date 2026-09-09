import { useState } from "react";
import { Plane, Compass, ArrowRight, MapPin, Radio, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface AirportNode {
  code: string;
  name: string;
  city: string;
  state: string;
  fir: string;
  x: number;
  y: number;
  trafficShare: string;
  tier: "Trunk Benchmark" | "Metro Hub" | "Regional Hub";
}

const AIRPORTS: AirportNode[] = [
  { code: "DEL", name: "Indira Gandhi Intl", city: "Delhi", state: "NCR", fir: "Delhi FIR", x: 360, y: 280, trafficShare: "31.2%", tier: "Trunk Benchmark" },
  { code: "BOM", name: "Chhatrapati Shivaji Maharaj Intl", city: "Mumbai", state: "Maharashtra", fir: "Mumbai FIR", x: 250, y: 530, trafficShare: "22.4%", tier: "Trunk Benchmark" },
  { code: "BLR", name: "Kempegowda Intl", city: "Bengaluru", state: "Karnataka", fir: "Chennai FIR", x: 350, y: 720, trafficShare: "14.8%", tier: "Trunk Benchmark" },
  { code: "HYD", name: "Rajiv Gandhi Intl", city: "Hyderabad", state: "Telangana", fir: "Chennai FIR", x: 380, y: 580, trafficShare: "8.6%", tier: "Metro Hub" },
  { code: "MAA", name: "Chennai Intl", city: "Chennai", state: "Tamil Nadu", fir: "Chennai FIR", x: 420, y: 725, trafficShare: "7.1%", tier: "Metro Hub" },
  { code: "CCU", name: "Netaji Subhash Chandra Bose Intl", city: "Kolkata", state: "West Bengal", fir: "Kolkata FIR", x: 615, y: 440, trafficShare: "6.9%", tier: "Metro Hub" },
  { code: "AMD", name: "Sardar Vallabhbhai Patel Intl", city: "Ahmedabad", state: "Gujarat", fir: "Mumbai FIR", x: 240, y: 435, trafficShare: "3.4%", tier: "Metro Hub" },
  { code: "GOI", name: "Manohar Intl (Mopa / Dabolim)", city: "Goa", state: "Goa", fir: "Mumbai FIR", x: 265, y: 645, trafficShare: "2.1%", tier: "Regional Hub" },
  { code: "COK", name: "Cochin Intl", city: "Kochi", state: "Kerala", fir: "Chennai FIR", x: 330, y: 805, trafficShare: "2.3%", tier: "Regional Hub" },
  { code: "GAU", name: "Lokpriya Gopinath Bordoloi Intl", city: "Guwahati", state: "Assam", fir: "Guwahati FIR", x: 715, y: 355, trafficShare: "1.2%", tier: "Regional Hub" },
  { code: "SXR", name: "Sheikh ul-Alam Intl", city: "Srinagar", state: "J&K", fir: "Delhi FIR", x: 305, y: 145, trafficShare: "1.1%", tier: "Regional Hub" },
  { code: "JAI", name: "Jaipur Intl", city: "Jaipur", state: "Rajasthan", fir: "Delhi FIR", x: 315, y: 335, trafficShare: "1.4%", tier: "Regional Hub" },
  { code: "PAT", name: "Jay Prakash Narayan Intl", city: "Patna", state: "Bihar", fir: "Kolkata FIR", x: 535, y: 375, trafficShare: "1.3%", tier: "Regional Hub" },
  { code: "BBI", name: "Biju Patnaik Intl", city: "Bhubaneswar", state: "Odisha", fir: "Kolkata FIR", x: 540, y: 530, trafficShare: "1.2%", tier: "Regional Hub" },
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
    path: "M 360 280 Q 280 400, 250 530",
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
    path: "M 360 280 Q 380 500, 350 720",
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
    path: "M 250 530 Q 290 625, 350 720",
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
    path: "M 360 280 Q 490 350, 615 440",
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
    path: "M 250 530 Q 315 550, 380 580",
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
    path: "M 350 720 Q 385 715, 420 725",
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
    path: "M 360 280 Q 295 360, 240 435",
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
    path: "M 250 530 Q 255 590, 265 645",
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
    path: "M 360 280 Q 530 300, 715 355",
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
    path: "M 360 280 Q 325 210, 305 145",
  },
  {
    id: "CCU-BBI",
    from: "CCU",
    to: "BBI",
    fare: "₹2,720",
    change: "↓ 0.5%",
    isUp: false,
    frequency: "16 flights/day",
    paxWeight: "Eastern Coastal",
    path: "M 615 440 Q 575 485, 540 530",
  },
  {
    id: "DEL-PAT",
    from: "DEL",
    to: "PAT",
    fare: "₹4,250",
    change: "↑ 2.9%",
    isUp: true,
    frequency: "24 flights/day",
    paxWeight: "Gangetic Trunk",
    path: "M 360 280 Q 445 325, 535 375",
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
      <div className="absolute top-1/3 left-1/4 -translate-y-1/2 w-[700px] h-[700px] bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[550px] h-[550px] bg-cyan-400/10 dark:bg-cyan-400/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-10 right-1/3 w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50 dark:bg-blue-950/50 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-cyan-300 backdrop-blur-md mb-3 shadow-xs">
              <Compass className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
              <span>Complete National Airspace Radar</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
              Complete Map of India,{" "}
              <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 bg-clip-text text-transparent">
                Live Flight Corridors.
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl font-medium">
              High-precision geographic mapping of India's national aviation corridors with live fares, DGCA passenger traffic weighting, and direct airline scraping feeds.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/90 dark:bg-slate-900/80 p-3.5 backdrop-blur-xl shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-xs">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>14 Airport Hubs</span>
                <span className="text-slate-400">•</span>
                <span className="text-blue-600 dark:text-cyan-400">12 Live Corridors</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                DGCA Annual Domestic Traffic Survey FY24 Aligned
              </div>
            </div>
          </div>
        </div>

        {/* The 3D Map Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left / Center: Complete Interactive SVG Flight Route Canvas of India */}
          <div className="lg:col-span-8 relative rounded-3xl border border-slate-800/90 bg-gradient-to-b from-slate-950 via-[#020617] to-slate-950 p-4 sm:p-6 shadow-2xl overflow-hidden min-h-[620px] flex flex-col justify-between">
            
            {/* Top Bar inside Map Canvas */}
            <div className="flex items-center justify-between z-20 pb-2">
              <div className="flex items-center gap-2.5 rounded-full border border-cyan-500/30 bg-slate-900/90 px-3.5 py-1.5 text-xs text-slate-200 backdrop-blur-md shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span className="font-bold text-[11px] tracking-wide text-cyan-300">AIRSPACE: INDIA NATIONAL</span>
                <span className="text-slate-500">•</span>
                <span className="text-[10px] text-slate-400 font-mono">ALL FIR ZONES</span>
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

            {/* Complete Geographic Vector Map of India */}
            <div className="relative w-full aspect-[4/4] max-h-[560px] flex items-center justify-center my-auto">
              <svg
                viewBox="80 60 760 820"
                className="w-full h-full drop-shadow-[0_0_45px_rgba(59,130,246,0.35)] select-none"
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

                  {/* India Landmass Gradient */}
                  <linearGradient id="indiaLandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0f172a" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#1e293b" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#0a0f1d" stopOpacity="0.95" />
                  </linearGradient>

                  <radialGradient id="radarCenterGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Radar Concentric Distance Range Rings */}
                <circle cx="360" cy="530" r="140" fill="none" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="360" cy="530" r="260" fill="none" stroke="rgba(56, 189, 248, 0.07)" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="360" cy="530" r="380" fill="none" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="1" />
                <circle cx="360" cy="530" r="430" fill="url(#radarCenterGlow)" />

                {/* Airspace Coordinate Lines */}
                <line x1="90" y1="280" x2="800" y2="280" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="2 4" />
                <line x1="90" y1="530" x2="800" y2="530" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="2 4" />
                <line x1="90" y1="720" x2="800" y2="720" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="2 4" />
                <line x1="360" y1="80" x2="360" y2="850" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" strokeDasharray="2 4" />

                {/* ======================================================== */}
                {/* COMPLETE HIGH-PRECISION GEOGRAPHIC MAP OF INDIA          */}
                {/* Includes J&K, Ladakh, Rajasthan, Gujarat Kathiawar/Rann, */}
                {/* Konkan, Malabar, Kanyakumari, Coromandel, Bengal, NE     */}
                {/* ======================================================== */}
                <path
                  d="
                    M 295 125 
                    C 305 100, 325 85, 345 85 
                    C 365 85, 385 105, 395 125 
                    C 415 145, 435 160, 445 185 
                    C 455 205, 435 225, 415 240 
                    C 440 250, 480 255, 520 270 
                    C 560 285, 600 290, 625 295 
                    C 645 300, 670 290, 695 285 
                    C 725 280, 755 290, 775 315 
                    C 790 335, 785 360, 765 375 
                    C 745 390, 730 405, 740 430 
                    C 745 445, 730 460, 715 455 
                    C 700 450, 690 435, 680 425 
                    C 665 410, 650 415, 635 435 
                    C 630 445, 640 460, 635 480 
                    C 625 500, 600 505, 580 520 
                    C 555 540, 540 575, 525 610 
                    C 505 650, 475 685, 450 725 
                    C 435 750, 410 780, 380 815 
                    C 360 840, 345 850, 335 835 
                    C 320 805, 310 770, 295 725 
                    C 280 675, 265 625, 255 575 
                    C 245 530, 230 495, 215 470 
                    C 195 440, 180 430, 195 405 
                    C 215 375, 235 365, 240 335 
                    C 245 310, 270 280, 285 240 
                    C 295 205, 285 160, 295 125 Z
                  "
                  fill="url(#indiaLandGradient)"
                  stroke="rgba(56, 189, 248, 0.55)"
                  strokeWidth="2.5"
                  filter="url(#mapGlow)"
                />

                {/* Regional FIR / State Boundary Network */}
                <path
                  d="
                    M 295 240 Q 360 280, 445 185
                    M 240 335 Q 360 335, 520 270
                    M 195 405 Q 360 435, 635 435
                    M 255 575 Q 380 580, 540 575
                    M 295 725 Q 350 720, 450 725
                    M 360 280 L 380 580 L 350 720 L 335 835
                    M 635 435 L 695 285
                  "
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />

                {/* Island Territories */}
                {/* Lakshadweep */}
                <g opacity="0.75">
                  <circle cx="205" cy="745" r="3" fill="#38bdf8" />
                  <circle cx="210" cy="765" r="2.5" fill="#38bdf8" />
                  <circle cx="215" cy="790" r="2" fill="#38bdf8" />
                  <text x="175" y="770" fill="#94a3b8" fontSize="8" fontWeight="bold">LAKSHADWEEP</text>
                </g>

                {/* Andaman & Nicobar */}
                <g opacity="0.75">
                  <circle cx="745" cy="660" r="3.5" fill="#38bdf8" />
                  <circle cx="750" cy="685" r="3" fill="#38bdf8" />
                  <circle cx="755" cy="710" r="3" fill="#38bdf8" />
                  <circle cx="760" cy="740" r="2.5" fill="#38bdf8" />
                  <text x="715" y="700" fill="#94a3b8" fontSize="8" fontWeight="bold">ANDAMAN & NICOBAR</text>
                </g>

                {/* ======================================================== */}
                {/* FLIGHT ROUTE ARCS WITH DYNAMIC NEON LIGHTING            */}
                {/* ======================================================== */}
                {ROUTES.map((r) => {
                  const isActive = activeRoute.id === r.id;
                  return (
                    <g key={r.id} className="transition-all duration-300">
                      {/* Outer Glow Halo */}
                      <path
                        d={r.path}
                        fill="none"
                        stroke={isActive ? "#38bdf8" : r.isPrimaryTrunk ? "rgba(96, 165, 250, 0.4)" : "rgba(148, 163, 184, 0.18)"}
                        strokeWidth={isActive ? "7" : r.isPrimaryTrunk ? "3" : "1.8"}
                        strokeLinecap="round"
                        filter={isActive ? "url(#corridorGlow)" : undefined}
                        opacity={isActive ? 0.95 : 0.65}
                      />

                      {/* Main Interactive Vector Route Line */}
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
                {/* AIRPORT NODES WITH CONCENTRIC RADAR BEACONS              */}
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
                        stroke={isSelected || isRouteEndpoint ? "#38bdf8" : isTrunk ? "#2563eb" : "#0284c7"}
                        strokeWidth={isSelected || isRouteEndpoint ? "2" : "1"}
                        className="animate-ping opacity-75"
                        style={{ animationDuration: isSelected ? "1.8s" : "3.5s" }}
                      />

                      {/* Node Halo Base */}
                      <circle
                        r={isSelected || isRouteEndpoint ? "10" : "6"}
                        fill={isSelected ? "#0284c7" : isRouteEndpoint ? "#2563eb" : "#0f172a"}
                        stroke={isSelected || isRouteEndpoint ? "#38bdf8" : isTrunk ? "#60a5fa" : "#475569"}
                        strokeWidth="2"
                        filter="url(#mapGlow)"
                      />

                      {/* Center Node Dot */}
                      <circle
                        r={isSelected ? "5" : "3.5"}
                        fill={isSelected || isRouteEndpoint ? "#ffffff" : isTrunk ? "#38bdf8" : "#94a3b8"}
                      />

                      {/* Node Airport Code Badge */}
                      <g transform="translate(10, -9)">
                        <rect
                          x="0"
                          y="-2"
                          width={a.code.length * 8 + 12}
                          height="18"
                          rx="5"
                          fill={isSelected || isRouteEndpoint ? "rgba(2, 132, 199, 0.95)" : "rgba(15, 23, 42, 0.9)"}
                          stroke={isSelected || isRouteEndpoint ? "#38bdf8" : "rgba(255, 255, 255, 0.2)"}
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

                      {/* City Name Label */}
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
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                <span>Listed Corridors:</span>
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
                    {activeAirport.city}, {activeAirport.state} • {activeAirport.fir}
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
