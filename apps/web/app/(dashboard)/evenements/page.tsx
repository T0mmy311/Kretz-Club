"use client";

import { useState } from "react";
import { Calendar, MapPin, Euro, CalendarPlus, Loader2, Check, CreditCard, List, CalendarDays } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "\u00c0 venir", value: "upcoming" },
  { label: "Pass\u00e9s", value: "past" },
];

function MonthCalendar({ events }: { events: any[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Mon = 0
  const daysInMonth = lastDay.getDate();

  const days: Array<Date | null> = Array(startWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));

  const eventsByDate = new Map<string, any[]>();
  events.forEach((e) => {
    const d = new Date(e.startsAt);
    const key = d.toDateString();
    if (!eventsByDate.has(key)) eventsByDate.set(key, []);
    eventsByDate.get(key)!.push(e);
  });

  const monthName = currentMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(new Date(year, month - 1))}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          aria-label="Mois pr\u00e9c\u00e9dent"
        >
          \u2190
        </button>
        <h3 className="text-lg font-semibold capitalize">{monthName}</h3>
        <button
          onClick={() => setCurrentMonth(new Date(year, month + 1))}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          aria-label="Mois suivant"
        >
          \u2192
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border">
        {weekdays.map((d) => (
          <div
            key={d}
            className="bg-card px-2 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {days.map((d, i) => {
          if (!d) return <div key={i} className="min-h-[96px] bg-card/50" />;
          const dayEvents = eventsByDate.get(d.toDateString()) ?? [];
          const isToday = d.toDateString() === new Date().toDateString();
          return (
            <div key={i} className="min-h-[96px] bg-card p-2">
              <div
                className={cn(
                  "text-xs font-medium",
                  isToday ? "text-primary" : "text-muted-foreground"
                )}
              >
                {d.getDate()}
              </div>
              {dayEvents.map((e) => (
                <Link
                  key={e.id}
                  href={`/evenements/${e.id}`}
                  className="mt-1 block truncate rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary hover:bg-primary/20"
                  title={e.title}
                >
                  {e.title}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function EvenementsPage() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState<string | null>(null);

  const startPaidCheckout = async (eventId: string) => {
    setErrorMsg(null);
    setCheckoutLoadingId(eventId);
    try {
      const res = await fetch(`/api/checkout/event/${eventId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setErrorMsg(data.error ?? "Impossible de démarrer le paiement");
        setCheckoutLoadingId(null);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setErrorMsg("Erreur réseau lors du paiement");
      setCheckoutLoadingId(null);
    }
  };
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.event.list.useQuery({
    status: activeTab as "upcoming" | "past",
  });
  const events = data?.items ?? [];

  const register = trpc.event.register.useMutation({
    onSuccess: () => {
      setErrorMsg(null);
      utils.event.list.invalidate();
    },
    onError: (err) => {
      setErrorMsg(err.message);
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{"\u00c9v\u00e9nements"}</h2>
        <p className="mt-1 text-muted-foreground">
          {"Retrouvez tous les \u00e9v\u00e9nements du Kretz Club"}
        </p>
      </div>

      {/* Toolbar: tabs + view toggle */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
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
            onClick={() => setViewMode("calendar")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              viewMode === "calendar"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Calendrier
          </button>
        </div>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-border/50 bg-card"
            >
              <div className="animate-pulse">
                <div className="h-40 rounded-t-xl bg-muted/50" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 rounded bg-muted/50" />
                  <div className="h-3 w-full rounded bg-muted/30" />
                  <div className="space-y-1.5 pt-1">
                    <div className="h-3 w-2/3 rounded bg-muted/30" />
                    <div className="h-3 w-1/2 rounded bg-muted/30" />
                    <div className="h-3 w-1/3 rounded bg-muted/30" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <div className="h-9 flex-1 rounded-lg bg-muted/40" />
                    <div className="h-9 w-10 rounded-lg bg-muted/30" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === "calendar" ? (
        <MonthCalendar events={events} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event: any) => (
            <div
              key={event.id}
              className="overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Cover */}
              <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                {event.coverImageUrl ? (
                  <img src={event.coverImageUrl} alt={event.title} className="h-full w-full object-cover" />
                ) : (
                  <Calendar className="h-10 w-10 text-muted-foreground/30" />
                )}
                {event.maxAttendees && (
                  <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium">
                    {event._count?.registrations ?? 0}/{event.maxAttendees} places
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <Link href={`/evenements/${event.id}`}>
                  <h3 className="font-semibold hover:underline">{event.title}</h3>
                </Link>

                {event.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
                )}

                <div className="mt-3 space-y-1.5">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(event.startsAt)}
                  </p>

                  {event.location && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.location}
                    </p>
                  )}

                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Euro className="h-3.5 w-3.5" />
                    {Number(event.price) === 0
                      ? "Gratuit"
                      : `${Number(event.price).toLocaleString("fr-FR")} \u20ac`}
                  </p>
                </div>

                <div className="mt-4 flex gap-2">
                  {(() => {
                    const priceEuros = Number(event.price);
                    const isPaid = priceEuros > 0;
                    const isCheckoutLoading = checkoutLoadingId === event.id;
                    if (event.registrations && event.registrations.length > 0) {
                      return (
                        <button
                          disabled
                          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600/20 px-4 py-2 text-sm font-medium text-green-600 cursor-default"
                        >
                          <Check className="h-4 w-4" />
                          {"Inscrit \u2713"}
                        </button>
                      );
                    }
                    if (isPaid) {
                      return (
                        <button
                          onClick={() => startPaidCheckout(event.id)}
                          disabled={isCheckoutLoading}
                          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          {isCheckoutLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Redirection...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4" />
                              {`Payer ${priceEuros.toLocaleString("fr-FR")} \u20ac`}
                            </>
                          )}
                        </button>
                      );
                    }
                    return (
                      <button
                        onClick={() => {
                          setErrorMsg(null);
                          register.mutate({ eventId: event.id });
                        }}
                        disabled={register.isPending}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        {register.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Inscription...
                          </>
                        ) : (
                          "S\u2019inscrire"
                        )}
                      </button>
                    );
                  })()}
                  <button
                    onClick={async () => {
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
                    }}
                    className="flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-accent"
                    title="Ajouter au calendrier"
                  >
                    <CalendarPlus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
