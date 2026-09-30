import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "./api";

export type Restaurant = {
  id: string;
  name: string;
  description: string | null;
  /** English address shown in the UI. */
  address: string;
  /** Russian address for 2GIS search, which doesn't match English street names. */
  gisAddress: string | null;
  image: string | null;
  images: string[];
  cuisine: string | null;
  priceMin: number | null;
  priceMax: number | null;
  tags: string[];
  workTime: string | null;
  phone: string | null;
  email: string | null;
  gisLink: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Computed by the API: a table for two is still free at some slot later today. */
  availableToday: boolean;
  /** Seats at the biggest table in use; 0 when there are none. */
  maxSeats: number;
  tablesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type RestaurantInput = Omit<Restaurant, "id" | "tablesCount" | "availableToday" | "maxSeats" | "createdAt" | "updatedAt" | "images">;

type Page<T> = { data: T[]; total: number; page: number; limit: number };

const keys = {
  all: ["restaurants"] as const,
  one: (id: string) => ["restaurants", id] as const,
};

// The catalog is small, so the list is loaded in one request and filtered on the client.
export const useRestaurants = () =>
  useQuery({
    queryKey: keys.all,
    queryFn: async () => (await api.get<Page<Restaurant>>("/restaurants", { params: { limit: 100 } })).data.data,
  });

export const useRestaurant = (id: string | undefined) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: keys.one(id ?? ""),
    queryFn: async () => (await api.get<Restaurant>(`/restaurants/${id}`)).data,
    enabled: !!id,
    // show the card instantly if the list is already loaded
    initialData: () => queryClient.getQueryData<Restaurant[]>(keys.all)?.find((r) => r.id === id),
  });
};

export const useSaveRestaurant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: RestaurantInput }) =>
      (id ? await api.patch<Restaurant>(`/restaurants/${id}`, data) : await api.post<Restaurant>("/restaurants", data)).data,
    onSuccess: (restaurant) => {
      queryClient.setQueryData(keys.one(restaurant.id), restaurant);
      return queryClient.invalidateQueries({ queryKey: keys.all, exact: true });
    },
  });
};

export const useDeleteRestaurant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/restaurants/${id}`),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Restaurant[]>(keys.all, (list) => list?.filter((r) => r.id !== id));
      queryClient.removeQueries({ queryKey: keys.one(id) });
    },
  });
};

/** Human-readable message from a NestJS error response. */
export const errorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
    if (!error.response) return "Server is unavailable";
  }
  return "Something went wrong";
};

export const hasLocation = (r: Restaurant): r is Restaurant & { latitude: number; longitude: number } =>
  r.latitude != null && r.longitude != null;

/**
 * 2GIS search only matches addresses written in Russian (gisAddress), and the same street + number
 * exists in several districts. `m=lng,lat/zoom` centers the map on the pin, which
 * scopes the search to that spot so the right building comes first.
 */
export const gisUrl = (r: Restaurant): string => {
  if (r.gisLink) return r.gisLink;
  const url = `https://2gis.kg/bishkek/search/${encodeURIComponent(r.gisAddress ?? r.address)}`;
  return hasLocation(r) ? `${url}?m=${r.longitude}%2C${r.latitude}%2F17` : url;
};
