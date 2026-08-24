import type { FareQuoteRow } from "../../types/apix";
import { Badge } from "../ui/Badge";
import { formatDateShort, formatFare, routeCode, sourceLabel } from "../../utils/format";

interface QuotesTableProps {
  rows: FareQuoteRow[];
  /** Row IDs the real cleaning pipeline flagged as outliers. */
  outlierIds?: Set<string>;
}

export function QuotesTable({ rows, outlierIds }: QuotesTableProps) {
  return (
    <div className="thin-scroll overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-[12px]">
        <caption className="sr-only">Collected fare quotes</caption>
        <thead>
          <tr className="border-b border-apix-border bg-apix-surface-alt text-apix-muted">
            <th scope="col" className="px-3 py-2 font-medium">Travel date</th>
            <th scope="col" className="px-3 py-2 font-medium">Route</th>
            <th scope="col" className="px-3 py-2 font-medium">Airline</th>
            <th scope="col" className="px-3 py-2 font-medium">Window</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Base</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Taxes</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Total fare</th>
            <th scope="col" className="px-3 py-2 font-medium">Source</th>
            <th scope="col" className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isOutlier = outlierIds?.has(row.id) ?? false;
            return (
              <tr key={row.id} className="border-b border-apix-border last:border-0 hover:bg-apix-surface-alt">
                <td className="tabular px-3 py-2 whitespace-nowrap">{formatDateShort(row.travel_date)}</td>
                <td className="px-3 py-2 font-semibold whitespace-nowrap text-apix-text">
                  {routeCode(row.route)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-apix-muted">{row.carrier ?? "—"}</td>
                <td className="tabular px-3 py-2 whitespace-nowrap">T-{row.advance_purchase_days}</td>
                <td className="tabular px-3 py-2 text-right text-apix-muted">
                  {row.base_fare != null ? formatFare(row.base_fare) : "—"}
                </td>
                <td className="tabular px-3 py-2 text-right text-apix-muted">
                  {row.taxes != null ? formatFare(row.taxes) : "—"}
                </td>
                <td className="tabular px-3 py-2 text-right font-semibold text-apix-text">
                  {row.is_sold_out ? "—" : formatFare(row.total_fare)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <Badge tone={row.source_name === "synthetic_estimate" ? "estimated" : "info"}>
                    {sourceLabel(row.source_name)}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {row.is_sold_out ? (
                      <Badge tone="neutral">Sold out</Badge>
                    ) : (
                      <Badge tone="success">Available</Badge>
                    )}
                    {isOutlier && <Badge tone="warning">Outlier</Badge>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
