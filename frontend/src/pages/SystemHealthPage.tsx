import { useState } from "react";
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
import { ApiError, triggerSchedulerRun } from "../api/client";
import { formatNumber, relativeTime } from "../utils/format";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

export function SystemHealthPage() {
  const health = useSystemHealth();
  const h = health.data;
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);

  const handleTrigger = async () => {
    try {
      setTriggering(true);
      setTriggerMsg(null);
      const res = await triggerSchedulerRun();
      setTriggerMsg(res.message || "Extraction initiated");
      setTimeout(() => health.refetch(), 2000);
      setTimeout(() => setTriggerMsg(null), 8000);
    } catch (err) {
      setTriggerMsg(errorMessage(err));
    } finally {
      setTriggering(false);
    }
  };

  const runs = h?.recent_runs ?? [];
  const lastRun = runs[0];
  const lastRunGroup = lastRun ? runs.filter((r) => r.run_id === lastRun.run_id) : [];
  const failedInLastRun = lastRunGroup.filter((r) => r.status === "failed").length;
  const recordsInLastRun = lastRunGroup.reduce((a, r) => a + r.records_ingested, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="System Health"
        subtitle="Live pipeline observability — database connectivity, automated daily scheduler, and per-source freshness."
        actions={
          <div className="flex items-center gap-2">
            {h?.scheduler && (
              <Badge tone={h.scheduler.is_running ? "success" : "neutral"}>
                Scheduler: {h.scheduler.is_running ? "Active (Daily 06:00 UTC)" : "Manual"}
              </Badge>
            )}
            <button
              onClick={handleTrigger}
              disabled={triggering}
              className="inline-flex items-center gap-1.5 rounded-lg border border-apix-border bg-apix-surface px-3 py-1.5 text-xs font-medium text-apix-text shadow-sm transition-colors hover:bg-apix-border/50 disabled:opacity-50"
            >
              {triggering ? "Starting Run..." : "Trigger Ingestion Now"}
            </button>
            <Badge tone="info">Auto-refreshes (30s)</Badge>
          </div>
        }
      />

      {triggerMsg && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-xs text-blue-600 dark:text-blue-400">
          {triggerMsg}
        </div>
      )}


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
