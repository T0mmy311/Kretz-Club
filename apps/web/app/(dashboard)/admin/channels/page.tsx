"use client";

import { useState } from "react";
import { Hash, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

type Category = "le_cercle" | "le_grand_salon" | "thematiques" | "aide";

const CATEGORY_LABELS: Record<Category, string> = {
  le_cercle: "Le Cercle",
  le_grand_salon: "Le Grand Salon",
  thematiques: "Thématiques",
  aide: "Aide",
};

type EditState = {
  id: string;
  displayName: string;
  description: string;
  sortOrder: string;
  isReadOnly: boolean;
};

type CreateState = {
  name: string;
  displayName: string;
  description: string;
  category: Category;
  sortOrder: string;
  isReadOnly: boolean;
};

const emptyCreate: CreateState = {
  name: "",
  displayName: "",
  description: "",
  category: "thematiques",
  sortOrder: "0",
  isReadOnly: false,
};

export default function AdminChannelsPage() {
  const [edit, setEdit] = useState<EditState | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [create, setCreate] = useState<CreateState>(emptyCreate);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const utils = trpc.useUtils();
  const { data: channels, isLoading } = trpc.admin.listChannels.useQuery();

  const updateMutation = trpc.admin.updateChannel.useMutation({
    onSuccess: () => {
      utils.admin.listChannels.invalidate();
      utils.channel.list.invalidate();
      utils.audit.list.invalidate();
      toast.success("Channel mis à jour");
      setEdit(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const createMutation = trpc.admin.createChannel.useMutation({
    onSuccess: () => {
      utils.admin.listChannels.invalidate();
      utils.channel.list.invalidate();
      utils.audit.list.invalidate();
      toast.success("Channel créé");
      setCreateOpen(false);
      setCreate(emptyCreate);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.admin.deleteChannel.useMutation({
    onSuccess: () => {
      utils.admin.listChannels.invalidate();
      utils.channel.list.invalidate();
      utils.audit.list.invalidate();
      toast.success("Channel supprimé");
      setConfirmDelete(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const grouped: Record<string, any[]> = {};
  (channels ?? []).forEach((c: any) => {
    const cat = c.category as string;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(c);
  });

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    updateMutation.mutate({
      id: edit.id,
      displayName: edit.displayName,
      description: edit.description || null,
      sortOrder: Number(edit.sortOrder) || 0,
      isReadOnly: edit.isReadOnly,
    });
  };

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!create.name.trim() || !create.displayName.trim()) {
      toast.error("Nom et nom d'affichage requis");
      return;
    }
    createMutation.mutate({
      name: create.name.trim(),
      displayName: create.displayName.trim(),
      description: create.description || null,
      category: create.category,
      sortOrder: Number(create.sortOrder) || 0,
      isReadOnly: create.isReadOnly,
    });
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Hash className="h-6 w-6 text-muted-foreground" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Channels</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {(channels ?? []).length} channel(s)
            </p>
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nouveau channel
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          Chargement...
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => {
            const list = grouped[cat] ?? [];
            if (list.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {CATEGORY_LABELS[cat]}
                </h3>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-card">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Nom
                        </th>
                        <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                          Description
                        </th>
                        <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                          Ordre
                        </th>
                        <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                          Messages
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((c: any) => (
                        <tr
                          key={c.id}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {c.displayName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                #{c.name}
                              </span>
                              {c.isReadOnly && (
                                <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                                  Lecture seule
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                            <div className="line-clamp-1 max-w-md">
                              {c.description || "-"}
                            </div>
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                            {c.sortOrder}
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                            {c._count?.messages ?? 0}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() =>
                                  setEdit({
                                    id: c.id,
                                    displayName: c.displayName,
                                    description: c.description ?? "",
                                    sortOrder: String(c.sortOrder ?? 0),
                                    isReadOnly: c.isReadOnly,
                                  })
                                }
                                title="Modifier"
                                className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-foreground/80 hover:bg-muted/30"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  setConfirmDelete({
                                    id: c.id,
                                    name: c.displayName,
                                  })
                                }
                                disabled={(c._count?.messages ?? 0) > 0}
                                title={
                                  (c._count?.messages ?? 0) > 0
                                    ? "Channel non vide — suppression impossible"
                                    : "Supprimer"
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setEdit(null)}
          />
          <form
            onSubmit={submitEdit}
            className="relative w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl"
          >
            <h3 className="text-base font-semibold text-foreground">
              Modifier le channel
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Nom d'affichage *
                </label>
                <input
                  required
                  value={edit.displayName}
                  onChange={(e) =>
                    setEdit({ ...edit, displayName: e.target.value })
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
                  value={edit.description}
                  onChange={(e) =>
                    setEdit({ ...edit, description: e.target.value })
                  }
                  className="admin-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={edit.sortOrder}
                    onChange={(e) =>
                      setEdit({ ...edit, sortOrder: e.target.value })
                    }
                    className="admin-input"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={edit.isReadOnly}
                      onChange={(e) =>
                        setEdit({ ...edit, isReadOnly: e.target.checked })
                      }
                    />
                    Lecture seule
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEdit(null)}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/30"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {updateMutation.isPending ? "..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setCreateOpen(false)}
          />
          <form
            onSubmit={submitCreate}
            className="relative w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl"
          >
            <h3 className="text-base font-semibold text-foreground">
              Nouveau channel
            </h3>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Slug *
                  </label>
                  <input
                    required
                    placeholder="ex: paris-immobilier"
                    value={create.name}
                    onChange={(e) =>
                      setCreate({
                        ...create,
                        name: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-"),
                      })
                    }
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Catégorie *
                  </label>
                  <select
                    value={create.category}
                    onChange={(e) =>
                      setCreate({
                        ...create,
                        category: e.target.value as Category,
                      })
                    }
                    className="admin-input"
                  >
                    {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Nom d'affichage *
                </label>
                <input
                  required
                  value={create.displayName}
                  onChange={(e) =>
                    setCreate({ ...create, displayName: e.target.value })
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
                  value={create.description}
                  onChange={(e) =>
                    setCreate({ ...create, description: e.target.value })
                  }
                  className="admin-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Ordre
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={create.sortOrder}
                    onChange={(e) =>
                      setCreate({ ...create, sortOrder: e.target.value })
                    }
                    className="admin-input"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={create.isReadOnly}
                      onChange={(e) =>
                        setCreate({ ...create, isReadOnly: e.target.checked })
                      }
                    />
                    Lecture seule
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/30"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {createMutation.isPending ? "..." : "Créer"}
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
              Supprimer ce channel ?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              "{confirmDelete.name}" sera supprimé. Cette action est
              irréversible.
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
