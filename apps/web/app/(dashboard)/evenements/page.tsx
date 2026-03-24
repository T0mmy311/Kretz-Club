"use client";

import { useState } from "react";
import { Calendar, MapPin, Euro } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "A venir", value: "upcoming" },
  { label: "Passes", value: "past" },
];

export default function EvenementsPage() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const { data: events, isLoading } = trpc.event.list.useQuery();

  const now = new Date();
  const filteredEvents =
    activeTab === "upcoming"
      ? (events as Array<{ date: string }>)?.filter(
          (e) => new Date(e.date) >= now
        )
      : (events as Array<{ date: string }>)?.filter(
          (e) => new Date(e.date) < now
        );

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
    <div className="p-6">
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
            filteredEvents as Array<{
              id: string;
              title: string;
              date: string;
              location?: string;
              price?: number;
              coverUrl?: string;
            }>
          )?.map((event) => (
            <div
              key={event.id}
              className="overflow-hidden rounded-xl border bg-card shadow-sm"
            >
              {/* Cover */}
              <div className="flex h-40 items-center justify-center bg-muted">
                <Calendar className="h-10 w-10 text-muted-foreground/30" />
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold">{event.title}</h3>

                <div className="mt-2 space-y-1.5">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(event.date)}
                  </p>

                  {event.location && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.location}
                    </p>
                  )}

                  {event.price !== undefined && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Euro className="h-3.5 w-3.5" />
                      {event.price === 0
                        ? "Gratuit"
                        : `${event.price.toLocaleString("fr-FR")} EUR`}
                    </p>
                  )}
                </div>

                <button className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  S&apos;inscrire
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
