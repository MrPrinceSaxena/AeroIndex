import type { CrossSourceStat } from "../../types/apix";
import { EmptyState } from "../ui/EmptyState";
import { routeLabel } from "../../utils/format";

interface CrossSourceStatsTableProps {
  stats: CrossSourceStat[];
}

export function CrossSourceStatsTable({ stats }: CrossSourceStatsTableProps) {
  if (stats.length === 0) {
    return (
      <EmptyState message="Cross-source comparison data will appear here once both scrapers have run. It shows how much Air India and IndiGo prices differ on the same route/date." />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <caption className="sr-only">
          Cross-source validation: percentage fare difference between Air India and IndiGo
        </caption>
        <thead>
          <tr className="border-b border-apix-border text-apix-muted">
            <th scope="col" className="py-2 pr-4 font-medium">
              Route
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Advance window
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Mean % difference
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Max % difference
            </th>
            <th scope="col" className="py-2 font-medium">
              Comparisons
            </th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s, i) => (
            <tr key={`${s.route}-${s.advance_purchase_days}-${i}`} className="border-b border-apix-border last:border-0">
              <td className="py-2.5 pr-4 font-medium text-apix-text">{routeLabel(s.route)}</td>
              <td className="py-2.5 pr-4">T-{s.advance_purchase_days}</td>
              <td className="py-2.5 pr-4">{s.mean_pct_diff.toFixed(1)}%</td>
              <td className="py-2.5 pr-4">{s.max_pct_diff.toFixed(1)}%</td>
              <td className="py-2.5 text-apix-muted">{s.n_comparisons}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
