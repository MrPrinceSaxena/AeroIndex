import { useQuery } from "@tanstack/react-query";
import { getHeatmap } from "../api/endpoints";

export function useHeatmap() {
  return useQuery({
    queryKey: ["apix", "heatmap"],
    queryFn: getHeatmap,
    staleTime: 300_000,
  });
}
