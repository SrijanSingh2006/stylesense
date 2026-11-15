import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
export function useAuthPolicy() {
  return useQuery({
    queryKey: ["auth-policy"],
    queryFn: async () =>
      (await api.get("/auth/policy", { _skipAuthRefresh: true, _quiet: true }))
        .data,
    staleTime: 60000,
    retry: false,
  });
}
