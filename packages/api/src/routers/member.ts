import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@kretz/db";
import { router, protectedProcedure } from "../trpc";
import { updateProfileSchema } from "@kretz/shared/validators";

export const memberRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const member = await prisma.member.findUnique({
      where: { id: ctx.member.id },
    });

    if (!member) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Membre introuvable" });
    }

    return member;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const member = await prisma.member.findUnique({
        where: { id: input.id },
        include: {
          receivedRecommendations: {
            where: { isPublic: true },
            include: {
              fromMember: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                  profession: true,
                  company: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Membre introuvable" });
      }

      return member;
    }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const updated = await prisma.member.update({
        where: { id: ctx.member.id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          profession: input.profession,
          bio: input.bio,
          company: input.company,
          phone: input.phone,
          city: input.city,
          linkedinUrl: input.linkedinUrl || null,
        },
      });

      return updated;
    }),

  setTheme: protectedProcedure
    .input(z.object({ theme: z.enum(["dark", "light"]) }))
    .mutation(async ({ ctx, input }) => {
      const updated = await prisma.member.update({
        where: { id: ctx.member.id },
        data: { theme: input.theme },
        select: { id: true, theme: true },
      });
      return updated;
    }),

  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const { query, cursor, limit } = input;

      const members = await prisma.member.findMany({
        where: {
          isActive: true,
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { profession: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } },
          ],
        },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          profession: true,
          company: true,
          bio: true,
          city: true,
          joinedAt: true,
        },
      });

      let nextCursor: string | undefined;
      if (members.length > limit) {
        const next = members.pop();
        nextCursor = next!.id;
      }

      return { items: members, nextCursor };
    }),

  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const { cursor, limit } = input;

      const [members, totalCount] = await Promise.all([
        prisma.member.findMany({
          where: { isActive: true },
          take: limit + 1,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            profession: true,
            company: true,
            bio: true,
            city: true,
            joinedAt: true,
          },
        }),
        prisma.member.count({ where: { isActive: true } }),
      ]);

      let nextCursor: string | undefined;
      if (members.length > limit) {
        const next = members.pop();
        nextCursor = next!.id;
      }

      return { items: members, nextCursor, totalCount };
    }),
});
