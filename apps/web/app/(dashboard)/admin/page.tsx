"use client";

import { useState } from "react";
import { Users, MessageSquare, TrendingUp, Calendar, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: membersData, isLoading: membersLoading } =
    trpc.admin.listMembers.useQuery({ limit });

  const toggleActive = trpc.admin.toggleMemberActive.useMutation({
    onSuccess: () => {
      utils.admin.listMembers.invalidate();
      utils.admin.stats.invalidate();
    },
  });

  const utils = trpc.useUtils();

  const members = membersData?.items ?? [];

  // Recent signups: members who joined in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentSignups = members.filter(
    (m: any) => new Date(m.joinedAt) >= thirtyDaysAgo
  );

  const statCards = [
    {
      label: "Membres",
      value: stats?.totalMembers ?? "-",
      icon: Users,
    },
    {
      label: "Messages",
      value: stats?.totalMessages ?? "-",
      icon: MessageSquare,
    },
    {
      label: "Investissements",
      value: stats?.totalInvestments ?? "-",
      icon: TrendingUp,
    },
    {
      label: "Evenements",
      value: stats?.totalEvents ?? "-",
      icon: Calendar,
    },
  ];

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-6 w-6 text-white/50" />
        <div>
          <h2 className="text-2xl font-bold text-white/90">Administration</h2>
          <p className="mt-0.5 text-sm text-white/40">
            Tableau de bord administrateur
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/[0.06] bg-[hsl(0,0%,6%)] p-5"
          >
            <div className="flex items-center justify-between">
              <stat.icon className="h-5 w-5 text-white/30" />
            </div>
            <p className="mt-3 text-2xl font-bold text-white/90">
              {statsLoading ? "..." : stat.value}
            </p>
            <p className="mt-0.5 text-xs text-white/40">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Signups */}
      {recentSignups.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-3 text-lg font-semibold text-white/80">
            Inscriptions recentes (30 jours)
          </h3>
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-4 py-3 text-left font-medium text-white/40">
                    Membre
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-white/40 sm:table-cell">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-white/40">
                    Inscription
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentSignups.map((member: any) => (
                  <tr
                    key={member.id}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="px-4 py-3 text-white/80">
                      {member.firstName} {member.lastName}
                    </td>
                    <td className="hidden px-4 py-3 text-white/50 sm:table-cell">
                      {member.email}
                    </td>
                    <td className="px-4 py-3 text-white/50">
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
        <h3 className="mb-3 text-lg font-semibold text-white/80">
          Tous les membres
        </h3>
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-4 py-3 text-left font-medium text-white/40">
                  Membre
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-white/40 sm:table-cell">
                  Email
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-white/40 md:table-cell">
                  Profession
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-white/40 lg:table-cell">
                  Ville
                </th>
                <th className="px-4 py-3 text-left font-medium text-white/40">
                  Statut
                </th>
                <th className="px-4 py-3 text-left font-medium text-white/40">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {membersLoading
                ? [...Array(5)].map((_, i) => (
                    <tr
                      key={i}
                      className="border-b border-white/[0.04]"
                    >
                      <td colSpan={6} className="px-4 py-3">
                        <div className="h-4 w-32 animate-pulse rounded bg-white/[0.06]" />
                      </td>
                    </tr>
                  ))
                : members.map((member: any) => (
                    <tr
                      key={member.id}
                      className="border-b border-white/[0.04] last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white/70">
                            {(member.firstName?.[0] ?? "")}
                            {(member.lastName?.[0] ?? "")}
                          </div>
                          <span className="text-white/80">
                            {member.firstName} {member.lastName}
                            {member.isAdmin && (
                              <span className="ml-1.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                                Admin
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-white/50 sm:table-cell">
                        {member.email}
                      </td>
                      <td className="hidden px-4 py-3 text-white/50 md:table-cell">
                        {member.profession || "-"}
                      </td>
                      <td className="hidden px-4 py-3 text-white/50 lg:table-cell">
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
                          {member.isActive ? "Desactiver" : "Activer"}
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
            <p className="text-xs text-white/30">
              Affichage des {limit} premiers membres
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
