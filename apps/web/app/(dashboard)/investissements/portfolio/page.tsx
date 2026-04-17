"use client";

import { TrendingUp, TrendingDown, DollarSign, BarChart3, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
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

  // Calculate portfolio stats
  const totalInvested = myInvestments.reduce((sum: number, inv: any) => {
    const myInv = inv.memberInvestments?.find((mi: any) => mi.memberId === memberId);
    return sum + Number(myInv?.amount || 0);
  }, 0);

  const activeDeals = myInvestments.filter((inv: any) => inv.status === "open" || inv.status === "funding").length;
  const closedDeals = myInvestments.filter((inv: any) => inv.status === "closed" || inv.status === "funded").length;

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
                {"Cl\u00f4tur\u00e9s"}
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

          {/* Investment list */}
          {myInvestments.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-border text-muted-foreground/60">
              <BarChart3 className="h-10 w-10 opacity-20" />
              <p className="mt-4 text-[14px]">Aucun investissement</p>
              <p className="mt-1 text-[12px] text-muted-foreground/40">{"Vos investissements appara\u00eetront ici"}</p>
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
                  funded: "Financ\u00e9",
                  closed: "Cl\u00f4tur\u00e9",
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
