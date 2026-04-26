import { z } from "zod";
import { prisma } from "@kretz/db";
import { router, adminProcedure } from "../trpc";

export const auditRouter = router({
  /**
   * List audit logs (admin only), paginated, ordered by createdAt desc.
   * Supports optional filtering by action and/or actorId.
   */
  list: adminProcedure
    .input(
      z
        .object({
          cursor: z.string().uuid().optional(),
          limit: z.number().int().min(1).max(100).default(50),
          action: z.string().optional(),
          actorId: z.string().uuid().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const { cursor, limit, action, actorId } = input ?? { limit: 50 };

      const where: any = {};
      if (action) where.action = action;
      if (actorId) where.actorId = actorId;

      const logs = await prisma.auditLog.findMany({
        where,
        take: (limit ?? 50) + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: {
          actor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (logs.length > (limit ?? 50)) {
        const next = logs.pop();
        nextCursor = next!.id;
      }

      return { items: logs, nextCursor };
    }),
});
