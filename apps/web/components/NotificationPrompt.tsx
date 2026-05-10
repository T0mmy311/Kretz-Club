"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

const DISMISS_KEY = "kretz-notif-dismissed";

export default function NotificationPrompt() {
  const { permission, request } = useNotifications();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    setVisible(permission === "default");
  }, [permission]);

  const handleEnable = async () => {
    const result = await request();
    if (result !== "default") {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(DISMISS_KEY, "1");
    }
  };

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-[13px] text-foreground/80">
          Activer les notifications pour ne rater aucun message ?
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={handleEnable}
          className="rounded-md bg-muted px-3 py-1 text-[12px] font-medium text-foreground/90 transition-colors hover:bg-accent"
        >
          Activer
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Fermer"
          className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted/50 hover:text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
