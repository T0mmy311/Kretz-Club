import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "@kretz/db";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { createEventSchema } from "@kretz/shared/validators";
import { generateIcsEvent } from "@kretz/shared/utils";

export const eventRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["upcoming", "past"]).optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, cursor, limit } = input;
      const now = new Date();

      const events = await prisma.event.findMany({
        where: {
          ...(status === "upcoming"
            ? { startsAt: { gte: now }, status: { not: "cancelled" } }
            : status === "past"
            ? { startsAt: { lt: now } }
            : {}),
        },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: status === "past"
          ? { startsAt: "desc" }
          : { startsAt: "asc" },
        include: {
          _count: { select: { registrations: true } },
          registrations: {
            where: { memberId: ctx.member.id },
            select: { id: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (events.length > limit) {
        const next = events.pop();
        nextCursor = next!.id;
      }

      return { items: events, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const event = await prisma.event.findUnique({
        where: { id: input.id },
        include: {
          _count: { select: { registrations: true } },
          registrations: {
            where: { memberId: ctx.member.id },
            select: { id: true, paymentStatus: true, registeredAt: true },
          },
        },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Événement introuvable" });
      }

      const userRegistration = event.registrations[0] ?? null;

      return {
        ...event,
        registrationCount: event._count.registrations,
        userRegistration,
      };
    }),

  register: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const event = await prisma.event.findUnique({
        where: { id: input.eventId },
        include: { _count: { select: { registrations: true } } },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Événement introuvable" });
      }

      if (event.status === "cancelled") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cet événement est annulé" });
      }

      if (event.status === "past" || event.startsAt < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cet événement est passé" });
      }

      if (
        event.maxAttendees !== null &&
        event._count.registrations >= event.maxAttendees
      ) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cet événement est complet" });
      }

      const existing = await prisma.eventRegistration.findUnique({
        where: { eventId_memberId: { eventId: input.eventId, memberId: ctx.member.id } },
      });

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Vous êtes déjà inscrit à cet événement" });
      }

      const registration = await prisma.eventRegistration.create({
        data: {
          eventId: input.eventId,
          memberId: ctx.member.id,
        },
      });

      return registration;
    }),

  unregister: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const registration = await prisma.eventRegistration.findUnique({
        where: { eventId_memberId: { eventId: input.eventId, memberId: ctx.member.id } },
      });

      if (!registration) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Inscription introuvable" });
      }

      await prisma.eventRegistration.delete({
        where: { id: registration.id },
      });

      return { success: true };
    }),

  create: adminProcedure
    .input(createEventSchema)
    .mutation(async ({ ctx, input }) => {
      const event = await prisma.event.create({
        data: {
          title: input.title,
          description: input.description,
          location: input.location,
          address: input.address,
          startsAt: new Date(input.startsAt),
          endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
          price: input.price,
          maxAttendees: input.maxAttendees,
          createdById: ctx.member.id,
        },
      });

      return event;
    }),

  generateIcs: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const event = await prisma.event.findUnique({
        where: { id: input.id },
        select: {
          title: true,
          description: true,
          location: true,
          startsAt: true,
          endsAt: true,
        },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Événement introuvable" });
      }

      const icsString = generateIcsEvent({
        title: event.title,
        description: event.description ?? undefined,
        location: event.location ?? undefined,
        startsAt: event.startsAt,
        endsAt: event.endsAt ?? undefined,
      });

      return { ics: icsString };
    }),
});
