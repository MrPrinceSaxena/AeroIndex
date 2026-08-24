import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { TopMover } from "../../types/apix";
import { EmptyState } from "../ui/EmptyState";
import { formatFare, routeCode } from "../../utils/format";

interface TopMoversListProps {
  movers: TopMover[];
}

export function TopMoversList({ movers }: TopMoversListProps) {
  if (movers.length === 0) {
    return <EmptyState message="Route movements need at least two observation dates. Run the ingestion pipeline again to build history." />;
  }

  return (
    <ul className="space-y-1">
      {movers.map((m) => {
        const rising = m.pct_change > 0;
        return (
          <li key={m.route}>
            <Link
              to="/routes"
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-apix-surface-alt"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-apix-text">{routeCode(m.route)}</div>
                <div className="tabular text-[11px] text-apix-muted">
                  {formatFare(m.fare_previous)} → {formatFare(m.fare_latest)}
                </div>
              </div>
              <span
                className={`tabular inline-flex shrink-0 items-center gap-0.5 text-[13px] font-semibold ${
                  rising ? "text-apix-up" : "text-apix-down"
                }`}
              >
                {rising ? (
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
                )}
                {Math.abs(m.pct_change).toFixed(1)}%
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
