import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@kretz/db";
import { router, protectedProcedure } from "../trpc";

export const RESOURCE_CATEGORIES = [
  "Investissement",
  "Fiscalité",
  "Juridique",
  "Marché immobilier",
  "Stratégie patrimoniale",
  "Financement",
  "International",
  "Outils",
  "Autre",
];

const resourceTypeSchema = z.enum([
  "article",
  "video",
  "ebook",
  "podcast",
  "template",
  "other",
]);

const memberSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

const resourceInputSchema = z.object({
  type: resourceTypeSchema,
  title: z.string().min(1, "Titre requis").max(200),
  description: z.string().max(2000).optional().nullable(),
  url: z.string().url("URL invalide"),
  thumbnailUrl: z
    .string()
    .url("URL invalide")
    .optional()
    .nullable()
    .or(z.literal("")),
  category: z.string().min(1, "Catégorie requise"),
});

export const resourceRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        type: resourceTypeSchema.optional(),
        category: z.string().optional(),
        search: z.string().optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(30),
      })
    )
    .query(async ({ input }) => {
      const { type, category, search, cursor, limit } = input;

      const items = await prisma.resource.findMany({
        where: {
          isPublic: true,
          ...(type ? { type } : {}),
          ...(category ? { category } : {}),
          ...(search && search.trim()
            ? {
                OR: [
                  { title: { contains: search, mode: "insensitive" as const } },
                  {
                    description: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                ],
              }
            : {}),
        },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: memberSelect },
        },
      });

      let nextCursor: string | undefined;
      if (items.length > limit) {
        const next = items.pop();
        nextCursor = next!.id;
      }

      return { items, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const resource = await prisma.resource.findUnique({
        where: { id: input.id },
        include: { uploadedBy: { select: memberSelect } },
      });

      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ressource introuvable",
        });
      }

      return resource;
    }),

  create: protectedProcedure
    .input(resourceInputSchema)
    .mutation(async ({ ctx, input }) => {
      const resource = await prisma.resource.create({
        data: {
          uploadedById: ctx.member.id,
          type: input.type,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          url: input.url.trim(),
          thumbnailUrl:
            input.thumbnailUrl && input.thumbnailUrl.trim()
              ? input.thumbnailUrl.trim()
              : null,
          category: input.category,
        },
        include: { uploadedBy: { select: memberSelect } },
      });

      return resource;
    }),

  update: protectedProcedure
    .input(
      resourceInputSchema.extend({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.resource.findUnique({
        where: { id: input.id },
        select: { uploadedById: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ressource introuvable",
        });
      }

      if (existing.uploadedById !== ctx.member.id && !ctx.member.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Vous ne pouvez modifier que vos propres ressources",
        });
      }

      const updated = await prisma.resource.update({
        where: { id: input.id },
        data: {
          type: input.type,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          url: input.url.trim(),
          thumbnailUrl:
            input.thumbnailUrl && input.thumbnailUrl.trim()
              ? input.thumbnailUrl.trim()
              : null,
          category: input.category,
        },
        include: { uploadedBy: { select: memberSelect } },
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.resource.findUnique({
        where: { id: input.id },
        select: { uploadedById: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ressource introuvable",
        });
      }

      if (existing.uploadedById !== ctx.member.id && !ctx.member.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Vous ne pouvez supprimer que vos propres ressources",
        });
      }

      await prisma.resource.delete({ where: { id: input.id } });

      return { success: true };
    }),

  categories: protectedProcedure.query(() => RESOURCE_CATEGORIES),
});
