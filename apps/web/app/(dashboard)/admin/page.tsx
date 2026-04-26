"use client";

import { useState } from "react";
import {
  Users,
  MessageSquare,
  TrendingUp,
  Calendar,
  Shield,
  Mail,
  Copy,
  Check,
  Trash2,
  ScrollText,
  Plus,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

type Tab = "members" | "invitations" | "audit";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("members");
  const limit = 20;

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: membersData, isLoading: membersLoading } =
    trpc.admin.listMembers.useQuery({ limit });

  const utils = trpc.useUtils();

  const toggleActive = trpc.admin.toggleMemberActive.useMutation({
    onSuccess: () => {
      utils.admin.listMembers.invalidate();
      utils.admin.stats.invalidate();
      utils.audit.list.invalidate();
    },
  });

  const members = membersData?.items ?? [];

  // Recent signups: members who joined in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentSignups = members.filter(
    (m: any) => new Date(m.joinedAt) >= thirtyDaysAgo
  );

  const statCards = [
    { label: "Membres", value: stats?.totalMembers ?? "-", icon: Users },
    { label: "Messages", value: stats?.totalMessages ?? "-", icon: MessageSquare },
    { label: "Investissements", value: stats?.totalInvestments ?? "-", icon: TrendingUp },
    { label: "Événements", value: stats?.totalEvents ?? "-", icon: Calendar },
  ];

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (date: string | Date) =>
    new Date(date).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "members", label: "Membres", icon: Users },
    { id: "invitations", label: "Invitations", icon: Mail },
    { id: "audit", label: "Audit logs", icon: ScrollText },
  ];

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-6 w-6 text-muted-foreground" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Administration</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Tableau de bord administrateur
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <stat.icon className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">
              {statsLoading ? "..." : stat.value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px",
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground/80"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "members" && (
        <>
          {/* Recent Signups */}
          {recentSignups.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-3 text-lg font-semibold text-foreground/80">
                {"Inscriptions récentes (30 jours)"}
              </h3>
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
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Inscription
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSignups.map((member: any) => (
                      <tr
                        key={member.id}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="px-4 py-3 text-foreground/80">
                          {member.firstName} {member.lastName}
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                          {member.email}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(member.joinedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All Members */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-foreground/80">
              Tous les membres
            </h3>
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
                      Ville
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {membersLoading
                    ? [...Array(5)].map((_, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="h-4 w-32 animate-pulse rounded bg-muted/50" />
                          </td>
                        </tr>
                      ))
                    : members.map((member: any) => (
                        <tr
                          key={member.id}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                                {(member.firstName?.[0] ?? "")}
                                {(member.lastName?.[0] ?? "")}
                              </div>
                              <span className="text-foreground/80">
                                {member.firstName} {member.lastName}
                                {member.isAdmin && (
                                  <span className="ml-1.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                                    Admin
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                            {member.email}
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                            {member.profession || "-"}
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                            {member.city || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                                member.isActive
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-red-500/10 text-red-400"
                              )}
                            >
                              {member.isActive ? "Actif" : "Inactif"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                toggleActive.mutate({ memberId: member.id })
                              }
                              disabled={toggleActive.isPending}
                              className={cn(
                                "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                                member.isActive
                                  ? "border border-red-500/20 text-red-400 hover:bg-red-500/10"
                                  : "border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                              )}
                            >
                              {member.isActive ? "Désactiver" : "Activer"}
                            </button>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* Pagination hint */}
            {membersData?.nextCursor && (
              <div className="mt-4 flex justify-center">
                <p className="text-xs text-muted-foreground/60">
                  Affichage des {limit} premiers membres
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "invitations" && <InvitationsTab />}
      {tab === "audit" && <AuditTab formatDateTime={formatDateTime} />}
    </div>
  );
}

// ============================================
// INVITATIONS TAB
// ============================================

function InvitationsTab() {
  const [email, setEmail] = useState("");
  const [newCode, setNewCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: invitations, isLoading } = trpc.invitation.list.useQuery();

  const createMutation = trpc.invitation.create.useMutation({
    onSuccess: (inv) => {
      setNewCode(inv.code);
      setEmail("");
      utils.invitation.list.invalidate();
      utils.audit.list.invalidate();
    },
  });

  const deleteMutation = trpc.invitation.delete.useMutation({
    onSuccess: () => {
      utils.invitation.list.invalidate();
      utils.audit.list.invalidate();
    },
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
    <div>
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

        {createMutation.error && (
          <p className="mt-3 text-xs text-red-400">
            {createMutation.error.message}
          </p>
        )}

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
                            onClick={() =>
                              deleteMutation.mutate({ id: inv.id })
                            }
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
    </div>
  );
}

// ============================================
// AUDIT LOGS TAB
// ============================================

const ACTION_LABELS: Record<string, string> = {
  "member.activate": "Activé un membre",
  "member.deactivate": "Désactivé un membre",
  "invitation.create": "Créé une invitation",
  "invitation.delete": "Supprimé une invitation",
};

function formatActionLabel(action: string) {
  return ACTION_LABELS[action] ?? action;
}

function AuditTab({
  formatDateTime,
}: {
  formatDateTime: (date: string | Date) => string;
}) {
  const { data, isLoading } = trpc.audit.list.useQuery({ limit: 50 });

  const logs = data?.items ?? [];

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-foreground/80">
        Journal d'audit
      </h3>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Acteur
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Action
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                Cible
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td colSpan={4} className="px-4 py-3">
                    <div className="h-4 w-48 animate-pulse rounded bg-muted/50" />
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  Aucune action enregistrée pour le moment.
                </td>
              </tr>
            ) : (
              logs.map((log: any) => {
                const actor = log.actor;
                const initials =
                  (actor?.firstName?.[0] ?? "") +
                  (actor?.lastName?.[0] ?? "");
                const meta = log.metadata as any;
                const target =
                  meta?.firstName && meta?.lastName
                    ? `${meta.firstName} ${meta.lastName}`
                    : meta?.code
                      ? meta.code
                      : meta?.email
                        ? meta.email
                        : log.targetType
                          ? log.targetType
                          : "-";
                return (
                  <tr
                    key={log.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {actor?.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={actor.avatarUrl}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                            {initials}
                          </div>
                        )}
                        <span className="text-foreground/80">
                          {actor
                            ? `${actor.firstName} ${actor.lastName}`
                            : "Inconnu"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground/80">
                      {formatActionLabel(log.action)}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {target}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
