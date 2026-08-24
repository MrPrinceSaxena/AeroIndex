import type { OutlierGroupStat } from "../../types/apix";
import { EmptyState } from "../ui/EmptyState";
import { routeCode } from "../../utils/format";

interface OutlierBreakdownTableProps {
  groups: OutlierGroupStat[];
}

/** Per route+window outlier rate, drawn as inline bars for quick comparison. */
export function OutlierBreakdownTable({ groups }: OutlierBreakdownTableProps) {
  if (groups.length === 0) {
    return <EmptyState message="Outlier breakdown appears once enough fares are collected per route and window — the IQR test needs at least four observations in a group." />;
  }

  const max = Math.max(...groups.map((g) => g.pct_outliers), 1);

  return (
    <ul className="space-y-2">
      {groups.map((g, i) => (
        <li key={`${g.route}-${g.advance_purchase_days}-${i}`}>
          <div className="flex items-baseline justify-between gap-2 text-[12px]">
            <span className="font-medium text-apix-text">
              {routeCode(g.route)} <span className="text-apix-muted">· T-{g.advance_purchase_days}</span>
            </span>
            <span className="tabular text-apix-muted">
              {g.n_outliers}/{g.n_total} ·{" "}
              <span className={g.pct_outliers > 0 ? "font-semibold text-apix-warn" : ""}>
                {g.pct_outliers}%
              </span>
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-apix-surface-alt">
            <div
              className="h-full rounded-full bg-apix-warn"
              style={{ width: `${(g.pct_outliers / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
