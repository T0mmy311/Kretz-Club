import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@kretz/db";
import { router, adminProcedure } from "../trpc";
import { logAction } from "../lib/audit";

// ============================================
// Schemas
// ============================================

const dealStatusSchema = z.enum([
  "draft",
  "open",
  "funding",
  "funded",
  "closed",
  "cancelled",
]);

const channelCategorySchema = z.enum([
  "le_cercle",
  "le_grand_salon",
  "thematiques",
  "aide",
]);

const investmentInputSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  targetAmount: z.number().nonnegative().optional().nullable(),
  minimumTicket: z.number().nonnegative().optional().nullable(),
  status: dealStatusSchema.optional(),
  deckUrl: z.string().url().optional().nullable().or(z.literal("")),
  coverImageUrl: z.string().url().optional().nullable().or(z.literal("")),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

const eventInputSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  startsAt: z.string().min(1, "Date de début requise"),
  endsAt: z.string().optional().nullable(),
  price: z.number().min(0).default(0),
  maxAttendees: z.number().int().positive().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable().or(z.literal("")),
});

// ============================================
// Helpers
// ============================================

const cleanUrl = (v: string | null | undefined): string | null => {
  if (!v || v.trim() === "") return null;
  return v;
};

export const adminRouter = router({
  // ============================================
  // STATS / DASHBOARD
  // ============================================
  stats: adminProcedure.query(async () => {
    const [totalMembers, totalMessages, totalInvestments, totalEvents] =
      await Promise.all([
        prisma.member.count(),
        prisma.message.count(),
        prisma.investment.count(),
        prisma.event.count(),
      ]);

    return { totalMembers, totalMessages, totalInvestments, totalEvents };
  }),

  // ============================================
  // MEMBERS
  // ============================================
  listMembers: adminProcedure
    .input(
      z.object({
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const { cursor, limit } = input;

      const members = await prisma.member.findMany({
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { joinedAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          profession: true,
          company: true,
          city: true,
          isAdmin: true,
          isActive: true,
          joinedAt: true,
        },
      });

      let nextCursor: string | undefined;
      if (members.length > limit) {
        const next = members.pop();
        nextCursor = next!.id;
      }

      return { items: members, nextCursor };
    }),

  toggleMemberActive: adminProcedure
    .input(z.object({ memberId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const member = await prisma.member.findUnique({
        where: { id: input.memberId },
        select: { isActive: true, firstName: true, lastName: true, email: true },
      });

      if (!member) {
        throw new Error("Membre introuvable");
      }

      const updated = await prisma.member.update({
        where: { id: input.memberId },
        data: { isActive: !member.isActive },
      });

      await logAction(prisma, {
        actorId: ctx.member.id,
        action: updated.isActive ? "member.activate" : "member.deactivate",
        targetType: "member",
        targetId: updated.id,
        metadata: {
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
        },
      });

      return updated;
    }),

  toggleMemberAdmin: adminProcedure
    .input(z.object({ memberId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (input.memberId === ctx.member.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Vous ne pouvez pas modifier votre propre statut admin",
        });
      }

      const member = await prisma.member.findUnique({
        where: { id: input.memberId },
        select: {
          isAdmin: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Membre introuvable",
        });
      }

      const updated = await prisma.member.update({
        where: { id: input.memberId },
        data: { isAdmin: !member.isAdmin },
      });

      await logAction(prisma, {
        actorId: ctx.member.id,
        action: updated.isAdmin ? "member.promote_admin" : "member.demote_admin",
        targetType: "member",
        targetId: updated.id,
        metadata: {
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
        },
      });

      return updated;
    }),

  // ============================================
  // ANALYTICS
  // ============================================
  analytics: adminProcedure.query(async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      newMembers30d,
      newMembers7d,
      messages30d,
      messages7d,
      activeMembers7d,
      topChannels,
    ] = await Promise.all([
      prisma.member.count({ where: { joinedAt: { gte: thirtyDaysAgo } } }),
      prisma.member.count({ where: { joinedAt: { gte: sevenDaysAgo } } }),
      prisma.message.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.message.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.message.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { authorId: true },
        distinct: ["authorId"],
      }),
      prisma.channel.findMany({
        select: {
          id: true,
          displayName: true,
          _count: { select: { messages: true } },
        },
        orderBy: { messages: { _count: "desc" } },
        take: 5,
      }),
    ]);

    return {
      newMembers30d,
      newMembers7d,
      messages30d,
      messages7d,
      activeMembers7d: (activeMembers7d as any[]).length,
      topChannels: topChannels.map((c: any) => ({
        id: c.id,
        name: c.displayName,
        messageCount: c._count?.messages ?? 0,
      })),
    };
  }),

  // ============================================
  // INVESTMENTS
  // ============================================
  listInvestments: adminProcedure
    .input(
      z
        .object({
          cursor: z.string().uuid().optional(),
          limit: z.number().int().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const { cursor, limit } = input ?? { limit: 50 };

      const investments = await prisma.investment.findMany({
        take: (limit ?? 50) + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { memberInvestments: true } },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (investments.length > (limit ?? 50)) {
        const next = investments.pop();
        nextCursor = next!.id;
      }

      return { items: investments, nextCursor };
    }),

  createInvestment: adminProcedure
    .input(investmentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const investment = await prisma.investment.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          location: input.location ?? null,
          targetAmount: input.targetAmount ?? null,
          minimumTicket: input.minimumTicket ?? null,
          status: input.status ?? "draft",
          deckUrl: cleanUrl(input.deckUrl),
          coverImageUrl: cleanUrl(input.coverImageUrl),
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          createdById: ctx.member.id,
        },
      });

      await logAction(prisma, {
        actorId: ctx.member.id,
        action: "investment.create",
        targetType: "investment",
        targetId: investment.id,
        metadata: { title: investment.title },
      });

      return investment;
    }),

  updateInvestment: adminProcedure
    .input(
      investmentInputSchema.extend({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.investment.findUnique({
        where: { id: input.id },
        select: { id: true, title: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investissement introuvable",
        });
      }

      const updated = await prisma.investment.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description ?? null,
          location: input.location ?? null,
          targetAmount: input.targetAmount ?? null,
          minimumTicket: input.minimumTicket ?? null,
          status: input.status ?? "draft",
          deckUrl: cleanUrl(input.deckUrl),
          coverImageUrl: cleanUrl(input.coverImageUrl),
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
        },
      });

      await logAction(prisma, {
        actorId: ctx.member.id,
        action: "investment.update",
        targetType: "investment",
        targetId: updated.id,
        metadata: { title: updated.title },
      });

      return updated;
    }),

  deleteInvestment: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.investment.findUnique({
        where: { id: input.id },
        select: { id: true, title: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investissement introuvable",
        });
      }

      // Delete related interests first to avoid FK violation
      await prisma.memberInvestment.deleteMany({
        where: { investmentId: input.id },
      });

      await prisma.investment.delete({ where: { id: input.id } });

      await logAction(prisma, {
        actorId: ctx.member.id,
        action: "investment.delete",
        targetType: "investment",
        targetId: input.id,
        metadata: { title: existing.title },
      });

      return { success: true };
    }),

  // ============================================
  // EVENTS
  // ============================================
  listEvents: adminProcedure
    .input(
      z
        .object({
          cursor: z.string().uuid().optional(),
          limit: z.number().int().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const { cursor, limit } = input ?? { limit: 50 };

      const events = await prisma.event.findMany({
        take: (limit ?? 50) + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { startsAt: "desc" },
        include: {
          _count: { select: { registrations: true } },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (events.length > (limit ?? 50)) {
        const next = events.pop();
        nextCursor = next!.id;
      }

      return { items: events, nextCursor };
    }),

  createEvent: adminProcedure
    .input(eventInputSchema)
    .mutation(async ({ ctx, input }) => {
      const startsAt = new Date(input.startsAt);
      if (isNaN(startsAt.getTime())) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Date de début invalide",
        });
      }
      let endsAt: Date | null = null;
      if (input.endsAt && input.endsAt.trim() !== "") {
        endsAt = new Date(input.endsAt);
        if (isNaN(endsAt.getTime())) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Date de fin invalide",
          });
        }
        if (endsAt < startsAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "La date de fin doit être après la date de début",
          });
        }
      }

      const event = await prisma.event.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          location: input.location ?? null,
          address: input.address ?? null,
          startsAt,
          endsAt: endsAt ?? null,
          price: input.price,
          maxAttendees: input.maxAttendees ?? null,
          coverImageUrl: cleanUrl(input.coverImageUrl),
          status: "published",
          createdById: ctx.member.id,
        },
      });

      await logAction(prisma, {
        actorId: ctx.member.id,
        action: "event.create",
        targetType: "event",
        targetId: event.id,
        metadata: { title: event.title },
      });

      return event;
    }),

  updateEvent: adminProcedure
    .input(
      eventInputSchema.extend({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.event.findUnique({
        where: { id: input.id },
        select: { id: true, title: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Événement introuvable",
        });
      }

      const startsAt = new Date(input.startsAt);
      if (isNaN(startsAt.getTime())) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Date de début invalide",
        });
      }
      let endsAt: Date | null = null;
      if (input.endsAt && input.endsAt.trim() !== "") {
        endsAt = new Date(input.endsAt);
        if (isNaN(endsAt.getTime())) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Date de fin invalide",
          });
        }
      }

      const updated = await prisma.event.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description ?? null,
          location: input.location ?? null,
          address: input.address ?? null,
          startsAt,
          endsAt,
          price: input.price,
          maxAttendees: input.maxAttendees ?? null,
          coverImageUrl: cleanUrl(input.coverImageUrl),
        },
      });

      await logAction(prisma, {
        actorId: ctx.member.id,
        action: "event.update",
        targetType: "event",
        targetId: updated.id,
        metadata: { title: updated.title },
      });

      return updated;
    }),

  deleteEvent: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.event.findUnique({
        where: { id: input.id },
        select: { id: true, title: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Événement introuvable",
        });
      }

      // Delete related registrations and albums first
      await prisma.eventRegistration.deleteMany({
        where: { eventId: input.id },
      });
      await prisma.album.updateMany({
        where: { eventId: input.id },
        data: { eventId: null },
      });

      await prisma.event.delete({ where: { id: input.id } });

      await logAction(prisma, {
        actorId: ctx.member.id,
        action: "event.delete",
        targetType: "event",
        targetId: input.id,
        metadata: { title: existing.title },
      });

      return { success: true };
    }),

  // ============================================
  // CHANNELS
  // ============================================
  listChannels: adminProcedure.query(async () => {
    const channels = await prisma.channel.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { messages: true, members: true } },
      },
    });
    return channels;
  }),

  createChannel: adminProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(1, "Nom requis")
          .max(50)
          .regex(/^[a-z0-9-]+$/, "Lettres minuscules, chiffres et tirets uniquement"),
        displayName: z.string().min(1, "Nom d'affichage requis"),
        description: z.string().optional().nullable(),
        category: channelCategorySchema,
        sortOrder: z.number().int().default(0),
        isReadOnly: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const channel = await prisma.channel.create({
        data: {
          name: input.name,
          displayName: input.displayName,
          description: input.description ?? null,
          category: input.category,
          sortOrder: input.sortOrder,
          isReadOnly: input.isReadOnly,
        },
      });

      await logAction(prisma, {
        actorId: ctx.member.id,
        action: "channel.create",
        targetType: "channel",
        targetId: channel.id,
        metadata: { name: channel.name, displayName: channel.displayName },
      });

      return channel;
    }),

  updateChannel: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        displayName: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        sortOrder: z.number().int().optional(),
        isReadOnly: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.channel.findUnique({
        where: { id: input.id },
        select: { id: true, name: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel introuvable",
        });
      }

      const updated = await prisma.channel.update({
        where: { id: input.id },
        data: {
          ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
          ...(input.description !== undefined
            ? { description: input.description ?? null }
            : {}),
          ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
          ...(input.isReadOnly !== undefined ? { isReadOnly: input.isReadOnly } : {}),
        },
      });

      await logAction(prisma, {
        actorId: ctx.member.id,
        action: "channel.update",
        targetType: "channel",
        targetId: updated.id,
        metadata: { name: updated.name },
      });

      return updated;
    }),

  deleteChannel: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.channel.findUnique({
        where: { id: input.id },
        include: { _count: { select: { messages: true } } },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel introuvable",
        });
      }

      if (existing._count.messages > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Impossible de supprimer un channel contenant des messages. Supprimez d'abord les messages.",
        });
      }

      // Delete memberships
      await prisma.channelMember.deleteMany({ where: { channelId: input.id } });
      await prisma.channelReadStatus.deleteMany({ where: { channelId: input.id } });

      await prisma.channel.delete({ where: { id: input.id } });

      await logAction(prisma, {
        actorId: ctx.member.id,
        action: "channel.delete",
        targetType: "channel",
        targetId: input.id,
        metadata: { name: existing.name, displayName: existing.displayName },
      });

      return { success: true };
    }),

  // ============================================
  // CHANNEL STATISTICS
  // ============================================
  channelStats: adminProcedure.query(async () => {
    const channels = await prisma.channel.findMany({
      select: {
        id: true,
        displayName: true,
        category: true,
        _count: {
          select: {
            messages: true,
            members: true,
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    // Get last 7 days message count per channel
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMessages = await prisma.message.groupBy({
      by: ["channelId"],
      where: {
        channelId: { not: null },
        createdAt: { gte: sevenDaysAgo },
      },
      _count: true,
    });

    const recentByChannel = new Map(
      recentMessages.map((r) => [r.channelId, r._count])
    );

    // Get top contributors per channel
    const topContributors = await prisma.message.groupBy({
      by: ["channelId", "authorId"],
      _count: true,
      where: { channelId: { not: null } },
      orderBy: { _count: { authorId: "desc" } },
      take: 200,
    });

    const authorIds = [...new Set(topContributors.map((t) => t.authorId))];
    const authors = await prisma.member.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true },
    });
    const authorMap = new Map(authors.map((a) => [a.id, a]));

    return channels.map((c) => ({
      ...c,
      messagesLast7Days: recentByChannel.get(c.id) ?? 0,
      topContributors: topContributors
        .filter((t) => t.channelId === c.id)
        .slice(0, 3)
        .map((t) => ({
          member: authorMap.get(t.authorId) ?? null,
          messageCount: t._count,
        })),
    }));
  }),

  // ============================================
  // ALBUMS / GALLERY
  // ============================================
  listAlbums: adminProcedure.query(async () => {
    const albums = await prisma.album.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { photos: true } },
        event: { select: { id: true, title: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return albums;
  }),

  getAlbum: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const album = await prisma.album.findUnique({
        where: { id: input.id },
        include: {
          event: { select: { id: true, title: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
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

  createAlbum: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "Titre requis"),
        description: z.string().optional().nullable(),
        eventId: z.string().uuid().optional().nullable(),
        coverPhotoUrl: z.string().url().optional().nullable().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.eventId) {
        const event = await prisma.event.findUnique({
          where: { id: input.eventId },
        });
        if (!event) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Événement introuvable",
          });
        }
      }

      const album = await prisma.album.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          eventId: input.eventId ?? null,
          coverPhotoUrl: cleanUrl(input.coverPhotoUrl),
          createdById: ctx.member.id,
        },
      });

      await logAction(prisma, {
        actorId: ctx.member.id,
        action: "album.create",
        targetType: "album",
        targetId: album.id,
        metadata: { title: album.title },
      });

      return album;
    }),

  deleteAlbum: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.album.findUnique({
        where: { id: input.id },
        select: { id: true, title: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Album introuvable" });
      }

      await prisma.photo.deleteMany({ where: { albumId: input.id } });
      await prisma.album.delete({ where: { id: input.id } });

      await logAction(prisma, {
        actorId: ctx.member.id,
        action: "album.delete",
        targetType: "album",
        targetId: input.id,
        metadata: { title: existing.title },
      });

      return { success: true };
    }),

  addPhotoToAlbum: adminProcedure
    .input(
      z.object({
        albumId: z.string().uuid(),
        storagePath: z.string().min(1, "URL ou chemin requis"),
        thumbnailPath: z.string().optional().nullable(),
        caption: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const album = await prisma.album.findUnique({
        where: { id: input.albumId },
      });

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
          thumbnailPath: input.thumbnailPath ?? null,
          caption: input.caption ?? null,
          uploadedById: ctx.member.id,
          sortOrder: nextSortOrder,
        },
      });

      if (!album.coverPhotoUrl) {
        await prisma.album.update({
          where: { id: input.albumId },
          data: { coverPhotoUrl: input.thumbnailPath ?? input.storagePath },
        });
      }

      await logAction(prisma, {
        actorId: ctx.member.id,
        action: "photo.add",
        targetType: "photo",
        targetId: photo.id,
        metadata: { albumId: input.albumId, albumTitle: album.title },
      });

      return photo;
    }),

  deletePhoto: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.photo.findUnique({
        where: { id: input.id },
        select: { id: true, albumId: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Photo introuvable" });
      }

      await prisma.photo.delete({ where: { id: input.id } });

      await logAction(prisma, {
        actorId: ctx.member.id,
        action: "photo.delete",
        targetType: "photo",
        targetId: input.id,
        metadata: { albumId: existing.albumId },
      });

      return { success: true };
    }),

  // ============================================
  // MODERATION
  // ============================================
  listRecentMessages: adminProcedure
    .input(
      z
        .object({
          channelId: z.string().uuid().optional(),
          memberId: z.string().uuid().optional(),
          limit: z.number().int().min(1).max(200).default(100),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const { channelId, memberId, limit } = input ?? { limit: 100 };

      const messages = await prisma.message.findMany({
        where: {
          // Only channel messages (not DMs) for moderation list
          channelId: channelId ? channelId : { not: null },
          ...(memberId ? { authorId: memberId } : {}),
        },
        take: limit ?? 100,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          createdAt: true,
          isPinned: true,
          isEdited: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          channel: {
            select: { id: true, displayName: true, name: true },
          },
        },
      });

      return { items: messages };
    }),

  deleteAnyMessage: adminProcedure
    .input(z.object({ messageId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.message.findUnique({
        where: { id: input.messageId },
        select: {
          id: true,
          authorId: true,
          channelId: true,
          content: true,
          author: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message introuvable",
        });
      }

      // Delete dependent records
      await prisma.messageReaction.deleteMany({
        where: { messageId: input.messageId },
      });
      await prisma.messageMention.deleteMany({
        where: { messageId: input.messageId },
      });
      await prisma.attachment.deleteMany({
        where: { messageId: input.messageId },
      });
      // Re-parent replies
      await prisma.message.updateMany({
        where: { parentId: input.messageId },
        data: { parentId: null },
      });

      await prisma.message.delete({ where: { id: input.messageId } });

      await logAction(prisma, {
        actorId: ctx.member.id,
        action: "message.delete_admin",
        targetType: "message",
        targetId: input.messageId,
        metadata: {
          authorId: existing.authorId,
          authorName: existing.author
            ? `${existing.author.firstName} ${existing.author.lastName}`
            : undefined,
          channelId: existing.channelId,
          contentPreview: existing.content.slice(0, 200),
        },
      });

      return { success: true };
    }),

  pinAnyMessage: adminProcedure
    .input(z.object({ messageId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.message.findUnique({
        where: { id: input.messageId },
        select: { id: true, isPinned: true, channelId: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message introuvable",
        });
      }

      const updated = await prisma.message.update({
        where: { id: input.messageId },
        data: existing.isPinned
          ? { isPinned: false, pinnedAt: null, pinnedById: null }
          : { isPinned: true, pinnedAt: new Date(), pinnedById: ctx.member.id },
        select: { id: true, isPinned: true },
      });

      await logAction(prisma, {
        actorId: ctx.member.id,
        action: updated.isPinned ? "message.pin_admin" : "message.unpin_admin",
        targetType: "message",
        targetId: input.messageId,
        metadata: { channelId: existing.channelId },
      });

      return updated;
    }),
});
