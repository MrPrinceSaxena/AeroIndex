import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getRouteStats } from "../api/endpoints";
import type { RouteStatsFilters } from "../types/apix";

export function useRouteStats(filters: RouteStatsFilters) {
  return useQuery({
    queryKey: ["apix", "route-stats", filters],
    queryFn: () => getRouteStats(filters),
    staleTime: 300_000,
    placeholderData: keepPreviousData,
  });
}
