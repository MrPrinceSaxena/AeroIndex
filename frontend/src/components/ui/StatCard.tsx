import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { InfoTip } from "./InfoTip";

interface StatCardProps {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  /** Signed percentage; positive renders red (fares up), negative green (fares down). */
  deltaPct?: number | null;
  deltaLabel?: string;
  badge?: ReactNode;
  tip?: string;
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  caption,
  deltaPct,
  deltaLabel,
  badge,
  tip,
  loading,
}: StatCardProps) {
  const hasDelta = typeof deltaPct === "number" && Number.isFinite(deltaPct);
  const rising = hasDelta && deltaPct! > 0;

  return (
    <div className="rounded-xl border border-apix-border bg-apix-surface px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] leading-tight font-medium text-apix-muted">{label}</span>
        {tip && <InfoTip text={tip} />}
      </div>

      {loading ? (
        <div className="mt-2 h-7 w-20 animate-pulse rounded bg-apix-border" />
      ) : (
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="tabular text-[26px] leading-none font-bold text-apix-text">{value}</span>
          {hasDelta && (
            <span
              className={`tabular inline-flex items-center gap-0.5 text-[12px] font-semibold ${
                rising ? "text-apix-up" : "text-apix-down"
              }`}
            >
              {rising ? (
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {Math.abs(deltaPct!).toFixed(1)}%
            </span>
          )}
        </div>
      )}

      {(caption || deltaLabel) && (
        <div className="mt-1 text-[11px] leading-snug text-apix-muted">{caption ?? deltaLabel}</div>
      )}
      {badge && <div className="mt-1.5">{badge}</div>}
    </div>
  );
}
