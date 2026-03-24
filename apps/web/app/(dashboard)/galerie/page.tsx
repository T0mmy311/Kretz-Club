"use client";

import { Image as ImageIcon } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function GaleriePage() {
  const { data, isLoading } = trpc.gallery.listAlbums.useQuery({});
  const albums = data?.items ?? [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Galerie</h2>
        <p className="mt-1 text-muted-foreground">
          Photos et souvenirs du Kretz Club
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-xl border bg-muted"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album: any) => (
            <div
              key={album.id}
              className="group cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Cover */}
              <div className="flex h-48 items-center justify-center bg-muted">
                <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold group-hover:text-primary">
                  {album.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {album._count?.photos ?? 0} photo
                  {(album._count?.photos ?? 0) > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
