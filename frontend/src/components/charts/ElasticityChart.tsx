import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ElasticityPoint } from "../../types/apix";
import { formatFare, sourceLabel } from "../../utils/format";

interface ElasticityChartProps {
  points: ElasticityPoint[];
}

const SOURCE_COLORS: Record<string, string> = {
  air_india_direct: "#0ea5e9",
  indigo_direct: "#38bdf8",
  synthetic_estimate: "#f59e0b",
};

export function ElasticityChart({ points }: ElasticityChartProps) {
  // Pivot into one row per advance-purchase window, one column per source,
  // so each source renders as its own grouped bar -- sources are never
  // averaged together into a single bar.
  const windows = Array.from(new Set(points.map((p) => p.advance_purchase_days))).sort((a, b) => a - b);
  const sources = Array.from(new Set(points.map((p) => p.source_name)));

  const rows = windows.map((w) => {
    const row: Record<string, number | string> = { window: `T-${w}` };
    for (const source of sources) {
      const match = points.find((p) => p.advance_purchase_days === w && p.source_name === source);
      if (match) row[source] = match.median_fare;
    }
    return row;
  });

  return (
    <div className="h-72 w-full" role="img" aria-label="Fare by days before departure, grouped by source">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
          <CartesianGrid stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="window" tick={{ fontSize: 12, fill: "#55617a" }} axisLine={{ stroke: "#e2e8f0" }} />
          <YAxis
            tick={{ fontSize: 12, fill: "#55617a" }}
            tickFormatter={formatFare}
            axisLine={{ stroke: "#e2e8f0" }}
            width={72}
          />
          <Tooltip formatter={(value) => formatFare(Number(value))} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }} />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value: string) => sourceLabel(value)}
          />
          {sources.map((source) => (
            <Bar key={source} dataKey={source} name={source} fill={SOURCE_COLORS[source] ?? "#94a3b8"} radius={[6, 6, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
