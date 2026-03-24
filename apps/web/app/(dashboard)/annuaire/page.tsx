"use client";

import { useState } from "react";
import { Search, Building2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function AnnuairePage() {
  const [search, setSearch] = useState("");
  const { data: members, isLoading } = trpc.member.list.useQuery();

  const filteredMembers = search
    ? (
        members as Array<{
          firstName?: string;
          lastName?: string;
          profession?: string;
          company?: string;
        }>
      )?.filter(
        (m) =>
          `${m.firstName} ${m.lastName} ${m.profession} ${m.company}`
            .toLowerCase()
            .includes(search.toLowerCase())
      )
    : members;

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${(firstName || "?")[0]}${(lastName || "")[0] || ""}`.toUpperCase();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Annuaire</h2>
        <p className="mt-1 text-muted-foreground">
          Retrouvez tous les membres du Kretz Club
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un membre..."
          className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border bg-muted"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(
            filteredMembers as Array<{
              id: string;
              firstName?: string;
              lastName?: string;
              profession?: string;
              company?: string;
            }>
          )?.map((member) => (
            <div
              key={member.id}
              className="flex flex-col items-center rounded-xl border bg-card p-6 text-center shadow-sm"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {getInitials(member.firstName, member.lastName)}
              </div>
              <h3 className="mt-3 font-semibold">
                {member.firstName} {member.lastName}
              </h3>
              {member.profession && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {member.profession}
                </p>
              )}
              {member.company && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {member.company}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
