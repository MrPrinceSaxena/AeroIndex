import { useQuery } from "@tanstack/react-query";
import { getApix } from "../api/endpoints";

// staleTime ~300s mirrors the old Streamlit @st.cache_data(ttl=300) behavior.
export function useApix() {
  return useQuery({
    queryKey: ["apix"],
    queryFn: getApix,
    staleTime: 300_000,
  });
}
