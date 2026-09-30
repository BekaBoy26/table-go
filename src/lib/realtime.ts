"use client";

import { useEffect, useSyncExternalStore } from "react";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { API_URL } from "./api";

/** Sent by the API whenever free tables change: a booking made or cancelled, tables edited. */
type AvailabilityEvent = { restaurantId: string; date: string | null };

let socket: Socket | null = null;

// one connection per tab, opened on first use (never during SSR)
const getSocket = () => (socket ??= io(API_URL, { transports: ["websocket"] }));

/** Slots, the table grid, "my bookings" and the "available today" badges. */
const refresh = (queryClient: QueryClient, restaurantId?: string) => {
  queryClient.invalidateQueries({ queryKey: ["bookings"] });
  queryClient.invalidateQueries({ queryKey: ["restaurants"] });
  queryClient.invalidateQueries({ queryKey: restaurantId ? ["tables", restaurantId] : ["tables"] });
};

/** Keeps cached availability in sync with the server; mount once inside the QueryClientProvider. */
export const RealtimeSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const s = getSocket();
    let wasConnected = s.connected;

    const onChange = ({ restaurantId }: AvailabilityEvent) => refresh(queryClient, restaurantId);
    // events sent while the connection was down are lost, so reload once it's back
    const onConnect = () => {
      if (wasConnected) refresh(queryClient);
      wasConnected = true;
    };

    s.on("availability", onChange);
    s.on("connect", onConnect);
    return () => {
      s.off("availability", onChange);
      s.off("connect", onConnect);
    };
  }, [queryClient]);

  return null;
};

const subscribeStatus = (onChange: () => void) => {
  const s = getSocket();
  s.on("connect", onChange);
  s.on("disconnect", onChange);
  return () => {
    s.off("connect", onChange);
    s.off("disconnect", onChange);
  };
};

/** Whether live updates are flowing right now. */
export const useLive = () =>
  useSyncExternalStore(
    subscribeStatus,
    () => getSocket().connected,
    () => false,
  );
