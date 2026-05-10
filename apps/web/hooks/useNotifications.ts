"use client";

import { useEffect, useState, useCallback } from "react";

type NotifyOptions = NotificationOptions & { sound?: boolean };

/**
 * Hook for browser notifications + an optional discreet "ding" sound.
 *
 * Behavior:
 * - `permission` reflects the current Notification.permission value.
 * - `request()` prompts the user for permission (returns the resulting state).
 * - `notify()` only fires when the page is NOT focused, and only if permission
 *   has been granted. By default it also plays /sounds/notification.mp3 at low
 *   volume; pass { sound: false } to suppress the sound.
 */
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const request = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied";
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const notify = useCallback(
    (title: string, options?: NotifyOptions) => {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;
      // Don't notify if the user is actively looking at the tab.
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible" &&
        document.hasFocus()
      ) {
        return;
      }

      let notif: Notification | undefined;
      try {
        notif = new Notification(title, {
          icon: "/logo-kretz-club.svg",
          badge: "/logo-kretz-club.svg",
          ...options,
        });
      } catch {
        // Some browsers throw if Notification is constructed in the wrong
        // context (e.g. on mobile where ServiceWorkerRegistration is required).
        return;
      }

      if (options?.sound !== false) {
        try {
          const audio = new Audio("/sounds/notification.mp3");
          audio.volume = 0.4;
          audio.play().catch(() => {
            /* autoplay or invalid file - silently ignore */
          });
        } catch {
          /* ignore */
        }
      }

      return notif;
    },
    []
  );

  return { permission, request, notify };
}
