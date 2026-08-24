import { useQuery } from "@tanstack/react-query";
import { getElasticity } from "../api/endpoints";
import type { Route } from "../types/apix";

export function useElasticity(route: Route) {
  return useQuery({
    queryKey: ["apix", "elasticity", route],
    queryFn: () => getElasticity(route),
    staleTime: 300_000,
  });
}
