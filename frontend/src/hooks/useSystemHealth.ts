import { useQuery } from "@tanstack/react-query";
import { getSystemHealth } from "../api/endpoints";

// Deliberately shorter staleTime + a refetchInterval than the ~300s
// convention everywhere else -- this endpoint's whole purpose is reflecting
// near-live pipeline status, so it should feel closer to "live" than the
// index/methodology data, which changes far less often.
export function useSystemHealth() {
  return useQuery({
    queryKey: ["system", "health"],
    queryFn: getSystemHealth,
    staleTime: 60_000,
    refetchInterval: 30_000,
  });
}
