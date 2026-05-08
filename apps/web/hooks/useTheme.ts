"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc/client";

type Theme = "dark" | "light";

const STORAGE_KEY = "kretz-theme";

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  if (t === "light") {
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");
  const hasSyncedFromServer = useRef(false);

  // Server-side persistence: read user's saved theme from tRPC
  const { data: meData } = trpc.member.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const setThemeMutation = trpc.member.setTheme.useMutation();

  // Initial load: prefer localStorage for instant render (no flash)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored === "light" ? "light" : "dark";
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  // Once server data lands, sync from server (so login on another device respects user's preference).
  useEffect(() => {
    if (hasSyncedFromServer.current) return;
    const serverTheme = (meData as any)?.theme as Theme | null | undefined;
    if (serverTheme === "dark" || serverTheme === "light") {
      hasSyncedFromServer.current = true;
      setThemeState(serverTheme);
      localStorage.setItem(STORAGE_KEY, serverTheme);
      applyTheme(serverTheme);
    }
  }, [meData]);

  const persist = useCallback(
    (t: Theme) => {
      localStorage.setItem(STORAGE_KEY, t);
      applyTheme(t);
      // Fire-and-forget server-side persist; failure is OK (offline, etc.)
      try {
        setThemeMutation.mutate({ theme: t });
      } catch {
        // ignore
      }
    },
    [setThemeMutation]
  );

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      persist(t);
    },
    [persist]
  );

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      persist(next);
      return next;
    });
  }, [persist]);

  return { theme, toggleTheme, setTheme };
}
