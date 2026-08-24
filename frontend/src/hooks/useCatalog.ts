import { useQuery } from "@tanstack/react-query";
import { getCatalog } from "../api/endpoints";

/** Filter options. Cached longer than page data — the shape of the dataset
 *  changes far less often than its values. */
export function useCatalog() {
  return useQuery({
    queryKey: ["apix", "catalog"],
    queryFn: getCatalog,
    staleTime: 600_000,
  });
}
