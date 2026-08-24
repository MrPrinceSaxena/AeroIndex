import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RouteContribution } from "../../types/apix";
import { routeCode } from "../../utils/format";
import { CHART, axisTick, axisLine, tooltipStyle } from "../../constants/chartTheme";

interface ContributionChartProps {
  contributions: RouteContribution[];
}

export function ContributionChart({ contributions }: ContributionChartProps) {
  const rows = contributions
    .filter((c) => c.contribution !== null)
    .map((c) => ({
      route: routeCode(c.route),
      contribution: Number((c.contribution! * 100).toFixed(3)),
    }));

  return (
    <div className="h-56 w-full" role="img" aria-label="Each route's contribution to the latest index move">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 24, bottom: 0, left: 8 }}>
          <CartesianGrid stroke={CHART.grid} horizontal={false} />
          <XAxis
            type="number"
            tick={axisTick}
            axisLine={axisLine}
            tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}%`}
          />
          <YAxis type="category" dataKey="route" width={82} tick={{ fontSize: 11, fill: "#0f172a" }} axisLine={axisLine} />
          <Tooltip
            formatter={(value) => {
              const v = Number(value);
              return [`${v > 0 ? "+" : ""}${v}%`, "Contribution"];
            }}
            contentStyle={tooltipStyle}
          />
          <Bar dataKey="contribution" radius={[0, 6, 6, 0]}>
            {rows.map((row) => (
              <Cell key={row.route} fill={row.contribution >= 0 ? CHART.up : CHART.down} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
