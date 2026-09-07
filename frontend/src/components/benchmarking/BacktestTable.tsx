import type { BacktestComparisonRow } from "../../types/apix";
import { formatFare, routeLabel } from "../../utils/format";

interface BacktestTableProps {
  rows: BacktestComparisonRow[];
}

export function BacktestTable({ rows }: BacktestTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <caption className="sr-only">APIx vs DGCA reference fare comparison by month and route</caption>
        <thead>
          <tr className="border-b border-apix-border text-apix-muted">
            <th scope="col" className="py-2 pr-4 font-medium">Month</th>
            <th scope="col" className="py-2 pr-4 font-medium">Route</th>
            <th scope="col" className="py-2 pr-4 font-medium">APIx avg</th>
            <th scope="col" className="py-2 pr-4 font-medium">DGCA avg</th>
            <th scope="col" className="py-2 font-medium">Deviation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.month}-${row.route}-${i}`} className="border-b border-apix-border last:border-0">
              <td className="py-2.5 pr-4 font-medium text-apix-text">{row.month}</td>
              <td className="py-2.5 pr-4">{routeLabel(row.route)}</td>
              <td className="py-2.5 pr-4">{formatFare(row.apix_avg)}</td>
              <td className="py-2.5 pr-4">{formatFare(row.dgca_avg_fare)}</td>
              <td className="py-2.5">
                <span
                  className={
                    row.deviation_flagged
                      ? "inline-flex items-center rounded-md bg-red-50 dark:bg-red-950/40 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400"
                      : "inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                  }
                >
                  {row.deviation_pct}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
