import { prisma } from "@kretz/db";
import { router, protectedProcedure } from "../trpc";

export const tagRouter = router({
  list: protectedProcedure.query(async () => {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    });
    return tags;
  }),
});
