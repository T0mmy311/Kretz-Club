"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Lock,
  Calendar,
  Users,
  Check,
  PieChart,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type PollOption = {
  id: string;
  text: string;
  voteCount: number;
  hasVoted: boolean;
  voters: Array<{
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  }>;
};

type Poll = {
  id: string;
  question: string;
  isAnonymous: boolean;
  isMultiple: boolean;
  endsAt: Date | string | null;
  createdAt: Date | string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  } | null;
  options: PollOption[];
};

export function ChannelPolls({ channelId }: { channelId: string }) {
  const utils = trpc.useUtils();
  const { data: polls, isLoading } = trpc.poll.getByChannel.useQuery(
    { channelId },
    { enabled: !!channelId }
  );
  const [collapsed, setCollapsed] = useState(false);

  const voteMutation = trpc.poll.vote.useMutation({
    onMutate: async (vars) => {
      await utils.poll.getByChannel.cancel({ channelId });
      const prev = utils.poll.getByChannel.getData({ channelId });

      utils.poll.getByChannel.setData({ channelId }, (old: any) => {
        if (!old) return old;
        return old.map((poll: any) => {
          // Find which poll the option belongs to
          const targetOption = poll.options.find(
            (o: any) => o.id === vars.optionId
          );
          if (!targetOption) return poll;

          const wasVoted = targetOption.hasVoted;

          return {
            ...poll,
            options: poll.options.map((o: any) => {
              if (o.id === vars.optionId) {
                return {
                  ...o,
                  hasVoted: !wasVoted,
                  voteCount: wasVoted ? o.voteCount - 1 : o.voteCount + 1,
                };
              }
              // For single-choice polls, remove vote on other options
              if (!poll.isMultiple && !wasVoted && o.hasVoted) {
                return {
                  ...o,
                  hasVoted: false,
                  voteCount: Math.max(0, o.voteCount - 1),
                };
              }
              return o;
            }),
          };
        });
      });

      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        utils.poll.getByChannel.setData({ channelId }, context.prev);
      }
    },
    onSettled: () => {
      utils.poll.getByChannel.invalidate({ channelId });
    },
  });

  const list = (polls ?? []) as Poll[];

  if (isLoading) return null;
  if (list.length === 0) return null;

  // Sort: active polls first, then closed
  const sorted = [...list].sort((a, b) => {
    const aClosed = a.endsAt && new Date(a.endsAt) < new Date() ? 1 : 0;
    const bClosed = b.endsAt && new Date(b.endsAt) < new Date() ? 1 : 0;
    if (aClosed !== bClosed) return aClosed - bClosed;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="border-b border-border bg-card/30">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-muted/20"
      >
        <div className="flex items-center gap-2">
          <PieChart className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
            Sondages
          </span>
          <span className="text-[11px] text-muted-foreground">
            ({list.length})
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <div className="space-y-3 px-4 pb-4">
          {sorted.map((poll) => {
            const isClosed =
              poll.endsAt && new Date(poll.endsAt) < new Date();
            const totalVotes = poll.options.reduce(
              (sum, o) => sum + o.voteCount,
              0
            );
            const hasVotedOnAny = poll.options.some((o) => o.hasVoted);
            const showResults = isClosed || hasVotedOnAny;

            return (
              <div
                key={poll.id}
                className={cn(
                  "rounded-xl border p-4 transition-colors",
                  isClosed
                    ? "border-border/60 bg-muted/10"
                    : "border-amber-500/20 bg-amber-500/5"
                )}
              >
                <div className="mb-3">
                  <p className="text-sm font-semibold text-foreground">
                    {poll.question}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    {poll.author && (
                      <span>
                        Sondage créé par{" "}
                        <span className="font-medium text-foreground/80">
                          {poll.author.firstName} {poll.author.lastName}
                        </span>
                      </span>
                    )}
                    {poll.isAnonymous && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-1.5 py-0.5">
                        <Lock className="h-3 w-3" />
                        Anonyme
                      </span>
                    )}
                    {poll.isMultiple && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-1.5 py-0.5">
                        <Check className="h-3 w-3" />
                        Choix multiples
                      </span>
                    )}
                    {poll.endsAt && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5",
                          isClosed
                            ? "bg-red-500/10 text-red-400"
                            : "bg-amber-500/10 text-amber-400"
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        {isClosed ? "Terminé" : "Fin"} le{" "}
                        {formatDate(poll.endsAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  {poll.options.map((opt) => {
                    const pct =
                      totalVotes > 0
                        ? Math.round((opt.voteCount / totalVotes) * 100)
                        : 0;

                    if (showResults) {
                      // Show result bar
                      return (
                        <div key={opt.id}>
                          <div
                            className={cn(
                              "relative overflow-hidden rounded-lg border px-3 py-2 text-xs transition-colors",
                              opt.hasVoted
                                ? "border-amber-400/40 bg-amber-500/10"
                                : "border-border/60 bg-card"
                            )}
                          >
                            <div
                              className={cn(
                                "absolute inset-y-0 left-0 transition-all",
                                opt.hasVoted
                                  ? "bg-amber-400/20"
                                  : "bg-muted/40"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                            <div className="relative flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2">
                                {opt.hasVoted && (
                                  <Check className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                                )}
                                <span className="truncate text-foreground">
                                  {opt.text}
                                </span>
                              </div>
                              <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
                                {!poll.isAnonymous &&
                                  opt.voters.length > 0 && (
                                    <div className="flex -space-x-1.5">
                                      {opt.voters.slice(0, 3).map((v) =>
                                        v.avatarUrl ? (
                                          <img
                                            key={v.id}
                                            src={v.avatarUrl}
                                            alt=""
                                            title={`${v.firstName} ${v.lastName}`}
                                            className="h-5 w-5 rounded-full border border-card object-cover"
                                          />
                                        ) : (
                                          <div
                                            key={v.id}
                                            title={`${v.firstName} ${v.lastName}`}
                                            className="flex h-5 w-5 items-center justify-center rounded-full border border-card bg-primary/10 text-[8px] font-medium text-primary"
                                          >
                                            {v.firstName[0]}
                                            {v.lastName[0]}
                                          </div>
                                        )
                                      )}
                                      {opt.voters.length > 3 && (
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-card bg-muted text-[8px] font-medium text-muted-foreground">
                                          +{opt.voters.length - 3}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                <span className="tabular-nums">
                                  {pct}%
                                </span>
                                <span className="tabular-nums opacity-70">
                                  ({opt.voteCount})
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Allow re-voting if open and not anonymous? Add a toggle button after the bar for active polls only */}
                          {!isClosed && (
                            <button
                              onClick={() =>
                                voteMutation.mutate({ optionId: opt.id })
                              }
                              disabled={voteMutation.isPending}
                              className="mt-0.5 ml-3 text-[10px] text-muted-foreground hover:text-foreground/80 disabled:opacity-40"
                            >
                              {opt.hasVoted ? "Retirer mon vote" : "Voter"}
                            </button>
                          )}
                        </div>
                      );
                    }

                    // Show clickable buttons (not yet voted, poll active)
                    return (
                      <button
                        key={opt.id}
                        onClick={() =>
                          voteMutation.mutate({ optionId: opt.id })
                        }
                        disabled={voteMutation.isPending}
                        className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-left text-xs transition-colors hover:border-amber-400/40 hover:bg-amber-500/10 disabled:opacity-50"
                      >
                        <span className="text-foreground">{opt.text}</span>
                        {voteMutation.isPending && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {totalVotes} vote(s)
                  {!showResults && (
                    <span className="ml-1 italic opacity-70">
                      — votez pour voir les résultats
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
