import { useBacktest } from "../hooks/useBacktest";
import { BacktestTable } from "../components/benchmarking/BacktestTable";
import { DgcaReferenceTable } from "../components/benchmarking/DgcaReferenceTable";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { ApiError } from "../api/client";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

export function BenchmarkingPage() {
  const backtest = useBacktest();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-apix-text">DGCA Benchmarking</h1>
        <p className="mt-1 text-sm text-apix-muted">
          Comparing APIx&apos;s monthly averages against DGCA&apos;s published reference
          fares — flagged when the deviation is large, not hidden.
        </p>
      </div>

      {backtest.isLoading && <LoadingSkeleton height={200} label="Loading backtest comparison" />}
      {backtest.isError && (
        <ErrorState message={errorMessage(backtest.error)} onRetry={() => backtest.refetch()} />
      )}

      {backtest.data && !backtest.data.has_overlap && (
        <EmptyState
          message={`No overlapping month exists yet between live data and the DGCA reference period, so no comparison can be computed.`}
        >
          <p className="text-sm text-apix-muted">
            Live data currently covers{" "}
            <span className="font-medium text-apix-text">{backtest.data.live_data_period ?? "no dates yet"}</span>.
            DGCA&apos;s published reference data on file covers{" "}
            <span className="font-medium text-apix-text">{backtest.data.reference_period}</span>. This will
            populate automatically once live data reaches a matching month, or once updated DGCA reference
            figures are added for the current period. In the meantime, here is the reference data itself —
            it is real, not a placeholder chart:
          </p>
        </EmptyState>
      )}

      {backtest.data && backtest.data.has_overlap && (
        <section aria-labelledby="comparison-heading" className="rounded-2xl border border-apix-border bg-apix-surface p-6">
          <h2 id="comparison-heading" className="text-lg font-bold text-apix-text">
            Comparison
          </h2>
          <p className="mt-1 text-sm text-apix-muted">
            Deviations over {backtest.data.deviation_threshold_pct}% are flagged in red — a data-quality
            signal worth investigating, not a failure.
          </p>
          <div className="mt-4">
            <BacktestTable rows={backtest.data.comparisons} />
          </div>
        </section>
      )}

      {backtest.data && (
        <section aria-labelledby="reference-heading" className="rounded-2xl border border-apix-border bg-apix-surface p-6">
          <h2 id="reference-heading" className="text-lg font-bold text-apix-text">
            DGCA reference data on file
          </h2>
          <p className="mt-1 text-sm text-apix-muted">
            Source: DGCA Traffic and Fare Monitor, Ministry of Civil Aviation, India.
          </p>
          <div className="mt-4">
            <DgcaReferenceTable rows={backtest.data.reference_data} />
          </div>
        </section>
      )}
    </div>
  );
}
