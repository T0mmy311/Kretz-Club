"use client";

import { useState, useMemo } from "react";
import { BarChart3, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

type Category = "le_cercle" | "le_grand_salon" | "thematiques" | "aide";

const CATEGORY_LABELS: Record<Category, string> = {
  le_cercle: "Le Cercle",
  le_grand_salon: "Le Grand Salon",
  thematiques: "Thématiques",
  aide: "Aide",
};

type SortKey =
  | "displayName"
  | "messages"
  | "messagesLast7Days"
  | "members";
type SortDir = "asc" | "desc";

export default function AdminChannelStatsPage() {
  const { data: rawStats, isLoading } = trpc.admin.channelStats.useQuery();
  const [sortKey, setSortKey] = useState<SortKey>("messages");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const stats = (rawStats ?? []) as any[];

  const sorted = useMemo(() => {
    const arr = [...stats];
    arr.sort((a, b) => {
      let av: any;
      let bv: any;
      switch (sortKey) {
        case "displayName":
          av = a.displayName?.toLowerCase() ?? "";
          bv = b.displayName?.toLowerCase() ?? "";
          break;
        case "messages":
          av = a._count?.messages ?? 0;
          bv = b._count?.messages ?? 0;
          break;
        case "messagesLast7Days":
          av = a.messagesLast7Days ?? 0;
          bv = b.messagesLast7Days ?? 0;
          break;
        case "members":
          av = a._count?.members ?? 0;
          bv = b._count?.members ?? 0;
          break;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [stats, sortKey, sortDir]);

  const chartData = useMemo(() => {
    return [...stats]
      .filter((c) => (c.messagesLast7Days ?? 0) > 0)
      .sort(
        (a, b) =>
          (b.messagesLast7Days ?? 0) - (a.messagesLast7Days ?? 0)
      )
      .slice(0, 10)
      .map((c) => ({
        name: c.displayName,
        messages: c.messagesLast7Days ?? 0,
      }));
  }, [stats]);

  const totalMessages = stats.reduce(
    (acc, c) => acc + (c._count?.messages ?? 0),
    0
  );
  const totalMessages7d = stats.reduce(
    (acc, c) => acc + (c.messagesLast7Days ?? 0),
    0
  );
  const totalMembers = stats.reduce(
    (acc, c) => acc + (c._count?.members ?? 0),
    0
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) {
      return (
        <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />
      );
    }
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-muted-foreground" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Statistiques des channels
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Vue d&apos;ensemble de l&apos;activité par channel
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          Chargement...
        </div>
      ) : (
        <>
          {/* Global stat cards */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total messages
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {totalMessages.toLocaleString("fr-FR")}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Messages — 7 derniers jours
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {totalMessages7d.toLocaleString("fr-FR")}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total memberships
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {totalMembers.toLocaleString("fr-FR")}
              </p>
            </div>
          </div>

          {/* Bar chart */}
          <div className="mb-6 rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground">
              Messages par channel — 7 derniers jours
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Top 10 channels les plus actifs
            </p>
            <div className="mt-4 h-72 w-full">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Aucun message sur cette période.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 11 }}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: "12px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Bar
                      dataKey="messages"
                      fill="#fbbf24"
                      radius={[4, 4, 0, 0]}
                      name="Messages"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    <button
                      onClick={() => handleSort("displayName")}
                      className="inline-flex items-center hover:text-foreground/80"
                    >
                      Channel
                      <SortIcon k="displayName" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    <button
                      onClick={() => handleSort("messages")}
                      className="inline-flex items-center hover:text-foreground/80"
                    >
                      Total messages
                      <SortIcon k="messages" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    <button
                      onClick={() => handleSort("messagesLast7Days")}
                      className="inline-flex items-center hover:text-foreground/80"
                    >
                      Messages 7 derniers jours
                      <SortIcon k="messagesLast7Days" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    <button
                      onClick={() => handleSort("members")}
                      className="inline-flex items-center hover:text-foreground/80"
                    >
                      Membres actifs
                      <SortIcon k="members" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Top 3 contributeurs
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Aucun channel.
                    </td>
                  </tr>
                )}
                {sorted.map((c: any) => {
                  const cat = c.category as Category;
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">
                          {c.displayName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {CATEGORY_LABELS[cat] ?? cat}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">
                        {(c._count?.messages ?? 0).toLocaleString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
                            (c.messagesLast7Days ?? 0) > 0
                              ? "bg-amber-500/10 text-amber-400"
                              : "text-muted-foreground"
                          )}
                        >
                          {c.messagesLast7Days ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {c._count?.members ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        {(c.topContributors ?? []).length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        ) : (
                          <div className="flex items-center gap-3">
                            {(c.topContributors ?? []).map(
                              (tc: any, i: number) => {
                                if (!tc.member) return null;
                                const initials = `${tc.member.firstName?.[0] ?? ""}${tc.member.lastName?.[0] ?? ""}`.toUpperCase();
                                return (
                                  <div
                                    key={`${c.id}-${tc.member.id}-${i}`}
                                    className="flex items-center gap-1.5"
                                    title={`${tc.member.firstName} ${tc.member.lastName} — ${tc.messageCount} messages`}
                                  >
                                    {tc.member.avatarUrl ? (
                                      <img
                                        src={tc.member.avatarUrl}
                                        alt=""
                                        className="h-7 w-7 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                                        {initials}
                                      </div>
                                    )}
                                    <span className="text-xs tabular-nums text-muted-foreground">
                                      {tc.messageCount}
                                    </span>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
