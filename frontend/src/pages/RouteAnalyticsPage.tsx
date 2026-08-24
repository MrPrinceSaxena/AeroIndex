import { useState } from "react";
import { useCatalog } from "../hooks/useCatalog";
import { useRouteStats } from "../hooks/useRouteStats";
import { useRouteHistory } from "../hooks/useRouteHistory";
import { useElasticity } from "../hooks/useElasticity";
import { PageHeader } from "../components/layout/PageHeader";
import { Panel } from "../components/ui/Panel";
import { StatCard } from "../components/ui/StatCard";
import { Field, SelectField, Toolbar, controlClasses } from "../components/ui/Field";
import { RouteHistoryChart } from "../components/charts/RouteHistoryChart";
import { ElasticityChart } from "../components/charts/ElasticityChart";
import { FareDistributionChart } from "../components/charts/FareDistributionChart";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { ApiError } from "../api/client";
import type { Route } from "../types/apix";
import { formatFare, formatNumber, routeCode, routeLabel } from "../utils/format";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

export function RouteAnalyticsPage() {
  const catalog = useCatalog();
  const [route, setRoute] = useState<Route>("DEL-BOM");
  const [airline, setAirline] = useState("");
  const [window, setWindow] = useState<number | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const stats = useRouteStats({
    route,
    airline: airline || undefined,
    advance_purchase_days: window === "" ? undefined : Number(window),
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });
  const history = useRouteHistory(route);
  const elasticity = useElasticity(route);

  const s = stats.data;
  const hasFares = (s?.n_fares ?? 0) > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Route Analytics"
        subtitle="Drill into one city pair: fare history, how price moves as departure approaches, the spread behind the averages, and which carriers are flying it."
      />

      <Toolbar>
        <SelectField
          label="Route"
          value={route}
          onChange={(v) => setRoute(v as Route)}
          options={(catalog.data?.routes ?? []).map((r) => ({ value: r, label: routeLabel(r) }))}
        />
        <SelectField
          label="Booking window"
          value={window}
          onChange={(v) => setWindow(v === "" ? "" : Number(v))}
          allLabel="All windows"
          options={(catalog.data?.advance_purchase_windows ?? []).map((w) => ({
            value: w,
            label: `T-${w} days`,
          }))}
        />
        <SelectField
          label="Airline"
          value={airline}
          onChange={setAirline}
          allLabel="All airlines"
          options={(catalog.data?.airlines ?? []).map((a) => ({ value: a, label: a }))}
        />
        <Field label="Travel date from">
          <input
            type="date"
            className={controlClasses}
            value={dateFrom}
            min={catalog.data?.date_min ?? undefined}
            max={catalog.data?.date_max ?? undefined}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </Field>
        <Field label="Travel date to">
          <input
            type="date"
            className={controlClasses}
            value={dateTo}
            min={catalog.data?.date_min ?? undefined}
            max={catalog.data?.date_max ?? undefined}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </Field>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setAirline("");
              setWindow("");
              setDateFrom("");
              setDateTo("");
            }}
            className="w-full rounded-lg border border-apix-border px-3 py-1.5 text-[13px] font-medium text-apix-text-soft transition-colors hover:bg-apix-surface-alt"
          >
            Reset filters
          </button>
        </div>
      </Toolbar>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Average fare"
          value={s?.avg_fare != null ? formatFare(s.avg_fare) : "—"}
          caption={`${routeCode(route)} · current filters`}
          tip="Mean of bookable fares only. Sold-out quotes carry no price and are excluded so they cannot drag the average down."
          loading={stats.isLoading}
        />
        <StatCard
          label="Lowest fare"
          value={s?.min_fare != null ? formatFare(s.min_fare) : "—"}
          caption="Cheapest observed quote"
          loading={stats.isLoading}
        />
        <StatCard
          label="Highest fare"
          value={s?.max_fare != null ? formatFare(s.max_fare) : "—"}
          caption="Most expensive observed quote"
          loading={stats.isLoading}
        />
        <StatCard
          label="Fares observed"
          value={s ? formatNumber(s.n_fares) : "—"}
          caption="Bookable quotes matching filters"
          loading={stats.isLoading}
        />
      </div>

      {stats.isError && <ErrorState message={errorMessage(stats.error)} onRetry={() => stats.refetch()} />}
      {s && !hasFares && (
        <EmptyState message="No bookable fares match these filters. Sold-out quotes are excluded from fare statistics — widen the filters or check the Data Explorer to see every quote that was collected." />
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title={`Fare history — ${routeLabel(route)}`}
          caption="Median fare over time. Solid blue = real data, dashed amber = synthetic estimate."
        >
          {history.isLoading && <LoadingSkeleton height={256} label="Loading route history" />}
          {history.isError && (
            <ErrorState message={errorMessage(history.error)} onRetry={() => history.refetch()} />
          )}
          {history.data && history.data.points.length === 0 && (
            <EmptyState message="No fare history for this route yet." />
          )}
          {history.data && history.data.points.length > 0 && (
            <RouteHistoryChart points={history.data.points} />
          )}
        </Panel>

        <Panel
          title="Fare distribution"
          caption="How observed fares are spread — the detail a single average hides."
        >
          {stats.isLoading && <LoadingSkeleton height={224} label="Loading fare distribution" />}
          {s && s.distribution.length === 0 && (
            <EmptyState message="Distribution appears once bookable fares match the filters." />
          )}
          {s && s.distribution.length > 0 && <FareDistributionChart buckets={s.distribution} />}
          {s?.median_fare != null && (
            <p className="mt-2 text-[11px] text-apix-muted">
              Median <span className="tabular font-semibold text-apix-text">{formatFare(s.median_fare)}</span>{" "}
              across {formatNumber(s.n_fares)} fares.
            </p>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Lead-time price premium"
          caption="Fare against days before departure, split by source so real and estimated are never averaged into one bar."
        >
          {elasticity.isLoading && <LoadingSkeleton height={256} label="Loading elasticity chart" />}
          {elasticity.isError && (
            <ErrorState message={errorMessage(elasticity.error)} onRetry={() => elasticity.refetch()} />
          )}
          {elasticity.data && elasticity.data.points.length === 0 && (
            <EmptyState message="Lead-time comparison appears once fares are collected for this route." />
          )}
          {elasticity.data && elasticity.data.points.length > 0 && (
            <ElasticityChart points={elasticity.data.points} />
          )}
        </Panel>

        <Panel title="Airlines on this route" caption="Ranked by average fare across matching quotes.">
          {stats.isLoading && <LoadingSkeleton height={160} label="Loading airline breakdown" />}
          {s && s.airlines.length === 0 && (
            <EmptyState message="No named carrier has a bookable fare here yet. The synthetic gap-filler never claims an airline, so it is excluded from this ranking." />
          )}
          {s && s.airlines.length > 0 && (
            <table className="w-full text-[12px]">
              <caption className="sr-only">Average fare by airline</caption>
              <thead>
                <tr className="border-b border-apix-border text-apix-muted">
                  <th scope="col" className="py-1.5 text-left font-medium">Airline</th>
                  <th scope="col" className="py-1.5 text-right font-medium">Avg</th>
                  <th scope="col" className="py-1.5 text-right font-medium">Range</th>
                  <th scope="col" className="py-1.5 text-right font-medium">n</th>
                </tr>
              </thead>
              <tbody>
                {s.airlines.map((a) => (
                  <tr key={a.carrier} className="border-b border-apix-border last:border-0">
                    <td className="py-1.5 font-semibold text-apix-text">{a.carrier}</td>
                    <td className="tabular py-1.5 text-right">{formatFare(a.avg_fare)}</td>
                    <td className="tabular py-1.5 text-right text-apix-muted">
                      {formatFare(a.min_fare)}–{formatFare(a.max_fare)}
                    </td>
                    <td className="tabular py-1.5 text-right text-apix-muted">{a.n_fares}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  );
}
