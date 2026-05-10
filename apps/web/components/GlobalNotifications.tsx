"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";

type MessageRow = {
  id: string;
  channel_id: string | null;
  conversation_id: string | null;
  author_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
};

function truncate(text: string, max = 100) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

/**
 * Global, always-mounted realtime listener that surfaces a browser
 * notification (+ a discreet sound) when a new message arrives in any
 * channel/DM the user belongs to, as long as:
 *   - the message is not authored by the current user
 *   - the user is NOT currently viewing that channel/conversation
 *   - the tab is not focused (the underlying useNotifications hook gates this)
 */
export default function GlobalNotifications() {
  const pathname = usePathname();
  const router = useRouter();
  const { notify } = useNotifications();

  const { data: meData } = trpc.member.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const myId = (meData as any)?.id as string | undefined;

  const { data: channelsByCategory } = trpc.channel.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const { data: conversations } = trpc.conversation.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const { data: membersData } = trpc.member.list.useQuery(
    { limit: 100 },
    { refetchOnWindowFocus: false }
  );

  // Build lookup maps once per data refresh.
  const channelMap = useMemo(() => {
    const map = new Map<string, { id: string; displayName: string; isMember: boolean }>();
    if (!channelsByCategory) return map;
    for (const list of Object.values(channelsByCategory)) {
      for (const ch of list as any[]) {
        map.set(ch.id, {
          id: ch.id,
          displayName: ch.displayName,
          isMember: ch.isMember,
        });
      }
    }
    return map;
  }, [channelsByCategory]);

  const conversationMap = useMemo(() => {
    const map = new Map<string, { id: string; otherName: string }>();
    if (!conversations) return map;
    for (const conv of conversations as any[]) {
      const other = conv.otherParticipants?.[0];
      const otherName = other
        ? `${other.firstName ?? ""} ${other.lastName ?? ""}`.trim() || "Membre"
        : "Conversation";
      map.set(conv.id, { id: conv.id, otherName });
    }
    return map;
  }, [conversations]);

  const memberMap = useMemo(() => {
    const map = new Map<string, { firstName: string; lastName: string }>();
    if (!membersData?.items) return map;
    for (const m of membersData.items as any[]) {
      map.set(m.id, { firstName: m.firstName, lastName: m.lastName });
    }
    return map;
  }, [membersData]);

  // Keep the latest pathname/myId/maps available inside the realtime callback
  // without resubscribing on every change.
  const pathnameRef = useRef(pathname);
  const myIdRef = useRef(myId);
  const channelMapRef = useRef(channelMap);
  const conversationMapRef = useRef(conversationMap);
  const memberMapRef = useRef(memberMap);
  const notifyRef = useRef(notify);
  const routerRef = useRef(router);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);
  useEffect(() => {
    myIdRef.current = myId;
  }, [myId]);
  useEffect(() => {
    channelMapRef.current = channelMap;
  }, [channelMap]);
  useEffect(() => {
    conversationMapRef.current = conversationMap;
  }, [conversationMap]);
  useEffect(() => {
    memberMapRef.current = memberMap;
  }, [memberMap]);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    if (!myId) return;
    const supabase = createClient();

    const channel = supabase
      .channel("global-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const row = payload.new as MessageRow;
          if (!row) return;

          const me = myIdRef.current;
          if (!me) return;
          // Don't notify for our own messages.
          if (row.author_id === me) return;
          // Skip thread replies (we already notify on the top-level message).
          if (row.parent_id) return;

          const path = pathnameRef.current ?? "";

          // Channel message
          if (row.channel_id) {
            const ch = channelMapRef.current.get(row.channel_id);
            // Only notify for channels the user belongs to.
            if (!ch || !ch.isMember) return;
            // Skip if currently viewing that channel.
            if (path.includes(`/messagerie/${row.channel_id}`)) return;

            const author = memberMapRef.current.get(row.author_id);
            const authorName = author
              ? `${author.firstName} ${author.lastName}`.trim()
              : "Nouveau message";
            const body = truncate(
              `${authorName}: ${row.content || ""}`.trim(),
              100
            );

            const notif = notifyRef.current(`#${ch.displayName}`, {
              body,
              tag: `channel-${row.channel_id}`,
            });
            if (notif) {
              notif.onclick = () => {
                window.focus();
                routerRef.current.push(`/messagerie/${row.channel_id}`);
                notif.close();
              };
            }
            return;
          }

          // DM message
          if (row.conversation_id) {
            const conv = conversationMapRef.current.get(row.conversation_id);
            // Only notify for conversations the user is part of.
            if (!conv) return;
            // Skip if currently viewing that DM.
            if (path.includes(`/messagerie/dm/${row.conversation_id}`)) return;

            const author = memberMapRef.current.get(row.author_id);
            const title = author
              ? `${author.firstName} ${author.lastName}`.trim()
              : conv.otherName;
            const body = truncate(row.content || "", 100);

            const notif = notifyRef.current(title, {
              body,
              tag: `dm-${row.conversation_id}`,
            });
            if (notif) {
              notif.onclick = () => {
                window.focus();
                routerRef.current.push(
                  `/messagerie/dm/${row.conversation_id}`
                );
                notif.close();
              };
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId]);

  return null;
}
