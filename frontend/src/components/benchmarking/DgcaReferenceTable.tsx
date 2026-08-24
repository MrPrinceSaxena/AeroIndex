import type { DgcaReferenceRow } from "../../types/apix";
import { formatFare, routeLabel } from "../../utils/format";

interface DgcaReferenceTableProps {
  rows: DgcaReferenceRow[];
}

export function DgcaReferenceTable({ rows }: DgcaReferenceTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <caption className="sr-only">DGCA published reference fares on file</caption>
        <thead>
          <tr className="border-b border-apix-border text-apix-muted">
            <th scope="col" className="py-2 pr-4 font-medium">Month</th>
            <th scope="col" className="py-2 pr-4 font-medium">Route</th>
            <th scope="col" className="py-2 font-medium">DGCA avg fare</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.month}-${row.route}-${i}`} className="border-b border-apix-border last:border-0">
              <td className="py-2.5 pr-4 font-medium text-apix-text">{row.month}</td>
              <td className="py-2.5 pr-4">{routeLabel(row.route)}</td>
              <td className="py-2.5">{formatFare(row.dgca_avg_fare)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
