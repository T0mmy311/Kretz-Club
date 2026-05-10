"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Cake, X, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function BirthdayBanner() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const { data: birthdayPeople, isLoading } = trpc.member.getBirthdaysToday.useQuery(
    undefined,
    {
      // Auto-refetch every hour - the day might roll over
      refetchInterval: 60 * 60 * 1000,
      retry: false,
    }
  );

  const { data: meData } = trpc.member.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const currentMemberId = (meData as any)?.id;

  const createConversation = trpc.conversation.create.useMutation({
    onSuccess: (data) => {
      router.push(`/messagerie/dm/${data.id}`);
    },
  });

  if (isLoading || dismissed) return null;
  if (!birthdayPeople || birthdayPeople.length === 0) return null;

  // Filter out current user (no need to wish yourself happy birthday)
  const others = birthdayPeople.filter((p) => p.id !== currentMemberId);
  if (others.length === 0) {
    // It's only the current user's birthday - show a "Joyeux anniversaire" banner
    return (
      <div className="relative mx-4 mt-4 lg:mx-6 overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-yellow-400/10 to-amber-500/15 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-black shadow-md">
            <Cake className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-foreground">
              {"🎂 Joyeux anniversaire ! Toute l'équipe Kretz Club vous souhaite une merveilleuse journée."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted/50"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const handleSendMessage = (memberId: string) => {
    createConversation.mutate({ memberId });
  };

  const formatNames = (people: { firstName: string; lastName: string }[]) => {
    if (people.length === 1) {
      return `${people[0].firstName} ${people[0].lastName}`;
    }
    if (people.length === 2) {
      return `${people[0].firstName} ${people[0].lastName} et ${people[1].firstName} ${people[1].lastName}`;
    }
    const firstNames = people.slice(0, -1).map((p) => p.firstName).join(", ");
    const last = people[people.length - 1];
    return `${firstNames} et ${last.firstName}`;
  };

  return (
    <div className="relative mx-4 mt-4 lg:mx-6 overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-yellow-400/10 to-amber-500/15 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-black shadow-md">
          <Cake className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-foreground">
            {"🎂 Aujourd'hui c'est l'anniversaire de "}
            <span className="text-amber-500">{formatNames(others)}</span>
            {" !"}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground/80">
            {"Envoyez-leur un mot pour leur souhaiter une belle journée."}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {others.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => handleSendMessage(person.id)}
                disabled={createConversation.isPending}
                className="group flex items-center gap-2 rounded-full border border-amber-500/40 bg-background/40 px-2.5 py-1 text-[12px] font-medium text-foreground hover:bg-amber-500/10 hover:border-amber-500/70 transition-colors disabled:opacity-50"
              >
                {person.avatarUrl ? (
                  <img
                    src={person.avatarUrl}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-[9px] font-bold text-black">
                    {(person.firstName?.[0] || "?").toUpperCase()}
                    {(person.lastName?.[0] || "").toUpperCase()}
                  </div>
                )}
                <span>
                  {person.firstName} {person.lastName}
                </span>
                {createConversation.isPending && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted/50"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
