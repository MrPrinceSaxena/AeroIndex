import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RouteHistoryPoint } from "../../types/apix";
import { formatDate, formatFare } from "../../utils/format";

interface RouteHistoryChartProps {
  points: RouteHistoryPoint[];
}

interface ChartRow {
  date: string;
  real: number | null;
  estimated: number | null;
}

export function RouteHistoryChart({ points }: RouteHistoryChartProps) {
  // Same dual-series, null-gapped pattern as TrendChart -- real and
  // estimated fares are never joined into one continuous line.
  const rows: ChartRow[] = points.map((p) => ({
    date: p.date,
    real: p.is_estimated ? null : p.median_fare,
    estimated: p.is_estimated ? p.median_fare : null,
  }));

  const hasReal = rows.some((row) => row.real !== null);
  const hasEstimated = rows.some((row) => row.estimated !== null);

  return (
    <div className="h-72 w-full" role="img" aria-label="Median fare over time for this route">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
          <CartesianGrid stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12, fill: "#55617a" }} axisLine={{ stroke: "#e2e8f0" }} />
          <YAxis tick={{ fontSize: 12, fill: "#55617a" }} tickFormatter={formatFare} axisLine={{ stroke: "#e2e8f0" }} width={72} />
          <Tooltip formatter={(value) => formatFare(Number(value))} labelFormatter={(label) => formatDate(String(label))} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {hasReal && (
            <Line type="monotone" dataKey="real" name="Real data" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} connectNulls={false} />
          )}
          {hasEstimated && (
            <Line type="monotone" dataKey="estimated" name="Estimated (synthetic gap-filler)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 4, strokeWidth: 0 }} connectNulls={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
