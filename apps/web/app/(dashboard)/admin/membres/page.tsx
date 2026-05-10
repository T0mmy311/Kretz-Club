"use client";

import { useState } from "react";
import { Users, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

export default function AdminMembresPage() {
  const limit = 50;
  const [confirmAdmin, setConfirmAdmin] = useState<string | null>(null);
  const [confirmActive, setConfirmActive] = useState<string | null>(null);

  const { data: meData } = trpc.member.me.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const myId = (meData as any)?.id as string | undefined;

  const { data, isLoading } = trpc.admin.listMembers.useQuery({ limit });
  const utils = trpc.useUtils();

  const toggleActive = trpc.admin.toggleMemberActive.useMutation({
    onSuccess: (m) => {
      utils.admin.listMembers.invalidate();
      utils.admin.stats.invalidate();
      utils.audit.list.invalidate();
      toast.success(m.isActive ? "Membre activé" : "Membre désactivé");
      setConfirmActive(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleAdmin = trpc.admin.toggleMemberAdmin.useMutation({
    onSuccess: (m) => {
      utils.admin.listMembers.invalidate();
      utils.audit.list.invalidate();
      toast.success(m.isAdmin ? "Promu administrateur" : "Statut admin retiré");
      setConfirmAdmin(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const members = data?.items ?? [];

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-3">
        <Users className="h-6 w-6 text-muted-foreground" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Membres</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {data?.items.length ?? 0} membre(s) affichés
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Membre
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                Email
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                Profession
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                Inscrit
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Statut
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-4 w-48 animate-pulse rounded bg-muted/50" />
                    </td>
                  </tr>
                ))
              : members.map((m: any) => (
                  <tr
                    key={m.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                          {(m.firstName?.[0] ?? "")}
                          {(m.lastName?.[0] ?? "")}
                        </div>
                        <span className="text-foreground/80">
                          {m.firstName} {m.lastName}
                          {m.isAdmin && (
                            <span className="ml-1.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                              Admin
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {m.email}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {m.profession || "-"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {formatDate(m.joinedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                          m.isActive
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        )}
                      >
                        {m.isActive ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {m.id !== myId && (
                          <button
                            onClick={() => setConfirmAdmin(m.id)}
                            disabled={toggleAdmin.isPending}
                            title={m.isAdmin ? "Retirer admin" : "Promouvoir admin"}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors disabled:opacity-50",
                              m.isAdmin
                                ? "border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
                                : "border-border text-muted-foreground hover:bg-muted/30"
                            )}
                          >
                            {m.isAdmin ? (
                              <ShieldOff className="h-3.5 w-3.5" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmActive(m.id)}
                          disabled={toggleActive.isPending}
                          className={cn(
                            "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                            m.isActive
                              ? "border border-red-500/20 text-red-400 hover:bg-red-500/10"
                              : "border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                          )}
                        >
                          {m.isActive ? "Désactiver" : "Activer"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Confirm toggle admin */}
      {confirmAdmin && (
        <ConfirmDialog
          title="Modifier le statut administrateur ?"
          message="Cette action est immédiate et tracée dans le journal d'audit."
          confirmLabel="Confirmer"
          loading={toggleAdmin.isPending}
          onCancel={() => setConfirmAdmin(null)}
          onConfirm={() => toggleAdmin.mutate({ memberId: confirmAdmin })}
        />
      )}

      {/* Confirm toggle active */}
      {confirmActive && (
        <ConfirmDialog
          title="Modifier le statut du membre ?"
          message="Un membre désactivé ne peut plus se connecter."
          confirmLabel="Confirmer"
          loading={toggleActive.isPending}
          onCancel={() => setConfirmActive(null)}
          onConfirm={() => toggleActive.mutate({ memberId: confirmActive })}
        />
      )}
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  loading,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/30"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
