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
