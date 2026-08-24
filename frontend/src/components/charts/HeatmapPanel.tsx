import type { HeatmapCell } from "../../types/apix";
import { formatFare, routeCode } from "../../utils/format";

interface HeatmapPanelProps {
  cells: HeatmapCell[];
  /** Windows to render as columns — driven by the catalog, not hardcoded. */
  windows: number[];
  routes: string[];
}

export function HeatmapPanel({ cells, windows, routes }: HeatmapPanelProps) {
  const byKey = new Map(cells.map((c) => [`${c.route}-${c.advance_purchase_days}`, c.median_fare]));
  const fares = cells.map((c) => c.median_fare);
  const min = fares.length ? Math.min(...fares) : 0;
  const max = fares.length ? Math.max(...fares) : 1;

  const intensity = (fare: number) => (max === min ? 0.5 : (fare - min) / (max - min));

  const shade = (fare: number | undefined) => {
    if (fare === undefined) return "#f1f5f9";
    const t = intensity(fare);
    // Light sky → deep blue, matching the primary ramp.
    const start = [219, 234, 254];
    const end = [29, 78, 216];
    return `rgb(${start.map((s, i) => Math.round(s + (end[i] - s) * t)).join(",")})`;
  };

  return (
    <div className="thin-scroll overflow-x-auto">
      <table className="w-full min-w-[380px] border-separate border-spacing-1 text-[12px]">
        <caption className="sr-only">Median real fare by route and advance-purchase window</caption>
        <thead>
          <tr>
            <th scope="col" className="px-2 py-1 text-left font-medium text-apix-muted">
              Route
            </th>
            {windows.map((w) => (
              <th key={w} scope="col" className="px-2 py-1 text-center font-medium text-apix-muted">
                T-{w} days
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {routes.map((route) => (
            <tr key={route}>
              <th scope="row" className="px-2 py-1 text-left font-semibold whitespace-nowrap text-apix-text">
                {routeCode(route)}
              </th>
              {windows.map((w) => {
                const fare = byKey.get(`${route}-${w}`);
                const light = fare !== undefined && intensity(fare) > 0.55;
                return (
                  <td
                    key={w}
                    className="tabular rounded-lg px-2 py-2.5 text-center font-semibold"
                    style={{ background: shade(fare), color: light ? "#fff" : "#0f172a" }}
                  >
                    {fare !== undefined ? formatFare(fare) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
