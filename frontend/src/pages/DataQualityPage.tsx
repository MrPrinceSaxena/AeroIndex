import { useDataQuality } from "../hooks/useDataQuality";
import { useSystemHealth } from "../hooks/useSystemHealth";
import { PageHeader } from "../components/layout/PageHeader";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { Panel } from "../components/ui/Panel";
import { StatCard } from "../components/ui/StatCard";
import { Badge } from "../components/ui/Badge";
import { CompletenessGauge } from "../components/quality/CompletenessGauge";
import { OutlierBreakdownTable } from "../components/quality/OutlierBreakdownTable";
import { CrossSourceStatsTable } from "../components/methodology/CrossSourceStatsTable";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { ApiError } from "../api/client";
import { formatNumber, relativeTime, sourceLabel } from "../utils/format";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

const STALE_AFTER_HOURS = 48;

export function DataQualityPage() {
  const quality = useDataQuality();
  const health = useSystemHealth();
  const q = quality.data;

  const duplicateRate = q && q.total_rows > 0 ? (q.duplicate_rows / q.total_rows) * 100 : 0;

  return (
    <div className="space-y-5">
      <Breadcrumbs />
      <PageHeader
        title="Data Quality"
        subtitle="Computed by running the actual cleaning pipeline against current data — the same functions the index depends on, never a parallel set of checks that could drift from it."
      />

      {quality.isError && <ErrorState message={errorMessage(quality.error)} onRetry={() => quality.refetch()} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="Total records"
          value={q ? formatNumber(q.total_rows) : "—"}
          caption="All quotes ever collected"
          loading={quality.isLoading}
        />
        <StatCard
          label="Duplicate rate"
          value={q ? `${duplicateRate.toFixed(2)}%` : "—"}
          caption={q ? `${formatNumber(q.duplicate_rows)} exact duplicates removed` : undefined}
          tip="Identical route, date, fare and source. The most recent scrape is kept."
          loading={quality.isLoading}
        />
        <StatCard
          label="Outlier rate"
          value={q ? `${q.outlier_pct}%` : "—"}
          caption="IQR test, per route + window"
          tip="Flagged, never deleted — a surge price is real data and belongs in a fare index."
          loading={quality.isLoading}
        />
        <StatCard
          label="Component mismatch"
          value={q ? `${q.component_mismatch_pct}%` : "—"}
          caption="base + taxes vs. total, ±₹50"
          loading={quality.isLoading}
        />
        <StatCard
          label="Sold-out share"
          value={q ? `${q.sold_out_pct}%` : "—"}
          caption="Excluded from the index, kept in the database"
          loading={quality.isLoading}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Basket coverage"
          caption="Share of route × window × date cells that hold at least one bookable fare."
        >
          {quality.isLoading && <LoadingSkeleton height={180} label="Loading coverage" />}
          {q && (
            <CompletenessGauge
              pct={q.completeness_pct}
              covered={q.covered_cells}
              expected={q.expected_cells}
            />
          )}
        </Panel>

        <Panel
          className="xl:col-span-2"
          title="Outliers by route and booking window"
          caption="IQR method with a 2.5× multiplier, applied within each route + window group."
        >
          {quality.isLoading && <LoadingSkeleton height={180} label="Loading outlier breakdown" />}
          {q && <OutlierBreakdownTable groups={q.outliers_by_group} />}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Data freshness by source"
          caption={`A source is marked stale after ${STALE_AFTER_HOURS} hours without new data.`}
        >
          {health.isLoading && <LoadingSkeleton height={140} label="Loading freshness" />}
          {health.data && health.data.source_freshness.length === 0 && (
            <EmptyState message="Freshness appears once the ingestion pipeline has run at least once." />
          )}
          {health.data && health.data.source_freshness.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {health.data.source_freshness.map((s) => {
                // Measured against the server's own response timestamp rather
                // than wall-clock time, so staleness reflects the data as the
                // backend saw it and stays stable across re-renders.
                const ageHrs = s.latest_created_at
                  ? (new Date(health.data!.generated_at).getTime() -
                      new Date(s.latest_created_at).getTime()) /
                    3_600_000
                  : null;
                const stale = ageHrs == null || ageHrs > STALE_AFTER_HOURS;
                return (
                  <li key={s.source_name} className="rounded-lg border border-apix-border px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[12px] font-semibold text-apix-text">
                        {sourceLabel(s.source_name)}
                      </span>
                      <Badge tone={stale ? "warning" : "success"}>{stale ? "Stale" : "Fresh"}</Badge>
                    </div>
                    <div className="mt-1 text-[11px] text-apix-muted">
                      {s.latest_created_at ? relativeTime(s.latest_created_at) : "never"} ·{" "}
                      <span className="tabular">{formatNumber(s.rows)}</span> rows
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title="Source composition"
          caption="How much of the dataset comes from each collector."
        >
          {quality.isLoading && <LoadingSkeleton height={140} label="Loading source composition" />}
          {q && (
            <ul className="space-y-2">
              {q.rows_per_source.map((r) => {
                const share = q.total_rows ? (r.n_rows / q.total_rows) * 100 : 0;
                const synthetic = r.source_name === "synthetic_estimate";
                return (
                  <li key={r.source_name}>
                    <div className="flex items-baseline justify-between gap-2 text-[12px]">
                      <span className="font-medium text-apix-text">{sourceLabel(r.source_name)}</span>
                      <span className="tabular text-apix-muted">
                        {formatNumber(r.n_rows)} · {share.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-apix-surface-alt">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${share}%`,
                          background: synthetic ? "var(--color-apix-estimated)" : "var(--color-apix-primary)",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Confidence signal — cross-source validation"
        caption="Percentage fare difference between independent sources for the same route and date. A small spread confirms neither source is an outlier."
      >
        {quality.isLoading && <LoadingSkeleton height={120} label="Loading validation stats" />}
        {q && <CrossSourceStatsTable stats={q.cross_source_validation} />}
      </Panel>
    </div>
  );
}
