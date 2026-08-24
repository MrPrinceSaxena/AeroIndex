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

      <div className="border-t border-apix-border pt-10">
        <h2 className="text-xl font-bold text-apix-text">Compliance &amp; data collection</h2>
        <p className="mt-1 text-sm text-apix-muted">
          How the data is collected, and why — the direct answer to &quot;is this scraping
          responsible?&quot;
        </p>
      </div>

      <section aria-labelledby="airline-direct-heading" className="rounded-2xl border border-apix-border bg-apix-surface p-6">
        <h2 id="airline-direct-heading" className="text-lg font-bold text-apix-text">
          Why airline-direct sites, not OTAs
        </h2>
        <p className="mt-2 text-sm text-apix-muted">
          All major Indian OTAs (Ixigo, EaseMyTrip, Cleartrip, MakeMyTrip) explicitly disallow
          automated access to their flight search result pages in robots.txt. Using
          airline-direct sites (Air India, IndiGo) is the only polite and compliant approach
          available for this prototype — and arguably a better methodology choice besides:
          airline-direct prices are the source-of-truth fares, while OTA prices include markup
          and can vary across agents.
        </p>
      </section>

      <section aria-labelledby="robots-heading" className="rounded-2xl border border-apix-border bg-apix-surface p-6">
        <h2 id="robots-heading" className="text-lg font-bold text-apix-text">
          Robots.txt review
        </h2>
        <p className="mt-1 text-sm text-apix-muted">Conducted 2026-08-24.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">Robots.txt compliance review per site</caption>
            <thead>
              <tr className="border-b border-apix-border text-apix-muted">
                <th scope="col" className="py-2 pr-4 font-medium">Site</th>
                <th scope="col" className="py-2 pr-4 font-medium">Relevant disallows</th>
                <th scope="col" className="py-2 font-medium">Decision</th>
              </tr>
            </thead>
            <tbody>
              {[
                { site: "Air India", url: "airindia.com/robots.txt", disallows: "/bin/, company image assets, loyalty page", decision: "Permitted — flight search not disallowed" },
                { site: "IndiGo", url: "goindigo.in/robots.txt", disallows: "Server error — unverified", decision: "Pending manual check before scraping" },
                { site: "Ixigo", url: "ixigo.com/robots.txt", disallows: "/flights/search, /search/result/", decision: "Excluded" },
                { site: "EaseMyTrip", url: "easemytrip.com/robots.txt", disallows: "/flight-search/listing*", decision: "Excluded" },
                { site: "Cleartrip", url: "cleartrip.com/robots.txt", disallows: "/flights/search*", decision: "Excluded" },
              ].map((row) => (
                <tr key={row.site} className="border-b border-apix-border last:border-0 align-top">
                  <td className="py-2.5 pr-4 font-medium text-apix-text">
                    {row.site}
                    <div className="text-xs font-normal text-apix-muted">{row.url}</div>
                  </td>
                  <td className="py-2.5 pr-4 text-apix-muted">{row.disallows}</td>
                  <td className="py-2.5">{row.decision}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="polite-heading" className="rounded-2xl border border-apix-border bg-apix-surface p-6">
        <h2 id="polite-heading" className="text-lg font-bold text-apix-text">
          Polite-guest rules (non-negotiable)
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-apix-muted">
          <li>Delay between requests: minimum 3 seconds (4 seconds default)</li>
          <li>Volume cap: maximum 6 page loads per scraper run (3 routes × 2 advance windows)</li>
          <li>User-Agent: non-impersonating — identifies as APIxResearchBot/1.0 with educational purpose</li>
          <li>No booking, no login, no personal data collected — read-only fare display pages only</li>
          <li>Raw responses saved to data/raw/ for an audit trail</li>
          <li>Purpose: educational research prototype for a government hackathon (SIH 26056), non-commercial</li>
        </ul>
      </section>

      <section aria-labelledby="cleaning-rules-heading" className="rounded-2xl border border-apix-border bg-apix-surface p-6">
        <h2 id="cleaning-rules-heading" className="text-lg font-bold text-apix-text">
          Cleaning rules
        </h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-apix-muted">
          <li>
            <span className="font-medium text-apix-text">Deduplication:</span> exact duplicates
            (same route + date + fare + source) removed, most recent scraped entry kept.
          </li>
          <li>
            <span className="font-medium text-apix-text">Outlier flagging:</span> IQR method with
            a 2.5× multiplier per route + advance window. Outliers are flagged, not deleted —
            surge prices are real and relevant.
          </li>
          <li>
            <span className="font-medium text-apix-text">Component reconciliation:</span> rows
            where base fare + taxes deviate more than ₹50 from total fare are flagged as a
            mismatch.
          </li>
          <li>
            <span className="font-medium text-apix-text">Sold-out handling:</span> rows marked
            sold out are excluded from the index but retained in the database.
          </li>
          <li>
            <span className="font-medium text-apix-text">Source-name invariant:</span> never
            null, never dropped — every record stays traceable to its source through every step.
          </li>
        </ol>
      </section>
    </div>
  );
}
