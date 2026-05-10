"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { trpc } from "./client";

export function TRPCProvider({ children }: { children: any }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Avoid refetching on every navigation: data is fresh for 1 min
            staleTime: 60_000,
            // Keep data in cache for 5 min after last observer unmounts
            gcTime: 300_000,
            // Don't refetch when the tab regains focus (very disruptive UX)
            refetchOnWindowFocus: false,
            // Don't refetch when the network reconnects (often a no-op anyway)
            refetchOnReconnect: false,
            // Limit retries for snappier failure feedback
            retry: 1,
          },
        },
      })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
