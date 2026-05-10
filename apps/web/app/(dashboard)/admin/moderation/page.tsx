"use client";

import { useState } from "react";
import { MessageSquareWarning, Trash2, Pin } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

export default function AdminModerationPage() {
  const [channelId, setChannelId] = useState<string>("");
  const [memberId, setMemberId] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    preview: string;
  } | null>(null);

  const utils = trpc.useUtils();
  const { data: channels } = trpc.channel.list.useQuery();
  const { data: membersData } = trpc.admin.listMembers.useQuery({ limit: 100 });
  const { data, isLoading } = trpc.admin.listRecentMessages.useQuery({
    channelId: channelId || undefined,
    memberId: memberId || undefined,
    limit: 100,
  });

  const deleteMutation = trpc.admin.deleteAnyMessage.useMutation({
    onSuccess: () => {
      utils.admin.listRecentMessages.invalidate();
      utils.admin.stats.invalidate();
      utils.audit.list.invalidate();
      toast.success("Message supprimé");
      setConfirmDelete(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const pinMutation = trpc.admin.pinAnyMessage.useMutation({
    onSuccess: (m) => {
      utils.admin.listRecentMessages.invalidate();
      utils.audit.list.invalidate();
      toast.success(m.isPinned ? "Message épinglé" : "Message désépinglé");
    },
    onError: (e) => toast.error(e.message),
  });

  const messages = data?.items ?? [];

  // Flatten channels (grouped by category) into a flat list
  const flatChannels: any[] = [];
  if (channels) {
    Object.values(channels).forEach((arr: any) => {
      (arr as any[]).forEach((c: any) => flatChannels.push(c));
    });
  }

  const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-3">
        <MessageSquareWarning className="h-6 w-6 text-muted-foreground" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Modération</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Derniers messages des channels
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Channel
          </label>
          <select
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-foreground/30 focus:outline-none"
          >
            <option value="">Tous les channels</option>
            {flatChannels.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.displayName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Auteur
          </label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-foreground/30 focus:outline-none"
          >
            <option value="">Tous les membres</option>
            {(membersData?.items ?? []).map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages list */}
      {isLoading ? (
        <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          Chargement...
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Aucun message à afficher.
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((m: any) => (
            <div
              key={m.id}
              className={cn(
                "rounded-xl border p-4",
                m.isPinned
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-border bg-card"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {m.author?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.author.avatarUrl}
                      alt=""
                      className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                      {(m.author?.firstName?.[0] ?? "")}
                      {(m.author?.lastName?.[0] ?? "")}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-foreground">
                        {m.author?.firstName} {m.author?.lastName}
                      </span>
                      {m.channel && (
                        <span className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          #{m.channel.displayName}
                        </span>
                      )}
                      <span className="text-muted-foreground/60">
                        {fmtDate(m.createdAt)}
                      </span>
                      {m.isEdited && (
                        <span className="text-[10px] text-muted-foreground/60">
                          (modifié)
                        </span>
                      )}
                      {m.isPinned && (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                          Épinglé
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-foreground/90">
                      {m.content}
                    </p>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => pinMutation.mutate({ messageId: m.id })}
                    disabled={pinMutation.isPending}
                    title={m.isPinned ? "Désépingler" : "Épingler"}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs",
                      m.isPinned
                        ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        : "border-border text-muted-foreground hover:bg-muted/30"
                    )}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      setConfirmDelete({
                        id: m.id,
                        preview: m.content.slice(0, 100),
                      })
                    }
                    title="Supprimer"
                    className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">
              Supprimer ce message ?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Cette action est irréversible.
            </p>
            <div className="mt-3 rounded-lg border border-border bg-background p-3 text-xs italic text-muted-foreground">
              "{confirmDelete.preview}
              {confirmDelete.preview.length >= 100 ? "..." : ""}"
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/30"
              >
                Annuler
              </button>
              <button
                onClick={() =>
                  deleteMutation.mutate({ messageId: confirmDelete.id })
                }
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
