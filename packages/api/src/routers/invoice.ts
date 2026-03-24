import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@kretz/db";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { generateInvoiceNumber } from "@kretz/shared/utils";

export const invoiceRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const invoices = await prisma.invoice.findMany({
      where: { memberId: ctx.member.id },
      orderBy: { issuedAt: "desc" },
      include: {
        event: {
          select: { id: true, title: true, startsAt: true },
        },
      },
    });

    return invoices;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const invoice = await prisma.invoice.findUnique({
        where: { id: input.id },
        include: {
          event: {
            select: { id: true, title: true, startsAt: true },
          },
          member: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Facture introuvable" });
      }

      if (invoice.memberId !== ctx.member.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès non autorisé" });
      }

      return invoice;
    }),

  create: adminProcedure
    .input(
      z.object({
        memberId: z.string().uuid(),
        eventId: z.string().uuid().optional(),
        amount: z.number().min(0, "Montant invalide"),
        taxAmount: z.number().min(0).default(0),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const member = await prisma.member.findUnique({ where: { id: input.memberId } });

      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Membre introuvable" });
      }

      if (input.eventId) {
        const event = await prisma.event.findUnique({ where: { id: input.eventId } });
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Événement introuvable" });
        }
      }

      const year = new Date().getFullYear();
      const invoiceCount = await prisma.invoice.count({
        where: { issuedAt: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) } },
      });

      const invoiceNumber = generateInvoiceNumber(year, invoiceCount + 1);
      const totalAmount = input.amount + input.taxAmount;

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          memberId: input.memberId,
          eventId: input.eventId,
          amount: input.amount,
          taxAmount: input.taxAmount,
          totalAmount,
          description: input.description,
        },
      });

      return invoice;
    }),
});
