"use client";

import { useState } from "react";
import { TrendingUp, MapPin, ExternalLink, Users, Loader2, BarChart3 } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Tous", value: "all" },
  { label: "Ouverts", value: "open" },
  { label: "Financ\u00e9s", value: "funded" },
  { label: "Cl\u00f4tur\u00e9s", value: "closed" },
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
    funded: "Financ\u00e9",
    closed: "Cl\u00f4tur\u00e9",
    cancelled: "Annul\u00e9",
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
  const { data, isLoading } = trpc.investment.list.useQuery({});

  const investments = data?.items ?? [];
  const filtered = activeTab === "all"
    ? investments
    : activeTab === "open"
    ? investments.filter((i: any) => i.status === "open" || i.status === "funding")
    : investments.filter((i: any) => i.status === activeTab);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Investissements</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {"D\u00e9couvrez les opportunit\u00e9s d\u2019investissement du Kretz Club"}
          </p>
        </div>
        <Link
          href="/investissements/portfolio"
          className="flex items-center gap-2 rounded-md bg-muted/50 px-4 py-2 text-[13px] font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          <BarChart3 className="h-4 w-4" />
          Mon portfolio
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
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

      {/* Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
          <TrendingUp className="h-12 w-12 opacity-20" />
          <p className="mt-4 text-lg font-medium">
            {"Aucun investissement"}
          </p>
          <p className="mt-1 text-sm">
            {activeTab === "all"
              ? "Les deals appara\u00eetront ici d\u00e8s qu\u2019ils seront publi\u00e9s"
              : "Aucun deal avec ce statut"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((investment: any) => {
            const target = Number(investment.targetAmount || 0);
            const current = Number(investment.currentAmount || 0);
            const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;

            return (
              <div
                key={investment.id}
                className="overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Cover */}
                <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  {investment.coverImageUrl ? (
                    <img
                      src={investment.coverImageUrl}
                      alt={investment.title}
                      className="h-full w-full object-cover"
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

                  {/* Interest count */}
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {investment._count?.memberInvestments ?? 0} {"int\u00e9ress\u00e9(s)"}
                  </div>

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
                      {"D\u00e9tails"}
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
