"use client";

import { useState } from "react";
import { Image as ImageIcon, Plus, Trash2, ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

type CreateAlbumState = {
  title: string;
  description: string;
  eventId: string;
  coverPhotoUrl: string;
};

const emptyAlbum: CreateAlbumState = {
  title: "",
  description: "",
  eventId: "",
  coverPhotoUrl: "",
};

type AddPhotoState = {
  storagePath: string;
  thumbnailPath: string;
  caption: string;
};

const emptyPhoto: AddPhotoState = {
  storagePath: "",
  thumbnailPath: "",
  caption: "",
};

export default function AdminGaleriePage() {
  const [openAlbum, setOpenAlbum] = useState<string | null>(null);
  const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
  const [albumForm, setAlbumForm] = useState<CreateAlbumState>(emptyAlbum);
  const [confirmDeleteAlbum, setConfirmDeleteAlbum] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [confirmDeletePhoto, setConfirmDeletePhoto] = useState<string | null>(null);
  const [addPhotoOpen, setAddPhotoOpen] = useState(false);
  const [photoForm, setPhotoForm] = useState<AddPhotoState>(emptyPhoto);

  const utils = trpc.useUtils();
  const { data: albums, isLoading } = trpc.admin.listAlbums.useQuery();
  const { data: events } = trpc.admin.listEvents.useQuery(undefined, {
    enabled: createAlbumOpen,
  });
  const { data: album, isLoading: albumLoading } = trpc.admin.getAlbum.useQuery(
    { id: openAlbum ?? "" },
    { enabled: !!openAlbum }
  );

  const createAlbumMutation = trpc.admin.createAlbum.useMutation({
    onSuccess: () => {
      utils.admin.listAlbums.invalidate();
      utils.audit.list.invalidate();
      toast.success("Album créé");
      setCreateAlbumOpen(false);
      setAlbumForm(emptyAlbum);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteAlbumMutation = trpc.admin.deleteAlbum.useMutation({
    onSuccess: () => {
      utils.admin.listAlbums.invalidate();
      utils.audit.list.invalidate();
      toast.success("Album supprimé");
      setConfirmDeleteAlbum(null);
      setOpenAlbum(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const addPhotoMutation = trpc.admin.addPhotoToAlbum.useMutation({
    onSuccess: () => {
      utils.admin.getAlbum.invalidate({ id: openAlbum! });
      utils.admin.listAlbums.invalidate();
      utils.audit.list.invalidate();
      toast.success("Photo ajoutée");
      setAddPhotoOpen(false);
      setPhotoForm(emptyPhoto);
    },
    onError: (e) => toast.error(e.message),
  });

  const deletePhotoMutation = trpc.admin.deletePhoto.useMutation({
    onSuccess: () => {
      utils.admin.getAlbum.invalidate({ id: openAlbum! });
      utils.admin.listAlbums.invalidate();
      utils.audit.list.invalidate();
      toast.success("Photo supprimée");
      setConfirmDeletePhoto(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const submitCreateAlbum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumForm.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    createAlbumMutation.mutate({
      title: albumForm.title.trim(),
      description: albumForm.description || null,
      eventId: albumForm.eventId || null,
      coverPhotoUrl: albumForm.coverPhotoUrl || null,
    });
  };

  const submitAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openAlbum) return;
    if (!photoForm.storagePath.trim()) {
      toast.error("L'URL de la photo est requise");
      return;
    }
    addPhotoMutation.mutate({
      albumId: openAlbum,
      storagePath: photoForm.storagePath.trim(),
      thumbnailPath: photoForm.thumbnailPath.trim() || null,
      caption: photoForm.caption.trim() || null,
    });
  };

  // Detail view
  if (openAlbum) {
    return (
      <div className="p-4 lg:p-6">
        <button
          onClick={() => setOpenAlbum(null)}
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux albums
        </button>

        {albumLoading ? (
          <div className="text-sm text-muted-foreground">Chargement...</div>
        ) : album ? (
          <>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {album.title}
                </h2>
                {album.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {album.description}
                  </p>
                )}
                {album.event && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lié à l'événement : {album.event.title}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAddPhotoOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
                >
                  <Upload className="h-4 w-4" />
                  Ajouter une photo
                </button>
                <button
                  onClick={() =>
                    setConfirmDeleteAlbum({
                      id: album.id,
                      title: album.title,
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer l'album
                </button>
              </div>
            </div>

            {album.photos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Aucune photo dans cet album.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {album.photos.map((p: any) => (
                  <div
                    key={p.id}
                    className="group relative overflow-hidden rounded-xl border border-border bg-card"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.thumbnailPath ?? p.storagePath}
                      alt={p.caption ?? ""}
                      className="aspect-square w-full object-cover"
                    />
                    {p.caption && (
                      <p className="line-clamp-2 px-2 py-1.5 text-xs text-muted-foreground">
                        {p.caption}
                      </p>
                    )}
                    <button
                      onClick={() => setConfirmDeletePhoto(p.id)}
                      title="Supprimer"
                      className="absolute right-1.5 top-1.5 rounded-full bg-red-500/80 p-1 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            Album introuvable.
          </div>
        )}

        {/* Add photo modal */}
        {addPhotoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setAddPhotoOpen(false)}
            />
            <form
              onSubmit={submitAddPhoto}
              className="relative w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl"
            >
              <h3 className="text-base font-semibold text-foreground">
                Ajouter une photo
              </h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    URL de la photo *
                  </label>
                  <input
                    required
                    type="url"
                    placeholder="https://..."
                    value={photoForm.storagePath}
                    onChange={(e) =>
                      setPhotoForm({ ...photoForm, storagePath: e.target.value })
                    }
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    URL miniature (optionnel)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={photoForm.thumbnailPath}
                    onChange={(e) =>
                      setPhotoForm({
                        ...photoForm,
                        thumbnailPath: e.target.value,
                      })
                    }
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Légende
                  </label>
                  <input
                    value={photoForm.caption}
                    onChange={(e) =>
                      setPhotoForm({ ...photoForm, caption: e.target.value })
                    }
                    className="admin-input"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddPhotoOpen(false)}
                  className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/30"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={addPhotoMutation.isPending}
                  className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
                >
                  {addPhotoMutation.isPending ? "..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Confirm delete album */}
        {confirmDeleteAlbum && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setConfirmDeleteAlbum(null)}
            />
            <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
              <h3 className="text-base font-semibold text-foreground">
                Supprimer cet album ?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                "{confirmDeleteAlbum.title}" et toutes ses photos seront
                supprimés.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmDeleteAlbum(null)}
                  className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/30"
                >
                  Annuler
                </button>
                <button
                  onClick={() =>
                    deleteAlbumMutation.mutate({ id: confirmDeleteAlbum.id })
                  }
                  disabled={deleteAlbumMutation.isPending}
                  className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {deleteAlbumMutation.isPending ? "..." : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm delete photo */}
        {confirmDeletePhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setConfirmDeletePhoto(null)}
            />
            <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
              <h3 className="text-base font-semibold text-foreground">
                Supprimer cette photo ?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Cette action est irréversible.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmDeletePhoto(null)}
                  className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/30"
                >
                  Annuler
                </button>
                <button
                  onClick={() =>
                    deletePhotoMutation.mutate({ id: confirmDeletePhoto })
                  }
                  disabled={deletePhotoMutation.isPending}
                  className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {deletePhotoMutation.isPending ? "..." : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // List view
  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Galerie</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {(albums ?? []).length} album(s)
            </p>
          </div>
        </div>
        <button
          onClick={() => setCreateAlbumOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nouvel album
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Chargement...</div>
      ) : (albums ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Aucun album pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(albums ?? []).map((a: any) => (
            <button
              key={a.id}
              onClick={() => setOpenAlbum(a.id)}
              className="group overflow-hidden rounded-xl border border-border bg-card text-left transition-colors hover:border-foreground/20"
            >
              <div className="relative aspect-video bg-muted/40">
                {a.coverPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.coverPhotoUrl}
                    alt={a.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="font-semibold text-foreground group-hover:text-foreground">
                  {a.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {a._count?.photos ?? 0} photo(s)
                  {a.event && ` · ${a.event.title}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create album modal */}
      {createAlbumOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setCreateAlbumOpen(false)}
          />
          <form
            onSubmit={submitCreateAlbum}
            className="relative w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl"
          >
            <h3 className="text-base font-semibold text-foreground">
              Nouvel album
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Titre *
                </label>
                <input
                  required
                  value={albumForm.title}
                  onChange={(e) =>
                    setAlbumForm({ ...albumForm, title: e.target.value })
                  }
                  className="admin-input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={albumForm.description}
                  onChange={(e) =>
                    setAlbumForm({ ...albumForm, description: e.target.value })
                  }
                  className="admin-input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Lié à un événement (optionnel)
                </label>
                <select
                  value={albumForm.eventId}
                  onChange={(e) =>
                    setAlbumForm({ ...albumForm, eventId: e.target.value })
                  }
                  className="admin-input"
                >
                  <option value="">Aucun</option>
                  {(events?.items ?? []).map((ev: any) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  URL image de couverture (optionnel)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={albumForm.coverPhotoUrl}
                  onChange={(e) =>
                    setAlbumForm({
                      ...albumForm,
                      coverPhotoUrl: e.target.value,
                    })
                  }
                  className="admin-input"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateAlbumOpen(false)}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/30"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createAlbumMutation.isPending}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {createAlbumMutation.isPending ? "..." : "Créer"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
