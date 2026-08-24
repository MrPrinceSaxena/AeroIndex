import { apiGet } from "./client";
import type {
  ApixResponse,
  HeatmapResponse,
  ElasticityResponse,
  SummaryResponse,
  Route,
} from "../types/apix";

export const getApix = () => apiGet<ApixResponse>("/apix");

export const getHeatmap = () => apiGet<HeatmapResponse>("/apix/heatmap");

export const getElasticity = (route: Route) =>
  apiGet<ElasticityResponse>("/apix/elasticity", { route });

export const getSummary = () => apiGet<SummaryResponse>("/apix/summary");

export const getHealth = () => apiGet<{ status: string; service: string; version: string }>("/health");
