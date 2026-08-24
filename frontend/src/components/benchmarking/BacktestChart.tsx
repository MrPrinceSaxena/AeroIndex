import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BacktestComparisonRow } from "../../types/apix";
import { formatFare, formatFareCompact } from "../../utils/format";
import { CHART, axisTick, axisLine, tooltipStyle, legendStyle } from "../../constants/chartTheme";

interface BacktestChartProps {
  rows: BacktestComparisonRow[];
}

/** APIx-implied fares against DGCA's published reference, month by month. */
export function BacktestChart({ rows }: BacktestChartProps) {
  const months = [...new Set(rows.map((r) => r.month))].sort();
  const data = months.map((month) => {
    const forMonth = rows.filter((r) => r.month === month);
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
    return {
      month,
      apix: Number(mean(forMonth.map((r) => r.apix_avg)).toFixed(2)),
      dgca: Number(mean(forMonth.map((r) => r.dgca_avg_fare)).toFixed(2)),
    };
  });

  return (
    <div className="h-64 w-full" role="img" aria-label="APIx compared against DGCA reference fares">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="month" tick={axisTick} axisLine={axisLine} />
          <YAxis tick={axisTick} axisLine={axisLine} tickFormatter={formatFareCompact} width={54} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatFare(Number(v))} />
          <Legend wrapperStyle={legendStyle} />
          <Line type="monotone" dataKey="apix" name="APIx (implied)" stroke={CHART.real} strokeWidth={2.5} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="dgca" name="DGCA reference" stroke="#16a34a" strokeWidth={2.5} strokeDasharray="5 4" dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
