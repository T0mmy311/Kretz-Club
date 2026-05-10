"use client";

import { useState, useMemo } from "react";
import {
  PieChart,
  Plus,
  Trash2,
  X,
  Hash,
  Calendar,
  Users,
  Check,
  Lock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

type Category = "le_cercle" | "le_grand_salon" | "thematiques" | "aide";

const CATEGORY_LABELS: Record<Category, string> = {
  le_cercle: "Le Cercle",
  le_grand_salon: "Le Grand Salon",
  thematiques: "Thématiques",
  aide: "Aide",
};

type CreateState = {
  channelId: string;
  question: string;
  options: string[];
  isAnonymous: boolean;
  isMultiple: boolean;
  endsAt: string;
};

const emptyCreate: CreateState = {
  channelId: "",
  question: "",
  options: ["", ""],
  isAnonymous: false,
  isMultiple: false,
  endsAt: "",
};

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPollsPage() {
  const utils = trpc.useUtils();
  const { data: polls, isLoading } = trpc.poll.listAll.useQuery();
  const { data: channels } = trpc.admin.listChannels.useQuery();

  const [createOpen, setCreateOpen] = useState(false);
  const [create, setCreate] = useState<CreateState>(emptyCreate);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    question: string;
  } | null>(null);

  const createMutation = trpc.poll.create.useMutation({
    onSuccess: () => {
      utils.poll.listAll.invalidate();
      utils.poll.getByChannel.invalidate();
      toast.success("Sondage créé");
      setCreateOpen(false);
      setCreate(emptyCreate);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.poll.delete.useMutation({
    onSuccess: () => {
      utils.poll.listAll.invalidate();
      utils.poll.getByChannel.invalidate();
      toast.success("Sondage supprimé");
      setConfirmDelete(null);
    },
    onError: (e) => toast.error(e.message),
  });

  // Group polls by channel
  const grouped = useMemo(() => {
    const map = new Map<string, { channel: any; polls: any[] }>();
    for (const p of polls ?? []) {
      const key = p.channel?.id ?? "unknown";
      if (!map.has(key)) {
        map.set(key, { channel: p.channel, polls: [] });
      }
      map.get(key)!.polls.push(p);
    }
    return Array.from(map.values());
  }, [polls]);

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOptions = create.options
      .map((o) => o.trim())
      .filter((o) => o.length > 0);
    if (!create.channelId) {
      toast.error("Sélectionnez un channel");
      return;
    }
    if (!create.question.trim()) {
      toast.error("Question requise");
      return;
    }
    if (cleanOptions.length < 2) {
      toast.error("Au moins 2 options requises");
      return;
    }

    let endsAtIso: string | undefined;
    if (create.endsAt) {
      const d = new Date(create.endsAt);
      if (isNaN(d.getTime())) {
        toast.error("Date de fin invalide");
        return;
      }
      endsAtIso = d.toISOString();
    }

    createMutation.mutate({
      channelId: create.channelId,
      question: create.question.trim(),
      options: cleanOptions,
      isAnonymous: create.isAnonymous,
      isMultiple: create.isMultiple,
      ...(endsAtIso ? { endsAt: endsAtIso } : {}),
    });
  };

  const updateOption = (idx: number, value: string) => {
    setCreate((c) => {
      const next = [...c.options];
      next[idx] = value;
      return { ...c, options: next };
    });
  };

  const addOption = () => {
    setCreate((c) =>
      c.options.length >= 10 ? c : { ...c, options: [...c.options, ""] }
    );
  };

  const removeOption = (idx: number) => {
    setCreate((c) =>
      c.options.length <= 2
        ? c
        : { ...c, options: c.options.filter((_, i) => i !== idx) }
    );
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <PieChart className="h-6 w-6 text-muted-foreground" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Sondages</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {(polls ?? []).length} sondage(s)
            </p>
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nouveau sondage
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          Chargement...
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-xl border border-border p-10 text-center">
          <PieChart className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-foreground">
            Aucun sondage
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Créez votre premier sondage pour engager la communauté.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.channel?.id ?? "unknown"}>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Hash className="h-3.5 w-3.5" />
                {g.channel?.displayName ?? "Channel inconnu"}
                <span className="text-[10px] font-normal opacity-60">
                  ({g.polls.length})
                </span>
              </h3>
              <div className="space-y-3">
                {g.polls.map((poll: any) => {
                  const isClosed =
                    poll.endsAt && new Date(poll.endsAt) < new Date();
                  return (
                    <div
                      key={poll.id}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {poll.question}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>
                              Sondage créé par{" "}
                              <span className="font-medium text-foreground/80">
                                {poll.author?.firstName}{" "}
                                {poll.author?.lastName}
                              </span>
                            </span>
                            <span>•</span>
                            <span>{formatDate(poll.createdAt)}</span>
                            {poll.isAnonymous && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-1.5 py-0.5">
                                <Lock className="h-3 w-3" />
                                Anonyme
                              </span>
                            )}
                            {poll.isMultiple && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-1.5 py-0.5">
                                <Check className="h-3 w-3" />
                                Choix multiples
                              </span>
                            )}
                            {poll.endsAt && (
                              <span
                                className={
                                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 " +
                                  (isClosed
                                    ? "bg-red-500/10 text-red-400"
                                    : "bg-amber-500/10 text-amber-400")
                                }
                              >
                                <Calendar className="h-3 w-3" />
                                {isClosed ? "Terminé" : "Fin"} le{" "}
                                {formatDate(poll.endsAt)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setConfirmDelete({
                              id: poll.id,
                              question: poll.question,
                            })
                          }
                          title="Supprimer"
                          className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Results */}
                      <div className="mt-3 space-y-2">
                        {poll.options.map((opt: any) => {
                          const total = poll.totalVotes ?? 0;
                          const pct =
                            total > 0
                              ? Math.round((opt.voteCount / total) * 100)
                              : 0;
                          return (
                            <div key={opt.id}>
                              <div className="mb-0.5 flex items-baseline justify-between gap-3 text-xs">
                                <span className="truncate text-foreground">
                                  {opt.text}
                                </span>
                                <span className="shrink-0 tabular-nums text-muted-foreground">
                                  {opt.voteCount} ({pct}%)
                                </span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
                                <div
                                  className="h-full rounded-full bg-amber-400/80 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {poll.totalVotes ?? 0} vote(s)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">
                Nouveau sondage
              </h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded p-1 text-muted-foreground hover:bg-muted/30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Channel *
                </label>
                <select
                  required
                  value={create.channelId}
                  onChange={(e) =>
                    setCreate({ ...create, channelId: e.target.value })
                  }
                  className="admin-input"
                >
                  <option value="">Sélectionnez un channel...</option>
                  {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => {
                    const list =
                      (channels ?? []).filter(
                        (c: any) => c.category === cat
                      ) ?? [];
                    if (list.length === 0) return null;
                    return (
                      <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
                        {list.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.displayName}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Question *
                </label>
                <textarea
                  required
                  rows={2}
                  maxLength={500}
                  value={create.question}
                  onChange={(e) =>
                    setCreate({ ...create, question: e.target.value })
                  }
                  placeholder="Posez votre question..."
                  className="admin-input"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    Options * (min 2, max 10)
                  </label>
                  <button
                    type="button"
                    onClick={addOption}
                    disabled={create.options.length >= 10}
                    className="inline-flex items-center gap-1 text-xs text-foreground/80 hover:text-foreground disabled:opacity-40"
                  >
                    <Plus className="h-3 w-3" />
                    Ajouter
                  </button>
                </div>
                <div className="space-y-2">
                  {create.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        maxLength={200}
                        placeholder={`Option ${i + 1}`}
                        className="admin-input flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        disabled={create.options.length <= 2}
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted/30 disabled:opacity-30"
                        title="Supprimer cette option"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground/90">
                  <input
                    type="checkbox"
                    checked={create.isAnonymous}
                    onChange={(e) =>
                      setCreate({ ...create, isAnonymous: e.target.checked })
                    }
                  />
                  Anonyme
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground/90">
                  <input
                    type="checkbox"
                    checked={create.isMultiple}
                    onChange={(e) =>
                      setCreate({ ...create, isMultiple: e.target.checked })
                    }
                  />
                  Choix multiples
                </label>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Date de fin (optionnel)
                </label>
                <input
                  type="datetime-local"
                  value={create.endsAt}
                  onChange={(e) =>
                    setCreate({ ...create, endsAt: e.target.value })
                  }
                  className="admin-input"
                />
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
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {createMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Créer le sondage
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">
              Supprimer ce sondage ?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              «&nbsp;{confirmDelete.question}&nbsp;» et tous ses votes seront
              supprimés. Cette action est irréversible.
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
                className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
