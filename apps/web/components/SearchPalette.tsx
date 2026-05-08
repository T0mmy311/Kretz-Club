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

  const { data: messageResults } = trpc.message.searchMessages.useQuery(
    { query: debouncedQuery, limit: 8 },
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
  const messages = (messageResults?.items ?? []) as any[];
  const hasResults =
    members.length > 0 ||
    filteredChannels.length > 0 ||
    filteredInvestments.length > 0 ||
    messages.length > 0;

  const formatMessageDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays < 7) return `il y a ${diffDays}j`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const renderHighlighted = (text: string, q: string) => {
    if (!q) return text;
    const lower = text.toLowerCase();
    const qLower = q.toLowerCase();
    const idx = lower.indexOf(qLower);
    if (idx === -1) return text;
    // Show context around the match
    const start = Math.max(0, idx - 30);
    const end = Math.min(text.length, idx + qLower.length + 60);
    const before = (start > 0 ? "…" : "") + text.slice(start, idx);
    const match = text.slice(idx, idx + qLower.length);
    const after = text.slice(idx + qLower.length, end) + (end < text.length ? "…" : "");
    return (
      <>
        {before}
        <mark className="rounded bg-yellow-500/30 px-0.5 text-foreground">{match}</mark>
        {after}
      </>
    );
  };

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
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground/60" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher membres, channels, investissements..."
            className="flex-1 bg-transparent text-sm text-foreground/90 placeholder:text-muted-foreground/60 outline-none"
          />
          <button
            onClick={() => setOpen(false)}
            className="flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            <span>ESC</span>
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {!enabled && (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground/40">
              {"Tapez au moins 2 caract\u00e8res pour rechercher"}
            </div>
          )}

          {enabled && !hasResults && (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground/40">
              {"Aucun r\u00e9sultat pour \u00ab\u202f"}{debouncedQuery}{"\u202f\u00bb"}
            </div>
          )}

          {/* Members */}
          {members.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                <Users className="h-3.5 w-3.5" />
                Membres
              </div>
              {members.map((member: any) => (
                <button
                  key={member.id}
                  onClick={() => navigate(`/annuaire`)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground/80 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                    {(member.firstName?.[0] ?? "")}{(member.lastName?.[0] ?? "")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground/60">
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
              <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                <MessageSquare className="h-3.5 w-3.5" />
                Channels
              </div>
              {filteredChannels.map((channel: any) => (
                <button
                  key={channel.id}
                  onClick={() => navigate(`/messagerie`)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground/80 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                    #
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{channel.displayName}</p>
                    {channel.description && (
                      <p className="truncate text-xs text-muted-foreground/60">
                        {channel.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                <MessageSquare className="h-3.5 w-3.5" />
                Messages
              </div>
              {messages.map((msg) => {
                const isChannel = !!msg.channelId;
                const href = isChannel
                  ? `/messagerie/${msg.channelId}#message-${msg.id}`
                  : `/messagerie/dm/${msg.conversationId}#message-${msg.id}`;
                const contextLabel = isChannel
                  ? `#${msg.channel?.displayName ?? msg.channel?.name ?? "channel"}`
                  : (() => {
                      const other = msg.conversation?.participants?.[0]?.member;
                      return other
                        ? `${other.firstName} ${other.lastName}`
                        : "Conversation";
                    })();
                const authorName = `${msg.author?.firstName ?? ""} ${msg.author?.lastName ?? ""}`.trim();
                return (
                  <button
                    key={msg.id}
                    onClick={() => navigate(href)}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground/80 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                        <span className="truncate font-medium text-foreground/70">
                          {authorName || "Membre"}
                        </span>
                        <span className="truncate">dans {contextLabel}</span>
                        <span className="ml-auto shrink-0">
                          {formatMessageDate(msg.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[13px] text-foreground/80">
                        {renderHighlighted(msg.content ?? "", debouncedQuery)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Investments */}
          {filteredInvestments.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                <TrendingUp className="h-3.5 w-3.5" />
                Investissements
              </div>
              {filteredInvestments.map((inv: any) => (
                <button
                  key={inv.id}
                  onClick={() => navigate(`/investissements/${inv.id}`)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground/80 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{inv.title}</p>
                    <p className="truncate text-xs text-muted-foreground/60">
                      {inv.status} {inv.location ? `- ${inv.location}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground/40">
          <kbd className="rounded border border-border bg-muted/30 px-1.5 py-0.5 font-mono text-[10px]">
            Cmd
          </kbd>{" "}
          +{" "}
          <kbd className="rounded border border-border bg-muted/30 px-1.5 py-0.5 font-mono text-[10px]">
            K
          </kbd>{" "}
          pour ouvrir
        </div>
      </div>
    </div>
  );
}
