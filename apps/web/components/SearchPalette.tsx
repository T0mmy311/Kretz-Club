"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, MessageSquare, TrendingUp, X } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  const enabled = debouncedQuery.length >= 2;

  const { data: memberResults } = trpc.member.search.useQuery(
    { query: debouncedQuery, limit: 5 },
    { enabled }
  );

  const { data: channelData } = trpc.channel.list.useQuery(undefined, {
    enabled,
  });

  const { data: investmentResults } = trpc.investment.list.useQuery(
    { limit: 50 },
    { enabled }
  );

  // Filter channels locally
  const filteredChannels = enabled
    ? Object.values(channelData ?? {})
        .flat()
        .filter((ch: any) =>
          ch.displayName?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          ch.name?.toLowerCase().includes(debouncedQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  // Filter investments locally
  const filteredInvestments = enabled
    ? (investmentResults?.items ?? [])
        .filter((inv: any) =>
          inv.title?.toLowerCase().includes(debouncedQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const members = memberResults?.items ?? [];
  const hasResults =
    members.length > 0 ||
    filteredChannels.length > 0 ||
    filteredInvestments.length > 0;

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg rounded-xl border border-white/[0.08] bg-[hsl(0,0%,6%)] shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3">
          <Search className="h-5 w-5 text-white/30" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher membres, channels, investissements..."
            className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/30 outline-none"
          />
          <button
            onClick={() => setOpen(false)}
            className="flex items-center gap-1 rounded-md border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-white/30 hover:text-white/50 transition-colors"
          >
            <span>ESC</span>
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {!enabled && (
            <div className="px-3 py-8 text-center text-sm text-white/20">
              Tapez au moins 2 caracteres pour rechercher
            </div>
          )}

          {enabled && !hasResults && (
            <div className="px-3 py-8 text-center text-sm text-white/20">
              Aucun resultat pour &quot;{debouncedQuery}&quot;
            </div>
          )}

          {/* Members */}
          {members.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-white/30">
                <Users className="h-3.5 w-3.5" />
                Membres
              </div>
              {members.map((member: any) => (
                <button
                  key={member.id}
                  onClick={() => navigate(`/annuaire`)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-white/70">
                    {(member.firstName?.[0] ?? "")}{(member.lastName?.[0] ?? "")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="truncate text-xs text-white/30">
                      {[member.profession, member.company]
                        .filter(Boolean)
                        .join(" - ")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Channels */}
          {filteredChannels.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-white/30">
                <MessageSquare className="h-3.5 w-3.5" />
                Channels
              </div>
              {filteredChannels.map((channel: any) => (
                <button
                  key={channel.id}
                  onClick={() => navigate(`/messagerie`)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-white/50">
                    #
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{channel.displayName}</p>
                    {channel.description && (
                      <p className="truncate text-xs text-white/30">
                        {channel.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Investments */}
          {filteredInvestments.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-white/30">
                <TrendingUp className="h-3.5 w-3.5" />
                Investissements
              </div>
              {filteredInvestments.map((inv: any) => (
                <button
                  key={inv.id}
                  onClick={() => navigate(`/investissements/${inv.id}`)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                    <TrendingUp className="h-4 w-4 text-white/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{inv.title}</p>
                    <p className="truncate text-xs text-white/30">
                      {inv.status} {inv.location ? `- ${inv.location}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-white/[0.08] px-4 py-2 text-[11px] text-white/20">
          <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px]">
            Cmd
          </kbd>{" "}
          +{" "}
          <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px]">
            K
          </kbd>{" "}
          pour ouvrir
        </div>
      </div>
    </div>
  );
}
