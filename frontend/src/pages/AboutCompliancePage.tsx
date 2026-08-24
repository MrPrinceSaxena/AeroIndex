const ROBOTS_REVIEW = [
  { site: "Air India", url: "airindia.com/robots.txt", disallows: "/bin/, company image assets, loyalty page", decision: "Permitted — flight search not disallowed" },
  { site: "IndiGo", url: "goindigo.in/robots.txt", disallows: "Server error — unverified", decision: "Pending manual check before scraping" },
  { site: "Ixigo", url: "ixigo.com/robots.txt", disallows: "/flights/search, /search/result/", decision: "Excluded" },
  { site: "EaseMyTrip", url: "easemytrip.com/robots.txt", disallows: "/flight-search/listing*", decision: "Excluded" },
  { site: "Cleartrip", url: "cleartrip.com/robots.txt", disallows: "/flights/search*", decision: "Excluded" },
];

const POLITE_RULES = [
  "Delay between requests: minimum 3 seconds (4 seconds default)",
  "Volume cap: maximum 6 page loads per scraper run (3 routes × 2 advance windows)",
  "User-Agent: non-impersonating — identifies as APIxResearchBot/1.0 with educational purpose",
  "No booking, no login, no personal data collected — read-only fare display pages only",
  "Raw responses saved to data/raw/ for an audit trail",
  "Purpose: educational research prototype for a government hackathon (SIH 26056), non-commercial",
];

export function AboutCompliancePage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-apix-text">About &amp; Compliance</h1>
        <p className="mt-1 text-sm text-apix-muted">
          APIx is a prototype built for SIH 26056 — infrastructure for India&apos;s Ministry of
          Statistics (MoSPI) and RBI, not a consumer flight-deal app.
        </p>
      </div>

      <section className="rounded-2xl border border-apix-border bg-apix-surface p-6">
        <h2 className="text-lg font-bold text-apix-text">Why airline-direct sites, not OTAs</h2>
        <p className="mt-2 text-sm text-apix-muted">
          All major Indian OTAs (Ixigo, EaseMyTrip, Cleartrip, MakeMyTrip) explicitly disallow
          automated access to their flight search result pages in robots.txt. Using
          airline-direct sites (Air India, IndiGo) is the only polite and compliant approach
          available for this prototype — and arguably a better methodology choice besides:
          airline-direct prices are the source-of-truth fares, while OTA prices include markup
          and can vary across agents.
        </p>
      </section>

      <section className="rounded-2xl border border-apix-border bg-apix-surface p-6">
        <h2 className="text-lg font-bold text-apix-text">Robots.txt review</h2>
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
              {ROBOTS_REVIEW.map((row) => (
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

      <section className="rounded-2xl border border-apix-border bg-apix-surface p-6">
        <h2 className="text-lg font-bold text-apix-text">Polite-guest rules (non-negotiable)</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-apix-muted">
          {POLITE_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-apix-border bg-apix-surface p-6">
        <h2 className="text-lg font-bold text-apix-text">Cleaning rules</h2>
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
