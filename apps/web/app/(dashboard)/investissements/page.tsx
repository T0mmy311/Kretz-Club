"use client";

import { useState } from "react";
import { TrendingUp, MapPin, ExternalLink, Users, BarChart3, List, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { InvestmentMap } from "@/components/InvestmentMap";

const tabs = [
  { label: "Tous", value: "all" },
  { label: "Ouverts", value: "open" },
  { label: "Financés", value: "funded" },
  { label: "Clôturés", value: "closed" },
];

function formatAmount(amount: any) {
  const num = typeof amount === "object" ? Number(amount) : Number(amount || 0);
  return num.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    draft: "Brouillon",
    open: "Ouvert",
    funding: "Ouvert",
    funded: "Financé",
    closed: "Clôturé",
    cancelled: "Annulé",
  };
  return map[status] ?? status;
}

function getStatusColor(status: string) {
  const map: Record<string, string> = {
    open: "bg-green-100 text-green-800",
    funding: "bg-green-100 text-green-800",
    funded: "bg-purple-100 text-purple-800",
    closed: "bg-gray-100 text-gray-800",
    draft: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
}

export default function InvestissementsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const { data, isLoading } = trpc.investment.list.useQuery({});

  const investments = data?.items ?? [];
  const filtered = activeTab === "all"
    ? investments
    : activeTab === "open"
    ? investments.filter((i: any) => i.status === "open" || i.status === "funding")
    : investments.filter((i: any) => i.status === activeTab);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Investissements</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {"Découvrez les opportunités d’investissement du Kretz Club"}
          </p>
        </div>
        <Link
          href="/investissements/portfolio"
          className="inline-flex w-fit items-center gap-2 rounded-md bg-muted/50 px-4 py-2 text-[13px] font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          <BarChart3 className="h-4 w-4" />
          Mon portfolio
        </Link>
      </div>

      {/* Toolbar: tabs + view toggle */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.value
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              viewMode === "list"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
            Liste
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              viewMode === "map"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MapIcon className="h-4 w-4" />
            Carte
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-border/50 bg-card p-0"
            >
              <div className="animate-pulse">
                <div className="h-40 rounded-t-xl bg-muted/50" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 rounded bg-muted/50" />
                  <div className="h-3 w-1/2 rounded bg-muted/30" />
                  <div className="h-3 w-full rounded bg-muted/30" />
                  <div className="h-2 w-full rounded-full bg-muted/40" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-8 flex-1 rounded-lg bg-muted/40" />
                    <div className="h-8 flex-1 rounded-lg bg-muted/30" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === "map" ? (
        <InvestmentMap investments={filtered as any} />
      ) : filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
          <TrendingUp className="h-12 w-12 opacity-20" />
          <p className="mt-4 text-lg font-medium">
            {"Aucun investissement"}
          </p>
          <p className="mt-1 text-sm">
            {activeTab === "all"
              ? "Les deals apparaîtront ici dès qu’ils seront publiés"
              : "Aucun deal avec ce statut"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((investment: any) => {
            const target = Number(investment.targetAmount || 0);
            const current = Number(investment.currentAmount || 0);
            const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
            const totalInvestors = investment._count?.memberInvestments ?? 0;
            const investorList = investment.memberInvestments ?? [];

            return (
              <div
                key={investment.id}
                className="overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Cover */}
                <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  {investment.coverImageUrl ? (
                    <Image
                      src={investment.coverImageUrl}
                      alt={investment.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <TrendingUp className="h-10 w-10 text-muted-foreground/30" />
                  )}
                  <span
                    className={cn(
                      "absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      getStatusColor(investment.status)
                    )}
                  >
                    {getStatusLabel(investment.status)}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold leading-tight">{investment.title}</h3>

                  {investment.location && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {investment.location}
                    </p>
                  )}

                  {investment.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {investment.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  {target > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{formatAmount(current)}</span>
                        <span className="text-muted-foreground">{formatAmount(target)}</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Minimum ticket */}
                  {investment.minimumTicket && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {"Ticket min. : "}{formatAmount(investment.minimumTicket)}
                    </p>
                  )}

                  {/* Co-investment indicator */}
                  {totalInvestors >= 2 ? (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-2.5 py-2">
                      <div className="flex -space-x-2">
                        {investorList.slice(0, 3).map((mi: any) => (
                          <div
                            key={mi.id}
                            className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-card bg-muted text-[10px] font-semibold"
                            title={`${mi.member?.firstName ?? ""} ${mi.member?.lastName ?? ""}`}
                          >
                            {mi.member?.avatarUrl ? (
                              <img
                                src={mi.member.avatarUrl}
                                alt=""
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              `${mi.member?.firstName?.[0] ?? "?"}${mi.member?.lastName?.[0] ?? ""}`
                            )}
                          </div>
                        ))}
                        {totalInvestors > 3 && (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold text-muted-foreground">
                            +{totalInvestors - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {"👥 Co-investissement de "}{totalInvestors}{" membres"}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {totalInvestors} {"intéressé(s)"}
                    </div>
                  )}

                  {/* CTA */}
                  <div className="mt-4 flex gap-2">
                    {investment.deckUrl && (
                      <a
                        href={investment.deckUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Voir le deck
                      </a>
                    )}
                    <Link
                      href={`/investissements/${investment.id}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
                    >
                      {"Détails"}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
