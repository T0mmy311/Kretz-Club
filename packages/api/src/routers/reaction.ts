import { z } from "zod";
import { prisma } from "@kretz/db";
import { router, protectedProcedure } from "../trpc";

export const reactionRouter = router({
  /**
   * Toggle a reaction (emoji) on a message.
   * If the reaction already exists for this member+message+emoji, remove it.
   * Otherwise, create it.
   */
  toggle: protectedProcedure
    .input(
      z.object({
        messageId: z.string().uuid(),
        emoji: z.string().min(1).max(32),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const memberId = ctx.member.id;
      const { messageId, emoji } = input;

      const existing = await prisma.messageReaction.findUnique({
        where: {
          messageId_memberId_emoji: {
            messageId,
            memberId,
            emoji,
          },
        },
      });

      if (existing) {
        await prisma.messageReaction.delete({
          where: { id: existing.id },
        });
        return { added: false, emoji };
      }

      await prisma.messageReaction.create({
        data: {
          messageId,
          memberId,
          emoji,
        },
      });

      return { added: true, emoji };
    }),

  /**
   * Get all reactions for a message, grouped by emoji with count and member list.
   */
  getByMessage: protectedProcedure
    .input(z.object({ messageId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const reactions = await prisma.messageReaction.findMany({
        where: { messageId: input.messageId },
        select: {
          emoji: true,
          memberId: true,
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

      // Group by emoji
      const grouped = reactions.reduce<
        Record<
          string,
          {
            emoji: string;
            count: number;
            members: {
              id: string;
              firstName: string;
              lastName: string;
              avatarUrl: string | null;
            }[];
            hasReacted: boolean;
          }
        >
      >((acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = {
            emoji: reaction.emoji,
            count: 0,
            members: [],
            hasReacted: false,
          };
        }
        acc[reaction.emoji].count++;
        acc[reaction.emoji].members.push(reaction.member);
        if (reaction.memberId === ctx.member.id) {
          acc[reaction.emoji].hasReacted = true;
        }
        return acc;
      }, {});

      return Object.values(grouped);
    }),
});
