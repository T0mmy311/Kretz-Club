import { z } from "zod";
import { prisma } from "@kretz/db";
import { router, adminProcedure } from "../trpc";

export const adminRouter = router({
  stats: adminProcedure.query(async () => {
    const [totalMembers, totalMessages, totalInvestments, totalEvents] =
      await Promise.all([
        prisma.member.count(),
        prisma.message.count(),
        prisma.investment.count(),
        prisma.event.count(),
      ]);

    return { totalMembers, totalMessages, totalInvestments, totalEvents };
  }),

  listMembers: adminProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const { cursor, limit } = input;

      const members = await prisma.member.findMany({
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { joinedAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          profession: true,
          company: true,
          city: true,
          isAdmin: true,
          isActive: true,
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

  toggleMemberActive: adminProcedure
    .input(z.object({ memberId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const member = await prisma.member.findUnique({
        where: { id: input.memberId },
        select: { isActive: true },
      });

      if (!member) {
        throw new Error("Membre introuvable");
      }

      const updated = await prisma.member.update({
        where: { id: input.memberId },
        data: { isActive: !member.isActive },
      });

      return updated;
    }),
});
