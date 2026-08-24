import type { SourceFreshness } from "../../types/apix";
import { EmptyState } from "../ui/EmptyState";
import { sourceLabel } from "../../utils/format";

interface SourceFreshnessTableProps {
  sources: SourceFreshness[];
  staleAfterHours?: number;
}

function hoursSince(iso: string | null): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

export function SourceFreshnessTable({ sources, staleAfterHours = 48 }: SourceFreshnessTableProps) {
  if (sources.length === 0) {
    return <EmptyState message="No source data yet -- freshness will appear once ingestion has run." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <caption className="sr-only">Per-source data freshness</caption>
        <thead>
          <tr className="border-b border-apix-border text-apix-muted">
            <th scope="col" className="py-2 pr-4 font-medium">Source</th>
            <th scope="col" className="py-2 pr-4 font-medium">Rows</th>
            <th scope="col" className="py-2 pr-4 font-medium">Latest travel date scraped</th>
            <th scope="col" className="py-2 font-medium">Freshness</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => {
            const age = hoursSince(s.latest_created_at);
            const stale = age === null || age > staleAfterHours;
            return (
              <tr key={s.source_name} className="border-b border-apix-border last:border-0">
                <td className="py-2.5 pr-4 font-medium text-apix-text">{sourceLabel(s.source_name)}</td>
                <td className="py-2.5 pr-4">{s.rows}</td>
                <td className="py-2.5 pr-4">{s.latest_date_scraped ?? "—"}</td>
                <td className="py-2.5">
                  <span
                    className={
                      stale
                        ? "inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700"
                        : "inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                    }
                  >
                    {stale ? "Stale" : "Fresh"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
