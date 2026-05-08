"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Building2,
  Phone,
  ExternalLink,
  MessageSquare,
  Calendar,
  Loader2,
  User,
  Star,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: member, isLoading } = trpc.member.getById.useQuery({ id });
  const { data: meData } = trpc.member.me.useQuery();
  const currentMemberId = (meData as any)?.id;

  const createConversation = trpc.conversation.create.useMutation({
    onSuccess: (data) => {
      router.push(`/messagerie/dm/${data.id}`);
    },
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${(firstName || "?")[0]}${(lastName || "")[0] || ""}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/80" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-muted-foreground/80">
        <User className="h-12 w-12 opacity-20" />
        <p className="mt-4 text-lg font-medium">Membre introuvable</p>
        <Link href="/annuaire" className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
          {"Retour \u00e0 l'annuaire"}
        </Link>
      </div>
    );
  }

  const isMe = currentMemberId === member.id;

  return (
    <div className="p-4 lg:p-6">
      {/* Back button */}
      <Link
        href="/annuaire"
        className="mb-6 inline-flex items-center gap-2 text-[13px] text-muted-foreground/80 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {"Retour \u00e0 l'annuaire"}
      </Link>

      {/* Profile header - centered */}
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={`${member.firstName} ${member.lastName}`}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full gradient-gold text-2xl font-bold text-black">
              {getInitials(member.firstName, member.lastName)}
            </div>
          )}

          {/* Name */}
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            {member.firstName} {member.lastName}
          </h1>

          {/* Profession & Company */}
          {member.profession && (
            <p className="mt-2 flex items-center gap-1.5 text-[14px] text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              {member.profession}
            </p>
          )}
          {member.company && (
            <p className="mt-1 flex items-center gap-1.5 text-[14px] text-muted-foreground/80">
              <Building2 className="h-4 w-4" />
              {member.company}
            </p>
          )}

          {/* City */}
          {member.city && (
            <p className="mt-1 flex items-center gap-1.5 text-[14px] text-muted-foreground/80">
              <MapPin className="h-4 w-4" />
              {member.city}
            </p>
          )}

          {/* Joined date */}
          {member.joinedAt && (
            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground/60">
              <Calendar className="h-3.5 w-3.5" />
              {"Membre depuis "}
              {new Date(member.joinedAt).toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        {/* Bio */}
        {member.bio && (
          <div className="mt-8 rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 text-[12px] font-medium uppercase tracking-wider text-muted-foreground/80">Bio</h2>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/80">{member.bio}</p>
          </div>
        )}

        {/* Contact info */}
        {(member.linkedinUrl || member.phone) && (
          <div className="mt-4 rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 text-[12px] font-medium uppercase tracking-wider text-muted-foreground/80">Contact</h2>
            <div className="space-y-3">
              {member.linkedinUrl && (
                <a
                  href={member.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[14px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  LinkedIn
                </a>
              )}
              {member.phone && (
                <a
                  href={`tel:${member.phone}`}
                  className="flex items-center gap-2 text-[14px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {member.phone}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="mt-6 flex justify-center">
          {isMe ? (
            <Link
              href="/profil"
              className="flex items-center gap-2 rounded-lg gradient-gold px-6 py-2.5 text-[14px] font-semibold text-black hover:opacity-90 transition-opacity"
            >
              Modifier ma fiche
            </Link>
          ) : (
            <button
              onClick={() => createConversation.mutate({ memberId: member.id })}
              disabled={createConversation.isPending}
              className="flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-[14px] font-semibold text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
            >
              {createConversation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              Envoyer un message
            </button>
          )}
        </div>

        {/* Recommendations */}
        {member.receivedRecommendations && member.receivedRecommendations.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-[12px] font-medium uppercase tracking-wider text-muted-foreground/80">
              Recommandations ({member.receivedRecommendations.length})
            </h2>
            <div className="space-y-4">
              {member.receivedRecommendations.map((rec: any) => (
                <div
                  key={rec.id}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {rec.fromMember.avatarUrl ? (
                      <img
                        src={rec.fromMember.avatarUrl}
                        alt={`${rec.fromMember.firstName} ${rec.fromMember.lastName}`}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-gold text-xs font-bold text-black">
                        {getInitials(rec.fromMember.firstName, rec.fromMember.lastName)}
                      </div>
                    )}
                    <div>
                      <p className="text-[13px] font-medium text-foreground">
                        {rec.fromMember.firstName} {rec.fromMember.lastName}
                      </p>
                      {rec.fromMember.profession && (
                        <p className="text-[12px] text-muted-foreground/80">{rec.fromMember.profession}</p>
                      )}
                    </div>
                    <Star className="ml-auto h-4 w-4 text-amber-400" />
                  </div>
                  <p className="text-[14px] leading-relaxed text-foreground/70">{rec.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
