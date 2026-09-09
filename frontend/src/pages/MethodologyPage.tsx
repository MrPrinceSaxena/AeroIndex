import { useState } from "react";
import { useApix } from "../hooks/useApix";
import { PageHeader } from "../components/layout/PageHeader";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { Panel } from "../components/ui/Panel";
import { Badge } from "../components/ui/Badge";
import { RouteWeightsTable } from "../components/methodology/RouteWeightsTable";
import { CrossSourceStatsTable } from "../components/methodology/CrossSourceStatsTable";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { ApiError } from "../api/client";
import { Plane, Filter, Calculator, ShieldCheck, ScrollText } from "lucide-react";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "collection", label: "Data Collection" },
  { id: "cleaning", label: "Data Cleaning" },
  { id: "index", label: "Index Calculation" },
  { id: "weights", label: "Weighting Method" },
  { id: "validation", label: "Validation" },
  { id: "compliance", label: "Compliance" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const PIPELINE = [
  { Icon: Plane, label: "Collect" },
  { Icon: Filter, label: "Clean" },
  { Icon: ShieldCheck, label: "Validate" },
  { Icon: Calculator, label: "Index" },
];

const ROBOTS = [
  { site: "Air India", url: "airindia.com/robots.txt", disallows: "/bin/, company image assets, loyalty page", decision: "Permitted — flight search not disallowed", tone: "success" as const },
  { site: "IndiGo", url: "goindigo.in/robots.txt", disallows: "Server error — unverified", decision: "Pending manual check", tone: "warning" as const },
  { site: "Ixigo", url: "ixigo.com/robots.txt", disallows: "/flights/search, /search/result/", decision: "Excluded", tone: "danger" as const },
  { site: "EaseMyTrip", url: "easemytrip.com/robots.txt", disallows: "/flight-search/listing*", decision: "Excluded", tone: "danger" as const },
  { site: "Cleartrip", url: "cleartrip.com/robots.txt", disallows: "/flights/search*", decision: "Excluded", tone: "danger" as const },
];

export function MethodologyPage() {
  const apix = useApix();
  const [section, setSection] = useState<SectionId>("overview");
  const m = apix.data?.methodology;

  return (
    <div className="space-y-5">
      <Breadcrumbs />
      <PageHeader
        title="Methodology & Compliance"
        subtitle="Why this index can be trusted: where the numbers come from, how they are cleaned, how they are combined, and what was ruled out along the way."
      />

      {apix.isError && <ErrorState message={errorMessage(apix.error)} onRetry={() => apix.refetch()} />}

      <div className="grid gap-4 lg:grid-cols-[190px_1fr]">
        <nav aria-label="Methodology sections" className="lg:sticky lg:top-6 lg:self-start">
          <ul className="thin-scroll flex gap-1 overflow-x-auto rounded-xl border border-apix-border bg-apix-surface p-1.5 lg:flex-col lg:overflow-visible">
            {SECTIONS.map((s) => (
              <li key={s.id} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  onClick={() => setSection(s.id)}
                  aria-current={section === s.id ? "true" : undefined}
                  className={`w-full rounded-lg px-3 py-2 text-left text-[12px] font-medium whitespace-nowrap transition-colors ${
                    section === s.id
                      ? "bg-apix-primary-soft text-apix-primary"
                      : "text-apix-text-soft hover:bg-apix-surface-alt"
                  }`}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-4">
          {apix.isLoading && <LoadingSkeleton height={280} label="Loading methodology" />}

          {section === "overview" && (
            <Panel title="Air Fare Index — methodology overview">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {PIPELINE.map(({ Icon, label }, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="flex flex-col items-center rounded-lg border border-apix-border bg-apix-surface-alt px-4 py-2.5">
                      <Icon className="h-4 w-4 text-apix-primary" aria-hidden="true" />
                      <span className="mt-1 text-[11px] font-semibold text-apix-text">{label}</span>
                    </div>
                    {i < PIPELINE.length - 1 && <span className="text-apix-faint">→</span>}
                  </div>
                ))}
              </div>
              <p className="text-[13px] leading-relaxed text-apix-muted">
                The APIx Air Fare Index measures how airfares move over time across key domestic routes and
                booking windows. It combines real and clearly-labelled synthetic data from multiple sources,
                applies rigorous cleaning, deduplication and outlier handling, and produces a single weighted
                index using route and booking-window weights derived from DGCA passenger traffic — benchmarked
                against DGCA's own published fare indicators.
              </p>
              {m && (
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-apix-border px-3 py-2">
                    <dt className="text-[11px] text-apix-muted">Formula</dt>
                    <dd className="mt-0.5 text-[13px] font-semibold text-apix-text">{m.index_formula}</dd>
                  </div>
                  <div className="rounded-lg border border-apix-border px-3 py-2">
                    <dt className="text-[11px] text-apix-muted">Chain-linking</dt>
                    <dd className="mt-0.5 text-[13px] font-semibold text-apix-text">{m.chain_linking}</dd>
                  </div>
                </dl>
              )}
            </Panel>
          )}

          {section === "collection" && (
            <Panel title="Data collection" caption="Two independent airline-direct sources plus a labelled gap-filler.">
              <ul className="space-y-2 text-[13px] leading-relaxed text-apix-muted">
                {m?.data_sources.map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-apix-primary" />
                    <code className="text-[12px]">{s}</code>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13px] leading-relaxed text-apix-muted">
                Collection is polite by design: a minimum three-second delay between requests, a hard cap of
                six page loads per run, a non-impersonating user agent identifying the research bot, no login
                or booking flows, and raw responses retained for audit. Synthetic records are only ever
                generated for route/date/window combinations the real collectors could not reach, and are
                tagged <code className="text-[12px]">synthetic_estimate</code> so they can never be mistaken
                for observed fares.
              </p>
            </Panel>
          )}

          {section === "cleaning" && (
            <Panel title="Data cleaning" caption="Every rule below runs on real data before it reaches the index.">
              <ol className="space-y-2.5 text-[13px] leading-relaxed text-apix-muted">
                <li>
                  <span className="font-semibold text-apix-text">Deduplication.</span> Exact duplicates — same
                  route, date, fare and source — are removed, keeping the most recent scrape.
                </li>
                <li>
                  <span className="font-semibold text-apix-text">Outlier flagging.</span> An IQR test with a
                  2.5× multiplier runs within each route + booking-window group. Outliers are flagged, never
                  deleted: a surge price is real data and belongs in a fare index.
                </li>
                <li>
                  <span className="font-semibold text-apix-text">Component reconciliation.</span> Rows where
                  base fare plus taxes deviate from the total by more than ₹50 are flagged as mismatched.
                </li>
                <li>
                  <span className="font-semibold text-apix-text">Sold-out handling.</span> Sold-out quotes are
                  excluded from fare statistics and the index — they carry no price — but are retained in the
                  database and shown in the Data Explorer.
                </li>
                <li>
                  <span className="font-semibold text-apix-text">Source invariant.</span> The source name is
                  never null and never dropped, so every figure remains traceable to where it came from.
                </li>
              </ol>
            </Panel>
          )}

          {section === "index" && (
            <Panel title="Index calculation">
              <div className="rounded-lg border border-apix-border bg-apix-surface-alt px-3 py-2.5 font-mono text-[12px] text-apix-text">
                I(t) = I(t−1) × Π<sub>routes</sub> [ fare(r,t) / fare(r,t−1) ]<sup>w(r)</sup>
              </div>
              <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-apix-muted">
                <p>
                  <span className="font-semibold text-apix-text">Why weighted, not a naive average?</span> A
                  simple average treats a low-traffic route the same as a high-traffic one. Weighting by
                  passenger share means the index moves in proportion to how many travellers are actually
                  affected — the same principle behind CPI item weights.
                </p>
                <p>
                  <span className="font-semibold text-apix-text">Why chain-linked?</span> A fixed base period
                  drifts as market conditions shift. Monthly chain-linking resets the reference each month,
                  keeping the series comparable to DGCA's published fare data — the approach used in India's
                  GDP deflator.
                </p>
                <p>
                  <span className="font-semibold text-apix-text">Why not Laspeyres or Fisher?</span> Both need
                  quantity data this system does not collect. One formula that can be fully defended beats
                  several that would each need hedging.
                </p>
                <p>
                  <span className="font-semibold text-apix-text">Median, not mean, per cell.</span> Within a
                  route and date the median fare is used, so a single extreme quote cannot move the index on
                  its own.
                </p>
              </div>
            </Panel>
          )}

          {section === "weights" && (
            <Panel
              title="Weighting method"
              caption={m?.weights_data_source}
            >
              {m && <RouteWeightsTable weights={m.route_weights} />}
              <p className="mt-3 text-[13px] leading-relaxed text-apix-muted">
                Weights are each route's share of DGCA-reported passenger traffic. The busiest corridor
                carries the largest weight because a fare spike there affects the most travellers. These are
                published on this page rather than buried in code precisely because &quot;why these
                weights?&quot; is the first question a reviewer should ask.
              </p>
            </Panel>
          )}

          {section === "validation" && (
            <Panel
              title="Cross-source validation"
              caption="Percentage fare difference between independent sources for the same route and date."
            >
              {m && <CrossSourceStatsTable stats={m.cross_source_validation} />}
              <p className="mt-3 text-[13px] leading-relaxed text-apix-muted">
                If two independent collectors agree closely on the same route and date, neither is an
                outlier and the index is unlikely to be an artefact of one website's quirks. A large or
                widening spread is a signal to investigate before trusting the number.
              </p>
            </Panel>
          )}

          {section === "compliance" && (
            <>
              <Panel title="Why airline-direct sources, not OTAs">
                <p className="text-[13px] leading-relaxed text-apix-muted">
                  Every major Indian OTA — Ixigo, EaseMyTrip, Cleartrip, MakeMyTrip — explicitly disallows
                  automated access to flight search results in robots.txt. Airline-direct sites are the only
                  compliant option available, and are arguably the better methodological choice besides:
                  direct prices are the source-of-truth fare, while OTA prices carry markup that varies by
                  agent.
                </p>
              </Panel>
              <Panel title="Robots.txt review" caption="Conducted 2026-08-24.">
                <div className="thin-scroll overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-[12px]">
                    <caption className="sr-only">Robots.txt compliance review per site</caption>
                    <thead>
                      <tr className="border-b border-apix-border text-apix-muted">
                        <th scope="col" className="py-2 pr-4 font-medium">Site</th>
                        <th scope="col" className="py-2 pr-4 font-medium">Relevant disallows</th>
                        <th scope="col" className="py-2 font-medium">Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ROBOTS.map((r) => (
                        <tr key={r.site} className="border-b border-apix-border align-top last:border-0">
                          <td className="py-2 pr-4">
                            <div className="font-semibold text-apix-text">{r.site}</div>
                            <div className="text-[11px] text-apix-muted">{r.url}</div>
                          </td>
                          <td className="py-2 pr-4 text-apix-muted">{r.disallows}</td>
                          <td className="py-2">
                            <Badge tone={r.tone}>{r.decision}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
              <Panel title="Polite-guest rules">
                <ul className="space-y-1.5 text-[13px] leading-relaxed text-apix-muted">
                  <li className="flex items-start gap-2">
                    <ScrollText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-apix-primary" aria-hidden="true" />
                    Minimum three seconds between requests (four by default)
                  </li>
                  <li className="flex items-start gap-2">
                    <ScrollText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-apix-primary" aria-hidden="true" />
                    Hard cap of six page loads per collector run
                  </li>
                  <li className="flex items-start gap-2">
                    <ScrollText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-apix-primary" aria-hidden="true" />
                    Non-impersonating user agent identifying the research bot
                  </li>
                  <li className="flex items-start gap-2">
                    <ScrollText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-apix-primary" aria-hidden="true" />
                    No booking, no login, no personal data — read-only fare pages
                  </li>
                  <li className="flex items-start gap-2">
                    <ScrollText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-apix-primary" aria-hidden="true" />
                    Raw responses retained for an audit trail
                  </li>
                </ul>
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
