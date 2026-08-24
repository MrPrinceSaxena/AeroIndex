export function formatFare(value: number): string {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatFareCompact(value: number): string {
  if (value >= 1000) return `₹${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  return `₹${Math.round(value)}`;
}

export function formatIndex(value: number): string {
  return value.toFixed(1);
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-IN");
}

export function formatPercent(value: number, signed = false): string {
  const formatted = Math.abs(value).toFixed(1);
  return signed ? `${value >= 0 ? "+" : "-"}${formatted}%` : `${formatted}%`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "3 mins ago" / "2 hrs ago" / "5 days ago" — used for data-freshness signals. */
export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/** Duration between two ISO timestamps, e.g. "2m 12s" — for ingestion run rows. */
export function formatDuration(startIso: string, endIso: string | null): string {
  if (!endIso) return "—";
  const secs = Math.max(0, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const CITY_NAMES: Record<string, string> = {
  DEL: "Delhi",
  BOM: "Mumbai",
  BLR: "Bengaluru",
};

/** "Delhi → Mumbai" — full form, for headings and single-value contexts. */
export function routeLabel(route: string): string {
  const [from, to] = route.split("-");
  return `${CITY_NAMES[from] ?? from} → ${CITY_NAMES[to] ?? to}`;
}

/** "DEL → BOM" — compact form, for dense tables, chart axes and filter chips. */
export function routeCode(route: string): string {
  const [from, to] = route.split("-");
  return `${from} → ${to}`;
}

export function sourceLabel(sourceName: string): string {
  const labels: Record<string, string> = {
    air_india_direct: "Air India (direct)",
    indigo_direct: "IndiGo (direct)",
    synthetic_estimate: "Estimated (synthetic)",
  };
  return labels[sourceName] ?? sourceName;
}

/** True for any source that is not real scraped data. */
export function isSynthetic(sourceName: string): boolean {
  return sourceName === "synthetic_estimate";
}

export function windowLabel(days: number): string {
  return `${days} days`;
}
