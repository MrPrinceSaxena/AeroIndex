import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ShieldCheck, X, ArrowRight } from "lucide-react";
import { useSystemHealth } from "../../hooks/useSystemHealth";

export function TelemetryAlertBanner() {
  const [dismissed, setDismissed] = useState(false);
  const health = useSystemHealth();

  if (dismissed) return null;

  const status = health.data?.overall_status;
  const isHealthy = status === "healthy";

  return (
    <div
      role="region"
      aria-label="System telemetry alert"
      className="relative mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-apix-border bg-apix-surface-alt/80 px-4 py-2.5 backdrop-blur-sm transition-all"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            isHealthy
              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
          }`}
        >
          {isHealthy ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        </div>
        <div className="min-w-0 text-xs text-apix-text">
          <span className="font-semibold text-apix-text">
            {isHealthy ? "Sovereign Ingestion Active" : "Telemetry Advisory"}:
          </span>{" "}
          <span className="text-apix-muted">
            {isHealthy
              ? "Multi-source airline direct scrapers operational. All fare quotes strictly quarantined and verified."
              : "Scraper connector synchronization in progress. Synthetic gap-filler maintaining series continuity."}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          to="/health"
          className="inline-flex items-center gap-1 text-xs font-semibold text-apix-primary hover:text-apix-primary/80 transition-colors"
        >
          <span>View Telemetry</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-md p-1 text-apix-muted hover:bg-apix-surface hover:text-apix-text transition-colors"
          title="Dismiss advisory"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
