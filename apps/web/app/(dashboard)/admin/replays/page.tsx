"use client";

import { useState } from "react";
import { Video, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

type FormState = {
  id?: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  eventId: string;
  isPublic: boolean;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  videoUrl: "",
  thumbnailUrl: "",
  duration: "",
  eventId: "",
  isPublic: true,
};

function fmtDuration(s: number | null) {
  if (!s || s <= 0) return "—";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminReplaysPage() {
  const utils = trpc.useUtils();
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data, isLoading } = trpc.replay.listAll.useQuery();
  const items = (data?.items ?? []) as any[];

  const { data: eventsData } = trpc.admin.listEvents.useQuery({ limit: 100 });
  const events = (eventsData?.items ?? []) as any[];

  const createMutation = trpc.replay.create.useMutation({
    onSuccess: () => {
      toast.success("Replay créé");
      utils.replay.listAll.invalidate();
      utils.replay.list.invalidate();
      closeForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.replay.update.useMutation({
    onSuccess: () => {
      toast.success("Replay mis à jour");
      utils.replay.listAll.invalidate();
      utils.replay.list.invalidate();
      closeForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.replay.delete.useMutation({
    onSuccess: () => {
      toast.success("Replay supprimé");
      utils.replay.listAll.invalidate();
      utils.replay.list.invalidate();
      setConfirmDelete(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setForm(emptyForm);
    setOpenForm(true);
  };

  const openEdit = (r: any) => {
    setForm({
      id: r.id,
      title: r.title ?? "",
      description: r.description ?? "",
      videoUrl: r.videoUrl ?? "",
      thumbnailUrl: r.thumbnailUrl ?? "",
      duration: r.duration ? String(r.duration) : "",
      eventId: r.eventId ?? "",
      isPublic: r.isPublic ?? true,
    });
    setOpenForm(true);
  };

  const closeForm = () => {
    setOpenForm(false);
    setForm(emptyForm);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Titre requis");
    if (!form.videoUrl.trim()) return toast.error("URL vidéo requise");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      videoUrl: form.videoUrl.trim(),
      thumbnailUrl: form.thumbnailUrl.trim() || null,
      duration: form.duration ? Number(form.duration) : null,
      eventId: form.eventId || null,
      isPublic: form.isPublic,
    };

    if (form.id) {
      updateMutation.mutate({ id: form.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Video className="h-6 w-6 text-muted-foreground" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Replays</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {items.length} replay(s)
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Ajouter un replay
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Titre
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                Événement
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                Durée
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                Vues
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                Date
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-4 w-48 animate-pulse rounded bg-muted/50" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  Aucun replay pour le moment.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span className="line-clamp-1">{r.title}</span>
                      {!r.isPublic && (
                        <span className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                          Privé
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {r.event?.title ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {fmtDuration(r.duration)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {r.viewCount}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {fmtDate(r.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={r.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ouvrir la vidéo"
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-foreground/80 hover:bg-muted/30"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => openEdit(r)}
                        title="Modifier"
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-foreground/80 hover:bg-muted/30"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setConfirmDelete({ id: r.id, title: r.title })
                        }
                        title="Supprimer"
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form modal */}
      {openForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeForm} />
          <form
            onSubmit={submit}
            className="relative my-8 w-full max-w-2xl rounded-xl border border-border bg-card p-5 shadow-xl"
          >
            <h3 className="text-base font-semibold text-foreground">
              {form.id ? "Modifier le replay" : "Nouveau replay"}
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Titre *" colSpan>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="admin-input"
                />
              </Field>
              <Field label="Description" colSpan>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="admin-input"
                />
              </Field>
              <Field label="URL vidéo * (YouTube, Vimeo, ou .mp4)" colSpan>
                <input
                  required
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={form.videoUrl}
                  onChange={(e) =>
                    setForm({ ...form, videoUrl: e.target.value })
                  }
                  className="admin-input"
                />
              </Field>
              <Field label="URL miniature" colSpan>
                <input
                  type="url"
                  placeholder="https://... (auto pour YouTube si vide)"
                  value={form.thumbnailUrl}
                  onChange={(e) =>
                    setForm({ ...form, thumbnailUrl: e.target.value })
                  }
                  className="admin-input"
                />
              </Field>
              <Field label="Durée (secondes)">
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ex: 1800 pour 30 min"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                  className="admin-input"
                />
              </Field>
              <Field label="Événement lié">
                <select
                  value={form.eventId}
                  onChange={(e) =>
                    setForm({ ...form, eventId: e.target.value })
                  }
                  className="admin-input"
                >
                  <option value="">Aucun</option>
                  {events.map((ev: any) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({fmtDate(ev.startsAt)})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Visibilité" colSpan>
                <label className="inline-flex items-center gap-2 text-sm text-foreground/80">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) =>
                      setForm({ ...form, isPublic: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-border"
                  />
                  Visible par tous les membres
                </label>
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/30"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "..."
                  : form.id
                    ? "Enregistrer"
                    : "Créer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">
              Supprimer ce replay ?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              "{confirmDelete.title}" sera définitivement supprimé.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/30"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteMutation.mutate({ id: confirmDelete.id })}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  colSpan,
  children,
}: {
  label: string;
  colSpan?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={colSpan ? "md:col-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
