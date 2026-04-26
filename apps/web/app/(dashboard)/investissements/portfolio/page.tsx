"use client";

import { TrendingUp, TrendingDown, DollarSign, BarChart3, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { trpc } from "@/lib/trpc/client";

export default function PortfolioPage() {
  const { data, isLoading } = trpc.investment.list.useQuery({});
  const { data: meData } = trpc.member.me.useQuery();

  const investments = data?.items ?? [];
  const memberId = (meData as any)?.id;

  // Filter investments where current member has invested
  const myInvestments = investments.filter((inv: any) =>
    inv.memberInvestments?.some((mi: any) => mi.memberId === memberId)
  );

  const formatCurrency = (amount: any) => {
    const num = Number(amount || 0);
    return num.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Calculate portfolio stats
  const totalInvested = myInvestments.reduce((sum: number, inv: any) => {
    const myInv = inv.memberInvestments?.find((mi: any) => mi.memberId === memberId);
    return sum + Number(myInv?.amount || 0);
  }, 0);

  const activeDeals = myInvestments.filter((inv: any) => inv.status === "open" || inv.status === "funding").length;
  const closedDeals = myInvestments.filter((inv: any) => inv.status === "closed" || inv.status === "funded").length;

  // Build cumulative chart data sorted by memberInvestment.createdAt
  const myMemberInvestments = myInvestments
    .map((inv: any) => {
      const myInv = inv.memberInvestments?.find((mi: any) => mi.memberId === memberId);
      return myInv
        ? {
            date: myInv.createdAt,
            amount: Number(myInv.amount || 0),
            title: inv.title,
          }
        : null;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let cumulative = 0;
  const chartData = myMemberInvestments.map((mi: any) => {
    cumulative += mi.amount;
    return {
      date: formatDate(mi.date),
      cumulative,
      amount: mi.amount,
      title: mi.title,
    };
  });

  // Build status breakdown bar chart data
  const sumByStatus = (statuses: string[]) =>
    myInvestments
      .filter((inv: any) => statuses.includes(inv.status))
      .reduce((sum: number, inv: any) => {
        const myInv = inv.memberInvestments?.find((mi: any) => mi.memberId === memberId);
        return sum + Number(myInv?.amount || 0);
      }, 0);

  const statusData = [
    { status: "Ouverts", amount: sumByStatus(["open", "funding"]) },
    { status: "Financés", amount: sumByStatus(["funded"]) },
    { status: "Clôturés", amount: sumByStatus(["closed"]) },
  ];

  const goldColor = "#d4af37";

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="rounded-md border border-border bg-card/95 px-3 py-2 text-[12px] shadow-lg backdrop-blur">
        <p className="font-medium text-foreground/90">{label}</p>
        <p className="mt-1 text-muted-foreground">
          <span className="text-foreground/80">{formatCurrency(payload[0].value)}</span>
        </p>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6">
      <Link href="/investissements" className="mb-4 flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground/80 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Retour aux investissements
      </Link>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground">Mon portfolio</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Vue d'ensemble de vos investissements
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/60" />
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                <DollarSign className="h-3.5 w-3.5" />
                Total investi
              </div>
              <p className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(totalInvested)}</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                <BarChart3 className="h-3.5 w-3.5" />
                Deals actifs
              </div>
              <p className="mt-2 text-xl font-semibold text-foreground">{activeDeals}</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                <TrendingUp className="h-3.5 w-3.5" />
                {"Clôturés"}
              </div>
              <p className="mt-2 text-xl font-semibold text-foreground">{closedDeals}</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                <TrendingUp className="h-3.5 w-3.5" />
                Nombre de deals
              </div>
              <p className="mt-2 text-xl font-semibold text-foreground">{myInvestments.length}</p>
            </div>
          </div>

          {/* Portfolio evolution chart */}
          <div className="mb-6 rounded-lg border border-border bg-card p-4 lg:p-6">
            <h3 className="text-[14px] font-medium text-foreground/90">{"Évolution de mon portfolio"}</h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground/60">
              {"Montant cumulé investi au fil du temps"}
            </p>
            {chartData.length === 0 ? (
              <div className="mt-4 flex h-[250px] flex-col items-center justify-center rounded-md border border-dashed border-border/50 text-muted-foreground/60">
                <BarChart3 className="h-8 w-8 opacity-20" />
                <p className="mt-3 text-[13px]">Aucune donnée à afficher</p>
              </div>
            ) : (
              <div className="mt-4 -ml-2">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={goldColor} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={goldColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      stroke={goldColor}
                      strokeWidth={2}
                      fill="url(#colorGold)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Status breakdown chart */}
          <div className="mb-8 rounded-lg border border-border bg-card p-4 lg:p-6">
            <h3 className="text-[14px] font-medium text-foreground/90">{"Répartition par statut"}</h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground/60">
              Total investi par statut de deal
            </p>
            {myInvestments.length === 0 ? (
              <div className="mt-4 flex h-[200px] flex-col items-center justify-center rounded-md border border-dashed border-border/50 text-muted-foreground/60">
                <BarChart3 className="h-8 w-8 opacity-20" />
                <p className="mt-3 text-[13px]">Aucune donnée à afficher</p>
              </div>
            ) : (
              <div className="mt-4 -ml-2">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={statusData} layout="vertical" margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
                    />
                    <YAxis
                      type="category"
                      dataKey="status"
                      tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="amount" fill={goldColor} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Investment list */}
          {myInvestments.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-border text-muted-foreground/60">
              <BarChart3 className="h-10 w-10 opacity-20" />
              <p className="mt-4 text-[14px]">Aucun investissement</p>
              <p className="mt-1 text-[12px] text-muted-foreground/40">{"Vos investissements apparaîtront ici"}</p>
              <Link href="/investissements" className="mt-4 rounded-md bg-muted px-4 py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent transition-colors">
                Voir les deals ouverts
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground/60">Mes investissements</h3>
              {myInvestments.map((inv: any) => {
                const myInv = inv.memberInvestments?.find((mi: any) => mi.memberId === memberId);
                const statusColors: Record<string, string> = {
                  open: "text-green-400 bg-green-500/10",
                  funding: "text-green-400 bg-green-500/10",
                  funded: "text-blue-400 bg-blue-500/10",
                  closed: "text-muted-foreground bg-muted/50",
                };
                const statusLabels: Record<string, string> = {
                  open: "Ouvert",
                  funding: "Ouvert",
                  funded: "Financé",
                  closed: "Clôturé",
                };

                return (
                  <div key={inv.id} className="rounded-lg border border-border p-4 hover:border-border/80 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-[14px] font-medium text-foreground/80">{inv.title}</h4>
                        {inv.location && (
                          <p className="mt-0.5 text-[12px] text-muted-foreground/60">{inv.location}</p>
                        )}
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusColors[inv.status] || "text-muted-foreground bg-muted/50"}`}>
                        {statusLabels[inv.status] || inv.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-6 text-[13px]">
                      <div>
                        <span className="text-muted-foreground/60">Mon ticket</span>
                        <p className="font-medium text-foreground/80">{formatCurrency(myInv?.amount)}</p>
                      </div>
                      {inv.targetAmount && (
                        <div>
                          <span className="text-muted-foreground/60">Objectif</span>
                          <p className="font-medium text-foreground/80">{formatCurrency(inv.targetAmount)}</p>
                        </div>
                      )}
                      {inv.deckUrl && (
                        <a
                          href={inv.deckUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto rounded-md bg-muted/50 px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-muted transition-colors"
                        >
                          Voir le deck
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
