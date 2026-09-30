"use client";

import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Header from "@/components/layout/header/Header";
import AuthDialog from "@/components/shared/AuthDialog";
import { RealtimeSync } from "@/lib/realtime";
import { useStore } from "@/lib/store";

type ChildrenProps = {
  children: React.ReactNode;
};

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
      },
    },
  });

const Layout = ({ children }: ChildrenProps) => {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeSync />
      <div className="layout">
        <Header />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
      </div>
      <AuthDialog />
    </QueryClientProvider>
  );
};

export default Layout;
