"use client";

import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import { Send, ArrowLeft, Loader2, User } from "lucide-react";
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

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get conversations to find the other participant
  const { data: conversations } = trpc.conversation.list.useQuery();
  const currentConv = conversations?.find((c: any) => c.id === conversationId);
  const other = (currentConv as any)?.otherParticipants?.[0];

  // Get messages
  const { data: messagesData, isLoading, refetch } = trpc.message.list.useQuery(
    { conversationId },
    { enabled: !!conversationId }
  );

  const sendMessage = trpc.message.send.useMutation({
    onSuccess: () => {
      setContent("");
      refetch();
    },
  });

  // Supabase Realtime
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`dm:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => refetch()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, refetch]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData?.messages]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const handleSend = () => {
    if (!content.trim()) return;
    sendMessage.mutate({ conversationId, content: content.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
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

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Link href="/messagerie" className="rounded-md p-1 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {other ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              {other.firstName[0]}{other.lastName[0]}
            </div>
            <div>
              <h2 className="font-semibold">{other.firstName} {other.lastName}</h2>
              {other.profession && (
                <p className="text-xs text-muted-foreground">{other.profession}</p>
              )}
            </div>
          </div>
        ) : (
          <h2 className="font-semibold">Conversation</h2>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <User className="h-12 w-12 opacity-20" />
            <p className="mt-4 text-lg font-medium">
              {other
                ? `D\u00e9marrez la conversation avec ${other.firstName}`
                : "Nouvelle conversation"}
            </p>
            <p className="mt-1 text-sm">{"Envoyez le premier message !"}</p>
          </div>
        ) : (
          <div className="py-4">
            {messageGroups.map((group) => (
              <div key={group.date}>
                <div className="relative my-4 flex items-center px-4">
                  <div className="flex-1 border-t" />
                  <span className="mx-4 text-xs font-medium text-muted-foreground">{group.date}</span>
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
                          <span className="text-xs text-muted-foreground">{formatTime(msg.createdAt)}</span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
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
      <div className="border-t p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={other ? `Message \u00e0 ${other.firstName}...` : "\u00c9crire un message..."}
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
    </div>
  );
}
