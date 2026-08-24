import { Link } from "react-router-dom";
import { useApix } from "../hooks/useApix";
import { useOverview } from "../hooks/useOverview";
import { useSummary } from "../hooks/useSummary";
import { useSystemHealth } from "../hooks/useSystemHealth";
import { useDataQuality } from "../hooks/useDataQuality";
import { PageHeader } from "../components/layout/PageHeader";
import { Panel } from "../components/ui/Panel";
import { StatCard } from "../components/ui/StatCard";
import { Badge, StatusDot } from "../components/ui/Badge";
import { TrendChart } from "../components/charts/TrendChart";
import { TopMoversList } from "../components/overview/TopMoversList";
import { DataFlowStrip } from "../components/overview/DataFlowStrip";
import { WhatThisMeansPanel } from "../components/summary/WhatThisMeansPanel";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { ApiError } from "../api/client";
import { formatDate, formatIndex, formatNumber, relativeTime } from "../utils/format";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

const HEALTH_TONE = { healthy: "success", degraded: "warning", down: "danger" } as const;

export function OverviewPage() {
  const overview = useOverview();
  const apix = useApix();
  const summary = useSummary();
  const health = useSystemHealth();
  const quality = useDataQuality();

  const o = overview.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="National Airfare Monitoring — Overview"
        subtitle="A weighted, chain-linked index of what domestic flights actually cost, built for MoSPI and RBI. Every figure on this page is computed from collected fare data, not illustrative."
        actions={
          o?.latest_date ? (
            <Badge tone="info">Latest observation {formatDate(o.latest_date)}</Badge>
          ) : undefined
        }
      />

      {overview.isError && (
        <ErrorState
          message={errorMessage(overview.error)}
          onRetry={() => overview.refetch()}
          hint="If the database is empty, run `python src/db/init_db.py` then `python -m src.ingestion.run_all`."
        />
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Air Fare Index (Latest)"
          value={o?.latest_value != null ? formatIndex(o.latest_value) : "—"}
          deltaPct={o?.change_pct ?? null}
          caption={o?.base_date ? `vs base 100 on ${formatDate(o.base_date)}` : "Awaiting data"}
          tip="Fixed-basket, DGCA-traffic-weighted, chain-linked index. Base = 100 on the first observation date."
          loading={overview.isLoading}
        />
        <StatCard
          label="Routes Monitored"
          value={o ? formatNumber(o.routes_monitored) : "—"}
          caption="City pairs in the index basket"
          loading={overview.isLoading}
        />
        <StatCard
          label="Airlines Observed"
          value={o ? formatNumber(o.airlines_monitored) : "—"}
          caption="Carriers named in collected quotes"
          tip="Counts carriers that appear in real scraped quotes. The synthetic gap-filler never claims a carrier, so it is excluded."
          loading={overview.isLoading}
        />
        <StatCard
          label="Data Points"
          value={o ? formatNumber(o.total_quotes) : "—"}
          caption={o ? `${formatNumber(o.real_quotes)} real · ${formatNumber(o.synthetic_quotes)} estimated` : undefined}
          badge={o && o.synthetic_quotes > 0 ? <Badge tone="estimated">includes estimates</Badge> : undefined}
          loading={overview.isLoading}
        />
      </div>

      {/* Trend + right rail */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Air Fare Index trend"
          caption="Solid blue = real data. Dashed amber = synthetic gap-filler. The two are never blended into one line."
        >
          {apix.isLoading && <LoadingSkeleton height={256} label="Loading index trend" />}
          {apix.isError && <ErrorState message={errorMessage(apix.error)} onRetry={() => apix.refetch()} />}
          {apix.data && <TrendChart daily={apix.data.daily_series} weekly={apix.data.weekly_series} />}
        </Panel>

        <div className="space-y-4">
          <Panel
            title="Index by booking window"
            caption="Computed per advance-purchase window using the same locked formula."
          >
            {overview.isLoading && <LoadingSkeleton height={80} label="Loading booking-window index" />}
            {o && o.index_by_window.length === 0 && (
              <EmptyState message="Per-window index needs collected fares for each booking window." />
            )}
            {o && o.index_by_window.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {o.index_by_window.map((w) => (
                  <div key={w.advance_purchase_days} className="rounded-lg border border-apix-border px-3 py-2">
                    <div className="text-[11px] text-apix-muted">T-{w.advance_purchase_days} days</div>
                    <div className="tabular mt-0.5 text-[19px] leading-none font-bold text-apix-text">
                      {formatIndex(w.latest_value)}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {w.change_pct != null && (
                        <span
                          className={`tabular text-[11px] font-semibold ${
                            w.change_pct > 0 ? "text-apix-up" : "text-apix-down"
                          }`}
                        >
                          {w.change_pct > 0 ? "▲" : "▼"} {Math.abs(w.change_pct).toFixed(1)}%
                        </span>
                      )}
                      {w.is_estimated && <Badge tone="estimated">est.</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Top movers" caption="Routes ranked by fare change since the previous observation.">
            {overview.isLoading && <LoadingSkeleton height={120} label="Loading top movers" />}
            {o && <TopMoversList movers={o.top_movers} />}
          </Panel>
        </div>
      </div>

      {/* Insight + status */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {summary.isLoading && <LoadingSkeleton height={96} label="Loading interpretation" />}
          {summary.isError && (
            <ErrorState message={errorMessage(summary.error)} onRetry={() => summary.refetch()} />
          )}
          {summary.data && (
            <WhatThisMeansPanel
              summary={summary.data.summary}
              hasSufficientData={summary.data.has_sufficient_data}
            />
          )}
        </div>

        <Panel title="Platform status">
          <dl className="space-y-3 text-[12px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-apix-muted">Pipeline</dt>
              <dd>
                {health.isLoading && <span className="text-apix-muted">Checking…</span>}
                {health.isError && <StatusDot tone="danger" label="Unreachable" />}
                {health.data && (
                  <StatusDot
                    tone={HEALTH_TONE[health.data.overall_status]}
                    label={health.data.overall_status}
                  />
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-apix-muted">Database</dt>
              <dd>
                {health.data ? (
                  <StatusDot
                    tone={health.data.db_connectivity === "ok" ? "success" : "danger"}
                    label={health.data.db_connectivity === "ok" ? "Connected" : "Unreachable"}
                  />
                ) : (
                  <span className="text-apix-muted">—</span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-apix-muted">Last ingestion</dt>
              <dd className="font-semibold text-apix-text">
                {health.data?.recent_runs?.[0]
                  ? relativeTime(health.data.recent_runs[0].started_at)
                  : "No runs yet"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-apix-muted">Outlier rate</dt>
              <dd className="tabular font-semibold text-apix-text">
                {quality.data ? `${quality.data.outlier_pct}%` : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-apix-muted">Sold-out share</dt>
              <dd className="tabular font-semibold text-apix-text">
                {quality.data ? `${quality.data.sold_out_pct}%` : "—"}
              </dd>
            </div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-apix-border pt-3 text-[12px]">
            <Link to="/system-health" className="font-medium text-apix-primary hover:underline">
              System health →
            </Link>
            <Link to="/data-quality" className="font-medium text-apix-primary hover:underline">
              Data quality →
            </Link>
          </div>
        </Panel>
      </div>

      {/* Whole-system explainer */}
      <Panel
        title="End-to-end data flow"
        caption="How a scraped fare becomes a published index number a policymaker can act on."
      >
        <DataFlowStrip />
      </Panel>
    </div>
  );
}
