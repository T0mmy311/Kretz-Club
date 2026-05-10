"use client";

import Link from "next/link";
import { Video, Play, Eye, Calendar, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

type ReplayItem = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
  viewCount: number;
  createdAt: string | Date;
  event: {
    id: string;
    title: string;
    startsAt: string | Date;
  } | null;
};

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getYouTubeThumb(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/
  );
  if (m) return `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;
  return null;
}

export default function ReplaysPage() {
  const { data, isLoading } = trpc.replay.list.useQuery({ limit: 60 });
  const items = (data?.items ?? []) as unknown as ReplayItem[];

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Replays</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Revivez les meilleurs moments du club
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
          <Video className="h-12 w-12 opacity-20" />
          <p className="mt-4 text-lg font-medium">Aucun replay disponible</p>
          <p className="mt-1 text-sm">
            Les enregistrements des événements apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => {
            const thumb = r.thumbnailUrl || getYouTubeThumb(r.videoUrl);
            const dur = formatDuration(r.duration);
            return (
              <Link
                key={r.id}
                href={`/replays/${r.id}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all hover:border-foreground/20 hover:shadow-md"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={r.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Video className="h-12 w-12 opacity-20 text-muted-foreground" />
                    </div>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-lg">
                      <Play className="h-6 w-6 fill-black text-black translate-x-0.5" />
                    </div>
                  </div>
                  {/* Duration badge */}
                  {dur && (
                    <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
                      {dur}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">
                    {r.title}
                  </h3>
                  {r.event && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="line-clamp-1">{r.event.title}</span>
                      <span className="text-muted-foreground/60">·</span>
                      <span>{formatDate(r.event.startsAt)}</span>
                    </div>
                  )}
                  <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {r.viewCount} {r.viewCount > 1 ? "vues" : "vue"}
                    </span>
                    <span className="text-muted-foreground/60">·</span>
                    <span>{formatDate(r.createdAt)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
