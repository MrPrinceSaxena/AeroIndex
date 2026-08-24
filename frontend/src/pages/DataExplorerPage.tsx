import { useState } from "react";
import { useQuotes } from "../hooks/useQuotes";
import { FilterBar } from "../components/explorer/FilterBar";
import { QuotesTable } from "../components/explorer/QuotesTable";
import { Pagination } from "../components/explorer/Pagination";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { ApiError } from "../api/client";
import type { QuotesFilters } from "../types/apix";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

const PAGE_SIZE = 25;

export function DataExplorerPage() {
  const [filters, setFilters] = useState<QuotesFilters>({ include_sold_out: true, limit: PAGE_SIZE, offset: 0 });
  const quotes = useQuotes(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-apix-text">Data Explorer</h1>
        <p className="mt-1 text-sm text-apix-muted">
          Every raw fare quote collected, filterable by route, source, advance-purchase
          window, and travel date. Sold-out quotes are included and clearly badged, not
          hidden.
        </p>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      {quotes.isLoading && <LoadingSkeleton height={400} label="Loading fare quotes" />}
      {quotes.isError && <ErrorState message={errorMessage(quotes.error)} onRetry={() => quotes.refetch()} />}
      {quotes.data && quotes.data.rows.length === 0 && (
        <EmptyState message="No fare quotes match these filters." />
      )}
      {quotes.data && quotes.data.rows.length > 0 && (
        <div className="space-y-4">
          <QuotesTable rows={quotes.data.rows} />
          <Pagination
            offset={filters.offset ?? 0}
            limit={PAGE_SIZE}
            totalCount={quotes.data.total_count}
            onOffsetChange={(nextOffset) => setFilters((prev) => ({ ...prev, offset: nextOffset }))}
          />
        </div>
      )}
    </div>
  );
}
