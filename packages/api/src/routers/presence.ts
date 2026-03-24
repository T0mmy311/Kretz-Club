import { z } from "zod";
import { prisma } from "@kretz/db";
import { router, protectedProcedure } from "../trpc";

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export const presenceRouter = router({
  /**
   * Update member's last_seen_at and set is_online=true.
   * Upserts the MemberPresence record.
   */
  heartbeat: protectedProcedure.mutation(async ({ ctx }) => {
    const memberId = ctx.member.id;
    const now = new Date();

    const presence = await prisma.memberPresence.upsert({
      where: { memberId },
      create: {
        memberId,
        isOnline: true,
        lastSeenAt: now,
      },
      update: {
        isOnline: true,
        lastSeenAt: now,
      },
    });

    return presence;
  }),

  /**
   * Get list of online members (last_seen_at within last 5 minutes).
   */
  getOnline: protectedProcedure.query(async () => {
    const threshold = new Date(Date.now() - ONLINE_THRESHOLD_MS);

    const online = await prisma.memberPresence.findMany({
      where: {
        isOnline: true,
        lastSeenAt: { gte: threshold },
      },
      select: {
        memberId: true,
        lastSeenAt: true,
        statusText: true,
        statusEmoji: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return online;
  }),

  /**
   * Set a custom status (text + emoji) for the current member.
   */
  setStatus: protectedProcedure
    .input(
      z.object({
        statusText: z.string().max(100).optional(),
        statusEmoji: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const memberId = ctx.member.id;

      const presence = await prisma.memberPresence.upsert({
        where: { memberId },
        create: {
          memberId,
          isOnline: true,
          lastSeenAt: new Date(),
          statusText: input.statusText ?? null,
          statusEmoji: input.statusEmoji ?? null,
        },
        update: {
          statusText: input.statusText ?? null,
          statusEmoji: input.statusEmoji ?? null,
        },
      });

      return presence;
    }),

  /**
   * Clear the custom status for the current member.
   */
  clearStatus: protectedProcedure.mutation(async ({ ctx }) => {
    const memberId = ctx.member.id;

    const presence = await prisma.memberPresence.update({
      where: { memberId },
      data: {
        statusText: null,
        statusEmoji: null,
      },
    });

    return presence;
  }),
});
