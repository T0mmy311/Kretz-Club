"use client";

import { useState } from "react";
import { TrendingUp, MapPin, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Tous", value: "all" },
  { label: "Ouverts", value: "open" },
  { label: "En financement", value: "funding" },
  { label: "Finances", value: "funded" },
];

export default function InvestissementsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const { data: investments, isLoading } = trpc.investment.list.useQuery();

  const filteredInvestments =
    activeTab === "all"
      ? investments
      : (
          investments as Array<{ status: string }>
        )?.filter((i) => i.status === activeTab);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Ouvert";
      case "funding":
        return "En financement";
      case "funded":
        return "Finance";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "funding":
        return "bg-blue-100 text-blue-800";
      case "funded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Investissements</h2>
        <p className="mt-1 text-muted-foreground">
          Decouvrez les opportunites d&apos;investissement du club
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-xl border bg-muted"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(
            filteredInvestments as Array<{
              id: string;
              title: string;
              location?: string;
              status: string;
              currentAmount?: number;
              targetAmount?: number;
              coverUrl?: string;
            }>
          )?.map((investment) => (
            <div
              key={investment.id}
              className="overflow-hidden rounded-xl border bg-card shadow-sm"
            >
              {/* Cover */}
              <div className="flex h-40 items-center justify-center bg-muted">
                <TrendingUp className="h-10 w-10 text-muted-foreground/30" />
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{investment.title}</h3>
                  <span
                    className={cn(
                      "flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      getStatusColor(investment.status)
                    )}
                  >
                    {getStatusLabel(investment.status)}
                  </span>
                </div>

                {investment.location && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {investment.location}
                  </p>
                )}

                {/* Progress bar */}
                {investment.targetAmount && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {(investment.currentAmount || 0).toLocaleString(
                          "fr-FR"
                        )}{" "}
                        EUR
                      </span>
                      <span className="text-muted-foreground">
                        {investment.targetAmount.toLocaleString("fr-FR")} EUR
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            ((investment.currentAmount || 0) /
                              investment.targetAmount) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Voir le deck
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
