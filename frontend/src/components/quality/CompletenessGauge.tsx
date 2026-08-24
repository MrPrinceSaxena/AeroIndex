interface CompletenessGaugeProps {
  pct: number;
  covered: number;
  expected: number;
}

/** Donut gauge for basket coverage — pure SVG, no chart library needed. */
export function CompletenessGauge({ pct, covered, expected }: CompletenessGaugeProps) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.min(100, Math.max(0, pct)) / 100) * circumference;
  const tone = pct >= 95 ? "#16a34a" : pct >= 80 ? "#d97706" : "#dc2626";
  const label = pct >= 95 ? "Good" : pct >= 80 ? "Partial" : "Sparse";

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={`Basket coverage ${pct}%`}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#eef2f7" strokeWidth="14" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="66" textAnchor="middle" className="tabular" fontSize="22" fontWeight="700" fill="#0f172a">
          {pct.toFixed(1)}%
        </text>
        <text x="70" y="86" textAnchor="middle" fontSize="11" fill="#64748b">
          {label}
        </text>
      </svg>
      <p className="mt-1 text-center text-[11px] leading-snug text-apix-muted">
        <span className="tabular font-semibold text-apix-text">
          {covered} of {expected}
        </span>{" "}
        basket cells have a bookable fare
      </p>
    </div>
  );
}
