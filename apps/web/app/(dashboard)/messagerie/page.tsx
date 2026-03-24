"use client";

import { useState } from "react";
import Link from "next/link";
import { Hash, MessageSquare, Mail, Plus, Search, User } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const channelGroups = [
  { key: "le_cercle", label: "Le Cercle", emoji: "\ud83c\udfdb\ufe0f" },
  { key: "le_grand_salon", label: "Le Grand Salon", emoji: "\ud83d\udcac" },
  { key: "thematiques", label: "Th\u00e9matiques", emoji: "\ud83d\udccc" },
  { key: "aide", label: "Aide", emoji: "\u2753" },
];

interface Channel {
  id: string;
  name: string;
  displayName: string;
  unreadCount: number;
}

export default function MessageriePage() {
  const [activeTab, setActiveTab] = useState<"channels" | "dms">("channels");
  const [showNewDm, setShowNewDm] = useState(false);
  const [dmSearch, setDmSearch] = useState("");

  const { data: channelsByCategory, isLoading: channelsLoading } = trpc.channel.list.useQuery();
  const { data: conversations, isLoading: dmsLoading } = trpc.conversation.list.useQuery();
  const { data: searchResults } = trpc.member.search.useQuery(
    { query: dmSearch },
    { enabled: dmSearch.length >= 2 }
  );

  const createConversation = trpc.conversation.create.useMutation({
    onSuccess: (data) => {
      setShowNewDm(false);
      setDmSearch("");
      window.location.href = `/messagerie/dm/${data.id}`;
    },
  });

  function formatLastMessage(msg: any) {
    if (!msg) return "Pas encore de message";
    const content = msg.content.length > 40 ? msg.content.slice(0, 40) + "..." : msg.content;
    return content;
  }

  function formatTime(date: Date | string) {
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  return (
    <div className="flex h-full">
      {/* Sidebar - full width on mobile, fixed width on desktop */}
      <div className="flex w-full lg:w-80 flex-col border-r border-border/50">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Messagerie</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("channels")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
              activeTab === "channels"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Hash className="h-4 w-4" />
            Channels
          </button>
          <button
            onClick={() => setActiveTab("dms")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
              activeTab === "dms"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Mail className="h-4 w-4" />
            Messages
            {conversations && conversations.some((c: any) => c.hasUnread) && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "channels" ? (
            /* Channels list */
            <div className="space-y-4 p-3">
              {channelsLoading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-8 animate-pulse rounded-md bg-muted" />
                  ))}
                </div>
              ) : (
                channelGroups.map((group) => {
                  const groupChannels =
                    (channelsByCategory as Record<string, Channel[]> | undefined)?.[group.key] ?? [];
                  return (
                    <div key={group.key}>
                      <p className="mb-1 px-2 text-xs font-semibold uppercase text-muted-foreground">
                        {group.emoji} {group.label}
                      </p>
                      {groupChannels.map((channel) => (
                        <Link
                          key={channel.id}
                          href={`/messagerie/${channel.id}`}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                          <Hash className="h-3.5 w-3.5" />
                          {channel.displayName}
                          {channel.unreadCount > 0 && (
                            <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                              {channel.unreadCount}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* DMs list */
            <div className="p-3">
              {/* New conversation button */}
              <button
                onClick={() => setShowNewDm(!showNewDm)}
                className="mb-3 flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Plus className="h-4 w-4" />
                Nouveau message
              </button>

              {/* New DM search */}
              {showNewDm && (
                <div className="mb-3 space-y-2 rounded-lg border bg-card p-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={dmSearch}
                      onChange={(e) => setDmSearch(e.target.value)}
                      placeholder="Rechercher un membre..."
                      autoFocus
                      className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  {searchResults?.items && searchResults.items.length > 0 && (
                    <div className="max-h-40 space-y-1 overflow-y-auto">
                      {searchResults.items.map((member: any) => (
                        <button
                          key={member.id}
                          onClick={() => createConversation.mutate({ memberId: member.id })}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {member.firstName[0]}{member.lastName[0]}
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{member.firstName} {member.lastName}</p>
                            {member.profession && (
                              <p className="text-xs text-muted-foreground">{member.profession}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Conversation list */}
              {dmsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-md bg-muted" />
                  ))}
                </div>
              ) : conversations && conversations.length > 0 ? (
                <div className="space-y-1">
                  {conversations.map((conv: any) => {
                    const other = conv.otherParticipants[0];
                    if (!other) return null;
                    return (
                      <Link
                        key={conv.id}
                        href={`/messagerie/dm/${conv.id}`}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent",
                          conv.hasUnread && "bg-accent/50"
                        )}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {other.firstName[0]}{other.lastName[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className={cn("text-sm", conv.hasUnread ? "font-semibold" : "font-medium")}>
                              {other.firstName} {other.lastName}
                            </p>
                            {conv.lastMessage && (
                              <span className="text-xs text-muted-foreground">
                                {formatTime(conv.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <p className={cn(
                            "truncate text-xs",
                            conv.hasUnread ? "font-medium text-foreground" : "text-muted-foreground"
                          )}>
                            {formatLastMessage(conv.lastMessage)}
                          </p>
                        </div>
                        {conv.hasUnread && (
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <User className="mx-auto h-10 w-10 opacity-20" />
                  <p className="mt-3 text-sm">Aucune conversation</p>
                  <p className="mt-1 text-xs">{"Cliquez sur \u00ab Nouveau message \u00bb pour d\u00e9marrer"}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message area placeholder - hidden on mobile */}
      <div className="hidden lg:flex flex-1 items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="mx-auto h-12 w-12 opacity-20" />
          <p className="mt-4 text-lg font-medium">
            {activeTab === "channels"
              ? "S\u00e9lectionnez un channel"
              : "S\u00e9lectionnez une conversation"}
          </p>
          <p className="mt-1 text-sm">
            {activeTab === "channels"
              ? "Choisissez un channel pour commencer \u00e0 discuter"
              : "Choisissez une conversation ou cr\u00e9ez-en une nouvelle"}
          </p>
        </div>
      </div>
    </div>
  );
}
