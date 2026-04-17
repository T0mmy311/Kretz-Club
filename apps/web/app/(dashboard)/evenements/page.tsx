"use client";

import { useState } from "react";
import { Calendar, MapPin, Euro, CalendarPlus, Loader2, Check } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "A venir", value: "upcoming" },
  { label: "Passes", value: "past" },
];

export default function EvenementsPage() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
        <h2 className="text-2xl font-bold">Evenements</h2>
        <p className="mt-1 text-muted-foreground">
          Retrouvez tous les evenements du Kretz Club
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
              className="h-72 animate-pulse rounded-xl border bg-muted"
            />
          ))}
        </div>
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
                <h3 className="font-semibold">{event.title}</h3>

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
                  {event.registrations && event.registrations.length > 0 ? (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600/20 px-4 py-2 text-sm font-medium text-green-600 cursor-default"
                    >
                      <Check className="h-4 w-4" />
                      {"Inscrit \u2713"}
                    </button>
                  ) : (
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
                  )}
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
