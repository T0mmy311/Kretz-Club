import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@kretz/db";
import { router, protectedProcedure } from "../trpc";

const memberSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  profession: true,
  company: true,
  city: true,
} as const;

const createInput = z.object({
  type: z.enum(["offer", "request"]),
  category: z.string().min(1, "Catégorie requise").max(80),
  title: z.string().min(3, "Titre trop court").max(120),
  description: z.string().min(20, "Description trop courte (20 caractères min)").max(4000),
  location: z.string().max(120).optional().nullable(),
});

const updateInput = z.object({
  id: z.string().uuid(),
  type: z.enum(["offer", "request"]).optional(),
  category: z.string().min(1).max(80).optional(),
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(20).max(4000).optional(),
  location: z.string().max(120).optional().nullable(),
});

export const entraideRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        type: z.enum(["offer", "request"]).nullable().optional(),
        category: z.string().optional().nullable(),
        search: z.string().optional().nullable(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(30),
      })
    )
    .query(async ({ input }) => {
      const { type, category, search, cursor, limit } = input;

      const where: any = { isActive: true };
      if (type) where.type = type;
      if (category) where.category = category;
      if (search && search.length >= 2) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } },
        ];
      }

      const posts = await prisma.entraidePost.findMany({
        where,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: { author: { select: memberSelect } },
      });

      let nextCursor: string | undefined;
      if (posts.length > limit) {
        const next = posts.pop();
        nextCursor = next!.id;
      }
      return { items: posts, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const post = await prisma.entraidePost.findUnique({
        where: { id: input.id },
        include: { author: { select: memberSelect } },
      });
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Annonce introuvable" });
      }
      return post;
    }),

  create: protectedProcedure
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      const post = await prisma.entraidePost.create({
        data: {
          authorId: ctx.member.id,
          type: input.type,
          category: input.category,
          title: input.title,
          description: input.description,
          location: input.location ?? null,
        },
        include: { author: { select: memberSelect } },
      });
      return post;
    }),

  update: protectedProcedure
    .input(updateInput)
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.entraidePost.findUnique({
        where: { id: input.id },
        select: { authorId: true },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Annonce introuvable" });
      }
      if (existing.authorId !== ctx.member.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous ne pouvez modifier que vos propres annonces",
        });
      }

      const { id, ...data } = input;
      const post = await prisma.entraidePost.update({
        where: { id },
        data: {
          ...(data.type !== undefined ? { type: data.type } : {}),
          ...(data.category !== undefined ? { category: data.category } : {}),
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.location !== undefined ? { location: data.location } : {}),
        },
        include: { author: { select: memberSelect } },
      });
      return post;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.entraidePost.findUnique({
        where: { id: input.id },
        select: { authorId: true },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Annonce introuvable" });
      }
      if (existing.authorId !== ctx.member.id && !ctx.member.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous ne pouvez supprimer que vos propres annonces",
        });
      }
      await prisma.entraidePost.delete({ where: { id: input.id } });
      return { success: true };
    }),

  toggleActive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.entraidePost.findUnique({
        where: { id: input.id },
        select: { authorId: true, isActive: true },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Annonce introuvable" });
      }
      if (existing.authorId !== ctx.member.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Vous ne pouvez modifier que vos propres annonces",
        });
      }
      const post = await prisma.entraidePost.update({
        where: { id: input.id },
        data: { isActive: !existing.isActive },
        include: { author: { select: memberSelect } },
      });
      return post;
    }),
});
