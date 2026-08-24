import { apiGet } from "./client";
import type {
  ApixResponse,
  HeatmapResponse,
  ElasticityResponse,
  SummaryResponse,
  Route,
  RouteHistoryResponse,
  RouteContributionsResponse,
  DataQualityResponse,
  BacktestResponse,
  FareQuotesResponse,
  QuotesFilters,
  SystemHealthResponse,
  CatalogResponse,
  OverviewResponse,
  RouteStatsResponse,
  RouteStatsFilters,
} from "../types/apix";

export const getApix = () => apiGet<ApixResponse>("/apix");

export const getHeatmap = () => apiGet<HeatmapResponse>("/apix/heatmap");

export const getElasticity = (route: Route) =>
  apiGet<ElasticityResponse>("/apix/elasticity", { route });

export const getSummary = () => apiGet<SummaryResponse>("/apix/summary");

export const getHealth = () => apiGet<{ status: string; service: string; version: string }>("/health");

export const getRouteHistory = (route: Route) =>
  apiGet<RouteHistoryResponse>("/apix/route-history", { route });

export const getContributions = () => apiGet<RouteContributionsResponse>("/apix/contributions");

export const getDataQuality = () => apiGet<DataQualityResponse>("/apix/data-quality");

export const getBacktest = () => apiGet<BacktestResponse>("/apix/backtest");

export const getFareQuotes = (filters: QuotesFilters) => {
  const params: Record<string, string> = {};
  if (filters.route) params.route = filters.route;
  if (filters.source_name) params.source_name = filters.source_name;
  if (filters.advance_purchase_days !== undefined) params.advance_purchase_days = String(filters.advance_purchase_days);
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.include_sold_out !== undefined) params.include_sold_out = String(filters.include_sold_out);
  params.limit = String(filters.limit ?? 50);
  params.offset = String(filters.offset ?? 0);
  return apiGet<FareQuotesResponse>("/apix/quotes", params);
};

export const getSystemHealth = () => apiGet<SystemHealthResponse>("/system/health");

export const getCatalog = () => apiGet<CatalogResponse>("/apix/catalog");

export const getOverview = () => apiGet<OverviewResponse>("/apix/overview");

export const getRouteStats = (filters: RouteStatsFilters) => {
  const params: Record<string, string> = {};
  if (filters.route) params.route = filters.route;
  if (filters.airline) params.airline = filters.airline;
  if (filters.advance_purchase_days !== undefined)
    params.advance_purchase_days = String(filters.advance_purchase_days);
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  return apiGet<RouteStatsResponse>("/apix/route-stats", params);
};
