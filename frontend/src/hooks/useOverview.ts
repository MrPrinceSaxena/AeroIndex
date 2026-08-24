import { useQuery } from "@tanstack/react-query";
import { getOverview } from "../api/endpoints";

export function useOverview() {
  return useQuery({
    queryKey: ["apix", "overview"],
    queryFn: getOverview,
    staleTime: 300_000,
  });
}
