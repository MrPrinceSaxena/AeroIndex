import type { IngestionRunRecord } from "../../types/apix";
import { EmptyState } from "../ui/EmptyState";

interface IngestionRunsTableProps {
  runs: IngestionRunRecord[];
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function IngestionRunsTable({ runs }: IngestionRunsTableProps) {
  if (runs.length === 0) {
    return (
      <EmptyState message="No ingestion runs logged yet. Run `python -m src.ingestion.run_all` to populate this history." />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <caption className="sr-only">Recent ingestion pipeline runs</caption>
        <thead>
          <tr className="border-b border-apix-border text-apix-muted">
            <th scope="col" className="py-2 pr-4 font-medium">Step</th>
            <th scope="col" className="py-2 pr-4 font-medium">Started</th>
            <th scope="col" className="py-2 pr-4 font-medium">Records</th>
            <th scope="col" className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run, i) => (
            <tr key={`${run.run_id}-${run.step_name}-${i}`} className="border-b border-apix-border last:border-0 align-top">
              <td className="py-2.5 pr-4 font-medium text-apix-text">{run.step_name}</td>
              <td className="py-2.5 pr-4">{formatDateTime(run.started_at)}</td>
              <td className="py-2.5 pr-4">{run.records_ingested}</td>
              <td className="py-2.5">
                <span
                  className={
                    run.status === "success"
                      ? "inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                      : "inline-flex items-center rounded-md bg-red-50 dark:bg-red-950/40 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400"
                  }
                >
                  {run.status}
                </span>
                {run.status === "failed" && run.error_message && (
                  <p className="mt-1 max-w-xs text-xs text-apix-muted">{run.error_message}</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
