import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@kretz/db";
import { router, protectedProcedure, adminProcedure } from "../trpc";

export const pollRouter = router({
  /**
   * Create a poll with options in a channel. Admin only.
   */
  create: adminProcedure
    .input(
      z.object({
        channelId: z.string().uuid(),
        question: z.string().min(1).max(500),
        options: z.array(z.string().min(1).max(200)).min(2).max(10),
        isAnonymous: z.boolean().optional().default(false),
        isMultiple: z.boolean().optional().default(false),
        endsAt: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const channel = await prisma.channel.findUnique({
        where: { id: input.channelId },
      });

      if (!channel) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Canal introuvable" });
      }

      const poll = await prisma.poll.create({
        data: {
          channelId: input.channelId,
          authorId: ctx.member.id,
          question: input.question,
          isAnonymous: input.isAnonymous,
          isMultiple: input.isMultiple,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          options: {
            create: input.options.map((text) => ({ text })),
          },
        },
        include: {
          options: true,
          author: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      });

      return poll;
    }),

  /**
   * Vote on a poll option.
   */
  vote: protectedProcedure
    .input(z.object({ optionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const option = await prisma.pollOption.findUnique({
        where: { id: input.optionId },
        include: { poll: true },
      });

      if (!option) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Option introuvable" });
      }

      if (option.poll.endsAt && new Date() > option.poll.endsAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ce sondage est terminé" });
      }

      // Check if already voted on this option
      const existingVote = await prisma.pollVote.findUnique({
        where: {
          optionId_memberId: {
            optionId: input.optionId,
            memberId: ctx.member.id,
          },
        },
      });

      // Toggle: if already voted on this option, remove the vote
      if (existingVote) {
        await prisma.pollVote.delete({ where: { id: existingVote.id } });
        return { added: false, optionId: input.optionId };
      }

      // If not multiple choice, remove any existing vote on this poll
      if (!option.poll.isMultiple) {
        await prisma.pollVote.deleteMany({
          where: {
            memberId: ctx.member.id,
            option: { pollId: option.poll.id },
          },
        });
      }

      await prisma.pollVote.create({
        data: {
          optionId: input.optionId,
          memberId: ctx.member.id,
        },
      });

      return { added: true, optionId: input.optionId };
    }),

  /**
   * Get polls for a channel with vote counts and current user's votes.
   */
  getByChannel: protectedProcedure
    .input(z.object({ channelId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const polls = await prisma.poll.findMany({
        where: { channelId: input.channelId },
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          options: {
            include: {
              votes: {
                select: {
                  id: true,
                  memberId: true,
                  member: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                  },
                },
              },
            },
          },
        },
      });

      return polls.map((poll) => ({
        ...poll,
        options: poll.options.map((option) => ({
          id: option.id,
          text: option.text,
          voteCount: option.votes.length,
          hasVoted: option.votes.some((v) => v.memberId === ctx.member.id),
          voters: poll.isAnonymous
            ? []
            : option.votes.map((v) => v.member),
        })),
      }));
    }),

  /**
   * Admin: list all polls (across all channels) with vote counts.
   */
  listAll: adminProcedure.query(async () => {
    const polls = await prisma.poll.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        channel: { select: { id: true, displayName: true, name: true, category: true } },
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        options: {
          include: {
            _count: { select: { votes: true } },
          },
        },
      },
    });

    return polls.map((poll) => ({
      ...poll,
      options: poll.options.map((option) => ({
        id: option.id,
        text: option.text,
        voteCount: option._count.votes,
      })),
      totalVotes: poll.options.reduce((sum, o) => sum + o._count.votes, 0),
    }));
  }),

  /**
   * Admin: delete a poll (and its options + votes via cascade).
   */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const existing = await prisma.poll.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sondage introuvable" });
      }

      // Cascade deletes options and votes via schema relations
      await prisma.poll.delete({ where: { id: input.id } });

      return { success: true };
    }),
});
