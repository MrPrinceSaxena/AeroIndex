import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { IndexPoint } from "../../types/apix";
import { formatDate, formatIndex } from "../../utils/format";

interface TrendChartProps {
  daily: IndexPoint[];
}

interface ChartRow {
  date: string;
  real: number | null;
  estimated: number | null;
}

export function TrendChart({ daily }: TrendChartProps) {
  // Two parallel series (real vs. estimated), each with nulls where the
  // other applies -- Recharts breaks the line at null, so a real segment
  // and an estimated segment are never visually joined into one continuous
  // line. This is the same real-vs-estimated split the original dashboard
  // used, just expressed as two Recharts <Line> series instead of two
  // Plotly traces.
  const rows: ChartRow[] = daily.map((point) => ({
    date: point.date,
    real: point.is_estimated ? null : point.apix_value,
    estimated: point.is_estimated ? point.apix_value : null,
  }));

  const hasReal = rows.some((row) => row.real !== null);
  const hasEstimated = rows.some((row) => row.estimated !== null);

  return (
    <div className="h-72 w-full" role="img" aria-label="APIx index trend over time">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
          <CartesianGrid stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12, fill: "#55617a" }}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#55617a" }}
            tickFormatter={formatIndex}
            axisLine={{ stroke: "#e2e8f0" }}
            width={48}
          />
          <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="2 4" />
          <Tooltip
            formatter={(value) => formatIndex(Number(value))}
            labelFormatter={(label) => formatDate(String(label))}
            contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {hasReal && (
            <Line
              type="monotone"
              dataKey="real"
              name="Real data"
              stroke="#0ea5e9"
              strokeWidth={3}
              dot={{ r: 4 }}
              connectNulls={false}
            />
          )}
          {hasEstimated && (
            <Line
              type="monotone"
              dataKey="estimated"
              name="Estimated (synthetic gap-filler)"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 4, strokeWidth: 0 }}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
