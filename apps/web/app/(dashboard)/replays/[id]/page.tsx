"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Eye,
  MapPin,
  Video,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

type EmbedInfo = { type: "youtube" | "vimeo" | "direct"; src: string };

function getEmbedUrl(url: string): EmbedInfo {
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/
  );
  if (ytMatch) {
    return {
      type: "youtube",
      src: `https://www.youtube.com/embed/${ytMatch[1]}`,
    };
  }
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      type: "vimeo",
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }
  return { type: "direct", src: url };
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ReplayDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string | undefined;

  const { data: replay, isLoading, error } = trpc.replay.getById.useQuery(
    { id: id! },
    { enabled: !!id, retry: false }
  );

  const incrementView = trpc.replay.incrementView.useMutation();
  const hasIncremented = useRef(false);

  useEffect(() => {
    if (!id || hasIncremented.current) return;
    hasIncremented.current = true;
    incrementView.mutate({ id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !replay) {
    return (
      <div className="p-6">
        <Link
          href="/replays"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux replays
        </Link>
        <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
          <Video className="h-12 w-12 opacity-20" />
          <p className="mt-4 text-sm">Replay introuvable</p>
        </div>
      </div>
    );
  }

  const embed = getEmbedUrl(replay.videoUrl);

  return (
    <div className="mx-auto max-w-5xl p-4 lg:p-6">
      <Link
        href="/replays"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux replays
      </Link>

      {/* Player */}
      <div className="overflow-hidden rounded-xl border border-border bg-black shadow-md">
        <div className="relative aspect-video w-full bg-black">
          {embed.type === "direct" ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={embed.src}
              controls
              className="h-full w-full"
              preload="metadata"
            />
          ) : (
            <iframe
              src={embed.src}
              title={replay.title}
              className="absolute inset-0 h-full w-full"
              sandbox="allow-same-origin allow-scripts allow-presentation allow-popups allow-forms"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-6">
        <h1 className="text-2xl font-bold text-foreground">{replay.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {replay.viewCount} {replay.viewCount > 1 ? "vues" : "vue"}
          </span>
          <span className="text-muted-foreground/60">·</span>
          <span>Publié le {formatDate(replay.createdAt)}</span>
        </div>

        {/* Linked event */}
        {replay.event && (
          <Link
            href={`/evenements/${replay.event.id}`}
            className="mt-4 inline-flex items-center gap-3 rounded-lg border border-border/50 bg-card px-4 py-3 text-sm text-foreground transition-colors hover:border-foreground/20 hover:bg-muted/30"
          >
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">{replay.event.title}</span>
              <span className="text-xs text-muted-foreground">
                {formatDate(replay.event.startsAt)}
                {replay.event.location ? ` · ${replay.event.location}` : ""}
              </span>
            </div>
            {replay.event.location && (
              <MapPin className="ml-auto h-4 w-4 text-muted-foreground" />
            )}
          </Link>
        )}

        {/* Description */}
        {replay.description && (
          <div className="mt-6 whitespace-pre-wrap rounded-xl border border-border/50 bg-card p-5 text-sm leading-relaxed text-foreground/90">
            {replay.description}
          </div>
        )}
      </div>
    </div>
  );
}
