import { ROUTES, type QuotesFilters, type Route } from "../../types/apix";
import { routeLabel } from "../../utils/format";

interface FilterBarProps {
  filters: QuotesFilters;
  onChange: (next: QuotesFilters) => void;
}

const SOURCES = ["air_india_direct", "indigo_direct", "synthetic_estimate"];

const selectClasses =
  "w-full rounded-lg border border-apix-border bg-apix-surface px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-apix-real";

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const update = (patch: Partial<QuotesFilters>) => onChange({ ...filters, ...patch, offset: 0 });

  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-apix-border bg-apix-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-apix-muted">Route</span>
        <select
          className={selectClasses}
          value={filters.route ?? ""}
          onChange={(e) => update({ route: (e.target.value || undefined) as Route | undefined })}
        >
          <option value="">All routes</option>
          {ROUTES.map((r) => (
            <option key={r} value={r}>
              {routeLabel(r)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-apix-muted">Source</span>
        <select
          className={selectClasses}
          value={filters.source_name ?? ""}
          onChange={(e) => update({ source_name: e.target.value || undefined })}
        >
          <option value="">All sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-apix-muted">Advance window</span>
        <select
          className={selectClasses}
          value={filters.advance_purchase_days ?? ""}
          onChange={(e) => update({ advance_purchase_days: e.target.value ? Number(e.target.value) : undefined })}
        >
          <option value="">Both</option>
          <option value="7">T-7 days</option>
          <option value="30">T-30 days</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-apix-muted">Travel date from</span>
        <input
          type="date"
          className={selectClasses}
          value={filters.date_from ?? ""}
          onChange={(e) => update({ date_from: e.target.value || undefined })}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-apix-muted">Travel date to</span>
        <input
          type="date"
          className={selectClasses}
          value={filters.date_to ?? ""}
          onChange={(e) => update({ date_to: e.target.value || undefined })}
        />
      </label>

      <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-5">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-apix-border text-apix-real focus-visible:ring-2 focus-visible:ring-apix-real"
          checked={filters.include_sold_out ?? true}
          onChange={(e) => update({ include_sold_out: e.target.checked })}
        />
        <span className="text-apix-muted">Include sold-out quotes</span>
      </label>
    </div>
  );
}
