import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { OverallStatus } from "../../types/apix";

interface HealthStatusBannerProps {
  status: OverallStatus;
  dbConnectivity: "ok" | "error";
}

const CONFIG: Record<OverallStatus, { label: string; bg: string; text: string; Icon: typeof CheckCircle2 }> = {
  healthy: { label: "Healthy", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", Icon: CheckCircle2 },
  degraded: { label: "Degraded", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", Icon: AlertTriangle },
  down: { label: "Down", bg: "bg-red-50 border-red-200", text: "text-red-700", Icon: XCircle },
};

export function HealthStatusBanner({ status, dbConnectivity }: HealthStatusBannerProps) {
  const { label, bg, text, Icon } = CONFIG[status];

  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-5 ${bg}`}>
      <Icon className={`h-6 w-6 shrink-0 ${text}`} aria-hidden="true" />
      <div>
        <p className={`text-lg font-bold ${text}`}>{label}</p>
        <p className="text-sm text-apix-muted">
          Database connectivity: {dbConnectivity === "ok" ? "connected" : "unreachable"}
        </p>
      </div>
    </div>
  );
}
