import { useState } from "react";
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
import type { IndexPoint, WeeklyPoint } from "../../types/apix";
import { formatDate, formatIndex } from "../../utils/format";

interface TrendChartProps {
  daily: IndexPoint[];
  weekly?: WeeklyPoint[];
}

interface ChartRow {
  label: string;
  real: number | null;
  estimated: number | null;
}

function toRows(points: { apix_value: number; is_estimated: boolean }[], labels: string[]): ChartRow[] {
  return points.map((point, i) => ({
    label: labels[i],
    real: point.is_estimated ? null : point.apix_value,
    estimated: point.is_estimated ? point.apix_value : null,
  }));
}

export function TrendChart({ daily, weekly }: TrendChartProps) {
  const [granularity, setGranularity] = useState<"daily" | "weekly">("daily");
  const showToggle = Boolean(weekly && weekly.length > 0);
  const useWeekly = showToggle && granularity === "weekly";

  // Two parallel series (real vs. estimated), each with nulls where the
  // other applies -- Recharts breaks the line at null, so a real segment
  // and an estimated segment are never visually joined into one continuous
  // line.
  const rows: ChartRow[] = useWeekly
    ? toRows(weekly!, weekly!.map((w) => w.week))
    : toRows(daily, daily.map((d) => d.date));

  const hasReal = rows.some((row) => row.real !== null);
  const hasEstimated = rows.some((row) => row.estimated !== null);
  const labelFormatter = useWeekly ? (label: string) => label : (label: string) => formatDate(label);

  return (
    <div>
      {showToggle && (
        <div className="mb-2 flex justify-end gap-1">
          {(["daily", "weekly"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGranularity(g)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-apix-real ${
                granularity === g ? "bg-apix-real text-white" : "bg-apix-bg text-apix-muted hover:text-apix-text"
              }`}
              aria-pressed={granularity === g}
            >
              {g === "daily" ? "Daily" : "Weekly"}
            </button>
          ))}
        </div>
      )}
      <div className="h-72 w-full" role="img" aria-label="APIx index trend over time">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="label"
              tickFormatter={labelFormatter}
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
              labelFormatter={(label) => labelFormatter(String(label))}
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
    </div>
  );
}
