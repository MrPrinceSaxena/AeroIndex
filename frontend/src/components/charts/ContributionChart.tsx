import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RouteContribution } from "../../types/apix";
import { routeLabel } from "../../utils/format";

interface ContributionChartProps {
  contributions: RouteContribution[];
}

export function ContributionChart({ contributions }: ContributionChartProps) {
  const rows = contributions
    .filter((c) => c.contribution !== null)
    .map((c) => ({
      route: routeLabel(c.route),
      contribution: Number((c.contribution! * 100).toFixed(3)),
    }));

  return (
    <div className="h-64 w-full" role="img" aria-label="Each route's contribution to the latest index move">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 24, bottom: 0, left: 8 }}>
          <CartesianGrid stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: "#55617a" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}%`}
          />
          <YAxis type="category" dataKey="route" width={110} tick={{ fontSize: 12, fill: "#1e293b" }} axisLine={{ stroke: "#e2e8f0" }} />
          <Tooltip
            formatter={(value) => {
              const v = Number(value);
              return [`${v > 0 ? "+" : ""}${v}%`, "Contribution"];
            }}
            contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }}
          />
          <Bar dataKey="contribution" radius={[0, 6, 6, 0]}>
            {rows.map((row) => (
              <Cell key={row.route} fill={row.contribution >= 0 ? "#ef4444" : "#22c55e"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
