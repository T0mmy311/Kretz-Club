"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Sparkles,
  Users,
  UserPlus,
  X,
  Pencil,
  MessageSquare,
  Briefcase,
  MapPin,
  Loader2,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const TOPICS = [
  "Investissement immobilier",
  "Off-market",
  "Optimisation fiscale",
  "Financement",
  "Promotion immobilière",
  "Rénovation",
  "Hôtellerie & courte durée",
  "Viticole",
  "International",
  "Marchés publics",
  "Levée de fonds",
  "Networking",
  "Création d'entreprise",
  "Stratégie patrimoniale",
];

type Tab = "matches" | "mentors" | "mentees";

type MemberLite = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  profession: string | null;
  company: string | null;
  city: string | null;
};

type MentorshipProfile = {
  id: string;
  memberId: string;
  role: "mentor" | "mentee" | "both";
  topics: string[];
  bio: string | null;
  yearsOfXp: number | null;
  isActive: boolean;
  member: MemberLite;
};

const ROLE_LABEL: Record<string, string> = {
  mentor: "Mentor",
  mentee: "Mentee",
  both: "Mentor & Mentee",
};

export default function MentoratPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("matches");
  const [modalOpen, setModalOpen] = useState(false);

  const { data: myProfile, isLoading: loadingMe } =
    trpc.mentorship.getMyProfile.useQuery();
  const { data: matches } = trpc.mentorship.getMatches.useQuery(undefined, {
    enabled: !!myProfile,
  });
  const { data: mentors } = trpc.mentorship.listMentors.useQuery();
  const { data: mentees } = trpc.mentorship.listMentees.useQuery();

  const createConversation = trpc.conversation.create.useMutation({
    onSuccess: (conversation: any) => {
      router.push(`/messagerie/dm/${conversation.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const renderProfileCard = (
    profile: MentorshipProfile,
    score?: number,
    commonTopics?: string[]
  ) => {
    const isMine = profile.memberId === (myProfile as any)?.memberId;
    return (
      <div
        key={profile.id}
        className="flex flex-col rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
      >
        <div className="mb-3 flex items-start gap-3">
          {profile.member.avatarUrl ? (
            <img
              src={profile.member.avatarUrl}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-gold text-sm font-bold text-black">
              {(profile.member.firstName?.[0] || "?") +
                (profile.member.lastName?.[0] || "")}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">
              {profile.member.firstName} {profile.member.lastName}
            </h3>
            {profile.member.profession && (
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3 flex-shrink-0" />
                {profile.member.profession}
              </p>
            )}
            {profile.member.city && (
              <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                {profile.member.city}
              </p>
            )}
          </div>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
              profile.role === "mentor"
                ? "bg-amber-500/15 text-amber-500"
                : profile.role === "mentee"
                  ? "bg-blue-500/15 text-blue-500"
                  : "bg-purple-500/15 text-purple-500"
            )}
          >
            {ROLE_LABEL[profile.role]}
          </span>
        </div>

        {typeof score === "number" && score > 0 && (
          <div className="mb-2 flex items-center gap-1 text-[11px] font-semibold text-amber-500">
            <Sparkles className="h-3 w-3" />
            {score} sujet{score > 1 ? "s" : ""} en commun
          </div>
        )}

        {profile.bio && (
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {profile.bio}
          </p>
        )}

        <div className="mb-3 flex flex-wrap gap-1.5">
          {profile.topics.slice(0, 6).map((topic) => {
            const isCommon = commonTopics?.includes(topic);
            return (
              <span
                key={topic}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                  isCommon
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-500"
                    : "border-border bg-muted/30 text-muted-foreground"
                )}
              >
                {topic}
              </span>
            );
          })}
          {profile.topics.length > 6 && (
            <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              +{profile.topics.length - 6}
            </span>
          )}
        </div>

        {typeof profile.yearsOfXp === "number" && (
          <p className="mb-3 text-[11px] text-muted-foreground">
            <Star className="mr-1 inline h-3 w-3" />
            {profile.yearsOfXp} an{profile.yearsOfXp > 1 ? "s" : ""} d'expérience
          </p>
        )}

        {!isMine && (
          <button
            onClick={() =>
              createConversation.mutate({ memberId: profile.memberId })
            }
            disabled={createConversation.isPending}
            className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg gradient-gold px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Contacter
          </button>
        )}
        {isMine && (
          <span className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Votre profil
          </span>
        )}
      </div>
    );
  };

  const matchItems = (matches as any)?.items ?? [];
  const mentorItems = (mentors ?? []) as unknown as MentorshipProfile[];
  const menteeItems = (mentees ?? []) as unknown as MentorshipProfile[];

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mentorat</h2>
          <p className="mt-1 text-muted-foreground">
            Partagez votre expertise ou trouvez un mentor parmi les membres
          </p>
        </div>
        {myProfile && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted/30 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Modifier mon profil
          </button>
        )}
      </div>

      {/* My profile / CTA */}
      {loadingMe ? (
        <div className="mb-6 h-32 animate-pulse rounded-xl border border-border/50 bg-card" />
      ) : !myProfile ? (
        <div className="mb-6 rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-amber-500" />
          <h3 className="mt-3 text-lg font-semibold">
            Configurer mon profil mentorat
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Indiquez si vous souhaitez mentorer, être mentoré, ou les deux.
            Le système vous suggèrera ensuite des correspondances pertinentes.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg gradient-gold px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
          >
            <UserPlus className="h-4 w-4" />
            Configurer mon profil
          </button>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-border/50 bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-gold text-black">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Mon profil mentorat
                </p>
                <p className="font-semibold">
                  {ROLE_LABEL[(myProfile as any).role]}
                  {(myProfile as any).yearsOfXp != null && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      · {(myProfile as any).yearsOfXp} an
                      {(myProfile as any).yearsOfXp > 1 ? "s" : ""} d'XP
                    </span>
                  )}
                </p>
              </div>
            </div>
            {(myProfile as any).topics?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:max-w-md sm:justify-end">
                {(myProfile as any).topics.slice(0, 4).map((t: string) => (
                  <span
                    key={t}
                    className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
                {(myProfile as any).topics.length > 4 && (
                  <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    +{(myProfile as any).topics.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { key: "matches", label: "Suggestions pour moi", icon: Sparkles },
            { key: "mentors", label: "Tous les mentors", icon: GraduationCap },
            { key: "mentees", label: "Tous les mentees", icon: Users },
          ] as { key: Tab; label: string; icon: any }[]
        ).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                tab === t.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Lists */}
      {tab === "matches" && (
        <>
          {!myProfile ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 text-muted-foreground">
              <Sparkles className="h-10 w-10 opacity-30" />
              <p className="mt-3 text-sm">
                Configurez votre profil pour voir des suggestions
              </p>
            </div>
          ) : matchItems.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 text-muted-foreground">
              <Sparkles className="h-10 w-10 opacity-30" />
              <p className="mt-3 text-sm">Aucune suggestion pour l'instant</p>
              <p className="mt-1 text-xs">
                Ajoutez plus de sujets à votre profil pour élargir les correspondances
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matchItems.map((m: any) =>
                renderProfileCard(m.profile, m.score, m.commonTopics)
              )}
            </div>
          )}
        </>
      )}

      {tab === "mentors" && (
        <>
          {mentorItems.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 text-muted-foreground">
              <GraduationCap className="h-10 w-10 opacity-30" />
              <p className="mt-3 text-sm">Aucun mentor pour l'instant</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mentorItems.map((p) => renderProfileCard(p))}
            </div>
          )}
        </>
      )}

      {tab === "mentees" && (
        <>
          {menteeItems.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 text-muted-foreground">
              <Users className="h-10 w-10 opacity-30" />
              <p className="mt-3 text-sm">Aucun mentee pour l'instant</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {menteeItems.map((p) => renderProfileCard(p))}
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <MentorshipProfileModal
          existing={(myProfile ?? null) as any}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function MentorshipProfileModal({
  existing,
  onClose,
}: {
  existing: MentorshipProfile | null;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();

  const [role, setRole] = useState<"mentor" | "mentee" | "both">(
    existing?.role ?? "mentor"
  );
  const [topics, setTopics] = useState<string[]>(existing?.topics ?? []);
  const [bio, setBio] = useState(existing?.bio ?? "");
  const [yearsOfXp, setYearsOfXp] = useState<string>(
    existing?.yearsOfXp != null ? String(existing.yearsOfXp) : ""
  );

  const upsert = trpc.mentorship.upsertProfile.useMutation({
    onSuccess: () => {
      toast.success(existing ? "Profil mis à jour" : "Profil créé");
      utils.mentorship.getMyProfile.invalidate();
      utils.mentorship.getMatches.invalidate();
      utils.mentorship.listMentors.invalidate();
      utils.mentorship.listMentees.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const deactivate = trpc.mentorship.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Profil mentorat désactivé");
      utils.mentorship.getMyProfile.invalidate();
      utils.mentorship.listMentors.invalidate();
      utils.mentorship.listMentees.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleTopic = (t: string) => {
    setTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topics.length === 0) {
      toast.error("Sélectionnez au moins un sujet");
      return;
    }
    const xp = yearsOfXp.trim() === "" ? null : Number(yearsOfXp);
    if (xp != null && (Number.isNaN(xp) || xp < 0)) {
      toast.error("Années d'expérience invalides");
      return;
    }
    upsert.mutate({
      role,
      topics,
      bio: bio.trim() || null,
      yearsOfXp: xp,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-lg font-semibold">
            {existing ? "Modifier mon profil mentorat" : "Configurer mon profil mentorat"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/30 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Je souhaite
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  { key: "mentor", label: "Mentorer" },
                  { key: "mentee", label: "Être mentoré" },
                  { key: "both", label: "Les deux" },
                ] as { key: "mentor" | "mentee" | "both"; label: string }[]
              ).map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => setRole(opt.key)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    role === opt.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted/30"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Sujets ({topics.length} sélectionné{topics.length > 1 ? "s" : ""})
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TOPICS.map((t) => {
                const selected = topics.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTopic(t)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      selected
                        ? "border-amber-500 bg-amber-500/15 text-amber-500"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Bio (optionnel)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Pourquoi je veux mentorer / ce que je cherche..."
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">
              {bio.length}/2000
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Années d'expérience (optionnel)
            </label>
            <input
              type="number"
              min={0}
              max={80}
              value={yearsOfXp}
              onChange={(e) => setYearsOfXp(e.target.value)}
              placeholder="Ex : 12"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            {existing && (existing as any).isActive && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Désactiver votre profil mentorat ?")) {
                    deactivate.mutate();
                  }
                }}
                disabled={deactivate.isPending}
                className="rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-60"
              >
                Désactiver mon profil
              </button>
            )}
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={upsert.isPending}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={upsert.isPending || topics.length === 0}
                className="inline-flex items-center gap-2 rounded-lg gradient-gold px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Enregistrer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
