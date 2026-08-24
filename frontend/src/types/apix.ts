// TypeScript mirrors of every Pydantic response model in src/api/main.py.
// Keep these in sync with the backend by hand -- there are only a handful
// of endpoints, so a codegen step would be more ceremony than value here.

export interface RouteWeight {
  route: string;
  weight: number;
  pax_millions_fy2223: number;
  source: string;
}

export interface CrossSourceStat {
  route: string;
  advance_purchase_days: number;
  mean_pct_diff: number;
  max_pct_diff: number;
  n_comparisons: number;
}

export interface Methodology {
  index_formula: string;
  chain_linking: string;
  route_weights: RouteWeight[];
  data_sources: string[];
  cross_source_validation: CrossSourceStat[];
  weights_data_source: string;
}

export interface IndexPoint {
  date: string;
  apix_value: number;
  is_estimated: boolean;
}

export interface WeeklyPoint {
  week: string;
  apix_value: number;
  is_estimated: boolean;
}

export interface DataCoverage {
  n_real: number;
  n_synthetic: number;
}

export interface ApixResponse {
  latest_value: number;
  latest_date: string;
  base_value: number;
  base_date: string;
  daily_series: IndexPoint[];
  weekly_series: WeeklyPoint[];
  methodology: Methodology;
  data_coverage: DataCoverage;
  generated_at: string;
}

export interface HeatmapCell {
  route: string;
  advance_purchase_days: number;
  median_fare: number;
}

export interface HeatmapResponse {
  cells: HeatmapCell[];
  generated_at: string;
}

export type Route = "DEL-BOM" | "DEL-BLR" | "BOM-BLR";

export const ROUTES: Route[] = ["DEL-BOM", "DEL-BLR", "BOM-BLR"];

export interface ElasticityPoint {
  advance_purchase_days: number;
  source_name: string;
  median_fare: number;
}

export interface ElasticityResponse {
  route: Route;
  points: ElasticityPoint[];
  generated_at: string;
}

export interface SummaryResponse {
  summary: string;
  has_sufficient_data: boolean;
  generated_at: string;
}

// ─── Route Analytics ────────────────────────────────────────────────────

export interface RouteHistoryPoint {
  date: string;
  median_fare: number;
  is_estimated: boolean;
}

export interface RouteHistoryResponse {
  route: Route;
  points: RouteHistoryPoint[];
  generated_at: string;
}

export interface RouteContribution {
  route: string;
  weight: number;
  fare_previous: number | null;
  fare_latest: number | null;
  log_return: number | null;
  contribution: number | null;
}

export interface RouteContributionsResponse {
  has_sufficient_data: boolean;
  from_date: string | null;
  to_date: string | null;
  total_log_change: number;
  contributions: RouteContribution[];
  generated_at: string;
}

// ─── Data Quality ───────────────────────────────────────────────────────

export interface OutlierGroupStat {
  route: string;
  advance_purchase_days: number;
  n_outliers: number;
  n_total: number;
  pct_outliers: number;
}

export interface SourceRowCount {
  source_name: string;
  n_rows: number;
}

export interface DataQualityResponse {
  total_rows: number;
  sold_out_pct: number;
  duplicate_rows: number;
  outlier_pct: number;
  outliers_by_group: OutlierGroupStat[];
  component_mismatch_pct: number;
  rows_per_source: SourceRowCount[];
  cross_source_validation: CrossSourceStat[];
  /** IDs flagged as outliers by the real cleaning pipeline. */
  outlier_ids: string[];
  expected_cells: number;
  covered_cells: number;
  completeness_pct: number;
  generated_at: string;
}

// ─── DGCA Benchmarking ──────────────────────────────────────────────────

export interface BacktestComparisonRow {
  month: string;
  route: string;
  apix_avg: number;
  dgca_avg_fare: number;
  deviation_pct: number;
  deviation_flagged: boolean;
}

export interface DgcaReferenceRow {
  month: string;
  route: string;
  dgca_avg_fare: number;
}

export interface BacktestResponse {
  has_overlap: boolean;
  comparisons: BacktestComparisonRow[];
  reference_data: DgcaReferenceRow[];
  reference_period: string;
  live_data_period: string | null;
  deviation_threshold_pct: number;
  generated_at: string;
}

// ─── Data Explorer ──────────────────────────────────────────────────────

export interface FareQuoteRow {
  id: string;
  route: string;
  carrier: string | null;
  date_scraped: string;
  travel_date: string;
  advance_purchase_days: number;
  fare_class: string | null;
  base_fare: number | null;
  taxes: number | null;
  total_fare: number;
  source_name: string;
  is_sold_out: boolean;
}

export interface FareQuotesResponse {
  rows: FareQuoteRow[];
  total_count: number;
  limit: number;
  offset: number;
  generated_at: string;
}

export interface QuotesFilters {
  route?: Route;
  source_name?: string;
  advance_purchase_days?: number;
  date_from?: string;
  date_to?: string;
  include_sold_out?: boolean;
  limit?: number;
  offset?: number;
}

// ─── System Health ──────────────────────────────────────────────────────

export interface IngestionRunRecord {
  run_id: string;
  step_name: string;
  started_at: string;
  finished_at: string | null;
  status: "success" | "failed";
  records_ingested: number;
  error_message: string | null;
}

export interface SourceFreshness {
  source_name: string;
  latest_date_scraped: string | null;
  latest_created_at: string | null;
  rows: number;
}

export interface TableRowCounts {
  fare_quotes: number;
  cross_source_check: number;
  ingestion_runs: number;
}

export type OverallStatus = "healthy" | "degraded" | "down";

export interface SystemHealthResponse {
  db_connectivity: "ok" | "error";
  overall_status: OverallStatus;
  row_counts: TableRowCounts;
  recent_runs: IngestionRunRecord[];
  source_freshness: SourceFreshness[];
  generated_at: string;
}

// ─── Catalog (drives every filter dropdown) ─────────────────────────────

export interface CatalogResponse {
  routes: string[];
  airlines: string[];
  sources: string[];
  advance_purchase_windows: number[];
  date_min: string | null;
  date_max: string | null;
  generated_at: string;
}

// ─── Overview ───────────────────────────────────────────────────────────

export interface WindowIndex {
  advance_purchase_days: number;
  latest_value: number;
  change_pct: number | null;
  is_estimated: boolean;
  n_points: number;
}

export interface TopMover {
  route: string;
  pct_change: number;
  fare_previous: number;
  fare_latest: number;
}

export interface OverviewResponse {
  latest_value: number | null;
  latest_date: string | null;
  base_date: string | null;
  change_pct: number | null;
  routes_monitored: number;
  airlines_monitored: number;
  total_quotes: number;
  real_quotes: number;
  synthetic_quotes: number;
  index_by_window: WindowIndex[];
  top_movers: TopMover[];
  generated_at: string;
}

// ─── Route stats ────────────────────────────────────────────────────────

export interface FareBucket {
  bucket_start: number;
  bucket_end: number;
  count: number;
}

export interface AirlineStat {
  carrier: string;
  avg_fare: number;
  min_fare: number;
  max_fare: number;
  n_fares: number;
}

export interface RouteStatsFilters {
  route?: string;
  airline?: string;
  advance_purchase_days?: number;
  date_from?: string;
  date_to?: string;
}

export interface RouteStatsResponse {
  filters_applied: Record<string, string | number | null>;
  avg_fare: number | null;
  min_fare: number | null;
  max_fare: number | null;
  median_fare: number | null;
  n_fares: number;
  distribution: FareBucket[];
  airlines: AirlineStat[];
  generated_at: string;
}
