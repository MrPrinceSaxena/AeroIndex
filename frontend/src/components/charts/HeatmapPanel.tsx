import type { HeatmapCell } from "../../types/apix";
import { ROUTES } from "../../types/apix";
import { formatFare, routeLabel } from "../../utils/format";

interface HeatmapPanelProps {
  cells: HeatmapCell[];
}

const WINDOWS = [7, 30];

export function HeatmapPanel({ cells }: HeatmapPanelProps) {
  const byKey = new Map(cells.map((cell) => [`${cell.route}-${cell.advance_purchase_days}`, cell.median_fare]));
  const fares = cells.map((cell) => cell.median_fare);
  const min = fares.length ? Math.min(...fares) : 0;
  const max = fares.length ? Math.max(...fares) : 1;

  const shade = (fare: number | undefined) => {
    if (fare === undefined) return "#f1f5f9";
    const t = max === min ? 0.5 : (fare - min) / (max - min);
    // Interpolates between two blues -- lighter for cheaper, darker for pricier.
    const start = [224, 242, 254]; // sky-100
    const end = [3, 105, 161]; // sky-700
    const rgb = start.map((s, i) => Math.round(s + (end[i] - s) * t));
    return `rgb(${rgb.join(",")})`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-separate border-spacing-1 text-sm">
        <caption className="sr-only">
          Median real fare by route and advance-purchase window
        </caption>
        <thead>
          <tr>
            <th scope="col" className="p-2 text-left font-medium text-apix-muted">
              Route
            </th>
            {WINDOWS.map((w) => (
              <th key={w} scope="col" className="p-2 text-left font-medium text-apix-muted">
                T-{w} days
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROUTES.map((route) => (
            <tr key={route}>
              <th scope="row" className="p-2 text-left font-medium text-apix-text">
                {routeLabel(route)}
              </th>
              {WINDOWS.map((w) => {
                const fare = byKey.get(`${route}-${w}`);
                const light = fare !== undefined && max !== min && (fare - min) / (max - min) > 0.55;
                return (
                  <td
                    key={w}
                    className="rounded-lg p-3 text-center font-semibold"
                    style={{ background: shade(fare), color: light ? "#fff" : "#1e293b" }}
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
