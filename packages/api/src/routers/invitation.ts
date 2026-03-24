import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@kretz/db";
import { router, protectedProcedure, adminProcedure } from "../trpc";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const invitationRouter = router({
  /**
   * Create an invitation code (admin only).
   */
  create: adminProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const code = generateCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invitation = await prisma.invitation.create({
        data: {
          code,
          email: input.email ?? null,
          invitedById: ctx.member.id,
          expiresAt,
        },
      });

      return invitation;
    }),

  /**
   * List all invitations (admin only).
   */
  list: adminProcedure.query(async () => {
    const invitations = await prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        invitedBy: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        usedBy: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    return invitations;
  }),

  /**
   * Validate an invitation code (check if valid, not used, not expired).
   */
  validate: protectedProcedure
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ input }) => {
      const invitation = await prisma.invitation.findUnique({
        where: { code: input.code },
      });

      if (!invitation) {
        return { valid: false, reason: "Code invalide" };
      }

      if (invitation.usedById) {
        return { valid: false, reason: "Code déjà utilisé" };
      }

      if (new Date() > invitation.expiresAt) {
        return { valid: false, reason: "Code expiré" };
      }

      return { valid: true, reason: null };
    }),

  /**
   * Use an invitation code.
   */
  use: protectedProcedure
    .input(z.object({ code: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await prisma.invitation.findUnique({
        where: { code: input.code },
      });

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Code invalide" });
      }

      if (invitation.usedById) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Code déjà utilisé" });
      }

      if (new Date() > invitation.expiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Code expiré" });
      }

      const updated = await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          usedById: ctx.member.id,
          usedAt: new Date(),
        },
      });

      return updated;
    }),
});
