import type { OutlierGroupStat } from "../../types/apix";
import { EmptyState } from "../ui/EmptyState";
import { routeLabel } from "../../utils/format";

interface OutlierBreakdownTableProps {
  groups: OutlierGroupStat[];
}

export function OutlierBreakdownTable({ groups }: OutlierBreakdownTableProps) {
  if (groups.length === 0) {
    return <EmptyState message="Outlier breakdown will appear once fare data has been collected." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <caption className="sr-only">Outlier counts by route and advance-purchase window</caption>
        <thead>
          <tr className="border-b border-apix-border text-apix-muted">
            <th scope="col" className="py-2 pr-4 font-medium">Route</th>
            <th scope="col" className="py-2 pr-4 font-medium">Window</th>
            <th scope="col" className="py-2 pr-4 font-medium">Outliers</th>
            <th scope="col" className="py-2 font-medium">% of group</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g, i) => (
            <tr key={`${g.route}-${g.advance_purchase_days}-${i}`} className="border-b border-apix-border last:border-0">
              <td className="py-2.5 pr-4 font-medium text-apix-text">{routeLabel(g.route)}</td>
              <td className="py-2.5 pr-4">T-{g.advance_purchase_days}</td>
              <td className="py-2.5 pr-4">{g.n_outliers} / {g.n_total}</td>
              <td className="py-2.5">{g.pct_outliers}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
