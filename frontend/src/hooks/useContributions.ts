import { useQuery } from "@tanstack/react-query";
import { getContributions } from "../api/endpoints";

export function useContributions() {
  return useQuery({
    queryKey: ["apix", "contributions"],
    queryFn: getContributions,
    staleTime: 300_000,
  });
}
