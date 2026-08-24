import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FareBucket } from "../../types/apix";
import { formatFare, formatFareCompact } from "../../utils/format";
import { CHART, axisTick, axisLine, tooltipStyle } from "../../constants/chartTheme";

interface FareDistributionChartProps {
  buckets: FareBucket[];
}

/** Histogram of observed fares — shows the spread a single average hides. */
export function FareDistributionChart({ buckets }: FareDistributionChartProps) {
  const rows = buckets.map((b) => ({
    label: formatFareCompact(b.bucket_start),
    count: b.count,
    range: `${formatFare(b.bucket_start)} – ${formatFare(b.bucket_end)}`,
  }));

  return (
    <div className="h-56 w-full" role="img" aria-label="Distribution of observed fares">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" tick={axisTick} axisLine={axisLine} minTickGap={4} />
          <YAxis tick={axisTick} axisLine={axisLine} allowDecimals={false} width={34} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [`${value} fares`, "Count"]}
            labelFormatter={(_label, payload) => payload?.[0]?.payload?.range ?? ""}
          />
          <Bar dataKey="count" fill={CHART.real} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
