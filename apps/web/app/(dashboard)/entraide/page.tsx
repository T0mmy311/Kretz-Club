"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  X,
  MapPin,
  Briefcase,
  MessageSquare,
  Pencil,
  Trash2,
  Pause,
  Play,
  Loader2,
  HandHeart,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Juridique",
  "Fiscalité",
  "Comptabilité",
  "Architecture",
  "Décoration",
  "Notariat",
  "Banque & Financement",
  "Conseil en investissement",
  "Promotion immobilière",
  "Gestion locative",
  "Travaux & Rénovation",
  "Marketing & Communication",
  "Autre",
];

type TypeFilter = "all" | "offer" | "request";

type EntraidePost = {
  id: string;
  type: "offer" | "request";
  category: string;
  title: string;
  description: string;
  location: string | null;
  isActive: boolean;
  createdAt: Date | string;
  authorId: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    profession: string | null;
    company: string | null;
    city: string | null;
  };
};

export default function EntraidePage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [tab, setTab] = useState<TypeFilter>("all");
  const [category, setCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EntraidePost | null>(null);

  const { data: meData } = trpc.member.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const currentMemberId = (meData as any)?.id as string | undefined;

  const { data, isLoading } = trpc.entraide.list.useQuery({
    type: tab === "all" ? null : tab,
    category: category || null,
    search: search.length >= 2 ? search : null,
    limit: 60,
  });

  const posts = (data?.items ?? []) as unknown as EntraidePost[];

  const createConversation = trpc.conversation.create.useMutation({
    onSuccess: (conversation: any) => {
      router.push(`/messagerie/dm/${conversation.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const deletePost = trpc.entraide.delete.useMutation({
    onSuccess: () => {
      toast.success("Annonce supprimée");
      utils.entraide.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleActive = trpc.entraide.toggleActive.useMutation({
    onSuccess: (post: any) => {
      toast.success(post.isActive ? "Annonce activée" : "Annonce mise en pause");
      utils.entraide.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (post: EntraidePost) => {
    setEditing(post);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer définitivement cette annonce ?")) return;
    deletePost.mutate({ id });
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Entraide</h2>
          <p className="mt-1 text-muted-foreground">
            Services et compétences entre membres du Kretz Club
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 self-start rounded-lg gradient-gold px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Nouvelle annonce
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {([
          { key: "all", label: "Tous" },
          { key: "offer", label: "J'offre" },
          { key: "request", label: "Je cherche" },
        ] as { key: TypeFilter; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search + category */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher dans les annonces..."
            className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={cn(
              "w-full appearance-none rounded-lg border bg-card px-4 py-2.5 pr-9 text-sm font-medium transition-colors cursor-pointer sm:w-auto",
              category
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <option value="">Toutes les catégories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {category && (
            <button
              onClick={() => setCategory("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-primary/20"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border border-border/50 bg-card"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex h-60 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 text-muted-foreground">
          <HandHeart className="h-10 w-10 opacity-30" />
          <p className="mt-3 text-sm">Aucune annonce pour l'instant</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-1.5 text-xs font-medium hover:bg-muted/30"
          >
            <Plus className="h-3.5 w-3.5" />
            Créer la première annonce
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const isMine = currentMemberId === post.authorId;
            return (
              <div
                key={post.id}
                className="flex flex-col rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      post.type === "offer"
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-blue-500/15 text-blue-500"
                    )}
                  >
                    {post.type === "offer" ? "J'offre" : "Je cherche"}
                  </span>
                  <span className="rounded-full border border-border bg-muted/30 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {post.category}
                  </span>
                  {!post.isActive && (
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-500">
                      En pause
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold">{post.title}</h3>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                  {post.description}
                </p>

                <div className="mt-3 flex items-center gap-2.5 border-t border-border/40 pt-3">
                  {post.author.avatarUrl ? (
                    <img
                      src={post.author.avatarUrl}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-gold text-[11px] font-bold text-black">
                      {(post.author.firstName?.[0] || "?") + (post.author.lastName?.[0] || "")}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {post.author.firstName} {post.author.lastName}
                    </p>
                    {post.author.profession && (
                      <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                        <Briefcase className="h-3 w-3 flex-shrink-0" />
                        {post.author.profession}
                      </p>
                    )}
                  </div>
                </div>

                {post.location && (
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {post.location}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {!isMine && (
                    <button
                      onClick={() =>
                        createConversation.mutate({ memberId: post.authorId })
                      }
                      disabled={createConversation.isPending}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg gradient-gold px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Contacter
                    </button>
                  )}
                  {isMine && (
                    <>
                      <button
                        onClick={() => openEdit(post)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        Modifier
                      </button>
                      <button
                        onClick={() => toggleActive.mutate({ id: post.id })}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
                      >
                        {post.isActive ? (
                          <>
                            <Pause className="h-3 w-3" />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3" />
                            Réactiver
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-[11px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Supprimer
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <EntraideModal
          editing={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            utils.entraide.list.invalidate();
          }}
        />
      )}
    </div>
  );
}

function EntraideModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: EntraidePost | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<"offer" | "request">(editing?.type ?? "offer");
  const [category, setCategory] = useState(editing?.category ?? CATEGORIES[0]);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [location, setLocation] = useState(editing?.location ?? "");

  const create = trpc.entraide.create.useMutation({
    onSuccess: () => {
      toast.success("Annonce publiée");
      onSaved();
    },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.entraide.update.useMutation({
    onSuccess: () => {
      toast.success("Annonce mise à jour");
      onSaved();
    },
    onError: (e) => toast.error(e.message),
  });

  const isPending = create.isPending || update.isPending;

  const errors = useMemo(() => {
    const errs: { title?: string; description?: string } = {};
    if (!title.trim()) errs.title = "Titre requis";
    if (description.trim().length < 20)
      errs.description = "Description trop courte (20 caractères minimum)";
    return errs;
  }, [title, description]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length) return;

    const payload = {
      type,
      category,
      title: title.trim(),
      description: description.trim(),
      location: location.trim() || null,
    };

    if (editing) {
      update.mutate({ id: editing.id, ...payload });
    } else {
      create.mutate(payload);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg overflow-hidden rounded-t-2xl border border-border bg-card sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-lg font-semibold">
            {editing ? "Modifier l'annonce" : "Nouvelle annonce"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/30 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { key: "offer", label: "J'offre" },
                  { key: "request", label: "Je cherche" },
                ] as { key: "offer" | "request"; label: string }[]
              ).map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => setType(opt.key)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    type === opt.key
                      ? opt.key === "offer"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                        : "border-blue-500 bg-blue-500/10 text-blue-500"
                      : "border-border bg-background text-muted-foreground hover:bg-muted/30"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Catégorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Titre
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Ex : Conseil pour structuration SCI"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {title.length > 0 && errors.title && (
              <p className="mt-1 text-[11px] text-destructive">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder="Décrivez précisément ce que vous offrez ou recherchez..."
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="mt-1 flex justify-between text-[11px]">
              <span className="text-destructive">
                {description.length > 0 && errors.description ? errors.description : ""}
              </span>
              <span className="text-muted-foreground">{description.length}/4000</span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Localisation (optionnel)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={120}
              placeholder="Paris, Lyon, France entière..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || Object.keys(errors).length > 0}
              className="inline-flex items-center gap-2 rounded-lg gradient-gold px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Enregistrer" : "Publier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
