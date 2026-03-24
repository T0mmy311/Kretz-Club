import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@kretz/db";
import { router, protectedProcedure } from "../trpc";
import { MESSAGES_PER_PAGE } from "@kretz/shared";

export const messageRouter = router({
  /**
   * Get messages for a channel or conversation with cursor-based pagination
   * (newest first). Includes author info.
   */
  list: protectedProcedure
    .input(
      z.object({
        channelId: z.string().uuid().optional(),
        conversationId: z.string().uuid().optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(MESSAGES_PER_PAGE),
      })
    )
    .query(async ({ ctx, input }) => {
      const { channelId, conversationId, cursor, limit } = input;

      if (!channelId && !conversationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "channelId ou conversationId requis",
        });
      }

      if (channelId && conversationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Fournir channelId ou conversationId, pas les deux",
        });
      }

      // If accessing a conversation, verify the member is a participant
      if (conversationId) {
        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_memberId: {
              conversationId,
              memberId: ctx.member.id,
            },
          },
        });

        if (!participant) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Accès non autorisé à cette conversation",
          });
        }
      }

      // If accessing a channel, verify the member is a member of that channel
      if (channelId) {
        const membership = await prisma.channelMember.findUnique({
          where: {
            channelId_memberId: {
              channelId,
              memberId: ctx.member.id,
            },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Vous n'êtes pas membre de ce channel",
          });
        }
      }

      // Fetch one extra item to determine if there are more pages
      const messages = await prisma.message.findMany({
        where: {
          ...(channelId ? { channelId } : {}),
          ...(conversationId ? { conversationId } : {}),
          // Only return top-level messages (not thread replies)
          parentId: null,
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1,
            }
          : {}),
        select: {
          id: true,
          content: true,
          channelId: true,
          conversationId: true,
          parentId: true,
          isEdited: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          _count: { select: { replies: true } },
        },
      });

      let nextCursor: string | undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return {
        messages,
        nextCursor,
      };
    }),

  /**
   * Send a message to a channel or conversation.
   */
  send: protectedProcedure
    .input(
      z.object({
        channelId: z.string().uuid().optional(),
        conversationId: z.string().uuid().optional(),
        content: z.string().min(1, "Message vide").max(4000, "Message trop long"),
        parentId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { channelId, conversationId, content, parentId } = input;
      const memberId = ctx.member.id;

      if (!channelId && !conversationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "channelId ou conversationId requis",
        });
      }

      if (channelId && conversationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Fournir channelId ou conversationId, pas les deux",
        });
      }

      // Verify channel membership and check read-only status
      if (channelId) {
        const channel = await prisma.channel.findUnique({
          where: { id: channelId },
          select: { id: true, isReadOnly: true },
        });

        if (!channel) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Channel introuvable" });
        }

        if (channel.isReadOnly) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Ce channel est en lecture seule",
          });
        }

        const membership = await prisma.channelMember.findUnique({
          where: { channelId_memberId: { channelId, memberId } },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Vous n'êtes pas membre de ce channel",
          });
        }
      }

      // Verify conversation participation
      if (conversationId) {
        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_memberId: { conversationId, memberId },
          },
        });

        if (!participant) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Accès non autorisé à cette conversation",
          });
        }
      }

      // If replying to a parent, verify the parent exists and belongs to the same channel/conversation
      if (parentId) {
        const parent = await prisma.message.findUnique({
          where: { id: parentId },
          select: { channelId: true, conversationId: true },
        });

        if (!parent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Message parent introuvable",
          });
        }

        const parentBelongs =
          (channelId && parent.channelId === channelId) ||
          (conversationId && parent.conversationId === conversationId);

        if (!parentBelongs) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Le message parent n'appartient pas à ce channel/conversation",
          });
        }
      }

      const message = await prisma.message.create({
        data: {
          channelId: channelId ?? null,
          conversationId: conversationId ?? null,
          authorId: memberId,
          content,
          parentId: parentId ?? null,
        },
        select: {
          id: true,
          content: true,
          channelId: true,
          conversationId: true,
          parentId: true,
          isEdited: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });

      return message;
    }),

  /**
   * Edit the authenticated member's own message.
   */
  edit: protectedProcedure
    .input(
      z.object({
        messageId: z.string().uuid(),
        content: z.string().min(1, "Message vide").max(4000, "Message trop long"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { messageId, content } = input;
      const memberId = ctx.member.id;

      const existing = await prisma.message.findUnique({
        where: { id: messageId },
        select: { id: true, authorId: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Message introuvable" });
      }

      if (existing.authorId !== memberId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous ne pouvez modifier que vos propres messages",
        });
      }

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: { content, isEdited: true },
        select: {
          id: true,
          content: true,
          isEdited: true,
          updatedAt: true,
        },
      });

      return updated;
    }),

  /**
   * Delete the authenticated member's own message.
   */
  delete: protectedProcedure
    .input(z.object({ messageId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { messageId } = input;
      const memberId = ctx.member.id;

      const existing = await prisma.message.findUnique({
        where: { id: messageId },
        select: { id: true, authorId: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Message introuvable" });
      }

      if (existing.authorId !== memberId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous ne pouvez supprimer que vos propres messages",
        });
      }

      await prisma.message.delete({ where: { id: messageId } });

      return { success: true };
    }),
});
