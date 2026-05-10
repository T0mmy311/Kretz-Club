"use client";

import { useState } from "react";
import { Image as ImageIcon, ArrowLeft, Calendar, MapPin, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { trpc } from "@/lib/trpc/client";

export default function GaleriePage() {
  const { data, isLoading } = trpc.gallery.listAlbums.useQuery({});
  const albums = data?.items ?? [];

  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Fetch selected album's photos
  const { data: albumData, isLoading: albumLoading } = trpc.gallery.getAlbum.useQuery(
    { id: selectedAlbumId! },
    { enabled: !!selectedAlbumId }
  );

  const photos = albumData?.photos ?? [];

  function formatDate(date: string | Date) {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // Lightbox navigation
  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = () => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  const nextPhoto = () => setLightboxIndex((i) => (i !== null && i < photos.length - 1 ? i + 1 : i));

  // Album detail view
  if (selectedAlbumId) {
    return (
      <div className="p-4 lg:p-6">
        {/* Header */}
        <button
          onClick={() => { setSelectedAlbumId(null); setLightboxIndex(null); }}
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux albums
        </button>

        {albumLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : albumData ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{albumData.title}</h2>
              {albumData.description && (
                <p className="mt-1 text-muted-foreground">{albumData.description}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {albumData.event && (
                  <>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(albumData.event.startsAt)}
                    </span>
                  </>
                )}
                <span>{photos.length} photo{photos.length > 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Photo grid */}
            {photos.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 opacity-20" />
                <p className="mt-4 text-sm">Aucune photo dans cet album</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {photos.map((photo: any, index: number) => (
                  <button
                    key={photo.id}
                    onClick={() => openLightbox(index)}
                    className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
                  >
                    <img
                      src={photo.storagePath}
                      alt={photo.caption || "Photo"}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {photo.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <p className="text-xs text-white">{photo.caption}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Lightbox */}
            {lightboxIndex !== null && photos[lightboxIndex] && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={closeLightbox}>
                <button
                  onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
                  className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                >
                  <X className="h-6 w-6" />
                </button>

                {lightboxIndex > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                    className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}

                <img
                  src={photos[lightboxIndex].storagePath}
                  alt={photos[lightboxIndex].caption || "Photo"}
                  className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
                  onClick={(e) => e.stopPropagation()}
                />

                {lightboxIndex < photos.length - 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                    className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}

                <div className="absolute bottom-4 text-center text-sm text-white/70">
                  {lightboxIndex + 1} / {photos.length}
                  {photos[lightboxIndex].caption && (
                    <p className="mt-1 text-white">{photos[lightboxIndex].caption}</p>
                  )}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    );
  }

  // Albums list view
  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Galerie</h2>
        <p className="mt-1 text-muted-foreground">
          {"Photos et souvenirs des \u00e9v\u00e9nements du Kretz Club"}
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : albums.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 opacity-20" />
          <p className="mt-4 text-lg font-medium">Aucun album</p>
          <p className="mt-1 text-sm">{"Les photos d\u2019\u00e9v\u00e9nements appara\u00eetront ici"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album: any) => (
            <button
              key={album.id}
              onClick={() => setSelectedAlbumId(album.id)}
              className="group cursor-pointer overflow-hidden rounded-xl border border-border/50 bg-card text-left shadow-sm transition-all hover:shadow-md hover:border-primary/30"
            >
              {/* Cover image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                {album.coverPhotoUrl ? (
                  <Image
                    src={album.coverPhotoUrl}
                    alt={album.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-semibold text-white">{album.title}</h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-white/80">
                    {album.event && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(album.event.startsAt)}
                      </span>
                    )}
                    <span>{album._count?.photos ?? 0} photo{(album._count?.photos ?? 0) > 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
