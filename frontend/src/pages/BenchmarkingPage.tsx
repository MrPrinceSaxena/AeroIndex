import { useBacktest } from "../hooks/useBacktest";
import { PageHeader } from "../components/layout/PageHeader";
import { Panel } from "../components/ui/Panel";
import { StatCard } from "../components/ui/StatCard";
import { Badge } from "../components/ui/Badge";
import { BacktestChart } from "../components/benchmarking/BacktestChart";
import { BacktestTable } from "../components/benchmarking/BacktestTable";
import { DgcaReferenceTable } from "../components/benchmarking/DgcaReferenceTable";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { ApiError } from "../api/client";
import { AlertCircle } from "lucide-react";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

export function BenchmarkingPage() {
  const backtest = useBacktest();
  const b = backtest.data;
  const flagged = b?.comparisons.filter((c) => c.deviation_flagged).length ?? 0;
  const meanDeviation =
    b && b.comparisons.length > 0
      ? b.comparisons.reduce((a, c) => a + c.deviation_pct, 0) / b.comparisons.length
      : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="DGCA Benchmarking"
        subtitle="Validating the index against the Directorate General of Civil Aviation's published average fares. Large deviations are flagged as a data-quality signal, not hidden."
        actions={b ? <Badge tone={b.has_overlap ? "success" : "warning"}>{b.has_overlap ? "Comparison available" : "No overlapping period"}</Badge> : undefined}
      />

      {backtest.isError && <ErrorState message={errorMessage(backtest.error)} onRetry={() => backtest.refetch()} />}
      {backtest.isLoading && <LoadingSkeleton height={180} label="Loading benchmark comparison" />}

      {b && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Reference period" value={b.reference_period} caption="DGCA figures on file" />
          <StatCard label="Live data period" value={b.live_data_period ?? "No data"} caption="Collected observations" />
          <StatCard
            label="Mean deviation"
            value={meanDeviation != null ? `${meanDeviation.toFixed(1)}%` : "—"}
            caption={b.has_overlap ? "Across comparable route-months" : "Needs an overlapping month"}
          />
          <StatCard
            label="Flagged deviations"
            value={b.has_overlap ? String(flagged) : "—"}
            caption={`Above the ${b.deviation_threshold_pct}% threshold`}
            tip="A flag is a signal to investigate the underlying data, not an automatic failure of the index."
          />
        </div>
      )}

      {b && !b.has_overlap && (
        <Panel>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-apix-warn">
              <AlertCircle className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div className="text-[13px] leading-relaxed text-apix-text-soft">
              <p className="font-semibold text-apix-text">
                No overlapping month exists yet, so no comparison can be computed.
              </p>
              <p className="mt-1.5 text-apix-muted">
                Collected data covers{" "}
                <span className="font-semibold text-apix-text">{b.live_data_period ?? "no dates yet"}</span>, while
                the DGCA reference figures on file cover{" "}
                <span className="font-semibold text-apix-text">{b.reference_period}</span>. The comparison
                populates automatically once the two ranges meet — either as collection continues, or once
                DGCA reference figures for the current period are added to{" "}
                <code className="rounded bg-apix-surface-alt px-1 py-0.5 text-[11px]">
                  src/backtest/compare_dgca.py
                </code>
                .
              </p>
              <p className="mt-1.5 text-apix-muted">
                The reference data below is shown unchanged so the benchmark source can be inspected now,
                rather than leaving a chart that implies a comparison which has not happened.
              </p>
            </div>
          </div>
        </Panel>
      )}

      {b?.has_overlap && (
        <>
          <Panel title="APIx vs DGCA reference" caption="Monthly averages across comparable route-months.">
            <BacktestChart rows={b.comparisons} />
          </Panel>
          <Panel
            title="Deviation detail"
            caption={`Route-months deviating more than ${b.deviation_threshold_pct}% are highlighted.`}
          >
            <BacktestTable rows={b.comparisons} />
          </Panel>
        </>
      )}

      {b && (
        <Panel
          title="DGCA reference data on file"
          caption="Source: DGCA Traffic and Fare Monitor, Ministry of Civil Aviation, India."
        >
          <DgcaReferenceTable rows={b.reference_data} />
        </Panel>
      )}
    </div>
  );
}
