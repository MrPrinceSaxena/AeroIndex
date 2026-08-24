import { MetricCard } from "../metrics/MetricCard";
import type { DataQualityResponse } from "../../types/apix";

interface DataQualityMetricsProps {
  data: DataQualityResponse;
}

export function DataQualityMetrics({ data }: DataQualityMetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="Total rows collected" value={data.total_rows.toLocaleString("en-IN")} />
      <MetricCard
        label="Outliers flagged"
        value={`${data.outlier_pct}%`}
        caption="IQR method, per route + window — flagged, never dropped"
        valueColor={data.outlier_pct > 10 ? "var(--color-apix-up)" : undefined}
      />
      <MetricCard
        label="Sold out"
        value={`${data.sold_out_pct}%`}
        caption="Excluded from the index, retained in the database"
      />
      <MetricCard
        label="Component mismatches"
        value={`${data.component_mismatch_pct}%`}
        caption="base + taxes deviates from total by more than ₹50"
        valueColor={data.component_mismatch_pct > 5 ? "var(--color-apix-up)" : undefined}
      />
    </div>
  );
}
