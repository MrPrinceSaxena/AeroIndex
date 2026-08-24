import { useQuery } from "@tanstack/react-query";
import { getSummary } from "../api/endpoints";

export function useSummary() {
  return useQuery({
    queryKey: ["apix", "summary"],
    queryFn: getSummary,
    staleTime: 300_000,
  });
}
