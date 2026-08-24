import { useSystemHealth } from "../hooks/useSystemHealth";
import { HealthStatusBanner } from "../components/health/HealthStatusBanner";
import { IngestionRunsTable } from "../components/health/IngestionRunsTable";
import { SourceFreshnessTable } from "../components/health/SourceFreshnessTable";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { ApiError } from "../api/client";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

export function SystemHealthPage() {
  const health = useSystemHealth();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-apix-text">System Health</h1>
        <p className="mt-1 text-sm text-apix-muted">
          Real pipeline status, not a guess — database connectivity, ingestion run history, and
          per-source data freshness. Refreshes automatically every 30 seconds.
        </p>
      </div>

      {health.isLoading && <LoadingSkeleton height={100} label="Checking system health" />}
      {health.isError && (
        <ErrorState
          message={errorMessage(health.error)}
          onRetry={() => health.refetch()}
          hint="If this keeps failing, the API itself may be unreachable — check that uvicorn is running."
        />
      )}
      {health.data && <HealthStatusBanner status={health.data.overall_status} dbConnectivity={health.data.db_connectivity} />}

      {health.data && (
        <>
          <section aria-labelledby="counts-heading">
            <h2 id="counts-heading" className="mb-3 text-lg font-bold text-apix-text">
              Table row counts
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Object.entries(health.data.row_counts).map(([table, count]) => (
                <div key={table} className="rounded-2xl border border-apix-border bg-apix-surface p-5">
                  <div className="text-sm text-apix-muted">{table}</div>
                  <div className="mt-1 text-2xl font-bold text-apix-text">{count.toLocaleString("en-IN")}</div>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="freshness-heading">
            <h2 id="freshness-heading" className="mb-3 text-lg font-bold text-apix-text">
              Source freshness
            </h2>
            <SourceFreshnessTable sources={health.data.source_freshness} />
          </section>

          <section aria-labelledby="runs-heading">
            <h2 id="runs-heading" className="mb-3 text-lg font-bold text-apix-text">
              Recent ingestion runs
            </h2>
            <IngestionRunsTable runs={health.data.recent_runs} />
          </section>
        </>
      )}
    </div>
  );
}
