import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@kretz/db";
import { router, protectedProcedure } from "../trpc";
import { updateProfileSchema } from "@kretz/shared/validators";

export const memberRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const member = await prisma.member.findUnique({
      where: { id: ctx.member.id },
      include: {
        tags: {
          select: { id: true, name: true, color: true },
        },
      },
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
          tags: {
            select: { id: true, name: true, color: true },
          },
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
      // Parse dateOfBirth ISO string to Date or null
      let dobValue: Date | null | undefined = undefined;
      if (input.dateOfBirth !== undefined) {
        if (!input.dateOfBirth || input.dateOfBirth === "") {
          dobValue = null;
        } else {
          const parsed = new Date(input.dateOfBirth);
          if (!isNaN(parsed.getTime())) {
            dobValue = parsed;
          }
        }
      }

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
          instagramUrl: input.instagramUrl || null,
          twitterUrl: input.twitterUrl || null,
          websiteUrl: input.websiteUrl || null,
          facebookUrl: input.facebookUrl || null,
          ...(dobValue !== undefined ? { dateOfBirth: dobValue } : {}),
          ...(input.showBirthday !== undefined ? { showBirthday: input.showBirthday } : {}),
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

  setLocale: protectedProcedure
    .input(z.object({ locale: z.enum(["fr", "en"]) }))
    .mutation(async ({ ctx, input }) => {
      const updated = await prisma.member.update({
        where: { id: ctx.member.id },
        data: { locale: input.locale },
        select: { id: true, locale: true },
      });
      return updated;
    }),

  setTags: protectedProcedure
    .input(z.object({ tagIds: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      const updated = await prisma.member.update({
        where: { id: ctx.member.id },
        data: {
          tags: {
            set: input.tagIds.map((id) => ({ id })),
          },
        },
        include: {
          tags: { select: { id: true, name: true, color: true } },
        },
      });
      return updated;
    }),

  getBirthdaysToday: protectedProcedure.query(async () => {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const day = today.getDate();

    // Use raw SQL to compare month+day from date_of_birth.
    const members = await prisma.$queryRaw<
      Array<{
        id: string;
        first_name: string;
        last_name: string;
        avatar_url: string | null;
        profession: string | null;
      }>
    >`
      SELECT id, first_name, last_name, avatar_url, profession
      FROM members
      WHERE is_active = true
        AND show_birthday = true
        AND date_of_birth IS NOT NULL
        AND EXTRACT(MONTH FROM date_of_birth) = ${month}
        AND EXTRACT(DAY FROM date_of_birth) = ${day}
      ORDER BY first_name ASC, last_name ASC
    `;

    return members.map((m) => ({
      id: m.id,
      firstName: m.first_name,
      lastName: m.last_name,
      avatarUrl: m.avatar_url,
      profession: m.profession,
    }));
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
          tags: { select: { id: true, name: true, color: true } },
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
            tags: { select: { id: true, name: true, color: true } },
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
