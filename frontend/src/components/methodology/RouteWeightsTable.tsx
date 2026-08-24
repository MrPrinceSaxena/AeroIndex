import type { RouteWeight } from "../../types/apix";
import { routeLabel } from "../../utils/format";

interface RouteWeightsTableProps {
  weights: RouteWeight[];
}

export function RouteWeightsTable({ weights }: RouteWeightsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <caption className="sr-only">Route weights in the APIx index, by passenger traffic share</caption>
        <thead>
          <tr className="border-b border-apix-border text-apix-muted">
            <th scope="col" className="py-2 pr-4 font-medium">
              Route
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Weight in index
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Passengers (FY22-23, mn)
            </th>
            <th scope="col" className="py-2 font-medium">
              Source
            </th>
          </tr>
        </thead>
        <tbody>
          {weights.map((w) => (
            <tr key={w.route} className="border-b border-apix-border last:border-0">
              <td className="py-2.5 pr-4 font-medium text-apix-text">{routeLabel(w.route)}</td>
              <td className="py-2.5 pr-4">{(w.weight * 100).toFixed(1)}%</td>
              <td className="py-2.5 pr-4">{w.pax_millions_fy2223.toFixed(1)}</td>
              <td className="py-2.5 text-apix-muted">{w.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
