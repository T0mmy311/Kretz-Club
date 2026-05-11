"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";

export function useUnreadCounts() {
  const utils = trpc.useUtils();
  const { data } = trpc.readStatus.getUnreadCounts.useQuery(undefined, {
    refetchInterval: 15_000, // poll every 15s
    staleTime: 0, // always fresh
    refetchOnWindowFocus: true, // refetch when tab regains focus
  });

  // Listen to realtime INSERT events on messages — invalidate counts immediately
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("unread-counts-global")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          // A new message anywhere → refresh unread counts + channel list
          utils.readStatus.getUnreadCounts.invalidate();
          utils.channel.list.invalidate();
          utils.conversation.list.invalidate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [utils]);

  const messagerieUnread = data
    ? data.reduce((sum, ch) => sum + ch.unreadCount, 0)
    : 0;

  return { messagerieUnread };
}
