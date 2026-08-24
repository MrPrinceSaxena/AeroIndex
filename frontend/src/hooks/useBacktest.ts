import { useQuery } from "@tanstack/react-query";
import { getBacktest } from "../api/endpoints";

export function useBacktest() {
  return useQuery({
    queryKey: ["apix", "backtest"],
    queryFn: getBacktest,
    staleTime: 300_000,
  });
}
