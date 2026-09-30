import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useStore } from "./store";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export type Booking = {
  id: string;
  code: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string | null;
  tableNumber: number;
  /** "yyyy-MM-dd" */
  date: string;
  /** "HH:mm" */
  time: string;
  guests: number;
  note: string | null;
  status: BookingStatus;
  createdAt: string;
  user: { name: string; email: string };
};

export type BookingInput = Pick<Booking, "restaurantId" | "date" | "time" | "guests"> & { note?: string };

export type Slot = { time: string; available: boolean };

/** Which table is taken at which time on a day (public, no guest data). */
export type Occupancy = {
  date: string;
  times: string[];
  /** Slots that can't be booked any more: already started or outside the booking window. */
  closed: string[];
  tables: { id: string; number: number; capacity: number; isAvailable: boolean; booked: string[] }[];
};

/** Same limits as the API (backend/src/bookings/slots.ts). */
export const MAX_GUESTS = 12;
export const BOOKING_WINDOW_DAYS = 14;

const keys = {
  all: ["bookings"] as const,
  mine: (token: string | null) => ["bookings", "mine", token] as const,
  admin: ["bookings", "admin"] as const,
  availability: (restaurantId: string, date: string, guests: number) =>
    ["bookings", "availability", restaurantId, date, guests] as const,
  occupancy: (restaurantId: string, date: string) => ["bookings", "occupancy", restaurantId, date] as const,
};

export const isPast = (b: Pick<Booking, "date" | "time">) => new Date(`${b.date}T${b.time}`) < new Date();
export const isUpcoming = (b: Booking) => b.status === "CONFIRMED" && !isPast(b);

export const useMyBookings = () => {
  const token = useStore((s) => s.token);
  return useQuery({
    queryKey: keys.mine(token),
    queryFn: async () => (await api.get<Booking[]>("/bookings/my")).data,
    enabled: !!token,
  });
};

export const useAllBookings = () =>
  useQuery({
    queryKey: keys.admin,
    queryFn: async () => (await api.get<Booking[]>("/bookings")).data,
  });

export const useAvailability = (restaurantId: string, date: string, guests: number) =>
  useQuery({
    queryKey: keys.availability(restaurantId, date, guests),
    queryFn: async () =>
      (await api.get<Slot[]>("/bookings/availability", { params: { restaurantId, date, guests } })).data,
    // slots fill up while the page is open (pushed over the socket, see realtime.ts)
    staleTime: 0,
  });

export const useOccupancy = (restaurantId: string, date: string) =>
  useQuery({
    queryKey: keys.occupancy(restaurantId, date),
    queryFn: async () => (await api.get<Occupancy>("/bookings/occupancy", { params: { restaurantId, date } })).data,
    staleTime: 0,
    // switching days keeps the grid on screen instead of flashing a skeleton
    placeholderData: (previous) => previous,
  });

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BookingInput) => (await api.post<Booking>("/bookings", input)).data,
    // on success and on "no free tables" alike the slots have changed
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.patch<Booking>(`/bookings/${id}/cancel`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
};
