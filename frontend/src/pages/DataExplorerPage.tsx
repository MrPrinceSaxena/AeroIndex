import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { useQuotes } from "../hooks/useQuotes";
import { useCatalog } from "../hooks/useCatalog";
import { useDataQuality } from "../hooks/useDataQuality";
import { PageHeader } from "../components/layout/PageHeader";
import { Panel } from "../components/ui/Panel";
import { Field, SelectField, Toolbar, controlClasses } from "../components/ui/Field";
import { QuotesTable } from "../components/explorer/QuotesTable";
import { Pagination } from "../components/explorer/Pagination";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { ApiError } from "../api/client";
import type { QuotesFilters, Route, FareQuoteRow } from "../types/apix";
import { routeLabel, sourceLabel } from "../utils/format";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

const PAGE_SIZE = 25;

function toCsv(rows: FareQuoteRow[]): string {
  const headers = [
    "id", "route", "carrier", "date_scraped", "travel_date", "advance_purchase_days",
    "fare_class", "base_fare", "taxes", "total_fare", "source_name", "is_sold_out",
  ];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h as keyof FareQuoteRow])).join(",")),
  ].join("\n");
}

export function DataExplorerPage() {
  const catalog = useCatalog();
  const quality = useDataQuality();
  const [filters, setFilters] = useState<QuotesFilters>({
    include_sold_out: true,
    limit: PAGE_SIZE,
    offset: 0,
  });
  const [search, setSearch] = useState("");
  const quotes = useQuotes(filters);

  const outlierIds = useMemo(
    () => new Set(quality.data?.outlier_ids ?? []),
    [quality.data?.outlier_ids],
  );

  // Search narrows the current page client-side; the filter bar above is the
  // server-side query. Kept deliberately separate so the row counts shown by
  // the paginator always describe the real server-side result set.
  const visibleRows = useMemo(() => {
    const rows = quotes.data?.rows ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.route, r.carrier ?? "", r.source_name, r.fare_class ?? "", String(r.total_fare)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [quotes.data?.rows, search]);

  const update = (patch: Partial<QuotesFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch, offset: 0 }));

  const handleExport = () => {
    const rows = quotes.data?.rows ?? [];
    if (rows.length === 0) return;
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apix-fare-quotes-page-${Math.floor((filters.offset ?? 0) / PAGE_SIZE) + 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    if (!quotes.data?.rows.length) return;
    const blob = new Blob([JSON.stringify(quotes.data.rows, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apix-fare-quotes-page-${Math.floor((filters.offset ?? 0) / PAGE_SIZE) + 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Data Explorer"
        subtitle="Every fare quote the pipeline has collected, filterable and traceable to its source. Sold-out quotes and pipeline-flagged outliers are shown and labelled, never quietly dropped."
      />

      <Toolbar>
        <SelectField
          label="Route"
          value={filters.route ?? ""}
          onChange={(v) => update({ route: (v || undefined) as Route | undefined })}
          allLabel="All routes"
          options={(catalog.data?.routes ?? []).map((r) => ({ value: r, label: routeLabel(r) }))}
        />
        <SelectField
          label="Airline / source"
          value={filters.source_name ?? ""}
          onChange={(v) => update({ source_name: v || undefined })}
          allLabel="All sources"
          options={(catalog.data?.sources ?? []).map((s) => ({ value: s, label: sourceLabel(s) }))}
        />
        <SelectField
          label="Booking window"
          value={filters.advance_purchase_days ?? ""}
          onChange={(v) => update({ advance_purchase_days: v ? Number(v) : undefined })}
          allLabel="All windows"
          options={(catalog.data?.advance_purchase_windows ?? []).map((w) => ({
            value: w,
            label: `T-${w} days`,
          }))}
        />
        <Field label="Travel date from">
          <input
            type="date"
            className={controlClasses}
            value={filters.date_from ?? ""}
            min={catalog.data?.date_min ?? undefined}
            max={catalog.data?.date_max ?? undefined}
            onChange={(e) => update({ date_from: e.target.value || undefined })}
          />
        </Field>
        <Field label="Travel date to">
          <input
            type="date"
            className={controlClasses}
            value={filters.date_to ?? ""}
            min={catalog.data?.date_min ?? undefined}
            max={catalog.data?.date_max ?? undefined}
            onChange={(e) => update({ date_to: e.target.value || undefined })}
          />
        </Field>
        <div className="flex items-end gap-2">
          <label className="flex flex-1 items-center gap-2 text-[12px] text-apix-text-soft">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-apix-border text-apix-primary focus-visible:ring-2 focus-visible:ring-apix-primary-ring"
              checked={filters.include_sold_out ?? true}
              onChange={(e) => update({ include_sold_out: e.target.checked })}
            />
            Sold-out
          </label>
        </div>
      </Toolbar>

      <Panel
        title="Fare quotes"
        caption={
          quotes.data
            ? `${quotes.data.total_count.toLocaleString("en-IN")} quotes match the current filters`
            : undefined
        }
        actions={
          <>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-apix-faint"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search this page…"
                aria-label="Search the current page of results"
                className={`${controlClasses} w-full pl-8 sm:w-52`}
              />
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={!quotes.data?.rows.length}
              className="inline-flex items-center gap-1.5 rounded-lg border border-apix-border px-2.5 py-1.5 text-[12px] font-medium text-apix-text-soft transition-colors hover:bg-apix-surface-alt disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              CSV
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              disabled={!quotes.data?.rows.length}
              className="inline-flex items-center gap-1.5 rounded-lg border border-apix-border px-2.5 py-1.5 text-[12px] font-medium text-apix-text-soft transition-colors hover:bg-apix-surface-alt disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              JSON
            </button>
          </>
        }
        bodyClassName="p-0"
      >
        {quotes.isLoading && (
          <div className="p-4">
            <LoadingSkeleton height={320} label="Loading fare quotes" />
          </div>
        )}
        {quotes.isError && (
          <div className="p-4">
            <ErrorState message={errorMessage(quotes.error)} onRetry={() => quotes.refetch()} />
          </div>
        )}
        {quotes.data && quotes.data.rows.length === 0 && (
          <div className="p-4">
            <EmptyState message="No fare quotes match these filters. Try widening the date range or clearing a filter." />
          </div>
        )}
        {quotes.data && quotes.data.rows.length > 0 && (
          <>
            {visibleRows.length === 0 ? (
              <div className="p-4">
                <EmptyState message={`Nothing on this page matches "${search}". Clear the search to see all ${quotes.data.rows.length} rows on this page.`} />
              </div>
            ) : (
              <QuotesTable rows={visibleRows} outlierIds={outlierIds} />
            )}
            <div className="border-t border-apix-border px-4 py-3">
              <Pagination
                offset={filters.offset ?? 0}
                limit={PAGE_SIZE}
                totalCount={quotes.data.total_count}
                onOffsetChange={(nextOffset) => setFilters((prev) => ({ ...prev, offset: nextOffset }))}
              />
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
