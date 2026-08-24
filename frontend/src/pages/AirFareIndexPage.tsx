import { useApix } from "../hooks/useApix";
import { useHeatmap } from "../hooks/useHeatmap";
import { TrendChart } from "../components/charts/TrendChart";
import { HeatmapPanel } from "../components/charts/HeatmapPanel";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { ApiError } from "../api/client";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

export function AirFareIndexPage() {
  const apix = useApix();
  const heatmap = useHeatmap();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-apix-text">Air Fare Index</h1>
        <p className="mt-1 text-sm text-apix-muted">
          The full APIx history — a fixed-basket, DGCA-traffic-weighted, chain-linked price
          index. Base = 100 on the first date of real data.
        </p>
      </div>

      <section aria-labelledby="trend-heading">
        <h2 id="trend-heading" className="mb-1 text-lg font-bold text-apix-text">
          Index over time
        </h2>
        <p className="mb-3 text-sm text-apix-muted">
          Real data = solid sky-blue line. Estimated (synthetic gap-filler) = dashed amber line.
          Never blended silently. Toggle to see weekly-averaged values.
        </p>
        {apix.isLoading && <LoadingSkeleton height={320} label="Loading index trend" />}
        {apix.isError && (
          <ErrorState
            message={errorMessage(apix.error)}
            onRetry={() => apix.refetch()}
            hint="Run `python src/db/init_db.py` then `python -m src.ingestion.run_all` if you haven't populated the database yet."
          />
        )}
        {apix.data && <TrendChart daily={apix.data.daily_series} weekly={apix.data.weekly_series} />}
      </section>

      <section aria-labelledby="chain-linking-heading" className="rounded-2xl border border-apix-border bg-apix-surface p-6">
        <h2 id="chain-linking-heading" className="text-lg font-bold text-apix-text">
          Why chain-linked, monthly?
        </h2>
        <p className="mt-2 text-sm text-apix-muted">
          A fixed base period (e.g. one fixed month forever) causes index drift as market
          conditions shift over time — the basket composition stops reflecting reality the
          further you get from the base date. Monthly chain-linking resets the reference each
          month, so drift stays bounded and the index remains comparable to DGCA&apos;s
          published fare data. This is the same approach used in India&apos;s GDP deflator and
          the international standard for consumer price indices.
        </p>
      </section>

      <section aria-labelledby="heatmap-heading">
        <h2 id="heatmap-heading" className="mb-1 text-lg font-bold text-apix-text">
          How fares compare across routes
        </h2>
        <p className="mb-3 text-sm text-apix-muted">
          Median real fare by route and advance-purchase window. Darker = more expensive.
        </p>
        {heatmap.isLoading && <LoadingSkeleton height={200} label="Loading fare heatmap" />}
        {heatmap.isError && <ErrorState message={errorMessage(heatmap.error)} onRetry={() => heatmap.refetch()} />}
        {heatmap.data && heatmap.data.cells.length === 0 && (
          <EmptyState message="Heatmap will appear once real scrape data is loaded." />
        )}
        {heatmap.data && heatmap.data.cells.length > 0 && <HeatmapPanel cells={heatmap.data.cells} />}
      </section>
    </div>
  );
}
