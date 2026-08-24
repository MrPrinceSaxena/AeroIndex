import { useSystemHealth } from "../hooks/useSystemHealth";
import { PageHeader } from "../components/layout/PageHeader";
import { Panel } from "../components/ui/Panel";
import { StatCard } from "../components/ui/StatCard";
import { Badge } from "../components/ui/Badge";
import { HealthStatusBanner } from "../components/health/HealthStatusBanner";
import { IngestionRunsTable } from "../components/health/IngestionRunsTable";
import { SourceFreshnessTable } from "../components/health/SourceFreshnessTable";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { ApiError } from "../api/client";
import { formatNumber, relativeTime } from "../utils/format";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

export function SystemHealthPage() {
  const health = useSystemHealth();
  const h = health.data;

  const runs = h?.recent_runs ?? [];
  const lastRun = runs[0];
  const lastRunGroup = lastRun ? runs.filter((r) => r.run_id === lastRun.run_id) : [];
  const failedInLastRun = lastRunGroup.filter((r) => r.status === "failed").length;
  const recordsInLastRun = lastRunGroup.reduce((a, r) => a + r.records_ingested, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="System Health"
        subtitle="Live pipeline observability — database connectivity, ingestion run history and per-source freshness, read from the ingestion_runs log rather than inferred."
        actions={<Badge tone="info">Auto-refreshes every 30s</Badge>}
      />

      {health.isLoading && <LoadingSkeleton height={90} label="Checking system health" />}
      {health.isError && (
        <ErrorState
          message={errorMessage(health.error)}
          onRetry={() => health.refetch()}
          hint="If this keeps failing the API itself may be down — check that uvicorn is running."
        />
      )}

      {h && <HealthStatusBanner status={h.overall_status} dbConnectivity={h.db_connectivity} />}

      {h && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Last ingestion run"
              value={lastRun ? relativeTime(lastRun.started_at) : "Never"}
              caption={lastRun ? `${lastRunGroup.length} steps executed` : "Run the pipeline to populate"}
            />
            <StatCard
              label="Records in last run"
              value={formatNumber(recordsInLastRun)}
              caption="Rows written across all steps"
            />
            <StatCard
              label="Failed steps"
              value={String(failedInLastRun)}
              caption={failedInLastRun > 0 ? "See run history below" : "All steps succeeded"}
              tip="A connector failing is tolerated by design — the run continues and the gap-filler covers its routes."
            />
            <StatCard
              label="Sources tracked"
              value={String(h.source_freshness.length)}
              caption="Collectors with data on record"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {Object.entries(h.row_counts).map(([table, count]) => (
              <Panel key={table}>
                <div className="text-[11px] text-apix-muted">
                  <code>{table}</code>
                </div>
                <div className="tabular mt-1 text-[22px] leading-none font-bold text-apix-text">
                  {formatNumber(count)}
                </div>
                <div className="mt-1 text-[11px] text-apix-muted">rows</div>
              </Panel>
            ))}
          </div>

          <Panel
            title="Source freshness"
            caption="How recently each collector last wrote data. Stale after 48 hours."
          >
            <SourceFreshnessTable sources={h.source_freshness} generatedAt={h.generated_at} />
          </Panel>

          <Panel
            title="Recent ingestion runs"
            caption="Every step of every pipeline invocation, with failures and their error messages retained."
          >
            <IngestionRunsTable runs={h.recent_runs} />
          </Panel>
        </>
      )}
    </div>
  );
}
