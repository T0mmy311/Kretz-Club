import { z } from "zod";
import { prisma } from "@kretz/db";
import { router, protectedProcedure } from "../trpc";

export const mentionRouter = router({
  /**
   * Get unread mentions for the current member.
   * Returns messages where the member is mentioned, with channel/conversation info.
   */
  getUnread: protectedProcedure.query(async ({ ctx }) => {
    const memberId = ctx.member.id;

    // Get the member's channel read statuses to determine what's "unread"
    const readStatuses = await prisma.channelReadStatus.findMany({
      where: { memberId },
      select: { channelId: true, lastReadAt: true },
    });

    const readStatusMap = new Map(
      readStatuses.map((rs) => [rs.channelId, rs.lastReadAt])
    );

    const mentions = await prisma.messageMention.findMany({
      where: { memberId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        message: {
          select: {
            id: true,
            content: true,
            channelId: true,
            conversationId: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            channel: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    // Filter to only unread mentions
    const unread = mentions.filter((mention) => {
      const channelId = mention.message.channelId;
      if (!channelId) return true; // DM mentions are always included
      const lastRead = readStatusMap.get(channelId);
      if (!lastRead) return true; // Never read = unread
      return mention.createdAt > lastRead;
    });

    return unread;
  }),

  /**
   * Mark all mentions as read up to a given timestamp.
   * This updates the member's channel read statuses for channels
   * where they have mentions.
   */
  markRead: protectedProcedure
    .input(
      z.object({
        upTo: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const memberId = ctx.member.id;

      // Get all mentions up to the timestamp to find affected channels
      const mentions = await prisma.messageMention.findMany({
        where: {
          memberId,
          createdAt: { lte: input.upTo },
        },
        select: {
          message: {
            select: { channelId: true },
          },
        },
      });

      // Get unique channel IDs from the mentions
      const channelIds = [
        ...new Set(
          mentions
            .map((m) => m.message.channelId)
            .filter((id): id is string => id !== null)
        ),
      ];

      // Upsert read status for each affected channel
      await Promise.all(
        channelIds.map((channelId) =>
          prisma.channelReadStatus.upsert({
            where: {
              channelId_memberId: { channelId, memberId },
            },
            create: {
              channelId,
              memberId,
              lastReadAt: input.upTo,
            },
            update: {
              lastReadAt: input.upTo,
            },
          })
        )
      );

      return { success: true, channelsUpdated: channelIds.length };
    }),
});
