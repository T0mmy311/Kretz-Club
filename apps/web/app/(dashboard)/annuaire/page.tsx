"use client";

import { useState, useCallback } from "react";
import { Search, Building2, MessageSquare, MapPin, Briefcase, X, Pencil, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

export default function AnnuairePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterProfession, setFilterProfession] = useState("");
  const [extraMembers, setExtraMembers] = useState<any[]>([]);
  const [latestCursor, setLatestCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data: meData } = trpc.member.me.useQuery();
  const currentMemberId = (meData as any)?.id;

  const { data } = trpc.member.list.useQuery({ limit: 50 });

  const utils = trpc.useUtils();

  // Track the nextCursor: use latestCursor from manual loads, or fall back to initial data
  const nextCursor = latestCursor !== undefined
    ? latestCursor
    : data?.nextCursor;

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = await utils.member.list.fetch({ limit: 50, cursor: nextCursor });
      setExtraMembers((prev) => [...prev, ...nextPage.items]);
      setLatestCursor(nextPage.nextCursor ?? "");
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore, utils.member.list]);

  const { data: searchData, isLoading } = trpc.member.search.useQuery(
    { query: search },
    { enabled: search.length >= 2 }
  );

  // Combine initial page with any extra loaded pages
  const allMembers = [...(data?.items ?? []), ...extraMembers];
  const totalCount = (data as any)?.totalCount ?? 0;
  // When no latestCursor has been set yet, use data?.nextCursor to know if there are more
  const hasMore = latestCursor !== undefined ? latestCursor !== "" : !!data?.nextCursor;
  let members = search.length >= 2 ? (searchData?.items ?? []) : allMembers;

  // Apply local filters
  if (filterCity) {
    members = members.filter((m: any) =>
      m.city?.toLowerCase().includes(filterCity.toLowerCase())
    );
  }
  if (filterProfession) {
    members = members.filter((m: any) =>
      m.profession?.toLowerCase().includes(filterProfession.toLowerCase())
    );
  }

  // Extract unique cities and professions for filter suggestions
  const cities = [...new Set(allMembers.map((m: any) => m.city).filter(Boolean))] as string[];
  const professions = [...new Set(allMembers.map((m: any) => m.profession).filter(Boolean))] as string[];

  const createConversation = trpc.conversation.create.useMutation({
    onSuccess: (data) => {
      router.push(`/messagerie/dm/${data.id}`);
    },
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${(firstName || "?")[0]}${(lastName || "")[0] || ""}`.toUpperCase();
  };

  const hasFilters = filterCity || filterProfession;

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Annuaire</h2>
        <p className="mt-1 text-muted-foreground">
          {"Retrouvez tous les membres du Kretz Club"}
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={"Rechercher par nom, m\u00e9tier, entreprise, ville..."}
            className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {/* City filter */}
          {cities.length > 0 && (
            <div className="relative">
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className={cn(
                  "appearance-none rounded-full border px-4 py-1.5 pr-8 text-xs font-medium transition-colors cursor-pointer",
                  filterCity
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                <option value="">{"🏙️ Toutes les villes"}</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {filterCity && (
                <button
                  onClick={() => setFilterCity("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-primary/20"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* Profession filter */}
          {professions.length > 0 && (
            <div className="relative">
              <select
                value={filterProfession}
                onChange={(e) => setFilterProfession(e.target.value)}
                className={cn(
                  "appearance-none rounded-full border px-4 py-1.5 pr-8 text-xs font-medium transition-colors cursor-pointer",
                  filterProfession
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                <option value="">{"💼 Tous les m\u00e9tiers"}</option>
                {professions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {filterProfession && (
                <button
                  onClick={() => setFilterProfession("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-primary/20"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {hasFilters && (
            <button
              onClick={() => { setFilterCity(""); setFilterProfession(""); }}
              className="rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              Effacer les filtres
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">
          {search.length >= 2 || hasFilters
            ? `${members.length} membre${members.length > 1 ? "s" : ""}${hasFilters ? " (filtr\u00e9s)" : ""}`
            : `Affichage de ${allMembers.length} sur ${totalCount} membres`}
        </p>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border bg-muted" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
          <Search className="h-10 w-10 opacity-20" />
          <p className="mt-4 text-sm">Aucun membre trouv\u00e9</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map((member: any) => (
            <div
              key={member.id}
              className="flex flex-col items-center rounded-xl border border-border/50 bg-card p-5 text-center shadow-sm transition-all hover:shadow-md hover:border-primary/30"
            >
              <Link href={`/annuaire/${member.id}`} className="flex flex-col items-center">
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full gradient-gold text-lg font-bold text-black">
                    {getInitials(member.firstName, member.lastName)}
                  </div>
                )}
                <h3 className="mt-3 font-semibold">
                  {member.firstName} {member.lastName}
                </h3>
                {member.profession && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    {member.profession}
                  </p>
                )}
                {member.company && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    {member.company}
                  </p>
                )}
                {member.city && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {member.city}
                  </p>
                )}
              </Link>
              {currentMemberId === member.id ? (
                <Link
                  href="/profil"
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg gradient-gold px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90 transition-opacity"
                >
                  <Pencil className="h-3 w-3" />
                  Modifier ma fiche
                </Link>
              ) : (
                <button
                  onClick={() => createConversation.mutate({ memberId: member.id })}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <MessageSquare className="h-3 w-3" />
                  Envoyer un message
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Load more button */}
      {hasMore && search.length < 2 && !hasFilters && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-6 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement...
              </>
            ) : (
              "Charger plus"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
