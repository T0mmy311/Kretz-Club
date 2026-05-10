import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@kretz/db";
import { router, protectedProcedure } from "../trpc";

const memberSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  profession: true,
  company: true,
  city: true,
} as const;

const upsertInput = z.object({
  role: z.enum(["mentor", "mentee", "both"]),
  topics: z.array(z.string().min(1).max(100)).min(1, "Sélectionnez au moins un sujet").max(20),
  bio: z.string().max(2000).optional().nullable(),
  yearsOfXp: z.number().int().min(0).max(80).optional().nullable(),
});

export const mentorshipRouter = router({
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await prisma.mentorshipProfile.findUnique({
      where: { memberId: ctx.member.id },
      include: { member: { select: memberSelect } },
    });
    return profile;
  }),

  getProfile: protectedProcedure
    .input(z.object({ memberId: z.string().uuid() }))
    .query(async ({ input }) => {
      const profile = await prisma.mentorshipProfile.findUnique({
        where: { memberId: input.memberId },
        include: { member: { select: memberSelect } },
      });
      return profile;
    }),

  upsertProfile: protectedProcedure
    .input(upsertInput)
    .mutation(async ({ ctx, input }) => {
      const profile = await prisma.mentorshipProfile.upsert({
        where: { memberId: ctx.member.id },
        update: {
          role: input.role,
          topics: input.topics,
          bio: input.bio ?? null,
          yearsOfXp: input.yearsOfXp ?? null,
          isActive: true,
        },
        create: {
          memberId: ctx.member.id,
          role: input.role,
          topics: input.topics,
          bio: input.bio ?? null,
          yearsOfXp: input.yearsOfXp ?? null,
        },
        include: { member: { select: memberSelect } },
      });
      return profile;
    }),

  deactivate: protectedProcedure.mutation(async ({ ctx }) => {
    const existing = await prisma.mentorshipProfile.findUnique({
      where: { memberId: ctx.member.id },
    });
    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Profil introuvable" });
    }
    const updated = await prisma.mentorshipProfile.update({
      where: { memberId: ctx.member.id },
      data: { isActive: false },
    });
    return updated;
  }),

  listMentors: protectedProcedure.query(async () => {
    const mentors = await prisma.mentorshipProfile.findMany({
      where: { isActive: true, role: { in: ["mentor", "both"] } },
      orderBy: { updatedAt: "desc" },
      include: { member: { select: memberSelect } },
    });
    return mentors;
  }),

  listMentees: protectedProcedure.query(async () => {
    const mentees = await prisma.mentorshipProfile.findMany({
      where: { isActive: true, role: { in: ["mentee", "both"] } },
      orderBy: { updatedAt: "desc" },
      include: { member: { select: memberSelect } },
    });
    return mentees;
  }),

  getMatches: protectedProcedure.query(async ({ ctx }) => {
    const myProfile = await prisma.mentorshipProfile.findUnique({
      where: { memberId: ctx.member.id },
    });
    if (!myProfile || !myProfile.isActive) {
      return { items: [] as Array<{ profile: any; score: number; commonTopics: string[] }> };
    }

    // Determine which roles to look for: opposite role(s)
    const targetRoles: ("mentor" | "mentee" | "both")[] = [];
    if (myProfile.role === "mentor") targetRoles.push("mentee", "both");
    else if (myProfile.role === "mentee") targetRoles.push("mentor", "both");
    else {
      // both: match anyone
      targetRoles.push("mentor", "mentee", "both");
    }

    const candidates = await prisma.mentorshipProfile.findMany({
      where: {
        isActive: true,
        role: { in: targetRoles },
        memberId: { not: ctx.member.id },
      },
      include: { member: { select: memberSelect } },
    });

    const myTopics = new Set(myProfile.topics);
    const ranked = candidates
      .map((profile) => {
        const commonTopics = profile.topics.filter((t) => myTopics.has(t));
        return { profile, score: commonTopics.length, commonTopics };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);

    return { items: ranked };
  }),
});
