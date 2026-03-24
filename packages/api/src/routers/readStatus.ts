import { z } from "zod";
import { prisma } from "@kretz/db";
import { router, protectedProcedure } from "../trpc";

export const readStatusRouter = router({
  /**
   * Upsert ChannelReadStatus for the current member in a channel.
   * Sets lastReadAt to now.
   */
  markRead: protectedProcedure
    .input(z.object({ channelId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const memberId = ctx.member.id;
      const now = new Date();

      const status = await prisma.channelReadStatus.upsert({
        where: {
          channelId_memberId: {
            channelId: input.channelId,
            memberId,
          },
        },
        create: {
          channelId: input.channelId,
          memberId,
          lastReadAt: now,
        },
        update: {
          lastReadAt: now,
        },
      });

      return status;
    }),

  /**
   * For each channel the member is in, count messages created after lastReadAt.
   * Returns array of { channelId, unreadCount }.
   */
  getUnreadCounts: protectedProcedure.query(async ({ ctx }) => {
    const memberId = ctx.member.id;

    // Get all channels the member belongs to
    const memberships = await prisma.channelMember.findMany({
      where: { memberId },
      select: { channelId: true },
    });

    // Get all read statuses for this member
    const readStatuses = await prisma.channelReadStatus.findMany({
      where: { memberId },
      select: { channelId: true, lastReadAt: true },
    });

    const readStatusMap = new Map(
      readStatuses.map((rs) => [rs.channelId, rs.lastReadAt])
    );

    // Count unread messages for each channel
    const counts = await Promise.all(
      memberships.map(async ({ channelId }) => {
        const lastReadAt = readStatusMap.get(channelId);

        const unreadCount = await prisma.message.count({
          where: {
            channelId,
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
          },
        });

        return { channelId, unreadCount };
      })
    );

    return counts;
  }),
});
