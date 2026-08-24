import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { LineChart, Map, Table2, ShieldCheck, Landmark, BookOpen, Activity } from "lucide-react";

interface NavCard {
  to: string;
  label: string;
  caption: string;
  Icon: LucideIcon;
}

const CARDS: NavCard[] = [
  { to: "/index", label: "Air Fare Index", caption: "Full daily & weekly index history", Icon: LineChart },
  { to: "/routes", label: "Route Analytics", caption: "Per-route trends & index contribution", Icon: Map },
  { to: "/explorer", label: "Data Explorer", caption: "Browse every raw fare quote collected", Icon: Table2 },
  { to: "/data-quality", label: "Data Quality", caption: "Outliers, mismatches, confidence signals", Icon: ShieldCheck },
  { to: "/benchmarking", label: "DGCA Benchmarking", caption: "Compared against published reference fares", Icon: Landmark },
  { to: "/methodology", label: "Methodology", caption: "Formula, weights, compliance", Icon: BookOpen },
  { to: "/system-health", label: "System Health", caption: "Pipeline status & data freshness", Icon: Activity },
];

export function QuickNavGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {CARDS.map(({ to, label, caption, Icon }) => (
        <Link
          key={to}
          to={to}
          className="flex items-start gap-3 rounded-2xl border border-apix-border bg-apix-surface p-4 transition hover:border-apix-real hover:shadow-sm focus-visible:ring-2 focus-visible:ring-apix-real"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-apix-real/10 text-apix-real">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-apix-text">{label}</span>
            <span className="block text-xs text-apix-muted">{caption}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
