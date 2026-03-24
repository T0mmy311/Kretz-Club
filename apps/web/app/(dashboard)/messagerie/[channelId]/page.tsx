"use client";

import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import { Send, Hash, ArrowLeft, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(date: Date | string) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Aujourd\u2019hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = use(params);
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get channel info from list
  const { data: channelsByCategory } = trpc.channel.list.useQuery();
  const currentChannel = channelsByCategory
    ? Object.values(channelsByCategory)
        .flat()
        .find((ch: any) => ch.id === channelId)
    : null;

  // Get messages
  const {
    data: messagesData,
    isLoading,
    refetch,
  } = trpc.message.list.useQuery(
    { channelId },
    { enabled: !!channelId }
  );

  const utils = trpc.useUtils();
  const sendMessage = trpc.message.send.useMutation({
    onSuccess: () => {
      setContent("");
      refetch();
    },
  });

  // Mark channel as read
  const markRead = trpc.channel.markRead.useMutation();
  useEffect(() => {
    if (channelId) {
      markRead.mutate({ channelId });
    }
    inputRef.current?.focus();
  }, [channelId]);

  // Supabase Realtime - refetch on new messages
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, refetch]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData?.messages]);

  const handleSend = () => {
    if (!content.trim()) return;
    sendMessage.mutate({ channelId, content: content.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date (messages come newest first, reverse for display)
  const allMessages = [...(messagesData?.messages ?? [])].reverse();
  const messageGroups: { date: string; messages: typeof allMessages }[] = [];
  let currentDate = "";
  for (const msg of allMessages) {
    const dateStr = formatDateLabel(msg.createdAt);
    if (dateStr !== currentDate) {
      currentDate = dateStr;
      messageGroups.push({ date: dateStr, messages: [] });
    }
    messageGroups[messageGroups.length - 1].messages.push(msg);
  }

  const ch = currentChannel as any;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Link href="/messagerie" className="rounded-md p-1 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Hash className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold">{ch?.displayName ?? "Channel"}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Hash className="h-12 w-12 opacity-20" />
            <p className="mt-4 text-lg font-medium">
              {"Bienvenue dans #"}{ch?.displayName ?? "ce channel"}
            </p>
            <p className="mt-1 text-sm">
              {"Soyez le premier \u00e0 envoyer un message !"}
            </p>
          </div>
        ) : (
          <div className="py-4">
            {messageGroups.map((group) => (
              <div key={group.date}>
                <div className="relative my-4 flex items-center px-4">
                  <div className="flex-1 border-t" />
                  <span className="mx-4 text-xs font-medium text-muted-foreground">
                    {group.date}
                  </span>
                  <div className="flex-1 border-t" />
                </div>
                {group.messages.map((msg) => {
                  const initials = `${msg.author.firstName[0]}${msg.author.lastName[0]}`.toUpperCase();
                  return (
                    <div key={msg.id} className="group flex items-start gap-3 px-4 py-1.5 hover:bg-muted/30">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold">
                            {msg.author.firstName} {msg.author.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(msg.createdAt)}
                          </span>
                          {msg.isEdited && (
                            <span className="text-xs text-muted-foreground">{"(modifi\u00e9)"}</span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      {!ch?.isReadOnly && (
        <div className="border-t p-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`\u00c9crire un message dans #${ch?.displayName ?? "channel"}...`}
              rows={1}
              className="flex-1 resize-none rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={handleSend}
              disabled={!content.trim() || sendMessage.isPending}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
