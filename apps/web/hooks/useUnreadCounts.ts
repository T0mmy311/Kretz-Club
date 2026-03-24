"use client";

import { trpc } from "@/lib/trpc/client";

export function useUnreadCounts() {
  const { data } = trpc.readStatus.getUnreadCounts.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const messagerieUnread = data
    ? data.reduce((sum, ch) => sum + ch.unreadCount, 0)
    : 0;

  return { messagerieUnread };
}
