import type { FareQuoteRow } from "../../types/apix";
import { formatDate, formatFare, routeLabel, sourceLabel } from "../../utils/format";

interface QuotesTableProps {
  rows: FareQuoteRow[];
}

export function QuotesTable({ rows }: QuotesTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-apix-border bg-apix-surface">
      <table className="w-full min-w-[820px] text-left text-sm">
        <caption className="sr-only">Raw fare quotes</caption>
        <thead>
          <tr className="border-b border-apix-border text-apix-muted">
            <th scope="col" className="p-3 font-medium">Route</th>
            <th scope="col" className="p-3 font-medium">Travel date</th>
            <th scope="col" className="p-3 font-medium">Window</th>
            <th scope="col" className="p-3 font-medium">Carrier</th>
            <th scope="col" className="p-3 font-medium">Total fare</th>
            <th scope="col" className="p-3 font-medium">Source</th>
            <th scope="col" className="p-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-apix-border last:border-0">
              <td className="p-3 font-medium text-apix-text">{routeLabel(row.route)}</td>
              <td className="p-3">{formatDate(row.travel_date)}</td>
              <td className="p-3">T-{row.advance_purchase_days}</td>
              <td className="p-3 text-apix-muted">{row.carrier ?? "—"}</td>
              <td className="p-3">{row.is_sold_out ? "—" : formatFare(row.total_fare)}</td>
              <td className="p-3 text-apix-muted">{sourceLabel(row.source_name)}</td>
              <td className="p-3">
                {row.is_sold_out ? (
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    Sold out
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Available
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
