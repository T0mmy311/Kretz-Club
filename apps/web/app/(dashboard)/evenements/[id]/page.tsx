"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Euro,
  Users,
  CalendarPlus,
  Loader2,
  Check,
  X,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const utils = trpc.useUtils();

  const { data: event, isLoading } = trpc.event.getById.useQuery({ id });

  const register = trpc.event.register.useMutation({
    onSuccess: () => {
      utils.event.getById.invalidate({ id });
      toast.success("Inscription confirmée");
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de l'inscription");
    },
  });

  const unregister = trpc.event.unregister.useMutation({
    onSuccess: () => {
      utils.event.getById.invalidate({ id });
      toast.success("Inscription annulée");
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de l'annulation");
    },
  });

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Read ?payment= param once on mount, show toast, then strip it from URL.
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      toast.success("Inscription confirmée");
      utils.event.getById.invalidate({ id });
      router.replace(`/evenements/${id}`);
    } else if (payment === "cancelled") {
      toast.error("Paiement annulé");
      router.replace(`/evenements/${id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePaidCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch(`/api/checkout/event/${id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Impossible de démarrer le paiement");
        setCheckoutLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      toast.error("Erreur réseau lors du paiement");
      setCheckoutLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownloadIcs = async () => {
    if (!event) return;
    const res = await fetch(`/api/event/${event.id}/ics`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${event.title.replace(/[^a-zA-Z0-9]/g, "-")}.ics`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-muted-foreground">
        <Calendar className="h-12 w-12 opacity-20" />
        <p className="mt-4 text-lg font-medium">{"\u00c9v\u00e9nement introuvable"}</p>
        <Link href="/evenements" className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
          {"Retour aux \u00e9v\u00e9nements"}
        </Link>
      </div>
    );
  }

  const registrationCount = event.registrationCount ?? 0;
  const maxAttendees = event.maxAttendees;
  const attendeeProgress = maxAttendees ? Math.min(100, (registrationCount / maxAttendees) * 100) : 0;
  const userRegistration = event.userRegistration;
  const isRegistered =
    !!userRegistration && userRegistration.paymentStatus !== "pending";
  const hasPendingPayment =
    !!userRegistration && userRegistration.paymentStatus === "pending";
  const isPast = new Date(event.startsAt) < new Date();
  const priceEuros = Number(event.price);
  const isPaid = priceEuros > 0;

  return (
    <div className="p-4 lg:p-6">
      {/* Back button */}
      <Link
        href="/evenements"
        className="mb-6 inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {"Retour aux \u00e9v\u00e9nements"}
      </Link>

      {/* Cover image */}
      <div className="relative mb-8 flex h-56 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-muted/30 to-muted/10">
        {event.coverImageUrl ? (
          <>
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </>
        ) : (
          <Calendar className="h-16 w-16 text-muted-foreground/20" />
        )}
      </div>

      {/* Title */}
      <h1 className="mb-6 text-2xl font-bold text-foreground">{event.title}</h1>

      {/* Info cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <p className="text-[12px] font-medium uppercase tracking-wider">Date</p>
          </div>
          <p className="mt-1 text-[14px] font-medium text-foreground">{formatDate(event.startsAt)}</p>
          {event.endsAt && (
            <p className="mt-0.5 text-[13px] text-muted-foreground">{"Jusqu'\u00e0 "}{formatDate(event.endsAt)}</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <p className="text-[12px] font-medium uppercase tracking-wider">Lieu</p>
          </div>
          <p className="mt-1 text-[14px] font-medium text-foreground">{event.location || "Non pr\u00e9cis\u00e9"}</p>
          {event.address && (
            <p className="mt-0.5 text-[13px] text-muted-foreground">{event.address}</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Euro className="h-4 w-4" />
            <p className="text-[12px] font-medium uppercase tracking-wider">Prix</p>
          </div>
          <p className="mt-1 text-[14px] font-medium text-foreground">
            {Number(event.price) === 0
              ? "Gratuit"
              : `${Number(event.price).toLocaleString("fr-FR")} \u20ac`}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <p className="text-[12px] font-medium uppercase tracking-wider">Inscrits</p>
          </div>
          <p className="mt-1 text-[14px] font-medium text-foreground">
            {registrationCount}{maxAttendees ? ` / ${maxAttendees}` : ""} inscrits
          </p>
          {maxAttendees && (
            <div className="mt-2 h-1.5 rounded-full bg-muted/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
                style={{ width: `${attendeeProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="mb-8">
          <h2 className="mb-3 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Description</h2>
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/80">{event.description}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {!isPast && (
          <>
            {isRegistered ? (
              <>
                <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-5 py-2.5 text-[14px] font-medium text-green-400">
                  <Check className="h-4 w-4" />
                  {isPaid ? "Inscrit (payé)" : "Inscrit"}
                </div>
                {!isPaid && (
                  <button
                    onClick={() => unregister.mutate({ eventId: id })}
                    disabled={unregister.isPending}
                    className="flex items-center gap-2 rounded-lg border border-red-500/20 px-4 py-2.5 text-[14px] font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    {unregister.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Annuler mon inscription
                  </button>
                )}
              </>
            ) : isPaid ? (
              <button
                onClick={handlePaidCheckout}
                disabled={checkoutLoading}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirection...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    {`Payer ${priceEuros.toLocaleString("fr-FR")} €`}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => register.mutate({ eventId: id })}
                disabled={register.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {register.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "S'inscrire"
                )}
              </button>
            )}
          </>
        )}

        <button
          onClick={handleDownloadIcs}
          className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-[14px] font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          <CalendarPlus className="h-4 w-4" />
          Ajouter au calendrier
        </button>
      </div>

      {hasPendingPayment && (
        <p className="mt-4 text-[13px] text-yellow-400">
          {"Un paiement est en cours. Cliquez sur \"Payer\" pour le finaliser."}
        </p>
      )}
    </div>
  );
}
