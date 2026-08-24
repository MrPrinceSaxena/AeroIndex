import { useState } from "react";
import { useApix } from "../hooks/useApix";
import { useHeatmap } from "../hooks/useHeatmap";
import { useElasticity } from "../hooks/useElasticity";
import { useSummary } from "../hooks/useSummary";
import { MetricCard } from "../components/metrics/MetricCard";
import { TrendChart } from "../components/charts/TrendChart";
import { HeatmapPanel } from "../components/charts/HeatmapPanel";
import { ElasticityChart } from "../components/charts/ElasticityChart";
import { WhatThisMeansPanel } from "../components/summary/WhatThisMeansPanel";
import { EstimatedBadge } from "../components/ui/EstimatedBadge";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { ApiError } from "../api/client";
import { ROUTES, type Route } from "../types/apix";
import { formatDate, formatIndex, formatPercent, routeLabel } from "../utils/format";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

function SectionHeader({ title, caption }: { title: string; caption?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-bold text-apix-text">{title}</h2>
      {caption && <p className="text-sm text-apix-muted">{caption}</p>}
    </div>
  );
}

export function DashboardPage() {
  const apix = useApix();
  const heatmap = useHeatmap();
  const summary = useSummary();
  const [route, setRoute] = useState<Route>("DEL-BOM");
  const elasticity = useElasticity(route);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-apix-text">Here&apos;s what flights are costing today</h1>
        <p className="mt-1 text-sm text-apix-muted">
          A real-time index tracking what domestic flights actually cost, built for India&apos;s
          Ministry of Statistics (MoSPI) and RBI — not a flight-deal app.
        </p>
      </div>

      {/* Top metric row */}
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
            badge={
              apix.data.daily_series.at(-1)?.is_estimated ? <EstimatedBadge /> : undefined
            }
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

      {/* Trend chart */}
      <section aria-labelledby="trend-heading">
        <SectionHeader
          title="Here's how airfare costs have moved"
          caption="Real data = solid sky-blue line. Estimated (synthetic gap-filler) = dashed amber line. Never blended silently."
        />
        {apix.isLoading && <LoadingSkeleton height={288} label="Loading trend chart" />}
        {apix.isError && <ErrorState message={errorMessage(apix.error)} onRetry={() => apix.refetch()} />}
        {apix.data && <TrendChart daily={apix.data.daily_series} />}
      </section>

      {/* Heatmap */}
      <section aria-labelledby="heatmap-heading">
        <SectionHeader
          title="How fares compare across routes"
          caption="Median real fare by route and advance-purchase window. Darker = more expensive."
        />
        {heatmap.isLoading && <LoadingSkeleton height={200} label="Loading fare heatmap" />}
        {heatmap.isError && <ErrorState message={errorMessage(heatmap.error)} onRetry={() => heatmap.refetch()} />}
        {heatmap.data && heatmap.data.cells.length === 0 && (
          <EmptyState message="Heatmap will appear once real scrape data is loaded." />
        )}
        {heatmap.data && heatmap.data.cells.length > 0 && <HeatmapPanel cells={heatmap.data.cells} />}
      </section>

      {/* Elasticity */}
      <section aria-labelledby="elasticity-heading">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            title="How price changes as departure approaches"
            caption="Fare vs. days before departure — shows the lead-time price premium, split by source."
          />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-apix-muted">Route</span>
            <select
              value={route}
              onChange={(e) => setRoute(e.target.value as Route)}
              className="w-full rounded-lg border border-apix-border bg-apix-surface px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-apix-real sm:w-auto"
            >
              {ROUTES.map((r) => (
                <option key={r} value={r}>
                  {routeLabel(r)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {elasticity.isLoading && <LoadingSkeleton height={288} label="Loading elasticity chart" />}
        {elasticity.isError && (
          <ErrorState message={errorMessage(elasticity.error)} onRetry={() => elasticity.refetch()} />
        )}
        {elasticity.data && elasticity.data.points.length === 0 && (
          <EmptyState message="Elasticity data will appear here once fares are loaded for this route." />
        )}
        {elasticity.data && elasticity.data.points.length > 0 && (
          <ElasticityChart points={elasticity.data.points} />
        )}
      </section>

      {/* What this means */}
      <section aria-labelledby="summary-heading">
        <SectionHeader title="What this means for policy" />
        {summary.isLoading && <LoadingSkeleton height={96} label="Loading summary" />}
        {summary.isError && <ErrorState message={errorMessage(summary.error)} onRetry={() => summary.refetch()} />}
        {summary.data && (
          <WhatThisMeansPanel summary={summary.data.summary} hasSufficientData={summary.data.has_sufficient_data} />
        )}
      </section>
    </div>
  );
}
