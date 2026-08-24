/**
 * Single source of truth for chart colours and axis styling, kept in sync
 * with the @theme tokens in index.css. Recharts needs literal values (it
 * cannot read CSS custom properties), so they are mirrored here rather than
 * duplicated ad hoc in each chart file.
 */

export const CHART = {
  real: "#2563eb",
  realSecondary: "#60a5fa",
  estimated: "#f59e0b",
  grid: "#eef2f7",
  axis: "#e5eaf1",
  tick: "#64748b",
  reference: "#94a3b8",
  up: "#dc2626",
  down: "#16a34a",
} as const;

/** Categorical palette for multi-series charts (per-window, per-airline…). */
export const SERIES_COLORS = ["#2563eb", "#16a34a", "#d946ef", "#f59e0b", "#0891b2"] as const;

/** Fixed colour per data source so a source keeps its identity across pages. */
export const SOURCE_COLORS: Record<string, string> = {
  air_india_direct: "#2563eb",
  indigo_direct: "#0891b2",
  synthetic_estimate: "#f59e0b",
};

export const axisTick = { fontSize: 11, fill: CHART.tick } as const;
export const axisLine = { stroke: CHART.axis } as const;

export const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #e5eaf1",
  fontSize: 12,
  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.08)",
} as const;

export const legendStyle = { fontSize: 11 } as const;
