import { useApix } from "../hooks/useApix";
import { useSummary } from "../hooks/useSummary";
import { useSystemHealth } from "../hooks/useSystemHealth";
import { useDataQuality } from "../hooks/useDataQuality";
import { MetricCard } from "../components/metrics/MetricCard";
import { WhatThisMeansPanel } from "../components/summary/WhatThisMeansPanel";
import { QuickNavGrid } from "../components/summary/QuickNavGrid";
import { EstimatedBadge } from "../components/ui/EstimatedBadge";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { ApiError } from "../api/client";
import { formatDate, formatIndex, formatPercent } from "../utils/format";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

const STATUS_DOT: Record<string, string> = {
  healthy: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
};

export function OverviewPage() {
  const apix = useApix();
  const summary = useSummary();
  const health = useSystemHealth();
  const quality = useDataQuality();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-apix-text">Here&apos;s what flights are costing today</h1>
        <p className="mt-1 text-sm text-apix-muted">
          A real-time index tracking what domestic flights actually cost, built for India&apos;s
          Ministry of Statistics (MoSPI) and RBI — not a flight-deal app.
        </p>
      </div>

      {apix.isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <LoadingSkeleton height={128} label="Loading current index value" />
          <LoadingSkeleton height={128} label="Loading day-on-day change" />
          <LoadingSkeleton height={128} label="Loading data coverage" />
        </div>
      )}
      {apix.isError && (
        <ErrorState
          message={errorMessage(apix.error)}
          onRetry={() => apix.refetch()}
          hint="Run `python src/db/init_db.py` then `python -m src.ingestion.run_all` if you haven't populated the database yet."
        />
      )}
      {apix.data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            label="Current APIx Value"
            value={formatIndex(apix.data.latest_value)}
            caption={`Base = 100 | ${formatDate(apix.data.base_date)}`}
            badge={apix.data.daily_series.at(-1)?.is_estimated ? <EstimatedBadge /> : undefined}
          />
          <MetricCard
            label="Day-on-Day Change"
            value={(() => {
              const series = apix.data.daily_series;
              const latest = series.at(-1);
              const prev = series.length > 1 ? series.at(-2) : latest;
              if (!latest || !prev) return "—";
              const change = ((latest.apix_value - prev.apix_value) / prev.apix_value) * 100;
              return `${change > 0 ? "↑" : "↓"} ${formatPercent(change)}`;
            })()}
            valueColor={(() => {
              const series = apix.data.daily_series;
              const latest = series.at(-1);
              const prev = series.length > 1 ? series.at(-2) : latest;
              if (!latest || !prev) return undefined;
              return latest.apix_value > prev.apix_value ? "var(--color-apix-up)" : "var(--color-apix-down)";
            })()}
            caption="vs previous observation"
          />
          <MetricCard
            label="Data Coverage"
            value={`${apix.data.data_coverage.n_real} real · ${apix.data.data_coverage.n_synthetic} estimated`}
            caption="Estimated = synthetic gap-filler, always labelled"
          />
        </div>
      )}

      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="mb-3 text-lg font-bold text-apix-text">
          What this means for policy
        </h2>
        {summary.isLoading && <LoadingSkeleton height={96} label="Loading summary" />}
        {summary.isError && <ErrorState message={errorMessage(summary.error)} onRetry={() => summary.refetch()} />}
        {summary.data && (
          <WhatThisMeansPanel summary={summary.data.summary} hasSufficientData={summary.data.has_sufficient_data} />
        )}
      </section>

      <section aria-labelledby="status-heading">
        <h2 id="status-heading" className="mb-3 text-lg font-bold text-apix-text">
          Pipeline status at a glance
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-apix-border bg-apix-surface p-5">
            <div className="flex items-center gap-2">
              {health.data && (
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[health.data.overall_status]}`} />
              )}
              <span className="text-sm font-semibold text-apix-text">System Health</span>
            </div>
            <p className="mt-1 text-sm text-apix-muted">
              {health.isLoading && "Checking pipeline status…"}
              {health.isError && "Could not reach the health endpoint."}
              {health.data && (
                <>
                  {health.data.overall_status === "healthy" && "All systems reporting normally."}
                  {health.data.overall_status === "degraded" && "Some signals need attention — see System Health."}
                  {health.data.overall_status === "down" && "Database unreachable — see System Health."}
                </>
              )}
            </p>
          </div>
          <div className="rounded-2xl border border-apix-border bg-apix-surface p-5">
            <span className="text-sm font-semibold text-apix-text">Data Quality</span>
            <p className="mt-1 text-sm text-apix-muted">
              {quality.isLoading && "Running quality checks…"}
              {quality.isError && "Could not reach the data-quality endpoint."}
              {quality.data && `${quality.data.outlier_pct}% outliers, ${quality.data.sold_out_pct}% sold out, across ${quality.data.total_rows} rows.`}
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="explore-heading">
        <h2 id="explore-heading" className="mb-3 text-lg font-bold text-apix-text">
          Explore the platform
        </h2>
        <QuickNavGrid />
      </section>
    </div>
  );
}
