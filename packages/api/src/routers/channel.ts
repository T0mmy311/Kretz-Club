import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@kretz/db";
import { router, protectedProcedure } from "../trpc";

export const channelRouter = router({
  /**
   * List all channels grouped by category, with unread count for the current member.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberId = ctx.member.id;

    const [channels, memberships] = await Promise.all([
      prisma.channel.findMany({
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          displayName: true,
          description: true,
          category: true,
          isReadOnly: true,
          sortOrder: true,
          _count: { select: { messages: true } },
        },
      }),
      prisma.channelMember.findMany({
        where: { memberId },
        select: {
          channelId: true,
          lastReadAt: true,
        },
      }),
    ]);

    // Build a lookup map for membership by channelId
    const membershipMap = new Map(
      memberships.map((m) => [m.channelId, m])
    );

    // Count unread messages per channel in a single SQL query
    // Each channel has its own lastReadAt, so we use a raw query with
    // a VALUES join to handle per-channel date filtering efficiently.
    let unreadMap = new Map<string, number>();

    if (memberships.length > 0) {
      const unreadCounts = await prisma.$queryRaw<
        { channel_id: string; unread: bigint }[]
      >(
        Prisma.sql`
          SELECT m.channel_id, COUNT(*)::bigint AS unread
          FROM messages m
          INNER JOIN (
            VALUES ${Prisma.join(
              memberships.map(
                (ms) =>
                  Prisma.sql`(${ms.channelId}::uuid, ${ms.lastReadAt ?? new Date(0)}::timestamptz)`
              )
            )}
          ) AS cm(channel_id, last_read_at)
            ON m.channel_id = cm.channel_id
            AND m.created_at > cm.last_read_at
          GROUP BY m.channel_id
        `
      );

      unreadMap = new Map(
        unreadCounts.map((u) => [u.channel_id, Number(u.unread)])
      );
    }

    // Group channels by category
    const grouped = channels.reduce<
      Record<
        string,
        {
          id: string;
          name: string;
          displayName: string;
          description: string | null;
          category: string;
          isReadOnly: boolean;
          sortOrder: number;
          isMember: boolean;
          unreadCount: number;
        }[]
      >
    >((acc, channel) => {
      const category = channel.category as string;
      if (!acc[category]) acc[category] = [];
      acc[category].push({
        id: channel.id,
        name: channel.name,
        displayName: channel.displayName,
        description: channel.description,
        category,
        isReadOnly: channel.isReadOnly,
        sortOrder: channel.sortOrder,
        isMember: membershipMap.has(channel.id),
        unreadCount: unreadMap.get(channel.id) ?? 0,
      });
      return acc;
    }, {});

    return grouped;
  }),

  /**
   * Join a channel (create ChannelMember record).
   */
  join: protectedProcedure
    .input(z.object({ channelId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const memberId = ctx.member.id;

      // Verify channel exists
      const channel = await prisma.channel.findUnique({
        where: { id: input.channelId },
      });

      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel introuvable",
        });
      }

      // Upsert to avoid duplicate errors if already a member
      const membership = await prisma.channelMember.upsert({
        where: {
          channelId_memberId: {
            channelId: input.channelId,
            memberId,
          },
        },
        create: {
          channelId: input.channelId,
          memberId,
        },
        update: {},
      });

      return membership;
    }),

  /**
   * Update lastReadAt for the authenticated member in a channel.
   */
  markRead: protectedProcedure
    .input(z.object({ channelId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const memberId = ctx.member.id;

      const membership = await prisma.channelMember.findUnique({
        where: {
          channelId_memberId: {
            channelId: input.channelId,
            memberId,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous n'êtes pas membre de ce channel",
        });
      }

      const updated = await prisma.channelMember.update({
        where: {
          channelId_memberId: {
            channelId: input.channelId,
            memberId,
          },
        },
        data: { lastReadAt: new Date() },
      });

      return updated;
    }),
});
