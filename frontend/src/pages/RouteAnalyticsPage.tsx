import { useState } from "react";
import { useElasticity } from "../hooks/useElasticity";
import { useRouteHistory } from "../hooks/useRouteHistory";
import { useContributions } from "../hooks/useContributions";
import { ElasticityChart } from "../components/charts/ElasticityChart";
import { RouteHistoryChart } from "../components/charts/RouteHistoryChart";
import { ContributionChart } from "../components/charts/ContributionChart";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { ApiError } from "../api/client";
import { ROUTES, type Route } from "../types/apix";
import { formatDate, routeLabel } from "../utils/format";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

export function RouteAnalyticsPage() {
  const [route, setRoute] = useState<Route>("DEL-BOM");
  const history = useRouteHistory(route);
  const elasticity = useElasticity(route);
  const contributions = useContributions();

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-apix-text">Route Analytics</h1>
          <p className="mt-1 text-sm text-apix-muted">
            Drill into one route&apos;s fare history and lead-time premium, and see which
            route is driving the index right now.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-apix-muted">Route</span>
          <select
            value={route}
            onChange={(e) => setRoute(e.target.value as Route)}
            className="w-full rounded-lg border border-apix-border bg-apix-surface px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-apix-real sm:w-auto"
          >
            {ROUTES.map((r) => (
              <option key={r} value={r}>
                {routeLabel(r)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section aria-labelledby="history-heading">
        <h2 id="history-heading" className="mb-1 text-lg font-bold text-apix-text">
          Fare history — {routeLabel(route)}
        </h2>
        <p className="mb-3 text-sm text-apix-muted">Median fare over time for this route.</p>
        {history.isLoading && <LoadingSkeleton height={288} label="Loading route history" />}
        {history.isError && <ErrorState message={errorMessage(history.error)} onRetry={() => history.refetch()} />}
        {history.data && history.data.points.length === 0 && (
          <EmptyState message="No fare history yet for this route." />
        )}
        {history.data && history.data.points.length > 0 && <RouteHistoryChart points={history.data.points} />}
      </section>

      <section aria-labelledby="elasticity-heading">
        <h2 id="elasticity-heading" className="mb-1 text-lg font-bold text-apix-text">
          Lead-time price premium
        </h2>
        <p className="mb-3 text-sm text-apix-muted">
          Fare vs. days before departure, split by source — never blended into one bar.
        </p>
        {elasticity.isLoading && <LoadingSkeleton height={288} label="Loading elasticity chart" />}
        {elasticity.isError && (
          <ErrorState message={errorMessage(elasticity.error)} onRetry={() => elasticity.refetch()} />
        )}
        {elasticity.data && elasticity.data.points.length === 0 && (
          <EmptyState message="Elasticity data will appear here once fares are loaded for this route." />
        )}
        {elasticity.data && elasticity.data.points.length > 0 && (
          <ElasticityChart points={elasticity.data.points} />
        )}
      </section>

      <section aria-labelledby="contributions-heading">
        <h2 id="contributions-heading" className="mb-1 text-lg font-bold text-apix-text">
          What&apos;s driving the index
        </h2>
        <p className="mb-3 text-sm text-apix-muted">
          Each route&apos;s weight × log-return between the latest two dates — the same
          chain-linking math behind the headline number, broken out per route.
        </p>
        {contributions.isLoading && <LoadingSkeleton height={220} label="Loading contribution breakdown" />}
        {contributions.isError && (
          <ErrorState message={errorMessage(contributions.error)} onRetry={() => contributions.refetch()} />
        )}
        {contributions.data && !contributions.data.has_sufficient_data && (
          <EmptyState message="Not enough dates of data yet to show a contribution breakdown — needs at least two." />
        )}
        {contributions.data && contributions.data.has_sufficient_data && (
          <>
            <ContributionChart contributions={contributions.data.contributions} />
            {contributions.data.from_date && contributions.data.to_date && (
              <p className="mt-2 text-xs text-apix-muted">
                Comparing {formatDate(contributions.data.from_date)} to {formatDate(contributions.data.to_date)}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
