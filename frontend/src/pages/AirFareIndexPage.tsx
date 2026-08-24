import { useApix } from "../hooks/useApix";
import { useHeatmap } from "../hooks/useHeatmap";
import { useOverview } from "../hooks/useOverview";
import { useContributions } from "../hooks/useContributions";
import { useCatalog } from "../hooks/useCatalog";
import { PageHeader } from "../components/layout/PageHeader";
import { Panel } from "../components/ui/Panel";
import { StatCard } from "../components/ui/StatCard";
import { Badge } from "../components/ui/Badge";
import { TrendChart } from "../components/charts/TrendChart";
import { HeatmapPanel } from "../components/charts/HeatmapPanel";
import { ContributionChart } from "../components/charts/ContributionChart";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { ApiError } from "../api/client";
import { formatDate, formatIndex, formatNumber, routeCode } from "../utils/format";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

export function AirFareIndexPage() {
  const apix = useApix();
  const heatmap = useHeatmap();
  const overview = useOverview();
  const contributions = useContributions();
  const catalog = useCatalog();

  const series = apix.data?.daily_series ?? [];
  const estimatedPoints = series.filter((p) => p.is_estimated).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Air Fare Index"
        subtitle="The full APIx history — a fixed-basket, DGCA-traffic-weighted, chain-linked price index across the monitored route basket."
        actions={
          apix.data ? (
            <Badge tone="info">Base 100 · {formatDate(apix.data.base_date)}</Badge>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Current index"
          value={apix.data ? formatIndex(apix.data.latest_value) : "—"}
          deltaPct={overview.data?.change_pct ?? null}
          caption={apix.data ? `as of ${formatDate(apix.data.latest_date)}` : undefined}
          loading={apix.isLoading}
        />
        <StatCard
          label="Observations"
          value={formatNumber(series.length)}
          caption="Distinct dates in the index series"
          loading={apix.isLoading}
        />
        <StatCard
          label="Estimated points"
          value={formatNumber(estimatedPoints)}
          caption="Days where synthetic data contributed"
          tip="A point is marked estimated if any route contributing to that day's value came from the synthetic gap-filler."
          loading={apix.isLoading}
        />
        <StatCard
          label="Weekly points"
          value={formatNumber(apix.data?.weekly_series.length ?? 0)}
          caption="ISO weeks covered"
          loading={apix.isLoading}
        />
      </div>

      <Panel
        title="Index over time"
        caption="Solid blue = real data. Dashed amber = synthetic gap-filler. Toggle for weekly averages."
      >
        {apix.isLoading && <LoadingSkeleton height={256} label="Loading index trend" />}
        {apix.isError && (
          <ErrorState
            message={errorMessage(apix.error)}
            onRetry={() => apix.refetch()}
            hint="If the database is empty, run `python -m src.ingestion.run_all` to collect fares."
          />
        )}
        {apix.data && <TrendChart daily={apix.data.daily_series} weekly={apix.data.weekly_series} />}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Index contribution by route"
          caption="Each route's weight × log-return between the latest two dates — the same chain-linking maths behind the headline number."
        >
          {contributions.isLoading && <LoadingSkeleton height={220} label="Loading contributions" />}
          {contributions.isError && (
            <ErrorState message={errorMessage(contributions.error)} onRetry={() => contributions.refetch()} />
          )}
          {contributions.data && !contributions.data.has_sufficient_data && (
            <EmptyState message="Contribution analysis needs at least two observation dates. Run the ingestion pipeline again to build history." />
          )}
          {contributions.data?.has_sufficient_data && (
            <>
              <ContributionChart contributions={contributions.data.contributions} />
              <table className="mt-3 w-full text-[12px]">
                <caption className="sr-only">Per-route contribution detail</caption>
                <thead>
                  <tr className="border-b border-apix-border text-apix-muted">
                    <th scope="col" className="py-1.5 text-left font-medium">Route</th>
                    <th scope="col" className="py-1.5 text-right font-medium">Weight</th>
                    <th scope="col" className="py-1.5 text-right font-medium">Log return</th>
                    <th scope="col" className="py-1.5 text-right font-medium">Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.data.contributions.map((c) => (
                    <tr key={c.route} className="border-b border-apix-border last:border-0">
                      <td className="py-1.5 font-semibold text-apix-text">{routeCode(c.route)}</td>
                      <td className="tabular py-1.5 text-right">{(c.weight * 100).toFixed(1)}%</td>
                      <td className="tabular py-1.5 text-right">
                        {c.log_return != null ? c.log_return.toFixed(4) : "—"}
                      </td>
                      <td
                        className={`tabular py-1.5 text-right font-semibold ${
                          c.contribution == null
                            ? "text-apix-muted"
                            : c.contribution > 0
                              ? "text-apix-up"
                              : "text-apix-down"
                        }`}
                      >
                        {c.contribution != null ? `${(c.contribution * 100).toFixed(2)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Panel>

        <Panel
          title="Fare levels across the basket"
          caption="Median real fare by route and advance-purchase window. Darker = more expensive."
        >
          {heatmap.isLoading && <LoadingSkeleton height={180} label="Loading fare heatmap" />}
          {heatmap.isError && <ErrorState message={errorMessage(heatmap.error)} onRetry={() => heatmap.refetch()} />}
          {heatmap.data && heatmap.data.cells.length === 0 && (
            <EmptyState message="This view shows real scraped fares only. It will populate once the connectors return bookable quotes — synthetic estimates are deliberately excluded here." />
          )}
          {heatmap.data && heatmap.data.cells.length > 0 && catalog.data && (
            <HeatmapPanel
              cells={heatmap.data.cells}
              windows={catalog.data.advance_purchase_windows}
              routes={catalog.data.routes}
            />
          )}
        </Panel>
      </div>

      <Panel title="How the index is constructed">
        <div className="grid gap-4 text-[12px] leading-relaxed text-apix-muted sm:grid-cols-3">
          <div>
            <div className="mb-1 text-[13px] font-semibold text-apix-text">Traffic-weighted</div>
            A simple average would treat a low-traffic route the same as a high-traffic one. Weighting by
            DGCA passenger share means the index moves in proportion to how many travellers are actually
            affected — the same principle behind CPI item weights.
          </div>
          <div>
            <div className="mb-1 text-[13px] font-semibold text-apix-text">Chain-linked monthly</div>
            A fixed base period drifts as market conditions shift. Monthly chain-linking resets the
            reference each month, keeping the series comparable to DGCA&apos;s published fare data — the
            approach used in India&apos;s GDP deflator.
          </div>
          <div>
            <div className="mb-1 text-[13px] font-semibold text-apix-text">One formula, not three</div>
            Laspeyres and Fisher both need quantity data this system does not collect. One formula that
            can be fully defended beats several that would each need hedging.
          </div>
        </div>
      </Panel>
    </div>
  );
}
