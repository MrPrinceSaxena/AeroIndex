export function formatFare(value: number): string {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatIndex(value: number): string {
  return value.toFixed(1);
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

export function routeLabel(route: string): string {
  const [from, to] = route.split("-");
  const cityNames: Record<string, string> = {
    DEL: "Delhi",
    BOM: "Mumbai",
    BLR: "Bengaluru",
  };
  return `${cityNames[from] ?? from} → ${cityNames[to] ?? to}`;
}

export function sourceLabel(sourceName: string): string {
  const labels: Record<string, string> = {
    air_india_direct: "Air India (direct)",
    indigo_direct: "IndiGo (direct)",
    synthetic_estimate: "Estimated (synthetic)",
  };
  return labels[sourceName] ?? sourceName;
}
