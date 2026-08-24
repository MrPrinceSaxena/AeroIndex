import { useQuery } from "@tanstack/react-query";
import { getRouteHistory } from "../api/endpoints";
import type { Route } from "../types/apix";

export function useRouteHistory(route: Route) {
  return useQuery({
    queryKey: ["apix", "route-history", route],
    queryFn: () => getRouteHistory(route),
    staleTime: 300_000,
  });
}
