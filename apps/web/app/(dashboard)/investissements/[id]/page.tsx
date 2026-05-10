"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Users,
  ExternalLink,
  TrendingUp,
  Loader2,
  Euro,
  X,
  Check,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

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
    open: "bg-green-500/20 text-green-400",
    funding: "bg-green-500/20 text-green-400",
    funded: "bg-purple-500/20 text-purple-400",
    closed: "bg-muted text-muted-foreground",
    draft: "bg-yellow-500/20 text-yellow-400",
    cancelled: "bg-red-500/20 text-red-400",
  };
  return map[status] ?? "bg-muted text-muted-foreground";
}

export default function InvestmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const utils = trpc.useUtils();

  const { data: investment, isLoading } = trpc.investment.getById.useQuery({ id });

  const [showInterestForm, setShowInterestForm] = useState(false);
  const [interestAmount, setInterestAmount] = useState("");
  const [interestNotes, setInterestNotes] = useState("");

  const expressInterest = trpc.investment.expressInterest.useMutation({
    onSuccess: () => {
      setShowInterestForm(false);
      setInterestAmount("");
      setInterestNotes("");
      utils.investment.getById.invalidate({ id });
    },
  });

  const withdrawInterest = trpc.investment.updateInterest.useMutation({
    onSuccess: () => {
      utils.investment.getById.invalidate({ id });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/80" />
      </div>
    );
  }

  if (!investment) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-muted-foreground/80">
        <TrendingUp className="h-12 w-12 opacity-20" />
        <p className="mt-4 text-lg font-medium">Investissement introuvable</p>
        <Link href="/investissements" className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
          Retour aux investissements
        </Link>
      </div>
    );
  }

  const target = Number(investment.targetAmount || 0);
  const current = Number(investment.currentAmount || 0);
  const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  return (
    <div className="p-4 lg:p-6">
      {/* Back button */}
      <Link
        href="/investissements"
        className="mb-6 inline-flex items-center gap-2 text-[13px] text-muted-foreground/80 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux investissements
      </Link>

      {/* Cover image */}
      <div className="relative mb-8 flex h-56 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-muted/30 to-card">
        {investment.coverImageUrl ? (
          <>
            <Image
              src={investment.coverImageUrl}
              alt={investment.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </>
        ) : (
          <TrendingUp className="h-16 w-16 text-muted-foreground/40" />
        )}
        <span
          className={cn(
            "absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-medium",
            getStatusColor(investment.status)
          )}
        >
          {getStatusLabel(investment.status)}
        </span>
      </div>

      {/* Title & location */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{investment.title}</h1>
        {investment.location && (
          <p className="mt-2 flex items-center gap-1.5 text-[14px] text-muted-foreground/80">
            <MapPin className="h-4 w-4" />
            {investment.location}
          </p>
        )}
      </div>

      {/* Key metrics */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground/80">Objectif</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{target > 0 ? formatAmount(target) : "Non défini"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground/80">Collecte actuelle</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{formatAmount(current)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground/80">Ticket minimum</p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {investment.minimumTicket ? formatAmount(investment.minimumTicket) : "Aucun"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground/80">Investisseurs</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Users className="h-4 w-4 text-muted-foreground/80" />
            {investment.interestCount}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {target > 0 && (
        <div className="mb-8 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-foreground">{formatAmount(current)}</span>
            <span className="text-muted-foreground/80">{progress.toFixed(0)}% de {formatAmount(target)}</span>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-muted/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Description */}
      {investment.description && (
        <div className="mb-8">
          <h2 className="mb-3 text-[12px] font-medium uppercase tracking-wider text-muted-foreground/80">Description</h2>
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/80">{investment.description}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mb-8 flex flex-wrap gap-3">
        {investment.deckUrl && (
          <a
            href={investment.deckUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-[14px] font-semibold text-black hover:bg-white/90 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Voir le deck
          </a>
        )}

        {investment.userInterest ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-2.5 text-[14px] font-medium text-green-400">
              <Check className="h-4 w-4" />
              {"Votre int\u00e9r\u00eat : "}{investment.userInterest.amount ? formatAmount(investment.userInterest.amount) : "Exprimé"}
            </div>
            {investment.userInterest.status !== "withdrawn" && (
              <button
                onClick={() => withdrawInterest.mutate({ investmentId: id, status: "withdrawn" })}
                disabled={withdrawInterest.isPending}
                className="flex items-center gap-2 rounded-lg border border-red-500/20 px-4 py-2.5 text-[14px] font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {withdrawInterest.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Retirer mon intérêt
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowInterestForm(true)}
            className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-5 py-2.5 text-[14px] font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Euro className="h-4 w-4" />
            {"Exprimer mon int\u00e9r\u00eat"}
          </button>
        )}
      </div>

      {/* Interest form */}
      {showInterestForm && (
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-[14px] font-semibold text-foreground">{"Exprimer mon int\u00e9r\u00eat"}</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              expressInterest.mutate({
                investmentId: id,
                amount: interestAmount ? Number(interestAmount) : undefined,
                notes: interestNotes || undefined,
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-[12px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                {"Montant souhait\u00e9 (\u20ac)"}
              </label>
              <input
                type="number"
                value={interestAmount}
                onChange={(e) => setInterestAmount(e.target.value)}
                placeholder="Ex: 50000"
                min="1"
                className="block w-full rounded-md border border-border bg-muted/30 px-4 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/40 focus:border-accent focus:outline-none focus:ring-0 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Notes (optionnel)
              </label>
              <textarea
                value={interestNotes}
                onChange={(e) => setInterestNotes(e.target.value)}
                placeholder="Questions, commentaires..."
                rows={3}
                className="block w-full rounded-md border border-border bg-muted/30 px-4 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/40 focus:border-accent focus:outline-none focus:ring-0 transition-colors resize-none"
              />
            </div>

            {expressInterest.error && (
              <p className="text-[13px] text-red-400">{expressInterest.error.message}</p>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={expressInterest.isPending}
                className="flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-[14px] font-semibold text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
              >
                {expressInterest.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirmer"
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowInterestForm(false)}
                className="rounded-md border border-border px-5 py-2.5 text-[14px] font-medium text-muted-foreground hover:bg-muted/30 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
