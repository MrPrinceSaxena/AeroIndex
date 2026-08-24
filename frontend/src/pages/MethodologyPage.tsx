import { useApix } from "../hooks/useApix";
import { RouteWeightsTable } from "../components/methodology/RouteWeightsTable";
import { CrossSourceStatsTable } from "../components/methodology/CrossSourceStatsTable";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { ApiError } from "../api/client";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

export function MethodologyPage() {
  const apix = useApix();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-apix-text">Methodology</h1>
        <p className="mt-1 text-sm text-apix-muted">
          Why should you trust this index? Two reasons — and both are shown here, not buried
          in code.
        </p>
      </div>

      {apix.isLoading && <LoadingSkeleton height={400} label="Loading methodology" />}
      {apix.isError && <ErrorState message={errorMessage(apix.error)} onRetry={() => apix.refetch()} />}

      {apix.data && (
        <>
          <section aria-labelledby="weights-heading">
            <h2 id="weights-heading" className="text-lg font-bold text-apix-text">
              1. Route weights come from government data, not guesswork
            </h2>
            <p className="mt-1 text-sm text-apix-muted">
              Weights = each route&apos;s share of total passenger traffic. DEL-BOM gets the
              highest weight because it carries the most passengers — a fare spike there
              affects more travellers. Same logic as CPI food weighting.
            </p>
            <div className="mt-4 rounded-2xl border border-apix-border bg-apix-surface p-6">
              <RouteWeightsTable weights={apix.data.methodology.route_weights} />
            </div>
          </section>

          <section aria-labelledby="validation-heading">
            <h2 id="validation-heading" className="text-lg font-bold text-apix-text">
              2. Cross-source validation — same routes, two independent airlines
            </h2>
            <p className="mt-1 text-sm text-apix-muted">
              These are the % fare differences between Air India and IndiGo on the same
              route/date. A small % difference confirms neither source is an outlier — the
              index reflects the market.
            </p>
            <div className="mt-4 rounded-2xl border border-apix-border bg-apix-surface p-6">
              <CrossSourceStatsTable stats={apix.data.methodology.cross_source_validation} />
            </div>
          </section>

          <section aria-labelledby="formula-heading" className="rounded-2xl border border-apix-border bg-apix-surface p-6">
            <h2 id="formula-heading" className="text-lg font-bold text-apix-text">
              The formula
            </h2>
            <p className="mt-2 text-sm text-apix-text">{apix.data.methodology.index_formula}</p>
            <p className="mt-2 text-sm text-apix-muted">{apix.data.methodology.chain_linking}</p>
            <div className="mt-4 space-y-2 text-sm text-apix-muted">
              <p>
                <span className="font-semibold text-apix-text">Why weighted, not a naive average?</span>{" "}
                A simple average treats a low-traffic route the same as a high-traffic one — but
                a fare spike on DEL-BOM affects roughly 3x the travellers a spike on BOM-BLR does.
                Weighting means the index moves proportionally to real-world impact, the same
                principle behind CPI food weighting.
              </p>
              <p>
                <span className="font-semibold text-apix-text">Why chain-linked?</span> A fixed
                base period causes index drift as market conditions shift over time. Monthly
                chain-linking resets the reference each month, keeping the index comparable to
                DGCA&apos;s published fare data — the same approach used in India&apos;s GDP
                deflator.
              </p>
              <p>
                <span className="font-semibold text-apix-text">Why not Laspeyres or Fisher?</span>{" "}
                Both require quantity data we don&apos;t collect at this stage. One formula we
                can fully defend beats two we&apos;d have to hedge on under questioning.
              </p>
            </div>
            <p className="mt-4 text-xs text-apix-muted">
              Weights source: {apix.data.methodology.weights_data_source}
            </p>
          </section>

          <section aria-labelledby="sources-heading" className="rounded-2xl border border-apix-border bg-apix-surface p-6">
            <h2 id="sources-heading" className="text-lg font-bold text-apix-text">
              Data sources
            </h2>
            <ul className="mt-2 space-y-1 text-sm text-apix-muted">
              {apix.data.methodology.data_sources.map((source) => (
                <li key={source}>{source}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
