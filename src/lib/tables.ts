import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

export type Table = {
  id: string;
  number: number;
  capacity: number;
  /** Switched off tables are skipped when seating new bookings. */
  isAvailable: boolean;
  upcomingBookings: number;
};

const key = (restaurantId: string) => ["tables", restaurantId] as const;

export const useTables = (restaurantId: string) =>
  useQuery({
    queryKey: key(restaurantId),
    queryFn: async () => (await api.get<Table[]>(`/restaurants/${restaurantId}/tables`)).data,
  });

/** Table changes also change the restaurant's table count and free slots. */
const useTableMutation = <T>(restaurantId: string, fn: (input: T) => Promise<unknown>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: key(restaurantId) }),
        queryClient.invalidateQueries({ queryKey: ["restaurants"] }),
        queryClient.invalidateQueries({ queryKey: ["bookings", "availability"] }),
      ]),
  });
};

export const useAddTable = (restaurantId: string) =>
  useTableMutation(restaurantId, (capacity: number) => api.post(`/restaurants/${restaurantId}/tables`, { capacity }));

export const useUpdateTable = (restaurantId: string) =>
  useTableMutation(restaurantId, ({ id, ...data }: Pick<Table, "id"> & Partial<Pick<Table, "capacity" | "isAvailable">>) =>
    api.patch(`/restaurants/${restaurantId}/tables/${id}`, data),
  );

export const useDeleteTable = (restaurantId: string) =>
  useTableMutation(restaurantId, (id: string) => api.delete(`/restaurants/${restaurantId}/tables/${id}`));
