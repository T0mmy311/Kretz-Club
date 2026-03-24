import "../global.css";
import { useEffect, useState } from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { AuthProvider } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${API_URL}/api/trpc`,
          transformer: superjson,
          async headers() {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            const token = session?.access_token;
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SafeAreaProvider>
            <Slot />
            <StatusBar style="dark" />
          </SafeAreaProvider>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
