import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@kretz/db";
import { router, protectedProcedure } from "../trpc";

export const conversationRouter = router({
  /**
   * List all conversations for the current member, with the last message preview
   * and the other participant's info.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberId = ctx.member.id;

    const participations = await prisma.conversationParticipant.findMany({
      where: { memberId },
      select: {
        conversationId: true,
        lastReadAt: true,
        conversation: {
          select: {
            id: true,
            createdAt: true,
            participants: {
              select: {
                memberId: true,
                lastReadAt: true,
                member: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    profession: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                content: true,
                createdAt: true,
                authorId: true,
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          createdAt: "desc",
        },
      },
    });

    return participations.map((participation) => {
      const { conversation, lastReadAt } = participation;
      const lastMessage = conversation.messages[0] ?? null;

      // The other participant(s) in the conversation
      const otherParticipants = conversation.participants
        .filter((p) => p.memberId !== memberId)
        .map((p) => p.member);

      // Unread count: messages after lastReadAt that were not authored by current member
      const unreadCount = lastMessage &&
        lastReadAt &&
        lastMessage.createdAt > lastReadAt &&
        lastMessage.authorId !== memberId
          ? 1  // simplified: 1 means there is at least one unread message
          : 0;

      return {
        id: conversation.id,
        createdAt: conversation.createdAt,
        otherParticipants,
        lastMessage,
        lastReadAt,
        hasUnread: unreadCount > 0,
      };
    });
  }),

  /**
   * Create a new direct-message conversation with a member, or return the
   * existing one if a 1-to-1 conversation already exists between the two members.
   */
  create: protectedProcedure
    .input(z.object({ memberId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const currentMemberId = ctx.member.id;
      const { memberId: targetMemberId } = input;

      if (currentMemberId === targetMemberId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Vous ne pouvez pas démarrer une conversation avec vous-même",
        });
      }

      // Verify the target member exists and is active
      const targetMember = await prisma.member.findUnique({
        where: { id: targetMemberId },
        select: { id: true, isActive: true, firstName: true, lastName: true, avatarUrl: true },
      });

      if (!targetMember || !targetMember.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Membre introuvable",
        });
      }

      // Look for an existing 1-to-1 conversation between the two members
      const existing = await findExistingConversation(currentMemberId, targetMemberId);

      if (existing) {
        return existing;
      }

      // Create new conversation with both participants
      const conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { memberId: currentMemberId },
              { memberId: targetMemberId },
            ],
          },
        },
        select: {
          id: true,
          createdAt: true,
          participants: {
            select: {
              memberId: true,
              lastReadAt: true,
              member: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                  profession: true,
                },
              },
            },
          },
        },
      });

      return conversation;
    }),

  /**
   * Get an existing direct-message conversation between the current member and
   * another member, or create one if none exists.
   */
  getOrCreate: protectedProcedure
    .input(z.object({ memberId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const currentMemberId = ctx.member.id;
      const { memberId: targetMemberId } = input;

      if (currentMemberId === targetMemberId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Vous ne pouvez pas démarrer une conversation avec vous-même",
        });
      }

      // Verify the target member exists and is active
      const targetMember = await prisma.member.findUnique({
        where: { id: targetMemberId },
        select: { id: true, isActive: true },
      });

      if (!targetMember || !targetMember.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Membre introuvable",
        });
      }

      // Look for an existing conversation
      const existing = await findExistingConversation(currentMemberId, targetMemberId);

      if (existing) {
        return existing;
      }

      // Create a new one
      const conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { memberId: currentMemberId },
              { memberId: targetMemberId },
            ],
          },
        },
        select: {
          id: true,
          createdAt: true,
          participants: {
            select: {
              memberId: true,
              lastReadAt: true,
              member: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                  profession: true,
                },
              },
            },
          },
        },
      });

      return conversation;
    }),

  markRead: protectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.conversationParticipant.update({
        where: {
          conversationId_memberId: {
            conversationId: input.conversationId,
            memberId: ctx.member.id,
          },
        },
        data: { lastReadAt: new Date() },
      });
      return { success: true };
    }),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find an existing 1-to-1 conversation between two members.
 * A 1-to-1 conversation is one where the only two participants are the two
 * given member IDs (and no more).
 */
async function findExistingConversation(memberAId: string, memberBId: string) {
  // Find conversations where memberA participates
  const candidateParticipations = await prisma.conversationParticipant.findMany({
    where: { memberId: memberAId },
    select: { conversationId: true },
  });

  const candidateIds = candidateParticipations.map((p) => p.conversationId);
  if (candidateIds.length === 0) return null;

  // Among those, find a conversation where memberB also participates
  // and the total number of participants is exactly 2
  const conversations = await prisma.conversation.findMany({
    where: {
      id: { in: candidateIds },
      participants: {
        some: { memberId: memberBId },
      },
    },
    select: {
      id: true,
      createdAt: true,
      participants: {
        select: {
          memberId: true,
          lastReadAt: true,
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              profession: true,
            },
          },
        },
      },
    },
  });

  // Return the first conversation that has exactly 2 participants
  return conversations.find((c) => c.participants.length === 2) ?? null;
}
