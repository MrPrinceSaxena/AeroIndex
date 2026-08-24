import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  offset: number;
  limit: number;
  totalCount: number;
  onOffsetChange: (nextOffset: number) => void;
}

/** Builds a compact page list with ellipses, e.g. 1 … 4 [5] 6 … 20. */
function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - (sorted[i - 1] as number) > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

const btn =
  "min-w-8 rounded-lg border border-apix-border px-2 py-1 text-[12px] font-medium transition-colors " +
  "hover:bg-apix-surface-alt disabled:cursor-not-allowed disabled:opacity-40";

export function Pagination({ offset, limit, totalCount, onOffsetChange }: PaginationProps) {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const rangeStart = totalCount === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + limit, totalCount);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="tabular text-[12px] text-apix-muted">
        Showing {rangeStart}–{rangeEnd} of {totalCount.toLocaleString("en-IN")}
      </p>
      <nav className="flex flex-wrap items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          className={btn}
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        {pageWindow(page, totalPages).map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-[12px] text-apix-faint">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onOffsetChange((p - 1) * limit)}
              aria-current={p === page ? "page" : undefined}
              className={
                p === page
                  ? "min-w-8 rounded-lg border border-apix-primary bg-apix-primary px-2 py-1 text-[12px] font-semibold text-white"
                  : btn
              }
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={btn}
          onClick={() => onOffsetChange(offset + limit)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
