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
import { formatDate, formatFareCompact } from "../../utils/format";
import { CHART, axisTick, axisLine, tooltipStyle, legendStyle } from "../../constants/chartTheme";

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
    <div className="h-64 w-full" role="img" aria-label="Median fare over time for this route">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDate} tick={axisTick} axisLine={axisLine} />
          <YAxis tick={axisTick} tickFormatter={formatFareCompact} axisLine={axisLine} width={58} />
          <Tooltip formatter={(value) => formatFareCompact(Number(value))} labelFormatter={(label) => formatDate(String(label))} contentStyle={tooltipStyle} />
          <Legend wrapperStyle={legendStyle} />
          {hasReal && (
            <Line type="monotone" dataKey="real" name="Real data" stroke={CHART.real} strokeWidth={3} dot={{ r: 4 }} connectNulls={false} />
          )}
          {hasEstimated && (
            <Line type="monotone" dataKey="estimated" name="Estimated (synthetic gap-filler)" stroke={CHART.estimated} strokeWidth={2} strokeDasharray="6 4" dot={{ r: 4, strokeWidth: 0 }} connectNulls={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
