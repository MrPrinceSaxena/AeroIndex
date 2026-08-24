import { useQuery } from "@tanstack/react-query";
import { getDataQuality } from "../api/endpoints";

export function useDataQuality() {
  return useQuery({
    queryKey: ["apix", "data-quality"],
    queryFn: getDataQuality,
    staleTime: 300_000,
  });
}
