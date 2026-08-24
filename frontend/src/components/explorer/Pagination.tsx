import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  offset: number;
  limit: number;
  totalCount: number;
  onOffsetChange: (nextOffset: number) => void;
}

export function Pagination({ offset, limit, totalCount, onOffsetChange }: PaginationProps) {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const rangeStart = totalCount === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + limit, totalCount);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-apix-muted">
        Showing {rangeStart}–{rangeEnd} of {totalCount}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          disabled={offset === 0}
          className="inline-flex items-center gap-1 rounded-lg border border-apix-border bg-apix-surface px-3 py-1.5 text-sm font-medium text-apix-text transition hover:bg-apix-bg disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-apix-real"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Prev
        </button>
        <span className="text-sm text-apix-muted">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onOffsetChange(offset + limit)}
          disabled={offset + limit >= totalCount}
          className="inline-flex items-center gap-1 rounded-lg border border-apix-border bg-apix-surface px-3 py-1.5 text-sm font-medium text-apix-text transition hover:bg-apix-bg disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-apix-real"
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
