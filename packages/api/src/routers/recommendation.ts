import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@kretz/db";
import { router, protectedProcedure } from "../trpc";
import { createRecommendationSchema } from "@kretz/shared/validators";

export const recommendationRouter = router({
  create: protectedProcedure
    .input(createRecommendationSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.toMemberId === ctx.member.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Vous ne pouvez pas vous recommander vous-même",
        });
      }

      const toMember = await prisma.member.findUnique({
        where: { id: input.toMemberId },
      });

      if (!toMember || !toMember.isActive) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Membre introuvable" });
      }

      const existing = await prisma.recommendation.findUnique({
        where: {
          fromMemberId_toMemberId: {
            fromMemberId: ctx.member.id,
            toMemberId: input.toMemberId,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Vous avez déjà rédigé une recommandation pour ce membre",
        });
      }

      const recommendation = await prisma.recommendation.create({
        data: {
          fromMemberId: ctx.member.id,
          toMemberId: input.toMemberId,
          content: input.content,
          isPublic: input.isPublic,
        },
        include: {
          fromMember: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true, profession: true },
          },
          toMember: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      return recommendation;
    }),

  listForMember: protectedProcedure
    .input(z.object({ memberId: z.string().uuid() }))
    .query(async ({ input }) => {
      const recommendations = await prisma.recommendation.findMany({
        where: {
          toMemberId: input.memberId,
          isPublic: true,
        },
        orderBy: { createdAt: "desc" },
        include: {
          fromMember: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              profession: true,
              company: true,
            },
          },
        },
      });

      return recommendations;
    }),

  delete: protectedProcedure
    .input(z.object({ recommendationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const recommendation = await prisma.recommendation.findUnique({
        where: { id: input.recommendationId },
      });

      if (!recommendation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recommandation introuvable" });
      }

      if (recommendation.fromMemberId !== ctx.member.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous ne pouvez supprimer que vos propres recommandations",
        });
      }

      await prisma.recommendation.delete({ where: { id: input.recommendationId } });

      return { success: true };
    }),
});
