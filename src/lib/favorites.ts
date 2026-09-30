import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useStore } from "./store";

const key = (token: string | null) => ["favorites", token] as const;

/** Ids of the signed-in user's favorite restaurants (empty for guests). */
export const useFavorites = () => {
  const token = useStore((s) => s.token);
  const query = useQuery({
    queryKey: key(token),
    queryFn: async () => (await api.get<string[]>("/favorites")).data,
    enabled: !!token,
  });
  return token ? (query.data ?? []) : [];
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const token = useStore((s) => s.token);

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? api.delete(`/favorites/${id}`) : api.put(`/favorites/${id}`),
    // flip the heart right away and roll back if the request fails
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: key(token) });
      const previous = queryClient.getQueryData<string[]>(key(token));
      queryClient.setQueryData<string[]>(key(token), (ids = []) =>
        active ? ids.filter((x) => x !== id) : [id, ...ids],
      );
      return { previous };
    },
    onError: (_, __, context) => queryClient.setQueryData(key(token), context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key(token) }),
  });
};
