import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@kretz/db";
import { router, protectedProcedure } from "../trpc";

export const galleryRouter = router({
  listAlbums: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid().optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const { eventId, cursor, limit } = input;

      const albums = await prisma.album.findMany({
        where: {
          ...(eventId ? { eventId } : {}),
        },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { photos: true } },
          createdBy: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          event: {
            select: { id: true, title: true, startsAt: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (albums.length > limit) {
        const next = albums.pop();
        nextCursor = next!.id;
      }

      return { items: albums, nextCursor };
    }),

  getAlbum: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const album = await prisma.album.findUnique({
        where: { id: input.id },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          event: {
            select: { id: true, title: true, startsAt: true },
          },
          photos: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            include: {
              uploadedBy: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
      });

      if (!album) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Album introuvable" });
      }

      return album;
    }),

  createAlbum: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Titre requis"),
        description: z.string().optional(),
        eventId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.eventId) {
        const event = await prisma.event.findUnique({ where: { id: input.eventId } });
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Événement introuvable" });
        }
      }

      const album = await prisma.album.create({
        data: {
          title: input.title,
          description: input.description,
          eventId: input.eventId,
          createdById: ctx.member.id,
        },
      });

      return album;
    }),

  addPhoto: protectedProcedure
    .input(
      z.object({
        albumId: z.string().uuid(),
        storagePath: z.string().min(1, "Chemin de stockage requis"),
        thumbnailPath: z.string().optional(),
        caption: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const album = await prisma.album.findUnique({ where: { id: input.albumId } });

      if (!album) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Album introuvable" });
      }

      const lastPhoto = await prisma.photo.findFirst({
        where: { albumId: input.albumId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });

      const nextSortOrder = (lastPhoto?.sortOrder ?? -1) + 1;

      const photo = await prisma.photo.create({
        data: {
          albumId: input.albumId,
          storagePath: input.storagePath,
          thumbnailPath: input.thumbnailPath,
          caption: input.caption,
          uploadedById: ctx.member.id,
          sortOrder: nextSortOrder,
        },
      });

      // Set as cover photo if album has none yet
      if (!album.coverPhotoUrl) {
        await prisma.album.update({
          where: { id: input.albumId },
          data: { coverPhotoUrl: input.thumbnailPath ?? input.storagePath },
        });
      }

      return photo;
    }),
});
