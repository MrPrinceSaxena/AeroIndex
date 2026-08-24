import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  valueColor?: string;
  badge?: ReactNode;
}

export function MetricCard({ label, value, caption, valueColor, badge }: MetricCardProps) {
  return (
    <div className="rounded-2xl border-l-4 border-apix-real bg-apix-surface p-6 shadow-sm">
      <div className="text-sm text-apix-muted">{label}</div>
      <div
        className="mt-1 text-4xl font-extrabold"
        style={valueColor ? { color: valueColor } : { color: "var(--color-apix-real)" }}
      >
        {value}
      </div>
      {caption && <div className="mt-1 text-xs text-apix-muted">{caption}</div>}
      {badge && <div className="mt-2">{badge}</div>}
    </div>
  );
}
