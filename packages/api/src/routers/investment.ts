import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@kretz/db";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { expressInterestSchema, createInvestmentSchema } from "@kretz/shared/validators";

export const investmentRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const { status, cursor, limit } = input;

      const investments = await prisma.investment.findMany({
        where: {
          ...(status ? { status: status as any } : {}),
        },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { memberInvestments: true } },
          createdBy: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (investments.length > limit) {
        const next = investments.pop();
        nextCursor = next!.id;
      }

      return { items: investments, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const investment = await prisma.investment.findUnique({
        where: { id: input.id },
        include: {
          _count: { select: { memberInvestments: true } },
          createdBy: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          memberInvestments: {
            where: { memberId: ctx.member.id },
            select: { id: true, status: true, amount: true, notes: true, createdAt: true },
          },
        },
      });

      if (!investment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Investissement introuvable" });
      }

      const userInterest = investment.memberInvestments[0] ?? null;

      return {
        ...investment,
        interestCount: investment._count.memberInvestments,
        userInterest,
      };
    }),

  expressInterest: protectedProcedure
    .input(expressInterestSchema)
    .mutation(async ({ ctx, input }) => {
      const investment = await prisma.investment.findUnique({
        where: { id: input.investmentId },
      });

      if (!investment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Investissement introuvable" });
      }

      if (investment.status === "closed" || investment.status === "cancelled") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cet investissement n'est plus disponible" });
      }

      const existing = await prisma.memberInvestment.findUnique({
        where: { investmentId_memberId: { investmentId: input.investmentId, memberId: ctx.member.id } },
      });

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Vous avez déjà exprimé votre intérêt pour cet investissement" });
      }

      const interest = await prisma.memberInvestment.create({
        data: {
          investmentId: input.investmentId,
          memberId: ctx.member.id,
          amount: input.amount,
          notes: input.notes,
        },
      });

      return interest;
    }),

  updateInterest: protectedProcedure
    .input(
      z.object({
        investmentId: z.string().uuid(),
        status: z.enum(["committed", "withdrawn"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const interest = await prisma.memberInvestment.findUnique({
        where: { investmentId_memberId: { investmentId: input.investmentId, memberId: ctx.member.id } },
      });

      if (!interest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Intérêt introuvable" });
      }

      const updated = await prisma.memberInvestment.update({
        where: { id: interest.id },
        data: { status: input.status },
      });

      return updated;
    }),

  create: adminProcedure
    .input(createInvestmentSchema)
    .mutation(async ({ ctx, input }) => {
      const investment = await prisma.investment.create({
        data: {
          title: input.title,
          description: input.description,
          location: input.location,
          targetAmount: input.targetAmount,
          minimumTicket: input.minimumTicket,
          createdById: ctx.member.id,
        },
      });

      return investment;
    }),
});
