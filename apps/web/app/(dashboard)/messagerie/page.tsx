"use client";

import Link from "next/link";
import { Hash, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

const channelGroups = [
  { key: "le_cercle", label: "Le Cercle", emoji: "🏛️" },
  { key: "le_grand_salon", label: "Le Grand Salon", emoji: "💬" },
  { key: "thematiques", label: "Thématiques", emoji: "📌" },
  { key: "aide", label: "Aide", emoji: "❓" },
];

interface Channel {
  id: string;
  name: string;
  displayName: string;
  unreadCount: number;
}

export default function MessageriePage() {
  const { data: channelsByCategory, isLoading } = trpc.channel.list.useQuery();

  return (
    <div className="flex h-full">
      {/* Channel list */}
      <div className="w-80 border-r bg-muted/30">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Messagerie</h2>
        </div>

        <div className="space-y-4 p-3">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse rounded-md bg-muted"
                />
              ))}
            </div>
          ) : (
            channelGroups.map((group) => {
              const groupChannels =
                (channelsByCategory as Record<string, Channel[]> | undefined)?.[
                  group.key
                ] ?? [];

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
      </div>

      {/* Message area placeholder */}
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="mx-auto h-12 w-12 opacity-20" />
          <p className="mt-4 text-lg font-medium">
            {"S\u00e9lectionnez un channel"}
          </p>
          <p className="mt-1 text-sm">
            {"Choisissez un channel pour commencer \u00e0 discuter"}
          </p>
        </div>
      </div>
    </div>
  );
}
