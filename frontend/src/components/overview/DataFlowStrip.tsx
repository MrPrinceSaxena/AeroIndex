import type { LucideIcon } from "lucide-react";
import {
  Globe,
  Filter,
  Database,
  TrendingUp,
  Landmark,
  PieChart,
  Cloud,
  Users,
  ChevronRight,
} from "lucide-react";

interface Stage {
  Icon: LucideIcon;
  title: string;
  detail: string;
}

const STAGES: Stage[] = [
  { Icon: Globe, title: "Data Collection", detail: "Airline sites + synthetic gap-filler" },
  { Icon: Filter, title: "Validation & Cleaning", detail: "Dedup, outliers, reconciliation" },
  { Icon: Database, title: "Processing", detail: "Structured storage in PostgreSQL" },
  { Icon: TrendingUp, title: "Index Calculation", detail: "Weighted, chain-linked" },
  { Icon: Landmark, title: "Benchmarking", detail: "Compared against DGCA reference" },
  { Icon: PieChart, title: "Analytics & Insights", detail: "Routes, windows, quality" },
  { Icon: Cloud, title: "API Layer", detail: "JSON endpoints for integration" },
  { Icon: Users, title: "Govt. Decision Making", detail: "Policy, monitoring, transparency" },
];

/**
 * The end-to-end pipeline, so the Overview page explains the whole system at
 * a glance rather than only its latest numbers. Each stage maps to a real
 * part of the codebase — this is documentation of what runs, not decoration.
 */
export function DataFlowStrip() {
  return (
    <div className="thin-scroll overflow-x-auto">
      <ol className="flex min-w-max items-stretch gap-1">
        {STAGES.map(({ Icon, title, detail }, i) => (
          <li key={title} className="flex items-stretch gap-1">
            <div className="flex w-[136px] flex-col items-center rounded-lg border border-apix-border bg-apix-surface-alt px-2 py-3 text-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-apix-primary-soft text-apix-primary">
                <Icon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <span className="mt-2 text-[11px] leading-tight font-semibold text-apix-text">
                {i + 1}. {title}
              </span>
              <span className="mt-0.5 text-[10px] leading-snug text-apix-muted">{detail}</span>
            </div>
            {i < STAGES.length - 1 && (
              <div className="flex items-center">
                <ChevronRight className="h-4 w-4 shrink-0 text-apix-faint" aria-hidden="true" />
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
