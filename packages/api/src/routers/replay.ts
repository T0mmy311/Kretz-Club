import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@kretz/db";
import { router, protectedProcedure, adminProcedure } from "../trpc";

const replayInputSchema = z.object({
  title: z.string().min(1, "Titre requis").max(200),
  description: z.string().max(5000).optional().nullable(),
  videoUrl: z.string().url("URL vidéo invalide"),
  thumbnailUrl: z
    .string()
    .url("URL invalide")
    .optional()
    .nullable()
    .or(z.literal("")),
  duration: z.number().int().nonnegative().optional().nullable(),
  eventId: z.string().uuid().optional().nullable(),
  isPublic: z.boolean().default(true),
});

const cleanString = (v: string | null | undefined): string | null => {
  if (!v) return null;
  const t = v.trim();
  return t === "" ? null : t;
};

export const replayRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          eventId: z.string().uuid().optional(),
          cursor: z.string().uuid().optional(),
          limit: z.number().int().min(1).max(100).default(30),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const eventId = input?.eventId;
      const cursor = input?.cursor;
      const limit = input?.limit ?? 30;

      const items = await prisma.eventReplay.findMany({
        where: {
          isPublic: true,
          ...(eventId ? { eventId } : {}),
        },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: {
          event: {
            select: { id: true, title: true, startsAt: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (items.length > limit) {
        const next = items.pop();
        nextCursor = next!.id;
      }

      return { items, nextCursor };
    }),

  listAll: adminProcedure.query(async () => {
    const items = await prisma.eventReplay.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        event: { select: { id: true, title: true, startsAt: true } },
      },
    });
    return { items };
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const replay = await prisma.eventReplay.findUnique({
        where: { id: input.id },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startsAt: true,
              location: true,
            },
          },
        },
      });

      if (!replay) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Replay introuvable",
        });
      }

      return replay;
    }),

  // Increment view count - called on detail page mount
  incrementView: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const updated = await prisma.eventReplay.update({
        where: { id: input.id },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      });
      return updated;
    }),

  create: adminProcedure
    .input(replayInputSchema)
    .mutation(async ({ input }) => {
      if (input.eventId) {
        const event = await prisma.event.findUnique({
          where: { id: input.eventId },
          select: { id: true },
        });
        if (!event) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Événement lié introuvable",
          });
        }
      }

      const replay = await prisma.eventReplay.create({
        data: {
          title: input.title.trim(),
          description: cleanString(input.description),
          videoUrl: input.videoUrl.trim(),
          thumbnailUrl: cleanString(input.thumbnailUrl),
          duration: input.duration ?? null,
          eventId: input.eventId ?? null,
          isPublic: input.isPublic,
        },
      });

      return replay;
    }),

  update: adminProcedure
    .input(replayInputSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const existing = await prisma.eventReplay.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Replay introuvable",
        });
      }

      if (input.eventId) {
        const event = await prisma.event.findUnique({
          where: { id: input.eventId },
          select: { id: true },
        });
        if (!event) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Événement lié introuvable",
          });
        }
      }

      const updated = await prisma.eventReplay.update({
        where: { id: input.id },
        data: {
          title: input.title.trim(),
          description: cleanString(input.description),
          videoUrl: input.videoUrl.trim(),
          thumbnailUrl: cleanString(input.thumbnailUrl),
          duration: input.duration ?? null,
          eventId: input.eventId ?? null,
          isPublic: input.isPublic,
        },
      });

      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const existing = await prisma.eventReplay.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Replay introuvable",
        });
      }

      await prisma.eventReplay.delete({ where: { id: input.id } });

      return { success: true };
    }),
});
