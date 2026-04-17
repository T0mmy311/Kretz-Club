import { z } from "zod";
import { Prisma } from "@prisma/client";
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

    // Get all channels the member belongs to, with their read statuses
    const [memberships, readStatuses] = await Promise.all([
      prisma.channelMember.findMany({
        where: { memberId },
        select: { channelId: true },
      }),
      prisma.channelReadStatus.findMany({
        where: { memberId },
        select: { channelId: true, lastReadAt: true },
      }),
    ]);

    if (memberships.length === 0) return [];

    const readStatusMap = new Map(
      readStatuses.map((rs) => [rs.channelId, rs.lastReadAt])
    );

    // Build per-channel read dates for the raw query
    const channelReadDates = memberships.map(({ channelId }) => ({
      channelId,
      lastReadAt: readStatusMap.get(channelId) ?? new Date(0),
    }));

    // Count unread messages for all channels in a single SQL query
    const unreadCounts = await prisma.$queryRaw<
      { channel_id: string; unread: bigint }[]
    >(
      Prisma.sql`
        SELECT m.channel_id, COUNT(*)::bigint AS unread
        FROM messages m
        INNER JOIN (
          VALUES ${Prisma.join(
            channelReadDates.map(
              (cd) =>
                Prisma.sql`(${cd.channelId}::uuid, ${cd.lastReadAt}::timestamptz)`
            )
          )}
        ) AS cr(channel_id, last_read_at)
          ON m.channel_id = cr.channel_id
          AND m.created_at > cr.last_read_at
        GROUP BY m.channel_id
      `
    );

    const unreadMap = new Map(
      unreadCounts.map((u) => [u.channel_id, Number(u.unread)])
    );

    // Return counts for all member channels (0 if no unread)
    return memberships.map(({ channelId }) => ({
      channelId,
      unreadCount: unreadMap.get(channelId) ?? 0,
    }));
  }),
});
