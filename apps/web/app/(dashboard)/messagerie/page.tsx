"use client";

import Link from "next/link";
import { Hash, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const channelGroups = [
  { label: "Le Cercle", emoji: "🏛️" },
  { label: "Le Grand Salon", emoji: "💬" },
  { label: "Thematiques", emoji: "📌" },
  { label: "Aide", emoji: "❓" },
];

export default function MessageriePage() {
  const { data: channels, isLoading } = trpc.channel.list.useQuery();

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
            channelGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-1 px-2 text-xs font-semibold uppercase text-muted-foreground">
                  {group.emoji} {group.label}
                </p>
                {channels
                  ?.filter(
                    (c: { category: string }) => c.category === group.label
                  )
                  .map((channel: { id: string; name: string }) => (
                    <Link
                      key={channel.id}
                      href={`/messagerie/${channel.id}`}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      <Hash className="h-3.5 w-3.5" />
                      {channel.name}
                    </Link>
                  ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message area placeholder */}
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="mx-auto h-12 w-12 opacity-20" />
          <p className="mt-4 text-lg font-medium">
            Selectionnez un channel
          </p>
          <p className="mt-1 text-sm">
            Choisissez un channel pour commencer a discuter
          </p>
        </div>
      </div>
    </div>
  );
}
