import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getFareQuotes } from "../api/endpoints";
import type { QuotesFilters } from "../types/apix";

export function useQuotes(filters: QuotesFilters) {
  return useQuery({
    queryKey: ["apix", "quotes", filters],
    queryFn: () => getFareQuotes(filters),
    staleTime: 300_000,
    placeholderData: keepPreviousData,
  });
}
