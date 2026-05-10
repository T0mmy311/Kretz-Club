"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  FileText,
  Play,
  Headphones,
  FileSpreadsheet,
  Folder,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

type ResourceType =
  | "article"
  | "video"
  | "ebook"
  | "podcast"
  | "template"
  | "other";

type TabKey = "all" | ResourceType;

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "article", label: "Articles" },
  { key: "video", label: "Vidéos" },
  { key: "ebook", label: "Ebooks" },
  { key: "podcast", label: "Podcasts" },
  { key: "template", label: "Templates" },
  { key: "other", label: "Autres" },
];

const TYPE_META: Record<
  ResourceType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  article: { label: "Article", icon: FileText, color: "text-blue-400" },
  video: { label: "Vidéo", icon: Play, color: "text-red-400" },
  ebook: { label: "Ebook", icon: BookOpen, color: "text-amber-400" },
  podcast: { label: "Podcast", icon: Headphones, color: "text-purple-400" },
  template: {
    label: "Template",
    icon: FileSpreadsheet,
    color: "text-emerald-400",
  },
  other: { label: "Autre", icon: Folder, color: "text-muted-foreground" },
};

const CATEGORIES = [
  "Investissement",
  "Fiscalité",
  "Juridique",
  "Marché immobilier",
  "Stratégie patrimoniale",
  "Financement",
  "International",
  "Outils",
  "Autre",
];

type ResourceItem = {
  id: string;
  type: ResourceType;
  title: string;
  description: string | null;
  url: string;
  thumbnailUrl: string | null;
  category: string;
  createdAt: string | Date;
  uploadedById: string;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
};

type FormState = {
  id?: string;
  type: ResourceType;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  category: string;
};

const emptyForm: FormState = {
  type: "article",
  title: "",
  description: "",
  url: "",
  thumbnailUrl: "",
  category: CATEGORIES[0],
};

export default function BibliothequePage() {
  const utils = trpc.useUtils();
  const [tab, setTab] = useState<TabKey>("all");
  const [category, setCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data: meData } = trpc.member.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const currentMemberId = (meData as any)?.id as string | undefined;
  const isAdmin = (meData as any)?.isAdmin === true;

  const { data, isLoading } = trpc.resource.list.useQuery({
    type: tab === "all" ? undefined : tab,
    category: category || undefined,
    search: search.trim().length >= 2 ? search.trim() : undefined,
    limit: 60,
  });

  const items = (data?.items ?? []) as unknown as ResourceItem[];

  const createMutation = trpc.resource.create.useMutation({
    onSuccess: () => {
      toast.success("Ressource ajoutée");
      utils.resource.list.invalidate();
      closeModal();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.resource.update.useMutation({
    onSuccess: () => {
      toast.success("Ressource mise à jour");
      utils.resource.list.invalidate();
      closeModal();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.resource.delete.useMutation({
    onSuccess: () => {
      toast.success("Ressource supprimée");
      utils.resource.list.invalidate();
      setConfirmDelete(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (r: ResourceItem) => {
    setForm({
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description ?? "",
      url: r.url,
      thumbnailUrl: r.thumbnailUrl ?? "",
      category: r.category,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Titre requis");
    if (!form.url.trim()) return toast.error("URL requise");

    const payload = {
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim() || null,
      url: form.url.trim(),
      thumbnailUrl: form.thumbnailUrl.trim() || null,
      category: form.category,
    };

    if (form.id) {
      updateMutation.mutate({ id: form.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const initials = (first: string, last: string) =>
    `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bibliothèque</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ressources partagées par les membres du club
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Ajouter une ressource
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              tab === t.key
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:bg-muted/30"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une ressource..."
            className="w-full rounded-lg border border-border bg-card px-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted/30"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
        >
          <option value="">Toutes les catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
          <BookOpen className="h-12 w-12 opacity-20" />
          <p className="mt-4 text-lg font-medium">Aucune ressource</p>
          <p className="mt-1 text-sm">
            Soyez le premier à partager une ressource avec le club
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => {
            const meta = TYPE_META[r.type];
            const Icon = meta.icon;
            const isOwner = r.uploadedById === currentMemberId;
            const canEdit = isOwner || isAdmin;
            return (
              <div
                key={r.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all hover:border-foreground/20 hover:shadow-md"
              >
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 flex-col"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    {r.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.thumbnailUrl}
                        alt={r.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Icon className={cn("h-12 w-12 opacity-20", meta.color)} />
                      </div>
                    )}
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">
                      <Icon className={cn("h-3 w-3", meta.color)} />
                      <span className="text-foreground">{meta.label}</span>
                    </div>
                    <div className="absolute right-3 top-3 rounded-full bg-background/90 p-1.5 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <ExternalLink className="h-3.5 w-3.5 text-foreground" />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">
                      {r.title}
                    </h3>
                    {r.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {r.description}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <span className="inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {r.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 border-t border-border/50 pt-3">
                      {r.uploadedBy.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.uploadedBy.avatarUrl}
                          alt=""
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground">
                          {initials(r.uploadedBy.firstName, r.uploadedBy.lastName)}
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {r.uploadedBy.firstName} {r.uploadedBy.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground/60">·</span>
                      <span className="text-xs text-muted-foreground/60">
                        {fmtDate(r.createdAt)}
                      </span>
                    </div>
                  </div>
                </a>

                {/* Edit / delete (owner / admin) */}
                {canEdit && (
                  <div className="absolute right-3 bottom-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        openEdit(r);
                      }}
                      title="Modifier"
                      className="rounded-md border border-border bg-card/95 p-1.5 text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setConfirmDelete({ id: r.id, title: r.title });
                      }}
                      title="Supprimer"
                      className="rounded-md border border-red-500/20 bg-card/95 p-1.5 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
          <form
            onSubmit={submit}
            className="relative my-8 w-full max-w-xl rounded-xl border border-border bg-card p-5 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">
                {form.id ? "Modifier la ressource" : "Ajouter une ressource"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded p-1 text-muted-foreground hover:bg-muted/30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Type *">
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as ResourceType })
                  }
                  className="admin-input"
                >
                  {Object.entries(TYPE_META).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Catégorie *">
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="admin-input"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Titre *" colSpan>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Titre de la ressource"
                  className="admin-input"
                />
              </Field>
              <Field label="Description" colSpan>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Brève description (facultatif)"
                  className="admin-input"
                />
              </Field>
              <Field label="URL *" colSpan>
                <input
                  required
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                  className="admin-input"
                />
              </Field>
              <Field label="URL miniature (image)" colSpan>
                <input
                  type="url"
                  value={form.thumbnailUrl}
                  onChange={(e) =>
                    setForm({ ...form, thumbnailUrl: e.target.value })
                  }
                  placeholder="https://... (facultatif)"
                  className="admin-input"
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
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
                    : "Ajouter"}
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
              Supprimer cette ressource ?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              "{confirmDelete.title}" sera définitivement supprimée.
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
