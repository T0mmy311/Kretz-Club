import { z } from "zod";
import { prisma } from "@kretz/db";
import { router, protectedProcedure } from "../trpc";

export const attachmentRouter = router({
  /**
   * Get attachments for a message.
   */
  getByMessage: protectedProcedure
    .input(z.object({ messageId: z.string().uuid() }))
    .query(async ({ input }) => {
      const attachments = await prisma.attachment.findMany({
        where: { messageId: input.messageId },
        orderBy: { createdAt: "asc" },
      });

      return attachments;
    }),
});
