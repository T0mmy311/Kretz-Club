"use client";

import { useState } from "react";
import { Mail, Plus, Copy, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

export default function AdminInvitationsPage() {
  const [email, setEmail] = useState("");
  const [newCode, setNewCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: invitations, isLoading } = trpc.invitation.list.useQuery();

  const createMutation = trpc.invitation.create.useMutation({
    onSuccess: (inv) => {
      setNewCode(inv.code);
      setEmail("");
      utils.invitation.list.invalidate();
      utils.audit.list.invalidate();
      toast.success(`Code créé : ${inv.code}`);
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la création de l'invitation");
    },
  });

  const deleteMutation = trpc.invitation.delete.useMutation({
    onSuccess: () => {
      utils.invitation.list.invalidate();
      utils.audit.list.invalidate();
      toast.success("Invitation supprimée");
      setConfirmDelete(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 2000);
    } catch {
      // ignore
    }
  };

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (createMutation.isPending) return;
    const trimmed = email.trim();
    createMutation.mutate(trimmed ? { email: trimmed } : {});
  };

  const getStatus = (inv: any): { label: string; tone: string } => {
    if (inv.usedAt) return { label: "Utilisée", tone: "muted" };
    if (new Date(inv.expiresAt) < new Date())
      return { label: "Expirée", tone: "red" };
    return { label: "Active", tone: "emerald" };
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-3">
        <Mail className="h-6 w-6 text-muted-foreground" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Invitations</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Codes d'invitation générés
          </p>
        </div>
      </div>

      {/* Generate form */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 text-base font-semibold text-foreground">
          Générer une invitation
        </h3>
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label
              htmlFor="invite-email"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Email invité (optionnel)
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/30 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {createMutation.isPending ? "Génération..." : "Générer un code"}
          </button>
        </form>

        {newCode && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-400/80">
                Nouveau code
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-foreground">
                {newCode}
              </p>
            </div>
            <button
              onClick={() => copy(newCode)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/30"
            >
              {copiedCode === newCode ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copier
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Invitations list */}
      <h3 className="mb-3 text-lg font-semibold text-foreground/80">
        Toutes les invitations
      </h3>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Code
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                Email
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                Créé par
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Statut
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                Expiration
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
                    <div className="h-4 w-32 animate-pulse rounded bg-muted/50" />
                  </td>
                </tr>
              ))
            ) : (invitations ?? []).length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  Aucune invitation pour le moment.
                </td>
              </tr>
            ) : (
              (invitations ?? []).map((inv: any) => {
                const status = getStatus(inv);
                const isUsed = !!inv.usedAt;
                return (
                  <tr
                    key={inv.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold tracking-wider text-foreground">
                        {inv.code}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {inv.email || "-"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {inv.invitedBy
                        ? `${inv.invitedBy.firstName} ${inv.invitedBy.lastName}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                          status.tone === "emerald" &&
                            "bg-emerald-500/10 text-emerald-400",
                          status.tone === "red" && "bg-red-500/10 text-red-400",
                          status.tone === "muted" &&
                            "bg-muted/40 text-muted-foreground"
                        )}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {formatDate(inv.expiresAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copy(inv.code)}
                          title="Copier le code"
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-foreground/80 hover:bg-muted/30"
                        >
                          {copiedCode === inv.code ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        {!isUsed && (
                          <button
                            onClick={() => setConfirmDelete(inv.id)}
                            disabled={deleteMutation.isPending}
                            title="Supprimer"
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">
              Êtes-vous sûr ?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Cette invitation sera supprimée définitivement.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/30"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteMutation.mutate({ id: confirmDelete })}
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
