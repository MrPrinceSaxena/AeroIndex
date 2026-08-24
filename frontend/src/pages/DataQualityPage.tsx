import { useDataQuality } from "../hooks/useDataQuality";
import { DataQualityMetrics } from "../components/quality/DataQualityMetrics";
import { OutlierBreakdownTable } from "../components/quality/OutlierBreakdownTable";
import { CrossSourceStatsTable } from "../components/methodology/CrossSourceStatsTable";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { ApiError } from "../api/client";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

export function DataQualityPage() {
  const quality = useDataQuality();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-apix-text">Data Quality</h1>
        <p className="mt-1 text-sm text-apix-muted">
          Computed by running the real cleaning pipeline (src/cleaning/pipeline.py) against
          the current data — never a separate, potentially-diverging set of checks.
        </p>
      </div>

      {quality.isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} height={110} label="Loading data quality metrics" />
          ))}
        </div>
      )}
      {quality.isError && <ErrorState message={errorMessage(quality.error)} onRetry={() => quality.refetch()} />}
      {quality.data && <DataQualityMetrics data={quality.data} />}

      {quality.data && (
        <>
          <section aria-labelledby="outliers-heading" className="rounded-2xl border border-apix-border bg-apix-surface p-6">
            <h2 id="outliers-heading" className="text-lg font-bold text-apix-text">
              Outliers by route and window
            </h2>
            <p className="mt-1 text-sm text-apix-muted">
              IQR method with a 2.5× multiplier, applied per route + advance-purchase window.
              Outliers are flagged, never dropped — surge prices are real and relevant to the
              index.
            </p>
            <div className="mt-4">
              <OutlierBreakdownTable groups={quality.data.outliers_by_group} />
            </div>
          </section>

          <section aria-labelledby="confidence-heading" className="rounded-2xl border border-apix-border bg-apix-surface p-6">
            <h2 id="confidence-heading" className="text-lg font-bold text-apix-text">
              Confidence signal: cross-source validation
            </h2>
            <p className="mt-1 text-sm text-apix-muted">
              The % fare difference between independent sources on the same route/date. A small
              difference confirms neither source is an outlier.
            </p>
            <div className="mt-4">
              <CrossSourceStatsTable stats={quality.data.cross_source_validation} />
            </div>
          </section>

          <section aria-labelledby="sources-heading" className="rounded-2xl border border-apix-border bg-apix-surface p-6">
            <h2 id="sources-heading" className="text-lg font-bold text-apix-text">
              Rows per source
            </h2>
            <ul className="mt-3 space-y-1 text-sm text-apix-muted">
              {quality.data.rows_per_source.map((r) => (
                <li key={r.source_name}>
                  <span className="font-medium text-apix-text">{r.source_name}</span> — {r.n_rows} rows
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
